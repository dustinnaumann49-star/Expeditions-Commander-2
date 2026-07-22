import {
  GALAXY_SYSTEMS,
  GALAXY_POSITIONS,
  GALAXY_DURATION_BASE_SEC,
  GALAXY_DURATION_FACTOR,
  GALAXY_SAME_SYSTEM_BASE,
  GALAXY_SAME_SYSTEM_FACTOR,
  GALAXY_DIFF_SYSTEM_BASE,
  GALAXY_DIFF_SYSTEM_FACTOR,
} from './data/galaxyConstants.js';
import { findShip } from './combat.js';
import { CLASS_KANONIER_FLEET_SPEED_MULTIPLIER, CLASS_KOMMANDANT_FLEET_SPEED_MULTIPLIER } from './data/classes.js';
import { ECONOMY_PROSPEKTOR_FUEL_MULTIPLIER } from './data/economyClasses.js';
import { SHIP_MODULE_DRIVE_EFFECT_PER_LEVEL } from './data/shipModules.js';
import { RELOCATE_BASE_COST_DM } from './data/economy.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { listAllUsers, getUserById } from '../db.js';
import { getReservedGalaxyPositions, isGalaxyPositionFree } from './galaxyPositions.js';
import type { PlayerState, GalaxyPosition, GalaxyDeployment, PlayerClass } from './types.js';
import type { ActionResult } from './actions.js';

// ========== DISTANZ / FLUGZEIT / TREIBSTOFF ==========
// Formeln an OGame angelehnt (siehe data/galaxyConstants.ts fuer die Herleitung der Konstanten).

export function galaxyDistance(a: GalaxyPosition, b: GalaxyPosition): number {
  if (a.system === b.system) {
    return GALAXY_SAME_SYSTEM_BASE + GALAXY_SAME_SYSTEM_FACTOR * Math.abs(a.position - b.position);
  }
  const rawDiff = Math.abs(a.system - b.system);
  // Galaxie "rund" gedacht: System 50 grenzt an System 1, daher immer die kuerzere Richtung.
  const sysDiff = Math.min(rawDiff, GALAXY_SYSTEMS - rawDiff);
  return GALAXY_DIFF_SYSTEM_BASE + GALAXY_DIFF_SYSTEM_FACTOR * sysDiff;
}

// Eine Flotte fliegt so schnell wie ihr langsamstes Schiff (wie in OGame), zusaetzlich
// beschleunigt durch ZWEI Forschungs-Ebenen (siehe Forschungsbaum "Antriebstechnik", research.ts):
// die allgemeine Antriebstechnik-Basis (3%/Stufe, wirkt auf ALLE Schiffe) UND die spezialisierte
// Antriebsklasse DES LANGSAMSTEN SCHIFFS (Raketen-/Impuls-/Hyperraumantrieb, je 2%/Stufe, wirkt
// NUR auf Schiffe dieser Klasse, siehe driveType in data/ships.ts) - beide stapeln multiplikativ.
// `research` optional, damit bestehende Aufrufe ohne Forschungskontext nicht brechen.
const DRIVE_TYPE_TO_RESEARCH: Record<string, string> = {
  rakete: 'raketenantrieb',
  impuls: 'impulsantrieb',
  hyperraum: 'hyperraumantrieb',
};

export function galaxyFleetSpeed(
  ships: Record<string, number>,
  research?: Record<string, number>,
  playerClass?: PlayerClass | null,
  shipModules?: Record<string, number>
): number {
  let slowest = Infinity;
  let slowestShipId: string | null = null;
  Object.entries(ships).forEach(([id, count]) => {
    if (!count) return;
    const ship = findShip(id);
    if (ship && ship.speed && ship.speed < slowest) {
      slowest = ship.speed;
      slowestShipId = id;
    }
  });
  if (slowest === Infinity) return 0;

  const baseLevel = research?.antrieb || 0;
  let multiplier = 1 + baseLevel * 0.03;

  if (slowestShipId && research) {
    const ship = findShip(slowestShipId);
    const driveTechId = ship?.driveType ? DRIVE_TYPE_TO_RESEARCH[ship.driveType] : undefined;
    if (driveTechId) {
      const driveLevel = research[driveTechId] || 0;
      multiplier *= 1 + driveLevel * 0.02;
    }
  }

  // Antriebs-Modul des langsamsten Schiffs (siehe data/shipModules.ts) - wirkt NUR auf dessen
  // eigenen Schiffstyp, exakt wie die Antriebsklassen-Forschung oben auch nur auf den Antriebstyp
  // des langsamsten Schiffs wirkt.
  if (slowestShipId && shipModules) {
    const moduleLevel = shipModules[`${slowestShipId}_antrieb`] || 0;
    multiplier *= 1 + moduleLevel * SHIP_MODULE_DRIVE_EFFECT_PER_LEVEL;
  }

  if (playerClass === 'kanonier') multiplier *= CLASS_KANONIER_FLEET_SPEED_MULTIPLIER;
  if (playerClass === 'kommandant') multiplier *= CLASS_KOMMANDANT_FLEET_SPEED_MULTIPLIER;

  return slowest * multiplier;
}

export function galaxyDurationMs(distance: number, speed: number): number {
  if (speed <= 0) return Infinity;
  const seconds = GALAXY_DURATION_BASE_SEC + GALAXY_DURATION_FACTOR * Math.sqrt((distance * 10) / speed);
  return Math.round(seconds * 1000);
}

// `state` optional (Nutzerentscheidung Juli 2026, Wirtschafts-Klasse "Prospektor" - siehe
// economyClasses.ts) - senkt den Treibstoffverbrauch bei Galaxie-Fluegen. Optional, damit
// Aufrufstellen ohne Spielerkontext (falls es je welche gibt/gab) weiterhin funktionieren.
export function galaxyFuelCost(ships: Record<string, number>, distance: number, state: PlayerState | null = null): number {
  let total = 0;
  Object.entries(ships).forEach(([id, count]) => {
    if (!count) return;
    const ship = findShip(id);
    if (ship) total += count * (ship.fuelConsumption || 0);
  });
  const economyFuel = state?.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_FUEL_MULTIPLIER : 1;
  return Math.ceil(total * (distance / 1000) * economyFuel);
}

// ========== GALAXIE-UEBERSICHT ==========

export interface GalaxyOccupant {
  userId: number;
  username: string;
  system: number;
  position: number;
  isBot: boolean;
}

// Scannt ALLE registrierten Spieler (wie listActiveRaids/stats.ts-Leaderboard) - bei der aktuellen
// Spielerzahl (2-5) performance-technisch unproblematisch, siehe README.
export function listGalaxyOccupants(): GalaxyOccupant[] {
  const result: GalaxyOccupant[] = [];
  listAllUsers().forEach((u) => {
    const state = loadPlayerState(u.id);
    if (state.galaxyPosition) {
      result.push({ userId: u.id, username: u.username, system: state.galaxyPosition.system, position: state.galaxyPosition.position, isBot: u.isBot });
    }
  });
  return result;
}

// ========== "HALTEN" (STATIONIEREN) ==========
// Eigene Flotte zu einer anderen Position schicken - bleibt dort ab Ankunft unbegrenzt "haltend"
// stehen, bis der Absender sie zurueckruft (jeweils eigene Flugzeit + Treibstoffkosten). Kein PvP:
// eine haltende Flotte greift NICHT an, sie nimmt aber automatisch an der Verteidigung des
// Zielspielers teil, sobald dieser von Piraten geraidet wird (siehe raids.ts).

export function startHoldDeployment(state: PlayerState, targetUserId: number, ships: Record<string, number>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  if (targetUserId === state.userId) return { ok: false, error: 'Du kannst deine Flotte nicht zu dir selbst schicken.' };

  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }

  const targetUser = getUserById(targetUserId);
  const targetState = loadPlayerState(targetUserId);
  if (!targetUser || !targetState.galaxyPosition) return { ok: false, error: 'Zielspieler nicht gefunden.' };

  const speed = galaxyFleetSpeed(ships, state.research, state.playerClass, state.shipModules);
  if (speed <= 0) return { ok: false, error: 'Ungültige Flottenzusammenstellung.' };
  const distance = galaxyDistance(state.galaxyPosition, targetState.galaxyPosition);
  const durationMs = galaxyDurationMs(distance, speed);
  const fuelCost = galaxyFuelCost(ships, distance, state);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für den Flug (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) state.fleet[id] -= qty;
  });

  const now = Date.now();
  const deployment: GalaxyDeployment = {
    id: 'gdep_' + now + '_' + Math.random().toString(36).slice(2, 8),
    targetUserId,
    targetUsername: targetUser.username,
    ships,
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: targetState.galaxyPosition.system,
    targetPosition: targetState.galaxyPosition.position,
    startTime: now,
    arriveTime: now + durationMs,
    recalled: false,
    returnTime: null,
  };
  state.galaxyDeployments.push(deployment);
  return { ok: true };
}

// Rueckruf ist auch waehrend des Hinflugs moeglich (die Flotte dreht sofort um) - vereinfacht wie
// an anderer Stelle im Spiel ueblich (siehe missions.ts recallMission), keine Teilstrecken-Physik.
export function recallHoldDeployment(state: PlayerState, deploymentId: string): ActionResult {
  const deployment = state.galaxyDeployments.find((d) => d.id === deploymentId);
  if (!deployment) return { ok: false, error: 'Flottenbewegung nicht gefunden.' };
  if (deployment.recalled) return { ok: false, error: 'Diese Flotte ist bereits auf dem Rückweg.' };
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist keine Galaxie-Position zugewiesen.' };

  const targetPos: GalaxyPosition = { system: deployment.targetSystem, position: deployment.targetPosition };
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
  const speed = galaxyFleetSpeed(deployment.ships, state.research, state.playerClass, state.shipModules);
  const durationMs = galaxyDurationMs(distance, speed);
  const fuelCost = galaxyFuelCost(deployment.ships, distance, state);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für den Rückruf (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  deployment.recalled = true;
  deployment.returnTime = Date.now() + durationMs;
  return { ok: true };
}

// Im eigenen tick() aufgerufen: bringt zurueckgerufene Flotten heim, sobald ihre Rueckflugzeit
// erreicht ist. Unterwegs befindliche/haltende Eintraege bleiben unveraendert stehen.
export function processGalaxyDeployments(state: PlayerState): void {
  const now = Date.now();
  state.galaxyDeployments = state.galaxyDeployments.filter((d) => {
    if (d.recalled && d.returnTime !== null && d.returnTime <= now) {
      Object.entries(d.ships).forEach(([id, qty]) => {
        if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
      });
      return false;
    }
    return true;
  });
}

// ========== HEIMATBASIS VERLEGEN ==========
// Nutzerentscheidung (Juli 2026): gegen RELOCATE_BASE_COST_DM (economy.ts) die eigene Galaxie-
// Position gezielt wechseln - z.B. um naeher an bestimmten Sektoren/dem Mitspieler zu sitzen.
// `extraReserved` nimmt zusaetzlich belegte Positionen entgegen, die dieses Modul selbst nicht
// kennt (aktive Galaxie-Ereignisse aus galaxyEvents.ts) - wird vom Route-Handler befuellt, um den
// Zirkelbezug galaxy.ts <-> galaxyEvents.ts zu vermeiden (galaxyEvents.ts nutzt bereits
// Funktionen aus DIESER Datei fuer die Flugzeit-Berechnung).
export function relocateGalaxyPosition(state: PlayerState, target: GalaxyPosition, extraReserved?: Set<string>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  if (!Number.isInteger(target.system) || target.system < 1 || target.system > GALAXY_SYSTEMS) {
    return { ok: false, error: 'Ungültiges Zielsystem.' };
  }
  if (!Number.isInteger(target.position) || target.position < 1 || target.position > GALAXY_POSITIONS) {
    return { ok: false, error: 'Ungültige Zielposition.' };
  }
  if (target.system === state.galaxyPosition.system && target.position === state.galaxyPosition.position) {
    return { ok: false, error: 'Das ist bereits deine aktuelle Position.' };
  }
  if (state.resources.dm < RELOCATE_BASE_COST_DM) {
    return { ok: false, error: `Nicht genug Dunkle Materie (benötigt: ${RELOCATE_BASE_COST_DM}).` };
  }

  const reserved = getReservedGalaxyPositions(state.userId);
  if (extraReserved) extraReserved.forEach((k) => reserved.add(k));
  if (!isGalaxyPositionFree(target, reserved)) {
    return { ok: false, error: 'Diese Position ist bereits belegt.' };
  }

  state.resources.dm -= RELOCATE_BASE_COST_DM;
  state.galaxyPosition = target;
  return { ok: true };
}

// ========== RAID-INTEGRATION ==========
// Fuer resolveOneWave() (raids.ts): alle aktuell BEI target haltenden (angekommen, nicht
// zurueckgerufen) Fremdflotten anderer Spieler - die nehmen automatisch an der Verteidigung
// gegen den Piraten-Raid teil (kein PvP, nur diese eine Interaktion).
export interface HoldingDeployment {
  deployment: GalaxyDeployment;
  ownerState: PlayerState;
  ownerUserId: number;
  ownerUsername: string;
}

export function getHoldingDeploymentsTargeting(targetUserId: number, currentUserId?: number, currentUserState?: PlayerState): HoldingDeployment[] {
  const now = Date.now();
  const result: HoldingDeployment[] = [];
  listAllUsers(targetUserId).forEach((u) => {
    const ownerState = u.id === currentUserId && currentUserState ? currentUserState : loadPlayerState(u.id);
    (ownerState.galaxyDeployments || []).forEach((d) => {
      if (d.targetUserId === targetUserId && !d.recalled && d.arriveTime <= now) {
        result.push({ deployment: d, ownerState, ownerUserId: u.id, ownerUsername: u.username });
      }
    });
  });
  return result;
}

// Entfernt eine komplett vernichtete haltende Flotte aus dem State ihres Besitzers und speichert
// dessen Zustand (ausser er ist gerade der aktuell tickende Nutzer - dann uebernimmt die aeussere
// Route/tick() das Speichern, siehe Punkt 4/25 des README zum Doppel-Lade-Vermeidungsmuster).
export function persistHeldDeployment(holding: HoldingDeployment, currentUserId?: number): void {
  const stillAlive = Object.values(holding.deployment.ships).some((c) => c > 0);
  if (!stillAlive) {
    holding.ownerState.galaxyDeployments = holding.ownerState.galaxyDeployments.filter((d) => d.id !== holding.deployment.id);
  }
  if (holding.ownerUserId !== currentUserId) savePlayerState(holding.ownerState);
}

// ========== EINGEHENDE FLOTTEN (fuer die Flottenbewegungen-Anzeige) ==========
// Alle Fremdflotten anderer Spieler, die GERADE zu mir unterwegs sind oder bereits bei mir halten
// (nicht zurueckgerufen) - mit vollem Inhalt, da bei Halten-Fluegen (anders als beim Piratenraid)
// die Zusammensetzung von Anfang an feststeht, kein Geheimnis.
export interface IncomingDeployment {
  ownerUsername: string;
  ships: Record<string, number>;
  originSystem: number;
  originPosition: number;
  arriveTime: number;
  holding: boolean;
}

export function getIncomingDeploymentsFor(targetUserId: number): IncomingDeployment[] {
  const now = Date.now();
  const result: IncomingDeployment[] = [];
  listAllUsers(targetUserId).forEach((u) => {
    const ownerState = loadPlayerState(u.id);
    (ownerState.galaxyDeployments || []).forEach((d) => {
      if (d.targetUserId === targetUserId && !d.recalled) {
        result.push({
          ownerUsername: u.username,
          ships: d.ships,
          originSystem: d.originSystem,
          originPosition: d.originPosition,
          arriveTime: d.arriveTime,
          holding: d.arriveTime <= now,
        });
      }
    });
  });
  return result;
}
