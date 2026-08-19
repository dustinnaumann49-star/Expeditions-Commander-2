// Wie stark verschiebt der R14-Defekt ein normales Kampfergebnis?
//
// Die Aggregation ist laut Entscheidung 1 eine reine PERFORMANCE-Optimierung und darf das
// Kampfergebnis nicht veraendern. Gemessen wird deshalb derselbe Kampf zweimal: einmal mit dem
// normalen Build (Aggregation aktiv, RapidFire im Aggregat-Pfad wirkungslos) und einmal mit einem
// Messbuild, in dem stackAggregateThresholdFor() 1e9 zurueckgibt - dort laeuft alles ueber den
// Einzel-Pfad, RapidFire wirkt also so, wie es gedacht ist. Die Differenz ist die Groesse des
// Defekts und zugleich der Abnahmetest fuer die Reparatur: nach R14 muessen beide Zahlen
// zusammenfallen.
//
// Aufruf: [MESSBUILD=...] node run_r14_delta.mjs <label> [laeufe] [datei] [sektor]
//
// 17.08.2026 ergaenzt: optionales viertes Argument <sektor>. Ohne Angabe laufen wie bisher alle
// drei Sektoren in einem Aufruf; mit Angabe genau einer - so lassen sich die Zellen scheibenweise
// messen und das Ergebnis sofort anhaengen (Messregel aus der Uebergabe: ein Vollauf schreibt
// seine Tabelle erst am Ende und ist bei einem Abbruch komplett verloren).
import { appendFileSync } from 'node:fs';
import { combat, runner, sectors, stateFor, value, pct } from './lib4.mjs';
import { SHIPS } from '../../server/dist/game/data/ships.js';

const [, , LABEL, RUNS_S, OUT_S, SEKTOR_S] = process.argv;
const RUNS = Number(RUNS_S || 40);
const OUT = OUT_S || 'r14_delta.txt';

const byId = Object.fromEntries(SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);

// Mittelgrosse gemischte Flotte: gross genug, dass im Normalbuild ALLE Typen aggregiert sind
// (Schwellen 500 / 100 / 50), klein genug, dass der Einzel-Pfad in vertretbarer Zeit rechnet.
const FLEET = { leicht: 600, schwer: 600, kreuzer: 400, schlachtschiff: 300, bomber: 200, schlachtkreuzer: 200, zerstoerer: 150, reaper: 100 };
const st = stateFor('voll', 1);
const startValue = fleetValue(FLEET);

const lines = [`--- ${LABEL}, ${RUNS} Laeufe je Sektor, Profil voll ---`, 'Sektor            Runden   Verlust Wert   Verlust %   Gegner vernichtet'];

const SEKTOREN = SEKTOR_S ? [SEKTOR_S] : ['piraten_mittel', 'piraten_hoch', 'piraten_elite'];

for (const sektorId of SEKTOREN) {
  // Feindstaerke wie im Spiel: gewuerfelt aus PIRATEN_MULTIPLIER_ROLL (Messregel 16 - aus dem
  // Code gelesen, nicht aus einer Beschreibung; Eintraege koennen selbst Bereiche sein).
  const roll = () => {
    const r = sectors.PIRATEN_MULTIPLIER_ROLL[sektorId];
    const pick = r[Math.floor(Math.random() * r.length)];
    return Array.isArray(pick) ? pick[0] + Math.random() * (pick[1] - pick[0]) : pick;
  };
  let lost = 0, rounds = 0, killed = 0;

  for (let i = 0; i < RUNS; i++) {
    const power = combat.combatFleetPowerBase(FLEET) * roll();
    const enemy = combat.generatePiratenFleet(power, 0, 'kampfgruppe');
    const r = await runner.runCombatInWorker({
      sideAShips: FLEET,
      sideBShips: enemy,
      research: st.research,
      playerClass: st.playerClass,
      kampfBoostActive: true,
      shipModules: st.shipModules,
      retreatMode: 'all',
    });
    const surv = {};
    Object.keys(FLEET).forEach((id) => (surv[id] = r.survivorsA[id] || 0));
    lost += startValue - fleetValue(surv);
    rounds += r.roundsFought;
    const sent = Object.values(enemy).reduce((a, b) => a + b, 0);
    const left = Object.values(r.survivorsB).reduce((a, b) => a + b, 0);
    killed += sent > 0 ? (sent - left) / sent : 0;
  }

  lines.push(
    `${sektorId.padEnd(18)}${(rounds / RUNS).toFixed(1).padStart(6)}`
    + `${((lost / RUNS) / 1e9).toFixed(2).padStart(14)} Mrd`
    + `${pct(lost / RUNS / startValue).padStart(12)}`
    + `${pct(killed / RUNS).padStart(20)}`
  );
  console.log(lines[lines.length - 1]);
}

appendFileSync(OUT, lines.join('\n') + '\n\n');
process.exit(0);
