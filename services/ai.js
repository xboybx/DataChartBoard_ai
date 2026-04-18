import OpenAI from 'openai';
import { systemPrompt } from './prompt';

const openai = new OpenAI({
    baseURL: 'https://api.clod.io/v1',
    apiKey: process.env.OPEN_ROUTER_API_KEY,
});


export const AiGeneration = async (message) => {
    const model = "GLM 4.5 Air";

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


