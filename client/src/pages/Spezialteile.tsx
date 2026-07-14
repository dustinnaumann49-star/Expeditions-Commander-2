import { useGame } from '../context/GameContext';

export function SpezialteilePage() {
  const { gameData, state, buildImperator, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const ship = gameData.ships.find((s) => s.id === 'imperator');
  if (!ship || !ship.teileCost || !ship.maxCount) return <p>Daten fehlen.</p>;
  const cost = ship.teileCost;
  const bestand = state.fleet.imperator || 0;
  const buildingNow = state.buildQueue.some((j) => j.shipId === 'imperator');
  const canBuild = state.teile.waffen >= cost.waffen && state.teile.schild >= cost.schild && state.teile.panzerung >= cost.panzerung;
  const limitReached = bestand >= ship.maxCount;
  const pct = (val: number, max: number) => Math.min(100, Math.round((val / max) * 100));

  return (
    <div style={{ padding: 20 }}>
      <h2>Spezialteile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Inventar</h3>
      <p>
        Waffen-Teile: {Math.floor(state.teile.waffen)} / {cost.waffen} ({pct(state.teile.waffen, cost.waffen)}%)
      </p>
      <p>
        Schild-Teile: {Math.floor(state.teile.schild)} / {cost.schild} ({pct(state.teile.schild, cost.schild)}%)
      </p>
      <p>
        Panzerungs-Teile: {Math.floor(state.teile.panzerung)} / {cost.panzerung} ({pct(state.teile.panzerung, cost.panzerung)}%)
      </p>

      <div style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12, marginTop: 16, maxWidth: 400 }}>
        <h4>{ship.name}</h4>
        <p style={{ fontSize: 12, color: '#999' }}>
          Bestand: {bestand}/{ship.maxCount}
        </p>
        <p style={{ fontSize: 12 }}>
          Waffen: {ship.stats.waffen} / Schild: {ship.stats.schild} / Panzerung: {ship.stats.panzerung}
        </p>
        <p style={{ fontSize: 12, color: '#999' }}>
          Kosten: {cost.waffen} Waffen-Teile, {cost.schild} Schild-Teile, {cost.panzerung} Panzerungs-Teile
        </p>
        <p style={{ fontSize: 12, color: '#999' }}>Bauzeit: 1 Tag</p>
        <button disabled={!canBuild || buildingNow || limitReached} onClick={() => buildImperator()}>
          {buildingNow ? 'Wird gebaut...' : limitReached ? 'Limit erreicht' : 'Bauen'}
        </button>
      </div>
    </div>
  );
}
