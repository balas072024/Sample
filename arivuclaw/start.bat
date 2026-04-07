@echo off
cd /d "%~dp0"
if not exist node_modules (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
)
echo Building ArivuClaw...
call npx tsc
if not defined ARIVUCLAW_MODE set ARIVUCLAW_MODE=unrestricted
echo.
echo Starting ArivuClaw...
node dist/cli/index.js start
