import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { execSync } from 'node:child_process';
import { authRouter } from './auth/routes.js';
import { gameRouter } from './game/routes.js';
import { runGlobalHeartbeat } from './game/heartbeat.js';
import { ensureBotUsers } from './game/bot.js';
import { ensurePirateBases } from './game/pirateBaseState.js';
import { checkModuleIntegrity } from './game/moduleIntegrity.js';
import { listGameStateSizes, listGameStateFieldSizes } from './db.js';
import { loadPlayerState, savePlayerState } from './game/state.js';

// Diagnose-Marker (Nutzerentscheidung Juli 2026: Deploy-Verwirrung auf Coolify - Webhook feuert
// zuverlaessig, aber unklar ob der Server tatsaechlich den neuesten Commit ausfuehrt). Liest den
// aktuell ausgecheckten Commit-Hash EINMAL beim Start - faellt auf 'unbekannt' zurueck, falls kein
// .git-Verzeichnis im Produktions-Image vorhanden ist (z.B. bei manchen Docker-Build-Strategien).
// Der Commit-Hash wird zuerst aus der Umgebung gelesen und nur ersatzweise per git ermittelt.
// Grund (11.08.2026): im Coolify-Deployment gibt es kein .git-Verzeichnis, `git rev-parse` schlug
// dort bei JEDEM Start fehl ("fatal: not a git repository") und /api/health meldete dauerhaft
// "unbekannt" - womit sich nicht mehr pruefen liess, ob ein Deploy tatsaechlich durchgegriffen hat.
// Welche Variable die Plattform setzt, ist nicht garantiert; deshalb mehrere Kandidaten und als
// letzte Moeglichkeit eine, die sich in Coolify von Hand als Umgebungsvariable eintragen laesst.
const COMMIT_ENV_CANDIDATES = ['SOURCE_COMMIT', 'COOLIFY_SOURCE_COMMIT', 'GIT_COMMIT_SHA', 'GIT_COMMIT', 'DEPLOY_COMMIT'];
let deployedCommit = 'unbekannt';
for (const key of COMMIT_ENV_CANDIDATES) {
  const v = process.env[key];
  if (v && v.trim()) {
    deployedCommit = v.trim().slice(0, 7);
    break;
  }
}
try {
  if (deployedCommit === 'unbekannt') {
    deployedCommit = execSync('git rev-parse --short HEAD', { cwd: process.cwd(), encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  }
} catch {
  // .git nicht verfuegbar im Image - bleibt bei 'unbekannt', kein Abbruch noetig.
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
// Render Starter-Tarif (oder hoeher) haelt den Node-Prozess durchgehend am Laufen (kein
// Einschlafen bei Inaktivitaet wie beim kostenlosen Tarif) - ein interner setInterval-Takt ist
// dadurch zuverlaessig nutzbar, ganz ohne externen Pinger/Cron-Dienst. Alle 2 Minuten reicht
// deutlich, um die festen 00/06/12/18-Uhr-Checkpoints (siehe economy.ts) zeitnah zu treffen.
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, commit: deployedCommit }));

// Bewusst OHNE requireAuth (siehe gameRouter) - bleibt zusaetzlich als manuell/extern ausloesbarer
// Endpunkt bestehen (z.B. fuer einen sofortigen Test per Browser-Aufruf), ist aber wegen des
// internen Taktgebers unten kein Muss mehr fuer den Normalbetrieb.
app.get('/api/heartbeat', async (_req, res) => {
  try {
    const result = await runGlobalHeartbeat();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Heartbeat-Fehler:', err);
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);

app.listen(PORT, async () => {
  console.log(`Expedition-Commander Server läuft auf Port ${PORT} (Commit ${deployedCommit})`);

  // R12 (Umsetzungsplan): meldet Modul-IDs, die zur Laufzeit gebildet werden, aber keine
  // Definition haben. Bricht bewusst NICHT ab - macht nur die Fehlerklasse sichtbar, durch die
  // die V2/V3-Module der Heimatbasis unbemerkt ausgefallen sind. Siehe game/moduleIntegrity.ts.
  try {
    checkModuleIntegrity();
  } catch (err) {
    console.error('Modul-Pruefung-Fehler:', err);
  }

  // Diagnose-Ausgabe der Spielstand-Groessen. Kostet eine einzige SQL-Abfrage beim Start.
  // Anlass: wiederholt langsame ticks fuer einen einzelnen Bot (siehe listGameStateSizes()).
  // Der Spielstand wird als EIN JSON gespeichert und bei jedem Zug komplett neu serialisiert -
  // seine Groesse geht daher direkt in die tick()-Dauer ein.
  try {
    const sizes = listGameStateSizes();
    const total = sizes.reduce((a, b) => a + b.bytes, 0);
    console.log(`[Spielstand-Groessen] ${sizes.length} Konten, zusammen ${(total / 1024).toFixed(0)} KB:`);
    sizes.forEach((s) => console.log(`  ${(s.bytes / 1024).toFixed(0).padStart(6)} KB  ${s.username}${s.isBot ? ' (Bot)' : ''}`));
  } catch (err) {
    console.error('Spielstand-Groessen-Fehler:', err);
  }

  // Ergaenzung 16.08.2026: WELCHES Feld traegt die Groesse? Die Zeilen oben zeigen nur die Summe.
  // Anlass: `processOverdueRaidsForOtherUsers` frisst 98 % der tick()-Zeit und laedt dabei fuer
  // jeden anderen Nutzer den vollen Spielstand - die Kosten sind Nutzerzahl x Spielstandgroesse.
  // Ein Konto liegt beim Fuenffachen dessen, was 200 Nachrichten mit Replays erklaeren wuerden.
  // Rein lesend, laeuft einmalig beim Start. Kann wieder entfernt werden, sobald die Ursache
  // gefunden und behoben ist.
  try {
    const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
    listGameStateFieldSizes().forEach((r) => {
      console.log(`[Spielstand-Felder] ${r.username}${r.isBot ? ' (Bot)' : ''} - ${kb(r.bytes)}:`);
      r.fields.forEach((f) => {
        const anteil = r.bytes > 0 ? ((f.bytes / r.bytes) * 100).toFixed(0) : '0';
        console.log(
          `  ${f.key.padEnd(22)}${kb(f.bytes).padStart(9)}${(anteil + ' %').padStart(6)}`
          + (f.count !== null ? `  ${f.count} Eintraege` : '')
        );
      });
      if (r.messages) {
        const m = r.messages;
        const je = m.count > 0 ? kb(m.bytes / m.count) : '0 KB';
        console.log(
          `  -> Nachrichten ${m.count} Stueck, ${je} im Schnitt`
          + `, davon Replays ${kb(m.replayBytes)}, Skirmishes ${kb(m.skirmishBytes)}`
        );
      }
    });
  } catch (err) {
    console.error('Spielstand-Felder-Fehler:', err);
  }

  // ---- Migrationen einmal aktiv anstossen (16.08.2026) ----
  // `loadPlayerState()` migriert Spielstaende beim Laden, aber wirksam wird das erst, wenn der
  // Stand danach auch GESPEICHERT wird - also beim naechsten tick() des jeweiligen Kontos. Die
  // Diagnose-Ausgabe oben liest dagegen roh aus der Datenbank und lief bisher VOR jeder Migration:
  // sie zeigte deshalb zwangslaeufig noch die alten Groessen, was am 16.08.2026 wie ein Fehlschlag
  // der Migration aussah, obwohl keiner vorlag. Hier wird jede Migration deshalb einmal aktiv
  // durchgezogen, statt auf den Heartbeat zu warten, und das Ergebnis direkt danach gemessen.
  // Fehler-Isolation pro Konto nach dem Muster aus `runGlobalHeartbeat()`: ein kaputter Stand darf
  // nicht alle folgenden ueberspringen.
  try {
    const vorher = listGameStateSizes();
    const summe = (l: { bytes: number }[]) => l.reduce((a, b) => a + b.bytes, 0);
    vorher.forEach((s) => {
      try {
        savePlayerState(loadPlayerState(s.userId));
      } catch (err) {
        console.error(`[Migration] Fehler bei Nutzer ${s.userId} (${s.username}):`, err);
      }
    });
    const nachher = listGameStateSizes();
    const alt = summe(vorher);
    const neuGesamt = summe(nachher);
    console.log(
      `[Migration] ${vorher.length} Konten durchgezogen: ${(alt / 1024).toFixed(0)} KB -> `
      + `${(neuGesamt / 1024).toFixed(0)} KB`
      + (alt > 0 ? ` (${(100 - (neuGesamt / alt) * 100).toFixed(0)} % kleiner)` : '')
    );
    nachher.forEach((s) => {
      const v = vorher.find((x) => x.userId === s.userId);
      const diff = v && v.bytes > 0 ? ` (vorher ${(v.bytes / 1024).toFixed(0)} KB)` : '';
      console.log(`  ${(s.bytes / 1024).toFixed(0).padStart(6)} KB  ${s.username}${s.isBot ? ' (Bot)' : ''}${diff}`);
    });
  } catch (err) {
    console.error('Migrations-Durchlauf-Fehler:', err);
  }

  // KI-Spieler-Accounts (KI-Vega/KI-Nyx) throttled wieder eingefuehrt (30.07.2026, siehe README
  // Punkt 100) - waren nach dem CPU-Spitzen-Vorfall (Punkt 97/98) komplett entfernt worden, weil
  // sie rund um die Uhr ohne menschliche Entscheidungspause echte Kaempfe im Heartbeat ausgeloest
  // haben. Diesmal bewusst gedrosselt (siehe bot.ts, BOT_COMBAT_ACTION_CHANCE) statt 1:1
  // zurueckgebaut. Idempotent (legt nur an, was noch fehlt).
  try {
    await ensureBotUsers();
  } catch (err) {
    console.error('ensureBotUsers-Fehler:', err);
  }
  // Angreifbare Piratenbasen einmalig anlegen, falls noch nicht vorhanden (siehe game/pirateBaseState.ts).
  try {
    ensurePirateBases();
  } catch (err) {
    console.error('ensurePirateBases-Fehler:', err);
  }

  // Interner Taktgeber: laeuft direkt im Node-Prozess, sobald der Server steht - keine externe
  // Abhaengigkeit noetig. Setzt voraus, dass der Prozess durchgehend laeuft (Render Starter-Tarif+),
  // sonst (kostenloser Tarif mit Einschlafen) bitte stattdessen /api/heartbeat extern anpingen
  // lassen (siehe heartbeat.ts).
  setInterval(() => {
    runGlobalHeartbeat().catch((err) => console.error('Heartbeat-Fehler (Intervall):', err));
  }, HEARTBEAT_INTERVAL_MS);
  console.log(`Interner Heartbeat-Takt aktiv (alle ${HEARTBEAT_INTERVAL_MS / 60000} Minuten)`);
});
