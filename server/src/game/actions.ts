import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, MAX_PLAYER_SHIPS } from './data/combatConstants.js';
import { findShip, findDefense } from './combat.js';
import { processMissions } from './missions.js';
import { processEventTimer } from './events.js';
import { processRaidTimer } from './raids.js';
import type { PlayerState, ResourceCost } from './types.js';

// ========== FORSCHUNGS-MULTIPLIKATOREN (Bauzeit/Forschungszeit) ==========

export function bauzeitMultiplier(state: PlayerState): number {
  let m = Math.max(0.3, 1 - (state.research.bauzeit || 0) * RESEARCH[3].effectPerLevel);
  if (isBoosterActive(state, 'bautempo')) m *= 0.5;
  return m;
}

export function researchTimeMultiplier(state: PlayerState): number {
  return isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
}

export function isBoosterActive(state: PlayerState, id: string): boolean {
  const expiry = state.activeBoosters[id];
  return !!expiry && expiry > Date.now();
}

// ========== RESSOURCEN ==========

export function canAfford(state: PlayerState, cost: ResourceCost, qty: number): boolean {
  return (
    state.resources.metall >= cost.metall * qty &&
    state.resources.kristall >= cost.kristall * qty &&
    state.resources.deuterium >= cost.deuterium * qty
  );
}

export function totalOwnedShips(state: PlayerState): number {
  let total = 0;
  Object.values(state.fleet).forEach((c) => (total += c || 0));
  state.buildQueue.forEach((job) => (total += job.count || 0));
  return total;
}

export function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  return total;
}

function countDefenseEverywhere(state: PlayerState, defId: string): number {
  let total = state.defense[defId] || 0;
  state.defenseQueue.forEach((job) => {
    if (job.defId === defId) total += job.count || 0;
  });
  return total;
}

// ========== PRODUKTION + WARTESCHLANGEN "NACHHOLEN" ==========
// Wird bei jedem Laden des Spielzustands aufgerufen und rechnet alles seit `lastUpdate` hoch -
// ersetzt den setInterval-Loop aus dem HTML-Prototyp durch ein zustandsloses "catch up"-Prinzip,
// das serverseitig ohne Dauer-Prozess auskommt.
export async function tick(state: PlayerState): Promise<PlayerState> {
  const now = Date.now();

  // Bau-Warteschlange abarbeiten
  const stillBuilding = state.buildQueue.filter((job) => {
    if (job.endTime <= now && job.shipId) {
      state.fleet[job.shipId] = (state.fleet[job.shipId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.buildQueue = stillBuilding;

  // Verteidigungs-Warteschlange abarbeiten
  const stillBuildingDef = state.defenseQueue.filter((job) => {
    if (job.endTime <= now && job.defId) {
      state.defense[job.defId] = (state.defense[job.defId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.defenseQueue = stillBuildingDef;

  // Forschungs-Warteschlange abarbeiten
  const stillResearching = state.researchQueue.filter((job) => {
    if (job.endTime <= now) {
      state.research[job.techId] = job.targetLevel;
      return false;
    }
    return true;
  });
  state.researchQueue = stillResearching;

  // Abgelaufene Booster entfernen
  Object.keys(state.activeBoosters).forEach((id) => {
    if (state.activeBoosters[id] <= now) delete state.activeBoosters[id];
  });

  // Missionen (Farmen/Kampf), Notruf-Events und Basis-Raids nachholen
  await processMissions(state);
  await processEventTimer(state);
  await processRaidTimer(state);

  state.lastUpdate = now;
  return state;
}

// ========== SCHIFFE BAUEN ==========

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export function startBuild(state: PlayerState, shipId: string, qty: number): ActionResult {
  const ship = findShip(shipId);
  if (!ship || ship.specialOnly) return { ok: false, error: 'Unbekanntes oder nicht direkt baubares Schiff.' };

  if (ship.unique && countShipEverywhere(state, shipId) >= 1) {
    return { ok: false, error: `${ship.name} ist einzigartig - es kann nur ein Exemplar existieren.` };
  }
  const effectiveQty = ship.unique ? 1 : qty;
  if (effectiveQty <= 0) return { ok: false, error: 'Ungueltige Menge.' };

  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    return { ok: false, error: `Alle ${MAX_BUILD_SLOTS} Bau-Slots sind belegt.` };
  }
  if (ship.maxCount) {
    const frei = ship.maxCount - countShipEverywhere(state, shipId);
    if (frei <= 0) return { ok: false, error: `${ship.name} ist limitiert - maximal ${ship.maxCount} Stueck moeglich.` };
    if (effectiveQty > frei) return { ok: false, error: `Nur noch ${frei} ${ship.name} bis zum Limit moeglich.` };
  }
  if (!ship.cost || !canAfford(state, ship.cost, effectiveQty)) {
    return { ok: false, error: 'Nicht genug Ressourcen.' };
  }
  const frei = MAX_PLAYER_SHIPS - totalOwnedShips(state);
  if (effectiveQty > frei) return { ok: false, error: `Nur noch ${frei} Schiff(e) bis zum Flottenlimit moeglich.` };

  state.resources.metall -= ship.cost.metall * effectiveQty;
  state.resources.kristall -= ship.cost.kristall * effectiveQty;
  state.resources.deuterium -= ship.cost.deuterium * effectiveQty;

  const now = Date.now();
  let startTime = now;
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    const laneJob = state.buildQueue[state.buildQueue.length - MAX_BUILD_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  const duration = ship.buildTime * bauzeitMultiplier(state) * effectiveQty * 1000;
  state.buildQueue.push({ shipId, count: effectiveQty, startTime, endTime: startTime + duration });
  return { ok: true };
}

export function startDefenseBuild(state: PlayerState, defId: string, qty: number): ActionResult {
  const def = findDefense(defId);
  if (!def) return { ok: false, error: 'Unbekannte Verteidigungsanlage.' };
  if (qty <= 0) return { ok: false, error: 'Ungueltige Menge.' };

  if (def.maxCount) {
    const frei = def.maxCount - countDefenseEverywhere(state, defId);
    if (frei <= 0) return { ok: false, error: `${def.name} ist limitiert - maximal ${def.maxCount} Stueck moeglich.` };
    if (qty > frei) return { ok: false, error: `Nur noch ${frei} ${def.name} bis zum Limit moeglich.` };
  }
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) {
    return { ok: false, error: `Alle ${MAX_DEFENSE_SLOTS} Bau-Slots sind belegt.` };
  }
  if (!canAfford(state, def.cost, qty)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= def.cost.metall * qty;
  state.resources.kristall -= def.cost.kristall * qty;
  state.resources.deuterium -= def.cost.deuterium * qty;

  const now = Date.now();
  let startTime = now;
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) {
    const laneJob = state.defenseQueue[state.defenseQueue.length - MAX_DEFENSE_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  const duration = def.buildTime * bauzeitMultiplier(state) * qty * 1000;
  state.defenseQueue.push({ defId, count: qty, startTime, endTime: startTime + duration });
  return { ok: true };
}

// ========== FORSCHUNG ==========

function researchCostForLevel(tech: (typeof RESEARCH)[number], level: number): ResourceCost {
  const f = Math.pow(tech.costGrowth, level - 1);
  return {
    metall: Math.round(tech.baseCost.metall * f),
    kristall: Math.round(tech.baseCost.kristall * f),
    deuterium: Math.round(tech.baseCost.deuterium * f),
  };
}

function researchTimeForLevel(state: PlayerState, tech: (typeof RESEARCH)[number], level: number): number {
  return tech.baseTimeHours * Math.pow(tech.timeGrowth, level - 1) * 3600 * 1000 * researchTimeMultiplier(state);
}

export function startResearch(state: PlayerState, techId: string): ActionResult {
  const tech = RESEARCH.find((r) => r.id === techId);
  if (!tech) return { ok: false, error: 'Unbekannte Forschung.' };
  if (state.researchQueue.length >= MAX_RESEARCH_SLOTS) {
    return { ok: false, error: `Es laufen bereits ${MAX_RESEARCH_SLOTS} Forschungen gleichzeitig (Maximum).` };
  }
  if (state.researchQueue.some((j) => j.techId === techId)) {
    return { ok: false, error: 'Diese Forschung laeuft bereits.' };
  }
  const currentLevel = state.research[techId] || 0;
  const nextLevel = currentLevel + 1;
  const cost = researchCostForLevel(tech, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  const duration = researchTimeForLevel(state, tech, nextLevel);
  state.researchQueue.push({ techId, targetLevel: nextLevel, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== IMPERATOR (SPEZIALTEILE) ==========

export function buildImperator(state: PlayerState): ActionResult {
  const ship = findShip('imperator');
  if (!ship || !ship.teileCost || !ship.maxCount) return { ok: false, error: 'Imperator-Daten fehlerhaft.' };
  const cost = ship.teileCost;
  if (state.teile.waffen < cost.waffen || state.teile.schild < cost.schild || state.teile.panzerung < cost.panzerung) {
    return { ok: false, error: 'Nicht genug Teile.' };
  }
  if (state.buildQueue.some((j) => j.shipId === 'imperator')) {
    return { ok: false, error: 'Es wird bereits ein Imperator gebaut.' };
  }
  if (countShipEverywhere(state, 'imperator') >= ship.maxCount) {
    return { ok: false, error: `Der Imperator ist limitiert - maximal ${ship.maxCount} Exemplare möglich.` };
  }
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    return { ok: false, error: `Alle ${MAX_BUILD_SLOTS} Bau-Slots sind belegt.` };
  }
  if (totalOwnedShips(state) >= MAX_PLAYER_SHIPS) {
    return { ok: false, error: `Flottenlimit erreicht (${MAX_PLAYER_SHIPS} Schiffe).` };
  }
  state.teile.waffen -= cost.waffen;
  state.teile.schild -= cost.schild;
  state.teile.panzerung -= cost.panzerung;

  const now = Date.now();
  let startTime = now;
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    const laneJob = state.buildQueue[state.buildQueue.length - MAX_BUILD_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  state.buildQueue.push({ shipId: 'imperator', count: 1, startTime, endTime: startTime + ship.buildTime * 1000 });
  return { ok: true };
}
