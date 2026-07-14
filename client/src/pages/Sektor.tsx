import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'];

function availableFleetForSektor(sektorId: string, sektorConfig: Record<string, { type: string }>): string[] {
  const cfg = sektorConfig[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

function fmtCountdown(target: number): string {
  const ms = target - serverNow();
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
}

export function SektorPage() {
  const { gameData, state, sendMission, recallMission, joinEvent, savePreset, deletePreset, error } = useGame();
  const [selectedSektor, setSelectedSektor] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [eventSelection, setEventSelection] = useState<Record<string, number>>({});
  const [presetName, setPresetName] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Sektor</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {state.raid && !state.raid.resolved && (
        <div className="queue-box" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--danger)' }}>⚠ Piratenflotte im Anflug auf deine Heimatbasis</strong>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Ankunft in {fmtCountdown(state.raid.arrivalTime)}. Verstärke deine Verteidigung oder rufe deine Flotte zurück.
          </p>
        </div>
      )}

      {state.event && !state.event.started && (
        <div className="queue-box" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--danger)' }}>⚠ {state.event.name}</strong>
          <p style={{ fontSize: 13, marginTop: 4, marginBottom: 8 }}>Noch {fmtCountdown(state.event.deadline)} Zeit zum Eingreifen.</p>
          {COMBAT_SHIP_IDS.map((id) => {
            const avail = state.fleet[id] || 0;
            if (avail === 0) return null;
            const qty = eventSelection[id] || 0;
            return (
              <div className="queue-item" key={id}>
                <span>
                  {id} (verfügbar: {avail})
                </span>
                <span className="qty-row">
                  <button className="qty-btn" onClick={() => setEventSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>
                    -10
                  </button>
                  <span style={{ padding: '0 6px' }}>{qty}</span>
                  <button className="qty-btn" onClick={() => setEventSelection((p) => ({ ...p, [id]: Math.min(avail, (p[id] || 0) + 10) }))}>
                    +10
                  </button>
                  <button className="qty-btn" onClick={() => setEventSelection((p) => ({ ...p, [id]: avail }))}>
                    Alle
                  </button>
                </span>
              </div>
            );
          })}
          <div className="build-row">
            <span></span>
            <button
              className="build-btn"
              onClick={() => {
                joinEvent(eventSelection);
                setEventSelection({});
              }}
            >
              Zu Hilfe eilen
            </button>
          </div>
        </div>
      )}

      {state.presets.length > 0 && (
        <div className="queue-box" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Gespeicherte Flotten-Vorlagen</h3>
          {state.presets.map((p) => (
            <div className="queue-item" key={p.id}>
              <span>
                {p.name} ({Object.entries(p.ships).map(([id, c]) => `${id} x${c}`).join(', ')})
              </span>
              <span>
                <button className="qty-btn" onClick={() => setSelection(p.ships)}>
                  In Auswahl übernehmen
                </button>{' '}
                <button className="qty-btn" onClick={() => deletePreset(p.id)}>
                  Löschen
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="ship-grid">
        {gameData.sektoren.map((sektor) => {
          const cfg = gameData.sektorConfig[sektor.id];
          const activeMission = state.missions.find((m) => m.sektorId === sektor.id && !m.finalized);
          const availableIds = availableFleetForSektor(sektor.id, gameData.sektorConfig);

          return (
            <div className="ship-card" key={sektor.id}>
              <img className="ship-img" src={`/${sektor.img}`} alt={sektor.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>{sektor.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{sektor.zweck}</p>
                <div className="ship-stats">
                  <span>Gefahr: {sektor.gefahr}</span>
                  <span>{sektor.aktivitaet}</span>
                </div>

                {activeMission ? (
                  <>
                    <p style={{ fontSize: 13 }}>Flotte unterwegs</p>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {activeMission.processedHours}/4 Stunden verarbeitet · Ertrag bisher:{' '}
                      {Math.floor(activeMission.farmed.metall).toLocaleString('de-DE')} Metall
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {serverNow() < activeMission.arriveTime
                        ? `Anflug, Ankunft in ${fmtCountdown(activeMission.arriveTime)}`
                        : serverNow() < activeMission.endTime
                        ? `Im Sektor, Rückflug in ${fmtCountdown(activeMission.endTime)}`
                        : `Rückflug, Ankunft in ${fmtCountdown(activeMission.returnTime)}`}
                    </p>
                    <div className="build-row">
                      <span></span>
                      <button className="build-btn" onClick={() => recallMission(activeMission.id)}>
                        Zurückrufen
                      </button>
                    </div>
                  </>
                ) : selectedSektor === sektor.id ? (
                  <>
                    {availableIds.map((id) => {
                      const avail = state.fleet[id] || 0;
                      if (avail === 0) return null;
                      const cap = id === 'mining' ? cfg.miningCap : id === 'begleitschiff' ? cfg.escortCap : undefined;
                      const maxSendable = cap ? Math.min(avail, cap) : avail;
                      const qty = selection[id] || 0;
                      return (
                        <div className="queue-item" key={id}>
                          <span>
                            {id} (verfügbar: {avail}
                            {cap ? `, max ${cap}` : ''})
                          </span>
                          <span className="qty-row">
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>
                              -10
                            </button>
                            <span style={{ padding: '0 6px' }}>{qty}</span>
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.min(maxSendable, (p[id] || 0) + 10) }))}>
                              +10
                            </button>
                            <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: maxSendable }))}>
                              Alle
                            </button>
                          </span>
                        </div>
                      );
                    })}
                    <div className="qty-row" style={{ marginTop: 8 }}>
                      <input
                        className="qty-input"
                        placeholder="Name für Vorlage"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => {
                          savePreset(presetName, selection);
                          setPresetName('');
                        }}
                      >
                        Als Vorlage speichern
                      </button>
                    </div>
                    <div className="build-row">
                      <button
                        className="qty-btn"
                        onClick={() => {
                          setSelectedSektor(null);
                          setSelection({});
                        }}
                      >
                        Abbrechen
                      </button>
                      <button
                        className="build-btn"
                        onClick={() => {
                          sendMission(sektor.id, selection);
                          setSelection({});
                          setSelectedSektor(null);
                        }}
                      >
                        Entsenden
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="build-row">
                    <span></span>
                    <button className="build-btn" onClick={() => setSelectedSektor(sektor.id)}>
                      Entsenden
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
