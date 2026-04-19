export const generateChartsSchema = {
    name: "generate_charts",
    description: "Generates one or multiple Chart.js configurations based on the dataset. Use this when the user asks for a chart or visualization.",
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
