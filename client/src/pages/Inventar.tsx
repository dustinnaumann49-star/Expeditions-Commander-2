import { useGame } from '../context/GameContext';
import type { Container, RewardItem } from '../types/game';

export function InventarPage() {
  const { gameData, state, openContainer, redeemRewardItem, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const containers = state.inventory.filter((i): i is Container => 'tier' in i);
  const rewardItems = state.inventory.filter((i): i is RewardItem => 'type' in i && i.type === 'rewardItem');

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Inventar</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {state.inventory.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Dein Inventar ist leer. Container erhältst du durch Event-Missionen, Piratenkapitäne oder bei der Verteidigung deiner Basis.</p>
      ) : (
        <>
          {containers.length > 0 && (
            <div className="queue-box" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Ungeöffnete Container ({containers.length})</h3>
              {containers.map((c) => {
                const config = gameData.containerTypes[c.tier];
                return (
                  <div className="queue-item" key={c.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <strong>
                      {config.icon} {config.name}
                    </strong>
                    <span className="detail-sub">
                      Mögliche Inhalte ({config.pickCount} werden gewählt): {config.rewards.map((r) => r.label).join(', ')}
                    </span>
                    <div className="build-row">
                      <span></span>
                      <button className="build-btn" onClick={() => openContainer(c.id)}>
                        🗝️ Container öffnen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {rewardItems.length > 0 && (
            <div className="queue-box">
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Einlösbare Belohnungen ({rewardItems.length})</h3>
              {rewardItems.map((item) => (
                <div className="queue-item" key={item.id}>
                  <span>
                    {item.count > 1 ? `${item.count}x ` : ''}
                    {item.reward.label}
                  </span>
                  <button className="qty-btn" onClick={() => redeemRewardItem(item.id)}>
                    ✅ Einlösen
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
