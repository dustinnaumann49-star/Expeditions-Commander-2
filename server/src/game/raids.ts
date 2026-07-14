import { DEFENSES } from './data/defenses.js';
import { RAID_CHECK_INTERVAL_MS, RAID_WARNING_MS, RAID_MULTIPLIER, RAID_MULTIPLIER_ROLL, RAID_LOOT_PERCENT, COMBAT_SHIP_IDS } from './data/economy.js';
import { getEffectiveStats, baseStats, shipName, generateFallbackFleet } from './combat.js';
import type { OwnedFleetContribution } from './combat.js';
import { runCombatInWorker, runMultiOwnerCombatInWorker } from './combatRunner.js';
import { DEFENSE_REPAIR_PERCENT } from './data/combatConstants.js';
import { pushMessage } from './messages.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { getUserById } from '../db.js';
import type { CombatUnitResult, PlayerState } from './types.js';

function rollMultiplier(options: number[]): number {
  return options[Math.floor(Math.random() * options.length)];
}

export async function processRaidTimer(state: PlayerState) {
  const now = Date.now();

  if (state.raid && !state.raid.resolved && now >= state.raid.arrivalTime) {
    await resolveRaid(state);
    return;
  }
  if (state.raid && state.raid.resolved) {
    state.raid = null;
    return;
  }
  if (state.raid) return;
  if (now < state.nextRaidCheck) return;

  state.nextRaidCheck = now + RAID_CHECK_INTERVAL_MS;
  state.raid = { id: 'raid_' + now, spawnedAt: now, arrivalTime: now + RAID_WARNING_MS, resolved: false, reinforcements: [] };
  pushMessage(
    state,
    'kampf',
    `⚠ Piratenflotte im Anflug auf deine Heimatbasis! Ankunft in ${Math.round(RAID_WARNING_MS / 60000)} Minuten. Verstärke deine Verteidigung oder rufe deine Flotte zurück.`
  );
}

async function resolveRaid(state: PlayerState) {
  const homeShipIds = COMBAT_SHIP_IDS.filter((id) => (state.fleet[id] || 0) > 0);
  const homeDefIds = DEFENSES.map((d) => d.id).filter((id) => (state.defense[id] || 0) > 0);

  const defenderShips: Record<string, number> = {};
  homeShipIds.forEach((id) => (defenderShips[id] = state.fleet[id]));
  homeDefIds.forEach((id) => (defenderShips[id] = state.defense[id]));

  let homePower = 0;
  Object.entries(defenderShips).forEach(([id, count]) => {
    const eff = getEffectiveStats(id, state.research, state.defense);
    homePower += count * (eff.waffen + eff.schild + eff.panzerung);
  });

  if (Object.keys(defenderShips).length === 0 || homePower === 0) {
    const stolen = {
      metall: Math.round(state.resources.metall * RAID_LOOT_PERCENT),
      kristall: Math.round(state.resources.kristall * RAID_LOOT_PERCENT),
      deuterium: Math.round(state.resources.deuterium * RAID_LOOT_PERCENT),
    };
    state.resources.metall = Math.max(0, state.resources.metall - stolen.metall);
    state.resources.kristall = Math.max(0, state.resources.kristall - stolen.kristall);
    state.resources.deuterium = Math.max(0, state.resources.deuterium - stolen.deuterium);
    pushMessage(
      state,
      'kampf',
      `Piratenüberfall erfolgreich – keine Verteidigung vorhanden! Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium.`
    );
    state.raid = null;
    return;
  }

  const raidMultiplier = rollMultiplier(RAID_MULTIPLIER_ROLL);
  // Verstaerkungen anderer Spieler, die rechtzeitig angekommen sind, zaehlen zur Verteidigungsstaerke
  // dazu (bevor die Feindstaerke gewuerfelt wird) und werden gleich mitgeladen (fuer ihre eigene Forschung).
  const now = Date.now();
  const arrivedReinforcements = (state.raid?.reinforcements || []).filter((r) => r.arrivalTime <= now);
  const reinforcerStates = arrivedReinforcements.map((r) => ({ r, playerState: loadPlayerState(r.userId) }));

  let reinforcementPower = 0;
  reinforcerStates.forEach(({ r, playerState }) => {
    Object.entries(r.ships).forEach(([id, count]) => {
      const eff = getEffectiveStats(id, playerState.research);
      reinforcementPower += count * (eff.waffen + eff.schild + eff.panzerung);
    });
  });

  const targetPower = (homePower + reinforcementPower) * RAID_MULTIPLIER * raidMultiplier;
  const npcShips = generateFallbackFleet(targetPower);
  const raidStrengthLabel = raidMultiplier <= 0.5 ? 'Schwacher Angriff' : raidMultiplier >= 1.5 ? 'Starker Angriff' : 'Normaler Angriff';

  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
  if (npcIds.length === 0) {
    pushMessage(state, 'kampf', 'Piratenüberfall – keine Angreifer gefunden. Seltsam...');
    state.raid = null;
    return;
  }

  const contributions: OwnedFleetContribution[] = [
    { ownerKey: 'owner', ships: defenderShips, research: state.research, defenseCounts: state.defense },
    ...reinforcerStates.map(({ r, playerState }) => ({
      ownerKey: String(r.userId),
      ships: r.ships,
      research: playerState.research,
    })),
  ];

  const result =
    reinforcerStates.length > 0
      ? await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcShips, research: state.research, defenseCounts: state.defense })
      : await runCombatInWorker({ sideAShips: defenderShips, sideBShips: npcShips, research: state.research, defenseCounts: state.defense });
  const survivorsByOwner: Record<string, Record<string, number>> | undefined =
    'survivorsByOwner' in result ? (result as { survivorsByOwner: Record<string, Record<string, number>> }).survivorsByOwner : undefined;

  let anyDefLoss = false;
  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = [];
  const ownerUsername = getUserById(state.userId)?.username || 'Verteidiger';

  homeShipIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research);
    const sent = state.fleet[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const lost = sent - survived;
    if (lost > 0) anyDefLoss = true;
    losses[id] = lost;
    state.fleet[id] = survived;
    playerResults.push({
      id,
      name: shipName(id),
      ownerUsername,
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
    });
  });

  homeDefIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research, state.defense);
    const sent = state.defense[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const destroyed = sent - survived;
    if (destroyed > 0) anyDefLoss = true;
    losses[id] = destroyed;
    const repaired = Math.floor(destroyed * DEFENSE_REPAIR_PERCENT);
    state.defense[id] = survived + repaired;
    playerResults.push({
      id,
      name: shipName(id),
      ownerUsername,
      sent,
      survived,
      lost: destroyed,
      waffen: Math.round(eff.waffen),
      schild: Math.round(eff.schild),
      panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenA[id] || 0),
      shotsFired: result.shotsA.shotsFired[id] || 0,
      hits: result.shotsA.hits[id] || 0,
      rapidFireTriggers: result.shotsA.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenA[id] || 0),
      shieldRegen: Math.round(result.shieldRegenA[id] || 0),
      isDefense: true,
    });
  });

  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcShips[id];
    const survivedCount = result.survivorsB[id] || 0;
    return {
      id,
      name: shipName(id),
      count: sent,
      waffen: Math.round(base.waffen),
      schild: Math.round(base.schild),
      panzerung: Math.round(base.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0),
      destroyedCount: sent - survivedCount,
      survivedCount,
      destroyed: survivedCount <= 0,
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  const piratesRepelled = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);
  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';

  // Verstaerkungen: Schiffe je Beitrag getrennt in derselben Detailansicht auflisten (mit eigenem
  // Spielernamen), Ueberlebende zurueck an den jeweiligen Absender. Jeder Verstaerker bekommt
  // ausserdem eine EIGENE Container-Belohnung, exakt wie ein Verteidiger sie auch bekommen wuerde -
  // keine Aufteilung, jeder erhaelt seine volle "Solo"-Belohnung fuer den gemeinsamen Kampfausgang.
  if (reinforcerStates.length > 0) {
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      const ownerKey = String(r.userId);
      const ownerSurvivors = survivorsByOwner?.[ownerKey] || {};
      Object.entries(r.ships).forEach(([id, sentCount]) => {
        const survived = ownerSurvivors[id] || 0;
        const lost = sentCount - survived;
        reinforcerState.fleet[id] = (reinforcerState.fleet[id] || 0) + survived;
        playerResults.push({
          id,
          name: shipName(id),
          ownerUsername: r.username,
          sent: sentCount,
          survived,
          lost,
          waffen: 0,
          schild: 0,
          panzerung: 0,
          dmgTaken: 0,
          shotsFired: 0,
          hits: 0,
          rapidFireTriggers: 0,
          shieldDmgTaken: 0,
          shieldRegen: 0,
        });
      });
      const reinforcerContainer: 'silber' | 'gold' = piratesRepelled ? 'gold' : 'silber';
      reinforcerState.inventory.push({
        id: 'container_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        tier: reinforcerContainer,
        receivedAt: Date.now(),
      });
      // Wird unten (nachdem alle playerResults/npcResults feststehen) mit der vollen Detailansicht
      // versehen - siehe pushMessage-Aufrufe am Ende dieser Funktion.
    });
  }

  const containerReward: 'silber' | 'gold' = piratesRepelled ? 'gold' : 'silber';
  state.inventory.push({ id: 'container_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), tier: containerReward, receivedAt: Date.now() });

  if (!piratesRepelled) {
    const stolen = {
      metall: Math.round(state.resources.metall * RAID_LOOT_PERCENT),
      kristall: Math.round(state.resources.kristall * RAID_LOOT_PERCENT),
      deuterium: Math.round(state.resources.deuterium * RAID_LOOT_PERCENT),
    };
    state.resources.metall = Math.max(0, state.resources.metall - stolen.metall);
    state.resources.kristall = Math.max(0, state.resources.kristall - stolen.kristall);
    state.resources.deuterium = Math.max(0, state.resources.deuterium - stolen.deuterium);

    const outcome = 'Piratenüberfall teilweise abgewehrt – Feinde überlebt';
    const detail = { sektorName: 'Heimatbasis', outcome, roundsFought: result.roundsFought, npcResults, playerResults };
    pushMessage(
      state,
      'kampf',
      `${outcome} [${raidStrengthLabel}] (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium. (Container: ${containerReward === 'gold' ? 'Gold' : 'Silber'})`,
      detail
    );
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      pushMessage(
        reinforcerState,
        'kampf',
        `Deine Verstärkung für die Heimatbasis von ${ownerUsername}: Angriff nur teilweise abgewehrt (${result.roundsFought} Runden). Auch du erhältst einen ${
          piratesRepelled ? 'Gold' : 'Silber'
        }-Container für deinen Einsatz.`,
        detail
      );
      savePlayerState(reinforcerState);
    });
  } else {
    const outcome = 'Piratenüberfall abgewehrt – alle Feinde vernichtet';
    const detail = { sektorName: 'Heimatbasis', outcome, roundsFought: result.roundsFought, npcResults, playerResults };
    pushMessage(
      state,
      'kampf',
      `${outcome} [${raidStrengthLabel}] (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Ressourcen sicher. (Container: ${containerReward === 'gold' ? 'Gold' : 'Silber'})`,
      detail
    );
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      pushMessage(
        reinforcerState,
        'kampf',
        `Deine Verstärkung für die Heimatbasis von ${ownerUsername}: Piratenüberfall erfolgreich abgewehrt (${result.roundsFought} Runden)! Auch du erhältst einen ${
          piratesRepelled ? 'Gold' : 'Silber'
        }-Container für deinen Einsatz.`,
        detail
      );
      savePlayerState(reinforcerState);
    });
  }

  state.raid = null;
}
