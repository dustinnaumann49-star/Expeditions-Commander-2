import {
  EVENT_SPAWN_CHANCE,
  EVENT_WINDOW_MS,
  EVENT_NAMES,
  ALLY_STATS,
  rollFixedCheckpoints,
} from './data/economy.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  combatFleetPowerBase,
  generateFallbackFleet,
  pickWaveProfile,
  rollMultiplierWithOutlier,
  rollBattleModifier,
} from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { pushMessage } from './messages.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { listAllUsers } from '../db.js';
import type { ActionResult } from './actions.js';
import { NOTRUF_MULTIPLIER_ROLL, BATTLE_MODIFIER_LABELS } from './data/combatConstants.js';
import type { CombatUnitResult, PlayerState } from './types.js';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Spawnt ein Notruf-Event ausgehend vom TATSAECHLICHEN Checkpoint-Zeitpunkt (nicht "jetzt") -
// siehe spawnRaidAt() in raids.ts fuer denselben Gedanken beim Raid-Pendant.
function spawnEventAt(state: PlayerState, checkpointTime: number): void {
  state.event = { id: 'event_' + checkpointTime, name: pickRandom(EVENT_NAMES), spawnedAt: checkpointTime, deadline: checkpointTime + EVENT_WINDOW_MS, started: false };
  pushMessage(state, 'kampf', `Notruf empfangen: ${state.event.name}. Zeit zum Eingreifen: ${Math.round(EVENT_WINDOW_MS / 60000)} Minuten.`);
}

export function processEventTimer(state: PlayerState) {
  const now = Date.now();
  if (state.event && now > state.event.deadline && !state.event.started) {
    state.event = null;
  }
  if (now < state.nextEventCheck) return;
  if (state.event) return;
  state.nextEventCheck = rollFixedCheckpoints(state.nextEventCheck, now, EVENT_SPAWN_CHANCE, (checkpointTime) => spawnEventAt(state, checkpointTime));
}

/**
 * Pendant zu processOverdueRaidSpawnsForOtherUsers/processOverdueRaidsForOtherUsers (raids.ts),
 * bisher aber komplett gefehlt: Notruf-Events wurden ausschliesslich im processEventTimer des
 * betroffenen Spielers selbst gespawnt UND abgelaufen/verworfen (Deadline ueberschritten ohne
 * Eingreifen). War der Spieler laengere Zeit offline, blieb sein naechster Checkpoint einfach
 * liegen, bis er selbst wieder online kam - kein anderer Spieler konnte das anstossen. Wird bei
 * JEDEM tick() zusaetzlich zum eigenen processEventTimer aufgerufen.
 */
export async function processOverdueEventsForOtherUsers(currentState: PlayerState): Promise<void> {
  const now = Date.now();
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    const otherState = loadPlayerState(u.id);
    let changed = false;
    if (otherState.event && now > otherState.event.deadline && !otherState.event.started) {
      otherState.event = null;
      changed = true;
    }
    if (!otherState.event && now >= otherState.nextEventCheck) {
      otherState.nextEventCheck = rollFixedCheckpoints(otherState.nextEventCheck, now, EVENT_SPAWN_CHANCE, (checkpointTime) =>
        spawnEventAt(otherState, checkpointTime)
      );
      changed = true;
    }
    if (changed) savePlayerState(otherState);
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

  const sentPower = combatFleetPowerBase(selection);
  const allyCount = Math.max(8, Math.round(sentPower / 18000));

  // Feindstaerke war frueher exakt 100% der eingesetzten Flotten-Power ohne jede Schwankung -
  // jetzt mit leichter Grund-Varianz (NOTRUF_MULTIPLIER_ROLL) plus seltenem Ausreisser, damit auch
  // Notruf-Events nicht immer exakt gleich stark ausfallen (siehe combatConstants.ts).
  const { multiplier: rolledMultiplier, outlier } = rollMultiplierWithOutlier(NOTRUF_MULTIPLIER_ROLL, 'notruf');
  const targetPower = sentPower * rolledMultiplier;
  const profile = pickWaveProfile('notruf');
  const battleModifier = rollBattleModifier('notruf');
  const npcShips = generateFallbackFleet(targetPower, profile);
  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);

  const allySelection = { ...selection, verbuendete: allyCount };
  const result = await runCombatInWorker({ sideAShips: allySelection, sideBShips: npcShips, research: state.research, useAllyStats: true, battleModifier });

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
  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';

  let containerReward: 'silber' | 'gold' | null = null;
  if (!playerWiped && npcFullyDestroyed) containerReward = 'gold';
  else if (!playerWiped && !npcFullyDestroyed) containerReward = 'silber';
  if (containerReward) {
    state.inventory.push({ id: 'container_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), tier: containerReward, receivedAt: Date.now() });
  }
  const rewardText = containerReward ? (containerReward === 'gold' ? '🏆 Gold-Container erhalten' : '📦 Silber-Container erhalten') : '';

  const eventName = state.event.name;
  const outcome = result.retreated
    ? 'Rückzug nach hohen Verlusten – Flotte rechtzeitig abgesetzt'
    : playerWiped || !npcFullyDestroyed
    ? 'Rückzug – Notruf gescheitert'
    : 'Notruf erfolgreich – Geholfen';
  const waveText = outlier === 'stark' ? ' [⚠ Ungewöhnlich starke Gegenwehr]' : outlier === 'schwach' ? ' [Auffällig schwache Gegenwehr]' : '';
  const modifierText = battleModifier ? ` ${BATTLE_MODIFIER_LABELS[battleModifier]}.` : '';
  pushMessage(
    state,
    'kampf',
    `${eventName}${waveText}: ${outcome} (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verbündete Verluste: ${allyLost}. ${rewardText}${modifierText}`,
    { sektorName: eventName, outcome, roundsFought: result.roundsFought, npcResults, playerResults, allyResult, replay: result.replay }
  );

  state.event = null;
  return { ok: true };
}
