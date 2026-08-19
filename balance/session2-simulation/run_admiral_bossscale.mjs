// Piratenadmiral (P10) - Block B, Schritt 5, Messung M2: BOSS-FORSCHUNGSSKALIERUNG.
//
// ANLASS aus M1 (`admiral_strength.txt`): ein einziger Gegnerstaerke-Faktor kann die
// Ziel-Check-Tiefe 3-5 NICHT ueber die Ausbaustaende hinweg treffen. Das Fenster liegt bei `voll`
// zwischen 2,5x und 3,5x, bei `mittel` zwischen 1,5x und 2,0x, und `schwach` verliert schon bei
// 1,0x. Ursache ist strukturell: `combatFleetPowerBase()` rechnet auf ROHWERTEN - Forschung,
// Module, Klasse und Kampf-Booster gehen in die Gegnerstaerke nicht ein, tragen auf Spielerseite
// aber die gesamte Wirksamkeit.
//
// Der Boss verschaerft das: seine Werte kommen ueber `sideBStatsOverride` und umgehen damit
// `getEffectiveStats()`. Seine ESKORTE bekommt ueber `computePirateResearch()` /
// `PIRATE_RESEARCH_SHARE = 1,0` den vollen Forschungsstand des Spielers, der BOSS SELBST nicht -
// er wird mit steigender Forschung relativ immer weicher. Der Plan fuehrt das unter Entscheidung 4
// als "bewusst entscheiden, nicht stillschweigend lassen".
//
// GEMESSEN WIRD: zieht eine Forschungsskalierung des Bosses die Spreizung zwischen den
// Ausbaustaenden so weit zusammen, dass EIN Faktor die Tiefe 3-5 fuer alle trifft?
//   Modus "heute"     = generateAdmiralEncounter() unveraendert (Vergleichswerte stehen bereits
//                       in admiral_strength.txt, muessen also nicht neu gemessen werden).
//   Modus "forschung" = Boss-Werte zusaetzlich mit waffen/schild/panzerungMultiplier der
//                       Piraten-Forschung (effectPerLevel 0,10 -> Stufe 10 = 2,0x). Nur der Boss,
//                       die Eskorte hat sie ohnehin.
//
// SCHEIBENWEISE: EINE Zelle je Aufruf, das Ergebnis wird sofort an die Ausgabedatei angehaengt.
// Grund: ein Vollauf ueber alle Zellen lief am 16.08.2026 ohne sichtbaren Fortschritt und musste
// abgebrochen werden - das Zwischenergebnis war komplett verloren, weil die Tabellen erst am Ende
// geschrieben wurden. Tiefe Serien mit 100-Runden-Kaempfen kosten ein Vielfaches der kurzen,
// eine lineare Hochrechnung aus einem kleinen Kalibrierlauf unterschaetzt die Laufzeit massiv.
//
// Beruehrt den Spielcode NICHT (Import nur ueber combat/combatRunner/data, keine Datenbank).
// Aufruf: node run_admiral_bossscale.mjs <modus> <profil> <flotte> <faktor> [serien] [datei]
//   z. B. node run_admiral_bossscale.mjs forschung voll real 2 40 admiral_bossscale.txt
import { appendFileSync, existsSync } from 'node:fs';
import { combat, runner, cc, ships, stateFor, value, pct, mrd } from './lib4.mjs';

const [, , MODE, PROFILE, FLEET_NAME, FACTOR_S, SERIES_S, OUT_S] = process.argv;
const FACTOR = Number(FACTOR_S);
const SERIES = Number(SERIES_S || 40);
const OUT = OUT_S || 'admiral_bossscale.txt';
const DEFEAT_SHARE = 0.30; // Entscheidung 4.1, geschlossen am 15.08.2026
const SALVAGE = 0.30;      // Wrack-Bergung, Session-3-Entscheidung

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const unitPower = (id) => { const s = combat.baseStats(id); return s.waffen + s.schild + s.panzerung; };

// Flotten identisch zu run_admiral_defeat.mjs / run_admiral_strength.mjs.
const FLEETS = {
  real:  { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
};

async function runSeries(profileName, baseFleet, factor, mode) {
  const state = stateFor(profileName, 1);
  const pr = combat.computePirateResearch(state.research);
  const bossMult = {
    waffen: combat.waffenMultiplier(pr),
    schild: combat.schildMultiplier(pr),
    panzerung: combat.panzerungMultiplier(pr),
  };

  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  let depth = 0, outcome = 'extraktion', lostShare = 0, destroyedPower = 0, capped = 0, bossAlive1 = false;

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    if (fleetValue(fleet) <= 0) { outcome = 'niederlage'; break; }
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * mult * esc * factor);

    const override = { ...enc.statsOverride };
    if (mode === 'forschung') {
      const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
      override[cc.ADMIRAL_BOSS_ID] = {
        waffen: b.waffen * bossMult.waffen,
        schild: b.schild * bossMult.schild,
        panzerung: b.panzerung * bossMult.panzerung,
      };
    }

    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enc.npcShips,
      sideBStatsOverride: override,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: profileName !== 'voll_noboost',
      shipModules: state.shipModules,
      retreatMode: 'all',
    });
    if (r.roundsFought >= cc.MAX_ROUNDS) capped++;

    Object.entries(enc.npcShips).forEach(([id, sent]) => {
      const ov = override[id];
      const per = ov ? ov.waffen + ov.schild + ov.panzerung : unitPower(id);
      destroyedPower += (sent - (r.survivorsB[id] || 0)) * per;
    });

    const next = {};
    Object.keys(fleet).forEach((id) => (next[id] = r.survivorsA[id] || 0));
    fleet = next;
    depth = c + 1;
    lostShare = startValue > 0 ? (startValue - fleetValue(fleet)) / startValue : 0;
    if (c === 0) bossAlive1 = (r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) > 0;

    // Reihenfolge wie im Spielcode: erst Sieg, dann Niederlage.
    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) { outcome = 'sieg'; break; }
    if (lostShare >= DEFEAT_SHARE) { outcome = 'niederlage'; break; }
  }
  return { depth, outcome, lostShare, destroyedPower, capped, bossAlive1, lostValue: startValue * lostShare };
}

const agg = (rows, fn) => rows.reduce((s, r) => s + fn(r), 0) / rows.length;
const share = (rows, o) => rows.filter((r) => r.outcome === o).length / rows.length;

if (!existsSync(OUT)) {
  appendFileSync(OUT, [
    '=== Piratenadmiral, Schritt 5 / M2: Boss mit Forschungsskalierung ===',
    'Modus "heute" = Boss umgeht getEffectiveStats() (Ist-Zustand, Vergleichswerte in admiral_strength.txt).',
    'Modus "forschung" = Boss-Werte zusaetzlich mit der Piraten-Forschung skaliert (PIRATE_RESEARCH_SHARE = 1,0).',
    `Abbruch: kumulierter WERT-Verlust >= ${DEFEAT_SHARE.toFixed(2)} gegen die entsandte Flotte; contributedPower frisch je Check.`,
    `Rundendeckel MAX_ROUNDS = ${cc.MAX_ROUNDS}. Eine Zelle je Aufruf, 40 Serien (Messregel 2).`,
    '',
    'Modus      Profil/Flotte    Faktor  Tiefe    Sieg  Niederl.  Extrakt.  Verl.Ende  BossC1  vernicht.Macht  netto Verlust  Rundendeckel',
  ].join('\n') + '\n');
}

const rows = [];
for (let i = 0; i < SERIES; i++) rows.push(await runSeries(PROFILE, FLEETS[FLEET_NAME], FACTOR, MODE));

const line =
  `${MODE.padEnd(11)}${`${PROFILE}/${FLEET_NAME}`.padEnd(17)}${`${FACTOR}x`.padStart(6)}`
  + `${agg(rows, (x) => x.depth).toFixed(2).padStart(7)}`
  + `${pct(share(rows, 'sieg')).padStart(8)}${pct(share(rows, 'niederlage')).padStart(10)}${pct(share(rows, 'extraktion')).padStart(10)}`
  + `${pct(agg(rows, (x) => x.lostShare)).padStart(11)}`
  + `${pct(agg(rows, (x) => (x.bossAlive1 ? 1 : 0))).padStart(8)}`
  + `${mrd(agg(rows, (x) => x.destroyedPower)).padStart(16)}`
  + `${mrd(agg(rows, (x) => x.lostValue * (1 - SALVAGE))).padStart(15)}`
  + `${pct(agg(rows, (x) => (x.capped > 0 ? 1 : 0))).padStart(14)}`;

appendFileSync(OUT, line + '\n');
console.log(line);
process.exit(0);
