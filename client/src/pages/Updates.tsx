import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';

export function UpdatesPage() {
  const { gameData } = useGame();
  if (!gameData) return <PageSkeleton />;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Updates</h2>
      {gameData.changelog.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Noch keine Updates vermerkt.</p>
      ) : (
        gameData.changelog.map((entry, i) => (
          <div
            key={entry.date + entry.title}
            className="queue-box"
            style={{ marginBottom: 20, borderColor: i === 0 ? 'var(--accent-kristall)' : undefined }}
          >
            <div className="queue-item" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{entry.title}</span>
              <span style={{ color: 'var(--accent-kristall)', fontSize: 13 }}>{entry.date}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entry.changes.map((change, j) => (
                <li key={j} style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
