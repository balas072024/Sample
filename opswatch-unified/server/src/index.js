try { require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') }); } catch (_) { /* dotenv optional */ }

const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./db');
const createRoutes = require('./routes');

const PORT = process.env.PORT || 3001;

const app = express();

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Trust proxy
app.set('trust proxy', 1);

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Rate limiting — general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Rate limiting — login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// Database
const bcrypt = require('bcryptjs');
const db = getDb();

// Auto-seed default users if DB is empty
const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
if (userCount === 0) {
  console.log("[seed] No users found, seeding defaults...");
  const hash = bcrypt.hashSync('OpsWatch@2024', 10);
  const insert = db.prepare('INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)');
  insert.run('admin', hash, 'admin');
  insert.run('viewer', hash, 'viewer');
  console.log("[seed] Done. Users: admin/OpsWatch@2024, viewer/OpsWatch@2024");
}

// Routes
app.use('/api', createRoutes(db));

// Static files
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// SPA fallback
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Start only when run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`OpsWatch server listening on port ${PORT}`);
  });
}

module.exports = { app, server, db };
