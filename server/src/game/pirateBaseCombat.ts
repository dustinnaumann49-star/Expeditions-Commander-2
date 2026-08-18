import { combatFleetPowerBase, pick503020 } from './combat.js';
import { DEFENSES } from './data/defenses.js';
import { PIRATE_RESEARCH_SHARE } from './data/combatConstants.js';
import {
  PIRATE_BASE_SEED_FLEET,
  PIRATE_BASE_SEED_DEFENSE,
  PIRATE_BASE_MULTIPLIER_ROLL,
  PIRATE_BASE_DEFENSE_FACTOR,
  LOOT_CURVE_EXPONENT,
  LOOT_CURVE_ANCHOR_POWER,
  LOOT_CURVE_ANCHOR_VALUE,
  PIRATE_BASE_LOOT_FACTOR,
  PIRATE_BASE_LOOT_SPLIT,
  PIRATE_BASE_MAX_ATTRITION,
  PIRATE_BASE_REGEN_MS,
} from './data/economy.js';

// ========== ENTSCHEIDUNG 5: GARNISON SKALIERT MIT (Block C, Schritt 7, 18.08.2026) ==========
//
// Bewusst eine EIGENE Datei und bewusst OHNE jeden Datenbank-Bezug: pirateBaseState.ts oeffnet
// ueber state.ts -> db.ts die produktive Datenbank schon beim Import, ist also aus einem Messskript
// heraus nicht ladbar. Genau deshalb hat run_pirate_base.mjs die Garnisons-Konstanten bisher per
// Hand gespiegelt (Messregel 16). Alles, was gemessen werden muss, steht jetzt hier oder in
// data/economy.ts und ist direkt importierbar.
//
// DAS PRINZIP, in einem Satz: die Basis stellt dem Angreifer eine Welle in der Groessenordnung
// SEINER eigenen Flottenmacht entgegen - zusammengesetzt aus dem, was sie tatsaechlich gebaut hat,
// in der Menge aber an den Angreifer gekoppelt (dasselbe Muster wie jeder Piraten-Sektor, siehe
// PIRATEN_MULTIPLIER_ROLL/targetPower in missions.ts).
//
// Drei Dinge, die daran bewusst so und nicht anders sind:
//
// 1. DIE MENGE IST NICHT AM BESTAND GEDECKELT. Eine Deckelung am tatsaechlichen Bestand waere die
//    naheliegende Loesung gewesen und ist verworfen: eine frische Basis hat 2,08 Mrd BasePower, die
//    reale Spielerflotte 18,58 Mrd - der Deckel haette also GENAU den Zustand konserviert, den
//    Entscheidung 5 beseitigen soll (0 % Verlust fuer entwickelte Flotten), und zwar auf Jahre,
//    weil eine Basis mit rund 14 Mio Wert/Tag nachwaechst. Die Basis "ruft Verstaerkung" - dieselbe
//    Fiktion wie bei jedem anderen Piraten-Sektor, wo der Gegner ebenfalls aus dem Nichts in
//    Hoehe der eigenen Macht erscheint.
//
// 2. DAFUER ENTSCHEIDET DER BESTAND UEBER DIE GEFECHTSBEREITSCHAFT (garrisonReadiness). Eine
//    leergefarmte Basis stellt nur noch einen entsprechend kleineren Teil dieser Welle - und gibt
//    ueber die Beute-Kurve entsprechend weniger her. Das ist die zweite Haelfte der Schranke gegen
//    Dauer-Farming: die Erholungszeit begrenzt die HAEUFIGKEIT, die Gefechtsbereitschaft den
//    ERTRAG, solange die Basis nicht wieder aufgebaut hat. Nach oben ist sie bei 1,0 gedeckelt:
//    eine ueber Wochen gewachsene Basis wird dadurch nicht schwerer, sondern haelt laengere
//    Farm-Serien aus, bevor ihr Ertrag einbricht.
//
// 3. VERLUSTE TREFFEN DEN ECHTEN BESTAND, und zwar als ANTEIL. Wird die Welle zu 40 % vernichtet,
//    verliert die Basis 40 % ihres tatsaechlichen Bestands je Einheitentyp - unabhaengig davon, ob
//    die Welle groesser oder kleiner als der Bestand war. Ohne das waere die Basis unangreifbar im
//    Wortsinn: man haette Verstaerkungswellen vernichtet, ohne der Basis selbst etwas zu nehmen.

/** Rohe Machtsumme (Waffen+Schild+Panzerung, ohne Forschung) des kompletten Bestands einer Basis. */
export function garrisonPower(fleet: Record<string, number>, defense: Record<string, number>): number {
  return combatFleetPowerBase({ ...fleet, ...defense });
}

/** Machtsumme einer frisch angelegten Basis - Bezugspunkt der Gefechtsbereitschaft (siehe oben). */
export const PIRATE_BASE_FULL_STRENGTH_POWER = garrisonPower(PIRATE_BASE_SEED_FLEET, PIRATE_BASE_SEED_DEFENSE);

/**
 * Gefechtsbereitschaft: 0 (nichts mehr da) bis 1 (mindestens Grundbestand). Bewusst nach oben
 * gedeckelt, siehe Punkt 2 im Kopfkommentar.
 */
export function garrisonReadiness(fleet: Record<string, number>, defense: Record<string, number>): number {
  if (PIRATE_BASE_FULL_STRENGTH_POWER <= 0) return 0;
  return Math.min(1, garrisonPower(fleet, defense) / PIRATE_BASE_FULL_STRENGTH_POWER);
}

/**
 * Skaliert einen Bestand proportional auf eine Ziel-Machtsumme. Der Faktor darf ueber 1 liegen
 * (Verstaerkung) oder darunter (nur ein Teil der Garnison ruecke aus). Einheitentypen mit Bestand 0
 * bleiben 0 - die Zusammensetzung der Welle ist damit immer die, die die Basis tatsaechlich gebaut
 * hat. Rueckgabe enthaelt den verwendeten Faktor, weil die Verlustverrechnung ihn braucht.
 */
function scaleToPower(stock: Record<string, number>, targetPower: number): { units: Record<string, number>; factor: number } {
  const own = garrisonPower(stock, {});
  if (own <= 0 || targetPower <= 0) return { units: {}, factor: 0 };
  const factor = targetPower / own;
  const units: Record<string, number> = {};
  Object.entries(stock).forEach(([id, qty]) => {
    if (qty <= 0) return;
    // Mindestens 1 Stueck, sobald der Typ ueberhaupt vorhanden ist - sonst verschwinden bei sehr
    // kleinen Faktoren ausgerechnet die schweren Einheiten (Bestand 50 Reaper * 0,01 = 0) und die
    // Welle bestuende nur noch aus Jaegern.
    const scaled = Math.max(1, Math.round(qty * factor));
    units[id] = scaled;
  });
  return { units, factor };
}

export interface RolledGarrison {
  /** Was tatsaechlich in den Kampf geht (Schiffe und Anlagen getrennt, wie in missions.ts). */
  ships: Record<string, number>;
  defenses: Record<string, number>;
  /** Gewuerfelter Feindstaerke-Anteil der Angreiferflotte - fuer den Kampfbericht. */
  multiplier: number;
  readiness: number;
  /** Skalierungsfaktoren, mit denen der Verlustanteil auf den echten Bestand zurueckgerechnet wird. */
  shipFactor: number;
  defenseFactor: number;
}

/**
 * Stellt die Verteidigungswelle einer Basis gegen eine angreifende Flotte zusammen.
 * `table` ist nur fuer Messlaeufe da (Kandidaten-Sweep ohne Messbuild, siehe run_pirate_base.mjs) -
 * im Spielbetrieb wird sie nie uebergeben.
 */
export function rollPirateBaseGarrison(
  fleet: Record<string, number>,
  defense: Record<string, number>,
  sentPower: number,
  table: [number, number, number | [number, number]] = PIRATE_BASE_MULTIPLIER_ROLL
): RolledGarrison {
  const multiplier = pick503020(table);
  const readiness = garrisonReadiness(fleet, defense);
  const shipPart = scaleToPower(fleet, sentPower * multiplier * readiness);
  // Anlagen mit eigenem Faktor, exakt wie sektorDefenseFactor() in missions.ts/groupOps.ts.
  const defensePart = scaleToPower(defense, sentPower * PIRATE_BASE_DEFENSE_FACTOR * readiness);
  return {
    ships: shipPart.units,
    defenses: defensePart.units,
    multiplier,
    readiness,
    shipFactor: shipPart.factor,
    defenseFactor: defensePart.factor,
  };
}

/**
 * Forschungsstand, mit dem die Garnison kaempft: elementweise das MAXIMUM aus der eigenen Forschung
 * der Basis und der des Angreifers (mal PIRATE_RESEARCH_SHARE).
 *
 * WARUM: `sideBStatsOverride` in resolvePirateBaseAttack() umgeht getEffectiveStats() und damit
 * computePirateResearch() - die Basis kaempfte deshalb mit ihrer EIGENEN Forschung, bei einer
 * frischen Basis also mit Stufe 0, waehrend jeder Sektor-Pirat ueber PIRATE_RESEARCH_SHARE = 1,0
 * den vollen Forschungsstand des Angreifers bekommt. Die Multiplikator-Tabellen sind aber gegen
 * diese Welt kalibriert; ohne den Angleich waere dieselbe Zahl an der Basis ein deutlich
 * schwaecherer Gegner als im Sektor, und das Zielniveau "zwischen Hoch und Elite" ueber die Tabelle
 * allein nicht erreichbar. Dieselbe Fundstelle-Form wie bei Entscheidung 4.3 (Boss ohne
 * Forschungsskalierung), dort am 17.08.2026 mit demselben Ergebnis entschieden.
 *
 * Bewusst NUR Forschung - Klassenbonus, Module und Kampf-Booster bleiben beim Spieler, genau wie
 * bei PIRATE_RESEARCH_SHARE selbst.
 */
export function garrisonResearch(
  baseResearch: Record<string, number>,
  attackerResearch: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...baseResearch };
  Object.entries(attackerResearch).forEach(([id, level]) => {
    const shared = (level || 0) * PIRATE_RESEARCH_SHARE;
    merged[id] = Math.max(merged[id] || 0, shared);
  });
  return merged;
}

/**
 * Beute aus der vernichteten Garnison (Entscheidung 5 in Verbindung mit Entscheidung 2) statt eines
 * festen Prozentsatzes des Basis-Lagers.
 *
 * Der alte Weg (35 % des auf LOOT_BASIS_CAP gedeckelten Bestands) lieferte IMMER dieselben
 * 32,2 Mio Wert, egal ob die Angriffsflotte 0,37 oder 31,57 Mrd wert war - eine feste Belohnung
 * gegen eine wachsende Flotte, das Gegenstueck zur festen Gegnerstaerke (Messregel 12). Mit der
 * Kopplung an die vernichtete Feindmacht entfaellt auch der Deckel selbst: er hat seit dem
 * 12.08.2026 ausschliesslich die Beute begrenzt, und die haengt jetzt an einer anderen Groesse.
 */
export function pirateBaseLoot(destroyedPower: number): { metall: number; kristall: number; deuterium: number } {
  if (destroyedPower <= 0) return { metall: 0, kristall: 0, deuterium: 0 };
  const value =
    LOOT_CURVE_ANCHOR_VALUE *
    Math.pow(destroyedPower / LOOT_CURVE_ANCHOR_POWER, LOOT_CURVE_EXPONENT) *
    PIRATE_BASE_LOOT_FACTOR;
  return {
    metall: Math.round(value * PIRATE_BASE_LOOT_SPLIT.metall),
    kristall: Math.round(value * PIRATE_BASE_LOOT_SPLIT.kristall),
    deuterium: Math.round(value * PIRATE_BASE_LOOT_SPLIT.deuterium),
  };
}

/** Ist die Einheiten-Id eine Verteidigungsanlage? (Mehrfach gebraucht, hier einmal zentral.) */
export function isDefenseUnitId(id: string): boolean {
  return DEFENSES.some((d) => d.id === id);
}


/**
 * Verlustanteil, der nach einem Angriff auf den ECHTEN Bestand durchschlaegt - gedeckelt auf
 * PIRATE_BASE_MAX_ATTRITION. Herleitung dort; kurz: ohne Deckel loescht ein einziger Angriff einer
 * entwickelten Flotte die ganze Garnison, und die Basis ist auf Monate hinaus wertlos.
 * Der KAMPFBERICHT bleibt davon unberuehrt - die Welle wird zu 100 % vernichtet gemeldet, wenn sie
 * zu 100 % vernichtet wurde. Gedeckelt wird nur, was der Basis dauerhaft fehlt.
 */
export function attritionShare(waveLossShare: number): number {
  return Math.min(waveLossShare, PIRATE_BASE_MAX_ATTRITION);
}

/**
 * Wiederaufbau der Garnison bis zum Grundbestand (Nachtrag 5a: "Erholungszeit statt einer festen
 * Untergrenze"). Linear ueber PIRATE_BASE_REGEN_MS, je Einheitentyp getrennt, NIE ueber den
 * Grundbestand hinaus - was eine Basis darueber hinaus besitzt, ist selbst gebaut und bleibt
 * unangetastet.
 *
 * Bewusst gerundet statt abgeschnitten: bei den seltenen Typen (50 Reaper) liegt der Zuwachs je
 * Schritt sonst unter 1 Stueck und ginge dauerhaft verloren. Die Basis waechst dadurch bei diesen
 * Typen minimal schneller als linear - das ist der Preis fuer ganzzahlige Beststaende und in der
 * Groessenordnung belanglos.
 */
export function regenerateGarrison(
  fleet: Record<string, number>,
  defense: Record<string, number>,
  elapsedMs: number
): void {
  if (elapsedMs <= 0) return;
  const share = elapsedMs / PIRATE_BASE_REGEN_MS;
  const grow = (stock: Record<string, number>, seed: Record<string, number>) => {
    Object.entries(seed).forEach(([id, full]) => {
      const have = stock[id] || 0;
      if (have >= full) return;
      stock[id] = Math.min(full, have + Math.round(full * share));
    });
  };
  grow(fleet, PIRATE_BASE_SEED_FLEET);
  grow(defense, PIRATE_BASE_SEED_DEFENSE);
}
