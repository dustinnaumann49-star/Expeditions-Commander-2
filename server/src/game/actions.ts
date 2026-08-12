import { SHIPS } from './data/ships.js';
import { DEFENSES } from './data/defenses.js';
import { RESEARCH } from './data/research.js';
import { BUILDINGS, findBuilding, buildingsForTier, HOME_TIER_UNLOCK_LEVELS } from './data/buildings.js';
import { BUILDING_MODULES, findBuildingModule } from './data/buildingModules.js';
import { SHIP_MODULES, findShipModule } from './data/shipModules.js';
import { DEFENSE_MODULES, findDefenseModule } from './data/defenseModules.js';
import { MAX_BUILD_SLOTS, MAX_DEFENSE_SLOTS, MAX_RESEARCH_SLOTS, MAX_BUILDING_SLOTS, MAX_SHIP_MODULE_SLOTS, MAX_DEFENSE_MODULE_SLOTS, MAX_PLAYER_SHIPS, PARENT_UNLOCK_LEVEL } from './data/combatConstants.js';
import { findShip, findDefense } from './combat.js';
import { processMissions } from './missions.js';
import { processGalaxyDeployments } from './galaxy.js';
import { processSpyMissions, maybeGeneratePirateSpyReport } from './spyMissions.js';
import { processEventTrips } from './galaxyEvents.js';
import { processRaidTimer, processOverdueRaidsForOtherUsers, processOverdueRaidSpawnsForOtherUsers } from './raids.js';
import { processAllDepartedGroupOperations, autoStartReadyGroupOperations, listMyGroupOperations } from './groupOps.js';
import { CLASS_KANONIER_SHIP_COST_MULTIPLIER, CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER, CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER } from './data/classes.js';
import { ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER, ECONOMY_PROSPEKTOR_MINING_MULTIPLIER } from './data/economyClasses.js';
import { isBoosterActive } from './boosterUtil.js';
import { NPC_PRODUCTION_BONUS_MULTIPLIER, BAUTEMPO_BOOST_FACTOR, FORSCHUNGSTEMPO_BOOST_FACTOR, ABBAU_BOOST_MULTIPLIER, isWeeklyEventActive, WEEKLY_BAUZEIT_EVENT_FACTOR } from './data/economy.js';
import { listBotUserIds } from '../db.js';
import type { PlayerState, ResourceCost, BuildingDefinition } from './types.js';

// KI-Wachstums-Ausgleich (siehe NPC_PRODUCTION_BONUS_MULTIPLIER in economy.ts) - Piratenbasen
// nutzen negative, synthetische userIds (siehe SYNTHETIC_USER_ID_BASE in pirateBaseState.ts, dort
// bewusst NICHT importiert um Zirkelimporte zu vermeiden - ein einfacher Vorzeichen-Check reicht).
// Fuer echte KI-Mitspieler (positive userId, is_bot-Flag in der DB) genuegt eine kleine, guenstige
// Abfrage (aktuell nur 2 Zeilen).
function isNpcState(state: PlayerState): boolean {
  return state.userId < 0 || listBotUserIds().includes(state.userId);
}

// ========== FORSCHUNGS-MULTIPLIKATOREN (Bauzeit/Forschungszeit) ==========

// Basis-Multiplikator aus Bauzeit-Forschung + "bautempo"-Booster - gilt fuer ALLE Bauarten
// (Schiffe, Verteidigung, Gebaeude) gleichermassen, siehe README Punkt 1.
function baseTimeMultiplier(state: PlayerState): number {
  let m = Math.max(0.3, 1 - (state.research.bauzeit || 0) * RESEARCH[3].effectPerLevel);
  if (isBoosterActive(state, 'bautempo')) m *= BAUTEMPO_BOOST_FACTOR;
  // Woechentlicher Event-Kalender (05.08.2026, Nutzerentscheidung): kostenloser Bauzeit-Bonus am
  // Samstag fuer ALLE Bauarten (siehe WEEKLY_EVENTS in economy.ts) - gilt hier automatisch fuer
  // Schiffe/Verteidigung/Gebaeude, da diese Funktion die gemeinsame Basis fuer alle drei ist.
  if (isWeeklyEventActive('bauzeit_bonus')) m *= WEEKLY_BAUZEIT_EVENT_FACTOR;
  return m;
}

// Roboterfabrik/Nanitenfabrik wirken multiplikativ (kompoundierend) pro Stufe, nicht linear -
// linear wuerde bei wenigen Stufen zu negativen/Null-Bauzeiten fuehren. Beide Effekte stapeln
// sich. Gebaeude werden deutlich staerker beschleunigt (25%/50% pro Stufe) als Schiffe/
// Verteidigung (1%/2% pro Stufe), da fuer Gebaeude ohnehin nur ein einziger globaler Bauslot
// existiert.
// `tier` (05.08.2026, V2/V3-Stufen): NUR fuer target 'building' relevant - jede Stufe wird durch
// ihre EIGENE Roboterfabrik/Nanitenfabrik beschleunigt (analog stationBauzeitFactorForTier() in
// stations.ts), ein spaet gebautes V3-Paar hilft nicht rueckwirkend V1/V2-Gebaeuden. Fuer
// 'shipDefense' bleibt es bei den V1-Fabriken (Schiffe/Verteidigung sind nicht tier-gebunden).
function roboterNaniteFactor(state: PlayerState, target: 'building' | 'shipDefense', tier: 1 | 2 | 3 = 1): number {
  const effectiveTier = target === 'building' ? tier : 1;
  const roboterId = effectiveTier === 1 ? 'roboterfabrik' : `v${effectiveTier}_roboterfabrik`;
  const naniteId = effectiveTier === 1 ? 'nanitenfabrik' : `v${effectiveTier}_nanitenfabrik`;
  const roboterLevel = state.buildings?.[roboterId] || 0;
  const naniteLevel = state.buildings?.[naniteId] || 0;
  let factor =
    target === 'building' ? Math.pow(0.75, roboterLevel) * Math.pow(0.5, naniteLevel) : Math.pow(0.99, roboterLevel) * Math.pow(0.98, naniteLevel);
  // Module "Verstaerkte Automatisierung" (Roboterfabrik/Nanitenfabrik) verstaerken den
  // bestehenden Stufen-Effekt zusaetzlich, OHNE dass die Fabrik selbst weiter ausgebaut werden
  // muss - stapelt multiplikativ mit dem obigen Basiswert.
  // Korrigiert 10.08.2026: hier stand "existiert bislang nur fuer V1, fuer V2/V3 liefert
  // moduleReductionFactor() bei fehlendem Modul einfach 1 zurueck (kein Fehler, kein Effekt)".
  // Genau dieser stille Ausfall liess V2/V3-Gebaeude rund viermal langsamer bauen als ein gleich
  // ausgebautes V1. Die V2/V3-Module existieren jetzt (siehe buildingModules.ts).
  factor *= moduleReductionFactor(state, `${roboterId}_verstaerkte_automatisierung`);
  factor *= moduleReductionFactor(state, `${naniteId}_verstaerkte_automatisierung`);
  return factor;
}

// Forschungsbaum-Zweige "Bauzeit: X" (siehe research.ts) stapeln ZUSAETZLICH zur Basis-Forschung
// oben (die weiterhin ALLE drei Kategorien gleichzeitig verkuerzt) - jeweils nur fuer EINE
// Kategorie. Gleiche Floor-Logik wie baseTimeMultiplier (min. 50%, nie negativ/Null).
function specificTimeMultiplier(level: number, effectPerLevel: number): number {
  return Math.max(0.5, 1 - level * effectPerLevel);
}

// ========== GEBAEUDE-MODULSYSTEM (siehe types.ts BuildingModuleDefinition/README) ==========
// Stapelt sich MULTIPLIKATIV mit der allgemeinen Forschung (Mining-Boost/Bauzeit-Zweige) - keine
// Ersetzung, mehr Optimierungstiefe wie in der Ruecksprache besprochen.

function moduleLevel(state: PlayerState, moduleId: string): number {
  return state.buildingModules?.[moduleId] || 0;
}

// Fuer "output"/"strengthen_factor"-Module: hebt den Basiswert an (1 + Stufe*Effekt).
function moduleBoostFactor(state: PlayerState, moduleId: string): number {
  const mod = findBuildingModule(moduleId);
  if (!mod) return 1;
  return 1 + moduleLevel(state, moduleId) * mod.effectPerLevel;
}

// Fuer "energy_reduction"/"buildtime_self"-Module: senkt den Basiswert (nie unter 50%, analog zu
// specificTimeMultiplier oben - verhindert negative/Null-Werte bei voll ausgebautem Modul).
function moduleReductionFactor(state: PlayerState, moduleId: string): number {
  const mod = findBuildingModule(moduleId);
  if (!mod) return 1;
  return Math.max(0.5, 1 - moduleLevel(state, moduleId) * mod.effectPerLevel);
}

// Zuordnung Gebaeude -> eigenes "buildtime_self"-Modul (verkuerzt NUR die Bauzeit fuer weitere
// Ausbaustufen GENAU DIESES Gebaeudes).
// Die Tabelle enthaelt bewusst nur die V1-Schluessel; V2/V3 werden ueber selfBuildtimeModuleId()
// abgeleitet. Vorher war das eine reine V1-Tabelle OHNE Ableitung - fuer V2/V3-Gebaeude wurde die
// Modul-ID gar nicht erst gebildet, das Bauzeit-Modul war dort also wirkungslos (10.08.2026).
const BUILDING_SELF_BUILDTIME_MODULE: Record<string, string> = {
  metallmine: 'metallmine_automatisierung',
  kristallmine: 'kristallmine_automatisierung',
  deuteriummine: 'deuteriummine_automatisierung',
  solarkraftwerk: 'solarkraftwerk_wartungsoptimierung',
  roboterfabrik: 'roboterfabrik_wartungsfreiheit',
  nanitenfabrik: 'nanitenfabrik_wartungsfreiheit',
};

// Loest die Zuordnung oben auch fuer V2/V3 auf: `v2_metallmine` -> `v2_metallmine_automatisierung`,
// passend zu den in buildingModules.ts generierten IDs.
function selfBuildtimeModuleId(buildingId: string): string | undefined {
  const tierMatch = /^v([23])_(.+)$/.exec(buildingId);
  const baseId = tierMatch ? tierMatch[2] : buildingId;
  const v1ModuleId = BUILDING_SELF_BUILDTIME_MODULE[baseId];
  if (!v1ModuleId) return undefined;
  return tierMatch ? `v${tierMatch[1]}_${v1ModuleId}` : v1ModuleId;
}

// Zuordnung Mine -> eigenes "output"-Modul (Foerdereffizienz) bzw. "energy_reduction"-Modul
// (Energiesparmodul).
const MINE_OUTPUT_MODULE: Record<string, string> = {
  metallmine: 'metallmine_foerdereffizienz',
  kristallmine: 'kristallmine_foerdereffizienz',
  deuteriummine: 'deuteriummine_foerdereffizienz',
};
const MINE_ENERGY_MODULE: Record<string, string> = {
  metallmine: 'metallmine_energiesparmodul',
  kristallmine: 'kristallmine_energiesparmodul',
  deuteriummine: 'deuteriummine_energiesparmodul',
};

// Wirtschafts-Klasse "Ingenieur" (Nutzerentscheidung Juli 2026, siehe economyClasses.ts) -
// beschleunigt ALLE drei Bauarten gleichermassen (Schiffe/Verteidigung/Gebaeude), NUR die Zeit,
// nicht die Kosten (die rabattieren schon die Kampf-Klassen ueber shipCostMultiplier() unten).
function economyBauzeitMultiplier(state: PlayerState): number {
  return state.economyClass === 'ingenieur' ? ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER : 1;
}

export function bauzeitMultiplier(state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_schiffe || 0, 0.03);
  return baseTimeMultiplier(state) * roboterNaniteFactor(state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// NEU: eigener Multiplikator fuer Verteidigungsanlagen (vorher gemeinsam mit Schiffen ueber
// bauzeitMultiplier() - jetzt getrennt, da der neue Zweig "Bauzeit: Verteidigung" NUR
// Verteidigungsanlagen betreffen soll, nicht Schiffe).
export function defenseBauzeitMultiplier(state: PlayerState): number {
  const specific = specificTimeMultiplier(state.research.bauzeit_verteidigung || 0, 0.03);
  return baseTimeMultiplier(state) * roboterNaniteFactor(state, 'shipDefense') * specific * economyBauzeitMultiplier(state);
}

// Eigener Multiplikator fuer Gebaeude-Bauzeiten (Punkt 1 der README gilt auch hier: jede neue
// Zeit-Anzeige im Frontend fuer Gebaeude MUSS die client-seitige Entsprechung verwenden).
// `buildingId` optional: wird er angegeben, fliesst zusaetzlich das GEBAEUDE-EIGENE
// "buildtime_self"-Modul ein (siehe BUILDING_SELF_BUILDTIME_MODULE) - wirkt NUR auf die
// Bauzeit fuer weitere Ausbaustufen GENAU DIESES Gebaeudes, nicht auf andere.
export function gebaeudeBauzeitMultiplier(state: PlayerState, buildingId?: string): number {
  const tier = buildingId ? findBuilding(buildingId)?.tier ?? 1 : 1;
  const specific = specificTimeMultiplier(state.research.bauzeit_gebaeude || 0, 0.03);
  let m = baseTimeMultiplier(state) * roboterNaniteFactor(state, 'building', tier) * specific * economyBauzeitMultiplier(state);
  const selfModuleId = buildingId ? selfBuildtimeModuleId(buildingId) : undefined;
  if (selfModuleId) m *= moduleReductionFactor(state, selfModuleId);
  return m;
}

export function researchTimeMultiplier(state: PlayerState): number {
  const booster = isBoosterActive(state, 'forschungstempo') ? FORSCHUNGSTEMPO_BOOST_FACTOR : 1;
  // Woechentlicher Event-Kalender (05.08.2026, Nutzerentscheidung): kostenloser Bauzeit-Bonus am
  // Samstag gilt auch fuer Forschung, siehe baseTimeMultiplier() oben fuer Schiffe/Verteidigung/
  // Gebaeude.
  const weeklyEvent = isWeeklyEventActive('bauzeit_bonus') ? WEEKLY_BAUZEIT_EVENT_FACTOR : 1;
  return booster * weeklyEvent;
}

// ========== KLASSEN-KOSTENMULTIPLIKATOREN (Kanonier/Bollwerk/Kommandant) ==========
// Jede Kosten-ANZEIGE im Frontend MUSS ebenfalls diese Werte spiegeln (siehe
// client/src/lib/multipliers.ts), analog zu README Punkt 1 fuer Zeit-Anzeigen - sonst zeigt die
// UI falsche Kosten an, sobald eine Klasse gewaehlt ist. Bewusst GETRENNT nach Schiffen und
// Verteidigung (nicht wie zuvor ein gemeinsamer Faktor): Kanonier rabattiert nur Schiffe,
// Bollwerk nur Verteidigung, Kommandant beides.
export function shipCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'kanonier') return CLASS_KANONIER_SHIP_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
}

export function defenseCostMultiplier(state: PlayerState): number {
  if (state.playerClass === 'bollwerk') return CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER;
  if (state.playerClass === 'kommandant') return CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER;
  return 1;
}

// ========== RESSOURCEN ==========

export function canAfford(state: PlayerState, cost: ResourceCost, qty: number): boolean {
  return (
    state.resources.metall >= cost.metall * qty &&
    state.resources.kristall >= cost.kristall * qty &&
    state.resources.deuterium >= cost.deuterium * qty
  );
}

// R13, 11.08.2026: zaehlte bisher NUR state.fleet (zuhause) + buildQueue und liess damit das
// globale Flottenlimit umgehen - Flotte wegschicken, zuhause bis zum Limit nachbauen, Flotte kehrt
// zurueck. Genau derselbe Fehler war fuer die EINZEL-Limits laengst behoben
// (countShipEverywhere() weiter unten), bei dieser Funktion aber nie nachgezogen.
// Zaehlt jetzt dieselben fuenf Orte wie countShipEverywhere(), nur ueber alle Schiffstypen.
export function totalOwnedShips(state: PlayerState): number {
  let total = 0;
  Object.values(state.fleet).forEach((c) => (total += c || 0));
  state.buildQueue.forEach((job) => (total += job.count || 0));
  state.missions.forEach((m) => {
    if (!m.finalized) Object.values(m.ships).forEach((c) => (total += c || 0));
  });
  state.galaxyDeployments.forEach((d) => {
    Object.values(d.ships).forEach((c) => (total += c || 0));
  });
  listMyGroupOperations(state.userId).forEach((op) => {
    op.participants.forEach((p) => {
      if (p.userId === state.userId && p.status === 'accepted') {
        Object.values(p.ships).forEach((c) => (total += c || 0));
      }
    });
  });
  return total;
}

// ===== ABSICHERUNG GEGEN RUECKWIRKENDE SPERRE (R13) =====
// Die Korrektur oben macht die Zaehlung STRENGER. Wer unter der alten, zu niedrigen Zaehlung
// legitim aufgebaut hat, koennte dadurch schlagartig ueber dem Limit liegen und gar kein Schiff
// mehr bauen - genau dieser Vorfall ist am 09.08.2026 schon einmal eingetreten (103.196 Schiffe
// ueber dem damaligen Limit, kompletter Baustopp).
//
// Loesung: eine persoenliche Obergrenze, die beim ersten Mal auf den tatsaechlichen Bestand gesetzt
// wird und danach nur noch SINKEN kann ("Ratsche"):
//   - Beim ersten Aufruf nach der Umstellung: Obergrenze = max(MAX_PLAYER_SHIPS, Ist-Bestand).
//     Niemand wird also schlechter gestellt als im Moment der Umstellung.
//   - Bei jedem weiteren Aufruf: Obergrenze = max(MAX_PLAYER_SHIPS, min(gespeichert, Ist-Bestand)).
//     Sinkt der Bestand (Verschrottung, Verluste), sinkt die Obergrenze mit - sie kann NIE wieder
//     steigen. Wer einmal unter MAX_PLAYER_SHIPS faellt, ist dauerhaft im Normalzustand.
// Ausnutzen laesst sich das nicht: ueber der Obergrenze wird weiterhin nicht gebaut, sie waechst
// nie, und sie verschwindet von selbst.
// Einmaliger Zuschlag beim Grandfathering. Ohne ihn waere die Obergrenze exakt gleich dem
// Ist-Bestand - der Spieler koennte also am Tag der Umstellung KEIN einziges Schiff mehr bauen,
// also genau der Vorfall vom 09.08.2026 noch einmal. Der Zuschlag ist unbedenklich, weil
// MAX_PLAYER_SHIPS ausdruecklich ein Sicherheitsnetz gegen CPU-Last ist und kein Balance-Wert
// (siehe Kommentar dort) und die Kampf-Engine laut README-Benchmark bis 1,5 Mio. Schiffen bei
// ~26 ms bleibt - 25 % ueber einer ohnehin konservativen 200.000er-Grenze liegt weit darunter.
const SHIP_LIMIT_GRANDFATHER_HEADROOM = 1.25;

export function effectiveShipLimit(state: PlayerState): number {
  const total = totalOwnedShips(state);
  const stored = state.shipLimitCeiling;
  const ceiling =
    stored === undefined
      ? Math.max(MAX_PLAYER_SHIPS, Math.ceil(total * SHIP_LIMIT_GRANDFATHER_HEADROOM))
      : Math.max(MAX_PLAYER_SHIPS, Math.min(stored, Math.ceil(total * SHIP_LIMIT_GRANDFATHER_HEADROOM)));
  state.shipLimitCeiling = ceiling;
  return ceiling;
}

// Bugfix: zaehlte bisher NUR state.fleet (zuhause) + buildQueue (im Bau) - Schiffe, die gerade
// auf einer Sektor-Mission unterwegs sind, bei einem anderen Spieler "halten" oder Teil einer
// laufenden Elite-Bollwerk-/Piratenadmiral-Expedition sind, wurden NICHT mitgezaehlt. Dadurch
// liess sich das Bau-Limit (maxCount, z.B. Salvenschiffe) und sogar "unique" (Sandronator)
// umgehen: einfach die vorhandenen Einheiten wegschicken, dann zeigte der Bestand weniger als das
// Limit und der Bauen-Button liess sich wieder klicken, obwohl inklusive der unterwegs
// befindlichen Schiffe das Limit laengst erreicht war.
export function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  state.missions.forEach((m) => {
    if (!m.finalized) total += m.ships[shipId] || 0;
  });
  state.galaxyDeployments.forEach((d) => {
    total += d.ships[shipId] || 0;
  });
  listMyGroupOperations(state.userId).forEach((op) => {
    op.participants.forEach((p) => {
      if (p.userId === state.userId && p.status === 'accepted') total += p.ships[shipId] || 0;
    });
  });
  return total;
}

function countDefenseEverywhere(state: PlayerState, defId: string): number {
  let total = state.defense[defId] || 0;
  state.defenseQueue.forEach((job) => {
    if (job.defId === defId) total += job.count || 0;
  });
  return total;
}

// ========== GEBAEUDE: ENERGIE + PRODUKTION ==========
// Ogame-artiges Energie-System: die drei Minen verbrauchen Energie, das Solarkraftwerk liefert
// sie. Reicht die Energie nicht, wird die Produktion ALLER Minen anteilig gedrosselt (nie mehr
// als 100%, kein Energie-Ueberschuss-Bonus).

const MINE_KINDS = ['mine_metall', 'mine_kristall', 'mine_deuterium'] as const;

// V2/V3-Stufen (05.08.2026): Energie bleibt PRO STUFE ISOLIERT (analog stationEnergyFactorForTier()
// in stations.ts) - ein spaet gebautes V3-Solarkraftwerk versorgt nicht rueckwirkend V1/V2-Minen
// mit Energie. Jede Stufe ist wirtschaftlich in sich geschlossen.
function levelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}

export function energyProduced(state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  const solar = buildingsForTier(tier).find((b) => b.kind === 'energie');
  if (!solar) return 0;
  const base = levelScaledValue(solar.baseEnergyOutput || 0, state.buildings[solar.id] || 0);
  const moduleId = tier === 1 ? 'solarkraftwerk_ertragssteigerung' : `${solar.id}_ertragssteigerung`;
  return base * moduleBoostFactor(state, moduleId);
}

export function energyConsumed(state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  let total = 0;
  buildingsForTier(tier).forEach((building) => {
    if (!(MINE_KINDS as readonly string[]).includes(building.kind)) return;
    const base = levelScaledValue(building.baseEnergyUse || 0, state.buildings[building.id] || 0);
    const moduleId = tier === 1 ? MINE_ENERGY_MODULE[building.id] : `${building.id}_energiesparmodul`;
    total += base * moduleReductionFactor(state, moduleId);
  });
  return total;
}

export function energyFactor(state: PlayerState, tier: 1 | 2 | 3 = 1): number {
  const consumed = energyConsumed(state, tier);
  if (consumed <= 0) return 1;
  return Math.min(1, energyProduced(state, tier) / consumed);
}

// Basis-Mining-Forschung (research.mining) wirkt weiterhin auf BEIDES (Schiffe UND Minen-
// Gebaeude, siehe Punkt 58) - der neue Forschungsbaum-Zweig "Mining-Boost: Minen" stapelt
// ZUSAETZLICH NUR fuer die Gebaeude-Produktion obendrauf (Pendant fuer Schiffe: siehe
// miningMultiplier() in missions.ts mit "Mining-Boost: Schiffe").
function miningBuildingMultiplier(state: PlayerState): number {
  const base = 1 + (state.research.mining || 0) * 0.1;
  const specific = 1 + (state.research.mining_minen || 0) * 0.05;
  const economy = state.economyClass === 'prospektor' ? ECONOMY_PROSPEKTOR_MINING_MULTIPLIER : 1;
  const booster = isBoosterActive(state, 'abbau') ? ABBAU_BOOST_MULTIPLIER : 1;
  return base * specific * economy * booster;
}

// Ertrag einer Mine in Ressourcen/Stunde, inkl. Energiefaktor, Mining-Forschung und dem
// gebaeudeeigenen "Foerdereffizienz"-Modul. Energiefaktor wird anhand der EIGENEN Stufe des
// Gebaeudes berechnet (V2/V3-Minen haengen am Energiefaktor ihrer eigenen Stufe, siehe oben).
export function mineOutputPerHour(state: PlayerState, buildingId: string): number {
  const building = findBuilding(buildingId);
  if (!building || !building.baseOutput) return 0;
  const tier = building.tier ?? 1;
  const base = levelScaledValue(building.baseOutput, state.buildings[buildingId] || 0);
  const moduleId = tier === 1 ? MINE_OUTPUT_MODULE[buildingId] : `${buildingId}_foerdereffizienz`;
  const moduleFactor = moduleId ? moduleBoostFactor(state, moduleId) : 1;
  return base * energyFactor(state, tier) * miningBuildingMultiplier(state) * moduleFactor;
}

// Rechnet die seit dem letzten tick() vergangene Zeit als passive Minen-Produktion hoch.
// V2/V3-Stufen (05.08.2026): summiert JETZT ueber ALLE Gebaeude-Eintraege (alle Stufen) statt nur
// die drei V1-Minen - Produktion zaehlt kumulativ ueber alle freigeschalteten Stufen (analog
// accrueStationProduction() in stations.ts). Noch nicht freigeschaltete V2/V3-Minen haben immer
// Level 0 (koennen nicht gebaut werden, siehe startBuildingConstruction), tragen also ohnehin
// nichts bei.
export function accrueBuildingProduction(state: PlayerState, deltaSec: number): void {
  if (deltaSec <= 0) return;
  const npcBonus = isNpcState(state) ? NPC_PRODUCTION_BONUS_MULTIPLIER : 1;
  BUILDINGS.forEach((building) => {
    if (!building.baseOutput) return;
    const gain = (mineOutputPerHour(state, building.id) / 3600) * deltaSec * npcBonus;
    if (building.kind === 'mine_metall') state.resources.metall += gain;
    else if (building.kind === 'mine_kristall') state.resources.kristall += gain;
    else if (building.kind === 'mine_deuterium') state.resources.deuterium += gain;
  });
}

// Schaltet die naechste Heimatbasis-Gebaeude-Stufe frei, sobald alle Minen DIESER Stufe ihre
// HOME_TIER_UNLOCK_LEVELS-Schwelle erreicht haben (05.08.2026, Nutzerentscheidung) - analog
// checkTierUnlock() in stations.ts, aber gegen feste Schwellenwerte statt einem gemeinsamen
// maxLevel, da Heimatbasis-Gebaeude bewusst unbegrenzt bleiben.
export function checkHomeBuildingTierUnlock(state: PlayerState): void {
  if (!state.buildingTier) state.buildingTier = 1;
  if (state.buildingTier >= 3) return;
  const thresholds = HOME_TIER_UNLOCK_LEVELS[state.buildingTier as 1 | 2];
  const allMet = Object.entries(thresholds).every(([id, lvl]) => (state.buildings[id] || 0) >= lvl);
  if (allMet) state.buildingTier = (state.buildingTier + 1) as 1 | 2 | 3;
}

// Exportiert fuer die Ruecklagen-Logik der KI (economyBotTurn.ts) - dort muessen die Kosten des
// NAECHSTEN Ausbauschritts bekannt sein, bevor entschieden wird, ob Ressourcen fuer Schiffe oder
// Verteidigung ausgegeben werden duerfen.
export function buildingCostForLevel(building: BuildingDefinition, level: number): ResourceCost {
  const f = Math.pow(building.costGrowth, level - 1);
  return {
    metall: Math.round(building.baseCost.metall * f),
    kristall: Math.round(building.baseCost.kristall * f),
    deuterium: Math.round(building.baseCost.deuterium * f),
  };
}

function buildingTimeForLevel(state: PlayerState, building: BuildingDefinition, level: number): number {
  return building.baseTimeSeconds * Math.pow(building.timeGrowth, level - 1) * 1000 * gebaeudeBauzeitMultiplier(state, building.id);
}

// ========== PRODUKTION + WARTESCHLANGEN "NACHHOLEN" ==========
// Wird bei jedem Laden des Spielzustands aufgerufen und rechnet alles seit `lastUpdate` hoch -
// ersetzt den setInterval-Loop aus dem HTML-Prototyp durch ein zustandsloses "catch up"-Prinzip,
// das serverseitig ohne Dauer-Prozess auskommt.
// Reiner "Wirtschafts-Tick" (Produktion, alle Bau-/Forschungs-Warteschlangen, Missionen) OHNE die
// spielerspezifischen Extras (Raids/Piratenbasis-Angriffe/Spionage/Gruppen-Expeditionen) - extrahiert
// aus tick() (Nutzerentscheidung Juli 2026), damit Piratenbasen (siehe pirateBaseState.ts, laufen
// jetzt als vollwertige PlayerState-Wirtschaft "genau wie ein Spieler") dieselbe Produktions-/
// Warteschlangen-/Mining-Logik nutzen koennen, OHNE die player-only Extras mitzuziehen (eine
// Piratenbasis wird z.B. nicht "geraidet" oder spioniert die umgekehrt Spieler aus). Bewusst NICHT
// in eine eigene Datei ausgelagert, um einen Zirkelimport zu vermeiden: `tick()` hier importiert
// `processPirateAttacks` NICHT mehr direkt (siehe unten) - der Aufruf wandert stattdessen zu den
// beiden tick()-Aufrufstellen (routes.ts handleAction(), heartbeat.ts), damit pirateBaseState.ts
// gefahrlos `runEconomyTick` aus DIESER Datei importieren kann, ohne dass actions.ts umgekehrt aus
// pirateBaseState.ts importiert.
export async function runEconomyTick(state: PlayerState): Promise<void> {
  const now = Date.now();
  const deltaSec = Math.max(0, (now - state.lastUpdate) / 1000);

  // Passive Minen-Produktion seit dem letzten Tick hochrechnen (vor der Bau-Warteschlange, damit
  // eine in derselben Sekunde fertigwerdende Mine erst ab jetzt mit ihrer neuen Stufe zaehlt -
  // unkritisch bei Sekunden-Aufloesung, aber so bleibt die Reihenfolge eindeutig).
  accrueBuildingProduction(state, deltaSec);

  // Zurueckgerufene Galaxie-Flotten heimkehren lassen, sobald ihre Rueckflugzeit erreicht ist.
  processGalaxyDeployments(state);
  // Bergungs-Fluege zu Galaxie-Ereignissen (Wrack/Handelskonvoi) verarbeiten - Ankunft/Beute
  // sichern UND Rueckkehr, siehe galaxyEvents.ts.
  processEventTrips(state);

  // Gebaeude-Warteschlange abarbeiten (immer max. 1 Eintrag, siehe MAX_BUILDING_SLOTS) - Module
  // teilen sich denselben Slot/dieselbe Warteschlange (siehe startModuleUpgrade).
  const stillBuildingBuildings = state.buildingQueue.filter((job) => {
    if (job.endTime <= now && job.buildingId) {
      state.buildings[job.buildingId] = (state.buildings[job.buildingId] || 0) + job.count;
      return false;
    }
    if (job.endTime <= now && job.moduleId) {
      state.buildingModules[job.moduleId] = (state.buildingModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.buildingQueue = stillBuildingBuildings;
  checkHomeBuildingTierUnlock(state);

  // Schiffsmodul-Warteschlange abarbeiten (bis zu MAX_SHIP_MODULE_SLOTS parallele Eintraege) -
  // eigene Slots, unabhaengig von der normalen Schiffs-Bauschlange (buildQueue).
  const stillBuildingShipModules = state.shipModuleQueue.filter((job) => {
    if (job.endTime <= now && job.moduleId) {
      state.shipModules[job.moduleId] = (state.shipModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.shipModuleQueue = stillBuildingShipModules;

  // Verteidigungsmodul-Warteschlange abarbeiten (eigener Slot, siehe MAX_DEFENSE_MODULE_SLOTS) -
  // Stufe landet in DERSELBEN state.shipModules-Map wie Schiffs-Module (siehe Kommentar dort).
  const stillBuildingDefenseModules = state.defenseModuleQueue.filter((job) => {
    if (job.endTime <= now && job.moduleId) {
      state.shipModules[job.moduleId] = (state.shipModules[job.moduleId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.defenseModuleQueue = stillBuildingDefenseModules;

  // Bau-Warteschlange abarbeiten
  const stillBuilding = state.buildQueue.filter((job) => {
    if (job.endTime <= now && job.shipId) {
      state.fleet[job.shipId] = (state.fleet[job.shipId] || 0) + job.count;
      state.stats.shipsBuilt += job.count;
      return false;
    }
    return true;
  });
  state.buildQueue = stillBuilding;

  // Verteidigungs-Warteschlange abarbeiten
  const stillBuildingDef = state.defenseQueue.filter((job) => {
    if (job.endTime <= now && job.defId) {
      state.defense[job.defId] = (state.defense[job.defId] || 0) + job.count;
      return false;
    }
    return true;
  });
  state.defenseQueue = stillBuildingDef;

  // Forschungs-Warteschlange abarbeiten
  const stillResearching = state.researchQueue.filter((job) => {
    if (job.endTime <= now) {
      state.research[job.techId] = job.targetLevel;
      state.stats.researchCompleted++;
      return false;
    }
    return true;
  });
  state.researchQueue = stillResearching;

  // Abgelaufene Booster entfernen
  Object.keys(state.activeBoosters).forEach((id) => {
    if (state.activeBoosters[id] <= now) delete state.activeBoosters[id];
  });

  // Missionen (Farmen/Kampf) nachholen - Asteroiden-/Piraten-Sektor-Fluege, genau wie bei einem
  // echten Spieler.
  const missionsStart = Date.now();
  await processMissions(state);
  const missionsMs = Date.now() - missionsStart;
  if (missionsMs > SLOW_TICK_PHASE_MS) {
    console.warn(`runEconomyTick: langsames processMissions() fuer Nutzer ${state.userId}: ${missionsMs}ms`);
  }

  state.lastUpdate = now;
}

// Diagnose (Juli 2026, Nutzer-Feedback: CPU-Spitzen genau beim Einloggen/aktiven Spielen, auch
// NACH Entfernung der KI-Mitspieler/Piratenbasen-Autonomie - siehe README Punkt 98/99) - tick()
// laeuft bei JEDEM GET /game/state-Poll (alle 3s, siehe GameContext.tsx), einzelne Teilschritte
// hatten aber bisher keine eigene Zeitmessung wie der globale Heartbeat. Nur bei ungewoehnlicher
// Dauer wird geloggt, um die Logs im Normalbetrieb nicht zuzuspammen.
const SLOW_TICK_PHASE_MS = 1000;

export async function tick(state: PlayerState): Promise<PlayerState> {
  const t0 = Date.now();
  await runEconomyTick(state);
  const t1 = Date.now();
  const now = Date.now();
  await processRaidTimer(state);
  const t2 = Date.now();
  // Spionagefluege gegen Piratenbasen UND der umgekehrte periodische Check "wurde ich gerade von
  // Piraten ausspioniert" (siehe spyMissions.ts) - beide komplett unabhaengig von Raids/Angriffen.
  await processSpyMissions(state);
  maybeGeneratePirateSpyReport(state);
  const t3 = Date.now();
  // Ab hier: nicht nur den eigenen Zustand nachziehen, sondern bei jedem Tick zusaetzlich fuer
  // ALLE anderen Spieler pruefen, ob faellige Checkpoints/Expeditionen liegen geblieben sind -
  // damit Raids/Multiplayer-Expeditionen auch dann weiterlaufen, wenn der jeweils betroffene
  // Spieler selbst gerade nicht online ist (siehe README fuer den Hintergrund).
  await processOverdueRaidsForOtherUsers(state);
  const t4 = Date.now();
  await processOverdueRaidSpawnsForOtherUsers(state);
  const t5 = Date.now();
  await processAllDepartedGroupOperations(state);
  await autoStartReadyGroupOperations(state);
  const t6 = Date.now();
  const phases: [string, number][] = [
    ['runEconomyTick', t1 - t0],
    ['processRaidTimer', t2 - t1],
    ['processSpyMissions+Report', t3 - t2],
    ['processOverdueRaidsForOtherUsers', t4 - t3],
    ['processOverdueRaidSpawnsForOtherUsers', t5 - t4],
    ['processAllDepartedGroupOperations', t6 - t5],
  ];
  for (const [label, ms] of phases) {
    if (ms > SLOW_TICK_PHASE_MS) {
      console.warn(`tick(): langsame Phase "${label}" fuer Nutzer ${state.userId}: ${ms}ms`);
    }
  }

  state.lastUpdate = now;
  return state;
}

// ========== SCHIFFE BAUEN ==========

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export function startBuild(state: PlayerState, shipId: string, qty: number): ActionResult {
  const ship = findShip(shipId);
  if (!ship || ship.specialOnly) return { ok: false, error: 'Unbekanntes oder nicht direkt baubares Schiff.' };

  if (ship.unique && countShipEverywhere(state, shipId) >= 1) {
    return { ok: false, error: `${ship.name} ist einzigartig - es kann nur ein Exemplar existieren.` };
  }
  const effectiveQty = ship.unique ? 1 : qty;
  if (effectiveQty <= 0) return { ok: false, error: 'Ungueltige Menge.' };

  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    return { ok: false, error: `Alle ${MAX_BUILD_SLOTS} Bau-Slots sind belegt.` };
  }
  if (ship.maxCount) {
    const frei = ship.maxCount - countShipEverywhere(state, shipId);
    if (frei <= 0) return { ok: false, error: `${ship.name} ist limitiert - maximal ${ship.maxCount} Stueck moeglich.` };
    if (effectiveQty > frei) return { ok: false, error: `Nur noch ${frei} ${ship.name} bis zum Limit moeglich.` };
  }
  const costMultiplier = shipCostMultiplier(state);
  const effectiveCost: ResourceCost = {
    metall: ship.cost ? ship.cost.metall * costMultiplier : 0,
    kristall: ship.cost ? ship.cost.kristall * costMultiplier : 0,
    deuterium: ship.cost ? ship.cost.deuterium * costMultiplier : 0,
  };
  if (!ship.cost || !canAfford(state, effectiveCost, effectiveQty)) {
    return { ok: false, error: 'Nicht genug Ressourcen.' };
  }
  const limit = effectiveShipLimit(state);
  const frei = limit - totalOwnedShips(state);
  // Wenn `frei` negativ ist, liegt der Bestand bereits UEBER dem Limit (moeglich, siehe Kommentar
  // an MAX_PLAYER_SHIPS). Die alte Meldung gab dann woertlich "Nur noch -3196 Schiff(e) moeglich"
  // aus - fachlich richtig, aber fuer den Spieler unverstaendlich.
  if (frei <= 0) {
    return {
      ok: false,
      error: `Flottenlimit erreicht: ${totalOwnedShips(state)} von ${limit} Schiffen (inkl. unterwegs befindlicher Flotten). Verschrotte Schiffe, um wieder bauen zu koennen.`,
    };
  }
  if (effectiveQty > frei) return { ok: false, error: `Nur noch ${frei} Schiff(e) bis zum Flottenlimit moeglich.` };

  state.resources.metall -= effectiveCost.metall * effectiveQty;
  state.resources.kristall -= effectiveCost.kristall * effectiveQty;
  state.resources.deuterium -= effectiveCost.deuterium * effectiveQty;
  state.stats.resourcesSpentShipsDefense += (effectiveCost.metall + effectiveCost.kristall + effectiveCost.deuterium) * effectiveQty;

  const now = Date.now();
  let startTime = now;
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    const laneJob = state.buildQueue[state.buildQueue.length - MAX_BUILD_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  const duration = ship.buildTime * bauzeitMultiplier(state) * effectiveQty * 1000;
  state.buildQueue.push({ shipId, count: effectiveQty, startTime, endTime: startTime + duration });
  return { ok: true };
}

export function startDefenseBuild(state: PlayerState, defId: string, qty: number): ActionResult {
  const def = findDefense(defId);
  if (!def) return { ok: false, error: 'Unbekannte Verteidigungsanlage.' };
  if (qty <= 0) return { ok: false, error: 'Ungueltige Menge.' };

  if (def.maxCount) {
    const frei = def.maxCount - countDefenseEverywhere(state, defId);
    if (frei <= 0) return { ok: false, error: `${def.name} ist limitiert - maximal ${def.maxCount} Stueck moeglich.` };
    if (qty > frei) return { ok: false, error: `Nur noch ${frei} ${def.name} bis zum Limit moeglich.` };
  }
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) {
    return { ok: false, error: `Alle ${MAX_DEFENSE_SLOTS} Bau-Slots sind belegt.` };
  }
  const costMultiplier = defenseCostMultiplier(state);
  const effectiveCost: ResourceCost = {
    metall: def.cost.metall * costMultiplier,
    kristall: def.cost.kristall * costMultiplier,
    deuterium: def.cost.deuterium * costMultiplier,
  };
  if (!canAfford(state, effectiveCost, qty)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= effectiveCost.metall * qty;
  state.resources.kristall -= effectiveCost.kristall * qty;
  state.resources.deuterium -= effectiveCost.deuterium * qty;
  state.stats.resourcesSpentShipsDefense += (effectiveCost.metall + effectiveCost.kristall + effectiveCost.deuterium) * qty;

  const now = Date.now();
  let startTime = now;
  if (state.defenseQueue.length >= MAX_DEFENSE_SLOTS) {
    const laneJob = state.defenseQueue[state.defenseQueue.length - MAX_DEFENSE_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  const duration = def.buildTime * defenseBauzeitMultiplier(state) * qty * 1000;
  state.defenseQueue.push({ defId, count: qty, startTime, endTime: startTime + duration });
  return { ok: true };
}

// ========== GEBAEUDE BAUEN ==========

export function startBuildingConstruction(state: PlayerState, buildingId: string): ActionResult {
  const building = findBuilding(buildingId);
  if (!building) return { ok: false, error: 'Unbekanntes Gebäude.' };
  const requiredTier = building.tier ?? 1;
  if (requiredTier > (state.buildingTier || 1)) {
    return { ok: false, error: `Diese Stufe ist noch nicht freigeschaltet - Metallmine, Kristallmine und Deuterium-Synthetisierer der Vorstufe müssen zuerst die nötigen Level erreichen.` };
  }
  if (state.buildingQueue.length >= MAX_BUILDING_SLOTS) {
    return { ok: false, error: 'Es kann immer nur ein Gebäude gleichzeitig gebaut werden.' };
  }

  const level = state.buildings[buildingId] || 0;
  const nextLevel = level + 1;
  const cost = buildingCostForLevel(building, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;
  state.stats.resourcesSpentResearchBuildings += cost.metall + cost.kristall + cost.deuterium;

  const now = Date.now();
  const duration = buildingTimeForLevel(state, building, nextLevel);
  state.buildingQueue.push({ buildingId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== GEBAEUDE-MODULSYSTEM (siehe types.ts BuildingModuleDefinition/README) ==========

function moduleCostForLevel(mod: (typeof BUILDING_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function moduleTimeForLevel(state: PlayerState, mod: (typeof BUILDING_MODULES)[number], level: number): number {
  // Module nutzen bewusst DIESELBE Bauzeit-Multiplikator-Kette wie ihr Basis-Gebaeude (inkl.
  // dessen eigenem "buildtime_self"-Modul, siehe gebaeudeBauzeitMultiplier) - ein Modul ist
  // schliesslich Teil desselben Bauprojekts, keine eigene Kategorie.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * gebaeudeBauzeitMultiplier(state, mod.buildingId);
}

export function startModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findBuildingModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const buildingLevel = state.buildings[mod.buildingId] || 0;
  if (buildingLevel < mod.requiredBuildingLevel) {
    const building = findBuilding(mod.buildingId);
    return { ok: false, error: `Erfordert ${building?.name || mod.buildingId} Stufe ${mod.requiredBuildingLevel}.` };
  }
  const level = state.buildingModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Module teilen sich den Bau-Slot mit den Gebaeuden selbst (MAX_BUILDING_SLOTS=1) - ein Modul
  // ist konzeptionell ein Ausbauprojekt AM Gebaeude, kein eigenstaendiges Bauvorhaben.
  if (state.buildingQueue.length >= MAX_BUILDING_SLOTS) {
    return { ok: false, error: 'Es kann immer nur ein Gebäude/Modul gleichzeitig gebaut werden.' };
  }

  const nextLevel = level + 1;
  const cost = moduleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;
  state.stats.resourcesSpentResearchBuildings += cost.metall + cost.kristall + cost.deuterium;

  const now = Date.now();
  const duration = moduleTimeForLevel(state, mod, nextLevel);
  state.buildingQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== SCHIFFS-MODULE (Waffen/Schild/Panzerung/Antrieb pro Schiff, siehe data/shipModules.ts) ==========

function shipModuleCostForLevel(mod: (typeof SHIP_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function shipModuleTimeForLevel(state: PlayerState, mod: (typeof SHIP_MODULES)[number], level: number): number {
  // Nutzt dieselbe Bauzeit-Multiplikator-Kette wie normale Schiffe (bauzeitMultiplier) - ein
  // Schiffs-Modul ist schliesslich eine Werft-Ausbaumassnahme wie der Schiffbau selbst.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * bauzeitMultiplier(state);
}

export function startShipModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findShipModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const level = state.shipModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Schiffs-Module teilen sich MAX_SHIP_MODULE_SLOTS globale Bauplaetze, unabhaengig von
  // den 3 normalen Schiffs-Bauplaetzen (buildQueue) - konkurriert nicht mit dem eigentlichen
  // Schiffbau.
  if (state.shipModuleQueue.length >= MAX_SHIP_MODULE_SLOTS) {
    return { ok: false, error: `Es können maximal ${MAX_SHIP_MODULE_SLOTS} Schiffsmodule gleichzeitig gebaut werden.` };
  }

  const nextLevel = level + 1;
  const cost = shipModuleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;
  state.stats.resourcesSpentShipsDefense += cost.metall + cost.kristall + cost.deuterium;

  const now = Date.now();
  const duration = shipModuleTimeForLevel(state, mod, nextLevel);
  state.shipModuleQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== VERTEIDIGUNGS-MODULE (Waffen/Schild/Panzerung pro Anlage, siehe data/defenseModules.ts) ==========
// Stufen landen in DERSELBEN state.shipModules-Map wie Schiffs-Module (siehe
// DefenseModuleDefinition-Kommentar in types.ts) - nur die Bauschlange/der Slot ist eigenstaendig.

function defenseModuleCostForLevel(mod: (typeof DEFENSE_MODULES)[number], level: number): ResourceCost {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function defenseModuleTimeForLevel(state: PlayerState, mod: (typeof DEFENSE_MODULES)[number], level: number): number {
  // Nutzt dieselbe Bauzeit-Multiplikator-Kette wie normale Verteidigungsanlagen
  // (defenseBauzeitMultiplier), analog zu shipModuleTimeForLevel oben.
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * defenseBauzeitMultiplier(state);
}

export function startDefenseModuleUpgrade(state: PlayerState, moduleId: string): ActionResult {
  const mod = findDefenseModule(moduleId);
  if (!mod) return { ok: false, error: 'Unbekanntes Modul.' };
  const level = state.shipModules[moduleId] || 0;
  if (level >= mod.maxLevel) return { ok: false, error: 'Maximalstufe erreicht.' };
  // Verteidigungs-Module teilen sich MAX_DEFENSE_MODULE_SLOTS globale Bauplaetze,
  // eigenstaendig getrennt von der Schiffsmodul-Warteschlange und den 3 normalen
  // Verteidigungs-Bauplaetzen (defenseQueue).
  if (state.defenseModuleQueue.length >= MAX_DEFENSE_MODULE_SLOTS) {
    return { ok: false, error: `Es können maximal ${MAX_DEFENSE_MODULE_SLOTS} Verteidigungsmodule gleichzeitig gebaut werden.` };
  }

  const nextLevel = level + 1;
  const cost = defenseModuleCostForLevel(mod, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;
  state.stats.resourcesSpentShipsDefense += cost.metall + cost.kristall + cost.deuterium;

  const now = Date.now();
  const duration = defenseModuleTimeForLevel(state, mod, nextLevel);
  state.defenseModuleQueue.push({ moduleId, count: 1, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== FORSCHUNG ==========

// Exportiert, siehe buildingCostForLevel() - gleicher Zweck.
export function researchCostForLevel(tech: (typeof RESEARCH)[number], level: number): ResourceCost {
  const f = Math.pow(tech.costGrowth, level - 1);
  return {
    metall: Math.round(tech.baseCost.metall * f),
    kristall: Math.round(tech.baseCost.kristall * f),
    deuterium: Math.round(tech.baseCost.deuterium * f),
  };
}

function researchTimeForLevel(state: PlayerState, tech: (typeof RESEARCH)[number], level: number): number {
  return tech.baseTimeHours * Math.pow(tech.timeGrowth, level - 1) * 3600 * 1000 * researchTimeMultiplier(state);
}

export function startResearch(state: PlayerState, techId: string): ActionResult {
  const tech = RESEARCH.find((r) => r.id === techId);
  if (!tech) return { ok: false, error: 'Unbekannte Forschung.' };
  // Spionage wieder freigeschaltet (Nutzerentscheidung Juli 2026) - ihr NEUER Zweck ist der
  // Detailgrad von Spionageflug-Berichten gegen Piratenbasen (siehe spyMissions.ts), nicht mehr die
  // alte, kaum spuerbare Gegner-Glaettung (generatePiratenFleet()/generateDefenseFleet() bekommen
  // weiterhin ueberall fest 0 fuer spionageLevel uebergeben - bewusst UNVERAENDERT belassen, siehe
  // missions.ts/groupOps.ts/simulator.ts, da der neue Zweck damit nichts zu tun hat).
  // Forschungsbaum: Voraussetzung pruefen (siehe ResearchDefinition.parentId, types.ts) - die
  // Elternforschung muss PARENT_UNLOCK_LEVEL (einheitlich Stufe 3) erreicht haben, bevor dieser
  // Zweig ueberhaupt gestartet werden kann.
  if (tech.parentId) {
    const parentLevel = state.research[tech.parentId] || 0;
    if (parentLevel < PARENT_UNLOCK_LEVEL) {
      const parentTech = RESEARCH.find((r) => r.id === tech.parentId);
      return { ok: false, error: `Erfordert ${parentTech?.name || tech.parentId} Stufe ${PARENT_UNLOCK_LEVEL}.` };
    }
  }
  if (state.researchQueue.length >= MAX_RESEARCH_SLOTS) {
    return { ok: false, error: `Es laufen bereits ${MAX_RESEARCH_SLOTS} Forschungen gleichzeitig (Maximum).` };
  }
  if (state.researchQueue.some((j) => j.techId === techId)) {
    return { ok: false, error: 'Diese Forschung laeuft bereits.' };
  }
  const currentLevel = state.research[techId] || 0;
  const nextLevel = currentLevel + 1;
  const cost = researchCostForLevel(tech, nextLevel);
  if (!canAfford(state, cost, 1)) return { ok: false, error: 'Nicht genug Ressourcen.' };

  state.resources.metall -= cost.metall;
  state.resources.kristall -= cost.kristall;
  state.resources.deuterium -= cost.deuterium;
  state.stats.resourcesSpentResearchBuildings += cost.metall + cost.kristall + cost.deuterium;

  const now = Date.now();
  const duration = researchTimeForLevel(state, tech, nextLevel);
  state.researchQueue.push({ techId, targetLevel: nextLevel, startTime: now, endTime: now + duration });
  return { ok: true };
}

// ========== IMPERATOR (SPEZIALTEILE) ==========

export function buildImperator(state: PlayerState): ActionResult {
  const ship = findShip('imperator');
  if (!ship || !ship.teileCost || !ship.maxCount) return { ok: false, error: 'Imperator-Daten fehlerhaft.' };
  const cost = ship.teileCost;
  if (state.teile.waffen < cost.waffen || state.teile.schild < cost.schild || state.teile.panzerung < cost.panzerung) {
    return { ok: false, error: 'Nicht genug Teile.' };
  }
  if (state.buildQueue.some((j) => j.shipId === 'imperator')) {
    return { ok: false, error: 'Es wird bereits ein Imperator gebaut.' };
  }
  if (countShipEverywhere(state, 'imperator') >= ship.maxCount) {
    return { ok: false, error: `Der Imperator ist limitiert - maximal ${ship.maxCount} Exemplare möglich.` };
  }
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    return { ok: false, error: `Alle ${MAX_BUILD_SLOTS} Bau-Slots sind belegt.` };
  }
  if (totalOwnedShips(state) >= effectiveShipLimit(state)) {
    return { ok: false, error: `Flottenlimit erreicht (${effectiveShipLimit(state)} Schiffe, inkl. unterwegs befindlicher Flotten).` };
  }
  state.teile.waffen -= cost.waffen;
  state.teile.schild -= cost.schild;
  state.teile.panzerung -= cost.panzerung;

  const now = Date.now();
  let startTime = now;
  if (state.buildQueue.length >= MAX_BUILD_SLOTS) {
    const laneJob = state.buildQueue[state.buildQueue.length - MAX_BUILD_SLOTS];
    startTime = Math.max(now, laneJob.endTime);
  }
  state.buildQueue.push({ shipId: 'imperator', count: 1, startTime, endTime: startTime + ship.buildTime * 1000 });
  return { ok: true };
}
