import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { execSync } from 'node:child_process';
import { authRouter } from './auth/routes.js';
import { gameRouter } from './game/routes.js';
import { runGlobalHeartbeat } from './game/heartbeat.js';
import { ensureBotUsers } from './game/bot.js';
import { ensurePirateBases } from './game/pirateBaseState.js';

// Diagnose-Marker (Nutzerentscheidung Juli 2026: Deploy-Verwirrung auf Coolify - Webhook feuert
// zuverlaessig, aber unklar ob der Server tatsaechlich den neuesten Commit ausfuehrt). Liest den
// aktuell ausgecheckten Commit-Hash EINMAL beim Start - faellt auf 'unbekannt' zurueck, falls kein
// .git-Verzeichnis im Produktions-Image vorhanden ist (z.B. bei manchen Docker-Build-Strategien).
let deployedCommit = 'unbekannt';
try {
  deployedCommit = execSync('git rev-parse --short HEAD', { cwd: process.cwd(), encoding: 'utf-8' }).trim();
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

app.listen(PORT, () => {
  console.log(`Expedition-Commander Server läuft auf Port ${PORT} (Commit ${deployedCommit})`);

  // KI-Spieler-Accounts einmalig anlegen, falls noch nicht vorhanden (siehe game/bot.ts).
  // Nach dem Server-Umzug (Hetzner, deutlich mehr CPU/RAM, siehe README) wieder REAKTIVIERT -
  // die urspruengliche Performance-Notmassnahme (Bots entfernt) ist mit der neuen Hardware
  // nicht mehr noetig.
  ensureBotUsers().catch((err) => console.error('ensureBotUsers-Fehler:', err));
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
