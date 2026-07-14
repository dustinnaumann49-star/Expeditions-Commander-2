// RapidFire-Werte: RAPIDFIRE[angreiferId][zielId] = RF-Wert. Folgeschuss-Chance = (RF-1)/RF.
export const RAPIDFIRE: Record<string, Record<string, number>> = 
{
  leicht: {},
  schwer: {
    leicht: 3
  },
  begleitschiff: {
    leicht: 6,
    schwer: 4
  },
  kreuzer: {
    leicht: 6,
    schwer: 4,
    raketenwerfer: 10
  },
  schlachtschiff: {
    schwer: 5,
    kreuzer: 5,
    leichteslaser: 3
  },
  schlachtkreuzer: {
    leicht: 3,
    schwer: 4,
    kreuzer: 4,
    schlachtschiff: 7
  },
  zerstoerer: {
    schlachtkreuzer: 2,
    bomber: 5,
    leichteslaser: 10
  },
  reaper: {
    zerstoerer: 3,
    schlachtkreuzer: 4,
    bomber: 4
  },
  bomber: {
    raketenwerfer: 20,
    leichteslaser: 20,
    schwereslaser: 10,
    ionengeschuetz: 10,
    gausskanone: 5,
    plasmawerfer: 5
  },
  imperator: {
    leicht: 5, schwer: 5, kreuzer: 5, schlachtschiff: 5, bomber: 5, schlachtkreuzer: 7, zerstoerer: 7, reaper: 4,
    raketenwerfer: 5, leichteslaser: 5, schwereslaser: 5, ionengeschuetz: 5, gausskanone: 5, plasmawerfer: 5
  },
  raketenwerfer: {
    leicht: 4
  },
  leichteslaser: {
    leicht: 5,
    schwer: 3
  },
  schwereslaser: {
    schwer: 4,
    kreuzer: 3
  },
  gausskanone: {
    kreuzer: 4,
    schlachtschiff: 3
  },
  ionengeschuetz: {
    schlachtkreuzer: 3
  },
  plasmawerfer: {
    zerstoerer: 4,
    reaper: 3,
    imperator: 2
  }
};

// Basis-Genauigkeit (Zielerfassung) pro Schiffstyp: Chance, gezielt ein RF-faehiges Ziel anzuvisieren.
// Wird durch die Forschung "zielerfassung" erhoeht (+6%/Stufe beim Spieler, NPCs bleiben auf Basiswert).
export const ZIELERFASSUNG_BASE: Record<string, number> = 
{
  schwer: 0.25,
  begleitschiff: 0.35,
  kreuzer: 0.30,
  schlachtschiff: 0.30,
  schlachtkreuzer: 0.40,
  zerstoerer: 0.35,
  reaper: 0.45,
  bomber: 0.50,
  imperator: 0.55,
  raketenwerfer: 0.30,
  leichteslaser: 0.30,
  schwereslaser: 0.35,
  gausskanone: 0.35,
  ionengeschuetz: 0.35,
  plasmawerfer: 0.35
};

export const MAX_RESEARCH_LEVEL = 10;
export const SHIELD_REGEN_BASE = 0.20;
export const SHIELD_REGEN_MAX = 0.80;
export const PRECISION_BASE = 0.40;
export const PRECISION_MAX_PLAYER = 0.60;
export const DEFENSE_REPAIR_PERCENT = 0.70;
export const MAX_ROUNDS = 100;
export const MAX_BUILD_SLOTS = 3;
export const MAX_DEFENSE_SLOTS = 3;
export const MAX_RESEARCH_SLOTS = 2;
// Reines Sicherheitsnetz gegen unbegrenztes Wachstum (kein Performance-Limit mehr, da die
// Kampfberechnung jetzt in einem separaten Worker-Thread laeuft, siehe combatRunner.ts).
// Grosszuegig bemessen, damit auch gemeinsame Multiplayer-Flotten (mehrere Spieler kombiniert
// im selben Piraten-Sektor) genug Platz haben.
export const MAX_PLAYER_SHIPS = 100000;
