import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { shipName } from '../lib/combatInfo';
import type { CombatUnitResult, CombatDetail, FarmDetail, GameMessage, SkirmishSummary } from '../types/game';

function isFarmDetail(detail: CombatDetail | FarmDetail): detail is FarmDetail {
  return 'resources' in detail;
}

function groupByOwner(results: CombatUnitResult[]): [string, CombatUnitResult[]][] {
  const groups = new Map<string, CombatUnitResult[]>();
  results.forEach((u) => {
    const owner = u.ownerUsername || 'Deine Flotte';
    if (!groups.has(owner)) groups.set(owner, []);
    groups.get(owner)!.push(u);
  });
  return Array.from(groups.entries());
}

function UnitTable({ title, units }: { title: string; units: CombatUnitResult[] }) {
  if (units.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</p>
      <table className="combat-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Einheit</th>
            <th>Gesendet</th>
            <th>Überlebt</th>
            <th>Verloren</th>
            <th>Schaden ausgeteilt</th>
            <th>Schaden erlitten</th>
            <th>Schild absorb.</th>
            <th>Schild regen.</th>
            <th>Schüsse/Treffer</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u, i) => {
            const lost = u.lost ?? u.destroyedCount ?? 0;
            return (
              <tr key={i}>
                <td style={{ textAlign: 'left' }}>{u.name}</td>
                <td>{u.sent ?? u.count}</td>
                <td className={lost > 0 ? '' : 'level-gruen'}>{u.survived ?? u.survivedCount}</td>
                <td className={lost > 0 ? 'level-rot' : ''}>{lost}</td>
                <td>{Math.round(u.dmgDealt || 0).toLocaleString('de-DE')}</td>
                <td>{u.dmgTaken.toLocaleString('de-DE')}</td>
                <td>{u.shieldDmgTaken.toLocaleString('de-DE')}</td>
                <td>{u.shieldRegen.toLocaleString('de-DE')}</td>
                <td>
                  {u.shotsFired}/{u.hits}
                  {u.rapidFireTriggers ? ` (⚡${u.rapidFireTriggers})` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function sumUnits(units: CombatUnitResult[]) {
  return units.reduce(
    (acc, u) => {
      acc.dealt += u.dmgDealt || 0;
      acc.sent += u.sent ?? u.count ?? 0;
      acc.lost += u.lost ?? u.destroyedCount ?? 0;
      return acc;
    },
    { dealt: 0, sent: 0, lost: 0 }
  );
}

// Visuelle Kampf-Zusammenfassung auf einen Blick, oberhalb der detaillierten Einheiten-Tabellen -
// ersetzt keine Zahlen, fasst nur zusammen, wer wie viel ausgeteilt hat und wie hoch die Verluste
// je Seite ausfielen. Gruen = gut fuer den Betrachter (eigener Schaden/gegnerische Verluste),
// Rot = schlecht (eigene Verluste/gegnerischer Schaden) - konsistent mit den bestehenden
// level-gruen/level-rot-Farben in den Tabellen.
function CombatSummaryBars({
  npcResults,
  playerResults,
  allyResult,
}: {
  npcResults: CombatUnitResult[];
  playerResults: CombatUnitResult[];
  allyResult?: CombatUnitResult;
}) {
  const ownUnits = [...playerResults, ...(allyResult ? [allyResult] : [])];
  const own = sumUnits(ownUnits);
  const npc = sumUnits(npcResults);
  const maxDmg = Math.max(own.dealt, npc.dealt, 1);
  const ownLossPct = own.sent > 0 ? (own.lost / own.sent) * 100 : 0;
  const npcLossPct = npc.sent > 0 ? (npc.lost / npc.sent) * 100 : 0;
  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');

  return (
    <div className="queue-box" style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Kampf-Zusammenfassung</p>
      <div className="combat-bar-row">
        <div className="combat-bar-label">
          <span>Schaden ausgeteilt — Deine Flotte</span>
          <span>{fmt(own.dealt)}</span>
        </div>
        <div className="combat-bar-track">
          <div className="combat-bar-fill dealt" style={{ width: `${(own.dealt / maxDmg) * 100}%` }} />
        </div>
      </div>
      <div className="combat-bar-row">
        <div className="combat-bar-label">
          <span>Schaden ausgeteilt — Gegner</span>
          <span>{fmt(npc.dealt)}</span>
        </div>
        <div className="combat-bar-track">
          <div className="combat-bar-fill taken" style={{ width: `${(npc.dealt / maxDmg) * 100}%` }} />
        </div>
      </div>
      <div className="combat-bar-row">
        <div className="combat-bar-label">
          <span>Verluste — Deine Flotte</span>
          <span>
            {own.lost}/{own.sent} ({ownLossPct.toFixed(0)}%)
          </span>
        </div>
        <div className="combat-bar-track">
          <div className="combat-bar-fill taken" style={{ width: `${ownLossPct}%` }} />
        </div>
      </div>
      <div className="combat-bar-row" style={{ marginBottom: 0 }}>
        <div className="combat-bar-label">
          <span>Verluste — Gegner</span>
          <span>
            {npc.lost}/{npc.sent} ({npcLossPct.toFixed(0)}%)
          </span>
        </div>
        <div className="combat-bar-track">
          <div className="combat-bar-fill dealt" style={{ width: `${npcLossPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function RewardTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Belohnungen</p>
      <table className="combat-table">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left' }}>{label}</td>
              <td style={{ textAlign: 'right', color: 'var(--accent-deut)', fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function combatRewardRows(rewards: CombatDetail['rewards']): [string, string][] {
  if (!rewards) return [];
  const rows: [string, string][] = [];
  if (rewards.metall) rows.push(['Metall', rewards.metall.toLocaleString('de-DE')]);
  if (rewards.kristall) rows.push(['Kristall', rewards.kristall.toLocaleString('de-DE')]);
  if (rewards.deuterium) rows.push(['Deuterium', rewards.deuterium.toLocaleString('de-DE')]);
  if (rewards.dm) rows.push(['Dunkle Materie', rewards.dm.toLocaleString('de-DE')]);
  if (rewards.teileWaffen) rows.push(['Waffen-Teile', rewards.teileWaffen.toLocaleString('de-DE')]);
  if (rewards.teileSchild) rows.push(['Schild-Teile', rewards.teileSchild.toLocaleString('de-DE')]);
  if (rewards.teilePanzerung) rows.push(['Panzerungs-Teile', rewards.teilePanzerung.toLocaleString('de-DE')]);
  if (rewards.containerTier)
    rows.push(['Container', rewards.containerTier === 'elite' ? '💎 Elite' : rewards.containerTier === 'gold' ? '🏆 Gold' : '📦 Silber']);
  if (rewards.stolenMetall || rewards.stolenKristall || rewards.stolenDeuterium) {
    rows.push([
      'Gestohlen (Verlust)',
      `${(rewards.stolenMetall || 0).toLocaleString('de-DE')} Metall, ${(rewards.stolenKristall || 0).toLocaleString('de-DE')} Kristall, ${(
        rewards.stolenDeuterium || 0
      ).toLocaleString('de-DE')} Deuterium`,
    ]);
  }
  return rows;
}

function farmRewardRows(detail: FarmDetail): [string, string][] {
  const rows: [string, string][] = [];
  if (detail.resources.metall) rows.push(['Metall', detail.resources.metall.toLocaleString('de-DE')]);
  if (detail.resources.kristall) rows.push(['Kristall', detail.resources.kristall.toLocaleString('de-DE')]);
  if (detail.resources.deuterium) rows.push(['Deuterium', detail.resources.deuterium.toLocaleString('de-DE')]);
  if (detail.dm) rows.push(['Dunkle Materie', detail.dm.toLocaleString('de-DE')]);
  if (detail.teile.waffen) rows.push(['Waffen-Teile', detail.teile.waffen.toLocaleString('de-DE')]);
  if (detail.teile.schild) rows.push(['Schild-Teile', detail.teile.schild.toLocaleString('de-DE')]);
  if (detail.teile.panzerung) rows.push(['Panzerungs-Teile', detail.teile.panzerung.toLocaleString('de-DE')]);
  return rows;
}

// Gemeinsame Liste fuer gesammelte Einzel-Kaempfe (Stunden-Checks bei Missionen, Wellen bei
// Raids) - wird sowohl im FarmDetail-Zweig (Missionen) als auch im CombatDetail-Zweig (Raids)
// verwendet, siehe DetailModal. `unitLabel` haelt die Nummerierung kontextgerecht ("Stunde"
// vs. "Welle"), da beide dasselbe `hour`-Feld in SkirmishSummary unterschiedlich nutzen.
function SkirmishList({ skirmishes, unitLabel, title }: { skirmishes: SkirmishSummary[]; unitLabel: string; title: string }) {
  if (skirmishes.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{title}</p>
      {skirmishes.map((sk, i) => (
        <div key={i} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, marginBottom: 6 }}>
            <strong>
              {unitLabel} {sk.hour}
            </strong>{' '}
            – {sk.outcome}
          </p>
          <CombatSummaryBars npcResults={sk.npcResults} playerResults={sk.playerResults} />
          <RewardTable rows={combatRewardRows(sk.rewards)} />
          <UnitTable title="Piraten (NPC)" units={sk.npcResults} />
          <UnitTable title="Eigene Flotte" units={sk.playerResults} />
        </div>
      ))}
    </div>
  );
}

function DetailModal({ msg, onClose }: { msg: GameMessage; onClose: () => void }) {
  const { gameData } = useGame();
  if (!msg.detail) return null;

  // Per Portal gerendert - siehe Kommentar in components/InfoModal.tsx (Stacking-Context-Falle
  // durch backdrop-filter auf #mainbar, sonst von der Ressourcenleiste teilweise verdeckt).
  return createPortal(
    <div id="combat-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div id="modal-box" onClick={(e) => e.stopPropagation()}>
        <button id="modal-close" onClick={onClose}>
          ×
        </button>
        {isFarmDetail(msg.detail) ? (
          <>
            <h3 style={{ marginBottom: 4 }}>{msg.detail.sektorName}</h3>
            <p className="detail-sub" style={{ marginBottom: 12 }}>
              {new Date(msg.time).toLocaleString('de-DE')}
            </p>
            <RewardTable rows={farmRewardRows(msg.detail)} />
            {msg.detail.fleetReturned && Object.values(msg.detail.fleetReturned).some((c) => c > 0) && (
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Zurückgekehrte Flotte</p>
                <table className="combat-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Schiff</th>
                      <th>Anzahl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(msg.detail.fleetReturned)
                      .filter(([, c]) => c > 0)
                      .map(([id, c]) => (
                        <tr key={id}>
                          <td style={{ textAlign: 'left' }}>{gameData ? shipName(gameData, id) : id}</td>
                          <td>{c}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <SkirmishList skirmishes={msg.detail.skirmishes || []} unitLabel="Stunde" title="Piraten-Kontakte während der Mission" />
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: 4 }}>
              {msg.detail.sektorName} — {msg.detail.outcome}
            </h3>
            <p className="detail-sub" style={{ marginBottom: 12 }}>
              {new Date(msg.time).toLocaleString('de-DE')}
              {!(msg.detail.skirmishes && msg.detail.skirmishes.length > 0) && ` · ${msg.detail.roundsFought} Runde(n)`}
            </p>
            {msg.detail.skirmishes && msg.detail.skirmishes.length > 0 ? (
              <>
                <RewardTable rows={combatRewardRows(msg.detail.rewards)} />
                <SkirmishList skirmishes={msg.detail.skirmishes} unitLabel="Welle" title="Wellen-Verlauf" />
              </>
            ) : (
              <>
                <CombatSummaryBars
                  npcResults={msg.detail.npcResults}
                  playerResults={msg.detail.playerResults}
                  allyResult={msg.detail.allyResult}
                />
                <RewardTable rows={combatRewardRows(msg.detail.rewards)} />
                <UnitTable title="Piraten/Alien (NPC)" units={msg.detail.npcResults} />
                {msg.detail.allyResult && <UnitTable title="Verbündete" units={[msg.detail.allyResult]} />}
                {groupByOwner(msg.detail.playerResults).map(([owner, units]) => (
                  <UnitTable key={owner} title={owner} units={units} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function MessageTable({ messages, onOpen }: { messages: GameMessage[]; onOpen: (id: string) => void }) {
  if (messages.length === 0) {
    return <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Einträge.</p>;
  }
  return (
    <table className="combat-table">
      <thead>
        <tr>
          <th style={{ textAlign: 'left', width: 140 }}>Zeit</th>
          <th style={{ textAlign: 'left' }}>Ereignis</th>
        </tr>
      </thead>
      <tbody>
        {messages.map((m) => (
          <tr key={m.id} style={{ cursor: m.detail ? 'pointer' : 'default' }} onClick={() => m.detail && onOpen(m.id)}>
            <td style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              {new Date(m.time).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </td>
            <td style={{ textAlign: 'left' }}>
              {m.text.length > 90 ? m.text.slice(0, 90) + '…' : m.text}
              {m.detail && <span style={{ color: 'var(--accent-kristall)', fontSize: 11 }}> (Details)</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NachrichtenPage() {
  const { state, clearMessages } = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!state) return <PageSkeleton />;

  const kampf = state.messages.filter((m) => m.type === 'kampf');
  const farm = state.messages.filter((m) => m.type === 'farm');
  const openMsg = state.messages.find((m) => m.id === openId);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Nachrichten</h2>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14 }}>Kampfberichte</h3>
          {kampf.length > 0 && (
            <button className="qty-btn" onClick={() => clearMessages('kampf')}>
              Leeren
            </button>
          )}
        </div>
        <MessageTable messages={kampf} onOpen={setOpenId} />
      </div>

      <div className="queue-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14 }}>Farm-/Beuteberichte</h3>
          {farm.length > 0 && (
            <button className="qty-btn" onClick={() => clearMessages('farm')}>
              Leeren
            </button>
          )}
        </div>
        <MessageTable messages={farm} onOpen={setOpenId} />
      </div>

      {openMsg && <DetailModal msg={openMsg} onClose={() => setOpenId(null)} />}
    </div>
  );
}
