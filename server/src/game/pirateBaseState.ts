import { PIRATE_BASES, PIRATE_BASE_IDS, ACTIVE_PIRATE_BASE_IDS } from './data/galaxyConstants.js';
import { getPirateBaseJson, listPirateBasesJson, savePirateBaseJson } from '../db.js';
import { galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost } from './galaxy.js';
import { baseStats, combatFleetPowerBase, shipName, getEffectiveStats } from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { isBoosterActive } from './boosterUtil.js';
import { pushMessage } from './messages.js';
import { DEFENSES } from './data/defenses.js';
import type { PlayerState, PirateBaseState, PirateAttackDeployment, GalaxyPosition, CombatUnitResult, CombatDetail } from './types.js';
import type { ActionResult } from './actions.js';

// ========== PIRATENBASEN: PERSISTENTER ZUSTAND (ANGREIFBAR) ==========
// Nutzerentscheidung (Juli 2026): Piratenbasen bekommen einen eigenen, angreifbaren Zustand
// (Flotte/Verteidigung/Ressourcen wie ein Mini-KI-Spieler), unabhaengig von den normalen Raids
// (die generieren ihre Gegnerflotte weiterhin frisch bei Wellen-Ankunft, siehe raids.ts - beide
// Systeme laufen komplett getrennt nebeneinander her). Basen koennen NICHT zerstoert werden,
// wachsen aber langsam von selbst nach (siehe applyGrowth unten) - bewusst nur ACTIVE_PIRATE_BASE_IDS
// (4 von 12 Positionen) aktiv, um bei nur 2 Spielern + 2 KI-Bots nicht zu ueberfordern.

const POSITION_BY_ID = new Map<string, GalaxyPosition>(PIRATE_BASE_IDS.map((id, i) => [id, PIRATE_BASES[i]]));

// Passives Ressourcen-Wachstum (pro Stunde), gedeckelt auf PIRATE_BASE_RESOURCE_CAP_HOURS Stunden
// Vorrat - verhindert, dass eine lange nicht angegriffene Basis unbegrenzt Ressourcen anhaeuft.
const PIRATE_BASE_RESOURCE_RATE = { metall: 4000, kristall: 2500, deuterium: 1200 };
const PIRATE_BASE_RESOURCE_CAP_HOURS = 24;

// Flotten-/Verteidigungs-Wachstum: alle PIRATE_BASE_GROWTH_INTERVAL_MS ein kleiner Schub auf einen
// rotierenden Schiffs-/Verteidigungstyp (deterministisch nach absoluter Zeit, nicht nach zuletzt
// verarbeitetem Zeitpunkt - damit eine lange nicht geladene Basis beim naechsten Laden nicht alle
// verpassten Schuebe auf einmal nachholt, sondern einfach beim aktuellen Rotations-Index weitermacht).
const PIRATE_BASE_GROWTH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const PIRATE_BASE_GROWTH_SHIP_IDS = ['leicht', 'schwer', 'kreuzer'];
const PIRATE_BASE_GROWTH_DEFENSE_IDS = ['raketenwerfer', 'leichteslaser'];
const PIRATE_BASE_GROWTH_SHIP_STEP = 3;
const PIRATE_BASE_GROWTH_DEFENSE_STEP = 2;
const PIRATE_BASE_MAX_SHIPS_PER_TYPE = 120;
const PIRATE_BASE_MAX_DEFENSE_PER_TYPE = 80;

// Anteil der AKTUELL gelagerten Basis-Ressourcen, der bei einem erfolgreichen Angriff gestohlen
// wird (nicht vom Basis-Maximum, siehe RAID_LOOT_PERCENT-Vorbild in raids.ts fuer dasselbe Muster).
const PIRATE_BASE_LOOT_PERCENT = 0.35;

function seedPirateBase(id: string): PirateBaseState {
  const pos = POSITION_BY_ID.get(id)!;
  return {
    id,
    system: pos.system,
    position: pos.position,
    fleet: { leicht: 20, schwer: 8 },
    defense: { raketenwerfer: 15, leichteslaser: 8 },
    resources: { metall: 40000, kristall: 25000, deuterium: 12000 },
    lastGrowthAt: Date.now(),
  };
}

// Einmalig beim Serverstart aufgerufen (analog ensureBotUsers()) - legt fehlende aktive Basen an,
// laesst bereits vorhandene unangetastet.
export function ensurePirateBases(): void {
  ACTIVE_PIRATE_BASE_IDS.forEach((id) => {
    if (!getPirateBaseJson(id)) {
      savePirateBaseJson(id, JSON.stringify(seedPirateBase(id)));
    }
  });
}

function applyGrowth(base: PirateBaseState, now: number): void {
  const elapsedHours = Math.max(0, (now - base.lastGrowthAt) / 3600000);
  if (elapsedHours > 0) {
    (['metall', 'kristall', 'deuterium'] as const).forEach((res) => {
      const cap = PIRATE_BASE_RESOURCE_RATE[res] * PIRATE_BASE_RESOURCE_CAP_HOURS;
      base.resources[res] = Math.min(cap, base.resources[res] + PIRATE_BASE_RESOURCE_RATE[res] * elapsedHours);
    });
  }

  const prevTick = Math.floor(base.lastGrowthAt / PIRATE_BASE_GROWTH_INTERVAL_MS);
  const currentTick = Math.floor(now / PIRATE_BASE_GROWTH_INTERVAL_MS);
  for (let t = prevTick + 1; t <= currentTick; t++) {
    const shipId = PIRATE_BASE_GROWTH_SHIP_IDS[t % PIRATE_BASE_GROWTH_SHIP_IDS.length];
    base.fleet[shipId] = Math.min(PIRATE_BASE_MAX_SHIPS_PER_TYPE, (base.fleet[shipId] || 0) + PIRATE_BASE_GROWTH_SHIP_STEP);
    const defId = PIRATE_BASE_GROWTH_DEFENSE_IDS[t % PIRATE_BASE_GROWTH_DEFENSE_IDS.length];
    base.defense[defId] = Math.min(PIRATE_BASE_MAX_DEFENSE_PER_TYPE, (base.defense[defId] || 0) + PIRATE_BASE_GROWTH_DEFENSE_STEP);
  }
  base.lastGrowthAt = now;
}

export function loadPirateBase(id: string): PirateBaseState | null {
  const json = getPirateBaseJson(id);
  if (!json) return null;
  const base = JSON.parse(json) as PirateBaseState;
  applyGrowth(base, Date.now());
  savePirateBaseJson(id, JSON.stringify(base));
  return base;
}

function savePirateBase(base: PirateBaseState): void {
  savePirateBaseJson(base.id, JSON.stringify(base));
}

export function listActivePirateBases(): PirateBaseState[] {
  return ACTIVE_PIRATE_BASE_IDS.map((id) => loadPirateBase(id)).filter((b): b is PirateBaseState => b !== null);
}

// Leichtgewichtige Anzeige-Zusammenfassung fuer die Galaxie-Uebersicht (siehe routes.ts) - keine
// exakten Zahlen, nur ein grober Machtwert, den der Client z.B. als Bedrohungsstufe anzeigen kann.
export interface PirateBaseSummary {
  id: string;
  system: number;
  position: number;
  power: number;
}

export function listActivePirateBaseSummaries(): PirateBaseSummary[] {
  return listActivePirateBases().map((b) => ({
    id: b.id,
    system: b.system,
    position: b.position,
    power: Math.round(combatFleetPowerBase({ ...b.fleet, ...b.defense })),
  }));
}

// ========== ANGRIFF STARTEN ==========

export function startPirateBaseAttack(state: PlayerState, baseId: string, ships: Record<string, number>): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  if (!ACTIVE_PIRATE_BASE_IDS.includes(baseId)) return { ok: false, error: 'Unbekannte oder nicht angreifbare Piratenbasis.' };

  const selected: Record<string, number> = {};
  for (const [id, qty] of Object.entries(ships)) {
    if (qty > 0) {
      if ((state.fleet[id] || 0) < qty) return { ok: false, error: 'Nicht genug Schiffe verfügbar.' };
      selected[id] = qty;
    }
  }
  if (Object.keys(selected).length === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };

  const targetPos = POSITION_BY_ID.get(baseId)!;
  const distance = galaxyDistance(state.galaxyPosition, targetPos);
  const speed = galaxyFleetSpeed(selected, state.research, state.playerClass, state.shipModules);
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return { ok: false, error: 'Diese Flotte kann nicht fliegen (keine Geschwindigkeit).' };
  const fuelCost = galaxyFuelCost(selected, distance);
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium für Hin- und Rückflug (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  Object.entries(selected).forEach(([id, qty]) => {
    state.fleet[id] -= qty;
  });

  const now = Date.now();
  const deployment: PirateAttackDeployment = {
    id: 'pbatt_' + now + '_' + baseId,
    baseId,
    ships: selected,
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: targetPos.system,
    targetPosition: targetPos.position,
    startTime: now,
    arriveTime: now + travelMs,
    returnTime: now + travelMs * 2,
    resolved: false,
  };
  state.pirateAttacks.push(deployment);
  return { ok: true };
}

// ========== ANGRIFF VERARBEITEN (Ankunft = Kampf, Rueckkehr = Flotte heimkehren lassen) ==========

export async function processPirateAttacks(state: PlayerState): Promise<void> {
  const now = Date.now();
  for (const deployment of state.pirateAttacks) {
    if (!deployment.resolved && deployment.arriveTime <= now) {
      await resolvePirateBaseAttack(state, deployment);
    }
  }
  state.pirateAttacks = state.pirateAttacks.filter((deployment) => {
    if (deployment.returnTime <= now) {
      Object.entries(deployment.ships).forEach(([id, qty]) => {
        if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
      });
      return false;
    }
    return true;
  });
}

async function resolvePirateBaseAttack(state: PlayerState, deployment: PirateAttackDeployment): Promise<void> {
  deployment.resolved = true;
  const base = loadPirateBase(deployment.baseId);
  if (!base) {
    pushMessage(state, 'kampf', `Angriff auf Piratenbasis ${deployment.targetSystem}:${deployment.targetPosition} fehlgeschlagen - Basis nicht auffindbar. Flotte kehrt leer zurück.`);
    return;
  }

  const npcCombined: Record<string, number> = {};
  Object.entries(base.fleet).forEach(([id, qty]) => {
    if (qty > 0) npcCombined[id] = qty;
  });
  Object.entries(base.defense).forEach(([id, qty]) => {
    if (qty > 0) npcCombined[id] = (npcCombined[id] || 0) + qty;
  });
  const npcIds = Object.keys(npcCombined);

  let anyNpcDestroyed = false;
  let npcResults: CombatUnitResult[] = [];
  let playerResults: CombatUnitResult[] = [];
  let roundsFought = 0;

  if (npcIds.length === 0) {
    // Basis war leer (leergefarmt oder noch nicht nachgewachsen) - kein Kampf noetig, direkter Loot.
    anyNpcDestroyed = true;
  } else {
    const result = await runCombatInWorker({
      sideAShips: deployment.ships,
      sideBShips: npcCombined,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: isBoosterActive(state, 'kampf'),
      shipModules: state.shipModules,
    });
    roundsFought = result.roundsFought;

    npcResults = npcIds.map((id) => {
      const isDefenseUnit = DEFENSES.some((d) => d.id === id);
      const base2 = baseStats(id);
      const sent = npcCombined[id];
      const survivedCount = result.survivorsB[id] || 0;
      const destroyedCount = sent - survivedCount;
      if (destroyedCount > 0) anyNpcDestroyed = true;
      if (isDefenseUnit) base.defense[id] = survivedCount;
      else base.fleet[id] = survivedCount;
      return {
        id,
        name: shipName(id),
        count: sent,
        waffen: Math.round(base2.waffen),
        schild: Math.round(base2.schild),
        panzerung: Math.round(base2.panzerung),
        dmgTaken: Math.round(result.dmgTakenB[id] || 0),
        dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
        destroyedCount,
        survivedCount,
        destroyed: survivedCount <= 0,
        isDefense: isDefenseUnit,
        shotsFired: result.shotsB.shotsFired[id] || 0,
        hits: result.shotsB.hits[id] || 0,
        rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
        shieldRegen: Math.round(result.shieldRegenB[id] || 0),
      };
    });

    playerResults = Object.keys(deployment.ships).map((id) => {
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
  }

  let lootText = '';
  let loot: { metall: number; kristall: number; deuterium: number } | undefined;
  if (anyNpcDestroyed) {
    loot = {
      metall: Math.round(base.resources.metall * PIRATE_BASE_LOOT_PERCENT),
      kristall: Math.round(base.resources.kristall * PIRATE_BASE_LOOT_PERCENT),
      deuterium: Math.round(base.resources.deuterium * PIRATE_BASE_LOOT_PERCENT),
    };
    base.resources.metall -= loot.metall;
    base.resources.kristall -= loot.kristall;
    base.resources.deuterium -= loot.deuterium;
    state.resources.metall += loot.metall;
    state.resources.kristall += loot.kristall;
    state.resources.deuterium += loot.deuterium;
    state.stats.resourcesLooted += loot.metall + loot.kristall + loot.deuterium;
    lootText = ` Beute erbeutet: ${loot.metall.toLocaleString('de-DE')} Metall, ${loot.kristall.toLocaleString('de-DE')} Kristall, ${loot.deuterium.toLocaleString('de-DE')} Deuterium.`;
  }

  savePirateBase(base);

  const outcome = npcIds.length === 0 ? 'Basis leer vorgefunden' : anyNpcDestroyed ? 'Angriff erfolgreich' : 'Angriff abgewehrt - keine Verluste beim Gegner';
  const messageText = `Angriff auf Piratenbasis ${deployment.targetSystem}:${deployment.targetPosition}: ${outcome}.${lootText}`;
  const detail: CombatDetail = {
    sektorName: `Piratenbasis ${deployment.targetSystem}:${deployment.targetPosition}`,
    outcome,
    roundsFought,
    npcResults,
    playerResults,
    rewards: loot ? { metall: loot.metall, kristall: loot.kristall, deuterium: loot.deuterium } : undefined,
  };
  pushMessage(state, 'kampf', messageText, detail);
}
