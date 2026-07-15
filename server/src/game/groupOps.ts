import { getUserById, getGroupOperationJson, saveGroupOperationJson, listGroupOperationsJson, deleteGroupOperation } from '../db.js';
import { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import { EVENT_NAMES, ALLY_STATS, MISSION_TRAVEL_MS, MISSION_DURATION_MS } from './data/economy.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  combatFleetPower,
  generatePiratenFleet,
  generateFallbackFleet,
  generateDefenseFleet,
} from './combat.js';
import type { OwnedFleetContribution } from './combat.js';
import { runMultiOwnerCombatInWorker } from './combatRunner.js';
import { pushMessage } from './messages.js';
import { loadPlayerState, savePlayerState } from './state.js';
import type { ActionResult } from './actions.js';
import type { CombatUnitResult, CombatDetail, FarmDetail, GroupOperation, GroupOperationParticipant, PlayerState } from './types.js';

function rollMultiplier(options: number[]): number {
  return options[Math.floor(Math.random() * options.length)];
}
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function newId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function loadOp(id: string): GroupOperation | undefined {
  const json = getGroupOperationJson(id);
  return json ? (JSON.parse(json) as GroupOperation) : undefined;
}
function saveOp(op: GroupOperation) {
  saveGroupOperationJson(op.id, op.creatorId, op.status, JSON.stringify(op));
}

function addContainerToState(state: PlayerState, tier: 'silber' | 'gold') {
  state.inventory.push({ id: newId('container'), tier, receivedAt: Date.now() });
}

// ========== ERSTELLEN / EINLADEN ==========

export function createGroupOperation(
  state: PlayerState,
  kind: 'expedition' | 'event',
  sektorId: string | undefined,
  ships: Record<string, number>,
  inviteUserIds: number[]
): ActionResult {
  if (kind === 'expedition') {
    if (sektorId !== 'piraten_elite') {
      return { ok: false, error: 'Gemeinsame Expeditionen sind nur im Sektor P9 – Elite-Bollwerk möglich.' };
    }
  }
  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  const invitees = inviteUserIds.filter((id) => id !== state.userId);
  for (const uid of invitees) {
    if (!getUserById(uid)) return { ok: false, error: 'Ein eingeladener Spieler existiert nicht.' };
  }

  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) state.fleet[id] -= qty;
  });

  const me = getUserById(state.userId)!;
  const participants: GroupOperationParticipant[] = [
    { userId: state.userId, username: me.username, isCreator: true, status: 'accepted', ships },
    ...invitees.map((uid) => ({
      userId: uid,
      username: getUserById(uid)!.username,
      isCreator: false,
      status: 'pending' as const,
      ships: {},
    })),
  ];

  const op: GroupOperation = {
    id: newId('groupop'),
    kind,
    sektorId: kind === 'expedition' ? sektorId : undefined,
    eventName: kind === 'event' ? pickRandom(EVENT_NAMES) : undefined,
    creatorId: state.userId,
    status: 'inviting',
    participants,
    createdAt: Date.now(),
  };
  saveOp(op);
  return { ok: true };
}

// ========== AUFLISTEN ==========

export function listMyGroupOperations(userId: number): GroupOperation[] {
  return listGroupOperationsJson()
    .map((j) => JSON.parse(j) as GroupOperation)
    .filter((op) => op.creatorId === userId || op.participants.some((p) => p.userId === userId))
    // Abgeschlossene ("resolved") und abgebrochene ("cancelled") Operationen bleiben hier nicht
    // dauerhaft stehen - das Ergebnis wurde bereits als Nachricht zugestellt (Nachrichten-Tab).
    // Sonst wuerde "Meine Operationen" nach jeder gemeinsamen Mission fuer immer vollgemuellt.
    .filter((op) => op.status === 'inviting' || op.status === 'departed')
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ========== EINLADUNG ANNEHMEN / ABLEHNEN ==========

export function respondToGroupOperation(state: PlayerState, opId: string, accept: boolean, ships: Record<string, number>): ActionResult {
  const op = loadOp(opId);
  if (!op) return { ok: false, error: 'Operation nicht gefunden.' };
  if (op.status !== 'inviting') return { ok: false, error: 'Diese Operation läuft schon oder ist beendet.' };
  const me = op.participants.find((p) => p.userId === state.userId);
  if (!me) return { ok: false, error: 'Du bist zu dieser Operation nicht eingeladen.' };
  if (me.status !== 'pending') return { ok: false, error: 'Du hast bereits geantwortet.' };

  if (!accept) {
    me.status = 'declined';
    saveOp(op);
    return { ok: true };
  }

  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) state.fleet[id] -= qty;
  });
  me.status = 'accepted';
  me.ships = ships;
  saveOp(op);
  return { ok: true };
}

// ========== ABBRECHEN (nur Ersteller, nur waehrend "inviting") ==========

export function cancelGroupOperation(state: PlayerState, opId: string): ActionResult {
  const op = loadOp(opId);
  if (!op) return { ok: false, error: 'Operation nicht gefunden.' };
  if (op.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann abbrechen.' };
  if (op.status !== 'inviting') return { ok: false, error: 'Kann nur vor dem Start abgebrochen werden.' };

  op.participants
    .filter((p) => p.status === 'accepted')
    .forEach((p) => {
      const pState = p.userId === state.userId ? state : loadPlayerState(p.userId);
      Object.entries(p.ships).forEach(([id, qty]) => {
        pState.fleet[id] = (pState.fleet[id] || 0) + qty;
      });
      if (p.userId !== state.userId) savePlayerState(pState);
    });
  deleteGroupOperation(op.id);
  return { ok: true };
}

// ========== STARTEN ==========

function contributionsFromParticipants(op: GroupOperation, participantStates: Map<number, PlayerState>): OwnedFleetContribution[] {
  return op.participants
    .filter((p) => p.status === 'accepted')
    .map((p) => {
      const pState = participantStates.get(p.userId)!;
      return { ownerKey: String(p.userId), ships: p.ships, research: pState.research };
    });
}

export async function startGroupOperation(state: PlayerState, opId: string): Promise<ActionResult> {
  const op = loadOp(opId);
  if (!op) return { ok: false, error: 'Operation nicht gefunden.' };
  if (op.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann starten.' };
  if (op.status !== 'inviting') return { ok: false, error: 'Diese Operation wurde bereits gestartet.' };

  const accepted = op.participants.filter((p) => p.status === 'accepted');
  const participantStates = new Map<number, PlayerState>();
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === state.userId ? state : loadPlayerState(p.userId)));

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    p.contributedPower = combatFleetPower(p.ships, pState.research) || 1;
    p.farmed = { metall: 0, kristall: 0, deuterium: 0 };
    p.teile = { waffen: 0, schild: 0, panzerung: 0 };
    p.dmFound = 0;
  });

  if (op.kind === 'event') {
    return await resolveGroupEvent(op, accepted, participantStates, state);
  }

  const now = Date.now();
  op.status = 'departed';
  op.departedAt = now;
  op.arriveTime = now + MISSION_TRAVEL_MS;
  op.endTime = op.arriveTime + MISSION_DURATION_MS;
  op.returnTime = op.endTime + MISSION_TRAVEL_MS;
  op.processedHours = 0;
  op.lastTick = null;
  saveOp(op);

  accepted.forEach((p) => {
    if (p.userId !== state.userId) {
      const pState = participantStates.get(p.userId)!;
      pushMessage(pState, 'farm', `Gemeinsame Expedition nach ${op.sektorId} gestartet - deine Flotte ist mit unterwegs.`);
      savePlayerState(pState);
    }
  });
  return { ok: true };
}

// ========== NOTRUF-EVENT (loest sofort auf, kein Zeitplan noetig) ==========

async function resolveGroupEvent(
  op: GroupOperation,
  accepted: GroupOperationParticipant[],
  participantStates: Map<number, PlayerState>,
  requesterState: PlayerState
): Promise<ActionResult> {
  const totalSentPower = accepted.reduce((sum, p) => sum + (p.contributedPower || 0), 0);
  const allyCount = Math.max(8, Math.round(totalSentPower / 18000));

  // Feindstaerke = exakt 100% der gesamten eingesetzten Flotten-Power, keine Zufalls-Schwankung mehr.
  const targetPower = totalSentPower;
  const npcShips = generateFallbackFleet(targetPower);
  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);

  const contributions: OwnedFleetContribution[] = contributionsFromParticipants(op, participantStates);
  contributions.push({ ownerKey: 'verbuendete', ships: { verbuendete: allyCount }, useAllyStats: true });

  const research = participantStates.get(op.creatorId)!.research;
  const result = await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcShips, research });

  const playerResults: CombatUnitResult[] = [];
  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    Object.entries(p.ships).forEach(([id, sent]) => {
      const survived = result.survivorsByOwner[String(p.userId)]?.[id] || 0;
      const lost = sent - survived;
      pState.fleet[id] = (pState.fleet[id] || 0) + survived;
      const eff = getEffectiveStats(id, pState.research);
      const statKey = `${p.userId}:${id}`;
      playerResults.push({
        id,
        name: shipName(id),
        ownerUsername: p.username,
        sent,
        survived,
        lost,
        waffen: Math.round(eff.waffen),
        schild: Math.round(eff.schild),
        panzerung: Math.round(eff.panzerung),
        dmgTaken: Math.round(result.dmgTakenA[statKey] || 0),
        shotsFired: result.shotsA.shotsFired[statKey] || 0,
        hits: result.shotsA.hits[statKey] || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0),
        shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      });
    });
  });

  const allySurvived = result.survivorsByOwner['verbuendete']?.verbuendete || 0;
  const allyResult: CombatUnitResult = {
    id: 'verbuendete',
    name: 'Verbündete Flotte',
    sent: allyCount,
    survived: allySurvived,
    lost: allyCount - allySurvived,
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

  const npcFullyDestroyed = npcIds.every((id) => result.survivorsB[id] <= 0);
  const playerWiped = accepted.every((p) => Object.keys(p.ships).every((id) => (result.survivorsByOwner[String(p.userId)]?.[id] || 0) <= 0));
  const outcome = result.retreated
    ? 'Rückzug nach hohen Verlusten – Flotten rechtzeitig abgesetzt'
    : playerWiped || !npcFullyDestroyed
    ? 'Rückzug – Notruf gescheitert'
    : 'Notruf erfolgreich – Gemeinsam geholfen';

  let containerReward: 'silber' | 'gold' | null = null;
  if (!playerWiped && npcFullyDestroyed) containerReward = 'gold';
  else if (!playerWiped && !npcFullyDestroyed) containerReward = 'silber';
  if (containerReward) {
    accepted.forEach((p) => addContainerToState(participantStates.get(p.userId)!, containerReward!));
  }
  const rewardText = containerReward
    ? containerReward === 'gold'
      ? '🏆 Jeder Teilnehmer erhält einen Gold-Container'
      : '📦 Jeder Teilnehmer erhält einen Silber-Container'
    : '';
  const teilnehmerListe = accepted.map((p) => p.username).join(', ');

  const detail: CombatDetail = {
    sektorName: `${op.eventName} (gemeinsam: ${teilnehmerListe})`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
    allyResult,
    rewards: containerReward ? { containerTier: containerReward } : undefined,
  };
  const messageText = `${op.eventName} (gemeinsam mit ${teilnehmerListe}): ${outcome} (${result.roundsFought} Runden). ${rewardText}`;

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    pushMessage(pState, 'kampf', messageText, detail);
    if (p.userId !== requesterState.userId) savePlayerState(pState);
  });

  op.status = 'resolved';
  op.resultMessage = messageText;
  op.resultDetail = detail;
  saveOp(op);

  return { ok: true };
}

// ========== EXPEDITIONS-FORTSCHRITT (wird aus jedem Teilnehmer-tick() heraus aufgerufen) ==========

export async function processGroupOperationsForUser(currentState: PlayerState): Promise<void> {
  const ops = listGroupOperationsJson()
    .map((j) => JSON.parse(j) as GroupOperation)
    .filter(
      (op) => op.kind === 'expedition' && op.status === 'departed' && op.participants.some((p) => p.userId === currentState.userId && p.status === 'accepted')
    );

  for (const op of ops) {
    await tickGroupExpedition(op, currentState);
  }
}

async function tickGroupExpedition(op: GroupOperation, currentState: PlayerState): Promise<void> {
  const now = Date.now();
  if (!op.arriveTime || !op.endTime || !op.returnTime) return;
  if (now < op.arriveTime) return;

  const accepted = op.participants.filter((p) => p.status === 'accepted');
  const participantStates = new Map<number, PlayerState>();
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === currentState.userId ? currentState : loadPlayerState(p.userId)));

  const cfg = SEKTOR_CONFIG[op.sektorId!];
  const cappedNow = Math.min(now, op.endTime);
  if (!op.lastTick) op.lastTick = op.arriveTime;
  if (cappedNow > op.lastTick && cfg) {
    const deltaSec = (cappedNow - op.lastTick) / 1000;
    accepted.forEach((p) => {
      if (cfg.teileCap && p.teile) {
        (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
          if (p.teile![part] < cfg.teileCap!) {
            const rate = cfg.teileCap! / (MISSION_DURATION_MS / 1000);
            p.teile![part] = Math.min(cfg.teileCap!, p.teile![part] + rate * deltaSec);
          }
        });
      }
      if (cfg.resourceCapOverTime && p.farmed) {
        const cap = cfg.resourceCapOverTime;
        const totalRate = (cap.metall + cap.kristall + cap.deuterium) / (MISSION_DURATION_MS / 1000);
        const totalSoFar = p.farmed.metall + p.farmed.kristall + p.farmed.deuterium;
        const totalCap = cap.metall + cap.kristall + cap.deuterium;
        if (totalSoFar < totalCap) {
          const gain = Math.min(totalCap - totalSoFar, totalRate * deltaSec);
          p.farmed.metall += gain * (cap.metall / totalCap);
          p.farmed.kristall += gain * (cap.kristall / totalCap);
          p.farmed.deuterium += gain * (cap.deuterium / totalCap);
        }
      }
    });
    op.lastTick = cappedNow;
  }

  const hoursElapsed = Math.min(4, Math.floor((cappedNow - op.arriveTime) / 3600000));
  while ((op.processedHours || 0) < hoursElapsed) {
    op.processedHours = (op.processedHours || 0) + 1;
    await runGroupHourlyCheck(op, accepted, participantStates);
    accepted.forEach((p) => {
      if (p.userId !== currentState.userId) savePlayerState(participantStates.get(p.userId)!);
    });
    const anyoneAlive = accepted.some((p) => Object.values(p.ships).some((c) => c > 0));
    if (!anyoneAlive) {
      accepted.forEach((p) => {
        const pState = participantStates.get(p.userId)!;
        pushMessage(pState, 'kampf', `Gemeinsame Expedition (${op.sektorId}): Flotte vollständig vernichtet. Keine Ressourcen geborgen.`);
      });
      op.status = 'resolved';
      saveOp(op);
      accepted.forEach((p) => {
        if (p.userId !== currentState.userId) savePlayerState(participantStates.get(p.userId)!);
      });
      return;
    }
  }

  if (now >= op.returnTime) {
    finalizeGroupExpedition(op, accepted, participantStates, currentState.userId);
  } else {
    saveOp(op);
  }
}

async function runGroupHourlyCheck(op: GroupOperation, accepted: GroupOperationParticipant[], participantStates: Map<number, PlayerState>): Promise<void> {
  const cfg = SEKTOR_CONFIG[op.sektorId!];
  if (!cfg) return;
  if (Math.random() >= cfg.checkChance) return;

  const totalSentPower = accepted.reduce((sum, p) => {
    const pState = participantStates.get(p.userId)!;
    return sum + combatFleetPower(p.ships, pState.research);
  }, 0);

  const table = PIRATEN_MULTIPLIER_ROLL[op.sektorId!];
  const rolledMultiplier = rollMultiplier(table);
  const targetPower = Math.max(totalSentPower * rolledMultiplier, cfg.npcFloor || 0);

  const spionageMax = Math.max(...accepted.map((p) => participantStates.get(p.userId)!.research.spionage || 0));
  const npcShips = generatePiratenFleet(targetPower, spionageMax);
  const defenseFactor =
    op.sektorId === 'piraten_niedrig' ? 0.05 : op.sektorId === 'piraten_mittel' ? 0.1 : op.sektorId === 'piraten_elite' ? 0.2 : 0.15;
  let npcDefenses = generateDefenseFleet(totalSentPower * defenseFactor, spionageMax);

  const captainSpawned = cfg.captainChance && Math.random() < cfg.captainChance;
  if (captainSpawned) {
    npcDefenses = { ...npcDefenses, piratenkapitan: 1 };
  }

  const npcCombined = { ...npcShips, ...npcDefenses };
  if (Object.keys(npcCombined).length === 0) return;

  const contributions = contributionsFromParticipants(op, participantStates);
  const research = participantStates.get(op.creatorId)!.research;
  const result = await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcCombined, research });

  let anyNpcDestroyed = false;
  const npcResults: CombatUnitResult[] = Object.keys(npcCombined).map((id) => {
    const base = baseStats(id);
    const sent = npcCombined[id];
    const survivedCount = result.survivorsB[id] || 0;
    if (survivedCount < sent) anyNpcDestroyed = true;
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
      isCaptain: id === 'piratenkapitan',
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  const playerResults: CombatUnitResult[] = [];
  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    Object.entries(p.ships).forEach(([id, sent]) => {
      if (sent <= 0) return;
      const survived = result.survivorsByOwner[String(p.userId)]?.[id] || 0;
      const eff = getEffectiveStats(id, pState.research);
      const statKey = `${p.userId}:${id}`;
      playerResults.push({
        id,
        name: shipName(id),
        ownerUsername: p.username,
        sent,
        survived,
        lost: sent - survived,
        waffen: Math.round(eff.waffen),
        schild: Math.round(eff.schild),
        panzerung: Math.round(eff.panzerung),
        dmgTaken: Math.round(result.dmgTakenA[statKey] || 0),
        shotsFired: result.shotsA.shotsFired[statKey] || 0,
        hits: result.shotsA.hits[statKey] || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0),
        shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      });
      p.ships[id] = survived;
    });
  });

  let teileGainText = '';
  if (anyNpcDestroyed && cfg.teileCap) {
    const outcomeShare = 0.1;
    accepted.forEach((p) => {
      if (!p.teile) return;
      (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
        p.teile![part] = Math.min(cfg.teileCap!, p.teile![part] + cfg.teileCap! * outcomeShare);
      });
    });
    teileGainText = ' Jeder Teilnehmer erhält den vollen Teile-Bonus.';
  }
  let lootText = '';
  if (anyNpcDestroyed && cfg.lootBase) {
    accepted.forEach((p) => {
      if (!p.farmed) return;
      p.farmed.metall += cfg.lootBase!.metall;
      p.farmed.kristall += cfg.lootBase!.kristall;
      p.farmed.deuterium += cfg.lootBase!.deuterium;
    });
    lootText = ` Jeder Teilnehmer erbeutet ${cfg.lootBase.metall.toLocaleString('de-DE')} Metall, ${cfg.lootBase.kristall.toLocaleString(
      'de-DE'
    )} Kristall, ${cfg.lootBase.deuterium.toLocaleString('de-DE')} Deuterium.`;
  }

  const captainResult = npcResults.find((r) => r.isCaptain);
  let captainText = '';
  if (captainResult) {
    if (captainResult.destroyed) {
      accepted.forEach((p) => addContainerToState(participantStates.get(p.userId)!, cfg.captainContainerTier!));
      accepted.forEach((p) => {
        if (p.dmFound !== undefined) p.dmFound += cfg.captainDm || 0;
      });
      captainText = ` Der Piratenkapitän wurde vernichtet! Jeder Teilnehmer erhält einen ${
        cfg.captainContainerTier === 'gold' ? 'Gold' : 'Silber'
      }-Container und ${cfg.captainDm} Dunkle Materie.`;
    } else {
      captainText = ' Der Piratenkapitän konnte fliehen.';
    }
  }

  const teilnehmerListe = accepted.map((p) => p.username).join(', ');
  const outcome = result.retreated
    ? 'Rückzug nach hohen Verlusten – Flotten rechtzeitig abgesetzt'
    : anyNpcDestroyed
    ? 'Feindkontakt - Piraten erlitten Verluste'
    : 'Feindkontakt - keine nennenswerte Wirkung';
  const messageText = `Gemeinsame Expedition ${op.sektorId} (mit ${teilnehmerListe}), Stunde ${op.processedHours}/4: ${outcome}.${lootText}${teileGainText}${captainText}`;
  const hasRewards = (anyNpcDestroyed && (cfg.lootBase || cfg.teileCap)) || captainResult?.destroyed;
  const detail: CombatDetail = {
    sektorName: `${op.sektorId} (gemeinsam: ${teilnehmerListe})`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
    rewards: hasRewards
      ? {
          metall: anyNpcDestroyed && cfg.lootBase ? cfg.lootBase.metall : undefined,
          kristall: anyNpcDestroyed && cfg.lootBase ? cfg.lootBase.kristall : undefined,
          deuterium: anyNpcDestroyed && cfg.lootBase ? cfg.lootBase.deuterium : undefined,
          teileWaffen: anyNpcDestroyed && cfg.teileCap ? Math.round(cfg.teileCap * 0.1) : undefined,
          teileSchild: anyNpcDestroyed && cfg.teileCap ? Math.round(cfg.teileCap * 0.1) : undefined,
          teilePanzerung: anyNpcDestroyed && cfg.teileCap ? Math.round(cfg.teileCap * 0.1) : undefined,
          containerTier: captainResult?.destroyed ? cfg.captainContainerTier : undefined,
          dm: captainResult?.destroyed ? cfg.captainDm : undefined,
        }
      : undefined,
  };

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    pushMessage(pState, 'kampf', messageText, detail);
  });
}

function finalizeGroupExpedition(
  op: GroupOperation,
  accepted: GroupOperationParticipant[],
  participantStates: Map<number, PlayerState>,
  currentUserId: number
): void {
  const teilnehmerListe = accepted.map((p) => p.username).join(', ');

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;

    Object.entries(p.ships).forEach(([id, count]) => {
      if (count > 0) pState.fleet[id] = (pState.fleet[id] || 0) + count;
    });

    const farmed = p.farmed || { metall: 0, kristall: 0, deuterium: 0 };
    const gainedMetall = Math.floor(farmed.metall);
    const gainedKristall = Math.floor(farmed.kristall);
    const gainedDeut = Math.floor(farmed.deuterium);
    pState.resources.metall += gainedMetall;
    pState.resources.kristall += gainedKristall;
    pState.resources.deuterium += gainedDeut;
    pState.resources.dm += Math.floor(p.dmFound || 0);

    const teile = p.teile || { waffen: 0, schild: 0, panzerung: 0 };
    const gainedWaffen = Math.floor(teile.waffen);
    const gainedSchild = Math.floor(teile.schild);
    const gainedPanzerung = Math.floor(teile.panzerung);
    pState.teile.waffen += gainedWaffen;
    pState.teile.schild += gainedSchild;
    pState.teile.panzerung += gainedPanzerung;

    pushMessage(
      pState,
      'farm',
      `Gemeinsame Expedition ${op.sektorId} (mit ${teilnehmerListe}) zurückgekehrt.`,
      {
        sektorName: `${op.sektorId} (gemeinsam: ${teilnehmerListe})`,
        resources: { metall: gainedMetall, kristall: gainedKristall, deuterium: gainedDeut },
        dm: Math.floor(p.dmFound || 0),
        teile: { waffen: gainedWaffen, schild: gainedSchild, panzerung: gainedPanzerung },
        fleetReturned: { ...p.ships },
      }
    );
    if (p.userId !== currentUserId) savePlayerState(pState);
  });

  op.status = 'resolved';
  saveOp(op);
}
