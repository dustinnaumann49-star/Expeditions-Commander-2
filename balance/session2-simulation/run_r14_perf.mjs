// Laufzeit des Aggregat-Pfads vor und nach der R14-Reparatur.
//
// Hintergrund: die Aggregation ist eine reine Performance-Optimierung (sie hat minutenlange
// Kampfberechnungen beseitigt) und MUSS erhalten bleiben - die Rechenzeit darf nur von der Anzahl
// VERSCHIEDENER Typen abhaengen, nicht von der Stueckzahl. Die Reparatur greift in genau diesen
// Pfad ein, also wird sie gegengemessen.
//
// Gemessen wird die reine Wandzeit je Kampf (Worker-Aufruf), an einer Flotte in der
// Groessenordnung 20.000+ Schiffe - dort ist JEDER Typ aggregiert.
//
// Aufruf: [MESSBUILD=<pfad auf dist-Kopie>] node run_r14_perf.mjs <label> [laeufe] [datei]
// Der Vorher-Wert wird ueber MESSBUILD auf eine dist-Kopie VOR der Aenderung gemessen, der
// Nachher-Wert ohne MESSBUILD gegen den frischen Build (Messregel 1: vorher npx tsc).
import { appendFileSync } from 'node:fs';
import { combat, runner, sectors, stateFor } from './lib4.mjs';

const [, , LABEL, RUNS_S, OUT_S] = process.argv;
const RUNS = Number(RUNS_S || 10);
const OUT = OUT_S || 'r14_perf.txt';

// Grosse gemischte Flotte: 20.700 Schiffe, alle acht Typen deutlich ueber ihrer
// Aggregationsschwelle (500 / 100 / 50, siehe STACK_AGGREGATE_THRESHOLD_BY_TYPE).
const SCALE = Number(process.env.SCALE || 1); // Skalierungstest: haengt die Rechenzeit an der Stueckzahl?
const FLEET_BASE = { leicht: 6000, schwer: 5000, kreuzer: 3000, schlachtschiff: 2500, bomber: 1500, schlachtkreuzer: 1200, zerstoerer: 900, reaper: 600 };
const FLEET = Object.fromEntries(Object.entries(FLEET_BASE).map(([id, n]) => [id, n * SCALE]));
const st = stateFor('voll', 1);
const total = Object.values(FLEET).reduce((a, b) => a + b, 0);

const lines = [`--- ${LABEL}, ${RUNS} Laeufe, ${total.toLocaleString('de-DE')} Schiffe, Profil voll ---`,
  'Sektor            ms je Kampf   Runden   Schiffe Gegner'];

for (const sektorId of ['piraten_mittel', 'piraten_elite']) {
  const roll = () => {
    const r = sectors.PIRATEN_MULTIPLIER_ROLL[sektorId];
    const pick = r[Math.floor(Math.random() * r.length)];
    return Array.isArray(pick) ? pick[0] + Math.random() * (pick[1] - pick[0]) : pick;
  };
  let ms = 0, rounds = 0, enemyCount = 0;

  for (let i = 0; i < RUNS; i++) {
    const power = combat.combatFleetPowerBase(FLEET) * roll();
    const enemy = combat.generatePiratenFleet(power, 0, 'kampfgruppe');
    enemyCount += Object.values(enemy).reduce((a, b) => a + b, 0);
    const t0 = performance.now();
    const r = await runner.runCombatInWorker({
      sideAShips: FLEET,
      sideBShips: enemy,
      research: st.research,
      playerClass: st.playerClass,
      kampfBoostActive: true,
      shipModules: st.shipModules,
      allowRetreat: true,
    });
    ms += performance.now() - t0;
    rounds += r.roundsFought;
    process.stdout.write(`  ${sektorId} Lauf ${i + 1}/${RUNS}\r`);
  }

  lines.push(
    `${sektorId.padEnd(18)}${(ms / RUNS).toFixed(0).padStart(9)} ms`
    + `${(rounds / RUNS).toFixed(1).padStart(9)}`
    + `${Math.round(enemyCount / RUNS).toLocaleString('de-DE').padStart(16)}`
  );
  console.log(lines[lines.length - 1]);
}

appendFileSync(OUT, lines.join('\n') + '\n\n');
process.exit(0);
