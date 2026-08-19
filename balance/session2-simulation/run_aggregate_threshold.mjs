// Overkill gegen Aggregat-Pool: was passiert an der STACK_AGGREGATE_THRESHOLD_BY_TYPE-Schwelle?
// Ein einzelner Gegner mit sehr hohem Waffenwert (wie der Piratenadmiral) gegen dieselbe
// Schiffszahl knapp UNTER und knapp UEBER der Aggregations-Schwelle.
// Aufruf: node run_aggregate_threshold.mjs [laeufe]
import { combat, runner, cc, ships, value, pct } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 6);
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => value(byId[id].cost);

console.log(`Schwelle Kreuzer: ${cc.stackAggregateThresholdFor('kreuzer')} (Stapel > Schwelle wird aggregiert)\n`);

// Fester Gegner: 1 Einheit mit Admiral-typischem Profil (14% Waffen / 5% Schild / 81% Panzerung)
const BOSS_POWER = 2e9;
const bossStats = { waffen: BOSS_POWER * 0.14, schild: BOSS_POWER * 0.05, panzerung: BOSS_POWER * 0.81 };
console.log(`Gegner: 1x Piratenadmiral, Waffen ${(bossStats.waffen / 1e6).toFixed(0)} Mio (ein Kreuzer hat ${((byId.kreuzer.stats.panzerung + byId.kreuzer.stats.schild) / 1e3).toFixed(0)}k HP)\n`);

console.log('Kreuzer  aggregiert  Runden  Verlust Stk  Verlust %  Verlust Wert');
for (const n of [90, 99, 101, 150, 400]) {
  let lost = 0, rounds = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: { kreuzer: n },
      sideBShips: { piratenadmiral: 1 },
      sideBStatsOverride: { piratenadmiral: bossStats },
      research: {},
      kampfBoostActive: false,
      playerClass: null,
      shipModules: {},
      retreatMode: 'none',
    });
    lost += n - (r.survivorsA.kreuzer || 0);
    rounds += r.roundsFought;
  }
  const avgLost = lost / RUNS;
  console.log(
    `${String(n).padStart(7)} ${(n > cc.stackAggregateThresholdFor('kreuzer') ? 'ja' : 'nein').padStart(11)} ${(rounds / RUNS).toFixed(1).padStart(7)} ${avgLost.toFixed(1).padStart(12)} ${pct(avgLost / n).padStart(10)} ${((avgLost * shipValue('kreuzer')) / 1e6).toFixed(0).padStart(10)} Mio`
  );
}
console.log('\nErwartung bei Einzel-Einheiten: ein Schuss toetet 1 Kreuzer (Rest verpufft, nur Durchschlags-');
console.log('Kaskade reicht weiter). Bei Aggregation: Schaden geht in den HP-Pool, kein Overkill-Verlust.');
process.exit(0);
