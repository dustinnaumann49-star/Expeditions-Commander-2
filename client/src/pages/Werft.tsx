import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import type { PlayerState } from '../types/game';

function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  return total;
}

export function WerftPage() {
  const { gameData, state, buildShip, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  if (!gameData || !state) return <p>Lade...</p>;

  const ships = gameData.ships.filter((s) => !s.specialOnly);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Schiffswerft</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Bauwarteschlange</h3>
        {state.buildQueue.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine aktive Produktion.</p>
        ) : (
          state.buildQueue.map((job, i) => (
            <div className="queue-item" key={i}>
              <span>
                {gameData.ships.find((s) => s.id === job.shipId)?.name || job.shipId} x{job.count}
              </span>
              <span>noch {Math.max(0, Math.round((job.endTime - serverNow()) / 1000))}s</span>
            </div>
          ))
        )}
      </div>

      <div className="ship-grid">
        {ships.map((ship) => {
          const bestand = countShipEverywhere(state, ship.id);
          const frei = ship.maxCount ? ship.maxCount - bestand : Infinity;
          const qty = qtyById[ship.id] ?? 10;
          const capQty = ship.unique ? 1 : ship.maxCount ? Math.max(0, Math.min(qty, frei)) : qty;
          const totalCost = ship.cost
            ? {
                metall: ship.cost.metall * capQty,
                kristall: ship.cost.kristall * capQty,
                deuterium: ship.cost.deuterium * capQty,
              }
            : null;
          const affordable =
            !!totalCost &&
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;
          const alreadyExists = ship.unique && bestand >= 1;

          return (
            <div className="ship-card" key={ship.id}>
              <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  {ship.name}{' '}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>
                    (Bestand: {bestand}
                    {ship.maxCount ? `/${ship.maxCount}` : ''})
                  </span>
                </h3>
                <div className="ship-stats">
                  {ship.stats.waffen > 0 && <span>Waffen: {ship.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {ship.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {ship.stats.panzerung.toLocaleString('de-DE')}</span>
                  {ship.miningPerHour && <span className="stat-mining">Abbau: {ship.miningPerHour.toLocaleString('de-DE')}/h</span>}
                </div>
                {ship.unique && (
                  <div className="ship-matchup">
                    <span className="matchup-rf">★ Einzigartig: nur 1 Exemplar möglich{alreadyExists ? ' (bereits vorhanden)' : ''}</span>
                  </div>
                )}
                {ship.cost && (
                  <>
                    <div className="ship-cost">
                      Kosten je Stück: {ship.cost.metall.toLocaleString('de-DE')} Metall, {ship.cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                      {ship.cost.deuterium.toLocaleString('de-DE')} Deuterium
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
                      onChange={(e) => setQtyById((prev) => ({ ...prev, [ship.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    />
                  </div>
                )}
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}></span>
                  <button className="build-btn" disabled={!affordable || alreadyExists} onClick={() => buildShip(ship.id, capQty)}>
                    Bauen {ship.unique ? '' : `(${capQty})`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
