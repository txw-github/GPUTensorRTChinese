Write-Host "Starting Chinese Video Transcription System for Windows..." -ForegroundColor Green
Write-Host ""

# Set environment variable
$env:NODE_ENV = "development"

# Check if tsx is available
try {
    $tsxVersion = tsx --version 2>$null
    Write-Host "Using tsx version: $tsxVersion" -ForegroundColor Blue
} catch {
    Write-Host "tsx not found. Installing..." -ForegroundColor Yellow
    npm install -g tsx
}

Write-Host "Starting server on localhost:5000..." -ForegroundColor Blue
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the Windows-compatible server
tsx server/windows-server.ts