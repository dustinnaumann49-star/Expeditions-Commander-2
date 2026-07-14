import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

export function ResourceBar() {
  const { state } = useGame();
  const { username, logout } = useAuth();
  if (!state) return null;

  const fmt = (n: number) => Math.floor(n).toLocaleString('de-DE');

  return (
    <div id="resourcebar">
      <div className="res-group">
        <span className="res-item">⛏️ Metall: {fmt(state.resources.metall)}</span>
        <span className="res-item">💎 Kristall: {fmt(state.resources.kristall)}</span>
        <span className="res-item">🌀 Deuterium: {fmt(state.resources.deuterium)}</span>
        <span className="res-item">🔮 Dunkle Materie: {fmt(state.resources.dm)}</span>
      </div>
      <div className="res-group">
        <span id="clock">{username}</span>
        <button id="reset-btn" onClick={logout}>
          Abmelden
        </button>
      </div>
    </div>
  );
}
