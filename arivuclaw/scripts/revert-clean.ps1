# ArivuClaw - Revert and Clean Script
# Pulls latest reverted code, removes all Arivumaiyam leftovers, rebuilds fresh.
# Run: powershell -ExecutionPolicy Bypass -File scripts\revert-clean.ps1

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  ArivuClaw - Revert and Clean" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot
Write-Host "  Working directory: $projectRoot" -ForegroundColor Gray

# -- 1. Pull latest reverted code --
Write-Host ""
Write-Host "[1/6] Pulling latest code..." -ForegroundColor Yellow
git pull origin main 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Trying current branch..." -ForegroundColor Gray
    $branch = git rev-parse --abbrev-ref HEAD
    git pull origin $branch
}
Write-Host "  Code updated." -ForegroundColor Green

# -- 2. Remove old Arivumaiyam config directories --
Write-Host ""
Write-Host "[2/6] Removing Arivumaiyam config leftovers..." -ForegroundColor Yellow

$oldDirs = @(
    "$env:USERPROFILE\.arivumaiyam",
    ".arivumaiyam",
    "$projectRoot\.arivumaiyam"
)

foreach ($dir in $oldDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir" -ForegroundColor Gray
        Remove-Item -Recurse -Force $dir
    }
}

# Remove old config file if it exists
$oldConfigs = @(
    "$projectRoot\arivumaiyam.config.json",
    "$env:USERPROFILE\.arivumaiyam\config.json"
)

foreach ($cfg in $oldConfigs) {
    if (Test-Path $cfg) {
        Write-Host "  Removing $cfg" -ForegroundColor Gray
        Remove-Item -Force $cfg
    }
}

Write-Host "  Old config cleaned." -ForegroundColor Green

# -- 3. Stop any running Arivumaiyam processes --
Write-Host ""
Write-Host "[3/6] Stopping old processes..." -ForegroundColor Yellow

# Stop pm2 process if running under old name
pm2 stop arivumaiyam 2>$null
pm2 delete arivumaiyam 2>$null

# Uninstall old global npm package if exists
npm uninstall -g arivumaiyam 2>$null

Write-Host "  Old processes stopped." -ForegroundColor Green

# -- 4. Clean build artifacts --
Write-Host ""
Write-Host "[4/6] Cleaning build artifacts..." -ForegroundColor Yellow

$cleanDirs = @("dist", "node_modules\.cache")
foreach ($dir in $cleanDirs) {
    $fullPath = Join-Path $projectRoot "arivuclaw\$dir"
    if (Test-Path $fullPath) {
        Write-Host "  Removing arivuclaw\$dir" -ForegroundColor Gray
        Remove-Item -Recurse -Force $fullPath
    }
}

# Remove old log files with arivumaiyam in name
$logDir = Join-Path $projectRoot "arivuclaw\logs"
if (Test-Path $logDir) {
    Get-ChildItem $logDir -Filter "*arivumaiyam*" | ForEach-Object {
        Write-Host "  Removing log: $($_.Name)" -ForegroundColor Gray
        Remove-Item -Force $_.FullName
    }
}

Write-Host "  Build artifacts cleaned." -ForegroundColor Green

# -- 5. Reinstall dependencies --
Write-Host ""
Write-Host "[5/6] Reinstalling dependencies..." -ForegroundColor Yellow

Set-Location (Join-Path $projectRoot "arivuclaw")
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed!" -ForegroundColor Red
} else {
    Write-Host "  Dependencies installed." -ForegroundColor Green
}
Set-Location $projectRoot

# -- 6. Verify no Arivumaiyam references remain --
Write-Host ""
Write-Host "[6/6] Verifying clean state..." -ForegroundColor Yellow

$searchPaths = @("arivuclaw\src", "arivuclaw\config", "arivuclaw\scripts")
$filesToCheck = @()
foreach ($sp in $searchPaths) {
    $fullSp = Join-Path $projectRoot $sp
    if (Test-Path $fullSp) {
        $filesToCheck += Get-ChildItem -Path $fullSp -Recurse -Include *.ts,*.json,*.ps1,*.sh,*.bat -ErrorAction SilentlyContinue
    }
}

if ($filesToCheck.Count -gt 0) {
    $remaining = Select-String -Path $filesToCheck -Pattern "arivumaiyam" -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "  WARNING: Found leftover references:" -ForegroundColor Red
        $remaining | ForEach-Object { Write-Host "    $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    } else {
        Write-Host "  CLEAN - zero Arivumaiyam references found." -ForegroundColor Green
    }
} else {
    Write-Host "  No files to check." -ForegroundColor Gray
}

# -- Done --
Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  ArivuClaw - Revert Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    cd arivuclaw" -ForegroundColor Gray
Write-Host "    npx ts-node src/cli/index.ts onboard    # Re-run setup" -ForegroundColor Gray
Write-Host "    npx ts-node src/cli/index.ts start       # Start ArivuClaw" -ForegroundColor Gray
Write-Host ""
