const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/arivuwatch.db");

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function needsMigration(db) {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const expected = {
      users: ['id', 'username', 'display_name', 'role', 'password_hash', 'created_at'],
      notes: ['id', 'title', 'content', 'tags', 'pinned', 'created_by', 'created_at', 'updated_at'],
      todos: ['id', 'title', 'done', 'priority', 'due_at', 'created_by', 'created_at'],
      services: ['id', 'name', 'host', 'port', 'health_path', 'enabled'],
      incidents: ['id', 'service_name', 'status', 'latency', 'checked_at']
    };
    for (const [table, cols] of Object.entries(expected)) {
      if (!tables.includes(table)) continue;
      const actual = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
      for (const col of cols) {
        if (!actual.includes(col)) return true;
      }
    }
    return false;
  } catch { return false; }
}

function initDb(db) {
  if (needsMigration(db)) {
    console.log('[db] Stale schema detected — dropping and recreating tables...');
    db.exec(`
      DROP TABLE IF EXISTS incidents;
      DROP TABLE IF EXISTS todos;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS users;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin','editor','viewer')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      pinned INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
      due_at TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      host TEXT NOT NULL DEFAULT 'localhost',
      port INTEGER NOT NULL,
      health_path TEXT NOT NULL DEFAULT '/health',
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      status TEXT NOT NULL,
      latency INTEGER,
      checked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb, initDb, DB_PATH };
