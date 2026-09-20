// Creative Mode - Backend Integration
const API_BASE_URL = (() => {
    const { hostname, port, protocol } = window.location;
    const backendPorts = new Set(['3000', '3001']);
    if (protocol !== 'file:' && backendPorts.has(port)) {
        return `${protocol}//${hostname}:${port}`;
    }
    return 'http://localhost:3000';
})();

// Persistent session id for server-side session history
const sessionId = (() => {
    try {
        let id = localStorage.getItem('sks_sessionId');
        if (!id) {
            id = 'sks_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
            localStorage.setItem('sks_sessionId', id);
        }
        return id;
    } catch (e) {
        // localStorage might not be available in some contexts
        return 'sks_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
    }
})();

// Creative Mode - canvas and backend integration
const canvasHost = document.querySelector('.canvas-box .canvas');
const canvas = document.createElement('canvas');
canvas.className = 'drawing-surface';
canvasHost.appendChild(canvas);
const ctx = canvas.getContext('2d');

const outputPanel = document.getElementById('outputBox');
const promptBox = document.getElementById('promptBox');
const submitBtn = document.getElementById('submitBtn');
const clearPromptBtn = document.getElementById('clearPromptBtn');
const micBtn = document.getElementById('mic-btn');
const toolButtons = document.querySelectorAll('.canvas-footer .tools button');
const [clearBtn, penBtn, eraserBtn, undoBtn, redoBtn] = toolButtons;

let drawing = false;
let activePointerId = null;
let currentTool = 'pen';
let drawHistory = [];
let historyStep = -1;
let isSubmitting = false;
let recognition;
let isRecording = false;
const dialogue = [];

marked.setOptions({
    breaks: true,
    gfm: true
});

function renderMarkdown(text) {
    const markdown = String(text || '')
        .replace(/\$\s+\$/g, '$$$$')
        .replace(/\\\s+(?=[A-Za-z])/g, '\\');
    const rendered = marked.parse(markdown);
    return DOMPurify.sanitize(rendered, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload']
    });
}

function enhanceRenderedContent(content) {
    if (window.renderMathInElement) {
        renderMathInElement(content, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false,
            strict: 'ignore'
        });
    }

    content.querySelectorAll('a').forEach((link) => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer nofollow';
    });

    content.querySelectorAll('pre code').forEach((code) => {
        const language = [...code.classList]
            .find((className) => className.startsWith('language-'))
            ?.replace('language-', '');
        if (language) {
            const label = document.createElement('span');
            label.className = 'code-language';
            label.textContent = language;
            code.parentElement.prepend(label);
        }
        if (window.hljs) window.hljs.highlightElement(code);
    });
}

function renderDialogue() {
    outputPanel.replaceChildren();
    dialogue.forEach(({ sender, text, markdown }) => {
        const message = document.createElement('article');
        message.className = `chat-message chat-${sender.toLowerCase()}`;

        const senderLabel = document.createElement('div');
        senderLabel.className = 'chat-sender';
        senderLabel.textContent = sender;

        const content = document.createElement('div');
        content.className = 'chat-content';
        if (markdown) {
            content.innerHTML = renderMarkdown(text);
            enhanceRenderedContent(content);
        } else {
            content.textContent = text;
        }

        message.append(senderLabel, content);
        outputPanel.appendChild(message);
    });
    outputPanel.scrollTop = outputPanel.scrollHeight;
}

function resizeCanvas() {
    const rect = canvasHost.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width === width && canvas.height === height) return;

    const previousImage = canvas.width && canvas.height ? canvas.toDataURL() : null;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#dadada';
    ctx.fillRect(0, 0, width, height);

    if (previousImage) {
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, width, height);
        image.src = previousImage;
    }
}

function saveState() {
    historyStep += 1;
    drawHistory = drawHistory.slice(0, historyStep);
    drawHistory.push(canvas.toDataURL('image/png'));
    updateHistoryButtons();
}

function restoreState(step) {
    if (!drawHistory[step]) return;
    const image = new Image();
    image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = drawHistory[step];
}

function updateHistoryButtons() {
    undoBtn.disabled = historyStep <= 0;
    redoBtn.disabled = historyStep >= drawHistory.length - 1;
}

function undo() {
    if (historyStep <= 0) return;
    historyStep -= 1;
    restoreState(historyStep);
    updateHistoryButtons();
}

function redo() {
    if (historyStep >= drawHistory.length - 1) return;
    historyStep += 1;
    restoreState(historyStep);
    updateHistoryButtons();
}

function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function drawAt(event) {
    const { x, y } = getCanvasCoords(event);
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = currentTool === 'eraser' ? 20 : 2;
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing(event) {
    if (!drawing || event.pointerId !== activePointerId) return;
    drawing = false;
    activePointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
    ctx.beginPath();
    saveState();
}

resizeCanvas();
saveState();
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    drawing = true;
    activePointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    const { x, y } = getCanvasCoords(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
});

canvas.addEventListener('pointermove', (event) => {
    if (!drawing || event.pointerId !== activePointerId) return;
    event.preventDefault();
    drawAt(event);
});

canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('pointerleave', (event) => {
    if (drawing && event.pointerType === 'mouse') stopDrawing(event);
});

function setTool(tool) {
    currentTool = tool;
    const isPen = tool === 'pen';
    penBtn.classList.toggle('selected', isPen);
    eraserBtn.classList.toggle('selected', !isPen);
    penBtn.setAttribute('aria-pressed', String(isPen));
    eraserBtn.setAttribute('aria-pressed', String(!isPen));
}

clearBtn.addEventListener('click', () => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#dadada';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});
penBtn.addEventListener('click', () => setTool('pen'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
setTool('pen');

function hasDrawing() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] > 0 && pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] < 80) {
            return true;
        }
    }
    return false;
}

function getCanvasImageBase64() {
    if (!hasDrawing()) return null;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = '#ffffff';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(canvas, 0, 0);
    return exportCanvas.toDataURL('image/png');
}

function addMessage(sender, text) {
    dialogue.push({ sender, text, markdown: sender === 'AI' });
    renderDialogue();
}

function addProcessingMessage() {
    addMessage('AI', 'Processing...');
}

function removeProcessingMessage() {
    const lastMessage = dialogue[dialogue.length - 1];
    if (lastMessage?.sender === 'AI' && lastMessage.text === 'Processing...') {
        dialogue.pop();
        renderDialogue();
    }
}

async function sendToBackend(userText) {
    const message = userText.trim();
    const image = getCanvasImageBase64();
    if (!message && !image) {
        addMessage('AI', 'Please draw something or enter a prompt first.');
        return;
    }
    if (isSubmitting) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    addMessage('YOU', message || '[image prompt]');
    addProcessingMessage();

    try {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message || undefined, image, sessionId })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.reply || data.error || 'API response was not OK.');
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The AI returned an empty response.');

        removeProcessingMessage();
        addMessage('AI', data.reply.trim());
        speakSmartly(data.reply.trim());
    } catch (error) {
        console.error('API error:', error);
        removeProcessingMessage();
        addMessage('AI', `Error: ${error.message || 'Failed to process your request.'}`);
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
    }
}

async function speakSmartly(fullText) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    let speechText = fullText;
    try {
        const response = await fetch(`${API_BASE_URL}/tts-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullText, sessionId })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && typeof data.speechText === 'string' && data.speechText.trim()) speechText = data.speechText.trim();
    } catch (error) {
        console.error('TTS summary error:', error);
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(speechText));
}

submitBtn.addEventListener('click', () => {
    const userText = promptBox.value;
    if (!userText.trim() && !hasDrawing()) {
        alert('Please enter a prompt or draw on the canvas first.');
        return;
    }
    sendToBackend(userText);
    promptBox.value = '';
});

clearPromptBtn.addEventListener('click', () => { promptBox.value = ''; });
promptBox.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitBtn.click();
    }
});

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => { isRecording = true; micBtn.classList.add('active'); };
    recognition.onresult = (event) => {
        promptBox.value = event.results[event.results.length - 1][0].transcript.trim();
        sendToBackend(promptBox.value);
        promptBox.value = '';
    };
    recognition.onerror = (error) => { console.error('Speech recognition error:', error); };
    recognition.onend = () => { isRecording = false; micBtn.classList.remove('active'); };
} else {
    micBtn.disabled = true;
    micBtn.style.opacity = '0.5';
}

micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (isRecording) recognition.stop();
    else recognition.start();
});

dialogue.push({ sender: 'AI', text: 'Welcome to Creative Mode!\n\nDraw something on the canvas and describe what you want to create.', markdown: true });
renderDialogue();
/*
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
const outputTextarea = document.getElementById('outputBox');
const promptBox = document.getElementById('promptBox');
const submitBtn = document.getElementById('submitBtn');
const clearPromptBtn = document.getElementById('clearPromptBtn');
const micBtn = document.getElementById('mic-btn');

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
                image: imageBase64,
                sessionId: sessionId
            })
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            const errMsg = errData?.reply || errData?.error || 'API response not OK';
            throw new Error(errMsg);
        }

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
        const msg = err?.message || 'Failed to process your request. Make sure the backend server is running.';
        addMessage('AI', `❌ ${msg}`);
    }
}

// Text-to-speech with smart summary
async function speakSmartly(fullText) {
    try {
        const res = await fetch(`${API_BASE_URL}/tts-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullText, sessionId })
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
*/