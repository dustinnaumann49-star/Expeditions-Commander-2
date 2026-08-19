// Piratenadmiral - Grundlage fuer die Neubalancierung (Session 4, Nachtrag).
// Rechnet gegen die BESCHLOSSENE Oekonomie aus Session-3-Befund 2:
//   - Wrack-Bergung 30 % des Wertes eigener verlorener Schiffe
//   - Belohnung proportional zur tatsaechlich vernichteten Feindmacht
//
// UMGEBAUT am 15.08.2026 (Block B, Schritt 4 - Entscheidung 4.1 + 4.2):
//   - laeuft jetzt ueber ALLE VIER Ausbau-Profile (voll / voll_noboost / mittel / schwach)
//     statt nur ueber `voll`. Die alte Fassung mass nur `voll` und konnte deshalb nicht sehen,
//     dass die Verlust-Schwelle bei schwachem Ausbau ein voellig anderes Verhalten zeigt.
//   - Niederlage-Kriterium ist jetzt der KUMULIERTE Wertverlust gegen die entsandte Flotte
//     (Entscheidung 4.1), nicht mehr der Verlust je Einzel-Check. Reihenfolge wie im Spielcode:
//     erst Sieg pruefen, dann Niederlage.
//   - `contributedPower` wird NICHT mehr eingefroren, sondern je Check frisch aus der
//     ueberlebenden Flotte berechnet (Entscheidung 4.2, Vorlage: Elite-Bollwerk-Pfad).
//   - Der Boss-Anteil-Sweep ist nach OBEN erweitert (0,75 / 0,90). Grund: seit dem
//     Overkill-Deckel vom 10.08.2026 ueberlebt der Boss den ersten Check bei jedem realistischen
//     Ausbaustand nicht mehr - die Frage lautet nicht mehr "wie weit senken", sondern
//     "reicht selbst 0,55 noch".
//
// Beruehrt den Spielcode NICHT.
// Aufruf: node run_admiral_rebalance.mjs [serien_je_zelle]   (Messregel 2: mindestens 40)
import { combat, runner, cc, ships, stateFor, value, pct, mrd } from './lib4.mjs';

const SERIES = Number(process.argv[2] || 40);
const SALVAGE = 0.30; // Session-3-Entscheidung 3
const DEFEAT_SHARE = 0.45; // Entscheidung 4.1, kumuliert gegen die entsandte Flotte
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

const PROFILE_LIST = ['voll', 'voll_noboost', 'mittel', 'schwach'];
const SHARES = [0.25, 0.35, 0.55, 0.75, 0.90];

async function runSeries(profileName, baseFleet, statShare, defeatShare) {
  const state = stateFor(profileName, 1);
  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  let checks = 0, destroyedPower = 0, outcome = 'extracted';

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    if (fleetValue(fleet) <= 0) { outcome = 'wiped'; break; }
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    // Entscheidung 4.2: frisch je Check aus der ueberlebenden Flotte, nicht eingefroren.
    const basePower = combat.combatFleetPowerBase(fleet);
    const enc = encounterFor(basePower * mult * esc, statShare);
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enc.npcShips,
      sideBStatsOverride: enc.statsOverride,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: profileName !== 'voll_noboost',
      shipModules: state.shipModules,
      retreatMode: 'all',
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

    // Reihenfolge wie im Spielcode: Sieg VOR Niederlage.
    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) { outcome = 'victory'; break; }
    // Entscheidung 4.1: kumulierter Wertverlust gegen die ENTSANDTE Flotte.
    if ((startValue - fleetValue(fleet)) / startValue >= defeatShare) { outcome = 'defeat'; break; }
  }

  const lostValue = startValue - fleetValue(fleet);
  return { checks, outcome, lostValue, netLoss: lostValue * (1 - SALVAGE), destroyedPower, startValue };
}

console.log(`=== A. Boss-Anteil (ADMIRAL_STAT_SHARE) ueber alle vier Ausbau-Profile ===`);
console.log(`(Niederlage = ${Math.round(DEFEAT_SHARE * 100)} % kumulierter Wertverlust, contributedPower frisch je Check, ${SERIES} Serien je Zelle)`);
console.log(`(Heutiger Code-Wert: ADMIRAL_STAT_SHARE = 0,55. Ziel-Check-Tiefe laut Plan: 3-5.)\n`);
console.log('Profil          Flotte  Anteil  Checks   Sieg  Verlust brutto  Verlust netto(-30%)  vernichtete Feindmacht');
const results = {};
for (const profile of PROFILE_LIST) {
  for (const fleetName of ['gross', 'real']) {
    for (const share of SHARES) {
      let c = 0, v = 0, lb = 0, ln = 0, dp = 0;
      for (let i = 0; i < SERIES; i++) {
        const r = await runSeries(profile, FLEETS[fleetName], share, DEFEAT_SHARE);
        c += r.checks; v += r.outcome === 'victory' ? 1 : 0; lb += r.lostValue; ln += r.netLoss; dp += r.destroyedPower;
      }
      const n = SERIES;
      results[`${profile}:${fleetName}:${share}`] = { checks: c / n, win: v / n, lostNet: ln / n, destroyed: dp / n };
      console.log(
        `${profile.padEnd(15)} ${fleetName.padEnd(6)} ${String(share).padStart(5)} ${(c / n).toFixed(2).padStart(7)} ${pct(v / n).padStart(6)}`
        + ` ${mrd(lb / n).padStart(15)} ${mrd(ln / n).padStart(20)} ${mrd(dp / n).padStart(23)}`
      );
    }
    process.stderr.write(`  fertig: ${profile} / ${fleetName}\n`);
  }
}

console.log(`\n=== B. Machtproportionale Belohnung: welcher Koeffizient trifft welches Ziel? ===\n`);
console.log('Bezugsgroessen NEU (Stand 15.08.2026, Block A abgeschlossen): Tageseinnahmen 0,80 / 19,82 / 76,85 Mrd');
console.log('fuer den fruehen / mittleren / spaeten Ausbaustand; davon Elite-Bollwerk ~56,9 Mrd/Tag im spaeten Stand.');
console.log('Die alte Baseline 21,69 Mrd/Tag gilt NICHT mehr.');
console.log('Belohnung = vernichtete Feindmacht x K (Wert-Einheiten je Machtpunkt).\n');
console.log('Profil          Flotte  Anteil  vernicht. Macht  Netto-Verlust  K fuer Netto=0  K fuer Netto=+50%');
for (const [key, r] of Object.entries(results)) {
  const [p, f, s] = key.split(':');
  const kBreakEven = r.destroyed > 0 ? r.lostNet / r.destroyed : 0;
  const kProfit = r.destroyed > 0 ? (r.lostNet * 1.5) / r.destroyed : 0;
  console.log(
    `${p.padEnd(15)} ${f.padEnd(6)} ${s.padStart(5)} ${mrd(r.destroyed).padStart(16)} ${mrd(r.lostNet).padStart(14)}`
    + ` ${kBreakEven.toFixed(4).padStart(15)} ${kProfit.toFixed(4).padStart(18)}`
  );
}

console.log(`\n=== C. Gegenprobe: was liefert ein fester Koeffizient? (Anteil 0,55 = heutiger Code) ===\n`);
for (const K of [0.1, 0.25, 0.5, 1.0]) {
  const row = Object.entries(results)
    .filter(([key]) => key.endsWith(':0.55'))
    .map(([key, r]) => `${key.replace(':0.55', '')}: ${mrd(r.destroyed * K - r.lostNet)}`);
  console.log(`  K = ${K.toFixed(2).padStart(5)}  Netto je Durchlauf -> ${row.join('  ')}`);
}

console.log(`\n=== D. Boss-RapidFire laeuft ins Leere ===\n`);
console.log(`  RAPIDFIRE.piratenadmiral: ${JSON.stringify(cc.RAPIDFIRE.piratenadmiral)}`);
console.log(`  ADMIRAL_ALLOWED_SHIP_IDS: ${cc.ADMIRAL_ALLOWED_SHIP_IDS.join(', ')}`);
const rfTargets = Object.keys(cc.RAPIDFIRE.piratenadmiral || {});
const usable = rfTargets.filter((t) => cc.ADMIRAL_ALLOWED_SHIP_IDS.includes(t));
console.log(`  -> im Sektor tatsaechlich erreichbare RapidFire-Ziele: ${usable.length ? usable.join(', ') : 'KEINE'}`);
console.log(`  -> Boss ist auch nicht in MULTI_TARGET_VOLLEY_SHIPS: ${JSON.stringify(cc.MULTI_TARGET_VOLLEY_SHIPS)}`);
process.exit(0);
