@echo off
title ArivuClaw
cd /d "%~dp0"

echo.
echo ==============================================
echo   ArivuClaw — Starting Up
echo ==============================================
echo.

:: ── Check Node.js ────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js is not installed!
    echo   Download from: https://nodejs.org -- v22 or higher required
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   Node.js: %%v

:: ── Install dependencies if needed ───────────────────────
if not exist node_modules (
    echo.
    echo   Installing dependencies...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo   [ERROR] npm install failed!
        echo.
        pause
        exit /b 1
    )
    echo   Done.
)

:: ── Check .env ───────────────────────────────────────────
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
    ) else (
        echo ARIVUCLAW_MODE=unrestricted> .env
        echo TELEGRAM_BOT_TOKEN=>> .env
    )
    echo.
    echo   =============================================
    echo   .env file created. You MUST edit it first!
    echo   Add your TELEGRAM_BOT_TOKEN then run again.
    echo   =============================================
    echo.
    start notepad .env
    pause
    exit /b 0
)

:: ── Build TypeScript if needed ───────────────────────────
if not exist dist\cli\index.js (
    echo.
    echo   Building TypeScript...
    call npx tsc 2>&1
    if not exist dist\cli\index.js (
        echo.
        echo   [ERROR] Build failed! dist\cli\index.js not found.
        echo   Try: npx tsc
        echo.
        pause
        exit /b 1
    )
    echo   Build complete.
)

:: ── Start ────────────────────────────────────────────────
echo.
echo   Starting ArivuClaw...
echo   Press Ctrl+C to stop.
echo.

set ARIVUCLAW_MODE=unrestricted
node dist/cli/index.js start

echo.
echo   ArivuClaw has stopped.
echo.
pause
