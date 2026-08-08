// Piratenbasen-Angriffe (pirateBaseState.ts): lohnt sich der Angriff gegen den Beute-Deckel?
// Aufruf: node run_pirate_base.mjs [laeufe]
import { combat, runner, ships, defenses, stateFor, value, pct, mio, mrd } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 4);
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]).concat(defenses.DEFENSES.map((d) => [d.id, d])));
const unitValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * unitValue(id), 0);

// 1:1 aus pirateBaseState.ts (SEED_FLEET/SEED_DEFENSE/RESOURCE_CAP/PIRATE_BASE_LOOT_PERCENT) -
// dort bewusst nicht exportiert, daher hier gespiegelt.
const SEED_FLEET = { leicht: 2000, schwer: 1500, kreuzer: 800, schlachtschiff: 400, bomber: 300, schlachtkreuzer: 150, zerstoerer: 100, reaper: 50 };
const SEED_DEFENSE = { raketenwerfer: 400, leichteslaser: 300, schwereslaser: 200, gausskanone: 100, ionengeschuetz: 80, plasmawerfer: 40 };
const RESOURCE_CAP = { metall: 44000000, kristall: 20000000, deuterium: 6000000 };
const LOOT_PERCENT = 0.35;
const NPC_PRODUCTION_BONUS = 6; // economy.ts
const SEED_BUILDINGS = { metallmine: 4, kristallmine: 3, deuteriummine: 2, solarkraftwerk: 4 };

const garrison = { ...SEED_FLEET };
Object.entries(SEED_DEFENSE).forEach(([id, n]) => (garrison[id] = (garrison[id] || 0) + n));

const maxLoot = value({ metall: RESOURCE_CAP.metall * LOOT_PERCENT, kristall: RESOURCE_CAP.kristall * LOOT_PERCENT, deuterium: RESOURCE_CAP.deuterium * LOOT_PERCENT });

console.log('=== 1. Garnison und Beute-Deckel ===\n');
console.log(`  Garnison (Mindestbestand, waechst nur nach oben): ${Object.values(garrison).reduce((a, b) => a + b, 0)} Einheiten`);
console.log(`  Garnisons-Wert: ${mrd(fleetValue(garrison))}, BasePower: ${mrd(combat.combatFleetPowerBase(garrison))}`);
console.log(`  Maximale Beute pro Angriff (35% des vollen Ressourcen-Deckels): ${mio(maxLoot)} Wert\n`);

// Produktionsrate der Basis (levelScaled = base * L * 1.1^L, Energiefaktor beruecksichtigt)
const scaled = (b, L) => (L > 0 ? b * L * Math.pow(1.1, L) : 0);
const prod = {
  metall: scaled(10000, SEED_BUILDINGS.metallmine),
  kristall: scaled(6700, SEED_BUILDINGS.kristallmine),
  deuterium: scaled(3300, SEED_BUILDINGS.deuteriummine),
};
const energyOut = scaled(1300, SEED_BUILDINGS.solarkraftwerk);
const energyUse = scaled(700, SEED_BUILDINGS.metallmine) + scaled(700, SEED_BUILDINGS.kristallmine) + scaled(1100, SEED_BUILDINGS.deuteriummine);
const eFactor = Math.min(1, energyOut / energyUse);
console.log('=== 2. Wie schnell fuellt sich der Deckel? ===\n');
console.log(`  Energiefaktor der Seed-Gebaeude: ${eFactor.toFixed(3)} (${Math.round(energyOut)} erzeugt / ${Math.round(energyUse)} benoetigt)`);
Object.entries(prod).forEach(([res, perHour]) => {
  const real = perHour * eFactor * NPC_PRODUCTION_BONUS;
  console.log(`  ${res.padEnd(10)} ${Math.round(real).toLocaleString('de-DE').padStart(12)}/h -> Deckel ${RESOURCE_CAP[res].toLocaleString('de-DE')} erreicht nach ${(RESOURCE_CAP[res] / (real * 24)).toFixed(1)} Tagen`);
});
const dailyValue = value({ metall: prod.metall * eFactor * NPC_PRODUCTION_BONUS * 24, kristall: prod.kristall * eFactor * NPC_PRODUCTION_BONUS * 24, deuterium: prod.deuterium * eFactor * NPC_PRODUCTION_BONUS * 24 });
console.log(`  Nachwachsender Wert pro Basis und Tag: ${mio(dailyValue)} -> 4 aktive Basen = ${mio(dailyValue * 4)}/Tag = ${pct((dailyValue * 4) / 21.69e9)} der Einnahmen-Baseline\n`);

console.log('=== 3. Angriffe: Verlust gegen Beute ===\n');
console.log('Flotte                     Wert       Verlust      Verlust%   Beute(max)   Netto');

const FLEETS = {
  'klein (Aufbau)': { leicht: 400, schwer: 250, kreuzer: 120, schlachtschiff: 60, schlachtkreuzer: 40, zerstoerer: 25, reaper: 15 },
  'gross': { leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
  'real (Session 3)': { leicht: 12000, schwer: 9000, kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 },
  'nur Jaeger (gleicher Wert wie gross)': { leicht: 20000, schwer: 10000 },
};

const state = stateFor('voll', 1);
for (const [label, fleet] of Object.entries(FLEETS)) {
  let lostSum = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: garrison,
      research: state.research,
      playerClass: state.playerClass,
      kampfBoostActive: true,
      shipModules: state.shipModules,
      allowRetreat: true,
    });
    const rest = {};
    Object.keys(fleet).forEach((id) => (rest[id] = r.survivorsA[id] || 0));
    lostSum += fleetValue(fleet) - fleetValue(rest);
  }
  const lost = lostSum / RUNS;
  const fv = fleetValue(fleet);
  console.log(
    `${label.padEnd(26)} ${mrd(fv).padStart(9)} ${mrd(lost).padStart(12)} ${pct(lost / fv).padStart(11)} ${mio(maxLoot).padStart(12)} ${mrd(maxLoot - lost).padStart(10)}`
  );
}
process.exit(0);
