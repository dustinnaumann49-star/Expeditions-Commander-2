import { useState } from 'react';
import { useGame } from '../context/GameContext';

const RESOURCE_LABELS: Record<string, string> = { metall: 'Metall', kristall: 'Kristall', deuterium: 'Deuterium' };

export function HaendlerPage() {
  const { gameData, state, executeTrade, error } = useGame();
  const [from, setFrom] = useState('metall');
  const [to, setTo] = useState('deuterium');
  const [amount, setAmount] = useState(0);

  if (!gameData || !state) return <p>Lade...</p>;

  function computeReceive(): number {
    if (from === to || amount <= 0 || !gameData) return 0;
    const value = amount * gameData.tradeValue[from];
    return (value / gameData.tradeValue[to]) * (1 - gameData.tradeFee);
  }

  const received = computeReceive();
  const canTrade = amount > 0 && from !== to && amount <= (state.resources as any)[from];

  return (
    <div style={{ padding: 20 }}>
      <h2>Händler</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p style={{ fontSize: 13, color: '#999' }}>
        Handelsspanne: {(gameData.tradeFee * 100).toFixed(0)}% · Umtauschkurs (Wertbasis): Metall 1 : Kristall 1,5 : Deuterium 3.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
        <span>Geben:</span>
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          {Object.keys(RESOURCE_LABELS).map((id) => (
            <option key={id} value={id}>
              {RESOURCE_LABELS[id]}
            </option>
          ))}
        </select>
        <input type="number" min={1} value={amount || ''} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} style={{ width: 120 }} />
        <span>Bestand: {Math.floor((state.resources as any)[from]).toLocaleString('de-DE')}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
        <span>Erhalten:</span>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          {Object.keys(RESOURCE_LABELS).map((id) => (
            <option key={id} value={id}>
              {RESOURCE_LABELS[id]}
            </option>
          ))}
        </select>
        <strong>
          {Math.floor(received).toLocaleString('de-DE')} {RESOURCE_LABELS[to]}
        </strong>
      </div>

      <div style={{ marginTop: 14 }}>
        <button disabled={!canTrade} onClick={() => executeTrade(amount, from, to)}>
          Tauschen
        </button>
        {from === to && <span style={{ color: '#999', marginLeft: 10 }}>Bitte unterschiedliche Ressourcen wählen.</span>}
      </div>
    </div>
  );
}
