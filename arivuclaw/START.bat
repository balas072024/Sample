@echo off
title ArivuClaw — Fresh Start
cd /d "%~dp0"

echo.
echo ==============================================
echo   ArivuClaw — Fresh Start
echo ==============================================
echo.

echo [1/5] Pulling latest changes...
git fetch --all
git pull origin main
if errorlevel 1 (
    for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do (
        git pull origin %%b
    )
)
echo   Done.

echo.
echo [2/5] Cleaning old install...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .env del /f /q .env
if exist arivuclaw.config.json del /f /q arivuclaw.config.json
if exist .arivuclaw\config.json del /f /q .arivuclaw\config.json
if exist package-lock.json del /f /q package-lock.json
echo   Done.

echo.
echo [3/5] Clearing npm cache...
call npm cache clean --force 2>nul
echo   Done.

echo.
echo [4/5] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo   npm install failed! Need Node.js v22+ from https://nodejs.org
    pause
    exit /b 1
)
echo   Done.

echo.
echo [5/5] Starting ArivuClaw in unrestricted mode...
echo.

set ARIVUCLAW_MODE=unrestricted
powershell -ExecutionPolicy Bypass -File scripts\run.ps1
pause
