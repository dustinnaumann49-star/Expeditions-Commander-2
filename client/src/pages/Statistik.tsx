import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
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

  if (!state) return <PageSkeleton />;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!leaderboard) return <PageSkeleton />;

  const me = leaderboard.find((e) => e.userId === state.userId);

  // Statistik-Neugestaltung (Nutzerentscheidung 04.08.2026): nur noch punkte-relevante Werte -
  // Schiff/Verteidigungs- und Forschungs/Gebäude-Punkte kommen direkt vorberechnet vom Server
  // (siehe shipsDefensePoints/researchBuildingsPoints in stats.ts, ersetzt die vorherige
  // Gesamtmacht-basierte Punktzahl, die bei Kampfverlusten wieder sank). "Feinde vernichtet"
  // bewusst unverändert als Rohzähler (nicht als Punktzahl) belassen. Piraten-Sektor-Siege/Elite-
  // Bollwerk-Checks/Raid-Abwehr/Container/erbeutete Ressourcen/eigene Verluste sind nicht mehr Teil
  // der Punktzahl (siehe POINT_WEIGHTS-Kommentar in stats.ts) und daher hier entfernt.
  const STAT_ROWS: [string, (e: LeaderboardEntry) => string | number][] = [
    ['🚀🏰 Schiff/Verteidigungs-Punkte', (e) => e.shipsDefensePoints.toLocaleString('de-DE')],
    ['🔬🏗️ Forschungs/Gebäude-Punkte', (e) => e.researchBuildingsPoints.toLocaleString('de-DE')],
    ['💥 Zerstörte Piraten', (e) => e.stats.enemiesDestroyed.toLocaleString('de-DE')],
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
                <span className="info-list-value">{fn(me)}</span>
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
