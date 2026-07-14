import { getUserById, getGroupOperationJson, saveGroupOperationJson, listGroupOperationsJson, deleteGroupOperation } from '../db.js';
import { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import { EVENT_NAMES, EVENT_NPC_MULTIPLIER, EVENT_MULTIPLIER_ROLL, ALLY_STATS, MISSION_TRAVEL_MS, MISSION_DURATION_MS } from './data/economy.js';
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
import type { CombatUnitResult, CombatStats, GroupOperation, GroupOperationParticipant, PlayerState } from './types.js';

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

// ========== ERSTELLEN / EINLADEN ==========

export function createGroupOperation(
  state: PlayerState,
  kind: 'expedition' | 'event',
  sektorId: string | undefined,
  ships: Record<string, number>,
  inviteUserIds: number[]
): ActionResult {
  if (kind === 'expedition') {
    if (!sektorId || !sektorId.startsWith('piraten_')) {
      return { ok: false, error: 'Gemeinsame Expeditionen sind nur in Piraten-Sektoren möglich.' };
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
  op.farmed = { metall: 0, kristall: 0, deuterium: 0 };
  op.dmFound = 0;
  op.teile = { waffen: 0, schild: 0, panzerung: 0 };
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

  const eventMultiplier = rollMultiplier(EVENT_MULTIPLIER_ROLL);
  const targetPower = totalSentPower * EVENT_NPC_MULTIPLIER * eventMultiplier;
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
      playerResults.push({
        id,
        name: `${shipName(id)} (${p.username})`,
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
  const outcome = playerWiped || !npcFullyDestroyed ? 'Rückzug – Notruf gescheitert' : 'Notruf erfolgreich – Gemeinsam geholfen';

  let containerReward: 'silber' | 'gold' | null = null;
  if (!playerWiped && npcFullyDestroyed) containerReward = 'gold';
  else if (!playerWiped && !npcFullyDestroyed) containerReward = 'silber';
  const creatorState = participantStates.get(op.creatorId)!;
  if (containerReward) {
    creatorState.inventory.push({ id: newId('container'), tier: containerReward, receivedAt: Date.now() });
  }
  const rewardText = containerReward ? (containerReward === 'gold' ? '🏆 Gold-Container an den Ersteller' : '📦 Silber-Container an den Ersteller') : '';
  const teilnehmerListe = accepted.map((p) => p.username).join(', ');

  const detail = {
    sektorName: `${op.eventName} (gemeinsam: ${teilnehmerListe})`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
    allyResult,
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
  // Fuer den Nutzer, dessen eigener tick() gerade laeuft, das bereits geladene State-Objekt
  // wiederverwenden (nicht erneut aus der DB laden) - sonst wuerde die aeussere Route (routes.ts)
  // am Ende ihre eigene, inzwischen veraltete Kopie speichern und die hier vorgenommenen
  // Aenderungen (Ressourcen, Flotte, Nachrichten) wieder ueberschreiben.
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === currentState.userId ? currentState : loadPlayerState(p.userId)));

  const cappedNow = Math.min(now, op.endTime);
  if (!op.lastTick) op.lastTick = op.arriveTime;
  if (cappedNow > op.lastTick && op.teile) {
    const deltaSec = (cappedNow - op.lastTick) / 1000;
    const cfg = SEKTOR_CONFIG[op.sektorId!];
    if (cfg?.teileCap) {
      (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
        if (op.teile![part] < cfg.teileCap!) {
          const rate = cfg.teileCap! / (MISSION_DURATION_MS / 1000);
          op.teile![part] = Math.min(cfg.teileCap!, op.teile![part] + rate * deltaSec);
        }
      });
    }
    op.lastTick = cappedNow;
  }

  const hoursElapsed = Math.min(4, Math.floor((cappedNow - op.arriveTime) / 3600000));
  while ((op.processedHours || 0) < hoursElapsed) {
    op.processedHours = (op.processedHours || 0) + 1;
    await runGroupHourlyCheck(op, accepted, participantStates);
    // Zwischenstand fuer alle ANDEREN Teilnehmer sofort sichern (Nachrichten, ggf. Verluste),
    // damit nichts verloren geht, falls die Expedition noch nicht zurueckkehrt - der aktuelle
    // Nutzer wird ohnehin am Ende von der aeusseren Route gespeichert.
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
      // Nur die ANDEREN Teilnehmer hier speichern - der aktuelle Nutzer wird von der aeusseren
      // Route (routes.ts) ohnehin am Ende gespeichert (siehe Kommentar oben).
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
  const defenseFactor = op.sektorId === 'piraten_niedrig' ? 0.05 : op.sektorId === 'piraten_mittel' ? 0.1 : 0.15;
  const npcDefenses = generateDefenseFleet(totalSentPower * defenseFactor, spionageMax);
  const npcCombined = { ...npcShips, ...npcDefenses };
  if (Object.keys(npcCombined).length === 0) return;

  const contributions = contributionsFromParticipants(op, participantStates);
  const research = participantStates.get(op.creatorId)!.research;
  const result = await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcCombined, research });

  let anyNpcDestroyed = false;
  Object.keys(npcCombined).forEach((id) => {
    if ((result.survivorsB[id] || 0) < npcCombined[id]) anyNpcDestroyed = true;
  });

  accepted.forEach((p) => {
    Object.keys(p.ships).forEach((id) => {
      p.ships[id] = result.survivorsByOwner[String(p.userId)]?.[id] || 0;
    });
  });

  if (anyNpcDestroyed && cfg.teileCap && op.teile) {
    (['waffen', 'schild', 'panzerung'] as const).forEach((part) => {
      const amount = cfg.teileCap! * 0.1;
      op.teile![part] = Math.min(cfg.teileCap!, op.teile![part] + amount);
    });
  }
  if (anyNpcDestroyed && cfg.lootBase && op.farmed) {
    op.farmed.metall += cfg.lootBase.metall;
    op.farmed.kristall += cfg.lootBase.kristall;
    op.farmed.deuterium += cfg.lootBase.deuterium;
  }

  const teilnehmerListe = accepted.map((p) => p.username).join(', ');
  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    pushMessage(
      pState,
      'kampf',
      `Gemeinsame Expedition ${op.sektorId} (mit ${teilnehmerListe}), Stunde ${op.processedHours}/4: ${
        anyNpcDestroyed ? 'Feindkontakt, Piraten erlitten Verluste.' : 'Feindkontakt, aber keine nennenswerte Wirkung.'
      }`
    );
  });
}

function finalizeGroupExpedition(
  op: GroupOperation,
  accepted: GroupOperationParticipant[],
  participantStates: Map<number, PlayerState>,
  currentUserId: number
): void {
  const totalPower = accepted.reduce((sum, p) => sum + (p.contributedPower || 1), 0) || 1;
  const teilnehmerListe = accepted.map((p) => p.username).join(', ');

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    const share = (p.contributedPower || 1) / totalPower;

    Object.entries(p.ships).forEach(([id, count]) => {
      if (count > 0) pState.fleet[id] = (pState.fleet[id] || 0) + count;
    });

    const farmed = op.farmed || { metall: 0, kristall: 0, deuterium: 0 };
    const shareMetall = Math.floor(farmed.metall * share);
    const shareKristall = Math.floor(farmed.kristall * share);
    const shareDeut = Math.floor(farmed.deuterium * share);
    pState.resources.metall += shareMetall;
    pState.resources.kristall += shareKristall;
    pState.resources.deuterium += shareDeut;

    const teile = op.teile || { waffen: 0, schild: 0, panzerung: 0 };
    const shareWaffen = Math.floor(teile.waffen * share);
    const shareSchild = Math.floor(teile.schild * share);
    const sharePanzerung = Math.floor(teile.panzerung * share);
    pState.teile.waffen += shareWaffen;
    pState.teile.schild += shareSchild;
    pState.teile.panzerung += sharePanzerung;

    pushMessage(
      pState,
      'farm',
      `Gemeinsame Expedition ${op.sektorId} (mit ${teilnehmerListe}) zurückgekehrt. Dein Anteil (${Math.round(
        share * 100
      )}%): ${shareMetall.toLocaleString('de-DE')} Metall, ${shareKristall.toLocaleString('de-DE')} Kristall, ${shareDeut.toLocaleString(
        'de-DE'
      )} Deuterium, ${shareWaffen}/${shareSchild}/${sharePanzerung} Teile.`
    );
    // Der aktuelle Nutzer (dessen tick() das hier ausgeloest hat) wird von der aeusseren Route
    // gespeichert - hier erneut speichern wuerde nichts falsch machen, aber ist unnoetig. Alle
    // ANDEREN Teilnehmer muessen wir hier explizit speichern, sonst gehen ihre Aenderungen verloren.
    if (p.userId !== currentUserId) savePlayerState(pState);
  });

  op.status = 'resolved';
  saveOp(op);
}
