import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { SchrotthaendlerPage } from './Schrotthaendler';
import { getEffectiveTradeFee } from '../lib/multipliers';

const RESOURCE_LABELS: Record<string, string> = { metall: 'Metall', kristall: 'Kristall', deuterium: 'Deuterium' };
const RESOURCE_ICONS: Record<string, string> = { metall: 'resources/metall.png', kristall: 'resources/kristall.png', deuterium: 'resources/deuterium.png' };

function ResourceIcon({ id }: { id: string }) {
  return <img className="res-icon" src={`/${RESOURCE_ICONS[id]}`} alt={RESOURCE_LABELS[id]} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />;
}

function ResourcePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="qty-row">
      {Object.keys(RESOURCE_LABELS).map((id) => (
        <button
          key={id}
          className={`qty-btn${value === id ? ' active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          onClick={() => onChange(id)}
        >
          <ResourceIcon id={id} /> {RESOURCE_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

function TradeView() {
  const { gameData, state, executeTrade, error } = useGame();
  const [from, setFrom] = useState('metall');
  const [to, setTo] = useState('deuterium');
  const [amount, setAmount] = useState(0);

  if (!gameData || !state) return <PageSkeleton />;

  const fromStock = Math.floor((state.resources as any)[from]);
  const tradeFee = getEffectiveTradeFee(gameData, state);
  const received = from === to || amount <= 0 ? 0 : ((amount * gameData.tradeValue[from]) / gameData.tradeValue[to]) * (1 - tradeFee);
  const canTrade = amount > 0 && from !== to && amount <= fromStock;

  return (
    <div>
      <img className="view-banner" src="/ui/haendler.png" alt="Ressourcenhändler" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="ship-grid" style={{ gridTemplateColumns: 'minmax(300px, 480px)' }}>
        <div className="ship-card">
          <div className="ship-info">
            <h3>Ressourcentausch</h3>
            <p className="detail-sub" style={{ marginBottom: 4 }}>
              Handelsspanne {(tradeFee * 100).toFixed(0)}% · Kurs (Wertbasis) Metall 1 : Kristall 1,5 : Deuterium 3
            </p>

            <div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Geben</p>
              <ResourcePicker value={from} onChange={setFrom} />
              <div className="qty-row" style={{ marginTop: 8 }}>
                <input
                  className="qty-input"
                  type="number"
                  min={1}
                  value={amount || ''}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  style={{ width: 160 }}
                />
                <button className="qty-btn" onClick={() => setAmount(Math.floor(fromStock * 0.25))}>
                  25%
                </button>
                <button className="qty-btn" onClick={() => setAmount(Math.floor(fromStock * 0.5))}>
                  50%
                </button>
                <button className="qty-btn" onClick={() => setAmount(fromStock)}>
                  Alles
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Bestand: {fromStock.toLocaleString('de-DE')} {RESOURCE_LABELS[from]}
              </p>
            </div>

            <div style={{ textAlign: 'center', fontSize: 20, color: 'var(--text-dim)' }}>⇄</div>

            <div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Erhalten</p>
              <ResourcePicker value={to} onChange={setTo} />
              <p style={{ fontSize: 18, fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ResourceIcon id={to} /> {Math.floor(received).toLocaleString('de-DE')} {RESOURCE_LABELS[to]}
              </p>
            </div>

            <div className="build-row">
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{from === to && 'Bitte unterschiedliche Ressourcen wählen.'}</span>
              <button className="build-btn" disabled={!canTrade} onClick={() => executeTrade(amount, from, to)}>
                Tauschen
              </button>
            </div>
          </div>
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
