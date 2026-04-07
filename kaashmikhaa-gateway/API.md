# Kaashmikhaa Gateway - API Documentation

**Base URL:** `http://localhost:5013`

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "username": "admin",
  "password": "StrongPassword123",
  "role": "admin"
}
```
**Roles:** `user`, `admin`

**Response (201):**
```json
{
  "message": "User created successfully",
  "user_id": 1
}
```

### POST /api/auth/login
Login and receive JWT token.

**Body:**
```json
{
  "username": "admin",
  "password": "StrongPassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### GET /api/auth/me
Get current authenticated user info. *Requires auth.*

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Service Registry

### GET /api/services
List all registered services. *Requires auth.*

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "user-service",
    "url": "http://localhost:5001",
    "prefix": "/users",
    "description": "User management service",
    "health_endpoint": "/health",
    "is_active": 1
  }
]
```

### POST /api/services
Register a new backend service. *Admin only.*

**Body:**
```json
{
  "name": "user-service",
  "url": "http://localhost:5001",
  "prefix": "/users",
  "description": "User management service",
  "health_endpoint": "/health"
}
```

### PUT /api/services/:id
Update a service. *Admin only.*

### DELETE /api/services/:id
Remove a service. *Admin only.*

---

## API Gateway Proxy

### ANY /gateway/<path>
Route requests to backend services. *Requires auth. Rate limited.*

The gateway matches the request path against registered service prefixes and forwards the request to the matching backend service.

**Headers forwarded:** All except `Host`, `Authorization`, `Content-Length`
**Headers injected:** `X-Forwarded-For`, `X-Gateway-User`

**Error responses:**
- `404` - No matching service found
- `502` - Backend connection error
- `504` - Backend timeout

---

## Health Checks

### GET /api/health
Gateway health status. *No auth required.*

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /api/health/services
Aggregate health of all registered services. *Requires auth.*

---

## Request Logs

### GET /api/logs
Get recent request logs. *Requires auth.*

**Query params:** `limit` (default 50), `offset` (default 0)

### GET /api/logs/export
Export all logs as JSON. *Requires auth.*

### DELETE /api/logs/clear
Clear logs older than 7 days. *Admin only.*

---

## Analytics

### GET /api/analytics
Aggregated metrics. *Requires auth.*

**Response (200):**
```json
{
  "per_service": [
    {
      "service_name": "user-service",
      "total_requests": 150,
      "avg_latency_ms": 45.2,
      "error_rate": 0.02
    }
  ],
  "overall": {
    "total_requests": 500,
    "avg_latency_ms": 52.1
  },
  "hourly": [...],
  "methods": {
    "GET": 300,
    "POST": 150,
    "PUT": 50
  }
}
```

---

## Web UI

- `GET /` - Public landing page
- `GET /admin` - Admin dashboard
