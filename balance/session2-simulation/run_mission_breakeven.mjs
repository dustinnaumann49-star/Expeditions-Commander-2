// Session 3: Ab welcher Flottengroesse lohnt sich ein Solo-Piraten-Sektor nicht mehr?
// Repliziert runHourlyCheck() aus missions.ts ueber eine KOMPLETTE 24h-Mission
// (PIRATEN_CHECK_COUNT Checks, checkChance je Check, Verluste werden ueber die Checks
// mitgeschleppt - anders als simulateCombat(), das nur EINEN Check betrachtet).
import * as L from './lib3.mjs';

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const { PIRATEN_CHECK_COUNT } = L.economy;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15 };

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  if (s) return s.cost ? val(s.cost) : 3000 * 325000; // Imperator ueber Teile-Gegenwert
  return 0;
};
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);

async function runMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const table = PIRATEN_MULTIPLIER_ROLL[sektorId];
  const defenseFactor = DEFENSE_FACTOR[sektorId];
  const ships = { ...fleet };
  let wins = 0;
  for (let c = 0; c < PIRATEN_CHECK_COUNT; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const ids = Object.keys(ships).filter((id) => ships[id] > 0);
    if (ids.length === 0) break;
    const sent = {};
    ids.forEach((id) => (sent[id] = ships[id]));
    const sentPower = L.combat.combatFleetPowerBase(sent);
    const { multiplier } = L.combat.rollMultiplierWithOutlier(table, sektorId);
    const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
    const npcShips = L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId));
    const npcDefenses = L.combat.generateDefenseFleet(sentPower * defenseFactor, 0);
    const npc = { ...npcShips, ...npcDefenses };
    if (Object.keys(npc).length === 0) continue;
    const result = await L.runner.runCombatInWorker({
      sideAShips: sent,
      sideBShips: npc,
      research: state.research,
      battleModifier: L.combat.rollBattleModifier(sektorId),
      playerClass: state.playerClass,
      kampfBoostActive: !!state.activeBoosters.kampf,
      shipModules: state.shipModules,
    });
    ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
    const anyDestroyed = Object.keys(npc).some((id) => (result.survivorsB[id] || 0) < npc[id]);
    if (anyDestroyed) wins++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  const reward = wins * (cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] + val(cfg.winResources));
  return { wins, lost, reward };
}

const N = Number(process.argv[2] || 10);
const SEKTOR = process.argv[3] || 'piraten_hoch';
const state = L.stateFor('voll');
console.log(`=== Komplette 24h-Missionen (${PIRATEN_CHECK_COUNT} Checks, checkChance ${SEKTOR_CONFIG[SEKTOR].checkChance}), Sektor ${SEKTOR}, Profil voll, ${N} Missionen je Zelle ===`);
console.log('Faktor'.padStart(7) + 'Flottenwert'.padStart(14) + 'Siege'.padStart(8) + 'Belohnung'.padStart(13) + 'Verlust'.padStart(13) + 'NETTO'.padStart(13) + 'Verlust%'.padStart(10));
for (const f of [0.25, 0.5, 1, 2, 4, 8, 16]) {
  const fleet = {};
  for (const [id, n] of Object.entries(L.FLEET_LARGE)) {
    const s = L.ships.SHIPS.find((x) => x.id === id);
    let c = Math.max(1, Math.round(n * f));
    if (s.maxCount) c = Math.min(c, s.maxCount);
    fleet[id] = c;
  }
  const fv = fleetValue(fleet);
  let w = 0, lo = 0, re = 0;
  for (let i = 0; i < N; i++) {
    const r = await runMission(state, SEKTOR, fleet);
    w += r.wins; lo += r.lost; re += r.reward;
  }
  const avgLost = lo / N, avgRew = re / N;
  console.log(
    (f + 'x').padStart(7) + ((fv / 1e9).toFixed(2) + ' Mrd').padStart(14) + (w / N).toFixed(1).padStart(8) +
    ((avgRew / 1e9).toFixed(2) + ' Mrd').padStart(13) + ((avgLost / 1e9).toFixed(2) + ' Mrd').padStart(13) +
    (((avgRew - avgLost) / 1e9).toFixed(2) + ' Mrd').padStart(13) + ((avgLost / fv * 100).toFixed(1) + '%').padStart(10)
  );
}
process.exit(0);
