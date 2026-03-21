@echo off
title ArivuClaw
cd /d "%~dp0"

echo.
echo ==============================================
echo   ArivuClaw — Starting Up
echo ==============================================
echo.

:: ── Step 1: Check Node.js ────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js is not installed!
    echo   Download from: https://nodejs.org -- v22 or higher required
    pause
    exit /b 1
)
echo   Node.js found.

:: ── Step 2: Install dependencies if needed ───────────────
if not exist node_modules (
    echo.
    echo [1/3] Installing dependencies (first time only)...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo   npm install failed!
        pause
        exit /b 1
    )
    echo   Done.
) else (
    echo   Dependencies already installed.
)

:: ── Step 3: Build TypeScript if needed ───────────────────
if not exist dist (
    echo.
    echo [2/3] Building TypeScript...
    call npx tsc
    if errorlevel 1 (
        echo   Build failed!
        pause
        exit /b 1
    )
    echo   Done.
) else (
    echo   Build already exists.
)

:: ── Step 4: Check .env ───────────────────────────────────
if not exist .env (
    echo.
    echo   ── Configuration Required ──
    echo.
    echo   No .env file found. Creating from template...
    if exist .env.example (
        copy .env.example .env >nul
        echo   .env created from .env.example
        echo   Please edit .env and add your TELEGRAM_BOT_TOKEN
        echo   Then run START.bat again.
        echo.
        start notepad .env
        pause
        exit /b 0
    ) else (
        echo   No .env.example found either!
        echo   Create a .env file with at least:
        echo     TELEGRAM_BOT_TOKEN=your-bot-token-here
        pause
        exit /b 1
    )
)

:: ── Step 5: Start ArivuClaw ──────────────────────────────
echo.
echo [3/3] Starting ArivuClaw...
echo   Press Ctrl+C to stop.
echo.

set ARIVUCLAW_MODE=unrestricted
node dist/cli/index.js start
pause
