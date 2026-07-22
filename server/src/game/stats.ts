import { listAllUsers } from '../db.js';
import { loadPlayerState } from './state.js';
import { getUnitPointValue } from './combat.js';
import type { PlayerStats, PlayerState } from './types.js';

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
};

// Nutzerentscheidung (Juli 2026): "Feinde vernichtet" zaehlte bisher pauschal 1 Punkt pro Einheit,
// egal ob Leichter Jaeger oder Reaper - jetzt gestaffelt nach Gegnerwert (siehe getUnitPointValue()
// in combat.ts, kostenbasiert). `stats.enemiesDestroyedByType` haelt dafuer die Kills nach
// Einheiten-Id aufgeschluesselt, `stats.enemiesDestroyed` bleibt der unveraenderte Rohzaehler fuer
// die Statistik-Anzeige "Feinde vernichtet" (nicht Teil der Punkteberechnung). Deckt auch besiegte
// Piratenkapitaene mit ab (id 'piratenkapitan' landet ganz normal in enemiesDestroyedByType) -
// `POINT_WEIGHTS.captainDefeated` wurde deshalb bewusst ENTFERNT (Nutzerentscheidung), sonst
// zaehlte ein besiegter Kapitaen doppelt. `stats.captainsDefeated` bleibt als reiner Rohzaehler
// fuer die Statistik-Anzeige "Piratenkapitaene besiegt" unveraendert bestehen.
function enemyDestroyedPoints(stats: PlayerStats): number {
  return Object.entries(stats.enemiesDestroyedByType || {}).reduce(
    (sum, [id, count]) => sum + count * getUnitPointValue(id),
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

// "Gesamtmacht"-Anteil der Punktzahl (Nutzerentscheidung Juli 2026): anders als die restlichen,
// rein additiven Kategorien liest dieser Teil die AKTUELLE Flotte/Verteidigung direkt aus dem
// PlayerState (nicht aus PlayerStats) - er KANN also wieder sinken, wenn Schiffe verloren oder
// verschrottet werden, waehrend alle anderen Kategorien nur wachsen. Bewusst so gewaehlt (statt
// z.B. `stats.shipsBuilt`, das nie sinkt): "Gesamtmacht" soll die tatsaechlich JETZT vorhandene
// Staerke widerspiegeln, nicht die historische Investition. Nutzt dieselbe kostenbasierte
// Gewichtung wie vernichtete Gegner (siehe getUnitPointValue()).
export function calculateFleetPowerPoints(state: PlayerState): number {
  let total = 0;
  Object.entries(state.fleet || {}).forEach(([id, count]) => {
    if (count > 0) total += count * getUnitPointValue(id);
  });
  Object.entries(state.defense || {}).forEach(([id, count]) => {
    if (count > 0) total += count * getUnitPointValue(id);
  });
  return total;
}

// Nutzerentscheidung (Juli 2026): Forschung fliesst BEWUSST NICHT in die Punktzahl ein - jeder
// Forschungszweig ist auf Stufe 10 gedeckelt, irgendwann hat jeder Spieler alles fertig, dann
// unterscheidet der Wert Spieler nicht mehr voneinander und traegt nichts zu einer wachsenden
// "Gesamtmacht" bei. Ebenso aussen vor: geoeffnete Container/erbeutete Ressourcen (Glueck/Fleiss,
// keine Kampfkraft) und verlorene eigene Schiffe (kein Gewinn).
export function calculatePoints(stats: PlayerStats): number {
  return (
    stats.missionsNiedrig * POINT_WEIGHTS.missionNiedrig +
    stats.missionsMittel * POINT_WEIGHTS.missionMittel +
    stats.missionsHoch * POINT_WEIGHTS.missionHoch +
    stats.eliteBollwerkChecks * POINT_WEIGHTS.eliteBollwerkCheck +
    stats.raidsRepelledFull * POINT_WEIGHTS.raidRepelledFull +
    stats.raidsRepelledPartial * POINT_WEIGHTS.raidRepelledPartial +
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
    const points = calculatePoints(state.stats) + calculateFleetPowerPoints(state);
    return { userId: u.id, username: u.username, points, stats: state.stats };
  });
  return entries.sort((a, b) => b.points - a.points);
}
