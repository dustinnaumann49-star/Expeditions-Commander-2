// KUMULATIVER MESSBUILD - Block A Schritt 2 (Entscheidung 2) + optional Entscheidung 16.
//
// !!! ALLE ERGEBNISSE AUS DIESEM BUILD SIND MESSBUILD-WERTE, KEIN REPO-STAND. !!!
// Weder Block A Schritt 2 noch Entscheidung 16 stehen im Repo. Verfahren wie
// make_messbuild_rf.mjs: der QUELLCODE bleibt unberuehrt, veraendert wird ausschliesslich eine
// KOPIE des dist-Baums. Der ganze Baum wird kopiert, damit combatRunner.js seinen Worker
// (combat.worker.js) relativ zu sich selbst findet und dieselbe Aenderung IM Worker-Thread gilt.
//
// Warum kumulativ: Entscheidung 16 wird zum Server-Neustart zusammen mit Block A Schritt 2 wirksam.
// Wer gegen den heutigen Repo-Stand misst, misst gegen eine Baseline (0,80 / 19,82 / 76,85 Mrd),
// die es zum Neustart nicht mehr gibt. Gueltige Vergleichsbasis ist 0,98 / 19,57 / 61,11 Mrd.
//
// Aufruf: node make_messbuild_kum.mjs <zielordner> [--rf=N] [--evk=X] [--evm=Y] [--wave=a,b,c,d]
//   ohne --rf/--evk/--evm : reiner Block-A-Schritt-2-Build (= neue Baseline, "KUM-IST")
//   --rf=4 --evk=0.20 --evm=0.08 : zusaetzlich Entscheidung 16, Variante A + abgesenkter Bonus
//   --wave=1.20,1.70,2.30,2.50   : RAID_WAVE_ROLL ueberschreiben (freigegeben nach Entscheidung 10)
import { cpSync, writeFileSync, appendFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Relativ zum SKRIPT, nicht zum Arbeitsverzeichnis - sonst haengt der Lauf davon ab, aus welchem
// Ordner er gestartet wurde.
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../server/dist');
const args = process.argv.slice(2);
const OUT = resolve(args[0] || './messbuild_kum');
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
};
const RF = opt('rf', null) === null ? null : Number(opt('rf'));
const EVK = opt('evk', null) === null ? null : Number(opt('evk'));
const EVM = opt('evm', null) === null ? null : Number(opt('evm'));
const WAVE = opt('wave', null);

if (!existsSync(DIST)) throw new Error('server/dist fehlt - erst npx tsc im Serverordner (Messregel 1)');
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(DIST, OUT, { recursive: true });

// ===================================================================================
// TEIL 1 - BLOCK A, SCHRITT 2 (immer enthalten)
// Bauanleitung: Messkasten am Kopf von Entscheidung 2. Hier ist nur die MESSFLAECHE nachgebaut,
// also das, was run_loot_curve.mjs / run_income_baseline_v2.mjs tatsaechlich aufrufen:
// game/loot.js, die fuenf Konstanten in economy.js und winResources der drei Solo-Sektoren.
// Die Verdrahtung in missions.ts/groupOps.ts gehoert in die Bauanleitung, nicht in den Messbuild -
// beide Skripte bauen die Missionsschleife selbst nach.
// ===================================================================================

const LOOT_JS = `// MESSBUILD - Block A, Schritt 2. Nicht im Repo.
import { LOOT_CURVE_EXPONENT, SALVAGE_SHARE, COOP_LOOT_BONUS_PER_PARTNER, COOP_LOOT_BONUS_MAX_PARTNERS } from './data/economy.js';
import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';

/** Kurvenfaktor: (vernichtete Feindmacht / Anker)^Exponent. Exponent 0,85, gemessen. */
export function lootCurveFactor(destroyedPower, anchorPower) {
    if (!(destroyedPower > 0) || !(anchorPower > 0))
        return 0;
    return Math.pow(destroyedPower / anchorPower, LOOT_CURVE_EXPONENT);
}
/** Absoluter Beutewert gegen einen Anker (Niveau steckt im Anker, Neigung im Exponenten). */
export function lootCurveValue(destroyedPower, anchorPower, anchorValue) {
    return anchorValue * lootCurveFactor(destroyedPower, anchorPower);
}
/** Koop-Aufschlag: V2 plus 15 % je Mitflieger, gedeckelt bei 3. */
export function coopLootMultiplier(participants) {
    const partners = Math.max(0, Math.floor(participants || 1) - 1);
    return 1 + COOP_LOOT_BONUS_PER_PARTNER * Math.min(partners, COOP_LOOT_BONUS_MAX_PARTNERS);
}
/**
 * Wrack-Bergung: SALVAGE_SHARE der Baukosten der eigenen Verluste.
 * Einheiten OHNE Ressourcen-Kosten sind ausgenommen - das ist genau der Imperator (teileCost statt
 * cost), Nutzerentscheidung 19.08.2026: Prestige-Schiff, kaputt ist kaputt.
 */
export function computeSalvage(lostUnits) {
    const out = { metall: 0, kristall: 0, deuterium: 0 };
    for (const [id, n] of Object.entries(lostUnits || {})) {
        if (!n || n <= 0)
            continue;
        const def = SHIPS.find((s) => s.id === id) || DEFENSES.find((d) => d.id === id);
        if (!def || !def.cost)
            continue;
        out.metall += (def.cost.metall || 0) * n * SALVAGE_SHARE;
        out.kristall += (def.cost.kristall || 0) * n * SALVAGE_SHARE;
        out.deuterium += (def.cost.deuterium || 0) * n * SALVAGE_SHARE;
    }
    out.metall = Math.round(out.metall);
    out.kristall = Math.round(out.kristall);
    out.deuterium = Math.round(out.deuterium);
    return out;
}
`;
writeFileSync(resolve(OUT, 'game/loot.js'), LOOT_JS);

// Die fuenf Konstanten aus dem Messkasten. Anker sind GEMESSEN (loot_curve.txt) und damit fix.
appendFileSync(resolve(OUT, 'game/data/economy.js'), `
// ===== MESSBUILD: Block A, Schritt 2 =====
export const LOOT_CURVE_SOLO_CHECK_POWER = 2_662_000_000;
export const LOOT_CURVE_ELITE_CHECK_POWER = 2_290_000_000;
export const SALVAGE_SHARE = 0.3;
export const COOP_LOOT_BONUS_PER_PARTNER = 0.15;
export const COOP_LOOT_BONUS_MAX_PARTNERS = 3;
`);

// Container sollen ein Extra sein, nicht die Hauptquelle: der Container-Fund faellt einmal je
// MISSION statt je gewonnenem Check (das steckt in der Missionsschleife der Messskripte), und
// winResources der drei Solo-Sektoren traegt den Rest - Faktor 13,8.
const SOLO_WIN_RES_FACTOR = 13.8;
appendFileSync(resolve(OUT, 'game/data/sectors.js'), `
// ===== MESSBUILD: Block A, Schritt 2 - winResources der Solo-Sektoren x${SOLO_WIN_RES_FACTOR} =====
for (const __sid of ['piraten_niedrig', 'piraten_mittel', 'piraten_hoch']) {
    const __wr = SEKTOR_CONFIG[__sid].winResources;
    __wr.metall = Math.round(__wr.metall * ${SOLO_WIN_RES_FACTOR});
    __wr.kristall = Math.round(__wr.kristall * ${SOLO_WIN_RES_FACTOR});
    __wr.deuterium = Math.round(__wr.deuterium * ${SOLO_WIN_RES_FACTOR});
}
`);

// ===================================================================================
// TEIL 2 - ENTSCHEIDUNG 16 (nur wenn --rf/--evk/--evm gesetzt)
// Variante A aus make_messbuild_rf.mjs, unveraendert uebernommen: jedes Standard-Kampfschiff
// kontert die KOMPLETTE eigene UI-Klasse, waehlt aber weiterhin EIN Ziel.
// ===================================================================================
const KLASSEN = {
  jaeger: ['leicht', 'schwer'],
  kreuzer: ['kreuzer', 'schlachtschiff', 'bomber'],
  elite: ['schlachtkreuzer', 'zerstoerer', 'reaper'],
};
const DEF_KLASSE = {
  raketenwerfer: 'jaeger', leichteslaser: 'jaeger',
  schwereslaser: 'kreuzer', gausskanone: 'kreuzer',
  ionengeschuetz: 'elite', plasmawerfer: 'elite',
};
const BOMBER_GEGEN_ANLAGEN = { raketenwerfer: 20, leichteslaser: 20, schwereslaser: 10 };
const PLASMA_EXTRA = { imperator: 2 };

if (RF !== null) {
  const rfPatch = {};
  Object.entries(KLASSEN).forEach(([klasse, ids]) => {
    const tabelle = {};
    KLASSEN[klasse].forEach((id) => (tabelle[id] = RF));
    ids.forEach((id) => (rfPatch[id] = { ...tabelle }));
  });
  rfPatch.bomber = { ...rfPatch.bomber, ...BOMBER_GEGEN_ANLAGEN };
  Object.entries(DEF_KLASSE).forEach(([defId, klasse]) => {
    const tabelle = {};
    KLASSEN[klasse].forEach((id) => (tabelle[id] = RF));
    rfPatch[defId] = tabelle;
  });
  rfPatch.plasmawerfer = { ...rfPatch.plasmawerfer, ...PLASMA_EXTRA };

  appendFileSync(resolve(OUT, 'game/data/combatConstants.js'), `
// ===== MESSBUILD: Entscheidung 16 - Klassen-RapidFire, RF-Wert ${RF} =====
const __RF_KLASSEN_PATCH = ${JSON.stringify(rfPatch, null, 2)};
for (const [attacker, table] of Object.entries(__RF_KLASSEN_PATCH)) {
    RAPIDFIRE[attacker] = table;
}
// Ohne ZIELERFASSUNG_BASE-Eintrag liefert getZielerfassungAccuracy() 0 und JEDER RF-Eintrag des
// Schuetzen ist toter Code (Falle aus Entscheidung 4.4). 'leicht' hatte bisher kein RF-Ziel.
ZIELERFASSUNG_BASE['leicht'] = 0.25;
`);
}

if (EVK !== null || EVM !== null) {
  appendFileSync(resolve(OUT, 'game/data/combatConstants.js'), `
// ===== MESSBUILD: Entscheidung 16 - Groessenklassen-Ausweichbonus =====
SIZE_MISMATCH_EVASION_BONUS.klein.gross = ${EVK !== null ? EVK : 0.45};
SIZE_MISMATCH_EVASION_BONUS.mittel.gross = ${EVM !== null ? EVM : 0.18};
`);
}

if (WAVE) {
  const w = WAVE.split(',').map(Number);
  if (w.length !== 4 || w.some((x) => !Number.isFinite(x))) throw new Error('--wave=a,b,c,d erwartet vier Zahlen');
  appendFileSync(resolve(OUT, 'game/data/economy.js'), `
// ===== MESSBUILD: RAID_WAVE_ROLL (Ausgleichsregler, freigegeben nach Entscheidung 10) =====
RAID_WAVE_ROLL[0] = ${w[0]};
RAID_WAVE_ROLL[1] = ${w[1]};
RAID_WAVE_ROLL[2] = [${w[2]}, ${w[3]}];
`);
}

console.log(`Messbuild: ${OUT}`);
console.log(`  Block A Schritt 2: loot.js, 5 Konstanten, winResources x${SOLO_WIN_RES_FACTOR}`);
console.log(`  Entscheidung 16  : RF=${RF ?? '-'}  evk=${EVK ?? '-'}  evm=${EVM ?? '-'}`);
console.log(`  RAID_WAVE_ROLL   : ${WAVE ?? 'unveraendert'}`);
console.log('  Quellcode unberuehrt.');
