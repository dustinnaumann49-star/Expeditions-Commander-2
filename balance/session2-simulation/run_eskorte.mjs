// DIE ESKORTE - WIE GROSS IST DER KAPITAENS-EFFEKT IM ECHTEN SPIEL?
//
// !!! MESSBUILD-WERTE fuer die Sweep-Zellen. Die Zelle "0.55 mit Eskorte" laeuft gegen den    !!!
// !!! UNVERAENDERTEN Build und ist damit der echte Spielzustand.                              !!!
//
// WARUM DIESE MESSUNG NOETIG IST - EIN EINGESTANDENER MANGEL DER BISHERIGEN ZELLEN:
// Alle Messungen vom 27./28.08.2026 (massenfrage.txt, deckel.txt, probe_bossverlust.mjs,
// gegenprobe.txt) haben `sideBShips = { admiral: 1 }` gesetzt und damit die ESKORTE weggelassen.
// Das war richtig, um die Boss-Mechanik zu isolieren - aber es ist NICHT das Spiel. Im Code gilt:
//     ADMIRAL_STAT_SHARE = 0.55
// Nur 55 % der Gegnermacht sitzen auf dem Kapitaen, 45 % auf einer Eskorte aus Schlachtschiffen,
// Schlachtkreuzern, Zerstoerern und Reapern (ADMIRAL_ESCORT_POOL). Die Eskorte ist "verteilte
// Macht" - und genau die hat sich in der Gegenprobe als massstabsneutral erwiesen.
// Der gemessene Effekt duerfte im echten Spiel also SCHWAECHER sein als bisher berichtet. Wie
// viel schwaecher, entscheidet, ob ueberhaupt etwas zu tun ist.
//
// ADMIRAL_STAT_SHARE IST DER DIREKTE REGLER: er bestimmt, welcher Anteil der Gegnermacht in die
// verschwendende Form geht (Kapitaen, Schaden je Treffer bei 13,6 Mio gedeckelt) und welcher in
// die wirksame (Eskorte, viele mittlere Schuesse ohne Deckel-Verlust).
//
// ZIELGROESSE IST WIE ZUVOR DIE STEIGUNG, NICHT DIE HOEHE. Der Gegner ist auf die Flottenmacht
// skaliert; eine massstabsneutrale Paarung liefert ueber die ganze Leiter dieselbe Quote.
// GELESEN WIRD AB n=150: die Zelle n=90 wechselt bei starker Eskorte das Regime (der Spieler wird
// ueberrannt), und eine Spanne ueber eine Leiter mit Regimewechsel misst den Wechsel statt der
// Steigung - genau die Falle, die in der Gegenprobe fast zum falschen Schluss gefuehrt haette.
//
// Aufruf: node run_eskorte.mjs [laeufe] [ausgabedatei]
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const RUNS = Number(process.argv[2] || 25);
const OUT = process.argv[3] || 'eskorte.txt';
const HIER = new URL('.', import.meta.url).pathname;
const LEITER = [90, 150, 400, 1000, 2500];

const VARIANTEN = [
  { id: 'boss_only', share: null, eskorte: false, text: 'nur Kapitaen (bisherige Zellen)' },
  { id: 's055', share: null, eskorte: true, text: 'ECHTES SPIEL, share 0,55' },
  { id: 's035', share: 0.35, eskorte: true, text: 'share 0,35' },
  { id: 's020', share: 0.20, eskorte: true, text: 'share 0,20' },
  { id: 's005', share: 0.05, eskorte: true, text: 'share 0,05' },
  // KOERNIGKEIT statt nur Verteilung - siehe --eskorte_fein in make_messbuild_aggregat.mjs.
  { id: 'f055', share: null, fein: true, eskorte: true, text: 'share 0,55 + feine Eskorte' },
  { id: 'f035', share: 0.35, fein: true, eskorte: true, text: 'share 0,35 + feine Eskorte' },
];

const ZELLE = `
import { combat, runner, cc, ships, stateFor, value } from '${resolve(HIER, 'lib4.mjs')}';
const BASE = { kreuzer:1, schlachtschiff:1, bomber:1, schlachtkreuzer:0.5, zerstoerer:0.5, reaper:0.5 };
const n = Number(process.env.N), RUNS = Number(process.env.RUNS);
const MIT_ESKORTE = process.env.ESKORTE === '1';
const state = stateFor('voll', 1);
const pr = combat.computePirateResearch(state.research);
const m = { waffen: combat.waffenMultiplier(pr), schild: combat.schildMultiplier(pr), panzerung: combat.panzerungMultiplier(pr) };
const fleet = Object.fromEntries(Object.entries(BASE).map(([id,f]) => [id, Math.round(n*f)]));
const startCount = Object.values(fleet).reduce((a,b)=>a+b,0);
const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.30 * 1.75);
const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
const bossStats = { waffen: b.waffen*m.waffen, schild: b.schild*m.schild, panzerung: b.panzerung*m.panzerung };
// MIT Eskorte wird die vollstaendige Begegnung uebergeben (npcShips enthaelt Kapitaen UND Eskorte),
// OHNE nur der Kapitaen - so wie in allen frueheren Zellen.
const sideBShips = MIT_ESKORTE ? enc.npcShips : { [cc.ADMIRAL_BOSS_ID]: 1 };
const gegnerStart = Object.values(sideBShips).reduce((a,b)=>a+b,0);
let lost=0, rounds=0, gegnerVerlust=0, total=0;
const t0 = Date.now();
for (let i=0;i<RUNS;i++) {
  const r = await runner.runCombatInWorker({ sideAShips: fleet, sideBShips,
    sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats }, research: state.research,
    playerClass: state.playerClass, kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none' });
  const l = startCount - Object.values(r.survivorsA).reduce((a,c)=>a+c,0);
  lost += l; if (l >= startCount) total++;
  rounds += r.roundsFought;
  gegnerVerlust += gegnerStart - Object.values(r.survivorsB).reduce((a,c)=>a+c,0);
}
console.log(JSON.stringify({ n, startCount, gegnerStart, rounds: rounds/RUNS,
  verlustPct: 100*lost/RUNS/startCount, totalPct: 100*total/RUNS,
  gegnerVerlustPct: 100*gegnerVerlust/RUNS/Math.max(1,gegnerStart), msPerRun: (Date.now()-t0)/RUNS }));
process.exit(0);
`;
const ZELLE_DATEI = resolve(mkdtempSync(resolve(tmpdir(), 'eskorte-')), 'zelle.mjs');
writeFileSync(ZELLE_DATEI, ZELLE);

const zeilen = [];
const sag = (s) => { console.log(s); zeilen.push(s); };
sag('=== DIE ESKORTE: WIE GROSS IST DER KAPITAENS-EFFEKT IM ECHTEN SPIEL? ===');
sag(`Mischflotte, Gegner auf Flottenmacht x1,30 x1,75 skaliert, Profil voll, ${RUNS} Laeufe je Zelle.`);
sag('ADMIRAL_STAT_SHARE bestimmt, welcher Anteil der Gegnermacht auf dem Kapitaen sitzt (Rest Eskorte).');
sag('Steigung ab n=150 lesen - n=90 kann das Regime wechseln (Spieler wird ueberrannt).');
sag('');

const alle = [];
for (const v of VARIANTEN) {
  const build = `/tmp/esk_${v.id}/dist`;
  const a = [resolve(HIER, 'make_messbuild_aggregat.mjs'), build];
  if (v.share !== null) a.push(`--admiral_share=${v.share}`);
  if (v.fein) a.push('--eskorte_fein');
  execFileSync('node', a, { stdio: 'pipe' });

  const werte = LEITER.map((n) => JSON.parse(execFileSync('node', [ZELLE_DATEI], {
    env: { ...process.env, MESSBUILD: build, N: String(n), RUNS: String(RUNS), ESKORTE: v.eskorte ? '1' : '0' },
    encoding: 'utf8', maxBuffer: 1 << 24,
  }).trim().split('\n').pop()));

  sag(`--- ${v.id}: ${v.text} ---`);
  sag('    n   eigene   Gegner  Runden  eig. Verlust  total %  Gegn. Verlust  ms/Lauf');
  werte.forEach((w) => sag(
    `${String(w.n).padStart(5)} ${String(w.startCount).padStart(8)} ${String(w.gegnerStart).padStart(8)} `
    + `${w.rounds.toFixed(1).padStart(7)} ${w.verlustPct.toFixed(1).padStart(12)} % ${w.totalPct.toFixed(0).padStart(7)} % `
    + `${w.gegnerVerlustPct.toFixed(1).padStart(12)} % ${w.msPerRun.toFixed(0).padStart(8)}`));
  // Steigung ab n=150 - siehe Kopf.
  const ab150 = werte.filter((w) => w.n >= 150);
  const steigung = ab150[0].verlustPct - ab150[ab150.length - 1].verlustPct;
  sag(`  ABFALL n=150 -> n=2500: ${steigung.toFixed(1)} Punkte` +
    `${Math.abs(steigung) < 10 ? '   (flach - massstabsneutral)' : '   (faellt - Masse lohnt sich)'}`);
  sag('');
  alle.push({ v, werte, steigung });
}

sag('=== VERGLEICH: VERLUSTQUOTE JE ZELLE ===');
sag('Variante                          ' + LEITER.map((n) => String(n).padStart(8)).join('') + '   Abfall ab 150');
alle.forEach((a) => sag(
  `${(a.v.id + ' ' + a.v.text).slice(0, 33).padEnd(34)}`
  + a.werte.map((w) => `${w.verlustPct.toFixed(1).padStart(7)}%`).join('')
  + `${a.steigung.toFixed(1).padStart(15)}`));

writeFileSync(OUT, zeilen.join('\n') + '\n');
console.log(`\nGeschrieben: ${OUT}`);
