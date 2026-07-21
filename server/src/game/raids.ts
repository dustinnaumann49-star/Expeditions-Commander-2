import { DEFENSES } from './data/defenses.js';
import {
  RAID_SPAWN_CHANCE,
  RAID_LOOT_PERCENT,
  COMBAT_SHIP_IDS,
  rollFixedCheckpoints,
  RAID_CHECK_HOURS_LOCAL,
  RAID_SCHEDULE_BY_USERNAME,
  RAID_SALVAGE_DM_PER_KILL,
  RAID_SALVAGE_DM_MAX,
  RAID_MIN_TARGET_POWER,
  RAID_WAVE_COUNT,
  RAID_ASSAULT_DURATION_MS,
  RAID_WAVE_JITTER_FACTOR,
  RAID_WAVE_FACTORS,
  RAID_PERFECT_ELITE_CHANCE,
} from './data/economy.js';
import { PIRATE_BASES, PIRATE_FLEET_SPEED, RAID_PREP_MS } from './data/galaxyConstants.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  generateFallbackFleet,
  computeDomeSharedPool,
  pickWaveProfile,
  rollBattleModifier,
} from './combat.js';
import type { OwnedFleetContribution } from './combat.js';
import { runCombatInWorker, runMultiOwnerCombatInWorker } from './combatRunner.js';
import { DEFENSE_REPAIR_PERCENT, BATTLE_MODIFIER_LABELS } from './data/combatConstants.js';
import { CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT } from './data/classes.js';
import { pushMessage } from './messages.js';
import { addContainers } from './inventory.js';
import { isBoosterActive } from './boosterUtil.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { getHoldingDeploymentsTargeting, persistHeldDeployment, galaxyDistance, galaxyDurationMs } from './galaxy.js';
import { getUserById, listAllUsers } from '../db.js';
import type { CombatUnitResult, PlayerState, PlayerClass, RaidState } from './types.js';

// Plant die RAID_WAVE_COUNT Angriffswellen EINMALIG bei spawnRaidAt() (nicht bei jeder Welle neu),
// damit die Zeitpunkte von Anfang an feststehen und z.B. in der Galaxie-/Sektor-Anzeige einsehbar
// waeren. Erste Welle trifft sofort bei Ankunft ein (arrivalTime), die weiteren ungefaehr im
// RAID_ASSAULT_DURATION_MS/(RAID_WAVE_COUNT-1)-Takt (15 Min. bei 5 Wellen/1h) mit etwas Zufalls-
// Streuung (RAID_WAVE_JITTER_FACTOR), damit es sich nicht wie ein exaktes Metronom anfuehlt. Jede
// Welle bekommt mindestens einen Bruchteil des Basis-Intervalls Abstand zur vorherigen (kein
// Ueberholen) und die letzte Welle wird hart auf das Fensterende gekappt - "muss innerhalb 1
// Stunde nach Ankunft abgeschlossen sein" gilt dadurch garantiert, unabhaengig vom Zufall.
function planRaidWaveTimes(arrivalTime: number): number[] {
  const baseInterval = RAID_ASSAULT_DURATION_MS / (RAID_WAVE_COUNT - 1);
  const minGap = baseInterval * (1 - RAID_WAVE_JITTER_FACTOR);
  const windowEnd = arrivalTime + RAID_ASSAULT_DURATION_MS;
  const times: number[] = [];
  let prev = arrivalTime;
  for (let i = 0; i < RAID_WAVE_COUNT; i++) {
    if (i === 0) {
      times.push(arrivalTime);
      prev = arrivalTime;
      continue;
    }
    const target = arrivalTime + i * baseInterval;
    const jitter = (Math.random() * 2 - 1) * baseInterval * RAID_WAVE_JITTER_FACTOR;
    const time = Math.min(windowEnd, Math.max(prev + minGap, target + jitter));
    times.push(time);
    prev = time;
  }
  return times;
}

// Spawnt einen Raid ausgehend vom TATSAECHLICHEN Checkpoint-Zeitpunkt (nicht "jetzt") - wichtig
// beim Nachrollen verpasster Checkpoints (siehe rollFixedCheckpoints in economy.ts), damit
// spawnedAt/launchTime/arrivalTime der eigentlich vorgesehenen Uhrzeit entsprechen und nicht dem
// zufaelligen Moment, in dem irgendjemand als Naechstes online war.
//
// Ablauf (siehe README): Trigger -> 60 Minuten Vorbereitungszeit (RAID_PREP_MS) -> Piraten heben
// von einer zufaellig gewuerfelten Basis ab -> echte, distanzabhaengige Flugzeit zur Zielposition
// (dieselbe Formel wie bei Spieler-Flotten, siehe galaxy.ts) -> Ankunft = Beginn der Wellen-Phase
// (RAID_WAVE_COUNT Wellen innerhalb RAID_ASSAULT_DURATION_MS, siehe planRaidWaveTimes()). Distanz
// und Flugzeit stehen sofort bei Trigger fest (Basis- UND Zielposition sind ja schon bekannt).
function spawnRaidAt(state: PlayerState, checkpointTime: number): void {
  const pirateBase = PIRATE_BASES[Math.floor(Math.random() * PIRATE_BASES.length)];
  const launchTime = checkpointTime + RAID_PREP_MS;
  let arrivalTime = launchTime;
  if (state.galaxyPosition) {
    const distance = galaxyDistance(pirateBase, state.galaxyPosition);
    const travelMs = galaxyDurationMs(distance, PIRATE_FLEET_SPEED);
    if (Number.isFinite(travelMs)) arrivalTime = launchTime + travelMs;
  }
  const waveTimes = planRaidWaveTimes(arrivalTime);
  state.raid = {
    id: 'raid_' + checkpointTime,
    spawnedAt: checkpointTime,
    pirateBase,
    launchTime,
    launchNotified: false,
    arrivalTime,
    reinforcements: [],
    waveTimes,
    wavesProcessed: 0,
    wavesWon: 0,
    accumulatedDestroyed: 0,
  };
  const prepMin = Math.round(RAID_PREP_MS / 60000);
  const totalMin = Math.round((arrivalTime - checkpointTime) / 60000);
  const assaultMin = Math.round(RAID_ASSAULT_DURATION_MS / 60000);
  pushMessage(
    state,
    'kampf',
    `⚠ Piratenaktivität bei Basis 1:${pirateBase.system}:${pirateBase.position} registriert! Ihre Flotte startet in ${prepMin} Minuten, geschätzte Ankunft der ersten Welle in ${totalMin} Minuten. Danach greifen sie in ${RAID_WAVE_COUNT} Wellen über etwa ${assaultMin} Minuten an. Verstärke deine Verteidigung oder rufe deine Flotte zurück.`
  );
}

// Verschickt (einmalig, ueber launchNotified abgesichert) die "Piraten sind jetzt gestartet"-
// Nachricht, sobald die Vorbereitungszeit abgelaufen ist - rein informativ, arrivalTime/waveTimes
// stehen ja bereits seit spawnRaidAt() fest.
function notifyRaidLaunchIfDue(state: PlayerState): void {
  const raid = state.raid;
  if (!raid || raid.launchNotified) return;
  const now = Date.now();
  if (now < raid.launchTime) return;
  raid.launchNotified = true;
  const remainingMin = Math.max(0, Math.round((raid.arrivalTime - raid.launchTime) / 60000));
  pushMessage(
    state,
    'kampf',
    `⚠ Die Piratenflotte ist von Basis 1:${raid.pirateBase.system}:${raid.pirateBase.position} gestartet! Ankunft der ersten Welle in ${remainingMin} Minuten.`
  );
}

// Ermittelt fuer einen Nutzer, ob er einen fest zugewiesenen, GARANTIERTEN Raid-Rhythmus hat
// (siehe RAID_SCHEDULE_BY_USERNAME, Performance-Notmassnahme) - Chance 1.0 (immer) statt der
// normalen RAID_SPAWN_CHANCE, und die individuell zugewiesenen Stunden statt des gemeinsamen
// RAID_CHECK_HOURS_LOCAL-Rhythmus. Unbekannte Nutzernamen fallen auf das alte Verhalten zurueck.
function getRaidSchedule(userId: number): { hours: number[]; chance: number } {
  const user = getUserById(userId);
  const fixedHours = user ? RAID_SCHEDULE_BY_USERNAME[user.username] : undefined;
  if (fixedHours) return { hours: fixedHours, chance: 1 };
  return { hours: RAID_CHECK_HOURS_LOCAL, chance: RAID_SPAWN_CHANCE };
}

// Heimatverteidigung (Raids) MUSS zusaetzlich zu COMBAT_SHIP_IDS auch den Imperator einschliessen -
// der ist zwar bewusst NICHT Teil von COMBAT_SHIP_IDS (das steuert nur die Einsetzbarkeit in
// SOLO-Missionen ausserhalb der Heimatbasis), darf aber die eigene Basis genauso verteidigen wie
// jedes andere Schiff auch. Piraten-Sektor-Missionen, Elite-Bollwerk und Piratenadmiral erlauben
// den Imperator bereits explizit (siehe availableFleetForSektor() in missions.ts,
// ADMIRAL_ALLOWED_SHIP_IDS) - Raids waren hier bislang die einzige Ausnahme, der Imperator
// wirkte dadurch bei Raids nie mit, obwohl er gebaut und zuhause war (Bugfix).
const HOME_DEFENSE_SHIP_IDS = [...COMBAT_SHIP_IDS, 'imperator'];

function hasAnyDefense(state: PlayerState): boolean {
  return HOME_DEFENSE_SHIP_IDS.some((id) => (state.fleet[id] || 0) > 0) || DEFENSES.some((d) => (state.defense[d.id] || 0) > 0);
}

// Bollwerk repariert Verteidigungsanlagen nach einem Kampf zu einem hoeheren Anteil
// (CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT, 90% statt der sonst ueblichen 70%) - einer von drei
// Bollwerk-spezifischen Boni, siehe data/classes.ts.
function defenseRepairPercentFor(playerClass: PlayerClass | null): number {
  return playerClass === 'bollwerk' ? CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT : DEFENSE_REPAIR_PERCENT;
}

export async function processRaidTimer(state: PlayerState) {
  if (state.raid) {
    notifyRaidLaunchIfDue(state);
    await processRaidWaves(state, state.userId, state);
    return;
  }
  const now = Date.now();
  if (now < state.nextRaidCheck) return;

  const schedule = getRaidSchedule(state.userId);
  state.nextRaidCheck = rollFixedCheckpoints(state.nextRaidCheck, now, schedule.chance, (checkpointTime) => spawnRaidAt(state, checkpointTime), schedule.hours);
}

/**
 * Loest ueberfaellige Raid-Wellen bei ALLEN anderen Spielern auf, nicht nur beim aktuell aktiven
 * Nutzer. Grund: Eine Welle wurde bisher NUR aufgeloest, wenn der jeweilige Verteidiger selbst
 * gerade online war (processRaidTimer laeuft nur fuer state.userId selbst). Ist der Verteidiger
 * gerade nicht aktiv, blieben faellige Wellen unaufgeloest stehen - selbst wenn ein VERSTAERKER
 * die ganze Zeit aktiv war und dessen Flotte dadurch dauerhaft "haltend im Kampf" haengen blieb.
 * Wird bei JEDEM tick() zusaetzlich zum eigenen processRaidTimer aufgerufen, damit die Aktivitaet
 * irgendeines Spielers genuegt, um faellige Wellen bei ALLEN aufzuloesen - wichtig, damit ein Raid
 * trotz mehrerer, ueber eine Stunde verteilter Wellen zuverlaessig durchlaeuft, auch wenn der
 * Verteidiger nicht die ganze Zeit online ist.
 */
export async function processOverdueRaidsForOtherUsers(currentState: PlayerState): Promise<void> {
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    // Fehler-Isolation PRO NUTZER: ohne try/catch wuerde eine Ausnahme bei EINEM Nutzer den
    // gesamten Sweep abbrechen - alle danach gelisteten Nutzer wuerden dann bei JEDEM Aufruf
    // (auch kuenftigen) niemals verarbeitet, komplett unsichtbar.
    try {
      const otherState = loadPlayerState(u.id);
      if (otherState.raid) {
        notifyRaidLaunchIfDue(otherState);
        await processRaidWaves(otherState, currentState.userId, currentState);
        // Es kann sich Diverses veraendert haben (launchNotified, eine oder mehrere abgearbeitete
        // Wellen, oder der Raid ist jetzt komplett abgeschlossen und null) - bei irgendeinem
        // vorhandenen Raid zu Beginn dieser Iteration sicherheitshalber immer speichern.
        savePlayerState(otherState);
      }
    } catch (err) {
      console.error(`processOverdueRaidsForOtherUsers: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
}

/**
 * Ergaenzung zu processOverdueRaidsForOtherUsers: das loest nur bereits GESPAWNTE Raids/Wellen
 * auf, aber der Spawn-Checkpoint selbst (nextRaidCheck erreicht -> wuerfeln, ob ueberhaupt ein
 * Raid entsteht) lief bisher AUSSCHLIESSLICH im processRaidTimer des betroffenen Spielers - war
 * der komplett offline, wurde fuer ihn nie gewuerfelt, selbst wenn andere Spieler die ganze Zeit
 * aktiv waren. Prueft daher bei JEDEM tick() zusaetzlich, ob fuer ANDERE Spieler ein Checkpoint
 * faellig ist, und wuerfelt/spawnt bei Bedarf genau wie processRaidTimer es fuer den eigenen
 * Zustand tun wuerde.
 */
export async function processOverdueRaidSpawnsForOtherUsers(currentState: PlayerState): Promise<void> {
  const now = Date.now();
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    try {
      const otherState = loadPlayerState(u.id);
      if (otherState.raid) continue; // bereits ein Raid aktiv - nichts zu tun
      if (now < otherState.nextRaidCheck) continue;
      const schedule = getRaidSchedule(u.id);
      otherState.nextRaidCheck = rollFixedCheckpoints(
        otherState.nextRaidCheck,
        now,
        schedule.chance,
        (checkpointTime) => spawnRaidAt(otherState, checkpointTime),
        schedule.hours
      );
      savePlayerState(otherState);
    } catch (err) {
      console.error(`processOverdueRaidSpawnsForOtherUsers: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
}

// Arbeitet ALLE gerade faelligen Wellen eines Raids ab (kann bei laengerer Abwesenheit/seltenem
// Tick-Abstand mehr als eine auf einmal sein - "muss innerhalb 1 Stunde nach Ankunft abgeschlossen
// sein" gilt unabhaengig davon, ob der Spieler zwischendurch online war). Sobald nichts mehr zu
// verteidigen ist (von Anfang an oder durch vorherige Wellen aufgerieben), werden die restlichen
// Wellen ohne Kampf uebersprungen statt sinnlos einzeln zu simulieren.
async function processRaidWaves(state: PlayerState, currentUserId?: number, currentUserState?: PlayerState): Promise<void> {
  const raid = state.raid;
  if (!raid) return;

  while (raid.wavesProcessed < RAID_WAVE_COUNT && Date.now() >= raid.waveTimes[raid.wavesProcessed]) {
    if (!hasAnyDefense(state)) {
      if (raid.wavesProcessed === 0) {
        pushMessage(state, 'kampf', 'Piratenüberfall – keine Verteidigung vorhanden. Die Flotte plündert ungehindert.');
      } else {
        pushMessage(
          state,
          'kampf',
          `Deine Verteidigung ist vollständig aufgerieben - die verbleibenden Wellen (${raid.wavesProcessed + 1}-${RAID_WAVE_COUNT}) treffen ungehindert auf deine Heimatbasis.`
        );
      }
      raid.wavesProcessed = RAID_WAVE_COUNT;
      break;
    }
    await resolveOneWave(state, raid, currentUserId, currentUserState);
  }

  if (raid.wavesProcessed >= RAID_WAVE_COUNT) {
    finalizeRaidWaves(state, currentUserId, currentUserState);
  }
}

// Loest GENAU EINE Welle aus (die naechste noch offene, raid.wavesProcessed) - eigener,
// vollstaendiger Kampf gegen eine frisch gewuerfelte Feindflotte, deren Staerke nur einen Anteil
// (1/RAID_WAVE_COUNT) der gesamten Raid-Feindstaerke traegt (siehe economy.ts) - die
// Gesamtstaerke ueber alle Wellen bleibt dadurch identisch zu einem frueheren Einzel-Raid.
// Verteidiger-Flotte/-Anlagen tragen die Verluste der vorherigen Wellen bereits in sich (state.fleet/
// state.defense werden hier direkt weiterverwendet, nicht zurueckgesetzt).
async function resolveOneWave(state: PlayerState, raid: RaidState, currentUserId?: number, currentUserState?: PlayerState): Promise<void> {
  const waveNumber = raid.wavesProcessed + 1;
  const homeShipIds = HOME_DEFENSE_SHIP_IDS.filter((id) => (state.fleet[id] || 0) > 0);
  const homeDefIds = DEFENSES.map((d) => d.id).filter((id) => (state.defense[id] || 0) > 0);

  const defenderShips: Record<string, number> = {};
  homeShipIds.forEach((id) => (defenderShips[id] = state.fleet[id]));
  homeDefIds.forEach((id) => (defenderShips[id] = state.defense[id]));

  // Feindstaerke skaliert jetzt bewusst auf der VERTEIDIGUNGSANLAGEN-Staerke (Nutzerentscheidung,
  // siehe RAID_WAVE_FACTORS in economy.ts) statt wie sonst im Spiel ueblich auf der Flotte (siehe
  // README Punkt 22 zur generellen Entkopplungs-Regel, die fuer Raids hiermit bewusst durchbrochen
  // wird). domePoolReal wird weiterhin separat berechnet und wirkt im tatsaechlichen Kampf voll.
  let defensePower = 0;
  homeDefIds.forEach((id) => {
    const base = baseStats(id);
    defensePower += state.defense[id] * (base.waffen + base.schild + base.panzerung);
  });
  const domePoolReal = computeDomeSharedPool(state.defense, state.research, isBoosterActive(state, 'kampf'), state.playerClass, state.shipModules);

  const now = Date.now();
  const arrivedReinforcements = (raid.reinforcements || []).filter((r) => r.arrivalTime <= now);
  const reinforcerStates = arrivedReinforcements.map((r) => ({
    r,
    playerState: r.userId === currentUserId && currentUserState ? currentUserState : loadPlayerState(r.userId),
  }));
  const heldStates = getHoldingDeploymentsTargeting(state.userId, currentUserId, currentUserState);

  // RAID_MIN_TARGET_POWER wirkt hier als Untergrenze fuer die Verteidigungsanlagen-Basis SELBST
  // (nicht mehr pro Welle geteilt, siehe economy.ts) - schuetzt Accounts mit reiner Flotte ohne
  // nennenswerte Verteidigungsanlagen davor, quasi wirkungslose Raids zu bekommen.
  const waveFactor = RAID_WAVE_FACTORS[Math.min(raid.wavesProcessed, RAID_WAVE_FACTORS.length - 1)];
  const waveTargetPower = Math.max(defensePower, RAID_MIN_TARGET_POWER) * waveFactor;
  const profile = pickWaveProfile('raid');
  const battleModifier = rollBattleModifier('raid');
  const npcShips = generateFallbackFleet(waveTargetPower, profile);
  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
  const ownerUsername = getUserById(state.userId)?.username || 'Verteidiger';

  if (npcIds.length === 0) {
    // Seltener Randfall - keine Angreifer generiert, Welle zaehlt kampflos als gewonnen.
    raid.wavesProcessed++;
    raid.wavesWon++;
    pushMessage(state, 'kampf', `Welle ${waveNumber}/${RAID_WAVE_COUNT}: keine Angreifer gefunden - Welle übersprungen.`);
    return;
  }

  const contributions: OwnedFleetContribution[] = [
    { ownerKey: 'owner', ships: defenderShips, research: state.research, defenseCounts: state.defense, playerClass: state.playerClass, kampfBoostActive: isBoosterActive(state, 'kampf'), shipModules: state.shipModules },
    ...reinforcerStates.map(({ r, playerState }) => ({
      ownerKey: String(r.userId),
      ships: r.ships,
      research: playerState.research,
      playerClass: playerState.playerClass,
      kampfBoostActive: isBoosterActive(playerState, 'kampf'),
      shipModules: playerState.shipModules,
    })),
    ...heldStates.map(({ deployment, ownerState }) => ({
      ownerKey: `held:${deployment.id}`,
      ships: deployment.ships,
      research: ownerState.research,
      playerClass: ownerState.playerClass,
      kampfBoostActive: isBoosterActive(ownerState, 'kampf'),
      shipModules: ownerState.shipModules,
    })),
  ];
  const hasSupport = reinforcerStates.length > 0 || heldStates.length > 0;
  const result = hasSupport
    ? await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcShips, research: state.research, defenseCounts: state.defense, sharedShieldPoolA: domePoolReal, allowRetreat: false, battleModifier })
    : await runCombatInWorker({
        sideAShips: defenderShips,
        sideBShips: npcShips,
        research: state.research,
        defenseCounts: state.defense,
        sharedShieldPoolA: domePoolReal,
        allowRetreat: false,
        battleModifier,
        playerClass: state.playerClass,
        kampfBoostActive: isBoosterActive(state, 'kampf'),
        shipModules: state.shipModules,
      });
  const survivorsByOwner: Record<string, Record<string, number>> | undefined =
    'survivorsByOwner' in result ? (result as { survivorsByOwner: Record<string, Record<string, number>> }).survivorsByOwner : undefined;

  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = [];

  homeShipIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research, {}, isBoosterActive(state, 'kampf'), state.playerClass, state.shipModules);
    const sent = state.fleet[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const lost = sent - survived;
    losses[id] = lost;
    state.fleet[id] = survived;
    const statKey = survivorsByOwner ? `owner:${id}` : id;
    playerResults.push({
      id, name: shipName(id), ownerUsername, sent, survived, lost,
      waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenA[statKey] || 0), dmgDealt: Math.round(result.shotsA.dmgDealt[statKey] || 0),
      shotsFired: result.shotsA.shotsFired[statKey] || 0, hits: result.shotsA.hits[statKey] || 0,
      rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0), shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
    });
  });

  homeDefIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research, state.defense, isBoosterActive(state, 'kampf'), state.playerClass, state.shipModules);
    const sent = state.defense[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const destroyed = sent - survived;
    losses[id] = destroyed;
    const repaired = Math.floor(destroyed * defenseRepairPercentFor(state.playerClass));
    state.defense[id] = survived + repaired;
    const statKey = survivorsByOwner ? `owner:${id}` : id;
    playerResults.push({
      id, name: shipName(id), ownerUsername, sent, survived, lost: destroyed,
      waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
      dmgTaken: Math.round(result.dmgTakenA[statKey] || 0), dmgDealt: Math.round(result.shotsA.dmgDealt[statKey] || 0),
      shotsFired: result.shotsA.shotsFired[statKey] || 0, hits: result.shotsA.hits[statKey] || 0,
      rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0), shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      isDefense: true,
    });
  });

  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcShips[id];
    const survivedCount = result.survivorsB[id] || 0;
    return {
      id, name: shipName(id), count: sent,
      waffen: Math.round(base.waffen), schild: Math.round(base.schild), panzerung: Math.round(base.panzerung),
      dmgTaken: Math.round(result.dmgTakenB[id] || 0), dmgDealt: Math.round(result.shotsB.dmgDealt[id] || 0),
      destroyedCount: sent - survivedCount, survivedCount, destroyed: survivedCount <= 0,
      shotsFired: result.shotsB.shotsFired[id] || 0, hits: result.shotsB.hits[id] || 0, rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0), shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  const waveWon = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);
  const destroyedThisWave = npcResults.reduce((sum, r) => sum + (r.destroyedCount || 0), 0);
  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';

  // Verstaerkungen/haltende Flotten: Ueberlebende je Beitrag zurueckschreiben + eigene Detail-
  // Zeilen (Punkt 6 README - Mehrspieler-Kampfbericht muss aufklappbar sein). Statistik
  // (enemiesDestroyed) zaehlt SOFORT pro Welle, "raidsRepelledFull/Partial" dagegen erst am Ende
  // in finalizeRaidWaves() - sonst wuerde ein einzelner Raid bis zu 5x in die Bestenliste einzahlen.
  state.stats.enemiesDestroyed += destroyedThisWave;
  state.stats.ownShipsLost += Object.values(losses).reduce((a, b) => a + b, 0);

  const modifierText = battleModifier ? ` ${BATTLE_MODIFIER_LABELS[battleModifier]}.` : '';
  const outcome = waveWon ? `Welle ${waveNumber}/${RAID_WAVE_COUNT} abgewehrt – Angreifer vernichtet` : `Welle ${waveNumber}/${RAID_WAVE_COUNT} – Angreifer teilweise durchgekommen`;
  const detail = {
    sektorName: 'Heimatbasis',
    outcome,
    roundsFought: result.roundsFought,
    npcResults,
    playerResults,
    replay: result.replay,
  };
  pushMessage(
    state,
    'kampf',
    `${outcome} (${result.roundsFought} Runden). Verluste: ${lossText}. Verteidigung zu ${Math.round(defenseRepairPercentFor(state.playerClass) * 100)}% repariert.${modifierText}`,
    detail
  );

  reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
    const ownerKey = String(r.userId);
    const ownerSurvivors = survivorsByOwner?.[ownerKey] || {};
    Object.entries(r.ships).forEach(([id, sentCount]) => {
      const survived = ownerSurvivors[id] || 0;
      reinforcerState.fleet[id] = (reinforcerState.fleet[id] || 0) + survived;
      const eff = getEffectiveStats(id, reinforcerState.research, {}, isBoosterActive(reinforcerState, 'kampf'), reinforcerState.playerClass, reinforcerState.shipModules);
      const statKey = `${ownerKey}:${id}`;
      playerResults.push({
        id, name: shipName(id), ownerUsername: r.username, sent: sentCount, survived, lost: sentCount - survived,
        waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
        dmgTaken: Math.round(result.dmgTakenA[statKey] || 0), dmgDealt: Math.round(result.shotsA.dmgDealt[statKey] || 0),
        shotsFired: result.shotsA.shotsFired[statKey] || 0, hits: result.shotsA.hits[statKey] || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0), shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      });
    });
    reinforcerState.stats.enemiesDestroyed += destroyedThisWave;
    pushMessage(
      reinforcerState,
      'kampf',
      `Deine Verstärkung für die Heimatbasis von ${ownerUsername}, Welle ${waveNumber}/${RAID_WAVE_COUNT}: ${waveWon ? 'abgewehrt' : 'Angreifer teilweise durchgekommen'} (${result.roundsFought} Runden).`,
      detail
    );
    if (r.userId !== currentUserId) savePlayerState(reinforcerState);
  });

  heldStates.forEach((holding) => {
    const { deployment, ownerState, ownerUsername: holderUsername } = holding;
    const ownerKey = `held:${deployment.id}`;
    const ownerSurvivors = survivorsByOwner?.[ownerKey] || {};
    Object.entries(deployment.ships).forEach(([id, sentCount]) => {
      const survived = ownerSurvivors[id] || 0;
      deployment.ships[id] = survived;
      const eff = getEffectiveStats(id, ownerState.research, {}, isBoosterActive(ownerState, 'kampf'), ownerState.playerClass, ownerState.shipModules);
      const statKey = `${ownerKey}:${id}`;
      playerResults.push({
        id, name: shipName(id), ownerUsername: `${holderUsername} (haltende Flotte)`, sent: sentCount, survived, lost: sentCount - survived,
        waffen: Math.round(eff.waffen), schild: Math.round(eff.schild), panzerung: Math.round(eff.panzerung),
        dmgTaken: Math.round(result.dmgTakenA[statKey] || 0), dmgDealt: Math.round(result.shotsA.dmgDealt[statKey] || 0),
        shotsFired: result.shotsA.shotsFired[statKey] || 0, hits: result.shotsA.hits[statKey] || 0,
        rapidFireTriggers: result.shotsA.rapidFireTriggers[statKey] || 0,
        shieldDmgTaken: Math.round(result.shieldDmgTakenA[statKey] || 0), shieldRegen: Math.round(result.shieldRegenA[statKey] || 0),
      });
    });
    ownerState.stats.enemiesDestroyed += destroyedThisWave;
    pushMessage(
      ownerState,
      'kampf',
      `Deine haltende Flotte bei ${ownerUsername}, Welle ${waveNumber}/${RAID_WAVE_COUNT}: ${waveWon ? 'abgewehrt' : 'Angreifer teilweise durchgekommen'} (${result.roundsFought} Runden).`,
      detail
    );
    persistHeldDeployment(holding, currentUserId);
  });

  raid.wavesProcessed++;
  raid.accumulatedDestroyed += destroyedThisWave;
  if (waveWon) raid.wavesWon++;
}

// Schliesst den Raid ab, sobald alle RAID_WAVE_COUNT Wellen abgearbeitet sind - EINE
// Gesamt-Belohnung statt Belohnung pro Welle (Nutzerentscheidung), die mit raid.wavesWon skaliert:
// 1 Container pro gewonnener Welle (Silber), bei einer PERFEKTEN Verteidigung (alle Wellen
// gewonnen) werden alle Container zu Gold aufgewertet. Bergungs-DM wird EINMAL aus der ueber alle
// Wellen aufsummierten Kill-Zahl berechnet (raid.accumulatedDestroyed), Ressourcen-Diebstahl
// (RAID_LOOT_PERCENT) greift genau EINMAL, sofern nicht alle Wellen abgewehrt wurden.
function finalizeRaidWaves(state: PlayerState, currentUserId?: number, currentUserState?: PlayerState): void {
  const raid = state.raid;
  if (!raid) return;
  const ownerUsername = getUserById(state.userId)?.username || 'Verteidiger';

  const heldStates = getHoldingDeploymentsTargeting(state.userId, currentUserId, currentUserState);
  const arrivedReinforcements = (raid.reinforcements || []).filter((r) => r.arrivalTime <= Date.now());
  const reinforcerStates = arrivedReinforcements.map((r) => ({
    r,
    playerState: r.userId === currentUserId && currentUserState ? currentUserState : loadPlayerState(r.userId),
  }));

  const perfectDefense = raid.wavesWon >= RAID_WAVE_COUNT;

  // Bergungs-DM ("Bergung aus der zerstoerten Flotte") - skaliert mit der GESAMT-Anzahl
  // vernichteter Piratenschiffe/-anlagen ueber alle Wellen, unabhaengig vom Gesamtausgang. Jeder
  // Beteiligte bekommt den vollen Betrag, keine Aufteilung (Punkt 5).
  const salvageDm = Math.min(RAID_SALVAGE_DM_MAX, Math.round(raid.accumulatedDestroyed * RAID_SALVAGE_DM_PER_KILL));
  if (salvageDm > 0) {
    state.resources.dm += salvageDm;
    reinforcerStates.forEach(({ playerState }) => (playerState.resources.dm += salvageDm));
    heldStates.forEach(({ ownerState }) => (ownerState.resources.dm += salvageDm));
  }

  // Ressourcen-Diebstahl: genau EINMAL fuer den gesamten Raid, nicht pro verlorener Welle - sofern
  // nicht ALLE Wellen abgewehrt wurden. Basis sind die Ressourcen zum Abschluss-Zeitpunkt.
  let stolen: { metall: number; kristall: number; deuterium: number } | null = null;
  if (!perfectDefense) {
    stolen = {
      metall: Math.round(state.resources.metall * RAID_LOOT_PERCENT),
      kristall: Math.round(state.resources.kristall * RAID_LOOT_PERCENT),
      deuterium: Math.round(state.resources.deuterium * RAID_LOOT_PERCENT),
    };
    state.resources.metall = Math.max(0, state.resources.metall - stolen.metall);
    state.resources.kristall = Math.max(0, state.resources.kristall - stolen.kristall);
    state.resources.deuterium = Math.max(0, state.resources.deuterium - stolen.deuterium);
  }

  // EIN Container pro gewonnener Welle (0-RAID_WAVE_COUNT), bei perfekter Verteidigung alle als
  // Gold statt Silber - Verteidiger UND alle Verstaerker/Halter bekommen dieselbe Menge/Stufe
  // (gemeinsamer Ausgang, keine Aufteilung, Punkt 5).
  // Gold statt Silber - Verteidiger UND alle Verstaerker/Halter bekommen dieselbe Menge/Stufe
  // (gemeinsamer Ausgang, keine Aufteilung, Punkt 5). Nutzerentscheidung (Container-Ueberflutung):
  // bei NICHT perfekter Verteidigung 1 Silber-Container PRO gewonnener Welle (wie bisher, aber nie
  // Gold). Bei PERFEKTER Verteidigung (5/5) NICHT mehr alle 5 zu Gold aufgewertet, sondern fest
  // 4 Silber + 1 Gold, PLUS eine kleine Zusatzchance auf 1 Elite-Container (Elite bleibt ueberall
  // reine Glueckssache, siehe data/economy.ts).
  const grantContainers = (target: PlayerState) => {
    if (perfectDefense) {
      addContainers(target, 'silber', 4);
      addContainers(target, 'gold', 1);
    } else if (raid.wavesWon > 0) {
      addContainers(target, 'silber', raid.wavesWon);
    }
  };
  grantContainers(state);
  reinforcerStates.forEach(({ playerState }) => grantContainers(playerState));
  heldStates.forEach(({ ownerState }) => grantContainers(ownerState));

  // Elite-Zusatzchance NUR bei perfekter Verteidigung (Nutzerentscheidung) - unabhaengig gewuerfelt
  // PRO Teilnehmer (kein gemeinsamer Wurf fuer alle, jeder hat seine eigene Chance) - Ergebnis pro
  // Empfaenger gemerkt, damit die Abschluss-Nachricht nur dem tatsaechlichen Gewinner den
  // Elite-Container ankuendigt.
  const ownerEliteHit = perfectDefense && Math.random() < RAID_PERFECT_ELITE_CHANCE;
  if (ownerEliteHit) addContainers(state, 'elite', 1);
  const reinforcerEliteHits = reinforcerStates.map(({ playerState }) => {
    const hit = perfectDefense && Math.random() < RAID_PERFECT_ELITE_CHANCE;
    if (hit) addContainers(playerState, 'elite', 1);
    return hit;
  });
  const heldEliteHits = heldStates.map(({ ownerState }) => {
    const hit = perfectDefense && Math.random() < RAID_PERFECT_ELITE_CHANCE;
    if (hit) addContainers(ownerState, 'elite', 1);
    return hit;
  });

  // "Raid abgewehrt"-Statistik zaehlt genau EINMAL fuer den gesamten Raid (nicht pro Welle) - eine
  // perfekte Verteidigung (5/5) zaehlt als voller Erfolg, alles andere als Teilerfolg, analog zur
  // bisherigen Einzel-Kampf-Logik.
  if (perfectDefense) state.stats.raidsRepelledFull++;
  else state.stats.raidsRepelledPartial++;
  reinforcerStates.forEach(({ playerState }) => {
    if (perfectDefense) playerState.stats.raidsRepelledFull++;
    else playerState.stats.raidsRepelledPartial++;
  });
  heldStates.forEach(({ ownerState }) => {
    if (perfectDefense) ownerState.stats.raidsRepelledFull++;
    else ownerState.stats.raidsRepelledPartial++;
  });

  const salvageText = salvageDm > 0 ? ` Bergung aus den zerstörten Flotten: ${salvageDm} Dunkle Materie.` : '';
  // Belohnungstext ist jetzt PRO EMPFAENGER unterschiedlich (Elite-Bonus ist ein individueller
  // Wurf, siehe oben), daher eine kleine Hilfsfunktion statt eines einzelnen gemeinsamen Strings.
  const containerTextFor = (eliteHit: boolean) => {
    const eliteText = eliteHit ? ' Zusätzlich: 1x Elite-Container (Glückstreffer)!' : '';
    if (perfectDefense) return ` Belohnung: 4x Silber-, 1x Gold-Container.${eliteText}`;
    if (raid.wavesWon > 0) return ` Belohnung: ${raid.wavesWon}x Silber-Container.`;
    return ' Keine Welle erfolgreich abgewehrt - keine Container-Belohnung.';
  };
  const stolenText = stolen
    ? ` Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium.`
    : ' Ressourcen vollständig sicher.';
  const outcome = perfectDefense
    ? `Piratenüberfall abgewehrt – alle ${RAID_WAVE_COUNT} Wellen zurückgeschlagen! 🏆`
    : `Piratenüberfall beendet – ${raid.wavesWon}/${RAID_WAVE_COUNT} Wellen abgewehrt`;

  pushMessage(state, 'kampf', `${outcome}${stolenText}${containerTextFor(ownerEliteHit)}${salvageText}`, {
    sektorName: 'Heimatbasis',
    outcome,
    roundsFought: 0,
    npcResults: [],
    playerResults: [],
  });
  reinforcerStates.forEach(({ r, playerState }, i) => {
    pushMessage(
      playerState,
      'kampf',
      `Raid-Verteidigung bei ${ownerUsername} beendet: ${raid.wavesWon}/${RAID_WAVE_COUNT} Wellen abgewehrt.${containerTextFor(reinforcerEliteHits[i])}${salvageText}`
    );
    if (r.userId !== currentUserId) savePlayerState(playerState);
  });
  heldStates.forEach(({ ownerState, ownerUsername: holderUsername }, i) => {
    pushMessage(
      ownerState,
      'kampf',
      `Deine haltende Flotte bei ${ownerUsername}: Raid-Verteidigung beendet, ${raid.wavesWon}/${RAID_WAVE_COUNT} Wellen abgewehrt.${containerTextFor(heldEliteHits[i])}${salvageText}`
    );
    if (ownerState.userId !== currentUserId) savePlayerState(ownerState);
  });

  state.raid = null;
}
