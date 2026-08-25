// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   node make_messbuild_kum.mjs   /tmp/mb_kum    --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_salve.mjs /tmp/mb_kum    /tmp/mb_w2d16 --je=20000 --deckel=16
//   MESSBUILD=/tmp/mb_kum   ESC=1,1.20,1.60 BUNKER=0.5 node run_volley_def_19.mjs 6
//   MESSBUILD=/tmp/mb_w2d16 ESC=1,1.20,1.60 BUNKER=0.5 node run_volley_def_19.mjs 6
//
// ===================================================================================
// ENTSCHEIDUNG 19 - WEG 2 UND DIE BEIDEN SALVEN-VERTEIDIGUNGSANLAGEN
// ===================================================================================
// sentinelkanone und ultimatekanone stehen ebenfalls in MULTI_TARGET_VOLLEY_SHIPS. Weg 2 wirkt
// deshalb auch auf sie - und zwar im RAID, wo ihnen die groessten Feindstapel des ganzen Spiels
// gegenueberstehen. Das ist der einzige Punkt, an dem Entscheidung 19 in Entscheidung 18
// (kalibrierte Eskalation) und Entscheidung 16 (Verteidigung im Raid) hineinreicht.
//
// Zwei Fragen:
//   (1) BINDET Weg 2 in der Kalibrierzelle von Entscheidung 18 ueberhaupt? Das ist eine
//       Stapelgroessen-Frage und wird DETERMINISTISCH beantwortet, nicht mit Serien.
//   (2) Wenn ja: wie stark verschiebt sich der Raid-Ausgang?
//
// Der Raid ist hier mit ESC/BUNKER aus Entscheidung 18 gefahren, weil das der Zustand nach dem
// Neustart ist. Ohne ESC/BUNKER misst man eine Welt, die es dann nicht mehr gibt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as L from './lib3.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt.');

const combatJs = fs.readFileSync(path.join(process.env.MESSBUILD, 'game/combat.js'), 'utf8');
const hatW2 = combatJs.includes('SALVE_JE');
const w2Text = hatW2 ? (combatJs.match(/SALVE_JE = (\d+)[\s\S]*?SALVE_DECKEL = (\d+)/) || []).slice(1, 3).join(' / ') : 'AUS';

const SALVEN_DEF = ['sentinelkanone', 'ultimatekanone'];
const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };

function flotteFuer(anteil) {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => { const c = Math.round(n * anteil); if (c > 0) f[id] = c; });
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => { if (anteil > 0) f[id] = n; });
  return f;
}

const ESC = process.env.ESC ? process.env.ESC.split(',').map(Number) : null;
const BUNKER = Number(process.env.BUNKER || 0);
const WAVES = Number(process.env.WAVES || L.economy.RAID_WAVE_COUNT);

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// --- Frage 1: deterministisch. Wie gross sind die Feindstapel je Typ in Welle 1? ---
function stapelProbe(fleet, defense) {
  let dp = 0, fp = 0;
  Object.entries(defense).forEach(([id, n]) => { const b = L.combat.baseStats(id); dp += n * (b.waffen + b.schild + b.panzerung); });
  Object.entries(fleet).forEach(([id, n]) => { const b = L.combat.baseStats(id); fp += n * (b.waffen + b.schild + b.panzerung); });
  const combined = fp * 0.7 + dp * 0.3;
  // mittlerer Wellenfaktor aus RAID_WAVE_ROLL, Phase 1 (escFactor 1) - die konservativste Welle
  // RAID_WAVE_ROLL ist [1.2, 1.7, [2.3, 2.5]] - der dritte Eintrag ist eine Spanne, kein Wert.
  // Erwartungswert nach pick503020: 50 % / 30 % / 20 %.
  const roll = L.economy.RAID_WAVE_ROLL;
  const dritter = Array.isArray(roll[2]) ? (roll[2][0] + roll[2][1]) / 2 : roll[2];
  const mittel = roll[0] * 0.5 + roll[1] * 0.3 + dritter * 0.2;
  const ziel = Math.max(combined, L.economy.RAID_MIN_TARGET_POWER) * mittel;
  const npc = L.combat.generateFallbackFleet(ziel, L.combat.pickWaveProfile('raid'));
  const groesster = Math.max(0, ...Object.values(npc));
  const gesamt = Object.values(npc).reduce((a, b) => a + b, 0);
  return { combined, gesamt, groesster, typen: Object.keys(npc).length };
}

async function einRaid(state, fleet, defense) {
  const st = { ...state, fleet: { ...fleet }, defense: { ...defense } };
  const repair = L.cc.DEFENSE_REPAIR_PERCENT;
  let gewonnen = 0, defSchaden = 0, gesamtSchaden = 0;
  for (let w = 0; w < WAVES; w++) {
    const shipIds = Object.keys(st.fleet).filter((id) => st.fleet[id] > 0);
    const defIds = Object.keys(st.defense).filter((id) => st.defense[id] > 0);
    const defenderShips = {};
    shipIds.forEach((id) => (defenderShips[id] = st.fleet[id]));
    defIds.forEach((id) => (defenderShips[id] = st.defense[id]));
    let dp = 0, fp = 0;
    defIds.forEach((id) => { const b = L.combat.baseStats(id); dp += st.defense[id] * (b.waffen + b.schild + b.panzerung); });
    shipIds.forEach((id) => { const b = L.combat.baseStats(id); fp += st.fleet[id] * (b.waffen + b.schild + b.panzerung); });
    const combined = fp * 0.7 + dp * 0.3;
    const domePool = L.combat.computeDomeSharedPool(st.defense, st.research, !!st.activeBoosters.kampf, st.playerClass, st.shipModules);
    const waveFactor = L.combat.pick503020(L.economy.RAID_WAVE_ROLL);
    const phase = ESC ? Math.min(ESC.length - 1, Math.floor((w / WAVES) * ESC.length)) : 0;
    const escFactor = ESC ? ESC[phase] : 1;
    const ziel = Math.max(combined, L.economy.RAID_MIN_TARGET_POWER) * waveFactor * escFactor;
    const bunkerAnteil = BUNKER > 0 && ESC && phase === ESC.length - 1 ? BUNKER : 0;
    const npcShips = L.combat.generateFallbackFleet(ziel * (1 - bunkerAnteil), L.combat.pickWaveProfile('raid'));
    if (bunkerAnteil > 0) {
      const bb = L.combat.baseStats('bomber');
      npcShips.bomber = (npcShips.bomber || 0) + Math.round((ziel * bunkerAnteil) / (bb.waffen + bb.schild + bb.panzerung));
    }
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) { gewonnen++; continue; }
    const r = await L.runner.runCombatInWorker({
      sideAShips: defenderShips, sideBShips: npcShips, research: st.research,
      defenseCounts: st.defense, sharedShieldPoolA: domePool, retreatMode: 'fleetOnly',
      battleModifier: L.combat.rollBattleModifier('raid'), playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules,
    });
    Object.entries((r.shotsA && r.shotsA.dmgDealt) || {}).forEach(([k, v]) => {
      const id = k.includes(':') ? k.split(':')[1] : k;
      gesamtSchaden += v;
      if (SALVEN_DEF.includes(id)) defSchaden += v;
    });
    shipIds.forEach((id) => { st.fleet[id] = r.survivorsA[id] || 0; });
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const surv = r.survivorsA[id] || 0;
      st.defense[id] = surv + Math.floor((sent - surv) * repair);
    });
    if (npcIds.every((id) => (r.survivorsB[id] || 0) <= 0)) gewonnen++;
  }
  return { rest: st, gewonnen, defAnteil: gesamtSchaden ? defSchaden / gesamtSchaden : 0 };
}

const N = Number(process.argv[2] || 6);
const state = L.stateFor('voll');
const ZELLEN = [
  ['E18-Zelle', L.FLEET_LARGE],
  ['0.1', flotteFuer(0.1)],
  ['1.0', flotteFuer(1.0)],
];

say('=== ENTSCHEIDUNG 19 - WEG 2 UND DIE SALVEN-VERTEIDIGUNGSANLAGEN IM RAID ===');
say(`MESSBUILD-WERTE. Weg 2 im Build: ${hatW2 ? `JE / DECKEL = ${w2Text}` : 'AUS'}.`);
say(`${WAVES} Wellen, ESC=${process.env.ESC || 'aus'}, BUNKER=${BUNKER}, DEFENSE_LARGE, Profil voll, ${N} Raids je Zelle.`);
say();
say('--- Frage 1, DETERMINISTISCH: erreichen die Feindstapel die 20.000-Schwelle? ---');
say('Zelle'.padEnd(12) + 'Wellenmacht'.padStart(14) + 'NPC gesamt'.padStart(13) + 'Typen'.padStart(8) +
    'groesster Stapel'.padStart(18) + 'Weg 2 bindet?'.padStart(15));
for (const [name, fleet] of ZELLEN) {
  const p = stapelProbe(fleet, DEFENSE_LARGE);
  say(name.padEnd(12) + `${(p.combined / 1e9).toFixed(2)} Mrd`.padStart(14) +
      p.gesamt.toLocaleString('de-DE').padStart(13) + String(p.typen).padStart(8) +
      p.groesster.toLocaleString('de-DE').padStart(18) +
      (p.groesster >= 20000 ? 'JA' : 'NEIN').padStart(15));
}
say();
say('--- Frage 2: Raid-Ausgang ---');
say('Zelle'.padEnd(12) + 'gew. Wellen'.padStart(13) + 'Verteid.-Verlust'.padStart(18) +
    'Flotten-Verlust'.padStart(17) + 'Schadensanteil Salven-Def'.padStart(27));
for (const [name, fleet] of ZELLEN) {
  let defStart = 0, defEnd = 0, flStart = 0, flEnd = 0, gew = 0, anteil = 0;
  for (let i = 0; i < N; i++) {
    const r = await einRaid(state, fleet, DEFENSE_LARGE);
    Object.entries(DEFENSE_LARGE).forEach(([id, n]) => { defStart += n; defEnd += r.rest.defense[id] || 0; });
    Object.entries(fleet).forEach(([id, n]) => { flStart += n; flEnd += r.rest.fleet[id] || 0; });
    gew += r.gewonnen; anteil += r.defAnteil;
  }
  say(name.padEnd(12) + (gew / N).toFixed(1).padStart(13) +
      `${(((defStart - defEnd) / defStart) * 100).toFixed(1)} %`.padStart(18) +
      `${(((flStart - flEnd) / flStart) * 100).toFixed(1)} %`.padStart(17) +
      `${((anteil / N) * 100).toFixed(2)} %`.padStart(27));
}
fs.appendFileSync(path.join(HERE, 'volley_def_19.txt'), out.join('\n') + '\n\n');
process.exit(0);
