import { PIRATE_BASES, PIRATE_BASE_IDS, ACTIVE_PIRATE_BASE_IDS } from './data/galaxyConstants.js';
import { getPirateBaseJson, savePirateBaseJson } from '../db.js';
import { galaxyDistance, galaxyFleetSpeed, galaxyDurationMs, galaxyFuelCost } from './galaxy.js';
import { combatFleetPowerBase, shipName, getEffectiveStats } from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { isBoosterActive } from './boosterUtil.js';
import { pushMessage } from './messages.js';
import { DEFENSES } from './data/defenses.js';
import { defaultPlayerState, loadPlayerState, savePlayerState } from './state.js';
import { runEconomyTick } from './actions.js';
import { runEconomyBotTurn } from './economyBotTurn.js';
import type {
  PlayerState,
  PirateBaseState,
  PirateAttackDeployment,
  PirateBaseOffensiveDeployment,
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

// Start-/Mindestbestand. Seit Entfernung der Piratenbasen-Autonomie (README Punkt 98, 28.07.2026)
// bauen Basen selbst NICHTS mehr dazu - dieser Bestand ist damit nicht mehr nur ein "Startwert",
// sondern die DAUERHAFTE Garnisonsstaerke jeder aktiven Basis. Nutzerentscheidung (28.07.2026,
// zweite Ueberarbeitung): auf "stark" angehoben - eine feste Wache dieser Groessenordnung soll auch
// grosse Spieler-Flotten ernsthaft fordern, nicht nur symbolischen Widerstand leisten. Bewusst
// gemischte Tier-Zusammensetzung statt nur billiger Fodder-Schiffe (analog zum "kampfgruppe"/
// "elitekader"-Wellenprofil, siehe pickWaveProfile() in combat.ts). Salvenschiffe/Imperator
// bewusst NICHT enthalten (README Punkt 24: MUESSEN aus jeder NPC-Flottengenerierung ausgeschlossen
// bleiben). Mehrere Typen liegen bewusst ueber STACK_AGGREGATE_THRESHOLD (300) - lastet die neue
// Aggregat-Kampf-Engine aus, bleibt aber performant (siehe README Punkt 103).
// Dient weiterhin als Mindestwert bei der Migration bereits bestehender (alter, schwaecherer)
// Basen (siehe migrateLegacyBase() UND der Floor-Up-Schritt in loadPirateBase() unten) - eine
// Basis kann durch eine spaetere Anhebung dieser Konstanten also nachtraeglich staerker werden,
// aber nie schwaecher.
const SEED_FLEET: Record<string, number> = {
  leicht: 2000, schwer: 1500, kreuzer: 800, schlachtschiff: 400, bomber: 300, schlachtkreuzer: 150, zerstoerer: 100, reaper: 50,
};
const SEED_DEFENSE: Record<string, number> = {
  raketenwerfer: 400, leichteslaser: 300, schwereslaser: 200, gausskanone: 100, ionengeschuetz: 80, plasmawerfer: 40,
};
const SEED_RESOURCES = { metall: 150000, kristall: 90000, deuterium: 40000 };

// Ressourcen-Obergrenze (Nutzerentscheidung 28.07.2026, NACHKALIBRIERT): Basen produzieren
// weiterhin passiv ueber runEconomyTick() (siehe Kommentar bei loadPirateBase()), koennen ihre
// Bestaende aber seit der Autonomie-Entfernung nie mehr selbst ausgeben - ohne Deckel waeren sie
// mit der Zeit unbegrenzt reich geworden, ohne dass sich ihre Staerke (SEED_FLEET/SEED_DEFENSE)
// mitveraendert haette.
// Der erste Wurf (15M/9M/4M) war zu niedrig angesetzt, OHNE gegen die tatsaechliche passive
// Produktionsrate der SEED_BUILDINGS (unten) gegengerechnet zu werden: Metallmine Stufe 4 mit dem
// NPC_PRODUCTION_BONUS_MULTIPLIER (1,5x) produziert ~87.800 Metall/h - der alte Deckel war damit
// bereits nach ~7-9 Tagen erreicht und kappte danach jedes weitere Wachstum, obwohl die Basis noch
// lange nicht "ausgereift" war. Neu kalibriert auf ~3 Wochen (504h) ungebremstes Wachstum bis zum
// Anschlag, im Verhaeltnis der TATSAECHLICHEN Produktionsraten (Metall:Kristall:Deuterium ≈
// 7,3:3,3:1, nicht das willkuerliche SEED_RESOURCES-Verhaeltnis von vorher) - eine "reife" Basis
// liefert damit bei PIRATE_BASE_LOOT_PERCENT=0.35 pro vollem Beutezug ca. 15,4M/7M/2,1M, spuerbar
// mehr als ein Silber-Container und in Metall-Reichweite eines Gold-Containers - angemessen fuer
// eine Basis, die eine ~5.300-Schiffe-Garnison durchbrechen muss.
const RESOURCE_CAP = { metall: 44000000, kristall: 20000000, deuterium: 6000000 };
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
  return { id, system: pos.system, position: pos.position, state: buildSeedState(id), attacks: [], nextOffensiveCheck: null };
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
  return { id, system: pos.system, position: pos.position, state, attacks: [], nextOffensiveCheck: null };
}

// Lazy bei jedem Laden angewendet (Angriff/Spionage/Galaxie-Ansicht) UND explizit einmal pro
// Heartbeat fuer ALLE aktiven Basen (siehe listActivePirateBases(), aufgerufen aus heartbeat.ts ueber
// runAllPirateBaseOffensiveTurns()) - Basen wachsen throttled wieder eigenstaendig (30.07.2026,
// README Punkt 127, Korrektur derselben Wiedereinfuehrung wie die KI-Mitspieler): bauen/forschen/
// minen genau wie ein KI-Mitspieler (runEconomyBotTurn(), inkl. Asteroiden-Mining-Fluegen in
// bekannte, KAMPFFREIE Sektoren - siehe maybeSendMiningFleet() in economyBotTurn.ts). Bewusst
// UNGEDROSSELT (wie bei den Bots) - loest selbst NIE Kampf aus, nur die Offensiv-KI unten tut das,
// und die ist ueber einen langen Cooldown stark gedrosselt.
export async function loadPirateBase(id: string): Promise<PirateBaseState | null> {
  const json = getPirateBaseJson(id);
  if (!json) return null;
  const raw = JSON.parse(json);
  const base: PirateBaseState = isLegacyShape(raw) ? migrateLegacyBase(raw, id) : (raw as PirateBaseState);
  if (!base.attacks) base.attacks = []; // Bestandsdaten von vor der Offensiv-KI (siehe runPirateBaseOffensiveTurn())
  if (base.nextOffensiveCheck === undefined) base.nextOffensiveCheck = null; // Bestandsdaten von vor dem Cooldown-Umbau
  // Floor-Up (Nutzerentscheidung 28.07.2026): garantiert die dauerhafte Mindest-Garnisonsstaerke
  // (SEED_FLEET/SEED_DEFENSE) - eine Basis kann durch Wachstum staerker werden, aber nie unter
  // diesen Mindestwert fallen (weder durch eine spaetere Anhebung der Konstante bei alten Basen,
  // noch durch Verluste aus einem Angriff - "unzerstoerbare Basis"-Design, siehe Kommentar oben).
  Object.entries(SEED_FLEET).forEach(([shipId, qty]) => {
    base.state.fleet[shipId] = Math.max(base.state.fleet[shipId] || 0, qty);
  });
  Object.entries(SEED_DEFENSE).forEach(([defId, qty]) => {
    base.state.defense[defId] = Math.max(base.state.defense[defId] || 0, qty);
  });
  await runEconomyTick(base.state);
  runEconomyBotTurn(base.state);
  // Ressourcen-Deckel NACH Produktion UND Bau-Entscheidung anwenden (siehe RESOURCE_CAP oben) -
  // kappt nur noch ungenutzt liegen gebliebene Ueberschuesse, nicht die Produktion/Ausgaben selbst.
  base.state.resources.metall = Math.min(base.state.resources.metall, RESOURCE_CAP.metall);
  base.state.resources.kristall = Math.min(base.state.resources.kristall, RESOURCE_CAP.kristall);
  base.state.resources.deuterium = Math.min(base.state.resources.deuterium, RESOURCE_CAP.deuterium);
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
  const speed = galaxyFleetSpeed(selected, state.research, state.playerClass, state.shipModules);
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

// ========== OFFENSIV-KI: BASEN GREIFEN VON SICH AUS SPIELER/BOTS AN ==========
// Throttled wieder eingefuehrt (30.07.2026, README Punkt 127) - war zusammen mit den KI-Mitspielern
// am 28.07.2026 komplett entfernt worden (README Punkt 98), weil beides zusammen die CPU-Spitzen
// verursachte. Wachstum (siehe loadPirateBase() oben) ist wieder ungedrosselt wie bei einem
// KI-Mitspieler - NUR dieser Angriffs-Cooldown haelt die Kampf-Last niedrig, analog zu
// BOT_COMBAT_ACTION_CHANCE bei den KI-Mitspielern (bot.ts). Analog zu runOutpostPirateAiTurn()
// (Feature existiert nicht mehr) bekommt jede Basis einen Cooldown, selbst einen Angriffsflug mit
// einem Teil ihrer Flotte gegen einen zufaelligen Spieler/Bot loszuschicken - kein
// Rueckflug-Zeitfenster (anders als beim umgekehrten Fall oben), Ueberlebende kehren bei
// Kampfaufloesung sofort zurueck.
// Nutzerentscheidung (30.07.2026, zweite Korrektur derselben Wiedereinfuehrung): "Basen sollen in
// Ruhe Flotten bauen statt kleine Troll-Angriffe" - Cooldown gegenueber der Historie (12-24h, war
// selbst schon Ergebnis einer frueheren Korrektur: "das ist ja wirklich alle 2 Minuten so") nochmal
// auf das 4-fache verlaengert (2-4 Tage statt 12-24h) - bei 4 aktiven Basen im Schnitt nur noch
// ~1-2 Angriffe/Tag INSGESAMT statt pro Basis. Jeder Angriff bleibt EINMALIG bei Ankunft (kein
// Nachhol-Risiko wie bei tickMission()).
const PIRATE_BASE_OFFENSIVE_COOLDOWN_MIN_MS = 48 * 60 * 60 * 1000;
const PIRATE_BASE_OFFENSIVE_COOLDOWN_MAX_MS = 96 * 60 * 60 * 1000;
const PIRATE_BASE_OFFENSIVE_FLEET_SHARE = 0.35; // Anteil der Basis-Kampfflotte, der pro Angriff eingesetzt wird
const PIRATE_BASE_OFFENSIVE_MIN_SHIPS = 5;
const PIRATE_BASE_OFFENSIVE_LOOT_PERCENT = 0.2; // niedriger als PIRATE_BASE_LOOT_PERCENT - trifft echte Spieler, nicht die KI-Basis selbst
const OFFENSIVE_COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
// Sicherheitsspanne fuer die Angriffs-Abwaegung unten (siehe runPirateBaseOffensiveTurn) - Basen
// sollen nicht schon bei knappem Gleichstand angreifen, sondern einen spuerbaren Staerke-Vorteil
// abwarten. Nutzerentscheidung (30.07.2026): "sie muessen abwaegen koennen, ob sich ein Angriff
// lohnt" - identischer Wert wie ATTACK_POWER_SAFETY_MARGIN bei den KI-Mitspielern (bot.ts).
const PIRATE_BASE_ATTACK_POWER_SAFETY_MARGIN = 1.15;

async function resolvePirateBaseOffensiveAttack(base: PirateBaseState, deployment: PirateBaseOffensiveDeployment): Promise<void> {
  deployment.resolved = true;
  const pState = base.state;
  const targetState = loadPlayerState(deployment.targetUserId);

  const targetCombined: Record<string, number> = {};
  Object.entries(targetState.fleet).forEach(([id, qty]) => {
    if (qty > 0) targetCombined[id] = qty;
  });
  Object.entries(targetState.defense).forEach(([id, qty]) => {
    if (qty > 0) targetCombined[id] = (targetCombined[id] || 0) + qty;
  });
  const targetIds = Object.keys(targetCombined);

  if (targetIds.length === 0) {
    // Ziel hat weder Flotte noch Verteidigung daheim - Basis-Flotte kehrt unbenutzt zurueck, kein Kampf.
    Object.entries(deployment.ships).forEach(([id, qty]) => {
      if (qty > 0) pState.fleet[id] = (pState.fleet[id] || 0) + qty;
    });
    savePirateBase(base);
    pushMessage(targetState, 'kampf', `Piratenbasis 1:${base.system}:${base.position} hat einen Angriff auf euch gestartet, aber weder Flotte noch Verteidigung bei euch vorgefunden - kein Kampf.`);
    savePlayerState(targetState);
    return;
  }

  const sideBStatsOverride: Record<string, CombatStats> = {};
  targetIds.forEach((id) => {
    sideBStatsOverride[id] = getEffectiveStats(id, targetState.research, targetState.defense, isBoosterActive(targetState, 'kampf'), targetState.playerClass, targetState.shipModules);
  });

  const result = await runCombatInWorker({
    sideAShips: deployment.ships,
    sideBShips: targetCombined,
    research: pState.research,
    playerClass: pState.playerClass,
    kampfBoostActive: isBoosterActive(pState, 'kampf'),
    shipModules: pState.shipModules,
    sideBStatsOverride,
  });

  const attackerResults: CombatUnitResult[] = Object.keys(deployment.ships).map((id) => {
    const eff = getEffectiveStats(id, pState.research, {}, isBoosterActive(pState, 'kampf'), pState.playerClass, pState.shipModules);
    const sent = deployment.ships[id];
    const survived = result.survivorsA[id] || 0;
    if (survived > 0) pState.fleet[id] = (pState.fleet[id] || 0) + survived;
    return {
      id, name: shipName(id), sent, survived, lost: sent - survived,
      waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenA[id] || 0), dmgDealt: Math.round(result.shotsA.dmgDealt[id] || 0),
      shotsFired: result.shotsA.shotsFired[id] || 0, hits: result.shotsA.hits[id] || 0,
      rapidFireTriggers: result.shotsA.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenA[id] || 0), shieldRegen: Math.round(result.shieldRegenA[id] || 0),
    };
  });

  let destroyedTargetPower = 0;
  let totalTargetPower = 0;
  const defenderResults: CombatUnitResult[] = targetIds.map((id) => {
    const isDefenseUnit = DEFENSES.some((d) => d.id === id);
    const eff = sideBStatsOverride[id];
    const sent = targetCombined[id];
    const survivedCount = result.survivorsB[id] || 0;
    const destroyedCount = sent - survivedCount;
    const unitPower = eff.waffen + eff.schild + eff.panzerung;
    totalTargetPower += sent * unitPower;
    destroyedTargetPower += destroyedCount * unitPower;
    if (isDefenseUnit) targetState.defense[id] = survivedCount;
    else targetState.fleet[id] = survivedCount;
    return {
      id, name: shipName(id), count: sent,
      waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0), dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
      destroyedCount, survivedCount, destroyed: survivedCount <= 0, isDefense: isDefenseUnit,
      shotsFired: result.shotsB.shotsFired[id] || 0, hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0), shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  // Pluenderungsquote skaliert mit dem Zerstoerungsanteil beim Ziel (0 = nichts getroffen, 1 = alles
  // vernichtet) statt eines reinen Alles-oder-nichts, analog zum abgestuften Muster bei Raids.
  const destructionRatio = totalTargetPower > 0 ? destroyedTargetPower / totalTargetPower : 0;
  let lootText = '';
  let loot: { metall: number; kristall: number; deuterium: number } | undefined;
  if (destructionRatio > 0) {
    const rate = PIRATE_BASE_OFFENSIVE_LOOT_PERCENT * destructionRatio;
    loot = {
      metall: Math.round(targetState.resources.metall * rate),
      kristall: Math.round(targetState.resources.kristall * rate),
      deuterium: Math.round(targetState.resources.deuterium * rate),
    };
    targetState.resources.metall -= loot.metall;
    targetState.resources.kristall -= loot.kristall;
    targetState.resources.deuterium -= loot.deuterium;
    pState.resources.metall += loot.metall;
    pState.resources.kristall += loot.kristall;
    pState.resources.deuterium += loot.deuterium;
    lootText = ` Erbeutet: ${loot.metall.toLocaleString('de-DE')} Metall, ${loot.kristall.toLocaleString('de-DE')} Kristall, ${loot.deuterium.toLocaleString('de-DE')} Deuterium.`;
  }

  savePirateBase(base);

  const outcome = destructionRatio >= 0.99 ? 'Verteidigung vernichtet' : destructionRatio > 0 ? 'Verteidigung angeschlagen' : 'Angriff abgewehrt';
  const messageText = `Piratenbasis 1:${base.system}:${base.position} hat euch angegriffen: ${outcome}.${lootText}`;
  const detail: CombatDetail = {
    sektorName: `Piratenbasis 1:${base.system}:${base.position} (Angriff auf euch)`,
    outcome,
    roundsFought: result.roundsFought,
    npcResults: attackerResults,
    playerResults: defenderResults,
    rewards: loot ? { metall: loot.metall, kristall: loot.kristall, deuterium: loot.deuterium } : undefined,
  };
  pushMessage(targetState, 'kampf', messageText, detail);
  savePlayerState(targetState);
}

function rollNextOffensiveCheck(): number {
  return Date.now() + PIRATE_BASE_OFFENSIVE_COOLDOWN_MIN_MS + Math.random() * (PIRATE_BASE_OFFENSIVE_COOLDOWN_MAX_MS - PIRATE_BASE_OFFENSIVE_COOLDOWN_MIN_MS);
}

async function runPirateBaseOffensiveTurn(base: PirateBaseState, targetUserIds: number[]): Promise<void> {
  const now = Date.now();
  for (const deployment of base.attacks) {
    if (!deployment.resolved && deployment.arriveTime <= now) {
      await resolvePirateBaseOffensiveAttack(base, deployment);
    }
  }
  base.attacks = base.attacks.filter((d) => !d.resolved);

  if (targetUserIds.length === 0) return;
  if (base.attacks.length > 0) return; // schon ein Angriff unterwegs - keine Ueberlappung
  // Frische/gerade (re-)aktivierte Basis (nextOffensiveCheck noch nie gesetzt): ERSTEN Cooldown
  // wuerfeln statt sofort anzugreifen - sonst greifen bei einer Reaktivierung ALLE aktiven Basen im
  // selben Heartbeat gleichzeitig an, noch bevor sie überhaupt Zeit hatten zu wachsen (Nutzer-
  // Feedback 30.07.2026: "in Ruhe Flotten bauen statt kleine Troll-Angriffe").
  if (base.nextOffensiveCheck === null) {
    base.nextOffensiveCheck = rollNextOffensiveCheck();
    savePirateBase(base);
    return;
  }
  if (now < base.nextOffensiveCheck) return;
  base.nextOffensiveCheck = rollNextOffensiveCheck();
  // Sofort speichern (nicht erst am Ende): mehrere fruehe "return" weiter unten (zu kleine Flotte,
  // keine gueltige Zielposition) wuerden den neu gewuerfelten Cooldown sonst nur im Speicher setzen
  // und beim naechsten Laden wieder verlieren - die Basis wuerde dann bei JEDEM weiteren Heartbeat
  // erneut pruefen statt den Cooldown tatsaechlich einzuhalten.
  savePirateBase(base);

  const pState = base.state;
  const selection: Record<string, number> = {};
  let total = 0;
  for (const id of OFFENSIVE_COMBAT_SHIP_IDS) {
    const take = Math.floor((pState.fleet[id] || 0) * PIRATE_BASE_OFFENSIVE_FLEET_SHARE);
    if (take > 0) {
      selection[id] = take;
      total += take;
    }
  }
  if (total < PIRATE_BASE_OFFENSIVE_MIN_SHIPS) return;

  const targetUserId = targetUserIds[Math.floor(Math.random() * targetUserIds.length)];
  const targetState = loadPlayerState(targetUserId);
  if (!targetState.galaxyPosition) return;

  // Abwaegung (Nutzerentscheidung 30.07.2026): "sie muessen abwaegen koennen, ob sich ein Angriff
  // lohnt" - Basis greift nur an, wenn ihre geplante Angriffsflotte dem Ziel (Flotte + Verteidigung
  // daheim) klar ueberlegen ist. Sonst lieber weiterwachsen und beim naechsten faelligen Cooldown
  // erneut versuchen - kein verschwendeter Angriff gegen einen befestigten Spieler.
  const targetPower = combatFleetPowerBase({ ...targetState.fleet, ...targetState.defense });
  if (combatFleetPowerBase(selection) < targetPower * PIRATE_BASE_ATTACK_POWER_SAFETY_MARGIN) return;

  const distance = galaxyDistance({ system: base.system, position: base.position }, targetState.galaxyPosition);
  const speed = galaxyFleetSpeed(selection, pState.research, pState.playerClass, pState.shipModules);
  const travelMs = galaxyDurationMs(distance, speed);
  if (!Number.isFinite(travelMs)) return;

  Object.entries(selection).forEach(([id, qty]) => {
    pState.fleet[id] -= qty;
  });

  const now2 = Date.now();
  base.attacks.push({
    id: 'pboff_' + now2 + '_' + base.id,
    targetUserId,
    ships: selection,
    startTime: now2,
    arriveTime: now2 + travelMs,
    resolved: false,
  });
  savePirateBase(base);
  pushMessage(targetState, 'kampf', `⚠ Piratenbasis 1:${base.system}:${base.position} hat eine Flotte in Richtung eurer Basis gestartet! Ankunft in ${Math.round(travelMs / 60000)} Minuten.`);
  savePlayerState(targetState);
}

// Treibt die Offensiv-KI aller aktiven Basen an (siehe heartbeat.ts) - Ziel-Pool sind alle echten
// Nutzer (Menschen + KI-Mitspieler-Bots), NIEMALS andere Piratenbasen.
export async function runAllPirateBaseOffensiveTurns(allUserIds: number[]): Promise<void> {
  const bases = await listActivePirateBases();
  for (const base of bases) {
    await runPirateBaseOffensiveTurn(base, allUserIds);
  }
}

