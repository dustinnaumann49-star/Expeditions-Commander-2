import { DEFENSES } from './data/defenses.js';
import { RAID_WARNING_MS, RAID_SPAWN_CHANCE, RAID_LOOT_PERCENT, COMBAT_SHIP_IDS, rollFixedCheckpoints, RAID_SALVAGE_DM_PER_KILL, RAID_SALVAGE_DM_MAX, RAID_MIN_TARGET_POWER } from './data/economy.js';
import {
  getEffectiveStats,
  baseStats,
  shipName,
  generateFallbackFleet,
  computeDomeSharedPool,
  pickWaveProfile,
  rollMultiplierWithOutlier,
  rollBattleModifier,
} from './combat.js';
import type { OwnedFleetContribution } from './combat.js';
import { runCombatInWorker, runMultiOwnerCombatInWorker } from './combatRunner.js';
import { DEFENSE_REPAIR_PERCENT, RAID_MULTIPLIER_ROLL, BATTLE_MODIFIER_LABELS } from './data/combatConstants.js';
import { pushMessage } from './messages.js';
import { loadPlayerState, savePlayerState } from './state.js';
import { getUserById, listAllUsers } from '../db.js';
import type { CombatUnitResult, PlayerState } from './types.js';

// Spawnt einen Raid ausgehend vom TATSAECHLICHEN Checkpoint-Zeitpunkt (nicht "jetzt") - wichtig
// beim Nachrollen verpasster Checkpoints (siehe rollFixedCheckpoints in economy.ts), damit
// spawnedAt/arrivalTime der eigentlich vorgesehenen Uhrzeit entsprechen und nicht dem zufaelligen
// Moment, in dem irgendjemand als Naechstes online war.
function spawnRaidAt(state: PlayerState, checkpointTime: number): void {
  state.raid = { id: 'raid_' + checkpointTime, spawnedAt: checkpointTime, arrivalTime: checkpointTime + RAID_WARNING_MS, resolved: false, reinforcements: [] };
  pushMessage(
    state,
    'kampf',
    `⚠ Piratenflotte im Anflug auf deine Heimatbasis! Ankunft in ${Math.round(RAID_WARNING_MS / 60000)} Minuten. Verstärke deine Verteidigung oder rufe deine Flotte zurück.`
  );
}

export async function processRaidTimer(state: PlayerState) {
  const now = Date.now();

  if (state.raid && !state.raid.resolved && now >= state.raid.arrivalTime) {
    await resolveRaid(state, state.userId, state);
    return;
  }
  if (state.raid && state.raid.resolved) {
    state.raid = null;
    return;
  }
  if (state.raid) return;
  if (now < state.nextRaidCheck) return;

  state.nextRaidCheck = rollFixedCheckpoints(state.nextRaidCheck, now, RAID_SPAWN_CHANCE, (checkpointTime) => spawnRaidAt(state, checkpointTime));
}

/**
 * Loest ueberfaellige Raids bei ALLEN anderen Spielern auf, nicht nur beim aktuell aktiven Nutzer.
 * Grund: Ein Raid wurde bisher NUR aufgeloest, wenn der jeweilige Verteidiger selbst gerade online
 * war und sein eigener Zustand abgerufen wurde (processRaidTimer laeuft nur fuer state.userId
 * selbst). Ist der Verteidiger gerade nicht aktiv, blieb der Raid unaufgeloest stehen - selbst wenn
 * ein VERSTAERKER die ganze Zeit aktiv war und dessen Flotte dadurch dauerhaft "unterwegs" haengen
 * blieb. Wird bei JEDEM tick() zusaetzlich zum eigenen processRaidTimer aufgerufen, damit die
 * Aktivitaet irgendeines Spielers genuegt, um faellige Raids bei ALLEN aufzuloesen.
 */
export async function processOverdueRaidsForOtherUsers(currentState: PlayerState): Promise<void> {
  const now = Date.now();
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    // Fehler-Isolation PRO NUTZER: ohne try/catch wuerde eine Ausnahme bei EINEM Nutzer den
    // gesamten Sweep abbrechen - alle danach gelisteten Nutzer wuerden dann bei JEDEM Aufruf
    // (auch kuenftigen) niemals verarbeitet, komplett unsichtbar. Wurde entdeckt, nachdem trotz
    // aktivem Heartbeat ueber mehrere Checkpoints hinweg bei niemandem ein Ereignis ausgeloest
    // wurde - Verdacht: ein einzelner fehlerhafter Zustand blockierte alle nachfolgenden Nutzer.
    try {
      const otherState = loadPlayerState(u.id);
      if (otherState.raid && !otherState.raid.resolved && now >= otherState.raid.arrivalTime) {
        await resolveRaid(otherState, currentState.userId, currentState);
        savePlayerState(otherState);
      }
    } catch (err) {
      console.error(`processOverdueRaidsForOtherUsers: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
}

/**
 * Ergaenzung zu processOverdueRaidsForOtherUsers: das loest nur bereits GESPAWNTE Raids auf, aber
 * der Spawn-Checkpoint selbst (nextRaidCheck erreicht -> wuerfeln, ob ueberhaupt ein Raid entsteht)
 * lief bisher AUSSCHLIESSLICH im processRaidTimer des betroffenen Spielers - war der komplett
 * offline, wurde fuer ihn nie gewuerfelt, selbst wenn andere Spieler die ganze Zeit aktiv waren.
 * Prueft daher bei JEDEM tick() zusaetzlich, ob fuer ANDERE Spieler ein Checkpoint faellig ist, und
 * wuerfelt/spawnt bei Bedarf genau wie processRaidTimer es fuer den eigenen Zustand tun wuerde.
 */
export async function processOverdueRaidSpawnsForOtherUsers(currentState: PlayerState): Promise<void> {
  const now = Date.now();
  const others = listAllUsers(currentState.userId);
  for (const u of others) {
    try {
      const otherState = loadPlayerState(u.id);
      if (otherState.raid) continue; // bereits ein Raid aktiv - nichts zu tun
      if (now < otherState.nextRaidCheck) continue;
      otherState.nextRaidCheck = rollFixedCheckpoints(otherState.nextRaidCheck, now, RAID_SPAWN_CHANCE, (checkpointTime) =>
        spawnRaidAt(otherState, checkpointTime)
      );
      savePlayerState(otherState);
    } catch (err) {
      console.error(`processOverdueRaidSpawnsForOtherUsers: Fehler bei Nutzer ${u.id}:`, err);
    }
  }
}

async function resolveRaid(state: PlayerState, currentUserId?: number, currentUserState?: PlayerState) {
  const homeShipIds = COMBAT_SHIP_IDS.filter((id) => (state.fleet[id] || 0) > 0);
  const homeDefIds = DEFENSES.map((d) => d.id).filter((id) => (state.defense[id] || 0) > 0);

  const defenderShips: Record<string, number> = {};
  homeShipIds.forEach((id) => (defenderShips[id] = state.fleet[id]));
  homeDefIds.forEach((id) => (defenderShips[id] = state.defense[id]));

  // Feindstaerke-Basis nutzt bewusst NUR die Flotte, NICHT die Verteidigungsanlagen - sonst wuerde
  // eine staerkere Verteidigung automatisch einen staerkeren Angriff heraufbeschwoeren (Verteidigung
  // steigert homePower -> steigert targetPower -> mehr/staerkere Angreifer). Das widerspraeche dem
  // eigentlichen Zweck von Verteidigungsanlagen (zaeher machen, OHNE einen haerteren Angriff
  // anzuziehen) und wuerde durch aufgeblaehte HP-Pools auf beiden Seiten Kaempfe unnoetig in die
  // Laenge ziehen (Raids kennen keinen Rueckzug, siehe Punkt 27 - liefen sonst oft bis MAX_ROUNDS).
  // Verteidigungsanlagen wirken im TATSAECHLICHEN Kampf weiterhin voll (defenderShips oben
  // enthaelt sie unveraendert) - nur die Berechnung "wie stark soll der Angriff werden" ignoriert sie.
  let homePower = 0;
  homeShipIds.forEach((id) => {
    const base = baseStats(id);
    homePower += state.fleet[id] * (base.waffen + base.schild + base.panzerung);
  });
  // Kuppel-Pool fliesst bewusst NICHT mehr in homePower ein (siehe Kommentar oben zur
  // Entkopplung) - domePoolReal wird trotzdem berechnet und unten unveraendert an die
  // tatsaechliche Kampfberechnung uebergeben, wirkt dort also weiterhin voll.
  const domePoolReal = computeDomeSharedPool(state.defense, state.research);

  // Nicht mehr auf homePower === 0 prüfen - das ist jetzt ein legitimer Zustand bei einem reinen
  // Verteidigungsanlagen-Aufbau ohne eigene Flotte zu Hause (homePower zaehlt nur noch die
  // Flotte). Massgeblich ist allein, ob UEBERHAUPT etwas zur Verteidigung bereitsteht
  // (defenderShips, enthaelt Flotte UND Verteidigung unveraendert).
  if (Object.keys(defenderShips).length === 0) {
    const stolen = {
      metall: Math.round(state.resources.metall * RAID_LOOT_PERCENT),
      kristall: Math.round(state.resources.kristall * RAID_LOOT_PERCENT),
      deuterium: Math.round(state.resources.deuterium * RAID_LOOT_PERCENT),
    };
    state.resources.metall = Math.max(0, state.resources.metall - stolen.metall);
    state.resources.kristall = Math.max(0, state.resources.kristall - stolen.kristall);
    state.resources.deuterium = Math.max(0, state.resources.deuterium - stolen.deuterium);
    pushMessage(
      state,
      'kampf',
      `Piratenüberfall erfolgreich – keine Verteidigung vorhanden! Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium.`,
      {
        sektorName: 'Heimatbasis',
        outcome: 'Keine Verteidigung vorhanden',
        roundsFought: 0,
        npcResults: [],
        playerResults: [],
        rewards: { stolenMetall: stolen.metall, stolenKristall: stolen.kristall, stolenDeuterium: stolen.deuterium },
      }
    );
    state.raid = null;
    return;
  }

  // Verstaerkungen anderer Spieler, die rechtzeitig angekommen sind, zaehlen zur Verteidigungsstaerke
  // dazu (bevor die Feindstaerke berechnet wird) und werden gleich mitgeladen (fuer ihre eigene Forschung).
  const now = Date.now();
  const arrivedReinforcements = (state.raid?.reinforcements || []).filter((r) => r.arrivalTime <= now);
  const reinforcerStates = arrivedReinforcements.map((r) => ({
    r,
    playerState: r.userId === currentUserId && currentUserState ? currentUserState : loadPlayerState(r.userId),
  }));

  let reinforcementPower = 0;
  reinforcerStates.forEach(({ r }) => {
    Object.entries(r.ships).forEach(([id, count]) => {
      const base = baseStats(id);
      reinforcementPower += count * (base.waffen + base.schild + base.panzerung);
    });
  });

  // Feindstaerke war frueher exakt 100% der eigenen Kampf-Power ohne jede Schwankung - jetzt mit
  // leichter Grund-Varianz (RAID_MULTIPLIER_ROLL) plus seltenem, gedaempftem Ausreisser (siehe
  // combatConstants.ts) und einem gewuerfelten Zusammensetzungs-Profil, damit sich nicht jeder
  // Raid identisch anfuehlt.
  const { multiplier: rolledMultiplier, outlier } = rollMultiplierWithOutlier(RAID_MULTIPLIER_ROLL, 'raid');
  const targetPower = Math.max((homePower + reinforcementPower) * rolledMultiplier, RAID_MIN_TARGET_POWER);
  const profile = pickWaveProfile('raid');
  const battleModifier = rollBattleModifier('raid');
  const npcShips = generateFallbackFleet(targetPower, profile);

  const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
  if (npcIds.length === 0) {
    pushMessage(state, 'kampf', 'Piratenüberfall – keine Angreifer gefunden. Seltsam...');
    state.raid = null;
    return;
  }

  const contributions: OwnedFleetContribution[] = [
    { ownerKey: 'owner', ships: defenderShips, research: state.research, defenseCounts: state.defense },
    ...reinforcerStates.map(({ r, playerState }) => ({
      ownerKey: String(r.userId),
      ships: r.ships,
      research: playerState.research,
    })),
  ];

  const result =
    reinforcerStates.length > 0
      ? await runMultiOwnerCombatInWorker({ contributions, sideBShips: npcShips, research: state.research, defenseCounts: state.defense, sharedShieldPoolA: domePoolReal, allowRetreat: false, battleModifier })
      : await runCombatInWorker({ sideAShips: defenderShips, sideBShips: npcShips, research: state.research, defenseCounts: state.defense, sharedShieldPoolA: domePoolReal, allowRetreat: false, battleModifier });
  const survivorsByOwner: Record<string, Record<string, number>> | undefined =
    'survivorsByOwner' in result ? (result as { survivorsByOwner: Record<string, Record<string, number>> }).survivorsByOwner : undefined;

  let anyDefLoss = false;
  const losses: Record<string, number> = {};
  const playerResults: CombatUnitResult[] = [];
  const ownerUsername = getUserById(state.userId)?.username || 'Verteidiger';

  homeShipIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research);
    const sent = state.fleet[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const lost = sent - survived;
    if (lost > 0) anyDefLoss = true;
    losses[id] = lost;
    state.fleet[id] = survived;
    const statKey = survivorsByOwner ? `owner:${id}` : id;
    playerResults.push({
      id,
      name: shipName(id),
      ownerUsername,
      sent,
      survived,
      lost,
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
  });

  homeDefIds.forEach((id) => {
    const eff = getEffectiveStats(id, state.research, state.defense);
    const sent = state.defense[id] || 0;
    const survived = survivorsByOwner ? survivorsByOwner['owner']?.[id] || 0 : result.survivorsA[id] || 0;
    const destroyed = sent - survived;
    if (destroyed > 0) anyDefLoss = true;
    losses[id] = destroyed;
    const repaired = Math.floor(destroyed * DEFENSE_REPAIR_PERCENT);
    state.defense[id] = survived + repaired;
    const statKey = survivorsByOwner ? `owner:${id}` : id;
    playerResults.push({
      id,
      name: shipName(id),
      ownerUsername,
      sent,
      survived,
      lost: destroyed,
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
      isDefense: true,
    });
  });

  const npcResults: CombatUnitResult[] = npcIds.map((id) => {
    const base = baseStats(id);
    const sent = npcShips[id];
    const survivedCount = result.survivorsB[id] || 0;
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
      shotsFired: result.shotsB.shotsFired[id] || 0,
      hits: result.shotsB.hits[id] || 0,
      rapidFireTriggers: result.shotsB.rapidFireTriggers[id] || 0,
      shieldDmgTaken: Math.round(result.shieldDmgTakenB[id] || 0),
      shieldRegen: Math.round(result.shieldRegenB[id] || 0),
    };
  });

  const piratesRepelled = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);
  const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => `${shipName(id)} x${v}`).join(', ') || 'keine';

  // Verstaerkungen: Schiffe je Beitrag getrennt in derselben Detailansicht auflisten (mit eigenem
  // Spielernamen), Ueberlebende zurueck an den jeweiligen Absender. Jeder Verstaerker bekommt
  // ausserdem eine EIGENE Container-Belohnung, exakt wie ein Verteidiger sie auch bekommen wuerde -
  // keine Aufteilung, jeder erhaelt seine volle "Solo"-Belohnung fuer den gemeinsamen Kampfausgang.
  if (reinforcerStates.length > 0) {
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      const ownerKey = String(r.userId);
      const ownerSurvivors = survivorsByOwner?.[ownerKey] || {};
      Object.entries(r.ships).forEach(([id, sentCount]) => {
        const survived = ownerSurvivors[id] || 0;
        const lost = sentCount - survived;
        reinforcerState.fleet[id] = (reinforcerState.fleet[id] || 0) + survived;
        const eff = getEffectiveStats(id, reinforcerState.research);
        const statKey = `${ownerKey}:${id}`;
        playerResults.push({
          id,
          name: shipName(id),
          ownerUsername: r.username,
          sent: sentCount,
          survived,
          lost,
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
      });
      // Wird unten (nachdem alle playerResults/npcResults feststehen) mit der vollen Detailansicht
      // versehen - siehe pushMessage-Aufrufe am Ende dieser Funktion.
    });
  }

  // Bergungs-DM ("Bergung aus der zerstoerten Flotte") - skaliert mit der Anzahl vernichteter
  // Piratenschiffe/-anlagen, unabhaengig davon ob der Angriff vollstaendig abgewehrt wurde. Jeder
  // Beteiligte (Verteidiger + Verstaerker) bekommt den vollen Betrag, keine Aufteilung (Punkt 5).
  const destroyedCount = npcResults.reduce((sum, r) => sum + (r.destroyedCount || 0), 0);
  const salvageDm = Math.min(RAID_SALVAGE_DM_MAX, Math.round(destroyedCount * RAID_SALVAGE_DM_PER_KILL));
  if (salvageDm > 0) {
    state.resources.dm += salvageDm;
    reinforcerStates.forEach(({ playerState: reinforcerState }) => (reinforcerState.resources.dm += salvageDm));
  }

  // Statistik (siehe stats.ts) - Verteidiger UND alle Verstaerker bekommen denselben Ausgang
  // gutgeschrieben, keine Aufteilung (Punkt 5).
  const ownLossCount = Object.values(losses).reduce((a, b) => a + b, 0);
  if (piratesRepelled) state.stats.raidsRepelledFull++;
  else state.stats.raidsRepelledPartial++;
  state.stats.enemiesDestroyed += destroyedCount;
  state.stats.ownShipsLost += ownLossCount;
  reinforcerStates.forEach(({ playerState: reinforcerState }) => {
    if (piratesRepelled) reinforcerState.stats.raidsRepelledFull++;
    else reinforcerState.stats.raidsRepelledPartial++;
    reinforcerState.stats.enemiesDestroyed += destroyedCount;
  });

  // Bei vollstaendig abgewehrtem Angriff (echter "Sieg") 1-3 Container zufaellig, sonst weiterhin
  // genau 1 (analog zu Notruf-Events, siehe events.ts) - Verteidiger UND alle Verstaerker
  // bekommen dieselbe Anzahl/Stufe (gemeinsamer Ausgang, keine Aufteilung, siehe Punkt 5).
  const containerCount = piratesRepelled ? 1 + Math.floor(Math.random() * 3) : 1;
  const containerReward: 'silber' | 'gold' = piratesRepelled ? 'gold' : 'silber';
  for (let i = 0; i < containerCount; i++) {
    state.inventory.push({ id: 'container_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 8), tier: containerReward, receivedAt: Date.now() });
  }
  reinforcerStates.forEach(({ playerState: reinforcerState }) => {
    for (let i = 0; i < containerCount; i++) {
      reinforcerState.inventory.push({
        id: 'container_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 8),
        tier: containerReward,
        receivedAt: Date.now(),
      });
    }
  });
  const salvageText = salvageDm > 0 ? ` Bergung aus der zerstörten Flotte: ${salvageDm} Dunkle Materie.` : '';

  const waveText = outlier === 'stark' ? ' [⚠ Ungewöhnlich starker Angriff]' : outlier === 'schwach' ? ' [Auffällig schwacher Angriff]' : '';
  const modifierText = battleModifier ? ` ${BATTLE_MODIFIER_LABELS[battleModifier]}.` : '';

  if (!piratesRepelled) {
    const stolen = {
      metall: Math.round(state.resources.metall * RAID_LOOT_PERCENT),
      kristall: Math.round(state.resources.kristall * RAID_LOOT_PERCENT),
      deuterium: Math.round(state.resources.deuterium * RAID_LOOT_PERCENT),
    };
    state.resources.metall = Math.max(0, state.resources.metall - stolen.metall);
    state.resources.kristall = Math.max(0, state.resources.kristall - stolen.kristall);
    state.resources.deuterium = Math.max(0, state.resources.deuterium - stolen.deuterium);

    const outcome = result.retreated
      ? 'Rückzug nach hohen Verlusten – Feinde überlebt'
      : 'Piratenüberfall teilweise abgewehrt – Feinde überlebt';
    const detail = {
      sektorName: 'Heimatbasis',
      outcome,
      roundsFought: result.roundsFought,
      npcResults,
      playerResults,
      replay: result.replay,
      rewards: { stolenMetall: stolen.metall, stolenKristall: stolen.kristall, stolenDeuterium: stolen.deuterium, containerTier: containerReward, dm: salvageDm || undefined },
    };
    pushMessage(
      state,
      'kampf',
      `${outcome}${waveText} (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Erbeutet: ${stolen.metall.toLocaleString('de-DE')} Metall, ${stolen.kristall.toLocaleString('de-DE')} Kristall, ${stolen.deuterium.toLocaleString('de-DE')} Deuterium. (Container: ${containerCount}x ${containerReward === 'gold' ? 'Gold' : 'Silber'})${salvageText}${modifierText}`,
      detail
    );
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      pushMessage(
        reinforcerState,
        'kampf',
        `Deine Verstärkung für die Heimatbasis von ${ownerUsername}: Angriff nur teilweise abgewehrt (${result.roundsFought} Runden). Auch du erhältst ${containerCount}x ${
          containerReward === 'gold' ? 'Gold' : 'Silber'
        }-Container für deinen Einsatz.${salvageText}`,
        detail
      );
      if (r.userId !== currentUserId) savePlayerState(reinforcerState);
    });
  } else {
    const outcome = 'Piratenüberfall abgewehrt – alle Feinde vernichtet';
    const detail = {
      sektorName: 'Heimatbasis',
      outcome,
      roundsFought: result.roundsFought,
      npcResults,
      playerResults,
      replay: result.replay,
      rewards: { containerTier: containerReward, dm: salvageDm || undefined },
    };
    pushMessage(
      state,
      'kampf',
      `${outcome}${waveText} (${result.roundsFought} Runden). Eigene Verluste: ${lossText}. Verteidigung wurde zu ${Math.round(DEFENSE_REPAIR_PERCENT * 100)}% repariert. Ressourcen sicher. (Container: ${containerCount}x ${containerReward === 'gold' ? 'Gold' : 'Silber'})${salvageText}${modifierText}`,
      detail
    );
    reinforcerStates.forEach(({ r, playerState: reinforcerState }) => {
      pushMessage(
        reinforcerState,
        'kampf',
        `Deine Verstärkung für die Heimatbasis von ${ownerUsername}: Piratenüberfall erfolgreich abgewehrt (${result.roundsFought} Runden)! Auch du erhältst ${containerCount}x ${
          containerReward === 'gold' ? 'Gold' : 'Silber'
        }-Container für deinen Einsatz.${salvageText}`,
        detail
      );
      if (r.userId !== currentUserId) savePlayerState(reinforcerState);
    });
  }

  state.raid = null;
}
