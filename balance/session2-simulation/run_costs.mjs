// Session 3 - Wirtschaft/Ausbau: reine Kosten-/Zeit-Arithmetik (keine Kampfsimulation).
// Alle Betraege in Wert-Einheiten (TRADE_VALUE: metall*1 + kristall*1.5 + deuterium*3).
import { ships, defenses, cc, economy, value } from './lib3.mjs';

const RESEARCH = (await import('../../server/dist/game/data/research.js')).RESEARCH;
const BUILDINGS = (await import('../../server/dist/game/data/buildings.js')).BUILDINGS;
const { HOME_TIER_UNLOCK_LEVELS } = await import('../../server/dist/game/data/buildings.js');
const BM = (await import('../../server/dist/game/data/buildingModules.js')).BUILDING_MODULES;
const SM = (await import('../../server/dist/game/data/shipModules.js')).SHIP_MODULES;
const DM_ = (await import('../../server/dist/game/data/defenseModules.js')).DEFENSE_MODULES;

const fmt = (x) => {
  if (x >= 1e12) return (x / 1e12).toFixed(2) + ' Bio';
  if (x >= 1e9) return (x / 1e9).toFixed(2) + ' Mrd';
  if (x >= 1e6) return (x / 1e6).toFixed(1) + ' Mio';
  if (x >= 1e3) return (x / 1e3).toFixed(1) + ' k';
  return x.toFixed(1);
};
const hrs = (h) => (h >= 24 ? `${(h / 24).toFixed(1)} d` : `${h.toFixed(1)} h`);

// ===== Bauzeit-Multiplikator-Ketten (siehe actions.ts) =====
// Schiffe: baseTimeMultiplier * roboterNaniteFactor(shipDefense) * specific(bauzeit_schiffe) * ingenieur
function shipTimeMult({ bauzeit, spezifisch, rob, nan, booster, ingenieur, samstag }) {
  let m = Math.max(0.3, 1 - bauzeit * 0.05);
  if (booster) m *= economy.BAUTEMPO_BOOST_FACTOR;
  if (samstag) m *= economy.WEEKLY_BAUZEIT_EVENT_FACTOR;
  m *= Math.pow(0.99, rob) * Math.pow(0.98, nan);
  m *= Math.max(0.5, 1 - spezifisch * 0.03);
  if (ingenieur) m *= 0.85;
  return m;
}
function buildingTimeMult({ bauzeit, spezifisch, rob, nan, booster, ingenieur, samstag, selfModul = 0 }) {
  let m = Math.max(0.3, 1 - bauzeit * 0.05);
  if (booster) m *= economy.BAUTEMPO_BOOST_FACTOR;
  if (samstag) m *= economy.WEEKLY_BAUZEIT_EVENT_FACTOR;
  m *= Math.pow(0.75, rob) * Math.pow(0.5, nan);
  m *= Math.max(0.5, 1 - spezifisch * 0.03);
  if (ingenieur) m *= 0.85;
  m *= Math.max(0.5, 1 - selfModul * 0.03);
  return m;
}
function researchTimeMult({ booster, samstag }) {
  let m = 1;
  if (booster) m *= economy.FORSCHUNGSTEMPO_BOOST_FACTOR;
  if (samstag) m *= economy.WEEKLY_BAUZEIT_EVENT_FACTOR;
  return m;
}

const P = {
  voll: { bauzeit: 10, spezifisch: 10, rob: 20, nan: 12, booster: true, ingenieur: true, samstag: false },
  mittel: { bauzeit: 6, spezifisch: 5, rob: 10, nan: 5, booster: true, ingenieur: false, samstag: false },
  frueh: { bauzeit: 0, spezifisch: 0, rob: 0, nan: 0, booster: false, ingenieur: false, samstag: false },
};

console.log('===== 0. BAUZEIT-MULTIPLIKATOREN =====');
for (const [n, p] of Object.entries(P)) {
  console.log(
    `${n.padEnd(7)} Schiffe/Vert. ${shipTimeMult(p).toExponential(3)}   Gebaeude ${buildingTimeMult(p).toExponential(3)}   Forschung ${researchTimeMult(p).toFixed(4)}`
  );
}
console.log(`voll + Samstag: Schiffe ${shipTimeMult({ ...P.voll, samstag: true }).toExponential(3)}`);
console.log(`voll + Gebaeude-Automatisierungsmodul 10: ${buildingTimeMult({ ...P.voll, selfModul: 10 }).toExponential(3)}`);

// ===== 1. SCHIFFE =====
console.log('\n===== 1. SCHIFFE: Kosten / Power / Bauzeit =====');
console.log(
  'id'.padEnd(19) + 'Wert'.padStart(10) + 'Power'.padStart(12) + 'P/W'.padStart(8) + 'K/Waffe'.padStart(9) +
  'Bauzeit'.padStart(10) + 'voll'.padStart(10) + 'Wert/h voll'.padStart(14) + 'max'.padStart(7)
);
const shipRows = [];
for (const s of ships.SHIPS) {
  if (!s.stats || s.stats.waffen <= 0) continue;
  const v = s.cost ? value(s.cost) : NaN;
  const corr = cc.MULTI_TARGET_VOLLEY_SHIPS.has(s.id) ? cc.MULTI_TARGET_POWER_CORRECTION : 1;
  const power = (s.stats.waffen + s.stats.schild + s.stats.panzerung) * corr;
  const bt = s.buildTime;
  const btVoll = bt * shipTimeMult(P.voll);
  const wertProH = v / (btVoll / 3600);
  shipRows.push({ id: s.id, v, power, pv: power / v, kw: v / s.stats.waffen, bt, btVoll, wertProH, max: s.maxCount });
  console.log(
    s.id.padEnd(19) + fmt(v).padStart(10) + fmt(power).padStart(12) +
    (power / v).toFixed(2).padStart(8) + (v / s.stats.waffen).toFixed(1).padStart(9) +
    (bt + 's').padStart(10) + (btVoll < 60 ? btVoll.toFixed(2) + 's' : (btVoll / 60).toFixed(1) + 'm').padStart(10) +
    fmt(wertProH).padStart(14) + String(s.maxCount ?? '-').padStart(7)
  );
}

console.log('\n===== 2. VERTEIDIGUNG: Kosten / Power / Bauzeit =====');
console.log(
  'id'.padEnd(19) + 'Wert'.padStart(10) + 'Power'.padStart(12) + 'P/W'.padStart(8) + 'K/Waffe'.padStart(9) +
  'Bauzeit'.padStart(10) + 'voll'.padStart(10) + 'Wert/h voll'.padStart(14) + 'max'.padStart(7)
);
for (const d of defenses.DEFENSES) {
  const v = value(d.cost);
  const corr = cc.MULTI_TARGET_VOLLEY_SHIPS.has(d.id) ? cc.MULTI_TARGET_POWER_CORRECTION : 1;
  const power = (d.stats.waffen + d.stats.schild + d.stats.panzerung) * corr;
  const btVoll = d.buildTime * shipTimeMult(P.voll);
  console.log(
    d.id.padEnd(19) + fmt(v).padStart(10) + fmt(power).padStart(12) +
    (power / v).toFixed(2).padStart(8) + (d.stats.waffen ? (v / d.stats.waffen).toFixed(1) : '-').padStart(9) +
    (d.buildTime + 's').padStart(10) + (btVoll < 60 ? btVoll.toFixed(2) + 's' : (btVoll / 60).toFixed(1) + 'm').padStart(10) +
    fmt(v / (btVoll / 3600)).padStart(14) + String(d.maxCount ?? '-').padStart(7)
  );
}

// ===== 3. FORSCHUNG =====
console.log('\n===== 3. FORSCHUNG: Kosten/Zeit bis Stufe 10 =====');
console.log('id'.padEnd(22) + 'Kost L10'.padStart(11) + 'Kost kum.'.padStart(11) + 'Zeit L10'.padStart(11) + 'Zeit kum.'.padStart(11) + 'kum. Boost'.padStart(12));
let researchCostTotal = 0, researchTimeTotal = 0;
const rMult = researchTimeMult(P.voll);
for (const r of RESEARCH) {
  const base = value(r.baseCost);
  const cost10 = base * Math.pow(r.costGrowth, 9);
  const costKum = base * (Math.pow(r.costGrowth, 10) - 1) / (r.costGrowth - 1);
  const t10 = r.baseTimeHours * Math.pow(r.timeGrowth, 9);
  const tKum = r.baseTimeHours * (Math.pow(r.timeGrowth, 10) - 1) / (r.timeGrowth - 1);
  researchCostTotal += costKum; researchTimeTotal += tKum;
  console.log(r.id.padEnd(22) + fmt(cost10).padStart(11) + fmt(costKum).padStart(11) + hrs(t10).padStart(11) + hrs(tKum).padStart(11) + hrs(tKum * rMult).padStart(12));
}
console.log(`\nALLE ${RESEARCH.length} Forschungen auf Stufe 10:`);
console.log(`  Kosten gesamt: ${fmt(researchCostTotal)} Wert-Einheiten`);
console.log(`  Zeit gesamt (seriell, ohne Booster): ${hrs(researchTimeTotal)}`);
console.log(`  Zeit gesamt mit Forschungstempo-Booster (x${rMult}): ${hrs(researchTimeTotal * rMult)}`);
console.log(`  bei ${cc.MAX_RESEARCH_SLOTS} parallelen Slots (ideal): ${hrs((researchTimeTotal * rMult) / cc.MAX_RESEARCH_SLOTS)}`);
// nur die 9 Kampfforschungen (Session-2-Profil "voll")
const COMBAT_R = ['waffen', 'schild', 'panzerung', 'zielerfassung', 'durchschlag', 'schildregeneration', 'praezision', 'ausweichen', 'kritischetreffer'];
let cR = 0, tR = 0;
for (const r of RESEARCH.filter((x) => COMBAT_R.includes(x.id))) {
  cR += value(r.baseCost) * (Math.pow(r.costGrowth, 10) - 1) / (r.costGrowth - 1);
  tR += r.baseTimeHours * (Math.pow(r.timeGrowth, 10) - 1) / (r.timeGrowth - 1);
}
console.log(`  davon nur die 9 Kampfforschungen: ${fmt(cR)} Wert, ${hrs(tR * rMult)} (mit Booster, seriell) / ${hrs((tR * rMult) / 4)} bei 4 Slots`);

// ===== 4. MODULE =====
console.log('\n===== 4. SCHIFFS-/VERTEIDIGUNGS-MODULE: Vollausbau Stufe 10 =====');
function modKum(base, growth, levels = 10) { return base * (Math.pow(growth, levels) - 1) / (growth - 1); }
console.log('Modul-Satz'.padEnd(22) + 'Kost/Linie'.padStart(12) + '3 Kampf'.padStart(12) + '4 (inkl.Antr)'.padStart(15) + 'Zeit/Linie voll'.padStart(17) + 'Break-even Stk'.padStart(15));
const seen = new Set();
for (const m of SM) {
  if (m.moduleKind !== 'waffen') continue;
  if (seen.has(m.shipId)) continue;
  seen.add(m.shipId);
  const kum = modKum(value(m.baseCost), m.costGrowth);
  const tKum = modKum(m.baseTimeSeconds, m.timeGrowth) * shipTimeMult(P.voll) / 3600;
  const ship = ships.SHIPS.find((s) => s.id === m.shipId);
  const unit = ship?.cost ? value(ship.cost) : NaN;
  // Break-even: wieviele Einheiten muss man besitzen, damit +30% auf alle drei Werte
  // (= Aequivalent zu +30% mehr Einheiten) billiger ist als 30% mehr Schiffe zu bauen?
  const be = (3 * kum) / (0.3 * unit);
  console.log(
    m.shipId.padEnd(22) + fmt(kum).padStart(12) + fmt(3 * kum).padStart(12) + fmt(4 * kum).padStart(15) +
    hrs(tKum).padStart(17) + (Number.isFinite(be) ? Math.round(be).toLocaleString('de-DE') : '-').padStart(15)
  );
}
console.log('--- Verteidigung ---');
const seenD = new Set();
for (const m of DM_) {
  if (seenD.has(m.defenseId)) continue;
  seenD.add(m.defenseId);
  const kum = modKum(value(m.baseCost), m.costGrowth);
  const tKum = modKum(m.baseTimeSeconds, m.timeGrowth) * shipTimeMult(P.voll) / 3600;
  const def = defenses.DEFENSES.find((d) => d.id === m.defenseId);
  const unit = value(def.cost);
  const lines = def.isDome ? 2 : 3;
  const be = (lines * kum) / (0.3 * unit);
  console.log(
    m.defenseId.padEnd(22) + fmt(kum).padStart(12) + fmt(lines * kum).padStart(12) + ''.padStart(15) +
    hrs(tKum).padStart(17) + Math.round(be).toLocaleString('de-DE').padStart(15)
  );
}

// ===== 5. GEBAEUDE =====
console.log('\n===== 5. GEBAEUDE: Ausbaukurve =====');
function buildingCumCost(b, level) {
  const base = value(b.baseCost);
  return base * (Math.pow(b.costGrowth, level) - 1) / (b.costGrowth - 1);
}
function buildingCumTimeH(b, level, prof) {
  const t = b.baseTimeSeconds * (Math.pow(b.timeGrowth, level) - 1) / (b.timeGrowth - 1);
  return (t * buildingTimeMult(prof)) / 3600;
}
function mineOut(b, level) { return level > 0 ? b.baseOutput * level * Math.pow(1.1, level) : 0; }

for (const tier of [1, 2, 3]) {
  const bs = BUILDINGS.filter((b) => (b.tier ?? 1) === tier);
  const thresholds = tier < 3 ? HOME_TIER_UNLOCK_LEVELS[tier] : null;
  const lv = { 1: { m: 36, k: 32, d: 30 }, 2: { m: 36, k: 32, d: 30 }, 3: { m: 36, k: 32, d: 30 } }[tier];
  const met = bs.find((b) => b.kind === 'mine_metall');
  const kri = bs.find((b) => b.kind === 'mine_kristall');
  const deu = bs.find((b) => b.kind === 'mine_deuterium');
  const sol = bs.find((b) => b.kind === 'energie');
  // benoetigtes Solar-Level: kleinstes L mit produced >= consumed
  const need = mineOut({ baseOutput: met.baseEnergyUse }, lv.m) + mineOut({ baseOutput: kri.baseEnergyUse }, lv.k) + mineOut({ baseOutput: deu.baseEnergyUse }, lv.d);
  let solarLv = 1;
  while (mineOut({ baseOutput: sol.baseEnergyOutput }, solarLv) < need && solarLv < 200) solarLv++;
  const invest = buildingCumCost(met, lv.m) + buildingCumCost(kri, lv.k) + buildingCumCost(deu, lv.d) + buildingCumCost(sol, solarLv);
  const outH = mineOut(met, lv.m) * 1 + mineOut(kri, lv.k) * 1.5 + mineOut(deu, lv.d) * 3;
  const timeVoll = buildingCumTimeH(met, lv.m, P.voll) + buildingCumTimeH(kri, lv.k, P.voll) + buildingCumTimeH(deu, lv.d, P.voll) + buildingCumTimeH(sol, solarLv, P.voll);
  const timeFrueh = buildingCumTimeH(met, lv.m, P.frueh) + buildingCumTimeH(kri, lv.k, P.frueh) + buildingCumTimeH(deu, lv.d, P.frueh) + buildingCumTimeH(sol, solarLv, P.frueh);
  console.log(
    `Tier ${tier} bis ${lv.m}/${lv.k}/${lv.d} + Solar ${solarLv}: Invest ${fmt(invest)} | Ertrag/Tag ${fmt(outH * 24)} | ` +
    `Amortisation ${(invest / (outH * 24)).toFixed(0)} Tage | Bauzeit roh ${hrs(timeFrueh)} / voll ${hrs(timeVoll)}`
  );
}
// Einzelstufen-Kosten Metallmine
console.log('\nMetallmine V1 Einzelstufen (Kosten der Stufe / +Ertrag/Tag / Amortisation dieser Stufe):');
const met1 = BUILDINGS.find((b) => b.id === 'metallmine');
for (const L of [20, 25, 30, 33, 36, 40, 45]) {
  const c = value(met1.baseCost) * Math.pow(met1.costGrowth, L - 1);
  const gain = (mineOut(met1, L) - mineOut(met1, L - 1)) * 24;
  console.log(`  Stufe ${String(L).padStart(2)}: ${fmt(c).padStart(10)} | +${fmt(gain).padStart(9)}/Tag | ${(c / gain).toFixed(0)} Tage`);
}
console.log('\nGebaeude-Module Vollausbau (Stufe 10):');
let bmTotal = 0;
for (const m of BM) {
  const kum = modKum(value(m.baseCost), m.costGrowth);
  bmTotal += kum;
}
console.log(`  Summe aller ${BM.length} Gebaeude-Module auf Stufe 10: ${fmt(bmTotal)}`);

// ===== 6. EINNAHMEN-BASELINE (Session 1 + 2) =====
console.log('\n===== 6. EINNAHMEN-BASELINE (aus Session 1/2) =====');
const INCOME = {
  'Raid (Mi+So, 12/12)': 6.31e9,
  'Elite-Bollwerk (32,60 Mrd je Serie, alle 3 Tage)': 32.60e9 / 3,
  'Solo-Piraten Hoch (24h)': 1.13e9,
  'Asteroiden (3 Felder, ohne Frischling)': 2.83e9,
  'Heimatbasis V1 voll (36/32/30)': 0.554e9,
};
let sum = 0;
for (const [k, v] of Object.entries(INCOME)) { console.log(`  ${k.padEnd(40)} ${fmt(v).padStart(10)}/Tag`); sum += v; }
console.log(`  ${'SUMME (alles parallel)'.padEnd(40)} ${fmt(sum).padStart(10)}/Tag`);
console.log(`  ${'ohne Elite-Bollwerk'.padEnd(40)} ${fmt(sum - 32.6e9 / 3).padStart(10)}/Tag`);

// ===== 7. WIE SCHNELL LAESST SICH DAS AUSGEBEN? =====
console.log('\n===== 7. AUSGABE-KAPAZITAET vs EINNAHMEN =====');
const lanes = cc.MAX_BUILD_SLOTS;
for (const prof of ['voll', 'mittel', 'frueh']) {
  const mult = shipTimeMult(P[prof]);
  console.log(`Profil ${prof} (Multiplikator ${mult.toExponential(2)}), ${lanes} Bau-Lanes:`);
  for (const id of ['leicht', 'kreuzer', 'reaper', 'salvendreadnought']) {
    const s = ships.SHIPS.find((x) => x.id === id);
    const perDay = 86400 / (s.buildTime * mult);
    const wertProTag = perDay * value(s.cost) * lanes;
    console.log(`   ${id.padEnd(18)} ${Math.round(perDay).toLocaleString('de-DE').padStart(12)} Stk/Tag/Lane -> ${fmt(wertProTag).padStart(10)} Wert/Tag (${lanes} Lanes)`);
  }
}

// ===== 8. IMPERATOR UEBER TEILE-GEGENWERT =====
const TEIL = value(economy.TEILE_CONVERT_RESOURCES);
const imp = ships.SHIPS.find((s) => s.id === 'imperator');
const impCost = (imp.teileCost.waffen + imp.teileCost.schild + imp.teileCost.panzerung) * TEIL;
const impPower = imp.stats.waffen + imp.stats.schild + imp.stats.panzerung;
console.log('\n===== 8. IMPERATOR (Kosten ueber TEILE_CONVERT_RESOURCES bewertet) =====');
console.log(`  1 Teil = ${fmt(TEIL)} Wert-Einheiten -> 3.000 Teile = ${fmt(impCost)} pro Imperator`);
console.log(`  Power ${fmt(impPower)} -> P/W ${(impPower / impCost).toFixed(4)} (Leichter Jaeger: 0.90, Faktor ${(0.9 / (impPower / impCost)).toFixed(0)}x schlechter)`);
console.log(`  Bauzeit ${imp.buildTime}s = ${(imp.buildTime / 86400).toFixed(1)} Tage roh, ${((imp.buildTime * shipTimeMult(P.voll)) / 3600).toFixed(1)} h im Profil voll`);
console.log(`  maxCount ${imp.maxCount} -> Vollausbau ${fmt(impCost * imp.maxCount)} bzw. ${imp.maxCount * 3000} Teile`);

// ===== 9. GESAMT-SENKEN vs EINNAHMEN =====
console.log('\n===== 9. ALLE RESSOURCEN-SENKEN DES SPIELS =====');
const shipModTotal = SM.reduce((a, m) => a + modKum(value(m.baseCost), m.costGrowth), 0);
const defModTotal = DM_.reduce((a, m) => a + modKum(value(m.baseCost), m.costGrowth), 0);
const bmTotal2 = BM.reduce((a, m) => a + modKum(value(m.baseCost), m.costGrowth), 0);
function cumB(id, lv) { const b = BUILDINGS.find((x) => x.id === id); return value(b.baseCost) * (Math.pow(b.costGrowth, lv) - 1) / (b.costGrowth - 1); }
const buildTotal =
  cumB('metallmine', 36) + cumB('kristallmine', 32) + cumB('deuteriummine', 30) + cumB('solarkraftwerk', 38) +
  cumB('v2_metallmine', 36) + cumB('v2_kristallmine', 32) + cumB('v2_deuteriummine', 30) + cumB('v2_solarkraftwerk', 38) +
  cumB('v3_metallmine', 36) + cumB('v3_kristallmine', 32) + cumB('v3_deuteriummine', 30) + cumB('v3_solarkraftwerk', 38) +
  cumB('roboterfabrik', 20) + cumB('nanitenfabrik', 12);
const capShips =
  150 * value(ships.SHIPS.find((s) => s.id === 'salvenjaeger').cost) +
  90 * value(ships.SHIPS.find((s) => s.id === 'salvenkreuzer').cost) +
  30 * value(ships.SHIPS.find((s) => s.id === 'salvendreadnought').cost) +
  6 * impCost +
  150 * value(defenses.DEFENSES.find((d) => d.id === 'sentinelkanone').cost) +
  60 * value(defenses.DEFENSES.find((d) => d.id === 'ultimatekanone').cost);
const SINKS = {
  'Gebaeude V1+V2+V3 bis 36/32/30 (+Solar/Fabriken)': buildTotal,
  'Alle Schiffs-Module Stufe 10 (4 Linien)': shipModTotal,
  'Alle Verteidigungs-Module Stufe 10': defModTotal,
  'Alle Gebaeude-Module Stufe 10': bmTotal2,
  'Alle 21 Forschungen Stufe 10': researchCostTotal,
  'Alle limitierten Einheiten am maxCount': capShips,
};
let sinkTotal = 0;
for (const [k, v] of Object.entries(SINKS)) { console.log(`  ${k.padEnd(50)} ${fmt(v).padStart(10)}`); sinkTotal += v; }
console.log(`  ${'SUMME (einmalig, ohne unbegrenzten Schiffbau)'.padEnd(50)} ${fmt(sinkTotal).padStart(10)}`);
const incomeDay = sum;
console.log(`  bei ${fmt(incomeDay)}/Tag Einnahmen: ${(sinkTotal / incomeDay).toFixed(0)} Tage bis alles gekauft ist`);
console.log(`  ohne Elite-Bollwerk (${fmt(incomeDay - 32.6e9 / 3)}/Tag): ${(sinkTotal / (incomeDay - 32.6e9 / 3)).toFixed(0)} Tage`);

// ===== 10. DM-HAUSHALT =====
console.log('\n===== 10. DM-HAUSHALT (Session-2-Befund 4 korrigiert) =====');
const dmIn = { 'Raid-Container (Mi+So)': 595, 'Solo-Piraten Mittel': 151, 'Asteroiden (3 Felder)': 90, 'Raid-Bergung': 6, 'Elite-Serie (737, alle 3 Tage)': Math.round(737 / 3) };
let dmSum = 0;
for (const [k, v] of Object.entries(dmIn)) { console.log(`  + ${k.padEnd(34)} ${String(v).padStart(6)} DM/Tag`); dmSum += v; }
console.log(`  = ${'SUMME'.padEnd(34)} ${String(dmSum).padStart(6)} DM/Tag`);
const b24 = economy.BOOSTERS.reduce((a, b) => a + b.cost, 0);
const b30 = (b24 * economy.BOOSTER_DURATION_OPTIONS[2].costMultiplier) / 30;
console.log(`  - ${'alle 4 Booster dauerhaft (30-Tage)'.padEnd(34)} ${b30.toFixed(0).padStart(6)} DM/Tag  (24h-Tarif: ${b24})`);
console.log(`  - ${'nur Kampf-Booster (30-Tage)'.padEnd(34)} ${((55 * 20) / 30).toFixed(0).padStart(6)} DM/Tag`);
console.log(`  Ueberschuss: ${(dmSum - b30).toFixed(0)} DM/Tag = Faktor ${(dmSum / b30).toFixed(1)} ueber der groessten laufenden Senke`);

// ===== 11. MODUL-AMORTISATION GEGEN EINGESPARTE FLOTTENVERLUSTE =====
// Zahlen aus run_invest_roi.mjs (Profil voll, FLEET_LARGE, 6.18 Mrd Flottenwert)
console.log('\n===== 11. MODUL-AMORTISATION (Zahlen aus run_invest_roi.mjs) =====');
const FLEET_LARGE_IDS = ['leicht','schwer','kreuzer','schlachtschiff','bomber','schlachtkreuzer','zerstoerer','reaper','imperator','salvenkreuzer','salvendreadnought'];
let modSetTotal = 0;
for (const id of FLEET_LARGE_IDS) {
  const m = SM.find((x) => x.shipId === id && x.moduleKind === 'waffen');
  modSetTotal += 3 * modKum(value(m.baseCost), m.costGrowth);
}
const FLEET_VALUE = 6.18e9;
console.log(`  Modulsatz (3 Kampf-Linien) fuer alle Typen der Referenzflotte: ${fmt(modSetTotal)}`);
for (const [sek, l0, l10] of [['piraten_hoch', 4.17, 2.17], ['piraten_elite', 7.00, 3.83]]) {
  const saved = ((l0 - l10) / 100) * FLEET_VALUE;
  console.log(`  ${sek}: Verlust ${l0}% -> ${l10}% = ${fmt(saved)} gespart pro 24h-Trip -> Amortisation ${(modSetTotal / saved).toFixed(0)} Tage`);
}
