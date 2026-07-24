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
  type: 'zeitgutschein_bau_schiffe' | 'zeitgutschein_bau_verteidigung' | 'zeitgutschein_bau_gebaeude' | 'zeitgutschein_forschung';
  percent: number;
  cost: number;
  desc: string;
}

// Bauzeit-Gutscheine sind nach Bereich getrennt (Schiffe/Verteidigung/Gebaeude), analog zum
// Forschungsbaum-Split bei den Bauzeit-Forschungszweigen (siehe README). Schiffe und Verteidigung
// wirken auf ALLE aktuell belegten Lanes ihrer jeweiligen Warteschlange (MAX_BUILD_SLOTS/
// MAX_DEFENSE_SLOTS = 3), Gebaeude auf den einen moeglichen Bauslot (MAX_BUILDING_SLOTS = 1) -
// siehe applyReward() in inventory.ts.
export const SHOP_VOUCHERS: VoucherDefinition[] = 
[
  { id:"gutschein_bau_schiffe_30", label:"Zeit-Gutschein Bau: Schiffe (30%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_schiffe", percent:0.30, cost:150,
    desc:"Reduziert die Restzeit aller aktuell laufenden Schiffs-Bauaufträge um 30%. Nur nutzbar, wenn gerade Schiffe gebaut werden." },
  { id:"gutschein_bau_schiffe_60", label:"Zeit-Gutschein Bau: Schiffe (60%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_schiffe", percent:0.60, cost:300,
    desc:"Reduziert die Restzeit aller aktuell laufenden Schiffs-Bauaufträge um 60%. Nur nutzbar, wenn gerade Schiffe gebaut werden." },
  { id:"gutschein_bau_verteidigung_30", label:"Zeit-Gutschein Bau: Verteidigung (30%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_verteidigung", percent:0.30, cost:150,
    desc:"Reduziert die Restzeit aller aktuell laufenden Verteidigungs-Bauaufträge um 30%. Nur nutzbar, wenn gerade Verteidigungsanlagen gebaut werden." },
  { id:"gutschein_bau_verteidigung_60", label:"Zeit-Gutschein Bau: Verteidigung (60%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_verteidigung", percent:0.60, cost:300,
    desc:"Reduziert die Restzeit aller aktuell laufenden Verteidigungs-Bauaufträge um 60%. Nur nutzbar, wenn gerade Verteidigungsanlagen gebaut werden." },
  { id:"gutschein_bau_gebaeude_30", label:"Zeit-Gutschein Bau: Gebäude (30%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_gebaeude", percent:0.30, cost:150,
    desc:"Reduziert die Restzeit des aktuell laufenden Gebäude-Bauauftrags um 30%. Nur nutzbar, wenn gerade ein Gebäude ausgebaut wird." },
  { id:"gutschein_bau_gebaeude_60", label:"Zeit-Gutschein Bau: Gebäude (60%)", img:"booster/gutschein_bau.png", type:"zeitgutschein_bau_gebaeude", percent:0.60, cost:300,
    desc:"Reduziert die Restzeit des aktuell laufenden Gebäude-Bauauftrags um 60%. Nur nutzbar, wenn gerade ein Gebäude ausgebaut wird." },
  { id:"gutschein_forschung_30", label:"Zeit-Gutschein Forschung (30%)", img:"booster/gutschein_forschung.png", type:"zeitgutschein_forschung", percent:0.30, cost:200,
    desc:"Reduziert die Restzeit aller aktuell laufenden Forschungen um 30%. Nur nutzbar, wenn gerade geforscht wird." },
  { id:"gutschein_forschung_60", label:"Zeit-Gutschein Forschung (60%)", img:"booster/gutschein_forschung.png", type:"zeitgutschein_forschung", percent:0.60, cost:400,
    desc:"Reduziert die Restzeit aller aktuell laufenden Forschungen um 60%. Nur nutzbar, wenn gerade geforscht wird." }
];

export interface ContainerRewardDef {
  type: 'resources' | 'dm' | 'teile' | 'zeitgutschein_bau_schiffe' | 'zeitgutschein_bau_verteidigung' | 'zeitgutschein_bau_gebaeude' | 'zeitgutschein_forschung' | 'freischiff';
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

// Container-Kategorie mit eigener, unabhaengiger Dropchance (Nutzerentscheidung, ersetzt das
// vorherige "wahllos N von X" Pick-System). Enthaelt eine oder mehrere Varianten (z.B. die vier
// Zeitgutschein-Typen) - trifft die Kategorie, wird GENAU EINE Variante daraus zufaellig
// vergeben, siehe rollContainerRewards() in inventory.ts.
export interface ContainerCategoryDef {
  category: 'resources' | 'dm' | 'teile' | 'zeitgutschein' | 'freischiff';
  chance: number; // 0-1, unabhaengiger Wurf PRO Kategorie beim Oeffnen
  rewards: ContainerRewardDef[];
}

export interface ContainerTypeDef {
  name: string;
  tier: string;
  icon: string;
  color: string;
  categories: ContainerCategoryDef[];
}

// Zieh-Mechanik (Nutzerentscheidung, siehe rollContainerRewards() in inventory.ts): jede Kategorie
// wird EINZELN und UNABHAENGIG gegen ihre eigene `chance` gewuerfelt. Danach wird auf GENAU 2
// Treffer normalisiert - mehr als 2 Treffer werden zufaellig auf 2 reduziert, weniger als 2
// werden mit den Kategorien mit der naechsthoechsten chance aufgefuellt (deterministisch nach
// chance sortiert, nicht nochmal gewuerfelt). Bewusst ANDERS als das strikte Punktesystem der
// Piraten-Sektor-Belohnungs-Eskalation - hier soll sich jede Container-Oeffnung wie ein kleines
// eigenes Wuerfelergebnis anfuehlen, nicht wie eine reine Ziehung aus einer festen Urne.
export const CONTAINER_TYPES: Record<string, ContainerTypeDef> =
{
  silber: {
    name: "Silber-Container",
    tier: "silber",
    icon: "📦",
    color: "#b0b0b0",
    categories: [
      { category: 'resources', chance: 0.80, rewards: [{ type:'resources', label:'Rohstoff-Fracht', metall:12000000, kristall:7000000, deuterium:3500000 }] },
      { category: 'teile', chance: 0.80, rewards: [{ type:'teile', label:'Ausrüstungs-Kiste', waffen:20, schild:20, panzerung:20 }] },
      { category: 'zeitgutschein', chance: 0.20, rewards: [
        { type:'zeitgutschein_bau_schiffe', label:'Zeit-Gutschein Bau: Schiffe (40%)', percent:0.40 },
        { type:'zeitgutschein_bau_verteidigung', label:'Zeit-Gutschein Bau: Verteidigung (40%)', percent:0.40 },
        { type:'zeitgutschein_bau_gebaeude', label:'Zeit-Gutschein Bau: Gebäude (40%)', percent:0.40 },
        { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (40%)', percent:0.40 },
      ] },
      { category: 'freischiff', chance: 0.20, rewards: [
        { type:'freischiff', label:'Geschenkte Flotte', ships:{ leicht:25, schwer:25, kreuzer:15, schlachtschiff:15, bomber:15, schlachtkreuzer:8, zerstoerer:8, reaper:8 } },
      ] },
    ],
  },
  gold: {
    name: "Gold-Container",
    tier: "gold",
    icon: "🏆",
    color: "#ffd700",
    categories: [
      { category: 'resources', chance: 0.80, rewards: [{ type:'resources', label:'Große Rohstoff-Fracht', metall:29000000, kristall:23000000, deuterium:19000000 }] },
      { category: 'dm', chance: 0.60, rewards: [{ type:'dm', label:'Dunkle Materie', amount:25 }] },
      { category: 'teile', chance: 0.60, rewards: [{ type:'teile', label:'Große Ausrüstungs-Kiste', waffen:50, schild:50, panzerung:50 }] },
      { category: 'zeitgutschein', chance: 0.15, rewards: [
        { type:'zeitgutschein_bau_schiffe', label:'Zeit-Gutschein Bau: Schiffe (75%)', percent:0.75 },
        { type:'zeitgutschein_bau_verteidigung', label:'Zeit-Gutschein Bau: Verteidigung (75%)', percent:0.75 },
        { type:'zeitgutschein_bau_gebaeude', label:'Zeit-Gutschein Bau: Gebäude (75%)', percent:0.75 },
        { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (75%)', percent:0.75 },
      ] },
      { category: 'freischiff', chance: 0.15, rewards: [
        { type:'freischiff', label:'Geschenkte Großflotte', ships:{ leicht:50, schwer:50, kreuzer:35, schlachtschiff:35, bomber:35, schlachtkreuzer:18, zerstoerer:18, reaper:18 } },
      ] },
    ],
  },
  // Neue Top-Stufe UEBER Gold - exklusiv fuer Elite-Bollwerk-Abschluss (Multiplayer, Punkt 39),
  // Piratenkapitaen-Kills im Elite-Bollwerk selbst (sectors.ts, captainContainerTier:"elite") und
  // die kleine Zusatz-Chance bei perfekt abgewehrten Raids (siehe raids.ts). Bewusst NICHT ueber
  // normale Piraten-Sektoren/normale Raid-Wellen erreichbar - Elite bleibt ueberall reine
  // Glueckssache (Nutzerentscheidung).
  elite: {
    name: "Elite-Container",
    tier: "elite",
    icon: "💎",
    color: "#c99bff",
    categories: [
      { category: 'resources', chance: 0.80, rewards: [{ type:'resources', label:'Elite-Rohstoff-Frachtladung', metall:52000000, kristall:44000000, deuterium:37000000 }] },
      { category: 'dm', chance: 0.60, rewards: [{ type:'dm', label:'Große Dunkle-Materie-Reserve', amount:50 }] },
      { category: 'teile', chance: 0.60, rewards: [{ type:'teile', label:'Elite-Ausrüstungs-Kiste', waffen:90, schild:90, panzerung:90 }] },
      { category: 'zeitgutschein', chance: 0.10, rewards: [
        { type:'zeitgutschein_bau_schiffe', label:'Zeit-Gutschein Bau: Schiffe (100%)', percent:1.0 },
        { type:'zeitgutschein_bau_verteidigung', label:'Zeit-Gutschein Bau: Verteidigung (100%)', percent:1.0 },
        { type:'zeitgutschein_bau_gebaeude', label:'Zeit-Gutschein Bau: Gebäude (100%)', percent:1.0 },
        { type:'zeitgutschein_forschung', label:'Zeit-Gutschein Forschung (100%)', percent:1.0 },
      ] },
      // Salvenkreuzer entfernt (Nutzerentscheidung) - Geschenkte Elite-Flotte besteht jetzt nur
      // noch aus regulaeren Kampfschiffen.
      { category: 'freischiff', chance: 0.10, rewards: [
        { type:'freischiff', label:'Geschenkte Elite-Flotte', ships:{ leicht:80, schwer:80, kreuzer:60, schlachtschiff:60, bomber:60, schlachtkreuzer:30, zerstoerer:30, reaper:30 } },
      ] },
    ],
  },
};

// ===== Jackpot-Mechanik =====
// Bei JEDER Container-Oeffnung (unabhaengig von der Stufe) besteht zusaetzlich zu den normalen
// gewuerfelten Belohnungen eine kleine Chance auf EINE zusaetzliche Jackpot-Belohnung, skaliert
// nach Container-Stufe. Bewusst ZUSAETZLICH statt als Ersatz fuer eine der normalen Belohnungen -
// ein Jackpot soll sich immer wie ein reiner Bonus anfuehlen, nie wie ein verpasster Normal-Pick.
export const JACKPOT_CHANCE = 0.05; // 5% Chance pro Container-Oeffnung
export const JACKPOT_REWARDS: Record<string, ContainerRewardDef> = {
  silber: { type:'resources', label:'🎰 Jackpot! Rohstoff-Ladung', metall:36000000, kristall:26000000, deuterium:13000000 },
  gold:   { type:'dm', label:'🎰 Jackpot! Dunkle-Materie-Fund', amount:120 },
  elite:  { type:'freischiff', label:'🎰 Jackpot! Flaggschiff-Geschenk', ships:{ schlachtkreuzer:20, zerstoerer:15, reaper:15 } }
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
// Nutzerentscheidung: Raids kommen nur noch alle 12h statt alle 6h (haelt die Container-/Belohnungs-
// Flut in Grenzen) - ShadowEagle und SchnelleRatte weiterhin gegeneinander versetzt, damit nie
// beide gleichzeitig getroffen werden.
export const RAID_SCHEDULE_BY_USERNAME: Record<string, number[]> = {
  ShadowEagle: [0, 12],
  SchnelleRatte: [6, 18],
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
// Balance-Anpassung (Juli 2026): von 60% auf 70% angehoben, analog zur Missions-Balance -
// Heimatverteidigung soll dem neuen Schwierigkeitsniveau der Piraten-Sektoren entsprechen.
export const RAID_SPAWN_CHANCE = 0.7; // 70% Chance bei jedem der vier Checks
export const RAID_LOOT_PERCENT = 0.25;

export const ASTEROID_ESCORT_POWER_MIN = 0.08;
export const ASTEROID_ESCORT_POWER_MAX = 0.16;
export const ASTEROID_ESCORT_KILL_REWARD = { metall: 900000, kristall: 720000, deuterium: 600000 };

// Nutzerentscheidung (Juli 2026): pro Stunden-Check im Asteroiden-Feld 8% Chance, den bis dahin
// akkumulierten Ertrag (mission.farmed) zu verdoppeln - bewusst als Glücksspiel-Mechanik: frueh in
// der Mission bringt ein Treffer wenig, spaet einen grossen Bonus. Trifft NICHT dmFound (bleibt an
// das bestehende dmCap-System gebunden).
export const ASTEROID_RICH_FIND_CHANCE = 0.08;

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

// Balance-Anpassung (Juli 2026): Obergrenzen fuer mittel/hoch angehoben, damit sich eine lange
// Sieg-Serie auf den schwereren Stufen deutlich staerker lohnt (direkte Beute, nicht ueber
// Container) - Stufen-Abstand zu niedrig wird dadurch klarer spuerbar.
export const REWARD_ESCALATION: Record<string, EscalationConfig> = {
  piraten_niedrig: { mode: 'additive', step: 0.10, max: 1.30 },
  piraten_mittel: { mode: 'additive', step: 0.20, max: 1.80 },
  piraten_hoch: { mode: 'additive', step: 0.35, max: 2.40 },
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

// ========== AUSSENPOSTEN (kontestierte Galaxie-Knoten, siehe game/outposts.ts) ==========
// Zielstaerke der piraten-eigenen Garnison je Stufe (frisch gewuerfelt bei jedem Angriff, siehe
// generateFallbackFleet() - kein dauerhaftes State-Tracking noetig solange piraten-eigen). Grob an
// die bestehenden Piraten-Sektor-npcFloor-Werte angelehnt (sectors.ts), aber niedriger angesetzt -
// Aussenposten sollen von 2 Spielern + 2 Bots ueber Zeit gemeinsam erobert werden koennen, nicht
// nur solo mit maximaler Flotte.
export const OUTPOST_TIER_TARGET_POWER: Record<'niedrig' | 'mittel' | 'hoch', number> = {
  niedrig: 250000,
  mittel: 700000,
  hoch: 1600000,
};
// Balance (Juli 2026): Garnisonsstaerke skaliert jetzt zusaetzlich mit der Macht der ANGREIFENDEN
// Flotte (analog PIRATEN_MULTIPLIER_ROLL in sectors.ts) - vorher war OUTPOST_TIER_TARGET_POWER ein
// fixer Wert, den eine gut entwickelte Flotte verlustfrei ueberrannt hat. OUTPOST_TIER_TARGET_POWER
// bleibt als Untergrenze fuer schwache Flotten erhalten, siehe resolveOutpostAttack() in
// outposts.ts: targetPower = max(sentPower * rolledMultiplier, OUTPOST_TIER_TARGET_POWER[tier]).
export const OUTPOST_MULTIPLIER_ROLL: Record<'niedrig' | 'mittel' | 'hoch', number[]> = {
  niedrig: [0.5, 0.65, 0.8],
  mittel: [0.85, 1.0, 1.15],
  hoch: [1.1, 1.3, 1.5],
};
// Strategischer Bonus (Nutzerentscheidung Juli 2026): +15% Flottengeschwindigkeit PRO
// SPIELER-EIGENEM Aussenposten, global fuer JEDEN Flug (nicht mehr an ein bestimmtes System
// gebunden) - additiv, siehe outpostSpeedMultiplier() in outposts.ts. Bei allen 6 Posten in
// Spielerhand also +90%.
export const OUTPOST_SPEED_BONUS_PER_OUTPOST = 0.15;
// Rueckeroberungs-Rhythmus (Nutzerentscheidung Juli 2026, ersetzt die vorherige Zufallschance PRO
// Heartbeat/alle 2 Minuten - fuehlte sich bei mehreren gehaltenen Posten wie Dauerbeschuss an).
// Nach jedem Versuch (egal ob Angriff ausgeloest wurde oder nicht - siehe runOutpostPirateAiTurn())
// wird der naechste Check-Zeitpunkt zufaellig in diesem Fenster neu gewuerfelt.
export const OUTPOST_PIRATE_ATTACK_COOLDOWN_MIN_MS = 60 * 60 * 1000;
export const OUTPOST_PIRATE_ATTACK_COOLDOWN_MAX_MS = 120 * 60 * 1000;
// Zufalls-Vorteil der Piraten-Angriffsflotte gegenueber der Tier-Zielstaerke (analog zum
// RAID_WAVE_FACTORS-Muster) - Rueckeroberung ist dadurch eine echte Bedrohung, aber keine Garantie.
export const OUTPOST_PIRATE_ADVANTAGE_ROLL = [1.0, 1.15, 1.3, 1.4];
// Konzentrations-Bonus (Nutzer-Feedback Juli 2026, siehe runOutpostPirateAiTurn() in outposts.ts,
// empirisch mit echten Kampfsimulationen kalibriert) - faengt ab, dass eine Garnison aus wenigen,
// ueberdurchschnittlich STARKEN Einzelschiffen (z.B. 1 Imperator) trotz korrekt power-skalierter
// Gegnerstaerke praktisch unbesiegbar war: die einfache Power-Summe (Waffen+Schild+Panzerung)
// unterschaetzt, wie sehr ein Superschiff Massenangriffe schwacher Schiffe wegsteckt. Bewusst an
// der DURCHSCHNITTSSTAERKE PRO SCHIFF festgemacht (nicht an der reinen Schiffsanzahl) - eine
// Garnison aus vielen GUENSTIGEN Schiffen (z.B. 100 Leichte Jaeger) bleibt dadurch unangetastet
// (ratio bleibt bei 1, kein Bonus), nur echte Elite-Stacks bekommen den Aufschlag. Multiplikator =
// 1 + FACTOR * log2(Durchschnittsmacht-pro-Schiff / Macht eines Leichten Jaegers). Bei 1 Imperator
// (Faktor ~32x staerker als ein Leichter Jaeger) macht FACTOR=1.4 daraus ein 8x-Multiplikator -
// spuerbare, aber nicht garantierte Bedrohung (in Tests ca. 40-60% Siegchance fuer die Piraten).
export const OUTPOST_PIRATE_CONCENTRATION_FACTOR = 1.4;

// Rein kosmetische Allianz-Namen (Nutzerentscheidung Juli 2026) - "Allianz" existiert NICHT als
// eigenes Datenmodell/eigene Logik, sondern ist nur die informelle Bezeichnung fuer "alle Nutzer
// aus `users`" (Menschen + Bots) gegenueber der Piraten-Seite. Rein zur Anzeige (siehe
// AllianceOverview-Panel in Galaxie.tsx) - KEIN Einfluss auf Mechanik/Berechtigungen.
export const ALLIANCE_NAME = 'Sternenbund';
export const PIRATE_ALLIANCE_NAME = 'Piratenkonföderation';

// Chance auf 1 zusaetzlichen Elite-Container PRO TEILNEHMER bei perfekter Raid-Verteidigung (5/5
// Wellen) - Nutzerentscheidung: Elite bleibt ueberall reine Glueckssache, auch hier nur eine
// Chance, kein garantierter Zusatz.
// Balance-Anpassung (Juli 2026, Teil 2 - Nutzerentscheidung): von 15% auf 20% angehoben, passend
// zur allgemeinen Container-Aufwertung bei perfekter Verteidigung nach der Raid-Wellen-
// Verschaerfung (RAID_WAVE_FACTORS) - eine perfekte 5/5-Verteidigung ist jetzt seltener und lohnt
// sich entsprechend staerker.
export const RAID_PERFECT_ELITE_CHANCE = 0.20;

// Raid-Wellensystem (Nutzerentscheidung): ein Raid ist nicht mehr EIN Kampf bei Ankunft, sondern
// RAID_WAVE_COUNT einzelne Angriffswellen innerhalb eines RAID_ASSAULT_DURATION_MS-Fensters NACH
// der Ankunft (Vorbereitungszeit/Flugzeit davor bleiben unveraendert, siehe RAID_PREP_MS in
// galaxyConstants.ts - die Stunde ist NUR fuer die Wellen-Phase, nicht fuer An-/Abflug). Die
// Gesamt-Feindstaerke bleibt gleich wie bei einem einzelnen Raid vorher (auf die Wellen verteilt,
// siehe raids.ts), Belohnung gibt es NICHT pro Welle einzeln, sondern als EINE Abschluss-Belohnung
// am Ende, die mit der Anzahl gewonnener Wellen skaliert (siehe finalizeRaidWaves() in raids.ts).
export const RAID_WAVE_COUNT = 5;
export const RAID_ASSAULT_DURATION_MS = 60 * 60 * 1000; // 1 Stunde
// Zufalls-Anteil bei der Wellen-Zeitplanung (siehe planRaidWaveTimes() in raids.ts) - haelt die
// Abstaende "ungefaehr" gleich statt exakt im Metronom-Takt, ohne dass sich Wellen ueberholen oder
// das Gesamtfenster gesprengt wird (letzte Welle wird dort hart auf das Fensterende gekappt).
export const RAID_WAVE_JITTER_FACTOR = 0.25;
// Feindstaerke pro Welle (Nutzerentscheidung, ersetzt die vorherige zufaellige Grund-Varianz
// RAID_MULTIPLIER_ROLL fuer Raids): steigt fest von 70% auf 110% ueber die RAID_WAVE_COUNT
// Wellen, MULTIPLIZIERT mit der aktuellen VERTEIDIGUNGSANLAGEN-Staerke (nicht mehr Flotte/
// Verstaerkung, siehe waveDefensePower() in raids.ts) - bewusste Abkehr von der sonstigen
// Entkopplungs-Regel (siehe README Punkt 22/45): hier soll eine staerkere Verteidigung den
// Angriff gezielt mitwachsen lassen. Laenge MUSS RAID_WAVE_COUNT entsprechen.
// Balance-Anpassung (Juli 2026): Kurve von 70-110% auf 80-130% anheben, passend zur allgemeinen
// Missions-/Raid-Balance-Anpassung.
// Balance-Anpassung (Juli 2026, Teil 2 - Nutzerentscheidung "moderat"): 80-130% war zu schwach -
// da die Verteidigung meist zusaetzliche Tech-/Schild-Boni gegenueber der reinen Rohstaerke hat,
// gewannen Verteidiger die Wellen fast immer OHNE jeden Verlust (0-1.3x der eigenen Power reicht
// nie zum Durchbrechen). Kurve auf 130-200% angehoben, damit ab Welle 1 spuerbare Verluste
// entstehen und eine perfekte 5/5-Verteidigung zur Ausnahme statt zum Normalfall wird.
export const RAID_WAVE_FACTORS = [1.3, 1.5, 1.7, 1.85, 2.0];

// ===== Galaxie-Ereignisse (Wrack/Handelskonvoi, siehe game/galaxyEvents.ts) =====
// Nutzerentscheidung (Juli 2026): taucht zufaellig an einer freien Galaxie-Position auf, gibt der
// reinen Galaxie-Uebersicht einen Grund zum regelmaessigen Reinschauen. Bewusst PVE/kooperativ
// (kein Wettrennen mit Verlust-Risiko) - wer zuerst ankommt, bekommt die Beute, ein zu spaetes
// Eintreffen kostet nur die Flugzeit, nie Schiffe.
export interface GalaxyEventTypeDef {
  label: string;
  icon: string;
  metall: [number, number];
  kristall: [number, number];
  deuterium: [number, number];
  dm: [number, number];
}

export const GALAXY_EVENT_TYPES: Record<string, GalaxyEventTypeDef> = {
  wrack: {
    label: 'Verlassenes Wrack',
    icon: '🛸',
    metall: [2000000, 5000000],
    kristall: [1500000, 3500000],
    deuterium: [800000, 2000000],
    dm: [0, 0],
  },
  konvoi: {
    label: 'Handelskonvoi',
    icon: '🚀',
    metall: [800000, 2000000],
    kristall: [800000, 2000000],
    deuterium: [500000, 1200000],
    dm: [15, 35],
  },
};

// Chance PRO Heartbeat-Tick (~alle 2 Min., siehe heartbeat.ts), nur gewuerfelt solange weniger als
// GALAXY_EVENT_MAX_ACTIVE Ereignisse aktiv sind - ergibt bei 720 Ticks/Tag im Schnitt ca. 3-4 neue
// Ereignisse pro Tag. Bewusst kein fixer Checkpoint-Rhythmus wie bei Raids (siehe economy.ts
// rollFixedCheckpoints) - ein verpasstes Ereignis waehrend einer Downtime ist unkritisch, die
// zusaetzliche Katch-up-Komplexitaet lohnt sich hier nicht.
export const GALAXY_EVENT_SPAWN_CHANCE = 0.005;
export const GALAXY_EVENT_MAX_ACTIVE = 2;
export const GALAXY_EVENT_LIFETIME_MS = 10 * 3600 * 1000;

export function rollGalaxyEventReward(type: string): { metall: number; kristall: number; deuterium: number; dm: number } {
  const def = GALAXY_EVENT_TYPES[type];
  if (!def) return { metall: 0, kristall: 0, deuterium: 0, dm: 0 };
  const roll = ([min, max]: [number, number]) => Math.round(min + Math.random() * (max - min));
  return { metall: roll(def.metall), kristall: roll(def.kristall), deuterium: roll(def.deuterium), dm: roll(def.dm) };
}

// ===== Heimatbasis verlegen (Galaxie, siehe game/galaxy.ts relocateGalaxyPosition) =====
// Nutzerentscheidung (Juli 2026): reine DM-Kosten (kein Ressourcen-Anteil) - haelt es einfach und
// konsistent zum bereits bestehenden Klassenwechsel-Muster (CLASS_CHANGE_COST_DM), keine
// zusaetzliche Wartezeit/Cooldown noetig, die DM-Kosten allein bremsen Spam ausreichend.
export const RELOCATE_BASE_COST_DM = 300;
