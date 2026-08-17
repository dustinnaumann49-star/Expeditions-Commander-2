// Erzeugt den Messbuild fuer Entscheidung 13.3 (Block C, Schritt 6).
//
// Gleiches Verfahren wie bei make_messbuild_44.mjs und M3 (Rundendeckel): der QUELLCODE bleibt
// unveraendert, variiert wird ausschliesslich die KOMPILIERTE Konstante in einer Kopie des
// dist-Baums.
//
// WARUM ueberhaupt ein Messbuild: PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS steht produktiv auf
// 2 Minuten (= HEARTBEAT_INTERVAL_MS). Eine Messung, die den Unterschied zwischen "wenige Aufrufe"
// und "viele Aufrufe" sichtbar machen soll, muesste damit ueber Stunden laufen. Der Messbuild
// setzt das Intervall auf 1 Sekunde herunter - die MECHANIK ist identisch, nur die Zeitachse ist
// gestaucht. Was gemessen wird, ist nicht die Hoehe des Intervalls, sondern die Frage aus dem
// Messkriterium zu 13.3: haengt das Wachstum noch an der Zahl der Aufrufe?
//
// Aufruf: node make_messbuild_133.mjs
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('../../server/dist');
const ROOT = resolve('.');
const NODE_MODULES = resolve('../../server/node_modules');

// Anders als die 4.4-Messbuilds (die nur combat.js/combatConstants.js laden) zieht
// pirateBaseState.js ueber db.js `better-sqlite3` nach. Ein dist-Baum ausserhalb von server/
// findet das Paket nicht, weil Node beim Aufloesen nur die Verzeichnisse OBERHALB der Datei
// durchsucht. Ein Symlink im Messbuild-Wurzelverzeichnis loest das, ohne den Baum zu verschieben.
function linkNodeModules(target) {
  const link = resolve(target, 'node_modules');
  if (!existsSync(link)) symlinkSync(NODE_MODULES, link, 'dir');
}

const ANCHOR = 'const PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 2 * 60 * 1000;';
const PATCHED = 'const PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 1000;';

const target = resolve(ROOT, 'messbuild_133_NACHHER');
if (existsSync(target)) rmSync(target, { recursive: true });
cpSync(DIST, target, { recursive: true });

const file = resolve(target, 'game/pirateBaseState.js');
const src = readFileSync(file, 'utf8');
if (!src.includes(ANCHOR)) {
  throw new Error('Anker PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS nicht gefunden - ist der Server frisch gebaut (npx tsc)?');
}
writeFileSync(file, src.replace(ANCHOR, PATCHED));
linkNodeModules(target);
linkNodeModules(resolve(ROOT, 'messbuild_133_VORHER'));

// ---- Zaehler-Instrumentierung, in BEIDE Builds ----
// Warum nicht am Wachstum gemessen: ueber ein kurzes Zeitfenster ist nicht die Aufruf-Haeufigkeit
// die Bremse, sondern die vollen Bau-Slots (gemessen 17.08.2026: Reaper 12 min, Solarkraftwerk
// 86 min, Forschung 12 h Laufzeit - in 20 s wird nichts fertig, die Warteschlangen stehen nach
// wenigen Zuegen auf 11/11 und jeder weitere Zug ist folgenlos). Der Wachstums-Vergleich misst
// dann das Slot-Limit statt der Aufruf-Abhaengigkeit und zeigt faelschlich "kein Unterschied".
// Gezaehlt wird deshalb direkt die Groesse, um die es in 13.3 geht: die Zahl der ausgefuehrten
// BAU-ENTSCHEIDUNGSSCHRITTE. Der Zaehler existiert NUR im Messbuild, nie im Quellcode.
const COUNTER_DECL = 'export let economyTurnCount = 0;\nexport function resetEconomyTurnCount() { economyTurnCount = 0; }\n';
// Ein Anker fuer beide Staende: der VORHER-Build ruft direkt auf, der NACHHER-Build in einer
// for-Schleife ueber die faelligen Zuege. In beiden Faellen ist der Aufruf selbst identisch und
// kommt genau einmal im Quelltext vor.
const CALL = 'runEconomyBotTurn(base.state);';
// ACHTUNG, am 17.08.2026 einmal falsch gemacht: der Zaehler MUSS in einen eigenen Block. Der
// NACHHER-Build kompiliert zu einer for-Schleife OHNE geschweifte Klammern
// (`for (...) runEconomyBotTurn(base.state);`) - ein einfach angehaengtes `economyTurnCount++;`
// steht dann AUSSERHALB der Schleife und zaehlt Ladevorgaenge statt Zuege. Das sah in der Messung
// aus wie eine wirkungslose Drosselung (x10.082 statt x1,00) und war ein Fehler im Messwerkzeug.
const CALL_COUNTED = '{ runEconomyBotTurn(base.state); economyTurnCount++; }';

function instrument(dir) {
  const f = resolve(dir, 'game/pirateBaseState.js');
  let s = readFileSync(f, 'utf8');
  if (!s.includes(CALL)) throw new Error(`${dir}: Aufruf-Anker runEconomyBotTurn(base.state) nicht gefunden`);
  if ((s.match(new RegExp(CALL.replace(/[.()]/g, '\\$&'), 'g')) || []).length !== 1) {
    throw new Error(`${dir}: Anker nicht eindeutig - Instrumentierung waere mehrdeutig`);
  }
  s = COUNTER_DECL + s.replace(CALL, CALL_COUNTED);
  writeFileSync(f, s);
}

instrument(target);
instrument(resolve(ROOT, 'messbuild_133_VORHER'));
console.log('Zaehler economyTurnCount in beide Builds eingebaut (nur Messbuild, nicht im Quellcode).');

console.log(`NACHHER -> ${target}   [PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 1000 ms statt 120000 ms]`);
console.log('VORHER  -> messbuild_133_VORHER   (Kopie des dist-Baums VOR der Aenderung, ungedrosselt)');
console.log('\nQuellcode unberuehrt:', resolve('../../server/src/game/pirateBaseState.ts'));
