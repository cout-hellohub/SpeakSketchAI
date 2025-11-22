# 🚀 SpeakSketchAI - Quick Reference Card

## ⚡ Quick Start (30 seconds)

1. **Start Backend**: Double-click `start-backend.bat`
2. **Open Browser**: Go to `page_design/index.html`
3. **Select Mode**: Choose Creative or Education
4. **Start Creating**: Draw and ask questions!

## 📍 Important URLs

- **Backend Server**: http://localhost:3000
- **Integration Test**: `test.html`
- **Landing Page**: `frontend/index.html`
- **Tools Selection**: `frontend/tools.html`
- **Creative Mode**: `frontend/creative_explore.html`
- **Education Mode**: `frontend/education_explore.html`

## 🎨 Creative Mode - Quick Guide

### What You Can Do
- Sketch creative ideas
- Get AI interpretations
- Turn drawings into stories
- Explore visual concepts

### How to Use
1. Draw on canvas
2. Type or speak your creative prompt
3. Get AI-generated creative content
4. Hear response spoken aloud

### Example Prompts
- "Turn this into a sci-fi story"
- "What could this sketch represent?"
- "Create a poem about this drawing"
- "Give me 3 creative ideas based on this"

## 📚 Education Mode - Quick Guide

### What You Can Do
- Draw diagrams and formulas
- Get step-by-step explanations
- Ask educational questions
- Interactive tutoring

### How to Use
1. Draw diagram/formula on whiteboard
2. Type or speak your question
3. Get detailed educational explanation
4. Continue conversation naturally

### Example Prompts
- "Explain this diagram"
- "How do I solve this equation?"
- "What is this concept?"
- "Break this down step by step"

## 🎮 Controls

### Canvas Tools
- **Pen Button**: Switch to drawing mode
- **Eraser Button**: Switch to eraser mode
- **Clear Button**: Clear entire canvas
- **Undo** (Creative): Undo last action
- **Redo** (Creative): Redo last action

### Input Methods
- **Type**: Enter text in prompt box
- **Voice**: Click mic button and speak
- **Submit**: Click upload button or press Enter

### Output
- **Text**: AI response appears in output box
- **Voice**: Response is automatically spoken
- **History**: Previous messages shown (Education)

## ⌨️ Keyboard Shortcuts

- `Enter` - Submit prompt (from text box)
- `Shift+Enter` - New line in prompt box
- `F11` - Fullscreen mode (recommended)

## 🔊 Voice Commands

### Starting Voice Input
1. Click the microphone button
2. Button turns red when listening
3. Speak clearly into microphone
4. Stop automatically when done

### Voice Tips
- Speak naturally
- Wait for button to turn red
- One command at a time
- Check mic permissions if issues

## 🛠️ Troubleshooting Quick Fixes

### Backend Not Running
```bash
cd backend
node server.js
```

### Page Not Loading
- Refresh browser (Ctrl+R)
- Clear cache (Ctrl+Shift+Delete)
- Check browser console (F12)

### AI Not Responding
- Verify backend is running
- Check internet connection
- Look for errors in backend console

### Voice Not Working
- Use Chrome or Edge
- Allow microphone permission
- Check system mic settings

### Drawing Not Working
- Click on canvas first
- Try different browser
- Clear browser cache

## 📊 Status Indicators

| Indicator | Meaning |
|-----------|---------|
| Black mic button | Ready to record |
| Red pulsing mic | Recording voice |
| "Processing..." | AI is thinking |
| "Analyzing..." | Analyzing your drawing |
| Error message | Check backend/connection |

## 🎯 Best Practices

### For Best Results
1. **Draw clearly**: AI works better with clear sketches
2. **Be specific**: Detailed prompts get better responses
3. **Use fullscreen**: Press F11 for better experience
4. **Try voice**: Natural language works great
5. **Iterate**: Ask follow-up questions

### Performance Tips
1. **Clear canvas** regularly for better performance
2. **Keep drawings** simple and focused
3. **One concept** per canvas for clarity
4. **Restart backend** if it becomes slow

## 🌐 Browser Recommendations

### Best Choice
- **Chrome** (Best overall support)
- **Edge** (Full feature support)

### Also Works
- **Firefox** (No voice input)
- **Safari** (Limited voice support)

## 📞 Getting Help

### Check First
1. Backend running? (`✅ Server running at http://localhost:3000`)
2. Browser console errors? (Press F12)
3. Internet connected?
4. Mic permissions granted?

### Documentation
- `README.md` - Main guide
- `INTEGRATION_README.md` - Technical details
- `INTEGRATION_SUMMARY.md` - Complete overview

### Test Page
- Open `test.html` to run diagnostic tests
- All 5 tests should pass (or 4/5 if voice not supported)

## 🎨 UI Elements Guide

### Creative Mode Layout
```
┌──────────────┬──────────────┐
│              │              │
│   Canvas     │   Output     │
│  (Drawing)   │  (AI Reply)  │
│              │              │
└──────────────┴──────────────┘
┌─────────────────────────────┐
│  Prompt Box    │  🎤 Mic    │
└─────────────────────────────┘
```

### Education Mode Layout
```
┌──────────────┬──────────────┐
│ Whiteboard   │              │
│  (Canvas)    │   Chatbox    │
├──────────────┤  (History)   │
│  Keyboard    │              │
│ Placeholder  │              │
└──────────────┴──────────────┘
┌─────────────────────────────┐
│  Prompt Box    │  🎤 Mic    │
└─────────────────────────────┘
```

## 🔔 Tips & Tricks

### Creative Mode Tips
- Start with simple sketches
- Use descriptive prompts
- Combine drawing with detailed text
- Experiment with different styles

### Education Mode Tips
- Draw diagrams clearly
- Label important parts
- Ask specific questions
- Build on previous answers

### Voice Tips
- Speak in a quiet environment
- Hold mic button if needed
- Pause between sentences
- Review text before submitting

### Performance Tips
- Close unused tabs
- Restart backend if slow
- Clear canvas frequently
- Use Chrome for best performance

## 📈 Feature Matrix

| Feature | Creative | Education |
|---------|----------|-----------|
| Canvas Drawing | ✅ | ✅ |
| Pen/Eraser | ✅ | ✅ |
| Undo/Redo | ✅ | ❌ |
| Voice Input | ✅ | ✅ |
| Text Input | ✅ | ✅ |
| AI Response | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ |
| Chat History | ❌ | ✅ |
| Timestamps | ❌ | ✅ |

## 🎓 Learning Path

### Beginner
1. Start with Creative Mode
2. Draw simple shapes
3. Ask basic questions
4. Get familiar with UI

### Intermediate
1. Try Education Mode
2. Draw diagrams
3. Use voice input
4. Ask follow-up questions

### Advanced
1. Complex sketches
2. Multi-step conversations
3. Combine modes effectively
4. Optimize prompts

---

**Print this page for quick reference! 📄**

Last Updated: November 22, 2025
