import { serverNow } from './serverTime';
import type { GameData, PlayerState } from '../types/game';

export function isBoosterActive(state: PlayerState, boosterId: string): boolean {
  const expiry = state.activeBoosters[boosterId];
  return !!expiry && expiry > serverNow();
}

// Spiegelt server/src/game/actions.ts's bauzeitMultiplier() 1:1 - Bauzeit-Forschung reduziert bis
// maximal 70% (Faktor min. 0.3), der "bautempo"-Booster halbiert das Ergebnis zusaetzlich.
export function getBauzeitMultiplier(gameData: GameData, state: PlayerState): number {
  const tech = gameData.research.find((r) => r.id === 'bauzeit');
  const effectPerLevel = tech ? tech.effectPerLevel : 0.05;
  let m = Math.max(0.3, 1 - (state.research.bauzeit || 0) * effectPerLevel);
  if (isBoosterActive(state, 'bautempo')) m *= 0.5;
  return m;
}

// Spiegelt server/src/game/actions.ts's researchTimeMultiplier() 1:1 - nur der
// "forschungstempo"-Booster halbiert die Forschungszeit, es gibt keine Forschung, die sich selbst
// beschleunigt.
export function getForschungszeitMultiplier(state: PlayerState): number {
  return isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
}
