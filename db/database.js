// SQLite 데이터베이스 연결과 초기화.
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DB_PATH || path.join(__dirname, '..', 'data', 'taskflow.db'));

if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const db = new Database(dbPath);

function initDb() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      assignee TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
}

module.exports = { db, initDb };
