# Arivu Mobile

Mobile-optimized AI assistant with PWA support. Chat with AI, translate, summarize, and manage conversations. Dual AI backend with Neural Brain API fallback to MiniMax.

## Tech Stack

- **Backend:** Flask 3.0.0 (Python)
- **Database:** SQLite (WAL mode)
- **Auth:** JWT + bcrypt
- **AI Providers:** Neural Brain API + MiniMax
- **Server:** Gunicorn
- **Frontend:** PWA with Service Worker
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
gunicorn --bind 0.0.0.0:5050 --workers 4 app:app
```

## Environment Variables

| Variable | Default | Description | Where to Get |
|----------|---------|-------------|--------------|
| `SECRET_KEY` | `your-secret-key-change-this` | JWT signing key | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE` | `arivu.db` | SQLite database path | Local file path |
| `NEURAL_BRAIN_API` | `http://localhost:8000/api/chat` | Neural Brain API URL | URL of your Neural Brain API instance |
| `MINIMAX_API_URL` | `https://api.minimax.chat/v1/text/chatcompletion_v2` | MiniMax API endpoint | Default URL works |
| `MINIMAX_API_KEY` | - | MiniMax API key | [api.minimax.chat](https://api.minimax.chat) |
| `JWT_EXPIRY_HOURS` | `24` | Token expiration time | Set as needed |

## Default Credentials

Register via the API or mobile UI:

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "YourPassword123"}'
```

## Testing

```bash
pytest tests/ -v
```

## License

MIT
