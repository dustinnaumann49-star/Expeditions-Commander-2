// Belegt die Schuss-/Trefferzahl des Piratenadmirals je Runde (Beleg zum Messkasten bei 4.4).
// Aufruf: [MESSBUILD=...] node probe_admiral_shots.mjs <label>
import { combat, runner, cc, stateFor } from './lib4.mjs';

const LABEL = process.argv[2] || 'V0';
const fleet = { kreuzer: 150, schlachtschiff: 150, bomber: 150, schlachtkreuzer: 75, zerstoerer: 75, reaper: 75 };
const st = stateFor('voll', 1);
const pr = combat.computePirateResearch(st.research);
const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.3 * 1.75);
const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
const bossStats = {
  waffen: b.waffen * combat.waffenMultiplier(pr),
  schild: b.schild * combat.schildMultiplier(pr),
  panzerung: b.panzerung * combat.panzerungMultiplier(pr),
};

const r = await runner.runCombatInWorker({
  sideAShips: fleet,
  sideBShips: { [cc.ADMIRAL_BOSS_ID]: 1 },
  sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats },
  research: st.research,
  playerClass: st.playerClass,
  kampfBoostActive: true,
  shipModules: st.shipModules,
  retreatMode: 'none',
});

const key = Object.keys(r.shotsB.shotsFired).find((k) => k.includes(cc.ADMIRAL_BOSS_ID));
const shots = r.shotsB.shotsFired[key] || 0;
const hits = r.shotsB.hits[key] || 0;
const rf = r.shotsB.rapidFireTriggers[key] || 0;
const zielerfassung = combat.getZielerfassungAccuracy(pr, cc.ADMIRAL_BOSS_ID);

console.log(
  `${LABEL.padEnd(4)} Runden ${String(r.roundsFought).padStart(4)}`
  + ` | Zielerfassung ${zielerfassung.toFixed(2)}`
  + ` | Schuesse ${String(shots).padStart(6)} = ${(shots / r.roundsFought).toFixed(1)} je Runde`
  + ` | Treffer ${String(hits).padStart(6)}`
  + ` | RF-Ausloesungen ${String(rf).padStart(6)}`
);
process.exit(0);
