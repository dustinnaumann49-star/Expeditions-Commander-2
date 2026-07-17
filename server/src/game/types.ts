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

export interface SkirmishSummary {
  hour: number;
  outcome: string;
  roundsFought: number;
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  rewards?: RewardSummary;
  replay?: CombatReplay;
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
  // Anzahl aufeinanderfolgender Stunden-Checks mit mindestens einem vernichteten Gegner, seit dem
  // letzten Check ohne Vernichtung - treibt die Belohnungs-Eskalation an (siehe
  // getEscalationMultiplier() in missions.ts). Bricht auf 0 zurueck, sobald ein Check ohne
  // vernichteten Gegner endet.
  streakWins?: number;
  // Nur fuer Asteroiden-Eskorte: gesammelte Stunden-Kaempfe. Werden NICHT sofort als eigene
  // Nachricht verschickt, sondern erst gesammelt am Ende der Mission (Rueckkehr oder Abbruch) als
  // EIN gemeinsamer Bericht zugestellt - sonst wuerden bei mehreren gleichzeitig laufenden
  // Asteroiden-Missionen die Nachrichten schnell ueberfuellen (bis zu 4 Zwischenberichte pro
  // Mission, ohne dass der Spieler zwischendurch etwas tun kann).
  skirmishLog?: SkirmishSummary[];
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
  ownerUsername?: string; // bei Multiplayer-Kaempfen: welchem Spieler dieser Flotten-Eintrag gehoert
}

export interface RewardSummary {
  metall?: number;
  kristall?: number;
  deuterium?: number;
  dm?: number;
  teileWaffen?: number;
  teileSchild?: number;
  teilePanzerung?: number;
  containerTier?: ContainerTier;
  stolenMetall?: number;
  stolenKristall?: number;
  stolenDeuterium?: number;
}

// Kompakter Rundenverlauf fuer die Kampf-Visualisierung: bewusst als Zahlen-Arrays statt Objekte
// mit Schluesseln, weil das ~4x weniger Speicher braucht (gemessen: 1,4 KB statt 6,1 KB pro Kampf).
// `typesA`/`typesB` geben die Reihenfolge vor, `roundsA[i]`/`roundsB[i]` sind die Ueberlebenden je
// Typ nach Runde i. Bei langen Kaempfen wird abgetastet (max. MAX_SNAPSHOTS Eintraege), damit die
// Datenmenge auch bei 100 Runden begrenzt bleibt.
export interface CombatReplay {
  typesA: string[];
  typesB: string[];
  roundsA: number[][];
  roundsB: number[][];
  totalRounds: number;
}

// Container-Stufe: 'elite' ist die neue Top-Stufe ueber Gold (siehe README) - exklusiv fuer
// Elite-Bollwerk-Abschluss und Piratenkapitaen-Kills in den schwersten Piraten-Sektoren.
export type ContainerTier = 'silber' | 'gold' | 'elite';

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
  tier: ContainerTier;
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

export interface RaidReinforcement {
  userId: number;
  username: string;
  ships: Record<string, number>;
  arrivalTime: number;
}

export interface RaidState {
  id: string;
  spawnedAt: number;
  arrivalTime: number;
  resolved: boolean;
  reinforcements: RaidReinforcement[];
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

export interface GroupOperationParticipant {
  userId: number;
  username: string;
  isCreator: boolean;
  status: 'pending' | 'accepted' | 'declined';
  ships: Record<string, number>;
  contributedPower?: number; // nur noch informativ (Anzeige), fliesst NICHT mehr in eine Beute-Aufteilung ein
  // Eigener Ertrag dieses Teilnehmers - wird NIE zwischen Teilnehmern aufgeteilt, jeder bekommt
  // exakt das, was er auch bei einem Solo-Flug bekommen haette.
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
  lastTick?: number | null; // steuert nur das Timing des Zeit-basierten Ressourcen-Zuwachses (Elite-Sektor)
  // Wellen-Ausreisser und Kampf-Modifikatoren (siehe combat.ts/combatConstants.ts) sind beim
  // Elite-Bollwerk auf maximal 1x pro GESAMTER Expedition gedeckelt, nicht pro Einzel-Check -
  // sonst wuerde sich das Risiko ueber die 4 Stunden-Checks unfair aufsummieren. Wird beim ersten
  // Zutreffen (egal ob Ausreisser oder Modifikator) auf true gesetzt.
  eliteSurpriseUsed?: boolean;
  // Analog zu Mission.streakWins (missions.ts), aber fuer die gesamte Elite-Bollwerk-Expedition -
  // treibt die Verdopplungs-Eskalation der Belohnungen an (siehe getEscalationMultiplier()).
  streakWins?: number;
  resultMessage?: string;
  resultDetail?: CombatDetail;
}

// Kumulative Statistik ueber die gesamte Spieler-Historie - Grundlage fuer die Statistik-Seite
// und die Bestenliste (siehe stats.ts). Wird an mehreren Stellen inkrementiert (missions.ts,
// raids.ts, events.ts, groupOps.ts, actions.ts) - NIE direkt Punkte speichern, nur Rohwerte,
// damit sich die Punkte-Gewichtung (POINT_WEIGHTS in stats.ts) spaeter aendern laesst, ohne
// bestehende Spielstaende migrieren zu muessen.
export interface PlayerStats {
  missionsNiedrig: number;
  missionsMittel: number;
  missionsHoch: number;
  asteroidMissions: number;
  eliteBollwerkChecks: number; // erfolgreiche Stunden-Checks (nicht ganze Expeditionen)
  raidsRepelledFull: number;
  raidsRepelledPartial: number;
  notrufCompleted: number;
  captainsDefeated: number;
  enemiesDestroyed: number;
  ownShipsLost: number;
  resourcesLooted: number; // Summe aus Metall+Kristall+Deuterium ueber alle Quellen
  containersOpened: { silber: number; gold: number; elite: number };
  researchCompleted: number;
  shipsBuilt: number;
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
  stats: PlayerStats;
}
