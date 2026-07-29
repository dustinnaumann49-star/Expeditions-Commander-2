import type { StationBuildingDefinition } from '../types.js';

// Allianz-Station-Gebaeude: 3 Stufen (V1/V2/V3) x 4 Gebaeude (Metallmine/Kristallmine/
// Deuterium-Synthetisierer/Solarkraftwerk), siehe .claude/plans/tranquil-forging-pretzel.md.
// V1 nutzt bewusst dieselben Basiswerte wie die Heimatbasis-Pendants (data/buildings.ts), nur mit
// Level-Cap 30 (Nutzerentscheidung) statt unbegrenzt. V2/V3 sind erster Wurf (wie jedes
// Wirtschafts-Feature in diesem Projekt live nachkalibrierbar): V2 = 2x Kosten/1.3x Bauzeit/1.5x
// Ertrag relativ zu V1, V3 = 4x Kosten/1.6x Bauzeit/2.5x Ertrag relativ zu V1. Solarkraftwerk hat
// bewusst KEIN Level-Cap (muss frei ausgebaut werden koennen, um die Minen-Energie zu decken).
// `img`: wiederverwendet bewusst dieselben Bilder wie die Heimatbasis-Gebaeude (Nutzerentscheidung
// - kein eigenes Bild pro Stufe noetig).
export const STATION_BUILDINGS: StationBuildingDefinition[] = [
  // ===== V1 =====
  { id: 'v1_metallmine', name: 'Metallmine (V1)', img: 'buildings/metallmine.jpg', tier: 1, kind: 'mine_metall',
    baseCost: { metall: 3000, kristall: 1200, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 1800, timeGrowth: 1.35, baseOutput: 10000, baseEnergyUse: 700, maxLevel: 30 },
  { id: 'v1_kristallmine', name: 'Kristallmine (V1)', img: 'buildings/kristallmine.jpg', tier: 1, kind: 'mine_kristall',
    baseCost: { metall: 4000, kristall: 2500, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2100, timeGrowth: 1.35, baseOutput: 6700, baseEnergyUse: 700, maxLevel: 30 },
  { id: 'v1_deuteriummine', name: 'Deuterium-Synthetisierer (V1)', img: 'buildings/deuteriummine.jpg', tier: 1, kind: 'mine_deuterium',
    baseCost: { metall: 5000, kristall: 4000, deuterium: 1000 }, costGrowth: 1.6,
    baseTimeSeconds: 2400, timeGrowth: 1.35, baseOutput: 3300, baseEnergyUse: 1100, maxLevel: 30 },
  { id: 'v1_solarkraftwerk', name: 'Solarkraftwerk (V1)', img: 'buildings/solarkraftwerk.jpg', tier: 1, kind: 'energie',
    baseCost: { metall: 3500, kristall: 1800, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 1800, timeGrowth: 1.3, baseEnergyOutput: 1300 },
  { id: 'v1_roboterfabrik', name: 'Roboterfabrik (V1)', img: 'buildings/roboterfabrik.jpg', tier: 1, kind: 'roboter',
    baseCost: { metall: 8000, kristall: 4500, deuterium: 1500 }, costGrowth: 1.85,
    baseTimeSeconds: 3600, timeGrowth: 1.4, maxLevel: 30 },
  { id: 'v1_nanitenfabrik', name: 'Nanitenfabrik (V1)', img: 'buildings/nanitenfabrik.jpg', tier: 1, kind: 'nanit',
    baseCost: { metall: 250000, kristall: 150000, deuterium: 100000 }, costGrowth: 2.0,
    baseTimeSeconds: 14400, timeGrowth: 1.5, maxLevel: 30 },

  // ===== V2 (2x Kosten, 1.3x Bauzeit, 1.5x Ertrag relativ zu V1) =====
  { id: 'v2_metallmine', name: 'Metallmine (V2)', img: 'buildings/metallmine.jpg', tier: 2, kind: 'mine_metall',
    baseCost: { metall: 6000, kristall: 2400, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 2340, timeGrowth: 1.35, baseOutput: 15000, baseEnergyUse: 1050, maxLevel: 30 },
  { id: 'v2_kristallmine', name: 'Kristallmine (V2)', img: 'buildings/kristallmine.jpg', tier: 2, kind: 'mine_kristall',
    baseCost: { metall: 8000, kristall: 5000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2730, timeGrowth: 1.35, baseOutput: 10050, baseEnergyUse: 1050, maxLevel: 30 },
  { id: 'v2_deuteriummine', name: 'Deuterium-Synthetisierer (V2)', img: 'buildings/deuteriummine.jpg', tier: 2, kind: 'mine_deuterium',
    baseCost: { metall: 10000, kristall: 8000, deuterium: 2000 }, costGrowth: 1.6,
    baseTimeSeconds: 3120, timeGrowth: 1.35, baseOutput: 4950, baseEnergyUse: 1650, maxLevel: 30 },
  { id: 'v2_solarkraftwerk', name: 'Solarkraftwerk (V2)', img: 'buildings/solarkraftwerk.jpg', tier: 2, kind: 'energie',
    baseCost: { metall: 7000, kristall: 3600, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 2340, timeGrowth: 1.3, baseEnergyOutput: 1950 },
  { id: 'v2_roboterfabrik', name: 'Roboterfabrik (V2)', img: 'buildings/roboterfabrik.jpg', tier: 2, kind: 'roboter',
    baseCost: { metall: 16000, kristall: 9000, deuterium: 3000 }, costGrowth: 1.85,
    baseTimeSeconds: 4680, timeGrowth: 1.4, maxLevel: 30 },
  { id: 'v2_nanitenfabrik', name: 'Nanitenfabrik (V2)', img: 'buildings/nanitenfabrik.jpg', tier: 2, kind: 'nanit',
    baseCost: { metall: 500000, kristall: 300000, deuterium: 200000 }, costGrowth: 2.0,
    baseTimeSeconds: 18720, timeGrowth: 1.5, maxLevel: 30 },

  // ===== V3 (4x Kosten, 1.6x Bauzeit, 2.5x Ertrag relativ zu V1) =====
  { id: 'v3_metallmine', name: 'Metallmine (V3)', img: 'buildings/metallmine.jpg', tier: 3, kind: 'mine_metall',
    baseCost: { metall: 12000, kristall: 4800, deuterium: 0 }, costGrowth: 1.55,
    baseTimeSeconds: 2880, timeGrowth: 1.35, baseOutput: 25000, baseEnergyUse: 1750, maxLevel: 30 },
  { id: 'v3_kristallmine', name: 'Kristallmine (V3)', img: 'buildings/kristallmine.jpg', tier: 3, kind: 'mine_kristall',
    baseCost: { metall: 16000, kristall: 10000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 3360, timeGrowth: 1.35, baseOutput: 16750, baseEnergyUse: 1750, maxLevel: 30 },
  { id: 'v3_deuteriummine', name: 'Deuterium-Synthetisierer (V3)', img: 'buildings/deuteriummine.jpg', tier: 3, kind: 'mine_deuterium',
    baseCost: { metall: 20000, kristall: 16000, deuterium: 4000 }, costGrowth: 1.6,
    baseTimeSeconds: 3840, timeGrowth: 1.35, baseOutput: 8250, baseEnergyUse: 2750, maxLevel: 30 },
  { id: 'v3_solarkraftwerk', name: 'Solarkraftwerk (V3)', img: 'buildings/solarkraftwerk.jpg', tier: 3, kind: 'energie',
    baseCost: { metall: 14000, kristall: 7200, deuterium: 0 }, costGrowth: 1.5,
    baseTimeSeconds: 2880, timeGrowth: 1.3, baseEnergyOutput: 3250 },
  { id: 'v3_roboterfabrik', name: 'Roboterfabrik (V3)', img: 'buildings/roboterfabrik.jpg', tier: 3, kind: 'roboter',
    baseCost: { metall: 32000, kristall: 18000, deuterium: 6000 }, costGrowth: 1.85,
    baseTimeSeconds: 5760, timeGrowth: 1.4, maxLevel: 30 },
  { id: 'v3_nanitenfabrik', name: 'Nanitenfabrik (V3)', img: 'buildings/nanitenfabrik.jpg', tier: 3, kind: 'nanit',
    baseCost: { metall: 1000000, kristall: 600000, deuterium: 400000 }, costGrowth: 2.0,
    baseTimeSeconds: 23040, timeGrowth: 1.5, maxLevel: 30 },
];

export function findStationBuilding(id: string): StationBuildingDefinition | undefined {
  return STATION_BUILDINGS.find((b) => b.id === id);
}

export function stationBuildingsForTier(tier: 1 | 2 | 3): StationBuildingDefinition[] {
  return STATION_BUILDINGS.filter((b) => b.tier === tier);
}
