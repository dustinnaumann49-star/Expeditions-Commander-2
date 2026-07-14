import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import type { GameData } from '../types/game';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'];

function availableFleetForSektor(sektorId: string, sektorConfig: Record<string, { type: string }>): string[] {
  const cfg = sektorConfig[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

function SektorInfoBox({ sektorId, gameData }: { sektorId: string; gameData: GameData }) {
  const cfg = gameData.sektorConfig[sektorId];

  if (cfg.type === 'piraten') {
    const shipTags = gameData.ships
      .filter((s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff')
      .map((s) => s.name)
      .join(', ');
    const defenseTags = gameData.defenses.map((d) => d.name).join(', ');
    const rollTable = gameData.piratenMultiplierRoll[sektorId] || [];
    const multiplierRollText = rollTable.map((v) => Math.round(v * 100) + '%').join(' / ');
    const defenseFactor = sektorId === 'piraten_niedrig' ? 5 : sektorId === 'piraten_mittel' ? 10 : 15;
    const containerCfg = cfg.captainContainerTier ? gameData.containerTypes[cfg.captainContainerTier] : null;

    return (
      <div className="sektor-info-box">
        <div className="info-row">
          <span className="info-label">👾 Mögliche Piraten-Schiffe</span>
          <span className="info-value">{shipTags}</span>
        </div>
        <div className="info-row">
          <span className="info-label">🏰 Mögliche Verteidigungsanlagen</span>
          <span className="info-value">{defenseTags}</span>
        </div>
        <div className="info-row">
          <span className="info-label">🚢 Schiffsklassen im Pool</span>
          <span className="info-value">
            Alle Kampfschiff-Typen möglich, in jedem Sektor – kleine/günstige Schiffe deutlich häufiger als seltene Elite-Schiffe. Piraten
            unterliegen denselben Baugrenzen (Maxima pro Typ) wie du selbst.
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🎲 Feindstärke (wird pro Stunden-Check gewürfelt)</span>
          <span className="info-value">
            {multiplierRollText} deiner Kampf-Power (kann nie über 100% steigen, da Piraten an dieselben Maxima gebunden sind wie du)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🛡️ Verteidigung</span>
          <span className="info-value">{defenseFactor}% deiner Power (Mix aus Verteidigungsanlagen, ebenfalls an dieselben Maxima gebunden)</span>
        </div>
        <div className="info-row">
          <span className="info-label">☠ Piratenkapitän-Event</span>
          <span className="info-value">
            {((cfg.captainChance || 0) * 100).toFixed(0)}% Chance pro Kampf · Belohnung bei Sieg: {containerCfg?.name} + {cfg.captainDm} DM
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">💰 Beute pro Sieg</span>
          <span className="info-value">
            {cfg.lootBase?.metall.toLocaleString('de-DE')} Metall, {cfg.lootBase?.kristall.toLocaleString('de-DE')} Kristall,{' '}
            {cfg.lootBase?.deuterium.toLocaleString('de-DE')} Deuterium · {((cfg.bonusLootChance || 0) * 100).toFixed(0)}% Chance auf{' '}
            {cfg.bonusLootMultiplier}x Volltreffer
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🔧 Teile-Sammlung</span>
          <span className="info-value">
            Läuft passiv über die Zeit bis Cap ({cfg.teileCap}), zusätzlicher Sofort-Bonus bei jedem Sieg (klar 15% / mit Verlusten 8% / Niederlage 2%
            vom Cap)
          </span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span className="info-label">⭐ Sandronator</span>
          <span className="info-value">Verdoppelt Beute UND Teile-Vergabe für die gesamte Mission, solange er überlebt</span>
        </div>
      </div>
    );
  }

  if (cfg.type === 'asteroid') {
    return (
      <div className="sektor-info-box">
        <div className="info-row">
          <span className="info-label">⛏️ Farm-Rate</span>
          <span className="info-value">
            {cfg.farmRate?.toLocaleString('de-DE')} Ressourcen/h je Mining-Schiff (50% Metall / 30% Kristall / 20% Deuterium)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🚀 Max. Mining-Schiffe</span>
          <span className="info-value">{cfg.miningCap} pro Einsatz</span>
        </div>
        <div className="info-row">
          <span className="info-label">🛡️ Max. Begleitschiffe</span>
          <span className="info-value">{cfg.escortCap} pro Einsatz</span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span className="info-label">🔮 Dunkle Materie</span>
          <span className="info-value">Bis zu {cfg.dmCap} DM pro vollem 4h-Einsatz (linear über die Zeit)</span>
        </div>
      </div>
    );
  }

  return null;
}

export function SektorPage() {
  const { gameData, state, sendMission, recallMission, joinEvent, savePreset, deletePreset, error } = useGame();
  const [selectedSektor, setSelectedSektor] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [eventSelection, setEventSelection] = useState<Record<string, number>>({});
  const [presetName, setPresetName] = useState('');
  const [infoOpenFor, setInfoOpenFor] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;
  const now = serverNow();

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Sektor</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {state.raid && !state.raid.resolved && (
        <div className="queue-box" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--danger)' }}>⚠ Piratenflotte im Anflug auf deine Heimatbasis</strong>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Ankunft in {formatTime(state.raid.arrivalTime - now)}. Verstärke deine Verteidigung oder rufe deine Flotte zurück.
          </p>
        </div>
      )}

      {state.event && !state.event.started && (
        <div className="queue-box" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--danger)' }}>⚠ {state.event.name}</strong>
          <p style={{ fontSize: 13, marginTop: 4, marginBottom: 8 }}>Noch {formatTime(state.event.deadline - now)} Zeit zum Eingreifen.</p>
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
          const infoOpen = infoOpenFor === sektor.id;

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

                <button className="qty-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setInfoOpenFor(infoOpen ? null : sektor.id)}>
                  {infoOpen ? 'Infos verbergen' : 'ℹ️ Alle Infos anzeigen'}
                </button>
                {infoOpen && <SektorInfoBox sektorId={sektor.id} gameData={gameData} />}

                {activeMission ? (
                  <>
                    <p style={{ fontSize: 13 }}>Flotte unterwegs</p>
                    <div className="progress-row">
                      <span>Fortschritt (Stunden im Sektor)</span>
                      <span>{activeMission.processedHours}/4</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${(activeMission.processedHours / 4) * 100}%` }} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Ertrag bisher: {Math.floor(activeMission.farmed.metall).toLocaleString('de-DE')} Metall,{' '}
                      {Math.floor(activeMission.farmed.kristall).toLocaleString('de-DE')} Kristall,{' '}
                      {Math.floor(activeMission.farmed.deuterium).toLocaleString('de-DE')} Deuterium
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {now < activeMission.arriveTime
                        ? `Anflug, Ankunft in ${formatTime(activeMission.arriveTime - now)}`
                        : now < activeMission.endTime
                        ? `Im Sektor, Rückflug in ${formatTime(activeMission.endTime - now)}`
                        : `Rückflug, Ankunft in ${formatTime(activeMission.returnTime - now)}`}
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
                      <input className="qty-input" placeholder="Name für Vorlage" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
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
