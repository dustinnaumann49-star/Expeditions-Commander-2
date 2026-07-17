import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { api } from '../api/client';
import type { LeaderboardEntry } from '../types/game';

export function StatistikPage() {
  const { state } = useGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getLeaderboard()
      .then((res) => {
        if (!cancelled) setLeaderboard(res.leaderboard);
      })
      .catch(() => {
        if (!cancelled) setError('Bestenliste konnte nicht geladen werden.');
      });
    const interval = setInterval(() => {
      api
        .getLeaderboard()
        .then((res) => {
          if (!cancelled) setLeaderboard(res.leaderboard);
        })
        .catch(() => {});
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!state) return <p>Lade...</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!leaderboard) return <p>Lade...</p>;

  const me = leaderboard.find((e) => e.userId === state.userId);

  const STAT_ROWS: [string, (s: LeaderboardEntry['stats']) => string | number][] = [
    ['🌑 Piraten-Sektor Niedrig – Siege', (s) => s.missionsNiedrig],
    ['🌒 Piraten-Sektor Mittel – Siege', (s) => s.missionsMittel],
    ['🌕 Piraten-Sektor Hoch – Siege', (s) => s.missionsHoch],
    ['⛏️ Asteroiden-Einsätze', (s) => s.asteroidMissions],
    ['🛡️ Elite-Bollwerk – gewonnene Stunden-Checks', (s) => s.eliteBollwerkChecks],
    ['🏠 Raids vollständig abgewehrt', (s) => s.raidsRepelledFull],
    ['🏚️ Raids teilweise abgewehrt', (s) => s.raidsRepelledPartial],
    ['📡 Notruf-Events geholfen', (s) => s.notrufCompleted],
    ['☠ Piratenkapitäne besiegt', (s) => s.captainsDefeated],
    ['💥 Feinde vernichtet', (s) => s.enemiesDestroyed.toLocaleString('de-DE')],
    ['💔 Eigene Schiffe verloren', (s) => s.ownShipsLost.toLocaleString('de-DE')],
    ['💰 Ressourcen erbeutet (gesamt)', (s) => s.resourcesLooted.toLocaleString('de-DE')],
    ['📦 Container geöffnet (Silber/Gold/Elite)', (s) => `${s.containersOpened.silber} / ${s.containersOpened.gold} / ${s.containersOpened.elite}`],
    ['🔬 Forschungen abgeschlossen', (s) => s.researchCompleted],
    ['🚀 Schiffe gebaut', (s) => s.shipsBuilt.toLocaleString('de-DE')],
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Statistik</h2>

      {me && (
        <div className="queue-box" style={{ marginBottom: 20, borderColor: 'var(--accent-kristall)' }}>
          <div className="queue-item" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Deine Statistik</span>
            <span style={{ color: 'var(--accent-kristall)', fontWeight: 700, fontSize: 16 }}>{me.points.toLocaleString('de-DE')} Punkte</span>
          </div>
          <div className="info-list">
            {STAT_ROWS.map(([label, fn]) => (
              <div className="info-list-row" key={label}>
                <span className="info-list-label">{label}</span>
                <span className="info-list-value">{fn(me.stats)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>🏆 Bestenliste</h3>
      <div className="queue-box">
        {leaderboard.map((entry, i) => (
          <div
            className="queue-item"
            key={entry.userId}
            style={{
              borderBottom: i === leaderboard.length - 1 ? 'none' : '1px solid var(--border)',
              color: entry.userId === state.userId ? 'var(--accent-kristall)' : undefined,
            }}
          >
            <span>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {entry.username}
              {entry.userId === state.userId ? ' (du)' : ''}
            </span>
            <span style={{ fontWeight: 600 }}>{entry.points.toLocaleString('de-DE')} Punkte</span>
          </div>
        ))}
      </div>
    </div>
  );
}
