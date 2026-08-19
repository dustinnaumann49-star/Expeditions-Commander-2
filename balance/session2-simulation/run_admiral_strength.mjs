// Piratenadmiral (P10) - Block B, Schritt 5, Messung M1: GEGNERSTAERKE (Entscheidung 4.3).
//
// ANLASS: `ADMIRAL_STAT_SHARE` ist als Hebel unbrauchbar (Messung 15.08.2026) - ein hoeherer
// Boss-Anteil macht den Gegner seit dem Overkill-Deckel SCHWAECHER, und selbst 0,25 endet zu
// 100 % mit einem Sieg in Check 1. Der verbliebene Hebel ist die Gegnerstaerke selbst.
//
// WARUM EIN NEUES SKRIPT: Abschnitt G von `admiral_defeat.txt` misst nur CHECK 1 und kann die
// Ziel-Check-Tiefe 3-5 deshalb nicht beantworten. Die "Eskalierende Wut" (1,15^n) hebt die
// Gegnerstaerke ueber 6 Checks ohnehin um Faktor 2,31 - ein Basisfaktor 2,0x steht in Check 5
// effektiv bei 3,5x, also mitten im dokumentierten Kippbereich. Gemessen werden muss die VOLLE
// Serie unter dem beschlossenen Abbruchkriterium, nicht ein Einzelkampf.
//
// AUFBAU (gegen den Code geprueft, Messregel 16):
//   - Gegnerstaerke je Check = combatFleetPowerBase(ueberlebende Flotte)  [4.2, frisch]
//     * Ziehung aus ADMIRAL_MULTIPLIER_ROLL (1,10/1,30/1,50) * 1,15^n * FAKTOR.
//     Der FAKTOR ist die gesuchte Groesse, heute implizit 1,0.
//   - Niederlage = kumulierter WERT-Anteil gegen die entsandte Flotte >= 0,30  [4.1, beschlossen]
//   - Reihenfolge wie im Spielcode: erst Sieg (Boss tot), dann Niederlage.
//   - Schritte von hoechstens 0,5x (Messkriterium vom 15.08.2026), nicht in Verdopplungen.
//   - Messregel 2: mindestens 40 Serien je Zelle.
//
// LAUFZEIT-KOMPROMISS: die Serie laeuft ueber die Schwelle 0,30 hinaus weiter, bis der kumulierte
// Wertverlust EVAL_MAX (0,60) erreicht ist. Dadurch bleiben 0,30/0,40/0,45 nachtraeglich auf
// DENSELBEN Ziehungen auswertbar (Methode aus run_loot_exponent.mjs), ohne bei hohen Faktoren
// sinnlose Checks weit jenseits jeder Schwelle mitzurechnen.
//
// Beruehrt den Spielcode NICHT (Import nur ueber combat/combatRunner/data, keine Datenbank -
// Abschnitt 1b, V2).
// Aufruf: node run_admiral_strength.mjs [serien_je_zelle] [faktor,faktor,...]
import { combat, runner, cc, ships, stateFor, value, pct, mrd } from './lib4.mjs';

const SERIES = Number(process.argv[2] || 40);
const FACTORS = (process.argv[3] || '1,1.5,2,2.5,3,3.5,4').split(',').map(Number);
const DEFEAT_SHARE = 0.30;   // Entscheidung 4.1, geschlossen am 15.08.2026
const EVAL_MAX = 0.60;       // Weiterlaufen bis hierhin, damit hoehere Schwellen auswertbar bleiben
const EXTRA_THRESHOLDS = [0.30, 0.40, 0.45];
const SALVAGE = 0.30;        // Wrack-Bergung, Session-3-Entscheidung

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const unitPower = (id) => { const s = combat.baseStats(id); return s.waffen + s.schild + s.panzerung; };

// Flotten identisch zu run_admiral_defeat.mjs, damit die Zahlen direkt vergleichbar bleiben.
const FLEETS = {
  real:  { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
};
const CELLS = [
  ['voll', 'real'], ['mittel', 'real'], ['schwach', 'real'],
  ['voll', 'gross'], ['mittel', 'gross'], ['schwach', 'gross'],
];

async function runSeries(profileName, baseFleet, factor) {
  const state = stateFor(profileName, 1);
  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  const checks = [];
  let destroyedPowerCum = 0;

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    if (fleetValue(fleet) <= 0) break;
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * mult * esc * factor);

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

    Object.entries(enc.npcShips).forEach(([id, sent]) => {
      const ov = enc.statsOverride?.[id];
      const per = ov ? ov.waffen + ov.schild + ov.panzerung : unitPower(id);
      destroyedPowerCum += (sent - (r.survivorsB[id] || 0)) * per;
    });

    const next = {};
    Object.keys(fleet).forEach((id) => (next[id] = r.survivorsA[id] || 0));
    fleet = next;

    const lostShareValue = startValue > 0 ? (startValue - fleetValue(fleet)) / startValue : 0;
    checks.push({
      lostShareValue,
      lostValueAbs: startValue - fleetValue(fleet),
      bossDown: (r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0,
      destroyedPower: destroyedPowerCum,
      rounds: r.roundsFought,
    });

    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) break;
    if (lostShareValue >= EVAL_MAX) break;
  }
  return { checks, startValue };
}

// Nachtraegliche Auswertung EINER Serie gegen eine Schwelle. Sieg wird vor Niederlage geprueft.
function evaluate(series, threshold) {
  for (let i = 0; i < series.checks.length; i++) {
    const ch = series.checks[i];
    if (ch.bossDown) return { depth: i + 1, outcome: 'sieg', ...ch };
    if (ch.lostShareValue >= threshold) return { depth: i + 1, outcome: 'niederlage', ...ch };
  }
  const last = series.checks[series.checks.length - 1];
  if (!last) return { depth: 0, outcome: 'niederlage', lostShareValue: 1, lostValueAbs: 0, destroyedPower: 0, rounds: 0, bossDown: false };
  return { depth: series.checks.length, outcome: 'extraktion', ...last };
}

const agg = (rows, fn) => rows.reduce((s, r) => s + fn(r), 0) / rows.length;
const share = (rows, o) => rows.filter((r) => r.outcome === o).length / rows.length;

console.log('=== Piratenadmiral, Schritt 5 / M1: Gegnerstaerke ueber die VOLLE Serie ===');
console.log(`${SERIES} Serien je Zelle, ${FACTORS.length} Faktoren x ${CELLS.length} Zellen.`);
console.log(`Kriterium 4.1: kumulierter WERT-Verlust >= ${DEFEAT_SHARE.toFixed(2)} gegen die entsandte Flotte; contributedPower frisch je Check (4.2).`);
console.log(`Gegner je Check = frische Flottenmacht x [${cc.ADMIRAL_MULTIPLIER_ROLL.join(' / ')}] x ${(1 + cc.ADMIRAL_ESCALATION_PER_CHECK).toFixed(2)}^n x FAKTOR.\n`);

const raw = {};
for (const [profile, fleetName] of CELLS) {
  for (const f of FACTORS) {
    const rows = [];
    for (let i = 0; i < SERIES; i++) rows.push(await runSeries(profile, FLEETS[fleetName], f));
    raw[`${profile}/${fleetName}|${f}`] = rows;
    process.stderr.write(`fertig: ${profile}/${fleetName} ${f}x\n`);
  }
}

console.log('=== A. Check-Tiefe und Ausgang je Faktor, Schwelle 0,30 (Zielwert Tiefe 3-5) ===\n');
console.log('Profil/Flotte      Faktor  Tiefe    Sieg  Niederl.  Extrakt.  Verl.Ende  Verl.C1  Boss lebt n.C1');
for (const [profile, fleetName] of CELLS) {
  for (const f of FACTORS) {
    const series = raw[`${profile}/${fleetName}|${f}`];
    const ev = series.map((s) => evaluate(s, DEFEAT_SHARE));
    const c1Loss = agg(series, (s) => (s.checks[0] ? s.checks[0].lostShareValue : 1));
    const bossAlive = agg(series, (s) => (s.checks[0] && !s.checks[0].bossDown ? 1 : 0));
    console.log(
      `${`${profile}/${fleetName}`.padEnd(18)}${`${f}x`.padStart(6)}`
      + `${agg(ev, (x) => x.depth).toFixed(2).padStart(7)}`
      + `${pct(share(ev, 'sieg')).padStart(8)}${pct(share(ev, 'niederlage')).padStart(10)}${pct(share(ev, 'extraktion')).padStart(10)}`
      + `${pct(agg(ev, (x) => x.lostShareValue)).padStart(11)}${pct(c1Loss).padStart(9)}${pct(bossAlive).padStart(16)}`
    );
  }
  console.log('');
}

console.log('=== B. Empfindlichkeit gegen die Schwelle (dieselben Ziehungen) ===\n');
console.log('Profil/Flotte      Faktor' + EXTRA_THRESHOLDS.map((t) => `  Tiefe T=${t.toFixed(2)}`).join('') + EXTRA_THRESHOLDS.map((t) => `  Verl. T=${t.toFixed(2)}`).join(''));
for (const [profile, fleetName] of CELLS) {
  for (const f of FACTORS) {
    const series = raw[`${profile}/${fleetName}|${f}`];
    const evs = EXTRA_THRESHOLDS.map((t) => series.map((s) => evaluate(s, t)));
    console.log(
      `${`${profile}/${fleetName}`.padEnd(18)}${`${f}x`.padStart(6)}`
      + evs.map((ev) => agg(ev, (x) => x.depth).toFixed(2).padStart(13)).join('')
      + evs.map((ev) => pct(agg(ev, (x) => x.lostShareValue)).padStart(13)).join('')
    );
  }
  console.log('');
}

console.log('=== C. Ertragsseite je Faktor, Schwelle 0,30 - Rohwerte fuer 4.5 bis 4.8 ===\n');
console.log('Profil/Flotte      Faktor  vernicht. Feindmacht  Verlust brutto  netto n. 30% Bergung  Rundendeckel');
for (const [profile, fleetName] of CELLS) {
  for (const f of FACTORS) {
    const ev = raw[`${profile}/${fleetName}|${f}`].map((s) => evaluate(s, DEFEAT_SHARE));
    console.log(
      `${`${profile}/${fleetName}`.padEnd(18)}${`${f}x`.padStart(6)}`
      + `${mrd(agg(ev, (x) => x.destroyedPower)).padStart(22)}`
      + `${mrd(agg(ev, (x) => x.lostValueAbs)).padStart(16)}`
      + `${mrd(agg(ev, (x) => x.lostValueAbs * (1 - SALVAGE))).padStart(22)}`
      + `${pct(agg(ev, (x) => (x.rounds >= 100 ? 1 : 0))).padStart(14)}`
    );
  }
  console.log('');
}
process.exit(0);
