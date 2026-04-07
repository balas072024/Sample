# ArivuClaw - API Documentation

## Dashboard API

**Base URL:** `http://localhost:7890` (configurable)

### GET /api/health
Gateway health status.

### GET /api/skills
List all installed skills.

### GET /api/channels
Channel connection status.

### GET /api/sessions
Active sessions list.

### GET /api/memory/stats
Memory/vector store statistics.

### GET /api/providers
Configured LLM providers.

### GET /api/config
Current configuration.

### POST /api/restart
Restart the gateway.

---

## Web Channel API

**Base URL:** `http://localhost:3000` (configurable)

### GET /health
Channel health check.

**Response (200):**
```json
{
  "status": "ok",
  "clients": 0
}
```

### POST /api/message
Send a message via REST.

**Body:**
```json
{
  "userId": "user-123",
  "content": "Hello ArivuClaw"
}
```

**Response (200):**
```json
{
  "content": "Hello! How can I help you today?",
  "metadata": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "tokens": 42
  }
}
```

### WebSocket: wss://localhost:3000
Real-time WebSocket connection.

**Send:**
```json
{
  "content": "Your message"
}
```

**Receive:**
```json
{
  "type": "message",
  "content": "AI response"
}
```

---

## System Commands (All Channels)

| Command | Description |
|---------|-------------|
| `/restart` | Restart the gateway |
| `/status` | Show gateway status and statistics |
| `/ping` | Check if gateway is alive |

---

## Web UI

- `GET /` or `/dashboard` - Web UI dashboard (HTML)
