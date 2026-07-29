import type { GalaxyPosition } from '../types.js';

export interface SektorDefinition {
  id: string;
  name: string;
  img: string;
  typ: string;
  zweck: string;
  aktivitaet: string;
  gefahr: string;
  level: string;
}

export const SEKTOREN: SektorDefinition[] = 
[
  { id:"asteroid_niedrig", name:"Sektor A7 – Asteroiden-Feld (Niedrig)", img:"sektoren/asteroid_niedrig.png",
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (5.000/h je Schiff) / Dunkle Materie bis 15",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"asteroid_mittel", name:"Sektor A7 – Asteroiden-Feld (Mittel)", img:"sektoren/asteroid_mittel.png",
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (15.000/h je Schiff) / Dunkle Materie bis 30",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"asteroid_hoch", name:"Sektor A7 – Asteroiden-Feld (Hoch)", img:"sektoren/asteroid_hoch.png",
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (25.000/h je Schiff) / Dunkle Materie bis 45",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"piraten_niedrig", name:"Sektor P9 – Piraten-Sektor (Niedrig)", img:"sektoren/piraten_niedrig.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 8 Teile pro Kategorie (nur durch gewonnene Kämpfe erreichbar).",
    aktivitaet:"Piraten-Chance 55% pro Check (alle 4h, 24h Gesamtdauer)", gefahr:"Niedrig", level:"gruen" },
  { id:"piraten_mittel", name:"Sektor P9 – Piraten-Sektor (Mittel)", img:"sektoren/piraten_mittel.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte (bis zu 15 pro Kategorie, nur durch gewonnene Kämpfe erreichbar) - garantiert 1 Elite-Container bei Rückkehr. 8% Chance pro Check, die bisherige Beute dieser Mission zu verdoppeln.",
    aktivitaet:"Piraten-Chance 65% pro Check (alle 4h, 24h Gesamtdauer)", gefahr:"Mittel", level:"gelb" },
  { id:"piraten_hoch", name:"Sektor P9 – Piraten-Sektor (Hoch)", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte (bis zu 23 pro Kategorie, nur durch gewonnene Kämpfe erreichbar) - garantiert 3 Elite-Container bei Rückkehr. Gegner können hier auch stärker sein als die eigene Flotte. 8% Chance pro Check, die bisherige Beute dieser Mission zu verdoppeln.",
    aktivitaet:"Piraten-Chance 75% pro Check (alle 4h, 24h Gesamtdauer)", gefahr:"Hoch", level:"rot" },
  { id:"piraten_elite", name:"Sektor P9 – Elite-Bollwerk", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Hochburg (Nur Multiplayer)", zweck:"Nur gemeinsam mit verbündeten Spielern erreichbar. Piraten skalieren mit durchschnittlich 130% der kombinierten Flottenstärke aller Teilnehmer, mit spürbarer Schwankung von Kampf zu Kampf. Jederzeit per Rückruf abbrechbar - bereits gewonnene Kämpfe bleiben erhalten.",
    aktivitaet:"Kampf garantiert (alle 4 Stunden, 24h Gesamtdauer)", gefahr:"Extrem", level:"rot" },
  { id:"piraten_admiral", name:"Sektor P10 – Piratenadmiral", img:"sektoren/piraten_admiral.jpg",
    typ:"Boss-Gefecht (Nur Multiplayer)", zweck:"Ein einzelner, extrem zäher Piratenadmiral + kleine Elite-Eskorte statt einer Masse an Gegnern - nur Kreuzer-Klasse und größere Schiffe erlaubt (keine Jäger, keine Versorgungsschiffe). Alle 10 Minuten ein garantierter Kampf, bis zu 6 Checks über 1 Stunde. Nach jedem gewonnenen Kampf: Beute sichern und abziehen, oder weitermachen für mehr - der Admiral wird dabei mit jedem Check wütender (+15% auf seine Werte). Beim echten Sieg eine große Einmalprämie plus Dunkle Materie.",
    aktivitaet:"Kampf garantiert (alle 10 Minuten)", gefahr:"Extrem", level:"rot" }
];

export interface SektorConfig {
  checkChance: number;
  type: 'asteroid' | 'piraten';
  farmRate?: number;
  dmCap?: number;
  miningCap?: number;
  escortCap?: number;
  npcFloor: number;
  teileCap?: number;
  lootBase?: { metall: number; kristall: number; deuterium: number };
  bonusLootChance?: number;
  bonusLootMultiplier?: number;
  captainChance?: number;
  captainContainerTier?: 'silber' | 'gold' | 'elite';
  captainDm?: number;
  // Garantierte Elite-Container bei Missionsende (Nutzerentscheidung Juli 2026, Balance-Umbau
  // Piraten-Sektor: Mittel/Hoch ersetzen die Kapitaen-Zufallschance durch eine planbare, garantierte
  // Belohnung - siehe finalizeMission() in missions.ts).
  guaranteedEliteContainers?: number;
  multiplayerOnly?: boolean; // nur ueber gemeinsame Expeditionen erreichbar, nicht per Solo-Missionen
  // Position in der Galaxie (siehe game/galaxy.ts) - bestimmt die echte Flugzeit dorthin/zurueck
  // (ersetzt die vorher feste MISSION_TRAVEL_MS, siehe sendFleet() in missions.ts). Fehlt bewusst
  // bei piraten_elite (Elite-Bollwerk, nur ueber Gruppen-Expeditionen erreichbar) - bleibt bei der
  // alten festen Anflugzeit, ist nicht Teil dieser Erweiterung.
  galaxyPosition?: GalaxyPosition;
}

export const SEKTOR_CONFIG: Record<string, SektorConfig> = 
{
  asteroid_niedrig: { checkChance:0.00, type:"asteroid", farmRate:5000, dmCap:15, miningCap:300, escortCap:500, npcFloor:300000,
    galaxyPosition:{system:5, position:3} },
  asteroid_mittel:  { checkChance:0.00, type:"asteroid", farmRate:15000, dmCap:30, miningCap:220, escortCap:500, npcFloor:800000,
    galaxyPosition:{system:19, position:7} },
  asteroid_hoch:    { checkChance:0.00, type:"asteroid", farmRate:25000, dmCap:45, miningCap:180, escortCap:500, npcFloor:1800000,
    galaxyPosition:{system:34, position:1} },
  // Balance-Anpassung (Nutzerentscheidung Juli 2026): Missionen wirkten auf allen Solo-Stufen zu
  // leicht - checkChance/Feindstaerke/Beute wurden gestaffelt angehoben (niedrig am wenigsten,
  // hoch am staerksten), damit ein spuerbarer Schwierigkeits-/Belohnungs-Unterschied zwischen den
  // Stufen entsteht. niedrig bleibt bewusst die deutlich sanfteste Stufe fuer Gelegenheitsspieler.
  // Balance-Umbau (Nutzerentscheidung Juli 2026, "Piraten-Sektor fuehlt sich neben Aussenposten/
  // Piratenbasen ueberfluessig an"): Teile bleiben die Kernbelohnung ueberall, lootBase deutlich
  // reduziert (nur noch kleiner Nebeneffekt, nicht mehr Haupt-Anreiz). Mittel/Hoch tauschen die
  // Kapitaen-Zufallschance gegen GARANTIERTE Elite-Container (planbar statt Gluecksspiel) und werden
  // spuerbar staerker (npcFloor + PIRATEN_MULTIPLIER_ROLL weiter unten angehoben). Niedrig
  // bleibt bewusst unangetastet - weiterhin die sanfte Einstiegsstufe ohne Elite-Container.
  // Umbau 28.07.2026 (Nutzerentscheidung): Kampf-Checks laufen nicht mehr stuendlich, sondern alle
  // PIRATEN_CHECK_INTERVAL_MS (4h) ueber die volle MISSION_DURATION_MS (24h) - macht 6 Checks statt
  // vorher 4. teileCap ist jetzt die EINZIGE Teile-Quelle (die vorherige zeitbasierte Hintergrund-
  // Zuteilung in accrueFarming() wurde entfernt, siehe missions.ts) - auf 1,5x angehoben (analog zur
  // Check-Anzahl 6/4), damit eine durchgehend siegreiche Flotte weiterhin denselben Gesamt-Teile-
  // Ertrag pro Trip erreichen kann. lootBase (Rohstoff-Beute pro gewonnenem Check) bleibt UNVERAENDERT
  // (Nutzerentscheidung: keine zusaetzliche Rohstoff-Inflation, gleiche Begruendung wie beim
  // Asteroiden-Feld-Cap) - profitiert aber automatisch von den zusaetzlichen Checks pro Trip.
  piraten_niedrig:  { checkChance:0.55, type:"piraten", teileCap:8, npcFloor:300000,
    lootBase:{metall:3000, kristall:2000, deuterium:800}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.05, captainContainerTier:"silber", captainDm:10, galaxyPosition:{system:10, position:5} },
  piraten_mittel:   { checkChance:0.65, type:"piraten", teileCap:15, npcFloor:950000,
    lootBase:{metall:6000, kristall:3800, deuterium:1600}, bonusLootChance:0.15, bonusLootMultiplier:3,
    guaranteedEliteContainers:1, galaxyPosition:{system:27, position:9} },
  piraten_hoch:     { checkChance:0.75, type:"piraten", teileCap:23, npcFloor:2400000,
    lootBase:{metall:10000, kristall:6500, deuterium:3000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    guaranteedEliteContainers:3, galaxyPosition:{system:45, position:3} },
  // resourceCapOverTime entfernt (Umbau 28.07.2026, Nutzerentscheidung "nicht mehr ueber Zeit,
  // sondern durch gewonnene Kaempfe") - lootBase (25M/15M/10M PRO gewonnenem Check) war ohnehin
  // schon die dominante Rohstoffquelle hier, der Wegfall des zeitbasierten Zusatz-Tricklers ist
  // gegenueber den 6 potenziellen lootBase-Ausschuettungen pro Trip vernachlaessigbar.
  piraten_elite:    { checkChance:1, type:"piraten", teileCap:30, npcFloor:3000000,
    lootBase:{metall:25000000, kristall:15000000, deuterium:10000000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.15, captainContainerTier:"elite", captainDm:50,
    multiplayerOnly:true,
    galaxyPosition:{system:37, position:5} },
  // Boss-Gefecht (Punkt 76, siehe README): NUTZT SEKTOR_CONFIG nur fuer Anzeige-Zwecke/
  // Voraussetzungspruefung (multiplayerOnly, galaxyPosition fuer die Anflugzeit) - die eigentliche
  // Kampf-/Eskalations-/Rueckzugslogik ist bewusst NICHT hier, sondern in eigenen Konstanten in
  // combatConstants.ts (ADMIRAL_*) und der Ablauf-Logik in groupOps.ts, da sich das Boss-Gefecht
  // strukturell zu stark von den anderen Piraten-Sektoren unterscheidet (fester Gegner statt
  // Macht-Skalierung, 10-Minuten-Checks statt Stunden-Checks, Rueckzugs-Entscheidung).
  piraten_admiral:  { checkChance:1, type:"piraten", npcFloor:0,
    multiplayerOnly:true, galaxyPosition:{system:50, position:1} }
};

// Feindstaerke der Piraten-Sektoren als Anteil deiner eigenen Power. Niedrig bleibt bewusst klar
// unter der eigenen Staerke (Einstiegsstufe). Mittel wurde angehoben (spuerbar mehr Gegenwehr,
// aber weiterhin sicher unter 100%). Hoch kann seit der Balance-Anpassung (Juli 2026) auch UEBER
// die eigene Flottenstaerke gehen (bis 125%) - die staerkste Solo-Stufe soll echte Gefahr bedeuten
// koennen, nicht nur einen Gleichstand. Das Multiplayer-exklusive Elite-Bollwerk wurde im selben
// Zug nachgezogen (115-145% statt vorher 105-135%) - durch die Hoch-Anhebung war der Abstand
// zwischen staerkster Solo-Stufe und Elite-Bollwerk zu klein geworden, Elite soll spuerbar die
// haerteste Stufe bleiben (durchschnittlich 130% der KOMBINIERTEN Flottenstaerke aller
// Teilnehmer).
// Mittel/Hoch angehoben (Balance-Umbau Juli 2026, siehe Kommentar bei SEKTOR_CONFIG oben) - im
// Gegenzug fuer die garantierten Elite-Container sollen diese beiden Stufen spuerbar mehr
// Gegenwehr leisten als vorher.
export const PIRATEN_MULTIPLIER_ROLL: Record<string, number[]> =
{
  piraten_niedrig: [0.15, 0.175, 0.20],
  piraten_mittel:  [0.65, 0.75, 0.85],
  piraten_hoch:    [1.20, 1.35, 1.55],
  piraten_elite:   [1.15, 1.30, 1.45]
};
