import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'game.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Schema: bewusst einfach gehalten (Hobby-Projekt, wenige Spieler). Der komplette Spielzustand
// wird pro Nutzer als ein JSON-Blob gespeichert (spiegelt die bisherige localStorage-Struktur),
// statt ihn in viele einzelne Tabellen zu normalisieren - das macht die Portierung der restlichen
// Spiellogik (Missionen, Events, Inventar) aus dem HTML-Prototyp deutlich einfacher.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_states (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
}

export function getUserByUsername(username: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(username: string, passwordHash: string): UserRow {
  const info = db
    .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .run(username, passwordHash, Date.now());
  return getUserById(info.lastInsertRowid as number)!;
}

export function loadGameStateJson(userId: number): string | undefined {
  const row = db.prepare('SELECT state_json FROM game_states WHERE user_id = ?').get(userId) as
    | { state_json: string }
    | undefined;
  return row?.state_json;
}

export function saveGameStateJson(userId: number, stateJson: string): void {
  db.prepare(
    `INSERT INTO game_states (user_id, state_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
  ).run(userId, stateJson, Date.now());
}
