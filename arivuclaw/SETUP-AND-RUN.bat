@echo off
title ArivuClaw — First Time Setup and Run
color 0A

echo.
echo   ============================================
echo     ArivuClaw — First Time Setup and Run
echo   ============================================
echo.

:: Set unrestricted mode
set ARIVUCLAW_MODE=unrestricted

:: Check Git
where git >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Git is not installed!
    echo   Download from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

:: Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js is not installed!
    echo   Download from: https://nodejs.org -- v22 or higher required
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   Node.js: %%v

:: Clone or pull
set "INSTALL_DIR=%USERPROFILE%\Desktop\Sample"

if exist "%INSTALL_DIR%\arivuclaw" (
    echo.
    echo   [1/3] Found existing installation. Pulling latest...
    cd /d "%INSTALL_DIR%"
    git pull origin main
    cd arivuclaw
) else (
    echo.
    echo   [1/3] Cloning repository to Desktop...
    cd /d "%USERPROFILE%\Desktop"
    git clone https://github.com/balas072024/Sample.git
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo   [ERROR] git clone failed!
        pause
        exit /b 1
    )
    cd Sample\arivuclaw
)

:: Install dependencies
echo.
echo   [2/3] Installing dependencies...
if not exist node_modules (
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo   [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo   Dependencies already installed.
)

:: Create .env if missing
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
    ) else (
        echo ARIVUCLAW_MODE=unrestricted> .env
    )
    echo.
    echo   .env file created with unrestricted mode.
    echo   Edit it later to add API keys if needed.
)

:: Build TypeScript if needed
if not exist dist\cli\index.js (
    echo.
    echo   Building TypeScript...
    call npx tsc 2>&1
    if not exist dist\cli\index.js (
        echo   [ERROR] Build failed!
        pause
        exit /b 1
    )
)

:: Start ArivuClaw in unrestricted mode with auto-restart
echo.
echo   [3/3] Starting ArivuClaw in UNRESTRICTED mode...
echo.
echo   ============================================
echo.

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
