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
export const BUILDINGS: BuildingDefinition[] = [
  {
    id: 'metallmine', name: 'Metallmine', img: 'buildings/metallmine.png',
    lore: 'Die Metallmine gräbt sich tief in die Kruste des Heimatplaneten und fördert das Rohmaterial, aus dem jede Flotte gebaut wird. Ohne sie steht jede Werft still.',
    kind: 'mine_metall',
    baseCost: { metall: 3000, kristall: 1200, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 1800, timeGrowth: 1.35,
    baseOutput: 10000, baseEnergyUse: 700,
  },
  {
    id: 'kristallmine', name: 'Kristallmine', img: 'buildings/kristallmine.png',
    lore: 'Kristall entsteht nur unter enormem Druck über Jahrtausende - die Kristallmine erschließt Adern, die für Elektronik und Schildgeneratoren unverzichtbar sind.',
    kind: 'mine_kristall',
    baseCost: { metall: 4000, kristall: 2500, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2100, timeGrowth: 1.35,
    baseOutput: 6700, baseEnergyUse: 700,
  },
  {
    id: 'deuteriummine', name: 'Deuterium-Synthetisierer', img: 'buildings/deuteriummine.png',
    lore: 'Der Synthetisierer filtert schweren Wasserstoff aus unterirdischen Eisvorkommen - der Treibstoff, ohne den keine Flotte ihren Heimathafen verlassen könnte.',
    kind: 'mine_deuterium',
    baseCost: { metall: 5000, kristall: 4000, deuterium: 1000 }, costGrowth: 1.6,
    baseTimeSeconds: 2400, timeGrowth: 1.35,
    baseOutput: 3300, baseEnergyUse: 1100,
  },
  {
    id: 'solarkraftwerk', name: 'Solarkraftwerk', img: 'buildings/solarkraftwerk.png',
    lore: 'Endlose Reihen von Kollektoren versorgen die Minen mit der Energie, die sie zum Betrieb brauchen. Ohne ausreichend Energie laufen selbst die größten Minen nur auf Sparflamme.',
    kind: 'energie',
    baseCost: { metall: 3500, kristall: 1800, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 1800, timeGrowth: 1.3,
    baseEnergyOutput: 1300,
  },
  {
    id: 'roboterfabrik', name: 'Roboterfabrik', img: 'buildings/roboterfabrik.png',
    lore: 'Automatisierte Fertigungsstraßen übernehmen die Schwerstarbeit beim Bau von Gebäuden, Schiffen und Verteidigungsanlagen und verkürzen so jede Bauzeit spürbar.',
    kind: 'roboter',
    baseCost: { metall: 8000, kristall: 4500, deuterium: 1500 }, costGrowth: 1.85,
    baseTimeSeconds: 3600, timeGrowth: 1.4,
  },
  {
    id: 'nanitenfabrik', name: 'Nanitenfabrik', img: 'buildings/nanitenfabrik.png',
    lore: 'Schwärme mikroskopischer Bau-Einheiten arbeiten parallel an jedem Projekt - die Krönung der Fertigungstechnik, deutlich stärker als jede Roboterfabrik.',
    kind: 'nanit',
    baseCost: { metall: 250000, kristall: 150000, deuterium: 100000 }, costGrowth: 2.0,
    baseTimeSeconds: 14400, timeGrowth: 1.5,
  },
];

export function findBuilding(id: string): BuildingDefinition | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
