// Erzeugt den Messbuild fuer den R14-Abnahmetest (run_r14_delta.mjs).
//
// Gleiches Verfahren wie make_messbuild_44.mjs: der QUELLCODE bleibt unveraendert, variiert wird
// ausschliesslich eine KOMPILIERTE Stelle in einer Kopie des dist-Baums. Der ganze Baum wird
// kopiert, damit combatRunner.js seinen Worker (combat.worker.js) relativ zu sich selbst findet
// und dieselbe Aenderung auch IM Worker-Thread gilt.
//
// Variante: stackAggregateThresholdFor() liefert 1e9 - damit liegt KEIN Stapel mehr ueber der
// Schwelle, alles laeuft ueber den Einzel-Pfad (fireShots()). Das ist die Referenz-Seite des
// Abnahmetests: nach der R14-Reparatur muessen beide Seiten zusammenfallen.
//
// WICHTIG: vorher im Server `npx tsc` laufen lassen - der Messbuild ist eine Kopie von dist/,
// ohne frischen Build kopiert man den alten Stand (Messregel 1).
//
// Aufruf: node make_messbuild_r14.mjs
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('../../server/dist');
const TARGET = resolve('.', 'messbuild_r14_noagg');

const ANCHOR = `export function stackAggregateThresholdFor(typeId) {
    return STACK_AGGREGATE_THRESHOLD_BY_TYPE[typeId] ?? STACK_AGGREGATE_THRESHOLD;
}`;
const PATCHED = `export function stackAggregateThresholdFor(typeId) {
    return 1e9; // MESSBUILD R14: Aggregation komplett aus, alles laeuft ueber den Einzel-Pfad
}`;

if (existsSync(TARGET)) rmSync(TARGET, { recursive: true });
cpSync(DIST, TARGET, { recursive: true });

const file = resolve(TARGET, 'game/data/combatConstants.js');
const src = readFileSync(file, 'utf8');
if (!src.includes(ANCHOR)) throw new Error('Anker stackAggregateThresholdFor nicht gefunden');
writeFileSync(file, src.replace(ANCHOR, PATCHED));

console.log(`messbuild_r14_noagg -> ${TARGET}   [stackAggregateThresholdFor = 1e9]`);
console.log('Quellcode unberuehrt:', resolve('../../server/src/game/data/combatConstants.ts'));
