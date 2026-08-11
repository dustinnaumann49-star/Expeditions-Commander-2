import type { GameData, PlayerState, PlayerClass, ShipDefinition, DefenseDefinition } from '../types/game';
import { isBoosterActive } from './multipliers';

// Klassen-Multiplikatoren kommen seit dem 11.08.2026 vom Server (gameData.classCombatMultipliers).
// Geliefert werden bewusst die GRUNDWERTE ohne die situativen Aufschlaege
// (CLASS_KANONIER_OFFENSE_BONUS / CLASS_BOLLWERK_DEFENSE_BONUS): eine Bau-Karte gehoert zu keiner
// Kampfsituation, ein Effektivwert mit Aufschlag waere dort schlicht falsch. Die Aufschlaege
// stehen stattdessen als eigene Zeile in der Klassen-Beschreibung (PLAYER_CLASSES in
// server/src/game/data/classes.ts), die der Client ohnehin fertig formatiert bekommt.
// Vorher standen sie hier hartkodiert - zweimal, mit unterschiedlichem Zuschnitt - und waeren bei
// der Klassen-Anpassung desselben Tages still veraltet: die Anzeige haette weiter +50% Schild
// gemeldet, waehrend der Kampf mit +100% rechnet.
function classMultipliers(gameData: GameData, playerClass: PlayerClass | null): { waffen: number; schild: number; panzerung: number } {
  const fallback = { waffen: 1, schild: 1, panzerung: 1 };
  if (!playerClass) return fallback;
  return gameData.classCombatMultipliers?.[playerClass] || fallback;
}

function getClassSchildMultiplier(gameData: GameData, playerClass: PlayerClass | null): number {
  return classMultipliers(gameData, playerClass).schild;
}

// Spiegelt SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL aus server/src/game/data/shipModules.ts (gilt
// auch fuer Verteidigungs-Module, siehe data/defenseModules.ts).
const SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL = 0.03;

export function shipName(gameData: GameData, id: string): string {
  return gameData.ships.find((s) => s.id === id)?.name || gameData.defenses.find((d) => d.id === id)?.name || id;
}

// Gruppen-Ueberschriften fuer Kampfschiff-Flottenauswahl - dieselbe Klassen-Einteilung wie in der
// Werft (SCHIFFE_KLASSEN in Werft.tsx), damit Spieler sich nicht an zwei verschiedene
// Kategorisierungen gewoehnen muessen. Zentral hier statt in Sektor.tsx/Multiplayer.tsx dupliziert,
// da beide Seiten dieselbe Flottenauswahl-UI brauchen (Missionsversand, Elite-Bollwerk,
// Piratenadmiral, Einladungs-Annahme).
export const SHIP_GROUPS: { name: string; ids: string[] }[] = [
  { name: 'Jäger-Klasse', ids: ['leicht', 'schwer'] },
  { name: 'Kreuzer-Klasse', ids: ['kreuzer', 'schlachtschiff', 'bomber'] },
  { name: 'Elite-Klasse', ids: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'] },
  { name: 'Spezialschiffe', ids: ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'imperator'] },
];

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

// Spiegelt server/src/game/combat.ts's getShieldRegenRate() - klassenabhaengiger Basiswert plus
// Forschungsbonus.
export function getShieldRegenRate(gameData: GameData, research: Record<string, number>, typeId?: string): number {
  const level = research.schildregeneration || 0;
  const tech = gameData.research.find((r) => r.id === 'schildregeneration');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  const base = typeId ? gameData.shieldRegenBaseByClass[typeId] ?? gameData.shieldRegenDefaultBase : gameData.shieldRegenDefaultBase;
  return Math.max(0, Math.min(gameData.shieldRegenMax, base + bonus));
}

// Spiegelt server/src/game/combat.ts's getPrecisionChance() - kleine Schiffe treffen besser.
export function getPrecisionChance(gameData: GameData, research: Record<string, number>, typeId?: string): number {
  const level = research.praezision || 0;
  const tech = gameData.research.find((r) => r.id === 'praezision');
  const bonus = level * (tech ? tech.effectPerLevel : 0.02);
  const sizeMod = typeId ? gameData.precisionModifier[typeId] || 0 : 0;
  return Math.max(0.05, Math.min(gameData.precisionMaxPlayer + sizeMod, gameData.precisionBase + bonus + sizeMod));
}

// Spiegelt server/src/game/combat.ts's getEvasionChance()
export function getEvasionChance(gameData: GameData, research: Record<string, number>, typeId: string): number {
  const base = gameData.evasionBase[typeId] || 0;
  if (base <= 0) return 0;
  const level = research.ausweichen || 0;
  const tech = gameData.research.find((r) => r.id === 'ausweichen');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  return Math.min(gameData.evasionMax, base + bonus);
}

// Spiegelt server/src/game/combat.ts's getCritChance()
export function getCritChance(gameData: GameData, research: Record<string, number>, typeId: string): number {
  const base = gameData.critChanceBase[typeId] || 0;
  const level = research.kritischetreffer || 0;
  const tech = gameData.research.find((r) => r.id === 'kritischetreffer');
  const bonus = level * (tech ? tech.effectPerLevel : 0.015);
  return Math.min(gameData.critChanceMax, base + bonus);
}

// Spiegelt server/src/game/combat.ts's getCritDamageMultiplier()
export function getCritDamageMultiplier(gameData: GameData, typeId: string): number {
  return gameData.critDamageMultiplierByClass[typeId] ?? gameData.critDamageDefaultMultiplier;
}

export function schildMultiplier(gameData: GameData, research: Record<string, number>): number {
  const tech = gameData.research.find((r) => r.id === 'schild');
  return 1 + (research.schild || 0) * (tech ? tech.effectPerLevel : 0.1);
}

export function waffenMultiplier(gameData: GameData, research: Record<string, number>): number {
  const tech = gameData.research.find((r) => r.id === 'waffen');
  return 1 + (research.waffen || 0) * (tech ? tech.effectPerLevel : 0.1);
}

export function panzerungMultiplier(gameData: GameData, research: Record<string, number>): number {
  const tech = gameData.research.find((r) => r.id === 'panzerung');
  return 1 + (research.panzerung || 0) * (tech ? tech.effectPerLevel : 0.1);
}



// Spiegelt server/src/game/combat.ts's getEffectiveStats() 1:1 fuer den Schiffs-Zweig - fuer die
// "Basiswert (Effektivwert)"-Anzeige auf den Bau-Karten (Nutzerentscheidung), damit sichtbar wird,
// was Forschung/Klasse/Schiffs-Module/Kampf-Booster tatsaechlich bewirken, ohne extra in den
// Kampfsimulator wechseln zu muessen.
export function getEffectiveShipStats(
  gameData: GameData,
  state: PlayerState,
  ship: ShipDefinition
): { waffen: number; schild: number; panzerung: number } {
  const kampfBoost = isBoosterActive(state, 'kampf') ? gameData.kampfBoostMultiplier : 1;
  const classMult = classMultipliers(gameData, state.playerClass);
  const waffenModule = 1 + (state.shipModules[`${ship.id}_waffen`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  const schildModule = 1 + (state.shipModules[`${ship.id}_schild`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  const panzerungModule = 1 + (state.shipModules[`${ship.id}_panzerung`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  return {
    waffen: ship.stats.waffen * waffenMultiplier(gameData, state.research) * kampfBoost * classMult.waffen * waffenModule,
    schild: ship.stats.schild * schildMultiplier(gameData, state.research) * kampfBoost * classMult.schild * schildModule,
    panzerung: ship.stats.panzerung * panzerungMultiplier(gameData, state.research) * kampfBoost * classMult.panzerung * panzerungModule,
  };
}

// Spiegelt server/src/game/combat.ts's getEffectiveStats() 1:1 fuer den Verteidigungs-Zweig -
// Kuppeln melden weiterhin schild=0 (ihr Beitrag laeuft komplett ueber computeDomeSharedPool()).
export function getEffectiveDefenseStats(
  gameData: GameData,
  state: PlayerState,
  def: DefenseDefinition
): { waffen: number; schild: number; panzerung: number } {
  const kampfBoost = isBoosterActive(state, 'kampf') ? gameData.kampfBoostMultiplier : 1;
  const classMult = classMultipliers(gameData, state.playerClass);
  const ownSchild = def.isDome ? 0 : def.stats.schild;
  const waffenModule = 1 + (state.shipModules[`${def.id}_waffen`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  const schildModule = 1 + (state.shipModules[`${def.id}_schild`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  const panzerungModule = 1 + (state.shipModules[`${def.id}_panzerung`] || 0) * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
  return {
    waffen: def.stats.waffen * waffenMultiplier(gameData, state.research) * kampfBoost * classMult.waffen * waffenModule,
    schild: ownSchild * schildMultiplier(gameData, state.research) * kampfBoost * classMult.schild * schildModule,
    panzerung: def.stats.panzerung * panzerungMultiplier(gameData, state.research) * kampfBoost * classMult.panzerung * panzerungModule,
  };
}

// Bonus-Aufschlüsselung fuer die "Basiswert (Effektivwert)"-Anzeige (Nutzerentscheidung 04.08.2026):
// zeigt beim Hover/Tap auf den gruenen Effektivwert, WELCHE einzelnen Boni ihn zusammensetzen
// (Forschung/Klasse/Modul/Kampf-Booster), statt nur das Endergebnis. Nur die tatsaechlich aktiven
// Boni werden gelistet - ein Stat ohne jede Forschung/Modul/Klassen-Bonus liefert eine leere Liste.
export interface StatBonusLine {
  label: string;
  percent: string;
}

function formatBonusPercent(mult: number): string {
  const pct = Math.round((mult - 1) * 1000) / 10;
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function statBonusLines(
  gameData: GameData,
  state: PlayerState,
  typeId: string,
  statKey: 'waffen' | 'schild' | 'panzerung',
  ownStat: number
): StatBonusLine[] {
  if (ownStat <= 0) return [];
  const lines: StatBonusLine[] = [];
  const researchMult =
    statKey === 'waffen'
      ? waffenMultiplier(gameData, state.research)
      : statKey === 'schild'
      ? schildMultiplier(gameData, state.research)
      : panzerungMultiplier(gameData, state.research);
  const researchLevel = state.research[statKey] || 0;
  if (researchLevel > 0) lines.push({ label: `🔬 Forschung (Stufe ${researchLevel})`, percent: formatBonusPercent(researchMult) });

  const classMult = classMultipliers(gameData, state.playerClass)[statKey];
  if (classMult !== 1) lines.push({ label: '🎖️ Klassen-Bonus', percent: formatBonusPercent(classMult) });

  const moduleLevel = state.shipModules[`${typeId}_${statKey}`] || 0;
  if (moduleLevel > 0) {
    const moduleMult = 1 + moduleLevel * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    lines.push({ label: `⚙️ Modul (Stufe ${moduleLevel})`, percent: formatBonusPercent(moduleMult) });
  }

  if (isBoosterActive(state, 'kampf')) {
    lines.push({ label: '⚡ Kampf-Booster (aktiv)', percent: formatBonusPercent(gameData.kampfBoostMultiplier) });
  }

  return lines;
}

export function getShipStatBreakdown(
  gameData: GameData,
  state: PlayerState,
  ship: ShipDefinition,
  statKey: 'waffen' | 'schild' | 'panzerung'
): StatBonusLine[] {
  return statBonusLines(gameData, state, ship.id, statKey, ship.stats[statKey]);
}

export function getDefenseStatBreakdown(
  gameData: GameData,
  state: PlayerState,
  def: DefenseDefinition,
  statKey: 'waffen' | 'schild' | 'panzerung'
): StatBonusLine[] {
  const ownStat = statKey === 'schild' && def.isDome ? 0 : def.stats[statKey];
  return statBonusLines(gameData, state, def.id, statKey, ownStat);
}

// Schildkuppel-Bonus: Summe aller Kuppel-Schildwerte, gemeinsamer Pool statt Pro-Anlage-Verteilung.
// Spiegelt server/src/game/combat.ts's computeDomeSharedPool() 1:1 - inkl. Klassen-Bonus (z.B.
// Bollwerks +50% Schild), 24h-Kampf-Booster und Schild-Modulen (Kuppeln melden in
// getEffectiveStats() IMMER schild=0, ihr gesamter Beitrag laeuft ausschliesslich hier durch).
export function computeDomeSharedPool(
  gameData: GameData,
  state: PlayerState,
): number {
  const kampfBoost = isBoosterActive(state, 'kampf') ? gameData.kampfBoostMultiplier : 1;
  const classSchildMult = getClassSchildMultiplier(gameData, state.playerClass);
  let total = 0;
  gameData.defenses.forEach((d) => {
    if (!d.isDome) return;
    const count = state.defense[d.id] || 0;
    if (count <= 0) return;
    const moduleLevel = state.shipModules[`${d.id}_schild`] || 0;
    const moduleMult = 1 + moduleLevel * SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL;
    total += count * d.stats.schild * kampfBoost * classSchildMult * moduleMult;
  });
  return total * schildMultiplier(gameData, state.research);
}

// Lesbare deutsche Bezeichnung fuer die Antriebsklasse eines Schiffs (siehe driveType in
// types/game.ts) - fuer die Geschwindigkeits-Anzeige im Schiffs-Info-Popup.
export function driveTypeLabel(driveType: 'rakete' | 'impuls' | 'hyperraum'): string {
  return { rakete: 'Raketenantrieb', impuls: 'Impulsantrieb', hyperraum: 'Hyperraumantrieb' }[driveType];
}
