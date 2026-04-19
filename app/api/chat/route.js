import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Dataset from "@/models/Dataset";
import { AiGeneration } from "@/services/ai";
import { buildMessageArray } from "../../../services/prompt";
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

        //1.fetch the dataset, input ot message
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

        /* 2.Create a new Document to push to db */
        const newChat = await Chat.create({
            userId: session.user.id,
            datasetId,
            title: message.substring(0, 30) + "..." // Fixed typo to 'title'
        })

        /*3.build Message array  */
        const messagesArray = buildMessageArray(
            dataset.headers,
            dataset.previewData,
            [], // Empty history
            message
        );

        /* 4.Save this user message cam from frontend to db */
        await Message.create({
            chatId: newChat._id,
            role: "user",
            content: message
        })

        console.log("generating prompt with prompt and the context")



        /*5. Send the data to ai , with the build message arrary*/
        let aiResponseRaw;
        try {
            aiResponseRaw = await AiGeneration(messagesArray);
            console.log("The ai respnse Before building charts data: ", aiResponseRaw)
        } catch (aiError) {
            console.error("🔎 [START ROUTE] AI Error Detection:", aiError.status);
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

        if (!aiResponseRaw) { return NextResponse.json({ error: "AI failed to respond. Check server logs." }, { status: 500 }); }
        let analysis = "Here is your Analysis: ";
        let chart = [];


        //6.Check weather ai decided to call the "Generate_charts" Tool
        if (aiResponseRaw.tool_calls && aiResponseRaw.tool_calls.length > 0) {
            console.log(`🛠️ [START ROUTE] AI requested ${aiResponseRaw.tool_calls.length} tool calls.`);

            for (const toolCall of aiResponseRaw.tool_calls) {
                const functionName = toolCall.function.name;
                console.log(`🔧 [START ROUTE] Executing logical tool: ${functionName}`);

                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`📦 [START ROUTE] Parsed Arguments for ${functionName}:`, {
                        chartsCount: args.charts?.length,
                        hasAnalysis: !!args.analysis
                    });

                    switch (functionName) {
                        case "generate_charts":
                            analysis = args.analysis || "Analysis complete.";
                            chart = args.charts || [];
                            console.log("📊 [START ROUTE] Successfully extracted chart data.");
                            break;

                        default:
                            console.log('⚠️ [START ROUTE] Unknown Tool Call', functionName);
                    }

                } catch (error) {
                    console.error("❌ [START ROUTE] Error parsing tool arguments: ", error);
                    return NextResponse.json({ message: "Calling Tool Failed" }, { status: 400 });
                }
            }
        } else if (aiResponseRaw.content) {
            console.log("💬 [START ROUTE] AI responded with plain text only.");
            analysis = aiResponseRaw.content;
            chart = [];
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
        console.error("Create Chat API Error:", error.message);
        return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
    }
}