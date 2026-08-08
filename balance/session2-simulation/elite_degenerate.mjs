import * as L from './lib.mjs';
const cfg = L.sectors.SEKTOR_CONFIG.piraten_elite;

async function check(parts, N) {
  let won=0; const loss = parts.map(()=>0);
  for (let i=0;i<N;i++){
    const states = parts.map((p,j)=>{
      const s = L.stateFor(p.profile, j+1);
      if (p.researchOverride !== undefined) { Object.keys(s.research).forEach(k=>s.research[k]=p.researchOverride); }
      return s;
    });
    const totalSentPower = parts.reduce((s,p)=>s+L.combat.combatFleetPowerBase(p.fleet),0);
    const { multiplier } = L.combat.rollMultiplierWithOutlier(L.sectors.PIRATEN_MULTIPLIER_ROLL.piraten_elite,'piraten_elite');
    const targetPower = Math.max(totalSentPower*multiplier, cfg.npcFloor);
    const npc = { ...L.combat.generatePiratenFleet(targetPower,0,L.combat.pickWaveProfile('piraten_elite')),
                  ...L.combat.generateDefenseFleet(totalSentPower*0.18,0) };
    const contributions = parts.map((p,j)=>({ ownerKey:String(j+1), ships:p.fleet, research:states[j].research,
      playerClass:states[j].playerClass, kampfBoostActive:!!states[j].activeBoosters.kampf, shipModules:states[j].shipModules }));
    const r = await L.runner.runMultiOwnerCombatInWorker({ contributions, sideBShips: npc, research: states[0].research });
    if (Object.keys(npc).every(id=>(r.survivorsB[id]||0)<=0)) won++;
    parts.forEach((p,j)=>{
      const sent = Object.values(p.fleet).reduce((a,b)=>a+b,0);
      const surv = Object.keys(p.fleet).reduce((a,id)=>a+(r.survivorsByOwner[String(j+1)]?.[id]||0),0);
      loss[j] += (sent-surv)/sent;
    });
  }
  return { won: won/N, loss: loss.map(v=>v/N) };
}

const N = 15;
console.log('Konstellation | Sieg% | Verlust Hauptspieler%');
let r = await check([{profile:'voll', fleet:L.FLEET_LARGE}], N);
console.log(`allein voll | ${(r.won*100).toFixed(0)} | ${(r.loss[0]*100).toFixed(2)}`);
r = await check([{profile:'voll', fleet:L.FLEET_LARGE},{profile:'schwach', fleet:{leicht:1}, researchOverride:0}], N);
console.log(`voll + Mitspieler mit 1 Jaeger und Forschung 0 | ${(r.won*100).toFixed(0)} | ${(r.loss[0]*100).toFixed(2)}`);
process.exit(0);
