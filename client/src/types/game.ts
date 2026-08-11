export interface ResourceCost {
  metall: number;
  kristall: number;
  deuterium: number;
}

export interface CombatStats {
  waffen: number;
  schild: number;
  panzerung: number;
}

export interface ShipDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  tier: number;
  buildTime: number;
  cost?: ResourceCost;
  stats: CombatStats;
  maxCount?: number;
  unique?: boolean;
  specialOnly?: boolean;
  teileCost?: { waffen: number; schild: number; panzerung: number };
  speed: number;
  fuelConsumption: number;
  driveType: 'rakete' | 'impuls' | 'hyperraum';
}

export interface DefenseDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  buildTime: number;
  cost: ResourceCost;
  stats: CombatStats;
  maxCount?: number;
  isDome?: boolean;
}

export interface GalaxyPosition {
  system: number;
  position: number;
}

export interface GalaxyDeployment {
  id: string;
  targetUserId: number;
  targetUsername: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  recalled: boolean;
  returnTime: number | null;
}

export interface GalaxyOccupant {
  userId: number;
  username: string;
  system: number;
  position: number;
  isBot: boolean;
}

export interface SektorGalaxyPosition {
  sektorId: string;
  name: string;
  system: number;
  position: number;
}

export interface IncomingDeployment {
  ownerUsername: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  arriveTime: number;
  holding: boolean;
}

export interface GalaxyEvent {
  id: string;
  type: string;
  system: number;
  position: number;
  spawnedAt: number;
  expiresAt: number;
}

export interface GalaxyEventTypeDef {
  label: string;
  icon: string;
  metall: [number, number];
  kristall: [number, number];
  deuterium: [number, number];
  dm: [number, number];
}

export interface GalaxyEventReward {
  metall: number;
  kristall: number;
  deuterium: number;
  dm: number;
}

export interface GalaxyEventTrip {
  id: string;
  eventId: string;
  eventType: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  returnTime: number;
  collected: boolean;
  reward: GalaxyEventReward | null;
}

export interface PirateBaseSummary {
  id: string;
  system: number;
  position: number;
  power: number;
}

export interface PirateAttackDeployment {
  id: string;
  baseId: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  returnTime: number;
  resolved: boolean;
}

export interface SpyMissionDeployment {
  id: string;
  baseId: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  returnTime: number;
  resolved: boolean;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  kind: 'mine_metall' | 'mine_kristall' | 'mine_deuterium' | 'energie' | 'roboter' | 'nanit';
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
  baseOutput?: number;
  baseEnergyUse?: number;
  baseEnergyOutput?: number;
  tier?: 1 | 2 | 3;
  maxLevel?: number;
}

export interface BuildingModuleDefinition {
  id: string;
  name: string;
  lore: string;
  buildingId: string;
  moduleKind: 'output' | 'energy_reduction' | 'buildtime_self' | 'strengthen_factor';
  requiredBuildingLevel: number;
  effectPerLevel: number;
  maxLevel: number;
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
}

export type ShipModuleKind = 'waffen' | 'schild' | 'panzerung' | 'antrieb';

export interface ShipModuleDefinition {
  id: string;
  name: string;
  shipId: string;
  moduleKind: ShipModuleKind;
  img: string;
  lore: string;
  effectPerLevel: number;
  maxLevel: number;
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
}

export type DefenseModuleKind = 'waffen' | 'schild' | 'panzerung';

export interface DefenseModuleDefinition {
  id: string;
  name: string;
  defenseId: string;
  moduleKind: DefenseModuleKind;
  img: string;
  lore: string;
  effectPerLevel: number;
  maxLevel: number;
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
}

export interface ResearchDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  effectPerLevel: number;
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeHours: number;
  timeGrowth: number;
  mainBranch: 'waffen' | 'verteidigung' | 'antrieb' | 'wirtschaft';
  parentId?: string;
  driveType?: 'rakete' | 'impuls' | 'hyperraum';
}

export interface BuildJob {
  shipId?: string;
  defId?: string;
  buildingId?: string;
  moduleId?: string;
  count: number;
  startTime: number;
  endTime: number;
}

export interface ResearchJob {
  techId: string;
  targetLevel: number;
  startTime: number;
  endTime: number;
}

export interface Mission {
  id: string;
  sektorId: string;
  ships: Record<string, number>;
  startTime: number;
  arriveTime: number;
  endTime: number;
  returnTime: number;
  processedHours: number;
  lastTick: number | null;
  farmed: { metall: number; kristall: number; deuterium: number };
  dmFound: number;
  teile: { waffen: number; schild: number; panzerung: number };
  sandronatorAlive: boolean;
  finalized: boolean;
  combatWins?: number;
}

export interface CombatUnitResult {
  id: string;
  name: string;
  sent?: number;
  count?: number;
  survived?: number;
  survivedCount?: number;
  lost?: number;
  destroyedCount?: number;
  destroyed?: boolean;
  waffen: number;
  schild: number;
  panzerung: number;
  dmgTaken: number;
  dmgDealt: number;
  shotsFired: number;
  hits: number;
  rapidFireTriggers: number;
  shieldDmgTaken: number;
  shieldRegen: number;
  isDefense?: boolean;
  isCaptain?: boolean;
  ownerUsername?: string;
}

export interface RewardSummary {
  metall?: number;
  kristall?: number;
  deuterium?: number;
  dm?: number;
  teileWaffen?: number;
  teileSchild?: number;
  teilePanzerung?: number;
  containerTier?: 'silber' | 'gold' | 'elite';
  stolenMetall?: number;
  stolenKristall?: number;
  stolenDeuterium?: number;
}

export interface CombatReplay {
  typesA: string[];
  typesB: string[];
  roundsA: number[][];
  roundsB: number[][];
  totalRounds: number;
}

export interface CombatDetail {
  sektorName: string;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  allyResult?: CombatUnitResult;
  rewards?: RewardSummary;
  replay?: CombatReplay;
  skirmishes?: SkirmishSummary[];
}

export interface SkirmishSummary {
  hour: number;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  rewards?: RewardSummary;
  replay?: CombatReplay;
}

export interface RichFindEntry {
  hour: number;
  bonus: { metall: number; kristall: number; deuterium: number };
}

export interface FarmDetail {
  sektorName: string;
  resources: { metall: number; kristall: number; deuterium: number };
  dm: number;
  teile: { waffen: number; schild: number; panzerung: number };
  winContainers?: { tier: 'silber' | 'gold' | 'elite'; count: number };
  fleetReturned?: Record<string, number>;
  skirmishes?: SkirmishSummary[];
  richFinds?: RichFindEntry[];
}

export interface SpyReportUnitRange {
  id: string;
  name: string;
  low: number;
  high: number;
  exact: boolean;
}

export interface SpyReportDetail {
  baseSystem: number;
  basePosition: number;
  level: number;
  resources: { metall: number; kristall: number; deuterium: number };
  fleet: SpyReportUnitRange[];
  defense: SpyReportUnitRange[];
}

export interface GameMessage {
  id: string;
  type: 'kampf' | 'farm';
  time: number;
  text: string;
  detail: CombatDetail | FarmDetail | SpyReportDetail | null;
  galaxyLink?: { system: number; position: number };
}

export interface Container {
  id: string;
  tier: 'silber' | 'gold' | 'elite';
  count: number;
  receivedAt: number;
}

export interface ContainerReward {
  type: 'resources' | 'dm' | 'teile' | 'zeitgutschein_bau_schiffe' | 'zeitgutschein_bau_verteidigung' | 'zeitgutschein_bau_gebaeude' | 'zeitgutschein_forschung' | 'freischiff';
  label: string;
  metall?: number;
  kristall?: number;
  deuterium?: number;
  amount?: number;
  waffen?: number;
  schild?: number;
  panzerung?: number;
  percent?: number;
  ships?: Record<string, number>;
}

export interface RewardItem {
  id: string;
  type: 'rewardItem';
  stackKey: string;
  reward: ContainerReward;
  count: number;
  receivedAt: number;
}

export type InventoryEntry = Container | RewardItem;

export interface RaidState {
  id: string;
  spawnedAt: number;
  pirateBase: GalaxyPosition;
  launchTime: number;
  launchNotified: boolean;
  arrivalTime: number;
  waveTimes: number[];
  wavesProcessed: number;
  wavesWon: number;
  accumulatedDestroyed: number;
}

export interface FleetPreset {
  id: string;
  name: string;
  ships: Record<string, number>;
}

export interface PlayerStats {
  missionsNiedrig: number;
  missionsMittel: number;
  missionsHoch: number;
  asteroidMissions: number;
  eliteBollwerkChecks: number;
  raidsRepelledFull: number;
  raidsRepelledPartial: number;
  captainsDefeated: number;
  enemiesDestroyed: number;
  ownShipsLost: number;
  resourcesLooted: number;
  containersOpened: { silber: number; gold: number; elite: number };
  researchCompleted: number;
  shipsBuilt: number;
  resourcesSpentShipsDefense: number;
  resourcesSpentResearchBuildings: number;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  points: number;
  stats: PlayerStats;
  shipsDefensePoints: number;
  researchBuildingsPoints: number;
}

export type PlayerClass = 'kanonier' | 'bollwerk' | 'kommandant';
export type EconomyClass = 'schmuggler' | 'ingenieur' | 'prospektor';

export interface PlayerState {
  userId: number;
  createdAt: number;
  playerClass: PlayerClass | null;
  economyClass: EconomyClass | null;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  research: Record<string, number>;
  buildQueue: BuildJob[];
  defenseQueue: BuildJob[];
  researchQueue: ResearchJob[];
  buildings: Record<string, number>;
  buildingTier: 1 | 2 | 3;
  buildingModules: Record<string, number>;
  buildingQueue: BuildJob[];
  shipModules: Record<string, number>;
  shipModuleQueue: BuildJob[];
  defenseModuleQueue: BuildJob[];
  galaxyPosition: GalaxyPosition | null;
  galaxyDeployments: GalaxyDeployment[];
  eventTrips: GalaxyEventTrip[];
  pirateAttacks: PirateAttackDeployment[];
  spyMissions: SpyMissionDeployment[];
  activeBoosters: Record<string, number>;
  teile: { waffen: number; schild: number; panzerung: number };
  missions: Mission[];
  messages: GameMessage[];
  inventory: InventoryEntry[];
  presets: FleetPreset[];
  raid: RaidState | null;
  nextRaidCheck: number;
  lastUpdate: number;
  serverTime?: number;
  energyProduced?: number;
  energyConsumed?: number;
  // V2/V3-Stufen (05.08.2026): Energie ist pro Gebaeude-Stufe isoliert, siehe routes.ts.
  energyByTier?: Record<1 | 2 | 3, { produced: number; consumed: number }>;
  stats: PlayerStats;
}

export interface SektorDefinition {
  id: string;
  name: string;
  img: string;
  typ: string;
  zweck: string;
  aktivitaet: string;
  gefahr: string;
  level: string;
}

export interface SektorConfig {
  checkChance: number;
  type: 'asteroid' | 'piraten';
  farmRate?: number;
  dmCap?: number;
  miningCap?: number;
  escortCap?: number;
  npcFloor: number;
  teileCap?: number;
  lootBase?: { metall: number; kristall: number; deuterium: number };
  bonusLootChance?: number;
  bonusLootMultiplier?: number;
  captainChance?: number;
  captainContainerTier?: 'silber' | 'gold' | 'elite';
  captainDm?: number;
  guaranteedContainers?: { tier: 'silber' | 'gold' | 'elite'; count: number }[];
  winContainer?: { tier: 'silber' | 'gold' | 'elite'; count: number };
  winResources?: { metall: number; kristall: number; deuterium: number };
  // Anteil der eingesetzten Flottenmacht, mit dem NPC-Verteidigungsanlagen gespawnt werden.
  // Kommt seit dem 11.08.2026 vom Server (SEKTOR_CONFIG) - vorher stand die Zahl in Sektor.tsx
  // hartkodiert und war falsch (siehe dort).
  defenseFactor?: number;
  multiplayerOnly?: boolean;
}

export interface BoosterDefinition {
  id: string;
  name: string;
  desc: string;
  img: string;
  cost: number;
  durationHours: number;
}

export interface BoosterDurationOption {
  hours: number;
  label: string;
  costMultiplier: number;
}

export interface VoucherDefinition {
  id: string;
  label: string;
  img: string;
  type: 'zeitgutschein_bau_schiffe' | 'zeitgutschein_bau_verteidigung' | 'zeitgutschein_bau_gebaeude' | 'zeitgutschein_forschung';
  percent: number;
  cost: number;
  desc: string;
}

export interface ContainerCategoryDef {
  category: 'resources' | 'dm' | 'teile' | 'zeitgutschein' | 'freischiff';
  chance: number;
  rewards: ContainerReward[];
  // Tatsaechliche Auszahlungs-Wahrscheinlichkeit NACH der "genau 2 Treffer"-Normalisierung
  // (server-seitig vorberechnet, siehe computeRealCategoryChances() in economy.ts) - das ist der
  // Wert, der dem Spieler angezeigt werden soll, nicht der rohe `chance`-Einzelwurf.
  realChance: number;
}

export interface ContainerTypeDef {
  name: string;
  tier: string;
  icon: string;
  color: string;
  categories: ContainerCategoryDef[];
}

export interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
}

export interface GameData {
  ships: ShipDefinition[];
  defenses: DefenseDefinition[];
  research: ResearchDefinition[];
  buildings: BuildingDefinition[];
  buildingModules: BuildingModuleDefinition[];
  shipModules: ShipModuleDefinition[];
  defenseModules: DefenseModuleDefinition[];
  maxBuildingSlots: number;
  maxShipModuleSlots: number;
  maxDefenseModuleSlots: number;
  admiralAllowedShipIds: string[];
  galaxySystems: number;
  galaxyPositions: number;
  sektoren: SektorDefinition[];
  sektorConfig: Record<string, SektorConfig>;
  piratenMultiplierRoll: Record<string, (number | [number, number])[]>;
  boosters: BoosterDefinition[];
  boosterDurationOptions: BoosterDurationOption[];
  kampfBoostMultiplier: number;
  noviceBonusMultiplier: number;
  noviceBonusWindowMs: number;
  vouchers: VoucherDefinition[];
  containerTypes: Record<string, ContainerTypeDef>;
  containerJackpotChance: number;
  containerJackpotRewards: Record<string, ContainerReward>;
  tradeValue: Record<string, number>;
  tradeFee: number;
  scrapRefundRate: number;
  teileConvertResources: { metall: number; kristall: number; deuterium: number };
  rapidfire: Record<string, Record<string, number>>;
  zielerfassungBase: Record<string, number>;
  multiTargetVolleyShips: string[];
  precisionModifier: Record<string, number>;
  shieldRegenBaseByClass: Record<string, number>;
  shieldRegenDefaultBase: number;
  evasionBase: Record<string, number>;
  evasionMax: number;
  critChanceBase: Record<string, number>;
  critChanceMax: number;
  critDamageMultiplierByClass: Record<string, number>;
  critDamageDefaultMultiplier: number;
  maxResearchLevel: number;
  parentUnlockLevel: number;
  maxBuildSlots: number;
  maxDefenseSlots: number;
  maxResearchSlots: number;
  shieldRegenMax: number;
  precisionBase: number;
  precisionMaxPlayer: number;
  defenseRepairPercent: number;
  asteroidEscortPowerMin: number;
  asteroidEscortPowerMax: number;
  asteroidEscortKillReward: { metall: number; kristall: number; deuterium: number };
  changelog: ChangelogEntry[];
  playerClasses: ClassDefinition[];
  classChangeCostDm: number;
  economyClasses: EconomyClassDefinition[];
  economyClassChangeCostDm: number;
  galaxyEventTypes: Record<string, GalaxyEventTypeDef>;
  relocateBaseCostDm: number;
  spyProbeTravelMs: number;
  spyProbeFuelCostPerProbe: number;
  piratenCheckCount: number;
  stationBuildings: StationBuildingDefinition[];
  stationBuildingModules: BuildingModuleDefinition[];
  // Ausgleich dafuer, dass die Allianz-Station bewusst NICHT an Forschung/Klasse/Booster eines
  // einzelnen Mitglieds gekoppelt ist (Herleitung an der Konstante in
  // server/src/game/data/stationBuildings.ts). MUSS in jede Ertrags-Anzeige der Station einfliessen.
  stationMiningCompensation?: number;
}

export interface StationBuildingDefinition {
  id: string;
  name: string;
  img: string;
  tier: 1 | 2 | 3;
  kind: 'mine_metall' | 'mine_kristall' | 'mine_deuterium' | 'energie' | 'roboter' | 'nanit';
  baseCost: { metall: number; kristall: number; deuterium: number };
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
  baseOutput?: number;
  baseEnergyUse?: number;
  baseEnergyOutput?: number;
  maxLevel?: number;
}

export interface ClassDefinition {
  id: PlayerClass;
  name: string;
  tagline: string;
  img: string;
  bonuses: { label: string }[];
}

export interface EconomyClassDefinition {
  id: EconomyClass;
  name: string;
  tagline: string;
  img: string;
  bonuses: { label: string }[];
}

export interface AppUser {
  id: number;
  username: string;
  online: boolean;
  isBot: boolean;
}

export interface GroupOperationParticipant {
  userId: number;
  username: string;
  isCreator: boolean;
  status: 'pending' | 'accepted' | 'declined';
  ships: Record<string, number>;
  contributedPower?: number;
  farmed?: { metall: number; kristall: number; deuterium: number };
  teile?: { waffen: number; schild: number; panzerung: number };
  dmFound?: number;
  rendezvousArrivalTime?: number;
}

export interface GroupOperation {
  id: string;
  kind: 'expedition';
  sektorId?: string;
  creatorId: number;
  creatorPosition: GalaxyPosition | null;
  status: 'inviting' | 'departed' | 'resolved' | 'cancelled';
  participants: GroupOperationParticipant[];
  createdAt: number;
  departedAt?: number;
  arriveTime?: number;
  endTime?: number;
  returnTime?: number;
  processedHours?: number;
  totalWins?: number;
  lastTick?: number | null;
  resultMessage?: string;
  resultDetail?: CombatDetail;
  adminChecksElapsed?: number;
  adminNextCheckTime?: number;
  adminAwaitingDecision?: boolean;
}

export interface AllianceMember {
  userId: number;
  username: string;
  status: 'pending' | 'accepted';
  isCreator: boolean;
}

export interface Alliance {
  id: string;
  name: string;
  creatorId: number;
  members: AllianceMember[];
  createdAt: number;
  stationId?: string;
}

export interface Station {
  id: string;
  allianceId: string;
  position: GalaxyPosition;
  tier: 1 | 2 | 3;
  buildings: Record<string, number>;
  buildingModules: Record<string, number>;
  buildQueue: { buildingId?: string; moduleId?: string; startTime: number; endTime: number; userId: number; username: string }[];
  buildLog: { userId: number; username: string; buildingId?: string; moduleId?: string; level: number; completedAt: number }[];
  resources: { metall: number; kristall: number; deuterium: number };
  lastTick: number;
  createdAt: number;
}

export interface SimulationResult {
  runs: number;
  sektorId: string;
  winRate: number;
  retreatRate: number;
  wipeRate: number;
  avgLossPercent: number;
  bestLossPercent: number;
  worstLossPercent: number;
  avgRounds: number;
  avgLossesByShip: { id: string; name: string; sent: number; avgLost: number }[];
  exampleNpcFleet: { id: string; name: string; count: number }[];
}

export interface ActiveRaidInfo {
  targetUserId: number;
  targetUsername: string;
  targetPosition: GalaxyPosition | null;
  raidId: string;
  arrivalTime: number;
  wavesProcessed: number;
  waveCount: number;
  holdingCount: number;
}

export interface DebugBotState {
  username: string;
  playerClass: PlayerClass | null;
  economyClass: EconomyClass | null;
  galaxyPosition: GalaxyPosition | null;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  buildings: Record<string, number>;
  research: Record<string, number>;
  buildQueueLength: number;
  defenseQueueLength: number;
  researchQueueLength: number;
  buildingQueueLength: number;
}

export interface DebugPirateBaseState {
  id: string;
  system: number;
  position: number;
  playerClass: PlayerClass | null;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  buildings: Record<string, number>;
  research: Record<string, number>;
  outgoingAttacks: number;
  nextOffensiveCheck: number | null;
  buildQueueLength: number;
  defenseQueueLength: number;
  researchQueueLength: number;
  buildingQueueLength: number;
}

