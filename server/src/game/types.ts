// ========== ZENTRALE SPIEL-TYPEN ==========
// Diese Typen bilden die Datenstruktur des Spiels ab (Schiffe, Verteidigung, Forschung, Zustand).
// Sie sind bewusst nah an der ursprünglichen HTML-Prototyp-Struktur gehalten, damit die Portierung
// der restlichen Spiellogik (Missionen, Events, Raids) später 1:1 nachvollziehbar bleibt.

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
  buildTime: number; // Sekunden pro Stück (Basiswert, vor Forschungs-Multiplikator)
  cost?: ResourceCost;
  stats: CombatStats;
  maxCount?: number; // fehlt = unbegrenzt (z.B. Mining-Schiff, Begleitschiff)
  unique?: boolean; // z.B. Sandronator: max. 1 Exemplar
  specialOnly?: boolean; // z.B. Imperator: nicht über normale Ressourcen baubar
  teileCost?: { waffen: number; schild: number; panzerung: number };
  miningPerHour?: number;
}

export interface DefenseDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  buildTime: number;
  cost: ResourceCost;
  stats: CombatStats;
  maxCount?: number; // fehlt = unbegrenzt (nur noch Schildkuppeln haben ein Limit)
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
}

export interface CombatDetail {
  sektorName: string;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  allyResult?: CombatUnitResult;
}

export interface GameMessage {
  id: string;
  type: 'kampf' | 'farm';
  time: number;
  text: string;
  detail: CombatDetail | null;
}

export interface Container {
  id: string;
  tier: 'silber' | 'gold';
  receivedAt: number;
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
}
