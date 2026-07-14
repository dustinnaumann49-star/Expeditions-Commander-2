import type { GameData } from '../types/game';

export function shipName(gameData: GameData, id: string): string {
  return gameData.ships.find((s) => s.id === id)?.name || gameData.defenses.find((d) => d.id === id)?.name || id;
}

// z.B. "Leichter Jäger: 95.0% (20)" - Chance auf Folgeschuss + roher RF-Wert
export function getRapidFireDisplay(gameData: GameData, attackerId: string): string | null {
  const rf = gameData.rapidfire[attackerId];
  if (!rf) return null;
  const entries = Object.entries(rf);
  if (entries.length === 0) return null;
  return entries.map(([targetId, value]) => `${shipName(gameData, targetId)}: ${(((value - 1) / value) * 100).toFixed(1)}% (${value})`).join(' | ');
}

export function isTargetedByRapidFire(gameData: GameData, id: string): boolean {
  return Object.values(gameData.rapidfire).some((targets) => targets[id] !== undefined);
}

export function getZielerfassungAccuracy(gameData: GameData, research: Record<string, number>, shipId: string): number {
  const base = gameData.zielerfassungBase[shipId];
  if (base === undefined) return 0;
  const level = research.zielerfassung || 0;
  const tech = gameData.research.find((r) => r.id === 'zielerfassung');
  const bonus = level * (tech ? tech.effectPerLevel : 0.06);
  return Math.min(1, base + bonus);
}

export function getShieldRegenRate(gameData: GameData, research: Record<string, number>): number {
  const level = research.schildregeneration || 0;
  const tech = gameData.research.find((r) => r.id === 'schildregeneration');
  const bonus = level * (tech ? tech.effectPerLevel : 0.06);
  return Math.min(gameData.shieldRegenMax, gameData.shieldRegenBase + bonus);
}

export function getPrecisionChance(gameData: GameData, research: Record<string, number>): number {
  const level = research.praezision || 0;
  const tech = gameData.research.find((r) => r.id === 'praezision');
  const bonus = level * (tech ? tech.effectPerLevel : 0.02);
  return Math.min(gameData.precisionMaxPlayer, gameData.precisionBase + bonus);
}

export function schildMultiplier(gameData: GameData, research: Record<string, number>): number {
  const tech = gameData.research.find((r) => r.id === 'schild');
  return 1 + (research.schild || 0) * (tech ? tech.effectPerLevel : 0.1);
}

// Schildkuppel-Bonus: Summe aller Kuppel-Schildwerte, gleichmaessig verteilt auf alle Nicht-Kuppel-Anlagen.
export function getShieldDomeBonus(gameData: GameData, defense: Record<string, number>, research: Record<string, number>): number {
  let domeShieldTotal = 0;
  let otherCount = 0;
  gameData.defenses.forEach((d) => {
    const count = defense[d.id] || 0;
    if (count <= 0) return;
    if (d.isDome) domeShieldTotal += count * d.stats.schild;
    else otherCount += count;
  });
  if (otherCount === 0 || domeShieldTotal === 0) return 0;
  return (domeShieldTotal / otherCount) * schildMultiplier(gameData, research);
}
