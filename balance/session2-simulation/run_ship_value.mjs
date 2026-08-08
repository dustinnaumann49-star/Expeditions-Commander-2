// Session 3: Was leistet eine Ressourcen-Einheit, je nachdem wo man sie ausgibt?
// A) Gleich-WERT-Flotten aus je einem Schiffstyp
// B) Grenznutzen: Referenzflotte + fester Wert-Betrag in je einem Typ
// C) Flotten-Skalierung: identische Zusammensetzung, 1x / 2x / 4x / 8x
import * as L from './lib3.mjs';

const REPS = Number(process.argv[2] || 6); // je REPS x bis zu 12 Laeufe
const SEKTOR = process.argv[3] || 'piraten_hoch';

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const shipById = (id) => L.ships.SHIPS.find((s) => s.id === id);

async function cell(state, sektor, fleet) {
  const acc = { runs: 0, win: 0, loss: 0, wipe: 0, rounds: 0 };
  for (let i = 0; i < REPS; i++) {
    const r = await L.simulator.simulateCombat(state, sektor, fleet);
    if (!r.ok) throw new Error(r.error);
    const s = r.simulation;
    acc.runs += s.runs;
    acc.win += s.winRate * s.runs;
    acc.loss += s.avgLossPercent * s.runs;
    acc.wipe += s.wipeRate * s.runs;
    acc.rounds += s.avgRounds * s.runs;
  }
  return { runs: acc.runs, win: acc.win / acc.runs, loss: acc.loss / acc.runs, wipe: acc.wipe / acc.runs, rounds: acc.rounds / acc.runs };
}

const TYPES = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
const state = L.stateFor('voll');

// ===== A) Gleich-Wert-Flotten =====
// Budget so gewaehlt, dass auch der teuerste maxCount-begrenzte Typ es ausschoepfen kann.
const BUDGET_A = 600e6;
console.log(`===== A) Gleich-WERT-Flotten (${(BUDGET_A / 1e6).toFixed(0)} Mio Wert je Typ), Sektor ${SEKTOR}, Profil voll =====`);
console.log('Typ'.padEnd(20) + 'Stk'.padStart(8) + 'Wert'.padStart(12) + 'BasePower'.padStart(12) + 'Sieg%'.padStart(8) + 'Verlust%'.padStart(10) + 'Wertverlust'.padStart(14) + 'Runden'.padStart(8));
for (const id of TYPES) {
  const s = shipById(id);
  const unit = val(s.cost);
  let n = Math.floor(BUDGET_A / unit);
  if (s.maxCount) n = Math.min(n, s.maxCount);
  if (n < 1) { console.log(`${id.padEnd(20)} (zu teuer fuer das Budget)`); continue; }
  const fleet = { [id]: n };
  const r = await cell(state, SEKTOR, fleet);
  const power = L.combat.combatFleetPowerBase(fleet);
  console.log(
    id.padEnd(20) + String(n).padStart(8) + ((n * unit) / 1e6).toFixed(0).padStart(9) + ' Mio' +
    (power / 1e6).toFixed(1).padStart(9) + ' Mio' +
    r.win.toFixed(0).padStart(8) + (r.loss).toFixed(1).padStart(10) +
    ((n * unit * r.loss) / 100 / 1e6).toFixed(1).padStart(11) + ' Mio' + r.rounds.toFixed(0).padStart(8)
  );
}

// ===== B) Grenznutzen: kleine Referenzflotte + 1,5 Mrd Wert in je einem Typ =====
const BUDGET_B = 1.5e9;
const BASE = L.FLEET_SMALL;
console.log(`\n===== B) Grenznutzen: FLEET_SMALL + ${(BUDGET_B / 1e9).toFixed(1)} Mrd Wert in je einem Typ, Sektor ${SEKTOR} =====`);
const baseR = await cell(state, SEKTOR, BASE);
const basePower = L.combat.combatFleetPowerBase(BASE);
const baseValue = Object.entries(BASE).reduce((a, [id, n]) => a + n * val(shipById(id).cost), 0);
console.log(`Referenz  : Wert ${(baseValue / 1e6).toFixed(0)} Mio, BasePower ${(basePower / 1e6).toFixed(1)} Mio -> Sieg ${baseR.win.toFixed(0)}%, Verlust ${baseR.loss.toFixed(1)}%, Wertverlust ${((baseValue * baseR.loss) / 100 / 1e6).toFixed(1)} Mio`);
console.log('+Typ'.padEnd(20) + 'Stk'.padStart(8) + 'BasePower'.padStart(12) + 'Sieg%'.padStart(8) + 'Verlust%'.padStart(10) + 'Wertverlust'.padStart(14));
for (const id of TYPES) {
  const s = shipById(id);
  const unit = val(s.cost);
  let n = Math.floor(BUDGET_B / unit);
  if (s.maxCount) n = Math.min(n, s.maxCount);
  const fleet = { ...BASE, [id]: (BASE[id] || 0) + n };
  const r = await cell(state, SEKTOR, fleet);
  const power = L.combat.combatFleetPowerBase(fleet);
  const totalValue = Object.entries(fleet).reduce((a, [i2, n2]) => a + n2 * val(shipById(i2).cost), 0);
  console.log(
    id.padEnd(20) + String(n).padStart(8) + (power / 1e6).toFixed(1).padStart(9) + ' Mio' +
    r.win.toFixed(0).padStart(8) + r.loss.toFixed(1).padStart(10) +
    ((totalValue * r.loss) / 100 / 1e6).toFixed(1).padStart(11) + ' Mio'
  );
}

// ===== C) Flotten-Skalierung (Treadmill-Test) =====
console.log(`\n===== C) Identische Zusammensetzung, skaliert - Sektor ${SEKTOR} =====`);
console.log('Faktor'.padStart(7) + 'Stk'.padStart(9) + 'Wert'.padStart(12) + 'BasePower'.padStart(12) + 'Sieg%'.padStart(8) + 'Verlust%'.padStart(10) + 'Wertverlust'.padStart(14));
for (const f of [0.25, 1, 2, 4, 8]) {
  const fleet = {};
  for (const [id, n] of Object.entries(L.FLEET_LARGE)) {
    const s = shipById(id);
    let c = Math.max(1, Math.round(n * f));
    if (s.maxCount) c = Math.min(c, s.maxCount);
    fleet[id] = c;
  }
  const r = await cell(state, SEKTOR, fleet);
  const power = L.combat.combatFleetPowerBase(fleet);
  const stk = Object.values(fleet).reduce((a, b) => a + b, 0);
  const tv = Object.entries(fleet).reduce((a, [i2, n2]) => a + n2 * (shipById(i2).cost ? val(shipById(i2).cost) : 975e6 / 1), 0);
  console.log(
    (f + 'x').padStart(7) + String(stk).padStart(9) + (tv / 1e9).toFixed(2).padStart(8) + ' Mrd' +
    (power / 1e9).toFixed(2).padStart(9) + ' Mrd' + r.win.toFixed(0).padStart(8) +
    r.loss.toFixed(1).padStart(10) + ((tv * r.loss) / 100 / 1e6).toFixed(0).padStart(11) + ' Mio'
  );
}
process.exit(0);
