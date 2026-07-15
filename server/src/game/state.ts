import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { nextFixedCheckpoint } from './data/economy.js';
import type { PlayerState } from './types.js';
import { loadGameStateJson, saveGameStateJson } from '../db.js';

export function defaultPlayerState(userId: number): PlayerState {
  const fleet: Record<string, number> = {};
  SHIPS.forEach((s) => (fleet[s.id] = 0));
  const defense: Record<string, number> = {};
  DEFENSES.forEach((d) => (defense[d.id] = 0));

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
    },
    buildQueue: [],
    defenseQueue: [],
    researchQueue: [],
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
  // Migrationsstelle fuer neue Felder in kuenftigen Versionen (analog zu loadState() im HTML-Prototyp):
  // z.B. if (parsed.research.praezision === undefined) parsed.research.praezision = 0;
  return parsed;
}

export function savePlayerState(state: PlayerState): void {
  saveGameStateJson(state.userId, JSON.stringify(state));
}
