import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'];

function availableFleetForSektor(sektorId: string, sektorConfig: Record<string, { type: string }>): string[] {
  const cfg = sektorConfig[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

export function SektorPage() {
  const { gameData, state, sendMission, recallMission, joinEvent, error } = useGame();
  const [selectedSektor, setSelectedSektor] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [eventSelection, setEventSelection] = useState<Record<string, number>>({});
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;

  const fmtCountdown = (target: number) => {
    const ms = target - Date.now();
    if (ms <= 0) return '0s';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}min ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Sektor</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {state.raid && !state.raid.resolved && (
        <div style={{ border: '1px solid #b83a3a', borderRadius: 6, padding: 12, marginBottom: 16, background: '#2a0d0d' }}>
          <strong>⚠ Piratenflotte im Anflug auf deine Heimatbasis</strong>
          <p>Ankunft in {fmtCountdown(state.raid.arrivalTime)}. Verstärke deine Verteidigung oder rufe deine Flotte zurück.</p>
        </div>
      )}

      {state.event && !state.event.started && (
        <div style={{ border: '1px solid #b83a3a', borderRadius: 6, padding: 12, marginBottom: 16, background: '#2a0d0d' }}>
          <strong>⚠ {state.event.name}</strong>
          <p>Noch {fmtCountdown(state.event.deadline)} Zeit zum Eingreifen.</p>
          {COMBAT_SHIP_IDS.map((id) => {
            const avail = state.fleet[id] || 0;
            if (avail === 0) return null;
            const qty = eventSelection[id] || 0;
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400 }}>
                <span>
                  {id} (verfügbar: {avail})
                </span>
                <span>
                  <button onClick={() => setEventSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>-10</button>
                  <span style={{ padding: '0 6px' }}>{qty}</span>
                  <button onClick={() => setEventSelection((p) => ({ ...p, [id]: Math.min(avail, (p[id] || 0) + 10) }))}>+10</button>
                  <button onClick={() => setEventSelection((p) => ({ ...p, [id]: avail }))}>Alle</button>
                </span>
              </div>
            );
          })}
          <button
            onClick={() => {
              joinEvent(eventSelection);
              setEventSelection({});
            }}
          >
            Zu Hilfe eilen
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {gameData.sektoren.map((sektor) => {
          const cfg = gameData.sektorConfig[sektor.id];
          const activeMission = state.missions.find((m) => m.sektorId === sektor.id && !m.finalized);
          const availableIds = availableFleetForSektor(sektor.id, gameData.sektorConfig);

          return (
            <div key={sektor.id} style={{ border: '1px solid #3a3a3a', borderRadius: 6, padding: 12 }}>
              <h4>{sektor.name}</h4>
              <p style={{ fontSize: 12, color: '#999' }}>{sektor.zweck}</p>
              <p style={{ fontSize: 12 }}>
                Gefahr: {sektor.gefahr} · {sektor.aktivitaet}
              </p>

              {activeMission ? (
                <div style={{ marginTop: 8 }}>
                  <p>Flotte unterwegs</p>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    {activeMission.processedHours}/4 Stunden verarbeitet · Ertrag bisher:{' '}
                    {Math.floor(activeMission.farmed.metall).toLocaleString('de-DE')} Metall
                  </p>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    {Date.now() < activeMission.arriveTime
                      ? `Anflug, Ankunft in ${fmtCountdown(activeMission.arriveTime)}`
                      : Date.now() < activeMission.endTime
                      ? `Im Sektor, Rückflug in ${fmtCountdown(activeMission.endTime)}`
                      : `Rückflug, Ankunft in ${fmtCountdown(activeMission.returnTime)}`}
                  </p>
                  <button onClick={() => recallMission(activeMission.id)}>Zurückrufen</button>
                </div>
              ) : selectedSektor === sektor.id ? (
                <div style={{ marginTop: 8 }}>
                  {availableIds.map((id) => {
                    const avail = state.fleet[id] || 0;
                    if (avail === 0) return null;
                    const cap = id === 'mining' ? cfg.miningCap : id === 'begleitschiff' ? cfg.escortCap : undefined;
                    const maxSendable = cap ? Math.min(avail, cap) : avail;
                    const qty = selection[id] || 0;
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>
                          {id} (verfügbar: {avail}
                          {cap ? `, max ${cap}` : ''})
                        </span>
                        <span>
                          <button onClick={() => setSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>-10</button>
                          <span style={{ padding: '0 6px' }}>{qty}</span>
                          <button onClick={() => setSelection((p) => ({ ...p, [id]: Math.min(maxSendable, (p[id] || 0) + 10) }))}>+10</button>
                          <button onClick={() => setSelection((p) => ({ ...p, [id]: maxSendable }))}>Alle</button>
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => {
                        sendMission(sektor.id, selection);
                        setSelection({});
                        setSelectedSektor(null);
                      }}
                    >
                      Entsenden
                    </button>{' '}
                    <button
                      onClick={() => {
                        setSelectedSektor(null);
                        setSelection({});
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button style={{ marginTop: 8 }} onClick={() => setSelectedSektor(sektor.id)}>
                  Entsenden
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
