import OpenAI from 'openai';
import { systemPrompt } from './prompt';

const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.Groq_api_Key,
});


export const AiGeneration = async (message) => {
    const model = process.env.GROQ_MODEL_NAME || "llama-3.3-70b-versatile";

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
            ]
        });

        return completion.choices[0].message;

    } catch (err) {
        console.error("Error occurred while generating response:", err);
        return null;
    }
}


