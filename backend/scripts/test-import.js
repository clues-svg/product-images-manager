try {
  const { GoogleGenAI } = require("@google/genai");
  console.log("Require successful");
} catch (e) {
  console.error("Require failed:", e.message);
}
