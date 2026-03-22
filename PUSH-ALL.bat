@echo off
echo ============================================
echo   Arivu Ecosystem - Push All Repos
echo ============================================
echo.

set BASE=%~dp0
set PARENT=%BASE%..

echo Step 1: Pull latest from Sample repo...
cd /d "%BASE%"
git pull origin claude/create-arivuclaw-tool-RXPb9
echo.

:: ---- Family Hub ----
echo [1/10] family-hub
if not exist "%PARENT%\family-hub" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/family-hub.git
)
xcopy /E /Y /I "%BASE%family-hub\*" "%PARENT%\family-hub\" >nul 2>&1
cd /d "%PARENT%\family-hub"
git add -A
git commit -m "Full rebuild: real-time chat, WebSocket, JWT auth, 53 tests, Cloudflare ready"
git push origin main
echo.

:: ---- ArivuWatch ----
echo [2/10] arivuwatch
if not exist "%PARENT%\arivuwatch" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/arivuwatch.git
)
xcopy /E /Y /I "%BASE%arivuwatch\*" "%PARENT%\arivuwatch\" >nul 2>&1
cd /d "%PARENT%\arivuwatch"
git add -A
git commit -m "Full rebuild: monitoring dashboard, JWT auth, 22 tests, Cloudflare ready"
git push origin main
echo.

:: ---- Vault Browser ----
echo [3/10] vault-browser
if not exist "%PARENT%\vault-browser" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/vault-browser.git
)
xcopy /E /Y /I "%BASE%vault-browser\*" "%PARENT%\vault-browser\" >nul 2>&1
cd /d "%PARENT%\vault-browser"
git add -A
git commit -m "Full rebuild: AES-256-GCM encryption, password manager, 14 tests, Cloudflare ready"
git push origin main
echo.

:: ---- Valluvan Astrologer ----
echo [4/10] valluvan-astrologer
if not exist "%PARENT%\valluvan-astrologer" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/valluvan-astrologer.git
)
xcopy /E /Y /I "%BASE%valluvan-astrologer\*" "%PARENT%\valluvan-astrologer\" >nul 2>&1
cd /d "%PARENT%\valluvan-astrologer"
git add -A
git commit -m "Full rebuild: Vedic astrology SaaS, 12 Tamil rasis, JWT auth, Cloudflare ready"
git push origin main
echo.

:: ---- OpsWatch Unified ----
echo [5/10] opswatch-unified
if not exist "%PARENT%\opswatch-unified" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/opswatch-unified.git
)
xcopy /E /Y /I "%BASE%opswatch-unified\*" "%PARENT%\opswatch-unified\" >nul 2>&1
cd /d "%PARENT%\opswatch-unified"
git add -A
git commit -m "Full rebuild: unified monitoring, alerts, incidents, 32 tests, Cloudflare ready"
git push origin main
echo.

:: ---- OpsShiftPro ----
echo [6/10] opsshiftpro
if not exist "%PARENT%\opsshiftpro" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/opsshiftpro.git
)
xcopy /E /Y /I "%BASE%opsshiftpro\*" "%PARENT%\opsshiftpro\" >nul 2>&1
cd /d "%PARENT%\opsshiftpro"
git add -A
git commit -m "Full rebuild: shift handover SaaS, checklists, reports, 22 tests, Cloudflare ready"
git push origin main
echo.

:: ---- Kaashmikhaa Gateway ----
echo [7/10] kaashmikhaa-gateway
if not exist "%PARENT%\kaashmikhaa-gateway" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/kaashmikhaa-gateway.git
)
xcopy /E /Y /I "%BASE%kaashmikhaa-gateway\*" "%PARENT%\kaashmikhaa-gateway\" >nul 2>&1
cd /d "%PARENT%\kaashmikhaa-gateway"
git add -A
git commit -m "Full rebuild: API gateway, service registry, analytics, 28 tests, Cloudflare ready"
git push origin main
echo.

:: ---- ClawArivu ----
echo [8/10] clawarivu
if not exist "%PARENT%\clawarivu" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/clawarivu.git
)
xcopy /E /Y /I "%BASE%arivuclaw\*" "%PARENT%\clawarivu\" >nul 2>&1
cd /d "%PARENT%\clawarivu"
git add -A
git commit -m "Fix auto-restart loop, add unhandledRejection handler, Cloudflare ready"
git push origin main
echo.

:: ---- Neural Brain API ----
echo [9/10] neural-brain-api
if not exist "%PARENT%\neural-brain-api" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/neural-brain-api.git
)
xcopy /E /Y /I "%BASE%neural-brain-api\*" "%PARENT%\neural-brain-api\" >nul 2>&1
cd /d "%PARENT%\neural-brain-api"
git add -A
git commit -m "Full rebuild: AI backend, conversations, sentiment analysis, 25 tests, Cloudflare ready"
git push origin main
echo.

:: ---- Arivu Mobile ----
echo [10/10] arivu-mobile
if not exist "%PARENT%\arivu-mobile" (
    cd /d "%PARENT%"
    git clone https://github.com/balas072024/arivu-mobile.git
)
xcopy /E /Y /I "%BASE%arivu-mobile\*" "%PARENT%\arivu-mobile\" >nul 2>&1
cd /d "%PARENT%\arivu-mobile"
git add -A
git commit -m "Full rebuild: mobile AI assistant, PWA, touch UI, 31 tests, Cloudflare ready"
git push origin main
echo.

echo ============================================
echo   All 10 repos pushed to GitHub!
echo ============================================
pause
