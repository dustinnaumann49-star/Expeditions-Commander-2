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
      { type:'resources', label:'Rohstoff-Fracht', metall:10000000, kristall:6000000, deuterium:3000000 },
      { type:'teile', label:'Ausrüstungs-Kiste', waffen:20, schild:20, panzerung:20 },
      { type:'zeitgutschein_bau', label:'Zeit-Gutschein Bau (40%)', percent:0.40 },
      { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (40%)', percent:0.40 },
      { type:'freischiff', label:'Geschenkte Flotte', ships:{ leicht:25, schwer:25, kreuzer:15, schlachtschiff:15, bomber:15, schlachtkreuzer:8, zerstoerer:8, reaper:8 } }
    ]
  },
  gold: {
    name: "Gold-Container",
    tier: "gold",
    icon: "🏆",
    color: "#ffd700",
    pickCount: 4,
    rewards: [
      { type:'resources', label:'Große Rohstoff-Fracht', metall:25000000, kristall:20000000, deuterium:17000000 },
      { type:'dm', label:'Dunkle Materie', amount:25 },
      { type:'teile', label:'Große Ausrüstungs-Kiste', waffen:50, schild:50, panzerung:50 },
      { type:'zeitgutschein_bau', label:'Zeit-Gutschein Bau (75%)', percent:0.75 },
      { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (75%)', percent:0.75 },
      { type:'freischiff', label:'Geschenkte Großflotte', ships:{ leicht:50, schwer:50, kreuzer:35, schlachtschiff:35, bomber:35, schlachtkreuzer:18, zerstoerer:18, reaper:18 } }
    ]
  },
  // Neue Top-Stufe UEBER Gold - exklusiv fuer Elite-Bollwerk-Abschluss (Multiplayer, Punkt 39) und
  // Piratenkapitaen-Kills im Elite-Bollwerk selbst (sectors.ts, captainContainerTier:"elite").
  // Bewusst NICHT ueber normale Piraten-Sektoren/Raids erreichbar - siehe README.
  elite: {
    name: "Elite-Container",
    tier: "elite",
    icon: "💎",
    color: "#c99bff",
    pickCount: 5,
    rewards: [
      { type:'resources', label:'Elite-Rohstoff-Frachtladung', metall:45000000, kristall:38000000, deuterium:32000000 },
      { type:'dm', label:'Große Dunkle-Materie-Reserve', amount:50 },
      { type:'teile', label:'Elite-Ausrüstungs-Kiste', waffen:90, schild:90, panzerung:90 },
      { type:'zeitgutschein_bau', label:'Zeit-Gutschein Bau (100%)', percent:1.0 },
      { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (100%)', percent:1.0 },
      { type:'freischiff', label:'Geschenkte Elite-Flotte', ships:{ leicht:80, schwer:80, kreuzer:60, schlachtschiff:60, bomber:60, schlachtkreuzer:30, zerstoerer:30, reaper:30, salvenkreuzer:2 } }
    ]
  }
};

// ===== Jackpot-Mechanik =====
// Bei JEDER Container-Oeffnung (unabhaengig von der Stufe) besteht zusaetzlich zu den normalen
// gewuerfelten Belohnungen eine kleine Chance auf EINE zusaetzliche Jackpot-Belohnung, skaliert
// nach Container-Stufe. Bewusst ZUSAETZLICH statt als Ersatz fuer eine der normalen Belohnungen -
// ein Jackpot soll sich immer wie ein reiner Bonus anfuehlen, nie wie ein verpasster Normal-Pick.
export const JACKPOT_CHANCE = 0.05; // 5% Chance pro Container-Oeffnung
export const JACKPOT_REWARDS: Record<string, ContainerRewardDef> = {
  silber: { type:'resources', label:'🎰 Jackpot! Rohstoff-Ladung', metall:30000000, kristall:22000000, deuterium:11000000 },
  gold:   { type:'dm', label:'🎰 Jackpot! Dunkle-Materie-Fund', amount:120 },
  elite:  { type:'freischiff', label:'🎰 Jackpot! Flaggschiff-Geschenk', ships:{ schlachtkreuzer:20, zerstoerer:15, reaper:15, salvenkreuzer:5 } }
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
    stats:{waffen:6500, schild:1800, panzerung:48000} },
  // Boss-Gefecht (Sektor P10, siehe README Punkt 76): dieser Eintrag dient NUR der Namens-
  // Aufloesung in Kampfberichten (shipName()) - die tatsaechlichen Kampfwerte werden bei jedem
  // Boss-Gefecht dynamisch anhand der eingesetzten Flottenstaerke berechnet (siehe
  // generateAdmiralEncounter() in combat.ts) und per statsOverride an den Worker durchgereicht,
  // NICHT aus diesem statischen `stats`-Feld gelesen. Werte hier sind reiner Platzhalter.
  { id:"piratenadmiral", name:"Piratenadmiral",
    stats:{waffen:0, schild:0, panzerung:0} },
];

// Raid prueft zu vier festen Tageszeiten (Server-Ortszeit), nicht mehr in zufaelligen
// Intervallen. Sinn: Spieler wissen genau, wann ein Check stattfindet.
export const RAID_CHECK_HOURS_LOCAL = [0, 6, 12, 18];

// WICHTIG (Performance-Notmassnahme, siehe Nutzerentscheidung nach Server-Absturz): auf dem
// Starter-Tarif (0,5 CPU / 512MB) hat der Server zusammengebrochen, als zwei Kampfaufloesungen
// (Raids bei beiden Spielern) exakt zur selben Zeit (0:00 Uhr) liefen. Fix: JEDER der beiden
// echten Spieler bekommt jetzt einen FEST ZUGEWIESENEN, GARANTIERTEN Raid-Rhythmus (kein Wuerfeln
// mehr, siehe RAID_SPAWN_CHANCE unten - wird fuer diese beiden Namen auf 100% gesetzt) zu
// UNTERSCHIEDLICHEN Uhrzeiten, damit nie wieder zwei Kampfaufloesungen gleichzeitig laufen.
// Faellt ein Nutzername NICHT in dieser Liste (z.B. ein zukuenftiger dritter Spieler), gilt der
// normale RAID_CHECK_HOURS_LOCAL-Rhythmus MIT Wuerfeln als Fallback (siehe raids.ts).
export const RAID_SCHEDULE_BY_USERNAME: Record<string, number[]> = {
  ShadowEagle: [0, 6, 12, 18],
  SchnelleRatte: [3, 9, 15, 21],
};

const BERLIN_TZ = 'Europe/Berlin';

// Ermittelt den aktuellen UTC-Offset (in ganzen Stunden) fuer Berliner Ortszeit zu einem
// gegebenen Zeitpunkt - Deutschland hat immer +1 (Winterzeit/CET) oder +2 (Sommerzeit/CEST),
// nie halbe Stunden. Wird bei jeder Checkpoint-Berechnung frisch ermittelt, deckt daher den
// Wechsel zwischen Sommer-/Winterzeit automatisch ab (mit vernachlaessigbarer Ungenauigkeit
// exakt in der Wechselnacht selbst, 2x im Jahr - fuer ein Spiel mit wenigen Spielern hinnehmbar,
// statt dafuer eine vollstaendige Zeitzonen-Bibliothek einzubinden).
function berlinOffsetHours(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: BERLIN_TZ, timeZoneName: 'shortOffset' }).formatToParts(new Date(utcMs));
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+1';
  const match = tzPart.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// RAID_WARNING_MS wurde durch RAID_PREP_MS (galaxyConstants.ts) ersetzt - Raids haben jetzt eine
// echte, distanzabhaengige Flugzeit von einer zufaelligen Piratenbasis statt einer festen
// Vorwarnzeit, siehe raids.ts.
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
// Wird fuer Raids verwendet, damit sie an
// denselben, fuer alle Spieler vorhersehbaren Zeitpunkten geprueft werden.
export function nextFixedCheckpoint(now: number, localHours: number[] = RAID_CHECK_HOURS_LOCAL): number {
  const offset = berlinOffsetHours(now);
  // Deutsche Ortszeit-Stunden in die entsprechenden UTC-Stunden umrechnen (Date arbeitet intern
  // mit UTC-Methoden, wie im Rest der Datei) - sortiert, damit die Schleife unten korrekt die
  // naechstgelegene findet.
  const utcHours = [...new Set(localHours.map((h) => (((h - offset) % 24) + 24) % 24))].sort((a, b) => a - b);
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  for (const hour of utcHours) {
    d.setUTCHours(hour);
    if (d.getTime() > now) return d.getTime();
  }
  // Kein Checkpoint mehr heute uebrig -> erster Checkpoint morgen
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(utcHours[0]);
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
export function rollFixedCheckpoints(
  lastCheck: number,
  now: number,
  spawnChance: number,
  onSuccess: (checkpointTime: number) => void,
  localHours: number[] = RAID_CHECK_HOURS_LOCAL
): number {
  let checkpoint = lastCheck;
  for (let i = 0; i < MAX_BACKFILL_CHECKPOINTS; i++) {
    // WICHTIG: erst pruefen, ob der AKTUELL gespeicherte Checkpoint faellig ist, dann erst
    // weiterruecken. Die vorherige Reihenfolge (erst nextFixedCheckpoint() aufrufen, DANACH
    // pruefen) hat den eigentlich faelligen, gespeicherten Checkpoint nie selbst gewuerfelt,
    // sondern ist sofort zum naechsten gesprungen und hat DAS als "noch nicht faellig" erkannt -
    // dadurch wurde bei jedem Tick eines aktiv spielenden Nutzers (Checkpoint gerade eben faellig
    // geworden) der faellige Checkpoint komplett uebersprungen, ohne je gewuerfelt zu werden.
    // Raids konnten dadurch praktisch nie spawnen, solange jemand aktiv online war -
    // nur bei mehrtaegiger Abwesenheit (mehrere uebersprungene Checkpoints) gab es zufaellig
    // noch einen Treffer, weil dann IMMER NOCH ein Checkpoint in der Vergangenheit lag.
    if (checkpoint > now) return checkpoint;
    if (Math.random() < spawnChance) {
      onSuccess(checkpoint);
      return nextFixedCheckpoint(checkpoint, localHours);
    }
    checkpoint = nextFixedCheckpoint(checkpoint, localHours);
  }
  // Sicherheitsnetz gegriffen (extrem lange Abwesenheit) - Rest ueberspringen statt zu haengen.
  return nextFixedCheckpoint(now, localHours);
}

// ===== Belohnungs-Eskalation pro ueberlebtem Stunden-Check (Piraten-Sektoren + Elite-Bollwerk) =====
// Wirkt auf Beute (lootBase) UND Teile-Sofortbonus. "additive" waechst prozentual pro Sieg-Serie
// mit einer Obergrenze (Niedrig/Mittel/Hoch), "double" verdoppelt sich pro Sieg ohne Obergrenze
// (Elite-Bollwerk - bei fest 4 Stunden-Checks ergibt das max. 8x, siehe README). Serie bricht bei
// jedem Check ohne vernichteten Gegner auf 0 zurueck (Mission.streakWins/GroupOperation.streakWins).
export type EscalationConfig = { mode: 'additive'; step: number; max: number } | { mode: 'double' };

export const REWARD_ESCALATION: Record<string, EscalationConfig> = {
  piraten_niedrig: { mode: 'additive', step: 0.10, max: 1.30 },
  piraten_mittel: { mode: 'additive', step: 0.20, max: 1.60 },
  piraten_hoch: { mode: 'additive', step: 0.35, max: 2.05 },
  piraten_elite: { mode: 'double' },
};

export function getEscalationMultiplier(sektorId: string, streak: number): number {
  const cfg = REWARD_ESCALATION[sektorId];
  if (!cfg) return 1;
  if (cfg.mode === 'double') return Math.pow(2, streak);
  return Math.min(cfg.max, 1 + streak * cfg.step);
}

// Kleiner DM-Bonus bei erfolgreicher Raid-Verteidigung ("Bergung aus der zerstoerten Flotte") -
// skaliert mit der Anzahl vernichteter Piratenschiffe/-anlagen, gedeckelt gegen Ausreisser bei
// riesigen Angreiferwellen.
export const RAID_SALVAGE_DM_PER_KILL = 0.3;
export const RAID_SALVAGE_DM_MAX = 20;
// Mindest-Angriffsstaerke fuer Raids, falls die reine Flotten-Power (homePower, OHNE
// Verteidigungsanlagen, siehe raids.ts) bei 0 liegt - z.B. bei einem reinen
// Verteidigungsanlagen-Aufbau ohne eigene Flotte zu Hause. Verhindert, dass der Angriff auf eine
// triviale/leere Gegnerwelle zusammenschrumpft, nur weil Verteidigung nicht mehr in die
// Feindstaerke einfliesst (siehe README "Wichtige Punkte" zur Entkopplung).
export const RAID_MIN_TARGET_POWER = 200000;
