import { parentPort } from 'node:worker_threads';
import { resolveCombat, resolveCombatMultiOwner, getEffectiveStats, computePirateResearch } from './combat.js';
import type { CombatWorkerRequest } from './combatRunner.js';

// PERFORMANCE (siehe README): dieser Worker wird jetzt aus einem kleinen, WIEDERVERWENDETEN Pool
// heraus mehrfach genutzt (siehe combatRunner.ts), statt fuer JEDEN einzelnen Kampf neu erzeugt
// und wieder beendet zu werden - jede Worker-Neuerzeugung hat einen spuerbaren Speicher-
// Grundverbrauch (eigener V8-Isolate), was auf sehr knapp bemessenen Server-Instanzen zusammen
// mit der eigentlichen Kampfberechnung zu kurzzeitigen Speicher-/CPU-Spitzen fuehren konnte.
// Dafuer wird hier auf WIEDERHOLTE `postMessage`-Anfragen gelauscht, statt (wie vorher) einmalig
// `workerData` beim Start zu lesen.
function statsFnFor(request: CombatWorkerRequest) {
  return (id: string) =>
    getEffectiveStats(id, request.research, request.defenseCounts || {}, !!request.kampfBoostActive, request.playerClass || null, request.shipModules || {});
}

// Boss-Gefecht (Punkt 76): Seite B nutzt normalerweise die Piraten-Werte (Basiswerte + anteilige
// Forschung, siehe PIRATE_RESEARCH_SHARE/computePirateResearch() in combat.ts) - fuer einzelne
// dynamisch berechnete Einheiten (z.B. den Piratenadmiral selbst) wird stattdessen der
// mitgelieferte Override-Wert genutzt (bleibt bewusst UNBEEINFLUSST von Forschung - eigene,
// unabhaengige Macht-Skalierungsformel, siehe generateAdmiralEncounter()), siehe
// sideBStatsOverride in combatRunner.ts.
function statsFnBFor(request: CombatWorkerRequest) {
  const override = request.sideBStatsOverride;
  const pirateResearch = computePirateResearch(request.research, request.contributions);
  const pirateStats = (id: string) => getEffectiveStats(id, pirateResearch, {}, false, null, {});
  if (!override) return pirateStats;
  return (id: string) => override[id] || pirateStats(id);
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

