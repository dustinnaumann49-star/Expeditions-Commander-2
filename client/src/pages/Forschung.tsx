import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { LoreModal } from '../components/LoreModal';

function researchCostForLevel(baseCost: { metall: number; kristall: number; deuterium: number }, costGrowth: number, level: number) {
  const f = Math.pow(costGrowth, level - 1);
  return {
    metall: Math.round(baseCost.metall * f),
    kristall: Math.round(baseCost.kristall * f),
    deuterium: Math.round(baseCost.deuterium * f),
  };
}

function researchTimeForLevel(baseTimeHours: number, timeGrowth: number, level: number): number {
  return baseTimeHours * Math.pow(timeGrowth, level - 1) * 3600 * 1000;
}

export function ForschungPage() {
  const { gameData, state, startResearch, error } = useGame();
  const [, forceTick] = useState(0);
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;

  const busy = state.researchQueue.length >= gameData.maxResearchSlots;
  const now = serverNow();

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Forschung</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Forschungslabor: {state.researchQueue.length} / {gameData.maxResearchSlots} gleichzeitig laufende Forschungen.
      </p>

      <div className="ship-grid">
        {gameData.research.map((tech) => {
          const level = state.research[tech.id] || 0;
          const maxed = level >= gameData.maxResearchLevel;
          const nextLevel = level + 1;
          const cost = maxed ? null : researchCostForLevel(tech.baseCost, tech.costGrowth, nextLevel);
          const timeMs = maxed ? null : researchTimeForLevel(tech.baseTimeHours, tech.timeGrowth, nextLevel);
          const activeJob = state.researchQueue.find((j) => j.techId === tech.id);
          const affordable =
            cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

          return (
            <div className="ship-card" key={tech.id}>
              <img className="ship-img" src={`/${tech.img}`} alt={tech.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'research', id: tech.id })}>
                    {tech.name}
                  </span>
                </h3>
                <div className="ship-stats">
                  <span>
                    Stufe {level} / {gameData.maxResearchLevel}
                  </span>
                  <span>Effekt: +{(tech.effectPerLevel * 100).toFixed(0)}% pro Stufe</span>
                </div>

                {maxed ? (
                  <p className="level-gruen">Maximalstufe erreicht</p>
                ) : activeJob ? (
                  <>
                    <div className="progress-row">
                      <span>Läuft...</span>
                      <span>{Math.min(100, Math.max(0, ((now - activeJob.startTime) / (activeJob.endTime - activeJob.startTime)) * 100)).toFixed(0)}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, Math.max(0, ((now - activeJob.startTime) / (activeJob.endTime - activeJob.startTime)) * 100))}%` }}
                      />
                    </div>
                    <span style={{ color: 'var(--accent-kristall)', fontSize: 13 }}>Noch: {formatTime(activeJob.endTime - now)}</span>
                  </>
                ) : (
                  <>
                    <div className="ship-cost">
                      Kosten Stufe {nextLevel}: {cost!.metall.toLocaleString('de-DE')} Metall, {cost!.kristall.toLocaleString('de-DE')} Kristall,{' '}
                      {cost!.deuterium.toLocaleString('de-DE')} Deuterium
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Forschungszeit: {formatTime(timeMs!)}</div>
                    <button className="build-btn" disabled={!affordable || busy} onClick={() => startResearch(tech.id)}>
                      Erforschen
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
