// Piratenadmiral (P10) - Block B, Schritt 5, Messung M3: RUNDENDECKEL-GEGENPROBE.
//
// ANLASS aus M2 (`admiral_bossscale.txt`): im empfohlenen Bereich (Faktor 1,5-2,0x mit
// forschungsskaliertem Boss) laufen 35-100 % der Kaempfe in `MAX_ROUNDS = 100`. Damit ist unklar,
// ob "Boss ueberlebt Check n" eine Aussage ueber die Kampfkraft ist oder nur darueber, dass der
// Kampf vor der Entscheidung abgeschnitten wurde. Vor dem Schliessen von 4.3 muss geklaert sein,
// ob der empfohlene Faktor am Deckel haengt oder nicht.
//
// AUFBAU: identisch zu run_admiral_bossscale.mjs (Modus "forschung"), aber die Spiel-Module werden
// aus einem MESSBUILD geladen, in dem allein die kompilierte Konstante MAX_ROUNDS ersetzt ist.
// Der QUELLCODE bleibt unveraendert - `server/src/game/data/combatConstants.ts` steht weiter auf
// 100. Erzeugt wird ein Messbuild mit:
//   cp -r server/dist messbuild_300
//   sed -i "s/export const MAX_ROUNDS = 100;/export const MAX_ROUNDS = 300;/" \
//     messbuild_300/game/data/combatConstants.js
// Der ganze dist-Baum wird kopiert, nicht nur die Konstante, damit `combatRunner.js` seinen
// Worker (`combat.worker.js`) weiterhin relativ zu sich selbst findet und derselbe Deckel auch
// IM Worker-Thread gilt - sonst haette der Hauptthread einen anderen Wert als der Worker.
//
// Aufruf: MESSBUILD=/pfad/zu/messbuild_300 node run_admiral_roundcap.mjs <profil> <flotte> <faktor> [serien] [datei]
import { appendFileSync, existsSync } from 'node:fs';

const D = process.env.MESSBUILD ? `${process.env.MESSBUILD}/game` : '../../server/dist/game';
const combat = await import(`${D}/combat.js`);
const runner = await import(`${D}/combatRunner.js`);
const cc = await import(`${D}/data/combatConstants.js`);
const ships = await import(`${D}/data/ships.js`);

const [, , PROFILE, FLEET_NAME, FACTOR_S, SERIES_S, OUT_S] = process.argv;
const FACTOR = Number(FACTOR_S);
const SERIES = Number(SERIES_S || 40);
const OUT = OUT_S || 'admiral_roundcap.txt';
const DEFEAT_SHARE = 0.30;
const SALVAGE = 0.30;

// Wertformel und Profile identisch zu lib4.mjs / run_admiral_bossscale.mjs.
const value = (c) => (c.metall || 0) + (c.kristall || 0) + 2 * (c.deuterium || 0);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const unitPower = (id) => { const s = combat.baseStats(id); return s.waffen + s.schild + s.panzerung; };

const COMBAT_RESEARCH = ['waffen', 'schild', 'panzerung', 'zielerfassung', 'durchschlag', 'schildregeneration', 'praezision', 'ausweichen', 'kritischetreffer'];
const FLEETS = {
  real:  { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
};
const PROFILES = {
  voll:    { researchLevel: 10, moduleLevel: 10, playerClass: 'kanonier', kampfBoost: true },
  mittel:  { researchLevel: 6, moduleLevel: 5, playerClass: 'kanonier', kampfBoost: true },
  schwach: { researchLevel: 3, moduleLevel: 0, playerClass: null, kampfBoost: false },
};

function stateFor(name, fleet) {
  const p = PROFILES[name];
  const research = {}; COMBAT_RESEARCH.forEach((id) => (research[id] = p.researchLevel));
  const shipModules = {};
  Object.keys(fleet).forEach((id) => { ['waffen', 'schild', 'panzerung'].forEach((k) => (shipModules[`${id}_${k}`] = p.moduleLevel)); });
  return { research, shipModules, playerClass: p.playerClass, kampfBoost: p.kampfBoost };
}

async function runSeries(profileName, baseFleet, factor) {
  const state = stateFor(profileName, baseFleet);
  const pr = combat.computePirateResearch(state.research);
  const bossMult = {
    waffen: combat.waffenMultiplier(pr),
    schild: combat.schildMultiplier(pr),
    panzerung: combat.panzerungMultiplier(pr),
  };

  let fleet = { ...baseFleet };
  const startValue = fleetValue(fleet);
  let depth = 0, outcome = 'extraktion', lostShare = 0, destroyedPower = 0, capped = 0, maxRounds = 0, sumRounds = 0, fights = 0;

  for (let c = 0; c < cc.ADMIRAL_TOTAL_CHECKS; c++) {
    if (fleetValue(fleet) <= 0) { outcome = 'niederlage'; break; }
    const mult = cc.ADMIRAL_MULTIPLIER_ROLL[Math.floor(Math.random() * cc.ADMIRAL_MULTIPLIER_ROLL.length)];
    const esc = Math.pow(1 + cc.ADMIRAL_ESCALATION_PER_CHECK, c);
    const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * mult * esc * factor);

    const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
    const override = { ...enc.statsOverride, [cc.ADMIRAL_BOSS_ID]: { waffen: b.waffen * bossMult.waffen, schild: b.schild * bossMult.schild, panzerung: b.panzerung * bossMult.panzerung } };

    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enc.npcShips,
      sideBStatsOverride: override,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: state.kampfBoost,
      shipModules: state.shipModules,
      retreatMode: 'all',
    });
    fights++; sumRounds += r.roundsFought; maxRounds = Math.max(maxRounds, r.roundsFought);
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

    if ((r.survivorsB[cc.ADMIRAL_BOSS_ID] || 0) <= 0) { outcome = 'sieg'; break; }
    if (lostShare >= DEFEAT_SHARE) { outcome = 'niederlage'; break; }
  }
  return { depth, outcome, lostShare, destroyedPower, capped, maxRounds, avgRounds: fights ? sumRounds / fights : 0, lostValue: startValue * lostShare };
}

const agg = (rows, fn) => rows.reduce((s, r) => s + fn(r), 0) / rows.length;
const share = (rows, o) => rows.filter((r) => r.outcome === o).length / rows.length;

if (!existsSync(OUT)) {
  appendFileSync(OUT, [
    '=== Piratenadmiral, Schritt 5 / M3: Rundendeckel-Gegenprobe ===',
    'Alle Zellen mit forschungsskaliertem Boss (Empfehlung aus M2). Einzige Variable ist MAX_ROUNDS.',
    'Der Quellcode bleibt auf 100 - variiert wird nur die kompilierte Konstante in einem Messbuild.',
    'Frage: haengt der empfohlene Faktor am Deckel, oder waere der Ausgang ohne Deckel derselbe?',
    '',
    'Deckel  Profil/Flotte    Faktor  Tiefe    Sieg  Niederl.  Extrakt.  Verl.Ende  Runden oe  max  amDeckel  vernicht.Macht',
  ].join('\n') + '\n');
}

const rows = [];
for (let i = 0; i < SERIES; i++) rows.push(await runSeries(PROFILE, FLEETS[FLEET_NAME], FACTOR));

const line =
  `${String(cc.MAX_ROUNDS).padEnd(8)}${`${PROFILE}/${FLEET_NAME}`.padEnd(17)}${`${FACTOR}x`.padStart(6)}`
  + `${agg(rows, (x) => x.depth).toFixed(2).padStart(7)}`
  + `${pct(share(rows, 'sieg')).padStart(8)}${pct(share(rows, 'niederlage')).padStart(10)}${pct(share(rows, 'extraktion')).padStart(10)}`
  + `${pct(agg(rows, (x) => x.lostShare)).padStart(11)}`
  + `${agg(rows, (x) => x.avgRounds).toFixed(0).padStart(11)}`
  + `${Math.max(...rows.map((x) => x.maxRounds)).toString().padStart(5)}`
  + `${pct(agg(rows, (x) => (x.capped > 0 ? 1 : 0))).padStart(10)}`
  + `${mrd(agg(rows, (x) => x.destroyedPower)).padStart(16)}`;

appendFileSync(OUT, line + '\n');
console.log(line);
process.exit(0);
