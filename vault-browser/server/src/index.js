require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getDb, initDb } = require("./db");
const { createRoutes } = require("./routes");

const PORT = parseInt(process.env.PORT) || 4100;
const db = getDb(); initDb(db);

const app = express();
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:"] } }, crossOriginEmbedderPolicy: false }));
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { error: "Too many requests" } }));
app.use("/api/vault/unlock", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many unlock attempts" } }));

app.use("/api", createRoutes(db));
app.use(express.static(path.join(__dirname, "../../public")));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "../../public/index.html")));

const server = http.createServer(app);
if (require.main === module) server.listen(PORT, () => console.log(`\n  🔐 Vault Browser at http://localhost:${PORT}\n`));

module.exports = { app, server, db };
