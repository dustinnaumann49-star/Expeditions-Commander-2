// lib4 statt lib: verhaelt sich ohne MESSBUILD identisch (lib.mjs == lib3.mjs, lib4 ergaenzt nur
// die Messbuild-Aufloesung), erlaubt aber die Gegenmessung einer Variante ohne Quellcode-Aenderung.
import * as L from './lib4.mjs';

const { RAID_WAVE_ROLL, RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER,
        RAID_WAVE_WIN_SILBER, RAID_WAVE_WIN_GOLD, RAID_WAVE_WIN_ELITE,
        RAID_SALVAGE_DM_PER_KILL, RAID_SALVAGE_DM_MAX, RAID_LOOT_PERCENT } = L.economy;
const { DEFENSE_REPAIR_PERCENT } = L.cc;

// Container-Erwartungswerte in Wert-Einheiten, aus Session 1 uebernommen
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const CONTAINER_DM = { silber: 0, gold: 19.4, elite: 28.6 };

// Repliziert resolveOneWave() aus raids.ts: Feindstaerke wird PRO WELLE aus der AKTUELLEN
// (bereits dezimierten) Flotte+Verteidigung neu berechnet, Verteidigungsanlagen werden nach
// jeder Welle zu DEFENSE_REPAIR_PERCENT wiederhergestellt, allowRetreat = false.
async function runRaid(profile, fleet, defense) {
  const st = L.stateFor(profile, 1);
  st.fleet = { ...fleet };
  st.defense = { ...defense };
  const repair = st.playerClass === 'bollwerk' ? 0.9 : DEFENSE_REPAIR_PERCENT;

  let wavesWon = 0, destroyedTotal = 0;
  const waveFactors = [];
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
    const waveFactor = L.combat.pick503020(RAID_WAVE_ROLL);
    waveFactors.push(waveFactor);
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * waveFactor;
    const profileW = L.combat.pickWaveProfile('raid');
    const battleModifier = L.combat.rollBattleModifier('raid');
    const npcShips = L.combat.generateFallbackFleet(waveTargetPower, profileW);
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) { wavesWon++; continue; }

    const result = await L.runner.runCombatInWorker({
      sideAShips: defenderShips,
      sideBShips: npcShips,
      research: st.research,
      defenseCounts: st.defense,
      sharedShieldPoolA: domePool,
      allowRetreat: false,
      battleModifier,
      playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf,
      shipModules: st.shipModules,
    });

    shipIds.forEach((id) => { st.fleet[id] = result.survivorsA[id] || 0; });
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const surv = result.survivorsA[id] || 0;
      st.defense[id] = surv + Math.floor((sent - surv) * repair);
    });
    npcIds.forEach((id) => { destroyedTotal += npcShips[id] - (result.survivorsB[id] || 0); });
    if (npcIds.every((id) => (result.survivorsB[id] || 0) <= 0)) wavesWon++;
  }

  const startFleet = Object.values(fleet).reduce((a, b) => a + b, 0);
  const endFleet = Object.values(st.fleet).reduce((a, b) => a + b, 0);
  const startDef = Object.values(defense).reduce((a, b) => a + b, 0);
  const endDef = Object.values(st.defense).reduce((a, b) => a + b, 0);
  return {
    wavesWon,
    fleetLoss: (startFleet - endFleet) / startFleet,
    defLoss: startDef ? (startDef - endDef) / startDef : 0,
    salvageDm: Math.min(RAID_SALVAGE_DM_MAX, destroyedTotal * RAID_SALVAGE_DM_PER_KILL),
    avgWaveFactor: waveFactors.reduce((a, b) => a + b, 0) / waveFactors.length,
  };
}

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};

const CASES = [
  ['voll', L.FLEET_LARGE, DEFENSE_LARGE, 'voll / grosse Flotte + volle Verteidigung'],
  ['voll_noboost', L.FLEET_LARGE, DEFENSE_LARGE, 'voll ohne Kampf-Boost'],
  ['mittel', L.FLEET_LARGE, DEFENSE_LARGE, 'mittel / grosse Flotte'],
  ['voll', L.FLEET_SMALL, DEFENSE_SMALL, 'voll / kleine Flotte + kleine Verteidigung'],
  ['schwach', L.FLEET_SMALL, DEFENSE_SMALL, 'schwach / kleine Flotte'],
];

const N = Number(process.argv[2] || 8);
console.log(`=== Raid: ${RAID_WAVE_COUNT} Wellen, ${N} komplette Raids je Fall ===`);
console.log('Fall | oWellen gewonnen | perfekt (12/12)% | oFlottenverlust% | oVerteidigungsverlust% | oBergungs-DM');
const results = {};
for (const [profile, fleet, defense, label] of CASES) {
  let wonSum = 0, perfect = 0, fl = 0, dl = 0, dm = 0;
  for (let i = 0; i < N; i++) {
    const r = await runRaid(profile, fleet, defense);
    wonSum += r.wavesWon;
    if (r.wavesWon >= RAID_WAVE_COUNT) perfect++;
    fl += r.fleetLoss; dl += r.defLoss; dm += r.salvageDm;
  }
  results[label] = wonSum / N;
  console.log([label, (wonSum / N).toFixed(1), ((perfect / N) * 100).toFixed(0),
    ((fl / N) * 100).toFixed(1), ((dl / N) * 100).toFixed(1), (dm / N).toFixed(1)].join(' | '));
}

console.log();
console.log('=== Belohnungsrechnung (Wert-Einheiten, Container-EV aus Session 1) ===');
for (const [label, avgWon] of Object.entries(results)) {
  const wert = avgWon * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
  const dmv = avgWon * (RAID_WAVE_WIN_GOLD * CONTAINER_DM.gold + RAID_WAVE_WIN_ELITE * CONTAINER_DM.elite);
  console.log(`${label}: ${L.mrd(wert)} pro Raid, ${L.mrd(wert * 2)} pro Woche (Mi+So), ${L.mrd(wert * 2 / 7)}/Tag, DM ${(dmv * 2).toFixed(0)}/Woche`);
}
const full = 12 * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
console.log(`Obergrenze bei 12/12: ${L.mrd(full)} pro Raid, ${L.mrd(full * 2)} pro Woche`);
console.log(`Verlust bei nicht-perfekter Abwehr: ${RAID_LOOT_PERCENT * 100}% des Ressourcenbestands, EINMAL pro Raid`);
process.exit(0);
