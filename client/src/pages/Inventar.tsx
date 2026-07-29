import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import type { Container, ContainerReward, RewardItem } from '../types/game';

const CATEGORY_LABELS: Record<string, string> = {
  resources: 'Rohstoffe',
  dm: 'Dunkle Materie',
  teile: 'Ausrüstungs-Teile',
  zeitgutschein: 'Zeit-Gutscheine',
  freischiff: 'Geschenkte Schiffe',
};
const CATEGORY_ORDER = ['resources', 'dm', 'teile', 'zeitgutschein', 'freischiff'];
const TIER_ORDER = ['silber', 'gold', 'elite'];

function categoryForRewardType(type: string): string {
  if (type.startsWith('zeitgutschein')) return 'zeitgutschein';
  if (CATEGORY_LABELS[type]) return type;
  return 'sonstiges';
}

// Formatiert die tatsaechlichen Zahlen einer Belohnung aus - die reward.label-Texte in den
// Server-Konstanten (economy.ts) sind bewusst generisch ("Rohstoff-Fracht" statt der konkreten
// Menge), damit sich Balance-Anpassungen nicht auf Textbausteine auswirken. Fuer die permanente
// Container-Uebersicht unten wollen wir aber genau die Zahlen sehen, nicht nur den generischen Namen.
function formatContainerReward(r: ContainerReward, shipName: (id: string) => string): string {
  switch (r.type) {
    case 'resources':
      return `${(r.metall || 0).toLocaleString('de-DE')} Metall, ${(r.kristall || 0).toLocaleString('de-DE')} Kristall, ${(r.deuterium || 0).toLocaleString('de-DE')} Deuterium`;
    case 'dm':
      return `${(r.amount || 0).toLocaleString('de-DE')} Dunkle Materie`;
    case 'teile':
      return `${r.waffen || 0} Waffen-, ${r.schild || 0} Schild-, ${r.panzerung || 0} Panzerung-Teile`;
    case 'freischiff':
      return Object.entries(r.ships || {})
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => `${qty}x ${shipName(id)}`)
        .join(', ');
    default:
      return `${Math.round((r.percent || 0) * 100)}%`;
  }
}

export function InventarPage() {
  const { gameData, state, openContainer, openAllContainers, redeemRewardItem, redeemAllRewardItems, error } = useGame();
  if (!gameData || !state) return <PageSkeleton />;
  const shipName = (id: string) => gameData.ships.find((s) => s.id === id)?.name || id;

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
                      Mögliche Inhalte (2 pro Öffnung, tatsächliche Chance je Kategorie):{' '}
                      {config.categories.map((cat) => `${CATEGORY_LABELS[cat.category] || cat.category} (${Math.round(cat.realChance * 100)}%)`).join(', ')}
                    </span>
                    <div className="build-row">
                      <span></span>
                      <span>
                        <button className="qty-btn" onClick={() => openContainer(c.id)}>
                          🗝️ Einen öffnen
                        </button>{' '}
                        {c.count > 1 && (
                          <button className="build-btn" onClick={() => openAllContainers(c.tier)}>
                            📦 Alle {c.count} öffnen
                          </button>
                        )}
                      </span>
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
                        <span>
                          <button className="qty-btn" onClick={() => redeemRewardItem(item.id)}>
                            ✅ Einlösen
                          </button>{' '}
                          {cat !== 'zeitgutschein' && item.count > 1 && (
                            <button className="build-btn" onClick={() => redeemAllRewardItems(item.id)}>
                              ✅ Alle {item.count} einlösen
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="queue-box" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>📦 Container-Übersicht</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
          Bei jeder Öffnung werden genau 2 der unten gelisteten Kategorien ausgelost - die angezeigte Prozentzahl ist bereits die
          tatsächliche Chance, dass diese Kategorie am Ende wirklich dabei ist (nicht der rohe Einzelwurf). Enthält eine Kategorie
          mehrere Varianten (z.B. Zeit-Gutscheine), wird bei Treffer zufällig eine davon vergeben. Zusätzlich hat JEDE Öffnung eine{' '}
          {Math.round(gameData.containerJackpotChance * 100)}% Chance auf einen Bonus-Jackpot obendrauf.
        </p>
        {TIER_ORDER.map((tier) => {
          const config = gameData.containerTypes[tier];
          if (!config) return null;
          const jackpot = gameData.containerJackpotRewards[tier];
          return (
            <div key={tier} style={{ marginBottom: 16, borderLeft: `3px solid ${config.color}`, paddingLeft: 10 }}>
              <h4 style={{ fontSize: 13, marginBottom: 6 }}>
                {config.icon} {config.name}
              </h4>
              {config.categories.map((cat, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                  <strong>{CATEGORY_LABELS[cat.category] || cat.category}</strong>{' '}
                  <span style={{ color: 'var(--accent-kristall)' }}>({Math.round(cat.realChance * 100)}%)</span>:{' '}
                  {cat.rewards.length === 1 ? (
                    <span style={{ color: 'var(--text-dim)' }}>{formatContainerReward(cat.rewards[0], shipName)}</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>
                      zufällig eine Variante - {cat.rewards.map((r) => r.label).join(' / ')}
                    </span>
                  )}
                </div>
              ))}
              {jackpot && (
                <div style={{ fontSize: 12, color: 'var(--rf-gold)' }}>
                  🎰 Jackpot: {jackpot.label} - {formatContainerReward(jackpot, shipName)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
