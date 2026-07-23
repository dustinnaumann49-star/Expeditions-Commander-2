import { listAllUsers } from '../db.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { tick } from './actions.js';
import { processMissions } from './missions.js';
import { processRaidTimer } from './raids.js';
import { processAllDepartedGroupOperations } from './groupOps.js';
import { runBotTurn } from './bot.js';
import { maybeSpawnGalaxyEvent } from './galaxyEvents.js';
import { processPirateAttacks, runAllPirateBaseTurns } from './pirateBaseState.js';
import { processOutpostDeployments, runOutpostPirateAiTurn } from './outposts.js';

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
      await processPirateAttacks(state);
      await processOutpostDeployments(state);
      await processMissions(state);
      await processRaidTimer(state);
      // KI-Spieler-Feature nach dem Server-Umzug (Hetzner, siehe README) wieder REAKTIVIERT -
      // laeuft NACH der normalen Zeit-Verarbeitung, damit z.B. gerade fertiggestellte Gebaeude/
      // Forschung schon beruecksichtigt sind, bevor der naechste Schritt geplant wird.
      if (u.isBot) {
        await runBotTurn(state, users);
      }
      savePlayerState(state);
    } catch (err) {
      errors++;
      console.error(`runGlobalHeartbeat: Fehler bei Nutzer ${u.id}:`, err);
    }
  }

  // Galaxie-Ereignisse (Wrack/Handelskonvoi, siehe galaxyEvents.ts): global, nicht an einen Nutzer
  // gebunden - EINMAL pro Heartbeat-Durchlauf gewuerfelt, nicht pro Nutzer (siehe Kommentar dort).
  try {
    maybeSpawnGalaxyEvent();
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei maybeSpawnGalaxyEvent:', err);
  }

  // Piratenbasen (Nutzerentscheidung Juli 2026: wachsen jetzt "genau wie Spieler" - eigene
  // Wirtschaft, Forschung, Flotten-/Verteidigungsbau, Asteroiden-Mining, siehe pirateBaseState.ts)
  // bekommen genau wie die Bot-Accounts ihren eigenen Zug pro Heartbeat, nicht nur lazy beim
  // naechsten Laden (Angriff/Spionage/Galaxie-Ansicht) - sonst wuerden sie nur wachsen, wenn
  // zufaellig gerade jemand hinschaut.
  try {
    await runAllPirateBaseTurns();
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei runAllPirateBaseTurns:', err);
  }

  // Aussenposten (siehe outposts.ts): opportunistische Piraten-Rueckeroberungsversuche gegen
  // aktuell spieler-eigene Posten, einmal pro Heartbeat, analog zu runAllPirateBaseTurns() oben.
  try {
    await runOutpostPirateAiTurn();
  } catch (err) {
    errors++;
    console.error('runGlobalHeartbeat: Fehler bei runOutpostPirateAiTurn:', err);
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
