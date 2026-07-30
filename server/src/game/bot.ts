import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername, listBotUserIds } from '../db.js';
import { startBuild } from './actions.js';
import { runEconomyBotTurn } from './economyBotTurn.js';
import { listMyGroupOperations, respondToGroupOperation, startGroupOperation, createGroupOperation } from './groupOps.js';
import { startHoldDeployment } from './galaxy.js';
import { startPirateBaseAttack, listActivePirateBaseSummaries } from './pirateBaseState.js';
import { startSpyProbe } from './spyMissions.js';
import { combatFleetPowerBase } from './combat.js';
import { ACTIVE_PIRATE_BASE_IDS } from './data/galaxyConstants.js';
import { MAX_BUILD_SLOTS } from './data/combatConstants.js';
import type { PlayerState } from './types.js';

// Namen der KI-Mitspieler - bei Bedarf hier anpassen/erweitern, bevor der Server das erste Mal
// mit dieser Version startet (siehe ensureBotUsers() unten, wird einmalig beim Serverstart
// geprueft und angelegt, falls noch nicht vorhanden).
const BOT_USERNAMES = ['KI-Vega', 'KI-Nyx'];

// Chance PRO HEARTBEAT (alle 2 Minuten) fuer die UNGEFAEHRLICHEN "gelegentlichen" Bot-Aktionen
// (Halten bei Mitspielern, Piratenbasis-Spionage) - keine davon loest selbst eine Kampf-Simulation
// aus (Halten registriert nur eine Stationierung, Kampf kommt erst spaeter ueber einen echten Raid;
// Spionage ist ein reiner Bericht ohne Kampf-Chance, siehe spyMissions.ts). Nutzerentscheidung Juli
// 2026: angehoben von 0.1 auf 0.3 (im Schnitt alle ~6-7 Minuten statt ~20).
const BOT_ACTION_CHANCE = 0.3;

// Eigene, DEUTLICH niedrigere Chance fuer die einzige verbleibende Zufallsaktion, die selbst eine
// echte Kampf-Simulation im nur 2-Worker-Pool ausloest (Piratenbasis-Angriff, siehe
// maybeAttackPirateBase unten) - war beim CPU-Spitzen-Vorfall (README Punkt 97/98) mit der alten,
// gemeinsamen BOT_ACTION_CHANCE=0.3 eine der Hauptquellen (echter Kampf alle ~6-7 Minuten pro Bot).
// Getrennte throttled Wiedereinfuehrung (siehe README): 0.05 senkt die erwartete Kampf-Frequenz auf
// ~alle 40 Minuten pro Bot, analog zur bereits bestehenden 0.05-Chance bei maybeHandleGroupOps fuer
// neue Elite-Expeditionen unten.
const BOT_COMBAT_ACTION_CHANCE = 0.05;

// Sicherheitsspanne fuer die Angriffs-Abwaegung unten (siehe maybeAttackPirateBase) - Bots sollen
// nicht schon bei knappem Gleichstand angreifen (Muenzwurf-Risiko), sondern einen spuerbaren
// Staerke-Vorteil abwarten. Nutzerentscheidung (30.07.2026): "sie muessen abwaegen koennen, ob sich
// ein Angriff lohnt" - gilt analog fuer die Piratenbasen-Offensiv-KI selbst, siehe
// PIRATE_BASE_ATTACK_POWER_SAFETY_MARGIN in pirateBaseState.ts.
const ATTACK_POWER_SAFETY_MARGIN = 1.15;

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
// nach economyBotTurn.ts ausgelagert - wird dort von runEconomyBotTurn() gebuendelt und hier unten
// wiederverwendet, genauso wie von Piratenbasen (siehe pirateBaseState.ts), die aber NICHTS von dem
// hier unten (Gruppen-Expeditionen/Halten bei Mitspielern/Piratenbasis-Angriff-und-Spionage)
// mitmachen - das ergibt fuer eine Piratenbasis keinen Sinn.

// Elite-Bollwerk: offene Einladungen annehmen, eigene Operation starten sobald alle da sind, und
// gelegentlich selbst eine Expedition eroeffnen und die menschlichen Spieler einladen. Bewusst NUR
// 'piraten_elite' (siehe unten) - NICHT 'piraten_admiral', das waere alle 10 Minuten garantiert
// Kampf statt alle 4h wie hier, siehe README-Kosten-Analyse zur throttled Wiedereinfuehrung.
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
// Piratenraids automatisch mitverteidigt wird (siehe galaxy.ts/raids.ts) - lost selbst KEINE
// Kampf-Simulation aus (nur Registrierung einer Stationierung), Kampf kommt erst spaeter ueber
// einen echten Raid. Nicht bei JEDEM Heartbeat (sonst wuerde staendig neu versucht), sondern mit
// Zufallschance, und nur falls dort nicht schon eine eigene Flotte haelt/unterwegs ist.
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

// Piratenbasen greifen selbst auch wieder an (siehe pirateBaseState.ts), die KI-Bots duerfen sie
// aber weiterhin selbst angreifen - dieselbe "kleine Zufallschance pro Heartbeat, nur falls dort
// nicht schon eine eigene Flotte unterwegs ist"-Logik wie maybeHoldAtHumans oben, aber mit eigener,
// deutlich niedrigerer BOT_COMBAT_ACTION_CHANCE statt BOT_ACTION_CHANCE - das ist die einzige
// verbleibende Bot-Aktion, die selbst eine echte Kampf-Simulation ausloest (siehe README-
// Kosten-Analyse zur throttled Wiedereinfuehrung).
// Abwaegung (Nutzerentscheidung 30.07.2026): Bots sollen sich erst auf Wirtschaft konzentrieren und
// langsam Flotte aufbauen, ANSTATT bei jeder Zufallschance blind mit einem festen 15%-Haeppchen
// loszuschlagen - deshalb erst die tatsaechliche Basis-Staerke (listActivePirateBaseSummaries(),
// bereits vorhandene, kostenguenstige Zusammenfassung) gegen die geplante Angriffsflotte pruefen und
// nur bei einem klaren Vorteil (ATTACK_POWER_SAFETY_MARGIN) tatsaechlich angreifen - sonst wird die
// Basis lieber uebersprungen, die Flotte waechst beim naechsten Zug weiter.
async function maybeAttackPirateBase(state: PlayerState): Promise<void> {
  let baseSummaries: { id: string; power: number }[] | null = null;
  for (const baseId of ACTIVE_PIRATE_BASE_IDS) {
    const alreadyAttacking = state.pirateAttacks.some((a) => a.baseId === baseId);
    if (alreadyAttacking) continue;
    if (Math.random() > BOT_COMBAT_ACTION_CHANCE) continue;

    const selection: Record<string, number> = {};
    let total = 0;
    for (const id of ['leicht', 'schwer', 'kreuzer']) {
      const take = Math.floor((state.fleet[id] || 0) * 0.15);
      if (take > 0) {
        selection[id] = take;
        total += take;
      }
    }
    if (total < 5) continue;

    if (!baseSummaries) baseSummaries = await listActivePirateBaseSummaries(); // nur einmal pro Zug laden, nicht pro Basis
    const basePower = baseSummaries.find((b) => b.id === baseId)?.power ?? Infinity;
    if (combatFleetPowerBase(selection) < basePower * ATTACK_POWER_SAFETY_MARGIN) continue; // (noch) zu schwach - lieber abwarten

    startPirateBaseAttack(state, baseId, selection);
  }
}

// KI-Bots spionieren ebenfalls Piratenbasen aus (Nutzerentscheidung: "Piraten und KI bots
// spionieren auch") - bauen bei Bedarf ein paar Sonden nach (unabhaengig vom normalen
// Kampfschiff-Bauslot-Rennen in maybeBuildShips) und schicken gelegentlich eine los. Loest KEINE
// Kampf-Simulation aus (reiner Bericht, siehe spyMissions.ts), bleibt daher bei BOT_ACTION_CHANCE.
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
  await maybeAttackPirateBase(state);
  maybeSpyOnPirateBase(state);
}

export function isBotUserId(userId: number): boolean {
  return listBotUserIds().includes(userId);
}
