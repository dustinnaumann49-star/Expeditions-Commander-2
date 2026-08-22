// Erzeugt einen ZWEITSTUFIGEN Messbuild fuer Entscheidung 19 (Salvenschiffe).
// Eingang ist ein bereits fertiger kumulativer Messbuild:
//   node make_messbuild_kum.mjs   /tmp/mb_kum   --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_salve.mjs /tmp/mb_kum   /tmp/mb_salve  --je=500 --deckel=12
// Der Quellcode im Repo wird NICHT angefasst.
//
// WAS GEAENDERT WIRD (Weg 2 aus Entscheidung 19):
// Die Mehrfachziel-Salve trifft heute EINEN Vertreter je praesentem Typ - hoechstens also so viele
// Treffer, wie es anfaellige TYPEN gibt (real 2-3). Dadurch waechst sie NICHT mit der Feindflotte:
// bei 200.000 Reapern trifft ein Salvendreadnought weiterhin genau einen davon.
// Der Patch macht die Zahl der Treffer JE TYP von der Stapelgroesse abhaengig:
//     treffer_je_typ = min(DECKEL, ceil(einheiten_dieses_typs / JE))
// JE = wieviele Feindeinheiten eines Typs auf einen zusaetzlichen Treffer kommen.
// DECKEL = harte Obergrenze je Typ, damit die Salve bei Millionenflotten nicht explodiert.
// Mit JE = unendlich / DECKEL = 1 verhaelt sich der Build exakt wie der Ist-Zustand.
//
// EINZELZIELE und AGGREGAT-STAPEL werden beide behandelt: ab
// STACK_AGGREGATE_THRESHOLD_BY_TYPE liegen grosse Gegnermengen als Stapel vor, und genau dort
// entsteht das Problem. Ein Patch, der nur die Einzelziele erwischt, wuerde im Endgame nichts tun.
import fs from 'node:fs';
import path from 'node:path';

const [src, dst, ...rest] = process.argv.slice(2);
if (!src || !dst) throw new Error('Aufruf: node make_messbuild_salve.mjs <kum-messbuild> <ziel> [--je=500] [--deckel=12]');
const arg = (name, def) => {
  const hit = rest.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : def;
};
const JE = arg('je', 500);
const DECKEL = arg('deckel', 12);

fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });

const p = path.join(dst, 'game/combat.js');
let s = fs.readFileSync(p, 'utf8');

const alt = `                        const seenTypes = new Set();
                        volleyTargets = [];
                        for (const t of rfPool) {
                            if (!seenTypes.has(t.typeId)) {
                                seenTypes.add(t.typeId);
                                volleyTargets.push(t);
                            }
                        }
                        volleyAggregates = rfAggs;`;

const neu = `                        // MESSBUILD Entscheidung 19: Treffer je Typ haengen an der Stapelgroesse.
                        const SALVE_JE = ${JE};
                        const SALVE_DECKEL = ${DECKEL};
                        const proTyp = new Map();
                        for (const t of rfPool) {
                            const l = proTyp.get(t.typeId);
                            if (l) l.push(t); else proTyp.set(t.typeId, [t]);
                        }
                        volleyTargets = [];
                        proTyp.forEach((liste) => {
                            const treffer = Math.min(SALVE_DECKEL, Math.max(1, Math.ceil(liste.length / SALVE_JE)));
                            for (let i = 0; i < treffer; i++) volleyTargets.push(liste[i % liste.length]);
                        });
                        volleyAggregates = [];
                        for (const a of rfAggs) {
                            const treffer = Math.min(SALVE_DECKEL, Math.max(1, Math.ceil(aggAliveCount(a) / SALVE_JE)));
                            for (let i = 0; i < treffer; i++) volleyAggregates.push(a);
                        }`;

if (!s.includes(alt)) throw new Error('Salven-Block in combat.js nicht gefunden - Build passt nicht zur erwarteten Fassung.');
s = s.replace(alt, neu);
fs.writeFileSync(p, s);

console.log(`Salven-Messbuild: ${dst}`);
console.log(`  Weg 2: Treffer je Typ = min(${DECKEL}, ceil(Einheiten / ${JE}))`);
console.log('  Einzelziele UND Aggregat-Stapel gepatcht. Quellcode unberuehrt.');
