export interface BoosterDefinition {
  id: string;
  name: string;
  desc: string;
  img: string;
  cost: number;
  durationHours: number;
}

// Balance-Ueberarbeitung (Nutzerentscheidung 28.07.2026): Booster wirkten im Vergleich zu
// Schiffs-/Verteidigungs-Modulen (Millionen an Ressourcen fuer +3%/Stufe, dauerhaft) auffallend
// guenstig fuer einen sofortigen, flottenweiten 24h-Effekt - bewusst staerker UND teurer gemacht,
// damit sie sich weiterhin lohnen, aber nicht die guenstigere Alternative zur echten Investition
// in Module sind. Effekt-Werte hier NUR fuer die Anzeige (`desc`) - die tatsaechliche Wirkung steckt
// in den Konstanten unten (BAUTEMPO_BOOST_FACTOR usw.), von actions.ts/missions.ts/combat.ts genutzt.
export const BAUTEMPO_BOOST_FACTOR = 0.35; // Bauzeit auf 35% (= -65%)
export const FORSCHUNGSTEMPO_BOOST_FACTOR = 0.35; // Forschungszeit auf 35% (= -65%)
export const KAMPF_BOOST_MULTIPLIER = 1.35; // Waffen/Schild/Panzerung +35%
// Abbau-Booster war bisher ein Blindgaenger (Nutzer-Fund 28.07.2026: der Effekt wurde nirgends im
// Code angewendet, nur beworben) - erstmals wirklich verdrahtet (miningBuildingMultiplier() in
// actions.ts, miningMultiplier() in missions.ts), daher direkt mit dem neuen, staerkeren Wert.
export const ABBAU_BOOST_MULTIPLIER = 1.7; // Mining-Rate +70%

export const BOOSTERS: BoosterDefinition[] =
[
  { id:"bautempo", name:"Bautempo-Boost", desc:"Schiffsbauzeit -65% für 24h", img:"booster/bautempo.png", cost:35, durationHours:24 },
  { id:"forschungstempo", name:"Forschungstempo-Boost", desc:"Forschungszeit -65% für 24h", img:"booster/forschungstempo.png", cost:35, durationHours:24 },
  { id:"kampf", name:"Kampf-Boost", desc:"Waffen/Schild/Panzerung +35% für 24h", img:"booster/kampf.png", cost:55, durationHours:24 },
  { id:"abbau", name:"Abbau-Boost", desc:"Mining-Rate +70% für 24h", img:"booster/abbau.png", cost:30, durationHours:24 }
];

// Kauf-Laufzeiten fuer Booster (Nutzerentscheidung 04.08.2026): statt nur der festen 24h-Laufzeit
// (BoosterDefinition.durationHours/-cost bleiben der 24h-Basispreis) kann jetzt direkt 7 oder 30
// Tage am Stueck gekauft werden - spart gegenueber taeglichem Nachkauf Klicks UND bekommt einen
// Mengenrabatt (rechnerisch waeren 7 bzw. 30 Einzelkaeufe 7x/30x so teuer). `costMultiplier` wird
// serverseitig in buyBooster() auf booster.cost angewendet - der Client zeigt nur den bereits
// vorgerechneten Preis, entscheidet aber NICHT selbst darueber (Manipulationsschutz). Wirkt genau
// wie ein 24h-Kauf, nur mit laengerer Laufzeit - state.activeBoosters speichert weiterhin nur EINEN
// Ablauf-Zeitstempel pro Booster-ID, unabhaengig von der gewaehlten Kauf-Laufzeit (siehe Stacking-
// Verhalten in buyBooster()).
export interface BoosterDurationOption {
  hours: number;
  label: string;
  costMultiplier: number;
}
export const BOOSTER_DURATION_OPTIONS: BoosterDurationOption[] = [
  { hours: 24, label: '24 Stunden', costMultiplier: 1 },
  { hours: 24 * 7, label: '7 Tage', costMultiplier: 6 },
  { hours: 24 * 30, label: '30 Tage', costMultiplier: 20 },
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
  // Tatsaechliche Wahrscheinlichkeit, dass diese Kategorie NACH der "genau 2 Treffer"-Normalisierung
  // (siehe Kommentar unten) am Ende wirklich ausgezahlt wird - wird NICHT von Hand gepflegt, sondern
  // unten per computeRealCategoryChances() aus `chance` alle Kategorien EINES Containers berechnet und
  // reingeschrieben. Grund: `chance` allein ist fuer die Anzeige irrefuehrend, da Kategorien mit hoher
  // Einzelchance (z.B. Ressourcen/Teile bei 80%) fast immer beide Slots belegen und seltenere
  // Kategorien (Zeitgutschein/Freischiff) dadurch real deutlich seltener vorkommen als ihr `chance`-Wert
  // suggeriert (Nutzer-Feedback: Zeitgutscheine "fühlen sich zu selten an" trotz eingetragener 15-20%).
  realChance?: number;
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
      // Rohwert bewusst deutlich hoeher als die gewuenschte reale Chance (siehe rollContainerCategories()
      // in inventory.ts): resources/teile liegen bei 80% und belegen bei der "genau 2 Treffer"-Normalisierung
      // fast immer beide Slots, wodurch Zeitgutschein/Freischiff trotz ihres eingetragenen Werts real seltener
      // vorkommen. 0.20 ergab nur ~15% reale Chance (Nutzer-Feedback: "zu selten") - 0.38 wurde per Simulation
      // (2 Mio. Durchlaeufe) auf ~28% reale Chance kalibriert.
      { category: 'zeitgutschein', chance: 0.38, rewards: [
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
      // Siehe Kommentar bei Silber-Container: 0.15 ergab nur ~10% reale Chance, 0.32 auf ~22% real kalibriert.
      { category: 'zeitgutschein', chance: 0.32, rewards: [
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
      // Siehe Kommentar bei Silber-Container: 0.10 ergab nur ~7% reale Chance, 0.23 auf ~16% real kalibriert.
      { category: 'zeitgutschein', chance: 0.23, rewards: [
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

// Berechnet EXAKT (Enumeration aller 2^n Treffer/Fehlschlag-Kombinationen, nicht simuliert) die
// tatsaechliche Wahrscheinlichkeit, dass jede Kategorie eines Containers am Ende der Normalisierung
// auf "genau 2 Treffer" (siehe rollContainerCategories() in inventory.ts) wirklich ausgezahlt wird.
// Muss exakt denselben Algorithmus abbilden wie dort: bei >2 Treffern zaehlt fuer jede getroffene
// Kategorie die Standard-Kombinatorik-Formel "P(Element in zufaelliger 2er-Teilmenge) = 2/Trefferanzahl",
// bei <2 Treffern werden die fehlenden Plaetze deterministisch nach `chance` absteigend aufgefuellt
// (Array.sort ist seit ES2019 stabil, bei Chance-Gleichstand gewinnt daher wie im Original die
// Reihenfolge im categories-Array).
function computeRealCategoryChances(categories: ContainerCategoryDef[]): number[] {
  const n = categories.length;
  const result = new Array(n).fill(0);
  for (let mask = 0; mask < (1 << n); mask++) {
    let prob = 1;
    const hitIdx: number[] = [];
    const missIdx: number[] = [];
    for (let i = 0; i < n; i++) {
      const isHit = ((mask >> i) & 1) === 1;
      prob *= isHit ? categories[i].chance : 1 - categories[i].chance;
      (isHit ? hitIdx : missIdx).push(i);
    }
    if (prob === 0) continue;
    if (hitIdx.length > 2) {
      hitIdx.forEach((idx) => (result[idx] += prob * (2 / hitIdx.length)));
    } else {
      const need = 2 - hitIdx.length;
      const sortedMiss = [...missIdx].sort((a, b) => categories[b].chance - categories[a].chance);
      [...hitIdx, ...sortedMiss.slice(0, need)].forEach((idx) => (result[idx] += prob));
    }
  }
  return result;
}
Object.values(CONTAINER_TYPES).forEach((config) => {
  const real = computeRealCategoryChances(config.categories);
  config.categories.forEach((cat, i) => (cat.realChance = real[i]));
});

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

// Raid-Rhythmus (Nutzerentscheidung 28.07.2026, Umbau von 2x/Tag auf 1x/Woche): ein Raid ist jetzt
// eine ganztaegige Belagerung (24h, viele Wellen, siehe RAID_WAVE_COUNT/RAID_ASSAULT_DURATION_MS
// unten) statt eines kurzen ~2h-Ereignisses - dafuer nur noch 1x/Woche statt 2x/Tag. Passt besser
// zum tatsaechlichen Spielrhythmus (teils mehrwoechige Abwesenheit) als starre taegliche
// Zeitfenster, die man leicht verpasst.
export interface RaidScheduleSpec { weekday: number; hour: number } // weekday: 0=Sonntag..6=Samstag, Server-Ortszeit (Berlin)

// Nutzerentscheidung: Sonntag ist DER gemeinsame Raid-Tag - beide echten Spieler (und der
// Fallback fuer unbekannte/zukuenftige Nutzernamen) starten ihr woechentliches Raid-Event Sonntag
// 0:00 Uhr deutscher Ortszeit. Die urspruengliche Stagger-Notwendigkeit (Server-Absturz bei
// zeitgleichen Kampfaufloesungen auf dem Starter-Tarif, siehe Git-Historie) ist durch die
// Stack-Aggregat-Engine + Autonomie-Entfernung mittlerweile entschaerft (Kampfberechnungen dauern
// jetzt Sekundenbruchteile statt Minuten, siehe README Punkt 103) - gemeinsamer Wochentag ist daher
// unproblematisch. Die beiden echten Spieler bekommen Chance 1.0 (garantiert, kein Wuerfeln), der
// Fallback fuer unbekannte Namen wuerfelt weiterhin gegen RAID_SPAWN_CHANCE.
export const RAID_SCHEDULE_BY_USERNAME: Record<string, RaidScheduleSpec> = {
  ShadowEagle: { weekday: 0, hour: 0 },
  SchnelleRatte: { weekday: 0, hour: 0 },
};
export const RAID_FALLBACK_SCHEDULE: RaidScheduleSpec = { weekday: 0, hour: 0 };

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
export const RAID_SPAWN_CHANCE = 0.7; // 70% Chance beim woechentlichen Fallback-Checkpoint
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
// Umbau 28.07.2026 (Nutzerentscheidung, Teil des Wochen-/Tages-Umbaus wie schon bei Raids):
// Piraten-Sektor (Solo) UND Elite-Bollwerk teilen sich diese Konstante - von 4h auf 24h angehoben.
// Kampf-Checks laufen NICHT mehr stuendlich, sondern alle PIRATEN_CHECK_INTERVAL_MS (4h) - macht bei
// 24h Gesamtdauer 6 Checks statt vorher 4 stuendliche. Piratenadmiral ist NICHT betroffen (eigener
// 10-Minuten-Check-Rhythmus in groupOps.ts, siehe README).
export const MISSION_DURATION_MS = 24 * 3600 * 1000;
// Kampf-Check-Intervall fuer Piraten-Sektor/Elite-Bollwerk (Nutzerentscheidung 28.07.2026, ersetzt
// den bisherigen stuendlichen Rhythmus) - genutzt in missions.ts tickMission()/groupOps.ts
// tickGroupExpeditionInner() statt der hartcodierten 3600000 (1h). NUR fuer type:"piraten"-Sektoren,
// Asteroiden-Felder bleiben stuendlich (siehe ASTEROID_MISSION_DURATION_MS unten).
export const PIRATEN_CHECK_INTERVAL_MS = 4 * 3600 * 1000;
// Anzahl Checks pro Elite-Bollwerk-Expedition (MISSION_DURATION_MS / PIRATEN_CHECK_INTERVAL_MS =
// 24h/4h = 6) - als eigene Konstante statt ueberall neu berechnet, u.a. fuer die "perfekte Serie"-
// Pruefung und Anzeige-Texte in groupOps.ts (ersetzt die vorherige hartcodierte 4).
export const PIRATEN_CHECK_COUNT = MISSION_DURATION_MS / PIRATEN_CHECK_INTERVAL_MS;
// Asteroiden-Felder laufen bewusst laenger als Piraten-Sektoren: weniger haeufiges Nachschauen
// noetig (guenstig fuer Spieler mit wenig Zeit), dafuer entsprechend mehr Ertrag pro Durchgang.
// Umbau 28.07.2026: von 12h auf 24h angehoben (Nutzerentscheidung) - dmCap/farmRate bleiben
// BEWUSST unveraendert (kein Verdoppeln), die dmCap-Rate berechnet sich ohnehin dynamisch aus der
// tatsaechlichen Missionsdauer (siehe accrueFarming() in missions.ts) und wird dadurch automatisch
// langsamer statt hoeher - Nutzerentscheidung: ein hoeherer Cap wuerde die Ressourcen-/Dunkle-
// Materie-Menge im Spiel zu stark aufblaehen und andere Balance-Bereiche (z.B. Massen-Schiffbau)
// verzerren.
export const ASTEROID_MISSION_DURATION_MS = 24 * 3600 * 1000;

// Diagnose-Fix (Juli 2026, Live-Vorfall siehe README Punkt 97): wenn ein Nutzer/Bot laengere Zeit
// nicht getickt wurde (z.B. Server-Neustart), musste tickMission() beim naechsten Aufruf ALLE seit
// da an faelligen Stunden-Checks (jede loest bei Piraten-Sektor/Eskorte einen echten Kampf im
// Worker-Pool aus) in einem einzigen, durchgehenden Rutsch nachholen - bei einem grossen Rueckstand
// (z.B. 150+ Stunden) blockierte das den kleinen 2-Worker-Kampf-Pool so lange am Stueck, dass echte
// Spieler-Anfragen waehrenddessen haengen blieben. Live bestaetigt UND eskalierend beobachtet:
// erst 87s fuer einen einzigen tick(), kurz danach (waehrend der Rueckstand weiter anwuchs, weil er
// schneller entstand als er abgearbeitet wurde) bis zu 934s (>15 Minuten) fuer eine einzelne
// GET /game/state-Anfrage. Deckelt die NACHGEHOLTEN Stunden-Checks pro einzelnem
// tickMission()-Aufruf auf einen bewusst NIEDRIGEN Wert (Reaktionsfaehigkeit priorisiert vor
// Abarbeitungs-Geschwindigkeit) - ein groesserer Rueckstand verteilt sich dadurch ueber mehrere
// Heartbeat-/Request-Durchlaeufe statt alles auf einmal zu erzwingen. Ressourcen-Produktion
// (accrueBuildingProduction) ist davon NICHT betroffen (reine Arithmetik, kein Kampf, bleibt sofort
// vollstaendig aktuell). Falls nach diesem Fix IMMER NOCH lange Anfragen auftreten: siehe README
// Punkt 97 "Eskalationsplan" fuer die naechsten Schritte (Wert hier weiter senken, Event-Loop-
// Yield zwischen JEDEM einzelnen Stunden-Check statt nur pro Aufruf, etc.).
export const MISSION_HOURLY_CATCHUP_CAP = 8;

export const SCRAP_REFUND_RATE = 0.3;
export const TRADE_VALUE: Record<string, number> = { metall: 1, kristall: 1.5, deuterium: 3 };
export const TRADE_FEE = 0.2;

export const COMBAT_SHIP_IDS = [
  'leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber',
  'schlachtkreuzer', 'zerstoerer', 'reaper', 'sandronator',
  'salvenjaeger', 'salvenkreuzer', 'salvendreadnought',
];

// Liefert den naechsten woechentlichen Checkpoint (fester Wochentag+Uhrzeit, Server-Ortszeit) NACH
// "now". Ersetzt die vorherige rein stunden-basierte nextFixedCheckpoint()/RAID_CHECK_HOURS_LOCAL
// (Umbau auf 1x/Woche, siehe RAID_SCHEDULE_BY_USERNAME oben). Arbeitet in einem "pseudo-Berlin"-
// Datumsrahmen (now um den aktuellen Offset verschoben, sodass UTC-Getter/Setter direkt die
// Berliner Ortszeit-Felder liefern) - dieselbe Toleranz gegenueber dem Sommer-/Winterzeit-Wechsel
// wie beim Rest der Datei (berlinOffsetHours() wird frisch pro Aufruf ermittelt).
export function nextWeeklyCheckpoint(now: number, spec: RaidScheduleSpec): number {
  const offset = berlinOffsetHours(now);
  const pseudoNow = new Date(now + offset * 3600 * 1000);
  const d = new Date(pseudoNow);
  d.setUTCHours(spec.hour, 0, 0, 0);
  const dayDiff = (spec.weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + dayDiff);
  if (d.getTime() <= pseudoNow.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return d.getTime() - offset * 3600 * 1000;
}

// Sicherheitsnetz gegen (praktisch unmoegliche) Endlosschleifen bei extrem alten/verwaisten
// Spielstaenden - bei 1 Checkpoint/Woche deckt das >1 Jahr Rueckstand ab, weit mehr als je gebraucht.
const MAX_BACKFILL_WEEKLY_CHECKPOINTS = 60;

/**
 * Rollt JEDEN verpassten woechentlichen Checkpoint zwischen "lastCheck" (exklusiv) und "now"
 * (inklusiv) einzeln nach - analog zur vorherigen rollFixedCheckpoints()-Logik, nur auf
 * nextWeeklyCheckpoint() umgestellt. Wichtig fuer Spieler, die laenger offline waren: sie sollen
 * dieselbe statistische Chance je verstrichenem Checkpoint bekommen wie ein durchgehend aktiver
 * Spieler, nicht nur einen einzigen verspaeteten Wurf im Moment ihrer Rueckkehr. Stoppt beim
 * ERSTEN erfolgreichen Wurf (nur ein Raid kann gleichzeitig aktiv sein) und ruft dann `onSuccess`
 * mit dem TATSAECHLICHEN Checkpoint-Zeitpunkt auf (nicht "now").
 * Gibt den naechsten zu speichernden Checkpoint zurueck (das naechste Mal, ab dem wieder geprueft
 * werden soll).
 */
export function rollWeeklyCheckpoints(
  lastCheck: number,
  now: number,
  spawnChance: number,
  onSuccess: (checkpointTime: number) => void,
  spec: RaidScheduleSpec
): number {
  let checkpoint = lastCheck;
  for (let i = 0; i < MAX_BACKFILL_WEEKLY_CHECKPOINTS; i++) {
    // WICHTIG: erst pruefen, ob der AKTUELL gespeicherte Checkpoint faellig ist, dann erst
    // weiterruecken (siehe historische Erklaerung bei der vorherigen rollFixedCheckpoints()-Version
    // in der Git-Historie - dieselbe Reihenfolge-Falle gilt hier genauso).
    if (checkpoint > now) return checkpoint;
    if (Math.random() < spawnChance) {
      onSuccess(checkpoint);
      return nextWeeklyCheckpoint(checkpoint, spec);
    }
    checkpoint = nextWeeklyCheckpoint(checkpoint, spec);
  }
  // Sicherheitsnetz gegriffen (extrem lange Abwesenheit) - Rest ueberspringen statt zu haengen.
  return nextWeeklyCheckpoint(now, spec);
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

// Raid-Wellensystem (Nutzerentscheidung): ein Raid ist nicht mehr EIN Kampf bei Ankunft, sondern
// RAID_WAVE_COUNT einzelne Angriffswellen innerhalb eines RAID_ASSAULT_DURATION_MS-Fensters NACH
// der Ankunft (Vorbereitungszeit/Flugzeit davor bleiben unveraendert, siehe RAID_PREP_MS in
// galaxyConstants.ts). Die Gesamt-Feindstaerke bleibt gleich wie bei einem einzelnen Raid vorher
// (auf die Wellen verteilt, siehe raids.ts).
// Umbau 28.07.2026 (Nutzerentscheidung, Teil des Wochen-Umbaus oben): von 5 Wellen/1h auf 12
// Wellen/24h - passend zur neuen woechentlichen Belagerung (ca. alle 2,2h eine Welle statt alle 15
// Min., siehe planRaidWaveTimes() in raids.ts, das automatisch RAID_WAVE_COUNT gleichmaessig ueber
// RAID_ASSAULT_DURATION_MS verteilt, keine Aenderung an der Verteil-Logik selbst noetig).
// Belohnung wird weiterhin als EINE Abschluss-Belohnung am Ende vergeben (nicht pro Welle
// ausgezahlt), skaliert aber jetzt linear mit JEDER gewonnenen Welle statt eines Fixbetrags nur bei
// perfekter Verteidigung (RAID_WAVE_WIN_* unten, siehe finalizeRaidWaves() in raids.ts).
export const RAID_WAVE_COUNT = 12;
export const RAID_ASSAULT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Stunden
// Zufalls-Anteil bei der Wellen-Zeitplanung (siehe planRaidWaveTimes() in raids.ts) - haelt die
// Abstaende "ungefaehr" gleich statt exakt im Metronom-Takt, ohne dass sich Wellen ueberholen oder
// das Gesamtfenster gesprengt wird (letzte Welle wird dort hart auf das Fensterende gekappt).
export const RAID_WAVE_JITTER_FACTOR = 0.25;
// Feindstaerke pro Welle, MULTIPLIZIERT mit der aktuellen VERTEIDIGUNGSANLAGEN+FLOTTE-Staerke
// (siehe RAID_FLEET_POWER_WEIGHT/RAID_DEFENSE_POWER_WEIGHT in raids.ts) - bewusste Abkehr von der
// sonstigen Entkopplungs-Regel (README Punkt 22/45): hier soll eine staerkere Verteidigung den
// Angriff gezielt mitwachsen lassen.
// 04.08.2026 (Nutzerentscheidung, Neugestaltung "Raid-Events (Massive Bedrohung & 50/30/20
// Prinzip)"): die vorherige FESTE, ueber 12 Wellen deterministisch eskalierende Kurve
// (130% -> 300%) wurde ersetzt durch dasselbe 50/30/20-Zufallsprinzip wie bei den Piraten-Sektoren
// (siehe PIRATEN_MULTIPLIER_ROLL in sectors.ts, pick503020() in combat.ts) - JEDE der
// RAID_WAVE_COUNT Wellen wuerfelt jetzt unabhaengig einen der drei Werte: 50% Chance (Schwerer
// Ansturm, 120%), 30% Chance (Schwere Angriffswelle, 170%), 20% Chance (Verheerender Durchbruch,
// 230%-250%, Spanne gleichverteilt gewuerfelt) - macht Raids unberechenbar statt vorhersehbar
// eskalierend, wie im Plan gefordert.
export const RAID_WAVE_ROLL: [number, number, [number, number]] = [1.20, 1.70, [2.30, 2.50]];

// Container-Menge PRO GEWONNENER WELLE (Nutzerentscheidung 28.07.2026, ersetzt die vorherige
// FIXE Abschluss-Belohnung von 5 Silber+2 Gold+RAID_PERFECT_ELITE_CHANCE nur bei perfekter
// 5/5-Verteidigung): finalizeRaidWaves() in raids.ts zaehlt am Ende raid.wavesWon zusammen und
// multipliziert mit diesen Werten - GENAU EINE Abschluss-Belohnung, keine Auszahlung pro Welle.
// Bei allen 12 Wellen gewonnen ergibt das 120 Silber + 72 Gold + 24 Elite-Container pro Woche -
// bewusst ein grosser Sprung ggue. der vorherigen Wochensumme (max. 70 Silber + 28 Gold bei
// 2x/Tag), im Gegenzug dafuer nur noch 1x/Woche pruefbar UND durch RAID_WAVE_FACTORS oben deutlich
// schwerer durchgaengig zu gewinnen als vorher.
export const RAID_WAVE_WIN_SILBER = 10;
export const RAID_WAVE_WIN_GOLD = 6;
export const RAID_WAVE_WIN_ELITE = 2;

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

// ===== KI-Wachstums-Ausgleich (Nutzerentscheidung Juli 2026, angehoben) =====
// Bots/Piratenbasen wirtschaften nie so effizient wie ein Mensch mit vollem Ueberblick (verpasste
// Bau-Slots, suboptimale Prioritaeten) - moderater Bonus auf die passive Minen-Produktion GLEICHT
// DAS AUS, ersetzt aber nicht die Verhaltens-Fixes selbst (Modul-KI, seltenere Offensiv-Angriffe,
// siehe economyBotTurn.ts/pirateBaseState.ts). Gilt NUR fuer NPC-Zustaende (siehe isNpcState() in
// actions.ts), niemals fuer echte Spieler.
// Von 1.5x auf 6x angehoben (Nutzerentscheidung Juli 2026): Asteroiden-Mining (Mining-Schiffe
// bauen/losschicken) wurde fuer Bots/Piratenbasen komplett entfernt (siehe economyBotTurn.ts,
// war fehleranfaellig und unpassend kalibriert). Echte Spieler sammeln zusaetzlich zur passiven
// Minen-Produktion ueber Zeit erhebliche Mengen ueber Container/Missionen/Raids an (allein ein
// Gold-Container gibt ~29M/23M/19M Metall/Kristall/Deuterium, Elite ~52M/44M/37M, siehe
// CONTAINER_TYPES oben) - Bots/Piratenbasen haben KEINEN Zugang zu dieser Beute-Mechanik, der
// Multiplikator muss den kompletten Ausgleich daher allein ueber die Minen-Produktion leisten,
// nicht nur den Wegfall des Mining-Schiff-Ertrags. 2.5x war dafuer zu niedrig angesetzt.
export const NPC_PRODUCTION_BONUS_MULTIPLIER = 6;
