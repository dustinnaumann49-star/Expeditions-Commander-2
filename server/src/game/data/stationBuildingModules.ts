import { STATION_BUILDINGS } from './stationBuildings.js';
import type { BuildingModuleDefinition } from '../types.js';

// Allianz-Station-Module: gleiche Modul-Kinds wie bei der Heimatbasis (siehe data/
// buildingModules.ts), 1:1 fuer alle 3 Stufen generiert statt von Hand getippt (gleiches Prinzip
// wie shipModules.ts' buildModule()-Generator):
// - Minen (3): Foerdereffizienz/Energiesparmodul/Automatisierung, ab Gebaeude-Level 20.
// - Solarkraftwerk (2): Ertragssteigerung/Wartungsoptimierung, ab Gebaeude-Level 20.
// - Roboterfabrik/Nanitenfabrik (2): Verstaerkte Automatisierung/Wartungsfreiheit, ab Level
//   10 (Roboter) bzw. 5 (Nanit) - dieselben Schwellen wie bei der Heimatbasis, nur innerhalb des
//   hiesigen 30er-Caps.
// Kosten leiten sich vom jeweiligen Stations-Gebaeude ab (MODULE_COST_MULTIPLIER), maxLevel 10
// wie ueberall sonst im Spiel.
const MODULE_COST_MULTIPLIER = 500;
const MODULE_TIME_MULTIPLIER = 4;
const MODULE_COST_GROWTH = 1.6;
const MODULE_TIME_GROWTH = 1.4;
const MODULE_MAX_LEVEL = 10;

function scaledCost(base: { metall: number; kristall: number; deuterium: number }, factor: number) {
  return { metall: Math.round(base.metall * factor), kristall: Math.round(base.kristall * factor), deuterium: Math.round(base.deuterium * factor) };
}

export const STATION_BUILDING_MODULES: BuildingModuleDefinition[] = STATION_BUILDINGS.flatMap((b): BuildingModuleDefinition[] => {
  const baseCost = scaledCost(b.baseCost, MODULE_COST_MULTIPLIER);
  const baseTimeSeconds = b.baseTimeSeconds * MODULE_TIME_MULTIPLIER;
  const requiredBuildingLevel = b.kind === 'roboter' ? 10 : b.kind === 'nanit' ? 5 : 20;
  const shared = { buildingId: b.id, requiredBuildingLevel, maxLevel: MODULE_MAX_LEVEL, baseCost, costGrowth: MODULE_COST_GROWTH, baseTimeSeconds, timeGrowth: MODULE_TIME_GROWTH };

  if (b.kind === 'energie') {
    return [
      { id: `${b.id}_ertragssteigerung`, name: 'Ertragssteigerung', moduleKind: 'output' as const, effectPerLevel: 0.05,
        lore: `Zusätzliche Kollektor-Kaskaden steigern den Energieertrag des Solarkraftwerks über die normale Stufen-Skalierung hinaus.`, ...shared },
      { id: `${b.id}_wartungsoptimierung`, name: 'Wartungsoptimierung', moduleKind: 'buildtime_self' as const, effectPerLevel: 0.03,
        lore: `Eingespielte Wartungstrupps verkürzen die Bauzeit für jede weitere Ausbaustufe des Solarkraftwerks.`, ...shared },
    ];
  }
  if (b.kind === 'roboter' || b.kind === 'nanit') {
    return [
      { id: `${b.id}_verstaerkte_automatisierung`, name: 'Verstärkte Automatisierung', moduleKind: 'strengthen_factor' as const, effectPerLevel: 0.05,
        lore: `Verstärkt den bestehenden Bauzeit-Bonus der Fabrik zusätzlich, ohne dass die Fabrik selbst weiter ausgebaut werden muss.`, ...shared },
      { id: `${b.id}_wartungsfreiheit`, name: 'Wartungsfreiheit', moduleKind: 'buildtime_self' as const, effectPerLevel: 0.03,
        lore: `Selbstwartende Systeme verkürzen die Bauzeit für jede weitere Ausbaustufe der Fabrik selbst.`, ...shared },
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
