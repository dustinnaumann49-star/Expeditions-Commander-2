import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { formatTime } from '../lib/format';
import { getGebaeudeBauzeitMultiplier, getEnergyProduced, getEnergyConsumed, getMineOutputPerHour } from '../lib/multipliers';
import type { BuildingDefinition, BuildingModuleDefinition, GameData, PlayerState } from '../types/game';

function buildingCostForLevel(building: BuildingDefinition, level: number) {
  const f = Math.pow(building.costGrowth, level - 1);
  return {
    metall: Math.round(building.baseCost.metall * f),
    kristall: Math.round(building.baseCost.kristall * f),
    deuterium: Math.round(building.baseCost.deuterium * f),
  };
}

function buildingTimeForLevel(building: BuildingDefinition, level: number, multiplier: number): number {
  return building.baseTimeSeconds * Math.pow(building.timeGrowth, level - 1) * 1000 * multiplier;
}

function moduleCostForLevel(mod: BuildingModuleDefinition, level: number) {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function moduleTimeForLevel(mod: BuildingModuleDefinition, level: number, multiplier: number): number {
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * multiplier;
}

// Kleine Verbindungslinie - gleiches Muster wie im Forschungsbaum (Forschung.tsx), komplett per
// Inline-Style (keine Abhaengigkeit von externen CSS-Klassen, siehe Punkt 65 Nachtrag zum
// urspruenglich fehlgeschlagenen CSS-Ansatz beim Forschungsbaum).
function VLine({ height = 16 }: { height?: number }) {
  return <div style={{ width: 1, height, background: 'var(--border-bright)' }} />;
}

function ModuleNode({
  mod,
  gameData,
  state,
  now,
  busy,
  onOpenInfo,
  onStart,
}: {
  mod: BuildingModuleDefinition;
  gameData: GameData;
  state: PlayerState;
  now: number;
  busy: boolean;
  onOpenInfo: (mod: BuildingModuleDefinition) => void;
  onStart: (moduleId: string) => void;
}) {
  const level = state.buildingModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const buildingLevel = state.buildings[mod.buildingId] || 0;
  const locked = buildingLevel < mod.requiredBuildingLevel;
  const activeJob = state.buildingQueue.find((j) => j.moduleId === mod.id);
  const building = gameData.buildings.find((b) => b.id === mod.buildingId);
  const nextLevel = level + 1;
  const bauzeitMult = getGebaeudeBauzeitMultiplier(gameData, state, mod.buildingId);
  const cost = !maxed && !locked ? moduleCostForLevel(mod, nextLevel) : null;
  const affordable =
    cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <VLine />
      <div
        style={{
          width: 108,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 8,
          background: 'rgba(36,38,43,0.4)',
          opacity: locked ? 0.5 : 1,
          filter: locked ? 'grayscale(0.7)' : 'none',
        }}
      >
        {building && (
          <img
            src={`/${building.img}`}
            alt={mod.name}
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, display: 'block' }}
          />
        )}
        <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{mod.name}</span>
        <span style={{ fontSize: 10, color: 'var(--accent-kristall)' }}>
          Stufe {level}/{mod.maxLevel}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="qty-btn" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => onOpenInfo(mod)}>
            ℹ️
          </button>
          {locked ? (
            <button
              className="qty-btn"
              style={{ fontSize: 10, padding: '2px 6px' }}
              disabled
              title={building ? `Erfordert ${building.name} Stufe ${mod.requiredBuildingLevel}` : undefined}
            >
              🔒
            </button>
          ) : maxed ? (
            <span style={{ fontSize: 10, color: 'var(--accent-deut)' }}>MAX</span>
          ) : activeJob ? (
            <span style={{ fontSize: 10, color: 'var(--accent-kristall)' }}>{formatTime(activeJob.endTime - now)}</span>
          ) : (
            <button className="build-btn" style={{ fontSize: 10, padding: '2px 7px' }} disabled={busy || !affordable} onClick={() => onStart(mod.id)}>
              Bauen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleInfoContent({ mod, gameData, state }: { mod: BuildingModuleDefinition; gameData: GameData; state: PlayerState }) {
  const level = state.buildingModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const nextLevel = level + 1;
  const bauzeitMult = getGebaeudeBauzeitMultiplier(gameData, state, mod.buildingId);
  const cost = !maxed ? moduleCostForLevel(mod, nextLevel) : null;
  const timeMs = !maxed ? moduleTimeForLevel(mod, nextLevel, bauzeitMult) : null;
  const building = gameData.buildings.find((b) => b.id === mod.buildingId);

  const kindLabel = {
    output: 'Ertrag/Ausstoß dieses Gebäudes',
    energy_reduction: 'Energieverbrauch dieses Gebäudes',
    buildtime_self: 'Bauzeit weiterer Ausbaustufen dieses Gebäudes',
    strengthen_factor: 'Stärke des bestehenden Bauzeit-Bonus (Roboter-/Nanitenfabrik)',
  }[mod.moduleKind];
  const isReduction = mod.moduleKind === 'energy_reduction' || mod.moduleKind === 'buildtime_self' || mod.moduleKind === 'strengthen_factor';

  const rows: [string, string][] = [
    ['Aktuelle Stufe', `${level} / ${mod.maxLevel}`],
    ['Wirkt auf', kindLabel],
    ['Effekt pro Stufe', `${isReduction ? '-' : '+'}${(mod.effectPerLevel * 100).toFixed(1)}%`],
    ['Voraussetzung', `${building?.name || mod.buildingId} Stufe ${mod.requiredBuildingLevel}`],
  ];
  if (cost) {
    rows.push([
      `Kosten Stufe ${nextLevel}`,
      `${cost.metall.toLocaleString('de-DE')} Metall, ${cost.kristall.toLocaleString('de-DE')} Kristall, ${cost.deuterium.toLocaleString('de-DE')} Deuterium`,
    ]);
  }
  if (timeMs) rows.push([`Bauzeit Stufe ${nextLevel}`, formatTime(timeMs)]);
  if (maxed) rows.push(['Status', 'Maximalstufe erreicht']);

  return (
    <>
      <InfoTable rows={rows} />
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginTop: 12 }}>{mod.lore}</p>
    </>
  );
}

export function GebaeudePage() {
  const { gameData, state, buildBuilding, buildModule, error } = useGame();
  const [, forceTick] = useState(0);
  const [loreTarget, setLoreTarget] = useState<{ kind: 'building'; id: string } | null>(null);
  const [infoBuildingId, setInfoBuildingId] = useState<string | null>(null);
  const [infoModule, setInfoModule] = useState<BuildingModuleDefinition | null>(null);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;

  const now = Date.now();
  const busy = state.buildingQueue.length >= gameData.maxBuildingSlots;
  const energyProduced = state.energyProduced ?? getEnergyProduced(gameData, state);
  const energyConsumed = state.energyConsumed ?? getEnergyConsumed(gameData, state);
  const energyDeficit = energyConsumed > energyProduced;
  const infoBuilding = infoBuildingId ? gameData.buildings.find((b) => b.id === infoBuildingId) : null;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Gebäude</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Bauplatz ({state.buildingQueue.length} von {gameData.maxBuildingSlots} belegt)
        </h3>
        <BuildQueue
          queue={state.buildingQueue}
          maxSlots={gameData.maxBuildingSlots}
          nameFor={(job) =>
            job.buildingId
              ? gameData.buildings.find((b) => b.id === job.buildingId)?.name || job.buildingId
              : gameData.buildingModules.find((m) => m.id === job.moduleId)?.name || job.moduleId!
          }
        />
      </div>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Energieversorgung</h3>
        <p style={{ fontSize: 13, color: energyDeficit ? 'var(--danger)' : 'var(--text-dim)' }}>
          Erzeugt: {Math.floor(energyProduced).toLocaleString('de-DE')} / Verbraucht: {Math.floor(energyConsumed).toLocaleString('de-DE')}
          {energyDeficit && ' – Energiedefizit: Minen produzieren gedrosselt!'}
        </p>
      </div>

      <div className="ship-grid">
        {gameData.buildings.map((building) => {
          const level = state.buildings[building.id] || 0;
          const nextLevel = level + 1;
          const cost = buildingCostForLevel(building, nextLevel);
          const bauzeitMult = getGebaeudeBauzeitMultiplier(gameData, state, building.id);
          const timeMs = buildingTimeForLevel(building, nextLevel, bauzeitMult);
          const affordable =
            state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;
          const isMine = building.kind.startsWith('mine_');
          const outputPerHour = isMine ? getMineOutputPerHour(gameData, state, building.id) : null;
          const modules = gameData.buildingModules.filter((m) => m.buildingId === building.id);

          return (
            <div key={building.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="ship-card" style={{ width: '100%' }}>
                <img
                  className="ship-img"
                  src={`/${building.img}`}
                  alt={building.name}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                <div className="ship-info">
                  <h3>
                    <span className="lore-title" onClick={() => setLoreTarget({ kind: 'building', id: building.id })}>
                      {building.name}
                    </span>{' '}
                    <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => setInfoBuildingId(building.id)}>
                      ℹ️ Info
                    </button>
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Stufe: {level}</p>

                  {outputPerHour !== null && (
                    <p style={{ fontSize: 12, color: 'var(--accent-deut)', marginBottom: 4 }}>
                      Ertrag: {Math.floor(outputPerHour).toLocaleString('de-DE')}/h
                    </p>
                  )}
                  {building.kind === 'energie' && (
                    <p style={{ fontSize: 12, color: 'var(--accent-deut)', marginBottom: 4 }}>
                      Energie: {Math.floor(energyProduced && level > 0 ? energyProduced : 0).toLocaleString('de-DE')}
                    </p>
                  )}

                  <div className="ship-cost" style={{ color: affordable ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
                    Kosten Stufe {nextLevel}: {cost.metall.toLocaleString('de-DE')} Metall, {cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                    {cost.deuterium.toLocaleString('de-DE')} Deuterium
                    {!affordable && ' – nicht genug Ressourcen!'}
                  </div>

                  <div className="build-row">
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(timeMs)}</span>
                    <button className="build-btn" disabled={!affordable || busy} onClick={() => buildBuilding(building.id)}>
                      Ausbauen
                    </button>
                  </div>
                  {busy && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Bauplatz belegt.</p>}
                </div>
              </div>

              {modules.length > 0 && (
                <>
                  <VLine height={16} />
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {modules.map((mod) => (
                      <ModuleNode
                        key={mod.id}
                        mod={mod}
                        gameData={gameData}
                        state={state}
                        now={now}
                        busy={busy}
                        onOpenInfo={setInfoModule}
                        onStart={buildModule}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {infoBuilding &&
        (() => {
          const level = state.buildings[infoBuilding.id] || 0;
          const rows: [string, React.ReactNode][] = [];
          if (infoBuilding.kind.startsWith('mine_')) {
            rows.push(['Basisertrag (Stufe 1)', `${(infoBuilding.baseOutput || 0).toLocaleString('de-DE')}/h`]);
            rows.push(['Energieverbrauch (Stufe 1)', `${(infoBuilding.baseEnergyUse || 0).toLocaleString('de-DE')}`]);
            rows.push(['Formel', 'Basisertrag × Stufe × 1,1^Stufe, gedrosselt bei Energiedefizit']);
          }
          if (infoBuilding.kind === 'energie') {
            rows.push(['Basisertrag (Stufe 1)', `${(infoBuilding.baseEnergyOutput || 0).toLocaleString('de-DE')} Energie`]);
            rows.push(['Formel', 'Basisertrag × Stufe × 1,1^Stufe']);
          }
          if (infoBuilding.kind === 'roboter') {
            rows.push(['Effekt', 'Verkürzt Bauzeit von Gebäuden um 25% pro Stufe (kompoundierend)']);
            rows.push(['Effekt', 'Verkürzt Bauzeit von Schiffen/Verteidigung um 1% pro Stufe (kompoundierend)']);
          }
          if (infoBuilding.kind === 'nanit') {
            rows.push(['Effekt', 'Verkürzt Bauzeit von Gebäuden um 50% pro Stufe (kompoundierend)']);
            rows.push(['Effekt', 'Verkürzt Bauzeit von Schiffen/Verteidigung um 2% pro Stufe (kompoundierend)']);
          }
          rows.push(['Aktuelle Stufe', `${level}`]);
          return (
            <InfoModal title={infoBuilding.name} onClose={() => setInfoBuildingId(null)}>
              <InfoTable rows={rows} />
            </InfoModal>
          );
        })()}

      {infoModule && (
        <InfoModal title={infoModule.name} onClose={() => setInfoModule(null)}>
          <ModuleInfoContent mod={infoModule} gameData={gameData} state={state} />
        </InfoModal>
      )}

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
