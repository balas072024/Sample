# Neural Brain API - API Documentation

**Base URL:** `http://localhost:8200`

## Authentication

All protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

---

## Health

### GET /api/health
Server health check with user count.

**Response (200):**
```json
{
  "status": "ok",
  "users": 3
}
```

---

## Auth

### POST /api/auth/login

**Body:**
```json
{
  "username": "demo",
  "password": "demo123"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 2,
    "username": "demo",
    "role": "user"
  }
}
```

### GET /api/auth/me
Get authenticated user profile. *Requires auth.*

---

## Conversations

### GET /api/conversations
List all conversations for the authenticated user. *Requires auth.*

### POST /api/conversations
Create a new conversation. *Requires auth.*

**Body:**
```json
{
  "title": "My Chat"
}
```

### GET /api/conversations/:id/messages
Get all messages in a conversation. *Requires auth.*

### DELETE /api/conversations/:id
Delete a conversation. *Requires auth.*

### GET /api/conversations/:id/export
Export conversation as JSON. *Requires auth.*

---

## Chat

### POST /api/chat
Send a message to the AI. *Requires auth. Requires MINIMAX_API_KEY.*

**Body:**
```json
{
  "conversation_id": 1,
  "message": "Hello, how are you?"
}
```

**Response (200):**
```json
{
  "reply": "I'm doing well! How can I help you today?",
  "tokens_used": 42,
  "conversation_id": 1
}
```

---

## Text Analysis

### POST /api/analyze/summarize
Summarize text. *Requires auth. Requires MINIMAX_API_KEY.*

**Body:**
```json
{
  "text": "Long text to summarize...",
  "max_length": 100
}
```

**Response (200):**
```json
{
  "summary": "Summarized text...",
  "tokens_used": 25
}
```

### POST /api/analyze/translate
Translate text. *Requires auth. Requires MINIMAX_API_KEY.*

**Body:**
```json
{
  "text": "Hello world",
  "target_language": "Tamil",
  "source_language": "English"
}
```

**Response (200):**
```json
{
  "translation": "வணக்கம் உலகம்",
  "source_language": "English",
  "target_language": "Tamil",
  "tokens_used": 15
}
```

### POST /api/analyze/sentiment
Sentiment analysis (built-in, no API key required). *Requires auth.*

**Body:**
```json
{
  "text": "I love this product, it's amazing!"
}
```

**Response (200):**
```json
{
  "sentiment": "positive",
  "confidence": 0.85,
  "score": 3,
  "positive_words": ["love", "amazing"],
  "negative_words": []
}
```

---

## Prompts Library

### GET /api/prompts
List prompts. *Requires auth.*

**Query params:** `category` (optional filter)

### POST /api/prompts
Create a new prompt. *Requires auth.*

**Body:**
```json
{
  "title": "Code Reviewer",
  "content": "Review this code for bugs...",
  "category": "development",
  "is_public": true
}
```

### POST /api/prompts/:id/use
Increment usage count. *Requires auth.*

### DELETE /api/prompts/:id
Delete a prompt. *Requires auth.*

---

## Usage Statistics

### GET /api/usage/stats
Get user usage statistics. *Requires auth.*

**Response (200):**
```json
{
  "total_messages": 42,
  "total_tokens": 1500,
  "conversations": 5,
  "daily_activity": [...]
}
```
