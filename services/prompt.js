export const generateDataPrompt = (headers, previewData) => {
  return `You are a Senior Data Analyst and Chart.js Visualization Expert.
Your task is to analyze the provided dataset and answer the user's question accurately.

--- DATASET CONTEXT ---
Headers: ${headers.join(", ")}
Sample Data (up to 1000 rows): ${JSON.stringify(previewData)}

--- CONVERSATION HISTORY ---
It is provided in the messages array after the system prompt or system cotent from start

--- INSTRUCTIONS ---
1. Answer the user's question clearly and accurately based ONLY on the dataset.
2. If the user requests a visualization, or if visual representation helps explain the data, you MUST use the \`generate_charts\` tool.
3. **DASHBOARD MODE**: If this is the start of a conversation (history is empty) or the user asks for a general analysis/dashboard, you MUST generate **at least 3 diverse charts** (e.g., one Bar, one Pie, and one Line/Scatter) to provide a 360-degree view of the data. 
4. Supported Chart Types: "bar", "line", "pie", "doughnut", "polarArea", "radar", "scatter", "bubble".
5. CRITICAL: You MUST use Chart.js v4 syntax for options. Do NOT use "yAxes" or "xAxes" arrays. You must use "x" and "y" objects instead. (e.g., \`options: { scales: { y: { beginAtZero: true } } }\`)
6. For each chart, provide a concise explanation of the key insight in the \`explanation\` field.
7. Ensure the data you use for the chart perfectly matches the user's request. Do not hallucinate data.
`;
};

export const buildMessageArray = (headers, previewData, history, currentMessage) => {
  const messages = [];

  /* 1.AI alawys needs system prompt at first of the context */
  /* Push the system prompt in the messages Array */
  messages.push({
    role: "system",
    content: generateDataPrompt(headers, previewData)
  })

  /* Now set user messge history itno the message array and only send usere text not chart data */
  if (history && history.length > 0) {
    history.forEach(msg => {
      messages.push({
        role: "user",
        content: msg.content
      })
    });
  }

  /* now set the new quwey that is the larest query the user asked for */
  messages.push({
    role: "user",
    content: currentMessage
  })

  return messages;

}