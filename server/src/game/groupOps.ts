import { getUserById, getGroupOperationJson, saveGroupOperationJson, listGroupOperationsJson, deleteGroupOperation } from '../db.js';
import { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import { MISSION_TRAVEL_MS, MISSION_DURATION_MS, getEscalationMultiplier } from './data/economy.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  combatFleetPowerBase,
  generatePiratenFleet,
  generateFallbackFleet,
  generateDefenseFleet,
  generateAdmiralEncounter,
  pickWaveProfile,
  rollMultiplierWithOutlier,
  rollBattleModifier,
} from './combat.js';
import type { OwnedFleetContribution } from './combat.js';
import { runMultiOwnerCombatInWorker } from './combatRunner.js';
import { pushMessage } from './messages.js';
import { addContainers } from './inventory.js';
import { isBoosterActive } from './boosterUtil.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { galaxyDistance, galaxyDurationMs, galaxyFleetSpeed } from './galaxy.js';
import {
  ADMIRAL_BOSS_ID,
  ADMIRAL_CHECK_INTERVAL_MS,
  ADMIRAL_TOTAL_CHECKS,
  ADMIRAL_ESCALATION_PER_CHECK,
  ADMIRAL_ALLOWED_SHIP_IDS,
  ADMIRAL_EXTRACTION_BASE,
  ADMIRAL_EXTRACTION_GROWTH_PER_CHECK,
  ADMIRAL_VICTORY_BONUS,
  ADMIRAL_VICTORY_DM,
  ADMIRAL_MULTIPLIER_ROLL,
} from './data/combatConstants.js';
import type { ActionResult } from './actions.js';
import { BATTLE_MODIFIER_LABELS } from './data/combatConstants.js';
import type { CombatUnitResult, CombatDetail, ContainerTier, FarmDetail, GroupOperation, GroupOperationParticipant, PlayerState } from './types.js';
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

// (siehe addContainers() in inventory.ts - Container stapeln sich jetzt statt einen neuen
// Einzeleintrag pro Stueck anzulegen)

// ========== ERSTELLEN / EINLADEN ==========

export function createGroupOperation(
  state: PlayerState,
  kind: 'expedition',
  sektorId: string | undefined,
  ships: Record<string, number>,
  inviteUserIds: number[]
): ActionResult {
  if (sektorId !== 'piraten_elite' && sektorId !== 'piraten_admiral') {
    return { ok: false, error: 'Gemeinsame Expeditionen sind nur im Sektor P9 – Elite-Bollwerk oder P10 – Piratenadmiral möglich.' };
  }
  const totalShips = Object.values(ships).reduce((a, b) => a + (b || 0), 0);
  if (totalShips === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0 && (state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
  }
  // Boss-Gefecht (Sektor P10): nur Kreuzer-Klasse und aufwaerts erlaubt - macht "wenige grosse
  // Schiffe" mechanisch zur Pflicht, nicht nur zur Empfehlung (siehe README Punkt 76).
  if (sektorId === 'piraten_admiral') {
    const disallowed = Object.entries(ships).find(([id, qty]) => qty > 0 && !ADMIRAL_ALLOWED_SHIP_IDS.includes(id));
    if (disallowed) {
      return { ok: false, error: `${shipName(disallowed[0])} ist im Piratenadmiral-Gefecht nicht erlaubt - nur Kreuzer-Klasse und größere Schiffe.` };
    }
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
    sektorId,
    creatorId: state.userId,
    creatorPosition: state.galaxyPosition,
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
  if (op.sektorId === 'piraten_admiral') {
    const disallowed = Object.entries(ships).find(([id, qty]) => qty > 0 && !ADMIRAL_ALLOWED_SHIP_IDS.includes(id));
    if (disallowed) {
      return { ok: false, error: `${shipName(disallowed[0])} ist im Piratenadmiral-Gefecht nicht erlaubt - nur Kreuzer-Klasse und größere Schiffe.` };
    }
  }
  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) state.fleet[id] -= qty;
  });
  me.status = 'accepted';
  me.ships = ships;

  // Rendezvous: die Flotte fliegt zuerst zum ERSTELLER (nicht direkt zum Ziel) - erst wenn ALLE
  // angenommenen Teilnehmer dort eingetroffen sind, kann der Ersteller gemeinsam weiterstarten
  // (siehe startGroupOperation()).
  const creatorState = op.creatorId === state.userId ? state : loadPlayerState(op.creatorId);
  if (creatorState.galaxyPosition && state.galaxyPosition) {
    const distance = galaxyDistance(state.galaxyPosition, creatorState.galaxyPosition);
    const speed = galaxyFleetSpeed(ships, state.research, state.playerClass, state.shipModules);
    const travelMs = galaxyDurationMs(distance, speed);
    me.rendezvousArrivalTime = Date.now() + (Number.isFinite(travelMs) ? travelMs : 0);
  } else {
    me.rendezvousArrivalTime = Date.now();
  }

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
      return {
        ownerKey: String(p.userId),
        ships: p.ships,
        research: pState.research,
        playerClass: pState.playerClass,
        kampfBoostActive: isBoosterActive(pState, 'kampf'),
        shipModules: pState.shipModules,
      };
    });
}

export async function startGroupOperation(state: PlayerState, opId: string): Promise<ActionResult> {
  const op = loadOp(opId);
  if (!op) return { ok: false, error: 'Operation nicht gefunden.' };
  if (op.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann starten.' };
  if (op.status !== 'inviting') return { ok: false, error: 'Diese Operation wurde bereits gestartet.' };

  const accepted = op.participants.filter((p) => p.status === 'accepted');

  // Rendezvous-Pflicht: ALLE angenommenen Flotten (ausser der des Erstellers selbst) muessen erst
  // physisch beim Ersteller eingetroffen sein, bevor gemeinsam weitergeflogen werden kann.
  const now = Date.now();
  const notArrived = accepted.filter((p) => !p.isCreator && (p.rendezvousArrivalTime === undefined || p.rendezvousArrivalTime > now));
  if (notArrived.length > 0) {
    const names = notArrived.map((p) => p.username).join(', ');
    return { ok: false, error: `Noch nicht alle Flotten eingetroffen (wartet auf: ${names}).` };
  }

  const participantStates = new Map<number, PlayerState>();
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === state.userId ? state : loadPlayerState(p.userId)));

  accepted.forEach((p) => {
    p.contributedPower = combatFleetPowerBase(p.ships) || 1;
    p.farmed = { metall: 0, kristall: 0, deuterium: 0 };
    p.teile = { waffen: 0, schild: 0, panzerung: 0 };
    p.dmFound = 0;
  });

  // Gemeinsamer Weiterflug vom ERSTELLER aus (alle Flotten sind ja jetzt dort vereint) zum
  // eigentlichen Ziel - echte, distanzabhaengige Flugzeit wie bei Solo-Sektor-Missionen, mit der
  // Geschwindigkeit des langsamsten Schiffs UEBER ALLE vereinten Flotten hinweg.
  const cfg = SEKTOR_CONFIG[op.sektorId!];
  const combinedShips: Record<string, number> = {};
  accepted.forEach((p) => {
    Object.entries(p.ships).forEach(([id, qty]) => {
      combinedShips[id] = (combinedShips[id] || 0) + qty;
    });
  });
  let travelMs = MISSION_TRAVEL_MS;
  if (cfg?.galaxyPosition && state.galaxyPosition) {
    const distance = galaxyDistance(state.galaxyPosition, cfg.galaxyPosition);
    const speed = galaxyFleetSpeed(combinedShips, state.research, state.playerClass, state.shipModules);
    const computed = galaxyDurationMs(distance, speed);
    if (Number.isFinite(computed)) travelMs = computed;
  }

  op.status = 'departed';
  op.departedAt = now;
  op.arriveTime = now + travelMs;
  if (op.sektorId === 'piraten_admiral') {
    // Boss-Gefecht (siehe README Punkt 76): eigener Ablauf statt des Stunden-Zeitfenster-Modells
    // - 10-Minuten-Checks, kein festes endTime/returnTime im Voraus (die Flotte fliegt erst beim
    // tatsaechlichen Ausgang - Abzug/Sieg/Niederlage - wieder heim, siehe tickAdminEncounter()).
    op.adminChecksElapsed = 0;
    op.adminNextCheckTime = op.arriveTime + ADMIRAL_CHECK_INTERVAL_MS;
    op.adminAwaitingDecision = false;
  } else {
    op.endTime = op.arriveTime + MISSION_DURATION_MS;
    op.returnTime = op.endTime + travelMs;
    op.processedHours = 0;
    op.lastTick = null;
  }
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

// ========== EXPEDITIONS-FORTSCHRITT ==========
// Wird bei JEDEM tick() irgendeines beliebigen Nutzers aufgerufen - nicht nur bei den eigentlichen
// Teilnehmern. Grund: Vorher liefen nur Expeditionen weiter, an denen der GERADE tickende Nutzer
// selbst teilnahm - waren alle Teilnehmer einer Expedition zwischenzeitlich offline, blieb ihr
// Fortschritt (Farming, Ankunft, Kampfausloesung) trotz verstreichender arriveTime/endTime komplett
// stehen, bis einer von ihnen zufaellig wieder online kam. tickGroupExpedition() behandelt
// Teilnehmer-Zustaende ohnehin schon korrekt (laedt/speichert jeden State einzeln, nutzt nur bei
// echter Teilnahme das schon geladene currentState-Objekt wieder, siehe README Punkt 4) - dadurch
// ist die Verallgemeinerung auf ALLE Expeditionen gefahrlos moeglich.
export async function processAllDepartedGroupOperations(currentState: PlayerState): Promise<void> {
  const ops = listGroupOperationsJson()
    .map((j) => JSON.parse(j) as GroupOperation)
    .filter((op) => op.kind === 'expedition' && op.status === 'departed');

  for (const op of ops) {
    // Fehler-Isolation PRO OPERATION - dasselbe Prinzip wie bei den anderen Cross-User-Sweeps
    // (raids.ts/events.ts/heartbeat.ts): ein Fehler bei einer Expedition soll nicht verhindern,
    // dass alle anderen laufenden Expeditionen weiter bearbeitet werden.
    try {
      await tickGroupExpedition(op, currentState);
    } catch (err) {
      console.error(`processAllDepartedGroupOperations: Fehler bei Operation ${op.id}:`, err);
    }
  }
}

// ========== BOSS-GEFECHT: PIRATENADMIRAL (Sektor P10, siehe README Punkt 76) ==========
// Eigenstaendiger Ablauf statt des Stunden-Zeitfenster-Modells unten: 10-Minuten-Checks, mit
// einer Rueckzugs-("Extraction")-Entscheidung nach jedem gewonnenen Check statt eines simplen
// Durchhalte-Timers. "Gewonnen" heisst hier: die eigene Flotte musste sich NICHT zurueckziehen
// (siehe RETREAT_THRESHOLD, combat.ts) - der bestehende Rueckzugs-Mechanismus dient als
// natuerliches Signal fuer "diesen Check verloren", OHNE dass die Flotte dabei vernichtet wird
// (siehe README-Vorgabe: bei einer Niederlage geht nur die UNGESICHERTE Beute verloren, nicht
// die Flotte selbst).

async function tickAdminEncounter(op: GroupOperation, currentState: PlayerState): Promise<void> {
  const now = Date.now();
  if (!op.arriveTime) return;
  if (now < op.arriveTime) return;
  if (op.status !== 'departed') return;
  if (op.adminAwaitingDecision) return; // pausiert, bis der Ersteller per respondAdminEncounter() entscheidet

  const accepted = op.participants.filter((p) => p.status === 'accepted');
  const participantStates = new Map<number, PlayerState>();
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === currentState.userId ? currentState : loadPlayerState(p.userId)));

  const checksElapsed = op.adminChecksElapsed || 0;
  if (checksElapsed >= ADMIRAL_TOTAL_CHECKS) return; // sollte durch finalizeAdminEncounter() bereits beendet worden sein

  if (!op.adminNextCheckTime || now < op.adminNextCheckTime) return;

  await runAdminCheck(op, accepted, participantStates, currentState.userId);

  accepted.forEach((p) => {
    if (p.userId !== currentState.userId) savePlayerState(participantStates.get(p.userId)!);
  });
}

async function runAdminCheck(
  op: GroupOperation,
  accepted: GroupOperationParticipant[],
  participantStates: Map<number, PlayerState>,
  currentUserId: number
): Promise<void> {
  const checksElapsed = op.adminChecksElapsed || 0;
  const totalSentPower = accepted.reduce((sum, p) => sum + (p.contributedPower || 0), 0);

  // Basis-Machtskalierung: 110-150% der eingesetzten Flottenstaerke (haerter als das
  // Elite-Bollwerk mit 105-135%, siehe ADMIRAL_MULTIPLIER_ROLL) - wird bei JEDEM Check neu
  // gewuerfelt (wie beim Bollwerk), plus die kompoundierende "Eskalierende Wut" obendrauf.
  const { multiplier: rolledMultiplier } = rollMultiplierWithOutlier(ADMIRAL_MULTIPLIER_ROLL, 'piraten_admiral');
  const escalationFactor = Math.pow(1 + ADMIRAL_ESCALATION_PER_CHECK, checksElapsed);
  const encounter = generateAdmiralEncounter(totalSentPower * rolledMultiplier * escalationFactor);

  const contributions = contributionsFromParticipants(op, participantStates);
  const research = participantStates.get(op.creatorId)!.research;
  const result = await runMultiOwnerCombatInWorker({
    contributions,
    sideBShips: encounter.npcShips,
    sideBStatsOverride: encounter.statsOverride,
    research,
    allowRetreat: true,
  });

  // Ueberlebende Schiffe sofort in die Teilnehmer-Flotten uebernehmen (auch bei einer laufenden,
  // noch nicht abgeschlossenen Begegnung) - vermeidet doppeltes Verrechnen, falls der naechste
  // Check erst viel spaeter (naechster tick()) verarbeitet wird.
  accepted.forEach((p) => {
    Object.keys(p.ships).forEach((id) => {
      const survived = result.survivorsByOwner[String(p.userId)]?.[id] || 0;
      p.ships[id] = survived;
    });
  });

  const bossDestroyed = (result.survivorsB[ADMIRAL_BOSS_ID] || 0) <= 0;
  const playerRetreated = !!result.retreated;

  if (bossDestroyed) {
    await finalizeAdminEncounter(op, accepted, participantStates, currentUserId, 'victory', checksElapsed + 1);
    return;
  }

  if (playerRetreated) {
    await finalizeAdminEncounter(op, accepted, participantStates, currentUserId, 'defeat', checksElapsed + 1);
    return;
  }

  // Check gewonnen (Flotte musste sich nicht zurueckziehen), Boss aber noch nicht besiegt -
  // Rueckzugs-Entscheidung faellig, bevor es (falls gewuenscht) weitergeht.
  op.adminChecksElapsed = checksElapsed + 1;
  op.adminAwaitingDecision = true;
  saveOp(op);

  const checkNr = op.adminChecksElapsed;
  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    pushMessage(
      pState,
      'kampf',
      `Piratenadmiral (Check ${checkNr}/${ADMIRAL_TOTAL_CHECKS}): Check überstanden, der Admiral kämpft weiter. Entscheidung nötig: Beute sichern und abziehen, oder weitermachen?`,
      { sektorName: 'Sektor P10 – Piratenadmiral', resources: { metall: 0, kristall: 0, deuterium: 0 }, dm: 0, teile: { waffen: 0, schild: 0, panzerung: 0 } }
    );
  });
}

// Rueckzugs-/Weitermachen-Entscheidung - nur der Ersteller kann entscheiden (analog zu
// startGroupOperation(), gemeinsame Belohnung ohne Aufteilung nach Flottenanteil, siehe Punkt 5).
export async function respondAdminEncounter(state: PlayerState, opId: string, action: 'extract' | 'continue'): Promise<ActionResult> {
  const op = loadOp(opId);
  if (!op) return { ok: false, error: 'Operation nicht gefunden.' };
  if (op.creatorId !== state.userId) return { ok: false, error: 'Nur der Ersteller kann entscheiden.' };
  if (op.sektorId !== 'piraten_admiral') return { ok: false, error: 'Diese Operation ist kein Boss-Gefecht.' };
  if (!op.adminAwaitingDecision) return { ok: false, error: 'Aktuell ist keine Entscheidung fällig.' };

  const accepted = op.participants.filter((p) => p.status === 'accepted');
  const participantStates = new Map<number, PlayerState>();
  accepted.forEach((p) => participantStates.set(p.userId, p.userId === state.userId ? state : loadPlayerState(p.userId)));

  if (action === 'extract') {
    await finalizeAdminEncounter(op, accepted, participantStates, state.userId, 'extracted', op.adminChecksElapsed || 0);
  } else {
    const checksElapsed = op.adminChecksElapsed || 0;
    if (checksElapsed >= ADMIRAL_TOTAL_CHECKS) {
      // Kein weiterer Check mehr moeglich (1 Stunde/6 Checks erreicht) - erzwungener Abzug.
      await finalizeAdminEncounter(op, accepted, participantStates, state.userId, 'extracted', checksElapsed);
    } else {
      op.adminAwaitingDecision = false;
      op.adminNextCheckTime = Date.now() + ADMIRAL_CHECK_INTERVAL_MS;
      saveOp(op);
    }
  }

  accepted.forEach((p) => {
    if (p.userId !== state.userId) savePlayerState(participantStates.get(p.userId)!);
  });
  return { ok: true };
}

async function finalizeAdminEncounter(
  op: GroupOperation,
  accepted: GroupOperationParticipant[],
  participantStates: Map<number, PlayerState>,
  currentUserId: number,
  outcome: 'victory' | 'defeat' | 'extracted',
  checksCompleted: number
): Promise<void> {
  op.adminChecksElapsed = checksCompleted; // fuer Konsistenz, auch wenn die Operation direkt danach 'resolved' wird
  let reward = { metall: 0, kristall: 0, deuterium: 0 };
  let dmReward = 0;
  let outcomeText: string;

  if (outcome === 'victory') {
    reward = { ...ADMIRAL_VICTORY_BONUS };
    dmReward = ADMIRAL_VICTORY_DM;
    outcomeText = `🏆 Piratenadmiral besiegt! Nach ${checksCompleted} Check(s) endgültig vernichtet - volle Siegprämie ausgezahlt.`;
  } else if (outcome === 'extracted') {
    if (checksCompleted > 0) {
      reward = {
        metall: ADMIRAL_EXTRACTION_BASE.metall + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.metall * (checksCompleted - 1),
        kristall: ADMIRAL_EXTRACTION_BASE.kristall + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.kristall * (checksCompleted - 1),
        deuterium: ADMIRAL_EXTRACTION_BASE.deuterium + ADMIRAL_EXTRACTION_GROWTH_PER_CHECK.deuterium * (checksCompleted - 1),
      };
    }
    outcomeText =
      checksCompleted > 0
        ? `Rückzug nach ${checksCompleted} überstandenem(n) Check(s) - Beute gesichert und mit nach Hause gebracht.`
        : 'Rückzug ohne einen einzigen überstandenen Check - keine Beute gesichert.';
  } else {
    outcomeText = `Rückzug nach hohen Verlusten im Check ${checksCompleted}/${ADMIRAL_TOTAL_CHECKS} - die noch ungesicherte Beute dieses Durchlaufs ist verloren, die Flotte kehrt aber zurück.`;
  }

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    Object.entries(p.ships).forEach(([id, count]) => {
      if (count > 0) pState.fleet[id] = (pState.fleet[id] || 0) + count;
    });
    pState.resources.metall += Math.floor(reward.metall);
    pState.resources.kristall += Math.floor(reward.kristall);
    pState.resources.deuterium += Math.floor(reward.deuterium);
    pState.resources.dm += dmReward;
    pushMessage(pState, 'kampf', `Piratenadmiral (Sektor P10): ${outcomeText}`, {
      sektorName: 'Sektor P10 – Piratenadmiral',
      resources: reward,
      dm: dmReward,
      teile: { waffen: 0, schild: 0, panzerung: 0 },
      fleetReturned: { ...p.ships },
    });
  });

  op.status = 'resolved';
  saveOp(op);
}

async function tickGroupExpedition(op: GroupOperation, currentState: PlayerState): Promise<void> {
  const now = Date.now();
  if (op.sektorId === 'piraten_admiral') {
    return tickAdminEncounter(op, currentState);
  }
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

  const totalSentPower = accepted.reduce((sum, p) => sum + combatFleetPowerBase(p.ships), 0);

  const table = PIRATEN_MULTIPLIER_ROLL[op.sektorId!];
  // Wellen-Ausreisser und Kampf-Modifikatoren sind hier auf 1x PRO GESAMTER EXPEDITION gedeckelt
  // (op.eliteSurpriseUsed), nicht pro Einzel-Check - bei 4 Stunden-Checks wuerde sich das Risiko
  // sonst unfair aufsummieren (siehe combatConstants.ts).
  const surpriseAllowed = !op.eliteSurpriseUsed;
  const { multiplier: rolledMultiplier, outlier } = surpriseAllowed
    ? rollMultiplierWithOutlier(table, op.sektorId!)
    : { multiplier: table[Math.floor(Math.random() * table.length)], outlier: null as 'schwach' | 'stark' | null };
  const targetPower = Math.max(totalSentPower * rolledMultiplier, cfg.npcFloor || 0);
  const profile = pickWaveProfile(op.sektorId!);
  const battleModifier = surpriseAllowed ? rollBattleModifier(op.sektorId!) : null;
  if (outlier || battleModifier) op.eliteSurpriseUsed = true;

  // Spionage aktuell als Platzhalter gesperrt (siehe startResearch() in actions.ts) - fest 0
  // statt tatsaechlichem Forschungsstand, Mechanismus bleibt fuer spaeter unveraendert bestehen.
  const spionageMax = 0;
  const npcShips = generatePiratenFleet(targetPower, spionageMax, profile);
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
  const result = await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcCombined, research, battleModifier });

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
      dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
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
      const eff = getEffectiveStats(id, pState.research, {}, isBoosterActive(pState, 'kampf'), pState.playerClass, pState.shipModules);
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
        dmgDealt: Math.round(result.shotsA.dmgDealt[statKey] || 0),
        shotsFired: result.shotsA.shotsFired[statKey] || 0,
        hits: result.shotsA.hits[statKey] || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0),
        shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      });
      p.ships[id] = survived;
    });
  });

  // Statistik (siehe stats.ts) - jeder Teilnehmer bekommt denselben Ausgang gutgeschrieben.
  const destroyedEnemyCount = npcResults.reduce((sum, r) => sum + (r.destroyedCount || 0), 0);
  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;
    pState.stats.enemiesDestroyed += destroyedEnemyCount;
    if (anyNpcDestroyed) pState.stats.eliteBollwerkChecks++;
    const ownLost = playerResults.filter((r) => r.ownerUsername === p.username).reduce((sum, r) => sum + (r.lost || 0), 0);
    pState.stats.ownShipsLost += ownLost;
  });

  // Belohnungs-Eskalation: verdoppelt sich mit jedem aufeinanderfolgenden Sieg innerhalb DERSELBEN
  // Expedition, bricht bei einem Check ohne vernichteten Gegner auf 0 zurueck (siehe
  // REWARD_ESCALATION in economy.ts - piraten_elite nutzt den "double"-Modus). Nutzt den
  // Streak-Stand VOR diesem Check (Check 1 = 0 Vorsiege = 1x, kein Bonus).
  const streakBefore = op.streakWins || 0;
  const escalationMultiplier = getEscalationMultiplier(op.sektorId!, streakBefore);
  op.streakWins = anyNpcDestroyed ? streakBefore + 1 : 0;
  const escalationText = escalationMultiplier > 1 ? ` [Serie x${escalationMultiplier.toFixed(0)}]` : '';

  let teileGainText = '';
  if (anyNpcDestroyed && cfg.teileCap) {
    const outcomeShare = 0.1 * escalationMultiplier;
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
    const loot = {
      metall: Math.round(cfg.lootBase.metall * escalationMultiplier),
      kristall: Math.round(cfg.lootBase.kristall * escalationMultiplier),
      deuterium: Math.round(cfg.lootBase.deuterium * escalationMultiplier),
    };
    accepted.forEach((p) => {
      if (!p.farmed) return;
      p.farmed.metall += loot.metall;
      p.farmed.kristall += loot.kristall;
      p.farmed.deuterium += loot.deuterium;
      participantStates.get(p.userId)!.stats.resourcesLooted += loot.metall + loot.kristall + loot.deuterium;
    });
    lootText = ` Jeder Teilnehmer erbeutet${escalationText} ${loot.metall.toLocaleString('de-DE')} Metall, ${loot.kristall.toLocaleString(
      'de-DE'
    )} Kristall, ${loot.deuterium.toLocaleString('de-DE')} Deuterium.`;
  }

  const captainResult = npcResults.find((r) => r.isCaptain);
  let captainText = '';
  if (captainResult) {
    if (captainResult.destroyed) {
      accepted.forEach((p) => addContainers(participantStates.get(p.userId)!, cfg.captainContainerTier!));
      accepted.forEach((p) => {
        if (p.dmFound !== undefined) p.dmFound += cfg.captainDm || 0;
        participantStates.get(p.userId)!.stats.captainsDefeated++;
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
  const waveText = outlier === 'stark' ? ' [⚠ Ungewöhnlich starke Welle]' : outlier === 'schwach' ? ' [Auffällig schwache Welle]' : '';
  const modifierText = battleModifier ? ` ${BATTLE_MODIFIER_LABELS[battleModifier]}.` : '';
  const messageText = `Gemeinsame Expedition ${op.sektorId}${waveText} (mit ${teilnehmerListe}), Stunde ${op.processedHours}/4: ${outcome}.${lootText}${teileGainText}${captainText}${modifierText}`;
  const hasRewards = (anyNpcDestroyed && (cfg.lootBase || cfg.teileCap)) || captainResult?.destroyed;
  const detail: CombatDetail = {
    sektorName: `${op.sektorId} (gemeinsam: ${teilnehmerListe})`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
    replay: result.replay,
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

  // ABSCHLUSS-BONUS (siehe Nutzerentscheidung): seit die 4 Stunden-Checks garantiert stattfinden
  // (kein 50%-Wuerfeln mehr, siehe checkChance in sectors.ts), verdoppelt eine PERFEKTE Serie -
  // alle 4 Checks gewonnen, KEIN einziger Rueckschlag dazwischen (op.streakWins wird bei jedem
  // Check ohne vernichteten Gegner auf 0 zurueckgesetzt, siehe runGroupHourlyCheck) - die GESAMTE
  // ueber die Expedition angesammelte Ressourcen-Ausbeute (NICHT Teile/DM) nochmal komplett.
  // Belohnung dafuer, die volle, sehr harte 4-Stunden-Expedition ohne einen einzigen Rueckschlag
  // durchzustehen - on top der bereits eingebauten Verdopplung PRO Sieg (REWARD_ESCALATION
  // "double"-Modus), die schon bis zu 750 Mio. Ressourcen bei einer perfekten Serie ergibt (siehe
  // README) - mit diesem Bonus also bis zu 1,5 Milliarden.
  const perfectRun = (op.streakWins || 0) >= 4;

  accepted.forEach((p) => {
    const pState = participantStates.get(p.userId)!;

    Object.entries(p.ships).forEach(([id, count]) => {
      if (count > 0) pState.fleet[id] = (pState.fleet[id] || 0) + count;
    });

    const farmed = p.farmed || { metall: 0, kristall: 0, deuterium: 0 };
    const completionMultiplier = perfectRun ? 2 : 1;
    const gainedMetall = Math.floor(farmed.metall * completionMultiplier);
    const gainedKristall = Math.floor(farmed.kristall * completionMultiplier);
    const gainedDeut = Math.floor(farmed.deuterium * completionMultiplier);
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
      `Gemeinsame Expedition ${op.sektorId} (mit ${teilnehmerListe}) zurückgekehrt.${
        perfectRun ? ' 🏆 Perfekte Serie - alle 4 Kämpfe gewonnen! Gesamte Ressourcen-Ausbeute nochmal verdoppelt.' : ''
      }`,
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
