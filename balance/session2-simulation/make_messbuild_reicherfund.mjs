// REICHER FUND - STELLSCHRAUBEN FUER DIE MESSUNG AUS k5_quellen.txt ABSCHNITT 11
//
// !!! ALLE ERGEBNISSE AUS DIESEM BUILD SIND MESSBUILD-WERTE, KEIN REPO-STAND.        !!!
// !!! ES WIRD KEIN SPIELCODE GEAENDERT - veraendert wird ausschliesslich eine KOPIE   !!!
// !!! eines bereits erzeugten dist-Baums.                                            !!!
//
// VIERTE STUFE, bewusst. Setzt auf /tmp/k5/dist auf, statt make_messbuild_k5.mjs zu erweitern -
// dasselbe Muster und dieselbe Begruendung wie dort (k5_quellen.txt Abschnitt 1):
//   1. Die Patchzahl 18 ist die Echtheitspruefung von make_messbuild_k5.mjs. Sie bleibt unberuehrt.
//   2. Der Ankerwert des instrumentierten Builds bleibt ohne erneute Pruefung vergleichbar.
//   3. Die Stellschrauben lassen sich abschalten - der Build mit Standardwerten ist
//      zeichengleich zum Eingang (Selbsttest unten, `--pruefe_identitaet`).
// Abschnitt 11 schlaegt "ein zusaetzlicher Patch-Block" in make_messbuild_k5.mjs vor; das waere
// derselbe Fehler, den der k5-Kasten fuer sim13 ausdruecklich vermeidet.
//
// Aufruf:
//   node make_messbuild_kum.mjs        /tmp/mb_kum       --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_sim13.mjs      /tmp/mb_kum    /tmp/sim13/dist
//   node make_messbuild_k5.mjs         /tmp/sim13/dist /tmp/k5/dist
//   node make_messbuild_reicherfund.mjs /tmp/k5/dist  /tmp/rf_c08_d24/dist [Schalter]
//
// SCHALTER (Standard = heutiger Code, dann aendert das Skript nur Kommentare):
//   --chance=0.08     ASTEROID_RICH_FIND_CHANCE. 0 = Nullmessung ohne Reichen Fund.
//   --dauer_h=24      ASTEROID_MISSION_DURATION_MS in Stunden. HEUTE 24, NICHT 12 - siehe unten.
//   --aufschlag=0     Fester Aufschlag auf den STUNDENERTRAG statt/zusaetzlich zur Verdopplung.
//                     1.0 = +100 % je Stunde. Gebucht als `reicher_fund`, damit die K5-Zeile
//                     vergleichbar bleibt. Fuer die Form-Gegenprobe zusammen mit --chance=0.
//
// ===================================================================================
// MESSREGEL 16, FUENFTER FUNDORT - DIE AUFGABENSTELLUNG SELBST TRUG EINE FALSCHE ZAHL
// ===================================================================================
// k5_quellen.txt Abschnitt 11 und der Messkasten in Abschnitt 1b sprechen beide von
// "12-Stunden-Missionen" und verweisen auf Punkt 23 der ALTEN README ("von 4h auf 12h").
// Im Code steht:
//     ASTEROID_MISSION_DURATION_MS = 24 * 3600 * 1000
//     Kommentar daneben: "Umbau 28.07.2026: von 12h auf 24h angehoben"
// Es gab also ZWEI Verlaengerungen, nicht eine. Der Hebel des Reichen Fundes ist damit groesser
// als in der Fragestellung unterstellt: ein Treffer in der letzten Stunde ist rund 24-mal so viel
// wert wie einer in der ersten, nicht 12-mal. Deshalb hat dieses Werkzeug die Missionsdauer als
// eigenen Regler - in Abschnitt 11 fehlte sie, obwohl die erste zu klaerende Frage an ihr haengt.
//
// ===================================================================================
// WAS DER AUFSCHLAG LEISTEN MUSS UND WAS NICHT
// ===================================================================================
// Die Form-Gegenprobe ("Verdopplung gegen festen Aufschlag") ist nur dann eine Aussage ueber die
// STREUUNG, wenn beide Formen denselben ERWARTUNGSWERT liefern. Sonst misst man Niveau und
// Streuung gleichzeitig - dieselbe Falle wie bei 7.2 ("Angleichen legt ein Verhaeltnis fest, kein
// Niveau"). Der Aufschlag wird deshalb NICHT geraten, sondern gegen den GEMESSENEN Mittelwert der
// Verdopplungs-Zelle kalibriert (run_reicherfund.mjs --kalibriere). Die geschlossene Form
//     E[Farm] / (n*c) = (1+p) * ((1+p)^n - 1) / (p*n)
// dient nur als Startwert und zur Plausibilitaetspruefung, nicht als Sollwert.
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const SRC = resolve(args[0] || '/tmp/k5/dist');
const OUT = resolve(args[1] || '/tmp/rf/dist');
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
};

const CHANCE = Number(opt('chance', '0.08'));
const DAUER_H = Number(opt('dauer_h', '24'));
const AUFSCHLAG = Number(opt('aufschlag', '0'));

if (!Number.isFinite(CHANCE) || CHANCE < 0 || CHANCE > 1) throw new Error(`--chance ausserhalb 0..1: ${CHANCE}`);
if (!Number.isFinite(DAUER_H) || DAUER_H < 1) throw new Error(`--dauer_h muss >= 1 sein: ${DAUER_H}`);
if (!Number.isFinite(AUFSCHLAG) || AUFSCHLAG < 0) throw new Error(`--aufschlag muss >= 0 sein: ${AUFSCHLAG}`);

if (!existsSync(SRC)) throw new Error(`Eingangs-Build fehlt: ${SRC} (erst make_messbuild_k5.mjs)`);
// Echtheitspruefung des Eingangs: ohne die K5-Instrumentierung ist die Messung nicht auswertbar,
// weil `reicher_fund` dann gar keine eigene Zeile hat.
if (!readFileSync(resolve(SRC, 'game/missions.js'), 'utf8').includes(`__k5Mission(mission, 'reicher_fund', bonus);`)) {
  throw new Error('Eingangs-Build ist NICHT instrumentiert (kein reicher_fund-Haken) - erst make_messbuild_k5.mjs.');
}
if (!OUT.endsWith('/dist')) {
  throw new Error('Ziel muss auf /dist enden (Wegwerf-Datenbank, siehe make_messbuild_sim13.mjs).');
}
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(SRC, OUT, { recursive: true });

// node_modules in den LAUFORDNER, nicht in dist (V4 aus sim13_geruest.txt).
const NM = resolve(opt('nm', new URL('../../server/node_modules', import.meta.url).pathname));
if (existsSync(NM)) {
  const ziel = resolve(OUT, '../node_modules');
  if (!existsSync(ziel)) symlinkSync(NM, ziel, 'dir');
} else {
  console.warn(`WARNUNG: node_modules nicht gefunden (${NM}) - Skripte, die db.js laden, scheitern.`);
}

const g = (f) => resolve(OUT, 'game', f);
let patches = 0;

/** Exakter Textersatz mit hartem Abbruch. Der Anker MUSS genau einmal vorkommen. */
function patch(file, needle, replacement, label) {
  const txt = readFileSync(file, 'utf8');
  const n = txt.split(needle).length - 1;
  if (n !== 1) {
    throw new Error(`PATCH "${label}" ABGEBROCHEN: Anker ${n}x in ${file} gefunden, erwartet genau 1x.\n  Anker: ${needle.slice(0, 110)}...`);
  }
  writeFileSync(file, txt.replace(needle, replacement));
  patches++;
}

// ===================================================================================
// R1 - MISSIONSDAUER DER ASTEROIDENFELDER
// ===================================================================================
// Anker aus dem KOMPILIERTEN dist gelesen, nicht aus der TS-Quelle (Messregel 16). Die Konstante
// wird an genau einer Stelle benutzt (missions.js Z. 110, `cfg.type === 'asteroid' ? ... : ...`);
// die dmCap-Rate leitet sich in accrueFarming() ohnehin aus der TATSAECHLICHEN Missionsdauer ab
// und zieht damit automatisch mit.
patch(
  g('data/economy.js'),
  `export const ASTEROID_MISSION_DURATION_MS = 24 * 3600 * 1000;`,
  `export const ASTEROID_MISSION_DURATION_MS = ${DAUER_H} * 3600 * 1000; // MESSBUILD (Standard 24)`,
  'R1 economy.js Missionsdauer'
);

// ===================================================================================
// R2 - CHANCE DES REICHEN FUNDES
// ===================================================================================
// Nicht die Konstante in economy.js aendern, sondern die AUFRUFSTELLE: ASTEROID_RICH_FIND_CHANCE
// wird ausschliesslich hier verwendet, und ein Wert an der Aufrufstelle ist im diff sofort
// sichtbar. `--chance=0` ist die Nullmessung: Math.random() >= 0 ist immer wahr, die Funktion
// kehrt vor jeder Buchung zurueck.
patch(
  g('missions.js'),
  `        runRichFindCheck(mission, ASTEROID_RICH_FIND_CHANCE);`,
  `        runRichFindCheck(mission, ${CHANCE}); // MESSBUILD (Standard ASTEROID_RICH_FIND_CHANCE = 0.08)`,
  'R2 missions.js Fund-Chance'
);

// ===================================================================================
// R3 - FESTER AUFSCHLAG AUF DEN STUNDENERTRAG (Form-Gegenprobe)
// ===================================================================================
// Entkoppelt vom Zeitpunkt: der Aufschlag faellt in JEDER Stunde in derselben relativen Hoehe an,
// statt einmal zufaellig den bis dahin angesammelten Betrag zu verdoppeln. Er wird als
// `reicher_fund` gebucht, damit die K5-Zeile zwischen beiden Formen vergleichbar bleibt - saehe
// er wie `asteroid_mining` aus, waere der Formvergleich in K5 unsichtbar.
// Der Anker enthaelt bereits den K5-Haken aus der dritten Stufe; damit ist gleichzeitig geprueft,
// dass dieses Skript auf einem instrumentierten Build laeuft.
if (AUFSCHLAG > 0) {
  patch(
    g('missions.js'),
    `            mission.farmed.metall += total * 0.5;
            mission.farmed.kristall += total * 0.3;
            mission.farmed.deuterium += total * 0.2;
            __k5Mission(mission, 'asteroid_mining', { metall: total * 0.5, kristall: total * 0.3, deuterium: total * 0.2 });`,
    `            mission.farmed.metall += total * 0.5;
            mission.farmed.kristall += total * 0.3;
            mission.farmed.deuterium += total * 0.2;
            __k5Mission(mission, 'asteroid_mining', { metall: total * 0.5, kristall: total * 0.3, deuterium: total * 0.2 });
            // ===== MESSBUILD: fester Aufschlag statt Verdopplung (Form-Gegenprobe) =====
            const __auf = total * ${AUFSCHLAG};
            mission.farmed.metall += __auf * 0.5;
            mission.farmed.kristall += __auf * 0.3;
            mission.farmed.deuterium += __auf * 0.2;
            __k5Mission(mission, 'reicher_fund', { metall: __auf * 0.5, kristall: __auf * 0.3, deuterium: __auf * 0.2 });`,
    'R3 missions.js fester Aufschlag'
  );
}

console.log(`Reicher-Fund-Messbuild: ${OUT}`);
console.log(`  Eingang     : ${SRC}`);
console.log(`  Chance      : ${CHANCE}${CHANCE === 0 ? '   (Nullmessung)' : CHANCE === 0.08 ? '   (heutiger Code)' : ''}`);
console.log(`  Dauer       : ${DAUER_H} h${DAUER_H === 24 ? '   (heutiger Code - NICHT 12, siehe Kopf)' : ''}`);
console.log(`  Aufschlag   : ${AUFSCHLAG === 0 ? 'keiner' : `+${(100 * AUFSCHLAG).toFixed(1)} % je Stunde, gebucht als reicher_fund`}`);
console.log(`  Patches     : ${patches} (jeder mit hartem Abbruch bei fehlendem Anker)`);
console.log(`  Datenbank landet unter ${resolve(OUT, '../data')}`);
console.log(`  Quellcode unberuehrt.`);
