import { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { CombatUnitResult, CombatDetail, FarmDetail, GameMessage } from '../types/game';

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
            <th>Schaden</th>
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
  if (rewards.containerTier) rows.push(['Container', rewards.containerTier === 'gold' ? '🏆 Gold' : '📦 Silber']);
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

function DetailModal({ msg, onClose }: { msg: GameMessage; onClose: () => void }) {
  if (!msg.detail) return null;

  return (
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
                          <td style={{ textAlign: 'left' }}>{id}</td>
                          <td>{c}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: 4 }}>
              {msg.detail.sektorName} — {msg.detail.outcome}
            </h3>
            <p className="detail-sub" style={{ marginBottom: 12 }}>
              {new Date(msg.time).toLocaleString('de-DE')} · {msg.detail.roundsFought} Runde(n)
            </p>
            <RewardTable rows={combatRewardRows(msg.detail.rewards)} />
            <UnitTable title="Piraten/Alien (NPC)" units={msg.detail.npcResults} />
            {msg.detail.allyResult && <UnitTable title="Verbündete" units={[msg.detail.allyResult]} />}
            {groupByOwner(msg.detail.playerResults).map(([owner, units]) => (
              <UnitTable key={owner} title={owner} units={units} />
            ))}
          </>
        )}
      </div>
    </div>
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
  if (!state) return <p>Lade...</p>;

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
