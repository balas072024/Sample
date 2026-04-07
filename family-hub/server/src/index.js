require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getDb, initDb } = require("./db");
const { createRoutes } = require("./routes");
const { setupWebSocket } = require("./websocket");

const PORT = parseInt(process.env.PORT) || 3000;

// ── Database ──────────────────────────────────────────────
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const db = getDb();
initDb(db);

// Auto-seed default users if DB is empty
const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
if (userCount === 0) {
  console.log("[seed] No users found, seeding defaults...");
  const insert = db.prepare(
    "INSERT OR IGNORE INTO users (id, username, display_name, emoji, color, role, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const users = [
    { username: "bala", display_name: "Bala", emoji: "\u{1F468}", color: "#7c6bff", role: "admin", password: "Family@2024" },
    { username: "wife", display_name: "Wife", emoji: "\u{1F469}", color: "#00c9a7", role: "member", password: "Family@2024" },
    { username: "child", display_name: "Child", emoji: "\u{1F466}", color: "#f59e0b", role: "member", password: "Family@2024" },
    { username: "parent1", display_name: "Parent 1", emoji: "\u{1F474}", color: "#ff6b6b", role: "member", password: "Family@2024" },
    { username: "parent2", display_name: "Parent 2", emoji: "\u{1F475}", color: "#3dd68c", role: "member", password: "Family@2024" },
  ];
  for (const u of users) {
    insert.run(crypto.randomUUID(), u.username, u.display_name, u.emoji, u.color, u.role, bcrypt.hashSync(u.password, 10));
  }
  console.log("[seed] Done. All users password: Family@2024");
}

// ── Express App ───────────────────────────────────────────
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "ws:", "https://api.open-meteo.com", "https://*.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  // Cloudflare compatibility: don't downgrade HTTPS
  crossOriginEmbedderPolicy: false,
}));

// Trust Cloudflare proxy headers (1 = trust first proxy only)
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down" },
});
app.use("/api/", limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, try again later" },
});
app.use("/api/auth/login", authLimiter);

// ── API Routes ────────────────────────────────────────────
app.use("/api", createRoutes(db));

// ── Static Files ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../../public")));

// SPA fallback
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────
const server = http.createServer(app);
const { wss, getOnlineUserIds } = setupWebSocket(server, db);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n  🏠 Family Hub running at http://localhost:${PORT}`);
    console.log(`  📡 WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`  📁 Database: ${require("./db").DB_PATH}\n`);
  });
}

module.exports = { app, server, db };
