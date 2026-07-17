import { Router } from 'express';
import type { Response } from 'express';
import type { AuthedRequest } from '../auth/middleware.js';
import { requireAuth } from '../auth/middleware.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { tick, startBuild, startDefenseBuild, startResearch, buildImperator } from './actions.js';
import { sendFleet, recallMission, availableFleetForSektor } from './missions.js';
import { startEventMission } from './events.js';
import { openContainer, redeemRewardItem } from './inventory.js';
import { clearMessages } from './messages.js';
import { savePreset, deletePreset } from './presets.js';
import { listActiveRaids, reinforceRaid } from './raidReinforce.js';
import { createGroupOperation, listMyGroupOperations, respondToGroupOperation, cancelGroupOperation, startGroupOperation } from './groupOps.js';
import { simulateCombat } from './simulator.js';
import { listAllUsers } from '../db.js';
import { computeTradeReceive, executeTrade, scrapShip, scrapDefense, buyBooster, buyVoucher } from './economyActions.js';
import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import { BOOSTERS, SHOP_VOUCHERS, CONTAINER_TYPES, TRADE_VALUE, TRADE_FEE, SCRAP_REFUND_RATE, ASTEROID_ESCORT_POWER_MIN, ASTEROID_ESCORT_POWER_MAX, ASTEROID_ESCORT_KILL_REWARD } from './data/economy.js';
import { RAPIDFIRE, ZIELERFASSUNG_BASE, MAX_RESEARCH_LEVEL, MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, SHIELD_REGEN_BASE, SHIELD_REGEN_MAX, PRECISION_BASE, PRECISION_MAX_PLAYER, DEFENSE_REPAIR_PERCENT, MULTI_TARGET_VOLLEY_SHIPS, PRECISION_MODIFIER, SHIELD_REGEN_MODIFIER, EVASION_BASE, EVASION_MAX, CRIT_CHANCE_BASE, CRIT_CHANCE_MAX, CRIT_DAMAGE_MULTIPLIER } from './data/combatConstants.js';
import { CHANGELOG } from './data/changelog.js';
import { getLeaderboard } from './stats.js';
import type { ActionResult } from './actions.js';
import type { PlayerState } from './types.js';

export const gameRouter = Router();
gameRouter.use(requireAuth);

// Statische Spieldaten - das Frontend braucht diese fuer alle Seiten (Kosten, Werte, Bilder, Lore-Texte,
// RapidFire-/Zielerfassungs-Anzeigen und diverse Spielkonstanten fuer Infotexte).
gameRouter.get('/data', (_req, res) => {
  res.json({
    ships: SHIPS,
    defenses: DEFENSES,
    research: RESEARCH,
    sektoren: SEKTOREN,
    sektorConfig: SEKTOR_CONFIG,
    piratenMultiplierRoll: PIRATEN_MULTIPLIER_ROLL,
    boosters: BOOSTERS,
    vouchers: SHOP_VOUCHERS,
    containerTypes: CONTAINER_TYPES,
    tradeValue: TRADE_VALUE,
    tradeFee: TRADE_FEE,
    rapidfire: RAPIDFIRE,
    zielerfassungBase: ZIELERFASSUNG_BASE,
    multiTargetVolleyShips: Array.from(MULTI_TARGET_VOLLEY_SHIPS),
    precisionModifier: PRECISION_MODIFIER,
    shieldRegenModifier: SHIELD_REGEN_MODIFIER,
    evasionBase: EVASION_BASE,
    evasionMax: EVASION_MAX,
    critChanceBase: CRIT_CHANCE_BASE,
    critChanceMax: CRIT_CHANCE_MAX,
    critDamageMultiplier: CRIT_DAMAGE_MULTIPLIER,
    maxResearchLevel: MAX_RESEARCH_LEVEL,
    maxBuildSlots: MAX_BUILD_SLOTS,
    maxDefenseSlots: MAX_DEFENSE_SLOTS,
    maxResearchSlots: MAX_RESEARCH_SLOTS,
    shieldRegenBase: SHIELD_REGEN_BASE,
    shieldRegenMax: SHIELD_REGEN_MAX,
    precisionBase: PRECISION_BASE,
    precisionMaxPlayer: PRECISION_MAX_PLAYER,
    defenseRepairPercent: DEFENSE_REPAIR_PERCENT,
    asteroidEscortPowerMin: ASTEROID_ESCORT_POWER_MIN,
    asteroidEscortPowerMax: ASTEROID_ESCORT_POWER_MAX,
    asteroidEscortKillReward: ASTEROID_ESCORT_KILL_REWARD,
    changelog: CHANGELOG,
    scrapRefundRate: SCRAP_REFUND_RATE,
  });
});

gameRouter.get('/state', async (req: AuthedRequest, res) => {
  try {
    const state = loadPlayerState(req.userId!);
    await tick(state);
    savePlayerState(state);
    res.json({ ...state, serverTime: Date.now() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim Laden des Spielzustands.' });
  }
});

// Gemeinsamer Ablauf fuer alle zustandsveraendernden Aktionen: laden, nachholen (tick),
// Aktion ausfuehren (kann selbst asynchron sein, z.B. wegen Kampf-Worker-Thread),
// bei Erfolg speichern und neuen Zustand zurueckgeben.
async function handleAction(req: AuthedRequest, res: Response, action: (state: PlayerState) => ActionResult | Promise<ActionResult>) {
  try {
    const state = loadPlayerState(req.userId!);
    await tick(state);
    const result = await action(state);
    if (!result.ok) return res.status(400).json({ error: result.error });
    savePlayerState(state);
    res.json({ ...state, serverTime: Date.now() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler bei der Verarbeitung.' });
  }
}

gameRouter.post('/build/ship', (req: AuthedRequest, res) => {
  const { shipId, qty } = req.body ?? {};
  if (typeof shipId !== 'string' || typeof qty !== 'number') {
    return res.status(400).json({ error: 'shipId und qty (Zahl) erforderlich.' });
  }
  handleAction(req, res, (state) => startBuild(state, shipId, qty));
});

gameRouter.post('/build/defense', (req: AuthedRequest, res) => {
  const { defId, qty } = req.body ?? {};
  if (typeof defId !== 'string' || typeof qty !== 'number') {
    return res.status(400).json({ error: 'defId und qty (Zahl) erforderlich.' });
  }
  handleAction(req, res, (state) => startDefenseBuild(state, defId, qty));
});

gameRouter.post('/research/start', (req: AuthedRequest, res) => {
  const { techId } = req.body ?? {};
  if (typeof techId !== 'string') return res.status(400).json({ error: 'techId erforderlich.' });
  handleAction(req, res, (state) => startResearch(state, techId));
});

gameRouter.post('/imperator/build', (req: AuthedRequest, res) => {
  handleAction(req, res, (state) => buildImperator(state));
});

// ---- Sektor / Missionen ----

gameRouter.get('/sektor/available/:sektorId', (req: AuthedRequest, res) => {
  res.json({ ids: availableFleetForSektor(req.params.sektorId) });
});

gameRouter.post('/mission/send', (req: AuthedRequest, res) => {
  const { sektorId, selection } = req.body ?? {};
  if (typeof sektorId !== 'string' || typeof selection !== 'object' || selection === null) {
    return res.status(400).json({ error: 'sektorId und selection erforderlich.' });
  }
  handleAction(req, res, (state) => sendFleet(state, sektorId, selection));
});

gameRouter.post('/mission/recall', (req: AuthedRequest, res) => {
  const { missionId } = req.body ?? {};
  if (typeof missionId !== 'string') return res.status(400).json({ error: 'missionId erforderlich.' });
  handleAction(req, res, (state) => recallMission(state, missionId));
});

// ---- Notruf-Event ----

gameRouter.post('/event/join', (req: AuthedRequest, res) => {
  const { selection } = req.body ?? {};
  if (typeof selection !== 'object' || selection === null) {
    return res.status(400).json({ error: 'selection erforderlich.' });
  }
  handleAction(req, res, (state) => startEventMission(state, selection));
});

// ---- Inventar / Container ----

gameRouter.post('/inventory/open', (req: AuthedRequest, res) => {
  const { containerId } = req.body ?? {};
  if (typeof containerId !== 'string') return res.status(400).json({ error: 'containerId erforderlich.' });
  handleAction(req, res, (state) => openContainer(state, containerId));
});

gameRouter.post('/inventory/redeem', (req: AuthedRequest, res) => {
  const { itemId } = req.body ?? {};
  if (typeof itemId !== 'string') return res.status(400).json({ error: 'itemId erforderlich.' });
  handleAction(req, res, (state) => redeemRewardItem(state, itemId));
});

// ---- Haendler ----

gameRouter.get('/trade/preview', (req: AuthedRequest, res) => {
  const amount = Number(req.query.amount) || 0;
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  res.json({ received: computeTradeReceive(amount, from, to) });
});

gameRouter.post('/trade/execute', (req: AuthedRequest, res) => {
  const { amount, from, to } = req.body ?? {};
  if (typeof amount !== 'number' || typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ error: 'amount, from und to erforderlich.' });
  }
  handleAction(req, res, (state) => executeTrade(state, amount, from as any, to as any));
});

// ---- Schrotthaendler ----

gameRouter.post('/scrap/ship', (req: AuthedRequest, res) => {
  const { shipId, qty } = req.body ?? {};
  if (typeof shipId !== 'string' || typeof qty !== 'number') {
    return res.status(400).json({ error: 'shipId und qty erforderlich.' });
  }
  handleAction(req, res, (state) => scrapShip(state, shipId, qty));
});

gameRouter.post('/scrap/defense', (req: AuthedRequest, res) => {
  const { defId, qty } = req.body ?? {};
  if (typeof defId !== 'string' || typeof qty !== 'number') {
    return res.status(400).json({ error: 'defId und qty erforderlich.' });
  }
  handleAction(req, res, (state) => scrapDefense(state, defId, qty));
});

// ---- Shop ----

gameRouter.post('/shop/booster', (req: AuthedRequest, res) => {
  const { boosterId } = req.body ?? {};
  if (typeof boosterId !== 'string') return res.status(400).json({ error: 'boosterId erforderlich.' });
  handleAction(req, res, (state) => buyBooster(state, boosterId));
});

gameRouter.post('/shop/voucher', (req: AuthedRequest, res) => {
  const { voucherId } = req.body ?? {};
  if (typeof voucherId !== 'string') return res.status(400).json({ error: 'voucherId erforderlich.' });
  handleAction(req, res, (state) => buyVoucher(state, voucherId));
});

// ---- Flotten-Vorlagen (Presets) ----

gameRouter.post('/preset/save', (req: AuthedRequest, res) => {
  const { name, ships } = req.body ?? {};
  if (typeof name !== 'string' || typeof ships !== 'object' || ships === null) {
    return res.status(400).json({ error: 'name und ships erforderlich.' });
  }
  handleAction(req, res, (state) => savePreset(state, name, ships));
});

gameRouter.post('/preset/delete', (req: AuthedRequest, res) => {
  const { presetId } = req.body ?? {};
  if (typeof presetId !== 'string') return res.status(400).json({ error: 'presetId erforderlich.' });
  handleAction(req, res, (state) => deletePreset(state, presetId));
});

// ---- Nachrichten ----

gameRouter.post('/messages/clear', (req: AuthedRequest, res) => {
  const { type } = req.body ?? {};
  if (type !== undefined && type !== 'kampf' && type !== 'farm') {
    return res.status(400).json({ error: 'type muss "kampf", "farm" oder leer sein.' });
  }
  handleAction(req, res, (state) => clearMessages(state, type));
});

// ---- Andere Spieler ----

gameRouter.get('/users', (req: AuthedRequest, res) => {
  res.json({ users: listAllUsers(req.userId!) });
});

// ---- Raid-Verstärkung (jeder sieht alle aktiven Raids und kann helfen) ----

gameRouter.get('/raids/active', (req: AuthedRequest, res) => {
  try {
    res.json({ raids: listActiveRaids(req.userId!) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim Laden der aktiven Raids.' });
  }
});

// ---- Statistik/Bestenliste ----

gameRouter.get('/leaderboard', (_req: AuthedRequest, res) => {
  try {
    res.json({ leaderboard: getLeaderboard() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim Laden der Bestenliste.' });
  }
});

gameRouter.post('/raids/reinforce', (req: AuthedRequest, res) => {
  const { targetUserId, ships } = req.body ?? {};
  if (typeof targetUserId !== 'number' || typeof ships !== 'object' || ships === null) {
    return res.status(400).json({ error: 'targetUserId und ships erforderlich.' });
  }
  handleAction(req, res, (state) => reinforceRaid(state, targetUserId, ships));
});

// ---- Gemeinsame Expeditionen / Notruf-Events (Einladung per Name, Ersteller startet manuell) ----

gameRouter.get('/party/list', (req: AuthedRequest, res) => {
  try {
    res.json({ operations: listMyGroupOperations(req.userId!) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim Laden der gemeinsamen Operationen.' });
  }
});

gameRouter.post('/party/create', (req: AuthedRequest, res) => {
  const { kind, sektorId, ships, inviteUserIds } = req.body ?? {};
  if ((kind !== 'expedition' && kind !== 'event') || typeof ships !== 'object' || ships === null || !Array.isArray(inviteUserIds)) {
    return res.status(400).json({ error: 'kind, ships und inviteUserIds erforderlich.' });
  }
  handleAction(req, res, (state) => createGroupOperation(state, kind, sektorId, ships, inviteUserIds));
});

gameRouter.post('/party/respond', (req: AuthedRequest, res) => {
  const { opId, accept, ships } = req.body ?? {};
  if (typeof opId !== 'string' || typeof accept !== 'boolean' || typeof ships !== 'object' || ships === null) {
    return res.status(400).json({ error: 'opId, accept und ships erforderlich.' });
  }
  handleAction(req, res, (state) => respondToGroupOperation(state, opId, accept, ships));
});

gameRouter.post('/party/cancel', (req: AuthedRequest, res) => {
  const { opId } = req.body ?? {};
  if (typeof opId !== 'string') return res.status(400).json({ error: 'opId erforderlich.' });
  handleAction(req, res, (state) => cancelGroupOperation(state, opId));
});

gameRouter.post('/party/start', (req: AuthedRequest, res) => {
  const { opId } = req.body ?? {};
  if (typeof opId !== 'string') return res.status(400).json({ error: 'opId erforderlich.' });
  handleAction(req, res, (state) => startGroupOperation(state, opId));
});

// ---- Kampfsimulator ----

// Bewusst NICHT ueber handleAction: der Simulator darf den Spielstand unter KEINEN Umstaenden
// veraendern oder speichern (kein savePlayerState, kein tick). Er laedt den Zustand nur lesend,
// um die aktuelle Forschung fuer die Berechnung zu kennen.
gameRouter.post('/simulate', async (req: AuthedRequest, res) => {
  const { sektorId, selection } = req.body ?? {};
  if (typeof sektorId !== 'string' || typeof selection !== 'object' || selection === null) {
    return res.status(400).json({ error: 'sektorId und selection erforderlich.' });
  }
  try {
    const state = loadPlayerState(req.userId!);
    const result = await simulateCombat(state, sektorId, selection);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ simulation: result.simulation, serverTime: Date.now() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler bei der Simulation.' });
  }
});
