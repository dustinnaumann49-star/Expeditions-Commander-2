// AGGREGATIONSSCHWELLE ALS REGLER - DIAGNOSE ZUR MASSENFRAGE
//
// !!! MESSBUILD. Veraendert eine KOPIE von server/dist, niemals den Quellcode.                !!!
//
// FRAGE, DIE DIESES WERKZEUG BEANTWORTEN SOLL:
// Gemessen (aggregate_threshold_44.txt, V0, Mischflotte, Gegner AUF DIE FLOTTENMACHT SKALIERT und
// damit eigentlich massstabsneutral) faellt die Verlustquote von 65,9 % bei 405 Schiffen auf 2,4 %
// bei 4.500. Der Sprung AN der Schwelle ist dabei klein (99 -> 101: 57,6 -> 52,7 %), der Absturz
// DANACH gross. Und schon zwischen 90 und 99 - beide unaggregiert - faellt die Quote um acht
// Punkte. Es gibt also einen Groesseneffekt, der NICHT am Aggregat haengt.
//
// Bisher konnte niemand die beiden Anteile trennen, weil n=1000 je Typ mit den heutigen Schwellen
// (50/100/500) zwangslaeufig aggregiert laeuft. Genau das hebt dieses Werkzeug auf: mit
// --schwelle=100000 rechnet dieselbe Leiter EINZELN durch, und neben jeder aggregierten Zelle
// steht ihre einzeln gerechnete Zwillingszelle.
//   Differenz der beiden Spalten = Aggregat-Effekt.
//   Was in BEIDEN Spalten faellt              = Kampfmodell.
// Fuer die Entscheidung ist das der Unterschied zwischen "Schwelle anheben hilft" und "Schwelle
// anheben kostet Rechenzeit und aendert nichts".
//
// NEBENPRODUKT, ausdruecklich mitgemessen: die RECHENZEIT je Zelle. Die gestaffelten Schwellen
// kamen am 30.07.2026 nach einem echten Rueckstau-Vorfall. Ob eine Schwelle von 4.000-5.000
// ueberhaupt tragbar waere, ist eine Laufzeitfrage und keine Geschmacksfrage - und sie faellt hier
// gratis ab, weil die Einzel-Zellen genau diese Last erzeugen.
//
// Aufruf:
//   node make_messbuild_aggregat.mjs /tmp/agg_ist/dist                    # Ist-Zustand
//   node make_messbuild_aggregat.mjs /tmp/agg_einzeln/dist --schwelle=100000
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const OUT = resolve(args[0] || '/tmp/agg/dist');
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};
const SCHWELLE = opt('schwelle', null);  // null = unveraendert (Ist-Zustand)
const KASKADE = opt('kaskade', null);    // OVERKILL_MAX_CASCADE, Standard 5
const SCHUESSE = opt('schuesse', null);  // MAX_SHOTS_PER_UNIT, Standard 50
const ADMIRAL_SHARE = opt('admiral_share', null); // ADMIRAL_STAT_SHARE, Standard 0.55
const ESK_FEIN = args.includes('--eskorte_fein'); // Eskorte feinkoerniger statt Elitekader
const DIST = resolve(opt('dist', new URL('../../server/dist', import.meta.url).pathname));

if (!existsSync(resolve(DIST, 'game/combat.js'))) {
  throw new Error(`Kein kompilierter Build unter ${DIST} - erst "npx tsc -p tsconfig.json" im server-Verzeichnis.`);
}
if (!OUT.endsWith('/dist')) throw new Error('Ziel muss auf /dist enden.');
if (SCHWELLE !== null && !(Number(SCHWELLE) > 0)) throw new Error(`--schwelle muss > 0 sein: ${SCHWELLE}`);

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(DIST, OUT, { recursive: true });

const NM = resolve(new URL('../../server/node_modules', import.meta.url).pathname);
if (existsSync(NM)) {
  const ziel = resolve(OUT, '../node_modules');
  if (!existsSync(ziel)) symlinkSync(NM, ziel, 'dir');
}

let patches = 0;
function patch(file, needle, replacement, label) {
  const txt = readFileSync(file, 'utf8');
  const n = txt.split(needle).length - 1;
  if (n !== 1) {
    throw new Error(`PATCH "${label}" ABGEBROCHEN: Anker ${n}x gefunden, erwartet genau 1x.\n  ${needle.slice(0, 120)}`);
  }
  writeFileSync(file, txt.replace(needle, replacement));
  patches++;
}

const CC = resolve(OUT, 'game/data/combatConstants.js');

if (SCHWELLE !== null) {
  // ANKER AUS DEM KOMPILIERTEN dist, nicht aus der TS-Quelle (Messregel 16, fuenfmal zugeschnappt).
  // Statt jeden der zwoelf Typ-Eintraege einzeln zu ersetzen, wird die NACHSCHLAGEFUNKTION
  // ueberschrieben - damit sind Default UND Typ-Tabelle in einem Zug erfasst und es kann kein
  // Eintrag uebersehen werden. Genau dieser Fehler waere bei zwoelf Einzelpatches wahrscheinlich:
  // ein vergessener Typ liefe weiter aggregiert und die Zelle waere still halb falsch.
  patch(
    CC,
    `export function stackAggregateThresholdFor(typeId) {
    return STACK_AGGREGATE_THRESHOLD_BY_TYPE[typeId] ?? STACK_AGGREGATE_THRESHOLD;
}`,
    `export function stackAggregateThresholdFor(typeId) {
    return ${Number(SCHWELLE)}; // MESSBUILD: einheitliche Schwelle statt 50/100/500/2000
}`,
    'A1 stackAggregateThresholdFor'
  );
}

// ===================================================================================
// DIE ZWEI DECKEL, DIE ZUSAMMEN DIE OBERGRENZE AN ABSCHUESSEN JE RUNDE BILDEN
// ===================================================================================
// Die Diagnose (massenfrage.txt) hat das Aggregat als Ursache ausgeschlossen: 98 % des Absturzes
// von 63,4 auf 0,1 % Verlust passieren auch OHNE jede Aggregation. Der Mechanismus sitzt im
// Einzelpfad, und er besteht aus ZWEI Konstanten, die multiplikativ zusammenwirken:
//   OVERKILL_MAX_CASCADE = 5   ein Treffer erreicht hoechstens fuenf Einheiten
//   MAX_SHOTS_PER_UNIT   = 50  eine Einheit feuert hoechstens 50 Schuesse je Runde
// Zusammen: ein einzelner Boss kann hoechstens 5 x 50 = 250 Einheiten je Runde toeten - eine
// ABSOLUTE Zahl, unabhaengig von der Flottengroesse. Ihr ANTEIL faellt deshalb mit jeder weiteren
// Einheit, die man baut. Das ist die eigentliche Quelle des Masse-Vorteils.
// Der Plan hat das am 17.08.2026 bereits notiert ("setzen eine ABSOLUTE Obergrenze an Abschuessen
// je Runde; ihr Anteil faellt mit wachsender Flotte"), aber nur als Nebenbefund zu 4.4 - nie
// gemessen, ob sich die Kurve durch Anheben der beiden Werte begradigen laesst.
//
// WARUM BEIDE UND NICHT NUR EINE: sie multiplizieren sich. Die Kaskade allein anzuheben laeuft in
// die Schuss-Grenze, die Schuss-Grenze allein in die Kaskade. Wer nur eine misst, misst den
// Deckel der jeweils anderen und haelt das Ergebnis fuer die Wirkung seiner Aenderung.
//
// MAX_SHOTS_PER_UNIT steht im dist an ZWEI Stellen (Einzel-Pfad Z. 954, Aggregat-Pfad Z. 1182)
// und ist dort eine lokale const - beide MUESSEN denselben Wert bekommen, sonst rechnen die zwei
// Pfade verschieden und die Zellen sind nicht vergleichbar. Deshalb hier bewusst KEIN
// Einzelanker, sondern ein Ersatz beider Vorkommen mit Zaehlpruefung.
if (KASKADE !== null) {
  patch(
    resolve(OUT, 'game/combat.js'),
    `const OVERKILL_MAX_CASCADE = 5;`,
    `const OVERKILL_MAX_CASCADE = ${Number(KASKADE)}; // MESSBUILD (Standard 5)`,
    'A2 OVERKILL_MAX_CASCADE'
  );
}
if (SCHUESSE !== null) {
  const f = resolve(OUT, 'game/combat.js');
  const txt = readFileSync(f, 'utf8');
  const treffer = txt.split(`const MAX_SHOTS_PER_UNIT = 50;`).length - 1;
  if (treffer !== 2) {
    throw new Error(`PATCH "A3 MAX_SHOTS_PER_UNIT" ABGEBROCHEN: Anker ${treffer}x gefunden, erwartet genau 2x (Einzel- und Aggregat-Pfad).`);
  }
  writeFileSync(f, txt.split(`const MAX_SHOTS_PER_UNIT = 50;`).join(`const MAX_SHOTS_PER_UNIT = ${Number(SCHUESSE)}; // MESSBUILD (Standard 50)`));
  patches += 2;
}

// ===================================================================================
// ADMIRAL_STAT_SHARE - WIEVIEL DER GEGNERMACHT AUF DEM KAPITAEN SELBST SITZT
// ===================================================================================
// Der Befund vom 28.08.2026 (massenfrage_protokoll.txt Abschnitt 4a): der Kapitaen wandelt
// zusaetzliche Macht in VERSCHWENDUNG statt in Wirkung um, weil ein Treffer ueber die
// Durchschlags-Kaskade nur wenige Ziele erreicht. Sein Schaden je Treffer bleibt bei 13,6 Mio,
// egal wie stark er wird. Verteilte Gegnermacht zeigt das Verhalten NICHT.
// ADMIRAL_STAT_SHARE ist damit der direkte Regler: er bestimmt, welcher Anteil der Gegnermacht in
// die verschwendende Form geht (Kapitaen) und welcher in die wirksame (Eskorte).
// Der Plan hatte am 15.08.2026 bereits notiert, dass ein HOEHERER Wert den Gegner SCHWAECHER
// macht - hier wird die Gegenrichtung gemessen.
if (ADMIRAL_SHARE !== null) {
  patch(
    resolve(OUT, 'game/combat.js'),
    `const ADMIRAL_STAT_SHARE = 0.55;`,
    `const ADMIRAL_STAT_SHARE = ${Number(ADMIRAL_SHARE)}; // MESSBUILD (Standard 0.55)`,
    'A4 ADMIRAL_STAT_SHARE'
  );
}

// ===================================================================================
// --eskorte_fein - KOERNIGKEIT DER GEGNERMACHT STATT NUR IHRER VERTEILUNG
// ===================================================================================
// Die Eskorte ist heute ausdruecklich als "wenige starke statt vieler schwacher Schiffe" gebaut
// (Profil `elitekader`, Pool nur Schlachtschiff/Schlachtkreuzer/Zerstoerer/Reaper, siehe Kommentar
// bei ADMIRAL_ESCORT_POOL). Sie ist damit zwar VERTEILT, aber grobkoernig - jede Einheit traegt
// selbst viel Waffenwert und laeuft mit ihren Schuessen ebenfalls in die Durchschlags-Kaskade.
// Die Gegenprobe vom 28.08.2026 zeigte flaches Verhalten fuer `generatePiratenFleet`, die mit dem
// Profil `schwarm` VIELE KLEINE Einheiten erzeugt (87.922 statt 10.662 bei gleicher Macht).
// Der Verdacht ist deshalb praeziser als "verteilen hilft": es geht um die KOERNIGKEIT, also um
// Waffenwert JE EINHEIT im Verhaeltnis zur Zielgroesse - nicht um die blosse Stueckzahl.
// Dieser Schalter prueft genau das: gleicher Machtanteil, gleicher Kapitaen, nur die Eskorte
// feinkoerniger (Jaeger und Kreuzer im Pool, Schwarm-Gewichtung).
if (ESK_FEIN) {
  patch(
    resolve(OUT, 'game/combat.js'),
    `const ADMIRAL_ESCORT_POOL = ['schlachtschiff', 'schlachtkreuzer', 'zerstoerer', 'reaper'];`,
    `const ADMIRAL_ESCORT_POOL = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff']; // MESSBUILD: feinkoernig`,
    'A5a ADMIRAL_ESCORT_POOL'
  );
  patch(
    resolve(OUT, 'game/combat.js'),
    `const escortWeights = weightsForProfile('elitekader', ADMIRAL_ESCORT_POOL.length);`,
    `const escortWeights = weightsForProfile('schwarm', ADMIRAL_ESCORT_POOL.length); // MESSBUILD`,
    'A5b Eskorten-Gewichtung'
  );
}

console.log(`Aggregat-Messbuild: ${OUT}`);
console.log(`  Eingang   : ${DIST}`);
console.log(`  Schwelle  : ${SCHWELLE === null ? 'unveraendert (50/100/500, Default 2000) - IST-ZUSTAND' : `${SCHWELLE} fuer ALLE Typen`}`);
console.log(`  Kaskade   : ${KASKADE === null ? 'unveraendert (5)' : `${KASKADE} Einheiten je Treffer`}`);
console.log(`  Schuesse  : ${SCHUESSE === null ? 'unveraendert (50)' : `${SCHUESSE} je Einheit und Runde`}`);
console.log(`  Admiral   : ${ADMIRAL_SHARE === null ? 'unveraendert (0.55)' : `${ADMIRAL_SHARE} Machtanteil auf dem Kapitaen`}`);
console.log(`  Eskorte   : ${ESK_FEIN ? 'FEINKOERNIG (leicht/schwer/kreuzer/schlachtschiff, schwarm)' : 'unveraendert (Elitekader, grosse Klassen)'}`);
console.log(`  Patches   : ${patches}${patches === 0 ? ' (reine Kopie, verhaltensgleich zum Eingang)' : ''}`);
console.log(`  Quellcode unberuehrt.`);
