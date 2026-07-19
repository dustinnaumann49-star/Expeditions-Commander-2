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

export interface FarmDetail {
  sektorName: string;
  resources: { metall: number; kristall: number; deuterium: number };
  dm: number;
  teile: { waffen: number; schild: number; panzerung: number };
  fleetReturned?: Record<string, number>;
  skirmishes?: SkirmishSummary[];
}

export interface GameMessage {
  id: string;
  type: 'kampf' | 'farm';
  time: number;
  text: string;
  detail: CombatDetail | FarmDetail | null;
}

export interface Container {
  id: string;
  tier: 'silber' | 'gold' | 'elite';
  receivedAt: number;
}

export interface ContainerReward {
  type: 'resources' | 'dm' | 'teile' | 'zeitgutschein_bau' | 'zeitgutschein_forschung' | 'freischiff';
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
  resolved: boolean;
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
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  points: number;
  stats: PlayerStats;
}

export interface PlayerState {
  userId: number;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  research: Record<string, number>;
  buildQueue: BuildJob[];
  defenseQueue: BuildJob[];
  researchQueue: ResearchJob[];
  buildings: Record<string, number>;
  buildingModules: Record<string, number>;
  buildingQueue: BuildJob[];
  galaxyPosition: GalaxyPosition | null;
  galaxyDeployments: GalaxyDeployment[];
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
  multiplayerOnly?: boolean;
  resourceCapOverTime?: { metall: number; kristall: number; deuterium: number };
}

export interface BoosterDefinition {
  id: string;
  name: string;
  desc: string;
  img: string;
  cost: number;
  durationHours: number;
}

export interface VoucherDefinition {
  id: string;
  label: string;
  img: string;
  type: 'zeitgutschein_bau' | 'zeitgutschein_forschung';
  percent: number;
  cost: number;
  desc: string;
}

export interface ContainerTypeDef {
  name: string;
  tier: string;
  icon: string;
  color: string;
  pickCount: number;
  rewards: ContainerReward[];
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
  maxBuildingSlots: number;
  admiralAllowedShipIds: string[];
  galaxySystems: number;
  galaxyPositions: number;
  sektoren: SektorDefinition[];
  sektorConfig: Record<string, SektorConfig>;
  piratenMultiplierRoll: Record<string, number[]>;
  boosters: BoosterDefinition[];
  vouchers: VoucherDefinition[];
  containerTypes: Record<string, ContainerTypeDef>;
  tradeValue: Record<string, number>;
  tradeFee: number;
  scrapRefundRate: number;
  rapidfire: Record<string, Record<string, number>>;
  zielerfassungBase: Record<string, number>;
  multiTargetVolleyShips: string[];
  precisionModifier: Record<string, number>;
  shieldRegenModifier: Record<string, number>;
  evasionBase: Record<string, number>;
  evasionMax: number;
  critChanceBase: Record<string, number>;
  critChanceMax: number;
  critDamageMultiplier: number;
  maxResearchLevel: number;
  parentUnlockLevel: number;
  maxBuildSlots: number;
  maxDefenseSlots: number;
  maxResearchSlots: number;
  shieldRegenBase: number;
  shieldRegenMax: number;
  precisionBase: number;
  precisionMaxPlayer: number;
  defenseRepairPercent: number;
  asteroidEscortPowerMin: number;
  asteroidEscortPowerMax: number;
  asteroidEscortKillReward: { metall: number; kristall: number; deuterium: number };
  changelog: ChangelogEntry[];
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
  lastTick?: number | null;
  resultMessage?: string;
  resultDetail?: CombatDetail;
  adminChecksElapsed?: number;
  adminNextCheckTime?: number;
  adminAwaitingDecision?: boolean;
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
  holdingCount: number;
}
