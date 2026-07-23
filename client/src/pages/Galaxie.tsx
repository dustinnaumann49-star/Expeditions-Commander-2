import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { api } from '../api/client';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { InfoModal, InfoTable } from '../components/InfoModal';
import type { GalaxyDeployment, Mission, IncomingDeployment, GalaxyEvent, GalaxyEventTrip, PirateBaseSummary, PirateAttackDeployment, SpyMissionDeployment, OutpostSummary, OutpostDeployment } from '../types/game';

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
    pirateBaseSummaries,
    outposts,
    sektorPositions,
    incomingDeployments,
    galaxyEvents,
    parties,
    refreshGalaxy,
    holdFleet,
    recallHold,
    recallMission,
    relocateBase,
    claimGalaxyEvent,
    attackPirateBase,
    spyOnPirateBase,
    attackOutpost,
    reinforceOutpost,
    recallOutpost,
    error,
  } = useGame();
  const [, forceTick] = useState(0);
  const [searchParams] = useSearchParams();
  const [system, setSystem] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetEvent, setTargetEvent] = useState<GalaxyEvent | null>(null);
  const [targetPirateBase, setTargetPirateBase] = useState<PirateBaseSummary | null>(null);
  const [targetSpyBase, setTargetSpyBase] = useState<PirateBaseSummary | null>(null);
  const [targetOutpostAttack, setTargetOutpostAttack] = useState<OutpostSummary | null>(null);
  const [targetOutpostReinforce, setTargetOutpostReinforce] = useState<OutpostSummary | null>(null);
  const [relocateTarget, setRelocateTarget] = useState<{ system: number; position: number } | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<{ distance: number; durationMs: number; fuelCost: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [detailDeployment, setDetailDeployment] = useState<GalaxyDeployment | null>(null);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [detailIncoming, setDetailIncoming] = useState<IncomingDeployment | null>(null);
  const [detailEventTrip, setDetailEventTrip] = useState<GalaxyEventTrip | null>(null);
  const [detailPirateAttack, setDetailPirateAttack] = useState<PirateAttackDeployment | null>(null);
  const [detailOutpostDeployment, setDetailOutpostDeployment] = useState<OutpostDeployment | null>(null);
  const [detailSpyMission, setDetailSpyMission] = useState<SpyMissionDeployment | null>(null);

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
    // Spionagefluege haben eine FESTE Flugzeit/Treibstoffkosten (siehe gameData.spyProbeTravelMs/
    // -FuelCostPerProbe), unabhaengig von der Entfernung - keine Vorschau-API-Anfrage noetig, wird
    // weiter unten direkt im Panel berechnet.
    if (targetSpyBase) {
      setPreview(null);
      return;
    }
    if (targetUserId === null && !targetEvent && !targetPirateBase && !targetOutpostAttack && !targetOutpostReinforce) {
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
      const outpostTarget = targetOutpostAttack || targetOutpostReinforce;
      const target = targetEvent
        ? { targetPosition: { system: targetEvent.system, position: targetEvent.position } }
        : targetPirateBase
        ? { targetPosition: { system: targetPirateBase.system, position: targetPirateBase.position } }
        : outpostTarget
        ? { targetPosition: { system: outpostTarget.system, position: outpostTarget.position } }
        : { targetUserId: targetUserId! };
      api
        .galaxyPreview(selection, target)
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [targetUserId, targetEvent, targetPirateBase, targetOutpostAttack, targetOutpostReinforce, selection]);

  if (!gameData || !state || system === null) return <PageSkeleton />;

  const now = serverNow();
  const shipName = (id: string) => gameData.ships.find((s) => s.id === id)?.name || id;
  const positions = Array.from({ length: gameData.galaxyPositions }, (_, i) => i + 1);
  const occupantsInSystem = galaxyOccupants.filter((o) => o.system === system);
  const pirateBasesInSystem = pirateBases.filter((b) => b.system === system);
  const outpostsInSystem = outposts.filter((o) => o.system === system);
  const sektorenInSystem = sektorPositions.filter((s) => s.system === system);
  const eventsInSystem = galaxyEvents.filter((e) => e.system === system);
  const targetOccupant = targetUserId !== null ? galaxyOccupants.find((o) => o.userId === targetUserId) : null;
  const ownedShips = gameData.ships.filter((s) => (state.fleet[s.id] || 0) > 0);

  const totalSelected = Object.values(selection).reduce((a, b) => a + (b || 0), 0);
  const probeQty = selection.spionagesonde || 0;
  const spyFuelCost = probeQty * gameData.spyProbeFuelCostPerProbe;
  const canSendSpy = !!targetSpyBase && probeQty > 0 && spyFuelCost <= state.resources.deuterium;
  const canSend = targetSpyBase
    ? canSendSpy
    : (targetUserId !== null || !!targetEvent || !!targetPirateBase || !!targetOutpostAttack || !!targetOutpostReinforce) &&
      totalSelected > 0 &&
      !!preview &&
      preview.fuelCost <= state.resources.deuterium;
  const canRelocate = !!relocateTarget && state.resources.dm >= gameData.relocateBaseCostDm;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Galaxie</h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Kein PvP – du kannst deine Flotte bei anderen Spielern "halten" lassen, um sie bei Piratenraids zu unterstützen. Gelegentlich
        tauchen an freien Positionen Galaxie-Ereignisse (🛸🚀) auf - wer zuerst eine Flotte dorthin schickt, sichert sich die Beute.
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
            const pirateBaseSummary = pirateBaseSummaries.find((b) => b.system === system && b.position === pos);
            const alreadyAttackingBase = pirateBaseSummary && state.pirateAttacks.some((a) => a.baseId === pirateBaseSummary.id);
            const alreadySpyingBase = pirateBaseSummary && state.spyMissions.some((m) => m.baseId === pirateBaseSummary.id);
            const sektor = sektorenInSystem.find((s) => s.position === pos);
            const event = eventsInSystem.find((e) => e.position === pos);
            const outpost = outpostsInSystem.find((o) => o.position === pos);
            const alreadyAttackingOutpost = outpost && state.outpostDeployments.some((d) => d.outpostId === outpost.id && d.kind === 'attack' && !d.resolved);
            const isOwn = occ && ownGalaxyPosition && occ.system === ownGalaxyPosition.system && occ.position === ownGalaxyPosition.position;
            const eventDef = event ? gameData.galaxyEventTypes[event.type] : null;
            const alreadyEnRouteToEvent = event && state.eventTrips.some((t) => t.eventId === event.id);
            const isFreeAndPickable = !occ && !isPirateBase && !sektor && !event && !outpost;
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
                          setTargetEvent(null);
                          setRelocateTarget(null);
                          setSelection({});
                        }}
                      >
                        Flotte hierher schicken
                      </button>
                    )}
                  </>
                ) : sektor ? (
                  <p style={{ color: 'var(--accent-deut)', fontWeight: 600 }}>🛰️ {sektor.name}</p>
                ) : isPirateBase ? (
                  <>
                    <p style={{ color: 'var(--danger)', fontWeight: 600 }}>🏴‍☠️ Piratenbasis</p>
                    {pirateBaseSummary ? (
                      <>
                        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                          Machtwert: {pirateBaseSummary.power.toLocaleString('de-DE')}
                        </p>
                        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {alreadyAttackingBase ? (
                            <span style={{ fontSize: 12, color: 'var(--accent-kristall)' }}>Angriff unterwegs</span>
                          ) : (
                            <button
                              className="qty-btn"
                              onClick={() => {
                                setTargetPirateBase(pirateBaseSummary);
                                setTargetSpyBase(null);
                                setTargetUserId(null);
                                setTargetEvent(null);
                                setRelocateTarget(null);
                                setSelection({});
                              }}
                            >
                              Angreifen
                            </button>
                          )}
                          {alreadySpyingBase ? (
                            <span style={{ fontSize: 12, color: 'var(--accent-kristall)' }}>Sonde unterwegs</span>
                          ) : (
                            <button
                              className="qty-btn"
                              onClick={() => {
                                setTargetSpyBase(pirateBaseSummary);
                                setTargetPirateBase(null);
                                setTargetUserId(null);
                                setTargetEvent(null);
                                setRelocateTarget(null);
                                setSelection({});
                              }}
                            >
                              Ausspionieren
                            </button>
                          )}
                        </span>
                      </>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Nicht angreifbar</p>
                    )}
                  </>
                ) : outpost ? (
                  <>
                    <p style={{ color: outpost.ownerSide === 'players' ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
                      🚩 Außenposten ({outpost.tier})
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                      {outpost.ownerSide === 'players' ? 'In Spielerhand' : 'Piraten-Garnison'} · Stärke ~{outpost.garrisonPower.toLocaleString('de-DE')}
                      {outpost.ownerSide === 'players' && ' · +15% Flugzeit-Bonus in diesem System'}
                    </p>
                    {outpost.ownerSide === 'players' ? (
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            setTargetOutpostReinforce(outpost);
                            setTargetOutpostAttack(null);
                            setTargetPirateBase(null);
                            setTargetSpyBase(null);
                            setTargetUserId(null);
                            setTargetEvent(null);
                            setRelocateTarget(null);
                            setSelection({});
                          }}
                        >
                          Verstärken
                        </button>
                        <button className="qty-btn" onClick={() => recallOutpost(outpost.id).then(refreshGalaxy)}>
                          Garnison zurückrufen
                        </button>
                      </span>
                    ) : alreadyAttackingOutpost ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-kristall)' }}>Angriff unterwegs</span>
                    ) : (
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setTargetOutpostAttack(outpost);
                          setTargetOutpostReinforce(null);
                          setTargetPirateBase(null);
                          setTargetSpyBase(null);
                          setTargetUserId(null);
                          setTargetEvent(null);
                          setRelocateTarget(null);
                          setSelection({});
                        }}
                      >
                        Angreifen
                      </button>
                    )}
                  </>
                ) : event ? (
                  <>
                    <p style={{ fontWeight: 600, color: 'var(--rf-gold)' }}>
                      {eventDef?.icon || '❓'} {eventDef?.label || event.type}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                      Verschwindet in {formatTime(event.expiresAt - now)}
                    </p>
                    {alreadyEnRouteToEvent ? (
                      <p style={{ fontSize: 12, color: 'var(--accent-kristall)' }}>Flotte bereits unterwegs</p>
                    ) : (
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setTargetEvent(event);
                          setTargetUserId(null);
                          setRelocateTarget(null);
                          setSelection({});
                        }}
                      >
                        Flotte zur Bergung schicken
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-dim)', marginBottom: isFreeAndPickable ? 6 : 0 }}>frei</p>
                    {isFreeAndPickable && (
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setRelocateTarget({ system, position: pos });
                          setTargetUserId(null);
                          setTargetEvent(null);
                        }}
                      >
                        Basis hierher verlegen
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {relocateTarget && (
        <div className="queue-box" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>
            Heimatbasis nach 1:{relocateTarget.system}:{relocateTarget.position} verlegen
          </h3>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            Kosten:{' '}
            <span style={{ color: canRelocate ? 'var(--accent-deut)' : 'var(--danger)' }}>
              {gameData.relocateBaseCostDm} Dunkle Materie
            </span>{' '}
            · Deine Flotte/Verteidigung bleibt unverändert, nur deine Heimatposition ändert sich sofort.
          </p>
          <div className="build-row">
            <button className="qty-btn" onClick={() => setRelocateTarget(null)}>
              Abbrechen
            </button>
            <button
              className="build-btn"
              disabled={!canRelocate}
              onClick={() => {
                relocateBase(relocateTarget.system, relocateTarget.position).then(refreshGalaxy);
                setRelocateTarget(null);
              }}
            >
              Verlegen
            </button>
          </div>
        </div>
      )}

      {((targetUserId !== null && targetOccupant) || targetEvent || targetPirateBase || targetSpyBase || targetOutpostAttack || targetOutpostReinforce) && (
        <div className="queue-box" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>
            {targetEvent
              ? `Bergungsflotte zu ${gameData.galaxyEventTypes[targetEvent.type]?.label || targetEvent.type} (1:${targetEvent.system}:${targetEvent.position}) schicken`
              : targetPirateBase
              ? `Angriffsflotte zur Piratenbasis (1:${targetPirateBase.system}:${targetPirateBase.position}, Machtwert ${targetPirateBase.power.toLocaleString('de-DE')}) schicken`
              : targetSpyBase
              ? `Spionagesonde(n) zur Piratenbasis (1:${targetSpyBase.system}:${targetSpyBase.position}) schicken`
              : targetOutpostAttack
              ? `Angriffsflotte zum Außenposten (1:${targetOutpostAttack.system}:${targetOutpostAttack.position}, ${targetOutpostAttack.tier}) schicken`
              : targetOutpostReinforce
              ? `Verstärkung zum Außenposten (1:${targetOutpostReinforce.system}:${targetOutpostReinforce.position}) schicken`
              : `Flotte zu ${targetOccupant!.username} (1:${targetOccupant!.system}:${targetOccupant!.position}) schicken`}
          </h3>
          {targetSpyBase ? (
            (state.fleet.spionagesonde || 0) === 0 ? (
              <p style={{ color: 'var(--text-dim)' }}>Keine Spionagesonden verfügbar - erst in der Werft (Versorgungsschiffe) bauen.</p>
            ) : (
              <div className="queue-item">
                <span>Spionagesonde (verfügbar: {state.fleet.spionagesonde})</span>
                <span className="qty-row">
                  <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, spionagesonde: Math.max(0, (p.spionagesonde || 0) - 1) }))}>
                    -1
                  </button>
                  <span style={{ padding: '0 6px' }}>{probeQty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setSelection((p) => ({ ...p, spionagesonde: Math.min(state.fleet.spionagesonde || 0, (p.spionagesonde || 0) + 1) }))}
                  >
                    +1
                  </button>
                  <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, spionagesonde: state.fleet.spionagesonde || 0 }))}>
                    Alle
                  </button>
                </span>
              </div>
            )
          ) : ownedShips.length === 0 ? (
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

          {targetSpyBase ? (
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Flugzeit: {formatTime(gameData.spyProbeTravelMs)} (fest, unabhängig von der Entfernung) · Treibstoff:{' '}
              <span style={{ color: spyFuelCost > state.resources.deuterium ? 'var(--danger)' : 'var(--accent-deut)' }}>
                {spyFuelCost.toLocaleString('de-DE')} Deuterium
              </span>
            </p>
          ) : (
            <>
              {previewLoading && <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Berechne Flugroute...</p>}
              {preview && !previewLoading && (
                <p style={{ fontSize: 13, marginTop: 8 }}>
                  Distanz: {preview.distance.toLocaleString('de-DE')} · Flugzeit: {formatTime(preview.durationMs)} · Treibstoff:{' '}
                  <span style={{ color: preview.fuelCost > state.resources.deuterium ? 'var(--danger)' : 'var(--accent-deut)' }}>
                    {preview.fuelCost.toLocaleString('de-DE')} Deuterium
                  </span>
                </p>
              )}
            </>
          )}

          <div className="build-row">
            <button
              className="qty-btn"
              onClick={() => {
                setTargetUserId(null);
                setTargetEvent(null);
                setTargetPirateBase(null);
                setTargetSpyBase(null);
                setTargetOutpostAttack(null);
                setTargetOutpostReinforce(null);
                setSelection({});
              }}
            >
              Abbrechen
            </button>
            <button
              className="build-btn"
              disabled={!canSend}
              onClick={() => {
                if (targetEvent) {
                  claimGalaxyEvent(targetEvent.id, selection).then(refreshGalaxy);
                  setTargetEvent(null);
                } else if (targetPirateBase) {
                  attackPirateBase(targetPirateBase.id, selection).then(refreshGalaxy);
                  setTargetPirateBase(null);
                } else if (targetSpyBase) {
                  spyOnPirateBase(targetSpyBase.id, probeQty).then(refreshGalaxy);
                  setTargetSpyBase(null);
                } else if (targetOutpostAttack) {
                  attackOutpost(targetOutpostAttack.id, selection).then(refreshGalaxy);
                  setTargetOutpostAttack(null);
                } else if (targetOutpostReinforce) {
                  reinforceOutpost(targetOutpostReinforce.id, selection).then(refreshGalaxy);
                  setTargetOutpostReinforce(null);
                } else {
                  holdFleet(targetUserId!, selection).then(refreshGalaxy);
                  setTargetUserId(null);
                }
                setSelection({});
              }}
            >
              {targetEvent
                ? 'Flotte losschicken (Bergung, kehrt automatisch zurück)'
                : targetPirateBase
                ? 'Angriff starten (kehrt automatisch zurück)'
                : targetSpyBase
                ? 'Sonde(n) losschicken (kehrt automatisch zurück)'
                : targetOutpostAttack
                ? 'Angriff starten (bei Sieg neue Garnison, sonst kehrt Flotte zurück)'
                : targetOutpostReinforce
                ? 'Verstärkung losschicken (kein Rückflug, bis zurückgerufen)'
                : 'Flotte losschicken (Halten)'}
            </button>
          </div>
        </div>
      )}

      <div className="queue-box">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Flottenbewegungen</h3>
        {state.galaxyDeployments.length === 0 &&
        state.eventTrips.length === 0 &&
        state.pirateAttacks.length === 0 &&
        state.outpostDeployments.length === 0 &&
        state.spyMissions.length === 0 &&
        state.missions.length === 0 &&
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
            {state.eventTrips.map((trip) => {
              const eventLabel = gameData.galaxyEventTypes[trip.eventType]?.label || trip.eventType;
              const label = !trip.collected ? 'unterwegs' : 'Rückflug';
              const color = !trip.collected ? 'var(--accent-kristall)' : trip.reward ? 'var(--accent-deut)' : 'var(--text-dim)';
              const timeText = !trip.collected
                ? `Ankunft in ${formatTime(trip.arriveTime - now)}`
                : `Zu Hause in ${formatTime(trip.returnTime - now)}${trip.reward ? ' · Beute gesichert' : ' · leer (bereits vergriffen)'}`;
              return (
                <div className="queue-item" key={trip.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailEventTrip(trip)}>
                        Bergungsflug: {eventLabel} · Von 1:{trip.originSystem}:{trip.originPosition}
                      </span>{' '}
                      <span style={{ color, fontWeight: 600 }}>[{label}]</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeText}</span>
                </div>
              );
            })}
            {state.pirateAttacks.map((a) => {
              const label = !a.resolved ? 'unterwegs' : 'Rückflug';
              const color = !a.resolved ? 'var(--accent-kristall)' : 'var(--text-dim)';
              const timeText = !a.resolved ? `Ankunft in ${formatTime(a.arriveTime - now)}` : `Zu Hause in ${formatTime(a.returnTime - now)}`;
              return (
                <div className="queue-item" key={a.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailPirateAttack(a)}>
                        Angriffsflug zur Piratenbasis (1:{a.targetSystem}:{a.targetPosition}) · Von 1:{a.originSystem}:{a.originPosition}
                      </span>{' '}
                      <span style={{ color, fontWeight: 600 }}>[{label}]</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeText}</span>
                </div>
              );
            })}
            {state.outpostDeployments.map((d) => {
              const label = d.resolved ? 'abgeschlossen' : d.returnTime !== null ? 'kehrt zurück' : 'unterwegs';
              const color = !d.resolved ? 'var(--accent-kristall)' : 'var(--text-dim)';
              const timeText = !d.resolved ? `Ankunft in ${formatTime(d.arriveTime - now)}` : 'Abgeschlossen';
              const kindLabel = d.kind === 'attack' ? 'Angriffsflug' : 'Verstärkung';
              return (
                <div className="queue-item" key={d.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailOutpostDeployment(d)}>
                        {kindLabel}: Außenposten (1:{d.targetSystem}:{d.targetPosition}) · Von 1:{d.originSystem}:{d.originPosition}
                      </span>{' '}
                      <span style={{ color, fontWeight: 600 }}>[{label}]</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{timeText}</span>
                </div>
              );
            })}
            {state.spyMissions.map((m) => {
              const label = !m.resolved ? 'unterwegs' : 'Rückflug';
              const color = !m.resolved ? 'var(--accent-kristall)' : 'var(--text-dim)';
              const timeText = !m.resolved ? `Ankunft in ${formatTime(m.arriveTime - now)}` : `Zu Hause in ${formatTime(m.returnTime - now)}`;
              return (
                <div className="queue-item" key={m.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div className="progress-row">
                    <span>
                      <span className="lore-title" onClick={() => setDetailSpyMission(m)}>
                        Spionageflug zur Piratenbasis (1:{m.targetSystem}:{m.targetPosition}) · Von 1:{m.originSystem}:{m.originPosition}
                      </span>{' '}
                      <span style={{ color, fontWeight: 600 }}>[{label}]</span>
                    </span>
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
        {incomingDeployments.length === 0 && !state.raid ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine fremden Flotten unterwegs zu dir oder bei dir haltend.</p>
        ) : (
          <>
            {state.raid && (
              <div className="queue-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div className="progress-row">
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    🏴‍☠️ Piratenflotte von 1:{state.raid.pirateBase.system}:{state.raid.pirateBase.position}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {now < state.raid.launchTime
                    ? `Startet in ${formatTime(state.raid.launchTime - now)}`
                    : now < state.raid.arrivalTime
                    ? `Ankunft der ersten Welle in ${formatTime(state.raid.arrivalTime - now)}`
                    : `Welle ${Math.min(state.raid.wavesProcessed + 1, state.raid.waveTimes.length)}/${state.raid.waveTimes.length} in ${formatTime(
                        Math.max(0, (state.raid.waveTimes[state.raid.wavesProcessed] ?? now) - now)
                      )}`}{' '}
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

      {detailPirateAttack && (
        <InfoModal title={`Angriffsflug: Piratenbasis 1:${detailPirateAttack.targetSystem}:${detailPirateAttack.targetPosition}`} onClose={() => setDetailPirateAttack(null)}>
          <ShipList ships={detailPirateAttack.ships} shipName={shipName} />
          <p style={{ fontSize: 13, marginTop: 8 }}>
            {detailPirateAttack.resolved ? 'Kampf bereits ausgetragen - Details siehe Kampfbericht in den Nachrichten.' : 'Noch im Anflug.'}
          </p>
        </InfoModal>
      )}

      {detailOutpostDeployment && (
        <InfoModal
          title={`${detailOutpostDeployment.kind === 'attack' ? 'Angriffsflug' : 'Verstärkung'}: Außenposten 1:${detailOutpostDeployment.targetSystem}:${detailOutpostDeployment.targetPosition}`}
          onClose={() => setDetailOutpostDeployment(null)}
        >
          <ShipList ships={detailOutpostDeployment.ships} shipName={shipName} />
          <p style={{ fontSize: 13, marginTop: 8 }}>
            {detailOutpostDeployment.resolved
              ? 'Bereits abgeschlossen - Details siehe Kampfbericht in den Nachrichten (bei Angriffen).'
              : 'Noch im Anflug.'}
          </p>
        </InfoModal>
      )}

      {detailSpyMission && (
        <InfoModal title={`Spionageflug: Piratenbasis 1:${detailSpyMission.targetSystem}:${detailSpyMission.targetPosition}`} onClose={() => setDetailSpyMission(null)}>
          <ShipList ships={detailSpyMission.ships} shipName={shipName} />
          <p style={{ fontSize: 13, marginTop: 8 }}>
            {detailSpyMission.resolved ? 'Bericht bereits eingetroffen - siehe Farm-/Beuteberichte in den Nachrichten.' : 'Noch im Anflug.'}
          </p>
        </InfoModal>
      )}

      {detailEventTrip && (
        <InfoModal
          title={`Bergungsflug: ${gameData.galaxyEventTypes[detailEventTrip.eventType]?.label || detailEventTrip.eventType}`}
          onClose={() => setDetailEventTrip(null)}
        >
          <ShipList ships={detailEventTrip.ships} shipName={shipName} />
          {detailEventTrip.collected && (
            <p style={{ fontSize: 13, marginTop: 8 }}>
              {detailEventTrip.reward
                ? `Beute: ${detailEventTrip.reward.metall.toLocaleString('de-DE')} Metall, ${detailEventTrip.reward.kristall.toLocaleString(
                    'de-DE'
                  )} Kristall, ${detailEventTrip.reward.deuterium.toLocaleString('de-DE')} Deuterium${
                    detailEventTrip.reward.dm ? `, ${detailEventTrip.reward.dm} DM` : ''
                  }`
                : 'Ereignis war bereits vergriffen - keine Beute.'}
            </p>
          )}
        </InfoModal>
      )}
    </div>
  );
}
