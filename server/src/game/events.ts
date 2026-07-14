import {
  EVENT_CHECK_INTERVAL_MS,
  EVENT_SPAWN_CHANCE,
  EVENT_WINDOW_MS,
  EVENT_NAMES,
  EVENT_NPC_MULTIPLIER,
  EVENT_MULTIPLIER_ROLL,
  ALLY_STATS,
} from './data/economy.js';
import { getEffectiveStats, baseStats, shipName, combatFleetPower, generateFallbackFleet } from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { pushMessage } from './messages.js';
import type { ActionResult } from './actions.js';
import type { CombatUnitResult, PlayerState } from './types.js';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rollMultiplier(options: number[]): number {
  return options[Math.floor(Math.random() * options.length)];
}

export function processEventTimer(state: PlayerState) {
  const now = Date.now();
  if (state.event && now > state.event.deadline && !state.event.started) {
    state.event = null;
  }
  if (now < state.nextEventCheck) return;
  state.nextEventCheck = now + EVENT_CHECK_INTERVAL_MS;
  if (state.event) return;
  if (Math.random() < EVENT_SPAWN_CHANCE) {
    state.event = { id: 'event_' + now, name: pickRandom(EVENT_NAMES), spawnedAt: now, deadline: now + EVENT_WINDOW_MS, started: false };
    pushMessage(state, 'kampf', `Notruf empfangen: ${state.event.name}. Zeit zum Eingreifen: ${Math.round(EVENT_WINDOW_MS / 60000)} Minuten.`);
  }
}

export async function startEventMission(state: PlayerState, selection: Record<string, number>): Promise<ActionResult> {
  if (!state.event || state.event.started) return { ok: false, error: 'Kein aktiver Notruf.' };
  const playerIds = Object.keys(selection).filter((id) => selection[id] > 0);
  if (playerIds.length === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const id of playerIds) {
    if ((state.fleet[id] || 0) < selection[id]) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  state.event.started = true;
  playerIds.forEach((id) => (state.fleet[id] -= selection[id]));

  const sentPower = combatFleetPower(selection, state.research);
  const allyCount = Math.max(8, Math.round(sentPower / 18000));

  const eventMultiplier = rollMultiplier(EVENT_MULTIPLIER_ROLL);
  const targetPower = sentPower * EVENT_NPC_MULTIPLIER * eventMultiplier;
  const npcShips = generateFallbackFleet(targetPower);
  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);

  const allySelection = { ...selection, verbuendete: allyCount };
  const result = await runCombatInWorker({ sideAShips: allySelection, sideBShips: npcShips, research: state.research, useAllyStats: true });

  let anyPlayerLoss = false;
  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = playerIds.map((id) => {
    const sent = selection[id];
    const survived = result.survivorsA[id];
    const lost = sent - survived;
    if (lost > 0) anyPlayerLoss = true;
    losses[id] = lost;
    state.fleet[id] = (state.fleet[id] || 0) + survived;
    const eff = getEffectiveStats(id, state.research);
    return {
      id,
      name: shipName(id),
      sent,
      survived,
      lost,
      waffen: Math.round(eff.waffen),
      schild: Math.round(eff.schild),
      panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenA[id] || 0),
      shotsFired: result.shotsA.shotsFired[id] || 0,
      hits: result.shotsA.hits[id] || 0,
      rapidFireTriggers: result.shotsA.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenA[id] || 0),
      shieldRegen: Math.round(result.shieldRegenA[id] || 0),
    };
  });

  const allyLost = allyCount - result.survivorsA['verbuendete'];
  const allyResult: CombatUnitResult = {
    id: 'verbuendete',
    name: 'Verbündete Flotte',
    sent: allyCount,
    survived: result.survivorsA['verbuendete'],
    lost: allyLost,
    waffen: Math.round(ALLY_STATS.waffen),
    schild: Math.round(ALLY_STATS.schild),
    panzerung: Math.round(ALLY_STATS.panzerung),
    dmgTaken: Math.round(result.dmgTakenA['verbuendete'] || 0),
    shotsFired: result.shotsA.shotsFired['verbuendete'] || 0,
    hits: result.shotsA.hits['verbuendete'] || 0,
    rapidFireTriggers: result.shotsA.rapidFireTriggers['verbuendete'] || 0,
    shieldDmgTaken: Math.round(result.shieldDmgTakenA['verbuendete'] || 0),
    shieldRegen: Math.round(result.shieldRegenA['verbuendete'] || 0),
  };

  let anyNpcDestroyed = false;
  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcShips[id];
    const survivedCount = result.survivorsB[id];
    const destroyedCount = sent - survivedCount;
    if (destroyedCount > 0) anyNpcDestroyed = true;
    return {
      id,
      name: shipName(id),
      count: sent,
      waffen: Math.round(base.waffen),
      schild: Math.round(base.schild),
      panzerung: Math.round(base.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0),
      destroyedCount,
      survivedCount,
      destroyed: survivedCount <= 0,
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  const npcFullyDestroyed = npcIds.every((id) => result.survivorsB[id] <= 0);
  const playerWiped = playerIds.every((id) => result.survivorsA[id] <= 0) && result.survivorsA['verbuendete'] <= 0;
  const eventStrengthLabel = eventMultiplier <= 0.5 ? 'Schwache Übermacht' : eventMultiplier >= 1.5 ? 'Starke Übermacht' : 'Normale Übermacht';
  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';

  let containerReward: 'silber' | 'gold' | null = null;
  if (!playerWiped && npcFullyDestroyed) containerReward = 'gold';
  else if (!playerWiped && !npcFullyDestroyed) containerReward = 'silber';
  if (containerReward) {
    state.inventory.push({ id: 'container_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), tier: containerReward, receivedAt: Date.now() });
  }
  const rewardText = containerReward ? (containerReward === 'gold' ? '🏆 Gold-Container erhalten' : '📦 Silber-Container erhalten') : '';

  const eventName = state.event.name;
  const outcome = playerWiped || !npcFullyDestroyed ? 'Rückzug – Notruf gescheitert' : 'Notruf erfolgreich – Geholfen';
  pushMessage(
    state,
    'kampf',
    `${eventName}: ${outcome} [${eventStrengthLabel}] (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verbündete Verluste: ${allyLost}. ${rewardText}`,
    { sektorName: eventName, outcome, roundsFought: result.roundsFought, npcResults, playerResults, allyResult }
  );

  state.event = null;
  return { ok: true };
}
