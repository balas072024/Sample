@echo off
setlocal enabledelayedexpansion

set REPORT=%USERPROFILE%\Desktop\laptop-report.txt
echo ============================================== > "%REPORT%"
echo   LAPTOP FULL SYSTEM REPORT                    >> "%REPORT%"
echo   Generated: %date% %time%                     >> "%REPORT%"
echo   Computer: %COMPUTERNAME%                      >> "%REPORT%"
echo   User: %USERNAME%                              >> "%REPORT%"
echo ============================================== >> "%REPORT%"

echo.
echo [1/12] System info...
echo. >> "%REPORT%"
echo === SYSTEM INFO === >> "%REPORT%"
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory" /C:"Available Physical Memory" /C:"Processor" >> "%REPORT%"

echo. >> "%REPORT%"
echo === DISK SPACE === >> "%REPORT%"
wmic logicaldisk get name,size,freespace,filesystem /format:list >> "%REPORT%" 2>nul

echo.
echo [2/12] Listening ports...
echo. >> "%REPORT%"
echo === ALL LISTENING PORTS === >> "%REPORT%"
netstat -ano | findstr LISTENING >> "%REPORT%"

echo. >> "%REPORT%"
echo === PORT TO PROCESS MAPPING === >> "%REPORT%"
powershell -Command "Get-NetTCPConnection -State Listen | Select-Object LocalPort,OwningProcess,@{Name='Process';Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Sort-Object LocalPort | Format-Table -AutoSize | Out-String -Width 200" >> "%REPORT%" 2>nul

echo.
echo [3/12] Running processes...
echo. >> "%REPORT%"
echo === KEY RUNNING PROCESSES === >> "%REPORT%"
powershell -Command "Get-Process | Where-Object {$_.ProcessName -match 'node|python|java|docker|postgres|mysql|redis|mongo|nginx|apache|ollama|cloudflare|code|ts-node|pm2|git'} | Select-Object Id,ProcessName,Path | Format-Table -AutoSize | Out-String -Width 300" >> "%REPORT%" 2>nul

echo.
echo [4/12] Installed software...
echo. >> "%REPORT%"
echo === INSTALLED SOFTWARE (Key Dev Tools) === >> "%REPORT%"
powershell -Command "Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*,HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -match 'Node|Python|Java|Docker|Git|VS Code|Visual Studio|PostgreSQL|MySQL|MongoDB|Redis|Ollama|VMware|WSL|Cloudflare|Go|Rust|Ruby|.NET'} | Select-Object DisplayName,DisplayVersion | Sort-Object DisplayName | Format-Table -AutoSize | Out-String -Width 200" >> "%REPORT%" 2>nul

echo.
echo [5/12] Node.js / npm...
echo. >> "%REPORT%"
echo === NODE.JS and NPM === >> "%REPORT%"
echo Node version: >> "%REPORT%"
node --version >> "%REPORT%" 2>nul
echo npm version: >> "%REPORT%"
npm --version >> "%REPORT%" 2>nul
echo. >> "%REPORT%"
echo Global npm packages: >> "%REPORT%"
npm list -g --depth=0 >> "%REPORT%" 2>nul

echo.
echo [6/12] Python...
echo. >> "%REPORT%"
echo === PYTHON === >> "%REPORT%"
python --version >> "%REPORT%" 2>nul
pip list >> "%REPORT%" 2>nul

echo.
echo [7/12] Docker...
echo. >> "%REPORT%"
echo === DOCKER === >> "%REPORT%"
docker --version >> "%REPORT%" 2>nul
echo. >> "%REPORT%"
echo Running containers: >> "%REPORT%"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" >> "%REPORT%" 2>nul
echo. >> "%REPORT%"
echo All containers: >> "%REPORT%"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" >> "%REPORT%" 2>nul

echo.
echo [8/12] Cloudflare tunnels...
echo. >> "%REPORT%"
echo === CLOUDFLARE TUNNELS === >> "%REPORT%"
cloudflared tunnel list >> "%REPORT%" 2>nul
echo. >> "%REPORT%"
echo Cloudflare config: >> "%REPORT%"
if exist "%USERPROFILE%\.cloudflared\config.yml" (
    type "%USERPROFILE%\.cloudflared\config.yml" >> "%REPORT%"
) else (
    echo No config.yml found >> "%REPORT%"
)

echo.
echo [9/12] Projects on Desktop...
echo. >> "%REPORT%"
echo === PROJECTS ON DESKTOP === >> "%REPORT%"
for /d %%D in (%USERPROFILE%\Desktop\*) do (
    echo. >> "%REPORT%"
    echo --- %%~nxD --- >> "%REPORT%"
    if exist "%%D\package.json" (
        echo   [Node.js project] >> "%REPORT%"
        powershell -Command "(Get-Content '%%D\package.json' | ConvertFrom-Json | Select-Object name,version,description) | Format-List | Out-String" >> "%REPORT%" 2>nul
    )
    if exist "%%D\requirements.txt" echo   [Python project] >> "%REPORT%"
    if exist "%%D\Cargo.toml" echo   [Rust project] >> "%REPORT%"
    if exist "%%D\go.mod" echo   [Go project] >> "%REPORT%"
    if exist "%%D\pom.xml" echo   [Java/Maven project] >> "%REPORT%"
    if exist "%%D\docker-compose.yml" echo   [Has docker-compose] >> "%REPORT%"
    if exist "%%D\.env" echo   [Has .env file] >> "%REPORT%"
    if exist "%%D\.git" echo   [Git repo] >> "%REPORT%"
    dir /b "%%D" >> "%REPORT%" 2>nul
)

echo.
echo [10/12] Projects in common locations...
echo. >> "%REPORT%"
echo === PROJECTS IN OTHER LOCATIONS === >> "%REPORT%"
for %%L in ("%USERPROFILE%\Documents" "%USERPROFILE%\Projects" "%USERPROFILE%\repos" "%USERPROFILE%\dev" "C:\Projects" "C:\dev") do (
    if exist "%%~L" (
        echo. >> "%REPORT%"
        echo -- %%~L -- >> "%REPORT%"
        for /d %%D in ("%%~L\*") do (
            if exist "%%D\package.json" echo   [Node] %%~nxD >> "%REPORT%"
            if exist "%%D\requirements.txt" echo   [Python] %%~nxD >> "%REPORT%"
            if exist "%%D\.git" echo   [Git] %%~nxD >> "%REPORT%"
        )
    )
)

echo.
echo [11/12] ArivuClaw config...
echo. >> "%REPORT%"
echo === ARIVUMAIYAM AI CONFIG === >> "%REPORT%"
if exist "%USERPROFILE%\Desktop\Sample\arivuclaw\.env" (
    echo .env file (keys redacted): >> "%REPORT%"
    powershell -Command "Get-Content '%USERPROFILE%\Desktop\Sample\arivuclaw\.env' | ForEach-Object { if($_ -match '=') { $parts = $_.Split('=',2); if($parts[1].Length -gt 8) { $parts[0] + '=' + $parts[1].Substring(0,4) + '***' + $parts[1].Substring($parts[1].Length-4) } else { $_ } } else { $_ } }" >> "%REPORT%" 2>nul
)
echo. >> "%REPORT%"
if exist "%USERPROFILE%\Desktop\Sample\arivuclaw\.arivuclaw\config.json" (
    echo config.json: >> "%REPORT%"
    powershell -Command "Get-Content '%USERPROFILE%\Desktop\Sample\arivuclaw\.arivuclaw\config.json' | ForEach-Object { $_ -replace '(token|key|secret|password)([\"'':=\s]+)([^\s\"'']{4})([^\s\"'']+)([^\s\"'']{4})', '${1}${2}${3}***${5}' }" >> "%REPORT%" 2>nul
)

echo.
echo [12/12] WSL distros and services...
echo. >> "%REPORT%"
echo === WSL === >> "%REPORT%"
wsl --list --verbose >> "%REPORT%" 2>nul

echo. >> "%REPORT%"
echo === WINDOWS SERVICES (Running Dev Services) === >> "%REPORT%"
powershell -Command "Get-Service | Where-Object {$_.Status -eq 'Running' -and $_.DisplayName -match 'SQL|Postgres|MySQL|Mongo|Redis|Docker|SSH|Apache|Nginx|IIS|Ollama|Node'} | Select-Object Name,DisplayName,Status | Format-Table -AutoSize | Out-String -Width 200" >> "%REPORT%" 2>nul

echo. >> "%REPORT%"
echo === SCHEDULED TASKS (Custom) === >> "%REPORT%"
schtasks /query /fo TABLE /nh | findstr /V /C:"Microsoft" /C:"Google" /C:"Adobe" | findstr /V /C:"MicrosoftEdge" >> "%REPORT%" 2>nul

echo.
echo ============================================
echo   DONE! Report saved to:
echo   %REPORT%
echo ============================================
echo.
pause
