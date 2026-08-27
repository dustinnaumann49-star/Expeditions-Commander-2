// MESSUNG ZUM REICHEN FUND (k5_quellen.txt Abschnitt 11)
//
// !!! MESSBUILD-WERTE, KEIN REPO-STAND. Baut sich seine Builds selbst ueber            !!!
// !!! make_messbuild_reicherfund.mjs und faehrt sim13_lauf.mjs als Unterprozess.       !!!
// !!! Es wird kein Spielcode veraendert.                                               !!!
//
// Aufruf:
//   node run_reicherfund.mjs [--n=20] [--tage=7] [--profil=aktiv] [--out=reicherfund.json]
//                            [--nur=d24_c008,d12_c008] [--k5=/tmp/k5/dist]
//
// ===================================================================================
// WARUM DIE STREUUNG UND NICHT DER MITTELWERT DIE ZIELGROESSE IST
// ===================================================================================
// Abschnitt 11 haelt ausdruecklich fest: "der eigentliche Einwand gegen die heutige Form ist
// nicht ihre Hoehe, sondern dass sie den Wochenertrag eines Spielers verdreifachen oder nicht
// kann, ohne dass er etwas anders gemacht haette." Protokolliert werden deshalb Mittel UND
// Streuung (SD, Variationskoeffizient, Spannweite Max/Min, Median) - und die Spannweite ist die
// Zahl, die die Aussage traegt, nicht der Variationskoeffizient.
//
// ===================================================================================
// NORMIERT LESEN: reicher_fund JE EINHEIT asteroid_mining
// ===================================================================================
// Die Zellen unterscheiden sich in der MISSIONSDAUER, und damit in der tatsaechlichen Farmzeit
// je Woche: bei 4-h-Missionen liegt zwischen Rueckkehr und Neustart bis zu eine Stunde Leerlauf
// (das Modell handelt stuendlich), bei 24-h-Missionen praktisch keine. Die absoluten Betraege
// sind dadurch NICHT direkt vergleichbar.
// `asteroid_mining` ist der Ertrag OHNE jeden Fund und damit exakt proportional zur wirklich
// geflogenen Farmzeit (farmRate * Schiffe * Stunden). Das Verhaeltnis reicher_fund /
// asteroid_mining ist deshalb der saubere Vergleichswert - dieselbe Regel wie "Belohnungszellen
// vor jedem Vergleich auf die vernichtete Feindmacht normieren".
// VORBEHALT, ausdruecklich: `reicher_fund` verdoppelt auch die bis dahin angesammelte
// ESKORTEN-PRAEMIE mit, die Praemie steht aber in einer eigenen Zeile. Das Verhaeltnis liegt
// dadurch systematisch UEBER dem, was die reine Mining-Rechnung erwarten laesst. Beide Zahlen
// werden ausgewiesen, damit der Unterschied sichtbar bleibt statt als Abweichung zu erscheinen.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};

const N = Number(opt('n', '20'));
const TAGE = Number(opt('tage', '7'));
const PROFIL = opt('profil', 'aktiv');
const K5 = resolve(opt('k5', '/tmp/k5/dist'));
const AUSGABE = opt('out', null);
const NUR = opt('nur', null)?.split(',').map((s) => s.trim()).filter(Boolean) || null;
const WURZEL = resolve(opt('wurzel', '/tmp/rfmess'));
const HIER = new URL('.', import.meta.url).pathname;

if (!existsSync(resolve(K5, 'game/missions.js'))) {
  throw new Error(`Kein instrumentierter Build unter ${K5} (erst make_messbuild_k5.mjs).`);
}

// ===================================================================================
// DIE ZELLEN
// ===================================================================================
// A: MISSIONSDAUER bei unveraenderter Chance. Dieser Regler FEHLT in Abschnitt 11, obwohl die
//    erste zu klaerende Frage an ihm haengt ("ist die Hoehe eine Folge der Verlaengerung").
// B: CHANCE bei heutiger Dauer - die drei Werte aus Abschnitt 11.
// C: FORM - fester Aufschlag statt Verdopplung, Hoehe gegen die gemessene Zelle d24_c008
//    kalibriert (siehe unten), damit nur die Streuung verglichen wird und nicht Niveau plus
//    Streuung gleichzeitig.
const ZELLEN = [
  { id: 'd24_c008', gruppe: 'A/B', dauer_h: 24, chance: 0.08, text: 'HEUTIGER CODE' },
  { id: 'd12_c008', gruppe: 'A', dauer_h: 12, chance: 0.08, text: 'Stand vor 28.07.2026' },
  { id: 'd04_c008', gruppe: 'A', dauer_h: 4, chance: 0.08, text: 'Stand vor 16.08.2026' },
  { id: 'd24_c004', gruppe: 'B', dauer_h: 24, chance: 0.04, text: 'halbe Chance' },
  { id: 'd24_c002', gruppe: 'B', dauer_h: 24, chance: 0.02, text: 'viertel Chance' },
  { id: 'd24_c000', gruppe: 'B', dauer_h: 24, chance: 0.0, text: 'NULLMESSUNG' },
  { id: 'd24_fest', gruppe: 'C', dauer_h: 24, chance: 0.0, aufschlag: 'kalibriert', text: 'fester Aufschlag' },
  // D: ZEITPUNKTUNABHAENGIGE FORM. Ein Treffer ist `voll_faktor` mal die nominale Gesamtausbeute
  //    wert statt eine Verdopplung des Angesammelten. Das Produkt chance*voll_faktor ist in allen
  //    vier Zellen 0,140 und gegen den GEMESSENEN Fund-Anteil von d24_c008 kalibriert (10,28 von
  //    3,06 Mrd Mining ueber 24 Checks). Der Erwartungswert ist dadurch konstant und die STREUUNG
  //    der einzige Unterschied zwischen den Zellen - viele kleine Funde streuen weniger als wenige
  //    grosse. Genau das macht die Streuung erstmals zu einem Regler statt zu einer Nebenwirkung.
  { id: 'v_p008', gruppe: 'D', dauer_h: 24, chance: 0.08, voll_faktor: 1.750, text: 'selten, sehr gross' },
  { id: 'v_p016', gruppe: 'D', dauer_h: 24, chance: 0.16, voll_faktor: 0.875, text: 'mittel' },
  { id: 'v_p024', gruppe: 'D', dauer_h: 24, chance: 0.24, voll_faktor: 0.583, text: 'haeufig, kleiner' },
  { id: 'v_p032', gruppe: 'D', dauer_h: 24, chance: 0.32, voll_faktor: 0.438, text: 'sehr haeufig, klein' },
];

// ===================================================================================
// GESCHLOSSENE ERWARTUNG - NUR ALS PLAUSIBILITAETSPRUEFUNG, NICHT ALS SOLLWERT
// ===================================================================================
// Modell direkt aus dem Code: accrueFarming() laeuft in tickMission() VOR der Check-Schleife,
// runRichFindCheck() verdoppelt danach den bis dahin angesammelten Betrag.
//   F_k = (F_{k-1} + c) * (1 + X_k),  X_k ~ Bernoulli(p)
// Exakte Momente daraus (kein Monte-Carlo):
//   E[F_k]   = (E[F_{k-1}] + c) * (1+p)
//   E[F_k^2] = (E[F^2_{k-1}] + 2c E[F_{k-1}] + c^2) * (1+3p)     weil (1+X)^2 = 1+3X
function momente(n, p, c = 1) {
  let m1 = 0, m2 = 0;
  for (let k = 0; k < n; k++) {
    const nm2 = (m2 + 2 * c * m1 + c * c) * (1 + 3 * p);
    m1 = (m1 + c) * (1 + p);
    m2 = nm2;
  }
  return { mittel: m1, sd: Math.sqrt(Math.max(0, m2 - m1 * m1)), ohne: n * c };
}

// ===================================================================================
// STREUUNGSMASSE
// ===================================================================================
function statistik(werte) {
  const v = werte.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  if (v.length === 0) return { n: 0 };
  const mittel = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = v.length > 1
    ? Math.sqrt(v.reduce((a, b) => a + (b - mittel) ** 2, 0) / (v.length - 1))
    : 0;
  const q = (t) => v[Math.min(v.length - 1, Math.floor(t * (v.length - 1)))];
  return {
    n: v.length, mittel, sd, cv: mittel > 0 ? sd / mittel : 0,
    min: v[0], max: v[v.length - 1], median: q(0.5),
    spanne: v[0] > 0 ? v[v.length - 1] / v[0] : Infinity,
    // Standardfehler des Mittels - entscheidet, ob zwei Zellen ueberhaupt trennbar sind.
    se: v.length > 1 ? sd / Math.sqrt(v.length) : 0,
  };
}

function baue(zelle, aufschlag) {
  const ziel = resolve(WURZEL, zelle.id, 'dist');
  const a = [resolve(HIER, 'make_messbuild_reicherfund.mjs'), K5, ziel,
    `--chance=${zelle.chance}`, `--dauer_h=${zelle.dauer_h}`];
  if (aufschlag > 0) a.push(`--aufschlag=${aufschlag}`);
  if (zelle.voll_faktor) a.push(`--voll_faktor=${zelle.voll_faktor}`);
  execFileSync('node', a, { stdio: 'pipe' });
  return ziel;
}

function fahre(zelle, build) {
  const werte = [];
  const tmp = resolve(WURZEL, zelle.id, 'lauf.json');
  for (let i = 0; i < N; i++) {
    execFileSync('node', [resolve(HIER, 'sim13_lauf.mjs'),
      `--build=${build}`, `--profil=${PROFIL}`, `--tage=${TAGE}`, `--out=${tmp}`], { stdio: 'pipe' });
    const roh = JSON.parse(readFileSync(tmp, 'utf8'));
    const woche = roh.quellen.slice(0, 7);
    const summe = (k) => woche.reduce((a, q) => a + (q.ein[k] || 0), 0);
    const alle = new Map();
    woche.forEach((q) => Object.entries(q.ein).forEach(([k, v]) => alle.set(k, (alle.get(k) || 0) + v)));
    const gesamt = [...alle.values()].reduce((a, b) => a + b, 0);
    const groesste = [...alle.entries()].sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    const mining = summe('asteroid_mining');
    const fund = summe('reicher_fund');
    const praemie = summe('eskorte_praemie');
    werte.push({
      gesamt, fund, mining, praemie,
      jeMining: mining > 0 ? fund / mining : 0,
      jeFarm: mining + praemie > 0 ? fund / (mining + praemie) : 0,
      k5Anteil: gesamt > 0 ? (100 * groesste[1]) / gesamt : 0,
      k5Quelle: groesste[0],
      // Gegenprobe des Laufs selbst - muss 0 bleiben, sonst fehlt eine Buchungsstelle.
      nichtZugeordnet: roh.gegenprobe.bruttoRes > 0
        ? (100 * (roh.gegenprobe.bruttoRes - roh.gegenprobe.buchRes)) / roh.gegenprobe.bruttoRes : 0,
    });
    process.stdout.write(`\r  ${zelle.id}: ${i + 1}/${N}   `);
  }
  process.stdout.write('\n');
  return werte;
}

const mrd = (x) => (x / 1e9).toFixed(2);
const ergebnisse = [];
let aufschlagKalibriert = null;

const laufende = ZELLEN.filter((z) => !NUR || NUR.includes(z.id));
if (existsSync(WURZEL)) rmSync(WURZEL, { recursive: true });
mkdirSync(WURZEL, { recursive: true });

console.log('='.repeat(78));
console.log(`REICHER FUND - ${laufende.length} Zellen a ${N} Laeufe, ${TAGE} Tage, Profil ${PROFIL}`);
console.log('MESSBUILD-WERTE. Treiber economy (kein Raid) - siehe Kopf des Protokolls.');
console.log('='.repeat(78));

for (const zelle of laufende) {
  let aufschlag = 0;
  if (zelle.aufschlag === 'kalibriert') {
    const basis = ergebnisse.find((e) => e.zelle.id === 'd24_c008');
    if (!basis) {
      console.log(`  ${zelle.id} UEBERSPRUNGEN: Zelle d24_c008 fehlt, der Aufschlag ist gegen sie kalibriert.`);
      continue;
    }
    // GLEICHER ERWARTUNGSWERT, damit nur die Streuung verglichen wird: der Aufschlag hebt den
    // Stundenertrag um genau den Faktor, den die Verdopplung im MITTEL geliefert hat.
    aufschlag = basis.stat.fund.mittel / basis.stat.mining.mittel;
    aufschlagKalibriert = aufschlag;
    console.log(`  ${zelle.id}: Aufschlag gegen d24_c008 kalibriert auf +${(100 * aufschlag).toFixed(1)} % je Stunde`);
  }
  const build = baue(zelle, aufschlag);
  const werte = fahre(zelle, build);
  const stat = {};
  ['gesamt', 'fund', 'mining', 'praemie', 'jeMining', 'jeFarm', 'k5Anteil'].forEach(
    (f) => (stat[f] = statistik(werte.map((w) => w[f])))
  );
  const maxNichtZugeordnet = Math.max(...werte.map((w) => Math.abs(w.nichtZugeordnet)));
  ergebnisse.push({ zelle, werte, stat, aufschlag, maxNichtZugeordnet });
}

// ===================================================================================
// AUSGABE
// ===================================================================================
console.log('\n' + '='.repeat(78));
console.log('1. NIVEAU - WOCHE 1, ABSOLUT (Mrd Wert-Einheiten)');
console.log('='.repeat(78));
console.log('Zelle       Dauer Chance | gesamt Mittel   Fund Mittel   Mining Mittel  K5 groesste');
for (const e of ergebnisse) {
  console.log(
    `${e.zelle.id.padEnd(11)} ${String(e.zelle.dauer_h).padStart(2)}h  ${e.zelle.chance.toFixed(2)}  | ` +
    `${mrd(e.stat.gesamt.mittel).padStart(12)}  ${mrd(e.stat.fund.mittel).padStart(11)}  ` +
    `${mrd(e.stat.mining.mittel).padStart(13)}  ${e.stat.k5Anteil.mittel.toFixed(1).padStart(6)} %`
  );
}

console.log('\n' + '='.repeat(78));
console.log('2. NORMIERT - REICHER FUND JE EINHEIT MINING (immun gegen die Farmzeit je Zelle)');
console.log('='.repeat(78));
console.log('Zelle        gemessen   Erwartung*  | je (Mining+Praemie)   Fund-Anteil am Farm');
for (const e of ergebnisse) {
  const erw = e.zelle.voll_faktor
    ? e.zelle.dauer_h * e.zelle.chance * e.zelle.voll_faktor
    : e.zelle.chance > 0
      ? (() => { const m = momente(e.zelle.dauer_h, e.zelle.chance); return m.mittel / m.ohne - 1; })()
      : (e.aufschlag || 0);
  const anteil = 100 * (e.stat.jeFarm.mittel / (1 + e.stat.jeFarm.mittel));
  console.log(
    `${e.zelle.id.padEnd(11)} ${e.stat.jeMining.mittel.toFixed(3).padStart(8)}   ${erw.toFixed(3).padStart(9)}   | ` +
    `${e.stat.jeFarm.mittel.toFixed(3).padStart(17)}   ${anteil.toFixed(1).padStart(15)} %`
  );
}
console.log('* geschlossene Form auf den REINEN Mining-Anteil, ohne die mitverdoppelte Praemie -');
console.log('  deshalb liegt die gemessene Spalte systematisch darueber. Plausibilitaet, kein Soll.');

console.log('\n' + '='.repeat(78));
console.log('3. STREUUNG - DAS EIGENTLICHE ERGEBNIS (Wocheneinnahme gesamt, je Lauf)');
console.log('='.repeat(78));
console.log('Zelle        Mittel     SD      VarK    Min      Max     Spanne  SE(Mittel)');
for (const e of ergebnisse) {
  const s = e.stat.gesamt;
  console.log(
    `${e.zelle.id.padEnd(11)} ${mrd(s.mittel).padStart(7)} ${mrd(s.sd).padStart(7)} ` +
    `${(100 * s.cv).toFixed(1).padStart(6)} % ${mrd(s.min).padStart(7)} ${mrd(s.max).padStart(8)} ` +
    `${s.spanne.toFixed(2).padStart(7)}x ${(100 * s.se / s.mittel).toFixed(1).padStart(8)} %`
  );
}

console.log('\n' + '='.repeat(78));
console.log('4. K5 - GROESSTE EINZELQUELLE JE LAUF (Schwelle 50 %)');
console.log('='.repeat(78));
// WELCHE Quelle die groesste ist, gehoert danebengeschrieben: faellt der Reiche Fund weg, wird
// automatisch `asteroid_mining` zur groessten Quelle und K5 bleibt verletzt - ohne diese Spalte
// saehe ein unveraenderter Anteil wie "die Aenderung wirkt nicht" aus.
console.log('Zelle        Mittel   Min     Max     ueber 50 %   groesste Quelle (Haeufigkeit)');
for (const e of ergebnisse) {
  const s = e.stat.k5Anteil;
  const drueber = e.werte.filter((w) => w.k5Anteil > 50).length;
  const zaehl = new Map();
  e.werte.forEach((w) => zaehl.set(w.k5Quelle, (zaehl.get(w.k5Quelle) || 0) + 1));
  const quellen = [...zaehl.entries()].sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}x`).join(', ');
  console.log(
    `${e.zelle.id.padEnd(11)} ${s.mittel.toFixed(1).padStart(6)} % ${s.min.toFixed(1).padStart(6)} % ` +
    `${s.max.toFixed(1).padStart(6)} % ${String(drueber).padStart(7)}/${e.werte.length}   ${quellen}`
  );
}

const schlecht = ergebnisse.filter((e) => e.maxNichtZugeordnet > 0.1);
console.log(`\nGegenprobe aller Laeufe: groesste "nicht zugeordnet"-Abweichung ` +
  `${Math.max(...ergebnisse.map((e) => e.maxNichtZugeordnet)).toFixed(4)} %` +
  (schlecht.length ? `   ACHTUNG in ${schlecht.map((e) => e.zelle.id).join(', ')}` : '   (unauffaellig)'));
if (aufschlagKalibriert !== null) {
  console.log(`Aufschlag der Form-Gegenprobe: +${(100 * aufschlagKalibriert).toFixed(1)} % je Stunde, ` +
    `gegen den gemessenen Mittelwert von d24_c008 kalibriert.`);
}

if (AUSGABE) {
  writeFileSync(AUSGABE, JSON.stringify({
    n: N, tage: TAGE, profil: PROFIL, aufschlagKalibriert,
    zellen: ergebnisse.map((e) => ({ ...e.zelle, aufschlag: e.aufschlag, stat: e.stat, werte: e.werte })),
  }, null, 2));
  console.log(`Rohdaten: ${AUSGABE}`);
}
