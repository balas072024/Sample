const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'opswatch.db');

let db;

function getDb() {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initTables(db);
  return db;
}

function needsMigration(database) {
  try {
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const required = ['users', 'monitored_services', 'health_checks', 'alerts', 'incidents'];
    for (const t of required) {
      if (!tables.includes(t)) continue;
      const cols = database.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
      if (t === 'health_checks' && !cols.includes('service_id')) return true;
      if (t === 'alerts' && !cols.includes('service_id')) return true;
      if (t === 'incidents' && !cols.includes('service_id')) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function initTables(database) {
  if (needsMigration(database)) {
    console.log('[db] Stale schema detected — dropping and recreating tables...');
    database.exec(`
      DROP TABLE IF EXISTS health_checks;
      DROP TABLE IF EXISTS alerts;
      DROP TABLE IF EXISTS incidents;
      DROP TABLE IF EXISTS monitored_services;
      DROP TABLE IF EXISTS users;
    `);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monitored_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      expected_status INTEGER DEFAULT 200,
      check_interval_seconds INTEGER DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('up', 'down', 'degraded')),
      response_time_ms INTEGER,
      status_code INTEGER,
      error_message TEXT,
      checked_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (service_id) REFERENCES monitored_services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_acknowledged INTEGER NOT NULL DEFAULT 0,
      acknowledged_by INTEGER,
      acknowledged_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (service_id) REFERENCES monitored_services(id) ON DELETE SET NULL,
      FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'major', 'minor')),
      status TEXT NOT NULL CHECK(status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
      opened_by INTEGER,
      closed_by INTEGER,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      FOREIGN KEY (service_id) REFERENCES monitored_services(id) ON DELETE SET NULL,
      FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_health_checks_service_id ON health_checks(service_id);
    CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_service_id ON alerts(service_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
  `);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

function resetDb() {
  closeDb();
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  return getDb();
}

module.exports = { getDb, closeDb, resetDb, DB_PATH };
