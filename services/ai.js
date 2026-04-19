import OpenAI from 'openai';
import { standardTools } from './tools';

const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.Groq_api_Key,
});


export const AiGeneration = async (messagesArray) => {

    const model = process.env.GROQ_MODEL_NAME


    try {
        console.log("📡 [AI SERVICE] Sending payload to LLM...");
        console.log(`💬 [AI SERVICE] Messages in context: ${messagesArray.length}`);

        const completion = await openai.chat.completions.create({
            model: model,
            messages: messagesArray,
            tools: standardTools,
            tool_choice: "auto" // The model decides whether to talk normally or use the charting 
        });

        const response = completion.choices[0].message;
        console.log("✅ [AI SERVICE] Response received from LLM.");
        return response;

    } catch (err) {
        console.error("❌ [AI SERVICE] Error during LLM call:", err.message);
        
        // Throw the error so the API Route can catch the status code (e.g. 429 for rate limit)
        throw err;
    }
}


