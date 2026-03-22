# Vault Browser

Secure password manager with AES-256-GCM encryption. Store, manage, and generate passwords with master password protection and privacy scoring.

## Tech Stack

- **Backend:** Express.js 5.2.1
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcryptjs
- **Encryption:** AES-256-GCM (Node.js crypto)
- **Key Derivation:** scrypt
- **Security:** Helmet, CORS, express-rate-limit
- **Testing:** Jest

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
| `PORT` | `4100` | Server port | Set as needed |
| `JWT_SECRET` | `vault-dev-secret` | JWT signing key | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PATH` | `./data/vault.db` | SQLite database path | Local file path |
| `NODE_ENV` | `development` | Environment | `development` or `production` |

## Rate Limits

- General API: 300 requests / 15 minutes
- Vault unlock: 10 requests / 15 minutes

## Security

- **Encryption:** AES-256-GCM with 12-byte random IV
- **Key Derivation:** scrypt (32 bytes)
- **Master Password:** scrypt hashed (64 bytes)
- **All vault entries are encrypted at rest**

## NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with --watch
npm test       # Run tests
```

## License

MIT
