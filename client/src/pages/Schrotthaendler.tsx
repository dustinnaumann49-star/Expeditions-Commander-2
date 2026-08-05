import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageSkeleton } from '../components/PageSkeleton';
import { getEffectiveScrapRefundRate } from '../lib/multipliers';

const TEILE_LABELS: Record<'waffen' | 'schild' | 'panzerung', string> = {
  waffen: 'Waffen-Teile',
  schild: 'Schild-Teile',
  panzerung: 'Panzerungs-Teile',
};

export function SchrotthaendlerPage() {
  const { gameData, state, scrapShip, scrapDefense, convertTeile, error } = useGame();
  const [qtyShip, setQtyShip] = useState<Record<string, number>>({});
  const [qtyDef, setQtyDef] = useState<Record<string, number>>({});
  const [qtyTeile, setQtyTeile] = useState<Record<string, number>>({});

  if (!gameData || !state) return <PageSkeleton />;
  const rate = getEffectiveScrapRefundRate(gameData, state);
  const teileRate = gameData.teileConvertResources;

  const ownedShips = gameData.ships.filter((s) => !s.specialOnly && (state.fleet[s.id] || 0) > 0);
  const ownedDefs = gameData.defenses.filter((d) => (state.defense[d.id] || 0) > 0);
  const teileEntries = (['waffen', 'schild', 'panzerung'] as const).filter((p) => Math.floor(state.teile[p]) > 0);

  function teileRefundText(qty: number): string {
    if (qty <= 0) return '';
    return `${(teileRate.metall * qty).toLocaleString('de-DE')} Metall, ${(teileRate.kristall * qty).toLocaleString('de-DE')} Kristall, ${(
      teileRate.deuterium * qty
    ).toLocaleString('de-DE')} Deuterium`;
  }

  function refundText(cost: { metall: number; kristall: number; deuterium: number } | undefined, qty: number): string {
    if (!cost || qty <= 0) return '';
    const m = Math.floor(cost.metall * rate * qty);
    const k = Math.floor(cost.kristall * rate * qty);
    const d = Math.floor(cost.deuterium * rate * qty);
    return `${m.toLocaleString('de-DE')} Metall, ${k.toLocaleString('de-DE')} Kristall, ${d.toLocaleString('de-DE')} Deuterium`;
  }

  return (
    <div>
      <img className="view-banner" src="/ui/schrotthaendler.png" alt="Schrotthändler" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Du erhältst {(rate * 100).toFixed(0)}% der Baukosten zurück.</p>

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Schiffe</h3>
      {ownedShips.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>Keine Schiffe vorhanden.</p>
      ) : (
        <div className="ship-grid" style={{ marginBottom: 24 }}>
          {ownedShips.map((s) => {
            const owned = state.fleet[s.id] || 0;
            const qty = qtyShip[s.id] ?? owned;
            return (
              <div className="ship-card" key={s.id}>
                <img className="ship-img" src={`/${s.img}`} alt={s.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                <div className="ship-info">
                  <h3>{s.name}</h3>
                  <p className="detail-sub">Bestand: {owned.toLocaleString('de-DE')}</p>
                  <div className="qty-row">
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      max={owned}
                      value={qty}
                      onChange={(e) => setQtyShip((p) => ({ ...p, [s.id]: parseInt(e.target.value) || 0 }))}
                      style={{ width: 90 }}
                    />
                    <button className="qty-btn" onClick={() => setQtyShip((p) => ({ ...p, [s.id]: owned }))}>
                      Alle
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--accent-deut)' }}>Erstattung: {refundText(s.cost, qty)}</p>
                  <div className="build-row">
                    <span></span>
                    <button className="build-btn" onClick={() => scrapShip(s.id, qty)}>
                      Verschrotten
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Verteidigung</h3>
      {ownedDefs.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Verteidigungsanlagen vorhanden.</p>
      ) : (
        <div className="ship-grid">
          {ownedDefs.map((d) => {
            const owned = state.defense[d.id] || 0;
            const qty = qtyDef[d.id] ?? owned;
            return (
              <div className="ship-card" key={d.id}>
                <img className="ship-img" src={`/${d.img}`} alt={d.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                <div className="ship-info">
                  <h3>{d.name}</h3>
                  <p className="detail-sub">Bestand: {owned.toLocaleString('de-DE')}</p>
                  <div className="qty-row">
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      max={owned}
                      value={qty}
                      onChange={(e) => setQtyDef((p) => ({ ...p, [d.id]: parseInt(e.target.value) || 0 }))}
                      style={{ width: 90 }}
                    />
                    <button className="qty-btn" onClick={() => setQtyDef((p) => ({ ...p, [d.id]: owned }))}>
                      Alle
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--accent-deut)' }}>Erstattung: {refundText(d.cost, qty)}</p>
                  <div className="build-row">
                    <span></span>
                    <button className="build-btn" onClick={() => scrapDefense(d.id, qty)}>
                      Verschrotten
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 14, marginBottom: 8, marginTop: 24 }}>Teile umwandeln</h3>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
        1 Teil = {teileRate.metall.toLocaleString('de-DE')} Metall, {teileRate.kristall.toLocaleString('de-DE')} Kristall,{' '}
        {teileRate.deuterium.toLocaleString('de-DE')} Deuterium.
      </p>
      {teileEntries.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine Teile vorhanden.</p>
      ) : (
        <div className="ship-grid">
          {teileEntries.map((part) => {
            const owned = Math.floor(state.teile[part]);
            const qty = qtyTeile[part] ?? owned;
            return (
              <div className="ship-card" key={part}>
                <div className="ship-info">
                  <h3>{TEILE_LABELS[part]}</h3>
                  <p className="detail-sub">Bestand: {owned.toLocaleString('de-DE')}</p>
                  <div className="qty-row">
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      max={owned}
                      value={qty}
                      onChange={(e) => setQtyTeile((p) => ({ ...p, [part]: parseInt(e.target.value) || 0 }))}
                      style={{ width: 90 }}
                    />
                    <button className="qty-btn" onClick={() => setQtyTeile((p) => ({ ...p, [part]: owned }))}>
                      Alle
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--accent-deut)' }}>Erstattung: {teileRefundText(qty)}</p>
                  <div className="build-row">
                    <span></span>
                    <button className="build-btn" onClick={() => convertTeile(part, qty)}>
                      Umwandeln
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
