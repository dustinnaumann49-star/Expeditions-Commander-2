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
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (5.000/h je Schiff) / Dunkle Materie bis 5",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"asteroid_mittel", name:"Sektor A7 – Asteroiden-Feld (Mittel)", img:"sektoren/asteroid_mittel.png",
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (15.000/h je Schiff) / Dunkle Materie bis 10",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"asteroid_hoch", name:"Sektor A7 – Asteroiden-Feld (Hoch)", img:"sektoren/asteroid_hoch.png",
    typ:"Asteroiden-Feld (Groß)", zweck:"Sicherer Abbau mit Mining-Schiffen (25.000/h je Schiff) / Dunkle Materie bis 15",
    aktivitaet:"Keine Feindkontakte", gefahr:"Sicher", level:"gruen" },
  { id:"piraten_niedrig", name:"Sektor P9 – Piraten-Sektor (Niedrig)", img:"sektoren/piraten_niedrig.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 5 Teile pro Kategorie.",
    aktivitaet:"Piraten-Chance 50%", gefahr:"Niedrig", level:"gruen" },
  { id:"piraten_mittel", name:"Sektor P9 – Piraten-Sektor (Mittel)", img:"sektoren/piraten_mittel.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 10 Teile pro Kategorie.",
    aktivitaet:"Piraten-Chance 50%", gefahr:"Mittel", level:"gelb" },
  { id:"piraten_hoch", name:"Sektor P9 – Piraten-Sektor (Hoch)", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Basis (Geschützt)", zweck:"Plündere Waffen-/Schild-/Panzerungs-Teile mit jeder Kampfflotte. Bis zu 15 Teile pro Kategorie.",
    aktivitaet:"Piraten-Chance 50%", gefahr:"Hoch", level:"rot" },
  { id:"piraten_elite", name:"Sektor P9 – Elite-Bollwerk", img:"sektoren/piraten_hoch.png",
    typ:"Piraten-Hochburg (Nur Multiplayer)", zweck:"Nur gemeinsam mit verbündeten Spielern erreichbar. Piraten skalieren mit 120% der kombinierten Flottenstärke aller Teilnehmer. Zusätzlich zur normalen Beute/Teile-Sammlung: bis zu 20.000.000 Metall, 16.000.000 Kristall, 10.000.000 Deuterium über die Zeit (wie im Asteroiden-Feld).",
    aktivitaet:"Piraten-Chance 50%", gefahr:"Extrem", level:"rot" }
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
  resourceCapOverTime?: { metall: number; kristall: number; deuterium: number }; // zusaetzlich zur normalen Beute, laeuft wie dmCap linear ueber die 4h
}

export const SEKTOR_CONFIG: Record<string, SektorConfig> = 
{
  asteroid_niedrig: { checkChance:0.00, type:"asteroid", farmRate:5000, dmCap:5, miningCap:300, escortCap:500, npcFloor:300000 },
  asteroid_mittel:  { checkChance:0.00, type:"asteroid", farmRate:15000, dmCap:10, miningCap:220, escortCap:500, npcFloor:800000 },
  asteroid_hoch:    { checkChance:0.00, type:"asteroid", farmRate:25000, dmCap:15, miningCap:180, escortCap:500, npcFloor:1800000 },
  piraten_niedrig:  { checkChance:0.50, type:"piraten", teileCap:5, npcFloor:300000,
    lootBase:{metall:8000, kristall:5000, deuterium:2000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.05, captainContainerTier:"silber", captainDm:10 },
  piraten_mittel:   { checkChance:0.50, type:"piraten", teileCap:10, npcFloor:800000,
    lootBase:{metall:16000, kristall:10000, deuterium:4000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.08, captainContainerTier:"silber", captainDm:20 },
  piraten_hoch:     { checkChance:0.50, type:"piraten", teileCap:15, npcFloor:1800000,
    lootBase:{metall:26000, kristall:16000, deuterium:7000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.12, captainContainerTier:"gold", captainDm:35 },
  piraten_elite:    { checkChance:0.50, type:"piraten", teileCap:20, npcFloor:3000000,
    lootBase:{metall:40000, kristall:25000, deuterium:11000}, bonusLootChance:0.15, bonusLootMultiplier:3,
    captainChance:0.15, captainContainerTier:"elite", captainDm:50,
    multiplayerOnly:true, resourceCapOverTime:{metall:20000000, kristall:16000000, deuterium:10000000} }
};

// Feindstaerke der Piraten-Sektoren als Anteil deiner eigenen Power. Niedrig/Mittel/Hoch bleiben
// bewusst bei maximal 100% (Solo spielbar); nur das Multiplayer-exklusive Elite-Bollwerk geht
// bewusst darueber (120% der KOMBINIERTEN Flottenstaerke aller Teilnehmer).
export const PIRATEN_MULTIPLIER_ROLL: Record<string, number[]> = 
{
  piraten_niedrig: [0.15, 0.175, 0.20],
  piraten_mittel:  [0.50, 0.55, 0.60],
  piraten_hoch:    [0.90, 0.95, 1.00],
  piraten_elite:   [1.20, 1.20, 1.20]
};
