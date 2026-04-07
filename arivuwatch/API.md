# ArivuWatch - API Documentation

**Base URL:** `http://localhost:9000`

## Authentication

Protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

---

## Health

### GET /api/health
Server health check. *No auth required.*

---

## Auth

### POST /api/auth/login

**Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response (200):**
```json
{
  "token": "eyJ..."
}
```

### GET /api/auth/me
Get current user. *Requires auth.*

---

## Services & Monitoring

### GET /api/services
List monitored services with health status. *Requires auth.*

### GET /api/services/:id/health
Check health of a specific service. *Requires auth.*

---

## Notes

### GET /api/notes
List all notes. *Requires auth.*

### POST /api/notes
Create a note. *Requires auth.*

### PUT /api/notes/:id
Update a note. *Requires auth.*

### DELETE /api/notes/:id
Delete a note. *Requires auth.*

---

## Todos

### GET /api/todos
List all todos. *Requires auth.*

### POST /api/todos
Create a todo. *Requires auth.*

### PATCH /api/todos/:id
Update a todo. *Requires auth.*

### DELETE /api/todos/:id
Delete a todo. *Requires auth.*

---

## AI Assistant

### POST /api/ask
Ask the AI assistant. *Requires auth. Rate limited: 10 req/60s.*

**Body:**
```json
{
  "question": "What's the status of our services?"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 500 req / 15 min |
| Login | 20 req / 15 min |
| AI Ask | 10 req / 60 sec |
