import { startBuild, startDefenseBuild, startBuildingConstruction, startResearch, energyFactor } from './actions.js';
import { RESEARCH } from './data/research.js';
import { SEKTOR_CONFIG } from './data/sectors.js';
import { MAX_RESEARCH_LEVEL, MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS } from './data/combatConstants.js';
import { sendFleet } from './missions.js';
import { setPlayerClass } from './classActions.js';
import type { PlayerState } from './types.js';

// Wirtschafts-Entscheidungslogik, GETRENNT von bot.ts ausgelagert (Nutzerentscheidung Juli 2026:
// Piratenbasen wachsen jetzt "genau wie ein Spieler" - eigene Wirtschaft/Forschung/Flotten-
// /Verteidigungsbau/Asteroiden-Mining, siehe pirateBaseState.ts) - DIESE Datei importiert bewusst
// NICHT aus bot.ts oder pirateBaseState.ts, damit beide sie gefahrlos importieren koennen, ohne
// einen Zirkelimport zu erzeugen (bot.ts -> pirateBaseState.ts existiert bereits fuer
// startPirateBaseAttack(), pirateBaseState.ts -> bot.ts haette das geschlossen).
// Jeder Baustein nutzt EXAKT dieselben Aktionsfunktionen wie ein menschlicher Spieler ueber die
// UI - keine Sonderkonditionen, keine abweichenden Kosten/Bauzeiten/Flugzeiten, KEINE kuenstlichen
// Obergrenzen (Wachstum ist nur durch dieselben wirtschaftlichen Grenzen wie bei einem Spieler
// begrenzt: Energie, Bauslots, Ressourcenertrag).

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
const DEFENSE_IDS = [
  'raketenwerfer', 'leichteslaser', 'schwereslaser', 'gausskanone', 'ionengeschuetz', 'plasmawerfer',
  'kleineschildkuppel', 'grosseschildkuppel', 'gigantschildkuppel', 'sentinelkanone', 'ultimatekanone',
];
const MINE_IDS = ['metallmine', 'kristallmine', 'deuteriummine'];

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
  // Energie-Engpass zuerst beheben, sonst drosseln sich die Minen selbst aus.
  if (energyFactor(state) < 1 && startBuildingConstruction(state, 'solarkraftwerk').ok) return;
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

function countInFleetOrQueue(state: PlayerState, shipId: string): number {
  return (state.fleet[shipId] || 0) + state.buildQueue.filter((j) => j.shipId === shipId).reduce((a, j) => a + j.count, 0);
}

function maybeBuildShips(state: PlayerState): void {
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) return;
  const miningInFleetOrQueue = countInFleetOrQueue(state, 'mining');
  // Wirtschaft zuerst - genug Mining-Schiffe fuer eigenstaendiges Wachstum?
  if (miningInFleetOrQueue < 50 && startBuild(state, 'mining', 10).ok) return;
  // Kampfschiffe gemischt aufbauen statt immer denselben (guenstigsten) Typ zuerst zu versuchen -
  // der Typ mit dem aktuell geringsten Bestand (Flotte + Warteschlange) kommt zuerst dran. Das
  // ergibt von selbst eine durchmischte Flotte statt einer reinen Masse des billigsten Schiffs;
  // teurere Typen werden trotzdem seltener gebaut, weil ein Versuch bei fehlenden Ressourcen
  // einfach fehlschlaegt (ok:false) und der naechstguenstigere Typ in der sortierten Liste drankommt.
  const sortedCombatIds = [...COMBAT_SHIP_IDS].sort((a, b) => countInFleetOrQueue(state, a) - countInFleetOrQueue(state, b));
  for (const id of sortedCombatIds) {
    if (startBuild(state, id, 5).ok) return;
  }
}

function countDefenseInStockOrQueue(state: PlayerState, defId: string): number {
  return (state.defense[defId] || 0) + state.defenseQueue.filter((j) => j.defId === defId).reduce((a, j) => a + j.count, 0);
}

function maybeBuildDefense(state: PlayerState): void {
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) return;
  // Gemischte Verteidigung statt nur Raketenwerfer: dieselbe "geringster Bestand zuerst"-
  // Sortierung wie bei maybeBuildShips. Schildkuppeln (maxCount:1) und Sentinel-/Ultimate-Kanone
  // (maxCount:150/60) fallen automatisch aus der Rotation, sobald ihr Limit erreicht ist -
  // startDefenseBuild() liefert dann ok:false, naechster Typ wird versucht.
  const sortedDefenseIds = [...DEFENSE_IDS].sort((a, b) => countDefenseInStockOrQueue(state, a) - countDefenseInStockOrQueue(state, b));
  for (const id of sortedDefenseIds) {
    if (startDefenseBuild(state, id, 10).ok) return;
  }
}

function maybeSendMiningFleet(state: PlayerState): void {
  const asteroidIds = ['asteroid_niedrig', 'asteroid_mittel', 'asteroid_hoch'];
  if (state.missions.some((m) => asteroidIds.includes(m.sektorId) && !m.finalized)) return;
  const miningAvail = state.fleet.mining || 0;
  if (miningAvail < 10) return;
  const sektorId = miningAvail >= 200 ? 'asteroid_hoch' : miningAvail >= 80 ? 'asteroid_mittel' : 'asteroid_niedrig';
  const cfg = SEKTOR_CONFIG[sektorId];
  const qty = cfg?.miningCap ? Math.min(miningAvail, cfg.miningCap) : miningAvail;
  sendFleet(state, sektorId, { mining: qty });
}

/**
 * Buendelt die reine Wirtschafts-Entscheidungslogik (Gebaeude/Forschung/Schiffe/Verteidigung/
 * Asteroiden-Mining) - genutzt sowohl von KI-Mitspielern (bot.ts, zusaetzlich zu deren
 * Mitspieler-Interaktionen wie Halten/Gruppen-Expeditionen) als auch von Piratenbasen
 * (pirateBaseState.ts, OHNE jede Mitspieler-Interaktion).
 */
export function runEconomyBotTurn(state: PlayerState): void {
  maybeChooseClass(state);
  maybeBuildBuilding(state);
  maybeStartResearch(state);
  maybeBuildShips(state);
  maybeBuildDefense(state);
  maybeSendMiningFleet(state);
}
