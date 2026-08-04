import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { formatTime } from '../lib/format';
import { getBauzeitMultiplier, getShipCostMultiplier } from '../lib/multipliers';
import {
  getRapidFireDisplay,
  getZielerfassungAccuracy,
  isTargetedByRapidFire,
  shipName,
  getPrecisionChance,
  getShieldRegenRate,
  getEvasionChance,
  getCritChance,
  getCritDamageMultiplier,
  driveTypeLabel,
  getEffectiveShipStats,
} from '../lib/combatInfo';
import { StatValue } from './StatValue';
import type { GameData, PlayerState, ShipDefinition, GroupOperation } from '../types/game';

// Bugfix: zaehlte bisher NUR state.fleet (zuhause) + buildQueue (im Bau) + Missionen +
// Galaxie-Halten - laufende Gruppen-Expeditionen (Elite-Bollwerk/Piratenadmiral) fehlten hier
// noch (bewusste Aufwands-Abkuerzung beim ersten Fix, jetzt nachgezogen). Ohne diese blieb der
// Bauen-Button bei limitierten Schiffen (maxCount/unique) faelschlich anklickbar, wenn Einheiten
// gerade Teil einer laufenden Gruppen-Expedition waren - der Server haette den Bau trotzdem
// korrekt abgelehnt (siehe server/src/game/actions.ts, dort war das schon vollstaendig), aber die
// UI zeigte einen irrefuehrend aktiven Button an.
export function countShipEverywhere(state: PlayerState, shipId: string, parties: GroupOperation[] = []): number {
  let total = state.fleet[shipId] || 0;
  state.buildQueue.forEach((job) => {
    if (job.shipId === shipId) total += job.count || 0;
  });
  state.missions.forEach((m) => {
    if (!m.finalized) total += m.ships[shipId] || 0;
  });
  state.galaxyDeployments.forEach((d) => {
    total += d.ships[shipId] || 0;
  });
  parties.forEach((op) => {
    op.participants.forEach((p) => {
      if (p.userId === state.userId && p.status === 'accepted') total += p.ships[shipId] || 0;
    });
  });
  return total;
}

// Normale, ressourcen-finanzierte Schiffs-Baukarte - genutzt in Werft.tsx (Hauptliste) UND
// Spezialschiffe.tsx (Salvenschiffe, die trotz Umzug in den Untertab weiterhin ganz normal ueber
// buildShip()/die 3 Bau-Slots laufen, NICHT ueber Spezialteile wie der Imperator).
export function ShipBuildCard({
  ship,
  gameData,
  state,
  onBuild,
  onOpenLore,
  onOpenInfo,
}: {
  ship: ShipDefinition;
  gameData: GameData;
  state: PlayerState;
  onBuild: (shipId: string, qty: number) => void;
  onOpenLore: () => void;
  onOpenInfo: () => void;
}) {
  // Erlaubt einen leeren Zwischenzustand beim Tippen (Nutzerentscheidung, Mobil-Fix 04.08.2026):
  // vorher schnappte das Feld bei jedem Tastendruck sofort auf mindestens 1 zurueck, wodurch sich
  // der Vorbelegungswert (z.B. "10") nie einfach loeschen liess, ohne ihn erst zu markieren -
  // Nutzer mussten den kompletten Wert markieren statt einfach loszutippen. onBlur() unten stellt
  // sicher, dass beim Verlassen des Feldes trotzdem nie ein leerer/ungueltiger Wert stehen bleibt.
  const [qty, setQty] = useState<number | ''>(10);
  const { parties } = useGame();
  const bauzeitMult = getBauzeitMultiplier(gameData, state);
  const costMult = getShipCostMultiplier(state);

  const bestand = countShipEverywhere(state, ship.id, parties);
  const frei = ship.maxCount ? ship.maxCount - bestand : Infinity;
  const numericQty = qty === '' ? 0 : qty;
  const capQty = ship.unique ? 1 : ship.maxCount ? Math.max(0, Math.min(numericQty, frei)) : numericQty;
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
  const effStats = getEffectiveShipStats(gameData, state, ship);

  return (
    <div className="ship-card">
      <img className="ship-img" src={`/${ship.img}`} alt={ship.name} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
      <div className="ship-info">
        <h3>
          <span className="lore-title" onClick={onOpenLore}>
            {ship.name}
          </span>{' '}
          <button className="qty-btn" style={{ padding: '1px 7px', fontSize: 11 }} onClick={onOpenInfo}>
            ℹ️ Info
          </button>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
          Bestand: {bestand}
          {ship.maxCount ? `/${ship.maxCount}` : ''}
        </p>
        <div className="ship-stats">
          {ship.stats.waffen > 0 && <StatValue label="Waffen" icon="⚔️" base={ship.stats.waffen} effective={effStats.waffen} colorClass="stat-waffen" />}
          <StatValue label="Schild" icon="🛡️" base={ship.stats.schild} effective={effStats.schild} colorClass="stat-schild" />
          <StatValue label="Panzerung" icon="🧱" base={ship.stats.panzerung} effective={effStats.panzerung} colorClass="stat-panzerung" />
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
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setQty('');
                  return;
                }
                const n = parseInt(raw, 10);
                setQty(Number.isNaN(n) ? '' : Math.max(0, n));
              }}
              onBlur={() => setQty((q) => (q === '' || q < 1 ? 1 : q))}
            />
          </div>
        )}
        <div className="build-row">
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Bauzeit: {formatTime(effBuildTimeMs)}</span>
          <button className="build-btn" disabled={!affordable || alreadyExists} onClick={() => onBuild(ship.id, capQty)}>
            Bauen {ship.unique ? '' : `(${capQty})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shipInfoRows(gameData: GameData, state: PlayerState, ship: ShipDefinition, parties: GroupOperation[] = []) {
  const bestand = countShipEverywhere(state, ship.id, parties);
  const rfDisplay = getRapidFireDisplay(gameData, ship.id);
  const accuracy = getZielerfassungAccuracy(gameData, state.research, ship.id);
  const targeted = isTargetedByRapidFire(gameData, ship.id);
  const isVolleyShip = gameData.multiTargetVolleyShips.includes(ship.id);
  const volleyTargetTypes = Object.keys(gameData.rapidfire[ship.id] || {});
  const precision = getPrecisionChance(gameData, state.research, ship.id);
  const shieldRegen = getShieldRegenRate(gameData, state.research, ship.id);
  const evasion = getEvasionChance(gameData, state.research, ship.id);
  const critChance = getCritChance(gameData, state.research, ship.id);
  const effStats = getEffectiveShipStats(gameData, state, ship);
  const rows: [string, React.ReactNode][] = [
    ...(ship.stats.waffen > 0
      ? ([['Waffen', <StatValue key="waffen" label="" icon="⚔️" base={ship.stats.waffen} effective={effStats.waffen} colorClass="stat-waffen" />]] as [
          string,
          React.ReactNode
        ][])
      : []),
    ['Schild', <StatValue key="schild" label="" icon="🛡️" base={ship.stats.schild} effective={effStats.schild} colorClass="stat-schild" />],
    ['Panzerung', <StatValue key="panzerung" label="" icon="🧱" base={ship.stats.panzerung} effective={effStats.panzerung} colorClass="stat-panzerung" />],
    ['🚀 Geschwindigkeit', `${ship.speed.toLocaleString('de-DE')} (${driveTypeLabel(ship.driveType)})`],
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
    ['💥 Kritische Treffer', `${(critChance * 100).toFixed(0)}% Chance auf ${getCritDamageMultiplier(gameData, ship.id)}× Schaden`],
    ['🛡️ Schild-Regeneration', `${(shieldRegen * 100).toFixed(0)}% pro Runde`],
    ...(ship.unique
      ? ([['Status', `★ Einzigartig - nur 1 Exemplar möglich${bestand >= 1 ? ' (bereits vorhanden)' : ''}`]] as [string, React.ReactNode][])
      : ship.maxCount
      ? ([['Limit', `${bestand}/${ship.maxCount} gebaut/in Warteschlange${ship.maxCount - bestand <= 0 ? ' – Limit erreicht' : ''}`]] as [string, React.ReactNode][])
      : []),
  ];
  return rows;
}
