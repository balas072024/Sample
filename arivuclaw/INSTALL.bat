@echo off
title ArivuClaw — Fresh Installation
color 0A

echo.
echo   ============================================
echo     ArivuClaw — Fresh Installation
echo   ============================================
echo.

:: ── Set install location ──────────────────────────────
set "INSTALL_DIR=C:\Arivuclawmaiyam"

:: ── Check Git ─────────────────────────────────────────
where git >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Git is not installed!
    echo   Download from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo   Git: OK

:: ── Check Node.js ─────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js is not installed!
    echo   Download from: https://nodejs.org -- v22 or higher required
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   Node.js: %%v

:: ── Clean previous installation ───────────────────────
if exist "%INSTALL_DIR%\Sample" (
    echo.
    echo   Removing previous installation...
    rmdir /s /q "%INSTALL_DIR%\Sample"
)

:: ── Create install directory ──────────────────────────
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: ── Clone repository ──────────────────────────────────
echo.
echo   [1/4] Cloning ArivuClaw repository...
git clone -b claude/create-arivuclaw-tool-RXPb9 https://github.com/balas072024/Sample.git
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [ERROR] git clone failed! Check your internet connection.
    pause
    exit /b 1
)

cd Sample\arivuclaw

:: ── Install dependencies ──────────────────────────────
echo.
echo   [2/4] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo   [ERROR] npm install failed!
    pause
    exit /b 1
)

:: ── Create .env file ──────────────────────────────────
echo.
echo   [3/4] Creating configuration...
(
echo ARIVUCLAW_MODE=unrestricted
echo.
echo # Add your API keys below:
echo # ANTHROPIC_API_KEY=sk-ant-your-key-here
echo # OPENAI_API_KEY=sk-your-key-here
echo # TELEGRAM_BOT_TOKEN=your-telegram-bot-token
echo # GROQ_API_KEY=your-groq-key-here
echo # DEEPSEEK_API_KEY=your-deepseek-key-here
) > .env

:: ── Start ArivuClaw ───────────────────────────────────
echo.
echo   [4/4] Starting ArivuClaw in UNRESTRICTED mode...
echo.
echo   ============================================
echo   Web UI:     http://localhost:6799
echo   Dashboard:  http://localhost:6800
echo   ============================================
echo.

set ARIVUCLAW_MODE=unrestricted

:run_loop
node dist/cli/index.js start
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 0 (
    echo.
    echo   ArivuClaw has stopped gracefully.
    pause
    goto :eof
)

echo.
echo   ArivuClaw crashed with exit code %EXIT_CODE%. Auto-restarting in 5s...
echo   Press Ctrl+C to cancel.
timeout /t 5 /nobreak >nul
goto :run_loop
