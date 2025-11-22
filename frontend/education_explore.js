// Education Mode - Backend Integration
const API_BASE_URL = "http://localhost:3000";

// Canvas setup
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

// Resize canvas to fill container
const canvasContainer = canvas.parentElement;
canvas.width = canvasContainer.offsetWidth || 600;
canvas.height = canvasContainer.offsetHeight || 400;

let drawing = false;
let erasing = false;
let currentTool = 'pen';

// Drawing state
let drawHistory = [];
let historyStep = -1;

// Initialize canvas with white background
ctx.fillStyle = '#dadada';
ctx.fillRect(0, 0, canvas.width, canvas.height);
saveState();

// UI Elements
const chatBox = document.getElementById('chatBox');
const promptBox = document.getElementById('promptBox');
const submitBtn = document.getElementById('submitBtn');
const clearPromptBtn = document.getElementById('clearPromptBtn');
const micBtn = document.getElementById('mic-btn');
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');

// Speech recognition
let recognition;
let isRecording = false;

// Conversation history
let conversationHistory = [];

function saveState() {
    historyStep++;
    if (historyStep < drawHistory.length) {
        drawHistory.length = historyStep;
    }
    drawHistory.push(canvas.toDataURL());
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Drawing handlers
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const { x, y } = getCanvasCoords(e);
    
    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
    }
    
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
    saveState();
});

canvas.addEventListener('mouseleave', () => {
    drawing = false;
    ctx.beginPath();
});

// Tool button handlers
clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#dadada';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});

penBtn.addEventListener('click', () => {
    currentTool = 'pen';
    penBtn.style.backgroundColor = '#000';
    penBtn.querySelector('img').style.filter = 'invert(1)';
    eraserBtn.style.backgroundColor = '#f1f1f1';
    eraserBtn.querySelector('img').style.filter = 'invert(0)';
});

eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.style.backgroundColor = '#000';
    eraserBtn.querySelector('img').style.filter = 'invert(1)';
    penBtn.style.backgroundColor = '#f1f1f1';
    penBtn.querySelector('img').style.filter = 'invert(0)';
});

// Get canvas as base64
function getCanvasImageBase64() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    return tempCanvas.toDataURL('image/png');
}

// Add message to chatbox
function addChatMessage(sender, text) {
    const currentText = chatBox.value;
    const timestamp = new Date().toLocaleTimeString();
    const newMessage = `\n[${timestamp}] ${sender}: ${text}\n`;
    chatBox.value = currentText + newMessage;
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Store in conversation history
    conversationHistory.push({ sender, text, timestamp });
}

// Send to backend
async function sendToBackend(userText) {
    const imageBase64 = getCanvasImageBase64();
    
    addChatMessage('YOU', userText);
    addChatMessage('TUTOR', 'Analyzing your question...');
    
    try {
        const res = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[Education Mode - Tutor Context] The student asks: "${userText}". Provide a clear, educational explanation. If there's a diagram or formula in the image, explain it step-by-step.`,
                image: imageBase64
            })
        });
        
        if (!res.ok) throw new Error('API response not OK');
        
        const data = await res.json();
        const tutorResponse = data.reply;
        
        // Remove "Analyzing..." message
        const lines = chatBox.value.split('\n');
        lines.pop();
        lines.pop();
        chatBox.value = lines.join('\n');
        
        addChatMessage('TUTOR', tutorResponse);
        await speakSmartly(tutorResponse);
    } catch (err) {
        console.error('API error:', err);
        const lines = chatBox.value.split('\n');
        lines.pop();
        lines.pop();
        chatBox.value = lines.join('\n');
        addChatMessage('TUTOR', '❌ Failed to process your request. Make sure the backend server is running on http://localhost:3000');
    }
}

// Text-to-speech with smart summary
async function speakSmartly(fullText) {
    try {
        const res = await fetch(`${API_BASE_URL}/tts-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullText })
        });
        const data = await res.json();
        const summary = data.speechText;
        
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(summary);
        utter.rate = 0.95;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
    } catch (err) {
        console.error('TTS Summary Error:', err);
    }
}

// Submit button handler
submitBtn.addEventListener('click', () => {
    const userText = promptBox.value.trim();
    if (!userText) {
        alert('Please enter a question or prompt first!');
        return;
    }
    sendToBackend(userText);
    promptBox.value = '';
});

// Clear prompt button
clearPromptBtn.addEventListener('click', () => {
    promptBox.value = '';
});

// Enter key to submit
promptBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitBtn.click();
    }
});

// Speech recognition setup
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isRecording = true;
        console.log('Recording started...');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        promptBox.value = transcript;
        sendToBackend(transcript);
    };
    
    recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        micBtn.classList.remove('active');
        isRecording = false;
    };
    
    recognition.onend = () => {
        micBtn.classList.remove('active');
        isRecording = false;
        console.log('Recording stopped...');
    };
} else {
    console.warn('Speech recognition not supported in this browser.');
    micBtn.disabled = true;
    micBtn.style.opacity = '0.5';
}

// Mic button handler
micBtn.addEventListener('click', () => {
    if (!recognition) {
        alert('Speech recognition is not supported in this browser.');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (err) {
            console.error('Recognition start error:', err);
        }
    }
});

// Initial message
chatBox.value = `Welcome to Education Mode! 📚

I'm your AI tutor. I can help you with:
- Explaining diagrams and formulas
- Step-by-step problem solving
- Concept clarification
- Interactive learning

Draw a diagram, formula, or graph on the canvas, then ask me questions about it!

You can type or use voice input. Let's start learning!`;
