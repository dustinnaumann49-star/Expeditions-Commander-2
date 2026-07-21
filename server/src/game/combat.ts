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
  MULTI_TARGET_VOLLEY_SHIPS,
  PRECISION_MODIFIER,
  SHIELD_REGEN_MODIFIER,
  EVASION_BASE,
  EVASION_MAX,
  CRIT_CHANCE_BASE,
  CRIT_CHANCE_MAX,
  CRIT_DAMAGE_MULTIPLIER,
  PIRATE_RESEARCH_SHARE,
  WAVE_PROFILE_WEIGHTS,
  WAVE_OUTLIER_CHANCE,
  WAVE_OUTLIER_LOW_FACTOR,
  WAVE_OUTLIER_HIGH_FACTOR,
  BATTLE_MODIFIER_CHANCE,
  BATTLE_MODIFIER_LABELS,
  MULTI_TARGET_POWER_CORRECTION,
} from './data/combatConstants.js';
import type { WaveProfile, BattleModifierType } from './data/combatConstants.js';
import { ADMIRAL_BOSS_ID } from './data/combatConstants.js';
import { NPC_SPECIALS } from './data/economy.js';
import {
  CLASS_KANONIER_WAFFEN_MULTIPLIER,
  CLASS_KANONIER_SCHILD_MULTIPLIER,
  CLASS_KANONIER_PANZERUNG_MULTIPLIER,
  CLASS_BOLLWERK_WAFFEN_MULTIPLIER,
  CLASS_BOLLWERK_SCHILD_MULTIPLIER,
  CLASS_BOLLWERK_PANZERUNG_MULTIPLIER,
  CLASS_KOMMANDANT_COMBAT_MULTIPLIER,
} from './data/classes.js';
import { SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL } from './data/shipModules.js';
import type { CombatStats, CombatReplay, PlayerClass } from './types.js';

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

// Schild-Regeneration ist jetzt einheitsabhaengig: grosse Schiffe/Verteidigungsanlagen haben mehr
// Energiereserven und laden deutlich staerker auf als kleine, wendige Jaeger (SHIELD_REGEN_MODIFIER).
export function getShieldRegenRate(research: Record<string, number>, typeId?: string): number {
  const level = research.schildregeneration || 0;
  const tech = RESEARCH.find((r) => r.id === 'schildregeneration');
  const bonus = level * (tech ? tech.effectPerLevel : 0.06);
  const sizeMod = typeId ? SHIELD_REGEN_MODIFIER[typeId] || 0 : 0;
  return Math.max(0, Math.min(SHIELD_REGEN_MAX, SHIELD_REGEN_BASE + bonus + sizeMod));
}

// Praezision ist jetzt einheitsabhaengig: kleine, wendige Schiffe kaempfen nah am Feind und treffen
// zuverlaessiger als schwerfaellige Kapitalschiffe, die aus Distanz feuern (PRECISION_MODIFIER).
// `applyPlayerResearch` hiess frueher so, weil Piraten GAR KEINE Forschung bekamen (das
// research-Objekt wurde dann ignoriert, siehe PIRATE_RESEARCH_SHARE weiter unten) - Piraten
// bekommen jetzt stattdessen ein bereits VORSKALIERTES research-Objekt uebergeben
// (computePirateResearch()), das hier ganz normal ausgelesen wird. Der Parameter bleibt aus
// Aufrufer-/Client-Spiegel-Kompatibilitaet bestehen, wird intern aber nicht mehr gebraucht.
export function getPrecisionChance(research: Record<string, number>, applyPlayerResearch: boolean, typeId?: string): number {
  const sizeMod = typeId ? PRECISION_MODIFIER[typeId] || 0 : 0;
  const level = research.praezision || 0;
  const tech = RESEARCH.find((r) => r.id === 'praezision');
  const bonus = level * (tech ? tech.effectPerLevel : 0.02);
  return Math.max(0.05, Math.min(PRECISION_MAX_PLAYER + sizeMod, PRECISION_BASE + bonus + sizeMod));
}

// Ausweichchance des ZIELS: Gegenstueck zur Praezision des Schuetzen. Kleine Schiffe entziehen sich
// haeufiger einem Treffer; unbewegliche Verteidigungsanlagen koennen das grundsaetzlich nicht.
// Siehe getPrecisionChance oben zur `applyPlayerResearch`-Namensgeschichte.
export function getEvasionChance(research: Record<string, number>, applyPlayerResearch: boolean, typeId: string): number {
  const base = EVASION_BASE[typeId] || 0;
  if (base <= 0) return 0; // Verteidigungsanlagen & Kapitalschiffe ohne Basis-Ausweichen
  const level = research.ausweichen || 0;
  const tech = RESEARCH.find((r) => r.id === 'ausweichen');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  return Math.min(EVASION_MAX, base + bonus);
}

// Chance des SCHUETZEN auf einen kritischen Treffer (doppelter Schaden). Grosse Schiffe treffen
// seltener, richten dafuer aber oefter verheerenden Schaden an. Siehe getPrecisionChance oben zur
// `applyPlayerResearch`-Namensgeschichte.
export function getCritChance(research: Record<string, number>, applyPlayerResearch: boolean, typeId: string): number {
  const base = CRIT_CHANCE_BASE[typeId] || 0;
  const level = research.kritischetreffer || 0;
  const tech = RESEARCH.find((r) => r.id === 'kritischetreffer');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  return Math.min(CRIT_CHANCE_MAX, base + bonus);
}

// Schildkuppel-Bonus: Summe aller Kuppel-Schildwerte, gleichmaessig verteilt auf alle NICHT-Kuppel-
// Verteidigungsanlagen. Kuppeln selbst erhalten (und geben sich) diesen Bonus nicht.
// Gemeinsamer Kuppel-Schild-Pool: Summe aller Kuppel-Schildwerte (inkl. Forschungs-Multiplikator).
// Wird NICHT mehr pro Einheit verteilt, sondern als ein einziger, gemeinsamer Puffer behandelt, der
// Schaden fuer die GESAMTE Seite abfaengt, bevor eine einzelne Anlage getroffen wird (siehe
// runRounds/fireShots). Kuppeln sind auf jeweils 1 Exemplar begrenzt (siehe defenses.ts).
// Kuppel-Pool wendete bisher NUR die Forschung an (schildMultiplier) - Klassen-Bonus (z.B.
// Bollwerks +50% Schild), 24h-Kampf-Booster und Schild-Module wirkten bislang NICHT auf den
// gemeinsamen Pool, obwohl sie ueber getEffectiveStats() bei allen anderen Verteidigungsanlagen
// laengst greifen (Bugfix, aufgefallen beim Anbinden der neuen Verteidigungs-Module - Kuppeln
// melden in getEffectiveStats() IMMER ownSchild=0, ihr gesamter Schildbeitrag laeuft
// ausschliesslich hier durch, nicht durch getEffectiveStats()).
export function computeDomeSharedPool(
  defenseCounts: Record<string, number>,
  research: Record<string, number>,
  kampfBoostActive = false,
  playerClass: PlayerClass | null = null,
  shipModules: Record<string, number> = {}
): number {
  const kampfBoost = kampfBoostActive ? 1.2 : 1;
  const classSchildMult = classCombatMultipliers(playerClass).schild;
  let total = 0;
  DEFENSES.forEach((d) => {
    if (!d.isDome) return;
    const count = defenseCounts[d.id] || 0;
    if (count <= 0) return;
    const moduleMult = 1 + (shipModules[`${d.id}_schild`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    total += count * d.stats.schild * kampfBoost * classSchildMult * moduleMult;
  });
  return total * schildMultiplier(research);
}

// Pro-Wert-Multiplikatoren je Klasse (statt eines einzelnen Faktors auf alle drei Werte) -
// Kanonier boostet NUR Waffen, Bollwerk NUR Schild+Panzerung, Kommandant alle drei gleichmaessig
// aber schwaecher pro Wert. Gleiches "Gesamtbudget" (~100 Prozentpunkte) bei allen drei Klassen,
// nur unterschiedlich verteilt - siehe data/classes.ts fuer die genauen Werte/Begruendung.
function classCombatMultipliers(playerClass: PlayerClass | null): { waffen: number; schild: number; panzerung: number } {
  switch (playerClass) {
    case 'kanonier':
      return { waffen: CLASS_KANONIER_WAFFEN_MULTIPLIER, schild: CLASS_KANONIER_SCHILD_MULTIPLIER, panzerung: CLASS_KANONIER_PANZERUNG_MULTIPLIER };
    case 'bollwerk':
      return { waffen: CLASS_BOLLWERK_WAFFEN_MULTIPLIER, schild: CLASS_BOLLWERK_SCHILD_MULTIPLIER, panzerung: CLASS_BOLLWERK_PANZERUNG_MULTIPLIER };
    case 'kommandant':
      return { waffen: CLASS_KOMMANDANT_COMBAT_MULTIPLIER, schild: CLASS_KOMMANDANT_COMBAT_MULTIPLIER, panzerung: CLASS_KOMMANDANT_COMBAT_MULTIPLIER };
    default:
      return { waffen: 1, schild: 1, panzerung: 1 };
  }
}

/**
 * Effektive Kampfwerte eines Schiffs/einer Verteidigungsanlage unter Beruecksichtigung von Forschung
 * und (nur bei Verteidigung) Schildkuppel-Bonus. `kampfBoostActive` entspricht dem 24h-Kampf-Booster (+20%).
 * `playerClass` wendet den jeweiligen Klassenbonus an (siehe classCombatMultipliers() oben) - NIE
 * fuer NPC/Piraten (die haben keine playerClass, siehe alle Aufrufer). `shipModules` wendet die
 * pro-Schiff-Module (Waffen/Schild/Panzerung, siehe data/shipModules.ts) an - gilt NUR fuer Schiffe,
 * NIE fuer Verteidigungsanlagen (die haben keine eigenen Module).
 */
export function getEffectiveStats(
  id: string,
  research: Record<string, number>,
  defenseCounts: Record<string, number> = {},
  kampfBoostActive = false,
  playerClass: PlayerClass | null = null,
  shipModules: Record<string, number> = {}
): CombatStats {
  const kampfBoost = kampfBoostActive ? 1.2 : 1;
  const classMult = classCombatMultipliers(playerClass);
  const ship = findShip(id);
  if (ship) {
    const waffenModule = 1 + (shipModules[`${id}_waffen`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    const schildModule = 1 + (shipModules[`${id}_schild`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    const panzerungModule = 1 + (shipModules[`${id}_panzerung`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    return {
      waffen: ship.stats.waffen * waffenMultiplier(research) * kampfBoost * classMult.waffen * waffenModule,
      schild: ship.stats.schild * schildMultiplier(research) * kampfBoost * classMult.schild * schildModule,
      panzerung: ship.stats.panzerung * panzerungMultiplier(research) * kampfBoost * classMult.panzerung * panzerungModule,
    };
  }
  const def = findDefense(id);
  if (def) {
    // Kuppeln geben ihren kompletten Schildwert an den gemeinsamen Pool ab (siehe
    // computeDomeSharedPool/runRounds) statt ihn selbst zu tragen oder pro Einheit zu verteilen.
    const ownSchild = def.isDome ? 0 : def.stats.schild;
    // Verteidigungs-Module (nur Waffen/Schild/Panzerung, KEIN Antrieb - Verteidigungsanlagen
    // bewegen sich nicht) leben in DERSELBEN shipModules-Map wie die Schiffs-Module (siehe
    // data/defenseModules.ts) - gleiches Id-Schema (`${defId}_waffen` usw.), keine eigene
    // Kampf-Durchreichung noetig, da shipModules ohnehin schon ueberall ankommt.
    const waffenModule = 1 + (shipModules[`${id}_waffen`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    const schildModule = 1 + (shipModules[`${id}_schild`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    const panzerungModule = 1 + (shipModules[`${id}_panzerung`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    return {
      waffen: def.stats.waffen * waffenMultiplier(research) * kampfBoost * classMult.waffen * waffenModule,
      schild: ownSchild * schildMultiplier(research) * kampfBoost * classMult.schild * schildModule,
      panzerung: def.stats.panzerung * panzerungMultiplier(research) * kampfBoost * classMult.panzerung * panzerungModule,
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
    const correction = MULTI_TARGET_VOLLEY_SHIPS.has(id) ? MULTI_TARGET_POWER_CORRECTION : 1;
    total += count * (eff.waffen + eff.schild + eff.panzerung) * correction;
  });
  return total;
}

// Feindstaerke-Grundlage OHNE jegliche Spieler-Forschung - nutzt ausschliesslich die
// Basiswerte aus ships.ts/defenses.ts. Grund: Wurde die Feindstaerke (wie zuvor in
// combatFleetPower()) aus den FORSCHUNGS-ANGEREICHERTEN Werten berechnet, machte jede Stufe
// Waffen-/Schild-/Panzerungtechnik automatisch auch die Piraten staerker - die Forschung brachte
// dadurch keinen echten Vorteil, nur eine gleichzeitig staerkere Gegenseite. Piraten/NPC-Angreifer
// (Piraten-Sektoren, Raids, Elite-Bollwerk, Asteroiden-Eskorte) skalieren jetzt
// ausschliesslich auf Basis dieser Funktion - Forschung wirkt sich weiterhin auf die EIGENEN
// Kampfwerte aus (ueber getEffectiveStats() bei der eigentlichen Kampfberechnung), aber nicht mehr
// auf die Staerke des Gegners.
export function combatFleetPowerBase(fleetObj: Record<string, number>): number {
  let total = 0;
  Object.entries(fleetObj).forEach(([id, count]) => {
    if (count <= 0) return;
    const base = baseStats(id);
    if (base.waffen <= 0) return;
    const correction = MULTI_TARGET_VOLLEY_SHIPS.has(id) ? MULTI_TARGET_POWER_CORRECTION : 1;
    total += count * (base.waffen + base.schild + base.panzerung) * correction;
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

// ===== Wellen-Vielfalt: Profil-Wahl, Ausreisser-Wurf, Kampf-Modifikator-Wurf =====
// Zentral hier statt in jeder Aufrufstelle (missions.ts/events.ts/groupOps.ts/raids.ts/
// simulator.ts) dupliziert, damit alle vier Missionsarten garantiert dieselbe Logik nutzen.

export function pickWaveProfile(contextKey: string): WaveProfile {
  const weights = WAVE_PROFILE_WEIGHTS[contextKey] || { schwarm: 1 };
  const entries = Object.entries(weights) as [WaveProfile, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [profile, w] of entries) {
    if (roll < w) return profile;
    roll -= w;
  }
  return entries[entries.length - 1][0];
}

function weightsForProfile(profile: WaveProfile, poolLength: number): number[] {
  if (profile === 'elitekader') return Array.from({ length: poolLength }, (_, i) => 1 / (poolLength - i));
  if (profile === 'kampfgruppe') return Array.from({ length: poolLength }, () => 1);
  return Array.from({ length: poolLength }, (_, i) => 1 / (i + 1)); // 'schwarm' - bisherige Standardkurve
}

export interface RolledWave {
  multiplier: number;
  outlier: 'schwach' | 'stark' | null;
}

/**
 * Wie rollMultiplier (Zufallswert aus der 3-Werte-Tabelle des Sektors/Kontexts), aber mit
 * zusaetzlicher, kontextabhaengiger Chance auf einen deutlichen AUSREISSER nach oben oder unten -
 * verhindert, dass sich Begegnungen immer nur zwischen denselben drei Werten bewegen.
 */
export function rollMultiplierWithOutlier(table: number[], contextKey: string): RolledWave {
  const base = table[Math.floor(Math.random() * table.length)];
  const outlierChance = WAVE_OUTLIER_CHANCE[contextKey] || 0;
  if (Math.random() < outlierChance) {
    const isHigh = Math.random() < 0.5;
    return { multiplier: base * (isHigh ? WAVE_OUTLIER_HIGH_FACTOR : WAVE_OUTLIER_LOW_FACTOR), outlier: isHigh ? 'stark' : 'schwach' };
  }
  return { multiplier: base, outlier: null };
}

/**
 * Wuerfelt, ob dieser Kampf einen der seltenen Kampf-Modifikatoren bekommt (siehe
 * BATTLE_MODIFIER_LABELS) - immer hoechstens einer, nie mehrere gleichzeitig.
 */
export function rollBattleModifier(contextKey: string): BattleModifierType | null {
  const chance = BATTLE_MODIFIER_CHANCE[contextKey] || 0;
  if (Math.random() >= chance) return null;
  const types = Object.keys(BATTLE_MODIFIER_LABELS) as BattleModifierType[];
  return types[Math.floor(Math.random() * types.length)];
}

export function generatePiratenFleet(targetPower: number, spionageLevel: number, profile: WaveProfile = 'schwarm'): Record<string, number> {
  const smoothing = Math.min(0.5, spionageLevel * 0.05);
  const pool = SHIPS.filter(
    (s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff' && !MULTI_TARGET_VOLLEY_SHIPS.has(s.id)
  ).map((s) => s.id);
  const baseWeights = weightsForProfile(profile, pool.length);
  const uniform = 1 / pool.length;
  const weights = baseWeights.map((w) => (1 - smoothing) * w + smoothing * uniform);
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateFallbackFleet(targetPower: number, profile: WaveProfile = 'schwarm'): Record<string, number> {
  const pool = SHIPS.filter(
    (s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff' && !MULTI_TARGET_VOLLEY_SHIPS.has(s.id)
  ).map((s) => s.id);
  const weights = weightsForProfile(profile, pool.length);
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateDefenseFleet(targetPower: number, spionageLevel: number): Record<string, number> {
  // Spezialverteidigung (Sentinel-/Ultimate-Kanone) MUSS ausgeschlossen werden, sonst tauchen sie
  // als normale Piraten-/Raid-Verteidigung auf (siehe Punkt 26 - gleiches Muster wie bei den
  // Salvenschiffen in generatePiratenFleet()/generateFallbackFleet() oben). Gigant-Schildkuppel
  // ebenfalls ausgeschlossen (Nutzerentscheidung: die "besonderen"/neuen Anlagen sollen bei
  // Piraten generell nicht vorkommen) - technisch waere sie ohnehin fast wirkungslos gewesen (NPC-
  // Kaempfe nutzen keinen eigenen Kuppel-Pool, computeDomeSharedPool() gilt nur fuer den
  // Heimatverteidiger bei Raids), aber sie haette trotzdem sinnlos Wuerfel-Gewicht von den
  // eigentlichen NPC-Einheiten abgezogen.
  const pool = DEFENSES.filter((d) => !MULTI_TARGET_VOLLEY_SHIPS.has(d.id) && d.id !== 'gigantschildkuppel').map((d) => d.id);
  const smoothing = Math.min(0.5, spionageLevel * 0.05);
  const uniform = 1 / pool.length;
  const weights = pool.map(() => (1 - smoothing) * Math.random() + smoothing * uniform);
  return generateCappedFleet(targetPower, pool, weights);
}

// ========== BOSS-GEFECHT: PIRATENADMIRAL (Sektor P10, siehe README Punkt 76) ==========
// Bewusst KEINE festen Werte (siehe Nutzer-Feedback: waeren mit wachsenden Flotten schnell
// trivial geworden) - skaliert wie die anderen Piraten-Sektoren mit der eingesetzten
// Flottenstaerke, nur konzentriert auf EINE zaehe Einheit + kleine Eskorte statt vieler
// schwacher Gegner.
const ADMIRAL_STAT_SHARE = 0.55; // Anteil der Gesamt-Zielstaerke, der auf den Admiral selbst entfaellt
// WICHTIG (nach Funktionstest korrigiert): eine rein panzerungslastige Verteilung wie beim
// Imperator (~97,6% Panzerung) macht den Admiral zu einem reinen Tank OHNE Gegenwehr - da ein
// einzelner Kampf bis zu 100 Runden dauern kann, wird ein Gegner ohne nennenswerte Offensive
// einfach ueber die Zeit leergeschossen, VOELLIG UNABHAENGIG von der Flottengroesse (getestet:
// selbst 100 Kreuzer + 25 Schlachtkreuzer mit kaum Forschung gewannen den allerersten Check
// muehelos). Fix: deutlich mehr Waffenanteil, damit der Admiral selbst genug zurückschlaegt, um
// eine unzureichende Flotte tatsaechlich zum Rueckzug zu zwingen, statt bloss auszuhalten.
const ADMIRAL_STAT_RATIO = { waffen: 0.14, schild: 0.05, panzerung: 0.81 };
// Eskorte bevorzugt WENIGE STARKE statt vieler schwacher Schiffe (Profil "elitekader" gewichtet
// das jeweils LETZTE Element im Pool am staerksten, siehe weightsForProfile()) - absichtlich nur
// grosse Schiffsklassen, keine Jaeger.
const ADMIRAL_ESCORT_POOL = ['schlachtschiff', 'schlachtkreuzer', 'zerstoerer', 'reaper'];

export function generateAdmiralEncounter(totalTargetPower: number): { npcShips: Record<string, number>; statsOverride: Record<string, CombatStats> } {
  const adminPower = totalTargetPower * ADMIRAL_STAT_SHARE;
  const escortPower = totalTargetPower * (1 - ADMIRAL_STAT_SHARE);

  const adminStats: CombatStats = {
    waffen: adminPower * ADMIRAL_STAT_RATIO.waffen,
    schild: adminPower * ADMIRAL_STAT_RATIO.schild,
    panzerung: adminPower * ADMIRAL_STAT_RATIO.panzerung,
  };

  const escortWeights = weightsForProfile('elitekader', ADMIRAL_ESCORT_POOL.length);
  const escort = generateCappedFleet(escortPower, ADMIRAL_ESCORT_POOL, escortWeights);

  return {
    npcShips: { [ADMIRAL_BOSS_ID]: 1, ...escort },
    statsOverride: { [ADMIRAL_BOSS_ID]: adminStats },
  };
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
  playerClass?: PlayerClass | null; // eigene Klasse des Beitragenden (Kampfbonus je Klasse), siehe getEffectiveStats()
  kampfBoostActive?: boolean; // eigener aktiver 24h-Kampf-Booster des Beitragenden (+20%), siehe isBoosterActive() in actions.ts
  shipModules?: Record<string, number>; // eigene Schiffs-Module des Beitragenden, siehe data/shipModules.ts
}

// Liefert das "Piraten-Forschungsobjekt": PIRATE_RESEARCH_SHARE (50%) des relevanten
// Forschungsstands, NIE Klassen-Bonus/Module/Kampf-Booster (die betreffen nur getEffectiveStats(),
// nicht dieses research-Objekt). Bei mehreren Beitragenden (contributions, z.B. Elite-Bollwerk
// oder Raid mit Verstaerkung/haltenden Flotten) zaehlt der DURCHSCHNITT aller Beteiligten
// (Nutzerentscheidung) - fehlt einer Contribution die eigene research (sollte praktisch nie
// vorkommen), faellt sie auf die uebergebene Basis-`research` zurueck, analog zu
// buildUnitsMultiOwner() oben.
export function computePirateResearch(research: Record<string, number>, contributions?: OwnedFleetContribution[]): Record<string, number> {
  let source = research;
  if (contributions && contributions.length > 0) {
    const researches = contributions.map((c) => c.research || research);
    const keys = new Set<string>();
    researches.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    const avg: Record<string, number> = {};
    keys.forEach((k) => {
      const sum = researches.reduce((acc, r) => acc + (r[k] || 0), 0);
      avg[k] = sum / researches.length;
    });
    source = avg;
  }
  const scaled: Record<string, number> = {};
  Object.keys(source).forEach((k) => (scaled[k] = (source[k] || 0) * PIRATE_RESEARCH_SHARE));
  return scaled;
}

function buildUnitsMultiOwner(
  contributions: OwnedFleetContribution[],
  fallbackStatsFn: (id: string) => CombatStats
): CombatUnit[] {
  const units: CombatUnit[] = [];
  contributions.forEach(({ ownerKey, ships, research, defenseCounts, playerClass, kampfBoostActive, shipModules }) => {
    const fn = (id: string) =>
      research ? getEffectiveStats(id, research, defenseCounts || {}, !!kampfBoostActive, playerClass || null, shipModules || {}) : fallbackStatsFn(id);
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
  crits: Record<string, number>;
  // Ausgeteilter Schaden PRO SCHUETZE (statKey) - fehlte bisher komplett, es gab nur dmgTaken
  // (erlittener Schaden), was faelschlich als "Beitrag zum Kampf" gelesen werden konnte, obwohl es
  // das Gegenteil misst. Wird bei jedem tatsaechlichen Treffer erhoeht, VOR Schild-/Ueberkill-
  // Reduktion (repraesentiert die rohe Feuerkraft, die der Schuetze eingesetzt hat).
  dmgDealt: Record<string, number>;
}

function emptyShotStats(): ShotStats {
  return { shotsFired: {}, hits: {}, rapidFireTriggers: {}, crits: {}, dmgDealt: {} };
}

// Bei Mehrspieler-Kaempfen (ownerKey gesetzt) muessen Statistiken pro BESITZER getrennt werden,
// nicht nur pro Schiffstyp - sonst wuerden zwei Spieler mit demselben Schiffstyp (z.B. beide
// "kreuzer") exakt dieselben aggregierten Werte fuer Schaden/Schuesse/etc. angezeigt bekommen,
// obwohl sie unterschiedlich viele Schiffe eingesetzt haben.
function statKey(u: CombatUnit): string {
  return u.ownerKey ? `${u.ownerKey}:${u.typeId}` : u.typeId;
}

// Wendet einen einzelnen Treffer (inkl. Schild-Pool-Absorption und Durchschlag-Kaskade) auf EIN
// Ziel an. Ausgelagert aus fireShots(), damit sowohl der normale Einzelziel-Fall als auch die
// Mehrfachziel-Salve (siehe MULTI_TARGET_VOLLEY_SHIPS) dieselbe Logik nutzen koennen.
// PERFORMANCE: haelt eine Liste aktuell lebender Ziele + eine Index-Zuordnung, damit eine
// gestorbene Einheit in O(1) entfernt werden kann (Swap-mit-letztem-Element-und-Pop), statt bei
// JEDEM einzelnen Schuss die komplette Zielliste neu zu durchsuchen (`targets.filter(t =>
// t.hpCur > 0)`). Bei grossen Flotten war genau diese Zeile die Hauptursache fuer extrem hohe
// Rechenlast (siehe README) - vorher O(Schuetzen x Schuesse x Zielanzahl) PRO RUNDE, jetzt
// O(Schuetzen x Schuesse) fuer die Zielauswahl selbst (die Entfernung beim Sterben ist O(1)).
// Die Reihenfolge der Liste ist dabei absichtlich NICHT stabil (Swap-Remove vertauscht Eintraege)
// - unproblematisch, da Zielauswahl ohnehin zufaellig erfolgt (pickRandom), nie nach Position.
class AliveTargetPool {
  private list: CombatUnit[];
  private indexOf = new Map<CombatUnit, number>();

  constructor(units: CombatUnit[]) {
    this.list = units.filter((u) => u.hpCur > 0);
    this.list.forEach((u, i) => this.indexOf.set(u, i));
  }

  get array(): CombatUnit[] {
    return this.list;
  }

  get size(): number {
    return this.list.length;
  }

  remove(unit: CombatUnit): void {
    const idx = this.indexOf.get(unit);
    if (idx === undefined) return; // bereits entfernt (z.B. Explosions-Check traf ein schon totes Ziel)
    const lastIdx = this.list.length - 1;
    const lastUnit = this.list[lastIdx];
    this.list[idx] = lastUnit;
    this.indexOf.set(lastUnit, idx);
    this.list.pop();
    this.indexOf.delete(unit);
  }
}

// PERFORMANCE: wie AliveTargetPool oben, aber zusaetzlich nach Schiffs-/Verteidigungstyp
// gruppiert - fuer die Kaskaden-Zielsuche bei Durchschlag-Ueberschussschaden in
// applyHitToTarget() (vorher `targets.filter(t => t.typeId === X && t.hpCur > 0)`, jedes Mal
// ein voller Array-Scan). Wird EINMAL pro fireShots()-Aufruf aufgebaut, bleibt ueber onKill()
// synchron zur flachen AliveTargetPool.
class AliveTargetsByType {
  private pools = new Map<string, AliveTargetPool>();

  constructor(units: CombatUnit[]) {
    const grouped = new Map<string, CombatUnit[]>();
    units.forEach((u) => {
      if (u.hpCur <= 0) return;
      const list = grouped.get(u.typeId);
      if (list) list.push(u);
      else grouped.set(u.typeId, [u]);
    });
    grouped.forEach((list, typeId) => this.pools.set(typeId, new AliveTargetPool(list)));
  }

  arrayFor(typeId: string): CombatUnit[] {
    return this.pools.get(typeId)?.array || [];
  }

  remove(unit: CombatUnit): void {
    this.pools.get(unit.typeId)?.remove(unit);
  }
}

function applyHitToTarget(
  target: CombatUnit,
  dmg: number,
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  targets: CombatUnit[],
  overkillFraction: number,
  targetsSharedShieldPool?: { remaining: number },
  onKill?: (unit: CombatUnit) => void,
  typedPool?: AliveTargetsByType
) {
  const MAX_CASCADE = 5;
  let currentTarget: CombatUnit | undefined = target;
  let remainingDmg = dmg;
  let cascadeSteps = 0;

  if (targetsSharedShieldPool && targetsSharedShieldPool.remaining > 0) {
    const absorbed = Math.min(remainingDmg, targetsSharedShieldPool.remaining);
    targetsSharedShieldPool.remaining -= absorbed;
    remainingDmg -= absorbed;
    if (remainingDmg <= 0) return;
  }

  while (remainingDmg > 0 && currentTarget && cascadeSteps < MAX_CASCADE) {
    cascadeSteps++;
    const shieldDmg = Math.min(remainingDmg, currentTarget.shieldCur);
    currentTarget.shieldCur -= shieldDmg;
    remainingDmg -= shieldDmg;
    if (shieldDmg > 0) {
      shieldDmgTakenTarget[statKey(currentTarget)] = (shieldDmgTakenTarget[statKey(currentTarget)] || 0) + shieldDmg;
    }
    if (remainingDmg <= 0) break;

    if (remainingDmg < currentTarget.hpCur) {
      currentTarget.hpCur -= remainingDmg;
      dmgTakenTarget[statKey(currentTarget)] = (dmgTakenTarget[statKey(currentTarget)] || 0) + remainingDmg;
      remainingDmg = 0;
    } else {
      dmgTakenTarget[statKey(currentTarget)] = (dmgTakenTarget[statKey(currentTarget)] || 0) + currentTarget.hpCur;
      const overflow = (remainingDmg - currentTarget.hpCur) * overkillFraction;
      currentTarget.hpCur = 0;
      onKill?.(currentTarget);
      if (overflow <= 0) break;
      const sameTypeAlive: CombatUnit[] = typedPool ? typedPool.arrayFor(currentTarget!.typeId) : targets.filter((t) => t.typeId === currentTarget!.typeId && t.hpCur > 0);
      if (sameTypeAlive.length === 0) break;
      currentTarget = sameTypeAlive[Math.floor(Math.random() * sameTypeAlive.length)];
      remainingDmg = overflow;
      continue;
    }
  }

  // Kritischer Treffer: eine schwer beschaedigte Einheit (unter 70% HP) hat eine mit dem
  // Schadensgrad steigende Chance, sofort komplett auszufallen ("explodiert").
  if (currentTarget && currentTarget.hpCur > 0 && currentTarget.hpCur < 0.7 * currentTarget.hpMax) {
    const pExplode = 1 - currentTarget.hpCur / currentTarget.hpMax;
    if (Math.random() < pExplode) {
      currentTarget.hpCur = 0;
      onKill?.(currentTarget);
    }
  }
}

// Ermittelt, ob ein Schuss tatsaechlich trifft. Zwei Huerden nacheinander:
// 1. Praezision des SCHUETZEN (trifft er ueberhaupt?)
// 2. Ausweichen des ZIELS (kann es sich noch entziehen?)
// Wichtig: `researchTarget` muss IMMER die Forschung der ZIEL-Seite sein (Spieler-Forschung, wenn
// das Ziel ein Spieler ist; das bereits vorskalierte Piraten-research, wenn das Ziel ein NPC ist)
// - NICHT die Forschung des Schuetzen. Seit PIRATE_RESEARCH_SHARE ist das nicht mehr automatisch
// dasselbe Objekt wie beim Schuetzen (siehe fireShots()-Aufrufe in runRounds()).
function rollHit(
  target: CombatUnit,
  precision: number,
  researchTarget: Record<string, number>,
  targetIsPlayerUnit: boolean,
  battleModifier: BattleModifierType | null = null
): boolean {
  if (Math.random() >= precision) return false;
  let evasion = getEvasionChance(researchTarget, targetIsPlayerUnit, target.typeId);
  // Truemmerfeld schwaecht gezielt das Ausweichen des SPIELERS, nicht das der NPCs.
  if (battleModifier === 'truemmerfeld' && targetIsPlayerUnit) evasion *= 0.85;
  if (evasion > 0 && Math.random() < evasion) return false;
  return true;
}

function fireShots(
  shooters: CombatUnit[],
  targets: CombatUnit[],
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  applyPlayerResearch: boolean,
  researchShooter: Record<string, number>,
  researchTarget: Record<string, number>,
  shooterStats: ShotStats,
  targetsSharedShieldPool?: { remaining: number },
  battleModifier: BattleModifierType | null = null
) {
  if (targets.length === 0) return;
  const MAX_SHOTS_PER_UNIT = 50;
  const overkillFraction = getDurchschlagFraction(researchShooter);
  // Einmal pro fireShots()-Aufruf aufgebaut (nicht pro Schuss!) - siehe AliveTargetPool/
  // AliveTargetsByType oben. Nur bei Durchschlag-Forschung > 0 lohnt sich der zusaetzliche
  // Aufwand fuer die typisierte Pool ueberhaupt (Kaskaden treten sonst nie auf).
  const alivePool = new AliveTargetPool(targets);
  const typedPool = overkillFraction > 0 ? new AliveTargetsByType(targets) : undefined;
  const onKill = (unit: CombatUnit) => {
    alivePool.remove(unit);
    typedPool?.remove(unit);
  };

  shooters.forEach((shooter) => {
    let shots = 1;
    let fired = 0;
    // Praezision und Krit-Chance haengen vom SCHIFFSTYP des Schuetzen ab (kleine Schiffe treffen
    // besser, grosse richten oefter kritischen Schaden an) - daher pro Schuetze berechnet.
    let precision = getPrecisionChance(researchShooter, applyPlayerResearch, shooter.typeId);
    let critChance = getCritChance(researchShooter, applyPlayerResearch, shooter.typeId);
    const rfMap = RAPIDFIRE[shooter.typeId] || {};
    const hasRFPotential = Object.keys(rfMap).length > 0;
    let accuracy = hasRFPotential ? getZielerfassungAccuracy(researchShooter, shooter.typeId) : 0;

    // Kampf-Modifikatoren (siehe BATTLE_MODIFIER_LABELS, combatConstants.ts) - Nebel/
    // Sensorstoerung schwaechen gezielt den SPIELER als Schuetzen, Strahlungssturm verstaerkt
    // gezielt den GEGNER als Schuetzen. Immer nur einer aktiv, nie mehrere gleichzeitig.
    if (battleModifier === 'nebel' && applyPlayerResearch) precision *= 0.85;
    if (battleModifier === 'sensorstoerung' && applyPlayerResearch) accuracy *= 0.8;
    if (battleModifier === 'strahlungssturm' && !applyPlayerResearch) critChance = Math.min(1, critChance * 1.5);

    while (shots > 0 && fired < MAX_SHOTS_PER_UNIT) {
      shots--;
      fired++;
      shooterStats.shotsFired[statKey(shooter)] = (shooterStats.shotsFired[statKey(shooter)] || 0) + 1;

      const aliveTargets = alivePool.array;
      if (alivePool.size === 0) break;

      let target: CombatUnit;
      let volleyTargets: CombatUnit[] | null = null;
      if (hasRFPotential && Math.random() < accuracy) {
        const rfPool = aliveTargets.filter((t) => rfMap[t.typeId] !== undefined);
        if (rfPool.length > 0) {
          if (MULTI_TARGET_VOLLEY_SHIPS.has(shooter.typeId)) {
            // Mehrfachziel-Salve: ein Treffer PRO anfaelligem Schiffstyp, der gerade praesent ist
            // (nicht pro Einzeleinheit) - je ein Vertreter pro Typ wird ausgewaehlt.
            const seenTypes = new Set<string>();
            volleyTargets = [];
            for (const t of rfPool) {
              if (!seenTypes.has(t.typeId)) {
                seenTypes.add(t.typeId);
                volleyTargets.push(t);
              }
            }
          }
          target = pickRandom(rfPool);
        } else {
          target = pickRandom(aliveTargets);
        }
      } else {
        target = pickRandom(aliveTargets);
      }

      if (volleyTargets && volleyTargets.length > 0) {
        // Fuer jeden betroffenen Typ ein eigener Treffer/Verfehlen-Wurf, unabhaengig voneinander.
        let anyHit = false;
        volleyTargets.forEach((vt) => {
          if (!rollHit(vt, precision, researchTarget, !applyPlayerResearch, battleModifier)) {
            const missRfChance = getRapidFireChance(shooter.typeId, vt.typeId);
            if (missRfChance > 0 && Math.random() < missRfChance) {
              shots++;
              shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
            }
            return;
          }
          anyHit = true;
          const isCrit = critChance > 0 && Math.random() < critChance;
          if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
          const dmg = shooter.waffen * (isCrit ? CRIT_DAMAGE_MULTIPLIER : 1);
          shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
          applyHitToTarget(vt, dmg, dmgTakenTarget, shieldDmgTakenTarget, targets, overkillFraction, targetsSharedShieldPool, onKill, typedPool);
          const hitRfChance = getRapidFireChance(shooter.typeId, vt.typeId);
          if (hitRfChance > 0 && Math.random() < hitRfChance) {
            shots++;
            shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
          }
        });
        if (anyHit) shooterStats.hits[statKey(shooter)] = (shooterStats.hits[statKey(shooter)] || 0) + 1;
        continue;
      }

      if (!rollHit(target, precision, researchTarget, !applyPlayerResearch, battleModifier)) {
        const missRfChance = getRapidFireChance(shooter.typeId, target.typeId);
        if (missRfChance > 0 && Math.random() < missRfChance) {
          shots++;
          shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
        }
        continue;
      }

      shooterStats.hits[statKey(shooter)] = (shooterStats.hits[statKey(shooter)] || 0) + 1;
      const isCrit = critChance > 0 && Math.random() < critChance;
      if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
      const dmg = shooter.waffen * (isCrit ? CRIT_DAMAGE_MULTIPLIER : 1);
      shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
      applyHitToTarget(target, dmg, dmgTakenTarget, shieldDmgTakenTarget, targets, overkillFraction, targetsSharedShieldPool, onKill, typedPool);
      const hitRfChance = getRapidFireChance(shooter.typeId, target.typeId);
      if (hitRfChance > 0 && Math.random() < hitRfChance) {
        shots++;
        shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
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
  retreated: boolean;
  remainingSharedShieldPoolA: number;
  replay: CombatReplay;
}

// Kern der Kampf-Simulation, unabhaengig davon ob Seite A einem einzelnen Spieler gehoert
// (resolveCombat) oder mehreren Spielern gemeinsam (resolveCombatMultiOwner).
function runRounds(
  unitsAIn: CombatUnit[],
  unitsBIn: CombatUnit[],
  research: Record<string, number>,
  pirateResearch: Record<string, number>,
  sharedShieldPoolA = 0,
  allowRetreat = true,
  battleModifier: BattleModifierType | null = null
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
  let retreated = false;
  // Kampfkraft-Basis fuer den Rueckzug statt reiner Stueckzahl (siehe unten) - waffen+schild+panzerung
  // je Einheit, identische Definition wie combatFleetPower()/homePower in raids.ts.
  function unitPower(u: CombatUnit): number {
    return u.waffen + u.shieldMax + u.hpMax;
  }
  const initialPowerA = unitsA.reduce((sum, u) => sum + unitPower(u), 0);
  // Ab welchem Anteil verbliebener KAMPFKRAFT (nicht Stueckzahl - eine Flotte aus vielen billigen
  // Jaegern + wenigen teuren Kapitalschiffen wuerde sonst schon beim Verlust der zahlenmaessig
  // dominanten, aber wertmaessig unbedeutenden Jaeger faelschlich als "aussichtslos" gelten, obwohl
  // die eigentliche Staerke der Flotte noch unversehrt ist) zieht sich Seite A (Spieler-Flotte)
  // zurueck, statt bis zur voelligen Vernichtung weiterzukaempfen. Gilt nicht fuer Seite B (NPCs)
  // und nicht fuer reine Verteidigungsanlagen (koennen nicht "fliehen"), sondern nur fuer die
  // kombinierte Kampfkraft der gesamten Seite A.
  const RETREAT_THRESHOLD = 0.5;

  // ---- Rundenverlauf fuer die spaetere Visualisierung aufzeichnen ----
  // Typ-Reihenfolge einmalig festlegen (Zaehlungen beziehen sich immer auf diese Reihenfolge).
  const typesA = Array.from(new Set(unitsA.map((u) => u.typeId)));
  const typesB = Array.from(new Set(unitsB.map((u) => u.typeId)));
  const roundsA: number[][] = [];
  const roundsB: number[][] = [];
  const MAX_SNAPSHOTS = 30;
  function countByType(units: CombatUnit[], types: string[]): number[] {
    const counts = new Map<string, number>();
    units.forEach((u) => counts.set(u.typeId, (counts.get(u.typeId) || 0) + 1));
    return types.map((t) => counts.get(t) || 0);
  }
  // Startzustand als erster Eintrag
  roundsA.push(countByType(unitsA, typesA));
  roundsB.push(countByType(unitsB, typesB));

  // Schild-Regeneration wird pro Einheitstyp berechnet (grosse Schiffe/Verteidigungsanlagen laden
  // deutlich staerker auf) - daher hier vorab je vorkommendem Typ zwischenspeichern, statt bei
  // jeder Einheit in jeder Runde neu zu rechnen.
  const regenCacheA = new Map<string, number>();
  const regenCacheB = new Map<string, number>();
  function regenFor(typeId: string, isPlayerSide: boolean): number {
    const cache = isPlayerSide ? regenCacheA : regenCacheB;
    let v = cache.get(typeId);
    if (v === undefined) {
      // Piraten bekommen jetzt PIRATE_RESEARCH_SHARE der Forschung (siehe computePirateResearch())
      // statt komplett uebersprungen zu werden - getShieldRegenRate() liest das schon vorskalierte
      // pirateResearch-Objekt hier ganz normal aus, keine Sonderformel mehr noetig.
      v = getShieldRegenRate(isPlayerSide ? research : pirateResearch, typeId);
      // Ionensturm schwaecht gezielt die Schild-Regeneration des SPIELERS, nicht die der NPCs.
      if (battleModifier === 'ionensturm' && isPlayerSide) v *= 0.8;
      cache.set(typeId, v);
    }
    return v;
  }
  // Der Kuppel-Pool nutzt weiterhin die reine Spieler-Rate (Kuppeln sind Verteidigungsanlagen,
  // deren eigener Modifikator steckt bereits in ihrem Beitrag zum Pool). Ionensturm wirkt auch hier,
  // da der Pool ausschliesslich Seite A (Spieler) gehoert.
  const poolRegen = getShieldRegenRate(research) * (battleModifier === 'ionensturm' ? 0.8 : 1);
  // Gemeinsamer Kuppel-Schild-Pool fuer Seite A (nur relevant bei Heimatverteidigung mit
  // Schildkuppeln) - faengt Schaden fuer die GESAMTE Seite ab, bevor einzelne Anlagen getroffen
  // werden. Regeneriert sich zwischen den Runden mit derselben Rate wie normale Schilde.
  const poolA = { remaining: sharedShieldPoolA };

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    if (unitsA.length === 0 || unitsB.length === 0) break;
    roundsFought = round;
    fireShots(unitsA, unitsB, dmgTakenB, shieldDmgTakenB, true, research, pirateResearch, shotsA, undefined, battleModifier);
    fireShots(unitsB, unitsA, dmgTakenA, shieldDmgTakenA, false, pirateResearch, research, shotsB, poolA, battleModifier);
    unitsA = unitsA.filter((u) => u.hpCur > 0);
    unitsB = unitsB.filter((u) => u.hpCur > 0);
    unitsA.forEach((u) => {
      const before = u.shieldCur;
      u.shieldCur = Math.min(u.shieldMax, u.shieldCur + u.shieldMax * regenFor(u.typeId, true));
      shieldRegenA[statKey(u)] = (shieldRegenA[statKey(u)] || 0) + (u.shieldCur - before);
    });
    unitsB.forEach((u) => {
      const before = u.shieldCur;
      u.shieldCur = Math.min(u.shieldMax, u.shieldCur + u.shieldMax * regenFor(u.typeId, false));
      shieldRegenB[statKey(u)] = (shieldRegenB[statKey(u)] || 0) + (u.shieldCur - before);
    });
    if (sharedShieldPoolA > 0) {
      poolA.remaining = Math.min(sharedShieldPoolA, poolA.remaining + sharedShieldPoolA * poolRegen);
    }
    // Zustand nach dieser Runde festhalten (fuer die Visualisierung im Kampfbericht)
    roundsA.push(countByType(unitsA, typesA));
    roundsB.push(countByType(unitsB, typesB));
    // Rueckzug nur, wenn ueberhaupt noch Feinde uebrig sind: Fallen in derselben Runde der letzte
    // Gegner UND die eigene Truppe unter die Schwelle, ist der Kampf GEWONNEN - dann waere ein
    // "Rueckzug" sowohl unlogisch als auch im Bericht irrefuehrend ("Rueckzug" trotz Sieg).
    if (allowRetreat && unitsB.length > 0 && initialPowerA > 0 && unitsA.length > 0) {
      const currentPowerA = unitsA.reduce((sum, u) => sum + unitPower(u), 0);
      if (currentPowerA / initialPowerA <= RETREAT_THRESHOLD) {
        retreated = true;
        break;
      }
    }
  }

  // Bei langen Kaempfen abtasten, damit der gespeicherte Verlauf kompakt bleibt: Start und Ende
  // bleiben immer erhalten, dazwischen wird gleichmaessig ausgeduennt.
  function sample<T>(arr: T[]): T[] {
    if (arr.length <= MAX_SNAPSHOTS) return arr;
    const step = (arr.length - 1) / (MAX_SNAPSHOTS - 1);
    const out: T[] = [];
    for (let i = 0; i < MAX_SNAPSHOTS; i++) out.push(arr[Math.round(i * step)]);
    return out;
  }
  const replay = {
    typesA,
    typesB,
    roundsA: sample(roundsA),
    roundsB: sample(roundsB),
    totalRounds: roundsFought,
  };

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
    retreated,
    remainingSharedShieldPoolA: poolA.remaining,
    replay,
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
  retreated: boolean;
  remainingSharedShieldPoolA: number;
  replay: CombatReplay;
}

/**
 * Loest einen Kampf zwischen zwei Seiten auf. Seite A ist konventionsgemaess immer die
 * "Spieler-Seite" (volle Forschung), Seite B die NPC-Seite (bekommt seit PIRATE_RESEARCH_SHARE
 * einen Teil der Forschung, siehe computePirateResearch() - NIE Klassen-Bonus/Module/Booster).
 *
 * `statsFnA`/`statsFnB` liefern die effektiven Kampfwerte je Einheiten-Id (siehe getEffectiveStats/baseStats).
 */
export function resolveCombat(
  sideAShips: Record<string, number>,
  statsFnA: (id: string) => CombatStats,
  sideBShips: Record<string, number>,
  statsFnB: (id: string) => CombatStats,
  research: Record<string, number>,
  sharedShieldPoolA = 0,
  allowRetreat = true,
  battleModifier: BattleModifierType | null = null
): CombatResult {
  const unitsA0 = buildUnits(sideAShips, statsFnA);
  const unitsB0 = buildUnits(sideBShips, statsFnB);
  const pirateResearch = computePirateResearch(research);
  const r = runRounds(unitsA0, unitsB0, research, pirateResearch, sharedShieldPoolA, allowRetreat, battleModifier);

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
    retreated: r.retreated,
    remainingSharedShieldPoolA: r.remainingSharedShieldPoolA,
    replay: r.replay,
  };
}

export interface MultiOwnerCombatResult extends CombatResult {
  // ownerKey -> typeId -> Anzahl Ueberlebender (fuer die faire Rueckgabe der Schiffe an die
  // jeweiligen Beitragenden bei Gruppen-Operationen/Raid-Verstaerkung)
  survivorsByOwner: Record<string, Record<string, number>>;
}

/**
 * Wie resolveCombat, aber Seite A besteht aus mehreren Beitraegen unterschiedlicher Spieler
 * (Gruppen-Expeditionen, Raid-Verstaerkung). Jede Einheit wird intern mit
 * ihrem Besitzer markiert, damit am Ende jeder Spieler exakt seine eigenen ueberlebenden Schiffe
 * zurueckbekommt (basierend auf dem tatsaechlichen Simulationsergebnis, nicht auf einer Schaetzung).
 */
export function resolveCombatMultiOwner(
  contributions: OwnedFleetContribution[],
  statsFnA: (id: string) => CombatStats,
  sideBShips: Record<string, number>,
  statsFnB: (id: string) => CombatStats,
  research: Record<string, number>,
  sharedShieldPoolA = 0,
  allowRetreat = true,
  battleModifier: BattleModifierType | null = null
): MultiOwnerCombatResult {
  const unitsA0 = buildUnitsMultiOwner(contributions, statsFnA);
  const unitsB0 = buildUnits(sideBShips, statsFnB);
  const pirateResearch = computePirateResearch(research, contributions);
  const r = runRounds(unitsA0, unitsB0, research, pirateResearch, sharedShieldPoolA, allowRetreat, battleModifier);

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
    retreated: r.retreated,
    remainingSharedShieldPoolA: r.remainingSharedShieldPoolA,
    replay: r.replay,
  };
}
