// Allianz-Station vs. Heimatbasis - reine Arithmetik, keine Kampfsimulation.
// Aufruf: node run_station.mjs
const D = '../../server/dist/game';
const st = await import(`${D}/data/stationBuildings.js`);
const hb = await import(`${D}/data/buildings.js`);
const stm = await import(`${D}/data/stationBuildingModules.js`);

const V = { metall: 1, kristall: 1.5, deuterium: 3 };
const value = (r) => (r.metall || 0) * V.metall + (r.kristall || 0) * V.kristall + (r.deuterium || 0) * V.deuterium;
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const mio = (x) => `${(x / 1e6).toFixed(1)} Mio`;
const days = (s) => `${(s / 86400).toFixed(1)} d`;

// Kosten Stufe L (wie stationBuildingCostForLevel/actions.ts): baseCost * growth^(L-1)
function costAt(b, L) {
  const f = Math.pow(b.costGrowth, L - 1);
  return { metall: b.baseCost.metall * f, kristall: b.baseCost.kristall * f, deuterium: b.baseCost.deuterium * f };
}
function cumCost(b, L) {
  let m = 0, k = 0, d = 0;
  for (let i = 1; i <= L; i++) { const c = costAt(b, i); m += c.metall; k += c.kristall; d += c.deuterium; }
  return { metall: m, kristall: k, deuterium: d };
}
function timeAt(b, L) { return b.baseTimeSeconds * Math.pow(b.timeGrowth, L - 1); }
function cumTime(b, L) { let t = 0; for (let i = 1; i <= L; i++) t += timeAt(b, i); return t; }
// Produktion/Energie: base * L * 1.1^L
const scaled = (base, L) => (L > 0 ? base * L * Math.pow(1.1, L) : 0);

const CAP = 30;
const MINES = ['mine_metall', 'mine_kristall', 'mine_deuterium'];

console.log('=== 1. Station: eine Stufe (V1/V2/V3) komplett auf Level 30 ===\n');
let grandCost = { metall: 0, kristall: 0, deuterium: 0 };
let grandOutH = { metall: 0, kristall: 0, deuterium: 0 };
let grandTime = 0;
for (const tier of [1, 2, 3]) {
  const list = st.STATION_BUILDINGS.filter((b) => b.tier === tier);
  let tCost = { metall: 0, kristall: 0, deuterium: 0 };
  let tTime = 0;
  let out = { metall: 0, kristall: 0, deuterium: 0 };
  let energyUse = 0;
  console.log(`--- V${tier} ---`);
  for (const b of list) {
    if (!MINES.includes(b.kind)) continue;
    const c = cumCost(b, CAP);
    const t = cumTime(b, CAP);
    tCost = { metall: tCost.metall + c.metall, kristall: tCost.kristall + c.kristall, deuterium: tCost.deuterium + c.deuterium };
    tTime += t;
    const o = scaled(b.baseOutput, CAP);
    energyUse += scaled(b.baseEnergyUse, CAP);
    if (b.kind === 'mine_metall') out.metall += o;
    if (b.kind === 'mine_kristall') out.kristall += o;
    if (b.kind === 'mine_deuterium') out.deuterium += o;
    console.log(`  ${b.name.padEnd(32)} Kosten bis 30: ${mrd(value(c)).padStart(10)}  Bauzeit roh: ${days(t).padStart(10)}  Ertrag/h: ${mio(o).padStart(10)}`);
  }
  // Solar-Level, das den Energiebedarf deckt
  const solar = list.find((b) => b.kind === 'energie');
  let solarLevel = 0;
  while (scaled(solar.baseEnergyOutput, solarLevel) < energyUse && solarLevel < 200) solarLevel++;
  const sc = cumCost(solar, solarLevel);
  const stt = cumTime(solar, solarLevel);
  console.log(`  ${solar.name.padEnd(32)} benoetigte Stufe: ${solarLevel} (Bedarf ${mio(energyUse)} Energie)  Kosten: ${mrd(value(sc))}  Bauzeit roh: ${days(stt)}`);
  tCost = { metall: tCost.metall + sc.metall, kristall: tCost.kristall + sc.kristall, deuterium: tCost.deuterium + sc.deuterium };
  tTime += stt;
  const dayVal = value({ metall: out.metall * 24, kristall: out.kristall * 24, deuterium: out.deuterium * 24 });
  console.log(`  => V${tier} Summe: Kosten ${mrd(value(tCost))}, Bauzeit roh ${days(tTime)}, Ertrag ${mrd(dayVal)} Wert/Tag\n`);
  grandCost = { metall: grandCost.metall + tCost.metall, kristall: grandCost.kristall + tCost.kristall, deuterium: grandCost.deuterium + tCost.deuterium };
  grandOutH = { metall: grandOutH.metall + out.metall, kristall: grandOutH.kristall + out.kristall, deuterium: grandOutH.deuterium + out.deuterium };
  grandTime += tTime;
}
const stationDay = value({ metall: grandOutH.metall * 24, kristall: grandOutH.kristall * 24, deuterium: grandOutH.deuterium * 24 });
console.log(`STATION VOLLAUSBAU (V1+V2+V3, alle Minen 30, Solar bedarfsdeckend, OHNE Module/Fabriken):`);
console.log(`  Kosten:  ${mrd(value(grandCost))}`);
console.log(`  Ertrag:  ${mrd(stationDay)} Wert/Tag  (${mio(grandOutH.metall)} M / ${mio(grandOutH.kristall)} K / ${mio(grandOutH.deuterium)} D pro Stunde)`);
console.log(`  Bauzeit ROH (ohne Roboter/Nanit, 1 Bau-Slot fuer die ganze Allianz): ${days(grandTime)} = ${(grandTime / 86400 / 365).toFixed(1)} Jahre`);
console.log(`  Amortisation gegen die eigenen Kosten: ${(value(grandCost) / stationDay).toFixed(1)} Tage`);
console.log(`  Anteil an der Einnahmen-Baseline (21,69 Mrd/Tag, Session 3): ${((stationDay / 21.69e9) * 100).toFixed(1)} %\n`);

console.log('=== 2. Wirkung der Foerdereffizienz-Module (Stufe 10 = +50%) ===\n');
let modCost = { metall: 0, kristall: 0, deuterium: 0 };
for (const m of stm.STATION_BUILDING_MODULES.filter((m) => m.id.includes('foerdereffizienz'))) {
  const c = cumCost({ baseCost: m.baseCost, costGrowth: m.costGrowth }, 10);
  modCost = { metall: modCost.metall + c.metall, kristall: modCost.kristall + c.kristall, deuterium: modCost.deuterium + c.deuterium };
}
console.log(`  Alle 9 Foerdereffizienz-Module auf 10: ${mrd(value(modCost))}, Mehrertrag +50% = ${mrd(stationDay * 0.5)}/Tag`);
console.log(`  Amortisation: ${(value(modCost) / (stationDay * 0.5)).toFixed(1)} Tage`);
console.log(`  ACHTUNG requiredBuildingLevel=20 bei Minen mit maxLevel 30 -> Modul erst ab 2/3 der Ausbaustrecke nutzbar.\n`);

console.log('=== 3. Bauzeit-Hebel: Roboter-/Nanitenfabrik der Station ===\n');
const rob = st.STATION_BUILDINGS.find((b) => b.id === 'v1_roboterfabrik');
const nan = st.STATION_BUILDINGS.find((b) => b.id === 'v1_nanitenfabrik');
for (const L of [5, 10, 15, 20, 24, 30]) {
  const f = Math.pow(0.75, L);
  const c = cumCost(rob, L);
  console.log(`  Roboterfabrik V1 Stufe ${String(L).padStart(2)}: Faktor ${f.toExponential(2)}  Kosten ${mrd(value(c)).padStart(12)}  Restbauzeit V1-Minen ${days(grandTime * f)}`);
}
for (const L of [5, 10, 15, 20]) {
  const c = cumCost(nan, L);
  console.log(`  Nanitenfabrik V1 Stufe ${String(L).padStart(2)}: Faktor ${Math.pow(0.5, L).toExponential(2)}  Kosten ${mrd(value(c)).padStart(12)}`);
}

console.log('\n=== 4. Vergleich Heimatbasis (gleiche Basiswerte, KEIN Cap) ===\n');
const homeThresh = { metallmine: 36, kristallmine: 32, deuteriummine: 30 };
let homeCost = { metall: 0, kristall: 0, deuterium: 0 };
let homeOut = { metall: 0, kristall: 0, deuterium: 0 };
for (const [id, L] of Object.entries(homeThresh)) {
  const b = hb.BUILDINGS.find((x) => x.id === id);
  const c = cumCost(b, L);
  homeCost = { metall: homeCost.metall + c.metall, kristall: homeCost.kristall + c.kristall, deuterium: homeCost.deuterium + c.deuterium };
  const o = scaled(b.baseOutput, L);
  if (b.kind === 'mine_metall') homeOut.metall += o;
  if (b.kind === 'mine_kristall') homeOut.kristall += o;
  if (b.kind === 'mine_deuterium') homeOut.deuterium += o;
  console.log(`  ${b.name.padEnd(30)} Stufe ${L}: Kosten ${mrd(value(c)).padStart(11)}, Ertrag/h ${mio(o)}`);
}
const homeDay = value({ metall: homeOut.metall * 24, kristall: homeOut.kristall * 24, deuterium: homeOut.deuterium * 24 });
console.log(`  Heimatbasis V1 auf Freischaltschwelle (36/32/30): ${mrd(value(homeCost))} Kosten, ${mrd(homeDay)} Wert/Tag`);
console.log(`  Station V1 auf Cap 30/30/30: siehe oben; Station-Minen bekommen KEINE Mining-Forschung/`);
console.log(`  Klasse/Booster (stations.ts), Heimatbasis-Minen schon -> gleicher Level = weniger Ertrag.\n`);

console.log('=== 5. Level-Cap-Vergleich: was kostet die naechste Stufe? ===\n');
for (const id of ['metallmine']) {
  const b = hb.BUILDINGS.find((x) => x.id === id);
  for (const L of [30, 31, 33, 36, 40]) {
    const c = costAt(b, L);
    const gain = scaled(b.baseOutput, L) - scaled(b.baseOutput, L - 1);
    console.log(`  Metallmine Stufe ${L}: Kosten ${mrd(value(c)).padStart(11)}  Mehrertrag ${mio(gain * 24).padStart(10)}/Tag  Amortisation ${(value(c) / (gain * 24)).toFixed(0)} Tage`);
  }
}
