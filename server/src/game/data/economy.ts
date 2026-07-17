export interface BoosterDefinition {
  id: string;
  name: string;
  desc: string;
  img: string;
  cost: number;
  durationHours: number;
}

export const BOOSTERS: BoosterDefinition[] = 
[
  { id:"bautempo", name:"Bautempo-Boost", desc:"Schiffsbauzeit -50% für 24h", img:"booster/bautempo.png", cost:20, durationHours:24 },
  { id:"forschungstempo", name:"Forschungstempo-Boost", desc:"Forschungszeit -50% für 24h", img:"booster/forschungstempo.png", cost:20, durationHours:24 },
  { id:"kampf", name:"Kampf-Boost", desc:"Waffen/Schild/Panzerung +20% für 24h", img:"booster/kampf.png", cost:30, durationHours:24 },
  { id:"abbau", name:"Abbau-Boost", desc:"Mining-Rate +50% für 24h", img:"booster/abbau.png", cost:15, durationHours:24 }
];

export interface VoucherDefinition {
  id: string;
  label: string;
  img: string;
  type: 'zeitgutschein_bau' | 'zeitgutschein_forschung';
  percent: number;
  cost: number;
  desc: string;
}

export const SHOP_VOUCHERS: VoucherDefinition[] = 
[
  { id:"gutschein_bau_30", label:"Zeit-Gutschein Bau (30%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau", percent:0.30, cost:150,
    desc:"Reduziert die Restzeit des aktuell laufenden Bau-Auftrags um 30%. Nur nutzbar, wenn gerade etwas gebaut wird." },
  { id:"gutschein_bau_60", label:"Zeit-Gutschein Bau (60%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau", percent:0.60, cost:300,
    desc:"Reduziert die Restzeit des aktuell laufenden Bau-Auftrags um 60%. Nur nutzbar, wenn gerade etwas gebaut wird." },
  { id:"gutschein_forschung_30", label:"Zeit-Gutschein Forschung (30%)", img:"booster/gutschein_forschung.png", type:"zeitgutschein_forschung", percent:0.30, cost:200,
    desc:"Reduziert die Restzeit der aktuell laufenden Forschung um 30%. Nur nutzbar, wenn gerade geforscht wird." },
  { id:"gutschein_forschung_60", label:"Zeit-Gutschein Forschung (60%)", img:"booster/gutschein_forschung.png", type:"zeitgutschein_forschung", percent:0.60, cost:400,
    desc:"Reduziert die Restzeit der aktuell laufenden Forschung um 60%. Nur nutzbar, wenn gerade geforscht wird." }
];

export interface ContainerRewardDef {
  type: 'resources' | 'dm' | 'teile' | 'zeitgutschein_bau' | 'zeitgutschein_forschung' | 'freischiff';
  label: string;
  metall?: number;
  kristall?: number;
  deuterium?: number;
  amount?: number;
  waffen?: number;
  schild?: number;
  panzerung?: number;
  percent?: number;
  ships?: Record<string, number>;
}

export interface ContainerTypeDef {
  name: string;
  tier: string;
  icon: string;
  color: string;
  pickCount: number;
  rewards: ContainerRewardDef[];
}

export const CONTAINER_TYPES: Record<string, ContainerTypeDef> = 
{
  silber: {
    name: "Silber-Container",
    tier: "silber",
    icon: "📦",
    color: "#b0b0b0",
    pickCount: 3,
    rewards: [
      { type:'resources', label:'Rohstoff-Fracht', metall:5000000, kristall:3000000, deuterium:1500000 },
      { type:'teile', label:'Ausrüstungs-Kiste', waffen:10, schild:10, panzerung:10 },
      { type:'zeitgutschein_bau', label:'Zeit-Gutschein Bau (30%)', percent:0.30 },
      { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (30%)', percent:0.30 },
      { type:'freischiff', label:'Geschenkte Flotte', ships:{ leicht:15, schwer:15, kreuzer:10, schlachtschiff:10, bomber:10, schlachtkreuzer:5, zerstoerer:5, reaper:5 } }
    ]
  },
  gold: {
    name: "Gold-Container",
    tier: "gold",
    icon: "🏆",
    color: "#ffd700",
    pickCount: 4,
    rewards: [
      { type:'resources', label:'Große Rohstoff-Fracht', metall:15000000, kristall:13000000, deuterium:11500000 },
      { type:'dm', label:'Dunkle Materie', amount:15 },
      { type:'teile', label:'Große Ausrüstungs-Kiste', waffen:30, schild:30, panzerung:30 },
      { type:'zeitgutschein_bau', label:'Zeit-Gutschein Bau (60%)', percent:0.60 },
      { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (60%)', percent:0.60 },
      { type:'freischiff', label:'Geschenkte Großflotte', ships:{ leicht:30, schwer:30, kreuzer:20, schlachtschiff:20, bomber:20, schlachtkreuzer:10, zerstoerer:10, reaper:10 } }
    ]
  }
};

export interface NpcSpecialDef {
  id: string;
  name: string;
  isCaptain?: boolean;
  stats: { waffen: number; schild: number; panzerung: number };
}

export const NPC_SPECIALS: NpcSpecialDef[] = 
[
  { id:"piratenkapitan", name:"Piratenkapitän", isCaptain:true,
    stats:{waffen:6500, schild:1800, panzerung:48000} }
];

export const ALLY_STATS = { waffen: 4000, schild: 2000, panzerung: 30000 };
// Beide Ereignisse pruefen an denselben vier festen Tageszeiten (Server-UTC-Zeit), nicht mehr
// in zufaelligen Intervallen. Sinn: Alle Spieler wissen genau, wann ein Check stattfindet.
export const FIXED_CHECK_HOURS_UTC = [0, 6, 12, 18];

export const EVENT_SPAWN_CHANCE = 0.4; // 40% Chance bei jedem der vier Checks
export const EVENT_WINDOW_MS = 60 * 60 * 1000;
export const EVENT_NAMES = [
  'Notruf: Handelsgilde in Bedrängnis',
  'Notruf: Kolonieschiff unter Beschuss',
  'Notruf: Forschungsstation angegriffen',
];

export const RAID_WARNING_MS = 30 * 60 * 1000;
export const RAID_SPAWN_CHANCE = 0.6; // 60% Chance bei jedem der vier Checks
export const RAID_LOOT_PERCENT = 0.25;

export const ASTEROID_ESCORT_POWER_MIN = 0.08;
export const ASTEROID_ESCORT_POWER_MAX = 0.16;
export const ASTEROID_ESCORT_KILL_REWARD = { metall: 750000, kristall: 600000, deuterium: 500000 };

export const MISSION_TRAVEL_MS = 60 * 1000;
export const MISSION_DURATION_MS = 4 * 3600 * 1000;
// Asteroiden-Felder laufen bewusst laenger als Piraten-Sektoren: weniger haeufiges Nachschauen
// noetig (guenstig fuer Spieler mit wenig Zeit), dafuer entsprechend mehr Ertrag pro Durchgang.
export const ASTEROID_MISSION_DURATION_MS = 12 * 3600 * 1000;

export const SCRAP_REFUND_RATE = 0.3;
export const TRADE_VALUE: Record<string, number> = { metall: 1, kristall: 1.5, deuterium: 3 };
export const TRADE_FEE = 0.2;

export const COMBAT_SHIP_IDS = [
  'leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber',
  'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator',
  'salvenjaeger', 'salvenkreuzer', 'salvendreadnought',
];

// Liefert den naechsten der vier festen Tages-Checkpunkte (00/06/12/18 Uhr UTC) NACH "now".
// Wird sowohl fuer Raids als auch fuer Notruf-Events verwendet, damit beide Ereignisse an
// denselben, fuer alle Spieler vorhersehbaren Zeitpunkten geprueft werden.
export function nextFixedCheckpoint(now: number): number {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  for (const hour of FIXED_CHECK_HOURS_UTC) {
    d.setUTCHours(hour);
    if (d.getTime() > now) return d.getTime();
  }
  // Kein Checkpoint mehr heute uebrig -> erster Checkpoint morgen
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(FIXED_CHECK_HOURS_UTC[0]);
  return d.getTime();
}

// Sicherheitsnetz gegen (praktisch unmoegliche) Endlosschleifen bei extrem alten/verwaisten
// Spielstaenden - bei 4 Checkpoints/Tag deckt das ueber 100 Jahre ab, weit mehr als je gebraucht.
const MAX_BACKFILL_CHECKPOINTS = 400;

/**
 * Rollt JEDEN verpassten Checkpoint zwischen "lastCheck" (exklusiv) und "now" (inklusiv) einzeln
 * nach, statt (wie zuvor) einfach zum naechsten Checkpoint NACH "now" zu springen und alle
 * dazwischenliegenden Zeitpunkte ersatzlos zu ueberspringen. Wichtig fuer Spieler, die laenger
 * offline waren: sie sollen dieselbe statistische Chance je verstrichenem Checkpoint bekommen wie
 * ein durchgehend aktiver Spieler, nicht nur einen einzigen verspaeteten Wurf im Moment ihrer
 * Rueckkehr. Stoppt beim ERSTEN erfolgreichen Wurf (nur ein Raid/Event kann gleichzeitig aktiv
 * sein) und ruft dann `onSuccess` mit dem TATSAECHLICHEN Checkpoint-Zeitpunkt auf (nicht "now") -
 * dadurch basieren spawnedAt/arrivalTime auf der eigentlich vorgesehenen Uhrzeit, nicht auf dem
 * zufaelligen Moment, in dem der Spieler zufaellig wieder online kam.
 * Gibt den naechsten zu speichernden Checkpoint zurueck (das naechste Mal, ab dem wieder geprueft
 * werden soll).
 */
export function rollFixedCheckpoints(lastCheck: number, now: number, spawnChance: number, onSuccess: (checkpointTime: number) => void): number {
  let checkpoint = lastCheck;
  for (let i = 0; i < MAX_BACKFILL_CHECKPOINTS; i++) {
    checkpoint = nextFixedCheckpoint(checkpoint);
    if (checkpoint > now) return checkpoint;
    if (Math.random() < spawnChance) {
      onSuccess(checkpoint);
      return nextFixedCheckpoint(checkpoint);
    }
  }
  // Sicherheitsnetz gegriffen (extrem lange Abwesenheit) - Rest ueberspringen statt zu haengen.
  return nextFixedCheckpoint(now);
}
