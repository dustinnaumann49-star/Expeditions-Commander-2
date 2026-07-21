import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { ShipBuildCard, shipInfoRows } from '../components/ShipBuildCard';
import { ShipModuleRow } from '../components/ShipModuleRow';
import { shipName } from '../lib/combatInfo';
import { SpezialschiffePage } from './Spezialschiffe';

// Salvenschiffe sind seit dem Umzug in den Untertab "Spezialschiffe" (siehe Spezialschiffe.tsx)
// NICHT mehr Teil dieser Klassen-Listen - bauen weiterhin ganz normal ueber buildShip()/die 3
// Bau-Slots, nur die Anzeige-Gruppierung hat sich geaendert.
const WERFT_KLASSEN = [
  { id: 'jaeger', name: 'Jäger-Klasse', ships: ['leicht', 'schwer'] },
  { id: 'kreuzer', name: 'Kreuzer-Klasse', ships: ['kreuzer', 'schlachtschiff', 'bomber'] },
  { id: 'elite', name: 'Elite-Klasse', ships: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'] },
  { id: 'versorgung', name: 'Versorgungsschiffe', ships: ['mining', 'begleitschiff'] },
];

const WERFT_TABS = [
  { id: 'schiffe', name: 'Schiffe' },
  { id: 'spezial', name: 'Spezialschiffe' },
];

function WerftHauptliste() {
  const { gameData, state, buildShip, error } = useGame();
  const [klasse, setKlasse] = useState('jaeger');
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  const [infoShipId, setInfoShipId] = useState<string | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const activeKlasse = WERFT_KLASSEN.find((k) => k.id === klasse)!;
  const ships = gameData.ships.filter((s) => activeKlasse.ships.includes(s.id));
  const infoShip = infoShipId ? gameData.ships.find((s) => s.id === infoShipId) : null;

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Bauwarteschlange ({state.buildQueue.length} von {gameData.maxBuildSlots} Slots belegt)
        </h3>
        <BuildQueue queue={state.buildQueue} maxSlots={gameData.maxBuildSlots} nameFor={(job) => shipName(gameData, job.shipId!)} />
      </div>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Schiffsmodul-Bauplatz ({state.shipModuleQueue.length} von {gameData.maxShipModuleSlots} belegt)
        </h3>
        <BuildQueue
          queue={state.shipModuleQueue}
          maxSlots={gameData.maxShipModuleSlots}
          nameFor={(job) => gameData.shipModules.find((m) => m.id === job.moduleId)?.name || job.moduleId!}
        />
      </div>

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {WERFT_KLASSEN.map((k) => (
          <button key={k.id} className={`nav-btn${klasse === k.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setKlasse(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      <div className="ship-grid">
        {ships.map((ship) => (
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
          <InfoTable rows={shipInfoRows(gameData, state, infoShip)} />
        </InfoModal>
      )}

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}

export function WerftPage() {
  const [tab, setTab] = useState('schiffe');

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Schiffswerft</h2>
      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {WERFT_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(t.id)}>
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'schiffe' && <WerftHauptliste />}
      {tab === 'spezial' && <SpezialschiffePage />}
    </div>
  );
}
