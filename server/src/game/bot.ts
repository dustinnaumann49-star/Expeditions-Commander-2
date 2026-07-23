import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername, listBotUserIds } from '../db.js';
import { startBuild } from './actions.js';
import { runEconomyBotTurn } from './economyBotTurn.js';
import { listMyGroupOperations, respondToGroupOperation, startGroupOperation, createGroupOperation } from './groupOps.js';
import { startHoldDeployment } from './galaxy.js';
import { startPirateBaseAttack } from './pirateBaseState.js';
import { startSpyProbe } from './spyMissions.js';
import { ACTIVE_PIRATE_BASE_IDS } from './data/galaxyConstants.js';
import { MAX_BUILD_SLOTS } from './data/combatConstants.js';
import type { PlayerState } from './types.js';

// Namen der KI-Mitspieler - bei Bedarf hier anpassen/erweitern, bevor der Server das erste Mal
// mit dieser Version startet (siehe ensureBotUsers() unten, wird einmalig beim Serverstart
// geprueft und angelegt, falls noch nicht vorhanden).
const BOT_USERNAMES = ['KI-Vega', 'KI-Nyx'];

// Chance PRO HEARTBEAT (alle 2 Minuten) fuer die "gelegentlichen" Bot-Aktionen (Halten bei
// Mitspielern, Piratenbasis-Angriff, Piratenbasis-Spionage) - Nutzerentscheidung Juli 2026:
// angehoben von 0.1 (im Schnitt nur alle ~20 Minuten ein Versuch, wirkte dadurch zu passiv) auf
// 0.3 (im Schnitt alle ~6-7 Minuten).
const BOT_ACTION_CHANCE = 0.3;

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];

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

// ========== MITSPIELER-INTERAKTION (nur KI-Vega/KI-Nyx, NICHT Piratenbasen) ==========
// Die reine Wirtschafts-Entscheidungslogik (Gebaeude/Forschung/Schiffe/Verteidigung/Mining) wurde
// nach economyBotTurn.ts ausgelagert (Nutzerentscheidung Juli 2026) - wird dort von
// runEconomyBotTurn() gebuendelt und hier unten wiederverwendet, genauso wie von Piratenbasen
// (siehe pirateBaseState.ts), die aber NICHTS von dem hier unten (Gruppen-Expeditionen/Halten bei
// Mitspielern/Piratenbasis-Angriff-und-Spionage) mitmachen - das ergibt fuer eine Piratenbasis
// keinen Sinn.

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
// Heartbeat (sonst wuerde staendig neu versucht), sondern mit Zufallschance, und nur
// falls dort nicht schon eine eigene Flotte haelt/unterwegs ist.
function maybeHoldAtHumans(state: PlayerState, humanUserIds: number[]): void {
  for (const targetUserId of humanUserIds) {
    const alreadyThere = state.galaxyDeployments.some((d) => d.targetUserId === targetUserId && !d.recalled);
    if (alreadyThere) continue;
    if (Math.random() > BOT_ACTION_CHANCE) continue;

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

// Piratenbasen greifen laut Nutzerentscheidung auch die KI-Bots automatisch an (siehe
// pirateBaseState.ts) - dieselbe "kleine Zufallschance pro Heartbeat, nur falls dort nicht schon
// eine eigene Flotte unterwegs ist"-Logik wie maybeHoldAtHumans oben, nur mit einem echten
// Angriffsflug statt einer haltenden Verstaerkung.
function maybeAttackPirateBase(state: PlayerState): void {
  for (const baseId of ACTIVE_PIRATE_BASE_IDS) {
    const alreadyAttacking = state.pirateAttacks.some((a) => a.baseId === baseId);
    if (alreadyAttacking) continue;
    if (Math.random() > BOT_ACTION_CHANCE) continue;

    const selection: Record<string, number> = {};
    let total = 0;
    for (const id of ['leicht', 'schwer', 'kreuzer']) {
      const take = Math.floor((state.fleet[id] || 0) * 0.15);
      if (take > 0) {
        selection[id] = take;
        total += take;
      }
    }
    if (total >= 5) startPirateBaseAttack(state, baseId, selection);
  }
}

// KI-Bots spionieren ebenfalls Piratenbasen aus (Nutzerentscheidung: "Piraten und KI bots
// spionieren auch") - bauen bei Bedarf ein paar Sonden nach (unabhaengig vom normalen
// Kampfschiff-Bauslot-Rennen in maybeBuildShips) und schicken gelegentlich eine los.
function maybeSpyOnPirateBase(state: PlayerState): void {
  if ((state.fleet.spionagesonde || 0) < 2 && state.buildQueue.length < MAX_BUILD_SLOTS) {
    startBuild(state, 'spionagesonde', 2);
  }
  for (const baseId of ACTIVE_PIRATE_BASE_IDS) {
    const alreadySpying = state.spyMissions.some((m) => m.baseId === baseId);
    if (alreadySpying) continue;
    if (Math.random() > BOT_ACTION_CHANCE) continue;
    if ((state.fleet.spionagesonde || 0) < 1) continue;
    startSpyProbe(state, baseId, 1);
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

  runEconomyBotTurn(state);
  await maybeHandleGroupOps(state, humanUserIds);
  maybeHoldAtHumans(state, humanUserIds);
  maybeAttackPirateBase(state);
  maybeSpyOnPirateBase(state);
}

export function isBotUserId(userId: number): boolean {
  return listBotUserIds().includes(userId);
}
