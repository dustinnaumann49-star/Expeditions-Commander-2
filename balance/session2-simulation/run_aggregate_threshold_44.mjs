// Entscheidung 4.4 - Gegenmessung an der Aggregationsschwelle, MISCHFLOTTE.
//
// WARUM EIN ZWEITES SKRIPT: run_aggregate_threshold.mjs stellt dem Boss eine Flotte aus EINEM
// Schiffstyp (Kreuzer) gegenueber. Die Mehrfachziel-Salve trifft aber je ein Exemplar PRO
// anfaelligem TYP - bei nur einem Typ ist sie definitionsgemaess wirkungslos. Gemessen am
// 17.08.2026 liegen V1/V2/V3/V2b dort auf die Nachkommastelle gleich; der Aufbau kann die
// eigentliche Frage von 4.4 nicht beantworten. Zweiter Punkt: der feste Gegner mit Power 2e9
// vernichtet unter 4.4 jede Zelle bis 150 Kreuzer vollstaendig - eine saturierte Zelle ist kein
// Beleg.
//
// AUFBAU:
//   - Mischflotte aus den sechs Standardtypen von ADMIRAL_ALLOWED_SHIP_IDS, Staffelung so, dass
//     die Kreuzer-Klasse (Schwelle 100) und die Elite-Klasse (Schwelle 50) die Aggregation an
//     unterschiedlichen Stellen der Leiter ueberschreiten. Je Zelle wird protokolliert, welche
//     Typen tatsaechlich aggregiert sind (stackAggregateThresholdFor()).
//   - Gegner ist der ECHTE Generator: generateAdmiralEncounter(fleetPowerBase x 1,30), davon wird
//     nur der Boss uebernommen (Eskorte weggelassen, damit die Messung die Boss-Mechanik isoliert
//     und nicht die normale Eskorten-RF mitmisst). 1,30 ist der mittlere Wert aus
//     ADMIRAL_MULTIPLIER_ROLL.
//   - Profil `voll` (Forschung 10): erst dort bekommt der Boss ueber PIRATE_RESEARCH_SHARE = 1,0
//     den vollen Zielerfassungs-Bonus, und nur dann feuert die Salve nahe an ihrer Obergrenze.
//   - allowRetreat = false, damit die Zelle den vollen Schaden zeigt und nicht der gestaffelte
//     Einzelschiff-Rueckzug die Messung abschneidet (wie im Ausgangsskript).
//
// Beruehrt den Spielcode NICHT. Variante ueber MESSBUILD (siehe make_messbuild_44.mjs).
// Aufruf: MESSBUILD=... node run_aggregate_threshold_44.mjs <label> [laeufe] [datei] [profil]
import { appendFileSync } from 'node:fs';
import { combat, runner, cc, ships, stateFor, value, pct } from './lib4.mjs';

const [, , LABEL, RUNS_S, OUT_S, PROFILE_S, FACTOR_S] = process.argv;
const RUNS = Number(RUNS_S || 40);
const OUT = OUT_S || 'aggregate_threshold_44.txt';
const PROFILE = PROFILE_S || 'voll';
const FACTOR = Number(FACTOR_S || 1.75); // Stand 4.3 vom 16.08.2026
const ENEMY_ROLL = 1.30; // mittlerer Wert aus ADMIRAL_MULTIPLIER_ROLL

// Der Boss wird wie in run_admiral_bossscale.mjs (Modus "forschung") mit der Piraten-Forschung
// skaliert - das ist der beschlossene Stand von 4.3 und nicht Gegenstand dieser Messung. Ohne die
// Skalierung misst man einen Gegner, den der Plan bereits verworfen hat (Kalibrierlauf 17.08.2026:
// 3 Runden, 2 % Verlust - die Zelle sagt dann gar nichts ueber 4.4 aus).

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);

// Grundzusammensetzung: Kreuzer-Klasse voll, Elite-Klasse halb (so ueberschreiten die beiden
// Klassen ihre unterschiedlichen Schwellen an verschiedenen Stellen der Leiter).
const BASE = { kreuzer: 1, schlachtschiff: 1, bomber: 1, schlachtkreuzer: 0.5, zerstoerer: 0.5, reaper: 0.5 };
const LADDER = [90, 99, 101, 150, 400, 1000];

const fleetFor = (n) => Object.fromEntries(Object.entries(BASE).map(([id, f]) => [id, Math.round(n * f)]));
const aggregatedTypes = (f) =>
  Object.entries(f).filter(([id, n]) => n > cc.stackAggregateThresholdFor(id)).map(([id]) => id);

const state = stateFor(PROFILE, 1);
const pr = combat.computePirateResearch(state.research);
const bossMult = {
  waffen: combat.waffenMultiplier(pr),
  schild: combat.schildMultiplier(pr),
  panzerung: combat.panzerungMultiplier(pr),
};

const lines = [];
lines.push(`--- ${LABEL}, ${RUNS} Laeufe, Profil ${PROFILE}, Faktor ${FACTOR}x, Boss forschungsskaliert ---`);
lines.push('  n  Flotte Stk  aggregierte Typen                    Runden  Verlust Stk  Verlust %  Verlust Wert');

for (const n of LADDER) {
  const fleet = fleetFor(n);
  const startCount = Object.values(fleet).reduce((a, b) => a + b, 0);
  const startValue = fleetValue(fleet);
  const agg = aggregatedTypes(fleet);
  const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * ENEMY_ROLL * FACTOR);
  const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
  const bossStats = {
    waffen: b.waffen * bossMult.waffen,
    schild: b.schild * bossMult.schild,
    panzerung: b.panzerung * bossMult.panzerung,
  };

  let lostCount = 0, lostValue = 0, rounds = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: { [cc.ADMIRAL_BOSS_ID]: 1 },
      sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats },
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: true,
      shipModules: state.shipModules,
      allowRetreat: false,
    });
    const surv = {};
    Object.keys(fleet).forEach((id) => (surv[id] = r.survivorsA[id] || 0));
    lostCount += startCount - Object.values(surv).reduce((a, b) => a + b, 0);
    lostValue += startValue - fleetValue(surv);
    rounds += r.roundsFought;
  }

  const aggLabel = agg.length === 0 ? 'keine' : agg.join('/');
  lines.push(
    `${String(n).padStart(5)} ${String(startCount).padStart(10)}  ${aggLabel.padEnd(36)}`
    + `${(rounds / RUNS).toFixed(1).padStart(7)} ${(lostCount / RUNS).toFixed(1).padStart(12)}`
    + `${pct(lostCount / RUNS / startCount).padStart(11)}`
    + `${((lostValue / RUNS) / 1e9).toFixed(2).padStart(11)} Mrd`
  );
  console.log(lines[lines.length - 1]);
}

appendFileSync(OUT, lines.join('\n') + '\n\n');
process.exit(0);
