import { useState } from 'react';
import { formatTime } from '../lib/format';
import { getBauzeitMultiplier, getShipCostMultiplier } from '../lib/multipliers';
import {
  getRapidFireDisplay,
  getZielerfassungAccuracy,
  isTargetedByRapidFire,
  shipName,
  getPrecisionChance,
  getShieldRegenRate,
  getEvasionChance,
  getCritChance,
  driveTypeLabel,
} from '../lib/combatInfo';
import type { GameData, PlayerState, ShipDefinition } from '../types/game';

export function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  return total;
}

// Normale, ressourcen-finanzierte Schiffs-Baukarte - genutzt in Werft.tsx (Hauptliste) UND
// Spezialschiffe.tsx (Salvenschiffe, die trotz Umzug in den Untertab weiterhin ganz normal ueber
// buildShip()/die 3 Bau-Slots laufen, NICHT ueber Spezialteile wie der Imperator).
export function ShipBuildCard({
  ship,
  gameData,
  state,
  onBuild,
  onOpenLore,
  onOpenInfo,
}: {
  ship: ShipDefinition;
  gameData: GameData;
  state: PlayerState;
  onBuild: (shipId: string, qty: number) => void;
  onOpenLore: () => void;
  onOpenInfo: () => void;
}) {
  const [qty, setQty] = useState(10);
  const bauzeitMult = getBauzeitMultiplier(gameData, state);
  const costMult = getShipCostMultiplier(state);

  const bestand = countShipEverywhere(state, ship.id);
  const frei = ship.maxCount ? ship.maxCount - bestand : Infinity;
  const capQty = ship.unique ? 1 : ship.maxCount ? Math.max(0, Math.min(qty, frei)) : qty;
  const alreadyExists = ship.unique && bestand >= 1;
  const totalCost = ship.cost
    ? {
        metall: ship.cost.metall * costMult * capQty,
        kristall: ship.cost.kristall * costMult * capQty,
        deuterium: ship.cost.deuterium * costMult * capQty,
      }
    : null;
  const affordable =
    !!totalCost &&
    state.resources.metall >= totalCost.metall &&
    state.resources.kristall >= totalCost.kristall &&
    state.resources.deuterium >= totalCost.deuterium &&
    capQty > 0;
  const effBuildTimeMs = ship.buildTime * bauzeitMult * (ship.unique ? 1 : capQty) * 1000;

  return (
    <div className="ship-card">
      <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      <div className="ship-info">
        <h3>
          <span className="lore-title" onClick={onOpenLore}>
            {ship.name}
          </span>{' '}
          <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={onOpenInfo}>
            ℹ️ Info
          </button>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
          Bestand: {bestand}
          {ship.maxCount ? `/${ship.maxCount}` : ''}
        </p>
        <div className="ship-stats">
          {ship.stats.waffen > 0 && <span>Waffen: {ship.stats.waffen.toLocaleString('de-DE')}</span>}
          <span>Schild: {ship.stats.schild.toLocaleString('de-DE')}</span>
          <span>Panzerung: {ship.stats.panzerung.toLocaleString('de-DE')}</span>
        </div>

        {ship.cost && (
          <>
            <div className="ship-cost">
              Kosten je Stück: {(ship.cost.metall * costMult).toLocaleString('de-DE')} Metall,{' '}
              {(ship.cost.kristall * costMult).toLocaleString('de-DE')} Kristall,{' '}
              {(ship.cost.deuterium * costMult).toLocaleString('de-DE')} Deuterium
              {costMult !== 1 && ' (Klassen-Rabatt bereits eingerechnet)'}
            </div>
            <div className="ship-cost" style={{ color: affordable ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
              Gesamtkosten für {capQty} Stück: {totalCost!.metall.toLocaleString('de-DE')} Metall, {totalCost!.kristall.toLocaleString('de-DE')}{' '}
              Kristall, {totalCost!.deuterium.toLocaleString('de-DE')} Deuterium
              {!affordable && ' – nicht genug Ressourcen!'}
            </div>
          </>
        )}
        {!ship.unique && (
          <div className="qty-row">
            <input
              className="qty-input"
              type="number"
              min={1}
              max={ship.maxCount ? frei : undefined}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        )}
        <div className="build-row">
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(effBuildTimeMs)}</span>
          <button className="build-btn" disabled={!affordable || alreadyExists} onClick={() => onBuild(ship.id, capQty)}>
            Bauen {ship.unique ? '' : `(${capQty})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shipInfoRows(gameData: GameData, state: PlayerState, ship: ShipDefinition) {
  const bestand = countShipEverywhere(state, ship.id);
  const rfDisplay = getRapidFireDisplay(gameData, ship.id);
  const accuracy = getZielerfassungAccuracy(gameData, state.research, ship.id);
  const targeted = isTargetedByRapidFire(gameData, ship.id);
  const isVolleyShip = gameData.multiTargetVolleyShips.includes(ship.id);
  const volleyTargetTypes = Object.keys(gameData.rapidfire[ship.id] || {});
  const precision = getPrecisionChance(gameData, state.research, ship.id);
  const shieldRegen = getShieldRegenRate(gameData, state.research, ship.id);
  const evasion = getEvasionChance(gameData, state.research, ship.id);
  const critChance = getCritChance(gameData, state.research, ship.id);
  const rows: [string, React.ReactNode][] = [
    ['🚀 Geschwindigkeit', `${ship.speed.toLocaleString('de-DE')} (${driveTypeLabel(ship.driveType)})`],
    ['RapidFire', rfDisplay || 'Kein RapidFire (Basis-Schiff)'],
    ...(accuracy > 0 ? ([['Zielerfassung', `${(accuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`]] as [string, React.ReactNode][]) : []),
    ...(isVolleyShip
      ? ([
          [
            '⚡ Mehrfachziel-Salve',
            `Bei erfolgreicher Zielerfassung wird JEDER anfällige Schiffstyp einmal getroffen (nicht nur eine zufällige Einheit): ${volleyTargetTypes
              .map((id) => shipName(gameData, id))
              .join(', ')}`,
          ],
        ] as [string, React.ReactNode][])
      : []),
    ['Ziel für RapidFire?', targeted ? '⚠ Ja, andere Einheiten können dieses Schiff gezielt anvisieren' : 'Nein'],
    ['🎯 Präzision', `${(precision * 100).toFixed(0)}% Trefferchance`],
    ['💨 Ausweichen', evasion > 0 ? `${(evasion * 100).toFixed(0)}% Chance, einem Treffer zu entgehen` : 'Zu schwerfällig zum Ausweichen'],
    ['💥 Kritische Treffer', `${(critChance * 100).toFixed(0)}% Chance auf ${gameData.critDamageMultiplier}× Schaden`],
    ['🛡️ Schild-Regeneration', `${(shieldRegen * 100).toFixed(0)}% pro Runde`],
    ...(ship.unique
      ? ([['Status', `★ Einzigartig - nur 1 Exemplar möglich${bestand >= 1 ? ' (bereits vorhanden)' : ''}`]] as [string, React.ReactNode][])
      : ship.maxCount
      ? ([['Limit', `${bestand}/${ship.maxCount} gebaut/in Warteschlange${ship.maxCount - bestand <= 0 ? ' – Limit erreicht' : ''}`]] as [string, React.ReactNode][])
      : []),
  ];
  return rows;
}
