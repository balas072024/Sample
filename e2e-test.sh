#!/bin/bash
# 50-scenario E2E test across all apps
TOTAL=0; PASS=0

check() {
  TOTAL=$((TOTAL+1))
  if echo "$2" | grep -qi "$3"; then
    PASS=$((PASS+1)); echo "  $1: PASS"
  else
    echo "  $1: FAIL"; echo "    Response: $(echo $2 | head -c 120)"
  fi
}

# ======= 1. FAMILY HUB (3000) — 8 scenarios =======
echo "=== Family Hub ==="
cd /home/user/family-hub && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

T=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"bala","password":"Family@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "1.Chat" "$(curl -s -X POST http://localhost:3000/api/messages -H "$H" -H "Content-Type: application/json" -d '{"content":"Morning!"}')" "content"
check "2.Shopping" "$(curl -s -X POST http://localhost:3000/api/shopping -H "$H" -H "Content-Type: application/json" -d '{"name":"Grocery"}')" "list"
check "3.Task+Priority" "$(curl -s -X POST http://localhost:3000/api/todos -H "$H" -H "Content-Type: application/json" -d '{"text":"School pickup","priority":"urgent"}')" "urgent"
check "4.Journal+Mood" "$(curl -s -X POST http://localhost:3000/api/journal -H "$H" -H "Content-Type: application/json" -d '{"title":"Park day","mood":"excited"}')" "excited"
check "5.Event" "$(curl -s -X POST http://localhost:3000/api/events -H "$H" -H "Content-Type: application/json" -d '{"title":"Birthday","event_date":"2026-05-01"}')" "event"
check "6.Note" "$(curl -s -X POST http://localhost:3000/api/notes -H "$H" -H "Content-Type: application/json" -d '{"title":"Recipe","content":"Biryani steps"}')" "note"
check "7.MultiUser" "$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"wife","password":"Family@2024"}')" "token"
check "8.Health" "$(curl -s http://localhost:3000/api/health)" "ok"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

# ======= 2. ARIVUWATCH (9000) — 7 scenarios =======
echo "=== ArivuWatch ==="
cd /home/user/Sample/arivuwatch && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

T=$(curl -s -X POST http://localhost:9000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Watch@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "9.Login" "$T" "ey"
check "10.AddService" "$(curl -s -X POST http://localhost:9000/api/services -H "$H" -H "Content-Type: application/json" -d '{"name":"Self","port":9000,"health_path":"/api/health"}')" "name"
check "11.PinnedNote" "$(curl -s -X POST http://localhost:9000/api/notes -H "$H" -H "Content-Type: application/json" -d '{"title":"Alert log","pinned":true}')" "pinned"
check "12.UrgentTodo" "$(curl -s -X POST http://localhost:9000/api/todos -H "$H" -H "Content-Type: application/json" -d '{"title":"Scale DB","priority":"urgent"}')" "urgent"
VT=$(curl -s -X POST http://localhost:9000/api/auth/login -H "Content-Type: application/json" -d '{"username":"viewer","password":"Watch@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
check "13.RBAC" "$(curl -s -X POST http://localhost:9000/api/services -H "Authorization: Bearer $VT" -H "Content-Type: application/json" -d '{"name":"X","port":1}')" "admin"
check "14.StatusHistory" "$(curl -s http://localhost:9000/api/status/history -H "$H")" "history"
check "15.Health" "$(curl -s http://localhost:9000/api/health)" "ok"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

# ======= 3. VAULT BROWSER (4100) — 7 scenarios =======
echo "=== Vault Browser ==="
cd /home/user/Sample/vault-browser && rm -f data/*.db
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

VR=$(curl -s -X POST http://localhost:4100/api/vault/create -H "Content-Type: application/json" -d '{"name":"Work","master_password":"Master123!"}')
VID=$(echo $VR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).vault.id" 2>/dev/null)
UR=$(curl -s -X POST http://localhost:4100/api/vault/unlock -H "Content-Type: application/json" -d "{\"vault_id\":\"$VID\",\"master_password\":\"Master123!\"}")
VT=$(echo $UR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)

check "16.CreateVault" "$VR" "vault"
check "17.Unlock" "$UR" "token"
curl -s -X POST http://localhost:4100/api/vault/entries -H "Authorization: Bearer $VT" -H "x-master-key: Master123!" -H "Content-Type: application/json" -d '{"title":"AWS","username":"admin","password":"aws-secret","category":"dev"}' >/dev/null
check "18.Decrypt" "$(curl -s http://localhost:4100/api/vault/entries -H "Authorization: Bearer $VT" -H "x-master-key: Master123!")" "aws-secret"
check "19.GenPwd" "$(curl -s -X POST http://localhost:4100/api/vault/generate -H "Content-Type: application/json" -d '{"length":24}')" "password"
check "20.Strength" "$(curl -s -X POST http://localhost:4100/api/vault/check-strength -H "Content-Type: application/json" -d '{"password":"Str0ng!Pass#2024"}')" "strong\|excellent"
check "21.Export" "$(curl -s http://localhost:4100/api/vault/export -H "Authorization: Bearer $VT")" "export_version"
check "22.Health" "$(curl -s http://localhost:4100/api/health)" "ok"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

# ======= 4. OPSWATCH (3001) — 7 scenarios =======
echo "=== OpsWatch ==="
cd /home/user/Sample/opswatch-unified && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

T=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"OpsWatch@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "23.Login" "$T" "ey"
check "24.AddSvc" "$(curl -s -X POST http://localhost:3001/api/services -H "$H" -H "Content-Type: application/json" -d '{"name":"Self","host":"localhost","port":3001,"health_path":"/api/health"}')" "name"
check "25.Alert" "$(curl -s -X POST http://localhost:3001/api/alerts -H "$H" -H "Content-Type: application/json" -d '{"title":"HighCPU","severity":"critical","service_name":"Self"}')" "alert"
check "26.ListAlerts" "$(curl -s http://localhost:3001/api/alerts -H "$H")" "alerts"
check "27.Stats" "$(curl -s http://localhost:3001/api/dashboard/stats -H "$H")" "total"
check "28.StatusCheck" "$(curl -s http://localhost:3001/api/status -H "$H")" "results\|services"
check "29.Health" "$(curl -s http://localhost:3001/api/health)" "ok"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

# ======= 5. OPSSHIFTPRO (4000) — 7 scenarios =======
echo "=== OpsShiftPro ==="
cd /home/user/Sample/opsshiftpro && rm -f data/*.db
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

T=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"username":"operator1","password":"Shift@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

SR=$(curl -s -X POST http://localhost:4000/api/shifts -H "$H" -H "Content-Type: application/json" -d '{"operator_name":"Alex","start_time":"2026-03-22T08:00:00Z"}')
SID=$(echo $SR | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).shift.id" 2>/dev/null)
check "30.CreateShift" "$SR" "active"
check "31.HandoverItem" "$(curl -s -X POST http://localhost:4000/api/shifts/$SID/items -H "$H" -H "Content-Type: application/json" -d '{"type":"issue","description":"Server lag"}')" "item"
check "32.Checklist" "$(curl -s -X POST http://localhost:4000/api/checklists -H "$H" -H "Content-Type: application/json" -d "{\"name\":\"Pre\",\"shift_id\":$SID,\"items\":[{\"label\":\"Verify\"}]}")" "checklist"
check "33.CompleteShift" "$(curl -s -X PATCH http://localhost:4000/api/shifts/$SID -H "$H" -H "Content-Type: application/json" -d '{"status":"completed"}')" "completed"
check "34.Report" "$(curl -s http://localhost:4000/api/shifts/$SID/report -H "$H")" "summary"
check "35.Export" "$(curl -s http://localhost:4000/api/shifts/export -H "$H")" "shifts"
check "36.Health" "$(curl -s http://localhost:4000/api/health)" "healthy"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

# ======= 6. NEURAL BRAIN (8200) — 7 scenarios =======
echo "=== Neural Brain ==="
cd /home/user/Sample/neural-brain-api && rm -f data/*.db
node server/src/seed.js 2>/dev/null
node server/src/index.js &>/dev/null &
PID=$!; sleep 2

T=$(curl -s -X POST http://localhost:8200/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Neural@2024"}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token" 2>/dev/null)
H="Authorization: Bearer $T"

check "37.Login" "$T" "ey"
check "38.Positive" "$(curl -s -X POST http://localhost:8200/api/analyze/sentiment -H "$H" -H "Content-Type: application/json" -d '{"text":"Amazing and wonderful"}')" "positive"
check "39.Negative" "$(curl -s -X POST http://localhost:8200/api/analyze/sentiment -H "$H" -H "Content-Type: application/json" -d '{"text":"Terrible and awful"}')" "negative"
check "40.Prompt" "$(curl -s -X POST http://localhost:8200/api/prompts -H "$H" -H "Content-Type: application/json" -d '{"title":"Review","content":"Check code","category":"dev"}')" "prompt"
check "41.ListPrompts" "$(curl -s http://localhost:8200/api/prompts -H "$H")" "prompts"
check "42.Conversation" "$(curl -s -X POST http://localhost:8200/api/conversations -H "$H" -H "Content-Type: application/json" -d '{"title":"Test Chat"}')" "conversation\|id"
check "43.Health" "$(curl -s http://localhost:8200/api/health)" "healthy\|ok"
kill $PID 2>/dev/null; wait $PID 2>/dev/null

echo ""
echo "========================================="
echo "  Node.js Apps: $PASS/$TOTAL passed"
echo "========================================="
