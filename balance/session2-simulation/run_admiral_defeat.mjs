// Piratenadmiral (P10) - Entscheidung 4.1 + 4.2 (Block B, Schritt 4).
//
// 4.1: Das heutige Niederlage-Kriterium `result.retreated` bedeutet seit dem gestaffelten
//      Einzelschiff-Rueckzug (UNIT_RETREAT_THRESHOLD = 0,3) nur noch "mindestens ein Schiff hat
//      sich abgesetzt" - siehe Messregel 9. Ersatz: Anteil tatsaechlich verlorener Flotte.
// 4.2: `contributedPower` wird in groupOps.ts beim Start EINGEFROREN; der Gegner skaliert ab
//      Check 2 gegen die Startflotte statt gegen die ueberlebende. Der Elite-Bollwerk-Pfad macht
//      es richtig (combatFleetPowerBase(p.ships) frisch je Check).
//
// METHODE (analog run_loot_exponent.mjs): Die Serien laufen OHNE Abbruch ueber alle 6 Checks
// durch; je Check wird die kumulierte Verlustquote protokolliert. Alle Schwellen werden danach
// auf DENSELBEN Zufallsziehungen nachtraeglich ausgewertet. Ein Abbruch beendet die Serie nur,
// er veraendert frueher liegende Checks nicht - das Ergebnis ist deshalb exakt identisch zu
// einem echten Abbruch-Lauf, spart aber ~80 % Laufzeit und macht die Schwellen exakt
// vergleichbar (gleiche Ziehungen).
//
// Die Reihenfolge des Spielcodes bleibt erhalten: erst Boss tot (Sieg), DANN Niederlage-Pruefung.
//
// Beruehrt den Spielcode NICHT. Import laeuft nur ueber combat/combatRunner/data, nicht ueber
// actions.js/state.js - die produktive Datenbank wird also nicht geoeffnet (Abschnitt 1b, V2).
//
// Aufruf: node run_admiral_defeat.mjs [serien_je_zelle]   (Messregel 2: mindestens 40)
import { combat, runner, cc, ships, stateFor, value, pct, mrd } from './lib4.mjs';

const SERIES = Number(process.argv[2] || 40);

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const fleetCount = (f) => Object.values(f).reduce((s, n) => s + n, 0);
const unitPower = (id) => { const s = combat.baseStats(id); return s.waffen + s.schild + s.panzerung; };

// Nur Kreuzer-Klasse und groesser (ADMIRAL_ALLOWED_SHIP_IDS). Stueckzahlen der Spezialschiffe
// entsprechen ihrem maxCount im Code (Imperator 6, Salvenkreuzer 90, Salvendreadnought 30).
const FLEETS = {
  real:  { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
};

const PROFILE_LIST = ['voll', 'voll_noboost', 'mittel', 'schwach'];
const MODES = ['eingefroren', 'frisch'];
const THRESHOLDS = [0.30, 0.40, 0.45, 0.55, 0.60];

// Eine komplette Serie ueber bis zu ADMIRAL_TOTAL_CHECKS Checks, OHNE Niederlage-Abbruch.
async function runSeries(profileName, baseFleet, mode) {
  const state = stateFor(profileName, 1);
  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  const startCount = fleetCount(fleet);
  const frozenPower = combat.combatFleetPowerBase(fleet);

  const checks = []; // je Check: { lostShareValue, lostShareCount, retreated, bossDown, destroyedPower, rounds }
  let destroyedPowerCum = 0;

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    if (fleetValue(fleet) <= 0) break;

    // Feindstaerke: 110-150 % der eingesetzten Macht, plus "Eskalierende Wut" 1,15^n.
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    // 4.2: eingefroren = heutiger Code, frisch = wie der Elite-Bollwerk-Pfad
    const basePower = mode === 'eingefroren' ? frozenPower : combat.combatFleetPowerBase(fleet);
    const enc = combat.generateAdmiralEncounter(basePower * mult * esc);

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

    // vernichtete Feindmacht dieses Checks (Basiswerte, konsistent zu combatFleetPowerBase)
    Object.entries(enc.npcShips).forEach(([id, sent]) => {
      const survived = r.survivorsB[id] || 0;
      const ov = enc.statsOverride?.[id];
      const per = ov ? ov.waffen + ov.schild + ov.panzerung : unitPower(id);
      destroyedPowerCum += (sent - survived) * per;
    });

    const next = {};
    Object.keys(fleet).forEach((id) => (next[id] = r.survivorsA[id] || 0));
    fleet = next;

    checks.push({
      lostShareValue: startValue > 0 ? (startValue - fleetValue(fleet)) / startValue : 0,
      lostShareCount: startCount > 0 ? (startCount - fleetCount(fleet)) / startCount : 0,
      retreated: !!r.retreated,
      bossDown: (r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0,
      destroyedPower: destroyedPowerCum,
      rounds: r.roundsFought,
    });

    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) break;
  }

  return { checks, startValue, startCount };
}

// Nachtraegliche Auswertung EINER Serie gegen ein Kriterium.
// metric: 'value' | 'count' | 'retreated', kumulativ gegen die entsandte Flotte.
function evaluate(series, metric, threshold) {
  for (let i = 0; i < series.checks.length; i++) {
    const ch = series.checks[i];
    // Reihenfolge wie im Spielcode: Sieg wird VOR der Niederlage geprueft.
    if (ch.bossDown) return { depth: i + 1, outcome: 'sieg', destroyed: ch.destroyedPower, lost: ch.lostShareValue };
    const hit = metric === 'retreated' ? ch.retreated : (metric === 'value' ? ch.lostShareValue : ch.lostShareCount) >= threshold;
    if (hit) return { depth: i + 1, outcome: 'niederlage', destroyed: ch.destroyedPower, lost: ch.lostShareValue };
  }
  const last = series.checks[series.checks.length - 1];
  return {
    depth: series.checks.length,
    outcome: series.checks.length === 0 ? 'niederlage' : 'extraktion',
    destroyed: last ? last.destroyedPower : 0,
    lost: last ? last.lostShareValue : 1,
  };
}

function agg(rows, fn) { return rows.reduce((s, r) => s + fn(r), 0) / rows.length; }

// ===== Messlauf =====
console.log('=== Piratenadmiral: Entscheidung 4.1 (Verlust-Kriterium) + 4.2 (contributedPower) ===');
console.log(`${SERIES} Serien je Zelle, 2 Modi x 4 Ausbau-Profile x 2 Flotten = 16 Zellen.`);
console.log('Serien laufen ohne Abbruch durch, alle Schwellen werden nachtraeglich aufgerechnet.\n');
console.log(`Flottenwerte: real ${mrd(fleetValue(FLEETS.real))} / ${fleetCount(FLEETS.real)} Schiffe,`
  + ` gross ${mrd(fleetValue(FLEETS.gross))} / ${fleetCount(FLEETS.gross)} Schiffe`);
console.log(`BasePower:    real ${mrd(combat.combatFleetPowerBase(FLEETS.real))}, gross ${mrd(combat.combatFleetPowerBase(FLEETS.gross))}\n`);

const store = {}; // key "mode|profile|fleet" -> Serien
for (const mode of MODES) {
  for (const profile of PROFILE_LIST) {
    for (const fleetName of ['real', 'gross']) {
      const rows = [];
      for (let i = 0; i < SERIES; i++) rows.push(await runSeries(profile, FLEETS[fleetName], mode));
      store[`${mode}|${profile}|${fleetName}`] = rows;
      process.stderr.write(`  fertig: ${mode} / ${profile} / ${fleetName}\n`);
    }
  }
}

// ---------- A. Ist-Zustand: taugt result.retreated als Niederlage-Kriterium? ----------
console.log('=== A. Ist-Zustand: das heutige Kriterium `result.retreated` ===\n');
console.log('Modus/Profil/Flotte             retreated in Check 1  davon Boss tot  Check-Tiefe heute  Sieg');
for (const mode of MODES) {
  for (const profile of PROFILE_LIST) {
    for (const fleetName of ['real', 'gross']) {
      const rows = store[`${mode}|${profile}|${fleetName}`];
      const c1 = rows.map((r) => r.checks[0]).filter(Boolean);
      const retr = c1.filter((c) => c.retreated).length / (c1.length || 1);
      const both = c1.filter((c) => c.retreated && c.bossDown).length / (c1.length || 1);
      const ev = rows.map((r) => evaluate(r, 'retreated', 0));
      console.log(
        `${`${mode}/${profile}/${fleetName}`.padEnd(32)}${pct(retr).padStart(20)}${pct(both).padStart(16)}`
        + `${agg(ev, (e) => e.depth).toFixed(2).padStart(19)}${pct(ev.filter((e) => e.outcome === 'sieg').length / ev.length).padStart(6)}`
      );
    }
  }
}
console.log('\n  "retreated in Check 1" = Anteil der Serien, in denen das Flag schon im ERSTEN Kampf gesetzt war.');
console.log('  "davon Boss tot" = davon der Anteil, in dem gleichzeitig der Boss vernichtet wurde -');
console.log('  also gewonnene Kaempfe, die der heutige Code als Niederlage wertet.\n');

// ---------- B. Verlust-Trajektorie ----------
console.log('=== B. Kumulierte Verlustquote je Check (gegen die entsandte Flotte) ===\n');
console.log('Modus/Profil/Flotte              Mass    C1     C2     C3     C4     C5     C6');
for (const mode of MODES) {
  for (const profile of PROFILE_LIST) {
    for (const fleetName of ['real', 'gross']) {
      const rows = store[`${mode}|${profile}|${fleetName}`];
      for (const metric of ['value', 'count']) {
        const cells = [];
        for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
          // nur Serien, die diesen Check ueberhaupt erreicht haben (Sieg beendet frueher)
          const have = rows.map((r) => r.checks[c]).filter(Boolean);
          cells.push(have.length ? pct(agg(have, (h) => (metric === 'value' ? h.lostShareValue : h.lostShareCount))) : '-');
        }
        console.log(
          `${`${mode}/${profile}/${fleetName}`.padEnd(32)}${(metric === 'value' ? 'Wert' : 'Stueck').padEnd(7)}`
          + cells.map((x) => x.padStart(6)).join(' ')
        );
      }
    }
  }
}
console.log('\n  Leere Zellen: alle Serien waren vorher durch einen Sieg beendet.\n');

// ---------- C. Schwellen-Sweep ----------
console.log('=== C. Schwellen-Sweep: welche Schwelle trifft die Ziel-Check-Tiefe 3-5? ===\n');
for (const metric of ['value', 'count']) {
  console.log(`--- Verlustmass: ${metric === 'value' ? 'WERT-Anteil' : 'STUECKZAHL-Anteil'} (kumulativ) ---`);
  console.log('Modus/Profil/Flotte             ' + THRESHOLDS.map((t) => `T=${t.toFixed(2)}`).map((x) => x.padStart(9)).join(''));
  for (const mode of MODES) {
    for (const profile of PROFILE_LIST) {
      for (const fleetName of ['real', 'gross']) {
        const rows = store[`${mode}|${profile}|${fleetName}`];
        const cells = THRESHOLDS.map((t) => {
          const ev = rows.map((r) => evaluate(r, metric, t));
          return agg(ev, (e) => e.depth).toFixed(2);
        });
        console.log(`${`${mode}/${profile}/${fleetName}`.padEnd(32)}` + cells.map((x) => x.padStart(9)).join(''));
      }
    }
  }
  console.log('');
}

// ---------- D. Ausgangsverteilung bei der Vorzugs-Schwelle ----------
console.log('=== D. Ausgangsverteilung je Schwelle (Verlustmass WERT, Modus frisch) ===\n');
console.log('Profil/Flotte          Schwelle  Tiefe   Sieg  Niederlage  Extraktion  Verlust bei Ende  vernicht. Feindmacht');
for (const profile of PROFILE_LIST) {
  for (const fleetName of ['real', 'gross']) {
    for (const t of THRESHOLDS) {
      const rows = store[`frisch|${profile}|${fleetName}`];
      const ev = rows.map((r) => evaluate(r, 'value', t));
      console.log(
        `${`${profile}/${fleetName}`.padEnd(22)}${t.toFixed(2).padStart(9)}${agg(ev, (e) => e.depth).toFixed(2).padStart(7)}`
        + `${pct(ev.filter((e) => e.outcome === 'sieg').length / ev.length).padStart(7)}`
        + `${pct(ev.filter((e) => e.outcome === 'niederlage').length / ev.length).padStart(12)}`
        + `${pct(ev.filter((e) => e.outcome === 'extraktion').length / ev.length).padStart(12)}`
        + `${pct(agg(ev, (e) => e.lost)).padStart(18)}`
        + `${mrd(agg(ev, (e) => e.destroyed)).padStart(22)}`
      );
    }
  }
}

// ---------- E. Wirkung von 4.2 isoliert ----------
console.log('\n=== E. Wirkung von 4.2 isoliert (eingefroren gegen frisch, Schwelle 0,45 auf Wert) ===\n');
console.log('Profil/Flotte           Tiefe eingefr.  Tiefe frisch  Verlust eingefr.  Verlust frisch  Sieg eingefr.  Sieg frisch');
for (const profile of PROFILE_LIST) {
  for (const fleetName of ['real', 'gross']) {
    const a = store[`eingefroren|${profile}|${fleetName}`].map((r) => evaluate(r, 'value', 0.45));
    const b = store[`frisch|${profile}|${fleetName}`].map((r) => evaluate(r, 'value', 0.45));
    console.log(
      `${`${profile}/${fleetName}`.padEnd(23)}${agg(a, (e) => e.depth).toFixed(2).padStart(15)}${agg(b, (e) => e.depth).toFixed(2).padStart(14)}`
      + `${pct(agg(a, (e) => e.lost)).padStart(18)}${pct(agg(b, (e) => e.lost)).padStart(16)}`
      + `${pct(a.filter((e) => e.outcome === 'sieg').length / a.length).padStart(15)}${pct(b.filter((e) => e.outcome === 'sieg').length / b.length).padStart(13)}`
    );
  }
}

// ---------- F. Feindmacht je Serie (Vorarbeit fuer 4.5, hier NICHT entschieden) ----------
console.log('\n=== F. Vernichtete Feindmacht je Serie - Rohwert fuer Entscheidung 4.5 (K) ===\n');
console.log('(Modus frisch, Schwelle 0,45 auf Wert. Bezug: Elite-Bollwerk ~56,9 Mrd/Tag im spaeten Ausbaustand.)\n');
console.log('Profil/Flotte           vernicht. Feindmacht  Flottenverlust brutto  netto nach 30% Bergung');
for (const profile of PROFILE_LIST) {
  for (const fleetName of ['real', 'gross']) {
    const rows = store[`frisch|${profile}|${fleetName}`];
    const ev = rows.map((r) => evaluate(r, 'value', 0.45));
    const startValue = fleetValue(FLEETS[fleetName]);
    const lostAbs = agg(ev, (e) => e.lost) * startValue;
    console.log(
      `${`${profile}/${fleetName}`.padEnd(23)}${mrd(agg(ev, (e) => e.destroyed)).padStart(21)}`
      + `${mrd(lostAbs).padStart(23)}${mrd(lostAbs * 0.7).padStart(24)}`
    );
  }
}

// ---------- G. Orientierung fuer Schritt 5: ab welcher Gegnerstaerke ueberlebt der Boss Check 1? ----------
// KEINE Entscheidung dieses Schritts. Nur die Frage, welche Groessenordnung Schritt 5 (4.3/4.4)
// braucht, nachdem sich gezeigt hat, dass 4.1/4.2 die Check-Tiefe nicht bewegen koennen.
// Der Faktor liegt ZUSAETZLICH auf ADMIRAL_MULTIPLIER_ROLL (110-150 %), Boss-Anteil 0,55 (Code-Wert).
console.log('\n=== G. Orientierung fuer Schritt 5: ab welcher Gegnerstaerke ueberlebt der Boss Check 1? ===\n');
console.log('(Zusatzfaktor auf die heutigen 110-150 %, Boss-Anteil 0,55, nur Check 1, keine Entscheidung dieses Schritts)\n');
console.log('Profil/Flotte        Faktor  Boss ueberlebt Check 1  Flottenverlust in Check 1');
const G_SERIES = Math.max(20, Math.round(SERIES / 2));
for (const [profile, fleetName] of [['voll', 'real'], ['mittel', 'real'], ['voll', 'gross']]) {
  for (const f of [1, 2, 4, 8, 16]) {
    const state = stateFor(profile, 1);
    const fleet = FLEETS[fleetName];
    const startValue = fleetValue(fleet);
    let survived = 0, lost = 0;
    for (let i = 0; i < G_SERIES; i++) {
      const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
      const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * mult * f);
      const r = await runner.runCombatInWorker({
        sideAShips: fleet,
        sideBShips: enc.npcShips,
        sideBStatsOverride: enc.statsOverride,
        research: state.research,
        playerClass: state.playerClass,
        kampfBoostActive: profile !== 'voll_noboost',
        shipModules: state.shipModules,
        allowRetreat: true,
      });
      if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) > 0) survived++;
      const rest = {};
      Object.keys(fleet).forEach((id) => (rest[id] = r.survivorsA[id] || 0));
      lost += (startValue - fleetValue(rest)) / startValue;
    }
    console.log(
      `${`${profile}/${fleetName}`.padEnd(21)}${`${f}x`.padStart(6)}${pct(survived / G_SERIES).padStart(24)}${pct(lost / G_SERIES).padStart(26)}`
    );
  }
}

process.exit(0);
