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
import {
  PIRATE_BASE_SEED_FLEET,
  PIRATE_BASE_SEED_DEFENSE,
  PIRATE_BASE_SEED_RESOURCES,
  PIRATE_BASE_SEED_BUILDINGS,
  PIRATE_BASE_RECOVERY_MS,
  PIRATE_BASE_REGEN_STEP_MS,
} from './data/economy.js';
import {
  rollPirateBaseGarrison,
  garrisonResearch,
  garrisonPower,
  garrisonReadiness,
  pirateBaseLoot,
  isDefenseUnitId,
  attritionShare,
  regenerateGarrison,
} from './pirateBaseCombat.js';
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
// Wirtschaft, Forschung, Gebaeude, Flotten-/Verteidigungsbau, genau wie ein
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

// Start-/Grundbestand einer Basis. Liegt seit dem 18.08.2026 in data/economy.ts
// (PIRATE_BASE_SEED_FLEET/-DEFENSE/-RESOURCES/-BUILDINGS) - Grund und Herkunft dort im Kommentar.
//
// GEAENDERT AM 18.08.2026 (Entscheidung 5a): Diese Werte sind KEINE Untergrenze mehr. Hier stand
// zuvor "die DAUERHAFTE Garnisonsstaerke jeder aktiven Basis", durchgesetzt ueber einen Floor-Up
// bei jedem Laden - eine Basis konnte durch Angriffe nie schwaecher werden. Genau dieser Boden hat
// die Startphase blockiert: gemessen 89,5 % Wertverlust fuer eine Aufbau-Flotte, unabhaengig davon,
// ob die Garnison mitskaliert. Ein Angriff kann eine Basis jetzt tatsaechlich ausduennen; sie baut
// den Bestand ueber runEconomyBotTurn() selbst wieder auf, und bis dahin sinkt ihre
// Gefechtsbereitschaft (garrisonReadiness() in pirateBaseCombat.ts).

// ENTFALLEN AM 18.08.2026 (Entscheidung 5, Beute-Mechanik): Hier standen `LOOT_BASIS_CAP`
// (44M/20M/6M) und `PIRATE_BASE_LOOT_PERCENT` (0,35). Sie sind ersatzlos gestrichen, WEIL DIE
// BEUTE NICHT MEHR AM LAGERBESTAND HAENGT, sondern an der tatsaechlich vernichteten Garnison
// (pirateBaseLoot() in pirateBaseCombat.ts, Kurve aus Entscheidung 2).
//
// Der Deckel war zuletzt (12.08.2026) vom Lagerbestand entkoppelt worden und wirkte nur noch auf
// die Beute - genau die Groesse, die es jetzt nicht mehr gibt. Der im Umsetzungsplan bei
// Entscheidung 5 geforderte Punkt "RESOURCE_CAP neu rechnen" (Kommentar rechnete mit
// NPC_PRODUCTION_BONUS_MULTIPLIER 1,5 und 3 Wochen, tatsaechlich sind es 6 und 6,5 Tage) geht damit
// ins Leere und ist erledigt, ohne dass eine neue Zahl bestimmt werden musste.
//
// Was dadurch entfaellt und bewusst in Kauf genommen ist: der Ressourcenbestand einer Basis wird
// von Angriffen nicht mehr angetastet. Er ist jetzt reiner Treibstoff ihres eigenen Ausbaus - und
// damit indirekt doch beutewirksam, weil eine reichere Basis mehr Garnison baut und eine staerkere
// Garnison mehr Beute traegt.

// Entscheidung 13.3 (Umsetzungsplan Balance, Block C): Mindestabstand zwischen zwei BAU-
// Entscheidungsschritten einer Basis. Vorher lief runEconomyBotTurn() bei JEDEM loadPirateBase(),
// und geladen wird eine Basis bei jedem Aufruf der Galaxie-Ansicht (listActivePirateBaseSummaries()
// in routes.ts), bei jedem Spionageflug und bei jedem Angriff. Das Wachstum einer Basis hing damit
// an der Zahl der Client-Aufrufe statt an der Zeit - eine Basis wuchs schneller, je oefter jemand
// in die Galaxie schaute, und keine Messung an den Basen war reproduzierbar (Entscheidung 5b).
//
// Bewusst GLEICH HEARTBEAT_INTERVAL_MS (index.ts, 2 Minuten): der Heartbeat laedt ueber
// runAllPirateBaseOffensiveTurns() -> listActivePirateBases() ohnehin alle aktiven Basen. Mit
// diesem Wert bekommt eine Basis also genau EINEN Zug je Heartbeat - deterministisch, unabhaengig
// von Client-Aufrufen, und im selben Takt wie ein KI-Mitspieler (runBotTurn() in bot.ts laeuft
// ebenfalls einmal je Heartbeat). Wer den Wert aendert, aendert damit die Wachstumsrate der Basen
// und muss sie neu messen - siehe balance/session2-simulation/base_growth_133.txt.
//
// BEWUSST OHNE NACHHOLEN: nach einer Server-Auszeit werden verpasste Zuege NICHT nachgeholt.
// Nachteil ausdruecklich: eine Basis waechst waehrend eines Ausfalls gar nicht weiter (die
// Ressourcen laufen ueber runEconomyTick() trotzdem auf, sie werden nur spaeter verbaut). Vorteil:
// keine Lastspitze beim ersten Laden nach dem Neustart und keine zweite Frequenzabhaengigkeit,
// diesmal von der Ausfalldauer.
const PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 2 * 60 * 1000;

// Obergrenze fuer das Nachholen verpasster Zuege in EINEM Ladevorgang (30 Zuege = 1 Stunde bei
// obigem Intervall). Ohne Deckel wuerde eine Basis nach einer laengeren Server-Auszeit beim ersten
// Laden hunderte Zuege am Stueck ausfuehren - genau die Lastspitze, wegen der die Cross-User-Sweeps
// am 12.08.2026 gedrosselt werden mussten. Nachteil ausdruecklich: nach einer Auszeit von mehr als
// einer Stunde wachsen die Basen langsamer als die Uhr hergibt. Das ist die konservative Richtung
// und betrifft nur den Ausnahmefall; im Normalbetrieb ist dueTurns immer 0 oder 1.
const PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP = 30;

function buildSeedState(id: string): PlayerState {
  const pos = POSITION_BY_ID.get(id)!;
  const state = defaultPlayerState(syntheticUserIdFor(id));
  state.galaxyPosition = { system: pos.system, position: pos.position };
  state.resources = { ...PIRATE_BASE_SEED_RESOURCES, dm: 0 };
  Object.entries(PIRATE_BASE_SEED_FLEET).forEach(([shipId, qty]) => (state.fleet[shipId] = qty));
  Object.entries(PIRATE_BASE_SEED_DEFENSE).forEach(([defId, qty]) => (state.defense[defId] = qty));
  Object.entries(PIRATE_BASE_SEED_BUILDINGS).forEach(([buildingId, level]) => (state.buildings[buildingId] = level));
  return state;
}

function seedPirateBase(id: string): PirateBaseState {
  const pos = POSITION_BY_ID.get(id)!;
  return { id, system: pos.system, position: pos.position, state: buildSeedState(id), attacks: [], nextOffensiveCheck: null, nextEconomyTurn: null, recoveringUntil: null, lastGarrisonRegenAt: null };
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
// PlayerState umgestellt, ihr bisheriger Bestand fliesst dabei mit ein.
// GEAENDERT AM 18.08.2026 (Entscheidung 5a): der Bestand wird NICHT mehr auf den Seed-Wert
// angehoben ("nach oben angehoben auf den neuen Mindestwert"). Es gibt keinen Mindestwert mehr -
// eine alte, schwaechere Basis bleibt schwaecher und baut selbst auf. Der Seed dient nur noch als
// Ausgangswert fuer Typen, die im Altbestand gar nicht vorkommen.
function isLegacyShape(raw: any): boolean {
  return raw && typeof raw === 'object' && !raw.state;
}

function migrateLegacyBase(raw: any, id: string): PirateBaseState {
  const pos = POSITION_BY_ID.get(id)!;
  const state = buildSeedState(id);
  Object.entries(PIRATE_BASE_SEED_FLEET).forEach(([shipId]) => {
    if (raw.fleet?.[shipId] !== undefined) state.fleet[shipId] = raw.fleet[shipId];
  });
  Object.entries(PIRATE_BASE_SEED_DEFENSE).forEach(([defId]) => {
    if (raw.defense?.[defId] !== undefined) state.defense[defId] = raw.defense[defId];
  });
  (['metall', 'kristall', 'deuterium'] as const).forEach((res) => {
    state.resources[res] = Math.max(state.resources[res] || 0, raw.resources?.[res] || 0);
  });
  return { id, system: pos.system, position: pos.position, state, attacks: [], nextOffensiveCheck: null, nextEconomyTurn: null, recoveringUntil: null, lastGarrisonRegenAt: null };
}

// Lazy bei jedem Laden angewendet (Angriff/Spionage/Galaxie-Ansicht) UND explizit einmal pro
// Heartbeat fuer ALLE aktiven Basen (siehe listActivePirateBases(), aufgerufen aus heartbeat.ts ueber
// runAllPirateBaseOffensiveTurns()) - Basen wachsen eigenstaendig (30.07.2026, Korrektur derselben
// Wiedereinfuehrung wie die KI-Mitspieler): bauen/forschen/minen genau wie ein KI-Mitspieler
// (runEconomyBotTurn() in economyBotTurn.ts - baut/forscht/verteidigt, aber OHNE
// Asteroiden-Mining-Fluege, siehe NPC_PRODUCTION_BONUS_MULTIPLIER in economy.ts fuer den
// stattdessen erhoehten Minen-Produktions-Ausgleich).
//
// GEAENDERT AM 17.08.2026 (Entscheidung 13.3): Hier stand "Bewusst UNGEDROSSELT (wie bei den
// Bots)" - beides war unzutreffend. Die Bots sind sehr wohl getaktet (runBotTurn() laeuft nur im
// Heartbeat, also alle 2 Minuten), und ungedrosselt bedeutete hier: ein vollstaendiger
// Bau-Entscheidungsschritt PRO LADEVORGANG, also pro Galaxie-Aufruf eines beliebigen Clients.
// Der Entscheidungsschritt haengt jetzt an PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS statt am Laden;
// die Ressourcen-Produktion (runEconomyTick()) bleibt unveraendert bei jedem Laden.
export async function loadPirateBase(id: string): Promise<PirateBaseState | null> {
  const json = getPirateBaseJson(id);
  if (!json) return null;
  const raw = JSON.parse(json);
  const base: PirateBaseState = isLegacyShape(raw) ? migrateLegacyBase(raw, id) : (raw as PirateBaseState);
  if (!base.attacks) base.attacks = []; // Bestandsdaten von vor der Offensiv-KI (siehe runPirateBaseOffensiveTurn())
  if (base.nextOffensiveCheck === undefined) base.nextOffensiveCheck = null; // Bestandsdaten von vor dem Cooldown-Umbau
  if (base.nextEconomyTurn === undefined) base.nextEconomyTurn = null; // Bestandsdaten von vor Entscheidung 13.3
  if (base.recoveringUntil === undefined) base.recoveringUntil = null; // Bestandsdaten von vor Entscheidung 5
  if (base.lastGarrisonRegenAt === undefined) base.lastGarrisonRegenAt = null; // dito
  // Wiederaufbau der Garnison bis zum Grundbestand (Nachtrag 5a). Zeitbasiert, NICHT ladebasiert -
  // derselbe Fehler wie vor Entscheidung 13.3 waere hier sonst sofort wieder da (eine Basis
  // erholte sich schneller, je oefter jemand die Galaxie aufruft). Der Mindestschritt verhindert
  // zusaetzlich, dass der Zuwachs bei seltenen Typen im Runden verschwindet.
  const regenNow = Date.now();
  if (base.lastGarrisonRegenAt === null) {
    base.lastGarrisonRegenAt = regenNow;
  } else if (regenNow - base.lastGarrisonRegenAt >= PIRATE_BASE_REGEN_STEP_MS) {
    regenerateGarrison(base.state.fleet, base.state.defense, regenNow - base.lastGarrisonRegenAt);
    base.lastGarrisonRegenAt = regenNow;
  }
  // ENTFERNT AM 18.08.2026 (Entscheidung 5a): Hier stand ein Floor-Up, das den Bestand bei JEDEM
  // Laden wieder auf PIRATE_BASE_SEED_FLEET/-DEFENSE anhob ("unzerstoerbare Basis"-Design). Eine
  // Basis konnte dadurch weder durch Angriffe noch auf andere Weise unter den Startbestand fallen -
  // und weil der Boden zuerst greift, haette die mitskalierende Garnison aus Entscheidung 5 die
  // Startphase gar nicht erreicht: eine Aufbau-Flotte trifft weiterhin auf 5.300 Kampfschiffe bis
  // hinauf zum Reaper, egal wie klein sie ist. Der Ersatz fuer das "unzerstoerbar"-Design ist die
  // Erholungszeit (PIRATE_BASE_RECOVERY_MS) plus der Wiederaufbau durch runEconomyBotTurn(), nicht
  // mehr eine feste Untergrenze.
  await runEconomyTick(base.state);
  // Entscheidung 13.3: Der Bau-Entscheidungsschritt haengt jetzt an der UHR, nicht mehr am
  // Ladevorgang. runEconomyTick() darueber bleibt bewusst UNGEDROSSELT - die Ressourcen-Produktion
  // ist zeitbasiert und damit ohnehin korrekt; sie hier zu drosseln waere sogar falsch, weil dann
  // erst beim naechsten faelligen Zug produziert wuerde.
  //
  // Die Zahl der Zuege ergibt sich aus der VERSTRICHENEN ZEIT, nicht aus der Zahl der Aufrufe:
  // `nextEconomyTurn` wird je faelligem Zug um genau ein Intervall weitergesetzt, nicht auf
  // "jetzt + Intervall". Das ist der Unterschied zwischen einem Raster und einem Nachlauf.
  // GRUND, gemessen am 17.08.2026 (base_growth_133.txt): mit "jetzt + Intervall" hing das Ergebnis
  // weiterhin am Aufruf-Zeitpunkt - kommt ein Aufruf wenige Millisekunden VOR der Faelligkeit,
  // faellt der Zug aus und wird nie nachgeholt. Gemessen waren das 17 statt 20 Zuegen, also
  // x1,18 statt der geforderten x1,00. Produktiv traefe genau dieser Fall zu, weil der Heartbeat
  // (2 Minuten) denselben Takt hat wie das Intervall.
  const now = Date.now();
  let dueTurns = 0;
  if (base.nextEconomyTurn === null) {
    dueTurns = 1; // frische oder migrierte Basis: einmal sofort, danach im Raster
    base.nextEconomyTurn = now + PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS;
  } else {
    while (now >= base.nextEconomyTurn && dueTurns < PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP) {
      dueTurns++;
      base.nextEconomyTurn += PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS;
    }
    // Laenger als der Deckel weg gewesen: Raster neu ansetzen, statt dauerhaft hinterherzulaufen.
    if (now >= base.nextEconomyTurn) base.nextEconomyTurn = now + PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS;
  }
  for (let i = 0; i < dueTurns; i++) runEconomyBotTurn(base.state);
  // 12.08.2026: Der Deckel wird NICHT mehr auf den Lagerbestand angewandt - siehe LOOT_BASIS_CAP.
  // Vorher stand hier ein Kappen der Ressourcen nach jedem Zug, was den AUSBAU der Basis
  // unbeabsichtigt hart begrenzt hat (ein Gebaeude, das mehr kostet als der Deckel hergibt, wurde
  // nie bezahlbar).
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
// ERGAENZT AM 18.08.2026 (Entscheidung 5): `power` ist seitdem NICHT mehr die Staerke, gegen die
// man kaempft - die Welle skaliert mit der eigenen Flotte (siehe rollPirateBaseGarrison()). `power`
// und `readiness` sagen jetzt, wie viel die Basis noch aufbieten KANN; `recoveringUntil` sagt, ab
// wann sie wieder angreifbar ist. Der Client muss beides zeigen, sonst sieht ein Spieler eine
// Machtzahl und schliesst daraus auf die Schwierigkeit - das waere ab jetzt schlicht falsch.
export interface PirateBaseSummary {
  id: string;
  system: number;
  position: number;
  power: number;
  readiness: number;
  recoveringUntil: number | null;
}

export async function listActivePirateBaseSummaries(): Promise<PirateBaseSummary[]> {
  const bases = await listActivePirateBases();
  return bases.map((b) => ({
    id: b.id,
    system: b.system,
    position: b.position,
    power: Math.round(garrisonPower(b.state.fleet, b.state.defense)),
    readiness: garrisonReadiness(b.state.fleet, b.state.defense),
    recoveringUntil: b.recoveringUntil,
  }));
}

// ========== ANGRIFF STARTEN ==========

export async function startPirateBaseAttack(state: PlayerState, baseId: string, ships: Record<string, number>): Promise<ActionResult> {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  if (!ACTIVE_PIRATE_BASE_IDS.includes(baseId)) return { ok: false, error: 'Unbekannte oder nicht angreifbare Piratenbasis.' };

  // Erholungszeit (Entscheidung 5, Schranke gegen Dauer-Farming). Bewusst BEIM ABSCHICKEN geprueft
  // und nicht erst bei Ankunft: eine Flotte, die 40 Minuten fliegt und dann ohne Beute zurueckkommt,
  // ist die schlechtere Rueckmeldung. Bei Ankunft wird trotzdem noch einmal geprueft (siehe
  // resolvePirateBaseAttack) - zwei gleichzeitig gestartete Fluege koennen sonst dieselbe
  // Erholungspause umgehen.
  const base = await loadPirateBase(baseId);
  if (base?.recoveringUntil && base.recoveringUntil > Date.now()) {
    const restMin = Math.ceil((base.recoveringUntil - Date.now()) / 60000);
    return { ok: false, error: `Die Basis erholt sich noch von einem Angriff - wieder angreifbar in ${restMin} Minuten.` };
  }

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
  const now = Date.now();

  // ===== ENTSCHEIDUNG 5: die Garnison skaliert mit der angreifenden Flotte =====
  // Vorher trat der KOMPLETTE Bestand der Basis an, unabhaengig davon, wer angreift. Genau daraus
  // kamen die beiden gemessenen Extreme (89,5 % Wertverlust fuer eine Aufbau-Flotte, 0,0-0,3 % fuer
  // eine entwickelte). Jetzt stellt die Basis eine Welle in der Groessenordnung der ANGREIFENDEN
  // Macht - Zusammensetzung aus ihrem echten Bestand, Menge nach PIRATE_BASE_MULTIPLIER_ROLL,
  // gedaempft durch ihre Gefechtsbereitschaft. Herleitung im Kopf von pirateBaseCombat.ts.
  const sentPower = combatFleetPowerBase(deployment.ships);
  const garrison = rollPirateBaseGarrison(pState.fleet, pState.defense, sentPower);
  const npcCombined: Record<string, number> = {};
  Object.entries(garrison.ships).forEach(([id, qty]) => {
    if (qty > 0) npcCombined[id] = qty;
  });
  Object.entries(garrison.defenses).forEach(([id, qty]) => {
    if (qty > 0) npcCombined[id] = (npcCombined[id] || 0) + qty;
  });
  const npcIds = Object.keys(npcCombined);

  let anyNpcDestroyed = false;
  let npcResults: CombatUnitResult[] = [];
  let playerResults: CombatUnitResult[] = [];
  let roundsFought = 0;
  let destroyedPower = 0;

  if (npcIds.length === 0) {
    // Basis hat nichts mehr aufzubieten (leergefarmt und noch nicht nachgewachsen) - kein Kampf.
    // ACHTUNG, geaendert am 18.08.2026: hier gab es frueher trotzdem die volle Beute
    // ("direkter Loot"), weil die Beute am Lagerbestand hing. Da sie jetzt an der vernichteten
    // Garnison haengt, gibt eine leere Basis konsequenterweise NICHTS - sonst waere die
    // leergefarmte Basis die beste Beutequelle des Spiels.
    anyNpcDestroyed = false;
  } else {
    // Die Piratenbasis wirtschaftet "genau wie ein Spieler" (eigene Forschung/Klasse) - ihre
    // effektiven Kampfwerte laufen deshalb ueber getEffectiveStats() und per sideBStatsOverride
    // (dasselbe Muster wie beim Piratenkapitaen/Piratenadmiral).
    // GEAENDERT AM 18.08.2026: die Forschung ist nicht mehr die der Basis ALLEIN, sondern das
    // Maximum aus ihrer eigenen und der des Angreifers (garrisonResearch(), Begruendung dort) -
    // sonst kaempft die Basis mit Forschungsstufe 0, waehrend jeder Sektor-Pirat ueber
    // PIRATE_RESEARCH_SHARE den vollen Stand des Angreifers bekommt, und die Multiplikator-Tabelle
    // meint etwas voellig anderes als bei den Sektoren.
    const effectiveResearch = garrisonResearch(pState.research, state.research);
    const sideBStatsOverride: Record<string, CombatStats> = {};
    npcIds.forEach((id) => {
      sideBStatsOverride[id] = getEffectiveStats(
        id,
        effectiveResearch,
        garrison.defenses,
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

    // Verlustanteil je Einheitentyp - wird unten auf den ECHTEN Bestand der Basis angewandt.
    // Nicht die absolute Stueckzahl: die Welle kann groesser oder kleiner als der Bestand sein.
    const lossShareById: Record<string, number> = {};

    npcResults = npcIds.map((id) => {
      const isDefenseUnit = isDefenseUnitId(id);
      const eff = sideBStatsOverride[id];
      const sent = npcCombined[id];
      const survivedCount = result.survivorsB[id] || 0;
      const destroyedCount = sent - survivedCount;
      if (destroyedCount > 0) anyNpcDestroyed = true;
      lossShareById[id] = sent > 0 ? destroyedCount / sent : 0;
      // Vernichtete Feindmacht als Beute-Grundlage (Entscheidung 2/5) - dieselbe Groesse, an der
      // auch der Beute-Anker gemessen wurde: rohe BasePower, ohne Forschung.
      destroyedPower += combatFleetPowerBase({ [id]: destroyedCount });
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

    // Verluste auf den echten Bestand durchschlagen lassen (siehe Punkt 3 im Kopfkommentar von
    // pirateBaseCombat.ts). Ohne diesen Schritt waere die Basis wieder unangreifbar: man haette
    // nur Verstaerkungswellen vernichtet, ohne der Basis selbst etwas zu nehmen - und die
    // Erholungszeit unten haette nichts, wovon sie sich erholt.
    Object.entries(lossShareById).forEach(([id, share]) => {
      if (share <= 0) return;
      const applied = attritionShare(share); // Deckel, siehe PIRATE_BASE_MAX_ATTRITION
      if (isDefenseUnitId(id)) {
        pState.defense[id] = Math.floor((pState.defense[id] || 0) * (1 - applied));
      } else {
        pState.fleet[id] = Math.floor((pState.fleet[id] || 0) * (1 - applied));
      }
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

  // Zweite Pruefung der Erholungszeit (die erste steht in startPirateBaseAttack). Zwei Flotten
  // koennen gleichzeitig unterwegs sein und beide vor der ersten Aufloesung gestartet worden sein;
  // ohne diese Pruefung liesse sich die Pause durch parallele Fluege umgehen. Der Kampf findet
  // trotzdem statt - die Garnison steht ja da -, nur Beute gibt es keine.
  const stillRecovering = base.recoveringUntil !== null && base.recoveringUntil > now;

  let lootText = '';
  let loot: { metall: number; kristall: number; deuterium: number } | undefined;
  if (anyNpcDestroyed && !stillRecovering) {
    // Beute aus der vernichteten Garnison statt aus dem Lagerbestand (Entscheidung 5 + 2).
    loot = pirateBaseLoot(destroyedPower);
    state.resources.metall += loot.metall;
    state.resources.kristall += loot.kristall;
    state.resources.deuterium += loot.deuterium;
    state.stats.resourcesLooted += loot.metall + loot.kristall + loot.deuterium;
    lootText = ` Beute erbeutet: ${loot.metall.toLocaleString('de-DE')} Metall, ${loot.kristall.toLocaleString('de-DE')} Kristall, ${loot.deuterium.toLocaleString('de-DE')} Deuterium.`;
  } else if (anyNpcDestroyed && stillRecovering) {
    lootText = ' Die Basis war bereits ausgeplündert - keine Beute.';
  }

  // Erholungszeit setzen, sobald ueberhaupt gekaempft wurde (auch bei einem abgewehrten Angriff -
  // sonst waere ein aussichtsloser Wegwerf-Angriff das Mittel, um die Pause NICHT auszuloesen und
  // gleich danach mit der grossen Flotte nachzusetzen).
  if (npcIds.length > 0) base.recoveringUntil = now + PIRATE_BASE_RECOVERY_MS;

  savePirateBase(base);

  const outcome = npcIds.length === 0 ? 'Basis leer vorgefunden' : anyNpcDestroyed ? 'Angriff erfolgreich' : 'Angriff abgewehrt - keine Verluste beim Gegner';
  // Die tatsaechlich gewuerfelte Feindstaerke gehoert in den Bericht - genau die Luecke, die am
  // 05.08.2026 bei den Solo-Sektoren aufgefallen ist ("Normale Welle" fuer jeden Check, egal was
  // gewuerfelt wurde). `Bereitschaft` erklaert zusaetzlich, warum eine frisch ausgeplünderte Basis
  // schwaecher antritt als dieselbe Basis eine Woche spaeter.
  const waveText =
    npcIds.length === 0
      ? ''
      : ` Feindstärke ${Math.round(garrison.multiplier * 100)}% deiner Flotte, Garnisons-Bereitschaft ${Math.round(garrison.readiness * 100)}%.`;
  const messageText = `Angriff auf Piratenbasis ${deployment.targetSystem}:${deployment.targetPosition}: ${outcome}.${waveText}${lootText}`;
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

