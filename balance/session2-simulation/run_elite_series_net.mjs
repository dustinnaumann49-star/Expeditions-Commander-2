// Session 3: Elite-Bollwerk - komplette 6-Check-Serie, Verluste ueber die Checks mitgeschleppt.
// Prueft die Nutzer-Beobachtung "Minusgeschaeft" gegen den aktuellen Codestand und ermittelt,
// ab welcher Flottengroesse die Serie kippt.
// Belohnung: Session-2-Befund 5 (32,60 Mrd Wert je Spieler bei perfekter 6-Check-Serie).
import * as L from './lib3.mjs';

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const SEKTOR = 'piraten_elite';
const cfg = SEKTOR_CONFIG[SEKTOR];
const DEFENSE_FACTOR = 0.18;
const REWARD_PERFECT_SERIES = 32.60e9; // Wert-Einheiten je Spieler, aus Session 2

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0;
};
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);

async function runSeries(state, fleet) {
  const ships = { ...fleet };
  let checksWon = 0;
  for (let c = 0; c < 6; c++) {
    const ids = Object.keys(ships).filter((id) => ships[id] > 0);
    if (ids.length === 0) break;
    const sent = {};
    ids.forEach((id) => (sent[id] = ships[id]));
    const sentPower = L.combat.combatFleetPowerBase(sent);
    const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[SEKTOR], SEKTOR);
    const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
    const npcShips = L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(SEKTOR));
    const npcDefenses = L.combat.generateDefenseFleet(sentPower * DEFENSE_FACTOR, 0);
    const npc = { ...npcShips, ...npcDefenses };
    if (Object.keys(npc).length === 0) continue;
    const result = await L.runner.runCombatInWorker({
      sideAShips: sent, sideBShips: npc, research: state.research,
      battleModifier: L.combat.rollBattleModifier(SEKTOR), playerClass: state.playerClass,
      kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
    });
    ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
    if (Object.keys(npc).some((id) => (result.survivorsB[id] || 0) < npc[id])) checksWon++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return { checksWon, lost };
}

const N = Number(process.argv[2] || 8);
const PROFILE = process.argv[3] || 'voll';
const state = L.stateFor(PROFILE);
console.log(`=== Elite-Bollwerk, komplette 6-Check-Serie, Profil ${PROFILE}, ${N} Serien je Zelle ===`);
console.log(`Belohnung bei perfekter Serie (Session-2-Befund 5): ${(REWARD_PERFECT_SERIES / 1e9).toFixed(2)} Mrd je Spieler\n`);
console.log('Faktor'.padStart(7) + 'Flottenwert'.padStart(14) + 'Checks'.padStart(8) + 'Verlust'.padStart(13) + 'Verlust%'.padStart(10) + 'NETTO'.padStart(13));
for (const f of [0.25, 1, 2, 4, 8, 16]) {
  const fleet = {};
  for (const [id, n] of Object.entries(L.FLEET_LARGE)) {
    const s = L.ships.SHIPS.find((x) => x.id === id);
    let c = Math.max(1, Math.round(n * f));
    if (s.maxCount) c = Math.min(c, s.maxCount);
    fleet[id] = c;
  }
  const fv = fleetValue(fleet);
  let lo = 0, cw = 0;
  for (let i = 0; i < N; i++) { const r = await runSeries(state, fleet); lo += r.lost; cw += r.checksWon; }
  const avgLost = lo / N;
  console.log(
    (f + 'x').padStart(7) + ((fv / 1e9).toFixed(2) + ' Mrd').padStart(14) + (cw / N).toFixed(1).padStart(8) +
    ((avgLost / 1e9).toFixed(2) + ' Mrd').padStart(13) + ((avgLost / fv * 100).toFixed(1) + '%').padStart(10) +
    (((REWARD_PERFECT_SERIES - avgLost) / 1e9).toFixed(2) + ' Mrd').padStart(13)
  );
}
process.exit(0);
