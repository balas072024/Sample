# Kaashmikhaa Gateway

API Gateway for the Arivu Maiyam platform. Routes requests to backend microservices, handles JWT authentication, provides request logging, analytics, and service health monitoring.

## Tech Stack

- **Backend:** Flask 3.1.0 (Python)
- **Database:** SQLite3 (WAL mode)
- **Auth:** JWT (PyJWT) + bcrypt
- **Server:** Gunicorn (4 workers)
- **Testing:** pytest

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Run development server
python app.py

# Run production server
gunicorn --bind 0.0.0.0:5013 --workers 4 --timeout 120 app:app
```

## Environment Variables

| Variable | Default | Description | Where to Get |
|----------|---------|-------------|--------------|
| `SECRET_KEY` | `your-secret-key-change-this-in-production` | JWT signing key | Generate a random string: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE` | `gateway.db` | SQLite database path | Local file path |
| `JWT_EXPIRY_HOURS` | `24` | Token expiration time | Set as needed |
| `RATE_LIMIT_PER_MINUTE` | `60` | Max requests/minute/user | Set as needed |
| `PROXY_TIMEOUT` | `30` | Backend request timeout (seconds) | Set as needed |
| `PORT` | `5013` | Server port | Set as needed |

## Default Credentials

On first run, register a user via the API:

```bash
# Register admin user
curl -X POST http://localhost:5013/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YourStrongPassword", "role": "admin"}'

# Login to get JWT token
curl -X POST http://localhost:5013/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YourStrongPassword"}'
```

## Docker

```bash
docker build -t kaashmikhaa-gateway .
docker run -p 5013:5013 -e SECRET_KEY=your-production-secret kaashmikhaa-gateway
```

## Testing

```bash
pytest tests/test_api.py -v
```

## Architecture

```
Client Request
    │
    ▼
  Kaashmikhaa Gateway (Flask)
    ├── JWT Authentication
    ├── Rate Limiting (per-user)
    ├── Service Registry (SQLite)
    ├── Request Proxy → Backend Services
    ├── Request Logging (SQLite)
    └── Analytics Engine
```

## License

MIT
