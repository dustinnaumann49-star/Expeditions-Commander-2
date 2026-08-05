import { serverNow } from './serverTime';
import type { GameData, PlayerState } from '../types/game';

// ===== Woechentlicher Event-Kalender (05.08.2026) - spiegelt server/src/game/data/economy.ts
// (berlinWeekday()/WEEKLY_EVENTS/isWeeklyEventActive()) 1:1, nutzt aber serverNow() statt
// Date.now() (skew-korrigierte Client-Zeit, siehe serverTime.ts) =====
const BERLIN_TZ = 'Europe/Berlin';
function berlinOffsetHours(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: BERLIN_TZ, timeZoneName: 'shortOffset' }).formatToParts(new Date(utcMs));
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+1';
  const match = tzPart.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}
export function berlinWeekday(utcMs: number = serverNow()): number {
  const offset = berlinOffsetHours(utcMs);
  return new Date(utcMs + offset * 3600 * 1000).getUTCDay();
}
export interface WeeklyEventDefinition { id: string; weekdays: number[]; label: string }
export const WEEKLY_EVENTS: WeeklyEventDefinition[] = [
  { id: 'piraten_bonus', weekdays: [1, 5], label: 'Piraten-Sektor: +100% Belohnung (Niedrig/Mittel/Hoch)' },
  { id: 'asteroid_bonus', weekdays: [2, 4], label: 'Asteroiden-Feld: +100% Ressourcen' },
  { id: 'raid_event', weekdays: [3, 0], label: 'Raid-Event' },
  { id: 'bauzeit_bonus', weekdays: [6], label: 'Bauzeit-Bonus (Schiffe/Verteidigung/Gebäude/Forschung)' },
];
export function isWeeklyEventActive(id: string, utcMs: number = serverNow()): boolean {
  const def = WEEKLY_EVENTS.find((e) => e.id === id);
  if (!def) return false;
  return def.weekdays.includes(berlinWeekday(utcMs));
}
const ASTEROID_EVENT_MULTIPLIER = 2.0;
const WEEKLY_BAUZEIT_EVENT_FACTOR = 0.75;

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

// `durationCostMultiplier` (Nutzerentscheidung 04.08.2026, siehe BOOSTER_DURATION_OPTIONS in
// server/src/game/data/economy.ts): Standard 1 = 24h-Basispreis, 6/20 fuer 7/30 Tage. Nur fuer die
// Anzeige - die tatsaechliche Preisberechnung/Pruefung passiert serverseitig in buyBooster().
export function getEffectiveBoosterCost(baseCost: number, state: PlayerState, durationCostMultiplier = 1): number {
  return Math.round(baseCost * durationCostMultiplier * (state.economyClass === 'schmuggler' ? ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER : 1));
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
  if (isWeeklyEventActive('bauzeit_bonus')) m *= WEEKLY_BAUZEIT_EVENT_FACTOR;
  return m;
}

// Spiegelt server/src/game/actions.ts's roboterNaniteFactor() 1:1 - kompoundierend (nicht
// linear) pro Stufe, damit Bauzeiten nie negativ/Null werden. Gebaeude werden staerker
// beschleunigt (25%/50% pro Stufe) als Schiffe/Verteidigung (1%/2% pro Stufe).
// `tier` (05.08.2026, V2/V3-Stufen): nur fuer target 'building' relevant, siehe Server-Pendant.
function roboterNaniteFactor(gameData: GameData, state: PlayerState, target: 'building' | 'shipDefense', tier: 1 | 2 | 3 = 1): number {
  const effectiveTier = target === 'building' ? tier : 1;
  const roboterId = effectiveTier === 1 ? 'roboterfabrik' : `v${effectiveTier}_roboterfabrik`;
  const naniteId = effectiveTier === 1 ? 'nanitenfabrik' : `v${effectiveTier}_nanitenfabrik`;
  const roboterLevel = state.buildings?.[roboterId] || 0;
  const naniteLevel = state.buildings?.[naniteId] || 0;
  let factor =
    target === 'building' ? Math.pow(0.75, roboterLevel) * Math.pow(0.5, naniteLevel) : Math.pow(0.99, roboterLevel) * Math.pow(0.98, naniteLevel);
  factor *= moduleReductionFactor(gameData, state, `${roboterId}_verstaerkte_automatisierung`);
  factor *= moduleReductionFactor(gameData, state, `${naniteId}_verstaerkte_automatisierung`);
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
  const tier = buildingId ? gameData.buildings.find((b) => b.id === buildingId)?.tier ?? 1 : 1;
  const specific = specificTimeMultiplier(state.research.bauzeit_gebaeude || 0, 0.03);
  let m = baseTimeMultiplier(gameData, state) * roboterNaniteFactor(gameData, state, 'building', tier) * specific * economyBauzeitMultiplier(state);
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
  // Woechentlicher Event-Kalender (05.08.2026): +100% Asteroiden-Feld-Ertrag Di/Do (nur
  // Asteroiden-Feld-Missionen, NICHT die Heimatbasis-Minen - siehe getMiningBuildingMultiplier()).
  const weeklyEvent = isWeeklyEventActive('asteroid_bonus') ? ASTEROID_EVENT_MULTIPLIER : 1;
  return base * specific * economy * weeklyEvent;
}

export function getMiningBuildingMultiplier(state: PlayerState): number {
  const base = 1 + (state.research.mining || 0) * 0.1;
  const specific = 1 + (state.research.mining_minen || 0) * 0.05;
  const economy = state.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_MINING_MULTIPLIER : 1;
  return base * specific * economy;
}

const MINE_KINDS = ['mine_metall', 'mine_kristall', 'mine_deuterium'] as const;

// V2/V3-Stufen (05.08.2026): Energie bleibt PRO STUFE ISOLIERT (spiegelt Server 1:1).
export function getEnergyProduced(gameData: GameData, state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  const solar = gameData.buildings.find((b) => (b.tier ?? 1) === tier && b.kind === 'energie');
  if (!solar) return 0;
  const base = levelScaledValue(solar.baseEnergyOutput || 0, state.buildings[solar.id] || 0);
  const moduleId = tier === 1 ? 'solarkraftwerk_ertragssteigerung' : `${solar.id}_ertragssteigerung`;
  return base * moduleBoostFactor(gameData, state, moduleId);
}

export function getEnergyConsumed(gameData: GameData, state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  let total = 0;
  gameData.buildings
    .filter((b) => (b.tier ?? 1) === tier && (MINE_KINDS as readonly string[]).includes(b.kind))
    .forEach((building) => {
      const base = levelScaledValue(building.baseEnergyUse || 0, state.buildings[building.id] || 0);
      const moduleId = tier === 1 ? MINE_ENERGY_MODULE[building.id] : `${building.id}_energiesparmodul`;
      total += base * moduleReductionFactor(gameData, state, moduleId);
    });
  return total;
}

export function getEnergyFactor(gameData: GameData, state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  const consumed = getEnergyConsumed(gameData, state, tier);
  if (consumed <= 0) return 1;
  return Math.min(1, getEnergyProduced(gameData, state, tier) / consumed);
}

export function getMineOutputPerHour(gameData: GameData, state: PlayerState, buildingId: string): number {
  const building = gameData.buildings.find((b) => b.id === buildingId);
  if (!building || !building.baseOutput) return 0;
  const tier = building.tier ?? 1;
  const base = levelScaledValue(building.baseOutput, state.buildings[buildingId] || 0);
  const moduleId = tier === 1 ? MINE_OUTPUT_MODULE[buildingId] : `${buildingId}_foerdereffizienz`;
  const moduleFactor = moduleId ? moduleBoostFactor(gameData, state, moduleId) : 1;
  return base * getEnergyFactor(gameData, state, tier) * getMiningBuildingMultiplier(state) * moduleFactor;
}



// Spiegelt server/src/game/actions.ts's researchTimeMultiplier() 1:1 - nur der
// "forschungstempo"-Booster halbiert die Forschungszeit, es gibt keine Forschung, die sich selbst
// beschleunigt.
export function getForschungszeitMultiplier(state: PlayerState): number {
  const booster = isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
  const weeklyEvent = isWeeklyEventActive('bauzeit_bonus') ? WEEKLY_BAUZEIT_EVENT_FACTOR : 1;
  return booster * weeklyEvent;
}
