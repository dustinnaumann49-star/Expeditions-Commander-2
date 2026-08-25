// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//
// ===================================================================================
// BUILD-PRUEFUNG GEGEN loot_curve.txt - WIEDERVERWENDBAR FUER JEDEN MESSBUILD
// ===================================================================================
// Bisher steckte diese Pruefung als Teilmodus in run_novice_bonus.mjs ('anker'). Da ab
// Schritt 13 mehrere aufeinander aufbauende Builds geprueft werden muessen (kum -> salve
// -> sim13), ist sie hier herausgeloest.
//
//   cd server && npm install && npx tsc
//   node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=/tmp/mb_kum node check_build_anker.mjs [N]
//
// MESSREGEL, DIE HIER DER GANZE PUNKT IST: NORMIERT vergleichen, nicht roh. Die Zelle
// streut ueber die Zahl der gewonnenen Checks; roh sieht ein KORREKTER Build deshalb
// falsch aus. Am 25.08.2026 erneut bestaetigt: dieselbe Zelle normiert -0,8 %, roh +1,9 %.
//
// SOLL aus loot_curve.txt, Scheibe 1, Zelle mittel/hoch:
//   1,05 Mrd Belohnung bei 11,1 Mrd vernichteter Feindmacht
//   -> 0,0946 Wert-Einheiten je Punkt vernichteter Feindmacht
import * as L from './lib3.mjs';

if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt - dieser Check ist nur fuer Messbuilds gedacht.');
const loot = await import(`${process.env.MESSBUILD}/game/loot.js`);

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const E = L.economy;
const SOLL_JE_PUNKT = 0.0946;
const TOLERANZ = 0.05; // 5 % normiert
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };
const N = Number(process.argv[2] || 40);

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const mrd = (x) => `${(x / 1e9).toFixed(3)} Mrd`;

async function oneCheck(state, sektorId, ships) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ids = Object.keys(ships).filter((id) => ships[id] > 0);
  if (ids.length === 0) return null;
  const sent = {};
  ids.forEach((id) => (sent[id] = ships[id]));
  const sentPower = L.combat.combatFleetPowerBase(sent);
  const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[sektorId], sektorId);
  const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
  const npc = {
    ...L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId)),
    ...L.combat.generateDefenseFleet(sentPower * DEFENSE_FACTOR[sektorId], 0),
  };
  if (Object.keys(npc).length === 0) return null;
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier(sektorId), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
  });
  ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
  const destroyed = {};
  Object.keys(npc).forEach((id) => {
    const d = npc[id] - (result.survivorsB[id] || 0);
    if (d > 0 && id !== 'piratenkapitan') destroyed[id] = d;
  });
  return {
    destroyedPower: L.combat.combatFleetPowerBase(destroyed),
    anyDestroyed: Object.keys(destroyed).length > 0,
  };
}

async function soloMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ships = { ...fleet };
  let wins = 0, destroyedPower = 0, resourceValue = 0;
  for (let c = 0; c < 6; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, sektorId, ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (!r.anyDestroyed) continue;
    wins++;
    resourceValue += val(cfg.winResources) * loot.lootCurveFactor(r.destroyedPower, E.LOOT_CURVE_SOLO_CHECK_POWER);
  }
  const container = wins > 0 ? cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] : 0;
  return { wins, destroyedPower, reward: container + resourceValue };
}

console.log('='.repeat(78));
console.log('BUILD-PRUEFUNG GEGEN loot_curve.txt (MESSBUILD-WERTE)');
console.log('='.repeat(78));
console.log(`Build : ${process.env.MESSBUILD}`);
console.log(`Zelle : Profil mittel, Sektor piraten_hoch, FLEET_LARGE, ${N} Durchlaeufe`);
console.log(`Soll  : 1,05 Mrd bei 11,1 Mrd Feindmacht -> ${SOLL_JE_PUNKT} je Punkt`);
console.log('');

const state = L.stateFor('mittel');
const rows = [];
for (let i = 0; i < N; i++) {
  rows.push(await soloMission(state, 'piraten_hoch', { ...L.FLEET_LARGE }));
  if ((i + 1) % 10 === 0) console.log(`  ... ${i + 1}/${N}`);
}
const mit = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
const re = mit('reward'), dp = mit('destroyedPower'), w = mit('wins');
const jePunkt = re / dp;
const normiert = jePunkt / SOLL_JE_PUNKT - 1;
const roh = re / 1.05e9 - 1;

console.log('');
console.log(`Ist   : ${mrd(re)} bei ${mrd(dp)} Feindmacht, ${w.toFixed(2)} Siege`);
console.log(`        -> ${jePunkt.toFixed(4)} je Punkt`);
console.log(`Abweichung NORMIERT : ${(normiert * 100).toFixed(1)} %   <- das ist die gueltige Zahl`);
console.log(`Abweichung roh      : ${(roh * 100).toFixed(1)} %   <- taeuscht, nicht verwenden`);
console.log('');
console.log(Math.abs(normiert) <= TOLERANZ
  ? `BUILD GUELTIG (normiert innerhalb ${(TOLERANZ * 100).toFixed(0)} %).`
  : `BUILD VERDAECHTIG - normiert ausserhalb ${(TOLERANZ * 100).toFixed(0)} %. NICHT verwenden, Patch pruefen.`);

// Worker-Pool und DB-Handle halten den Event-Loop offen (siehe sim_vorbedingungen_13.txt).
process.exit(0);
