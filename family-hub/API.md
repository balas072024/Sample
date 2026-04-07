# Family Hub - API Documentation

**Base URL:** `http://localhost:3000`

## Authentication

Protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/login

**Body:**
```json
{
  "username": "bala",
  "password": "Family@2024"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "username": "bala", "role": "admin" }
}
```

### POST /api/auth/register
Register a new family member. *Admin only.*

### GET /api/auth/me
Get current user. *Requires auth.*

### POST /api/auth/change-password
Change password. *Requires auth.*

---

## Chat (Real-time)

### GET /api/chat/messages
Get chat messages. *Requires auth.*

**Query params:** `limit`, `offset`

### POST /api/chat/messages
Send a chat message. *Requires auth.*

**Body:**
```json
{
  "content": "Hello family!"
}
```

### WebSocket: ws://localhost:3000/ws
Real-time chat connection.

**Events:**
- `message` - New chat message
- `typing` - Typing indicator
- `presence` - Member online/offline status

---

## Todos

### GET /api/todos
List family todos. *Requires auth.*

### POST /api/todos
Create a todo. *Requires auth.*

**Body:**
```json
{
  "title": "Buy groceries",
  "priority": "medium",
  "assigned_to": 2
}
```

### PATCH /api/todos/:id
Update a todo. *Requires auth.*

### DELETE /api/todos/:id
Delete a todo. *Requires auth.*

---

## Notes

### GET /api/notes
List shared notes. *Requires auth.*

### POST /api/notes
Create a note. *Requires auth.*

### PUT /api/notes/:id
Update a note. *Requires auth.*

### DELETE /api/notes/:id
Delete a note. *Requires auth.*

---

## Events (Calendar)

### GET /api/events
List calendar events. *Requires auth.*

### POST /api/events
Create an event. *Requires auth.*

**Body:**
```json
{
  "title": "Family Dinner",
  "date": "2024-12-25",
  "time": "18:00",
  "description": "Christmas dinner"
}
```

### PUT /api/events/:id
Update an event. *Requires auth.*

### DELETE /api/events/:id
Delete an event. *Requires auth.*

---

## Users

### GET /api/users
List family members. *Requires auth.*

### GET /api/users/:id
Get member details. *Requires auth.*

---

## Weather

### GET /api/weather
Get weather data (Open-Meteo API). *Requires auth.*

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 300 req / 15 min |
| Login | 20 req / 15 min |
