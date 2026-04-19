import OpenAI from 'openai';
import { systemPrompt } from './prompt';
import { standardTools } from './tools';

const openai = new OpenAI({
    baseURL: process.env.CLOD_BASE_URL,
    apiKey: process.env.CLOD_API_KEY,
});


export const AiGeneration = async (message) => {

    const model = "Qwen 3 235B A22B Thinking 2507";

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ],
            tools: standardTools,
            tool_choice: "auto" // The model decides whether to talk normally or use the charting 
        });

        return completion.choices[0].message;

    } catch (err) {
        console.error("Error occurred while generating response:", err);
        return null;
    }
}


