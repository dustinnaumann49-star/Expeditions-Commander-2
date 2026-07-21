import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { ShipBuildCard, shipInfoRows } from '../components/ShipBuildCard';
import { ShipModuleRow } from '../components/ShipModuleRow';
import { DefenseBuildCard, defenseInfoRows } from '../components/DefenseBuildCard';
import { DefenseModuleRow } from '../components/DefenseModuleRow';
import { shipName } from '../lib/combatInfo';
import { SpezialschiffePage } from './Spezialschiffe';

// "spezial" ist bei den Schiffen ein Sonderfall (Salvenschiffe + Imperator, eigene Komponente
// wegen der Spezialteile-Mechanik beim Imperator) - bei der Verteidigung sind ALLE vier Klassen
// gleich aufgebaut (normale Ressourcen-Baukarten), kein Sonderfall noetig.
const SCHIFFE_KLASSEN = [
  { id: 'jaeger', name: 'Jäger-Klasse', ids: ['leicht', 'schwer'] },
  { id: 'kreuzer', name: 'Kreuzer-Klasse', ids: ['kreuzer', 'schlachtschiff', 'bomber'] },
  { id: 'elite', name: 'Elite-Klasse', ids: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'] },
  { id: 'versorgung', name: 'Versorgungsschiffe', ids: ['mining', 'begleitschiff'] },
  { id: 'spezial', name: 'Spezialschiffe', ids: [] },
];

const VERTEIDIGUNG_KLASSEN = [
  { id: 'leicht', name: 'Leichte Verteidigung', ids: ['raketenwerfer', 'leichteslaser', 'schwereslaser'] },
  { id: 'schwer', name: 'Schwere Verteidigung', ids: ['gausskanone', 'ionengeschuetz', 'plasmawerfer'] },
  { id: 'schild', name: 'Schild', ids: ['kleineschildkuppel', 'grosseschildkuppel', 'gigantschildkuppel'] },
  { id: 'spezial', name: 'Spezialverteidigung', ids: ['sentinelkanone', 'ultimatekanone'] },
];

function SchiffeTab() {
  const { gameData, state, buildShip, parties, error } = useGame();
  const [klasse, setKlasse] = useState('jaeger');
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  const [infoShipId, setInfoShipId] = useState<string | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const activeKlasse = SCHIFFE_KLASSEN.find((k) => k.id === klasse)!;
  const ships = gameData.ships.filter((s) => activeKlasse.ids.includes(s.id));
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
        {SCHIFFE_KLASSEN.map((k) => (
          <button key={k.id} className={`nav-btn${klasse === k.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setKlasse(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      {klasse === 'spezial' ? (
        <SpezialschiffePage />
      ) : (
        <>
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
              <InfoTable rows={shipInfoRows(gameData, state, infoShip, parties)} />
            </InfoModal>
          )}
          <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
        </>
      )}
    </div>
  );
}

function VerteidigungTab() {
  const { gameData, state, buildDefense, error } = useGame();
  const [klasse, setKlasse] = useState('leicht');
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  const [infoDefId, setInfoDefId] = useState<string | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const activeKlasse = VERTEIDIGUNG_KLASSEN.find((k) => k.id === klasse)!;
  const defenses = gameData.defenses.filter((d) => activeKlasse.ids.includes(d.id));
  const infoDef = infoDefId ? gameData.defenses.find((d) => d.id === infoDefId) : null;

  return (
    <div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Bauwarteschlange ({state.defenseQueue.length} von {gameData.maxDefenseSlots} Slots belegt)
        </h3>
        <BuildQueue queue={state.defenseQueue} maxSlots={gameData.maxDefenseSlots} nameFor={(job) => shipName(gameData, job.defId!)} />
      </div>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Verteidigungsmodul-Bauplatz ({state.defenseModuleQueue.length} von {gameData.maxDefenseModuleSlots} belegt)
        </h3>
        <BuildQueue
          queue={state.defenseModuleQueue}
          maxSlots={gameData.maxDefenseModuleSlots}
          nameFor={(job) => gameData.defenseModules.find((m) => m.id === job.moduleId)?.name || job.moduleId!}
        />
      </div>

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {VERTEIDIGUNG_KLASSEN.map((k) => (
          <button key={k.id} className={`nav-btn${klasse === k.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setKlasse(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      <div className="ship-grid">
        {defenses.map((def) => (
          <div key={def.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <DefenseBuildCard
              def={def}
              gameData={gameData}
              state={state}
              onBuild={buildDefense}
              onOpenLore={() => setLoreTarget({ kind: 'defense', id: def.id })}
              onOpenInfo={() => setInfoDefId(def.id)}
            />
            <DefenseModuleRow defenseId={def.id} gameData={gameData} state={state} />
          </div>
        ))}
      </div>

      {infoDef && (
        <InfoModal title={infoDef.name} onClose={() => setInfoDefId(null)}>
          <InfoTable rows={defenseInfoRows(gameData, state, infoDef)} />
        </InfoModal>
      )}
      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}

const WERFT_TABS = [
  { id: 'schiffe', name: 'Schiffe' },
  { id: 'verteidigung', name: 'Verteidigung' },
];

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

      {tab === 'schiffe' && <SchiffeTab />}
      {tab === 'verteidigung' && <VerteidigungTab />}
    </div>
  );
}
