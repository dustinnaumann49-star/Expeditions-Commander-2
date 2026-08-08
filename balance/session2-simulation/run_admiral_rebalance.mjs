// Piratenadmiral - Grundlage fuer die Neubalancierung (Session 4, Nachtrag).
// Rechnet gegen die BESCHLOSSENE Oekonomie aus Session-3-Befund 2:
//   - Wrack-Bergung 30 % des Wertes eigener verlorener Schiffe
//   - Belohnung proportional zur tatsaechlich vernichteten Feindmacht
// Session-2-Befund 2 ist als behoben angenommen (Verlust-Kriterium statt result.retreated).
// Aufruf: node run_admiral_rebalance.mjs [serien_je_zelle]
import { combat, runner, cc, ships, stateFor, value, pct, mrd } from './lib4.mjs';

const SERIES = Number(process.argv[2] || 6);
const SALVAGE = 0.30; // Session-3-Entscheidung 3
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const unitPower = (id) => { const s = combat.baseStats(id); return s.waffen + s.schild + s.panzerung; };

const ESCORT_POOL = ['schlachtschiff', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
const ESCORT_WEIGHTS = ESCORT_POOL.map((_, i) => 1 / (ESCORT_POOL.length - i)); // 'elitekader'
const STAT_RATIO = { waffen: 0.14, schild: 0.05, panzerung: 0.81 };

// Nachbau von generateAdmiralEncounter() mit konfigurierbarem Boss-Anteil.
function encounterFor(totalTargetPower, statShare) {
  const adminPower = totalTargetPower * statShare;
  const escort = combat.generateCappedFleet(totalTargetPower * (1 - statShare), ESCORT_POOL, ESCORT_WEIGHTS);
  const adminStats = {
    waffen: adminPower * STAT_RATIO.waffen,
    schild: adminPower * STAT_RATIO.schild,
    panzerung: adminPower * STAT_RATIO.panzerung,
  };
  return { npcShips: { [cc.ADMIRAL_BOSS_ID]: 1, ...escort }, statsOverride: { [cc.ADMIRAL_BOSS_ID]: adminStats }, adminPower };
}

const FLEETS = {
  klein: { kreuzer: 120, schlachtschiff: 60, schlachtkreuzer: 40, zerstoerer: 25, reaper: 15 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
  real: { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
};

async function runSeries(profileName, baseFleet, statShare, defeatThreshold) {
  const state = stateFor(profileName, 1);
  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  const frozenPower = combat.combatFleetPowerBase(fleet); // wird beim Start eingefroren (groupOps.ts)
  let checks = 0, destroyedPower = 0, outcome = 'extracted';

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    const before = fleetValue(fleet);
    if (before <= 0) { outcome = 'wiped'; break; }
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    const enc = encounterFor(frozenPower * mult * esc, statShare);
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enc.npcShips,
      sideBStatsOverride: enc.statsOverride,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: profileName !== 'voll_noboost',
      shipModules: state.shipModules,
      allowRetreat: true,
    });
    checks = c + 1;

    // vernichtete Feindmacht dieses Checks (Basiswerte, konsistent zu combatFleetPowerBase)
    Object.entries(enc.npcShips).forEach(([id, sent]) => {
      const survived = r.survivorsB[id] || 0;
      const per = id === cc.ADMIRAL_BOSS_ID ? enc.adminPower : unitPower(id);
      destroyedPower += (sent - survived) * per;
    });

    const next = {};
    Object.keys(fleet).forEach((id) => (next[id] = r.survivorsA[id] || 0));
    fleet = next;
    const lostShare = (before - fleetValue(fleet)) / before;

    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) { outcome = 'victory'; break; }
    if (lostShare >= defeatThreshold) { outcome = 'defeat'; break; }
  }

  const lostValue = startValue - fleetValue(fleet);
  return { checks, outcome, lostValue, netLoss: lostValue * (1 - SALVAGE), destroyedPower, startValue, frozenPower };
}

console.log(`=== A. Boss-Anteil (ADMIRAL_STAT_SHARE): wie stark aendert sich der Ausgang? ===`);
console.log(`(Verlust-Kriterium 45 % Wertverlust je Check, Profil voll, ${SERIES} Serien je Zelle)\n`);
console.log('Flotte  Anteil  Checks  Sieg   Verlust brutto  Verlust netto(-30%)  vernichtete Feindmacht');
const results = {};
for (const fleetName of ['gross', 'real']) {
  for (const share of [0.55, 0.35, 0.25]) {
    let c = 0, v = 0, lb = 0, ln = 0, dp = 0;
    for (let i = 0; i < SERIES; i++) {
      const r = await runSeries('voll', FLEETS[fleetName], share, 0.45);
      c += r.checks; v += r.outcome === 'victory' ? 1 : 0; lb += r.lostValue; ln += r.netLoss; dp += r.destroyedPower;
    }
    const n = SERIES;
    results[`${fleetName}:${share}`] = { checks: c / n, win: v / n, lostNet: ln / n, destroyed: dp / n };
    console.log(
      `${fleetName.padEnd(7)} ${String(share).padStart(5)} ${(c / n).toFixed(1).padStart(7)} ${pct(v / n).padStart(6)} ${mrd(lb / n).padStart(15)} ${mrd(ln / n).padStart(20)} ${mrd(dp / n).padStart(23)}`
    );
  }
}

console.log(`\n=== B. Machtproportionale Belohnung: welcher Koeffizient trifft welches Ziel? ===\n`);
console.log('Bezugsgroessen: Elite-Bollwerk-Serie 32,60 Mrd (24h), Raid-Tag 6,31 Mrd, Tagesbaseline 21,69 Mrd.');
console.log('Belohnung = vernichtete Feindmacht x K (Wert-Einheiten je Machtpunkt).\n');
console.log('Flotte  Anteil  vernichtete Macht  Netto-Verlust  K fuer Netto=0  K fuer Netto=+50% Verlust');
for (const [key, r] of Object.entries(results)) {
  const kBreakEven = r.destroyed > 0 ? r.lostNet / r.destroyed : 0;
  const kProfit = r.destroyed > 0 ? (r.lostNet * 1.5) / r.destroyed : 0;
  const [f, s] = key.split(':');
  console.log(`${f.padEnd(7)} ${s.padStart(5)} ${mrd(r.destroyed).padStart(18)} ${mrd(r.lostNet).padStart(14)} ${kBreakEven.toFixed(3).padStart(15)} ${kProfit.toFixed(3).padStart(26)}`);
}

console.log(`\n=== C. Gegenprobe: was liefert ein fester Koeffizient ueber alle Flottengroessen? ===\n`);
for (const K of [0.5, 1.0, 1.5, 2.0]) {
  const row = Object.entries(results).map(([key, r]) => {
    const reward = r.destroyed * K;
    return `${key}: ${mrd(reward - r.lostNet)}`;
  });
  console.log(`  K = ${K.toFixed(1).padStart(4)}  Netto -> ${row.join('   ')}`);
}

console.log(`\n=== D. Boss-RapidFire laeuft ins Leere ===\n`);
console.log(`  RAPIDFIRE.piratenadmiral: ${JSON.stringify(cc.RAPIDFIRE.piratenadmiral)}`);
console.log(`  ADMIRAL_ALLOWED_SHIP_IDS: ${cc.ADMIRAL_ALLOWED_SHIP_IDS.join(', ')}`);
const rfTargets = Object.keys(cc.RAPIDFIRE.piratenadmiral || {});
const usable = rfTargets.filter((t) => cc.ADMIRAL_ALLOWED_SHIP_IDS.includes(t));
console.log(`  -> im Sektor tatsaechlich erreichbare RapidFire-Ziele: ${usable.length ? usable.join(', ') : 'KEINE'}`);
console.log(`  -> Boss ist auch nicht in MULTI_TARGET_VOLLEY_SHIPS: ${JSON.stringify(cc.MULTI_TARGET_VOLLEY_SHIPS)}`);
process.exit(0);
