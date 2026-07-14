import { useGame } from '../context/GameContext';

export function ShopPage() {
  const { gameData, state, buyBooster, buyVoucher, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Shop</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p style={{ fontSize: 13, color: '#999' }}>Dunkle Materie: {Math.floor(state.resources.dm)}</p>

      <h3>Booster (24h)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {gameData.boosters.map((b) => {
          const expiry = state.activeBoosters[b.id];
          const active = expiry && expiry > Date.now();
          return (
            <div key={b.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
              <h4>{b.name}</h4>
              <p style={{ fontSize: 12, color: '#999' }}>{b.desc}</p>
              {active && <p style={{ color: '#7fd97f' }}>Aktiv, noch {Math.round((expiry - Date.now()) / 3600000)}h</p>}
              <p style={{ fontSize: 12 }}>Kosten: {b.cost} Dunkle Materie</p>
              <button disabled={state.resources.dm < b.cost} onClick={() => buyBooster(b.id)}>
                Kaufen
              </button>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 20 }}>Zeit-Gutscheine</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {gameData.vouchers.map((v) => (
          <div key={v.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
            <h4>{v.label}</h4>
            <p style={{ fontSize: 12, color: '#999' }}>{v.desc}</p>
            <p style={{ fontSize: 12 }}>Kosten: {v.cost} Dunkle Materie</p>
            <button disabled={state.resources.dm < v.cost} onClick={() => buyVoucher(v.id)}>
              Kaufen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
