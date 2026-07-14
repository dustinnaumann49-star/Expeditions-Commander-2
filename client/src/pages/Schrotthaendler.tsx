import { useState } from 'react';
import { useGame } from '../context/GameContext';

export function SchrotthaendlerPage() {
  const { gameData, state, scrapShip, scrapDefense, error } = useGame();
  const [qtyShip, setQtyShip] = useState<Record<string, number>>({});
  const [qtyDef, setQtyDef] = useState<Record<string, number>>({});

  if (!gameData || !state) return <p>Lade...</p>;
  const rate = gameData.scrapRefundRate;

  const ownedShips = gameData.ships.filter((s) => !s.specialOnly && (state.fleet[s.id] || 0) > 0);
  const ownedDefs = gameData.defenses.filter((d) => (state.defense[d.id] || 0) > 0);

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Schrotthändler</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Du erhältst {(rate * 100).toFixed(0)}% der Baukosten zurück.</p>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Schiffe</h3>
        {ownedShips.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Schiffe vorhanden.</p>
        ) : (
          ownedShips.map((s) => {
            const owned = state.fleet[s.id] || 0;
            const qty = qtyShip[s.id] ?? owned;
            return (
              <div className="queue-item" key={s.id}>
                <span>
                  {s.name} (Bestand: {owned})
                </span>
                <span className="qty-row">
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={owned}
                    value={qty}
                    onChange={(e) => setQtyShip((p) => ({ ...p, [s.id]: parseInt(e.target.value) || 0 }))}
                    style={{ width: 80 }}
                  />
                  <button className="qty-btn" onClick={() => scrapShip(s.id, qty)}>
                    Verschrotten
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="queue-box">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Verteidigung</h3>
        {ownedDefs.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Verteidigungsanlagen vorhanden.</p>
        ) : (
          ownedDefs.map((d) => {
            const owned = state.defense[d.id] || 0;
            const qty = qtyDef[d.id] ?? owned;
            return (
              <div className="queue-item" key={d.id}>
                <span>
                  {d.name} (Bestand: {owned})
                </span>
                <span className="qty-row">
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={owned}
                    value={qty}
                    onChange={(e) => setQtyDef((p) => ({ ...p, [d.id]: parseInt(e.target.value) || 0 }))}
                    style={{ width: 80 }}
                  />
                  <button className="qty-btn" onClick={() => scrapDefense(d.id, qty)}>
                    Verschrotten
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
