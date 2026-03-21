@echo off
title ArivuClaw
cd /d "%~dp0"
set ARIVUCLAW_MODE=unrestricted
powershell -ExecutionPolicy Bypass -File scripts\run.ps1
pause
