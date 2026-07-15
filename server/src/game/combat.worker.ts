import { parentPort, workerData } from 'node:worker_threads';
import { resolveCombat, resolveCombatMultiOwner, getEffectiveStats, baseStats } from './combat.js';
import { ALLY_STATS } from './data/economy.js';
import type { CombatWorkerRequest } from './combatRunner.js';

const { sideAShips, contributions, sideBShips, research, defenseCounts, kampfBoostActive, useAllyStats, sharedShieldPoolA } =
  workerData as CombatWorkerRequest;

function statsFnA(id: string) {
  if (useAllyStats && id === 'verbuendete') return ALLY_STATS;
  return getEffectiveStats(id, research, defenseCounts || {}, !!kampfBoostActive);
}

const result = contributions
  ? resolveCombatMultiOwner(contributions, statsFnA, sideBShips, baseStats, research, sharedShieldPoolA || 0)
  : resolveCombat(sideAShips || {}, statsFnA, sideBShips, baseStats, research, sharedShieldPoolA || 0);

parentPort?.postMessage(result);
