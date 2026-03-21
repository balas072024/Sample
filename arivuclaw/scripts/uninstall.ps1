# Arivumaiyam AI — Windows Uninstall Script
# Run: powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Arivumaiyam AI — Uninstall" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Remove Arivumaiyam AI completely? (y/N)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

# Remove config
$configDirs = @(
    "$env:USERPROFILE\.arivumaiyam",
    "$env:USERPROFILE\.arivuclaw",
    ".arivumaiyam",
    ".arivuclaw"
)

foreach ($dir in $configDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir ..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $dir
    }
}

# Remove .env
if (Test-Path ".env") {
    Write-Host "  Removing .env ..." -ForegroundColor Gray
    Remove-Item -Force ".env"
}

# Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "  Removing node_modules ..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules"
}

# Remove dist
if (Test-Path "dist") {
    Write-Host "  Removing dist ..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "dist"
}

# Clear env vars
$env:ARIVUCLAW_PROVIDER = $null
$env:MINIMAX_API_KEY = $null
$env:ANTHROPIC_API_KEY = $null
$env:OPENAI_API_KEY = $null
$env:GOOGLE_API_KEY = $null
$env:GROQ_API_KEY = $null
$env:DEEPSEEK_API_KEY = $null
$env:TELEGRAM_BOT_TOKEN = $null
$env:DISCORD_BOT_TOKEN = $null

Write-Host ""
Write-Host "  Done! Arivumaiyam AI has been removed." -ForegroundColor Green
Write-Host "  To fully remove, delete this folder: $(Get-Location)" -ForegroundColor Gray
Write-Host ""
