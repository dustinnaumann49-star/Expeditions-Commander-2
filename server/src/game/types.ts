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
  speed: number; // Galaxie-Flottengeschwindigkeit (an OGame-Basiswerte angelehnt)
  fuelConsumption: number; // Deuterium pro 1.000 Distanz-Einheiten pro Schiff (Galaxie-Flüge)
  driveType: 'rakete' | 'impuls' | 'hyperraum'; // fuer die Antriebsklassen-Forschungszweige
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

export interface GalaxyPosition {
  system: number; // 1-50
  position: number; // 1-9
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
  arriveTime: number; // Ankunft am Ziel (danach: "haltend")
  recalled: boolean;
  returnTime: number | null; // gesetzt nach Rückruf, Ankunft zu Hause
}

export interface BuildingDefinition {
  id: string;
  name: string;
  img: string;
  lore: string;
  // mine_*: erzeugt Ressourcen (verbraucht Energie). energie: erzeugt Energie fuer die Minen.
  // roboter/nanit: verkuerzen Bauzeiten (Gebaeude staerker, Schiffe/Verteidigung schwaecher).
  kind: 'mine_metall' | 'mine_kristall' | 'mine_deuterium' | 'energie' | 'roboter' | 'nanit';
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
  baseOutput?: number; // Ressourcenertrag/Stunde bei Stufe 1 (nur Minen)
  baseEnergyUse?: number; // Energieverbrauch bei Stufe 1 (nur Minen)
  baseEnergyOutput?: number; // Energieertrag bei Stufe 1 (nur Solarkraftwerk)
}

// Gebaeude-Modulsystem (Baum-Zweige pro Gebaeude, analog zum Forschungsbaum in types.ts
// ResearchDefinition) - jedes Modul verbessert GENAU EINEN Aspekt seines Basis-Gebaeudes
// zusaetzlich, stapelt sich mit der allgemeinen Forschung (Mining-Boost/Bauzeit-Zweige), ersetzt
// sie nicht. Nutzt dasselbe Bild wie sein Basis-Gebaeude (kein eigenes Bild noetig).
export interface BuildingModuleDefinition {
  id: string;
  name: string;
  lore: string;
  buildingId: string; // welches Basis-Gebaeude (Bild-Wiederverwendung + Anzeige-Gruppierung)
  moduleKind: 'output' | 'energy_reduction' | 'buildtime_self' | 'strengthen_factor';
  requiredBuildingLevel: number; // Mindeststufe DES BASIS-GEBAEUDES, um das Modul freizuschalten
  effectPerLevel: number;
  maxLevel: number; // anders als die Basis-Gebaeude (unbegrenzt) haben Module ein festes Limit
  baseCost: ResourceCost;
  costGrowth: number;
  baseTimeSeconds: number;
  timeGrowth: number;
}

// Schiffs-Modulsystem (analog zum Gebaeude-Modulsystem oben, aber pro SCHIFF statt pro Gebaeude -
// jedes der 12 COMBAT_SHIP_IDS-Schiffe plus Imperator bekommt eigene Waffen-/Schild-/Panzerung-/
// Antriebs-Module). Bilder werden von der jeweils passenden Forschung wiederverwendet
// (waffentechnik/schildtechnik/panzerungtechnik/<antriebsart>), kein eigenes Bild noetig. Anders
// als Gebaeude-Module (Mindeststufe des Basis-Gebaeudes) gibt es KEINE Freischalt-Schwelle - die
// hohen Kosten allein wirken als Spaetspiel-Bremse, da Schiffe (anders als Gebaeude) keine
// "Stufe" haben, an der man eine Schwelle festmachen koennte.
export type ShipModuleKind = 'waffen' | 'schild' | 'panzerung' | 'antrieb';

export interface ShipModuleDefinition {
  id: string;
  name: string;
  shipId: string; // welches Basis-Schiff (Bild-Wiederverwendung ueber die passende Forschung + Anzeige-Gruppierung)
  moduleKind: ShipModuleKind;
  img: string; // Forschungs-Bild (siehe data/shipModules.ts fuer die genaue Zuordnung)
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
  // Forschungsbaum (siehe README "Geplante Erweiterungen" -> jetzt umgesetzt): Gruppierung in
  // Hauptbereiche + Eltern-Kind-Voraussetzungen zwischen Technologien.
  mainBranch: 'waffen' | 'verteidigung' | 'antrieb' | 'wirtschaft';
  parentId?: string; // Voraussetzung: parentId muss PARENT_UNLOCK_LEVEL erreicht haben
  driveType?: 'rakete' | 'impuls' | 'hyperraum'; // NUR bei den 3 Antriebsklassen-Zweigen gesetzt
}

export interface BuildJob {
  shipId?: string;
  defId?: string;
  buildingId?: string;
  moduleId?: string; // Gebaeude-Modul (siehe BuildingModuleDefinition) - teilt sich den Slot mit buildingId
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

export interface RaidReinforcement {
  userId: number;
  username: string;
  ships: Record<string, number>;
  arrivalTime: number;
}

export interface RaidState {
  id: string;
  spawnedAt: number;
  pirateBase: GalaxyPosition; // zufaellig gewaehlte Piratenbasis, von der aus dieser Raid startet
  launchTime: number; // spawnedAt + RAID_PREP_MS - wann die Piraten tatsaechlich abheben
  launchNotified: boolean; // ob die "jetzt gestartet"-Nachricht schon verschickt wurde
  arrivalTime: number; // launchTime + Flugzeit - Beginn der Wellen-Phase (siehe waveTimes unten)
  reinforcements: RaidReinforcement[];
  // Wellensystem (siehe README/economy.ts RAID_WAVE_COUNT): waveTimes wird EINMALIG bei
  // spawnRaidAt() geplant (RAID_WAVE_COUNT Zeitpunkte, ungefaehr gleich verteilt innerhalb von
  // RAID_ASSAULT_DURATION_MS nach arrivalTime). wavesProcessed zaehlt abgearbeitete Wellen
  // (0..RAID_WAVE_COUNT), wavesWon davon erfolgreich abgewehrte (fuer die Abschluss-Belohnung).
  // accumulatedDestroyed summiert vernichtete Feinde ueber ALLE Wellen (eine gemeinsame
  // Bergungs-DM-Berechnung am Ende statt pro Welle). Der Raid wird geloescht (state.raid = null),
  // sobald wavesProcessed RAID_WAVE_COUNT erreicht - kein separates "resolved"-Flag mehr noetig.
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
  // Rendezvous (Elite-Bollwerk-Expeditionen): wann diese Teilnehmer-Flotte beim ERSTELLER
  // eintrifft - erst danach kann die gesamte Gruppe gemeinsam weiter zum Ziel starten. Beim
  // Ersteller selbst nicht gesetzt (ist ja schon an seiner eigenen Position).
  rendezvousArrivalTime?: number;
}

export interface GroupOperation {
  id: string;
  kind: 'expedition'; // 'event' (Notruf) komplett entfernt - Multiplayer-Notruf war nie erreichbar (siehe groupOps.ts)
  sektorId?: string;
  creatorId: number;
  // Position des Erstellers zum Zeitpunkt der Erstellung - Einladungsempfaenger nutzen das fuer
  // die Rendezvous-Flugzeit-Vorschau (siehe /game/galaxy/preview), bevor sie ihre Flotte
  // committen. Wird bewusst einmalig eingefroren statt live nachgeschlagen, damit die Vorschau
  // konsistent bleibt, selbst falls (aktuell theoretisch, da Positionen fix sind) sich etwas
  // aendern wuerde.
  creatorPosition: GalaxyPosition | null;
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
  // ===== Boss-Gefecht Piratenadmiral (Sektor P10, siehe README Punkt 76) =====
  // Eigenstaendiger Ablauf, NICHT das arriveTime/endTime/returnTime-Zeitfenster-Modell des
  // Elite-Bollwerks wiederverwendet: 10-Minuten-Checks statt Stunden-Checks, mit einer
  // Rueckzugs-Entscheidung nach jedem gewonnenen Check statt eines simplen Durchhalte-Timers.
  adminChecksElapsed?: number; // wie viele der max. ADMIRAL_TOTAL_CHECKS bereits abgehandelt wurden
  adminNextCheckTime?: number; // wann der naechste 10-Minuten-Check faellig ist (nur relevant, wenn NICHT awaitingDecision)
  adminAwaitingDecision?: boolean; // true direkt nach einem gewonnenen Check - pausiert weitere Checks, bis der Ersteller entscheidet
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
  captainsDefeated: number;
  enemiesDestroyed: number;
  ownShipsLost: number;
  resourcesLooted: number; // Summe aus Metall+Kristall+Deuterium ueber alle Quellen
  containersOpened: { silber: number; gold: number; elite: number };
  researchCompleted: number;
  shipsBuilt: number;
}

// Klassensystem: jeder Spieler waehlt einmalig eine Klasse (kostenlos), kann sie danach jederzeit
// gegen CLASS_CHANGE_COST_DM wechseln (siehe data/classes.ts, classActions.ts). null = noch keine
// Wahl getroffen - Client blockiert in diesem Fall den normalen Spielzugang (siehe App.tsx) und
// zeigt stattdessen die Klassenwahl, bis eine Klasse gesetzt ist. Gilt auch fuer Bestandsspieler
// (Migration in state.ts setzt fehlende playerClass-Felder auf null statt auf eine Standardklasse
// zu raten).
export type PlayerClass = 'kanonier' | 'bollwerk' | 'kommandant';

export interface PlayerState {
  userId: number;
  playerClass: PlayerClass | null;
  resources: { metall: number; kristall: number; deuterium: number; dm: number };
  fleet: Record<string, number>;
  defense: Record<string, number>;
  research: Record<string, number>;
  buildQueue: BuildJob[];
  defenseQueue: BuildJob[];
  researchQueue: ResearchJob[];
  buildings: Record<string, number>;
  buildingModules: Record<string, number>; // moduleId -> Stufe (siehe BuildingModuleDefinition)
  // Gebaeude teilen sich EINEN globalen Bauslot (anders als Schiffe/Verteidigung) - siehe README.
  // Immer hoechstens ein Eintrag, aber als Array modelliert, damit sich BuildQueue.tsx (Lane-
  // Komponente, maxSlots=1) unveraendert wiederverwenden laesst.
  buildingQueue: BuildJob[];
  shipModules: Record<string, number>; // moduleId -> Stufe (siehe ShipModuleDefinition)
  // Schiffs-Module teilen sich EINEN globalen Bauslot (analog zu Gebaeuden oben, unabhaengig von
  // den 3 normalen Schiffs-Bauplaetzen in buildQueue) - immer hoechstens ein Eintrag, aber als
  // Array modelliert, damit sich BuildQueue.tsx unveraendert wiederverwenden laesst.
  shipModuleQueue: BuildJob[];
  galaxyPosition: GalaxyPosition | null;
  galaxyDeployments: GalaxyDeployment[]; // eigene, laufend "haltende"/unterwegs befindliche Flotten
  activeBoosters: Record<string, number>;
  teile: { waffen: number; schild: number; panzerung: number };
  missions: Mission[];
  messages: GameMessage[];
  inventory: InventoryEntry[];
  presets: FleetPreset[];
  raid: RaidState | null;
  nextRaidCheck: number;
  raidScheduleMigrated?: boolean; // Einmal-Migrationsflag, siehe state.ts loadPlayerState()
  lastUpdate: number;
  stats: PlayerStats;
}
