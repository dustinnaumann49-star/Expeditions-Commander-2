import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { getForschungszeitMultiplier } from '../lib/multipliers';
import { GebaeudePage } from './Gebaeude';
import type { GameData, PlayerState, ResearchDefinition } from '../types/game';

function researchCostForLevel(baseCost: { metall: number; kristall: number; deuterium: number }, costGrowth: number, level: number) {
  const f = Math.pow(costGrowth, level - 1);
  return {
    metall: Math.round(baseCost.metall * f),
    kristall: Math.round(baseCost.kristall * f),
    deuterium: Math.round(baseCost.deuterium * f),
  };
}

function researchTimeForLevel(baseTimeHours: number, timeGrowth: number, level: number, multiplier: number): number {
  return baseTimeHours * Math.pow(timeGrowth, level - 1) * 3600 * 1000 * multiplier;
}

const MAIN_BRANCHES: { id: ResearchDefinition['mainBranch']; name: string }[] = [
  { id: 'waffen', name: 'Waffensysteme' },
  { id: 'verteidigung', name: 'Verteidigungssysteme' },
  { id: 'antrieb', name: 'Antriebstechnik' },
  { id: 'wirtschaft', name: 'Wirtschaft & Logistik' },
];

// Verbindungslinie: ein duenner Strich, komplett per Inline-Style - keine Abhaengigkeit von
// externen CSS-Klassen/Dateien (robust gegen Cache-/Deploy-Probleme).
function VLine({ height = 16 }: { height?: number }) {
  return <div style={{ width: 1, height, background: 'var(--border-bright)' }} />;
}

function ResearchNode({
  tech,
  gameData,
  state,
  now,
  busy,
  onOpenInfo,
  onStart,
}: {
  tech: ResearchDefinition;
  gameData: GameData;
  state: PlayerState;
  now: number;
  busy: boolean;
  onOpenInfo: (tech: ResearchDefinition) => void;
  onStart: (techId: string) => void;
}) {
  const children = gameData.research.filter((t) => t.parentId === tech.id);
  const level = state.research[tech.id] || 0;
  const maxed = level >= gameData.maxResearchLevel;
  const isSpionage = tech.id === 'spionage';
  const parentLevel = tech.parentId ? state.research[tech.parentId] || 0 : Infinity;
  const parentTech = tech.parentId ? gameData.research.find((t) => t.id === tech.parentId) : null;
  const locked = isSpionage || (!!tech.parentId && parentLevel < gameData.parentUnlockLevel);
  const activeJob = state.researchQueue.find((j) => j.techId === tech.id);
  const isBasis = !tech.parentId;
  const nextLevel = level + 1;
  const cost = !maxed && !locked ? researchCostForLevel(tech.baseCost, tech.costGrowth, nextLevel) : null;
  const affordable =
    cost && state.resources.metall >= cost.metall && state.resources.kristall >= cost.kristall && state.resources.deuterium >= cost.deuterium;

  const boxSize = isBasis ? 76 : 48;
  const boxWidth = isBasis ? 140 : 92;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: boxWidth,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 10,
          background: 'rgba(36,38,43,0.4)',
          opacity: locked ? 0.5 : 1,
          filter: locked ? 'grayscale(0.7)' : 'none',
        }}
      >
        <img
          src={`/${tech.img}`}
          alt={tech.name}
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          style={{ width: boxSize, height: boxSize, objectFit: 'cover', borderRadius: 6, display: 'block' }}
        />
        <span style={{ fontSize: isBasis ? 13 : 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.25 }}>{tech.name}</span>
        <span style={{ fontSize: 11, color: 'var(--accent-kristall)' }}>
          Stufe {level}/{gameData.maxResearchLevel}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="qty-btn" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => onOpenInfo(tech)}>
            ℹ️
          </button>
          {locked ? (
            <button className="qty-btn" style={{ fontSize: 11, padding: '2px 7px' }} disabled title={parentTech ? `Erfordert ${parentTech.name} Stufe ${gameData.parentUnlockLevel}` : undefined}>
              🔒
            </button>
          ) : maxed ? (
            <span style={{ fontSize: 11, color: 'var(--accent-deut)' }}>MAX</span>
          ) : activeJob ? (
            <span style={{ fontSize: 11, color: 'var(--accent-kristall)' }}>{formatTime(activeJob.endTime - now)}</span>
          ) : (
            <button className="build-btn" style={{ fontSize: 11, padding: '3px 9px' }} disabled={busy || !affordable} onClick={() => onStart(tech.id)}>
              Forschen
            </button>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <>
          <VLine />
          <div style={{ display: 'flex', position: 'relative', maxWidth: '100vw', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 2px 4px' }}>
            {children.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: boxWidth / 2 + 4,
                  right: boxWidth / 2 + 4,
                  height: 1,
                  background: 'var(--border-bright)',
                }}
              />
            )}
            {children.map((child) => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', flex: '0 0 auto' }}>
                <VLine />
                <ResearchNode tech={child} gameData={gameData} state={state} now={now} busy={busy} onOpenInfo={onOpenInfo} onStart={onStart} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResearchForest({
  mainBranch,
  gameData,
  state,
  now,
  busy,
  onOpenInfo,
  onStart,
}: {
  mainBranch: ResearchDefinition['mainBranch'];
  gameData: GameData;
  state: PlayerState;
  now: number;
  busy: boolean;
  onOpenInfo: (tech: ResearchDefinition) => void;
  onStart: (techId: string) => void;
}) {
  const roots = gameData.research.filter((t) => t.mainBranch === mainBranch && !t.parentId);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'center', overflowX: 'auto', padding: '4px 0' }}>
      {roots.map((root) => (
        <ResearchNode key={root.id} tech={root} gameData={gameData} state={state} now={now} busy={busy} onOpenInfo={onOpenInfo} onStart={onStart} />
      ))}
    </div>
  );
}

function ResearchInfoContent({ tech, gameData, state, forschungszeitMult }: { tech: ResearchDefinition; gameData: GameData; state: PlayerState; forschungszeitMult: number }) {
  const level = state.research[tech.id] || 0;
  const maxed = level >= gameData.maxResearchLevel;
  const nextLevel = level + 1;
  const cost = !maxed ? researchCostForLevel(tech.baseCost, tech.costGrowth, nextLevel) : null;
  const timeMs = !maxed ? researchTimeForLevel(tech.baseTimeHours, tech.timeGrowth, nextLevel, forschungszeitMult) : null;
  const parentTech = tech.parentId ? gameData.research.find((t) => t.id === tech.parentId) : null;

  const rows: [string, string][] = [
    ['Aktuelle Stufe', `${level} / ${gameData.maxResearchLevel}`],
    ['Effekt pro Stufe', `+${(tech.effectPerLevel * 100).toFixed(1)}%`],
  ];
  if (parentTech) rows.push(['Voraussetzung', `${parentTech.name} Stufe ${gameData.parentUnlockLevel}`]);
  if (cost) {
    rows.push([
      `Kosten Stufe ${nextLevel}`,
      `${cost.metall.toLocaleString('de-DE')} Metall, ${cost.kristall.toLocaleString('de-DE')} Kristall, ${cost.deuterium.toLocaleString('de-DE')} Deuterium`,
    ]);
  }
  if (timeMs) rows.push([`Forschungszeit Stufe ${nextLevel}`, formatTime(timeMs)]);
  if (maxed) rows.push(['Status', 'Maximalstufe erreicht']);

  const benefitingShips = tech.driveType ? gameData.ships.filter((s) => s.driveType === tech.driveType) : [];

  return (
    <>
      <InfoTable rows={rows} />
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginTop: 12 }}>{tech.lore}</p>
      {tech.driveType && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Profitierende Schiffe:</p>
          <p style={{ fontSize: 13, color: 'var(--accent-kristall)' }}>{benefitingShips.map((s) => s.name).join(', ') || 'Keine'}</p>
        </div>
      )}
    </>
  );
}

function ForschungTreeView() {
  const { gameData, state, startResearch, error } = useGame();
  const [, forceTick] = useState(0);
  const [infoTech, setInfoTech] = useState<ResearchDefinition | null>(null);
  const [branchId, setBranchId] = useState<ResearchDefinition['mainBranch']>('waffen');

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <PageSkeleton />;

  const busy = state.researchQueue.length >= gameData.maxResearchSlots;
  const now = serverNow();
  const forschungszeitMult = getForschungszeitMultiplier(state);
  const activeBranch = MAIN_BRANCHES.find((b) => b.id === branchId)!;

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Forschung</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
        Forschungslabor: {state.researchQueue.length} / {gameData.maxResearchSlots} gleichzeitig laufende Forschungen. Zweige schalten sich frei,
        sobald die jeweilige Basis- bzw. Vorgänger-Forschung Stufe {gameData.parentUnlockLevel} erreicht hat.
      </p>

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {MAIN_BRANCHES.map((branch) => (
          <button
            key={branch.id}
            className={`nav-btn${branchId === branch.id ? ' active' : ''}`}
            style={{ flex: '0 0 auto' }}
            onClick={() => setBranchId(branch.id)}
          >
            {branch.name}
          </button>
        ))}
      </div>

      <div className="queue-box" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>{activeBranch.name}</h3>
        <ResearchForest mainBranch={activeBranch.id} gameData={gameData} state={state} now={now} busy={busy} onOpenInfo={setInfoTech} onStart={startResearch} />
      </div>

      {infoTech && (
        <InfoModal title={infoTech.name} onClose={() => setInfoTech(null)}>
          <ResearchInfoContent tech={infoTech} gameData={gameData} state={state} forschungszeitMult={forschungszeitMult} />
        </InfoModal>
      )}
    </div>
  );
}

const FORSCHUNG_TABS = [
  { id: 'forschung', name: 'Forschung' },
  { id: 'gebaeude', name: 'Gebäude' },
];

export function ForschungPage() {
  const [tab, setTab] = useState<'forschung' | 'gebaeude'>('forschung');

  return (
    <div>
      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FORSCHUNG_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(t.id as any)}>
            {t.name}
          </button>
        ))}
      </div>
      {tab === 'forschung' && <ForschungTreeView />}
      {tab === 'gebaeude' && <GebaeudePage />}
    </div>
  );
}
