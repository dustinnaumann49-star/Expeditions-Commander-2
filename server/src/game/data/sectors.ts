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
    typ:"Piraten-Basis (Geschützt)", zweck:"4x Silber-Container + Ressourcen-Paket pro gewonnenem Kampf, ausgezahlt bei Rückkehr. Nur EINE Piraten-Sektor-Stufe gleichzeitig beflogbar.",
    aktivitaet:"Piraten-Chance 55% pro Check (alle 4h, 24h Gesamtdauer)", gefahr:"Niedrig", level:"gruen" },
  { id:"piraten_mittel", name:"Sektor P9 – Piraten-Sektor (Mittel)", img:"sektoren/piraten_mittel.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"2x Gold-Container + Ressourcen-Paket pro gewonnenem Kampf, ausgezahlt bei Rückkehr. Nur EINE Piraten-Sektor-Stufe gleichzeitig beflogbar.",
    aktivitaet:"Piraten-Chance 65% pro Check (alle 4h, 24h Gesamtdauer)", gefahr:"Mittel", level:"gelb" },
  { id:"piraten_hoch", name:"Sektor P9 – Piraten-Sektor (Hoch)", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"1x Elite-Container + Ressourcen-Paket pro gewonnenem Kampf, ausgezahlt bei Rückkehr. Gegner können hier auch stärker sein als die eigene Flotte. Nur EINE Piraten-Sektor-Stufe gleichzeitig beflogbar.",
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
  // Garantierte Container-Ausschuettung PRO UEBERSTANDENEM CHECK (Nutzerentscheidung, Neugestaltung
  // "Belohnungs-Balance" 04.08.2026, bisher nur beim Elite-Bollwerk genutzt) - unabhaengig von der
  // Zufalls-Kapitaen-Mechanik (captainChance), jeder Teilnehmer bekommt ALLE gelisteten Tiers bei
  // jedem Check mit mindestens einem vernichteten Gegner, siehe runGroupOperationCheck() in
  // groupOps.ts. Rundet das "Ende-Erlebnis" nach einer erfolgreich ueberstandenen 24h-Expedition
  // planbar ab.
  guaranteedContainers?: { tier: 'silber' | 'gold' | 'elite'; count: number }[];
  // Umbau 29.07.2026 (Nutzerentscheidung "Piraten-Sektor Solo nur noch EIN Container-Typ pro
  // Stufe"): NUR bei piraten_niedrig/mittel/hoch genutzt - ersetzt lootBase/teileCap/captainChance/
  // guaranteedEliteContainers KOMPLETT. Pro gewonnenem Check (mindestens ein Gegner vernichtet) gibt
  // es `count` Container von `tier`, gezaehlt in `Mission.combatWins` und wie beim Raid ERST am
  // Missionsende ausgezahlt (siehe finalizeMission() in missions.ts).
  winContainer?: { tier: 'silber' | 'gold' | 'elite'; count: number };
  // Skalierendes Ressourcen-Paket PRO GEWONNENEM CHECK, zusaetzlich zu winContainer (Nutzerentscheidung,
  // Neugestaltung "Belohnungs-Balance" 04.08.2026): faengt das durch die 50/30/20-Feindstaerke-Neugestaltung
  // (siehe PIRATEN_MULTIPLIER_ROLL) deutlich gestiegene Risiko der 20%-Spitzen ab - reiner Container-Loot
  // allein fuehlte sich bei einem verlorenen Kampf ohne jeden Ressourcen-Ausgleich zu hart an. Ausgezahlt
  // genauso wie winContainer erst am Missionsende (siehe finalizeMission() in missions.ts).
  winResources?: { metall: number; kristall: number; deuterium: number };
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
  // vorher 4.
  // Umbau 29.07.2026 (Nutzerentscheidung, zweite Ueberarbeitung): Solo-Piraten-Sektor auf EINEN
  // einzigen, reinen Container-Belohnungstyp pro Stufe reduziert (winContainer oben) - lootBase/
  // teileCap/bonusLootChance/captainChance/guaranteedEliteContainers KOMPLETT entfernt, ersetzt
  // durch 4x Silber (Niedrig) / 2x Gold (Mittel) / 1x Elite (Hoch) PRO GEWONNENEM CHECK, am
  // Missionsende ausgezahlt. Zusaetzlich darf jetzt nur noch EINE der drei Stufen gleichzeitig
  // beflogen werden (siehe sendFleet() in missions.ts) - man muss sich fuer Niedrig/Mittel/Hoch
  // entscheiden statt alle drei parallel laufen zu lassen.
  piraten_niedrig:  { checkChance:0.55, type:"piraten", npcFloor:300000,
    winContainer:{tier:"silber", count:4}, winResources:{metall:800000, kristall:500000, deuterium:200000},
    galaxyPosition:{system:10, position:5} },
  piraten_mittel:   { checkChance:0.65, type:"piraten", npcFloor:950000,
    winContainer:{tier:"gold", count:2}, winResources:{metall:2000000, kristall:1200000, deuterium:600000},
    galaxyPosition:{system:27, position:9} },
  piraten_hoch:     { checkChance:0.75, type:"piraten", npcFloor:2400000,
    winContainer:{tier:"elite", count:1}, winResources:{metall:5000000, kristall:3000000, deuterium:1500000},
    galaxyPosition:{system:45, position:3} },
  // resourceCapOverTime entfernt (Umbau 28.07.2026, Nutzerentscheidung "nicht mehr ueber Zeit,
  // sondern durch gewonnene Kaempfe") - lootBase (25M/15M/10M PRO gewonnenem Check) war ohnehin
  // schon die dominante Rohstoffquelle hier, der Wegfall des zeitbasierten Zusatz-Tricklers ist
  // gegenueber den 6 potenziellen lootBase-Ausschuettungen pro Trip vernachlaessigbar.
  // lootBase Korrektur 05.08.2026 (Nutzer-Fund): Live-Auswertung von 3 echten Checks zeigte, dass
  // die Wiederaufbaukosten der ueblichen Flottenverluste (bei zwei Teilnehmern zusammen ueber
  // 6 Mrd. Metall allein) die alte lootBase (25M/15M/10M PRO Teilnehmer) plus garantierte
  // Container um ein Vielfaches uebersteigen - das Elite-Bollwerk war dadurch ein reiner
  // Netto-Ressourcenverlust, sobald man die Flotte wieder auffuellen musste. Auf 100M/60M/40M
  // (4x) angehoben, damit sich die Expedition wirtschaftlich wieder lohnt, ohne an der
  // Kampf-Schwierigkeit selbst (siehe PIRATEN_MULTIPLIER_ROLL oben) etwas zu aendern.
  piraten_elite:    { checkChance:1, type:"piraten", teileCap:30, npcFloor:3000000,
    lootBase:{metall:100000000, kristall:60000000, deuterium:40000000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.15, captainContainerTier:"elite", captainDm:50,
    guaranteedContainers:[{tier:"silber", count:4}, {tier:"gold", count:3}, {tier:"elite", count:2}],
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

// Feindstaerke der Piraten-Sektoren als Anteil deiner eigenen Power - ein Eintrag pro Bucket im
// 50/30/20-Zufallssystem (Nutzerentscheidung, Neugestaltung "Dynamische Zufalls-Kampfskalierung"
// 04.08.2026): [50%-Chance-Wert, 30%-Chance-Wert, 20%-Chance-Wert]. Bei jedem einzelnen Kampf-Check
// wird EINER der drei Werte gemaess dieser festen Gewichtung gewuerfelt (siehe pick503020() in
// combat.ts), statt wie vorher gleichverteilt (je 1/3) - macht Kaempfe deutlich unberechenbarer,
// ohne die grobe Haerte-Reihenfolge der Stufen zu aendern. Der dritte Wert bei "Hoch" ist bewusst
// eine SPANNE ([min, max], gleichverteilt gewuerfelt) statt eines festen Werts - "der spuerbare
// Haertegrad fuer Solo-Spieler" (Nutzer-Formulierung) fuer die seltenste, extremste Ueberraschung.
// Der Piratenadmiral (P10) bleibt von dieser Aenderung unberuehrt (eigene Boss-Mechanik, siehe
// ADMIRAL_MULTIPLIER_ROLL in combatConstants.ts, weiterhin gleichverteilt gewuerfelt).
// Korrektur 05.08.2026 (Nutzerentscheidung, ungetestet zu hart angesetzt beim Umbau 04.08.2026):
// piraten_hoch von [1.00, 1.50, [1.50, 2.00]] auf [0.70, 0.95, [0.95, 1.20]] gesenkt - Simulation
// (siehe simulateCombat() in simulator.ts) zeigte bei den alten Werten selbst bei komplett
// maximierter Forschung/Modulen nur 25% Siegchance bei ø 67% Flottenverlust; Spieler mit
// schwaecherem Ausbau (Forschung/Module nicht maximal) hatten praktisch 0% Siegchance und ø 96%
// Verlust, was zu ungewollten Totalverlusten fuehrte (siehe Beschwerde-Faelle). Ausloeser war der
// Umbau von RapidFire/Krit-Schaden/Schild-Regen im selben Commit, der "Hoch" zusaetzlich zur
// Multiplier-Tabelle haerter machte - ein reines Zuruecksetzen der Tabelle auf den Vor-Umbau-Stand
// [1.20, 1.35, 1.55] reichte in der Simulation NICHT aus (weiterhin 0% Siegchance bei Max-Ausbau).
// Gleiche Korrektur am selben Tag auch fuer piraten_elite (Elite-Bollwerk): von [1.30, 1.80, 2.50]
// auf [0.90, 1.20, 1.55] gesenkt - Simulation zeigte 0% Siegchance bei ø 83% Verlust selbst bei
// Max-Ausbau (schwaecher ausgebaute Teilnehmer: 0% Siegchance, ø 97% Verlust). Bewusst weiterhin
// etwas haerter angesetzt als piraten_hoch (Elite-Bollwerk bleibt die Top-Stufe mit den besten
// Belohnungen: garantierte Container + bis zu 64x Perfect-Streak-Bonus, siehe economy.ts).
// Nachtrag 05.08.2026 (Nutzer-Fund): durch die Hoch-Korrektur oben lag piraten_mittel [0.80, 1.10,
// 1.40] danach ueber piraten_hoch [0.70, 0.95, 0.95-1.20] - die Haerte-Reihenfolge Niedrig < Mittel
// < Hoch < Elite war gebrochen. Niedrig auf [0.35, 0.50, 0.65] und Mittel auf [0.55, 0.75, 0.90]
// gesenkt, damit wieder jede Stufe strikt unter der naechsthoeheren liegt. Simulation bestaetigt
// die Reihenfolge bleibt sinnvoll gestaffelt: Niedrig praktisch risikofrei (auch ganz ohne
// Forschung/Module ø 1% Verlust), Mittel gut machbar (58-100% Siegchance je nach Ausbau).
export const PIRATEN_MULTIPLIER_ROLL: Record<string, [number, number, number | [number, number]]> =
{
  piraten_niedrig: [0.35, 0.50, 0.65],
  piraten_mittel:  [0.55, 0.75, 0.90],
  piraten_hoch:    [0.70, 0.95, [0.95, 1.20]],
  piraten_elite:   [0.90, 1.20, 1.55]
};
