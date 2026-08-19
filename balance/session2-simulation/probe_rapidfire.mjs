// Pruefung der Nutzermeldung vom 17.08.2026: "RapidFire funktioniert bei normalen Schiffen nicht
// mehr, seit sie nur noch EIN RF-Ziel haben - die Werte springen gar nicht mehr."
//
// Gemessen wird dieselbe Flottenzusammensetzung ZWEIMAL: einmal mit Stueckzahlen UNTER der
// Aggregationsschwelle (Einzel-Pfad, fireShots()) und einmal darueber (Aggregat-Pfad,
// fireShotsAggregateShooters()). Gegner enthaelt in beiden Faellen die RF-Zieltypen.
// Ausgewiesen werden Schuesse je Einheit und die gezaehlten RapidFire-Ausloesungen.
//
// Aufruf: node probe_rapidfire.mjs [laeufe]
import { runner, cc, stateFor } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 10);
const st = stateFor('voll', 1);

// Angreifer mit je genau EINEM RF-Ziel (RF-Neuordnung 04.08.2026):
//   schwer -> leicht (RF 3), kreuzer -> schwer (4), schlachtschiff -> kreuzer (5),
//   schlachtkreuzer -> schlachtschiff (5), zerstoerer -> schlachtkreuzer (5), reaper -> zerstoerer (4)
const ATTACKER = { schwer: 1, kreuzer: 1, schlachtschiff: 1, schlachtkreuzer: 1, zerstoerer: 1, reaper: 1 };
// Gegner enthaelt ALLE sechs RF-Zieltypen, jeder ist also erreichbar.
const DEFENDER = { leicht: 2, schwer: 2, kreuzer: 2, schlachtschiff: 2, schlachtkreuzer: 2, zerstoerer: 2 };

const scale = (f, n) => Object.fromEntries(Object.entries(f).map(([id, w]) => [id, w * n]));

async function measure(label, n) {
  const fleet = scale(ATTACKER, n);
  const enemy = scale(DEFENDER, n);
  const agg = Object.entries(fleet).filter(([id, c]) => c > cc.stackAggregateThresholdFor(id)).length;

  const acc = {};
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enemy,
      research: st.research,
      playerClass: st.playerClass,
      kampfBoostActive: true,
      shipModules: st.shipModules,
      retreatMode: 'none',
    });
    Object.keys(fleet).forEach((id) => {
      const key = Object.keys(r.shotsA.shotsFired).find((k) => k === id || k.endsWith(`:${id}`));
      acc[id] = acc[id] || { shots: 0, rf: 0, rounds: 0 };
      acc[id].shots += key ? r.shotsA.shotsFired[key] || 0 : 0;
      acc[id].rf += key ? r.shotsA.rapidFireTriggers[key] || 0 : 0;
      acc[id].rounds += r.roundsFought;
    });
  }

  console.log(`\n--- ${label}: ${n} je Typ, ${agg}/6 Schuetzentypen aggregiert, ${RUNS} Laeufe ---`);
  console.log('Schuetze          Schuesse je Einheit/Runde   RF-Ausloesungen');
  Object.keys(fleet).forEach((id) => {
    const a = acc[id];
    const perUnitRound = a.shots / (RUNS * n) / (a.rounds / RUNS);
    console.log(`${id.padEnd(18)}${perUnitRound.toFixed(2).padStart(20)}${(a.rf / RUNS).toFixed(1).padStart(18)}`);
  });
}

await measure('EINZEL-Pfad (unter allen Schwellen)', 40);
await measure('AGGREGAT-Pfad (ueber allen Schwellen)', 400);
process.exit(0);
