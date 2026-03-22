const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDb } = require('./db');
const { seed } = require('./seed');
const { createRouter } = require('./routes');

const PORT = parseInt(process.env.PORT, 10) || 4000;

function createApp(dbPath) {
  const app = express();
  const db = getDb(dbPath);

  // Seed default users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seed(db);
  }

  // Trust proxy (needed behind reverse proxies for rate limiter, etc.)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(cors());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api/', limiter);

  // Static files
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  // API routes
  app.use('/api', createRouter(db));

  // SPA fallback
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  });

  // Global error handler
  app.use((err, req, res, _next) => {
    console.error('[ERROR]', err.stack || err.message || err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  app._db = db;
  return app;
}

// Start server when run directly
if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`OpsShiftPro server running on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
  });
}

module.exports = { createApp };
