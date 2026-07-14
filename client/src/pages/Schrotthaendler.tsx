import { useState } from 'react';
import { useGame } from '../context/GameContext';

export function SchrotthaendlerPage() {
  const { gameData, state, scrapShip, scrapDefense, error } = useGame();
  const [qtyShip, setQtyShip] = useState<Record<string, number>>({});
  const [qtyDef, setQtyDef] = useState<Record<string, number>>({});

  if (!gameData || !state) return <p>Lade...</p>;
  const rate = gameData.scrapRefundRate;

  return (
    <div style={{ padding: 20 }}>
      <h2>Schrotthändler</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p style={{ fontSize: 13, color: '#999' }}>Du erhältst {(rate * 100).toFixed(0)}% der Baukosten zurück.</p>

      <h3>Schiffe</h3>
      {gameData.ships
        .filter((s) => !s.specialOnly && (state.fleet[s.id] || 0) > 0)
        .map((s) => {
          const owned = state.fleet[s.id] || 0;
          const qty = qtyShip[s.id] ?? owned;
          return (
            <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ width: 160 }}>
                {s.name} (Bestand: {owned})
              </span>
              <input
                type="number"
                min={1}
                max={owned}
                value={qty}
                onChange={(e) => setQtyShip((p) => ({ ...p, [s.id]: parseInt(e.target.value) || 0 }))}
                style={{ width: 80 }}
              />
              <button onClick={() => scrapShip(s.id, qty)}>Verschrotten</button>
            </div>
          );
        })}

      <h3 style={{ marginTop: 20 }}>Verteidigung</h3>
      {gameData.defenses
        .filter((d) => (state.defense[d.id] || 0) > 0)
        .map((d) => {
          const owned = state.defense[d.id] || 0;
          const qty = qtyDef[d.id] ?? owned;
          return (
            <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ width: 160 }}>
                {d.name} (Bestand: {owned})
              </span>
              <input
                type="number"
                min={1}
                max={owned}
                value={qty}
                onChange={(e) => setQtyDef((p) => ({ ...p, [d.id]: parseInt(e.target.value) || 0 }))}
                style={{ width: 80 }}
              />
              <button onClick={() => scrapDefense(d.id, qty)}>Verschrotten</button>
            </div>
          );
        })}
    </div>
  );
}
