const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");
let drawing = false;
let erasing = false;

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;


const penBtn = document.getElementById("penBtn");
const clearBtn = document.getElementById("clearBtn");
const micBtn = document.getElementById("micBtn");
const chatBox = document.getElementById("chatBox");

let recognition;

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const { x, y } = getCanvasCoords(e);
  ctx.beginPath();
  ctx.arc(x, y, erasing ? 10 : 2, 0, Math.PI * 2);
  ctx.fillStyle = erasing ? "#ffffff" : "#000000";
  ctx.fill();
});

penBtn.addEventListener("click", () => {
  erasing = !erasing;
  penBtn.textContent = erasing ? "🧽 Erase Mode" : "🖊️ Pen Mode";
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.innerText = "🎤 Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    addChatMessage("You", transcript, "user");
    micBtn.innerText = "⏳ Processing...";
    sendToGemini(transcript)
      .then(() => micBtn.innerText = "🎙️ Start Voice")
      .catch(() => micBtn.innerText = "🎙️ Start Voice");
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e);
    micBtn.innerText = "🎙️ Start Voice";
  };
}

micBtn.addEventListener("click", () => {
  try {
    recognition.start();
  } catch (err) {
    console.error("Recognition start error:", err);
  }
});

function getCanvasImageBase64() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = "#ffffff";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(canvas, 0, 0);

  return tempCanvas.toDataURL("image/png");
}

function addChatMessage(sender, text, className) {
  const msg = document.createElement("div");
  msg.className = className;

  const formatted = marked.parse(text); // ✅ Markdown parser
  msg.innerHTML = `<b>${sender}:</b> ${formatted}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function speakSmartly(fullText) {
  try {
    const res = await fetch("http://localhost:3000/tts-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullText })
    });
    const data = await res.json();
    const summary = data.speechText;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(summary);
    speechSynthesis.speak(utter);
  } catch (err) {
    console.error("❌ TTS Summary Error:", err);
  }
}

async function sendToGemini(userText) {
  const imageBase64 = getCanvasImageBase64();

  try {
    const res = await fetch("http://localhost:3000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        image: imageBase64
      })
    });

    if (!res.ok) throw new Error("API response not OK");

    const data = await res.json();
    const botText = data.reply;
    addChatMessage("Bot", botText, "bot");
    speakSmartly(botText);
  } catch (err) {
    console.error("❌ API error:", err);
    addChatMessage("Bot", "❌ Failed to process your request.", "bot");
  }
}
