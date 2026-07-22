import { listGalaxyEventsJson, saveGalaxyEvent, deleteGalaxyEvent } from '../db.js';
import { getReservedGalaxyPositions, pickRandomFreeGalaxyPosition } from './galaxyPositions.js';
import {
  GALAXY_EVENT_TYPES,
  GALAXY_EVENT_SPAWN_CHANCE,
  GALAXY_EVENT_MAX_ACTIVE,
  GALAXY_EVENT_LIFETIME_MS,
  rollGalaxyEventReward,
} from './data/economy.js';
import { galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost } from './galaxy.js';
import { pushMessage } from './messages.js';
import type { PlayerState, GalaxyPosition, GalaxyEvent } from './types.js';
import type { ActionResult } from './actions.js';

function parseEvent(json: string): GalaxyEvent {
  return JSON.parse(json) as GalaxyEvent;
}

// Nur nicht-abgelaufene Ereignisse - abgelaufene werden separat per cleanupExpiredGalaxyEvents()
// entfernt (getrennt von diesem reinen Lese-Zugriff, damit z.B. der Route-Handler fuer GET
// /game/galaxy nicht bei jedem Aufruf schreibend in die DB eingreift).
export function listActiveGalaxyEvents(): GalaxyEvent[] {
  const now = Date.now();
  return listGalaxyEventsJson()
    .map(parseEvent)
    .filter((e) => e.expiresAt > now);
}

export function cleanupExpiredGalaxyEvents(): void {
  const now = Date.now();
  listGalaxyEventsJson().forEach((json) => {
    const e = parseEvent(json);
    if (e.expiresAt <= now) deleteGalaxyEvent(e.id);
  });
}

// Wird EINMAL pro globalem Heartbeat-Durchlauf aufgerufen (heartbeat.ts), NICHT pro Nutzer-tick()
// - sonst wuerde die Spawn-Chance bei aktiv spielenden Menschen (Polling alle 3s) voellig anders
// wirken als bei einem nur per Heartbeat (alle 2 Min.) verarbeiteten Bot-Account, siehe
// GALAXY_EVENT_SPAWN_CHANCE-Kommentar in economy.ts.
export function maybeSpawnGalaxyEvent(): void {
  cleanupExpiredGalaxyEvents();
  const active = listActiveGalaxyEvents();
  if (active.length >= GALAXY_EVENT_MAX_ACTIVE) return;
  if (Math.random() >= GALAXY_EVENT_SPAWN_CHANCE) return;

  const reserved = getReservedGalaxyPositions();
  active.forEach((e) => reserved.add(`${e.system}:${e.position}`));
  const pos = pickRandomFreeGalaxyPosition(reserved);
  if (!pos) return;

  const types = Object.keys(GALAXY_EVENT_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const now = Date.now();
  const event: GalaxyEvent = {
    id: 'gevt_' + now + '_' + Math.random().toString(36).slice(2, 8),
    type,
    system: pos.system,
    position: pos.position,
    spawnedAt: now,
    expiresAt: now + GALAXY_EVENT_LIFETIME_MS,
    claimedBy: null,
  };
  saveGalaxyEvent(event.id, 'active', JSON.stringify(event));
}

// ========== BERGUNGS-FLUG ==========
// Eigener, einfacher Rundflug (Hinflug, Beute einsammeln FALLS noch verfuegbar, automatischer
// Rueckflug OHNE manuellen Rueckruf) - anders als "Halten" (galaxy.ts) soll hier niemand vergessen
// koennen, die Flotte zurueckzuholen. Bewusst kein PvP-Wettrennen mit Verlustrisiko: kommt man zu
// spaet, war es das lediglich fuer die Beute, die Flotte kehrt unbeschadet zurueck.
export function startEventClaim(state: PlayerState, eventId: string, ships: Record<string, number>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  if (state.eventTrips.some((t) => t.eventId === eventId)) {
    return { ok: false, error: 'Du hast bereits eine Flotte zu diesem Ereignis unterwegs.' };
  }

  const event = listActiveGalaxyEvents().find((e) => e.id === eventId);
  if (!event) return { ok: false, error: 'Dieses Ereignis ist nicht mehr verfügbar.' };
  if (event.claimedBy !== null) return { ok: false, error: 'Dieses Ereignis wurde bereits beansprucht.' };

  const targetPos: GalaxyPosition = { system: event.system, position: event.position };
  const speed = galaxyFleetSpeed(ships, state.research, state.playerClass, state.shipModules);
  if (speed <= 0) return { ok: false, error: 'Ungültige Flottenzusammenstellung.' };
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
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
  state.eventTrips.push({
    id: 'gevtrip_' + now + '_' + Math.random().toString(36).slice(2, 8),
    eventId: event.id,
    eventType: event.type,
    ships,
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: event.system,
    targetPosition: event.position,
    startTime: now,
    arriveTime: now + durationMs,
    returnTime: now + durationMs * 2,
    collected: false,
    reward: null,
  });
  return { ok: true };
}

// Im eigenen tick() aufgerufen (actions.ts): verarbeitet Ankunft (Beute sichern, falls das
// Ereignis dann noch unbeansprucht ist) und Rueckkehr (Flotte + evtl. gesicherte Beute
// gutschreiben) jeder eigenen Bergungs-Reise. Die Beute wird erst bei der RUECKKEHR verbucht,
// nicht schon bei Ankunft - analog zu Mission.farmed/finalizeMission in missions.ts.
export function processEventTrips(state: PlayerState): void {
  const now = Date.now();
  state.eventTrips = state.eventTrips.filter((trip) => {
    if (!trip.collected && trip.arriveTime <= now) {
      trip.collected = true;
      const event = listActiveGalaxyEvents().find((e) => e.id === trip.eventId);
      const def = GALAXY_EVENT_TYPES[trip.eventType];
      const label = def?.label || trip.eventType;
      if (event && event.claimedBy === null) {
        trip.reward = rollGalaxyEventReward(trip.eventType);
        // Sofort loeschen statt nur als "claimed" zu markieren - andere Spieler sollen es ab jetzt
        // nirgends mehr sehen koennen (kein Wettlauf um ein bereits vergriffenes Ereignis).
        deleteGalaxyEvent(event.id);
        pushMessage(
          state,
          'farm',
          `Bergung erfolgreich: ${def?.icon || ''} ${label} entdeckt und geborgen - Fracht ist auf dem Rückweg.`
        );
      } else {
        pushMessage(state, 'farm', `Ankunft am Zielort - ${label} war bereits vergriffen. Flotte kehrt leer zurück.`);
      }
    }
    if (trip.returnTime <= now) {
      Object.entries(trip.ships).forEach(([id, qty]) => {
        if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
      });
      if (trip.reward) {
        state.resources.metall += trip.reward.metall || 0;
        state.resources.kristall += trip.reward.kristall || 0;
        state.resources.deuterium += trip.reward.deuterium || 0;
        state.resources.dm += trip.reward.dm || 0;
        state.stats.resourcesLooted += (trip.reward.metall || 0) + (trip.reward.kristall || 0) + (trip.reward.deuterium || 0);
      }
      return false;
    }
    return true;
  });
}
