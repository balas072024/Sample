# Valluvan Astrologer

Vedic (Tamil) astrology SaaS application. Generate birth charts, horoscopes, and astrological readings based on Vedic calculations.

## Tech Stack

- **Backend:** Flask 3.1.0 (Python)
- **Database:** SQLite
- **Auth:** JWT + bcrypt
- **Server:** Gunicorn
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
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

## Environment Variables

| Variable | Default | Description | Where to Get |
|----------|---------|-------------|--------------|
| `SECRET_KEY` | `change-this-to-a-random-secret-key` | Flask secret key | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_SECRET` | `change-this-to-a-different-random-secret` | JWT signing key | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_PATH` | `valluvan.db` | SQLite database path | Local file path |
| `RATE_LIMIT_PER_MINUTE` | `30` | Max requests/minute/IP | Set as needed |
| `HOST` | `0.0.0.0` | Bind address | Set as needed |
| `PORT` | `5000` | Server port | Set as needed |
| `DEBUG` | `false` | Debug mode | `true` or `false` |

## Default Credentials

Register via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "YourPassword123"}'
```

## Testing

```bash
pytest tests/ -v
```

## License

MIT
