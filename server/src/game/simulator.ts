import { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } from './data/sectors.js';
import {
  combatFleetPowerBase,
  generatePiratenFleet,
  generateDefenseFleet,
  shipName,
  pickWaveProfile,
  rollMultiplierWithOutlier,
  rollBattleModifier,
} from './combat.js';
import { runCombatInWorker } from './combatRunner.js';
import { isBoosterActive } from './boosterUtil.js';
import type { PlayerState } from './types.js';
import type { ActionResult } from './actions.js';

// Wie viele Durchlaeufe maximal, und wie lange die Simulation insgesamt hoechstens dauern darf.
// Kaempfe sind zufallsbehaftet (Trefferwuerfe, Wellenstaerke, Kapitaen-Spawn), daher waere ein
// EINZELNER Lauf irrefuehrend - erst mehrere Laeufe zeigen die tatsaechliche Bandbreite. Das
// Zeitbudget verhindert, dass sehr grosse Flotten die Simulation minutenlang blockieren.
const MAX_RUNS = 12;
const TIME_BUDGET_MS = 6000;
const MIN_RUNS = 3;

export interface SimulationResult {
  runs: number;
  sektorId: string;
  winRate: number; // Anteil der Laeufe, in denen ALLE Feinde vernichtet wurden
  retreatRate: number; // Anteil der Laeufe, die im Rueckzug endeten
  wipeRate: number; // Anteil der Laeufe, in denen die eigene Flotte komplett vernichtet wurde
  avgLossPercent: number; // durchschnittlicher Verlust der eigenen Flotte in %
  bestLossPercent: number;
  worstLossPercent: number;
  avgRounds: number;
  // Durchschnittliche Verluste je Schiffstyp (gerundet), damit man sieht, was besonders leidet
  avgLossesByShip: { id: string; name: string; sent: number; avgLost: number }[];
  exampleNpcFleet: { id: string; name: string; count: number }[];
}

/**
 * Simuliert Kaempfe gegen einen Sektor, OHNE irgendetwas am Spielstand zu veraendern.
 * Nutzt exakt dieselbe Kampf-Engine und dieselbe NPC-Generierung wie der echte Stunden-Check
 * (siehe runHourlyCheck in missions.ts) - inklusive gewuerfelter Wellenstaerke (mit Ausreissern),
 * gewuerfeltem Zusammensetzungs-Profil, Kampf-Modifikatoren, Sektor-Mindeststaerke (npcFloor),
 * NPC-Verteidigungsanlagen und Piratenkapitaen-Chance. Da jeder Durchlauf UNABHAENGIG sein eigenes
 * Profil/Ausreisser/Modifikator wuerfelt, zeigt die Statistik ueber mehrere Laeufe automatisch die
 * echte Bandbreite moeglicher Begegnungen, nicht nur einen Einzelfall.
 */
export async function simulateCombat(state: PlayerState, sektorId: string, selection: Record<string, number>): Promise<ActionResult & { simulation?: SimulationResult }> {
  const cfg = SEKTOR_CONFIG[sektorId];
  if (!cfg) return { ok: false, error: 'Unbekannter Sektor.' };
  if (cfg.type !== 'piraten') return { ok: false, error: 'Simulation ist nur für Piraten-Sektoren möglich.' };

  const ships: Record<string, number> = {};
  for (const [id, qty] of Object.entries(selection)) {
    if (qty > 0) ships[id] = qty;
  }
  const totalSent = Object.values(ships).reduce((a, b) => a + b, 0);
  if (totalSent === 0) return { ok: false, error: 'Keine Schiffe ausgewählt.' };
  // Bewusst KEINE Pruefung gegen die tatsaechlich vorhandene Flotte: der Simulator soll auch
  // Was-waere-wenn-Szenarien mit noch nicht gebauten Schiffen durchrechnen koennen.

  const sentPower = combatFleetPowerBase(ships);
  const table = PIRATEN_MULTIPLIER_ROLL[sektorId];

  let defenseFactor = 0;
  if (sektorId === 'piraten_niedrig') defenseFactor = 0.05;
  else if (sektorId === 'piraten_mittel') defenseFactor = 0.12;
  else if (sektorId === 'piraten_hoch') defenseFactor = 0.20;
  else if (sektorId === 'piraten_elite') defenseFactor = 0.2;

  const startedAt = Date.now();
  let runs = 0;
  let wins = 0;
  let retreats = 0;
  let wipes = 0;
  let totalRounds = 0;
  const lossPercents: number[] = [];
  const lostByShip: Record<string, number> = {};
  let exampleNpc: Record<string, number> = {};

  while (runs < MAX_RUNS) {
    // Zeitbudget einhalten, aber immer mindestens MIN_RUNS Laeufe schaffen, damit das Ergebnis
    // nicht auf einem einzigen Zufallsergebnis basiert.
    if (runs >= MIN_RUNS && Date.now() - startedAt > TIME_BUDGET_MS) break;

    const { multiplier: rolledMultiplier } = rollMultiplierWithOutlier(table, sektorId);
    const targetPower = Math.max(sentPower * rolledMultiplier, cfg.npcFloor || 0);
    const profile = pickWaveProfile(sektorId);
    const battleModifier = rollBattleModifier(sektorId);
    // Spionage aktuell als Platzhalter gesperrt (siehe startResearch() in actions.ts) - fest 0,
    // damit die Vorhersage der echten Formel entspricht.
    const npcShips = generatePiratenFleet(targetPower, 0, profile);
    let npcDefenses = generateDefenseFleet(sentPower * defenseFactor, 0);
    if (cfg.captainChance && Math.random() < cfg.captainChance) {
      npcDefenses = { ...npcDefenses, piratenkapitan: 1 };
    }
    const npcCombined = { ...npcShips, ...npcDefenses };
    if (Object.keys(npcCombined).length === 0) continue;
    if (runs === 0) exampleNpc = npcCombined;

    const result = await runCombatInWorker({
      sideAShips: ships,
      sideBShips: npcCombined,
      research: state.research,
      battleModifier,
      playerClass: state.playerClass,
      kampfBoostActive: isBoosterActive(state, 'kampf'),
      shipModules: state.shipModules,
    });

    runs++;
    totalRounds += result.roundsFought;
    if (result.retreated) retreats++;

    const npcFullyDestroyed = Object.keys(npcCombined).every((id) => (result.survivorsB[id] || 0) <= 0);
    if (npcFullyDestroyed) wins++;

    let sentTotal = 0;
    let lostTotal = 0;
    Object.entries(ships).forEach(([id, sent]) => {
      const survived = result.survivorsA[id] || 0;
      const lost = sent - survived;
      sentTotal += sent;
      lostTotal += lost;
      lostByShip[id] = (lostByShip[id] || 0) + lost;
    });
    if (lostTotal >= sentTotal) wipes++;
    lossPercents.push(sentTotal > 0 ? (lostTotal / sentTotal) * 100 : 0);
  }

  if (runs === 0) return { ok: false, error: 'Simulation fehlgeschlagen - keine Gegner generiert.' };

  const avgLossesByShip = Object.entries(ships).map(([id, sent]) => ({
    id,
    name: shipName(id),
    sent,
    avgLost: Math.round((lostByShip[id] || 0) / runs),
  }));

  return {
    ok: true,
    simulation: {
      runs,
      sektorId,
      winRate: Math.round((wins / runs) * 100),
      retreatRate: Math.round((retreats / runs) * 100),
      wipeRate: Math.round((wipes / runs) * 100),
      avgLossPercent: Math.round(lossPercents.reduce((a, b) => a + b, 0) / runs),
      bestLossPercent: Math.round(Math.min(...lossPercents)),
      worstLossPercent: Math.round(Math.max(...lossPercents)),
      avgRounds: Math.round(totalRounds / runs),
      avgLossesByShip,
      exampleNpcFleet: Object.entries(exampleNpc)
        .filter(([, c]) => c > 0)
        .map(([id, count]) => ({ id, name: shipName(id), count })),
    },
  };
}
