# Arivumaiyam AI — Windows Quick Install Script
# Run: powershell -ExecutionPolicy Bypass -File scripts\install.ps1

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Arivumaiyam AI — Quick Install" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "  Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host "  Installing dependencies..." -ForegroundColor Gray
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Installed! Now run:" -ForegroundColor Green
Write-Host ""
Write-Host "    npx ts-node src/cli/index.ts onboard    # Setup wizard" -ForegroundColor White
Write-Host "    npx ts-node src/cli/index.ts chat        # Start chatting" -ForegroundColor White
Write-Host "    npx ts-node src/cli/index.ts start       # Start all channels + web UI" -ForegroundColor White
Write-Host ""
