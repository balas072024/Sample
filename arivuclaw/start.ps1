# ArivuClaw Startup Script for Windows PowerShell
Set-Location $PSScriptRoot

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
}

# Build TypeScript
Write-Host "Building ArivuClaw..." -ForegroundColor Cyan
npx tsc

# Set environment
if (-not $env:ARIVUCLAW_MODE) {
    $env:ARIVUCLAW_MODE = "unrestricted"
}

# Start ArivuClaw
Write-Host ""
Write-Host "Starting ArivuClaw..." -ForegroundColor Green
node dist/cli/index.js start
