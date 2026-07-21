import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { formatTime } from '../lib/format';
import { getBauzeitMultiplier } from '../lib/multipliers';
import type { GameData, PlayerState, ShipModuleDefinition } from '../types/game';

function moduleCostForLevel(mod: ShipModuleDefinition, level: number) {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function moduleTimeForLevel(mod: ShipModuleDefinition, level: number, multiplier: number): number {
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * multiplier;
}

// Gleiches Verbindungslinien-Muster wie beim Gebaeude-Modulbaum (Gebaeude.tsx) - komplett per
// Inline-Style, keine externe CSS-Abhaengigkeit.
export function VLine({ height = 16 }: { height?: number }) {
  return <div style={{ width: 1, height, background: 'var(--border-bright)' }} />;
}

const KIND_LABEL: Record<string, string> = { waffen: 'Waffen', schild: 'Schild', panzerung: 'Panzerung', antrieb: 'Antrieb' };

function ShipModuleNode({
  mod,
  state,
  now,
  busy,
  onOpenInfo,
  onStart,
}: {
  mod: ShipModuleDefinition;
  state: PlayerState;
  now: number;
  busy: boolean;
  onOpenInfo: (mod: ShipModuleDefinition) => void;
  onStart: (moduleId: string) => void;
}) {
  const level = state.shipModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const activeJob = state.shipModuleQueue.find((j) => j.moduleId === mod.id);
  const nextLevel = level + 1;
  const cost = !maxed ? moduleCostForLevel(mod, nextLevel) : null;
  const affordable =
    cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

  return (
    <div
      style={{
        width: 92,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 7,
        background: 'rgba(36,38,43,0.4)',
      }}
    >
      <img
        src={`/${mod.img}`}
        alt={mod.name}
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, display: 'block' }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{KIND_LABEL[mod.moduleKind]}</span>
      <span style={{ fontSize: 10, color: 'var(--accent-kristall)' }}>
        Stufe {level}/{mod.maxLevel}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="qty-btn" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => onOpenInfo(mod)}>
          ℹ️
        </button>
        {maxed ? (
          <span style={{ fontSize: 10, color: 'var(--accent-deut)' }}>MAX</span>
        ) : activeJob ? (
          <span style={{ fontSize: 10, color: 'var(--accent-kristall)' }}>{formatTime(activeJob.endTime - now)}</span>
        ) : (
          <button className="build-btn" style={{ fontSize: 10, padding: '2px 7px' }} disabled={busy || !affordable} onClick={() => onStart(mod.id)}>
            Bauen
          </button>
        )}
      </div>
    </div>
  );
}

function ShipModuleInfoContent({ mod, state, bauzeitMult }: { mod: ShipModuleDefinition; state: PlayerState; bauzeitMult: number }) {
  const level = state.shipModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const nextLevel = level + 1;
  const cost = !maxed ? moduleCostForLevel(mod, nextLevel) : null;
  const timeMs = !maxed ? moduleTimeForLevel(mod, nextLevel, bauzeitMult) : null;

  const kindLabel: Record<string, string> = {
    waffen: 'Waffenschaden dieses Schiffstyps',
    schild: 'Schildkapazität dieses Schiffstyps',
    panzerung: 'Panzerung dieses Schiffstyps',
    antrieb: 'Flottengeschwindigkeit, wenn dieser Schiffstyp das langsamste Schiff der Flotte ist',
  };

  const rows: [string, string][] = [
    ['Aktuelle Stufe', `${level} / ${mod.maxLevel}`],
    ['Wirkt auf', kindLabel[mod.moduleKind]],
    ['Effekt pro Stufe', `+${(mod.effectPerLevel * 100).toFixed(1)}%`],
    ['Stapelt mit', 'Forschung, Klassen-Bonus und 24h-Kampf-Booster (multiplikativ, ersetzt sie nicht)'],
  ];
  if (cost) {
    rows.push([
      `Kosten Stufe ${nextLevel}`,
      `${cost.metall.toLocaleString('de-DE')} Metall, ${cost.kristall.toLocaleString('de-DE')} Kristall, ${cost.deuterium.toLocaleString('de-DE')} Deuterium`,
    ]);
  }
  if (timeMs) rows.push([`Bauzeit Stufe ${nextLevel}`, formatTime(timeMs)]);
  if (maxed) rows.push(['Status', 'Maximalstufe erreicht']);

  return (
    <>
      <InfoTable rows={rows} />
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginTop: 12 }}>{mod.lore}</p>
    </>
  );
}

// Haengt per Verbindungslinie (VLine) direkt UNTER die ShipBuildCard eines Schiffs - genau da, wo
// das Schiff auch gebaut wird (Jäger-/Kreuzer-/Elite-Klasse, Spezialschiffe), NICHT in einem
// eigenen Tab (Nutzerentscheidung - gleiches Muster wie Gebaeude-Module direkt unter ihrem
// Gebaeude). Rendert nichts, wenn das Schiff keine Module hat (Mining-Schiff/Begleitschiff).
export function ShipModuleRow({ shipId, gameData, state }: { shipId: string; gameData: GameData; state: PlayerState }) {
  const { buildShipModule } = useGame();
  const [infoModule, setInfoModule] = useState<ShipModuleDefinition | null>(null);
  const [, forceTick] = useState(0);

  const modules = gameData.shipModules.filter((m) => m.shipId === shipId);
  if (modules.length === 0) return null;

  const now = Date.now();
  const busy = state.shipModuleQueue.length >= gameData.maxShipModuleSlots;
  const bauzeitMult = getBauzeitMultiplier(gameData, state);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
      <VLine />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {modules.map((mod) => (
          <ShipModuleNode
            key={mod.id}
            mod={mod}
            state={state}
            now={now}
            busy={busy}
            onOpenInfo={setInfoModule}
            onStart={(moduleId) => buildShipModule(moduleId).then(() => forceTick((n) => n + 1))}
          />
        ))}
      </div>
      {infoModule && (
        <InfoModal title={infoModule.name} onClose={() => setInfoModule(null)}>
          <ShipModuleInfoContent mod={infoModule} state={state} bauzeitMult={bauzeitMult} />
        </InfoModal>
      )}
    </div>
  );
}
