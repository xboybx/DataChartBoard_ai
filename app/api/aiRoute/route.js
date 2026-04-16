import { NextResponse } from "next/server";
import { AiGeneration } from "../../../services/ai.js"


export async function POST(req) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const result = await AiGeneration(message);

        if (!result) {
            return NextResponse.json({ error: "AI was not able to generate, try again!" }, { status: 500 });
        }

        const Final_AI_RESPONSE = result.content
        return NextResponse.json({
            message: "AI result generated",
            aiResult: Final_AI_RESPONSE
        }, { status: 200 });

    } catch (error) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}