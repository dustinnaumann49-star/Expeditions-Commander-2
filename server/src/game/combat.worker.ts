import { parentPort } from 'node:worker_threads';
import { resolveCombat, resolveCombatMultiOwner, getEffectiveStats, baseStats } from './combat.js';
import { ALLY_STATS } from './data/economy.js';
import type { CombatWorkerRequest } from './combatRunner.js';

// PERFORMANCE (siehe README): dieser Worker wird jetzt aus einem kleinen, WIEDERVERWENDETEN Pool
// heraus mehrfach genutzt (siehe combatRunner.ts), statt fuer JEDEN einzelnen Kampf neu erzeugt
// und wieder beendet zu werden - jede Worker-Neuerzeugung hat einen spuerbaren Speicher-
// Grundverbrauch (eigener V8-Isolate), was auf sehr knapp bemessenen Server-Instanzen zusammen
// mit der eigentlichen Kampfberechnung zu kurzzeitigen Speicher-/CPU-Spitzen fuehren konnte.
// Dafuer wird hier auf WIEDERHOLTE `postMessage`-Anfragen gelauscht, statt (wie vorher) einmalig
// `workerData` beim Start zu lesen.
function statsFnFor(request: CombatWorkerRequest) {
  return (id: string) => {
    if (request.useAllyStats && id === 'verbuendete') return ALLY_STATS;
    return getEffectiveStats(id, request.research, request.defenseCounts || {}, !!request.kampfBoostActive);
  };
}

parentPort?.on('message', (request: CombatWorkerRequest) => {
  const statsFnA = statsFnFor(request);
  const result = request.contributions
    ? resolveCombatMultiOwner(
        request.contributions,
        statsFnA,
        request.sideBShips,
        baseStats,
        request.research,
        request.sharedShieldPoolA || 0,
        request.allowRetreat !== false,
        request.battleModifier || null
      )
    : resolveCombat(
        request.sideAShips || {},
        statsFnA,
        request.sideBShips,
        baseStats,
        request.research,
        request.sharedShieldPoolA || 0,
        request.allowRetreat !== false,
        request.battleModifier || null
      );
  parentPort?.postMessage(result);
});

