# ArivuClaw — Fresh Installation (PowerShell)
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    ArivuClaw — Fresh Installation" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# ── Uninstall existing ArivuClaw ──────────────────────
Write-Host "  Uninstalling existing ArivuClaw..." -ForegroundColor Yellow

# Kill running processes on ArivuClaw ports
foreach ($port in @(6799, 6800, 7890)) {
    $connections = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
    foreach ($line in $connections) {
        $pid = ($line -split '\s+')[-1]
        if ($pid -and $pid -ne '0') {
            Write-Host "  Stopping process $pid on port $port..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Remove global npm packages
npm uninstall -g arivuclaw 2>$null | Out-Null
npm uninstall -g @arivuclaw/cli 2>$null | Out-Null

# Remove old installation
Set-Location C:\Arivuclawmaiyam
if (Test-Path "Sample") {
    Write-Host "  Removing C:\Arivuclawmaiyam\Sample..."
    Remove-Item -Recurse -Force "Sample"
}

# Remove old config and data
if (Test-Path "$env:USERPROFILE\.arivuclaw") {
    Remove-Item -Recurse -Force "$env:USERPROFILE\.arivuclaw"
}
if (Test-Path "$env:APPDATA\arivuclaw") {
    Remove-Item -Recurse -Force "$env:APPDATA\arivuclaw"
}

Write-Host "  Old ArivuClaw uninstalled." -ForegroundColor Green
Write-Host ""

# ── Fresh Install ─────────────────────────────────────
Write-Host "  Installing ArivuClaw..." -ForegroundColor Yellow
Write-Host ""

Set-Location C:\Arivuclawmaiyam
git clone -b claude/create-arivuclaw-tool-RXPb9 https://github.com/balas072024/Sample.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] git clone failed!" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}

Set-Location Sample\arivuclaw
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] npm install failed!" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}

# ── Start ─────────────────────────────────────────────
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "  Web UI:     http://localhost:6799" -ForegroundColor Green
Write-Host "  Dashboard:  http://localhost:6800" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

$env:ARIVUCLAW_MODE = "unrestricted"
node dist/cli/index.js start
Read-Host "  Press Enter to exit"
