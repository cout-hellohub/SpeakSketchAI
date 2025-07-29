# 🗣️🎨 SpeakSketchAI

**SpeakSketchAI** is an AI-powered voice + drawing interface that brings your whiteboard sketches to life. Talk to your assistant while sketching, and receive intelligent feedback — all in real time.

> Built using Gemini Vision + Web Speech API + HTML5 Canvas

---

## 🚀 Features

- 🎨 **Interactive Whiteboard**
  - Draw with your mouse or stylus
  - Switch between pen and eraser modes
  - Clear the entire canvas anytime

- 🎙️ **Voice Recognition**
  - Speak naturally using your mic
  - Uses Chrome's Web Speech API to transcribe your speech

- 🧠 **Gemini Multimodal AI**
  - Combines your sketch and voice input
  - Powered by Google's Gemini 1.5 Flash
  - Smart voice responses with markdown support

- 🔊 **Text-to-Speech Summary**
  - AI responses are summarized and spoken back to you
  - Optimized for brief, helpful interactions

- 🧼 Simple, clean UI
  - No clutter — just sketch, speak, and interact
  - Scrollable, color-coded chat log

---

## 🖼️ Screenshots

> _Add screenshots here if needed — e.g., drawing + chat interface preview_

---

## ⚙️ Tech Stack

- **Frontend**: HTML5, CSS, JavaScript, Canvas API, Web Speech API  
- **Backend**: Node.js, Express.js  
- **AI**: Google Generative AI SDK (Gemini 1.5 Flash)  
- **TTS**: Gemini + Web Speech Synthesis

---

## 📦 Local Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/your-username/SpeakSketchAI.git
   cd SpeakSketchAI
Install backend dependencies:

bash
Copy
Edit
npm install
Configure API Key:

Rename server/.env.example to .env

Edit .env file and set your Gemini API key:

ini
Copy
Edit
GEMINI_API_KEY=your_key_here
⚠️ Make sure there are NO quotes and NO spaces

Run the backend server:

bash
Copy
Edit
node server.js
Open index.html in your browser (Chrome recommended)

📁 Folder Structure
pgsql
Copy
Edit
SpeakSketchAI/
├── index.html
├── style.css
├── main.js
├── server.js
├── server/
│   └── .env.example
❗ IMPORTANT
Run npm install in console/terminal to install all necessary node modules on your local machine.

server/.env.example is an example file — replace it with .env containing your Gemini API key that supports multimodal input.

Format for .env:

ini
Copy
Edit
GEMINI_API_KEY=your_key_here
✅ No quotes

✅ No spaces

✅ Single line only

💡 Inspiration
SpeakSketchAI was created as an experimental project blending human conversation + free-form sketching — to explore what's possible when multimodal intelligence meets intuitive interaction.
