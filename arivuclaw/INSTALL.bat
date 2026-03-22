@echo off
title ArivuClaw — Fresh Installation
color 0A

echo.
echo   ============================================
echo     ArivuClaw — Fresh Installation
echo   ============================================
echo.

:: ── Uninstall existing ArivuClaw ─────────────────────
echo   Uninstalling existing ArivuClaw...

:: Kill running processes on all known ports
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":6799" ^| findstr "LISTENING" 2^>nul') do (
    echo   Stopping process %%p on port 6799...
    taskkill /PID %%p /F >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":6800" ^| findstr "LISTENING" 2^>nul') do (
    echo   Stopping process %%p on port 6800...
    taskkill /PID %%p /F >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    echo   Stopping old process %%p on port 3000...
    taskkill /PID %%p /F >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":7890" ^| findstr "LISTENING" 2^>nul') do (
    echo   Stopping old process %%p on port 7890...
    taskkill /PID %%p /F >nul 2>nul
)

:: Remove global npm packages
call npm uninstall -g arivuclaw >nul 2>nul
call npm uninstall -g @arivuclaw/cli >nul 2>nul

:: Remove old installation
cd /d C:\Arivuclawmaiyam
if exist Sample (
    echo   Removing C:\Arivuclawmaiyam\Sample...
    rmdir /s /q Sample
)

:: Remove old config and data
if exist "%USERPROFILE%\.arivuclaw" rmdir /s /q "%USERPROFILE%\.arivuclaw"
if exist "%APPDATA%\arivuclaw" rmdir /s /q "%APPDATA%\arivuclaw"

echo   Old ArivuClaw uninstalled.
echo.

:: ── Fresh Install ────────────────────────────────────
echo   Installing ArivuClaw...
echo.

cd /d C:\Arivuclawmaiyam
git clone -b claude/create-arivuclaw-tool-RXPb9 https://github.com/balas072024/Sample.git
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] git clone failed!
    pause
    exit /b 1
)

cd Sample\arivuclaw
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo   [ERROR] npm install failed!
    pause
    exit /b 1
)

:: ── Start ────────────────────────────────────────────
echo.
echo   ============================================
echo   Web UI:     http://localhost:6799
echo   Dashboard:  http://localhost:6800
echo   ============================================
echo.

set ARIVUCLAW_MODE=unrestricted
node dist/cli/index.js start
pause
