import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import type { GameData, Mission } from '../types/game';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'];

const SEKTOR_KLASSEN = [
  { id: 'asteroid', name: 'Asteroiden-Feld', match: (id: string) => id.startsWith('asteroid_') },
  { id: 'piraten', name: 'Piraten-Sektor', match: (id: string) => id.startsWith('piraten_') },
];

function availableFleetForSektor(sektorId: string, sektorConfig: Record<string, { type: string }>): string[] {
  const cfg = sektorConfig[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

function SektorInfoBox({ sektorId, gameData }: { sektorId: string; gameData: GameData }) {
  const cfg = gameData.sektorConfig[sektorId];

  if (sektorId.startsWith('piraten_')) {
    const shipTags = gameData.ships.filter((s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff');
    const rollTable = gameData.piratenMultiplierRoll[sektorId] || [];
    const multiplierRollText = rollTable.map((v) => Math.round(v * 100) + '%').join(' / ');
    const defenseFactor = sektorId === 'piraten_niedrig' ? 5 : sektorId === 'piraten_mittel' ? 10 : 15;
    const containerCfg = cfg.captainContainerTier ? gameData.containerTypes[cfg.captainContainerTier] : null;

    return (
      <div className="sektor-info-box">
        <div className="info-row">
          <span className="info-label">👾 Mögliche Piraten-Schiffe</span>
          <span className="info-value">
            {shipTags.map((s) => (
              <span className="piraten-pool-tag" key={s.id}>
                {s.name}
              </span>
            ))}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🏰 Mögliche Verteidigungsanlagen</span>
          <span className="info-value">
            {gameData.defenses.map((d) => (
              <span className="piraten-pool-tag" key={d.id}>
                {d.name}
              </span>
            ))}
          </span>
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
        <div className="info-row">
          <span className="info-label">⭐ Sandronator</span>
          <span className="info-value">Verdoppelt Beute UND Teile-Vergabe für die gesamte Mission, solange er überlebt</span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none', fontSize: 11, color: 'var(--text-dim)' }}>
          <span className="info-label">💡 Taktischer Hinweis</span>
          <span className="info-value">
            RapidFire-Matchups gelten unabhängig vom Sektor: Schwere Jäger gegen Leichte Jäger, Kreuzer gegen Leichte Jäger, Schlachtschiffe gegen
            Kreuzer, Schlachtkreuzer stark gegen Schwere Jäger/Kreuzer/Schlachtschiffe, Bomber stark gegen alle Verteidigungsanlagen.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="sektor-info-box">
      <div className="info-row">
        <span className="info-label">⛏️ Abbaurate</span>
        <span className="info-value">{cfg.farmRate?.toLocaleString('de-DE')} Ressourcen/h pro Mining-Schiff (50% Metall / 30% Kristall / 20% Deuterium)</span>
      </div>
      <div className="info-row">
        <span className="info-label">🚀 Max. Mining-Schiffe pro Einsatz</span>
        <span className="info-value">{cfg.miningCap}</span>
      </div>
      <div className="info-row">
        <span className="info-label">🌑 Dunkle Materie</span>
        <span className="info-value">Bis zu {cfg.dmCap} DM pro vollem 4h-Einsatz (linear über die Zeit)</span>
      </div>
      <div className="info-row">
        <span className="info-label">✅ Sicherheit ohne Begleitschiff</span>
        <span className="info-value">Kein Feindkontakt möglich - risikofreies Farmen</span>
      </div>
      <div className="info-row">
        <span className="info-label">🛡️ Begleitschiff (optional)</span>
        <span className="info-value">
          Max. {cfg.escortCap} pro Einsatz · Bei jedem Stunden-Check garantiert ein kleiner Piraten-Überfall (nur Leichte/Schwere Jäger) mit{' '}
          {(gameData.asteroidEscortPowerMin * 100).toFixed(0)}–{(gameData.asteroidEscortPowerMax * 100).toFixed(0)}% deiner Begleitschiff-Power
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">💰 Bonus-Beute pro vernichtetem Piratenschiff</span>
        <span className="info-value">
          {gameData.asteroidEscortKillReward.metall.toLocaleString('de-DE')} Metall, {gameData.asteroidEscortKillReward.kristall.toLocaleString('de-DE')}{' '}
          Kristall, {gameData.asteroidEscortKillReward.deuterium.toLocaleString('de-DE')} Deuterium - gutgeschrieben bei Rückkehr
        </span>
      </div>
      <div className="info-row" style={{ borderBottom: 'none' }}>
        <span className="info-label">⭐ Sandronator</span>
        <span className="info-value">Verdoppelt die gesamte Ausbeute (Ressourcen + DM) für die Mission</span>
      </div>
    </div>
  );
}

function MissionStatus({ mission, now }: { mission: Mission; now: number }) {
  let status: string;
  let remaining: number;
  let phaseStart: number;
  let phaseEnd: number;
  if (now < mission.arriveTime) {
    status = 'Im Anflug';
    remaining = mission.arriveTime - now;
    phaseStart = mission.startTime;
    phaseEnd = mission.arriveTime;
  } else if (now < mission.endTime) {
    status = 'Im Sektor';
    remaining = mission.endTime - now;
    phaseStart = mission.arriveTime;
    phaseEnd = mission.endTime;
  } else {
    status = 'Im Rückflug';
    remaining = mission.returnTime - now;
    phaseStart = mission.endTime;
    phaseEnd = mission.returnTime;
  }
  const pct = Math.min(100, Math.max(0, ((now - phaseStart) / (phaseEnd - phaseStart)) * 100));
  const teileSum = mission.teile.waffen + mission.teile.schild + mission.teile.panzerung;

  return (
    <div className="queue-box">
      <div className="queue-item">
        <span>{status}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="queue-item">
        <span>Verbleibend</span>
        <span>{formatTime(remaining)}</span>
      </div>
      <div className="queue-item">
        <span>Bisher erbeutet</span>
        <span>
          {Math.floor(mission.farmed.metall).toLocaleString('de-DE')} Metall / {Math.floor(mission.farmed.kristall).toLocaleString('de-DE')} Kristall /{' '}
          {Math.floor(mission.farmed.deuterium).toLocaleString('de-DE')} Deuterium
          {teileSum > 0 &&
            ` · W-Teile ${Math.floor(mission.teile.waffen)} / S-Teile ${Math.floor(mission.teile.schild)} / P-Teile ${Math.floor(mission.teile.panzerung)}`}
        </span>
      </div>
    </div>
  );
}

export function SektorPage() {
  const { gameData, state, sendMission, recallMission, joinEvent, savePreset, deletePreset, error } = useGame();
  const [tab, setTab] = useState('asteroid');
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
  const now = serverNow();
  const activeKlasse = SEKTOR_KLASSEN.find((k) => k.id === tab)!;
  const sektorenInTab = gameData.sektoren.filter((s) => activeKlasse.match(s.id));

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

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {SEKTOR_KLASSEN.map((k) => (
          <button key={k.id} className={`nav-btn${tab === k.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      <div className="ship-grid">
        {sektorenInTab.map((sektor) => {
          const cfg = gameData.sektorConfig[sektor.id];
          const activeMission = state.missions.find((m) => m.sektorId === sektor.id && !m.finalized);
          const availableIds = availableFleetForSektor(sektor.id, gameData.sektorConfig);

          return (
            <div className="ship-card" key={sektor.id}>
              <img className="ship-img" src={`/${sektor.img}`} alt={sektor.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>{sektor.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Typ: {sektor.typ} · {sektor.zweck}
                </p>
                <div className="ship-stats">
                  <span className="level-gruen">Aktivität: {sektor.aktivitaet}</span>
                  <span>Gefahrenstufe: {sektor.gefahr}</span>
                </div>

                <SektorInfoBox sektorId={sektor.id} gameData={gameData} />

                {activeMission ? (
                  <>
                    <MissionStatus mission={activeMission} now={now} />
                    <div className="build-row">
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Vorzeitiger Abbruch holt Flotte + bisherigen Ertrag sofort zurück.</span>
                      <button className="qty-btn" style={{ color: 'var(--danger)' }} onClick={() => recallMission(activeMission.id)}>
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
                  <button className="build-btn" onClick={() => setSelectedSektor(sektor.id)}>
                    Entsenden
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
