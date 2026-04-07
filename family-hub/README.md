# Family Hub

Real-time family communication platform with chat, task management, shared notes, calendar events, and member presence tracking. Features WebSocket-powered live updates.

Built for [arivumaiyam.com](https://arivumaiyam.com).

## Tech Stack

- **Backend:** Express.js 5.2.1
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcryptjs
- **Real-time:** WebSocket (ws 8.20.0)
- **Security:** Helmet, CORS, express-rate-limit
- **Testing:** Jest + Supertest (40 tests)

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
| `PORT` | `3000` | Server port | Set as needed |
| `JWT_SECRET` | `change-this-to-a-random-secret-string-at-least-32-chars` | JWT signing key (32+ chars) | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PATH` | `./data/family-hub.db` | SQLite database path | Local file path |
| `NODE_ENV` | `production` | Environment | `development` or `production` |

## Default Users

After database seed:

| Username | Password | Role |
|----------|----------|------|
| `bala` | `Family@2024` | admin |
| `wife` | `Family@2024` | member |
| `child` | `Family@2024` | member |
| `parent1` | `Family@2024` | member |
| `parent2` | `Family@2024` | member |

## WebSocket

Connect to `ws://localhost:3000/ws` for real-time updates (chat messages, typing indicators, presence).

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm run seed   # Seed database
npm test       # Run tests
```

## License

MIT
