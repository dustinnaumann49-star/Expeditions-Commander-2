import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { shipName } from '../lib/combatInfo';
import { useGalaxyPreview } from '../lib/useGalaxyPreview';
import { SimulatorView } from './Simulator';
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
            <MissionStatus mission={activeMission} now={now} onShowFleet={() => setFleetMissionId(activeMission.id)} />
            <div className="build-row">
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Vorzeitiger Abbruch holt Flotte + bisherigen Ertrag sofort zurück.</span>
              <button className="qty-btn" style={{ color: 'var(--danger)' }} onClick={() => recallMission(activeMission.id)}>
                Zurückrufen
              </button>
            </div>
          </>
        ) : isSelected ? (
          <>
            {availableIds.map((id) => {
              const avail = fleet[id] || 0;
              if (avail === 0) return null;
              const cap = id === 'mining' ? cfg.miningCap : id === 'begleitschiff' ? cfg.escortCap : undefined;
              const maxSendable = cap ? Math.min(avail, cap) : avail;
              const qty = selection[id] || 0;
              return (
                <div className="queue-item" key={id}>
                  <span>
                    {shipName(gameData, id)} (verfügbar: {avail}
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
            Ein einzelner, extrem zäher <strong style={{ color: 'var(--danger-bright)' }}>Piratenadmiral</strong> + kleine Elite-Eskorte (wenige
            große Schiffe statt vieler kleiner) - beide skalieren mit eurer eingesetzten Flottenstärke, ähnlich wie beim Elite-Bollwerk, aber
            deutlich härter (110-150% statt 105-135%).
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🚢 Zugangsvoraussetzung</span>
          <span className="info-value">
            Nur <strong style={{ color: 'var(--accent-kristall)' }}>Kreuzer-Klasse und größere Schiffe</strong> erlaubt - keine Jäger, keine
            Versorgungsschiffe.
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">⏱️ Ablauf</span>
          <span className="info-value">
            Bis zu <strong style={{ color: 'var(--accent-deut)' }}>6 Kämpfe</strong> im Abstand von je{' '}
            <strong style={{ color: 'var(--accent-deut)' }}>10 Minuten</strong> (max. 1 Stunde Gesamtdauer)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🔥 Eskalierende Wut</span>
          <span className="info-value">
            Der Admiral wird mit jedem weiteren Kampf <strong style={{ color: 'var(--danger-bright)' }}>+15% stärker</strong> (Waffen/Schild/
            Panzerung), solange er nicht besiegt wurde
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🤔 Entscheidung nach jedem gewonnenen Kampf</span>
          <span className="info-value">
            Beute <strong style={{ color: 'var(--accent-deut)' }}>sichern und abziehen</strong> (sicher), oder{' '}
            <strong style={{ color: 'var(--danger-bright)' }}>weitermachen</strong> für mehr - bei einer Niederlage danach geht nur die noch
            ungesicherte Beute verloren, NICHT die Flotte
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">💰 Beute bei Abzug</span>
          <span className="info-value">
            Moderat mit der Anzahl überstandener Kämpfe wachsend (kein Verdopplungs-Modus wie beim Elite-Bollwerk)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🏆 Beute bei echtem Sieg</span>
          <span className="info-value">
            Große Einmal-Prämie + exklusiver Dunkle-Materie-Bonus, den es sonst nirgends gibt
          </span>
        </div>
      </div>
    );
  }

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
          <span className="info-label">🚢 Schiffsklassen im Pool</span>
          <span className="info-value">
            Alle Kampfschiff-Typen möglich, in jedem Sektor – kleine/günstige Schiffe deutlich häufiger als seltene Elite-Schiffe. Piraten sind
            (bis auf den einzigartigen Sandronator und den Imperator) nicht mehr an Baugrenzen gebunden, genau wie du selbst.
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🎲 Feindstärke (wird pro Stunden-Check gewürfelt)</span>
          <span className="info-value">
            <strong style={{ color: 'var(--danger-bright)' }}>{multiplierRollText}</strong> deiner Kampf-Power · gelegentlich auch deutlich
            schwächer oder stärker als üblich
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🌊 Zusammensetzung</span>
          <span className="info-value">Variiert von Kampf zu Kampf – mal viele kleine Schiffe, mal wenige starke</span>
        </div>
        <div className="info-row">
          <span className="info-label">⚡ Unvorhersehbare Umstände</span>
          <span className="info-value">Seltene Sonderbedingungen können einzelne Kämpfe zu deinen Gunsten oder Ungunsten beeinflussen</span>
        </div>
        <div className="info-row">
          <span className="info-label">🛡️ Verteidigung</span>
          <span className="info-value">
            <strong style={{ color: 'var(--accent-kristall)' }}>{defenseFactor}%</strong> deiner Power (zusätzlicher Mix aus Verteidigungsanlagen)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">☠ Piratenkapitän-Event</span>
          <span className="info-value">
            <strong style={{ color: 'var(--rf-gold)' }}>{((cfg.captainChance || 0) * 100).toFixed(0)}%</strong> Chance pro Kampf · Belohnung bei
            Sieg: <strong style={{ color: containerCfg?.color || 'var(--text)' }}>{containerCfg?.name}</strong> +{' '}
            <strong style={{ color: 'var(--accent-dm)' }}>{cfg.captainDm} DM</strong>
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">📈 Sieges-Serie</span>
          <span className="info-value">
            {sektorId === 'piraten_elite' ? (
              <>
                <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt sich</strong> mit jedem aufeinanderfolgenden Sieg in derselben Expedition
                (bis zu <strong style={{ color: 'var(--accent-dm)' }}>8x</strong> nach 4 Siegen in Folge) - wirkt auf Beute und Teile-Bonus
              </>
            ) : (
              <>
                Beute und Teile-Bonus steigen mit jedem aufeinanderfolgenden Sieg in derselben Mission um{' '}
                <strong style={{ color: 'var(--accent-deut)' }}>
                  {sektorId === 'piraten_niedrig' ? '+10%' : sektorId === 'piraten_mittel' ? '+20%' : '+35%'}
                </strong>{' '}
                (max.{' '}
                <strong style={{ color: 'var(--accent-deut)' }}>
                  {sektorId === 'piraten_niedrig' ? '130%' : sektorId === 'piraten_mittel' ? '160%' : '205%'}
                </strong>
                )
              </>
            )}{' '}
            - bricht bei einem Check ohne vernichteten Gegner ab
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">💰 Beute pro Sieg</span>
          <span className="info-value">
            <strong style={{ color: 'var(--accent-metall)' }}>{cfg.lootBase?.metall.toLocaleString('de-DE')} Metall</strong>,{' '}
            <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.lootBase?.kristall.toLocaleString('de-DE')} Kristall</strong>,{' '}
            <strong style={{ color: 'var(--accent-deut)' }}>{cfg.lootBase?.deuterium.toLocaleString('de-DE')} Deuterium</strong> ·{' '}
            {((cfg.bonusLootChance || 0) * 100).toFixed(0)}% Chance auf {cfg.bonusLootMultiplier}x Volltreffer (vor Sieges-Serie-Bonus)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">🔧 Teile-Sammlung</span>
          <span className="info-value">
            Läuft passiv über die Zeit bis Cap (<strong style={{ color: 'var(--accent-kristall)' }}>{cfg.teileCap}</strong>), zusätzlicher
            Sofort-Bonus bei jedem Sieg (klar <strong style={{ color: 'var(--accent-deut)' }}>15%</strong> / mit Verlusten{' '}
            <strong style={{ color: 'var(--rf-gold)' }}>8%</strong> / Niederlage <strong style={{ color: 'var(--danger-bright)' }}>2%</strong> vom
            Cap, vor Sieges-Serie-Bonus)
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">⭐ Sandronator</span>
          <span className="info-value">
            <strong style={{ color: 'var(--accent-dm)' }}>Verdoppelt</strong> Beute UND Teile-Vergabe für die gesamte Mission, solange er überlebt
          </span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none', fontSize: 11, color: 'var(--text-dim)' }}>
          <span className="info-label">💡 Taktischer Hinweis</span>
          <span className="info-value">
            RapidFire-Matchups gelten unabhängig vom Sektor: Schwere Jäger gegen Leichte Jäger, Kreuzer gegen Schwere Jäger, Schlachtschiffe gegen
            Kreuzer, Schlachtkreuzer stark gegen Leichte/Schwere Jäger/Kreuzer/Schlachtschiffe, Zerstörer gegen Schlachtkreuzer/Bomber, Reaper gegen
            Zerstörer/Schlachtkreuzer/Bomber, Bomber stark gegen alle Verteidigungsanlagen.
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
          <strong style={{ color: 'var(--text)' }}>{cfg.farmRate?.toLocaleString('de-DE')}</strong> Ressourcen/h pro Mining-Schiff (
          <span style={{ color: 'var(--accent-metall)' }}>50% Metall</span> / <span style={{ color: 'var(--accent-kristall)' }}>30% Kristall</span> /{' '}
          <span style={{ color: 'var(--accent-deut)' }}>20% Deuterium</span>)
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🚀 Max. Mining-Schiffe pro Einsatz</span>
        <span className="info-value">
          <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.miningCap}</strong>
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🌑 Dunkle Materie</span>
        <span className="info-value">
          Bis zu <strong style={{ color: 'var(--accent-dm)' }}>{cfg.dmCap} DM</strong> pro vollem 12h-Einsatz (linear über die Zeit)
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">✅ Sicherheit ohne Begleitschiff</span>
        <span className="info-value" style={{ color: 'var(--accent-deut)' }}>
          Kein Feindkontakt möglich - risikofreies Farmen
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">🛡️ Begleitschiff (optional)</span>
        <span className="info-value">
          Max. <strong style={{ color: 'var(--accent-kristall)' }}>{cfg.escortCap}</strong> pro Einsatz · Bei jedem Stunden-Check garantiert ein
          kleiner Piraten-Überfall (nur Leichte/Schwere Jäger) mit{' '}
          <strong style={{ color: 'var(--danger-bright)' }}>
            {(gameData.asteroidEscortPowerMin * 100).toFixed(0)}–{(gameData.asteroidEscortPowerMax * 100).toFixed(0)}%
          </strong>{' '}
          deiner Begleitschiff-Power
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">💰 Bonus-Beute pro vernichtetem Piratenschiff</span>
        <span className="info-value">
          <strong style={{ color: 'var(--accent-metall)' }}>{gameData.asteroidEscortKillReward.metall.toLocaleString('de-DE')} Metall</strong>,{' '}
          <strong style={{ color: 'var(--accent-kristall)' }}>{gameData.asteroidEscortKillReward.kristall.toLocaleString('de-DE')} Kristall</strong>,{' '}
          <strong style={{ color: 'var(--accent-deut)' }}>{gameData.asteroidEscortKillReward.deuterium.toLocaleString('de-DE')} Deuterium</strong> -
          gutgeschrieben bei Rückkehr
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

function MissionStatus({ mission, now, onShowFleet }: { mission: Mission; now: number; onShowFleet: () => void }) {
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
          const availableIds = availableFleetForSektor(sektor.id, gameData.sektorConfig);
          const position = sektorPositions.find((p) => p.sektorId === sektor.id);
          const isSelected = selectedSektor === sektor.id;

          return (
            <SektorCard
              key={sektor.id}
              sektor={sektor}
              cfg={cfg}
              activeMission={activeMission}
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
