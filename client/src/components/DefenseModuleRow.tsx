import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { VLine } from '../components/ShipModuleRow';
import { formatTime } from '../lib/format';
import { getDefenseBauzeitMultiplier } from '../lib/multipliers';
import type { GameData, PlayerState, DefenseModuleDefinition } from '../types/game';

function moduleCostForLevel(mod: DefenseModuleDefinition, level: number) {
  const f = Math.pow(mod.costGrowth, level - 1);
  return {
    metall: Math.round(mod.baseCost.metall * f),
    kristall: Math.round(mod.baseCost.kristall * f),
    deuterium: Math.round(mod.baseCost.deuterium * f),
  };
}

function moduleTimeForLevel(mod: DefenseModuleDefinition, level: number, multiplier: number): number {
  return mod.baseTimeSeconds * Math.pow(mod.timeGrowth, level - 1) * 1000 * multiplier;
}

const KIND_LABEL: Record<string, string> = { waffen: 'Waffen', schild: 'Schild', panzerung: 'Panzerung' };

function DefenseModuleNode({
  mod,
  state,
  now,
  busy,
  onOpenInfo,
  onStart,
}: {
  mod: DefenseModuleDefinition;
  state: PlayerState;
  now: number;
  busy: boolean;
  onOpenInfo: (mod: DefenseModuleDefinition) => void;
  onStart: (moduleId: string) => void;
}) {
  // Verteidigungs-Modul-Stufen leben in DERSELBEN state.shipModules-Map wie Schiffs-Module (siehe
  // Server-Kommentar zu DefenseModuleDefinition in types.ts) - nur die Warteschlange
  // (defenseModuleQueue) ist eigenstaendig.
  const level = state.shipModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const activeJob = state.defenseModuleQueue.find((j) => j.moduleId === mod.id);
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

function DefenseModuleInfoContent({ mod, state, bauzeitMult }: { mod: DefenseModuleDefinition; state: PlayerState; bauzeitMult: number }) {
  const level = state.shipModules[mod.id] || 0;
  const maxed = level >= mod.maxLevel;
  const nextLevel = level + 1;
  const cost = !maxed ? moduleCostForLevel(mod, nextLevel) : null;
  const timeMs = !maxed ? moduleTimeForLevel(mod, nextLevel, bauzeitMult) : null;

  const kindLabel: Record<string, string> = {
    waffen: 'Waffenschaden dieser Anlage',
    schild: 'Schildkapazität dieser Anlage (bzw. Beitrag zum Kuppel-Pool)',
    panzerung: 'Panzerung dieser Anlage',
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

// Haengt per Verbindungslinie direkt UNTER die DefenseBuildCard einer Verteidigungsanlage - nur
// Waffen/Schild/Panzerung (kein Antrieb, Verteidigung bewegt sich nicht).
export function DefenseModuleRow({ defenseId, gameData, state }: { defenseId: string; gameData: GameData; state: PlayerState }) {
  const { buildDefenseModule } = useGame();
  const [infoModule, setInfoModule] = useState<DefenseModuleDefinition | null>(null);
  const [, forceTick] = useState(0);

  const modules = gameData.defenseModules.filter((m) => m.defenseId === defenseId);
  if (modules.length === 0) return null;

  const now = Date.now();
  const busy = state.defenseModuleQueue.length >= gameData.maxDefenseModuleSlots;
  const bauzeitMult = getDefenseBauzeitMultiplier(gameData, state);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
      <VLine />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {modules.map((mod) => (
          <DefenseModuleNode
            key={mod.id}
            mod={mod}
            state={state}
            now={now}
            busy={busy}
            onOpenInfo={setInfoModule}
            onStart={(moduleId) => buildDefenseModule(moduleId).then(() => forceTick((n) => n + 1))}
          />
        ))}
      </div>
      {infoModule && (
        <InfoModal title={infoModule.name} onClose={() => setInfoModule(null)}>
          <DefenseModuleInfoContent mod={infoModule} state={state} bauzeitMult={bauzeitMult} />
        </InfoModal>
      )}
    </div>
  );
}
