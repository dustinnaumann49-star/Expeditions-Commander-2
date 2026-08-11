# Umsetzungsplan Balance (Stand 09.08.2026)

**Zweck dieser Datei.** `FINALE_BALANCE_CHECKLIST.md` enthaelt die vollstaendige Analyse aus vier
Sessions (Befunde, Messwerte, Methodik). Sie bleibt unveraendert und ist die Beweisgrundlage.
Diese Datei enthaelt die daraus **getroffenen Entscheidungen** und ist die Arbeitsanweisung fuer die
Umsetzungs-Session.

**Status:** **Am Spielcode wurde am 10.08.2026 erstmals etwas geaendert** (Nutzerentscheidung,
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
| Raid (Mi+So, 12/12) | 6,31 Mrd |
| Asteroiden (3 Felder) | 2,83 Mrd |
| Solo-Piraten Hoch | 1,13 Mrd |
| Heimatbasis V1 voll | 0,55 Mrd |
| **Summe** | **21,69 Mrd** |

Dunkle Materie: **1.088/Tag** Einnahmen gegen **103/Tag** groesste laufende Senke (Faktor 10,5).
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
   -> Entscheidung 12 (heute waeren es die Asteroiden mit dem 24,5-fach gestapelten Bonus).
6. **Die Einnahmenkurve hat kein Plateau ueber 5 Tage.** Ein laengeres Plateau heisst, dass der
   naechste Ausbauschritt unerreichbar weit weg ist. -> Entscheidungen 7 und 9.4.

### Was daran kalibriert wird

- `T_MAX_BASE` und die sieben Reduktionsgewichte aus Entscheidung 9.1b.
- Die Slot-Zahlen aus 9.2 - und zwar gegen Kriterium 2 UND 3 gleichzeitig, weil beide
  gegenlaeufig sind.
- Die additive Form des Frischling-Bonus aus Entscheidung 12.
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

**Bezug:** Session 3, Befund 2. **Dateien:** `game/missions.ts` (`runHourlyCheck()`),
`game/combat.ts` (`fleetSizeRewardMultiplier()` ~Zeile 525), `data/sectors.ts`,
`data/combatConstants.ts` (`FLEET_SIZE_BONUS_CAP`, `FLEET_SIZE_BONUS_RATE`).

**Ziel:** `Beute = Basis * (vernichtete Feindmacht / Referenz)^0,85`, zusammen mit der bereits
beschlossenen Wrack-Bergung von 30 %.

**Begruendung:** Rein linear ergibt rund 17 % Tagesrendite auf den Flottenwert - die Flotte
verdoppelt sich alle fuenf Tage und ueberholt binnen Wochen jede andere Zahl im Spiel. Mit 0,85
waechst der Netto-Ertrag dauerhaft weiter (6,18 Mrd Flotte -> +0,99 Mrd/Tag; 34,99 -> +4,38;
66,33 -> +8,2), in einem ueber Jahre spielbaren Tempo.

**Kalibrierung:** Der Faktor von rund **0,091 Wert-Einheiten je Punkt vernichteter Feindmacht**
(damit die Referenzflotte ihre heutige Belohnung behaelt) ist HOCHGERECHNET, nicht gemessen.
**Vor dem Festschreiben direkt messen.** Die reale Flotte vernichtet pro 24h-Mission 83,62 Mrd
Feindmacht, die Referenzflotte geschaetzt 12,2 Mrd.

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

### Entscheidung 3 - Raid-Ertrag: HALBIEREN

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
> **Empfehlung: Variante 4, hilfsweise Variante 2.** Variante 4 trifft die Ursache am genauesten
> (Belohnung folgt dem Beitrag) und bleibt unabhaengig von der Spielerzahl stabil, ist aber die
> aufwendigste. Variante 2 (Halter bekommen einen festen Bruchteil) erreicht die Stabilitaet mit
> deutlich weniger Aufwand, ohne die Beitrags-Frage zu loesen.

**Begruendung:** Die Verdopplung von 1x auf 2x/Woche wurde als reiner Kalendereintrag umgesetzt,
ohne die Belohnung pro Raid gegenzurechnen - die Kommentare an den Konstanten begruenden 10/6/2
noch mit "nur 1x/Woche pruefbar". Der Raid liefert heute **6,31 Mrd/Tag (29 % der Gesamteinnahmen)
und 595 DM/Tag (der groesste DM-Posten des Spiels) ohne Flottenbindung, ohne Flugzeit, ohne
Entscheidung**. Die hoehere Frequenz soll mehr Ereignisse bringen, nicht mehr Ertrag.

**Muss zusammen mit Entscheidung 2 gemessen werden**, sonst verschiebt die neue Beute-Skalierung
die Einnahmen weiter nach oben, bevor eine Senke greift.

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

**4.1 Verlust-Kriterium reparieren (blockiert alles Weitere).**
`runAdminCheck()` nutzt `result.retreated` als Niederlage-Kriterium. Das Flag hat seit der
Umstellung auf den gestaffelten Einzelschiff-Rueckzug (Juli 2026) eine andere Bedeutung: es wird
gesetzt, sobald **ein einziges** Schiff unter `UNIT_RETREAT_THRESHOLD = 0,3` faellt. Gemessen ist es
in **77-100 % aller Kaempfe** gesetzt, auch in gewonnenen. Der im Code referenzierte
`RETREAT_THRESHOLD` existiert nicht mehr.
Folge: In 120 kompletten Testbegegnungen wurde **Check 2 kein einziges Mal erreicht**. Damit sind
tot: `ADMIRAL_ESCALATION_PER_CHECK`, `ADMIRAL_TOTAL_CHECKS = 6`, `ADMIRAL_CHECK_INTERVAL_MS`, die
komplette Extraktions-Entscheidung (`respondAdminEncounter()`, `adminAwaitingDecision`),
`ADMIRAL_EXTRACTION_GROWTH_PER_CHECK`.
-> Ersetzen durch den Anteil tatsaechlich verlorener Einheiten aus `result.survivorsByOwner` gegen
die entsandte Stueckzahl. Neue Konstante **`ADMIRAL_DEFEAT_LOSS_SHARE = 0.45`**.
-> `simulateCombat()` macht es bereits richtig (Zeile 123-128: nur zaehlen, wenn kein voller Sieg
vorliegt) - als Vorlage nutzen.

**4.2 `contributedPower`-Freeze GLEICHZEITIG reparieren.**
`runAdminCheck()` (~Zeile 442) summiert `p.contributedPower`, das nur einmal beim Start gesetzt wird
(~Zeile 285), waehrend die Ueberlebenden pro Check zurueckgeschrieben werden (~Zeile 522). Ab
Check 2 skaliert der Gegner also gegen die START-Flotte. **Heute folgenlos, weil Check 2 nie
erreicht wird - 4.1 schaltet diesen Fehler scharf.** Vorlage: der Elite-Bollwerk-Pfad macht es
richtig (`combatFleetPowerBase(p.ships)` frisch pro Check, ~Zeile 745).

**4.3 Boss-Anteil senken.** `ADMIRAL_STAT_SHARE` von 0,55 auf **0,30**.
Gemessen bei realer Flotte: Anteil 0,55 -> 60 % Siegchance, 8,89 Mrd Verlust. Anteil 0,25 -> 100 %
Siegchance, 3,05 Mrd Verlust. Faktor 2,9 im Verlust.

**4.4 Boss-Mechanik statt Boss-Zahl.**
`RAPIDFIRE.piratenadmiral = { leicht: 10, schwer: 8 }` - **beide Typen stehen nicht in
`ADMIRAL_ALLOWED_SHIP_IDS` und koennen den Sektor gar nicht betreten.** Die Anti-Massen-Faehigkeit
des Bosses hat null erreichbare Ziele.
-> Umstellen auf `{ kreuzer: 5, schlachtschiff: 5, bomber: 5, schlachtkreuzer: 4, zerstoerer: 4,
reaper: 3 }` und `piratenadmiral` in `MULTI_TARGET_VOLLEY_SHIPS` aufnehmen.
-> **Danach zwingend gegenmessen**: Mehrfachziel-Salve zusammen mit Entscheidung 1 kann sehr stark
ausfallen.

**4.5 Belohnung proportional statt fest.**
`ADMIRAL_EXTRACTION_BASE` und `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` entfallen, ersetzt durch
**`ADMIRAL_LOOT_PER_DESTROYED_POWER = K = 0,5`**. Die je Check vernichtete Feindmacht wird auf der
`GroupOperation` mitgefuehrt und bei Extraktion/Sieg ausgezahlt.
Die Eskalation braucht dadurch keinen eigenen Belohnungs-Aufschlag: jeder weitere Check bringt
automatisch mehr vernichtete Macht (Gegner waechst mit 1,15^n) und riskiert zugleich die noch
ungesicherte Beute.

**4.6 Sieg-Bonus:** `ADMIRAL_VICTORY_BONUS` (fester Betrag) -> **Faktor 1,5** auf die angesammelte
Beute. `ADMIRAL_VICTORY_DM` bleibt bei **200**.

**4.7 Niederlage entschaerfen:** Heute verfaellt bei `defeat` die Beute ALLER bereits ueberstandenen
Checks - zusammen mit durchschnittlich 62 % Flottenverlust eine doppelte Bestrafung.
-> Bei Niederlage **50 %** der angesammelten Beute auszahlen statt 0. Die Extraktions-Entscheidung
bleibt sinnvoll, weil Weitermachen die Haelfte riskiert.

**4.8 Cooldown einbauen (Neubau, existiert heute nicht).**
`createGroupOperation()` prueft nur Sektor, Schiffstypen und Bestand. Anflug plus 6 Checks ergeben
rund 2 Stunden, also bis zu **12 Durchlaeufe/Tag**. Bei K = 0,5 waeren das +95,5 Mrd/Tag - das
**4,4-fache der gesamten Baseline** - und 2.400 DM/Tag gegen 1.088 aus dem ganzen uebrigen Spiel.
-> Ein Durchlauf je Teilnehmer und Tag. Damit liegt P10 bei rund +8 Mrd je Durchlauf, zwischen einem
Raid-Tag (6,31) und einer Elite-Serie (32,60) - passend zu 2 h gebundener Flotte gegen 24 h.

**Ausserdem (kein eigener Entscheidungsbedarf):**
- `ADMIRAL_ESCORT_BASE` ist toter Code (nirgends importiert). Der Kommentar beschreibt eine feste
  Eskorte, tatsaechlich ist sie ueber `generateCappedFleet()` voll machtskaliert. Entfernen oder
  Kommentar korrigieren.
- Der Boss selbst skaliert nicht mit Forschung (`sideBStatsOverride` umgeht `getEffectiveStats()`),
  seine Eskorte schon. Mit steigender Forschung wird der Boss relativ immer weicher. Bewusst
  entscheiden, nicht stillschweigend lassen.
- **Kein Rueckflug:** `finalizeAdminEncounter()` schreibt Ueberlebende direkt in `pState.fleet`
  (~Zeile 641-645), es gibt kein `returnTime` wie bei `finalizeGroupExpedition()`. Hinflug dauert
  3,8 h, Rueckflug null. Nachziehen.
- `rollBattleModifier()` wird in `runAdminCheck()` gar nicht aufgerufen, `BATTLE_MODIFIER_CHANCE`
  hat keinen `piraten_admiral`-Eintrag. Bewusst entscheiden.

**Messkriterien:**
- `run_admiral_rebalance.mjs` ueber **alle vier Ausbau-Profile**, nicht nur `voll` - die
  45-%-Schwelle ist gegen `voll` kalibriert und kann bei `mittel`/`schwach` zu frueh greifen.
- **Zielwert erreichte Check-Tiefe: 3-5**, nicht 1 (heute: 1,0 in allen Szenarien).
- `run_aggregate_threshold.mjs` gegen den Boss MIT Mehrfachziel-Salve.

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
Entscheidung 13.3.

---

### Entscheidung 6 - Schiffs-Tiers: WERT JE MACHTPUNKT ANGLEICHEN

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

**Bezug:** Session 1, Befund 7. **Dateien:** `game/missions.ts` (`miningMultiplier()`),
`data/economy.ts` (`NOVICE_BONUS_MULTIPLIER`, `ABBAU_BOOST_MULTIPLIER`).

**Sachlage:** Alle Mining-Multiplikatoren stapeln rein multiplikativ:
Mining-Forschung Stufe 10 (x2) * `mining_schiffe` * Prospektor (1,2) * Abbau-Booster (1,7) *
Di/Do-Event (2,0) * Frischling (3,0) = **bis 24,5x**. Ein 7 Tage alter Account kommt damit auf rund
**8,5 Mrd/Tag allein aus Asteroiden** - mehr als eine voll ausgebaute Heimatbasis (0,55 Mrd/Tag)
und rund 40 % der Endspiel-Baseline.

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
  wirkt derselbe Effekt, nur staerker - er bringt Panzerung (2.520.000) und RapidFire in den Kampf
  ein und meldet der Skalierungsformel fast nichts.
- Die 975 Mio entsprechen 4,5 % eines Tageseinkommens. Der reale Preis sind nicht Ressourcen,
  sondern die Grind-Zeit fuer 3.000 Teile.

**Die Luecke: Der Imperator wurde in KEINER der vier Sessions im Kampf gemessen.** Er ist Teil der
Referenzflotte "gross" (2 Stueck), aber er fehlt in der Einzeltyp-Tabelle aus Session 3, Befund 3
(elf Schiffe) und in der Duell-Matrix aus Session 4, Befund 7 (acht Schiffe). Die Bewertung
"schlechteste Einheit" stammt aus einer reinen Tabellenrechnung, nicht aus einem simulierten
Gefecht.

**Messauftrag (vor jeder Aenderung an Teile-Kosten oder Kampfwerten):**
1. Imperator in `run_ships.mjs` (Duell bei gleichem Wert) und `run_ship_value.mjs`
   (machtskalierter Sektor) aufnehmen - er fehlt in beiden.
2. Gezielt gegen Jaegerschwaerme testen. Die README beschreibt ihn als RapidFire-Gegenmittel gegen
   Jaeger-Klassen. **Dieselbe README-Passage enthaelt nachweislich einen Fehler** (der
   Schlachtkreuzer hat kein RapidFire gegen Jaeger und verliert mit -553 bis -556 Mio, siehe
   Entscheidung 6). Die Aussage zum Imperator ist damit ungeprueft, nicht automatisch falsch.
3. Den Skalierungsvorteil separat beziffern: wie viel schwaecher faellt die generierte
   Gegnerflotte aus, wenn dieselbe Kampfkraft ueber Imperatoren statt ueber Standardschiffe
   eingebracht wird?

**Widerspruch im Baulimit - GEKLAERT am 10.08.2026 durch Code-Pruefung.** ~~README Punkt 21 nennt
`maxCount` 2, Session 3, Befund 6 rechnet mit 6.~~ **Der Code sagt `maxCount: 6`** (`ships.ts`,
Imperator). Session 3 ist richtig, die "2" stammt aus der veralteten README-Fassung (Messregel 16).
Die Repo-README fuehrt im selben Kommentarblock ebenfalls 6, zusammen mit den Salvenschiffen
(Salvenjaeger 150, Salvenkreuzer 90, Salvendreadnought 30) - auch diese drei Zahlen weichen von der
alten Fassung ab (dort 8-30). **Alle Rechnungen, die mit `maxCount: 2` gearbeitet haben, sind
entsprechend nachzuziehen.** Kein Handlungsbedarf am Code, nur an der Dokumentation (R10).

**Erst nach dieser Messung entscheiden**, ob der Imperator Prestige-Einheit bleibt. Bis dahin gilt
die Prestige-Einstufung als vorlaeufig, nicht als belegt.

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
  2. Entscheidung 2   Beute-Exponent 0,85 + Wrack-Bergung 30 %
  3. Entscheidung 3   Raid-Ertrag halbieren
  -> danach ALLE Simulationen neu, dann Baseline neu festschreiben

BLOCK B (Piratenadmiral, in sich sequenziell)
  4. Entscheidung 4.1 + 4.2  Verlust-Kriterium UND contributedPower-Freeze ZUSAMMEN
  5. Entscheidung 4.3 - 4.8  Boss-Anteil, Mechanik, Belohnung, Cooldown

BLOCK C (unabhaengig voneinander, AUSSER 13.3 vor 5)
  6. Entscheidung 13.3 Bot-/Basis-Wachstum von der Aufruf-Haeufigkeit entkoppeln
                       -> Voraussetzung fuer JEDE reproduzierbare Messung an Entscheidung 5
  7. Entscheidung 5   Piratenbasen (+ Schranke gegen Dauer-Farming! + SEED_FLEET-Boden, 5a)
  8. Entscheidung 6   Schiffs-Tiers
  9. Entscheidung 7   Allianz-Station (nur noch 7.2/7.3/7.4 - 7.1 ist am 10.08.2026
                       vorgezogen erledigt, siehe Abschnitt 2a)
 10. Entscheidung 10  Heimatverteidigung
 11. Entscheidung 12  Frischling-Bonus additiv
                       -> VORGEZOGEN aus Block F (09.08.2026): Abnahmekriterium 5 der Simulation
                          misst genau diesen Bonus. Stuende 12 dahinter, wuerde der erste
                          Simulationslauf zwangslaeufig an einem Fehler scheitern, der noch
                          gar nicht behoben sein soll.
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
- **Raid-Ertrag gegen die ZAHL DER ACCOUNTS neu rechnen (NEU 11.08.2026, hoechste Prioritaet).**
  Jeder Verteidiger und Halter bekommt die volle Container-Menge, der Ertrag skaliert also linear
  mit der Zahl angreifbarer Accounts inklusive Bots. Bei vier verteidigten Raids sind es
  16,58 Mrd/Tag statt der im Plan gefuehrten 6,31 - **rund 52 % aller Einnahmen und damit ein
  Verstoss gegen Abnahmekriterium 5 im Ist-Zustand.** Die geplante Halbierung reicht nicht.
  Vollstaendige Rechnung und drei Loesungsvarianten im Kasten bei Entscheidung 3.
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
- Ob die Solo-Sektoren durch Entscheidung 2 wieder lohnend sind (heute fuer die reale Flotte
  **-0,55 Mrd pro 24h**, also totes Inhalt).
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

**1. Beute-Exponent 0,85 gegen 0,90-0,95** (Entscheidung 2).
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

**3. Imperator-Einstufung** (Abschnitt 4).
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
| 09.08.2026 | Erstfassung. 11 Entscheidungen, 11 Reparaturen, Reihenfolge in 5 Bloecken, 13 Messregeln. |
| 09.08.2026 | Abschnitt 1a ergaenzt (Server-Reset als Rahmenbedingung), Entscheidung 12 (Frischling-Bonus) neu, Block F (Startphase) neu. Entscheidung 10 auf blockierend hochgestuft. Begruendung fuer Feindstaerke-Variante (b) ersetzt - die urspruengliche ("entwertet bestehende Investitionen") ist durch den Reset hinfaellig. |
| 10.08.2026 | **Abgleich des Plans gegen den aktuellen Repo-Stand** (Nutzerhinweis: die Performance-Zahl stamme vermutlich aus der Zeit vor der Aggregat-Engine - zutreffend). Ursache: eine im Chat hochgeladene README-Fassung mit 33 nummerierten Punkten wurde als aktuell behandelt; die Fassung im Repo hat ueber 750 Zeilen, ist in Abschnitte gegliedert und enthaelt keine Nummerierung. **Vier Korrekturen:** (1) Der Performance-Messpunkt in Abschnitt 7 ist gestrichen - die Messung existiert laengst und lautet 1,5 Mio. Schiffe bei ~26 ms statt 700 ms bei 2.600 Einheiten, ein Unterschied von mehr als Faktor 100; `MAX_PLAYER_SHIPS = 200.000` ist damit unbedenklich. (2) Die Raid-Mechanik in Abnahmekriterium 4 korrigiert: keine taeglichen Checkpoints mit 60 %, sondern woechentlich Mittwoch/Sonntag mit `RAID_SPAWN_CHANCE = 0,7` bzw. 1,0 fuer namentlich hinterlegte Spieler; `FIXED_CHECK_HOURS_UTC` existiert nicht mehr. (3) `POOL_SIZE` ist 1, nicht 2 - Kaempfe laufen serialisiert, was das Argument gegen Bot-Ertragsweg (a) eher staerkt. (4) Zeitschritt-Begruendung in Abschnitt 1b praezisiert (Asteroiden stuendlich, Piraten 4 h, Missionen einheitlich 24 h). **Gegengeprueft und korrekt:** die Slot-Zahlen (3/3/4/1), die Missionsdauern, die Raid-Belohnungen 10/6/2 und die Frequenz 2x/Woche in Entscheidung 3 - der Plan selbst war also am aktuellen Code geschrieben, nur die in diesem Chat ergaenzten Stellen nicht. Neu: **Messregel 16**. |
| 11.08.2026 | **Raid-Ertrag skaliert mit der Zahl der Accounts - Entscheidung 3 steht auf zu niedrigen Zahlen** (Nutzerhinweis: rund 10.000 DM an einem Raid-Tag, weil er eigenen Raid, den seiner Frau und die beiden Bot-Raids verteidigt). Im Code bestaetigt: `finalizeRaidWaves()` ruft `grantContainers()` fuer den Verteidiger UND jeden Halter auf, jeder bekommt die volle Menge - korrekt nach Punkt 5 der README, aber diese Regel stammt aus dem Kontext gemeinsamer Expeditionen, wo alle EINE Mission zusammen fliegen. Bei Raids sind es N getrennte Ereignisse, jedes voll verguetet, und die Belohnung haengt nicht am Beitrag. Nachgerechnet: ein eigener Raid gibt 1.800 DM und 14,51 Mrd Ressourcenwert, vier verteidigte Raids 7.200 DM und 58,02 Mrd pro Raid-Tag = **16,58 Mrd/Tag gegen die im Plan gefuehrten 6,31 Mrd/Tag** (Faktor 2,6; DM Faktor 3,5). Der Raid ist damit **rund 52 % aller Einnahmen und verletzt Abnahmekriterium 5 bereits im Ist-Zustand**; die geplante Halbierung auf 5/3/1 landet bei 8,29 Mrd/Tag und damit immer noch ueber dem bisher angenommenen Ist-Wert. **Kern des Problems ist nicht die Hoehe, sondern die Skalierung** - der Ertrag waechst mit jedem neuen Spieler und jedem neuen Bot. Vier Loesungsvarianten im Kasten bei Entscheidung 3 dokumentiert. **Variante 4 stammt vom Nutzer:** fester Topf pro Raid, aufgeteilt nach tatsaechlichem Beitrag - technisch bereits moeglich, weil `combat.ts` `dmgDealt` und `dmgTakenA` schon besitzer-bewusst fuehrt. Zwei Bedingungen dabei zwingend: der Topf muss FEST pro Raid sein (sonst bleibt die Skalierung bestehen - Schadensmessung loest Fairness, nicht Hoehe), und der Beitrag muss Schaden GEMACHT plus ABSORBIERT zaehlen, sonst waere das Bollwerk mit Waffen x1 ausgerechnet auf seinem Heimatfeld der schlechtest bezahlte Teilnehmer. Empfehlung: Variante 4, hilfsweise Variante 2. **Bewusst NICHT vorgezogen umgesetzt** - anders als die Reparaturen der Vortage ist das kein stiller Defekt, sondern eine bewusste Design-Entscheidung mit unerwarteter Nebenwirkung, und die Korrektur veraendert die Einnahmen-Baseline, an der Block A haengt. |
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
