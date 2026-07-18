import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { getEnergyProduced, getEnergyConsumed } from '../lib/multipliers';

export function ResourceBar() {
  const { state, gameData, activeRaids } = useGame();
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!state) return null;

  const fmt = (n: number) => Math.floor(n).toLocaleString('de-DE');
  const clockText = new Date(serverNow()).toLocaleTimeString('de-DE');
  const now = serverNow();

  const ownRaid = state.raid && !state.raid.resolved ? state.raid : null;
  const ownEvent = state.event && !state.event.started ? state.event : null;
  const otherRaidsCount = activeRaids.length;

  const energyProduced = state.energyProduced ?? (gameData ? getEnergyProduced(gameData, state) : 0);
  const energyConsumed = state.energyConsumed ?? (gameData ? getEnergyConsumed(gameData, state) : 0);
  const energyDeficit = energyConsumed > energyProduced;

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
        <span className="res-item" style={energyDeficit ? { color: 'var(--danger)' } : undefined} title="Energie: Erzeugt/Verbraucht">
          ⚡ {fmt(energyProduced)}/{fmt(energyConsumed)}
        </span>
      </div>

      {(ownRaid || ownEvent || otherRaidsCount > 0) && (
        <div className="res-group" style={{ gap: 8 }}>
          {ownRaid && (
            <button className="alert-badge" onClick={() => navigate('/sektor')}>
              ⚠ Raid im Anflug · {formatTime(ownRaid.arrivalTime - now)}
            </button>
          )}
          {ownEvent && (
            <button className="alert-badge" onClick={() => navigate('/sektor')}>
              📡 Notruf aktiv
            </button>
          )}
          {otherRaidsCount > 0 && (
            <button className="alert-badge" onClick={() => navigate('/multiplayer?tab=raid')}>
              🛡️ {otherRaidsCount === 1 ? `Raid bei ${activeRaids[0].targetUsername}` : `${otherRaidsCount} Raids bei Mitspielern`}
            </button>
          )}
        </div>
      )}

      <div className="res-group">
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{username}</span>
        <span id="clock">{clockText}</span>
        <button id="reset-btn" onClick={logout}>
          Abmelden
        </button>
      </div>
    </div>
  );
}
