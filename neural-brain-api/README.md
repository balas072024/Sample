# Neural Brain API

AI-powered chat API with conversation management, text analysis (summarization, translation, sentiment), and a prompts library. Built with Express.js and SQLite.

## Tech Stack

- **Backend:** Express.js 5.1.0
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

# Seed database with demo data
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description | Where to Get |
|----------|---------|-------------|--------------|
| `PORT` | `8200` | Server port | Set as needed |
| `JWT_SECRET` | `change-me-to-a-long-random-string` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MINIMAX_API_KEY` | - | MiniMax API key for AI features | [api.minimax.chat](https://api.minimax.chat) |
| `DB_PATH` | `./data/neural-brain.db` | SQLite database path | Local file path |

## Default Users

After running `npm run seed`:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Neural@2024` | admin |
| `demo` | `demo123` | user |
| `alice` | `alice123` | user |

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm run seed   # Seed database
npm test       # Run tests
```

## License

MIT
