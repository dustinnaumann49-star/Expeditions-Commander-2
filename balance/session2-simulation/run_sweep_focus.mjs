import * as L from './lib.mjs';
async function cell(profile, fleet, multiplier, defenseFactor, runs) {
  const st = L.stateFor(profile, 1);
  const sentPower = L.combat.combatFleetPowerBase(fleet);
  let wins=0, lossSum=0, retreats=0;
  for (let i=0;i<runs;i++){
    const wp = L.combat.pickWaveProfile('piraten_hoch');
    const npc = { ...L.combat.generatePiratenFleet(sentPower*multiplier,0,wp), ...L.combat.generateDefenseFleet(sentPower*defenseFactor,0) };
    const r = await L.runner.runCombatInWorker({ sideAShips: fleet, sideBShips: npc, research: st.research, playerClass: st.playerClass, kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules });
    const won = Object.keys(npc).every(id => (r.survivorsB[id]||0) <= 0);
    if (won) wins++; if (r.retreated && !won) retreats++;
    const sent = Object.values(fleet).reduce((a,b)=>a+b,0);
    const surv = Object.keys(fleet).reduce((a,id)=>a+(r.survivorsA[id]||0),0);
    lossSum += (sent-surv)/sent;
  }
  return { win: wins/runs, retreat: retreats/runs, loss: lossSum/runs };
}
const RUNS = 40;
console.log(`=== Feinsweep, ${RUNS} Laeufe je Zelle ===`);
console.log('Profil | Feindstaerke | Sieg% | oVerlust%');
for (const p of ['voll','mittel']) {
  for (const m of [2.0,2.5,3.0,3.5,4.0]) {
    const r = await cell(p, L.FLEET_LARGE, m, 0.15, RUNS);
    console.log([p, `${(m*100).toFixed(0)}%`, (r.win*100).toFixed(0), (r.loss*100).toFixed(1)].join(' | '));
  }
}
process.exit(0);
