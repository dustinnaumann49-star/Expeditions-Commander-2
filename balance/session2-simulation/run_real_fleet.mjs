// Session 3: die REALE Flotte des Nutzers (Angabe 08.08.2026) gegen Solo-Hoch und Elite-Bollwerk.
// Annahmen, falls abweichend bitte korrigieren:
//   - "10k leichte/schwere Jaeger" = 5.000 + 5.000
//   - "alle 3 Kreuzer-Klassen ca. 5k" = kreuzer/schlachtschiff/bomber je 5.000
//   - "Elite-Klassen 2k" = schlachtkreuzer/zerstoerer/reaper je 2.000
//   - Salvenschiffe am maxCount, Imperator am maxCount (6)
import * as L from './lib3.mjs';

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };
const REWARD_ELITE_SERIES = 32.60e9;

export const REAL_FLEET = {
  leicht: 5000, schwer: 5000,
  kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 2000, zerstoerer: 2000, reaper: 2000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
  imperator: 6,
};

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0;
};
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);

// Ein Check gegen einen Sektor, gibt Ueberlebende + vernichtete Feindmacht (Basiswerte) zurueck.
async function oneCheck(state, sektorId, ships) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ids = Object.keys(ships).filter((id) => ships[id] > 0);
  const sent = {};
  ids.forEach((id) => (sent[id] = ships[id]));
  const sentPower = L.combat.combatFleetPowerBase(sent);
  const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[sektorId], sektorId);
  const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
  const npcShips = L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId));
  const npcDefenses = L.combat.generateDefenseFleet(sentPower * DEFENSE_FACTOR[sektorId], 0);
  const npc = { ...npcShips, ...npcDefenses };
  if (Object.keys(npc).length === 0) return null;
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier(sektorId), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
  });
  ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
  // vernichtete Feindmacht in Basiswert-Einheiten (combatFleetPowerBase-Logik)
  const destroyed = {};
  Object.keys(npc).forEach((id) => { destroyed[id] = npc[id] - (result.survivorsB[id] || 0); });
  const destroyedPower = L.combat.combatFleetPowerBase(destroyed);
  const anyDestroyed = Object.values(destroyed).some((n) => n > 0);
  return { destroyedPower, anyDestroyed, npcPower: L.combat.combatFleetPowerBase(npc) };
}

async function soloMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ships = { ...fleet };
  let wins = 0, destroyedPower = 0;
  for (let c = 0; c < 6; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, sektorId, ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (r.anyDestroyed) wins++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  const reward = wins * (cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] + val(cfg.winResources));
  return { wins, lost, reward, destroyedPower };
}

async function eliteSeries(state, fleet) {
  const ships = { ...fleet };
  let destroyedPower = 0, checks = 0;
  for (let c = 0; c < 6; c++) {
    const r = await oneCheck(state, 'piraten_elite', ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (r.anyDestroyed) checks++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return { checks, lost, reward: REWARD_ELITE_SERIES, destroyedPower };
}

const N = Number(process.argv[2] || 5);
const SALVAGE = 0.3;
const fv = fleetValue(REAL_FLEET);
const stk = Object.values(REAL_FLEET).reduce((a, b) => a + b, 0);
console.log(`=== Reale Nutzer-Flotte: ${stk.toLocaleString('de-DE')} Schiffe, ${(fv / 1e9).toFixed(2)} Mrd Wert, BasePower ${(L.combat.combatFleetPowerBase(REAL_FLEET) / 1e9).toFixed(2)} Mrd ===`);
console.log(`(entspricht dem ${(fv / 6.18e9).toFixed(1)}-fachen der Session-2-Referenzflotte)\n`);

for (const profile of ['voll', 'mittel']) {
  const state = L.stateFor(profile);
  console.log(`--- Profil ${profile}, ${N} Durchlaeufe je Zeile ---`);
  console.log('Einsatz'.padEnd(22) + 'Siege'.padStart(7) + 'Belohnung'.padStart(12) + 'Verlust'.padStart(11) + 'Netto heute'.padStart(13) + `Netto +${SALVAGE * 100}% Bergung`.padStart(20) + 'vernicht. Feindmacht'.padStart(22));
  for (const [label, fn] of [['Solo Hoch (24h)', (s, f) => soloMission(s, 'piraten_hoch', f)], ['Elite-Bollwerk (Serie)', (s, f) => eliteSeries(s, f)]]) {
    let w = 0, lo = 0, re = 0, dp = 0;
    for (let i = 0; i < N; i++) {
      const r = await fn(state, { ...REAL_FLEET });
      w += r.wins ?? r.checks; lo += r.lost; re += r.reward; dp += r.destroyedPower;
    }
    const L1 = lo / N, R1 = re / N, D1 = dp / N;
    console.log(
      label.padEnd(22) + (w / N).toFixed(1).padStart(7) +
      ((R1 / 1e9).toFixed(2) + ' Mrd').padStart(12) + ((L1 / 1e9).toFixed(2) + ' Mrd').padStart(11) +
      (((R1 - L1) / 1e9).toFixed(2) + ' Mrd').padStart(13) +
      (((R1 - L1 * (1 - SALVAGE)) / 1e9).toFixed(2) + ' Mrd').padStart(20) +
      ((D1 / 1e9).toFixed(2) + ' Mrd').padStart(22)
    );
  }
  console.log();
}
process.exit(0);
