import { useGame } from '../context/GameContext';

export function FlottePage() {
  const { gameData, state } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const owned = gameData.ships.filter((s) => (state.fleet[s.id] || 0) > 0);
  const totalOwned = Object.values(state.fleet).reduce((a, b) => a + (b || 0), 0);

  return (
    <div style={{ padding: 20 }}>
      <h2>Flotte (Bestand)</h2>
      <p style={{ fontSize: 13, color: '#999' }}>Flotte: {totalOwned.toLocaleString('de-DE')} Schiffe</p>

      {owned.length === 0 ? (
        <p style={{ color: '#999' }}>Noch keine Schiffe gebaut.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3a3a3a' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Schiff</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Bestand</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Waffen</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Schild</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Panzerung</th>
            </tr>
          </thead>
          <tbody>
            {owned.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                <td style={{ padding: 6 }}>{s.name}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{(state.fleet[s.id] || 0).toLocaleString('de-DE')}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{s.stats.waffen.toLocaleString('de-DE')}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{s.stats.schild.toLocaleString('de-DE')}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{s.stats.panzerung.toLocaleString('de-DE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {state.missions.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Unterwegs</h3>
          {state.missions.map((m) => (
            <p key={m.id} style={{ fontSize: 13 }}>
              {m.sektorId}: {Object.entries(m.ships).map(([id, c]) => `${id} x${c}`).join(', ')}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
