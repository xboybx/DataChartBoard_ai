import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Dataset from "@/models/Dataset";
import { AiGeneration } from "@/services/ai";
import { generateDataPrompt } from "@/services/prompt";

//Get Chats Route
export async function GET(req) {
    try {
        //first chaeck is user authenticated or not
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        //connect to Db
        await dbConnect();

        //find all the chats of the logged in user

        const chats = await Chat.find({ userId: session.user.id })//comes from nextaauth when loggedIN
            .sort({ createdAt: -1 })
            .populate("datasetId", "filename");

        if (!chats) {
            return NextResponse.json({ message: `No chats Found of the User ${session.user.name}` })
        }

        return NextResponse.json({ chats }, { status: 200 })

    } catch (error) {
        console.error("Fetch Chats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }




}

/* To Create a new Chat Dynamically when user gives a input and a dataset
1.when user gives a input
2.then a new chat is created and sent to ai and then saved to datbase
*/
export async function POST(req) {
    try {
        //check if the user is loggedinoor not

        const session = await getServerSession(authOptions)
        if (!session) {
            console.log("User is not authenticated to create a chat")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        //fetch the dataset, input ot message
        /* This input or message will come from front chat input
        This dataset Id comes ,when we upload a file, it hits the upload engine Route
        and creates a new doc in db and that gives the datasetId
        */
        const { datasetId, message } = await req.json();

        if (!datasetId || !message) {
            return NextResponse.json({ error: "Missing datasetId or message" }, { status: 400 });
        }

        // 1. Fetch Dataset for context
        const dataset = await Dataset.findOne({ _id: datasetId, userId: session.user.id });
        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        /* Create a new Document to push to db */
        const newChat = await Chat.create({
            userId: session.user.id,
            datasetId,
            title: message.substring(0, 30) + "..." // Fixed typo to 'title'
        })

        /* Save this user message cam from frontend to db */
        await Message.create({
            chatId: newChat._id,
            role: "user",
            content: message
        })

        console.log("generating prompt with prompt and the context")
        /* Prepare AI Context using central service */
        const contextPrompt = generateDataPrompt(dataset.headers, dataset.previewData, message);

        if (!contextPrompt) {
            console.log("Error in Prompt Generation");
            throw new Error("Error in Generation context ai prompt")
        }
        console.log(" Prompt Generated");


        /* Send the data to ai , The parsed and the users query */
        const aiResponseRaw = await AiGeneration(contextPrompt);//This prompt is appended in usermessage
        console.log("The ai respnse Before bukding charts data: ", aiResponseRaw)

        if (!aiResponseRaw) { return NextResponse.json({ error: "AI failed to respond. Check server logs for API errors." }, { status: 500 }); }

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

            console.log("analysis data extracted sucess: ", analysis)
            console.log("Chart data extracted sucess: ", chart)

        } catch (e) {
            console.error("Error parsing AI JSON response:", e, "Original content:", aiResponseRaw.content);
            // Fallback: If parsing fails, use the raw content as analysis and assume no chart
            analysis = aiResponseRaw.content;
            chart = null;
        }

        // Ensure content is not empty for the database
        if (!analysis) {
            analysis = "Here is the visualization based on your request:";
        }

        // 7. Save Assistant Message
        const assistantMessage = await Message.create({
            chatId: newChat._id,
            role: "assistant",
            content: analysis,
            chartData: chart
        });

        return NextResponse.json({
            chatId: newChat._id,
            response: assistantMessage.content,
            chartData: assistantMessage.chartData
        }, { status: 201 });

    }
    catch (error) {
        console.error("Create Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}