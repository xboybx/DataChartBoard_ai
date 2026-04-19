/**
 * HOW THIS TOOL CALL WORKS (The Logical Flow):
 * -------------------------------------------
 * 1. THE TRIGGER: 
 *    You send the 'messagesArray' (History + User Query like "Calculate Revenue").
 *    Along with this, the AI sees the 'generate_charts' schema available in its toolbox.
 * 
 * 2. THE CALCULATION:
 *    The LLM reads your dataset. It calculates the actual numbers (like total Revenue per month) 
 *    internally. It doesn't use a separate calculator; it calculates this as part of its reasoning.
 * 
 * 3. THE SCHEMA MATCHING:
 *    Now the AI knows it should create charts. It looks at the "generateChartsSchema" 
 *    blueprint to see exactly what format we need. 
 * 
 * 4. THE PAYLOAD GENERATION:
 *    Instead of just talking to you, the AI "calls" the tool by generating the data 
 *    required for the charts (type, analysis, numbers) and stuffs that ENTIRE data 
 *    object into the 'tool_call' function arguments.
 * 
 * 5. THE EXTRACTION:
 *    The AI passes us this formatted JSON string via the API. Our code then takes 
 *    those 'args' (arguments), parses them, and gets the exact numbers/charts 
 *    the AI calculated for us.
 * 
 * (Essentially: The AI sees the schema -> does the math -> puts the math into the schema slots 
 * -> hands us the finished JSON in the arguments).
 */

export const generateChartsSchema = {
    name: "generate_charts",
    description: "Generates a comprehensive dashboard with multiple Chart.js configurations based on the dataset. Use this to provide 360-degree data insights using at least 2-3 charts of different types.",
    parameters: {
        type: "object",//the reaponse that i gives is object type
        properties: {
            analysis: {
                type: "string",
                description: "A clear, accurate textual analysis to present to the user.",
            },
            charts: {
                type: "array",
                description: "An array of one or more chart configurations.",
                items: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            enum: ["bar", "line", "pie", "doughnut", "polarArea", "radar", "scatter", "bubble"]
                        },
                        explanation: {
                            type: "string",
                            description: "A short, 1-2 sentence explanation of what this specific chart represents and its key insights."
                        },
                        options: {
                            type: "object",
                            description: "Standard Chart.js options (e.g., titles, scales). Use Chart.js v4 syntax only (e.g., replace 'yAxes' with 'y' and 'xAxes' with 'x')."
                        },
                        data: {
                            type: "object",
                            properties: {
                                labels: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "X-axis labels. Required for bar, line, pie, etc. Leave empty for scatter or bubble."
                                },
                                datasets: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            label: { type: "string" },
                                            data: {
                                                type: "array",
                                                description: "Data points. Can be numbers [10, 20] OR objects [{x:10, y:20, r:5}] for scatter/bubble."
                                            },
                                            backgroundColor: { type: "array", items: { type: "string" } },
                                            borderColor: { type: "array", items: { type: "string" } },
                                            fill: { type: "boolean" },
                                            tension: { type: "number" }
                                        },
                                        required: ["label", "data"]
                                    }
                                }
                            },
                            required: ["datasets"]
                        }
                    },
                    required: ["type", "data", "explanation"]
                }
            }
        },
        required: ["analysis", "charts"]
    }
};

// Export all available tools nicely bundled
export const standardTools = [
    { type: "function", function: generateChartsSchema }
];
