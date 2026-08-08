import * as L from './lib.mjs';

const { ADMIRAL_MULTIPLIER_ROLL, ADMIRAL_ESCALATION_PER_CHECK, ADMIRAL_TOTAL_CHECKS, ADMIRAL_BOSS_ID,
        ADMIRAL_EXTRACTION_BASE, ADMIRAL_EXTRACTION_GROWTH_PER_CHECK, ADMIRAL_VICTORY_BONUS } = L.cc;

// Repliziert runAdminCheck()/tickAdminEncounter() aus groupOps.ts 1:1 (Kampf ueber denselben
// Worker, dieselbe Encounter-Generierung, Ueberlebende werden in den naechsten Check
// uebernommen, totalSentPower bleibt wie im Original auf dem START-Wert eingefroren).
async function runEncounter(profilesAndFleets, { freezePower = true } = {}) {
  const parts = profilesAndFleets.map((p, i) => ({
    ownerKey: String(i + 1),
    state: L.stateFor(p.profile, i + 1),
    ships: { ...p.fleet },
    initialShips: { ...p.fleet },
  }));
  const startPower = parts.reduce((s, p) => s + (L.combat.combatFleetPowerBase(p.ships) || 1), 0);

  const log = [];
  for (let checksElapsed = 0; checksElapsed < ADMIRAL_TOTAL_CHECKS; checksElapsed++) {
    const currentPower = parts.reduce((s, p) => s + L.combat.combatFleetPowerBase(p.ships), 0);
    const basePower = freezePower ? startPower : currentPower;
    const { multiplier } = L.combat.rollMultiplierWithOutlier(ADMIRAL_MULTIPLIER_ROLL, 'piraten_admiral');
    const escalation = Math.pow(1 + ADMIRAL_ESCALATION_PER_CHECK, checksElapsed);
    const encounter = L.combat.generateAdmiralEncounter(basePower * multiplier * escalation);

    const contributions = parts.map((p) => ({
      ownerKey: p.ownerKey,
      ships: p.ships,
      research: p.state.research,
      playerClass: p.state.playerClass,
      kampfBoostActive: !!p.state.activeBoosters.kampf,
      shipModules: p.state.shipModules,
    }));

    const result = await L.runner.runMultiOwnerCombatInWorker({
      contributions,
      sideBShips: encounter.npcShips,
      sideBStatsOverride: encounter.statsOverride,
      research: parts[0].state.research,
      allowRetreat: true,
    });

    parts.forEach((p) => {
      Object.keys(p.ships).forEach((id) => {
        p.ships[id] = result.survivorsByOwner[p.ownerKey]?.[id] || 0;
      });
    });

    const bossDestroyed = (result.survivorsB[ADMIRAL_BOSS_ID] || 0) <= 0;
    const remaining = parts.reduce((s, p) => s + L.combat.combatFleetPowerBase(p.ships), 0);
    log.push({
      check: checksElapsed + 1,
      multiplier,
      escalation,
      effective: (basePower * multiplier * escalation) / Math.max(currentPower, 1),
      remainingShare: remaining / startPower,
      retreated: !!result.retreated,
      bossDestroyed,
      rounds: result.roundsFought,
    });
    if (bossDestroyed) return { outcome: 'victory', checks: checksElapsed + 1, log };
    if (result.retreated) return { outcome: 'defeat', checks: checksElapsed + 1, log };
  }
  return { outcome: 'maxchecks', checks: ADMIRAL_TOTAL_CHECKS, log };
}

const val = (r) => L.value(r);
const extractionValue = (n) => n <= 0 ? 0 : val({
  metall: ADMIRAL_EXTRACTION_BASE.metall + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.metall * (n - 1),
  kristall: ADMIRAL_EXTRACTION_BASE.kristall + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.kristall * (n - 1),
  deuterium: ADMIRAL_EXTRACTION_BASE.deuterium + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.deuterium * (n - 1),
});

console.log('=== Belohnungstabelle (Wert-Einheiten) ===');
for (let n = 1; n <= 6; n++) console.log(`Abzug nach Check ${n}: ${L.mio(extractionValue(n))}`);
console.log(`Sieg-Praemie: ${L.mio(val(ADMIRAL_VICTORY_BONUS))} + ${L.cc.ADMIRAL_VICTORY_DM} DM`);
console.log();

const SCENARIOS = [
  { name: '1 Spieler voll (gross)', parts: [{ profile: 'voll', fleet: L.FLEET_ADMIRAL }] },
  { name: '2 Spieler voll (gross)', parts: [{ profile: 'voll', fleet: L.FLEET_ADMIRAL }, { profile: 'voll', fleet: L.FLEET_ADMIRAL }] },
  { name: '2 Spieler voll+mittel', parts: [{ profile: 'voll', fleet: L.FLEET_ADMIRAL }, { profile: 'mittel', fleet: L.FLEET_ADMIRAL }] },
  { name: '1 Spieler voll (klein)', parts: [{ profile: 'voll', fleet: L.FLEET_ADMIRAL_SMALL }] },
  { name: '1 Spieler mittel (gross)', parts: [{ profile: 'mittel', fleet: L.FLEET_ADMIRAL }] },
  { name: '1 Spieler voll OHNE Kampf-Boost', parts: [{ profile: 'voll_noboost', fleet: L.FLEET_ADMIRAL }] },
];

const N = Number(process.argv[2] || 20);
console.log(`=== Ergebnis ueber ${N} komplette Begegnungen je Szenario (immer bis Check 6 durchgespielt) ===`);
console.log('Szenario | Sieg% | Rueckzug(=Totalverlust der Beute)% | 6 Checks ohne Sieg% | oCheck bei Rueckzug | oRestflotte nach 6 Checks');

for (const sc of SCENARIOS) {
  let victory = 0, defeat = 0, maxchecks = 0, defeatCheckSum = 0, remainSum = 0, remainN = 0;
  const perCheckDefeat = new Array(7).fill(0);
  const perCheckReached = new Array(7).fill(0);
  const effByCheck = new Array(7).fill(0);
  const effN = new Array(7).fill(0);
  for (let i = 0; i < N; i++) {
    const r = await runEncounter(sc.parts);
    r.log.forEach((e) => { perCheckReached[e.check]++; effByCheck[e.check] += e.effective; effN[e.check]++; });
    if (r.outcome === 'victory') victory++;
    else if (r.outcome === 'defeat') { defeat++; defeatCheckSum += r.checks; perCheckDefeat[r.checks]++; }
    else { maxchecks++; remainSum += r.log[r.log.length - 1].remainingShare; remainN++; }
  }
  console.log([
    sc.name,
    ((victory / N) * 100).toFixed(0),
    ((defeat / N) * 100).toFixed(0),
    ((maxchecks / N) * 100).toFixed(0),
    defeat ? (defeatCheckSum / defeat).toFixed(1) : '-',
    remainN ? L.pct(remainSum / remainN) : '-',
  ].join(' | '));
  console.log('   erreicht je Check: ' + perCheckReached.slice(1).join('/') +
    '   Rueckzug je Check: ' + perCheckDefeat.slice(1).join('/'));
  console.log('   effektive Feindstaerke vs. AKTUELLE Flotte je Check: ' +
    effByCheck.slice(1).map((v, i) => effN[i + 1] ? (v / effN[i + 1]).toFixed(2) : '-').join(' / '));
}
process.exit(0);
