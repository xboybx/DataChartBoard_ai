import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Dataset from "@/models/Dataset";
import { AiGeneration } from "@/services/ai";
import { generateDataPrompt } from "@/services/prompt";

// GET: Fetch message history for a specific chat ID
export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { chatId } = await params;

        // 1. Verify the chat belongs to the user
        const activeChat = await Chat.findOne({ _id: chatId, userId: session.user.id })
            .populate('datasetId', 'fileName fileUrl header');

        if (!activeChat) {
            return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
        }

        // 2. Fetch all messages for this chat
        const messages = await Message.find({ chatId })
            .sort({ createdAt: 1 }); // Oldest to newest

        return NextResponse.json({
            chat: activeChat,
            messages
        }, { status: 200 });

    } catch (error) {
        console.error("Get Chat Messages Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Send a new message to an existing chat ID
export async function POST(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { chatId } = await params;
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Missing message" }, { status: 400 });
        }

        // 1. Find Chat Thread and ensure ownership
        const activeChat = await Chat.findOne({ _id: chatId, userId: session.user.id });

        if (!activeChat) {
            return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
        }

        // 2. Fetch Dataset for context
        const dataset = await Dataset.findOne({ _id: activeChat.datasetId, userId: session.user.id });
        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        // 3. Save new User Message
        await Message.create({
            chatId: activeChat._id,
            role: "user",
            content: message
        });

        // 4. Fetch Conversation History to send to AI
        const pastMessages = await Message.find({ chatId: activeChat._id })
            .sort({ createdAt: -1 })
            .limit(10);

        pastMessages.reverse();

        let conversationHistoryStr = pastMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

        // 5. Prepare AI Context using central service
        const contextPrompt = generateDataPrompt(dataset.headers, dataset.previewData, message, conversationHistoryStr);

        // 6. Build AI Response
        const aiResponseRaw = await AiGeneration(contextPrompt);

        if (!aiResponseRaw) {
            return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
        }

        let analysis, chart;

        try {
            if (!aiResponseRaw.content || typeof aiResponseRaw.content !== "string") {
                throw new Error("AI returned empty or invalid content format");
            }

            // Clean the AI response by removing markdown and trimming whitespace
            const jsonStringMatch = aiResponseRaw.content.match(/\{[\s\S]*\}/);

            if (!jsonStringMatch) throw new Error("No JSON object found in response");

            const aiJson = JSON.parse(jsonStringMatch[0]);

            analysis = aiJson?.analysis || "Visualization generated successfully.";
            chart = aiJson.chart || null;

        } catch (e) {
            console.error("Error parsing AI JSON response:", e, "Original content:", aiResponseRaw?.content);
            // Fallback: If parsing fails, use the raw content as analysis (unless it's literally "null") and assume no chart
            const rawContent = aiResponseRaw?.content?.trim();
            analysis = (rawContent && rawContent !== "null")
                ? rawContent
                : "The AI was not able to generate a formatted response for this query. Please try rephrasing.";
            chart = null;
        }

        // Ensure content is not empty for the database
        if (!analysis) {
            analysis = "Here is the visualization based on your request.";
        }

        // 8. Save Assistant Message
        const assistantMessage = await Message.create({
            chatId: activeChat._id,
            role: "assistant",
            content: analysis,
            chartData: chart
        });

        return NextResponse.json({
            chatId: activeChat._id,
            response: assistantMessage.content,
            chartData: assistantMessage.chartData
        }, { status: 200 });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a chat and its messages
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { chatId } = await params;

        // 1. Find the chat to ensure it belongs to the user
        const chat = await Chat.findOne({ _id: chatId, userId: session.user.id });
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        // 2. Delete all messages associated with the chat
        await Message.deleteMany({ chatId: chatId });

        // 3. Delete the chat itself
        await Chat.deleteOne({ _id: chatId });

        return NextResponse.json({ message: "Chat deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Delete Chat Error:", error);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}