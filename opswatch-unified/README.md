# OpsWatch Unified

Unified microservices monitoring dashboard. Tracks service health, incidents, and latency across the Arivu Maiyam platform.

## Tech Stack

- **Backend:** Express.js 5.0.1
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcryptjs
- **HTTP Client:** Axios
- **Security:** Helmet, CORS, express-rate-limit
- **Testing:** Jest + Supertest

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description | Where to Get |
|----------|---------|-------------|--------------|
| `PORT` | `3001` | Server port | Set as needed |
| `JWT_SECRET` | `opswatch-change-me-in-production-2024` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PATH` | `./data/opswatch.db` | SQLite database path | Local file path |
| `NODE_ENV` | `production` | Environment | `development` or `production` |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) | 15 min default |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window | Set as needed |
| `HEALTH_CHECK_TIMEOUT_MS` | `5000` | Health check timeout (ms) | Set as needed |

## Default Monitored Services

| Service | Port |
|---------|------|
| ArivuClaw | 18789 |
| Neural Brain | 8200 |
| OpsShiftPro | 4000 |
| Family Hub | 3000 |
| Valluvan | 5000 |
| Vault Browser | 4100 |

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm run seed   # Seed database
npm test       # Run tests
```

## License

MIT
