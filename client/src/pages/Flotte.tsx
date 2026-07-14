import { useGame } from '../context/GameContext';

export function FlottePage() {
  const { gameData, state } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const owned = gameData.ships.filter((s) => (state.fleet[s.id] || 0) > 0);
  const totalOwned = Object.values(state.fleet).reduce((a, b) => a + (b || 0), 0);

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Flotte (Bestand)</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Flotte: {totalOwned.toLocaleString('de-DE')} Schiffe</p>

      {owned.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Noch keine Schiffe gebaut.</p>
      ) : (
        <div className="queue-box">
          {owned.map((s) => (
            <div className="queue-item" key={s.id}>
              <span>{s.name}</span>
              <span>
                {(state.fleet[s.id] || 0).toLocaleString('de-DE')} Stück · W {s.stats.waffen.toLocaleString('de-DE')} / S{' '}
                {s.stats.schild.toLocaleString('de-DE')} / P {s.stats.panzerung.toLocaleString('de-DE')}
              </span>
            </div>
          ))}
        </div>
      )}

      {state.missions.length > 0 && (
        <>
          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Unterwegs</h3>
          <div className="queue-box">
            {state.missions.map((m) => (
              <div className="queue-item" key={m.id}>
                <span>{m.sektorId}</span>
                <span>{Object.entries(m.ships).map(([id, c]) => `${id} x${c}`).join(', ')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
