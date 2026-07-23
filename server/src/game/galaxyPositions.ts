import { GALAXY_SYSTEMS, GALAXY_POSITIONS, PIRATE_BASES, OUTPOST_POSITIONS } from './data/galaxyConstants.js';
import { SEKTOR_CONFIG } from './data/sectors.js';
import { listAllUsers, loadGameStateJson } from '../db.js';
import type { GalaxyPosition } from './types.js';

// Eigenstaendiges Modul OHNE Abhaengigkeit zu state.ts/galaxy.ts (nutzt wie
// state.ts:assignRandomGalaxyPosition() direkt loadGameStateJson() statt loadPlayerState()) -
// sonst wuerde state.ts -> galaxyPositions.ts -> state.ts (oder galaxy.ts) einen Zirkelbezug
// erzeugen. Wird von relocateGalaxyPosition() (galaxy.ts) und maybeSpawnGalaxyEvent()
// (galaxyEvents.ts) genutzt - anders als die urspruengliche Erstzuweisung in state.ts schliesst
// dies zusaetzlich Piratenbasen und Sektor-Positionen mit ein, da eine bewusst GEWAEHLTE Position
// (Umzug) oder ein platziertes Ereignis nicht zufaellig auf einer bereits belegten Spielwelt-Kachel
// landen darf.
function key(p: GalaxyPosition): string {
  return `${p.system}:${p.position}`;
}

export function getReservedGalaxyPositions(excludeUserId?: number): Set<string> {
  const reserved = new Set<string>();
  listAllUsers().forEach((u) => {
    if (u.id === excludeUserId) return;
    const json = loadGameStateJson(u.id);
    if (!json) return;
    try {
      const parsed = JSON.parse(json) as { galaxyPosition?: GalaxyPosition | null };
      if (parsed.galaxyPosition) reserved.add(key(parsed.galaxyPosition));
    } catch {
      // Kaputter/leerer Eintrag - einfach ignorieren, blockiert keine Position.
    }
  });
  PIRATE_BASES.forEach((p) => reserved.add(key(p)));
  OUTPOST_POSITIONS.forEach((p) => reserved.add(key(p)));
  Object.values(SEKTOR_CONFIG).forEach((cfg) => {
    if (cfg.galaxyPosition) reserved.add(key(cfg.galaxyPosition));
  });
  return reserved;
}

export function isGalaxyPositionFree(pos: GalaxyPosition, reserved: Set<string>): boolean {
  return !reserved.has(key(pos));
}

export function pickRandomFreeGalaxyPosition(reserved: Set<string>): GalaxyPosition | null {
  const free: GalaxyPosition[] = [];
  for (let system = 1; system <= GALAXY_SYSTEMS; system++) {
    for (let position = 1; position <= GALAXY_POSITIONS; position++) {
      const p = { system, position };
      if (!reserved.has(key(p))) free.push(p);
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}
