// Entscheidung 13.3 (Block C, Schritt 6) - ABNAHMEMESSUNG.
//
// MESSKRITERIUM AUS DEM PLAN (Entscheidung 13, "Messkriterien", dritter Punkt):
//   "Nach 13.3: Basiswachstum zweimal mit unterschiedlich vielen Galaxie-Aufrufen messen -
//    die Ergebnisse muessen identisch sein."
//
// AUFBAU: Zwei Zellen ueber ein IDENTISCHES Zeitfenster (gleiche Wanduhr-Dauer), die sich nur in
// der Zahl der loadPirateBase()-Aufrufe unterscheiden - genau das, was ein Spieler durch haeufiges
// Oeffnen der Galaxie-Ansicht ausloest (routes.ts -> listActivePirateBaseSummaries() ->
// listActivePirateBases() -> loadPirateBase() je Basis).
//   "wenige"  = 1 Aufruf je Sekunde   (etwa ein Client, der gelegentlich nachschaut)
//   "viele"   = Dauerschleife         (mehrere offene Fenster mit 3-Sekunden-Poll, plus Spionage/
//                                      Angriffs-Aufrufe - real gemessen wurden am 12.08.2026 rund
//                                      40 Cross-User-Durchlaeufe pro Minute)
//
// GEMESSEN WIRD die Zahl der ausgefuehrten BAU-ENTSCHEIDUNGSSCHRITTE (runEconomyBotTurn()), nicht
// der Zuwachs an Einheiten.
//
// WARUM NICHT AM WACHSTUM (Fehlversuch vom 17.08.2026, ausdruecklich festgehalten): der erste
// Aufbau dieses Skripts verglich gebaute Einheiten und ausgegebene Ressourcen. Ergebnis waren
// x0,94 bei 12.164-facher Aufruf-Zahl - also scheinbar "kein Defekt". Die Ursache ist ein
// Messfehler, kein Befund: ueber ein kurzes Zeitfenster ist nicht die Aufruf-Haeufigkeit die
// Bremse, sondern die vollen Bau-Slots. Die Basis fuellt ihre Warteschlangen in den ersten
// Zuegen auf 11/11 (3 Schiffe + 3 Verteidigung + 4 Forschung + 1 Gebaeude) und in 20 Sekunden
// wird nichts davon fertig - gemessen: Reaper 12 min, Solarkraftwerk 86 min, Waffenforschung
// 12 h Laufzeit. Jeder weitere Zug ist damit folgenlos, und zwar in BEIDEN Zellen.
// Der Zaehler umgeht diesen Confounder: er misst die Groesse, um die es in 13.3 tatsaechlich
// geht, unabhaengig davon, ob gerade ein Slot frei ist.
//
// STARTKAPITAL: Die Basis bekommt vor jeder Zelle denselben grossen Ressourcenbestand, damit ein
// faelliger Zug nie an fehlendem Geld scheitert. Fuer beide Zellen identisch.
//
// DATENBANK: db.ts oeffnet server/data/game.db mit hartkodiertem Pfad (siehe Abschnitt 1b,
// "Technische Vorbedingungen"). Dieses Skript ist deshalb NUR gegen eine lokale Wegwerf-Datenbank
// zu starten, NIEMALS gegen den produktiven Server. Es setzt die benutzte Basis vor jeder Zelle
// selbst zurueck und fasst nichts anderes an.
//
// Aufruf: MESSBUILD=<abs>/messbuild_133_VORHER  node run_base_growth_133.mjs vorher  [sekunden] [datei]
//         MESSBUILD=<abs>/messbuild_133_NACHHER node run_base_growth_133.mjs nachher [sekunden] [datei]
import { appendFileSync, existsSync } from 'node:fs';

const [, , LABEL, KAPITAL, SECONDS_S, OUT_S] = process.argv;
const SECONDS = Number(SECONDS_S || 20);
const OUT = OUT_S || 'base_growth_133.txt';

const D = process.env.MESSBUILD ? `${process.env.MESSBUILD}/game` : '../../server/dist/game';
const DB = process.env.MESSBUILD ? `${process.env.MESSBUILD}/db.js` : '../../server/dist/db.js';
const pbs = await import(`${D}/pirateBaseState.js`);
const db = await import(DB);
if (typeof pbs.economyTurnCount !== 'number') {
  throw new Error('Zaehler fehlt - bitte zuerst `node make_messbuild_133.mjs` ausfuehren und MESSBUILD setzen.');
}

const BASE_ID = (await import(`${D}/data/galaxyConstants.js`)).ACTIVE_PIRATE_BASE_IDS[0];
// Zwei Kapitalstaende, weil sie zu VERSCHIEDENEN Ergebnissen fuehren und beide real vorkommen:
//   "gross" = ausgebaute Basis. Der Entscheidungsschritt kauft sofort teure Einheiten, die
//             Warteschlangen stehen dauerhaft auf 11/11 und das SLOT-Limit bindet, nicht die
//             Aufruf-Haeufigkeit. Das Wachstum ist hier auch vorher schon aufruf-unabhaengig.
//   "klein" = frische Basis kurz nach dem Server-Reset (Abschnitt 1a) bzw. der Zustand aus der
//             Sparfallen-Diagnose vom 12.08.2026: es reicht nur fuer billige Einzelstuecke, die
//             in Sekunden fertig werden. Hier werden Slots staendig frei, und die Zahl der
//             Entscheidungsschritte schlaegt direkt auf das Wachstum durch. DAS ist die Zelle,
//             in der 13.3 tatsaechlich etwas bewirkt.
const RESOURCE_LEVELS = {
  gross: { metall: 5e9, kristall: 5e9, deuterium: 5e9, dm: 0 },
  klein: { metall: 150000, kristall: 90000, deuterium: 40000, dm: 0 },
};
const START_RESOURCES = RESOURCE_LEVELS[KAPITAL || 'gross'];
if (!START_RESOURCES) throw new Error(`Unbekannter Kapitalstand "${KAPITAL}" - erlaubt: gross, klein`);

function countUnits(state) {
  const sum = (rec) => Object.values(rec || {}).reduce((s, n) => s + n, 0);
  const levels = (rec) => Object.values(rec || {}).reduce((s, n) => s + n, 0);
  return {
    ships: sum(state.fleet),
    defense: sum(state.defense),
    buildingLevels: levels(state.buildings),
    researchLevels: levels(state.research),
    queues: state.buildQueue.length + state.defenseQueue.length + state.researchQueue.length + state.buildingQueue.length,
  };
}

async function resetBase() {
  await pbs.ensurePirateBases?.();
  const base = await pbs.loadPirateBase(BASE_ID);
  base.state.resources = { ...START_RESOURCES };
  base.state.buildQueue = [];
  base.state.defenseQueue = [];
  base.state.researchQueue = [];
  base.state.buildingQueue = [];
  base.nextEconomyTurn = null;
  db.savePirateBaseJson(BASE_ID, JSON.stringify(base));
  return countUnits(base.state);
}

// Eine Zelle: `seconds` lang laden, entweder gedrosselt (1/s) oder so oft wie moeglich.
async function cell(mode, seconds) {
  const before = await resetBase();
  pbs.resetEconomyTurnCount();
  const t0 = Date.now();
  let calls = 0;
  while (Date.now() - t0 < seconds * 1000) {
    await pbs.loadPirateBase(BASE_ID);
    calls++;
    if (mode === 'wenige') {
      const nextAt = t0 + calls * 1000;
      const wait = nextAt - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  }
  const base = await pbs.loadPirateBase(BASE_ID);
  const after = countUnits(base.state);
  return {
    calls,
    turns: pbs.economyTurnCount,
    seconds: (Date.now() - t0) / 1000,
    dShips: after.ships - before.ships,
    dDefense: after.defense - before.defense,
    dBuildings: after.buildingLevels - before.buildingLevels,
    dResearch: after.researchLevels - before.researchLevels,
    queues: after.queues,
    spent:
      (START_RESOURCES.metall - base.state.resources.metall) +
      (START_RESOURCES.kristall - base.state.resources.kristall) * 1.5 +
      (START_RESOURCES.deuterium - base.state.resources.deuterium) * 3,
  };
}

if (!existsSync(OUT)) {
  appendFileSync(OUT, [
    '=== Entscheidung 13.3 - Bau-Entscheidungsschritt von der Aufruf-Haeufigkeit entkoppeln ===',
    'Abnahmekriterium (Plan, Entscheidung 13): Basiswachstum zweimal mit unterschiedlich vielen',
    'Galaxie-Aufrufen messen - die Ergebnisse muessen IDENTISCH sein.',
    '',
    'Gemessen ueber ein identisches Zeitfenster; einziger Unterschied ist die Zahl der',
    'loadPirateBase()-Aufrufe. "vorher" = dist-Kopie VOR der Aenderung (ungedrosselt),',
    '"nachher" = Messbuild mit PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 1000 ms (produktiv 120000 ms;',
    'heruntergesetzt, damit die Mechanik in Sekunden statt Stunden sichtbar wird).',
    'Startkapital je Zelle identisch (5 Mrd je Ressource), Basis vor jeder Zelle zurueckgesetzt.',
    '',
    'Gezaehlt wird runEconomyBotTurn() = ein vollstaendiger Bau-Entscheidungsschritt.',
    '',
    'Stand    Kapital  Aufrufe   Bau-Zuege  Zuege/s  Dauer   +Schiffe  +Verteid.  Warteschl.  ausgegeben',
  ].join('\n') + '\n');
}

const out = [];
for (const mode of ['wenige', 'viele']) {
  const r = await cell(mode, SECONDS);
  const line =
    `${LABEL.padEnd(9)}${(KAPITAL || 'gross').padEnd(7)}${String(r.calls).padStart(8)}${String(r.turns).padStart(11)}`
    + `${(r.turns / r.seconds).toFixed(1).padStart(9)}`
    + `${(r.seconds.toFixed(1) + 's').padStart(8)}`
    + `${String(r.dShips).padStart(10)}${String(r.dDefense).padStart(11)}`
    + `${String(r.queues).padStart(12)}`
    + `${((r.spent / 1e6).toFixed(1) + ' Mio').padStart(13)}`;
  appendFileSync(OUT, line + '\n');
  console.log(line);
  out.push(r);
}

// Der eigentliche Befund in einer Zahl: Faktor zwischen "viele Aufrufe" und "wenige Aufrufe".
// 1,0 bedeutet, dass der Bau-Entscheidungsschritt nicht mehr an der Aufruf-Haeufigkeit haengt.
const growth = out[0].spent > 0 ? out[1].spent / out[0].spent : NaN;
const note = `  -> [${LABEL}/${KAPITAL || 'gross'}] Aufrufe x${(out[1].calls / out[0].calls).toFixed(0)}  ->  Bau-Zuege x${(out[1].turns / out[0].turns).toFixed(2)}, Ausgaben x${growth.toFixed(2)}   (Ziel nach 13.3: beide x1,00)`;
appendFileSync(OUT, note + '\n');
console.log(note);
process.exit(0);
