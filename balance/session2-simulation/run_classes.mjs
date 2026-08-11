// Klassen-Vergleich: Kanonier / Bollwerk / Kommandant gegen "keine Klasse".
// Misst BEIDE Seiten getrennt, weil die Klassen dort unterschiedlich wirken:
//   1. OFFENSIV - Sektor-Missionen und Expeditionen (Rueckzug aktiv, siehe RETREAT_THRESHOLD)
//   2. DEFENSIV - Raid auf die Heimatbasis (Rueckzug ABGESCHALTET, siehe raids.ts allowRetreat:false,
//      plus Bollwerk-Sonderregel CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT 0.9 statt 0.7)
// Ein Vergleich, der nur die offensive Seite misst, benachteiligt das Bollwerk systematisch.
// Aufruf: node run_classes.mjs [wiederholungen]
import * as L from './lib.mjs';

const REPS = Number(process.argv[2] || 6);
const { RAID_WAVE_ROLL, RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER } = L.economy;
const { DEFENSE_REPAIR_PERCENT } = L.cc;
const CLASSES = [null, 'kanonier', 'bollwerk', 'kommandant'];

// Referenz-Verteidigung, entspricht SEED_DEFENSE der Piratenbasen (pirateBaseState.ts)
const DEFENSE_REF = {
  raketenwerfer: 400, leichteslaser: 300, schwereslaser: 200,
  gausskanone: 100, ionengeschuetz: 80, plasmawerfer: 40,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};

function stateFor(cls) {
  return L.makeState({ researchLevel: 10, moduleLevel: 10, playerClass: cls, kampfBoost: true, shipIds: L.ALL_SHIP_IDS });
}

// ===== 1. Offensiv: ueber den Kampfsimulator (nutzt die echte NPC-Generierung inkl. Wellenwurf) =====
async function offensive(cls, sektor, fleet) {
  const st = stateFor(cls);
  let runs = 0, win = 0, loss = 0, rounds = 0;
  for (let i = 0; i < REPS; i++) {
    const r = await L.simulator.simulateCombat(st, sektor, fleet);
    if (!r.ok) throw new Error(r.error);
    const s = r.simulation;
    runs += s.runs; win += s.winRate * s.runs; loss += s.avgLossPercent * s.runs; rounds += s.avgRounds * s.runs;
  }
  return { runs, win: win / runs, loss: loss / runs, rounds: rounds / runs };
}

// ===== 2. Defensiv: repliziert resolveOneWave() aus raids.ts =====
async function defensive(cls, fleet, defense) {
  const st = stateFor(cls);
  st.fleet = { ...fleet };
  st.defense = { ...defense };
  const repair = cls === 'bollwerk' ? 0.9 : DEFENSE_REPAIR_PERCENT;
  for (let w = 0; w < RAID_WAVE_COUNT; w++) {
    const shipIds = Object.keys(st.fleet).filter((i) => st.fleet[i] > 0);
    const defIds = Object.keys(st.defense).filter((i) => st.defense[i] > 0);
    const defenders = {};
    shipIds.forEach((i) => (defenders[i] = st.fleet[i]));
    defIds.forEach((i) => (defenders[i] = st.defense[i]));
    let dp = 0, fp = 0;
    defIds.forEach((i) => { const b = L.combat.baseStats(i); dp += st.defense[i] * (b.waffen + b.schild + b.panzerung); });
    shipIds.forEach((i) => { const b = L.combat.baseStats(i); fp += st.fleet[i] * (b.waffen + b.schild + b.panzerung); });
    const pool = L.combat.computeDomeSharedPool(st.defense, st.research, true, cls, st.shipModules);
    const target = Math.max(fp * 0.7 + dp * 0.3, RAID_MIN_TARGET_POWER) * L.combat.pick503020(RAID_WAVE_ROLL);
    const npc = L.combat.generateFallbackFleet(target, L.combat.pickWaveProfile('raid'));
    if (Object.keys(npc).filter((i) => npc[i] > 0).length === 0) continue;
    const r = await L.runner.runCombatInWorker({
      sideAShips: defenders, sideBShips: npc, research: st.research, defenseCounts: st.defense,
      sharedShieldPoolA: pool, allowRetreat: false, battleModifier: L.combat.rollBattleModifier('raid'),
      playerClass: cls, kampfBoostActive: true, shipModules: st.shipModules,
    });
    shipIds.forEach((i) => (st.fleet[i] = r.survivorsA[i] || 0));
    defIds.forEach((i) => { const s0 = st.defense[i], sv = r.survivorsA[i] || 0; st.defense[i] = sv + Math.floor((s0 - sv) * repair); });
  }
  const sf = Object.values(fleet).reduce((a, b) => a + b, 0), ef = Object.values(st.fleet).reduce((a, b) => a + b, 0);
  const sd = Object.values(defense).reduce((a, b) => a + b, 0), ed = Object.values(st.defense).reduce((a, b) => a + b, 0);
  return { fleetLoss: (sf - ef) / sf, defLoss: (sd - ed) / sd };
}

console.log(`Klassen-Vergleich, Forschung 10 / Module 10 / Kampf-Booster aktiv, ${REPS} Wiederholungen je Zelle\n`);

console.log('=== OFFENSIV (Rueckzug aktiv) ===');
console.log('Szenario                        Klasse         Sieg%   oVerlust%   Runden');
for (const [label, fleet, sektor] of [
  ['Grosse Flotte / Elite-Bollwerk', L.FLEET_LARGE, 'piraten_elite'],
  ['Grosse Flotte / Piraten Hoch', L.FLEET_LARGE, 'piraten_hoch'],
  ['Kleine Flotte / Piraten Mittel', L.FLEET_SMALL, 'piraten_mittel'],
]) {
  for (const cls of CLASSES) {
    const r = await offensive(cls, sektor, fleet);
    console.log(`${label.padEnd(31)} ${(cls || 'keine').padEnd(13)} ${r.win.toFixed(0).padStart(5)}% ${r.loss.toFixed(1).padStart(10)}% ${r.rounds.toFixed(0).padStart(8)}`);
  }
}

// ACHTUNG, MINDESTENS 30 DURCHLAEUFE: Der Raid streut extrem (Wellenwurf 50/30/20, Kampf-
// Modifikator, NPC-Generierung je Welle neu). Bei 4 Durchlaeufen lag das Bollwerk einmal 9
// Prozentpunkte VOR dem Kanonier, bei 30 Durchlaeufen 6 Prozentpunkte dahinter - das Vorzeichen
// kippte allein durch die Stichprobengroesse. Die min-max-Spalte macht diese Streuung sichtbar;
// wer die Zahlen hier interpretiert, muss sie mitlesen.
const RAID_RUNS = Math.max(30, REPS * 4);
console.log(`\n=== DEFENSIV: Raid auf die Heimatbasis (Rueckzug abgeschaltet), ${RAID_RUNS} Durchlaeufe ===`);
console.log('Klasse         Flottenverlust   min-max      Verteidigungsverlust');
for (const cls of CLASSES) {
  const vals = [];
  let d = 0;
  for (let i = 0; i < RAID_RUNS; i++) { const r = await defensive(cls, L.FLEET_LARGE, DEFENSE_REF); vals.push(r.fleetLoss); d += r.defLoss; }
  const avg = vals.reduce((a, b) => a + b, 0) / RAID_RUNS;
  const span = `${(Math.min(...vals) * 100).toFixed(0)}-${(Math.max(...vals) * 100).toFixed(0)}%`;
  console.log(`${(cls || 'keine').padEnd(13)} ${(avg * 100).toFixed(1).padStart(13)}% ${span.padStart(10)} ${((d / RAID_RUNS) * 100).toFixed(1).padStart(20)}%`);
}

console.log('\nLesart: Gewonnen wird offensiv ueberall, der Unterschied liegt allein bei den Verlusten.');
console.log('Die Runden-Spalte erklaert den Mechanismus - wer schneller toetet, kassiert weniger Rueckfeuer.');
console.log('Beim Raid die min-max-Spalte mitlesen: die Streuung ist groesser als der Klassenunterschied.');
process.exit(0);
