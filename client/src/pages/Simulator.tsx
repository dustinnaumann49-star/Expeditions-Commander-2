import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { api } from '../api/client';
import type { SimulationResult } from '../types/game';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'imperator', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];

function ratingColor(winRate: number): string {
  if (winRate >= 70) return 'level-gruen';
  if (winRate >= 30) return 'level-gelb';
  return 'level-rot';
}

function ratingText(sim: SimulationResult): string {
  if (sim.winRate >= 90) return 'Sehr sicher – klarer Sieg zu erwarten';
  if (sim.winRate >= 70) return 'Gut machbar – Sieg wahrscheinlich';
  if (sim.winRate >= 30) return 'Riskant – Ausgang ungewiss';
  if (sim.wipeRate > 30) return 'Sehr gefährlich – hohes Totalverlust-Risiko';
  return 'Aussichtslos – Rückzug oder Verlust zu erwarten';
}

export function SimulatorView() {
  const { gameData, state } = useGame();
  const [sektorId, setSektorId] = useState('piraten_niedrig');
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  if (!gameData || !state) return <PageSkeleton />;

  const piratenSektoren = gameData.sektoren.filter((s) => s.id.startsWith('piraten_'));
  const availableShips = gameData.ships.filter((s) => COMBAT_SHIP_IDS.includes(s.id));
  const totalSelected = Object.values(selection).reduce((a, b) => a + (b || 0), 0);

  async function runSimulation() {
    setRunning(true);
    setSimError(null);
    setResult(null);
    try {
      const res = await api.simulateCombat(sektorId, selection);
      setResult(res.simulation);
    } catch (e: any) {
      setSimError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="queue-box" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Der Simulator rechnet mehrere Kampfdurchläufe mit deiner aktuellen Forschung durch – <strong>ohne echte Verluste</strong>. Dein
          Spielstand bleibt völlig unberührt. Du kannst auch Schiffe eintragen, die du noch gar nicht besitzt, um zu planen, was du bauen
          müsstest.
        </p>
      </div>

      <div className="queue-box" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Sektor wählen</h3>
        <div className="qty-row">
          {piratenSektoren.map((s) => (
            <button key={s.id} className={`qty-btn${sektorId === s.id ? ' active' : ''}`} onClick={() => setSektorId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="queue-box" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Flotte zusammenstellen ({totalSelected} Schiffe)</h3>
        {availableShips.map((ship) => {
          const owned = state.fleet[ship.id] || 0;
          const qty = selection[ship.id] || 0;
          return (
            <div className="queue-item" key={ship.id}>
              <span>
                {ship.name} <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>(im Bestand: {owned})</span>
              </span>
              <span className="qty-row">
                <input
                  className="qty-input"
                  style={{ width: 90 }}
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setSelection((p) => ({ ...p, [ship.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
                {owned > 0 && (
                  <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [ship.id]: owned }))}>
                    Alle ({owned})
                  </button>
                )}
              </span>
            </div>
          );
        })}
        <div className="build-row" style={{ marginTop: 10 }}>
          <button className="qty-btn" onClick={() => setSelection({})}>
            Zurücksetzen
          </button>
          <button className="build-btn" disabled={totalSelected === 0 || running} onClick={runSimulation}>
            {running ? 'Simuliere...' : 'Simulation starten'}
          </button>
        </div>
      </div>

      {simError && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{simError}</p>}

      {running && (
        <div className="queue-box">
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Rechne mehrere Kampfdurchläufe durch – einen Moment...</p>
        </div>
      )}

      {result && !running && (
        <div className="queue-box">
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Ergebnis ({result.runs} Durchläufe)</h3>
          <p className={ratingColor(result.winRate)} style={{ fontSize: 15, marginBottom: 12 }}>
            {ratingText(result)}
          </p>

          <table className="combat-table" style={{ marginBottom: 16 }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left' }}>Siegchance (alle Feinde vernichtet)</td>
                <td style={{ textAlign: 'right' }} className={ratingColor(result.winRate)}>
                  {result.winRate}%
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}>Endet im Rückzug</td>
                <td style={{ textAlign: 'right' }}>{result.retreatRate}%</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}>Totalverlust der Flotte</td>
                <td style={{ textAlign: 'right' }} className={result.wipeRate > 0 ? 'level-rot' : ''}>
                  {result.wipeRate}%
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}>Eigene Verluste (Durchschnitt)</td>
                <td style={{ textAlign: 'right' }}>
                  {result.avgLossPercent}% <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    (bester Fall {result.bestLossPercent}%, schlimmster {result.worstLossPercent}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left' }}>Kampfdauer (Durchschnitt)</td>
                <td style={{ textAlign: 'right' }}>{result.avgRounds} Runden</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Durchschnittliche Verluste je Schiffstyp</p>
          <table className="combat-table" style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Schiff</th>
                <th>Eingesetzt</th>
                <th>Verlust (Ø)</th>
                <th>Verlust %</th>
              </tr>
            </thead>
            <tbody>
              {result.avgLossesByShip.map((s) => {
                const pct = s.sent > 0 ? Math.round((s.avgLost / s.sent) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'left' }}>{s.name}</td>
                    <td>{s.sent}</td>
                    <td className={s.avgLost > 0 ? 'level-rot' : 'level-gruen'}>{s.avgLost}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Beispiel-Gegnerflotte (variiert pro Kampf)</p>
          <table className="combat-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Einheit</th>
                <th>Anzahl</th>
              </tr>
            </thead>
            <tbody>
              {result.exampleNpcFleet.map((n) => (
                <tr key={n.id}>
                  <td style={{ textAlign: 'left' }}>{n.name}</td>
                  <td>{n.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
