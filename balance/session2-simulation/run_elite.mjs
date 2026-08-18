// lib4 statt lib: verhaelt sich ohne MESSBUILD identisch (lib.mjs == lib3.mjs, lib4 ergaenzt nur
// die Messbuild-Aufloesung), erlaubt aber die Gegenmessung einer Variante ohne Quellcode-Aenderung.
import * as L from './lib4.mjs';

const cfg = L.sectors.SEKTOR_CONFIG.piraten_elite;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const CONTAINER_DM = { silber: 0, gold: 19.4, elite: 28.6 };

// ---------- Teil 1: volle 6-Check-Serie durchrechnen ----------
console.log('=== Elite-Bollwerk: volle 6-Check-Serie pro Spieler (Wert-Einheiten) ===');
const totalPower = L.combat.combatFleetPowerBase(L.FLEET_LARGE) * 2; // 2 Teilnehmer
const fleetBonus = L.combat.fleetSizeRewardMultiplier(totalPower, cfg.npcFloor);
console.log(`Grossflotten-Bonus bei ${(totalPower / 1e9).toFixed(2)} Mrd Power gegen npcFloor ${cfg.npcFloor.toLocaleString('de-DE')}: x${fleetBonus.toFixed(2)} (Cap ${1 + L.cc.FLEET_SIZE_BONUS_CAP})`);

const lootVal = L.value(cfg.lootBase);
const winVal = L.value(cfg.winResources);
let lootSum = 0;
const rows = [];
for (let check = 1; check <= 6; check++) {
  const esc = L.economy.getEscalationMultiplier('piraten_elite', check - 1);
  const loot = lootVal * esc * fleetBonus;
  lootSum += loot;
  rows.push({ check, esc, loot, win: winVal });
}
const containerVal = cfg.guaranteedContainers.reduce((s, g) => s + g.count * CONTAINER_EV[g.tier], 0);
const containerDm = cfg.guaranteedContainers.reduce((s, g) => s + g.count * CONTAINER_DM[g.tier], 0);

console.log('Check | Eskalation | lootBase-Anteil | winResources | garant. Container');
rows.forEach((r) => console.log(`${r.check} | x${r.esc} | ${L.mio(r.loot)} | ${L.mio(r.win)} | ${L.mio(containerVal)}`));

const resourcesRaw = lootSum + winVal * 6;
const perfect = resourcesRaw * 2; // "Perfekte Serie" verdoppelt NUR Ressourcen
const captainEv = 6 * cfg.captainChance * CONTAINER_EV[cfg.captainContainerTier];
const captainDm = 6 * cfg.captainChance * cfg.captainDm;
console.log();
console.log(`Ressourcen ohne Perfekt-Bonus: ${L.mrd(resourcesRaw)}`);
console.log(`Ressourcen MIT Perfekt-Bonus (x2): ${L.mrd(perfect)}`);
console.log(`Garantierte Container ueber 6 Checks: ${L.mrd(containerVal * 6)} + ${(containerDm * 6).toFixed(0)} DM`);
console.log(`Kapitaen-Erwartungswert: ${L.mio(captainEv)} + ${captainDm.toFixed(0)} DM`);
console.log(`GESAMT pro Spieler pro 24h-Serie: ${L.mrd(perfect + containerVal * 6 + captainEv)} + ${(containerDm * 6 + captainDm).toFixed(0)} DM`);

// ---------- Teil 2: Mehrspieler-Check, Wirkung von computePirateResearch (Minimum) ----------
async function eliteCheck(parts) {
  const states = parts.map((p, i) => L.stateFor(p.profile, i + 1));
  const totalSentPower = parts.reduce((s, p) => s + L.combat.combatFleetPowerBase(p.fleet), 0);
  const table = L.sectors.PIRATEN_MULTIPLIER_ROLL.piraten_elite;
  const { multiplier } = L.combat.rollMultiplierWithOutlier(table, 'piraten_elite');
  const targetPower = Math.max(totalSentPower * multiplier, cfg.npcFloor);
  const profile = L.combat.pickWaveProfile('piraten_elite');
  const npc = {
    ...L.combat.generatePiratenFleet(targetPower, 0, profile),
    ...L.combat.generateDefenseFleet(totalSentPower * 0.18, 0),
  };
  const contributions = parts.map((p, i) => ({
    ownerKey: String(i + 1), ships: p.fleet, research: states[i].research,
    playerClass: states[i].playerClass, kampfBoostActive: !!states[i].activeBoosters.kampf,
    shipModules: states[i].shipModules,
  }));
  const result = await L.runner.runMultiOwnerCombatInWorker({
    contributions, sideBShips: npc, research: states[0].research,
  });
  const won = Object.keys(npc).every((id) => (result.survivorsB[id] || 0) <= 0);
  const per = parts.map((p, i) => {
    const sent = Object.values(p.fleet).reduce((a, b) => a + b, 0);
    const surv = Object.keys(p.fleet).reduce((a, id) => a + (result.survivorsByOwner[String(i + 1)]?.[id] || 0), 0);
    return (sent - surv) / sent;
  });
  return { won, per };
}

const N = Number(process.argv[2] || 15);
console.log();
console.log(`=== Elite-Bollwerk Mehrspieler-Check, ${N} Laeufe je Konstellation ===`);
console.log('Konstellation | Sieg% | oVerlust Spieler 1% | oVerlust Spieler 2%');
const KONST = [
  [[{ profile: 'voll', fleet: L.FLEET_LARGE }, { profile: 'voll', fleet: L.FLEET_LARGE }], '2x voll'],
  [[{ profile: 'voll', fleet: L.FLEET_LARGE }, { profile: 'mittel', fleet: L.FLEET_LARGE }], 'voll + mittel'],
  [[{ profile: 'voll', fleet: L.FLEET_LARGE }, { profile: 'schwach', fleet: L.FLEET_LARGE }], 'voll + schwach'],
  [[{ profile: 'voll', fleet: L.FLEET_LARGE }, { profile: 'schwach', fleet: L.FLEET_SMALL }], 'voll + schwach (kleine Flotte)'],
];
for (const [parts, label] of KONST) {
  let won = 0; const loss = [0, 0];
  for (let i = 0; i < N; i++) {
    const r = await eliteCheck(parts);
    if (r.won) won++;
    r.per.forEach((v, j) => (loss[j] += v));
  }
  console.log([label, ((won / N) * 100).toFixed(0), ((loss[0] / N) * 100).toFixed(1), ((loss[1] / N) * 100).toFixed(1)].join(' | '));
}
process.exit(0);
