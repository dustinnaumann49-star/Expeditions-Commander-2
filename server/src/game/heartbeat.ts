import { listAllUsers } from '../db.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { tick } from './actions.js';
import { processMissions } from './missions.js';
import { processRaidTimer } from './raids.js';
import { processAllDepartedGroupOperations } from './groupOps.js';
import { maybeSpawnGalaxyEvent } from './galaxyEvents.js';
import { processPirateAttacks, runAllPirateBaseOffensiveTurns } from './pirateBaseState.js';
import { runStationHeartbeatTick } from './stations.js';
import { runBotTurn } from './bot.js';

/**
 * Globaler Sweep UNABHAENGIG von jedem konkret eingeloggten Nutzer - im Unterschied zu einem
 * durch einen Request ausgeloesten tick()-Aufruf (der immer den Zustand EINES aktiven Spielers
 * als Ausgangspunkt braucht) verarbeitet das hier JEDEN registrierten Nutzer nacheinander,
 * unabhaengig davon, ob und wann er zuletzt online war - UND ruft dabei selbst tick() auf (siehe
 * Bugfix-Kommentar weiter unten: frueher lief hier gar kein tick(), wodurch KI-Spieler nie
 * Ressourcen produziert oder Warteschlangen abgeschlossen haben).
 *
 * Grund fuer diese zweite Verarbeitungs-Schiene: Ohne sie haengt JEDE Spielmechanik mit festen
 * Zeitpunkten (Raid-Checkpoints, Missions-Ankunft, Multiplayer-Expeditions-Fortschritt)
 * daran, dass IRGENDEIN Spieler zufaellig gerade online ist und eine Anfrage stellt - bei null
 * aktiven Spielern (z.B. nachts) passiert schlicht gar nichts, komplett unabhaengig von den in
 * economy.ts festgelegten Checkpoints. Gedacht zum Aufruf durch einen externen Taktgeber (Render
 * Cron Job, oder ein kostenloser externer Uptime-Pinger wie cron-job.org/UptimeRobot), der diesen
 * Endpunkt alle paar Minuten aufruft - siehe /api/heartbeat in index.ts.
 */
// Diagnose (Juli 2026, Nutzer-Feedback: wiederkehrende CPU-Spitzen auf dem Server, mehrere Minuten
// lang, ohne jede Spur in den bisherigen Logs - vermuteter Zusammenhang mit dem "Nachhol"-Prinzip
// dieses Servers, siehe Kommentar oben) - jede Phase wird jetzt einzeln gestoppt, und JEDER
// einzelne Nutzer-tick() wird gemessen. Nur bei ungewoehnlich langer Dauer wird tatsaechlich
// geloggt (siehe SLOW_*_MS unten), damit die normalen, schnellen Durchlaeufe (die grosse Mehrheit)
// die Logs nicht zuspammen - beim naechsten Auftreten sollte so sichtbar werden, WELCHE Phase/
// WELCHER Nutzer die Zeit braucht, statt nur "irgendwo, irgendwie".
const SLOW_USER_TICK_MS = 500;
const SLOW_PHASE_MS = 1000;
const SLOW_HEARTBEAT_TOTAL_MS = 3000;

export async function runGlobalHeartbeat(): Promise<{ usersProcessed: number; errors: number }> {
  const heartbeatStart = Date.now();
  const users = listAllUsers();
  let errors = 0;
  for (const u of users) {
    const userTickStart = Date.now();
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
      // KERN-BUGFIX: tick() (Ressourcenproduktion, Bau-/Forschungs-/Verteidigungs-/Modul-
      // Warteschlangen, Galaxie-Rueckkehr) wurde hier bisher NIE aufgerufen - bei jedem echten
      // Spieler-Request passiert das automatisch (siehe handleAction() in routes.ts), bei einem
      // rein Server-seitig gesteuerten KI-Spieler, der NIE einen Request stellt, jedoch nirgends
      // sonst. Ergebnis: KI-Spieler haben nie Ressourcen produziert und ihre Bau-/Forschungs-
      // Warteschlangen sind nie fertig geworden - obwohl runBotTurn() unten scheinbar erfolgreich
      // neue Auftraege einreihte, blieben Flotte/Gebaeude/Forschung dauerhaft bei praktisch Null.
      // Betrifft nebenbei auch MENSCHLICHE Spieler: die Zeile `state.lastUpdate = Date.now()`
      // weiter unten wurde bisher OHNE vorherigen tick()-Aufruf gesetzt, wodurch bis zu
      // HEARTBEAT_INTERVAL_MS (2 Minuten) Produktionszeit pro Takt verloren gingen, sobald ein
      // Spieler laenger offline war (tick() berechnet die vergangene Zeit ja anhand von
      // state.lastUpdate) - durch den tick()-Aufruf hier jetzt ebenfalls behoben.
      await tick(state);
      // Nicht mehr Teil von tick() selbst (siehe Kommentar bei runEconomyTick() in actions.ts,
      // Zirkelimport-Vermeidung fuer pirateBaseState.ts) - deshalb hier explizit direkt danach.
      // Loest nur bereits von einem Spieler gestartete Angriffe auf (siehe startPirateBaseAttack in
      // routes.ts) - Piratenbasen greifen selbst nicht mehr an (siehe README Punkt 97/98).
      await processPirateAttacks(state);
      await processMissions(state);
      await processRaidTimer(state);
      // KI-Mitspieler (KI-Vega/KI-Nyx, siehe bot.ts) throttled wieder eingefuehrt (README Punkt
      // 100) - bewusst NACH der normalen Zeit-Verarbeitung, damit runBotTurn() auf einem bereits
      // aktuellen Zustand (Ressourcen/Missionen/Raids) entscheidet, genau wie ein Mensch, der
      // gerade eingeloggt ist.
      if (u.isBot) await runBotTurn(state, users);
      savePlayerState(state);
      const userTickMs = Date.now() - userTickStart;
      if (userTickMs > SLOW_USER_TICK_MS) {
        console.warn(`runGlobalHeartbeat: Langsamer tick() bei ${u.username} (${u.isBot ? 'Bot' : 'Mensch'}, id=${u.id}): ${userTickMs}ms`);
      }
    } catch (err) {
      errors++;
      console.error(`runGlobalHeartbeat: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
  const userLoopMs = Date.now() - heartbeatStart;
  if (userLoopMs > SLOW_PHASE_MS) {
    console.warn(`runGlobalHeartbeat: Nutzer-Schleife (${users.length} Nutzer) dauerte ${userLoopMs}ms`);
  }

  // Galaxie-Ereignisse (Wrack/Handelskonvoi, siehe galaxyEvents.ts): global, nicht an einen Nutzer
  // gebunden - EINMAL pro Heartbeat-Durchlauf gewuerfelt, nicht pro Nutzer (siehe Kommentar dort).
  try {
    maybeSpawnGalaxyEvent();
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei maybeSpawnGalaxyEvent:', err);
  }

  // Allianz-Stationen (siehe stations.ts): rein passive Produktion, KEINE Gegner-KI - holt die
  // seit dem letzten Tick vergangene Zeit fuer ALLE Stationen nach, unabhaengig davon, ob gerade
  // ein Mitglied online ist. Global wie Galaxie-Ereignisse, nicht an einen Nutzer gebunden.
  try {
    runStationHeartbeatTick();
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei runStationHeartbeatTick:', err);
  }

  // Piratenbasen-Offensiv-KI throttled wieder eingefuehrt (README Punkt 127) - Basen wachsen
  // weiterhin NICHT eigenstaendig (siehe pirateBaseState.ts), greifen aber wieder mit eigenem,
  // per-Basis-Cooldown (12-24h) selbst an. EINMAL pro Heartbeat-Durchlauf fuer ALLE aktiven Basen,
  // Ziel-Pool sind alle echten Nutzer (Menschen + Bots) - global wie Galaxie-Ereignisse/Stationen,
  // nicht an einen einzelnen Nutzer der Schleife oben gebunden.
  try {
    const offensiveStart = Date.now();
    await runAllPirateBaseOffensiveTurns(users.map((u) => u.id));
    const offensiveMs = Date.now() - offensiveStart;
    if (offensiveMs > SLOW_PHASE_MS) {
      console.warn(`runGlobalHeartbeat: runAllPirateBaseOffensiveTurns() dauerte ${offensiveMs}ms`);
    }
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei runAllPirateBaseOffensiveTurns:', err);
  }

  // Gruppen-Expeditionen sind bereits nutzerunabhaengig ausgelegt (siehe groupOps.ts) - ein
  // einziger Durchlauf mit einem beliebigen Nutzer als Anker-Zustand deckt ALLE laufenden
  // Expeditionen ab, ein Durchlauf pro Nutzer waere unnoetig (siehe processAllDepartedGroupOperations).
  if (users.length > 0) {
    const groupOpsStart = Date.now();
    try {
      const anchorState = loadPlayerState(users[0].id);
      await processAllDepartedGroupOperations(anchorState);
      savePlayerState(anchorState);
    } catch (err) {
      errors++;
      console.error('runGlobalHeartbeat: Fehler bei processAllDepartedGroupOperations:', err);
    }
    const groupOpsMs = Date.now() - groupOpsStart;
    if (groupOpsMs > SLOW_PHASE_MS) {
      console.warn(`runGlobalHeartbeat: processAllDepartedGroupOperations() dauerte ${groupOpsMs}ms`);
    }
  }

  const totalMs = Date.now() - heartbeatStart;
  if (totalMs > SLOW_HEARTBEAT_TOTAL_MS) {
    console.warn(
      `runGlobalHeartbeat: GESAMTER Durchlauf ungewöhnlich langsam: ${totalMs}ms für ${users.length} Nutzer (Nutzer-Schleife ${userLoopMs}ms)`
    );
  }

  return { usersProcessed: users.length, errors };
}
