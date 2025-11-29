const { GoogleGenAI } = require("@google/genai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found in .env");
    return;
  }

  console.log("Initializing GoogleGenAI with key ending in...", apiKey.slice(-4));
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    console.log("Attempting to generate content with gemini-2.5-flash-image...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ text: "Test connection" }],
    });
    console.log("Success!");
    console.log(response);
  } catch (error) {
    console.error("GenAI Error:", error);
    if (error.cause) {
        console.error("Cause:", error.cause);
    }
  }
}

testGenAI();
