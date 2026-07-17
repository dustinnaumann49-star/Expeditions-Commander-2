import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import {
  MISSION_TRAVEL_MS,
  MISSION_DURATION_MS,
  ASTEROID_MISSION_DURATION_MS,
  ASTEROID_ESCORT_POWER_MIN,
  ASTEROID_ESCORT_POWER_MAX,
  ASTEROID_ESCORT_KILL_REWARD,
  COMBAT_SHIP_IDS,
  getEscalationMultiplier,
} from './data/economy.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  combatFleetPowerBase,
  generatePiratenFleet,
  generateFallbackFleet,
  generateDefenseFleet,
  generateAsteroidPirateFleet,
  pickWaveProfile,
  rollMultiplierWithOutlier,
  rollBattleModifier,
} from './combat.js';
import { pushMessage } from './messages.js';
import { runCombatInWorker } from './combatRunner.js';
import type { ActionResult } from './actions.js';
import type { BattleModifierType } from './data/combatConstants.js';
import { BATTLE_MODIFIER_LABELS } from './data/combatConstants.js';
import type { CombatUnitResult, ContainerTier, FarmDetail, Mission, PlayerState } from './types.js';

function miningMultiplier(state: PlayerState): number {
  // RESEARCH[4] = "mining" (siehe data/research.ts) - 0.10 Effekt pro Stufe
  return 1 + (state.research.mining || 0) * 0.1;
}

// ========== FLOTTE ENTSENDEN ==========

export function availableFleetForSektor(sektorId: string): string[] {
  const cfg = SEKTOR_CONFIG[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

export function sendFleet(state: PlayerState, sektorId: string, selection: Record<string, number>): ActionResult {
  const totalSelected = Object.values(selection).reduce((a, b) => a + (b || 0), 0);
  if (totalSelected === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  if (state.missions.some((m) => m.sektorId === sektorId && !m.finalized)) {
    return { ok: false, error: 'In diesem Sektor ist bereits eine Flotte unterwegs.' };
  }
  const cfg = SEKTOR_CONFIG[sektorId];
  if (!cfg) return { ok: false, error: 'Unbekannter Sektor.' };
  if (cfg.multiplayerOnly) {
    return { ok: false, error: 'Dieser Sektor ist nur über gemeinsame Expeditionen mit anderen Spielern erreichbar (siehe Multiplayer-Tab).' };
  }
  if (cfg.miningCap && (selection.mining || 0) > cfg.miningCap) {
    return { ok: false, error: `Maximal ${cfg.miningCap} Mining-Schiffe pro Einsatz in diesem Sektor erlaubt.` };
  }
  if (cfg.escortCap && (selection.begleitschiff || 0) > cfg.escortCap) {
    return { ok: false, error: `Maximal ${cfg.escortCap} Begleitschiffe pro Einsatz in diesem Sektor erlaubt.` };
  }

  const ships: Record<string, number> = {};
  for (const [id, qty] of Object.entries(selection)) {
    if (qty > 0) {
      if ((state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
      ships[id] = qty;
    }
  }
  Object.entries(ships).forEach(([id, qty]) => {
    state.fleet[id] -= qty;
  });

  const now = Date.now();
  const durationMs = cfg.type === 'asteroid' ? ASTEROID_MISSION_DURATION_MS : MISSION_DURATION_MS;
  const mission: Mission = {
    id: 'mission_' + now + '_' + sektorId,
    sektorId,
    ships,
    startTime: now,
    arriveTime: now + MISSION_TRAVEL_MS,
    endTime: now + MISSION_TRAVEL_MS + durationMs,
    returnTime: now + MISSION_TRAVEL_MS + durationMs + MISSION_TRAVEL_MS,
    processedHours: 0,
    lastTick: null,
    farmed: { metall: 0, kristall: 0, deuterium: 0 },
    dmFound: 0,
    teile: { waffen: 0, schild: 0, panzerung: 0 },
    sandronatorAlive: (ships.sandronator || 0) > 0,
    finalized: false,
  };
  state.missions.push(mission);
  return { ok: true };
}

export function recallMission(state: PlayerState, missionId: string): ActionResult {
  const mission = state.missions.find((m) => m.id === missionId && !m.finalized);
  if (!mission) return { ok: false, error: 'Mission nicht gefunden.' };
  const now = Date.now();
  if (now > mission.arriveTime) {
    const cappedNow = Math.min(now, mission.endTime);
    if (!mission.lastTick) mission.lastTick = mission.arriveTime;
    if (cappedNow > mission.lastTick) {
      accrueFarming(state, mission, (cappedNow - mission.lastTick) / 1000);
      mission.lastTick = cappedNow;
    }
  }
  finalizeMission(state, mission);
  state.missions = state.missions.filter((m) => !m.finalized);
  return { ok: true };
}

// ========== FARMEN (ASTEROIDEN-ERTRAG / TEILE-SAMMLUNG) ==========

function accrueFarming(state: PlayerState, mission: Mission, deltaSec: number) {
  const cfg = SEKTOR_CONFIG[mission.sektorId];
  if (deltaSec <= 0 || !cfg) return;
  const sandronatorBonus = mission.sandronatorAlive ? 2 : 1;

  if (cfg.type === 'asteroid' && cfg.farmRate) {
    const count = mission.ships.mining || 0;
    if (count > 0) {
      const total = (count * cfg.farmRate) / 3600 * deltaSec * miningMultiplier(state) * sandronatorBonus;
      mission.farmed.metall += total * 0.5;
      mission.farmed.kristall += total * 0.3;
      mission.farmed.deuterium += total * 0.2;
      if (cfg.dmCap && mission.dmFound < cfg.dmCap) {
        const durationMs = mission.endTime - mission.arriveTime;
        const rate = cfg.dmCap / (durationMs / 1000);
        mission.dmFound = Math.min(cfg.dmCap, mission.dmFound + rate * deltaSec);
      }
    }
  }

  if (cfg.type === 'piraten' && cfg.teileCap) {
    (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
      if (mission.teile[part] < cfg.teileCap!) {
        const rate = (cfg.teileCap! / (MISSION_DURATION_MS / 1000)) * sandronatorBonus;
        mission.teile[part] = Math.min(cfg.teileCap!, mission.teile[part] + rate * deltaSec);
      }
    });
  }
}

// ========== STUENDLICHER FEINDKONTAKT-CHECK ==========

async function runAsteroidEscortCheck(state: PlayerState, mission: Mission) {
  const escortCount = mission.ships.begleitschiff || 0;
  if (escortCount <= 0) return;

  const escortStats = baseStats('begleitschiff');
  const escortPower = escortCount * (escortStats.waffen + escortStats.schild + escortStats.panzerung);
  const powerShare = ASTEROID_ESCORT_POWER_MIN + Math.random() * (ASTEROID_ESCORT_POWER_MAX - ASTEROID_ESCORT_POWER_MIN);
  const targetPower = escortPower * powerShare;
  const npcShips = generateAsteroidPirateFleet(targetPower);
  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
  if (npcIds.length === 0) {
    // Kein Feindkontakt in dieser Stunde - keine Zwischen-Nachricht mehr, wird im
    // Abschlussbericht implizit durch die Anzahl der Skirmish-Eintraege sichtbar (weniger
    // Eintraege als moegliche Stunden = ruhige Stunden dabei).
    return;
  }

  const defenderShips = { begleitschiff: escortCount };
  const result = await runCombatInWorker({ sideAShips: defenderShips, sideBShips: npcShips, research: state.research });

  const survivedEscorts = result.survivorsA.begleitschiff || 0;
  const lostEscorts = escortCount - survivedEscorts;
  mission.ships.begleitschiff = survivedEscorts;

  let destroyedTotal = 0;
  const npcLossText =
    npcIds
      .map((id) => {
        const sent = npcShips[id];
        const survived = result.survivorsB[id] || 0;
        const destroyed = sent - survived;
        destroyedTotal += destroyed;
        return destroyed > 0 ? `${shipName(id)} x${destroyed}` : null;
      })
      .filter(Boolean)
      .join(', ') || 'keine';

  const reward = {
    metall: destroyedTotal * ASTEROID_ESCORT_KILL_REWARD.metall,
    kristall: destroyedTotal * ASTEROID_ESCORT_KILL_REWARD.kristall,
    deuterium: destroyedTotal * ASTEROID_ESCORT_KILL_REWARD.deuterium,
  };
  mission.farmed.metall += reward.metall;
  mission.farmed.kristall += reward.kristall;
  mission.farmed.deuterium += reward.deuterium;

  const outcome =
    destroyedTotal > 0 && lostEscorts === 0
      ? 'Piratenüberfall abgewehrt'
      : destroyedTotal > 0
      ? 'Piratenüberfall abgewehrt mit Verlusten'
      : 'Piraten vertrieben, keine Vernichtung';
  const lossText = lostEscorts > 0 ? `Begleitschiff x${lostEscorts}` : 'keine';
  const rewardText =
    destroyedTotal > 0
      ? ` Bonus-Beute (pro vernichtetem Piratenschiff): ${reward.metall.toLocaleString('de-DE')} Metall, ${reward.kristall.toLocaleString(
          'de-DE'
        )} Kristall, ${reward.deuterium.toLocaleString('de-DE')} Deuterium - wird bei Rückkehr gutgeschrieben.`
      : '';

  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcShips[id];
    const survived = result.survivorsB[id] || 0;
    return {
      id,
      name: shipName(id),
      count: sent,
      waffen: Math.round(base.waffen),
      schild: Math.round(base.schild),
      panzerung: Math.round(base.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0),
      destroyedCount: sent - survived,
      survivedCount: survived,
      destroyed: survived <= 0,
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  if (!mission.skirmishLog) mission.skirmishLog = [];
  mission.skirmishLog.push({
    hour: mission.processedHours,
    outcome: `${outcome}. Eigene Verluste: ${lossText}. Feindliche Verluste: ${npcLossText}.${rewardText}`,
    roundsFought: result.roundsFought,
    npcResults,
    replay: result.replay,
    rewards: destroyedTotal > 0 ? { metall: reward.metall, kristall: reward.kristall, deuterium: reward.deuterium } : undefined,
    playerResults: [
      {
        id: 'begleitschiff',
        name: 'Begleitschiff',
        sent: escortCount,
        waffen: Math.round(escortStats.waffen),
        schild: Math.round(escortStats.schild),
        panzerung: Math.round(escortStats.panzerung),
        dmgTaken: Math.round(result.dmgTakenA.begleitschiff || 0),
        lost: lostEscorts,
        survived: survivedEscorts,
        destroyed: survivedEscorts <= 0,
        shotsFired: result.shotsA.shotsFired.begleitschiff || 0,
        hits: result.shotsA.hits.begleitschiff || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers.begleitschiff || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA.begleitschiff || 0),
        shieldRegen: Math.round(result.shieldRegenA.begleitschiff || 0),
      },
    ],
  });
}

async function runHourlyCheck(state: PlayerState, mission: Mission) {
  const cfg = SEKTOR_CONFIG[mission.sektorId];
  if (!cfg) return;

  if (cfg.type === 'asteroid') {
    await runAsteroidEscortCheck(state, mission);
    return;
  }

  if (Math.random() >= cfg.checkChance) {
    pushMessage(state, 'kampf', `Stunden-Check (Stufe ${mission.processedHours}/4) - kein Feindkontakt.`);
    return;
  }

  const playerIds = Object.keys(mission.ships).filter((id) => mission.ships[id] > 0);
  if (playerIds.length === 0) return;

  const sentPower = combatFleetPowerBase(mission.ships);
  // runHourlyCheck laeuft nur fuer Piraten-Sektoren (Asteroiden-Sektoren kehren weiter oben schon
  // frueher zurueck), daher wird hier IMMER die Wuerfel-Tabelle verwendet, kein Fallback noetig.
  const table = PIRATEN_MULTIPLIER_ROLL[mission.sektorId];
  const { multiplier: rolledMultiplier, outlier } = rollMultiplierWithOutlier(table, mission.sektorId);
  const waveLabel = outlier === 'stark' ? '⚠ Ungewöhnlich starke Welle' : outlier === 'schwach' ? 'Auffällig schwache Welle' : 'Normale Welle';
  const targetPower = Math.max(sentPower * rolledMultiplier, cfg.npcFloor || 0);
  const profile = pickWaveProfile(mission.sektorId);
  const battleModifier = rollBattleModifier(mission.sektorId);

  let npcShips: Record<string, number> = {};
  let npcDefenses: Record<string, number> = {};

  if (cfg.type === 'piraten') {
    npcShips = generatePiratenFleet(targetPower, state.research.spionage || 0, profile);
    let defenseFactor = 0;
    if (mission.sektorId === 'piraten_niedrig') defenseFactor = 0.05;
    else if (mission.sektorId === 'piraten_mittel') defenseFactor = 0.1;
    else if (mission.sektorId === 'piraten_hoch') defenseFactor = 0.15;
    npcDefenses = generateDefenseFleet(sentPower * defenseFactor, state.research.spionage || 0);
  } else {
    npcShips = generatePiratenFleet(targetPower, 0, profile) || generateFallbackFleet(targetPower, profile);
  }

  const captainSpawned = cfg.type === 'piraten' && cfg.captainChance && Math.random() < cfg.captainChance;
  if (captainSpawned) {
    npcDefenses = { ...npcDefenses, piratenkapitan: 1 };
  }

  const npcCombined = { ...npcShips, ...npcDefenses };
  const npcIds = Object.keys(npcCombined).filter((id) => npcCombined[id] > 0);

  if (npcIds.length === 0) {
    pushMessage(state, 'kampf', 'Feindkontakt. Keine nennenswerte Gegenwehr, kein Schaden.');
    return;
  }

  const result = await runCombatInWorker({ sideAShips: mission.ships, sideBShips: npcCombined, research: state.research, battleModifier });

  let anyNpcDestroyed = false;
  const npcLosses: Record<string, number> = {};
  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcCombined[id];
    const survivedCount = result.survivorsB[id];
    const destroyedCount = sent - survivedCount;
    if (destroyedCount > 0) anyNpcDestroyed = true;
    npcLosses[id] = destroyedCount;
    const isDefense = DEFENSES.some((d) => d.id === id);
    const isCaptain = id === 'piratenkapitan';
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
      isDefense,
      isCaptain,
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  let anyPlayerLoss = false;
  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = playerIds.map((id) => {
    const eff = getEffectiveStats(id, state.research);
    const sent = mission.ships[id];
    const survived = result.survivorsA[id];
    const lost = sent - survived;
    if (lost > 0) anyPlayerLoss = true;
    losses[id] = lost;
    mission.ships[id] = survived;
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

  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';
  const npcLossText =
    Object.entries(npcLosses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';
  const outcome = result.retreated
    ? 'Rückzug nach hohen Verlusten – Flotte hat sich rechtzeitig abgesetzt'
    : anyNpcDestroyed && !anyPlayerLoss
    ? 'Klarer Sieg'
    : anyNpcDestroyed
    ? 'Sieg mit Verlusten'
    : 'Verluste, Gegner überlebt';

  if (mission.sandronatorAlive && (mission.ships.sandronator || 0) <= 0) {
    mission.sandronatorAlive = false;
    pushMessage(state, 'kampf', 'Der Sandronator wurde zerstört. Der Ressourcen-Bonus (+100%) fällt für diese Mission weg.');
  }

  // Belohnungs-Eskalation: steigt mit jedem aufeinanderfolgenden Sieg innerhalb DERSELBEN Mission,
  // bricht bei einem Check ohne vernichteten Gegner auf 0 zurueck (siehe REWARD_ESCALATION in
  // economy.ts). Nutzt den Streak-Stand VOR diesem Check (Check 1 = 0 Vorsiege = kein Bonus).
  const streakBefore = mission.streakWins || 0;
  const escalationMultiplier = getEscalationMultiplier(mission.sektorId, streakBefore);
  mission.streakWins = anyNpcDestroyed ? streakBefore + 1 : 0;
  const escalationText = escalationMultiplier > 1 ? ` [Serie x${escalationMultiplier.toFixed(2)}]` : '';

  let teileText = '';
  let gainedTeile: { waffen: number; schild: number; panzerung: number } | undefined;
  if (cfg.type === 'piraten' && cfg.teileCap) {
    const sandronatorBonus = mission.sandronatorAlive ? 2 : 1;
    const outcomeShare = anyNpcDestroyed && !anyPlayerLoss ? 0.15 : anyNpcDestroyed ? 0.08 : 0.02;
    const gained: Record<string, number> = {};
    (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
      const amount = cfg.teileCap! * outcomeShare * sandronatorBonus * escalationMultiplier;
      const before = mission.teile[part];
      mission.teile[part] = Math.min(cfg.teileCap!, before + amount);
      gained[part] = Math.round(mission.teile[part] - before);
    });
    const gainedSum = gained.waffen + gained.schild + gained.panzerung;
    if (gainedSum > 0) {
      teileText = ` Zusätzliche Kampf-Teile geborgen: ${gained.waffen} Waffen, ${gained.schild} Schild, ${gained.panzerung} Panzerung.`;
      gainedTeile = { waffen: gained.waffen, schild: gained.schild, panzerung: gained.panzerung };
    }
  }

  let lootText = '';
  let lootGained: { metall: number; kristall: number; deuterium: number } | undefined;
  if (anyNpcDestroyed && cfg.lootBase) {
    const sandronatorBonus = mission.sandronatorAlive ? 2 : 1;
    const bonusHit = cfg.bonusLootChance ? Math.random() < cfg.bonusLootChance : false;
    const lootMultiplier = (bonusHit ? cfg.bonusLootMultiplier! : 1) * sandronatorBonus * escalationMultiplier;
    const loot = {
      metall: Math.round(cfg.lootBase.metall * lootMultiplier),
      kristall: Math.round(cfg.lootBase.kristall * lootMultiplier),
      deuterium: Math.round(cfg.lootBase.deuterium * lootMultiplier),
    };
    mission.farmed.metall += loot.metall;
    mission.farmed.kristall += loot.kristall;
    mission.farmed.deuterium += loot.deuterium;
    lootText = ` Beute geplündert${bonusHit ? ' (Volltreffer!)' : ''}${escalationText}: ${loot.metall.toLocaleString('de-DE')} Metall, ${loot.kristall.toLocaleString(
      'de-DE'
    )} Kristall, ${loot.deuterium.toLocaleString('de-DE')} Deuterium.`;
    lootGained = loot;
  }

  const captainResult = npcResults.find((r) => r.isCaptain);
  let captainText = '';
  let captainContainerTier: ContainerTier | undefined;
  let captainDmGained = 0;
  if (captainResult) {
    if (captainResult.destroyed) {
      addContainerToState(state, cfg.captainContainerTier!);
      mission.dmFound += cfg.captainDm || 0;
      const tierLabel = cfg.captainContainerTier === 'elite' ? 'Elite-Container' : cfg.captainContainerTier === 'gold' ? 'Gold-Container' : 'Silber-Container';
      captainText = ` Der Piratenkapitän wurde vernichtet! Ein ${tierLabel} und ${cfg.captainDm} Dunkle Materie wurden erbeutet.`;
      captainContainerTier = cfg.captainContainerTier;
      captainDmGained = cfg.captainDm || 0;
    } else {
      captainText = ' Der Piratenkapitän konnte fliehen.';
    }
  }

  const defenseCount = npcResults.filter((r) => r.isDefense && !r.isCaptain).length;
  const defenseText = defenseCount > 0 ? ` (${defenseCount} Verteidigungsanlagen)` : '';
  const waveText = waveLabel ? ` [${waveLabel}]` : '';
  const modifierText = battleModifier ? ` ${BATTLE_MODIFIER_LABELS[battleModifier]}.` : '';

  const hasRewards = lootGained || gainedTeile || captainContainerTier || captainDmGained > 0;
  pushMessage(
    state,
    'kampf',
    `Feindkontakt${waveText}${defenseText} (${result.roundsFought} Runde${result.roundsFought === 1 ? '' : 'n'}). Ergebnis: ${outcome}. Eigene Verluste: ${lossText}. Feindliche Verluste: ${npcLossText}.${teileText}${lootText}${captainText}${modifierText}`,
    {
      sektorName: mission.sektorId,
      outcome,
      roundsFought: result.roundsFought,
      npcResults,
      playerResults,
      replay: result.replay,
      rewards: hasRewards
        ? {
            metall: lootGained?.metall,
            kristall: lootGained?.kristall,
            deuterium: lootGained?.deuterium,
            teileWaffen: gainedTeile?.waffen,
            teileSchild: gainedTeile?.schild,
            teilePanzerung: gainedTeile?.panzerung,
            containerTier: captainContainerTier,
            dm: captainDmGained > 0 ? captainDmGained : undefined,
          }
        : undefined,
    }
  );
}

// Kleine, lokal gehaltene Hilfsfunktion, um einen Kreisimport mit inventory.ts zu vermeiden
// (Piratenkapitän-Belohnung fuegt einen Container direkt hinzu).
function addContainerToState(state: PlayerState, tier: ContainerTier) {
  state.inventory.push({
    id: 'container_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    tier,
    receivedAt: Date.now(),
  });
}

function abortMissionDestroyed(state: PlayerState, mission: Mission) {
  mission.finalized = true;
  pushMessage(
    state,
    'kampf',
    'Flotte vollständig vernichtet. Mission abgebrochen, keine Ressourcen geborgen.',
    mission.skirmishLog && mission.skirmishLog.length > 0
      ? {
          sektorName: mission.sektorId,
          outcome: 'Flotte vollständig vernichtet',
          roundsFought: 0,
          npcResults: [],
          playerResults: mission.skirmishLog.flatMap((s) => s.playerResults),
        }
      : undefined
  );
}

export function finalizeMission(state: PlayerState, mission: Mission) {
  mission.finalized = true;
  state.resources.metall += mission.farmed.metall;
  state.resources.kristall += mission.farmed.kristall;
  state.resources.deuterium += mission.farmed.deuterium;
  state.resources.dm += mission.dmFound;
  state.teile.waffen += Math.floor(mission.teile.waffen);
  state.teile.schild += Math.floor(mission.teile.schild);
  state.teile.panzerung += Math.floor(mission.teile.panzerung);
  Object.entries(mission.ships).forEach(([id, c]) => {
    if (c > 0) state.fleet[id] = (state.fleet[id] || 0) + c;
  });
  const detail: FarmDetail = {
    sektorName: mission.sektorId,
    resources: {
      metall: Math.floor(mission.farmed.metall),
      kristall: Math.floor(mission.farmed.kristall),
      deuterium: Math.floor(mission.farmed.deuterium),
    },
    dm: Math.floor(mission.dmFound),
    teile: {
      waffen: Math.floor(mission.teile.waffen),
      schild: Math.floor(mission.teile.schild),
      panzerung: Math.floor(mission.teile.panzerung),
    },
    fleetReturned: { ...mission.ships },
    skirmishes: mission.skirmishLog,
  };
  let skirmishText = '';
  if (mission.skirmishLog && mission.skirmishLog.length > 0) {
    const totalLost = mission.skirmishLog.reduce(
      (sum, s) => sum + s.playerResults.reduce((a, p) => a + (p.lost || 0), 0),
      0
    );
    const ruhigeStunden = mission.processedHours - mission.skirmishLog.length;
    skirmishText = ` Piraten-Kontakt in ${mission.skirmishLog.length} von ${mission.processedHours} Stunden (${ruhigeStunden > 0 ? `${ruhigeStunden} ruhig, ` : ''}insgesamt ${totalLost} Begleitschiff(e) verloren) - Details siehe unten.`;
  }
  pushMessage(state, 'farm', `Flotte aus ${mission.sektorId} zurückgekehrt.${skirmishText}`, detail);
}

function missionPhase(mission: Mission, now: number): 'anflug' | 'sektor' | 'rueckflug' {
  if (now < mission.arriveTime) return 'anflug';
  if (now < mission.endTime) return 'sektor';
  return 'rueckflug';
}

async function tickMission(state: PlayerState, mission: Mission, now: number) {
  if (mission.finalized) return;
  missionPhase(mission, now); // Phase aktuell nur fuers Frontend relevant, hier nur zur Vollstaendigkeit berechnet
  if (now < mission.arriveTime) return;
  const cappedNow = Math.min(now, mission.endTime);
  if (!mission.lastTick) mission.lastTick = mission.arriveTime;
  if (cappedNow > mission.lastTick) {
    accrueFarming(state, mission, (cappedNow - mission.lastTick) / 1000);
    mission.lastTick = cappedNow;
  }
  const maxHours = Math.round((mission.endTime - mission.arriveTime) / 3600000);
  const hoursElapsed = Math.min(maxHours, Math.floor((cappedNow - mission.arriveTime) / 3600000));
  while (mission.processedHours < hoursElapsed) {
    mission.processedHours++;
    const totalShips = Object.values(mission.ships).reduce((a, b) => a + b, 0);
    if (totalShips > 0) {
      await runHourlyCheck(state, mission);
      if (Object.values(mission.ships).reduce((a, b) => a + b, 0) === 0) {
        abortMissionDestroyed(state, mission);
        return;
      }
    }
  }
  if (now >= mission.returnTime) {
    finalizeMission(state, mission);
  }
}

export async function processMissions(state: PlayerState) {
  const now = Date.now();
  for (const m of state.missions) {
    await tickMission(state, m, now);
  }
  state.missions = state.missions.filter((m) => !m.finalized);
}
