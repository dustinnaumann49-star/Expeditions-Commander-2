import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import {
  RAPIDFIRE,
  ZIELERFASSUNG_BASE,
  SHIELD_REGEN_BASE,
  SHIELD_REGEN_MAX,
  PRECISION_BASE,
  PRECISION_MAX_PLAYER,
  MAX_ROUNDS,
} from './data/combatConstants.js';
import { NPC_SPECIALS, ALLY_STATS } from './data/economy.js';
import type { CombatStats } from './types.js';

// ========== GRUNDLAGEN ==========

export function findShip(id: string) {
  return SHIPS.find((s) => s.id === id);
}

export function findDefense(id: string) {
  return DEFENSES.find((d) => d.id === id);
}

export function findNpcSpecial(id: string) {
  return NPC_SPECIALS.find((n) => n.id === id);
}

export function shipName(id: string): string {
  return findShip(id)?.name ?? findDefense(id)?.name ?? findNpcSpecial(id)?.name ?? id;
}

export function baseStats(id: string): CombatStats {
  return findShip(id)?.stats ?? findDefense(id)?.stats ?? findNpcSpecial(id)?.stats ?? { waffen: 0, schild: 0, panzerung: 0 };
}

export function shipPowerBase(id: string): number {
  const s = baseStats(id);
  return s.waffen + s.schild + s.panzerung;
}

export function getMaxCountFor(id: string): number {
  const s = findShip(id);
  if (s?.maxCount) return s.maxCount;
  const d = findDefense(id);
  if (d?.maxCount) return d.maxCount;
  return Infinity;
}

// ========== FORSCHUNGS-MULTIPLIKATOREN ==========
// `research` ist eine Map von Forschungs-Id -> Stufe (ersetzt das globale `state.research` aus dem Prototyp).

export function waffenMultiplier(research: Record<string, number>): number {
  return 1 + (research.waffen || 0) * RESEARCH[0].effectPerLevel;
}
export function schildMultiplier(research: Record<string, number>): number {
  return 1 + (research.schild || 0) * RESEARCH[1].effectPerLevel;
}
export function panzerungMultiplier(research: Record<string, number>): number {
  return 1 + (research.panzerung || 0) * RESEARCH[2].effectPerLevel;
}

export function getZielerfassungAccuracy(research: Record<string, number>, shipId: string): number {
  const base = ZIELERFASSUNG_BASE[shipId];
  if (base === undefined) return 0;
  const level = research.zielerfassung || 0;
  const tech = RESEARCH.find((r) => r.id === 'zielerfassung');
  const bonus = level * (tech ? tech.effectPerLevel : 0.06);
  return Math.min(1, base + bonus);
}

export function getDurchschlagFraction(research: Record<string, number>): number {
  const level = research.durchschlag || 0;
  const tech = RESEARCH.find((r) => r.id === 'durchschlag');
  const fraction = level * (tech ? tech.effectPerLevel : 0.1);
  return Math.min(1, fraction);
}

export function getShieldRegenRate(research: Record<string, number>): number {
  const level = research.schildregeneration || 0;
  const tech = RESEARCH.find((r) => r.id === 'schildregeneration');
  const bonus = level * (tech ? tech.effectPerLevel : 0.06);
  return Math.min(SHIELD_REGEN_MAX, SHIELD_REGEN_BASE + bonus);
}

export function getPrecisionChance(research: Record<string, number>, applyPlayerResearch: boolean): number {
  if (!applyPlayerResearch) return PRECISION_BASE;
  const level = research.praezision || 0;
  const tech = RESEARCH.find((r) => r.id === 'praezision');
  const bonus = level * (tech ? tech.effectPerLevel : 0.02);
  return Math.min(PRECISION_MAX_PLAYER, PRECISION_BASE + bonus);
}

// Schildkuppel-Bonus: Summe aller Kuppel-Schildwerte, gleichmaessig verteilt auf alle NICHT-Kuppel-
// Verteidigungsanlagen. Kuppeln selbst erhalten (und geben sich) diesen Bonus nicht.
// Gemeinsamer Kuppel-Schild-Pool: Summe aller Kuppel-Schildwerte (inkl. Forschungs-Multiplikator).
// Wird NICHT mehr pro Einheit verteilt, sondern als ein einziger, gemeinsamer Puffer behandelt, der
// Schaden fuer die GESAMTE Seite abfaengt, bevor eine einzelne Anlage getroffen wird (siehe
// runRounds/fireShots). Kuppeln sind auf jeweils 1 Exemplar begrenzt (siehe defenses.ts).
export function computeDomeSharedPool(defenseCounts: Record<string, number>, research: Record<string, number>): number {
  let total = 0;
  DEFENSES.forEach((d) => {
    if (!d.isDome) return;
    const count = defenseCounts[d.id] || 0;
    if (count <= 0) return;
    total += count * d.stats.schild;
  });
  return total * schildMultiplier(research);
}

/**
 * Effektive Kampfwerte eines Schiffs/einer Verteidigungsanlage unter Beruecksichtigung von Forschung
 * und (nur bei Verteidigung) Schildkuppel-Bonus. `kampfBoostActive` entspricht dem 24h-Kampf-Booster (+20%).
 */
export function getEffectiveStats(
  id: string,
  research: Record<string, number>,
  defenseCounts: Record<string, number> = {},
  kampfBoostActive = false
): CombatStats {
  const kampfBoost = kampfBoostActive ? 1.2 : 1;
  const ship = findShip(id);
  if (ship) {
    return {
      waffen: ship.stats.waffen * waffenMultiplier(research) * kampfBoost,
      schild: ship.stats.schild * schildMultiplier(research) * kampfBoost,
      panzerung: ship.stats.panzerung * panzerungMultiplier(research) * kampfBoost,
    };
  }
  const def = findDefense(id);
  if (def) {
    // Kuppeln geben ihren kompletten Schildwert an den gemeinsamen Pool ab (siehe
    // computeDomeSharedPool/runRounds) statt ihn selbst zu tragen oder pro Einheit zu verteilen.
    const ownSchild = def.isDome ? 0 : def.stats.schild;
    return {
      waffen: def.stats.waffen * waffenMultiplier(research) * kampfBoost,
      schild: ownSchild * schildMultiplier(research) * kampfBoost,
      panzerung: def.stats.panzerung * panzerungMultiplier(research) * kampfBoost,
    };
  }
  return { waffen: 0, schild: 0, panzerung: 0 };
}

export function getRapidFireChance(attackerId: string, defenderId: string): number {
  const rfValue = RAPIDFIRE[attackerId]?.[defenderId] || 0;
  if (rfValue === 0) return 0;
  return (rfValue - 1) / rfValue;
}

// Gesamt-"Power" einer Flotte (Summe Waffen+Schild+Panzerung ueber alle Einheiten), nur fuer
// Einheiten mit Waffen > 0 (reine Support-Schiffe wie Mining-Schiff zaehlen hier nicht mit).
export function combatFleetPower(
  fleetObj: Record<string, number>,
  research: Record<string, number>,
  defenseCounts: Record<string, number> = {}
): number {
  let total = 0;
  Object.entries(fleetObj).forEach(([id, count]) => {
    if (count <= 0) return;
    const eff = getEffectiveStats(id, research, defenseCounts);
    if (eff.waffen <= 0) return;
    total += count * (eff.waffen + eff.schild + eff.panzerung);
  });
  return total;
}

// ========== VERTEILUNG VON NPC-FLOTTEN (mit Maxima + Ueberlauf) ==========

/**
 * Verteilt eine Ziel-Power gewichtet auf einen Pool von Typen, unter Beachtung ihrer Maxima
 * (siehe getMaxCountFor). Power, die wegen einer Kappung nicht untergebracht werden kann, wird auf
 * die verbleibenden, noch offenen Typen umverteilt (statt einfach zu verpuffen).
 */
export function generateCappedFleet(
  targetPower: number,
  poolIds: string[],
  weights?: number[]
): Record<string, number> {
  if (targetPower <= 0 || poolIds.length === 0) return {};
  const baseWeights = weights && weights.length === poolIds.length ? weights : poolIds.map(() => 1);

  const result: Record<string, number> = {};
  poolIds.forEach((id) => (result[id] = 0));

  let remainingPower = targetPower;
  let activeIds = [...poolIds];
  let activeWeights = poolIds.map((_, i) => baseWeights[i]);

  let guard = 0;
  while (remainingPower > 1 && activeIds.length > 0 && guard < 30) {
    guard++;
    const weightSum = activeWeights.reduce((a, b) => a + b, 0);
    if (weightSum <= 0) break;
    const nextActiveIds: string[] = [];
    const nextActiveWeights: number[] = [];
    let placedThisPass = 0;

    activeIds.forEach((id, i) => {
      const share = activeWeights[i] / weightSum;
      const powerForType = remainingPower * share;
      const unitPower = shipPowerBase(id);
      if (unitPower <= 0) return;
      let count = Math.round(powerForType / unitPower);
      const cap = getMaxCountFor(id);
      const room = cap === Infinity ? Infinity : cap - result[id];
      if (count > room) count = Math.max(0, room);
      if (count > 0) {
        result[id] += count;
        placedThisPass += count * unitPower;
      }
      const capReached = cap !== Infinity && result[id] >= cap;
      if (!capReached) {
        nextActiveIds.push(id);
        nextActiveWeights.push(activeWeights[i]);
      }
    });

    remainingPower -= placedThisPass;
    activeIds = nextActiveIds;
    activeWeights = nextActiveWeights;
    if (placedThisPass <= 0) break;
  }

  const npc: Record<string, number> = {};
  Object.entries(result).forEach(([id, count]) => {
    if (count > 0) npc[id] = count;
  });
  return npc;
}

export function generatePiratenFleet(targetPower: number, spionageLevel: number): Record<string, number> {
  const smoothing = Math.min(0.5, spionageLevel * 0.05);
  const pool = SHIPS.filter((s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff').map(
    (s) => s.id
  );
  const baseWeights = pool.map((_, i) => 1 / (i + 1));
  const uniform = 1 / pool.length;
  const weights = baseWeights.map((w) => (1 - smoothing) * w + smoothing * uniform);
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateFallbackFleet(targetPower: number): Record<string, number> {
  const pool = SHIPS.filter((s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff').map(
    (s) => s.id
  );
  const weights = pool.map((_, i) => 1 / (i + 1));
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateDefenseFleet(targetPower: number, spionageLevel: number): Record<string, number> {
  const pool = DEFENSES.map((d) => d.id);
  const smoothing = Math.min(0.5, spionageLevel * 0.05);
  const uniform = 1 / pool.length;
  const weights = pool.map(() => (1 - smoothing) * Math.random() + smoothing * uniform);
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateAsteroidPirateFleet(targetPower: number): Record<string, number> {
  return generateCappedFleet(targetPower, ['leicht', 'schwer'], [0.6, 0.4]);
}

// ========== KAMPF-SIMULATION ==========

interface CombatUnit {
  typeId: string;
  ownerKey?: string; // nur bei Mehrspieler-Kaempfen gesetzt (siehe resolveCombatMultiOwner)
  waffen: number;
  shieldMax: number;
  shieldCur: number;
  hpMax: number;
  hpCur: number;
}

function buildUnits(shipsObj: Record<string, number>, statsFn: (id: string) => CombatStats): CombatUnit[] {
  const units: CombatUnit[] = [];
  Object.entries(shipsObj).forEach(([id, count]) => {
    if (!count || count <= 0) return;
    const s = statsFn(id);
    for (let i = 0; i < count; i++) {
      units.push({ typeId: id, waffen: s.waffen, shieldMax: s.schild, shieldCur: s.schild, hpMax: s.panzerung, hpCur: s.panzerung });
    }
  });
  return units;
}

export interface OwnedFleetContribution {
  ownerKey: string;
  ships: Record<string, number>;
  research?: Record<string, number>; // eigene Forschung des Beitragenden - faellt sonst auf die Forschung von Seite A zurueck
  defenseCounts?: Record<string, number>; // fuer Schildkuppel-Bonus, falls relevant (z.B. Heimatverteidiger bei Raid)
  useAllyStats?: boolean; // true = feste ALLY_STATS-Werte statt Forschungs-basierter Berechnung (Notruf-Verbuendete)
}

function buildUnitsMultiOwner(
  contributions: OwnedFleetContribution[],
  fallbackStatsFn: (id: string) => CombatStats
): CombatUnit[] {
  const units: CombatUnit[] = [];
  contributions.forEach(({ ownerKey, ships, research, defenseCounts, useAllyStats }) => {
    const fn = (id: string) => {
      if (useAllyStats) return ALLY_STATS;
      return research ? getEffectiveStats(id, research, defenseCounts || {}) : fallbackStatsFn(id);
    };
    Object.entries(ships).forEach(([id, count]) => {
      if (!count || count <= 0) return;
      const s = fn(id);
      for (let i = 0; i < count; i++) {
        units.push({ typeId: id, ownerKey, waffen: s.waffen, shieldMax: s.schild, shieldCur: s.schild, hpMax: s.panzerung, hpCur: s.panzerung });
      }
    });
  });
  return units;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface ShotStats {
  shotsFired: Record<string, number>;
  hits: Record<string, number>;
  rapidFireTriggers: Record<string, number>;
}

function emptyShotStats(): ShotStats {
  return { shotsFired: {}, hits: {}, rapidFireTriggers: {} };
}

function fireShots(
  shooters: CombatUnit[],
  targets: CombatUnit[],
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  applyPlayerResearch: boolean,
  research: Record<string, number>,
  shooterStats: ShotStats,
  targetsSharedShieldPool?: { remaining: number }
) {
  if (targets.length === 0) return;
  const MAX_SHOTS_PER_UNIT = 50;
  const MAX_CASCADE = 5;
  const overkillFraction = applyPlayerResearch ? getDurchschlagFraction(research) : 0;
  const precision = getPrecisionChance(research, applyPlayerResearch);

  shooters.forEach((shooter) => {
    let shots = 1;
    let fired = 0;
    const rfMap = RAPIDFIRE[shooter.typeId] || {};
    const hasRFPotential = Object.keys(rfMap).length > 0;
    const accuracy = hasRFPotential
      ? applyPlayerResearch
        ? getZielerfassungAccuracy(research, shooter.typeId)
        : ZIELERFASSUNG_BASE[shooter.typeId] || 0
      : 0;

    while (shots > 0 && fired < MAX_SHOTS_PER_UNIT) {
      shots--;
      fired++;
      shooterStats.shotsFired[shooter.typeId] = (shooterStats.shotsFired[shooter.typeId] || 0) + 1;

      const aliveTargets = targets.filter((t) => t.hpCur > 0);
      if (aliveTargets.length === 0) break;

      let target: CombatUnit;
      if (hasRFPotential && Math.random() < accuracy) {
        const rfPool = aliveTargets.filter((t) => rfMap[t.typeId] !== undefined);
        target = rfPool.length > 0 ? pickRandom(rfPool) : pickRandom(aliveTargets);
      } else {
        target = pickRandom(aliveTargets);
      }

      if (Math.random() >= precision) {
        const missRfChance = getRapidFireChance(shooter.typeId, target.typeId);
        if (missRfChance > 0 && Math.random() < missRfChance) {
          shots++;
          shooterStats.rapidFireTriggers[shooter.typeId] = (shooterStats.rapidFireTriggers[shooter.typeId] || 0) + 1;
        }
        continue;
      }

      shooterStats.hits[shooter.typeId] = (shooterStats.hits[shooter.typeId] || 0) + 1;

      const dmg = shooter.waffen;
      const primaryTypeId = target.typeId;
      let currentTarget: CombatUnit | undefined = target;
      let remainingDmg = dmg;
      let cascadeSteps = 0;

      // Gemeinsamer Kuppel-Schild-Pool (falls vorhanden, z.B. Heimatverteidigung): faengt Schaden
      // zuerst ab, bevor irgendeine einzelne Anlage ihren eigenen Schild/Panzerung verliert -
      // schuetzt die GESAMTE Seite, nicht nur eine einzelne, zufaellig getroffene Anlage.
      if (targetsSharedShieldPool && targetsSharedShieldPool.remaining > 0) {
        const absorbed = Math.min(remainingDmg, targetsSharedShieldPool.remaining);
        targetsSharedShieldPool.remaining -= absorbed;
        remainingDmg -= absorbed;
        if (remainingDmg <= 0) continue;
      }

      while (remainingDmg > 0 && currentTarget && cascadeSteps < MAX_CASCADE) {
        cascadeSteps++;
        const shieldDmg = Math.min(remainingDmg, currentTarget.shieldCur);
        currentTarget.shieldCur -= shieldDmg;
        remainingDmg -= shieldDmg;
        if (shieldDmg > 0) {
          shieldDmgTakenTarget[currentTarget.typeId] = (shieldDmgTakenTarget[currentTarget.typeId] || 0) + shieldDmg;
        }
        if (remainingDmg <= 0) break;

        if (remainingDmg < currentTarget.hpCur) {
          currentTarget.hpCur -= remainingDmg;
          dmgTakenTarget[currentTarget.typeId] = (dmgTakenTarget[currentTarget.typeId] || 0) + remainingDmg;
          remainingDmg = 0;
        } else {
          dmgTakenTarget[currentTarget.typeId] = (dmgTakenTarget[currentTarget.typeId] || 0) + currentTarget.hpCur;
          const overflow = (remainingDmg - currentTarget.hpCur) * overkillFraction;
          currentTarget.hpCur = 0;
          if (overflow <= 0) break;
          const sameTypeAlive = targets.filter((t) => t.typeId === currentTarget!.typeId && t.hpCur > 0);
          if (sameTypeAlive.length === 0) break;
          currentTarget = sameTypeAlive[Math.floor(Math.random() * sameTypeAlive.length)];
          remainingDmg = overflow;
          continue;
        }

        if (currentTarget.hpCur > 0 && currentTarget.hpCur < 0.7 * currentTarget.hpMax) {
          const pExplode = 1 - currentTarget.hpCur / currentTarget.hpMax;
          if (Math.random() < pExplode) currentTarget.hpCur = 0;
        }
      }

      const rfChance = getRapidFireChance(shooter.typeId, primaryTypeId);
      if (rfChance > 0 && Math.random() < rfChance) {
        shots++;
        shooterStats.rapidFireTriggers[shooter.typeId] = (shooterStats.rapidFireTriggers[shooter.typeId] || 0) + 1;
      }
    }
  });
}

interface RoundsResult {
  roundsFought: number;
  unitsA: CombatUnit[];
  unitsB: CombatUnit[];
  dmgTakenA: Record<string, number>;
  dmgTakenB: Record<string, number>;
  shieldDmgTakenA: Record<string, number>;
  shieldDmgTakenB: Record<string, number>;
  shieldRegenA: Record<string, number>;
  shieldRegenB: Record<string, number>;
  shotsA: ShotStats;
  shotsB: ShotStats;
  remainingSharedShieldPoolA: number;
}

// Kern der Kampf-Simulation, unabhaengig davon ob Seite A einem einzelnen Spieler gehoert
// (resolveCombat) oder mehreren Spielern gemeinsam (resolveCombatMultiOwner).
function runRounds(
  unitsAIn: CombatUnit[],
  unitsBIn: CombatUnit[],
  research: Record<string, number>,
  sharedShieldPoolA = 0
): RoundsResult {
  let unitsA = unitsAIn;
  let unitsB = unitsBIn;
  const dmgTakenA: Record<string, number> = {};
  const dmgTakenB: Record<string, number> = {};
  const shieldDmgTakenA: Record<string, number> = {};
  const shieldDmgTakenB: Record<string, number> = {};
  const shieldRegenA: Record<string, number> = {};
  const shieldRegenB: Record<string, number> = {};
  const shotsA = emptyShotStats();
  const shotsB = emptyShotStats();

  let roundsFought = 0;
  const regenPlayer = getShieldRegenRate(research);
  const regenNpc = SHIELD_REGEN_BASE;
  // Gemeinsamer Kuppel-Schild-Pool fuer Seite A (nur relevant bei Heimatverteidigung mit
  // Schildkuppeln) - faengt Schaden fuer die GESAMTE Seite ab, bevor einzelne Anlagen getroffen
  // werden. Regeneriert sich zwischen den Runden mit derselben Rate wie normale Schilde.
  const poolA = { remaining: sharedShieldPoolA };

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    if (unitsA.length === 0 || unitsB.length === 0) break;
    roundsFought = round;
    fireShots(unitsA, unitsB, dmgTakenB, shieldDmgTakenB, true, research, shotsA);
    fireShots(unitsB, unitsA, dmgTakenA, shieldDmgTakenA, false, research, shotsB, poolA);
    unitsA = unitsA.filter((u) => u.hpCur > 0);
    unitsB = unitsB.filter((u) => u.hpCur > 0);
    unitsA.forEach((u) => {
      const before = u.shieldCur;
      u.shieldCur = Math.min(u.shieldMax, u.shieldCur + u.shieldMax * regenPlayer);
      shieldRegenA[u.typeId] = (shieldRegenA[u.typeId] || 0) + (u.shieldCur - before);
    });
    unitsB.forEach((u) => {
      const before = u.shieldCur;
      u.shieldCur = Math.min(u.shieldMax, u.shieldCur + u.shieldMax * regenNpc);
      shieldRegenB[u.typeId] = (shieldRegenB[u.typeId] || 0) + (u.shieldCur - before);
    });
    if (sharedShieldPoolA > 0) {
      poolA.remaining = Math.min(sharedShieldPoolA, poolA.remaining + sharedShieldPoolA * regenPlayer);
    }
  }

  return {
    roundsFought,
    unitsA,
    unitsB,
    dmgTakenA,
    dmgTakenB,
    shieldDmgTakenA,
    shieldDmgTakenB,
    shieldRegenA,
    shieldRegenB,
    shotsA,
    shotsB,
    remainingSharedShieldPoolA: poolA.remaining,
  };
}

export interface CombatResult {
  roundsFought: number;
  survivorsA: Record<string, number>;
  survivorsB: Record<string, number>;
  dmgTakenA: Record<string, number>;
  dmgTakenB: Record<string, number>;
  shieldDmgTakenA: Record<string, number>;
  shieldDmgTakenB: Record<string, number>;
  shieldRegenA: Record<string, number>;
  shieldRegenB: Record<string, number>;
  shotsA: ShotStats;
  shotsB: ShotStats;
  remainingSharedShieldPoolA: number;
}

/**
 * Loest einen Kampf zwischen zwei Seiten auf. Seite A ist konventionsgemaess immer die
 * "Spieler-Seite" (erhaelt Zielerfassung/Durchschlag/Praezisions-Forschungsbonus + Schild-Regen-Forschung),
 * Seite B die NPC-Seite (Basiswerte ohne Forschungsbonus).
 *
 * `statsFnA`/`statsFnB` liefern die effektiven Kampfwerte je Einheiten-Id (siehe getEffectiveStats/baseStats).
 */
export function resolveCombat(
  sideAShips: Record<string, number>,
  statsFnA: (id: string) => CombatStats,
  sideBShips: Record<string, number>,
  statsFnB: (id: string) => CombatStats,
  research: Record<string, number>,
  sharedShieldPoolA = 0
): CombatResult {
  const unitsA0 = buildUnits(sideAShips, statsFnA);
  const unitsB0 = buildUnits(sideBShips, statsFnB);
  const r = runRounds(unitsA0, unitsB0, research, sharedShieldPoolA);

  const survivorsA: Record<string, number> = {};
  r.unitsA.forEach((u) => (survivorsA[u.typeId] = (survivorsA[u.typeId] || 0) + 1));
  const survivorsB: Record<string, number> = {};
  r.unitsB.forEach((u) => (survivorsB[u.typeId] = (survivorsB[u.typeId] || 0) + 1));
  Object.keys(sideAShips).forEach((id) => {
    if (survivorsA[id] === undefined) survivorsA[id] = 0;
  });
  Object.keys(sideBShips).forEach((id) => {
    if (survivorsB[id] === undefined) survivorsB[id] = 0;
  });

  return {
    roundsFought: r.roundsFought,
    survivorsA,
    survivorsB,
    dmgTakenA: r.dmgTakenA,
    dmgTakenB: r.dmgTakenB,
    shieldDmgTakenA: r.shieldDmgTakenA,
    shieldDmgTakenB: r.shieldDmgTakenB,
    shieldRegenA: r.shieldRegenA,
    shieldRegenB: r.shieldRegenB,
    shotsA: r.shotsA,
    shotsB: r.shotsB,
    remainingSharedShieldPoolA: r.remainingSharedShieldPoolA,
  };
}

export interface MultiOwnerCombatResult extends CombatResult {
  // ownerKey -> typeId -> Anzahl Ueberlebender (fuer die faire Rueckgabe der Schiffe an die
  // jeweiligen Beitragenden bei Gruppen-Operationen/Raid-Verstaerkung)
  survivorsByOwner: Record<string, Record<string, number>>;
}

/**
 * Wie resolveCombat, aber Seite A besteht aus mehreren Beitraegen unterschiedlicher Spieler
 * (Gruppen-Expeditionen, gemeinsame Notruf-Events, Raid-Verstaerkung). Jede Einheit wird intern mit
 * ihrem Besitzer markiert, damit am Ende jeder Spieler exakt seine eigenen ueberlebenden Schiffe
 * zurueckbekommt (basierend auf dem tatsaechlichen Simulationsergebnis, nicht auf einer Schaetzung).
 */
export function resolveCombatMultiOwner(
  contributions: OwnedFleetContribution[],
  statsFnA: (id: string) => CombatStats,
  sideBShips: Record<string, number>,
  statsFnB: (id: string) => CombatStats,
  research: Record<string, number>,
  sharedShieldPoolA = 0
): MultiOwnerCombatResult {
  const unitsA0 = buildUnitsMultiOwner(contributions, statsFnA);
  const unitsB0 = buildUnits(sideBShips, statsFnB);
  const r = runRounds(unitsA0, unitsB0, research, sharedShieldPoolA);

  const survivorsA: Record<string, number> = {};
  const survivorsByOwner: Record<string, Record<string, number>> = {};
  contributions.forEach((c) => (survivorsByOwner[c.ownerKey] = {}));
  r.unitsA.forEach((u) => {
    survivorsA[u.typeId] = (survivorsA[u.typeId] || 0) + 1;
    if (u.ownerKey) {
      survivorsByOwner[u.ownerKey][u.typeId] = (survivorsByOwner[u.ownerKey][u.typeId] || 0) + 1;
    }
  });
  const survivorsB: Record<string, number> = {};
  r.unitsB.forEach((u) => (survivorsB[u.typeId] = (survivorsB[u.typeId] || 0) + 1));

  const allAIds = new Set<string>();
  contributions.forEach((c) => Object.keys(c.ships).forEach((id) => allAIds.add(id)));
  allAIds.forEach((id) => {
    if (survivorsA[id] === undefined) survivorsA[id] = 0;
  });
  contributions.forEach((c) => {
    Object.keys(c.ships).forEach((id) => {
      if (survivorsByOwner[c.ownerKey][id] === undefined) survivorsByOwner[c.ownerKey][id] = 0;
    });
  });
  Object.keys(sideBShips).forEach((id) => {
    if (survivorsB[id] === undefined) survivorsB[id] = 0;
  });

  return {
    roundsFought: r.roundsFought,
    survivorsA,
    survivorsB,
    survivorsByOwner,
    dmgTakenA: r.dmgTakenA,
    dmgTakenB: r.dmgTakenB,
    shieldDmgTakenA: r.shieldDmgTakenA,
    shieldDmgTakenB: r.shieldDmgTakenB,
    shieldRegenA: r.shieldRegenA,
    shieldRegenB: r.shieldRegenB,
    shotsA: r.shotsA,
    shotsB: r.shotsB,
    remainingSharedShieldPoolA: r.remainingSharedShieldPoolA,
  };
}
