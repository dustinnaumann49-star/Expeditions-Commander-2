import type { BuildingDefinition } from '../types.js';

// Sechs Gebaeudetypen. Jedes Gebaeude existiert pro Spieler genau einmal und wird ueber Stufen
// ausgebaut (kein Stueckzahl-System wie bei Schiffen/Verteidigung). Kein Stufen-Limit - passend
// zur bestehenden Design-Philosophie (siehe README Punkt 8: bewusst unbegrenzt statt Deckelung).
//
// Kosten/Bauzeit-Formel je Stufe (analog RESEARCH/researchCostForLevel): baseCost * costGrowth^level,
// baseTimeSeconds * timeGrowth^level (vor Bauzeit-Forschung/Booster/Roboter-Nanit-Multiplikator).
//
// Produktionsformel Minen (pro Stunde, Stufe L): baseOutput * L * 1.1^L, multipliziert mit dem
// Energiefaktor (min(1, erzeugte/benoetigte Energie)) sowie der bestehenden Mining-Forschung
// (siehe buildings.ts/actions.ts: miningMultiplier() wird auch hier angewendet).
// Energieverbrauch je Mine (Stufe L): baseEnergyUse * L * 1.1^L.
// Energieertrag Solarkraftwerk (Stufe L): baseEnergyOutput * L * 1.1^L.
//
// V2/V3-Stufen (05.08.2026, Nutzerentscheidung): analog zur Allianz-Station
// (data/stationBuildings.ts), aber OHNE deren Level-Cap 30 - jede Stufe bleibt wie bisher
// unbegrenzt ausbaubar. V1 behaelt die bestehenden, unpraefixierten IDs (bestehende Spielstaende
// bleiben kompatibel), nur V2/V3 bekommen neue v2_/v3_-IDs. Multiplikatoren relativ zu V1 bei
// Stufe 1 identisch zur Station uebernommen: V2 = 2x Kosten / 1,3x Bauzeit / 1,5x Ertrag,
// V3 = 4x Kosten / 1,6x Bauzeit / 2,5x Ertrag. Bilder bewusst wiederverwendet (kein eigenes
// Artwork pro Stufe, wie schon bei der Station entschieden).
export const BUILDINGS: BuildingDefinition[] = [
  // ===== V1 =====
  {
    id: 'metallmine', name: 'Metallmine', img: 'buildings/metallmine.jpg',
    lore: 'Die Metallmine gräbt sich tief in die Kruste des Heimatplaneten und fördert das Rohmaterial, aus dem jede Flotte gebaut wird. Ohne sie steht jede Werft still.',
    kind: 'mine_metall', tier: 1,
    baseCost: { metall: 3000, kristall: 1200, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 1800, timeGrowth: 1.35,
    baseOutput: 10000, baseEnergyUse: 700,
  },
  {
    id: 'kristallmine', name: 'Kristallmine', img: 'buildings/kristallmine.jpg',
    lore: 'Kristall entsteht nur unter enormem Druck über Jahrtausende - die Kristallmine erschließt Adern, die für Elektronik und Schildgeneratoren unverzichtbar sind.',
    kind: 'mine_kristall', tier: 1,
    baseCost: { metall: 4000, kristall: 2500, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2100, timeGrowth: 1.35,
    baseOutput: 6700, baseEnergyUse: 700,
  },
  {
    id: 'deuteriummine', name: 'Deuterium-Synthetisierer', img: 'buildings/deuteriummine.jpg',
    lore: 'Der Synthetisierer filtert schweren Wasserstoff aus unterirdischen Eisvorkommen - der Treibstoff, ohne den keine Flotte ihren Heimathafen verlassen könnte.',
    kind: 'mine_deuterium', tier: 1,
    baseCost: { metall: 5000, kristall: 4000, deuterium: 1000 }, costGrowth: 1.6,
    baseTimeSeconds: 2400, timeGrowth: 1.35,
    baseOutput: 3300, baseEnergyUse: 1100,
  },
  {
    id: 'solarkraftwerk', name: 'Solarkraftwerk', img: 'buildings/solarkraftwerk.jpg',
    lore: 'Endlose Reihen von Kollektoren versorgen die Minen mit der Energie, die sie zum Betrieb brauchen. Ohne ausreichend Energie laufen selbst die größten Minen nur auf Sparflamme.',
    kind: 'energie', tier: 1,
    baseCost: { metall: 3500, kristall: 1800, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 1800, timeGrowth: 1.3,
    baseEnergyOutput: 1300,
  },
  {
    id: 'roboterfabrik', name: 'Roboterfabrik', img: 'buildings/roboterfabrik.jpg',
    lore: 'Automatisierte Fertigungsstraßen übernehmen die Schwerstarbeit beim Bau von Gebäuden, Schiffen und Verteidigungsanlagen und verkürzen so jede Bauzeit spürbar.',
    kind: 'roboter', tier: 1,
    baseCost: { metall: 8000, kristall: 4500, deuterium: 1500 }, costGrowth: 1.85,
    baseTimeSeconds: 3600, timeGrowth: 1.4,
  },
  {
    id: 'nanitenfabrik', name: 'Nanitenfabrik', img: 'buildings/nanitenfabrik.jpg',
    lore: 'Schwärme mikroskopischer Bau-Einheiten arbeiten parallel an jedem Projekt - die Krönung der Fertigungstechnik, deutlich stärker als jede Roboterfabrik.',
    kind: 'nanit', tier: 1,
    baseCost: { metall: 250000, kristall: 150000, deuterium: 100000 }, costGrowth: 2.0,
    baseTimeSeconds: 14400, timeGrowth: 1.5,
  },

  // ===== V2 (2x Kosten, 1.3x Bauzeit, 1.5x Ertrag relativ zu V1) =====
  {
    id: 'v2_metallmine', name: 'Metallmine (V2)', img: 'buildings/metallmine.jpg',
    lore: 'Die Metallmine gräbt sich tief in die Kruste des Heimatplaneten und fördert das Rohmaterial, aus dem jede Flotte gebaut wird. Ohne sie steht jede Werft still.',
    kind: 'mine_metall', tier: 2,
    baseCost: { metall: 6000, kristall: 2400, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 2340, timeGrowth: 1.35,
    baseOutput: 15000, baseEnergyUse: 1050,
  },
  {
    id: 'v2_kristallmine', name: 'Kristallmine (V2)', img: 'buildings/kristallmine.jpg',
    lore: 'Kristall entsteht nur unter enormem Druck über Jahrtausende - die Kristallmine erschließt Adern, die für Elektronik und Schildgeneratoren unverzichtbar sind.',
    kind: 'mine_kristall', tier: 2,
    baseCost: { metall: 8000, kristall: 5000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2730, timeGrowth: 1.35,
    baseOutput: 10050, baseEnergyUse: 1050,
  },
  {
    id: 'v2_deuteriummine', name: 'Deuterium-Synthetisierer (V2)', img: 'buildings/deuteriummine.jpg',
    lore: 'Der Synthetisierer filtert schweren Wasserstoff aus unterirdischen Eisvorkommen - der Treibstoff, ohne den keine Flotte ihren Heimathafen verlassen könnte.',
    kind: 'mine_deuterium', tier: 2,
    baseCost: { metall: 10000, kristall: 8000, deuterium: 2000 }, costGrowth: 1.6,
    baseTimeSeconds: 3120, timeGrowth: 1.35,
    baseOutput: 4950, baseEnergyUse: 1650,
  },
  {
    id: 'v2_solarkraftwerk', name: 'Solarkraftwerk (V2)', img: 'buildings/solarkraftwerk.jpg',
    lore: 'Endlose Reihen von Kollektoren versorgen die Minen mit der Energie, die sie zum Betrieb brauchen. Ohne ausreichend Energie laufen selbst die größten Minen nur auf Sparflamme.',
    kind: 'energie', tier: 2,
    baseCost: { metall: 7000, kristall: 3600, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 2340, timeGrowth: 1.3,
    baseEnergyOutput: 1950,
  },
  {
    id: 'v2_roboterfabrik', name: 'Roboterfabrik (V2)', img: 'buildings/roboterfabrik.jpg',
    lore: 'Automatisierte Fertigungsstraßen übernehmen die Schwerstarbeit beim Bau von Gebäuden, Schiffen und Verteidigungsanlagen und verkürzen so jede Bauzeit spürbar.',
    kind: 'roboter', tier: 2,
    baseCost: { metall: 16000, kristall: 9000, deuterium: 3000 }, costGrowth: 1.85,
    baseTimeSeconds: 4680, timeGrowth: 1.4,
  },
  {
    id: 'v2_nanitenfabrik', name: 'Nanitenfabrik (V2)', img: 'buildings/nanitenfabrik.jpg',
    lore: 'Schwärme mikroskopischer Bau-Einheiten arbeiten parallel an jedem Projekt - die Krönung der Fertigungstechnik, deutlich stärker als jede Roboterfabrik.',
    kind: 'nanit', tier: 2,
    baseCost: { metall: 500000, kristall: 300000, deuterium: 200000 }, costGrowth: 2.0,
    baseTimeSeconds: 18720, timeGrowth: 1.5,
  },

  // ===== V3 (4x Kosten, 1.6x Bauzeit, 2.5x Ertrag relativ zu V1) =====
  {
    id: 'v3_metallmine', name: 'Metallmine (V3)', img: 'buildings/metallmine.jpg',
    lore: 'Die Metallmine gräbt sich tief in die Kruste des Heimatplaneten und fördert das Rohmaterial, aus dem jede Flotte gebaut wird. Ohne sie steht jede Werft still.',
    kind: 'mine_metall', tier: 3,
    baseCost: { metall: 12000, kristall: 4800, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 2880, timeGrowth: 1.35,
    baseOutput: 25000, baseEnergyUse: 1750,
  },
  {
    id: 'v3_kristallmine', name: 'Kristallmine (V3)', img: 'buildings/kristallmine.jpg',
    lore: 'Kristall entsteht nur unter enormem Druck über Jahrtausende - die Kristallmine erschließt Adern, die für Elektronik und Schildgeneratoren unverzichtbar sind.',
    kind: 'mine_kristall', tier: 3,
    baseCost: { metall: 16000, kristall: 10000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 3360, timeGrowth: 1.35,
    baseOutput: 16750, baseEnergyUse: 1750,
  },
  {
    id: 'v3_deuteriummine', name: 'Deuterium-Synthetisierer (V3)', img: 'buildings/deuteriummine.jpg',
    lore: 'Der Synthetisierer filtert schweren Wasserstoff aus unterirdischen Eisvorkommen - der Treibstoff, ohne den keine Flotte ihren Heimathafen verlassen könnte.',
    kind: 'mine_deuterium', tier: 3,
    baseCost: { metall: 20000, kristall: 16000, deuterium: 4000 }, costGrowth: 1.6,
    baseTimeSeconds: 3840, timeGrowth: 1.35,
    baseOutput: 8250, baseEnergyUse: 2750,
  },
  {
    id: 'v3_solarkraftwerk', name: 'Solarkraftwerk (V3)', img: 'buildings/solarkraftwerk.jpg',
    lore: 'Endlose Reihen von Kollektoren versorgen die Minen mit der Energie, die sie zum Betrieb brauchen. Ohne ausreichend Energie laufen selbst die größten Minen nur auf Sparflamme.',
    kind: 'energie', tier: 3,
    baseCost: { metall: 14000, kristall: 7200, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 2880, timeGrowth: 1.3,
    baseEnergyOutput: 3250,
  },
  {
    id: 'v3_roboterfabrik', name: 'Roboterfabrik (V3)', img: 'buildings/roboterfabrik.jpg',
    lore: 'Automatisierte Fertigungsstraßen übernehmen die Schwerstarbeit beim Bau von Gebäuden, Schiffen und Verteidigungsanlagen und verkürzen so jede Bauzeit spürbar.',
    kind: 'roboter', tier: 3,
    baseCost: { metall: 32000, kristall: 18000, deuterium: 6000 }, costGrowth: 1.85,
    baseTimeSeconds: 5760, timeGrowth: 1.4,
  },
  {
    id: 'v3_nanitenfabrik', name: 'Nanitenfabrik (V3)', img: 'buildings/nanitenfabrik.jpg',
    lore: 'Schwärme mikroskopischer Bau-Einheiten arbeiten parallel an jedem Projekt - die Krönung der Fertigungstechnik, deutlich stärker als jede Roboterfabrik.',
    kind: 'nanit', tier: 3,
    baseCost: { metall: 1000000, kristall: 600000, deuterium: 400000 }, costGrowth: 2.0,
    baseTimeSeconds: 23040, timeGrowth: 1.5,
  },
];

export function findBuilding(id: string): BuildingDefinition | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

export function buildingsForTier(tier: 1 | 2 | 3): BuildingDefinition[] {
  return BUILDINGS.filter((b) => (b.tier ?? 1) === tier);
}

// Freischalt-Schwellen fuer die naechste Stufe (05.08.2026, Nutzerentscheidung): anders als bei
// der Allianz-Station (einheitlicher Level-Cap 30 fuer alle drei Minen) hat hier jede Mine ihre
// eigene Schwelle, dieselben Werte gelten fuer den Sprung V1->V2 UND V2->V3 (siehe
// checkHomeBuildingTierUnlock() in actions.ts).
export const HOME_TIER_UNLOCK_LEVELS: Record<1 | 2, Record<string, number>> = {
  1: { metallmine: 36, kristallmine: 32, deuteriummine: 30 },
  2: { v2_metallmine: 36, v2_kristallmine: 32, v2_deuteriummine: 30 },
};
