import { ACTIVE_PIRATE_BASE_IDS, PIRATE_BASE_IDS, PIRATE_BASES, SPY_PROBE_TRAVEL_MS, SPY_PROBE_FUEL_COST_PER_PROBE, PIRATE_SPY_CHECK_INTERVAL_MS, PIRATE_SPY_CHANCE } from './data/galaxyConstants.js';
import { loadPirateBase } from './pirateBaseState.js';
import { shipName } from './combat.js';
import { pushMessage } from './messages.js';
import type { PlayerState, SpyMissionDeployment, PirateBaseState, GalaxyPosition } from './types.js';
import type { ActionResult } from './actions.js';

// ========== SPIONAGE (Nutzerentscheidung Juli 2026) ==========
// Spionagesonden fliegen IMMER SPY_PROBE_TRAVEL_MS (5 Minuten je Richtung, unabhaengig von der
// Entfernung) zu einer Piratenbasis, liefern bei Ankunft einen Bericht (Detailgrad nach
// state.research.spionage) und kehren danach automatisch zurueck - nie Kampf, die Sonde geht nie
// verloren. Komplett unabhaengig vom Raid-System und vom Piratenbasen-Angriffssystem
// (pirateBaseState.ts), auch wenn strukturell an PirateAttackDeployment angelehnt.

const POSITION_BY_ID = new Map<string, GalaxyPosition>(PIRATE_BASE_IDS.map((id, i) => [id, PIRATE_BASES[i]]));

export function startSpyProbe(state: PlayerState, baseId: string, qty: number): ActionResult {
  if (!state.galaxyPosition) return { ok: false, error: 'Dir ist noch keine Galaxie-Position zugewiesen.' };
  if (!ACTIVE_PIRATE_BASE_IDS.includes(baseId)) return { ok: false, error: 'Unbekannte oder nicht ausspähbare Piratenbasis.' };
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, error: 'Ungültige Anzahl Sonden.' };
  if ((state.fleet.spionagesonde || 0) < qty) return { ok: false, error: 'Nicht genug Spionagesonden verfügbar.' };

  const fuelCost = qty * SPY_PROBE_FUEL_COST_PER_PROBE;
  if (state.resources.deuterium < fuelCost) {
    return { ok: false, error: `Nicht genug Deuterium (benötigt: ${fuelCost.toLocaleString('de-DE')}).` };
  }

  state.resources.deuterium -= fuelCost;
  state.fleet.spionagesonde -= qty;

  const targetPos = POSITION_BY_ID.get(baseId)!;
  const now = Date.now();
  const deployment: SpyMissionDeployment = {
    id: 'spy_' + now + '_' + baseId,
    baseId,
    ships: { spionagesonde: qty },
    originSystem: state.galaxyPosition.system,
    originPosition: state.galaxyPosition.position,
    targetSystem: targetPos.system,
    targetPosition: targetPos.position,
    startTime: now,
    arriveTime: now + SPY_PROBE_TRAVEL_MS,
    returnTime: now + SPY_PROBE_TRAVEL_MS * 2,
    resolved: false,
  };
  state.spyMissions.push(deployment);
  return { ok: true };
}

function formatRange(value: number, fuzz: number): string {
  if (value <= 0) return '0';
  if (fuzz <= 0) return value.toLocaleString('de-DE');
  const low = Math.max(0, Math.round(value * (1 - fuzz)));
  const high = Math.round(value * (1 + fuzz));
  return `${low.toLocaleString('de-DE')}-${high.toLocaleString('de-DE')}`;
}

// Detailgrad-Formel: Stufe 0 zeigt NUR Ressourcen (kein Flotten-/Verteidigungswert ueberhaupt).
// Ab Stufe 1 kommen Flotte/Verteidigung als Bereich dazu, dessen Breite mit steigender Stufe
// schrumpft (Stufe 1 = grosser Bereich "ungefaehr", Stufe 10 = exakt, fuzz 0).
function buildSpyReportText(base: PirateBaseState, level: number): string {
  const resText = `Ressourcen: ${base.resources.metall.toLocaleString('de-DE')} Metall, ${base.resources.kristall.toLocaleString(
    'de-DE'
  )} Kristall, ${base.resources.deuterium.toLocaleString('de-DE')} Deuterium.`;

  if (level <= 0) {
    return `Spionagebericht Piratenbasis 1:${base.system}:${base.position}: ${resText} Keine Sensordaten zu Flotte/Verteidigung (Spionage-Forschung Stufe 0 - nur Grundsensoren).`;
  }

  const fuzz = level >= 10 ? 0 : (10 - level) / 10;
  const precisionLabel = level >= 10 ? 'exakt' : 'geschätzt';
  const fleetLines = Object.entries(base.fleet)
    .filter(([, c]) => c > 0)
    .map(([id, c]) => `${shipName(id)}: ${formatRange(c, fuzz)}`);
  const defenseLines = Object.entries(base.defense)
    .filter(([, c]) => c > 0)
    .map(([id, c]) => `${shipName(id)}: ${formatRange(c, fuzz)}`);
  const fleetText = fleetLines.length ? ` Flotte (${precisionLabel}): ${fleetLines.join(', ')}.` : ' Keine Flotte entdeckt.';
  const defenseText = defenseLines.length ? ` Verteidigung (${precisionLabel}): ${defenseLines.join(', ')}.` : ' Keine Verteidigung entdeckt.';

  return `Spionagebericht Piratenbasis 1:${base.system}:${base.position}: ${resText}${fleetText}${defenseText}`;
}

export async function processSpyMissions(state: PlayerState): Promise<void> {
  const now = Date.now();
  for (const deployment of state.spyMissions) {
    if (!deployment.resolved && deployment.arriveTime <= now) {
      deployment.resolved = true;
      const base = loadPirateBase(deployment.baseId);
      if (base) {
        const level = state.research.spionage || 0;
        pushMessage(state, 'farm', buildSpyReportText(base, level));
      } else {
        pushMessage(state, 'farm', `Spionageflug zu Piratenbasis 1:${deployment.targetSystem}:${deployment.targetPosition} fehlgeschlagen - Basis nicht auffindbar.`);
      }
    }
  }
  state.spyMissions = state.spyMissions.filter((deployment) => {
    if (deployment.returnTime <= now) {
      Object.entries(deployment.ships).forEach(([id, qty]) => {
        if (qty > 0) state.fleet[id] = (state.fleet[id] || 0) + qty;
      });
      return false;
    }
    return true;
  });
}

// ========== PIRATEN SPIONIEREN UMGEKEHRT AUCH SPIELER AUS ==========
// Bewusst leichtgewichtig (siehe Kommentar in galaxyConstants.ts): periodischer Checkpoint pro
// Spieler (analog zu Raid-Checkpoints, aber unabhaengig davon), der bei Treffer nur eine Nachricht
// verschickt - WOHER spioniert wurde, nicht WAS die Piraten gesehen haben (kein Gegenstueck zur
// eigenen Spionage-Forschung auf Spielerseite).
export function maybeGeneratePirateSpyReport(state: PlayerState): void {
  const now = Date.now();
  if (now < state.nextPirateSpyCheck) return;
  state.nextPirateSpyCheck = now + PIRATE_SPY_CHECK_INTERVAL_MS;
  if (Math.random() >= PIRATE_SPY_CHANCE) return;

  const baseId = ACTIVE_PIRATE_BASE_IDS[Math.floor(Math.random() * ACTIVE_PIRATE_BASE_IDS.length)];
  const pos = POSITION_BY_ID.get(baseId);
  if (!pos) return;
  pushMessage(
    state,
    'farm',
    `⚠ Deine Basis wurde von einer Piratenbasis bei 1:${pos.system}:${pos.position} ausspioniert. Unbekannt, was dabei entdeckt wurde.`
  );
}
