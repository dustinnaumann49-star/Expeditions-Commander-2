// PUNKT 1 AUS reicherfund_11.txt ABSCHNITT 12b - K5 IN EINER tick-ZELLE
//
// !!! MESSBUILD-WERTE, KEIN REPO-STAND. Baut sich seine Builds selbst ueber                 !!!
// !!! make_messbuild_reicherfund.mjs und faehrt sim13_lauf.mjs als Unterprozess.            !!!
// !!! Es wird kein Spielcode veraendert.                                                    !!!
//
// Aufruf:
//   node run_rf_k5tick.mjs [--n=5] [--tage=14] [--profil=aktiv] [--out=datei.json]
//                          [--nur=heute_det,v016_det] [--k5=/tmp/k5/dist]
//
// ===================================================================================
// WARUM EIN EIGENES SKRIPT UND NICHT run_reicherfund.mjs ERWEITERT
// ===================================================================================
// run_reicherfund.mjs traegt die Zahlen von reicherfund_11.txt. Es hat eine feste Zellenliste,
// wertet fest ueber Woche 1 aus und kennt keinen Treiber. Waere es erweitert worden, waere das
// Protokoll vom 27.08.2026 nicht mehr mit demselben Werkzeug reproduzierbar. Dieselbe Begruendung
// wie bei der vierten Buildstufe: die bestehende Stufe bleibt unberuehrt.
//
// ===================================================================================
// DER BEFUND, DER DIESE MESSUNG UEBERHAUPT ERST AUSWERTBAR MACHT
// ===================================================================================
// Am kompilierten dist nachgesehen (Messregel 16), nicht in der Quelle:
//
//   raids.js   getRaidSchedule(userId):
//     RAID_SCHEDULE_BY_USERNAME[username] vorhanden  ->  { specs, chance: 1 }
//     sonst                                          ->  { RAID_FALLBACK_SCHEDULE, chance: 0.7 }
//   economy.js RAID_SCHEDULE_BY_USERNAME = { ShadowEagle: [Mi 0:00, So 0:00],
//                                            SchnelleRatte: [Mi 0:00, So 0:00] }
//   economy.js RAID_SPAWN_CHANCE = 0.7
//   galaxyConstants.js RAID_PREP_MS = 1 h ; economy.js RAID_ASSAULT_DURATION_MS = 24 h
//
// DREI FOLGEN, alle abgeleitet und keine davon geraten:
//
// (1) Der simulierte Mensch hiess bisher `Sim_aktiv` und lief damit ueber den 0,7-Fallback.
//     Es gibt aber genau ZWEI Spieler, beide namentlich eingetragen, beide mit Chance 1. Die
//     bisherigen tick-Zellen haben also einen Raid-Rhythmus gemessen, den das Spiel fuer seine
//     Spieler gar nicht fahren wird. Behoben ueber `--nutzer=` in sim13_lauf.mjs (neu).
//
// (2) In WOCHE 1 kann genau EIN Raid fertig werden: Start Montag 0:00, Checkpoint Mittwoch 0:00
//     (Tag 2), Dauer 1 h Vorbereitung + 24 h Sturm -> fertig Donnerstag 1:00 (Tag 3). Der
//     Sonntags-Checkpoint (Tag 6) endet erst Montag 1:00, also Tag 7 - ausserhalb von Woche 1.
//     Unter dem Fallback haengt der K5-NENNER damit an EINER Bernoulli-Ziehung mit p = 0,7.
//     Bei fuenf Laeufen je Form haette der Vergleich mit hoher Wahrscheinlichkeit den
//     Raid-Wuerfel gemessen und nicht die Form - genau die Fehlerform, an der K5 schon zweimal
//     gescheitert ist ("was entscheidet, ist ein einzelner Wuerfel").
//
// (3) `--tage=14` aendert an einer WOCHE-1-Kennzahl gar nichts: sim13_lauf.mjs und
//     run_reicherfund.mjs werten fest ueber `quellen.slice(0,7)` aus. Fuenf 14-Tage-Laeufe
//     lieferten fuer K5 exakt dieselbe Zahl wie fuenf 7-Tage-Laeufe, bei doppelter Rechenzeit.
//     Deshalb wird hier ZUSAETZLICH ueber das volle Fenster ausgewertet (K5b, unten).
//
// ===================================================================================
// K5 BLEIBT UNVERAENDERT, K5b KOMMT DANEBEN
// ===================================================================================
// Muster K1/K1b (26.08.2026) und K3/K3b (26.08.2026): eine Kennzahl mit Vergleichswerten ueber
// mehrere Sessions wird NICHT umdefiniert, sie bekommt ein Gegenstueck.
//   K5  = groesster Anteil an den Einnahmen der Tage 0-6      (Abnahmekriterium, unveraendert)
//   K5b = groesster Anteil an den Einnahmen der Tage 0..TAGE-1 (nur hier, zur Einordnung)
// K5b ist KEIN neues Abnahmekriterium und wird auch nicht als solches vorgeschlagen. Es beantwortet
// eine andere Frage: wie sieht die Zusammensetzung aus, wenn nicht ein einzelner Raid-Checkpoint
// ueber den halben Nenner entscheidet. In 14 Tagen liegen drei ABGESCHLOSSENE Raids (Mi T2,
// So T6 -> fertig T7, Mi T9), der vierte (So T13) faellt aus dem Fenster.
//
// ===================================================================================
// DIE ZELLEN
// ===================================================================================
// Zwei Formen mal zwei Raid-Rhythmen. Die _det-Zellen tragen die Aussage (Rhythmus wie im echten
// Spiel, kein 0/1-Rauschen im Nenner), die _fb-Zellen sind die Bruecke zu k5_quellen.txt
// Abschnitt 6/8b, deren Zahlen unter dem Fallback entstanden sind. Ohne die Bruecke waere kein
// Wert der fuenften Session mehr vergleichbar.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};

const N = Number(opt('n', '5'));
const TAGE = Number(opt('tage', '14'));
const PROFIL = opt('profil', 'aktiv');
const K5 = resolve(opt('k5', '/tmp/k5/dist'));
const AUSGABE = opt('out', null);
const NUR = opt('nur', null)?.split(',').map((s) => s.trim()).filter(Boolean) || null;
const WURZEL = resolve(opt('wurzel', '/tmp/rfk5'));
const HIER = new URL('.', import.meta.url).pathname;

if (!existsSync(resolve(K5, 'game/missions.js'))) {
  throw new Error(`Kein instrumentierter Build unter ${K5} (erst make_messbuild_k5.mjs).`);
}

// chance/voll_faktor exakt wie in run_reicherfund.mjs Gruppe D - das Produkt p*faktor ist 0,140
// und gegen den GEMESSENEN Fund-Anteil von d24_c008 kalibriert. Hier wird nichts neu kalibriert:
// eine zweite Kalibrierung gegen eine andere Zelle wuerde die Form-Aussage vom 27.08.2026
// stillschweigend verschieben.
const ZELLEN = [
  { id: 'heute_det', chance: 0.08, voll_faktor: 0, nutzer: 'ShadowEagle', text: 'heutige Form, Raid-Rhythmus wie im Spiel' },
  { id: 'v016_det', chance: 0.16, voll_faktor: 0.875, nutzer: 'ShadowEagle', text: 'v_p016, Raid-Rhythmus wie im Spiel' },
  { id: 'heute_fb', chance: 0.08, voll_faktor: 0, nutzer: null, text: 'heutige Form, Fallback 0,7 (Bruecke)' },
  { id: 'v016_fb', chance: 0.16, voll_faktor: 0.875, nutzer: null, text: 'v_p016, Fallback 0,7 (Bruecke)' },
];

function statistik(werte) {
  const v = werte.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  if (v.length === 0) return { n: 0 };
  const mittel = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mittel) ** 2, 0) / (v.length - 1)) : 0;
  return {
    n: v.length, mittel, sd, cv: mittel > 0 ? sd / mittel : 0,
    min: v[0], max: v[v.length - 1], median: v[Math.floor((v.length - 1) / 2)],
    spanne: v[0] > 0 ? v[v.length - 1] / v[0] : Infinity,
    se: v.length > 1 ? sd / Math.sqrt(v.length) : 0,
  };
}

function baue(zelle) {
  const ziel = resolve(WURZEL, zelle.id, 'dist');
  const a = [resolve(HIER, 'make_messbuild_reicherfund.mjs'), K5, ziel,
    `--chance=${zelle.chance}`, '--dauer_h=24'];
  if (zelle.voll_faktor) a.push(`--voll_faktor=${zelle.voll_faktor}`);
  execFileSync('node', a, { stdio: 'pipe' });
  return ziel;
}

/** Groesste Quelle und ihr Anteil ueber ein Tagesfenster [von, bis). */
function fenster(quellen, von, bis) {
  const alle = new Map();
  quellen.slice(von, bis).forEach((q) =>
    Object.entries(q.ein).forEach(([k, v]) => alle.set(k, (alle.get(k) || 0) + v)));
  const gesamt = [...alle.values()].reduce((a, b) => a + b, 0);
  const sortiert = [...alle.entries()].sort((a, b) => b[1] - a[1]);
  const groesste = sortiert[0] || ['-', 0];
  return {
    gesamt, quelle: groesste[0],
    anteil: gesamt > 0 ? (100 * groesste[1]) / gesamt : 0,
    posten: Object.fromEntries(sortiert),
  };
}

function fahre(zelle, build) {
  const werte = [];
  const tmp = resolve(WURZEL, zelle.id, 'lauf.json');
  for (let i = 0; i < N; i++) {
    const a = [resolve(HIER, 'sim13_lauf.mjs'), `--build=${build}`, `--profil=${PROFIL}`,
      `--tage=${TAGE}`, '--treiber=tick', `--out=${tmp}`];
    if (zelle.nutzer) a.push(`--nutzer=${zelle.nutzer}`);
    execFileSync('node', a, { stdio: 'pipe' });
    const roh = JSON.parse(readFileSync(tmp, 'utf8'));
    const w1 = fenster(roh.quellen, 0, 7);
    const voll = fenster(roh.quellen, 0, TAGE);
    const stueck = roh.quellen.reduce((s, q) => s + (q.neutral?.__stueck_container_raid || 0), 0);
    werte.push({
      k5: w1.anteil, k5Quelle: w1.quelle, gesamtW1: w1.gesamt,
      fundW1: w1.posten.reicher_fund || 0,
      raidW1: w1.posten.container_raid || 0,
      miningW1: w1.posten.asteroid_mining || 0,
      praemieW1: w1.posten.eskorte_praemie || 0,
      k5b: voll.anteil, k5bQuelle: voll.quelle, gesamtVoll: voll.gesamt,
      fundVoll: voll.posten.reicher_fund || 0,
      raidVoll: voll.posten.container_raid || 0,
      raidContainer: stueck,
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
const laufende = ZELLEN.filter((z) => !NUR || NUR.includes(z.id));
if (existsSync(WURZEL)) rmSync(WURZEL, { recursive: true });
mkdirSync(WURZEL, { recursive: true });

console.log('='.repeat(84));
console.log(`K5 IN EINER tick-ZELLE - ${laufende.length} Zellen a ${N} Laeufe, ${TAGE} Tage, Profil ${PROFIL}`);
console.log('MESSBUILD-WERTE. Treiber tick (mit Raid).');
console.log('_det = Raid-Rhythmus der echten Spieler (Chance 1), _fb = Fallback (Chance 0,7).');
console.log('='.repeat(84));

const ergebnisse = [];
for (const zelle of laufende) {
  const build = baue(zelle);
  const werte = fahre(zelle, build);
  const stat = {};
  ['k5', 'k5b', 'gesamtW1', 'fundW1', 'raidW1', 'gesamtVoll'].forEach(
    (f) => (stat[f] = statistik(werte.map((w) => w[f])))
  );
  ergebnisse.push({ zelle, werte, stat });
}

const zeile = (e, f) => {
  const s = e.stat[f];
  return `${s.mittel.toFixed(1).padStart(6)} ${s.min.toFixed(1).padStart(6)} ${s.max.toFixed(1).padStart(6)}`;
};

console.log('\n' + '='.repeat(84));
console.log('1. K5 (WOCHE 1, ABNAHMEKRITERIUM, UNVERAENDERTE DEFINITION) - Schwelle 50 %');
console.log('='.repeat(84));
console.log('Zelle       K5 Mittel   Min    Max   ueber 50 %   groesste Quelle (Haeufigkeit)');
for (const e of ergebnisse) {
  const drueber = e.werte.filter((w) => w.k5 > 50).length;
  const z = new Map();
  e.werte.forEach((w) => z.set(w.k5Quelle, (z.get(w.k5Quelle) || 0) + 1));
  console.log(`${e.zelle.id.padEnd(11)} ${zeile(e, 'k5')}   ${String(drueber + '/' + e.werte.length).padStart(9)}   ` +
    [...z.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}x`).join(', '));
}

console.log('\n' + '='.repeat(84));
console.log(`2. K5b (VOLLES FENSTER, ${TAGE} TAGE) - KEIN ABNAHMEKRITERIUM, nur zur Einordnung`);
console.log('='.repeat(84));
console.log('Zelle      K5b Mittel   Min    Max   ueber 50 %   groesste Quelle (Haeufigkeit)');
for (const e of ergebnisse) {
  const drueber = e.werte.filter((w) => w.k5b > 50).length;
  const z = new Map();
  e.werte.forEach((w) => z.set(w.k5bQuelle, (z.get(w.k5bQuelle) || 0) + 1));
  console.log(`${e.zelle.id.padEnd(11)} ${zeile(e, 'k5b')}   ${String(drueber + '/' + e.werte.length).padStart(9)}   ` +
    [...z.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}x`).join(', '));
}

console.log('\n' + '='.repeat(84));
console.log('3. ZUSAMMENSETZUNG WOCHE 1 (Mrd Wert-Einheiten, Mittel)');
console.log('='.repeat(84));
console.log('Zelle        gesamt    Fund   Raid  Mining  Praemie | Raid-Container  Laeufe mit Raid');
for (const e of ergebnisse) {
  const m = (f) => mrd(e.werte.reduce((s, w) => s + w[f], 0) / e.werte.length);
  const mitRaid = e.werte.filter((w) => w.raidW1 > 0).length;
  const cont = (e.werte.reduce((s, w) => s + w.raidContainer, 0) / e.werte.length).toFixed(1);
  console.log(`${e.zelle.id.padEnd(11)} ${m('gesamtW1').padStart(7)} ${m('fundW1').padStart(7)} ` +
    `${m('raidW1').padStart(6)} ${m('miningW1').padStart(7)} ${m('praemieW1').padStart(8)} | ` +
    `${cont.padStart(14)}  ${String(mitRaid + '/' + e.werte.length).padStart(15)}`);
}

console.log('\n' + '='.repeat(84));
console.log('4. STREUUNG DER WOCHENEINNAHME - traegt die eigentliche Aussage der Form');
console.log('='.repeat(84));
console.log('Zelle        Mittel      SD     VarK     Min      Max   Spanne  SE(Mittel)');
for (const e of ergebnisse) {
  const s = e.stat.gesamtW1;
  console.log(`${e.zelle.id.padEnd(11)} ${mrd(s.mittel).padStart(7)} ${mrd(s.sd).padStart(7)} ` +
    `${(100 * s.cv).toFixed(1).padStart(7)} % ${mrd(s.min).padStart(7)} ${mrd(s.max).padStart(8)} ` +
    `${s.spanne.toFixed(2).padStart(6)}x ${(100 * s.se / s.mittel).toFixed(1).padStart(8)} %`);
}

const maxNZ = Math.max(...ergebnisse.flatMap((e) => e.werte.map((w) => Math.abs(w.nichtZugeordnet))));
console.log(`\nGegenprobe aller Laeufe: groesste "nicht zugeordnet"-Abweichung ${maxNZ.toFixed(4)} %` +
  (maxNZ > 0.1 ? '   ACHTUNG - eine Buchungsstelle fehlt' : '   (unauffaellig)'));
console.log('ERINNERUNG: K5 darf nach reicherfund_11.txt Abschnitt 9 NICHT als Massstab fuer die');
console.log('Hoehe des Reichen Fundes dienen - es bewegt sich dort nicht monoton. Diese Messung');
console.log('prueft, ob die FORM den Ausgang stabilisiert, nicht ob sie ihn verbessert.');

if (AUSGABE) {
  writeFileSync(AUSGABE, JSON.stringify({ n: N, tage: TAGE, profil: PROFIL, zellen: ergebnisse }, null, 2));
  console.log(`Rohdaten: ${AUSGABE}`);
}
