import { listAllUsers } from '../db.js';
import { loadPlayerState } from './state.js';
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
  notrufCompleted: 30,
  captainDefeated: 20,
  perEnemyDestroyed: 1,
};

export function calculatePoints(stats: PlayerStats): number {
  return (
    stats.missionsNiedrig * POINT_WEIGHTS.missionNiedrig +
    stats.missionsMittel * POINT_WEIGHTS.missionMittel +
    stats.missionsHoch * POINT_WEIGHTS.missionHoch +
    stats.eliteBollwerkChecks * POINT_WEIGHTS.eliteBollwerkCheck +
    stats.raidsRepelledFull * POINT_WEIGHTS.raidRepelledFull +
    stats.raidsRepelledPartial * POINT_WEIGHTS.raidRepelledPartial +
    stats.notrufCompleted * POINT_WEIGHTS.notrufCompleted +
    stats.captainsDefeated * POINT_WEIGHTS.captainDefeated +
    stats.enemiesDestroyed * POINT_WEIGHTS.perEnemyDestroyed
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
