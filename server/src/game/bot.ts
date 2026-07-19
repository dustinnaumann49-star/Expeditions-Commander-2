import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername, listBotUserIds } from '../db.js';
import { startBuild, startDefenseBuild, startBuildingConstruction, startResearch, energyFactor } from './actions.js';
import { RESEARCH } from './data/research.js';
import { SEKTOR_CONFIG } from './data/sectors.js';
import { MAX_RESEARCH_LEVEL, MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS } from './data/combatConstants.js';
import { sendFleet } from './missions.js';
import { listMyGroupOperations, respondToGroupOperation, startGroupOperation, createGroupOperation } from './groupOps.js';
import { startHoldDeployment } from './galaxy.js';
import type { PlayerState } from './types.js';

// Namen der KI-Mitspieler - bei Bedarf hier anpassen/erweitern, bevor der Server das erste Mal
// mit dieser Version startet (siehe ensureBotUsers() unten, wird einmalig beim Serverstart
// geprueft und angelegt, falls noch nicht vorhanden).
const BOT_USERNAMES = ['KI-Vega', 'KI-Nyx'];

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
const MINE_IDS = ['metallmine', 'kristallmine', 'deuteriummine'];

/**
 * Legt die KI-Spieler-Accounts einmalig an, falls sie noch nicht existieren (Name-basiert, siehe
 * BOT_USERNAMES). Passwort ist irrelevant - Bots loggen sich nie ueber die UI ein, ihr PlayerState
 * wird ausschliesslich ueber runBotTurn() im Heartbeat gesteuert. Wird bei jedem Serverstart
 * aufgerufen (index.ts), aber nur einmal wirksam (idempotent - getUserByUsername prueft vorher).
 */
export async function ensureBotUsers(): Promise<void> {
  for (const name of BOT_USERNAMES) {
    if (getUserByUsername(name)) continue;
    const randomPassword = Math.random().toString(36).slice(2) + Date.now();
    const hash = await bcrypt.hash(randomPassword, 10);
    createUser(name, hash, true);
    console.log(`KI-Spieler "${name}" angelegt.`);
  }
}

// ========== EINZELNE ENTSCHEIDUNGS-BAUSTEINE ==========
// Jeder Baustein nutzt EXAKT dieselben Aktionsfunktionen wie ein menschlicher Spieler ueber die
// UI - keine Sonderkonditionen, keine abweichenden Kosten/Bauzeiten/Flugzeiten. Ein Aufruf
// schlaegt einfach fehl (ok:false), wenn nicht genug Ressourcen da sind oder ein Slot belegt ist -
// das genuegt als Vorpruefung, eigene Kostenformeln muessen hier nicht dupliziert werden.

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

function maybeBuildShips(state: PlayerState): void {
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) return;
  const miningInFleetOrQueue = (state.fleet.mining || 0) + state.buildQueue.filter((j) => j.shipId === 'mining').reduce((a, j) => a + j.count, 0);
  // Wirtschaft zuerst - genug Mining-Schiffe fuer eigenstaendiges Wachstum?
  if (miningInFleetOrQueue < 50 && startBuild(state, 'mining', 10).ok) return;
  // Danach etwas Kampfkraft, vom guenstigsten Typ aufwaerts.
  for (const id of COMBAT_SHIP_IDS) {
    if (startBuild(state, id, 5).ok) return;
  }
}

function maybeBuildDefense(state: PlayerState): void {
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) return;
  startDefenseBuild(state, 'raketenwerfer', 10);
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

// Elite-Bollwerk: offene Einladungen annehmen, eigene Operation starten sobald alle da sind, und
// gelegentlich selbst eine Expedition eroeffnen und die menschlichen Spieler einladen.
async function maybeHandleGroupOps(state: PlayerState, humanUserIds: number[]): Promise<void> {
  const ops = listMyGroupOperations(state.userId);

  for (const op of ops) {
    if (op.status !== 'inviting') continue;
    const me = op.participants.find((p) => p.userId === state.userId);
    if (me && me.status === 'pending') {
      const selection: Record<string, number> = {};
      let total = 0;
      for (const id of COMBAT_SHIP_IDS) {
        const take = Math.floor((state.fleet[id] || 0) * 0.3);
        if (take > 0) {
          selection[id] = take;
          total += take;
        }
      }
      if (total > 0) respondToGroupOperation(state, op.id, true, selection);
    }
    if (op.creatorId === state.userId) {
      await startGroupOperation(state, op.id); // scheitert bewusst still, falls noch nicht alle da
    }
  }

  const hasOwnOpenOp = ops.some((op) => op.creatorId === state.userId && (op.status === 'inviting' || op.status === 'departed'));
  if (!hasOwnOpenOp && humanUserIds.length > 0 && Math.random() < 0.05) {
    const selection: Record<string, number> = {};
    let total = 0;
    for (const id of ['kreuzer', 'schlachtschiff', 'schlachtkreuzer']) {
      const avail = state.fleet[id] || 0;
      if (avail > 10) {
        const take = Math.floor(avail * 0.2);
        selection[id] = take;
        total += take;
      }
    }
    if (total > 0) createGroupOperation(state, 'expedition', 'piraten_elite', selection, humanUserIds);
  }
}

// Menschlichen Mitspielern gelegentlich eine Teilflotte zum "Halten" schicken, damit sie bei
// Piratenraids automatisch mitverteidigt wird (siehe galaxy.ts/raids.ts) - nicht bei JEDEM
// Heartbeat (sonst wuerde staendig neu versucht), sondern mit kleiner Zufallschance, und nur
// falls dort nicht schon eine eigene Flotte haelt/unterwegs ist.
function maybeHoldAtHumans(state: PlayerState, humanUserIds: number[]): void {
  for (const targetUserId of humanUserIds) {
    const alreadyThere = state.galaxyDeployments.some((d) => d.targetUserId === targetUserId && !d.recalled);
    if (alreadyThere) continue;
    if (Math.random() > 0.1) continue;

    const selection: Record<string, number> = {};
    let total = 0;
    for (const id of ['leicht', 'schwer', 'kreuzer']) {
      const take = Math.floor((state.fleet[id] || 0) * 0.15);
      if (take > 0) {
        selection[id] = take;
        total += take;
      }
    }
    if (total >= 5) startHoldDeployment(state, targetUserId, selection);
  }
}

/**
 * Ein "Zug" eines KI-Spielers - wird im globalen Heartbeat (heartbeat.ts) fuer jeden
 * Bot-Account nach der normalen Zeit-Verarbeitung (Missionen/Raids) aufgerufen. Jeder
 * Baustein benutzt dieselben Aktionsfunktionen wie ein Mensch ueber die UI - keine Sonderregeln,
 * keine abweichenden Kosten/Zeiten (siehe README).
 */
export async function runBotTurn(state: PlayerState, allUsers: { id: number; username: string; isBot: boolean }[]): Promise<void> {
  const humanUserIds = allUsers.filter((u) => !u.isBot && u.id !== state.userId).map((u) => u.id);

  maybeBuildBuilding(state);
  maybeStartResearch(state);
  maybeBuildShips(state);
  maybeBuildDefense(state);
  maybeSendMiningFleet(state);
  await maybeHandleGroupOps(state, humanUserIds);
  maybeHoldAtHumans(state, humanUserIds);
}

export function isBotUserId(userId: number): boolean {
  return listBotUserIds().includes(userId);
}
