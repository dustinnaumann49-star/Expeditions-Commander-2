import { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { CombatUnitResult } from '../types/game';

function UnitRow({ u }: { u: CombatUnitResult }) {
  return (
    <div style={{ borderBottom: '1px solid #3a3a3a', padding: '6px 0', fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {u.name} x{u.sent ?? u.count}
        </span>
        <span style={{ color: (u.lost ?? u.destroyedCount ?? 0) > 0 ? '#e05555' : '#7fd97f' }}>
          {(u.lost ?? u.destroyedCount ?? 0) > 0 ? `${u.lost ?? u.destroyedCount} verloren` : 'keine Verluste'}
        </span>
      </div>
      <div style={{ color: '#999' }}>
        {u.survived ?? u.survivedCount} überlebt · {u.dmgTaken.toLocaleString('de-DE')} Hüllenschaden
      </div>
      <div style={{ color: '#999' }}>
        🛡️ {u.shieldDmgTaken.toLocaleString('de-DE')} Schild absorbiert · {u.shieldRegen.toLocaleString('de-DE')} regeneriert
      </div>
      <div style={{ color: '#999' }}>
        🎯 {u.shotsFired.toLocaleString('de-DE')} Schüsse · {u.hits.toLocaleString('de-DE')} getroffen
        {u.rapidFireTriggers ? ` · ⚡ ${u.rapidFireTriggers} RF-Folgeschüsse` : ''}
      </div>
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
    <div style={{ padding: 20 }}>
      <h2>Nachrichten</h2>

      <h3>Kampfberichte</h3>
      {kampf.length === 0 ? (
        <p style={{ color: '#999' }}>Keine Einträge.</p>
      ) : (
        kampf.map((m) => (
          <div
            key={m.id}
            style={{ borderBottom: '1px solid #3a3a3a', padding: '8px 0', cursor: m.detail ? 'pointer' : 'default' }}
            onClick={() => m.detail && setOpenId(m.id)}
          >
            <span style={{ fontSize: 11, color: '#999' }}>{new Date(m.time).toLocaleString('de-DE')}</span>
            <br />
            {m.text}
            {m.detail && <span style={{ color: '#7fd9e0', fontSize: 11 }}> (Details anzeigen)</span>}
          </div>
        ))
      )}

      <h3 style={{ marginTop: 20 }}>Farm-/Beuteberichte</h3>
      {farm.length === 0 ? (
        <p style={{ color: '#999' }}>Keine Einträge.</p>
      ) : (
        farm.map((m) => (
          <div key={m.id} style={{ borderBottom: '1px solid #3a3a3a', padding: '8px 0' }}>
            <span style={{ fontSize: 11, color: '#999' }}>{new Date(m.time).toLocaleString('de-DE')}</span>
            <br />
            {m.text}
          </div>
        ))
      )}

      {openMsg && openMsg.detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setOpenId(null)}
        >
          <div
            style={{ background: '#1c1c1c', border: '1px solid #3a3a3a', borderRadius: 8, padding: 20, maxWidth: 800, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {openMsg.detail.sektorName} — {openMsg.detail.outcome}
            </h3>
            <p style={{ fontSize: 12, color: '#999' }}>Kampf über {openMsg.detail.roundsFought} Runde(n).</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h4 style={{ color: '#999' }}>Piraten/Alien (NPC)</h4>
                {openMsg.detail.npcResults.map((u, i) => (
                  <UnitRow key={i} u={u} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h4 style={{ color: '#999' }}>Deine Flotte</h4>
                {openMsg.detail.allyResult && <UnitRow u={openMsg.detail.allyResult} />}
                {openMsg.detail.playerResults.map((u, i) => (
                  <UnitRow key={i} u={u} />
                ))}
              </div>
            </div>
            <button onClick={() => setOpenId(null)} style={{ marginTop: 12 }}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
