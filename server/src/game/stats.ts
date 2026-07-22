import { listAllUsers } from '../db.js';
import { loadPlayerState } from './state.js';
import { getEnemyPointValue } from './combat.js';
import type { PlayerStats } from './types.js';

// Punkte werden NIE direkt gespeichert, nur aus den rohen Zaehlern (PlayerStats) berechnet - so
// laesst sich die Gewichtung hier jederzeit anpassen, ohne bestehende Spielstaende migrieren zu
// muessen (die Rohwerte bleiben unveraendert korrekt, nur die daraus abgeleitete Punktzahl aendert
// sich beim naechsten Aufruf automatisch).
export const POINT_WEIGHTS = {
  missionNiedrig: 10,
  missionMittel: 25,
  missionHoch: 50,
  eliteBollwerkCheck: 150,
  raidRepelledFull: 40,
  raidRepelledPartial: 15,
  captainDefeated: 20,
};

// Nutzerentscheidung (Juli 2026): "Feinde vernichtet" zaehlte bisher pauschal 1 Punkt pro Einheit,
// egal ob Leichter Jaeger oder Reaper - jetzt gestaffelt nach Gegnerwert (siehe
// getEnemyPointValue() in combat.ts, kostenbasiert). `stats.enemiesDestroyedByType` haelt dafuer
// die Kills nach Einheiten-Id aufgeschluesselt, `stats.enemiesDestroyed` bleibt der unveraenderte
// Rohzaehler fuer die Statistik-Anzeige "Feinde vernichtet" (nicht Teil der Punkteberechnung).
function enemyDestroyedPoints(stats: PlayerStats): number {
  return Object.entries(stats.enemiesDestroyedByType || {}).reduce(
    (sum, [id, count]) => sum + count * getEnemyPointValue(id),
    0
  );
}

// Zentrale Stelle zum Verbuchen vernichteter Gegner (Nutzerentscheidung Juli 2026) - haelt sowohl
// den unveraenderten Rohzaehler `enemiesDestroyed` als auch die neue Aufschluesselung nach Typ
// `enemiesDestroyedByType` synchron, damit keiner der bisher fuenf Aufrufer (missions.ts, raids.ts
// x3, groupOps.ts) das versehentlich vergisst.
export function recordEnemyKills(stats: PlayerStats, lossesById: Record<string, number>) {
  if (!stats.enemiesDestroyedByType) stats.enemiesDestroyedByType = {};
  Object.entries(lossesById).forEach(([id, count]) => {
    if (!count) return;
    stats.enemiesDestroyed += count;
    stats.enemiesDestroyedByType[id] = (stats.enemiesDestroyedByType[id] || 0) + count;
  });
}

export function calculatePoints(stats: PlayerStats): number {
  return (
    stats.missionsNiedrig * POINT_WEIGHTS.missionNiedrig +
    stats.missionsMittel * POINT_WEIGHTS.missionMittel +
    stats.missionsHoch * POINT_WEIGHTS.missionHoch +
    stats.eliteBollwerkChecks * POINT_WEIGHTS.eliteBollwerkCheck +
    stats.raidsRepelledFull * POINT_WEIGHTS.raidRepelledFull +
    stats.raidsRepelledPartial * POINT_WEIGHTS.raidRepelledPartial +
    stats.captainsDefeated * POINT_WEIGHTS.captainDefeated +
    enemyDestroyedPoints(stats)
  );
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  points: number;
  stats: PlayerStats;
}

// Bestenliste ueber ALLE registrierten Nutzer (bei 2-5 Spielern performance-technisch unproblematisch,
// siehe README "Wichtige Punkte" zur generellen Spieler-Groessenordnung dieses Projekts).
export function getLeaderboard(): LeaderboardEntry[] {
  const users = listAllUsers();
  const entries: LeaderboardEntry[] = users.map((u) => {
    const state = loadPlayerState(u.id);
    return { userId: u.id, username: u.username, points: calculatePoints(state.stats), stats: state.stats };
  });
  return entries.sort((a, b) => b.points - a.points);
}
