import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { LoreModal } from '../components/LoreModal';
import { ShipBuildCard, shipInfoRows, countShipEverywhere } from '../components/ShipBuildCard';
import { ShipModuleRow } from '../components/ShipModuleRow';
import { getRapidFireDisplay, getZielerfassungAccuracy, isTargetedByRapidFire, getPrecisionChance, getShieldRegenRate, getEvasionChance, getCritChance, driveTypeLabel } from '../lib/combatInfo';

// Salvenschiffe bauen ganz normal ueber buildShip()/die 3 Bau-Slots (siehe ShipBuildCard) - nur
// ihre Anzeige-Gruppierung ist hierher umgezogen. Der Imperator ist strukturell anders (Spezialteile
// statt normaler Ressourcen, eigene buildImperator()-Aktion) - dieser Tab uebernimmt die komplette
// bisherige Funktion von Shop > Spezialteile (dort entfernt, damit der Imperator nicht an zwei
// Stellen gleichzeitig baubar ist, siehe README).
const SALVEN_SHIP_IDS = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];

export function SpezialschiffePage() {
  const { gameData, state, buildShip, buildImperator, parties, error } = useGame();
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  const [infoShipId, setInfoShipId] = useState<string | null>(null);
  const [showImperatorInfo, setShowImperatorInfo] = useState(false);

  if (!gameData || !state) return <PageSkeleton />;

  const imperator = gameData.ships.find((s) => s.id === 'imperator');
  const salvenShips = gameData.ships.filter((s) => SALVEN_SHIP_IDS.includes(s.id));
  const infoShip = infoShipId ? gameData.ships.find((s) => s.id === infoShipId) : null;

  const teileCost = imperator?.teileCost;
  const imperatorBestand = countShipEverywhere(state, 'imperator', parties);
  const imperatorBuilding = state.buildQueue.some((j) => j.shipId === 'imperator');
  const imperatorCanBuild =
    !!teileCost && state.teile.waffen >= teileCost.waffen && state.teile.schild >= teileCost.schild && state.teile.panzerung >= teileCost.panzerung;
  const imperatorLimitReached = !!imperator?.maxCount && imperatorBestand >= imperator.maxCount;
  const pct = (val: number, max: number) => Math.min(100, Math.round((val / max) * 100));

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Seltene Sonderschiffe: die drei Salvenschiffe (normale Ressourcen, normale Bau-Slots) und der Imperator (nur aus geborgenen Spezialteilen,
        Bestand siehe Info-Popup).
      </p>

      {imperator && teileCost && (
        <>
          <div className="ship-grid" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="ship-card">
              <img
                className="ship-img"
                src={`/${imperator.img}`}
                alt={imperator.name}
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'ship', id: 'imperator' })}>
                    {imperator.name}
                  </span>{' '}
                  <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => setShowImperatorInfo(true)}>
                    ℹ️ Info
                  </button>
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Bestand: {imperatorBestand}/{imperator.maxCount}
                </p>
                <div className="ship-stats">
                  <span>Waffen: {imperator.stats.waffen.toLocaleString('de-DE')}</span>
                  <span>Schild: {imperator.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {imperator.stats.panzerung.toLocaleString('de-DE')}</span>
                </div>
                <div className="ship-cost">
                  Kosten: {teileCost.waffen} Waffen-Teile, {teileCost.schild} Schild-Teile, {teileCost.panzerung} Panzerungs-Teile
                </div>
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: 1 Tag</span>
                  <button className="build-btn" disabled={!imperatorCanBuild || imperatorBuilding || imperatorLimitReached} onClick={() => buildImperator()}>
                    {imperatorBuilding ? 'Wird gebaut...' : imperatorLimitReached ? 'Limit erreicht' : 'Bauen'}
                  </button>
                </div>
              </div>
              </div>
              <ShipModuleRow shipId="imperator" gameData={gameData} state={state} />
            </div>
          </div>
        </>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Salvenschiffe</h3>
      <div className="ship-grid">
        {salvenShips.map((ship) => (
          <div key={ship.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ShipBuildCard
              ship={ship}
              gameData={gameData}
              state={state}
              onBuild={buildShip}
              onOpenLore={() => setLoreTarget({ kind: 'ship', id: ship.id })}
              onOpenInfo={() => setInfoShipId(ship.id)}
            />
            <ShipModuleRow shipId={ship.id} gameData={gameData} state={state} />
          </div>
        ))}
      </div>

      {infoShip && (
        <InfoModal title={infoShip.name} onClose={() => setInfoShipId(null)}>
          <InfoTable rows={shipInfoRows(gameData, state, infoShip, parties)} />
        </InfoModal>
      )}

      {showImperatorInfo && imperator && (
        <InfoModal title={imperator.name} onClose={() => setShowImperatorInfo(false)}>
          <InfoTable
            rows={[
              ['Waffen-Teile (vorhanden)', `${Math.floor(state.teile.waffen)} / ${teileCost!.waffen} (${pct(state.teile.waffen, teileCost!.waffen)}%)`],
              ['Schild-Teile (vorhanden)', `${Math.floor(state.teile.schild)} / ${teileCost!.schild} (${pct(state.teile.schild, teileCost!.schild)}%)`],
              [
                'Panzerungs-Teile (vorhanden)',
                `${Math.floor(state.teile.panzerung)} / ${teileCost!.panzerung} (${pct(state.teile.panzerung, teileCost!.panzerung)}%)`,
              ],
              ['🚀 Geschwindigkeit', `${imperator.speed.toLocaleString('de-DE')} (${driveTypeLabel(imperator.driveType)})`],
              ['RapidFire', getRapidFireDisplay(gameData, imperator.id) || 'Kein RapidFire'],
              ...(getZielerfassungAccuracy(gameData, state.research, imperator.id) > 0
                ? ([
                    [
                      'Zielerfassung',
                      `${(getZielerfassungAccuracy(gameData, state.research, imperator.id) * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`,
                    ],
                  ] as [string, React.ReactNode][])
                : []),
              ['Ziel für RapidFire?', isTargetedByRapidFire(gameData, imperator.id) ? '⚠ Ja, andere Einheiten können dieses Schiff gezielt anvisieren' : 'Nein'],
              ['🎯 Präzision', `${(getPrecisionChance(gameData, state.research, imperator.id) * 100).toFixed(0)}% Trefferchance`],
              [
                '💨 Ausweichen',
                getEvasionChance(gameData, state.research, imperator.id) > 0
                  ? `${(getEvasionChance(gameData, state.research, imperator.id) * 100).toFixed(0)}% Chance, einem Treffer zu entgehen`
                  : 'Zu schwerfällig zum Ausweichen',
              ],
              ['💥 Kritische Treffer', `${(getCritChance(gameData, state.research, imperator.id) * 100).toFixed(0)}% Chance auf ${gameData.critDamageMultiplier}× Schaden`],
              ['🛡️ Schild-Regeneration', `${(getShieldRegenRate(gameData, state.research, imperator.id) * 100).toFixed(0)}% pro Runde`],
              ['Limit', `${imperatorBestand}/${imperator.maxCount} gebaut${imperatorLimitReached ? ' – Limit erreicht' : ''}`],
            ]}
          />
        </InfoModal>
      )}

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
