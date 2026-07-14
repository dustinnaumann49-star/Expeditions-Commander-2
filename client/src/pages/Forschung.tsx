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
    <div style={{ padding: 20 }}>
      <h2>Forschung</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p style={{ fontSize: 13, color: '#999' }}>
        Forschungslabor: {state.researchQueue.length} / {MAX_RESEARCH_SLOTS} gleichzeitig laufende Forschungen.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {gameData.research.map((tech) => {
          const level = state.research[tech.id] || 0;
          const maxed = level >= MAX_RESEARCH_LEVEL;
          const nextLevel = level + 1;
          const cost = maxed ? null : researchCostForLevel(tech.baseCost, tech.costGrowth, nextLevel);
          const activeJob = state.researchQueue.find((j) => j.techId === tech.id);
          const affordable =
            cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

          return (
            <div key={tech.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
              <h4>{tech.name}</h4>
              <p style={{ fontSize: 12, color: '#999' }}>
                Stufe {level} / {MAX_RESEARCH_LEVEL} · Effekt: +{(tech.effectPerLevel * 100).toFixed(0)}% pro Stufe
              </p>
              {maxed ? (
                <p style={{ color: '#7fd97f' }}>Maximalstufe erreicht</p>
              ) : activeJob ? (
                <p style={{ color: '#7fd9e0' }}>
                  Läuft... noch {Math.max(0, Math.round((activeJob.endTime - Date.now()) / 1000))}s
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    Kosten Stufe {nextLevel}: {cost!.metall.toLocaleString('de-DE')} Metall, {cost!.kristall.toLocaleString('de-DE')} Kristall,{' '}
                    {cost!.deuterium.toLocaleString('de-DE')} Deuterium
                  </p>
                  <button disabled={!affordable || busy} onClick={() => startResearch(tech.id)}>
                    Erforschen
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
