import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { getEnergyProduced, getEnergyConsumed } from '../lib/multipliers';
import { useCountUp } from '../lib/useCountUp';

// Einzelner Ressourcen-Eintrag als eigene Komponente, damit useCountUp() sein eigenes
// "vorheriger Wert"-Gedaechtnis pro Ressource hat (ein gemeinsamer Hook auf Elternebene wuerde
// beim Aendern EINER Ressource alle gleichzeitig neu pulsen lassen).
function ResourceItem({ icon, alt, label, value }: { icon: string; alt: string; label: string; value: number }) {
  const { display, pulse } = useCountUp(value);
  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');
  return (
    <span className={`res-item${pulse ? ` res-pulse-${pulse}` : ''}`}>
      <img className="res-icon" src={icon} alt={alt} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      {label}: {fmt(display)}
    </span>
  );
}

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

  const ownRaid = state.raid;
  const otherRaidsCount = activeRaids.length;

  const energyProduced = state.energyProduced ?? (gameData ? getEnergyProduced(gameData, state) : 0);
  const energyConsumed = state.energyConsumed ?? (gameData ? getEnergyConsumed(gameData, state) : 0);
  const energyDeficit = energyConsumed > energyProduced;

  return (
    <div id="resourcebar">
      <div className="res-group">
        <ResourceItem icon="/resources/metall.png" alt="Metall" label="Metall" value={state.resources.metall} />
        <ResourceItem icon="/resources/kristall.png" alt="Kristall" label="Kristall" value={state.resources.kristall} />
        <ResourceItem icon="/resources/deuterium.png" alt="Deuterium" label="Deuterium" value={state.resources.deuterium} />
        <ResourceItem icon="/resources/dunkle_materie.png" alt="Dunkle Materie" label="Dunkle Materie" value={state.resources.dm} />
        <span className="res-item" style={energyDeficit ? { color: 'var(--danger)' } : undefined} title="Energie: Erzeugt/Verbraucht">
          ⚡ {fmt(energyProduced)}/{fmt(energyConsumed)}
        </span>
      </div>

      {(ownRaid || otherRaidsCount > 0) && (
        <div className="res-group" style={{ gap: 8 }}>
          {ownRaid && (
            <button className="alert-badge" onClick={() => navigate('/sektor')}>
              {now < ownRaid.arrivalTime
                ? `⚠ Raid im Anflug · ${formatTime(ownRaid.arrivalTime - now)}`
                : `⚠ Welle ${Math.min(ownRaid.wavesProcessed + 1, ownRaid.waveTimes.length)}/${ownRaid.waveTimes.length} · ${formatTime(
                    Math.max(0, (ownRaid.waveTimes[ownRaid.wavesProcessed] ?? now) - now)
                  )}`}
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
