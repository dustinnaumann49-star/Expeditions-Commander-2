import type { PlayerClass } from '../types.js';

export const CLASS_CHANGE_COST_DM = 500;

// ===== Kanonier (Angreifer: hoher Schaden, aber zerbrechlich) =====
export const CLASS_KANONIER_WAFFEN_MULTIPLIER = 2; // +100% NUR Waffenschaden
export const CLASS_KANONIER_SCHILD_MULTIPLIER = 1;
export const CLASS_KANONIER_PANZERUNG_MULTIPLIER = 1;
export const CLASS_KANONIER_FLEET_SPEED_MULTIPLIER = 1.25; // +25% Flottenspeed
export const CLASS_KANONIER_SHIP_COST_MULTIPLIER = 0.9; // -10% Baukosten Schiffe (NICHT Verteidigung)

// ===== Bollwerk (Verteidiger: haelt am laengsten durch, braucht aber laenger fuer den Sieg) =====
export const CLASS_BOLLWERK_WAFFEN_MULTIPLIER = 1;
export const CLASS_BOLLWERK_SCHILD_MULTIPLIER = 1.5; // +50% Schild
export const CLASS_BOLLWERK_PANZERUNG_MULTIPLIER = 1.5; // +50% Panzerung
export const CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER = 0.75; // -25% Baukosten Verteidigungsanlagen (NICHT Schiffe)
// Ersetzt DEFENSE_REPAIR_PERCENT (0.70, combatConstants.ts) NUR fuer Bollwerk-Spieler bei Raids -
// siehe defenseRepairPercentFor() in raids.ts.
export const CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT = 0.9;

// ===== Kommandant (Allrounder: spuerbar auf allen drei Werten, aber schwaecher pro Wert als die
// beiden Spezialisten - gleiches "Gesamtbudget" wie Kanonier/Bollwerk (100 Prozentpunkte,
// 3x 33.33% statt 1x 100% oder 2x 50%), nur gleichmaessig verteilt statt fokussiert) =====
export const CLASS_KOMMANDANT_COMBAT_MULTIPLIER = 4 / 3; // +33.33% auf Waffen UND Schild UND Panzerung
export const CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER = 0.9; // -10% Baukosten Schiffe UND Verteidigung
export const CLASS_KOMMANDANT_FLEET_SPEED_MULTIPLIER = 1.15; // +15% Flottenspeed

export interface ClassBonusLine {
  label: string;
}

export interface ClassDefinition {
  id: PlayerClass;
  name: string;
  tagline: string;
  img: string;
  bonuses: ClassBonusLine[];
}

// Reine Anzeige-/Metadaten fuer den Klassen-Tab (client/src/pages/Klasse.tsx) - die tatsaechliche
// WIRKUNG steckt in den Konstanten oben, die von combat.ts/actions.ts/galaxy.ts/raids.ts
// eingelesen werden. Bei Aenderung eines Bonus-WERTS oben bleibt der Anzeigetext hier automatisch
// synchron, weil er aus denselben Konstanten berechnet wird. Bilder liegen unter
// client/public/classes/ (JPEG, 700px Breite, ~58-60 KB - siehe README Punkt 55 zur
// Bildkomprimierung, gleiche Konvention wie bei Schiffsbildern).
export const PLAYER_CLASSES: ClassDefinition[] = [
  {
    id: 'kanonier',
    name: 'Kanonier',
    tagline: 'Reiner Angriff - tötet am schnellsten, hält am wenigsten aus.',
    img: 'classes/kanonier.jpg',
    bonuses: [
      { label: `+${Math.round((CLASS_KANONIER_WAFFEN_MULTIPLIER - 1) * 100)}% Waffenschaden auf Schiffe und Verteidigungsanlagen (Schild/Panzerung unverändert)` },
      { label: `+${Math.round((CLASS_KANONIER_FLEET_SPEED_MULTIPLIER - 1) * 100)}% Flottengeschwindigkeit` },
      { label: `${Math.round((1 - CLASS_KANONIER_SHIP_COST_MULTIPLIER) * 100)}% günstigere Schiffs-Baukosten` },
    ],
  },
  {
    id: 'bollwerk',
    name: 'Bollwerk',
    tagline: 'Reine Verteidigung - hält am längsten durch, braucht am längsten für den Sieg.',
    img: 'classes/bollwerk.jpg',
    bonuses: [
      {
        label: `+${Math.round((CLASS_BOLLWERK_SCHILD_MULTIPLIER - 1) * 100)}% Schild UND +${Math.round(
          (CLASS_BOLLWERK_PANZERUNG_MULTIPLIER - 1) * 100
        )}% Panzerung auf Schiffe und Verteidigungsanlagen (Waffenschaden unverändert)`,
      },
      { label: `${Math.round((1 - CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER) * 100)}% günstigere Verteidigungsanlagen-Baukosten` },
      { label: `Verteidigungsanlagen reparieren nach Kämpfen ${Math.round(CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT * 100)}% statt 70%` },
    ],
  },
  {
    id: 'kommandant',
    name: 'Kommandant',
    tagline: 'Allrounder - auf jedem Wert spürbar stärker, aber ohne Spezialisierung.',
    img: 'classes/kommandant.jpg',
    bonuses: [
      {
        label: `+${Math.round((CLASS_KOMMANDANT_COMBAT_MULTIPLIER - 1) * 100)}% Waffen/Schild/Panzerung gleichermaßen auf Schiffe und Verteidigungsanlagen`,
      },
      { label: `${Math.round((1 - CLASS_KOMMANDANT_SHIP_DEFENSE_COST_MULTIPLIER) * 100)}% günstigere Schiffs- UND Verteidigungs-Baukosten` },
      { label: `+${Math.round((CLASS_KOMMANDANT_FLEET_SPEED_MULTIPLIER - 1) * 100)}% Flottengeschwindigkeit` },
    ],
  },
];
