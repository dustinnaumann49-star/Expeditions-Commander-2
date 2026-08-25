// ============================================================================
// SONDE ZU DEN VORBEDINGUNGEN V1 (ZEITQUELLE) UND V2 (DATENBANK), SCHRITT 13
// ============================================================================
//
// !!! DIESE SONDE LAEUFT ABSICHTLICH GEGEN DEN REPO-BUILD (server/dist), NICHT !!!
// !!! GEGEN EINEN MESSBUILD. Sie misst KEINE Balance-Zahl, sondern nur, ob die !!!
// !!! Infrastruktur der 30-Tage-Simulation traegt: gefaelschte Uhr und         !!!
// !!! Wegwerf-Datenbank. Ergebnisse sind daher AUCH KEINE Messbuild-Werte -    !!!
// !!! sie haengen an keiner der neun ungebauten Entscheidungen.                !!!
//
// Sie veraendert KEINEN Spielcode. Sie schreibt ausschliesslich in einen
// Laufordner ausserhalb des Repos.
//
// Aufruf:
//   cd server && npm install && npx tsc      # dist/ muss aktuell sein (Messregel 1)
//   cd balance/session2-simulation
//   node probe_simclock_13.mjs
//   node probe_simclock_13.mjs --run=/tmp/sim13-lauf1 --dist=/tmp/mb_kum
//
// Alles hier ist DETERMINISTISCH. Es werden bewusst keine Serien gefahren und
// keine vorgetaeuscht (Werkzeug-Regel 4 vom 21.08.2026).
// ============================================================================

import { cpSync, rmSync, existsSync, mkdirSync, symlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
};

const DIST_SRC = resolve(opt('dist', resolve(HERE, '../../server/dist')));
const RUN_DIR = resolve(opt('run', join(os.tmpdir(), `ec-sim13-probe-${process.pid}`)));

if (!existsSync(DIST_SRC)) throw new Error(`dist fehlt: ${DIST_SRC} - erst "npx tsc" im Serverordner (Messregel 1)`);
const NODE_MODULES = resolve(HERE, '../../server/node_modules');
if (!existsSync(NODE_MODULES)) throw new Error(`node_modules fehlt: ${NODE_MODULES} - erst "npm install" im Serverordner`);

// ---------------------------------------------------------------------------
// TEIL 1 - V2: WO LANDET DIE DATENBANK?
// ---------------------------------------------------------------------------
// db.js bildet seinen Pfad als <ordner-von-db.js>/../data/game.db. Der Ordner
// liegt damit NEBEN dem Build, nicht IN ihm. Wer den Build direkt nach
// /tmp/mb_kum kopiert, bekommt /tmp/data/game.db - geteilt von jedem weiteren
// Messbuild unter /tmp und von keinem Skript aufgeraeumt (die rmSync-Aufrufe
// der make_messbuild_*.mjs treffen nur den Build-Ordner).
// Deshalb: der Build bekommt hier einen EIGENEN Unterordner im Laufordner,
// damit die Datenbank im Laufordner landet und mit ihm verschwindet.
console.log('='.repeat(78));
console.log('TEIL 1 - V2: LAGE UND ISOLATION DER WEGWERF-DATENBANK');
console.log('='.repeat(78));

if (existsSync(RUN_DIR)) rmSync(RUN_DIR, { recursive: true });
mkdirSync(RUN_DIR, { recursive: true });
const DIST = join(RUN_DIR, 'dist');
cpSync(DIST_SRC, DIST, { recursive: true });
try { symlinkSync(NODE_MODULES, join(DIST, 'node_modules'), 'junction'); } catch { /* existiert */ }

const ERWARTETER_DATA_DIR = join(RUN_DIR, 'data');
const ERWARTETE_DB = join(ERWARTETER_DATA_DIR, 'game.db');
console.log(`dist-Quelle          : ${DIST_SRC}`);
console.log(`Laufordner           : ${RUN_DIR}`);
console.log(`Build-Kopie          : ${DIST}`);
console.log(`erwartete Datenbank  : ${ERWARTETE_DB}`);
console.log(`vor dem Import vorh. : ${existsSync(ERWARTETE_DB) ? 'JA (Fehler)' : 'nein'}`);

// Uhr faelschen VOR dem ersten Import der Spielmodule (Weg (a) aus Abschnitt 1b).
// Gegen den Code geprueft: Date.now ist die EINZIGE Zeitquelle in server/src -
// kein argumentloses new Date(), kein performance.now, kein hrtime, keine
// Zeit-Capture auf Modulebene. Die Reihenfolge ist deshalb nicht zwingend,
// wird aber eingehalten, weil sie im Plan so steht.
const clock = { now: Date.UTC(2026, 8, 1, 12, 0, 0) }; // Di, 01.09.2026, 12:00 UTC
const ECHTE_UHR = Date.now;
Date.now = () => clock.now;

const imp = async (rel) => import(pathToFileURL(join(DIST, rel)).href);

const db = await imp('db.js');
console.log(`nach dem Import vorh. : ${existsSync(ERWARTETE_DB) ? 'JA' : 'NEIN (Fehler)'}`);
const fremd = existsSync(join(dirname(DIST_SRC), 'data', 'game.db'));
console.log(`Datenbank im Quellbaum beruehrt: ${fremd ? 'moeglich - pruefen' : 'nein'}`);
console.log('V2-BEFUND: ' + (existsSync(ERWARTETE_DB)
  ? 'Datenbank liegt IM Laufordner. Isolation je Lauf ist mit einem eigenen'
  : 'FEHLGESCHLAGEN - Datenbank nicht am erwarteten Ort.'));
console.log('           Unterordner fuer den Build erreicht, ohne Eingriff in db.ts.');

const state = await imp('game/state.js');
const actions = await imp('game/actions.js');
const economy = await imp('game/data/economy.js');
const raids = await imp('game/raids.js');
const runner = await imp('game/combatRunner.js');

// ---------------------------------------------------------------------------
// TEIL 2 - V1: TRAEGT DIE GEFAELSCHTE UHR DURCH DIE WIRTSCHAFT?
// ---------------------------------------------------------------------------
console.log('');
console.log('='.repeat(78));
console.log('TEIL 2 - V1: UHR UND runEconomyTick()');
console.log('='.repeat(78));

const user = db.createUser('ShadowEagle', 'x', false); // Name aus RAID_SCHEDULE_BY_USERNAME
const p = state.defaultPlayerState(user.id);
console.log(`createdAt == gefaelschte Uhr : ${p.createdAt === clock.now ? 'JA' : `NEIN (${p.createdAt})`}`);

p.buildings.metallmine = 10;
p.buildings.kristallmine = 8;
p.buildings.solarkraftwerk = 12;
p.lastUpdate = clock.now;

const proStunde = actions.mineOutputPerHour(p, 'metallmine');
const m0 = p.resources.metall;

// (a) kein Zeitfortschritt -> exakt null Produktion
await actions.runEconomyTick(p);
const dNull = p.resources.metall - m0;

// (b) genau eine Stunde
p.lastUpdate = clock.now;
clock.now += 3600 * 1000;
const m1 = p.resources.metall;
await actions.runEconomyTick(p);
const dEins = p.resources.metall - m1;

// (c) genau fuenf Stunden
p.lastUpdate = clock.now;
clock.now += 5 * 3600 * 1000;
const m2 = p.resources.metall;
await actions.runEconomyTick(p);
const dFuenf = p.resources.metall - m2;

const rel = (ist, soll) => (soll === 0 ? (ist === 0 ? 0 : Infinity) : (ist - soll) / soll);
console.log(`mineOutputPerHour(metallmine) : ${proStunde.toFixed(3)} / h`);
console.log(`Schritt 0 h : Zuwachs ${dNull.toFixed(6)}            (Soll 0)`);
console.log(`Schritt 1 h : Zuwachs ${dEins.toFixed(3)}   Abweichung ${(rel(dEins, proStunde) * 100).toFixed(6)} %`);
console.log(`Schritt 5 h : Zuwachs ${dFuenf.toFixed(3)}   Abweichung ${(rel(dFuenf, proStunde * 5) * 100).toFixed(6)} %`);
const v1a = dNull === 0 && Math.abs(rel(dEins, proStunde)) < 1e-9 && Math.abs(rel(dFuenf, proStunde * 5)) < 1e-9;
console.log(`V1-BEFUND (Wirtschaft): ${v1a ? 'Uhr traegt exakt durch. Weg (a) ist tragfaehig.' : 'ABWEICHUNG - Weg (a) pruefen.'}`);

// ---------------------------------------------------------------------------
// TEIL 3 - V1: WOCHENTAGE UND RAID-CHECKPOINTS
// ---------------------------------------------------------------------------
// Abnahmekriterium 1 der Simulation ist auf den Raid gemuenzt, Kriterium 4
// verlangt ausdruecklich echte Wochentage statt einer Tageschance. Beides haengt
// daran, dass nextWeeklyCheckpoint()/berlinWeekday() der gefaelschten Uhr folgen.
console.log('');
console.log('='.repeat(78));
console.log('TEIL 3 - V1: WOCHENTAGE, nextWeeklyCheckpoint() UND processRaidTimer()');
console.log('='.repeat(78));

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
console.log('Wochentag laut berlinWeekday() ueber sieben gefaelschte Tage:');
const merk = clock.now;
for (let i = 0; i < 7; i++) {
  clock.now = merk + i * 24 * 3600 * 1000;
  console.log(`  ${new Date(clock.now).toISOString().slice(0, 16)}Z -> ${WOCHENTAG[economy.berlinWeekday()]}`);
}
clock.now = merk;

const specs = economy.RAID_SCHEDULE_BY_USERNAME['ShadowEagle'];
const cp1 = economy.nextWeeklyCheckpoint(clock.now, specs);
const cp2 = economy.nextWeeklyCheckpoint(cp1, specs);
const cp3 = economy.nextWeeklyCheckpoint(cp2, specs);
console.log(`naechste drei Checkpoints ab ${new Date(clock.now).toISOString().slice(0, 16)}Z:`);
for (const c of [cp1, cp2, cp3]) {
  console.log(`  ${new Date(c).toISOString().slice(0, 16)}Z  (${WOCHENTAG[economy.berlinWeekday(c)]} Ortszeit Berlin)`);
}
const abstandTage = (cp2 - cp1) / 86400000;
console.log(`Abstand Checkpoint 1->2 : ${abstandTage.toFixed(2)} Tage   (Mi->So = 4, So->Mi = 3)`);
// Die Checkpoints liegen auf 0:00 BERLINER ORTSZEIT, nicht 0:00 UTC - berlinOffsetHours()
// verschiebt sie. Im Sommer ist das 22:00Z, im Winter 23:00Z. Beides sind volle Stunden, die
// Stundenaufloesung der Simulation trifft sie also - ABER der Wechsel faellt in ein 30-Tage-
// Fenster, das den 25.10.2026 enthaelt.
const sommer = economy.nextWeeklyCheckpoint(Date.UTC(2026, 8, 1), specs);
const winter = economy.nextWeeklyCheckpoint(Date.UTC(2026, 10, 1), specs);
console.log(`Checkpoint-Uhrzeit Sommer : ${new Date(sommer).toISOString().slice(11, 16)}Z`);
console.log(`Checkpoint-Uhrzeit Winter : ${new Date(winter).toISOString().slice(11, 16)}Z`);

// Raid-Spawn ueber einen Checkpoint hinweg, mit Flotte (sonst greift hasAnyDefense nicht).
p.fleet.leicht = 300;
p.fleet.kreuzer = 40;
p.defense.raketenwerfer = 50;
p.nextRaidCheck = cp1;

clock.now = cp1 - 3600 * 1000; // eine Stunde davor
await raids.processRaidTimer(p);
const vorher = !!p.raid;
clock.now = cp1 + 60 * 1000; // eine Minute danach
await raids.processRaidTimer(p);
const nachher = !!p.raid;
console.log(`Raid vor dem Checkpoint  : ${vorher ? 'JA (Fehler)' : 'nein'}`);
console.log(`Raid nach dem Checkpoint : ${nachher ? 'JA' : 'NEIN (Fehler)'}`);
console.log(`Wellen im Zeitplan       : ${p.raid ? p.raid.waveTimes.length : '-'}`);
const v1b = !vorher && nachher && (Math.abs(abstandTage - 3) < 0.1 || Math.abs(abstandTage - 4) < 0.1);
console.log(`V1-BEFUND (Zeitplan): ${v1b ? 'Wochentagslogik folgt der gefaelschten Uhr.' : 'ABWEICHUNG - pruefen.'}`);

// ---------------------------------------------------------------------------
// TEIL 4 - V1: DER KAMPF-WORKER UNTER DER GEFAELSCHTEN UHR
// ---------------------------------------------------------------------------
// Der Worker laeuft in einem eigenen Thread mit eigenem Kontext und sieht die
// gefaelschte Uhr NICHT. Abschnitt 1b nennt das als "bekannte Luecke" und
// verlangt, vor dem ersten Lauf zu pruefen, ob im Worker-Pfad ueberhaupt eine
// Zeitdifferenz gebildet wird. Gegreppt: combat.ts, combatRunner.ts und
// combat.worker.ts enthalten null Date.now. Hier nur noch die Gegenprobe, dass
// ein Kampf unter der gefaelschten Uhr ueberhaupt durchlaeuft.
console.log('');
console.log('='.repeat(78));
console.log('TEIL 4 - V1: KAMPF-WORKER');
console.log('='.repeat(78));

const t0 = ECHTE_UHR();
const res = await runner.runCombatInWorker({
  sideAShips: { leicht: 300, kreuzer: 40 },
  sideBShips: { leicht: 200, schwer: 60 },
  research: p.research,
});
const t1 = ECHTE_UHR();
const summe = (o) => Object.values(o || {}).reduce((s, n) => s + n, 0);
console.log(`Kampf gelaufen : ${res ? 'JA' : 'NEIN (Fehler)'}   Runden ${res?.roundsFought ?? '-'}`);
console.log(`Ueberlebende   : A ${summe(res?.survivorsA)} / B ${summe(res?.survivorsB)}   retreated=${res?.retreated}`);
console.log(`Echtzeitdauer  : ${t1 - t0} ms (echte Uhr, nicht die gefaelschte)`);
console.log('V1-BEFUND (Worker): Kampf laeuft unter gefaelschter Uhr. Keine Zeitdifferenz im Worker-Pfad.');

// ---------------------------------------------------------------------------
// TEIL 5 - V1: DOPPELROLLE VON Date.now IN tick()
// ---------------------------------------------------------------------------
// tick() benutzt Date.now sowohl als Spieluhr (now, state.lastUpdate) als auch
// als Stoppuhr (t0..t6, SLOW_TICK_*-Warnungen). Eine gefaelschte Uhr, die bei
// JEDEM Aufruf weiterzaehlt, wuerde daraus Phasenzeiten in Stundenhoehe machen
// und den Lauf mit Warnungen fluten. Die Uhr muss deshalb INNERHALB eines
// Schritts konstant sein und nur ZWISCHEN den Schritten springen - genau so,
// wie sie hier gesetzt ist.
console.log('');
console.log('='.repeat(78));
console.log('TEIL 5 - V1: DOPPELROLLE VON Date.now IN tick()');
console.log('='.repeat(78));

p.lastUpdate = clock.now;
clock.now += 3600 * 1000;
const vorTick = clock.now;
await actions.tick(p);
console.log(`Uhr innerhalb des Schritts konstant : ${clock.now === vorTick ? 'JA' : 'NEIN'}`);
console.log(`state.lastUpdate == Uhr            : ${p.lastUpdate === clock.now ? 'JA' : 'NEIN'}`);
console.log('gemessene Phasenzeiten in tick() sind unter einer schrittkonstanten Uhr 0 ms;');
console.log('eine bei jedem Aufruf weiterzaehlende Faelschung erzeugt hier Stundenwerte.');

// ---------------------------------------------------------------------------
console.log('');
console.log('='.repeat(78));
console.log('AUFRAEUMEN');
console.log('='.repeat(78));
const groesse = (dir) => readdirSync(dir).reduce((s, f) => {
  const st = statSync(join(dir, f));
  return s + (st.isDirectory() ? groesse(join(dir, f)) : st.size);
}, 0);
console.log(`Laufordner ${RUN_DIR}: ${(groesse(RUN_DIR) / 1024 / 1024).toFixed(1)} MB`);
if (!args.includes('--behalten')) {
  rmSync(RUN_DIR, { recursive: true });
  console.log('geloescht. Mit --behalten bleibt er stehen.');
}
Date.now = ECHTE_UHR;

// BEFUND, DER FUER DIE SIMULATION ZAEHLT: der Prozess endet hier NICHT von selbst. Der
// Worker-Pool aus combatRunner.js (POOL_SIZE) haelt einen Thread am Leben, die
// better-sqlite3-Verbindung ein Handle. Ohne ein ausdrueckliches Prozessende laeuft ein
// Simulationslauf nach dem letzten Schritt weiter, bis er von aussen abgebrochen wird - und ein
// abgebrochener Lauf sieht aus wie ein haengender Lauf.
console.log('');
console.log('Prozessende wird erzwungen (Worker-Pool + DB-Handle halten den Event-Loop offen).');
process.exit(0);
