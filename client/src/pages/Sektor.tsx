import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { shipName, SHIP_GROUPS } from '../lib/combatInfo';
import { useGalaxyPreview } from '../lib/useGalaxyPreview';
import { SimulatorView } from './Simulator';
import { WeeklyEventBanner } from '../components/WeeklyEventBanner';
import type { GameData, Mission } from '../types/game';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];

const SEKTOR_KLASSEN = [
  { id: 'asteroid', name: 'Asteroiden-Feld', match: (id: string) => id.startsWith('asteroid_') },
  { id: 'piraten', name: 'Piraten-Sektor', match: (id: string) => id.startsWith('piraten_') },
  { id: 'simulator', name: '🎯 Kampfsimulator', match: () => false },
];

function SektorCard({
  sektor,
  cfg,
  activeMission,
  blockedByOtherWinContainer,
  availableIds,
  position,
  isSelected,
  selection,
  setSelection,
  fleet,
  now,
  presetName,
  setPresetName,
  savePreset,
  sendMission,
  setSelectedSektor,
  recallMission,
  setFleetMissionId,
  setInfoSektorId,
  gameData,
}: {
  sektor: GameData['sektoren'][number];
  cfg: GameData['sektorConfig'][string];
  activeMission: Mission | undefined;
  blockedByOtherWinContainer: boolean;
  availableIds: string[];
  position: { system: number; position: number } | undefined;
  isSelected: boolean;
  selection: Record<string, number>;
  setSelection: (fn: (p: Record<string, number>) => Record<string, number>) => void;
  fleet: Record<string, number>;
  now: number;
  presetName: string;
  setPresetName: (v: string) => void;
  savePreset: (name: string, ships: Record<string, number>) => void;
  sendMission: (sektorId: string, ships: Record<string, number>) => void;
  setSelectedSektor: (id: string | null) => void;
  recallMission: (missionId: string) => void;
  setFleetMissionId: (id: string | null) => void;
  setInfoSektorId: (id: string | null) => void;
  gameData: GameData;
}) {
  // Eigene Komponenteninstanz pro Karte - WICHTIG fuer die Hook-Regeln: die Anzahl der Sektoren
  // pro Tab variiert (3 Asteroiden-Sektoren, aber 4 Piraten-Sektoren, da piraten_elite mit
  // "piraten_" beginnt und mitgezaehlt wird). Wuerde useGalaxyPreview() stattdessen direkt in
  // einer .map()-Schleife der uebergeordneten Seite aufgerufen, aenderte sich die Anzahl der
  // Hook-Aufrufe beim Tab-Wechsel innerhalb DERSELBEN Komponente - React error #310 ("Rendered
  // more hooks than during the previous render"), die App stuerzt komplett ab. Als eigene
  // Komponente hat jede Karte ihren EIGENEN, stabilen Hook-Aufruf, unabhaengig davon wie viele
  // Karten insgesamt gerendert werden (exakt dasselbe Muster wie PendingInviteCard in
  // Multiplayer.tsx).
  const preview = useGalaxyPreview(isSelected ? selection : {}, isSelected ? position || null : null);

  return (
    <div className="ship-card">
      <img className="ship-img" src={`/${sektor.img}`} alt={sektor.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      <div className="ship-info">
        <h3>{sektor.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Typ: {sektor.typ} · {sektor.zweck}
        </p>
        {position && (
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            📍 Position 1:{position.system}:{position.position}
          </p>
        )}
        <div className="ship-stats">
          <span className="level-gruen">Aktivität: {sektor.aktivitaet}</span>
          <span>Gefahrenstufe: {sektor.gefahr}</span>
        </div>

        <button className="qty-btn" style={{ alignSelf: 'flex-start', marginBottom: 4 }} onClick={() => setInfoSektorId(sektor.id)}>
          ℹ️ Info
        </button>

        {activeMission ? (
          <>
            <MissionStatus mission={activeMission} now={now} onShowFleet={() => setFleetMissionId(activeMission.id)} cfg={cfg} piratenCheckCount={gameData.piratenCheckCount} />
            <div className="build-row">
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Vorzeitiger Abbruch holt Flotte + bisherigen Ertrag sofort zurück.</span>
              <button className="qty-btn" style={{ color: 'var(--danger)' }} onClick={() => recallMission(activeMission.id)}>
                Zurückrufen
              </button>
            </div>
          </>
        ) : isSelected ? (
          <>
            {(() => {
              const renderRow = (id: string) => {
                const avail = fleet[id] || 0;
                if (avail === 0) return null;
                const cap = id === 'mining' ? cfg.miningCap : id === 'begleitschiff' ? cfg.escortCap : undefined;
                const maxSendable = cap ? Math.min(avail, cap) : avail;
                const qty = selection[id] || 0;
                return (
                  <div className="queue-item" key={id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                    <span>
                      {shipName(gameData, id)} (verfügbar: {avail}
                      {cap ? `, max ${cap}` : ''})
                    </span>
                    {/* Direktes Eingabefeld statt +/- Buttons-Reihe (Nutzerentscheidung, Platz-/
                        Übersichts-Fix 04.08.2026) - siehe FleetPicker in Multiplayer.tsx fuer dieselbe
                        Umstellung samt Begruendung. */}
                    <span className="qty-row" style={{ gap: 6, alignItems: 'center' }}>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        max={maxSendable}
                        placeholder="0"
                        value={qty === 0 ? '' : qty}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            setSelection((p) => ({ ...p, [id]: 0 }));
                            return;
                          }
                          const n = parseInt(raw, 10);
                          if (Number.isNaN(n)) return;
                          setSelection((p) => ({ ...p, [id]: Math.max(0, Math.min(maxSendable, n)) }));
                        }}
                      />
                      <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: maxSendable }))}>Alle</button>
                    </span>
                  </div>
                );
              };
              // Gruppen-Ueberschriften (siehe SHIP_GROUPS) nur, wenn die Sektor-Flotte ueberhaupt aus
              // Kampfschiffen besteht (Piraten-Sektoren) - bei Asteroiden-Feldern (mining/begleitschiff/
              // sandronator) passt die Klassen-Einteilung nicht, dort bleibt die Liste flach.
              const isCombatFleet = availableIds.includes('leicht');
              if (!isCombatFleet) {
                return availableIds.map(renderRow);
              }
              return SHIP_GROUPS.map((group) => {
                const idsInGroup = group.ids.filter((id) => availableIds.includes(id) && (fleet[id] || 0) > 0);
                if (idsInGroup.length === 0) return null;
                return (
                  <div key={group.name} style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-kristall)', margin: '6px 0 2px' }}>{group.name}</p>
                    {idsInGroup.map(renderRow)}
                  </div>
                );
              });
            })()}
            {preview.loading && <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Berechne Flugroute...</p>}
            {preview.preview && !preview.loading && <p style={{ fontSize: 13, marginTop: 6 }}>Anflugzeit: {formatTime(preview.preview.durationMs)} (Rückflug identisch)</p>}
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
                  setSelection(() => ({}));
                }}
              >
                Abbrechen
              </button>
              <button
                className="build-btn"
                onClick={() => {
                  sendMission(sektor.id, selection);
                  setSelection(() => ({}));
                  setSelectedSektor(null);
                }}
              >
                Entsenden
              </button>
            </div>
          </>
        ) : blockedByOtherWinContainer ? (
          <>
            <button className="build-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Entsenden
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Nur EINE Piraten-Sektor-Stufe gleichzeitig beflogbar - erst zurückrufen oder abwarten.</p>
          </>
        ) : (
          <button className="build-btn" onClick={() => setSelectedSektor(sektor.id)}>
            Entsenden
          </button>
        )}
      </div>
    </div>
  );
}

function availableFleetForSektor(sektorId: string, sektorConfig: Record<string, { type: string }>): string[] {
  const cfg = sektorConfig[sektorId];
  if (cfg?.type === 'asteroid') return ['mining', 'begleitschiff', 'sandronator'];
  return [...COMBAT_SHIP_IDS, 'imperator'];
}

export function SektorInfoBox({ sektorId, gameData }: { sektorId: string; gameData: GameData }) {
  const cfg = gameData.sektorConfig[sektorId];

  if (sektorId === 'piraten_admiral') {
    return (
      <div className="sektor-info-box">
        <div className="info-row">
          <span className="info-label">👑 Gegner</span>
          <span className="info-value">
            <strong style={{ color: 'var(--danger-bright)' }}>Piratenadmiral</strong> + Elite-Eskorte, skaliert 110-150% der Flottenstärke
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🚢 Zugang</span>
          <span className="info-value">
            Nur <strong style={{ color: 'var(--accent-kristall)' }}>Kreuzer-Klasse und größer</strong>
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">⏱️ Ablauf</span>
          <span className="info-value">
            Bis zu <strong style={{ color: 'var(--accent-deut)' }}>6 Kämpfe</strong>, alle{' '}
            <strong style={{ color: 'var(--accent-deut)' }}>10 Min</strong> (max. 1h) · Admiral wird pro Kampf{' '}
            <strong style={{ color: 'var(--danger-bright)' }}>+15% stärker</strong>
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🤔 Nach jedem Sieg</span>
          <span className="info-value">
            <strong style={{ color: 'var(--accent-deut)' }}>Sichern &amp; abziehen</strong> oder{' '}
            <strong style={{ color: 'var(--danger-bright)' }}>weitermachen</strong> - bei Niederlage danach geht nur die ungesicherte Beute
            verloren, nicht die Flotte
          </span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span className="info-label">🏆 Beute</span>
          <span className="info-value">
            Wächst mit überstandenen Kämpfen · bei echtem Sieg zusätzlich große Einmalprämie + exklusiver DM-Bonus
          </span>
        </div>
      </div>
    );
  }

  if (sektorId.startsWith('piraten_')) {
    const shipTags = gameData.ships.filter((s) => !s.specialOnly && !s.unique && s.id !== 'mining' && s.id !== 'begleitschiff');
    const rollTable = gameData.piratenMultiplierRoll[sektorId] || [];
    const rollChances = ['50%', '30%', '20%'];
    const multiplierRollText = rollTable
      .map((v, i) => `${(Array.isArray(v) ? `${Math.round(v[0] * 100)}-${Math.round(v[1] * 100)}%` : Math.round(v * 100) + '%')} (${rollChances[i]})`)
      .join(' / ');
    const defenseFactor = sektorId === 'piraten_niedrig' ? 5 : sektorId === 'piraten_mittel' ? 10 : 15;
    const containerCfg = cfg.captainContainerTier ? gameData.containerTypes[cfg.captainContainerTier] : null;

    return (
      <div className="sektor-info-box">
        <div className="info-row">
          <span className="info-label">👾 Mögliche Piraten-Schiffe</span>
          <span className="info-value">
            {shipTags.map((s) => (
              <span className="piraten-pool-tag ship" key={s.id}>
                {s.name}
              </span>
            ))}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🏰 Mögliche Verteidigungsanlagen</span>
          <span className="info-value">
            {gameData.defenses.map((d) => (
              <span className="piraten-pool-tag defense" key={d.id}>
                {d.name}
              </span>
            ))}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🎲 Feindstärke (pro Check, alle 4h)</span>
          <span className="info-value">
            <strong style={{ color: 'var(--danger-bright)' }}>{multiplierRollText}</strong> deiner Kampf-Power
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🛡️ Verteidigung</span>
          <span className="info-value">
            <strong style={{ color: 'var(--accent-kristall)' }}>{defenseFactor}%</strong> deiner Power zusätzlich
          </span>
        </div>
        {cfg.winContainer ? (
          <>
            <div className="info-row">
              <span className="info-label">📦 Belohnung pro gewonnenem Kampf</span>
              <span className="info-value">
                <strong style={{ color: cfg.winContainer.tier === 'elite' ? 'var(--rf-gold)' : cfg.winContainer.tier === 'gold' ? 'var(--rf-gold)' : 'var(--accent-kristall)' }}>
                  {cfg.winContainer.count}x {cfg.winContainer.tier === 'elite' ? 'Elite' : cfg.winContainer.tier === 'gold' ? 'Gold' : 'Silber'}-Container
                </strong>{' '}
                - sammelt sich über die ganze Mission, Gutschrift erst bei Rückkehr/Rückruf
              </span>
            </div>
            {cfg.winResources ? (
              <div className="info-row">
                <span className="info-label">💰 Ressourcen-Paket pro gewonnenem Kampf</span>
                <span className="info-value">
                  <strong style={{ color: 'var(--accent-metall)' }}>
                    {cfg.winResources.metall.toLocaleString('de-DE')} Metall, {cfg.winResources.kristall.toLocaleString('de-DE')} Kristall,{' '}
                    {cfg.winResources.deuterium.toLocaleString('de-DE')} Deuterium
                  </strong>{' '}
                  - gleicher Rhythmus wie die Container
                </span>
              </div>
            ) : null}
            <div className="info-row">
              <span className="info-label">⭐ Sandronator</span>
              <span className="info-value">
                <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt</strong> die Container-Ausbeute, solange er überlebt
              </span>
            </div>
          </>
        ) : (
          <>
            {cfg.captainChance ? (
              <div className="info-row">
                <span className="info-label">☠ Piratenkapitän</span>
                <span className="info-value">
                  <strong style={{ color: 'var(--rf-gold)' }}>{(cfg.captainChance * 100).toFixed(0)}%</strong> Chance pro Kampf ·{' '}
                  <strong style={{ color: containerCfg?.color || 'var(--text)' }}>{containerCfg?.name}</strong> +{' '}
                  <strong style={{ color: 'var(--accent-dm)' }}>{cfg.captainDm} DM</strong> bei Sieg
                </span>
              </div>
            ) : null}
            <div className="info-row">
              <span className="info-label">📈 Sieges-Serie</span>
              <span className="info-value">
                <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt</strong> pro Sieg in Folge (max.{' '}
                <strong style={{ color: 'var(--accent-dm)' }}>8x</strong>) - bricht bei einem Check ohne Sieg ab
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">💰 Beute pro Sieg</span>
              <span className="info-value">
                <strong style={{ color: 'var(--accent-metall)' }}>{cfg.lootBase?.metall.toLocaleString('de-DE')} Metall</strong>,{' '}
                <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.lootBase?.kristall.toLocaleString('de-DE')} Kristall</strong>,{' '}
                <strong style={{ color: 'var(--accent-deut)' }}>{cfg.lootBase?.deuterium.toLocaleString('de-DE')} Deuterium</strong> ·{' '}
                {((cfg.bonusLootChance || 0) * 100).toFixed(0)}% auf {cfg.bonusLootMultiplier}x
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">🔧 Teile pro Check (bis Cap {cfg.teileCap})</span>
              <span className="info-value">
                Klarer Sieg <strong style={{ color: 'var(--accent-deut)' }}>15%</strong> · mit Verlusten{' '}
                <strong style={{ color: 'var(--rf-gold)' }}>8%</strong> · Niederlage <strong style={{ color: 'var(--danger-bright)' }}>2%</strong> vom
                Cap
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">⭐ Sandronator</span>
              <span className="info-value">
                <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt</strong> Beute und Teile, solange er überlebt
              </span>
            </div>
          </>
        )}
        <div className="info-row" style={{ borderBottom: 'none', fontSize: 11, color: 'var(--text-dim)' }}>
          <span className="info-label">💡 RapidFire-Kontern</span>
          <span className="info-value">
            Schwerer Jäger → Leichter Jäger · Kreuzer → Schwerer Jäger · Schlachtschiff → Kreuzer · Schlachtkreuzer → kleine Klassen ·
            Zerstörer/Reaper → Schlachtkreuzer/Bomber · Bomber → Verteidigungsanlagen
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="sektor-info-box">
      <div className="info-row">
        <span className="info-label">⛏️ Abbaurate</span>
        <span className="info-value">
          <strong style={{ color: 'var(--text)' }}>{cfg.farmRate?.toLocaleString('de-DE')}</strong> Ressourcen/h pro Mining-Schiff
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🚀 Max. Mining-Schiffe</span>
        <span className="info-value">
          <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.miningCap}</strong>
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🌑 Dunkle Materie</span>
        <span className="info-value">
          Bis zu <strong style={{ color: 'var(--accent-dm)' }}>{cfg.dmCap} DM</strong> pro vollem 24h-Einsatz
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🛡️ Begleitschiff (optional)</span>
        <span className="info-value">
          Max. <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.escortCap}</strong> · Überfall-Chance mit{' '}
          <strong style={{ color: 'var(--danger-bright)' }}>
            {(gameData.asteroidEscortPowerMin * 100).toFixed(0)}–{(gameData.asteroidEscortPowerMax * 100).toFixed(0)}%
          </strong>{' '}
          Begleitschiff-Power
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">💰 Bonus-Beute pro Kill</span>
        <span className="info-value">
          <strong style={{ color: 'var(--accent-metall)' }}>{gameData.asteroidEscortKillReward.metall.toLocaleString('de-DE')} Metall</strong>,{' '}
          <strong style={{ color: 'var(--accent-kristall)' }}>{gameData.asteroidEscortKillReward.kristall.toLocaleString('de-DE')} Kristall</strong>,{' '}
          <strong style={{ color: 'var(--accent-deut)' }}>{gameData.asteroidEscortKillReward.deuterium.toLocaleString('de-DE')} Deuterium</strong>
        </span>
      </div>
      <div className="info-row" style={{ borderBottom: 'none' }}>
        <span className="info-label">⭐ Sandronator</span>
        <span className="info-value">
          <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt</strong> die gesamte Ausbeute (Ressourcen + DM) für die Mission
        </span>
      </div>
    </div>
  );
}

function MissionStatus({
  mission,
  now,
  onShowFleet,
  cfg,
  piratenCheckCount,
}: {
  mission: Mission;
  now: number;
  onShowFleet: () => void;
  cfg: GameData['sektorConfig'][string];
  piratenCheckCount: number;
}) {
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
  const shipCount = Object.values(mission.ships).reduce((a, b) => a + (b || 0), 0);

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
      {cfg.type === 'piraten' && mission.processedHours > 0 && (
        <div className="queue-item">
          <span>⚔️ Kämpfe bisher</span>
          <span>
            {mission.processedHours}/{piratenCheckCount} Checks
            {cfg.winContainer ? ` · ${mission.combatWins || 0} gewonnen` : ''}
          </span>
        </div>
      )}
      <div className="queue-item">
        <span>🚀 Flotte vor Ort</span>
        <span>
          {shipCount.toLocaleString('de-DE')} Schiffe ·{' '}
          <button className="qty-btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={onShowFleet}>
            Details
          </button>
        </span>
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
  const { gameData, state, sendMission, recallMission, savePreset, deletePreset, sektorPositions, error } = useGame();
  const [tab, setTab] = useState('asteroid');
  const [selectedSektor, setSelectedSektor] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [presetName, setPresetName] = useState('');
  const [infoSektorId, setInfoSektorId] = useState<string | null>(null);
  const [fleetMissionId, setFleetMissionId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <PageSkeleton />;
  const now = serverNow();
  const activeKlasse = SEKTOR_KLASSEN.find((k) => k.id === tab)!;
  const sektorenInTab = gameData.sektoren.filter((s) => activeKlasse.match(s.id) && !gameData.sektorConfig[s.id]?.multiplayerOnly);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Sektor</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <WeeklyEventBanner />

      {state.raid && (
        <div className="queue-box" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--danger)' }}>⚠ Piratenflotte im Anflug auf deine Heimatbasis</strong>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            {now < state.raid.arrivalTime
              ? `Ankunft der ersten Welle in ${formatTime(state.raid.arrivalTime - now)}.`
              : `Welle ${Math.min(state.raid.wavesProcessed + 1, state.raid.waveTimes.length)}/${state.raid.waveTimes.length} - nächste in ${formatTime(
                  Math.max(0, (state.raid.waveTimes[state.raid.wavesProcessed] ?? now) - now)
                )}. Bisher ${state.raid.wavesWon} von ${state.raid.wavesProcessed} abgewehrt.`}{' '}
            Verstärke deine Verteidigung oder rufe deine Flotte zurück.
          </p>
        </div>
      )}

      {(() => {
        // "Frischling-Bonus" (Nutzerentscheidung 04.08.2026): 3x Asteroiden-Mining-Ertrag in den
        // ersten 7 Tagen nach Konto-Erstellung - siehe isNoviceAccount()/miningMultiplier() in
        // missions.ts. Restzeit hier nur zur Anzeige neu berechnet, die tatsaechliche Wirkung
        // laeuft serverseitig rein ueber state.createdAt.
        const remaining = gameData.noviceBonusWindowMs - (now - state.createdAt);
        if (remaining <= 0) return null;
        return (
          <div className="queue-box" style={{ borderColor: 'var(--accent-deut)', marginBottom: 16 }}>
            <strong style={{ color: 'var(--accent-deut)' }}>
              ⭐ Frischling-Bonus aktiv: {gameData.noviceBonusMultiplier}x Ertrag beim Asteroiden-Mining
            </strong>
            <p style={{ fontSize: 13, marginTop: 4 }}>Noch {formatTime(remaining)} - gilt automatisch für alle Mining-Schiffe, kein Kauf nötig.</p>
          </div>
        );
      })()}

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

      {tab === 'simulator' ? (
        <SimulatorView />
      ) : (
      <div className="ship-grid">
        {sektorenInTab.map((sektor) => {
          const cfg = gameData.sektorConfig[sektor.id];
          const activeMission = state.missions.find((m) => m.sektorId === sektor.id && !m.finalized);
          // Piraten-Sektor Niedrig/Mittel/Hoch (erkannt an cfg.winContainer) sind gegenseitig
          // exklusiv - Server lehnt das Senden ab, solange irgendeine ANDERE Stufe noch aktiv ist
          // (siehe sendFleet() in missions.ts, README Punkt 112). Client spiegelt dieselbe Regel,
          // damit der Button gar nicht erst anklickbar ist statt erst nach dem Senden abgelehnt zu
          // werden.
          const blockedByOtherWinContainer = Boolean(
            cfg.winContainer && state.missions.some((m) => !m.finalized && m.sektorId !== sektor.id && gameData.sektorConfig[m.sektorId]?.winContainer)
          );
          const availableIds = availableFleetForSektor(sektor.id, gameData.sektorConfig);
          const position = sektorPositions.find((p) => p.sektorId === sektor.id);
          const isSelected = selectedSektor === sektor.id;

          return (
            <SektorCard
              key={sektor.id}
              sektor={sektor}
              cfg={cfg}
              activeMission={activeMission}
              blockedByOtherWinContainer={blockedByOtherWinContainer}
              availableIds={availableIds}
              position={position}
              isSelected={isSelected}
              selection={isSelected ? selection : {}}
              setSelection={setSelection}
              fleet={state.fleet}
              now={now}
              presetName={presetName}
              setPresetName={setPresetName}
              savePreset={savePreset}
              sendMission={sendMission}
              setSelectedSektor={setSelectedSektor}
              recallMission={recallMission}
              setFleetMissionId={setFleetMissionId}
              setInfoSektorId={setInfoSektorId}
              gameData={gameData}
            />
          );
        })}
      </div>
      )}

      {infoSektorId &&
        (() => {
          const sektor = gameData.sektoren.find((s) => s.id === infoSektorId)!;
          return (
            <InfoModal title={sektor.name} onClose={() => setInfoSektorId(null)}>
              <SektorInfoBox sektorId={infoSektorId} gameData={gameData} />
            </InfoModal>
          );
        })()}

      {fleetMissionId &&
        (() => {
          const mission = state.missions.find((m) => m.id === fleetMissionId && !m.finalized);
          if (!mission) return null;
          const sektor = gameData.sektoren.find((s) => s.id === mission.sektorId);
          const rows: [string, string][] = Object.entries(mission.ships)
            .filter(([, c]) => c > 0)
            .map(([id, c]) => [shipName(gameData, id), `${c.toLocaleString('de-DE')} Stück`]);
          return (
            <InfoModal title={`🚀 Flotte vor Ort${sektor ? ` – ${sektor.name}` : ''}`} onClose={() => setFleetMissionId(null)}>
              <InfoTable rows={rows} />
            </InfoModal>
          );
        })()}
    </div>
  );
}
