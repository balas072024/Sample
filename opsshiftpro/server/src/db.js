const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'opsshiftpro.db');

function getDb(dbPath) {
  const resolvedPath = dbPath || DB_PATH;
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initTables(db);
  return db;
}

function needsMigration(db) {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const expected = {
      users: ['id', 'username', 'password', 'role', 'full_name', 'created_at', 'updated_at'],
      shifts: ['id', 'operator_name', 'user_id', 'start_time', 'end_time', 'status', 'summary', 'created_at', 'updated_at'],
      handover_items: ['id', 'shift_id', 'type', 'title', 'description', 'priority', 'resolved', 'created_at', 'updated_at'],
      checklists: ['id', 'shift_id', 'type', 'title', 'completed', 'created_at', 'updated_at'],
      checklist_items: ['id', 'checklist_id', 'label', 'checked', 'checked_at', 'created_at']
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

function initTables(db) {
  if (needsMigration(db)) {
    console.log('[db] Stale schema detected — dropping and recreating tables...');
    db.exec(`
      DROP TABLE IF EXISTS checklist_items;
      DROP TABLE IF EXISTS checklists;
      DROP TABLE IF EXISTS handover_items;
      DROP TABLE IF EXISTS shifts;
      DROP TABLE IF EXISTS users;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      full_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_name TEXT NOT NULL,
      user_id INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS handover_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('issue', 'note', 'pending_task')),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('pre_shift', 'post_shift')),
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checklist_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      checked_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { getDb, initTables };
