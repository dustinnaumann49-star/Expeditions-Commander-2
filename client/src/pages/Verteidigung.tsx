import { useState } from 'react';
import { useGame } from '../context/GameContext';

export function VerteidigungPage() {
  const { gameData, state, buildDefense, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  if (!gameData || !state) return <p>Lade...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Verteidigung</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Bauwarteschlange</h3>
        {state.defenseQueue.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine aktive Produktion.</p>
        ) : (
          state.defenseQueue.map((job, i) => (
            <div className="queue-item" key={i}>
              <span>
                {gameData.defenses.find((d) => d.id === job.defId)?.name || job.defId} x{job.count}
              </span>
              <span>noch {Math.max(0, Math.round((job.endTime - Date.now()) / 1000))}s</span>
            </div>
          ))
        )}
      </div>

      <div className="ship-grid">
        {gameData.defenses.map((def) => {
          const bestand = state.defense[def.id] || 0;
          const frei = def.maxCount - bestand;
          const qty = qtyById[def.id] ?? 10;
          const capQty = Math.max(0, Math.min(qty, frei));
          const totalCost = {
            metall: def.cost.metall * capQty,
            kristall: def.cost.kristall * capQty,
            deuterium: def.cost.deuterium * capQty,
          };
          const affordable =
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;

          return (
            <div className="ship-card" key={def.id}>
              <img className="ship-img" src={`/${def.img}`} alt={def.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  {def.name} <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>(Bestand: {bestand}/{def.maxCount})</span>
                </h3>
                <div className="ship-stats">
                  {def.stats.waffen > 0 && <span>Waffen: {def.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {def.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {def.stats.panzerung.toLocaleString('de-DE')}</span>
                </div>
                {def.isDome && (
                  <div className="ship-matchup">
                    <span className="matchup-weak">Besitzt selbst keinen eigenen Schild – verteilt ihn als Bonus auf andere Anlagen</span>
                  </div>
                )}
                <div className="ship-cost">
                  Kosten je Stück: {def.cost.metall.toLocaleString('de-DE')} Metall, {def.cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                  {def.cost.deuterium.toLocaleString('de-DE')} Deuterium
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
                    max={frei}
                    value={qty}
                    onChange={(e) => setQtyById((prev) => ({ ...prev, [def.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                  />
                </div>
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>🛡️ 70% Reparatur nach Kampf</span>
                  <button className="build-btn" disabled={!affordable} onClick={() => buildDefense(def.id, capQty)}>
                    Bauen ({capQty})
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
