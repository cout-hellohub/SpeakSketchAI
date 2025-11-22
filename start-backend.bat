@echo off
echo ========================================
echo  SpeakSketchAI - Backend Server Startup
echo ========================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting backend server...
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js
