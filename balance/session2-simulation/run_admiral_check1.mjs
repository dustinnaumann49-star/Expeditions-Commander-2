import * as L from './lib.mjs';

const { ADMIRAL_MULTIPLIER_ROLL, ADMIRAL_BOSS_ID } = L.cc;

// Nur Check 1 (checksElapsed = 0, Eskalation = 1.0), aber mit voller Diagnose:
// Wie oft endet Check 1 mit "retreated" - und wie gross ist der tatsaechliche Verlust dabei?
async function oneCheck(profile, fleet) {
  const st = L.stateFor(profile, 1);
  const power = L.combat.combatFleetPowerBase(fleet);
  const { multiplier } = L.combat.rollMultiplierWithOutlier(ADMIRAL_MULTIPLIER_ROLL, 'piraten_admiral');
  const encounter = L.combat.generateAdmiralEncounter(power * multiplier);
  const result = await L.runner.runMultiOwnerCombatInWorker({
    contributions: [{
      ownerKey: '1', ships: fleet, research: st.research, playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules,
    }],
    sideBShips: encounter.npcShips,
    sideBStatsOverride: encounter.statsOverride,
    research: st.research,
    retreatMode: 'all',
  });
  const sent = Object.values(fleet).reduce((a, b) => a + b, 0);
  const surv = Object.keys(fleet).reduce((a, id) => a + (result.survivorsByOwner['1']?.[id] || 0), 0);
  return {
    multiplier,
    retreated: !!result.retreated,
    bossDestroyed: (result.survivorsB[ADMIRAL_BOSS_ID] || 0) <= 0,
    lossShare: (sent - surv) / sent,
    rounds: result.roundsFought,
  };
}

const CASES = [
  ['voll', L.FLEET_ADMIRAL, 'voll / grosse Flotte'],
  ['voll', L.FLEET_ADMIRAL_SMALL, 'voll / kleine Flotte'],
  ['mittel', L.FLEET_ADMIRAL, 'mittel / grosse Flotte'],
  ['voll_noboost', L.FLEET_ADMIRAL, 'voll ohne Boost / grosse Flotte'],
];
const N = Number(process.argv[2] || 30);

console.log('Fall | n | Boss vernichtet% | retreated-Flag gesetzt% | davon: Boss tot UND retreated% | oVerlust% | oVerlust wenn "Niederlage"% | oRunden');
for (const [profile, fleet, label] of CASES) {
  let boss = 0, retr = 0, both = 0, lossSum = 0, defeatLossSum = 0, defeatN = 0, rounds = 0;
  for (let i = 0; i < N; i++) {
    const r = await oneCheck(profile, fleet);
    if (r.bossDestroyed) boss++;
    if (r.retreated) retr++;
    if (r.bossDestroyed && r.retreated) both++;
    if (!r.bossDestroyed && r.retreated) { defeatLossSum += r.lossShare; defeatN++; }
    lossSum += r.lossShare;
    rounds += r.rounds;
  }
  console.log([
    label, N,
    ((boss / N) * 100).toFixed(0),
    ((retr / N) * 100).toFixed(0),
    ((both / N) * 100).toFixed(0),
    ((lossSum / N) * 100).toFixed(1),
    defeatN ? ((defeatLossSum / defeatN) * 100).toFixed(1) : '-',
    (rounds / N).toFixed(0),
  ].join(' | '));
}
process.exit(0);
