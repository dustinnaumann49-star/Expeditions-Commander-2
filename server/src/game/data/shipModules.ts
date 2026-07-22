import { SHIPS } from './ships.js';
import type { ShipModuleDefinition, ShipModuleKind, ResourceCost } from '../types.js';

// Bilder werden von der jeweils passenden Forschung wiederverwendet (siehe Nutzerentscheidung) -
// kein eigenes Bild noetig, Antrieb je nach tatsaechlichem driveType des Schiffs.
const KIND_IMG: Record<'waffen' | 'schild' | 'panzerung', string> = {
  waffen: 'research/waffentechnik.png',
  schild: 'research/schildtechnik.png',
  panzerung: 'research/panzerungtechnik.png',
};
const DRIVE_IMG: Record<string, string> = {
  rakete: 'research/raketenantrieb.png',
  impuls: 'research/impulsantrieb.png',
  hyperraum: 'research/hyperraumantrieb.png',
};
const KIND_LABEL: Record<ShipModuleKind, string> = { waffen: 'Waffen-Modul', schild: 'Schild-Modul', panzerung: 'Panzerung-Modul', antrieb: 'Antriebs-Modul' };

export const SHIP_MODULE_MAX_LEVEL = 10;
export const SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL = 0.03; // Waffen/Schild/Panzerung: +3%/Stufe, max +30%
export const SHIP_MODULE_DRIVE_EFFECT_PER_LEVEL = 0.02; // Antrieb: +2%/Stufe, max +20% (gleiche Groessenordnung wie Antriebsklassen-Forschung)

// Basis-Kosten/-Bauzeit eines Moduls (Stufe 1) leiten sich von den STUECKKOSTEN/der Basis-Bauzeit
// des jeweiligen Schiffs ab (je teurer/aufwendiger das Schiff, desto teurer sein Modul) - ein
// Schiffs-Modul ist eine einmalige, ship-TYP-weite Investition (wirkt auf ALLE besessenen
// Einheiten dieses Typs), keine Stueckzahl-Produktion wie der normale Schiffbau.
// Werte gesenkt (Nutzerentscheidung: die vorherigen 25x/300x-Multiplikatoren mit 1.55/1.4er
// Stufen-Wachstum liessen Module bei teuren Schiffen ins Unmachbare explodieren - je groesser
// das Schiff, desto extremer der Sprung. Kleine Schiffe blieben ueberschaubar, grosse nicht.)
const MODULE_COST_MULTIPLIER = 8;
const MODULE_TIME_MULTIPLIER = 80;
const MODULE_COST_GROWTH = 1.35;
const MODULE_TIME_GROWTH = 1.25;

// Imperator hat keine `cost` (nur teileCost, specialOnly) - eigene Modul-Basiskosten statt einer
// Ableitung. Weiterhin bewusst die teuerste Modul-Investition im Spiel (mythischer Status),
// aber von vorher 500M/400M/250M bei 7 Tagen Basis-Bauzeit auf ein erreichbares Mass gesenkt.
const IMPERATOR_MODULE_BASE_COST: ResourceCost = { metall: 50000000, kristall: 40000000, deuterium: 25000000 };
const IMPERATOR_MODULE_BASE_TIME_SECONDS = 2 * 86400;

function buildModule(shipId: string, name: string, kind: ShipModuleKind, img: string, lore: string, baseCost: ResourceCost, baseTimeSeconds: number): ShipModuleDefinition {
  return {
    id: `${shipId}_${kind}`,
    name,
    shipId,
    moduleKind: kind,
    img,
    lore,
    effectPerLevel: kind === 'antrieb' ? SHIP_MODULE_DRIVE_EFFECT_PER_LEVEL : SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL,
    maxLevel: SHIP_MODULE_MAX_LEVEL,
    baseCost,
    costGrowth: MODULE_COST_GROWTH,
    baseTimeSeconds,
    timeGrowth: MODULE_TIME_GROWTH,
  };
}

function generateShipModules(shipId: string): ShipModuleDefinition[] {
  const ship = SHIPS.find((s) => s.id === shipId);
  if (!ship) return [];
  const isImperator = shipId === 'imperator';
  const baseCost: ResourceCost = isImperator
    ? IMPERATOR_MODULE_BASE_COST
    : {
        metall: (ship.cost?.metall || 0) * MODULE_COST_MULTIPLIER,
        kristall: (ship.cost?.kristall || 0) * MODULE_COST_MULTIPLIER,
        deuterium: (ship.cost?.deuterium || 0) * MODULE_COST_MULTIPLIER,
      };
  const baseTimeSeconds = isImperator ? IMPERATOR_MODULE_BASE_TIME_SECONDS : ship.buildTime * MODULE_TIME_MULTIPLIER;
  const driveImg = DRIVE_IMG[ship.driveType || 'rakete'];

  return [
    buildModule(
      shipId, `${ship.name}: ${KIND_LABEL.waffen}`, 'waffen', KIND_IMG.waffen,
      `Verbesserte Zielrechner und Feuerleitsysteme steigern den Waffenschaden aller besessenen ${ship.name}-Einheiten zusaetzlich zur allgemeinen Waffentechnik-Forschung.`,
      baseCost, baseTimeSeconds
    ),
    buildModule(
      shipId, `${ship.name}: ${KIND_LABEL.schild}`, 'schild', KIND_IMG.schild,
      `Verstaerkte Energiefeld-Generatoren erhoehen die Schildkapazitaet aller besessenen ${ship.name}-Einheiten zusaetzlich zur allgemeinen Schildtechnik-Forschung.`,
      baseCost, baseTimeSeconds
    ),
    buildModule(
      shipId, `${ship.name}: ${KIND_LABEL.panzerung}`, 'panzerung', KIND_IMG.panzerung,
      `Neu legierte Rumpfplatten erhoehen die Panzerung aller besessenen ${ship.name}-Einheiten zusaetzlich zur allgemeinen Panzerungtechnik-Forschung.`,
      baseCost, baseTimeSeconds
    ),
    buildModule(
      shipId, `${ship.name}: ${KIND_LABEL.antrieb}`, 'antrieb', driveImg,
      `Feinabstimmung am ${ship.driveType === 'rakete' ? 'Raketenantrieb' : ship.driveType === 'impuls' ? 'Impulsantrieb' : 'Hyperraumantrieb'} erhoeht die Geschwindigkeit aller besessenen ${ship.name}-Einheiten zusaetzlich zur allgemeinen Antriebstechnik-Forschung.`,
      baseCost, baseTimeSeconds
    ),
  ];
}

// Module gibt es NUR fuer die 12 COMBAT_SHIP_IDS-Kampfschiffe plus den Imperator (siehe
// Nutzerentscheidung) - Mining-Schiff und Begleitschiff sind reine Hilfsschiffe ohne
// nennenswerte Kampfrolle und bleiben ohne Module.
const MODULE_SHIP_IDS = [
  'leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber',
  'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator',
  'salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'imperator',
];

export const SHIP_MODULES: ShipModuleDefinition[] = MODULE_SHIP_IDS.flatMap(generateShipModules);

export function findShipModule(id: string): ShipModuleDefinition | undefined {
  return SHIP_MODULES.find((m) => m.id === id);
}
