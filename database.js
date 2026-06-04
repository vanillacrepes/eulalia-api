const Database = require('better-sqlite3');
const db = new Database('database/eulalia.db', { verbose: console.log });

// since this will be a victim of scope creep, tables will be made per feature

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS water (
    user_id TEXT PRIMARY KEY,
    last_drank INTEGER NOT NULL,
    drinks_today INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    last_reset INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
  ); 
`);

module.exports = db;