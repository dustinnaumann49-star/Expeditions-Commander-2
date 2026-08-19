// Reine Schiff-gegen-Schiff-Balance (Nachtrag aus Session 3): Tier-Progression, RapidFire-Kette,
// Rollen der Schiffsklassen, Sandronator.
// Aufruf: node run_ships.mjs [duelle_pro_paarung]
import { combat, runner, ships, cc, value, pct } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 5);
const BUDGET = 600e6; // Wert-Einheiten je Seite (wie Session-3-Befund 3)

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const CHAIN = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];

function shipValue(id) {
  const c = byId[id].cost;
  return c ? value(c) : 0;
}
function countFor(id, budget) {
  return Math.max(1, Math.floor(budget / shipValue(id)));
}

console.log(`=== 1. Tier-Progression: Kosten, Macht, Bauzeit (Basiswerte, ohne Forschung/Module) ===\n`);
console.log('Typ                Tier   Wert/Stk    Waffen  Schild   Panzerung   Power  Wert/Power  Wert/Waffen  Bauzeit  Speed');
for (const s of ships.SHIPS) {
  const v = shipValue(s.id);
  const p = s.stats.waffen + s.stats.schild + s.stats.panzerung;
  const vpw = v > 0 ? (v / p).toFixed(2) : '-';
  const vpwf = s.stats.waffen > 0 && v > 0 ? (v / s.stats.waffen).toFixed(0) : '-';
  console.log(
    `${s.name.padEnd(20)}${String(s.tier).padStart(4)}  ${(v / 1e6).toFixed(2).padStart(9)}M ${String(s.stats.waffen).padStart(8)} ${String(s.stats.schild).padStart(7)} ${String(s.stats.panzerung).padStart(10)} ${(p / 1e3).toFixed(0).padStart(7)}k ${String(vpw).padStart(10)} ${String(vpwf).padStart(12)} ${String(s.buildTime).padStart(8)} ${String(s.speed).padStart(6)}`
  );
}

console.log(`\n=== 2. RapidFire-Kette: wer kontert wen? ===\n`);
const rf = cc.RAPIDFIRE;
for (const id of CHAIN) {
  const out = Object.entries(rf[id] || {}).filter(([t]) => byId[t]).map(([t, v]) => `${t} x${v}`);
  const incoming = Object.entries(rf)
    .filter(([a, tbl]) => tbl[id] !== undefined)
    .map(([a, tbl]) => `${a} x${tbl[id]}`);
  console.log(`${byId[id].name.padEnd(18)} greift an: ${(out.join(', ') || '-').padEnd(34)} | wird gekontert von: ${incoming.join(', ') || '-'}`);
}

console.log(`\n=== 3. Duelle bei GLEICHEM Wert (${(BUDGET / 1e6).toFixed(0)} Mio je Seite, Basiswerte, kein Rueckzug) ===\n`);
const zeroResearch = {};
async function duel(idA, idB) {
  const a = { [idA]: countFor(idA, BUDGET) };
  const b = { [idB]: countFor(idB, BUDGET) };
  let winsA = 0, restA = 0, restB = 0, rounds = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: a,
      sideBShips: b,
      research: zeroResearch,
      kampfBoostActive: false,
      playerClass: null,
      shipModules: {},
      retreatMode: 'none',
    });
    const sa = (r.survivorsA[idA] || 0) * shipValue(idA);
    const sb = (r.survivorsB[idB] || 0) * shipValue(idB);
    if (sa > sb) winsA++;
    restA += sa; restB += sb; rounds += r.roundsFought;
  }
  return { winsA: winsA / RUNS, restA: restA / RUNS, restB: restB / RUNS, rounds: rounds / RUNS, na: a[idA], nb: b[idB] };
}

const header = 'A \\ B'.padEnd(18) + CHAIN.map((c) => byId[c].name.slice(0, 8).padStart(9)).join('');
console.log(header);
const matrix = {};
for (const idA of CHAIN) {
  const row = [];
  matrix[idA] = {};
  for (const idB of CHAIN) {
    if (idA === idB) { row.push('     -   '); continue; }
    const d = await duel(idA, idB);
    matrix[idA][idB] = d;
    const net = (d.restA - d.restB) / 1e6;
    row.push(`${net >= 0 ? '+' : ''}${net.toFixed(0)}M`.padStart(9));
  }
  console.log(byId[idA].name.padEnd(18) + row.join(''));
}
console.log('(Zahl = uebriggebliebener Wert A minus B, positiv = A gewinnt)');

console.log(`\n=== 4. Netto-Bilanz je Typ ueber alle Gegner ===\n`);
const score = CHAIN.map((id) => {
  const vals = Object.values(matrix[id]).map((d) => d.restA - d.restB);
  return { id, avg: vals.reduce((a, b) => a + b, 0) / vals.length };
}).sort((a, b) => b.avg - a.avg);
score.forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. ${byId[s.id].name.padEnd(18)} ${(s.avg / 1e6).toFixed(1).padStart(8)} Mio Netto-Rest im Schnitt`));

console.log(`\n=== 5. Sandronator gegen die Standard-Schiffe (gleicher Wert) ===\n`);
const sd = byId['sandronator'];
console.log(`Sandronator: Wert ${(shipValue('sandronator') / 1e6).toFixed(2)} Mio, Waffen ${sd.stats.waffen}, Schild ${sd.stats.schild}, Panzerung ${sd.stats.panzerung}, Bauzeit ${sd.buildTime}, Speed ${sd.speed}, unique=${!!sd.unique}`);
const kr = byId['kreuzer'];
console.log(`Kreuzer    : Wert ${(shipValue('kreuzer') / 1e6).toFixed(2)} Mio, Waffen ${kr.stats.waffen}, Schild ${kr.stats.schild}, Panzerung ${kr.stats.panzerung}, Bauzeit ${kr.buildTime}, Speed ${kr.speed}`);
console.log(`-> Sandronator kostet ${(shipValue('sandronator') / shipValue('kreuzer')).toFixed(2)}x den Kreuzer bei ${(sd.stats.waffen / kr.stats.waffen).toFixed(2)}x Waffen / ${(sd.stats.panzerung / kr.stats.panzerung).toFixed(2)}x Panzerung und ${(sd.buildTime / kr.buildTime).toFixed(0)}x Bauzeit.`);
for (const opp of ['leicht', 'kreuzer', 'reaper']) {
  const d = await duel('sandronator', opp);
  console.log(`  Sandronator (${d.na} Stk) vs ${byId[opp].name} (${d.nb} Stk): Rest A ${(d.restA / 1e6).toFixed(0)}M / Rest B ${(d.restB / 1e6).toFixed(0)}M, Siegquote A ${pct(d.winsA)}`);
}

console.log(`\n=== 6. Spezialschiffe als Beimischung: RapidFire-Abdeckung ===\n`);
const covered = new Set();
CHAIN.forEach((id) => { Object.keys(rf[id] || {}).forEach((t) => covered.add(t)); });
const uncovered = CHAIN.filter((id) => !covered.has(id));
console.log(`Von Standard-Kampfschiffen NICHT per RapidFire gekonterte Typen: ${uncovered.map((u) => byId[u].name).join(', ') || '-'}`);
['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'imperator'].forEach((id) => {
  console.log(`  ${byId[id].name.padEnd(20)} kontert: ${Object.keys(rf[id] || {}).filter((t) => byId[t]).map((t) => byId[t].name).join(', ')}`);
});
process.exit(0);
