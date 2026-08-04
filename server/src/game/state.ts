import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { BUILDINGS } from './data/buildings.js';
import { BUILDING_MODULES } from './data/buildingModules.js';
import { SHIP_MODULES } from './data/shipModules.js';
import { DEFENSE_MODULES } from './data/defenseModules.js';
import { GALAXY_SYSTEMS, GALAXY_POSITIONS, PIRATE_SPY_CHECK_INTERVAL_MS } from './data/galaxyConstants.js';
import { nextWeeklyCheckpoint, RAID_FALLBACK_SCHEDULE, RAID_SCHEDULE_BY_USERNAME } from './data/economy.js';
import type { GalaxyPosition, PlayerState } from './types.js';
import { loadGameStateJson, saveGameStateJson, listAllUsers, getUserById } from '../db.js';

// Zufaellige, freie Galaxie-Position vergeben (siehe README). Scannt dafuer die bereits
// gespeicherten Zustaende ALLER anderen Spieler direkt ueber loadGameStateJson (NICHT ueber
// loadPlayerState/galaxy.ts) - sonst entstuende ein Zirkelbezug state.ts <-> galaxy.ts, da
// galaxy.ts seinerseits loadPlayerState() aus dieser Datei braucht.
function assignRandomGalaxyPosition(excludeUserId?: number): GalaxyPosition {
  const occupied = new Set<string>();
  listAllUsers().forEach((u) => {
    if (u.id === excludeUserId) return;
    const json = loadGameStateJson(u.id);
    if (!json) return;
    try {
      const parsed = JSON.parse(json) as { galaxyPosition?: GalaxyPosition | null };
      if (parsed.galaxyPosition) occupied.add(`${parsed.galaxyPosition.system}:${parsed.galaxyPosition.position}`);
    } catch {
      // Kaputter/leerer Eintrag - einfach ignorieren, blockiert keine Position.
    }
  });

  const free: GalaxyPosition[] = [];
  for (let system = 1; system <= GALAXY_SYSTEMS; system++) {
    for (let position = 1; position <= GALAXY_POSITIONS; position++) {
      if (!occupied.has(`${system}:${position}`)) free.push({ system, position });
    }
  }
  if (free.length === 0) {
    // Galaxie voll (450/450) - bei der aktuellen Spielerzahl praktisch ausgeschlossen, aber
    // sauberer Fallback statt Absturz.
    return { system: 1, position: 1 };
  }
  return free[Math.floor(Math.random() * free.length)];
}

// Einzelne Spieler bekommen per Nutzername einen fest zugewiesenen woechentlichen Raid-Termin
// (siehe RAID_SCHEDULE_BY_USERNAME in economy.ts, ausfuehrlich dort kommentiert).
function raidScheduleForUser(userId: number) {
  const user = getUserById(userId);
  return (user && RAID_SCHEDULE_BY_USERNAME[user.username]) || RAID_FALLBACK_SCHEDULE;
}

export function defaultPlayerState(userId: number): PlayerState {
  const fleet: Record<string, number> = {};
  SHIPS.forEach((s) => (fleet[s.id] = 0));
  const defense: Record<string, number> = {};
  DEFENSES.forEach((d) => (defense[d.id] = 0));
  const buildings: Record<string, number> = {};
  BUILDINGS.forEach((b) => (buildings[b.id] = 0));
  const buildingModules: Record<string, number> = {};
  BUILDING_MODULES.forEach((m) => (buildingModules[m.id] = 0));
  const shipModules: Record<string, number> = {};
  SHIP_MODULES.forEach((m) => (shipModules[m.id] = 0));
  DEFENSE_MODULES.forEach((m) => (shipModules[m.id] = 0));

  return {
    userId,
    playerClass: null,
    economyClass: null,
    // Bewusst grosszuegig bemessen: reicht fuer eine komplette Mining-Flotte (700) + Begleitschutz (1500)
    // plus etwas Reserve fuer einen fruehen Raid - siehe Chat-Verlauf/README fuer die genaue Herleitung.
    resources: { metall: 50_000_000, kristall: 25_000_000, deuterium: 10_000_000, dm: 500 },
    fleet,
    defense,
    research: {
      waffen: 0, schild: 0, panzerung: 0, bauzeit: 0, mining: 0, spionage: 0,
      zielerfassung: 0, durchschlag: 0, schildregeneration: 0, praezision: 0,
      ausweichen: 0, kritischetreffer: 0,
    },
    buildQueue: [],
    defenseQueue: [],
    researchQueue: [],
    buildings,
    buildingModules,
    buildingQueue: [],
    shipModules,
    shipModuleQueue: [],
    defenseModuleQueue: [],
    galaxyPosition: assignRandomGalaxyPosition(userId),
    galaxyDeployments: [],
    eventTrips: [],
    pirateAttacks: [],
    spyMissions: [],
    nextPirateSpyCheck: Date.now() + PIRATE_SPY_CHECK_INTERVAL_MS,
    activeBoosters: {},
    teile: { waffen: 0, schild: 0, panzerung: 0 },
    missions: [],
    messages: [],
    inventory: [],
    presets: [],
    raid: null,
    nextRaidCheck: nextWeeklyCheckpoint(Date.now(), raidScheduleForUser(userId)),
    raidScheduleMigrated: true,
    raidWeeklyScheduleMigrated: true,
    lastUpdate: Date.now(),
    stats: defaultPlayerStats(),
  };
}

export function defaultPlayerStats() {
  return {
    missionsNiedrig: 0,
    missionsMittel: 0,
    missionsHoch: 0,
    asteroidMissions: 0,
    eliteBollwerkChecks: 0,
    raidsRepelledFull: 0,
    raidsRepelledPartial: 0,
    captainsDefeated: 0,
    enemiesDestroyed: 0,
    enemiesDestroyedByType: {} as Record<string, number>,
    ownShipsLost: 0,
    resourcesLooted: 0,
    containersOpened: { silber: 0, gold: 0, elite: 0 },
    researchCompleted: 0,
    shipsBuilt: 0,
    resourcesSpentShipsDefense: 0,
    resourcesSpentResearchBuildings: 0,
  };
}

export function loadPlayerState(userId: number): PlayerState {
  const json = loadGameStateJson(userId);
  if (!json) {
    const fresh = defaultPlayerState(userId);
    saveGameStateJson(userId, JSON.stringify(fresh));
    return fresh;
  }
  const parsed = JSON.parse(json) as PlayerState;
  // ---- Migration bestehender Spielstaende ----
  // Neue Forschungen/Felder muessen hier ergaenzt werden, sonst fehlen sie in bereits
  // gespeicherten Staenden (z.B. `research.ausweichen === undefined` statt 0), was zu falschen
  // Anzeigen und Rechenfehlern fuehrt. Der Abgleich gegen RESEARCH deckt automatisch ALLE
  // aktuellen und kuenftigen Forschungen ab, ohne dass man hier jedes Mal nachziehen muss.
  if (!parsed.research) parsed.research = {} as Record<string, number>;
  RESEARCH.forEach((r) => {
    if (parsed.research[r.id] === undefined) parsed.research[r.id] = 0;
  });
  // Statistik-Objekt nachruesten (existierte vor Einfuehrung der Statistik-Seite nicht) - siehe
  // "Wichtige Punkte" zu kuenftigen neuen PlayerState-Feldern.
  // Gebaeude nachruesten (existierten vor Einfuehrung dieses Systems nicht) - gleiches Muster wie
  // bei RESEARCH oben: Abgleich gegen BUILDINGS deckt automatisch alle aktuellen und kuenftigen
  // Gebaeudetypen ab.
  if (!parsed.buildings) parsed.buildings = {} as Record<string, number>;
  BUILDINGS.forEach((b) => {
    if (parsed.buildings[b.id] === undefined) parsed.buildings[b.id] = 0;
  });
  // Gebaeude-Module nachruesten (gleiches Migrationsmuster wie oben).
  if (!parsed.buildingModules) parsed.buildingModules = {} as Record<string, number>;
  BUILDING_MODULES.forEach((m) => {
    if (parsed.buildingModules[m.id] === undefined) parsed.buildingModules[m.id] = 0;
  });
  // Schiffs-Module nachruesten (gleiches Migrationsmuster wie oben) + eigene Bauschlange.
  if (!parsed.shipModules) parsed.shipModules = {} as Record<string, number>;
  SHIP_MODULES.forEach((m) => {
    if (parsed.shipModules[m.id] === undefined) parsed.shipModules[m.id] = 0;
  });
  if (!parsed.shipModuleQueue) parsed.shipModuleQueue = [];
  // Verteidigungs-Module nachruesten - leben in DERSELBEN shipModules-Map (siehe
  // DefenseModuleDefinition-Kommentar in types.ts), bekommen aber eine eigene Bauschlange.
  DEFENSE_MODULES.forEach((m) => {
    if (parsed.shipModules[m.id] === undefined) parsed.shipModules[m.id] = 0;
  });
  if (!parsed.defenseModuleQueue) parsed.defenseModuleQueue = [];
  // PERFORMANCE-NOTMASSNAHME (siehe README): bestehende Spielstaende hatten ihren
  // `nextRaidCheck` noch nach dem alten, gemeinsamen 0/6/12/18-Uhr-Rhythmus berechnet - EINMALIG
  // (per `raidScheduleMigrated`-Flag, NICHT bei jedem Laden - sonst wuerde der Checkpoint nie
  // faellig werden, exakt der Bug aus Punkt 55) auf den personalisierten Rhythmus umstellen,
  // falls der Nutzername einen fest zugewiesenen hat. Verhindert einen letzten "Uebergangs-
  // Konflikt", bei dem beide Spieler durch den noch alten, gemeinsamen Zeitstempel doch noch
  // einmal gleichzeitig raiden wuerden.
  // WICHTIG: das `xMigrated`-Flag wird bewusst NUR gesetzt, wenn der Reset auch tatsaechlich
  // angewendet wurde (also innerhalb des `if (!parsed.raid)`-Zweigs) - vorher stand es
  // UNBEDINGT davor, wodurch ein Spieler, der GENAU im Moment des Deploys mitten in einem Raid
  // steckte, die Migration fuer immer als "erledigt" markierte, OHNE dass `nextRaidCheck`
  // tatsaechlich neu gesetzt wurde (Bugfix 29.07.2026, Nutzer-Bericht: bekam nach der Umstellung
  // auf 1x/Woche trotzdem noch einen Raid zum alten, nicht-sonntaeglichen Zeitpunkt - der zweite
  // Spieler ohne aktiven Raid im Deploy-Moment war nicht betroffen). Jetzt retried die Migration
  // bei jedem weiteren Laden, bis sie tatsaechlich einmal mit `!parsed.raid` durchlaeuft.
  if (!parsed.raidScheduleMigrated && !parsed.raid) {
    parsed.raidScheduleMigrated = true;
    parsed.nextRaidCheck = nextWeeklyCheckpoint(Date.now(), raidScheduleForUser(userId));
  }
  // Zweite Migration (28.07.2026, Umbau 2x/Tag -> 1x/Woche, siehe RAID_SCHEDULE_BY_USERNAME in
  // economy.ts): bestehende Spielstaende haben `nextRaidCheck` noch nach dem alten taeglichen
  // Rhythmus gesetzt - der Zeitstempel ist zwar technisch noch gueltig (wuerde beim naechsten
  // faelligen Zeitpunkt einmalig ausloesen, dann automatisch in den neuen woechentlichen Rhythmus
  // uebergehen), aber EINMALIG sofort auf "naechster Sonntag 0 Uhr" zurueckgesetzt, damit alle
  // Spieler ab dem Deploy sauber im neuen Rhythmus starten statt auf einen alten Zwischenwert zu warten.
  if (!parsed.raidWeeklyScheduleMigrated && !parsed.raid) {
    parsed.raidWeeklyScheduleMigrated = true;
    parsed.nextRaidCheck = nextWeeklyCheckpoint(Date.now(), raidScheduleForUser(userId));
  }
  // Dritte, einmalige Nachkorrektur (29.07.2026) fuer genau den obigen Bug: bei den beiden
  // betroffenen Spielern (siehe RAID_SCHEDULE_BY_USERNAME) stehen die beiden Flags oben von
  // GESTERN bereits auf `true`, OBWOHL der Reset damals wegen eines aktiven Raids uebersprungen
  // wurde - retryen wuerde also nicht mehr greifen. Einmaliger dritter Flag, der unabhaengig vom
  // Stand der beiden aelteren Flags nochmal sauber auf den naechsten korrekten Wochentermin
  // setzt, sobald kein Raid mehr aktiv ist.
  if (!parsed.raidWeeklyScheduleRealigned && !parsed.raid) {
    parsed.raidWeeklyScheduleRealigned = true;
    parsed.nextRaidCheck = nextWeeklyCheckpoint(Date.now(), raidScheduleForUser(userId));
  }
  if (!parsed.buildingQueue) parsed.buildingQueue = [];
  // Galaxie-Position nachruesten (existierte vor Einfuehrung dieses Systems nicht) - betrifft
  // ALLE bereits registrierten Spieler, bekommen beim naechsten Laden eine zufaellige freie
  // Position zugewiesen (siehe README).
  if (!parsed.galaxyPosition) parsed.galaxyPosition = assignRandomGalaxyPosition(parsed.userId);
  if (!parsed.galaxyDeployments) parsed.galaxyDeployments = [];
  if (!parsed.eventTrips) parsed.eventTrips = [];
  if (!parsed.pirateAttacks) parsed.pirateAttacks = [];
  if (!parsed.spyMissions) parsed.spyMissions = [];
  if (!parsed.nextPirateSpyCheck) parsed.nextPirateSpyCheck = Date.now() + PIRATE_SPY_CHECK_INTERVAL_MS;
  // Alte, vor der Piratenbasen-Erweiterung gespawnte Raids haben kein pirateBase/launchTime-Feld -
  // sicherheitshalber verwerfen statt mit kaputten Werten weiterzurechnen, der naechste
  // Checkpoint spawnt ganz regulaer einen neuen (siehe raids.ts spawnRaidAt()).
  if (parsed.raid && (parsed.raid as any).pirateBase === undefined) {
    parsed.raid = null;
  }
  // Alte, vor dem Wellensystem gespawnte Raids haben kein waveTimes-Feld - sicherheitshalber
  // verwerfen statt mit kaputten Werten weiterzurechnen (analog zur pirateBase-Migration oben),
  // der naechste Checkpoint spawnt ganz regulaer einen neuen (siehe raids.ts spawnRaidAt()).
  if (parsed.raid && (parsed.raid as any).waveTimes === undefined) {
    parsed.raid = null;
  }
  // Bestandsspieler ohne playerClass-Feld (vor Einfuehrung des Klassensystems) MUESSEN aktiv
  // waehlen - hier bewusst NICHT auf eine Standardklasse geraten, siehe App.tsx fuer die
  // blockierende Auswahl-Ansicht.
  if ((parsed as any).playerClass === undefined) {
    (parsed as any).playerClass = null;
  }
  // Wirtschafts-Klasse nachruesten (existierte vor Einfuehrung dieses Systems nicht) - anders als
  // playerClass ist `null` hier der DAUERHAFTE Normalzustand (kein Zwang zur Auswahl), nicht nur
  // eine Uebergangs-Migration.
  if ((parsed as any).economyClass === undefined) {
    (parsed as any).economyClass = null;
  }
  // Notruf-Events komplett entfernt (siehe README) - falls ein alter Spielstand noch die
  // Felder event/nextEventCheck enthaelt, werden sie beim Speichern einfach ignoriert (kein
  // Loeschen noetig, sie sind schlicht nicht mehr Teil des PlayerState-Typs).
  if (!parsed.stats) parsed.stats = defaultPlayerStats();
  const statsDefaults = defaultPlayerStats();
  (Object.keys(statsDefaults) as (keyof typeof statsDefaults)[]).forEach((key) => {
    if (parsed.stats[key] === undefined) (parsed.stats as any)[key] = statsDefaults[key];
  });
  if (!parsed.stats.containersOpened) parsed.stats.containersOpened = { silber: 0, gold: 0, elite: 0 };
  return parsed;
}

export function savePlayerState(state: PlayerState): void {
  saveGameStateJson(state.userId, JSON.stringify(state));
}
