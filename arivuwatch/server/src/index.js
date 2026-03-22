require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getDb, initDb } = require("./db");
const { createRoutes } = require("./routes");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT) || 9000;
const db = getDb();
initDb(db);

// Auto-seed default users if DB is empty
const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
if (userCount === 0) {
  console.log("[seed] No users found, seeding defaults...");
  const insert = db.prepare("INSERT OR IGNORE INTO users (id, username, display_name, role, password_hash) VALUES (?, ?, ?, ?, ?)");
  const users = [
    { username: "admin", display_name: "Admin", role: "admin", password: "Watch@2024" },
    { username: "viewer", display_name: "Viewer", role: "viewer", password: "Watch@2024" },
  ];
  for (const u of users) {
    insert.run(crypto.randomUUID(), u.username, u.display_name, u.role, bcrypt.hashSync(u.password, 10));
  }
  console.log("[seed] Done. Users: admin/Watch@2024, viewer/Watch@2024");
}

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.minimax.io"],
      imgSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: "Too many requests" } }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many login attempts" } }));
app.use("/api/ask", rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: "AI rate limit reached, wait a moment" } }));

app.use("/api", createRoutes(db));
app.use(express.static(path.join(__dirname, "../../public")));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "../../public/index.html")));

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n  🦅 ArivuWatch running at http://localhost:${PORT}\n`);
  });
}

module.exports = { app, server, db };
