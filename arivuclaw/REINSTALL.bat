@echo off
title ArivuClaw — Clean Reinstall
cd /d "%~dp0"

echo.
echo ==============================================
echo   ArivuClaw — Clean Reinstall
echo ==============================================
echo.
echo This will:
echo   1. Remove node_modules, dist, .env, configs
echo   2. Clear npm cache
echo   3. Fresh install all dependencies
echo   4. Start ArivuClaw in unrestricted mode
echo.

set /p confirm="Continue? (Y/N): "
if /I not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo [1/5] Removing old files...

if exist node_modules (
    echo   Removing node_modules...
    rmdir /s /q node_modules
)
if exist dist (
    echo   Removing dist...
    rmdir /s /q dist
)
if exist .env (
    echo   Removing .env...
    del /f /q .env
)
if exist arivuclaw.config.json (
    echo   Removing arivuclaw.config.json...
    del /f /q arivuclaw.config.json
)
if exist .arivuclaw\config.json (
    echo   Removing .arivuclaw\config.json...
    del /f /q .arivuclaw\config.json
)
if exist package-lock.json (
    echo   Removing package-lock.json...
    del /f /q package-lock.json
)

echo   Done.

echo.
echo [2/5] Clearing npm cache...
call npm cache clean --force 2>nul
echo   Done.

echo.
echo [3/5] Installing dependencies fresh...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo.
    echo   npm install failed! Check your Node.js installation.
    echo   Download from: https://nodejs.org ^(v22+ required^)
    pause
    exit /b 1
)
echo   Done.

echo.
echo [4/5] Setting up config...

(
echo ARIVUCLAW_MODE=unrestricted
echo ARIVUCLAW_LOG_LEVEL=info
)> .env

echo   .env created with unrestricted mode.

echo.
echo ==============================================
echo   Reinstall complete!
echo ==============================================
echo.
echo [5/5] Starting ArivuClaw...
echo.

set ARIVUCLAW_MODE=unrestricted
powershell -ExecutionPolicy Bypass -File scripts\run.ps1
pause
