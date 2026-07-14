import { Worker } from 'node:worker_threads';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CombatResult } from './combat.js';

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
  sideAShips: Record<string, number>;
  sideBShips: Record<string, number>;
  research: Record<string, number>;
  defenseCounts?: Record<string, number>;
  kampfBoostActive?: boolean;
  useAllyStats?: boolean;
}

/**
 * Fuehrt eine komplette Kampf-Simulation (resolveCombat) in einem separaten Node-Worker-Thread aus,
 * statt im Haupt-Thread des Servers. Dadurch blockiert auch ein sehr grosser Kampf (z.B. eine
 * gemeinsame Multiplayer-Flotte im Piraten-Sektor) niemals die Anfragen anderer Spieler.
 */
export function runCombatInWorker(request: CombatWorkerRequest): Promise<CombatResult> {
  return new Promise((resolve, reject) => {
    if (isTs && !fs.existsSync(workerPath)) {
      reject(
        new Error(
          `Combat-Worker nicht gefunden unter ${workerPath}. Im Dev-Modus muss "tsc --watch" mitlaufen (siehe "npm run dev"), damit dist/ aktuell ist.`
        )
      );
      return;
    }
    const worker = new Worker(workerPath, { workerData: request });
    worker.once('message', (result: CombatResult) => {
      resolve(result);
      worker.terminate();
    });
    worker.once('error', (err) => {
      reject(err);
    });
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Combat-Worker beendet mit Code ${code}`));
    });
  });
}
