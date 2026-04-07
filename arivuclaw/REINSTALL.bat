@echo off
title ArivuClaw — Clean Reinstall
cd /d "%~dp0"

echo.
echo ==============================================
echo   ArivuClaw — Clean Reinstall
echo ==============================================
echo.
echo This will:
echo   1. Pull latest changes from git
echo   2. Remove node_modules, dist, .env, configs
echo   3. Clear npm cache
echo   4. Fresh install all dependencies
echo   5. Start ArivuClaw in unrestricted mode
echo.

set /p confirm="Continue? (Y/N): "
if /I not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo [1/6] Pulling latest changes from git...
git fetch --all
git reset --hard origin/main
git pull origin main
if errorlevel 1 (
    echo   git pull failed, trying current branch...
    for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do (
        git pull origin %%b
    )
)
echo   Done.

echo.
echo [2/6] Removing old files...

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
echo [3/6] Clearing npm cache...
call npm cache clean --force 2>nul
echo   Done.

echo.
echo [4/6] Installing dependencies fresh...
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
echo [5/6] Setting up config...

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
echo [6/6] Starting ArivuClaw...
echo.

set ARIVUCLAW_MODE=unrestricted
powershell -ExecutionPolicy Bypass -File scripts\run.ps1
pause
