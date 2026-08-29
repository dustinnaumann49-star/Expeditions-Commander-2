// !!! MESSBUILD-WERKZEUG - VERAENDERT KEINE ZEILE IM REPO !!!
// Erzeugt eine gepatchte dist-Kopie, in der der STUECKZAHLDECKEL der Bot-Bauentscheidung
// veraendert ist. Aufruf:
//   node make_messbuild_botrate.mjs <eingang-dist> <ausgang-dist> [--schiffe=N] [--verteidigung=N]
//                                                                [--dynamisch] [--anteil=0.02]
//
// HINTERGRUND (28.08.2026, Nutzerbeobachtung an KI-Nyx und KI-Vega im laufenden Spiel):
// Beide Bots horten rund 26 Mrd Ressourcen und besitzen trotzdem nur 21-29 Schiffe je Typ,
// waehrend ihre Verteidigung bei 80-124 je Typ liegt. Sie sind also NICHT geldbegrenzt.
// Der Deckel steht in `maybeBuildShips()`:
//     for (let n = 5; n >= 1; n--) { if (affordableFrom(spendable, cost, n)) { qty = n; break; } }
// Hoechstens FUENF Schiffe je Aufruf. Der Kommentar an dieser Stelle nennt die Absicht
// ausdruecklich fuer den Fall, "sobald der Bot ARM ist" (Fix vom 13.08.2026, der verhindern
// sollte, dass nur noch Leichte Jaeger gebaut werden). Fuer einen reichen Bot ist derselbe
// Deckel eine harte Obergrenze, die mit dem Kontostand nichts mehr zu tun hat.
// `maybeBuildDefense()` verwendet daneben 10 statt 5 - die Verteidigung waechst deshalb mit
// doppeltem Tempo, obwohl ein Schiff je BAUZEITSEKUNDE deutlich mehr Wert bindet
// (30.000 beim Leichten Jaeger gegen 1.945 beim Raketenwerfer).
//
// SCHALTER
//   --schiffe=N        fester Deckel statt 5 (Leiterzellen: 5 = heute, 25, 100, 500)
//   --verteidigung=N   fester Deckel statt 10 (nur fuer die Gegenprobe, ob das Verhaeltnis zaehlt)
//   --dynamisch        Deckel = so viele Stueck, wie ein ANTEIL des frei verfuegbaren Guthabens
//                      hergibt (mit --anteil, Standard 0,02). Das ist die eigentlich
//                      interessante Form: sie koppelt die Baurate an den Reichtum, statt eine
//                      zweite feste Zahl zu setzen, die spaeter genauso veraltet wie die 5.
//   --anteil=X         Anteil des Guthabens je Aufruf (nur mit --dynamisch)
//
// ANKER WERDEN AUS DEM KOMPILIERTEN dist GELESEN, nicht aus der TypeScript-Quelle
// (Messregel 16, fuenfmal zugeschnappt). Jeder Patch bricht hart ab, wenn sein Anker fehlt.
import fs from 'node:fs';
import path from 'node:path';

const [, , EIN, AUS, ...rest] = process.argv;
if (!EIN || !AUS) throw new Error('Aufruf: node make_messbuild_botrate.mjs <eingang> <ausgang> [--schiffe=N] ...');
const opt = (n, d) => { const t = rest.find((a) => a.startsWith(`--${n}=`)); return t ? t.slice(n.length + 3) : d; };
const flag = (n) => rest.includes(`--${n}`);

const SCHIFFE = opt('schiffe', null);
const VERTEIDIGUNG = opt('verteidigung', null);
const DYNAMISCH = flag('dynamisch');
const ANTEIL = Number(opt('anteil', '0.02'));
if (DYNAMISCH && SCHIFFE) throw new Error('--dynamisch und --schiffe schliessen sich aus.');
if (DYNAMISCH && (!Number.isFinite(ANTEIL) || ANTEIL <= 0 || ANTEIL > 1)) throw new Error(`--anteil unplausibel: ${ANTEIL}`);

fs.rmSync(AUS, { recursive: true, force: true });
fs.cpSync(EIN, AUS, { recursive: true });

const datei = path.join(AUS, 'game/economyBotTurn.js');
if (!fs.existsSync(datei)) throw new Error(`Kein kompiliertes economyBotTurn.js unter ${datei}`);
let t = fs.readFileSync(datei, 'utf8');
let patches = 0;

const ersetze = (alt, neu, name) => {
  if (!t.includes(alt)) throw new Error(`ANKER FEHLT (${name}) - Eingang ist nicht der erwartete Build.`);
  t = t.replace(alt, neu);
  patches++;
};

// --- B1: Stueckzahldeckel der Schiffe -------------------------------------------------------
const ANKER_SCHIFFE = `        for (let n = 5; n >= 1; n--) {`;
if (DYNAMISCH) {
  // Deckel aus dem frei verfuegbaren Guthaben: wieviele Stueck traegt ANTEIL des Kontos?
  // Absteigend gesucht wie im Original, damit die "so viele wie bezahlbar"-Logik erhalten bleibt.
  // Untergrenze 1 und Obergrenze 5000, damit weder 0 noch eine Warteschlangen-Explosion entsteht.
  ersetze(ANKER_SCHIFFE,
    `        const __budget = { metall: spendable.metall * ${ANTEIL}, kristall: spendable.kristall * ${ANTEIL}, deuterium: spendable.deuterium * ${ANTEIL} };
        let __max = 1;
        if (cost) {
            const __teil = [];
            if (cost.metall > 0) __teil.push(__budget.metall / cost.metall);
            if (cost.kristall > 0) __teil.push(__budget.kristall / cost.kristall);
            if (cost.deuterium > 0) __teil.push(__budget.deuterium / cost.deuterium);
            __max = __teil.length ? Math.floor(Math.min(...__teil)) : 1;
        }
        __max = Math.max(1, Math.min(5000, __max));
        for (let n = __max; n >= 1; n--) {`, 'B1 dynamisch');
} else if (SCHIFFE) {
  ersetze(ANKER_SCHIFFE, `        for (let n = ${Number(SCHIFFE)}; n >= 1; n--) {`, 'B1 fest');
}

// --- B2: Stueckzahl der Verteidigung (nur fuer die Gegenprobe) --------------------------------
if (VERTEIDIGUNG) {
  const A1 = `        if (!affordableFrom(spendable, DEFENSES.find((x) => x.id === id)?.cost, 10))`;
  const A2 = `        if (startDefenseBuild(state, id, 10).ok)`;
  ersetze(A1, `        if (!affordableFrom(spendable, DEFENSES.find((x) => x.id === id)?.cost, ${Number(VERTEIDIGUNG)}))`, 'B2a');
  ersetze(A2, `        if (startDefenseBuild(state, id, ${Number(VERTEIDIGUNG)}).ok)`, 'B2b');
}

if (patches === 0) throw new Error('Kein Schalter gesetzt - der Build waere identisch zum Eingang.');
fs.writeFileSync(datei, t);

console.log(`Bot-Baurate-Messbuild: ${AUS}`);
console.log(`  Eingang     : ${EIN}`);
console.log(`  Patches     : ${patches} (jeder mit hartem Abbruch bei fehlendem Anker)`);
console.log(`  Schiffe     : ${DYNAMISCH ? `dynamisch, ${ANTEIL} des Guthabens je Aufruf (1..5000)` : SCHIFFE ? `fester Deckel ${SCHIFFE}` : 'unveraendert (5)'}`);
console.log(`  Verteidigung: ${VERTEIDIGUNG ? `fester Deckel ${VERTEIDIGUNG}` : 'unveraendert (10)'}`);
console.log('  Quellcode unberuehrt.');
