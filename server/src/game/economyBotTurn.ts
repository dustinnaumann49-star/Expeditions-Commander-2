import { startBuild, startDefenseBuild, startBuildingConstruction, startResearch, startModuleUpgrade, startShipModuleUpgrade, startDefenseModuleUpgrade, energyProduced, energyConsumed, buildingCostForLevel, researchCostForLevel } from './actions.js';
import { BUILDINGS } from './data/buildings.js';
import { RESEARCH } from './data/research.js';
import { BUILDING_MODULES } from './data/buildingModules.js';
import { SHIP_MODULES } from './data/shipModules.js';
import { DEFENSE_MODULES } from './data/defenseModules.js';
import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { MAX_RESEARCH_LEVEL, MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, MAX_BUILDING_SLOTS, MAX_SHIP_MODULE_SLOTS, MAX_DEFENSE_MODULE_SLOTS } from './data/combatConstants.js';
import { setPlayerClass } from './classActions.js';
import type { PlayerState, ResourceCost } from './types.js';

// Wirtschafts-Entscheidungslogik, GETRENNT von bot.ts ausgelagert (Nutzerentscheidung Juli 2026:
// Piratenbasen wachsen jetzt "genau wie ein Spieler" - eigene Wirtschaft/Forschung/Flotten-
// /Verteidigungsbau, siehe pirateBaseState.ts) - DIESE Datei importiert bewusst
// NICHT aus bot.ts oder pirateBaseState.ts, damit beide sie gefahrlos importieren koennen, ohne
// einen Zirkelimport zu erzeugen (bot.ts -> pirateBaseState.ts existiert bereits fuer
// startPirateBaseAttack(), pirateBaseState.ts -> bot.ts haette das geschlossen).
// Jeder Baustein nutzt EXAKT dieselben Aktionsfunktionen wie ein menschlicher Spieler ueber die
// UI - keine Sonderkonditionen, keine abweichenden Kosten/Bauzeiten/Flugzeiten, KEINE kuenstlichen
// Obergrenzen (Wachstum ist nur durch dieselben wirtschaftlichen Grenzen wie bei einem Spieler
// begrenzt: Energie, Bauslots, Ressourcenertrag). Baut/schickt bewusst KEINE Mining-Schiffe zu
// Asteroiden-Sektoren (Nutzerentscheidung Juli 2026, entfernt - siehe NPC_PRODUCTION_BONUS_MULTIPLIER
// in economy.ts fuer den stattdessen erhoehten Minen-Produktions-Ausgleich).

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
const DEFENSE_IDS = [
  'raketenwerfer', 'leichteslaser', 'schwereslaser', 'gausskanone', 'ionengeschuetz', 'plasmawerfer',
  'kleineschildkuppel', 'grosseschildkuppel', 'gigantschildkuppel', 'sentinelkanone', 'ultimatekanone',
];
const MINE_IDS = ['metallmine', 'kristallmine', 'deuteriummine'];

function totalCost(cost?: { metall: number; kristall: number; deuterium: number }): number {
  if (!cost) return 0;
  return cost.metall + cost.kristall + cost.deuterium;
}

// Guenstigster-zuerst-Reihenfolge (Nutzerentscheidung, Neugestaltung "Ueberarbeitung KI-Bots &
// Piratenbasen" 04.08.2026) - dient als FALLBACK, wenn das eigentliche Bauvorhaben (siehe
// maybeBuildShips/-Defense unten) fuer JEDEN Typ zu teuer war, damit der Zug nicht leer endet.
const COMBAT_SHIP_IDS_BY_COST = [...COMBAT_SHIP_IDS].sort(
  (a, b) => totalCost(SHIPS.find((s) => s.id === a)?.cost) - totalCost(SHIPS.find((s) => s.id === b)?.cost)
);
const DEFENSE_IDS_BY_COST = [...DEFENSE_IDS].sort(
  (a, b) => totalCost(DEFENSES.find((d) => d.id === a)?.cost) - totalCost(DEFENSES.find((d) => d.id === b)?.cost)
);

// Vorausschauende Energie-Reserve (Nutzerentscheidung, Neugestaltung 04.08.2026): energyFactor()
// aus actions.ts deckelt bei 1.0 und zeigt einen Engpass daher erst, wenn er bereits eingetreten
// ist (Minen bereits gedrosselt). Diese Funktion nutzt die UNGEDECKELTE Produktions-/Verbrauchs-
// Ratio mit 15% Sicherheitsmarge, damit das Solarkraftwerk VOR dem tatsaechlichen Energiemangel
// priorisiert wird, nicht erst danach.
const ENERGY_SAFETY_MARGIN = 1.15;
function hasEnergyHeadroom(state: PlayerState): boolean {
  const consumed = energyConsumed(state);
  if (consumed <= 0) return true;
  return energyProduced(state) / consumed >= ENERGY_SAFETY_MARGIN;
}

// Ein echter Spieler MUSS vor jedem anderen Zugriff eine Klasse waehlen (siehe App.tsx-Gate) -
// Bots/Piratenbasen durchlaufen dieses UI-Gate nie, wuerden aber ohne diesen Baustein fuer immer
// bei playerClass:null bleiben und dadurch nie von Klassen-Boni profitieren. Einmalige, zufaellige
// Wahl beim ersten Zug (kein Wechsel danach - genau wie ein Spieler es i.d.R. auch nicht taeglich tut).
export function maybeChooseClass(state: PlayerState): void {
  if (state.playerClass) return;
  const options = ['kanonier', 'bollwerk', 'kommandant'];
  setPlayerClass(state, options[Math.floor(Math.random() * options.length)]);
}

function maybeBuildBuilding(state: PlayerState): void {
  if (state.buildingQueue.length > 0) return;
  // Solarkraftwerk IMMER vorausschauend priorisieren, sobald die Energiereserve knapp wird (siehe
  // hasEnergyHeadroom oben) - nicht erst reaktiv, wenn der Energiehaushalt bereits im Minus ist und
  // die Minen sich dadurch schon selbst gedrosselt haben.
  if (!hasEnergyHeadroom(state) && startBuildingConstruction(state, 'solarkraftwerk').ok) return;
  // Minen ausbalanciert ausbauen: die aktuell niedrigste Stufe zuerst.
  const sortedMines = [...MINE_IDS].sort((a, b) => (state.buildings[a] || 0) - (state.buildings[b] || 0));
  for (const id of sortedMines) {
    if (startBuildingConstruction(state, id).ok) return;
  }
  // Fruehe Roboterfabrik fuer kuerzere Bauzeiten, danach Nanitenfabrik.
  if ((state.buildings.roboterfabrik || 0) < 5 && startBuildingConstruction(state, 'roboterfabrik').ok) return;
  if (startBuildingConstruction(state, 'nanitenfabrik').ok) return;
}

function maybeStartResearch(state: PlayerState): void {
  if (state.researchQueue.length >= MAX_RESEARCH_SLOTS) return;
  for (const tech of RESEARCH) {
    if ((state.research[tech.id] || 0) >= MAX_RESEARCH_LEVEL) continue;
    if (startResearch(state, tech.id).ok) return;
  }
}


// ===== RUECKLAGE FUER AUSBAUZIELE (12.08.2026) =====
// Befund aus dem Livebetrieb: Bots UND Piratenbasen sassen dauerhaft in einer Sparfalle. Der
// Fallback "billigstes, ein Stueck" unten in maybeBuildShips/-Defense raeumte bei JEDEM Zug (alle
// zwei Minuten) das letzte Metall ab. Dadurch konnte nie genug fuer den naechsten Minen- oder
// Forschungsausbau zusammenkommen, der ein Vielfaches kostet - und weil die Minen nicht wuchsen,
// blieb auch das Metalleinkommen klein. Gemessen an den echten Konten:
//   KI-Nyx        Metall 21.933  gegen Kristall 84,5 Mio / Deuterium 93,3 Mio, Minen Stufe 9-11,
//                 Forschung Stufe 2-3, dafuer 8.614 Leichte Lasergeschuetze
//   KI-Vega       Metall  2.925  gegen Kristall 85,6 Mio / Deuterium 106,9 Mio
//   Piratenbasis  Metall 37.928  bei Kristall UND Deuterium exakt am RESOURCE_CAP,
//                 20.112 Leichte Lasergeschuetze (Startbestand war 1.120)
// Das Leichte Lasergeschuetz ist mit 40.000 Gesamtkosten die guenstigste unbegrenzt baubare
// Anlage - der Fallback landete deshalb praktisch immer dort. Kristall und Deuterium liefen
// derweil bis zum Deckel voll und die Produktion ins Leere.
//
// Loesung: vor Schiffen und Verteidigung wird zurueckgelegt, was der naechste Gebaeude- bzw.
// Forschungsschritt kostet. Ausgegeben wird nur der Ueberschuss. Das ist selbstbegrenzend - sobald
// der Ausbau bezahlt ist (maybeBuildBuilding/maybeStartResearch laufen VOR den Bauteilen), faellt
// die Ruecklage weg und der Ueberschuss fliesst wieder in Schiffe/Verteidigung.
//
// BEWUSST NICHT zurueckgelegt wird fuer Module: die laufen ueber denselben Gebaeude-Slot und
// wuerden die Ruecklage sonst dauerhaft blockieren.
function nextBuildingCost(state: PlayerState): ResourceCost | null {
  if (state.buildingQueue.length > 0) return null; // Ausbau laeuft bereits - nichts zurueckzulegen
  const candidates: string[] = [];
  if (!hasEnergyHeadroom(state)) candidates.push('solarkraftwerk');
  candidates.push(...[...MINE_IDS].sort((a, b) => (state.buildings[a] || 0) - (state.buildings[b] || 0)));
  if ((state.buildings.roboterfabrik || 0) < 5) candidates.push('roboterfabrik');
  candidates.push('nanitenfabrik');
  for (const id of candidates) {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b) continue;
    const level = (state.buildings[id] || 0) + 1;
    if (b.maxLevel && level > b.maxLevel) continue;
    return buildingCostForLevel(b, level);
  }
  return null;
}

function nextResearchCost(state: PlayerState): ResourceCost | null {
  if (state.researchQueue.length >= MAX_RESEARCH_SLOTS) return null;
  for (const tech of RESEARCH) {
    const level = state.research[tech.id] || 0;
    if (level >= MAX_RESEARCH_LEVEL) continue;
    return researchCostForLevel(tech, level + 1);
  }
  return null;
}

// Was darf fuer Schiffe/Verteidigung tatsaechlich ausgegeben werden?
function spendableResources(state: PlayerState): ResourceCost {
  const reserve = { metall: 0, kristall: 0, deuterium: 0 };
  for (const c of [nextBuildingCost(state), nextResearchCost(state)]) {
    if (!c) continue;
    reserve.metall += c.metall;
    reserve.kristall += c.kristall;
    reserve.deuterium += c.deuterium;
  }
  return {
    metall: Math.max(0, state.resources.metall - reserve.metall),
    kristall: Math.max(0, state.resources.kristall - reserve.kristall),
    deuterium: Math.max(0, state.resources.deuterium - reserve.deuterium),
  };
}

function affordableFrom(spendable: ResourceCost, cost: ResourceCost | undefined, count: number): boolean {
  if (!cost) return false;
  return (
    cost.metall * count <= spendable.metall &&
    cost.kristall * count <= spendable.kristall &&
    cost.deuterium * count <= spendable.deuterium
  );
}

function countInFleetOrQueue(state: PlayerState, shipId: string): number {
  return (state.fleet[shipId] || 0) + state.buildQueue.filter((j) => j.shipId === shipId).reduce((a, j) => a + j.count, 0);
}

function maybeBuildShips(state: PlayerState): void {
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) return;
  const spendable = spendableResources(state);
  // Kampfschiffe gemischt aufbauen statt immer denselben (guenstigsten) Typ zuerst zu versuchen -
  // der Typ mit dem aktuell geringsten Bestand (Flotte + Warteschlange) kommt zuerst dran. Das
  // ergibt von selbst eine durchmischte Flotte statt einer reinen Masse des billigsten Schiffs;
  // teurere Typen werden trotzdem seltener gebaut, weil ein Versuch bei fehlenden Ressourcen
  // einfach fehlschlaegt (ok:false) und der naechstguenstigere Typ in der sortierten Liste drankommt.
  const sortedCombatIds = [...COMBAT_SHIP_IDS].sort((a, b) => countInFleetOrQueue(state, a) - countInFleetOrQueue(state, b));
  for (const id of sortedCombatIds) {
    if (!affordableFrom(spendable, SHIPS.find((x) => x.id === id)?.cost, 5)) continue;
    if (startBuild(state, id, 5).ok) return;
  }
  // Flexibler Fallback (Nutzerentscheidung, Neugestaltung 04.08.2026): das eigentliche Bauvorhaben
  // (5 Stueck) war fuer JEDEN Typ zu teuer - statt den Zug leer enden zu lassen, auf eine kleinere,
  // bezahlbare Alternative ausweichen (guenstigster Typ zuerst, jeweils nur 1 Stueck).
  for (const id of COMBAT_SHIP_IDS_BY_COST) {
    if (!affordableFrom(spendable, SHIPS.find((x) => x.id === id)?.cost, 1)) continue;
    if (startBuild(state, id, 1).ok) return;
  }
}

function countDefenseInStockOrQueue(state: PlayerState, defId: string): number {
  return (state.defense[defId] || 0) + state.defenseQueue.filter((j) => j.defId === defId).reduce((a, j) => a + j.count, 0);
}

function maybeBuildDefense(state: PlayerState): void {
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) return;
  const spendable = spendableResources(state);
  // Gemischte Verteidigung statt nur Raketenwerfer: dieselbe "geringster Bestand zuerst"-
  // Sortierung wie bei maybeBuildShips. Schildkuppeln (maxCount:1) und Sentinel-/Ultimate-Kanone
  // (maxCount:150/60) fallen automatisch aus der Rotation, sobald ihr Limit erreicht ist -
  // startDefenseBuild() liefert dann ok:false, naechster Typ wird versucht.
  const sortedDefenseIds = [...DEFENSE_IDS].sort((a, b) => countDefenseInStockOrQueue(state, a) - countDefenseInStockOrQueue(state, b));
  for (const id of sortedDefenseIds) {
    if (!affordableFrom(spendable, DEFENSES.find((x) => x.id === id)?.cost, 10)) continue;
    if (startDefenseBuild(state, id, 10).ok) return;
  }
  // Flexibler Fallback, analog zu maybeBuildShips oben: 10 Stueck war fuer JEDEN Typ zu teuer ->
  // guenstigste Anlage zuerst, jeweils nur 1 Stueck.
  for (const id of DEFENSE_IDS_BY_COST) {
    if (!affordableFrom(spendable, DEFENSES.find((x) => x.id === id)?.cost, 1)) continue;
    if (startDefenseBuild(state, id, 1).ok) return;
  }
}

// Nutzerentscheidung Juli 2026 ("niemand verwendet die Module") - bisher gab es dafuer GAR KEINE
// KI-Logik, weder bei Bots noch bei Piratenbasen. Analog zu maybeBuildShips/-Defense: pro Aufruf
// hoechstens EIN neues Modul pro Kategorie, damit sich das ueber mehrere Ticks natuerlich auf die
// jeweiligen Slots verteilt (MAX_BUILDING_SLOTS=1, geteilt mit normalen Gebaeuden - siehe
// startModuleUpgrade() in actions.ts; MAX_SHIP_MODULE_SLOTS/MAX_DEFENSE_MODULE_SLOTS=3 eigene
// Slots). Gebaeude-Module brauchen hohe Basis-Gebaeude-Stufen (20/10/5, siehe buildingModules.ts)
// und greifen daher fruehestens im spaeten Spielverlauf - Schiffs-/Verteidigungs-Module dagegen
// sofort, sobald mindestens 1 Einheit des jeweiligen Typs vorhanden ist.
function maybeBuildModules(state: PlayerState): void {
  if (state.buildingQueue.length < MAX_BUILDING_SLOTS) {
    for (const mod of BUILDING_MODULES) {
      if ((state.buildings[mod.buildingId] || 0) < mod.requiredBuildingLevel) continue;
      if ((state.buildingModules[mod.id] || 0) >= mod.maxLevel) continue;
      if (startModuleUpgrade(state, mod.id).ok) break;
    }
  }
  if (state.shipModuleQueue.length < MAX_SHIP_MODULE_SLOTS) {
    for (const mod of SHIP_MODULES) {
      if ((state.fleet[mod.shipId] || 0) <= 0) continue;
      if ((state.shipModules[mod.id] || 0) >= mod.maxLevel) continue;
      if (startShipModuleUpgrade(state, mod.id).ok) break;
    }
  }
  if (state.defenseModuleQueue.length < MAX_DEFENSE_MODULE_SLOTS) {
    for (const mod of DEFENSE_MODULES) {
      if ((state.defense[mod.defenseId] || 0) <= 0) continue;
      if ((state.shipModules[mod.id] || 0) >= mod.maxLevel) continue;
      if (startDefenseModuleUpgrade(state, mod.id).ok) break;
    }
  }
}

/**
 * Buendelt die reine Wirtschafts-Entscheidungslogik (Gebaeude/Forschung/Schiffe/Verteidigung) -
 * genutzt sowohl von KI-Mitspielern (bot.ts, zusaetzlich zu deren Mitspieler-Interaktionen wie
 * Halten/Gruppen-Expeditionen) als auch von Piratenbasen (pirateBaseState.ts, OHNE jede
 * Mitspieler-Interaktion). Baut/schickt bewusst KEINE Mining-Schiffe zu Asteroiden-Sektoren mehr
 * (Nutzerentscheidung Juli 2026, entfernt - siehe NPC_PRODUCTION_BONUS_MULTIPLIER in economy.ts
 * fuer den stattdessen erhoehten Minen-Produktions-Ausgleich).
 */
export function runEconomyBotTurn(state: PlayerState): void {
  maybeChooseClass(state);
  maybeBuildModules(state); // vor maybeBuildBuilding: Gebaeude-Module bekommen Vorrang auf den gemeinsamen Slot, sobald sie freigeschaltet sind
  maybeBuildBuilding(state);
  maybeStartResearch(state);
  maybeBuildShips(state);
  maybeBuildDefense(state);
}
