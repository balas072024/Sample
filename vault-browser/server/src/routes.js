const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { encrypt, decrypt, hashMaster, generatePassword } = require("./crypto");

const JWT_SECRET = process.env.JWT_SECRET || "vault-dev-secret";

function createRoutes(db) {
  const router = express.Router();
  const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    next();
  };

  function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
    try {
      req.vault = jwt.verify(header.slice(7), JWT_SECRET);
      next();
    } catch { return res.status(401).json({ error: "Session expired, unlock vault again" }); }
  }

  // ── Vault Management ──────────────────────────────────
  router.post("/vault/create",
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Vault name required"),
    body("master_password").isLength({ min: 8 }).withMessage("Master password must be 8+ chars"),
    validate,
    (req, res) => {
      const { name, master_password } = req.body;
      const id = crypto.randomUUID();
      const salt = crypto.randomBytes(32).toString("hex");
      const master_hash = hashMaster(master_password, salt);
      db.prepare("INSERT INTO vaults (id, name, master_hash, salt) VALUES (?, ?, ?, ?)").run(id, name, master_hash, salt);
      res.status(201).json({ vault: { id, name }, message: "Vault created. Remember your master password!" });
    }
  );

  router.post("/vault/unlock",
    body("vault_id").trim().notEmpty().withMessage("Vault ID required"),
    body("master_password").notEmpty().withMessage("Master password required"),
    validate,
    (req, res) => {
      const vault = db.prepare("SELECT * FROM vaults WHERE id = ?").get(req.body.vault_id);
      if (!vault) return res.status(404).json({ error: "Vault not found" });
      const hash = hashMaster(req.body.master_password, vault.salt);
      if (hash !== vault.master_hash) return res.status(401).json({ error: "Wrong master password" });
      const token = jwt.sign({ vaultId: vault.id, salt: vault.salt }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ token, vault: { id: vault.id, name: vault.name } });
    }
  );

  router.get("/vault/list", (req, res) => {
    const vaults = db.prepare("SELECT id, name, created_at FROM vaults").all();
    res.json({ vaults });
  });

  // ── Entries CRUD ──────────────────────────────────────
  router.get("/vault/entries", authMiddleware, (req, res) => {
    const entries = db.prepare("SELECT * FROM entries WHERE vault_id = ? ORDER BY updated_at DESC").all(req.vault.vaultId);
    // Decrypt passwords and notes for the client
    const masterKey = req.headers["x-master-key"]; // Client sends master password in header for decryption
    const decrypted = entries.map(e => {
      let password = "", notes = "";
      if (masterKey) {
        try { password = decrypt(e.password_enc, masterKey, req.vault.salt); } catch { password = "[decryption failed]"; }
        try { notes = e.notes_enc ? decrypt(e.notes_enc, masterKey, req.vault.salt) : ""; } catch { notes = ""; }
      }
      return { id: e.id, title: e.title, username: e.username, password, url: e.url, notes, category: e.category, created_at: e.created_at, updated_at: e.updated_at };
    });
    res.json({ entries: decrypted });
  });

  router.post("/vault/entries", authMiddleware,
    body("title").trim().isLength({ min: 1, max: 200 }).withMessage("Title required"),
    body("password").notEmpty().withMessage("Password required"),
    validate,
    (req, res) => {
      const { title, username, password, url, notes, category } = req.body;
      const masterKey = req.headers["x-master-key"];
      if (!masterKey) return res.status(400).json({ error: "Master key required for encryption" });

      const id = crypto.randomUUID();
      const password_enc = encrypt(password, masterKey, req.vault.salt);
      const notes_enc = notes ? encrypt(notes, masterKey, req.vault.salt) : "";

      db.prepare("INSERT INTO entries (id, vault_id, title, username, password_enc, url, notes_enc, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, req.vault.vaultId, title, username || "", password_enc, url || "", notes_enc, category || "general");

      res.status(201).json({ entry: { id, title, username: username || "", url: url || "", category: category || "general" } });
    }
  );

  router.put("/vault/entries/:id", authMiddleware,
    body("title").trim().isLength({ min: 1, max: 200 }),
    validate,
    (req, res) => {
      const entry = db.prepare("SELECT * FROM entries WHERE id = ? AND vault_id = ?").get(req.params.id, req.vault.vaultId);
      if (!entry) return res.status(404).json({ error: "Entry not found" });

      const { title, username, password, url, notes, category } = req.body;
      const masterKey = req.headers["x-master-key"];
      if (!masterKey) return res.status(400).json({ error: "Master key required" });

      const password_enc = password ? encrypt(password, masterKey, req.vault.salt) : entry.password_enc;
      const notes_enc = notes !== undefined ? (notes ? encrypt(notes, masterKey, req.vault.salt) : "") : entry.notes_enc;

      db.prepare("UPDATE entries SET title=?, username=?, password_enc=?, url=?, notes_enc=?, category=?, updated_at=datetime('now') WHERE id=?")
        .run(title || entry.title, username ?? entry.username, password_enc, url ?? entry.url, notes_enc, category || entry.category, req.params.id);

      res.json({ message: "Updated" });
    }
  );

  router.delete("/vault/entries/:id", authMiddleware, (req, res) => {
    const entry = db.prepare("SELECT id FROM entries WHERE id = ? AND vault_id = ?").get(req.params.id, req.vault.vaultId);
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    db.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
    res.json({ message: "Deleted" });
  });

  // ── Password Generator ────────────────────────────────
  router.post("/vault/generate", (req, res) => {
    const { length = 20, symbols = true } = req.body || {};
    const password = generatePassword(Math.min(Math.max(length, 8), 128), { symbols });
    res.json({ password });
  });

  // ── Health ────────────────────────────────────────────
  router.get("/health", (req, res) => {
    res.json({ status: "ok", service: "vault-browser", uptime: process.uptime() });
  });

  return router;
}

module.exports = { createRoutes };
