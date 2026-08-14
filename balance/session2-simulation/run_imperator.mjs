// Messauftrag Abschnitt 4 des Umsetzungsplans: der Imperator wurde in keiner der vier Sessions
// im Kampf gemessen. Anlass: Nutzerbeobachtung aus echten Kampfberichten ("tankt alles weg, teilt
// aber weniger aus als die Elite-Klassen").
//
// Bewusst NICHT ueber runCombatInWorker: die Hebel-Varianten veraendern Konstanten zur Laufzeit,
// und ein Worker-Thread importiert die Module frisch - Mutationen im Haupt-Thread kaemen dort nie
// an. Der Aufbau der statsFn spiegelt combat.worker.ts exakt (getEffectiveStats fuer Seite A,
// computePirateResearch + getEffectiveStats fuer Seite B).
import { combat, ships, cc, pct } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 7);

const RESEARCH_FULL = {};
['waffen','schild','panzerung','zielerfassung','durchschlag','schildregeneration','praezision','ausweichen','kritischetreffer']
  .forEach((id) => (RESEARCH_FULL[id] = 10));
const RESEARCH_ZERO = {};

const imp = ships.SHIPS.find((s) => s.id === 'imperator');
const ORIG = {
  waffen: imp.stats.waffen, schild: imp.stats.schild, panzerung: imp.stats.panzerung,
  precMod: cc.PRECISION_MODIFIER.imperator,
  mismatch: cc.SIZE_MISMATCH_EVASION_BONUS.klein.gross,
};
function restore() {
  imp.stats.waffen = ORIG.waffen; imp.stats.schild = ORIG.schild; imp.stats.panzerung = ORIG.panzerung;
  cc.PRECISION_MODIFIER.imperator = ORIG.precMod;
  cc.SIZE_MISMATCH_EVASION_BONUS.klein.gross = ORIG.mismatch;
}

// ===== 1. Trefferwahrscheinlichkeit, analytisch =====
// rollHit(): erst Praezision des SCHUETZEN, dann Ausweichen des ZIELS (inkl. Groessen-Fehlpaarung).
function hitChance(shooterId, targetId, research) {
  const prec = combat.getPrecisionChance(research, true, shooterId);
  const ev = combat.getEvasionChance(research, true, targetId, shooterId);
  return { prec, ev, hit: prec * (1 - ev) };
}

console.log('===== 1. Trefferwahrscheinlichkeit je Schuetze/Ziel =====\n');
for (const [label, research] of [['ohne Forschung', RESEARCH_ZERO], ['Forschung Stufe 10', RESEARCH_FULL]]) {
  console.log(`--- ${label} ---`);
  console.log('Schuetze'.padEnd(20) + 'Ziel'.padEnd(20) + 'Praezision'.padStart(11) + 'Ausweichen'.padStart(12) + 'Treffer'.padStart(10) + '  1 Treffer je');
  for (const shooter of ['imperator', 'reaper', 'salvendreadnought', 'kreuzer', 'leicht']) {
    for (const target of ['leicht', 'kreuzer', 'reaper']) {
      const h = hitChance(shooter, target, research);
      console.log(
        combat.shipName(shooter).padEnd(20) + combat.shipName(target).padEnd(20) +
        pct(h.prec).padStart(11) + pct(h.ev).padStart(12) + pct(h.hit).padStart(10) +
        `  ${(1 / h.hit).toFixed(1)} Schuss`
      );
    }
  }
  console.log('');
}

// ===== Kampf-Helfer =====
function statsFns(research) {
  const pirate = combat.computePirateResearch(research);
  return {
    a: (id) => combat.getEffectiveStats(id, research, {}, false, null, {}, false),
    b: (id) => combat.getEffectiveStats(id, pirate, {}, false, null, {}),
  };
}
function sumKey(rec, id) {
  let t = 0;
  for (const [k, v] of Object.entries(rec || {})) if (k === id || k.endsWith(`:${id}`)) t += v;
  return t;
}
function battle(sideA, sideB, research, runs = RUNS) {
  const fn = statsFns(research);
  const acc = { dmg: 0, shots: 0, hits: 0, survA: 0, survB: 0, rounds: 0, dmgTotal: 0, wins: 0 };
  for (let i = 0; i < runs; i++) {
    const r = combat.resolveCombat(sideA, fn.a, sideB, fn.b, research, 0, false, null);
    acc.dmg += sumKey(r.shotsA.dmgDealt, 'imperator');
    acc.shots += sumKey(r.shotsA.shotsFired, 'imperator');
    acc.hits += sumKey(r.shotsA.hits, 'imperator');
    acc.dmgTotal += Object.values(r.shotsA.dmgDealt).reduce((x, y) => x + y, 0);
    acc.survA += Object.values(r.survivorsA).reduce((x, y) => x + y, 0);
    acc.survB += Object.values(r.survivorsB).reduce((x, y) => x + y, 0);
    acc.rounds += r.roundsFought;
    if (Object.values(r.survivorsB).reduce((x, y) => x + y, 0) === 0) acc.wins++;
  }
  const n = runs;
  return {
    dmg: acc.dmg / n, shots: acc.shots / n, hits: acc.hits / n, dmgTotal: acc.dmgTotal / n,
    survA: acc.survA / n, survB: acc.survB / n, rounds: acc.rounds / n, winRate: acc.wins / n,
    hitRate: acc.shots > 0 ? acc.hits / acc.shots : 0,
    share: acc.dmgTotal > 0 ? acc.dmg / acc.dmgTotal : 0,
  };
}
const M = (x) => (x / 1e6).toFixed(0).padStart(9) + 'M';

// ===== 2. Der Imperator allein gegen einen Jaegerschwarm =====
const SWARM = { leicht: 400 };
console.log('===== 2. 6 Imperatoren gegen 400 Leichte Jaeger (Forschung 10, ohne Module/Klasse/Boost) =====\n');
{
  const r = battle({ imperator: 6 }, SWARM, RESEARCH_FULL);
  console.log(`Schuesse ${r.shots.toFixed(0)}, Treffer ${r.hits.toFixed(0)} (${pct(r.hitRate)}), Schaden ${M(r.dmg)}`);
  console.log(`Runden ${r.rounds.toFixed(1)}, Ueberlebende A ${r.survA.toFixed(1)} / B ${r.survB.toFixed(0)}, Siegquote ${pct(r.winRate)}\n`);
}

// ===== 3. Hebel-Vergleich =====
// Jede Variante wird auf DENSELBEN beiden Szenarien gemessen: Jaegerschwarm (wo er laut README
// stark sein soll) und gemischte Flotte (Alltag).
const MIXED = { leicht: 250, schwer: 150, kreuzer: 120, schlachtschiff: 60, zerstoerer: 40, reaper: 25 };
const VARIANTS = [
  ['Ist-Zustand', () => {}],
  ['Praezisionsmalus 0 statt -0,15', () => { cc.PRECISION_MODIFIER.imperator = 0; }],
  ['Ausweich-Bonus klein/gross 0,22', () => { cc.SIZE_MISMATCH_EVASION_BONUS.klein.gross = 0.22; }],
  ['Waffen verdoppelt (1.000.000)', () => { imp.stats.waffen = 1000000; }],
  ['Waffen x2, Panzerung/Schild halb', () => { imp.stats.waffen = 1000000; imp.stats.panzerung = 1500000; imp.stats.schild = 200000; }],
];

for (const [label, enemy] of [['Jaegerschwarm (400 Leichte Jaeger)', SWARM], ['Gemischte Flotte (645 Schiffe)', MIXED]]) {
  console.log(`===== 3. Hebel-Vergleich - ${label} =====\n`);
  console.log('Variante'.padEnd(34) + 'Schuesse'.padStart(9) + 'Treffer%'.padStart(10) + 'Schaden Imp'.padStart(13) + 'Rest A'.padStart(8) + 'Rest B'.padStart(8) + 'Sieg%'.padStart(8));
  for (const [name, apply] of VARIANTS) {
    restore(); apply();
    const r = battle({ imperator: 6 }, enemy, RESEARCH_FULL);
    console.log(
      name.padEnd(34) + r.shots.toFixed(0).padStart(9) + pct(r.hitRate).padStart(10) +
      M(r.dmg).padStart(13) + r.survA.toFixed(1).padStart(8) + r.survB.toFixed(0).padStart(8) + pct(r.winRate).padStart(8)
    );
  }
  restore();
  // Stueckzahl-Vorschlag getrennt: gleiche Werte, nur mehr Schiffe
  for (const n of [12, 18]) {
    const r = battle({ imperator: n }, enemy, RESEARCH_FULL);
    console.log(
      `${n} Imperatoren (Werte unveraendert)`.padEnd(34) + r.shots.toFixed(0).padStart(9) + pct(r.hitRate).padStart(10) +
      M(r.dmg).padStart(13) + r.survA.toFixed(1).padStart(8) + r.survB.toFixed(0).padStart(8) + pct(r.winRate).padStart(8)
    );
  }
  console.log('');
}

// ===== 4. Beitrag in einer echten Flotte =====
// Frage des Nutzers: lohnt es sich, den Imperator ueberhaupt mitzunehmen?
const BASIS = { leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200 };
const GEGNER = { leicht: 3000, schwer: 2200, kreuzer: 1400, schlachtschiff: 800, zerstoerer: 500, reaper: 350 };
console.log('===== 4. Beitrag in einer ausgebauten Flotte (6.300 Schiffe gegen 8.250) =====\n');
console.log('Zusammensetzung'.padEnd(34) + 'Rest A'.padStart(9) + 'Rest B'.padStart(9) + 'Sieg%'.padStart(8) + 'Anteil Imp. am Schaden'.padStart(24));
for (const [label, extra, mutate] of [
  ['ohne Imperator', {}, () => {}],
  ['+ 6 Imperatoren', { imperator: 6 }, () => {}],
  ['+ 12 Imperatoren', { imperator: 12 }, () => {}],
  ['+ 6 Imp., Praezisionsmalus 0', { imperator: 6 }, () => { cc.PRECISION_MODIFIER.imperator = 0; }],
  ['+ 6 Imp., Waffen verdoppelt', { imperator: 6 }, () => { imp.stats.waffen = 1000000; }],
]) {
  restore(); mutate();
  const r = battle({ ...BASIS, ...extra }, GEGNER, RESEARCH_FULL, Math.max(3, Math.floor(RUNS / 2)));
  console.log(
    label.padEnd(34) + r.survA.toFixed(0).padStart(9) + r.survB.toFixed(0).padStart(9) +
    pct(r.winRate).padStart(8) + pct(r.share).padStart(24)
  );
}
restore();
process.exit(0);
