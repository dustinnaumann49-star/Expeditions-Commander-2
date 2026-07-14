import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SchrotthaendlerPage } from './Schrotthaendler';

const RESOURCE_LABELS: Record<string, string> = { metall: 'Metall', kristall: 'Kristall', deuterium: 'Deuterium' };

function TradeView() {
  const { gameData, state, executeTrade, error } = useGame();
  const [from, setFrom] = useState('metall');
  const [to, setTo] = useState('deuterium');
  const [amount, setAmount] = useState(0);

  if (!gameData || !state) return <p>Lade...</p>;

  const received = from === to || amount <= 0 ? 0 : ((amount * gameData.tradeValue[from]) / gameData.tradeValue[to]) * (1 - gameData.tradeFee);
  const canTrade = amount > 0 && from !== to && amount <= (state.resources as any)[from];

  return (
    <div>
      <img className="view-banner" src="/ui/haendler.png" alt="Ressourcenhändler" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
        Handelsspanne: {(gameData.tradeFee * 100).toFixed(0)}% · Umtauschkurs (Wertbasis): Metall 1 : Kristall 1,5 : Deuterium 3.
      </p>

      <div className="queue-box" style={{ maxWidth: 480 }}>
        <div className="queue-item">
          <span>Geben</span>
          <span>
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {Object.keys(RESOURCE_LABELS).map((id) => (
                <option key={id} value={id}>
                  {RESOURCE_LABELS[id]}
                </option>
              ))}
            </select>
            <input
              className="qty-input"
              type="number"
              min={1}
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              style={{ marginLeft: 8, width: 140 }}
            />
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '4px 0' }}>
          Bestand: {Math.floor((state.resources as any)[from]).toLocaleString('de-DE')}
        </p>
        <div className="queue-item">
          <span>Erhalten</span>
          <span>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {Object.keys(RESOURCE_LABELS).map((id) => (
                <option key={id} value={id}>
                  {RESOURCE_LABELS[id]}
                </option>
              ))}
            </select>
            <strong style={{ marginLeft: 8 }}>
              {Math.floor(received).toLocaleString('de-DE')} {RESOURCE_LABELS[to]}
            </strong>
          </span>
        </div>
        <div className="build-row">
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{from === to && 'Bitte unterschiedliche Ressourcen wählen.'}</span>
          <button className="build-btn" disabled={!canTrade} onClick={() => executeTrade(amount, from, to)}>
            Tauschen
          </button>
        </div>
      </div>
    </div>
  );
}

const HAENDLER_TABS = [
  { id: 'tausch', name: 'Ressourcentausch' },
  { id: 'schrott', name: 'Schrotthändler' },
];

export function HaendlerPage() {
  const [tab, setTab] = useState<'tausch' | 'schrott'>('tausch');

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Händler</h2>
      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {HAENDLER_TABS.map((t) => (
          <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(t.id as any)}>
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'tausch' && <TradeView />}
      {tab === 'schrott' && <SchrotthaendlerPage />}
    </div>
  );
}
