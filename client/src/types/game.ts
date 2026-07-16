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
}

export interface BuildJob {
  shipId?: string;
  defId?: string;
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
  containerTier?: 'silber' | 'gold';
  stolenMetall?: number;
  stolenKristall?: number;
  stolenDeuterium?: number;
}

export interface CombatDetail {
  sektorName: string;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  allyResult?: CombatUnitResult;
  rewards?: RewardSummary;
}

export interface SkirmishSummary {
  hour: number;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  rewards?: RewardSummary;
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
  tier: 'silber' | 'gold';
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
  arrivalTime: number;
  resolved: boolean;
}

export interface EventState {
  id: string;
  name: string;
  spawnedAt: number;
  deadline: number;
  started: boolean;
}

export interface FleetPreset {
  id: string;
  name: string;
  ships: Record<string, number>;
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
  activeBoosters: Record<string, number>;
  teile: { waffen: number; schild: number; panzerung: number };
  missions: Mission[];
  messages: GameMessage[];
  inventory: InventoryEntry[];
  presets: FleetPreset[];
  raid: RaidState | null;
  nextRaidCheck: number;
  event: EventState | null;
  nextEventCheck: number;
  lastUpdate: number;
  serverTime?: number;
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
  captainContainerTier?: 'silber' | 'gold';
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

export interface GameData {
  ships: ShipDefinition[];
  defenses: DefenseDefinition[];
  research: ResearchDefinition[];
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
  maxResearchLevel: number;
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
}

export interface AppUser {
  id: number;
  username: string;
  online: boolean;
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
}

export interface GroupOperation {
  id: string;
  kind: 'expedition' | 'event';
  sektorId?: string;
  eventName?: string;
  creatorId: number;
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
  raidId: string;
  arrivalTime: number;
  reinforcementCount: number;
}
