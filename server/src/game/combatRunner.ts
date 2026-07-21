import { Worker } from 'node:worker_threads';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CombatResult, MultiOwnerCombatResult, OwnedFleetContribution } from './combat.js';
import type { BattleModifierType } from './data/combatConstants.js';
import type { CombatStats, PlayerClass } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// tsx transformiert TypeScript zwar problemlos im Haupt-Thread, aber die Modul-Aufloesung von
// ".js"-Importen auf die echten ".ts"-Dateien funktioniert innerhalb von Node-Worker-Threads
// nachweislich nicht zuverlaessig (getestet, bekannte Einschraenkung der tsx+worker_threads-
// Kombination). Deshalb laeuft der Worker IMMER mit fertig kompiliertem JavaScript aus "dist/" -
// auch waehrend der Entwicklung. Der "dev"-Befehl in package.json startet dafuer zusaetzlich
// "tsc --watch" im Hintergrund, damit "dist/" automatisch aktuell bleibt.
const isTs = import.meta.url.endsWith('.ts');
const workerDir = isTs ? path.join(__dirname, '..', '..', 'dist', 'game') : __dirname;
const workerPath = path.join(workerDir, 'combat.worker.js');

export interface CombatWorkerRequest {
  sideAShips?: Record<string, number>;
  contributions?: OwnedFleetContribution[]; // alternative zu sideAShips fuer Mehrspieler-Kaempfe
  sideBShips: Record<string, number>;
  research: Record<string, number>;
  defenseCounts?: Record<string, number>;
  kampfBoostActive?: boolean;
  // Klassenbonus von Seite A im Einzelspieler-Fall (Kampfbonus je Klasse, siehe getEffectiveStats()
  // in combat.ts). Bei Mehrspieler-Kaempfen traegt stattdessen JEDE einzelne OwnedFleetContribution
  // ihre eigene playerClass, da mehrere Beitragende unterschiedliche Klassen haben koennen.
  playerClass?: PlayerClass | null;
  // Eigene Schiffs-Module von Seite A im Einzelspieler-Fall (siehe data/shipModules.ts) - analog
  // zu playerClass gilt bei Mehrspieler-Kaempfen stattdessen shipModules PRO Contribution.
  shipModules?: Record<string, number>;
  sharedShieldPoolA?: number; // gemeinsamer Kuppel-Schild-Pool fuer Seite A (Heimatverteidigung)
  // Ob Seite A sich bei 50% Verlusten zurueckziehen kann (Standard: ja). Bei der Heimatverteidigung
  // (Raids) MUSS das auf false stehen - man kann sich nicht aus der Verteidigung der eigenen Basis
  // "zurueckziehen", und da Verteidigungsanlagen oft viel schneller sterben als eine grosse Flotte,
  // wuerde ein Rueckzug sonst die ganze Streitmacht zu frueh abziehen, obwohl die Flotte selbst noch
  // laengst kampffaehig waere.
  allowRetreat?: boolean;
  // Seltener Kampf-Modifikator fuer diesen einen Kampf (Nebel/Ionensturm/etc., siehe
  // BATTLE_MODIFIER_LABELS in combatConstants.ts) - wird vor dem Kampf gewuerfelt und hier nur
  // durchgereicht, damit die eigentliche Wuerfel-Logik ausserhalb des Workers bleibt (der Worker
  // bekommt nur reine Daten, siehe README "Wichtige Punkte" Punkt 3).
  battleModifier?: BattleModifierType | null;
  // Boss-Gefecht (Punkt 76): dynamisch berechnete Kampfwerte fuer einzelne Seite-B-Einheiten
  // (z.B. der Piratenadmiral, siehe generateAdmiralEncounter() in combat.ts) - ueberschreibt
  // fuer die genannten IDs die normalen statischen baseStats()-Werte. Alle anderen Seite-B-
  // Einheiten (z.B. die Eskorte) nutzen weiterhin ganz normal ihre statischen Schiffswerte.
  sideBStatsOverride?: Record<string, CombatStats>;
}

// PERFORMANCE-NOTMASSNAHME (siehe README): auf dem Starter-Tarif (0,5 CPU / 512MB RAM) fuehrte
// das wiederholte Erzeugen+Beenden eines NEUEN Worker-Threads pro Kampf zu kurzzeitigen CPU-UND
// Speicher-Spitzen bis 100% (jede Worker-Neuerzeugung hat einen spuerbaren Grundverbrauch durch
// den eigenen V8-Isolate) - selbst bei nur EINEM Kampf. Fix: ein kleiner, WIEDERVERWENDETER Pool
// aus dauerhaft laufenden Workern (siehe combat.worker.ts, laesst sich jetzt per postMessage
// mehrfach nutzen) statt Neuerzeugung pro Kampf. Wird erst beim ALLERERSTEN Kampf angelegt
// (kein Overhead, solange nie gekaempft wird), bleibt danach fuer die gesamte Laufzeit des
// Server-Prozesses bestehen.
const POOL_SIZE = 2; // begrenzt gleichzeitig laufende Worker - genug fuer zwei parallele Kaempfe,
// ohne bei mehr gleichzeitigen Anfragen unbegrenzt viele Worker (und damit Speicher) zu erzeugen.

interface PoolEntry {
  worker: Worker;
  busy: boolean;
}

let pool: PoolEntry[] | null = null;
const waitQueue: Array<() => void> = [];

function getPool(): PoolEntry[] {
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => ({ worker: new Worker(workerPath), busy: false }));
  }
  return pool;
}

function acquireWorker(): Promise<PoolEntry> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      const entry = getPool().find((e) => !e.busy);
      if (entry) {
        entry.busy = true;
        resolve(entry);
      } else {
        waitQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

function releaseWorker(entry: PoolEntry): void {
  entry.busy = false;
  const next = waitQueue.shift();
  if (next) next();
}

// Ersetzt einen kaputten Worker durch einen frischen, statt ihn dauerhaft im Pool zu behalten -
// verhindert, dass ein einmal fehlgeschlagener Kampf den Pool-Slot fuer immer blockiert.
function discardWorker(entry: PoolEntry): void {
  if (!pool) return;
  const idx = pool.indexOf(entry);
  if (idx === -1) return;
  try {
    entry.worker.terminate();
  } catch {
    // Worker war ohnehin schon kaputt/beendet - nichts weiter zu tun.
  }
  pool[idx] = { worker: new Worker(workerPath), busy: false };
  const next = waitQueue.shift();
  if (next) next();
}

function runWorker<T>(request: CombatWorkerRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    if (isTs && !fs.existsSync(workerPath)) {
      reject(
        new Error(
          `Combat-Worker nicht gefunden unter ${workerPath}. Im Dev-Modus muss "tsc --watch" mitlaufen (siehe "npm run dev"), damit dist/ aktuell ist.`
        )
      );
      return;
    }
    acquireWorker()
      .then((entry) => {
        const cleanup = () => {
          entry.worker.off('message', onMessage);
          entry.worker.off('error', onError);
        };
        const onMessage = (result: T) => {
          cleanup();
          releaseWorker(entry);
          resolve(result);
        };
        const onError = (err: Error) => {
          cleanup();
          discardWorker(entry); // Worker war offenbar in einem kaputten Zustand - nicht wiederverwenden
          reject(err);
        };
        entry.worker.once('message', onMessage);
        entry.worker.once('error', onError);
        entry.worker.postMessage(request);
      })
      .catch(reject);
  });
}

/**
 * Fuehrt eine komplette Kampf-Simulation (resolveCombat) in einem separaten Node-Worker-Thread aus,
 * statt im Haupt-Thread des Servers. Dadurch blockiert auch ein sehr grosser Kampf (z.B. eine
 * gemeinsame Multiplayer-Flotte im Piraten-Sektor) niemals die Anfragen anderer Spieler.
 */
export function runCombatInWorker(request: CombatWorkerRequest): Promise<CombatResult> {
  return runWorker<CombatResult>(request);
}

/**
 * Wie runCombatInWorker, aber fuer Kaempfe mit mehreren Beitragenden (Gruppen-Expeditionen,
 * Raid-Verstaerkung) - `request.contributions` statt `sideAShips`.
 */
export function runMultiOwnerCombatInWorker(request: CombatWorkerRequest): Promise<MultiOwnerCombatResult> {
  return runWorker<MultiOwnerCombatResult>(request);
}
