import { listAllUsers, getUserById } from '../db.js';
import { loadPlayerState, savePlayerState } from './state.js';
import type { PlayerState } from './types.js';
import type { ActionResult } from './actions.js';

const REINFORCE_TRAVEL_MS = 60 * 1000; // 1 Minute Anflugzeit, wie vom Nutzer vorgegeben

export interface ActiveRaidInfo {
  targetUserId: number;
  targetUsername: string;
  raidId: string;
  arrivalTime: number;
  reinforcementCount: number;
}

/**
 * Listet alle aktuell aktiven (noch nicht aufgeloesten) Raids ueber alle registrierten Spieler hinweg -
 * damit jeder sehen kann, wo gerade ein Angriff laeuft und optional zur Verteidigung eilen kann.
 */
export function listActiveRaids(excludeUserId: number): ActiveRaidInfo[] {
  const users = listAllUsers();
  const result: ActiveRaidInfo[] = [];
  users.forEach((u) => {
    if (u.id === excludeUserId) return;
    const state = loadPlayerState(u.id);
    if (state.raid && !state.raid.resolved) {
      result.push({
        targetUserId: u.id,
        targetUsername: u.username,
        raidId: state.raid.id,
        arrivalTime: state.raid.arrivalTime,
        reinforcementCount: state.raid.reinforcements.length,
      });
    }
  });
  return result;
}

/**
 * Der aktuelle Spieler (reinforcerState) schickt eigene Schiffe los, um einem anderen Spieler
 * (targetUserId) bei der Verteidigung gegen einen laufenden Raid zu helfen. 1 Minute Anflugzeit.
 */
export function reinforceRaid(reinforcerState: PlayerState, targetUserId: number, ships: Record<string, number>): ActionResult {
  if (targetUserId === reinforcerState.userId) {
    return { ok: false, error: 'Du kannst nicht deine eigene Basis verstärken.' };
  }
  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };

  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (reinforcerState.fleet[id] || 0) < qty) {
      return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
    }
  }

  const targetState = loadPlayerState(targetUserId);
  if (!targetState.raid || targetState.raid.resolved) {
    return { ok: false, error: 'Dieser Raid ist nicht mehr aktiv.' };
  }
  const now = Date.now();
  const arrivalTime = now + REINFORCE_TRAVEL_MS;
  if (arrivalTime >= targetState.raid.arrivalTime) {
    return { ok: false, error: 'Zu spät - deine Flotte würde nicht mehr rechtzeitig ankommen.' };
  }
  if (targetState.raid.reinforcements.some((r) => r.userId === reinforcerState.userId)) {
    return { ok: false, error: 'Du unterstützt diesen Raid bereits.' };
  }

  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) reinforcerState.fleet[id] -= qty;
  });

  const me = getUserById(reinforcerState.userId);
  targetState.raid.reinforcements.push({
    userId: reinforcerState.userId,
    username: me?.username || 'Unbekannt',
    ships,
    arrivalTime,
  });
  savePlayerState(targetState);
  return { ok: true };
}
