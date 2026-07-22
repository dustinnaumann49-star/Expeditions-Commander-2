import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { BUILDINGS, findBuilding } from './data/buildings.js';
import { BUILDING_MODULES, findBuildingModule } from './data/buildingModules.js';
import { SHIP_MODULES, findShipModule } from './data/shipModules.js';
import { DEFENSE_MODULES, findDefenseModule } from './data/defenseModules.js';
import { MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, MAX_BUILDING_SLOTS, MAX_SHIP_MODULE_SLOTS, MAX_DEFENSE_MODULE_SLOTS, MAX_PLAYER_SHIPS, PARENT_UNLOCK_LEVEL } from './data/combatConstants.js';
import { findShip, findDefense } from './combat.js';
import { processMissions } from './missions.js';
import { processGalaxyDeployments } from './galaxy.js';
import { processPirateAttacks } from './pirateBaseState.js';
import { processSpyMissions, maybeGeneratePirateSpyReport } from './spyMissions.js';
import { processEventTrips } from './galaxyEvents.js';
import { processRaidTimer, processOverdueRaidsForOtherUsers, processOverdueRaidSpawnsForOtherUsers } from './raids.js';
import { processAllDepartedGroupOperations, listMyGroupOperations } from './groupOps.js';
import { CLASS_KANONIER_SHIP_COST_MULTIPLIER, CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER, CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER } from './data/classes.js';
import { ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER, ECONOMY_PROSPEKTOR_MINING_MULTIPLIER } from './data/economyClasses.js';
import { isBoosterActive } from './boosterUtil.js';
import type { PlayerState, ResourceCost, BuildingDefinition } from './types.js';

// ========== FORSCHUNGS-MULTIPLIKATOREN (Bauzeit/Forschungszeit) ==========

// Basis-Multiplikator aus Bauzeit-Forschung + "bautempo"-Booster - gilt fuer ALLE Bauarten
// (Schiffe, Verteidigung, Gebaeude) gleichermassen, siehe README Punkt 1.
function baseTimeMultiplier(state: PlayerState): number {
  let m = Math.max(0.3, 1 - (state.research.bauzeit || 0) * RESEARCH[3].effectPerLevel);
  if (isBoosterActive(state, 'bautempo')) m *= 0.5;
  return m;
}

// Roboterfabrik/Nanitenfabrik wirken multiplikativ (kompoundierend) pro Stufe, nicht linear -
// linear wuerde bei wenigen Stufen zu negativen/Null-Bauzeiten fuehren. Beide Effekte stapeln
// sich. Gebaeude werden deutlich staerker beschleunigt (25%/50% pro Stufe) als Schiffe/
// Verteidigung (1%/2% pro Stufe), da fuer Gebaeude ohnehin nur ein einziger globaler Bauslot
// existiert.
function roboterNaniteFactor(state: PlayerState, target: 'building' | 'shipDefense'): number {
  const roboterLevel = state.buildings?.roboterfabrik || 0;
  const naniteLevel = state.buildings?.nanitenfabrik || 0;
  let factor =
    target === 'building' ? Math.pow(0.75, roboterLevel) * Math.pow(0.5, naniteLevel) : Math.pow(0.99, roboterLevel) * Math.pow(0.98, naniteLevel);
  // Module "Verstaerkte Automatisierung" (Roboterfabrik/Nanitenfabrik) verstaerken den
  // bestehenden Stufen-Effekt zusaetzlich, OHNE dass die Fabrik selbst weiter ausgebaut werden
  // muss - stapelt multiplikativ mit dem obigen Basiswert.
  factor *= moduleReductionFactor(state, 'roboterfabrik_verstaerkte_automatisierung');
  factor *= moduleReductionFactor(state, 'nanitenfabrik_verstaerkte_automatisierung');
  return factor;
}

// Forschungsbaum-Zweige "Bauzeit: X" (siehe research.ts) stapeln ZUSAETZLICH zur Basis-Forschung
// oben (die weiterhin ALLE drei Kategorien gleichzeitig verkuerzt) - jeweils nur fuer EINE
// Kategorie. Gleiche Floor-Logik wie baseTimeMultiplier (min. 50%, nie negativ/Null).
function specificTimeMultiplier(level: number, effectPerLevel: number): number {
  return Math.max(0.5, 1 - level * effectPerLevel);
}

// ========== GEBAEUDE-MODULSYSTEM (siehe types.ts BuildingModuleDefinition/README) ==========
// Stapelt sich MULTIPLIKATIV mit der allgemeinen Forschung (Mining-Boost/Bauzeit-Zweige) - keine
// Ersetzung, mehr Optimierungstiefe wie in der Ruecksprache besprochen.

function moduleLevel(state: PlayerState, moduleId: string): number {
  return state.buildingModules?.[moduleId] || 0;
}

// Fuer "output"/"strengthen_factor"-Module: hebt den Basiswert an (1 + Stufe*Effekt).
function moduleBoostFactor(state: PlayerState, moduleId: string): number {
  const mod = findBuildingModule(moduleId);
  if (!mod) return 1;
  return 1 + moduleLevel(state, moduleId) * mod.effectPerLevel;
}

// Fuer "energy_reduction"/"buildtime_self"-Module: senkt den Basiswert (nie unter 50%, analog zu
// specificTimeMultiplier oben - verhindert negative/Null-Werte bei voll ausgebautem Modul).
function moduleReductionFactor(state: PlayerState, moduleId: string): number {
  const mod = findBuildingModule(moduleId);
  if (!mod) return 1;
  return Math.max(0.5, 1 - moduleLevel(state, moduleId) * mod.effectPerLevel);
}

// Zuordnung Gebaeude -> eigenes "buildtime_self"-Modul (verkuerzt NUR die Bauzeit fuer weitere
// Ausbaustufen GENAU DIESES Gebaeudes).
const BUILDING_SELF_BUILDTIME_MODULE: Record<string, string> = {
  metallmine: 'metallmine_automatisierung',
  kristallmine: 'kristallmine_automatisierung',
  deuteriummine: 'deuteriummine_automatisierung',
  solarkraftwerk: 'solarkraftwerk_wartungsoptimierung',
  roboterfabrik: 'roboterfabrik_wartungsfreiheit',
  nanitenfabrik: 'nanitenfabrik_wartungsfreiheit',
};

// Zuordnung Mine -> eigenes "output"-Modul (Foerdereffizienz) bzw. "energy_reduction"-Modul
// (Energiesparmodul).
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

// Wirtschafts-Klasse "Ingenieur" (Nutzerentscheidung Juli 2026, siehe economyClasses.ts) -
// beschleunigt ALLE drei Bauarten gleichermassen (Schiffe/Verteidigung/Gebaeude), NUR die Zeit,
// nicht die Kosten (die rabattieren schon die Kampf-Klassen ueber shipCostMultiplier() unten).
function economyBauzeitMultiplier(state: PlayerState): number {
  return state.economyClass === 'ingenieur' ? ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER : 1;
}

export function bauzeitMultiplier(state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_schiffe || 0, 0.03);
  return baseTimeMultiplier(state) * roboterNaniteFactor(state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// NEU: eigener Multiplikator fuer Verteidigungsanlagen (vorher gemeinsam mit Schiffen ueber
// bauzeitMultiplier() - jetzt getrennt, da der neue Zweig "Bauzeit: Verteidigung" NUR
// Verteidigungsanlagen betreffen soll, nicht Schiffe).
export function defenseBauzeitMultiplier(state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_verteidigung || 0, 0.03);
  return baseTimeMultiplier(state) * roboterNaniteFactor(state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// Eigener Multiplikator fuer Gebaeude-Bauzeiten (Punkt 1 der README gilt auch hier: jede neue
// Zeit-Anzeige im Frontend fuer Gebaeude MUSS die client-seitige Entsprechung verwenden).
// `buildingId` optional: wird er angegeben, fliesst zusaetzlich das GEBAEUDE-EIGENE
// "buildtime_self"-Modul ein (siehe BUILDING_SELF_BUILDTIME_MODULE) - wirkt NUR auf die
// Bauzeit fuer weitere Ausbaustufen GENAU DIESES Gebaeudes, nicht auf andere.
export function gebaeudeBauzeitMultiplier(state: PlayerState, buildingId?: string): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_gebaeude || 0, 0.03);
  let m = baseTimeMultiplier(state) * roboterNaniteFactor(state, 'building') * specific * economyBauzeitMultiplier(state);
  const selfModuleId = buildingId ? BUILDING_SELF_BUILDTIME_MODULE[buildingId] : undefined;
  if (selfModuleId) m *= moduleReductionFactor(state, selfModuleId);
  return m;
}

export function researchTimeMultiplier(state: PlayerState): number {
  return isBoosterActive(state, 'forschungstempo') ? 0.5 : 1;
}

// ========== KLASSEN-KOSTENMULTIPLIKATOREN (Kanonier/Bollwerk/Kommandant) ==========
// Jede Kosten-ANZEIGE im Frontend MUSS ebenfalls diese Werte spiegeln (siehe
// client/src/lib/multipliers.ts), analog zu README Punkt 1 fuer Zeit-Anzeigen - sonst zeigt die
// UI falsche Kosten an, sobald eine Klasse gewaehlt ist. Bewusst GETRENNT nach Schiffen und
// Verteidigung (nicht wie zuvor ein gemeinsamer Faktor): Kanonier rabattiert nur Schiffe,
// Bollwerk nur Verteidigung, Kommandant beides.
export function shipCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'kanonier') return CLASS_KANONIER_SHIP_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
}

export function defenseCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'bollwerk') return CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
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

// Bugfix: zaehlte bisher NUR state.fleet (zuhause) + buildQueue (im Bau) - Schiffe, die gerade
// auf einer Sektor-Mission unterwegs sind, bei einem anderen Spieler "halten" oder Teil einer
// laufenden Elite-Bollwerk-/Piratenadmiral-Expedition sind, wurden NICHT mitgezaehlt. Dadurch
// liess sich das Bau-Limit (maxCount, z.B. Salvenschiffe) und sogar "unique" (Sandronator)
// umgehen: einfach die vorhandenen Einheiten wegschicken, dann zeigte der Bestand weniger als das
// Limit und der Bauen-Button liess sich wieder klicken, obwohl inklusive der unterwegs
// befindlichen Schiffe das Limit laengst erreicht war.
export function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  state.missions.forEach((m) => {
    if (!m.finalized) total += m.ships[shipId] || 0;
  });
  state.galaxyDeployments.forEach((d) => {
    total += d.ships[shipId] || 0;
  });
  listMyGroupOperations(state.userId).forEach((op) => {
    op.participants.forEach((p) => {
      if (p.userId === state.userId && p.status === 'accepted') total += p.ships[shipId] || 0;
    });
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

// ========== GEBAEUDE: ENERGIE + PRODUKTION ==========
// Ogame-artiges Energie-System: die drei Minen verbrauchen Energie, das Solarkraftwerk liefert
// sie. Reicht die Energie nicht, wird die Produktion ALLER Minen anteilig gedrosselt (nie mehr
// als 100%, kein Energie-Ueberschuss-Bonus).

const MINE_BUILDING_IDS = ['metallmine', 'kristallmine', 'deuteriummine'] as const;

function levelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}

export function energyProduced(state: PlayerState): number {
  const solar = findBuilding('solarkraftwerk');
  if (!solar) return 0;
  const base = levelScaledValue(solar.baseEnergyOutput || 0, state.buildings.solarkraftwerk || 0);
  return base * moduleBoostFactor(state, 'solarkraftwerk_ertragssteigerung');
}

export function energyConsumed(state: PlayerState): number {
  let total = 0;
  MINE_BUILDING_IDS.forEach((id) => {
    const building = findBuilding(id);
    if (!building) return;
    const base = levelScaledValue(building.baseEnergyUse || 0, state.buildings[id] || 0);
    total += base * moduleReductionFactor(state, MINE_ENERGY_MODULE[id]);
  });
  return total;
}

export function energyFactor(state: PlayerState): number {
  const consumed = energyConsumed(state);
  if (consumed <= 0) return 1;
  return Math.min(1, energyProduced(state) / consumed);
}

// Basis-Mining-Forschung (research.mining) wirkt weiterhin auf BEIDES (Schiffe UND Minen-
// Gebaeude, siehe Punkt 58) - der neue Forschungsbaum-Zweig "Mining-Boost: Minen" stapelt
// ZUSAETZLICH NUR fuer die Gebaeude-Produktion obendrauf (Pendant fuer Schiffe: siehe
// miningMultiplier() in missions.ts mit "Mining-Boost: Schiffe").
function miningBuildingMultiplier(state: PlayerState): number {
  const base = 1 + (state.research.mining || 0) * 0.1;
  const specific = 1 + (state.research.mining_minen || 0) * 0.05;
  const economy = state.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_MINING_MULTIPLIER : 1;
  return base * specific * economy;
}

// Ertrag einer Mine in Ressourcen/Stunde, inkl. Energiefaktor, Mining-Forschung und dem
// gebaeudeeigenen "Foerdereffizienz"-Modul.
export function mineOutputPerHour(state: PlayerState, buildingId: string): number {
  const building = findBuilding(buildingId);
  if (!building || !building.baseOutput) return 0;
  const base = levelScaledValue(building.baseOutput, state.buildings[buildingId] || 0);
  const moduleId = MINE_OUTPUT_MODULE[buildingId];
  const moduleFactor = moduleId ? moduleBoostFactor(state, moduleId) : 1;
  return base * energyFactor(state) * miningBuildingMultiplier(state) * moduleFactor;
}

// Rechnet die seit dem letzten tick() vergangene Zeit als passive Minen-Produktion hoch.
export function accrueBuildingProduction(state: PlayerState, deltaSec: number): void {
  if (deltaSec <= 0) return;
  state.resources.metall += (mineOutputPerHour(state, 'metallmine') / 3600) * deltaSec;
  state.resources.kristall += (mineOutputPerHour(state, 'kristallmine') / 3600) * deltaSec;
  state.resources.deuterium += (mineOutputPerHour(state, 'deuteriummine') / 3600) * deltaSec;
}

function buildingCostForLevel(building: BuildingDefinition, level: number): ResourceCost {
  const f = Math.pow(building.costGrowth, level - 1);
  return {
    metall: Math.round(building.baseCost.metall * f),
    kristall: Math.round(building.baseCost.kristall * f),
    deuterium: Math.round(building.baseCost.deuterium * f),
  };
}

function buildingTimeForLevel(state: PlayerState, building: BuildingDefinition, level: number): number {
  return building.baseTimeSeconds * Math.pow(building.timeGrowth, level - 1) * 1000 * gebaeudeBauzeitMultiplier(state, building.id);
}

// ========== PRODUKTION + WARTESCHLANGEN "NACHHOLEN" ==========
// Wird bei jedem Laden des Spielzustands aufgerufen und rechnet alles seit `lastUpdate` hoch -
// ersetzt den setInterval-Loop aus dem HTML-Prototyp durch ein zustandsloses "catch up"-Prinzip,
// das serverseitig ohne Dauer-Prozess auskommt.
export async function tick(state: PlayerState): Promise<PlayerState> {
  const now = Date.now();
  const deltaSec = Math.max(0, (now - state.lastUpdate) / 1000);

  // Passive Minen-Produktion seit dem letzten Tick hochrechnen (vor der Bau-Warteschlange, damit
  // eine in derselben Sekunde fertigwerdende Mine erst ab jetzt mit ihrer neuen Stufe zaehlt -
  // unkritisch bei Sekunden-Aufloesung, aber so bleibt die Reihenfolge eindeutig).
  accrueBuildingProduction(state, deltaSec);

  // Zurueckgerufene Galaxie-Flotten heimkehren lassen, sobald ihre Rueckflugzeit erreicht ist.
  processGalaxyDeployments(state);
  // Bergungs-Fluege zu Galaxie-Ereignissen (Wrack/Handelskonvoi) verarbeiten - Ankunft/Beute
  // sichern UND Rueckkehr, siehe galaxyEvents.ts.
  processEventTrips(state);

  // Gebaeude-Warteschlange abarbeiten (immer max. 1 Eintrag, siehe MAX_BUILDING_SLOTS) - Module
  // teilen sich denselben Slot/dieselbe Warteschlange (siehe startModuleUpgrade).
  const stillBuildingBuildings = state.buildingQueue.filter((job) => {
    if (job.endTime <= now && job.buildingId) {
      state.buildings[job.buildingId] = (state.buildings[job.buildingId] || 0) + job.count;
      return false;
    }
    if (job.endTime <= now && job.moduleId) {
      state.buildingModules[job.moduleId] = (state.buildingModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.buildingQueue = stillBuildingBuildings;

  // Schiffsmodul-Warteschlange abarbeiten (bis zu MAX_SHIP_MODULE_SLOTS parallele Eintraege) -
  // eigene Slots, unabhaengig von der normalen Schiffs-Bauschlange (buildQueue).
  const stillBuildingShipModules = state.shipModuleQueue.filter((job) => {
    if (job.endTime <= now && job.moduleId) {
      state.shipModules[job.moduleId] = (state.shipModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.shipModuleQueue = stillBuildingShipModules;

  // Verteidigungsmodul-Warteschlange abarbeiten (eigener Slot, siehe MAX_DEFENSE_MODULE_SLOTS) -
  // Stufe landet in DERSELBEN state.shipModules-Map wie Schiffs-Module (siehe Kommentar dort).
  const stillBuildingDefenseModules = state.defenseModuleQueue.filter((job) => {
    if (job.endTime <= now && job.moduleId) {
      state.shipModules[job.moduleId] = (state.shipModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.defenseModuleQueue = stillBuildingDefenseModules;

  // Bau-Warteschlange abarbeiten
  const stillBuilding = state.buildQueue.filter((job) => {
    if (job.endTime <= now && job.shipId) {
      state.fleet[job.shipId] = (state.fleet[job.shipId] || 0) + job.count;
      state.stats.shipsBuilt += job.count;
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
      state.stats.researchCompleted++;
      return false;
    }
    return true;
  });
  state.researchQueue = stillResearching;

  // Abgelaufene Booster entfernen
  Object.keys(state.activeBoosters).forEach((id) => {
    if (state.activeBoosters[id] <= now) delete state.activeBoosters[id];
  });

  // Missionen (Farmen/Kampf) und Basis-Raids nachholen
  await processMissions(state);
  await processRaidTimer(state);
  // Angriffsfluege gegen Piratenbasen (siehe pirateBaseState.ts) - komplett unabhaengig vom
  // normalen Raid-System, das weiterhin unveraendert oben in processRaidTimer laeuft.
  await processPirateAttacks(state);
  // Spionagefluege gegen Piratenbasen UND der umgekehrte periodische Check "wurde ich gerade von
  // Piraten ausspioniert" (siehe spyMissions.ts) - beide komplett unabhaengig von Raids/Angriffen.
  await processSpyMissions(state);
  maybeGeneratePirateSpyReport(state);
  // Ab hier: nicht nur den eigenen Zustand nachziehen, sondern bei jedem Tick zusaetzlich fuer
  // ALLE anderen Spieler pruefen, ob faellige Checkpoints/Expeditionen liegen geblieben sind -
  // damit Raids/Multiplayer-Expeditionen auch dann weiterlaufen, wenn der jeweils betroffene
  // Spieler selbst gerade nicht online ist (siehe README fuer den Hintergrund).
  await processOverdueRaidsForOtherUsers(state);
  await processOverdueRaidSpawnsForOtherUsers(state);
  await processAllDepartedGroupOperations(state);

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
  const costMultiplier = shipCostMultiplier(state);
  const effectiveCost: ResourceCost = {
    metall: ship.cost ? ship.cost.metall * costMultiplier : 0,
    kristall: ship.cost ? ship.cost.kristall * costMultiplier : 0,
    deuterium: ship.cost ? ship.cost.deuterium * costMultiplier : 0,
  };
  if (!ship.cost || !canAfford(state, effectiveCost, effectiveQty)) {
    return { ok: false, error: 'Nicht genug Ressourcen.' };
  }
  const frei = MAX_PLAYER_SHIPS - totalOwnedShips(state);
  if (effectiveQty > frei) return { ok: false, error: `Nur noch ${frei} Schiff(e) bis zum Flottenlimit moeglich.` };

  state.resources.metall -= effectiveCost.metall * effectiveQty;
  state.resources.kristall -= effectiveCost.kristall * effectiveQty;
  state.resources.deuterium -= effectiveCost.deuterium * effectiveQty;

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
  const costMultiplier = defenseCostMultiplier(state);
  const effectiveCost: ResourceCost = {
    metall: def.cost.metall * costMultiplier,
    kristall: def.cost.kristall * costMultiplier,
    deuterium: def.cost.deuterium * costMultiplier,
  };
  if (!canAfford(state, effectiveCost, qty)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= effectiveCost.metall * qty;
  state.resources.kristall -= effectiveCost.kristall * qty;
  state.resources.deuterium -= effectiveCost.deuterium * qty;

  const now = Date.now();
  let startTime = now;
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) {
    const laneJob = state.defenseQueue[state.defenseQueue.length - MAX_DEFENSE_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  const duration = def.buildTime * defenseBauzeitMultiplier(state) * qty * 1000;
  state.defenseQueue.push({ defId, count: qty, startTime, endTime: startTime + duration });
  return { ok: true };
}

// ========== GEBAEUDE BAUEN ==========

export function startBuildingConstruction(state: PlayerState, buildingId: string): ActionResult {
  const building = findBuilding(buildingId);
  if (!building) return { ok: false, error: 'Unbekanntes Gebäude.' };
  if (state.buildingQueue.length >= MAX_BUILDING_SLOTS) {
    return { ok: false, error: 'Es kann immer nur ein Gebäude gleichzeitig gebaut werden.' };
  }

  const level = state.buildings[buildingId] || 0;
  const nextLevel = level + 1;
  const cost = buildingCostForLevel(building, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  const duration = buildingTimeForLevel(state, building, nextLevel);
  state.buildingQueue.push({ buildingId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== GEBAEUDE-MODULSYSTEM (siehe types.ts BuildingModuleDefinition/README) ==========

function moduleCostForLevel(mod: (typeof BUILDING_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function moduleTimeForLevel(state: PlayerState, mod: (typeof BUILDING_MODULES)[number], level: number): number {
  // Module nutzen bewusst DIESELBE Bauzeit-Multiplikator-Kette wie ihr Basis-Gebaeude (inkl.
  // dessen eigenem "buildtime_self"-Modul, siehe gebaeudeBauzeitMultiplier) - ein Modul ist
  // schliesslich Teil desselben Bauprojekts, keine eigene Kategorie.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * gebaeudeBauzeitMultiplier(state, mod.buildingId);
}

export function startModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findBuildingModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const buildingLevel = state.buildings[mod.buildingId] || 0;
  if (buildingLevel < mod.requiredBuildingLevel) {
    const building = findBuilding(mod.buildingId);
    return { ok: false, error: `Erfordert ${building?.name || mod.buildingId} Stufe ${mod.requiredBuildingLevel}.` };
  }
  const level = state.buildingModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Module teilen sich den Bau-Slot mit den Gebaeuden selbst (MAX_BUILDING_SLOTS=1) - ein Modul
  // ist konzeptionell ein Ausbauprojekt AM Gebaeude, kein eigenstaendiges Bauvorhaben.
  if (state.buildingQueue.length >= MAX_BUILDING_SLOTS) {
    return { ok: false, error: 'Es kann immer nur ein Gebäude/Modul gleichzeitig gebaut werden.' };
  }

  const nextLevel = level + 1;
  const cost = moduleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  const duration = moduleTimeForLevel(state, mod, nextLevel);
  state.buildingQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== SCHIFFS-MODULE (Waffen/Schild/Panzerung/Antrieb pro Schiff, siehe data/shipModules.ts) ==========

function shipModuleCostForLevel(mod: (typeof SHIP_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function shipModuleTimeForLevel(state: PlayerState, mod: (typeof SHIP_MODULES)[number], level: number): number {
  // Nutzt dieselbe Bauzeit-Multiplikator-Kette wie normale Schiffe (bauzeitMultiplier) - ein
  // Schiffs-Modul ist schliesslich eine Werft-Ausbaumassnahme wie der Schiffbau selbst.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * bauzeitMultiplier(state);
}

export function startShipModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findShipModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const level = state.shipModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Schiffs-Module teilen sich MAX_SHIP_MODULE_SLOTS globale Bauplaetze, unabhaengig von
  // den 3 normalen Schiffs-Bauplaetzen (buildQueue) - konkurriert nicht mit dem eigentlichen
  // Schiffbau.
  if (state.shipModuleQueue.length >= MAX_SHIP_MODULE_SLOTS) {
    return { ok: false, error: `Es können maximal ${MAX_SHIP_MODULE_SLOTS} Schiffsmodule gleichzeitig gebaut werden.` };
  }

  const nextLevel = level + 1;
  const cost = shipModuleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  const duration = shipModuleTimeForLevel(state, mod, nextLevel);
  state.shipModuleQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== VERTEIDIGUNGS-MODULE (Waffen/Schild/Panzerung pro Anlage, siehe data/defenseModules.ts) ==========
// Stufen landen in DERSELBEN state.shipModules-Map wie Schiffs-Module (siehe
// DefenseModuleDefinition-Kommentar in types.ts) - nur die Bauschlange/der Slot ist eigenstaendig.

function defenseModuleCostForLevel(mod: (typeof DEFENSE_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function defenseModuleTimeForLevel(state: PlayerState, mod: (typeof DEFENSE_MODULES)[number], level: number): number {
  // Nutzt dieselbe Bauzeit-Multiplikator-Kette wie normale Verteidigungsanlagen
  // (defenseBauzeitMultiplier), analog zu shipModuleTimeForLevel oben.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * defenseBauzeitMultiplier(state);
}

export function startDefenseModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findDefenseModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const level = state.shipModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Verteidigungs-Module teilen sich MAX_DEFENSE_MODULE_SLOTS globale Bauplaetze,
  // eigenstaendig getrennt von der Schiffsmodul-Warteschlange und den 3 normalen
  // Verteidigungs-Bauplaetzen (defenseQueue).
  if (state.defenseModuleQueue.length >= MAX_DEFENSE_MODULE_SLOTS) {
    return { ok: false, error: `Es können maximal ${MAX_DEFENSE_MODULE_SLOTS} Verteidigungsmodule gleichzeitig gebaut werden.` };
  }

  const nextLevel = level + 1;
  const cost = defenseModuleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  const duration = defenseModuleTimeForLevel(state, mod, nextLevel);
  state.defenseModuleQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
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
  // Spionage wieder freigeschaltet (Nutzerentscheidung Juli 2026) - ihr NEUER Zweck ist der
  // Detailgrad von Spionageflug-Berichten gegen Piratenbasen (siehe spyMissions.ts), nicht mehr die
  // alte, kaum spuerbare Gegner-Glaettung (generatePiratenFleet()/generateDefenseFleet() bekommen
  // weiterhin ueberall fest 0 fuer spionageLevel uebergeben - bewusst UNVERAENDERT belassen, siehe
  // missions.ts/groupOps.ts/simulator.ts, da der neue Zweck damit nichts zu tun hat).
  // Forschungsbaum: Voraussetzung pruefen (siehe ResearchDefinition.parentId, types.ts) - die
  // Elternforschung muss PARENT_UNLOCK_LEVEL (einheitlich Stufe 3) erreicht haben, bevor dieser
  // Zweig ueberhaupt gestartet werden kann.
  if (tech.parentId) {
    const parentLevel = state.research[tech.parentId] || 0;
    if (parentLevel < PARENT_UNLOCK_LEVEL) {
      const parentTech = RESEARCH.find((r) => r.id === tech.parentId);
      return { ok: false, error: `Erfordert ${parentTech?.name || tech.parentId} Stufe ${PARENT_UNLOCK_LEVEL}.` };
    }
  }
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
