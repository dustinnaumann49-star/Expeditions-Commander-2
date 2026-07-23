import { OUTPOST_POSITIONS, OUTPOST_IDS, OUTPOST_TIERS } from './data/galaxyConstants.js';
import { OUTPOST_TIER_TARGET_POWER, OUTPOST_SPEED_BONUS, OUTPOST_PIRATE_ATTACK_CHANCE, OUTPOST_PIRATE_ADVANTAGE_ROLL } from './data/economy.js';
import { getOutpostJson, saveOutpostJson, listAllUsers } from '../db.js';
import { galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost } from './galaxy.js';
import { shipName, generateFallbackFleet, pickWaveProfile, getEffectiveStats, baseStats } from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { isBoosterActive } from './boosterUtil.js';
import { pushMessage } from './messages.js';
import { loadPlayerState, savePlayerState } from './state.js';
import type { PlayerState, OutpostState, OutpostDeployment, OutpostTier, GalaxyPosition, CombatUnitResult, CombatDetail } from './types.js';
import type { ActionResult } from './actions.js';

// ========== AUSSENPOSTEN: KONTESTIERTE GALAXIE-KNOTEN ==========
// Nutzerentscheidung (Juli 2026): 6 feste Galaxie-Knoten, starten piraten-eigen mit einer bei
// jedem Angriff frisch gewuerfelten NPC-Garnison (wie bei Sektoren/Raids, kein State-Tracking
// noetig solange piraten-eigen). Eroberung = Flotte hinschicken, Garnison im Kampf besiegen -
// Sieg macht die Angreifer-Ueberlebenden sofort zur neuen (spieler-eigenen) Garnison. Die
// Piraten-KI versucht danach opportunistisch (kein fester Zeittakt, siehe runOutpostPirateAiTurn())
// zurueckzuerobern. Garnison ist ein gemeinsamer Pool der gesamten Spielerseite (Menschen+Bots) -
// jeder darf verstaerken und die GESAMTE Garnison zurueckrufen (Nutzerentscheidung, siehe
// [[project_playerbase_casual_coop]] - keine Attributions-Verwaltung pro Beitragendem, das waere
// fuer ein 2-Spieler-Koop-Team unnoetiger Aufwand). Explizit KEIN Straf-Mechanismus: ein Verlust
// bedeutet nur, dass die dort stationierten Schiffe weg sind, keine Kettenreaktion auf die
// Heimatbasis.

const POSITION_BY_ID = new Map<string, GalaxyPosition>(OUTPOST_IDS.map((id, i) => [id, OUTPOST_POSITIONS[i]]));
const TIER_BY_ID = new Map<string, OutpostTier>(OUTPOST_IDS.map((id, i) => [id, OUTPOST_TIERS[i]]));

function seedOutpost(id: string): OutpostState {
  const pos = POSITION_BY_ID.get(id)!;
  return { id, system: pos.system, position: pos.position, tier: TIER_BY_ID.get(id)!, ownerSide: 'pirates', garrison: {}, ownerSince: null };
}

export function loadOutpost(id: string): OutpostState | null {
  if (!POSITION_BY_ID.has(id)) return null;
  const json = getOutpostJson(id);
  if (!json) {
    const fresh = seedOutpost(id);
    saveOutpostJson(id, JSON.stringify(fresh));
    return fresh;
  }
  return JSON.parse(json) as OutpostState;
}

export function loadAllOutposts(): OutpostState[] {
  return OUTPOST_IDS.map((id) => loadOutpost(id)!).filter((o): o is OutpostState => o !== null);
}

function saveOutpost(outpost: OutpostState): void {
  saveOutpostJson(outpost.id, JSON.stringify(outpost));
}

// Leichtgewichtige Anzeige-Zusammenfassung fuer die Galaxie-Uebersicht (analog PirateBaseSummary) -
// bei piraten-eigenen Posten wird die Tier-Zielstaerke als grober Richtwert gezeigt (die
// tatsaechliche Garnison wird ja erst beim Angriff gewuerfelt), bei spieler-eigenen die echte,
// aktuell stationierte Staerke.
export interface OutpostSummary {
  id: string;
  system: number;
  position: number;
  tier: OutpostTier;
  ownerSide: 'pirates' | 'players';
  garrisonPower: number;
  ownerSince: number | null;
}

export function listOutpostSummaries(): OutpostSummary[] {
  return loadAllOutposts().map((o) => ({
    id: o.id,
    system: o.system,
    position: o.position,
    tier: o.tier,
    ownerSide: o.ownerSide,
    garrisonPower: o.ownerSide === 'pirates' ? OUTPOST_TIER_TARGET_POWER[o.tier] : garrisonShipPower(o.garrison),
    ownerSince: o.ownerSince,
  }));
}

function garrisonShipPower(garrison: Record<string, number>): number {
  // Grobe Anzeige-Naeherung (kein Kampfwert-Aufwand fuer eine reine Uebersichtszahl noetig) -
  // zaehlt einfach die Gesamtzahl der Schiffe.
  return Object.values(garrison).reduce((a, b) => a + (b || 0), 0);
}

// Strategischer Bonus (Nutzerentscheidung): Fluege, die in einem System starten ODER enden, in dem
// ein SPIELER-EIGENER Aussenposten liegt, sind OUTPOST_SPEED_BONUS schneller. Bewusst NICHT in
// galaxy.ts' allgemeine Speed-Formel eingebaut (siehe Plan) - nur an den Aufrufstellen multipliziert,
// die den Bonus tatsaechlich anbieten sollen (missions.ts, pirateBaseState.ts, outposts.ts selbst).
export function outpostSpeedMultiplierForSystem(...systems: (number | undefined)[]): number {
  const ownedSystems = new Set(loadAllOutposts().filter((o) => o.ownerSide === 'players').map((o) => o.system));
  return systems.some((s) => s !== undefined && ownedSystems.has(s)) ? OUTPOST_SPEED_BONUS : 1;
}

// ========== ANGRIFF STARTEN (Eroberungsversuch gegen einen piraten-eigenen Posten) ==========

export function startOutpostAttack(state: PlayerState, outpostId: string, ships: Record<string, number>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  const outpost = loadOutpost(outpostId);
  if (!outpost) return { ok: false, error: 'Unbekannter Außenposten.' };
  if (outpost.ownerSide === 'players') return { ok: false, error: 'Dieser Außenposten gehört bereits eurer Seite - verstärke ihn stattdessen.' };
  if (state.outpostDeployments.some((d) => d.outpostId === outpostId && d.kind === 'attack' && !d.resolved)) {
    return { ok: false, error: 'Du greifst diesen Außenposten bereits an.' };
  }

  const selected: Record<string, number> = {};
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0) {
      if ((state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
      selected[id] = qty;
    }
  }
  if (Object.keys(selected).length === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };

  const targetPos = POSITION_BY_ID.get(outpostId)!;
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
  const bonus = outpostSpeedMultiplierForSystem(state.galaxyPosition.system, targetPos.system);
  const speed = galaxyFleetSpeed(selected, state.research, state.playerClass, state.shipModules) * bonus;
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return { ok: false, error: 'Diese Flotte kann nicht fliegen (keine Geschwindigkeit).' };
  const fuelCost = galaxyFuelCost(selected, distance, state);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für den Flug (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  Object.entries(selected).forEach(([id, qty]) => {
    state.fleet[id] -= qty;
  });

  const now = Date.now();
  const deployment: OutpostDeployment = {
    id: 'opdep_' + now + '_' + outpostId,
    outpostId,
    kind: 'attack',
    ships: selected,
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: targetPos.system,
    targetPosition: targetPos.position,
    startTime: now,
    arriveTime: now + travelMs,
    returnTime: null,
    resolved: false,
  };
  state.outpostDeployments.push(deployment);
  return { ok: true };
}

// ========== VERSTAERKUNG (nur auf bereits spieler-eigene Posten, kein Kampf) ==========

export function startOutpostReinforcement(state: PlayerState, outpostId: string, ships: Record<string, number>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  const outpost = loadOutpost(outpostId);
  if (!outpost) return { ok: false, error: 'Unbekannter Außenposten.' };
  if (outpost.ownerSide !== 'players') return { ok: false, error: 'Dieser Außenposten gehört nicht eurer Seite - er muss erst erobert werden.' };

  const selected: Record<string, number> = {};
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0) {
      if ((state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
      selected[id] = qty;
    }
  }
  if (Object.keys(selected).length === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };

  const targetPos = POSITION_BY_ID.get(outpostId)!;
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
  const bonus = outpostSpeedMultiplierForSystem(state.galaxyPosition.system, targetPos.system);
  const speed = galaxyFleetSpeed(selected, state.research, state.playerClass, state.shipModules) * bonus;
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return { ok: false, error: 'Diese Flotte kann nicht fliegen (keine Geschwindigkeit).' };
  const fuelCost = galaxyFuelCost(selected, distance, state);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für den Flug (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  Object.entries(selected).forEach(([id, qty]) => {
    state.fleet[id] -= qty;
  });

  const now = Date.now();
  const deployment: OutpostDeployment = {
    id: 'opdep_' + now + '_' + outpostId,
    outpostId,
    kind: 'reinforce',
    ships: selected,
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: targetPos.system,
    targetPosition: targetPos.position,
    startTime: now,
    arriveTime: now + travelMs,
    returnTime: null,
    resolved: false,
  };
  state.outpostDeployments.push(deployment);
  return { ok: true };
}

// ========== RUECKRUF (gesamte Garnison, jeder Nutzer darf) ==========

export function recallOutpostGarrison(state: PlayerState, outpostId: string): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  const outpost = loadOutpost(outpostId);
  if (!outpost) return { ok: false, error: 'Unbekannter Außenposten.' };
  if (outpost.ownerSide !== 'players') return { ok: false, error: 'Dieser Außenposten gehört nicht eurer Seite.' };
  const totalGarrison = Object.values(outpost.garrison).reduce((a, b) => a + (b || 0), 0);
  if (totalGarrison === 0) return { ok: false, error: 'Keine Garnison stationiert.' };

  const targetPos = POSITION_BY_ID.get(outpostId)!;
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
  const bonus = outpostSpeedMultiplierForSystem(state.galaxyPosition.system, targetPos.system);
  const speed = galaxyFleetSpeed(outpost.garrison, state.research, state.playerClass, state.shipModules) * bonus;
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return { ok: false, error: 'Die Garnison kann nicht fliegen (keine Geschwindigkeit).' };
  const fuelCost = galaxyFuelCost(outpost.garrison, distance, state);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für den Rückruf (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  const recalledShips = outpost.garrison;
  outpost.garrison = {};
  saveOutpost(outpost);

  const now = Date.now();
  const deployment: OutpostDeployment = {
    id: 'opdep_' + now + '_recall_' + outpostId,
    outpostId,
    kind: 'reinforce', // wiederverwendet als reiner Rueckflug, `arriveTime` bringt die Schiffe direkt heim (siehe processOutpostDeployments)
    ships: recalledShips,
    originSystem: targetPos.system,
    originPosition: targetPos.position,
    targetSystem: state.galaxyPosition.system,
    targetPosition: state.galaxyPosition.position,
    startTime: now,
    arriveTime: now + travelMs,
    returnTime: now + travelMs, // markiert diesen Trip als "kommt nach Hause" statt "fliegt zum Posten", siehe processOutpostDeployments
    resolved: false,
  };
  state.outpostDeployments.push(deployment);
  return { ok: true };
}

// ========== DEPLOYMENTS VERARBEITEN (Ankunft) ==========

export async function processOutpostDeployments(state: PlayerState): Promise<void> {
  const now = Date.now();
  for (const deployment of state.outpostDeployments) {
    if (deployment.resolved || deployment.arriveTime > now) continue;
    if (deployment.returnTime !== null) {
      // Rueckruf-Trip (siehe recallOutpostGarrison) - Schiffe kommen direkt heim, kein Kampf.
      Object.entries(deployment.ships).forEach(([id, qty]) => {
        if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
      });
      deployment.resolved = true;
      continue;
    }
    if (deployment.kind === 'reinforce') {
      const outpost = loadOutpost(deployment.outpostId);
      if (outpost && outpost.ownerSide === 'players') {
        Object.entries(deployment.ships).forEach(([id, qty]) => {
          if (qty > 0) outpost.garrison[id] = (outpost.garrison[id] || 0) + qty;
        });
        saveOutpost(outpost);
        pushMessage(state, 'kampf', `Verstärkung bei Außenposten 1:${outpost.system}:${outpost.position} eingetroffen.`);
      } else {
        // Posten inzwischen wieder piraten-eigen (z.B. zurueckerobert waehrend die Verstaerkung
        // unterwegs war) - Schiffe kehren automatisch heim statt nutzlos zu verschwinden.
        Object.entries(deployment.ships).forEach(([id, qty]) => {
          if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
        });
        pushMessage(state, 'kampf', `Außenposten 1:${deployment.targetSystem}:${deployment.targetPosition} war nicht mehr in Spielerhand - Verstärkung kehrt um.`);
      }
      deployment.resolved = true;
      continue;
    }
    // kind === 'attack'
    await resolveOutpostAttack(state, deployment);
  }
  state.outpostDeployments = state.outpostDeployments.filter((d) => {
    if (!d.resolved) return true;
    // Nach der Ankunft (kämpfen/verstärken/zurückkehren erledigt) noch einmal kurz sichtbar
    // lassen? Nein - anders als PirateAttackDeployment (eigener Rückflug) ist hier jeder
    // 'resolved'-Eintrag bereits vollständig abgewickelt, kann sofort entfernt werden.
    return false;
  });
}

async function resolveOutpostAttack(state: PlayerState, deployment: OutpostDeployment): Promise<void> {
  deployment.resolved = true;
  const outpost = loadOutpost(deployment.outpostId);
  if (!outpost) {
    Object.entries(deployment.ships).forEach(([id, qty]) => {
      if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
    });
    pushMessage(state, 'kampf', `Angriff auf Außenposten 1:${deployment.targetSystem}:${deployment.targetPosition} fehlgeschlagen - Posten nicht auffindbar. Flotte kehrt zurück.`);
    return;
  }
  if (outpost.ownerSide === 'players') {
    // Inzwischen bereits von anderer Seite der Spielerseite erobert - Flotte kehrt unbenutzt heim.
    Object.entries(deployment.ships).forEach(([id, qty]) => {
      if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
    });
    pushMessage(state, 'kampf', `Außenposten 1:${outpost.system}:${outpost.position} war bereits erobert - Flotte kehrt unbenutzt zurück.`);
    return;
  }

  const targetPower = OUTPOST_TIER_TARGET_POWER[outpost.tier];
  const npcShips = generateFallbackFleet(targetPower, pickWaveProfile('outpost'));

  const result = await runCombatInWorker({
    sideAShips: deployment.ships,
    sideBShips: npcShips,
    research: state.research,
    playerClass: state.playerClass,
    kampfBoostActive: isBoosterActive(state, 'kampf'),
    shipModules: state.shipModules,
  });

  const npcIds = Object.keys(npcShips);
  const won = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);

  const playerResults: CombatUnitResult[] = Object.keys(deployment.ships).map((id) => {
    const eff = getEffectiveStats(id, state.research, {}, isBoosterActive(state, 'kampf'), state.playerClass, state.shipModules);
    const sent = deployment.ships[id];
    const survived = result.survivorsA[id] || 0;
    deployment.ships[id] = survived;
    return {
      id,
      name: shipName(id),
      sent,
      survived,
      lost: sent - survived,
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
  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const eff = baseStats(id);
    const sent = npcShips[id];
    const survivedCount = result.survivorsB[id] || 0;
    return {
      id,
      name: shipName(id),
      count: sent,
      waffen: Math.round(eff.waffen),
      schild: Math.round(eff.schild),
      panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0),
      dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
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

  let outcome: string;
  if (won) {
    outpost.ownerSide = 'players';
    outpost.ownerSince = Date.now();
    const survivors: Record<string, number> = {};
    Object.entries(deployment.ships).forEach(([id, qty]) => {
      if (qty > 0) survivors[id] = qty;
    });
    outpost.garrison = survivors;
    saveOutpost(outpost);
    outcome = 'Außenposten erobert';
  } else {
    // Niederlage/Teilerfolg - Posten bleibt piraten-eigen, Ueberlebende kehren automatisch heim.
    Object.entries(deployment.ships).forEach(([id, qty]) => {
      if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
    });
    outcome = 'Eroberung gescheitert';
  }

  const detail: CombatDetail = {
    sektorName: `Außenposten 1:${outpost.system}:${outpost.position} (${outpost.tier})`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
  };
  pushMessage(state, 'kampf', `Angriff auf Außenposten 1:${outpost.system}:${outpost.position}: ${outcome}.`, detail);
}

// ========== PIRATEN-KI: OPPORTUNISTISCHE RUECKEROBERUNG ==========
// Einmal pro Heartbeat (siehe heartbeat.ts, analog zu runAllPirateBaseTurns()) - fuer jeden
// spieler-eigenen Posten eine Chance, dass die Piraten einen Rueckeroberungsversuch starten.
// Bewusst OHNE simulierte Anflugzeit (die Piraten "erscheinen" direkt beim Heartbeat-Tick) - eine
// echte Flugzeit-Simulation braeuchte eine Piraten-Ausgangsposition/-Flotte, die es hier (anders
// als bei Raids/PIRATE_BASES) nicht gibt, und wuerde den Nutzen fuer wenig zusaetzlichen Wert stark
// verkomplizieren.
export async function runOutpostPirateAiTurn(): Promise<void> {
  const outposts = loadAllOutposts().filter((o) => o.ownerSide === 'players');
  if (outposts.length === 0) return;

  for (const outpost of outposts) {
    if (Math.random() >= OUTPOST_PIRATE_ATTACK_CHANCE) continue;

    const targetPower = OUTPOST_TIER_TARGET_POWER[outpost.tier];
    const advantage = OUTPOST_PIRATE_ADVANTAGE_ROLL[Math.floor(Math.random() * OUTPOST_PIRATE_ADVANTAGE_ROLL.length)];
    const npcShips = generateFallbackFleet(targetPower * advantage, pickWaveProfile('outpost'));
    const npcIds = Object.keys(npcShips);

    const totalGarrison = Object.values(outpost.garrison).reduce((a, b) => a + (b || 0), 0);
    if (totalGarrison === 0) {
      // Unverteidigt - fallen kampflos zurueck an die Piraten.
      outpost.ownerSide = 'pirates';
      outpost.garrison = {};
      saveOutpost(outpost);
      notifyHumans(`Piraten haben den unverteidigten Außenposten 1:${outpost.system}:${outpost.position} kampflos zurückerobert.`);
      continue;
    }

    const result = await runCombatInWorker({
      sideAShips: outpost.garrison,
      sideBShips: npcShips,
      research: {},
      allowRetreat: false,
    });

    const garrisonWon = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);
    if (garrisonWon) {
      const survivors: Record<string, number> = {};
      Object.entries(outpost.garrison).forEach(([id]) => {
        survivors[id] = result.survivorsA[id] || 0;
      });
      outpost.garrison = survivors;
      saveOutpost(outpost);
      notifyHumans(`Piraten-Angriff auf euren Außenposten 1:${outpost.system}:${outpost.position} abgewehrt - Garnison hat Verluste erlitten, aber gehalten.`);
    } else {
      outpost.ownerSide = 'pirates';
      outpost.garrison = {};
      saveOutpost(outpost);
      notifyHumans(`Piraten haben euren Außenposten 1:${outpost.system}:${outpost.position} zurückerobert - die Garnison wurde vernichtet.`);
    }
  }
}

function notifyHumans(text: string): void {
  listAllUsers().forEach((u) => {
    if (u.isBot) return;
    const state = loadPlayerState(u.id);
    pushMessage(state, 'kampf', text);
    savePlayerState(state);
  });
}
