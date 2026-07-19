import { listAllUsers } from '../db.js';
import { loadPlayerState } from './state.js';
import { getHoldingDeploymentsTargeting } from './galaxy.js';
import type { GalaxyPosition } from './types.js';

export interface ActiveRaidInfo {
  targetUserId: number;
  targetUsername: string;
  targetPosition: GalaxyPosition | null;
  raidId: string;
  arrivalTime: number;
  wavesProcessed: number;
  waveCount: number;
  holdingCount: number;
}

/**
 * Listet alle aktuell aktiven (noch nicht aufgeloesten) Raids ueber alle registrierten Spieler
 * hinweg - damit jeder sehen kann, wo gerade ein Angriff laeuft. Verstaerkung laeuft seit der
 * Galaxie-Erweiterung ausschliesslich ueber "Halten" (galaxy.ts) - diese Liste dient nur noch der
 * NAVIGATION dorthin (Koordinaten anklickbar -> springt in der Galaxie-Ansicht zur Zielposition),
 * kein eigener Verstaerkungs-Versand mehr (die vorherige `reinforceRaid()`-Funktion mit fester
 * 1-Minute-Anflugzeit wurde ersatzlos entfernt, siehe README).
 */
export function listActiveRaids(excludeUserId: number): ActiveRaidInfo[] {
  const users = listAllUsers();
  const result: ActiveRaidInfo[] = [];
  users.forEach((u) => {
    if (u.id === excludeUserId) return;
    const state = loadPlayerState(u.id);
    if (state.raid) {
      result.push({
        targetUserId: u.id,
        targetUsername: u.username,
        targetPosition: state.galaxyPosition,
        raidId: state.raid.id,
        arrivalTime: state.raid.arrivalTime,
        wavesProcessed: state.raid.wavesProcessed,
        waveCount: state.raid.waveTimes.length,
        holdingCount: getHoldingDeploymentsTargeting(u.id).length,
      });
    }
  });
  return result;
}
