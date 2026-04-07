# OpsShiftPro - API Documentation

**Base URL:** `http://localhost:4000`

## Authentication

All protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

---

## Health & Auth

### GET /api/health
Health check. *No auth required.*

### POST /api/auth/login

**Body:**
```json
{
  "username": "operator1",
  "password": "Shift@2024"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "username": "operator1", "role": "operator", "full_name": "Alex Johnson" }
}
```

### GET /api/auth/me
Get current user. *Requires auth.*

### POST /api/auth/change-password
Change password. *Requires auth.*

**Body:**
```json
{
  "currentPassword": "Shift@2024",
  "newPassword": "NewPassword123"
}
```

---

## Shifts

### GET /api/shifts
List shifts. *Requires auth.*

**Query params:** `status` (active/completed), `limit`, `offset`

### GET /api/shifts/active
Get currently active shift. *Requires auth.*

### GET /api/shifts/:id
Get shift with details. *Requires auth.*

### POST /api/shifts
Create a new shift. *Requires auth.*

**Body:**
```json
{
  "operator_name": "Alex Johnson",
  "start_time": "2024-01-01T08:00:00Z",
  "summary": "Morning shift"
}
```

### PUT /api/shifts/:id
Update shift (full). *Requires auth.*

### PATCH /api/shifts/:id
Partial shift update. *Requires auth.*

### DELETE /api/shifts/:id
Delete shift. *Requires auth.*

### GET /api/shifts/:id/report
Get comprehensive shift report. *Requires auth.*

### GET /api/shifts/export
Export all shifts with items and checklists. *Requires auth.*

---

## Handover Items

### GET /api/shifts/:shiftId/items
List handover items for a shift. *Requires auth.*

### POST /api/shifts/:shiftId/items
Create a handover item. *Requires auth.*

**Body:**
```json
{
  "type": "issue",
  "title": "Server CPU spike",
  "description": "CPU usage hit 95% at 2pm",
  "priority": "high"
}
```

**Types:** `issue`, `note`, `pending_task`
**Priorities:** `low`, `medium`, `high`, `critical`

### PATCH /items/:id
Update handover item. *Requires auth.*

### DELETE /handover-items/:id
Delete handover item. *Requires auth.*

---

## Checklists

### GET /api/checklists
List all checklists. *Requires auth.*

### GET /api/shifts/:shiftId/checklists
List checklists for a shift. *Requires auth.*

### POST /api/checklists
Create checklist with items. *Requires auth.*

**Body:**
```json
{
  "shift_id": 1,
  "type": "pre_shift",
  "title": "Pre-shift Safety Check",
  "items": [
    { "label": "Check fire exits" },
    { "label": "Verify backup systems" }
  ]
}
```

**Types:** `pre_shift`, `post_shift`

### PATCH /api/checklists/:id/items/:itemId
Toggle checklist item completion. *Requires auth.*
