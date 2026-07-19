import { listAllUsers } from '../db.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { processMissions } from './missions.js';
import { processRaidTimer } from './raids.js';
import { processAllDepartedGroupOperations } from './groupOps.js';
import { runBotTurn } from './bot.js';

/**
 * Globaler Sweep UNABHAENGIG von jedem konkret eingeloggten Nutzer - im Unterschied zu tick()
 * (das immer den Zustand EINES aktiven Spielers als Ausgangspunkt braucht) verarbeitet das hier
 * JEDEN registrierten Nutzer nacheinander, unabhaengig davon, ob und wann er zuletzt online war.
 *
 * Grund fuer diese zweite Verarbeitungs-Schiene: Ohne sie haengt JEDE Spielmechanik mit festen
 * Zeitpunkten (Raid-Checkpoints, Missions-Ankunft, Multiplayer-Expeditions-Fortschritt)
 * daran, dass IRGENDEIN Spieler zufaellig gerade online ist und eine Anfrage stellt - bei null
 * aktiven Spielern (z.B. nachts) passiert schlicht gar nichts, komplett unabhaengig von den in
 * economy.ts festgelegten Checkpoints. Gedacht zum Aufruf durch einen externen Taktgeber (Render
 * Cron Job, oder ein kostenloser externer Uptime-Pinger wie cron-job.org/UptimeRobot), der diesen
 * Endpunkt alle paar Minuten aufruft - siehe /api/heartbeat in index.ts. Rein additiv: laeuft
 * neben der normalen tick()-Verarbeitung her, ersetzt sie nicht.
 */
export async function runGlobalHeartbeat(): Promise<{ usersProcessed: number; errors: number }> {
  const users = listAllUsers();
  let errors = 0;
  for (const u of users) {
    // Fehler-Isolation PRO NUTZER: ohne try/catch wuerde eine Ausnahme bei EINEM Nutzer den
    // gesamten Durchlauf abbrechen - alle danach gelisteten Nutzer wuerden dann bei JEDEM
    // Heartbeat-Aufruf (alle 2 Minuten, dauerhaft) niemals verarbeitet, komplett unsichtbar (der
    // Heartbeat laeuft unabhaengig von jedem Spieler-Request, ein Fehler hier zeigt sich nirgends
    // in der UI). Genau dieses Muster wurde als Verdacht bestaetigt, nachdem trotz aktivem
    // Heartbeat ueber mehrere Checkpoints hinweg bei KEINEM von zwei Spielern ein Raid
    // ausgeloest wurde - bei nur 2 Nutzern haette ein Fehler beim ersten in der Liste ausgereicht,
    // um den zweiten (und alle Checkpoints danach) fuer immer stillzulegen.
    try {
      const state = loadPlayerState(u.id);
      await processMissions(state);
      await processRaidTimer(state);
      // KI-Spieler-Feature nach dem Server-Umzug (Hetzner, siehe README) wieder REAKTIVIERT -
      // laeuft NACH der normalen Zeit-Verarbeitung, damit z.B. gerade fertiggestellte Gebaeude/
      // Forschung schon beruecksichtigt sind, bevor der naechste Schritt geplant wird.
      if (u.isBot) {
        await runBotTurn(state, users);
      }
      state.lastUpdate = Date.now();
      savePlayerState(state);
    } catch (err) {
      errors++;
      console.error(`runGlobalHeartbeat: Fehler bei Nutzer ${u.id}:`, err);
    }
  }

  // Gruppen-Expeditionen sind bereits nutzerunabhaengig ausgelegt (siehe groupOps.ts) - ein
  // einziger Durchlauf mit einem beliebigen Nutzer als Anker-Zustand deckt ALLE laufenden
  // Expeditionen ab, ein Durchlauf pro Nutzer waere unnoetig (siehe processAllDepartedGroupOperations).
  if (users.length > 0) {
    try {
      const anchorState = loadPlayerState(users[0].id);
      await processAllDepartedGroupOperations(anchorState);
      savePlayerState(anchorState);
    } catch (err) {
      errors++;
      console.error('runGlobalHeartbeat: Fehler bei processAllDepartedGroupOperations:', err);
    }
  }

  return { usersProcessed: users.length, errors };
}
