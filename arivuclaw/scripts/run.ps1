# ArivuClaw — One-Click Start Script
# Run: powershell -ExecutionPolicy Bypass -File scripts\run.ps1
#
# This script:
# 1. Checks Node.js is installed
# 2. Installs dependencies if needed
# 3. Configures .env if missing
# 4. Creates config to enable Telegram + MiniMax
# 5. Starts ArivuClaw

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "   ArivuClaw — Starting Up" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Node.js ──────────────────────────────────────

$nodeVersion = $null
try { $nodeVersion = (node --version 2>$null) } catch {}

if (-not $nodeVersion) {
    Write-Host "  [ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org (v22+ required)" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}

$major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($major -lt 22) {
    Write-Host "  [WARNING] Node.js $nodeVersion detected, but v22+ is recommended" -ForegroundColor Yellow
    Write-Host "  Download latest from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# ── Step 2: Install dependencies ───────────────────────────────

if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "  Installing dependencies (first time only)..." -ForegroundColor Yellow
    npm install --no-fund --no-audit 2>&1 | Out-Null
    Write-Host "  Dependencies installed." -ForegroundColor Green
}

# ── Step 3: Check/create .env ──────────────────────────────────

$envFile = Join-Path $projectDir ".env"
$needsConfig = $false

if (-not (Test-Path $envFile)) {
    $needsConfig = $true
} else {
    # Check if tokens are set
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "your-telegram-bot-token" -or -not ($envContent -match "TELEGRAM_BOT_TOKEN=.{10,}")) {
        $needsConfig = $true
    }
}

if ($needsConfig) {
    Write-Host ""
    Write-Host "  ── Configuration Required ──" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Get Telegram bot token from @BotFather" -ForegroundColor Gray
    Write-Host "     (Open Telegram > search @BotFather > /newbot)" -ForegroundColor Gray
    Write-Host ""
    $telegramToken = Read-Host "  Telegram Bot Token"

    Write-Host ""
    Write-Host "  2. Get MiniMax API key from platform.minimaxi.com" -ForegroundColor Gray
    Write-Host ""
    $minimaxKey = Read-Host "  MiniMax API Key"

    if ([string]::IsNullOrWhiteSpace($telegramToken)) {
        Write-Host "  [ERROR] Telegram token is required!" -ForegroundColor Red
        Read-Host "  Press Enter to exit"
        exit 1
    }

    $envContent = @"
# ArivuClaw Environment
ARIVUCLAW_MODE=unrestricted
ARIVUCLAW_PROVIDER=minimax
ARIVUCLAW_MODEL=MiniMax-Text-01
MINIMAX_API_KEY=$minimaxKey
TELEGRAM_BOT_TOKEN=$telegramToken
ARIVUCLAW_LOG_LEVEL=info
"@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Host "  .env created." -ForegroundColor Green
}

# ── Step 4: Create config JSON to enable Telegram ──────────────

$configFile = Join-Path $projectDir "arivuclaw.config.json"

if (-not (Test-Path $configFile)) {
    $configJson = @"
{
  "mode": "unrestricted",
  "defaultProvider": "minimax",
  "defaultModel": "MiniMax-Text-01",
  "channels": [
    { "type": "cli", "enabled": true, "credentials": {} },
    { "type": "telegram", "enabled": true, "credentials": {} }
  ],
  "logging": { "level": "info" }
}
"@
    Set-Content -Path $configFile -Value $configJson -Encoding UTF8
    Write-Host "  Config created (Telegram + CLI enabled)." -ForegroundColor Green
}

# ── Step 5: Start ArivuClaw ───────────────────────────────────

Write-Host ""
Write-Host "  Starting ArivuClaw..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

npx ts-node src/cli/index.ts start
