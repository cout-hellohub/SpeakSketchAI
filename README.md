# 🎨 SpeakSketchAI

> Your very own vector-based AI search platform with creative and educational modes

## 🚀 Quick Start

### Option 1: One-Click Startup (Windows)
1. Double-click `start-backend.bat`
2. Open `test.html` in your browser to verify everything works
3. Navigate to `frontend/index.html` to start using the app

### Option 2: Manual Startup

#### Start Backend Server
```bash
cd backend
npm install
node server.js
```

#### Open Frontend
Open any of these files in your browser:
- `test.html` - System integration test
- `frontend/index.html` - Landing page
- `frontend/tools.html` - Tools selection
- `frontend/creative_explore.html` - Creative mode
- `frontend/education_explore.html` - Education mode

## ✨ Features

### 🎨 Creative Mode
- **AI-Powered Creativity**: Draw sketches and get creative interpretations
- **Voice Input**: Speak your ideas naturally
- **Smart Responses**: AI understands context from both images and text
- **Text-to-Speech**: Hear AI responses spoken aloud

### 📚 Education Mode
- **AI Tutor**: Get step-by-step explanations
- **Formula Analysis**: Draw diagrams or formulas and ask questions
- **Interactive Learning**: Voice and text input supported
- **Educational Context**: Tailored responses for learning

### 🛠️ Drawing Tools
- Pen and eraser modes
- Clear canvas
- Undo/redo (creative mode)
- Real-time drawing
- Canvas export

### 🎙️ Voice Features
- Speech-to-text input
- Text-to-speech output
- Smart summary generation
- Visual feedback

## 📋 Requirements

- **Node.js**: v14 or higher
- **Browser**: Chrome or Edge (recommended for full Web Speech API support)
- **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/apikey)

## 🔧 Configuration

The backend is already configured with an API key. If you need to change it:

1. Edit `backend/.env`
2. Replace the `GEMINI_API_KEY` value
3. Restart the backend server

## 📁 Project Structure

```
SpeakSketchAI/
├── backend/                   # Backend server
│   ├── server.js             # Express + Gemini AI
│   ├── package.json          # Dependencies
│   └── .env                  # API keys
├── frontend/                 # PRIMARY FRONTEND ⭐
│   ├── index.html            # Landing page
│   ├── tools.html            # Tools selection
│   ├── creative_explore.html # Creative mode UI
│   ├── creative_explore.js   # Creative mode logic
│   ├── education_explore.html# Education mode UI
│   ├── education_explore.js  # Education mode logic
│   ├── contact.html          # Contact page
│   ├── style.css             # Global styles
│   ├── icons/                # UI icons
│   └── fonts/                # Custom fonts
├── start-backend.bat         # Windows startup script
├── start-backend.sh          # Linux/Mac startup script
├── test.html                 # Integration test page
└── INTEGRATION_README.md     # Detailed documentation
```

## 🧪 Testing

Run the integration test to verify all systems are working:

1. Start the backend server
2. Open `test.html` in your browser
3. Click "Run Integration Tests"

The test will verify:
- ✅ Backend server connectivity
- ✅ Gemini AI API
- ✅ TTS summary generation
- ✅ Speech recognition support
- ✅ Canvas drawing capabilities

## 🎯 Usage Examples

### Creative Mode
1. Open `page_design/creative_explore.html`
2. Draw something on the canvas
3. Type or speak: "Turn this into a story about a space adventure"
4. Get AI-generated creative content
5. Hear the response read aloud

### Education Mode
1. Open `page_design/education_explore.html`
2. Draw a diagram or formula
3. Type or speak: "Explain this concept step by step"
4. Get educational explanations
5. Continue the conversation naturally

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F

# Restart
node backend/server.js
```

### API errors
- Verify `backend/.env` has a valid `GEMINI_API_KEY`
- Check backend console for error details
- Ensure you have internet connectivity

### Frontend not connecting
- Confirm backend is running on `http://localhost:3000`
- Check browser console for errors
- Clear browser cache and reload

### Speech recognition not working
- Use Chrome or Edge browser
- Allow microphone permissions
- Ensure page is served over HTTPS or localhost

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Drawing | ✅ | ✅ | ✅ | ✅ |
| AI Query | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited |
| TTS | ✅ | ✅ | ✅ | ✅ |

**Best Experience**: Chrome or Edge

## 📚 API Endpoints

### POST /query
Send a text prompt with optional image context.

**Request:**
```json
{
  "message": "Your question here",
  "image": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "reply": "AI's response"
}
```

### POST /tts-summary
Generate voice-friendly summary.

**Request:**
```json
{
  "fullText": "Long text to summarize"
}
```

**Response:**
```json
{
  "speechText": "Concise spoken version"
}
```

## 🚧 Known Limitations

1. **Speech Recognition**: Full support only in Chrome/Edge
2. **Image Size**: Large images may take longer to process
3. **Conversation History**: Stored in memory, resets on page reload
4. **Mobile**: Touch drawing not optimized yet

## 🛣️ Roadmap

- [ ] File upload for existing images
- [ ] Save/export conversation history
- [ ] Dark mode toggle
- [ ] Mobile touch drawing support
- [ ] Color picker and advanced tools
- [ ] User authentication
- [ ] Multi-user collaboration
- [ ] LaTeX formula rendering
- [ ] Code syntax highlighting
- [ ] Export as PDF/SVG

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📞 Support

For detailed documentation, see `INTEGRATION_README.md`

---

**Status**: ✅ Fully Integrated and Ready to Use

Made with ❤️ using Google Gemini AI
