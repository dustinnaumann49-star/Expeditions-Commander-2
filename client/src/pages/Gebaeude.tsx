import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { formatTime } from '../lib/format';
import { getGebaeudeBauzeitMultiplier, getEnergyProduced, getEnergyConsumed, getMineOutputPerHour } from '../lib/multipliers';
import type { BuildingDefinition } from '../types/game';

const RESOURCE_LABELS: Record<string, string> = { metall: 'Metall', kristall: 'Kristall', deuterium: 'Deuterium' };

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

export function GebaeudePage() {
  const { gameData, state, buildBuilding, error } = useGame();
  const [, forceTick] = useState(0);
  const [loreTarget, setLoreTarget] = useState<{ kind: 'building'; id: string } | null>(null);
  const [infoBuildingId, setInfoBuildingId] = useState<string | null>(null);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;

  const bauzeitMult = getGebaeudeBauzeitMultiplier(gameData, state);
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
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Bauplatz ({state.buildingQueue.length} von {gameData.maxBuildingSlots} belegt)</h3>
        <BuildQueue
          queue={state.buildingQueue}
          maxSlots={gameData.maxBuildingSlots}
          nameFor={(job) => gameData.buildings.find((b) => b.id === job.buildingId)?.name || job.buildingId!}
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
          const timeMs = buildingTimeForLevel(building, nextLevel, bauzeitMult);
          const affordable =
            state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;
          const isMine = building.kind.startsWith('mine_');
          const outputPerHour = isMine ? getMineOutputPerHour(gameData, state, building.id) : null;

          return (
            <div className="ship-card" key={building.id}>
              <img className="ship-img" src={`/${building.img}`} alt={building.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
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

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
