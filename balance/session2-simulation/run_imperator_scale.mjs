// Nutzerhypothese (14.08.2026): "Je mehr andere Schiffe ich mitschicke, desto weniger Treffer
// kann der Imperator noch setzen, weil die anderen Typen die Feinde schneller ausschalten."
// Test: Flotte UND Gegner werden gemeinsam skaliert, die Zahl der Imperatoren bleibt fest bei 6.
// Gemessen wird, was der einzelne Imperator noch zustande bringt - Schuesse, Treffer, Schaden -
// nicht sein prozentualer Anteil (der muss allein rechnerisch fallen, wenn ringsum mehr Schiffe
// stehen, und sagt deshalb nichts ueber die Hypothese aus).
import { combat, pct } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 3);
const RESEARCH = {};
['waffen','schild','panzerung','zielerfassung','durchschlag','schildregeneration','praezision','ausweichen','kritischetreffer']
  .forEach((id) => (RESEARCH[id] = 10));

const BASIS = { leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200 };
const GEGNER = { leicht: 3000, schwer: 2200, kreuzer: 1400, schlachtschiff: 800, zerstoerer: 500, reaper: 350 };

const scale = (f, obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.round(v * f)]));
const sumKey = (rec, id) => Object.entries(rec || {}).reduce((t, [k, v]) => (k === id || k.endsWith(`:${id}`) ? t + v : t), 0);
const total = (rec) => Object.values(rec || {}).reduce((a, b) => a + b, 0);

const pirate = combat.computePirateResearch(RESEARCH);
const fnA = (id) => combat.getEffectiveStats(id, RESEARCH, {}, false, null, {}, false);
const fnB = (id) => combat.getEffectiveStats(id, pirate, {}, false, null, {});

console.log('===== Wirkt der Imperator in grossen Flotten schlechter? =====');
console.log('6 Imperatoren fest, Flotte und Gegner gemeinsam skaliert, Forschung 10, kein Rueckzug\n');
console.log('Faktor'.padEnd(9) + 'Eigene'.padStart(9) + 'Gegner'.padStart(9) + 'Runden'.padStart(8) +
  'Imp-Schuesse'.padStart(14) + 'Treffer'.padStart(9) + 'Treffer%'.padStart(10) +
  'Imp-Schaden'.padStart(13) + 'je Imp/Runde'.padStart(14) + 'Anteil'.padStart(8));

for (const f of [0.25, 0.5, 1, 2, 4]) {
  const mine = { ...scale(f, BASIS), imperator: 6 };
  const foe = scale(f, GEGNER);
  const acc = { rounds: 0, shots: 0, hits: 0, dmg: 0, all: 0 };
  for (let i = 0; i < RUNS; i++) {
    const r = combat.resolveCombat(mine, fnA, foe, fnB, RESEARCH, 0, false, null);
    acc.rounds += r.roundsFought;
    acc.shots += sumKey(r.shotsA.shotsFired, 'imperator');
    acc.hits += sumKey(r.shotsA.hits, 'imperator');
    acc.dmg += sumKey(r.shotsA.dmgDealt, 'imperator');
    acc.all += total(r.shotsA.dmgDealt);
  }
  const rounds = acc.rounds / RUNS, shots = acc.shots / RUNS, hits = acc.hits / RUNS, dmg = acc.dmg / RUNS;
  console.log(
    `${f}x`.padEnd(9) +
    String(total(mine)).padStart(9) + String(total(foe)).padStart(9) + rounds.toFixed(1).padStart(8) +
    shots.toFixed(0).padStart(14) + hits.toFixed(0).padStart(9) + pct(shots ? hits / shots : 0).padStart(10) +
    `${(dmg / 1e6).toFixed(0)}M`.padStart(13) +
    `${(dmg / 6 / Math.max(1, rounds) / 1e6).toFixed(1)}M`.padStart(14) +
    pct(acc.all ? acc.dmg / acc.all : 0).padStart(8)
  );
}
process.exit(0);
