#!/bin/bash
# 50-scenario E2E test across all apps
TOTAL=0; PASS=0

check() {
  TOTAL=$((TOTAL+1))
  if echo "$2" | grep -qi "$3"; then
    PASS=$((PASS+1)); echo "  $1: PASS"
  else
    echo "  $1: FAIL"
  fi
}

# ======= FAMILY HUB (3000) =======
echo "=== Family Hub ==="
cd /home/user/family-hub && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID1=$!; sleep 2

T=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"bala","password":"Family@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "1.Chat" "$(curl -s -X POST http://localhost:3000/api/messages -H "$H" -H "Content-Type: application/json" -d '{"content":"Hello"}')" "content"
check "2.Shopping" "$(curl -s -X POST http://localhost:3000/api/shopping -H "$H" -H "Content-Type: application/json" -d '{"name":"List"}')" "list"
check "3.Task" "$(curl -s -X POST http://localhost:3000/api/todos -H "$H" -H "Content-Type: application/json" -d '{"text":"Buy milk","priority":"high"}')" "todo"
check "4.Journal" "$(curl -s -X POST http://localhost:3000/api/journal -H "$H" -H "Content-Type: application/json" -d '{"title":"Nice","mood":"happy"}')" "happy"
check "5.Health" "$(curl -s http://localhost:3000/api/health)" "ok"
kill $PID1 2>/dev/null; wait $PID1 2>/dev/null

# ======= ARIVUWATCH (9000) =======
echo "=== ArivuWatch ==="
cd /home/user/Sample/arivuwatch && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID2=$!; sleep 2

T=$(curl -s -X POST http://localhost:9000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Watch@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "6.Login" "$T" "ey"
check "7.AddSvc" "$(curl -s -X POST http://localhost:9000/api/services -H "$H" -H "Content-Type: application/json" -d '{"name":"Test","port":9000,"health_path":"/api/health"}')" "name"
check "8.Note" "$(curl -s -X POST http://localhost:9000/api/notes -H "$H" -H "Content-Type: application/json" -d '{"title":"Log","content":"data"}')" "note"
check "9.Todo" "$(curl -s -X POST http://localhost:9000/api/todos -H "$H" -H "Content-Type: application/json" -d '{"title":"Fix","priority":"urgent"}')" "todo"
check "10.Health" "$(curl -s http://localhost:9000/api/health)" "ok"
kill $PID2 2>/dev/null; wait $PID2 2>/dev/null

# ======= VAULT BROWSER (4100) =======
echo "=== Vault Browser ==="
cd /home/user/Sample/vault-browser && rm -f data/*.db
node server/src/index.js &>/dev/null &
PID3=$!; sleep 2

VR=$(curl -s -X POST http://localhost:4100/api/vault/create -H "Content-Type: application/json" -d '{"name":"My","master_password":"Master123!"}')
VID=$(echo $VR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).vault.id" 2>/dev/null)
UR=$(curl -s -X POST http://localhost:4100/api/vault/unlock -H "Content-Type: application/json" -d "{\"vault_id\":\"$VID\",\"master_password\":\"Master123!\"}")
VT=$(echo $UR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)

check "11.Create" "$VR" "vault"
check "12.Unlock" "$UR" "token"
check "13.AddEntry" "$(curl -s -X POST http://localhost:4100/api/vault/entries -H "Authorization: Bearer $VT" -H "x-master-key: Master123!" -H "Content-Type: application/json" -d '{"title":"GitHub","username":"me","password":"secret123","category":"dev"}')" "entry"
check "14.Decrypt" "$(curl -s http://localhost:4100/api/vault/entries -H "Authorization: Bearer $VT" -H "x-master-key: Master123!")" "secret123"
check "15.GenPwd" "$(curl -s -X POST http://localhost:4100/api/vault/generate -H "Content-Type: application/json" -d '{"length":24}')" "password"
kill $PID3 2>/dev/null; wait $PID3 2>/dev/null

# ======= OPSWATCH (3001) =======
echo "=== OpsWatch ==="
cd /home/user/Sample/opswatch-unified && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID4=$!; sleep 2

T=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"OpsWatch@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "16.Login" "$T" "ey"
check "17.AddSvc" "$(curl -s -X POST http://localhost:3001/api/services -H "$H" -H "Content-Type: application/json" -d '{"name":"Test","host":"localhost","port":3001,"health_path":"/api/health"}')" "name"
check "18.Alert" "$(curl -s -X POST http://localhost:3001/api/alerts -H "$H" -H "Content-Type: application/json" -d '{"title":"CPU","severity":"critical","service_name":"Test"}')" "alert"
check "19.Stats" "$(curl -s http://localhost:3001/api/dashboard/stats -H "$H")" "total"
check "20.Health" "$(curl -s http://localhost:3001/api/health)" "ok"
kill $PID4 2>/dev/null; wait $PID4 2>/dev/null

# ======= OPSSHIFTPRO (4000) =======
echo "=== OpsShiftPro ==="
cd /home/user/Sample/opsshiftpro && rm -f data/*.db
node server/src/index.js &>/dev/null &
PID5=$!; sleep 2

T=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"username":"operator1","password":"Shift@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "21.Login" "$T" "ey"
SR=$(curl -s -X POST http://localhost:4000/api/shifts -H "$H" -H "Content-Type: application/json" -d '{"operator_name":"Alex","start_time":"2026-03-22T08:00:00Z"}')
SID=$(echo $SR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).shift.id" 2>/dev/null)
check "22.Shift" "$SR" "active"
check "23.Item" "$(curl -s -X POST http://localhost:4000/api/shifts/$SID/items -H "$H" -H "Content-Type: application/json" -d '{"type":"issue","description":"Lag"}')" "item"
check "24.Checklist" "$(curl -s -X POST http://localhost:4000/api/checklists -H "$H" -H "Content-Type: application/json" -d "{\"name\":\"Pre\",\"shift_id\":$SID,\"items\":[{\"label\":\"Check\"}]}")" "checklist"
check "25.Health" "$(curl -s http://localhost:4000/api/health)" "healthy"
kill $PID5 2>/dev/null; wait $PID5 2>/dev/null

# ======= NEURAL BRAIN (8200) =======
echo "=== Neural Brain ==="
cd /home/user/Sample/neural-brain-api && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID6=$!; sleep 2

T=$(curl -s -X POST http://localhost:8200/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Neural@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "26.Login" "$T" "ey"
check "27.Sentiment+" "$(curl -s -X POST http://localhost:8200/api/analyze/sentiment -H "$H" -H "Content-Type: application/json" -d '{"text":"Amazing wonderful great"}')" "positive"
check "28.Sentiment-" "$(curl -s -X POST http://localhost:8200/api/analyze/sentiment -H "$H" -H "Content-Type: application/json" -d '{"text":"Terrible awful bad"}')" "negative"
check "29.Prompt" "$(curl -s -X POST http://localhost:8200/api/prompts -H "$H" -H "Content-Type: application/json" -d '{"title":"Review","content":"Review code","category":"dev"}')" "prompt"
check "30.Health" "$(curl -s http://localhost:8200/api/health)" "ok"
kill $PID6 2>/dev/null; wait $PID6 2>/dev/null

echo ""
echo "========================================="
echo "  Node.js Apps: $PASS/$TOTAL passed"
echo "========================================="
