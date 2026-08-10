import type { StationBuildingDefinition } from '../types.js';

// ===== KOMPENSATIONSFAKTOR MINEN-ERTRAG (10.08.2026, Nutzerentscheidung) =====
// Die Allianz-Station ist bewusst NICHT an Forschung, Wirtschaftsklasse oder Booster eines
// einzelnen Mitglieds gekoppelt (siehe Design-Kommentar in stations.ts) - bei zwei Mitgliedern mit
// unterschiedlicher Forschung waere nicht definiert, wessen Stand gelten soll. Diese Entkopplung
// bleibt richtig.
//
// Sie wurde nur nie ausgeglichen. Die Heimatbasis bekommt auf denselben Basiswerten und derselben
// Formel bis zu 6,12x obendrauf: Mining-Forschung 10 (2,0) * Mining-Boost Minen 10 (1,5) *
// Prospektor (1,2) * Abbau-Booster (1,7). Die Station bekam davon nichts und produzierte bei
// gleicher Gebaeudestufe ein Sechstel - kein Balance-Beschluss, sondern eine Luecke.
//
// Ausgeglichen wird bewusst NUR der dauerhafte Forschungsanteil (2,0 * 1,5 = 3,0), nicht die
// vollen 6,12: Prospektor ist eine Klassenwahl unter mehreren und der Abbau-Booster ist zeitlich
// begrenzt und kostet DM. Beides gehoert dem einzelnen Spieler, nicht dem Gebaeude.
//
// DIES IST EIN KALIBRIER-KNOPF, KEIN FESTWERT. Er ist gegen die alte Endspiel-Baseline von
// 21,69 Mrd/Tag gesetzt, und genau die faellt nach Block A des Umsetzungsplans weg. Bei voll
// ausgebauter Station (alle drei Stufen auf Level 30, ohne Module) ergibt der Wert 3 zusammen mit
// der 2x/4x-Ertragsrelation unten rund 7,9 Mrd/Tag - viel, gemessen daran, dass das eine voellig
// passive Quelle ohne Flottenbindung und ohne Risiko ist. Nach derselben Logik hat Entscheidung 3
// des Plans den Raid halbiert. Erste Groesse, die nach Block A neu zu messen ist.
export const STATION_MINING_COMPENSATION = 3;

// Allianz-Station-Gebaeude: 3 Stufen (V1/V2/V3) x 4 Gebaeude (Metallmine/Kristallmine/
// Deuterium-Synthetisierer/Solarkraftwerk), siehe .claude/plans/tranquil-forging-pretzel.md.
// V1 nutzt bewusst dieselben Basiswerte wie die Heimatbasis-Pendants (data/buildings.ts), nur mit
// Level-Cap 30 (Nutzerentscheidung) statt unbegrenzt. V2/V3 sind erster Wurf (wie jedes
// Wirtschafts-Feature in diesem Projekt live nachkalibrierbar): V2 = 2x Kosten/1.3x Bauzeit/2x
// Ertrag relativ zu V1, V3 = 4x Kosten/1.6x Bauzeit/4x Ertrag relativ zu V1.
// *Geaendert 10.08.2026 (Entscheidung 7.1 des Umsetzungsplans):* der Ertrag lag zuvor bei 1,5x
// bzw. 2,5x bei unveraendert 2x bzw. 4x Kosten - jede Ausbaustufe war damit unwirtschaftlicher als
// die vorherige (210 -> 285 -> 339 Tage Amortisation), obwohl sie als Fortschritt praesentiert
// wird. Energieverbrauch und Solar-Ertrag bleiben bewusst bei 1,5x/2,5x: beide skalieren INNERHALB
// einer Stufe gemeinsam, der Energiefaktor je Stufe aendert sich dadurch nicht.
// Solarkraftwerk hat bewusst KEIN Level-Cap (muss frei ausgebaut werden koennen, um die
// Minen-Energie zu decken).
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
    baseTimeSeconds: 2340, timeGrowth: 1.35, baseOutput: 20000, baseEnergyUse: 1050, maxLevel: 30 },
  { id: 'v2_kristallmine', name: 'Kristallmine (V2)', img: 'buildings/kristallmine.jpg', tier: 2, kind: 'mine_kristall',
    baseCost: { metall: 8000, kristall: 5000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 2730, timeGrowth: 1.35, baseOutput: 13400, baseEnergyUse: 1050, maxLevel: 30 },
  { id: 'v2_deuteriummine', name: 'Deuterium-Synthetisierer (V2)', img: 'buildings/deuteriummine.jpg', tier: 2, kind: 'mine_deuterium',
    baseCost: { metall: 10000, kristall: 8000, deuterium: 2000 }, costGrowth: 1.6,
    baseTimeSeconds: 3120, timeGrowth: 1.35, baseOutput: 6600, baseEnergyUse: 1650, maxLevel: 30 },
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
    baseTimeSeconds: 2880, timeGrowth: 1.35, baseOutput: 40000, baseEnergyUse: 1750, maxLevel: 30 },
  { id: 'v3_kristallmine', name: 'Kristallmine (V3)', img: 'buildings/kristallmine.jpg', tier: 3, kind: 'mine_kristall',
    baseCost: { metall: 16000, kristall: 10000, deuterium: 0 }, costGrowth: 1.6,
    baseTimeSeconds: 3360, timeGrowth: 1.35, baseOutput: 26800, baseEnergyUse: 1750, maxLevel: 30 },
  { id: 'v3_deuteriummine', name: 'Deuterium-Synthetisierer (V3)', img: 'buildings/deuteriummine.jpg', tier: 3, kind: 'mine_deuterium',
    baseCost: { metall: 20000, kristall: 16000, deuterium: 4000 }, costGrowth: 1.6,
    baseTimeSeconds: 3840, timeGrowth: 1.35, baseOutput: 13200, baseEnergyUse: 2750, maxLevel: 30 },
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
