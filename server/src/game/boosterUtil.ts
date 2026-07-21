import type { PlayerState } from './types.js';

// Bewusst in einer eigenen, abhaengigkeitsfreien Datei statt in actions.ts: wird auch von
// missions.ts/raids.ts/groupOps.ts/simulator.ts gebraucht (fuer den Kampf-Booster,
// kampfBoostActive), die alle wiederum von actions.ts importiert werden - ein Import aus
// actions.ts heraus wuerde dort ueberall einen Zirkelbezug erzeugen.
export function isBoosterActive(state: PlayerState, id: string): boolean {
  const expiry = state.activeBoosters[id];
  return !!expiry && expiry > Date.now();
}
