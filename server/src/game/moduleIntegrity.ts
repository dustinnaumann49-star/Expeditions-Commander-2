import { BUILDINGS } from './data/buildings.js';
import { findBuildingModule } from './data/buildingModules.js';
import { STATION_BUILDINGS } from './data/stationBuildings.js';
import { findStationBuildingModule } from './data/stationBuildingModules.js';

// ===== R12: Startpruefung fuer zusammengesetzte Modul-IDs =====
//
// Hintergrund (Umsetzungsplan, Messregel 15 - "Stille Ausweichwerte sind keine Fehlerbehandlung"):
// moduleBoostFactor()/moduleReductionFactor() liefern bei einer unbekannten Modul-ID einfach 1
// zurueck. Das ist im Sinne des Codes korrekt und im Sinne des Spiels falsch - genau so sind die
// V2/V3-Module der Heimatbasis monatelang unbemerkt ausgefallen: die IDs werden zur Laufzeit als
// `${building.id}_foerdereffizienz` usw. zusammengesetzt, existierten aber nur fuer V1. Kein
// Fehler, keine Meldung, nur ein stillschweigend fehlender Effekt.
//
// Diese Pruefung bildet dieselben IDs beim Serverstart und meldet jede, zu der keine Definition
// existiert. Sie bricht den Start NICHT ab (ein fehlendes Modul ist kein Grund, das Spiel nicht
// laufen zu lassen), macht die Fehlerklasse aber dauerhaft sichtbar.
//
// WICHTIG bei kuenftigen Erweiterungen: Wer eine neue Stelle baut, die eine Modul-ID zur Laufzeit
// zusammensetzt, traegt das Suffix hier mit ein. Sonst prueft diese Funktion an der neuen Stelle
// vorbei und die naechste stille Luecke faellt wieder erst nach Monaten auf.

// Suffixe je Gebaeude-Art, exakt so wie sie in actions.ts bzw. stations.ts gebildet werden.
const EXPECTED_SUFFIXES_BY_KIND: Record<string, string[]> = {
  mine_metall: ['foerdereffizienz', 'energiesparmodul', 'automatisierung'],
  mine_kristall: ['foerdereffizienz', 'energiesparmodul', 'automatisierung'],
  mine_deuterium: ['foerdereffizienz', 'energiesparmodul', 'automatisierung'],
  energie: ['ertragssteigerung', 'wartungsoptimierung'],
  roboter: ['verstaerkte_automatisierung', 'wartungsfreiheit'],
  nanit: ['verstaerkte_automatisierung', 'wartungsfreiheit'],
};

function collectMissing(
  buildings: { id: string; kind: string }[],
  lookup: (id: string) => unknown,
): string[] {
  const missing: string[] = [];
  buildings.forEach((building) => {
    const suffixes = EXPECTED_SUFFIXES_BY_KIND[building.kind] || [];
    suffixes.forEach((suffix) => {
      const moduleId = `${building.id}_${suffix}`;
      if (!lookup(moduleId)) missing.push(moduleId);
    });
  });
  return missing;
}

export function checkModuleIntegrity(): { ok: boolean; missing: string[] } {
  const missing = [
    ...collectMissing(BUILDINGS, findBuildingModule),
    ...collectMissing(STATION_BUILDINGS, findStationBuildingModule),
  ];

  if (missing.length > 0) {
    console.error(
      `[Modul-Pruefung] ${missing.length} zur Laufzeit gebildete Modul-ID(s) haben KEINE Definition. ` +
        `Diese Module wirken still nicht (siehe moduleIntegrity.ts):`,
    );
    missing.forEach((id) => console.error(`  - ${id}`));
  } else {
    console.log(`[Modul-Pruefung] OK - alle zusammengesetzten Modul-IDs sind definiert.`);
  }

  return { ok: missing.length === 0, missing };
}
