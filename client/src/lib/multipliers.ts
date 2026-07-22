import { serverNow } from './serverTime';
import type { GameData, PlayerState } from '../types/game';

// Spiegelt server/src/game/data/classes.ts 1:1 - Werte muessen bei Aenderung dort synchron
// gehalten werden, sonst zeigt die UI falsche Kosten an (README Punkt 1 gilt analog auch fuer
// Klassen-Multiplikatoren, nicht nur Zeit-Anzeigen). Getrennt nach Schiffen und Verteidigung:
// Kanonier rabattiert nur Schiffe, Bollwerk nur Verteidigung, Kommandant beides.
const CLASS_KANONIER_SHIP_COST_MULTIPLIER = 0.9;
const CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER = 0.75;
const CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER = 0.9;

export function getShipCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'kanonier') return CLASS_KANONIER_SHIP_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
}

export function getDefenseCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'bollwerk') return CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
}

// Spiegelt server/src/game/data/economyClasses.ts 1:1 - Wirtschafts-Klassen (Nutzerentscheidung
// Juli 2026), zweite unabhaengige Klassenwahl neben der Kampf-Klasse oben.
const ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER = 0.85;
const ECONOMY_PROSPEKTOR_MINING_MULTIPLIER = 1.2;
const ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER = 0.5;
const ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER = 1.5;
const ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER = 0.85;

function economyBauzeitMultiplier(state: PlayerState): number {
  return state.economyClass === 'ingenieur' ? ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER : 1;
}

export function getEffectiveTradeFee(gameData: GameData, state: PlayerState): number {
  return state.economyClass === 'schmuggler' ? gameData.tradeFee * ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER : gameData.tradeFee;
}

export function getEffectiveScrapRefundRate(gameData: GameData, state: PlayerState): number {
  return state.economyClass === 'schmuggler' ? gameData.scrapRefundRate * ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER : gameData.scrapRefundRate;
}

export function getEffectiveBoosterCost(baseCost: number, state: PlayerState): number {
  return Math.round(baseCost * (state.economyClass === 'schmuggler' ? ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER : 1));
}

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
function roboterNaniteFactor(gameData: GameData, state: PlayerState, target: 'building' | 'shipDefense'): number {
  const roboterLevel = state.buildings?.roboterfabrik || 0;
  const naniteLevel = state.buildings?.nanitenfabrik || 0;
  let factor =
    target === 'building' ? Math.pow(0.75, roboterLevel) * Math.pow(0.5, naniteLevel) : Math.pow(0.99, roboterLevel) * Math.pow(0.98, naniteLevel);
  factor *= moduleReductionFactor(gameData, state, 'roboterfabrik_verstaerkte_automatisierung');
  factor *= moduleReductionFactor(gameData, state, 'nanitenfabrik_verstaerkte_automatisierung');
  return factor;
}

// Spiegelt server/src/game/actions.ts's specificTimeMultiplier() 1:1 - die Forschungsbaum-Zweige
// "Bauzeit: X" stapeln zusaetzlich zur Basis-Forschung, jeweils nur fuer EINE Kategorie.
function specificTimeMultiplier(level: number, effectPerLevel: number): number {
  return Math.max(0.5, 1 - level * effectPerLevel);
}

// Spiegelt server/src/game/actions.ts's bauzeitMultiplier() 1:1 - jetzt SCHIFF-spezifisch
// (Bauzeit-Forschung reduziert bis maximal 70%, der "bautempo"-Booster halbiert das Ergebnis
// zusaetzlich, Roboter-/Nanitenfabrik beschleunigen zusaetzlich, "Bauzeit: Schiffe" stapelt
// obendrauf).
export function getBauzeitMultiplier(gameData: GameData, state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_schiffe || 0, 0.03);
  return baseTimeMultiplier(gameData, state) * roboterNaniteFactor(gameData, state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// NEU: spiegelt server/src/game/actions.ts's defenseBauzeitMultiplier() 1:1 - fuer die
// Bauzeit-Anzeige auf der Verteidigungs-Seite (vorher gemeinsam mit Schiffen ueber
// getBauzeitMultiplier() berechnet).
export function getDefenseBauzeitMultiplier(gameData: GameData, state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_verteidigung || 0, 0.03);
  return baseTimeMultiplier(gameData, state) * roboterNaniteFactor(gameData, state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// Spiegelt server/src/game/actions.ts's gebaeudeBauzeitMultiplier() 1:1 - fuer die Bauzeit-Anzeige
// auf der Gebaeude-Seite ("Bauzeit: Gebaeude" stapelt zusaetzlich zur Basis).
export function getGebaeudeBauzeitMultiplier(gameData: GameData, state: PlayerState, buildingId?: string): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_gebaeude || 0, 0.03);
  let m = baseTimeMultiplier(gameData, state) * roboterNaniteFactor(gameData, state, 'building') * specific * economyBauzeitMultiplier(state);
  const selfModuleId = buildingId ? BUILDING_SELF_BUILDTIME_MODULE[buildingId] : undefined;
  if (selfModuleId) m *= moduleReductionFactor(gameData, state, selfModuleId);
  return m;
}

// ---- Gebaeude: Energie + Produktion (spiegelt server/src/game/actions.ts 1:1) ----

// ========== GEBAEUDE-MODULSYSTEM (spiegelt server/src/game/actions.ts 1:1) ==========

function moduleLevel(state: PlayerState, moduleId: string): number {
  return state.buildingModules?.[moduleId] || 0;
}

function moduleBoostFactor(gameData: GameData, state: PlayerState, moduleId: string): number {
  const mod = gameData.buildingModules.find((m) => m.id === moduleId);
  if (!mod) return 1;
  return 1 + moduleLevel(state, moduleId) * mod.effectPerLevel;
}

function moduleReductionFactor(gameData: GameData, state: PlayerState, moduleId: string): number {
  const mod = gameData.buildingModules.find((m) => m.id === moduleId);
  if (!mod) return 1;
  return Math.max(0.5, 1 - moduleLevel(state, moduleId) * mod.effectPerLevel);
}

const BUILDING_SELF_BUILDTIME_MODULE: Record<string, string> = {
  metallmine: 'metallmine_automatisierung',
  kristallmine: 'kristallmine_automatisierung',
  deuteriummine: 'deuteriummine_automatisierung',
  solarkraftwerk: 'solarkraftwerk_wartungsoptimierung',
  roboterfabrik: 'roboterfabrik_wartungsfreiheit',
  nanitenfabrik: 'nanitenfabrik_wartungsfreiheit',
};
const MINE_OUTPUT_MODULE: Record<string, string> = {
  metallmine: 'metallmine_foerdereffizienz',
  kristallmine: 'kristallmine_foerdereffizienz',
  deuteriummine: 'deuteriummine_foerdereffizienz',
};
const MINE_ENERGY_MODULE: Record<string, string> = {
  metallmine: 'metallmine_energiesparmodul',
  kristallmine: 'kristallmine_energiesparmodul',
  deuteriummine: 'deuteriummine_energiesparmodul',
};

function levelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}

export function getMiningMultiplier(state: PlayerState): number {
  // Basis (research.mining) wirkt auf BEIDES, "Mining-Boost: Schiffe" stapelt NUR fuer
  // Mining-Schiffe obendrauf (Pendant fuer Gebaeude: getMiningBuildingMultiplier()).
  const base = 1 + (state.research.mining || 0) * 0.1;
  const specific = 1 + (state.research.mining_schiffe || 0) * 0.05;
  const economy = state.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_MINING_MULTIPLIER : 1;
  return base * specific * economy;
}

export function getMiningBuildingMultiplier(state: PlayerState): number {
  const base = 1 + (state.research.mining || 0) * 0.1;
  const specific = 1 + (state.research.mining_minen || 0) * 0.05;
  const economy = state.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_MINING_MULTIPLIER : 1;
  return base * specific * economy;
}

export function getEnergyProduced(gameData: GameData, state: PlayerState): number {
  const solar = gameData.buildings.find((b) => b.id === 'solarkraftwerk');
  if (!solar) return 0;
  const base = levelScaledValue(solar.baseEnergyOutput || 0, state.buildings.solarkraftwerk || 0);
  return base * moduleBoostFactor(gameData, state, 'solarkraftwerk_ertragssteigerung');
}

export function getEnergyConsumed(gameData: GameData, state: PlayerState): number {
  let total = 0;
  ['metallmine', 'kristallmine', 'deuteriummine'].forEach((id) => {
    const building = gameData.buildings.find((b) => b.id === id);
    if (!building) return;
    const base = levelScaledValue(building.baseEnergyUse || 0, state.buildings[id] || 0);
    total += base * moduleReductionFactor(gameData, state, MINE_ENERGY_MODULE[id]);
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
  const moduleId = MINE_OUTPUT_MODULE[buildingId];
  const moduleFactor = moduleId ? moduleBoostFactor(gameData, state, moduleId) : 1;
  return base * getEnergyFactor(gameData, state) * getMiningBuildingMultiplier(state) * moduleFactor;
}



// Spiegelt server/src/game/actions.ts's researchTimeMultiplier() 1:1 - nur der
// "forschungstempo"-Booster halbiert die Forschungszeit, es gibt keine Forschung, die sich selbst
// beschleunigt.
export function getForschungszeitMultiplier(state: PlayerState): number {
  return isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
}
