@echo off
echo Starting Chinese Video Transcription System for Windows...
echo.

REM Set environment variable for Windows
set NODE_ENV=development

REM Start the Windows-compatible server
echo Starting server on localhost:5000...
tsx server/windows-server.ts

pause