import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';
import { shipName } from '../lib/combatInfo';
import { RaidHilfePage } from './RaidHilfe';
import { SektorInfoBox } from './Sektor';
import { InfoModal } from '../components/InfoModal';
import type { GameData, GroupOperation } from '../types/game';

const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];

// Zentrale Uebersetzung interner Statuswerte in verstaendlichen deutschen Text - vorher wurden
// die rohen enum-Werte ("inviting"/"departed"/"pending"/"accepted"/"declined") direkt angezeigt.
const OP_STATUS_LABELS: Record<string, string> = {
  inviting: '🕓 Wartet auf Zusagen',
  departed: '🚀 Unterwegs',
};
const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  pending: 'Offen',
  accepted: 'Zugesagt',
  declined: 'Abgelehnt',
};

function opKindLabel(op: { kind: 'expedition' | 'event'; sektorId?: string; eventName?: string }, gameData: GameData): string {
  if (op.kind === 'expedition') {
    const sektor = gameData.sektoren.find((s) => s.id === op.sektorId);
    return `🛡️ Expedition: ${sektor?.name || op.sektorId}`;
  }
  return `📡 Notruf-Event: "${op.eventName}"`;
}

function FleetPicker({
  gameData,
  availableIds,
  fleet,
  selection,
  setSelection,
}: {
  gameData: GameData;
  availableIds: string[];
  fleet: Record<string, number>;
  selection: Record<string, number>;
  setSelection: (fn: (p: Record<string, number>) => Record<string, number>) => void;
}) {
  return (
    <>
      {availableIds.map((id) => {
        const avail = fleet[id] || 0;
        if (avail === 0) return null;
        const qty = selection[id] || 0;
        return (
          <div className="queue-item" key={id}>
            <span>
              {shipName(gameData, id)} (verfügbar: {avail})
            </span>
            <span className="qty-row">
              <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 10) }))}>
                -10
              </button>
              <span style={{ padding: '0 6px' }}>{qty}</span>
              <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: Math.min(avail, (p[id] || 0) + 10) }))}>
                +10
              </button>
              <button className="qty-btn" onClick={() => setSelection((p) => ({ ...p, [id]: avail }))}>
                Alle
              </button>
            </span>
          </div>
        );
      })}
    </>
  );
}

function OpEntry({
  op,
  gameData,
  myUserId,
  now,
  onCancel,
  onStart,
}: {
  op: GroupOperation;
  gameData: GameData;
  myUserId: number;
  now: number;
  onCancel: (opId: string) => void;
  onStart: (opId: string) => void;
}) {
  const isCreator = op.creatorId === myUserId;
  const acceptedCount = op.participants.filter((p) => p.status === 'accepted').length;
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
      <p>
        <strong>{opKindLabel(op, gameData)}</strong>
        <br />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{acceptedCount} Teilnehmer bestätigt</span>
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        {op.participants.map((p) => `${p.username}: ${PARTICIPANT_STATUS_LABELS[p.status] || p.status}`).join(' · ')}
      </p>
      {op.status === 'departed' && op.processedHours !== undefined && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Fortschritt: {op.processedHours}/4 Stunden ·{' '}
          {op.returnTime && now < op.returnTime ? `Rückkehr in ${formatTime(op.returnTime - now)}` : 'Kehrt bald zurück'}
        </p>
      )}
      {isCreator && op.status === 'inviting' && (
        <div className="build-row">
          <button className="qty-btn" onClick={() => onCancel(op.id)}>
            Abbrechen
          </button>
          <button className="build-btn" onClick={() => onStart(op.id)}>
            Jetzt starten ({acceptedCount} dabei)
          </button>
        </div>
      )}
    </div>
  );
}

function ExpeditionEventsView() {
  const { gameData, state, users, parties, createParty, respondToParty, cancelParty, startParty, error } = useGame();
  const [tab, setTab] = useState<'expedition' | 'event'>('expedition');
  const [sektorId] = useState('piraten_elite');
  const [showEliteInfo, setShowEliteInfo] = useState(false);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [invitees, setInvitees] = useState<number[]>([]);
  const [respondSelections, setRespondSelections] = useState<Record<string, Record<string, number>>>({});
  const [, forceTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!gameData || !state) return <p>Lade...</p>;
  const now = serverNow();
  const myUserId = state.userId;

  const pendingForMe = parties.filter((op) => op.status === 'inviting' && op.participants.some((p) => p.userId === myUserId && p.status === 'pending'));
  const myOwn = parties.filter((op) => op.creatorId === myUserId || op.participants.some((p) => p.userId === myUserId && p.status !== 'pending'));

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Multiplayer – Gemeinsame Expeditionen &amp; Notruf-Events</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {pendingForMe.length > 0 && (
        <div className="queue-box" style={{ marginBottom: 20, borderColor: 'var(--accent-kristall)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Einladungen an dich</h3>
          {pendingForMe.map((op) => {
            const creator = op.participants.find((p) => p.isCreator);
            const availableIds = op.kind === 'expedition' ? [...COMBAT_SHIP_IDS, 'imperator'] : COMBAT_SHIP_IDS;
            const sel = respondSelections[op.id] || {};
            const setSel = (fn: (p: Record<string, number>) => Record<string, number>) =>
              setRespondSelections((prev) => ({ ...prev, [op.id]: fn(prev[op.id] || {}) }));
            return (
              <div key={op.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <p>
                  <strong>{opKindLabel(op, gameData)}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Eingeladen von {creator?.username}</span>
                </p>
                <FleetPicker gameData={gameData} availableIds={availableIds} fleet={state.fleet} selection={sel} setSelection={setSel} />
                <div className="build-row">
                  <button className="qty-btn" onClick={() => respondToParty(op.id, false, {})}>
                    Ablehnen
                  </button>
                  <button className="build-btn" onClick={() => respondToParty(op.id, true, sel)}>
                    Annehmen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {myOwn.length > 0 &&
        (() => {
          const waiting = myOwn.filter((op) => op.status === 'inviting');
          const active = myOwn.filter((op) => op.status === 'departed');

          return (
            <div className="queue-box" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Meine Operationen</h3>
              {waiting.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>{OP_STATUS_LABELS.inviting}</p>
                  {waiting.map((op) => (
                    <OpEntry op={op} gameData={gameData} myUserId={myUserId} now={now} onCancel={cancelParty} onStart={startParty} key={op.id} />
                  ))}
                </>
              )}
              {active.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, marginTop: waiting.length > 0 ? 12 : 0 }}>
                    {OP_STATUS_LABELS.departed}
                  </p>
                  {active.map((op) => (
                    <OpEntry op={op} gameData={gameData} myUserId={myUserId} now={now} onCancel={cancelParty} onStart={startParty} key={op.id} />
                  ))}
                </>
              )}
            </div>
          );
        })()}

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button className={`nav-btn${tab === 'expedition' ? ' active' : ''}`} onClick={() => setTab('expedition')}>
          Neue Expedition
        </button>
        <button className={`nav-btn${tab === 'event' ? ' active' : ''}`} onClick={() => setTab('event')}>
          Notruf-Event einladen
        </button>
      </div>

      {tab === 'expedition' && (
        <div>
          <div className="ship-grid" style={{ marginBottom: 16 }}>
            {(() => {
              const eliteSektor = gameData.sektoren.find((s) => s.id === 'piraten_elite')!;
              return (
                <div className="ship-card">
                  <img
                    className="ship-img"
                    src={`/${eliteSektor.img}`}
                    alt={eliteSektor.name}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                  <div className="ship-info">
                    <h3>{eliteSektor.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Typ: {eliteSektor.typ} · {eliteSektor.zweck}
                    </p>
                    <div className="ship-stats">
                      <span className="level-gruen">Aktivität: {eliteSektor.aktivitaet}</span>
                      <span>Gefahrenstufe: {eliteSektor.gefahr}</span>
                    </div>
                    <button className="qty-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowEliteInfo(true)}>
                      ℹ️ Info
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="queue-box">
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Deine Flotte für diese Expedition</h3>
            <FleetPicker gameData={gameData} availableIds={[...COMBAT_SHIP_IDS, 'imperator']} fleet={state.fleet} selection={selection} setSelection={setSelection} />

            <p style={{ fontSize: 13, marginTop: 10, marginBottom: 6 }}>Spieler einladen:</p>
            {users
              .filter((u) => u.id !== myUserId)
              .map((u) => (
                <label key={u.id} style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={invitees.includes(u.id)}
                    onChange={(e) => setInvitees((prev) => (e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)))}
                  />{' '}
                  {u.username}
                </label>
              ))}
            {users.filter((u) => u.id !== myUserId).length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Keine weiteren Spieler registriert.</p>
            )}

            <div className="build-row">
              <span></span>
              <button
                className="build-btn"
                onClick={() => {
                  createParty('expedition', sektorId, selection, invitees);
                  setSelection({});
                  setInvitees([]);
                }}
              >
                Erstellen &amp; einladen
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'event' && (
        <div className="queue-box">
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Notruf-Event gemeinsam bekämpfen</h3>
          {!state.event || state.event.started ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
              Du hast gerade keinen aktiven Notruf. Warte auf einen Notruf in deinem Sektor-Tab, dann kannst du hier Mitspieler einladen, bevor
              du eingreifst.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, marginBottom: 6 }}>
                Aktiver Notruf: <strong>{state.event.name}</strong>
              </p>
              <p style={{ fontSize: 13, marginBottom: 6 }}>Deine Flotte:</p>
              <FleetPicker gameData={gameData} availableIds={COMBAT_SHIP_IDS} fleet={state.fleet} selection={selection} setSelection={setSelection} />

              <p style={{ fontSize: 13, marginTop: 10, marginBottom: 6 }}>Spieler einladen:</p>
              {users
                .filter((u) => u.id !== myUserId)
                .map((u) => (
                  <label key={u.id} style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={invitees.includes(u.id)}
                      onChange={(e) => setInvitees((prev) => (e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)))}
                    />{' '}
                    {u.username}
                  </label>
                ))}

              <div className="build-row">
                <span></span>
                <button
                  className="build-btn"
                  onClick={() => {
                    createParty('event', undefined, selection, invitees);
                    setSelection({});
                    setInvitees([]);
                  }}
                >
                  Erstellen &amp; einladen
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showEliteInfo && (
        <InfoModal title="Sektor P9 – Elite-Bollwerk" onClose={() => setShowEliteInfo(false)}>
          <SektorInfoBox sektorId="piraten_elite" gameData={gameData} />
        </InfoModal>
      )}
    </div>
  );
}

function PlayerListView() {
  const { users, state } = useGame();
  if (!state) return <p>Lade...</p>;

  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 10 }}>Registrierte Spieler</h3>
      <div className="queue-box">
        {users.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine weiteren Spieler registriert.</p>
        ) : (
          users.map((u) => (
            <div className="queue-item" key={u.id}>
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    marginRight: 8,
                    background: u.online ? 'var(--accent-deut)' : 'var(--text-dim)',
                  }}
                />
                {u.username}
                {u.id === state.userId ? ' (du)' : ''}
              </span>
              <span style={{ fontSize: 12, color: u.online ? 'var(--accent-deut)' : 'var(--text-dim)' }}>
                {u.online ? 'Online' : 'Offline'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const MULTIPLAYER_TABS = [
  { id: 'expedition', name: 'Expeditionen & Events' },
  { id: 'raid', name: 'Raid-Hilfe' },
  { id: 'spieler', name: 'Spieler' },
];

export function MultiplayerPage() {
  const [tab, setTab] = useState<'expedition' | 'raid' | 'spieler'>('expedition');

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Multiplayer</h2>
      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {MULTIPLAYER_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(t.id as any)}>
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'expedition' && <ExpeditionEventsView />}
      {tab === 'raid' && <RaidHilfePage />}
      {tab === 'spieler' && <PlayerListView />}
    </div>
  );
}
