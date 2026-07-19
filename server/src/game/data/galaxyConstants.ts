import type { GalaxyPosition } from '../types.js';

// Eine Galaxie reicht fuer die aktuelle Spielerzahl bei weitem aus: 50 Systeme x 9 Positionen =
// 450 Plaetze. Positionen koennen frei bleiben - kein Zwang zur vollstaendigen Befuellung.
export const GALAXY_COUNT = 1;
export const GALAXY_SYSTEMS = 50;
export const GALAXY_POSITIONS = 9;

// Flugzeit-Formel (an OGame angelehnt: duration = BASIS + FAKTOR * sqrt(Distanz*10/Geschwindigkeit)),
// FAKTOR bewusst deutlich kleiner als OGames Standardwert (3500), damit eine Querung der gesamten
// Galaxie bei normal schnellen Schiffen 20-60 Minuten dauert statt mehrerer Stunden - siehe README.
export const GALAXY_DURATION_BASE_SEC = 10;
export const GALAXY_DURATION_FACTOR = 925;

// Distanz-Formel (identisch zu OGame, Galaxie "rund" gedacht - System 50 grenzt an System 1):
// gleiches System: 1000 + 5 * Positionsdifferenz
// anderes System:  2700 + 95 * kuerzeste Systemdifferenz
export const GALAXY_SAME_SYSTEM_BASE = 1000;
export const GALAXY_SAME_SYSTEM_FACTOR = 5;
export const GALAXY_DIFF_SYSTEM_BASE = 2700;
export const GALAXY_DIFF_SYSTEM_FACTOR = 95;

// Piratenbasen: feste, ueber die Galaxie verteilte Positionen (wie Spielerpositionen, aber nicht
// belegbar). Jeder Raid startet von einer zufaellig ausgewaehlten dieser Basen - siehe raids.ts.
export const PIRATE_BASES: GalaxyPosition[] = [
  { system: 3, position: 2 },
  { system: 8, position: 6 },
  { system: 13, position: 4 },
  { system: 17, position: 8 },
  { system: 22, position: 1 },
  { system: 26, position: 5 },
  { system: 31, position: 3 },
  { system: 35, position: 9 },
  { system: 39, position: 4 },
  { system: 43, position: 7 },
  { system: 46, position: 2 },
  { system: 49, position: 6 },
];

// Repraesentative Flottengeschwindigkeit fuer die Flugzeit-Berechnung eines Raids - die
// tatsaechliche Schiffszusammensetzung wird erst beim Eintreffen gewuerfelt (siehe combat.ts
// generateFallbackFleet), daher ein fester Mittelwert statt der "langsamstes Schiff"-Regel, die
// bei Spieler-Flotten gilt (dort ist die Zusammensetzung ja schon beim Start bekannt).
export const PIRATE_FLEET_SPEED = 7000;

// Vorbereitungszeit vor dem tatsaechlichen Abflug der Piraten von ihrer Basis (ersetzt die
// vorherige feste 30-Minuten-Vorwarnzeit) - danach kommt zusaetzlich die echte, distanzabhaengige
// Flugzeit (siehe raids.ts spawnRaidAt()).
export const RAID_PREP_MS = 60 * 60 * 1000;
