import { useState } from 'react';
import { useGame } from '../context/GameContext';

export function VerteidigungPage() {
  const { gameData, state, buildDefense, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  if (!gameData || !state) return <p>Lade...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Verteidigung</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Bauwarteschlange</h3>
      {state.defenseQueue.length === 0 ? (
        <p style={{ color: '#999' }}>Keine aktive Produktion.</p>
      ) : (
        <ul>
          {state.defenseQueue.map((job, i) => (
            <li key={i}>
              {job.defId} x{job.count} - noch {Math.max(0, Math.round((job.endTime - Date.now()) / 1000))}s
            </li>
          ))}
        </ul>
      )}

      <h3>Verfügbare Anlagen</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
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
            <div key={def.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
              <h4>{def.name}</h4>
              <p style={{ fontSize: 12, color: '#999' }}>
                Bestand: {bestand}/{def.maxCount}
              </p>
              <p style={{ fontSize: 12 }}>
                Waffen: {def.stats.waffen} / Schild: {def.stats.schild} / Panzerung: {def.stats.panzerung}
              </p>
              <p style={{ fontSize: 12, color: '#999' }}>
                Kosten je Stück: {def.cost.metall.toLocaleString('de-DE')} Metall, {def.cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                {def.cost.deuterium.toLocaleString('de-DE')} Deuterium
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: affordable ? '#7fd97f' : '#e05555' }}>
                Gesamtkosten für {capQty} Stück: {totalCost.metall.toLocaleString('de-DE')} Metall, {totalCost.kristall.toLocaleString('de-DE')}{' '}
                Kristall, {totalCost.deuterium.toLocaleString('de-DE')} Deuterium
                {!affordable && ' – nicht genug Ressourcen!'}
              </p>
              <input
                type="number"
                min={1}
                max={frei}
                value={qty}
                onChange={(e) => setQtyById((prev) => ({ ...prev, [def.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: 100, marginBottom: 8 }}
              />
              <br />
              <button disabled={!affordable} onClick={() => buildDefense(def.id, capQty)}>
                Bauen ({capQty})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
