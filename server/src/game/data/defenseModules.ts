import { DEFENSES } from './defenses.js';
import type { DefenseModuleDefinition, DefenseModuleKind, ResourceCost } from '../types.js';
import { SHIP_MODULE_MAX_LEVEL, SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL } from './shipModules.js';

// Analog zu shipModules.ts, aber pro VERTEIDIGUNGSANLAGE und OHNE Antrieb (Verteidigung bewegt
// sich nicht). Nutzt bewusst dieselben Stufenlimit-/Effekt-Konstanten wie Schiffs-Module
// (SHIP_MODULE_MAX_LEVEL=10, SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL=3%/Stufe) - ein Waffen-Modul
// soll sich fuer Schiffe UND Verteidigung gleich anfuehlen, kein zweites Zahlensystem noetig.
const KIND_IMG: Record<DefenseModuleKind, string> = {
  waffen: 'research/waffentechnik.png',
  schild: 'research/schildtechnik.png',
  panzerung: 'research/panzerungtechnik.png',
};
const KIND_LABEL: Record<DefenseModuleKind, string> = { waffen: 'Waffen-Modul', schild: 'Schild-Modul', panzerung: 'Panzerung-Modul' };

// Basis-Kosten/-Bauzeit eines Moduls (Stufe 1) leiten sich von den Stueckkosten/der Basis-Bauzeit
// der jeweiligen Verteidigungsanlage ab - exakt dasselbe Muster wie bei Schiffs-Modulen.
const MODULE_COST_MULTIPLIER = 25;
const MODULE_TIME_MULTIPLIER = 300;
const MODULE_COST_GROWTH = 1.55;
const MODULE_TIME_GROWTH = 1.4;

function buildModule(defenseId: string, name: string, kind: DefenseModuleKind, lore: string, baseCost: ResourceCost, baseTimeSeconds: number): DefenseModuleDefinition {
  return {
    id: `${defenseId}_${kind}`,
    name,
    defenseId,
    moduleKind: kind,
    img: KIND_IMG[kind],
    lore,
    effectPerLevel: SHIP_MODULE_COMBAT_EFFECT_PER_LEVEL,
    maxLevel: SHIP_MODULE_MAX_LEVEL,
    baseCost,
    costGrowth: MODULE_COST_GROWTH,
    baseTimeSeconds,
    timeGrowth: MODULE_TIME_GROWTH,
  };
}

function generateDefenseModules(defenseId: string): DefenseModuleDefinition[] {
  const def = DEFENSES.find((d) => d.id === defenseId);
  if (!def) return [];
  const baseCost: ResourceCost = {
    metall: def.cost.metall * MODULE_COST_MULTIPLIER,
    kristall: def.cost.kristall * MODULE_COST_MULTIPLIER,
    deuterium: def.cost.deuterium * MODULE_COST_MULTIPLIER,
  };
  const baseTimeSeconds = def.buildTime * MODULE_TIME_MULTIPLIER;

  const modules: DefenseModuleDefinition[] = [];
  // Kuppeln (isDome, waffen:0) bekommen bewusst KEIN Waffen-Modul - ein Prozent-Bonus auf 0
  // Waffenschaden waere wirkungslos (gleiche Logik wie der Ausschluss von Mining-Schiff/
  // Begleitschiff bei Schiffs-Modulen).
  if (!def.isDome) {
    modules.push(
      buildModule(
        defenseId, `${def.name}: ${KIND_LABEL.waffen}`, 'waffen',
        `Verbesserte Zielrechner und Feuerleitsysteme steigern den Waffenschaden aller besessenen ${def.name}-Anlagen zusaetzlich zur allgemeinen Waffentechnik-Forschung.`,
        baseCost, baseTimeSeconds
      )
    );
  }
  modules.push(
    buildModule(
      defenseId, `${def.name}: ${KIND_LABEL.schild}`, 'schild',
      def.isDome
        ? `Verstaerkte Energiefeld-Generatoren erhoehen den Beitrag der ${def.name} zum gemeinsamen Kuppel-Schild-Pool zusaetzlich zur allgemeinen Schildtechnik-Forschung.`
        : `Verstaerkte Energiefeld-Generatoren erhoehen die Schildkapazitaet aller besessenen ${def.name}-Anlagen zusaetzlich zur allgemeinen Schildtechnik-Forschung.`,
      baseCost, baseTimeSeconds
    )
  );
  modules.push(
    buildModule(
      defenseId, `${def.name}: ${KIND_LABEL.panzerung}`, 'panzerung',
      `Neu legierte Panzerplatten erhoehen die Panzerung aller besessenen ${def.name}-Anlagen zusaetzlich zur allgemeinen Panzerungtechnik-Forschung.`,
      baseCost, baseTimeSeconds
    )
  );
  return modules;
}

// Module gibt es fuer ALLE Verteidigungsanlagen (anders als bei Schiffen, wo Mining-Schiff/
// Begleitschiff ausgenommen sind - bei Verteidigung gibt es keine reinen "Hilfsanlagen").
const MODULE_DEFENSE_IDS = DEFENSES.map((d) => d.id);

export const DEFENSE_MODULES: DefenseModuleDefinition[] = MODULE_DEFENSE_IDS.flatMap(generateDefenseModules);

export function findDefenseModule(id: string): DefenseModuleDefinition | undefined {
  return DEFENSE_MODULES.find((m) => m.id === id);
}
