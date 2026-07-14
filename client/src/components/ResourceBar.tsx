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
        <span className="res-item">
          <img className="res-icon" src="/resources/metall.png" alt="Metall" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          Metall: {fmt(state.resources.metall)}
        </span>
        <span className="res-item">
          <img className="res-icon" src="/resources/kristall.png" alt="Kristall" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          Kristall: {fmt(state.resources.kristall)}
        </span>
        <span className="res-item">
          <img className="res-icon" src="/resources/deuterium.png" alt="Deuterium" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          Deuterium: {fmt(state.resources.deuterium)}
        </span>
        <span className="res-item">
          <img
            className="res-icon"
            src="/resources/dunkle_materie.png"
            alt="Dunkle Materie"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          Dunkle Materie: {fmt(state.resources.dm)}
        </span>
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
