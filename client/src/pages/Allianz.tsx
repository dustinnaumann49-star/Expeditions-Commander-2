import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { formatTime } from '../lib/format';
import { serverNow } from '../lib/serverTime';
import type { BuildingModuleDefinition, GameData, Station, StationBuildingDefinition } from '../types/game';

function stationBuildingCostForLevel(building: StationBuildingDefinition, level: number) {
  const f = Math.pow(building.costGrowth, level - 1);
  return {
    metall: Math.round(building.baseCost.metall * f),
    kristall: Math.round(building.baseCost.kristall * f),
    deuterium: Math.round(building.baseCost.deuterium * f),
  };
}

function stationModuleCostForLevel(mod: { baseCost: { metall: number; kristall: number; deuterium: number }; costGrowth: number }, level: number) {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

// Spiegelt server/src/game/stations.ts 1:1 (README Punkt 1 gilt analog auch hier - jede
// Zeit-/Ertrags-Anzeige im Client MUSS dieselbe Formel wie der Server nutzen). Die Station hat
// bewusst KEINE Kopplung an Spieler-Forschung/-Klasse/-Booster, daher braucht es hier - anders
// als lib/multipliers.ts fuer die Heimatbasis - keinen PlayerState-Parameter.
function stationLevelScaledValue(base: number, level: number): number {
  return level > 0 ? base * level * Math.pow(1.1, level) : 0;
}
function stationModuleLevel(station: Station, moduleId: string): number {
  return station.buildingModules[moduleId] || 0;
}
function stationModuleBoostFactor(gameData: GameData, station: Station, moduleId: string): number {
  const mod = gameData.stationBuildingModules.find((m) => m.id === moduleId);
  if (!mod) return 1;
  return 1 + stationModuleLevel(station, moduleId) * mod.effectPerLevel;
}
function stationModuleReductionFactor(gameData: GameData, station: Station, moduleId: string): number {
  const mod = gameData.stationBuildingModules.find((m) => m.id === moduleId);
  if (!mod) return 1;
  return Math.max(0.5, 1 - stationModuleLevel(station, moduleId) * mod.effectPerLevel);
}
function stationOutputModuleId(b: StationBuildingDefinition): string {
  return b.kind === 'energie' ? `${b.id}_ertragssteigerung` : `${b.id}_foerdereffizienz`;
}
function stationEnergyReductionModuleId(b: StationBuildingDefinition): string {
  return `${b.id}_energiesparmodul`;
}
function stationTimeModuleId(b: StationBuildingDefinition): string {
  if (b.kind === 'energie') return `${b.id}_wartungsoptimierung`;
  if (b.kind === 'roboter' || b.kind === 'nanit') return `${b.id}_wartungsfreiheit`;
  return `${b.id}_automatisierung`;
}
function stationStrengthenModuleId(b: StationBuildingDefinition): string {
  return `${b.id}_verstaerkte_automatisierung`;
}
const TIER_MINE_KINDS = ['mine_metall', 'mine_kristall', 'mine_deuterium'];

function stationEnergyForTier(gameData: GameData, station: Station, tier: 1 | 2 | 3): { produced: number; consumed: number } {
  const tierBuildings = gameData.stationBuildings.filter((b) => b.tier === tier);
  const solar = tierBuildings.find((b) => b.kind === 'energie');
  const produced = solar
    ? stationLevelScaledValue(solar.baseEnergyOutput || 0, station.buildings[solar.id] || 0) * stationModuleBoostFactor(gameData, station, stationOutputModuleId(solar))
    : 0;
  let consumed = 0;
  tierBuildings.forEach((b) => {
    if (TIER_MINE_KINDS.includes(b.kind)) {
      const base = stationLevelScaledValue(b.baseEnergyUse || 0, station.buildings[b.id] || 0);
      consumed += base * stationModuleReductionFactor(gameData, station, stationEnergyReductionModuleId(b));
    }
  });
  return { produced, consumed };
}
function stationEnergyFactorForTier(gameData: GameData, station: Station, tier: 1 | 2 | 3): number {
  const { produced, consumed } = stationEnergyForTier(gameData, station, tier);
  if (consumed <= 0) return 1;
  return Math.min(1, produced / consumed);
}
function stationMineOutputPerHour(gameData: GameData, station: Station, b: StationBuildingDefinition): number {
  if (!b.baseOutput) return 0;
  const base = stationLevelScaledValue(b.baseOutput, station.buildings[b.id] || 0);
  const moduleFactor = stationModuleBoostFactor(gameData, station, stationOutputModuleId(b));
  return base * moduleFactor * stationEnergyFactorForTier(gameData, station, b.tier);
}
function stationBauzeitFactorForTier(gameData: GameData, station: Station, tier: 1 | 2 | 3): number {
  const tierBuildings = gameData.stationBuildings.filter((b) => b.tier === tier);
  const roboter = tierBuildings.find((b) => b.kind === 'roboter');
  const nanit = tierBuildings.find((b) => b.kind === 'nanit');
  const roboterLevel = roboter ? station.buildings[roboter.id] || 0 : 0;
  const nanitLevel = nanit ? station.buildings[nanit.id] || 0 : 0;
  let factor = Math.pow(0.75, roboterLevel) * Math.pow(0.5, nanitLevel);
  if (roboter) factor *= stationModuleReductionFactor(gameData, station, stationStrengthenModuleId(roboter));
  if (nanit) factor *= stationModuleReductionFactor(gameData, station, stationStrengthenModuleId(nanit));
  return factor;
}
function stationBuildingTimeMs(gameData: GameData, station: Station, b: StationBuildingDefinition, level: number): number {
  const base = b.baseTimeSeconds * Math.pow(b.timeGrowth, level - 1) * 1000;
  return base * stationBauzeitFactorForTier(gameData, station, b.tier) * stationModuleReductionFactor(gameData, station, stationTimeModuleId(b));
}
function stationModuleTimeMs(gameData: GameData, station: Station, mod: BuildingModuleDefinition, level: number): number {
  const base = mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000;
  const building = gameData.stationBuildings.find((b) => b.id === mod.buildingId);
  return base * (building ? stationBauzeitFactorForTier(gameData, station, building.tier) : 1);
}

const BUILDING_ICON: Record<string, string> = { mine_metall: '⛏️', mine_kristall: '💎', mine_deuterium: '🧪', energie: '☀️', roboter: '🤖', nanit: '🔬' };

// Allianz-Station (siehe README, .claude/plans/tranquil-forging-pretzel.md): kooperatives
// Gemeinschafts-Feature zwischen genau den registrierten Spielern - kein Allianz-Browser noetig,
// ein Nutzer ist entweder Mitglied/eingeladen (dann liefert GET /alliance die eine Allianz) oder
// in keiner. Diese Seite deckt bisher nur Gruenden/Einladen/Annehmen ab (Phase 1) - Station selbst
// folgt in einem spaeteren Schritt.
export function AllianzPage() {
  const {
    gameData,
    state,
    users,
    error,
    alliance,
    station,
    createAlliance,
    inviteToAlliance,
    respondToAllianceInvite,
    foundStation,
    buildStationBuilding,
    buildStationModule,
    depositToStation,
    withdrawFromStation,
  } = useGame();
  const [name, setName] = useState('');
  const [inviteUserId, setInviteUserId] = useState<number | null>(null);
  const [foundSystem, setFoundSystem] = useState('');
  const [foundPosition, setFoundPosition] = useState('');
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);
  const [transferResource, setTransferResource] = useState<'metall' | 'kristall' | 'deuterium'>('metall');
  const [transferAmount, setTransferAmount] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <PageSkeleton />;
  const myUserId = state.userId;
  const now = serverNow();

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Allianz</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {!alliance ? (
        <div className="queue-box" style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Allianz gründen</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
            Gründe eine Allianz und lade einen anderen Spieler ein - gemeinsam könnt ihr danach eine Raumstation in der Galaxie bauen, auf der ihr
            Ressourcen gemeinsam lagert und untereinander aufteilt.
          </p>
          <div className="qty-row">
            <input className="qty-input" placeholder="Name der Allianz" value={name} onChange={(e) => setName(e.target.value)} />
            <button
              className="build-btn"
              onClick={() => {
                createAlliance(name);
                setName('');
              }}
            >
              Gründen
            </button>
          </div>
        </div>
      ) : (
        (() => {
          const me = alliance.members.find((m) => m.userId === myUserId);
          if (me && me.status === 'pending') {
            return (
              <div className="queue-box" style={{ maxWidth: 480, borderColor: 'var(--accent-kristall)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 8 }}>Einladung: {alliance.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
                  {alliance.members.find((m) => m.isCreator)?.username} hat dich in die Allianz "{alliance.name}" eingeladen.
                </p>
                <div className="build-row">
                  <button className="qty-btn" onClick={() => respondToAllianceInvite(alliance.id, false)}>
                    Ablehnen
                  </button>
                  <button className="build-btn" onClick={() => respondToAllianceInvite(alliance.id, true)}>
                    Annehmen
                  </button>
                </div>
              </div>
            );
          }

          const isCreator = alliance.creatorId === myUserId;
          const invitableUsers = users.filter((u) => u.id !== myUserId && !alliance.members.some((m) => m.userId === u.id));

          return (
            <div>
              <div className="queue-box" style={{ maxWidth: 480, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, marginBottom: 8 }}>🚩 {alliance.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Mitglieder:{' '}
                  {alliance.members.map((m, i) => (
                    <span key={m.userId}>
                      {i > 0 && ', '}
                      <strong style={{ color: 'var(--accent-kristall)' }}>{m.username}</strong>
                      {m.status === 'pending' && ' (eingeladen)'}
                    </span>
                  ))}
                </p>
                {isCreator && (
                  <div className="qty-row" style={{ marginTop: 8 }}>
                    <select className="qty-input" value={inviteUserId ?? ''} onChange={(e) => setInviteUserId(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Spieler auswählen...</option>
                      {invitableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                    <button
                      className="qty-btn"
                      disabled={inviteUserId === null}
                      onClick={() => {
                        if (inviteUserId !== null) inviteToAlliance(inviteUserId);
                        setInviteUserId(null);
                      }}
                    >
                      Einladen
                    </button>
                  </div>
                )}
                {invitableUsers.length === 0 && isCreator && (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>Keine weiteren Spieler zum Einladen verfügbar.</p>
                )}
              </div>

              {!station && (
                <div className="queue-box" style={{ maxWidth: 480 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 8 }}>Raumstation</h3>
                  {isCreator ? (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
                        Wähle eine freie Galaxie-Position (1-{gameData.galaxySystems} : 1-9) für eure gemeinsame Station.
                      </p>
                      <div className="qty-row">
                        <input
                          className="qty-input"
                          style={{ maxWidth: 90 }}
                          type="number"
                          min={1}
                          max={gameData.galaxySystems}
                          placeholder="System"
                          value={foundSystem}
                          onChange={(e) => setFoundSystem(e.target.value)}
                        />
                        <input
                          className="qty-input"
                          style={{ maxWidth: 90 }}
                          type="number"
                          min={1}
                          max={9}
                          placeholder="Position"
                          value={foundPosition}
                          onChange={(e) => setFoundPosition(e.target.value)}
                        />
                        <button
                          className="build-btn"
                          disabled={!foundSystem || !foundPosition}
                          onClick={() => {
                            foundStation(Number(foundSystem), Number(foundPosition));
                            setFoundSystem('');
                            setFoundPosition('');
                          }}
                        >
                          Station gründen
                        </button>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Noch keine Station gegründet - nur der Ersteller kann das.</p>
                  )}
                </div>
              )}

              {station && (
                <div>
                  <div className="queue-box" style={{ maxWidth: 480, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, marginBottom: 8 }}>🛰️ Station</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>
                      📍 Position 1:{station.position.system}:{station.position.position}
                    </p>
                    <p style={{ fontSize: 13, marginBottom: 8 }}>
                      Lager: {Math.floor(station.resources.metall).toLocaleString('de-DE')} Metall /{' '}
                      {Math.floor(station.resources.kristall).toLocaleString('de-DE')} Kristall /{' '}
                      {Math.floor(station.resources.deuterium).toLocaleString('de-DE')} Deuterium
                    </p>
                    <div className="qty-row">
                      <select className="qty-input" value={transferResource} onChange={(e) => setTransferResource(e.target.value as typeof transferResource)}>
                        <option value="metall">Metall</option>
                        <option value="kristall">Kristall</option>
                        <option value="deuterium">Deuterium</option>
                      </select>
                      <input
                        className="qty-input"
                        style={{ maxWidth: 110 }}
                        type="number"
                        min={1}
                        placeholder="Menge"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                      <button
                        className="qty-btn"
                        disabled={!transferAmount || Number(transferAmount) <= 0}
                        onClick={() => {
                          depositToStation(station.id, transferResource, Number(transferAmount));
                          setTransferAmount('');
                        }}
                      >
                        Einzahlen
                      </button>
                      <button
                        className="qty-btn"
                        disabled={!transferAmount || Number(transferAmount) <= 0}
                        onClick={() => {
                          withdrawFromStation(station.id, transferResource, Number(transferAmount));
                          setTransferAmount('');
                        }}
                      >
                        Abheben
                      </button>
                    </div>
                  </div>

                  {station.buildLog.length > 0 && (
                    <div className="queue-box" style={{ maxWidth: 480, marginBottom: 16 }}>
                      <h3 style={{ fontSize: 14, marginBottom: 8 }}>📜 Bau-Verlauf</h3>
                      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {station.buildLog.map((entry, i) => {
                          const name = entry.buildingId
                            ? gameData.stationBuildings.find((b) => b.id === entry.buildingId)?.name || entry.buildingId
                            : gameData.stationBuildingModules.find((m) => m.id === entry.moduleId)?.name || entry.moduleId;
                          return (
                            <p key={i} style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              <strong style={{ color: 'var(--text)' }}>{entry.username}</strong> · {name} → Stufe {entry.level} ·{' '}
                              {new Date(entry.completedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="build-row" style={{ marginBottom: 12 }}>
                    {([1, 2, 3] as const).map((tier) => {
                      const locked = tier > station.tier;
                      return (
                        <button
                          key={tier}
                          className={selectedTier === tier ? 'build-btn' : 'qty-btn'}
                          disabled={locked}
                          onClick={() => setSelectedTier(tier)}
                          title={locked ? `Erst ab Stufe ${tier} freigeschaltet - alle V${tier - 1}-Minen müssen zuerst Level 30 erreichen.` : undefined}
                        >
                          V{tier}
                          {locked ? ' 🔒' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {selectedTier > station.tier ? (
                    <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      Noch nicht freigeschaltet - alle V{selectedTier - 1}-Minen müssen zuerst Level 30 erreichen.
                    </p>
                  ) : (
                    <>
                      {(() => {
                        const { produced, consumed } = stationEnergyForTier(gameData, station, selectedTier);
                        const deficit = consumed > produced;
                        return (
                          <div className="queue-box" style={{ marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, marginBottom: 4 }}>
                              Energieversorgung V{selectedTier}
                            </h3>
                            <p style={{ fontSize: 13, color: deficit ? 'var(--danger)' : 'var(--text-dim)' }}>
                              Erzeugt: {Math.floor(produced).toLocaleString('de-DE')} / Verbraucht: {Math.floor(consumed).toLocaleString('de-DE')}
                              {deficit && ' – Energiedefizit: Minen produzieren gedrosselt!'}
                            </p>
                          </div>
                        );
                      })()}
                    <div className="ship-grid">
                      {gameData.stationBuildings
                        .filter((b) => b.tier === selectedTier)
                        .map((b) => {
                          const level = station.buildings[b.id] || 0;
                          const maxed = b.maxLevel !== undefined && level >= b.maxLevel;
                          const cost = stationBuildingCostForLevel(b, level + 1);
                          const canAfford =
                            station.resources.metall >= cost.metall && station.resources.kristall >= cost.kristall && station.resources.deuterium >= cost.deuterium;
                          const queueJob = station.buildQueue.find((j) => j.buildingId === b.id);
                          const queueBusy = station.buildQueue.length > 0;
                          return (
                            <div className="ship-card" key={b.id}>
                              <img
                                className="ship-img"
                                src={`/${b.img}`}
                                alt={b.name}
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                              />
                              <div className="ship-info">
                                <h3>
                                  {BUILDING_ICON[b.kind] || ''} {b.name}
                                </h3>
                                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                  Stufe {level}
                                  {b.maxLevel !== undefined ? ` / ${b.maxLevel}` : ''}
                                </p>
                                {TIER_MINE_KINDS.includes(b.kind) && level > 0 && (
                                  <p style={{ fontSize: 12, color: 'var(--accent-deut)', marginBottom: 4 }}>
                                    Ertrag: {Math.floor(stationMineOutputPerHour(gameData, station, b)).toLocaleString('de-DE')}/h
                                  </p>
                                )}
                                {b.kind === 'energie' && level > 0 && (
                                  <p style={{ fontSize: 12, color: 'var(--accent-deut)', marginBottom: 4 }}>
                                    Energie: {Math.floor(stationLevelScaledValue(b.baseEnergyOutput || 0, level) * stationModuleBoostFactor(gameData, station, stationOutputModuleId(b))).toLocaleString('de-DE')}
                                  </p>
                                )}
                                {queueJob ? (
                                  <p style={{ fontSize: 12, color: 'var(--accent-deut)' }}>Im Bau - fertig in {formatTime(Math.max(0, queueJob.endTime - now))}</p>
                                ) : maxed ? (
                                  <p style={{ fontSize: 12, color: 'var(--accent-deut)' }}>Maximale Stufe erreicht.</p>
                                ) : (
                                  <>
                                    <p style={{ fontSize: 12 }}>
                                      Kosten: {cost.metall.toLocaleString('de-DE')} Metall / {cost.kristall.toLocaleString('de-DE')} Kristall /{' '}
                                      {cost.deuterium.toLocaleString('de-DE')} Deuterium
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                                      Bauzeit: {formatTime(stationBuildingTimeMs(gameData, station, b, level + 1))}
                                    </p>
                                    <button
                                      className="build-btn"
                                      disabled={!canAfford || queueBusy}
                                      onClick={() => buildStationBuilding(station.id, b.id)}
                                    >
                                      Bauen
                                    </button>
                                  </>
                                )}

                                {gameData.stationBuildingModules
                                  .filter((m) => m.buildingId === b.id)
                                  .map((m) => {
                                    const modLevel = station.buildingModules[m.id] || 0;
                                    const modMaxed = modLevel >= m.maxLevel;
                                    const modLocked = level < m.requiredBuildingLevel;
                                    const modCost = stationModuleCostForLevel(m, modLevel + 1);
                                    const modCanAfford =
                                      station.resources.metall >= modCost.metall &&
                                      station.resources.kristall >= modCost.kristall &&
                                      station.resources.deuterium >= modCost.deuterium;
                                    const modQueueJob = station.buildQueue.find((j) => j.moduleId === m.id);
                                    return (
                                      <div key={m.id} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600 }}>
                                          {m.name} (Stufe {modLevel}/{m.maxLevel})
                                        </p>
                                        {modLocked ? (
                                          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Ab Gebäude-Level {m.requiredBuildingLevel}.</p>
                                        ) : modQueueJob ? (
                                          <p style={{ fontSize: 11, color: 'var(--accent-deut)' }}>Im Bau - fertig in {formatTime(Math.max(0, modQueueJob.endTime - now))}</p>
                                        ) : modMaxed ? (
                                          <p style={{ fontSize: 11, color: 'var(--accent-deut)' }}>Maximale Stufe erreicht.</p>
                                        ) : (
                                          <>
                                            <p style={{ fontSize: 11 }}>
                                              {modCost.metall.toLocaleString('de-DE')} M / {modCost.kristall.toLocaleString('de-DE')} K /{' '}
                                              {modCost.deuterium.toLocaleString('de-DE')} D
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formatTime(stationModuleTimeMs(gameData, station, m, modLevel + 1))}</p>
                                            <button
                                              className="qty-btn"
                                              style={{ fontSize: 11, padding: '2px 8px' }}
                                              disabled={!modCanAfford || queueBusy}
                                              onClick={() => buildStationModule(station.id, m.id)}
                                            >
                                              Bauen
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
}
