import { Router } from 'express';
import type { Response } from 'express';
import type { AuthedRequest } from '../auth/middleware.js';
import { requireAuth } from '../auth/middleware.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { tick, startBuild, startDefenseBuild, startResearch, buildImperator, startBuildingConstruction, startModuleUpgrade, startShipModuleUpgrade, energyProduced, energyConsumed } from './actions.js';
import { sendFleet, recallMission, availableFleetForSektor } from './missions.js';
import { openContainer, redeemRewardItem } from './inventory.js';
import { clearMessages } from './messages.js';
import { savePreset, deletePreset } from './presets.js';
import { listActiveRaids } from './raidReinforce.js';
import { createGroupOperation, listMyGroupOperations, respondToGroupOperation, cancelGroupOperation, startGroupOperation, respondAdminEncounter } from './groupOps.js';
import { simulateCombat } from './simulator.js';
import { listGalaxyOccupants, startHoldDeployment, recallHoldDeployment, galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost, getIncomingDeploymentsFor } from './galaxy.js';
import { listAllUsers } from '../db.js';
import { computeTradeReceive, executeTrade, scrapShip, scrapDefense, buyBooster, buyVoucher } from './economyActions.js';
import { setPlayerClass } from './classActions.js';
import { PLAYER_CLASSES, CLASS_CHANGE_COST_DM } from './data/classes.js';
import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { BUILDINGS } from './data/buildings.js';
import { BUILDING_MODULES } from './data/buildingModules.js';
import { SHIP_MODULES } from './data/shipModules.js';
import { GALAXY_SYSTEMS, GALAXY_POSITIONS, PIRATE_BASES } from './data/galaxyConstants.js';
import { SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import { BOOSTERS, SHOP_VOUCHERS, CONTAINER_TYPES, TRADE_VALUE, TRADE_FEE, SCRAP_REFUND_RATE, ASTEROID_ESCORT_POWER_MIN, ASTEROID_ESCORT_POWER_MAX, ASTEROID_ESCORT_KILL_REWARD } from './data/economy.js';
import { RAPIDFIRE, ZIELERFASSUNG_BASE, MAX_RESEARCH_LEVEL, PARENT_UNLOCK_LEVEL, MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, MAX_BUILDING_SLOTS, MAX_SHIP_MODULE_SLOTS, SHIELD_REGEN_BASE, SHIELD_REGEN_MAX, PRECISION_BASE, PRECISION_MAX_PLAYER, DEFENSE_REPAIR_PERCENT, MULTI_TARGET_VOLLEY_SHIPS, PRECISION_MODIFIER, SHIELD_REGEN_MODIFIER, EVASION_BASE, EVASION_MAX, CRIT_CHANCE_BASE, CRIT_CHANCE_MAX, CRIT_DAMAGE_MULTIPLIER, ADMIRAL_ALLOWED_SHIP_IDS } from './data/combatConstants.js';
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
    buildings: BUILDINGS,
    buildingModules: BUILDING_MODULES,
    shipModules: SHIP_MODULES,
    maxBuildingSlots: MAX_BUILDING_SLOTS,
    maxShipModuleSlots: MAX_SHIP_MODULE_SLOTS,
    admiralAllowedShipIds: ADMIRAL_ALLOWED_SHIP_IDS,
    galaxySystems: GALAXY_SYSTEMS,
    galaxyPositions: GALAXY_POSITIONS,
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
    parentUnlockLevel: PARENT_UNLOCK_LEVEL,
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
    playerClasses: PLAYER_CLASSES,
    classChangeCostDm: CLASS_CHANGE_COST_DM,
  });
});

gameRouter.get('/state', async (req: AuthedRequest, res) => {
  try {
    const state = loadPlayerState(req.userId!);
    await tick(state);
    savePlayerState(state);
    res.json({ ...state, serverTime: Date.now(), energyProduced: energyProduced(state), energyConsumed: energyConsumed(state) });
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
    res.json({ ...state, serverTime: Date.now(), energyProduced: energyProduced(state), energyConsumed: energyConsumed(state) });
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

gameRouter.post('/build/building', (req: AuthedRequest, res) => {
  const { buildingId } = req.body ?? {};
  if (typeof buildingId !== 'string') return res.status(400).json({ error: 'buildingId erforderlich.' });
  handleAction(req, res, (state) => startBuildingConstruction(state, buildingId));
});

gameRouter.post('/build/module', (req: AuthedRequest, res) => {
  const { moduleId } = req.body ?? {};
  if (typeof moduleId !== 'string') return res.status(400).json({ error: 'moduleId erforderlich.' });
  handleAction(req, res, (state) => startModuleUpgrade(state, moduleId));
});

gameRouter.post('/build/shipmodule', (req: AuthedRequest, res) => {
  const { moduleId } = req.body ?? {};
  if (typeof moduleId !== 'string') return res.status(400).json({ error: 'moduleId erforderlich.' });
  handleAction(req, res, (state) => startShipModuleUpgrade(state, moduleId));
});

// ---- Galaxie ----

gameRouter.get('/galaxy', (req: AuthedRequest, res) => {
  try {
    const state = loadPlayerState(req.userId!);
    const sektorPositions = SEKTOREN.filter((s) => SEKTOR_CONFIG[s.id]?.galaxyPosition).map((s) => ({
      sektorId: s.id,
      name: s.name,
      ...SEKTOR_CONFIG[s.id].galaxyPosition!,
    }));
    res.json({
      ownPosition: state.galaxyPosition,
      occupants: listGalaxyOccupants(),
      pirateBases: PIRATE_BASES,
      sektorPositions,
      incomingDeployments: getIncomingDeploymentsFor(req.userId!),
      galaxySystems: GALAXY_SYSTEMS,
      galaxyPositions: GALAXY_POSITIONS,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler beim Laden der Galaxie.' });
  }
});

// Vorschau (Distanz/Flugzeit/Treibstoff) VOR dem tatsächlichen Losschicken - rein lesend, verändert
// nichts, damit der Client vor der Bestätigung genaue Werte anzeigen kann. Verallgemeinert: Ziel
// entweder ein anderer SPIELER (targetUserId, fuer Halten-Fluege) ODER eine beliebige feste
// Position (targetPosition, fuer Sektor-Missionen/Elite-Bollwerk-Rendezvous) - genau eines
// von beiden muss angegeben werden.
gameRouter.post('/galaxy/preview', (req: AuthedRequest, res) => {
  try {
    const { targetUserId, targetPosition, ships } = req.body ?? {};
    if (typeof ships !== 'object' || ships === null) {
      return res.status(400).json({ error: 'ships erforderlich.' });
    }
    const state = loadPlayerState(req.userId!);
    if (!state.galaxyPosition) return res.status(400).json({ error: 'Position nicht verfügbar.' });

    let target: { system: number; position: number } | null = null;
    if (typeof targetUserId === 'number') {
      const targetState = loadPlayerState(targetUserId);
      target = targetState.galaxyPosition;
    } else if (targetPosition && typeof targetPosition.system === 'number' && typeof targetPosition.position === 'number') {
      target = targetPosition;
    }
    if (!target) return res.status(400).json({ error: 'Zielposition nicht verfügbar.' });

    const distance = galaxyDistance(state.galaxyPosition, target);
    const speed = galaxyFleetSpeed(ships, state.research, state.playerClass, state.shipModules);
    const durationMs = galaxyDurationMs(distance, speed);
    const fuelCost = galaxyFuelCost(ships, distance);
    res.json({ distance, durationMs, fuelCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler bei der Vorschau.' });
  }
});

gameRouter.post('/galaxy/hold', (req: AuthedRequest, res) => {
  const { targetUserId, ships } = req.body ?? {};
  if (typeof targetUserId !== 'number' || typeof ships !== 'object' || ships === null) {
    return res.status(400).json({ error: 'targetUserId und ships erforderlich.' });
  }
  handleAction(req, res, (state) => startHoldDeployment(state, targetUserId, ships));
});

gameRouter.post('/galaxy/recall', (req: AuthedRequest, res) => {
  const { deploymentId } = req.body ?? {};
  if (typeof deploymentId !== 'string') return res.status(400).json({ error: 'deploymentId erforderlich.' });
  handleAction(req, res, (state) => recallHoldDeployment(state, deploymentId));
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

// Erstwahl kostenlos (state.playerClass === null), jeder weitere Wechsel kostet CLASS_CHANGE_COST_DM
// (siehe classActions.ts).
gameRouter.post('/class', (req: AuthedRequest, res) => {
  const { classId } = req.body ?? {};
  if (typeof classId !== 'string') return res.status(400).json({ error: 'classId erforderlich.' });
  handleAction(req, res, (state) => setPlayerClass(state, classId));
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

// ---- Gemeinsame Expeditionen (Elite-Bollwerk, Einladung per Name, Ersteller startet manuell) ----

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
  if (kind !== 'expedition' || typeof ships !== 'object' || ships === null || !Array.isArray(inviteUserIds)) {
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

gameRouter.post('/party/admiral-decide', (req: AuthedRequest, res) => {
  const { opId, action } = req.body ?? {};
  if (typeof opId !== 'string' || (action !== 'extract' && action !== 'continue')) {
    return res.status(400).json({ error: 'opId und action ("extract"|"continue") erforderlich.' });
  }
  handleAction(req, res, (state) => respondAdminEncounter(state, opId, action));
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
