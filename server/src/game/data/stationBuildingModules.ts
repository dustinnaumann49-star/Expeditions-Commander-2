import { STATION_BUILDINGS } from './stationBuildings.js';
import type { BuildingModuleDefinition } from '../types.js';

// Allianz-Station-Module: gleiche 3 Modul-Kinds pro Mine (Foerdereffizienz/Energiesparmodul/
// Automatisierung) und 2 pro Solarkraftwerk (Ertragssteigerung/Wartungsoptimierung) wie bei der
// Heimatbasis (siehe data/buildingModules.ts), 1:1 fuer alle 3 Stufen generiert statt 33 Eintraege
// von Hand zu tippen (gleiches Prinzip wie shipModules.ts' buildModule()-Generator).
// Kosten leiten sich vom jeweiligen Stations-Gebaeude ab (MODULE_COST_MULTIPLIER), Freischaltung
// ab Gebaeude-Level 20 (innerhalb des 30er-Caps), maxLevel 10 wie ueberall sonst im Spiel.
const MODULE_COST_MULTIPLIER = 500;
const MODULE_TIME_MULTIPLIER = 4;
const MODULE_COST_GROWTH = 1.6;
const MODULE_TIME_GROWTH = 1.4;
const MODULE_REQUIRED_LEVEL = 20;
const MODULE_MAX_LEVEL = 10;

function scaledCost(base: { metall: number; kristall: number; deuterium: number }, factor: number) {
  return { metall: Math.round(base.metall * factor), kristall: Math.round(base.kristall * factor), deuterium: Math.round(base.deuterium * factor) };
}

export const STATION_BUILDING_MODULES: BuildingModuleDefinition[] = STATION_BUILDINGS.flatMap((b) => {
  const baseCost = scaledCost(b.baseCost, MODULE_COST_MULTIPLIER);
  const baseTimeSeconds = b.baseTimeSeconds * MODULE_TIME_MULTIPLIER;
  const shared = { buildingId: b.id, requiredBuildingLevel: MODULE_REQUIRED_LEVEL, maxLevel: MODULE_MAX_LEVEL, baseCost, costGrowth: MODULE_COST_GROWTH, baseTimeSeconds, timeGrowth: MODULE_TIME_GROWTH };
  if (b.kind === 'energie') {
    return [
      { id: `${b.id}_ertragssteigerung`, name: 'Ertragssteigerung', moduleKind: 'output' as const, effectPerLevel: 0.05,
        lore: `Zusätzliche Kollektor-Kaskaden steigern den Energieertrag des Solarkraftwerks über die normale Stufen-Skalierung hinaus.`, ...shared },
      { id: `${b.id}_wartungsoptimierung`, name: 'Wartungsoptimierung', moduleKind: 'buildtime_self' as const, effectPerLevel: 0.03,
        lore: `Eingespielte Wartungstrupps verkürzen die Bauzeit für jede weitere Ausbaustufe des Solarkraftwerks.`, ...shared },
    ];
  }
  return [
    { id: `${b.id}_foerdereffizienz`, name: 'Fördereffizienz', moduleKind: 'output' as const, effectPerLevel: 0.05,
      lore: `Präzisere Bohrköpfe und optimierte Förderbänder steigern den Ertrag zusätzlich zur normalen Stufen-Skalierung.`, ...shared },
    { id: `${b.id}_energiesparmodul`, name: 'Energiesparmodul', moduleKind: 'energy_reduction' as const, effectPerLevel: 0.05,
      lore: `Effizientere Antriebe für Bohrer und Förderbänder senken den Energiebedarf, ohne den Ertrag zu schmälern.`, ...shared },
    { id: `${b.id}_automatisierung`, name: 'Automatisierung', moduleKind: 'buildtime_self' as const, effectPerLevel: 0.03,
      lore: `Automatisierte Bautrupps verkürzen die Bauzeit für jede weitere Ausbaustufe.`, ...shared },
  ];
});

export function findStationBuildingModule(id: string): BuildingModuleDefinition | undefined {
  return STATION_BUILDING_MODULES.find((m) => m.id === id);
}
