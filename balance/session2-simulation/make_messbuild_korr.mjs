// MESSBUILD-PATCH - MULTI_TARGET_POWER_CORRECTION auf einen anderen Wert setzen.
//
// !!! ALLE ERGEBNISSE AUS DIESEM BUILD SIND MESSBUILD-WERTE, KEIN REPO-STAND. !!!
// Der QUELLCODE bleibt unberuehrt. Veraendert wird ausschliesslich eine KOPIE eines dist-Baums.
// Der ganze Baum wird kopiert, damit combatRunner.js seinen Worker (combat.worker.js) relativ zu
// sich selbst findet und dieselbe Aenderung IM Worker-Thread gilt.
//
// Zweistufig wie make_messbuild_salve.mjs: setzt auf dem kumulativen Messbuild auf.
//   node make_messbuild_kum.mjs  /tmp/mb_kum  --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_korr.mjs /tmp/mb_kum  /tmp/mb_korr1 --korr=1
//
// Die Konstante wirkt ausschliesslich in combatFleetPower()/combatFleetPowerBase() (combat.ts
// Z. 395/416). Sie beruehrt den RAID NICHT - raids.ts Z. 333-343 rechnet combinedPower inline
// ueber baseStats() ohne Korrektur.
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const SRC = resolve(args[0] || '');
const OUT = resolve(args[1] || './messbuild_korr');
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};
const KORR = Number(opt('korr', '8'));
if (!Number.isFinite(KORR) || KORR <= 0) throw new Error('--korr=<zahl> fehlt oder ist unbrauchbar');
if (!SRC || !existsSync(SRC)) throw new Error('Quell-Messbuild fehlt - erst make_messbuild_kum.mjs');

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(SRC, OUT, { recursive: true });

const f = `${OUT}/game/data/combatConstants.js`;
const txt = readFileSync(f, 'utf8');
const re = /export const MULTI_TARGET_POWER_CORRECTION = [\d.]+;/;
if (!re.test(txt)) {
  // Bewusst harter Abbruch statt stiller Ausweichwert (Messregel 15): laeuft der Patch ins Leere,
  // misst der naechste Lauf unbemerkt den Ausgangswert.
  throw new Error('MULTI_TARGET_POWER_CORRECTION nicht gefunden - Quellcode geaendert? Patch nachziehen.');
}
writeFileSync(f, txt.replace(re, `export const MULTI_TARGET_POWER_CORRECTION = ${KORR};`));

console.log(`Messbuild: ${OUT}`);
console.log(`  MULTI_TARGET_POWER_CORRECTION: ${KORR} (Quelle: ${SRC})`);
console.log('  Quellcode unberuehrt.');
