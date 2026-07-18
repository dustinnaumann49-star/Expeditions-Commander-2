import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { BUILDINGS } from './data/buildings.js';
import { nextFixedCheckpoint } from './data/economy.js';
import type { PlayerState } from './types.js';
import { loadGameStateJson, saveGameStateJson } from '../db.js';

export function defaultPlayerState(userId: number): PlayerState {
  const fleet: Record<string, number> = {};
  SHIPS.forEach((s) => (fleet[s.id] = 0));
  const defense: Record<string, number> = {};
  DEFENSES.forEach((d) => (defense[d.id] = 0));
  const buildings: Record<string, number> = {};
  BUILDINGS.forEach((b) => (buildings[b.id] = 0));

  return {
    userId,
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
    buildingQueue: [],
    activeBoosters: {},
    teile: { waffen: 0, schild: 0, panzerung: 0 },
    missions: [],
    messages: [],
    inventory: [],
    presets: [],
    raid: null,
    nextRaidCheck: nextFixedCheckpoint(Date.now()),
    event: null,
    nextEventCheck: nextFixedCheckpoint(Date.now()),
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
    notrufCompleted: 0,
    captainsDefeated: 0,
    enemiesDestroyed: 0,
    ownShipsLost: 0,
    resourcesLooted: 0,
    containersOpened: { silber: 0, gold: 0, elite: 0 },
    researchCompleted: 0,
    shipsBuilt: 0,
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
  if (!parsed.buildingQueue) parsed.buildingQueue = [];
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
