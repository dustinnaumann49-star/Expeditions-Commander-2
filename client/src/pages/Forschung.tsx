import { useGame } from '../context/GameContext';

function researchCostForLevel(baseCost: { metall: number; kristall: number; deuterium: number }, costGrowth: number, level: number) {
  const f = Math.pow(costGrowth, level - 1);
  return {
    metall: Math.round(baseCost.metall * f),
    kristall: Math.round(baseCost.kristall * f),
    deuterium: Math.round(baseCost.deuterium * f),
  };
}

const MAX_RESEARCH_LEVEL = 10;
const MAX_RESEARCH_SLOTS = 2;

export function ForschungPage() {
  const { gameData, state, startResearch, error } = useGame();
  if (!gameData || !state) return <p>Lade...</p>;

  const busy = state.researchQueue.length >= MAX_RESEARCH_SLOTS;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Forschung</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Forschungslabor: {state.researchQueue.length} / {MAX_RESEARCH_SLOTS} gleichzeitig laufende Forschungen.
      </p>

      <div className="ship-grid">
        {gameData.research.map((tech) => {
          const level = state.research[tech.id] || 0;
          const maxed = level >= MAX_RESEARCH_LEVEL;
          const nextLevel = level + 1;
          const cost = maxed ? null : researchCostForLevel(tech.baseCost, tech.costGrowth, nextLevel);
          const activeJob = state.researchQueue.find((j) => j.techId === tech.id);
          const affordable =
            cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

          return (
            <div className="ship-card" key={tech.id}>
              <img className="ship-img" src={`/${tech.img}`} alt={tech.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>{tech.name}</h3>
                <div className="ship-stats">
                  <span>
                    Stufe {level} / {MAX_RESEARCH_LEVEL}
                  </span>
                  <span>+{(tech.effectPerLevel * 100).toFixed(0)}% pro Stufe</span>
                </div>
                {maxed ? (
                  <p className="level-gruen">Maximalstufe erreicht</p>
                ) : activeJob ? (
                  <p style={{ color: 'var(--accent-kristall)' }}>Läuft... noch {Math.max(0, Math.round((activeJob.endTime - Date.now()) / 1000))}s</p>
                ) : (
                  <>
                    <div className="ship-cost">
                      Kosten Stufe {nextLevel}: {cost!.metall.toLocaleString('de-DE')} Metall, {cost!.kristall.toLocaleString('de-DE')} Kristall,{' '}
                      {cost!.deuterium.toLocaleString('de-DE')} Deuterium
                    </div>
                    <div className="build-row">
                      <span></span>
                      <button className="build-btn" disabled={!affordable || busy} onClick={() => startResearch(tech.id)}>
                        Erforschen
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
