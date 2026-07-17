import { useGame } from '../context/GameContext';

// Dieselbe Klassen-Einteilung wie in Werft.tsx (WERFT_KLASSEN) - fuer einen konsistenten,
// wiedererkennbaren Ueberblick. "spezial" faengt alles auf, was in keiner der Werft-Klassen baubar
// ist (aktuell nur der Imperator), damit auch der hier zuverlaessig auftaucht, statt zu fehlen.
const FLOTTE_KLASSEN = [
  { id: 'jaeger', name: 'Jäger-Klasse', ships: ['leicht', 'schwer', 'salvenjaeger'] },
  { id: 'kreuzer', name: 'Kreuzer-Klasse', ships: ['kreuzer', 'schlachtschiff', 'bomber', 'salvenkreuzer'] },
  { id: 'elite', name: 'Elite-Klasse', ships: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'salvendreadnought'] },
  { id: 'versorgung', name: 'Versorgungsschiffe', ships: ['mining', 'begleitschiff'] },
  { id: 'spezial', name: 'Spezialschiffe', ships: ['imperator'] },
];

export function FlottePage() {
  const { gameData, state } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const totalOwned = Object.values(state.fleet).reduce((a, b) => a + (b || 0), 0);

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Flotte (Bestand)</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Flotte: {totalOwned.toLocaleString('de-DE')} Schiffe</p>

      {totalOwned === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Noch keine Schiffe gebaut.</p>
      ) : (
        FLOTTE_KLASSEN.map((klasse) => {
          const owned = gameData.ships.filter((s) => klasse.ships.includes(s.id) && (state.fleet[s.id] || 0) > 0);
          if (owned.length === 0) return null;
          const klasseTotal = owned.reduce((sum, s) => sum + (state.fleet[s.id] || 0), 0);

          return (
            <div key={klasse.id} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                {klasse.name} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({klasseTotal.toLocaleString('de-DE')} Schiffe)</span>
              </h3>
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
            </div>
          );
        })
      )}
    </div>
  );
}
