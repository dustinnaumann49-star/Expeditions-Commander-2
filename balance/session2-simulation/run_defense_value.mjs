// Session 3: Lohnen sich Verteidigungs-Baukosten? Der Raid ist der EINZIGE Ort, an dem
// Verteidigungsanlagen ueberhaupt wirken. Repliziert resolveOneWave() aus raids.ts
// (identisch zu balance/session2-simulation/run_raid.mjs), variiert aber die Hoehe der
// Verteidigungs-Investition bei gleicher Flotte.
import * as L from './lib3.mjs';

const { RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER, RAID_WAVE_ROLL,
        RAID_WAVE_WIN_SILBER, RAID_WAVE_WIN_GOLD, RAID_WAVE_WIN_ELITE } = L.economy;
const { DEFENSE_REPAIR_PERCENT } = L.cc;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const defValue = (d) => Object.entries(d).reduce((a, [id, n]) => a + n * val(L.defenses.DEFENSES.find((x) => x.id === id).cost), 0);
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return a + n * (s.cost ? val(s.cost) : 3000 * 325000);
}, 0);

async function runRaid(profile, fleet, defense) {
  const st = L.stateFor(profile, 1);
  st.fleet = { ...fleet };
  st.defense = { ...defense };
  const repair = st.playerClass === 'bollwerk' ? 0.9 : DEFENSE_REPAIR_PERCENT;
  let wavesWon = 0;
  // dauerhaft verlorene Einheiten (nach der 70%-Reparatur) je Typ
  const permLostDef = {};
  for (let w = 0; w < RAID_WAVE_COUNT; w++) {
    const shipIds = Object.keys(st.fleet).filter((id) => st.fleet[id] > 0);
    const defIds = Object.keys(st.defense).filter((id) => st.defense[id] > 0);
    const defenderShips = {};
    shipIds.forEach((id) => (defenderShips[id] = st.fleet[id]));
    defIds.forEach((id) => (defenderShips[id] = st.defense[id]));
    let defensePower = 0, fleetPower = 0;
    defIds.forEach((id) => { const b = L.combat.baseStats(id); defensePower += st.defense[id] * (b.waffen + b.schild + b.panzerung); });
    shipIds.forEach((id) => { const b = L.combat.baseStats(id); fleetPower += st.fleet[id] * (b.waffen + b.schild + b.panzerung); });
    const combinedPower = fleetPower * 0.7 + defensePower * 0.3;
    const domePool = L.combat.computeDomeSharedPool(st.defense, st.research, !!st.activeBoosters.kampf, st.playerClass, st.shipModules);
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * L.combat.pick503020(RAID_WAVE_ROLL);
    const npcShips = L.combat.generateFallbackFleet(waveTargetPower, L.combat.pickWaveProfile('raid'));
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) { wavesWon++; continue; }
    const result = await L.runner.runCombatInWorker({
      sideAShips: defenderShips, sideBShips: npcShips, research: st.research,
      defenseCounts: st.defense, sharedShieldPoolA: domePool, allowRetreat: false,
      battleModifier: L.combat.rollBattleModifier('raid'), playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules,
    });
    shipIds.forEach((id) => { st.fleet[id] = result.survivorsA[id] || 0; });
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const surv = result.survivorsA[id] || 0;
      const after = surv + Math.floor((sent - surv) * repair);
      permLostDef[id] = (permLostDef[id] || 0) + (sent - after);
      st.defense[id] = after;
    });
    if (npcIds.every((id) => (result.survivorsB[id] || 0) <= 0)) wavesWon++;
  }
  const lostDefValue = Object.entries(permLostDef).reduce((a, [id, n]) => a + n * val(L.defenses.DEFENSES.find((x) => x.id === id).cost), 0);
  const lostFleetValue = Object.entries(fleet).reduce((a, [id, n]) => {
    const s = L.ships.SHIPS.find((x) => x.id === id);
    return a + (n - (st.fleet[id] || 0)) * (s.cost ? val(s.cost) : 3000 * 325000);
  }, 0);
  return { wavesWon, lostDefValue, lostFleetValue };
}

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
function scaleDef(f) {
  const out = {};
  for (const [id, n] of Object.entries(DEFENSE_LARGE)) {
    const d = L.defenses.DEFENSES.find((x) => x.id === id);
    let c = Math.round(n * f);
    if (d.maxCount) c = Math.min(c, d.maxCount);
    if (c > 0) out[id] = c;
  }
  return out;
}

const N = Number(process.argv[2] || 4);
const raidReward = RAID_WAVE_COUNT * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
console.log(`Flotte FLEET_LARGE: ${(fleetValue(L.FLEET_LARGE) / 1e9).toFixed(2)} Mrd Wert. Belohnung bei 12/12: ${(raidReward / 1e9).toFixed(2)} Mrd (fix, unabhaengig von der Verteidigung)\n`);
console.log('Verteidigung'.padEnd(16) + 'Invest'.padStart(12) + 'oWellen'.padStart(9) + 'perfekt%'.padStart(10) + 'Verlust Vert.'.padStart(15) + 'Verlust Flotte'.padStart(16) + 'Netto/Raid'.padStart(13));
for (const f of [0, 0.1, 0.25, 1, 3]) {
  const defense = f === 0 ? {} : scaleDef(f);
  const inv = defValue(defense);
  let won = 0, perfect = 0, dv = 0, fv = 0;
  for (let i = 0; i < N; i++) {
    const r = await runRaid('voll', L.FLEET_LARGE, defense);
    won += r.wavesWon; if (r.wavesWon >= RAID_WAVE_COUNT) perfect++;
    dv += r.lostDefValue; fv += r.lostFleetValue;
  }
  const avgWon = won / N;
  const reward = avgWon * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
  console.log(
    (f + 'x').padEnd(16) + ((inv / 1e9).toFixed(2) + ' Mrd').padStart(12) + avgWon.toFixed(1).padStart(9) +
    ((perfect / N * 100).toFixed(0) + '%').padStart(10) +
    ((dv / N / 1e6).toFixed(0) + ' Mio').padStart(15) + ((fv / N / 1e6).toFixed(0) + ' Mio').padStart(16) +
    (((reward - dv / N - fv / N) / 1e9).toFixed(2) + ' Mrd').padStart(13)
  );
}
process.exit(0);
