# OpsWatch Unified - API Documentation

**Base URL:** `http://localhost:3001`

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

### GET /api/auth/me
Get current user. *Requires auth.*

---

## Services

### GET /api/services
List all monitored services with current status. *Requires auth.*

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Neural Brain",
    "url": "http://localhost:8200",
    "health_endpoint": "/api/health",
    "status": "healthy",
    "latency_ms": 45
  }
]
```

### POST /api/services
Register a new service to monitor. *Admin only.*

**Body:**
```json
{
  "name": "My Service",
  "url": "http://localhost:8080",
  "health_endpoint": "/health"
}
```

### PUT /api/services/:id
Update service configuration. *Admin only.*

### DELETE /api/services/:id
Remove a monitored service. *Admin only.*

### GET /api/services/:id/health
Check health of a specific service. *Requires auth.*

---

## Health Checks (Aggregate)

### GET /api/health/services
Check health of all registered services. *Requires auth.*

**Response (200):**
```json
{
  "healthy": 4,
  "unhealthy": 2,
  "services": [
    { "name": "Neural Brain", "status": "healthy", "latency_ms": 45 },
    { "name": "Family Hub", "status": "unhealthy", "error": "Connection refused" }
  ]
}
```

---

## Incidents

### GET /api/incidents
List incidents. *Requires auth.*

### POST /api/incidents
Create an incident. *Requires auth.*

**Body:**
```json
{
  "service_id": 1,
  "title": "Service down",
  "severity": "high",
  "description": "Neural Brain API not responding"
}
```

### PATCH /api/incidents/:id
Update incident status. *Requires auth.*

---

## Default Monitored Services

| Service | URL | Port |
|---------|-----|------|
| ArivuClaw | http://localhost:18789 | 18789 |
| Neural Brain | http://localhost:8200 | 8200 |
| OpsShiftPro | http://localhost:4000 | 4000 |
| Family Hub | http://localhost:3000 | 3000 |
| Valluvan | http://localhost:5000 | 5000 |
| Vault Browser | http://localhost:4100 | 4100 |
