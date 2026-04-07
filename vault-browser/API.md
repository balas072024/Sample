# Vault Browser - API Documentation

**Base URL:** `http://localhost:4100`

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

---

## Vault

### POST /api/vault/unlock
Unlock the vault with master password. *Requires auth. Rate limited: 10 req/15min.*

**Body:**
```json
{
  "master_password": "YourMasterPassword"
}
```

### POST /api/vault/setup
Set up master password (first time). *Requires auth.*

**Body:**
```json
{
  "master_password": "YourMasterPassword"
}
```

---

## Vault Entries

### GET /api/vault/entries
List all vault entries (decrypted). *Requires auth + unlocked vault.*

### POST /api/vault/entries
Create a new vault entry. *Requires auth + unlocked vault.*

**Body:**
```json
{
  "title": "Gmail",
  "username": "user@gmail.com",
  "password": "mypassword",
  "url": "https://mail.google.com",
  "notes": "Personal email"
}
```

### PUT /api/vault/entries/:id
Update a vault entry. *Requires auth + unlocked vault.*

### DELETE /api/vault/entries/:id
Delete a vault entry. *Requires auth + unlocked vault.*

---

## Password Generator

### POST /api/vault/generate-password
Generate a secure password. *Requires auth.*

**Body:**
```json
{
  "length": 20,
  "uppercase": true,
  "lowercase": true,
  "numbers": true,
  "symbols": true
}
```

**Response (200):**
```json
{
  "password": "aB3$kL9!mN2@pQ5&xR7"
}
```

---

## Privacy Score

### GET /api/vault/privacy-score
Get privacy score for stored entries. *Requires auth + unlocked vault.*

---

## Security

- All vault entries are encrypted with **AES-256-GCM**
- Master password is hashed with **scrypt**
- Key derivation uses **scrypt** (32 bytes)
- Each entry has a unique random **12-byte IV**

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 300 req / 15 min |
| Vault unlock | 10 req / 15 min |
