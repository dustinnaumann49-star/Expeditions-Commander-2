import type { PlayerClass } from '../types.js';

export const CLASS_CHANGE_COST_DM = 500;

// ===== Kanonier (Angreifer: hoher Schaden, aber zerbrechlich) =====
export const CLASS_KANONIER_WAFFEN_MULTIPLIER = 2; // +100% NUR Waffenschaden
// Spiegelbild zu CLASS_BOLLWERK_DEFENSE_BONUS: Aufschlag ueberall AUSSER bei der Verteidigung der
// eigenen Basis, also auf Sektor-Missionen, Notruf-Events und gemeinsamen Expeditionen. Damit hat
// jeder der beiden Spezialisten ein Heimatfeld, auf dem er klar erste Wahl ist, und keiner ist
// irgendwo totes Inventar. Der Kommandant bekommt bewusst KEINEN Aufschlag - "ueberall zweiter,
// nirgends letzter" ist seine Identitaet.
export const CLASS_KANONIER_OFFENSE_BONUS = 1.2;
export const CLASS_KANONIER_SCHILD_MULTIPLIER = 1;
export const CLASS_KANONIER_PANZERUNG_MULTIPLIER = 1;
export const CLASS_KANONIER_FLEET_SPEED_MULTIPLIER = 1.25; // +25% Flottenspeed
export const CLASS_KANONIER_SHIP_COST_MULTIPLIER = 0.9; // -10% Baukosten Schiffe (NICHT Verteidigung)

// ===== BALANCE-GRUNDLAGE (11.08.2026, gemessen mit balance/session2-simulation/run_classes.mjs) =====
// Die Werte folgten urspruenglich einem "gleichen Budget" von 100 Prozentpunkten je Klasse
// (Kanonier 1x100 %, Bollwerk 2x50 %, Kommandant 3x33,3 %). **Die Messung hat das widerlegt:** bei
// gleichem Budget war der Kanonier in JEDER Situation die beste Wahl - auch bei der
// Heimatverteidigung, wo der Rueckzug abgeschaltet ist und das Bollwerk eine eigene
// Reparatur-Sonderregel hat. Grund: der Kampf ist ein Abnutzungssystem, wer schneller toetet
// kassiert weniger Runden Rueckfeuer. Robustheit verlaengert den Kampf und damit die Zeit unter
// Beschuss. Ein Punkt Schaden ist hier rund doppelt so viel wert wie ein Punkt Robustheit.
//
// Reine Zahlen-Angleichung reichte aber nicht: danach lagen alle drei ueberall gleichauf, es gab
// also keinen inhaltlichen Grund mehr, eine bestimmte Klasse zu waehlen. Deshalb jetzt
// **Grundbonus in ALLEN Situationen + Aufschlag auf dem Heimatfeld**:
//   Kanonier    Waffen x2,0  ->  x2,4 ausserhalb der Heimatverteidigung (OFFENSE_BONUS 1,2)
//   Bollwerk    Sch/Panz x1,6 -> x2,4 bei Heimatverteidigung        (DEFENSE_BONUS 1,5)
//   Kommandant  alles x1,4, kein Aufschlag - "ueberall zweiter, nirgends letzter"
//
// VERWORFEN wurde der naheliegendere Weg, die Boni komplett zu GATEN (Kanonier nur im Angriff,
// Bollwerk nur in der Verteidigung). Angriffe sind rund fuenfmal haeufiger als Raids - Raids laufen
// 2x/Woche mit 70 % Chance, Sektor-Missionen dauern 24 h und sind unbegrenzt parallel moeglich.
// Durchgerechnet mit den gemessenen Werten haette der Kommandant als einzige ungegatete Klasse
// ueberall vorn gelegen (Wochen-Verlustsumme 66 gegen 104 bei beiden Spezialisten), und zwei von
// drei Klassen waeren die Haelfte der Zeit wirkungslos gewesen.
//
// Endstand (20 bzw. 80 Wiederholungen, grosse Flotte):
//   Elite-Bollwerk  Kanonier 3,5 % | Bollwerk 4,8 % | Kommandant 4,0 % Verlust
//   Raid            Kanonier 31,6 % | Bollwerk 22,3 % | Kommandant 30,2 % Flottenverlust
//   Wochenbilanz    69,1 | 65,2 | 70,7  (7 Missionen + 1,4 Raids gewichtet)
// Die verbleibende Spanne von ~8 % liegt innerhalb der Messstreuung UND innerhalb der Unsicherheit
// der Wochen-Annahme selbst - wer mehr Raids als Missionen hat, verschiebt sie zugunsten des
// Bollwerks. Nicht weiter feinjustieren, das waere Anpassen an Rauschen.
//
// Profile bleiben dabei klar unterschiedlich: Kanonier 16 Runden gegen Bollwerk 41; das Bollwerk
// gewinnt den Raid mit der mit Abstand engsten Streuung (12-37 % gegen 18-45 %) und verliert
// praktisch keine Verteidigungsanlagen (0,2 % gegen 1,2 %).
//
// WICHTIG bei kuenftigen Aenderungen: `run_classes.mjs` neu laufen lassen und die Raid-Spanne
// (min-max) mitlesen. Die Streuung eines einzelnen Raids ist groesser als der gesamte
// Klassenunterschied - eine Messung mit 4 Durchlaeufen ergab hier einmal das exakte Gegenteil.
// Die GRUNDWERTE (ohne Aufschlag) gehen ueber /game/data an den Client (classCombatMultipliers),
// die Aufschlaege stehen als eigene Zeile in den Klassen-Beschreibungen unten.

// ===== Bollwerk (Verteidiger: haelt am laengsten durch, braucht aber laenger fuer den Sieg) =====
export const CLASS_BOLLWERK_WAFFEN_MULTIPLIER = 1;
export const CLASS_BOLLWERK_SCHILD_MULTIPLIER = 1.6;
// Aufschlag AUF den Grundwert oben, wenn die eigene Basis verteidigt wird (Raid) - gilt auch fuer
// Verstaerker, die einem anderen Spieler zu Hilfe kommen, da jede OwnedFleetContribution ihre
// eigene playerClass traegt. Ergibt effektiv Schild/Panzerung x2,7 statt x1,8.
// Warum ueberhaupt situativ (Nutzeridee vom 11.08.2026): nach der reinen Zahlen-Angleichung lagen
// alle drei Klassen ueberall gleichauf - es gab damit keinen inhaltlichen Grund mehr, eine
// bestimmte zu waehlen. Der urspruengliche Vorschlag war, die Boni komplett zu gaten (Kanonier nur
// im Angriff, Bollwerk nur in der Verteidigung). Das wurde VERWORFEN: Angriffe sind rund fuenfmal
// haeufiger als Raids, wodurch der Kommandant als einzige ungegatete Klasse ueberall vorne gelegen
// haette (Wochen-Verlustsumme 66 gegen 104 bei beiden Spezialisten - durchgerechnet mit den
// gemessenen Werten aus run_classes.mjs). Stattdessen: Grundbonus fuer ALLE Situationen, Aufschlag
// nur auf dem Heimatfeld. Niemand ist je totes Inventar.
export const CLASS_BOLLWERK_DEFENSE_BONUS = 1.5;
export const CLASS_BOLLWERK_PANZERUNG_MULTIPLIER = 1.6;
export const CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER = 0.75; // -25% Baukosten Verteidigungsanlagen (NICHT Schiffe)
// Ersetzt DEFENSE_REPAIR_PERCENT (0.70, combatConstants.ts) NUR fuer Bollwerk-Spieler bei Raids -
// siehe defenseRepairPercentFor() in raids.ts.
export const CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT = 0.9;

// ===== Kommandant (Allrounder: spuerbar auf allen drei Werten, aber schwaecher pro Wert als die
// beiden Spezialisten - schadens-aequivalent gleichauf mit Kanonier/Bollwerk, siehe
// Balance-Grundlage oben, nur gleichmaessig verteilt statt fokussiert) =====
export const CLASS_KOMMANDANT_COMBAT_MULTIPLIER = 1.4; // +40% auf alle drei (11.08.2026, siehe Balance-Grundlage oben)
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
      {
        label: `Bei Missionen, Events und Expeditionen stattdessen +${Math.round(
          (CLASS_KANONIER_WAFFEN_MULTIPLIER * CLASS_KANONIER_OFFENSE_BONUS - 1) * 100
        )}% Waffenschaden (nicht bei der Verteidigung der eigenen Basis)`,
      },
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
      {
        label: `Bei der Verteidigung der eigenen Basis (und als Verstärker bei fremden Raids) stattdessen +${Math.round(
          (CLASS_BOLLWERK_SCHILD_MULTIPLIER * CLASS_BOLLWERK_DEFENSE_BONUS - 1) * 100
        )}% Schild und Panzerung`,
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
