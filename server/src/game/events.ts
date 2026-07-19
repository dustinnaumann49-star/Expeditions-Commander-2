import {
  EVENT_SPAWN_CHANCE,
  EVENT_WINDOW_MS,
  EVENT_NAMES,
  ALLY_STATS,
  rollFixedCheckpoints,
  EVENT_CHECK_HOURS_LOCAL,
} from './data/economy.js';
import { NOTRUF_POSITION } from './data/galaxyConstants.js';
import { galaxyDistance, galaxyDurationMs, galaxyFleetSpeed } from './galaxy.js';
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
// siehe spawnRaidAt() in raids.ts fuer denselben Gedanken beim Raid-Pendant. `deadline` ist die
// Frist zum LOSSCHICKEN, nicht zur Ankunft - die Flugzeit (siehe startEventMission()) kommt erst
// danach obendrauf.
function spawnEventAt(state: PlayerState, checkpointTime: number): void {
  state.event = {
    id: 'event_' + checkpointTime,
    name: pickRandom(EVENT_NAMES),
    spawnedAt: checkpointTime,
    deadline: checkpointTime + EVENT_WINDOW_MS,
    started: false,
    ships: {},
    arriveTime: 0,
  };
  pushMessage(
    state,
    'kampf',
    `Notruf empfangen: ${state.event.name} (Position 1:${NOTRUF_POSITION.system}:${NOTRUF_POSITION.position}). Zeit zum Losschicken: ${Math.round(EVENT_WINDOW_MS / 60000)} Minuten - danach kommt noch die Flugzeit deiner Flotte dazu.`
  );
}

// PERFORMANCE-NOTMASSNAHME (siehe Nutzerentscheidung nach Server-Absturz auf dem Starter-Tarif):
// Notruf-Events spawnen vorerst NICHT mehr neu - jede zusaetzliche gleichzeitig laufende
// Kampfaufloesung (Worker-Thread, siehe combatRunner.ts) erhoeht das Risiko eines erneuten
// Absturzes bei begrenztem CPU/RAM. Bereits aktive/laufende Events werden weiterhin normal zu
// Ende gefuehrt (kein hartes Abbrechen mitten im Flug) - es werden nur KEINE NEUEN mehr erzeugt.
const EVENTS_ENABLED = false;

export async function processEventTimer(state: PlayerState) {
  const now = Date.now();
  if (state.event && !state.event.started && now > state.event.deadline) {
    state.event = null;
  }
  if (state.event && state.event.started && now >= state.event.arriveTime) {
    await resolveEventCombat(state);
  }
  if (now < state.nextEventCheck) return;
  if (state.event) return;
  if (!EVENTS_ENABLED) return;
  state.nextEventCheck = rollFixedCheckpoints(state.nextEventCheck, now, EVENT_SPAWN_CHANCE, (checkpointTime) => spawnEventAt(state, checkpointTime), EVENT_CHECK_HOURS_LOCAL);
}

/**
 * Pendant zu processOverdueRaidSpawnsForOtherUsers/processOverdueRaidsForOtherUsers (raids.ts):
 * verwirft abgelaufene (nie losgeschickte) Notrufe UND loest bereits angekommene (gestartete)
 * Notrufe auf UND wuerfelt faellige Checkpoints - alles auch fuer Spieler, die gerade nicht selbst
 * online sind. Wird bei JEDEM tick() zusaetzlich zum eigenen processEventTimer aufgerufen.
 */
export async function processOverdueEventsForOtherUsers(currentState: PlayerState): Promise<void> {
  const now = Date.now();
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    try {
      const otherState = loadPlayerState(u.id);
      let changed = false;
      if (otherState.event && !otherState.event.started && now > otherState.event.deadline) {
        otherState.event = null;
        changed = true;
      }
      if (otherState.event && otherState.event.started && now >= otherState.event.arriveTime) {
        await resolveEventCombat(otherState);
        changed = true;
      }
      if (EVENTS_ENABLED && !otherState.event && now >= otherState.nextEventCheck) {
        otherState.nextEventCheck = rollFixedCheckpoints(
          otherState.nextEventCheck,
          now,
          EVENT_SPAWN_CHANCE,
          (checkpointTime) => spawnEventAt(otherState, checkpointTime),
          EVENT_CHECK_HOURS_LOCAL
        );
        changed = true;
      }
      if (changed) savePlayerState(otherState);
    } catch (err) {
      console.error(`processOverdueEventsForOtherUsers: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
}

// Schickt die Flotte zur Notruf-Position los (Ressourcen/Flotte werden HIER abgezogen) - der
// eigentliche Kampf loest erst bei Ankunft aus (resolveEventCombat(), ueber processEventTimer()/
// processOverdueEventsForOtherUsers() bei Erreichen von arriveTime). Notruf ist bewusst NUR NOCH
// SOLO moeglich (kein Multiplayer-Pendant mehr, siehe groupOps.ts).
export async function startEventMission(state: PlayerState, selection: Record<string, number>): Promise<ActionResult> {
  if (!state.event || state.event.started) return { ok: false, error: 'Kein aktiver Notruf.' };
  const playerIds = Object.keys(selection).filter((id) => selection[id] > 0);
  if (playerIds.length === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const id of playerIds) {
    if ((state.fleet[id] || 0) < selection[id]) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  const speed = galaxyFleetSpeed(selection, state.research);
  if (speed <= 0) return { ok: false, error: 'Ungültige Flottenzusammenstellung.' };

  playerIds.forEach((id) => (state.fleet[id] -= selection[id]));

  const now = Date.now();
  let travelMs = 60 * 1000;
  if (state.galaxyPosition) {
    const distance = galaxyDistance(state.galaxyPosition, NOTRUF_POSITION);
    const computed = galaxyDurationMs(distance, speed);
    if (Number.isFinite(computed)) travelMs = computed;
  }
  state.event.started = true;
  state.event.ships = selection;
  state.event.arriveTime = now + travelMs;

  pushMessage(state, 'kampf', `Deine Flotte ist unterwegs zum Notruf "${state.event.name}" - Ankunft in ${Math.round(travelMs / 60000)} Minuten.`);
  return { ok: true };
}

// Der eigentliche Kampf - laeuft erst bei Ankunft (state.event.arriveTime erreicht), nicht mehr
// synchron beim Losschicken. Inhaltlich unveraendert gegenueber der vorherigen Version, liest die
// Flottenauswahl jetzt aber aus state.event.ships statt aus einem Funktionsparameter.
async function resolveEventCombat(state: PlayerState): Promise<void> {
  if (!state.event) return;
  const selection = state.event.ships;
  const playerIds = Object.keys(selection).filter((id) => selection[id] > 0);

  const sentPower = combatFleetPowerBase(selection);
  const allyCount = Math.max(8, Math.round(sentPower / 18000));

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
      dmgDealt: Math.round(result.shotsA.dmgDealt[id] || 0),
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
    dmgDealt: Math.round(result.shotsA.dmgDealt['verbuendete'] || 0),
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
      dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
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

  const destroyedEnemyCount = npcResults.reduce((sum, r) => sum + (r.destroyedCount || 0), 0);
  state.stats.enemiesDestroyed += destroyedEnemyCount;
  state.stats.ownShipsLost += Object.values(losses).reduce((a, b) => a + b, 0);
  if (!playerWiped && npcFullyDestroyed) state.stats.notrufCompleted++;

  let containerCount = 0;
  let containerTier: 'silber' | 'gold' | null = null;
  if (!playerWiped && npcFullyDestroyed) {
    containerTier = anyPlayerLoss ? 'silber' : 'gold';
    containerCount = 1 + Math.floor(Math.random() * 3); // 1-3
    for (let i = 0; i < containerCount; i++) {
      state.inventory.push({ id: 'container_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 8), tier: containerTier, receivedAt: Date.now() });
    }
  }
  const rewardText = containerTier
    ? `${containerTier === 'gold' ? '🏆' : '📦'} ${containerCount}x ${containerTier === 'gold' ? 'Gold' : 'Silber'}-Container erhalten`
    : '';

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
}
