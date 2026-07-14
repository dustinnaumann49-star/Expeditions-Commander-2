import { useGame } from '../context/GameContext';
import type { Container, RewardItem } from '../types/game';

export function InventarPage() {
  const { gameData, state, openContainer, redeemRewardItem, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const containers = state.inventory.filter((i): i is Container => 'tier' in i);
  const rewardItems = state.inventory.filter((i): i is RewardItem => 'type' in i && i.type === 'rewardItem');

  if (state.inventory.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Inventar</h2>
        <p>Dein Inventar ist leer. Container erhältst du durch Event-Missionen oder bei der Verteidigung deiner Basis.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Inventar</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {containers.length > 0 && (
        <>
          <h3>Ungeöffnete Container ({containers.length})</h3>
          {containers.map((c) => {
            const config = gameData.containerTypes[c.tier];
            return (
              <div key={c.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <strong>
                  {config.icon} {config.name}
                </strong>
                <p style={{ fontSize: 12, color: '#999' }}>
                  Mögliche Inhalte ({config.pickCount} werden gewählt): {config.rewards.map((r) => r.label).join(', ')}
                </p>
                <button onClick={() => openContainer(c.id)}>🗝️ Container öffnen</button>
              </div>
            );
          })}
        </>
      )}

      {rewardItems.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Einlösbare Belohnungen ({rewardItems.length})</h3>
          {rewardItems.map((item) => (
            <div key={item.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12, marginBottom: 8 }}>
              <strong>
                {item.count > 1 ? `${item.count}x ` : ''}
                {item.reward.label}
              </strong>
              <br />
              <button onClick={() => redeemRewardItem(item.id)}>✅ Einlösen</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
