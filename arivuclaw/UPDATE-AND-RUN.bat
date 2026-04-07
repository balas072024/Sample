@echo off
title ArivuClaw — Update and Run
color 0A

echo.
echo   ============================================
echo     ArivuClaw — Pull Latest and Run
echo   ============================================
echo.

:: Save current directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Step 1: Pull latest changes
echo   [1/3] Pulling latest changes from GitHub...
echo.
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   WARNING: git pull failed. Trying current branch...
    git pull
)
echo.
echo   Pull complete.
echo.

:: Step 2: Install dependencies (only if needed)
echo   [2/3] Checking dependencies...
if not exist "node_modules" (
    echo   Installing dependencies...
    npm install --production
) else (
    echo   Dependencies already installed.
)
echo.

:: Step 3: Start ArivuClaw
echo   [3/3] Starting ArivuClaw...
echo.
echo   ============================================
echo.
node dist/cli/index.js start

:: If it exits, pause so user can see any errors
echo.
echo   ArivuClaw has stopped.
pause
