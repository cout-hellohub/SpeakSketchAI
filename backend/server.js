const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let conversationHistory = [];

app.post("/query", async (req, res) => {
  const { message, image } = req.body;
  const base64Data = image?.split(",")[1];

  const imagePart = base64Data
    ? {
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        }
      }
    : null;

  const parts = [];
  if (imagePart) parts.push(imagePart);
  if (message) parts.push({ text: message });

  conversationHistory.push({
    role: "user",
    parts
  });

  console.log("📩 History length:", conversationHistory.length);

  try {
    const result = await model.generateContent({
      contents: conversationHistory,
    });

    const response = await result.response;
    const replyText = response.text();

    conversationHistory.push({
      role: "model",
      parts: [{ text: replyText }]
    });

    res.json({ reply: replyText });
  } catch (err) {
    console.error("❌ Gemini API Error:", err.message);
    res.status(500).json({ reply: "❌ Failed to get response from Gemini." });
  }
});

app.post("/tts-summary", async (req, res) => {
  const { fullText } = req.body;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Here is a full message the assistant is about to show:
"""
${fullText}
"""
Now generate a short voice-friendly version that the assistant should say aloud to the user.
Keep it brief — 1 to 2 sentences max.
If the message is long, technical, or multi-step, end your reply with:
"You can also check the screen for more details."
But if the message is very short (e.g., just naming a shape or giving a quick definition), then skip that line.
Respond naturally like a helpful voice assistant.`

            }
          ]
        }
      ]
    });

    const response = await result.response;
    const speechText = response.text();
    res.json({ speechText });
  } catch (err) {
    console.error("❌ TTS Summary Error:", err.message);
    res.status(500).json({ speechText: "Here's your answer. Ask more if needed!" });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
