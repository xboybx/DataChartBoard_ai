import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Dataset from "@/models/Dataset";
import { AiGeneration } from "@/services/ai";
import { buildMessageArray } from "@/services/prompt";

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

        /* 3. Fetch History correctly (Before saving current message to avoid duplicates) */
        const history = await Message.find({ chatId }).sort({ createdAt: 1 }).limit(10);
        console.log(`📜 [EXISTING ROUTE] Fetched ${history.length} messages for context.`);

        /* 4. Build the structured messagesArray */
        const messagesArray = buildMessageArray(
            dataset.headers,
            dataset.previewData,
            history,
            message
        );

        /* 5. Save current user message to DB */
        await Message.create({ chatId, role: "user", content: message });

        // 6. Build AI Response
        let aiResponseRaw;
        try {
            aiResponseRaw = await AiGeneration(messagesArray);
        } catch (aiError) {
            console.error("🔎 [EXISTING ROUTE] AI Error Detection:", aiError.status);
            if (aiError.status === 429) {
                // Extract the raw message from the provider (e.g. Groq details)
                const providerMessage = aiError.error?.message || aiError.message || "Rate limit reached.";
                return NextResponse.json({ 
                    error: providerMessage,
                    code: "RATE_LIMIT_EXCEEDED"
                }, { status: 429 });
            }
            throw aiError; // Pass to general handler
        }

        if (!aiResponseRaw) {
            return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
        }

        let analysis = "Analysis complete.";
        let chart = [];

        // 7. Tool call extraction with detailed logging
        if (aiResponseRaw.tool_calls && aiResponseRaw.tool_calls.length > 0) {
            console.log(`🛠️ [EXISTING ROUTE] AI triggered ${aiResponseRaw.tool_calls.length} tools.`);

            for (const toolCall of aiResponseRaw.tool_calls) {
                const functionName = toolCall.function.name;
                console.log(`🔧 [EXISTING ROUTE] Parsing: ${functionName}`);

                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`📦 [EXISTING ROUTE] Insights from AI:`, args.analysis?.substring(0, 50) + "...");

                    if (functionName === "generate_charts") {
                        analysis = args.analysis || analysis;
                        chart = args.charts || [];
                        console.log(`📊 [EXISTING ROUTE] Extracted ${chart.length} charts.`);
                    }
                } catch (error) {
                    console.error("❌ [EXISTING ROUTE] JSON Parse Error:", error);
                }
            }
        } else if (aiResponseRaw.content) {
            console.log("💬 [EXISTING ROUTE] AI response was plain text.");
            analysis = aiResponseRaw.content;
        }

        // 8. Save Assistant Message
        const assistantMessage = await Message.create({
            chatId: activeChat._id,
            role: "assistant",
            content: analysis,
            chartData: chart
        });

        console.log("🏁 [EXISTING ROUTE] Finished. Returning to client.");

        return NextResponse.json({
            chatId: activeChat._id,
            response: assistantMessage.content,
            chartData: assistantMessage.chartData
        }, { status: 200 });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
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