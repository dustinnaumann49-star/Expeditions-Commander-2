// DECKEL-SWEEP - WIRD DIE VERLUSTKURVE FLACH, WENN DIE BEIDEN OBERGRENZEN STEIGEN?
//
// !!! MESSBUILD-WERTE. Quellcode unberuehrt.                                                  !!!
//
// ANSCHLUSS AN massenfrage.txt: dort ist das Aggregat als Ursache ausgeschlossen (98 % des
// Absturzes von 63,4 auf 0,1 % passieren auch unaggregiert). Uebrig bleiben zwei Konstanten im
// Einzelpfad, die zusammen eine ABSOLUTE Obergrenze an Abschuessen je Runde setzen:
//     OVERKILL_MAX_CASCADE (5) x MAX_SHOTS_PER_UNIT (50) = 250 Einheiten je Runde und Schuetze.
// Weil diese Zahl absolut ist, faellt ihr ANTEIL mit jeder weiteren gebauten Einheit. Das ist die
// Quelle des Masse-Vorteils. Der Plan hat es am 17.08.2026 notiert, aber nie gemessen, ob sich die
// Kurve durch Anheben der beiden Werte begradigen laesst.
//
// ZIELGROESSE IST NICHT DIE HOEHE DER VERLUSTE, SONDERN DIE STEIGUNG DER KURVE. Der Gegner ist auf
// die Flottenmacht skaliert; eine massstabsneutrale Engine muesste ueber die ganze Leiter
// ungefaehr dieselbe Quote liefern. Gemessen wird deshalb die SPANNE zwischen kleinster und
// groesster Zelle - je flacher, desto weniger lohnt sich blosse Masse.
//
// ZWEITES, GLEICH WICHTIGES KRITERIUM: "nie Totalverlust". Entscheidung 1 wurde genau dafuer
// gebaut. Eine Variante, die die Kurve begradigt, indem sie kleine Flotten ausloescht, ist keine
// Loesung - die Spalte "total %" bei n=90 ist ein Abbruchkriterium, keine Randnotiz.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const RUNS = Number(process.argv[2] || 40);
const OUT = process.argv[3] || 'deckel.txt';
const HIER = new URL('.', import.meta.url).pathname;
const LEITER = [90, 150, 400, 1000, 2500];

// Kaskade x Schuesse als GITTER, weil die beiden Konstanten sich MULTIPLIZIEREN - wer nur eine
// anhebt, laeuft in die andere und misst deren Deckel statt der eigenen Aenderung.
const VARIANTEN = [
  { id: 'V0', text: 'Ist-Zustand', kaskade: null, schuesse: null },
  { id: 'V1', text: 'nur Kaskade 25', kaskade: 25, schuesse: null },
  { id: 'V2', text: 'nur Kaskade 50', kaskade: 50, schuesse: null },
  { id: 'V3', text: 'nur Schuesse 250', kaskade: null, schuesse: 250 },
  { id: 'V4', text: 'Kaskade 25 + Schuesse 250', kaskade: 25, schuesse: 250 },
  { id: 'V5', text: 'Kaskade 50 + Schuesse 500', kaskade: 50, schuesse: 500 },
];

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
const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.30 * 1.75);
const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
const bossStats = { waffen: b.waffen*m.waffen, schild: b.schild*m.schild, panzerung: b.panzerung*m.panzerung };
let lostCount=0, lostValue=0, rounds=0, total=0;
const t0 = Date.now();
for (let i=0;i<RUNS;i++) {
  const r = await runner.runCombatInWorker({ sideAShips: fleet, sideBShips: { [cc.ADMIRAL_BOSS_ID]: 1 },
    sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats }, research: state.research,
    playerClass: state.playerClass, kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none' });
  const surv = {}; Object.keys(fleet).forEach((id) => surv[id] = r.survivorsA[id] || 0);
  const lost = startCount - Object.values(surv).reduce((a,b)=>a+b,0);
  lostCount += lost; if (lost >= startCount) total++;
  lostValue += startValue - fleetValue(surv);
  rounds += r.roundsFought;
}
console.log(JSON.stringify({ n, startCount, rounds: rounds/RUNS, lostPct: 100*lostCount/RUNS/startCount,
  totalPct: 100*total/RUNS, msPerRun: (Date.now()-t0)/RUNS }));
process.exit(0);
`;

const ZELLE_DATEI = resolve(mkdtempSync(resolve(tmpdir(), 'deckel-')), 'zelle.mjs');
writeFileSync(ZELLE_DATEI, ZELLE);

const zeilen = [];
const sag = (s) => { console.log(s); zeilen.push(s); };
sag('=== DECKEL-SWEEP: LAESST SICH DIE VERLUSTKURVE BEGRADIGEN? ===');
sag(`Mischflotte, Gegner auf die Flottenmacht skaliert (x1,30 x1,75), Profil voll, ${RUNS} Laeufe je Zelle.`);
sag('Eine massstabsneutrale Engine muesste ueber die ganze Leiter dieselbe Quote liefern.');
sag('"total %" = Anteil der Laeufe mit VOLLSTAENDIGEM Verlust - Abbruchkriterium aus Entscheidung 1.');
sag('MESSBUILD-WERTE, kein Repo-Stand.');
sag('');

const zus = [];
for (const v of VARIANTEN) {
  const build = `/tmp/deckel_${v.id}/dist`;
  const a = [resolve(HIER, 'make_messbuild_aggregat.mjs'), build];
  if (v.kaskade !== null) a.push(`--kaskade=${v.kaskade}`);
  if (v.schuesse !== null) a.push(`--schuesse=${v.schuesse}`);
  execFileSync('node', a, { stdio: 'pipe' });

  const werte = LEITER.map((n) => JSON.parse(execFileSync('node', [ZELLE_DATEI], {
    env: { ...process.env, MESSBUILD: build, N: String(n), RUNS: String(RUNS) },
    encoding: 'utf8', maxBuffer: 1 << 24,
  }).trim().split('\n').pop()));

  const kask = v.kaskade ?? 5;
  const schuss = v.schuesse ?? 50;
  sag(`--- ${v.id} ${v.text}  (Kaskade ${kask} x Schuesse ${schuss} = ${kask * schuss} Abschuesse/Runde) ---`);
  sag('    n  Einheiten   Runden  Verlust %   total %   ms/Lauf');
  werte.forEach((w) => sag(
    `${String(w.n).padStart(5)} ${String(w.startCount).padStart(10)} ${w.rounds.toFixed(1).padStart(8)} `
    + `${w.lostPct.toFixed(1).padStart(10)} % ${w.totalPct.toFixed(0).padStart(8)} % ${w.msPerRun.toFixed(0).padStart(9)}`));
  const spanne = werte[0].lostPct - werte[werte.length - 1].lostPct;
  const totalKlein = werte[0].totalPct;
  sag(`  SPANNE ueber die Leiter: ${spanne.toFixed(1)} Punkte   Totalverlust bei n=90: ${totalKlein.toFixed(0)} %`
    + `${totalKlein > 0 ? '   VERSTOSS gegen "nie Totalverlust"' : ''}`);
  sag('');
  zus.push({ v, spanne, totalKlein, werte });
}

sag('=== ZUSAMMENFASSUNG ===');
sag('Variante                        Abschuesse/Runde  Spanne   n=90 Verl.  n=2500 Verl.  total n=90');
zus.forEach((z) => sag(
  `${(z.v.id + ' ' + z.v.text).padEnd(32)}${String((z.v.kaskade ?? 5) * (z.v.schuesse ?? 50)).padStart(12)}`
  + `${z.spanne.toFixed(1).padStart(10)}${z.werte[0].lostPct.toFixed(1).padStart(12)} %`
  + `${z.werte[z.werte.length - 1].lostPct.toFixed(1).padStart(13)} %${z.totalKlein.toFixed(0).padStart(10)} %`));

writeFileSync(OUT, zeilen.join('\n') + '\n');
console.log(`\nGeschrieben: ${OUT}`);
