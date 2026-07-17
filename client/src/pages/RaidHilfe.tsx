import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];

export function RaidHilfePage() {
  const { state, activeRaids, reinforceRaid, error } = useGame();
  const [openFor, setOpenFor] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!state) return <p>Lade...</p>;
  const now = serverNow();

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Raid-Hilfe</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Hier siehst du alle laufenden Piratenangriffe auf die Basen anderer Spieler. Anflugzeit deiner Verstärkung: 1 Minute.
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {activeRaids.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>Aktuell läuft kein Angriff auf eine andere Basis.</p>
      ) : (
        <div className="queue-box">
          {activeRaids.map((raid) => {
            const timeLeft = raid.arrivalTime - now;
            const canStillHelp = timeLeft > 60000; // Verstaerkung braucht selbst 1 Minute, danach zu spaet
            return (
              <div key={raid.raidId} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <p>
                  <strong>{raid.targetUsername}</strong> wird angegriffen – Ankunft der Piraten in {formatTime(timeLeft)}
                  {raid.reinforcementCount > 0 && ` · ${raid.reinforcementCount} Verstärkung(en) bereits unterwegs`}
                </p>
                {!canStillHelp ? (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Zu spät - deine Flotte würde nicht mehr rechtzeitig ankommen.</p>
                ) : openFor === raid.targetUserId ? (
                  <>
                    {COMBAT_SHIP_IDS.map((id) => {
                      const avail = state.fleet[id] || 0;
                      if (avail === 0) return null;
                      const qty = selection[id] || 0;
                      return (
                        <div className="queue-item" key={id}>
                          <span>
                            {id} (verfügbar: {avail})
                          </span>
                          <span className="qty-row">
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>
                              -10
                            </button>
                            <span style={{ padding: '0 6px' }}>{qty}</span>
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.min(avail, (p[id] || 0) + 10) }))}>
                              +10
                            </button>
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: avail }))}>
                              Alle
                            </button>
                          </span>
                        </div>
                      );
                    })}
                    <div className="build-row">
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setOpenFor(null);
                          setSelection({});
                        }}
                      >
                        Abbrechen
                      </button>
                      <button
                        className="build-btn"
                        onClick={() => {
                          reinforceRaid(raid.targetUserId, selection);
                          setOpenFor(null);
                          setSelection({});
                        }}
                      >
                        Verstärkung entsenden
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="build-btn" onClick={() => setOpenFor(raid.targetUserId)}>
                    Zur Verteidigung entsenden
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
