import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { formatTime } from '../lib/format';
import { getRapidFireDisplay, getShieldDomeBonus, shipName, getPrecisionChance, getShieldRegenRate, getZielerfassungAccuracy } from '../lib/combatInfo';
import { getBauzeitMultiplier } from '../lib/multipliers';

export function VerteidigungPage() {
  const { gameData, state, buildDefense, error } = useGame();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [loreTarget, setLoreTarget] = useState<{ kind: 'ship' | 'defense' | 'research'; id: string } | null>(null);
  const [infoDefId, setInfoDefId] = useState<string | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const domeBonus = getShieldDomeBonus(gameData, state.defense, state.research);
  const precision = getPrecisionChance(gameData, state.research);
  const shieldRegen = getShieldRegenRate(gameData, state.research);
  const bauzeitMult = getBauzeitMultiplier(gameData, state);
  const infoDef = infoDefId ? gameData.defenses.find((d) => d.id === infoDefId) : null;

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
          const frei = def.maxCount ? def.maxCount - bestand : Infinity;
          const qty = qtyById[def.id] ?? 10;
          const capQty = Math.max(0, Math.min(qty, frei));
          const totalCost = { metall: def.cost.metall * capQty, kristall: def.cost.kristall * capQty, deuterium: def.cost.deuterium * capQty };
          const affordable =
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;
          const effBuildTimeMs = def.buildTime * bauzeitMult * capQty * 1000;

          return (
            <div className="ship-card" key={def.id}>
              <img className="ship-img" src={`/${def.img}`} alt={def.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'defense', id: def.id })}>
                    {def.name}
                  </span>{' '}
                  <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => setInfoDefId(def.id)}>
                    ℹ️ Info
                  </button>
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Bestand: {bestand}
                  {def.maxCount ? `/${def.maxCount}` : ''}
                </p>
                <div className="ship-stats">
                  {def.stats.waffen > 0 && <span>Waffen: {def.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {def.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {def.stats.panzerung.toLocaleString('de-DE')}</span>
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
                    max={def.maxCount ? frei : undefined}
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

      {infoDef &&
        (() => {
          const bestand = state.defense[infoDef.id] || 0;
          const rfDisplay = getRapidFireDisplay(gameData, infoDef.id);
          const defAccuracy = getZielerfassungAccuracy(gameData, state.research, infoDef.id);
          const rows: [string, React.ReactNode][] = [['RapidFire', rfDisplay || 'Kein RapidFire']];
          if (defAccuracy > 0) rows.push(['Zielerfassung', `${(defAccuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`]);
          if (infoDef.isDome) {
            rows.push([
              'Kuppel-Funktion',
              `Verteilt ${Math.round(infoDef.stats.schild * (1 + (state.research.schild || 0) * 0.1)).toLocaleString(
                'de-DE'
              )} Schild gleichmäßig als Bonus auf alle anderen Verteidigungsanlagen`,
            ]);
            rows.push(['Eigener Schild', 'Keiner – wird im Kampf nur durch Panzerung geschützt']);
          } else if (domeBonus > 0) {
            rows.push(['Aktueller Kuppel-Bonus', `+${Math.round(domeBonus).toLocaleString('de-DE')} Schild`]);
          }
          if (infoDef.maxCount) {
            rows.push(['Limit', `${bestand}/${infoDef.maxCount} gebaut${infoDef.maxCount - bestand <= 0 ? ' – Limit erreicht' : ''}`]);
          }
          rows.push(['Präzision (aktuell)', `${(precision * 100).toFixed(0)}% Trefferchance`]);
          rows.push(['Schild-Regeneration (aktuell)', `${(shieldRegen * 100).toFixed(0)}% pro Runde`]);
          return (
            <InfoModal title={infoDef.name} onClose={() => setInfoDefId(null)}>
              <InfoTable rows={rows} />
            </InfoModal>
          );
        })()}

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
