#!/bin/bash

echo "========================================"
echo " SpeakSketchAI - Backend Server Startup"
echo "========================================"
echo ""

cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting backend server..."
echo "Server will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

node server.js
