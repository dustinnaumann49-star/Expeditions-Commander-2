import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { getEffectiveBoosterCost } from '../lib/multipliers';

function ShopBoosterView() {
  const { gameData, state, buyBooster, buyVoucher, error } = useGame();
  if (!gameData || !state) return <PageSkeleton />;

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Dunkle Materie: {Math.floor(state.resources.dm)}</p>

      <h3 style={{ marginBottom: 8 }}>Booster (24h)</h3>
      <div className="ship-grid" style={{ marginBottom: 24 }}>
        {gameData.boosters.map((b) => {
          const expiry = state.activeBoosters[b.id];
          const active = expiry && expiry > serverNow();
          const cost = getEffectiveBoosterCost(b.cost, state);
          return (
            <div className="ship-card" key={b.id}>
              <img className="ship-img" src={`/${b.img}`} alt={b.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>{b.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{b.desc}</p>
                {active && <p style={{ color: 'var(--accent-deut)' }}>Aktiv: noch {formatTime(expiry - serverNow())}</p>}
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Kosten: {cost} DM</span>
                  <button className="build-btn" disabled={state.resources.dm < cost} onClick={() => buyBooster(b.id)}>
                    Kaufen
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginBottom: 8 }}>Zeit-Gutscheine</h3>
      <div className="ship-grid">
        {gameData.vouchers.map((v) => (
          <div className="ship-card" key={v.id}>
            <img className="ship-img" src={`/${v.img}`} alt={v.label} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div className="ship-info">
              <h3>{v.label}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{v.desc}</p>
              <div className="build-row">
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Kosten: {v.cost} DM</span>
                <button className="build-btn" disabled={state.resources.dm < v.cost} onClick={() => buyVoucher(v.id)}>
                  Kaufen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShopPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Shop</h2>
      <ShopBoosterView />
    </div>
  );
}
