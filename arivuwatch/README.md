# ArivuWatch

Operations monitoring dashboard with AI assistant integration. Monitor services, manage notes and todos, and get AI-powered insights.

## Tech Stack

- **Backend:** Express.js 5.2.1
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcryptjs
- **AI Provider:** MiniMax API
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
| `PORT` | `9000` | Server port | Set as needed |
| `JWT_SECRET` | `change-this-to-a-random-secret` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MINIMAX_API_KEY` | - | MiniMax API key for AI features | [api.minimax.chat](https://api.minimax.chat) |
| `DB_PATH` | `./data/arivuwatch.db` | SQLite database path | Local file path |

## Default Users

After running `npm run seed`:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Watch@2024` | admin |
| `viewer` | `Watch@2024` | viewer |

## Rate Limits

- General API: 500 requests / 15 minutes
- Login: 20 requests / 15 minutes
- AI Ask: 10 requests / 60 seconds

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm run seed   # Seed database
npm test       # Run tests
```

## License

MIT
