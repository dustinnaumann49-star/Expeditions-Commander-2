// Session 3: Was bringt eine Investition in MODULE bzw. FORSCHUNG, verglichen mit dem,
// was sie kostet? Beide Hebel wirken NICHT auf combatFleetPowerBase() (Session-2-Befund 1),
// erhoehen also die Gegnerstaerke nicht - im Gegensatz zu zusaetzlichen Schiffen.
import * as L from './lib3.mjs';

const REPS = Number(process.argv[2] || 6);
const SEKTOREN = ['piraten_hoch', 'piraten_elite'];

async function cell(state, sektor, fleet) {
  const acc = { runs: 0, win: 0, loss: 0 };
  for (let i = 0; i < REPS; i++) {
    const r = await L.simulator.simulateCombat(state, sektor, fleet);
    if (!r.ok) throw new Error(r.error);
    const s = r.simulation;
    acc.runs += s.runs; acc.win += s.winRate * s.runs; acc.loss += s.avgLossPercent * s.runs;
  }
  return { runs: acc.runs, win: acc.win / acc.runs, loss: acc.loss / acc.runs };
}

const FLEET = L.FLEET_LARGE;
const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const fleetValue = Object.entries(FLEET).reduce((a, [id, n]) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return a + n * (s.cost ? val(s.cost) : 3000 * 325000); // Imperator ueber Teile-Gegenwert
}, 0);
console.log(`Referenzflotte FLEET_LARGE: Wert ${(fleetValue / 1e9).toFixed(2)} Mrd, BasePower ${(L.combat.combatFleetPowerBase(FLEET) / 1e9).toFixed(2)} Mrd\n`);

// ===== Modulstufen (Forschung 10, Kanonier, Booster an - wie Profil "voll") =====
console.log('===== A) MODUL-STUFEN (Forschung 10, Kanonier, Kampf-Booster aktiv) =====');
console.log('Modulstufe'.padEnd(12) + SEKTOREN.map((s) => (s.replace('piraten_', '') + ' Sieg%/Verlust%').padStart(26)).join(''));
const modRows = {};
for (const lvl of [0, 3, 5, 8, 10]) {
  const state = L.makeState({ researchLevel: 10, moduleLevel: lvl, playerClass: 'kanonier', kampfBoost: true, shipIds: L.ALL_SHIP_IDS });
  const out = [];
  for (const sek of SEKTOREN) {
    const r = await cell(state, sek, FLEET);
    out.push(`${r.win.toFixed(0)}% / ${r.loss.toFixed(2)}%`.padStart(26));
    modRows[`${lvl}_${sek}`] = r;
  }
  console.log(`Stufe ${String(lvl).padEnd(6)}` + out.join(''));
}

// ===== Forschungsstufen (Module 0, keine Klasse, kein Booster - isolierter Hebel) =====
console.log('\n===== B) FORSCHUNGSSTUFEN (Module 0, keine Klasse, KEIN Kampf-Booster) =====');
console.log('Forschung'.padEnd(12) + SEKTOREN.map((s) => (s.replace('piraten_', '') + ' Sieg%/Verlust%').padStart(26)).join(''));
for (const lvl of [0, 2, 4, 6, 8, 10]) {
  const state = L.makeState({ researchLevel: lvl, moduleLevel: 0, playerClass: null, kampfBoost: false, shipIds: L.ALL_SHIP_IDS });
  const out = [];
  for (const sek of SEKTOREN) {
    const r = await cell(state, sek, FLEET);
    out.push(`${r.win.toFixed(0)}% / ${r.loss.toFixed(2)}%`.padStart(26));
  }
  console.log(`Stufe ${String(lvl).padEnd(6)}` + out.join(''));
}

// ===== Klassen + Booster als Einzelhebel =====
console.log('\n===== C) EINZELHEBEL bei Forschung 10 / Module 0 =====');
const LEVERS = [
  ['nichts', { researchLevel: 10, moduleLevel: 0, playerClass: null, kampfBoost: false }],
  ['+Kampf-Booster (35 DM/Tag)', { researchLevel: 10, moduleLevel: 0, playerClass: null, kampfBoost: true }],
  ['+Kanonier (500 DM einmalig)', { researchLevel: 10, moduleLevel: 0, playerClass: 'kanonier', kampfBoost: false }],
  ['+Bollwerk', { researchLevel: 10, moduleLevel: 0, playerClass: 'bollwerk', kampfBoost: false }],
  ['+Kommandant', { researchLevel: 10, moduleLevel: 0, playerClass: 'kommandant', kampfBoost: false }],
  ['+Module 10', { researchLevel: 10, moduleLevel: 10, playerClass: null, kampfBoost: false }],
];
console.log('Hebel'.padEnd(30) + SEKTOREN.map((s) => (s.replace('piraten_', '') + ' Sieg%/Verlust%').padStart(26)).join(''));
for (const [name, cfg] of LEVERS) {
  const state = L.makeState({ ...cfg, shipIds: L.ALL_SHIP_IDS });
  const out = [];
  for (const sek of SEKTOREN) {
    const r = await cell(state, sek, FLEET);
    out.push(`${r.win.toFixed(0)}% / ${r.loss.toFixed(2)}%`.padStart(26));
  }
  console.log(name.padEnd(30) + out.join(''));
}
process.exit(0);
