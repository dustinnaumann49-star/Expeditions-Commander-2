import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { formatTime } from '../lib/format';
import { getRapidFireDisplay, getShieldDomeBonus, shipName } from '../lib/combatInfo';

export function VerteidigungPage() {
  const { gameData, state, buildDefense, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const domeBonus = getShieldDomeBonus(gameData, state.defense, state.research);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Verteidigung</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      <div className="queue-box" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Bauwarteschlange ({state.defenseQueue.length} von {gameData.maxDefenseSlots} Slots belegt)
        </h3>
        <BuildQueue queue={state.defenseQueue} maxSlots={gameData.maxDefenseSlots} nameFor={(job) => shipName(gameData, job.defId!)} />
      </div>

      <div className="ship-grid">
        {gameData.defenses.map((def) => {
          const bestand = state.defense[def.id] || 0;
          const frei = def.maxCount - bestand;
          const qty = qtyById[def.id] ?? 10;
          const capQty = Math.max(0, Math.min(qty, frei));
          const totalCost = { metall: def.cost.metall * capQty, kristall: def.cost.kristall * capQty, deuterium: def.cost.deuterium * capQty };
          const affordable =
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;
          const effBuildTimeMs = def.buildTime * capQty * 1000;
          const rfDisplay = getRapidFireDisplay(gameData, def.id);

          return (
            <div className="ship-card" key={def.id}>
              <img className="ship-img" src={`/${def.img}`} alt={def.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'defense', id: def.id })}>
                    {def.name}
                  </span>{' '}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>
                    (Bestand: {bestand}/{def.maxCount})
                  </span>
                </h3>
                <div className="ship-stats">
                  {def.stats.waffen > 0 && <span>Waffen: {def.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {def.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {def.stats.panzerung.toLocaleString('de-DE')}</span>
                </div>

                {rfDisplay ? (
                  <div className="ship-matchup">
                    <span className="matchup-rf">⚡ RapidFire: {rfDisplay}</span>
                  </div>
                ) : (
                  <div className="ship-matchup">
                    <span className="matchup-weak">Kein RapidFire</span>
                  </div>
                )}

                {def.isDome ? (
                  <>
                    <div className="ship-matchup">
                      <span className="matchup-rf">
                        🛡️ Verteilt seinen Schild-Wert ({Math.round(def.stats.schild * (1 + (state.research.schild || 0) * 0.1)).toLocaleString('de-DE')}
                        ) gleichmäßig als Bonus auf alle anderen Verteidigungsanlagen
                      </span>
                    </div>
                    <div className="ship-matchup">
                      <span className="matchup-weak">Besitzt selbst keinen eigenen Schild – wird im Kampf nur durch ihre Panzerung geschützt</span>
                    </div>
                  </>
                ) : (
                  domeBonus > 0 && (
                    <div className="ship-matchup">
                      <span className="matchup-rf">🛡️ Aktueller Kuppel-Bonus: +{Math.round(domeBonus).toLocaleString('de-DE')} Schild</span>
                    </div>
                  )
                )}
                <div className="ship-matchup">
                  <span className="matchup-weak">
                    Limitiert: {bestand}/{def.maxCount} gebaut/in Warteschlange{frei <= 0 ? ' – Limit erreicht' : ''}
                  </span>
                </div>

                <div className="ship-cost">
                  Kosten je Stück: {def.cost.metall.toLocaleString('de-DE')} Metall, {def.cost.kristall.toLocaleString('de-DE')} Kristall,{' '}
                  {def.cost.deuterium.toLocaleString('de-DE')} Deuterium
                </div>
                <div className="ship-cost" style={{ color: affordable ? 'var(--accent-deut)' : 'var(--danger)', fontWeight: 600 }}>
                  Gesamtkosten für {capQty} Stück: {totalCost.metall.toLocaleString('de-DE')} Metall, {totalCost.kristall.toLocaleString('de-DE')}{' '}
                  Kristall, {totalCost.deuterium.toLocaleString('de-DE')} Deuterium
                  {!affordable && ' – nicht genug Ressourcen!'}
                </div>
                <div className="qty-row">
                  <input
                    className="qty-input"
                    type="number"
                    min={1}
                    max={frei}
                    value={qty}
                    onChange={(e) => setQtyById((prev) => ({ ...prev, [def.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                  />
                </div>
                <div className="build-row">
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(effBuildTimeMs)}</span>
                  <button className="build-btn" disabled={!affordable} onClick={() => buildDefense(def.id, capQty)}>
                    Bauen ({capQty})
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
