# Session-4-Simulationen (Multiplayer & Rest, 08.08.2026)

Reine Analyse-Skripte, KEIN Teil des Spiel-Codes. Liegen bewusst ausserhalb von `server/src`,
damit sie nicht mitkompiliert werden. Aufbau analog `balance/session2-simulation/`.

## Ausfuehren

```
cd server && npm install && npx tsc -p tsconfig.json   # Worker laeuft aus dist/, siehe README
cd ../balance/session4-simulation
node run_station.mjs               # Allianz-Station: Kosten/Ertrag/Bauzeit, reine Arithmetik
node run_ships.mjs 4               # Schiffsbalance: Tier-Progression, RF-Kette, Duelle bei gleichem Wert
node run_admiral.mjs 6             # Piratenadmiral: komplette 6-Check-Serien, Eskalation, Extraktion
node run_pirate_base.mjs kontext   # Piratenbasen: Bezugsgroessen, Beute-Kurve, Abnahmeband
node run_pirate_base.mjs kandidat D real 40   # Piratenbasen: eine Sweep-Zelle (Entscheidung 5)
node run_pirate_base.mjs serie real 5 40      # Piratenbasen: Farm-Serie gegen dieselbe Basis
node run_elite_coop.mjs voll 40 gross         # Elite-Bollwerk: dieselbe Flotte solo gegen zu zweit
node run_admiral_rebalance.mjs 5  # P10-Neubalancierung: Boss-Anteil, Verlustkriterium, Beute-Koeffizient
node run_aggregate_threshold.mjs 6  # Overkill-Schutz an der Aggregations-Schwelle (Regressionstest)
node run_loot_exponent.mjs 40      # Beute-Exponent (Entscheidung 1): drei Ausbaustaende, vier Exponenten
```

`lib4.mjs` ist eine unveraenderte Kopie von `../session2-simulation/lib.mjs` (Pfade zu
`server/dist`, die vier Ausbau-Profile, die Referenzflotten). Bewusst kopiert statt importiert,
damit die Skripte frueherer Sessions reproduzierbar bleiben.

Die `.txt`-Dateien sind die Rohausgaben, aus denen die Tabellen im Session-4-Abschnitt von
`FINALE_BALANCE_CHECKLIST.md` stammen.

## Methodische Besonderheiten dieser Session

- **Duelle bei gleichem Wert** (`run_ships.mjs`) laufen bewusst mit Forschung 0, ohne Booster,
  Klasse und Module und mit `allowRetreat: false` - damit misst die Matrix die reine
  Schiff-gegen-Schiff-Relation der Basiswerte, nicht den Ausbaustand eines Spielers.
- **Piratenbasen** (`run_pirate_base.mjs`) - VOLLSTAENDIG NEU GESCHRIEBEN AM 18.08.2026
  (Entscheidung 5). Hier stand zuvor: feste Garnison, kein Multiplikator-Wurf, absolute
  Flottengroesse entscheidend, Konstanten im Skript gespiegelt. **Alles davon gilt nicht mehr.** Die
  Garnison skaliert jetzt mit der angreifenden Flotte (`PIRATE_BASE_MULTIPLIER_ROLL`), und die
  Konstanten stehen in `data/economy.ts`, der Rechenteil in `game/pirateBaseCombat.ts` - beides ohne
  Datenbank-Bezug und direkt importiert. **Es wird nichts mehr gespiegelt**, genau das war der
  Anlass. Drei Modi: `kontext`, `kandidat`, `serie` (siehe Kopf der Datei).
- **Elite-Bollwerk solo gegen gemeinsam** (`run_elite_coop.mjs`, 18.08.2026) misst dieselbe Flotte
  mit einem und mit zwei Teilnehmern ueber die volle 6-Check-Serie, Verluste in WERT statt
  Stueckzahlen, und rechnet die drei moeglichen Bezugsgroessen der Beute-Kurve (Entscheidung 2)
  durch. Ergaenzt `run_elite.mjs`, das nur Mehrspieler-Konstellationen gegeneinander und nur
  Einzel-Checks misst - der Solo-Vergleich fehlte dort.
- **Admiral-Serien** (`run_admiral.mjs`) nutzen ein Verlust-Kriterium (45 % Wertverlust in einem
  Check) statt `result.retreated` - siehe Session-2-Befund 2: mit dem heutigen Code endet praktisch
  jeder Durchlauf schon in Check 1, die Eskalationskurve waere sonst gar nicht messbar.
  `contributedPower` wird wie im echten Ablauf beim Start eingefroren.
- **`run_admiral_rebalance.mjs`** rechnet gegen die Oekonomie NACH den Session-3-Aenderungen
  (Wrack-Bergung 30 %, Beute proportional zur vernichteten Feindmacht) und baut
  `generateAdmiralEncounter()` mit konfigurierbarem `ADMIRAL_STAT_SHARE` nach.
- **`run_aggregate_threshold.mjs`** ist der Regressionstest zu Befund 5: dieselbe Gegnereinheit
  gegen Stapel knapp unter und knapp ueber `STACK_AGGREGATE_THRESHOLD_BY_TYPE`. Bei jeder Aenderung
  an `applyAggregateDamage()` oder an einer Einheit mit sehr hohem Waffenwert erneut laufen lassen.

## Nachtrag 14.08.2026: `run_loot_exponent.mjs`

Misst den Beute-Exponenten aus Entscheidung 1. Zwei Besonderheiten, die bei Aenderungen erhalten
bleiben sollten:

- **Der Exponent wird NICHT in den Spielcode eingebaut.** Die Beute beeinflusst den Kampfverlauf
  innerhalb einer Mission nicht, deshalb genuegt EIN Messlauf je Ausbaustand; alle vier Exponenten
  werden nachtraeglich auf dieselben gemessenen Kampfergebnisse aufgerechnet. Das spart Laufzeit und
  haelt die Exponenten exakt vergleichbar (gleiche Zufallsziehungen).
- **Alle nicht aus dem Code ableitbaren Annahmen stehen gebuendelt oben im Kopf unter SETZUNGEN**
  (Container-Erwartungswerte, Elite-Serienertrag und -Frequenz, Raid-Ertrag je verteidigtem Raid,
  Heimatbasis-Ertrag je Ausbaustand). Der Raid-Wert ist die empfindlichste davon - er stammt aus der
  Korrektur vom 11.08.2026 (4,15 Mrd/Tag je Raid), NICHT aus der Baseline-Tabelle in Abschnitt 1.

Laufzeit rund 90 Sekunden bei 40 Durchlaeufen je Zelle.

## Nachtrag 15.08.2026: das Raid-Paket

Zwei neue Skripte fuer Block A, Schritt 3 (Entscheidung 3 und die drei daran haengenden Punkte).

```
node run_raid_yield.mjs          # M1/M4: Ertragsmodell ueber die Kontenzahl, reine Arithmetik
node run_raid_support.mjs 5      # M2/M3: Mehrspieler-Raid, Beitragsanteile + Gewichtungs-Sweep
```

- **`run_raid_yield.mjs` rechnet die Container-Erwartungswerte AUS DEM CODE**, statt sie wie alle
  frueheren Skripte als Setzung aus Session 1 zu uebernehmen: alle Kategorien mit ihrer
  tatsaechlichen Auszahlungswahrscheinlichkeit (`cat.realChance`, nicht `cat.chance`) plus die
  Jackpot-Mechanik. Ergebnis deckt sich mit den alten Setzungen auf unter 1 %. Zum Vergleich gibt
  es die Rechnung mit aus, die im Kasten bei Entscheidung 3 verwendet wurde - sie liegt um ein
  Drittel darunter, weil sie nur die Kategorie "Ressourcen" zaehlt. **Bei jeder kuenftigen
  Container-Rechnung diesen Weg nehmen, nicht die Setzung.**
- **`run_raid_support.mjs` ist der erste Mehrspieler-Kampflauf ueber `runMultiOwnerCombatInWorker`
  in dieser Sammlung.** Die Beitragsanteile werden aus den besitzer-bewussten Schluesseln
  `${ownerKey}:${typeId}` gelesen (README Punkt 16). An die Contributions duerfen ausschliesslich
  reine Daten uebergeben werden, keine Funktionen - siehe README Punkt 3.
- Beide Sweeps (`RAID_ALLY_POWER_WEIGHT`, Schnappschuss der ersten Welle) sind im Skript
  nachgebaut, NICHT im Spielcode. `server/src` bleibt unveraendert.
- Die entscheidende Konstellation ist **"BOT verteidigt, Spieler verstaerkt"**. Sie fehlte in der
  ersten Fassung und kehrt das Ergebnis um: dort holt der Verstaerker 71,5 % des Beitrags, waehrend
  er im Raid eines gleich starken Spielers nur 4,6 % bekommt. Bei kuenftigen Messungen zu
  Mehrspieler-Belohnungen immer BEIDE Richtungen messen, nicht nur die aus Sicht des grossen
  Accounts.

## Nachtrag 15.08.2026: `run_loot_exponent.mjs` umgebaut

Das Raid-Modell ist nicht mehr ein fester Wert je verteidigtem Raid, sondern ein Szenario:

- eine ZAHL bedeutet weiterhin "Vielfaches des Ist-Zustands" (1 = unveraendert, 0 = ohne Raid),
- der Schluessel `'v6'` bildet die am 15.08.2026 beschlossene Variante 6 ab (Beitragsanteile aus
  `raid_support.txt`, Saettigung `V6_S_MAX` ueber die Tagessumme).

Zwei Dinge, die bei Aenderungen erhalten bleiben sollten:

- **Die Entscheidungstabelle gibt es jetzt zweimal.** Primaer gegen Variante 6 (der Raid ist
  entschieden), darunter die drei alten Hypothesen als Empfindlichkeitspruefung - sonst waere der
  Vergleich mit dem Lauf vom 14.08.2026 nicht mehr moeglich.
- **`V6_SHARE_FOREIGN` ist am SPAETEN Ausbaustand gemessen.** Auf den mittleren Stand angewandt ist
  der Wert eine Obergrenze: ein kleinerer Spieler dominiert einen fremden Raid weniger deutlich.
  Das Skript rechnet damit bewusst zugunsten des Raids, also konservativ.
- Die Konstante `RAID_PER_DEFENDED_PER_DAY` stand bis dahin auf 4,145 Mrd/Tag (aus dem Kasten bei
  Entscheidung 3). Richtig sind **6,31 Mrd/Tag**; die alte Zahl zaehlte nur die Container-Kategorie
  "Ressourcen" mit dem rohen `chance`-Wert.

**Der Anker streut.** Ueber drei Laeufe: 0,0956 / 0,0945 / 0,0939 Wert-Einheiten je Punkt
vernichteter Feindmacht. Rund 2 % aus den Zufallsanteilen der Kaempfe - bei Vergleichen zwischen
Laeufen nicht auf die dritte Nachkommastelle abstellen.

## Nachtrag 15.08.2026: `run_income_level.mjs` (Niveau-Punkt, Abschnitt 7)

```
node run_income_level.mjs 40     # Einnahmen-Niveau gegen die Bau-Kapazitaet, ~5 Minuten
```

Misst die Kennzahl "Tage bis zum naechsten Ausbauschritt" von BEIDEN Seiten - Kosten geteilt durch
Einnahmen (Ressourcen-Seite, wie bisher) UND Kosten geteilt durch verbaubaren Wert pro Tag
(Zeit-Seite, neu). Der tatsaechliche Engpass ist das Maximum aus beiden; bei 3 Lanes ist die
Zeit-Seite heute die kuerzere, also gar kein Engpass.

Drei Dinge, die bei Aenderungen erhalten bleiben sollten:

- **Der Import von `actions.js` laeuft ueber eine KOPIE von `server/dist` im Temp-Verzeichnis.**
  Grund: `actions.js` zieht ueber `db.js` die Datenbank mit hartkodiertem Pfad `server/data/game.db`
  nach (Abschnitt 1b, Vorbedingung V2) - ein direkter Import wuerde die laufende Partie anfassen.
  `node_modules` wird in die Kopie verlinkt, nicht kopiert. Geprueft: nach einem Lauf existiert
  kein `server/data`-Verzeichnis.
- **`bauzeitMultiplier()` wird nicht nachgebaut, sondern aufgerufen.** Die Uhr wird fuer den Aufruf
  auf einen Mittwoch gestellt, sonst faelscht das Samstags-Bauzeit-Event (-25 %) das Ergebnis je
  nach Wochentag des Messlaufs. Beide Werte stehen in Abschnitt 7 der Ausgabe nebeneinander.
- **Der Bau-Ausstoss wird ueber den FLOTTENMIX gerechnet**, nicht ueber einen einzelnen Schiffstyp:
  Wert pro Sekunde = Summe(Anzahl * Kosten) / Summe(Anzahl * Bauzeit). Ein einzelner Typ waere
  irrefuehrend - die Salven-Schiffe liefern pro Sekunde das Acht- bis Zwanzigfache eines Kreuzers,
  sind aber durch `maxCount` gedeckelt.
- **Die Gebaeude-Kostenleiter wird je Gebaeude einzeln ausgegeben.** Eine Summe ueber alle sechs
  V1-Gebaeude wird von der Nanitenfabrik (`costGrowth` 2,0) vollstaendig ueberdeckt und sagt nichts
  ueber die Minen aus - das war in der ersten Fassung der Fall und ist korrigiert.

Gesetzt (nicht aus dem Code ableitbar) sind der Gebaeude-/Forschungs-Ausbaustand je Profil - die
Messprofile in `lib.mjs` enthalten nur Kampfforschung - und der Pro-Kopf-Ertrag der Allianz-Station.
Beides steht oben im Skript unter SETZUNGEN bzw. `BUILD_SETUP`/`LEVELS`.

## Korrektur 15.08.2026 an `run_loot_exponent.mjs`

Zwei Auswertungen am Ende des Skripts uebergaben `true` als Raid-Szenario. `true` ist kein
gueltiger Wert - er wird zu 1 verrechnet und bedeutete damit still **"Raid unveraendert"** statt
Variante 6. Betroffen waren die Nebenzeile "naechste Stufe aller 9 Kampfforschungen" und die
Tabelle "Grosse feste Ausbauziele", beide fielen um rund ein Drittel zu niedrig aus (Schiffs-Module
im mittleren Stand: 5,44 statt 7,16 Tage). Behoben. **`loot_exponent.txt` ist an genau diesen zwei
Tabellen ueberholt, bis das Skript wieder mit 40 Durchlaeufen gelaufen ist** - die
Exponenten-Entscheidung selbst nutzt diese Tabellen nicht und ist nicht betroffen.

## Nachtrag 15.08.2026: Block B, Schritt 4 (Piratenadmiral, Entscheidung 4.1 + 4.2)

```
node run_admiral_defeat.mjs 40      # Verlust-Kriterium + contributedPower, ~60 Sekunden
node run_admiral_rebalance.mjs 40   # Boss-Anteil ueber alle vier Profile, ~140 Sekunden
```

- **`run_admiral_defeat.mjs` misst EINMAL und wertet alle Schwellen nachtraeglich aus.** Die
  Serien laufen ohne Niederlage-Abbruch ueber alle 6 Checks durch; je Check wird die kumulierte
  Verlustquote in Wert UND Stueckzahl protokolliert. Ein Abbruch beendet die Serie nur, er
  veraendert frueher liegende Checks nicht - das Ergebnis ist deshalb exakt identisch zu einem
  echten Abbruch-Lauf, spart aber rund 80 % Laufzeit und haelt die Schwellen exakt vergleichbar
  (gleiche Zufallsziehungen). Dieselbe Idee wie beim Beute-Exponenten.
- **Die Reihenfolge des Spielcodes muss erhalten bleiben: erst Sieg pruefen, dann Niederlage.**
  Sonst meldet ein gewonnener Kampf eine Niederlage (Messregel 9).
- **`run_admiral_rebalance.mjs` laeuft jetzt ueber alle vier Ausbau-Profile**, nicht mehr nur
  `voll`, nutzt das kumulierte Wert-Kriterium aus 4.1 und berechnet die Feindstaerke frisch je
  Check (4.2). Der Boss-Anteil-Sweep ist nach OBEN erweitert (0,75 / 0,90), weil sich gezeigt hat,
  dass ein hoeherer Anteil den Gegner schwaecher macht statt staerker.
- **`WAVE_OUTLIER_CHANCE` hat keinen `piraten_admiral`-Eintrag**, der Ausreisser-Wurf entfaellt
  dort also. Der gleichverteilte Griff in `ADMIRAL_MULTIPLIER_ROLL` in beiden Skripten entspricht
  damit exakt dem Spielcode (`rollMultiplierWithOutlier()` behandelt `piraten_admiral` als
  Sonderfall mit Gleichverteilung statt 50/30/20).
- **Beide Skripte importieren nur `combat`/`combatRunner`/`data`, nicht `actions.js`.** Die
  produktive Datenbank wird damit nicht geoeffnet; geprueft, dass nach einem Lauf kein
  `server/data`-Verzeichnis existiert.
- **Die Skripte bilden EINEN Teilnehmer ueber `runCombatInWorker` ab, nicht die
  Mehrspieler-Variante.** Fuer die Frage nach Verlustquote und Check-Tiefe ist das unerheblich,
  weil der Gegner ohnehin an der Summe der eingesetzten Flottenmacht skaliert - fuer alles, was
  mit Beitragsanteilen zu tun hat (Belohnungsaufteilung in Schritt 5), muss dagegen
  `runMultiOwnerCombatInWorker` verwendet werden, wie in `run_raid_support.mjs`.

**Alle Admiral-Messdateien aelter als der 15.08.2026 sind ungueltig.** `admiral.txt` und
`admiral_check1.txt` stammen vom 08.08.2026, also von vor dem Overkill-Deckel (10.08.) und vor der
Klassen-Neuaustarierung (11.08.). Beide Aenderungen wirken stark und ausgerechnet am
Piratenadmiral am staerksten - die Verlustquoten dort sind um Groessenordnungen zu hoch.
