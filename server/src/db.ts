import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'game.db');

// WICHTIG: better-sqlite3 legt das Verzeichnis NICHT selbst an - fehlt es (z.B. nach einem
// Redeploy ohne persistenten Datenspeicher, oder wenn es aus irgendeinem Grund geloescht wurde),
// stuerzt der Server sofort beim Start ab ("Cannot open database because the directory does not
// exist"), noch bevor Express oder irgendein Log ausgegeben wird - fuer den Betreiber sieht das
// aus wie "das Spiel laeuft nicht mehr", ohne erkennbare Fehlermeldung im normalen Log. Fix:
// Verzeichnis defensiv sicherstellen, BEVOR die Datenbank geoeffnet wird.
fs.mkdirSync(dataDir, { recursive: true });

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

  CREATE TABLE IF NOT EXISTS group_operations (
    id TEXT PRIMARY KEY,
    creator_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS galaxy_events (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pirate_bases (
    id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// Migration: last_seen-Spalte nachtraeglich ergaenzen (fuer Online/Offline-Anzeige), falls die
// users-Tabelle bereits vor dieser Version angelegt wurde.
try {
  db.exec('ALTER TABLE users ADD COLUMN last_seen INTEGER');
} catch {
  // Spalte existiert schon - kein Problem, einfach ignorieren.
}

// Migration: is_bot-Spalte fuer KI-Spieler (siehe game/bot.ts) - unterscheidet Bot-Accounts von
// echten Spielern, ansonsten technisch ein ganz normaler Nutzer mit eigenem PlayerState.
try {
  db.exec('ALTER TABLE users ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0');
} catch {
  // Spalte existiert schon - kein Problem, einfach ignorieren.
}

// Ein Nutzer gilt als "online", wenn seine letzte Anfrage nicht laenger als dieses Fenster
// zurueckliegt. Das Frontend fragt den Zustand alle 5s ab, aber Browser drosseln Timer in
// Hintergrund-Tabs teils stark (z.B. auf 1x/Minute) - daher grosszuegiger Puffer, damit ein
// kurz im Hintergrund liegender Tab nicht faelschlich als offline gilt.
const ONLINE_THRESHOLD_MS = 25000;

export function touchUserLastSeen(userId: number): void {
  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), userId);
}

export function listAllUsers(excludeUserId?: number): { id: number; username: string; online: boolean; isBot: boolean }[] {
  const rows = db.prepare('SELECT id, username, last_seen, is_bot FROM users ORDER BY username').all() as {
    id: number;
    username: string;
    last_seen: number | null;
    is_bot: number;
  }[];
  const now = Date.now();
  const withStatus = rows.map((r) => ({
    id: r.id,
    username: r.username,
    online: !!r.last_seen && now - r.last_seen < ONLINE_THRESHOLD_MS,
    isBot: !!r.is_bot,
  }));
  return excludeUserId ? withStatus.filter((r) => r.id !== excludeUserId) : withStatus;
}

export function getGroupOperationJson(id: string): string | undefined {
  const row = db.prepare('SELECT data_json FROM group_operations WHERE id = ?').get(id) as { data_json: string } | undefined;
  return row?.data_json;
}

export function listGroupOperationsJson(): string[] {
  const rows = db.prepare('SELECT data_json FROM group_operations').all() as { data_json: string }[];
  return rows.map((r) => r.data_json);
}

export function saveGroupOperationJson(id: string, creatorId: number, status: string, dataJson: string): void {
  db.prepare(
    `INSERT INTO group_operations (id, creator_id, status, data_json, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, data_json = excluded.data_json, updated_at = excluded.updated_at`
  ).run(id, creatorId, status, dataJson, Date.now());
}

export function deleteGroupOperation(id: string): void {
  db.prepare('DELETE FROM group_operations WHERE id = ?').run(id);
}

// Galaxie-Ereignisse (Wrack/Handelskonvoi, siehe game/galaxyEvents.ts): dieselbe einfache
// id/status/data_json-Struktur wie group_operations - global, nicht an einen Nutzer gebunden.
export function listGalaxyEventsJson(): string[] {
  const rows = db.prepare('SELECT data_json FROM galaxy_events').all() as { data_json: string }[];
  return rows.map((r) => r.data_json);
}

export function saveGalaxyEvent(id: string, status: string, dataJson: string): void {
  db.prepare(
    `INSERT INTO galaxy_events (id, status, data_json, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, data_json = excluded.data_json, updated_at = excluded.updated_at`
  ).run(id, status, dataJson, Date.now());
}

export function deleteGalaxyEvent(id: string): void {
  db.prepare('DELETE FROM galaxy_events WHERE id = ?').run(id);
}

// Piratenbasen (angreifbarer Zustand, siehe game/pirateBaseState.ts): dieselbe einfache
// id/data_json-Struktur wie galaxy_events, aber OHNE status-Spalte (keine "aktiv/vergriffen"-
// Unterscheidung noetig) und OHNE delete-Funktion - Basen werden nie geloescht, nur ihr Zustand
// ueberschrieben (koennen nicht zerstoert werden, siehe Nutzerentscheidung).
export function getPirateBaseJson(id: string): string | undefined {
  const row = db.prepare('SELECT data_json FROM pirate_bases WHERE id = ?').get(id) as { data_json: string } | undefined;
  return row?.data_json;
}

export function listPirateBasesJson(): string[] {
  const rows = db.prepare('SELECT data_json FROM pirate_bases').all() as { data_json: string }[];
  return rows.map((r) => r.data_json);
}

export function savePirateBaseJson(id: string, dataJson: string): void {
  db.prepare(
    `INSERT INTO pirate_bases (id, data_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`
  ).run(id, dataJson, Date.now());
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
  is_bot?: number;
}

export function getUserByUsername(username: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(username: string, passwordHash: string, isBot = false): UserRow {
  const info = db
    .prepare('INSERT INTO users (username, password_hash, created_at, is_bot) VALUES (?, ?, ?, ?)')
    .run(username, passwordHash, Date.now(), isBot ? 1 : 0);
  return getUserById(info.lastInsertRowid as number)!;
}

export function listBotUserIds(): number[] {
  return (db.prepare('SELECT id FROM users WHERE is_bot = 1').all() as { id: number }[]).map((r) => r.id);
}

// PERFORMANCE-NOTMASSNAHME (siehe Nutzerentscheidung nach Server-Absturz auf dem Starter-Tarif):
// entfernt bestehende KI-Spieler-Accounts wieder vollstaendig (Nutzer + Spielstand) - nicht nur
// die Bot-LOGIK abschalten, sondern die Accounts selbst loeschen, damit sie auch nicht mehr in
// den Heartbeat-/Raid-Schleifen fuer ALLE Nutzer mitverarbeitet werden (jeder zusaetzliche
// Account bedeutet zusaetzliche Verarbeitung pro Tick). Wird einmalig beim Serverstart aufgerufen
// (idempotent - loescht nur, wenn noch Bot-Accounts vorhanden sind).
export function removeBotUsers(): number {
  const botIds = listBotUserIds();
  for (const id of botIds) {
    db.prepare('DELETE FROM game_states WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
  return botIds.length;
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
