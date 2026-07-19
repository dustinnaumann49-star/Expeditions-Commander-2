import type { BuildingModuleDefinition } from '../types.js';

// Gebaeude-Modulsystem (siehe README "Wichtige Punkte" - analog zum Forschungsbaum, aber pro
// Gebaeude statt eines gemeinsamen Baums). Jedes Modul verbessert GENAU EINEN Aspekt seines
// Basis-Gebaeudes zusaetzlich, stapelt sich mit der allgemeinen Forschung (Mining-Boost/Bauzeit-
// Zweige aus research.ts), ersetzt sie nicht. Nutzt dasselbe Bild wie sein Basis-Gebaeude (kein
// eigenes Bild noetig) - der Client ermittelt das Bild ueber `buildingId`.
//
// Freischalt-Schwelle ist bewusst NICHT einheitlich (anders als beim Forschungsbaum, dort immer
// Stufe 3), sondern pro Gebaeudetyp verschieden, da die Gebaeude unterschiedlich schnell/teuer
// wachsen: Minen/Solarkraftwerk Stufe 20, Roboterfabrik Stufe 10, Nanitenfabrik Stufe 5.
// Kosten/Bauzeit bewusst hoch angesetzt (spaetes Ausbauziel, kein fruehes Upgrade).
export const BUILDING_MODULES: BuildingModuleDefinition[] = [
  // ===== Metallmine (Voraussetzung: Stufe 20) =====
  { id: 'metallmine_foerdereffizienz', name: 'Fördereffizienz', buildingId: 'metallmine', moduleKind: 'output', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Praezisere Bohrkoepfe und optimierte Foerderbaender steigern den Ertrag der Metallmine zusaetzlich zur normalen Stufen-Skalierung.',
    baseCost: { metall: 2000000, kristall: 1000000, deuterium: 500000 }, costGrowth: 1.6, baseTimeSeconds: 7200, timeGrowth: 1.4 },
  { id: 'metallmine_energiesparmodul', name: 'Energiesparmodul', buildingId: 'metallmine', moduleKind: 'energy_reduction', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Effizientere Antriebe fuer Bohrer und Foerderbaender senken den Energiebedarf der Metallmine, ohne den Ertrag zu schmaelern.',
    baseCost: { metall: 1800000, kristall: 1100000, deuterium: 500000 }, costGrowth: 1.6, baseTimeSeconds: 7200, timeGrowth: 1.4 },
  { id: 'metallmine_automatisierung', name: 'Automatisierung', buildingId: 'metallmine', moduleKind: 'buildtime_self', requiredBuildingLevel: 20, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Automatisierte Bautrupps verkuerzen die Bauzeit fuer jede weitere Ausbaustufe der Metallmine.',
    baseCost: { metall: 2200000, kristall: 1200000, deuterium: 600000 }, costGrowth: 1.6, baseTimeSeconds: 7200, timeGrowth: 1.4 },

  // ===== Kristallmine (Voraussetzung: Stufe 20) =====
  { id: 'kristallmine_foerdereffizienz', name: 'Fördereffizienz', buildingId: 'kristallmine', moduleKind: 'output', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Feinere Bohrkoepfe erschliessen zusaetzliche Kristalladern, die der Basis-Ausbau allein nicht erreicht.',
    baseCost: { metall: 2500000, kristall: 1500000, deuterium: 600000 }, costGrowth: 1.6, baseTimeSeconds: 7500, timeGrowth: 1.4 },
  { id: 'kristallmine_energiesparmodul', name: 'Energiesparmodul', buildingId: 'kristallmine', moduleKind: 'energy_reduction', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Optimierte Kuehlsysteme senken den Energiebedarf der druckintensiven Kristallfoerderung.',
    baseCost: { metall: 2300000, kristall: 1600000, deuterium: 600000 }, costGrowth: 1.6, baseTimeSeconds: 7500, timeGrowth: 1.4 },
  { id: 'kristallmine_automatisierung', name: 'Automatisierung', buildingId: 'kristallmine', moduleKind: 'buildtime_self', requiredBuildingLevel: 20, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Automatisierte Bautrupps verkuerzen die Bauzeit fuer jede weitere Ausbaustufe der Kristallmine.',
    baseCost: { metall: 2700000, kristall: 1700000, deuterium: 700000 }, costGrowth: 1.6, baseTimeSeconds: 7500, timeGrowth: 1.4 },

  // ===== Deuterium-Synthetisierer (Voraussetzung: Stufe 20) =====
  { id: 'deuteriummine_foerdereffizienz', name: 'Fördereffizienz', buildingId: 'deuteriummine', moduleKind: 'output', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Verbesserte Filteranlagen gewinnen mehr schweren Wasserstoff aus denselben Eisvorkommen.',
    baseCost: { metall: 3000000, kristall: 2000000, deuterium: 800000 }, costGrowth: 1.6, baseTimeSeconds: 7800, timeGrowth: 1.4 },
  { id: 'deuteriummine_energiesparmodul', name: 'Energiesparmodul', buildingId: 'deuteriummine', moduleKind: 'energy_reduction', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Waermerueckgewinnung aus dem Synthetisierungsprozess senkt den Netto-Energiebedarf spuerbar.',
    baseCost: { metall: 2800000, kristall: 2100000, deuterium: 800000 }, costGrowth: 1.6, baseTimeSeconds: 7800, timeGrowth: 1.4 },
  { id: 'deuteriummine_automatisierung', name: 'Automatisierung', buildingId: 'deuteriummine', moduleKind: 'buildtime_self', requiredBuildingLevel: 20, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Automatisierte Bautrupps verkuerzen die Bauzeit fuer jede weitere Ausbaustufe des Synthetisierers.',
    baseCost: { metall: 3200000, kristall: 2200000, deuterium: 900000 }, costGrowth: 1.6, baseTimeSeconds: 7800, timeGrowth: 1.4 },

  // ===== Solarkraftwerk (Voraussetzung: Stufe 20) =====
  { id: 'solarkraftwerk_ertragssteigerung', name: 'Ertragssteigerung', buildingId: 'solarkraftwerk', moduleKind: 'output', requiredBuildingLevel: 20, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Nachgeschaerfte Kollektoren und verbesserte Wechselrichter steigern den Energieertrag zusaetzlich zur normalen Stufen-Skalierung.',
    baseCost: { metall: 2500000, kristall: 1300000, deuterium: 400000 }, costGrowth: 1.6, baseTimeSeconds: 7200, timeGrowth: 1.4 },
  { id: 'solarkraftwerk_wartungsoptimierung', name: 'Wartungsoptimierung', buildingId: 'solarkraftwerk', moduleKind: 'buildtime_self', requiredBuildingLevel: 20, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Vorgefertigte Kollektor-Module verkuerzen die Bauzeit fuer jede weitere Ausbaustufe des Solarkraftwerks.',
    baseCost: { metall: 2700000, kristall: 1400000, deuterium: 450000 }, costGrowth: 1.6, baseTimeSeconds: 7200, timeGrowth: 1.4 },

  // ===== Roboterfabrik (Voraussetzung: Stufe 10) =====
  { id: 'roboterfabrik_verstaerkte_automatisierung', name: 'Verstärkte Automatisierung', buildingId: 'roboterfabrik', moduleKind: 'strengthen_factor', requiredBuildingLevel: 10, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Selbstlernende Steuerungssysteme machen jede vorhandene Roboterfabrik-Stufe noch effizienter, ohne dass ein weiterer Ausbau der Fabrik selbst noetig waere.',
    baseCost: { metall: 6000000, kristall: 3500000, deuterium: 1200000 }, costGrowth: 1.65, baseTimeSeconds: 10800, timeGrowth: 1.4 },
  { id: 'roboterfabrik_wartungsfreiheit', name: 'Wartungsfreiheit', buildingId: 'roboterfabrik', moduleKind: 'buildtime_self', requiredBuildingLevel: 10, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Selbstwartende Systeme verkuerzen die Bauzeit fuer jede weitere Ausbaustufe der Roboterfabrik selbst.',
    baseCost: { metall: 6500000, kristall: 3800000, deuterium: 1300000 }, costGrowth: 1.65, baseTimeSeconds: 10800, timeGrowth: 1.4 },

  // ===== Nanitenfabrik (Voraussetzung: Stufe 5) =====
  { id: 'nanitenfabrik_verstaerkte_automatisierung', name: 'Verstärkte Automatisierung', buildingId: 'nanitenfabrik', moduleKind: 'strengthen_factor', requiredBuildingLevel: 5, effectPerLevel: 0.05, maxLevel: 10,
    lore: 'Optimierte Schwarm-Algorithmen machen jede vorhandene Nanitenfabrik-Stufe noch effizienter, ohne dass ein weiterer Ausbau der Fabrik selbst noetig waere.',
    baseCost: { metall: 15000000, kristall: 9000000, deuterium: 4000000 }, costGrowth: 1.7, baseTimeSeconds: 21600, timeGrowth: 1.4 },
  { id: 'nanitenfabrik_wartungsfreiheit', name: 'Wartungsfreiheit', buildingId: 'nanitenfabrik', moduleKind: 'buildtime_self', requiredBuildingLevel: 5, effectPerLevel: 0.03, maxLevel: 10,
    lore: 'Selbstreplizierende Wartungs-Naniten verkuerzen die Bauzeit fuer jede weitere Ausbaustufe der Nanitenfabrik selbst.',
    baseCost: { metall: 16000000, kristall: 9500000, deuterium: 4200000 }, costGrowth: 1.7, baseTimeSeconds: 21600, timeGrowth: 1.4 },
];

export function findBuildingModule(id: string): BuildingModuleDefinition | undefined {
  return BUILDING_MODULES.find((m) => m.id === id);
}
