import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';

// Verstärkung läuft seit der Galaxie-Erweiterung ausschließlich über "Halten" (Galaxie-Tab) - hier
// nur noch eine Übersicht/Navigation: wer wird gerade angegriffen, wo, und ein Klick springt zur
// passenden Position in der Galaxie-Ansicht (dort dann direkt auf die Basis klicken -> Flotte
// halten lassen, verteidigt automatisch bei jedem künftigen Raid).
export function RaidHilfePage() {
  const { activeRaids, error } = useGame();
  const navigate = useNavigate();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const now = serverNow();

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Raid-Hilfe</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Hier siehst du alle laufenden Piratenangriffe auf die Basen anderer Spieler. Verstärkung schickst du über die Galaxie-Ansicht: Position
        anklicken, dort auf die Basis klicken und deine Flotte "halten" lassen - sie verteidigt dann automatisch bei diesem und jedem künftigen
        Raid, bis du sie zurückrufst.
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {activeRaids.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Aktuell läuft kein Angriff auf eine andere Basis.</p>
      ) : (
        <div className="queue-box">
          {activeRaids.map((raid) => (
            <div key={raid.raidId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
              <p>
                <strong>{raid.targetUsername}</strong>
                {raid.targetPosition && (
                  <span style={{ color: 'var(--text-dim)' }}>
                    {' '}
                    (1:{raid.targetPosition.system}:{raid.targetPosition.position})
                  </span>
                )}{' '}
                wird angegriffen – Ankunft der Piraten in {formatTime(raid.arrivalTime - now)}
                {raid.holdingCount > 0 && ` · ${raid.holdingCount} Flotte(n) halten dort bereits`}
              </p>
              {raid.targetPosition && (
                <button
                  className="qty-btn"
                  onClick={() => navigate(`/galaxie?system=${raid.targetPosition!.system}&targetUserId=${raid.targetUserId}`)}
                >
                  Zur Position in der Galaxie
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
