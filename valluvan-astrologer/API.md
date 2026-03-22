# Valluvan Astrologer - API Documentation

**Base URL:** `http://localhost:5000`

## Authentication

Protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

Rate limited: 30 requests/minute per IP (excludes /api/health).

---

## Health

### GET /api/health
Server health check. *No auth required.*

---

## Auth

### POST /api/auth/register

**Body:**
```json
{
  "username": "user1",
  "password": "StrongPassword123"
}
```

### POST /api/auth/login

**Body:**
```json
{
  "username": "user1",
  "password": "StrongPassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "username": "user1" }
}
```

### GET /api/auth/me
Get current user. *Requires auth.*

---

## Birth Charts

### POST /api/charts
Generate a Vedic birth chart. *Requires auth.*

**Body:**
```json
{
  "name": "John",
  "date_of_birth": "1990-05-15",
  "time_of_birth": "14:30",
  "place_of_birth": "Chennai, India",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

### GET /api/charts
List user's birth charts. *Requires auth.*

### GET /api/charts/:id
Get a specific birth chart. *Requires auth.*

### DELETE /api/charts/:id
Delete a birth chart. *Requires auth.*

---

## Horoscopes & Readings

### GET /api/horoscope/:sign
Get daily horoscope for a zodiac sign. *Requires auth.*

### POST /api/readings
Generate an astrological reading from a birth chart. *Requires auth.*

**Body:**
```json
{
  "chart_id": 1,
  "type": "general"
}
```
