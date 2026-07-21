import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import type { Container, RewardItem } from '../types/game';

const CATEGORY_LABELS: Record<string, string> = {
  resources: 'Rohstoffe',
  dm: 'Dunkle Materie',
  teile: 'Ausrüstungs-Teile',
  zeitgutschein: 'Zeit-Gutscheine',
  freischiff: 'Geschenkte Schiffe',
};
const CATEGORY_ORDER = ['resources', 'dm', 'teile', 'zeitgutschein', 'freischiff'];

function categoryForRewardType(type: string): string {
  if (type.startsWith('zeitgutschein')) return 'zeitgutschein';
  if (CATEGORY_LABELS[type]) return type;
  return 'sonstiges';
}

export function InventarPage() {
  const { gameData, state, openContainer, redeemRewardItem, error } = useGame();
  if (!gameData || !state) return <PageSkeleton />;

  const containers = state.inventory.filter((i): i is Container => 'tier' in i);
  const rewardItems = state.inventory.filter((i): i is RewardItem => 'type' in i && i.type === 'rewardItem');
  const totalContainers = containers.reduce((sum, c) => sum + c.count, 0);

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
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Ungeöffnete Container ({totalContainers})</h3>
              {containers.map((c) => {
                const config = gameData.containerTypes[c.tier];
                return (
                  <div className="queue-item" key={c.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <strong>
                      {config.icon} {config.name} × {c.count}
                    </strong>
                    <span className="detail-sub">
                      Mögliche Inhalte (2 pro Öffnung, unabhängige Chance je Kategorie):{' '}
                      {config.categories.map((cat) => `${CATEGORY_LABELS[cat.category] || cat.category} (${Math.round(cat.chance * 100)}%)`).join(', ')}
                    </span>
                    <div className="build-row">
                      <span></span>
                      <button className="build-btn" onClick={() => openContainer(c.id)}>
                        🗝️ Einen öffnen
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
              {CATEGORY_ORDER.map((cat) => {
                const itemsInCat = rewardItems.filter((item) => categoryForRewardType(item.reward.type) === cat);
                if (itemsInCat.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--accent-kristall)', marginBottom: 6 }}>{CATEGORY_LABELS[cat]}</h4>
                    {itemsInCat.map((item) => (
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
