const D = '/home/claude/repo/server/dist/game';
export const combat = await import(`${D}/combat.js`);
export const simulator = await import(`${D}/simulator.js`);
export const runner = await import(`${D}/combatRunner.js`);
export const sectors = await import(`${D}/data/sectors.js`);
export const cc = await import(`${D}/data/combatConstants.js`);
export const economy = await import(`${D}/data/economy.js`);
export const ships = await import(`${D}/data/ships.js`);
export const defenses = await import(`${D}/data/defenses.js`);

const COMBAT_RESEARCH = [
  'waffen', 'schild', 'panzerung', 'zielerfassung', 'durchschlag',
  'schildregeneration', 'praezision', 'ausweichen', 'kritischetreffer',
];

export function research(level) {
  const r = {};
  COMBAT_RESEARCH.forEach((id) => (r[id] = level));
  return r;
}

export function modules(level, shipIds) {
  const m = {};
  shipIds.forEach((id) => {
    m[`${id}_waffen`] = level;
    m[`${id}_schild`] = level;
    m[`${id}_panzerung`] = level;
  });
  return m;
}

// Minimaler PlayerState-Stub - simulateCombat() liest nur research/playerClass/shipModules/
// activeBoosters, nichts davon beruehrt die Datenbank.
export function makeState({ researchLevel, moduleLevel, playerClass, kampfBoost, shipIds, userId = 1 }) {
  return {
    userId,
    research: research(researchLevel),
    shipModules: modules(moduleLevel, shipIds),
    playerClass,
    activeBoosters: kampfBoost ? { kampf: Date.now() + 30 * 24 * 3600 * 1000 } : {},
    fleet: {},
    defense: {},
    resources: { metall: 0, kristall: 0, deuterium: 0, dm: 0 },
  };
}

// ===== Referenzflotten =====
// "Gross" = ausgebauter Account (Groessenordnung mehrere Mrd. Power), "Klein" = Aufbauphase.
export const FLEET_LARGE = {
  leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300,
  schlachtkreuzer: 400, zerstoerer: 300, reaper: 200,
  imperator: 2, salvenkreuzer: 20, salvendreadnought: 10,
};
export const FLEET_SMALL = {
  leicht: 400, schwer: 250, kreuzer: 120, schlachtschiff: 60,
  schlachtkreuzer: 40, zerstoerer: 25, reaper: 15,
};
// Nur Kreuzer-Klasse und groesser (ADMIRAL_ALLOWED_SHIP_IDS)
export const FLEET_ADMIRAL = {
  kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400,
  zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10,
};
export const FLEET_ADMIRAL_SMALL = {
  kreuzer: 120, schlachtschiff: 60, schlachtkreuzer: 40, zerstoerer: 25, reaper: 15,
};

export const ALL_SHIP_IDS = ships.SHIPS.map((s) => s.id).concat(defenses.DEFENSES.map((d) => d.id));

export const PROFILES = {
  voll:        { researchLevel: 10, moduleLevel: 10, playerClass: 'kanonier', kampfBoost: true },
  voll_noboost:{ researchLevel: 10, moduleLevel: 10, playerClass: 'kanonier', kampfBoost: false },
  mittel:      { researchLevel: 6,  moduleLevel: 5,  playerClass: 'kanonier', kampfBoost: true },
  schwach:     { researchLevel: 3,  moduleLevel: 0,  playerClass: null,       kampfBoost: true },
};

export function stateFor(profileName, userId = 1) {
  return makeState({ ...PROFILES[profileName], shipIds: ALL_SHIP_IDS, userId });
}

export function pct(x) { return `${(x * 100).toFixed(1)}%`; }
export function mio(x) { return `${(x / 1e6).toFixed(1)} Mio`; }
export function mrd(x) { return `${(x / 1e9).toFixed(2)} Mrd`; }

// Wert-Einheiten wie in Session 1 (TRADE_VALUE)
export function value(res) {
  return (res.metall || 0) + (res.kristall || 0) * 1.5 + (res.deuterium || 0) * 3;
}
