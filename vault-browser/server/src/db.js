const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/vault.db");

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      master_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      username TEXT DEFAULT '',
      password_enc TEXT NOT NULL,
      url TEXT DEFAULT '',
      notes_enc TEXT DEFAULT '',
      category TEXT DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_entries_vault ON entries(vault_id);
  `);
}

module.exports = { getDb, initDb, DB_PATH };
