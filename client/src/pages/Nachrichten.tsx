import { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { CombatUnitResult } from '../types/game';

function UnitRow({ u }: { u: CombatUnitResult }) {
  const lost = u.lost ?? u.destroyedCount ?? 0;
  return (
    <div className="queue-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {u.name} x{u.sent ?? u.count}
        </span>
        <span className={lost > 0 ? 'level-rot' : 'level-gruen'}>{lost > 0 ? `${lost} verloren` : 'keine Verluste'}</span>
      </div>
      <span className="detail-sub">
        {u.survived ?? u.survivedCount} überlebt · {u.dmgTaken.toLocaleString('de-DE')} Hüllenschaden
      </span>
      <span className="detail-sub">
        🛡️ {u.shieldDmgTaken.toLocaleString('de-DE')} Schild absorbiert · {u.shieldRegen.toLocaleString('de-DE')} regeneriert
      </span>
      <span className="detail-sub">
        🎯 {u.shotsFired.toLocaleString('de-DE')} Schüsse · {u.hits.toLocaleString('de-DE')} getroffen
        {u.rapidFireTriggers ? ` · ⚡ ${u.rapidFireTriggers} RF-Folgeschüsse` : ''}
      </span>
    </div>
  );
}

export function NachrichtenPage() {
  const { state } = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!state) return <p>Lade...</p>;

  const kampf = state.messages.filter((m) => m.type === 'kampf');
  const farm = state.messages.filter((m) => m.type === 'farm');
  const openMsg = state.messages.find((m) => m.id === openId);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Nachrichten</h2>

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Kampfberichte</h3>
        {kampf.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Einträge.</p>
        ) : (
          kampf.map((m) => (
            <div className="queue-item" key={m.id} style={{ flexDirection: 'column', alignItems: 'stretch', cursor: m.detail ? 'pointer' : 'default' }} onClick={() => m.detail && setOpenId(m.id)}>
              <span className="detail-sub">{new Date(m.time).toLocaleString('de-DE')}</span>
              <span>
                {m.text}
                {m.detail && <span style={{ color: 'var(--accent-kristall)', fontSize: 11 }}> (Details anzeigen)</span>}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="queue-box">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Farm-/Beuteberichte</h3>
        {farm.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Einträge.</p>
        ) : (
          farm.map((m) => (
            <div className="queue-item" key={m.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <span className="detail-sub">{new Date(m.time).toLocaleString('de-DE')}</span>
              <span>{m.text}</span>
            </div>
          ))
        )}
      </div>

      {openMsg && openMsg.detail && (
        <div id="combat-modal" style={{ display: 'flex' }} onClick={() => setOpenId(null)}>
          <div id="modal-box" onClick={(e) => e.stopPropagation()}>
            <button id="modal-close" onClick={() => setOpenId(null)}>
              ×
            </button>
            <h3 style={{ marginBottom: 8 }}>
              {openMsg.detail.sektorName} — {openMsg.detail.outcome}
            </h3>
            <p className="detail-sub" style={{ marginBottom: 12 }}>
              Kampf über {openMsg.detail.roundsFought} Runde(n).
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h4 style={{ color: 'var(--text-dim)', marginBottom: 6 }}>Piraten/Alien (NPC)</h4>
                {openMsg.detail.npcResults.map((u, i) => (
                  <UnitRow key={i} u={u} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h4 style={{ color: 'var(--text-dim)', marginBottom: 6 }}>Deine Flotte</h4>
                {openMsg.detail.allyResult && <UnitRow u={openMsg.detail.allyResult} />}
                {openMsg.detail.playerResults.map((u, i) => (
                  <UnitRow key={i} u={u} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
