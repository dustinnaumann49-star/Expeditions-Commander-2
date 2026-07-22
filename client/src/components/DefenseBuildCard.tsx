import { useState } from 'react';
import { formatTime } from '../lib/format';
import { getDefenseBauzeitMultiplier, getDefenseCostMultiplier } from '../lib/multipliers';
import {
  getRapidFireDisplay,
  computeDomeSharedPool,
  getPrecisionChance,
  getShieldRegenRate,
  getZielerfassungAccuracy,
  getCritChance,
  getEffectiveDefenseStats,
} from '../lib/combatInfo';
import type { DefenseDefinition, GameData, PlayerState } from '../types/game';

// Siehe ShipBuildCard.tsx - identisches Muster fuer die "Basiswert (Effektivwert)"-Anzeige.
function statDisplay(base: number, effective: number): string {
  const rounded = Math.round(effective);
  if (rounded === base) return base.toLocaleString('de-DE');
  return `${base.toLocaleString('de-DE')} (${rounded.toLocaleString('de-DE')})`;
}

// Bugfix: zaehlte bisher nur state.defense (bereits fertig gebaut), nicht die eigene
// Bau-Warteschlange (defenseQueue) - bei limitierten Anlagen (maxCount, z.B. Kuppeln/Sentinel-/
// Ultimate-Kanone) blieb der Bauen-Button dadurch anklickbar, obwohl inklusive bereits laufender
// Bauauftraege das Limit schon erreicht war (der Server haette den Bau trotzdem korrekt
// abgelehnt, siehe countDefenseEverywhere() in server/src/game/actions.ts, aber die UI zeigte
// einen irrefuehrend aktiven Button an). Verteidigungsanlagen bewegen sich nie (keine Missionen/
// Galaxie-Halten/Gruppen-Expeditionen wie bei Schiffen) - defense + defenseQueue ist hier bereits
// vollstaendig.
function countDefenseEverywhere(state: PlayerState, defId: string): number {
  let total = state.defense[defId] || 0;
  state.defenseQueue.forEach((job) => {
    if (job.defId === defId) total += job.count || 0;
  });
  return total;
}

// Normale, ressourcen-finanzierte Verteidigungs-Baukarte - genutzt in allen Verteidigungs-
// Untertabs (Werft.tsx). Gleiches Muster wie ShipBuildCard.tsx, nur ohne Antrieb/Speed (bewegt
// sich nicht) und mit der Kuppel-Sonderbehandlung aus der vorherigen eigenstaendigen
// Verteidigung.tsx-Seite.
export function DefenseBuildCard({
  def,
  gameData,
  state,
  onBuild,
  onOpenLore,
  onOpenInfo,
}: {
  def: DefenseDefinition;
  gameData: GameData;
  state: PlayerState;
  onBuild: (defId: string, qty: number) => void;
  onOpenLore: () => void;
  onOpenInfo: () => void;
}) {
  const [qty, setQty] = useState(10);
  const bauzeitMult = getDefenseBauzeitMultiplier(gameData, state);
  const costMult = getDefenseCostMultiplier(state);

  const bestand = countDefenseEverywhere(state, def.id);
  const frei = def.maxCount ? def.maxCount - bestand : Infinity;
  const capQty = Math.max(0, Math.min(qty, frei));
  const totalCost = {
    metall: def.cost.metall * costMult * capQty,
    kristall: def.cost.kristall * costMult * capQty,
    deuterium: def.cost.deuterium * costMult * capQty,
  };
  const affordable =
    state.resources.metall >= totalCost.metall &&
    state.resources.kristall >= totalCost.kristall &&
    state.resources.deuterium >= totalCost.deuterium &&
    capQty > 0;
  const effBuildTimeMs = def.buildTime * bauzeitMult * capQty * 1000;
  const effStats = getEffectiveDefenseStats(gameData, state, def);

  return (
    <div className="ship-card">
      <img className="ship-img" src={`/${def.img}`} alt={def.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      <div className="ship-info">
        <h3>
          <span className="lore-title" onClick={onOpenLore}>
            {def.name}
          </span>{' '}
          <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={onOpenInfo}>
            ℹ️ Info
          </button>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
          Bestand: {bestand}
          {def.maxCount ? `/${def.maxCount}` : ''}
        </p>
        <div className="ship-stats">
          {def.stats.waffen > 0 && <span>Waffen: {statDisplay(def.stats.waffen, effStats.waffen)}</span>}
          {/* Kuppeln: Schild laeuft komplett ueber den gemeinsamen Kuppel-Pool (computeDomeSharedPool),
              der Effektivwert hier waere immer 0 und damit irrefuehrend - Basiswert bleibt stehen. */}
          <span>Schild: {def.isDome ? def.stats.schild.toLocaleString('de-DE') : statDisplay(def.stats.schild, effStats.schild)}</span>
          <span>Panzerung: {statDisplay(def.stats.panzerung, effStats.panzerung)}</span>
        </div>

        <div className="ship-cost">
          Kosten je Stück: {(def.cost.metall * costMult).toLocaleString('de-DE')} Metall,{' '}
          {(def.cost.kristall * costMult).toLocaleString('de-DE')} Kristall, {(def.cost.deuterium * costMult).toLocaleString('de-DE')} Deuterium
          {costMult !== 1 && ' (Klassen-Rabatt bereits eingerechnet)'}
        </div>
        <div className="ship-cost" style={{ color: affordable ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
          Gesamtkosten für {capQty} Stück: {totalCost.metall.toLocaleString('de-DE')} Metall, {totalCost.kristall.toLocaleString('de-DE')}{' '}
          Kristall, {totalCost.deuterium.toLocaleString('de-DE')} Deuterium
          {!affordable && ' – nicht genug Ressourcen!'}
        </div>
        <div className="qty-row">
          <input
            className="qty-input"
            type="number"
            min={1}
            max={def.maxCount ? frei : undefined}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="build-row">
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(effBuildTimeMs)}</span>
          <button className="build-btn" disabled={!affordable} onClick={() => onBuild(def.id, capQty)}>
            Bauen ({capQty})
          </button>
        </div>
      </div>
    </div>
  );
}

export function defenseInfoRows(gameData: GameData, state: PlayerState, def: DefenseDefinition): [string, React.ReactNode][] {
  const bestand = countDefenseEverywhere(state, def.id);
  const domePool = computeDomeSharedPool(gameData, state);
  const rfDisplay = getRapidFireDisplay(gameData, def.id);
  const defAccuracy = getZielerfassungAccuracy(gameData, state.research, def.id);
  const isVolleyDefense = gameData.multiTargetVolleyShips.includes(def.id);
  const volleyTargetTypes = Object.keys(gameData.rapidfire[def.id] || {});
  const rows: [string, React.ReactNode][] = [['RapidFire', rfDisplay || 'Kein RapidFire']];
  if (defAccuracy > 0) rows.push(['Zielerfassung', `${(defAccuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`]);
  if (isVolleyDefense) {
    rows.push([
      '⚡ Mehrfachziel-Salve',
      `Bei erfolgreicher Zielerfassung wird JEDER anfällige Schiffstyp einmal getroffen (nicht nur eine zufällige Einheit): ${volleyTargetTypes
        .map((id) => gameData.ships.find((s) => s.id === id)?.name || id)
        .join(', ')}`,
    ]);
  }
  if (def.isDome) {
    rows.push([
      'Kuppel-Funktion',
      `Gibt ${Math.round(def.stats.schild * (1 + (state.research.schild || 0) * 0.1)).toLocaleString(
        'de-DE'
      )} Schild an einen GEMEINSAMEN Schild-Pool ab, der Schaden für die gesamte Verteidigung abfängt, bevor eine einzelne Anlage getroffen wird`,
    ]);
    rows.push(['Eigener Schild', 'Keiner – trägt vollständig zum gemeinsamen Pool bei']);
    rows.push(['Baulimit', 'Nur 1 Exemplar pro Typ möglich']);
  } else if (domePool > 0) {
    rows.push(['Gemeinsamer Kuppel-Schild-Pool (aktuell)', `${Math.round(domePool).toLocaleString('de-DE')} Schild insgesamt für deine gesamte Verteidigung`]);
  }
  if (def.maxCount) {
    rows.push(['Limit', `${bestand}/${def.maxCount} gebaut${def.maxCount - bestand <= 0 ? ' – Limit erreicht' : ''}`]);
  }
  const precision = getPrecisionChance(gameData, state.research, def.id);
  const shieldRegen = getShieldRegenRate(gameData, state.research, def.id);
  const critChance = getCritChance(gameData, state.research, def.id);
  const hasWeapon = def.stats.waffen > 0;
  if (hasWeapon) {
    rows.push(['🎯 Präzision', `${(precision * 100).toFixed(0)}% Trefferchance`]);
    rows.push(['💥 Kritische Treffer', `${(critChance * 100).toFixed(0)}% Chance auf ${gameData.critDamageMultiplier}× Schaden`]);
  }
  rows.push(['💨 Ausweichen', 'Unbeweglich – kann nicht ausweichen']);
  if (def.isDome) {
    rows.push(['🛡️ Schild-Regeneration (Pool)', `${(shieldRegen * 100).toFixed(0)}% des Pools pro Runde (Basis-Energieversorgung)`]);
  } else {
    rows.push(['🛡️ Schild-Regeneration', `${(shieldRegen * 100).toFixed(0)}% pro Runde (Basis-Energieversorgung)`]);
  }
  return rows;
}
