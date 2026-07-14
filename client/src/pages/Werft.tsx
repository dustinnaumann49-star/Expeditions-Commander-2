import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { formatTime } from '../lib/format';
import { getRapidFireDisplay, getZielerfassungAccuracy, isTargetedByRapidFire, shipName } from '../lib/combatInfo';
import type { PlayerState } from '../types/game';

const WERFT_KLASSEN = [
  { id: 'jaeger', name: 'Jäger-Klasse', ships: ['leicht', 'schwer'] },
  { id: 'kreuzer', name: 'Kreuzer-Klasse', ships: ['kreuzer', 'schlachtschiff', 'bomber'] },
  { id: 'elite', name: 'Elite-Klasse', ships: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator'] },
  { id: 'versorgung', name: 'Versorgungsschiffe', ships: ['mining', 'begleitschiff'] },
];

function countShipEverywhere(state: PlayerState, shipId: string): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  return total;
}

export function WerftPage() {
  const { gameData, state, buildShip, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [tab, setTab] = useState('jaeger');
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const activeKlasse = WERFT_KLASSEN.find((k) => k.id === tab)!;
  const ships = gameData.ships.filter((s) => activeKlasse.ships.includes(s.id));

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Schiffswerft</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Bauwarteschlange ({state.buildQueue.length} von {gameData.maxBuildSlots} Slots belegt)
        </h3>
        <BuildQueue queue={state.buildQueue} maxSlots={gameData.maxBuildSlots} nameFor={(job) => shipName(gameData, job.shipId!)} />
      </div>

      <div className="sub-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {WERFT_KLASSEN.map((k) => (
          <button key={k.id} className={`nav-btn${tab === k.id ? ' active' : ''}`} style={{ flex: '0 0 auto' }} onClick={() => setTab(k.id)}>
            {k.name}
          </button>
        ))}
      </div>

      <div className="ship-grid">
        {ships.map((ship) => {
          const bestand = countShipEverywhere(state, ship.id);
          const frei = ship.maxCount ? ship.maxCount - bestand : Infinity;
          const qty = qtyById[ship.id] ?? 10;
          const capQty = ship.unique ? 1 : ship.maxCount ? Math.max(0, Math.min(qty, frei)) : qty;
          const limitReached = ship.maxCount ? frei <= 0 : false;
          const alreadyExists = ship.unique && bestand >= 1;
          const totalCost = ship.cost
            ? { metall: ship.cost.metall * capQty, kristall: ship.cost.kristall * capQty, deuterium: ship.cost.deuterium * capQty }
            : null;
          const affordable =
            !!totalCost &&
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;
          const effBuildTimeMs = ship.buildTime * (ship.unique ? 1 : capQty) * 1000;

          const rfDisplay = getRapidFireDisplay(gameData, ship.id);
          const accuracy = getZielerfassungAccuracy(gameData, state.research, ship.id);
          const targeted = isTargetedByRapidFire(gameData, ship.id);

          return (
            <div className="ship-card" key={ship.id}>
              <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'ship', id: ship.id })}>
                    {ship.name}
                  </span>{' '}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>
                    (Bestand: {bestand}
                    {ship.maxCount ? `/${ship.maxCount}` : ''})
                  </span>
                </h3>
                <div className="ship-stats">
                  {ship.stats.waffen > 0 && <span>Waffen: {ship.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {ship.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {ship.stats.panzerung.toLocaleString('de-DE')}</span>
                  {ship.miningPerHour && <span className="stat-mining">Abbau: {ship.miningPerHour.toLocaleString('de-DE')}/h</span>}
                </div>

                {rfDisplay ? (
                  <div className="ship-matchup">
                    <span className="matchup-rf">⚡ RapidFire: {rfDisplay}</span>
                  </div>
                ) : (
                  <div className="ship-matchup">
                    <span className="matchup-weak">Kein RapidFire (Basis-Schiff)</span>
                  </div>
                )}
                {accuracy > 0 && (
                  <div className="ship-matchup">
                    <span className="matchup-rf">🎯 Zielerfassung: {(accuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren</span>
                  </div>
                )}
                {targeted && (
                  <div className="ship-matchup">
                    <span className="matchup-weak">⚠ Dieses Schiff ist ein Ziel für RapidFire anderer Einheiten</span>
                  </div>
                )}
                {ship.unique && (
                  <div className="ship-matchup">
                    <span className="matchup-rf">★ Einzigartig: nur 1 Exemplar möglich{alreadyExists ? ' (bereits vorhanden)' : ''}</span>
                  </div>
                )}
                {ship.maxCount && !ship.unique && (
                  <div className="ship-matchup">
                    <span className="matchup-weak">
                      Limitiert: {bestand}/{ship.maxCount} gebaut/in Warteschlange{limitReached ? ' – Limit erreicht' : ''}
                    </span>
                  </div>
                )}

                {ship.cost && (
                  <>
                    <div className="ship-cost">
                      Kosten je Stück: {ship.cost.metall.toLocaleString('de-DE')} Metall, {ship.cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                      {ship.cost.deuterium.toLocaleString('de-DE')} Deuterium
                    </div>
                    <div className="ship-cost" style={{ color: affordable ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
                      Gesamtkosten für {capQty} Stück: {totalCost!.metall.toLocaleString('de-DE')} Metall, {totalCost!.kristall.toLocaleString('de-DE')}{' '}
                      Kristall, {totalCost!.deuterium.toLocaleString('de-DE')} Deuterium
                      {!affordable && ' – nicht genug Ressourcen!'}
                    </div>
                  </>
                )}
                {!ship.unique && (
                  <div className="qty-row">
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      max={ship.maxCount ? frei : undefined}
                      value={qty}
                      onChange={(e) => setQtyById((prev) => ({ ...prev, [ship.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    />
                  </div>
                )}
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(effBuildTimeMs)}</span>
                  <button className="build-btn" disabled={!affordable || alreadyExists} onClick={() => buildShip(ship.id, capQty)}>
                    Bauen {ship.unique ? '' : `(${capQty})`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
