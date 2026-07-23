import { PIRATE_BASES, PIRATE_BASE_IDS, ACTIVE_PIRATE_BASE_IDS } from './data/galaxyConstants.js';
import { getPirateBaseJson, savePirateBaseJson } from '../db.js';
import { galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost } from './galaxy.js';
import { outpostSpeedMultiplierForSystem } from './outposts.js';
import { combatFleetPowerBase, shipName, getEffectiveStats } from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { isBoosterActive } from './boosterUtil.js';
import { pushMessage } from './messages.js';
import { DEFENSES } from './data/defenses.js';
import { defaultPlayerState } from './state.js';
import { runEconomyTick } from './actions.js';
import { runEconomyBotTurn } from './economyBotTurn.js';
import type {
  PlayerState,
  PirateBaseState,
  PirateAttackDeployment,
  GalaxyPosition,
  CombatUnitResult,
  CombatDetail,
  CombatStats,
} from './types.js';
import type { ActionResult } from './actions.js';

// ========== PIRATENBASEN: WACHSEN "GENAU WIE EIN SPIELER" (ANGREIFBAR) ==========
// Nutzerentscheidung (Juli 2026): Piratenbasen bekommen einen vollwertigen PlayerState - eigene
// Wirtschaft, Forschung, Gebaeude, Flotten-/Verteidigungsbau, Asteroiden-Mining, genau wie ein
// KI-Mitspieler (siehe economyBotTurn.ts/runEconomyTick() in actions.ts, beide auch von bot.ts
// genutzt). KEINE kuenstlichen Obergrenzen mehr - Wachstum ist nur durch dieselben
// wirtschaftlichen Grenzen begrenzt wie bei einem echten Spieler (Energie, Bauslots,
// Ressourcenertrag). Komplett unabhaengig vom normalen Raid-System (generiert seine Gegnerflotte
// weiterhin frisch bei Wellen-Ankunft, siehe raids.ts - keine Beruehrungspunkte). Koennen NICHT
// zerstoert werden (Nutzerentscheidung) - bewusst nur ACTIVE_PIRATE_BASE_IDS (4 von 12
// Positionen) aktiv, um die Galaxie-Uebersicht nicht zu ueberfrachten.
//
// WICHTIG (Zirkelimport-Vermeidung): actions.ts importierte frueher `processPirateAttacks` aus
// dieser Datei - das haette einen Zirkelbezug erzeugt, sobald diese Datei umgekehrt
// `runEconomyTick` aus actions.ts braucht. Der `processPirateAttacks()`-Aufruf wurde deshalb aus
// `tick()` HERAUSGENOMMEN und wird jetzt explizit an den beiden tick()-Aufrufstellen
// (routes.ts handleAction(), heartbeat.ts) direkt danach aufgerufen. Aus demselben Grund liegt die
// wiederverwendbare Wirtschafts-Entscheidungslogik (Gebaeude/Forschung/Schiffe/Verteidigung/
// Mining) in economyBotTurn.ts statt in bot.ts (das seinerseits `startPirateBaseAttack` aus
// DIESER Datei importiert - ein Import in die Gegenrichtung waere sonst ebenfalls ein Zirkelbezug).

const POSITION_BY_ID = new Map<string, GalaxyPosition>(PIRATE_BASE_IDS.map((id, i) => [id, PIRATE_BASES[i]]));

// Garantiert negative Ids (echte Nutzer-Ids sind autoinkrementiert und damit immer positiv) -
// kollidieren nie mit echten Spielern, tauchen daher nie in `users`/listAllUsers() auf und damit
// auch nie in Bestenliste/Multiplayer-Einladungen/"bei mir halten"-Listen (siehe PirateBaseState-
// Kommentar in types.ts).
const SYNTHETIC_USER_ID_BASE = -1000;
function syntheticUserIdFor(id: string): number {
  return SYNTHETIC_USER_ID_BASE - PIRATE_BASE_IDS.indexOf(id);
}

// Start-/Mindestbestand (Nutzerentscheidung Juli 2026: eine frisch angelegte Basis war vorher so
// schwach, dass ein Angriff kaum lohnende Beute abwarf) - dient sowohl als Startwert fuer neue
// Basen als auch als Mindestwert bei der Migration bereits bestehender (alter) Basen. Ab hier
// wachsen Basen komplett eigenstaendig ueber runEconomyBotTurn()/runEconomyTick(), keine fixen
// Wachstumsschritte/Obergrenzen mehr.
const SEED_FLEET: Record<string, number> = { leicht: 60, schwer: 25, kreuzer: 10 };
const SEED_DEFENSE: Record<string, number> = { raketenwerfer: 40, leichteslaser: 25 };
const SEED_RESOURCES = { metall: 150000, kristall: 90000, deuterium: 40000 };
// Kleine Mining-Basis als Wirtschafts-Starthilfe, sonst haette eine frische Basis zwar Ressourcen,
// aber keine eigene Produktion und wuerde nach dem Verbrauchen des Startkapitals stagnieren.
const SEED_BUILDINGS: Record<string, number> = { metallmine: 4, kristallmine: 3, deuteriummine: 2, solarkraftwerk: 4 };

function buildSeedState(id: string): PlayerState {
  const pos = POSITION_BY_ID.get(id)!;
  const state = defaultPlayerState(syntheticUserIdFor(id));
  state.galaxyPosition = { system: pos.system, position: pos.position };
  state.resources = { ...SEED_RESOURCES, dm: 0 };
  Object.entries(SEED_FLEET).forEach(([shipId, qty]) => (state.fleet[shipId] = qty));
  Object.entries(SEED_DEFENSE).forEach(([defId, qty]) => (state.defense[defId] = qty));
  Object.entries(SEED_BUILDINGS).forEach(([buildingId, level]) => (state.buildings[buildingId] = level));
  return state;
}

function seedPirateBase(id: string): PirateBaseState {
  const pos = POSITION_BY_ID.get(id)!;
  return { id, system: pos.system, position: pos.position, state: buildSeedState(id) };
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

// Migration (Nutzerentscheidung Juli 2026, "Piraten sollen genau wie Spieler wachsen"-Umbau):
// bestehende Basen aus dem VORHERIGEN, schlanken System (nur {fleet, defense, resources,
// lastGrowthAt}, siehe Git-Historie) haben kein `state`-Feld - werden hier auf einen vollwertigen
// PlayerState umgestellt, ihr bisheriger Bestand fliesst dabei (nach oben angehoben auf den neuen
// Mindestwert) mit ein, damit keine bereits erspielte Staerke verloren geht.
function isLegacyShape(raw: any): boolean {
  return raw && typeof raw === 'object' && !raw.state;
}

function migrateLegacyBase(raw: any, id: string): PirateBaseState {
  const pos = POSITION_BY_ID.get(id)!;
  const state = buildSeedState(id);
  Object.entries(SEED_FLEET).forEach(([shipId]) => {
    state.fleet[shipId] = Math.max(state.fleet[shipId] || 0, raw.fleet?.[shipId] || 0);
  });
  Object.entries(SEED_DEFENSE).forEach(([defId]) => {
    state.defense[defId] = Math.max(state.defense[defId] || 0, raw.defense?.[defId] || 0);
  });
  (['metall', 'kristall', 'deuterium'] as const).forEach((res) => {
    state.resources[res] = Math.max(state.resources[res] || 0, raw.resources?.[res] || 0);
  });
  return { id, system: pos.system, position: pos.position, state };
}

// Lazy bei jedem Laden angewendet (Angriff/Spionage/Galaxie-Ansicht) UND explizit einmal pro
// Heartbeat fuer ALLE aktiven Basen (siehe runAllPirateBaseTurns() unten, aufgerufen aus
// heartbeat.ts) - so wachsen Basen auch dann weiter, wenn gerade niemand hinschaut, genau wie ein
// KI-Mitspieler.
export async function loadPirateBase(id: string): Promise<PirateBaseState | null> {
  const json = getPirateBaseJson(id);
  if (!json) return null;
  const raw = JSON.parse(json);
  const base: PirateBaseState = isLegacyShape(raw) ? migrateLegacyBase(raw, id) : (raw as PirateBaseState);
  await runEconomyTick(base.state);
  runEconomyBotTurn(base.state);
  savePirateBaseJson(id, JSON.stringify(base));
  return base;
}

function savePirateBase(base: PirateBaseState): void {
  savePirateBaseJson(base.id, JSON.stringify(base));
}

export async function listActivePirateBases(): Promise<PirateBaseState[]> {
  const bases = await Promise.all(ACTIVE_PIRATE_BASE_IDS.map((id) => loadPirateBase(id)));
  return bases.filter((b): b is PirateBaseState => b !== null);
}

// Treibt alle aktiven Piratenbasen einmal pro Heartbeat an (siehe heartbeat.ts) - reine
// Bequemlichkeitsfunktion, `loadPirateBase()` macht bereits die eigentliche Arbeit.
export async function runAllPirateBaseTurns(): Promise<void> {
  await listActivePirateBases();
}

// Leichtgewichtige Anzeige-Zusammenfassung fuer die Galaxie-Uebersicht (siehe routes.ts) - keine
// exakten Zahlen, nur ein grober Machtwert, den der Client z.B. als Bedrohungsstufe anzeigen kann.
export interface PirateBaseSummary {
  id: string;
  system: number;
  position: number;
  power: number;
}

export async function listActivePirateBaseSummaries(): Promise<PirateBaseSummary[]> {
  const bases = await listActivePirateBases();
  return bases.map((b) => ({
    id: b.id,
    system: b.system,
    position: b.position,
    power: Math.round(combatFleetPowerBase({ ...b.state.fleet, ...b.state.defense })),
  }));
}

// Anteil der AKTUELL gelagerten Basis-Ressourcen, der bei einem erfolgreichen Angriff gestohlen
// wird (nicht vom Basis-Maximum, siehe RAID_LOOT_PERCENT-Vorbild in raids.ts fuer dasselbe Muster).
const PIRATE_BASE_LOOT_PERCENT = 0.35;

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
  const bonus = outpostSpeedMultiplierForSystem(state.galaxyPosition.system, targetPos.system);
  const speed = galaxyFleetSpeed(selected, state.research, state.playerClass, state.shipModules) * bonus;
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return { ok: false, error: 'Diese Flotte kann nicht fliegen (keine Geschwindigkeit).' };
  const fuelCost = galaxyFuelCost(selected, distance, state);
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
  const base = await loadPirateBase(deployment.baseId);
  if (!base) {
    pushMessage(state, 'kampf', `Angriff auf Piratenbasis ${deployment.targetSystem}:${deployment.targetPosition} fehlgeschlagen - Basis nicht auffindbar. Flotte kehrt leer zurück.`);
    return;
  }
  const pState = base.state;

  const npcCombined: Record<string, number> = {};
  Object.entries(pState.fleet).forEach(([id, qty]) => {
    if (qty > 0) npcCombined[id] = qty;
  });
  Object.entries(pState.defense).forEach(([id, qty]) => {
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
    // Die Piratenbasis wirtschaftet jetzt "genau wie ein Spieler" (eigene Forschung/Klasse) -
    // ihre effektiven Kampfwerte werden deshalb genau wie bei einem echten Spieler ueber
    // getEffectiveStats() berechnet und per sideBStatsOverride durchgereicht (dasselbe bereits
    // bestehende Muster wie beim Piratenkapitaen/Piratenadmiral), statt der vorherigen reinen
    // baseStats() ohne jeden Bonus.
    const sideBStatsOverride: Record<string, CombatStats> = {};
    npcIds.forEach((id) => {
      sideBStatsOverride[id] = getEffectiveStats(
        id,
        pState.research,
        pState.defense,
        isBoosterActive(pState, 'kampf'),
        pState.playerClass,
        pState.shipModules
      );
    });

    const result = await runCombatInWorker({
      sideAShips: deployment.ships,
      sideBShips: npcCombined,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: isBoosterActive(state, 'kampf'),
      shipModules: state.shipModules,
      sideBStatsOverride,
    });
    roundsFought = result.roundsFought;

    npcResults = npcIds.map((id) => {
      const isDefenseUnit = DEFENSES.some((d) => d.id === id);
      const eff = sideBStatsOverride[id];
      const sent = npcCombined[id];
      const survivedCount = result.survivorsB[id] || 0;
      const destroyedCount = sent - survivedCount;
      if (destroyedCount > 0) anyNpcDestroyed = true;
      if (isDefenseUnit) pState.defense[id] = survivedCount;
      else pState.fleet[id] = survivedCount;
      return {
        id,
        name: shipName(id),
        count: sent,
        waffen: Math.round(eff.waffen),
        schild: Math.round(eff.schild),
        panzerung: Math.round(eff.panzerung),
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
      metall: Math.round(pState.resources.metall * PIRATE_BASE_LOOT_PERCENT),
      kristall: Math.round(pState.resources.kristall * PIRATE_BASE_LOOT_PERCENT),
      deuterium: Math.round(pState.resources.deuterium * PIRATE_BASE_LOOT_PERCENT),
    };
    pState.resources.metall -= loot.metall;
    pState.resources.kristall -= loot.kristall;
    pState.resources.deuterium -= loot.deuterium;
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
