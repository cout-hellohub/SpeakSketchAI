// Creative Mode - Backend Integration
const API_BASE_URL = "http://localhost:3000";

// Canvas setup
const canvasElement = document.querySelector('.canvas-box .canvas');
const canvas = document.createElement('canvas');
canvas.width = canvasElement.offsetWidth || 600;
canvas.height = canvasElement.offsetHeight || 500;
canvas.style.width = '100%';
canvas.style.height = '100%';
canvasElement.appendChild(canvas);

const ctx = canvas.getContext('2d');
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

// Tool buttons
const toolButtons = document.querySelectorAll('.canvas-footer .tools button');
const clearBtn = toolButtons[0];
const penBtn = toolButtons[1];
const eraserBtn = toolButtons[2];
const undoBtn = toolButtons[3];
const redoBtn = toolButtons[4];

// Output elements
const outputTextarea = document.querySelector('.output-box textarea');
const promptBox = document.querySelector('.prompt-box');
const submitBtn = document.querySelector('.action.submit');
const clearPromptBtn = document.querySelector('.action.clear');
const micBtn = document.querySelector('.mic');

// Speech recognition
let recognition;
let isRecording = false;

function saveState() {
    historyStep++;
    if (historyStep < drawHistory.length) {
        drawHistory.length = historyStep;
    }
    drawHistory.push(canvas.toDataURL());
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        const img = new Image();
        img.src = drawHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

function redo() {
    if (historyStep < drawHistory.length - 1) {
        historyStep++;
        const img = new Image();
        img.src = drawHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
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

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

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

// Add message to output
function addMessage(sender, text) {
    const currentText = outputTextarea.value;
    const newMessage = `\n${sender}: ${text}\n`;
    outputTextarea.value = currentText + newMessage;
    outputTextarea.scrollTop = outputTextarea.scrollHeight;
}

// Send to backend
async function sendToBackend(userText) {
    const imageBase64 = getCanvasImageBase64();
    
    addMessage('YOU', userText);
    addMessage('AI', 'Processing...');
    
    try {
        const res = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[Creative Mode] ${userText}`,
                image: imageBase64
            })
        });
        
        if (!res.ok) throw new Error('API response not OK');
        
        const data = await res.json();
        const botText = data.reply;
        
        // Remove "Processing..." message
        const lines = outputTextarea.value.split('\n');
        lines.pop();
        lines.pop();
        outputTextarea.value = lines.join('\n');
        
        addMessage('AI', botText);
        await speakSmartly(botText);
    } catch (err) {
        console.error('API error:', err);
        const lines = outputTextarea.value.split('\n');
        lines.pop();
        lines.pop();
        outputTextarea.value = lines.join('\n');
        addMessage('AI', '❌ Failed to process your request. Make sure the backend server is running.');
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
        utter.rate = 1.0;
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
        alert('Please enter a prompt first!');
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
outputTextarea.value = 'Welcome to Creative Mode! 🎨\n\nDraw something on the canvas and describe what you want to create.\n\nYou can:\n- Sketch ideas and get creative suggestions\n- Upload images and get interpretations\n- Use voice commands for hands-free interaction\n\nStart by drawing or typing your prompt!';
