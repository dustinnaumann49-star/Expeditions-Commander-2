import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { SpezialteilePage } from './Spezialteile';

function ShopBoosterView() {
  const { gameData, state, buyBooster, buyVoucher, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Dunkle Materie: {Math.floor(state.resources.dm)}</p>

      <h3 style={{ marginBottom: 8 }}>Booster (24h)</h3>
      <div className="ship-grid" style={{ marginBottom: 24 }}>
        {gameData.boosters.map((b) => {
          const expiry = state.activeBoosters[b.id];
          const active = expiry && expiry > serverNow();
          return (
            <div className="ship-card" key={b.id}>
              <img className="ship-img" src={`/${b.img}`} alt={b.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>{b.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{b.desc}</p>
                {active && <p style={{ color: 'var(--accent-deut)' }}>Aktiv: noch {formatTime(expiry - serverNow())}</p>}
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Kosten: {b.cost} DM</span>
                  <button className="build-btn" disabled={state.resources.dm < b.cost} onClick={() => buyBooster(b.id)}>
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

const SHOP_TABS = [
  { id: 'booster', name: 'Booster & Gutscheine' },
  { id: 'spezialteile', name: 'Spezialteile' },
];

export function ShopPage() {
  const [tab, setTab] = useState<'booster' | 'spezialteile'>('booster');

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Shop</h2>
      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {SHOP_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(t.id as any)}>
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'booster' && <ShopBoosterView />}
      {tab === 'spezialteile' && <SpezialteilePage />}
    </div>
  );
}
