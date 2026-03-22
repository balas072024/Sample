# OpsShiftPro

Shift handover management application for operations teams. Manage shifts, handover items, and checklists with role-based access control.

## Tech Stack

- **Backend:** Express.js 5.1.0
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcryptjs
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
| `PORT` | `4000` | Server port | Set as needed |
| `JWT_SECRET` | `change-this-to-a-strong-random-secret` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PATH` | `./data/opsshiftpro.db` | SQLite database path | Local file path |
| `NODE_ENV` | `development` | Environment | `development` or `production` |

## Default Users

Auto-seeded on first run:

| Username | Password | Role |
|----------|----------|------|
| `operator1` | `Shift@2024` | operator |
| `operator2` | `Shift@2024` | operator |
| `supervisor` | `Shift@2024` | supervisor |

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm run seed   # Seed database
npm test       # Run tests
```

## License

MIT
