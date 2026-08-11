// RapidFire-Werte: RAPIDFIRE[angreiferId][zielId] = RF-Wert. Folgeschuss-Chance = (RF-1)/RF.
// RF-Neuordnung (Nutzerentscheidung, 04.08.2026): jedes Standard-Kampfschiff bekommt genau EINE
// klare Rolle in einer sauberen Stein-Schere-Papier-Kette (Schwerer Jaeger > Leichter Jaeger >
// Kreuzer > Schwerer Jaeger > Schlachtschiff > Kreuzer > Schlachtkreuzer > Schlachtschiff >
// Zerstoerer > Schlachtkreuzer > Reaper > Zerstoerer), statt mehrerer ueberlappender Ziele pro
// Schiffstyp. Begleitschiffe/Mining-Schiffe (sandronator) sind bewusst von militaerischem
// RapidFire ausgenommen (Versorgungsrolle). Bomber bleibt reiner Bunkerbrecher gegen stationaere
// Verteidigung (nur noch die drei "leichten" Anlagen, nicht mehr die schweren Geschuetze).
// Spezialschiffe (Salven-Klassen, Imperator) und Spezialverteidigung (Sentinel-/Ultimate-Kanone)
// behalten ihre bestehenden Mehrfachziel-Sonderrechte unveraendert (siehe MULTI_TARGET_VOLLEY_SHIPS).
export const RAPIDFIRE: Record<string, Record<string, number>> =
{
  leicht: {},
  schwer: {
    leicht: 3
  },
  kreuzer: {
    schwer: 4
  },
  schlachtschiff: {
    kreuzer: 5
  },
  schlachtkreuzer: {
    schlachtschiff: 5
  },
  zerstoerer: {
    schlachtkreuzer: 5
  },
  reaper: {
    zerstoerer: 4
  },
  // Boss-Gefecht (Punkt 76): "RapidFire-Waechter" gegen Jaeger-Klasse - bestraft Masse an
  // kleinen Schiffen ganz natuerlich ueber die bestehende RapidFire-Mechanik, keine Sonderregel.
  piratenadmiral: {
    leicht: 10,
    schwer: 8
  },
  // Bunkerbrecher-Rolle: nur noch die drei leichten/mittleren Verteidigungsanlagen, keine schweren
  // Geschuetze (Ionengeschuetz/Gausskanone/Plasmawerfer) mehr.
  bomber: {
    raketenwerfer: 20,
    leichteslaser: 20,
    schwereslaser: 10
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
  },
  // Spezialverteidigung mit Mehrfachziel-Salve (siehe MULTI_TARGET_VOLLEY_SHIPS) - Sentinel-Kanone
  // deckt die Jaeger-Klasse ab (wie Salvenjaeger), Ultimate-Kanone deckt Kreuzer- UND Elite-Klasse
  // zusammen ab (staerker als je ein einzelnes Salvenschiff, entsprechend teurer/seltener).
  sentinelkanone: {
    leicht: 6,
    schwer: 5
  },
  ultimatekanone: {
    kreuzer: 6,
    schlachtschiff: 5,
    bomber: 5,
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
  salvendreadnought: 0.35,
  sentinelkanone: 0.35,
  ultimatekanone: 0.35
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
  sentinelkanone: 0.05,
  ultimatekanone: -0.12,
};

// Klassenspezifische Schild-Regeneration-Basiswerte (Nutzerentscheidung, Neugestaltung 04.08.2026):
// abgeloest die vorherige globale Pauschale (SHIELD_REGEN_BASE) + additiven Klassen-Modifikator
// durch feste, klassenabhaengige Basiswerte, auf die NUR noch der Forschungsbonus (siehe
// getShieldRegenRate() in combat.ts, effectPerLevel in data/research.ts) addiert wird. Bei
// maximaler Forschung (Stufe 10, 1,5%/Stufe = +15%) ergeben sich damit klar gestaffelte
// Endwerte: Jaeger-Klasse 20%, Kreuzer-Klasse 30%, Elite-Klasse 50%, Spezialschiffe/Imperator/
// Verteidigungsanlagen 80% (= exakt SHIELD_REGEN_MAX, der globale Deckel greift also nur noch bei
// dieser obersten Stufe). Begleitschiff/Sandronator (reine Versorgungsschiffe) auf Jaeger-Niveau,
// Verteidigungsanlagen auf Spezial-Niveau (waren vorher ohnehin mit demselben Modifikator wie der
// Imperator gleichgestellt).
export const SHIELD_REGEN_BASE_BY_CLASS: Record<string, number> = {
  // Jaeger-Klasse
  leicht: 0.05,
  schwer: 0.05,
  begleitschiff: 0.05,
  sandronator: 0.05,
  // Kreuzer-Klasse
  kreuzer: 0.15,
  schlachtschiff: 0.15,
  bomber: 0.15,
  // Elite-Klasse
  schlachtkreuzer: 0.35,
  zerstoerer: 0.35,
  reaper: 0.35,
  // Spezialschiffe & Imperator
  salvenjaeger: 0.65,
  salvenkreuzer: 0.65,
  salvendreadnought: 0.65,
  imperator: 0.65,
  // Korrektur 05.08.2026 (Nutzer-Fund): Verteidigungsanlagen sassen bisher PAUSCHAL alle auf
  // Spezialschiff-Niveau (0.65), unabhaengig von Anlagen-Tier - dadurch regenerierte selbst der
  // billigste Raketenwerfer seinen Schild genauso schnell wie der teuerste Plasmawerfer. Sichtbare
  // Folge im Elite-Bollwerk: massenhaft gespawnte NPC-Billig-Verteidigung (Raketenwerfer/Leichtes
  // Lasergeschuetz) war trotz hohem ausgeteiltem Schaden NICHT kleinzukriegen (0 Verluste ueber
  // mehrere Checks), waehrend umgekehrt beim Raid-Event die eigene guenstige Verteidigung genauso
  // unverhaeltnismaessig gut hielt. Jetzt analog zu den Schiffs-Klassen gestaffelt (Reihenfolge nach
  // Bauzeit/Kosten in defenses.ts): Raketenwerfer/Leichtes Lasergeschuetz auf Jaeger-Niveau,
  // Schweres Lasergeschuetz/Sentinel-Kanone auf Kreuzer-Niveau, Ionengeschuetz/Gauss-Kanone auf
  // Elite-Niveau, Plasmawerfer/Ultimate-Kanone (teuerste, seltenste Anlagen) bleiben auf
  // Spezialschiff-Niveau. Schildkuppeln (siehe SHIELD_REGEN_DEFAULT_BASE) bewusst unveraendert.
  raketenwerfer: 0.05,
  leichteslaser: 0.05,
  schwereslaser: 0.15,
  sentinelkanone: 0.15,
  ionengeschuetz: 0.35,
  gausskanone: 0.35,
  plasmawerfer: 0.65,
  ultimatekanone: 0.65,
};
// Default fuer den gemeinsamen Kuppel-Schild-Pool (kein eigener typeId, siehe poolRegen in
// combat.ts) - Verteidigungs-Niveau, da Kuppeln selbst Verteidigungsanlagen sind.
export const SHIELD_REGEN_DEFAULT_BASE = 0.65;

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

// ===== Groessen-Fehlpaarung: Jaeger/Kreuzer weichen grossen/Elite-/Spezialschiffen gezielt aus =====
// Nutzerentscheidung (Balance-Feedback nach Elite-Bollwerk-Beobachtungen: Kampf 1 Jaeger tot,
// Kampf 2 Kreuzer tot, Kampf 3-4 nur noch die grossen Schiffe, die kaum noch Schaden nehmen) -
// Jaeger/Kreuzer hatten gegen Elite-/Spezialschiffe (Faktor 35-330 weniger Waffenschaden) keine
// erkennbare Rolle mehr. Neue Rollenaufteilung: Jaeger TANKEN grosse/Elite-/Spezialschiffe durch
// massives Ausweichen (ein Fehlschuss zaehlt als Tanken, ohne dass ein Ziel-Umleiten noetig waere),
// Kreuzer bleiben das eigentliche Ziel dieser Schiffsklassen, sind aber ebenfalls schwerer (nicht
// unmoeglich) zu treffen. Bewusst NUR als Bonus auf die Ausweichchance des VERTEIDIGERS gegen genau
// diese groessere Schuetzen-Klasse - Kaempfe zwischen aehnlich grossen Schiffen (Jaeger vs Jaeger,
// Kreuzer vs Jaeger/Kreuzer) bleiben unveraendert beim EVASION_BASE-Wert. RapidFire gegen Imperator/
// Salvenschiffe bleibt bewusst so gut wie nicht vorhanden (siehe RAPIDFIRE oben) - sie sollen trotz
// seltener Treffer beim Verteidiger nicht durch eine Kampfentscheidung "weggewuerfelt" werden
// koennen, ihre Staerke soll sich ueber die maxCount-Obergrenze regulieren, nicht ueber RF-Pech.
export type ShipSizeClass = 'klein' | 'mittel' | 'gross';
export const SHIP_SIZE_CLASS: Partial<Record<string, ShipSizeClass>> = {
  leicht: 'klein',
  schwer: 'klein',
  kreuzer: 'mittel',
  schlachtschiff: 'gross',
  bomber: 'gross',
  schlachtkreuzer: 'gross',
  zerstoerer: 'gross',
  reaper: 'gross',
  imperator: 'gross',
  salvenjaeger: 'gross',
  salvenkreuzer: 'gross',
  salvendreadnought: 'gross',
};
// [Verteidiger-Groessenklasse][Schuetzen-Groessenklasse] -> zusaetzliche Ausweichchance, addiert auf
// EVASION_BASE (vor dem Deckel - siehe EVASION_MAX_SIZE_MISMATCH). Keine Eintraege = kein Bonus,
// bleibt beim normalen EVASION_MAX-Deckel.
export const SIZE_MISMATCH_EVASION_BONUS: Partial<Record<ShipSizeClass, Partial<Record<ShipSizeClass, number>>>> = {
  klein: { gross: 0.45 },
  mittel: { gross: 0.18 },
};
// Nur fuer Treffer mit aktivem Groessen-Fehlpaarung-Bonus - deutlich hoeher als der normale
// EVASION_MAX, sonst wuerde der Deckel den ganzen Sinn des Bonus (Jaeger/Kreuzer sollen gegen
// GROSSE Schiffe wirklich selten getroffen werden) direkt wieder auffressen.
export const EVASION_MAX_SIZE_MISMATCH = 0.75;

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
  sentinelkanone: 0.06,
  ultimatekanone: 0.18,
};
export const CRIT_CHANCE_MAX = 0.35;
// Kritischer Schaden ist jetzt klassenabhaengig gestaffelt (Nutzerentscheidung, Neugestaltung
// 04.08.2026) statt eines starren globalen Multiplikators (vorher immer 2x fuer alle Typen). Die
// Krit-CHANCE (siehe CRIT_CHANCE_BASE oben) bleibt davon unberuehrt. Innerhalb einer Klasse mit
// mehreren Schiffstypen ("1,5x bis 2x" etc.) steigt der Wert mit der Schiffsgroesse innerhalb der
// Klasse. Verteidigungsanlagen wurden nicht explizit im Plan genannt und analog zu ihrer
// CRIT_CHANCE_BASE-Staerke eingeordnet (schwach -> Jaeger-Niveau, mittel -> Kreuzer-Niveau,
// stark -> Elite-Niveau, Ultimate-Kanone -> Spezial-Niveau).
export const CRIT_DAMAGE_MULTIPLIER_BY_CLASS: Record<string, number> = {
  // Jaeger-Klasse: 1,5x bis 2x
  leicht: 1.5,
  schwer: 2.0,
  begleitschiff: 1.5,
  sandronator: 1.5,
  raketenwerfer: 1.5,
  leichteslaser: 1.5,
  // Kreuzer-Klasse: 2x bis 2,5x
  kreuzer: 2.0,
  schlachtschiff: 2.25,
  bomber: 2.5,
  schwereslaser: 2.0,
  ionengeschuetz: 2.25,
  sentinelkanone: 2.0,
  // Elite-Klasse: 3x
  schlachtkreuzer: 3.0,
  zerstoerer: 3.0,
  reaper: 3.0,
  gausskanone: 3.0,
  plasmawerfer: 3.0,
  piratenadmiral: 3.0,
  // Spezialschiffe & Imperator: 3,5x bis max. 4x
  salvenjaeger: 3.5,
  salvenkreuzer: 3.75,
  salvendreadnought: 4.0,
  imperator: 4.0,
  ultimatekanone: 3.5,
};
// Fallback fuer nicht gelistete Typen (unveraendert am alten globalen Wert).
export const CRIT_DAMAGE_DEFAULT_MULTIPLIER = 2;

// Piraten/NPCs bekamen urspruenglich GAR KEINE Forschung (Praezision/Ausweichen/Kritische Treffer/
// Zielerfassung/Schild-Regeneration/Durchschlag sowie die Waffen-/Schild-/Panzerung-Multiplikatoren
// liefen fuer sie immer auf reinem Basiswert), dann 50% (Nutzerentscheidung nach Feedback "Piraten
// wirken zu leicht"). Auf 100% angehoben (Nutzerentscheidung 28.07.2026, siehe README) als
// CPU-guenstigere Alternative zu groesseren Flotten: erhoeht NUR die Staerke JEDER EINZELNEN
// Piraten-Einheit (mehr Rechenlast skaliert mit Einheitenanzahl/Schuessen, nicht mit Stat-Hoehe -
// diese Aenderung fuegt KEINE zusaetzlichen Einheiten hinzu). Bewusst weiterhin NUR Forschung,
// NICHT Klassen-Bonus/Schiffs-/Verteidigungs-Module/Kampf-Booster (die bleiben exklusiv beim
// Spieler - der eigene Vorteil bleibt also trotz 100% erhalten). Bei Mehrspieler-Kaempfen
// (Elite-Bollwerk, Raid mit Verstaerkung/haltenden Flotten) zaehlt der DURCHSCHNITT aller
// Beteiligten (Nutzerentscheidung), siehe computePirateResearch() in combat.ts. Bewusst als eigene,
// leicht auffindbare Konstante - falls sich 100% als zu viel herausstellt, reicht eine Zahl hier.
export const PIRATE_RESEARCH_SHARE = 1.0;

export const MAX_RESEARCH_LEVEL = 10;
// Forschungsbaum: einheitliche Voraussetzungs-Schwelle fuer JEDE Eltern->Kind-Verbindung (siehe
// ResearchDefinition.parentId in types.ts) - bewusst ein einziger globaler Wert statt individuell
// pro Zweig, wie besprochen.
export const PARENT_UNLOCK_LEVEL = 3;
// 04.08.2026 (Nutzerentscheidung, Neugestaltung siehe SHIELD_REGEN_BASE_BY_CLASS oben): Deckel auf
// 0.80 gesetzt, damit er exakt vom obersten Klassen-Endwert (Spezialschiffe/Imperator/
// Verteidigungsanlagen bei Max-Forschung) erreicht, aber nicht ueberschritten wird - fuer alle
// niedrigeren Klassen (Jaeger 20%, Kreuzer 30%, Elite 50%) greift der Deckel praktisch nie.
export const SHIELD_REGEN_MAX = 0.80;
export const PRECISION_BASE = 0.40;
export const PRECISION_MAX_PLAYER = 0.60;
export const DEFENSE_REPAIR_PERCENT = 0.70;
export const MAX_ROUNDS = 100;
// Performance-Grenze (Nutzer-Entscheidung nach CPU-Vorfall bei einer 16.500-Schiffe-Flotte, siehe
// README Punkt 102/103): buildUnits() erzeugte bisher PRO EINZELNEM SCHIFF ein eigenes Objekt, das
// jede Runde eigenstaendig wuerfelt - bei sehr grossen Stapeln (mehrere Tausend Schiffe DESSELBEN
// Typs) fuehrte das zu mehrminuetigen Kampfberechnungen. Stapel eines Schiffs-/Verteidigungstyps
// MIT MEHR ALS dieser Stueckzahl werden ab jetzt als EIN Aggregat-aggregierter Block simuliert
// (Erwartungswert + statistisches Sampling statt Einzel-RNG pro Schiff, siehe fireShotsAggregate()
// in combat.ts) - Rechenzeit haengt dann nur noch von der ANZAHL VERSCHIEDENER TYPEN ab, nicht mehr
// von der Gesamt-Schiffsanzahl. Stapel BIS zu dieser Schwelle bleiben exakt wie bisher (identisches
// Verhalten/Balance) - betrifft in der Praxis nur sehr grosse Flotten, nicht den Normalfall.
// Testlauf 28.07.2026 (Nutzerentscheidung, nach dem Raid-/Sektor-Umbau auf Wochen-/24h-Rhythmus):
// versuchsweise auf 800 angehoben in der Annahme, seltenere Kaempfe wuerden das ausgleichen -
// Live-Messung im Kampfsimulator widerlegte das: die Rechenzeit pro Kampf skaliert deutlich
// ueberproportional mit der individuell simulierten Schiffsanzahl (5 Schiffstypen a 300/500/700
// Stueck ergaben ~1,7s/~3,8s/~6,9s PRO KAMPF, nicht nur im Hintergrund, sondern als direkte
// Wartezeit auf der Seite) - "seltener, aber laengere Kaempfe" aendert nichts an der Wartezeit
// EINES einzelnen Kampfs. Deshalb wieder auf 300 zurueckgesetzt (Nutzerentscheidung).
// 29.07.2026 (Nutzerentscheidung, nach README Punkt 113s RF-Zielpool-Perf-Fix): derselbe Test
// (5 Schiffstypen, Einzelschiff-Pfad erzwungen) zeigte mit dem Fix eine deutlich guenstigere Kurve
// (300 Stk/Typ ~0,18s, 800 ~0,6s, 1.200 ~1,1s, 1.500 ~1,5s, 2.000 ~2,4s). Auf 1.200 angehoben -
// guter Mittelweg zwischen spuerbar mehr Einzelschiff-Praezision fuer Massenflotten und noch
// flotter Kampfzeit.
// 29.07.2026, spaeter am selben Tag (Nutzerentscheidung nach Live-Beobachtung): CPU blieb bei
// echten Kaempfen mit 1.200 durchgehend unter 10% - auf 2.000 angehoben (~2,4s Worst-Case bei 5
// Typen exakt an der Schwelle, siehe Benchmark-Tabelle oben). Liegt an der Kante des alten
// Richtwerts ("ueber 2-3s fuehlt sich wie echte Wartezeit an") UND `POOL_SIZE` in
// `combatRunner.ts` steht inzwischen auf 1 (serialisiert, kein zweiter Worker-Slot faengt einen
// langen Kampf mehr ab) - falls sich Kaempfe zaeh anfuehlen, waere 1.500 (~1,5s) die naechste
// sichere Zwischenstufe.
// 30.07.2026 (Nutzerentscheidung, grundlegender Umbau nach Beobachtung eines echten Rueckstau-
// Vorfalls, siehe MISSION_HOURLY_CATCHUP_CAP-Kommentar): EIN globaler Schwellenwert fuer ALLE
// Schiffs-/Verteidigungstypen gleichzeitig ist strukturell ungeeignet - kleine, guenstige Schiffe
// (Jaeger) werden in der Praxis in viel groesserer Stueckzahl gebaut als teure Elite-Schiffe, eine
// gemeinsame Schwelle ist fuer die einen zu niedrig oder fuer die anderen zu hoch. Ersetzt durch
// STACK_AGGREGATE_THRESHOLD_BY_TYPE (pro Schiffs-/Verteidigungsklasse gestaffelt, siehe dort) -
// diese Konstante bleibt nur noch als DEFAULT fuer alle nicht explizit gelisteten Typen bestehen
// (Mining/Begleitschiff/Spionagesonde/Salvenschiffe/Imperator/Schildkuppeln/Sentinel-/
// Ultimate-Kanone - alle bereits ueber maxCount/isDome oder aehnliche Mechanismen gedeckelt, eine
// Aggregation greift dort in der Praxis nie).
export const STACK_AGGREGATE_THRESHOLD = 2000;
// Pro Schiffs-/Verteidigungsklasse gestaffelte Schwelle (Nutzerentscheidung 30.07.2026) - je
// teurer/staerker die Klasse, desto niedriger die Schwelle (grosse Stueckzahlen davon sind
// unrealistisch, eine niedrige Schwelle kostet also kaum echte Praezision, spart aber
// Rechenzeit sobald doch mal viele davon zusammenkommen). Gruppierung 1:1 nach den bestehenden
// UI-Kategorien (SHIP_GROUPS in client/src/lib/combatInfo.ts: Jaeger-/Kreuzer-/Elite-Klasse).
// Verteidigungsanlagen OHNE maxCount (siehe data/defenses.ts) bekommen dieselbe Schwelle wie die
// Kreuzer-Klasse - das war bisher der Hauptverdaechtige fuer sehr grosse Einzelstapel (Raid-
// Heimatverteidigung kann leicht in die Tausende gehen), siehe README Punkt 124 fuer die
// Benchmark-Werte, die diese Zahlen bestaetigt haben.
export const STACK_AGGREGATE_THRESHOLD_BY_TYPE: Record<string, number> = {
  // Jaeger-Klasse
  leicht: 500,
  schwer: 500,
  // Kreuzer-Klasse
  kreuzer: 100,
  schlachtschiff: 100,
  bomber: 100,
  // Elite-Klasse
  schlachtkreuzer: 50,
  zerstoerer: 50,
  reaper: 50,
  sandronator: 50,
  // Verteidigungsanlagen ohne maxCount (siehe data/defenses.ts)
  raketenwerfer: 100,
  leichteslaser: 100,
  schwereslaser: 100,
  gausskanone: 100,
  ionengeschuetz: 100,
  plasmawerfer: 100,
};

export function stackAggregateThresholdFor(typeId: string): number {
  return STACK_AGGREGATE_THRESHOLD_BY_TYPE[typeId] ?? STACK_AGGREGATE_THRESHOLD;
}
// Instant-Explosions-Mechanik (applyHitToTarget() in combat.ts, Nutzerentscheidung Juli 2026):
// eine Einheit unter dieser HP-Schwelle kann bei einem Treffer sofort komplett ausfallen, statt
// regulaer per Schaden auf 0 HP gebracht zu werden. Vorher 0.7 mit LINEARER Chance (1 -
// hpCur/hpMax) - das liess Flotten schon ab moderatem Schaden reihenweise "explodieren" statt
// uebers Gefecht hinweg an HP zu verlieren, wodurch Kaempfe zu frueh kippten. Jetzt niedrigere
// Schwelle (Einheiten muessen deutlich staerker angeschlagen sein, bevor ueberhaupt ein Risiko
// besteht) UND quadratisch gedaempfte Chance (siehe EXPLOSION_CHANCE_EXPONENT) statt linear -
// schwer beschaedigte Schiffe halten dadurch spuerbar laenger durch, die Chance wird erst nahe am
// reg. Tod wirklich hoch.
export const EXPLOSION_HP_THRESHOLD = 0.7;
export const EXPLOSION_CHANCE_EXPONENT = 1.15;
export const MAX_BUILD_SLOTS = 3;
export const MAX_DEFENSE_SLOTS = 3;
export const MAX_RESEARCH_SLOTS = 4;
// Gebaeude teilen sich bewusst nur EINEN globalen Slot (siehe README) - kein Lane-System wie bei
// Schiffen/Verteidigung/Forschung.
export const MAX_BUILDING_SLOTS = 1;
// Von 1 auf 3 angehoben (Nutzerentscheidung), damit mehrere Schiffs-/Verteidigungs-Module
// gleichzeitig statt strikt nacheinander gebaut werden koennen - passend zu den gesenkten
// Modul-Kosten/-Bauzeiten, analog zu den 3 normalen Bauplaetzen (MAX_BUILD_SLOTS/MAX_DEFENSE_SLOTS).
export const MAX_SHIP_MODULE_SLOTS = 3;
export const MAX_DEFENSE_MODULE_SLOTS = 3;
// Reines Sicherheitsnetz gegen unbegrenztes Wachstum (kein Performance-Limit mehr, da die
// Kampfberechnung jetzt in einem separaten Worker-Thread laeuft, siehe combatRunner.ts).
// Grosszuegig bemessen, damit auch gemeinsame Multiplayer-Flotten (mehrere Spieler kombiniert
// im selben Piraten-Sektor) genug Platz haben.
//
// 09.08.2026: von 100.000 auf 200.000 angehoben (Nutzerentscheidung). Anlass: ein Spielstand lag
// mit 103.196 Schiffen UEBER dem alten Limit und konnte dadurch gar kein Schiff mehr bauen.
// Begruendung fuer die Anhebung statt einer Korrektur nach unten: die Konstante ist ein
// Sicherheitsnetz, kein Balance-Wert.
//
// 11.08.2026: von 200.000 auf 1.000.000 angehoben (Nutzerentscheidung). Der urspruengliche
// Vorschlag war, das Limit ganz zu entfernen. Nachgeprueft und bestaetigt: die Rechenzeit haengt
// seit der Aggregat-Engine nur noch von der ANZAHL VERSCHIEDENER TYPEN ab (max. 15), nicht von der
// Stueckzahl - die einzigen Schleifen ueber Einzelstuecke in combat.ts (buildUnits()) laufen
// ausschliesslich UNTERHALB von STACK_AGGREGATE_THRESHOLD_BY_TYPE. Auch ausserhalb des Kampfes
// skaliert nichts mit der Stueckzahl: `state.fleet` ist ein Record aus Typ und Anzahl, der
// Spielstand ist bei 1,5 Mio. Schiffen genauso gross wie bei 100.
//
// TROTZDEM bewusst nicht auf unbegrenzt, aus zwei Gruenden:
// 1. Die Unabhaengigkeit von der Stueckzahl gilt WEGEN der Aggregation. Senkt jemand spaeter eine
//    Schwelle oder baut einen Kampfmodus, der wieder pro Einheit rechnet, gibt es ohne Limit
//    keinen Auffangboden mehr. Ein Limit weit oberhalb jeder realistischen Nutzung kostet nichts.
// 2. WICHTIGER: Seit dem Overkill-Deckel (Entscheidung 1, umgesetzt 10.08.2026) verlieren grosse
//    Flotten anteilig deutlich weniger - 400 Kreuzer verlieren 6,6 %, wo vorher alles wegging.
//    Je groesser die Flotte, desto sicherer wird sie pro Schiff. Genau diese Rueckkopplung soll
//    Entscheidung 2 (Beute-Kurve, Exponent 0,85) abfangen, und die ist noch NICHT gebaut. Bis
//    dahin wirkt dieses Limit als stiller Ersatz-Bremsklotz gegen Weglauf-Wachstum.
// -> NACH Block D des Umsetzungsplans erneut ansehen. Dann ist es wieder eine reine CPU-Frage und
//    die Entscheidung "ganz weg oder nicht" faellt leichter. Siehe Abschnitt 7 des Plans.
//
// R13 (Zaehlung ueber alle Orte) ist am 11.08.2026 behoben - `totalOwnedShips()` zaehlt jetzt auch
// Missionen, Galaxie-Entsendungen und Gruppen-Operationen mit, abgesichert durch eine
// Ratschen-Obergrenze (`effectiveShipLimit()` in actions.ts), damit die strengere Zaehlung
// niemanden rueckwirkend aussperrt.
// OFFEN geblieben: Container-Freischiffe (inventory.ts) und Missionsrueckkehrer (missions.ts)
// fliessen weiterhin ohne Limitpruefung direkt in die Flotte - der Bestand kann die Grenze dadurch
// von selbst ueberschreiten, Bauen ist dann bis zur naechsten Verschrottung gesperrt.
export const MAX_PLAYER_SHIPS = 1000000;

// Belohnungs-Bonus fuer groesser eingesetzte Flotten (Nutzerentscheidung Juli 2026): wer deutlich
// mehr Macht als sektortypisch noetig einsetzt, bekommt einen begrenzten Beute-/Teile-/Bergungs-
// DM-Aufschlag. Bewusst LOGARITHMISCH und GEDECKELT (FLEET_SIZE_BONUS_CAP) statt linear, damit
// "immer die Maximalflotte schicken" nicht die einzig sinnvolle Strategie wird - kleine, haeufige
// Einsaetze bleiben eine gueltige Alternative (nur ohne den Bonus). Gilt fuer Piraten-Sektoren
// (niedrig/mittel/hoch), Elite-Bollwerk und die Raid-Bergungs-DM - AUSDRUECKLICH NICHT fuer den
// Piratenadmiral (P10), der schon seine eigene Risiko/Belohnung-Eskalation ueber "weitermachen"-
// Checks hat (siehe groupOps.ts runAdminCheck) - ein zusaetzlicher Flottenbonus wuerde sich damit
// ueberschneiden.
export const FLEET_SIZE_BONUS_CAP = 0.5; // maximal +50%
export const FLEET_SIZE_BONUS_RATE = 0.25;

// Spezialschiffe mit "Mehrfachziel-Salve": statt bei erfolgreicher Zielerfassung nur EIN
// RF-anfaelliges Ziel zu treffen, feuern sie auf JEDEN anfaelligen SCHIFFSTYP einmal (nicht auf
// jede einzelne Einheit - siehe fireShots() in combat.ts fuer die genaue Umsetzung).
// Trotz des Namens (historisch gewachsen, urspruenglich nur fuer Schiffe) inzwischen auch fuer
// zwei Spezialverteidigungsanlagen genutzt (Sentinel-/Ultimate-Kanone) - die Mehrfachziel-Salve-
// Logik in combat.ts prueft nur generisch den typeId-String, unabhaengig davon ob Schiff oder
// Verteidigungsanlage.
export const MULTI_TARGET_VOLLEY_SHIPS = new Set(['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'sentinelkanone', 'ultimatekanone']);

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
  // Balance (Juli 2026, Nutzer-Feedback): fehlte bisher komplett, fiel damit auf den
  // pickWaveProfile()-Standardwert {schwarm:1} zurueck - IMMER die schwaechste, "leicht"-lastige
  // Zusammensetzung. Das machte einen Power-technisch korrekt skalierten Piratenangriff gegen
  // wenige starke Schiffe (z.B. 1 Imperator) trotzdem wirkungslos: viele billige Leichte Jaeger
  // kommen kaum durch dessen Panzerung/Schild, ihre Feuerkraft verpufft. Analog zu piraten_hoch/
  // -elite angehoben, damit Aussenposten-Gegner (Eroberung UND Rueckeroberung, siehe outposts.ts)
  // aus weniger, aber deutlich staerkeren Schiffen bestehen.
  outpost: { schwarm: 0.15, kampfgruppe: 0.45, elitekader: 0.4 },
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
// 04.08.2026 (Nutzerentscheidung, Neugestaltung "Dynamische Zufalls-Kampfskalierung"): fuer alle
// Piraten-Sektoren auf 0 gesetzt - der "20% Chance: Extremer Ueberraschungs-Hammer"-Bucket im
// neuen 50/30/20-System (siehe PIRATEN_MULTIPLIER_ROLL) UEBERNIMMT jetzt genau die Rolle, die
// vorher dieser separate Ausreisser-Wurf hatte. Ein zusaetzlicher Ausreisser ON TOP des ohnehin
// schon extremen 20%-Buckets (bei piraten_hoch/elite bis 200%/250%) wuerde die im Plan als
// bewusste Obergrenze genannten Werte ueberschreiten.
export const WAVE_OUTLIER_CHANCE: Record<string, number> = {
  piraten_niedrig: 0,
  piraten_mittel: 0,
  piraten_hoch: 0,
  piraten_elite: 0,
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
// Balance-Anpassung (Juli 2026): dieselbe Idee wie bei WAVE_OUTLIER_CHANCE - mehr Haeufigkeit von
// Kampf-Modifikatoren macht Kaempfe abwechslungsreicher, gerade auf niedrig/mittel wo bisher kaum
// mal einer vorkam.
export const BATTLE_MODIFIER_CHANCE: Record<string, number> = {
  piraten_niedrig: 0.08,
  piraten_mittel: 0.14,
  piraten_hoch: 0.24,
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
