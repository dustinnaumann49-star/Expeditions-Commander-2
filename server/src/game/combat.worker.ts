import { parentPort } from 'node:worker_threads';
import { resolveCombat, resolveCombatMultiOwner, getEffectiveStats, baseStats } from './combat.js';
import type { CombatWorkerRequest } from './combatRunner.js';

// PERFORMANCE (siehe README): dieser Worker wird jetzt aus einem kleinen, WIEDERVERWENDETEN Pool
// heraus mehrfach genutzt (siehe combatRunner.ts), statt fuer JEDEN einzelnen Kampf neu erzeugt
// und wieder beendet zu werden - jede Worker-Neuerzeugung hat einen spuerbaren Speicher-
// Grundverbrauch (eigener V8-Isolate), was auf sehr knapp bemessenen Server-Instanzen zusammen
// mit der eigentlichen Kampfberechnung zu kurzzeitigen Speicher-/CPU-Spitzen fuehren konnte.
// Dafuer wird hier auf WIEDERHOLTE `postMessage`-Anfragen gelauscht, statt (wie vorher) einmalig
// `workerData` beim Start zu lesen.
function statsFnFor(request: CombatWorkerRequest) {
  return (id: string) => getEffectiveStats(id, request.research, request.defenseCounts || {}, !!request.kampfBoostActive, request.playerClass || null);
}

// Boss-Gefecht (Punkt 76): Seite B nutzt normalerweise die statischen baseStats() - fuer einzelne
// dynamisch berechnete Einheiten (z.B. den Piratenadmiral) wird stattdessen der mitgelieferte
// Override-Wert genutzt, siehe sideBStatsOverride in combatRunner.ts.
function statsFnBFor(request: CombatWorkerRequest) {
  const override = request.sideBStatsOverride;
  if (!override) return baseStats;
  return (id: string) => override[id] || baseStats(id);
}

parentPort?.on('message', (request: CombatWorkerRequest) => {
  const statsFnA = statsFnFor(request);
  const statsFnB = statsFnBFor(request);
  const result = request.contributions
    ? resolveCombatMultiOwner(
        request.contributions,
        statsFnA,
        request.sideBShips,
        statsFnB,
        request.research,
        request.sharedShieldPoolA || 0,
        request.allowRetreat !== false,
        request.battleModifier || null
      )
    : resolveCombat(
        request.sideAShips || {},
        statsFnA,
        request.sideBShips,
        statsFnB,
        request.research,
        request.sharedShieldPoolA || 0,
        request.allowRetreat !== false,
        request.battleModifier || null
      );
  parentPort?.postMessage(result);
});

