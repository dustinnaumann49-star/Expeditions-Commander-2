# Finale Balance-Checkliste (Stand 05.08.2026)

Vorbereitet für den geplanten kompletten Balance-Check mit Opus/höchstem Aufwand vor dem Release.
Ziel: nicht bei Null anfangen, sondern auf dieser Session aufbauen. Vollständige Details zu jedem
Punkt stehen in den referenzierten Memory-Dateien (`~/.claude/projects/.../memory/`).

## 🗂️ Empfohlene Aufteilung in 4 separate Opus-Sessions

Damit keine einzelne Session am Kontextlimit scheitert - jede Session bekommt nur die Dateien/
Themen, die sie wirklich braucht. Reihenfolge 1→4 empfohlen (Wirtschaft zuerst, da sie beeinflusst,
wie "teuer" sich Kampfverluste in Session 2/3 anfühlen).

**Session 1 - Wirtschaft**
- Gebäude V1/V2/V3 (Minen, Solar, Roboter-/Nanitenfabrik) - Kosten-/Ertragskurven, ob die
  V2/V3-Schwellen (36/32/30) nach echtem Spielverlauf noch passen
- Forschungsbaum - Kosten/Zeit, Verzweigungen, lohnen sich hohe Stufen noch
- Asteroidenfeld (Niedrig/Mittel/Hoch) - Ertragsraten, Eskorte, Zusammenspiel Frischling-Bonus +
  neuer Di/Do-Event-Bonus
- Schrotthändler/Teile-Umwandlung/Handel, Wirtschafts-Klassen, Shop (Booster/Gutscheine)

**Session 2 - Kampf (PvE-Inhalte)**
- Piraten-Sektor Niedrig/Mittel/Hoch (diese Session gefixt - eher verifizieren als neu suchen)
- Elite-Bollwerk (diese Session gefixt - volle 6-Check-Serie noch nicht live durchgespielt)
- **Piratenadmiral** - diese Session komplett unangetastet, eigene Aufmerksamkeit nötig
  (Eskalation, Extraktions-Mechanik, Boss-Skalierung)
- Raid-Event - neue 2x/Woche-Frequenz über mehrere echte Wochen beobachten

**Session 3 - Schiffe, Verteidigung & Module**
- Schiffsbalance (Tier-Progression, RapidFire-Kette, Spezialschiffe/Sandronator/Imperator)
- Verteidigungsanlagen (Kosten/Werte-Progression, Sentinel-/Ultimate-Kanone)
- Kampf-Klassen (Kanonier/Bollwerk/Kommandant) - gleich attraktiv?
- Schiffs-/Verteidigungs-Module (Stufe-10-Deckel, Kosten)

**Session 4 - Multiplayer & Rest**
- Allianz-Station (V1/V2/V3) - diese Session nicht angefasst, Abgleich mit neuem
  Heimatbasis-System sinnvoll
- Galaxie-Ereignisse, Piratenbasen-Angriffe, Spionage
- Statistik/Punktesystem
- Zum Schluss: Gesamt-Konsistenz-Check (README/Changelog vollständig? Nichts vergessen?)

## ✅ Diese Session bereits geprüft + gefixt (nicht erneut von vorne prüfen)

- **Piraten-Sektor Niedrig/Mittel/Hoch**: Feindstärke-Tabelle (`PIRATEN_MULTIPLIER_ROLL`) korrigiert,
  Härte-Reihenfolge Niedrig<Mittel<Hoch<Elite wiederhergestellt. Live vom Nutzer bestätigt: Hoch ist
  bei vollem Ausbau gut machbar. → `project_piraten_balance_fix_2026_08_05.md`
- **Elite-Bollwerk**: Feindstärke gesenkt, `computePirateResearch()` nutzt jetzt Minimum statt
  Durchschnitt der Gruppen-Forschung (verhindert Bestrafung schwächerer Mitspieler), `defenseFactor`
  gesenkt (NPC-Verteidigung war praktisch unzerstörbar), Schild-Regen der Verteidigungsanlagen nach
  Tier gestaffelt statt pauschal. Belohnung (`lootBase`/`winResources`) mehrfach nachjustiert - **wichtige
  Lektion dabei**: bei Belohnungen mit Serien-Eskalation (`REWARD_ESCALATION`) immer die volle
  Eskalationskurve durchrechnen, bevor Basiswerte multipliziert werden. Live über 4 Checks bestätigt:
  Verlustrate fiel von 31%→37%→15%→5,9%, Verlust-Gefälle zwischen Mitspielern auf Modul-Niveau
  geschrumpft. → `project_piraten_balance_fix_2026_08_05.md`
- **Raid-Event**: Simulation zeigte gute Balance (0/15 Totalverluste), besonders mit
  Verstärkungs-Mechanik (zählt NICHT zur Feindstärke-Berechnung). Keine Änderung nötig.
- **Home-Base V2/V3-Gebäudestufen**: neues Feature, analog Allianz-Station aber unbegrenzt
  ausbaubar. Unlock-Schwellen 36/32/30. → `project_home_building_v2v3_2026_08_05.md`
- **Wöchentlicher Event-Kalender**: neues Feature (Mo/Fr Piraten-Bonus, Di/Do Asteroiden-Bonus,
  Mi/So Raid 2x/Woche, Sa Bauzeit-Bonus). → `project_weekly_event_calendar_2026_08_05.md`
- **Teile-Umwandlung**: neues Feature beim Schrotthändler, Rate vom Nutzer bei 16k Teilen live
  bestätigt. → `project_teile_conversion_2026_08_05.md`
- **Kampfbericht-Transparenz**: zeigt jetzt reale Feindstärke in % statt nur "Normale Welle".

## 🔍 Noch offen / sollte im Finale-Check verifiziert werden

1. **Raid-Frequenz-Verdopplung (Mi+So statt nur So)**: NEU, noch nicht live über mehrere Wochen
   beobachtet. Prüfen: verdoppelt sich die Wiederaufbaulast spürbar? Ggf. mit derselben Methode wie
   beim Elite-Bollwerk (`simulateCombat`-artige Simulation über mehrere Wellen) gegenchecken.
2. **Elite-Bollwerk-Belohnung (`winResources` + `lootBase`)**: Rate wurde rechnerisch kalibriert
   (~13,5 Mrd./Spieler bei voller 6-Check-Serie), aber noch nicht über eine KOMPLETTE Serie (alle 6
   Checks) live verifiziert, ob das Ressourcen-Verhältnis wirklich gut passt.
3. **Elite-Bollwerk-Eskalation `2^6=64x`**: aus einer früheren Session als "Nutzer beobachtet,
   noch nicht als zu stark bestätigt" vermerkt - erneut anschauen, ob die Grundeskalation selbst
   (unabhängig von der schon gefixten Belohnungshöhe) zu extrem ist. → `project_elite_bollwerk_escalation_watch.md`
4. **`STACK_AGGREGATE_THRESHOLD`** (300→1200 angehoben 29.07.2026): Nutzer wollte live beobachten,
   ob weitere Anhebung sinnvoll ist - noch keine abschließende Entscheidung. → `project_stack_threshold_reconsideration.md`
5. **Mission-Crash-Ursache**: Symptom (fehlender Bericht bei Totalverlust) gefixt, aber die
   eigentliche root cause (was genau abstürzte) nie gefunden, da keine Server-Logs vom Vorfall
   vorlagen. Falls in Coolify-Logs je wieder `processMissions: Fehler bei Mission...` auftaucht,
   das dann gezielt untersuchen. → `project_mission_crash_root_cause_open.md`
6. **NPC-Verteidigung generell (nicht nur Elite-Bollwerk)**: der gefundene Fehler (pauschaler
   Schild-Regen, siehe oben) betraf `SHIELD_REGEN_BASE_BY_CLASS` global - geprüft nur im
   Elite-Bollwerk-Kontext. Ggf. auch bei Piratenadmiral (P10) / Raids gegenchecken, ob dort
   ähnliche NPC-Verteidigungs-Stacks unverhältnismäßig tanky sind.

## 📋 Von dieser Session NICHT angefasste Bereiche (für "komplett" noch zu prüfen)

Diese Bereiche wurden diese Session nicht untersucht - für einen wirklich vollständigen Check
gehören sie in den Umfang:

- **Forschungsbaum** (`research.ts`): Kosten-/Zeitkurven, Verzweigungen, ob alle Endstufen sinnvoll
  erreichbar sind.
- **Schiffsbalance** (`ships.ts`): RapidFire-Kette, Klassen-Rollen (Jäger/Kreuzer/Elite/Spezial),
  Salvenschiffe, Sandronator, Imperator - wurden zuletzt am 04.08. umgebaut, seitdem nicht erneut
  systematisch gegengeprüft.
- **Verteidigungsanlagen-Balance** außerhalb NPC-Kontext (eigene Heimatverteidigung: Kosten,
  RapidFire, Sentinel-/Ultimate-Kanone-Mehrfachziel).
- **Klassensystem** (Kampf-Klassen Kanonier/Bollwerk/Kommandant, Wirtschafts-Klassen
  Schmuggler/Ingenieur/Prospektor) - Kostenmultiplikatoren, ob alle drei/drei gleichwertig
  attraktiv sind.
- **Allianz-Station** (V1/V2/V3, eigenes System) - seit Einführung nicht erneut balanciert.
- **Galaxie-Ereignisse, Piratenbasen-Angriffe, Spionage** - eigene Wirtschaftskreisläufe, diese
  Session nicht angerührt.
- **Statistik/Punktesystem** - zuletzt im Juli umgebaut, seitdem nicht erneut geprüft.
- **Shop-Booster/Zeit-Gutscheine** - Preis-Leistungs-Verhältnis nicht diese Session untersucht.

## 🧰 Werkzeuge, die sich bewährt haben

- `simulateCombat()` (`server/src/game/simulator.ts`) für Kampf-Balance-Simulationen (mehrere
  Forschungs-/Modul-Profile durchrechnen, NICHT nur Einzellauf wegen Zufallsstreuung).
- Kleine Testskripte via `npx tsx` im scratchpad für serverseitige Logikverifikation (Tier-Unlock,
  Event-Kalender-Wochentage, Umwandlungs-Funktionen) - schneller und günstiger als Browser-Tests für
  reine Logikfragen.
- Browser-Verifikation (Registrierung + Login mit Test-Account) für UI-Änderungen, aber nur wenn
  wirklich UI betroffen ist - für reine Balance-/Zahlen-Fragen reicht die Simulation.
- **Wichtigste Lektion der Session**: bei Belohnungssystemen mit Eskalation/Serien-Bonus IMMER die
  volle Kurve über die gesamte mögliche Serie durchrechnen, bevor an einem Basiswert gedreht wird -
  ein flacher Multiplikator auf einer bereits exponentiellen Basis explodiert schnell weit über das
  beabsichtigte Ziel hinaus.

---

# Session 1 - Wirtschaft: Analyse-Ergebnis (08.08.2026)

**Status: REINE ANALYSE, KEINE CODEAENDERUNG.** Umsetzung erfolgt spaeter in einer eigenen
Claude-Code-Session. Dieser Abschnitt ist so geschrieben, dass eine spaetere Session direkt
loslegen kann, ohne die Zahlen neu herzuleiten.

Analysierter Stand: Commit `b4d8181` (06.08.2026).
Geprueft: Gebaeude V1/V2/V3 + Energie, Minen-Kosten-/Ertragskurven, Gebaeude-Module,
Asteroidenfelder, Solo-Piraten-Sektoren, Container/Belohnungen, Haendler/Schrott/Teile-Umwandlung,
Shop (Booster/Gutscheine), Wirtschafts-Klassen, DM-Haushalt.
NICHT geprueft (weiterhin offen, siehe Session 2-4 oben): Kampfbalance, Schiffe, Verteidigung,
Module, Allianz-Station, Aussenposten, Galaxie-Ereignisse, Piratenadmiral, Statistik.

## Methodik (fuer Reproduzierbarkeit)

Alle Betraege sind **Wert-Einheiten** = `metall*1 + kristall*1.5 + deuterium*3`
(entspricht `TRADE_VALUE` in `data/economy.ts`). Das macht Belohnungen mit
unterschiedlichem Ressourcenmix vergleichbar.

Container-Erwartungswerte wurden mit derselben exakten Enumeration berechnet wie
`computeRealCategoryChances()` in `data/economy.ts` (also inkl. der "genau 2 Treffer"-
Normalisierung), nicht mit den rohen `chance`-Werten. Teile wurden mit
`TEILE_CONVERT_RESOURCES` bewertet (325.000 Wert-Einheiten pro Teil), Freischiffe mit den
Baukosten der enthaltenen Schiffe aus `data/ships.ts`.

Ermittelte Container-Erwartungswerte (Wert-Einheiten, inkl. Jackpot):

| Container | Ressourcen (real) | Teile (real) | Freischiff (real) | EV gesamt | EV DM |
|---|---|---|---|---|---|
| Silber | 80% / 33,0 Mio | 78% / 19,5 Mio | 14% / 91,7 Mio | **60,1 Mio** | 0 |
| Gold   | 71% / 120,5 Mio | 44% / 48,8 Mio | 10% / 207,7 Mio | **127,2 Mio** | 19,4 |
| Elite  | 74% / 229,0 Mio | 46% / 87,8 Mio |  7% / 350,0 Mio | **237,6 Mio** | 28,6 |

## Befund 1 (HOCH): Solo-Piraten-Stufen sind wirtschaftlich identisch, das Risiko nicht

**Dateien:** `data/sectors.ts` (`SEKTOR_CONFIG.winContainer`/`winResources`,
`PIRATEN_MULTIPLIER_ROLL`)

Erwartungswert **pro gewonnenem Check**:

| Sektor | Container | Container-EV | winResources | Summe/Sieg | Feindstaerke |
|---|---|---|---|---|---|
| Niedrig | 4x Silber | 240,4 Mio | 7,1 Mio | **242,7 Mio** | 0.35 / 0.50 / 0.65 |
| Mittel | 2x Gold | 254,4 Mio | 21,8 Mio | **259,9 Mio** | 0.55 / 0.75 / 0.90 |
| Hoch | 1x Elite | 237,6 Mio | 63,0 Mio | **251,6 Mio** | 0.70 / 0.95 / 0.95-1.20 |

Die Container-Anzahl (4/2/1) hebt den Stufen-Unterschied der Container-Qualitaet exakt auf.
`winResources` ist mit 7/22/63 Mio zu klein, um das zu drehen (2-25% des Gesamtwerts).
Differenziert wird faktisch nur noch ueber `checkChance` (0,55/0,65/0,75).

Tagesertrag (24h, 6 Checks): Niedrig 0,80 Mrd - Mittel 1,01 Mrd - Hoch 1,13 Mrd.
DM/Tag: Niedrig 0 - Mittel 151 - Hoch 128.

**Bewertung:** Hoch liefert PRO SIEG weniger als Mittel UND weniger DM, bei deutlich hoeherer
Feindstaerke. Risikoadjustiert ist Niedrig die rationale Wahl. Die im Juli/August 2026
muehsam wiederhergestellte Haerte-Reihenfolge Niedrig<Mittel<Hoch existiert auf der
Belohnungsseite nicht.

**Empfehlung:** Container-Anzahl der unteren Stufen senken statt `winResources` anzuheben
(letzteres ist der schwache Hebel). Vorschlag zur Diskussion: 2x Silber / 2x Gold / 1x Elite
ergibt 120 / 254 / 238 Mio pro Sieg - dann traegt zusaetzlich `winResources` die
Feindifferenzierung zwischen Mittel und Hoch. Alternativ Elite-Container-Anzahl bei Hoch auf 2
anheben und Niedrig auf 2x Silber senken.

**Achtung bei der Umsetzung:** `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr) verdoppelt in
`missions.ts:558` den `combatWins`-Zaehler, wirkt also multiplikativ auf die Container-Anzahl.
Jede Aenderung an `winContainer.count` verdoppelt sich an Event-Tagen mit.

## Befund 2 (HOCH): Kristall- und Deuteriummine sind durch "Metallmine + Haendler" dominiert

**Dateien:** `data/buildings.ts` (`baseCost`/`costGrowth`/`baseOutput`),
`data/economy.ts` (`TRADE_FEE`, `TRADE_VALUE`)

Alle drei Minen liefern pro Stufe praktisch denselben WERT
(10.000 x1 / 6.700 x1,5 = 10.050 / 3.300 x3 = 9.900), kosten aber voellig unterschiedlich:

| Stufe | Metallmine | Kristallmine | Deuteriummine |
|---|---|---|---|
| Kosten Stufe 25 | 177 Mio | 614 Mio | 1,11 Mrd |
| Amortisation der Stufe | 515 h | 1.772 h | 3.250 h |
| Kosten Stufe 30 | 1,59 Mrd | 6,44 Mrd | 11,63 Mrd |
| Amortisation der Stufe | 2.503 h | 10.096 h | 18.515 h |

Bei `TRADE_FEE = 0.2` ist "Metallmine ausbauen und ueberschuessiges Metall tauschen" um Faktor
**2,8 (Kristall)** bzw. **5,0 (Deuterium)** effizienter als der direkte Ausbau dieser Minen.
Damit der Deuterium-Ausbau gleichwertig waere, muesste die Handelsgebuehr bei ca. **84%**
liegen. Der Haendler ist unbegrenzt und sofort - es gibt keinen Grund, jemals Kristall- oder
Deuteriummine ueber das Freischalt-Minimum hinaus auszubauen.

**Empfehlung (eine Richtung waehlen):**
- (a) Kosten angleichen (`costGrowth` 1.6 -> 1.55 und `baseCost` der Kristall-/Deuteriummine
  senken), dafuer die Ertraege NICHT mehr wertgleich halten - Deuterium bleibt knapp ueber die
  Menge, nicht ueber den Preis.
- (b) `TRADE_FEE` deutlich anheben (0.2 -> 0.5+) und/oder ein Tageslimit pro Tauschrichtung
  einfuehren. Nebenwirkung: trifft auch den Schmuggler (halbierte Gebuehr) - dessen Bonus wird
  dadurch automatisch staerker.
- (c) Status quo akzeptieren und dokumentieren, dass Kristall-/Deuteriummine bewusst nur bis zur
  Freischaltschwelle gebaut werden.

Empfohlen wird (a): laesst den Haendler als bequemes Werkzeug unangetastet und repariert die
Ursache statt des Symptoms.

## Befund 3 (MITTEL, isoliert fixbar): Gebaeude-Bauzeit ist faktisch abgeschafft

**Dateien:** `game/actions.ts` `roboterNaniteFactor()` (Zeile ~55),
Spiegel in `client/src/lib/multipliers.ts`

`factor = 0.75^roboterLevel * 0.5^nanitLevel` - **ohne Untergrenze**. Zum Vergleich: fuer
Schiffe/Verteidigung steht dort `0.99^` / `0.98^`, also ein sanfter Verlauf.

- Nanitenfabrik Stufe 10 (kumuliert ca. 400 Mio Wert): Faktor 1/1.024
- zusaetzlich Roboterfabrik Stufe 15: Gesamtfaktor 1,3e-5
- Metallmine Stufe 36 faellt damit von 18.224 h Bauzeit auf **14 Minuten**

Folgen:
1. `bauzeit_gebaeude`-Forschung, Gebaeude-Zeitgutscheine (150/300 DM in `SHOP_VOUCHERS`), das
   Samstags-Bauzeit-Event und der Ingenieur-Bonus (-15% Bauzeit) sind fuer Gebaeude wirkungslos.
2. Die Nanitenfabrik ist exakt neutral kalibriert (`costGrowth: 2.0` gegen Zeitfaktor 0.5 pro
   Stufe). Da es einmalige Kosten gegen dauerhaften Nutzen sind, gibt es nie einen Grund,
   den Ausbau zu stoppen.
3. `MAX_BUILDING_SLOTS = 1` als Engpass ist dadurch ebenfalls bedeutungslos.

**Empfehlung:** Untergrenze einziehen, analog zur bereits vorhandenen `Math.max(0.3, ...)` in
`baseTimeMultiplier()`. Vorschlag: `Math.max(0.05, Math.pow(0.75, rob) * Math.pow(0.5, nan))`
fuer `target === 'building'`. Alternativ den Nanit-Faktor auf 0.7 oder 0.75 pro Stufe
abschwaechen. **Wichtig: Server und Client (`multipliers.ts`) muessen synchron geaendert
werden** (siehe README Punkt 1).

Dieser Befund ist unabhaengig von allen Grundsatzentscheidungen und kann sofort umgesetzt werden.

## Befund 4 (Grundsatzentscheidung noetig): V2-Freischaltung ist ueber Minen nicht finanzierbar

**Dateien:** `data/buildings.ts` (`HOME_TIER_UNLOCK_LEVELS`)

Gesamtinvest bis zur aktuellen Schwelle 36/32/30 inkl. des dafuer noetigen Solarkraftwerks
(Stufe 38, Energie ist pro Tier isoliert):

| Schwelle | noetiges Solar | Gesamtinvest | Minenertrag/Tag | Amortisation |
|---|---|---|---|---|
| **36/32/30 (aktuell)** | 38 | **198,0 Mrd** | 554 Mio | **357 Tage** |
| 32/28/26 | 34 | 34,2 Mrd | 333 Mio | 103 Tage |
| 28/26/24 | 31 | 9,9 Mrd | 228 Mio | 43 Tage |
| 24/22/20 | 27 | 1,7 Mrd | 132 Mio | 13 Tage |

Die letzten ca. 6 Stufen machen rund 80% der Gesamtkosten aus. Metallmine Stufe 36 allein:
22,0 Mrd fuer +1,29 Mio/h = 17.035 h Amortisation dieser einen Stufe.
Der Energie-Aufschlag betraegt durchgaengig 35-51% der Minenkosten (Solar muss ca. 6 Stufen
ueber den Minen liegen, `1300` gegen `2500` Basis-Energie).

Erreichbar ist die Schwelle damit praktisch nur ueber Kampfbeute - vor allem Elite-Bollwerk
(ca. 17,05 Mrd pro Spieler pro vollstaendiger 24h-Serie, bei perfekter Serie doppelt).

**Das ist keine Fehlfunktion, sondern eine offene Design-Entscheidung:**
- (a) Minen sind eine **Senke fuer Kampfbeute** -> Schwellen so lassen, aber Befund 2 trotzdem
  fixen, sonst wird nur die Metallmine ausgebaut.
- (b) Minen sind ein **eigenstaendiger Wirtschaftszweig** -> Schwellen auf 28/26/24 senken
  (43 Tage Amortisation) und/oder `costGrowth` senken.

## Befund 5 (MITTEL, wirkt in Session 2/3 hinein): DM-Einnahmen deutlich ueber den Senken

**Dateien:** `data/economy.ts` (`BOOSTERS`, `BOOSTER_DURATION_OPTIONS`, `CONTAINER_TYPES`),
`data/sectors.ts` (`dmCap`)

Einnahmen pro Tag:
- Asteroidenfelder: 15 + 30 + 45 = **90 DM** (alle drei parallel beflogen, Prospektor
  beschleunigt nur die Rate, nicht den Cap)
- Container aus dem Solo-Piraten-Sektor: 128 (Hoch) bis 151 (Mittel) DM
- zusaetzlich ca. **690 DM pro Elite-Bollwerk-Serie** (garantierte Gold-/Elite-Container)
- Raid-Bergung: max. 20 DM pro Raid, 2x/Woche

Groesste laufende Senke: **alle vier Booster dauerhaft** im 30-Tage-Tarif
(`costMultiplier: 20` auf 24h-Preise 35/35/55/30) = **103 DM/Tag**.

**Bewertung:** Booster sind kein Kaufentscheid mehr, sondern Dauerzustand. Relevant fuer die
Kampf-Sessions: **Kampf-Boost +35% auf Waffen/Schild/Panzerung ist permanent aktiv** - jede
Kampfbalance in Session 2/3 muss davon ausgehen oder das hier zuerst korrigieren. Ebenso ist
`ABBAU_BOOST_MULTIPLIER = 1.7` faktisch ein Dauerfaktor auf allem Mining.
Die einzigen grossen Senken (`ECONOMY_CLASS_CHANGE_COST_DM` 1000, `RELOCATE_BASE_COST_DM` 300)
sind einmalig.

**Empfehlung:** `BOOSTER_DURATION_OPTIONS` 30-Tage-Multiplikator von 20 auf ca. 26 anheben
(entspricht 13% statt 33% Rabatt) und/oder DM-Ausschuettung der Gold-/Elite-Container senken.
Alternativ eine wiederkehrende DM-Senke einbauen. **Vor Session 2/3 klaeren**, sonst wird die
Kampfbalance gegen die falsche Baseline geprueft.

## Befund 6 (NIEDRIG, toter Code): REWARD_ESCALATION wirkt bei Niedrig/Mittel/Hoch nicht mehr

**Dateien:** `data/economy.ts` (`REWARD_ESCALATION`), `game/missions.ts:537-539, 572, 586-593`

Seit dem Umbau 29.07.2026 haben `piraten_niedrig/mittel/hoch` weder `lootBase` noch `teileCap`
in `SEKTOR_CONFIG`. `getEscalationMultiplier()` wird in `missions.ts:538` weiterhin berechnet,
fliesst aber ausschliesslich in den `lootBase`-Block (Zeile 586) und den Teile-Bonus (Zeile 572)
ein - beide sind fuer diese drei Sektoren nicht mehr erreichbar.

Folge: die Anhebung der Caps auf 1,30 / 1,80 / 2,40 (Juli 2026) hat keinerlei Wirkung, und der
Solo-Piraten-Sektor hat **gar keinen Serien-Anreiz mehr**. Nur das Elite-Bollwerk
(`mode: 'double'`) nutzt die Mechanik noch.
Immerhin: `escalationText` haengt am `lootText` und wird dadurch nicht faelschlich angezeigt -
es ist ein stiller, kein sichtbarer Fehler.

**Empfehlung:** entweder die drei Eintraege entfernen (samt Rechenaufruf) oder die Eskalation
auf `winResources` verdrahten (NICHT auf `winContainer` - Container-Anzahl mal Serie waere
wieder exponentiell, siehe die Lektion oben zur Eskalationskurve).

Auch dieser Befund ist unabhaengig von allen Grundsatzentscheidungen sofort umsetzbar.

## Befund 7 (NIEDRIG): kleinere Beobachtungen

- **Teile-Umwandlung inkonsistent ueber die Tiers.** `TEILE_CONVERT_RESOURCES` ergibt 325.000
  Wert-Einheiten pro Teil. Gemessen am Ressourcenwert desselben Containers: Silber 59%,
  Gold 40%, Elite 38%. Der Kommentar im Code nennt 45-55% als Ziel - Silber liegt darueber,
  Gold/Elite darunter. Entweder Rate anpassen oder Teile-Mengen pro Container angleichen.
- **Freischiff ist in jedem Container die wertvollste Kategorie** (Silber 91,7 gegen 33,0 Mio
  Ressourcen; Elite 350,0 gegen 229,0 Mio). Als seltener Jackpot vertretbar, aber: geschenkte
  Schiffe umgehen die Werft komplett und erhoehen die eigene Power, an der wiederum die
  Piraten-Feindstaerke skaliert (`PIRATEN_MULTIPLIER_ROLL` ist ein Anteil der eigenen Power).
  Bei Aenderungen an der Container-Balance mitdenken.
- **Asteroiden-Multiplikatoren stapeln rein multiplikativ**
  (`miningMultiplier()` in `missions.ts`): Mining-Forschung Stufe 10 (x2) * `mining_schiffe`
  * Prospektor (1,2) * Abbau-Booster (1,7) * Di/Do-Event (2,0) * Frischling (3,0) = **bis 24,5x**.
  Ein 7 Tage alter Account kommt damit auf ca. 8,5 Mrd/Tag allein aus Asteroiden - mehr als eine
  voll ausgebaute Heimatbasis (Befund 4). Der Frischling-Bonus ist als Aufholhilfe gedacht,
  ueberschiesst in dieser Stapelung aber deutlich. Pruefen, ob `NOVICE_BONUS_MULTIPLIER`
  additiv statt multiplikativ wirken sollte.
- **Mining-Schiffe amortisieren sich in unter 3 Stunden** (300 Schiffe = 6,2 Mio Wert gegen
  55,8 Mio/Tag im Niedrig-Feld). Alle drei Felder laufen parallel und es gibt keinen Grund,
  sie nicht dauerhaft maximal zu belegen - 346 Mio/Tag sind faktisch bedingungsloses
  Grundeinkommen. Das ist vermutlich gewollt (kein PvP), sollte aber bewusst so entschieden sein.
- **Kein Lagerkapazitaets-System vorhanden.** Ressourcen sind unbegrenzt stapelbar, es gibt
  keinen Anreiz, Ueberschuss auszugeben, und Offline-Zeiten werden voll nachgerechnet. Passt
  zum Spielrhythmus (mehrwoechige Abwesenheit), aber es fehlt dadurch jeder natuerliche
  Druck auf den Ressourcenkreislauf.

## Reihenfolge fuer die Umsetzungs-Session

1. **Zuerst entscheiden** (blockiert die grossen Aenderungen):
   - Sind Minen Beute-Senke (Befund 4a) oder eigener Wirtschaftszweig (Befund 4b)?
   - Wie werden die Solo-Piraten-Stufen differenziert (Befund 1: Container-Anzahl oder
     winResources)?
   - Sollen Booster dauerhaft leistbar bleiben (Befund 5)?
2. **Ohne Entscheidung sofort machbar:** Befund 3 (Bauzeit-Untergrenze, Server + Client
   synchron) und Befund 6 (toter Eskalations-Code).
3. **Danach:** Befund 2 (Minen-Kostenkurven vs. Haendler) - haengt an der Entscheidung zu
   Befund 4, weil beide dieselben Konstanten in `buildings.ts` anfassen.
4. **Erst danach Session 2/3 (Kampf/Schiffe) starten** - Befund 5 (Dauer-Kampf-Boost +35%)
   veraendert sonst die Baseline, gegen die dort gemessen wird.

## Zu beachten bei jeder Wirtschafts-Aenderung

- Client-Spiegel nicht vergessen: `client/src/lib/multipliers.ts` spiegelt Bauzeit-,
  Klassen- und Booster-Multiplikatoren 1:1 (README Punkt 1).
- Container-Werte NIE nach den rohen `chance`-Werten beurteilen - die "genau 2 Treffer"-
  Normalisierung verschiebt sie erheblich (`realChance` bzw. `computeRealCategoryChances()`).
- Belohnungen mit Eskalation immer ueber die volle Serie durchrechnen (Lektion der Vorsession,
  gilt hier besonders fuer Elite-Bollwerk mit `mode: 'double'`).
- Ressourcen fuer Vergleiche in Wert-Einheiten umrechnen (`TRADE_VALUE`), sonst wirken
  Deuterium-lastige Belohnungen systematisch zu klein.
