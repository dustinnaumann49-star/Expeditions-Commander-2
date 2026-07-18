import { serverNow } from './serverTime';
import type { GameData, PlayerState } from '../types/game';

export function isBoosterActive(state: PlayerState, boosterId: string): boolean {
  const expiry = state.activeBoosters[boosterId];
  return !!expiry && expiry > serverNow();
}

function baseTimeMultiplier(gameData: GameData, state: PlayerState): number {
  const tech = gameData.research.find((r) => r.id === 'bauzeit');
  const effectPerLevel = tech ? tech.effectPerLevel : 0.05;
  let m = Math.max(0.3, 1 - (state.research.bauzeit || 0) * effectPerLevel);
  if (isBoosterActive(state, 'bautempo')) m *= 0.5;
  return m;
}

// Spiegelt server/src/game/actions.ts's roboterNaniteFactor() 1:1 - kompoundierend (nicht
// linear) pro Stufe, damit Bauzeiten nie negativ/Null werden. Gebaeude werden staerker
// beschleunigt (25%/50% pro Stufe) als Schiffe/Verteidigung (1%/2% pro Stufe).
function roboterNaniteFactor(state: PlayerState, target: 'building' | 'shipDefense'): number {
  const roboterLevel = state.buildings?.roboterfabrik || 0;
  const naniteLevel = state.buildings?.nanitenfabrik || 0;
  if (target === 'building') {
    return Math.pow(0.75, roboterLevel) * Math.pow(0.5, naniteLevel);
  }
  return Math.pow(0.99, roboterLevel) * Math.pow(0.98, naniteLevel);
}

// Spiegelt server/src/game/actions.ts's bauzeitMultiplier() 1:1 - Bauzeit-Forschung reduziert bis
// maximal 70% (Faktor min. 0.3), der "bautempo"-Booster halbiert das Ergebnis zusaetzlich,
// Roboter-/Nanitenfabrik beschleunigen zusaetzlich (siehe roboterNaniteFactor).
export function getBauzeitMultiplier(gameData: GameData, state: PlayerState): number {
  return baseTimeMultiplier(gameData, state) * roboterNaniteFactor(state, 'shipDefense');
}

// Spiegelt server/src/game/actions.ts's gebaeudeBauzeitMultiplier() 1:1 - fuer die Bauzeit-Anzeige
// auf der Gebaeude-Seite.
export function getGebaeudeBauzeitMultiplier(gameData: GameData, state: PlayerState): number {
  return baseTimeMultiplier(gameData, state) * roboterNaniteFactor(state, 'building');
}

// ---- Gebaeude: Energie + Produktion (spiegelt server/src/game/actions.ts 1:1) ----

function levelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}

export function getMiningMultiplier(state: PlayerState): number {
  return 1 + (state.research.mining || 0) * 0.1;
}

export function getEnergyProduced(gameData: GameData, state: PlayerState): number {
  const solar = gameData.buildings.find((b) => b.id === 'solarkraftwerk');
  if (!solar) return 0;
  return levelScaledValue(solar.baseEnergyOutput || 0, state.buildings.solarkraftwerk || 0);
}

export function getEnergyConsumed(gameData: GameData, state: PlayerState): number {
  let total = 0;
  ['metallmine', 'kristallmine', 'deuteriummine'].forEach((id) => {
    const building = gameData.buildings.find((b) => b.id === id);
    if (!building) return;
    total += levelScaledValue(building.baseEnergyUse || 0, state.buildings[id] || 0);
  });
  return total;
}

export function getEnergyFactor(gameData: GameData, state: PlayerState): number {
  const consumed = getEnergyConsumed(gameData, state);
  if (consumed <= 0) return 1;
  return Math.min(1, getEnergyProduced(gameData, state) / consumed);
}

export function getMineOutputPerHour(gameData: GameData, state: PlayerState, buildingId: string): number {
  const building = gameData.buildings.find((b) => b.id === buildingId);
  if (!building || !building.baseOutput) return 0;
  const base = levelScaledValue(building.baseOutput, state.buildings[buildingId] || 0);
  return base * getEnergyFactor(gameData, state) * getMiningMultiplier(state);
}

// Spiegelt server/src/game/actions.ts's researchTimeMultiplier() 1:1 - nur der
// "forschungstempo"-Booster halbiert die Forschungszeit, es gibt keine Forschung, die sich selbst
// beschleunigt.
export function getForschungszeitMultiplier(state: PlayerState): number {
  return isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
}
