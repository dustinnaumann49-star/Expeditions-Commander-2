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
    schwer: 4
  },
  schlachtschiff: {
    kreuzer: 5
  },
  schlachtkreuzer: {
    leicht: 3,
    schwer: 4,
    kreuzer: 4,
    schlachtschiff: 7
  },
  zerstoerer: {
    schlachtkreuzer: 2,
    bomber: 5
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
  },
  // Spezialschiffe mit Mehrfachziel-Salve (siehe MULTI_TARGET_VOLLEY_SHIPS): jedes deckt gezielt
  // eine ganze Schiffsklasse ab - bei erfolgreicher Zielerfassung wird JEDER hier gelistete Typ
  // einmal getroffen (nicht nur eine zufaellige Einheit davon).
  salvenjaeger: {
    leicht: 6,
    schwer: 5
  },
  salvenkreuzer: {
    kreuzer: 6,
    schlachtschiff: 5,
    bomber: 5
  },
  salvendreadnought: {
    schlachtkreuzer: 5,
    zerstoerer: 5,
    reaper: 4
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
  plasmawerfer: 0.35,
  salvenjaeger: 0.35,
  salvenkreuzer: 0.35,
  salvendreadnought: 0.35
};

// ===== Groessenabhaengige Kampf-Modifikatoren =====
// Grundgedanke: Kleine, wendige Schiffe kaempfen nah am Feind und treffen dadurch zuverlaessiger,
// haben aber zu wenig Energie fuer starke Schildaufladung. Grosse Schiffe feuern aus Distanz
// (ungenauer), haben dafuer massive Energiereserven fuer Schild-Regeneration. Verteidigungsanlagen
// haengen an der Basis-Energieversorgung und laden daher IMMER stark auf, unabhaengig von ihrer
// Groesse.

// Aufschlag auf die Basis-Praezision (PRECISION_BASE). Positiv = trifft besser.
export const PRECISION_MODIFIER: Record<string, number> = {
  leicht: 0.15,
  schwer: 0.12,
  salvenjaeger: 0.12,
  sandronator: 0.10,
  begleitschiff: 0.10,
  kreuzer: 0.05,
  salvenkreuzer: 0.0,
  schlachtschiff: -0.05,
  bomber: -0.08,
  schlachtkreuzer: -0.08,
  salvendreadnought: -0.10,
  zerstoerer: -0.10,
  reaper: -0.12,
  imperator: -0.15,
  // Verteidigungsanlagen: je groesser das Geschuetz, desto traeger zielt es
  raketenwerfer: 0.10,
  leichteslaser: 0.10,
  schwereslaser: 0.02,
  ionengeschuetz: 0.0,
  gausskanone: -0.05,
  plasmawerfer: -0.08,
};

// Aufschlag auf die Basis-Schild-Regeneration (SHIELD_REGEN_BASE). Positiv = laedt schneller auf.
export const SHIELD_REGEN_MODIFIER: Record<string, number> = {
  leicht: -0.12,
  schwer: -0.08,
  salvenjaeger: -0.08,
  sandronator: -0.05,
  begleitschiff: -0.05,
  kreuzer: -0.02,
  salvenkreuzer: 0.04,
  schlachtschiff: 0.10,
  bomber: 0.12,
  schlachtkreuzer: 0.14,
  salvendreadnought: 0.16,
  zerstoerer: 0.18,
  reaper: 0.20,
  imperator: 0.25,
  // Alle Verteidigungsanlagen haengen an der Basis-Energie -> einheitlich starke Aufladung
  raketenwerfer: 0.25,
  leichteslaser: 0.25,
  schwereslaser: 0.25,
  ionengeschuetz: 0.25,
  gausskanone: 0.25,
  plasmawerfer: 0.25,
};

// Basis-Ausweichchance: Wahrscheinlichkeit, einem Treffer komplett zu entgehen. Spiegelbild zur
// Praezision - kleine, wendige Schiffe sind schwerer zu treffen. Unbewegliche Verteidigungsanlagen
// koennen grundsaetzlich nicht ausweichen (0).
export const EVASION_BASE: Record<string, number> = {
  leicht: 0.12,
  schwer: 0.09,
  salvenjaeger: 0.09,
  sandronator: 0.10,
  begleitschiff: 0.08,
  kreuzer: 0.05,
  salvenkreuzer: 0.03,
  schlachtschiff: 0.02,
  bomber: 0.01,
  schlachtkreuzer: 0.01,
  salvendreadnought: 0.0,
  zerstoerer: 0.0,
  reaper: 0.0,
  imperator: 0.0,
};
export const EVASION_MAX = 0.30; // harte Obergrenze, damit Jaegerschwaerme nicht unbesiegbar werden

// Basis-Chance auf einen kritischen Treffer (doppelter Schaden). Grosse Schiffe treffen seltener,
// richten dafuer aber oefter verheerenden Schaden an, wenn sie treffen.
export const CRIT_CHANCE_BASE: Record<string, number> = {
  leicht: 0.03,
  schwer: 0.04,
  salvenjaeger: 0.04,
  sandronator: 0.05,
  begleitschiff: 0.03,
  kreuzer: 0.06,
  salvenkreuzer: 0.08,
  schlachtschiff: 0.10,
  bomber: 0.12,
  schlachtkreuzer: 0.12,
  salvendreadnought: 0.15,
  zerstoerer: 0.15,
  reaper: 0.18,
  imperator: 0.20,
  raketenwerfer: 0.05,
  leichteslaser: 0.05,
  schwereslaser: 0.08,
  ionengeschuetz: 0.10,
  gausskanone: 0.12,
  plasmawerfer: 0.15,
};
export const CRIT_CHANCE_MAX = 0.35;
export const CRIT_DAMAGE_MULTIPLIER = 2;

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

// Spezialschiffe mit "Mehrfachziel-Salve": statt bei erfolgreicher Zielerfassung nur EIN
// RF-anfaelliges Ziel zu treffen, feuern sie auf JEDEN anfaelligen SCHIFFSTYP einmal (nicht auf
// jede einzelne Einheit - siehe fireShots() in combat.ts fuer die genaue Umsetzung).
export const MULTI_TARGET_VOLLEY_SHIPS = new Set(['salvenjaeger', 'salvenkreuzer', 'salvendreadnought']);
