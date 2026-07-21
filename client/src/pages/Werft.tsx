import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BuildQueue } from '../components/BuildQueue';
import { LoreModal } from '../components/LoreModal';
import { InfoModal, InfoTable } from '../components/InfoModal';
import { formatTime } from '../lib/format';
import { getRapidFireDisplay, getZielerfassungAccuracy, isTargetedByRapidFire, shipName, getPrecisionChance, getShieldRegenRate, getEvasionChance, getCritChance, driveTypeLabel } from '../lib/combatInfo';
import { getBauzeitMultiplier, getShipCostMultiplier } from '../lib/multipliers';
import type { PlayerState } from '../types/game';

const WERFT_KLASSEN = [
  { id: 'jaeger', name: 'Jäger-Klasse', ships: ['leicht', 'schwer', 'salvenjaeger'] },
  { id: 'kreuzer', name: 'Kreuzer-Klasse', ships: ['kreuzer', 'schlachtschiff', 'bomber', 'salvenkreuzer'] },
  { id: 'elite', name: 'Elite-Klasse', ships: ['schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator', 'salvendreadnought'] },
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
  const [infoShipId, setInfoShipId] = useState<string | null>(null);

  if (!gameData || !state) return <p>Lade...</p>;

  const activeKlasse = WERFT_KLASSEN.find((k) => k.id === tab)!;
  const ships = gameData.ships.filter((s) => activeKlasse.ships.includes(s.id));
  const bauzeitMult = getBauzeitMultiplier(gameData, state);
  const costMult = getShipCostMultiplier(state);
  const infoShip = infoShipId ? gameData.ships.find((s) => s.id === infoShipId) : null;

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
          const alreadyExists = ship.unique && bestand >= 1;
          const totalCost = ship.cost
            ? {
                metall: ship.cost.metall * costMult * capQty,
                kristall: ship.cost.kristall * costMult * capQty,
                deuterium: ship.cost.deuterium * costMult * capQty,
              }
            : null;
          const affordable =
            !!totalCost &&
            state.resources.metall >= totalCost.metall &&
            state.resources.kristall >= totalCost.kristall &&
            state.resources.deuterium >= totalCost.deuterium &&
            capQty > 0;
          const effBuildTimeMs = ship.buildTime * bauzeitMult * (ship.unique ? 1 : capQty) * 1000;

          return (
            <div className="ship-card" key={ship.id}>
              <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <div className="ship-info">
                <h3>
                  <span className="lore-title" onClick={() => setLoreTarget({ kind: 'ship', id: ship.id })}>
                    {ship.name}
                  </span>{' '}
                  <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => setInfoShipId(ship.id)}>
                    ℹ️ Info
                  </button>
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Bestand: {bestand}
                  {ship.maxCount ? `/${ship.maxCount}` : ''}
                </p>
                <div className="ship-stats">
                  {ship.stats.waffen > 0 && <span>Waffen: {ship.stats.waffen.toLocaleString('de-DE')}</span>}
                  <span>Schild: {ship.stats.schild.toLocaleString('de-DE')}</span>
                  <span>Panzerung: {ship.stats.panzerung.toLocaleString('de-DE')}</span>
                </div>

                {ship.cost && (
                  <>
                    <div className="ship-cost">
                      Kosten je Stück: {(ship.cost.metall * costMult).toLocaleString('de-DE')} Metall,{' '}
                      {(ship.cost.kristall * costMult).toLocaleString('de-DE')} Kristall,{' '}
                      {(ship.cost.deuterium * costMult).toLocaleString('de-DE')} Deuterium
                      {costMult !== 1 && ' (Klassen-Rabatt bereits eingerechnet)'}
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

      {infoShip &&
        (() => {
          const bestand = countShipEverywhere(state, infoShip.id);
          const rfDisplay = getRapidFireDisplay(gameData, infoShip.id);
          const accuracy = getZielerfassungAccuracy(gameData, state.research, infoShip.id);
          const targeted = isTargetedByRapidFire(gameData, infoShip.id);
          const isVolleyShip = gameData.multiTargetVolleyShips.includes(infoShip.id);
          const volleyTargetTypes = Object.keys(gameData.rapidfire[infoShip.id] || {});
          // Diese vier Werte sind SCHIFFSABHAENGIG: kleine Schiffe treffen/weichen besser aus,
          // grosse regenerieren mehr Schild und kritzen oefter.
          const precision = getPrecisionChance(gameData, state.research, infoShip.id);
          const shieldRegen = getShieldRegenRate(gameData, state.research, infoShip.id);
          const evasion = getEvasionChance(gameData, state.research, infoShip.id);
          const critChance = getCritChance(gameData, state.research, infoShip.id);
          const rows: [string, React.ReactNode][] = [
            ['🚀 Geschwindigkeit', `${infoShip.speed.toLocaleString('de-DE')} (${driveTypeLabel(infoShip.driveType)})`],
            ['RapidFire', rfDisplay || 'Kein RapidFire (Basis-Schiff)'],
            ...(accuracy > 0 ? ([['Zielerfassung', `${(accuracy * 100).toFixed(0)}% Chance, gezielt ein RF-Ziel anzuvisieren`]] as [string, React.ReactNode][]) : []),
            ...(isVolleyShip
              ? ([
                  [
                    '⚡ Mehrfachziel-Salve',
                    `Bei erfolgreicher Zielerfassung wird JEDER anfällige Schiffstyp einmal getroffen (nicht nur eine zufällige Einheit): ${volleyTargetTypes
                      .map((id) => shipName(gameData, id))
                      .join(', ')}`,
                  ],
                ] as [string, React.ReactNode][])
              : []),
            ['Ziel für RapidFire?', targeted ? '⚠ Ja, andere Einheiten können dieses Schiff gezielt anvisieren' : 'Nein'],
            ['🎯 Präzision', `${(precision * 100).toFixed(0)}% Trefferchance`],
            ['💨 Ausweichen', evasion > 0 ? `${(evasion * 100).toFixed(0)}% Chance, einem Treffer zu entgehen` : 'Zu schwerfällig zum Ausweichen'],
            ['💥 Kritische Treffer', `${(critChance * 100).toFixed(0)}% Chance auf ${gameData.critDamageMultiplier}× Schaden`],
            ['🛡️ Schild-Regeneration', `${(shieldRegen * 100).toFixed(0)}% pro Runde`],
            ...(infoShip.unique
              ? ([['Status', `★ Einzigartig - nur 1 Exemplar möglich${bestand >= 1 ? ' (bereits vorhanden)' : ''}`]] as [string, React.ReactNode][])
              : infoShip.maxCount
              ? ([
                  [
                    'Limit',
                    `${bestand}/${infoShip.maxCount} gebaut/in Warteschlange${infoShip.maxCount - bestand <= 0 ? ' – Limit erreicht' : ''}`,
                  ],
                ] as [string, React.ReactNode][])
              : []),
          ];
          return (
            <InfoModal title={infoShip.name} onClose={() => setInfoShipId(null)}>
              <InfoTable rows={rows} />
            </InfoModal>
          );
        })()}

      <LoreModal target={loreTarget} gameData={gameData} onClose={() => setLoreTarget(null)} />
    </div>
  );
}
