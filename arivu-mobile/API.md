# Arivu Mobile - API Documentation

**Base URL:** `http://localhost:5050`

## Authentication

Protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/register

**Body:**
```json
{
  "username": "user1",
  "password": "MyPassword123"
}
```

### POST /api/auth/login

**Body:**
```json
{
  "username": "user1",
  "password": "MyPassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "username": "user1" }
}
```

---

## Chat

### POST /api/chat
Send message to AI (Neural Brain API with MiniMax fallback). *Requires auth.*

**Body:**
```json
{
  "message": "What is the weather today?",
  "conversation_id": 1
}
```

### POST /api/quick-action
Quick AI actions. *Requires auth.*

**Body:**
```json
{
  "action": "translate",
  "text": "Hello world",
  "target_language": "Tamil"
}
```

**Actions:** `translate`, `summarize`, `explain`

---

## Conversations

### GET /api/conversations
List all conversations. *Requires auth.*

### DELETE /api/conversations
Delete all conversations. *Requires auth.*

---

## Preferences

### GET /api/preferences
Get user preferences. *Requires auth.*

### PUT /api/preferences
Update preferences. *Requires auth.*

**Body:**
```json
{
  "theme": "dark",
  "font_size": "medium",
  "language": "en"
}
```

---

## Health

### GET /health
Health check. *No auth required.*

---

## Voice

### POST /api/voice-to-text
Voice transcription (stub). *Requires auth.*
