import { useState } from 'react';
import { useGame } from '../context/GameContext';

function countShipEverywhere(state: NonNullable<ReturnType<typeof useGame>['state']>, shipId: string): number {
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
    <div style={{ padding: 20 }}>
      <h2>Schiffswerft</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Bauwarteschlange</h3>
      {state.buildQueue.length === 0 ? (
        <p style={{ color: '#999' }}>Keine aktive Produktion.</p>
      ) : (
        <ul>
          {state.buildQueue.map((job, i) => {
            const remainingMs = job.endTime - Date.now();
            return (
              <li key={i}>
                {job.shipId} x{job.count} - noch {Math.max(0, Math.round(remainingMs / 1000))}s
              </li>
            );
          })}
        </ul>
      )}

      <h3>Verfügbare Schiffe</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
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
            totalCost &&
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;

          return (
            <div key={ship.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
              <h4>{ship.name}</h4>
              <p style={{ fontSize: 12, color: '#999' }}>
                Bestand: {bestand}
                {ship.maxCount ? `/${ship.maxCount}` : ''}
              </p>
              <p style={{ fontSize: 12 }}>
                Waffen: {ship.stats.waffen} / Schild: {ship.stats.schild} / Panzerung: {ship.stats.panzerung}
              </p>
              {ship.cost && (
                <p style={{ fontSize: 12, color: '#999' }}>
                  Kosten je Stück: {ship.cost.metall.toLocaleString('de-DE')} Metall,{' '}
                  {ship.cost.kristall.toLocaleString('de-DE')} Kristall, {ship.cost.deuterium.toLocaleString('de-DE')}{' '}
                  Deuterium
                </p>
              )}
              {totalCost && (
                <p style={{ fontSize: 12, fontWeight: 600, color: affordable ? '#7fd97f' : '#e05555' }}>
                  Gesamtkosten für {capQty} Stück: {totalCost.metall.toLocaleString('de-DE')} Metall,{' '}
                  {totalCost.kristall.toLocaleString('de-DE')} Kristall, {totalCost.deuterium.toLocaleString('de-DE')}{' '}
                  Deuterium
                  {!affordable && ' – nicht genug Ressourcen!'}
                </p>
              )}
              {!ship.unique && (
                <input
                  type="number"
                  min={1}
                  max={ship.maxCount ? frei : undefined}
                  value={qty}
                  onChange={(e) => setQtyById((prev) => ({ ...prev, [ship.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                  style={{ width: 100, marginBottom: 8 }}
                />
              )}
              <br />
              <button disabled={!affordable} onClick={() => buildShip(ship.id, capQty)}>
                Bauen {ship.unique ? '' : `(${capQty})`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
