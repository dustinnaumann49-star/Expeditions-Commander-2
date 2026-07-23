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

// Stabile Ids fuer PIRATE_BASES per Index (fuer PirateBaseState-Persistenz, siehe
// pirateBaseState.ts) - rein positionsbasiert, KEINE eigene Nutzer-/DB-Identitaet.
export const PIRATE_BASE_IDS: string[] = PIRATE_BASES.map((_, i) => `pb_${i}`);

// Nutzerentscheidung (Juli 2026): Piratenbasen bekommen einen eigenen, angreifbaren Zustand
// (Flotte/Verteidigung/Ressourcen wie ein Mini-KI-Spieler, siehe pirateBaseState.ts) - koennen
// nicht zerstoert werden, wachsen aber langsam nach. Bewusst nur eine TEILMENGE der 12 Positionen
// aktiv/angreifbar ("erstmal mit 4 anfangen und schauen wie es laeuft" - bei nur 2 Spielern + 2
// KI-Bots waeren 12 gleichzeitig zu viel). Die uebrigen Positionen bleiben reine Raid-Ursprungs-
// Koordinaten ohne eigenen Zustand, genau wie bisher.
export const ACTIVE_PIRATE_BASE_IDS: string[] = PIRATE_BASE_IDS.slice(0, 4);

// ========== AUSSENPOSTEN (kontestierte Galaxie-Knoten, siehe game/outposts.ts) ==========
// Feste Positionen, analog zu PIRATE_BASES - kollidieren bewusst mit keiner PIRATE_BASES-/
// SEKTOR_CONFIG-Position. 6 Posten, 2 pro Staerke-Stufe (Nutzerentscheidung), ueber die Galaxie
// verteilt statt geklumpt.
export const OUTPOST_POSITIONS: GalaxyPosition[] = [
  { system: 6, position: 1 },
  { system: 15, position: 6 },
  { system: 24, position: 4 },
  { system: 33, position: 8 },
  { system: 41, position: 2 },
  { system: 48, position: 5 },
];
export type OutpostTierName = 'niedrig' | 'mittel' | 'hoch';
export const OUTPOST_TIERS: OutpostTierName[] = ['niedrig', 'niedrig', 'mittel', 'mittel', 'hoch', 'hoch'];
export const OUTPOST_IDS: string[] = OUTPOST_POSITIONS.map((_, i) => `op_${i}`);

// Repraesentative Flottengeschwindigkeit fuer die Flugzeit-Berechnung eines Raids - die
// tatsaechliche Schiffszusammensetzung wird erst beim Eintreffen gewuerfelt (siehe combat.ts
// generateFallbackFleet), daher ein fester Mittelwert statt der "langsamstes Schiff"-Regel, die
// bei Spieler-Flotten gilt (dort ist die Zusammensetzung ja schon beim Start bekannt).
export const PIRATE_FLEET_SPEED = 7000;

// Vorbereitungszeit vor dem tatsaechlichen Abflug der Piraten von ihrer Basis (ersetzt die
// vorherige feste 30-Minuten-Vorwarnzeit) - danach kommt zusaetzlich die echte, distanzabhaengige
// Flugzeit (siehe raids.ts spawnRaidAt()).
export const RAID_PREP_MS = 60 * 60 * 1000;

// ========== SPIONAGE (Nutzerentscheidung Juli 2026, siehe spyMissions.ts) ==========
// Spionagesonden ignorieren die normale Distanz-Formel bewusst - IMMER 5 Minuten je Richtung,
// egal wie weit die Zielbasis entfernt liegt (10 Minuten Gesamtflugzeit hin und zurueck).
export const SPY_PROBE_TRAVEL_MS = 5 * 60 * 1000;
// Flacher Treibstoffpreis PRO SONDE (ebenfalls distanzunabhaengig, passend zum Flugzeit-Prinzip)
// statt der ueblichen distanzbasierten galaxyFuelCost()-Formel.
export const SPY_PROBE_FUEL_COST_PER_PROBE = 50;

// Piraten spionieren umgekehrt auch Spieler aus (Nutzerentscheidung: "Piraten und KI bots
// spionieren auch") - bewusst leichtgewichtig als periodischer Hintergrund-Check (kein eigenes
// Flug-/Ankunfts-Modell wie bei Spieler-Sonden, siehe maybeGeneratePirateSpyReport() in
// spyMissions.ts), analog zum Raid-Checkpoint-Muster. Deckt NUR auf, DASS und VON WO aus spioniert
// wurde, nicht was die Piraten gesehen haben - Spieler haben schliesslich keine eigene "Spionage-
// Abwehr"-Forschung, die einen Detailgrad festlegen koennte.
export const PIRATE_SPY_CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000;
export const PIRATE_SPY_CHANCE = 0.25;
