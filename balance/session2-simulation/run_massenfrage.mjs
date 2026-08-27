// MASSENFRAGE - TRENNT DEN AGGREGAT-EFFEKT VOM MODELL-EFFEKT
//
// !!! MESSBUILD-WERTE. Faehrt dieselbe Leiter zweimal gegen zwei dist-KOPIEN.                 !!!
// !!! Quellcode unberuehrt.                                                                   !!!
//
// AUSGANGSBEFUND (aggregate_threshold_44.txt, V0): die Verlustquote faellt von 65,9 % bei 405
// Schiffen auf 2,4 % bei 4.500 - obwohl der Gegner AUF DIE FLOTTENMACHT SKALIERT ist und die Quote
// deshalb ungefaehr konstant bleiben muesste. Grosse Flotten sind bei gleichem Kraefteverhaeltnis
// dramatisch robuster.
//
// WAS BISHER NICHT ZU TRENNEN WAR: der Sprung an der Schwelle ist klein (99 -> 101: 57,6 -> 52,7 %),
// der Absturz danach gross - und schon zwischen 90 und 99, beide UNAGGREGIERT, faellt die Quote um
// acht Punkte. Es gibt also einen Groesseneffekt, der nicht am Aggregat haengt. Wie er sich
// aufteilt, konnte niemand sagen, weil n=1000 mit den heutigen Schwellen (50/100/500) zwangslaeufig
// aggregiert laeuft.
//
// DIESES SKRIPT FAEHRT DIE LEITER ZWEIMAL:
//   Spalte IST      - Schwellen wie im Code
//   Spalte EINZELN  - Schwelle 100.000 fuer alle Typen, also nie aggregiert
// Differenz = Aggregat-Effekt. Was in BEIDEN Spalten faellt = Kampfmodell.
//
// EINGEBAUTE GEGENPROBE: die Zellen n=90 und n=99 laufen in BEIDEN Builds unaggregiert. Sie
// muessen deshalb innerhalb der Streuung uebereinstimmen. Tun sie das nicht, veraendert der Patch
// mehr als die Schwelle und die ganze Messung ist wertlos - das faellt dann hier auf und nicht
// erst in der Auswertung.
//
// RECHENZEIT wird je Zelle mitprotokolliert. Die gestaffelten Schwellen kamen am 30.07.2026 nach
// einem echten Rueckstau-Vorfall; ob eine Schwelle von 4.000-5.000 tragbar waere, ist eine
// Laufzeitfrage. Sie faellt hier gratis ab, weil die Einzel-Zellen genau diese Last erzeugen.
//
// Aufruf: node run_massenfrage.mjs [laeufe] [ausgabedatei]
//   Setzt voraus:  node make_messbuild_aggregat.mjs /tmp/agg_ist/dist
//                  node make_messbuild_aggregat.mjs /tmp/agg_einzeln/dist --schwelle=100000
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const RUNS = Number(process.argv[2] || 40);
const OUT = process.argv[3] || 'massenfrage.txt';
const HIER = new URL('.', import.meta.url).pathname;

// Leiter wie in run_aggregate_threshold_44.mjs, oben um 2500 erweitert: der Ausgangsbefund endet
// bei 1000, und die Frage ist gerade, ob die Kurve dort aufhoert oder weiterlaeuft.
const LEITER = [90, 99, 101, 150, 400, 1000, 2500];

const ZELLE = `
import { combat, runner, cc, ships, stateFor, value } from '${resolve(HIER, 'lib4.mjs')}';
const BASE = { kreuzer:1, schlachtschiff:1, bomber:1, schlachtkreuzer:0.5, zerstoerer:0.5, reaper:0.5 };
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s,[id,n]) => s + n*shipValue(id), 0);
const n = Number(process.env.N), RUNS = Number(process.env.RUNS);
const state = stateFor('voll', 1);
const pr = combat.computePirateResearch(state.research);
const m = { waffen: combat.waffenMultiplier(pr), schild: combat.schildMultiplier(pr), panzerung: combat.panzerungMultiplier(pr) };
const fleet = Object.fromEntries(Object.entries(BASE).map(([id,f]) => [id, Math.round(n*f)]));
const startCount = Object.values(fleet).reduce((a,b)=>a+b,0);
const startValue = fleetValue(fleet);
const agg = Object.entries(fleet).filter(([id,c]) => c > cc.stackAggregateThresholdFor(id)).map(([id])=>id);
// Gegner EINMAL erzeugt und fuer alle Laeufe beider Builds identisch gehalten - er haengt nur an
// der Flottenmacht, nicht an der Schwelle. Wuerde er je Lauf neu gewuerfelt, mischte sich die
// Streuung des Generators in die Differenz, die hier gemessen werden soll.
const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.30 * 1.75);
const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
const bossStats = { waffen: b.waffen*m.waffen, schild: b.schild*m.schild, panzerung: b.panzerung*m.panzerung };
let lostCount=0, lostValue=0, rounds=0;
const t0 = Date.now();
for (let i=0;i<RUNS;i++) {
  const r = await runner.runCombatInWorker({ sideAShips: fleet, sideBShips: { [cc.ADMIRAL_BOSS_ID]: 1 },
    sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats }, research: state.research,
    playerClass: state.playerClass, kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none' });
  const surv = {}; Object.keys(fleet).forEach((id) => surv[id] = r.survivorsA[id] || 0);
  lostCount += startCount - Object.values(surv).reduce((a,b)=>a+b,0);
  lostValue += startValue - fleetValue(surv);
  rounds += r.roundsFought;
}
console.log(JSON.stringify({ n, startCount, aggCount: agg.length, rounds: rounds/RUNS,
  lostPct: 100*lostCount/RUNS/startCount, lostValue: lostValue/RUNS, msPerRun: (Date.now()-t0)/RUNS }));
process.exit(0);
`;

// Die Zelle laeuft als eigene Datei und nicht ueber `node -e`: mit --input-type=module lehnt
// Node 22 den Eval-Pfad ab (ERR_INPUT_TYPE_NOT_ALLOWED), und ein eigener Prozess je Zelle ist
// ohnehin noetig, damit MESSBUILD pro Build frisch greift - lib4.mjs loest den Pfad beim Import
// EINMAL auf, ein Wechsel im selben Prozess waere wirkungslos.
const ZELLE_DATEI = resolve(mkdtempSync(resolve(tmpdir(), 'massenfrage-')), 'zelle.mjs');
writeFileSync(ZELLE_DATEI, ZELLE);

function zelle(build, n) {
  const out = execFileSync('node', [ZELLE_DATEI], {
    env: { ...process.env, MESSBUILD: build, N: String(n), RUNS: String(RUNS) },
    encoding: 'utf8', maxBuffer: 1 << 24,
  });
  return JSON.parse(out.trim().split('\n').pop());
}

const zeilen = [];
const sag = (s) => { console.log(s); zeilen.push(s); };

sag('=== MASSENFRAGE: AGGREGAT-EFFEKT GEGEN MODELL-EFFEKT ===');
sag(`Mischflotte aus sechs Standardtypen, Gegner = generateAdmiralEncounter(Flottenmacht x 1,30 x 1,75),`);
sag(`Profil voll, allowRetreat aus, ${RUNS} Laeufe je Zelle. MESSBUILD-Werte.`);
sag(`Der Gegner ist auf die Flottenmacht SKALIERT - die Verlustquote sollte also ungefaehr`);
sag(`konstant bleiben. Tut sie das nicht, ist genau das der gesuchte Effekt.`);
sag('');
sag('    n   Einheiten | IST-ZUSTAND              | NIE AGGREGIERT          | Differenz');
sag('                  | agg  Verlust %  ms/Lauf  | Verlust %  ms/Lauf      | Punkte');

const daten = [];
for (const n of LEITER) {
  const a = zelle('/tmp/agg_ist/dist', n);
  const b = zelle('/tmp/agg_einzeln/dist', n);
  daten.push({ n, a, b });
  sag(
    `${String(n).padStart(5)} ${String(a.startCount).padStart(11)} |` +
    `${String(a.aggCount).padStart(4)} ${a.lostPct.toFixed(1).padStart(10)} % ${a.msPerRun.toFixed(0).padStart(8)} |` +
    `${b.lostPct.toFixed(1).padStart(10)} % ${b.msPerRun.toFixed(0).padStart(8)}      |` +
    `${(a.lostPct - b.lostPct).toFixed(1).padStart(8)}`
  );
}

sag('');
sag('--- GEGENPROBE: n=90 und n=99 laufen in BEIDEN Builds unaggregiert ---');
for (const d of daten.filter((x) => x.a.aggCount === 0)) {
  const diff = d.a.lostPct - d.b.lostPct;
  sag(`  n=${d.n}: ${d.a.lostPct.toFixed(1)} % gegen ${d.b.lostPct.toFixed(1)} %, Differenz ${diff.toFixed(1)} Punkte` +
    `${Math.abs(diff) > 5 ? '   ACHTUNG: der Patch veraendert mehr als die Schwelle' : '   (unauffaellig)'}`);
}

sag('');
sag('--- AUFTEILUNG DES ABSTURZES ---');
const erste = daten[0], letzte = daten[daten.length - 1];
const gesamt = erste.a.lostPct - letzte.a.lostPct;
const modell = erste.b.lostPct - letzte.b.lostPct;
sag(`  Gesamtabsturz IST     n=${erste.n} -> n=${letzte.n}: ${erste.a.lostPct.toFixed(1)} -> ${letzte.a.lostPct.toFixed(1)} % (${gesamt.toFixed(1)} Punkte)`);
sag(`  davon OHNE Aggregat   n=${erste.n} -> n=${letzte.n}: ${erste.b.lostPct.toFixed(1)} -> ${letzte.b.lostPct.toFixed(1)} % (${modell.toFixed(1)} Punkte)`);
sag(`  Anteil Kampfmodell: ${gesamt > 0 ? (100 * modell / gesamt).toFixed(0) : '-'} %   Anteil Aggregat: ${gesamt > 0 ? (100 * (gesamt - modell) / gesamt).toFixed(0) : '-'} %`);
sag('');
sag('--- RECHENZEIT: waere eine Schwelle von 4.000-5.000 tragbar? ---');
for (const d of daten) {
  sag(`  n=${String(d.n).padStart(4)} (${String(d.a.startCount).padStart(5)} Einheiten): aggregiert ${d.a.msPerRun.toFixed(0).padStart(5)} ms, einzeln ${d.b.msPerRun.toFixed(0).padStart(6)} ms` +
    `   Faktor ${(d.b.msPerRun / Math.max(1, d.a.msPerRun)).toFixed(1)}`);
}

writeFileSync(OUT, zeilen.join('\n') + '\n');
console.log(`\nGeschrieben: ${OUT}`);
