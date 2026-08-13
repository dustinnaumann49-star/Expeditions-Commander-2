import { listAllUsers } from '../db.js';
import { loadPlayerState } from './state.js';
import { getUnitPointValue, UNIT_POINT_COST_SCALE } from './combat.js';
import type { PlayerStats } from './types.js';

// Punkte werden NIE direkt gespeichert, nur aus den rohen Zaehlern (PlayerStats) berechnet - so
// laesst sich die Gewichtung hier jederzeit anpassen, ohne bestehende Spielstaende migrieren zu
// muessen (die Rohwerte bleiben unveraendert korrekt, nur die daraus abgeleitete Punktzahl aendert
// sich beim naechsten Aufruf automatisch).
//
// 04.08.2026 (Nutzerentscheidung, Statistik-Neugestaltung): Missionen/Elite-Bollwerk-Checks/Raid-
// Abwehr NICHT MEHR Teil der Punktzahl (POINT_WEIGHTS entfernt). Live-Beobachtung am echten
// Spielstand zeigte: selbst nach kraeftigem Hochskalieren blieben diese Kategorien gegenueber der
// ressourcenbasierten Punktzahl (Millionen-Bereich) komplett unsichtbar/bedeutungslos - eine
// Rundungsungenauigkeit im Vergleich zur restlichen Punktzahl, kein Fixpunkt-Gewicht haette daran
// etwas geaendert. Bleiben als reine PlayerStats-Rohzaehler fuer eigene Zwecke bestehen (siehe
// missions.ts/raids.ts/groupOps.ts), fliessen aber nicht mehr in calculatePoints() ein und werden
// auf der Statistik-Seite nicht mehr angezeigt - die Seite zeigt nur noch tatsaechlich
// punkte-relevante Werte.

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

// ===== BEITRAGS-GEWICHTETE ABSCHUSS-ZURECHNUNG (13.08.2026, Nutzerentscheidung) =====
// Bis dahin bekam bei Mehrspieler-Kaempfen (Gruppen-Expeditionen UND Raids mit Verstaerkung) JEDER
// Beteiligte die VOLLE Abschussliste gutgeschrieben - wer eine einzelne Spionagesonde mitschickte,
// erhielt dieselben Punkte wie jemand mit 20.000 Schiffen. Der Nutzer hat das als Widerspruch zum
// Solo-Fall benannt: "wenn ich alleine fliege, bekomme ich ja auch nur meine Punkte".
//
// Das Argument traegt auch rechnerisch: Die NPC-Staerke einer Gruppen-Expedition skaliert mit der
// GESAMTEN eingesetzten Flottenmacht (siehe groupOps.ts), die Gruppe vernichtet also mehr als ein
// Einzelspieler. Wird diese groessere Beute nach Beitrag aufgeteilt, bekommt jeder ungefaehr das,
// was er auch solo bekommen haette - genau die Gleichbehandlung, die vorher fehlte.
//
// ALS BEITRAG ZAEHLT SCHADEN AUSGETEILT **UND** SCHADEN ABSORBIERT. Nur den ausgeteilten Schaden zu
// werten waere ein Eigentor: das Bollwerk hat per Konstruktion den geringsten Waffenwert (siehe
// classes.ts) und wuerde ausgerechnet bei der Heimatverteidigung - seinem Heimatfeld - am
// schlechtesten bezahlt. Wer Treffer schluckt, damit andere schiessen koennen, leistet einen
// ebenso realen Beitrag.
//
// Bewusst NICHT angetastet: Belohnungen (Container/Beute). Die bleiben vorerst voll je Teilnehmer,
// siehe Entscheidung 3 im Umsetzungsplan - dort wird die Aufteilung als Ganzes entschieden.
export function contributionShares(playerResults: { ownerUsername?: string; dmgDealt?: number; dmgTaken?: number }[]): Record<string, number> {
  const raw: Record<string, number> = {};
  let total = 0;
  for (const r of playerResults) {
    const owner = r.ownerUsername;
    if (!owner) continue;
    const value = (r.dmgDealt || 0) + (r.dmgTaken || 0);
    raw[owner] = (raw[owner] || 0) + value;
    total += value;
  }
  const owners = Object.keys(raw);
  if (owners.length === 0) return {};
  // Randfall: niemand hat Schaden ausgeteilt ODER erlitten (z.B. Kampf ohne Gegner). Dann gleich
  // aufteilen statt durch null zu teilen - sonst bekaeme niemand etwas.
  if (total <= 0) {
    const equal = 1 / owners.length;
    return Object.fromEntries(owners.map((o) => [o, equal]));
  }
  return Object.fromEntries(owners.map((o) => [o, raw[o] / total]));
}

// Skaliert eine Abschussliste auf den Anteil eines Teilnehmers. Gerundet, weil
// `enemiesDestroyedByType` ganze Einheiten zaehlt; bei den ueblichen Groessenordnungen
// (Tausende Abschuesse) ist der Rundungsfehler bedeutungslos. Ein Anteil > 0 ergibt mindestens
// 1 Abschuss, damit ein kleiner Beitrag nicht voellig leer ausgeht.
export function scaleKills(lossesById: Record<string, number>, share: number): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(lossesById).forEach(([id, count]) => {
    if (!count) return;
    const scaled = count * share;
    out[id] = scaled > 0 && scaled < 1 ? 1 : Math.round(scaled);
  });
  return out;
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

// Ressourcenausgaben-Punkte (Nutzerentscheidung 04.08.2026, ersetzt die vorherige
// calculateFleetPowerPoints() komplett): Schiff/Verteidigungs-Punkte und Forschungs/Gebaeude-
// Punkte werden aus den KUMULATIVEN Ausgaben (PlayerStats.resourcesSpentShipsDefense/
// -ResearchBuildings, siehe actions.ts) berechnet, NICHT aus dem aktuellen Bestand - anders als
// die alte Gesamtmacht-Punktzahl sinken sie also NIE, auch nicht bei Kampfverlusten. Gleiche
// Skalierung wie vernichtete Gegner (UNIT_POINT_COST_SCALE), damit alle kostenbasierten
// Punktkategorien vergleichbar bleiben.
export function shipsDefensePoints(stats: PlayerStats): number {
  return Math.round((stats.resourcesSpentShipsDefense || 0) / UNIT_POINT_COST_SCALE);
}
export function researchBuildingsPoints(stats: PlayerStats): number {
  return Math.round((stats.resourcesSpentResearchBuildings || 0) / UNIT_POINT_COST_SCALE);
}

// Punktzahl besteht bewusst NUR noch aus kostenbasierten Kategorien (Nutzerentscheidung
// 04.08.2026, Statistik-Neugestaltung - siehe Kommentar bei POINT_WEIGHTS oben): Schiff/
// Verteidigungs-Ausgaben, Forschungs/Gebaeude-Ausgaben, vernichtete Gegner. Geoeffnete Container/
// erbeutete Ressourcen (Glueck/Fleiss, keine Investition) bleiben weiterhin aussen vor.
export function calculatePoints(stats: PlayerStats): number {
  return shipsDefensePoints(stats) + researchBuildingsPoints(stats) + enemyDestroyedPoints(stats);
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  points: number;
  stats: PlayerStats;
  // Vorberechnete Teil-Punktzahlen (Nutzerentscheidung 04.08.2026) - der Client zeigt diese direkt
  // auf der Statistik-Seite an, statt UNIT_POINT_COST_SCALE fuer eine eigene Berechnung dupliziert
  // an den Client exponieren zu muessen.
  shipsDefensePoints: number;
  researchBuildingsPoints: number;
}

// Bestenliste ueber ALLE registrierten Nutzer (bei 2-5 Spielern performance-technisch unproblematisch,
// siehe README "Wichtige Punkte" zur generellen Spieler-Groessenordnung dieses Projekts).
export function getLeaderboard(): LeaderboardEntry[] {
  const users = listAllUsers();
  const entries: LeaderboardEntry[] = users.map((u) => {
    const state = loadPlayerState(u.id);
    const points = calculatePoints(state.stats);
    return {
      userId: u.id,
      username: u.username,
      points,
      stats: state.stats,
      shipsDefensePoints: shipsDefensePoints(state.stats),
      researchBuildingsPoints: researchBuildingsPoints(state.stats),
    };
  });
  return entries.sort((a, b) => b.points - a.points);
}
