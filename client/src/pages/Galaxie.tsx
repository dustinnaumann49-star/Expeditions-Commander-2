import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { api } from '../api/client';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { InfoModal, InfoTable } from '../components/InfoModal';
import type { GalaxyDeployment, Mission, IncomingDeployment } from '../types/game';

function deploymentStatus(d: GalaxyDeployment, now: number): { label: string; color: string } {
  if (d.recalled) {
    return d.returnTime && d.returnTime <= now ? { label: 'zu Hause', color: 'var(--text-dim)' } : { label: 'kehrt zurück', color: 'var(--accent-kristall)' };
  }
  if (d.arriveTime > now) return { label: 'unterwegs', color: 'var(--accent-kristall)' };
  return { label: 'hält', color: 'var(--accent-deut)' };
}

function missionStatus(m: Mission, now: number): { label: string; color: string; timeText: string } {
  if (now < m.arriveTime) return { label: 'Anflug', color: 'var(--accent-kristall)', timeText: `Ankunft in ${formatTime(m.arriveTime - now)}` };
  if (now < m.endTime) return { label: 'vor Ort', color: 'var(--accent-deut)', timeText: `Rückflug in ${formatTime(m.endTime - now)}` };
  return { label: 'Rückflug', color: 'var(--accent-kristall)', timeText: `Zu Hause in ${formatTime(m.returnTime - now)}` };
}

function ShipList({ ships, shipName }: { ships: Record<string, number>; shipName: (id: string) => string }) {
  const rows: [string, string][] = Object.entries(ships)
    .filter(([, c]) => c > 0)
    .map(([id, c]) => [shipName(id), c.toLocaleString('de-DE')]);
  return <InfoTable rows={rows} />;
}

export function GalaxiePage() {
  const {
    gameData,
    state,
    galaxyOccupants,
    ownGalaxyPosition,
    pirateBases,
    sektorPositions,
    notrufPosition,
    incomingDeployments,
    parties,
    refreshGalaxy,
    holdFleet,
    recallHold,
    recallMission,
    error,
  } = useGame();
  const [, forceTick] = useState(0);
  const [searchParams] = useSearchParams();
  const [system, setSystem] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<{ distance: number; durationMs: number; fuelCost: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [detailDeployment, setDetailDeployment] = useState<GalaxyDeployment | null>(null);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [detailIncoming, setDetailIncoming] = useState<IncomingDeployment | null>(null);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    refreshGalaxy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const paramSystem = Number(searchParams.get('system'));
    const paramTargetUserId = Number(searchParams.get('targetUserId'));
    if (paramSystem && system === null) {
      setSystem(paramSystem);
      if (paramTargetUserId) setTargetUserId(paramTargetUserId);
      return;
    }
    if (ownGalaxyPosition && system === null) setSystem(ownGalaxyPosition.system);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownGalaxyPosition, system]);

  useEffect(() => {
    if (targetUserId === null) {
      setPreview(null);
      return;
    }
    const totalQty = Object.values(selection).reduce((a, b) => a + (b || 0), 0);
    if (totalQty === 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    const t = setTimeout(() => {
      api
        .galaxyPreview(selection, { targetUserId })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [targetUserId, selection]);

  if (!gameData || !state || system === null) return <p>Lade...</p>;

  const now = serverNow();
  const shipName = (id: string) => gameData.ships.find((s) => s.id === id)?.name || id;
  const positions = Array.from({ length: gameData.galaxyPositions }, (_, i) => i + 1);
  const occupantsInSystem = galaxyOccupants.filter((o) => o.system === system);
  const pirateBasesInSystem = pirateBases.filter((b) => b.system === system);
  const sektorenInSystem = sektorPositions.filter((s) => s.system === system);
  const isNotrufInSystem = notrufPosition && notrufPosition.system === system;
  const targetOccupant = targetUserId !== null ? galaxyOccupants.find((o) => o.userId === targetUserId) : null;
  const ownedShips = gameData.ships.filter((s) => (state.fleet[s.id] || 0) > 0);

  const totalSelected = Object.values(selection).reduce((a, b) => a + (b || 0), 0);
  const canSend = targetUserId !== null && totalSelected > 0 && !!preview && preview.fuelCost <= state.resources.deuterium;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Galaxie</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Kein PvP – du kannst deine Flotte bei anderen Spielern "halten" lassen, um sie bei Piratenraids zu unterstützen.
        {ownGalaxyPosition && (
          <>
            {' '}
            Deine Position: <strong>1:{ownGalaxyPosition.system}:{ownGalaxyPosition.position}</strong>
          </>
        )}
      </p>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className="qty-btn" onClick={() => setSystem((s) => (s! <= 1 ? gameData.galaxySystems : s! - 1))}>
            ← Voriges System
          </button>
          <span style={{ fontWeight: 600 }}>System {system} / {gameData.galaxySystems}</span>
          <button className="qty-btn" onClick={() => setSystem((s) => (s! >= gameData.galaxySystems ? 1 : s! + 1))}>
            Nächstes System →
          </button>
          {ownGalaxyPosition && system !== ownGalaxyPosition.system && (
            <button className="qty-btn" onClick={() => setSystem(ownGalaxyPosition.system)}>
              Mein System
            </button>
          )}
        </div>

        <div className="ship-grid">
          {positions.map((pos) => {
            const occ = occupantsInSystem.find((o) => o.position === pos);
            const isPirateBase = pirateBasesInSystem.some((b) => b.position === pos);
            const sektor = sektorenInSystem.find((s) => s.position === pos);
            const isNotruf = isNotrufInSystem && notrufPosition!.position === pos;
            const isOwn = occ && ownGalaxyPosition && occ.system === ownGalaxyPosition.system && occ.position === ownGalaxyPosition.position;
            return (
              <div className="ship-card" key={pos} style={{ padding: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Position {pos}</p>
                {occ ? (
                  <>
                    <p style={{ fontWeight: 600 }}>
                      {occ.isBot && '🤖 '}
                      {occ.username} {isOwn && '(du)'}
                    </p>
                    {!isOwn && (
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setTargetUserId(occ.userId);
                          setSelection({});
                        }}
                      >
                        Flotte hierher schicken
                      </button>
                    )}
                  </>
                ) : sektor ? (
                  <p style={{ color: 'var(--accent-deut)', fontWeight: 600 }}>🛰️ {sektor.name}</p>
                ) : isNotruf ? (
                  <p style={{ color: 'var(--accent-kristall)', fontWeight: 600 }}>🆘 Notruf-Position</p>
                ) : isPirateBase ? (
                  <p style={{ color: 'var(--danger)', fontWeight: 600 }}>🏴‍☠️ Piratenbasis</p>
                ) : (
                  <p style={{ color: 'var(--text-dim)' }}>frei</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {targetUserId !== null && targetOccupant && (
        <div className="queue-box" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>
            Flotte zu {targetOccupant.username} (1:{targetOccupant.system}:{targetOccupant.position}) schicken
          </h3>
          {ownedShips.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>Keine eigenen Schiffe verfügbar.</p>
          ) : (
            ownedShips.map((s) => {
              const avail = state.fleet[s.id] || 0;
              const qty = selection[s.id] || 0;
              return (
                <div className="queue-item" key={s.id}>
                  <span>
                    {s.name} (verfügbar: {avail}, Speed: {s.speed.toLocaleString('de-DE')})
                  </span>
                  <span className="qty-row">
                    <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [s.id]: Math.max(0, (p[s.id] || 0) - 10) }))}>
                      -10
                    </button>
                    <span style={{ padding: '0 6px' }}>{qty}</span>
                    <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [s.id]: Math.min(avail, (p[s.id] || 0) + 10) }))}>
                      +10
                    </button>
                    <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [s.id]: avail }))}>
                      Alle
                    </button>
                  </span>
                </div>
              );
            })
          )}

          {previewLoading && <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Berechne Flugroute...</p>}
          {preview && !previewLoading && (
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Distanz: {preview.distance.toLocaleString('de-DE')} · Flugzeit: {formatTime(preview.durationMs)} · Treibstoff:{' '}
              <span style={{ color: preview.fuelCost > state.resources.deuterium ? 'var(--danger)' : 'var(--accent-deut)' }}>
                {preview.fuelCost.toLocaleString('de-DE')} Deuterium
              </span>
            </p>
          )}

          <div className="build-row">
            <button
              className="qty-btn"
              onClick={() => {
                setTargetUserId(null);
                setSelection({});
              }}
            >
              Abbrechen
            </button>
            <button
              className="build-btn"
              disabled={!canSend}
              onClick={() => {
                holdFleet(targetUserId, selection).then(refreshGalaxy);
                setTargetUserId(null);
                setSelection({});
              }}
            >
              Flotte losschicken (Halten)
            </button>
          </div>
        </div>
      )}

      <div className="queue-box">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Flottenbewegungen</h3>
        {state.galaxyDeployments.length === 0 &&
        state.missions.length === 0 &&
        !(state.event && state.event.started) &&
        parties.filter((op) => op.status === 'departed').length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine eigenen Flotten unterwegs, haltend oder im Einsatz.</p>
        ) : (
          <>
            {parties
              .filter((op) => op.status === 'departed' && op.kind === 'expedition')
              .map((op) => {
                const sektorName = gameData.sektoren.find((s) => s.id === op.sektorId)?.name || op.sektorId;
                const now2 = now;
                let label = 'unterwegs';
                let color = 'var(--accent-kristall)';
                let timeText = '';
                if (op.arriveTime && now2 < op.arriveTime) {
                  timeText = `Ankunft in ${formatTime(op.arriveTime - now2)}`;
                } else if (op.endTime && now2 < op.endTime) {
                  label = 'vor Ort';
                  color = 'var(--accent-deut)';
                  timeText = `Rückflug in ${formatTime(op.endTime - now2)}`;
                } else if (op.returnTime) {
                  label = 'Rückflug';
                  timeText = `Zu Hause in ${formatTime(op.returnTime - now2)}`;
                }
                return (
                  <div className="queue-item" key={op.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                    <div className="progress-row">
                      <span>
                        Gemeinsame Expedition: {sektorName} · Von 1:{op.creatorPosition?.system}:{op.creatorPosition?.position}{' '}
                        <span style={{ color, fontWeight: 600 }}>[{label}]</span>
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeText}</span>
                  </div>
                );
              })}
            {state.event && state.event.started && (
              <div className="queue-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div className="progress-row">
                  <span>
                    Notruf: {state.event.name} · Von deiner Basis
                    {ownGalaxyPosition && ` (1:${ownGalaxyPosition.system}:${ownGalaxyPosition.position})`} zu 1:{notrufPosition?.system}:
                    {notrufPosition?.position}{' '}
                    <span style={{ color: 'var(--accent-kristall)', fontWeight: 600 }}>[unterwegs]</span>
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Ankunft in {formatTime(state.event.arriveTime - now)}</span>
              </div>
            )}
            {state.missions.map((m) => {
              const status = missionStatus(m, now);
              const sektorName = gameData.sektoren.find((s) => s.id === m.sektorId)?.name || m.sektorId;
              return (
                <div className="queue-item" key={m.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailMission(m)}>
                        Sektor-Mission: {sektorName} · Von deiner Basis
                        {ownGalaxyPosition && ` (1:${ownGalaxyPosition.system}:${ownGalaxyPosition.position})`}
                      </span>{' '}
                      <span style={{ color: status.color, fontWeight: 600 }}>[{status.label}]</span>
                    </span>
                    <button className="qty-btn" onClick={() => recallMission(m.id)}>
                      Zurückrufen
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{status.timeText}</span>
                </div>
              );
            })}
            {state.galaxyDeployments.map((d) => {
              const status = deploymentStatus(d, now);
              const canRecall = !d.recalled;
              const timeText =
                status.label === 'unterwegs'
                  ? `Ankunft in ${formatTime(d.arriveTime - now)}`
                  : status.label === 'kehrt zurück'
                  ? `Zu Hause in ${formatTime((d.returnTime || 0) - now)}`
                  : `Bei ${d.targetUsername} seit ${formatTime(now - d.arriveTime)}`;
              return (
                <div className="queue-item" key={d.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailDeployment(d)}>
                        Von 1:{d.originSystem}:{d.originPosition} zu {d.targetUsername} (1:{d.targetSystem}:{d.targetPosition})
                      </span>{' '}
                      <span style={{ color: status.color, fontWeight: 600 }}>[{status.label}]</span>
                    </span>
                    {canRecall && (
                      <button className="qty-btn" onClick={() => recallHold(d.id)}>
                        Zurückrufen
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeText}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="queue-box" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Eingehende Flotten</h3>
        {incomingDeployments.length === 0 && !(state.raid && !state.raid.resolved) ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine fremden Flotten unterwegs zu dir oder bei dir haltend.</p>
        ) : (
          <>
            {state.raid && !state.raid.resolved && (
              <div className="queue-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div className="progress-row">
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    🏴‍☠️ Piratenflotte von 1:{state.raid.pirateBase.system}:{state.raid.pirateBase.position}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {now < state.raid.launchTime
                    ? `Startet in ${formatTime(state.raid.launchTime - now)}`
                    : `Ankunft in ${formatTime(state.raid.arrivalTime - now)}`}{' '}
                  · Flotteninhalt erst bei Ankunft bekannt
                </span>
              </div>
            )}
            {incomingDeployments.map((d, i) => (
              <div className="queue-item" key={i} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div className="progress-row">
                  <span>
                    <span className="lore-title" onClick={() => setDetailIncoming(d)}>
                      {d.ownerUsername} von 1:{d.originSystem}:{d.originPosition}
                    </span>{' '}
                    <span style={{ color: d.holding ? 'var(--accent-deut)' : 'var(--accent-kristall)', fontWeight: 600 }}>
                      [{d.holding ? 'hält bei dir' : 'unterwegs'}]
                    </span>
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {d.holding ? `Hält seit ${formatTime(now - d.arriveTime)}` : `Ankunft in ${formatTime(d.arriveTime - now)}`}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {detailMission && (
        <InfoModal title={`Sektor-Mission: ${gameData.sektoren.find((s) => s.id === detailMission.sektorId)?.name || detailMission.sektorId}`} onClose={() => setDetailMission(null)}>
          <ShipList ships={detailMission.ships} shipName={shipName} />
        </InfoModal>
      )}

      {detailDeployment && (
        <InfoModal title={`Flotte bei ${detailDeployment.targetUsername}`} onClose={() => setDetailDeployment(null)}>
          <ShipList ships={detailDeployment.ships} shipName={shipName} />
        </InfoModal>
      )}

      {detailIncoming && (
        <InfoModal title={`Flotte von ${detailIncoming.ownerUsername}`} onClose={() => setDetailIncoming(null)}>
          <ShipList ships={detailIncoming.ships} shipName={shipName} />
        </InfoModal>
      )}
    </div>
  );
}
