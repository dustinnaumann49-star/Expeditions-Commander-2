// Piratenadmiral (P10): Boss-Skalierung, Eskalationskurve, Extraktions-Oekonomie.
// Rechnet komplette 6-Check-Serien mit ueber die Checks mitgeschleppten Verlusten (Muster aus
// run_elite_series_net.mjs, Session 3) - ein Einzelcheck unterschaetzt die Verluste.
// Aufruf: node run_admiral.mjs [serien_je_zelle]
import { combat, runner, cc, ships, stateFor, value, pct, mio, mrd, FLEET_ADMIRAL, FLEET_ADMIRAL_SMALL } from './lib4.mjs';

const SERIES = Number(process.argv[2] || 4);
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);

const EXTRACTION_BASE = cc.ADMIRAL_EXTRACTION_BASE;
const EXTRACTION_GROWTH = cc.ADMIRAL_EXTRACTION_GROWTH_PER_CHECK;
const VICTORY = cc.ADMIRAL_VICTORY_BONUS;

function extractionValue(checks) {
  if (checks <= 0) return 0;
  return value({
    metall: EXTRACTION_BASE.metall + EXTRACTION_GROWTH.metall * (checks - 1),
    kristall: EXTRACTION_BASE.kristall + EXTRACTION_GROWTH.kristall * (checks - 1),
    deuterium: EXTRACTION_BASE.deuterium + EXTRACTION_GROWTH.deuterium * (checks - 1),
  });
}

console.log('=== 1. Belohnungskurve (fest, unabhaengig von Flottengroesse) ===\n');
for (let c = 1; c <= cc.ADMIRAL_TOTAL_CHECKS; c++) {
  const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c - 1);
  console.log(`  Check ${c}: Feindstaerke-Faktor ${esc.toFixed(2)}x   Extraktion nach ${c} Check(s): ${mrd(extractionValue(c))}`);
}
console.log(`  Sieg-Praemie: ${mrd(value(VICTORY))} + ${cc.ADMIRAL_VICTORY_DM} DM`);
console.log(`  Eskalation ueber 6 Checks: ${Math.pow(1.15, 5).toFixed(2)}x, Belohnung waechst dabei nur ${(extractionValue(6) / extractionValue(1)).toFixed(2)}x\n`);

console.log('=== 2. Boss-Konzentration: wie viel Schaden verpufft im Overkill? ===\n');
for (const [label, fleet] of [['gross', FLEET_ADMIRAL], ['klein', FLEET_ADMIRAL_SMALL]]) {
  const power = combat.combatFleetPowerBase(fleet);
  for (const mult of [1.1, 1.3, 1.5]) {
    const enc = combat.generateAdmiralEncounter(power * mult);
    const bossWaffen = enc.statsOverride[cc.ADMIRAL_BOSS_ID].waffen;
    const bossPanz = enc.statsOverride[cc.ADMIRAL_BOSS_ID].panzerung;
    // teuerstes/zaehestes Ziel in der Flotte als Referenz fuer den Schaden EINES Bossschusses
    const worst = Object.keys(fleet).reduce((a, b) => (byId[b].stats.panzerung > byId[a].stats.panzerung ? b : a));
    const worstHp = byId[worst].stats.panzerung + byId[worst].stats.schild;
    console.log(
      `  Flotte ${label} (${mrd(power)} BasePower), Feindstaerke ${Math.round(mult * 100)}%: Boss Waffen ${mrd(bossWaffen)}, Panzerung ${mrd(bossPanz)}` +
      ` -> ein Schuss trifft ${worst} (${mio(worstHp)} HP), Ueberschuss ${(bossWaffen / worstHp).toFixed(0)}x`
    );
  }
}
console.log('  (Ueberschuss wird nur ueber die Durchschlags-Kaskade weitergereicht, max. 5 Ziele, Anteil = Durchschlag-Forschung.)\n');

console.log('=== 3. Komplette Serien (Verluste werden ueber die Checks mitgeschleppt) ===\n');
console.log('Szenario                     Checks bis Ende  Boss faellt  Flottenverlust  Belohnung  Netto');

async function runSeries(profileName, baseFleet, defeatLossThreshold) {
  const state = stateFor(profileName, 1);
  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  // contributedPower wird beim Start EINGEFROREN (siehe groupOps.ts) - Feindstaerke bleibt also
  // ueber alle Checks an der URSPRUENGLICHEN Flotte haengen, nicht an der aktuellen.
  const frozenPower = combat.combatFleetPowerBase(fleet);
  let checks = 0;
  let bossDown = false;
  let outcome = 'extracted';
  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    const before = fleetValue(fleet);
    if (before <= 0) { outcome = 'wiped'; break; }
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    const enc = combat.generateAdmiralEncounter(frozenPower * mult * esc);
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enc.npcShips,
      sideBStatsOverride: enc.statsOverride,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: true,
      shipModules: state.shipModules,
      allowRetreat: true,
    });
    checks = c + 1;
    const next = {};
    Object.keys(fleet).forEach((id) => { next[id] = r.survivorsA[id] || 0; });
    fleet = next;
    const lostShare = (before - fleetValue(fleet)) / before;
    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) { bossDown = true; outcome = 'victory'; break; }
    // Verlust-Kriterium statt result.retreated (siehe Session-2-Befund 2)
    if (lostShare >= defeatLossThreshold) { outcome = 'defeat'; break; }
  }
  const lostValue = startValue - fleetValue(fleet);
  const reward = outcome === 'victory' ? value(VICTORY) : outcome === 'defeat' || outcome === 'wiped' ? 0 : extractionValue(checks);
  return { checks, bossDown, outcome, lostValue, reward, startValue };
}

// Reale Flotte des Nutzers (Session 3: 34,99 Mrd Wert / 18,58 Mrd BasePower), auf die in P10
// zugelassenen Schiffstypen beschraenkt.
const FLEET_ADMIRAL_REAL = {
  kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500,
  zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30,
};

for (const [label, profile, fleet] of [
  ['voll / reale Flotte', 'voll', FLEET_ADMIRAL_REAL],
  ['voll / grosse Flotte', 'voll', FLEET_ADMIRAL],
  ['voll / kleine Flotte', 'voll', FLEET_ADMIRAL_SMALL],
  ['mittel / grosse Flotte', 'mittel', FLEET_ADMIRAL],
  ['voll ohne Boost / gross', 'voll_noboost', FLEET_ADMIRAL],
]) {
  let cSum = 0, bossSum = 0, lostSum = 0, rewSum = 0, defeats = 0;
  for (let i = 0; i < SERIES; i++) {
    const r = await runSeries(profile, fleet, 0.45);
    cSum += r.checks; bossSum += r.bossDown ? 1 : 0; lostSum += r.lostValue; rewSum += r.reward;
    if (r.outcome === 'defeat' || r.outcome === 'wiped') defeats++;
  }
  const n = SERIES;
  console.log(
    `${label.padEnd(28)} ${(cSum / n).toFixed(1).padStart(13)} ${pct(bossSum / n).padStart(12)} ${mrd(lostSum / n).padStart(15)} ${mrd(rewSum / n).padStart(10)} ${mrd(rewSum / n - lostSum / n).padStart(10)}`
  );
}

console.log('\n=== 4. Vergleich: dieselbe Flotte, aber Belohnung gegen Flottenwert ===\n');
console.log(`  Wert FLEET_ADMIRAL: ${mrd(fleetValue(FLEET_ADMIRAL))}, BasePower ${mrd(combat.combatFleetPowerBase(FLEET_ADMIRAL))}`);
console.log(`  Wert FLEET_ADMIRAL_SMALL: ${mrd(fleetValue(FLEET_ADMIRAL_SMALL))}, BasePower ${mrd(combat.combatFleetPowerBase(FLEET_ADMIRAL_SMALL))}`);
console.log(`  Maximale Extraktion (6 Checks): ${mrd(extractionValue(6))} - entspricht ${pct(extractionValue(6) / fleetValue(FLEET_ADMIRAL))} des grossen Flottenwerts`);
console.log(`  Sieg-Praemie: ${mrd(value(VICTORY))} - entspricht ${pct(value(VICTORY) / fleetValue(FLEET_ADMIRAL))} des grossen Flottenwerts`);
process.exit(0);
