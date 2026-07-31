import { getUserById, listAlliancesJson, saveAllianceJson, getStationJson, listStationsJson, saveStationJson } from '../db.js';
import { getReservedGalaxyPositions, isGalaxyPositionFree } from './galaxyPositions.js';
import { GALAXY_SYSTEMS, GALAXY_POSITIONS } from './data/galaxyConstants.js';
import { STATION_BUILDINGS, findStationBuilding, stationBuildingsForTier } from './data/stationBuildings.js';
import { findStationBuildingModule } from './data/stationBuildingModules.js';
import type { ActionResult } from './actions.js';
import type { Alliance, AllianceMember, BuildingModuleDefinition, GalaxyPosition, PlayerState, ResourceCost, Station, StationBuildingDefinition } from './types.js';

// Max. 1 Gebaeude gleichzeitig in Arbeit, analog MAX_BUILDING_SLOTS bei der Heimatbasis - hier
// als eigene, kleine Konstante statt eines Imports aus combatConstants.ts, da die Station
// bewusst komplett von der Heimatbasis-Wirtschaft entkoppelt ist (siehe Datei-Kommentar oben).
const STATION_MAX_BUILD_SLOTS = 1;

// Deckelt station.buildLog (Nutzerwunsch Juli 2026, Nachvollziehbarkeit wer/was/wann gebaut hat) -
// neueste Eintraege zuerst (unshift), aeltere werden ab dieser Laenge verworfen.
const STATION_BUILD_LOG_MAX = 50;

function newId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function loadAlliance(id: string): Alliance | undefined {
  return listAlliancesJson()
    .map((j) => JSON.parse(j) as Alliance)
    .find((a) => a.id === id);
}
function saveAlliance(alliance: Alliance): void {
  saveAllianceJson(alliance.id, alliance.creatorId, JSON.stringify(alliance));
}

// Ein Nutzer kann aktuell nur Mitglied EINER Allianz gleichzeitig sein (auch als offene
// Einladung, siehe "pending") - kein Allianz-Browser/Wechsel-Flow noetig (Nutzerentscheidung,
// siehe README/Plan "Allianz-Station").
export function findMyAlliance(userId: number): Alliance | undefined {
  return listAlliancesJson()
    .map((j) => JSON.parse(j) as Alliance)
    .find((a) => a.members.some((m) => m.userId === userId));
}

// Migriert Bestandsstationen (vor Einfuehrung von buildLog/userId auf Queue-Eintraegen, siehe
// STATION_BUILD_LOG_MAX unten) - fehlende Felder werden defensiv aufgefuellt statt einen Crash
// beim Laden alter gespeicherter Stationen zu riskieren.
function parseStation(json: string): Station {
  const station = JSON.parse(json) as Station;
  if (!station.buildLog) station.buildLog = [];
  station.buildQueue = (station.buildQueue || []).map((job) => ({
    ...job,
    userId: job.userId ?? -1,
    username: job.username ?? 'Unbekannt',
  }));
  return station;
}

export function loadStation(id: string): Station | undefined {
  const json = getStationJson(id);
  return json ? parseStation(json) : undefined;
}
export function saveStation(station: Station): void {
  saveStationJson(station.id, station.allianceId, JSON.stringify(station));
}
export function findStationByAllianceId(allianceId: string): Station | undefined {
  return listStationsJson()
    .map((j) => parseStation(j))
    .find((s) => s.allianceId === allianceId);
}

// Fuer die Galaxie-Ansicht (GET /game/galaxy) - alle Stationen mit Position + Allianzname, damit
// eine belegte Position auch sichtbar als belegt angezeigt wird (nicht nur serverseitig
// blockiert, siehe README Punkt 116 fuer den analogen Bugfix bei Piraten-Sektor-Buttons).
export function listAllStationPositions(): { allianceName: string; system: number; position: number }[] {
  const alliances = listAlliancesJson().map((j) => JSON.parse(j) as Alliance);
  return listStationsJson()
    .map((j) => JSON.parse(j) as Station)
    .map((s) => {
      const alliance = alliances.find((a) => a.id === s.allianceId);
      return { allianceName: alliance?.name || 'Allianz', system: s.position.system, position: s.position.position };
    });
}

// ========== ALLIANZ: GRUENDEN / EINLADEN / ANTWORTEN ==========

export function createAlliance(state: PlayerState, name: string): ActionResult {
  if (findMyAlliance(state.userId)) return { ok: false, error: 'Du bist bereits Mitglied einer Allianz.' };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Name erforderlich.' };
  if (trimmed.length > 40) return { ok: false, error: 'Name darf höchstens 40 Zeichen lang sein.' };

  const me = getUserById(state.userId)!;
  const alliance: Alliance = {
    id: newId('alliance'),
    name: trimmed,
    creatorId: state.userId,
    members: [{ userId: state.userId, username: me.username, status: 'accepted', isCreator: true }],
    createdAt: Date.now(),
  };
  saveAlliance(alliance);
  return { ok: true };
}

export function inviteToAlliance(state: PlayerState, userId: number): ActionResult {
  const alliance = findMyAlliance(state.userId);
  if (!alliance) return { ok: false, error: 'Du bist in keiner Allianz.' };
  if (alliance.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann einladen.' };
  if (userId === state.userId) return { ok: false, error: 'Du kannst dich nicht selbst einladen.' };
  const target = getUserById(userId);
  if (!target) return { ok: false, error: 'Spieler nicht gefunden.' };
  if (alliance.members.some((m) => m.userId === userId)) {
    return { ok: false, error: 'Dieser Spieler ist bereits Mitglied oder eingeladen.' };
  }
  if (findMyAlliance(userId)) return { ok: false, error: 'Dieser Spieler ist bereits in einer anderen Allianz.' };

  const member: AllianceMember = { userId, username: target.username, status: 'pending', isCreator: false };
  alliance.members.push(member);
  saveAlliance(alliance);
  return { ok: true };
}

export function respondToAllianceInvite(state: PlayerState, allianceId: string, accept: boolean): ActionResult {
  const alliance = loadAlliance(allianceId);
  if (!alliance) return { ok: false, error: 'Allianz nicht gefunden.' };
  const member = alliance.members.find((m) => m.userId === state.userId);
  if (!member) return { ok: false, error: 'Du bist zu dieser Allianz nicht eingeladen.' };
  if (member.status !== 'pending') return { ok: false, error: 'Du hast bereits geantwortet.' };

  if (!accept) {
    alliance.members = alliance.members.filter((m) => m.userId !== state.userId);
    saveAlliance(alliance);
    return { ok: true };
  }
  member.status = 'accepted';
  saveAlliance(alliance);
  return { ok: true };
}

// ========== STATION GRUENDEN ==========

export function foundStation(state: PlayerState, target: GalaxyPosition): ActionResult {
  const alliance = findMyAlliance(state.userId);
  if (!alliance) return { ok: false, error: 'Du bist in keiner Allianz.' };
  if (alliance.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann die Station gründen.' };
  if (alliance.stationId) return { ok: false, error: 'Diese Allianz hat bereits eine Station.' };
  if (!alliance.members.every((m) => m.status === 'accepted')) {
    return { ok: false, error: 'Alle Mitglieder müssen die Einladung zuerst annehmen.' };
  }
  if (!Number.isInteger(target.system) || target.system < 1 || target.system > GALAXY_SYSTEMS) {
    return { ok: false, error: 'Ungültiges Zielsystem.' };
  }
  if (!Number.isInteger(target.position) || target.position < 1 || target.position > GALAXY_POSITIONS) {
    return { ok: false, error: 'Ungültige Zielposition.' };
  }

  const reserved = getReservedGalaxyPositions();
  if (!isGalaxyPositionFree(target, reserved)) {
    return { ok: false, error: 'Diese Position ist bereits belegt.' };
  }

  const now = Date.now();
  const station: Station = {
    id: newId('station'),
    allianceId: alliance.id,
    position: target,
    tier: 1,
    buildings: {},
    buildingModules: {},
    buildQueue: [],
    buildLog: [],
    resources: { metall: 0, kristall: 0, deuterium: 0 },
    lastTick: now,
    createdAt: now,
  };
  saveStation(station);
  alliance.stationId = station.id;
  saveAlliance(alliance);
  return { ok: true };
}

// ========== PRODUKTION + ENERGIE (eigenstaendig, siehe Design-Entscheidung im Plan: KEINE
// Kopplung an Forschung/Klasse/Booster eines einzelnen Mitglieds - nur Gebaeude-Stufe zaehlt) ==========

function levelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}

const TIER_MINE_KINDS = ['mine_metall', 'mine_kristall', 'mine_deuterium'] as const;

// Modul-Effekte (siehe data/stationBuildingModules.ts) - eigene, einfache Version von
// moduleBoostFactor()/moduleReductionFactor() aus actions.ts, operiert auf Station.buildingModules
// statt PlayerState.buildingModules.
function stationModuleBoostFactor(station: Station, moduleId: string): number {
  const mod = findStationBuildingModule(moduleId);
  if (!mod) return 1;
  return 1 + (station.buildingModules[moduleId] || 0) * mod.effectPerLevel;
}
function stationModuleReductionFactor(station: Station, moduleId: string): number {
  const mod = findStationBuildingModule(moduleId);
  if (!mod) return 1;
  return Math.max(0.5, 1 - (station.buildingModules[moduleId] || 0) * mod.effectPerLevel);
}
function stationOutputModuleId(building: StationBuildingDefinition): string {
  return building.kind === 'energie' ? `${building.id}_ertragssteigerung` : `${building.id}_foerdereffizienz`;
}
function stationEnergyReductionModuleId(building: StationBuildingDefinition): string {
  return `${building.id}_energiesparmodul`;
}
function stationTimeModuleId(building: StationBuildingDefinition): string {
  if (building.kind === 'energie') return `${building.id}_wartungsoptimierung`;
  if (building.kind === 'roboter' || building.kind === 'nanit') return `${building.id}_wartungsfreiheit`;
  return `${building.id}_automatisierung`;
}
function stationStrengthenModuleId(building: StationBuildingDefinition): string {
  return `${building.id}_verstaerkte_automatisierung`;
}

// Roboterfabrik/Nanitenfabrik verkuerzen die Bauzeit ALLER Gebaeude/Module DERSELBEN Stufe
// (analog roboterNaniteFactor(..., 'building') in actions.ts) - 25%/-50% pro Stufe,
// kompoundierend, zusaetzlich verstaerkt durch ihr eigenes "Verstaerkte Automatisierung"-Modul.
// Pro Stufe GETRENNT wie beim Energiefaktor (ein V3-Nanit hilft nicht rueckwirkend V1/V2).
function stationBauzeitFactorForTier(station: Station, tier: 1 | 2 | 3): number {
  const tierBuildings = stationBuildingsForTier(tier);
  const roboter = tierBuildings.find((b) => b.kind === 'roboter');
  const nanit = tierBuildings.find((b) => b.kind === 'nanit');
  const roboterLevel = roboter ? station.buildings[roboter.id] || 0 : 0;
  const nanitLevel = nanit ? station.buildings[nanit.id] || 0 : 0;
  let factor = Math.pow(0.75, roboterLevel) * Math.pow(0.5, nanitLevel);
  if (roboter) factor *= stationModuleReductionFactor(station, stationStrengthenModuleId(roboter));
  if (nanit) factor *= stationModuleReductionFactor(station, stationStrengthenModuleId(nanit));
  return factor;
}

// Energiefaktor GETRENNT pro Stufe (V1-Solarkraftwerk deckt nur V1-Minen, V2-Solarkraftwerk nur
// V2-Minen usw.) - jede Stufe ist wirtschaftlich in sich geschlossen, sonst koennte ein einziges
// spaet gebautes V3-Solarkraftwerk rueckwirkend alle daruegen liegenden Stufen mitversorgen.
function stationEnergyFactorForTier(station: Station, tier: 1 | 2 | 3): number {
  const tierBuildings = stationBuildingsForTier(tier);
  const solar = tierBuildings.find((b) => b.kind === 'energie');
  const produced = solar
    ? levelScaledValue(solar.baseEnergyOutput || 0, station.buildings[solar.id] || 0) * stationModuleBoostFactor(station, stationOutputModuleId(solar))
    : 0;
  let consumed = 0;
  tierBuildings.forEach((b) => {
    if ((TIER_MINE_KINDS as readonly string[]).includes(b.kind)) {
      const base = levelScaledValue(b.baseEnergyUse || 0, station.buildings[b.id] || 0);
      consumed += base * stationModuleReductionFactor(station, stationEnergyReductionModuleId(b));
    }
  });
  if (consumed <= 0) return 1;
  return Math.min(1, produced / consumed);
}

function stationMineOutputPerHour(station: Station, building: StationBuildingDefinition): number {
  if (!building.baseOutput) return 0;
  const level = station.buildings[building.id] || 0;
  const base = levelScaledValue(building.baseOutput, level);
  const moduleFactor = stationModuleBoostFactor(station, stationOutputModuleId(building));
  return base * moduleFactor * stationEnergyFactorForTier(station, building.tier);
}

// Rechnet die seit `station.lastTick` vergangene Zeit als passive Produktion hoch - summiert
// ALLE Gebaeude ueber ALLE Stufen (kumulativ, Nutzerentscheidung - siehe Plan). Gebaeude einer
// noch nicht freigeschalteten Stufe haben immer Level 0 (koennen nicht gebaut werden, siehe
// startStationBuildingConstruction), tragen also ohnehin nichts bei - kein Filter noetig.
function accrueStationProduction(station: Station, deltaSec: number): void {
  if (deltaSec <= 0) return;
  STATION_BUILDINGS.forEach((building) => {
    const perHour = stationMineOutputPerHour(station, building);
    if (perHour <= 0) return;
    const gain = (perHour / 3600) * deltaSec;
    if (building.kind === 'mine_metall') station.resources.metall += gain;
    else if (building.kind === 'mine_kristall') station.resources.kristall += gain;
    else if (building.kind === 'mine_deuterium') station.resources.deuterium += gain;
  });
}

// Schaltet die naechste Stufe frei, sobald alle 3 Minen DIESER Stufe ihr Level-Cap (30) erreicht
// haben (Nutzerentscheidung - Solarkraftwerk zaehlt bewusst nicht mit, siehe Plan).
function checkTierUnlock(station: Station): void {
  if (station.tier >= 3) return;
  const mines = stationBuildingsForTier(station.tier).filter((b) => (TIER_MINE_KINDS as readonly string[]).includes(b.kind));
  const allMaxed = mines.every((b) => (station.buildings[b.id] || 0) >= (b.maxLevel ?? Infinity));
  if (allMaxed) station.tier = (station.tier + 1) as 1 | 2 | 3;
}

function stationBuildingCostForLevel(building: StationBuildingDefinition, level: number): ResourceCost {
  const f = Math.pow(building.costGrowth, level - 1);
  return {
    metall: Math.round(building.baseCost.metall * f),
    kristall: Math.round(building.baseCost.kristall * f),
    deuterium: Math.round(building.baseCost.deuterium * f),
  };
}

function stationBuildingTimeMs(station: Station, building: StationBuildingDefinition, level: number): number {
  const base = building.baseTimeSeconds * Math.pow(building.timeGrowth, level - 1) * 1000;
  return base * stationBauzeitFactorForTier(station, building.tier) * stationModuleReductionFactor(station, stationTimeModuleId(building));
}

function stationModuleTimeMs(station: Station, mod: BuildingModuleDefinition, level: number): number {
  const base = mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000;
  const building = findStationBuilding(mod.buildingId);
  return base * (building ? stationBauzeitFactorForTier(station, building.tier) : 1);
}
function stationModuleCostForLevel(mod: BuildingModuleDefinition, level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

// Verarbeitet Bau-Warteschlange + passive Produktion + Stufen-Freischaltung seit dem letzten
// Tick - wird bei JEDEM Laden der Station aufgerufen (siehe loadStationWithTick() unten), analog
// zum "Nachholen ohne Dauer-Prozess"-Prinzip aus actions.ts runEconomyTick()/pirateBaseState.ts.
function processStationTick(station: Station): void {
  const now = Date.now();
  const deltaSec = Math.max(0, (now - station.lastTick) / 1000);
  accrueStationProduction(station, deltaSec);

  station.buildQueue = station.buildQueue.filter((job) => {
    if (job.endTime > now) return true;
    let newLevel: number;
    if (job.buildingId) newLevel = station.buildings[job.buildingId] = (station.buildings[job.buildingId] || 0) + 1;
    else if (job.moduleId) newLevel = station.buildingModules[job.moduleId] = (station.buildingModules[job.moduleId] || 0) + 1;
    else return false;
    station.buildLog.unshift({
      userId: job.userId,
      username: job.username,
      buildingId: job.buildingId,
      moduleId: job.moduleId,
      level: newLevel,
      completedAt: now,
    });
    if (station.buildLog.length > STATION_BUILD_LOG_MAX) station.buildLog.length = STATION_BUILD_LOG_MAX;
    return false;
  });

  checkTierUnlock(station);
  station.lastTick = now;
}

// Wie loadStation(), holt aber zusaetzlich die seit dem letzten Zugriff vergangene Zeit nach und
// speichert das Ergebnis sofort - so bleibt jeder Aufrufer (GET /alliance, Bau-Aktionen) immer auf
// dem aktuellen Stand, ganz ohne eigenen Dauer-Prozess (nur der globale Heartbeat, siehe
// runStationHeartbeatTick() unten, holt auch OHNE aktiven Seitenaufruf regelmaessig nach).
function loadStationWithTick(id: string): Station | undefined {
  const station = loadStation(id);
  if (!station) return undefined;
  processStationTick(station);
  saveStation(station);
  return station;
}

// Fuer den globalen Heartbeat (heartbeat.ts) - holt ALLE Stationen nach, auch wenn gerade
// niemand die Allianz-Seite geoeffnet hat (identisches Prinzip wie bei Piratenbasen/Raids).
export function runStationHeartbeatTick(): void {
  listStationsJson().forEach((j) => {
    const station = parseStation(j);
    processStationTick(station);
    saveStation(station);
  });
}

// ========== BAUEN ==========

export function startStationBuildingConstruction(state: PlayerState, stationId: string, buildingId: string): ActionResult {
  const alliance = findMyAlliance(state.userId);
  if (!alliance || alliance.stationId !== stationId) return { ok: false, error: 'Station nicht gefunden.' };
  const me = alliance.members.find((m) => m.userId === state.userId);
  if (!me || me.status !== 'accepted') return { ok: false, error: 'Du bist kein Mitglied dieser Allianz.' };

  const station = loadStationWithTick(stationId);
  if (!station) return { ok: false, error: 'Station nicht gefunden.' };
  const building = findStationBuilding(buildingId);
  if (!building) return { ok: false, error: 'Unbekanntes Gebäude.' };
  if (building.tier > station.tier) {
    return { ok: false, error: `Diese Stufe ist noch nicht freigeschaltet - alle V${station.tier}-Minen müssen zuerst Level ${30} erreichen.` };
  }
  if (station.buildQueue.length >= STATION_MAX_BUILD_SLOTS) {
    return { ok: false, error: 'Es läuft bereits ein Bauvorhaben auf der Station.' };
  }
  const currentLevel = station.buildings[buildingId] || 0;
  if (building.maxLevel !== undefined && currentLevel >= building.maxLevel) {
    return { ok: false, error: `${building.name} hat bereits die maximale Stufe (${building.maxLevel}) erreicht.` };
  }

  const cost = stationBuildingCostForLevel(building, currentLevel + 1);
  if (station.resources.metall < cost.metall || station.resources.kristall < cost.kristall || station.resources.deuterium < cost.deuterium) {
    return { ok: false, error: 'Nicht genug Ressourcen im Stations-Lager.' };
  }
  station.resources.metall -= cost.metall;
  station.resources.kristall -= cost.kristall;
  station.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  station.buildQueue.push({
    buildingId,
    startTime: now,
    endTime: now + stationBuildingTimeMs(station, building, currentLevel + 1),
    userId: state.userId,
    username: me.username,
  });
  saveStation(station);
  return { ok: true };
}

export function startStationModuleUpgrade(state: PlayerState, stationId: string, moduleId: string): ActionResult {
  const alliance = findMyAlliance(state.userId);
  if (!alliance || alliance.stationId !== stationId) return { ok: false, error: 'Station nicht gefunden.' };
  const me = alliance.members.find((m) => m.userId === state.userId);
  if (!me || me.status !== 'accepted') return { ok: false, error: 'Du bist kein Mitglied dieser Allianz.' };

  const station = loadStationWithTick(stationId);
  if (!station) return { ok: false, error: 'Station nicht gefunden.' };
  const mod = findStationBuildingModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const building = findStationBuilding(mod.buildingId);
  if (!building) return { ok: false, error: 'Unbekanntes Gebäude.' };
  if (building.tier > station.tier) {
    return { ok: false, error: 'Diese Stufe ist noch nicht freigeschaltet.' };
  }
  const buildingLevel = station.buildings[mod.buildingId] || 0;
  if (buildingLevel < mod.requiredBuildingLevel) {
    return { ok: false, error: `${building.name} muss zuerst Level ${mod.requiredBuildingLevel} erreichen.` };
  }
  if (station.buildQueue.length >= STATION_MAX_BUILD_SLOTS) {
    return { ok: false, error: 'Es läuft bereits ein Bauvorhaben auf der Station.' };
  }
  const currentLevel = station.buildingModules[moduleId] || 0;
  if (currentLevel >= mod.maxLevel) {
    return { ok: false, error: `${mod.name} hat bereits die maximale Stufe (${mod.maxLevel}) erreicht.` };
  }

  const cost = stationModuleCostForLevel(mod, currentLevel + 1);
  if (station.resources.metall < cost.metall || station.resources.kristall < cost.kristall || station.resources.deuterium < cost.deuterium) {
    return { ok: false, error: 'Nicht genug Ressourcen im Stations-Lager.' };
  }
  station.resources.metall -= cost.metall;
  station.resources.kristall -= cost.kristall;
  station.resources.deuterium -= cost.deuterium;

  const now = Date.now();
  station.buildQueue.push({
    moduleId,
    startTime: now,
    endTime: now + stationModuleTimeMs(station, mod, currentLevel + 1),
    userId: state.userId,
    username: me.username,
  });
  saveStation(station);
  return { ok: true };
}

// ========== EINZAHLEN / ABHEBEN ==========
// Self-Service in beide Richtungen (Nutzerentscheidung: "nach Wunsch aufteilen", kein
// Genehmigungsschritt) - Einzahlen loest ausserdem das Henne-Ei-Problem, dass eine frisch
// gegruendete Station bei 0 Ressourcen startet und sonst nie das erste Gebaeude bezahlen koennte.

type ResourceKind = 'metall' | 'kristall' | 'deuterium';
const RESOURCE_KINDS: ResourceKind[] = ['metall', 'kristall', 'deuterium'];

function validateTransfer(state: PlayerState, stationId: string, resource: string, amount: number): { alliance: Alliance; station: Station } | ActionResult {
  const alliance = findMyAlliance(state.userId);
  if (!alliance || alliance.stationId !== stationId) return { ok: false, error: 'Station nicht gefunden.' };
  const me = alliance.members.find((m) => m.userId === state.userId);
  if (!me || me.status !== 'accepted') return { ok: false, error: 'Du bist kein Mitglied dieser Allianz.' };
  if (!RESOURCE_KINDS.includes(resource as ResourceKind)) return { ok: false, error: 'Unbekannte Ressource.' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Menge muss größer als 0 sein.' };
  const station = loadStationWithTick(stationId);
  if (!station) return { ok: false, error: 'Station nicht gefunden.' };
  return { alliance, station };
}

export function depositToStation(state: PlayerState, stationId: string, resource: string, amount: number): ActionResult {
  const result = validateTransfer(state, stationId, resource, amount);
  if ('ok' in result) return result;
  const { station } = result;
  const key = resource as ResourceKind;
  if (state.resources[key] < amount) return { ok: false, error: 'Nicht genug Ressourcen im eigenen Lager.' };
  state.resources[key] -= amount;
  station.resources[key] += amount;
  saveStation(station);
  return { ok: true };
}

export function withdrawFromStation(state: PlayerState, stationId: string, resource: string, amount: number): ActionResult {
  const result = validateTransfer(state, stationId, resource, amount);
  if ('ok' in result) return result;
  const { station } = result;
  const key = resource as ResourceKind;
  if (station.resources[key] < amount) return { ok: false, error: 'Nicht genug Ressourcen im Stations-Lager.' };
  station.resources[key] -= amount;
  state.resources[key] += amount;
  saveStation(station);
  return { ok: true };
}

// ========== LADEN (fuer /alliance GET) ==========

export function getMyAllianceAndStation(userId: number): { alliance: Alliance | null; station: Station | null } {
  const alliance = findMyAlliance(userId) || null;
  if (!alliance) return { alliance: null, station: null };
  const station = alliance.stationId ? loadStationWithTick(alliance.stationId) || null : null;
  return { alliance, station };
}
