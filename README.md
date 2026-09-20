# SpeakSketchAI

Local development instructions for the SpeakSketchAI demo (Creative Mode).

Prerequisites
- Node.js (16+)
- A Gemini API key with access to the requested model

Setup
1. Copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY_2`.

2. Install dependencies:

```powershell
cd e:\PROJECT\WEB\SpeakSketchAI
npm install
cd backend
npm install
```

Run

Start the backend server (serves the frontend statically):

```powershell
cd e:\PROJECT\WEB\SpeakSketchAI
npm start
# then open http://localhost:3000/creative_explore.html
```

Development

- To run only the frontend quickly, you can use the existing `dev` script which serves `./frontend`:

```powershell
npm run dev
```

Notes
- The app stores a persistent `sessionId` in browser `localStorage` to keep conversation history on the backend.
- Do not commit `backend/.env` or your API key.
