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

**Session 3 - Wirtschaft/Ausbau** (ERLEDIGT 08.08.2026, Ergebnis am Ende dieser Datei)
- Baukosten/Bauzeiten Schiffe + Verteidigung gegen die tatsaechlichen Einnahmen - GEPRUEFT
- Forschungskosten und -zeiten - GEPRUEFT
- Schiffs-/Verteidigungs-/Gebaeude-Modulkosten (Stufe-10-Deckel) - GEPRUEFT
- Gebaeude-Ausbaukurve V1/V2/V3 - GEPRUEFT
- Kampf-Klassen (Kanonier/Bollwerk/Kommandant) als Investitionsentscheidung - GEPRUEFT
- OFFEN, verschoben auf Session 4: reine Schiffsbalance untereinander (Tier-Progression,
  RapidFire-Kette, Rollen der Schiffsklassen), Sandronator/Piratenadmiral

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

---

# Session 2 - Kampf (PvE): Analyse-Ergebnis (08.08.2026)

**Status: REINE ANALYSE, KEINE CODEAENDERUNG.** Aufgebaut wie der Session-1-Abschnitt oben, damit
eine spaetere Umsetzungs-Session direkt loslegen kann, ohne die Zahlen neu herzuleiten.

Analysierter Stand: der als Sammel-Commit `ee863a6` hochgeladene Repo-Stand. **Achtung:** Session 1
nennt Commit `b4d8181` (06.08.2026); die Git-Historie des hochgeladenen Repos enthaelt nur einen
einzigen Commit, ein Diff gegen den Session-1-Stand war daher nicht moeglich. Stichproben (u.a.
`roboterNaniteFactor()` ohne Untergrenze, Befund 3 aus Session 1) zeigen den Code unveraendert -
die Baseline ist damit vergleichbar, aber nicht per Git verifiziert.

Geprueft: Solo-Piraten-Sektoren Niedrig/Mittel/Hoch, Elite-Bollwerk (inkl. voller 6-Check-Serie),
Piratenadmiral P10 (Eskalation, Extraktions-Mechanik, Boss-Skalierung), Raid-Wellensystem und die
neue 2x/Woche-Frequenz, sowie die offenen Punkte 1, 2, 3 und 6 der Liste oben.
NICHT geprueft (bleibt Session 3/4): Schiffsbalance untereinander, Verteidigungsanlagen ausserhalb
des Raid-Kontexts, Kampf-Klassen, Module, Allianz-Station, Aussenposten, Galaxie-Ereignisse,
Piratenbasen, Spionage, Statistik.

## Methodik (fuer Reproduzierbarkeit)

Alle Kampfzahlen stammen aus der ECHTEN Engine, nicht aus einer Nachbildung: `simulateCombat()`
(`game/simulator.ts`) fuer die vier Piraten-Sektoren, und fuer Piratenadmiral/Raid/Elite-Bollwerk
direkte Replikationen von `runAdminCheck()`, `resolveOneWave()` bzw. `runGroupHourlyCheck()` gegen
`runCombatInWorker()`/`runMultiOwnerCombatInWorker()`. Der Server wurde dafuer mit `tsc` gebaut
(der Kampf-Worker laeuft immer aus `dist/`, siehe README Punkt 9).

Stichprobengroessen: 96 Laeufe je Sektor/Profil/Flotten-Zelle (3.072 gesamt), 120 komplette
Piratenadmiral-Begegnungen, 120 einzelne P10-Check-1-Diagnoselaeufe, 40 komplette Raids
(je 12 Wellen), 40 Laeufe je Zelle im Multiplikator-Sweep.

Vier Ausbau-Profile (alle vier Kampf-Forschungen + Waffen/Schild/Panzerung auf derselben Stufe):

| Profil | Forschung | Module | Klasse | Kampf-Booster |
|---|---|---|---|---|
| **voll** | 10 | 10 (+30%) | Kanonier | aktiv |
| **voll ohne Boost** | 10 | 10 | Kanonier | inaktiv |
| **mittel** | 6 | 5 (+15%) | Kanonier | aktiv |
| **schwach** | 3 | 0 | keine | aktiv |

Referenzflotten: "gross" = 2,72 Mrd Basis-Power (gemischt, inkl. 2 Imperator/20 Salvenkreuzer/
10 Salvendreadnought), "klein" = 0,28 Mrd. Ressourcenwerte wie in Session 1 in **Wert-Einheiten**
(`metall*1 + kristall*1.5 + deuterium*3`), Container mit den Session-1-Erwartungswerten
(Silber 60,1 Mio / Gold 127,2 Mio / Elite 237,6 Mio; DM-Anteil Gold 19,4 / Elite 28,6).

## Befund 1 (HOCH, Baseline fuer alles Weitere): Die nominale Feindstaerke ist nicht die reale

**Dateien:** `game/combat.ts` (`combatFleetPowerBase()` Zeile 366, `getEffectiveStats()` Zeile 280),
`game/combat.worker.ts` (`statsFnBFor()`), `data/combatConstants.ts` (`PIRATE_RESEARCH_SHARE`)

`combatFleetPowerBase()` summiert **rohe `baseStats()`** - ohne Forschung, ohne Kampf-Booster, ohne
Klasse, ohne Module. Genau dieser Wert ist die Bezugsgroesse fuer `PIRATEN_MULTIPLIER_ROLL`,
`ADMIRAL_MULTIPLIER_ROLL`, `RAID_WAVE_ROLL` und `defenseFactor`. Im Kampf selbst treten dagegen an:

- **Spieler-Einheit:** `base x Forschung x 1,35 (Kampf-Booster) x Klasse x Module (bis 1,30)`
- **NPC-Einheit:** `base x Forschung` (ueber `computePirateResearch()`, `PIRATE_RESEARCH_SHARE = 1.0`)
  - **nie** Booster, Klasse oder Module

Die Forschung kuerzt sich also exakt heraus. Was bleibt, ist ein reiner, unkompensierter
Spielervorteil:

| Nominale Feindstaerke | real (Booster + Module 10) | zusaetzlich mit Kanonier (Waffen) |
|---|---|---|
| 100% | **57%** | 28% |
| 120% (Hoch, Spitzenwert) | **68%** | 34% |
| 155% (Elite, Spitzenwert) | **88%** | 44% |

Das ist die technische Ursache hinter Session-1-Befund 5: der +35%-Kampf-Booster ist keine
Kaufentscheidung mehr, sondern die **faktische Balance-Grundlage**. Messbar an der Verlustquote -
das Abschalten des Booster verdoppelt sie durchgaengig:

| Sektor | voll | voll ohne Boost |
|---|---|---|
| Niedrig | 1,0% | 1,5% |
| Mittel | 2,0% | 3,6% |
| Hoch | 2,1% | 4,5% |
| Elite | 4,1% | 9,1% |

**Bewertung:** Jede Zahl in `PIRATEN_MULTIPLIER_ROLL`/`ADMIRAL_MULTIPLIER_ROLL`/`RAID_WAVE_ROLL`
bedeutet real etwa die Haelfte dessen, was sie aussagt. Die Kampfbericht-Anzeige
("[Feindstärke 95%]") verstaerkt das Missverstaendnis, weil sie den nominalen Wert zeigt.

**Empfehlung (eine Richtung waehlen):**
- (a) `combatFleetPowerBase()` um Booster/Klasse/Module erweitern, damit die Skalierung wieder das
  misst, was tatsaechlich antritt. Nebenwirkung: Module/Klasse verlieren einen Teil ihres
  spuerbaren Nutzens, weil der Gegner mitwaechst - dafuer bleiben die Prozentwerte ehrlich.
- (b) Die Tabellen so lassen, aber die dokumentierte/angezeigte Bedeutung korrigieren und die
  Werte bewusst auf das neue Niveau anheben (siehe Referenztabelle in Befund 3).
- (c) Session-1-Empfehlung umsetzen (Booster teurer machen) - hilft, loest den strukturellen
  Teil (Module/Klasse) aber nicht.

Empfohlen wird (b) in Kombination mit der Session-1-Massnahme: (a) ist der groessere Eingriff und
entwertet nachtraeglich Investitionen, die Spieler bereits getaetigt haben.

## Befund 2 (HOCH, mechanischer Fehler): Der Piratenadmiral hat faktisch nur EINEN Check

**Dateien:** `game/groupOps.ts` (`runAdminCheck()` Zeile 527), `game/combat.ts` (`runRounds()`,
`UNIT_RETREAT_THRESHOLD` Zeile 1469)

`runAdminCheck()` wertet aus:

```
const playerRetreated = !!result.retreated;
...
if (bossDestroyed)   -> victory
if (playerRetreated) -> defeat (KEINE Belohnung, auch nicht fuer bereits ueberstandene Checks)
sonst                -> Extraktions-Entscheidung, naechster Check
```

Der Kommentar darueber (Zeile 406-410) begruendet das mit *"die eigene Flotte musste sich NICHT
zurueckziehen (siehe RETREAT_THRESHOLD, combat.ts)"*. **Diese Konstante existiert nicht mehr.**
Seit der Umstellung auf den gestaffelten Einzelschiff-Rueckzug (Juli 2026) wird `retreated`
gesetzt, sobald **ein einziges Schiff** unter `UNIT_RETREAT_THRESHOLD = 0.3` seiner Panzerung
faellt und sich absetzt - nicht mehr, wenn die halbe Flotte weg ist. `simulateCombat()` faengt
genau das ab (Zeile 123-128: nur zaehlen, wenn kein voller Sieg vorliegt), `runAdminCheck()` nicht.

Gemessen (je 30 Laeufe, nur Check 1, Eskalation also noch 1,0):

| Fall | Boss vernichtet | `retreated` gesetzt | Boss tot UND `retreated` | oVerlust bei "Niederlage" |
|---|---|---|---|---|
| voll / grosse Flotte | 93% | 83% | 77% | 63,3% |
| voll / kleine Flotte | 100% | 77% | 77% | - |
| mittel / grosse Flotte | 17% | 100% | 17% | 61,3% |
| voll ohne Boost | 40% | 100% | 40% | 64,2% |

Das Flag ist also in 77-100% ALLER Kaempfe gesetzt, auch in den gewonnenen. Da `bossDestroyed`
zuerst geprueft wird, faellt das bei einem Sieg nicht auf - aber jeder Kampf, in dem der Boss
ueberlebt, endet praktisch zwangslaeufig sofort als Niederlage.

Ueber 120 komplette Begegnungen (6 Szenarien x 20) wurde **Check 2 kein einziges Mal erreicht**:

| Szenario | Sieg in Check 1 | Niederlage in Check 1 | Check 2 erreicht |
|---|---|---|---|
| 1 Spieler voll | 85% | 15% | 0/20 |
| 2 Spieler voll | 85% | 15% | 0/20 |
| 2 Spieler voll+mittel | 100% | 0% | 0/20 |
| 1 Spieler voll (kleine Flotte) | 100% | 0% | 0/20 |
| 1 Spieler mittel | 15% | 85% | 0/20 |
| 1 Spieler voll ohne Boost | 35% | 65% | 0/20 |

Rechnerisch aus der Diagnosetabelle bleibt bei "voll" ein Restfenster von ca. **1%** fuer
"Boss ueberlebt UND kein Schiff zieht sich zurueck"; bei "mittel"/"ohne Boost" ist es 0%.

**Konsequenz:** Damit sind komplett wirkungslos: `ADMIRAL_ESCALATION_PER_CHECK` (+15%/Check),
`ADMIRAL_TOTAL_CHECKS = 6`, `ADMIRAL_CHECK_INTERVAL_MS`, die gesamte Extraktions-Entscheidung
(`respondAdminEncounter()`, `adminAwaitingDecision`), `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` und
der eingefrorene `contributedPower` (Befund 8). Das beworbene Kernfeature des Sektors
("Beute sichern und abziehen, oder weitermachen") ist im Spiel nicht erreichbar. Der Sektor ist
ein einzelner Alles-oder-Nichts-Kampf, bei dem eine Niederlage im Schnitt 62% der eingesetzten
Flotte kostet und **null** Belohnung bringt.

**Empfehlung:** `runAdminCheck()` braucht ein eigenes Verlust-Kriterium statt `result.retreated`.
Naheliegend und mit vorhandenen Daten sofort berechenbar: Anteil der tatsaechlich verlorenen
Einheiten ueber `result.survivorsByOwner` gegen die entsandte Stueckzahl, z.B. Niederlage ab 40-50%
Gesamtverlust in einem Check. Dabei gleich pruefen, ob eine Niederlage wirklich auch die bereits
ueberstandenen Checks entwerten soll (aktuell ja, siehe `reward` bleibt 0 bei `outcome === 'defeat'`) -
das ist zusammen mit dem 62%-Flottenverlust eine sehr harte Doppelbestrafung.

## Befund 3 (HOCH): Solo-Sektoren und Elite-Bollwerk sind risikoseitig geloest

**Dateien:** `data/sectors.ts` (`PIRATEN_MULTIPLIER_ROLL`, `npcFloor`), `game/simulator.ts`

96 Laeufe je Zelle, Angaben als **Siegchance / oFlottenverlust**:

| Flotte | Profil | Niedrig | Mittel | Hoch | Elite |
|---|---|---|---|---|---|
| gross | voll | 100% / 1,0% | 100% / 2,0% | 100% / 2,1% | 100% / 4,1% |
| gross | voll ohne Boost | 100% / 1,5% | 100% / 3,6% | 100% / 4,5% | 100% / 9,1% |
| gross | mittel | 100% / 1,5% | 100% / 3,5% | 100% / 3,5% | 100% / 6,1% |
| gross | schwach | 100% / 5,4% | 89% / 12,5% | 91% / 16,8% | 53% / 28,0% |
| klein | voll | 100% / 0,0% | 100% / 0,4% | 100% / 1,5% | 100% / 3,0% |
| klein | mittel | 100% / 0,0% | 100% / 0,1% | 100% / 1,3% | 100% / 4,3% |
| klein | schwach | 100% / 0,4% | 100% / 5,5% | 92% / 13,5% | 46% / 41,4% |

Die im Juli/August muehsam wiederhergestellte Haerte-Reihenfolge **Niedrig < Mittel < Hoch < Elite
ist intakt** - der Punkt "verifizieren, nicht neu suchen" aus der Liste oben ist damit erledigt.
Praktisch relevant ist sie aber nicht mehr: bei Vollausbau trennen Mittel und Hoch **0,1
Prozentpunkte** Verlust. Zusammen mit Session-1-Befund 1 (Mittel und Hoch sind auch wirtschaftlich
gleichwertig, Hoch bringt pro Sieg sogar weniger) hat das Solo-Stufensystem fuer entwickelte
Accounts weder auf der Risiko- noch auf der Belohnungsseite eine Funktion.

Nur das Profil "schwach" (Forschung 3, keine Module, keine Klasse) sieht ueberhaupt Risiko - und
selbst dort gab es in **allen 3.072 Laeufen keinen einzigen Totalverlust**. Das ist strukturell so:
bei `allowRetreat = true` saettigt der Verlust durch den gestaffelten Rueckzug bei ca. 47-48%.
Ein Wipe auf einer Offensiv-Mission ist mechanisch praktisch ausgeschlossen.

Multiplikator-Sweep gegen die grosse Flotte (40 Laeufe je Zelle, `defenseFactor` 0,15), um zu
zeigen, wo die Schwelle ueberhaupt liegt:

| nominale Feindstaerke | voll: Sieg / Verlust | mittel: Sieg / Verlust |
|---|---|---|
| 200% | 100% / 11,3% | 90% / 18,8% |
| 250% | 93% / 16,7% | 80% / 30,2% |
| 300% | 95% / 22,5% | 38% / 43,2% |
| 350% | 88% / 30,7% | 0% / 47,4% |
| 400% | 38% / 44,0% | 0% / 47,5% |

Die aktuelle Obergrenze ueber alle Sektoren ist 155% (Elite). Bis zur ersten spuerbaren Huerde
fehlt also grob **Faktor 2**. Die Kante ist ausserdem sehr scharf (350% -> 400% kippt von 88% auf
38% Siegchance) - das spricht dafuer, die Werte in kleinen Schritten anzuheben und nach jedem
Schritt neu zu simulieren, statt einmal grob zu springen.

**Empfehlung:** Nur EINE Groesse gleichzeitig anfassen. Entweder `PIRATEN_MULTIPLIER_ROLL`
schrittweise Richtung 200-250% (Hoch) bzw. 250-300% (Elite) anheben, ODER zuerst Befund 1 (a)
umsetzen - beides zusammen wuerde die Sektoren sofort unspielbar machen (nominal 250% waeren nach
(a) auch real 250%, was laut Sweep bereits fuer "mittel" 30% Verlust bedeutet).

## Befund 4 (HOCH): Die Raid-Frequenzverdopplung macht Raids zur groessten Einnahmequelle des Spiels

**Dateien:** `data/economy.ts` (`RAID_SCHEDULE_BY_USERNAME`, `RAID_FALLBACK_SCHEDULE`,
`RAID_WAVE_WIN_SILBER/GOLD/ELITE`, `RAID_WAVE_ROLL`), `game/raids.ts` (`resolveOneWave()`)

Damit ist der offene Punkt 1 der Liste oben beantwortet - allerdings anders als erwartet: die Frage
war "verdoppelt sich die Wiederaufbaulast spuerbar?". Die Antwort ist **nein**, und genau das ist
das Problem.

40 komplette Raids (je 12 Wellen), Verluste kumulativ ueber die Wellen, Verteidigung nach jeder
Welle zu 70% repariert (`DEFENSE_REPAIR_PERCENT`):

| Fall | oWellen gewonnen | perfekt 12/12 | oFlottenverlust | oVerteidigungsverlust |
|---|---|---|---|---|
| voll / grosse Flotte + volle Verteidigung | 12,0 | 100% | 10,2% | 0,1% |
| voll ohne Kampf-Booster | 12,0 | 100% | 21,7% | 1,2% |
| mittel / grosse Flotte | 12,0 | 100% | 20,1% | 0,8% |
| voll / kleine Flotte + kleine Verteidigung | 12,0 | 100% | 14,6% | 92,0% |
| schwach / kleine Flotte | 10,6 | 0% | 100,0% | 78,7% |

Die perfekte Abwehr ist fuer jeden halbwegs ausgebauten Account der **Normalfall**, nicht die
Ausnahme. Damit greift `RAID_LOOT_PERCENT` (25% Ressourcendiebstahl bei nicht-perfekter Abwehr)
praktisch nie.

Ursache ist strukturell: `resolveOneWave()` rechnet `combinedPower` **pro Welle neu** aus der
bereits dezimierten Flotte + Verteidigung. Wer Schiffe verliert, bekommt automatisch schwaechere
Folgewellen. Der Raid korrigiert sich selbst nach unten und kann deshalb kaum scheitern - sichtbar
im letzten Fall: 100% Flottenverlust, trotzdem 10,6 von 12 Wellen gewonnen.

**Belohnung** bei 12/12 (Container-EV aus Session 1):

| | pro Raid | pro Woche (Mi+So) | pro Tag |
|---|---|---|---|
| Container | 120 Silber, 72 Gold, 24 Elite | doppelt | - |
| Wert-Einheiten | **22,07 Mrd** | **44,15 Mrd** | **6,31 Mrd** |
| Dunkle Materie (aus den Containern) | 2.083 | **4.166** | **595** |
| Bergungs-DM (`RAID_SALVAGE_DM_MAX`) | 20 | 40 | 6 |

Zum Vergleich aus Session 1: voll ausgebaute Heimatbasis 0,55 Mrd/Tag, Solo-Piraten-Sektor Hoch
1,13 Mrd/Tag, Asteroiden bis 8,5 Mrd/Tag (Frischling-Stapelung). Der Raid liefert **6,31 Mrd/Tag
ohne jede Flottenbindung, ohne Flugzeit, ohne Entscheidung** - er passiert einfach.

**Wichtige Korrektur zu Session-1-Befund 5:** dort ist unter "Einnahmen pro Tag" nur die
Raid-Bergung mit "max. 20 DM pro Raid" gelistet. Die **DM in den 72 Gold- und 24 Elite-Containern
pro Raid fehlt komplett** - das sind 595 DM/Tag und damit der mit Abstand groesste DM-Posten im
Spiel, gegen eine groesste laufende Senke von 103 DM/Tag (alle vier Booster dauerhaft). Der
DM-Ueberschuss ist also nicht "deutlich ueber den Senken", sondern liegt bei etwa **Faktor 7**.
Damit ist auch Befund 1 dieser Session doppelt zementiert: der Kampf-Booster ist trivial
finanzierbar.

**Empfehlung:** Die Frequenzverdopplung wurde offenbar rein als Kalender-Eintrag umgesetzt
(`RAID_SCHEDULE_BY_USERNAME` von einem auf zwei Zeitpunkte), ohne `RAID_WAVE_WIN_*` gegenzurechnen -
die Kommentare dort begruenden 10/6/2 noch mit "nur noch 1x/Woche pruefbar". Konsistent waere,
`RAID_WAVE_WIN_*` zu halbieren (5/3/1), womit die Wochensumme wieder auf dem Stand vor der
Verdopplung liegt und die hoehere Frequenz das liefert, wofuer sie gedacht war: mehr Ereignisse,
nicht mehr Ertrag. Unabhaengig davon sollte die Selbstabschwaechung (`combinedPower` pro Welle neu)
ueberdacht werden - ein Schnappschuss der ersten Welle (analog zu `raid.initialCombinedPower`, das
fuer den Flottenbonus bereits existiert) wuerde Raids ueberhaupt erst verlierbar machen.

## Befund 5 (MITTEL): Die "Perfekte Serie" des Elite-Bollwerks ist der Normalfall, nicht der Ausnahmefall

**Dateien:** `data/sectors.ts` (`piraten_elite`), `data/economy.ts` (`REWARD_ESCALATION`),
`game/groupOps.ts` (`runGroupHourlyCheck()`, `finalizeGroupExpedition()` Zeile 1033)

Damit sind die offenen Punkte 2 und 3 der Liste oben beantwortet. Volle 6-Check-Serie, pro Spieler,
in Wert-Einheiten:

| Check | Eskalation | lootBase-Anteil | winResources (flach) | garantierte Container |
|---|---|---|---|---|
| 1 | x1 | 116,3 Mio | 930,0 Mio | 1.097,2 Mio |
| 2 | x2 | 232,5 Mio | 930,0 Mio | 1.097,2 Mio |
| 3 | x4 | 465,0 Mio | 930,0 Mio | 1.097,2 Mio |
| 4 | x8 | 930,0 Mio | 930,0 Mio | 1.097,2 Mio |
| 5 | x16 | 1.860,0 Mio | 930,0 Mio | 1.097,2 Mio |
| 6 | x32 | 3.720,0 Mio | 930,0 Mio | 1.097,2 Mio |

- Ressourcen ohne Perfekt-Bonus: 12,90 Mrd
- Ressourcen **mit** Perfekt-Bonus (x2 auf die Gesamtausbeute): 25,81 Mrd
- Garantierte Container ueber 6 Checks: 6,58 Mrd + 692 DM
- Kapitaen-Erwartungswert (15% x 6): 213,8 Mio + 45 DM
- **Gesamt pro Spieler pro 24h-Serie: 32,60 Mrd + 737 DM**

Zur Einordnung von Punkt 3 der Liste ("2^6 = 64x - zu extrem?"): der Multiplikator selbst laeuft
nur bis x32 (der Streak-Stand VOR dem Check zaehlt, Check 6 = 5 Vorsiege). Die eigentliche Frage
ist eine andere: **die Serie bricht praktisch nie ab.** Ausloeser fuer den Reset ist
`anyNpcDestroyed === false`, also "kein einziger Gegner vernichtet". Bei einer gemessenen Siegquote
von 100% ueber alle Profile ausser "schwach" (Befund 3) ist die perfekte Serie damit der
Standardausgang - und mit ihr der zusaetzliche `completionMultiplier = 2`. Die Kommentare im Code
behandeln beides noch als Ausnahmefall ("Belohnung dafuer, die volle, sehr harte 24-Stunden-
Expedition ohne einen einzigen Rueckschlag durchzustehen").

Nebenbefund: der `fleetSizeRewardMultiplier()` ist **immer** am Cap. Er erreicht +50% bei
`sentPower / npcFloor >= 100`, also ab 300 Mio Power gegen `npcFloor = 3.000.000` - schon die
kleine Referenzflotte (284 Mio) liegt praktisch dort. Er ist damit kein Anreiz fuer grosse Flotten,
sondern eine konstante +50%-Belohnung. Dasselbe gilt fuer `npcFloor` als Untergrenze: bei 2,72 Mrd
Flottenpower ist er um Faktor 900 unterschritten und ohne jede Wirkung.

**Empfehlung:** Bevor an `lootBase`/`winResources` gedreht wird, zuerst entscheiden, ob die
Perfekt-Serie ein Ausnahme-Bonus bleiben soll. Wenn ja, braucht sie eine echte Abbruchbedingung
(z.B. Reset schon bei einem Check mit ueberlebenden Gegnern statt bei "gar kein Gegner vernichtet").
Wenn nein, gehoert der `completionMultiplier` in die Basiswerte eingerechnet und entfernt - sonst
wird bei jeder kuenftigen Belohnungsanpassung faktisch gegen den doppelten Wert gerechnet (genau
die Lektion aus der Vorsession, siehe "Werkzeuge" oben).

## Befund 6 (MITTEL, ausnutzbar): Ein schwacher Mitspieler macht das Elite-Bollwerk leichter statt schwerer

**Dateien:** `game/combat.ts` (`computePirateResearch()` Zeile 769), `game/groupOps.ts`
(`contributionsFromParticipants()`)

`computePirateResearch()` nimmt seit 05.08.2026 bewusst das **Minimum** aller Teilnehmer-
Forschungsstaende (statt des Durchschnitts) - die Begruendung dort ist richtig und der Fix war
notwendig. Die Nebenwirkung wurde dabei aber nicht mitbedacht: die NPC-Werte haengen an DIESEM
Minimum, waehrend die NPC-**Stueckzahl** an der kombinierten Flottenmacht haengt. Ein Teilnehmer mit
niedriger Forschung senkt also die Staerke jeder einzelnen Gegner-Einheit fuer die GESAMTE Gruppe.

Gemessen (15 Laeufe je Konstellation, Verlust des voll ausgebauten Hauptspielers):

| Konstellation | Sieg | Verlust Hauptspieler |
|---|---|---|
| voll allein | 100% | 2,43% |
| 2x voll | 100% | 3,0% |
| voll + mittel | 100% | 1,8% |
| voll + schwach (grosse Flotte) | 100% | 1,7% |
| voll + schwach (kleine Flotte) | 100% | 0,5% |
| **voll + Mitspieler mit 1 Leichtem Jaeger und Forschung 0** | 100% | **0,13%** |

Der letzte Fall ist der degenerierte Extremfall: ein einzelner Jaeger von einem Account ohne
Forschung senkt den Verlust des Hauptspielers um Faktor **19**. Zusammen mit README-Punkt 5
(Belohnungen werden NIE geteilt, jeder Teilnehmer bekommt die volle Ausschuettung) ergibt sich
daraus die klar dominante Strategie: **immer die maximal moegliche Gruppe mitnehmen, und darin
bevorzugt den am wenigsten entwickelten Spieler.** Dieser bekommt fuer ein einziges Schiff die
vollen 32,60 Mrd + 737 DM aus Befund 5.

Bei zwei aktiven Spielern ist der Schaden aktuell begrenzt, aber es ist eine Zeitbombe fuer jeden
weiteren Account (auch die Bots, siehe `bot.ts`).

**Empfehlung:** Die NPC-Stats sollten an derselben Groesse haengen wie die NPC-Menge. Naheliegend:
Forschungs-Minimum **pro Beitragendem** anwenden statt global - jede NPC-Einheit trifft die
Spielereinheit, gegen die sie schiesst, ohnehin einzeln (`rollHit()` liest bereits die Forschung
des jeweiligen Ziels). Alternativ das Minimum mit dem Machtanteil des jeweiligen Teilnehmers
gewichten, damit ein 1-Schiff-Beitrag das Minimum nicht mehr bestimmen kann.

## Befund 7 (MITTEL): Die P10-Belohnung liegt weit unter allem anderen im Spiel

**Dateien:** `data/combatConstants.ts` (`ADMIRAL_EXTRACTION_*`, `ADMIRAL_VICTORY_*`)

In Wert-Einheiten:

| Ausgang | Wert | DM |
|---|---|---|
| Abzug nach Check 1 | 56,0 Mio | 0 |
| Abzug nach Check 2 | 73,3 Mio | 0 |
| Abzug nach Check 3 | 90,5 Mio | 0 |
| Abzug nach Check 4 | 107,8 Mio | 0 |
| Abzug nach Check 5 | 125,0 Mio | 0 |
| Abzug nach Check 6 | 142,3 Mio | 0 |
| **Sieg ueber den Admiral** | **900,0 Mio** | **200** |

Vergleichswerte: EIN gewonnener Check im Solo-Sektor Hoch bringt 251,6 Mio (Session-1-Befund 1),
ein einzelner Elite-Container 237,6 Mio. Die komplette 6-Check-Extraktion des Boss-Gefechts liegt
also **unter einem einzigen Solo-Check** - und da sie wegen Befund 2 ohnehin unerreichbar ist, ist
der einzige real vorkommende Ausgang der Sieg mit 900,0 Mio.

Pro Zeit gerechnet (Flugzeit mit der Referenzflotte 3,8h hin, Rueckflug wird gar nicht simuliert,
siehe Befund 8): rund 225 Mio/h. Das Elite-Bollwerk liefert mit derselben Flotte ca. 980 Mio/h.
Der Piratenadmiral ist damit bei etwa **Faktor 4 schlechter** - bei deutlich hoeherem Risiko
(15-85% Niederlagequote je nach Ausbau, im Verlustfall im Schnitt 62% Flottenverlust und null
Ertrag).

Einzige echte Staerke ist der DM-Bonus: 200 DM sind laut Sektor-Beschreibung exklusiv. Gemessen an
Befund 4 (595 DM/Tag allein aus Raids) ist aber auch das kein ausreichender Anreiz mehr.

**Empfehlung:** Zuerst Befund 2 fixen - ohne funktionierende Mehrfach-Checks laesst sich die
Belohnungskurve gar nicht sinnvoll bewerten, weil `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` nie greift.
Danach neu messen. Falls die Belohnung dann immer noch nicht traegt: die Extraktionswerte sind der
richtige Hebel (sie tragen die eigentliche Risiko/Ertrag-Entscheidung), nicht die Siegpraemie.

## Befund 8 (NIEDRIG, toter Code und Inkonsistenzen rund um P10)

**Dateien:** `data/combatConstants.ts`, `game/groupOps.ts`, `game/combat.ts`

- **`ADMIRAL_ESCORT_BASE` ist toter Code.** Nirgends importiert (geprueft ueber das gesamte Repo).
  Der Kommentar dort beschreibt eine *"feste Eskorte-Grundzusammensetzung (KEINE Macht-Skalierung
  anhand der Spieler-Flotte, bewusst anders als bei den normalen Piraten-Sektoren)"* - tatsaechlich
  erzeugt `generateAdmiralEncounter()` die Eskorte ueber `generateCappedFleet(escortPower, ...)`,
  also **voll machtskaliert**. Entweder den Code an den Kommentar anpassen oder umgekehrt.
- **`contributedPower` wird eingefroren.** `runAdminCheck()` (Zeile 442) summiert
  `p.contributedPower`, das nur einmal beim Start gesetzt wird (Zeile 285). Die Ueberlebenden
  werden dagegen pro Check zurueckgeschrieben (`p.ships[id] = survived`, Zeile 522). Der
  Elite-Bollwerk-Pfad macht es richtig (`combatFleetPowerBase(p.ships)` frisch pro Check,
  Zeile 745). Ab Check 2 wuerde der Gegner also gegen die START-Flotte skalieren, waehrend die
  reale Flotte bereits geschrumpft ist - zusaetzlich zur +15%-Eskalation. Aktuell folgenlos, weil
  Check 2 nie erreicht wird (Befund 2), aber **genau dieser Fehler wird durch den Fix zu Befund 2
  scharfgeschaltet.** Unbedingt zusammen anfassen.
- **Der Boss selbst skaliert nicht mit Forschung, seine Eskorte schon.** `sideBStatsOverride`
  umgeht `getEffectiveStats()` komplett (bewusst, siehe Kommentar in `combat.worker.ts`), waehrend
  die Eskorte ueber `computePirateResearch()` die volle Spielerforschung bekommt. Mit steigender
  Forschung waechst also die Eskorte, waehrend der namensgebende Boss relativ dazu immer weicher
  wird - das erklaert die 93% Siegquote bei "voll" gegen 17% bei "mittel".
- **Kein Rueckflug.** `finalizeAdminEncounter()` schreibt die ueberlebenden Schiffe direkt in
  `pState.fleet` (Zeile 641-645). Es gibt kein `returnTime` wie bei
  `finalizeGroupExpedition()` - die Flotte ist nach dem Kampf sofort wieder zu Hause, obwohl der
  Hinflug 3,8h gedauert hat.
- **Kein Cooldown, kein Mindestteilnehmer.** Beide "Nur Multiplayer"-Sektoren lassen sich mit
  einem einzigen Teilnehmer erstellen und starten (`createGroupOperation()` prueft nur den
  Sektor und die Schiffstypen). P10 ist zusaetzlich beliebig oft wiederholbar.

## Befund 9 (NIEDRIG): kleinere Beobachtungen

- **Offener Punkt 6 der Liste ("NPC-Verteidigung auch bei P10/Raids gegenchecken") ist gegenstandslos.**
  Weder das Boss-Gefecht (`generateAdmiralEncounter()` nutzt nur `ADMIRAL_ESCORT_POOL`, reine
  Schiffe) noch der Raid (`generateFallbackFleet()`, ebenfalls nur Schiffe) erzeugen ueberhaupt
  NPC-Verteidigungsanlagen. `generateDefenseFleet()` wird ausschliesslich in den Piraten-Sektoren
  und im Simulator aufgerufen - der `SHIELD_REGEN_BASE_BY_CLASS`-Fix von Session 1 kann dort also
  keine weiteren Stellen betreffen.
- **Der Kampf-Modifikator-Deckel wirkt beim Piratenadmiral nicht** - `rollBattleModifier()` wird in
  `runAdminCheck()` gar nicht aufgerufen, P10-Kaempfe haben nie einen Modifikator. Bewusst oder
  vergessen? `BATTLE_MODIFIER_CHANCE` hat auch keinen `piraten_admiral`-Eintrag.
- **`defenseFactor` ist an drei Stellen dupliziert** (`simulator.ts` Zeile 69-73, `groupOps.ts`
  Zeile 775-776, implizit in `missions.ts`) und dabei bereits leicht auseinandergelaufen:
  `piraten_mittel` steht im Simulator auf 0,12, in `groupOps.ts` auf 0,10. Der Simulator sagt damit
  fuer Mittel etwas anderes voraus als der echte Kampf. Gehoert in eine Konstante.
- **Die Kampfbericht-Anzeige "[Feindstärke X%]" ist irrefuehrend** (siehe Befund 1) - sie zeigt den
  nominalen Multiplikator, der real etwa die Haelfte bedeutet. Beim Piratenadmiral zeigt sie
  zusaetzlich nur den gewuerfelten Basiswert OHNE die Eskalation (bewusst, siehe Kommentar
  Zeile 529-532) - was den Ausbau des Spielers ueber die Checks hinweg unsichtbar macht.
- **Solo-Sektor-Verluste sind so niedrig, dass die Werft praktisch keinen Nachschubbedarf deckt.**
  Bei 1-4% Verlust pro 24h-Trip und den Ertraegen aus Session 1 amortisiert sich jede Mission
  vielfach. Der Schiffbau ist dadurch reine Aufbau-, keine Ersatzbeschaffung - relevant fuer
  Session 3, wenn dort Baukosten/Bauzeiten bewertet werden.

## Reihenfolge fuer die Umsetzungs-Session

1. **Zuerst entscheiden** (blockiert die grossen Aenderungen):
   - Bleibt die Skalierung auf Rohwerten (Befund 1b) oder wird sie auf die echten Kampfwerte
     umgestellt (Befund 1a)? Alles Weitere haengt daran, weil sich sonst die Messlatte
     mitverschiebt.
   - Soll die Perfekt-Serie des Elite-Bollwerks ein Ausnahmefall sein (Befund 5)?
   - Soll die Raid-Frequenzverdopplung mehr Ertrag oder nur mehr Ereignisse bringen (Befund 4)?
2. **Ohne Entscheidung sofort machbar:**
   - Befund 2 (P10-Verlustkriterium) **zusammen mit** dem `contributedPower`-Freeze aus Befund 8 -
     der eine Fix aktiviert den anderen Fehler.
   - Befund 8, toter Code/Kommentar-Drift (`ADMIRAL_ESCORT_BASE`, der nicht mehr existierende
     `RETREAT_THRESHOLD`-Verweis in `groupOps.ts` Zeile 407).
   - Befund 9, `defenseFactor`-Duplikat zusammenfuehren (Simulator sagt fuer Mittel derzeit etwas
     anderes voraus als der echte Kampf).
3. **Danach:** Befund 6 (Forschungs-Minimum), unabhaengig von allem anderen, aber mit
   Regressionstest gegen die Ursprungs-Korrektur vom 05.08.2026 (der schwaechere Mitspieler darf
   nicht wieder ueber seinem eigenen Stand kaempfen muessen).
4. **Erst danach** die eigentlichen Zahlen (Befund 3 Multiplikatoren, Befund 7 P10-Belohnung) -
   beide lassen sich vor den Punkten 1-3 nicht sinnvoll kalibrieren.

## Zu beachten bei jeder Kampf-Aenderung

- **Vor der Simulation `tsc` laufen lassen.** Der Kampf-Worker laedt immer aus `dist/`
  (README Punkt 9) - ohne frischen Build misst man den alten Stand.
- **Nie einen Einzellauf bewerten.** Die Streuung ist erheblich: 16 Laeufe je Zelle ergaben im
  Sweep noch eine nicht-monotone Kurve (250% -> 75% Sieg, 300% -> 94%), erst bei 40 Laeufe wurde
  sie sauber. Fuer Entscheidungen mindestens 40 Laeufe je Zelle.
- **`simulateCombat()` deckt nur die Piraten-Sektoren ab** (`cfg.type !== 'piraten'` wird
  abgelehnt, und `PIRATEN_MULTIPLIER_ROLL[sektorId]` existiert fuer `piraten_admiral` gar nicht).
  Fuer P10/Raid/Elite-Bollwerk muss der jeweilige Ablauf gegen `runCombatInWorker()` bzw.
  `runMultiOwnerCombatInWorker()` nachgebaut werden - er ist zusaetzlich Einzelspieler-only und
  bildet den Mehrspieler-Minimum-Effekt aus Befund 6 nicht ab.
- **`result.retreated` bedeutet nicht "verloren"**, sondern "mindestens ein Schiff hat sich
  abgesetzt" (siehe Befund 2). Jede neue Auswertung dieses Flags muss wie `simulateCombat()` den
  Sieg-Fall vorher ausschliessen.
- **Beide Belohnungs-Multiplikatoren gegenrechnen**, bevor an einem Basiswert gedreht wird:
  `getEscalationMultiplier()` UND der `completionMultiplier = 2` aus `finalizeGroupExpedition()` -
  das ist dieselbe Lektion wie in der Vorsession, hier aber zusaetzlich hintereinandergeschaltet.
- **Ressourcen in Wert-Einheiten vergleichen** (`TRADE_VALUE`) und Container-DM nicht vergessen -
  genau dieser Posten fehlte in der Session-1-DM-Bilanz (Befund 4).

---

# Session 3 - Wirtschaft/Ausbau: Analyse-Ergebnis (08.08.2026)

**Status: REINE ANALYSE, KEINE CODEAENDERUNG.** Aufgebaut wie die Session-1/2-Abschnitte oben,
damit eine spaetere Umsetzungs-Session direkt loslegen kann, ohne die Zahlen neu herzuleiten.

Analysierter Stand: Commit `235347c` (Sammel-Commit des hochgeladenen Repos). Wie schon in
Session 2 enthaelt die Git-Historie nur einen einzigen Commit, ein Diff gegen den Session-1/2-Stand
war daher nicht moeglich. Stichproben (`roboterNaniteFactor()` ohne Untergrenze, tote
`lootBase`/`teileCap`-Pfade in den Solo-Sektoren) zeigen den Code unveraendert.

**Zuschnitt dieser Session (weicht bewusst von der Aufteilung ganz oben ab):** die Liste oben
definiert Session 3 als "Schiffe, Verteidigung & Module" inklusive reiner Kampfbalance. Geprueft
wurde hier stattdessen die **Kosten-/Zeit-/Amortisationsseite** des gesamten Ausbaus: Baukosten und
Bauzeiten von Schiffen und Verteidigungsanlagen gegen die tatsaechlichen Einnahmen, Forschungskosten
und -zeiten, Schiffs-/Verteidigungs-/Gebaeude-Modulkosten, Gebaeude-Ausbaukurve, Kampf-Klassen als
Investitionsentscheidung, DM-Haushalt.
NICHT geprueft (bleibt offen fuer Session 4 oder einen Nachtrag): reine Schiff-gegen-Schiff-Balance
(RapidFire-Kette, Tier-Progression, Rollen der einzelnen Schiffsklassen untereinander),
Allianz-Station, Aussenposten, Galaxie-Ereignisse, Piratenbasen, Spionage, Statistik.

## Methodik (fuer Reproduzierbarkeit)

Alle Betraege in **Wert-Einheiten** (`metall*1 + kristall*1.5 + deuterium*3`, entspricht
`TRADE_VALUE`), wie in Session 1/2. Container mit den Session-1-Erwartungswerten (Silber 60,1 Mio /
Gold 127,2 Mio / Elite 237,6 Mio; DM-Anteil Gold 19,4 / Elite 28,6). Teile mit
`TEILE_CONVERT_RESOURCES` = 325.000 Wert je Teil; der Imperator hat keine `cost`, er wird durchgehend
ueber diesen Teile-Gegenwert bewertet (3.000 Teile = 975 Mio).

Skripte und Rohausgaben: `balance/session3-simulation/` (eigene README dort). `lib3.mjs` ist eine
unveraenderte Kopie von `session2-simulation/lib.mjs`, dieselben vier Ausbau-Profile und
Referenzflotten.

**Wichtigster methodischer Unterschied zu Session 2:** `simulateCombat()` betrachtet immer nur EINEN
Check. Fuer die Ertragsrechnung wurden `runHourlyCheck()` (Solo) bzw. der Elite-Bollwerk-Ablauf
zusaetzlich ueber eine KOMPLETTE 24h-Mission repliziert, mit ueber alle Checks mitgeschleppten
Verlusten (`run_mission_breakeven.mjs`, `run_elite_series_net.mjs`, `run_real_fleet.mjs`). Erst
dadurch wird der Netto-Ertrag sichtbar - genau daran haengt Befund 2. Wer kuenftig Belohnungen
bewertet, muss diesen Weg nehmen; ein Einzelcheck unterschaetzt die Verluste um den Faktor der
Checkanzahl.

Stichprobengroessen: 72 Laeufe je Zelle (Gleich-Wert-/Modul-/Forschungsvergleiche), 10 komplette
24h-Missionen je Flottengroesse, 6 bzw. 4 komplette Elite-Serien je Zelle, 8 komplette Raids
(je 12 Wellen) je Verteidigungsstufe.

### Einnahmen-Baseline (korrigiert)

Session 1/2 sind teilweise von einer taeglichen Elite-Serie ausgegangen. Nutzerangabe: das
Elite-Bollwerk wird real **alle 2-4 Tage** gestartet, im Mittel alle 3 Tage. Damit:

| Quelle | Wert/Tag |
|---|---|
| Elite-Bollwerk (32,60 Mrd je Serie, alle 3 Tage) | 10,87 Mrd |
| Raid (Mi+So, 12/12) | 6,31 Mrd |
| Asteroiden (3 Felder, ohne Frischling-Bonus) | 2,83 Mrd |
| Solo-Piraten Hoch (24h) | 1,13 Mrd |
| Heimatbasis V1 voll (36/32/30) | 0,55 Mrd |
| **Summe** | **21,69 Mrd** |
| ohne Elite-Bollwerk | 10,82 Mrd |

DM: 1.088/Tag (Raid-Container 595, Solo-Piraten 151, Elite-Serie 246, Asteroiden 90, Raid-Bergung 6).

**Anmerkung zu einer Ungenauigkeit in Session 1:** in der Tabelle zu Befund 1 dort ist die Spalte
`winResources` (7,1 / 21,8 / 63,0 Mio) bereits mit der erwarteten Anzahl gewonnener Checks
multipliziert, waehrend die Nachbarspalten pro Check gelten. Die Spalte "Summe/Sieg" und die
Tagesertraege sind korrekt; nur diese eine Spalte mischt die Bezugsgroesse. Pro Check betraegt
`winResources` 2,15 / 5,60 / 14,00 Mio.

### Vier Grundsatzentscheidungen des Nutzers (im Rahmen dieser Session getroffen)

1. **Es soll einen Ressourcen-Engpass geben** (siehe Befund 1).
2. **Flottenwachstum soll belohnt werden** - ausdruecklich NICHT ueber geringere Verluste oder
   schwaechere Gegner, sondern ueber hoehere Belohnung; ein Teil der Verluste soll wieder
   hereingeholt werden koennen (siehe Befund 2).
3. **Wrack-Bergung: 30 %** des Wertes der eigenen verlorenen Schiffe kommt zurueck.
4. **Beute proportional zur tatsaechlich vernichteten Feindmacht**, linear ("du pluenderst, was du
   zerstoert hast"). Der Gegenvorschlag eines degressiven Exponenten ist als Alternative
   dokumentiert (Befund 2), Entscheidung dazu beim Gesamt-Durchgang.

## Befund 1 (HOCH): Ressourcen sind kein Engpass - das gesamte Ausbau-Angebot kostet 74 Tage Einnahmen

**Dateien:** `data/buildings.ts`, `data/shipModules.ts`, `data/defenseModules.ts`,
`data/buildingModules.ts`, `data/research.ts`

Alle einmaligen Ressourcen-Senken des Spiels, vollstaendig ausgebaut:

| Senke | Wert |
|---|---|
| Gebaeude V1+V2+V3 bis 36/32/30 inkl. Solar/Fabriken | 1,39 Bio |
| Alle Schiffs-Module Stufe 10 (4 Linien je Typ) | 141,97 Mrd |
| Alle Gebaeude-Module Stufe 10 | 44,38 Mrd |
| Alle Verteidigungs-Module Stufe 10 | 10,87 Mrd |
| Alle limitierten Einheiten am maxCount | 9,01 Mrd |
| Alle 21 Forschungen Stufe 10 | 2,04 Mrd |
| **Summe** | **1,60 Bio** |

Bei 21,69 Mrd/Tag ist damit nach **74 Tagen** alles gekauft (ohne Elite-Bollwerk: 148 Tage). Zum
Vergleich: der Forschungs-Clock laeuft 203 Tage (Befund 5). Die Ressourcen-Wirtschaft ist also rund
2,7x schneller erschoepft als die Zeit-Wirtschaft.

Danach existiert **keine Senke mehr**, die etwas zurueckgibt:
- Minenstufen jenseits der Freischaltschwelle: Metallmine Stufe 40 kostet 127,11 Mrd fuer
  +49,4 Mio/Tag = 2.574 Tage Amortisation, Stufe 45 kostet 1,14 Bio fuer 13.001 Tage.
- Unbegrenzter Schiffbau: liefert keinen Ertrag (Befund 2) und erhoeht ab einer bestimmten
  Groesse sogar die Kosten.
- Kein Lagerkapazitaets-System (Session-1-Befund 7), Ressourcen stapeln unbegrenzt.

**Empfehlung (Entscheidung 1 ist getroffen: Engpass ja):** Der Hebel liegt NICHT bei den Baukosten -
87 % der Senke sind Gebaeude, und die lassen sich nicht um Faktor 3-4 verteuern, ohne die
Ausbaukurve zu zerstoeren (Session-1-Befund 4). Drei Ansaetze, in dieser Reihenfolge:
- (a) **Flottenverluste zur wiederkehrenden Senke machen.** Mit der in Befund 2 empfohlenen
  Mechanik bleiben 70 % jedes Verlusts dauerhaft weg, und zwar skalierend mit der Flottengroesse.
  Das ist die einzige Senke im Spiel, die mit dem Fortschritt mitwaechst statt einmalig zu sein.
- (b) **Raid-Ertrag halbieren** (`RAID_WAVE_WIN_*` 10/6/2 -> 5/3/1, Session-2-Empfehlung):
  -3,16 Mrd/Tag ohne jeden Spielbarkeitsverlust, da 12/12 fuer jeden ausgebauten Account der
  Normalfall ist und der Raid ohne Flottenbindung und ohne Entscheidung passiert.
- (c) Erst danach ueber Kostenerhoehungen nachdenken - vorher misst man gegen die falsche Baseline.

## Befund 2 (HOCH, zentral): Jeder Sektor hat eine Flottengroesse, ab der er sich nicht mehr lohnt

**Dateien:** `game/missions.ts` (`runHourlyCheck()` Zeile 375-377, 572, 589),
`game/combat.ts` (`fleetSizeRewardMultiplier()` Zeile 525), `data/sectors.ts`,
`data/combatConstants.ts` (`FLEET_SIZE_BONUS_CAP`, `FLEET_SIZE_BONUS_RATE`)

Die Belohnung eines Sektors ist fest, die Verluste skalieren mit der Flotte. Komplette
24h-Missionen, Solo-Sektor Hoch, Profil voll, 10 Missionen je Zeile:

| Flottenwert | Siege | Belohnung | Verlust | Netto |
|---|---|---|---|---|
| 2,05 Mrd | 4,5 | 1,13 Mrd | 0,02 Mrd | **+1,12 Mrd** |
| 6,18 Mrd | 4,4 | 1,11 Mrd | 0,16 Mrd | **+0,95 Mrd** |
| 12,35 Mrd | 4,1 | 1,03 Mrd | 0,22 Mrd | **+0,81 Mrd** |
| 22,43 Mrd | 4,6 | 1,16 Mrd | 0,55 Mrd | **+0,60 Mrd** |
| 37,15 Mrd | 3,8 | 0,96 Mrd | 1,15 Mrd | **-0,20 Mrd** |
| 66,33 Mrd | 4,4 | 1,11 Mrd | 3,87 Mrd | **-2,76 Mrd** |

Die Belohnung ist ueber den gesamten Bereich flach. Der reine Kampfausgang bleibt dabei unauffaellig
(100 % Siegquote, 2-6 % Verlust je Check) - das Problem wird erst in der Wert-Bilanz sichtbar,
weshalb es in Session 2 nicht auffiel.

**Technische Ursache:** `fleetSizeRewardMultiplier()` existiert und ist genau fuer diesen Zweck
gebaut. Sie wird in `missions.ts:377` berechnet, aber ausschliesslich auf `teileCap` (Zeile 572) und
`lootBase` (Zeile 589) angewendet - **beide Felder gibt es bei `piraten_niedrig/mittel/hoch` seit dem
Umbau 29.07.2026 nicht mehr** (Session-1-Befund 6). Der Grossflotten-Bonus ist in den Solo-Sektoren
damit vollstaendig tote Logik; `winContainer` und `winResources` werden nur mit `combatWins`
multipliziert. Beim Elite-Bollwerk (`groupOps.ts:749`) wird er angewendet, haengt dort aber an
`npcFloor` (3 Mio) und liegt deshalb immer am +50-%-Deckel (Session-2-Befund 5).

**Gemessen an der realen Flotte des Nutzers** (31.276 Schiffe, 34,99 Mrd Wert, 18,58 Mrd BasePower -
das 5,7-fache der Referenzflotte; Zusammensetzung siehe `run_real_fleet.mjs`):

| Einsatz | Belohnung | Verlust | Netto heute | Netto mit 30 % Bergung |
|---|---|---|---|---|
| Solo Hoch 24h (voll) | 1,11 Mrd | 1,65 Mrd | **-0,55 Mrd** | -0,05 Mrd |
| Solo Hoch 24h (mittel) | 1,11 Mrd | 2,57 Mrd | **-1,47 Mrd** | -0,69 Mrd |
| Elite-Serie (voll) | 32,60 Mrd | 4,73 Mrd | +27,87 Mrd | +29,29 Mrd |
| Elite-Serie (mittel) | 32,60 Mrd | 9,40 Mrd | +23,20 Mrd | +26,02 Mrd |

Die Solo-Piraten-Sektoren sind fuer diese Flotte **bereits jetzt tote Inhalte** - rational fliegt man
sie nicht mehr. Das Elite-Bollwerk hat denselben strukturellen Defekt, nur mit weit hoeherem
Kipppunkt (rechnerisch ~150 Mrd Flottenwert bei Profil voll, ~90 Mrd bei mittel).

**Empfehlung (Entscheidungen 2-4 sind getroffen):**
1. **Wrack-Bergung 30 %** des Wertes der eigenen verlorenen Schiffe als Ressourcen zurueck (analog
   `SCRAP_REFUND_RATE`). Skaliert per Konstruktion exakt mit den Verlusten, kann nie mehr
   zurueckgeben als verloren ging. Alleine reicht sie nicht: sie verschiebt den Kipppunkt nur von
   ~7-facher auf ~9-fache Referenzflotte.
2. **Beute proportional zur tatsaechlich vernichteten Feindmacht** (linear). Weil der Gegner ohnehin
   mit der eigenen Macht skaliert, waechst die Belohnung damit automatisch mit der Flotte, ohne eine
   neue Kurve einzufuehren. Kalibrierung: die reale Flotte vernichtet pro 24h-Mission 83,62 Mrd
   Feindmacht (Basiswerte), die Referenzflotte geschaetzt 12,2 Mrd. Damit die Referenzflotte ihre
   heutige Belohnung behaelt, ergibt sich ein Faktor von **rund 0,091 Wert-Einheiten je Punkt
   vernichteter Feindmacht**. Der Wert fuer die Referenzflotte ist hochgerechnet, nicht gemessen -
   **in der Umsetzungs-Session direkt messen**, bevor er festgeschrieben wird.
3. `fleetSizeRewardMultiplier()` wird durch (2) fachlich ersetzt. Entweder entfernen oder auf
   `winContainer`/`winResources` umhaengen - der jetzige Zustand (Berechnung ohne Wirkung) darf
   nicht bleiben.

**Dokumentierte Alternative zur Linearitaet (Entscheidung offen, fuer den Gesamt-Durchgang):** rein
linear bedeutet, dass der Netto-Ertrag schneller waechst als die Flotte, weil die Verluste der
kleinere Posten sind:

| Flottenwert | Beute linear | Verlust | Netto |
|---|---|---|---|
| 6,18 Mrd | 1,04 Mrd | 0,16 Mrd | +0,88 Mrd |
| 34,99 Mrd | 7,61 Mrd | 1,65 Mrd | +5,96 Mrd |
| 66,33 Mrd | 15,9 Mrd | 3,87 Mrd | +12,1 Mrd |

Zehnfacher Flottenwert -> 13,7-facher Netto-Ertrag, rund 17 % Tagesrendite auf den Flottenwert; eine
reinvestierte Flotte verdoppelt sich damit etwa alle fuenf Tage. Ueber Wochen unproblematisch, ueber
Monate laeuft es weg und arbeitet gegen Befund 1. Alternative: derselbe Mechanismus mit
**Exponent ~0,85** (`Beute = Basis * (vernichtete Feindmacht / Referenz)^0,85`) - fuehlt sich im
Spiel linear an, waechst aber degressiv:

| Flottenwert | Beute (^0,85) | Netto mit 30 % Bergung |
|---|---|---|
| 6,18 Mrd | 1,11 Mrd | +0,99 Mrd |
| 34,99 Mrd | 5,53 Mrd | +4,38 Mrd |
| 66,33 Mrd | 10,9 Mrd | +8,2 Mrd |

**Achtung bei der Umsetzung:** `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr) verdoppelt bereits
`combatWins` und damit die Container-Anzahl (`missions.ts:558`). Jede neue Belohnungs-Skalierung
multipliziert sich darauf - die Kombination vor der Kalibrierung vollstaendig durchrechnen (Lektion
der Vorsession zur Eskalationskurve, hier zum dritten Mal einschlaegig).

## Befund 3 (HOCH): Bei gleichem Ressourceneinsatz unterscheidet sich der Kampfwert der Schiffe um Faktor 7

**Dateien:** `data/ships.ts`, `data/combatConstants.ts` (`MULTI_TARGET_POWER_CORRECTION`)

Je 600 Mio Wert in einem einzigen Schiffstyp, Sektor Hoch, Profil voll, 72 Laeufe je Zeile:

| Typ | Stueck | BasePower | Sieg | Verlust | Wertverlust |
|---|---|---|---|---|---|
| schwer | 2.083 | 508,7 Mio | 100 % | 1,7 % | 10,0 Mio |
| bomber | 377 | 346,1 Mio | 100 % | 1,7 % | 10,0 Mio |
| reaper | 439 | 378,0 Mio | 100 % | 1,7 % | 10,0 Mio |
| leicht | 4.444 | 541,3 Mio | 100 % | 2,3 % | 14,0 Mio |
| schlachtkreuzer | 444 | 317,9 Mio | 100 % | 5,2 % | 31,0 Mio |
| kreuzer | 913 | 451,1 Mio | 100 % | 6,7 % | 40,0 Mio |
| schlachtschiff | 634 | 543,2 Mio | 100 % | 11,3 % | 67,9 Mio |
| zerstoerer | 416 | 374,4 Mio | 97 % | 13,0 % | 77,9 Mio |
| salvenjaeger | 139 | 88,1 Mio | 71 % | 42,5 % | 254,0 Mio |
| salvendreadnought | 18 | 79,8 Mio | 33 % | 70,3 % | 410,2 Mio |
| salvenkreuzer | 47 | 106,5 Mio | 14 % | 93,8 % | 560,1 Mio |

Die Salvenschiffe brechen als reine Einzeltyp-Flotte zusammen: `MULTI_TARGET_POWER_CORRECTION = 8`
laesst sie einen achtfach staerkeren Gegner erzeugen, ihre Panzerung traegt das nicht. **Als
Beimischung in eine gemischte Flotte sind sie dagegen die beste Ergaenzung ueberhaupt** (Grenznutzen
gegen FLEET_SMALL: Salvendreadnought 0,8 %, Salvenjaeger 2,2 %, Salvenkreuzer 2,2 % Verlust gegen
3,5 % bei Leichten Jaegern). Sie sind reine Rollen-Einheiten, keine eigenstaendige Flotte - das steht
nirgends.

Kosten pro Waffenpunkt: Schiffe 67,5 (schlachtschiff) bis 132,5 (bomber), Verteidigung 64,9
(raketenwerfer) bis 144,6 (ultimatekanone), Spezialschiffe 397-623, Sandronator 557.
**README Punkt 17 nennt als Zielkorridor noch "ca. 65, Schiffe liegen bei ~57-90" - das ist
ueberholt.** Entweder den Korridor nachziehen oder die Werte neu ausrichten.

**Empfehlung:** Vor jeder Kostenanpassung an einzelnen Schiffen entscheiden, ob die Kosten die
gemessene Kampfleistung abbilden sollen (dann muessen Schlachtschiff und Zerstoerer deutlich
guenstiger oder besser werden) oder ob die Rollen-Abhaengigkeit bewusst bleibt (dann gehoert sie ins
Info-Popup, analog zur Mehrfachziel-Salve nach README Punkt 24). Die reine Schiff-gegen-Schiff-
Balance dahinter (RapidFire-Kette) wurde in dieser Session NICHT geprueft.

## Befund 4 (HOCH): Verteidigungsanlagen sind die einzige Investition mit klarer Amortisation

**Dateien:** `game/raids.ts` (`resolveOneWave()` Zeile 302-328, `RAID_FLEET_POWER_WEIGHT` 0.7 /
`RAID_DEFENSE_POWER_WEIGHT` 0.3), `data/defenses.ts`, `data/combatConstants.ts`
(`DEFENSE_REPAIR_PERCENT`)

8 komplette Raids (je 12 Wellen) je Zeile, Flotte konstant FLEET_LARGE, nur die
Verteidigungs-Investition variiert:

| Verteidigung | Invest | Wellen gewonnen | perfekt | Verlust Verteidigung | Verlust Flotte |
|---|---|---|---|---|---|
| keine | 0 | 12,0 | 100 % | - | 683 Mio |
| 0,1x | 0,04 Mrd | 12,0 | 100 % | 1 Mio | 477 Mio |
| 0,25x | 0,11 Mrd | 12,0 | 100 % | 2 Mio | 307 Mio |
| 1x | 0,43 Mrd | 12,0 | 100 % | 0 Mio | 127 Mio |
| 3x | 1,06 Mrd | 12,0 | 100 % | 0 Mio | 69 Mio |

12/12 wird **auch voellig ohne Verteidigungsanlagen** erreicht - sie sind fuer den Ausgang nicht
noetig. Ihr Nutzen liegt woanders: 1,06 Mrd Investition senken den Flottenverlust um 614 Mio **pro
Raid**, bei zwei Raids pro Woche ist sie in unter einer Woche zurueckverdient. Nichts anderes im
Spiel hat diese Rendite (Module: 508-806 Tage, Befund 6).

Ursachen: Verteidigung liefert 1,03-1,40 Power je Wert-Einheit gegen 0,53-0,91 bei Schiffen, geht
aber nur mit Gewicht 0,3 in die Wellenskalierung ein (Schiffe 0,7) - effektiver Hebel rund 3,6x.
Dazu kommt `DEFENSE_REPAIR_PERCENT = 0.7` plus der Kuppel-Pool, wodurch die Verteidigung selbst
praktisch nichts verliert (0-2 Mio je Raid).

**Nebenbefund (mechanische Inkonsistenz):** `resolveOneWave()` summiert die Basiswerte in
`raids.ts:319-327` von Hand, **ohne** `MULTI_TARGET_POWER_CORRECTION` - anders als
`combatFleetPowerBase()`. Sentinel-Kanone, Ultimate-Kanone und alle Salvenschiffe zaehlen zu Hause
dadurch nur mit einem Achtel ihrer sonst angesetzten Macht. Wer genau in diese Einheiten investiert,
bekommt also die schwaechsten Wellen bei der staerksten Abwehr. Entweder die Korrektur auch hier
anwenden oder bewusst dokumentieren.

## Befund 5 (HOCH): Forschung ist der einzige echte Engpass - und 60 % ihrer Laufzeit ist wirkungslos

**Dateien:** `data/research.ts` (`costGrowth` 1.8, `timeGrowth` 1.6), `game/actions.ts`
(`researchTimeMultiplier()` Zeile 161, `researchCostForLevel()`/`researchTimeForLevel()` Zeile 771-782)

- **Kosten aller 21 Forschungen auf Stufe 10: 2,04 Mrd** = etwa zwei Stunden Einnahmen. Die
  teuerste Einzelstufe im ganzen Baum (Hyperraumantrieb Stufe 10) kostet 57,0 Mio - 0,26 % eines
  Tagesertrags. Forschungskosten sind faktisch kein Faktor.
- **Zeit dagegen: 2.315 Tage seriell roh, 810 Tage mit dauerhaftem Forschungstempo-Booster, 203 Tage
  bei idealer Auslastung aller 4 Slots.** Nur die 9 Kampfforschungen: 320 Tage seriell, 80 Tage bei
  4 Slots.
- `researchTimeMultiplier()` kennt ausschliesslich den Booster (0,35) und das Samstags-Event (0,75).
  **Keine Forschung verkuerzt Forschung** - anders als bei Bauzeiten gibt es hier keinen
  Selbstverstaerkungspfad, nur DM.

Wirkung, isoliert gemessen (Module 0, keine Klasse, kein Kampf-Booster, FLEET_LARGE):

| Forschungsstufe | Hoch: Sieg / Verlust | Elite: Sieg / Verlust |
|---|---|---|
| 0 | 0 % / 39,83 % | 0 % / 46,67 % |
| 2 | 24 % / 37,67 % | 0 % / 45,00 % |
| 4 | 56 % / 27,00 % | 6 % / 39,17 % |
| 6 | 81 % / 21,50 % | 33 % / 35,67 % |
| 8 | 86 % / 19,67 % | 43 % / 32,17 % |
| 10 | 86 % / 20,17 % | 47 % / 31,33 % |

Die Kurve saettigt bei Stufe 8; der Sprung 8->10 liegt im Rauschen. Wegen `timeGrowth = 1.6` machen
die Stufen 9 und 10 aber **61,5 %** der Gesamtzeit eines Zweigs aus ((1,6^8-1)/(1,6^10-1) = 0,385).
Mehr als die Haelfte des gesamten Forschungs-Clocks ist damit reine Wartezeit ohne messbaren Effekt.

**Empfehlung:** `timeGrowth` senken (1,6 -> ca. 1,4 halbiert die Endstufen-Zeit), ODER die
Effektkurve nach oben strecken, damit die Stufen 9/10 ueberhaupt etwas liefern, ODER die Endstufen
streichen. Nichts davon beruehrt die Kosten - die sind an dieser Stelle irrelevant und koennten
umgekehrt problemlos angehoben werden, falls Befund 1 zusaetzliche Senken braucht.

## Befund 6 (MITTEL): DM-Hebel schlagen Ressourcen-Hebel um Groessenordnungen

**Dateien:** `data/economy.ts` (`BOOSTERS`, `BOOSTER_DURATION_OPTIONS`), `data/classes.ts`,
`data/shipModules.ts`, `data/defenseModules.ts`

Einzelhebel bei Forschung 10 / Module 0, FLEET_LARGE, 72 Laeufe je Zeile:

| Hebel | Kosten | Hoch: Sieg / Verlust | Elite: Sieg / Verlust |
|---|---|---|---|
| nichts | - | 86 % / 18,33 % | 40 % / 34,50 % |
| + Kampf-Booster | 37 DM/Tag | 99 % / 8,67 % | 95 % / 17,83 % |
| + Kanonier | 500 DM einmalig | 100 % / 7,83 % | 96 % / 14,17 % |
| + Kommandant | 500 DM einmalig | 99 % / 9,83 % | 88 % / 17,83 % |
| + Bollwerk | 500 DM einmalig | 93 % / 12,50 % | 67 % / 21,50 % |
| + Module Stufe 10 | ~99,6 Mrd Ressourcen | 95 % / 11,17 % | 95 % / 17,00 % |

**Ein einmaliger 500-DM-Klassenwechsel schlaegt den kompletten Modulbaum.** Der DM-Haushalt traegt
das muehelos: 1.088 DM/Tag Einnahmen gegen 103 DM/Tag groesste laufende Senke (alle vier Booster im
30-Tage-Tarif) = Faktor 10,5.

Modul-Amortisation ueber eingesparte Flottenverluste (Modulsatz fuer alle Typen der Referenzflotte:
99,57 Mrd): Sektor Hoch 4,17 % -> 2,17 % Verlust = 123,6 Mio je 24h-Trip = **806 Tage**;
Elite 7,00 % -> 3,83 % = 195,9 Mio = **508 Tage**.

Modul-Break-even gegen "einfach mehr Schiffe bauen" ist eine **Konstante von 4.367 Einheiten** je Typ
(2.911 bei Kuppeln, die kein Waffen-Modul haben) - unabhaengig vom Schiffstyp, weil sich
`MODULE_COST_MULTIPLIER = 8`, `costGrowth = 1.35`, `maxLevel = 10` und 3 %/Stufe zu einem festen
Verhaeltnis kuerzen. Fuer jede Einheit mit `maxCount` (Salvenschiffe 30-150, Ultimate-Kanone 60,
Imperator 6) ist dieser Break-even per Definition unerreichbar.

Dem steht ein Argument gegenueber, das im Code nirgends steht: **Module erhoehen die Gegnerskalierung
nicht** (Session-2-Befund 1 - `combatFleetPowerBase()` sieht weder Module noch Klasse noch Booster).
Das ist ihr eigentlicher Wert und der Grund, warum sie trotz der Zahlen oben nicht wertlos sind.

**Empfehlung:** Wenn Module eine sinnvolle Investition sein sollen, muessen entweder die Kosten
deutlich sinken (Groessenordnung Faktor 3-5) oder ihr Effekt pro Stufe steigen. Die Alternative ist,
sie bewusst als Endgame-Prestige zu fuehren und das zu dokumentieren. In jedem Fall gehoert die
Kombination "DM-Hebel gegen Ressourcen-Hebel" mit Befund 1 zusammen entschieden - solange DM im
Ueberfluss vorhanden ist, ist jede Ressourcen-Investition die schlechtere Wahl.

## Befund 7 (MITTEL): Bauzeit ist bei Schiffen/Verteidigung keine Schranke

**Dateien:** `game/actions.ts` (`bauzeitMultiplier()`, `defenseBauzeitMultiplier()`,
`roboterNaniteFactor()`), Spiegel in `client/src/lib/multipliers.ts`

Multiplikator-Kette (Profil voll: Bauzeit-Forschung 10, Bauzeit-Schiffe 10, Roboterfabrik 20,
Nanitenfabrik 12, Bautempo-Booster, Ingenieur):
`0,5 x 0,7 x 0,35 x 0,85 x 0,642 = 6,68e-2`, mit Samstags-Event 5,01e-2.

Ausgabe-Kapazitaet bei 3 Bau-Lanes:

| Profil | Multiplikator | Leichte Jaeger | Kreuzer | Reaper |
|---|---|---|---|---|
| voll | 6,68e-2 | 43,7 Mrd Wert/Tag | 26,6 Mrd | 36,8 Mrd |
| mittel | 1,70e-1 | 51,4 Mrd | 31,3 Mrd | 14,4 Mrd |
| frueh (alles 0) | 1,00 | 8,75 Mrd | 5,32 Mrd | 2,46 Mrd |

Selbst voellig ohne jede Bauzeit-Investition liegt die Kapazitaet ueber den Tageseinnahmen ohne
Elite-Bollwerk (10,82 Mrd). Der Engpass ist immer der Ressourcenbestand, nie die Werft.

Darauf zielen trotzdem: vier Forschungszweige (`bauzeit` 105,9 d + `bauzeit_schiffe`/
`bauzeit_verteidigung`/`bauzeit_gebaeude` je 113,5 d = **446 Tage Forschungszeit**), sechs
Zeit-Gutscheine (150/300 DM), das Samstags-Bauzeit-Event und die komplette Ingenieur-Klasse.

Fuer Gebaeude ist es noch extremer und bestaetigt Session-1-Befund 3 mit hoeheren Fabrikstufen:
Multiplikator **8,06e-8**, mit dem Automatisierungs-Modul 5,64e-8.

**Empfehlung:** Bauzeit als Balance-Groesse entweder ernst nehmen (Untergrenze fuer Gebaeude nach
Session-1-Befund 3, und die Schiffs-Bauzeiten so anheben, dass sie bei grossen Stueckzahlen wieder
spuerbar werden) oder die darauf zielenden Systeme zusammenstreichen. Der jetzige Zustand kostet
Forschungszeit, Shop-Platz und eine Klassen-Faehigkeit fuer einen Effekt, den niemand spuert.

## Befund 8 (MITTEL): Die drei Kampf-Klassen sind nicht gleichwertig

**Dateien:** `data/classes.ts`

Verlust bei Forschung 10 / Module 0 (aus Befund 6): Kanonier 7,83 % (Hoch) / 14,17 % (Elite),
Kommandant 9,83 / 17,83, Bollwerk 12,50 / 21,50.

Bollwerks wirtschaftlicher Ausgleich verpufft, weil er in der Kategorie ohne Verluste landet:
- `CLASS_BOLLWERK_DEFENSE_COST_MULTIPLIER = 0.75` auf eine typische Verteidigungs-Investition von
  1,06 Mrd = 265 Mio, einmalig.
- `CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT = 0.9` statt 0,7 - bei 0-2 Mio Verteidigungsverlust je Raid
  (Befund 4) sind das unter 1 Mio je Raid.

Kanonier liefert dagegen 4,7 Prozentpunkte weniger Flottenverlust bei **jedem** 24h-Einsatz, bei der
Referenzflotte rund 290 Mio pro Tag, dazu -10 % Schiffs-Baukosten auf die groessere der beiden
Kostenkategorien.

**Empfehlung:** Bollwerks Ausgleich muss dorthin, wo Verluste tatsaechlich entstehen (eigene Flotte),
nicht in die Verteidigung. Zum Beispiel: der Bollwerk-Reparaturbonus greift auch fuer die eigene
Flotte nach Missionen, oder die Wrack-Bergung aus Befund 2 faellt fuer Bollwerk hoeher aus. Erst
danach die Prozentwerte feinjustieren - die reine Werte-Anhebung wuerde nur den Kanonier-Vorsprung
nachbauen.

## Befund 9 (MITTEL): Gebaeude sind 87 % der Ressourcen-Senke und liefern 6 % der Einnahmen

**Dateien:** `data/buildings.ts`, `data/buildingModules.ts`, `game/actions.ts`
(`mineOutputPerHour()`, `roboterNaniteFactor()`)

| Stufe | Invest bis 36/32/30 + Solar 38 | Ertrag/Tag | Amortisation |
|---|---|---|---|
| V1 | 197,97 Mrd | 554,4 Mio | 357 Tage |
| V2 (zusaetzlich) | 395,94 Mrd | +831,6 Mio | 476 Tage |
| V3 (zusaetzlich) | 791,87 Mrd | +1,39 Mrd | 571 Tage |
| **alle drei** | **1,39 Bio** | **2,78 Mrd** | **499 Tage** |

Bei 21,69 Mrd/Tag Gesamteinnahmen liefern alle drei vollstaendig ausgebauten Stufen zusammen
**6,4 % der Einnahmen** - fuer 87 % aller Ressourcen-Senken des Spiels. Die Amortisation
**verschlechtert** sich mit jeder neu freigeschalteten Stufe (357 -> 476 -> 571 Tage), obwohl V2/V3
als Fortschritt praesentiert werden. Die Multiplikatoren (V2: 2x Kosten / 1,5x Ertrag, V3: 4x Kosten
/ 2,5x Ertrag) sind genau die Ursache.

**Zusaetzlicher Fund:** `BUILDING_MODULES` referenziert ausschliesslich V1-IDs (`metallmine`,
`kristallmine`, ...). `mineOutputPerHour()` und `roboterNaniteFactor()` bilden fuer Tier 2/3 zwar
IDs wie `v2_metallmine_foerdereffizienz` - die existieren aber nicht, `moduleBoostFactor()` liefert
still 1 zurueck. **V2- und V3-Gebaeude haben dauerhaft keine Foerdereffizienz-, Energiespar- und
Automatisierungsmodule.** Kein Fehler zur Laufzeit, aber eine Luecke: die 15 Gebaeude-Module
(44,38 Mrd Vollausbau) wirken nur auf die schwaechste der drei Stufen.

**Empfehlung:** Zusammen mit Session-1-Befund 4 entscheiden. Wenn Minen ein eigenstaendiger
Wirtschaftszweig sein sollen, muessen die V2/V3-Ertragsmultiplikatoren ueber den Kostenmultiplikatoren
liegen (heute 1,5 gegen 2,0 bzw. 2,5 gegen 4,0) und die Module fuer V2/V3 nachgezogen werden. Wenn
Minen eine Beute-Senke bleiben (Session-1-Befund 4a), ist die Kurve in Ordnung - dann sollte aber im
Spiel klar sein, dass V2/V3 ein Prestige-Ziel und keine Investition sind.

## Befund 10 (NIEDRIG): kleinere Beobachtungen

- **Der Imperator ist rechnerisch die schlechteste Einheit im Spiel.** Ueber den Teile-Gegenwert
  bewertet (3.000 Teile x 325.000 = 975 Mio) liefert er 0,0040 Power je Wert-Einheit gegen 0,90 beim
  Leichten Jaeger - Faktor 225. Sein Wert liegt ausschliesslich in RapidFire und Zaehigkeit, nicht in
  der Power. Das ist vermutlich gewollt (Prestige-Einheit), sollte aber bewusst so entschieden sein,
  bevor an den Teile-Kosten gedreht wird.
- **`MAX_PLAYER_SHIPS = 100.000`** wirkt genau gegen die kosteneffizienteste Strategie (viele
  guenstige Schiffe). Bei Leichten Jaegern entspricht der Deckel 13,5 Bio Wert und greift damit
  praktisch nie - er ist aber die einzige Bremse, die ueberhaupt existiert.
- **Der Kampf-Booster ist im Kostenvergleich der zweitstaerkste Einzelhebel des Spiels** (Befund 6).
  Session-1-Befund 5 und Session-2-Befund 1 sind damit auch aus der Kostenperspektive bestaetigt:
  37 DM/Tag ersetzen rund 100 Mrd Modulkosten.
- **Der Wrack-Bergungs-Mechanismus aus Befund 2 existiert im Ansatz bereits** als
  `RAID_SALVAGE_DM_PER_KILL`/`RAID_SALVAGE_DM_MAX` (Bergung nach Raids, aber in DM und gedeckelt bei
  20). Bei der Umsetzung pruefen, ob beide zusammengefuehrt werden koennen, statt zwei getrennte
  Bergungssysteme zu fuehren.
- **Verteidigungs-Module sind mit 10,87 Mrd fuer den kompletten Baum die guenstigste Modul-Kategorie**
  (Schiffs-Module 141,97 Mrd) - und sie wirken auf die Kategorie mit der besten Rendite (Befund 4).
  Falls Module ueberhaupt attraktiv gemacht werden sollen, ist das die Stelle mit dem besten
  Verhaeltnis.

## Reihenfolge fuer die Umsetzungs-Session

1. **Zuerst umsetzen (Entscheidungen liegen vor, blockiert alles Weitere):**
   - Befund 2: Wrack-Bergung 30 % + Beute proportional zur vernichteten Feindmacht. Dabei
     `fleetSizeRewardMultiplier()` aufloesen (heute Berechnung ohne Wirkung) und die Kalibrierung
     der Referenz-Feindmacht **messen statt hochrechnen**.
   - Offen bleibt nur: linear oder Exponent 0,85 (Tabellen in Befund 2).
2. **Direkt danach, weil es an Befund 2 haengt:** Befund 1 (b), Raid-Ertrag halbieren - sonst
   verschiebt die neue Beute-Skalierung die Einnahmen weiter nach oben, bevor eine Senke greift.
3. **Ohne weitere Entscheidung sofort machbar:**
   - Befund 4, Nebenbefund: `MULTI_TARGET_POWER_CORRECTION` in `resolveOneWave()` nachziehen.
   - Befund 9: Gebaeude-Module fuer V2/V3 ergaenzen (oder die IDs bewusst dokumentieren).
   - Befund 3: README Punkt 17 (Kosten/Waffenpunkt-Korridor) an die tatsaechlichen Werte anpassen.
4. **Danach die Zahlen-Feinjustierung:** Befund 5 (Forschungs-`timeGrowth`), Befund 6 (Modulkosten
   gegen DM-Hebel), Befund 8 (Bollwerk-Ausgleich), Befund 7 (Bauzeit-Systeme). Alle vier lassen sich
   vor den Punkten 1-2 nicht sinnvoll kalibrieren, weil sich die Ertragsbasis mitverschiebt.

## Zu beachten bei jeder Wirtschafts-/Ausbau-Aenderung

- **Ertraege NIE an einem Einzelcheck bewerten.** `simulateCombat()` zeigt nur einen Check; die
  Verluste einer kompletten 24h-Mission liegen um den Faktor der Checkanzahl hoeher. Der gesamte
  Befund 2 wurde in Session 2 genau deshalb uebersehen.
- **Immer die Wert-Bilanz rechnen, nicht die Verlustquote.** 2 % Verlust sind bei 6 Mrd Flottenwert
  belanglos und bei 66 Mrd toedlich - die Prozentzahl allein sagt nichts.
- **Vor jeder Simulation `npx tsc`** im Server ausfuehren, der Kampf-Worker laedt aus `dist/`
  (README Punkt 9).
- **Drei Multiplikatoren hintereinander pruefen**, bevor an einem Basiswert gedreht wird:
  `getEscalationMultiplier()`, `completionMultiplier = 2` (Elite) und
  `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr, verdoppelt `combatWins` und damit die Container-Anzahl).
- **Client-Spiegel nicht vergessen:** `client/src/lib/multipliers.ts` spiegelt Bauzeit-, Klassen- und
  Booster-Multiplikatoren 1:1 (README Punkt 1).
- **Module, Klasse und Booster erscheinen NICHT in `combatFleetPowerBase()`** (Session-2-Befund 1) -
  jede Aussage ueber ihren Nutzen muss das mitdenken, sonst wird ihr Wert systematisch unterschaetzt.
