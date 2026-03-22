const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/family-hub.db");

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
      users: ['id', 'username', 'display_name', 'emoji', 'color', 'role', 'password_hash', 'last_seen', 'created_at'],
      messages: ['id', 'user_id', 'content', 'type', 'created_at'],
      todos: ['id', 'text', 'done', 'priority', 'due_date', 'created_by', 'assigned_to', 'completed_at', 'created_at'],
      notes: ['id', 'title', 'content', 'created_by', 'updated_at', 'created_at'],
      events: ['id', 'title', 'description', 'event_date', 'event_time', 'created_by', 'created_at'],
      shopping_lists: ['id', 'name', 'created_by', 'created_at'],
      shopping_items: ['id', 'list_id', 'name', 'quantity', 'checked', 'added_by', 'created_at'],
      journal_entries: ['id', 'title', 'content', 'mood', 'created_by', 'created_at']
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
      DROP TABLE IF EXISTS journal_entries;
      DROP TABLE IF EXISTS shopping_items;
      DROP TABLE IF EXISTS shopping_lists;
      DROP TABLE IF EXISTS events;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS todos;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS users;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '👤',
      color TEXT NOT NULL DEFAULT '#7c6bff',
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
      password_hash TEXT NOT NULL,
      last_seen TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text' CHECK(type IN ('text','image','system')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
      due_date TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      assigned_to TEXT REFERENCES users(id),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      event_time TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

    CREATE TABLE IF NOT EXISTS shopping_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Grocery List',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity TEXT,
      checked INTEGER NOT NULL DEFAULT 0,
      added_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      mood TEXT CHECK(mood IN ('happy','grateful','excited','neutral','tired','sad')),
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb, initDb, DB_PATH };
