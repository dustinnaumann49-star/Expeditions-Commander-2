import { listAllUsers } from '../db.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { processMissions } from './missions.js';
import { processEventTimer } from './events.js';
import { processRaidTimer } from './raids.js';
import { processAllDepartedGroupOperations } from './groupOps.js';

/**
 * Globaler Sweep UNABHAENGIG von jedem konkret eingeloggten Nutzer - im Unterschied zu tick()
 * (das immer den Zustand EINES aktiven Spielers als Ausgangspunkt braucht) verarbeitet das hier
 * JEDEN registrierten Nutzer nacheinander, unabhaengig davon, ob und wann er zuletzt online war.
 *
 * Grund fuer diese zweite Verarbeitungs-Schiene: Ohne sie haengt JEDE Spielmechanik mit festen
 * Zeitpunkten (Raid-/Notruf-Checkpoints, Missions-Ankunft, Multiplayer-Expeditions-Fortschritt)
 * daran, dass IRGENDEIN Spieler zufaellig gerade online ist und eine Anfrage stellt - bei null
 * aktiven Spielern (z.B. nachts) passiert schlicht gar nichts, komplett unabhaengig von den in
 * economy.ts festgelegten Checkpoints. Gedacht zum Aufruf durch einen externen Taktgeber (Render
 * Cron Job, oder ein kostenloser externer Uptime-Pinger wie cron-job.org/UptimeRobot), der diesen
 * Endpunkt alle paar Minuten aufruft - siehe /api/heartbeat in index.ts. Rein additiv: laeuft
 * neben der normalen tick()-Verarbeitung her, ersetzt sie nicht.
 */
export async function runGlobalHeartbeat(): Promise<{ usersProcessed: number }> {
  const users = listAllUsers();
  for (const u of users) {
    const state = loadPlayerState(u.id);
    await processMissions(state);
    processEventTimer(state);
    await processRaidTimer(state);
    state.lastUpdate = Date.now();
    savePlayerState(state);
  }

  // Gruppen-Expeditionen sind bereits nutzerunabhaengig ausgelegt (siehe groupOps.ts) - ein
  // einziger Durchlauf mit einem beliebigen Nutzer als Anker-Zustand deckt ALLE laufenden
  // Expeditionen ab, ein Durchlauf pro Nutzer waere unnoetig (siehe processAllDepartedGroupOperations).
  if (users.length > 0) {
    const anchorState = loadPlayerState(users[0].id);
    await processAllDepartedGroupOperations(anchorState);
    savePlayerState(anchorState);
  }

  return { usersProcessed: users.length };
}
