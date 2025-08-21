// netlify/functions/gemini-proxy.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }

    try {
        // Get the API key from Netlify Environment Variables
        const apiKey = process.env.GEMINI_API_KEY; // This matches the Key name you'll set in Netlify

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "API Key not configured in Netlify environment variables." }),
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

        const { prompt, chatHistory } = JSON.parse(event.body);

        // Construct contents for the Gemini API call
        const contents = chatHistory || [{ role: "user", parts: [{ text: prompt }] }];

        // If chatHistory is provided, the prompt is already part of it.
        // If only a new prompt is provided, start a new conversation.
        if (!chatHistory || chatHistory.length === 0) {
             contents.push({ role: "user", parts: [{ text: prompt }] });
        }


        const result = await model.generateContent({ contents: contents });
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text }),
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error communicating with AI service.", error: error.message }),
        };
    }
};
