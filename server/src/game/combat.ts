import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import {
  RAPIDFIRE,
  ZIELERFASSUNG_BASE,
  SHIELD_REGEN_BASE_BY_CLASS,
  SHIELD_REGEN_DEFAULT_BASE,
  SHIELD_REGEN_MAX,
  PRECISION_BASE,
  PRECISION_MAX_PLAYER,
  MAX_ROUNDS,
  EXPLOSION_HP_THRESHOLD,
  EXPLOSION_CHANCE_EXPONENT,
  MULTI_TARGET_VOLLEY_SHIPS,
  PRECISION_MODIFIER,
  EVASION_BASE,
  EVASION_MAX,
  EVASION_MAX_SIZE_MISMATCH,
  SHIP_SIZE_CLASS,
  SIZE_MISMATCH_EVASION_BONUS,
  CRIT_CHANCE_BASE,
  CRIT_CHANCE_MAX,
  CRIT_DAMAGE_MULTIPLIER_BY_CLASS,
  CRIT_DAMAGE_DEFAULT_MULTIPLIER,
  PIRATE_RESEARCH_SHARE,
  WAVE_PROFILE_WEIGHTS,
  WAVE_OUTLIER_CHANCE,
  WAVE_OUTLIER_LOW_FACTOR,
  WAVE_OUTLIER_HIGH_FACTOR,
  BATTLE_MODIFIER_CHANCE,
  BATTLE_MODIFIER_LABELS,
  MULTI_TARGET_POWER_CORRECTION,
  FLEET_SIZE_BONUS_CAP,
  FLEET_SIZE_BONUS_RATE,
  stackAggregateThresholdFor,
} from './data/combatConstants.js';
import type { WaveProfile, BattleModifierType } from './data/combatConstants.js';
import { ADMIRAL_BOSS_ID } from './data/combatConstants.js';
import { NPC_SPECIALS, KAMPF_BOOST_MULTIPLIER } from './data/economy.js';
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

// Punkte-Gewichtung pro Einheit (Nutzerentscheidung Juli 2026, siehe stats.ts) - urspruenglich nur
// fuer vernichtete Gegner gedacht (statt pauschal 1 Punkt pro Einheit soll ein teurer/gefaehrlicher
// Gegner wie ein Reaper deutlich mehr Punkte bringen als ein billiger Leichter Jaeger), inzwischen
// auch fuer die "Gesamtmacht"-Bewertung der EIGENEN Flotte/Verteidigung wiederverwendet (siehe
// calculateFleetPowerPoints() in stats.ts) - derselbe Wert soll fuer beide Richtungen gelten.
// Leitet den Punktwert aus den Baukosten her (Metall+Kristall+Deuterium summiert, wie auch sonst
// im Projekt ueblich, siehe Punkt 22 README) statt fixer Werte pro Schiffstyp - so muss bei neuen
// Schiffen/Verteidigungsanlagen nichts hier nachgepflegt werden. UNIT_POINT_COST_SCALE ist so
// gewaehlt, dass ein Leichter Jaeger (Kosten 120.000) genau 1 Punkt ergibt.
// Salvenschiffe tauchen zwar NIE als Gegner auf (aus generatePiratenFleet() ausgeschlossen), haben
// aber normale Baukosten und werden ueber die Formel korrekt gewichtet, wenn sie der EIGENEN Flotte
// gehoeren. Sentinel-/Ultimate-Kanone/Gigant-Schildkuppel ebenso. Einheiten OHNE Baukosten
// (Piratenkapitaen/-admiral als reine Bosse, Imperator als teileCost-basiertes Unikat) bekommen
// einen manuell festgelegten Punktwert.
export const UNIT_POINT_COST_SCALE = 100000;
const UNIT_POINT_OVERRIDES: Record<string, number> = {
  piratenkapitan: 25,
  piratenadmiral: 500,
  imperator: 1500,
};

export function getUnitPointValue(unitId: string): number {
  if (UNIT_POINT_OVERRIDES[unitId] !== undefined) return UNIT_POINT_OVERRIDES[unitId];
  const ship = findShip(unitId);
  const def = findDefense(unitId);
  const cost = ship?.cost ?? def?.cost;
  if (!cost) return 1;
  const totalCost = cost.metall + cost.kristall + cost.deuterium;
  return Math.max(1, Math.round(totalCost / UNIT_POINT_COST_SCALE));
}

export function shipPowerBase(id: string): number {
  const s = baseStats(id);
  return s.waffen + s.schild + s.panzerung;
}

// Nutzerentscheidung (Juli 2026): der Piratenkapitaen war mit seinen statischen NPC_SPECIALS-
// Werten (economy.ts) viel zu schwach, um in einer Welle mit vielen anderen Gegnern ueberhaupt
// aufzufallen - er starb praktisch immer sofort, ohne die Extra-Container-/DM-Belohnung fuer den
// Spieler spuerbar zu machen. Ersetzt die statischen Werte gestaffelt nach Sektorstufe (per
// sideBStatsOverride an den Kampf-Worker durchgereicht, siehe missions.ts/groupOps.ts) - auf
// Hoch/Elite-Bollwerk jetzt exakt auf Imperator-Niveau (dynamisch von dort uebernommen, bleibt
// so automatisch synchron, falls der Imperator kuenftig nochmal angepasst wird).
export function captainStatsForSektor(sektorId: string): CombatStats {
  if (sektorId === 'piraten_niedrig') return { waffen: 25000, schild: 20000, panzerung: 250000 };
  if (sektorId === 'piraten_mittel') return { waffen: 100000, schild: 80000, panzerung: 900000 };
  return findShip('imperator')!.stats;
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

// Schild-Regeneration ist klassenabhaengig: jede Schiffsklasse hat einen festen Basiswert
// (SHIELD_REGEN_BASE_BY_CLASS), auf den nur noch der Forschungsbonus addiert wird.
export function getShieldRegenRate(research: Record<string, number>, typeId?: string): number {
  const level = research.schildregeneration || 0;
  const tech = RESEARCH.find((r) => r.id === 'schildregeneration');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  const base = typeId ? SHIELD_REGEN_BASE_BY_CLASS[typeId] ?? SHIELD_REGEN_DEFAULT_BASE : SHIELD_REGEN_DEFAULT_BASE;
  return Math.max(0, Math.min(SHIELD_REGEN_MAX, base + bonus));
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
// `shooterTypeId` (optional): ermoeglicht den Groessen-Fehlpaarung-Bonus (SIZE_MISMATCH_EVASION_BONUS)
// - kleine Schiffe (Jaeger) weichen grossen/Elite-/Spezialschiffen gezielt aus (Tank-/Ausweichrolle,
// siehe README), Kreuzer moderat. Kaempfe zwischen aehnlich grossen Schiffen bleiben beim Basiswert
// (kein Bonus, falls Verteidiger/Schuetze keiner Groessenklasse zugeordnet sind oder keine
// definierte Paarung existiert).
export function getEvasionChance(research: Record<string, number>, applyPlayerResearch: boolean, typeId: string, shooterTypeId?: string): number {
  const base = EVASION_BASE[typeId] || 0;
  if (base <= 0) return 0; // Verteidigungsanlagen & Kapitalschiffe ohne Basis-Ausweichen
  const level = research.ausweichen || 0;
  const tech = RESEARCH.find((r) => r.id === 'ausweichen');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  const defenderClass = SHIP_SIZE_CLASS[typeId];
  const shooterClass = shooterTypeId ? SHIP_SIZE_CLASS[shooterTypeId] : undefined;
  const mismatchBonus = defenderClass && shooterClass ? SIZE_MISMATCH_EVASION_BONUS[defenderClass]?.[shooterClass] || 0 : 0;
  const cap = mismatchBonus > 0 ? EVASION_MAX_SIZE_MISMATCH : EVASION_MAX;
  return Math.min(cap, base + bonus + mismatchBonus);
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

// Klassenabhaengiger Kritischer-Schaden-Multiplikator des SCHUETZEN (siehe CRIT_DAMAGE_MULTIPLIER_BY_CLASS).
export function getCritDamageMultiplier(typeId: string): number {
  return CRIT_DAMAGE_MULTIPLIER_BY_CLASS[typeId] ?? CRIT_DAMAGE_DEFAULT_MULTIPLIER;
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
  const kampfBoost = kampfBoostActive ? KAMPF_BOOST_MULTIPLIER : 1;
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
 * und (nur bei Verteidigung) Schildkuppel-Bonus. `kampfBoostActive` entspricht dem 24h-Kampf-Booster (siehe KAMPF_BOOST_MULTIPLIER in economy.ts).
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
  const kampfBoost = kampfBoostActive ? KAMPF_BOOST_MULTIPLIER : 1;
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

// Jaeger-Klassen (leicht/schwer), gegen die praktisch jede NPC-Einheit RapidFire hat - Piraten
// bestehen ueberwiegend selbst aus genau diesen Klassen (siehe weightsForProfile(), 'schwarm'-
// Profil gewichtet Tier-1/2-Schiffe stark), weshalb eine SYMMETRISCHE Absenkung auch die eigene
// Effektivitaet beim Raeumen von Piraten-Jaeger-Schwaermen geschwaecht haette. Stattdessen NUR
// abgesenkt, wenn der SCHUETZE ein NPC ist (Nutzerentscheidung Juli 2026) - eigene Schiffe
// behalten vollen RF-Bonus gegen Piraten-Jaeger.
const NPC_RF_REDUCED_TARGETS = new Set(['leicht', 'schwer']);
const NPC_RF_VS_JAEGER_FACTOR = 0.5;

export function getRapidFireChance(attackerId: string, defenderId: string, attackerIsPlayer = true): number {
  const rfValue = RAPIDFIRE[attackerId]?.[defenderId] || 0;
  if (rfValue === 0) return 0;
  const chance = (rfValue - 1) / rfValue;
  if (!attackerIsPlayer && NPC_RF_REDUCED_TARGETS.has(defenderId)) return chance * NPC_RF_VS_JAEGER_FACTOR;
  return chance;
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

type RollTableEntry = number | [number, number];

function resolveRollEntry(entry: RollTableEntry): number {
  return Array.isArray(entry) ? entry[0] + Math.random() * (entry[1] - entry[0]) : entry;
}

// 50/30/20-Zufallsprinzip (Nutzerentscheidung, Neugestaltung 04.08.2026): jeder einzelne
// Kampf-Check wuerfelt mit fester Gewichtung (50% / 30% / 20%) einen der drei Tabellenwerte, statt
// gleichverteilt (je 1/3) wie vorher - siehe PIRATEN_MULTIPLIER_ROLL/RAID_WAVE_FACTORS. Der dritte
// Eintrag kann eine Spanne [min, max] sein (z.B. piraten_hoch), wird dann gleichverteilt darin
// gewuerfelt.
export function pick503020(table: RollTableEntry[]): number {
  const roll = Math.random();
  const entry = roll < 0.5 ? table[0] : roll < 0.8 ? table[1] : table[2];
  return resolveRollEntry(entry);
}

/**
 * Wie rollMultiplier (Zufallswert aus der 3-Werte-Tabelle des Sektors/Kontexts), aber mit
 * zusaetzlicher, kontextabhaengiger Chance auf einen deutlichen AUSREISSER nach oben oder unten -
 * verhindert, dass sich Begegnungen immer nur zwischen denselben drei Werten bewegen.
 * Nutzt das 50/30/20-Gewichtungsprinzip (pick503020) fuer alle Kontexte AUSSER dem Piratenadmiral
 * (P10, contextKey 'piraten_admiral') - der bleibt bewusst bei der alten Gleichverteilung, siehe
 * Plan "Der Piratenadmiral bleibt von dieser Aenderung unberuehrt".
 */
export function rollMultiplierWithOutlier(table: RollTableEntry[], contextKey: string): RolledWave {
  const base = contextKey === 'piraten_admiral'
    ? resolveRollEntry(table[Math.floor(Math.random() * table.length)])
    : pick503020(table);
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

/**
 * Belohnungs-Multiplikator fuer groesser als sektortypisch eingesetzte Macht (siehe
 * FLEET_SIZE_BONUS_CAP/-RATE in combatConstants.ts). `referencePower` ist der sektortypische
 * Bezugswert (i.d.R. cfg.npcFloor bzw. RAID_MIN_TARGET_POWER) - erst OBERHALB davon gibt es
 * ueberhaupt einen Aufschlag, darunter/gleich bleibt es beim normalen 1x. Logarithmisch statt
 * linear, damit der Bonus bei realistischen Groessenordnungen (2-3x mehr Macht) bereits spuerbar
 * ist, aber nicht ins Unermessliche waechst - siehe FLEET_SIZE_BONUS_CAP fuer die harte Grenze.
 */
export function fleetSizeRewardMultiplier(sentPower: number, referencePower: number): number {
  if (referencePower <= 0 || sentPower <= referencePower) return 1;
  const ratio = sentPower / referencePower;
  return 1 + Math.min(FLEET_SIZE_BONUS_CAP, FLEET_SIZE_BONUS_RATE * Math.log10(ratio));
}

export function generatePiratenFleet(targetPower: number, spionageLevel: number, profile: WaveProfile = 'schwarm'): Record<string, number> {
  const smoothing = Math.min(0.5, spionageLevel * 0.05);
  const pool = SHIPS.filter(
    (s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff' && s.id !== 'spionagesonde' && !MULTI_TARGET_VOLLEY_SHIPS.has(s.id)
  ).map((s) => s.id);
  const baseWeights = weightsForProfile(profile, pool.length);
  const uniform = 1 / pool.length;
  const weights = baseWeights.map((w) => (1 - smoothing) * w + smoothing * uniform);
  return generateCappedFleet(targetPower, pool, weights);
}

export function generateFallbackFleet(targetPower: number, profile: WaveProfile = 'schwarm'): Record<string, number> {
  const pool = SHIPS.filter(
    (s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff' && s.id !== 'spionagesonde' && !MULTI_TARGET_VOLLEY_SHIPS.has(s.id)
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

// ===== Aggregat-Stapel fuer sehr grosse Stueckzahlen (siehe stackAggregateThresholdFor()) =====
// Ein Stapel EINES Typs mit mehr als seiner klassenspezifischen Schwelle wird NICHT mehr als
// einzelne CombatUnit-Objekte gefuehrt (das war bei mehreren tausend Schiffen der Hauptgrund fuer
// mehrminuetige Kampfberechnungen, siehe README Punkt 102/103), sondern als EIN aggregierter Pool:
// `shieldPoolCur`/`hpPoolCur` sind die Summe ueber alle noch lebenden Einheiten dieses Typs
// (analog zum bereits bestehenden gemeinsamen Schildkuppel-Pool `poolA`, nur pro Schiffstyp statt
// nur fuer Kuppeln). Schaden wird direkt vom Pool abgezogen statt einzelne Objekte zu durchsuchen -
// Rechenzeit haengt dadurch nur noch von der ANZAHL VERSCHIEDENER TYPEN ab, nicht mehr von der
// Gesamt-Stueckzahl. `ownerShares` (nur bei Mehrspieler-Beitraegen mehrerer Spieler DESSELBEN Typs)
// haelt den Anteil jedes Beitragenden fest, um Verluste am Ende proportional zuzurechnen.
interface AggregateStack {
  typeId: string;
  waffen: number; // pro Einheit
  shieldMax: number; // pro Einheit
  shieldPoolCur: number;
  hpMax: number; // pro Einheit (Panzerung)
  hpPoolCur: number; // NUR der noch aktiv kaempfende Anteil (zurueckgezogene Einheiten siehe retreatedHpPool)
  initialHpPool: number; // fuer den Rueckzugs-Schwellenwert (Anteil vom Start-Bestand)
  retreatedHpPool: number; // HP-Aequivalent bereits zurueckgezogener (ueberlebender, aber nicht mehr kaempfender) Einheiten
  active: boolean; // false = Stapel komplett aufgeloest (vernichtet+zurueckgezogen), kaempft nicht mehr mit
  ownerShares?: Record<string, number>; // ownerKey -> Anteil (0..1), nur bei Mehrspieler-Aggregaten
}

// Nur der aktiv kaempfende Anteil - fuer Zielauswahl/Beschuss/Schild-Regen/Replay waehrend des
// Kampfes (zurueckgezogene Einheiten kaempfen nicht mehr mit, genau wie bei einzelnen Schiffen).
function aggAliveCount(a: AggregateStack): number {
  return a.hpPoolCur > 0 ? Math.ceil(a.hpPoolCur / a.hpMax) : 0;
}

// Aktiv kaempfender Anteil PLUS bereits zurueckgezogene, aber ueberlebende Einheiten - fuer die
// FINALE Ueberlebenden-Zaehlung nach Kampfende (siehe resolveCombat/resolveCombatMultiOwner).
function aggTotalSurvivingCount(a: AggregateStack): number {
  return aggAliveCount(a) + Math.ceil(a.retreatedHpPool / a.hpMax);
}

// Einfache Box-Muller-Normalverteilung (Mittelwert 0, Standardabweichung 1) - fuer die
// Normalverteilungs-Approximation von sampleBinomial() unten.
function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Sampelt eine Binomial(n,p)-verteilte Zufallszahl (z.B. "wie viele von n Schuessen treffen,
// gegeben Trefferchance p"). Exakt per Schleife fuer kleine n (billig genug, bewahrt exakte
// Varianz), sonst per Normalverteilungs-Approximation - deutlich schneller als n Einzel-Wuerfe,
// hinreichend genau fuer die grossen n, die bei Aggregat-Stapeln vorkommen.
function sampleBinomial(n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (n <= 40) {
    let count = 0;
    for (let i = 0; i < n; i++) if (Math.random() < p) count++;
    return count;
  }
  const mean = n * p;
  const stddev = Math.sqrt(n * p * (1 - p));
  const sample = Math.round(mean + gaussianRandom() * stddev);
  return Math.max(0, Math.min(n, sample));
}

// Maximale Zahl der Einheiten, die EIN Treffer ueber die Durchschlags-Kaskade nacheinander
// erreichen kann. Modulweit, weil applyHitToTarget() (Einzel-Einheiten) und
// cappedAggregateHitDamage() (Aggregat-Stapel) denselben Wert verwenden MUESSEN - lag der Wert
// vorher lokal in applyHitToTarget(), gab es fuer den Aggregat-Pfad gar keine Grenze.
const OVERKILL_MAX_CASCADE = 5;

// ===== OVERKILL-DECKEL (Entscheidung 1 des Umsetzungsplans) =====
// Berechnet, wieviel Schaden EIN Treffer mit `dmg` Rohschaden einem Stapel dieses Typs hoechstens
// zufuegen kann - exakt nach derselben Regel wie applyHitToTarget() bei Einzel-Einheiten: eine
// Einheit absorbiert Schild + Panzerung, der UEBERSCHUSS wird mit dem Durchschlags-Faktor
// multipliziert und an die naechste Einheit weitergereicht, hoechstens OVERKILL_MAX_CASCADE mal.
//
// Warum das noetig war: Die Aggregation ab STACK_AGGREGATE_THRESHOLD_BY_TYPE ist eine reine
// PERFORMANCE-Optimierung und darf das Kampfergebnis nicht veraendern. Genau das tat sie aber -
// applyAggregateDamage() schob den kompletten Rohschaden ungebremst in den HP-Topf, ohne Deckel,
// ohne Kaskadengrenze, ohne Durchschlags-Faktor. Gemessen (balance/session2-simulation/
// aggregate_threshold.txt): 99 Kreuzer ueberstehen 100 Runden mit 42,1 % Verlust, 101 Kreuzer sind
// nach 2,8 Runden zu 100 % vernichtet - EIN Schiff mehr kippte den Ausgang vollstaendig, weil ein
// einzelner Schuss des Piratenadmirals (280 Mio Waffen) rechnerisch rund 574 Kreuzer (je 487k HP)
// aus dem Topf schnitt statt einen einzigen zu toeten. Direkter Verstoss gegen die Vorgabe
// "nie Totalverlust".
function cappedAggregateHitDamage(dmg: number, stack: AggregateStack, overkillFraction: number): number {
  const perUnit = stack.shieldMax + stack.hpMax;
  if (perUnit <= 0 || dmg <= 0) return 0;
  let remaining = dmg;
  let total = 0;
  for (let step = 0; step < OVERKILL_MAX_CASCADE && remaining > 0; step++) {
    const absorbed = Math.min(remaining, perUnit);
    total += absorbed;
    remaining -= absorbed;
    if (remaining <= 0) break;
    // Nur der UEBERSCHUSS traegt weiter, dabei dauerhaft gedaempft. Bei Durchschlag-Forschung 0
    // ist overkillFraction 0 und die Schleife endet hier - ein Treffer toetet dann hoechstens eine
    // Einheit, genau wie bei Einzel-Einheiten.
    remaining *= overkillFraction;
  }
  return total;
}

// Wendet gebuendelten Schaden (hits Treffer, davon crits kritisch) auf einen Aggregat-Stapel an -
// Schild-Pool zuerst, dann HP-Pool (kein Durchschlag-Kaskade/Explosions-Sonderfall fuer Aggregate,
// bewusst vereinfacht - siehe README Punkt 103, bei so grossen Stapeln faellt das kaum ins
// Gewicht). `hits` kann auch 1 sein (ein einzelner Schuss von einem normalen CombatUnit-Schuetzen
// auf ein Aggregat-Ziel).
function applyAggregateDamage(
  stack: AggregateStack,
  hits: number,
  crits: number,
  dmgPerHit: number,
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  statKeyStr: string,
  overkillFraction: number,
  shooterTypeId?: string
): number {
  if (hits <= 0) return 0;
  const normalHits = hits - crits;
  const critMultiplier = shooterTypeId ? getCritDamageMultiplier(shooterTypeId) : CRIT_DAMAGE_DEFAULT_MULTIPLIER;
  // Overkill-Deckel: JE TREFFER begrenzen, nicht erst die Summe. Ein Buendel aus 100 Treffern darf
  // 100 Einheiten toeten, ein einzelner Treffer aber nicht 574 (siehe cappedAggregateHitDamage).
  const perNormalHit = cappedAggregateHitDamage(dmgPerHit, stack, overkillFraction);
  const perCritHit = cappedAggregateHitDamage(dmgPerHit * critMultiplier, stack, overkillFraction);
  let totalDmg = normalHits * perNormalHit + crits * perCritHit;
  const dealt = totalDmg;
  const shieldAbsorbed = Math.min(totalDmg, stack.shieldPoolCur);
  stack.shieldPoolCur -= shieldAbsorbed;
  totalDmg -= shieldAbsorbed;
  if (shieldAbsorbed > 0) shieldDmgTakenTarget[statKeyStr] = (shieldDmgTakenTarget[statKeyStr] || 0) + shieldAbsorbed;
  if (totalDmg > 0) {
    const applied = Math.min(totalDmg, stack.hpPoolCur);
    stack.hpPoolCur -= applied;
    dmgTakenTarget[statKeyStr] = (dmgTakenTarget[statKeyStr] || 0) + applied;
  }
  return dealt;
}

function buildUnits(
  shipsObj: Record<string, number>,
  statsFn: (id: string) => CombatStats
): { units: CombatUnit[]; aggregates: AggregateStack[] } {
  const units: CombatUnit[] = [];
  const aggregates: AggregateStack[] = [];
  Object.entries(shipsObj).forEach(([id, count]) => {
    if (!count || count <= 0) return;
    const s = statsFn(id);
    if (count > stackAggregateThresholdFor(id)) {
      const hpPool = count * s.panzerung;
      aggregates.push({
        typeId: id,
        waffen: s.waffen,
        shieldMax: s.schild,
        shieldPoolCur: count * s.schild,
        hpMax: s.panzerung,
        hpPoolCur: hpPool,
        initialHpPool: hpPool,
        retreatedHpPool: 0,
        active: true,
      });
      return;
    }
    for (let i = 0; i < count; i++) {
      units.push({ typeId: id, waffen: s.waffen, shieldMax: s.schild, shieldCur: s.schild, hpMax: s.panzerung, hpCur: s.panzerung });
    }
  });
  return { units, aggregates };
}

export interface OwnedFleetContribution {
  ownerKey: string;
  ships: Record<string, number>;
  research?: Record<string, number>; // eigene Forschung des Beitragenden - faellt sonst auf die Forschung von Seite A zurueck
  defenseCounts?: Record<string, number>; // fuer Schildkuppel-Bonus, falls relevant (z.B. Heimatverteidiger bei Raid)
  playerClass?: PlayerClass | null; // eigene Klasse des Beitragenden (Kampfbonus je Klasse), siehe getEffectiveStats()
  kampfBoostActive?: boolean; // eigener aktiver 24h-Kampf-Booster des Beitragenden (siehe KAMPF_BOOST_MULTIPLIER in economy.ts), siehe isBoosterActive() in actions.ts
  shipModules?: Record<string, number>; // eigene Schiffs-Module des Beitragenden, siehe data/shipModules.ts
}

// Liefert das "Piraten-Forschungsobjekt": PIRATE_RESEARCH_SHARE (100%) des relevanten
// Forschungsstands, NIE Klassen-Bonus/Module/Kampf-Booster (die betreffen nur getEffectiveStats(),
// nicht dieses research-Objekt). Bei mehreren Beitragenden (contributions, z.B. Elite-Bollwerk
// oder Raid mit Verstaerkung/haltenden Flotten) zaehlt seit 05.08.2026 das MINIMUM aller
// Beteiligten pro Forschungs-Zweig (Nutzerentscheidung, Korrektur einer frueheren Entscheidung:
// vorher zaehlte der DURCHSCHNITT, wodurch der schwaecher ausgebaute Teilnehmer effektiv UEBER
// seinem eigenen Forschungsniveau kaempfen musste, waehrend der staerkere Teilnehmer entsprechend
// darunter kaempfte - Livetest zeigte dabei etwa doppelt so hohe Verlustquoten fuer den
// schwaecheren Mitspieler bei praktisch identischen Schiffstypen. Das MINIMUM stellt sicher, dass
// KEIN Teilnehmer schlechter dasteht als bei einem Solo-Kampf auf seinem eigenen Stand - der
// staerker ausgebaute Teilnehmer profitiert weiterhin voll von seinem Vorsprung, der schwaechere
// wird nicht mehr zusaetzlich dafuer bestraft, dass jemand anderes in der Gruppe weiter ist) -
// fehlt einer Contribution die eigene research (sollte praktisch nie vorkommen), faellt sie auf
// die uebergebene Basis-`research` zurueck, analog zu buildUnitsMultiOwner() oben.
export function computePirateResearch(research: Record<string, number>, contributions?: OwnedFleetContribution[]): Record<string, number> {
  let source = research;
  if (contributions && contributions.length > 0) {
    const researches = contributions.map((c) => c.research || research);
    const keys = new Set<string>();
    researches.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    const min: Record<string, number> = {};
    keys.forEach((k) => {
      min[k] = Math.min(...researches.map((r) => r[k] || 0));
    });
    source = min;
  }
  const scaled: Record<string, number> = {};
  Object.keys(source).forEach((k) => (scaled[k] = (source[k] || 0) * PIRATE_RESEARCH_SHARE));
  return scaled;
}

// Aggregiert pro (ownerKey, typeId)-Paar statt pro Typ global - vermeidet das Problem, mehrere
// Beitragende mit unterschiedlicher Forschung/Klasse/Modulen (= unterschiedlichen effektiven
// Werten) im selben Aggregat-Pool zusammenmischen zu muessen. In der Praxis reicht das: relevant
// wird ein Aggregat ohnehin nur, wenn EIN Spieler allein schon eine sehr grosse Stueckzahl eines
// Typs beitraegt.
function buildUnitsMultiOwner(
  contributions: OwnedFleetContribution[],
  fallbackStatsFn: (id: string) => CombatStats
): { units: CombatUnit[]; aggregates: AggregateStack[] } {
  const units: CombatUnit[] = [];
  const aggregates: AggregateStack[] = [];
  contributions.forEach(({ ownerKey, ships, research, defenseCounts, playerClass, kampfBoostActive, shipModules }) => {
    const fn = (id: string) =>
      research ? getEffectiveStats(id, research, defenseCounts || {}, !!kampfBoostActive, playerClass || null, shipModules || {}) : fallbackStatsFn(id);
    Object.entries(ships).forEach(([id, count]) => {
      if (!count || count <= 0) return;
      const s = fn(id);
      if (count > stackAggregateThresholdFor(id)) {
        const hpPool = count * s.panzerung;
        aggregates.push({
          typeId: id,
          waffen: s.waffen,
          shieldMax: s.schild,
          shieldPoolCur: count * s.schild,
          hpMax: s.panzerung,
          hpPoolCur: hpPool,
          initialHpPool: hpPool,
          retreatedHpPool: 0,
          active: true,
          ownerShares: { [ownerKey]: 1 },
        });
        return;
      }
      for (let i = 0; i < count; i++) {
        units.push({ typeId: id, ownerKey, waffen: s.waffen, shieldMax: s.schild, shieldCur: s.schild, hpMax: s.panzerung, hpCur: s.panzerung });
      }
    });
  });
  return { units, aggregates };
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
  let currentTarget: CombatUnit | undefined = target;
  let remainingDmg = dmg;
  let cascadeSteps = 0;

  if (targetsSharedShieldPool && targetsSharedShieldPool.remaining > 0) {
    const absorbed = Math.min(remainingDmg, targetsSharedShieldPool.remaining);
    targetsSharedShieldPool.remaining -= absorbed;
    remainingDmg -= absorbed;
    if (remainingDmg <= 0) return;
  }

  while (remainingDmg > 0 && currentTarget && cascadeSteps < OVERKILL_MAX_CASCADE) {
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

  // Kritischer Treffer: eine schwer beschaedigte Einheit (unter EXPLOSION_HP_THRESHOLD ihrer HP)
  // hat eine mit dem Schadensgrad steigende Chance, sofort komplett auszufallen ("explodiert") -
  // siehe combatConstants.ts fuer die Begruendung der Schwelle/Daempfung.
  if (currentTarget && currentTarget.hpCur > 0 && currentTarget.hpCur < EXPLOSION_HP_THRESHOLD * currentTarget.hpMax) {
    // Normiert auf das Fenster [0, EXPLOSION_HP_THRESHOLD]: 0 direkt beim Erreichen der Schwelle,
    // 1 bei hpCur=0 - danach quadratisch (statt linear) gedaempft, damit die Chance erst nahe am
    // tatsaechlichen Tod wirklich hoch wird.
    const severity = 1 - currentTarget.hpCur / currentTarget.hpMax / EXPLOSION_HP_THRESHOLD;
    const pExplode = Math.pow(severity, EXPLOSION_CHANCE_EXPONENT);
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
  battleModifier: BattleModifierType | null = null,
  shooterTypeId?: string
): boolean {
  if (Math.random() >= precision) return false;
  let evasion = getEvasionChance(researchTarget, targetIsPlayerUnit, target.typeId, shooterTypeId);
  // Truemmerfeld schwaecht gezielt das Ausweichen des SPIELERS, nicht das der NPCs.
  if (battleModifier === 'truemmerfeld' && targetIsPlayerUnit) evasion *= 0.85;
  if (evasion > 0 && Math.random() < evasion) return false;
  return true;
}

// Wie rollHit(), aber fuer ein Aggregat-Ziel (das keine volle CombatUnit ist) - braucht nur dessen
// typeId fuer den Groessen-Fehlpaarung-/Forschungs-Ausweichen-Lookup.
function rollHitVsTypeId(
  typeId: string,
  precision: number,
  researchTarget: Record<string, number>,
  targetIsPlayerUnit: boolean,
  battleModifier: BattleModifierType | null,
  shooterTypeId?: string
): boolean {
  if (Math.random() >= precision) return false;
  let evasion = getEvasionChance(researchTarget, targetIsPlayerUnit, typeId, shooterTypeId);
  if (battleModifier === 'truemmerfeld' && targetIsPlayerUnit) evasion *= 0.85;
  if (evasion > 0 && Math.random() < evasion) return false;
  return true;
}

// Gewichtete Zielauswahl zwischen der normalen Einzel-Einheiten-Pool und Aggregat-Stapeln -
// Aggregate zaehlen mit ihrer aktuell lebenden Stueckzahl als Gewicht, damit ein Stapel aus 5000
// Schiffen realistisch oefter getroffen wird als ein einzelnes uebrig gebliebenes Schiff.
function pickWeightedTarget(
  pool: CombatUnit[],
  aggregates: AggregateStack[]
): { unit?: CombatUnit; agg?: AggregateStack } {
  const aggAlive = aggregates.filter((a) => a.active && a.hpPoolCur > 0);
  const totalAggWeight = aggAlive.reduce((s, a) => s + aggAliveCount(a), 0);
  const totalWeight = pool.length + totalAggWeight;
  if (totalWeight <= 0) return {};
  let roll = Math.random() * totalWeight;
  if (roll < pool.length) return { unit: pool[Math.floor(Math.random() * pool.length)] };
  roll -= pool.length;
  for (const a of aggAlive) {
    const w = aggAliveCount(a);
    if (roll < w) return { agg: a };
    roll -= w;
  }
  return {};
}

function aggStatKey(a: AggregateStack): string {
  if (a.ownerShares) {
    const keys = Object.keys(a.ownerShares);
    if (keys.length === 1) return `${keys[0]}:${a.typeId}`;
  }
  return a.typeId;
}

// Wendet gebuendelten Schaden auf ein Aggregat an, inkl. optionalem gemeinsamem Schild-Pool
// (Schildkuppeln bei der Heimatverteidigung) - analog zu applyHitToTarget() fuer normale Einheiten.
function applyAggregateHit(
  stack: AggregateStack,
  dmg: number,
  isCrit: boolean,
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  overkillFraction: number,
  targetsSharedShieldPool?: { remaining: number }
) {
  let remainingDmg = dmg;
  if (targetsSharedShieldPool && targetsSharedShieldPool.remaining > 0) {
    const absorbed = Math.min(remainingDmg, targetsSharedShieldPool.remaining);
    targetsSharedShieldPool.remaining -= absorbed;
    remainingDmg -= absorbed;
    if (remainingDmg <= 0) return;
  }
  // WICHTIG: `dmg` ist bereits der fertige, ggf. kritisch multiplizierte Schaden (siehe Aufrufer in
  // fireShots() - `dmg = shooter.waffen * (isCrit ? getCritDamageMultiplier(shooter.typeId) : 1)`).
  // applyAggregateDamage() multipliziert bei crits>0 SELBST nochmal - crits hier immer auf 0
  // lassen, sonst wird ein kritischer Treffer VIERFACH statt doppelt gezaehlt (Bug, gefunden nach
  // Nutzer-Feedback "fast die ganze Flotte vernichtet" - einzelne NPC-Schuetzen landeten dadurch
  // stark ueberhoehten Schaden gegen Aggregat-Stapel).
  applyAggregateDamage(stack, 1, 0, remainingDmg, dmgTakenTarget, shieldDmgTakenTarget, aggStatKey(stack), overkillFraction);
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
  battleModifier: BattleModifierType | null = null,
  targetAggregates: AggregateStack[] = []
) {
  if (targets.length === 0 && targetAggregates.length === 0) return;
  const MAX_SHOTS_PER_UNIT = 50;
  const overkillFraction = getDurchschlagFraction(researchShooter);
  // Einmal pro fireShots()-Aufruf aufgebaut (nicht pro Schuss!) - siehe AliveTargetPool/
  // AliveTargetsByType oben. Nur bei Durchschlag-Forschung > 0 lohnt sich der zusaetzliche
  // Aufwand fuer die typisierte Pool ueberhaupt (Kaskaden treten sonst nie auf).
  const alivePool = new AliveTargetPool(targets);
  // Performance-Fix (Nutzer-Profiling 29.07.2026): war vorher nur bei Durchschlag-Forschung > 0
  // aufgebaut - die RapidFire-Zielpool-Bildung weiter unten hat deswegen bei JEDEM EINZELNEN
  // Schuss `aliveTargets.filter(...)` ueber die GESAMTE Zielliste durchsucht (O(Ziele) pro Schuss).
  // Bei grossen Individual-Flotten (mehrere tausend Ziele, viele Schuetzen mit RapidFire-Potenzial)
  // war das mit Abstand der teuerste Teil der gesamten Kampfberechnung (Node-Profiler: >90% der
  // JS-Zeit in genau dieser forEach-Schleife, dominiert von wiederholten Array-Allokationen/GC).
  // typedPool jetzt IMMER aufgebaut (einmalig pro fireShots()-Aufruf, nicht pro Schuss) - macht die
  // RF-Pool-Bildung unten O(Anzahl RF-faehiger Typen) statt O(Gesamt-Zielanzahl).
  const typedPool = new AliveTargetsByType(targets);
  const onKill = (unit: CombatUnit) => {
    alivePool.remove(unit);
    typedPool.remove(unit);
  };
  const hasAggregateTargets = targetAggregates.length > 0;

  shooters.forEach((shooter) => {
    let shots = 1;
    let fired = 0;
    // Praezision und Krit-Chance haengen vom SCHIFFSTYP des Schuetzen ab (kleine Schiffe treffen
    // besser, grosse richten oefter kritischen Schaden an) - daher pro Schuetze berechnet.
    let precision = getPrecisionChance(researchShooter, applyPlayerResearch, shooter.typeId);
    let critChance = getCritChance(researchShooter, applyPlayerResearch, shooter.typeId);
    const rfMap = RAPIDFIRE[shooter.typeId] || {};
    // Einmal pro SCHUETZE ermittelt (nicht pro Schuss) - direkt die Typen, gegen die dieser
    // Schuetze RapidFire hat, statt bei jedem Schuss erneut Object.keys()/Filterung zu wiederholen.
    const rfTypeIds = Object.keys(rfMap);
    const hasRFPotential = rfTypeIds.length > 0;
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
      if (alivePool.size === 0 && !hasAggregateTargets) break;

      let target: CombatUnit | undefined;
      let targetAgg: AggregateStack | undefined;
      let volleyTargets: CombatUnit[] | null = null;
      let volleyAggregates: AggregateStack[] | null = null;
      if (hasRFPotential && Math.random() < accuracy) {
        // Performance-Fix (siehe Kommentar bei typedPool oben): baut den RF-Zielpool aus den
        // vorbereiteten Pro-Typ-Buckets zusammen (O(RF-faehige Typen)) statt bei JEDEM Schuss die
        // GESAMTE aliveTargets-Liste zu durchsuchen (O(Gesamt-Zielanzahl) - bei tausenden Zielen
        // und vielen Schuetzen/Schuessen der mit Abstand teuerste Teil der Kampfberechnung).
        const rfPool: CombatUnit[] = [];
        for (const typeId of rfTypeIds) {
          const bucket = typedPool.arrayFor(typeId);
          if (bucket.length > 0) rfPool.push(...bucket);
        }
        const rfAggs = hasAggregateTargets ? targetAggregates.filter((a) => a.active && a.hpPoolCur > 0 && rfMap[a.typeId] !== undefined) : [];
        if (rfPool.length > 0 || rfAggs.length > 0) {
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
            volleyAggregates = rfAggs;
          }
          const picked = pickWeightedTarget(rfPool, rfAggs);
          target = picked.unit;
          targetAgg = picked.agg;
        } else {
          const picked = pickWeightedTarget(aliveTargets, []);
          target = picked.unit;
        }
      } else {
        const picked = pickWeightedTarget(aliveTargets, targetAggregates);
        target = picked.unit;
        targetAgg = picked.agg;
      }

      if ((volleyTargets && volleyTargets.length > 0) || (volleyAggregates && volleyAggregates.length > 0)) {
        // Fuer jeden betroffenen Typ ein eigener Treffer/Verfehlen-Wurf, unabhaengig voneinander.
        let anyHit = false;
        (volleyTargets || []).forEach((vt) => {
          if (!rollHit(vt, precision, researchTarget, !applyPlayerResearch, battleModifier, shooter.typeId)) {
            const missRfChance = getRapidFireChance(shooter.typeId, vt.typeId, applyPlayerResearch);
            if (missRfChance > 0 && Math.random() < missRfChance) {
              shots++;
              shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
            }
            return;
          }
          anyHit = true;
          const isCrit = critChance > 0 && Math.random() < critChance;
          if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
          const dmg = shooter.waffen * (isCrit ? getCritDamageMultiplier(shooter.typeId) : 1);
          shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
          applyHitToTarget(vt, dmg, dmgTakenTarget, shieldDmgTakenTarget, targets, overkillFraction, targetsSharedShieldPool, onKill, typedPool);
          const hitRfChance = getRapidFireChance(shooter.typeId, vt.typeId, applyPlayerResearch);
          if (hitRfChance > 0 && Math.random() < hitRfChance) {
            shots++;
            shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
          }
        });
        (volleyAggregates || []).forEach((va) => {
          if (!rollHitVsTypeId(va.typeId, precision, researchTarget, !applyPlayerResearch, battleModifier, shooter.typeId)) {
            const missRfChance = getRapidFireChance(shooter.typeId, va.typeId, applyPlayerResearch);
            if (missRfChance > 0 && Math.random() < missRfChance) {
              shots++;
              shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
            }
            return;
          }
          anyHit = true;
          const isCrit = critChance > 0 && Math.random() < critChance;
          if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
          const dmg = shooter.waffen * (isCrit ? getCritDamageMultiplier(shooter.typeId) : 1);
          shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
          applyAggregateHit(va, dmg, isCrit, dmgTakenTarget, shieldDmgTakenTarget, overkillFraction, targetsSharedShieldPool);
          const hitRfChance = getRapidFireChance(shooter.typeId, va.typeId, applyPlayerResearch);
          if (hitRfChance > 0 && Math.random() < hitRfChance) {
            shots++;
            shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
          }
        });
        if (anyHit) shooterStats.hits[statKey(shooter)] = (shooterStats.hits[statKey(shooter)] || 0) + 1;
        continue;
      }

      if (targetAgg) {
        if (!rollHitVsTypeId(targetAgg.typeId, precision, researchTarget, !applyPlayerResearch, battleModifier, shooter.typeId)) {
          const missRfChance = getRapidFireChance(shooter.typeId, targetAgg.typeId, applyPlayerResearch);
          if (missRfChance > 0 && Math.random() < missRfChance) {
            shots++;
            shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
          }
          continue;
        }
        shooterStats.hits[statKey(shooter)] = (shooterStats.hits[statKey(shooter)] || 0) + 1;
        const isCrit = critChance > 0 && Math.random() < critChance;
        if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
        const dmg = shooter.waffen * (isCrit ? getCritDamageMultiplier(shooter.typeId) : 1);
        shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
        applyAggregateHit(targetAgg, dmg, isCrit, dmgTakenTarget, shieldDmgTakenTarget, overkillFraction, targetsSharedShieldPool);
        const hitRfChance = getRapidFireChance(shooter.typeId, targetAgg.typeId, applyPlayerResearch);
        if (hitRfChance > 0 && Math.random() < hitRfChance) {
          shots++;
          shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
        }
        continue;
      }

      if (!target) continue;

      if (!rollHit(target, precision, researchTarget, !applyPlayerResearch, battleModifier, shooter.typeId)) {
        const missRfChance = getRapidFireChance(shooter.typeId, target.typeId, applyPlayerResearch);
        if (missRfChance > 0 && Math.random() < missRfChance) {
          shots++;
          shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
        }
        continue;
      }

      shooterStats.hits[statKey(shooter)] = (shooterStats.hits[statKey(shooter)] || 0) + 1;
      const isCrit = critChance > 0 && Math.random() < critChance;
      if (isCrit) shooterStats.crits[statKey(shooter)] = (shooterStats.crits[statKey(shooter)] || 0) + 1;
      const dmg = shooter.waffen * (isCrit ? getCritDamageMultiplier(shooter.typeId) : 1);
      shooterStats.dmgDealt[statKey(shooter)] = (shooterStats.dmgDealt[statKey(shooter)] || 0) + dmg;
      applyHitToTarget(target, dmg, dmgTakenTarget, shieldDmgTakenTarget, targets, overkillFraction, targetsSharedShieldPool, onKill, typedPool);
      const hitRfChance = getRapidFireChance(shooter.typeId, target.typeId, applyPlayerResearch);
      if (hitRfChance > 0 && Math.random() < hitRfChance) {
        shots++;
        shooterStats.rapidFireTriggers[statKey(shooter)] = (shooterStats.rapidFireTriggers[statKey(shooter)] || 0) + 1;
      }
    }
  });
}

// ===== Aggregat-SCHUETZEN (grosse Stapel als Angreifer) =====
// Statt jede Einheit einzeln feuern zu lassen (das war der eigentliche Performance-Killer bei
// grossen Flotten), wird die GESAMTE Schusszahl des Stapels ueber den Erwartungswert der
// RapidFire-Kette + Normalverteilungs-Sampling berechnet (sampleBinomial oben), dann proportional
// auf die Ziel-"Eimer" (normale Einzel-Ziel-Pool als EIN Eimer + jedes gegnerische Aggregat als
// eigener Eimer) verteilt. Pro Eimer wird die Trefferzahl wieder per sampleBinomial bestimmt und in
// EINEM Rutsch angewendet - kein Schuss-fuer-Schuss-Loop mehr fuer den Aggregat-Anteil des Kampfes.
function fireShotsAggregateShooters(
  shooterStacks: AggregateStack[],
  targets: CombatUnit[],
  targetAggregates: AggregateStack[],
  dmgTakenTarget: Record<string, number>,
  shieldDmgTakenTarget: Record<string, number>,
  applyPlayerResearch: boolean,
  researchShooter: Record<string, number>,
  researchTarget: Record<string, number>,
  shooterStats: ShotStats,
  targetsSharedShieldPool?: { remaining: number },
  battleModifier: BattleModifierType | null = null
) {
  const MAX_SHOTS_PER_UNIT = 50;
  shooterStacks.forEach((stack) => {
    if (!stack.active || stack.hpPoolCur <= 0) return;
    const count = aggAliveCount(stack);
    if (count <= 0) return;

    let precision = getPrecisionChance(researchShooter, applyPlayerResearch, stack.typeId);
    let critChance = getCritChance(researchShooter, applyPlayerResearch, stack.typeId);
    const rfMap = RAPIDFIRE[stack.typeId] || {};
    const hasRFPotential = Object.keys(rfMap).length > 0;
    let accuracy = hasRFPotential ? getZielerfassungAccuracy(researchShooter, stack.typeId) : 0;
    if (battleModifier === 'nebel' && applyPlayerResearch) precision *= 0.85;
    if (battleModifier === 'sensorstoerung' && applyPlayerResearch) accuracy *= 0.8;
    if (battleModifier === 'strahlungssturm' && !applyPlayerResearch) critChance = Math.min(1, critChance * 1.5);

    // Erwartete Folgeschuss-Kette: gewichteter Durchschnitt der RapidFire-Chance ueber die aktuell
    // lebenden, RF-faehigen Zieltypen (gewichtet nach deren Anteil an ALLEN lebenden Zielen) -
    // ergibt denselben Erwartungswert wie das Original (geometrische Reihe), ohne die Kette pro
    // Schiff einzeln zu simulieren.
    const aliveIndividualCount = targets.length;
    const aliveAggTargets = targetAggregates.filter((a) => a.active && a.hpPoolCur > 0);
    const totalAliveTargets = aliveIndividualCount + aliveAggTargets.reduce((s, a) => s + aggAliveCount(a), 0);
    let expectedContinuation = 0;
    if (hasRFPotential && totalAliveTargets > 0) {
      const individualRfWeight = targets.filter((t) => rfMap[t.typeId] !== undefined).length;
      const aggRfWeight = aliveAggTargets.filter((a) => rfMap[a.typeId] !== undefined).reduce((s, a) => s + aggAliveCount(a), 0);
      const rfEligibleShare = (individualRfWeight + aggRfWeight) / totalAliveTargets;
      // Durchschnittlicher RF-Wert der anfaelligen Ziele (grobe Naeherung: Durchschnitt aller im
      // Mapping gelisteten Chancen, gewichtet ist bei der geringen Anzahl Zieltypen nicht noetig).
      const rfChances = Object.keys(rfMap).map((tid) => getRapidFireChance(stack.typeId, tid, applyPlayerResearch));
      const avgRfChance = rfChances.length > 0 ? rfChances.reduce((a, b) => a + b, 0) / rfChances.length : 0;
      expectedContinuation = accuracy * rfEligibleShare * avgRfChance;
    }
    const expectedShotsPerUnit = Math.min(MAX_SHOTS_PER_UNIT, 1 / Math.max(0.0001, 1 - expectedContinuation));
    const meanShots = count * expectedShotsPerUnit;
    const stddevShots = Math.sqrt(count) * expectedShotsPerUnit * 0.5;
    let totalShots = Math.round(meanShots + gaussianRandom() * stddevShots);
    totalShots = Math.max(count, Math.min(count * MAX_SHOTS_PER_UNIT, totalShots));
    if (totalAliveTargets <= 0 || totalShots <= 0) return;

    const shooterKey = aggStatKey(stack);
    shooterStats.shotsFired[shooterKey] = (shooterStats.shotsFired[shooterKey] || 0) + totalShots;

    // Schuesse proportional auf die Ziel-"Eimer" verteilen: normale Einzel-Pool (ein Eimer) +
    // jedes gegnerische Aggregat (je ein Eimer) - gewichtet nach lebender Stueckzahl.
    const buckets: { weight: number; isIndividual: boolean; agg?: AggregateStack }[] = [];
    if (aliveIndividualCount > 0) buckets.push({ weight: aliveIndividualCount, isIndividual: true });
    aliveAggTargets.forEach((a) => buckets.push({ weight: aggAliveCount(a), isIndividual: false, agg: a }));
    const totalBucketWeight = buckets.reduce((s, b) => s + b.weight, 0);
    if (totalBucketWeight <= 0) return;

    buckets.forEach((bucket) => {
      const shotsAtBucket = Math.round(totalShots * (bucket.weight / totalBucketWeight));
      if (shotsAtBucket <= 0) return;

      if (bucket.isIndividual) {
        // Kleine Pool (per Definition unter STACK_AGGREGATE_THRESHOLD) - einzeln abhandeln reicht
        // performancemaessig locker aus, nutzt dieselbe Trefferlogik wie normale Schuetzen.
        const pool = new AliveTargetPool(targets);
        for (let i = 0; i < shotsAtBucket && pool.size > 0; i++) {
          const target = pickRandom(pool.array);
          if (!rollHit(target, precision, researchTarget, !applyPlayerResearch, battleModifier, stack.typeId)) continue;
          shooterStats.hits[shooterKey] = (shooterStats.hits[shooterKey] || 0) + 1;
          const isCrit = critChance > 0 && Math.random() < critChance;
          if (isCrit) shooterStats.crits[shooterKey] = (shooterStats.crits[shooterKey] || 0) + 1;
          const dmg = stack.waffen * (isCrit ? getCritDamageMultiplier(stack.typeId) : 1);
          shooterStats.dmgDealt[shooterKey] = (shooterStats.dmgDealt[shooterKey] || 0) + dmg;
          applyHitToTarget(target, dmg, dmgTakenTarget, shieldDmgTakenTarget, targets, 0, targetsSharedShieldPool, (u) => pool.remove(u), undefined);
        }
      } else if (bucket.agg) {
        const hits = sampleBinomial(shotsAtBucket, precision * (1 - getEvasionChance(researchTarget, !applyPlayerResearch, bucket.agg.typeId, stack.typeId)));
        const crits = sampleBinomial(hits, critChance);
        if (hits > 0) {
          shooterStats.hits[shooterKey] = (shooterStats.hits[shooterKey] || 0) + hits;
          if (crits > 0) shooterStats.crits[shooterKey] = (shooterStats.crits[shooterKey] || 0) + crits;
          const dealt = applyAggregateDamage(
            bucket.agg,
            hits,
            crits,
            stack.waffen,
            dmgTakenTarget,
            shieldDmgTakenTarget,
            aggStatKey(bucket.agg),
            // Aggregat-SCHUETZEN bekommen bewusst keinen Durchschlag - identisch zum
            // Individual-Zweig direkt darueber, der applyHitToTarget(..., 0, ...) aufruft.
            0,
            stack.typeId
          );
          shooterStats.dmgDealt[shooterKey] = (shooterStats.dmgDealt[shooterKey] || 0) + dealt;
        }
      }
    });
  });
}

interface RoundsResult {
  roundsFought: number;
  unitsA: CombatUnit[];
  unitsB: CombatUnit[];
  aggregatesA: AggregateStack[];
  aggregatesB: AggregateStack[];
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

function sideHasLife(units: CombatUnit[], aggregates: AggregateStack[]): boolean {
  return units.length > 0 || aggregates.some((a) => a.active && a.hpPoolCur > 0);
}

// Kern der Kampf-Simulation, unabhaengig davon ob Seite A einem einzelnen Spieler gehoert
// (resolveCombat) oder mehreren Spielern gemeinsam (resolveCombatMultiOwner). `aggregatesAIn`/
// `aggregatesBIn` sind die (bei normalen Flottengroessen leeren) Aggregat-Stapel oberhalb von
// STACK_AGGREGATE_THRESHOLD - siehe fireShotsAggregateShooters() fuer die statistische
// Schuss-Berechnung, die diese Stapel unabhaengig von ihrer Stueckzahl performant haelt.
function runRounds(
  unitsAIn: CombatUnit[],
  unitsBIn: CombatUnit[],
  research: Record<string, number>,
  pirateResearch: Record<string, number>,
  sharedShieldPoolA = 0,
  allowRetreat = true,
  battleModifier: BattleModifierType | null = null,
  aggregatesAIn: AggregateStack[] = [],
  aggregatesBIn: AggregateStack[] = []
): RoundsResult {
  let unitsA = unitsAIn;
  let unitsB = unitsBIn;
  const aggregatesA = aggregatesAIn;
  const aggregatesB = aggregatesBIn;
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
  // Gestaffelter Einzelschiff-Rueckzug (Nutzerentscheidung Juli 2026, ersetzt die vorherige
  // Flotten-weite 50%-Kampfkraft-Schwelle, die die GESAMTE Seite A gleichzeitig abziehen liess -
  // das war zu binaer: entweder kaempfte die volle Flotte weiter oder alles floh im selben Moment).
  // Jetzt entscheidet JEDES Schiff EINZELN anhand seines eigenen verbleibenden HP-Anteils: sobald
  // ein Schiff auf UNIT_RETREAT_THRESHOLD seiner Panzerung gesunken ist, zieht es sich zurueck
  // (ueberlebt, kaempft aber nicht weiter mit) - staerker beschaedigte Schiffe fliehen so frueher als
  // kaum angeschlagene. Gilt nur fuer Seite A (Spieler-Flotte auf Offensiv-Missionen) und nur wenn
  // allowRetreat=true (Heimatverteidigung bei Raids setzt das bewusst auf false, da Verteidigung
  // inkl. Anlagen nicht "fliehen" kann, siehe raids.ts). Zurueckgezogene Schiffe sammeln sich in
  // retreatedUnitsA und werden am Ende wieder zu unitsA hinzugefuegt, damit sie als Ueberlebende
  // zaehlen - fuer die Runden-Visualisierung gelten sie ab ihrer Rueckzugs-Runde als nicht mehr
  // anwesend (korrekt, sie kaempfen ja nicht mehr mit). Aggregate ziehen sich als GANZES zurueck
  // (active=false) statt gestaffelt einzeln - bleiben aber im Array (zaehlen als Ueberlebende).
  const UNIT_RETREAT_THRESHOLD = 0.3;
  const retreatedUnitsA: CombatUnit[] = [];

  // ---- Rundenverlauf fuer die spaetere Visualisierung aufzeichnen ----
  // Typ-Reihenfolge einmalig festlegen (Zaehlungen beziehen sich immer auf diese Reihenfolge).
  const typesA = Array.from(new Set([...unitsA.map((u) => u.typeId), ...aggregatesA.map((a) => a.typeId)]));
  const typesB = Array.from(new Set([...unitsB.map((u) => u.typeId), ...aggregatesB.map((a) => a.typeId)]));
  const roundsA: number[][] = [];
  const roundsB: number[][] = [];
  const MAX_SNAPSHOTS = 30;
  function countByType(units: CombatUnit[], aggregates: AggregateStack[], types: string[]): number[] {
    const counts = new Map<string, number>();
    units.forEach((u) => counts.set(u.typeId, (counts.get(u.typeId) || 0) + 1));
    aggregates.forEach((a) => counts.set(a.typeId, (counts.get(a.typeId) || 0) + aggAliveCount(a)));
    return types.map((t) => counts.get(t) || 0);
  }
  // Startzustand als erster Eintrag
  roundsA.push(countByType(unitsA, aggregatesA, typesA));
  roundsB.push(countByType(unitsB, aggregatesB, typesB));

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
    if (!sideHasLife(unitsA, aggregatesA) || !sideHasLife(unitsB, aggregatesB)) break;
    roundsFought = round;
    fireShots(unitsA, unitsB, dmgTakenB, shieldDmgTakenB, true, research, pirateResearch, shotsA, undefined, battleModifier, aggregatesB);
    fireShotsAggregateShooters(aggregatesA, unitsB, aggregatesB, dmgTakenB, shieldDmgTakenB, true, research, pirateResearch, shotsA, undefined, battleModifier);
    fireShots(unitsB, unitsA, dmgTakenA, shieldDmgTakenA, false, pirateResearch, research, shotsB, poolA, battleModifier, aggregatesA);
    fireShotsAggregateShooters(aggregatesB, unitsA, aggregatesA, dmgTakenA, shieldDmgTakenA, false, pirateResearch, research, shotsB, poolA, battleModifier);
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
    aggregatesA.forEach((a) => {
      if (!a.active || a.hpPoolCur <= 0) return;
      const before = a.shieldPoolCur;
      const maxPool = aggAliveCount(a) * a.shieldMax;
      a.shieldPoolCur = Math.min(maxPool, a.shieldPoolCur + maxPool * regenFor(a.typeId, true));
      shieldRegenA[aggStatKey(a)] = (shieldRegenA[aggStatKey(a)] || 0) + (a.shieldPoolCur - before);
    });
    aggregatesB.forEach((a) => {
      if (!a.active || a.hpPoolCur <= 0) return;
      const before = a.shieldPoolCur;
      const maxPool = aggAliveCount(a) * a.shieldMax;
      a.shieldPoolCur = Math.min(maxPool, a.shieldPoolCur + maxPool * regenFor(a.typeId, false));
      shieldRegenB[aggStatKey(a)] = (shieldRegenB[aggStatKey(a)] || 0) + (a.shieldPoolCur - before);
    });
    if (sharedShieldPoolA > 0) {
      poolA.remaining = Math.min(sharedShieldPoolA, poolA.remaining + sharedShieldPoolA * poolRegen);
    }
    // Zustand nach dieser Runde festhalten (fuer die Visualisierung im Kampfbericht)
    roundsA.push(countByType(unitsA, aggregatesA, typesA));
    roundsB.push(countByType(unitsB, aggregatesB, typesB));
    // Rueckzug nur, wenn ueberhaupt noch Feinde uebrig sind: Ist der letzte Gegner in derselben
    // Runde gefallen, ist der Kampf GEWONNEN - dann waere ein "Rueckzug" sowohl unlogisch als auch
    // im Bericht irrefuehrend ("Rueckzug" trotz Sieg).
    if (allowRetreat && sideHasLife(unitsB, aggregatesB) && sideHasLife(unitsA, aggregatesA)) {
      const stillFighting: CombatUnit[] = [];
      unitsA.forEach((u) => {
        if (u.hpCur / u.hpMax <= UNIT_RETREAT_THRESHOLD) {
          retreated = true;
          retreatedUnitsA.push(u);
        } else {
          stillFighting.push(u);
        }
      });
      unitsA = stillFighting;
      // Progressiver Rueckzug fuer Aggregate (Bugfix nach Nutzer-Feedback: "93% Verluste trotz
      // Sieg" - ein binaerer Alles-oder-nichts-Rueckzug erst bei 70% GESAMT-Verlust liess Aggregate
      // viel laenger durchhalten UND STERBEN als beim Einzelschiff-Modell, wo staendig einzelne,
      // ungluecklich getroffene Schiffe schon FRUEH bei 30% IHRER EIGENEN HP abziehen, waehrend der
      // Rest der Flotte noch kaum Schaden hat - macht in Summe viel mehr Ueberlebende. Rueckzugs-
      // Anteil wird jetzt ueber eine Rampe auf die TATSAECHLICHEN KAMPF-VERLUSTE (nicht auf bereits
      // Zurueckgezogene, sonst wuerde Rueckzug sich selbst befeuern) abgebildet: ab
      // ~21% toten Schiffen faengt ein wachsender Anteil an, sich zurueckzuziehen, bei 70% toten
      // Schiffen (= UNIT_RETREAT_THRESHOLD-Aequivalent) sollte praktisch der gesamte Rest schon
      // zurueckgezogen sein statt weiterzukaempfen und zu sterben.
      aggregatesA.forEach((a) => {
        if (a.hpPoolCur <= 0) return;
        const deadHpPool = Math.max(0, a.initialHpPool - a.hpPoolCur - a.retreatedHpPool);
        const deadFraction = deadHpPool / a.initialHpPool;
        const rampStart = (1 - UNIT_RETREAT_THRESHOLD) * 0.3;
        const rampEnd = 1 - UNIT_RETREAT_THRESHOLD;
        const targetRetreatShare = Math.max(0, Math.min(1, (deadFraction - rampStart) / (rampEnd - rampStart)));
        const targetRetreatedHp = targetRetreatShare * a.initialHpPool;
        if (targetRetreatedHp > a.retreatedHpPool) {
          const newlyRetreatedHp = Math.min(targetRetreatedHp - a.retreatedHpPool, a.hpPoolCur);
          a.hpPoolCur -= newlyRetreatedHp;
          a.retreatedHpPool += newlyRetreatedHp;
          retreated = true;
        }
      });
    }
  }
  // Zurueckgezogene Schiffe wieder einrechnen - sie haben ueberlebt, kaempfen ab ihrer Rueckzugs-
  // Runde aber nicht mehr mit (siehe Kommentar oben bei UNIT_RETREAT_THRESHOLD). Zurueckgezogene
  // Aggregate bleiben ohnehin im aggregatesA-Array (nur active=false), keine separate Wieder-
  // Einrechnung noetig.
  unitsA = unitsA.concat(retreatedUnitsA);

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
    aggregatesA,
    aggregatesB,
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
  const { units: unitsA0, aggregates: aggregatesA0 } = buildUnits(sideAShips, statsFnA);
  const { units: unitsB0, aggregates: aggregatesB0 } = buildUnits(sideBShips, statsFnB);
  const pirateResearch = computePirateResearch(research);
  const r = runRounds(unitsA0, unitsB0, research, pirateResearch, sharedShieldPoolA, allowRetreat, battleModifier, aggregatesA0, aggregatesB0);

  const survivorsA: Record<string, number> = {};
  r.unitsA.forEach((u) => (survivorsA[u.typeId] = (survivorsA[u.typeId] || 0) + 1));
  r.aggregatesA.forEach((a) => (survivorsA[a.typeId] = (survivorsA[a.typeId] || 0) + aggTotalSurvivingCount(a)));
  const survivorsB: Record<string, number> = {};
  r.unitsB.forEach((u) => (survivorsB[u.typeId] = (survivorsB[u.typeId] || 0) + 1));
  r.aggregatesB.forEach((a) => (survivorsB[a.typeId] = (survivorsB[a.typeId] || 0) + aggTotalSurvivingCount(a)));
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
  const { units: unitsA0, aggregates: aggregatesA0 } = buildUnitsMultiOwner(contributions, statsFnA);
  const { units: unitsB0, aggregates: aggregatesB0 } = buildUnits(sideBShips, statsFnB);
  const pirateResearch = computePirateResearch(research, contributions);
  const r = runRounds(unitsA0, unitsB0, research, pirateResearch, sharedShieldPoolA, allowRetreat, battleModifier, aggregatesA0, aggregatesB0);

  const survivorsA: Record<string, number> = {};
  const survivorsByOwner: Record<string, Record<string, number>> = {};
  contributions.forEach((c) => (survivorsByOwner[c.ownerKey] = {}));
  r.unitsA.forEach((u) => {
    survivorsA[u.typeId] = (survivorsA[u.typeId] || 0) + 1;
    if (u.ownerKey) {
      survivorsByOwner[u.ownerKey][u.typeId] = (survivorsByOwner[u.ownerKey][u.typeId] || 0) + 1;
    }
  });
  // Aggregate aus buildUnitsMultiOwner gehoeren immer genau EINEM Beitragenden (siehe
  // buildUnitsMultiOwner() - aggregiert wird pro (ownerKey, typeId), nie ownerKey-uebergreifend).
  r.aggregatesA.forEach((a) => {
    const count = aggTotalSurvivingCount(a);
    survivorsA[a.typeId] = (survivorsA[a.typeId] || 0) + count;
    const ownerKey = a.ownerShares ? Object.keys(a.ownerShares)[0] : undefined;
    if (ownerKey && survivorsByOwner[ownerKey]) {
      survivorsByOwner[ownerKey][a.typeId] = (survivorsByOwner[ownerKey][a.typeId] || 0) + count;
    }
  });
  const survivorsB: Record<string, number> = {};
  r.unitsB.forEach((u) => (survivorsB[u.typeId] = (survivorsB[u.typeId] || 0) + 1));
  r.aggregatesB.forEach((a) => (survivorsB[a.typeId] = (survivorsB[a.typeId] || 0) + aggTotalSurvivingCount(a)));

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
