const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const processEnv = process.env;
const PORT = processEnv.PORT ? parseInt(processEnv.PORT, 10) : 3000;

//checks if the key is present
if (!processEnv.GEMINI_API_KEY_2) {
  console.error('Missing GEMINI_API_KEY_2 in environment. Set GEMINI_API_KEY_2 in .env or environment.');
  process.exit(1);
}
const { GoogleGenAI } = require("@google/genai");
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_CONFIG = {
  thinkingConfig: {
    thinkingLevel: "LOW"
  }
};

const app = express();
// Restrict CORS to local development origins by default.
// This server also serves the frontend, so same-origin page loads do not need cross-origin access.
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (e.g., curl, native apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(bodyParser.json({ limit: "10mb" }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

const ai = new GoogleGenAI({ apiKey: processEnv.GEMINI_API_KEY_2, apiVersion: 'v1' });

// session history
const sessions = new Map();
const SESSION_IDLE_MS = processEnv.SESSION_IDLE_MS ? parseInt(processEnv.SESSION_IDLE_MS, 10) : 30 * 60 * 1000; // 30mins

function generateSessionId() {
  return 'sks_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
}

function makeSession(sessionId) {
  const obj = { history: [], lastActivity: Date.now() };
  sessions.set(sessionId, obj);
  return obj;
}

function getSession(sessionId) {
  if (!sessionId) return makeSession(generateSessionId());
  if (!sessions.has(sessionId)) return makeSession(sessionId);
  const s = sessions.get(sessionId);
  s.lastActivity = Date.now();
  return s;
}

function parseModelReply(result) {
  if (!result) return '';
  if (typeof result.text === 'string' && result.text.trim().length > 0) {
    return result.text.trim();
  }
  if (Array.isArray(result.output)) {
    for (const item of result.output) {
      if (item?.content && Array.isArray(item.content)) {
        const textItem = item.content.find(c => typeof c.text === 'string');
        if (textItem?.text) return textItem.text.trim();
      }
      if (typeof item.text === 'string' && item.text.trim().length > 0) {
        return item.text.trim();
      }
    }
  }
  if (typeof result.response?.output?.[0]?.content?.[0]?.text === 'string') {
    return result.response.output[0].content[0].text.trim();
  }
  return String(result);
}

function fallbackSpeechText(fullText) {
  const text = String(fullText || '').replace(/\s+/g, ' ').trim();
  if (!text) return "Here's your answer. Ask more if needed!";
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const summary = sentences.slice(0, 2).join(' ').trim();
  return summary.length > 240 ? `${summary.slice(0, 237).trim()}...` : summary;
}

// pruining stale session history
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.lastActivity > SESSION_IDLE_MS) {
      sessions.delete(id);
      console.log(`Pruned session ${id} due to inactivity.`);
    }
  }
}, Math.min(60_000, Math.floor(SESSION_IDLE_MS / 6)));

app.post("/query", async (req, res) => {
  let { message, image, sessionId } = req.body || {};
  if (!message && !image) return res.status(400).json({ error: 'Missing message or image in request' });

  if (!sessionId) {
    sessionId = generateSessionId();
    console.warn('No sessionId provided; created a new session for the request.');
  }

  const session = getSession(sessionId);
  if (!session) return res.status(400).json({ error: 'Invalid session' });

  // image base64 data
  const base64Data = image?.split(',')[1] || null;

  const currentParts = [];
  if (message) currentParts.push({ text: message });
  if (base64Data) {
    currentParts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
  }

  try {
    // Prepare the contents to send to Gemini: prepend a system instruction, include the session history but strip any inlineData
    const SYSTEM_PROMPT = `You are a warm, encouraging tutor. Offer constructive, friendly guidance, and suggest simple next steps appropriate for a student. You are ready to welcome any questions, doubts, or a simple chat if the student asks for it. Do not ask further engagement questions.

  Format responses using clear, standard Markdown because the client renders it as a safe, readable chatbot message. Use headings, bold or italic emphasis, bullets, numbered steps, links, blockquotes, tables, and fenced code blocks when they improve readability. For mathematics, show the solution line by line and explain each step briefly. Keep responses concise, clear, encouraging, and easy to read aloud. Do not include unsafe HTML or execute code.`;

    // Convert session.history to safe copy for sending (do not include inlineData stored anywhere)
    const historyForModel = session.history.map(h => {
      const roleUpper = (h.role === 'user') ? 'USER' : (h.role === 'model' ? 'MODEL' : String(h.role).toUpperCase());
      return { role: roleUpper, parts: h.parts.map(p => ({ text: p.text })) };
    });

    // Attach the current user turn with the actual image (if present)
    // Use API-expected role names: 'USER' and 'MODEL'
    const sendContents = base64Data
      ? [...historyForModel, { role: 'USER', parts: currentParts }]
      : message;

    // Use the genai client to request the model directly. Pass the system prompt
    // via the `systemInstruction` field (v1 expects systemInstruction, not a
    // content item with role 'system').
    let result;
    result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
      contents: sendContents,
      config: GEMINI_CONFIG,
    });

    // The genai client returns a result with a `text` property
    const replyText = parseModelReply(result);

    // Save the model reply to session history (text only)
    const storedUserParts = [];
    if (message) storedUserParts.push({ text: message });
    if (base64Data) storedUserParts.push({ text: '[image omitted]' });
    session.history.push({ role: 'user', parts: storedUserParts });
    session.history.push({ role: 'model', parts: [{ text: replyText }] });

    // Update session activity
    session.lastActivity = Date.now();

    res.json({ reply: replyText, sessionId });
  } catch (err) {
    const errMsg = (err && err.message) ? err.message : String(err);
    console.error("❌ Gemini API Error:", err);
    // Detect common API key problems and return a clear status
    if (errMsg && (errMsg.includes('API key expired') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key'))) {
      return res.status(401).json({ reply: '❌ Gemini API key invalid or expired. Please update GEMINI_API_KEY_2 on the server.', error: errMsg });
    }

    // Model not found / version mismatch - include underlying error for debugging
    if (errMsg && (errMsg.includes('not found') || errMsg.includes('not supported') || errMsg.includes('is not found'))) {
      return res.status(400).json({ reply: '❌ Requested Gemini model not available for this API version. Check model name and SDK version.', error: errMsg, raw: String(err) });
    }

    // Other errors
    res.status(500).json({ reply: "❌ Failed to get response from Gemini.", error: errMsg, raw: String(err) });
  }
});

app.post("/tts-summary", async (req, res) => {
  const { fullText, sessionId } = req.body || {};

  // update session activity if sessionId provided
  if (sessionId) {
    const s = getSession(sessionId);
    if (s) s.lastActivity = Date.now();
  }

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "USER",
          parts: [
            {
              text: `Here is a full message the assistant is about to show:\n"""\n${fullText}\n"""\nNow generate a short voice-friendly version that the assistant should say aloud to the user.\nKeep it brief — 1 to 2 sentences max.\nIf the message is long, technical, or multi-step, end your reply with:\n"You can also check the screen for more details."\nBut if the message is very short (e.g., just naming a shape or giving a quick definition), then skip that line.\nRespond naturally like a helpful voice assistant.`
            }
          ]
        }
      ],
      config: GEMINI_CONFIG
    });

    const speechText = parseModelReply(result) || "Here's your answer. Ask more if needed!";
    res.json({ speechText });
  } catch (err) {
    console.error("❌ TTS Summary Error:", err.message || err);
    res.json({ speechText: fallbackSpeechText(fullText), fallback: true });
  }
});

app.post('/session/reset', (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`Session ${sessionId} reset by request.`);
  }
  const newSessionId = generateSessionId();
  makeSession(newSessionId);
  res.json({ sessionId: newSessionId });
});

app.get('/session/status', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required.' });
  }
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  res.json({ sessionId, lastActivity: session.lastActivity, historyLength: session.history.length });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Server error encountered.', details: err?.message || String(err) });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
