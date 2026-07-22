import type { EconomyClass } from '../types.js';
import { TRADE_FEE, SCRAP_REFUND_RATE } from './economy.js';

// ===== Wirtschafts-Klassen (Nutzerentscheidung Juli 2026) =====
// Zweite, unabhaengige Klassenwahl neben der Kampf-Klasse (siehe classes.ts) - reine
// Wirtschafts-Boni, ruehren NIE an Waffen/Schild/Panzerung. Jede Wahl/jeder Wechsel kostet
// ECONOMY_CLASS_CHANGE_COST_DM, AUCH die allererste Wahl (anders als die Kampf-Klasse, wo nur der
// Wechsel kostet) - siehe setEconomyClass() in classActions.ts.
export const ECONOMY_CLASS_CHANGE_COST_DM = 1000;

// ===== Schmuggler (Handel: guenstigerer Handel/Verschrotten/Shop) =====
export const ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER = 0.5; // Handelsgebuehr halbiert (20% -> 10%)
export const ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER = 1.5; // Schrott-Ruckerstattung 30% -> 45%
export const ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER = 0.85; // -15% DM-Kosten fuer Shop-Booster

// ===== Ingenieur (Bau: schnellere Bauzeiten, NICHT Kosten - die rabattieren schon die Kampf-Klassen) =====
export const ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER = 0.85; // -15% Bauzeit Schiffe/Verteidigung/Gebaeude

// ===== Prospektor (Foerderung: mehr Mining-Ertrag, schnellerer DM-Fund, weniger Treibstoff) =====
export const ECONOMY_PROSPEKTOR_MINING_MULTIPLIER = 1.2; // +20% Mining-Ertrag (Schiffe UND Gebaeude)
export const ECONOMY_PROSPEKTOR_DM_RATE_MULTIPLIER = 1.3; // +30% Dunkle-Materie-Fundrate im Asteroidenfeld
export const ECONOMY_PROSPEKTOR_FUEL_MULTIPLIER = 0.9; // -10% Treibstoffverbrauch bei Galaxie-Fluegen

export interface EconomyClassBonusLine {
  label: string;
}

export interface EconomyClassDefinition {
  id: EconomyClass;
  name: string;
  tagline: string;
  img: string;
  bonuses: EconomyClassBonusLine[];
}

// Reine Anzeige-/Metadaten fuer den Klassen-Tab (client/src/pages/Klasse.tsx), analog zu
// PLAYER_CLASSES in classes.ts - die tatsaechliche WIRKUNG steckt in den Konstanten oben.
export const ECONOMY_CLASSES: EconomyClassDefinition[] = [
  {
    id: 'schmuggler',
    name: 'Schmuggler',
    tagline: 'Handel - günstigerer Ressourcentausch, mehr für verschrottete Schiffe, billigere Booster.',
    img: 'classes/schmuggler.jpg',
    bonuses: [
      {
        label: `Handelsgebühr beim Händler halbiert (${Math.round(TRADE_FEE * 100)}% → ${Math.round(
          TRADE_FEE * ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER * 100
        )}%)`,
      },
      {
        label: `Schrott-Rückerstattung erhöht (${Math.round(SCRAP_REFUND_RATE * 100)}% → ${Math.round(
          SCRAP_REFUND_RATE * ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER * 100
        )}%)`,
      },
      { label: `${Math.round((1 - ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER) * 100)}% günstigere Booster im Shop` },
    ],
  },
  {
    id: 'ingenieur',
    name: 'Ingenieur',
    tagline: 'Bau - Schiffe, Verteidigung und Gebäude sind schneller fertig, nicht günstiger.',
    img: 'classes/ingenieur.jpg',
    bonuses: [
      { label: `${Math.round((1 - ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER) * 100)}% kürzere Bauzeit für Schiffe` },
      { label: `${Math.round((1 - ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER) * 100)}% kürzere Bauzeit für Verteidigungsanlagen` },
      { label: `${Math.round((1 - ECONOMY_INGENIEUR_BAUZEIT_MULTIPLIER) * 100)}% kürzere Bauzeit für Gebäude` },
    ],
  },
  {
    id: 'prospektor',
    name: 'Prospektor',
    tagline: 'Förderung - mehr Ertrag beim Mining, schnellerer Dunkle-Materie-Fund, weniger Treibstoffverbrauch.',
    img: 'classes/prospektor.jpg',
    bonuses: [
      { label: `+${Math.round((ECONOMY_PROSPEKTOR_MINING_MULTIPLIER - 1) * 100)}% Mining-Ertrag (Schiffe und Gebäude)` },
      { label: `+${Math.round((ECONOMY_PROSPEKTOR_DM_RATE_MULTIPLIER - 1) * 100)}% schnellerer Dunkle-Materie-Fund im Asteroidenfeld` },
      { label: `${Math.round((1 - ECONOMY_PROSPEKTOR_FUEL_MULTIPLIER) * 100)}% weniger Treibstoffverbrauch bei Galaxie-Flügen` },
    ],
  },
];
