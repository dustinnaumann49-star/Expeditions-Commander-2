import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { shipName } from '../lib/combatInfo';
import type { CombatUnitResult, CombatDetail, FarmDetail, SpyReportDetail, SpyReportUnitRange, GameMessage, SkirmishSummary, RichFindEntry } from '../types/game';

type AnyDetail = CombatDetail | FarmDetail | SpyReportDetail;

// SpyReportDetail hat wie FarmDetail ein `resources`-Feld - `level` ist das einzige Feld, das NUR
// bei Spionageberichten vorkommt, muss deshalb VOR isFarmDetail geprueft werden.
function isSpyReportDetail(detail: AnyDetail): detail is SpyReportDetail {
  return 'level' in detail && 'baseSystem' in detail;
}

function isFarmDetail(detail: AnyDetail): detail is FarmDetail {
  return 'resources' in detail && !isSpyReportDetail(detail);
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

// Bereichs-Tabelle fuer Spionageberichte (siehe SpyReportUnitRange) - zeigt bei `exact:true` nur
// EINEN Wert statt eines Bereichs (Stufe 10, oder generell wenn low===high).
function SpyRangeTable({ title, units, emptyText }: { title: string; units: SpyReportUnitRange[]; emptyText: string }) {
  if (units.length === 0) {
    return (
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{emptyText}</p>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{title}</p>
      <table className="combat-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Einheit</th>
            <th>{units.every((u) => u.exact) ? 'Anzahl' : 'Geschätzte Anzahl'}</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id}>
              <td style={{ textAlign: 'left' }}>{u.name}</td>
              <td>{u.exact ? u.low.toLocaleString('de-DE') : `${u.low.toLocaleString('de-DE')}-${u.high.toLocaleString('de-DE')}`}</td>
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

// Anzeige der "reicher Fund"-Treffer im Asteroiden-Feld (siehe ASTEROID_RICH_FIND_CHANCE in
// server/economy.ts) - analog zu SkirmishList, aber ohne Kampf-Details, da hier nur ein simpler
// Ressourcen-Bonus pro Treffer anfaellt.
function RichFindList({ finds }: { finds: RichFindEntry[] }) {
  if (finds.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Reiche Asteroidenfunde (Ertrag verdoppelt)</p>
      <table className="combat-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Stunde</th>
            <th>Metall</th>
            <th>Kristall</th>
            <th>Deuterium</th>
          </tr>
        </thead>
        <tbody>
          {finds.map((f, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left' }}>{f.hour}</td>
              <td>{Math.floor(f.bonus.metall).toLocaleString('de-DE')}</td>
              <td>{Math.floor(f.bonus.kristall).toLocaleString('de-DE')}</td>
              <td>{Math.floor(f.bonus.deuterium).toLocaleString('de-DE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Gemeinsame Liste fuer gesammelte Einzel-Kaempfe (Stunden-Checks bei Missionen, Wellen bei
// Raids) - wird sowohl im FarmDetail-Zweig (Missionen) als auch im CombatDetail-Zweig (Raids)
// verwendet, siehe DetailModal. `unitLabel` haelt die Nummerierung kontextgerecht ("Stunde"
// vs. "Welle"), da beide dasselbe `hour`-Feld in SkirmishSummary unterschiedlich nutzen.
// Nutzerentscheidung (Juli 2026): jeder Einzel-Kampf ist jetzt ein eigener, einklappbarer Bereich
// statt alle Kaempfe direkt untereinander voll ausgeklappt zu zeigen - bei vielen Stunden-Checks/
// Wellen (bis zu 12 bzw. 5) musste man vorher durch eine sehr lange Seite scrollen, um zu einem
// spaeten Eintrag zu kommen. Standardmaessig alle zugeklappt (nur Kopfzeile mit Ausgang
// sichtbar), Klick auf die Kopfzeile klappt EINEN Eintrag auf/zu - andere bleiben unberuehrt.
function SkirmishList({ skirmishes, unitLabel, title }: { skirmishes: SkirmishSummary[]; unitLabel: string; title: string }) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());
  if (skirmishes.length === 0) return null;

  const toggle = (i: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontWeight: 600, fontSize: 13 }}>{title}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="qty-btn" style={{ fontSize: 11 }} onClick={() => setOpenIndices(new Set(skirmishes.map((_, i) => i)))}>
            Alle aufklappen
          </button>
          <button className="qty-btn" style={{ fontSize: 11 }} onClick={() => setOpenIndices(new Set())}>
            Alle zuklappen
          </button>
        </div>
      </div>
      {skirmishes.map((sk, i) => {
        const isOpen = openIndices.has(i);
        return (
          <div key={i} style={{ marginBottom: 8, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div
              onClick={() => toggle(i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                cursor: 'pointer',
                background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
              }}
            >
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>
                  {unitLabel} {sk.hour}
                </strong>{' '}
                – {sk.outcome}
              </p>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{isOpen ? '▾ zuklappen' : '▸ aufklappen'}</span>
            </div>
            {isOpen && (
              <div style={{ padding: '10px' }}>
                <CombatSummaryBars npcResults={sk.npcResults} playerResults={sk.playerResults} />
                <RewardTable rows={combatRewardRows(sk.rewards)} />
                <UnitTable title="Piraten (NPC)" units={sk.npcResults} />
                {groupByOwner(sk.playerResults).map(([owner, units]) => (
                  <UnitTable key={owner} title={owner} units={units} />
                ))}
              </div>
            )}
          </div>
        );
      })}
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
        {isSpyReportDetail(msg.detail) ? (
          <>
            <h3 style={{ marginBottom: 4 }}>
              Spionagebericht — Piratenbasis 1:{msg.detail.baseSystem}:{msg.detail.basePosition}
            </h3>
            <p className="detail-sub" style={{ marginBottom: 12 }}>
              {new Date(msg.time).toLocaleString('de-DE')} · Spionage-Stufe {msg.detail.level}
            </p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Ressourcen</p>
              <table className="combat-table">
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Metall</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-deut)', fontWeight: 600 }}>
                      {msg.detail.resources.metall.toLocaleString('de-DE')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Kristall</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-deut)', fontWeight: 600 }}>
                      {msg.detail.resources.kristall.toLocaleString('de-DE')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left' }}>Deuterium</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-deut)', fontWeight: 600 }}>
                      {msg.detail.resources.deuterium.toLocaleString('de-DE')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {msg.detail.level <= 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                Keine Sensordaten zu Flotte/Verteidigung - dafür ist mindestens Spionage-Forschung Stufe 1 nötig.
              </p>
            ) : (
              <>
                <SpyRangeTable title="Flotte" units={msg.detail.fleet} emptyText="Keine Flotte entdeckt." />
                <SpyRangeTable title="Verteidigung" units={msg.detail.defense} emptyText="Keine Verteidigung entdeckt." />
              </>
            )}
          </>
        ) : isFarmDetail(msg.detail) ? (
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
            <RichFindList finds={msg.detail.richFinds || []} />
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
  const navigate = useNavigate();
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
        {messages.map((m) => {
          const clickable = !!m.detail || !!m.galaxyLink;
          const handleClick = () => {
            if (m.detail) onOpen(m.id);
            else if (m.galaxyLink) navigate(`/galaxie?system=${m.galaxyLink.system}`);
          };
          return (
            <tr key={m.id} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? handleClick : undefined}>
              <td style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                {new Date(m.time).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td style={{ textAlign: 'left' }}>
                {m.text.length > 90 ? m.text.slice(0, 90) + '…' : m.text}
                {m.detail && <span style={{ color: 'var(--accent-kristall)', fontSize: 11 }}> (Details)</span>}
                {!m.detail && m.galaxyLink && <span style={{ color: 'var(--accent-kristall)', fontSize: 11 }}> (Zur Position →)</span>}
              </td>
            </tr>
          );
        })}
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
