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
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 5 Teile pro Kategorie.",
    aktivitaet:"Piraten-Chance 55%", gefahr:"Niedrig", level:"gruen" },
  { id:"piraten_mittel", name:"Sektor P9 – Piraten-Sektor (Mittel)", img:"sektoren/piraten_mittel.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 10 Teile pro Kategorie.",
    aktivitaet:"Piraten-Chance 65%", gefahr:"Mittel", level:"gelb" },
  { id:"piraten_hoch", name:"Sektor P9 – Piraten-Sektor (Hoch)", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 15 Teile pro Kategorie. Gegner können hier auch stärker sein als die eigene Flotte.",
    aktivitaet:"Piraten-Chance 75%", gefahr:"Hoch", level:"rot" },
  { id:"piraten_elite", name:"Sektor P9 – Elite-Bollwerk", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Hochburg (Nur Multiplayer)", zweck:"Nur gemeinsam mit verbündeten Spielern erreichbar. Piraten skalieren mit durchschnittlich 130% der kombinierten Flottenstärke aller Teilnehmer, mit spürbarer Schwankung von Kampf zu Kampf. Zusätzlich zur normalen Beute/Teile-Sammlung: bis zu 20.000.000 Metall, 16.000.000 Kristall, 10.000.000 Deuterium über die Zeit (wie im Asteroiden-Feld).",
    aktivitaet:"Kampf garantiert (jede Stunde)", gefahr:"Extrem", level:"rot" },
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
  multiplayerOnly?: boolean; // nur ueber gemeinsame Expeditionen erreichbar, nicht per Solo-Missionen
  resourceCapOverTime?: { metall: number; kristall: number; deuterium: number }; // NUR bei piraten_elite (Elite-Bollwerk) genutzt, laeuft linear ueber dessen 4h-Missionsdauer (MISSION_DURATION_MS) - NICHT zu verwechseln mit dmCap bei Asteroiden-Feldern, das ueber ASTEROID_MISSION_DURATION_MS (12h) laeuft
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
  piraten_niedrig:  { checkChance:0.55, type:"piraten", teileCap:5, npcFloor:300000,
    lootBase:{metall:10000, kristall:6500, deuterium:2500}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.05, captainContainerTier:"silber", captainDm:10, galaxyPosition:{system:10, position:5} },
  piraten_mittel:   { checkChance:0.65, type:"piraten", teileCap:10, npcFloor:800000,
    lootBase:{metall:21000, kristall:13000, deuterium:5500}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.08, captainContainerTier:"silber", captainDm:20, galaxyPosition:{system:27, position:9} },
  piraten_hoch:     { checkChance:0.75, type:"piraten", teileCap:15, npcFloor:1800000,
    lootBase:{metall:35000, kristall:22000, deuterium:10000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.12, captainContainerTier:"gold", captainDm:35, galaxyPosition:{system:45, position:3} },
  piraten_elite:    { checkChance:1, type:"piraten", teileCap:20, npcFloor:3000000,
    lootBase:{metall:25000000, kristall:15000000, deuterium:10000000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.15, captainContainerTier:"elite", captainDm:50,
    multiplayerOnly:true, resourceCapOverTime:{metall:20000000, kristall:16000000, deuterium:10000000},
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
export const PIRATEN_MULTIPLIER_ROLL: Record<string, number[]> =
{
  piraten_niedrig: [0.15, 0.175, 0.20],
  piraten_mittel:  [0.55, 0.65, 0.75],
  piraten_hoch:    [1.00, 1.10, 1.25],
  piraten_elite:   [1.15, 1.30, 1.45]
};
