import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { getRapidFireDisplay, getZielerfassungAccuracy, isTargetedByRapidFire, getPrecisionChance, getShieldRegenRate, getEvasionChance, getCritChance } from '../lib/combatInfo';

export function SpezialteilePage() {
  const { gameData, state, buildImperator, error } = useGame();
  const [showInfo, setShowInfo] = useState(false);
  if (!gameData || !state) return <p>Lade...</p>;

  const ship = gameData.ships.find((s) => s.id === 'imperator');
  if (!ship || !ship.teileCost || !ship.maxCount) return <p>Daten fehlen.</p>;
  const cost = ship.teileCost;
  const bestand = state.fleet.imperator || 0;
  const buildingNow = state.buildQueue.some((j) => j.shipId === 'imperator');
  const canBuild = state.teile.waffen >= cost.waffen && state.teile.schild >= cost.schild && state.teile.panzerung >= cost.panzerung;
  const limitReached = bestand >= ship.maxCount;
  const pct = (val: number, max: number) => Math.min(100, Math.round((val / max) * 100));

  const precision = getPrecisionChance(gameData, state.research, ship.id);
  const shieldRegen = getShieldRegenRate(gameData, state.research, ship.id);
  const evasion = getEvasionChance(gameData, state.research, ship.id);
  const critChance = getCritChance(gameData, state.research, ship.id);
  const rfDisplay = getRapidFireDisplay(gameData, ship.id);
  const accuracy = getZielerfassungAccuracy(gameData, state.research, ship.id);
  const targeted = isTargetedByRapidFire(gameData, ship.id);

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Spezialteile</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20, maxWidth: 480 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Inventar</h3>
        <div className="queue-item">
          <span>Waffen-Teile</span>
          <span>
            {Math.floor(state.teile.waffen)} / {cost.waffen} ({pct(state.teile.waffen, cost.waffen)}%)
          </span>
        </div>
        <div className="queue-item">
          <span>Schild-Teile</span>
          <span>
            {Math.floor(state.teile.schild)} / {cost.schild} ({pct(state.teile.schild, cost.schild)}%)
          </span>
        </div>
        <div className="queue-item">
          <span>Panzerungs-Teile</span>
          <span>
            {Math.floor(state.teile.panzerung)} / {cost.panzerung} ({pct(state.teile.panzerung, cost.panzerung)}%)
          </span>
        </div>
      </div>

      <div className="ship-grid" style={{ maxWidth: 400 }}>
        <div className="ship-card">
          <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <div className="ship-info">
            <h3>
              {ship.name}{' '}
              <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => setShowInfo(true)}>
                ℹ️ Info
              </button>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
              Bestand: {bestand}/{ship.maxCount}
            </p>
            <div className="ship-stats">
              <span>Waffen: {ship.stats.waffen.toLocaleString('de-DE')}</span>
              <span>Schild: {ship.stats.schild.toLocaleString('de-DE')}</span>
              <span>Panzerung: {ship.stats.panzerung.toLocaleString('de-DE')}</span>
            </div>
            <div className="ship-cost">
              Kosten: {cost.waffen} Waffen-Teile, {cost.schild} Schild-Teile, {cost.panzerung} Panzerungs-Teile
            </div>
            <div className="build-row">
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: 1 Tag</span>
              <button className="build-btn" disabled={!canBuild || buildingNow || limitReached} onClick={() => buildImperator()}>
                {buildingNow ? 'Wird gebaut...' : limitReached ? 'Limit erreicht' : 'Bauen'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showInfo && (
        <InfoModal title={ship.name} onClose={() => setShowInfo(false)}>
          <InfoTable
            rows={[
              ['RapidFire', rfDisplay || 'Kein RapidFire'],
              ...(accuracy > 0
                ? ([['Zielerfassung', `${(accuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`]] as [string, React.ReactNode][])
                : []),
              ['Ziel für RapidFire?', targeted ? '⚠ Ja, andere Einheiten können dieses Schiff gezielt anvisieren' : 'Nein'],
              ['🎯 Präzision', `${(precision * 100).toFixed(0)}% Trefferchance`],
              ['💨 Ausweichen', evasion > 0 ? `${(evasion * 100).toFixed(0)}% Chance, einem Treffer zu entgehen` : 'Zu schwerfällig zum Ausweichen'],
              ['💥 Kritische Treffer', `${(critChance * 100).toFixed(0)}% Chance auf ${gameData.critDamageMultiplier}× Schaden`],
              ['🛡️ Schild-Regeneration', `${(shieldRegen * 100).toFixed(0)}% pro Runde`],
              ['Limit', `${bestand}/${ship.maxCount} gebaut${bestand >= ship.maxCount ? ' – Limit erreicht' : ''}`],
            ]}
          />
        </InfoModal>
      )}
    </div>
  );
}
