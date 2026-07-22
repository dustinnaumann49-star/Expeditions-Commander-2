import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';

// Wird an zwei Stellen eingebunden: als normaler Nav-Tab (Wechsel gegen DM) UND als blockierende
// Erstwahl-Ansicht in App.tsx (siehe GameHome dort), wenn state.playerClass noch null ist -
// dieselbe Komponente deckt beide Faelle ab (mandatory steuert nur Layout-Feinheiten/Text).
export function KlassePage({ mandatory = false }: { mandatory?: boolean }) {
  const { gameData, state, setPlayerClass, setEconomyClass, error } = useGame();
  if (!gameData || !state) return <PageSkeleton />;

  const current = state.playerClass;
  const cost = gameData.classChangeCostDm;
  const currentEconomy = state.economyClass;
  const economyCost = gameData.economyClassChangeCostDm;

  return (
    <div>
      {mandatory ? (
        <>
          <h2 style={{ marginBottom: 8 }}>Willkommen, Kommandant</h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
            Bevor es losgeht, wähle eine Klasse. Sie prägt deinen weiteren Weg spürbar - kann aber jederzeit später
            gegen {cost} Dunkle Materie gewechselt werden, falls sich dein Spielstil ändert.
          </p>
        </>
      ) : (
        <h2 style={{ marginBottom: 16 }}>Klasse</h2>
      )}
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="ship-grid class-grid">
        {gameData.playerClasses.map((cls) => {
          const isCurrent = current === cls.id;
          const canAfford = state.resources.dm >= cost;
          return (
            <div
              className={`ship-card class-card${isCurrent ? ' class-card-current' : ''}`}
              key={cls.id}
              style={isCurrent ? { borderColor: 'var(--accent-deut)' } : undefined}
            >
              <div className="class-card-img-wrap">
                <img
                  className="ship-img class-card-img"
                  src={`/${cls.img}`}
                  alt={cls.name}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                <div className="class-card-img-fade" />
                {isCurrent && <span className="class-current-badge">Aktuelle Klasse</span>}
              </div>
              <div className="ship-info">
                <h3>{cls.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>{cls.tagline}</p>
                <ul style={{ fontSize: 12, paddingLeft: 18, marginBottom: 12 }}>
                  {cls.bonuses.map((b, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>
                      {b.label}
                    </li>
                  ))}
                </ul>

                {isCurrent ? null : current === null ? (
                  <button className="build-btn" onClick={() => setPlayerClass(cls.id)}>
                    Kostenlos wählen
                  </button>
                ) : (
                  <div className="build-row">
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Wechsel-Kosten: {cost} DM</span>
                    <button className="build-btn" disabled={!canAfford} onClick={() => setPlayerClass(cls.id)}>
                      Wechseln
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!mandatory && (
        <>
          <h2 style={{ margin: '28px 0 8px' }}>Wirtschafts-Klasse</h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
            Optionale zweite Klasse, unabhängig von deiner Kampf-Klasse - reine Wirtschafts-Boni. Jede Wahl (auch die
            erste) kostet {economyCost} Dunkle Materie.
          </p>
          <div className="ship-grid class-grid">
            {gameData.economyClasses.map((cls) => {
              const isCurrent = currentEconomy === cls.id;
              const canAfford = state.resources.dm >= economyCost;
              return (
                <div
                  className={`ship-card class-card${isCurrent ? ' class-card-current' : ''}`}
                  key={cls.id}
                  style={isCurrent ? { borderColor: 'var(--accent-deut)' } : undefined}
                >
                  <div className="class-card-img-wrap">
                    <img
                      className="ship-img class-card-img"
                      src={`/${cls.img}`}
                      alt={cls.name}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    <div className="class-card-img-fade" />
                    {isCurrent && <span className="class-current-badge">Aktuelle Klasse</span>}
                  </div>
                  <div className="ship-info">
                    <h3>{cls.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>{cls.tagline}</p>
                    <ul style={{ fontSize: 12, paddingLeft: 18, marginBottom: 12 }}>
                      {cls.bonuses.map((b, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          {b.label}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? null : (
                      <div className="build-row">
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Kosten: {economyCost} DM</span>
                        <button className="build-btn" disabled={!canAfford} onClick={() => setEconomyClass(cls.id)}>
                          {currentEconomy === null ? 'Wählen' : 'Wechseln'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
