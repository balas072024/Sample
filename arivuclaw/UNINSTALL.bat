@echo off
title ArivuClaw — Uninstall
color 0C

echo.
echo   ============================================
echo     ArivuClaw — Uninstall
echo   ============================================
echo.

set "INSTALL_DIR=C:\Arivuclawmaiyam"

:: ── Confirm ───────────────────────────────────────────
echo   This will completely remove ArivuClaw from:
echo   %INSTALL_DIR%\Sample
echo.
set /p CONFIRM="   Are you sure? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo   Uninstall cancelled.
    pause
    exit /b 0
)

:: ── Kill any running ArivuClaw processes ──────────────
echo.
echo   Stopping any running ArivuClaw processes...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":6799" ^| findstr "LISTENING"') do (
    echo   Killing process %%p on port 6799...
    taskkill /PID %%p /F >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":6800" ^| findstr "LISTENING"') do (
    echo   Killing process %%p on port 6800...
    taskkill /PID %%p /F >nul 2>nul
)

:: ── Remove installation ──────────────────────────────
echo.
if exist "%INSTALL_DIR%\Sample" (
    echo   Removing %INSTALL_DIR%\Sample...
    rmdir /s /q "%INSTALL_DIR%\Sample"
    echo   Removed.
) else (
    echo   No installation found at %INSTALL_DIR%\Sample
)

:: ── Remove install directory if empty ─────────────────
dir /b "%INSTALL_DIR%" 2>nul | findstr . >nul
if errorlevel 1 (
    rmdir "%INSTALL_DIR%" 2>nul
    echo   Removed empty directory %INSTALL_DIR%
)

echo.
echo   ============================================
echo     ArivuClaw has been uninstalled.
echo   ============================================
echo.
pause
