// Diagnose: WAS macht die Spielstaende gross? NUR LESEND - dieses Skript schreibt nichts in die
// Datenbank und veraendert keinen Spielstand.
//
// Anlass (16.08.2026): `processOverdueRaidsForOtherUsers` frisst 98 % der tick()-Zeit (1310 von
// 1329 ms). Die Funktion laedt fuer JEDEN anderen Nutzer den vollstaendigen Spielstand, nur um zu
// pruefen, ob ueberhaupt etwas zu tun ist. Die Kosten sind also Nutzerzahl x Spielstandgroesse -
// und der Serverstart meldet 4 Konten mit zusammen 2457 KB, davon 1478 KB auf einem einzigen.
// Das sind rund das Fuenffache dessen, was die Code-Doku fuer 200 Nachrichten mit Kampf-Replays
// angibt (~260 KB je Spieler). Bevor irgendetwas umgebaut wird, muss klar sein, WELCHES Feld
// waechst - sonst wird an der falschen Stelle optimiert.
//
// Aufruf im Ordner `server`:  node tools/state_size_report.mjs
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'game.db');
const db = new Database(dbPath, { readonly: true });

const kb = (b) => `${(b / 1024).toFixed(1)} KB`;
const groesse = (v) => Buffer.byteLength(JSON.stringify(v ?? null), 'utf8');

const rows = db
  .prepare(`SELECT g.user_id, u.username, u.is_bot, g.state_json,
                   LENGTH(g.state_json) AS bytes
            FROM game_states g JOIN users u ON u.id = g.user_id
            ORDER BY bytes DESC`)
  .all();

console.log(`\n=== Spielstand-Groessen, ${rows.length} Konten ===\n`);

for (const r of rows) {
  const state = JSON.parse(r.state_json);
  console.log(`--- ${r.username}${r.is_bot ? ' (Bot)' : ''}  ${kb(r.bytes)} ---`);

  // Top-Level-Felder nach Groesse, damit sofort sichtbar ist, was den Stand traegt.
  const felder = Object.entries(state)
    .map(([k, v]) => ({ k, b: groesse(v), n: Array.isArray(v) ? v.length : null }))
    .sort((a, b) => b.b - a.b)
    .filter((f) => f.b > 1024);

  for (const f of felder) {
    const anteil = ((f.b / r.bytes) * 100).toFixed(1);
    console.log(`  ${f.k.padEnd(24)}${kb(f.b).padStart(10)}${(anteil + ' %').padStart(9)}`
      + (f.n !== null ? `   ${f.n} Eintraege` : ''));
  }

  // Nachrichten sind der Verdaechtige Nummer eins - deshalb hier noch eine Ebene tiefer.
  if (Array.isArray(state.messages) && state.messages.length) {
    const msgBytes = groesse(state.messages);
    const replayBytes = state.messages.reduce((s, m) => s + groesse(m?.detail?.replay), 0);
    const skirmishBytes = state.messages.reduce((s, m) => s + groesse(m?.detail?.skirmishes), 0);
    const mitReplay = state.messages.filter((m) => m?.detail?.replay).length;
    console.log(`  -> Nachrichten: ${state.messages.length} Stueck, ${kb(msgBytes)} gesamt,`
      + ` im Schnitt ${kb(msgBytes / state.messages.length)} je Nachricht`);
    console.log(`     davon Replays ${kb(replayBytes)} in ${mitReplay} Nachrichten`
      + `, Skirmish-Bloecke ${kb(skirmishBytes)}`);
    const groesste = [...state.messages]
      .map((m) => ({ t: m?.title || m?.type || '(ohne Titel)', b: groesse(m) }))
      .sort((a, b) => b.b - a.b)
      .slice(0, 3);
    groesste.forEach((m) => console.log(`     groesste: ${kb(m.b).padStart(9)}  ${m.t}`));
  }
  console.log('');
}

console.log('Gesamt:', kb(rows.reduce((s, r) => s + r.bytes, 0)));
console.log('\nHinweis: rein lesend, es wurde nichts geaendert.');
db.close();
