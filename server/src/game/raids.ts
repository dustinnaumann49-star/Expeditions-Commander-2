import { DEFENSES } from './data/defenses.js';
import { RAID_CHECK_INTERVAL_MS, RAID_WARNING_MS, RAID_MULTIPLIER, RAID_MULTIPLIER_ROLL, RAID_LOOT_PERCENT, COMBAT_SHIP_IDS } from './data/economy.js';
import { getEffectiveStats, baseStats, shipName, resolveCombat, generateFallbackFleet } from './combat.js';
import { DEFENSE_REPAIR_PERCENT } from './data/combatConstants.js';
import { pushMessage } from './messages.js';
import type { CombatUnitResult, PlayerState } from './types.js';

function rollMultiplier(options: number[]): number {
  return options[Math.floor(Math.random() * options.length)];
}

export function processRaidTimer(state: PlayerState) {
  const now = Date.now();

  if (state.raid && !state.raid.resolved && now >= state.raid.arrivalTime) {
    resolveRaid(state);
    return;
  }
  if (state.raid && state.raid.resolved) {
    state.raid = null;
    return;
  }
  if (state.raid) return;
  if (now < state.nextRaidCheck) return;

  state.nextRaidCheck = now + RAID_CHECK_INTERVAL_MS;
  state.raid = { id: 'raid_' + now, spawnedAt: now, arrivalTime: now + RAID_WARNING_MS, resolved: false };
  pushMessage(
    state,
    'kampf',
    `⚠ Piratenflotte im Anflug auf deine Heimatbasis! Ankunft in ${Math.round(RAID_WARNING_MS / 60000)} Minuten. Verstärke deine Verteidigung oder rufe deine Flotte zurück.`
  );
}

function resolveRaid(state: PlayerState) {
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
  const targetPower = homePower * RAID_MULTIPLIER * raidMultiplier;
  const npcShips = generateFallbackFleet(targetPower);
  const raidStrengthLabel = raidMultiplier <= 0.5 ? 'Schwacher Angriff' : raidMultiplier >= 1.5 ? 'Starker Angriff' : 'Normaler Angriff';

  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
  if (npcIds.length === 0) {
    pushMessage(state, 'kampf', 'Piratenüberfall – keine Angreifer gefunden. Seltsam...');
    state.raid = null;
    return;
  }

  const result = resolveCombat(defenderShips, (id) => getEffectiveStats(id, state.research, state.defense), npcShips, baseStats, state.research);

  let anyDefLoss = false;
  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = [];

  homeShipIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research);
    const sent = state.fleet[id] || 0;
    const survived = result.survivorsA[id] || 0;
    const lost = sent - survived;
    if (lost > 0) anyDefLoss = true;
    losses[id] = lost;
    state.fleet[id] = survived;
    playerResults.push({
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
    });
  });

  homeDefIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research, state.defense);
    const sent = state.defense[id] || 0;
    const survived = result.survivorsA[id] || 0;
    const destroyed = sent - survived;
    if (destroyed > 0) anyDefLoss = true;
    losses[id] = destroyed;
    const repaired = Math.floor(destroyed * DEFENSE_REPAIR_PERCENT);
    state.defense[id] = survived + repaired;
    playerResults.push({
      id,
      name: shipName(id),
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
    pushMessage(
      state,
      'kampf',
      `${outcome} [${raidStrengthLabel}] (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium. (Container: ${containerReward === 'gold' ? 'Gold' : 'Silber'})`,
      { sektorName: 'Heimatbasis', outcome, roundsFought: result.roundsFought, npcResults, playerResults }
    );
  } else {
    const outcome = 'Piratenüberfall abgewehrt – alle Feinde vernichtet';
    pushMessage(
      state,
      'kampf',
      `${outcome} [${raidStrengthLabel}] (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Ressourcen sicher. (Container: ${containerReward === 'gold' ? 'Gold' : 'Silber'})`,
      { sektorName: 'Heimatbasis', outcome, roundsFought: result.roundsFought, npcResults, playerResults }
    );
  }

  state.raid = null;
}
