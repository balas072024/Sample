@echo off
title ArivuClaw — First Time Setup and Run
color 0A

echo.
echo   ============================================
echo     ArivuClaw — First Time Setup and Run
echo   ============================================
echo.

:: Clone the repo to Desktop if not already there
set "INSTALL_DIR=%USERPROFILE%\Desktop\Sample"

if exist "%INSTALL_DIR%\arivuclaw" (
    echo   Found existing installation at %INSTALL_DIR%
    echo   Pulling latest changes...
    cd /d "%INSTALL_DIR%"
    git pull origin main
    cd arivuclaw
) else (
    echo   Cloning repository to Desktop...
    echo.
    cd /d "%USERPROFILE%\Desktop"
    git clone https://github.com/balas072024/Sample.git
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo   ERROR: git clone failed. Make sure Git is installed.
        echo   Download Git from: https://git-scm.com/download/win
        echo.
        pause
        exit /b 1
    )
    cd Sample\arivuclaw
)

echo.

:: Install dependencies
echo   Installing dependencies...
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   ERROR: npm install failed. Make sure Node.js is installed.
    echo   Download Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo.

:: Start ArivuClaw
echo   Starting ArivuClaw...
echo.
echo   ============================================
echo.
node dist/cli/index.js start

echo.
echo   ArivuClaw has stopped.
pause
