// RapidFire-Werte: RAPIDFIRE[angreiferId][zielId] = RF-Wert. Folgeschuss-Chance = (RF-1)/RF.
export const RAPIDFIRE: Record<string, Record<string, number>> = 
{
  leicht: {},
  schwer: {
    leicht: 3
  },
  begleitschiff: {
    leicht: 6,
    schwer: 4
  },
  kreuzer: {
    schwer: 4
  },
  schlachtschiff: {
    kreuzer: 5
  },
  schlachtkreuzer: {
    leicht: 3,
    schwer: 4,
    kreuzer: 4,
    schlachtschiff: 7
  },
  zerstoerer: {
    schlachtkreuzer: 2,
    bomber: 5
  },
  reaper: {
    zerstoerer: 3,
    schlachtkreuzer: 4,
    bomber: 4
  },
  // Boss-Gefecht (Punkt 76): "RapidFire-Waechter" gegen Jaeger-Klasse - bestraft Masse an
  // kleinen Schiffen ganz natuerlich ueber die bestehende RapidFire-Mechanik, keine Sonderregel.
  piratenadmiral: {
    leicht: 10,
    schwer: 8
  },
  bomber: {
    raketenwerfer: 20,
    leichteslaser: 20,
    schwereslaser: 10,
    ionengeschuetz: 10,
    gausskanone: 5,
    plasmawerfer: 5
  },
  imperator: {
    leicht: 5, schwer: 5, kreuzer: 5, schlachtschiff: 5, bomber: 5, schlachtkreuzer: 7, zerstoerer: 7, reaper: 4,
    raketenwerfer: 5, leichteslaser: 5, schwereslaser: 5, ionengeschuetz: 5, gausskanone: 5, plasmawerfer: 5
  },
  raketenwerfer: {
    leicht: 4
  },
  leichteslaser: {
    leicht: 5,
    schwer: 3
  },
  schwereslaser: {
    schwer: 4,
    kreuzer: 3
  },
  gausskanone: {
    kreuzer: 4,
    schlachtschiff: 3
  },
  ionengeschuetz: {
    schlachtkreuzer: 3
  },
  plasmawerfer: {
    zerstoerer: 4,
    reaper: 3,
    imperator: 2
  },
  // Spezialschiffe mit Mehrfachziel-Salve (siehe MULTI_TARGET_VOLLEY_SHIPS): jedes deckt gezielt
  // eine ganze Schiffsklasse ab - bei erfolgreicher Zielerfassung wird JEDER hier gelistete Typ
  // einmal getroffen (nicht nur eine zufaellige Einheit davon).
  salvenjaeger: {
    leicht: 6,
    schwer: 5
  },
  salvenkreuzer: {
    kreuzer: 6,
    schlachtschiff: 5,
    bomber: 5
  },
  salvendreadnought: {
    schlachtkreuzer: 5,
    zerstoerer: 5,
    reaper: 4
  }
};

// Basis-Genauigkeit (Zielerfassung) pro Schiffstyp: Chance, gezielt ein RF-faehiges Ziel anzuvisieren.
// Wird durch die Forschung "zielerfassung" erhoeht (+6%/Stufe beim Spieler, NPCs bleiben auf Basiswert).
export const ZIELERFASSUNG_BASE: Record<string, number> = 
{
  schwer: 0.25,
  begleitschiff: 0.35,
  kreuzer: 0.30,
  schlachtschiff: 0.30,
  schlachtkreuzer: 0.40,
  zerstoerer: 0.35,
  reaper: 0.45,
  bomber: 0.50,
  imperator: 0.55,
  raketenwerfer: 0.30,
  leichteslaser: 0.30,
  schwereslaser: 0.35,
  gausskanone: 0.35,
  ionengeschuetz: 0.35,
  plasmawerfer: 0.35,
  salvenjaeger: 0.35,
  salvenkreuzer: 0.35,
  salvendreadnought: 0.35
};

// ===== Groessenabhaengige Kampf-Modifikatoren =====
// Grundgedanke: Kleine, wendige Schiffe kaempfen nah am Feind und treffen dadurch zuverlaessiger,
// haben aber zu wenig Energie fuer starke Schildaufladung. Grosse Schiffe feuern aus Distanz
// (ungenauer), haben dafuer massive Energiereserven fuer Schild-Regeneration. Verteidigungsanlagen
// haengen an der Basis-Energieversorgung und laden daher IMMER stark auf, unabhaengig von ihrer
// Groesse.

// Aufschlag auf die Basis-Praezision (PRECISION_BASE). Positiv = trifft besser.
export const PRECISION_MODIFIER: Record<string, number> = {
  leicht: 0.15,
  schwer: 0.12,
  salvenjaeger: 0.12,
  sandronator: 0.10,
  begleitschiff: 0.10,
  kreuzer: 0.05,
  salvenkreuzer: 0.0,
  schlachtschiff: -0.05,
  bomber: -0.08,
  schlachtkreuzer: -0.08,
  salvendreadnought: -0.10,
  zerstoerer: -0.10,
  reaper: -0.12,
  imperator: -0.15,
  // Verteidigungsanlagen: je groesser das Geschuetz, desto traeger zielt es
  raketenwerfer: 0.10,
  leichteslaser: 0.10,
  schwereslaser: 0.02,
  ionengeschuetz: 0.0,
  gausskanone: -0.05,
  plasmawerfer: -0.08,
};

// Aufschlag auf die Basis-Schild-Regeneration (SHIELD_REGEN_BASE). Positiv = laedt schneller auf.
export const SHIELD_REGEN_MODIFIER: Record<string, number> = {
  leicht: -0.12,
  schwer: -0.08,
  salvenjaeger: -0.08,
  sandronator: -0.05,
  begleitschiff: -0.05,
  kreuzer: -0.02,
  salvenkreuzer: 0.04,
  schlachtschiff: 0.10,
  bomber: 0.12,
  schlachtkreuzer: 0.14,
  salvendreadnought: 0.16,
  zerstoerer: 0.18,
  reaper: 0.20,
  imperator: 0.25,
  // Alle Verteidigungsanlagen haengen an der Basis-Energie -> einheitlich starke Aufladung
  raketenwerfer: 0.25,
  leichteslaser: 0.25,
  schwereslaser: 0.25,
  ionengeschuetz: 0.25,
  gausskanone: 0.25,
  plasmawerfer: 0.25,
};

// Basis-Ausweichchance: Wahrscheinlichkeit, einem Treffer komplett zu entgehen. Spiegelbild zur
// Praezision - kleine, wendige Schiffe sind schwerer zu treffen. Unbewegliche Verteidigungsanlagen
// koennen grundsaetzlich nicht ausweichen (0).
export const EVASION_BASE: Record<string, number> = {
  leicht: 0.12,
  schwer: 0.09,
  salvenjaeger: 0.09,
  sandronator: 0.10,
  begleitschiff: 0.08,
  kreuzer: 0.05,
  salvenkreuzer: 0.03,
  schlachtschiff: 0.02,
  bomber: 0.01,
  schlachtkreuzer: 0.01,
  salvendreadnought: 0.0,
  zerstoerer: 0.0,
  reaper: 0.0,
  imperator: 0.0,
};
export const EVASION_MAX = 0.30; // harte Obergrenze, damit Jaegerschwaerme nicht unbesiegbar werden

// Basis-Chance auf einen kritischen Treffer (doppelter Schaden). Grosse Schiffe treffen seltener,
// richten dafuer aber oefter verheerenden Schaden an, wenn sie treffen.
export const CRIT_CHANCE_BASE: Record<string, number> = {
  leicht: 0.03,
  schwer: 0.04,
  salvenjaeger: 0.04,
  sandronator: 0.05,
  begleitschiff: 0.03,
  kreuzer: 0.06,
  salvenkreuzer: 0.08,
  schlachtschiff: 0.10,
  bomber: 0.12,
  schlachtkreuzer: 0.12,
  salvendreadnought: 0.15,
  zerstoerer: 0.15,
  reaper: 0.18,
  imperator: 0.20,
  raketenwerfer: 0.05,
  leichteslaser: 0.05,
  schwereslaser: 0.08,
  ionengeschuetz: 0.10,
  gausskanone: 0.12,
  plasmawerfer: 0.15,
};
export const CRIT_CHANCE_MAX = 0.35;
export const CRIT_DAMAGE_MULTIPLIER = 2;

export const MAX_RESEARCH_LEVEL = 10;
// Forschungsbaum: einheitliche Voraussetzungs-Schwelle fuer JEDE Eltern->Kind-Verbindung (siehe
// ResearchDefinition.parentId in types.ts) - bewusst ein einziger globaler Wert statt individuell
// pro Zweig, wie besprochen.
export const PARENT_UNLOCK_LEVEL = 3;
export const SHIELD_REGEN_BASE = 0.20;
export const SHIELD_REGEN_MAX = 0.80;
export const PRECISION_BASE = 0.40;
export const PRECISION_MAX_PLAYER = 0.60;
export const DEFENSE_REPAIR_PERCENT = 0.70;
export const MAX_ROUNDS = 100;
export const MAX_BUILD_SLOTS = 3;
export const MAX_DEFENSE_SLOTS = 3;
export const MAX_RESEARCH_SLOTS = 4;
// Gebaeude teilen sich bewusst nur EINEN globalen Slot (siehe README) - kein Lane-System wie bei
// Schiffen/Verteidigung/Forschung.
export const MAX_BUILDING_SLOTS = 1;
// Reines Sicherheitsnetz gegen unbegrenztes Wachstum (kein Performance-Limit mehr, da die
// Kampfberechnung jetzt in einem separaten Worker-Thread laeuft, siehe combatRunner.ts).
// Grosszuegig bemessen, damit auch gemeinsame Multiplayer-Flotten (mehrere Spieler kombiniert
// im selben Piraten-Sektor) genug Platz haben.
export const MAX_PLAYER_SHIPS = 100000;

// PERFORMANCE-NOTMASSNAHME (siehe README): Piraten-Flotten wurden bislang OHNE
// Obergrenze mit Jaeger-Klasse (leicht/schwer) aufgefuellt, sobald deren Gewichtung in der
// Wellen-Kurve hoch war ("schwarm"-Profil bevorzugt guenstige, kleine Schiffe) - bei einem sehr
// starken Ziel-Gegner konnte das zu zehntausenden generierten Jaeger-Einheiten fuehren (real
// beobachtet: 6828 Leichter Jaeger + 1703 Schwerer Jaeger in einem einzigen Raid), was die
// Kampf-Engine trotz der Optimierungen in Punkt 69/72 an ihre Grenzen brachte. NICHT identisch
// mit dem Spieler-Baulimit (`ShipDefinition.maxCount`, siehe Punkt 8 - bewusst weiterhin
// unbegrenzt fuer SPIELER-Flotten) - gilt NUR fuer NPC-generierte Piraten-/
// Verteidigungs-Wellen (siehe generateCappedFleet() in combat.ts). Sobald eine Jaeger-Klasse
// diese Grenze erreicht, weicht die Flottengenerierung automatisch auf andere Schiffstypen aus,
// um die restliche Ziel-Staerke zu erreichen (weniger, aber groessere Gegner statt endloser
// Jaeger-Massen).
// PERFORMANCE-NOTMASSNAHME - nach dem Server-Umzug (Hetzner, deutlich mehr CPU/RAM) NICHT MEHR
// AKTIV (siehe README): der Umzug hat die urspruengliche Server-Ueberlastung geloest, die
// Jaeger-Deckelung wird daher wieder aufgehoben. Konstanten UND Logik bleiben aber vollstaendig
// im Code erhalten (nur per Schalter deaktiviert) - falls die Serverlast doch wieder zum Problem
// wird, reicht ein einziges "true" hier, um die Massnahme sofort wieder zu aktivieren, ohne die
// gesamte Logik neu bauen zu muessen.
export const NPC_JAEGER_CAP_ENABLED = false;
export const NPC_JAEGER_MAX_COUNT = 500;
export const NPC_JAEGER_CAPPED_IDS = ['leicht', 'schwer'];

// Spezialschiffe mit "Mehrfachziel-Salve": statt bei erfolgreicher Zielerfassung nur EIN
// RF-anfaelliges Ziel zu treffen, feuern sie auf JEDEN anfaelligen SCHIFFSTYP einmal (nicht auf
// jede einzelne Einheit - siehe fireShots() in combat.ts fuer die genaue Umsetzung).
export const MULTI_TARGET_VOLLEY_SHIPS = new Set(['salvenjaeger', 'salvenkreuzer', 'salvendreadnought']);

// Korrekturfaktor fuer die Feindstaerke-Berechnung (combatFleetPower()/combatFleetPowerBase() in
// combat.ts): Salvenschiffe haben bewusst extrem hohe Waffenwerte bei sehr geringem Schild/
// Panzerung ("Glaskanone", siehe Punkt 22) - die Power-Formel (Waffen+Schild+Panzerung) gewichtet
// aber alle drei Werte gleich. Bei normalen Schiffen macht Waffen nur ~1-2% der Power-Zahl aus, bei
// Salvenschiffen aber ~9-11% - das unterschaetzt ihre tatsaechliche Kampfkraft massiv (rechnerisch
// noetiger Korrekturfaktor liegt bei 6,3-7,6x je nach Typ, um ihren Waffenwert fair zu gewichten).
// Ohne Korrektur wurde eine reine Salvenschiff-Flotte immer gegen einen viel zu schwachen Gegner
// antreten (bestaetigt ueber den Kampfsimulator: 100 Salvenkreuzer liefern 4,5x mehr Feuerkraft als
// 100 Schlachtkreuzer, wurden aber mit nur 40% von deren Power-Zahl bewertet). 8x gewaehlt (leicht
// aufgerundet gegenueber dem errechneten 6,3-7,6x-Bereich), um zusaetzlich den Mehrfachziel-Effekt
// selbst mit abzudecken, der in der reinen Waffen-Vergleichsrechnung noch nicht enthalten ist.
export const MULTI_TARGET_POWER_CORRECTION = 8;

// ===== Wellen-Vielfalt (gegen "man weiss schon, was einen erwartet") =====
// Vorher nutzten ALLE Feindflotten-Generatoren (Piraten-Sektor, Raid, Elite-Bollwerk)
// dieselbe feste, abfallende Gewichtungskurve - nur die reine Staerke variierte, nie die FORM der
// Gegnerflotte. Jetzt wird bei jedem Kampf eines von drei Profilen gewuerfelt.
export type WaveProfile = 'schwarm' | 'kampfgruppe' | 'elitekader';

// Gewichtung der Profile je Kontext-Schluessel (Sektor-ID fuer Piraten-Sektoren/Elite-Bollwerk,
// 'raid' fuer den Mehrspieler-relevanten Sonderfall ohne eigenen Sektor).
export const WAVE_PROFILE_WEIGHTS: Record<string, Partial<Record<WaveProfile, number>>> = {
  piraten_niedrig: { schwarm: 0.8, kampfgruppe: 0.2 },
  piraten_mittel: { schwarm: 0.45, kampfgruppe: 0.45, elitekader: 0.1 },
  piraten_hoch: { schwarm: 0.1, kampfgruppe: 0.45, elitekader: 0.45 },
  piraten_elite: { schwarm: 0.1, kampfgruppe: 0.4, elitekader: 0.5 },
  raid: { schwarm: 0.5, kampfgruppe: 0.4, elitekader: 0.1 },
};

// Basis-Wellentabelle fuer Kontexte OHNE eigene Sektor-Tabelle. Fuer Raids seit der
// Verteidigungsanlagen-Staerke-Kopplung NICHT MEHR verwendet (siehe RAID_WAVE_FACTORS in
// economy.ts, ersetzt diese Zufalls-Varianz durch eine feste Eskalation 70%-110%) - Konstante
// bleibt stehen, falls andere Kontexte sie spaeter nutzen wollen.
export const RAID_MULTIPLIER_ROLL = [0.90, 1.00, 1.10];

// Chance pro Kampf auf einen Wellen-AUSREISSER (deutlich schwaecher/staerker als die normale
// Tabelle), je Kontext-Schluessel. Beim Elite-Bollwerk gilt zusaetzlich eine Kappung auf maximal
// 1x pro GESAMTER Expedition (nicht pro Einzel-Check) - sonst wuerde sich das Risiko ueber die 4
// Stunden-Checks unfair aufsummieren, siehe `eliteSurpriseUsed` in groupOps.ts.
export const WAVE_OUTLIER_CHANCE: Record<string, number> = {
  piraten_niedrig: 0.05,
  piraten_mittel: 0.08,
  piraten_hoch: 0.15,
  piraten_elite: 0.10,
  raid: 0.06,
};
export const WAVE_OUTLIER_LOW_FACTOR = 0.6;
export const WAVE_OUTLIER_HIGH_FACTOR = 1.5;

// ===== Kampf-Modifikatoren (seltene Ueberraschungen zusaetzlich zur reinen Staerke/Form) =====
// Immer nur EINER pro Kampf, nie mehrere gleichzeitig. Wirkt gezielt auf EINE Seite (siehe
// Anwendung in combat.ts) - Nebel/Ionensturm/Truemmerfeld/Sensorstoerung schwaechen den SPIELER,
// Strahlungssturm verstaerkt den GEGNER. Wird im Kampfbericht als Klartext angezeigt, damit es
// sich wie eine erklaerte Ueberraschung anfuehlt, nicht wie unsichtbare Willkuer.
export type BattleModifierType = 'nebel' | 'ionensturm' | 'truemmerfeld' | 'sensorstoerung' | 'strahlungssturm';

export const BATTLE_MODIFIER_LABELS: Record<BattleModifierType, string> = {
  nebel: '🌫️ Nebel im Sektor – deine Präzision -15% in diesem Kampf',
  ionensturm: '⚡ Ionensturm – deine Schild-Regeneration -20% in diesem Kampf',
  truemmerfeld: '☄️ Trümmerfeld – dein Ausweichen -15% in diesem Kampf',
  sensorstoerung: '📡 Sensorstörung – deine RapidFire-Trefferquote -20% in diesem Kampf',
  strahlungssturm: '☢️ Strahlungssturm – gegnerische Kritische-Treffer-Chance +50% in diesem Kampf',
};

// Chance pro Kampf auf EINEN der obigen Modifikatoren, je Kontext-Schluessel. Beim Elite-Bollwerk
// gilt dieselbe Kappung auf 1x pro gesamter Expedition wie bei WAVE_OUTLIER_CHANCE.
export const BATTLE_MODIFIER_CHANCE: Record<string, number> = {
  piraten_niedrig: 0.05,
  piraten_mittel: 0.10,
  piraten_hoch: 0.18,
  piraten_elite: 0.15,
  raid: 0.06,
};

// ========== BOSS-GEFECHT: PIRATENADMIRAL (Sektor P10, siehe README Punkt 76) ==========
// Zweiter Multiplayer-Sektor neben dem Elite-Bollwerk - bewusst eine ANDERE Art Herausforderung:
// ein einzelner starker Boss + kleine Eskorte statt Massen-Feindwellen, mit einer wiederkehrenden
// Rueckzugs-("Extraction")-Entscheidung statt eines simplen Durchhalte-Checks.

export const ADMIRAL_BOSS_ID = 'piratenadmiral'; // siehe NPC_SPECIALS in economy.ts fuer die Basiswerte
export const ADMIRAL_CHECK_INTERVAL_MS = 10 * 60 * 1000; // alle 10 Minuten ein Check
export const ADMIRAL_TOTAL_CHECKS = 6; // 6 Checks x 10 Minuten = 1 Stunde Gesamtdauer
export const ADMIRAL_ESCALATION_PER_CHECK = 0.15; // "Eskalierende Wut": +15% auf Boss+Eskorte-Werte pro Check, wenn nicht besiegt/abgezogen

// Nur Kreuzer-Klasse und aufwaerts erlaubt (macht "wenige grosse Schiffe" mechanisch zur Pflicht,
// nicht nur zur Empfehlung) - explizit OHNE Jaeger-Klasse (leicht/schwer/salvenjaeger, siehe
// MULTI_TARGET_VOLLEY_SHIPS) und ohne Versorgungsschiffe (mining/begleitschiff).
export const ADMIRAL_ALLOWED_SHIP_IDS = [
  'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper',
  'sandronator', 'salvenkreuzer', 'salvendreadnought', 'imperator',
];

// Feste Eskorte-Grundzusammensetzung (KEINE Macht-Skalierung anhand der Spieler-Flotte, bewusst
// anders als bei den normalen Piraten-Sektoren) - wird wie der Boss selbst pro Check eskaliert.
export const ADMIRAL_ESCORT_BASE: Record<string, number> = {
  schlachtkreuzer: 3,
  zerstoerer: 2,
};

// Belohnung: sicherer Sofort-Ertrag bei Abzug, MODERAT/ADDITIV mit der Check-Nummer wachsend
// (bewusst KEIN Verdopplungs-Modus wie beim Elite-Bollwerk, sonst zu aehnliches Gefuehl).
export const ADMIRAL_EXTRACTION_BASE = { metall: 20_000_000, kristall: 12_000_000, deuterium: 6_000_000 };
export const ADMIRAL_EXTRACTION_GROWTH_PER_CHECK = { metall: 6_000_000, kristall: 3_500_000, deuterium: 2_000_000 };

// Einmalige Sieg-Praemie (nur beim tatsaechlichen Sieg ueber den Admiral, "Trophaeen"-Charakter
// statt wiederholbarem Farmen) + exklusiver Dunkle-Materie-Bonus, den es sonst nirgends gibt.
export const ADMIRAL_VICTORY_BONUS = { metall: 300_000_000, kristall: 200_000_000, deuterium: 100_000_000 };
export const ADMIRAL_VICTORY_DM = 200;
// Basis-Machtskalierung (analog zu PIRATEN_MULTIPLIER_ROLL bei piraten_elite, siehe sectors.ts) -
// bewusst HAERTER als das Elite-Bollwerk (105-135%), da hier ja nur EINE zaehe Einheit + kleine
// Eskorte statt vieler Gegner die Feindstaerke traegt (siehe Ruecksprache mit dem Nutzer).
export const ADMIRAL_MULTIPLIER_ROLL = [1.10, 1.30, 1.50];
