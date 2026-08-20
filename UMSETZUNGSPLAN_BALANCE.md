# Umsetzungsplan Balance (Stand 09.08.2026)

**Zweck dieser Datei.** `FINALE_BALANCE_CHECKLIST.md` enthaelt die vollstaendige Analyse aus vier
Sessions (Befunde, Messwerte, Methodik). Sie bleibt unveraendert und ist die Beweisgrundlage.
Diese Datei enthaelt die daraus **getroffenen Entscheidungen** und ist die Arbeitsanweisung fuer die
Umsetzungs-Session.

**Status:** **15 Entscheidungen** (Entscheidung 15 neu am 12.08.2026). **Am Spielcode wurde am 10.08.2026 erstmals etwas geaendert** (Nutzerentscheidung,
bewusst ausserhalb der Blockreihenfolge - Begruendung und Umfang siehe Abschnitt 2a
"Vorgezogene Umsetzung"). Alles Uebrige ist unveraendert: **14 Entscheidungen, 12 Reparaturen**
(Stand 09.08.2026, zweite Fassung), Umsetzung steht aus.

**Wer diese Datei liest, kann direkt loslegen.** Zahlen muessen nicht neu hergeleitet werden - sie
stehen in der Checkliste unter dem jeweils genannten Befund.

---

## 0. Zuerst lesen: Korrekturen an der Checkliste

1. **Die Pfadangaben in der Checkliste stimmen nicht.** `balance/session3-simulation/` und
   `balance/session4-simulation/` existieren NICHT. Saemtliche Skripte aller Sessions (2, 3 und 4)
   liegen in **`balance/session2-simulation/`**. Die README in diesem Ordner ist die
   Session-3-README und verweist ebenfalls ins Leere. Beim ersten Zugriff korrigieren oder die
   Ordner nachziehen.
2. **`lib.mjs`, `lib3.mjs` und `lib4.mjs` sind identische Kopien.** Nicht drei Varianten pflegen.
3. Die Git-Historie enthaelt nur einen Sammel-Commit. Ein Diff gegen die in der Checkliste
   genannten Commits (`b4d8181`, `ee863a6`, `235347c`) ist nicht moeglich. Stichproben in allen
   drei Sessions zeigen den Code unveraendert.

---

## 1. Zielbild (die Leitlinie fuer alle Einzelentscheidungen)

Nutzervorgabe: **Das Spiel soll dauerhaft tragen, ohne Endpunkt. Zahlen duerfen immer weiter
wachsen. Verluste sollen spuerbar sein, aber nie zum Totalverlust fuehren.**

Daraus folgt als Leitsatz:

> **Jede Groesse muss auf beiden Seiten mitwachsen: der Gegner mit der Flotte, die Beute mit dem
> vernichteten Gegner, die Verluste ebenso.**

Der Kreislauf, der daraus entsteht und nie endet:

1. Groessere Flotte -> staerkere Gegner (existiert bereits ueber `PIRATEN_MULTIPLIER_ROLL` etc.)
2. Staerkere Gegner -> mehr Beute (beschlossen: Beute proportional zur vernichteten Feindmacht)
3. Staerkere Gegner -> mehr Verluste -> **die einzige mitwachsende Ausgabe des Spiels**

Punkt 3 ist der Kern. Nach der beschlossenen 30-%-Wrack-Bergung bleiben 70 % jedes Verlusts
dauerhaft weg, automatisch skalierend mit der Flottengroesse. Alle festen Listen (Gebaeude, Module,
Forschung) sind damit **Aufbau der ersten Monate**, nicht Inhalt des Spiels.

**Wichtige Praezisierung zum bereits beschlossenen "Ressourcen-Engpass":** Gemeint ist ein
RELATIVER Engpass ("das naechste Ziel kostet mehr, als gerade da ist"), kein absoluter ("es ist zu
wenig da"). Einnahmen duerfen ins Astronomische wachsen, solange die Ziele mitwachsen.

### Bereits zuvor getroffene Grundsatzentscheidungen (nicht neu diskutieren)

- Es soll einen Ressourcen-Engpass geben (im Sinne oben).
- Flottenwachstum wird ueber **hoehere Belohnung** belohnt, ausdruecklich NICHT ueber geringere
  Verluste oder schwaechere Gegner.
- **Wrack-Bergung 30 %** des Wertes der eigenen verlorenen Schiffe.
- **Beute proportional zur tatsaechlich vernichteten Feindmacht.**
- Alle Ertragsrechnungen laufen gegen die Oekonomie NACH diesen Aenderungen.

### Referenzwerte (Einnahmen-Baseline, Stand vor allen Aenderungen)

| Quelle | Wert/Tag |
|---|---|
| Elite-Bollwerk (32,60 Mrd je Serie, real alle 3 Tage) | 10,87 Mrd |
| Raid (Mi+So, 12/12) - EIN verteidigter Raid, real 3,4 (siehe unten) | 6,31 Mrd |
| Asteroiden (3 Felder) | 2,83 Mrd |
| Solo-Piraten Hoch | 1,13 Mrd |
| Heimatbasis V1 voll | 0,55 Mrd |
| **Summe** | **21,69 Mrd** |

**KORREKTUR 15.08.2026 (gemessen, `run_raid_yield.mjs`/`raid_yield.txt`):** Die Raid-Zeile ist
richtig gerechnet, zaehlt aber nur EINEN Raid. Real werden 3,4 verteidigt (zwei namentlich
hinterlegte Spieler mit Chance 1,0, zwei Bots mit `RAID_SPAWN_CHANCE` 0,7), also **21,4 Mrd/Tag**.
Die Summe liegt damit im Ist-Zustand nicht bei 21,69, sondern bei **36,8 Mrd/Tag**, der Raid-Anteil
bei **58 %**. Die im Kasten bei Entscheidung 3 genannten 14,51 Mrd je Raid bzw. 4,15 Mrd/Tag sind
zu NIEDRIG: sie zaehlen nur die Container-Kategorie "Ressourcen", mit dem rohen `chance`-Wert statt
der tatsaechlichen Auszahlungswahrscheinlichkeit `realChance`, ohne Teile, Zeitgutscheine,
Freischiffe und Jackpot. Aus dem Code gerechnet ergibt ein voll gewonnener Raid **22,07 Mrd und
2.080 DM**.

Dunkle Materie: **1.088/Tag** Einnahmen gegen **103/Tag** groesste laufende Senke (Faktor 10,5) -
nach derselben Korrektur real **2.020/Tag**, Faktor 19,6.
Reale Nutzerflotte: 34,99 Mrd Wert, 18,58 Mrd BasePower, 31.276 Schiffe.
Alle Betraege in Wert-Einheiten (`metall*1 + kristall*1,5 + deuterium*3`, entspricht `TRADE_VALUE`).

---

## 1a. RAHMENBEDINGUNG: Server-Reset nach der Umsetzung

**Nutzerentscheidung (09.08.2026): Nach Abschluss aller Aenderungen wird der Server komplett
zurueckgesetzt. Alle Spieler fangen von vorne an.**

Das aendert den Zuschnitt dieses Plans erheblich.

### Was dadurch entfaellt

- **Keine Ruecksicht auf bestehende Spielstaende.** Alle Nachteile in diesem Plan, die mit
  "wirkt rueckwirkend" oder "entwertet bereits getaetigte Investitionen" begruendet sind, sind
  hinfaellig. Betrifft Entscheidung 7 (Minen-Kostenkurve) und Entscheidung 9.2 (Slot-Reduktion).
- **Keine Migrations-Sorgen.** Die automatische Forschungsfeld-Migration in `loadPlayerState()`
  (README Punkt 33) muss zwar korrekt bleiben, wird aber praktisch nicht mehr gebraucht.
- Es kann beherzter eingegriffen werden als urspruenglich geplant.

### Was dadurch NEU dazukommt - der wichtigste Punkt dieses Abschnitts

**Alle Messungen der Sessions 1-4 sind gegen ENTWICKELTE Accounts gelaufen** (reale Flotte
34,99 Mrd Wert, Profil "voll", Forschung 10, Module 10, Klasse, Dauer-Booster). **Nach dem Reset
wird genau die Phase gespielt, die am schlechtesten gemessen ist.** Der gesamte Plan ist auf das
Endspiel geeicht.

Die Einnahmen-Baseline von 21,69 Mrd/Tag ist ein Endspiel-Wert. In Woche 1 liegt sie um
Groessenordnungen darunter. Jede Aussage der Form "X Mrd sind viel/wenig" in diesem Plan gilt
NICHT fuer die Startphase.

**Ein Reset ist einmalig.** Wenn die Startphase daneben liegt, faellt das erst nach Wochen auf.
Deshalb: vor dem Reset die Startphase simulieren, nicht erst danach beobachten.

### Konkrete Startphasen-Risiken (aus den Sessions, bisher als Randnotiz gefuehrt)

| Risiko | Gemessen | Folge nach Reset |
|---|---|---|
| **Raid bei schwachem Ausbau** | **100 % Flottenverlust**, 78,7 % Verteidigungsverlust, 10,6 von 12 Wellen gewonnen | Trifft ab Tag 1. Widerspricht der Vorgabe "nie Totalverlust". **Macht Entscheidung 10 blockierend, nicht optional.** |
| **Piratenbasen bei kleiner Flotte** | **89,6 % Verlust**, 32,2 Mio Beute | Inhalt ist im Startspiel unspielbar. **Macht Entscheidung 5 dringend.** |
| **Frischling-Bonus stapelt multiplikativ** | Mining-Forschung 10 (x2) * `mining_schiffe` * Prospektor (1,2) * Abbau-Booster (1,7) * Di/Do-Event (2,0) * Frischling (3,0) = **bis 24,5x**. Ein 7 Tage alter Account: **8,5 Mrd/Tag allein aus Asteroiden** - mehr als eine voll ausgebaute Heimatbasis | War bisher Randbeobachtung (Session 1, Befund 7). Nach dem Reset ist das die erste Spielwoche. **Siehe Entscheidung 12.** |
| **Elite-Bollwerk bei Profil "schwach"** | 53 % Siegchance / 28 % Verlust (grosse Flotte), 46 % / 41,4 % (kleine Flotte) | Der einzige Inhalt, der im Startspiel ueberhaupt Risiko zeigt. Nach Entscheidung 1 neu messen. |
| **Entscheidung 9 (Zeit als Engpass)** | Im Endspiel richtig kalibriert | In Woche 1 mit 1 Bau-Slot und 1 Forschungs-Slot kann sich das Spiel tot anfuehlen. **Muss gegen die STARTPHASE kalibriert werden, nicht gegen das Endspiel.** |
| **Mining-Schiffe amortisieren in unter 3 Stunden** | 300 Schiffe = 6,2 Mio Wert gegen 55,8 Mio/Tag im Niedrig-Feld; alle drei Felder parallel = 346 Mio/Tag bedingungsloses Grundeinkommen | Nach dem Reset die erste und lange Zeit einzige Einnahmequelle. Bewusst so lassen oder bewusst aendern - nicht unbemerkt lassen. |
| **Startkapital ist hoch** *(neu 10.08.2026, Code-Pruefung)* | `defaultPlayerState()`: 50 Mio Metall / 25 Mio Kristall / 10 Mio Deuterium / 500 DM = rund **117,5 Mio Wert-Einheiten**. Code-Kommentar: bewusst bemessen auf 700 Mining-Schiffe + 1.500 Begleitschiffe | **Stunde 0 nach dem Reset ist kein leerer Zustand**, sondern eine finanzierte Mining-Wirtschaft. Zusammen mit der Zeile darueber heisst das: die Asteroiden-Einnahmen laufen ab dem ersten Tag auf vollem Niveau. **Verschaerft Entscheidung 12 und Abnahmekriterium 5** (keine Einzelquelle ueber 50 % der Wochen-Einnahmen) - das Startkapital fuehrt direkt in genau diese Quelle. Bewusst so lassen oder mit Entscheidung 12 gemeinsam kalibrieren, nicht getrennt. |

### Zwingende Ergaenzung zum Messplan

Zusaetzlich zu allen Messungen in diesem Plan ist **eine komplette Fortschritts-Simulation der
ersten 30 Tage** noetig, die es bisher nicht gibt:

- Startbestand -> Woche 1 -> Woche 2 -> Woche 4, jeweils mit realistisch erreichbarem Ausbaustand.
- Pro Woche pruefen: Welche Inhalte sind ueberhaupt spielbar? Wo entsteht Leerlauf? Wo entsteht
  Frust (Totalverlust, unerreichbare Ziele)?
- Die vier Ausbau-Profile der Sessions ("voll"/"voll ohne Boost"/"mittel"/"schwach") reichen dafuer
  NICHT - sie beschreiben Zustaende, keinen Verlauf. **"schwach" ist Forschung 3, keine Module,
  keine Klasse - das ist bereits mehrere Wochen Spielzeit.** Ein echter Startzustand (Forschung 0,
  nichts gebaut) ist in keiner Session gemessen worden.

**Der Reset erfolgt erst, wenn diese Simulation vorliegt.**

**ENTSCHIEDEN 09.08.2026: Die Simulation wird VORGEZOGEN** - gebaut nach Block C, erstmals
ausgefuehrt VOR Block D, erneut ausgefuehrt in Block F. Grund: Entscheidung 9 muss ohnehin gegen die
Startphase kalibriert werden. Steht die Simulation erst am Ende, wird Block D zweimal kalibriert -
einmal gegen das Endspiel und danach dagegen. Der Bauaufwand faellt so oder so an; die Reihenfolge
entscheidet nur, ob er einmal oder zweimal Nutzen bringt. **Nachteil:** der Reset verschiebt sich um
die Bauzeit der Simulation, und sie muss nach Block D ein zweites Mal laufen, weil sich die Zahlen
bis dahin verschieben. Vollstaendige Spezifikation siehe Abschnitt 1b.

---

## 1b. Spezifikation der 30-Tage-Fortschrittssimulation

Dieser Abschnitt existiert, weil die Simulation das einzige fehlende Werkzeug des gesamten Plans
ist und als einziges ohne vorherige Messung vollstaendig festgelegt werden kann. Sie ist damit auch
das einzige Stueck Arbeit, das eine Umsetzungs-Session sofort beginnen kann.

### Was sie NICHT ist

Kein weiteres Kampf-Skript. Die vorhandenen Skripte in `balance/session2-simulation/` messen
**Zustaende** (vier Ausbau-Profile gegen einen Sektor). Diese Simulation misst einen **Verlauf**:
Tag 0 bis Tag 30, mit allem, was sich dabei gegenseitig bedingt - Ressourcen finanzieren Bauten,
Bauten erhoehen Ressourcen, Flotte schaltet Inhalte frei, Inhalte liefern Beute.

### Aufbau

- **Zeitschritt: 1 Stunde**, 720 Schritte. Groeber verfehlt die stuendlichen Asteroiden-Checks.
  Piraten-Sektoren checken alle 4 h (`PIRATEN_CHECK_INTERVAL_MS`), Missionen laufen einheitlich 24 h
  (`MISSION_DURATION_MS`/`ASTEROID_MISSION_DURATION_MS`) - beides teilt sich sauber in
  Stundenschritte.
  *Korrigiert am 10.08.2026:* hier stand "feiner ist unnoetig, kuerzeste relevante Bauzeit liegt bei
  30 Minuten". Das gilt **nur fuer Gebaeude** (kleinste `baseTimeSeconds` in `buildings.ts` ist
  1.800). **Schiffe und Verteidigung haben Bauzeiten im Sekundenbereich vor dem Multiplikator**
  (Leichter Jaeger `buildTime: 4`), ein Auftrag ist also je nach Stueckzahl in Sekunden bis Minuten
  fertig. Folge fuer die Messung: **der Leerlauf der Bau-Lanes wird bei Stundenaufloesung
  systematisch unterschaetzt** - genau die Kennzahl, an der Abnahmekriterium 2 und die Kalibrierung
  von Entscheidung 9.2 haengen. **Zwingend deshalb: Leerlauf getrennt je Auftragsart erfassen**
  (Gebaeude / Forschung / Schiffe+Verteidigung) und bei Schiffen die tatsaechliche Restlaufzeit des
  Auftrags innerhalb der Stunde mitrechnen, nicht nur "am Stundenende lief etwas". Ein gemeinsamer
  Leerlaufwert ueber alle drei Arten waere hier unbrauchbar.
- **Startzustand: `defaultPlayerState()`**, also Forschung 0, nichts gebaut. **Startressourcen sind
  50 Mio Metall / 25 Mio Kristall / 10 Mio Deuterium / 500 DM** (`state.ts`) - das sind rund
  117,5 Mio Wert-Einheiten und laut Code-Kommentar bewusst auf eine komplette Mining-Flotte (700)
  plus Begleitschutz (1.500) bemessen. **Der Startzustand ist also nicht leer, sondern finanziert
  ab Stunde 0 rund 2.200 Schiffe.** Kein Profil aus den Sessions - "schwach" ist bereits mehrere
  Wochen Spielzeit (siehe Abschnitt 1a). Siehe dazu die Korrektur an Entscheidung 5a.
- **Echte Spiel-Funktionen verwenden**, keine nachgebaute Wirtschaft: `runEconomyTick()`,
  `startBuildingConstruction()`, `startResearch()`, `startBuild()`, `processMissions()`. Sonst misst
  man das Modell statt das Spiel - genau der Fehler, den Messregel 1 fuer den Kampf-Worker
  beschreibt.
  *Korrigiert am 10.08.2026:* hier stand `runHourlyCheck()`. **Diese Funktion ist in `missions.ts`
  nicht exportiert** und aus einem Sim-Skript nicht erreichbar. Der oeffentliche Einstiegspunkt ist
  `processMissions(state)` (async), der den Stunden-Check intern ausloest. Entweder darueber gehen
  oder `runHourlyCheck` exportieren - **nicht nachbauen.** Siehe Messregel 16.
- **Drei Spielerprofile** (getrennte Durchlaeufe, NICHT gemittelt):
  1. **Aktiv** - handelt jede simulierte Stunde, baut ressourcen-optimal.
  2. **Gelegenheit** - handelt zweimal taeglich, sonst laeuft nur die Warteschlange.
  3. **Abwesend** - handelt an Tag 1, danach 14 Tage gar nicht, dann wieder taeglich. Bildet die
     reale Nutzungslage ab (mehrwoechige Abwesenheit, siehe Entscheidung 9.2) und ist der
     eigentliche Test der Warteschlange.
- **Die Bot-Logik aus `economyBotTurn.ts` NICHT als Spielermodell verwenden.** Sie baut
  gleichverteilt ueber alle Typen und ist damit nachweislich nicht spielertypisch (Entscheidung
  13.2). Sie darf nur fuer die BOTS im Durchlauf genutzt werden, nicht fuer den simulierten
  Menschen.

### Technische Vorbedingungen (ergaenzt am 10.08.2026, Code-Pruefung)

Beide Punkte waren im Plan stillschweigend als geloest vorausgesetzt. Sie sind es nicht, und beide
blockieren den Bau der Simulation - sie gehoeren VOR Schritt 13 geklaert, nicht waehrenddessen.

**V1. Die Spielfunktionen lesen die Uhr direkt, es gibt keine einspeisbare Zeitquelle.**
`Date.now()` steht 19x in `actions.ts`, 9x in `state.ts`, 7x in `raids.ts`, 4x in `missions.ts`.
`runEconomyTick()` rechnet sein Delta aus `Date.now() - state.lastUpdate`. **720 Stundenschritte
gegen die Echtzeituhr sind damit unmoeglich** - der reale Ablauf waere 30 Tage.

Zwei Wege:
- **(a) `Date.now` im Sim-Prozess ueberschreiben** (EMPFOHLEN), gesetzt VOR dem ersten Import der
  Spielmodule, danach je Schritt um eine Stunde weiterdrehen. Kein Eingriff in den Produktionscode,
  passt zum bestehenden Muster der `balance/`-Skripte.
  **Bekannte Luecke:** der Kampf-Worker laeuft in einem eigenen Thread mit eigenem Kontext und sieht
  die gefaelschte Uhr NICHT. Fuer die Kampf-Aufloesung selbst ist das unerheblich (sie rechnet in
  Runden, nicht in Uhrzeit) - **vor dem ersten Lauf trotzdem einmal pruefen**, ob im Worker-Pfad
  irgendwo eine Zeitdifferenz gebildet wird.
- **(b) Zeitquelle durch den Produktionscode ziehen.** Sauberer, aber ein Eingriff in `actions.ts`,
  `state.ts`, `raids.ts` und `missions.ts` - genau die Dateien, die Block A bis D ohnehin anfassen.
  Zwei gleichzeitige Umbauten an denselben Stellen. Nicht empfohlen.

**V2. Der Import der Spielfunktionen oeffnet die Live-Datenbank.**
`state.ts` importiert `db.ts`, und `db.ts` fuehrt beim Import `new Database(dbPath)` aus - mit
**hartkodiertem Pfad** `server/data/game.db`, ohne Env-Override. Ein Sim-Skript, das die echten
Wirtschaftsfunktionen importiert, fasst damit die produktive Datenbank an. Die bestehenden
Messskripte umgehen das bewusst: `lib.mjs` baut einen `PlayerState`-Stub und importiert `state.js`
gar nicht erst - dieser Weg steht der 30-Tage-Simulation aber nicht offen, weil sie genau die
Zustandsverwaltung mitmessen soll.
-> **Vor dem Bau entscheiden:** `dbPath` per Umgebungsvariable ueberschreibbar machen (kleiner
Eingriff, hilft auch beim Testen) ODER die Simulation gegen eine Kopie der Datenbank in einem
eigenen Verzeichnis laufen lassen. **Nicht ungeprueft starten** - ein Sim-Lauf schreibt sonst
Spielstaende in die laufende Partie.

### Was pro Tag protokolliert wird

| Kennzahl | Wofuer |
|---|---|
| Einnahmen/Tag in Wert-Einheiten | Verlaufskurve, Vergleich mit der 21,69-Mrd-Baseline |
| Flottenwert und `combatFleetPowerBase()` | Freischaltung von Inhalten, Gegnerskalierung |
| **Leerlaufanteil, GETRENNT je Auftragsart** (Gebaeude / Forschung / Schiffe+Verteidigung) - Anteil der Stunden ohne laufenden Auftrag der jeweiligen Art, bei Schiffen anteilig innerhalb der Stunde | Kernmass fuer Entscheidung 9. Zeitdruck ohne Leerlauf ist Inhalt, Zeitdruck mit Leerlauf ist Frust. *Getrennt seit 10.08.2026:* ein gemeinsamer Wert verdeckt den Schiffs-Leerlauf, weil Gebaeude-Auftraege Tage laufen und Schiffs-Auftraege Sekunden - siehe Korrektur beim Zeitschritt |
| **Ressourcenstau** - Anteil der Stunden, in denen Ressourcen vorhanden sind, aber kein Slot frei | Gegenprobe zu 9.2: zu wenige Lanes erzeugt genau das |
| Erstmals spielbare Inhalte, mit Tag | Woche-fuer-Woche-Fortschritt |
| Verlustereignisse mit Anteil der verlorenen Flotte | Entscheidung 10 (kein Totalverlust) |
| Anteil jeder Einnahmequelle an der Wochensumme | Entscheidung 12 (Frischling-Ueberschuss) |

### Abnahmekriterien (Definition of Done fuer die Startphase)

Der Reset erfolgt erst, wenn **alle sechs** erfuellt sind. Jedes Kriterium nennt die Entscheidung,
die daran kalibriert wird.

1. **Kein Totalverlust.** In keinem der drei Profile verliert der Spieler in 30 Tagen mehr als
   **70 %** seiner Flotte in einem einzelnen Ereignis. -> Entscheidung 10.
2. **Leerlauf unter 20 %** im Profil "Aktiv" und **0 %** im Profil "Abwesend" (die Warteschlange
   muss die Abwesenheit vollstaendig ueberbruecken). -> Entscheidung 9.2.
3. **Ressourcenstau unter 25 %** im Profil "Aktiv". Ueber diesem Wert sind die Lanes zu knapp und
   der Ueberschuss ist nicht ausgebbar. -> Entscheidung 9.2, Gegenprobe zu Kriterium 2.
4. **Jede Woche wird mindestens ein Inhalt erstmals spielbar.** Erwartete Reihenfolge:
   Woche 1 Asteroiden, Woche 2 Solo-Piraten Niedrig, Woche 3 Piratenbasis, Woche 4 Elite-Bollwerk.
   Ein leerer Wochenabschnitt ist ein Fehlschlag, kein Randbefund. -> Entscheidungen 5 und 13.5.
   **Der Raid gehoert ausdruecklich NICHT in diese Liste:** er laeuft an festen WOECHENTLICHEN
   Checkpoints (`RAID_FALLBACK_SCHEDULE` in `economy.ts`: Mittwoch und Sonntag 0 Uhr) mit
   `RAID_SPAWN_CHANCE = 0,7`; fuer namentlich in `RAID_SCHEDULE_BY_USERNAME` hinterlegte Spieler
   mit Chance 1,0. Er trifft damit **ab der ersten Woche**, ob der Spieler dafuer geruestet ist
   oder nicht. Er ist kein freischaltbarer Inhalt, sondern ein Ereignis, das der Spieler von Anfang
   an ueberstehen muss - genau deshalb ist Kriterium 1 auf ihn gemuenzt. Die Simulation muss die
   Wochentage abbilden, nicht eine Tageschance.
   *Korrigiert am 10.08.2026:* hier stand zuvor "feste Serverzeitpunkte, 60 % Chance, ab Tag 1,
   `FIXED_CHECK_HOURS_UTC`". Diese Konstante existiert nicht mehr - der Wert stammte aus einer
   veralteten README-Fassung. Siehe Messregel 16.
5. **Keine Einzelquelle liefert in Woche 1 mehr als 50 % der Wochen-Einnahmen.**
   -> **Entscheidung 3 (Raid-Ertrag) und die Solo-Einnahme der Startphase.**
   > **UMGESTELLT AM 20.08.2026 (Nutzerentscheidung), nachdem die Messung ergab, dass dieses
   > Kriterium auf die falsche Quelle zeigte** (`run_novice_bonus.mjs` / `novice_bonus.txt`,
   > Befunde 5, 7, 8). Hier stand bisher "-> Entscheidung 12 (heute waeren es die Asteroiden mit
   > dem 24,5-fach gestapelten Bonus)".
   >
   > **Die Schwelle von 50 % bleibt unveraendert. Geaendert hat sich nur, WORAUF das Kriterium
   > zeigt.** Gemessene Zusammensetzung der Woche 1 (46,0 Mrd gesamt): Raid 26,5 Mrd (58 %),
   > Asteroiden 18,1 Mrd (39 %), Solo 1,2 Mrd (3 %), Heimatbasis 0,2 Mrd. Der Raid zahlt
   > 1,84 Mrd Wert je gewonnener Welle, flach und unabhaengig von der eigenen Staerke, zweimal
   > woechentlich - bei 12/12 Wellen 22,07 Mrd.
   >
   > **Warum die alte Zuordnung nicht nur ungenau, sondern gegenlaeufig war:** jede Kuerzung des
   > Frischling-Bonus HEBT den Raid-Anteil (auf 78 % bei abgeschaltetem Bonus). Das Kriterium
   > haette in seiner alten Fassung einen moeglichst GROSSEN Frischling-Bonus verlangt - genau das
   > Gegenteil dessen, wofuer es gedacht war.
   >
   > **Wer das Kriterium jetzt erfuellt, sind zwei andere Punkte:**
   > - **Entscheidung 3 (Raid-Ertrag, Variante 6)** - entschieden, aber NICHT gebaut. Solange der
   >   heutige flache Container-Topf steht, ist der Raid die groesste Einzelquelle der Startphase.
   > - **Die Solo-Einnahme der Startphase**, gemessen 1,23 Mrd/Woche und mit wachsender Flotte
   >   FALLEND (ab 400 Mio Flottenwert netto negativ, siehe Befund 1 in `novice_bonus.txt`).
   >   Rechnet man den Raid heraus, liegen die Asteroiden bei 93 % - und selbst bei komplett
   >   abgeschaltetem Frischling-Bonus noch bei 81 %. Ursache ist nicht die Hoehe des Minings,
   >   sondern dass daneben nichts steht.
   >
   > **Was das fuer den Reset heisst:** Kriterium 5 bleibt eine Bedingung vor dem Reset, aber
   > **Entscheidung 12 kann es nicht mehr erfuellen oder verletzen** - es haengt jetzt an
   > Entscheidung 3 und an der Solo-Differenzierung (Abschnitt 8 Punkt 5). Bewusst NICHT gemacht:
   > das Kriterium in zwei Schwellen aufteilen (eine fuer den Raid, eine fuer den Rest). Beide
   > Zahlen waeren gesetzt statt gemessen, und der Plan vermeidet Zahlen ohne Massstab.
6. **Die Einnahmenkurve hat kein Plateau ueber 5 Tage.** Ein laengeres Plateau heisst, dass der
   naechste Ausbauschritt unerreichbar weit weg ist. -> Entscheidungen 7 und 9.4.

### Was daran kalibriert wird

- `T_MAX_BASE` und die sieben Reduktionsgewichte aus Entscheidung 9.1b.
- Die Slot-Zahlen aus 9.2 - und zwar gegen Kriterium 2 UND 3 gleichzeitig, weil beide
  gegenlaeufig sind.
- ~~Die additive Form des Frischling-Bonus aus Entscheidung 12.~~ **Entfaellt seit dem
  20.08.2026:** Entscheidung 12 ist ohne die Simulation kalibriert (zwei einklammernde
  Bau-Szenarien statt eines Verlaufs, Unterschied unter einem Prozentpunkt - Messkasten dort).
  Stattdessen haengt an Kriterium 5 jetzt **Entscheidung 3 (Raid-Ertrag)**.
- Der `SEED_FLEET`-Boden der Piratenbasen aus Entscheidung 5a.
- Die Bot-Wachstumskurve aus Entscheidung 13.1, gegen Kriterium 4.

---

## 2. Die Entscheidungen

Reihenfolge ist verbindlich. Nach jedem Block neu messen, bevor der naechste beginnt.

---

### Entscheidung 1 - Overkill-Deckel bei Aggregat-Stapeln: DECKELN

> **ERLEDIGT am 10.08.2026.** Umsetzung, Messreihe vorher/nachher und die Pruefung der Befuerchtung
> "Sektoren werden zu leicht" stehen in **Abschnitt 2a, Punkt 5**. Kurz: Klippe beseitigt (101
> Kreuzer 100 % -> 35,3 % Verlust), Individual-Pfad unveraendert, Sektoren praktisch unveraendert.
> Der Text unten bleibt als Befundbeschreibung erhalten.

**Bezug:** Session 4, Befund 5. **Dateien:** `game/combat.ts` (`applyAggregateDamage()` ~Zeile 688,
`applyHitToTarget()` ~Zeile 923, `buildUnits()` ~Zeile 714), `data/combatConstants.ts`
(`STACK_AGGREGATE_THRESHOLD_BY_TYPE`).

**Ziel:** Ein Treffer darf einem Stapel hoechstens den Schaden zufuegen, den er einer EINZELNEN
Einheit dieses Typs zufuegen wuerde (`hpMax + shieldMax`, plus Durchschlags-Anteil). Stapel und
Einzel-Einheiten sehen danach dieselbe Regel.

**Begruendung:** Direkter Verstoss gegen die Nutzervorgabe "nie Totalverlust". Gemessen: 99 Kreuzer
ueberstehen 100 Runden mit 42 % Verlust, **101 Kreuzer sind nach 2,8 Runden restlos vernichtet**.
Ein einziges Schiff kippt den Ausgang. Trifft grosse Flotten ueberproportional und arbeitet damit
gegen das Zielbild.

**Muss zuerst kommen**, weil danach jede Messung mit grossen Flotten anders ausfaellt.

**Messkriterien:**
- `run_aggregate_threshold.mjs` als Regressionstest: die Kurve ueber die Schwelle hinweg muss stetig
  sein, kein Sprung mehr zwischen 99 und 101 Einheiten.
- Danach `run_sectors.mjs`, `run_elite.mjs`, `run_raid.mjs` und `run_real_fleet.mjs` neu laufen
  lassen. Mindestens 40 Laeufe je Zelle (bei 16 war die Kurve noch nicht monoton).

**Bekanntes Risiko:** Saemtliche Messwerte aus Session 2-4, die mit grossen Flotten entstanden sind,
werden dadurch ungueltig. Das ist der aufwendigste Punkt des Pakets. Zusaetzlich werden grosse
Flotten spuerbar zaeher - pruefen, ob Sektoren dadurch zu leicht werden.

---

### Entscheidung 2 - Beute-Kurve: EXPONENT 0,85, NICHT LINEAR

> **STATUS 19.08.2026: VOLLSTAENDIG KALIBRIERT UND GEGENGEMESSEN - ABER NICHT GEBAUT.** Die offene
> Koop-Frage ist entschieden, alle Konstanten stehen fest, der Einbau ist damit mechanisch. **Im
> Repo steht davon KEINE Zeile** (Nutzerentscheidung 19.08.2026: Aenderungen erst, wenn der ganze
> Plan steht - vorher nur auf ausdrueckliche Nachfrage).
>
> **ACHTUNG bei der Nachvollziehbarkeit:** die Messung lief gegen einen LOKALEN Messbuild, in dem
> die unten beschriebenen Aenderungen enthalten waren - dasselbe Verfahren wie bei
> `make_messbuild_rf.mjs`, nur ohne eigenes Skript, weil hier ganze Funktionen und nicht nur
> kompilierte Konstanten betroffen waren. **`run_loot_curve.mjs` und `run_income_baseline_v2.mjs`
> laufen gegen den heutigen Repo-Stand NICHT** - sie importieren `game/loot.js`, das es dort noch
> nicht gibt. Wer die Zahlen nachpruefen will, baut zuerst die Bauanleitung unten ein. Protokoll:
> `balance/session2-simulation/loot_curve.txt`, 40 Durchlaeufe je Zelle, scheibenweise.
>
> **Bauanleitung - was einzubauen ist (Reihenfolge egal, aber vollstaendig)**
> - **Neues Modul `game/loot.ts`** buendelt die Kurve (`lootCurveFactor`, `lootCurveValue`), den
>   Koop-Aufschlag und die Bergung. `pirateBaseCombat.ts` wird darauf umgestellt - es soll genau
>   EINE Kurve im Code geben, keine zweite. Reiner Rechenteil ohne Datenbank-Bezug, damit die
>   Messskripte ihn direkt importieren koennen (wie `pirateBaseCombat.ts`).
> - **`missions.ts` und `groupOps.ts` verdrahten. `fleetSizeRewardMultiplier()` an beiden Stellen
>   entfernen:** in `missions.ts` ist sie ohnehin eine tote Rechnung (sie wirkt nur auf
>   `teileCap`/`lootBase`, die es bei niedrig/mittel/hoch seit dem 29.07.2026 nicht mehr gibt), in
>   `groupOps.ts` waere sie neben der Kurve eine doppelte Skalierung nach derselben Groesse.
> - **Container duerfen nicht die Hauptquelle sein** (Nutzerentscheidung 19.08.2026). Heute stellen
>   sie rund 94 % des Solo-Belohnungswerts - 1x Elite-Container (~238 Mio Wert) gegen ein
>   Ressourcen-Paket von 14 Mio. Jetzt faellt der Container-Fund EINMAL je Mission statt je
>   gewonnenem Check, und `winResources` in `sectors.ts` ist mit 13,8 multipliziert. Ergebnis:
>   Container-Anteil 23 % (mittlerer Ausbaustand) bzw. 5 % (spaeter). **Bewusst NICHT ueber die
>   Container-INHALTE geloest**: `CONTAINER_TYPES` haengt an Raids, Elite-Bollwerk und der
>   gesamten Container-Wirtschaft, und Entscheidung 3 ist gegen genau diese Inhalte geschlossen.
> - **Wrack-Bergung 30 %** in Solo-Missionen, Asteroiden-Eskorte und Gruppen-Expeditionen. Zwei
>   Setzungen: bei vollstaendig vernichteter Flotte gibt es keine Bergung (der Totalverlust muss
>   spuerbar bleiben), und der erstattete Betrag wird von `stats.resourcesSpentShipsDefense`
>   abgezogen - ohne das waere "Schiffe im Kampf verheizen" ein besserer Punkte-Farm als das
>   Verschrotten derselben Schiffe, exakt die Fehlerform aus R6. **Der Imperator ist ausgenommen**
>   (Nutzerentscheidung: Prestige-Schiff, kaputt ist kaputt, keine Teile-Rueckgabe).
> - **Zwei neue Anker-Konstanten in `economy.ts`, gemessen und damit fix:**
>   `LOOT_CURVE_SOLO_CHECK_POWER = 2_662_000_000` und `LOOT_CURVE_ELITE_CHECK_POWER = 2_290_000_000`.
>   Dazu `SALVAGE_SHARE = 0.3`, `COOP_LOOT_BONUS_PER_PARTNER = 0.15`,
>   `COOP_LOOT_BONUS_MAX_PARTNERS = 3`. Die Anker sind PRO CHECK gerechnet statt pro Mission -
>   bei gleichmaessigen Checks rechnerisch identisch, passt aber zur vorhandenen
>   Auszahlungsstruktur. **Wer das Belohnungsniveau eines Inhalts verschieben will, aendert nur
>   diese Zahl, nicht den Exponenten:** der Exponent bestimmt die Neigung, der Anker das Niveau.
>
> **Koop-Entscheidung: V2 (eigener Beitragsanteil) plus 15 % je Mitflieger, gedeckelt bei 3.**
> V1 ist verworfen, und zwar aus einem Grund, der in `elite_coop.txt` nicht sichtbar war: **Bots
> nehmen Elite-Einladungen automatisch an** (`bot.ts`, 30 % ihrer Flotte). Unter V1 waere das
> Einladen von zwei Bots ein Ein-Klick-Einkommensmultiplikator gewesen. V2 ist zusaetzlich von
> sich aus alibi-sicher - wer nichts beitraegt, hat einen Anteil nahe 0 -, damit entfaellt die in
> diesem Abschnitt geforderte Mindestmengen-Pruefung ersatzlos. V2 allein ist aber exakt neutral
> und beantwortet die Nutzerbeobachtung vom 18.08. nicht; der Aufschlag ist der bewusst kleine,
> gedeckelte Anreiz obendrauf. **Gemessen: x1,146 (mittel) und x1,155 (spaet) Netto je Teilnehmer
> gegenueber dem Alleinflug**, plus einen nicht eingeplanten Nebeneffekt - die Verluste je
> Teilnehmer sinken zusaetzlich (1,21 -> 0,95 Mrd bzw. 7,92 -> 6,44 Mrd), weil die groessere
> gemeinsame Flotte effizienter kaempft.
>
> **Anker beide getroffen:** Solo mittel/hoch 1,05 Mrd bei 11,1 Mrd vernichteter Feindmacht (Soll
> 1,05 bei 11,18), Elite mittel 32,71 Mrd (Soll 32,60, Abweichung 0,3 %). Der Elite-Anker musste
> nachgezogen werden (2,66 -> 2,29 Mrd), weil mit dem Grossflotten-Bonus ein Multiplikator x1,50
> weggefallen ist - der erste Lauf lag 9,7 % zu niedrig.
>
> **Wirkung, wofuer der Schritt gemacht wird:** Solo Hoch mit der realen Flotte netto **+2,42 Mrd
> statt -2,32 Mrd** (`real_fleet.txt`). Die Kurve traegt davon 3,60 Mrd, die Bergung 0,94 Mrd.
>
> **BASELINE NACH DEM EINBAU: 0,98 / 19,57 / 61,11 Mrd** (heute 0,80 / 19,82 / 76,85). **Das ist
> eine VORHERSAGE, kein Ist-Stand** - sie gilt ab dem Tag, an dem die Bauanleitung oben umgesetzt
> ist. Bis dahin bleibt 0,80 / 19,82 / 76,85 die gueltige Baseline. Der mittlere Stand
> bleibt praktisch unveraendert (-1,3 %, so kalibriert), frueh steigt um 23 %, spaet faellt um
> 20 %. **ACHTUNG bei jedem Vergleich mit der alten Zahl: darin stecken ZWEI Aenderungen.** Die
> alte Baseline war gegen Flottenwerte von 0,37 / 6,18 / 34,99 Mrd gerechnet, jetzt sind es
> 0,32 / 5,52 / 29,27 Mrd - das ist Entscheidung 6 (fuenf Kostenzeilen in `ships.ts`, 18.08.2026),
> die nach der Baseline-Messung gebaut wurde. Die Tagesrendite auf den Flottenwert liegt jetzt bei
> 301 / 355 / 209 Prozent; der Anstieg bei frueh/mittel ist ueberwiegend der gesunkene NENNER,
> nicht ein Anstieg der Einnahmen.
>
> **Drei Befunde, die als offene Punkte bleiben - hier bewusst NICHT nachgezogen**
> 1. **Die drei Solo-Stufen sind beim fruehesten Ausbaustand ununterscheidbar** (netto 0,25 /
>    0,25 / 0,27 Mrd, also 0 % und +8 % statt der in Abschnitt 8 Punkt 5 geforderten +30 %). Grund:
>    der flache Container-Fund dominiert dort, und alle drei Stufen schuetten aehnlich viel
>    Container-Wert aus (4x Silber 240 Mio, 2x Gold 254 Mio, 1x Elite 238 Mio). Ab dem mittleren
>    Stand trennen sich die Stufen sauber (+41 %/+97 % bzw. +93 %/+214 %). Gehoert zu
>    Entscheidung 12 / Neulingsschutz.
> 2. **Elite-Container sind beim fruehen Ausbaustand 84 % von 5,92 Mrd je Serie** - das Sechsfache
>    seiner Tageseinnahmen. Das ist KEINE Folge dieses Schritts (garantierte Container waren immer
>    flach je Check), wird aber sichtbar, weil daneben jetzt alles skaliert.
> 3. **Das Elite-Bollwerk bleibt mit 71 % die dominante Quelle im spaeten Ausbaustand** (vorher
>    74 %). Abnahmekriterium 5 ist weiterhin verletzt, durch diesen Schritt weder behoben noch
>    verschlimmert.
>
> **Ausdruecklich AUSSERHALB des Geltungsbereichs, auch beim spaeteren Einbau:** Piratenadmiral
> (P10) - Kurve und Bergung gehoeren dort NICHT hinein, weil seine Belohnungsmechanik Block B ist
> (4.6/4.7 entschieden, nicht gebaut); jetzt kalibrieren hiesse zweimal kalibrieren. Und Raids -
> keine Bergung auf Verteidigungsverluste, weil Entscheidung 3 gegen den heutigen Raid-Ertrag
> geschlossen ist.
>
> **`PIRATEN_MULTIPLIER_ROLL` bleibt gesperrt, solange dieser Schritt nicht gebaut ist** (er haengt
> an der Einnahmen-Baseline, siehe Entscheidung 16). Die Sperre faellt mit dem Einbau, nicht mit
> der Messung.
>
> **Empfehlung zum Zeitpunkt:** einbauen, aber erst nach Block B - der Piratenadmiral braucht
> dieselbe Kurve, und zweimal kalibrieren waere unnoetige Arbeit.

**Bezug:** Session 3, Befund 2. **Dateien:** `game/missions.ts` (`runHourlyCheck()`),
`game/combat.ts` (`fleetSizeRewardMultiplier()` ~Zeile 525), `data/sectors.ts`,
`data/combatConstants.ts` (`FLEET_SIZE_BONUS_CAP`, `FLEET_SIZE_BONUS_RATE`).

**Ziel:** `Beute = Basis * (vernichtete Feindmacht / Referenz)^0,85`, zusammen mit der bereits
beschlossenen Wrack-Bergung von 30 %.

**Begruendung:** Rein linear ergibt rund 17 % Tagesrendite auf den Flottenwert - die Flotte
verdoppelt sich alle fuenf Tage und ueberholt binnen Wochen jede andere Zahl im Spiel. Mit 0,85
waechst der Netto-Ertrag dauerhaft weiter (6,18 Mrd Flotte -> +0,99 Mrd/Tag; 34,99 -> +4,38;
66,33 -> +8,2), in einem ueber Jahre spielbaren Tempo.

**Kalibrierung - GEMESSEN am 14.08.2026** (`run_loot_exponent.mjs`, 40 Durchlaeufe je Zelle):
- Referenzflotte vernichtet **11,4 bis 11,8 Mrd** Feindmacht je 24h-Solo-Mission (geschaetzt waren
  12,2 Mrd - die Schaetzung stimmt), die reale Flotte **80 bis 83 Mrd** (geschaetzt 83,62).
- Daraus der Anker: **0,0948 bis 0,0962 Wert-Einheiten je Punkt vernichteter Feindmacht**
  (hochgerechnet waren 0,091). Der Wert ist damit bestaetigt und darf festgeschrieben werden.
- **Exponent bleibt bei 0,85**, gemessen und begruendet in Abschnitt 8, Punkt 1.

**Geltungsbereich - ERGAENZT am 14.08.2026:** Die Kurve muss zusaetzlich auf `game/groupOps.ts`
wirken (Elite-Bollwerk). Ohne das ist der Exponent nicht bestimmbar, Herleitung in Abschnitt 8,
Punkt 1.

> **OFFEN, ZWINGEND MIT ZU ENTSCHEIDEN (18.08.2026, aus der Nutzerfrage nach einem Koop-Anreiz):
> WELCHE BEZUGSGROESSE bekommt die Kurve bei MEHREREN Teilnehmern?** Der Satz oben sagt nur, DASS
> die Kurve auf `groupOps.ts` wirken muss, nicht WIE. Genau daran haengt aber die gesamte
> Koop-Frage, und die Antwort faellt hier - ein zusaetzlicher "Bonus je Teilnehmer" ist daneben
> weder noetig noch sinnvoll.
>
> **Gemessen am 18.08.2026** (`run_elite_coop.mjs` / `elite_coop.txt`, 40 Serien je Zelle, volle
> 6-Check-Expedition, Verluste in Wert): die vernichtete Feindmacht verdoppelt sich mit dem zweiten
> Teilnehmer exakt (18,85 -> 38,04 Mrd, Faktor **2,02**), weil `runGroupHourlyCheck()` die
> Wellenstaerke aus der SUMME aller Teilnehmerflotten bildet. Der Exponent 0,85 macht daraus
> 2^0,85 = 1,80.
>
> | Variante | je Teilnehmer | Haushalt bei n=2 |
> |---|---|---|
> | **V1** Kurve auf die GESAMTE vernichtete Macht, jeder bekommt sie voll | **x1,82** | x3,64 |
> | **V2** Kurve auf den eigenen Beitragsanteil | x1,01 (neutral) | x2,02 |
> | **V3** Kurve auf die Gesamtmacht, geteilt durch die Teilnehmerzahl | x0,91 | x1,82 |
>
> V1 hochgerechnet: n=3 je Spieler x2,57 (Haushalt x7,70), n=4 x3,28 (x13,11), n=5 x3,96 (x19,80).
> **Der Anreiz waechst nicht linear, sondern beschleunigt sich**, weil jeder die volle Kurve auf die
> gemeinsame Beute bekommt - bei fuenf Teilnehmern liefert der Haushalt das Vierfache dessen, was
> dieselben Flotten getrennt erwirtschaften.
>
> **Zwei Punkte, ohne die V1 nicht haltbar ist:**
> 1. `checkShipsAllowed()` prueft nur Schiffstypen, **keine Mindestmenge**. In V1 bekaeme ein
>    Teilnehmer mit einem einzigen Kreuzer dieselbe volle Kurve wie der mit der ganzen Flotte, und er
>    erhoeht die Feindstaerke praktisch nicht - die optimale Spielweise waere die Alibi-Flotte. Es
>    braucht einen Mindestbeitrag oder eine Beitragsgewichtung. `contributionShares()` (seit
>    13.08.2026, Schaden ausgeteilt + absorbiert) liegt als Groesse bereits vor; sie wird heute nur
>    fuer die Abschusspunkte benutzt. **Damit ist die Belohnungsfrage aus Entscheidung 3,
>    Variante 4 hier zum zweiten Mal faellig** - beides gehoert zusammen entschieden.
> 2. **Alle Belohnungszahlen des Plans zum Elite-Bollwerk sind gegen den SOLO-Fall gerechnet.** Die
>    169,68 Mrd je Serie (Kasten weiter unten) waeren unter V1 bei zwei Teilnehmern rund 307 Mrd je
>    Spieler. Das verschiebt Baseline, Abnahmekriterium 5 und die gesamte Einordnung des
>    Piratenadmirals (Abschnitt 4.6/4.8 rechnen gegen den Elite-Ertrag je Flottenstunde).
>
> **Nutzerentscheidung 18.08.2026 zum Verfahren:** nicht jetzt entscheiden, sondern zusammen mit
> Block A, Schritt 2 kalibrieren, wenn die Kurve tatsaechlich gebaut wird - sonst faellt dieselbe
> Entscheidung zweimal. Die Ausgangslage ist damit gemessen und dokumentiert, die Zahl bleibt offen.
>
> **Ausgangslage HEUTE, zum Vergleich mitgemessen** (dieselbe Flotte solo gegen zu zweit, 40 Serien
> je Zelle): die Belohnung je Teilnehmer ist identisch, die Verluste sind zu zweit in allen vier
> gemessenen Zellen hoeher (+0,2 bis +2,7 Prozentpunkte, gleiches Vorzeichen ueberall). Der einzige
> heute vorhandene Koop-Vorteil ist der Grossflotten-Bonus, der mit der Flottensumme rechnet - bei
> der Referenzflotte steht er solo wie gemeinsam am Deckel x1,50 und aendert nichts, bei kleinen
> Flotten steigt er von x1,44 auf x1,50 (voll) bzw. x1,20 auf x1,24 (schwach), also +0,51 bzw.
> +1,83 Mrd je Teilnehmer. **Gemeinsam fliegen lohnt sich heute ausgerechnet dort, wo es niemand
> bemerkt (Aufbauphase), und ist neutral bis leicht negativ, wo die Spieler tatsaechlich stehen.**

> **Achtung, gegen die Erwartung des Plans:** Die Beute-Kurve ist per Saldo KEINE Bremse, sondern
> fuer grosse Flotten eine deutliche Erhoehung und fuer kleine eine deutliche Kuerzung. Grund: Heute
> ist die Belohnung eine FESTE Container-Menge je gewonnenem Check, voellig unabhaengig von der
> Flottengroesse. Gemessen (Anker auf der Referenzflotte, Exponent 0,85):
>
> | | heute | mit Kurve |
> |---|---|---|
> | Solo-Mission, kleine Flotte | 1,20 Mrd | **0,15 Mrd** (-88 %) |
> | Solo-Mission, Referenzflotte | 1,21 Mrd | 1,21 Mrd (Anker) |
> | Solo-Mission, reale Flotte | 1,16 Mrd | **5,91 Mrd** (+410 %) |
> | Elite-Serie, reale Flotte | 32,60 Mrd | **169,68 Mrd** (+420 %) |
>
> Die Bremswirkung des Exponenten wirkt also gegenueber der LINEAREN Variante, nicht gegenueber
> heute. **Fuer die Startphase nach dem Reset ist das der kritische Punkt** - der frueheste
> Ausbaustand verliert rund 88 % seiner Missionsbelohnung. Zusammen mit Entscheidung 10
> (Verlustobergrenze in der Startphase) und Entscheidung 12 kalibrieren, nicht getrennt.

**Zusaetzlich zwingend:** `fleetSizeRewardMultiplier()` wird dadurch fachlich ersetzt. Sie wird
heute berechnet und auf `teileCap`/`lootBase` angewendet - **beide Felder existieren bei
`piraten_niedrig/mittel/hoch` seit dem Umbau 29.07.2026 nicht mehr**. Entweder entfernen oder auf
`winContainer`/`winResources` umhaengen. Der jetzige Zustand (Rechnung ohne Wirkung) darf nicht
bleiben.

**Messkriterien:**
- Netto-Ertrag ueber mindestens 5 Flottengroessen von 6 bis 200 Mrd Wert.
- **Den Kipppunkt suchen**, ab dem die Verluste die Beute wieder ueberholen. Liegt er unter
  500 Mrd Flottenwert, Exponent auf 0,90-0,95 anheben.
- Ertraege NIE an einem Einzelcheck bewerten - komplette 24h-Mission mit mitgeschleppten Verlusten
  rechnen (`run_mission_breakeven.mjs`, `run_elite_series_net.mjs`, `run_real_fleet.mjs`).

- **Zwei Container-Pruefpunkte, ergaenzt am 09.08.2026** (aus Session-1-Befund 7, dort als
  "NIEDRIG" abgelegt und deshalb nie in eine Entscheidung ueberfuehrt worden - beide beruehren
  Entscheidung 2 aber direkt):

  **2c. Teile-Umwandlungsrate ueber die Container-Stufen angleichen.**
  `TEILE_CONVERT_RESOURCES` ergibt 325.000 Wert-Einheiten pro Teil. Gemessen am Ressourcenwert
  DESSELBEN Containers sind das bei **Silber 59 %, Gold 40 %, Elite 38 %**. Der Zielkorridor im
  Code-Kommentar lautet **45-55 %** - kein einziger Tier trifft ihn, und die Abweichung laeuft in
  beide Richtungen. Folge: Teile aus einem Elite-Container sind relativ das SCHLECHTESTE Ergebnis,
  obwohl es der teuerste Container ist. -> Entweder die Rate anheben oder die Teile-Mengen pro
  Container angleichen; die Rate ist der einfachere Hebel, die Mengen der genauere.
  *Nachteil der Rate:* sie wirkt auch auf jede andere Teile-Quelle mit, nicht nur auf Container.

  **2d. Freischiff-Rueckkopplung gegen den Kipppunkt pruefen.**
  Das Freischiff ist in **jedem** Container die wertvollste Kategorie (Silber 91,7 gegen 33,0 Mio
  Ressourcen, Elite 350,0 gegen 229,0 Mio). Als seltener Jackpot (7-14 %) ist das vertretbar. Die
  Rueckkopplung ist es moeglicherweise nicht: geschenkte Schiffe umgehen die Werft komplett und
  erhoehen die eigene Power - und an der eigenen Power skaliert die Piraten-Feindstaerke
  (`PIRATEN_MULTIPLIER_ROLL`). Nach Entscheidung 2 haengt zusaetzlich die BEUTE an der vernichteten
  Feindmacht. Damit koennen sich Jackpot, Feindstaerke und Beute gegenseitig hochziehen.
  -> **Den Kipppunkt zweimal rechnen: einmal mit Freischiff-Treffern, einmal ohne.** Weichen die
  beiden Kurven spuerbar voneinander ab, ist die Rueckkopplung real und die Freischiff-Chance oder
  die Schiffsauswahl im Jackpot muss gedeckelt werden. Weichen sie nicht ab, ist es Rauschen und
  der Punkt ist erledigt.
  *Warum das trotz "NIEDRIG"-Einstufung hier steht:* Rueckkopplungen sind in diesem Projekt bisher
  jedes Mal die Stelle gewesen, an der etwas gekippt ist. Der Test kostet einen zusaetzlichen
  Durchlauf.

**Achtung:** `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr) verdoppelt bereits `combatWins` und damit die
Container-Anzahl (`missions.ts:558`). Jede neue Skalierung multipliziert sich darauf.

---

### Entscheidung 3 - Raid-Ertrag: VARIANTE 6 (fester Topf + Saettigung), GESCHLOSSEN 15.08.2026

> **NICHT GEBAUT - festgestellt am 20.08.2026 beim Code-Abgleich fuer Entscheidung 12.** Kein
> `RAID_ALLY_POWER_WEIGHT`, keine Saettigung ueber die Tagessumme, kein Topf: `RAID_WAVE_WIN_SILBER`
> / `_GOLD` / `_ELITE` stehen unveraendert auf 10/6/2 **je gewonnener Welle**. Damit ist
> Entscheidung 3 das **vierte** entschiedene, aber ungebaute Paket neben Block A Schritt 2,
> Block B und Entscheidung 16 - die Uebergabe fuehrte bis dahin nur drei.
> **Warum das jetzt wichtig ist:** gemessen zahlt der heutige Raid 1,84 Mrd Wert je gewonnener
> Welle und bis zu 22,07 Mrd je Raid, flach und unabhaengig von der eigenen Staerke. In der
> ersten Woche nach dem Reset sind das 58-64 % der Gesamteinnahmen - der Raid ist damit die
> groesste Einzelquelle der Startphase und der Grund, warum Abnahmekriterium 5 in Abschnitt 1b
> heute auf die falsche Quelle zeigt (`novice_bonus.txt`).

> **ENTSCHIEDEN am 15.08.2026, gemessen** (`run_raid_yield.mjs`/`raid_yield.txt` fuer den Ertrag,
> `run_raid_support.mjs`/`raid_support.txt` fuer Beitraege und Schwierigkeit). Die urspruengliche
> Halbierung auf 5/3/1 ist damit hinfaellig - sie senkt den Wert, nicht die Skalierung.
>
> **(a) Ertrag: Variante 6.** Das ist die im Kasten empfohlene Variante 4 (fester Container-Topf je
> Raid, nach tatsaechlichem Beitrag verteilt) PLUS eine **Saettigung ueber die Tagessumme der
> Anteile eines Spielers** - gleiche Bauform wie die Saettigungskurve aus Entscheidung 9.1a,
> Arbeitswert der Grenze `S_MAX = 1,5` Raid-Aequivalente.
>
> **Variante 4 allein reicht nachweislich nicht.** Gemessene Beitragsanteile:
>
> | Situation | Anteil des betrachteten Spielers |
> |---|---|
> | eigener Raid | 93,2 % |
> | Raid des zweiten Spielers (der verteidigt) | 4,6 % |
> | Raid eines Bots (Spieler verstaerkt) | **71,5 %** |
>
> Ursache, mechanisch: Die Wellenstaerke bemisst sich am VERTEIDIGER. Beim eigenen Raid ist sie auf
> die grosse Heimatflotte plus Anlagen zugeschnitten, jede Verstaerkung ist daneben ein
> Randbeitrag. Beim Bot ist die Welle klein, und die grosse Verstaerkungsflotte erledigt sie fast
> allein. **Der Ertrag summiert sich damit auf 2,41 Raid-Aequivalente (15,19 Mrd/Tag, 49,7 % der
> Einnahmen) und waechst weiterhin um rund 0,7 Aequivalente je zusaetzlichem Bot.** Die im Kasten
> unten stehende Erwartung, Variante 4 bleibe "unabhaengig von der Spielerzahl stabil", trifft nur
> bei symmetrischen Beitraegen zu - die liegen hier nicht vor.
>
> Mit Saettigung: **1,20 Aequivalente, 7,56 Mrd/Tag, 33,0 % der Einnahmen**, Restwachstum nahezu
> null. Das liegt im Zielkorridor (siehe naechster Absatz).
>
> **Der Zielkorridor ist 7 bis 10 Mrd/Tag, nicht "so niedrig wie moeglich".** Das Elite-Bollwerk
> liefert 10,87 Mrd/Tag. Faellt der Raid unter rund 7 Mrd, ueberschreitet STATT seiner das
> Elite-Bollwerk die 50-Prozent-Marke. Bei 7,56 Mrd liegen beide grossen Quellen darunter
> (Raid 33,0 %, Elite 47,4 %).
>
> **(b) Schwierigkeit: `RAID_ALLY_POWER_WEIGHT = 1,0`** (Variante 5 unten, aber voll statt 0,5).
> Gemessener Flottenverlust des Verteidigers ueber den Sweep:
>
> | Gewichtung fremder Flotten | Verlust des Verteidigers |
> |---|---|
> | allein, ohne Beistand | 10,1 % |
> | 0,00 (heutiger Code) | 0,5 % |
> | 0,50 | 1,7 % |
> | 1,00 | 3,1 % |
>
> **Die Begruendung vom Juli 2026 ist damit gemessen widerlegt:** Auch bei voller Gewichtung bleibt
> Unterstuetzung klar vorteilhaft (3,1 % statt 10,1 %). Ein halber Wert waere ein Kompromiss ohne
> Grund - der Sinn der Konstante ist, dass Beistand das Kraefteverhaeltnis nicht verzerrt, und das
> leistet nur 1,0. Als Kalibrierknopf bleibt sie erhalten.
>
> *Ausdruecklich NICHT erreicht:* In allen Faellen werden 12 von 12 Wellen gewonnen. Die Gewichtung
> macht den Raid teurer, nicht verlierbar. Verlierbarkeit bleibt als eigene Frage offen, siehe
> Abschnitt 8 Punkt 7.
>
> **(c) Beitrags-Massstab: unveraendert lassen.** Der Umbauvorschlag aus Abschnitt 2a Punkt 14
> (jede Groesse an ihrer eigenen Summe messen, dann mitteln) ist gemessen schaedlich - Herleitung
> dort.
>
> **(d) Wirtschaftsklassen: kein Handlungsbedarf.** Der Schmuggler faellt von +0,92 auf
> +0,35 Mrd/Tag und bleibt damit vor dem Prospektor (+0,22). Die Rangfolge kippt nicht, der Abstand
> schrumpft von Faktor 4,2 auf 1,6. Einzelheiten in Abschnitt 4b.
>
> **Nachteile, ausdruecklich genannt:**
> - Die Saettigung ist beim Spielen unsichtbar. Wer nachrechnet, warum der vierte verteidigte Raid
>   weniger gebracht hat als der erste, findet die Antwort nicht im Spiel. **Der Kampfbericht muss
>   den eigenen Beitragsanteil und die Saettigung ausweisen**, sonst sieht es wie ein Fehler aus.
> - `S_MAX = 1,5` ist der einzige gesetzte Wert des Pakets, nicht gemessen. Er ist der Knopf fuer
>   die spaetere Kalibrierung gegen die neue Baseline.
> - Zwei Verschlechterungen treffen weiterhin denselben Inhalt (weniger Ertrag UND hoehere
>   Feindstaerke). Die Vorrangregel aus Abschnitt 8 Punkt 7 bleibt gueltig: muss eine zurueckgenommen
>   werden, dann der Ertrag, nicht das Risiko.
>
> **Verworfen und warum:**
> - *Variante 1 (Konstanten gegen die Kontenzahl kalibrieren):* muss bei jedem Beitritt wiederholt
>   werden.
> - *Variante 2 (Halter bekommen einen Bruchteil):* daempft die Steigung, hebt sie nicht auf, und
>   loest die Beitragsfrage nicht.
> - *Variante 3 (Bots ohne Belohnung):* erreicht rechnerisch Flachheit, aber nur weil es zufaellig
>   genau zwei echte Spieler gibt; ein dritter startet das Wachstum neu. Behandelt zudem das
>   Symptom - die geparkte Ein-Schiff-Flotte bekaeme im Raid des Partners weiterhin die volle Menge.
> - *Halbierung auf 5/3/1:* siehe oben.

---

### Ausgangslage und Varianten (Stand vor der Entscheidung, zur Nachvollziehbarkeit erhalten)

**Bezug:** Session 2, Befund 4 / Session 3, Befund 1 (b). **Dateien:** `data/economy.ts`
(`RAID_WAVE_WIN_SILBER/GOLD/ELITE`).

**Ziel:** 10/6/2 -> **5/3/1**. Damit liegt die Wochensumme wieder auf dem Stand vor der
Frequenzverdopplung.

> **KRITISCHE ERGAENZUNG 11.08.2026 (Nutzerhinweis): Die Zahlen unten gelten fuer EINEN Raid -
> der eigenen. Real werden vier verteidigt.**
>
> Der Nutzer meldete rund 10.000 DM an einem Raid-Tag und nannte den Grund: er verteidigt seinen
> eigenen Raid, den seiner Frau und die der zwei Bots. **Im Code bestaetigt** (`finalizeRaidWaves()`
> in `raids.ts`): `grantContainers()` wird fuer den Verteidiger UND jeden Verstaerker/Halter
> aufgerufen - jeder bekommt die **volle** Menge, ausdruecklich unter Verweis auf Punkt 5 der README
> ("Mehrspieler-Belohnungen werden NIE geteilt").
>
> Diese Entscheidung stammt aus dem Kontext gemeinsamer Expeditionen, wo alle Teilnehmer EINE
> Mission zusammen fliegen. Auf Raids angewandt bedeutet sie etwas anderes: es sind **N getrennte
> Ereignisse, jedes voll verguetet**. Der Ertrag skaliert damit **linear mit der Zahl der
> angreifbaren Accounts** - Bots eingeschlossen. Und da die Belohnung nicht am Beitrag haengt,
> genuegt eine kleine Halte-Flotte je Verbuendetem.
>
> **UEBERHOLT 15.08.2026:** Die folgende Tabelle zaehlt nur die Container-Kategorie "Ressourcen"
> mit dem rohen `chance`-Wert. Aus dem Code gerechnet sind es 22,07 Mrd und 2.080 DM je Raid,
> 6,31 Mrd/Tag und 595 DM/Tag bei einem verteidigten Raid. Die Richtung des Befunds bleibt, die
> Hoehe war zu niedrig. Tabelle zur Nachvollziehbarkeit erhalten.
>
> **Nachgerechnet** (`CONTAINER_TYPES` x `RAID_WAVE_WIN_*`, 12/12 gewonnene Wellen):
>
> | | ein eigener Raid | x4 verteidigte Raids |
> |---|---|---|
> | Dunkle Materie | 1.800 | **7.200** (+ Bergung/Jackpot -> deckt die gemeldeten ~10.000) |
> | Ressourcenwert | 14,51 Mrd | **58,02 Mrd pro Raid-Tag** |
> | auf den Tag gemittelt | 4,15 Mrd | **16,58 Mrd/Tag** |
>
> **Folgen fuer diese Entscheidung:**
> - Die unten genannten **6,31 Mrd/Tag sind um Faktor 2,6 zu niedrig**, die 595 DM/Tag um Faktor
>   3,5 (real rund 2.060 DM/Tag).
> - Der Raid liefert damit nicht 29 %, sondern bei korrigierter Gesamtsumme (31,96 Mrd/Tag)
>   **rund 52 % aller Einnahmen** - er verletzt **Abnahmekriterium 5** (keine Einzelquelle ueber
>   50 %) bereits im Ist-Zustand, nicht erst hypothetisch.
> - **Die geplante Halbierung auf 5/3/1 reicht nicht.** Sie fuehrt auf 8,29 Mrd/Tag und damit
>   immer noch ueber den Wert, den dieser Plan bisher als Ist-Zustand annimmt.
> - **Der Ertrag waechst mit jedem neuen Spieler und jedem neuen Bot.** Das ist der eigentliche
>   Punkt: eine Halbierung der Konstanten behebt einen Zahlenwert, nicht die Skalierung.
>
> **Zu entscheiden in Block A/D (bewusst NICHT vorgezogen - anders als die Reparaturen des
> 10./11.08.2026 ist das kein stiller Defekt, sondern eine bewusste Design-Entscheidung mit
> unerwarteter Nebenwirkung):**
> 1. Bleibt es bei voller Belohnung je Verteidiger? Dann muessen die Konstanten gegen die Zahl der
>    Accounts kalibriert werden - und beim naechsten Beitritt erneut.
> 2. Oder bekommt der fremde Raid weniger als der eigene (z.B. Halter erhalten einen Bruchteil)?
>    Das erhaelt den Anreiz, sich gegenseitig zu helfen, ohne die Skalierung.
> 3. Oder zaehlen Bots nicht als Belohnungsquelle? Sie sind als Gegner-Fuellung gedacht, nicht als
>    Einnahmequelle.
> 4. **Fester Topf pro Raid, aufgeteilt nach tatsaechlichem Beitrag** (Nutzeridee 11.08.2026).
>    Statt jedem Teilnehmer die volle Menge zu geben, wird die Container-Menge EINES Raids unter den
>    Beteiligten verteilt - anteilig danach, wer wieviel beigetragen hat. Wer eine Halte-Flotte mit
>    einem einzigen Schiff parkt, bekaeme dann fast nichts.
>
>    *Datenlage: bereits vorhanden.* `combat.ts` fuehrt `dmgDealt` pro Schuetze, bei
>    Mehrspieler-Kaempfen mit dem Schluessel `` `${ownerKey}:${typeId}` `` (siehe `statKey()` und
>    Punkt 16 der README). Der Schaden je Spieler muesste also nicht neu erhoben, sondern nur
>    ausgewertet werden. Die Anzeige im Kampfbericht existiert ebenfalls schon.
>
>    **Zwei Dinge sind dabei zwingend, sonst greift die Idee nicht bzw. richtet Schaden an:**
>    - **Der Topf muss FEST pro Raid sein.** Rechnet man jedem seine Belohnung einzeln aus seinem
>      Schaden aus, ohne gemeinsame Obergrenze, multiplizieren vier Verteidiger den Gesamtertrag
>      weiterhin - die Skalierung waere NICHT behoben. Schadensmessung loest die Frage der
>      *Fairness innerhalb* des Topfes, nicht die der *Hoehe*. Das sind zwei getrennte Probleme.
>    - **Der Beitrag darf nicht nur "Schaden gemacht" sein, sondern "Schaden gemacht + Schaden
>      absorbiert".** Sonst bestraft die Regel ausgerechnet das Bollwerk: es hat Waffen x1, macht
>      also konstruktionsbedingt den geringsten Schaden - und waere bei der Heimatverteidigung,
>      seinem eigenen Heimatfeld (siehe Abschnitt 4a), der schlechtest bezahlte Teilnehmer. Auch
>      `dmgTakenA` wird bereits besitzer-bewusst gefuehrt, die Daten liegen also ebenfalls vor.
>
>    *Gilt NUR fuer Raids.* Gemeinsame Expeditionen behalten die volle Belohnung je Teilnehmer -
>    dort fliegen alle wirklich EINE Mission zusammen, und genau fuer diesen Fall wurde Punkt 5 der
>    README beschlossen.
>
>    *Offene Nebenwirkung:* Bei stark unterschiedlichen Flottengroessen bekommt der grosse Spieler
>    den Loewenanteil - fuer den kleineren koennte sich das Helfen dann kaum noch lohnen. Vor der
>    Umsetzung pruefen, ob ein Mindestanteil je Teilnehmer noetig ist.
>
> **ZWEITE HAELFTE DES PROBLEMS: DIE SCHWIERIGKEIT (ergaenzt 13.08.2026, Nutzerbeobachtung).**
> Der Nutzer meldet aus dem Livebetrieb: "RAID ist immer noch sehr einfach. Man verliert keine
> einzige Verteidigungsanlage, Schiffe hoechstens 1k leichte Jaeger" - geschaetzter Verlust rund
> **2 %** bei voller Belohnung.
>
> **Ursache, im Code bestaetigt:** `resolveOneWave()` in `raids.ts` berechnet `combinedPower`
> AUSSCHLIESSLICH aus `state.fleet` und `state.defense` des Verteidigers (Gewichtung 70/30). Die
> Verstaerker- und Halte-Flotten werden erst DANACH geladen und gehen in den Kampf ein, aber nicht
> in die Staerke des Angreifers. Bei vier Beteiligten kaempft die Welle also gegen ein Vielfaches
> dessen, wofuer sie bemessen wurde. Der Wellenwurf (`RAID_WAVE_ROLL` 1,20 / 1,70 / 2,30-2,50)
> aendert daran nichts, weil er auf dieselbe zu kleine Basis multipliziert.
>
> **Das ist KEIN Fehler, sondern eine bewusste Entscheidung** vom Juli 2026, woertlich im
> Code-Kommentar: *"NUR die eigene Heimatflotte des Verteidigers zaehlt hier mit, AUSDRUECKLICH
> NICHT Verstaerker-/Halte-Flotten anderer Spieler - sonst wuerde Unterstuetzung den Raid selbst
> verschaerfen, dann braeuchte man nicht unterstuetzen."*
>
> **Die damalige Begruendung haelt der Rechnung aber nicht stand.** Wuerden fremde Flotten voll
> mitzaehlen, bliebe das KRAEFTEVERHAELTNIS wie im Alleingang - die Verluste verteilten sich aber
> auf mehrere Flotten. Unterstuetzung lohnt sich dann weiterhin, nur durch **geteiltes Risiko**
> statt durch garantierten Sieg. Das Argument gilt nur, wenn man Verlust-ANTEIL mit
> Verlust-MENGE verwechselt.
>
> **Beide Haelften ergeben zusammen den Befund:** nahezu kein Risiko (Schwierigkeit skaliert nicht
> mit der Verteidigung) bei vervielfachter Beute (Belohnung skaliert mit der Teilnehmerzahl).
> **Deshalb NICHT isoliert anfassen** - die Schwierigkeit hochzuziehen, waehrend die Belohnung
> weiter vervierfacht wird, verschiebt nur das Verhaeltnis, ohne die Ursache zu treffen.
>
> **Vorschlag als fuenfte Variante, gemeinsam mit den vier oben zu entscheiden:**
> 5. **Gewichtungsfaktor fuer fremde Flotten** statt der heutigen Null-oder-Eins-Frage. Ein neuer
>    Wert (Arbeitstitel `RAID_ALLY_POWER_WEIGHT`) bestimmt, zu welchem Anteil Verstaerker- und
>    Halte-Flotten in `combinedPower` einfliessen. 0 ist der heutige Zustand, 1 volle Skalierung.
>    Bei **0,5** bliebe ein Raid mit Unterstuetzung spuerbar leichter als allein, aber nicht
>    trivial. Der Wert ist ein reiner Kalibrierknopf und gehoert an dieselbe Stelle wie
>    `RAID_FLEET_POWER_WEIGHT`/`RAID_DEFENSE_POWER_WEIGHT`.
>    *Zu messen:* Verlustanteil des Verteidigers bei 1, 2 und 4 Beteiligten - Zielband und
>    Abnahmekriterium erst nach der neuen Baseline festlegen. Erwartungswert heute: rund 2 %.
>
> **NEBENWIRKUNG AUF DIE WIRTSCHAFTSKLASSEN (ergaenzt 12.08.2026).** Wer hier etwas aendert,
> verschiebt automatisch die Balance der Wirtschaftsklassen - siehe Abschnitt 4b. Kurz: Das
> Deuterium der Spieler stammt zu rund 97 % aus Raid-Containern, nicht aus den Minen. Der
> Schmuggler-Bonus (halbierte Handelsgebuehr) haengt damit vollstaendig am Raid-Ertrag. Faellt der
> auf einen Bruchteil, faellt der Schmuggler von +0,92 auf unter +0,25 Mrd/Tag und damit hinter
> den Prospektor zurueck. **Die Klassenwahl nach der Aenderung neu bewerten, nicht vorher.**
>
> **Empfehlung (Stand 13.08.2026): Variante 4, hilfsweise Variante 2.** Variante 4 trifft die
> Ursache am genauesten (Belohnung folgt dem Beitrag) und bleibt unabhaengig von der Spielerzahl
> stabil, ist aber die aufwendigste. Variante 2 (Halter bekommen einen festen Bruchteil) erreicht
> die Stabilitaet mit deutlich weniger Aufwand, ohne die Beitrags-Frage zu loesen.
>
> **GEPRUEFT UND TEILWEISE WIDERLEGT am 15.08.2026.** Die Annahme "bleibt unabhaengig von der
> Spielerzahl stabil" gilt nur bei symmetrischen Beitraegen. Gemessen holt der grosse Spieler im
> Raid eines Bots 71,5 % des Topfes, wodurch Variante 4 die Skalierung nur halbiert. Deshalb um
> eine Saettigung erweitert (Variante 6, siehe Kopf dieser Entscheidung). Variante 2 waere nicht
> die richtige Rueckfallebene gewesen - sie ist unter allen Varianten die mit der zweitgroessten
> Reststeigung.

**Begruendung:** Die Verdopplung von 1x auf 2x/Woche wurde als reiner Kalendereintrag umgesetzt,
ohne die Belohnung pro Raid gegenzurechnen - die Kommentare an den Konstanten begruenden 10/6/2
noch mit "nur 1x/Woche pruefbar". Der Raid liefert heute **6,31 Mrd/Tag (29 % der Gesamteinnahmen)
und 595 DM/Tag (der groesste DM-Posten des Spiels) ohne Flottenbindung, ohne Flugzeit, ohne
Entscheidung**. Die hoehere Frequenz soll mehr Ereignisse bringen, nicht mehr Ertrag.

**Muss zusammen mit Entscheidung 2 gemessen werden**, sonst verschiebt die neue Beute-Skalierung
die Einnahmen weiter nach oben, bevor eine Senke greift.

**GEMESSEN 15.08.2026, Ergebnis negativ:** Der Schnappschuss bringt 0,6 % Verlust gegen 0,5 % bei
Neuberechnung - praktisch nichts. Die vermutete Selbstkorrektur kann nur greifen, wenn die Flotte
tatsaechlich schrumpft; bei starker Verteidigung passiert das nie. Der Mechanismus wirkt also
ausgerechnet nur bei schwachen Konten, also in der Startphase, wo Entscheidung 10 Totalverluste
ausschliessen soll. **Als Hebel fuer "Raid verlierbar machen" ist er ungeeignet.** Absatz zur
Nachvollziehbarkeit erhalten:

**Zusaetzlich pruefen (eigene Bewertung, nicht zwingend):** `resolveOneWave()` rechnet
`combinedPower` pro Welle NEU aus der bereits dezimierten Flotte. Wer Schiffe verliert, bekommt
automatisch schwaechere Folgewellen - der Raid korrigiert sich selbst nach unten und kann kaum
scheitern (gemessen: 100 % Flottenverlust, trotzdem 10,6 von 12 Wellen gewonnen). Ein Schnappschuss
der ersten Welle (analog `raid.initialCombinedPower`) wuerde Raids ueberhaupt erst verlierbar
machen. **Vorsicht:** kollidiert mit der Nutzervorgabe "nie Totalverlust" - siehe Entscheidung 10.

**Bekannter Nachteil - PRAEZISIERT 09.08.2026:** ~~Die einzige Aenderung des Pakets, die sich beim
Spielen wie ein Rueckschritt anfuehlt.~~ Das GEFUEHL der Wegnahme entfaellt durch den Server-Reset
(Abschnitt 1a) - nach dem Reset hat nie jemand 10/6/2 gehabt. **Der rechnerische Effekt bleibt
bestehen:** der Raid liefert weniger, gemessen an der neuen Baseline nach Block A, und bleibt damit
eine echte Senkung - nur keine spuerbare Enteignung.

---

### Entscheidung 4 - Piratenadmiral (P10): VARIANTE B, EIN DURCHLAUF PRO TAG

**Bezug:** Session 2, Befund 2 + 7 / Session 4, Befund 4 + 5 + Nachtrag. **Dateien:**
`game/groupOps.ts` (`runAdminCheck()` ~Zeile 527, `finalizeAdminEncounter()`, `createGroupOperation()`),
`data/combatConstants.ts` (`ADMIRAL_*`), `game/combat.ts` (`ADMIRAL_STAT_SHARE`).

Umsetzung in dieser Reihenfolge:

> **4.1 UND 4.2 GEMESSEN UND GESCHLOSSEN AM 15.08.2026 (Block B, Schritt 4).** Messung:
> `run_admiral_defeat.mjs` / `admiral_defeat.txt` (neu) und `run_admiral_rebalance.mjs` /
> `admiral_rebalance.txt` (umgebaut, jetzt ueber alle vier Ausbau-Profile). 40 Durchlaeufe je
> Zelle, 2 Modi x 4 Profile x 2 Flotten. Methode wie bei `run_loot_exponent.mjs`: die Serien
> laufen OHNE Abbruch durch, alle Schwellen werden nachtraeglich auf denselben Zufallsziehungen
> ausgewertet - ein Abbruch beendet die Serie nur, er veraendert frueher liegende Checks nicht.
>
> **Befund in einem Satz: Beide Defekte sind echt und werden repariert, aber KEINER von beiden ist
> heute noch die Ursache der toten Eskalation. Der Boss stirbt in Check 1 - in drei von vier
> Ausbaustaenden mit 100 Prozent Wahrscheinlichkeit und 0,3 bis 1,1 Prozent Flottenverlust.**
>
> **(1) Die Diagnose zu 4.1 ist ueberholt.** Der Plan sagte, `result.retreated` sei in 77-100 %
> aller Kaempfe gesetzt. Gemessen sind es **0,0 % bei `voll`, `voll_noboost` und `mittel`** und
> 0-5 % bei `schwach`. Ursache ist der Overkill-Deckel vom 10.08.2026: der Verlust je Check faellt
> dadurch auf 0,3-1,1 %, und unterhalb von 21 % zerstoerter Flotte setzt der gestaffelte
> Einzelschiff-Rueckzug gar nicht erst ein. Die alten Admiral-Messdateien stammen vom 08.08.2026,
> also aus der Zeit VOR dem Deckel und vor der Klassen-Neuaustarierung vom 11.08.2026.
>
> **(2) Die Schlussfolgerung stimmt trotzdem - aus dem umgekehrten Grund.** Check 2 wird weiterhin
> nie erreicht, aber nicht weil die Flotte faelschlich als geschlagen gilt, sondern weil sie den
> Boss sofort vernichtet. Damit sind `ADMIRAL_ESCALATION_PER_CHECK`, `ADMIRAL_TOTAL_CHECKS`, die
> Extraktions-Entscheidung und `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` unveraendert tot, und **4.1
> und 4.2 koennen daran nichts aendern.** In den drei realistischen Profilen aendert KEINE Schwelle
> zwischen 0,30 und 0,60 und KEIN Modus (eingefroren/frisch) irgendeine Zelle: Check-Tiefe bleibt
> 1,00, Siegquote 100 %.
>
> **(3) Verlustmass: WERT, nicht Stueckzahl.** Gemessen liegen beide ueber alle Checks nur 0,4 bis
> 1,7 Prozentpunkte auseinander (z. B. `schwach`/real Check 4: 28,1 % Wert gegen 29,9 % Stueck) -
> die Wahl ist praktisch folgenlos. Genommen wird der Wert, weil P10-Flotten extrem gemischt sind
> (ein Imperator entspricht Hunderten Kreuzern) und Messregel 4 die Wert-Bilanz vorschreibt.
> *Nachteil:* in der Kampfnachricht schlechter erklaerbar - dort gehoert der Prozentsatz
> ausgeschrieben, sonst wirkt der Abbruch bei noch tausenden vorhandenen Schiffen willkuerlich.
>
> **(4) Kumulativ gegen die entsandte Flotte, nicht je Einzel-Check.** Der Plantext sagte
> "gegen die entsandte Stueckzahl" (kumulativ), die bisherigen Messskripte rechneten je Check.
> Der Unterschied entscheidet alles: mit repariertem 4.2 folgt der Gegner der schrumpfenden
> Flotte, der Verlust je Check bleibt dadurch etwa gleich gross und erreicht 45 % nie - die Serie
> liefe immer bis Check 6 und die Extraktions-Entscheidung waere wieder bedeutungslos, nur in die
> andere Richtung. *Nachteil:* ein Spieler kann nach einem gut gelaufenen Check abbrechen muessen,
> weil frueher aufgelaufene Verluste die Schwelle bereits fuellen.
>
> **(5) Die Schwelle wird auf 0,30 gesetzt, nicht auf die vorgeschlagenen 0,45.** Gemessen im
> einzigen Profil, in dem sie ueberhaupt je erreicht wird (`schwach`, Modus frisch):
>
> | Schwelle | Check-Tiefe real / gross | tatsaechlicher Verlust am Ende |
> |---|---|---|
> | **0,30** | **4,72 / 4,55** | **39,0 % / 36,9 %** |
> | 0,40 | 5,38 / 5,35 | 47,6 % / 49,3 % |
> | 0,45 | 5,67 / 5,60 | 52,1 % / 52,2 % |
> | 0,55 | 6,00 / 5,83 | 58,3 % / 55,7 % |
> | 0,60 | 6,00 / 5,90 | 58,3 % / 56,8 % |
>
> Drei Gruende: 0,30 ist der einzige Wert im Suchraum, der die **Ziel-Check-Tiefe 3-5 trifft**;
> der tatsaechliche Verlust landet bei 37-39 % und damit mit Abstand unter Abnahmekriterium 1
> (hoechstens 70 % in einem Ereignis), waehrend 0,45 schon bei 52 % liegt; und die Regel "bei
> Uneindeutigkeit den niedrigeren Wert" gilt hier genauso wie beim Beute-Exponenten.
> **Wichtig: die Schwelle wird immer ueberschossen**, weil sie erst NACH einem vollstaendigen
> Check geprueft wird - gemessen um 7 bis 9 Prozentpunkte. Wer 45 % tatsaechlichen Verlust will,
> muss 0,35 setzen, nicht 0,45. *Nachteil:* die Serie endet fuer schwache Konten frueher, die
> angesammelte Beute aus 4.7 ist entsprechend kleiner, und der Wert ist an genau EINEM Profil
> kalibriert - in den anderen dreien wird er nie erreicht.
>
> **(6) 4.2 wird wie geplant repariert, wirkt aber nur bei schwachem Ausbau.** Isoliert gemessen
> (Schwelle 0,45 auf Wert), Unterschied eingefroren gegen frisch: bei `voll`, `voll_noboost` und
> `mittel` **null** (beide 1,00 Checks, 100 % Sieg). Bei `schwach`/real: Check-Tiefe 4,65 -> 5,67,
> Verlust am Ende 60,7 % -> 52,1 %. Die Reparatur ist also richtig und wirkt genau in die
> beabsichtigte Richtung - sie verhindert die Todesspirale, in der eine schrumpfende Flotte gegen
> einen unveraendert grossen Gegner antritt. *Nachteil, ausdruecklich:* der Gegner schrumpft
> dadurch mit, ein echter Totalverlust wird praktisch unmoeglich, und die gesamte Steigerung ueber
> die Serie haengt allein an `ADMIRAL_ESCALATION_PER_CHECK`.
>
> **(7) Die Reihenfolge im Code bleibt: erst Sieg pruefen, dann Niederlage.** Der Elite-Pfad macht
> das bereits richtig (`result.retreated && !npcFullyDestroyed`), `simulateCombat()` ebenfalls -
> der Admiral-Pfad als einziger nicht. Ohne diese Reihenfolge meldet ein gewonnener Kampf
> "Rueckzug nach hohen Verlusten" (Messregel 9).

**4.1 Verlust-Kriterium reparieren - ENTSCHIEDEN 15.08.2026.**
`runAdminCheck()` nutzt `result.retreated` als Niederlage-Kriterium. Das Flag bedeutet seit der
Umstellung auf den gestaffelten Einzelschiff-Rueckzug (Juli 2026) nur noch, dass sich mindestens
ein Schiff abgesetzt hat (`UNIT_RETREAT_THRESHOLD = 0,3`); der im Code referenzierte
`RETREAT_THRESHOLD` existiert nicht mehr.
-> Ersetzen durch den **kumulierten WERT-Anteil der verlorenen Flotte** aus
`result.survivorsByOwner`, gemessen gegen die beim Start entsandte Flotte. Neue Konstante
**`ADMIRAL_DEFEAT_LOSS_SHARE = 0.30`** (gemessen, siehe Kasten Punkt 5 - der urspruenglich
vorgeschlagene Wert 0,45 fuehrt zu Tiefe 5,6-5,7 und 52 % tatsaechlichem Verlust).
-> Sieg wird VOR der Niederlage geprueft. `simulateCombat()` (Zeile 118-125) und der
Elite-Bollwerk-Pfad in `groupOps.ts` machen das bereits richtig - als Vorlage nutzen.
-> Der Prozentsatz gehoert in den Ausgangstext der Kampfnachricht, sonst ist der Abbruch fuer den
Spieler nicht nachvollziehbar.

**4.2 `contributedPower`-Freeze GLEICHZEITIG reparieren - ENTSCHIEDEN 15.08.2026.**
`runAdminCheck()` (~Zeile 442) summiert `p.contributedPower`, das nur einmal beim Start gesetzt wird
(~Zeile 285), waehrend die Ueberlebenden pro Check zurueckgeschrieben werden (~Zeile 522). Ab
Check 2 skaliert der Gegner also gegen die START-Flotte.
-> Ersetzen durch `combatFleetPowerBase(p.ships)` frisch je Check, exakt wie der
Elite-Bollwerk-Pfad (~Zeile 745). `contributedPower` bleibt als reines Anzeigefeld bestehen; es
hat im ganzen Projekt **genau eine rechnerische Lesestelle** (im Code geprueft, Client liest es
nicht), der Eingriff ist damit isoliert und risikoarm.
-> Wirkt heute nur im Profil `schwach`, siehe Kasten Punkt 6. Die im Plan erwartete Wirkung
"4.1 schaltet diesen Fehler scharf" ist NICHT eingetreten - beide Fehler bleiben folgenlos,
solange der Boss Check 1 nicht ueberlebt.

**4.3 Boss-Anteil senken.** `ADMIRAL_STAT_SHARE` von 0,55 auf **0,30**.
Gemessen bei realer Flotte: Anteil 0,55 -> 60 % Siegchance, 8,89 Mrd Verlust. Anteil 0,25 -> 100 %
Siegchance, 3,05 Mrd Verlust. Faktor 2,9 im Verlust.

> **ACHTUNG - DIESE ZAHLEN SIND UEBERHOLT UND DIE RICHTUNG HAT SICH UMGEKEHRT (15.08.2026).**
> Neu gemessen mit `run_admiral_rebalance.mjs` ueber alle vier Profile, 40 Serien je Zelle:
> **bei `voll`, `voll_noboost` und `mittel` liegt die Siegquote bei JEDEM Anteil von 0,25 bis 0,90
> bei 100 %, und zwar in Check 1.** Der Verlust bewegt sich dabei GEGEN den Anteil: reale Flotte,
> Profil `voll`, Anteil 0,25 -> 0,43 Mrd Verlust, Anteil 0,55 -> 0,07 Mrd, Anteil 0,90 -> 0,00 Mrd.
> **Ein hoeherer Boss-Anteil macht den Gegner also SCHWAECHER, nicht staerker.**
> Grund: seit dem Overkill-Deckel vom 10.08.2026 kann ein einzelner riesiger Schuss hoechstens
> fuenf Ziele kaskadieren; dieselbe Macht, auf viele Eskortschiffe verteilt, erzeugt dagegen viele
> ungedeckelte Schuesse. Die Konzentration auf eine Einheit ist damit fuer die NPC-Seite ein
> Nachteil geworden. **Die geplante Senkung auf 0,30 wuerde den Kampf also haerter machen statt
> leichter - was heute sogar erwuenscht waere, aber bei weitem nicht ausreicht: auch 0,25 endet in
> 100 % der Faelle mit einem Sieg in Check 1.**
> **`ADMIRAL_STAT_SHARE` ist damit kein brauchbarer Hebel mehr.** Der Hebel liegt in der
> Gegnerstaerke selbst. Orientierungsmessung (Abschnitt G in `admiral_defeat.txt`, Zusatzfaktor
> auf die heutigen 110-150 %, Boss-Anteil 0,55, nur Check 1):
>
> | Zusatzfaktor | Boss ueberlebt Check 1 (voll/real) | Flottenverlust | mittel/real: Verlust |
> |---|---|---|---|
> | 1x (heute) | 0 % | 0,3 % | 0,5 % |
> | 2x | 0 % | 3,0 % | 4,5 % |
> | **4x** | **100 %** | **28,2 %** | **47,0 %** |
> | 8x | 100 % | 52,3 % | 52,2 % |
> | 16x | 100 % | 52,8 % | 54,3 % |
>
> **Der gesamte brauchbare Bereich liegt zwischen dem Zwei- und dem Vierfachen der heutigen
> Gegnerstaerke, und dazwischen kippt es abrupt** - genau die Alles-oder-Nichts-Eigenschaft, die
> schon bei der Raid-Wellenstaerke dokumentiert ist (Abschnitt 8, Punkt 7). Eine Anhebung muss
> deshalb in kleinen Schritten gemessen werden, und die Verlustobergrenze aus Entscheidung 10
> gehoert davor, nicht danach. Die Saettigung bei rund 52-57 % Verlust ist der gestaffelte
> Einzelschiff-Rueckzug, der bei Missionen ausdruecklich aktiv bleibt (Punkt 27 der Code-Doku).

> **SCHRITT 5 - GEMESSEN AM 16.08.2026. Der Gegnerstaerke-Faktor allein reicht NICHT, der
> fehlende Hebel ist die Forschungsskalierung des Bosses.** Drei Messungen, 40 Serien je Zelle,
> Schritte von hoechstens 0,5x, volle Serie statt nur Check 1 (`run_admiral_strength.mjs` ->
> `admiral_strength.txt`, `run_admiral_bossscale.mjs` -> `admiral_bossscale.txt`,
> `run_admiral_roundcap.mjs` -> `admiral_roundcap.txt`).
>
> **(a) Abschnitt G war nicht ausreichend.** Er misst nur Check 1 und kann die Zieltiefe 3-5
> deshalb gar nicht beantworten. Ueber die volle Serie gemessen (Kriterium 4.1, contributedPower
> frisch) liegt der brauchbare Faktor je Ausbaustand woanders, und die Fenster ueberlappen NICHT:
>
> | Faktor | voll/real | mittel/real | schwach/real |
> |---|---|---|---|
> | 1x | 1,00 (100 % Sieg) | 1,00 (100 %) | 4,90 (0 %) |
> | 2x | 1,00 (100 %) | 2,98 (52 %) | 1,23 (0 %) |
> | 2,5x | 1,00 (100 %) | 3,20 (0 %) | 1,00 (0 %) |
> | 3x | 1,68 (70 %) | 2,33 (0 %) | 1,00 (0 %) |
> | 3,5x | 1,88 (33 %) | 1,57 (0 %) | 1,00 (0 %) |
>
> **Die Check-Tiefe ist nicht monoton:** sie steigt erst und faellt dann wieder, weil ab einem
> gewissen Punkt schon Check 1 die 30-%-Schwelle reisst. Mehr Gegnerstaerke macht die Serie also
> KUERZER. Der Verlust saettigt ueber alle Zellen bei 48-55 %, bleibt damit unter Abnahmekriterium 1
> (70 %) - **Entscheidung 10 blockiert diesen Punkt nicht**, die Obergrenze wirkt fuer P10 bereits
> ueber den gestaffelten Einzelschiff-Rueckzug.
>
> **(b) Ursache ist strukturell.** `combatFleetPowerBase()` rechnet auf ROHWERTEN. Forschung,
> Module, Klasse und Kampf-Booster gehen in die Gegnerstaerke nicht ein, tragen auf Spielerseite
> aber die gesamte Wirksamkeit. Der Boss verschaerft das, weil `sideBStatsOverride`
> `getEffectiveStats()` umgeht: seine Eskorte bekommt ueber `PIRATE_RESEARCH_SHARE = 1,0` den
> vollen Forschungsstand des Spielers, **er selbst nicht** (bisher unter "Ausserdem" als
> "bewusst entscheiden" gefuehrt - **das ist jetzt der Hebel, nicht mehr eine Randnotiz**).
>
> **(c) Mit forschungsskaliertem Boss** (Waffen/Schild/Panzerung mit denselben Multiplikatoren wie
> bei jeder anderen Einheit, `effectPerLevel` 0,10 -> Stufe 10 = 2,0x) schrumpft die Spanne
> zwischen den Ausbaustaenden von rund 4:1 auf rund 1,5:1:
>
> | Faktor | voll/real | mittel/real | schwach/real |
> |---|---|---|---|
> | 1x | 1,00 (100 % Sieg) | 1,00 (100 %) | 4,92 (0 %) |
> | 1,25x | 1,00 (100 %) | 2,35 (75 %) | 3,52 (0 %) |
> | 1,5x | 1,82 (88 %) | **4,55 (28 %)** | 2,58 (0 %) |
> | 1,6x | 2,25 (78 %) | 5,55 (0 %) | - |
> | 1,75x | **3,98 (40 %)** | 5,08 (0 %) | 1,68 (0 %) |
> | 2x | 5,47 (0 %) | - | - |
>
> **(d) ACHTUNG - `MAX_ROUNDS = 100` ist heute eine balance-relevante Konstante, kein reines
> Sicherheitsnetz, und sie wirkt UNGLEICH.** Im empfohlenen Bereich laufen 35-100 % der Kaempfe in
> den Deckel. Gegengemessen mit unveraendertem Quellcode ueber Messbuilds, in denen allein die
> kompilierte Konstante ersetzt wurde:
>
> | Deckel | voll/real 1,75x | mittel/real 1,5x |
> |---|---|---|
> | 100 | Tiefe 3,63 / 47,5 % Sieg | Tiefe 4,60 / 25 % Sieg |
> | 300 | Tiefe 2,60 / 67,5 % Sieg | Tiefe 4,35 / 30 % Sieg |
> | 1000 | Tiefe 1,75 / 87,5 % Sieg | - |
>
> Ein starkes Konto mahlt den Boss bei genug Runden zuverlaessig klein, ein mittleres nie - der
> Deckel wirkt praktisch nur als Bremse fuer starke Konten. **Ein Faktor, der gegen Deckel 100
> kalibriert wird, ist gegen ein Artefakt kalibriert.** Der Deckel gehoert deshalb VOR die
> Festlegung von 4.3 entschieden.
>
> **STAND 4.3 nach der Deckel-Entscheidung vom 16.08.2026:**
> - **Deckel 100, Faktor 1,75x plus Forschungsskalierung des Bosses.** `voll` erreicht Tiefe
>   3,63-3,98 mit 40-47 % Sieg, 35-48 % Abbruch, 12-18 % Extraktion - eine echte Mischung der
>   Ausgaenge, und damit ist die Extraktions-Entscheidung erstmals ueberhaupt eine Entscheidung.
> - ~~Deckel auf 300, Faktor 2,0x~~ - entfaellt, siehe Deckel-Entscheidung oben.
> - In beiden Faellen bleibt `ADMIRAL_STAT_SHARE` bei 0,55 (kein brauchbarer Hebel, siehe oben).
> - **Ausdruecklicher Nachteil:** `schwach` gewinnt in keiner Variante mehr (Tiefe 1,7-3,2, 0 %
>   Sieg). P10 wird damit endgueltig Inhalt fuer voll ausgebaute Konten. Das ist eine bewusste
>   Entscheidung, keine Nebenwirkung.
> - **Offene Luecke:** `schwach/real` bei 2x mit Deckel 300 ist nicht gemessen.
> - **BESTAETIGT AM 17.08.2026 NACH 4.4: der Faktor bleibt bei 1,75x.** Mit der beschlossenen
>   4.4-Mechanik (nur RapidFire, ohne Salve) misst sich `voll`/real auf Tiefe 3,63 und 3,83 bei
>   42,5 und 37,5 % Sieg gegen 3,98 bei 40 % ohne sie - die Verschiebung liegt innerhalb der
>   Streuung zweier Laeufe derselben Zelle. Die im Uebergabe-Text erwartete Absenkung unter 1,75x
>   ist damit **nicht** eingetreten. Einzelheiten im Messkasten bei 4.4; dort steht auch der
>   Nachteil (Extraktionsquote faellt von 12,5 auf 0-2,5 %).
> - **UEBERHOLT AM 17.08.2026 NACH R14: 1,75x ist nicht mehr tragfaehig.** Alle Zahlen dieses
>   Kastens sind gegen eine Engine gemessen, in der RapidFire fuer grosse Flotten faktisch
>   abgeschaltet war. Neu erhoben mit derselben Zelle (`voll`/real, Modus `forschung`, Messbuild
>   V1, 40 Serien): Tiefe **3,85** - sieht weiter nach Zielband aus, aber die Siegquote faellt von
>   42,5 auf **0,0 %** und der Wertverlust steigt von 21,5 auf **36,6 %**. Die Serie endet damit
>   nicht mehr am Kampfausgang, sondern ausnahmslos am Verlustkriterium
>   (`ADMIRAL_DEFEAT_LOSS_SHARE = 0,30`) - genau das Risiko, das die Uebergabe fuer diese Zahl
>   benannt hatte. Sweep zur Einordnung, gleiche Bedingungen:
>
>   | Faktor | Check-Tiefe | Sieg | Wertverlust |
>   |---|---|---|---|
>   | 1,25x | 1,43 | 95,0 % | 8,6 % |
>   | 1,5x | 2,70 | 57,5 % | 20,6 % |
>   | **1,6x** | **2,85** | **40,0 %** | **23,2 %** |
>   | 1,75x | 3,85 | 0,0 % | 36,6 % |
>
>   **Kandidat: 1,6x.** Er reproduziert das alte Verhalten bei 1,75x am genauesten (dort 3,63 Tiefe
>   bei 42,5 % Sieg und 21,5 % Verlust). *Ausdruecklich genannter Nachteil:* die Check-Tiefe liegt
>   damit bei 2,85 und damit unter dem Zielband 3-5 - das Zielband und die Siegquote sind nach R14
>   nicht mehr gleichzeitig erreichbar, weil der Verlust schneller waechst als die Serie lang wird.
>   **Nicht festschreiben, bevor `mittel`/real und `schwach`/real bei 1,6x gemessen sind** - die
>   Fenster der Ausbaustaende ueberlappten schon vorher nicht (siehe oben), und die Serie ist nicht
>   monoton.

> **GESCHLOSSEN AM 17.08.2026: 4.3 STEHT AUF FAKTOR 1,6x** (plus Forschungsskalierung des Bosses,
> Deckel 100, `ADMIRAL_STAT_SHARE` unveraendert 0,55). Die fehlenden Zellen sind gemessen, dazu
> zwei Vergleichszellen bei 1,5x und ein zweiter unabhaengiger Lauf der Kandidatenzelle
> (`admiral_bossscale_44.txt`, Modus `forschung`, Messbuild V1, 40 Serien je Zelle).
>
> | Faktor | voll/real | mittel/real | schwach/real |
> |---|---|---|---|
> | 1,25x | 1,43 / 95,0 % / 8,6 % | - | - |
> | 1,5x | 2,70 / **57,5 %** / 20,6 % | 4,22 / 0,0 % / 36,3 % | 1,63 / 0,0 % / 40,1 % |
> | **1,6x** | **2,85 / 40,0 % / 23,2 %**<br>**2,70 / 45,0 % / 23,1 %** | **3,80 / 0,0 % / 35,0 %** | **1,57 / 0,0 % / 52,2 %** |
> | 1,75x | 3,85 / 0,0 % / 36,6 % | - | - |
>
> (Check-Tiefe / Siegquote / Wertverlust am Ende. Zwei Zeilen bei 1,6x = zwei unabhaengige Laeufe.)
>
> **(a) Die Streuung ist bestimmt und kleiner als der Entscheidungsabstand.** Zwei Laeufe derselben
> Zelle `voll`/real 1,6x ergeben 2,85/40,0 %/23,2 % und 2,70/45,0 %/23,1 % - rund 5 Prozentpunkte
> Siegquote, der Verlust praktisch deckungsgleich. Der Abstand zwischen 1,5x und 1,6x betraegt
> 12,5-17,5 Punkte und liegt damit klar darueber. **Die Entscheidung ist nicht rauschgetrieben** -
> das war nach den 3,63/3,83-Doppelmessungen vom 16./17.08. ausdruecklich zu pruefen.
>
> **(b) Entschieden wurde auf `voll`/real, und das ist eine Setzung, keine Messung.** P10 ist seit
> dem 16.08.2026 ausdruecklich Endspiel-Inhalt ("`schwach` gewinnt in keiner Variante mehr"), also
> ist der voll ausgebaute Stand der massgebliche. 1,6x trifft dort das zuvor akzeptierte Verhalten
> fast exakt: 40,0-45,0 % Sieg gegen frueher 42,5 %, 23,1-23,2 % Verlust gegen frueher 21,5 %.
>
> **(c) Fuer `mittel` ist der Faktor gar kein Hebel mehr.** 1,5x und 1,6x sind dort praktisch
> ununterscheidbar: 0 % Sieg in beiden Faellen, 36,3 gegen 35,0 % Verlust. Nur die Tiefe bewegt
> sich, und zwar **nach unten bei hoeherem Faktor** (4,22 -> 3,80) - die Nicht-Monotonie aus
> Schritt 5 ist damit ein zweites Mal bestaetigt, diesmal innerhalb eines einzigen Profils.
> **Was `mittel` entscheidet, ist R14, nicht 4.3.**
>
> **(d) `schwach` ist der einzige Ausbaustand, den die Wahl spuerbar trifft** - und zwar zum
> Schlechteren: 40,1 % Verlust bei 1,5x gegen **52,2 %** bei 1,6x, damit im Saettigungsband 48-55 %,
> in dem die Serie sofort am Verlustkriterium endet (Tiefe 1,57). *Ausdruecklicher Nachteil der
> Entscheidung.* Er wird in Kauf genommen, weil `schwach` bereits am 16.08.2026 bewusst
> abgeschrieben wurde; wer das revidieren will, revidiert diese Entscheidung, nicht den Faktor.
>
> **(e) Das Zielband 3-5 wird bei `voll` von keinem Faktor mehr mit einer Siegquote erreicht.**
> 1,75x liefert 3,85 bei 0 % Sieg, 1,6x 2,70-2,85 bei 40-45 %. Das war vorab akzeptiert und ist
> hiermit belegt statt vermutet. Bemerkenswert: `mittel` liegt bei 1,6x mit 3,80 IM Zielband, aber
> ohne einen einzigen Sieg - die Check-Tiefe allein ist damit endgueltig kein brauchbares
> Abnahmemass mehr. **Fuer kuenftige Kalibrierungen an P10: Tiefe UND Ausgangsverteilung gemeinsam
> lesen, nie die Tiefe allein.**
>
> **(f) Nicht angefasst und ausdruecklich unveraendert:** `MAX_ROUNDS` 100, Schwelle 0,30,
> Entscheidung 4.4 (RapidFire auf sechs Typen, Salve verworfen), Beute-Anker, Exponent 0,85,
> Baseline 0,80 / 19,82 / 76,85 Mrd. Alles Vergleiche unter gleichen Bedingungen, von R14 nicht
> beruehrt.
>
> **(g) Dokumentationsschuld beglichen:** `admiral_bossscale_44.txt` enthielt die Nach-R14-Zeilen
> ohne Kennzeichnung unter der Ueberschrift der Vor-R14-Messreihe. Die Zelle `voll/real 1,75x`
> stand dadurch dreimal mit 37,5 %, 42,5 % und 0,0 % Sieg in derselben Datei, ohne erkennbaren
> Grund. Eine Trennmarke ist eingezogen; **keine Zahl wurde geaendert.**

> **REICHWEITE DER DECKEL-AENDERUNG - GEMESSEN AM 16.08.2026, entscheidet den Punkt.** Die Sorge,
> ein hoeherer `MAX_ROUNDS` koennte die gerade geschlossene Baseline aus Block A umwerfen, ist
> gegenstandslos. Reale Flotte, Profil `voll`, 40 Kaempfe je Sektor mit der jeweiligen
> `PIRATEN_MULTIPLIER_ROLL`:
>
> | Sektor | Runden im Schnitt | max | am Deckel |
> |---|---|---|---|
> | piraten_niedrig | 14,7 | 18 | 0 % |
> | piraten_mittel | 19,6 | 25 | 0 % |
> | piraten_hoch | 24,6 | 32 | 0 % |
> | piraten_elite | 35,4 | 45 | 0 % |
>
> **Kein anderer Inhalt im Spiel kommt dem Deckel auch nur nahe** - der Elite-Bollwerk-Kampf endet
> im Schnitt nach 35 Runden, das Maximum ueber alle Sektoren liegt bei 45. Eine Anhebung auf 300
> aendert ausserhalb von P10 nachweislich nichts und beruehrt weder die Baseline noch Entscheidung
> 1, 2 oder 3. Der einzige Preis ist Rechenzeit im P10-Kampf (rund das Dreifache), und die laeuft
> ohnehin im Worker-Thread (Punkt 2 der Code-Doku).
> **-> ENTSCHIEDEN AM 16.08.2026 (Nutzervorgabe): `MAX_ROUNDS` BLEIBT BEI 100.** Damit ist die
> Empfehlung "auf 300 anheben" vom Tisch. Begruendung des Nutzers: OGame-basierte Spiele begrenzen
> den Kampf ueblicherweise auf 6-8 Runden, 100 ist im Vergleich bereits sehr grosszuegig. Der
> Deckel ist damit KEIN Sicherheitsnetz und auch kein Artefakt, sondern eine bewusste
> Gestaltungsentscheidung: wer den Boss nicht innerhalb des Gefechtsfensters kleinbekommt, bekommt
> ihn nicht. Zweiter, unabhaengiger Grund: 300 Runden verdreifachen die Rechenzeit je P10-Kampf,
> und die laeuft im Worker-Thread - die CPU-Spitzen von einigen Sekunden waeren entsprechend
> laenger.
> **Folge fuer 4.3: es gilt die Variante mit Deckel 100, also Faktor 1,75x plus
> Forschungsskalierung.** Alle Messungen mit Deckel 300 in `admiral_roundcap.txt` bleiben als
> Beleg dafuer stehen, dass die Entscheidung bewusst und nicht aus Unkenntnis getroffen wurde.

**4.4 Boss-Mechanik statt Boss-Zahl - GEMESSEN UND ENTSCHIEDEN 17.08.2026.**
`RAPIDFIRE.piratenadmiral = { leicht: 10, schwer: 8 }` - **beide Typen stehen nicht in
`ADMIRAL_ALLOWED_SHIP_IDS` und koennen den Sektor gar nicht betreten.** Die Anti-Massen-Faehigkeit
des Bosses hat null erreichbare Ziele.
-> **BESCHLOSSEN: RapidFire umstellen auf `{ kreuzer: 5, schlachtschiff: 5, bomber: 5,
schlachtkreuzer: 4, zerstoerer: 4, reaper: 3 }`. Die Mehrfachziel-Salve wird VERWORFEN -
`piratenadmiral` kommt NICHT in `MULTI_TARGET_VOLLEY_SHIPS`, und `ZIELERFASSUNG_BASE` bekommt
KEINEN Eintrag fuer ihn.** Begruendung im Messkasten.
-> **Der fehlende `ZIELERFASSUNG_BASE`-Eintrag ist ab sofort eine tragende Setzung, keine Luecke.**
Er ist der einzige Grund, warum die Salve nicht feuert. Er sieht wie genau die Sorte stiller
Ausweichwert aus, die Messregel 15 beschreibt, und muss im Code als bewusst ausgelassen
kommentiert werden - sonst traegt ihn eine spaetere Aufraeumrunde nach und sprengt die Balance
lautlos.

> **SCHRITT 5 - GEMESSEN AM 17.08.2026** (`run_aggregate_threshold.mjs` und neu
> `run_aggregate_threshold_44.mjs` -> `aggregate_threshold_44.txt`, `run_admiral_bossscale.mjs`
> -> `admiral_bossscale_44.txt`, Beleg `probe_admiral_shots.mjs`). 40 Laeufe je Zelle, Messbuilds
> ueber `make_messbuild_44.mjs` nach dem Verfahren von M3 - der Quellcode blieb unberuehrt.
> Gemessene Varianten: **V1** nur RapidFire, **V2** V1 + Salve + `ZIELERFASSUNG_BASE` 0,35,
> **V3** wie V2 mit RapidFire ueber alle zehn erlaubten Typen, **V2b** wie V2 mit 0,55.
>
> **(1) Der Vorschlag besteht aus ZWEI Wirkpfaden voellig verschiedener Groessenordnung, und einer
> davon war im Plan gar nicht sichtbar.** Die Mehrfachziel-Salve haengt an
> `getZielerfassungAccuracy()`, und die liefert **0**, wenn der Schuetzentyp keinen Eintrag in
> `ZIELERFASSUNG_BASE` hat - `piratenadmiral` hat keinen. **Der Eintrag in
> `MULTI_TARGET_VOLLEY_SHIPS` allein waere toter Code gewesen.** Gemessen, ein Kampf je Variante:
>
> | Variante | Zielerfassung | Schuesse je Runde | Runden bis Ende |
> |---|---|---|---|
> | V0 (heute) | 0,00 | **1,0** | 100 (Deckel) |
> | V1 (nur RapidFire) | 0,00 | 5,3 | 48 |
> | V2 (+ Salve) | 0,95 | 39,0 | **2** |
> | V3 (Salve, zehn Typen) | 0,95 | 47,5 | **2** |
>
> **Der Boss feuert heute exakt einen Schuss je Runde** - seine RF-Ziele sind nicht erreichbar,
> also gibt es auch keinen einzigen Folgeschuss. Die 5,3 bei V1 sind der Erwartungswert der
> Folgeschuss-Kette bei RF 5 (1/(1-0,8) = 5). Die 0,95 bei V2/V3 sind Basis 0,35 plus 0,06 je
> Forschungsstufe, die der Boss ueber `PIRATE_RESEARCH_SHARE = 1,0` mitbekommt - der Basiswert
> selbst ist deshalb fast gleichgueltig (V2b mit 0,55 misst sich identisch).
>
> **(2) Die Salve ist mit KEINEM Gegnerstaerke-Faktor kalibrierbar.** `voll`/real, volle Serie:
>
> | Faktor | V2: Tiefe | Sieg | Niederlage | Verlust am Ende |
> |---|---|---|---|---|
> | 0,1x | 1,00 | 100 % | 0 % | 3,5 % |
> | 0,25x | 1,00 | 100 % | 0 % | 10,8 % |
> | 0,5x | 1,00 | 100 % | 0 % | 23,7 % |
> | 0,75x | 1,00 | 7,5 % | 92,5 % | 42,4 % |
> | 1x | 1,00 | 0 % | 100 % | 43,5 % |
> | 1,75x | 1,00 | 0 % | 100 % | 45,3 % |
>
> **Die Check-Tiefe bleibt ueber den gesamten Suchraum bei 1,00**, und zwischen 0,5x und 0,75x
> kippt der Ausgang von 100 % Sieg auf 92,5 % Niederlage. Das ist exakt die
> Alles-oder-Nichts-Eigenschaft, an der `ADMIRAL_STAT_SHARE` schon gescheitert ist: die Salve
> entscheidet den Kampf in Runde 1-2, und ein Inhalt, der vor Check 2 entschieden ist, kann die
> Zieltiefe 3-5 grundsaetzlich nicht erreichen. V3 ist noch haerter (51-52,5 % Wertverlust je
> Check), weil der Boss dann zusaetzlich Imperator und Salvenschiffe trifft, also die teuersten
> Einzelschiffe der Flotte.
>
> **(3) Die Faehigkeit ist strukturell nicht anti-Masse, sondern anti-klein.** Die Verluste je
> Runde sind doppelt gedeckelt: der Overkill-Deckel (Entscheidung 1) begrenzt EINEN Treffer auf
> rund fuenf Einheiten, `MAX_SHOTS_PER_UNIT` die Schuesse auf 50. Damit steht eine ABSOLUTE
> Obergrenze an Abschuessen je Runde, deren ANTEIL mit wachsender Flotte faellt. Mischflotte,
> Faktor 1,75x, V1:
>
> | Flotte (Stueck) | V0 Verlust | V1 Verlust |
> |---|---|---|
> | 405 | 65,9 % | **100 %** |
> | 456 | 52,7 % | 100 % |
> | 1.800 | 10,6 % | 57,6 % |
> | 4.500 | 2,4 % | **16,5 %** |
>
> Der Code-Kommentar bei `RAPIDFIRE.piratenadmiral` beschreibt die Absicht als "bestraft Masse an
> kleinen Schiffen ganz natuerlich" - **gemessen bewirkt die Mechanik das Gegenteil.** Dieselbe
> Umkehrung wie bei `ADMIRAL_STAT_SHARE` (15.08.2026) und aus derselben Ursache: seit dem
> Overkill-Deckel zahlt sich konzentrierter Einzelschaden gegen grosse Stapel nicht mehr aus.
> Bestaetigt an der Gegenprobe `voll`/gross bei 1,75x: Tiefe 3,17 -> **1,05**, Sieg 27,5 -> 17,5 %,
> waehrend dieselbe Aenderung bei `voll`/real fast nichts bewegt.
>
> **(4) An der Aggregationsschwelle gibt es keine Klippe** (Messregel 13 erfuellt). Mischflotte,
> Aggregation setzt zwischen 99 und 101 fuer alle sechs Typen gleichzeitig ein: V0 57,6 -> 52,7 %,
> V1 100 -> 100 %. **Der Einzeltyp-Aufbau des Altskripts taugt fuer diese Frage nicht mehr**: bei
> nur einem Schiffstyp ist die Salve definitionsgemaess wirkungslos (V1/V2/V3/V2b messen sich dort
> auf die Nachkommastelle gleich), und ab V1 sind alle Zellen bis 150 Kreuzer mit 100 % Verlust
> saturiert. Deshalb der Mischflotten-Aufbau in `run_aggregate_threshold_44.mjs`.
>
> **(5) Der Faktor aus 4.3 bleibt bei 1,75x.** `voll`/real mit V1, zwei unabhaengige Laeufe:
> Tiefe **3,63** und **3,83** bei 42,5 % und 37,5 % Sieg - gegen 3,98 bei 40 % ohne 4.4. Die
> Erwartung, 4.4 hebe die effektive Gegnerstaerke spuerbar, hat sich fuer die reale Flotte **nicht
> bestaetigt**; die Verschiebung liegt innerhalb der Streuung zweier Laeufe derselben Zelle.
> Nachbarzellen mit V1: 1,25x -> Tiefe 1,00 (100 % Sieg), 1,5x -> 2,35 (80 %), 1,6x -> 2,40 (75 %).
> **Ausdruecklicher Nachteil:** die Extraktionsquote faellt von 12,5 % auf 0-2,5 %. Mehr Serien
> enden am Verlust-Kriterium statt an einer Spielerentscheidung - die Extraktion bleibt damit
> schwaecher, als 4.3 sie haben wollte.
>
> **(6) Die offene Luecke ist geschlossen.** `schwach`/real bei 1,75x **mit** der 4.4-Mechanik:
> Tiefe **1,52**, 0 % Sieg, 43,2 % Verlust (ohne 4.4: Tiefe 1,68). `mittel` ist praktisch
> unberuehrt (1,5x: 4,22 gegen 4,55, beide 27,5 % Sieg; 1,75x: 4,63 gegen 5,08, beide 0 % Sieg).
>
> **Warum trotzdem umstellen und nicht alles lassen:** eine Faehigkeit, die auf Ziele zeigt, die
> den Sektor nicht betreten duerfen, ist ein stiller Ausweichwert (Messregel 15) und faellt beim
> naechsten Lesen des Codes wieder als Defekt auf. V1 kostet fuer die reale Flotte nichts an
> Kalibrierung und macht den Boss fuer kleinere Flotten spuerbar gefaehrlicher - was zum bereits
> beschlossenen Charakter von P10 als Endspiel-Inhalt passt.
> **Nachteil, ausdruecklich genannt:** mit sechs statt zehn RF-Typen werden Imperator,
> Salvenkreuzer, Salvendreadnought und Sandronator vom Boss praktisch nicht mehr beschossen,
> sobald ein Standardtyp praesent ist - bei nicht leerem RF-Pool zielt er ausschliesslich daraus.
> Eine reine Spezialschiff-Flotte umgeht die Faehigkeit vollstaendig. Das wird bewusst in Kauf
> genommen (zehn Typen kosten gemessen 51-52,5 % Wertverlust je Check); **der Gegenzug, falls es
> ausgenutzt wird, ist ein RF-Eintrag mit niedrigem Wert fuer diese vier Typen, nicht die Salve.**

**4.5 Belohnung proportional statt fest.**
`ADMIRAL_EXTRACTION_BASE` und `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` entfallen, ersetzt durch
**`ADMIRAL_LOOT_PER_DESTROYED_POWER = K = 0,5`**. Die je Check vernichtete Feindmacht wird auf der
`GroupOperation` mitgefuehrt und bei Extraktion/Sieg ausgezahlt.
Die Eskalation braucht dadurch keinen eigenen Belohnungs-Aufschlag: jeder weitere Check bringt
automatisch mehr vernichtete Macht (Gegner waechst mit 1,15^n) und riskiert zugleich die noch
ungesicherte Beute.

> **Rohwerte fuer K, gemessen am 15.08.2026 als Nebenprodukt von Schritt 4** (`admiral_defeat.txt`
> Abschnitt F, `admiral_rebalance.txt` Abschnitt B; 40 Serien je Zelle, Boss-Anteil 0,55 wie im
> Code, contributedPower frisch). **K ist damit NICHT entschieden - das ist Schritt 5.**
> - Vernichtete Feindmacht je Durchlauf: **rund 22 Mrd** bei realer Flotte in allen drei
>   realistischen Profilen, rund 2,7 Mrd bei der grossen Referenzflotte. Der Wert ist praktisch
>   unabhaengig vom Ausbaustand, weil der Gegner ohnehin an der eigenen Flottenmacht skaliert.
> - Netto-Verlust je Durchlauf (nach 30 % Wrack-Bergung): **0,05 bis 0,15 Mrd** - sehr wenig,
>   rund ein Fuenftausendstel bis ein Fuenfhundertstel des Flottenwerts.
> - **K fuer Netto = 0 liegt deshalb bei 0,0023 bis 0,0099** (reale Flotte, drei realistische
>   Profile). Der im Plan vorgeschlagene Wert **K = 0,5 liegt um den Faktor 50 bis 200 darueber.**
> - Nur im Profil `schwach` liegt der Break-even bei 0,14 bis 0,28, also nahe an einer sinnvollen
>   Groessenordnung. Ein einziger K-Wert kann beide Lagen nicht bedienen - das ist die eigentliche
>   Aufgabe von Schritt 5.

> **SCHRITT 5 - GEMESSEN AM 16.08.2026 (`run_admiral_economics.mjs` -> `admiral_economics.txt`).
> Ein freier Faktor K darf gar nicht eingefuehrt werden - er widerspricht Entscheidung 2.**
> Der Geltungsbereich der Beute-Kurve schliesst `groupOps.ts` ausdruecklich ein, und P10 laeuft
> dort. Ein linearer `ADMIRAL_LOOT_PER_DESTROYED_POWER` waere die einzige Einnahme im Spiel, die
> ungedaempft mit der Flottengroesse mitwaechst - genau das, was der Exponent 0,85 verhindern soll.
> **4.5 ist damit keine Kalibrierfrage mehr, sondern entfaellt: P10 benutzt dieselbe Beute-Kurve
> wie alles andere**, `Beute = 0,0956 x 11,6 Mrd x (vernichtete Macht / 11,6 Mrd)^0,85`.
>
> Gerechnet auf den in (a)-(d) gemessenen Rohwerten:
>
> | Zelle | vernicht. Macht | Beute | netto Verlust | netto/Durchlauf | je Flottenstunde |
> |---|---|---|---|---|---|
> | Ist-Zustand, voll 1x | 22,59 Mrd | 1,95 | 0,06 | **+1,90** | 1,04 |
> | voll 1,75x, Deckel 100 | 96,22 Mrd | 6,70 | 3,31 | **+3,39** | 1,86 |
> | voll 2x, Deckel 300 | 110,34 Mrd | 7,52 | 5,11 | **+2,42** | 1,33 |
> | mittel 1,5x, Deckel 300 | 88,98 Mrd | 6,27 | 4,88 | +1,39 | 0,76 |
> | mittel 2x, Deckel 300 | 92,05 Mrd | 6,45 | 7,48 | **-1,03** | negativ |
> | schwach 1x, Deckel 300 | 32,26 Mrd | 2,65 | 7,95 | **-5,30** | negativ |
>
> **Der zentrale Befund: die vernichtete Feindmacht vervierfacht sich, die Beute aber nur um Faktor
> 3,4 (Exponent 0,85), waehrend der Verlust LINEAR mit dem Flottenwert steigt.** Je haerter der
> Boss, desto schlechter das Geschaeft - fuer `mittel` und `schwach` wird P10 in der harten
> Variante zum Minusgeschaeft. Der Break-even-Befund aus Schritt 4 (K zwischen 0,0023 und 0,28)
> ist damit gegenstandslos: die Frage war falsch gestellt, weil sie einen freien Parameter
> voraussetzte.
> **Folge: die Praemie fuer das Boss-Risiko muss vollstaendig ueber 4.6 kommen, nicht ueber die
> Beute je Punkt Feindmacht.**

**4.6 Sieg-Bonus:** `ADMIRAL_VICTORY_BONUS` (fester Betrag) -> ~~**Faktor 1,5**~~ **Faktor 2,0** auf
die angesammelte Beute. `ADMIRAL_VICTORY_DM` bleibt bei **200**.
**BESTAETIGT UND GESCHLOSSEN 18.08.2026** (Nutzerentscheidung, kein Messbedarf): der Vorschlag 2,0x
aus dem Kasten unten gilt. Damit ist Block B bis auf 4.8 (Cooldown) inhaltlich entschieden; gebaut
ist von 4.x weiterhin nichts, `ADMIRAL_VICTORY_BONUS` steht im Code unveraendert als fester Betrag.

**4.7 Niederlage entschaerfen:** Heute verfaellt bei `defeat` die Beute ALLER bereits ueberstandenen
Checks - zusammen mit durchschnittlich 62 % Flottenverlust eine doppelte Bestrafung.
-> Bei Niederlage **50 %** der angesammelten Beute auszahlen statt 0. Die Extraktions-Entscheidung
bleibt sinnvoll, weil Weitermachen die Haelfte riskiert.
**BESTAETIGT UND GESCHLOSSEN 18.08.2026** (Nutzerentscheidung, kein Messbedarf): 50 % **auf die bis
zum letzten UEBERSTANDENEN Check gesicherte Beute**, nicht auf die des verlorenen Checks - sonst
zahlt der Niederlage-Pfad bei hoher Check-Tiefe mehr als ein frueher Sieg. Die Deckelung ist Teil
der Entscheidung, nicht eine Umsetzungsfrage.

> **SCHRITT 5 - GERECHNET AM 16.08.2026. Faktor 1,5 traegt die Praemie nicht.** Erwartungswert je
> Durchlauf (Beute nach der Kurve, Sieg-Bonus nur auf die Sieg-Faelle, 50 % auf die uebrigen,
> abzueglich Nettoverlust):
>
> | Zelle | Sieganteil | Bonus 1,0x | Bonus 1,5x | Bonus 2,0x |
> |---|---|---|---|---|
> | voll 1,75x, Deckel 100 | 47,5 % | +1,63 Mrd | +3,22 Mrd | +4,81 Mrd |
> | voll 2x, Deckel 300 | 30,0 % | **-0,21 Mrd** | +0,91 Mrd | +2,04 Mrd |
> | mittel 1,5x, Deckel 300 | 30,0 % | -0,81 Mrd | +0,13 Mrd | +1,07 Mrd |
>
> Zum Vergleich: Elite-Bollwerk **7,07 Mrd je gebundener Flottenstunde** (169,74 Mrd netto je
> 24h-Serie, die Kadenz-Annahme von 3 Tagen kuerzt sich dabei heraus). P10 liegt bei 1,3-1,9 Mrd
> je Flottenstunde, also bei rund einem Viertel. **Fuer Paritaet je Flottenstunde waere ein
> Sieg-Bonus von rund 4,5x noetig.**
> **VORSCHLAG:** Sieg-Bonus **2,0x** statt 1,5x, keine Paritaet mit dem Elite-Bollwerk anstreben.
> Begruendung: P10 ist ein einstuendiges Risiko-Ereignis mit echter Verlustmoeglichkeit, das
> Elite-Bollwerk eine 24h-Dauereinnahme - Gleichstand je Stunde wuerde P10 zur Pflichtroutine
> machen. **Nachteil, ausdruecklich:** bei 2,0x liegt der Erwartungswert im Fall
> `voll 1,75x/Deckel 100` bei +4,81 Mrd und damit ueber dem Raid-Tag (7,56 Mrd bei 24 h gegen 1,8 h
> hier) - die Kadenz aus 4.8 muss das auffangen, sonst wird P10 die dominante Einnahme.
> **Zu 4.7:** der Anteil von 50 % ist gerechnet und tragfaehig, aber er muss auf die bis zum
> letzten UEBERSTANDENEN Check gesicherte Beute begrenzt werden, nicht auf die des verlorenen
> Checks - sonst zahlt der Niederlage-Pfad bei hoher Check-Tiefe mehr als ein frueher Sieg.

**4.8 Cooldown einbauen (Neubau, existiert heute nicht).**
`createGroupOperation()` prueft nur Sektor, Schiffstypen und Bestand. Anflug plus 6 Checks ergeben
rund 2 Stunden, also bis zu **12 Durchlaeufe/Tag**. Bei K = 0,5 waeren das +95,5 Mrd/Tag - das
**4,4-fache der gesamten Baseline** - und 2.400 DM/Tag gegen 1.088 aus dem ganzen uebrigen Spiel.
-> Ein Durchlauf je Teilnehmer und Tag. Damit liegt P10 bei rund +8 Mrd je Durchlauf, zwischen einem
Raid-Tag (6,31) und einer Elite-Serie (32,60) - passend zu 2 h gebundener Flotte gegen 24 h.

> **NEU GERECHNET AM 15.08.2026 - beide Zahlen der Rechnung oben waren falsch, das Ergebnis
> bleibt aber richtig.** Der Nenner war die alte Baseline von 21,69 Mrd/Tag, die seit dem
> Abschluss von Block A nicht mehr gilt; der Zaehler stammte aus den Admiral-Messungen vom
> 08.08.2026, also von vor dem Overkill-Deckel.
> - Gemessen liefert ein Durchlauf bei K = 0,5 heute **11,2 Mrd netto** (reale Flotte, Profil
>   `voll`), nicht 8. Zwoelf Durchlaeufe waeren **134 Mrd/Tag**.
> - Bezogen auf die neuen Tageseinnahmen von 0,80 / 19,82 / 76,85 Mrd (frueh/mittel/spaet) ist das
>   im spaeten Ausbaustand das **1,7-fache aller uebrigen Einnahmen zusammen** und das
>   **2,4-fache des Elite-Bollwerks** (56,9 Mrd/Tag). Im mittleren Stand waere es das
>   Sechseinhalbfache. Der Cooldown ist damit noch dringender als bisher angenommen.
> - **Ein Durchlauf pro Tag ergibt bei K = 0,5 rund 11 Mrd**, also 15 % der spaeten
>   Tageseinnahmen - deutlich mehr als ein Raid-Tag nach Variante 6 (7,56 Mrd) und rund ein
>   Fuenftel des Elite-Bollwerks. Das ist ein vertretbarer Korridor, haengt aber vollstaendig an
>   K und gehoert deshalb mit 4.5 zusammen entschieden, nicht davor.

> **SCHRITT 5 - GERECHNET AM 16.08.2026. Die "rund 2 Stunden" stimmen, die Herleitung im Plan war
> aber falsch.** Das Kampffenster sind `ADMIRAL_TOTAL_CHECKS` (6) x `ADMIRAL_CHECK_INTERVAL_MS`
> (10 min) = **1 h**, nicht die 4 h aus `PIRATEN_CHECK_INTERVAL_MS`. Die im selben Abschnitt
> genannten "3,8 h Hinflug" sind keine Konstante: der Anflug laeuft ueber
> `galaxyDurationMs(distanz, tempo)` = 10 s + 925 x Wurzel(Distanz x 10 / Tempo) und haengt am
> LANGSAMSTEN Schiff. Das ist in beiden Messflotten der **Imperator (speed 100)**, der in P10
> ausdruecklich erlaubt ist.
>
> | Distanz | Anflug | hin + zurueck + Kampf | max. Durchlaeufe/Tag |
> |---|---|---|---|
> | 1 | 0,08 h | 1,17 h | 20,5 |
> | 25 | 0,41 h | 1,82 h | 13,2 |
> | 100 | 0,82 h | 2,63 h | 9,1 |
>
> Die "12 Durchlaeufe/Tag" liegen also richtig in der Groessenordnung, sind aber
> entfernungsabhaengig (9 bis 21). Tagesbeitrag der Leitzelle `voll 2x / Deckel 300` bei
> Sieg-Bonus 1,5x (Erwartungswert 0,91 Mrd je Durchlauf, 1,82 h gebunden):
>
> | Cooldown | Durchlaeufe/Tag | Tagesbeitrag | Anteil an 76,85 Mrd |
> |---|---|---|---|
> | ohne (nur Reisezeit) | 13,2 | 12,06 Mrd | 15,7 % |
> | 6 h | 4,0 | 3,65 Mrd | 4,8 % |
> | 12 h | 2,0 | 1,83 Mrd | 2,4 % |
> | 24 h | 1,0 | 0,91 Mrd | 1,2 % |
>
> **VORSCHLAG: ein Durchlauf je Teilnehmer und Tag bleibt bestehen**, aber die Begruendung aendert
> sich. Die alte Rechnung (+95,5 bzw. +134 Mrd/Tag ohne Cooldown) hing an K = 0,5; mit der
> Beute-Kurve statt eines freien K sind es ohne jeden Cooldown nur 12 Mrd/Tag, also 15,7 % der
> spaeten Baseline. **Der Cooldown ist damit kein Notbremse-Mechanismus mehr, sondern eine
> Geschmacksentscheidung:** ohne ihn wird P10 zur wiederholbaren Standardrunde, mit ihm bleibt es
> ein Ereignis. Bei Sieg-Bonus 2,0x (Vorschlag 4.6) verdoppelt sich der Tagesbeitrag jeweils
> ungefaehr - bei einem Durchlauf/Tag rund 2 Mrd, bei 6 h Cooldown rund 8 Mrd und damit auf
> Hoehe eines Raid-Tages.
> **Offen und bewusst nicht mitentschieden:** die 200 DM je Sieg. Der DM-Vergleich (2.400/Tag
> gegen 1.088 aus dem uebrigen Spiel) stammt aus der alten Rechnung mit 12 Durchlaeufen und
> gehoert bei einem Durchlauf/Tag neu bewertet.

**Ausserdem (kein eigener Entscheidungsbedarf):**
- `ADMIRAL_ESCORT_BASE` ist toter Code (nirgends importiert). Der Kommentar beschreibt eine feste
  Eskorte, tatsaechlich ist sie ueber `generateCappedFleet()` voll machtskaliert. Entfernen oder
  Kommentar korrigieren.
- ~~Der Boss selbst skaliert nicht mit Forschung~~ **-> AUFGEWERTET AM 16.08.2026: das ist kein
  Nebenpunkt, sondern der Hebel von 4.3.** `sideBStatsOverride` umgeht `getEffectiveStats()`, die
  Eskorte bekommt ueber `PIRATE_RESEARCH_SHARE = 1,0` den vollen Forschungsstand, der Boss nicht.
  Gemessen zieht die Forschungsskalierung des Bosses die Spanne zwischen den Ausbaustaenden von
  rund 4:1 auf rund 1,5:1 zusammen - ohne sie gibt es keinen Faktor, der die Zieltiefe 3-5 fuer
  mehr als einen Ausbaustand trifft. Details im Schritt-5-Kasten bei 4.3.
- **Kein Rueckflug:** `finalizeAdminEncounter()` schreibt Ueberlebende direkt in `pState.fleet`
  (~Zeile 641-645), es gibt kein `returnTime` wie bei `finalizeGroupExpedition()`. Hinflug dauert
  3,8 h, Rueckflug null. Nachziehen.
- `rollBattleModifier()` wird in `runAdminCheck()` gar nicht aufgerufen, `BATTLE_MODIFIER_CHANCE`
  hat keinen `piraten_admiral`-Eintrag. Bewusst entscheiden.

**Messkriterien:**
- `run_admiral_rebalance.mjs` ueber **alle vier Ausbau-Profile**, nicht nur `voll`. **Erledigt am
  15.08.2026** - das Skript laeuft jetzt ueber alle vier. Die Sorge, die 45-%-Schwelle koenne bei
  `mittel`/`schwach` zu frueh greifen, hat sich anders bestaetigt als vermutet: bei `mittel` wird
  sie nie erreicht (0,6 % Verlust), bei `schwach` immer.
- **Zielwert erreichte Check-Tiefe: 3-5**, nicht 1 (heute: 1,0 in allen Szenarien).
  **Nach 4.1 + 4.2 weiterhin 1,00 in drei von vier Profilen** - der Zielwert ist ueber diese
  beiden Punkte nicht erreichbar, siehe Kasten oben und die Korrektur bei 4.3.
- `run_aggregate_threshold.mjs` gegen den Boss MIT Mehrfachziel-Salve.
- **Neu ab 15.08.2026:** jede Aenderung an der Gegnerstaerke wird gegen Abschnitt G von
  `admiral_defeat.txt` gehalten (Kippbereich 2x bis 4x) und in Schritten von hoechstens 0,5x
  gemessen, nicht in Verdopplungen. **Praezisiert am 16.08.2026:** Abschnitt G misst nur Check 1
  und taugt nur noch als Grobrahmen; massgeblich ist die volle Serie in `admiral_strength.txt` /
  `admiral_bossscale.txt`. Der Kippbereich verschiebt sich mit der Boss-Forschungsskalierung von
  2x-4x auf 1,25x-2x.
- **ERLEDIGT am 16.08.2026:** `MAX_ROUNDS` bleibt bei 100 (Nutzervorgabe, Begruendung im
  Deckel-Kasten bei 4.3). Der Punkt ist damit kein Blocker mehr; 4.3 laeuft auf Faktor 1,75x.
  Zur Einordnung, warum die Frage ueberhaupt gestellt werden musste: Der Deckel wirkt heute als versteckte Schwierigkeits-Stellschraube und
  ausschliesslich zulasten starker Konten (bei `voll` steigt die Siegquote von 47,5 % auf 87,5 %,
  wenn er von 100 auf 1000 angehoben wird, bei `mittel` bewegt er praktisch nichts). Gemessen wird
  ueber Messbuilds mit ersetzter kompilierter Konstante, der Quellcode bleibt dabei unberuehrt. **Am 16.08.2026 entschieden vorbereitet:** kein anderer Sektor erreicht den Deckel (piraten_elite im Schnitt 35 Runden, Maximum 45 ueber alle Sektoren), eine Anhebung auf 300 ist damit ohne Nebenwirkung auf die Baseline aus Block A - Empfehlung 300.
- `run_aggregate_threshold.mjs` gegen den Boss MIT Mehrfachziel-Salve. **Erledigt am 17.08.2026 -
  mit einem Befund zum Messwerkzeug selbst:** der Einzeltyp-Aufbau des Skripts kann die Salve
  grundsaetzlich nicht abbilden (sie trifft je ein Exemplar PRO Typ, bei einem Typ ist das ein
  normaler Treffer) und ist ab der 4.4-Mechanik ausserdem saturiert. Dafuer gibt es jetzt
  `run_aggregate_threshold_44.mjs` mit Mischflotte. **Wer kuenftig eine Mehrfachziel-Faehigkeit
  misst, braucht mehrere Zieltypen in der Testflotte** - sonst misst er sie gar nicht.
- **SCHRITT 5 GESCHLOSSEN am 17.08.2026.** 4.3 entschieden (Deckel 100, Faktor 1,75x plus
  Boss-Forschungsskalierung, nach 4.4 gegengemessen und bestaetigt), **4.4 entschieden**
  (RapidFire umstellen, Mehrfachziel-Salve verworfen), 4.5 entfaellt zugunsten der Beute-Kurve aus
  Entscheidung 2, 4.6 mit Vorschlag 2,0x, 4.7 bestaetigt mit Deckelung auf den letzten
  ueberstandenen Check, 4.8 bestaetigt mit neuer Begruendung. Damit ist **Block B vollstaendig**.
  Offen bleiben nur die beiden Vorschlaege 4.6 und 4.7, die keine weitere Messung brauchen,
  sondern eine Bestaetigung.

---

### Entscheidung 5 - Piratenbasen: GARNISON SKALIERT MIT

**Bezug:** Session 4, Befund 6. **Dateien:** `game/pirateBaseState.ts` (`SEED_FLEET`, `SEED_DEFENSE`,
`RESOURCE_CAP`, `PIRATE_BASE_LOOT_PERCENT`), `data/economy.ts`
(`NPC_PRODUCTION_BONUS_MULTIPLIER`).

**Ziel:**
- Garnison an die angreifende Flotte koppeln (Muster: `PIRATEN_MULTIPLIER_ROLL`, alternativ das
  fuer genau diesen Zweck kalibrierte `OUTPOST_MULTIPLIER_ROLL` aus dem entfernten
  Aussenposten-System - **vor Entscheidung 11 sichern**). ~~`SEED_FLEET` bleibt Untergrenze.~~
  **Korrigiert 09.08.2026: `SEED_FLEET` bleibt NICHT als feste Untergrenze bestehen** - siehe 5a
  weiter unten. Der Satz stammt aus der Zeit vor der Reset-Entscheidung und widersprach ihr.
- **Zielniveau: zwischen Solo-Sektor Hoch und Elite-Bollwerk.**
- Beute an die tatsaechlich vernichtete Garnison koppeln statt an einen festen Prozentsatz des
  Lagers - dieselbe Mechanik wie Entscheidung 2, gemeinsam umsetzen.
- `RESOURCE_CAP` neu rechnen: der Kommentar rechnet mit `NPC_PRODUCTION_BONUS_MULTIPLIER = 1.5` und
  zielt auf 3 Wochen Wachstum, der Multiplikator steht inzwischen auf **6**. Real ist der Deckel in
  **6,5 Tagen** erreicht, nicht in 21.

**Begruendung:** Heute fuer kleine Flotten unspielbar (89,6 % Verlust) und fuer entwickelte Flotten
bedeutungslos (0 % Verlust, 32,2 Mio Beute = 0,15 % eines Tageseinkommens; alle vier Basen zusammen
56,3 Mio/Tag = 0,3 % der Baseline).

**ZWINGEND mitliefern - sonst entsteht ein neuer Fehler:** Wenn die Beute an der vernichteten
Garnison haengt statt am Lagerbestand, entfaellt die natuerliche Bremse. Die Basis wird zur beliebig
oft ausbeutbaren Quelle, sobald die Garnison nachwaechst. Es braucht eine zusaetzliche Schranke:
**Angriffe pro Basis und Tag begrenzen ODER eine echte Erholungszeit der Garnison.** Ohne das
tauscht man ein totes Feature gegen die neue beste Farmroute des Spiels.

**NACHTRAG 09.08.2026 (Code-Pruefung) - zwei Ergaenzungen, ohne die diese Entscheidung ihr Ziel
verfehlt:**

**5a. Der `SEED_FLEET`-Boden muss mitfallen, sonst loest Entscheidung 5 die Startphase NICHT.**
`SEED_FLEET` sind **5.300 Schiffe** (2.000 leicht / 1.500 schwer / 800 kreuzer / 400 schlachtschiff /
300 bomber / 150 schlachtkreuzer / 100 zerstoerer / 50 reaper) plus 1.120 Verteidigungsanlagen,
festgeschrieben als dauerhafte Untergrenze (Floor-Up in `loadPirateBase()`, "unzerstoerbare
Basis"-Design). Der urspruengliche Text dieser Entscheidung laesst die Garnison mitskalieren, behaelt
den Boden aber ausdruecklich bei. **Nach dem Reset ist genau dieser Boden das Problem.** Die
gemessenen **89,6 % Verlust bei kleiner Flotte** blieben unveraendert bestehen, obwohl die
Skalierung eingebaut waere - der Boden greift ja zuerst.

*Begruendung korrigiert am 10.08.2026 (Code-Pruefung, Messregel 16):* hier stand "ein Spieler in
Woche 1 hat Dutzende Schiffe, nicht Tausende". **Das ist falsch.** `defaultPlayerState()` vergibt
50 Mio Metall / 25 Mio Kristall / 10 Mio Deuterium - laut Code-Kommentar bewusst bemessen auf
700 Mining-Schiffe plus 1.500 Begleitschiffe. **Ein Spieler hat in Stunde 0 rund 2.200 Schiffe
finanziert, nicht Dutzende.** Die Entscheidung 5a bleibt trotzdem richtig, aber aus einem anderen
Grund: diese 2.200 Schiffe sind **Wirtschafts- und Eskortschiffe** (Begleitschiff: 350 Waffen,
8.500 Panzerung; Mining-Schiff: 0 Waffen) und stehen 5.300 echten Kampfschiffen bis hinauf zum
Reaper plus 1.120 Verteidigungsanlagen gegenueber. Der Abstand ist eine Frage der Qualitaet, nicht
der Stueckzahl. **Konsequenz fuer die Messung:** das Startprofil der 30-Tage-Simulation darf NICHT
als "leere Flotte" angesetzt werden - wer den Boden gegen eine leere Flotte kalibriert, kalibriert
gegen einen Zustand, den es im Spiel nie gibt. Der Boden muss entweder mit der angreifenden Flotte mitskalieren oder ganz entfallen.
Nachteil: eine frisch angegriffene Basis kann dann kurzzeitig sehr schwach dastehen; das
"unzerstoerbare Basis"-Design braucht dafuer eine Erholungszeit statt einer festen Untergrenze -
dieselbe Schranke, die oben ohnehin gegen Dauer-Farming gefordert ist.

**5b. Vor JEDER Messung an den Basen muss Entscheidung 13.3 stehen.** `loadPirateBase()` fuehrt bei
jedem Laden einen kompletten Bau-Entscheidungsschritt aus, und die Basen werden bei jedem Aufruf der
Galaxie-Ansicht geladen. Die Wachstumsrate einer Basis haengt damit an der Anzahl der Client-Aufrufe
und ist nicht reproduzierbar. Solange das so ist, misst man an den Basen Rauschen. Siehe
Entscheidung 13.3. **ERLEDIGT 17.08.2026** (Block C, Schritt 6) - der Messblocker ist weg.

---

**UMGESETZT UND GEGENGEMESSEN AM 18.08.2026 (Block C, Schritt 7). GESCHLOSSEN.**
Messprotokoll: `balance/session2-simulation/pirate_base.txt`, Abschnitte 1-6 unter der Ueberschrift
"ENTSCHEIDUNG 5 UMGESETZT". Messskript `run_pirate_base.mjs` (neu geschrieben, siehe unten).

**Was gebaut wurde:**

| Teil | Umsetzung | Wert |
|---|---|---|
| Garnison skaliert mit | `rollPirateBaseGarrison()` in neuem `game/pirateBaseCombat.ts`, 50/30/20-Wurf wie die Sektoren | `PIRATE_BASE_MULTIPLIER_ROLL` = [1,15 / 1,45 / 1,70-1,90] |
| Anlagen-Anteil | eigener Faktor, getrennt skaliert wie in `missions.ts` | `PIRATE_BASE_DEFENSE_FACTOR` = 0,16 (Hoch 0,15, Elite 0,18) |
| Boden weg (5a) | Floor-Up in `loadPirateBase()` ersatzlos gestrichen, Migration hebt nicht mehr an | - |
| Erholungszeit | Pruefung beim Absenden UND bei Ankunft | `PIRATE_BASE_RECOVERY_MS` = 20 h |
| Wiederaufbau (5a) | zeitbasiert bis zum Grundbestand, `regenerateGarrison()` | `PIRATE_BASE_REGEN_MS` = 3 Tage |
| Attritions-Deckel | hoechster Bestandsverlust je Angriff | `PIRATE_BASE_MAX_ATTRITION` = 0,35 |
| Beute aus vernichteter Garnison | `pirateBaseLoot()`, Kurve aus Entscheidung 2 | Anker 1,05 Mrd bei 11,18 Mrd, Exponent 0,85 |

**Die geforderte Neuberechnung von `RESOURCE_CAP` ist ersatzlos entfallen, nicht erledigt.** Die
Konstante heisst seit dem 12.08.2026 `LOOT_BASIS_CAP` und wirkte nur noch auf die Beute - und die
haengt jetzt an der vernichteten Garnison. `LOOT_BASIS_CAP` und `PIRATE_BASE_LOOT_PERCENT` sind
damit gestrichen. Der Punkt oben zielte ins Leere; die Angabe "3 Wochen" im alten Kommentar rechnete
ausserdem noch mit `NPC_PRODUCTION_BONUS_MULTIPLIER = 1,5` statt der heutigen 6 (real 6,5 Tage).

**Drei Befunde, die ueber diese Entscheidung hinaus gelten:**

1. **Gleiche Multiplikator-Zahl heisst NICHT gleiche Schwierigkeit.** Die ausgelieferte Tabelle liegt
   nominal ueber der des Elite-Bollwerks [0,90/1,20/1,55] und erzeugt trotzdem weniger Verlust
   (2,9 % gegen 4,4 % je Check). Alle drei zuerst geplanten Kandidaten (A 1,0 % / B 1,6 % / C 2,0 %
   bei der realen Flotte) lagen UNTER dem Abnahmeband von 2,1-4,4 %; erst der nachgezogene Kandidat D
   trifft es. Ursachen: fodder-lastiger Grundbestand statt der Wellenprofile aus `pickWaveProfile()`,
   kein Piratenkapitaen, keine Kampf-Modifikatoren, Einzelkampf statt sechs Checks in Folge. **Wer
   diese Tabelle spaeter anfasst, muss neu messen und darf nicht aus der Zahl schliessen.**
2. **Die Forschungsangleichung war der eigentliche Hebel, nicht die Stueckzahl.**
   `sideBStatsOverride` umgeht `getEffectiveStats()`/`computePirateResearch()` - die Basis kaempfte
   mit ihrer EIGENEN Forschung (frische Basis: Stufe 0), waehrend jeder Sektor-Pirat ueber
   `PIRATE_RESEARCH_SHARE = 1,0` den vollen Stand des Angreifers bekommt. Ohne den Angleich
   (`garrisonResearch()`, elementweises Maximum) waere dieselbe Zahl an der Basis ein deutlich
   schwaecherer Gegner als im Sektor. **Dritte Fundstelle desselben Musters** nach Entscheidung 4.3
   (Boss ohne Forschungsskalierung) - `sideBStatsOverride` ist der gemeinsame Nenner. Bei jeder
   kuenftigen Nutzung dieses Parameters zuerst pruefen, welcher Forschungsstand dort eigentlich
   hineingehoert.
3. **Der Ausbaustand schlaegt staerker durch als die Tabelle.** Dieselbe kleine Flotte verliert mit
   voller Forschung 4,2 %, mit schwacher 56,9 %. Weil die Garnison mindestens auf dem
   Forschungsstand des Angreifers kaempft, liegt der Vorsprung eines entwickelten Spielers allein in
   Klasse, Modulen und Booster - die ein Anfaenger nicht hat. Piratenbasen bleiben Inhalt fuer
   entwickelte Flotten. **Offener Hebel, falls das anders gewollt ist:** nicht die Tabelle, sondern
   ein Forschungsanteil der Garnison unter 1,0.

**Ertragsseite:** ein Angriff der realen Flotte bringt netto rund 1,60 Mrd; vier Basen bei 20 h
Erholung ergeben 5,9-6,4 Mrd/Tag, also rund 8 % der Baseline (76,85 Mrd) - zwischen Solo Hoch
(-3,26 Mrd/Tag) und Elite-Bollwerk (+23,4 Mrd je Serie), wie gefordert.

**Beim Bauen aufgefallen, beide Male stille Fehler:**
- Ohne Attritions-Deckel loeschte EIN Angriff der realen Flotte die komplette Garnison (Welle zu
  100 % vernichtet = 100 % Verlustanteil auf den Bestand). Die Basis waere danach rechnerisch
  Monate lang wertlos gewesen - das tote Feature waere nicht beseitigt, sondern um vier Angriffe
  verschoben worden. Erst der Deckel plus der Wiederaufbau aus 5a ergibt ein Gleichgewicht
  (taegliches Abfarmen pendelt sich bei rund 83 % Gefechtsbereitschaft und -14 % Beute ein).
- `bot.ts` verglich die eigene Angriffsflotte gegen den BESTAND einer Basis mal
  `ATTACK_POWER_SAFETY_MARGIN`. Mit der mitskalierenden Garnison haetten Bots nie wieder eine Basis
  angegriffen. Ersetzt durch Erholungszeit- und Bereitschaftspruefung (Messregel 8 hat das gefunden).

---

---

### Entscheidung 6 - Schiffs-Tiers: WERT JE MACHTPUNKT ANGLEICHEN

> **UMGESETZT UND GEGENGEMESSEN am 18.08.2026 (Block C, Schritt 8).** Geaendert wurde
> ausschliesslich `data/ships.ts`, fuenf Kostenzeilen, keine Mechanik. Messdatei
> `balance/session2-simulation/ship_tiers.txt`, neues Skript `run_ship_tiers.mjs`.
>
> **Zielwert 1,15 statt 1,20**, weil die drei bereits konformen Schiffe bei 1,10 / 1,11 / 1,18
> liegen - ein Ziel am oberen Rand haette den hohen Tiers eine systematische Restbelastung
> gelassen. **Fuenf statt vier Schiffen:** der Kreuzer lag mit 1,33 ebenfalls ausserhalb des
> Korridors; der Plantext nannte ihn nicht.
>
> | Schiff | Kosten neu (M/K/D) | Wert | Wert/Power | Aenderung |
> |---|---|---|---|---|
> | Kreuzer | 311.000 / 109.000 / 31.000 | 567.500 | 1,15 (war 1,33) | -14 % |
> | Bomber | 398.000 / 199.000 / 120.000 | 1.056.500 | 1,15 (war 1,73) | -34 % |
> | Schlachtkreuzer | 183.000 / 244.000 / 92.000 | 825.000 | 1,15 (war 1,89) | -39 % |
> | Zerstoerer | 345.000 / 288.000 / 86.000 | 1.035.000 | 1,15 (war 1,60) | -28 % |
> | Reaper | 370.000 / 239.000 / 87.000 | 989.500 | 1,15 (war 1,59) | -28 % |
>
> Das Mischungsverhaeltnis der drei Ressourcen bleibt je Schiff erhalten - eine Verschiebung waere
> ein verdeckter Eingriff in die Deuterium-Nachfrage gewesen.
>
> **Alle Messungen neu erhoben.** `ships.txt` und `ship_value.txt` stammen von VOR R14/R14b und
> sind fuer diesen Zweck unbrauchbar; beide haben jetzt eine Trennmarke. `run_ship_value.mjs` misst
> zudem das Falsche (Stueckzahl-Quote aus `simulator.ts`, auf ganze Prozent gerundet, im Skript mit
> dem Flottenwert multipliziert - Messregel 4 verlangt die Wert-Bilanz).
>
> **Abnahme:**
> 1. **Korridor erfuellt.** Alle acht Standard-Kampfschiffe liegen jetzt zwischen 1,10 und 1,18.
> 2. **Duell-Matrix erfuellt** (Kriterium war mindestens 30 % Schrumpfung): mittlere Netto-Bilanz
>    je Typ bei 600 Mio Einsatz, Spannweite **774 -> 412 Mio, also -47 %**.
>    Vorher: schwer +400, leicht +312, kreuzer +115, schlachtschiff +81, reaper -21, zerstoerer
>    -159, schlachtkreuzer -237, bomber -374.
>    Nachher: schwer +206, leicht +128, reaper +87, kreuzer +19, zerstoerer -24, schlachtkreuzer
>    -30, schlachtschiff -83, bomber -206.
> 3. **Machtskalierter Sektor nur teilweise, und zwar gegenlaeufig - das ist der wichtigste Befund.**
>    Bei realistischer Feindstaerke (0,85x) steigen die Verlustquoten der verbilligten Schiffe leicht
>    (Reaper 0,0 -> 0,6 %, Schlachtkreuzer 1,3 -> 2,8 %, Bomber 0,0 -> 1,5 %). In der umkaempften
>    Zelle (2,0x) verliert der Reaper seine Sonderstellung vollstaendig: **50 % Siegquote und 39,0 %
>    Verlust vorher, 0 % und 47,1 % nachher.** Ursache: dieselbe Kaufsumme ergibt jetzt 606 statt 439
>    Reaper, und die Gegnerstaerke skaliert mit der MACHT, nicht mit dem ausgegebenen Wert - wer
>    billiger einkauft, kauft sich einen staerkeren Gegner. Genau der gegenlaeufige Effekt, vor dem
>    die Entscheidung warnt. Der wirtschaftliche Gewinn bleibt trotzdem bestehen (mehr vernichtete
>    Feindmacht und damit mehr Beute je eingesetzter Ressource, siehe Entscheidung 2), er zeigt sich
>    nur nicht in der Verlustquote.
> 4. **Nicht erreicht, wie vorhergesagt:** Jaeger bleiben in der Duell-Matrix vorn (+128 / +206).
>    Ursache ist nicht der Preis, sondern `SIZE_MISMATCH_EVASION_BONUS` (+45 Prozentpunkte
>    Ausweichchance gegen grosse Schiffe) - das liegt in Entscheidung 16 und wurde hier bewusst
>    nicht nachgebessert.
> 5. **Bomber bleibt Schlusslicht** (-206 Mio). Sein RapidFire wirkt ausschliesslich gegen
>    Verteidigungsanlagen, im Schiffsduell hat er nichts. Struktureller Rollen-Befund, kein
>    Kostenproblem - eine weitere Verbilligung wuerde ihn zum billigsten Machtpunkt im Spiel machen,
>    ohne das Duell zu aendern.
>
> **Salvenschiffe und Imperator: gemessen, bewusst NICHT geaendert.**
> Salvenjaeger 54,26 / Salvenkreuzer 44,84 / Salvendreadnought 58,46 Wert je Machtpunkt - mit der
> Korrektur `MULTI_TARGET_POWER_CORRECTION = 8`, an der die Gegnerstaerke tatsaechlich haengt, sind
> es 6,78 / 5,61 / 7,31. Beides um ein Vielfaches ausserhalb des Korridors; sie hineinzuziehen
> hiesse rund 80 % Kostensenkung und wuerde die auf `maxCount` kalibrierte Salven-Mechanik
> aushebeln. **Der Befund aus `ship_value.txt` (Salvenkreuzer 14 % Siegquote, 93,8 % Verlust) ist
> nach R14 bestaetigt und verschaerft** - als reine Einzeltyp-Flotte jetzt 0 % Sieg und 100 %
> Verlust. Er ist ein Messartefakt der Zelle, nicht ein Kostenbefund: 47 Salvenkreuzer treten mit
> 11,8 Mio echter Panzerung gegen einen auf 106,5 Mio Macht skalierten Gegner an, weil die
> Achtfach-Korrektur ihre eigene Flottenmacht aufblaeht. Ihre Rolle ist die Beimischung.
> Der Imperator liegt bei 250 Wert je Machtpunkt (Teile-Gegenwert 325.000 je Teil aus
> `TEILE_CONVERT_RESOURCES`). Auch nach der in Abschnitt 8, Punkt 3 beschlossenen Halbierung der
> Teile-Kosten waeren es 125 - der Korridor ist fuer ihn strukturell unerreichbar. Das gehoert als
> Randbefund zu Punkt 3, nicht hierher.
>
> **Messregel 8 erfuellt:** im Client nach hartkodierten Schiffskosten gegreppt, keine gefunden -
> Werft und Schrotthaendler beziehen die Kosten ueber `/game/data` vom Server.
>
> **Nebenwirkung, dokumentiert:** das Kostenband je Waffenpunkt verschiebt sich von 68-133 auf
> 59-90. Die Verteidigungsanlagen sind laut README an genau diese Kosteneffizienz gekoppelt
> (Zielwert rund 65) und werden dadurch relativ etwas staerker. README-Zahlenbasis nachgezogen.
> Ausserdem sinkt der Punktwert der verbilligten Schiffe (`getUnitPointValue()` rechnet mit der
> rohen Kostensumme), Abschuesse der hohen Tiers geben also weniger Punkte.

**Bezug:** Session 4, Befund 7 / Session 3, Befund 3. **Dateien:** `data/ships.ts`.

**Ziel:** Zielkorridor **1,1-1,3 Wert je Machtpunkt ueber alle Tiers**. Reine Kostenaenderung an
vier Schiffen, keine Mechanik anfassen.
Heute: Leichter Jaeger 1,11 / Schwerer Jaeger 1,18 / Schlachtschiff 1,10 gegen **Schlachtkreuzer
1,89 / Bomber 1,73 / Zerstoerer 1,60 / Reaper 1,59** - die hohen Tiers kosten 45-70 % mehr pro
Machtpunkt.

**Begruendung:** Bei gleichem Ressourceneinsatz schlaegt Tier 1 die Tiers 5-7 deutlich (Leichter
Jaeger gegen Reaper: +425 Mio Restwert). Der obere Teil des Schiffsbaums ist damit eine Falle fuer
jeden, der ihn erforscht.

**RapidFire NICHT anheben** - das wuerde die gesamte Sektor-Balance aus Session 2 mitverschieben.

**Realistische Erwartung:** In allen Inhalten mit machtskalierter Gegnerflotte (Solo-Sektoren,
Elite-Bollwerk, Raid, Admiral) hebt sich der Effekt weitgehend auf - billigere Schiffe erzeugen
staerkere Gegner. Voll wirksam nur bei Gegnern mit FESTER Staerke, also aktuell nur bei den
Piratenbasen (Entscheidung 5). Billig umzusetzen, liefert aber weniger als die Zahlen vermuten
lassen.

**Messkriterien: JEDE Kostenaenderung an ZWEI Messungen pruefen** - sie koennen gegenlaeufig
ausschlagen:
1. Duell bei gleichem Wert (`run_ships.mjs`)
2. Machtskalierter Sektor (`run_ship_value.mjs`)

**Zusaetzlich:** Der README-Zielkorridor "ca. 65 Kosten je Waffenpunkt, Schiffe bei ~57-90" ist
ueberholt (real 68-133 bei Schiffen, 397-623 bei Spezialschiffen, 557 beim Sandronator). Beim
Umsetzen dieser Entscheidung die Zahlenbasis in der README nachziehen.

**Nebenbefund zur Dokumentation:** Die RapidFire-"Kette" ist linear, nicht zyklisch. `leicht: {}`
hat gar kein Ziel, Bomber und Reaper werden von KEINEM Standard-Kampfschiff gekontert. Der
README-Satz zum Schlachtkreuzer gegen Jaeger ist falsch (er hat kein RapidFire gegen Jaeger und
verliert mit -553 bis -556 Mio). README korrigieren.

**Salvenschiffe (keine Aenderung noetig, nur dokumentieren):** Sie brechen als reine Einzeltyp-
Flotte zusammen (`MULTI_TARGET_POWER_CORRECTION = 8` erzeugt einen achtfach staerkeren Gegner), sind
aber als Beimischung in eine gemischte Flotte die beste Ergaenzung ueberhaupt. Reine Rollen-
Einheiten - **das steht nirgends im Spiel.** Ins Info-Popup aufnehmen.

---

### Entscheidung 7 - Allianz-Station: RELATION GLATTZIEHEN, KOSTENKURVE ANGLEICHEN

> **7.1 ERLEDIGT am 10.08.2026** (V2 = 2x Ertrag, V3 = 4x Ertrag). Zusaetzlich ist ein im Plan
> nicht enthaltener Befund behoben worden - der fehlende Ausgleich fuer die bewusst entkoppelte
> Mining-Forschung. Beides samt Messwerten und offenem Kalibrierpunkt in **Abschnitt 2a**.
> **7.2, 7.3 und 7.4 stehen unveraendert aus.**

**Bezug:** Session 4, Befund 1 + 2 + 3 / Session 1, Befund 2 / Session 3, Befund 9. **Dateien:**
`data/stationBuildings.ts`, `game/stations.ts` (`checkTierUnlock()`,
`stationBauzeitFactorForTier()`), `data/buildings.ts`.

**7.1 Stufen-Relation:** V2 = **2x Kosten / 2x Ertrag**, V3 = **4x Kosten / 4x Ertrag**
(heute: 2x/1,5x und 4x/2,5x). Grund: Heute wird jede Ausbaustufe unwirtschaftlicher als die
vorherige (210 -> 285 -> 339 Tage Amortisation), obwohl sie als Fortschritt praesentiert wird.
Dieselben Multiplikatoren gelten auch fuer die Heimatbasis - dort federt der fehlende Level-Cap das
ab, an der Station mit Cap 30 fehlt dieser Vergleichspunkt.

**7.2 Freischalt-Zwang bleibt, dafuer Kostenkurve angleichen.** `checkTierUnlock()` verlangt alle
drei Minen auf dem Cap. Alle drei liefern bei Level 30 exakt denselben Wert-Ertrag (5,2 Mio/h),
kosten aber das **1-, 3,8- und 6,9-fache**. Der Zwang schickt den Spieler gezielt in die beiden
teuersten.
-> `costGrowth` (1.6 gegen 1.55) und `baseCost` von Kristallmine und Deuterium-Synthetisierer an den
Wert-Ertrag angleichen. **Das behebt denselben Fehler an der Heimatbasis mit** (Session-1-Befund 2:
"Metallmine ausbauen und tauschen" ist um Faktor 2,8 bzw. 5,0 effizienter als der direkte Ausbau -
damit der Deuterium-Ausbau gleichwertig waere, muesste die Handelsgebuehr bei 84 % liegen).
-> `TRADE_FEE` NICHT anheben. Ursache reparieren, nicht Symptom.

**7.3 Stations-Module:** `requiredBuildingLevel` von 20 auf **10** senken (Cap-Verhaeltnis 30 statt
100 bei der Heimatbasis), Modulkosten gegen die Gebaeudekosten anheben. Heute amortisieren die
Module in **17,9 Tagen** gegen 297 Tage fuer die Gebaeude selbst - Faktor 17 zwischen zwei Wegen
desselben Gebaeudes, und der bessere Weg wird erst nach zwei Dritteln der Strecke sichtbar.

**7.4 Stations-Fabriken:** Roboter 15 + Nanit 10 kosten zusammen rund 1 Mrd und druecken den
Bauzeit-Faktor auf 1,3e-5. Es gibt keine Voraussetzungspruefung fuer die Nanitenfabrik. Bauzeit ist
an der Station damit entweder absoluter Blocker (vorher) oder bedeutungslos (danach).
-> Fabrik-Stufen an eine Voraussetzung binden (analog `PARENT_UNLOCK_LEVEL`) oder Effekt pro Stufe
deutlich senken. **Gehoert zu Entscheidung 9, gemeinsam kalibrieren.**

**7.5 ENTFAELLT HIER - verschoben nach Entscheidung 14.** Der Punkt stand faelschlich unter der
Allianz-Station. Code-Pruefung 09.08.2026: **Die Allianz-Station ist NICHT betroffen** -
`data/stationBuildingModules.ts` erzeugt ihre Module per Generator ueber `STATION_BUILDINGS`, und
dort stehen alle drei Stufen drin. Die Luecke betrifft ausschliesslich die **Heimatbasis**
(`data/buildingModules.ts`, handgetippt, nur V1-IDs). Vollstaendig behandelt in Entscheidung 14.

**Bekannter Nachteil:** ~~Die Aenderung an `buildings.ts` wirkt rueckwirkend - bereits bezahlte
Minenstufen waeren danach guenstiger gewesen.~~ **Entfaellt durch den Server-Reset (Abschnitt 1a).**
Selbst mit sauberer Relation bleibt die Station
eine schwache Investition gegenueber Verteidigungsanlagen (unter einer Woche Amortisation). Sie wird
korrekt, nicht attraktiv. **Das ist akzeptiert:** ihre eigentliche Funktion sind die 558 Mrd
Ressourcen-Senke (35 % aller uebrigen einmaligen Senken zusammen).

---

### Entscheidung 8 - Sandronator: REINES WIRTSCHAFTSSCHIFF, SPEED HOCH

**Bezug:** Session 4, Befund 8. **Dateien:** `data/ships.ts`.

**Ziel:** Kampfwerte bleiben, das Schiff wird offen als Mining-Einheit deklariert (Info-Popup,
Ausschluss aus Kampfflotten-Vorlagen). **`speed` von 2.000 auf mindestens 9.000** (Bomber-Niveau).

**Begruendung:** Der Speed ist der eigentliche Schaden. `galaxyFleetSpeed()` richtet sich nach dem
langsamsten Schiff der Flotte - **ein einziger mitgenommener Sandronator vervierfacht bis
versechsfacht die Flugzeit der GESAMTEN Flotte** zu Galaxie-Zielen, Piratenbasen und Sektoren. Die
Kampfwerte (0 % Siegquote bei gleichem Wert gegen Leichte Jaeger, Kreuzer UND Reaper; 557 Kosten je
Waffenpunkt gegen 68-133 bei Standard-Schiffen) sind bei einem einzelnen Exemplar in einer
31.000-Schiffe-Flotte ohnehin Rauschen.

---

### Entscheidung 9 - ZEIT ALS ECHTER ENGPASS (Nutzerwunsch, neu)

> **GEMESSEN UND FESTGELEGT AM 15.08.2026 - der Niveau-Punkt aus Abschnitt 7 ist damit geschlossen
> und Block A vollstaendig.** Messung: `run_income_level.mjs` / `income_level.txt`, 40 Durchlaeufe
> je Kampfzelle, Einnahmen-Modell wie `run_loot_exponent.mjs` (Exponent 0,85, Raid nach Variante 6),
> Bau-Ausstoss aus den echten Schiffsdaten und der echten Funktion `bauzeitMultiplier()`.
>
> **Befund in einem Satz: Die Einnahmen liegen bei 216 bis 321 Prozent des gesamten Flottenwerts
> pro Tag. Die Flotte ist keine Senke, sie ist Verbrauchsmaterial.**
>
> Daraus folgen vier Festlegungen:
>
> **(1) Die Kennzahl wird umgestellt.** "+10 % Flottenwert" wird als Massstab aufgegeben. Sie ist
> skalenfrei und deshalb in jedem Ausbaustand trivial klein - beim spaeten Stand sind 10 % der
> Flotte 3,5 Mrd gegen 76,85 Mrd Tageseinnahmen. Neu gilt:
> - **Ressourcen-Seite:** Band 3-10 Tage fuer den naechsten LEITER-Schritt (Gebaeudestufe,
>   Modulstufe, Forschungsstufe, Stationsausbau). Das ist bereits weitgehend erfuellt - gemessen
>   liegen alle Schiffs-Module bei 7,16 Tagen und die volle Heimatbasis V1 bei 9,99 Tagen im
>   mittleren Stand.
> - **Zeit-Seite:** Band 3-10 Tage fuer eine **Verdopplung der Flotte** (reine Bauzeit). Heute:
>   0,24 / 0,70 / 1,97 Tage bei 1 Lane.
>
> **(2) Das Einnahmen-Niveau bleibt unveraendert.** Weder der Beute-Anker noch die Schiffskosten
> werden angefasst. Gemessen waere fuer das Band ein Kostenfaktor von 65 bis 220 auf alle Schiffe
> noetig - das verschiebt gleichzeitig Entscheidung 6, die Feindstaerke-Skalierung und den am
> 14.08.2026 gemessenen Anker.
>
> **(3) Der Engpass kommt vollstaendig aus diesem Block, und zwar aus bereits beschlossenen
> Teilen.** Noetig ist beim spaeten Stand ein Gesamtfaktor von rund 15 auf die Schiffs-Bauzeit
> gegenueber heute. Er setzt sich zusammen aus:
> - **3 Lanes -> 1 Lane (9.2): Faktor 3.** Steht bereits fest.
> - **Additive statt multiplikativer Reduktionen (9.1b), ausgeweitet auf SCHIFFE: Faktor rund 3
>   beim vollen Ausbau, rund 2 im mittleren Stand, rund 1 in der Startphase.** Gemessen faellt der
>   Multiplikator heute von 9,51e-1 (nichts gebaut) auf 8,61e-2 (Vollausbau) - derselbe
>   Sechs-Quellen-Stapel, den 9.1b fuer Gebaeude bereits auf additiv umstellt. **Der Anwendungs-
>   bereich in 9.1c ("Schiffe: Untergrenze genuegt") ist damit ueberholt** - eine Untergrenze
>   deckelt den Stapel, staffelt ihn aber nicht nach Ausbaustand.
> - **Basis-Bauzeiten x2.** Bewusste Abweichung von 9.1c. Begruendung dort war, eine Anhebung
>   traefe nur die Startphase - gemessen betrifft x2 die Startphase mit einer Verdopplungszeit von
>   6 auf 12 Stunden, also unterhalb jeder Wahrnehmungsschwelle, waehrend ohne sie der mittlere
>   Stand bei 1,5 Tagen und damit unter dem Band bleibt.
>
> **Ergebnis dieser Zusammensetzung (gerechnet auf die gemessenen Ausstosswerte): Flotten-
> Verdopplung in rund 12 Stunden / 2,9 Tagen / 11,8 Tagen.** Startphase praktisch unangetastet,
> Band ab dem mittleren Stand getroffen.
>
> **(4) Der Zielwert "Bau-Ausstoss grob in der Groessenordnung der Tageseinnahmen" ist gestrichen.**
> Er stammt aus der Zeit vor der Rangentscheidung und widerspricht ihr direkt: trifft der
> Bau-Ausstoss das Band, liegt er beim spaeten Stand bei 3-6 Mrd/Tag gegen 77 Mrd/Tag Einnahmen.
> **Ersatz-Zielwert: der Ueberschuss muss eine ZWEITE Senke finden, nicht kleiner werden.** Die
> Gebaeude-Leiter leistet das von selbst - gemessen kostet eine einzelne Metallminen-Stufe ab
> Stufe 41 drei Tage Einnahmen (heute Stufe 36), beim Deuterium-Synthetisierer ab Stufe 36 (heute
> 30). Die einzige echte Luecke sind die Forschungskosten: alle 21 Forschungen zusammen kosten
> **2,04 Mrd = 38 Minuten Einnahmen** im spaeten Stand. Das ist der Auftrag an 9.4, und der noetige
> Faktor liegt bei rund 100, nicht bei 2 oder 3.
>
> **Zwei Nebenbefunde aus derselben Messung, beide NICHT Teil dieser Entscheidung:**
> - **Das Elite-Bollwerk stellt 74 % der Einnahmen im spaeten Stand** (54 % im mittleren). Das
>   Niveau haengt damit an einem einzigen Inhalt. Steht als neuer Punkt in Abschnitt 7.
> - **Abnahmekriterium 5 aus Abschnitt 1b ist im fruehen Stand heute verletzt:** die passiven
>   Quellen (Asteroiden + Heimatbasis) stellen 89 % der Einnahmen. Gehoert zu Entscheidung 12.

> **RANGENTSCHEIDUNG 14.08.2026 (Nutzervorgabe, direkt erfragt):** Von den beiden moeglichen
> Engpaessen ist **ZEIT der Haupt-Engpass, Ressourcen ein spuerbarer Neben-Engpass** - nicht
> umgekehrt. Damit ist der neue Niveau-Punkt in Abschnitt 7 entschieden: Weg (c), ergaenzt um einen
> Rest von (b). **Weg (a) - den Beute-Anker absenken - ist damit vom Tisch**, die am 14.08.2026
> gemessenen 0,0956 Wert-Einheiten je Punkt Feindmacht bleiben.
> **Konsequenz: Entscheidung 9 ist nicht mehr eine Einzelentscheidung unter vielen, sondern der
> Traeger des gesamten Spielgefuehls.** Alles, was hier zu schwach kalibriert wird, laesst sich
> ueber keine andere Stellschraube auffangen - Ressourcen sollen ausdruecklich NICHT knapp genug
> sein, um das zu uebernehmen.
> **Offener Widerspruch, der in Block D mitentschieden werden muss:** Die dritte Geschmacksfrage aus
> Abschnitt 8 lautet "Verluste spuerbar, aber nie Totalverlust". Sind Ressourcen nie knapp, kostet
> ein verlorener Kampf praktisch nur Wiederaufbau-ZEIT und keinen echten Rueckschlag. Entweder wird
> der Verlust bewusst als Zeitverlust definiert (dann ist die Warteschlange die Strafe), oder die
> Ressourcen muessen genau an dieser einen Stelle doch spuerbar sein.

**Nutzervorgabe:** Bauzeiten jeder Art, Forschungszeit und Kosten anpassen. Forschung von 4
gleichzeitigen Slots auf **1 mit Warteschlange**, alle Baumoeglichkeiten ebenfalls auf **1 mit
Warteschlange**. Beobachtung des Nutzers: Forschung, Gebaeudebau, Schiffsbau und Module gehen zu
schnell. **Die Beobachtung ist durch die Messungen bestaetigt.**

**Dateien:** `game/actions.ts` (`roboterNaniteFactor()` ~Zeile 55, `bauzeitMultiplier()`,
`defenseBauzeitMultiplier()`, `researchTimeMultiplier()` ~Zeile 161, `researchCostForLevel()`/
`researchTimeForLevel()` ~Zeile 771-782), `data/research.ts` (`costGrowth` 1.8, `timeGrowth` 1.6),
`data/combatConstants.ts` (`MAX_BUILDING_SLOTS`, Bau-Lanes), **`client/src/lib/multipliers.ts`
(Spiegel, MUSS synchron geaendert werden - README Punkt 1)**.

#### Ausgangslage (gemessen)

| Bereich | Heutiger Zustand |
|---|---|
| Gebaeude-Bauzeit | Faktor **8,06e-8** (mit Automatisierungs-Modul 5,64e-8). Metallmine Stufe 36: 18.224 h -> **14 Minuten** |
| Schiffs-Bauzeit | Faktor 6,68e-2, Ausstoss **26-43 Mrd Wert/Tag** bei 3 Lanes gegen 21,69 Mrd Tageseinnahmen |
| Forschungszeit | 2.315 Tage seriell roh, 810 Tage mit Dauer-Booster, **203 Tage bei 4 Slots** |
| Forschungskosten | Alle 21 Forschungen Stufe 10: **2,04 Mrd = zwei Stunden Einnahmen** |
| Forschungs-Wirkung | Saettigt bei **Stufe 8**; die Stufen 9+10 kosten **61,5 % der Gesamtzeit** und liefern messbar nichts |

#### Umsetzung in DIESER Reihenfolge (Bedingungen, nicht optional)

**9.1 ENTSCHIEDEN 09.08.2026: SAETTIGUNGSKURVE STATT UNTERGRENZE.**
Der urspruengliche Vorschlag (`Math.max(0.02...0.05, ...)` in `roboterNaniteFactor()`) ist
**verworfen.** Begruendung und Ersatz siehe unten. Der Zielwert **1-5 Tage je hoher Ausbaustufe**
bleibt unveraendert.

**Warum die Untergrenze nicht funktioniert (nachgerechnet):**
Metallmine Stufe 36 dauert roh **759 Tage**. Mit Untergrenze 0,05 sind das 38 Tage - genau der Wert,
den diese Entscheidung selbst als zu lang ausschliesst. Mit 0,02 noch 15 Tage. Fuer den Zielkorridor
1-5 Tage braeuchte es rund 0,005 - dann dauert Stufe 45 rund 76 Tage und Stufe 50 ueber ein Jahr.
Gebaeudestufen haben **kein Limit** (README Punkt 8), die Rohzeit waechst mit `timeGrowth` 1,35 je
Stufe unbegrenzt weiter. Eine feste Untergrenze deckelt die Bremse, nicht das Wachstum: sie
verschiebt die Mauer nur nach hinten, sie entfernt sie nicht. Das laeuft direkt gegen die
Nutzervorgabe "dauerhaft, kein Endpunkt".

**Zweiter Befund, der die Untergrenze zusaetzlich entwertet:** Die Bauzeit wird heute von **sechs
unabhaengigen Reduktionsquellen MULTIPLIKATIV** gesenkt - Bauzeit-Forschung (bis 0,3),
kategorie-spezifische Forschung (bis 0,5), gebaeudeeigenes Bauzeit-Modul (bis 0,5), Roboterfabrik
(0,75 je Stufe), Nanitenfabrik (0,50 je Stufe) und Bautempo-Booster/Samstags-Event. Jede fuer sich
ist vertretbar; multipliziert ergeben sie bei vollem Ausbau rund **0,002**. Selbst mit korrigiertem
`timeGrowth` landet ein voll ausgebauter Spieler damit wieder bei knapp **24 Minuten** fuer eine
Stufe-36-Mine. **Das ist derselbe Fehler wie beim Frischling-Bonus (Entscheidung 12): viele einzeln
harmlose Boni, die multiplikativ gestapelt werden.**

**Die Entscheidung besteht aus drei Teilen:**

**9.1a Saettigungskurve fuer Gebaeude-Bauzeiten.**
```
effektiveZeit = rohZeit / (1 + rohZeit / T_cap)
```
Die Kurve verhaelt sich bei kleinen Rohzeiten praktisch wie heute (Stufe 1 bleibt 30 Minuten,
Stufe 5 rund 2 Stunden) und naehert sich bei grossen Rohzeiten asymptotisch `T_cap` an - **ohne
diesen Wert je zu ueberschreiten, auf Stufe 36 wie auf Stufe 60.** Es gibt damit weder einen
Kollaps auf Minuten noch eine Mauer.

**9.1b Alle Reduktionsquellen wirken ADDITIV auf `T_cap`, nicht multiplikativ auf die Zeit.**
```
T_cap = T_MAX_BASE / (1 + Summe aller Reduktionen)
```
Vorschlag fuer die Gewichte (Groessenordnung, exakte Werte sind zu messen):

| Quelle | Beitrag zur Summe bei Vollausbau |
|---|---|
| `T_MAX_BASE` | **14 Tage** (Ausgangswert ohne jede Reduktion) |
| Roboterfabrik | 0,15 je Stufe -> 2,25 bei Stufe 15 |
| Nanitenfabrik | 0,30 je Stufe -> 3,00 bei Stufe 10 |
| Bauzeit-Forschung (allgemein) | 1,00 |
| Bauzeit-Forschung Gebaeude | 0,50 |
| Gebaeudeeigenes Bauzeit-Modul | 0,50 |
| Bautempo-Booster / Samstags-Event / Ingenieur | zusammen ~1,00 |

Ergebnis dieser Kalibrierung, nachgerechnet:

| Ausbaustand | Stufe 10 | Stufe 20 | Stufe 36 | Stufe 50 |
|---|---|---|---|---|
| **nichts gebaut** (T_cap 14 d) | 9,8 h | 5,3 Tage | 13,8 Tage | ~14 Tage |
| **voll ausgebaut** (T_cap 1,5 d) | 7,9 h | 1,3 Tage | 1,5 Tage | ~1,5 Tage |

Damit ist alles auf einmal erfuellt: Zielkorridor 1-5 Tage getroffen, keine Mauer bei hohen Stufen,
Startphase praktisch unveraendert (Stufe 1-10 liegen mit und ohne Ausbau dicht beieinander), und
**jede einzelne Reduktionsquelle bleibt spuerbar, ohne dass irgendeine die Zeit auf null druecken
kann.** Der volle Ausbau aller Zeit-Hebel bringt beim gleichen Gebaeude Faktor 9 - ein echtes,
lohnendes Ausbauziel statt einer Zahl nahe null.

**9.1c Basis-Bauzeiten NICHT anheben.** Bei Roboter/Nanit Stufe 0 ist der Reduktionsfaktor exakt 1 -
in Woche 1 gelten also schon heute die vollen Rohzeiten. Eine Anhebung der `baseTimeSeconds` traefe
ausschliesslich die Startphase, also genau die Phase, die dieser Plan schuetzen will (Abschnitt 1a).

**Anwendungsbereich - nach Art der Kurve unterscheiden, NICHT pauschal:**
- **Gebaeude (unbegrenzte Stufenleiter, `timeGrowth` 1,35-1,5):** Saettigungskurve nach 9.1a/9.1b.
  Betrifft auch die Allianz-Station (Entscheidung 7.4) und die Gebaeude-Module.
- **Forschung (bei Stufe 10 gedeckelt, `MAX_RESEARCH_LEVEL`):** hier ist eine Untergrenze
  ausreichend, weil die Leiter endlich ist. Der eigentliche Hebel bleibt 9.3/9.4.
- **Schiffe/Verteidigung:** die Bauzeit ist **linear in der Stueckzahl**
  (`ship.buildTime * bauzeitMultiplier * qty`), es gibt gar keine Stufenleiter. Hier ist eine
  Untergrenze auf den Multiplikator unproblematisch; der eigentliche Hebel ist die
  Lane-Reduktion in 9.2.

**Bekannte Nachteile - ausdruecklich genannt:**
1. **Ein neuer Formeltyp ersetzt eine reine Multiplikation.** `client/src/lib/multipliers.ts` muss
   ihn 1:1 spiegeln (README Punkt 1). Genau dieser Spiegel ist schon einmal auseinandergelaufen -
   siehe R1. Ohne Spiegel zeigt die UI falsche Bauzeiten.
2. **Die Nanitenfabrik verliert ihren Ausnahmestatus** (0,50 je Stufe multiplikativ -> 0,30 additiv).
   Sie bleibt der staerkste Einzel-Hebel, ist aber nicht mehr fuer sich allein spielentscheidend.
   Durch den Server-Reset ohne Rueckwirkung.
3. **In Woche 1 wird der Zeit-Engpass NICHT spuerbar.** Das ist beabsichtigt (Abschnitt 1a), heisst
   aber: der Nutzerwunsch "Bauen geht zu schnell" wird in der Startphase bewusst nicht erfuellt. Der
   Engpass setzt ab etwa Stufe 15-20 ein.
4. **Die Zahlen oben sind gerechnet, nicht gemessen.** `T_MAX_BASE` und die sieben Gewichte sind
   gegen die Zielspanne kalibriert, nicht simuliert. Vor dem Festschreiben gegen die
   30-Tage-Simulation (Abschnitt 1b) und einen Endspiel-Ausbaustand pruefen.

**9.2 Danach die Slots reduzieren - NICHT gleichzeitig.** Slot-Reduktion und Zeiterhoehung sind eine
Doppelbremse. 4 Forschungsslots auf 1 vervierfacht die Gesamtdauer allein durch die Slot-Aenderung
(203 -> ueber 800 Tage). Zwischen beiden Schritten messen, sonst schiesst man weit ueber das Ziel
hinaus.
-> Forschung: 4 Slots -> **1 Slot + Warteschlange**.
-> Schiffe/Verteidigung: 3 Bau-Lanes -> **1 Lane + Warteschlange**. `BuildQueue.tsx` ist bereits
Lane-basiert, die Warteschlange existiert im Ansatz.
-> Gebaeude: `MAX_BUILDING_SLOTS` steht bereits auf 1, hier nur die Warteschlange sicherstellen.
-> **Die Warteschlange ist zwingend, nicht optional.** Der Nutzer ist teils mehrere Wochen
abwesend. Ohne Warteschlange bestraft 1 Slot genau diese Abwesenheit.
-> Der Nachteil "fuehlt sich wie eine Wegnahme an" entfaellt durch den Server-Reset (Abschnitt 1a) -
nach dem Reset hat niemand jemals 4 Slots gehabt.
-> **Neuer Nachteil durch den Reset:** Die Kalibrierung muss gegen die STARTPHASE erfolgen. 1
Bau-Slot und 1 Forschungs-Slot in Woche 1 koennen sich tot anfuehlen. Kalibriert wird das gegen die
Simulation aus Abschnitt 1b (Schritt 13 der Reihenfolge), **gegen die Kriterien 2 UND 3
gleichzeitig** - Leerlauf und Ressourcenstau schlagen gegenlaeufig aus, ein einzelnes von beiden
laesst sich immer erfuellen.

**9.3 Forschungs-Wirkungskurve MIT anpassen.** Ohne diesen Schritt wartet der Spieler bei 1 Slot
Jahre auf Stufen, die messbar nichts tun. Langsamer ist gewollt - leer warten nicht.
Drei Wege, einer davon waehlen:
- `timeGrowth` von **1,6 auf ca. 1,4** senken (halbiert die Endstufen-Zeit), ODER
- die Effektkurve nach oben strecken, damit 9/10 ueberhaupt etwas liefern, ODER
- die Endstufen streichen.
**Zielwert:** kompletter Forschungsbaum bei 1 Slot + Dauer-Booster in der Groessenordnung
**12-18 Monate**, die 9 Kampfforschungen in **4-6 Monaten**. Messen, nicht schaetzen.

**9.4 Forschungskosten anheben (freier Hebel).** Alle 21 Forschungen kosten heute zusammen 2,04 Mrd
= zwei Stunden Einnahmen; die teuerste Einzelstufe im ganzen Baum (Hyperraumantrieb 10) kostet
57,0 Mio = 0,26 % eines Tagesertrags. Forschungskosten sind heute komplett bedeutungslos und koennen
deutlich steigen, ohne irgendetwas kaputtzumachen. **Zielwert: kompletter Baum in der
Groessenordnung mehrerer Tageseinnahmen.** Zahlt direkt auf den beschlossenen Ressourcen-Engpass
ein.

**9.5 Module pruefen.** Der Nutzer nennt Module als "zu schnell". Ob Module ueberhaupt eine eigene
Bauzeit haben, ist aus der Analyse nicht belegt - **im Code pruefen**. Falls nein: eigene Bauzeit
geben, sie sind mit 99,57 Mrd (Schiffs-Module Vollausbau) die zweitgroesste Ressourcen-Senke nach
Gebaeuden.

#### ENDZIEL fuer den gesamten Zeit-Umbau (festgelegt 09.08.2026)

**Zeit ist eine KONSTANTE Reibung. Kosten sind der unbegrenzte Wachstumsmotor.**

Daraus folgt fuer jede kuenftige Einzelentscheidung in diesem Block:

1. **Jede hohe Ausbaustufe kostet in der Groessenordnung 1-5 Tage - auf Stufe 30 wie auf Stufe 60.**
   Bauzeit darf mit dem Fortschritt NICHT unbegrenzt mitwachsen. Wo sie das heute tut, wird sie
   gesaettigt (9.1a).
2. **Das unbegrenzte Wachstum lebt in den Kosten** (`costGrowth` 1,55-1,6 je Stufe), nicht in der
   Zeit. Dort ist "Zahlen wachsen immer weiter" richtig aufgehoben, weil die Einnahmen mitwachsen
   (Zielbild, Abschnitt 1) - bei der Zeit tun sie das nicht.
3. **Keine Reduktionsquelle darf die Zeit gegen null druecken, und keine darf wirkungslos sein.**
   Additiv statt multiplikativ (9.1b). Dieselbe Regel gilt sinngemaess fuer jeden anderen Stapel
   von Boni im Spiel - siehe Entscheidung 12 (Frischling-Bonus).
4. **Die Startphase bleibt unangetastet.** Zeitdruck ist Inhalt fuer die mittlere und spaete Phase.
   In Woche 1 ist die Ressourcenmenge der Engpass, nicht die Uhr.

#### Zielwert fuer die Bau-Kapazitaet

**Der taegliche Bau-Ausstoss soll grob in der Groessenordnung der Tageseinnahmen liegen** - heute
liegt er deutlich darueber (26-43 Mrd gegen 21,69 Mrd). Mit 1 Lane statt 3 faellt er auf rund
9-15 Mrd/Tag und damit in den Zielbereich.
**Nicht deutlich darunter gehen.** Sonst stapeln sich Ressourcen, die man nicht ausgeben kann - das
ist keine Tiefe, sondern Frust. Die Warteschlange federt das teilweise ab (man kann Ueberschuss
dauerhaft einbuchen).

#### Was diese Entscheidung nebenbei repariert (groesster Inhalts-Gewinn des Pakets)

Sobald Zeit zaehlt, werden auf einen Schlag wieder wertvoll, ohne dass etwas Neues gebaut wird:
- **vier Forschungszweige** (`bauzeit` 105,9 d + `bauzeit_schiffe`/`bauzeit_verteidigung`/
  `bauzeit_gebaeude` je 113,5 d = **446 Tage Forschungszeit**), die heute auf nichts zielen
- **sechs Zeit-Gutscheine** im Shop (150/300 DM)
- das **Samstags-Bauzeit-Event**
- der **Ingenieur-Bonus** (-15 % Bauzeit)
- `MAX_BUILDING_SLOTS` als Engpass ueberhaupt

#### Risiko

Die Nanitenfabrik ist heute exakt neutral kalibriert (`costGrowth: 2.0` gegen Zeitfaktor 0,5 pro
Stufe) - einmalige Kosten gegen dauerhaften Nutzen, es gibt nie einen Grund, den Ausbau zu stoppen.
**Nach dem Umbau auf die Saettigungskurve ist diese Kalibrierung vollstaendig hinfaellig** und muss
neu gerechnet werden: die Nanitenfabrik wirkt dann nicht mehr multiplikativ mit 0,5 je Stufe,
sondern additiv mit 0,30 auf `T_cap` (9.1b). Die alte Neutralitaets-Rechnung "costGrowth 2.0 gegen
Zeitfaktor 0,5" beschreibt danach nichts mehr.

---

### Entscheidung 10 - Rueckzug bei der Heimatverteidigung (BLOCKIEREND wegen Reset)

> **UMGESETZT am 19.08.2026 - aber mit einem ANDEREN Mechanismus als hier vorgeschlagen.**
> Messdatei `balance/session2-simulation/raid_e10.txt`, Rechenmodell `run_e10_schonfrist.mjs`,
> `run_raid.mjs` um alle gemessenen Varianten erweitert (30 Raids je Fall, min-max-Spalte).
>
> **Der hier vorgeschlagene Mechanismus funktioniert nicht.** "Die Flotte darf sich absetzen, die
> Anlagen kaempfen weiter" wurde gebaut (`retreatMode: 'fleetOnly'`) und gemessen: der
> Flottenverlust eines schwachen Kontos geht von 92,2 % auf **95,5 %**, also nirgendwohin, und die
> Anlagen sterben MEHR (69,2 -> 82,8 %). Ursache: der Rueckzug loest aus, wenn eine Einheit auf
> 30 % IHRER Panzerung faellt - bei schwachem Ausbau werden kleine Schiffe in EINER Welle
> vernichtet und durchlaufen dieses Fenster nie. Zusaetzlich kaempfen zurueckgezogene Schiffe in
> der naechsten der zwoelf Wellen wieder mit.
> Zwei weitere Varianten ebenfalls gemessen und verworfen: Rueckzug aus dem GANZEN Raid (82,1 %)
> und eine nachtraegliche Verlustobergrenze (73,6 %, haelt den Boden nicht, weil ausgeloeschte
> Schiffstypen sich nur durch Wiederbeleben "zurueckhalten" liessen - erste Fassung produzierte
> Verlustquoten von -28 %). Eine Reserve haelt den Boden exakt, kostet aber entweder Kampfkraft
> oder verbilligt das Endspiel (13,5 -> 4,9 % Verlust bei entwickelten Konten).
>
> **Der eigentliche Fehler lag in der Praemisse.** Gegengerechnet: ein Neuling verliert eine Flotte
> im Wert von **0,32 Mrd** und kassiert im selben Raid **20,23 Mrd** Belohnung (er gewinnt gemessen
> 11,0 von 12 Wellen). Der 92-%-Flottenverlust ist ein Gefuehlsproblem, kein wirtschaftliches -
> deshalb hat keine der vier Kampf-Varianten ueberzeugt, sie reparieren alle eine Zahl, die den
> Spieler kaum etwas kostet. Was Neulinge tatsaechlich trifft, ist `RAID_LOOT_PERCENT = 0,25`:
> 25 % des gesamten Ressourcenbestands, und ein schwaches Konto zahlt das in 93 % der Raids.
>
> **Nutzerentscheidung 19.08.2026: Neulingsschutz statt Rueckzugsregel.** Der urspruengliche
> Nutzervorschlag "Neulinge bekommen zwei Wochen gar keinen Raid" wurde gegengerechnet und
> verworfen: ohne Raid stuende ein neues Konto nach 14 Tagen bei **11,2 Mrd statt 62,9 Mrd** - der
> Raid ist die groesste Einnahmequelle der Startphase. Umgesetzt wurde deshalb die Umkehrung:
> **die Strafen entfallen, die Belohnung bleibt.**
> - `NEWCOMER_GRACE_DAYS = 14` in `economy.ts` (ab Registrierung; nach einem Reset also fuer alle
>   gleichzeitig, Bots ausgenommen)
> - kein Ressourcen-Diebstahl waehrend der Schonfrist
> - die verteidigende FLOTTE wird zurueckgeschlagen statt vernichtet
> - Verteidigungsanlagen bewusst NICHT geschuetzt, sonst stuende gar nichts mehr auf dem Spiel
>
> **Gegenmessung (30 Raids je Fall):** Flottenverlust 0,0 % in allen Faellen. Der Preis ist
> sichtbar und gewollt: weil die Flotte nicht mehr schrumpft, bleibt jede Welle auf volle Staerke
> skaliert - ein schwaches Konto gewinnt 9,2 statt 11,0 Wellen (rund 3 Mrd weniger Belohnung) und
> verliert fast alle Anlagen (96,4 %). Dagegen stehen 29,3 Mrd nicht gepluenderte Ressourcen ueber
> 14 Tage. Netto klar positiv.
>
> **Was offen bleibt:** die Schonfrist haengt am Kalender, nicht an der Staerke. Wer nach 14 Tagen
> noch schwach ist - oder spaeter durch eine verlorene Expedition wieder schwach wird - steht
> wieder ungeschuetzt da. Eine Kopplung an die Flottenmacht waere sauberer, laedt aber dazu ein,
> sich absichtlich schwach zu halten. Bewusst so entschieden. Ob 14 Tage reichen, kann erst die
> 30-Tage-Simulation aus Schritt 13 beantworten.
>
> **Damit ist die Sperre fuer Entscheidung 16 (RapidFire) aufgehoben** - `RAID_WAVE_ROLL` darf
> nach Abschnitt 8, Punkt 7 jetzt angefasst werden, weil die Verlustobergrenze fuer die Startphase
> steht. `retreatMode: 'fleetOnly'` bleibt im Code: wirkungslos fuer schwache Konten, aber die
> saubere Modellierung (eine Flotte KANN den Kontakt abbrechen, eine Bunkerstellung nicht) und die
> Grundlage, falls spaeter doch eine Reserve-Variante gebaut wird.

**Bezug:** README Punkt 27, Session 2 Befund 4. **Datei:** `game/raids.ts`.

**Sachlage:** Der Rueckzugs-Mechanismus ist bei Raids bewusst abgeschaltet (`allowRetreat = false`),
mit guter Begruendung: man kann sich nicht aus der Verteidigung der eigenen Basis zurueckziehen, und
da Verteidigungsanlagen schneller sterben als eine grosse Flotte, wuerde sonst die gesamte
Streitmacht vorzeitig abziehen.
**Aber:** gemessen bei schwachem Ausbau ergibt das **100 % Flottenverlust**. Das widerspricht der
Nutzervorgabe "spuerbar, aber nie Totalverlust". Fuer die beiden entwickelten Accounts greift es
heute nicht - es trifft neue Spieler und schwache Phasen.

**Entscheidung:** Eine Untergrenze fuer die Heimatverteidigung einziehen, die NICHT der normale
Flotten-Rueckzug ist (der wuerde das dokumentierte Problem zurueckbringen). Naheliegend: die
verteidigende **Flotte** darf sich absetzen, wenn sie unter einen Schwellwert faellt, die
**Verteidigungsanlagen** kaempfen weiter. Damit bleibt die Begruendung aus README Punkt 27 intakt
und ein Totalverlust der Flotte ist ausgeschlossen.

**Vorher pruefen:** ob das den Raid endgueltig unverlierbar macht (er ist es heute schon fast, siehe
Entscheidung 3). Falls ja, ist der bessere Weg der Schnappschuss der ersten Welle statt einer
Rueckzugsregel.

**Dringlichkeit durch den Reset:** Bisher als "trifft nur neue Spieler" eingestuft. **Nach dem
Reset sind ALLE Spieler neue Spieler.** Der 100-%-Flottenverlust bei schwachem Ausbau ist damit
kein Randfall mehr, sondern das erwartbare Ergebnis der ersten Raids. **Muss vor dem Reset fertig
sein.**

---

### Entscheidung 12 - Frischling-Bonus: ADDITIV STATT MULTIPLIKATIV (durch Reset dringend)

> **KALIBRIERT AM 20.08.2026, NICHT GEBAUT.** Messung: `run_novice_bonus.mjs` /
> `novice_bonus.txt`, kumulativer Messbuild (Block A Schritt 2 + Entscheidung 16), Solo-Gitter
> 40 Durchlaeufe je Zelle, Raid-Zelle 200 je Zelle. Der Build reproduziert die Ankerzelle aus
> `loot_curve.txt` auf -1,7 % (normiert auf die vernichtete Feindmacht).
>
> **DER WERT: `NOVICE_BONUS_ADD = 2,0`.** Multiplikator = Produkt der uebrigen Mining-Quellen
> PLUS 2,0, statt Produkt MAL 3. Das ist die woertliche additive Lesart der heutigen 3 (3 = 1+2)
> und braucht keine neu erfundene Zahl. Wirkung gemessen: in Woche 1 +98 % Mining statt +200 %,
> beim spaeten Vollstapel +16 % statt +200 % - der Bonus hoert auf, mit dem Rest zu
> multiplizieren, bleibt in der Startphase aber deutlich spuerbar. Das war die Vorgabe
> ("nicht ueberkorrigieren").
>
> **DIE GEMEINSAME KALIBRIERUNG MIT ENTSCHEIDUNG 9 IST NICHT NOETIG - gemessen, nicht
> unterstellt.** Statt die 30-Tage-Simulation (Schritt 13) vorzuziehen, wurde die Woche-1-
> Zusammensetzung gegen ZWEI einklammernde Bau-Szenarien gerechnet: K1 heute (3 Lanes,
> Basiszeiten x1) und K2 nach Entscheidung 9 (1 Lane, Basiszeiten x2). **Die beiden Klammern
> unterscheiden sich in keiner Zelle um mehr als 1 Prozentpunkt.** Grund: das Mining sitzt in
> beiden Bau-Welten am ERSTEN TAG am Cap (700 Schiffe, 14,3 Mio Wert gegen 117,5 Mio
> Startressourcen, Bauzeit selbst mit 1 Lane und doppelten Basiszeiten 3,9 h), und die
> Kampf-Einnahmen der Startphase sind nicht bau-, sondern gegnerskalierungsbegrenzt.
>
> **ABNAHMEKRITERIUM 5 TAUGT NICHT ALS MASSSTAB FUER DIESE ENTSCHEIDUNG.** Das ist der wichtigste
> Befund der Messung und betrifft Abschnitt 1b, nicht nur diesen Punkt:
> - Groesste Einzelquelle der Woche 1 ist der **RAID mit 58-64 %**, nicht das Mining (33-39 %).
>   Der Raid zahlt 10x Silber + 6x Gold + 2x Elite je GEWONNENER WELLE = 1,84 Mrd Wert, bei
>   12/12 Wellen 22,07 Mrd - **flach, unabhaengig von der eigenen Staerke**, zweimal pro Woche.
> - **Jede Kuerzung des Bonus macht Kriterium 5 SCHLECHTER**, weil der Raid-Anteil dadurch von
>   58 % auf 78 % steigt. Kriterium 5 in der heutigen Fassung verlangt einen moeglichst GROSSEN
>   Frischling-Bonus - das Gegenteil der Absicht.
> - Rechnet man den Raid heraus (er ist nach Kriterium 4 ausdruecklich kein freischaltbarer
>   Inhalt, sondern ein Ereignis), liegt das Mining bei 93 % im Ist-Zustand und bei **81 % mit
>   komplett abgeschaltetem Bonus**. Ursache ist nicht der Bonus, sondern dass daneben nichts
>   steht: die Solo-Einnahme der Startphase betraegt 1,23 Mrd/Woche gegen 6,03 Mrd Mining ohne
>   jeden Bonus.
> - **Folge fuer Abschnitt 1b:** Kriterium 5 muss entweder auf die Quelle umgestellt werden, die
>   es treffen soll, oder es bleibt bis zum Bau von Entscheidung 3 (Raid-Ertrag) unbewertbar.
>   Vorschlag, nicht entschieden: Kriterium 5 auf "keine Einzelquelle ueber 50 % der Woche-1-
>   Einnahmen OHNE den Raid" umstellen und zusaetzlich ein eigenes Deckelkriterium fuer den Raid
>   aufnehmen. Solange das nicht entschieden ist, ist Kriterium 5 **kein Reset-Blocker**.
>
> **DAS FENSTER: 14 TAGE, GEKOPPELT AN `NEWCOMER_GRACE_MS` (Nutzerentscheidung 20.08.2026).**
> Gemessen ist die Fensterlaenge eine Begriffs-, keine Balancefrage: die vorab vorgeschlagene
> Entscheidungsregel ("auf 14 ziehen, wenn der Mining-Anteil an Tag 8-14 unter 50 % bleibt")
> trifft in JEDER Variante zu und trennt damit nichts - sie sah nach einer Messung aus und war
> keine. Entschieden wurde deshalb nach dem Begriff: **fuer "Frischling" gibt es ab jetzt nur
> EINE Zahl.** Bisher schuetzte der Raid bis Tag 14, waehrend der Mining-Bonus schon an Tag 8
> auslief - im Spiel haette das wie ein Fehler ausgesehen.
> **Gemessene Kosten, ausdruecklich:** bei `NOVICE_BONUS_ADD = 2,0` traegt der Bonus in Woche 2
> zusaetzlich **4,60 Mrd**, das sind 12 % des Wocheneinkommens dieser Woche. Der Nachteil ist
> benannt und angenommen: das verdoppelt die Laufzeit des Bonus genau in der Phase, in der der
> Plan Wachstum aus eigener Leistung will.
>
> **BAUANLEITUNG (mechanisch, nichts mehr offen):**
> 1. `data/economy.ts`: `NOVICE_BONUS_MULTIPLIER = 3` ersetzen durch `NOVICE_BONUS_ADD = 2`.
>    Den alten Namen NICHT weiterverwenden - ein multiplikativer Name auf einem additiven Wert
>    ist genau die Art stiller Fehler, die dieser Plan schon zweimal gefangen hat.
> 2. `game/missions.ts`, `miningMultiplier()`: die Zeile
>    `const novice = isNoviceAccount(state) ? NOVICE_BONUS_MULTIPLIER : 1;` und der Faktor
>    `* novice` im `return` entfallen; stattdessen
>    `return base * specific * economy * booster * weeklyEvent + (isNoviceAccount(state) ? NOVICE_BONUS_ADD : 0);`
> 3. `game/routes.ts`: `noviceBonusMultiplier: NOVICE_BONUS_MULTIPLIER` wird zu
>    `noviceBonusAdd: NOVICE_BONUS_ADD` (ueber `/game/data`, wie bisher).
> 4. **Client-Spiegel, gegreppt am 20.08.2026 - es sind ZWEI, nicht einer** (Messregel 8):
>    - `client/src/lib/multipliers.ts`, `getMiningMultiplier()`: spiegelt die Formel 1:1 und muss
>      dieselbe Umstellung bekommen.
>    - `client/src/pages/Sektor.tsx` (~Zeile 590): das Frischling-Badge schreibt
>      "{gameData.noviceBonusMultiplier}x Ertrag beim Asteroiden-Mining". Unter der additiven
>      Regel ist dieser Satz FALSCH, nicht nur veraltet - der effektive Faktor haengt vom Rest
>      des Stapels ab. Text auf den tatsaechlich wirksamen Faktor umstellen (aus
>      `getMiningMultiplier()` mit und ohne Bonus rechnen) oder auf "+2 auf den Mining-Faktor".
>    - `client/src/types/game.ts`: Feld `noviceBonusMultiplier` umbenennen.
> 5. `data/economy.ts`: `NOVICE_BONUS_WINDOW_MS = NEWCOMER_GRACE_MS` (Nutzerentscheidung
>    20.08.2026, nicht optional). Die Konstante `NEWCOMER_GRACE_MS` steht in derselben Datei
>    weiter unten - beim Umbau auf die Reihenfolge der Deklarationen achten, sonst ist sie an
>    der Verwendungsstelle noch `undefined`. Danach im Client pruefen, ob irgendwo "7 Tage" als
>    Text steht (gegreppt am 20.08.2026: nur die Restzeit-Anzeige in `Sektor.tsx`, die rechnet
>    dynamisch aus `noviceBonusWindowMs` und braucht keine Aenderung).

**Bezug:** Session 1, Befund 7. **Dateien:** `game/missions.ts` (`miningMultiplier()`),
`data/economy.ts` (`NOVICE_BONUS_MULTIPLIER`, `ABBAU_BOOST_MULTIPLIER`).

**Sachlage:** Alle Mining-Multiplikatoren stapeln rein multiplikativ:
Mining-Forschung Stufe 10 (x2) * `mining_schiffe` (1,5) * Prospektor (1,2) * Abbau-Booster (1,7) *
Di/Do-Event (2,0) * Frischling (3,0) = **bis 36,72x**.

> *Korrigiert am 20.08.2026 gegen den Code (Messregel 16), drei Zahlen dieses Absatzes waren
> falsch:* hier stand **24,5x** - das ist derselbe Stapel OHNE `mining_schiffe` (36,72 / 1,5 =
> 24,48). Daraus folgte die zweite falsche Zahl, "rund **8,5 Mrd/Tag** allein aus Asteroiden":
> der gemessene Rohertrag bei vollen Caps ist 346,0 Mio Wert/Tag, mal 24,5 ergibt 8,48 Mrd, mal
> des echten Stapels 12,70 Mrd. Die dritte und wichtigste Korrektur: **beide Zahlen setzen
> Mining-Forschung Stufe 10 voraus, die ein 7 Tage altes Konto nicht haben kann.** Der real
> erreichbare Woche-1-Stapel ist **x6,12** (Normaltag) bzw. **x12,24** (Di/Do) - Prospektor,
> Abbau-Booster und Event sind erreichbar, die Forschung nicht. Die Begruendung dieser
> Entscheidung beschreibt damit einen Stapel, den die betroffene Gruppe nie erreicht. Der Bonus
> bleibt trotzdem der groesste Einzelfaktor der ersten Woche (er allein traegt 1,72 Mrd/Tag),
> die Entscheidung faellt also nicht - nur ihre Zahlenbasis ist ersetzt.

**Entscheidung:** `NOVICE_BONUS_MULTIPLIER` additiv statt multiplikativ wirken lassen. Der
Frischling-Bonus ist als Aufholhilfe gedacht und ueberschiesst in dieser Stapelung deutlich.

**Warum durch den Reset dringend:** Bisher war das eine Randbeobachtung fuer hypothetische neue
Spieler. **Nach dem Reset ist es die erste Spielwoche beider Spieler.** Ohne Korrektur ist die
Startphase die ertragreichste Phase des Spiels relativ zum Aufwand - genau das Gegenteil der
Vorgabe "Zahlen wachsen immer weiter".

**Vorsicht:** Nicht ueberkorrigieren. Der Bonus soll die Startphase weiterhin spuerbar
beschleunigen, gerade weil Entscheidung 9 (Zeit als Engpass) sie gleichzeitig verlangsamt. Beide
Aenderungen wirken in dieselbe Richtung und muessen **gemeinsam** gegen die
30-Tage-Fortschrittssimulation (Spezifikation in **Abschnitt 1b**) kalibriert werden, nicht einzeln.
**Reihenfolge-Korrektur 09.08.2026:** Entscheidung 12 steht deshalb jetzt in Block C, VOR dem ersten
Simulationslauf - stuende sie danach, wuerde Abnahmekriterium 5 (keine Einzelquelle ueber 50 % der
Wochen-Einnahmen) beim ersten Lauf zwangslaeufig scheitern, weil es genau diesen Bonus misst.

> **STAND 20.08.2026: KALIBRIERT, NICHT GEBAUT.** Im Code steht `NOVICE_BONUS_MULTIPLIER = 3`
> unveraendert multiplikativ in `miningMultiplier()` (`missions.ts` Zeile 71). Alle Zahlen und
> die Bauanleitung stehen im Messkasten am Kopf dieser Entscheidung.
>
> **Die beiden Frischling-Fenster** (`NEWCOMER_GRACE_DAYS = 14` gegen `NOVICE_BONUS_WINDOW_MS`
> = 7 Tage) sind gemessen und als **Begriffsfrage** eingestuft, nicht als Balancefrage - siehe
> Messkasten, Befund 11. Empfehlung dort: koppeln, damit es fuer "Frischling" nur eine Zahl gibt.

---

### Entscheidung 11 - Aussenposten-Reste entfernen

**Bezug:** Session 4, Befund 11. **Dateien:** `data/economy.ts` (Zeilen 555-601),
`data/galaxyConstants.ts` (Zeilen 52-66), `game/galaxyPositions.ts`, `data/combatConstants.ts`
(Zeile 530).

`game/outposts.ts` existiert nicht mehr, die README fuehrt das Feature korrekt als entfernt. Im Code
leben rund 50 Zeilen Konstanten weiter, und **`galaxyPositions.ts` reserviert weiterhin 6
Galaxie-Positionen als belegt** - unsichtbar gesperrt fuer Allianz-Stationen, Umzuege und
Galaxie-Ereignisse.

**`OUTPOST_MULTIPLIER_ROLL` vor dem Loeschen sichern** - die Werte sind fuer genau den Zweck
kalibriert, den Entscheidung 5 braucht.

---

### Entscheidung 13 - KI-Mitspieler und Piratenbasen: ERTRAG AN DIE EIGENE FLOTTENMACHT KOPPELN

**Bezug:** Nutzerbeobachtung 09.08.2026 ("Vega und Nyx sollen Spieler imitieren, tun das nach
vielen Fixes immer noch nicht"), belegt durch Code-Pruefung in derselben Sitzung. **In keiner der
vier Sessions enthalten - komplett neuer Punkt.** **Dateien:** `game/economyBotTurn.ts`,
`game/bot.ts`, `game/pirateBaseState.ts`, `data/economy.ts`
(`NPC_PRODUCTION_BONUS_MULTIPLIER`), `game/routes.ts` (`/galaxy`).

**Kernbefund:** Die Entscheidungslogik der Bots ist nicht das Problem - sie ist fuer das, was sie
tut, sauber gebaut und nutzt exakt dieselben Aktionsfunktionen wie ein Mensch. Das Problem liegt
eine Ebene tiefer: **Bots bauen, aber sie spielen nicht.** Sie fliegen keine Missionen, keine
Raids, keine Asteroiden, oeffnen keine Container. Kein Feinschliff an der Bau-Reihenfolge kann das
aufholen.

**13.1 Der Ertrag ist strukturell zu niedrig (Hauptpunkt).**
Ein Spieler verdient 21,69 Mrd/Tag, davon **0,55 Mrd aus den Minen - also 2,5 %**. Bots und
Piratenbasen haben ausschliesslich Minen-Einkommen, ausgeglichen ueber
`NPC_PRODUCTION_BONUS_MULTIPLIER = 6`. Das ergibt rund **3,3 Mrd/Tag, etwa 15 % eines Spielers**.
Der Kommentar an der Konstante behauptet, sie leiste den kompletten Ausgleich fuer den fehlenden
Zugang zu Container-/Missions-/Raid-Beute; dafuer muesste sie bei rund **39** liegen, nicht bei 6.

Zwei Wege:
- **(a) Bots wirklich fliegen lassen** (Missionen, Elite, Raids). Realistisch abgebildet, aber jede
  geflogene Mission ist eine echte Kampf-Simulation, und `POOL_SIZE` in `combatRunner.ts` steht auf
  **1** - alle Kaempfe aller Spieler laufen also serialisiert ueber einen einzigen Worker, weitere
  Anfragen warten in der `waitQueue`. Genau das wurde nach dem CPU-Spitzen-Vorfall so gedrosselt.
  Nicht empfohlen. *(Korrigiert am 10.08.2026: hier stand "2-Worker-Pool".)*
- **(b) Virtueller Missions-Ertrag aus der eigenen Flottenmacht** (EMPFOHLEN). Der Bot bekommt pro
  Zeiteinheit einen Ertrag, der sich aus `combatFleetPowerBase()` seiner eigenen Flotte ableitet -
  **mit denselben Koeffizienten wie Entscheidung 2** (Beute je vernichteter Feindmacht) - und
  zusaetzlich eine **virtuelle Verlustrate** aus derselben Groesse. Kein Kampf, keine CPU-Last,
  aber per Konstruktion dieselbe Kurve wie bei einem Spieler: waechst die Bot-Flotte, waechst
  Ertrag UND Verlust mit. Damit erfuellt der Bot automatisch das Zielbild aus Abschnitt 1, statt
  ueber einen festen Multiplikator daneben zu liegen.
  **Nachteil:** bleibt eine Naeherung. Bots erleben nie echte Zufallsausreisser (Totalverlust,
  Gluecksserie) und haben deshalb eine unnatuerlich glatte Wachstumskurve.

**Ohne die virtuelle Verlustrate NICHT umsetzen.** Ertrag ohne Verlust waere eine monoton wachsende
Flotte ohne jede Gegenkraft - der Bot wuerde die Spieler ueberholen statt sie zu begleiten.

**13.2 Vega und Nyx sind heute nicht unterscheidbar.**
Forschung laeuft strikt in der Array-Reihenfolge von `RESEARCH` durch (erste Technologie, die
bezahlbar ist). Schiffe und Verteidigung werden nach "geringster Bestand zuerst" gebaut, was
langfristig auf **gleiche Stueckzahlen aller 8 Schiffstypen und aller 11 Verteidigungstypen**
zulaeuft. So baut kein Spieler, und es ist zusaetzlich wertmaessig schief: gleich viele Reaper wie
Leichte Jaeger heisst, der Grossteil des Flottenwerts steckt in den teuersten Typen - nach
Entscheidung 6 genau die schlechteste Verwendung. Einziger Unterschied zwischen beiden Bots ist
heute die zufaellige Klassenwahl in `maybeChooseClass()`.
-> Feste Profile je Bot: gewichtete Bauverteilung statt Gleichverteilung, eigene
Forschungsreihenfolge, dazu passende Klasse statt Zufall. Vorschlag: **Vega offensiv/flottenlastig
(Kanonier), Nyx defensiv/wirtschaftslastig (Bollwerk)**. Billig umzusetzen, sofort sichtbar in der
Spielerliste und im Kampfbericht.

**13.3 Wachstum haengt an der Aufruf-Haeufigkeit, nicht an der Zeit (blockiert Entscheidung 5).**
`loadPirateBase()` ruft bei JEDEM Laden `runEconomyBotTurn()` auf. `/galaxy` in `routes.ts` laedt
ueber `listActivePirateBaseSummaries()` **alle vier Basen bei jedem Aufruf der Galaxie-Ansicht**.
Die Ressourcenproduktion selbst ist zeitbasiert und damit korrekt - der **Bau-Entscheidungsschritt
ist es nicht**. Eine Basis waechst also schneller, je oefter jemand in die Galaxie schaut.
-> Entscheidungsschritt an einen Zeitstempel auf der Basis haengen (z.B. hoechstens alle N Minuten),
nicht an den Ladevorgang. Kleine Aenderung, aber **Voraussetzung fuer jede reproduzierbare Messung
an Entscheidung 5**.

> **UMGESETZT UND GEMESSEN AM 17.08.2026 (Block C, Schritt 6).** Neues Feld `nextEconomyTurn` auf
> `PirateBaseState`, neue Konstanten `PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS = 2 Minuten` (gleich
> `HEARTBEAT_INTERVAL_MS`) und `PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP = 30`. Messung:
> `run_base_growth_133.mjs` / `base_growth_133.txt`, Messbuilds ueber `make_messbuild_133.mjs`
> (Intervall auf 1 s heruntergesetzt, damit die Mechanik in Sekunden statt Stunden sichtbar wird;
> Quellcode unberuehrt, Verfahren wie bei 4.4).
>
> **Abnahmekriterium erfuellt:** bei rund 11.000-facher Aufruf-Zahl ueber dasselbe Zeitfenster
> liefen vorher **x10.514 bis x10.895** so viele Bau-Entscheidungsschritte, nachher **x0,95 bis
> x1,00**. Die Ergebnisse sind damit identisch, wie in den Messkriterien oben gefordert.
>
> **Drei Befunde, die den Plan korrigieren:**
>
> **(1) Die Begruendung in 13.3 traegt so nicht - das WACHSTUM hing schon vorher nicht an den
> Aufrufen.** Gemessen wurden die Ausgaben je Zeitfenster mit x0,94 bzw. x1,00 bereits im
> Vorher-Stand, in beiden Kapitalstaenden und aus zwei verschiedenen Gruenden: bei einer reichen
> Basis binden die **Bau-Slots** (Warteschlangen stehen nach wenigen Zuegen auf 11/11, und die
> eingereihten Auftraege laufen 12 min bis 12 h), bei einer frischen Basis bindet der
> **Ressourcenstand** (das Geld ist nach dem ersten Zug weg). Der Satz "eine Basis waechst
> schneller, je oefter jemand in die Galaxie schaut" ist in dieser Form **nicht bestaetigt**.
> **Was die Aenderung weiterhin traegt, ist Punkt 5b (Reproduzierbarkeit) und die Rechenlast** -
> rund 10.500 vollstaendige Entscheidungsschritte in 20 Sekunden, je Basis und je Client, dieselbe
> Familie wie die Cross-User-Sweeps vom 12.08.2026. *Grenze der Messung ausdruecklich:* 20 Sekunden
> zeigen keinen Effekt, der ueber Stunden entsteht (leer stehende Slots zwischen zwei
> Fertigstellungen). Gerechnet, nicht gemessen: bei 2 Minuten Intervall gegen 12 min bis 12 h
> Auftragslaufzeit steht ein Slot hoechstens 2 Minuten leer, also wenige Prozent.
>
> **(2) Ein Zeitstempel allein genuegt nicht - er muss im RASTER weitergesetzt werden.** Die erste
> Fassung (`nextEconomyTurn = jetzt + Intervall`, kein Nachholen) mass **x1,18 statt x1,00**: kommt
> ein Aufruf wenige Millisekunden VOR der Faelligkeit, faellt der Zug aus und wird nie nachgeholt.
> Produktiv waere genau das der Regelfall gewesen, weil der Heartbeat denselben 2-Minuten-Takt hat
> wie das Intervall. Ausgeliefert ist deshalb `nextEconomyTurn += Intervall` je faelligem Zug, mit
> gedeckeltem Nachholen. **Wer das Intervall aendert, muss diese Kopplung mitdenken.**
>
> **(3) Zweiter Fundort derselben Fehlerform, im Plan nicht erwaehnt: `/api/heartbeat` laeuft ohne
> `requireAuth`.** Da `runBotTurn()` einmal je Heartbeat einen vollstaendigen
> Bau-Entscheidungsschritt jedes Bots ausfuehrt, liess sich damit das **Bot**-Wachstum durch
> wiederholte Aufrufe des Endpunkts beliebig beschleunigen - dieselbe Aufruf-Abhaengigkeit eine
> Ebene hoeher. Behoben ueber `HEARTBEAT_MIN_INTERVAL_MS = 60 s` in `heartbeat.ts`; der Endpunkt
> meldet innerhalb des Fensters `skipped`. *Nachteil:* ein manueller Testaufruf wirkt dort nicht
> mehr sofort. Der Wert liegt bewusst unter `HEARTBEAT_INTERVAL_MS` (2 min), damit der interne Takt
> nie uebersprungen wird.
>
> **Zwei Fehlversuche am Messwerkzeug, bewusst protokolliert** - beide sahen wie ein Befund aus:
> der erste Aufbau mass Einheiten statt Zuege ("x0,94, also kein Defekt" - gemessen wurde das
> Slot-Limit), und der Zaehler stand zunaechst hinter einer kompilierten `for`-Schleife OHNE
> geschweifte Klammern und zaehlte dadurch Ladevorgaenge statt Zuege ("x10.082, Drosselung
> wirkungslos"). Dieselbe Lehre wie bei der verworfenen Wirtschaftssimulation vom 12.08.2026.
>
> **Messregel 8 erfuellt:** im Client gegreppt (`loadPirateBase`, `runEconomyBotTurn`,
> `nextOffensiveCheck`, `runGlobalHeartbeat`). Ein Spiegel gefunden - `DebugPirateBaseState` in
> `client/src/types/game.ts` bildet `PirateBaseState` nach; das neue Feld ist dort und in der
> Debug-Route ergaenzt und wird in `pages/Debug.tsx` als "naechster Bau-Zug" angezeigt, damit die
> Drosselung im laufenden Betrieb ueberpruefbar ist.
>
> **Offen und ausdruecklich NICHT mit erledigt:** die Wachstumsrate der Basen ueber Tage. Sie
> braucht die gefaelschte Uhr aus Abschnitt 1b. Bis dahin bleibt der Messpunkt in Abschnitt 7
> bestehen.

**13.4 Entscheidung 9 trifft Bots haerter als Spieler.**
Bots und Basen teilen sich `MAX_BUILD_SLOTS`, `MAX_DEFENSE_SLOTS` und `MAX_RESEARCH_SLOTS` mit den
Menschen. 3 Bau-Lanes auf 1 und 4 Forschungsslots auf 1 bremst sie im selben Verhaeltnis - nur haben
sie keine zweite Einnahmequelle zum Ausgleich und keine Warteschlangen-Strategie (pro Zug wird
hoechstens ein Auftrag eingereiht). Nach dem Reset fallen sie dadurch dauerhaft zurueck.
-> Gehoert zwingend in die Kalibrierung von Block D und in die 30-Tage-Simulation.

**13.5 Warum das nicht nur Kosmetik ist.**
Das **Elite-Bollwerk ist mit 10,87 Mrd/Tag die groesste Einnahmequelle des Spiels** und braucht
Mitspieler. Bots nehmen ueber `maybeHandleGroupOps()` daran teil. Sind sie zu schwach, faellt der
groesste Posten des Spiels aus oder wird zum Verlustgeschaeft. Nach dem Reset trifft das sofort:
Bots starten wie alle anderen bei null. **Bot-Staerke ist damit keine Nebensache, sondern eine
Vorbedingung fuer den wichtigsten Inhalt.**

**Messkriterien:**
- Bot-Flottenwert und Bot-Einnahmen gegen einen menschlichen Spieler ueber 30 simulierte Tage.
  **Zielkorridor: 60-100 % des Spielers**, nicht 15 %.
- Elite-Bollwerk mit 2 Bots + 1 Mensch in Woche 1, Woche 2 und Woche 4 der 30-Tage-Simulation:
  ab wann ist die Expedition ueberhaupt gewinnbar?
- Nach 13.3: Basiswachstum zweimal mit unterschiedlich vielen Galaxie-Aufrufen messen - die
  Ergebnisse muessen identisch sein.

---

### Entscheidung 15 - Waffen/Schild/Panzerung unbegrenzt forschbar (NEU 12.08.2026, Nutzeridee)

**Anlass:** Alle Forschungen stehen bei den Spielern auf `MAX_RESEARCH_LEVEL` (10). Damit sind
**Zeit-Gutscheine wertlos** (es gibt nichts mehr zu beschleunigen) und ueber Forschung sind **keine
Punkte mehr erzielbar** - `calculatePoints()` zaehlt `resourcesSpentResearchBuildings`, und der
waechst nicht mehr. Vorschlag des Nutzers: den Deckel fuer Waffentechnik, Schildtechnik und
Panzerungtechnik aufheben.

**Die Begruendung des Nutzers ("Piraten skalieren ja mit der Forschung mit") ist HALB richtig -
der Mechanismus ist ein anderer als angenommen:**
- **Die Feindstaerke skaliert NICHT mit Forschung.** `combatFleetPowerBase()` rechnet auf reinen
  Basiswerten; der Kommentar dort sagt ausdruecklich, dass Forschung die Gegnerstaerke seit dem
  Umbau nicht mehr beeinflusst. Es gibt also keine groesseren Piratenflotten.
- **Stattdessen greift `PIRATE_RESEARCH_SHARE = 1.0`:** Piraten bekommen 100 % des
  Spieler-Forschungsstands auf ihre EIGENEN Einheiten. Nicht mehr Schiffe, aber jedes einzelne so
  stark, als haette es den Forschungsstand des Spielers.

**Ergebnis: relativ neutral - aber aus einem unbequemen Grund.** Forschung verschafft gegen Piraten
ohnehin fast keinen Vorteil; der echte Vorsprung des Spielers kommt aus Klasse, Modulen und
Kampf-Booster, die den NPCs bewusst vorenthalten bleiben. Eine Aufhebung des Deckels aendert an
diesem Verhaeltnis nichts - sie blaeht nur die absoluten Zahlen auf beiden Seiten auf.

**Die Kurve ist bereits ein natuerlicher Deckel** (Waffentechnik, `costGrowth` 1,8 /
`timeGrowth` 1,6, Basiszeit 12 h):

| Stufe | Effekt | Kosten | Forschungszeit (Basiswert, ohne Multiplikatoren) |
|---|---|---|---|
| 10 | +100 % | 0,02 Mrd | 34 Tage |
| 11 | +110 % | 0,04 Mrd | 55 Tage |
| 15 | +150 % | 0,43 Mrd | 360 Tage |
| 20 | +200 % | 8,14 Mrd | 10,4 Jahre |

Begrenzt wird also ueber **ZEIT, nicht ueber Ressourcen** - genau die Groesse, auf die Zeit-Gutscheine
wirken. Als Senke fuer Gutscheine und als laufende Punktequelle funktioniert das damit sauber.

**Die Auswahl der drei Forschungen ist richtig gewaehlt:** Waffen/Schild/Panzerung sind die
einzigen mit unbegrenztem Multiplikator (`effectPerLevel` 0,10, linear, ohne Obergrenze). Praezision,
Ausweichen, Schild-Regeneration und Kritische Treffer haben eigene Kappungen (`PRECISION_MAX`,
`EVASION_MAX`, `SHIELD_REGEN_MAX`, `CRIT_CHANCE_MAX`) und wuerden oberhalb von Stufe 10 gar nichts
mehr bewirken.

**DREI STELLEN BRECHEN, wenn `MAX_RESEARCH_LEVEL` einfach entfernt wird:**
1. **Die Bot-Ruecklage vom 12.08.2026** (Abschnitt 2a, Punkt 9). `nextResearchCost()` sucht die
   erste Forschung unterhalb von `MAX_RESEARCH_LEVEL` - ohne Deckel findet sie IMMER eine und legt
   bei Stufe 20 acht Milliarden zurueck. **Die Bots wuerden dann nie wieder Schiffe oder
   Verteidigung bauen** - eine Sparfalle gegen die naechste getauscht. Die Ruecklage braucht dann
   eine Obergrenze (z.B. nur bis zu einem bestimmten Stufen- oder Kostenniveau zuruecklegen).
2. **Die Bot-Forschung selbst** (`economyBotTurn.ts`, Zeilen 89 und 138) wuerde endlos weiterforschen.
3. **Der Client** bekommt `maxResearchLevel` ueber `/game/data` (`routes.ts`) - die Oberflaeche
   zeigt den Deckel an und sperrt. Messregel 8: vor der Aenderung im Client greppen.

**Empfehlung:** Umsetzen, aber NICHT gleichzeitig mit der frisch ausgelieferten Bot-Ruecklage - die
ist seit dem 12.08.2026 live und noch unbeobachtet. Zwei ineinandergreifende Aenderungen an
derselben Stelle gleichzeitig ist genau das Muster, vor dem Abschnitt 5 warnt. Reihenfolge: erst
die Ruecklage im Livebetrieb bestaetigen, dann den Deckel aufheben und die Ruecklage im selben
Zug begrenzen.

**Offen zu entscheiden:** ob der Deckel ganz faellt oder nur angehoben wird (z.B. auf 25, wo die
Forschungszeit ohnehin bei ueber 100 Jahren liegt). Ein harter Wert waere ehrlicher gegenueber der
Anzeige und verhindert Ueberlaufeffekte bei sehr grossen Zahlen; praktisch macht es keinen
Unterschied, weil die Zeitkurve lange vorher greift.

---

### Entscheidung 14 - Gebaeude-Module der Heimatbasis fuer V2/V3 (verschoben aus 7.5)

> **ERLEDIGT am 10.08.2026, mit bewusster Abweichung vom hier beschriebenen Weg.**
> Umgesetzt wurde NICHT die Umstellung auf den Stations-Generator, sondern eine Ableitung der
> V2/V3-Module aus den unveraenderten V1-Modulen. Begruendung, Messwerte und Folgen fuer die
> Kalibrierung von 9.1 stehen in **Abschnitt 2a**. Der Text unten ist der Stand VOR der Umsetzung
> und bleibt als Befundbeschreibung erhalten.

**Bezug:** Session 3, Befund 9 + Nutzerhinweis 09.08.2026, praezisiert durch Code-Pruefung.
**Dateien:** `data/buildingModules.ts`, `game/actions.ts`
(`roboterNaniteFactor()`, `BUILDING_SELF_BUILDTIME_MODULE`, `mineOutputPerHour()`,
`energyConsumed()`/Solar-Ertrag), `game/state.ts` (Migration).

**Befund, praeziser als bisher im Plan:**
- **Allianz-Station: nicht betroffen.** Ihre Module werden per Generator ueber `STATION_BUILDINGS`
  erzeugt, dort stehen v1/v2/v3 - alle drei Stufen haben vollstaendige Module.
- **Heimatbasis: betroffen.** `data/buildingModules.ts` enthaelt 15 **handgetippte** Module mit
  ausschliesslich V1-IDs. Genau dieser Unterschied - Generator gegen Handarbeit - ist die Ursache.
- Fuer V2/V3 laufen drei verschiedene Fehler nebeneinander:
  1. Ertrag, Energie, Solar-Ertrag und Fabrik-Verstaerkung: die IDs werden zur Laufzeit als
     `v2_metallmine_foerdereffizienz` usw. zusammengesetzt, existieren aber nicht.
     `moduleBoostFactor()`/`moduleReductionFactor()` geben **still 1 zurueck** - kein Fehler, keine
     Meldung.
  2. Die gebaeudeeigenen Bauzeit-Module werden fuer V2/V3 **nicht einmal zusammengesetzt**:
     `BUILDING_SELF_BUILDTIME_MODULE` ist eine feste Zuordnungstabelle mit ausschliesslich
     V1-Schluesseln.
  3. `loadPlayerState()` legt die Modulfelder aus `BUILDING_MODULES` an - die V2/V3-Felder
     existieren im Spielstand also gar nicht.

**Entscheidung:** Heimatbasis auf **denselben Generator** umstellen wie die Station, statt 30
weitere Module von Hand nachzutippen. **Nachteil:** die heute individuell gesetzten Kostenwerte je
Gebaeude gehen in eine Formel ueber, die Werte verschieben sich leicht. Durch den Server-Reset ohne
Folgen. Der Gewinn: bei einer kuenftigen V4-Stufe entsteht derselbe Fehler nicht noch einmal.

**ZWINGEND gemeinsam mit Entscheidung 9.1 kalibrieren.** Den V2/V3-Gebaeuden fehlt heute die
"Verstaerkte Automatisierung" von Roboter- und Nanitenfabrik - beide senken den Bauzeit-Faktor um je
die Haelfte. **V2/V3 bauen dadurch aktuell viermal langsamer als ein gleich ausgebautes V1.** Wer
Entscheidung 14 repariert, beschleunigt V2/V3 um Faktor 4 und arbeitet damit direkt gegen den
Zeit-Engpass. Wird das getrennt gemessen, ist die Kalibrierung von 9.1 hinterher falsch.

**Einordnung der Groesse:** 44,38 Mrd Vollausbau der Gebaeude-Module entsprechen rund **zwei
Tageseinnahmen** im Endspiel - spuerbar, aber nicht dringend. Nach dem Reset liegt V2/V3 ohnehin
Monate entfernt. **Nicht blockierend fuer den Reset.**

---

### Entscheidung 16 - RapidFire nach Klassen statt Konter-Leiter: KALIBRIERT, NICHT GEBAUT

> **STAND 19.08.2026 (Abend): VOLLSTAENDIG KALIBRIERT UND GEGENGEMESSEN - ABER NICHT GEBAUT.**
> Die beiden offenen Zahlen stehen fest, alle vier Abnahmekriterien sind erfuellt, der Einbau ist
> mechanisch. **Im Repo steht davon keine Zeile** (`RAPIDFIRE` ist unveraendert die Leiter,
> `SIZE_MISMATCH_EVASION_BONUS` steht auf 0,45 / 0,18, `ZIELERFASSUNG_BASE` hat keinen Eintrag
> fuer `leicht`).
>
> **ENTSCHIEDEN: Variante A (Klassen-RapidFire, EIN Ziel) mit RF-Wert 4, plus
> `SIZE_MISMATCH_EVASION_BONUS` klein/gross 0,45 -> 0,20 und mittel/gross 0,18 -> 0,08.**
> B bleibt draussen, C ist verworfen.
>
> **KEIN AUSGLEICH UEBER DIE GEGNERSTAERKE NOETIG.** Weder `PIRATEN_MULTIPLIER_ROLL` (bleibt
> gesperrt und wird nicht gebraucht) noch `RAID_WAVE_ROLL` (freigegeben, bleibt trotzdem
> ungenutzt). Das ist die zentrale Korrektur gegenueber der ersten Messrunde - Einzelheiten unter
> "Was die zweite Messrunde korrigiert hat".
>
> **ACHTUNG bei der Nachvollziehbarkeit:** die zweite Messrunde lief gegen einen KUMULATIVEN
> lokalen Messbuild, der zusaetzlich **Block A Schritt 2 enthaelt** (Entscheidung 2, ebenfalls
> nicht gebaut). Grund: beide werden zum Server-Neustart gemeinsam wirksam; wer gegen den
> heutigen Repo-Stand misst, misst gegen eine Baseline (0,80 / 19,82 / 76,85 Mrd), die es dann
> nicht mehr gibt. Gueltige Vergleichsbasis ist 0,98 / 19,57 / 61,11 Mrd.
> Messdatei: `balance/session2-simulation/rf_depth.txt`, Abschnitt "ZWEITE MESSRUNDE".
> Skripte: `make_messbuild_rf.mjs` (erste Runde), `make_messbuild_kum.mjs` (zweite Runde,
> kumulativ, RF-Wert / Ausweichbonus / `RAID_WAVE_ROLL` als Argumente), `run_rf_depth.mjs`.
> `lib.mjs`, `lib3.mjs` und `run_income_baseline_v2.mjs` loesen jetzt ebenfalls `MESSBUILD` auf -
> vorher liefen sie fest gegen `server/dist` und konnten gar nicht gegen einen Messbuild messen.
>
> **Bauanleitung - was einzubauen ist (vollstaendig, Reihenfolge egal)**
> - **`data/combatConstants.ts`, `RAPIDFIRE`:** jedes Standard-Kampfschiff kontert die komplette
>   eigene UI-Klasse (`SHIP_GROUPS`: Jaeger = leicht/schwer, Kreuzer = kreuzer/schlachtschiff/
>   bomber, Elite = schlachtkreuzer/zerstoerer/reaper), einheitlich mit **RF 4**, waehlt aber
>   weiterhin genau EIN Ziel. Verteidigungsanlagen analog nach Geschuetzgroesse
>   (raketenwerfer/leichteslaser -> Jaeger, schwereslaser/gausskanone -> Kreuzer,
>   ionengeschuetz/plasmawerfer -> Elite). **Unveraendert bleiben:** die Bunkerbrecher-Rolle des
>   Bombers gegen die drei leichten Anlagen, das Plasmawerfer-RF gegen den Imperator, die
>   Salven-Tabellen, `piratenadmiral`, und `sandronator` bleibt ohne militaerisches RF.
> - **`data/combatConstants.ts`, `ZIELERFASSUNG_BASE`: Eintrag `leicht: 0.25` ERGAENZEN.** Ohne
>   ihn liefert `getZielerfassungAccuracy()` 0 und die gesamte neue RF des Leichten Jaegers ist
>   toter Code - **genau die Falle aus Entscheidung 4.4.** Der Eintrag fehlt heute nur deshalb,
>   weil `leicht` bisher ueberhaupt kein RF-Ziel hatte. Das ist eine tragende Setzung, kein
>   Aufraeumen.
> - **`data/combatConstants.ts`, `SIZE_MISMATCH_EVASION_BONUS`:** `klein.gross` 0,45 -> **0,20**,
>   `mittel.gross` 0,18 -> **0,08**. `EVASION_MAX_SIZE_MISMATCH` bleibt bei 0,75 (der Deckel
>   greift bei den neuen Werten ohnehin nicht mehr).
> - **CLIENT-SPIEGEL, Messregel 8 - vorab gegreppt, drei Fundstellen:**
>   1. `rapidfire` und `zielerfassungBase` gehen bereits ueber `/game/data` an den Client
>      (`routes.ts` Zeilen 81/82). Beide propagieren automatisch, **hier ist nichts zu tun** -
>      aber `lib/combatInfo.ts` `getRapidFireDisplay()` listet dann je Schiff drei Ziele statt
>      einem, und `isTargetedByRapidFire()` wird fuer fast jedes Schiff wahr. Die Info-Karte
>      bleibt korrekt, verliert aber ihren Informationswert ("wird gekontert von" trifft auf alle
>      zu). Text dort anpassen: statt der Ziel-Aufzaehlung die KLASSE nennen.
>   2. `components/ShipBuildCard.tsx` Zeile 195 und `components/DefenseBuildCard.tsx` Zeile 168
>      leiten `volleyTargetTypes` aus `gameData.rapidfire[id]` ab. In `ShipBuildCard` ist die
>      Anzeige durch `isVolleyShip` abgesichert, in `DefenseBuildCard` **beim Einbau pruefen** -
>      sonst behauptet jede Verteidigungsanlage eine Mehrfachziel-Salve, die sie nicht hat.
>   3. **`SIZE_MISMATCH_EVASION_BONUS` steht NICHT in `gameData`** - die Absenkung waere fuer den
>      Spieler unsichtbar. Das ist die unten beschriebene Anzeige-Luecke; sie gehoert in
>      DIESELBE Auslieferung, sonst aendert man den Hebel, den niemand sieht. Konkret:
>      `sizeMismatchEvasionBonus`, `evasionMaxSizeMismatch` und `shipSizeClass` in `routes.ts`
>      ergaenzen, `types/game.ts` nachziehen und `getEvasionChance()` in `lib/combatInfo.ts` um
>      den Fehlpaarungs-Fall erweitern.
> - **KEINE Aenderung an `PIRATEN_MULTIPLIER_ROLL`, `RAID_WAVE_ROLL`, `DEFENSE_REPAIR_PERCENT`
>   oder den Wellenprofilen.** Alle vier wurden geprueft und sind nicht noetig.
>
> **Abnahme (vollstaendig in `rf_depth.txt`, 40 Laeufe je Zelle, scheibenweise)**
> 1. *Die Wahl der Flotte zaehlt:* profilgewichteter Wertverlust in der umkaempften Zelle
>    18,0-35,3 % statt 16,0-47,5 %, und die Elite-Aufstellung ist erstmals nicht die schlechteste.
> 2. *Keine tote Aufstellung:* niedrigste Siegquote einer reinen Aufstellung 77,5 % statt 0 %.
> 3. *Kein globaler Buff:* der Raid wird in Wert-Einheiten sogar **29 % teurer** (0,84 -> 1,08 Mrd).
> 4. *Einnahmen-Baseline:* 0,98 / 19,50 / 60,45 gegen 0,98 / 19,36 / 61,69 im kumulativen IST -
>    Abweichung maximal 2 %, also im Rauschen.
>
> **Streuung, bevor jemand die Tabellen zu fein liest:** dreimal dieselbe Zelle ergab beim
> Wertverlust 41,7 / 40,5 / 41,4 % (Spanne 1,2 Punkte), bei der Siegquote nahe der Kippkante
> 65,0 / 77,5 / 67,5 % (Spanne 12,5 Punkte). **Unterschiede unter 2 Punkten im Wertverlust und
> unter 15 Punkten in der Siegquote sind kein Befund.**
>
> *Nachteil, ausdruecklich:* eine Flotte, die ihre Macht gleichmaessig ueber alle Klassen
> verteilt, ist unter Klassen-RF die schlechteste Wahl gegen eine scharfe Welle (Siegquote 100 %
> heute, 0-10 % danach). Eine reine Aufstellung wird von EINER Gegnerklasse gekontert, eine
> gleichmaessig gemischte von allen dreien. Das ist die gewollte Entscheidung, muss aber im
> Patchtext stehen - sonst wirkt es wie ein Defekt.

**Bezug:** Nutzerbefund 18.08.2026 ("die RF kommt mir falsch vor, Kaempfe kommen linear vor statt
mit Tiefe und Spannung" - ausdruecklich NICHT "RF funktioniert nicht", das war R14).
**Dateien, falls gebaut:** `data/combatConstants.ts` (`RAPIDFIRE`, `ZIELERFASSUNG_BASE`,
`SIZE_MISMATCH_EVASION_BONUS`).

**Ausgangslage im Code (geprueft, Messregel 16):**
- Die heutige RF-Tabelle ist eine **Leiter, kein Ring**: `leicht: {}` kontert nichts, Bomber und
  Reaper werden von KEINEM Standard-Kampfschiff gekontert. Der Code-Kommentar nennt sie trotzdem
  "Stein-Schere-Papier-Kette".
- **Alle drei Wellenprofile benutzen denselben vollstaendigen Pool** (`weightsForProfile()` in
  `combat.ts`), `kampfgruppe` sogar gleichverteilt. Jede Welle enthaelt jeden Typ - deshalb ist in
  jedem Kampf jeder Konter bedient, auf beiden Seiten, und alles mittelt sich weg. **Das ist die
  Ursache des Nutzerbefunds, nicht die Form der RF-Tabelle.**

**Gemessene Varianten** (gleiche Flotten-MACHT statt gleichem Wert, damit jede Aufstellung denselben
Gegner bekommt und die RF-Frage nicht mit Entscheidung 6 vermischt wird; Sektor `piraten_hoch`,
Feindstaerke fest, 40 Laeufe je Zelle):

- **A - Klassen-RF:** jedes Schiff kontert die komplette eigene UI-Klasse (`SHIP_GROUPS`), waehlt
  aber weiterhin EIN Ziel. Nutzeridee.
- **B - geschaerfte Wellenprofile:** 75/20/5 je Klasse statt derselben flachen Kurve.
- **C - eigene Klasse plus die darunter.**
- **A+E:** A plus abgesenktem `SIZE_MISMATCH_EVASION_BONUS` (klein/gross 0,45 -> 0,20,
  mittel/gross 0,18 -> 0,08).
- **A+E+D:** zusaetzlich eine Belagerungs-Rolle gegen Verteidigungsanlagen.

**Ergebnisse (umkaempfte Zelle, Feindstaerke 2,0x - bei realistischen 0,85x gewinnt JEDE
Aufstellung zu 100 %, dort ist die Frage nicht messbar):**

| Welle | Zustand | nur Jaeger | nur Kreuzer | nur Elite |
|---|---|---|---|---|
| Kampfgruppe | IST | 100 % / 17,3 | **0 % / 47,5** | **0 % / 47,4** |
| | A | 100 % / 9,4 | 75 % / 31,6 | 100 % / 23,3 |
| | C | 100 % / 13,6 | **0 % / 47,7** | 100 % / 14,3 |
| | A+E | 100 % / 16,6 | 100 % / 25,5 | 100 % / 17,0 |
| Elitekader | IST | 100 % / 14,3 | 0 % / 47,5 | 0 % / 47,6 |
| | A+E | 100 % / 22,0 | 93 % / 30,2 | **100 % / 15,8** |

(Siegquote / Wertverlust. 47,x % ist die Saettigung durch den Rueckzug, kein Verlauf.)

**Fuenf Befunde:**
1. **Im Ist-Zustand ist die Wahl der Flotte keine Wahl.** Jaeger gewinnen jede Zelle jeder Welle,
   und das Wellenprofil aendert am Ergebnis der Elite-Flotte nichts (47,4 / 47,5 / 47,6 %).
2. **A holt die Kreuzer- und die Elite-Klasse zurueck** und macht das Wellenprofil erstmals
   relevant (Elite 47,2 / 23,3 / 16,6 % statt dreimal 47,x).
3. **C ist schlechter als A** - es verschiebt das Problem nur von der Elite- auf die
   Kreuzer-Klasse (0 % Sieg in allen drei Wellen).
4. **Erst A+E kippt die Jaeger-Dominanz.** Gegen eine Elite-Welle ist die Elite-Flotte dort zum
   ERSTEN MAL in der gesamten Messreihe die beste Wahl (15,8 gegen 22,0 %). Der Hebel ist also
   nicht die RF-Tabelle, sondern der Groessenklassen-Ausweichbonus.
5. **B liefert fuer sich genommen nichts** (A und A+B liegen im Streubereich) und schadet der
   gemischten Flotte (Schwarm-Welle 93 % -> 0 % Sieg). Die gewaehlte Schaerfe 75/20/5 ist
   allerdings hart; eine milde Fassung ist ungemessen. **Nutzerentscheidung 18.08.2026: B bleibt
   vorerst draussen.**

**Der entscheidende Befund - Klassen-RF ist ein globaler Spieler-Buff, keine Umverteilung:**
Im Raid faellt der Verteidigungsverlust von 27,3 % auf **0,0 %**. Drei Regler dagegen geprueft, alle
wirkungslos: Reparaturquote 0,70 -> 0,40, Verteidigungs-Gewicht 0,3 -> 0,6, eigene Belagerungs-RF
gegen Anlagen (A+E+D), auch in Kombination und auch mit RF-Wert 3. **Es ist kein eigener Defekt,
sondern ein Symptom:** die verteidigende Seite wird so viel staerker, dass die Wellen fallen, bevor
Schaden bis zu den Anlagen durchkommt. Dieselbe Richtung zeigen die Sektor-Zellen (Kreuzer/Elite von
0 auf 100 % Siegquote). Elite-Bollwerk unkritisch (3,2 -> 5,3 % bei "2x voll", Siegquote unveraendert).

**Nebenbefund:** das Verteidigungs-Gewicht ist ueberhaupt kein Hebel - 0,3 auf 0,6 bewegt den Raid
praktisch nicht (14,2 -> 13,2 % Flottenverlust), weil die Anlagen gegenueber der Flotte zu wenig
Macht stellen. Die Gegnerstaerke im Raid haengt faktisch allein an der Flotte.

**Was die zweite Messrunde korrigiert hat (19.08.2026, Abend)**

Der Satz oben - "Klassen-RF ist ein globaler Spieler-Buff, wer ihn einbaut, muss die Gegnerstaerke
nachziehen" - **ist falsch.** Er stuetzte sich auf die 0,0 % Verteidigungsverlust im Raid, also auf
eine Prozentzahl ohne ihren Gegenposten. Nachgerechnet, 40 statt 10 Raids je Fall:

| Zustand | Flottenverlust | Verteidigungsverlust | in Wert-Einheiten |
|---|---|---|---|
| IST | 13,6 % | 20,6 % | 0,75 + 0,09 = **0,84 Mrd** |
| RF4 + 0,20 / 0,08 | 19,6 % | 0,0 % | 1,08 + 0,00 = **1,08 Mrd** |

Die Referenz-Verteidigung ist 0,43 Mrd wert, die Referenz-Flotte 5,52 Mrd - die Anlagen sind 7 %
des verteidigten Werts. Schaden, der von den Anlagen auf die Flotte wandert, trifft also das
13-fach wertvollere Ziel. **Der Raid wird um 29 % teurer, nicht billiger.** Der Kipppunkt liegt
exakt dort, wo die Verteidigungsanlagen mehr als rund 29 % des Flottenwerts ausmachen; darunter
verliert der Verteidiger durch die Verschiebung.

Ebenso die Einnahmen-Seite: die Baseline bewegt sich nicht (0,98 / 19,50 / 60,45 gegen
0,98 / 19,36 / 61,69, beides gegen den kumulativen Messbuild). Strukturell einleuchtend - die Beute
haengt an der VERNICHTETEN FEINDMACHT, und die setzt die Sektorstaerke, nicht der Kampfverlauf; der
Gegner wird ohnehin zu 100 % vernichtet. Klassen-RF senkt nur die eigenen Verluste, und die sind
bei realer Sektorstaerke klein (6,4 -> 5,1 %).

**Damit entfaellt der gesamte Sperr-Grund.** `PIRATEN_MULTIPLIER_ROLL` wird nicht gebraucht - die
Sperre muss also gar nicht fallen. `RAID_WAVE_ROLL` ist freigegeben, bleibt aber ungenutzt: eine
Anhebung wuerde die ohnehin eintretende Verschaerfung verdoppeln, und nach Abschnitt 8 Punkt 7 hat
dieser Regler keinen sanften Bereich. Die Reparaturquote bleibt nach Abschnitt 4a unberuehrt.

**Der Einwand aus Entscheidung 6 ("RapidFire NICHT anheben - das wuerde die gesamte Sektor-Balance
mitverschieben") bleibt sachlich richtig, trifft aber nur die umkaempfte Zelle bei 2,0x.** Bei
realer Sektorstaerke (0,85x, der Erwartungswert von `PIRATEN_MULTIPLIER_ROLL.piraten_hoch`) ist der
Effekt 6,4 -> 5,1 % Wertverlust und die Belohnung unveraendert. Die Sektor-Balance aus Session 2
verschiebt sich messbar NICHT.

**Warum trotzdem nicht gebaut:** nach dem Massstab aus Abschnitt 8 ist der Umbau kein stiller
Defekt, sondern eine Design-Aenderung - er wird gesammelt und geht mit dem Server-Neustart live.

**Offen und ungemessen: nichts mehr.** Der RF-Wert ist 4 (Befund C in `rf_depth.txt`), der
Ausweichbonus 0,20 / 0,08 (Befund B). Eine milde Fassung von B bleibt ungemessen, ist aber nicht
Teil dieser Entscheidung - B ist auf Nutzerentscheidung vom 18.08.2026 draussen und wurde in der
zweiten Runde nicht wieder aufgemacht.

**Anzeige-Luecke - ab 19.08.2026 NICHT mehr unabhaengig, sondern Teil der Auslieferung:** der
Groessenklassen-Ausweichbonus wird im Client NIRGENDS angezeigt. `combatInfo.ts` zeigt nur
`evasionBase` plus Forschung - die Info-Karte meldet also z.B. 12 % Ausweichchance, waehrend im
Kampf gegen grosse Schiffe bis zu 75 % gelten. Das ist ein eigener Grund dafuer, dass sich das
Kampfsystem "unbegreiflich" anfuehlt. **Weil Entscheidung 16 genau diesen Wert absenkt, waere die
Aenderung ohne die Anzeige fuer den Spieler unsichtbar** - beide gehoeren in dieselbe
Auslieferung (Konstante ueber `/game/data`, wie bei `rapidfire`/`zielerfassungBase`; Einzelheiten
in der Bauanleitung oben, Punkt 3 des Client-Spiegels).

**Ein zweiter Anzeige-Punkt, gefunden am 19.08.2026 und fuer die Lesart der Messung entscheidend:**
das WELLENPROFIL wird pro Check gewuerfelt (`pickWaveProfile()`, `WAVE_PROFILE_WEIGHTS`) und ist im
Client ebenfalls nirgends sichtbar - `piraten_hoch` steht auf 10 % schwarm / 45 % kampfgruppe /
45 % elitekader. Der Spieler kann seine Aufstellung also nicht gegen ein bekanntes Profil waehlen;
massgeblich ist der profilgewichtete Schnitt, und die Einzelprofil-Tabellen oben sind Diagnose,
nicht Abnahme. **Wer das Wellenprofil spaeter sichtbar macht** (etwa ueber die Spionagesonde),
**kehrt das um** - die Einzelzellen werden dann zur Entscheidungsgroesse, und diese Auswertung ist
neu zu LESEN, nicht neu zu messen. Das waere zugleich der billigste Weg, dem Nutzerbefund
"Kaempfe kommen linear vor" ein zweites Mal zu begegnen: eine Wahl, die man nicht sehen kann, ist
keine.

---

## 2a. Vorgezogene Umsetzung am 10.08.2026 (ausserhalb der Blockreihenfolge)

**Nutzerentscheidung.** Ausloeser waren zwei eigene Beobachtungen beim Spielen: die Heimatbasis hat
bei V2/V3-Gebaeuden keine Module, und die Allianz-Station produziert auffaellig wenig. Beides steht
im Plan (Entscheidung 14 bzw. 7), beides war fuer spaeter terminiert. Der Nutzer wollte es sofort
geloest haben; die Blockreihenfolge ist dafuer bewusst durchbrochen worden.

**Warum das vertretbar ist:** Der Server wird ohnehin zurueckgesetzt (Abschnitt 1a). Was in den
kommenden Wochen an Spielstaenden entsteht, ist nicht erhaltenswert. Die Aenderungen kosten also
nichts ausser dem Risiko, dass spaetere Kalibrierungen sie noch einmal anfassen muessen.

**Was das NICHT aufhebt:** Die Messungen dieser Aenderungen sind gegen die alte Baseline von
21,69 Mrd/Tag gerechnet, und die faellt nach Block A weg (Abschnitt 7). Die Zahlen unten sind
Zwischenstaende, keine Endwerte.

### Was umgesetzt wurde

**1. Entscheidung 14 (Gebaeude-Module V2/V3 der Heimatbasis) - erledigt, aber ANDERS als
beschlossen.**
Der Plan sah vor, die Heimatbasis auf denselben Generator umzustellen wie die Station. **Das wurde
bewusst nicht gemacht.** Der Stations-Generator leitet die Modulkosten ueber einen festen
`MODULE_COST_MULTIPLIER` aus den Gebaeudekosten ab; auf die Heimatbasis angewandt haette er auch
die 15 bestehenden V1-Module neu bewertet - bei der Metallmine von 2.000.000/1.000.000/500.000 auf
1.500.000/600.000/0, inklusive eines auf null fallenden Deuterium-Anteils. Der Plan nennt das "die
Werte verschieben sich leicht"; tatsaechlich waere es eine stille Balance-Aenderung an bereits
kalibrierten Werten gewesen.
-> Stattdessen: V1 bleibt exakt unveraendert, V2/V3 werden DARAUS abgeleitet, mit denselben
Stufen-Faktoren, die auch die Gebaeude selbst nutzen (2x/4x Kosten, 1,3x/1,6x Bauzeit). Der Gewinn
aus Entscheidung 14 bleibt erhalten - eine kuenftige V4-Stufe entsteht automatisch mit -, ohne
Nebenwirkung auf V1. `BUILDING_MODULES` umfasst jetzt 45 statt 15 Module.
**Gemessen:** V2/V3-Gebaeude bauen bei gleichem Ausbaustand jetzt exakt so schnell wie V1
(Verhaeltnis 1,000; vorher Faktor 4 langsamer, weil die "Verstaerkte Automatisierung" von Roboter-
und Nanitenfabrik fuer V2/V3 nicht existierte und `moduleReductionFactor()` still 1 lieferte).
Foerdereffizienz wirkt jetzt auf allen drei Stufen (Stufe 10 = +50 %).
**Das ist genau die Beschleunigung um Faktor 4, vor der Entscheidung 14 warnt** - sie ist damit
bereits eingetreten und muss bei der Kalibrierung von 9.1 in Block D als Ausgangszustand
angenommen werden, nicht als noch bevorstehende Aenderung.

**2. Entscheidung 7.1 (Stufen-Relation der Allianz-Station) - erledigt.**
V2-Minen liefern jetzt 2x, V3-Minen 4x den V1-Ertrag, bei unveraendert 2x bzw. 4x Kosten (vorher
1,5x und 2,5x Ertrag bei denselben Kosten - jede Ausbaustufe war unwirtschaftlicher als die
vorherige). Energieverbrauch und Solar-Ertrag bleiben absichtlich bei 1,5x/2,5x: beide skalieren
innerhalb einer Stufe gemeinsam, der Energiefaktor je Stufe aendert sich dadurch nicht.
Der Rest von Entscheidung 7 (7.2 Kostenkurve, 7.3 Module, 7.4 Fabriken) ist NICHT angefasst.

**3. NEU, nicht aus dem Plan: Kompensationsfaktor fuer den Stations-Minenertrag.**
Siehe eigener Unterabschnitt unten - das ist der einzige Punkt hier, der nicht aus einer bereits
getroffenen Entscheidung folgt.

**3b. NACHTRAG am 10.08.2026: die Client-Spiegel waren zunaechst VERGESSEN worden.**
Die Aenderungen an 1-3 betrafen nur den Server. Ergebnis beim Spielen: **"an der Allianz-Station
hat sich nichts geaendert"** - und das war aus Nutzersicht richtig. Der Server schrieb bereits den
dreifachen Ertrag gut, aber die angezeigte Zahl blieb identisch, weil `pages/Allianz.tsx` eine
**vollstaendige eigene Kopie** von `stationMineOutputPerHour()` enthaelt, die den neuen Faktor
nicht kannte. Bei V1-Minen war die Anzeige damit Zeichen fuer Zeichen dieselbe wie vorher (deren
`baseOutput` hat sich durch 7.1 ja nicht geaendert, nur V2/V3) - der Effekt war real, aber
unsichtbar. Konkret: 15,70 Mio/h tatsaechlich gegen 5,23 Mio/h angezeigt bei einer V1-Metallmine
auf Stufe 30.

Ein zweiter Spiegel war ebenfalls betroffen: `lib/multipliers.ts` trug dieselbe V1-only-Tabelle
`BUILDING_SELF_BUILDTIME_MODULE` wie der Server vor der Korrektur und haette die Bauzeit von
V2/V3-Gebaeuden weiterhin ohne deren gebaeudeeigenes Bauzeit-Modul angezeigt.

Behoben durch: `STATION_MINING_COMPENSATION` wird jetzt ueber `/game/data` ausgeliefert
(`stationMiningCompensation`) statt im Client hartkodiert zu werden - eine Quelle, kein zweiter
Wert, der auseinanderlaufen kann. Dazu `selfBuildtimeModuleId()` auch im Client.

**Das ist exakt die Fehlerform aus Punkt 1 der README, aus Messregel 8 und aus R1** - "der
Client-Spiegel laeuft auseinander". Der Plan warnt an drei Stellen davor, und der Fehler ist beim
allerersten Eingriff trotzdem sofort wieder passiert. **Verschaerfte Regel fuer alle kuenftigen
Aenderungen: bei JEDER Aenderung an einer Formel oder Konstante, die irgendwo angezeigt wird,
zuerst `grep` im Client nach dem Funktionsnamen - erst dann den Server anfassen.** Betroffen sind
mindestens `client/src/lib/multipliers.ts`, `client/src/lib/combatInfo.ts` und
`client/src/pages/Allianz.tsx`; letztere ist im Plan bisher NIRGENDS als Spiegel gefuehrt worden,
obwohl sie die komplette Stations-Wirtschaft nachbaut.

**5. Entscheidung 1 (Overkill-Deckel bei Aggregat-Stapeln) - ERLEDIGT am 10.08.2026.**
Vorgezogen, weil die Aggregations-Schwelle eine reine PERFORMANCE-Optimierung ist und das
Kampfergebnis nicht veraendern darf. Dass sie es tat, war ein Defekt, keine Balance-Frage - und
Entscheidung 1 ist ohnehin Schritt 1 der Reihenfolge, es steht nichts davor.

*Ursache im Code:* `applyAggregateDamage()` schob den kompletten Rohschaden ungebremst in den
HP-Topf - kein Deckel, keine Kaskadengrenze, kein Durchschlags-Faktor. `MAX_CASCADE` lag als lokale
Konstante in `applyHitToTarget()` und war fuer den Aggregat-Pfad damit gar nicht vorhanden.

*Umsetzung:* neue Funktion `cappedAggregateHitDamage()` in `combat.ts`, die EINEN Treffer nach
exakt derselben Regel deckelt wie der Einzel-Pfad - eine Einheit absorbiert Schild + Panzerung, der
Ueberschuss wird mit dem Durchschlags-Faktor multipliziert und hoechstens `OVERKILL_MAX_CASCADE`
(5) mal weitergereicht. Gedeckelt wird JE TREFFER, nicht erst die Summe: ein Buendel aus 100
Treffern darf weiterhin 100 Einheiten toeten. `MAX_CASCADE` ist dafuer nach modulweit gezogen, damit
beide Pfade denselben Wert benutzen. Der Durchschlags-Faktor wird bis in `applyAggregateDamage()`
durchgereicht; **keine Aenderung an der Worker-Schnittstelle noetig**, weil er aus der ohnehin
uebergebenen Forschung abgeleitet wird.

*Gemessen mit `run_aggregate_threshold.mjs`, 20 Laeufe je Zelle:*

| Kreuzer | aggregiert | Verlust vorher | Verlust nachher |
|---|---|---|---|
| 95 | nein | 39,9 % | 40,2 % |
| 99 | nein | 39,0 % | 39,8 % |
| 100 | nein | 37,4 % | 39,5 % |
| 101 | **ja** | **100,0 %** | **35,3 %** |
| 105 | ja | 100,0 % | 31,9 % |
| 200 | ja | 100,0 % | 16,2 % |
| 400 | ja | 100,0 % | 6,6 % |

Die Klippe ist weg, die Kurve ueber die Schwelle stetig, und **grosse Flotten verlieren jetzt
anteilig weniger statt alles** - das erwartete Verhalten. Der Individual-Pfad ist unveraendert
(95/99/100 identisch im Rahmen der Streuung), also keine Nebenwirkung.

*Gegen die Befuerchtung aus Entscheidung 1 gemessen ("Sektoren werden zu leicht"):*
`run_sectors.mjs` komplett neu, alle 32 Zellen praktisch unveraendert - `gross|voll|elite` 4,1 ->
4,4 % Verlust, `gross|schwach|elite` 28,0 -> 29,0 %, Siegquote 53 -> 52 %. **Die Befuerchtung hat
sich nicht bestaetigt**, und der Grund ist einleuchtend: in normalen Sektorkaempfen hat kein
Schuetze einen Waffenwert von 574 Einheiten-HP. Der Defekt betraf fast ausschliesslich
Boss-Gegner (Piratenadmiral) gegen grosse Stapel.

*Nebenbefund, NICHT behoben:* `getDurchschlagFraction()` liefert bei Forschung 10 den Wert 1,0 -
volle Weitergabe ohne jede Daempfung. Da `computePirateResearch()` die NPC-Forschung aus der des
Spielers ableitet, macht hohe Durchschlag-Forschung damit auch die Gegner drastisch toedlicher: im
Test verliert der Spieler bei Durchschlag 10 gegen den Admiral 100 % - **auch im Individual-Pfad,
also schon vor dieser Aenderung**. Gehoert zu Block D, nicht hierher, aber vor der Kalibrierung von
Entscheidung 19 (die vier ungeskalierten Kampf-Forschungen) anzusehen.

**6. R6 (Punkte-Exploit beim Verschrotten) - ERLEDIGT am 10.08.2026.**
Im Code bestaetigt: `resourcesSpentShipsDefense` wurde beim Bauen erhoeht und beim Verschrotten
nirgends gesenkt. Neue Hilfsfunktion `refundScrapPoints()` in `economyActions.ts` zieht den
TATSAECHLICH erstatteten Betrag ab (nicht die vollen Baukosten - sonst waere die Buchhaltung in die
andere Richtung falsch).
*Gemessen:* 40 Durchlaeufe bauen -> verschrotten -> bauen landen jetzt bei **0,994x** der
Ausgangs-Punktebasis statt bei den vorhergesagten 1,429x. Die 0,6 % Abweichung nach unten sind
Rundungsverluste beim Wiederaufbau, also die konservative Richtung.
*Bekannter Randfall, bewusst akzeptiert und im Code dokumentiert:* Freischiffe aus Containern
landen ohne Punkte-Buchung in der Flotte. Wer eines verschrottet, verliert trotzdem Punkte in Hoehe
der Erstattung. Untergrenze 0 verhindert negative Werte (getestet). Die Alternative waere eine
Herkunfts-Verfolgung pro Schiff - unverhaeltnismaessig fuer eine Jackpot-Kategorie mit 7-14 %
Chance.
*Client:* `Schrotthaendler.tsx` weist jetzt auf den Punkte-Abzug hin. Ohne den Hinweis saehen
Spieler ihre Punkte ohne erkennbaren Grund sinken.

**7. Aufraeum-Paket am 11.08.2026: R2, R4, R7, R11 und R13 - alle erledigt.**
Ausgewaehlt nach einem Kriterium: kein einziger Punkt darf eine Balance-Entscheidung verlangen, die
ohne die neue Baseline nicht zu treffen ist. R3, R5, R8 und R9 sind aus genau diesem Grund NICHT
dabei.

**R4 (`defenseFactor` dreifach dupliziert) - und die Beschreibung im Plan war falsch.**
Der Plan sagte, der Simulator zeige fuer Mittel etwas anderes als das Spiel. Gegengeprueft:
Simulator (0,05/0,12/0,15) und Solo-Spiel (`missions.ts`, dieselben Werte) stimmen exakt ueberein.
Der abweichende Wert 0,10 stand in `groupOps.ts` - und dort werden alle Sektoren ausser
`piraten_elite`/`piraten_admiral` abgewiesen, der Zweig war also **unerreichbar**.
-> Zusammengefuehrt in ein neues Feld `defenseFactor` in `SEKTOR_CONFIG` plus
`sektorDefenseFactor()` als einzige Lesestelle. **Kein erreichbares Verhalten geaendert**,
bestaetigt durch einen kompletten Neulauf von `run_sectors.mjs` (alle 32 Zellen im Rahmen der
Streuung identisch).
**Dabei fiel ein VIERTER Fundort auf, den der Plan nicht kannte und der als einziger LIVE falsch
war:** `client/src/pages/Sektor.tsx` zeigte in der Sektor-Infobox eine eigene hartkodierte Kopie -
**10 % fuer Mittel, waehrend das Spiel mit 12 % rechnet**, und pauschal 15 % fuer alles ausser
Niedrig/Mittel, also auch fuer das Elite-Bollwerk mit tatsaechlich 18 %. Spieler bekamen dort seit
jeher falsche Zahlen angezeigt. Laeuft jetzt ueber `gameData.sektorConfig`. Siehe Messregel 8.

**R7 (`GalaxyEvent.claimedBy`) - bestaetigt tot.** Auf `null` initialisiert, zweimal gelesen, nie
beschrieben; die Bedingungen waren damit immer wahr. Seit der Umstellung auf "Ereignis sofort
loeschen" ist das Vorhandensein des Ereignisses selbst die Pruefung. Feld und Kommentar in
Server- und Client-Typ entfernt.

**R2 (tote Eskalations-Konfiguration) - bestaetigt tot, Teil erledigt.** `getEscalationMultiplier()`
wird in `missions.ts` aufgerufen, das Ergebnis fliesst aber nur in die `lootBase`- und
`teileCap`-Zweige - und beide Felder haben `piraten_niedrig/mittel/hoch` seit dem Umbau vom
29.07.2026 nicht mehr (nachgeprueft in `sectors.ts`: dort stehen nur `winContainer` +
`winResources`). Die drei Eintraege sind entfernt, `piraten_elite` bleibt.
**Offen bleibt die eigentliche Frage:** ob die Solo-Sektoren eine Sieg-Serien-Belohnung
zurueckbekommen sollen. Das waere eine Balance-Entscheidung (auf `winResources`, NICHT auf
`winContainer`) und gehoert in Block D.

**R13 (`totalOwnedShips()`) - erledigt, mit Absicherung.** Zaehlt jetzt dieselben fuenf Orte wie
`countShipEverywhere()`: Flotte, Bauschlange, laufende Missionen, Galaxie-Entsendungen und
angenommene Gruppen-Operationen.
*Die Absicherung war noetig und ist nicht optional:* die Korrektur macht die Zaehlung strenger, und
genau daran ist am 09.08.2026 schon einmal der gesamte Schiffsbau haengengeblieben. `state.shipLimitCeiling`
ist eine persoenliche Obergrenze, die beim ersten Aufruf auf `max(MAX_PLAYER_SHIPS, Ist-Bestand *
1,25)` gesetzt wird und danach **nur noch sinken kann** ("Ratsche"). Wer unter
`MAX_PLAYER_SHIPS` faellt, ist dauerhaft im Normalzustand; die Obergrenze steigt nie wieder.
Der Zuschlag von 25 % ist ein pragmatischer Puffer, kein hergeleiteter Wert - seine einzige Aufgabe
ist, niemanden am Umstellungstag auszusperren. Vertretbar, weil `MAX_PLAYER_SHIPS` laut eigenem
Code-Kommentar ein CPU-Sicherheitsnetz und kein Balance-Wert ist und die Engine laut Benchmark bis
1,5 Mio. Schiffen bei ~26 ms bleibt.
*Getestet:* unterwegs befindliche Schiffe werden mitgezaehlt (50.000 + 30.000 -> 80.000 statt
50.000); unter dem Limit aendert sich nichts; ein Bestand von 260.000 wird auf 325.000
grandfathered und kann weiterbauen; sinkt der Bestand auf 150.000, faellt die Obergrenze auf
200.000 und steigt danach auch bei kuenstlich erhoehtem Bestand nicht wieder.
**Nicht behoben:** Container-Freischiffe und Missionsrueckkehrer fliessen weiterhin ohne
Limitpruefung in die Flotte. Der Bestand kann die Obergrenze dadurch von selbst ueberschreiten -
Bauen ist dann gesperrt, bis wieder verschrottet wird. Das ist die konservative Richtung und war
auch vorher so.

**8. `MAX_PLAYER_SHIPS` von 200.000 auf 1.000.000 (11.08.2026, Nutzerentscheidung).**
Der urspruengliche Vorschlag war, das Limit ganz zu entfernen - Begruendung: die Engine schafft
1,5 Mio. Schiffe bei ~26 ms. **Die technische Begruendung stimmt und ist gegengeprueft:** die
einzigen Schleifen ueber Einzelstuecke in `combat.ts` (`buildUnits()`, Zeilen 783/864) laufen
ausschliesslich UNTERHALB von `STACK_AGGREGATE_THRESHOLD_BY_TYPE`; darueber wird ein Stapel zu
einem Objekt. Auch ausserhalb des Kampfes skaliert nichts mit der Stueckzahl - `state.fleet` ist
ein Record aus Typ und Anzahl, der Spielstand ist bei 1,5 Mio. Schiffen genauso gross wie bei 100.

**Trotzdem bewusst nicht auf unbegrenzt**, aus zwei Gruenden - der zweite ist der wichtigere:
1. Die Unabhaengigkeit von der Stueckzahl gilt WEGEN der Aggregation. Senkt jemand spaeter eine
   Schwelle oder baut einen Kampfmodus, der wieder pro Einheit rechnet, gibt es ohne Limit keinen
   Auffangboden. Eine Grenze weit oberhalb jeder realistischen Nutzung kostet nichts.
2. **Das Limit ist gerade kein reiner CPU-Wert mehr.** Seit dem Overkill-Deckel (Punkt 5 oben)
   verlieren grosse Flotten anteilig deutlich weniger - 400 Kreuzer 6,6 %, wo vorher alles wegging.
   Je groesser die Flotte, desto sicherer wird sie pro Schiff. Genau diese Rueckkopplung soll
   **Entscheidung 2 (Beute-Kurve, Exponent 0,85) abfangen - und die ist noch nicht gebaut.** Bis
   dahin wirkt das Schiffslimit als stiller Ersatz-Bremsklotz gegen Weglauf-Wachstum. Ihn ganz zu
   entfernen, bevor die eigentliche Bremse existiert, waere genau die Reihenfolge, vor der dieser
   Plan an mehreren Stellen warnt.

*Wechselwirkung mit R13:* die Ratschen-Absicherung greift bei zwei Spielern mit rund 103.000
Schiffen jetzt nie - getestet, dass sie oberhalb von 1.000.000 weiterhin funktioniert (Bestand
1,3 Mio. -> Obergrenze 1,625 Mio., Bauen erlaubt; faellt der Bestand, faellt die Obergrenze auf
1.000.000 zurueck). Sie ist also nicht ueberfluessig geworden, nur ruhend.

**-> Nach Block D erneut ansehen.** Dann ist es wieder eine reine CPU-Frage. Steht als Messpunkt in
Abschnitt 7.

**9. Bot-/Piratenbasis-Sparfalle behoben (12.08.2026).**
*Befund aus dem Livebetrieb, nicht aus einer Session.* Ausloeser war eine Coolify-CPU-Spitze; die
Spur fuehrte ueber wiederholte `runGlobalHeartbeat`-Warnungen ("Langsamer tick() bei KI-Nyx") zu
einem strukturellen Fehler in der KI-Wirtschaft.

*Gemessene Ausgangslage* (Datenbank-Abfrage im laufenden Container, 12.08.2026):

| Konto | angelegt | Minen | Metall | Verteidigung |
|---|---|---|---|---|
| KI-Nyx | 30.07. | 11/10/9 | 11.204 | 8.793, davon 8.614 Leichte Lasergeschuetze |
| KI-Vega | 30.07. | 11/10/10 | 36.136 | 1.382 |
| SchnelleRatte (Mensch) | - | 36/32/30 | 15,93 Mrd | - |
| ShadowEagle (Mensch) | - | 36/32/30 | 16,40 Mrd | - |

Beide Bots sind **13 Tage alt und stehen bei Minenstufe 11**, waehrend die menschlichen Spieler bei
36 liegen. Entscheidend: `buildingQueue` UND `researchQueue` waren bei beiden **leer**, in den
Bau-Schlangen stand nur je EIN Einzelstueck (1 Leichter Jaeger bzw. 1 Leichtes Lasergeschuetz).
Seit 13 Tagen wurde also kein Gebaeude und keine Forschung mehr gestartet.

*Ursache:* Der Fallback "billigstes, ein Stueck" in `maybeBuildShips`/`maybeBuildDefense`
(`economyBotTurn.ts`) raeumte bei JEDEM Zug das letzte Metall ab. Nachgerechnet: Metallmine Stufe 11
liefert 313.843 Metall/h, also rund 10.500 pro Zwei-Minuten-Takt; ein Leichtes Lasergeschuetz
kostet 30.000, wird also etwa alle drei Takte gekauft. Metallminen-Stufe 12 kostet 372.194 - das
waeren 36 Takte ununterbrochenes Sparen, was nie eintritt. Alle beobachteten Metallstaende lagen
folgerichtig im Band 8.800 bis 37.000.

*Behoben durch eine Ruecklage:* `spendableResources()` zieht die Kosten des naechsten Gebaeude- und
Forschungsschritts ab, bevor Schiffe oder Verteidigung gebaut werden. Selbstbegrenzend - sobald der
Ausbau bezahlt ist, faellt die Ruecklage weg. Fuer Module wird bewusst NICHT zurueckgelegt, die
wuerden ueber denselben Slot dauerhaft blockieren. `buildingCostForLevel()` und
`researchCostForLevel()` sind dafuer aus `actions.ts` exportiert worden.

*Verifiziert* durch einen direkten Entscheidungstest (kein Wirtschaftsmodell): bei 372.194 Metall
baut der alte Code ein Lasergeschuetz, der neue behaelt das Metall; bei 2 Mio baut der alte zehn,
der neue eines.

> **METHODISCHE WARNUNG - hier ist beinahe eine unbelegte Aenderung ausgeliefert worden.**
> Zwischen Diagnose und Behebung lag ein Versuch, den Effekt mit einer selbstgebauten
> Wirtschaftssimulation zu belegen (`runEconomyTick` + `runEconomyBotTurn` ueber simulierte Wochen,
> gefaelschte Uhr). **Diese Simulation ist falsch und wurde verworfen:** sie liess den Bot in zwei
> Wochen auf Minenstufe 20 und 2,5 BILLIONEN Metall wachsen, waehrend die realen Konten bei
> 16 Milliarden liegen - drei Groessenordnungen daneben, Ursache ungeklaert. Sie zeigte zudem
> KEINEN Unterschied zwischen altem und neuem Code und haette die Aenderung damit faelschlich als
> wirkungslos verworfen. Belegt wurde am Ende ausschliesslich durch (a) den realen
> Datenbank-Zustand und (b) transparente Arithmetik aus den Kosten-/Produktionsformeln.
> **Lehre: eine selbstgebaute Simulation ist erst dann Beweismittel, wenn sie einen bekannten
> realen Zustand reproduziert.** Das ist dieselbe Warnung wie in Abschnitt 1b zu den technischen
> Vorbedingungen (V1/V2) - dort steht sie fuer die 30-Tage-Simulation, hier ist sie praktisch
> eingetreten.

**OFFEN, bewusst nicht mit erledigt:** Piratenbasen laufen durch dieselbe Funktion
(`runEconomyBotTurn(base.state)` in `pirateBaseState.ts`) und steckten in derselben Falle - die
beobachtete Basis hatte 20.112 Leichte Lasergeschuetze bei einem Startbestand von 1.120, Metall
37.928, Kristall und Deuterium exakt am `RESOURCE_CAP`. **Die Behebung veraendert damit auch die
Zusammensetzung der Piratenbasen** (weniger billige Geschuetze, hoehere Minen/Forschung, gemischtere
Verteidigung) und damit die Schwierigkeit eines Angriffs auf sie - eine Einnahmequelle. Das ist
NICHT gemessen worden, weil sich die Wirkung erst ueber Tage aufbaut. **Nach dem naechsten
Server-Reset gegen die Basis simulieren (Abschnitt 7).**

*Nebenbefund, nicht behoben:* `sentinelkanone` und `ultimatekanone` fehlen in
`STACK_AGGREGATE_THRESHOLD_BY_TYPE` und fallen auf den Standardwert 2000 zurueck. Mit maxCount
150/60 erreichen sie den nie, werden also in jedem Kampf einzeln gerechnet. Bei 210 Einheiten
folgenlos, aber die Luecke besteht.

**10. Ausbaugrenze der Piratenbasen aufgehoben (12.08.2026, Nutzerentscheidung).**
*Vom Nutzer entdeckt*, direkt im Anschluss an die Sparfallen-Behebung (Punkt 9): Wenn Basen einen
Ressourcen-Deckel haben, wie sollen sie dann je Gebaeude bezahlen, die mehr kosten?

**Der Deckel erfuellte zwei Aufgaben, nur eine davon war beabsichtigt.** Gewollt: die
Beute-Kalibrierung (35 % des Bestands, gedeckelt auf 15,4M/7M/2,1M pro Beutezug). Ungewollt: eine
harte Ausbaugrenze, weil ein Gebaeude oberhalb des Deckels nie bezahlbar wird. Nachgerechnet:

| Gebaeude | letzte erreichbare Stufe | Stand 12.08.2026 |
|---|---|---|
| Metallmine | 22 | 13 |
| Kristallmine | 20 | 12 |
| Deuterium-Synthetisierer | 19 | 12 |
| Solarkraftwerk | 23 | 16 |
| Roboterfabrik | 14 | 5 |
| Nanitenfabrik | **6** | 2 |

Die Forschung war nicht betroffen (alles erreicht Stufe 10 oder 11), mit einer Ausnahme:
**Hyperraumantrieb kam nur auf 9** und blieb fuer Basen dauerhaft eine Stufe unter dem Maximum.

*Behoben durch Entkopplung:* `RESOURCE_CAP` heisst jetzt `LOOT_BASIS_CAP` und wird NUR noch bei der
Beute-Berechnung angewandt (`Math.min(bestand, cap) * PIRATE_BASE_LOOT_PERCENT`), nicht mehr auf den
Lagerbestand. **Die Beute bleibt dadurch exakt wie kalibriert** - geprueft ueber mehrere
Bestandshoehen bis 2 Mrd, das Ergebnis bleibt konstant bei 15,4M/7M/2,1M. Nur der Bestand darf
darueber hinauswachsen.

**OFFEN und ausdruecklich festgehalten:** Dieser Deckel war die EINZIGE Bremse fuer das Wachstum
einer Piratenbasis. Gebaeude und Forschung haben eigene Maximalstufen - sind die erreicht, fliesst
wieder alles in Schiffe und Verteidigung, jetzt aber unbegrenzt. **Und es ist bis heute NICHT
geklaert, was den langsamen `tick()` bei KI-Nyx verursacht hat** (siehe Punkt 9): die Vermutung fiel
auf die Menge der Verteidigungsanlagen, wurde aber nie zu Ende verfolgt, weil die Sparfalle
dazwischenkam. Solange das offen ist, laesst sich nicht sagen, ob eine Basis mit 100.000 Einheiten
problemlos laeuft. Die Kampf-Engine aggregiert nach TYP statt nach Stueckzahl, was dafuer spricht -
das ist aber Theorie, keine Messung. **Deshalb im selben Zug die Diagnose nachgeruestet** (siehe
unten). Nutzerposition dazu: Basen und Bots sollen unbegrenzt dasselbe koennen wie Spieler, solange
die CPU mitspielt.

**11. Gesamt-Aufschluesselung im `tick()` (12.08.2026).**
Die Warnungen "Langsamer tick() bei KI-Nyx: 650ms" liessen sich nicht zuordnen, weil KEINE einzelne
Phase die Schwelle `SLOW_TICK_PHASE_MS` (1000 ms) riss - die Zeit verteilte sich. Neu:
`SLOW_TICK_TOTAL_MS` (500 ms, bewusst gleich `SLOW_USER_TICK_MS` im Heartbeat) loggt bei
auffaelligem Gesamtlauf ALLE Phasen mit Dauer, absteigend sortiert. Beide Warnungen erscheinen damit
zum selben Vorfall und ergaenzen sich: die eine nennt Nutzer, Spielstandgroesse und Nachrichtenzahl,
die andere die Phasenverteilung.

*Praktische Voraussetzung, unabhaengig vom Code:* Coolify haelt nur die Ausgabe des AKTUELL
laufenden Containers. Bei jedem Redeploy ist das Protokoll weg - genau das ist am 12.08.2026
zweimal passiert und hat die Diagnose verzoegert. Entweder vor jedem Deploy abrufen oder die
Container-Ausgabe dauerhaft wegschreiben lassen.

**12. Ursache der langsamen ticks gefunden - Cross-User-Sweeps, nicht die Verteidigungsmenge
(12.08.2026).**
Die am selben Tag eingebaute Gesamt-Aufschluesselung (Punkt 11) hat sofort geliefert. Drei
Durchlaeufe bei KI-Nyx:

| Phase | Dauer |
|---|---|
| `runEconomyTick` (die EIGENE Wirtschaft des Nutzers) | **1 ms** |
| `processAllDepartedGroupOperations` | 481-511 ms |
| `processOverdueRaidsForOtherUsers` | 32-549 ms |

**Die Vermutung "zu viele Verteidigungsanlagen" war falsch** - sie stand zwei Tage lang im Raum und
haette beinahe zu einer Optimierung am falschen Ende gefuehrt. Der betroffene Nutzer verursacht die
Last gar nicht selbst; sie entsteht in den Funktionen, die die Spielstaende ALLER ANDEREN laden.

**Der eigentliche Multiplikator:** `tick()` laeuft bei JEDEM `GET /game/state`-Poll, also alle
3 Sekunden pro geoeffnetem Client (Kommentar im Code, `GameContext.tsx`). Bei zwei offenen Fenstern
sind das rund 40 vollstaendige Cross-User-Durchlaeufe pro Minute, jeder mit Laden und Parsen fremder
Spielstaende von 435 bis 655 KB.

**Zusaetzlich war ein Teil davon von Anfang an redundant:** Der Heartbeat ruft
`processAllDepartedGroupOperations()` bereits einmal global mit einem Anker-Zustand auf - mit dem
ausdruecklichen Kommentar "ein Durchlauf pro Nutzer waere unnoetig". Der Aufruf in `tick()` machte
genau das, was dort als unnoetig bezeichnet wird.

*Behoben durch Drosselung* (`CROSS_USER_SWEEP_MIN_INTERVAL_MS` = 30 s, modulweiter Zeitstempel in
`actions.ts`): die drei Sweeps laufen hoechstens alle 30 Sekunden statt alle 3 Sekunden.
**Bewusst gedrosselt statt entfernt** - sie bleiben damit Sicherheitsnetz, falls der Heartbeat
aussetzt. Die Korrektheit haengt ohnehin nicht am Poll-Takt: der Heartbeat prueft alle 2 Minuten,
30 Sekunden sind deutlich feiner.

**OFFEN:** Beim Serverstart meldet die Datenbank fuer KI-Nyx **435 KB**, die Heartbeat-Warnung
wenige Minuten spaeter **761 KB** fuer denselben Spielstand im Speicher - 326 KB Differenz,
ungeklaert. Entweder waechst der Zustand zur Laufzeit sehr schnell, oder im Speicher haengt etwas
dran, das nicht persistiert wird. Vor weiteren Optimierungen ansehen.

**13. KI-Flotten: einseitig gebaut und eingefroren stationiert (13.08.2026, beides Nutzer-Fund).**

**(a) Nur Leichte Jaeger.** `maybeBuildShips()` geht die Typen nach geringstem Bestand durch - also
die teuren zuerst, weil der Bot sie noch gar nicht besitzt - und bestellte davon STARR 5 Stueck.
Fuenf Reaper kosten 4,80 Mio, fuenf Bomber 5,40 Mio, fuenf Leichte Jaeger 0,60 Mio. Zuverlaessig
durch kam damit nur der guenstigste Typ, der als einziger einen hohen Bestand hat und deshalb ganz
hinten in der Liste steht. Die im Code-Kommentar beschriebene Absicht ("ergibt von selbst eine
durchmischte Flotte") war dadurch wirkungslos.
*Beleg aus dem Livebetrieb:* KI-Nyx und KI-Vega besassen nach zwei Wochen ausschliesslich Leichte
Jaeger (1.263 bzw. 1.377). Die Piratenbasen bauten dagegen quer - **weil sie dank ihres damaligen
Ressourcen-Deckels von 44 Mio schlicht reicher waren**: ueber dem Seed-Bestand +525 Schwere Jaeger,
+285 Kreuzer, +183 Reaper, +140 Schlachtschiffe. Dieselbe Logik, anderes Budget.
*Verschaerft durch die Ruecklage vom 12.08.2026* (Punkt 9), die den frei verfuegbaren Anteil
zusaetzlich verkleinert - eine Nebenwirkung, die dort nicht bedacht war.
*Behoben:* Stueckzahl flexibel (1 bis 5) statt starr 5. Gemessen bei 600k Budget: vorher
"5x leicht", nachher "2x schwer"; bei 1 Mio vorher "5x leicht", nachher "4x schwer". Der
Guenstigster-Fallback fuer Schiffe entfaellt damit ersatzlos - der Durchlauf nach geringstem Bestand
findet ohnehin jeden bezahlbaren Typ.

**(b) Stationierte Flotten waren eingefroren.** `maybeHoldAtHumans()` prueft "haelt dort schon eine
eigene Flotte?" und brach dann komplett ab. Einmal abgestellt, wurde nie wieder aufgestockt.
*Beleg:* je 5 Leichte Jaeger standen ueber eine Woche unveraendert bei den menschlichen Spielern,
waehrend die Bot-Flotte auf ueber 1.200 Schiffe wuchs - der Anteil von 15 % stammte aus einer Zeit,
als der Bot rund 33 Schiffe besass.
*Behoben:* Der Sollwert wird gegen die GESAMTE Bot-Flotte (Heimat + bereits stationiert) gerechnet
und bei Unterschreitung nachgelegt. Gegengerechnet auf Rueckkopplung (jede Entsendung verkleinert
die Heimatflotte): der Bestand pendelt sich nach EINEM Nachlegen bei exakt 15 % ein und bleibt
stabil - keine Endlosschleife, kein Leerlaufen der Heimatbasis.
*Folgefehler sofort mitbehoben (Nutzer-Hinweis noch im selben Zug):* Das Nachlegen legt technisch
eine ZUSAETZLICHE Entsendung an - eine bereits fliegende Flotte laesst sich nicht rueckwirkend
vergroessern. Ohne Gegenmassnahme waechst die Liste "Eingehende Flotten" beim Zielspieler mit jeder
Aufstockung um eine Zeile, also bei jeder Verdopplung der Bot-Flotte um eine weitere.
`mergeArrivedDeployments()` in `galaxy.ts` fasst deshalb ANGEKOMMENE Halte-Flotten desselben
Besitzers am selben Ziel zu einem Eintrag zusammen. Bewusst erst nach der Ankunft: unterwegs
befindliche Fluege haben eigene Ankunftszeiten und muessen getrennt bleiben, sonst stimmt die
Anzeige "Ankunft in ..." nicht. Der aelteste Eintrag bleibt bestehen, weil an seiner Ankunftszeit
die Anzeige "Haelt seit ..." haengt; zurueckgerufene Flotten bleiben unangetastet. Getestet mit
gemischten Zustaenden (zwei angekommene + eine unterwegs + eine zurueckgerufene + ein zweites Ziel):
nur die beiden angekommenen desselben Ziels werden vereint.

*Bewusst NICHT geaendert:* das Zurueckziehen nach einem Raid. Dauerhaft vor Ort zu bleiben ist der
Zweck der Stationierung (sie verteidigt bei Piratenraids mit). Der Fehler war nicht, dass die
Flotte blieb, sondern dass sie nicht mitwuchs.

**Beides ist balance-relevant** und veraendert, wie stark Bots als Raid-Ziel und Expeditionspartner
sind sowie wie sich Piratenbasen zusammensetzen. Nach dem Reset zusammen mit den uebrigen
KI-Messpunkten in Abschnitt 7 pruefen.

**14. Abschuss-Punkte nach Beitrag statt voll je Teilnehmer (13.08.2026, Nutzerentscheidung).**
*Ausgangsbeobachtung des Nutzers:* Er teilt im Elite-Bollwerk mehr Schaden aus als seine Frau, liegt
in der Bestenliste aber hinter ihr (42,45 Mio gegen 46,00 Mio Punkte).

*Erste Klaerung:* **Schaden fliesst gar nicht in die Punkte ein.** `calculatePoints()` besteht aus
Ressourcenausgaben (Schiffe/Verteidigung, Forschung/Gebaeude) plus vernichteten Gegnern, gewichtet
nach Einheitenwert. Bei diesem Spieler stammen rund **95 % der Punktzahl aus Abschuessen**
(40,3 von 42,45 Mio); die angezeigten "13.831.456 zerstoerte Piraten" sind der Rohzaehler an
Einheiten, nicht die Punkte daraus. Ueberschuessiger Schaden verpufft - wer eine Einheit mit 500.000
statt 20.000 Schaden erledigt, bekommt dieselben Punkte.

*Eigentlicher Befund:* Bei Mehrspieler-Kaempfen bekam **jeder Beteiligte die VOLLE Abschussliste**
gutgeschrieben - in `groupOps.ts` ("jeder Teilnehmer bekommt denselben Ausgang gutgeschrieben") und
an DREI Stellen in `raids.ts` (Verteidiger, Verstaerker, haltende Flotten). Wer eine einzelne
Spionagesonde mitschickte, erhielt dieselben Punkte wie jemand mit 20.000 Schiffen.

*Nutzerargument, das den Ausschlag gab:* "Wenn ich alleine fliege, bekomme ich ja auch nur meine
Punkte." **Das traegt auch rechnerisch:** die NPC-Staerke einer Gruppen-Expedition skaliert mit der
GESAMTEN eingesetzten Flottenmacht, die Gruppe vernichtet also mehr als ein Einzelspieler. Wird
diese groessere Beute nach Beitrag aufgeteilt, bekommt jeder ungefaehr das, was er auch solo
bekommen haette - die Gleichbehandlung, die vorher fehlte.

*Umgesetzt:* `contributionShares()` und `scaleKills()` in `stats.ts`, angewandt in `groupOps.ts` und
an allen drei Stellen in `raids.ts`. **Als Beitrag zaehlt Schaden AUSGETEILT UND ABSORBIERT** - nur
den ausgeteilten zu werten waere ein Eigentor gewesen, weil das Bollwerk konstruktionsbedingt den
geringsten Waffenwert hat und ausgerechnet bei der Heimatverteidigung, seinem Heimatfeld (siehe
Abschnitt 4a), am schlechtesten bezahlt worden waere.

*Gerechnet mit den echten Zahlen aus dem Bericht des Nutzers:*

| Beteiligter | Anteil | Abschuesse (vorher / nachher, Leichte Jaeger) |
|---|---|---|
| ShadowEagle | 80,4 % | 82.628 / 66.402 |
| SchnelleRatte | 18,9 % | 82.628 / 15.615 |
| KI-Nyx (haltende Flotte) | 0,7 % | 82.628 / 611 |

*Fallstrick beim Bauen, fast uebersehen:* `playerResults` wird in `raids.ts` schrittweise befuellt -
erst der Verteidiger, dann die Verstaerker, zuletzt die haltenden Flotten. Eine zu frueh berechnete
Aufteilung haette dem Verteidiger 100 % gegeben und allen anderen null. Die Berechnung liegt deshalb
jetzt ganz am Ende, und das Speichern der fremden Spielstaende musste mit dorthin verschoben werden,
sonst waere die Statistik verlorengegangen.

**Bewusst NICHT mit umgestellt: die BELOHNUNGEN.** Container und Beute bleiben voll je Teilnehmer.
Das ist dieselbe Frage wie Variante 4 im Raid-Kasten (Entscheidung 3) und wird dort als Ganzes
entschieden - inklusive der Beute aus Gruppen-Expeditionen. **Damit ist die Punktevergabe jetzt
beitragsbasiert, die Belohnungsvergabe aber noch nicht.** Diese Inkonsistenz ist bewusst und
temporaer.

> **OFFEN: Der Beitrags-Massstab wirkt nicht so, wie er begruendet ist (erkannt 13.08.2026 durch
> Nutzerrueckfrage - "dann koennte es Sinn machen, Bollwerk zu spielen, um Schaden zu fangen,
> damit andere schiessen koennen").**
>
> Die Idee ist schluessig, geht mit der aktuellen Rechnung aber nicht auf. Aus dem realen
> Kampfbericht des Nutzers (Elite-Bollwerk):
>
> ```
> Schaden ausgeteilt - eigene Flotte   35.342.128.893
> Schaden ausgeteilt - Gegner             583.884.340
> ```
>
> Der gesamte gegnerische Schaden ist das, was auf Spielerseite ueberhaupt absorbiert WERDEN kann -
> und das sind **1,6 %** der Summe aus beidem. Ein Spieler, der saemtlichen Beschuss auf sich zieht
> und selbst keinen Schuss abgibt, bekaeme also 1,6 % der Punkte. **Tanken lohnt sich unter dieser
> Rechnung nicht.**
>
> Verstaerkend: Das Bollwerk absorbiert nicht MEHR Schaden als andere - der Gegner teilt insgesamt
> gleich viel aus, das Bollwerk ueberlebt ihn nur besser. Der einzige echte Zugewinn ist, dass bei
> zaeheren Einheiten weniger Schaden als Ueberschuss verpufft.
>
> **Damit ist die Begruendung an `contributionShares()` ("wer Treffer schluckt, damit andere
> schiessen koennen, leistet einen ebenso realen Beitrag") als Prinzip richtig, in der Umsetzung
> aber weitgehend wirkungslos.** Das war beim Bauen zu optimistisch eingeschaetzt: die Addition
> beider Zahlen setzt stillschweigend voraus, dass sie in derselben Groessenordnung liegen. Bei
> einseitigen Kaempfen mit nahezu null Verlusten tun sie das nicht.
>
> **Loesungsansatz (NICHT umgesetzt, Nutzerentscheidung 13.08.2026: "erst mal in Plan festhalten,
> das muss noch genauer besprochen werden und fordert Anpassungen an mehreren Stellen"):**
> Statt beide Zahlen zu addieren, jede an ihrer EIGENEN Summe messen und dann mitteln - wer 50 %
> des ausgeteilten Schadens beisteuert und 50 % des einsteckenden, bekommt 50 %. Ein reiner Tank
> kaeme damit auf die Haelfte statt auf 1,6 %. Optional mit Gewichten, falls Austeilen und
> Einstecken nicht gleich viel wert sein sollen.
>
> **Das waere eine bewusste Design-Entscheidung, keine Korrektur:** sie erklaert Schaden austeilen
> und Schaden aufnehmen fuer gleichwertig. In einem Abnutzungssystem, in dem Schaden die Kaempfe
> entscheidet, ist das diskutabel - genau deshalb vertagt.
>
> **Betrifft mehrere Stellen**, die gemeinsam entschieden werden muessen: den Massstab selbst
> (`contributionShares()`), die Belohnungsaufteilung (Variante 4 in Entscheidung 3, die denselben
> Massstab braeuchte) und die Klassenbalance (Abschnitt 4a - ein aufgewerteter Tank-Beitrag
> veraendert den Wert des Bollwerks ueber den Kampf hinaus).
>
> **GESCHLOSSEN am 15.08.2026: Der Massstab bleibt unveraendert, der Loesungsansatz wird
> VERWORFEN.** Messung `run_raid_support.mjs`/`raid_support.txt`, 5 komplette Raids je
> Konstellation.
>
> - **Der absorbierte Anteil ist im RAID noch kleiner als im Elite-Bollwerk: 0,0 bis 0,6 % statt
>   1,6 %.** Die 1,6 % stammten aus einem Expeditionsbericht; die Vermutung, bei der
>   Heimatverteidigung sehe es besser aus, ist widerlegt. Die Verteidigung steckt kaum etwas ein,
>   weil sie kaum etwas verliert.
> - **Der Vorschlag kippt ins Gegenteil.** "Je Kategorie normieren, dann mitteln" gibt einer
>   Groesse, die 0,04 % des Geschehens ausmacht, die halbe Stimme. Gemessen bekaeme Bot 1, der
>   1,0 von 45 Mrd Schaden austeilt (2,2 %), unter dem neuen Massstab **14,2 %** - allein weil er
>   zufaellig den groessten Teil einer winzigen absorbierten Menge abbekam. Das ist keine
>   Aufwertung des Tankens, sondern Verstaerkung von Rauschen.
> - **Die urspruengliche Sorge um das Bollwerk traegt nicht.** Der reine Tank kommt unter dem
>   heutigen Massstab auf 4,3 %, ein gleich grosser Standard-Verstaerker auf 5,3 %. Der Unterschied
>   ist klein genug, um keine Sonderregel zu rechtfertigen.
> - *Konsequenz fuer die Belohnungsaufteilung:* Variante 6 in Entscheidung 3 nutzt damit denselben
>   Massstab wie die Punktevergabe - die dort als "bewusst und temporaer" bezeichnete Inkonsistenz
>   loest sich auf.
> - *Was offen bleibt:* Wenn Tanken belohnt werden SOLL, braucht es eine andere Bezugsgroesse als
>   absorbierten Schaden. Der ist in diesem Spiel zu klein, um irgendetwas zu tragen. Das ist eine
>   Inhaltsfrage, keine Kalibrierung, und gehoert nicht in Block A.

**R11 (Changelog) - erledigt.** Zwei Eintraege (10.08. und 11.08.), fuer Spieler formuliert. Der
neueste Eintrag war zuvor vom 06.08.2026, waehrend seitdem sechs spuerbare Aenderungen live
gegangen sind - darunter die vervierfachte Stationsproduktion und der Punkte-Abzug beim
Verschrotten, die beide ohne Erklaerung wie ein Fehler ausgesehen haetten.

**4. R12 (Startpruefung fuer zusammengesetzte Modul-IDs) - erledigt.**
Neue Datei `game/moduleIntegrity.ts`, eingehaengt in `index.ts`. Bildet beim Serverstart dieselben
Modul-IDs, die `actions.ts`/`stations.ts` zur Laufzeit zusammensetzen, und meldet jede ohne
Definition. Bricht bewusst nicht ab. Genau diese Pruefung haette den V2/V3-Ausfall sofort sichtbar
gemacht.

### Der Kompensationsfaktor der Allianz-Station (offener Kalibrierpunkt)

**Befund (Code-Pruefung 10.08.2026, nicht aus den Sessions):** Die Station nutzt dieselben
Basiswerte und dieselbe Formel wie die Heimatbasis. Der Unterschied liegt woanders:
`stationMineOutputPerHour()` wendet den Mining-Multiplikator NICHT an. Die Heimatbasis bekommt bei
Vollausbau bis zu **6,12x** obendrauf (Mining-Forschung 10 = 2,0 * Mining-Boost Minen 10 = 1,5 *
Prospektor 1,2 * Abbau-Booster 1,7). Die Station bekam davon nichts und produzierte bei gleicher
Gebaeudestufe **ein Sechstel**.

**Die Entkopplung selbst ist richtig und bleibt** (Nutzerbestaetigung): bei mehreren Mitgliedern
mit unterschiedlicher Forschung waere nicht definiert, wessen Stand gilt. Der Code dokumentiert das
ausdruecklich. **Nur ausgeglichen wurde sie nie** - das war eine Luecke, kein Beschluss.

**Umsetzung:** neue Konstante `STATION_MINING_COMPENSATION = 3` in `data/stationBuildings.ts`,
angewandt in `stationMineOutputPerHour()`. Ausgeglichen wird bewusst nur der dauerhafte
**Forschungsanteil** (2,0 * 1,5 = 3,0), nicht die vollen 6,12: Prospektor ist eine Klassenwahl
unter mehreren, der Abbau-Booster ist zeitlich begrenzt und kostet DM. Beides gehoert dem einzelnen
Spieler, nicht dem Gebaeude.

**Gemessen** (alle drei Stufen auf Level 30, ohne Module, gegen die alte Baseline):

| Stand | Ertrag der Station | Anteil an 21,69 Mrd/Tag, ganze Station | dito, pro Kopf bei 2 Mitgliedern |
|---|---|---|---|
| vorher | 78,4 Mio Wert/h = **1,88 Mrd/Tag** | 8,7 % | 4,3 % |
| nachher (7.1 + Kompensation, Faktor 4,20) | 329,2 Mio Wert/h = **7,90 Mrd/Tag** | 36,4 % | **18,2 %** |

**Die Pro-Kopf-Spalte ist die massgebliche** (praezisiert 10.08.2026 nach Nutzerhinweis): Die
Baseline von 21,69 Mrd/Tag ist ein Wert fuer EINEN Spieler. Die Station ist ein gemeinsamer Topf,
aus dem alle Mitglieder entnehmen - der Stationsertrag muss also durch die Mitgliederzahl geteilt
werden, bevor er mit der Baseline verglichen wird. Bei den aktuell zwei Spielern sind das rund
3,95 Mrd/Tag je Person.

**Wichtig fuer jede kuenftige Messung:** Der Teiler steht NIRGENDS im Code. `withdrawFromStation()`
hat keine Pro-Mitglied-Quote, die Mitgliederzahl beeinflusst weder Produktion noch Entnahme - wer
zuerst entnimmt, bekommt. "Haelfte je Spieler" ist eine Absprache zwischen den Beteiligten, keine
Mechanik. Die Zahlen oben gelten also nur, solange gleichmaessig entnommen wird; im Extremfall
(einer nimmt alles) gelten die 36,4 %. Bei einer wachsenden Allianz faellt der Pro-Kopf-Anteil
entsprechend (zu viert rund 9 %) - **wer den Ertrag spaeter an die Mitgliederzahl koppeln will,
muss die Aufteilung erst bauen.**

**WARUM DAS TROTZDEM EIN OFFENER PUNKT IST - abgeschwaecht am 10.08.2026:**
Hier stand zunaechst, 7,90 Mrd/Tag laegen oberhalb des Raids vor seiner Halbierung (6,31 Mrd/Tag)
und die Station bekomme damit genau die Eigenschaft, die Entscheidung 3 am Raid als Fehler
bewertet. **Das war gegen die falsche Bezugsgroesse gerechnet:** pro Kopf sind es bei zwei
Mitgliedern rund **3,95 Mrd/Tag**, also deutlich unter dem Raid und knapp innerhalb des unten
genannten Zielbands. Der Einwand faellt damit weitgehend weg.

Was bestehen bleibt, ist die **Art** der Quelle, nicht ihre Groesse: die Station liefert voellig
passiv, ohne Flottenbindung, ohne Flugzeit, ohne Entscheidung - dieselbe Eigenschaft, wegen der
Entscheidung 3 den Raid halbiert. Sie ist deshalb weiter zu beobachten, aber nicht vorrangig zu
korrigieren.

Gegenargumente, die zusaetzlich fuer den Wert sprechen: der Vollausbau kostet 558 Mrd Ressourcen
(rund 26 Tage Gesamteinnahmen), er ist ein spaetes Ziel, und die Station ist laut Entscheidung 7
ausdruecklich als **Ressourcen-Senke** gedacht - eine Senke, die nichts zurueckgibt, wird nicht
gebaut.

**Entscheidungsregel fuer die Umsetzungs-Session (nach Block A anzuwenden):**
- *Gemessen wird:* der **Pro-Kopf-Anteil** der Station an den Gesamteinnahmen bei vollem Ausbau -
  also Stationsertrag geteilt durch die Mitgliederzahl, gegen die NEUE Baseline - sowie die
  Amortisationszeit der 558 Mrd.
- *Regel:* Der Pro-Kopf-Anteil soll **unter 20 %** liegen und die Amortisation im Band
  **60-120 Tage** (dieselbe Spanne wie fuer Module, Abschnitt 4). Liegt er darueber, wird
  `STATION_MINING_COMPENSATION` gesenkt - **nicht** die Ertragsrelation aus 7.1, die ist eine
  Innenkorrektur und soll bestehen bleiben.
- *Achtung bei der Mitgliederzahl:* Der aktuelle Wert 3 ist gegen **zwei** Mitglieder gerechnet.
  Waechst die Allianz, sinkt der Pro-Kopf-Anteil automatisch - dann darf die Kompensation NICHT
  reflexhaft nachgezogen werden, sonst waechst der Gesamtertrag mit jedem neuen Mitglied. Zuerst
  entscheiden, ob die Station pro Kopf oder insgesamt konstant bleiben soll. Das ist eine offene
  Design-Frage, keine Messfrage.
- *Bei Uneindeutigkeit:* den **niedrigeren** Wert nehmen (Messregel-Logik aus Abschnitt 8, Punkt 1:
  zu wenig laesst sich nachbessern, zu viel nur durch eine Wegnahme).
- *Untergrenze:* nicht unter **2,0**. Darunter liegt die Station wieder unter dem, was dieselben
  Gebaeude an der Heimatbasis leisten, und der urspruengliche Befund waere nur halb behoben.

**Bewusst NICHT geaendert:** die Kopplung an Forschung (siehe oben) und der **Level-Cap 30**.
Letzterer ist der eigentliche Grund, warum die Station langfristig bedeutungslos wird - die
Heimatbasis hat gar keinen Cap und waechst unbegrenzt weiter. Das ist eine echte Design-Aenderung
und gehoert zu Entscheidung 7, nicht in eine vorgezogene Reparatur.

**Zur Entnahme, damit die Bezugsgroesse eindeutig bleibt:** Die Station ist ein gemeinsamer Topf,
aus dem JEDES Mitglied entnehmen kann - insofern wird der Ertrag sehr wohl geteilt, nur eben durch
Nutzung und nicht durch eine Quote im Code. Fuer die Kalibrierung heisst das: Stationsertrag durch
Mitgliederzahl teilen, bevor er mit der Pro-Spieler-Baseline verglichen wird (siehe Messtabelle
oben). Was es NICHT gibt, ist eine erzwungene Aufteilung - `withdrawFromStation()` prueft keine
Quote.

---

## 3. Reine Reparaturen (keine Entscheidung noetig, laufen parallel mit)

| # | Was | Datei | Bezug |
|---|---|---|---|
| R1 | **Bauzeit-Formel Server UND Client synchron.** Inhaltlich ueberholt seit Entscheidung 9.1 (09.08.2026): nicht mehr eine Untergrenze spiegeln, sondern die **Saettigungskurve 9.1a UND die additive `T_cap`-Berechnung 9.1b**. **Nicht in Block E abarbeiten, sondern GEMEINSAM mit 9.1 in Block D** - eine getrennt terminierte Spiegelung ist genau der Weg, auf dem der Spiegel schon einmal auseinandergelaufen ist | `game/actions.ts` + `client/src/lib/multipliers.ts` | S1-B3 |
| R2 | **TEILWEISE ERLEDIGT 11.08.2026** (Abschnitt 2a, Punkt 7): tote Eintraege entfernt, das Verdrahten auf `winResources` bleibt als Balance-Entscheidung offen. Ursprungstext: Toter `REWARD_ESCALATION`-Code bei `piraten_niedrig/mittel/hoch` entfernen oder auf `winResources` verdrahten (NICHT auf `winContainer` - waere wieder exponentiell) | `data/economy.ts`, `game/missions.ts:537-539, 572, 586-593` | S1-B6 |
| R3 | Forschungs-Minimum pro Beitragendem statt global. Heute senkt **ein Mitspieler mit 1 Leichtem Jaeger und Forschung 0 den Verlust des Hauptspielers um Faktor 19**. Zeitbombe fuer jeden weiteren Account. **Regressionstest gegen die Urspruengliche Korrektur vom 05.08.2026**: der schwaechere Mitspieler darf nicht wieder ueber seinem Stand kaempfen muessen | `game/combat.ts` (`computePirateResearch()` ~Zeile 769), `game/groupOps.ts` | S2-B6 |
| R4 | **ERLEDIGT 11.08.2026** (Abschnitt 2a, Punkt 7) - ACHTUNG, die Beschreibung unten war falsch: Simulator und Solo-Spiel stimmten ueberein, der abweichende Wert stand in einem unerreichbaren Zweig von `groupOps.ts`. Dafuer gab es einen vierten, LIVE falschen Fundort im Client (`Sektor.tsx`). Ursprungstext: `defenseFactor` ist an drei Stellen dupliziert und bereits auseinandergelaufen (`piraten_mittel`: Simulator 0,12, `groupOps.ts` 0,10) - **der Simulator sagt fuer Mittel etwas anderes voraus als der echte Kampf**. In eine Konstante zusammenfuehren | `simulator.ts:69-73`, `groupOps.ts:775-776`, `missions.ts` | S2-B9 |
| R5 | `MULTI_TARGET_POWER_CORRECTION` in `resolveOneWave()` nachziehen. Sentinel-/Ultimate-Kanone und alle Salvenschiffe zaehlen zu Hause nur mit einem Achtel ihrer Macht - wer in sie investiert, bekommt die schwaechsten Wellen bei der staerksten Abwehr | `game/raids.ts:319-327` | S3-B4 |
| R6 | **ERLEDIGT 10.08.2026** (Abschnitt 2a, Punkt 6) - gemessen 0,994x statt 1,429x. Ursprungstext: Beim Verschrotten den erstatteten Betrag von `resourcesSpentShipsDefense` abziehen. Heute ergibt Bauen -> Verschrotten -> Bauen bei `SCRAP_REFUND_RATE = 0.3` **1,43x Punkte** aus derselben Ressourcenmenge | `game/stats.ts`, `scrapUnits()` | S4-B9 |
| R7 | **ERLEDIGT 11.08.2026** (Abschnitt 2a, Punkt 7). Ursprungstext: `GalaxyEvent.claimedBy` wird gelesen, aber nirgends gesetzt. Feld und Typ-Kommentar bereinigen | `game/galaxyEvents.ts`, `types.ts` | S4-B10 |
| R8 | `startSpyProbe()` nimmt `qty` entgegen, prueft und verbraucht sie - **auf den Bericht hat sie keinen Einfluss** (`buildSpyReport()` haengt allein an `research.spionage`). Entweder `qty` entfernen oder den Detailgrad an die Sondenzahl koppeln (letzteres gibt der Spionagesonde ueberhaupt erst eine Bauentscheidung) | `game/spyMissions.ts` | S4-B10 |
| R9 | Kampfbericht-Anzeige "[Feindstaerke X%]" korrigieren - sie zeigt den nominalen Wert, der real etwa die Haelfte bedeutet (siehe Abschnitt 4) | Client | S2-B1/B9 |
| R10 | README korrigieren: Aussenposten, RapidFire-Kette (kein Stein-Schere-Papier), Kosten/Waffenpunkt-Korridor, Salvenschiffe als Rollen-Einheiten. **Ergaenzt 10.08.2026:** Die Repo-README ist an diesen Stellen bereits richtig - falsch ist die aeltere, nummerierte Fassung, die noch im Umlauf ist (33 Punkte). Beim Abarbeiten von R10 pruefen, welche Aussagen tatsaechlich noch in `README.md` stehen, statt gegen die alte Fassung zu korrigieren. Konkret nachweislich veraltet in der alten Fassung: Imperator `maxCount` 2 statt **6**, Salvenschiff-Limits 8-30 statt **150/90/30**, Asteroiden-Missionsdauer 12 h statt **24 h**, Kampf-Performance 700 ms bei 2.600 Einheiten statt **~26 ms bei 1,5 Mio** | `README.md` | S4-Konsistenz |
| R11 | **ERLEDIGT 11.08.2026** (Abschnitt 2a, Punkt 7) - zwei Eintraege fuer 10.08. und 11.08. Ursprungstext: Changelog-Eintrag - Balance-Aenderungen dieser Groessenordnung sind fuer Spieler sichtbar | `data/changelog.ts` | S4-Konsistenz |
| R13 | **ERLEDIGT 11.08.2026 mit Absicherung** (Abschnitt 2a, Punkt 7) - persoenliche Obergrenze mit Ratsche, damit niemand rueckwirkend ausgesperrt wird. Ursprungstext: **`totalOwnedShips()` zaehlt nicht "ueberall".** Sie summiert nur `state.fleet` + `buildQueue`, NICHT Missionen, Galaxie-Entsendungen und Gruppen-Operationen. Dadurch laesst sich `MAX_PLAYER_SHIPS` unbeabsichtigt ueberschreiten: Flotte wegschicken, zuhause bis zum Limit nachbauen, Flotte kehrt zurueck. Zusaetzlich fliessen Container-Freischiffe (`inventory.ts:174`) und Missionsrueckkehrer (`missions.ts:691`) ohne Limitpruefung in die Flotte. **Exakt derselbe Fehler wurde fuer die Einzel-Limits schon behoben** (`countShipEverywhere`, samt Kommentar in `actions.ts`) - bei `totalOwnedShips` nie nachgezogen. **Achtung bei der Umsetzung:** die Korrektur macht die Zaehlung STRENGER. Erst anwenden, wenn der tatsaechliche Gesamtbestand inkl. unterwegs befindlicher Schiffe bekannt ist, sonst blockiert sie den Spieler sofort wieder | `game/actions.ts:198`, `data/combatConstants.ts` | Nutzerfund 09.08.2026 |
| R12 | **ERLEDIGT 10.08.2026** (siehe Abschnitt 2a), umgesetzt in `game/moduleIntegrity.ts`. Ursprungstext: **Startpruefung fuer zusammengesetzte Modul-IDs.** `moduleBoostFactor()`/`moduleReductionFactor()` liefern bei unbekannter ID still 1 - dieselbe Fehlerklasse wie der auseinandergelaufene `defenseFactor` (R4) und der tote `ADMIRAL_ESCORT_BASE`. Beim Serverstart pruefen, ob jede im Code gebildete Modul-ID eine Definition hat, und sonst laut melden. Kleiner Aufwand, macht diese ganze Fehlerklasse dauerhaft sichtbar | `game/actions.ts`, `index.ts` | 09.08.2026 |
| R14 | **ERLEDIGT 17.08.2026** (Messkasten "R14 - REPARATUR" unter der Tabelle). Behoben sind alle drei Teildefekte im Aggregat-Pfad plus ein vierter, bei der Umsetzung gefundener (**R14b**, fehlender Durchschlag bei Aggregat-Schuetzen). Neu aufgetaucht und NICHT behoben: zwei ziel-seitige Abweichungen der Aggregation (Vorschlag **R15**). Ursprungstext: **NEU 17.08.2026, Nutzerfund - RapidFire wirkt bei grossen Flotten praktisch nicht mehr.** Nutzermeldung: "RF funktioniert ausser bei Salvenschiffen und Imperator gar nicht mehr, seit sie nur noch EIN RF-Ziel haben, die Werte springen nicht mehr." Gemessen bestaetigt (`probe_rapidfire.mjs`), und es ist ein Defekt im Aggregat-Pfad, keine Balance-Frage - Einzelheiten im Kasten unter der Tabelle | `game/combat.ts` (`fireShotsAggregateShooters()`) | Nutzerfund 17.08.2026 |

---

> **R14 - MESSKASTEN, 17.08.2026. Der Aggregat-Pfad schluckt RapidFire.**
> Anlass: Nutzerbeobachtung beim Spielen. Gemessen mit `probe_rapidfire.mjs`, dieselbe
> Flottenzusammensetzung zweimal - einmal unter, einmal ueber den Aggregationsschwellen, Gegner
> enthaelt in beiden Faellen alle RF-Zieltypen, Profil `voll`, 10 Laeufe:
>
> | Schuetze | Schuesse je Einheit und Runde, EINZEL-Pfad | dasselbe im AGGREGAT-Pfad |
> |---|---|---|
> | schwerer Jaeger | 2,24 | (nicht aggregiert) |
> | Kreuzer | 2,58 | **0,97** |
> | Schlachtschiff | 3,34 | **1,05** |
> | Schlachtkreuzer | 3,92 | **1,13** |
> | Zerstoerer | 4,03 | **1,07** |
> | Reaper | 3,88 | **1,07** |
>
> **Ein Schuss je Einheit und Runde bedeutet: RapidFire findet nicht statt.** Im Einzel-Pfad
> verdoppelt bis vervierfacht es die Schusszahl, im Aggregat-Pfad bleiben 0 bis 13 % uebrig. Und
> da die Schwellen bei 100 (Kreuzer-Klasse) bzw. 50 (Elite-Klasse) liegen, laeuft **jede echte
> Spielerflotte ueber den Aggregat-Pfad** - der Einzel-Pfad ist Theorie.
>
> **Drei Ursachen, alle in `fireShotsAggregateShooters()`:**
> 1. **Die Folgeschuss-Kette wird ueber `rfEligibleShare` verduennt.** Der Erwartungswert lautet
>    `accuracy x rfEligibleShare x avgRfChance`, wobei `rfEligibleShare` der Anteil der
>    RF-anfaelligen Ziele an ALLEN lebenden Zielen ist. Im Einzel-Pfad kettet ein Schuetze weiter,
>    SOBALD sein Konterziel ueberhaupt vorhanden ist; im Aggregat-Pfad nur noch anteilig zu dessen
>    Haeufigkeit. **Genau hier schlaegt die RF-Neuordnung vom 04.08.2026 durch:** mit mehreren
>    RF-Zielen summierte sich der Anteil auf ein Vielfaches, mit genau einem Ziel bleibt rund ein
>    Sechstel - die Naeherung rundet RapidFire dadurch weg. Die Beobachtung des Nutzers
>    ("seit sie nur noch ein Ziel haben") trifft die Ursache exakt.
> 2. **Die gewonnenen Schuesse zielen nicht auf das Konterziel.** Sie werden proportional zur
>    Stueckzahl auf alle Ziel-"Eimer" verteilt. Der gezielte Konter - der eigentliche Zweck von
>    RapidFire - existiert im Aggregat-Pfad nicht.
> 3. **`rapidFireTriggers` wird dort nie hochgezaehlt.** Deshalb steht im Kampfbericht 0, auch
>    wenn intern Zusatzschuesse verrechnet wurden. Das ist der sichtbare Teil der Meldung; die
>    beiden Punkte darueber sind der wirksame.
>
> **Einordnung:** stiller Defekt nach dem Massstab aus Abschnitt 8 (etwas wirkt nicht, obwohl es
> soll), keine Balance-Zahl. Die Aggregation ist ausdruecklich eine Performance-Optimierung und
> darf das Kampfergebnis nicht veraendern - dieselbe Begruendung, mit der Entscheidung 1
> (Overkill-Deckel) am 10.08.2026 vorgezogen wurde. **Dies ist der zweite Fall derselben
> Fehlerform im selben Codepfad.**
>
> **Folgen, ausdruecklich genannt - die Reparatur ist NICHT gratis:**
> - Sie beruehrt **beide** Seiten. NPC-Flotten sind ebenfalls aggregiert, und
>   `NPC_RF_VS_JAEGER_FACTOR = 0,5` wirkt nur auf der NPC-Seite. Ob die Reparatur netto den
>   Spieler oder den Gegner staerkt, ist **offen und muss gemessen werden**, nicht angenommen.
> - Sie verschiebt mit hoher Wahrscheinlichkeit die Kampfzahlen aus Block A und B (Sektor-
>   Verluste, Elite-Serie, Raid, der Admiral-Faktor 1,75x). Diese Messungen sind alle gegen eine
>   Engine gelaufen, in der RapidFire fuer grosse Flotten faktisch abgeschaltet war. Sie sind
>   deshalb untereinander konsistent, aber nach der Reparatur neu zu erheben.
> - **Aussage 32 der Code-Doku ist fuer grosse Flotten falsch:** "RapidFire ist das entscheidende
>   Gegenmittel gegen Jaegerschwaerme" gilt nur im Einzel-Pfad, also praktisch nie.
>
> **Empfohlene Reihenfolge:** R14 reparieren, bevor weitere KAMPF-Messungen laufen - sonst misst
> jede weitere Zelle eine Engine, in der eine Kernmechanik fehlt. Block C (Entscheidung 13.3, Bot-
> und Basis-Wachstum) ist davon **nicht** betroffen und kann vorher laufen.

> **WIE VIEL VERSCHIEBT DIE REPARATUR? GEMESSEN AM 17.08.2026** (`run_r14_delta.mjs` ->
> `r14_delta.txt`). Verfahren: derselbe Sektorkampf zweimal, einmal mit dem normalen Build und
> einmal mit einem Messbuild, in dem `stackAggregateThresholdFor()` 1e9 liefert - dort laeuft alles
> ueber den Einzel-Pfad, RapidFire wirkt also wie gedacht. Gemischte Flotte, 2.550 Schiffe,
> 1,74 Mrd Wert, Profil `voll`, 40 Laeufe je Zelle, Feindstaerke gewuerfelt aus
> `PIRATEN_MULTIPLIER_ROLL`:
>
> | Sektor | Runden mit / ohne Aggregation | Verlust mit | Verlust ohne | Gegner vernichtet |
> |---|---|---|---|---|
> | piraten_mittel | 18,6 / **5,8** | 1,5 % | **0,1 %** | 100 % / 100 % |
> | piraten_hoch | 26,1 / **7,8** | 2,7 % | **1,3 %** | 100 % / 100 % |
> | piraten_elite | 33,6 / **10,4** | 5,8 % | **7,6 %** | 100 % / 100 % |
>
> **Drei Befunde, die den Umfang der Nacharbeit stark eingrenzen:**
> 1. **Die Kaempfe werden rund dreimal kuerzer** - das ist der RapidFire-Effekt, und er ist gross.
> 2. **Die BEUTE-Seite bewegt sich nicht.** Der Gegner wird in beiden Faellen zu 100 % vernichtet,
>    die vernichtete Feindmacht ist damit identisch. Beute-Anker, Beute-Exponent 0,85 und die
>    Einnahmen-Baseline 0,80 / 19,82 / 76,85 Mrd haengen an dieser Groesse - **sie sind nicht
>    betroffen.**
> 3. **Die Richtung ist nicht einheitlich.** Bei `mittel` und `hoch` sinkt der eigene Verlust,
>    bei `elite` STEIGT er (5,8 -> 7,6 %). Grund: die NPC-Flotten sind ebenfalls aggregiert und
>    gewinnen ihr RapidFire genauso zurueck. Die Annahme "die Reparatur staerkt den Spieler"
>    waere falsch gewesen.
>
> **Einschraenkung dieser Messung, ausdruecklich:** der Messbuild schaltet die Aggregation KOMPLETT
> ab und damit auch den Aggregat-Schadenspfad, nicht nur die RapidFire-Naeherung. Die Tabelle ist
> deshalb eine **Obergrenze** fuer die Verzerrung des gesamten Aggregat-Pfades, nicht der isolierte
> R14-Anteil. Sie taugt zugleich als **Abnahmetest**: nach der Reparatur muessen beide Spalten
> zusammenfallen - tun sie es nicht, ist noch etwas anderes im Aggregat-Pfad ergebnisrelevant.
>
> **Neu zu messen ist danach nicht der Plan, sondern die Verlust-Seite:** die Sektor-Serien aus
> Block A Schritt 1 und die Admiral-Zellen aus Block B. Bei P10 ist der kumulierte WERT-Verlust das
> Abbruchkriterium (`ADMIRAL_DEFEAT_LOSS_SHARE = 0,30`), die Check-Tiefe reagiert dort direkt auf
> diese Groesse - **der Faktor 1,75x aus 4.3 ist die Zahl mit dem groessten Risiko.**
> Entscheidungen, die als VERGLEICH unter identischen Bedingungen getroffen wurden (Exponent 0,85
> gegen seine Nachbarn, `MAX_ROUNDS` 100 gegen 300, Schwelle 0,30 gegen 0,45, und 4.4 selbst), sind
> nicht beruehrt - beide Seiten des Vergleichs verschieben sich gleich.

> **R14 - REPARATUR, 17.08.2026. Umgesetzt und gegengemessen.**
> Geaendert wurde ausschliesslich `fireShotsAggregateShooters()` in `server/src/game/combat.ts`.
> Die Aggregationsschwellen sind unangetastet (500 / 100 / 50) - sie waren nur ein Messtrick fuer
> den Vergleich, die Aggregation selbst bleibt vollstaendig erhalten.
>
> **Was am Code geaendert wurde:**
> 1. **Erwartungswert der Folgeschuss-Kette.** Der bisherige Ausdruck
>    `accuracy x rfEligibleShare x avgRfChance` behandelte auch den GEZIELTEN Schuss so, als traefe
>    er sein Konterziel nur mit dessen Haeufigkeitsanteil. Jetzt wird die Ein-Schuss-Kette des
>    Einzel-Pfads exakt nachgebildet:
>    `accuracy x E[RF-Chance | Ziel aus RF-Pool] + (1 - accuracy) x E[RF-Chance | Ziel beliebig]`,
>    beide Erwartungswerte stueckzahlgewichtet. Kosten: O(RF-Zieltypen + Aggregate).
> 2. **Gezielter Konter.** Die Schusszahl wird in einen gezielten Anteil (Zielerfassung geglueckt -
>    geht ausschliesslich auf RF-anfaellige Eimer) und einen ungezielten Anteil (alle Eimer)
>    aufgeteilt, statt alles proportional zur Stueckzahl zu streuen. Im Einzel-Ziel-Pool wird dafuer
>    erst der RF-Zieltyp gewichtet gewaehlt, dann eine Einheit daraus - das vermeidet die
>    Pool-Kopie je Schuss, die der Einzel-Pfad dort macht.
> 3. **`rapidFireTriggers`** wird gezaehlt (jeder Schuss oberhalb des ersten je Einheit).
> 4. **R14b, bei der Umsetzung gefunden:** Aggregat-Schuetzen bekamen hart `overkillFraction = 0`,
>    waehrend `fireShots()` den echten `getDurchschlagFraction()` durchreicht - der Durchschlag war
>    fuer grosse Stapel also abgeschaltet. Der Code-Kommentar begruendete das mit dem
>    Individual-Zweig INNERHALB derselben Funktion, der selbst 0 uebergab: zirkulaer. Jetzt beide
>    Zweige mit demselben Faktor wie der Einzel-Pfad. **Nutzerentscheidung vom 17.08.2026, mit
>    R14 zusammen ausgeliefert.**
> 5. Nebenbei: die Ziel-Pools werden einmal je Aufruf statt je Stapel aufgebaut, damit ein
>    spaeterer Stapel die Abschuesse eines frueheren sieht (vorher zaehlte `targets.length` in
>    derselben Runde bereits getoetete Einheiten mit).
>
> **Abnahmetest 1 - `probe_rapidfire.mjs` (`rapidfire_aggregat.txt`), 20 Laeufe: BESTANDEN.**
>
> | Schuetze | Einzel-Pfad | Aggregat VORHER | Aggregat NACHHER |
> |---|---|---|---|
> | Kreuzer | 2,58 | 0,97 | **2,66** |
> | Schlachtschiff | 3,31 | 1,04 | **3,33** |
> | Schlachtkreuzer | 3,95 | 1,13 | **4,12** |
> | Zerstoerer | 3,96 | 1,07 | **3,36** |
> | Reaper | 3,76 | 1,07 | **3,11** |
>
> `rapidFireTriggers` ist ueberall groesser 0 (vorher exakt 0) - der Kampfbericht zeigt die
> Ausloesungen wieder an, das war der sichtbare Teil der Nutzermeldung. Zerstoerer und Reaper
> liegen leicht unter dem Einzel-Pfad, weil ihre Konterziele jetzt schneller wegsterben - das ist
> die Wirkung des gezielten Konters, kein Restdefekt.
>
> **Abnahmetest 2 - `run_r14_delta.mjs` (`r14_delta.txt`), 40 Laeufe je Zelle: TEILWEISE.**
>
> | Sektor | vorher MIT Agg | nachher MIT Agg | Referenz OHNE Agg | OHNE Agg + OHNE Explosion |
> |---|---|---|---|---|
> | piraten_mittel | 18,6 / 1,5 % | **8,7 / 3,0 %** | 6,3 / 0,1 % | 9,8 / 0,0 % |
> | piraten_hoch | 26,1 / 2,7 % | **12,6 / 6,1 %** | 7,8 / 1,6 % | 11,8 / 0,0 % |
> | piraten_elite | 33,6 / 5,8 % | **16,6 / 9,6 %** | 10,3 / 7,7 % | 16,3 / 0,2 % |
>
> Die Rundenzahl faellt zusammen, sobald die Explosionsmechanik herausgerechnet ist (8,7/12,6/16,6
> gegen 9,8/11,8/16,3). Die Verlustquote faellt nicht zusammen. **Beide Restpunkte liegen auf der
> ZIEL-Seite der Aggregation, nicht im Schuetzen-Pfad** - siehe R15 unten. Der Anteil von R14b ist
> mitgemessen: ohne ihn 9,6 Runden / 3,5 % statt 8,7 / 3,0 % bei `piraten_mittel`, er bewegt das
> Ergebnis also in Richtung Referenz.
>
> **Abnahmetest 3 - Laufzeit (`r14_perf.txt`, neues Skript `run_r14_perf.mjs`): BESTANDEN.**
> Gemischte Flotte mit 20.700 Schiffen, alle acht Typen aggregiert, 10 Laeufe:
> `piraten_mittel` 14 -> **10 ms** je Kampf, `piraten_elite` 10 -> **4 ms**. Die Kaempfe werden
> insgesamt schneller, weil sie nur noch halb so viele Runden dauern. Skalierungstest mit dem
> Zehnfachen (**207.000 Schiffe**): 14 bzw. 6 ms - praktisch derselbe Wert. **Die Rechenzeit haengt
> weiterhin an der Typenzahl, nicht an der Stueckzahl**, die Vorgabe ist eingehalten.
>
> **Messregel 8 vorab erfuellt:** im Client nach dem Funktionsnamen und nach `rapidfire`/
> `rapidFireTriggers` gegreppt. `client/src/lib/combatInfo.ts` liest die RF-Tabelle ueber
> `gameData.rapidfire` vom Server (keine zweite hartkodierte Zahl), `Nachrichten.tsx` zeigt nur den
> gelieferten Zaehler an. **Keine Client-Aenderung noetig** - der Zaehler wird von selbst wieder
> sichtbar.

> **R15 - NEU 17.08.2026, aus dem R14-Abnahmetest. Die Aggregation verzerrt auch die ZIEL-Seite.**
> Kein Schuetzen-Problem und mit R14 nicht behebbar, deshalb als eigener Punkt. Zwei Ursachen,
> beide belegt (`r14_delta.txt`):
> 1. **Aggregat-Stapel koennen nicht explodieren.** `EXPLOSION_HP_THRESHOLD` wirkt nur in
>    `applyHitToTarget()`, also ausschliesslich auf einzelne Einheiten. Aggregierte Gegner sterben
>    dadurch langsamer - das erklaert die verbleibende Rundendifferenz VOLLSTAENDIG (Kontrollzelle
>    "ohne Aggregation, ohne Explosion" faellt mit "mit Aggregation" zusammen).
> 2. **Ein Stapel ist ein HP-Topf**, jeder Schadenspunkt rechnet sich anteilig sofort in tote
>    Einheiten um. Einzelne Schiffe muessen erst komplett durchschlagen werden, ueberleben
>    beschaedigt und regenerieren ihren Schild zwischen den Runden vollstaendig. Deshalb verliert
>    der Spieler ohne Aggregation ueber 16 Runden praktisch nichts (0,0-0,2 %), mit Aggregation
>    3,0-9,6 %.
> **Einordnung:** Punkt 2 ist die groessere Zahl und zugleich der schwerere Eingriff - er beruehrt
> die Grundmodellierung des Stapels, nicht nur eine Formel. Vorschlag: vor Block C ansehen, aber
> NICHT vorziehen, solange die Sektor- und Admiral-Werte gerade frisch erhoben sind. **Ausdruecklich
> genannter Nachteil dieses Vorschlags:** die jetzt erhobenen Verlustzahlen sind damit ein zweites
> Mal neu zu messen, falls R15 spaeter umgesetzt wird.

---

## 4b. Wirtschaftsklassen: gemessen am 12.08.2026, Entscheidung offen

**Anlass:** Nutzerbeobachtung - "ich empfinde, dass nur der Prospektor Sinn macht, wir nutzen auch
nichts anderes". Der Plan enthielt zu den WIRTSCHAFTS-Klassen (`economyClasses.ts`, unabhaengig von
den Kampf-Klassen aus Abschnitt 4a) bis dahin keinen einzigen Vergleich.

**Gemessen am tatsaechlichen Ausbaustand der Spieler** (Minen 36/32/30, Mining-Forschung 10):

| Klasse | laufender Vorteil | Grundlage |
|---|---|---|
| **Schmuggler** | **+0,92 Mrd Werteinheiten/Tag** | Handelsgebuehr 20 % -> 10 % auf das getauschte Deuterium |
| Prospektor | +0,22 Mrd/Tag | +20 % auf die Minen; dazu je nach Mining-Flotte +0,06 bis +0,3 aus den Asteroiden |
| Ingenieur | **+17,6 % Bauleistung** | Bauzeit-Multiplikator faellt von 0,739 auf 0,628 (Robo 10 / Nanit 10 / Forschung 10) |

**Die Einschaetzung des Nutzers ist damit widerlegt - der Prospektor ist die schwaechste der drei
Klassen, nicht die einzig sinnvolle.** Er liefert rund 1 bis 3 % der Gesamteinnahmen. Sein
DM-Bonus (+30 % Fundrate im Asteroidenfeld) ist zusaetzlich wertlos, solange DM nicht knapp ist -
laut Nutzer ist sie das nicht. Und auf die Allianz-Station wirkt sein Mining-Bonus gar nicht
(siehe Abschnitt 2a, Punkt 3).

**Warum sich der Prospektor trotzdem richtig anfuehlt:** In den ersten Wochen ist er es auch - da
sind Ressourcen knapp, Bauzeiten kurz, und +20 % Ertrag sind sofort in der Kopfleiste sichtbar.
-15 % Bauzeit sieht man nie. Die Rangfolge kippt im Verlauf, ohne dass es jemand bemerkt, und
gewechselt wird danach nicht mehr.

**Der Schmuggler-Wert haengt vollstaendig am Raid-Defekt.** Nachgerechnet: Der
Deuterium-Synthetisierer auf Stufe 30 liefert 82,9 Mio/Tag. Die Raid-Container liefern **2,14 Mrd
pro gewonnenem Raid**, bei vier verteidigten Raids 8,56 Mrd pro Raid-Tag, gemittelt 2,45 Mrd/Tag -
das **29-fache der Mine**. Da Deuterium im Spiel wenig gebraucht wird, wird es laufend in Metall
und Kristall getauscht, und genau darauf wirkt die halbierte Gebuehr (+12,5 % je Tausch).
-> **Wird der Raid-Ertrag nach Entscheidung 3 korrigiert, bricht der Schmuggler-Vorteil mit ein.**
Die Wirtschaftsklassen sind ueber das Deuterium fest an die Raid-Frage gekoppelt.

**Zum Ingenieur bleibt eine offene Frage.** Sein Wert haengt daran, ob ZEIT oder RESSOURCEN der
Engpass sind. Der Nutzer hat rund 50 Mrd Werteinheiten unverbaut liegen, was zunaechst nach einem
Zeitengpass aussieht - auf Rueckfrage ist das aber **bewusstes Sparen**, kein Ueberschuss. Damit ist
die Frage NICHT entschieden. Sie faellt ohnehin mit Entscheidung 9 zusammen (Zeit als
Haupt-Engpass) und gehoert dorthin.

### Zur Herkunft der Werte (geprueft 12.08.2026)

**Es gibt keine dokumentierte Begruendung fuer die Hoehe der Wirtschaftsklassen-Boni.** Die
Kommentare in `economyClasses.ts` erklaeren, WAS die Konstanten tun und dass sie Waffen/Schild/
Panzerung nicht anruehren - warum es ausgerechnet 20 %, 15 % oder 50 % sind, steht nirgends.

Das unterscheidet sie von den Kampf-Klassen: dort stand immerhin ein Prinzip im Code (gleiches
Budget von 100 Prozentpunkten je Klasse). Das war zwar sachlich falsch, wie Abschnitt 4a zeigt, aber
es war eine nachvollziehbare Ueberlegung. Hier fehlt selbst das. Das Wertemuster
(0,5 / 1,5 / 0,85 / 0,85 / 1,2 / 1,3 / 0,9) besteht ausschliesslich aus glatten Zahlen -
plausibel gesetzt beim Einbau im Juli 2026, ohne Gegenrechnung.

**Fuer die Kalibrierung heisst das: an diesen Werten ist nichts zu respektieren.** Sie sind kein
austarierter Zustand, den man vorsichtig verschieben muesste.

**Der eigentliche Hebel ist aber nicht die Prozentzahl, sondern die BEZUGSGROESSE.** +20 % Mining
klingt kraeftig, trifft aber nur Minen und einen Teil der Asteroiden - zusammen rund ein Zehntel der
Einnahmen, macht 2 % gesamt. Der Schmuggler hat mit -50 % Handelsgebuehr formal den groessten
Einzelwert und landet trotzdem bei +0,92 Mrd/Tag, weil er ausschliesslich auf getauschtes Deuterium
wirkt. Die Kampf-Klassen wirken dagegen auf JEDE Einheit in JEDEM Kampf - deshalb kommt ein Kanonier
mit x2 auf Waffen auf halbierte Verluste, ein Prospektor mit x1,2 auf Mining auf 2 %.
-> **Regel fuer Block A: jede Klasse in ANTEIL AN DEN GESAMTEINNAHMEN bewerten, nicht als Prozentwert
auf ihrer eigenen Basis.** Ein Bonus, der nur auf eine Nebenquelle wirkt, braucht eine viel groessere
Prozentzahl, um mit einem Bonus gleichzuziehen, der ueberall greift. (Dieselbe Fehlerform ist am
10.08.2026 bei der Allianz-Station passiert - dort wurde ein Ertrag gegen eine Pro-Spieler-Baseline
gerechnet, obwohl er sich auf mehrere Spieler verteilt. Bei jeder Prozentangabe zuerst die Basis
pruefen.)

**GEMESSEN am 15.08.2026 nach der Raid-Entscheidung** (`run_raid_yield.mjs`, M4-Block):

| Fall | Deuterium aus Raids | Anteil am gesamten Deuterium | Schmuggler-Vorteil |
|---|---|---|---|
| Ist-Zustand (3,4 Raids) | 1,99 Mrd/Tag | 96,0 % | +0,92 Mrd/Tag |
| Variante 4 ohne Saettigung | 1,41 Mrd/Tag | 94,4 % | +0,66 Mrd/Tag |
| **Variante 6 (beschlossen)** | **0,70 Mrd/Tag** | **89,4 %** | **+0,35 Mrd/Tag** |

**Die Rangfolge kippt nicht.** Der Schmuggler bleibt vor dem Prospektor (+0,22 Mrd/Tag), der
Abstand faellt aber von Faktor 4,2 auf 1,6. Die 97-Prozent-Kopplung ans Raid-Deuterium bleibt
bestehen - sie sinkt nur auf 89 %, weil die Mine im Verhaeltnis nicht mitwaechst. **Damit ist der
Punkt (d) des Raid-Pakets geschlossen: kein Handlungsbedarf im Raid-Paket selbst.**

Was dadurch NICHT geloest ist und offen bleibt: der Prospektor hat weiterhin keine laufende Quelle,
die unabhaengig von Raid oder Bauzeit ist, und faellt strukturell zurueck. Das ist eine
Inhaltsfrage fuer einen spaeteren Block.

**Kein Handlungsbedarf vor Block A.** Die Rangfolge haengt an zwei Groessen, die dort ohnehin neu
bestimmt werden: dem Raid-Ertrag (Schmuggler) und der Frage Zeit gegen Ressourcen (Ingenieur).
Eine Kalibrierung jetzt muesste danach wiederholt werden. Was fehlt und nachzuholen ist: **ein
laufender Vorteil fuer den Prospektor, der nicht an einer einzelnen Quelle haengt** - er ist die
einzige der drei Klassen ohne Kopplung an Raid oder Bauzeit und faellt dadurch strukturell zurueck.

---

## 4a. Klassen-Balance: gemessen am 11.08.2026, Entscheidung offen

**Anlass:** Nutzerfrage, ob an den Klassen etwas anzupassen ist. Der Plan enthielt dazu bis dahin
nur zwei Randnotizen - Punkt 13.2 (die BOTS waehlen ihre Klasse zufaellig) und die
Kanonier-Zeile in der Feindstaerke-Tabelle unten. **Ein direkter Vergleich der drei Spielerklassen
existierte nicht.** Er liegt jetzt vor: `balance/session2-simulation/run_classes.mjs`, Ausgabe in
`classes.txt`.

**Offensiv** (Forschung 10, Module 10, Kampf-Booster, Rueckzug aktiv):

| Szenario | keine | Kanonier | Bollwerk | Kommandant |
|---|---|---|---|---|
| Elite-Bollwerk, grosse Flotte | 9,9 % Verlust / 45 Runden | **3,6 % / 19** | 6,1 % / 44 | 4,1 % / 28 |
| Piraten Hoch, grosse Flotte | 5,0 % / 32 | **2,3 % / 15** | 3,0 % / 31 | 2,4 % / 23 |
| Piraten Mittel, kleine Flotte | 2,5 % / 24 | 0,9 % / 13 | 1,1 % / 23 | **0,8 % / 18** |

**Defensiv** (Raid auf die Heimatbasis, Rueckzug abgeschaltet, 32 Durchlaeufe):

| Klasse | Flottenverlust | min-max | Verteidigungsverlust |
|---|---|---|---|
| keine | 50,7 % | 37-70 % | 8,1 % |
| **Kanonier** | **29,0 %** | 19-45 % | 0,9 % |
| Bollwerk | 39,4 % | 31-57 % | **0,3 %** |
| Kommandant | 34,7 % | 22-48 % | 0,3 % |

**Befund: Der Kanonier gewinnt ueberall.** Erwartet war, dass sich das bei der Heimatverteidigung
umkehrt - dort ist der Rueckzug abgeschaltet (Punkt 27 der README), der Kampf laeuft also bis zum
Ende durch, und das Bollwerk hat mit
`CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT` (0,9 statt 0,7) eine eigene Sonderregel. **Es kehrt sich
nicht um.** Das Bollwerk gewinnt nur beim Verlust an Verteidigungsanlagen, und der faellt gegen den
Flottenverlust kaum ins Gewicht.

**Mechanismus (Runden-Spalte):** Der Kanonier beendet den Kampf in etwa der halben Rundenzahl und
kassiert dadurch halb so viele Runden Rueckfeuer. Mehr Schild und Panzerung verlaengern den Kampf -
man haelt laenger durch, wird aber auch laenger beschossen. **In einem Abnutzungssystem ist Schaden
strukturell mehr wert als Robustheit**, unabhaengig davon, wie die Bonuspunkte verteilt sind.

**Damit ist die Design-Absicht im Code widerlegt.** `classes.ts` begruendet die Werte mit einem
gleichen "Gesamtbudget" von 100 Prozentpunkten je Klasse (Kanonier 1x100 %, Bollwerk 2x50 %,
Kommandant 3x33,3 %). Gleiches Budget ergibt hier nachweislich nicht gleiche Staerke. Wer die
Klassen angleichen will, muss das Bollwerk deutlich UEBER 100 Prozentpunkte heben oder ihm einen
Vorteil geben, der nicht ueber Kampfwerte laeuft.

### UMGESETZT am 11.08.2026 (Nutzerentscheidung: "das ist was verbessert werden muss")

Der Nutzer hat der Einschaetzung "erst nach Block D" widersprochen, mit dem Argument, zwei von drei
Klassen seien so totes Inventar. **Das Argument ist richtig, und meine Begruendung zum Abwarten war
zusaetzlich sachlich falsch** - siehe der Kasten "Warum Abwarten hier NICHT geholfen haette" unten.

**Zwei Schritte am selben Tag.** Zuerst reine Zahlen-Angleichung (Bollwerk x1,5 -> x2,0,
Kommandant x4/3 -> x1,5). Ergebnis: alle drei ueberall gleichauf - und damit **kein inhaltlicher
Grund mehr, eine bestimmte Klasse zu waehlen**. Auf Nutzerhinweis daher ein zweiter Schritt:
situative Aufschlaege.

**Verworfen: Boni komplett GATEN** (Nutzeridee: Kanonier nur im Angriff, Bollwerk nur in der
Verteidigung, Kommandant ueberall). Durchgerechnet mit den gemessenen Zellen kippt das Problem nur:

| Klasse | Angriff | Verteidigung | Wochensumme |
|---|---|---|---|
| Kanonier (gegated) | 4,1 % | 53,8 % | 104,0 |
| Bollwerk (gegated) | 9,2 % | 28,2 % | 103,9 |
| Kommandant (ungegated) | 3,8 % | 28,3 % | **66,2** |

Der Kommandant waere als einzige ungegatete Klasse um 36 % besser gewesen, und zwei von drei
Klassen waeren die Haelfte der Zeit totes Inventar. Grund ist die Haeufigkeit: Raids laufen 2x/Woche
mit 70 % Chance (`RAID_FALLBACK_SCHEDULE`, `RAID_SPAWN_CHANCE`), Sektor-Missionen dauern 24 h und
sind **unbegrenzt parallel** moeglich.

**Umgesetzt: Grundbonus ueberall + Aufschlag auf dem Heimatfeld.**

| Klasse | Grundwert (ueberall) | Aufschlag |
|---|---|---|
| Kanonier | Waffen x2,0 | **x2,4** ausserhalb der Heimatverteidigung (`CLASS_KANONIER_OFFENSE_BONUS` 1,2) |
| Bollwerk | Schild/Panzerung x1,6 | **x2,4** bei Heimatverteidigung (`CLASS_BOLLWERK_DEFENSE_BONUS` 1,5) |
| Kommandant | alles x1,4 | keiner - "ueberall zweiter, nirgends letzter" ist die Identitaet |

*Technisch:* neues Feld `homeDefense` in `CombatWorkerRequest`, gesetzt ausschliesslich in
`raids.ts`. **Bewusst NICHT an `allowRetreat: false` gekoppelt**, obwohl das heute deckungsgleich
waere - die beiden bedeuten Unterschiedliches, und eine spaetere Aenderung an der Rueckzugs-Logik
wuerde sonst still den Klassenbonus mitverschieben. Der Verstaerker-Fall funktioniert ohne
Zusatzarbeit, weil `OwnedFleetContribution` bereits ein eigenes `playerClass`-Feld traegt: wer als
Bollwerk einem anderen Spieler zu Hilfe kommt, bekommt seinen Verteidigungs-Aufschlag.

**Endstand** (20 bzw. 80 Wiederholungen, grosse Flotte):

| Klasse | Elite-Bollwerk | Piraten Hoch | Raid | Runden (Elite) | Wochenbilanz |
|---|---|---|---|---|---|
| Kanonier | **3,5 %** | **1,9 %** | 31,6 % | **16** | 69,1 |
| Bollwerk | 4,8 % | 2,6 % | **22,3 %** | 41 | 65,2 |
| Kommandant | 4,0 % | 2,3 % | 30,2 % | 28 | 70,7 |

Jede Klasse ist auf ihrem Heimatfeld klar erste Wahl, keine ist irgendwo wirkungslos. Das Bollwerk
gewinnt den Raid zusaetzlich mit der mit Abstand engsten Streuung (12-37 % gegen 18-45 %) und
verliert praktisch keine Verteidigungsanlagen (0,2 % gegen 1,2 %).

**Die verbleibende Spanne von ~8 % wird bewusst NICHT weiter feinjustiert.** Sie liegt innerhalb
der Messstreuung und innerhalb der Unsicherheit der Wochen-Annahme selbst (7 Missionen + 1,4 Raids)
- wer mehr Raids als Missionen hat, verschiebt sie zugunsten des Bollwerks. Weiteres Nachziehen
waere Anpassen an Rauschen. Ebenfalls nicht eingerechnet: die Kosten-Boni (Kanonier -10 % Schiffe,
Bollwerk -25 % Verteidigung, Kommandant -10 % beides), die ausserhalb des Kampfes wirken.

> **Warum Abwarten hier NICHT geholfen haette - Korrektur einer eigenen Fehlaussage.**
> Ich hatte argumentiert, Block D wuerde den Kanonier-Vorsprung von selbst schrumpfen lassen, weil
> sein verdoppelter Schaden nicht in `combatFleetPowerBase()` einfliesst. **Das Gegenteil ist der
> Fall.** Nachgerechnet an der Referenzflotte: Waffen machen nur **1,6 %** der Roh-Machtbasis aus,
> Schild und Panzerung **98,4 %**. Wuerde die Feindstaerke die Klassen mitrechnen, stiege die
> Machtbasis beim Kanonier um 1,6 %, beim Bollwerk aber um **49,2 %** - eine Korrektur in Block D
> haette das Bollwerk also noch weiter zurueckgeworfen.
>
> **Der Nebenbefund ist wichtiger als der Klassen-Punkt selbst:** Die Feindstaerke-Skalierung
> haengt zu 98,4 % an Schild und Panzerung und praktisch gar nicht an Waffen. Waffen zu bauen ist
> gegenueber der Gegner-Skalierung also nahezu kostenlos, Panzerung zu bauen teuer. Beruehrt
> Entscheidung 6 direkt und gehoert vor Block D geprueft.

**Client-Spiegel:** `lib/combatInfo.ts` trug die Klassen-Multiplikatoren an ZWEI Stellen
hartkodiert. Laufen jetzt ueber `/game/data` (`classCombatMultipliers`) - geliefert werden bewusst
die GRUNDWERTE ohne Aufschlag, weil eine Bau-Karte zu keiner Kampfsituation gehoert. Die
Aufschlaege stehen als eigene Zeile in den Klassen-Beschreibungen, die sich aus den Konstanten
ableiten und daher automatisch stimmen.

**Nicht angefasst:** Kosten-Boni, Flottengeschwindigkeit,
`CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT`. Sie wirken ausserhalb des Kampfes und waren nicht Teil des
gemessenen Ungleichgewichts.

**Bleibt fuer Block D:****Bleibt fuer Block D:** Die Klassen-Multiplikatoren wirken auf genau die Kampfwerte, die
Entscheidung 1 (Overkill-Deckel, bereits umgesetzt) und Entscheidung 19 (die vier ungeskalierten
Forschungen) ohnehin neu bewerten. Eine Klassen-Kalibrierung vor Block D muesste danach wiederholt
werden. Zusaetzlich verstaerkt sich der Kanonier durch die Feindstaerke-Rechnung (siehe direkt
unten, Abschnitt 4): sein verdoppelter Schaden fliesst NICHT in `combatFleetPowerBase()` ein, die
Gegner skalieren also nicht mit. Aendert sich das, schrumpft sein Vorsprung von selbst - moeglich,
dass sich die Klassenfrage dadurch teilweise erledigt.

**Methodischer Hinweis, teuer gelernt:** Die erste Messung der defensiven Seite lief mit nur 4
Durchlaeufen und ergab das GEGENTEIL - Bollwerk 29,3 % gegen Kanonier 38,3 %, also einen Vorsprung
des Bollwerks von 9 Prozentpunkten. Bei 30 Durchlaeufen kehrte sich das Vorzeichen um. Der Raid
streut extrem (Wellenwurf 50/30/20, Kampf-Modifikator, NPC-Generierung je Welle neu) - die
Spannweite eines einzelnen Durchlaufs ist GROESSER als der gesamte Klassenunterschied. **Fuer
Raid-Messungen sind mindestens 30 Durchlaeufe Pflicht**, und die min-max-Spalte gehoert immer mit
ausgegeben. `run_classes.mjs` erzwingt das jetzt.

---

## 4. Bewusst NICHT geaendert (mit Begruendung)

**`combatFleetPowerBase()` bleibt auf Rohwerten** (Session 2, Befund 1, Variante b).
Die Funktion summiert rohe `baseStats()` - ohne Forschung, Kampf-Booster, Klasse und Module. Genau
dieser Wert ist die Bezugsgroesse fuer alle Feindstaerke-Tabellen. Real bedeutet:

| Nominale Feindstaerke | real (Booster + Module 10) | zusaetzlich mit Kanonier |
|---|---|---|
| 100 % | **57 %** | 28 % |
| 120 % (Hoch, Spitzenwert) | 68 % | 34 % |
| 155 % (Elite, Spitzenwert) | 88 % | 44 % |

**Die urspruengliche Begruendung ist durch den Server-Reset hinfaellig geworden** und wurde am
09.08.2026 ersetzt. Sie lautete: "Variante (a) entwertet nachtraeglich bereits getaetigte
Investitionen." Nach einem Reset gibt es keine solchen Investitionen mehr. Damit ist (a) wieder
technisch moeglich. **Die Entscheidung bleibt trotzdem bei (b), aus einem anderen Grund:**

Wenn `combatFleetPowerBase()` Module mitrechnet, waechst der Gegner mit jedem gebauten Modul mit.
Module amortisieren sich heute erst nach **508-806 Tagen** (Session 3, Befund 6) und sind nur
deshalb nicht wertlos, weil sie die Gegnerskalierung NICHT erhoehen - das ist ihr einziger
verbliebener Wert, und er steht nirgends im Code. Variante (a) wuerde ihn beseitigen und zwingend
eine Modulkosten-Senkung um **Faktor 3-5** nach sich ziehen. Das ist eine Kette, kein Einzelschritt.

Stattdessen: **die Anzeige korrigieren** (R9) und die Werte bewusst auf das reale Niveau anheben,
falls noetig.

**Modulkosten - ENTSCHIEDEN 09.08.2026, aber als ZIELWERT, nicht als Zahl.**
Eine feste Kostensenkung "um Faktor 3-5" jetzt festzuschreiben waere ein Rechenfehler: die
508-806 Tage Amortisation sind gegen die heutige Baseline von 21,69 Mrd/Tag gerechnet, und genau
diese Baseline faellt nach Block A weg (Abschnitt 7). Ein heute festgelegter Faktor waere nach der
ersten Messung falsch.
-> **Zielwert: Module amortisieren sich in der Groessenordnung 60-120 Tage, gemessen gegen die NEUE
Baseline nach Block A.** Der noetige Faktor ergibt sich daraus, er wird nicht vorher geraten.
Begruendung fuer diese Spanne: kuerzer als 60 Tage macht Module zur Pflichtaufgabe statt zum Ziel;
laenger als 120 Tage faengt niemand damit an, und die zweitgroesste Ressourcen-Senke des Spiels
(99,57 Mrd) bleibt tot. Beides widerspricht der Vorgabe "Ziele auf Dauer beibehalten".
-> **Zusaetzlich dokumentieren, im Code und im Info-Popup:** dass Module die Gegnerskalierung NICHT
erhoehen. Das ist heute ihr staerkstes Argument und steht nirgends - weder im Spiel noch im Code.
Ein Vorteil, den niemand kennt, wirkt nicht.
-> **Feindstaerke-Variante bleibt bei (b)** und wird nicht neu aufgemacht. Variante (a) wuerde genau
diese Eigenschaft beseitigen und die Modulentscheidung zu einer Kette aus drei voneinander
abhaengigen Aenderungen machen. Der Gewinn rechtfertigt das nicht.

**Falls eine spaetere Session (a) doch umsetzen will:** dann zwingend zusammen mit der
Modulkosten-Senkung, und NICHT gleichzeitig mit einer Anhebung von `PIRATEN_MULTIPLIER_ROLL`.

**NIEMALS beides gleichzeitig:** `PIRATEN_MULTIPLIER_ROLL` anheben UND auf echte Kampfwerte
umstellen. Nominal 250 % waeren nach (a) auch real 250 %, was laut Sweep bereits fuer das Profil
"mittel" 30 % Verlust bedeutet. Die Kante ist ausserdem sehr scharf (350 % -> 400 % kippt von 88 %
auf 38 % Siegchance) - in kleinen Schritten anheben und nach jedem Schritt neu simulieren.

**Der Imperator bleibt Prestige-Einheit - ABER die Entscheidung steht auf duenner Datengrundlage.**

Session 3, Befund 10 nennt ihn "rechnerisch die schlechteste Einheit im Spiel": 0,0040 Power je
Wert-Einheit gegen 0,90 beim Leichten Jaeger, Faktor 225. Bewertet ueber den Teile-Gegenwert
(3.000 Teile x 325.000 = 975 Mio Wert-Einheiten).

**Was diese Zahl wirklich aussagt - und was nicht:**
- "Power" ist `combatFleetPowerBase()`, also die Bezugsgroesse fuer die GEGNER-Skalierung. Die Zahl
  sagt: der Imperator erhoeht die Gegnerstaerke kaum, gemessen an dem, was er kostet.
- Sie sagt NICHT, wie stark er im Kampf ist.
- **Dieselbe Eigenschaft ist bei Modulen ausdruecklich als deren einziger verbliebener Wert
  dokumentiert** (Session 3, Befund 6: Module erhoehen die Gegnerskalierung nicht). Beim Imperator
  wirkt derselbe Effekt, nur staerker - er bringt Panzerung (3.000.000; die frueher hier genannten
  2.520.000 sind veraltet, Code-Stand 14.08.2026: Waffen 500.000, Schild 400.000) und RapidFire in
  den Kampf ein und meldet der Skalierungsformel fast nichts.
- Die 975 Mio entsprechen 4,5 % eines Tageseinkommens. Der reale Preis sind nicht Ressourcen,
  sondern die Grind-Zeit fuer 3.000 Teile.

**Die Luecke: Der Imperator wurde in KEINER der vier Sessions im Kampf gemessen.** ~~Er ist Teil der
Referenzflotte "gross" (2 Stueck), aber er fehlt in der Einzeltyp-Tabelle aus Session 3, Befund 3
(elf Schiffe) und in der Duell-Matrix aus Session 4, Befund 7 (acht Schiffe).~~
**GESCHLOSSEN am 14.08.2026** durch `run_imperator.mjs` / `imperator.txt`
(`balance/session2-simulation/`). Anlass war eine Nutzerbeobachtung aus echten Kampfberichten
("tankt alles weg, teilt aber weniger aus als die Elite-Klassen") und der daraus abgeleitete
Wunsch, `maxCount` auf 12-18 anzuheben oder die Waffen zu verdoppeln.

**Ergebnis: Die Praemisse ist falsch. Der Imperator ist die mit Abstand stark
ueberproportionale Einheit im Spiel.** In einer ausgebauten Flotte (6.300 Schiffe gegen 8.250,
Forschung 10, ohne Module/Klasse/Boost, kein Rueckzug) stellen 6 Imperatoren **34,0 % des
Gesamtschadens der Flotte** - sechs Schiffe von 6.306. Ueberlebende der eigenen Seite steigen von
827 auf 1.353, die des Gegners fallen von 4.174 auf 2.794. Bei 12 Stueck sind es 50,0 % des
Schadens: die Flotte waere dann rechnerisch eine Imperator-Flotte mit Beiwerk - **exakt der
Zustand, der am selben Schiff schon einmal per Nutzerentscheidung zurueckgebaut wurde** (siehe
Kommentar in `ships.ts`: Werte von 5.000.000/2.500.000/12.000.000 gesenkt, Begruendung "andere
Schiffe muessen wieder mitkaempfen").

**Warum die Kampfberichte den gegenteiligen Eindruck erzeugen:** Die Berichtsspalte "Schaden
ausgeteilt" summiert je SCHIFFSTYP. Bei `maxCount: 6` gegen Klassen mit 90/150 Stueck und
Standardschiffen im Hunderterbereich kann diese Summe nicht vorn liegen, egal wie stark das
einzelne Schiff ist. **Die Spalte misst Klassengroesse, nicht Nutzen pro Schiff** - sie taugt
grundsaetzlich nicht als Balance-Indikator fuer stueckzahlbegrenzte Einheiten. Vgl. Messregel 15
(zentrale Groesse, die an einer Stelle richtig und an anderen irrefuehrend ist).

**Der Trefferwert-Befund - richtig, aber NICHT imperator-spezifisch.** Bei Forschung 10 trifft der
Imperator einen Leichten Jaeger nur in 12,6 % der Schuesse (Praezision 45 % x Gegenwahrscheinlichkeit
zum Ausweichen von 72 %). Der Vergleich zeigt aber: Reaper 13,4 %, Salvendreadnought 14,0 %. Der
Praezisionsmalus des Imperators (-0,15, der schlechteste im Spiel) kostet ihn gegenueber dem
Salvendreadnought nur 1,4 Prozentpunkte. **Der dominante Faktor ist der Groessen-Fehlpaarung-Bonus
(`SIZE_MISMATCH_EVASION_BONUS` klein/gross = 0,45), der ALLE Schiffe der Klasse "gross" gleich
trifft** - eine bewusste Entscheidung zur Jaeger-Rolle, kein Imperator-Problem. Wer hier ansetzt,
aendert die Jaeger-Rolle insgesamt, nicht den Imperator.

**Die drei diskutierten Hebel, gemessen** (6 Imperatoren gegen eine gemischte 645-Schiffe-Flotte):

| Variante | Schuesse | Treffer% | Schaden Imp. | Rest Gegner |
|---|---|---|---|---|
| Ist-Zustand | 232 | 21,8 % | 111 Mio | 563 |
| Praezisionsmalus 0 statt -0,15 | 269 | 28,9 % | 160 Mio | 520 |
| Ausweich-Bonus klein/gross 0,22 | 230 | 26,6 % | 121 Mio | 539 |
| Waffen verdoppelt (1.000.000) | 236 | 20,6 % | 193 Mio | 536 |
| **Waffen x2, Panzerung/Schild halbiert** | **70** | 18,5 % | **54 Mio** | **617** |

**Der Nutzervorschlag "Waffen verdoppeln, dafuer Panzerung und Schild senken" ist messbar die
SCHLECHTESTE der geprueften Varianten** - schlechter als gar nichts zu tun. Die Schusszahl bricht
von 232 auf 70 ein, der Schaden halbiert sich statt sich zu verdoppeln, und der Gegner behaelt mehr
Einheiten als im Ist-Zustand. Grund: Die Panzerung ist das, was den Imperator lange genug am Leben
haelt, um ueberhaupt zu feuern. Wer sie halbiert, kauft Schaden pro Schuss mit dem Verlust fast
aller Schuesse. **Ein gutes Beispiel dafuer, dass bei einem Attritions-Kampfsystem Ueberlebenszeit
und Schadensausstoss nicht unabhaengig voneinander sind.**

**Nachtest 14.08.2026 zur Folgehypothese des Nutzers** ("je mehr andere Schiffe mitfliegen, desto
weniger Treffer setzt der Imperator, weil die anderen die Feinde schneller ausschalten") -
`run_imperator_scale.mjs` / `imperator_scale.txt`: Flotte und Gegner gemeinsam von 0,25x bis 4x
skaliert (1.581 bis 25.206 eigene Schiffe), Imperatoren fest bei 6. **Widerlegt.** Schuesse
(2.957 -> 2.973), Trefferquote (24,3 % -> 23,4 %) und Schaden je Imperator und Runde (2,5 -> 2,3
Mio) bleiben ueber die 16-fache Flottengroesse praktisch konstant; der Imperator feuert in jedem
Szenario an seiner Kapazitaetsgrenze und laeuft nie aus Zielen. Was faellt, ist allein sein
prozentualer ANTEIL (58,2 % -> 11,5 %) - reine Arithmetik, weil ringsum mehr Schiffe mitschiessen.
Pro Stueck leistet ein Imperator dabei durchgehend das **360- bis 480-fache eines
durchschnittlichen Schiffs derselben Flotte**. Richtig an der Hypothese ist nur der Randfall in die
andere Richtung: bei sehr KLEINEN Gefechten (0,25x, 73 statt 100 Runden) endet der Kampf vor dem
Rundendeckel, und dann feuert er tatsaechlich weniger (2.237 Schuesse). Grosse Flotten verkuerzen
den Kampf hier nicht, sie verlaengern ihn bis zum Deckel.

**Gegenprobe mit der ECHTEN Nutzerflotte 14.08.2026** (`run_imperator_realfleet.mjs` /
`imperator_realfleet.txt`): 70.270 Schiffe (20.000 leicht, 20.000 schwer, je 5.000 der Kreuzer- und
Elite-Klassen, 270 Salvenschiffe) gegen `piraten_elite`, Profil voll, je 72 Laeufe.

| Variante | Sieg | Verlust | Runden |
|---|---|---|---|
| ohne Imperator | 100 % | 6,17 % | 20,3 |
| mit 6 Imperatoren | 100 % | **4,83 %** | 17,5 |
| mit 12 Imperatoren | 100 % | 5,00 % | 18,0 |
| mit 6 Imp., ohne die 270 Salvenschiffe | 100 % | **14,17 %** | 40,5 |

**Drei Schluesse.** (1) Die 6 Imperatoren senken die Verluste um 1,34 Prozentpunkte - bei 70.000
Schiffen sind das rund **940 gerettete Schiffe pro Flug**, obwohl sie im Bericht nur ~1 von ~25 Mrd
Schaden stellen. Ihr Nutzen steckt in der verkuerzten Kampfdauer (20,3 -> 17,5 Runden), nicht in der
Schadensspalte. (2) **Eine Anhebung von `maxCount` auf 12 bringt messbar nichts** (5,00 % gegen
4,83 %, innerhalb der Streuung) - bei dieser Flottengroesse ist der Sektor ohnehin sicher gewonnen,
es gibt nichts mehr beizutragen. Der Nutzervorschlag ist damit auch empirisch erledigt, nicht nur
argumentativ. (3) **Die eigentlichen Arbeitspferde sind die 270 Salvenschiffe**: ohne sie
verdreifachen sich die Verluste und der Kampf dauert doppelt so lange. Bei kuenftigen
Balance-Aenderungen ist das der empfindlichere Hebel, nicht der Imperator.

Zusatzhinweis zur Waffen-Verdopplung: Der Overkill-Deckel begrenzt einen Einzeltreffer auf
`OVERKILL_MAX_CASCADE` (5) Einheiten. Die Spalte "Schaden" bucht ROHSCHADEN vor dieser Deckelung
(`shotsA.dmgDealt`), die 193 Mio sind also die Obergrenze, nicht der angekommene Wert. Bei 500.000
Waffen liegt der Imperator noch unter der Kaskadengrenze, bei 1.000.000 nicht mehr.

**Entscheidungsgrundlage - kein Handlungsbedarf an den Kampfwerten.** Die Prestige-Einstufung ist
damit nicht mehr vorlaeufig, sondern belegt: der Imperator ist keine schwache Einheit, sondern die
staerkste pro Stueck, und `maxCount: 6` ist genau das, was ihn davon abhaelt, die Flotte allein zu
entscheiden. Session 3s "rechnerisch die schlechteste Einheit im Spiel" ist widerlegt - die Zahl
mass `combatFleetPowerBase()`, also die Gegner-Skalierung, nicht die Kampfleistung.

**Was offen bleibt - und zwar unabhaengig vom Kampf: `speed: 100`.** Die Flotte fliegt mit dem
langsamsten Schiff (`galaxyFleetSpeed()`), alle Elite-Schiffe liegen bei 15.000-17.000. Nach
`galaxyDurationMs()` (Wurzelformel) bedeutet ein einziger mitgenommener Imperator rund
**12,3-fache Flugzeit** (Wurzel aus 15.000/100), unabhaengig von der Entfernung. Aus 4 Stunden
werden knapp zwei Tage. Das ist eine reine Designfrage, keine Messfrage: Die staerkste Einheit des
Spiels ist so teuer im Transport, dass sie faktisch nur zur Heimatverteidigung taugt. **Entweder
ist das der bewusste Prestige-Preis (dann gehoert es in die Lore/UI erklaert), oder das Tempo wird
angehoben - dann aber im Wissen, dass eine Einheit mit 34 % Schadensanteil bei 6 Stueck damit
universell mitnehmbar wird.** Noch nicht entschieden.

**Widerspruch im Baulimit - GEKLAERT am 10.08.2026 durch Code-Pruefung.** ~~README Punkt 21 nennt
`maxCount` 2, Session 3, Befund 6 rechnet mit 6.~~ **Der Code sagt `maxCount: 6`** (`ships.ts`,
Imperator). Session 3 ist richtig, die "2" stammt aus der veralteten README-Fassung (Messregel 16).
Die Repo-README fuehrt im selben Kommentarblock ebenfalls 6, zusammen mit den Salvenschiffen
(Salvenjaeger 150, Salvenkreuzer 90, Salvendreadnought 30) - auch diese drei Zahlen weichen von der
alten Fassung ab (dort 8-30). **Alle Rechnungen, die mit `maxCount: 2` gearbeitet haben, sind
entsprechend nachzuziehen.** Kein Handlungsbedarf am Code, nur an der Dokumentation (R10).

~~**Erst nach dieser Messung entscheiden**, ob der Imperator Prestige-Einheit bleibt. Bis dahin gilt
die Prestige-Einstufung als vorlaeufig, nicht als belegt.~~ **Erledigt 14.08.2026: Prestige-Einheit
bestaetigt, Kampfwerte unveraendert. Offen bleibt allein die Tempo-Frage (siehe oben).**

**Galaxie-Ereignisse bleiben Deko** (31 Mio Wert/Tag = 0,14 % der Baseline). Ausdruecklich als
"Grund, in die Galaxie-Ansicht zu schauen" gewollt. Einzige Ergaenzung: ein UI-Hinweis, dass fuer
einen Bergungsflug ein einzelnes Schiff genuegt - der Versand der kompletten Realflotte kostet
9,28 Mio Deuterium (27,8 Mio Wert) und wuerde die Beute aufzehren.

**Solo-Stufen Niedrig/Mittel/Hoch:** Session-1-Befund 1 (die drei Stufen sind wirtschaftlich
identisch, Hoch bringt pro Sieg sogar weniger als Mittel) wird durch Entscheidung 2 automatisch
geloest - die Beute haengt danach an der vernichteten Feindmacht, und die unterscheidet sich je
Stufe. **Erst nach Entscheidung 2 neu bewerten**, nicht vorher an `winContainer` drehen.
Die Container-Erwartungswerte selbst sind vollstaendig gemessen (Session 1, exakte Enumeration
inkl. der "genau 2 Treffer"-Normalisierung): Silber 60,1 Mio, Gold 127,2 Mio, Elite 237,6 Mio
Wert-Einheiten, dazu 0/19,4/28,6 DM. **Zwei Container-Befunde waren bis zum 09.08.2026 nicht in
eine Entscheidung ueberfuehrt** - die Teile-Umwandlungsrate und die Freischiff-Rueckkopplung. Sie
stehen jetzt als Pruefpunkte 2c und 2d in Entscheidung 2.

**Booster-Preise** (Session 1, Befund 5): Entscheidung 3 (Raid-Halbierung) entfernt bereits 595 der
1.088 DM/Tag. **Danach neu messen**, bevor an `BOOSTER_DURATION_OPTIONS` gedreht wird.

---

## 5. Reihenfolge der Umsetzung

```
BLOCK A (zusammen messen, hier haengt alles dran)
  1. Entscheidung 1   ERLEDIGT am 10.08.2026 (Abschnitt 2a) - hier nur noch die uebrigen
                       Messreihen neu laufen lassen (run_elite, run_raid, run_real_fleet);
                       run_aggregate_threshold und run_sectors sind bereits neu
  2. Entscheidung 2   KALIBRIERT am 19.08.2026, NICHT GEBAUT. Alle Konstanten stehen fest, der
                       Einbau ist mechanisch - Bauanleitung im Messkasten am Kopf von
                       Entscheidung 2, Protokoll loot_curve.txt. Koop-Bezugsgroesse entschieden:
                       V2 + 15 % je Mitflieger (gedeckelt bei 3), V1 verworfen wegen automatisch
                       beitretender Bots.
                       -> IM CODE STEHT DAVON KEINE ZEILE. Kein game/loot.ts, kein
                          LOOT_CURVE_SOLO_CHECK_POWER, fleetSizeRewardMultiplier() laeuft in
                          missions.ts und groupOps.ts unveraendert weiter, winResources der drei
                          Solo-Sektoren stehen auf den alten Betraegen.
                       -> Die Baseline 0,98 / 19,57 / 61,11 Mrd ist eine VORHERSAGE fuer den
                          Zustand nach dem Einbau. Bis dahin gilt weiter 0,80 / 19,82 / 76,85.
                       -> PIRATEN_MULTIPLIER_ROLL bleibt deshalb gesperrt (Entscheidung 16). Die
                          Sperre faellt mit dem Einbau, nicht mit der Messung.
  3. Entscheidung 3   Raid-Ertrag: Variante 6, GESCHLOSSEN 15.08.2026
  3a. Niveau-Punkt   Abschnitt 7, GESCHLOSSEN 15.08.2026 - Einnahmen-Niveau bleibt, Kennzahl
                       umgestellt, Engpass vollstaendig ueber Entscheidung 9 (Messkasten dort)
  -> danach ALLE Simulationen neu, dann Baseline neu festschreiben
  -> BLOCK A IST DAMIT VOLLSTAENDIG. Naechster Schritt ist 4 (Block B, Piratenadmiral).

BLOCK B (Piratenadmiral, in sich sequenziell)
  4. Entscheidung 4.1 + 4.2  GESCHLOSSEN 15.08.2026. Verlust-Kriterium = kumulierter
                       WERT-Anteil, ADMIRAL_DEFEAT_LOSS_SHARE = 0,30 (nicht 0,45);
                       contributedPower frisch je Check. Beide Reparaturen sind richtig,
                       aendern aber in drei von vier Ausbaustaenden NICHTS - der Boss
                       stirbt in Check 1. Messkasten am Kopf von Entscheidung 4.
  5. Entscheidung 4.3 - 4.8  Boss-Anteil, Mechanik, Belohnung, Cooldown
                       -> 4.3 muss mit UMGEKEHRTEM Vorzeichen neu aufgesetzt werden:
                          ein hoeherer Boss-Anteil macht den Gegner schwaecher, und auch
                          0,25 endet zu 100 % mit Sieg in Check 1. Der Hebel ist die
                          Gegnerstaerke selbst, Kippbereich 2x bis 4x.

BLOCK C (unabhaengig voneinander, AUSSER 13.3 vor 5)
  6. Entscheidung 13.3 ERLEDIGT am 17.08.2026 - Bot-/Basis-Wachstum von der Aufruf-Haeufigkeit
                       entkoppelt, Messblocker aus 5b damit weg
  7. Entscheidung 5   ERLEDIGT am 18.08.2026 - Garnison skaliert mit (Tabelle
                       [1,15/1,45/1,70-1,90]), SEED_FLEET-Boden gestrichen (5a), Schranke gegen
                       Dauer-Farming zweiteilig (Erholungszeit 20 h + Attritions-Deckel 0,35 mit
                       Wiederaufbau ueber 3 Tage), Beute aus der vernichteten Garnison.
                       Messkasten am Kopf von Entscheidung 5, Protokoll in pirate_base.txt.
                       -> WEITERHIN OFFEN: die Beute-Kurve aus Entscheidung 2 ist im Spielcode
                          NUR fuer die Piratenbasen. Schritt 2 (missions.ts, groupOps.ts) ist
                          kalibriert, aber nicht gebaut - siehe dort.
  8. Entscheidung 6   Schiffs-Tiers   [ERLEDIGT 18.08.2026 - umgesetzt und gegengemessen,
                        fuenf Kostenzeilen in ships.ts, Zielwert 1,15, Messkasten dort]
  9. Entscheidung 7   Allianz-Station (nur noch 7.2/7.3/7.4 - 7.1 ist am 10.08.2026
                       vorgezogen erledigt, siehe Abschnitt 2a)
 10. Entscheidung 10  Heimatverteidigung   [ERLEDIGT 19.08.2026 - Neulingsschutz statt
                        Rueckzugsregel, Messkasten dort. Die Sperre fuer Entscheidung 16 ist
                        damit AUFGEHOBEN.]
                       -> sperrte bis dahin Entscheidung 16 (RapidFire nach Klassen). Solange sie nicht
                          gebaut ist, darf RAID_WAVE_ROLL nicht angefasst werden (Abschnitt 8,
                          Punkt 7), und ohne diesen Ausgleich ist der RF-Umbau ein globaler
                          Spieler-Buff - gemessen am 18.08.2026, siehe Entscheidung 16.
 10a. Entscheidung 16  RapidFire nach Klassen + abgesenkter Groessen-Ausweichbonus
                       KALIBRIERT am 19.08.2026 (Abend), NICHT GEBAUT. Beide offenen Zahlen
                       stehen: RF-Wert 4, SIZE_MISMATCH_EVASION_BONUS 0,20 / 0,08. Dazu
                       zwingend der Eintrag ZIELERFASSUNG_BASE['leicht'] = 0,25 und der
                       Client-Spiegel fuer den Ausweichbonus. Alle vier Abnahmekriterien
                       erfuellt. Bauanleitung im Messkasten bei Entscheidung 16, Protokoll
                       rf_depth.txt (Abschnitt "ZWEITE MESSRUNDE").
                       -> KEIN AUSGLEICH UEBER DIE GEGNERSTAERKE NOETIG. Die Begruendung der
                          ersten Runde ("globaler Spieler-Buff") war eine Prozentzahl ohne
                          Gegenposten: der Raid wird in Wert-Einheiten 29 % TEURER, die
                          Einnahmen-Baseline bewegt sich um maximal 2 %.
                       -> PIRATEN_MULTIPLIER_ROLL bleibt unberuehrt - die Sperre muss gar nicht
                          fallen. RAID_WAVE_ROLL ist freigegeben, bleibt aber ungenutzt: eine
                          Anhebung wuerde die ohnehin eintretende Verschaerfung verdoppeln.
                       -> Gemessen gegen einen KUMULATIVEN Messbuild inkl. Block A Schritt 2,
                          weil beide zum Neustart gemeinsam wirksam werden.
 11. Entscheidung 12  Frischling-Bonus additiv
                       KALIBRIERT am 20.08.2026, NICHT GEBAUT. Wert steht:
                       NOVICE_BONUS_ADD = 2,0 (Multiplikator = Produkt der uebrigen
                       Mining-Quellen PLUS 2,0), Fenster 14 Tage, gekoppelt an
                       NEWCOMER_GRACE_MS (Nutzerentscheidung 20.08.2026).
                       Bauanleitung im Messkasten am Kopf von Entscheidung 12,
                       Protokoll novice_bonus.txt.
                       -> Die gemeinsame Kalibrierung mit Entscheidung 9 ist NICHT noetig:
                          gegen zwei einklammernde Bau-Szenarien gemessen (3 Lanes heute
                          gegen 1 Lane + doppelte Basiszeiten), Unterschied unter einem
                          Prozentpunkt. Die 30-Tage-Simulation musste dafuer nicht
                          vorgezogen werden.
                       -> Der Grund fuer das Vorziehen aus Block F ist ENTFALLEN: Kriterium 5
                          misst diesen Bonus nicht. Es ist am 20.08.2026 auf Entscheidung 3
                          (Raid-Ertrag) und die Solo-Startphase umgestellt worden, siehe
                          Abschnitt 1b. Entscheidung 12 kann es weder erfuellen noch
                          verletzen.
 12. Entscheidung 13.1 + 13.2  Bot-Ertrag aus eigener Flottenmacht, Bot-Profile
                       -> 13.1 braucht die Koeffizienten aus Entscheidung 2, also nach Block A

SIMULATION (ENTSCHIEDEN 09.08.2026 - vorgezogen aus Block F)
 13. 30-Tage-Fortschrittssimulation nach Abschnitt 1b bauen und erstmals ausfuehren
     -> ohne sie ist Block D nicht gegen die Startphase kalibrierbar, sondern nur gegen
        das Endspiel - und muesste danach ein zweites Mal kalibriert werden
     -> ZUERST die beiden technischen Vorbedingungen V1 (Zeitquelle) und V2 (Datenbank)
        aus Abschnitt 1b klaeren. Beide blockieren den Bau, beide waren bis zum
        10.08.2026 im Plan stillschweigend als geloest vorausgesetzt.

BLOCK D (Zeit-Umbau, eigener Block wegen Doppelbremse)
 14. Entscheidung 9.1 + R1  Saettigungskurve, additive Reduktionen UND der Client-Spiegel
                       -> R1 ist bewusst hier und NICHT in Block E: eine spaeter terminierte
                          Spiegelung ist der Weg, auf dem multipliers.ts schon einmal
                          auseinandergelaufen ist
                       -> messen
 15. Entscheidung 14   ERLEDIGT am 10.08.2026 (Abschnitt 2a) - hier nur noch KALIBRIEREN
                       -> der Faktor 4 auf die V2/V3-Bauzeit ist bereits eingetreten und
                          gilt als Ausgangszustand von 9.1, nicht als kommende Aenderung
 16. Entscheidung 9.2  Slots auf 1 + Warteschlange  -> messen
                       -> gegen Abnahmekriterium 2 UND 3 gleichzeitig (Leerlauf gegen
                          Ressourcenstau), sie schlagen gegenlaeufig aus
                       -> dabei 13.4 pruefen: Bots werden davon haerter getroffen als Spieler
 17. Entscheidung 9.3  Forschungs-Wirkungskurve
 18. Entscheidung 9.4  Forschungskosten
 19. Entscheidung 9.5  Module

BLOCK E (Kleinkram, jederzeit)
 20. Entscheidung 8   Sandronator
 21. Entscheidung 11  Aussenposten-Reste
 22. R2 - R11  (R1 laeuft in Schritt 14 mit, R12 ist am 10.08.2026 erledigt)

BLOCK F (STARTPHASE - erst wenn A bis E stehen, vor dem Reset)
 23. 30-Tage-Fortschrittssimulation ERNEUT ausfuehren (gebaut in Schritt 13, Abschnitt 1b) -
     alle sechs Abnahmekriterien muessen erfuellt sein
 24. Entscheidung 9 nur noch VERIFIZIEREN und feinjustieren - die eigentliche Kalibrierung
     gegen die Startphase ist bereits in Block D erfolgt (Schritt 13 lag davor). Steht hier
     noch eine grosse Korrektur an, war die Simulation in Schritt 13 nicht aussagekraeftig.
 25. Entscheidung 10 verifizieren: kein Totalverlust mehr bei Startausbau
 26. Entscheidung 13.5 verifizieren: ist das Elite-Bollwerk mit 2 Bots + 1 Mensch in
     Woche 1/2/4 ueberhaupt gewinnbar? Wenn nein, faellt der groesste Inhalt des Spiels
     nach dem Reset wochenlang aus.

RESET
 27. Erst nach Block F. Ein Reset ist einmalig - Fehler in der Startphase
     fallen sonst erst nach Wochen auf.
```

**Stand 20.08.2026: beide sind entschieden.** Entscheidung 10 ist gebaut, Entscheidung 12 ist
kalibriert und wartet wie alles andere auf den Sammel-Einbau. Damit steht kein
reset-blockierender Punkt mehr offen. *Neu hinzugekommen ist dafuer eine Frage, die vor dem Reset
beantwortet sein sollte, aber keinen zweiten Reset erzwingt:* der Raid ist mit 58-64 % die
groesste Einzelquelle der ersten Woche, und Entscheidung 3 (sein Ertrag) ist entschieden, aber
nicht gebaut.

**Entscheidung 10 und 12 sind blockierend fuer den Reset.** Alles andere waere im Nachhinein
korrigierbar, diese beiden nicht ohne einen zweiten Reset.

---

## 6. Messregeln (aus vier Sessions gelernt, gelten fuer JEDE Aenderung)

1. **Vor jeder Simulation `npx tsc` im Server ausfuehren.** Der Kampf-Worker laedt immer aus
   `dist/` (README Punkt 9) - ohne frischen Build misst man den alten Stand.
2. **Nie einen Einzellauf bewerten.** Mindestens **40 Laeufe je Zelle**. Bei 16 war die Kurve im
   Sweep noch nicht monoton (250 % -> 75 % Sieg, 300 % -> 94 %).
3. **Ertraege NIE an einem Einzelcheck bewerten.** `simulateCombat()` zeigt nur EINEN Check; die
   Verluste einer kompletten 24h-Mission liegen um den Faktor der Checkanzahl hoeher. Session-3-
   Befund 2 wurde in Session 2 genau deshalb uebersehen.
4. **Immer die Wert-Bilanz rechnen, nicht die Verlustquote.** 2 % Verlust sind bei 6 Mrd
   Flottenwert belanglos und bei 66 Mrd toedlich.
5. **Drei Multiplikatoren hintereinander pruefen**, bevor an einem Basiswert gedreht wird:
   `getEscalationMultiplier()`, `completionMultiplier = 2` (Elite) und
   `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr).
6. **Ressourcen in Wert-Einheiten vergleichen** (`TRADE_VALUE`) und Container-DM nicht vergessen -
   genau dieser Posten fehlte in der Session-1-DM-Bilanz.
7. **Container-Werte NIE nach den rohen `chance`-Werten beurteilen** - die "genau 2 Treffer"-
   Normalisierung verschiebt sie erheblich (`computeRealCategoryChances()`).
8. **Client-Spiegel nicht vergessen.** `client/src/lib/multipliers.ts` spiegelt Bauzeit-, Klassen-
   und Booster-Multiplikatoren 1:1 - **und es ist nicht der einzige Spiegel.**
   `client/src/pages/Allianz.tsx` baut die KOMPLETTE Stations-Wirtschaft nach (Produktion, Energie,
   Bauzeit, Modul-Faktoren), `client/src/lib/combatInfo.ts` die Kampfwert-Anzeige, und
   `client/src/pages/Sektor.tsx` trug bis zum 11.08.2026 eine eigene hartkodierte Kopie der
   `defenseFactor`-Werte - **die einzige der vier Kopien, die live falsche Zahlen anzeigte**
   (10 % statt 12 % fuer Mittel). Gefunden nur, weil vor dem Paketieren im Client gegreppt wurde.
   Die Liste ist erfahrungsgemaess NICHT vollstaendig: vor jeder Aenderung selbst greppen, statt
   sich auf sie zu verlassen.
   *Verschaerft am 10.08.2026:* diese Regel ist beim ersten Eingriff ueberhaupt sofort verletzt
   worden - der Stations-Kompensationsfaktor landete nur im Server, die Anzeige blieb unveraendert,
   und fuer den Spieler sah es aus, als sei die Aenderung gar nicht angekommen. **Verbindlicher
   Ablauf: erst im Client nach dem Funktionsnamen greppen, dann den Server aendern, beide zusammen
   ausliefern.** Konstanten gehoeren dabei ueber `/game/data` an den Client, nicht als zweite
   hartkodierte Zahl.
9. **`result.retreated` bedeutet nicht "verloren"**, sondern "mindestens ein Schiff hat sich
   abgesetzt". Jede Auswertung dieses Flags muss den Sieg-Fall vorher ausschliessen.
10. **`simulateCombat()` deckt nur die Piraten-Sektoren ab** und ist Einzelspieler-only. Fuer
    P10/Raid/Elite-Bollwerk muss der jeweilige Ablauf gegen `runCombatInWorker()` bzw.
    `runMultiOwnerCombatInWorker()` nachgebaut werden.
11. **`speed` ist eine flottenweite Eigenschaft** (`galaxyFleetSpeed()` nimmt das langsamste
    Schiff). Ein einzelner Ausreisser nach unten wirkt auf jede Flotte, in der er mitfliegt.
12. **Feste Gegnerstaerke und feste Belohnung sind dasselbe Problem aus zwei Richtungen.** Bei jedem
    neuen Inhalt zuerst pruefen, welche der beiden Seiten mitwaechst.
13. **Jede neue Einheit mit hohem Einzelschaden an BEIDEN Seiten der Aggregations-Schwelle testen**
    (`run_aggregate_threshold.mjs`) - bis Entscheidung 1 umgesetzt ist.
14. **Bei jedem Bonus zuerst zaehlen, wie viele Quellen auf dieselbe Groesse wirken, und ob sie
    multipliziert werden.** Drei Fundstellen bisher: Bauzeit (sechs Quellen, Produkt ~0,002),
    Mining (sechs Quellen, bis 24,5x), Gegnerskalierung (drei Quellen, Messregel 5). Multiplikative
    Stapel sehen an jeder Einzelstelle vertretbar aus und kippen erst im Produkt - **die Pruefung
    muss deshalb an der Summe ansetzen, nicht am Einzelwert.**
16. **Die README im Repo ist die Quelle, nicht eine hochgeladene Kopie.** Am 10.08.2026 sind zwei
    Aussagen dieses Plans als falsch aufgefallen, weil sie aus einer aelteren README-Fassung
    stammten (33 nummerierte Punkte) statt aus der Fassung im Repo (ueber 750 Zeilen, in Abschnitte
    gegliedert, KEINE Nummerierung). Betroffen waren die Raid-Mechanik und die
    Kampf-Performance - letztere um mehr als das Hundertfache. **Alle Verweise der Form
    "README Punkt N" in diesem Plan zeigen ins Leere** und muessen bei der Umsetzung ueber den
    Abschnittstitel oder den Konstantennamen aufgeloest werden, nicht ueber die Nummer. Generell:
    **jede uebernommene Zahl gegen den Code pruefen, nicht gegen eine Beschreibung des Codes.**
15. **Stille Ausweichwerte sind keine Fehlerbehandlung.** `moduleBoostFactor()` liefert bei
    unbekannter ID 1, `moduleReductionFactor()` ebenso, `defenseFactor` lief unbemerkt auseinander,
    `ADMIRAL_ESCORT_BASE` war tot. In allen vier Faellen war das Verhalten korrekt im Sinne des
    Codes und falsch im Sinne des Spiels. **Jede Stelle, die eine ID zur Laufzeit
    zusammensetzt, braucht eine Existenzpruefung** (siehe R12).

---

## 7. Nach der Umsetzung neu zu bestimmen

- **NEU 18.08.2026 (Nutzerbeobachtung): Warum sollte man das Elite-Bollwerk ueberhaupt GEMEINSAM
  fliegen?** Meldung des Nutzers aus dem Livebetrieb: "man kann solo wie gemeinsam fliegen, die
  Belohnung bleibt gleich, die Spieler sehen keinen Zweck darin, gemeinsam zu fliegen, ausser dass
  die Verluste erhoeht sind."

  **Am Code nachvollzogen, die Beobachtung traegt.** `runGroupHourlyCheck()` bildet
  `totalSentPower` als SUMME aller Teilnehmerflotten und setzt `targetPower = totalSentPower x
  Wurf` - zwei Spieler bekommen also den doppelt so starken Gegner. Die Belohnungen
  (`lootBase`, `winResources`, garantierte Container, Teile, Kapitaen) gehen dagegen JEDEM
  Teilnehmer voll zu, unabhaengig von der Teilnehmerzahl (README-Punkt 5, im Plan bekraeftigt bei
  Entscheidung 3: "Gemeinsame Expeditionen behalten die volle Belohnung je Teilnehmer"). Rechnerisch
  ist gemeinsames Fliegen damit NEUTRAL, nicht besser: gleiche Belohnung, proportional gleich
  starker Gegner. Der Grossflotten-Bonus wuerde zwar mit der Summe wachsen, ist aber bei
  `FLEET_SIZE_BONUS_CAP = 0,5` gedeckelt und laut `elite.txt` schon bei 5,44 Mrd Power am Anschlag -
  bei den heutigen Flotten also auch solo. Dazu kommt ein echter Nachteil: die Rendezvous-Pflicht
  kostet den Mitflieger zusaetzliche Flugzeit und Treibstoff.

  Eine Ausnahme ist gemessen: die Piraten bekommen den DURCHSCHNITT der Forschung aller Teilnehmer
  (`computePirateResearch`). Mit ungleich entwickelten Spielern wird der Gegner dadurch schwaecher -
  `elite.txt`, 40 Laeufe: "2x voll" 3,3 %/3,3 % Verlust, "voll + schwach" 0,5 %/1,5 %. Zwischen zwei
  gleich weit entwickelten Spielern bringt das nichts.

  **Nicht gemessen ist der eigentliche Vergleich:** dieselbe Flotte solo gegen zu zweit. `elite.txt`
  enthaelt nur Mehrspieler-Konstellationen. Ob der Eindruck "Verluste sind hoeher" ueber die
  Neutralitaet hinausgeht, ist damit offen; ein Kandidat waere R15 (aggregierte Stapel verlieren
  mehr), weil die gemeinsame Flotte tiefer im Aggregat-Pfad liegt. Der Vergleich ist mit
  `run_elite.mjs` billig zu haben und sollte vor jeder Entscheidung stehen.

  **GEMESSEN UND VERLAGERT AM 18.08.2026.** Der fehlende Vergleich ist nachgeholt
  (`run_elite_coop.mjs` / `elite_coop.txt`, 40 Serien je Zelle, volle 6-Check-Expedition, Verluste
  in Wert statt Stueckzahl): **die Belohnung je Teilnehmer ist solo und zu zweit identisch, die
  Verluste sind zu zweit in allen vier Zellen hoeher** (+0,2 / +2,7 / +1,3 / +1,9 Prozentpunkte,
  gleiches Vorzeichen ueberall, also keine reine Streuung). Die Nutzerbeobachtung ist damit in
  beiden Teilen bestaetigt; das Ausmass der Mehrverluste liegt bei rund einem Zehntel dessen, was
  der Ausbaustand ausmacht. Einziger heute vorhandener Vorteil: der Grossflotten-Bonus rechnet mit
  der Flottensumme - bei der Referenzflotte steht er solo wie gemeinsam am Deckel x1,50, bei kleinen
  Flotten steigt er von x1,44 auf x1,50 bzw. x1,20 auf x1,24. **Gemeinsam fliegen lohnt sich also
  ausgerechnet in der Aufbauphase, wo es niemand bemerkt.** Rendezvous-Kosten gerechnet: 2,3 bis
  4,9 h Anflug und 0,7 bis 3,3 Mio Wert Deuterium fuer den Mitflieger - vom Nutzer ausdruecklich als
  in Ordnung eingestuft, die Belohnungsseite ist der Punkt.

  **Die Entscheidung selbst ist nach Entscheidung 2 verlagert** (Nutzerentscheidung 18.08.2026):
  unter der Beute-Kurve haengt die Belohnung an der vernichteten Feindmacht, und die verdoppelt sich
  mit dem zweiten Teilnehmer exakt (gemessener Faktor 2,02). Damit faellt der Koop-Anreiz
  automatisch mit der Frage an, welche Bezugsgroesse die Kurve bei mehreren Teilnehmern bekommt -
  V1 ergibt x1,82 je Teilnehmer, V2 neutral, V3 x0,91. Ein separater "Bonus je Teilnehmer" waere
  daneben ueberfluessig. **Vollstaendiger Messkasten und die drei Varianten stehen bei
  Entscheidung 2**; dort auch der Grund, warum V1 ohne Mindestbeitrag nicht haltbar ist
  (`checkShipsAllowed()` kennt keine Mindestmenge). Die uebrigen frueher notierten Hebel
  (unterproportionale Feindstaerke, Rendezvous-Kosten, Startzwang ab zwei Teilnehmern) bleiben als
  Alternativen bestehen, sind aber nachrangig, solange die Bezugsgroesse der Kurve offen ist.

- **NIVEAU der Einnahmen festlegen, nicht nur die Neigung** - **GESCHLOSSEN am 15.08.2026.**
  Messung: `run_income_level.mjs` / `income_level.txt`, 40 Durchlaeufe je Kampfzelle.

  > **Ergebnis: Das Band 3-10 Tage ist fuer "+10 % Flottenwert" mit KEINER vertretbaren Aenderung
  > erreichbar. Die Kennzahl war an der falschen Groesse angesetzt.** Sie wird umgestellt, das
  > Einnahmen-Niveau bleibt unveraendert, und der Engpass wird vollstaendig ueber Entscheidung 9
  > gestellt. Einzelheiten und die Begruendung im Messkasten am Kopf von Entscheidung 9.

  - **Die Einnahmen betragen 216 / 321 / 220 Prozent des GESAMTEN Flottenwerts pro Tag**
    (frueh/mittel/spaet: 0,80 / 19,82 / 76,85 Mrd gegen Flottenwerte von 0,37 / 6,18 / 34,99 Mrd,
    Allianz-Station eingerechnet). Ein Spieler verdient taeglich das Zwei- bis Dreifache seiner
    kompletten Flotte. Ein Schritt von 10 % ist damit zwangslaeufig in einer Stunde bezahlt - das
    ist keine Fehlkalibrierung einzelner Werte, sondern eine Groessenordnung.
  - **Fuer das Band muessten die Tageseinnahmen bei 1 bis 3,3 Prozent des Flottenwerts liegen.**
    Gemessen als noetiger Faktor: **Schiffe 65- bis 220-mal teurer** (Weg b) oder
    **Schiffs-Bauzeit 15- bis 411-mal laenger** (Weg c, je nach Ausbaustand und Lane-Zahl).
  - **Die Zeit-Seite derselben Kennzahl ist heute noch KUERZER als die Ressourcen-Seite.** Mit den
    heutigen 3 Lanes braucht ein 10-Prozent-Schritt 12 Minuten bis 1,6 Stunden reine Bauzeit gegen
    45 Minuten bis 1,1 Stunden Einnahmen - "Zeit ist der Haupt-Engpass" ist bisher also **nur
    beschlossen, nicht gebaut**. Erst mit 1 Lane (Entscheidung 9.2) kippt das Verhaeltnis ab dem
    mittleren Stand.
  - **Der Beute-Anker bleibt unangetastet, und die Schiffskosten auch.** Ein Kostenfaktor 65-220
    wuerde Wert je Machtpunkt (Entscheidung 6), die Feindstaerke-Skalierung und den am 14.08.2026
    gemessenen Beute-Anker gleichzeitig verschieben - das waere keine Kalibrierung mehr, sondern
    ein anderes Spiel.
  - *Nachteil, ausdruecklich genannt:* Wird der Engpass allein ueber die Zeit gestellt, liegt der
    Bau-Ausstoss beim spaeten Stand bei 3-6 Mrd/Tag gegen 77 Mrd/Tag Einnahmen. **Ressourcen
    stapeln sich dann dauerhaft um den Faktor 15-25.** Der in Entscheidung 9 formulierte Zielwert
    "Bau-Ausstoss grob in der Groessenordnung der Tageseinnahmen" ist mit der Rangentscheidung vom
    14.08.2026 unvereinbar und ist im Messkasten bei Entscheidung 9 ersetzt worden.

- *Urspruengliche Fassung des Punktes, zur Nachvollziehbarkeit erhalten (NEU 14.08.2026):* Bei der
  Messung zu Entscheidung 1 ist aufgefallen, dass **kein einziger Ausbaustand
  auch nur in die Naehe des Zielbands 3-10 Tage kommt**: gemessen 0,5 bis 3 Stunden bis zum
  naechsten Ausbauschritt (+10 % Flottenwert), und selbst eine Verdopplung der GESAMTEN Flotte
  kostet nur 7 bis 12 Stunden Einnahmen. Ressourcen sind an keiner Stelle des Spiels ein Engpass -
  weder frueh noch spaet. Das widerspricht der Grundsatzentscheidung "es soll einen
  Ressourcen-Engpass geben" direkt. **Der Exponent kann das nicht loesen**, er kippt nur die
  Neigung. Drei Hebel standen zur Wahl:
  (a) den Anker senken (0,0956 Wert-Einheiten je Punkt Feindmacht nach unten),
  (b) die Ziele verteuern (Entscheidung 7 Minen-Kostenkurve, Modul- und Gebaeudekosten),
  (c) akzeptieren, dass ZEIT statt Ressourcen der Engpass ist - dann ist Entscheidung 9 der
  eigentliche Traeger des Spielgefuehls.
  **ENTSCHIEDEN am 14.08.2026 (Nutzervorgabe): (c) mit einem Rest von (b). Zeit ist der
  Haupt-Engpass, Ressourcen ein spuerbarer Neben-Engpass. (a) ist vom Tisch.** Der Punkt ist damit
  keine offene Frage mehr, sondern eine Kalibrieraufgabe in Block D - Einzelheiten und der offene
  Widerspruch zur Verlust-Vorgabe im Kasten bei Entscheidung 9.
  **Die Messung stuetzt das:** (c) trifft bereits heute weitgehend zu, ohne dass es so entschieden
  war.
  Die grossen festen Ziele liegen dagegen im Band (Schiffs-Module 141,97 Mrd = 8,5 Tage beim
  mittleren Stand, Heimatbasis V1 = 11,9 Tage) - **das Band stimmt also fuer die einmaligen
  Ausbauziele und verfehlt nur das dauerhafte Flottenwachstum.** Genau die 74 Tage aus der
  Senken-Rechnung: danach bleibt nur noch die Flotte, und die kostet Stunden.
- **Konzentration auf das Elite-Bollwerk pruefen (NEU 15.08.2026, Nebenbefund aus
  `income_level.txt`).** Es stellt **54 % der Einnahmen im mittleren und 74 % im spaeten
  Ausbaustand** - alle uebrigen Quellen zusammen (Solo 6 %, Raid 11 %, passive Quellen 4 %,
  Allianz-Station 5 %) tragen weniger als ein Viertel. Das gesamte Einnahmen-Niveau haengt damit an
  einem einzigen Inhalt, und zwar nach der Raid-Senkung noch deutlicher als davor. Zwei Folgen:
  jede Aenderung am Bollwerk verschiebt sofort die komplette Baseline, und faellt es aus (Bots zu
  schwach, siehe Schritt 26 der Reihenfolge), bricht das Spiel wirtschaftlich zusammen. **Keine
  Aenderung in Block A** - das Niveau ist am 15.08.2026 ausdruecklich als unveraendert festgelegt.
  Zu entscheiden ist nur, ob die Verteilung so bleiben soll.
- **Beute-Kurve gegen die Startphase pruefen (NEU 14.08.2026).** Nach der Messung verliert der
  frueheste Ausbaustand rund 88 % seiner Missionsbelohnung, weil die heutige Belohnung eine feste
  Container-Menge ist und die neue an der vernichteten Feindmacht haengt. Nach dem Reset ist genau
  das die erste Spielwoche. Gemeinsam mit Entscheidung 10 und 12 kalibrieren. Herleitung im Kasten
  bei Entscheidung 2.

- **`STATION_MINING_COMPENSATION` neu bestimmen (NEU 10.08.2026).** Steht auf 3 und liefert damit
  7,90 Mrd/Tag bei vollem Stationsausbau - **bei zwei Mitgliedern rund 3,95 Mrd/Tag pro Kopf**, was
  gegen die alte Baseline 18,2 % entspricht und damit knapp im Zielband liegt. Kein akuter
  Handlungsbedarf, aber nach Block A gegen die neue Baseline nachzurechnen. Vollstaendige
  Entscheidungsregel (Pro-Kopf-Anteil unter 20 %, Amortisation 60-120 Tage, Untergrenze 2,0, plus
  die offene Design-Frage zur Mitgliederzahl) in Abschnitt 2a.
- **Klassen-Balance nachmessen (angepasst am 11.08.2026, siehe Abschnitt 4a).** Bollwerk und
  Kommandant sind angehoben worden, alle drei Klassen liegen jetzt gleichauf. Nach jeder Aenderung
  an Entscheidung 1, 19 oder am Rueckzugs-Mechanismus `run_classes.mjs` neu laufen lassen - die
  Klassen haengen an genau diesen Groessen.
- **Feindstaerke-Basis pruefen (NEU 11.08.2026, Nebenbefund aus der Klassen-Messung).**
  `combatFleetPowerBase()` besteht zu **98,4 % aus Schild und Panzerung und nur zu 1,6 % aus
  Waffen**. Waffen zu bauen laesst die Gegner also praktisch nicht mitwachsen, Panzerung zu bauen
  schon. Beruehrt Entscheidung 6 direkt. Herleitung in Abschnitt 4a.
- ~~**Raid-SCHWIERIGKEIT gemeinsam mit dem Ertrag entscheiden (NEU 13.08.2026).**~~
  **GESCHLOSSEN 15.08.2026: `RAID_ALLY_POWER_WEIGHT = 1,0`.** Gemessen bleibt Unterstuetzung auch
  bei voller Gewichtung klar vorteilhaft (3,1 % Verlust statt 10,1 % allein) - die Begruendung vom
  Juli 2026 ist damit widerlegt. Einzelheiten im Kopf von Entscheidung 3. **Neu offen daraus:** der
  Raid wird dadurch teurer, aber nicht verlierbar (12/12 Wellen in jedem gemessenen Fall). Siehe
  Abschnitt 8 Punkt 7.
- ~~**Raid-Ertrag gegen die ZAHL DER ACCOUNTS neu rechnen (NEU 11.08.2026, hoechste Prioritaet).**~~
  **GESCHLOSSEN 15.08.2026: Variante 6** (fester Topf je Raid nach Beitrag, plus Saettigung ueber
  die Tagessumme). Ergebnis 7,56 Mrd/Tag und 33 % Anteil gegen 21,4 Mrd/Tag und 58 % im
  Ist-Zustand. **Zwei Korrekturen an den bisherigen Zahlen dieser Zeile:** der Ist-Zustand ist
  21,4 Mrd/Tag bei 3,4 real verteidigten Raids (nicht 16,58 bei vier), und die 6,31 aus der
  Baseline waren nie falsch - sie zaehlen nur einen einzigen Raid. Vollstaendig im Kopf von
  Entscheidung 3.
- ~~**Beitrags-Massstab neu normieren (NEU 13.08.2026).**~~ **GESCHLOSSEN 15.08.2026: Massstab
  bleibt unveraendert, der Normierungs-Ansatz ist verworfen.** Im Raid liegt der absorbierte Anteil
  bei 0,0 bis 0,6 %, nicht bei 1,6 %, und die vorgeschlagene Normierung wuerde einer Groesse von
  0,04 % des Geschehens die halbe Stimme geben (gemessen: ein Bot mit 2,2 % ausgeteiltem Schaden
  kaeme auf 14,2 %). Herleitung in Abschnitt 2a, Punkt 14.
- ~~**Wirtschaftsklassen nach der Raid-Korrektur neu bewerten (NEU 12.08.2026).**~~
  **GEMESSEN 15.08.2026:** Der Schmuggler faellt von +0,92 auf +0,35 Mrd/Tag und bleibt damit vor
  dem Prospektor (+0,22). Die Rangfolge kippt nicht, der Abstand faellt von Faktor 4,2 auf 1,6.
  Tabelle in Abschnitt 4b. **Offen bleibt nur** die fehlende raid-unabhaengige Quelle des
  Prospektors - das ist Inhaltsarbeit, keine Kalibrierung.
- **Wachstumsgrenze der Piratenbasen festlegen (NEU 12.08.2026).** Mit der Aufhebung der
  Ausbaugrenze (Abschnitt 2a, Punkt 10) gibt es KEINE Bremse mehr: sind Gebaeude und Forschung am
  Maximum, fliesst alles unbegrenzt in Schiffe und Verteidigung. Vor dem Reset entscheiden, ob das
  so bleiben soll (Nutzerwunsch) oder ob eine Obergrenze noetig ist - und das erst, nachdem die
  offene Frage zum langsamen `tick()` beantwortet ist.
- **Piratenbasis-Schwierigkeit nach der Bot-Reparatur neu messen (NEU 12.08.2026).** Die
  Ruecklagen-Aenderung vom 12.08.2026 (Abschnitt 2a, Punkt 9) veraendert, was Piratenbasen bauen -
  weg von der reinen Masse billigster Geschuetze. Wirkung baut sich erst ueber Tage auf und ist
  daher ungemessen. Nach dem Reset mit dem Kampfsimulator gegen eine ausgereifte Basis pruefen.
- **`MAX_PLAYER_SHIPS` erneut entscheiden (NEU 11.08.2026).** Steht auf 1.000.000. Bis Entscheidung
  2 (Beute-Kurve) gebaut und gemessen ist, wirkt das Limit als Ersatz-Bremsklotz gegen
  Weglauf-Wachstum grosser Flotten - danach ist es wieder eine reine CPU-Frage und kann komplett
  fallen. **Nicht vorher entfernen.** Herleitung in Abschnitt 2a, Punkt 8.
- **Einnahmen-Baseline komplett neu rechnen.** Die 21,69 Mrd/Tag gelten nach Block A nicht mehr.
  **Achtung:** die Station taucht in der Referenztabelle in Abschnitt 1 bisher gar nicht auf,
  obwohl sie seit dem 10.08.2026 ein spuerbarer Posten ist. Beim Neurechnen mit aufnehmen.
- **DM-Bilanz neu rechnen.** 1.088/Tag faellt durch Entscheidung 3 um 595.
- **Kipppunkt der Beute-Kurve messen** (Entscheidung 2).
- **"74 Tage bis alles gekauft ist" neu rechnen** - Entscheidung 7 und 9.4 verlaengern das.
- Erreichte Check-Tiefe bei P10 (Ziel 3-5).
- ~~Ob die Solo-Sektoren durch Entscheidung 2 wieder lohnend sind (heute fuer die reale Flotte
  **-0,55 Mrd pro 24h**, also totes Inhalt).~~ **TEILWEISE BEANTWORTET 14.08.2026 durch die
  Neumessung nach dem Overkill-Deckel:** Solo Hoch liegt bei Profil voll jetzt bei **+0,11 Mrd
  statt -0,55 Mrd** (mit 30 % Bergung +0,43 Mrd), weil die Verluste von 1,65 auf 1,04 Mrd fielen.
  Das Vorzeichen ist gedreht, die Frage damit aber nur halb beantwortet: **gegen 28,32 Mrd beim
  Elite-Bollwerk bleibt Solo Hoch praktisch bedeutungslos** - nicht mehr verlustbringend, aber
  weiterhin kein Grund, es zu fliegen. Bei Profil mittel bleibt es negativ (-1,37 Mrd). Entscheidung
  2 muss den Abstand schliessen, nicht nur das Vorzeichen.
- **NEU 14.08.2026: Die drei Salven-Schiffe liegen weit UEBER dem Band** (Nebenbefund aus
  `imperator_value.txt`, siehe Entscheidung 3). Schaden je Wert-Einheit: Salvenkreuzer **2,240**,
  Salvenjaeger **1,712**, Salvendreadnought **1,410** - gegen ein Band der Standardschiffe von 0,087
  bis 0,439. Der Salvenkreuzer ist damit **das Fuenffache des besten Standardschiffs und das
  26-fache des schwaechsten**, pro eingesetzter Ressourceneinheit. Bestaetigt durch den Flottentest:
  laesst man die 270 Salven-Schiffe weg, verdreifachen sich die Verluste (4,83 % -> 14,17 %) und der
  Kampf dauert doppelt so lange. **Sie sind der eigentliche Ausreisser im Schiffs-Balance, nicht der
  Imperator.** Gedeckelt wird das bisher allein durch `maxCount` (150/90/30) - das begrenzt die
  Gesamtwirkung, aendert aber nichts daran, dass sie fuer jeden Spieler die rechnerisch erste
  Bauentscheidung sind. Vor einer Aenderung messen, wie stark die Mehrfachziel-Salve gegenueber
  Einzelzielschiffen tatsaechlich durchschlaegt - der Rohschaden in `dmgDealt` bucht je getroffenem
  Typ und koennte den Vorteil ueberzeichnen.
- **Imperator im Kampf messen** (Abschnitt 4) - er fehlt in beiden Schiffs-Messungen. Danach
  entscheiden, ob die Prestige-Einstufung bleibt.
- **`T_MAX_BASE` und die sieben Reduktionsgewichte** aus Entscheidung 9.1b - gerechnet, nicht
  gemessen.
- **Modul-Amortisation gegen die NEUE Baseline** (Zielwert 60-120 Tage, Abschnitt 4). Der noetige
  Kostenfaktor ergibt sich erst hier.
- **Bot-Wachstumskurve gegen einen menschlichen Spieler** (Entscheidung 13, Zielkorridor 60-100 %).
- ~~Maximal vertretbare Flottengroesse fuer die Kampf-Engine~~ **ERLEDIGT, war nie offen.** Die
  Messung existiert bereits: seit der stack-basierten Aggregat-Engine haengt die Rechenzeit nur
  noch von der ANZAHL VERSCHIEDENER TYPEN ab (max. 15), nicht von der Stueckzahl - **bestaetigt
  bis 1,5 Mio. Schiffe bei ~26 ms** (README, Abschnitt "Performance: Kampf-Engine fuer sehr grosse
  Flotten"). Die am 09.08.2026 hier eingetragene Zahl "~700 ms bei 2.600 Einheiten" stammte aus
  einer veralteten README-Fassung von VOR dieser Engine. `MAX_PLAYER_SHIPS = 200.000` ist damit
  performance-seitig unbedenklich.
- **Neutralitaets-Kalibrierung der Nanitenfabrik** - nach dem Umbau auf additive Reduktionen
  beschreibt die alte Rechnung nichts mehr (Entscheidung 9, Risiko).

---

## 8. Uebergabe an Folge-Chats (ZUERST LESEN)

Dieser Plan entsteht ueber mehrere Chat-Sitzungen hinweg. Dieser Abschnitt macht einen Kaltstart
moeglich, ohne dass der Gespraechsverlauf mitgeliefert werden muss.

### Wer hier arbeitet

Zwei Spieler (Ehepaar), **keine Entwickler**. Sie betreiben den Server privat, es gibt keine
weiteren echten Spieler ausser Bot-Accounts.

**Erwartete Kommunikation:**
- Normale Sprache. Fachbegriffe einmal kurz miterklaeren. Begriffe wie "Aggregat-Stapel",
  "Overkill", "Feindstaerke-Skalierung", "Amortisation" oder "Koeffizient K" sind von sich aus
  nicht verstaendlich.
- **Bei jeder Zahl dazusagen, ob sie viel oder wenig ist.** Referenz: 21,69 Mrd Wert/Tag
  Einnahmen im Endspiel (siehe Abschnitt 1), 1.088 DM/Tag.
- Auswirkungen als Spielgefuehl beschreiben, nicht als Formel: Was merkt man beim Spielen? Was
  passiert, wenn nichts geaendert wird?
- Keine langen Code-Ausschnitte. Dateinamen nur zur Orientierung.
- Sachlich, kompakt, keine Hoeflichkeitsfloskeln, keine Emojis.
- Aktiv widersprechen, wenn eine Idee zu Problemen fuehrt - auch wenn sie bereits entschieden ist.

### Wie die Entscheidungen zustande kamen

Der Nutzer hat die Entscheidungshoheit ausdruecklich delegiert ("mach wie du denkst und fuer
richtig haeltst"), nachdem ihn 8 gleichzeitige Einzelentscheidungen ueberfordert hatten.
**Konsequenz fuer Folge-Chats: nicht mit offenen Fragen antworten, sondern mit einem entschiedenen
Vorschlag samt Begruendung UND ausdruecklich genanntem Nachteil.** Der Nutzer korrigiert dann
punktuell.

Vorgegeben hat der Nutzer nur drei Geschmacksfragen:

| Frage | Antwort |
|---|---|
| Wie lange soll das Spiel tragen? | **Dauerhaft, kein Endpunkt** |
| Wie soll sich Fortschritt anfuehlen? | **Zahlen wachsen immer weiter** |
| Wie viel Risiko beim Fliegen? | **Spuerbar, aber nie Totalverlust** |

Dazu die vier frueheren Grundsatzentscheidungen aus Session 3 (Ressourcen-Engpass ja,
Flottenwachstum ueber hoehere Belohnung statt geringere Verluste, Wrack-Bergung 30 %, Beute
proportional zur vernichteten Feindmacht) und die Rahmenbedingung Server-Reset (Abschnitt 1a).

**Diese sieben Vorgaben sind gesetzt und werden nicht neu diskutiert.** Alles andere in diesem Plan
ist verhandelbar.

### Zeitrahmen

Umsetzung fruehestens in rund 8 Wochen (Rueckkehr des Nutzers aus dem Urlaub). Bis dahin wird der
Plan wiederholt durchgesprochen und verfeinert. Die eigentliche Umsetzung erfolgt danach mit
Claude Code.

*Praezisiert am 10.08.2026:* hier stand "In dieser Phase KEIN Code schreiben und KEINE Spieldateien
aendern - ausschliesslich diesen Plan fortschreiben". Das gilt weiterhin als **Grundregel fuer die
Balance-Blocke A bis F**, ist aber keine Absolutsperre: der Nutzer hat am 10.08.2026 zwei selbst
gefundene Defekte vorgezogen umsetzen lassen (Abschnitt 2a). **Massstab fuer solche Ausnahmen:**
Es muss ein stiller Defekt sein (etwas wirkt nicht, obwohl es soll), nicht eine Balance-Zahl, die
sich nach Block A ohnehin verschiebt - und jede vorgezogene Aenderung wird in Abschnitt 2a mit
Messwert und offenem Kalibrierpunkt protokolliert. Wo dabei doch eine Balance-Zahl noetig wird,
gehoert sie als benannte Konstante in den Code, damit die spaetere Kalibrierung eine Zeile ist.

### Was in Folge-Chats noch besprochen werden kann

**Stand 09.08.2026: KEINER dieser Punkte ist mehr eine offene Frage.** Fuer jeden ist die
**Entscheidungsregel** festgelegt - was gemessen wird, welche Antwort welche Konsequenz hat, und was
gilt, wenn die Messung uneindeutig ausfaellt. Die Umsetzungs-Session misst und wendet die Regel an;
sie muss dafuer nicht zurueckfragen. Offen ist nur noch die ZAHL, nicht die Entscheidung.

**Warum ueberhaupt Regeln statt Zahlen:** alle Zahlen in diesem Plan sind gegen eine Baseline von
21,69 Mrd/Tag gerechnet, die nach Block A wegfaellt (Abschnitt 7). Eine heute festgelegte Zahl waere
nach der ersten Messung falsch, eine Regel nicht.

---

**1. Beute-Exponent 0,85 gegen 0,90-0,95** (Entscheidung 2) - **GESCHLOSSEN am 14.08.2026.**
Messung: `run_loot_exponent.mjs` / `loot_exponent.txt`, 40 Durchlaeufe je Zelle, drei Ausbaustaende
(klein/schwach 0,37 Mrd - Referenzflotte 6,18 Mrd - reale Flotte 34,99 Mrd).

> **Ergebnis: Der Exponent bleibt bei 0,85.** Er ist nicht der urspruengliche Wert aus Bequemlichkeit,
> sondern der gemessene beste Wert im Suchraum.

- **Das Zielband 3-10 Tage ist von KEINEM Exponenten erreichbar** - auch nicht vom heutigen Zustand.
  Gemessen liegt die Kennzahl bei 0,5 bis 3 Stunden statt 3 bis 10 Tagen, also um Faktor 25 bis 500
  daneben. Grund: Der Exponent aendert nur die NEIGUNG der Beutekurve, nicht ihr NIVEAU. Das Niveau
  steckt im Anker (gemessen 0,0956 Wert-Einheiten je Punkt vernichteter Feindmacht; im Plan mit 0,091
  geschaetzt - die Schaetzung war also gut). Selbst "die gesamte Flotte verdoppeln" kostet nur 7 bis
  12 Stunden Einnahmen. **Als eigener offener Punkt nach Abschnitt 7 uebernommen**, er ist mit dem
  Exponenten nicht loesbar.
- **Entschieden wurde deshalb allein am Verlaufskriterium** (Kennzahl darf nicht monoton wachsen),
  gemessen als Verhaeltnis der Tagesrendite spaet/frueh; 1,00 waere ein flacher Verlauf. Weil der
  Raid noch nicht entschieden ist und alles dominiert, wurde ueber drei Raid-Annahmen gemessen
  (unveraendert / halbiert / entfaellt) und der Exponent mit der kleinsten groessten Abweichung
  gewaehlt:

  | Exponent | Raid x1,0 | Raid x0,5 | Raid x0,0 | groesste Abweichung |
  |---|---|---|---|---|
  | 0,80 | 0,98 | 0,87 | 0,76 | 24 % |
  | **0,85** | **1,08** | **0,97** | **0,86** | **14 %** |
  | 0,90 | 1,19 | 1,07 | 0,96 | 19 % |
  | 0,95 | 1,30 | 1,19 | 1,07 | 30 % |

  0,85 und 0,90 liegen dicht beieinander; die Regel "bei Uneindeutigkeit den niedrigeren Wert"
  bestaetigt 0,85 zusaetzlich.
- **Geltungsbereich musste mitentschieden werden und ist ein eigener Befund.** Entscheidung 2 nennt
  nur die Solo-Dateien. Wirkt die Kurve NUR auf Solo-Sektoren, liegt das Verhaeltnis bei 0,23 bis
  0,50 - mit KEINEM Exponenten im Suchraum reparierbar, auch 1,20 kommt nur auf 0,60. Grund: Das
  Elite-Bollwerk ist mit 10,87 Mrd/Tag die groesste Einzelquelle und bleibt ohne Kurve eine feste
  Belohnung, die mit der Flotte nicht mitwaechst. **Die Beute-Kurve muss deshalb auf Solo-Missionen
  UND Gruppen-Expeditionen wirken** (`groupOps.ts` zusaetzlich zu den in Entscheidung 2 genannten
  Dateien), sonst ist der Exponent gar nicht bestimmbar.
- *Nachteil, ausdruecklich genannt:* Alle drei Ausbaustaende sind Momentaufnahmen. Dass ein hoeherer
  Exponent die Flotte schneller wachsen laesst und damit die Gegner mitzieht (Rueckkopplung,
  Pruefpunkt 2d), bildet die Messung nicht ab - dafuer braucht es die 30-Tage-Simulation aus
  Abschnitt 1b.
- *Zweiter Nachteil:* Das Zielband 3-10 Tage bleibt gesetzt und ungemessen. Es ist jetzt zusaetzlich
  nachweislich unerfuellt - die Setzung ist damit nicht bestaetigt, sondern offen.
- **NACHGERECHNET am 15.08.2026 mit korrigiertem Raid-Wert und der beschlossenen Variante 6.
  Ergebnis: 0,85 bleibt, und zwar deutlicher als zuvor.** Das Skript rechnete bis dahin mit
  4,145 Mrd/Tag je verteidigtem Raid; gemessen sind es 6,31. Zusaetzlich ist der Raid seit dem
  15.08.2026 entschieden, der Exponent muss also nicht mehr gegen drei Hypothesen abgesichert
  werden, sondern kann gegen den tatsaechlichen Zustand gemessen werden:

  | Exponent | Verhaeltnis spaet/frueh | Abweichung vom flachen Verlauf |
  |---|---|---|
  | 0,80 | 0,87 | 13 % |
  | **0,85** | **0,97** | **3 %** |
  | 0,90 | 1,07 | 7 % |
  | 0,95 | 1,18 | 18 % |

  **0,85 liegt mit 3 % Abweichung nahezu exakt auf dem flachen Verlauf** - das ist das mit Abstand
  beste Ergebnis, das dieser Suchraum bisher geliefert hat (zuvor 14 % als kleinste groesste
  Abweichung ueber drei Annahmen). Der Grund ist einleuchtend: der Raid war die grosse
  flotten-unabhaengige Einnahme, die den spaeten Ausbaustand nach oben zog. Mit Variante 6 faellt
  sie auf ein Drittel, und die Kurve richtet sich von selbst aus. **Die Raid-Entscheidung und der
  Beute-Exponent stuetzen sich gegenseitig.**

  *Die alte Tabelle oben ist damit zahlenmaessig ueberholt.* Mit dem korrigierten Raid-Wert lauten
  die drei Hypothesen-Spalten 1,19 / 1,02 / 0,86 (groesste Abweichung 19 % statt 14 %); 0,85
  gewinnt auch dort weiterhin. **Die Entscheidung war also nie gefaehrdet, nur die Zahlen dahinter
  waren falsch.**

- **Zwei Dinge, die sich dadurch NICHT geaendert haben:**
  - Das Zielband 3-10 Tage bleibt unerreicht (gemessen 1,1 bis 1,2 Stunden). Das ist der
    Niveau-Punkt in Abschnitt 7, nicht der Exponent.
  - Der Geltungsbereich bleibt zwingend: **nur Solo** ergibt unter Variante 6 ein Verhaeltnis von
    0,35 statt 0,97. Ohne Wirkung auf `groupOps.ts` ist der Exponent weiterhin nicht bestimmbar -
    die Raid-Senkung macht diesen Punkt sogar deutlicher, nicht schwaecher.

- **Zur Belastbarkeit des Ankers:** ueber drei Laeufe hinweg lag er bei 0,0956 / 0,0945 / 0,0939
  Wert-Einheiten je Punkt vernichteter Feindmacht. Das sind rund 2 % Streuung aus den
  Zufallsanteilen der Kaempfe. **Der Anker ist damit auf zwei Nachkommastellen belastbar, nicht auf
  vier** - Rechnungen, die auf die dritte Stelle empfindlich reagieren, sind zu fein.

Urspruengliche Formulierung der Entscheidungsregel:
- *Gemessen wird:* fuer einen fruehen, einen mittleren und einen spaeten Ausbaustand die Kennzahl
  **"Tage bis zum naechsten sinnvollen Ausbauschritt"** = Kosten des naechsten Schritts geteilt
  durch Netto-Einnahmen pro Tag.
- *Regel:* Der Exponent ist richtig, wenn diese Kennzahl ueber alle drei Staende **im Band 3-10 Tage
  bleibt und nicht monoton waechst.** Waechst sie mit dem Fortschritt, bleiben die Einnahmen hinter
  den Kosten zurueck -> Exponent erhoehen. Schrumpft sie, laeuft das Spiel sich tot -> senken.
  Suchraum 0,80-0,95 in Schritten von 0,05.
- *Bei Uneindeutigkeit:* den **niedrigeren** Wert nehmen. Zu wenig Beute laesst sich spaeter ueber
  Sektorwerte nachbessern, zu viel Beute nur durch eine Wegnahme.
- *Nachteil:* das Band 3-10 Tage ist gesetzt, nicht gemessen. Es folgt aus dem Zielbild
  ("Ziele bleiben bestehen"), nicht aus Daten.

**2. Feindstaerke-Variante (a)** - **GESCHLOSSEN am 09.08.2026.** Bleibt bei (b), siehe Punkt 8 und
Abschnitt 4. Wird nicht neu aufgemacht.

**3. Imperator-Einstufung** (Abschnitt 4) - **GESCHLOSSEN am 14.08.2026.** Messung:
`run_imperator_value.mjs` / `imperator_value.txt`. Ergebnis: **0,040 Schaden je Wert-Einheit gegen
ein Band der Standardschiffe von 0,087 (Bomber) bis 0,439 (Kreuzer)** - er liegt bei 46 % des
schwaechsten und 9 % des besten Standardschiffs, also klar UNTER dem Band. Nach der Regel unten
bleibt er damit nur dann Prestige-Einheit, wenn er eine Faehigkeit besitzt, die kein anderes Schiff
hat. **Er hat eine:** Der Imperator ist das einzige Schiff mit RapidFire gegen Ionengeschuetz,
Gausskanone und Plasmawerfer (im Code geprueft; der Bomber hat RapidFire nur gegen Raketenwerfer
und die beiden Laser). Damit ist die Prestige-Einstufung erstmals belegt statt behauptet.
**Beschlossene Konsequenz: nicht die Kampfwerte anheben, sondern den Grind senken.** Werte anheben
wuerde exakt den Zustand wiederherstellen, der am 05.08.2026 per Nutzerentscheidung zurueckgebaut
wurde ("andere Schiffe muessen wieder mitkaempfen") - der Nachweis dafuer steht in Abschnitt 4:
6 Imperatoren stellen bereits 34 % des Flottenschadens, 12 Stueck 50 %. Eine Halbierung der
Teile-Kosten (1.000 -> 500 je Kategorie, Grind rund 11 -> 5,5 Tage) bringt ihn rechnerisch auf 0,080
und damit an die Bandgrenze, **ohne einen einzigen Kampfwert anzufassen.** *Nachteil:* die
Teile-Kosten haengen an der Container- und Belohnungswirtschaft; die Aenderung gehoert deshalb in
Block D und NICHT vorgezogen. *Offen bleibt:* der Ressourcen-Gegenwert von 325.000 je Teil ist eine
Setzung aus Abschnitt 2a, keine Messung - die Kennzahl 0,040 haengt direkt daran.

Urspruengliche Formulierung der Entscheidung:
- *Gemessen wird:* Kampfkraft pro Ressourceneinheit im echten Kampf, gegen die Bandbreite der
  uebrigen Schiffe.
- *Regel:* Liegt er **im Band** -> er ist ein normales Schiff, und der Grind (rund 11 Tage fuer
  1.000 Teile einer Kategorie) muss auf das Niveau vergleichbar starker Schiffe gesenkt werden.
  Liegt er **darunter** -> er darf nur dann Prestige-Einheit bleiben, wenn er eine Faehigkeit
  besitzt, die kein anderes Schiff hat. Hat er keine, werden seine Werte angehoben, bis er im Band
  liegt.
- **"Prestige" ist keine gueltige Begruendung fuer schlechte Werte allein.** Der Begriff hat im
  bisherigen Plan genau diese Luecke gefuellt.
- *Nachteil:* eine Sonderfaehigkeit nachzuruesten ist Inhaltsarbeit, keine Balance-Aenderung, und
  entsprechend aufwaendig.

**4. Startphasen-Kalibrierung** - **GESCHLOSSEN am 09.08.2026 durch Abschnitt 1b.** Die Frage
"woran erkennt man, dass die Startphase stimmt" ist dort mit sechs Abnahmekriterien beantwortet.
Es bleibt eine Messaufgabe, keine Entscheidung.

**5. Solo-Stufen Niedrig/Mittel/Hoch** (Abschnitt 4).
- *Gemessen wird:* Netto-Ertrag pro Stunde je Stufe nach Entscheidung 2, jeweils bei dem
  Ausbaustand, bei dem die Stufe zuerst zuverlaessig gewinnbar ist.
- *Regel:* Jede hoehere Stufe muss **mindestens 30 % mehr** Netto-Ertrag pro Stunde liefern als die
  darunterliegende. Darunter gibt es keinen Grund, das hoehere Risiko zu fliegen - dann ist eine
  zusaetzliche Differenzierung noetig. **Ueber 100 % Sprung** ist ebenfalls ein Fehlschlag: dann
  sind die unteren Stufen tot und der Sprung muss gedaempft werden.
- *Nachteil:* die 30 % sind gesetzt. Sie beschreiben "spuerbar besser, aber nicht alternativlos".

**6. Booster-Preise** (Abschnitt 4).
- *Gemessen wird:* der Mehrertrag, den ein Booster ueber seine eigene Laufzeit erzeugt, gegen
  seinen Preis - je Booster einzeln, nicht gemittelt.
- *Regel:* Zielband **1,5 bis 3-facher Gegenwert.** Unter 1,5 kauft ihn niemand, ueber 3 ist er
  Pflicht statt Wahl - und Pflicht-Booster sind das Gegenteil eines Ziels.
- *Achtung:* Bei den ZEIT-Boostern ist diese Rechnung nach Entscheidung 9.1b eine voellig andere.
  Sie wirken dann nicht mehr multiplikativ auf die Bauzeit, sondern additiv auf `T_cap`. Die
  Messung muss danach neu aufgesetzt werden, alte Boosterwerte sind nicht uebertragbar.
- *Nachteil:* das Band ist gesetzt und gilt fuer alle Booster gleich, obwohl manche Effekte
  schwerer in Ressourcen umzurechnen sind als andere.

**7. Raid verlierbar machen** - **ENTSCHIEDEN am 09.08.2026, auf Design-Grundlage statt Messung.**
- *Entscheidung:* **Ja, der Raid wird verlierbar - aber mit gedeckeltem Verlust.**
- *Begruendung:* Eine Heimatverteidigung, die man nicht verlieren kann, ist kein Spannungselement,
  sondern ein Timer mit Belohnung. Das widerspricht dem Endziel direkt. Die Gegenkraft ist
  Entscheidung 10, die in der Startphase Totalverluste ausschliesst. Beides zusammen ergibt:
  **Verlust ja, Totalverlust nein.** Ein verlorener Raid kostet Ressourcen und einen Teil der
  Verteidigungsanlagen, nicht die Flotte. Die Verlustobergrenze aus Entscheidung 10 gilt auch hier.
- *Offen bleibt nur der Mechanismus:* Schnappschuss der ersten Welle gegen Rueckzugsregel
  (README Punkt 27 - der Rueckzug ist bei Raids ausdruecklich abgeschaltet). Das ist eine
  Messfrage, keine Entscheidung.
- **GEMESSEN am 15.08.2026: Der Schnappschuss taugt dafuer nicht.** 0,6 % Verlust gegen 0,5 % bei
  Neuberechnung je Welle - der Unterschied liegt im Rauschen. Die vermutete Selbstkorrektur nach
  unten kann nur greifen, wenn die Flotte tatsaechlich schrumpft; bei starker Verteidigung
  passiert das nie. Der Mechanismus wirkt also **ausschliesslich bei schwachen Konten**, also genau
  dort, wo Entscheidung 10 Totalverluste ausschliessen soll.
- **Auch die volle Feindstaerke-Gewichtung macht den Raid nicht verlierbar** (12/12 Wellen in jedem
  gemessenen Fall, 3,1 % Verlust). Wer Verlierbarkeit will, muss an die Wellenstaerke selbst
  (`RAID_WAVE_ROLL`).
- **Warnung dazu aus `raid.txt`:** Zwischen "10,1 % Verlust" und "95,8 % Verlust bei 10,9 von 12
  gewonnenen Wellen" liegt fast kein Mittelfeld. Das ist die Abnutzungs-Eigenschaft aus README
  Punkt 18, und der Rueckzug ist bei Raids abgeschaltet (Punkt 27). **Eine Erhoehung der
  Wellenstaerke hat deshalb keinen sanften Bereich** - sie kippt von "kaum Verluste" direkt in
  "fast alles weg". Vor jeder Aenderung hier zuerst Entscheidung 10 (Verlustobergrenze) bauen,
  nicht danach.
- *Nachteil, ausdruecklich genannt:* Damit treffen **zwei Verschlechterungen denselben Inhalt** -
  Entscheidung 3 halbiert den Raid-Ertrag, Punkt 7 fuegt ein Verlustrisiko hinzu. Beide muessen
  gemeinsam kalibriert werden, sonst wird der Raid vom Ereignis zur reinen Belastung. **Wenn eine
  von beiden Aenderungen zurueckgenommen werden muss, dann Entscheidung 3, nicht diese hier** -
  ein verlierbarer Raid mit vollem Ertrag ist spannender als ein sicherer Raid mit halbem.
8. ~~Modulkosten~~ **ENTSCHIEDEN am 09.08.2026:** Zielwert 60-120 Tage Amortisation gegen die NEUE
   Baseline nach Block A, Faktor ergibt sich aus der Messung. Feindstaerke-Variante bleibt bei (b),
   wird nicht neu aufgemacht. Siehe Abschnitt 4. Damit ist auch der offene Punkt 2 geschlossen.
9. ~~Entscheidung 9.1: Untergrenze gegen Relation.~~ **ENTSCHIEDEN am 09.08.2026** (Nutzer hat die
   Entscheidung ausdruecklich delegiert): Saettigungskurve statt Untergrenze, alle Reduktionen
   additiv, Basis-Bauzeiten unveraendert. Vollstaendig in Entscheidung 9.1a-c, Endziel des Blocks
   in Entscheidung 9. Offen bleibt nur noch die **Messung** der sieben Gewichte und von
   `T_MAX_BASE`, nicht mehr die Bauform.
10. ~~30-Tage-Simulation vorziehen~~ **ENTSCHIEDEN am 09.08.2026:** vorgezogen auf Schritt 13,
    also nach Block C und vor Block D. Spezifikation in Abschnitt 1b.
11. ~~Bot-Ertragsweg (a) gegen (b)~~ **ENTSCHIEDEN am 09.08.2026: Weg (b)** - virtueller Ertrag UND
    virtuelle Verlustrate aus der eigenen Flottenmacht, mit den Koeffizienten aus Entscheidung 2.
    Weg (a) (Bots fliegen echte Missionen) ist verworfen: jede geflogene Mission ist eine echte
    Kampf-Simulation, und `POOL_SIZE` steht auf 1 - alle Kaempfe laufen serialisiert ueber einen
    Worker. Genau die Last, die nach dem CPU-Vorfall gedrosselt wurde.
    Nachteil von (b) ausdruecklich akzeptiert: Bots haben eine unnatuerlich glatte Wachstumskurve
    ohne Zufallsausreisser.
12. ~~Entscheidung 3, "Bekannter Nachteil"~~ **ENTSCHIEDEN am 09.08.2026: gestrichen, mit
    Praezisierung.** Was durch den Reset entfaellt, ist das GEFUEHL der Wegnahme - niemand hat je
    10/6/2 gehabt. Der rechnerische Effekt bleibt bestehen: der Raid liefert nach der Halbierung
    weniger, gemessen an der neuen Baseline. Siehe Entscheidung 3.

**Damit ist der Plan vollstaendig entschieden.** Fuer jeden Punkt steht entweder die Zahl oder die
Regel, nach der die Zahl bestimmt wird. **Eine Umsetzungs-Session braucht keine weitere
Entscheidungsrunde** - sie arbeitet Abschnitt 5 der Reihe nach ab, misst, wendet die jeweilige Regel
an und traegt das Ergebnis in Abschnitt 7 nach.

**Was das ausdruecklich NICHT heisst:** dass die Zahlen stimmen. Sie sind gerechnet, nicht gemessen.
Der Unterschied zwischen diesem Plan und dem Zustand davor ist nicht, dass jetzt die richtigen Werte
feststehen, sondern dass fuer jeden Wert festgelegt ist, **woran man erkennt, ob er richtig ist.**

### Aenderungsprotokoll dieses Plans

Jede Aenderung hier eintragen, damit ueber mehrere Chats hinweg nachvollziehbar bleibt, WARUM etwas
so steht - insbesondere bei Entscheidungen, deren urspruengliche Begruendung spaeter entfallen ist.

| Datum | Aenderung |
|---|---|
| 20.08.2026 (Nutzerentscheidung) | **Zwei Punkte aus der Messung entschieden.** (1) **Das Frischling-Fenster wird auf 14 Tage gezogen und an `NEWCOMER_GRACE_MS` gekoppelt.** Gemessen ist die Laenge eine Begriffs-, keine Balancefrage - die vorab aufgestellte Entscheidungsregel trifft in jeder Variante zu und trennt nichts. Entschieden wurde deshalb nach dem Begriff: fuer "Frischling" gibt es nur noch EINE Zahl, statt bisher 14 Tage Raid-Schonfrist gegen 7 Tage Mining-Bonus. Kosten gemessen und angenommen: +4,60 Mrd in Woche 2, 12 % des Wocheneinkommens. Technischer Hinweis in der Bauanleitung ergaenzt: `NOVICE_BONUS_WINDOW_MS` steht in `economy.ts` auf Zeile 30, `NEWCOMER_GRACE_MS` auf Zeile 397 - bei einer Kopplung muss die Reihenfolge der Deklarationen mitgezogen werden, sonst ist der Wert an der Verwendungsstelle `undefined`. (2) **Abnahmekriterium 5 wird umgestellt - Variante "nur die Zuordnung aendern".** Die Schwelle von 50 % bleibt woertlich stehen; geaendert hat sich, WORAUF das Kriterium zeigt: von Entscheidung 12 auf **Entscheidung 3 (Raid-Ertrag) und die Solo-Einnahme der Startphase**. Grund ist die Messung vom selben Tag: der Raid stellt 58 % der Woche-1-Einnahmen, die Asteroiden 39 %, und jede Kuerzung des Frischling-Bonus HEBT den Raid-Anteil auf bis zu 78 % - das Kriterium haette in der alten Fassung einen moeglichst GROSSEN Bonus verlangt. Rechnet man den Raid heraus, liegen die Asteroiden bei 93 % und selbst ohne jeden Bonus noch bei 81 %; Ursache ist nicht die Hoehe des Minings, sondern dass daneben nichts steht (Solo 1,23 Mrd/Woche, mit wachsender Flotte fallend). **Bewusst NICHT gemacht:** das Kriterium in zwei Schwellen aufteilen (eine fuer den Raid, eine fuer den Rest). Beide Zahlen waeren gesetzt statt gemessen. **Folge:** Entscheidung 12 kann Kriterium 5 weder erfuellen noch verletzen; der Grund, aus dem sie am 09.08.2026 aus Block F vorgezogen wurde, ist damit entfallen. Kriterium 5 bleibt eine Reset-Bedingung, haengt aber jetzt an Entscheidung 3 (entschieden, nicht gebaut) und an Abschnitt 8 Punkt 5 (Solo-Differenzierung). |
| 20.08.2026 | **Block C, Schritt 11: Entscheidung 12 KALIBRIERT - NICHT GEBAUT.** Der Wert steht: **`NOVICE_BONUS_ADD = 2,0`**, Mining-Multiplikator = Produkt der uebrigen Quellen PLUS 2,0 statt MAL 3. Das ist die woertliche additive Lesart der heutigen 3 und braucht keine neu erfundene Zahl - gemessen +98 % Mining in Woche 1 statt +200 %, beim spaeten Vollstapel +16 % statt +200 %. Bauanleitung im Messkasten am Kopf von Entscheidung 12 (zwei Client-Spiegel, nicht einer: `lib/multipliers.ts` UND das Badge in `pages/Sektor.tsx`, dessen Text unter der additiven Regel sachlich falsch wird). Skript `run_novice_bonus.mjs`, Protokoll `novice_bonus.txt`, kumulativer Messbuild (Block A Schritt 2 + Entscheidung 16), Ankerzelle aus `loot_curve.txt` auf -1,7 % reproduziert (normiert auf die vernichtete Feindmacht). **Die im Plantext geforderte gemeinsame Kalibrierung mit Entscheidung 9 ist NICHT noetig - und das ist gemessen, nicht unterstellt.** Statt die 30-Tage-Simulation (Schritt 13) vorzuziehen, wurde die Woche-1-Zusammensetzung gegen zwei einklammernde Bau-Szenarien gerechnet (K1: 3 Lanes, heutige Basiszeiten; K2: 1 Lane, Basiszeiten x2). **Keine Zelle unterscheidet sich um mehr als einen Prozentpunkt.** Grund: das Mining sitzt in beiden Bau-Welten am ERSTEN Tag am Cap - 700 Schiffe kosten 14,3 Mio Wert gegen 117,5 Mio Startressourcen und brauchen selbst mit einer Lane und doppelten Basiszeiten 3,9 Stunden -, und die Kampf-Einnahmen der Startphase sind nicht bau-, sondern gegnerskalierungsbegrenzt. **Der wichtigste Befund betrifft aber nicht diese Entscheidung, sondern Abschnitt 1b: Abnahmekriterium 5 zeigt auf die falsche Quelle.** Groesste Einzelquelle der Woche 1 ist der **RAID mit 58-64 %** (10x Silber + 6x Gold + 2x Elite je gewonnener Welle = 1,84 Mrd Wert, bei 12/12 Wellen 22,07 Mrd - flach, unabhaengig von der eigenen Staerke, zweimal woechentlich), das Asteroiden-Mining liegt mit 33-39 % darunter. **Jede Kuerzung des Frischling-Bonus macht das Kriterium schlechter** (Raid-Anteil steigt auf 78 %), und ohne den Raid gerechnet steht das Mining selbst bei KOMPLETT abgeschaltetem Bonus noch bei 81 % - schlicht weil daneben nichts steht (Solo-Einnahme der Startphase 1,23 Mrd/Woche gegen 6,03 Mrd Mining ohne jeden Bonus). Kriterium 5 ist damit in beiden Lesarten kein Massstab fuer Entscheidung 12 und bis zu seiner Umstellung **kein Reset-Blocker**. **Vierter ungebauter Posten gefunden:** Entscheidung 3 (Raid-Ertrag Variante 6) steht ebenfalls nicht im Code - kein `RAID_ALLY_POWER_WEIGHT`, keine Saettigung, `RAID_WAVE_WIN_*` unveraendert 10/6/2. Die Uebergabe fuehrte bis dahin nur drei Pakete. **Drei Zahlen des Plantextes gegen den Code korrigiert (Messregel 16):** der Mining-Stapel ist x36,72, nicht x24,5 (die 24,5 sind derselbe Stapel ohne `mining_schiffe`); daraus folgt 12,70 statt 8,5 Mrd/Tag; und beide Zahlen setzen Mining-Forschung Stufe 10 voraus, die ein 7 Tage altes Konto nicht haben kann - real erreichbar sind x6,12 bzw. x12,24 an Di/Do. **Die Fensterfrage (7 gegen 14 Tage) ist gemessen eine Begriffs-, keine Balancefrage:** die vorab vorgeschlagene Entscheidungsregel trifft in jeder Variante zu und trennt nichts; die Verlaengerung auf 14 Tage kostet 4,60 Mrd in Woche 2, also 12 % des Wocheneinkommens. Empfehlung: `NOVICE_BONUS_WINDOW_MS` an `NEWCOMER_GRACE_MS` koppeln, damit es fuer "Frischling" nur eine Zahl gibt. **Vier Nebenbefunde, alle NICHT hier nachgezogen:** (1) die Solo-Einnahme der Startphase ist eine flache Zahl um 0,24 Mrd/Tag und FAELLT mit wachsender Flotte - ab 400 Mio Flottenwert wird das Netto negativ, weil der flache Container-Fund konstant bleibt und die Gegnerstaerke mitwaechst; (2) damit hat Abschnitt 8 Punkt 5 in der Startphase nicht nur zu wenig Abstand, sondern das falsche Vorzeichen (hoch liefert weniger als niedrig); (3) auch die Raid-Einnahme faellt mit wachsender Flotte, und der Einbruch bei F0 zwischen 800 und 1600 Mio kommt vom RUECKZUG, nicht von der Feindstaerke - `retreatMode: 'fleetOnly'` laesst die Flotte abdrehen, die Welle behaelt Reste, und gewonnen ist eine Welle nur bei vollstaendiger Vernichtung; die alte Beschreibung "Rueckzug gilt nicht fuer die Heimatverteidigung" ist damit ueberholt; (4) die Woche 1 liefert 6,57-7,85 Mrd/Tag und damit das 6,7- bis 8,0-fache des "fruehen" Ausbaustandes (0,98 Mrd/Tag) - die Sorge von Entscheidung 12 ist bestaetigt, aber der Traeger ist der Raid mit 3,8 Mrd/Tag, nicht der Bonus mit 1,7 Mrd/Tag; selbst bei komplett abgeschaltetem Bonus bleibt die Startwoche beim Fuenffachen. |
| 19.08.2026 (Abend) | **Entscheidung 16 vollstaendig KALIBRIERT - NICHT GEBAUT.** Die beiden offenen Zahlen stehen: **RF-Wert 4** und **`SIZE_MISMATCH_EVASION_BONUS` klein/gross 0,20, mittel/gross 0,08**. Dazu zwingend `ZIELERFASSUNG_BASE['leicht'] = 0,25` (ohne den Eintrag ist die neue RF des Leichten Jaegers toter Code - die Falle aus 4.4) und der Client-Spiegel fuer den Ausweichbonus. Bauanleitung im Messkasten bei Entscheidung 16, Protokoll `rf_depth.txt`, Abschnitt "ZWEITE MESSRUNDE". **Gemessen gegen einen KUMULATIVEN Messbuild inkl. Block A Schritt 2** (`make_messbuild_kum.mjs`), weil beide zum Server-Neustart gemeinsam wirksam werden - gegen den heutigen Repo-Stand haette man gegen eine Baseline gemessen, die es dann nicht mehr gibt. Der Build wurde vor Gebrauch gegen zwei bekannte Anker aus `loot_curve.txt` geprueft und reproduziert sie (Kurve auf 0,1 % genau, Elite-Anker -1,7 %). **`lib.mjs`, `lib3.mjs` und `run_income_baseline_v2.mjs` loesen jetzt `MESSBUILD` auf** - vorher liefen sie fest gegen `server/dist` und konnten gegen einen Messbuild gar nicht messen. **Die zentrale Korrektur: die Begruendung der ersten Messrunde war falsch.** Dort galt Klassen-RF als "globaler Spieler-Buff", weil der Verteidigungsverlust im Raid auf 0,0 % faellt - eine Prozentzahl ohne ihren Gegenposten. Nachgerechnet mit 40 statt 10 Raids: der Flottenverlust steigt gleichzeitig von 13,6 auf 19,6 %, und weil die Referenz-Verteidigung 0,43 Mrd wert ist und die Flotte 5,52 Mrd, **wird der Raid in Wert-Einheiten 29 % TEURER** (0,84 -> 1,08 Mrd). Kipppunkt: erst ab Verteidigungsanlagen im Wert von rund 29 % des Flottenwerts waere die Verschiebung ein Vorteil. Ebenso die Einnahmen-Seite: die Baseline bewegt sich um maximal 2 % (0,98 / 19,50 / 60,45 gegen 0,98 / 19,36 / 61,69), weil die Beute an der vernichteten Feindmacht haengt und die von der Sektorstaerke gesetzt wird, nicht vom Kampfverlauf. **Folge: KEIN Ausgleich ueber die Gegnerstaerke noetig** - `PIRATEN_MULTIPLIER_ROLL` bleibt unberuehrt und seine Sperre muss gar nicht fallen, `RAID_WAVE_ROLL` ist freigegeben, bleibt aber ungenutzt (eine Anhebung wuerde die ohnehin eintretende Verschaerfung verdoppeln, und der Regler hat nach Abschnitt 8 Punkt 7 keinen sanften Bereich). **Wie die Zahlen bestimmt wurden.** Ausweichbonus zuerst, weil die erste Runde ihn als den eigentlichen Hebel ausgewiesen hatte: vier Stufen (0,45/0,18, 0,30/0,12, 0,20/0,08, 0,10/0,04) bei festem RF 4. Bei 0,45 und 0,30 bleibt mindestens eine reine Aufstellung bei 0 % Siegquote und die Jaeger-Aufstellung bleibt die beste Wahl; bei 0,10/0,04 kippt es ins Gegenteil und die realistische gemischte Flotte faellt auf 10 % Siegquote. **Nur 0,20 / 0,08 erfuellt beide Kriterien.** Danach der RF-Wert (2/3/4/5) beim gewaehlten Bonus: bei REALER Sektorstaerke ist er ueberhaupt kein Hebel (4,97 / 5,14 / 5,17 % fuer 3/4/5, im Rauschen), entschieden wird er allein daran, ob die realistische gemischte Flotte gegen die Elitekader-Welle ueber der Kippkante bleibt - RF2 0 %, RF3 25 %, RF4 65-77,5 %, RF5 85 %. **RF4 ist der niedrigste Wert, der das schafft**, und RF5 dreht die Elite/Jaeger-Ordnung wieder um. **Streuung bestimmt, bevor die Tabellen zu fein gelesen werden:** dreimal dieselbe Zelle ergab beim Wertverlust 1,2 Punkte Spanne, bei der Siegquote nahe der Kippkante 12,5 Punkte - Unterschiede unter 2 bzw. 15 Punkten sind kein Befund. **Drittes Ergebnis, unabhaengig von der Zahl: das Wellenprofil ist im Client nirgends sichtbar** (`pickWaveProfile()` wuerfelt pro Check, `piraten_hoch` 10/45/45). Der Spieler kann seine Aufstellung also gar nicht gegen ein bekanntes Profil waehlen - massgeblich ist der profilgewichtete Schnitt, die Einzelprofil-Tabellen der ersten Runde sind Diagnose, nicht Abnahme. **Zwei Nachteile, ausdruecklich:** eine gleichmaessig ueber alle Klassen gestreute Flotte wird die schlechteste Wahl gegen eine scharfe Welle (100 % Siegquote heute, 0-10 % danach) - Spezialisierung wird belohnt, Streuung bestraft, das gehoert in den Patchtext. Und die Verteidigungsanlagen nehmen im Raid gar keinen Schaden mehr; wirtschaftlich unkritisch, inhaltlich eine Entwertung - offener Punkt, gehoert zu Entscheidung 3, nicht hierher. |
| 19.08.2026 | **Block A, Schritt 2 vollstaendig KALIBRIERT - aber auf Nutzerwunsch NICHT GEBAUT.** Ab jetzt gilt: Aenderungen erst, wenn der ganze Plan steht, vorher nur auf ausdrueckliche Nachfrage. Die Messung lief gegen einen lokalen Messbuild mit den unten beschriebenen Aenderungen (Verfahren wie `make_messbuild_rf.mjs`); im Repo steht davon keine Zeile, und `run_loot_curve.mjs`/`run_income_baseline_v2.mjs` laufen gegen den heutigen Stand nicht, weil `game/loot.js` fehlt. **Bauanleitung und alle Konstanten im Messkasten am Kopf von Entscheidung 2.** Gebaut werden muesste: neues Modul `game/loot.ts` (Kurve, Koop-Aufschlag, Bergung), verdrahtet in `missions.ts`, `groupOps.ts` und `pirateBaseCombat.ts`; `fleetSizeRewardMultiplier()` an beiden Einsatzstellen entfernt; zwei neue Anker `LOOT_CURVE_SOLO_CHECK_POWER` (2,662 Mrd) und `LOOT_CURVE_ELITE_CHECK_POWER` (2,29 Mrd); `winResources` der drei Solo-Sektoren x13,8. Gemessen mit `run_loot_curve.mjs` (solo/elite/coop) und `run_income_baseline_v2.mjs`, 40 Durchlaeufe je Zelle, scheibenweise, Protokoll `loot_curve.txt`. Vollstaendig im Messkasten am Kopf von Entscheidung 2. **Koop entschieden: V2 (Kurve auf den eigenen Beitragsanteil) plus 15 % je Mitflieger, gedeckelt bei 3 - gemessen x1,146/x1,155 Netto je Teilnehmer.** Diese Entscheidung gilt unabhaengig vom Einbauzeitpunkt. V1 verworfen aus einem Grund, den `elite_coop.txt` nicht zeigen konnte: **Bots nehmen Elite-Einladungen automatisch an** (`bot.ts`, 30 % ihrer Flotte), unter V1 waeren zwei eingeladene Bots ein Ein-Klick-Einkommensmultiplikator gewesen. V2 ist zusaetzlich von sich aus alibi-sicher, die geforderte Mindestmengen-Pruefung entfaellt damit ersatzlos. **Fuenf Befunde.** (1) **Eine Ressourcen-Kurve allein waere bei Solo wirkungslos geblieben:** dort steckten 94 % des Belohnungswerts in Containern (1x Elite ~238 Mio gegen ein Ressourcen-Paket von 14 Mio je Sieg). Nach Nutzerentscheidung faellt der Container-Fund jetzt einmal je MISSION statt je Check, und `winResources` traegt den Rest - Container-Anteil danach 23 % (mittel) und 5 % (spaet). Bewusst NICHT ueber die Container-INHALTE geloest: `CONTAINER_TYPES` haengt an Raids und Elite-Bollwerk, und Entscheidung 3 ist gegen genau diese Inhalte geschlossen. (2) **Beide Anker getroffen:** Solo mittel/hoch 1,05 Mrd bei 11,1 Mrd vernichteter Feindmacht (Soll 1,05 / 11,18), Elite mittel 32,71 Mrd (Soll 32,60). Der Elite-Anker musste von 2,66 auf 2,29 Mrd nachgezogen werden, weil mit dem Grossflotten-Bonus ein Multiplikator x1,50 wegfiel - der erste Lauf lag 9,7 % zu niedrig. (3) **Der Zweck ist erreicht:** Solo Hoch mit der realen Flotte netto **+2,42 Mrd statt -2,32 Mrd**, davon 3,60 Mrd aus der Kurve und 0,94 Mrd aus der Bergung. (4) **BASELINE NACH DEM EINBAU 0,98 / 19,57 / 61,11 Mrd** (heute 0,80 / 19,82 / 76,85), mittel bewusst unveraendert (-1,3 %). **Vorhersage, kein Ist-Stand** - bis zum Einbau gilt die alte Zahl weiter. **Darin stecken ZWEI Aenderungen:** auch der Flottenwert ist durch Entscheidung 6 von 0,37/6,18/34,99 auf 0,32/5,52/29,27 Mrd gefallen - wer 61,11 gegen 76,85 haelt, vergleicht beides auf einmal. (5) **Die drei Solo-Stufen bleiben beim fruehesten Ausbaustand ununterscheidbar** (0,25 / 0,25 / 0,27 Mrd netto, also 0 % und +8 % statt der in Abschnitt 8 Punkt 5 geforderten +30 %), weil der flache Container-Fund dort dominiert und alle drei Stufen aehnlich viel Container-Wert ausschuetten. Ab dem mittleren Stand trennen sie sich sauber. Offen, gehoert zu Entscheidung 12. **Zwei Nebenentscheidungen, bewusst getroffen:** die Bergung entfaellt bei vollstaendig vernichteter Flotte (der Totalverlust muss spuerbar bleiben), und der erstattete Betrag wird von `stats.resourcesSpentShipsDefense` abgezogen - ohne das waere "Schiffe im Kampf verheizen" ein besserer Punkte-Farm als das Verschrotten derselben Schiffe, exakt die Fehlerform aus R6. **Der Imperator ist von der Bergung ausgenommen** (Nutzerentscheidung: Prestige-Schiff, keine Teile-Rueckgabe). **Ausdruecklich NICHT eingebaut:** Piratenadmiral P10 (Belohnungsmechanik ist Block B, jetzt kalibrieren hiesse zweimal kalibrieren) und Raids (Entscheidung 3 ist gegen den heutigen Ertrag geschlossen). **Messregel 8 vorab geprueft:** im Client gegreppt, drei Spiegel gefunden, die beim Einbau mitzuziehen sind - `types/game.ts` (FarmDetail/GameData), `pages/Nachrichten.tsx` (Bergung getrennt ausweisen), `pages/Sektor.tsx` (die Sektor-Karte zeigt feste Belohnungen, die es nach dem Umbau so nicht mehr gibt). Die Konstanten gehoeren ueber `/game/data` an den Client, nicht als zweite hartkodierte Zahl. **`PIRATEN_MULTIPLIER_ROLL` bleibt gesperrt, bis der Schritt gebaut ist.** |
| 19.08.2026 | **Block C, Schritt 10 erledigt: Entscheidung 10 umgesetzt - aber mit einem anderen Mechanismus als geplant.** Der im Plan vorgeschlagene Weg ("die Flotte darf sich absetzen, die Anlagen kaempfen weiter") wurde gebaut und gemessen: **er wirkt nicht.** Flottenverlust eines schwachen Kontos 92,2 -> 95,5 %, Anlagenverlust 69,2 -> 82,8 %. Ursache: der Rueckzug loest bei 30 % der EIGENEN Panzerung einer Einheit aus - bei schwachem Ausbau werden kleine Schiffe in EINER Welle vernichtet und durchlaufen dieses Fenster nie; ausserdem kaempfen zurueckgezogene Schiffe in der naechsten der zwoelf Wellen wieder mit. Zwei weitere Varianten gemessen und verworfen (Rueckzug aus dem ganzen Raid 82,1 %; nachtraegliche Verlustobergrenze 73,6 %, haelt den Boden nicht - die erste Fassung belebte tote Schiffe wieder und produzierte Verlustquoten von **-28 %**). Eine Reserve haelt den Boden exakt, kostet aber entweder Kampfkraft oder verbilligt das Endspiel (13,5 -> 4,9 %). **Der Fehler lag in der Praemisse:** ein Neuling verliert eine Flotte im Wert von 0,32 Mrd und kassiert im selben Raid 20,23 Mrd Belohnung - der Totalverlust ist ein Gefuehls-, kein Wirtschaftsproblem. Was Neulinge wirklich trifft, ist `RAID_LOOT_PERCENT = 0,25` (25 % des gesamten Bestands, faellig in 93 % der Raids, weil ein schwaches Konto 11,0 von 12 Wellen gewinnt). **Nutzeridee 19.08.2026: "Neulinge bekommen zwei Wochen gar keinen Raid" - gegengerechnet und verworfen**, das Konto stuende nach 14 Tagen bei 11,2 statt 62,9 Mrd (`run_e10_schonfrist.mjs`). **Umgesetzt wurde die Umkehrung: Strafen weg, Belohnung bleibt.** `NEWCOMER_GRACE_DAYS = 14` in `economy.ts`, kein Ressourcen-Diebstahl waehrend der Schonfrist, die verteidigende Flotte wird zurueckgeschlagen statt vernichtet, Verteidigungsanlagen bewusst ungeschuetzt. Gegenmessung: Flottenverlust 0,0 % in allen Faellen; Preis ist, dass ein schwaches Konto 9,2 statt 11,0 Wellen gewinnt (die Wellen skalieren weiter mit der vollen Flotte) und fast alle Anlagen verliert - dagegen stehen 29,3 Mrd nicht gepluenderte Ressourcen in 14 Tagen. Technisch ausserdem: `allowRetreat: boolean` ist zu `retreatMode: 'all' | 'none' | 'fleetOnly'` geworden (combat.ts, combatRunner.ts, combat.worker.ts, raids.ts, groupOps.ts) - die Umbenennung ist Absicht, damit ein alter Aufruf mit `allowRetreat: false` nicht still auf den Standard zurueckfaellt; alle Messskripte mitgezogen. **Die Sperre fuer Entscheidung 16 (RapidFire) ist damit aufgehoben.** |
| 18.08.2026 | **Block C, Schritt 8 erledigt: Entscheidung 6 umgesetzt und gegengemessen (Schiffs-Tiers).** Geaendert wurde ausschliesslich `data/ships.ts`, fuenf Kostenzeilen, keine Mechanik. **Zielwert 1,15 statt 1,20**, weil die drei bereits konformen Schiffe bei 1,10/1,11/1,18 liegen. **Fuenf statt der im Plantext genannten vier Schiffe** - der Kreuzer lag mit 1,33 ebenfalls ausserhalb. Neue Kosten: Kreuzer 311/109/31 Tsd (-14 %), Bomber 398/199/120 (-34 %), Schlachtkreuzer 183/244/92 (-39 %), Zerstoerer 345/288/86 (-28 %), Reaper 370/239/87 (-28 %); Mischungsverhaeltnis je Schiff erhalten. **Alle Messungen neu erhoben** (neues Skript `run_ship_tiers.mjs`, Datei `ship_tiers.txt`), weil `ships.txt`/`ship_value.txt` von vor R14/R14b stammen - beide haben jetzt eine Trennmarke. Zusaetzlich misst `run_ship_value.mjs` das Falsche: es nimmt `avgLossPercent` aus `simulator.ts`, eine auf ganze Prozent gerundete STUECKZAHL-Quote, und multipliziert sie mit dem Flottenwert (Messregel 4 verlangt die Wert-Bilanz). **Abnahme: Korridor erfuellt** (alle acht Standardschiffe 1,10-1,18). **Duell-Matrix erfuellt**, Spannweite der mittleren Netto-Bilanz **774 -> 412 Mio (-47 %)**, Kriterium war -30 %; der Reaper steigt von -21 auf +87 Mio und ist jetzt drittbester statt drittschlechtester. **Sektor-Zelle gegenlaeufig - wichtigster Befund:** in der umkaempften Zelle (2,0x) verliert der Reaper seine Sonderstellung komplett (50 % Sieg / 39,0 % Verlust vorher, 0 % / 47,1 % nachher), weil dieselbe Kaufsumme jetzt 606 statt 439 Schiffe ergibt und die Gegnerstaerke an der MACHT haengt, nicht am ausgegebenen Wert - wer billiger einkauft, kauft sich einen staerkeren Gegner. Der wirtschaftliche Gewinn bleibt (mehr vernichtete Feindmacht je Ressource), er zeigt sich nur nicht in der Verlustquote. **Wie vorhergesagt nicht erreicht:** Jaeger bleiben in den Duellen vorn (+128/+206) - Ursache ist `SIZE_MISMATCH_EVASION_BONUS`, gehoert zu Entscheidung 16, bewusst nicht nachgebessert. **Bomber bleibt Schlusslicht** (-206 Mio), weil sein RapidFire nur gegen Verteidigungsanlagen wirkt; Rollen-Befund, kein Kostenproblem. **Salvenschiffe und Imperator gemessen, nicht geaendert** - 54,26/44,84/58,46 bzw. 6,78/5,61/7,31 mit der Achtfach-Korrektur, Imperator 250; der `ship_value.txt`-Befund zum Salvenkreuzer ist nach R14 bestaetigt und verschaerft (0 % Sieg, 100 % Verlust als reine Einzeltyp-Flotte) und bleibt ein Artefakt der Einzeltyp-Zelle. **Messregel 8 erfuellt** (keine hartkodierten Schiffskosten im Client). **Nebenwirkungen dokumentiert:** Kostenband je Waffenpunkt 68-133 -> 59-90, Verteidigungsanlagen (rund 65) dadurch relativ etwas staerker; Punktwert der verbilligten Schiffe sinkt (`getUnitPointValue()` rechnet mit der rohen Kostensumme). README-Zahlenbasis nachgezogen, dabei eine falsche Aussage dort korrigiert: Verteidigungsanlagen zaehlen sehr wohl in die Raid-Feindstaerke ein, mit Gewicht 0,3. |
| 18.08.2026 | **RapidFire nach Klassen vollstaendig gemessen und als Entscheidung 16 eingetragen - bewusst NICHT gebaut.** Ausloeser war ein Nutzerbefund beim Spielen ("die RF kommt mir falsch vor, Kaempfe kommen linear vor") - ausdruecklich NICHT dieselbe Meldung wie bei R14, RapidFire wirkt seit dem 17.08.2026 wieder. **Code-Ursache des Befunds gefunden und sie liegt nicht in der RF-Tabelle:** alle drei Wellenprofile benutzen denselben vollstaendigen Pool (`weightsForProfile()`), `kampfgruppe` sogar gleichverteilt - jede Welle enthaelt jeden Typ, damit ist in jedem Kampf jeder Konter bedient und alles mittelt sich weg. Zusaetzlich ist die heutige Tabelle eine Leiter, kein Ring (`leicht: {}` kontert nichts, Bomber und Reaper werden von keinem Standardschiff gekontert), obwohl der Code-Kommentar sie "Stein-Schere-Papier-Kette" nennt. **Gemessen wurden vier Varianten** (Nutzeridee A = Klassen-RF mit einem Ziel; B = geschaerfte Wellenprofile; C = eigene Klasse plus die darunter; E = abgesenkter Groessen-Ausweichbonus), je 40 Laeufe, gleiche Flotten-MACHT statt gleichem Wert, damit die RF-Frage nicht mit Entscheidung 6 vermischt wird. **Erste Messrunde war unbrauchbar und das ist die Lehre daraus:** bei realistischer Feindstaerke (0,85x) gewinnt jede Aufstellung zu 100 % bei 1-7 % Verlust - die Frage "zaehlt die Zusammensetzung" ist dort gar nicht messbar. Erst bei 2,0x wird sie es. **Ergebnisse:** im Ist-Zustand gewinnen Jaeger jede Zelle jeder Welle, und das Wellenprofil aendert am Ergebnis der Elite-Flotte NICHTS (47,4 / 47,5 / 47,6 % Verlust bei 0 % Sieg) - die Wahl der Flotte ist heute keine Wahl. A holt Kreuzer- und Elite-Klasse zurueck (0 % -> 75-100 % Sieg) und macht das Wellenprofil erstmals relevant. C ist schlechter als A (verschiebt das Problem auf die Kreuzer-Klasse). B liefert allein nichts und schadet der gemischten Flotte, **Nutzerentscheidung: B bleibt draussen.** Erst A+E kippt die Jaeger-Dominanz - gegen eine Elite-Welle ist die Elite-Flotte dort zum ersten Mal in der gesamten Messreihe die beste Wahl (15,8 gegen 22,0 %). **Der teuerste Befund kam aus der Gegenmessung:** im Raid faellt der Verteidigungsverlust unter A von 27,3 auf **0,0 %**, und drei Regler dagegen sind wirkungslos (Reparaturquote 0,70 -> 0,40, Verteidigungs-Gewicht 0,3 -> 0,6, eigene Belagerungs-RF gegen Anlagen, auch kombiniert, auch mit RF-Wert 3). Es ist kein eigener Defekt, sondern ein Symptom: **Klassen-RF ist ein globaler Spieler-Buff, keine Umverteilung zwischen den Klassen.** Damit braucht der Umbau zwingend einen Ausgleich ueber die Gegnerstaerke - und genau der ist gesperrt: `PIRATEN_MULTIPLIER_ROLL` beruehrt die geschlossene Einnahmen-Baseline, `RAID_WAVE_ROLL` darf nach Abschnitt 8 Punkt 7 erst nach Entscheidung 10 angefasst werden, und die Reparaturquote steht nach Abschnitt 4a bewusst unangetastet (das Bollwerk gewinnt heute NUR ueber den Verteidigungsanlagen-Verlust). **Entscheidung 6 sagt woertlich "RapidFire NICHT anheben - das wuerde die gesamte Sektor-Balance aus Session 2 mitverschieben"; genau das ist gemessen eingetreten.** Kandidat bleibt A+E, terminiert nach Entscheidung 10 und Block A. Nebenbefund: das Verteidigungs-Gewicht ist ueberhaupt kein Hebel (0,3 -> 0,6 bewegt den Raid um einen Prozentpunkt), weil die Anlagen gegenueber der Flotte zu wenig Macht stellen. Zweiter Nebenbefund: der Groessenklassen-Ausweichbonus wird im Client nirgends angezeigt - die Info-Karte meldet 12 % Ausweichchance, im Kampf gegen grosse Schiffe gelten bis zu 75 %. |
| 18.08.2026 | **Stack-Aggregation auf Nutzerfrage erneut geprueft und erneut bestaetigt - diesmal mit Zahlen.** Der Nutzer hat die Grundsatzfrage selbst wieder aufgemacht ("lieber Schiffe begrenzen und jedes einzeln simulieren, aber nicht ueber 1 Sekunde Latenz"). Gemessen mit dem vorhandenen Messbuild aus R14 (`stackAggregateThresholdFor` = 1e9, also Aggregation komplett aus), gemischte Flotte, Gegner jeweils aehnlich gross: **1.260 Schiffe 136 ms, 6.300 Schiffe 702 ms, 12.600 Schiffe 1.668 ms, 25.200 Schiffe 5.524 ms** - die Ein-Sekunden-Grenze liegt damit bei rund **8.000 eigenen Schiffen**. Mit Aggregation dagegen 29-77 ms bei denselben Flotten, und die Rechenzeit haengt weiterhin an der Typenzahl statt an der Stueckzahl (Bestaetigung des R14-Skalierungstests mit 207.000 Schiffen). **Nutzerentscheidung: Aggregation bleibt.** Begruendung diesmal nicht nur Spielgefuehl, sondern eine konkrete Zelle: am Raid-Tag treffen eigene Flotte, Verteidigungsanlagen und fremde Verstaerkung in EINEM Kampf zusammen - die 8.000 waeren dort die Obergrenze fuer die Summe aller Beteiligten, nicht fuer eine Flotte. **Nicht umgesetzt, aber als Option festgehalten:** heute ist Aggregation alles-oder-nichts pro Typ (ueber der Schwelle wird der GANZE Typ ein einziger Stapel). Eine gedeckelte Stapelgroesse - 50.000 Jaeger als 100 Stapel zu 500 statt als einer - waere der Mittelweg zwischen Genauigkeit (R15) und Rechenzeit und ist mit demselben Messbuild-Verfahren messbar. |
| 18.08.2026 | **Block B ist entschieden, aber NIRGENDS gebaut** (gefunden beim Code-Abgleich fuer Entscheidung 16, gleiche Fehlerform wie bei Block A Schritt 2). Im Code steht weder `ADMIRAL_DEFEAT_LOSS_SHARE` (4.1), noch wird `contributedPower` je Check frisch berechnet (4.2 - `groupOps.ts` setzt es einmal beim Flottenstart), noch der Faktor 1,6x samt Boss-Forschungsskalierung (4.3 - `ADMIRAL_MULTIPLIER_ROLL` steht unveraendert auf 1,10/1,30/1,50), noch die Umstellung des Boss-RapidFire auf die sechs Standardtypen (4.4 - die Zeile lautet weiterhin `piratenadmiral: { leicht: 10, schwer: 8 }`). **Wichtig fuer Entscheidung 16:** 4.4 ist selbst eine RF-Aenderung - wer die RF-Tabelle umbaut, ohne sie mitzunehmen, baut sie zweimal. |
| 18.08.2026 | **Koop-Frage zum Elite-Bollwerk gemessen und nach Entscheidung 2 verlagert** (Nutzerfrage: "Belohnung bleibt gleich, Spieler sehen keinen Zweck darin, gemeinsam zu fliegen"). Neues Skript `run_elite_coop.mjs`, Protokoll `elite_coop.txt`, 40 Serien je Zelle ueber die volle 6-Check-Expedition, Verluste in WERT statt Stueckzahl - der Vergleich "dieselbe Flotte solo gegen zu zweit" hatte in `run_elite.mjs` schlicht gefehlt, dort stehen nur Mehrspieler-Konstellationen gegeneinander und nur Einzel-Checks. **Beobachtung in beiden Teilen bestaetigt:** Belohnung je Teilnehmer identisch, Verluste zu zweit in allen vier Zellen hoeher (+0,2 / +2,7 / +1,3 / +1,9 Prozentpunkte, gleiches Vorzeichen). **Der eigentliche Befund liegt aber woanders:** unter Entscheidung 2 haengt die Beute an der vernichteten Feindmacht, und die verdoppelt sich mit dem zweiten Teilnehmer exakt (18,85 -> 38,04 Mrd, Faktor 2,02), weil die Wellenstaerke an der SUMME aller Teilnehmerflotten haengt. **Die Koop-Frage faellt damit automatisch mit Entscheidung 2** - je nach Bezugsgroesse der Kurve x1,82 (V1), x1,01 (V2) oder x0,91 (V3) je Teilnehmer; ein separater Bonus je Teilnehmer waere ueberfluessig. Der Plan sagte bisher nur, DASS die Kurve auf `groupOps.ts` wirken muss, nicht WIE bei mehreren Teilnehmern - diese Luecke ist jetzt als offener Unterpunkt bei Entscheidung 2 dokumentiert, samt zwei Bedingungen: `checkShipsAllowed()` kennt keine Mindestmenge (in V1 waere die Alibi-Flotte optimal, `contributionShares()` liegt als Gewicht bereits vor - dieselbe Frage wie Entscheidung 3, Variante 4), und saemtliche Elite-Belohnungszahlen des Plans (169,68 Mrd je Serie) sind gegen den Solo-Fall gerechnet, unter V1 waeren es bei zwei Teilnehmern rund 307 Mrd je Spieler. **Nutzerentscheidung zum Verfahren:** nicht jetzt festlegen, sondern mit Block A, Schritt 2 zusammen kalibrieren. Nebenbefund: der Grossflotten-Bonus ist der einzige heute wirksame Koop-Vorteil und greift nur bei kleinen Flotten (x1,44 -> x1,50 bzw. x1,20 -> x1,24) - gemeinsam fliegen lohnt sich also ausgerechnet dort, wo es niemand bemerkt. |
| 18.08.2026 | **Block C, Schritt 7 erledigt: Entscheidung 5 umgesetzt und gegengemessen (Piratenbasen).** Neue Datei `game/pirateBaseCombat.ts` (reiner Rechenteil, bewusst OHNE Datenbank-Bezug, damit Messskripte ihn importieren koennen), neue Konstanten in `data/economy.ts` (`PIRATE_BASE_MULTIPLIER_ROLL` [1,15/1,45/1,70-1,90], `PIRATE_BASE_DEFENSE_FACTOR` 0,16, `PIRATE_BASE_RECOVERY_MS` 20 h, `PIRATE_BASE_MAX_ATTRITION` 0,35, `PIRATE_BASE_REGEN_MS` 3 Tage, Beute-Kurve `LOOT_CURVE_*`), Seed-Konstanten aus `pirateBaseState.ts` dorthin verschoben. `LOOT_BASIS_CAP` und `PIRATE_BASE_LOOT_PERCENT` ersatzlos gestrichen. Messskript `run_pirate_base.mjs` neu geschrieben, Protokoll in `pirate_base.txt` (Abschnitte 1-6), 40 Laeufe je Zelle. **Vier Befunde, drei davon ueber diese Entscheidung hinaus.** (1) **Alle drei geplanten Kandidaten lagen UNTER dem Abnahmeband** (2,1-4,4 % Wertverlust je Angriff, aus Solo Hoch bzw. Elite je Check): A 1,0 %, B 1,6 %, C 2,0 % bei der realen Flotte. Erst der nachgezogene Kandidat D trifft mit 2,9 %. Die noetige Tabelle liegt damit NOMINAL ueber der des Elite-Bollwerks und erzeugt trotzdem weniger Verlust - Ursachen: fodder-lastiger Grundbestand statt der Wellenprofile aus `pickWaveProfile()`, kein Piratenkapitaen, keine Kampf-Modifikatoren, Einzelkampf statt sechs Checks in Folge. **Gleiche Zahl heisst hier nicht gleiche Schwierigkeit.** (2) **Der eigentliche Hebel war die Forschung, nicht die Stueckzahl:** `sideBStatsOverride` umgeht `computePirateResearch()`, die Basis kaempfte mit ihrer EIGENEN Forschung (frisch: Stufe 0), waehrend jeder Sektor-Pirat ueber `PIRATE_RESEARCH_SHARE = 1,0` den vollen Stand des Angreifers bekommt - dritte Fundstelle desselben Musters nach Entscheidung 4.3. Behoben ueber `garrisonResearch()` (elementweises Maximum). (3) **Ohne Attritions-Deckel loeschte EIN Angriff der realen Flotte die komplette Garnison** (Welle zu 100 % vernichtet = 100 % Verlustanteil auf den Bestand); die Basis waere danach rechnerisch Monate wertlos gewesen - das tote Feature waere nur um vier Angriffe verschoben worden. Erst Deckel 0,35 plus der Wiederaufbau aus 5a ergibt ein Gleichgewicht: taegliches Abfarmen pendelt sich bei 83 % Gefechtsbereitschaft und -14 % Beute ein. (4) **Der Ausbaustand schlaegt staerker durch als die Tabelle:** dieselbe kleine Flotte verliert mit voller Forschung 4,2 %, mit schwacher 56,9 % - Piratenbasen bleiben Inhalt fuer entwickelte Flotten; der Hebel dagegen waere ein Forschungsanteil unter 1,0, nicht die Tabelle. **Ertrag:** 1,60 Mrd netto je Angriff, 5,9-6,4 Mrd/Tag bei vier Basen, rund 8 % der Baseline - zwischen Solo Hoch (-3,26/Tag) und Elite (+23,4 je Serie), wie gefordert. **Messregel 8 erfuellt:** im Client gegreppt (`Galaxie.tsx`, `types/game.ts`, `Debug.tsx` angepasst - der bisherige "Machtwert" liess den falschen Schluss auf die Schwierigkeit zu) und im Server ein stiller Ausfall gefunden: `bot.ts` verglich die eigene Flotte gegen den BESTAND einer Basis mal `ATTACK_POWER_SAFETY_MARGIN`, Bots haetten nie wieder eine Basis angegriffen. **Zwei Planpunkte als veraltet bestaetigt:** die geforderte Neuberechnung von `RESOURCE_CAP` zielte ins Leere (heisst seit 12.08.2026 `LOOT_BASIS_CAP`, wirkte nur noch auf die Beute, faellt jetzt ganz weg), und der Baseline-Bezug "0,3 %" in der Begruendung rechnete noch gegen die alte 21,69 Mrd. **Offen geblieben und ausdruecklich vermerkt:** die Beute-Kurve aus Entscheidung 2 steht damit erstmals im Spielcode, aber NUR fuer die Piratenbasen - Block A, Schritt 2 (missions.ts/groupOps.ts, plus Wrack-Bergung 30 %) ist weiterhin nicht gebaut, obwohl Block A als vollstaendig gilt. |
| 18.08.2026 | **Entscheidung 4.6 und 4.7 bestaetigt und geschlossen** (Nutzerentscheidung, kein Messbedarf): Sieg-Bonus **2,0x** statt 1,5x, und die 50 % bei Niederlage gelten auf die bis zum letzten UEBERSTANDENEN Check gesicherte Beute. Damit ist von Block B nur noch 4.8 (Cooldown) offen; gebaut ist von 4.x weiterhin nichts. |
| 18.08.2026 | **Neuer offener Punkt in Abschnitt 7 (Nutzerbeobachtung): kein Anreiz, das Elite-Bollwerk gemeinsam zu fliegen.** Die Feindstaerke skaliert mit der SUMME aller Teilnehmerflotten, die Belohnung geht jedem voll zu - gemeinsames Fliegen ist damit rechnerisch neutral, plus Rendezvous-Kosten fuer den Mitflieger. Einzige gemessene Ausnahme: die Piraten erben den DURCHSCHNITT der Forschung, ungleiche Paare kaempfen deshalb leichter (elite.txt: 3,3 % gegen 0,5/1,5 %). Der eigentliche Vergleich (dieselbe Flotte solo gegen zu zweit) ist NIE gemessen worden. Vier Hebel notiert, Entscheidung bewusst nach hinten gestellt - gehoert neben Entscheidung 3, weil das Elite-Bollwerk 74 % der spaeten Einnahmen stellt. |
| 17.08.2026 | **Entscheidung 4.3 nach R14 neu bestimmt und GESCHLOSSEN: Faktor 1,6x** (plus Boss-Forschungsskalierung, Deckel 100, `ADMIRAL_STAT_SHARE` unveraendert 0,55). Gemessen mit `run_admiral_bossscale.mjs`, Modus `forschung`, Messbuild V1 aus `make_messbuild_44.mjs`, 40 Serien je Zelle, scheibenweise nach `admiral_bossscale_44.txt`. Vollstaendig im Messkasten bei 4.3. **Gemessene Zellen:** `mittel/real` 1,6x -> Tiefe 3,80 / 0,0 % Sieg / 35,0 % Verlust, `schwach/real` 1,6x -> 1,57 / 0,0 % / 52,2 %. **Ueber den Auftrag hinaus zusaetzlich erhoben, weil die Entscheidung sonst nicht belastbar gewesen waere:** zwei Vergleichszellen bei 1,5x (`mittel` 4,22 / 0,0 % / 36,3 %; `schwach` 1,63 / 0,0 % / 40,1 %) und ein zweiter unabhaengiger Lauf der Kandidatenzelle `voll/real` 1,6x (2,70 / 45,0 % / 23,1 % gegen 2,85 / 40,0 % / 23,2 % im ersten Lauf). **Vier Befunde.** (1) **Die Streuung ist jetzt bestimmt und kleiner als der Entscheidungsabstand:** rund 5 Prozentpunkte Siegquote zwischen zwei Laeufen derselben Zelle, gegen 12,5-17,5 Punkte Abstand zwischen 1,5x und 1,6x. Die Wahl ist damit nicht rauschgetrieben - das war nach den 3,63/3,83-Doppelmessungen vom 16./17.08. ausdruecklich zu pruefen. (2) **Fuer `mittel` ist der Faktor gar kein Hebel mehr:** 1,5x und 1,6x sind praktisch ununterscheidbar (beide 0 % Sieg, 36,3 gegen 35,0 % Verlust), nur die Tiefe bewegt sich - und zwar NACH UNTEN bei hoeherem Faktor (4,22 -> 3,80). Die Nicht-Monotonie aus Schritt 5 ist damit ein zweites Mal bestaetigt, diesmal innerhalb eines einzigen Profils. Was `mittel` entscheidet, ist R14, nicht 4.3. (3) **`schwach` ist der einzige Ausbaustand, den die Wahl spuerbar trifft, und zwar zum Schlechteren:** 40,1 % Verlust bei 1,5x gegen 52,2 % bei 1,6x, damit im Saettigungsband 48-55 %. Ausdruecklicher Nachteil, in Kauf genommen, weil `schwach` am 16.08.2026 bewusst abgeschrieben wurde. (4) **Die Check-Tiefe allein ist als Abnahmemass endgueltig unbrauchbar:** `mittel` liegt bei 1,6x mit 3,80 IM Zielband 3-5, ohne einen einzigen Sieg. Kuenftige Kalibrierungen an P10 muessen Tiefe UND Ausgangsverteilung gemeinsam lesen. **Entschieden wurde auf `voll`/real** - eine Setzung, keine Messung: P10 ist seit dem 16.08.2026 ausdruecklich Endspiel-Inhalt, und 1,6x trifft dort das zuvor akzeptierte Verhalten fast exakt (40,0-45,0 % Sieg gegen frueher 42,5 %, 23,1-23,2 % Verlust gegen 21,5 %). Das Zielband 3-5 wird bei `voll` von keinem Faktor mehr mit einer Siegquote erreicht - vorab akzeptiert, jetzt belegt. **Nicht angefasst:** `MAX_ROUNDS` 100, Schwelle 0,30, Entscheidung 4.4, Beute-Anker, Exponent 0,85, Baseline 0,80 / 19,82 / 76,85 Mrd. **Dokumentationsschuld beglichen:** `admiral_bossscale_44.txt` fuehrte die Nach-R14-Zeilen ohne Kennzeichnung unter der Ueberschrift der Vor-R14-Reihe, wodurch die Zelle `voll/real 1,75x` dreimal mit 37,5 / 42,5 / 0,0 % Sieg in derselben Datei stand; Trennmarke eingezogen, **keine Zahl geaendert**. |
| 17.08.2026 | **Block C, Schritt 6 erledigt: Entscheidung 13.3 umgesetzt und gegengemessen.** Neues Feld `nextEconomyTurn` auf `PirateBaseState`, neue Konstanten `PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS` (2 Min., gleich `HEARTBEAT_INTERVAL_MS`) und `PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP` (30). Neue Skripte `make_messbuild_133.mjs` und `run_base_growth_133.mjs`, Ausgabe `base_growth_133.txt`; Messbuilds mit auf 1 s heruntergesetztem Intervall nach dem Verfahren von 4.4, Quellcode unberuehrt. **Abnahmekriterium aus Entscheidung 13 erfuellt:** bei rund 11.000-facher Aufruf-Zahl ueber dasselbe Zeitfenster liefen vorher x10.514-10.895 so viele Bau-Entscheidungsschritte, nachher x0,95-1,00. **Drei Befunde, die den Plan korrigieren.** (1) **Die Begruendung in 13.3 traegt so nicht - das WACHSTUM hing schon vorher nicht an den Aufrufen** (Ausgaben x0,94 bzw. x1,00 bereits im Vorher-Stand, in beiden Kapitalstaenden). Bei einer reichen Basis binden die Bau-Slots (Warteschlangen stehen nach wenigen Zuegen auf 11/11, eingereihte Auftraege laufen 12 min bis 12 h), bei einer frischen Basis bindet der Ressourcenstand (das Geld ist nach dem ersten Zug weg). Der Satz "eine Basis waechst schneller, je oefter jemand in die Galaxie schaut" ist in dieser Form NICHT bestaetigt. Was die Aenderung traegt, ist Punkt 5b (Reproduzierbarkeit - eine Groesse, die zwischen zwei Laeufen um Faktor 10.000 schwanken kann, ist als Messgrundlage unbrauchbar) und die Rechenlast, dieselbe Familie wie die Cross-User-Sweeps vom 12.08.2026. *Grenze ausdruecklich:* 20 Sekunden zeigen keinen Effekt, der ueber Stunden entsteht; gerechnet, nicht gemessen, steht ein frei gewordener Slot bei 2 Minuten Intervall hoechstens 2 Minuten leer, also wenige Prozent. Der Langzeit-Nachweis braucht die gefaelschte Uhr aus Abschnitt 1b und bleibt offen. (2) **Ein Zeitstempel allein genuegt nicht - er muss im RASTER weitergesetzt werden.** Die erste Fassung (`nextEconomyTurn = jetzt + Intervall`, kein Nachholen) mass x1,18 statt x1,00: ein Aufruf wenige Millisekunden vor der Faelligkeit laesst den Zug ausfallen, und produktiv waere genau das der Regelfall, weil der Heartbeat denselben 2-Minuten-Takt hat. Ausgeliefert ist `+= Intervall` je faelligem Zug mit gedeckeltem Nachholen. (3) **Zweiter Fundort derselben Fehlerform, im Plan nicht erwaehnt:** `GET /api/heartbeat` laeuft bewusst ohne `requireAuth`, und weil `runBotTurn()` einmal je Heartbeat einen vollstaendigen Bau-Entscheidungsschritt jedes Bots ausfuehrt, liess sich damit das BOT-Wachstum durch wiederholte Aufrufe beliebig beschleunigen. Behoben ueber `HEARTBEAT_MIN_INTERVAL_MS` (60 s); der Endpunkt meldet innerhalb des Fensters `skipped`. *Nachteil:* ein manueller Testaufruf wirkt dort nicht mehr sofort. **Zwei Fehlversuche am Messwerkzeug, bewusst protokolliert, beide sahen wie ein Befund aus:** der erste Aufbau mass Einheiten statt Zuege ("x0,94, also kein Defekt" - gemessen wurde das Slot-Limit), und der Zaehler stand zunaechst hinter einer kompilierten `for`-Schleife OHNE geschweifte Klammern und zaehlte dadurch Ladevorgaenge statt Zuege ("x10.082, Drosselung wirkungslos"). Dieselbe Lehre wie bei der verworfenen Wirtschaftssimulation vom 12.08.2026: ein Messwerkzeug ist erst dann Beweismittel, wenn es an einem bekannten Zustand gegengeprueft wurde. **Messregel 8 erfuellt:** im Client gegreppt, ein Spiegel gefunden (`DebugPirateBaseState` in `client/src/types/game.ts` bildet `PirateBaseState` nach) - Feld dort und in der Debug-Route ergaenzt, `pages/Debug.tsx` zeigt jetzt den naechsten faelligen Bau-Zug an, damit die Drosselung im Betrieb pruefbar ist. **README nachgezogen**, dabei eine dort noch stehende veraltete Aussage korrigiert (`RESOURCE_CAP` begrenze das Ressourcen-Wachstum - der Deckel heisst seit dem 12.08.2026 `LOOT_BASIS_CAP` und wirkt nur noch auf die Beute). |
| 17.08.2026 | **R14 repariert, gegengemessen und ausgeliefert - plus R14b (Durchschlag) auf Nutzerentscheidung, plus neuer Punkt R15.** Geaendert wurde ausschliesslich `fireShotsAggregateShooters()` in `server/src/game/combat.ts`; die Aggregationsschwellen sind unberuehrt geblieben, die Aggregation selbst bleibt vollstaendig erhalten (sie war nie das Problem, nur die RapidFire-Naeherung darin). Vollstaendige Einzelheiten im Messkasten **R14 - REPARATUR** unter der Reparaturtabelle in Abschnitt 3. **Abnahmetest 1 bestanden** (`rapidfire_aggregat.txt`): aggregierte Schuetzen erreichen die Schusszahlen des Einzel-Pfads (Kreuzer 0,97 -> 2,66 gegen 2,58; Schlachtschiff 1,04 -> 3,33 gegen 3,31), `rapidFireTriggers` ueberall groesser 0 statt exakt 0. **Abnahmetest 3 bestanden** (`r14_perf.txt`, neues Skript `run_r14_perf.mjs`): 20.700 Schiffe kosten 10 statt 14 ms je Kampf, weil die Kaempfe nur noch halb so viele Runden dauern; ein Skalierungstest mit **207.000 Schiffen** landet beim praktisch selben Wert - die Rechenzeit haengt weiterhin an der Typenzahl, nicht an der Stueckzahl. **Abnahmetest 2 nur teilweise** (`r14_delta.txt`): die Rundenzahl faellt mit der Referenz zusammen, die Verlustquote nicht. Die Ursache ist diagnostiziert und liegt NICHT im Schuetzen-Pfad - eine Kontrollzelle ohne Aggregation UND ohne Explosionsmechanik reproduziert die Rundenzahl des Aggregat-Pfads exakt. Daraus **R15**: Aggregat-Stapel koennen nicht explodieren, und ein Stapel als HP-Topf rechnet jeden Schadenspunkt sofort anteilig in tote Einheiten um, waehrend einzelne Schiffe beschaedigt ueberleben und ihren Schild zwischen den Runden voll regenerieren. **R14b** war ein Fund bei der Umsetzung: Aggregat-Schuetzen bekamen hart `overkillFraction = 0`, obwohl `fireShots()` den echten `getDurchschlagFraction()` durchreicht - der Kommentar begruendete das mit dem Individual-Zweig innerhalb derselben Funktion, der selbst 0 uebergab (zirkulaer). Gemessen bewegt R14b das Ergebnis in Richtung Referenz (9,6 -> 8,7 Runden bei `piraten_mittel`), erklaert den Rest aber nicht. **Messregel 8 vorab erfuellt:** im Client gegreppt, `combatInfo.ts` liest die RF-Tabelle ueber `gameData.rapidfire` vom Server, keine zweite hartkodierte Zahl - keine Client-Aenderung noetig. **Neu erhoben, weil die Verlust-Seite sich verschiebt:** Elite-Serie praktisch unveraendert (3,2 -> 3,3 % Verlust), Raid Flottenverlust 10,1 -> 13,3 % und **Verteidigungsverlust 0,1 -> 22,5 %**, reale Flotte Solo Hoch netto +0,11 -> **-2,97 Mrd/Tag** und Elite netto 28,32 -> 21,65 Mrd (Achtung: der alte Stand hatte nur 5 Durchlaeufe, also unter Messregel 2 - ein Teil der Differenz ist Messqualitaet). **Die Zahl mit dem groessten Risiko ist gerissen:** Admiral-Zelle `voll/real` bei 1,75x, Modus `forschung`, Messbuild V1 - Tiefe 3,85 sieht weiter nach Zielband aus, aber die Siegquote faellt von 42,5 auf **0,0 %** und der Verlust steigt von 21,5 auf 36,6 %; die Serie endet jetzt IMMER am Verlustkriterium statt am Kampfausgang. Sweep dazu: 1,25x -> Tiefe 1,43 / 95 % Sieg, 1,5x -> 2,70 / 57,5 %, **1,6x -> 2,85 / 40,0 % Sieg / 23,2 % Verlust**. 1,6x kommt dem alten Verhalten bei 1,75x am naechsten und ist der Kandidat; festschreiben erst nach der vollen Serie ueber `mittel` und `schwach`. |
| 17.08.2026 | **Nutzerfund: RapidFire wirkt bei grossen Flotten praktisch nicht mehr - neu als R14.** Meldung des Nutzers beim Spielen ("RF funktioniert ausser bei Salvenschiffen und Imperator gar nicht mehr, seit sie nur noch EIN Ziel haben, die Werte springen nicht mehr"). Gemessen bestaetigt mit `probe_rapidfire.mjs`: dieselbe Flotte unter der Aggregationsschwelle feuert 2,24 bis 4,03 Schuesse je Einheit und Runde, darueber nur noch 0,97 bis 1,13 - **ein Schuss je Einheit heisst, RapidFire findet nicht statt.** Da die Schwellen bei 100 (Kreuzer-Klasse) und 50 (Elite-Klasse) liegen, laeuft jede echte Spielerflotte ueber den Aggregat-Pfad. **Drei Ursachen in `fireShotsAggregateShooters()`:** die Folgeschuss-Kette wird ueber `rfEligibleShare` mit dem Anteil des Konterziels an ALLEN Zielen verduennt (im Einzel-Pfad genuegt dessen blosse Anwesenheit) - **hier schlaegt die RF-Neuordnung vom 04.08.2026 durch, weil ein einzelnes RF-Ziel den Anteil auf rund ein Sechstel druckt**; die gewonnenen Schuesse werden proportional zur Stueckzahl verteilt statt auf das Konterziel gelenkt; und `rapidFireTriggers` wird dort nie hochgezaehlt, weshalb der Kampfbericht 0 zeigt. **Einordnung:** stiller Defekt nach dem Massstab aus Abschnitt 8, keine Balance-Frage - die Aggregation ist eine Performance-Optimierung und darf das Kampfergebnis nicht veraendern. Zweiter Fall derselben Fehlerform im selben Codepfad nach Entscheidung 1 (Overkill-Deckel). **Folgen ausdruecklich genannt:** die Reparatur beruehrt beide Seiten (NPC-Flotten sind ebenfalls aggregiert, `NPC_RF_VS_JAEGER_FACTOR = 0,5` wirkt nur auf der NPC-Seite) - welche Seite netto gewinnt, ist offen und muss gemessen werden; und sie verschiebt voraussichtlich die Kampfzahlen aus Block A und B, die alle gegen eine Engine ohne wirksames RapidFire gelaufen sind. Aussage 32 der Code-Doku ("RapidFire ist das entscheidende Gegenmittel gegen Jaegerschwaerme") gilt nur im Einzel-Pfad, also praktisch nie. **Empfohlene Reihenfolge:** R14 vor weiteren KAMPF-Messungen; Block C (13.3) ist nicht betroffen und kann davor laufen. |
| 17.08.2026 | **Block B, Schritt 5 geschlossen: Entscheidung 4.4 gemessen und entschieden, Faktor aus 4.3 gegengemessen und bestaetigt. Block B ist damit vollstaendig.** Neu: `run_aggregate_threshold_44.mjs` (Mischflotte), `make_messbuild_44.mjs` (Messbuilds V1/V2/V3/V2b nach dem Verfahren von M3), `probe_admiral_shots.mjs`; Ausgaben in `aggregate_threshold_44.txt` und `admiral_bossscale_44.txt`. 40 Laeufe je Zelle, Quellcode unberuehrt. **Entschieden: RapidFire des Bosses auf die sechs Standardtypen aus `ADMIRAL_ALLOWED_SHIP_IDS` umstellen, die Mehrfachziel-Salve VERWERFEN.** **Fuenf Befunde, die den Plan korrigieren.** (1) **Der Vorschlag in 4.4 bestand aus zwei Wirkpfaden, von denen einer im Plan gar nicht sichtbar war und der andere ohne eine dritte, nirgends erwaehnte Aenderung wirkungslos geblieben waere.** Die Mehrfachziel-Salve haengt an `getZielerfassungAccuracy()`, die ohne `ZIELERFASSUNG_BASE`-Eintrag **0** liefert - `piratenadmiral` hat keinen. Der Eintrag in `MULTI_TARGET_VOLLEY_SHIPS` allein waere toter Code gewesen. Gemessen feuert der Boss heute **exakt einen Schuss je Runde** (RF-Ziele nicht erreichbar, also kein einziger Folgeschuss), mit umgestelltem RapidFire 5,3 und mit Salve 39-47,5. (2) **Die Salve ist mit keinem Gegnerstaerke-Faktor kalibrierbar:** die Check-Tiefe bleibt von 0,1x bis 1,75x konstant bei 1,00, und zwischen 0,5x und 0,75x kippt der Ausgang von 100 % Sieg auf 92,5 % Niederlage. Der Kampf ist nach zwei Runden entschieden - die Zieltiefe 3-5 ist damit grundsaetzlich unerreichbar. Dieselbe Alles-oder-Nichts-Eigenschaft wie bei `ADMIRAL_STAT_SHARE`. (3) **Die Faehigkeit ist strukturell anti-klein statt anti-Masse.** Overkill-Deckel (fuenf Einheiten je Treffer) und `MAX_SHOTS_PER_UNIT` (50) setzen eine ABSOLUTE Obergrenze an Abschuessen je Runde; ihr Anteil faellt mit wachsender Flotte. Gemessen 100 % Verlust bei 405 Schiffen gegen 16,5 % bei 4.500. Der Code-Kommentar ("bestraft Masse an kleinen Schiffen ganz natuerlich") beschreibt damit das Gegenteil des tatsaechlichen Verhaltens. (4) **Der Faktor aus 4.3 bleibt bei 1,75x** - die im Uebergabe-Text erwartete Absenkung ist nicht eingetreten: `voll`/real misst sich mit 4.4 auf Tiefe 3,63/3,83 bei 42,5/37,5 % Sieg gegen 3,98 bei 40 % ohne, also innerhalb der Streuung zweier Laeufe derselben Zelle. Nachteil: die Extraktionsquote faellt von 12,5 auf 0-2,5 %. Offene Luecke geschlossen: `schwach`/real bei 1,75x mit 4.4 ergibt Tiefe 1,52 (ohne: 1,68). (5) **Befund am Messwerkzeug:** `run_aggregate_threshold.mjs` stellt dem Boss eine Flotte aus EINEM Typ gegenueber und kann eine Mehrfachziel-Faehigkeit deshalb prinzipiell nicht messen (V1/V2/V3/V2b liegen dort auf die Nachkommastelle gleich); ab der 4.4-Mechanik sind seine Zellen zusaetzlich saturiert. **Nebenbefund zu einer bestehenden Messdatei:** `run_admiral_roundcap.mjs` rechnet mit `metall + kristall + 2 x deuterium`, `TRADE_VALUE` im Code ist `1 / 1,5 / 3`. Die Messflotte kommt dadurch auf 21,57 statt 26,72 Mrd; die Spalte "netto Verlust" in `admiral_roundcap.txt` ist um rund 19 % zu niedrig. Die Deckel-Aussage bleibt gueltig (innerhalb der Datei dieselbe Formel), aber die dortige Zelle Deckel 100 / 1,75x ist nicht direkt mit `admiral_bossscale.txt` vergleichbar - die Differenz Tiefe 3,63 gegen 3,98 ist Streuung, kein Formelfehler. **Methodische Lehre:** eine Faehigkeit, die aus mehreren Bedingungen besteht, muss VOR der Messung im Code auf alle Bedingungen geprueft werden; hier haette die im Plan beschriebene Aenderung zur Haelfte gar nicht gewirkt und waere als "gemessen und harmlos" ins Protokoll gegangen. |
| 16.08.2026 | **`MAX_ROUNDS` bleibt bei 100 - Nutzerentscheidung, letzter Blocker von 4.3 damit weg.** Die Messung hatte gezeigt, dass der Rundendeckel heute balance-relevant ist und ungleich wirkt (bei `voll` steigt die Siegquote von 47,5 auf 87,5 %, wenn er auf 1000 geht, bei `mittel` bewegt er nichts), und eine Anhebung auf 300 waere ohne Nebenwirkung auf die Baseline moeglich gewesen (kein anderer Sektor kommt dem Deckel nahe, Elite-Bollwerk im Schnitt 35 Runden). **Der Nutzer hat sich bewusst dagegen entschieden:** OGame-basierte Spiele begrenzen ueblicherweise auf 6-8 Runden, 100 ist im Vergleich sehr grosszuegig. Damit ist der Deckel kein Artefakt und kein Sicherheitsnetz, sondern eine Gestaltungsentscheidung - wer den Boss nicht im Gefechtsfenster kleinbekommt, bekommt ihn nicht. Zweiter Grund: 300 Runden verdreifachen die Rechenzeit je P10-Kampf, was die (normalen, erwarteten) CPU-Spitzen im Worker-Thread entsprechend verlaengert haette. **Folge: 4.3 steht auf Faktor 1,75x plus Forschungsskalierung des Bosses**, `voll` erreicht damit Check-Tiefe 3,63-3,98 bei 40-47 % Sieg, 35-48 % Abbruch und 12-18 % Extraktion. |
| 16.08.2026 | **Block B, Schritt 5 gemessen: Entscheidung 4.3 bis 4.8.** Drei neue Skripte (`run_admiral_strength.mjs`/`admiral_strength.txt`, `run_admiral_bossscale.mjs`/`admiral_bossscale.txt`, `run_admiral_roundcap.mjs`/`admiral_roundcap.txt`) plus die Ertragsrechnung `run_admiral_economics.mjs`/`admiral_economics.txt`; 40 Serien je Zelle, Faktorschritte von hoechstens 0,5x, volle Serie statt nur Check 1. **Vier Befunde, die den Plan korrigieren.** (1) **Ein einzelner Gegnerstaerke-Faktor kann die Zieltiefe 3-5 nicht treffen.** Ueber die volle Serie liegt das brauchbare Fenster bei `voll` zwischen 2,5x und 3,5x, bei `mittel` zwischen 1,5x und 2,0x, `schwach` verliert schon bei 1,0x - die Fenster ueberlappen nicht. Die Check-Tiefe ist dabei **nicht monoton**: mehr Gegnerstaerke macht die Serie kuerzer, weil bereits Check 1 die 30-%-Schwelle reisst. Abschnitt G von `admiral_defeat.txt` konnte das nicht zeigen, weil er nur Check 1 misst. (2) **Der fehlende Hebel ist die Forschungsskalierung des Bosses** - bisher als Randnotiz unter "Ausserdem" gefuehrt. `sideBStatsOverride` umgeht `getEffectiveStats()`: die Eskorte bekommt ueber `PIRATE_RESEARCH_SHARE = 1,0` den vollen Forschungsstand, der Boss nicht. Mit Skalierung schrumpft die Spanne zwischen den Ausbaustaenden von rund 4:1 auf rund 1,5:1, und ein Faktor von 1,75x (Deckel 100) bzw. 2,0x (Deckel 300) trifft die Zieltiefe mit einer echten Mischung der Ausgaenge. (3) **`MAX_ROUNDS = 100` ist heute eine balance-relevante Konstante und wirkt ungleich** - bei `voll` steigt die Siegquote von 47,5 % auf 87,5 %, wenn der Deckel von 100 auf 1000 angehoben wird, bei `mittel` bewegt er praktisch nichts. Ein gegen Deckel 100 kalibrierter Faktor ist gegen ein Artefakt kalibriert; der Deckel gehoert vor 4.3 entschieden. Gemessen ueber Messbuilds mit ersetzter kompilierter Konstante, Quellcode unberuehrt. (4) **4.5 entfaellt: ein freier K widerspricht Entscheidung 2.** Deren Geltungsbereich schliesst `groupOps.ts` ein, P10 laeuft dort - ein linearer `ADMIRAL_LOOT_PER_DESTROYED_POWER` waere die einzige ungedaempft mit der Flottengroesse wachsende Einnahme im Spiel. Mit der Beute-Kurve gerechnet: die vernichtete Feindmacht vervierfacht sich (22,6 -> 110 Mrd), die Beute steigt nur um Faktor 3,4, der Verlust dagegen linear - je haerter der Boss, desto schlechter das Geschaeft, fuer `mittel` und `schwach` sogar negativ. Der Break-even-Befund aus Schritt 4 ist damit gegenstandslos, die Risikopraemie muss vollstaendig ueber 4.6 kommen (Vorschlag: 2,0x statt 1,5x). **Nebenbefunde:** die "3,8 h Hinflug" in 4.8 sind keine Konstante, sondern `galaxyDurationMs()` am langsamsten Schiff - in beiden Messflotten der Imperator (speed 100), Ergebnis 0,08 bis 0,82 h je nach Distanz und damit 9 bis 21 moegliche Durchlaeufe/Tag; das Kampffenster sind 6 x 10 min = 1 h, nicht die 4 h aus `PIRATEN_CHECK_INTERVAL_MS`. Ohne jeden Cooldown liegt P10 mit der Beute-Kurve bei 12 Mrd/Tag statt der frueher gerechneten 134 - der Cooldown bleibt richtig, ist aber eine Geschmacksentscheidung und keine Notbremse mehr. **Methodische Lehre:** eine Orientierungsmessung an einem einzelnen Check darf nicht als Rahmen fuer eine Serien-Entscheidung verwendet werden; sie hat hier einen Kippbereich von 2x-4x ausgewiesen, wo der tatsaechliche bei 1,25x-2x liegt. |
| 15.08.2026 | **Block B, Schritt 4 geschlossen: Entscheidung 4.1 (Verlust-Kriterium) und 4.2 (contributedPower-Freeze) zusammen.** Neues Skript `run_admiral_defeat.mjs`/`admiral_defeat.txt`; `run_admiral_rebalance.mjs`/`admiral_rebalance.txt` umgebaut auf alle vier Ausbau-Profile, kumuliertes Verlustkriterium und frische Machtberechnung. 40 Durchlaeufe je Zelle, Schwellen nachtraeglich auf denselben Ziehungen ausgewertet (Methode aus `run_loot_exponent.mjs`). **Entschieden: Verlustmass ist der kumulierte WERT-Anteil gegen die entsandte Flotte, `ADMIRAL_DEFEAT_LOSS_SHARE = 0,30` statt der vorgeschlagenen 0,45; `contributedPower` wird je Check frisch aus der ueberlebenden Flotte berechnet.** **Vier Befunde, die den Plan korrigieren.** (1) **Die Diagnose zu 4.1 war ueberholt:** `result.retreated` ist nicht in 77-100 % der Kaempfe gesetzt, sondern in **0,0 %** bei `voll`/`voll_noboost`/`mittel` und 0-5 % bei `schwach`. Ursache ist der Overkill-Deckel vom 10.08.2026, der den Verlust je Check auf 0,3-1,1 % drueckt; unterhalb von 21 % zerstoerter Flotte setzt der gestaffelte Rueckzug gar nicht ein. Alle drei Admiral-Messdateien stammten vom 08.08.2026 und damit von vor dem Deckel und vor der Klassen-Neuaustarierung. (2) **Check 2 wird weiterhin nie erreicht, aber aus dem umgekehrten Grund:** der Boss stirbt in Check 1 mit 100 % Wahrscheinlichkeit bei 0,3-1,1 % Flottenverlust. **4.1 und 4.2 aendern daran nichts** - keine Schwelle zwischen 0,30 und 0,60 und kein Modus bewegt eine einzige Zelle der drei realistischen Profile. Die Ziel-Check-Tiefe 3-5 ist ueber diesen Schritt nicht erreichbar. (3) **4.3 hat das Vorzeichen gewechselt:** ein hoeherer `ADMIRAL_STAT_SHARE` macht den Gegner SCHWAECHER (reale Flotte, `voll`: 0,43 Mrd Verlust bei 0,25 gegen 0,00 Mrd bei 0,90), weil der Overkill-Deckel den einen grossen Schuss kappt, waehrend dieselbe Macht auf Eskortschiffe verteilt viele ungedeckelte Schuesse ergibt. Auch 0,25 endet zu 100 % mit Sieg in Check 1 - die Konstante ist als Hebel unbrauchbar geworden. Orientierungsmessung ergaenzt: der brauchbare Bereich liegt zwischen dem **Zwei- und dem Vierfachen** der heutigen Gegnerstaerke, und dazwischen kippt es abrupt von 3 % auf 28-47 % Verlust - dieselbe Alles-oder-Nichts-Eigenschaft wie bei der Raid-Wellenstaerke. (4) **Die Zahlen in 4.5 und 4.8 sind gegen die neuen Rohwerte gestellt:** vernichtete Feindmacht rund 22 Mrd je Durchlauf, Netto-Verlust 0,05-0,15 Mrd, Break-even-K damit 0,0023-0,0099 - der vorgeschlagene K = 0,5 liegt um Faktor 50 bis 200 darueber. Zwoelf Durchlaeufe/Tag waeren bei K = 0,5 **134 Mrd/Tag**, also das 1,7-fache aller uebrigen Einnahmen im spaeten Ausbaustand (76,85) und das 2,4-fache des Elite-Bollwerks. **Methodische Lehre:** die Schwelle wird erst NACH einem vollstaendigen Check geprueft und deshalb systematisch um 7-9 Prozentpunkte ueberschossen - eine Abbruchschwelle ist nicht der Verlust, den man bekommt. |
| 15.08.2026 | **Niveau-Punkt geschlossen, BLOCK A damit vollstaendig.** Neue Messung `run_income_level.mjs`/`income_level.txt` (40 Durchlaeufe je Zelle). Kernbefund: die Einnahmen liegen bei **216/321/220 Prozent des gesamten Flottenwerts pro Tag** - die Flotte ist keine Ressourcen-Senke, sondern Verbrauchsmaterial, und das Band 3-10 Tage ist fuer "+10 % Flottenwert" nur mit einem Kostenfaktor von 65-220 oder einem Zeitfaktor von 15-411 erreichbar. **Entschieden: Kennzahl umstellen** (Band gilt fuer den naechsten Leiter-Schritt auf der Ressourcen-Seite und fuer eine Flotten-Verdopplung auf der Zeit-Seite), **Einnahmen-Niveau unveraendert lassen**, **Engpass vollstaendig ueber Entscheidung 9** aus 1 Lane (Faktor 3) + additiven Reduktionen fuer Schiffe (Faktor 1-3, nach Ausbaustand gestaffelt) + Basis-Bauzeiten x2. Vollstaendig im neuen Messkasten am Kopf von Entscheidung 9. **Drei Korrekturen an bestehendem Text:** (1) Der Zielwert "Bau-Ausstoss grob in Hoehe der Tageseinnahmen" in Entscheidung 9 ist gestrichen - er widerspricht der Rangentscheidung vom 14.08.2026 direkt, denn ein bandtreffender Ausstoss liegt bei 3-6 gegen 77 Mrd/Tag. (2) Der Anwendungsbereich in 9.1c ("Schiffe: Untergrenze genuegt") ist ueberholt; eine Untergrenze deckelt den Reduktions-Stapel, staffelt ihn aber nicht nach Ausbaustand - genau das ist hier noetig. (3) Die Aussage in Abschnitt 7, "Zeit ist bereits heute der Engpass", ist gemessen falsch: mit 3 Lanes ist die Bauzeit-Seite der Kennzahl **kuerzer** als die Ressourcen-Seite (12 min bis 1,6 h gegen 45 min bis 1,1 h). Erst 1 Lane kippt das. **Defekt in einem Messskript gefunden:** `run_loot_exponent.mjs` uebergab in zwei Auswertungen `true` als Raid-Szenario; das wird zu 1 verrechnet und bedeutete still "Raid unveraendert" statt Variante 6 - die Tabelle "Grosse feste Ausbauziele" fiel dadurch um rund ein Drittel zu niedrig aus (Schiffs-Module mittel 5,44 statt 7,16 Tage). Behoben; `loot_exponent.txt` ist an diesen zwei Tabellen bis zum naechsten Vollauf ueberholt, die Exponenten-Entscheidung selbst ist nicht betroffen. **Zwei Nebenbefunde:** das Elite-Bollwerk stellt 74 % der Einnahmen im spaeten Stand (neuer Punkt in Abschnitt 7), und Abnahmekriterium 5 ist im fruehen Stand heute verletzt (passive Quellen 89 %). |
| 15.08.2026 | **Beute-Exponent mit korrigiertem Raid-Wert nachgerechnet - 0,85 bestaetigt, deutlicher als zuvor.** `run_loot_exponent.mjs` umgebaut: statt eines festen Werts je verteidigtem Raid bildet es jetzt die beschlossene Variante 6 ab (Beitragsanteile aus `raid_support.txt`, Saettigung ueber die Tagessumme), die drei alten Hypothesen bleiben als Empfindlichkeitspruefung. Ergebnis: Abweichung vom flachen Verlauf **3 % bei 0,85** gegen 13/7/18 % bei den Nachbarwerten - zuvor waren es 14 % als kleinste groesste Abweichung. Ursache: der Raid war die grosse flotten-unabhaengige Einnahme, die den spaeten Stand nach oben zog; mit Variante 6 richtet sich die Kurve von selbst aus. **Raid-Entscheidung und Beute-Exponent stuetzen sich gegenseitig.** Die alte Tabelle in Abschnitt 8 Punkt 1 ist zahlenmaessig ueberholt (mit korrigiertem Raid: 1,19/1,02/0,86, groesste Abweichung 19 %), die Entscheidung war aber nie gefaehrdet. Nebenbefund: der Anker streut ueber drei Laeufe zwischen 0,0939 und 0,0956, also rund 2 % - er ist auf zwei Nachkommastellen belastbar, nicht auf vier. Der Geltungsbereich-Befund verschaerft sich: "nur Solo" ergibt unter Variante 6 ein Verhaeltnis von 0,35 statt 0,97, die Beute-Kurve MUSS auf `groupOps.ts` wirken. Das Zielband 3-10 Tage bleibt unerreicht (1,1-1,2 Stunden) - das ist der Niveau-Punkt in Abschnitt 7. |
| 15.08.2026 | **Raid-Paket (Block A, Schritt 3) vollstaendig entschieden - alle vier zusammenhaengenden Punkte geschlossen.** Zwei neue Messskripte: `run_raid_yield.mjs`/`raid_yield.txt` (Ertragsmodell ueber die Kontenzahl, reine Arithmetik) und `run_raid_support.mjs`/`raid_support.txt` (Mehrspieler-Raid mit Beitragsanteilen, Gewichtungs-Sweep und Schnappschuss-Vergleich). **(a) Ertrag: Variante 6** - Variante 4 plus Saettigung ueber die Tagessumme, 7,56 Mrd/Tag und 33 % Anteil. **(b) Schwierigkeit: `RAID_ALLY_POWER_WEIGHT = 1,0`.** **(c) Beitrags-Massstab: unveraendert, Normierungs-Ansatz verworfen.** **(d) Wirtschaftsklassen: kein Handlungsbedarf.** **Vier Befunde, die den bisherigen Plan korrigieren:** (1) Die Zahlen im Kasten bei Entscheidung 3 (14,51 Mrd je Raid, 4,15 Mrd/Tag, 1.800 DM) sind zu NIEDRIG - sie zaehlen nur die Container-Kategorie "Ressourcen" mit dem rohen `chance`-Wert statt `realChance`, ohne Teile, Zeitgutscheine, Freischiffe und Jackpot; aus dem Code sind es 22,07 Mrd und 2.080 DM. Die 6,31 aus der Baseline waren nie falsch, sie zaehlen nur EINEN Raid. Real sind es 3,4 (zwei Spieler mit Chance 1,0, zwei Bots mit 0,7), also 21,4 Mrd/Tag und 58 % Anteil. (2) **Variante 4 allein loest die Skalierung nicht** - gemessen holt der grosse Spieler im Raid eines Bots 71,5 % des Topfes, weil die Wellenstaerke am schwachen Verteidiger haengt; Summe 2,41 Aequivalente statt der erwarteten Flachheit. Die Empfehlung im Kasten war insoweit falsch. (3) Der Loesungsansatz zum Beitrags-Massstab aus Abschnitt 2a Punkt 14 ist **schaedlich, nicht nur wirkungslos**: der absorbierte Anteil liegt im Raid bei 0,0-0,6 % statt 1,6 %, und die Normierung gaebe ihm die halbe Stimme (ein Bot mit 2,2 % ausgeteiltem Schaden kaeme auf 14,2 %). (4) Der **Schnappschuss der ersten Welle ist wirkungslos** (0,6 % gegen 0,5 %) und wirkt nur bei schwachen Konten - als Hebel fuer Verlierbarkeit ungeeignet. **Neu erkannter Zielkorridor:** 7-10 Mrd/Tag, nicht "so niedrig wie moeglich" - unter 7 Mrd ueberschreitet stattdessen das Elite-Bollwerk die 50-Prozent-Marke. **Einzige gesetzte Zahl des Pakets:** die Saettigungsgrenze `S_MAX = 1,5`. **Methodische Lehre:** die falschen Container-Werte entstanden, weil eine Zahl aus einer Beschreibung des Datenmodells gerechnet wurde statt aus dem Modell selbst - dieselbe Fehlerform wie Messregel 16, nur eine Ebene tiefer. Container-Erwartungswerte werden deshalb im neuen Skript aus `CONTAINER_TYPES` inklusive `realChance` und Jackpot berechnet, nicht gesetzt. |
| 09.08.2026 | Erstfassung. 11 Entscheidungen, 11 Reparaturen, Reihenfolge in 5 Bloecken, 13 Messregeln. |
| 09.08.2026 | Abschnitt 1a ergaenzt (Server-Reset als Rahmenbedingung), Entscheidung 12 (Frischling-Bonus) neu, Block F (Startphase) neu. Entscheidung 10 auf blockierend hochgestuft. Begruendung fuer Feindstaerke-Variante (b) ersetzt - die urspruengliche ("entwertet bestehende Investitionen") ist durch den Reset hinfaellig. |
| 14.08.2026 | **Rangentscheidung zum Engpass: ZEIT ist der Haupt-Engpass, Ressourcen ein spuerbarer Neben-Engpass** (Nutzervorgabe auf direkte Nachfrage, ausgeloest durch den neuen Niveau-Punkt in Abschnitt 7). Damit ist dieser Punkt entschieden statt offen: Weg (c) mit einem Rest von (b), Weg (a) - den gerade erst gemessenen Beute-Anker wieder absenken - ist vom Tisch. **Folge fuer die Reihenfolge:** Entscheidung 9 (Block D, Schritt 14) ist damit nicht mehr eine Entscheidung unter vielen, sondern der Traeger des gesamten Spielgefuehls; was dort zu schwach kalibriert wird, faengt keine andere Stellschraube auf. Die Messlage stuetzt die Vorgabe: der Bauzeit-Multiplikator im Profil "voll" liegt bei 8,062e-8 fuer Gebaeude (praktisch augenblicklich) und 6,683e-2 fuer Schiffe, waehrend drei Bau-Lanes 36 bis 130 Mrd Wert/Tag ausstossen - Zeit bremst im Endspiel heute nur noch bei den teuersten Schiffen, sonst gar nicht. **Ausdruecklich als Widerspruch protokolliert und in Block D mitzuentscheiden:** Sind Ressourcen nie knapp, kostet ein verlorener Kampf nur Wiederaufbau-Zeit - das steht gegen die Geschmacksvorgabe "Verluste spuerbar". Entweder wird der Verlust bewusst als Zeitverlust definiert, oder die Ressourcen muessen genau an dieser Stelle doch beissen. |
| 14.08.2026 | **Entscheidung 1 (Beute-Exponent) geschlossen - der Exponent bleibt bei 0,85**, jetzt gemessen statt gesetzt. Neues Skript `run_loot_exponent.mjs` + `loot_exponent.txt`, 40 Durchlaeufe je Zelle, drei Ausbaustaende (0,37 / 6,18 / 34,99 Mrd Flottenwert). Der Exponent wurde NICHT in den Spielcode eingebaut - die Beute beeinflusst den Kampfverlauf innerhalb einer Mission nicht, deshalb genuegt ein Messlauf je Stand, auf den alle vier Exponenten nachtraeglich aufgerechnet werden. **Drei Befunde, die ueber die eigentliche Frage hinausgehen.** (1) **Das Zielband 3-10 Tage ist von keinem Exponenten erreichbar, auch nicht vom heutigen Zustand** - gemessen 0,5 bis 3 Stunden bis zum naechsten Ausbauschritt, eine Verdopplung der gesamten Flotte kostet 7 bis 12 Stunden Einnahmen. Der Exponent kippt nur die Neigung der Kurve, das Niveau steckt im Anker. Als neuer, hoch priorisierter Punkt in Abschnitt 7 eingetragen, samt der Beobachtung, dass die grossen EINMALIGEN Ziele (Schiffs-Module 8,5 Tage, Heimatbasis V1 11,9 Tage beim mittleren Stand) sehr wohl im Band liegen - das Band stimmt fuer die feste Inhaltsliste und verfehlt nur das dauerhafte Flottenwachstum. (2) **Der Geltungsbereich musste mitentschieden werden.** Wirkt die Kurve nur auf Solo-Sektoren wie in Entscheidung 2 beschrieben, liegt das Verhaeltnis der Tagesrendite spaet/frueh bei 0,23 bis 0,50 und ist mit KEINEM Exponenten im Suchraum reparierbar - das Elite-Bollwerk als groesste Einzelquelle bliebe eine feste, nicht mitwachsende Belohnung. `groupOps.ts` gehoert deshalb zwingend dazu. (3) **Die Beute-Kurve ist entgegen der Planerwartung keine Bremse, sondern eine Umverteilung von klein nach gross**: kleine Flotte -88 % Missionsbelohnung, reale Flotte +410 %, Elite-Serie +420 %. Ursache ist, dass die heutige Belohnung eine feste Container-Menge je gewonnenem Check ist. Fuer die Startphase nach dem Reset als eigener Punkt in Abschnitt 7 vermerkt. **Methodisch:** Die Entscheidung faellt allein ueber das Verlaufskriterium, gemessen ueber drei Raid-Annahmen (unveraendert / halbiert / entfaellt), weil der Raid noch offen ist und alles dominiert; 0,85 hat mit 14 % die kleinste groesste Abweichung von einem flachen Verlauf, 0,90 folgt mit 19 %. **Ein Modellfehler wurde waehrend der Messung gefunden und behoben:** der Raid war zunaechst mit den 6,31 Mrd/Tag aus der Baseline in Abschnitt 1 angesetzt, obwohl die Korrektur vom 11.08.2026 auf 4,15 Mrd/Tag JE verteidigtem Raid lautet - mit dem falschen Wert lag der flache Punkt bei 0,90 statt 0,85. Genau die Fehlerform aus Messregel 16, diesmal in einer Planzahl statt in der README. **Nebenbefund:** verteidigt schon der fruehe Ausbaustand einen Raid, faellt das Verhaeltnis auf 0,16 bis 0,31 und keine Beute-Kurve haelt dagegen - eine unabhaengige Bestaetigung des Abschnitt-7-Punkts, dass der Raid die dringendste offene Groesse ist. |
| 14.08.2026 | **Block A, Schritt 1 erledigt: die drei Messreihen nach dem Overkill-Deckel neu gelaufen** (`elite.txt`, `raid.txt`, `real_fleet.txt` ersetzt). **Wirkung deutlich groesser als erwartet, und einseitig verteilt.** Reale Flotte, Solo Hoch, Profil voll: Verluste 1,65 -> 1,04 Mrd, Netto **-0,55 -> +0,11 Mrd** - das Vorzeichen des als "totes Inhalt" gefuehrten Solo-Bereichs ist gedreht. Raid-Verteidigung profitiert ebenfalls stark: ohne Kampf-Boost 21,7 -> 14,6 % Verlust, Profil mittel 20,1 -> 17,5 %, kleine Flotte 14,6 -> 10,1 %. Elite-Bollwerk dagegen **praktisch unveraendert** (3,0 -> 3,2 %, innerhalb der Streuung). Erklaerung: Der Deckel wirkt dort, wo grosse Einzelschlaege auf kleine Einheiten treffen - also gegen die NPC-Seite mit ihren Kapitalschiffen und Verteidigungsanlagen; beim Elite-Bollwerk stehen sich zwei grosse Flotten gegenueber, wo er kaum greift. **Folge fuer Entscheidung 1: die Einnahmen-Baseline muss auf den neuen Zahlen aufsetzen** (Elite-Serie 28,32 statt 27,87 Mrd bei Profil voll), und der Abstand Solo gegen Elite ist die Groesse, an der sich der Beute-Exponent messen lassen muss - nicht mehr das Vorzeichen. Ausserdem geschlossen: **Entscheidung 3 (Imperator-Einstufung)** - 0,040 Schaden je Wert-Einheit gegen ein Band von 0,087-0,439, also unter dem Band, aber mit belegter Alleinstellung (einziges Schiff mit RapidFire gegen Ionengeschuetz/Gausskanone/Plasmawerfer). Beschluss: Grind senken statt Kampfwerte anheben, Umsetzung in Block D. **Nebenbefund mit groesserer Tragweite: die drei Salven-Schiffe liegen mit 1,410-2,240 weit UEBER dem Band** - der Salvenkreuzer beim Fuenffachen des besten Standardschiffs. Als offener Punkt in Abschnitt 7 aufgenommen. |
| 14.08.2026 | **Messauftrag Imperator (Abschnitt 4) geschlossen** - neues Skript `run_imperator.mjs` + `imperator.txt`. Anlass: Nutzerbeobachtung aus echten Kampfberichten, der Imperator teile zu wenig Schaden aus; Vorschlag war `maxCount` 12-18 oder Waffen verdoppeln bei gesenkter Panzerung. **Ergebnis: Praemisse widerlegt.** 6 Imperatoren stellen in einer 6.300-Schiffe-Flotte 34,0 % des Gesamtschadens, bei 12 Stueck 50,0 %. Die Berichtsspalte "Schaden ausgeteilt" summiert je Schiffstyp und misst damit Klassengroesse statt Nutzen pro Schiff - fuer stueckzahlbegrenzte Einheiten grundsaetzlich kein Balance-Indikator (Fall von Messregel 15). **Der Nutzervorschlag Waffen x2 / Panzerung halbiert ist messbar die schlechteste Variante**, schlechter als nichts zu tun: Schuesse 232 -> 70, Schaden 111 -> 54 Mio, Gegner behaelt mehr Einheiten - Ueberlebenszeit und Schadensausstoss sind in einem Attritions-System nicht unabhaengig. Der Trefferwert-Befund (12,6 % gegen Leichte Jaeger) ist richtig, aber NICHT imperator-spezifisch: Reaper 13,4 %, Salvendreadnought 14,0 % - dominant ist der Groessen-Fehlpaarung-Bonus 0,45 auf die ganze Klasse "gross", nicht der Praezisionsmalus (-1,4 Prozentpunkte). Kampfwerte bleiben unveraendert, Prestige-Einstufung ist damit belegt statt vorlaeufig. **Neu offen und ausdruecklich NICHT entschieden: `speed: 100`** - ein einziger mitgenommener Imperator verzwoelffacht die Flugzeit der gesamten Flotte, wodurch die staerkste Einheit des Spiels faktisch auf Heimatverteidigung beschraenkt ist. Nebenbei korrigiert: Abschnitt 4 nannte 2.520.000 Panzerung, der Code sagt 3.000.000/500.000/400.000 (Messregel 16). |
| 10.08.2026 | **Abgleich des Plans gegen den aktuellen Repo-Stand** (Nutzerhinweis: die Performance-Zahl stamme vermutlich aus der Zeit vor der Aggregat-Engine - zutreffend). Ursache: eine im Chat hochgeladene README-Fassung mit 33 nummerierten Punkten wurde als aktuell behandelt; die Fassung im Repo hat ueber 750 Zeilen, ist in Abschnitte gegliedert und enthaelt keine Nummerierung. **Vier Korrekturen:** (1) Der Performance-Messpunkt in Abschnitt 7 ist gestrichen - die Messung existiert laengst und lautet 1,5 Mio. Schiffe bei ~26 ms statt 700 ms bei 2.600 Einheiten, ein Unterschied von mehr als Faktor 100; `MAX_PLAYER_SHIPS = 200.000` ist damit unbedenklich. (2) Die Raid-Mechanik in Abnahmekriterium 4 korrigiert: keine taeglichen Checkpoints mit 60 %, sondern woechentlich Mittwoch/Sonntag mit `RAID_SPAWN_CHANCE = 0,7` bzw. 1,0 fuer namentlich hinterlegte Spieler; `FIXED_CHECK_HOURS_UTC` existiert nicht mehr. (3) `POOL_SIZE` ist 1, nicht 2 - Kaempfe laufen serialisiert, was das Argument gegen Bot-Ertragsweg (a) eher staerkt. (4) Zeitschritt-Begruendung in Abschnitt 1b praezisiert (Asteroiden stuendlich, Piraten 4 h, Missionen einheitlich 24 h). **Gegengeprueft und korrekt:** die Slot-Zahlen (3/3/4/1), die Missionsdauern, die Raid-Belohnungen 10/6/2 und die Frequenz 2x/Woche in Entscheidung 3 - der Plan selbst war also am aktuellen Code geschrieben, nur die in diesem Chat ergaenzten Stellen nicht. Neu: **Messregel 16**. |
| 11.08.2026 | **Raid-Ertrag skaliert mit der Zahl der Accounts - Entscheidung 3 steht auf zu niedrigen Zahlen** (Nutzerhinweis: rund 10.000 DM an einem Raid-Tag, weil er eigenen Raid, den seiner Frau und die beiden Bot-Raids verteidigt). Im Code bestaetigt: `finalizeRaidWaves()` ruft `grantContainers()` fuer den Verteidiger UND jeden Halter auf, jeder bekommt die volle Menge - korrekt nach Punkt 5 der README, aber diese Regel stammt aus dem Kontext gemeinsamer Expeditionen, wo alle EINE Mission zusammen fliegen. Bei Raids sind es N getrennte Ereignisse, jedes voll verguetet, und die Belohnung haengt nicht am Beitrag. Nachgerechnet: ein eigener Raid gibt 1.800 DM und 14,51 Mrd Ressourcenwert, vier verteidigte Raids 7.200 DM und 58,02 Mrd pro Raid-Tag = **16,58 Mrd/Tag gegen die im Plan gefuehrten 6,31 Mrd/Tag** (Faktor 2,6; DM Faktor 3,5). Der Raid ist damit **rund 52 % aller Einnahmen und verletzt Abnahmekriterium 5 bereits im Ist-Zustand**; die geplante Halbierung auf 5/3/1 landet bei 8,29 Mrd/Tag und damit immer noch ueber dem bisher angenommenen Ist-Wert. **Kern des Problems ist nicht die Hoehe, sondern die Skalierung** - der Ertrag waechst mit jedem neuen Spieler und jedem neuen Bot. Vier Loesungsvarianten im Kasten bei Entscheidung 3 dokumentiert. **Variante 4 stammt vom Nutzer:** fester Topf pro Raid, aufgeteilt nach tatsaechlichem Beitrag - technisch bereits moeglich, weil `combat.ts` `dmgDealt` und `dmgTakenA` schon besitzer-bewusst fuehrt. Zwei Bedingungen dabei zwingend: der Topf muss FEST pro Raid sein (sonst bleibt die Skalierung bestehen - Schadensmessung loest Fairness, nicht Hoehe), und der Beitrag muss Schaden GEMACHT plus ABSORBIERT zaehlen, sonst waere das Bollwerk mit Waffen x1 ausgerechnet auf seinem Heimatfeld der schlechtest bezahlte Teilnehmer. Empfehlung: Variante 4, hilfsweise Variante 2. **Bewusst NICHT vorgezogen umgesetzt** - anders als die Reparaturen der Vortage ist das kein stiller Defekt, sondern eine bewusste Design-Entscheidung mit unerwarteter Nebenwirkung, und die Korrektur veraendert die Einnahmen-Baseline, an der Block A haengt. |
| 12.08.2026 | **Entscheidung 15 neu aufgenommen: Waffen/Schild/Panzerung unbegrenzt forschbar** (Nutzeridee). Anlass: alle Forschungen stehen auf Stufe 10, damit sind Zeit-Gutscheine wertlos und ueber Forschung keine Punkte mehr erzielbar. **Die Begruendung des Nutzers war halb richtig:** die Feindstaerke skaliert NICHT mit Forschung (`combatFleetPowerBase()` rechnet auf Rohwerten), wohl aber bekommen Piraten ueber `PIRATE_RESEARCH_SHARE = 1.0` den vollen Forschungsstand auf ihre eigenen Einheiten. Netto also relativ neutral - aber weil Forschung gegen Piraten ohnehin kaum Vorteil bringt, nicht weil sie sauber gegengerechnet wird. Kosten-/Zeitkurve geprueft: bei `timeGrowth` 1,6 liegt Stufe 15 bei 360 Tagen und Stufe 20 bei 10,4 Jahren Forschungszeit - begrenzt wird also ueber ZEIT statt Ressourcen, genau die Groesse, auf die Zeit-Gutscheine wirken. Die drei vom Nutzer genannten Forschungen sind zudem die einzigen mit unbegrenztem Multiplikator; die vier Kampfwert-Forschungen haben eigene Kappungen und wuerden oberhalb von Stufe 10 nichts mehr bewirken. **Drei Bruchstellen dokumentiert**, darunter eine selbstverschuldete: die tags zuvor ausgelieferte Bot-Ruecklage wuerde ohne Deckel unbegrenzt zuruecklegen und die Bots komplett lahmlegen. **Bewusst nicht sofort umgesetzt** - die Ruecklage ist noch unbeobachtet, zwei ineinandergreifende Aenderungen an derselben Stelle gleichzeitig sind genau das Muster, vor dem Abschnitt 5 warnt. |
| 12.08.2026 | **Herkunft der Wirtschaftsklassen-Werte geprueft** (Nutzerfrage, ob die niedrigen Werte einen Grund hatten). Ergebnis: **nein, es gibt keine dokumentierte Begruendung** - `economyClasses.ts` erklaert nur die Wirkung, nicht die Hoehe, und das Wertemuster besteht aus lauter glatten Zahlen. Anders als bei den Kampf-Klassen, wo immerhin ein (falsches) Budget-Prinzip im Code stand. Fuer Block A festgehalten: an diesen Werten ist nichts zu respektieren. **Wichtiger als die Hoehe ist die Bezugsgroesse** - ein Bonus auf eine Nebenquelle braucht eine viel groessere Prozentzahl als einer, der ueberall greift; die Klassen sind deshalb in Anteil an den GESAMTEINNAHMEN zu bewerten, nicht als Prozentwert auf ihrer eigenen Basis. Als Regel in Abschnitt 4b ergaenzt, mit Verweis auf denselben Fehler bei der Allianz-Station zwei Tage zuvor. Nutzer wollte die Werte zunaechst sofort anpassen; bewusst vertagt, weil alle drei Klassen an Groessen haengen, die Block A veraendert (Schmuggler am Raid-Ertrag, Ingenieur an Entscheidung 9, Prospektor an der Einnahmen-Baseline) - eine Kalibrierung jetzt muesste danach wiederholt werden. |
| 12.08.2026 | **Wirtschaftsklassen erstmals verglichen** (Nutzerbeobachtung: "nur der Prospektor macht Sinn"). Neuer Abschnitt 4b. **Die Einschaetzung ist widerlegt - der Prospektor ist die schwaechste der drei.** Gemessen am echten Ausbaustand: Schmuggler +0,92 Mrd Werteinheiten/Tag, Prospektor +0,22, Ingenieur +17,6 % Bauleistung. Der Prospektor liefert damit 1 bis 3 % der Gesamteinnahmen, sein DM-Bonus ist wertlos solange DM nicht knapp ist, und auf die Allianz-Station wirkt sein Mining-Bonus gar nicht. **Wichtiger als die Rangfolge ist die Kopplung:** der Schmuggler-Wert stammt fast vollstaendig aus dem Deuterium der Raid-Container (2,14 Mrd je Raid gegen 82,9 Mio/Tag aus der Mine - Faktor 29), das mangels Verwendung laufend getauscht wird. Wird der Raid-Ertrag nach Entscheidung 3 korrigiert, bricht der Schmuggler mit ein. Als gegenseitiger Verweis in beiden Abschnitten eingetragen. **Eigene Fehlaussage korrigiert:** aus den rund 50 Mrd unverbauten Werteinheiten hatte ich auf einen Zeitengpass geschlossen und daraus den Ingenieur als beste Wahl abgeleitet - auf Rueckfrage ist das bewusstes Sparen, kein Ueberschuss. Die Frage Zeit gegen Ressourcen bleibt damit offen und faellt mit Entscheidung 9 zusammen. |
| 13.08.2026 | **Schwaeche des eigenen Beitrags-Massstabs erkannt** (Nutzerrueckfrage direkt nach der Umsetzung: ob es jetzt Sinn ergibt, Bollwerk zu spielen und Schaden zu fangen, damit andere schiessen koennen). **Die Idee ist schluessig, geht mit der gebauten Rechnung aber nicht auf.** Im realen Kampfbericht stehen 35,34 Mrd ausgeteiltem Schaden nur 0,58 Mrd gegnerischer Schaden gegenueber - der absorbierbare Anteil betraegt also **1,6 %** der Summe. Wer saemtlichen Beschuss auf sich zoege und selbst nicht schoesse, bekaeme 1,6 % der Punkte; Tanken lohnt sich damit nicht. Die Begruendung an `contributionShares()` ist als Prinzip richtig, in der Umsetzung aber weitgehend wirkungslos - **beim Bauen zu optimistisch eingeschaetzt**, weil die blosse Addition voraussetzt, dass beide Zahlen in derselben Groessenordnung liegen. Loesungsansatz dokumentiert (jede Kategorie an ihrer eigenen Summe normieren, dann mitteln - ein reiner Tank kaeme auf 50 % statt 1,6 %), **bewusst NICHT umgesetzt**: es waere eine Design-Entscheidung (Austeilen und Einstecken gleichwertig?) und beruehrt drei Stellen gleichzeitig - den Massstab, die Belohnungsaufteilung aus Variante 4 und die Klassenbalance. Nutzerentscheidung: erst besprechen. |
| 13.08.2026 | **Abschuss-Punkte nach Beitrag statt voll je Teilnehmer** (Abschnitt 2a, Punkt 14). Ausgangsfrage des Nutzers: warum liegt seine Frau in der Bestenliste vorn, obwohl er mehr Schaden austeilt? **Erste Klaerung: Schaden fliesst gar nicht in die Punkte ein** - sie bestehen aus Ressourcenausgaben plus vernichteten Gegnern, bei diesem Spieler zu rund 95 % aus Abschuessen. Der eigentliche Befund lag daneben: bei Gruppen-Expeditionen und Raids mit Verstaerkung bekam JEDER Beteiligte die volle Abschussliste, waehrend ein Solo-Spieler nur seine eigenen Abschuesse erhaelt. Nutzerargument "wenn ich alleine fliege, bekomme ich ja auch nur meine Punkte" - traegt auch rechnerisch, weil die NPC-Staerke einer Gruppen-Expedition mit der gesamten eingesetzten Flottenmacht skaliert. Umgesetzt mit Schaden ausgeteilt UND absorbiert als Beitragsmass; nur den ausgeteilten zu werten haette ausgerechnet das Bollwerk auf seinem Heimatfeld bestraft. Gerechnet an den echten Berichtszahlen: 80,4 % / 18,9 % / 0,7 % statt dreimal 100 %. **Fallstrick beim Bauen:** `playerResults` wird schrittweise befuellt, eine zu frueh berechnete Aufteilung haette dem Verteidiger alles und allen anderen nichts gegeben - Berechnung und Speichern muessten ans Ende verschoben werden. **Belohnungen bewusst NICHT mit umgestellt** (gehoert zu Variante 4 in Entscheidung 3), Punkte sind damit vorerst beitragsbasiert, Beute noch nicht. |
| 13.08.2026 | **Raid-Schwierigkeit als zweite Haelfte des Raid-Problems aufgenommen** (Nutzerbeobachtung aus dem Livebetrieb: rund 2 % Verlust, keine einzige Verteidigungsanlage). Im Code bestaetigt: `resolveOneWave()` berechnet die Gegnerstaerke ausschliesslich aus Flotte und Verteidigung des VERTEIDIGERS; Verstaerker- und Halte-Flotten gehen in den Kampf ein, aber nicht in die Bemessung. **Kein Fehler, sondern eine bewusste Entscheidung vom Juli 2026** ("sonst wuerde Unterstuetzung den Raid selbst verschaerfen, dann braeuchte man nicht unterstuetzen"). **Die Begruendung haelt der Rechnung jedoch nicht stand:** bei voller Mitzaehlung bliebe das Kraefteverhaeltnis wie im Alleingang, die Verluste verteilten sich aber auf mehrere Flotten - Unterstuetzung lohnt sich also weiterhin durch geteiltes Risiko. Das Argument verwechselt Verlust-Anteil mit Verlust-Menge. Zusammen mit der bereits dokumentierten Ertragsseite (jeder Teilnehmer erhaelt die volle Container-Menge) ergibt das den Befund "nahezu kein Risiko bei vervielfachter Beute". Als **Variante 5** in den Raid-Kasten aufgenommen: ein Gewichtungsfaktor `RAID_ALLY_POWER_WEIGHT` statt der heutigen Null-oder-Eins-Frage, Vorschlag 0,5. **Bewusst NICHT isoliert umgesetzt** - die Schwierigkeit anzuheben, waehrend die Belohnung weiter vervierfacht wird, verschiebt nur das Verhaeltnis, ohne die Ursache zu treffen. |
| 13.08.2026 | **KI-Flotten: zwei Nutzer-Funde behoben** (Abschnitt 2a, Punkt 13). (a) Bots bauten ausschliesslich Leichte Jaeger, weil starr 5 Stueck bestellt wurden - fuenf Reaper kosten 4,80 Mio, fuenf Leichte Jaeger 0,60 Mio, also kam zuverlaessig nur der guenstigste Typ durch und die im Kommentar beschriebene Durchmischung war wirkungslos. Die Piratenbasen bauten nur deshalb quer, weil sie dank ihres damaligen 44-Mio-Deckels reicher waren. **Die Ruecklage vom Vortag hatte das verschaerft** - eine Nebenwirkung, die dort nicht bedacht war. Behoben durch flexible Stueckzahl (1 bis 5). (b) Die bei Spielern stationierten Verteidigungsflotten waren eingefroren: je 5 Leichte Jaeger standen ueber eine Woche unveraendert da, waehrend die Bot-Flotte auf 1.200 Schiffe wuchs - der Sollwert von 15 % stammte aus einer Zeit mit 33 Schiffen. Behoben durch Nachlegen gegen die Gesamtflotte; auf Rueckkopplung gegengerechnet, der Bestand pendelt sich nach einem Nachlegen stabil bei 15 % ein. Das Zurueckziehen bleibt bewusst aus - dauerhaft vor Ort zu bleiben ist der Zweck. Zusaetzlich ein Mobil-Fehler behoben: in Raid-Berichten liess sich die Einheiten-Tabelle nicht seitlich wischen, weil der Wellen-Rahmen `overflow:hidden` trug und die 720px breite Tabelle abschnitt, bevor das Modal scrollen konnte. |
| 12.08.2026 | **Ursache der langsamen ticks gefunden und behoben** (Details in Abschnitt 2a, Punkt 12). Die tags zuvor eingebaute Gesamt-Aufschluesselung lieferte sofort: von rund 580 ms Gesamtdauer entfielen 481-549 ms auf die Cross-User-Sweeps, waehrend `runEconomyTick` - die eigene Wirtschaft des betroffenen Nutzers - bei **1 ms** lag. **Die zwei Tage alte Vermutung "zu viele Verteidigungsanlagen bei KI-Nyx" war damit falsch** und haette beinahe zu einer Optimierung am voellig falschen Ende gefuehrt. Der eigentliche Multiplikator: `tick()` laeuft bei jedem `GET /game/state`-Poll, also alle 3 Sekunden pro geoeffnetem Client - bei zwei Fenstern rund 40 vollstaendige Durchlaeufe pro Minute mit Laden und Parsen fremder Spielstaende von 435 bis 655 KB. Ein Teil davon war zudem von Anfang an redundant: der Heartbeat ruft `processAllDepartedGroupOperations()` bereits einmal global auf, mit dem Kommentar "ein Durchlauf pro Nutzer waere unnoetig". Behoben durch Drosselung auf 30 Sekunden statt Entfernung, damit der Sicherheitsnetz-Charakter erhalten bleibt. **Lehre: die Aufschluesselung haette von Anfang an eingebaut gehoert** - stattdessen wurde zwei Tage lang auf eine unbelegte Vermutung hin diskutiert. **Offen geblieben:** 435 KB laut Datenbank gegen 761 KB im Speicher fuer denselben Spielstand, Ursache ungeklaert. |
| 12.08.2026 | **Versteckte Ausbaugrenze der Piratenbasen aufgehoben** (vom Nutzer entdeckt, direkt im Anschluss an die Sparfallen-Behebung - "wie sollen die dann jemals weiter ausbauen, wenn die Kosten den Deckel uebersteigen?"). Der `RESOURCE_CAP` war als Beute-Kalibrierung gesetzt, begrenzte als Nebenwirkung aber den Ausbau hart: Metallmine 22, Kristallmine 20, Nanitenfabrik 6, Hyperraumantrieb sogar eine Stufe unter dem regulaeren Forschungsmaximum. Entkoppelt - die Konstante heisst jetzt `LOOT_BASIS_CAP` und wirkt nur noch auf die Beute; geprueft ueber Bestaende bis 2 Mrd, die Beute bleibt konstant bei 15,4M/7M/2,1M. **Damit entfaellt die einzige Bremse fuer das Wachstum einer Basis**, als Messpunkt in Abschnitt 7 eingetragen. Gleichzeitig eine Gesamt-Aufschluesselung im `tick()` nachgeruestet (`SLOW_TICK_TOTAL_MS` 500 ms), weil die Ursache der langsamen Nyx-Ticks bis heute UNGEKLAERT ist - keine Einzelphase riss die 1000-ms-Schwelle, die Zeit verteilte sich, und die Vermutung "zu viele Verteidigungsanlagen" wurde nie belegt. Ohne diese Klaerung laesst sich nicht sagen, ob unbegrenztes Wachstum tragbar ist. |
| 12.08.2026 | **Sparfalle bei Bots und Piratenbasen behoben** (Details in Abschnitt 2a, Punkt 9). Aufgedeckt ueber eine CPU-Spitze in Coolify, verfolgt ueber Heartbeat-Warnungen bis in die Datenbank des laufenden Servers. Befund: beide Bots sind 13 Tage alt, stehen bei Minenstufe 11 (Menschen: 36) und hatten LEERE Gebaeude- und Forschungs-Warteschlangen - seit 13 Tagen kein einziger Ausbau. Ursache ist der Fallback "billigstes, ein Stueck", der jeden Zug das letzte Metall abraeumt; nachgerechnet reicht die Metallproduktion nie fuer den naechsten Minenschritt, weil alle drei Takte ein Lasergeschuetz gekauft wird. Behoben durch eine Ruecklage fuer den naechsten Gebaeude-/Forschungsschritt. **Methodisch wichtig:** eine eigens gebaute Wirtschaftssimulation zeigte KEINEN Unterschied und wurde als unbrauchbar verworfen - sie liess den Bot auf 2,5 Billionen Metall wachsen, drei Groessenordnungen ueber der Realitaet. Belegt wurde ausschliesslich ueber den realen Datenbankzustand und die Kosten-/Produktionsformeln. Beinahe waere die Aenderung auf Basis einer falschen Simulation verworfen und zuvor auf Basis einer unbelegten Vermutung ausgeliefert worden. **Offen:** die Aenderung wirkt auch auf Piratenbasen (beobachtet: 20.112 Leichte Lasergeschuetze bei Startbestand 1.120) und verschiebt damit deren Schwierigkeit - als Messpunkt in Abschnitt 7 eingetragen. |
| 11.08.2026 | **Klassen: situative Aufschlaege statt reiner Zahlen-Angleichung** (zweiter Schritt desselben Tages, Details in Abschnitt 4a). Nach der Angleichung lagen alle drei Klassen ueberall gleichauf - damit gab es keinen inhaltlichen Grund mehr, eine bestimmte zu waehlen. Die Nutzeridee, die Boni komplett zu gaten (Kanonier nur Angriff, Bollwerk nur Verteidigung), wurde durchgerechnet und **verworfen**: Angriffe sind rund fuenfmal haeufiger als Raids, der Kommandant waere als einzige ungegatete Klasse um 36 % besser gewesen und zwei von drei Klassen die Haelfte der Zeit wirkungslos. Umgesetzt stattdessen: Grundbonus ueberall plus Aufschlag auf dem Heimatfeld (Kanonier Waffen x2,0 -> x2,4 ausserhalb der Heimatverteidigung; Bollwerk Schild/Panzerung x1,6 -> x2,4 bei Heimatverteidigung; Kommandant x1,4 flach). Neues Feld `homeDefense` in `CombatWorkerRequest`, nur aus `raids.ts` gesetzt und bewusst NICHT an `allowRetreat: false` gekoppelt, obwohl heute deckungsgleich. Der Verstaerker-Fall funktioniert ohne Zusatzarbeit, weil `OwnedFleetContribution` bereits eine eigene `playerClass` traegt. Endstand: Wochenbilanz 69,1 / 65,2 / 70,7, jede Klasse auf ihrem Heimatfeld klar vorn. Die Restspanne von ~8 % wird bewusst nicht weiter justiert - sie liegt innerhalb der Messstreuung und der Unsicherheit der Wochen-Annahme. |
| 11.08.2026 | **Klassen angepasst: Bollwerk x1,5 -> x2,0, Kommandant x4/3 -> x1,5** (Nutzerentscheidung gegen meine Empfehlung abzuwarten - mit dem Argument, zwei von drei Klassen seien sonst totes Inventar; das Argument war richtig). **Meine Begruendung fuers Abwarten war zusaetzlich sachlich falsch:** ich hatte behauptet, eine Feindstaerke-Korrektur in Block D wuerde den Kanonier-Vorsprung von selbst schrumpfen lassen. Nachgerechnet ist das Gegenteil richtig - Waffen machen nur 1,6 % der Roh-Machtbasis aus, Schild und Panzerung 98,4 %; eine solche Korrektur haette die Machtbasis des Kanoniers um 1,6 %, die des Bollwerks aber um 49,2 % angehoben und das Bollwerk damit noch weiter zurueckgeworfen. **Der Nebenbefund ist wichtiger als der Klassen-Punkt selbst und als eigener Messpunkt in Abschnitt 7 eingetragen:** die Gegner-Skalierung haengt fast ausschliesslich an Schild/Panzerung, Waffen zu bauen ist ihr gegenueber nahezu kostenlos - beruehrt Entscheidung 6 direkt. Die neuen Werte sind hergeleitet, nicht gefittet (ein Punkt Schaden ist etwa doppelt so viel wert wie ein Punkt Robustheit, Budget daher schadens-aequivalent statt nominal), und durch einen unabhaengigen Sweep bestaetigt: Gleichstand liegt bei genau 2,0. Nach der Anpassung liegen alle drei Klassen innerhalb der Streuung gleichauf, mit weiterhin klar unterschiedlichen Profilen (Kanonier 19 Runden und 100 % Siegquote im Elite-Bollwerk, Bollwerk 45 Runden und 95 %, dafuer geringste Raid-Schwankung). **Client-Spiegel vorab geprueft und gefunden:** `lib/combatInfo.ts` trug die Multiplikatoren an zwei Stellen hartkodiert - die Bau-Karten haetten weiter +50 % Schild angezeigt, waehrend der Kampf mit +100 % rechnet. Laeuft jetzt ueber `/game/data`. |
| 11.08.2026 | **Klassen-Balance erstmals gemessen** (Nutzerfrage, ob an den Klassen etwas anzupassen ist). Neuer Abschnitt 4a, neues Messskript `balance/session2-simulation/run_classes.mjs` samt `classes.txt`. Der Plan enthielt zu den SPIELER-Klassen bis dahin keinen einzigen Vergleich - nur Punkt 13.2 zu den Bots und die Kanonier-Zeile in der Feindstaerke-Tabelle. **Befund: der Kanonier ist in jeder gemessenen Situation die beste Wahl**, offensiv (3,6 % Verlust gegen 6,1 % beim Bollwerk im Elite-Bollwerk) wie defensiv (29,0 % gegen 39,4 % Flottenverlust beim Raid). Erwartet war eine Umkehr bei der Heimatverteidigung, weil dort der Rueckzug abgeschaltet ist und das Bollwerk eine eigene Reparatur-Sonderregel hat - sie tritt nicht ein. Mechanismus: der Kanonier beendet Kaempfe in der halben Rundenzahl und kassiert entsprechend weniger Rueckfeuer; in einem Abnutzungssystem ist Schaden strukturell mehr wert als Robustheit. **Damit ist die Design-Absicht in `classes.ts` widerlegt**, die alle drei Klassen mit einem gleichen Budget von 100 Prozentpunkten begruendet. Bewusst KEINE Aenderung vorgenommen: die Klassen-Multiplikatoren wirken auf dieselben Kampfwerte, die Entscheidung 1 und 19 ohnehin neu bewerten, und der Kanonier-Vorsprung haengt teilweise an der Feindstaerke-Rechnung, die Block D anfasst. Als Messpunkt in Abschnitt 7 eingetragen. **Methodischer Nebenbefund, teuer gelernt:** die erste Raid-Messung lief mit 4 Durchlaeufen und ergab das GEGENTEIL (Bollwerk 9 Prozentpunkte VOR dem Kanonier); bei 30 Durchlaeufen kippte das Vorzeichen. Die Streuung eines einzelnen Raids ist groesser als der gesamte Klassenunterschied - fuer Raid-Messungen sind mindestens 30 Durchlaeufe Pflicht, das Skript erzwingt das jetzt und gibt die min-max-Spanne mit aus. |
| 11.08.2026 | **Aufraeum-Paket R2/R4/R7/R11/R13** (Nutzerentscheidung, Details in Abschnitt 2a, Punkt 7). Auswahlkriterium: kein Punkt darf eine Balance-Entscheidung verlangen, die ohne die neue Baseline nicht zu treffen ist - R3, R5, R8 und R9 sind deshalb NICHT dabei. **Zwei Befunde weichen von der Planbeschreibung ab.** (1) R4: der Plan sagte, der Simulator rechne fuer Mittel anders als das Spiel - falsch, beide nutzen 0,12; der abweichende Wert 0,10 stand in einem unerreichbaren `groupOps.ts`-Zweig. Dafuer gab es einen **vierten Fundort, den der Plan nicht kannte und der als einziger LIVE falsch war**: `client/src/pages/Sektor.tsx` zeigte Spielern 10 % statt 12 % fuer Mittel und pauschal 15 % fuer das Elite-Bollwerk statt 18 %. Gefunden, weil diesmal VOR dem Paketieren im Client gegreppt wurde - Messregel 8 entsprechend um diesen Fundort ergaenzt und um den Hinweis, dass die Liste der Spiegel nicht vollstaendig ist. (2) R13 ist mit einer Ratschen-Obergrenze (`state.shipLimitCeiling`) abgesichert, weil die strengere Zaehlung sonst rueckwirkend aussperren wuerde; der 25-%-Zuschlag ist ausdruecklich ein pragmatischer Puffer, kein hergeleiteter Wert. **Zusaetzlich `MAX_PLAYER_SHIPS` von 200.000 auf 1.000.000 angehoben.** Nutzervorschlag war, es ganz zu entfernen; die technische Begruendung (Engine schafft 1,5 Mio. bei ~26 ms) wurde gegengeprueft und stimmt - die Schleifen ueber Einzelstuecke laufen nur unterhalb der Aggregationsschwelle. Bewusst trotzdem eine Grenze behalten, weil das Limit derzeit als Ersatz-Bremsklotz gegen Weglauf-Wachstum wirkt: seit dem Overkill-Deckel verlieren grosse Flotten anteilig immer weniger, und die eigentlich dafuer vorgesehene Bremse (Entscheidung 2, Beute-Kurve) ist noch nicht gebaut. Als Messpunkt fuer nach Block D in Abschnitt 7 eingetragen. R2 nur teilweise erledigt: tote Eintraege entfernt, die Frage nach einer Sieg-Serien-Belohnung fuer Solo-Sektoren bleibt eine Balance-Entscheidung fuer Block D. `run_sectors.mjs` komplett neu gelaufen: alle 32 Zellen im Rahmen der Streuung unveraendert, wie erwartet. |
| 10.08.2026 | **Entscheidung 1 (Overkill-Deckel) und R6 vorgezogen umgesetzt** (Nutzerentscheidung, Details in Abschnitt 2a, Punkte 5 und 6). Entscheidung 1 war der beste Vorzieh-Kandidat des ganzen Plans, weil die Aggregations-Schwelle eine reine Performance-Optimierung ist, die das Kampfergebnis nicht veraendern darf - ein Defekt, keine Balance-Frage - und weil sie ohnehin Schritt 1 der Reihenfolge ist, also nichts praejudiziert. Gemessen: die Klippe bei 101 Kreuzern faellt von 100 % auf 35,3 % Verlust, die Kurve ueber die Schwelle ist stetig, der Individual-Pfad unveraendert. **Die in Entscheidung 1 genannte Befuerchtung "Sektoren werden dadurch zu leicht" hat sich NICHT bestaetigt** - alle 32 Zellen von `run_sectors.mjs` praktisch unveraendert, weil in normalen Sektorkaempfen kein Schuetze einen Waffenwert von 574 Einheiten-HP hat. R6 gemessen: 0,994x statt 1,429x Punkte aus demselben Kreislauf. **Neuer Nebenbefund fuer Block D:** `getDurchschlagFraction()` liefert bei Forschung 10 den Wert 1,0, also Weitergabe ohne jede Daempfung - und da die NPC-Forschung aus der des Spielers abgeleitet wird, macht das die Gegner ebenso toedlicher (im Individual-Pfad schon vor dieser Aenderung). Vor der Kalibrierung von Entscheidung 19 anzusehen. **Client-Spiegel diesmal vorab geprueft** (Lehre vom selben Tag): fuer die Kampf-Aenderung existiert keiner, fuer R6 ebenfalls nicht - der Schrotthaendler zeigt aber jetzt einen Hinweis auf den Punkte-Abzug, damit Spieler nicht ohne erkennbaren Grund sinkende Punkte sehen. |
| 10.08.2026 | **Nachtrag zur Code-Aenderung desselben Tages: die Client-Spiegel fehlten.** Nutzermeldung "an der Allianz-Station hat sich nichts geaendert" - zutreffend, und zwar aus dem im Plan mehrfach beschriebenen Grund. Der Server rechnete den Kompensationsfaktor bereits, aber `pages/Allianz.tsx` enthaelt eine vollstaendige eigene Kopie von `stationMineOutputPerHour()` und zeigte weiter den alten Wert (15,70 Mio/h real gegen 5,23 Mio/h angezeigt, V1-Metallmine Stufe 30). Bei V1-Minen war die Anzeige sogar identisch zum Vorzustand, weil 7.1 nur die V2/V3-`baseOutput` betrifft. Zweiter betroffener Spiegel: `lib/multipliers.ts` mit derselben V1-only-Tabelle `BUILDING_SELF_BUILDTIME_MODULE`. Behoben, wobei die Konstante jetzt ueber `/game/data` ausgeliefert wird statt im Client hartkodiert - eine Quelle statt zweier Werte, die auseinanderlaufen koennen. **Messregel 8 entsprechend verschaerft**: `Allianz.tsx` war bisher nirgends als Spiegel gefuehrt, obwohl sie die komplette Stations-Wirtschaft nachbaut, und der verbindliche Ablauf lautet jetzt "erst im Client greppen, dann den Server aendern". Der Vorfall ist der dritte dokumentierte Fall derselben Fehlerform (README Punkt 1, R1, jetzt hier). |
| 10.08.2026 | **Erste Code-Aenderung des Projekts seit Planbeginn** (Nutzerentscheidung, ausgeloest durch zwei eigene Beobachtungen beim Spielen). Vollstaendig dokumentiert im neuen **Abschnitt 2a**. Kurz: Entscheidung 14 erledigt, aber mit bewusster Abweichung vom beschlossenen Weg - NICHT auf den Stations-Generator umgestellt, weil der die 15 bestehenden V1-Module mit neu bewertet haette (Metallmine-Modul von 2,0/1,0/0,5 Mio auf 1,5/0,6/0 Mio, inklusive eines auf null fallenden Deuterium-Anteils); stattdessen V2/V3 aus dem unveraenderten V1 abgeleitet, `BUILDING_MODULES` jetzt 45 statt 15. Gemessen: V2/V3 bauen jetzt exakt so schnell wie V1 (vorher Faktor 4 langsamer), Foerdereffizienz wirkt auf allen drei Stufen. **Der in Entscheidung 14 angekuendigte Faktor 4 ist damit eingetreten und Ausgangszustand fuer 9.1, nicht mehr eine kommende Aenderung.** Ausserdem Entscheidung 7.1 erledigt (Stations-Ertrag V2/V3 auf 2x/4x) und R12 erledigt (`game/moduleIntegrity.ts`, Startpruefung fuer zur Laufzeit gebildete Modul-IDs). **Ein Befund war NEU und stand in keiner Session:** `stationMineOutputPerHour()` wendet den Mining-Multiplikator nicht an - die Entkopplung der Station von der Forschung einzelner Mitglieder ist beabsichtigt und richtig, wurde aber nie ausgeglichen, wodurch die Station bei gleicher Gebaeudestufe ein Sechstel der Heimatbasis produzierte. Neue Konstante `STATION_MINING_COMPENSATION = 3` (nur der dauerhafte Forschungsanteil 2,0 x 1,5, bewusst nicht die vollen 6,12 inkl. Klasse und Booster). Der resultierende Vollausbau-Ertrag betraegt 7,90 Mrd/Tag. **Noch am selben Tag nach Nutzerhinweis korrigiert:** dieser Wert war zunaechst direkt gegen die Baseline von 21,69 Mrd/Tag gestellt und daraus ein Widerspruch zu Entscheidung 3 abgeleitet worden (passive Quelle oberhalb des Raids). Die Baseline ist aber ein **Pro-Spieler-Wert**, waehrend die Station ein gemeinsamer Topf ist, aus dem beide Mitglieder entnehmen - pro Kopf sind es rund 3,95 Mrd/Tag bzw. 18,2 %, also unter dem Raid und knapp im Zielband. Der Einwand faellt damit weitgehend weg; bestehen bleibt nur die ART der Quelle (voellig passiv), nicht ihre Groesse. Entscheidungsregel zur Nachkalibrierung entsprechend auf den Pro-Kopf-Anteil umgestellt, ergaenzt um die offene Design-Frage, ob die Station bei wachsender Allianz pro Kopf oder insgesamt konstant bleiben soll. **Lehre daraus:** Bei jeder Kennzahl pruefen, ob sie pro Spieler oder fuer alle zusammen gilt, bevor sie gegen die Baseline gestellt wird - dieselbe Fehlerform wie bei den Aggregat-Stapeln, nur in der Auswertung statt im Code. Zeitrahmen-Absatz in Abschnitt 8 von einer Absolutsperre auf einen Ausnahme-Massstab praezisiert. |
| 10.08.2026 | **Zweiter Abgleich gegen den Repo-Stand, Schwerpunkt Abschnitt 1b.** Anlass: erneuter Kaltstart, bei dem wieder die alte 33-Punkte-README als Anhang mitgeliefert wurde - genau der Fall, den Messregel 16 beschreibt. **Bestaetigt und unveraendert** (gegen den Code geprueft, nicht gegen Beschreibungen): Raid-Rhythmus Mi/So mit `RAID_SPAWN_CHANCE` 0,7, `POOL_SIZE` 1, `MAX_PLAYER_SHIPS` 200.000, alle drei Missionsdauern, Slot-Zahlen 3/3/4/1, `RAID_WAVE_WIN_*` 10/6/2, `SEED_FLEET` 5.300 + `SEED_DEFENSE` 1.120, `RESOURCE_CAP`-Kommentar mit 1,5 gegen tatsaechliche 6, `ADMIRAL_STAT_SHARE` 0,55, `lib.mjs`/`lib3`/`lib4` byte-identisch. **Sechs Korrekturen:** (1) Abschnitt 1b nennt `runHourlyCheck()` als zu nutzende Spielfunktion - **die ist nicht exportiert**; Einstiegspunkt ist `processMissions()`. (2) Neuer Unterabschnitt "Technische Vorbedingungen" in 1b: alle Kernfunktionen lesen `Date.now()` direkt (19x actions.ts, 9x state.ts, 7x raids.ts, 4x missions.ts), 720 Stundenschritte sind ohne gefaelschte Uhr unmoeglich; und `state.ts` oeffnet ueber `db.ts` beim Import die **produktive** `game.db` mit hartkodiertem Pfad. Beides war im Plan stillschweigend als geloest vorausgesetzt. (3) Die 30-Minuten-Begruendung des Zeitschritts gilt nur fuer Gebaeude - Schiffs-Bauzeiten liegen im Sekundenbereich, wodurch der Lane-Leerlauf bei Stundenaufloesung systematisch unterschaetzt wird; Leerlauf wird deshalb jetzt getrennt je Auftragsart protokolliert. (4) Entscheidung 5a stuetzte sich auf "ein Spieler in Woche 1 hat Dutzende Schiffe" - **falsch**, `defaultPlayerState()` finanziert ab Stunde 0 rund 2.200 Schiffe; die Entscheidung bleibt richtig, die Begruendung ist auf Qualitaet statt Stueckzahl umgestellt. (5) Startkapital als eigene Zeile in der Risikotabelle 1a - es fuehrt direkt in die Asteroiden und verschaerft damit Abnahmekriterium 5. (6) Imperator-Baulimit geklaert: Code sagt `maxCount: 6`, Session 3 hatte recht, die "2" stammt aus der alten README; R10 um die vier nachweislich veralteten Zahlen der alten Fassung ergaenzt. |
| 09.08.2026 | **Nutzerfund: Flottenlimit blockierte jeden Schiffsbau.** Ein Spielstand lag mit 103.196 Schiffen ueber `MAX_PLAYER_SHIPS = 100.000`. Sofortmassnahme (Nutzerentscheidung): Limit auf **200.000** angehoben und beobachten - die Konstante ist im Code ausdruecklich ein Sicherheitsnetz, kein Balance-Wert, und die CPU-Last liegt weit unter den Spitzen. Zusaetzlich die Fehlermeldung korrigiert, die bei negativem Rest woertlich "Nur noch -3196 Schiff(e) moeglich" ausgab. **Die Ursache bleibt offen und steht als R13** in Abschnitt 3: `totalOwnedShips()` zaehlt Schiffe auf Missionen/Entsendungen/Gruppen-Operationen nicht mit, wodurch sich das Limit durch Wegschicken und Nachbauen umgehen laesst. Offener Messpunkt fuer Abschnitt 7: welche Flottengroesse die Kampf-Engine in vertretbarer Zeit verkraftet - gemessen sind bisher nur ~700 ms bei 2.600 Einheiten, nichts darueber. |
| 09.08.2026 | **Zwei Container-Befunde nachgetragen**, die in Session 1 als "NIEDRIG" abgelegt und deshalb nie in eine Entscheidung ueberfuehrt worden waren, obwohl beide Entscheidung 2 direkt beruehren. Neu als Pruefpunkte **2c** (Teile-Umwandlungsrate: gemessen 59/40/38 % gegen einen Zielkorridor von 45-55 %, kein Tier trifft ihn) und **2d** (Freischiff-Rueckkopplung: Jackpot erhoeht die eigene Power, an der die Feindstaerke skaliert, an der nach Entscheidung 2 die Beute haengt - Kipppunkt deshalb zweimal rechnen, mit und ohne Freischiff-Treffer). Die Container-Erwartungswerte selbst waren bereits vollstaendig gemessen. |
| 09.08.2026 | **Mobil-Darstellung als eigener Strang ausgelagert:** neue Datei `MOBIL_CHECKLISTE.md` im Repo-Wurzelverzeichnis. Bewusst NICHT hier eingearbeitet - anderes Problemfeld (Darstellung statt Simulation), andere Pruefmethode (Auge am Geraet statt Messskript), reversibel und **nicht blockierend fuer den Reset**. Die Aenderungen koennen unabhaengig vom Balance-Paket sofort live gehen. Erster Befund (M1) ist bereits behoben: die Klasse `.combat-table` trug neben der 10-spaltigen Kampftabelle auch neun schmale Tabellen inklusive der Nachrichtenliste, und die Mobil-Regel `min-width:720px` blies die auf einem 390px-Display ueber den rechten Rand hinaus. Dieselbe Fehlerform wie Messregel 15: eine zentrale Regel, die an einer Stelle richtig und an acht anderen falsch ist. |
| 09.08.2026 | **Die sechs verbliebenen messabhaengigen Punkte geschlossen** - nicht durch Zahlen, sondern durch **Entscheidungsregeln**: was gemessen wird, welche Antwort welche Konsequenz hat, und was bei uneindeutiger Messung gilt. Punkt 4 war durch Abschnitt 1b bereits beantwortet und ist nur noch nicht gestrichen gewesen. Punkt 7 (Raid verlierbar) ist auf Design-Grundlage entschieden statt vertagt: ja, verlierbar, aber mit gedeckeltem Verlust - eine nicht verlierbare Heimatverteidigung ist ein Timer, kein Spannungselement. Dazu die Vorrangregel, dass im Konfliktfall Entscheidung 3 zurueckgenommen wird und nicht das Verlustrisiko. Fuer Punkt 3 (Imperator) gilt neu ausdruecklich: "Prestige" ist keine gueltige Begruendung fuer schlechte Werte allein. **Damit braucht die Umsetzungs-Session keine weitere Entscheidungsrunde mehr.** |
| 09.08.2026 | **Konsistenzpruefung des Gesamtplans.** Zehn Widersprueche und veraltete Verweise behoben, die durch das Wachstum ueber vier Sessions und drei Erweiterungen entstanden waren. Die drei wichtigsten: (1) Entscheidung 5 enthielt in einem Satz "`SEED_FLEET` bleibt Untergrenze" und in 5a das Gegenteil - der aeltere Satz stammte aus der Zeit vor der Reset-Entscheidung. (2) Entscheidung 12 stand in Block F, also NACH dem ersten Simulationslauf, obwohl Abnahmekriterium 5 genau diesen Bonus misst - der erste Lauf haette zwangslaeufig gescheitert; 12 ist nach Block C vorgezogen. (3) R1 (Client-Spiegel der Bauzeit-Formel) stand in Block E, Wochen nach Entscheidung 9.1 in Block D - genau die getrennte Terminierung, durch die multipliers.ts schon einmal auseinandergelaufen ist; R1 laeuft jetzt in Schritt 14 mit 9.1 zusammen. Ausserdem: R1 inhaltlich auf die Saettigungskurve umgeschrieben, Risiko-Absatz der Nanitenfabrik als hinfaellig markiert, Abnahmekriterium 4 um den Raid korrigiert (er trifft ab Tag 1 und ist kein freischaltbarer Inhalt), vier Verweise von Abschnitt 1a auf 1b umgehaengt, Reihenfolge auf 27 Schritte neu durchnummeriert, Messregeln 14 und 15 neu, Abschnitt 7 um fuenf Punkte ergaenzt. |
| 09.08.2026 | Vier weitere offene Punkte entschieden: 30-Tage-Simulation vorgezogen (vor Block D; nach der Neunummerierung Schritt 13), Bot-Ertragsweg (b) bestaetigt, Nachteil bei Entscheidung 3 gestrichen und praezisiert, Modulkosten als ZIELWERT statt als Faktor festgelegt (60-120 Tage Amortisation gegen die neue Baseline) - damit ist auch die Feindstaerke-Variante endgueltig auf (b) geschlossen. Neu: **Abschnitt 1b, vollstaendige Spezifikation der 30-Tage-Simulation** mit drei Spielerprofilen, sieben Protokoll-Kennzahlen und sechs Abnahmekriterien. Damit sind alle ohne Messung entscheidbaren Punkte geschlossen. |
| 09.08.2026 | **Entscheidung 9.1 entschieden** (Nutzer hat die Entscheidung delegiert): Untergrenze verworfen, ersetzt durch Saettigungskurve (9.1a), additive statt multiplikativer Reduktionen (9.1b), Basis-Bauzeiten unveraendert (9.1c). Grund: eine feste Untergrenze deckelt die Bremse, nicht das unbegrenzte Wachstum der Rohzeit - sie verschiebt die Mauer nur. Zweiter Grund: sechs multiplikativ gestapelte Reduktionsquellen ergeben bei Vollausbau ~0,002, dieselbe Fehlerform wie beim Frischling-Bonus. Neu: **Endziel fuer den gesamten Zeit-Umbau** in Entscheidung 9 ("Zeit ist konstante Reibung, Kosten sind der Wachstumsmotor"). Anwendungsbereich nach Kurvenart getrennt: Saettigung nur fuer Gebaeude, Untergrenze genuegt bei Forschung (Stufe 10 gedeckelt) und Schiffen (linear in der Stueckzahl). |
| 09.08.2026 | Entscheidung 13 (KI-Bots/Piratenbasen) und Entscheidung 14 (Gebaeude-Module V2/V3) neu. Punkt 7.5 aus Entscheidung 7 herausgeloest - die Allianz-Station ist nachweislich NICHT betroffen (Generator ueber alle drei Stufen), die Luecke liegt allein in der handgetippten `buildingModules.ts` der Heimatbasis. Entscheidung 5 um 5a (`SEED_FLEET`-Boden muss nach dem Reset mitfallen) und 5b (Messblocker durch 13.3) ergaenzt. R12 (Startpruefung Modul-IDs) neu. Reihenfolge in Abschnitt 5 neu durchnummeriert. Offene Punkte 9-12 in Abschnitt 8 ergaenzt (9.1-Untergrenze, Vorziehen der 30-Tage-Simulation, Bot-Ertragsweg, Nachteil bei Entscheidung 3) - alle vier sind VORSCHLAEGE, nicht entschieden. |
| 09.08.2026 | Imperator-Absatz in Abschnitt 4 von einer Feststellung zu einem Messauftrag umgebaut. Grund: Nutzerrueckfrage deckte auf, dass der Imperator in KEINER der vier Sessions im Kampf gemessen wurde - die Einstufung "schlechteste Einheit" stammt aus reiner Tabellenrechnung. Baulimit-Widerspruch (README 2 gegen Session 3 mit 6) vermerkt. |

### Methodische Lehre aus dem bisherigen Verlauf

Die Checkliste enthaelt zwei Arten von Aussagen, die sich sprachlich nicht unterscheiden:

- **Gemessen** (Sektoren, Raids, Elite-Serien, Duelle, Admiral-Serien) - belastbar, Stichproben
  stehen in der Methodik des jeweiligen Session-Abschnitts.
- **Gerechnet** (Kosten, Wert je Machtpunkt, Amortisationen, Erwartungswerte) - plausibel, aber
  ohne Kampfsimulation dahinter.

**Bei jeder absolut klingenden Einzelaussage pruefen, in welche Kategorie sie faellt.** Der
Imperator-Fall (siehe Protokoll) ist das Beispiel: ein sehr starkes Urteil auf reiner
Tabellenbasis, ueber eine Einheit, die aus beiden Messreihen ausgelassen wurde.
