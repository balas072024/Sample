#!/bin/bash
# Start all Arivu Ecosystem services
echo "Starting Arivu Ecosystem..."

# Node.js apps
cd family-hub && npm start &
cd arivuwatch && npm start &
cd vault-browser && npm start &
cd opswatch-unified && npm start &
cd opsshiftpro && npm start &
cd neural-brain-api && npm start &

# Python apps
cd valluvan-astrologer && python3 app.py &
cd kaashmikhaa-gateway && python3 app.py &
cd arivu-mobile && python3 app.py &

echo ""
echo "All services starting..."
echo "  Family Hub:        http://localhost:3000"
echo "  ArivuWatch:        http://localhost:9000"
echo "  Vault Browser:     http://localhost:4100"
echo "  Valluvan:          http://localhost:5000"
echo "  OpsWatch:          http://localhost:3001"
echo "  OpsShiftPro:       http://localhost:4000"
echo "  Kaashmikhaa:       http://localhost:5013"
echo "  Neural Brain:      http://localhost:8200"
echo "  Arivu Mobile:      http://localhost:5050"
echo ""
echo "Press Ctrl+C to stop all services"
wait
