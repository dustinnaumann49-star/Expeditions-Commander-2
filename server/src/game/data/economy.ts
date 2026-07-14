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
export const EVENT_NPC_MULTIPLIER = 2.5;
export const EVENT_MULTIPLIER_ROLL = [0.5, 1.0, 1.5];
export const EVENT_CHECK_INTERVAL_MS = 2 * 3600 * 1000;
export const EVENT_SPAWN_CHANCE = 0.2;
export const EVENT_WINDOW_MS = 60 * 60 * 1000;
export const EVENT_NAMES = [
  'Notruf: Handelsgilde in Bedrängnis',
  'Notruf: Kolonieschiff unter Beschuss',
  'Notruf: Forschungsstation angegriffen',
];

export const RAID_CHECK_INTERVAL_MS = 12 * 3600 * 1000;
export const RAID_WARNING_MS = 30 * 60 * 1000;
export const RAID_MULTIPLIER = 1.2;
export const RAID_MULTIPLIER_ROLL = [0.5, 1.0, 1.5];
export const RAID_LOOT_PERCENT = 0.25;

export const ASTEROID_ESCORT_POWER_MIN = 0.08;
export const ASTEROID_ESCORT_POWER_MAX = 0.16;
export const ASTEROID_ESCORT_KILL_REWARD = { metall: 750000, kristall: 600000, deuterium: 500000 };

export const MISSION_TRAVEL_MS = 60 * 1000;
export const MISSION_DURATION_MS = 4 * 3600 * 1000;

export const SCRAP_REFUND_RATE = 0.3;
export const TRADE_VALUE: Record<string, number> = { metall: 1, kristall: 1.5, deuterium: 3 };
export const TRADE_FEE = 0.2;

export const COMBAT_SHIP_IDS = [
  'leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber',
  'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator',
];
