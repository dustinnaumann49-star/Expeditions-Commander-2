import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './auth/routes.js';
import { gameRouter } from './game/routes.js';
import { runGlobalHeartbeat } from './game/heartbeat.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Bewusst OHNE requireAuth (siehe gameRouter) - dieser Endpunkt ist fuer einen externen Taktgeber
// gedacht (Render Cron Job oder kostenloser Uptime-Pinger wie cron-job.org/UptimeRobot), der
// keinen Spieler-Login hat. Verarbeitet Raids/Notruf-Events/Missionen/Multiplayer-Expeditionen fuer
// ALLE Nutzer, unabhaengig davon, ob gerade irgendjemand eingeloggt ist - siehe heartbeat.ts fuer
// den Hintergrund. Alle paar Minuten aufrufen (empfohlen: 5 Minuten), damit Checkpoints (00/06/12/
// 18 Uhr UTC) zeitnah ausgeloest werden, statt erst beim naechsten Spieler-Login.
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
  console.log(`Expedition-Commander Server läuft auf Port ${PORT}`);
});
