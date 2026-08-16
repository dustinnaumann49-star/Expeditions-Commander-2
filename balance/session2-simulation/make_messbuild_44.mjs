// Erzeugt die Messbuilds fuer Entscheidung 4.4 (Block B, Schritt 5).
//
// Gleiches Verfahren wie bei M3 (Rundendeckel, siehe run_admiral_roundcap.mjs): der QUELLCODE
// bleibt unveraendert, variiert wird ausschliesslich die KOMPILIERTE Konstante in einer Kopie des
// dist-Baums. Der ganze Baum wird kopiert, damit combatRunner.js seinen Worker (combat.worker.js)
// relativ zu sich selbst findet und dieselbe Aenderung auch IM Worker-Thread gilt.
//
// Varianten (aus der Code-Pruefung vom 17.08.2026, siehe Messkasten bei 4.4):
//   V1 = nur RAPIDFIRE.piratenadmiral auf die tatsaechlich erlaubten Typen umgestellt.
//        Die Mehrfachziel-Salve ist hier NICHT aktiv - sie haengt an getZielerfassungAccuracy(),
//        die ohne ZIELERFASSUNG_BASE-Eintrag 0 liefert. Wirkt allein ueber die Folgeschuss-Kette.
//   V2 = V1 + ZIELERFASSUNG_BASE.piratenadmiral = 0,35 + piratenadmiral in
//        MULTI_TARGET_VOLLEY_SHIPS. Erst hier feuert die Salve ueberhaupt.
//   V3 = wie V2, aber RAPIDFIRE ueber ALLE zehn Typen aus ADMIRAL_ALLOWED_SHIP_IDS
//        (sonst waeren Imperator/Salvenschiffe/Sandronator praktisch unbeschiessbar, weil der
//        Boss bei nicht leerem RF-Pool ausschliesslich daraus zielt).
//   V2b = wie V2, aber ZIELERFASSUNG_BASE 0,55 (Imperator-Niveau) - Empfindlichkeitspruefung.
//
// Aufruf: node make_messbuild_44.mjs
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('../../server/dist');
const ROOT = resolve('.');

const RF_TODAY = `    piratenadmiral: {
        leicht: 10,
        schwer: 8
    },`;

// Vorschlag aus dem Plan (Entscheidung 4.4), sechs Typen.
const RF_SIX = `    piratenadmiral: {
        kreuzer: 5,
        schlachtschiff: 5,
        bomber: 5,
        schlachtkreuzer: 4,
        zerstoerer: 4,
        reaper: 3
    },`;

// Alle zehn Typen aus ADMIRAL_ALLOWED_SHIP_IDS.
const RF_TEN = `    piratenadmiral: {
        kreuzer: 5,
        schlachtschiff: 5,
        bomber: 5,
        schlachtkreuzer: 4,
        zerstoerer: 4,
        reaper: 3,
        sandronator: 3,
        salvenkreuzer: 3,
        salvendreadnought: 3,
        imperator: 3
    },`;

const VOLLEY_TODAY = `export const MULTI_TARGET_VOLLEY_SHIPS = new Set(['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'sentinelkanone', 'ultimatekanone']);`;
const VOLLEY_NEW = `export const MULTI_TARGET_VOLLEY_SHIPS = new Set(['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'sentinelkanone', 'ultimatekanone', 'piratenadmiral']);`;

const ZIEL_ANCHOR = `export const ZIELERFASSUNG_BASE = {
    schwer: 0.25,`;

const VARIANTS = {
  V1:  { rf: RF_SIX, volley: false, ziel: null },
  V2:  { rf: RF_SIX, volley: true,  ziel: 0.35 },
  V3:  { rf: RF_TEN, volley: true,  ziel: 0.35 },
  V2b: { rf: RF_SIX, volley: true,  ziel: 0.55 },
};

function patch(name, cfg) {
  const target = resolve(ROOT, `messbuild_44_${name}`);
  if (existsSync(target)) rmSync(target, { recursive: true });
  cpSync(DIST, target, { recursive: true });

  const file = resolve(target, 'game/data/combatConstants.js');
  let src = readFileSync(file, 'utf8');
  const checks = [];

  if (!src.includes(RF_TODAY)) throw new Error(`${name}: RAPIDFIRE-Anker nicht gefunden`);
  src = src.replace(RF_TODAY, cfg.rf);
  checks.push('RAPIDFIRE');

  if (cfg.volley) {
    if (!src.includes(VOLLEY_TODAY)) throw new Error(`${name}: Volley-Anker nicht gefunden`);
    src = src.replace(VOLLEY_TODAY, VOLLEY_NEW);
    checks.push('MULTI_TARGET_VOLLEY_SHIPS');
  }
  if (cfg.ziel !== null) {
    if (!src.includes(ZIEL_ANCHOR)) throw new Error(`${name}: ZIELERFASSUNG-Anker nicht gefunden`);
    src = src.replace(ZIEL_ANCHOR, `export const ZIELERFASSUNG_BASE = {\n    piratenadmiral: ${cfg.ziel},\n    schwer: 0.25,`);
    checks.push(`ZIELERFASSUNG_BASE=${cfg.ziel}`);
  }

  writeFileSync(file, src);
  console.log(`${name.padEnd(4)} -> ${target}   [${checks.join(', ')}]`);
}

Object.entries(VARIANTS).forEach(([name, cfg]) => patch(name, cfg));
console.log('\nQuellcode unberuehrt:', resolve('../../server/src/game/data/combatConstants.ts'));
