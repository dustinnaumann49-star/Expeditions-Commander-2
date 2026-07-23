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

// ===== Galaxie-Ereignisse (Wrack/Handelskonvoi) =====
// Global, nicht an einen Nutzer gebunden (eigene DB-Tabelle galaxy_events, siehe db.ts) - taucht
// zufaellig an einer freien Galaxie-Position auf, verschwindet nach GALAXY_EVENT_LIFETIME_MS
// wieder, falls niemand es vorher beansprucht. `claimedBy` wird gesetzt, sobald eine Flotte dort
// ankommt UND das Ereignis noch nicht vergeben war (Details siehe game/galaxyEvents.ts) - das
// Ereignis wird danach sofort geloescht, damit es fuer alle anderen nicht mehr sichtbar ist.
export interface GalaxyEvent {
  id: string;
  type: string; // Schluessel in GALAXY_EVENT_TYPES (economy.ts), z.B. 'wrack' | 'konvoi'
  system: number;
  position: number;
  spawnedAt: number;
  expiresAt: number;
  claimedBy: number | null;
}

export interface GalaxyEventReward {
  metall: number;
  kristall: number;
  deuterium: number;
  dm: number;
}

// Eigener, einfacher Rundflug (Hin- und automatischer Rueckflug OHNE manuellen Rueckruf, anders
// als "Halten" in GalaxyDeployment) - die Beute wird erst bei RUECKKEHR gutgeschrieben (nicht bei
// Ankunft), analog zu Mission.farmed/finalizeMission in missions.ts.
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
  collected: boolean; // true, sobald Ankunft verarbeitet wurde (auch wenn das Ereignis schon vergriffen war)
  reward: GalaxyEventReward | null; // null, falls beim Eintreffen bereits vergriffen
}

// ===== Piratenbasen (angreifbar) =====
// Global, nicht an einen Nutzer/die `users`-Tabelle gebunden (eigene DB-Tabelle pirate_bases,
// siehe db.ts/pirateBaseState.ts). Nutzerentscheidung Juli 2026 ("Piraten sollen genau wie
// Spieler wachsen - Gebaeude bauen, forschen, Asteroiden fliegen, Schiffe/Verteidigung bauen,
// ohne Begrenzung"): `state` ist ein VOLLWERTIGER PlayerState, angetrieben von exakt derselben
// Wirtschafts-Logik wie ein KI-Mitspieler (`runEconomyBotTurn()` in economyBotTurn.ts,
// `runEconomyTick()` in actions.ts) - KEINE kuenstlichen Obergrenzen mehr, Wachstum ist nur durch
// dieselben wirtschaftlichen Grenzen begrenzt wie bei einem echten Spieler (Energie, Bauslots,
// Ressourcenertrag). `state.userId` ist eine SYNTHETISCHE, garantiert negative Id (siehe
// PIRATE_BASE_SYNTHETIC_USER_ID_OFFSET in pirateBaseState.ts) - kollidiert nie mit echten
// (autoinkrementierten, positiven) Nutzer-Ids, taucht NIE in `users`/listAllUsers() auf und damit
// auch nie in der Bestenliste/Multiplayer-Einladungen/Halten-Listen. Bewusst weiterhin NICHT
// zerstoerbar (Nutzerentscheidung) - kann aber jetzt beliebig stark werden statt nur langsam
// gedeckelt nachzuwachsen.
export interface PirateBaseState {
  id: string; // Index-Id aus PIRATE_BASE_IDS (galaxyConstants.ts)
  system: number;
  position: number;
  state: PlayerState;
}

// Ein-Weg-Angriffsflug (Hin, EIN Kampf bei Ankunft, automatischer Rueckflug) gegen eine
// PirateBaseState - strukturell wie GalaxyEventTrip oben, aber mit echtem Kampf statt reiner
// Beute-Abholung. `resolved` wird bei Ankunft gesetzt (Kampf ist dann bereits verarbeitet und im
// Nachrichtenverlauf verschickt), unabhaengig vom Rueckflug - Ueberlebende kehren erst bei
// `returnTime` tatsaechlich in state.fleet zurueck (siehe processPirateAttacks() in
// pirateBaseState.ts).
export interface PirateAttackDeployment {
  id: string;
  baseId: string;
  ships: Record<string, number>; // wird bei Ankunft auf die Ueberlebenden reduziert
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  returnTime: number;
  resolved: boolean;
}

// ===== Aussenposten (kontestierte Galaxie-Knoten, siehe outposts.ts) =====
// Global, nicht an einen Nutzer gebunden (eigene DB-Tabelle outposts, siehe db.ts) - feste
// Position (OUTPOST_POSITIONS in galaxyConstants.ts), startet piraten-eigen mit einer bei jedem
// Kampf frisch gewuerfelten NPC-Garnison (kein State-Tracking noetig, solange piraten-eigen).
// Sobald spieler-eigen: `garrison` ist eine ECHTE, dauerhaft gespeicherte Schiffsliste (gemeinsamer
// Pool aller Menschen+Bots der Spielerseite, Nutzerentscheidung - jeder darf verstaerken/zurueckrufen).
export type OutpostTier = 'niedrig' | 'mittel' | 'hoch';
export interface OutpostState {
  id: string; // 'op_0'..'op_5' (Index aus OUTPOST_POSITIONS)
  system: number;
  position: number;
  tier: OutpostTier;
  ownerSide: 'pirates' | 'players';
  garrison: Record<string, number>; // nur relevant wenn ownerSide === 'players'
  ownerSince: number | null;
}

// Ein-Weg-Flug zu einem Aussenposten - 'attack' kaempft bei Ankunft gegen die aktuelle Garnison
// (Erfolg = Eroberung UND Erst-Garnisonierung in einem Schritt, Ueberlebende bei Niederlage kehren
// automatisch heim, siehe processOutpostDeployments()), 'reinforce' fliegt ohne Kampf direkt in die
// Garnison eines bereits spieler-eigenen Postens (kein Rueckflug - Schiffe bleiben dort, bis
// irgendwer sie per recallOutpostGarrison() zurueckruft).
export interface OutpostDeployment {
  id: string;
  outpostId: string;
  kind: 'attack' | 'reinforce';
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  targetSystem: number;
  targetPosition: number;
  startTime: number;
  arriveTime: number;
  returnTime: number | null; // nur bei 'attack' + Niederlage gesetzt (Ueberlebende kehren heim)
  resolved: boolean;
}

// Spionageflug (siehe spyMissions.ts) - strukturell identisch zu PirateAttackDeployment, aber statt
// Kampf wird bei Ankunft nur ein Bericht erzeugt (Detailgrad nach state.research.spionage), die
// Sonde selbst nimmt nie Schaden. arriveTime/returnTime nutzen IMMER SPY_PROBE_TRAVEL_MS statt der
// normalen distanzbasierten Flugzeit (siehe galaxyConstants.ts).
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

// Analog zu ShipModuleDefinition, aber pro VERTEIDIGUNGSANLAGE und OHNE Antrieb (Verteidigung
// bewegt sich nicht). Lebt bewusst in DERSELBEN Level-Map wie Schiffs-Module
// (PlayerState.shipModules, trotz des Namens - siehe data/defenseModules.ts) statt einer eigenen
// zweiten Map, damit die Kampf-Anbindung (getEffectiveStats() in combat.ts) nicht zwei separate
// Parameter durch den kompletten Kampf-Pfad durchreichen muss - eigene ID-Namensraeume
// (Schiffs-IDs vs. Verteidigungs-IDs) schliessen Kollisionen aus. Nur die Bau-Warteschlange
// (defenseModuleQueue) ist eine eigene, von shipModuleQueue getrennte Schlange/Slot.
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
  // Nur fuer Asteroiden-Felder (siehe ASTEROID_RICH_FIND_CHANCE in economy.ts): gesammelte Treffer
  // der stuendlichen "reicher Fund"-Chance, die den bis dahin akkumulierten Ertrag verdoppelt hat.
  // Analog zu skirmishLog erst im Abschlussbericht bei Rueckkehr zugestellt statt als
  // Zwischen-Nachricht.
  richFindLog?: RichFindEntry[];
}

export interface RichFindEntry {
  hour: number;
  bonus: { metall: number; kristall: number; deuterium: number };
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
  // Nur bei Raids (siehe RaidState.waveLog in raids.ts): der komplette Wellen-Verlauf als
  // aufklappbare Unterabschnitte, gesammelt statt pro Welle einzeln verschickt - analog zu
  // FarmDetail.skirmishes bei Piraten-Sektor-/Asteroiden-Missionen. Bei anderen Kampfberichten
  // (Elite-Bollwerk, Piratenadmiral, einzelne Piraten-Sektor-Skirmishes) bleibt das Top-Level
  // npcResults/playerResults-Paar wie bisher der EINZIGE Inhalt, hier unbenutzt.
  skirmishes?: SkirmishSummary[];
}

export interface FarmDetail {
  sektorName: string;
  resources: { metall: number; kristall: number; deuterium: number };
  dm: number;
  teile: { waffen: number; schild: number; panzerung: number };
  fleetReturned?: Record<string, number>;
  skirmishes?: SkirmishSummary[];
  richFinds?: RichFindEntry[];
}

// Strukturierter Spionagebericht (siehe spyMissions.ts buildSpyReport()) - separat von FarmDetail,
// da die Discriminator-Erkennung im Client (isFarmDetail() in Nachrichten.tsx) sonst auf ein
// gemeinsames Feld angewiesen waere. `low`/`high` sind bei `exact:true` (Spionage-Stufe >= 10 ODER
// Stufe 0, wo ueberhaupt nichts erfasst wurde) identisch - der Client zeigt dann nur EINEN Wert
// statt eines Bereichs.
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
  // Optionaler Direktsprung zu einer Galaxie-Position (z.B. "Piraten haben dich ausspioniert von
  // Basis X" - siehe pushMessage() in messages.ts) - unabhaengig von `detail`, da nicht jede
  // Nachricht mit Koordinatenbezug in eines der bestehenden Detail-Formate passt.
  galaxyLink?: { system: number; position: number };
}

export interface Container {
  id: string;
  tier: ContainerTier;
  count: number; // Anzahl ungeoeffneter Container dieser Stufe (Stapel statt Einzeleintraege)
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
  // Kombinierte Macht (70% Flotte/30% Verteidigung) der ERSTEN Welle - Referenz fuer den
  // Flottengroessen-Belohnungsbonus auf die Bergungs-DM (siehe resolveOneWave()/finalizeRaidWaves()
  // in raids.ts), bleibt ueber alle Wellen stabil statt durch Verluste zu schwanken.
  initialCombinedPower?: number;
  // Nutzerentscheidung (Juli 2026): jede Welle wird hier gesammelt statt sofort als eigene
  // Nachricht verschickt (analog zu Mission.skirmishLog) - EIN gemeinsamer Abschlussbericht bei
  // Raid-Ende statt bis zu 5 Einzel-Nachrichten pro Beteiligtem (Verteidiger, Verstaerker,
  // haltende Flotten - siehe finalizeRaidWaves() in raids.ts, dieselbe waveLog-Referenz landet in
  // JEDES Beteiligten CombatDetail.skirmishes). `hour` in jedem SkirmishSummary-Eintrag traegt
  // hier die WELLEN-Nummer (1..RAID_WAVE_COUNT), kein echter Stunden-Bezug.
  waveLog: SkirmishSummary[];
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
  // Aufschluesselung von enemiesDestroyed nach Schiffs-/Verteidigungs-/Boss-Id (Nutzerentscheidung
  // Juli 2026: Punkte sollen nach Wert des vernichteten Gegners gestaffelt sein statt pauschal 1
  // Punkt pro Einheit) - `enemiesDestroyed` selbst bleibt als reiner Rohzaehler unveraendert
  // (Statistik-Anzeige "Feinde vernichtet"), die Gewichtung passiert erst in stats.ts
  // calculatePoints() ueber getUnitPointValue() - so bleibt das Prinzip "Punkte nie direkt
  // speichern, nur aus Rohwerten berechnen" gewahrt und spaetere Wertanpassungen wirken
  // rueckwirkend auf bestehende Spielstaende.
  enemiesDestroyedByType: Record<string, number>;
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

// Wirtschafts-Klasse (Nutzerentscheidung Juli 2026): eine ZWEITE, komplett unabhaengige Klassenwahl
// neben der Kampf-Klasse (PlayerClass) - rein wirtschaftliche Boni (Handel/Bauzeit/Foerderung),
// ruehrt NIE an Waffen/Schild/Panzerung. Anders als die Kampf-Klasse NICHT bei Registrierung
// erzwungen (bleibt `null` bis freiwillig gewaehlt) und JEDE Wahl/jeder Wechsel kostet
// ECONOMY_CLASS_CHANGE_COST_DM (auch die allererste Wahl, anders als bei PlayerClass wo nur der
// Wechsel kostet) - siehe setEconomyClass() in classActions.ts.
export type EconomyClass = 'schmuggler' | 'ingenieur' | 'prospektor';

export interface PlayerState {
  userId: number;
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
  buildingModules: Record<string, number>; // moduleId -> Stufe (siehe BuildingModuleDefinition)
  // Gebaeude teilen sich EINEN globalen Bauslot (anders als Schiffe/Verteidigung) - siehe README.
  // Immer hoechstens ein Eintrag, aber als Array modelliert, damit sich BuildQueue.tsx (Lane-
  // Komponente, maxSlots=1) unveraendert wiederverwenden laesst.
  buildingQueue: BuildJob[];
  shipModules: Record<string, number>; // moduleId -> Stufe (ShipModuleDefinition UND DefenseModuleDefinition - siehe DefenseModuleDefinition-Kommentar in types.ts)
  // Schiffs-Module teilen sich EINEN globalen Bauslot (analog zu Gebaeuden oben, unabhaengig von
  // den 3 normalen Schiffs-Bauplaetzen in buildQueue) - immer hoechstens ein Eintrag, aber als
  // Array modelliert, damit sich BuildQueue.tsx unveraendert wiederverwenden laesst.
  shipModuleQueue: BuildJob[];
  // Verteidigungs-Module bekommen einen EIGENEN Bauslot (getrennt von shipModuleQueue) - Stufen
  // landen aber in derselben shipModules-Map (siehe DefenseModuleDefinition-Kommentar).
  defenseModuleQueue: BuildJob[];
  galaxyPosition: GalaxyPosition | null;
  galaxyDeployments: GalaxyDeployment[]; // eigene, laufend "haltende"/unterwegs befindliche Flotten
  eventTrips: GalaxyEventTrip[]; // eigene, laufend zu Galaxie-Ereignissen unterwegs befindliche Flotten
  pirateAttacks: PirateAttackDeployment[]; // eigene, laufend gegen Piratenbasen unterwegs befindliche Angriffsfluege
  outpostDeployments: OutpostDeployment[]; // eigene, laufend gegen/zu Aussenposten unterwegs befindliche Fluege
  spyMissions: SpyMissionDeployment[]; // eigene, laufend gegen Piratenbasen unterwegs befindliche Spionagefluege
  nextPirateSpyCheck: number; // naechster faelliger Checkpoint fuer "Piraten spionieren mich aus" (siehe spyMissions.ts)
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
