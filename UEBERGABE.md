# Uebergabe - Stand 19.08.2026

Kurze Datei, bewusst. Der Inhalt steht im `UMSETZUNGSPLAN_BALANCE.md`; hier steht nur, wie man
einsteigt und was NICHT im Plan steht.

## Einstieg in einen neuen Chat

> Repo: https://github.com/dustinnaumann49-star/Expeditions-Commander-2
> Synchronisiere dich. Lies `UMSETZUNGSPLAN_BALANCE.md` **gezielt, nicht komplett** - die Datei ist
> ueber 300 KB gross. Abschnitt 8 zuerst, dann Abschnitt 2a, dann Abschnitt 1b, danach nur die
> Abschnitte, die zur jeweiligen Aufgabe gehoeren. `README.md` und `FINALE_BALANCE_CHECKLIST.md`
> nur bei Bedarf.
> Beachte Messregel 16: keine Zahl aus einer Beschreibung uebernehmen, immer gegen den Code
> pruefen. Und beachte den Abschnitt "Arbeitsregel: WANN Code geaendert wird" - bis zum
> Server-Neustart wird nicht gebaut, ausser ich frage ausdruecklich danach.

**Abschnitt 2a ist neu und der wichtigste Teil fuer den Einstieg** - dort steht, was zwischen dem
10. und 13.08.2026 tatsaechlich am Code geaendert wurde. Wer nur Abschnitt 8 liest, haelt den Plan
faelschlich fuer unangetastet.

**Eine Session pro Block, nicht mehr.** Plan inzwischen ~264 KB, Checkliste 125 KB, README 67 KB -
das passt nicht gleichzeitig in eine Session.

## Arbeitsregel: WANN Code geaendert wird (ab 19.08.2026)

**Am Ende des Balance-Plans steht ein Server-Neustart. Alle Spielstaende werden zurueckgesetzt,
alle fangen mit der neuen Balance neu an.** Daraus folgt die Regel fuer jede Session bis dahin:

**Balance-Aenderungen werden GESAMMELT, nicht einzeln ausgeliefert.** Sie wirken auf Spielstaende,
die es nach dem Neustart nicht mehr gibt - frueh hochladen bringt nichts und kostet nur
Abstimmung. Gemeint sind Kurven, Konstanten, Sektor-Werte, Kosten, Belohnungen, Kampfmechanik.

**Drei Kategorien, danach entscheiden:**

| Kategorie | Beispiele | Wann hoch |
|---|---|---|
| Sofort | Abstuerze, Fehler, Performance, kaputte Anzeigen | sofort - betrifft das laufende Spiel, unabhaengig vom Neustart |
| Sammeln | alles aus dem Balance-Plan | erst zum Neustart, gebuendelt |
| Immer | `UMSETZUNGSPLAN_BALANCE.md`, `UEBERGABE.md`, Messprotokolle | jede Session - das ist Arbeitsstand, kein Spielstand |

**Fuer die Umsetzungs-Sessions heisst das konkret:**

1. **Nicht bauen, ohne zu fragen.** Planen, messen, kalibrieren, dokumentieren - Code nur auf
   ausdrueckliche Nachfrage des Nutzers ("kann das eingebaut werden, wird es empfohlen?"). Ein
   knappes "Go" auf einen Loesungsansatz ist KEINE Freigabe zum Einbauen; im Zweifel nachfragen.
2. **ABER: aktiv darauf hinweisen, wenn eine Aenderung zwingend vorgezogen werden muss.** Es gibt
   Faelle, in denen Warten teurer ist als Bauen - etwa wenn ein Messergebnis ohne die Aenderung
   nicht reproduzierbar bleibt, wenn zwei Entscheidungen sonst zweimal kalibriert werden muessten,
   oder wenn ein Fehler das laufende Spiel beschaedigt. **Dann sagen, warum, und den Nutzer
   entscheiden lassen.** Solange kein solcher Zwang besteht, wird auch nicht gebaut.
3. **Doku und Code duerfen nie auseinanderlaufen.** Wenn ein Schritt kalibriert, aber nicht gebaut
   ist, muss das an JEDER Stelle stehen, die ihn erwaehnt - Messkasten, Reihenfolge-Abschnitt,
   Aenderungsprotokoll, Uebergabe. Am 19.08.2026 war das kurzzeitig nicht der Fall (der Plan
   meldete "GEBAUT", im Repo stand nichts) und musste nachtraeglich korrigiert werden.
4. **Messwerte aus einem lokalen Messbuild IMMER als solche kennzeichnen** - im Protokoll und im
   Kopf des Skripts. Sonst laeuft eine spaetere Session das Skript, es scheitert an einem
   fehlenden Import, und der Fehlschlag sieht aus wie ein Defekt.

**Empfehlung fuer den Neustart selbst:** das gesammelte Gesamtpaket ein paar Tage VOR dem Wipe auf
den alten Staenden laufen lassen. Die Zahlen stimmen dort nicht, aber es zeigt, ob etwas kaputt
ist, ob Berichte seltsam aussehen, ob eine Anzeige leer bleibt. Sonst gehen rund fuenfzehn
Entscheidungen gleichzeitig live, die einzeln simuliert, aber nie zusammen gespielt wurden - und
R14 wie Entscheidung 10 sind beide Belege dafuer, dass ein gemessener Mechanismus im echten Ablauf
anders wirken kann als in der Simulation.

## Stand

- **NEU 19.08.2026 (spaeter Abend), beim Code-Abgleich gefunden: es gibt jetzt ZWEI verschiedene
  Definitionen von "Frischling" nebeneinander.** Entscheidung 10 hat `NEWCOMER_GRACE_DAYS = 14`
  gebaut (Raid-Schonfrist), `NOVICE_BONUS_WINDOW_MS` steht seit dem 04.08.2026 unveraendert auf
  **7 Tage** (Mining-Bonus, `NOVICE_BONUS_MULTIPLIER = 3`). Keine der beiden Entscheidungen hat
  das so festgelegt - die Fenster sind nebeneinander entstanden. **Wer Entscheidung 12 anfasst,
  entscheidet das mit**, sonst faellt es nach dem Reset im Spiel auf (der Raid schont noch,
  der Mining-Bonus ist schon weg). Kein Defekt, aber eine offene Setzung.
- **Entscheidung 12 ist damit das letzte reset-blockierende Stueck.** Abschnitt 5 nennt 10 und 12
  als die beiden Punkte, die sich nicht nachtraeglich korrigieren lassen; 10 ist gebaut, 12 steht
  nicht im Code (`NOVICE_BONUS_MULTIPLIER = 3` wirkt unveraendert multiplikativ in
  `miningMultiplier()`, `missions.ts`). Client-Spiegel ist vorhanden und wird korrekt bedient
  (`noviceBonusMultiplier` ueber `/game/data`, `routes.ts`) - beim Umbau mitziehen.
- **NEU 19.08.2026 (spaeter Abend): ENTSCHEIDUNG 16 IST VOLLSTAENDIG KALIBRIERT, aber NICHT
  GEBAUT.** Beide offenen Zahlen stehen: **RF-Wert 4**, **Ausweichbonus klein/gross 0,20 und
  mittel/gross 0,08**. Dazu zwingend `ZIELERFASSUNG_BASE['leicht'] = 0,25` und der Client-Spiegel
  fuer den Ausweichbonus (sonst aendert man den Hebel, den niemand sieht). Alle vier
  Abnahmekriterien erfuellt. Bauanleitung im Messkasten bei Entscheidung 16, Protokoll
  `rf_depth.txt`, Abschnitt "ZWEITE MESSRUNDE". **Im Repo steht davon keine Zeile.**
- **DIE WICHTIGSTE KORREKTUR: es wird KEIN Ausgleich ueber die Gegnerstaerke gebraucht.** Die
  Aussage der ersten Messrunde ("Klassen-RF ist ein globaler Spieler-Buff") stuetzte sich auf die
  0,0 % Verteidigungsverlust im Raid - eine Prozentzahl ohne Gegenposten. Nachgerechnet mit 40
  statt 10 Raids: der Flottenverlust steigt gleichzeitig von 13,6 auf 19,6 %, und die
  Verteidigung ist nur 0,43 Mrd wert gegen 5,52 Mrd Flotte. **Der Raid wird in Wert-Einheiten
  29 % teurer, nicht billiger.** Die Einnahmen-Baseline bewegt sich um maximal 2 %.
  **`PIRATEN_MULTIPLIER_ROLL` bleibt unberuehrt - seine Sperre muss gar nicht fallen.
  `RAID_WAVE_ROLL` ist freigegeben, bleibt aber ungenutzt**, eine Anhebung wuerde die ohnehin
  eintretende Verschaerfung verdoppeln.
- **Die Messungen liefen gegen einen KUMULATIVEN Messbuild inkl. Block A Schritt 2**
  (`make_messbuild_kum.mjs`), weil beide zum Server-Neustart gemeinsam wirksam werden. Der Build
  wurde vor Gebrauch gegen zwei bekannte Anker aus `loot_curve.txt` geprueft und reproduziert sie.
  **`lib.mjs`, `lib3.mjs` und `run_income_baseline_v2.mjs` loesen jetzt `MESSBUILD` auf** - vorher
  liefen sie fest gegen `server/dist`.
- **NEU 19.08.2026 (Abend): Block A Schritt 2 ist VOLLSTAENDIG KALIBRIERT, aber NICHT GEBAUT.**
  Alle Konstanten stehen fest, der Einbau ist mechanisch. **Im Repo steht davon keine Zeile:** kein
  `game/loot.ts`, kein `LOOT_CURVE_SOLO_CHECK_POWER`, `fleetSizeRewardMultiplier()` laeuft in
  `missions.ts`/`groupOps.ts` unveraendert weiter, `winResources` der drei Solo-Sektoren stehen auf
  den alten Betraegen. Bauanleitung und alle Zahlen im Messkasten am Kopf von Entscheidung 2,
  Protokoll `loot_curve.txt`.
- **Die Messung lief gegen einen LOKALEN Messbuild** mit diesen Aenderungen (Verfahren wie
  `make_messbuild_rf.mjs`, nur ohne eigenes Skript, weil ganze Funktionen betroffen waren).
  **`run_loot_curve.mjs` und `run_income_baseline_v2.mjs` laufen gegen den heutigen Repo-Stand
  NICHT** - sie importieren `game/loot.js`, das es dort nicht gibt. Wer die Zahlen nachpruefen
  will, baut zuerst die Bauanleitung ein.
- **Empfehlung zum Einbauzeitpunkt: nach Block B.** Der Piratenadmiral braucht dieselbe Kurve,
  zweimal kalibrieren waere unnoetige Arbeit.
- **Die offene Koop-Frage ist entschieden: V2 plus 15 % je Mitflieger, gedeckelt bei 3.**
  Gemessen x1,146 (mittel) und x1,155 (spaet) Netto je Teilnehmer. **V1 ist verworfen aus einem
  Grund, den die Messung in `elite_coop.txt` nicht zeigen konnte: Bots nehmen Elite-Einladungen
  automatisch an** (`bot.ts`, 30 % ihrer Flotte). Unter V1 waeren zwei eingeladene Bots ein
  Ein-Klick-Einkommensmultiplikator gewesen. **Lehre fuer kuenftige Koop-Regeln: bei jeder Regel,
  die mit der Teilnehmerzahl skaliert, zuerst pruefen, ob Bots teilnehmen koennen.**
- **BASELINE NACH DEM EINBAU: 0,98 / 19,57 / 61,11 Mrd.** Das ist eine VORHERSAGE, kein Ist-Stand.
  **Bis zum Einbau gilt weiter 0,80 / 19,82 / 76,85.** ACHTUNG beim spaeteren Vergleich: in der
  Differenz stecken ZWEI Aenderungen - auch der Flottenwert ist durch Entscheidung 6 von
  0,37/6,18/34,99 auf 0,32/5,52/29,27 Mrd gefallen. Wer 61,11 gegen 76,85 haelt, vergleicht
  beides auf einmal.
- **Nutzerentscheidung 19.08.2026: Container sollen ein Extra sein, nicht die Hauptquelle.** Heute
  stellen sie 94 % des Solo-Belohnungswerts. Vorgesehen: der Container-Fund faellt einmal je
  MISSION statt je gewonnenem Check, und `winResources` traegt den Rest (x13,8). **Bewusst NICHT
  ueber die Container-INHALTE zu loesen** - `CONTAINER_TYPES` haengt an Raids und Elite-Bollwerk, und
  Entscheidung 3 ist gegen genau diese Inhalte geschlossen; eine Kuerzung dort haette sie wieder
  aufgerissen.
- **Nutzerentscheidung 19.08.2026: der Imperator bekommt KEINE Wrack-Bergung.** Prestige-Schiff,
  kaputt ist kaputt, keine Teile-Rueckgabe. Beim Einbau ueber die Kosten-Tabelle loesen: Einheiten
  ohne Ressourcen-Kosten sind ausgenommen (der Imperator ist die einzige).
- **`RAID_WAVE_ROLL` ist freigegeben, `PIRATEN_MULTIPLIER_ROLL` NICHT.** Entscheidung 10 ist
  gebaut, damit faellt die erste Sperre. Die zweite haengt an der Einnahmen-Baseline, und die hat
  sich real noch nicht verschoben - Block A Schritt 2 ist nur kalibriert. **Die Sperre faellt mit
  dem Einbau, nicht mit der Messung.** *Ergaenzt am 19.08.2026 (spaeter Abend):* der einzige
  Grund, aus dem beide Regler ueberhaupt gebraucht worden waeren - der Ausgleich fuer
  Entscheidung 16 -, ist weggefallen. Beide bleiben unangetastet; die Frage stellt sich erst
  wieder, wenn ein anderer Inhalt sie braucht.
- **NEU 19.08.2026: Block C, Schritt 10 ist erledigt - und Entscheidung 16 ist damit
  entsperrt.** Entscheidung 10 wurde umgesetzt, aber mit einem ANDEREN Mechanismus als im Plan
  vorgeschlagen: der dort genannte Flotten-Rueckzug wurde gebaut, gemessen und als wirkungslos
  belegt (92,2 -> 95,5 % Flottenverlust). Stattdessen ein **Neulingsschutz**
  (`NEWCOMER_GRACE_DAYS = 14`): waehrend der Schonfrist entfaellt der Ressourcen-Diebstahl und die
  verteidigende Flotte wird zurueckgeschlagen statt vernichtet, die Belohnung bleibt. Messkasten am
  Kopf von Entscheidung 10, Protokoll `raid_e10.txt`.
- **Wichtigste Einsicht daraus, gilt ueber Entscheidung 10 hinaus:** ein Neuling verliert je Raid
  eine Flotte im Wert von 0,32 Mrd und kassiert 20,23 Mrd Belohnung. Der viel zitierte
  "100 % Flottenverlust" ist ein Gefuehls-, kein Wirtschaftsproblem. Vor der naechsten
  Verlust-Diskussion zuerst den Gegenposten rechnen.
- **NEU 18.08.2026 (Abend): Block C, Schritt 8 ist erledigt** - Entscheidung 6 (Schiffs-Tiers) ist
  umgesetzt und gegengemessen. Fuenf Kostenzeilen in `data/ships.ts`, Zielwert 1,15, keine
  Mechanik. Korridor und Duell-Kriterium erfuellt (Spannweite -47 %), die Sektor-Zelle laeuft
  gegenlaeufig: wer billiger einkauft, kauft sich einen staerkeren Gegner, weil die Gegnerstaerke
  an der MACHT haengt und nicht am ausgegebenen Wert. Messkasten am Kopf von Entscheidung 6,
  Messdatei `ship_tiers.txt`.
- **NEU 18.08.2026 (Abend): RapidFire nach Klassen ist vollstaendig gemessen und als
  Entscheidung 16 im Plan eingetragen - bewusst NICHT gebaut.** Ausloeser war ein Nutzerbefund
  ("die RF kommt mir falsch vor, Kaempfe kommen linear vor"), NICHT dieselbe Meldung wie bei R14.
  Kandidat ist Variante A (jedes Schiff kontert die eigene Klasse, waehlt aber EIN Ziel) plus
  abgesenktem Groessen-Ausweichbonus. ~~Gesperrt bis Entscheidung 10 steht~~ - **UEBERHOLT durch
  die zweite Messrunde am 19.08.2026: die Sperre wird gar nicht gebraucht, der dort geforderte
  Ausgleich ueber die Gegnerstaerke beruhte auf einer falsch gelesenen Prozentzahl.** Siehe den
  Stand-Eintrag ganz oben. Messdatei `rf_depth.txt`.
- **NEU 18.08.2026 (Abend): Block B ist entschieden, aber nirgends gebaut.** 4.1 bis 4.4 stehen
  nicht im Code (kein `ADMIRAL_DEFEAT_LOSS_SHARE`, `contributedPower` nur beim Flottenstart,
  `ADMIRAL_MULTIPLIER_ROLL` unveraendert 1,10/1,30/1,50, Boss-RapidFire unveraendert). Gleiche
  Fehlerform wie bei Block A Schritt 2 - "geschlossen" heisst in diesem Plan ENTSCHIEDEN, nicht
  GEBAUT. Vor jeder Umsetzungs-Session zuerst pruefen, was tatsaechlich im Code steht.
- **NEU 18.08.2026 (Abend): die Aggregations-Grundsatzfrage ist erneut gestellt und erneut
  geschlossen worden** - diesmal vom Nutzer selbst, und diesmal mit Zahlen. Siehe den Abschnitt
  "Gesetzt und NICHT neu aufzurollen" unten.
- **R14 IST ERLEDIGT** (17.08.2026), zusammen mit dem bei der Umsetzung gefundenen **R14b**
  (Durchschlag im Aggregat-Pfad). Neu aufgetaucht ist **R15** - siehe unten. Die Kampf-Engine ist
  damit wieder vollstaendig; alle KAMPF-Messungen von vor dem 17.08.2026 sind gegen eine Engine
  gelaufen, in der RapidFire fuer grosse Flotten faktisch abgeschaltet war.
- **4.3 IST WIEDER GESCHLOSSEN - der Faktor steht jetzt auf 1,6x** (17.08.2026, nach R14 neu
  bestimmt). 1,75x war die als riskant benannte Zahl, das Risiko ist eingetreten und die Zahl ist
  ersetzt. Einzelheiten unten und im Messkasten bei 4.3.
- **BLOCK C, SCHRITT 6 IST ERLEDIGT: Entscheidung 13.3** (Bot- und Basis-Wachstum von der
  Aufruf-Haeufigkeit entkoppelt). Damit ist der Messblocker aus Punkt 5b weg - Messungen an den
  Piratenbasen sind ab jetzt reproduzierbar. Einzelheiten unten.
- **BLOCK C, SCHRITT 7 IST ERLEDIGT: Entscheidung 5** (18.08.2026, Piratenbasen). Garnison skaliert
  mit der angreifenden Flotte, `SEED_FLEET`-Boden gestrichen (5a), Schranke gegen Dauer-Farming
  zweiteilig (Erholungszeit 20 h begrenzt die Haeufigkeit, Attritions-Deckel 0,35 plus Wiederaufbau
  ueber 3 Tage begrenzen den Ertrag), Beute aus der vernichteten Garnison. Naechster Schritt in
  Block C ist 8 (Entscheidung 6, Schiffs-Tiers) - die Schritte 8 bis 12 sind voneinander
  unabhaengig.
- **4.6 UND 4.7 SIND GESCHLOSSEN** (18.08.2026, ohne Messung bestaetigt): Sieg-Bonus **2,0x**,
  Niederlage-Auszahlung 50 % **auf die bis zum letzten ueberstandenen Check gesicherte Beute**. Von
  Block B ist damit nur noch 4.8 (Cooldown) offen.
- **15 Entscheidungen, 13 Reparaturen.** Fuer jeden offenen Punkt steht entweder die Zahl oder die
  Regel, nach der sie bestimmt wird. Eine Umsetzungs-Session braucht keine Entscheidungsrunde mehr.
- **BLOCK A IST VOLLSTAENDIG** (seit 15.08.2026). Geschlossen sind Schritt 1 (Messreihen nach dem
  Overkill-Deckel), Abschnitt 8 Punkt 3 (Imperator-Einstufung), Abschnitt 8 Punkt 1
  (Beute-Exponent), das gesamte Raid-Paket (Schritt 3) und zuletzt **der Niveau-Punkt aus
  Abschnitt 7**.
- **BLOCK B, SCHRITT 4 IST GESCHLOSSEN** (15.08.2026): Entscheidung 4.1 (Verlust-Kriterium) und
  4.2 (contributedPower-Freeze).
- **BLOCK B IST WIEDER VOLLSTAENDIG** (17.08.2026, zweite Fassung). Schritt 5: **4.3 steht auf
  Faktor 1,6x** plus Boss-Forschungsskalierung, **4.4 ist entschieden** (RapidFire umstellen,
  Mehrfachziel-Salve verworfen), 4.5 entfaellt, 4.6/4.7/4.8 haben Vorschlaege, die keine Messung
  mehr brauchen. R14 hatte davon nur 4.3 wieder aufgerissen; 4.4, 4.5 und die uebrigen Punkte
  blieben unberuehrt, weil sie Vergleiche unter gleichen Bedingungen waren.
- **Achtung bei der Nummerierung:** "Entscheidung 3" in Abschnitt 2 ist der RAID-ERTRAG,
  "Abschnitt 8, Punkt 3" ist die IMPERATOR-Einstufung. Zwei verschiedene Dinge. In frueheren
  Fassungen dieser Datei standen sie einmal vertauscht.
- **Am Spielcode wurde seit dem 10.08.2026 erheblich geaendert** - 14 Punkte, vollstaendig in
  Abschnitt 2a dokumentiert. Die urspruengliche Regel "in dieser Phase kein Code" gilt weiterhin
  fuer die Balance-Bloecke A bis F, aber nicht mehr absolut; der Massstab fuer Ausnahmen steht in
  Abschnitt 8.
- **Die Baseline 21,69 Mrd/Tag aus Abschnitt 1 ist ueberholt.** Gemessen sind 0,80 / 19,82 /
  76,85 Mrd/Tag (frueh/mittel/spaet, inkl. Allianz-Station). Jede Zahl im Plan, die gegen die alte
  Baseline gerechnet ist, ist entsprechend zu lesen.
- Die meisten noch offenen Zahlen im Plan sind **gerechnet, nicht gemessen**. Das ist Absicht.
  Ausnahmen seit dem 14.08.2026: der Beute-Anker (rund 0,094-0,096 Wert-Einheiten je Punkt
  vernichteter Feindmacht - er streut ueber Laeufe um rund 2 %, also nicht auf die dritte
  Nachkommastelle abstellen) und der Beute-Exponent (0,85) sind jetzt gemessen. Seit dem
  15.08.2026 zusaetzlich das gesamte Raid-Paket, seit dem 16.08.2026 die Gegnerstaerke des
  Piratenadmirals.
- **Der Elite-Anteil an der Baseline ist 56,58 Mrd/Tag**, nicht 56,9. Der gerundete Wert steht an
  mehreren Stellen im Plan; massgeblich ist `income_level.txt`.
- **ACHTUNG, ENTGEGEN DER OBIGEN ZEILE "BLOCK A IST VOLLSTAENDIG": Schritt 2 (Entscheidung 2) ist
  ENTSCHIEDEN, aber NICHT GEBAUT** (gefunden am 18.08.2026 bei Entscheidung 5). Weder der
  Beute-Exponent 0,85 noch die Wrack-Bergung 30 % stehen in `missions.ts`/`groupOps.ts`;
  `fleetSizeRewardMultiplier()` laeuft dort unveraendert. "Vollstaendig" bezieht sich auf die
  ENTSCHEIDUNGEN und MESSUNGEN, nicht auf den Code. Die Kurve existiert seit dem 18.08.2026 als
  `LOOT_CURVE_*` in `data/economy.ts` und wird bisher nur von den Piratenbasen benutzt - wer
  Schritt 2 baut, benutzt DIESE Konstanten und legt keine zweite Kurve an.
  **Stand 19.08.2026: unveraendert gueltig.** Der Schritt ist seitdem zusaetzlich vollstaendig
  KALIBRIERT (alle Konstanten gemessen, Koop-Frage entschieden, Bauanleitung im Messkasten am Kopf
  von Entscheidung 2) - am Code hat sich nichts geaendert.
- **Solo Hoch netto: massgeblich ist `real_fleet.txt` mit -3,26 (voll) / -3,40 (mittel) Mrd/Tag.**
  Die frueher hier genannten -2,97 stammen aus einem aelteren Lauf.

## Was seit dem 10.08.2026 live gegangen ist

Kurzfassung, Einzelheiten je Punkt in Abschnitt 2a:

**Behobene Defekte**
- Overkill-Deckel bei Aggregat-Stapeln (Entscheidung 1) - 101 Kreuzer verloren vorher 100 %, jetzt
  35 %
- Gebaeude-Module der Heimatbasis fuer V2/V3 (Entscheidung 14) - bauten vorher 4x langsamer
- Allianz-Station: Ertrags-Relation 7.1 + Ausgleich der fehlenden Mining-Kopplung
- Punkte-Exploit beim Verschrotten (R6), tote Eskalations-Konfiguration (R2), `claimedBy` (R7),
  `defenseFactor` dreifach dupliziert (R4), `totalOwnedShips()` (R13, mit Ratschen-Absicherung),
  Startpruefung fuer Modul-IDs (R12), Changelog (R11)
- **Sparfalle bei Bots und Piratenbasen** - beide standen 13 Tage bei Minenstufe 11 und starteten
  kein einziges Gebaeude mehr
- **Versteckte Ausbaugrenze der Piratenbasen** - `RESOURCE_CAP` begrenzte ungewollt den Ausbau,
  heisst jetzt `LOOT_BASIS_CAP` und wirkt nur noch auf die Beute
- **Cross-User-Sweeps gedrosselt** - liefen alle 3 Sekunden pro Client statt alle 30 Sekunden,
  Hauptverursacher der Serverlast
- KI baute nur Leichte Jaeger (feste Bestellmenge), stationierte Flotten waren eingefroren,
  angekommene Halte-Flotten verschmelzen jetzt
- Raid-Kampfberichte liessen sich auf Mobil nicht seitlich wischen

**Balance-Aenderungen**
- Kampf-Klassen neu austariert, mit situativen Aufschlaegen (Abschnitt 4a)
- `MAX_PLAYER_SHIPS` von 200.000 auf 1.000.000
- Abschuss-Punkte nach Beitrag statt voll je Teilnehmer

## Drei Dinge unter Beobachtung (Stand 13.08.2026)

1. **Bots und Piratenbasen entwickeln sich wieder** - Minen von Stufe 11 auf 16 innerhalb eines
   Tages, Forschung laeuft ebenfalls. Flotten sollten sich ab jetzt durchmischen.
2. **Serverlast nach der Drosselung** - die `runGlobalHeartbeat`-Warnungen sollten weitgehend
   verschwunden sein.
3. **Ungeklaert: 435 KB laut Datenbank gegen 761 KB im Speicher** fuer denselben Spielstand.
   Steht in Abschnitt 2a, Punkt 12.

## Offene Punkte, die NICHT im Plan stehen koennen

**Mobil-Punkte M2 bis M10 brauchen ein Geraet.** Neun Verdachtsstellen aus dem Code (feste Breiten
in Login, Haendler, Gebaeude, Allianz; ungeprueft Galaxie, Statistik, Kampf-Visualisierung). Aus dem
Code heraus nur vermutbar, nicht bestaetigbar. Pruefablauf in `MOBIL_CHECKLISTE.md`. M1 und der
Raid-Bericht sind erledigt.

**R13 wartet auf nichts mehr.** Der frueher hier vermerkte Bedarf nach einer Zahl vom Nutzer ist
entfallen - die Korrektur ist mit einer Ratschen-Obergrenze abgesichert, die niemanden rueckwirkend
aussperrt.

## Gesetzt und NICHT neu aufzurollen: Stack-Aggregation statt Einzelberechnung

Festgehalten am 17.08.2026, weil dieser Vorschlag bei Kaltstarts immer wieder von selbst entsteht -
zuletzt in derselben Sitzung, in der R14 repariert wurde.

**Wie es dazu kam.** Ursprünglich wurde jedes Schiff einzeln berechnet, ohne Aggregat. Bei grossen
Flotten führte das zu CPU-Last über 300 % und minutenlangen Kampfberechnungen. Der Nutzer stand
damals vor genau zwei Möglichkeiten: **Stack-Aggregation** oder **Schiffsbegrenzung pro Mission**
(dann wäre die Einzelberechnung erhalten geblieben). **Er hat sich bewusst für die Aggregation
entschieden, weil grosse Flottenzahlen zum Spielgefühl gehören.**

**Diese Entscheidung bleibt.** Sie ist am 17.08.2026 ausdrücklich bestätigt worden, nachdem der
Gegenentwurf (wenige Einheiten mit hohen Werten, Staffeln statt Einzelschiffen, Piraten stärker
statt zahlreicher, Begrenzung der Schiffstypen je Mission) durchgesprochen war. Ausschlaggebend ist
nicht die Technik, sondern das Spielgefühl: **zwei Spieler, und für die zweite Person sind viele
Schiffe der Kern des Spiels.** Ein Umbau, der das abschafft, ist deshalb keine Option - unabhängig
davon, wie sauber er rechnen würde.

**Erneut gestellt und erneut geschlossen am 18.08.2026 - diesmal mit Zahlen.** Der Nutzer hat die
Frage selbst wieder aufgemacht ("lieber Schiffe begrenzen und jedes einzeln simulieren, aber nicht
ueber 1 Sekunde Latenz"). Gemessen mit dem Messbuild aus R14 (Aggregation komplett aus), gemischte
Flotte, Gegner jeweils aehnlich gross:

| eigene Schiffe | mit Aggregat | ohne Aggregat |
|---|---|---|
| 1.260 | - | 136 ms |
| 6.300 | 77 ms | 702 ms |
| 12.600 | - | 1.668 ms |
| 25.200 | 29 ms | 5.524 ms |

Die Ein-Sekunden-Grenze liegt damit bei rund **8.000 eigenen Schiffen**. **Nutzerentscheidung:
Aggregation bleibt** - und die Begruendung ist diesmal nicht nur Spielgefuehl, sondern eine
konkrete Zelle: am Raid-Tag treffen eigene Flotte, Verteidigungsanlagen und fremde Verstaerkung in
EINEM Kampf zusammen, die 8.000 waeren dort die Obergrenze fuer die Summe aller Beteiligten.

**Festgehalten, nicht umgesetzt:** heute ist die Aggregation alles-oder-nichts je Typ - ueber der
Schwelle wird der GANZE Typ zu einem einzigen Stapel. Eine gedeckelte Stapelgroesse (50.000 Jaeger
als 100 Stapel zu 500 statt als einer) waere der Mittelweg zwischen Genauigkeit (R15) und
Rechenzeit und mit demselben Messbuild-Verfahren messbar. Das ist die einzige Richtung in diesem
Themenfeld, die noch offen ist.

**Für Folge-Chats heisst das:**
- Vorschläge in Richtung "Einzelberechnung wiederherstellen", "Schiffe pro Mission begrenzen",
  "Staffeln statt Einzelschiffen", "1 Schiff ersetzt 500" NICHT erneut aufmachen. Sie sind geprüft
  und aus einem nicht-technischen Grund verworfen.
- Fehler IM Aggregat-Pfad bleiben selbstverständlich Fehler und werden behoben (so geschehen bei
  Entscheidung 1 und bei R14/R14b). Der Massstab ist unverändert: die Aggregation ist eine reine
  Performance-Optimierung und darf das Kampfergebnis nicht verändern.
- **R15 ist die bekannte Restabweichung** (Aggregat-Ziele explodieren nicht, Stapel rechnet Schaden
  sofort anteilig in Verluste um). Dokumentiert, nicht dringend, und ausdrücklich KEIN Anlass, die
  Grundsatzfrage neu zu stellen.

**Der eigentliche Schmerzpunkt liegt woanders.** Die Nutzerbeobachtung lautet: "bei rund 400.000
Schiffen lohnt sich kein Flug mehr, die Verluste übersteigen den Gewinn." Das ist gemessen richtig
(Solo Hoch -2,97 Mrd/Tag), hängt aber an der **Beutekurve und am Einnahmen-Niveau**, nicht an der
Aggregation: die Beute wächst mit Exponent 0,85 unterproportional, der Verlust linear. Das ist im
Plan als offener Punkt geführt (Abschnitt 7, Niveau-Punkt). Der beschlossene Server-Reset stellt
ohnehin auf die Aufbauphase zurück, in der die Bilanz noch stimmt.

## Fallen, die schon zugeschnappt sind

**Eine Belohnung ist erst dann skalierbar, wenn der groesste Posten skaliert.** Entscheidung 2 war
als Ressourcen-Kurve gedacht. Bei den Solo-Sektoren steckten aber 94 % des Belohnungswerts in
CONTAINERN (1x Elite ~238 Mio Wert gegen ein Ressourcen-Paket von 14 Mio je Sieg) - eine Kurve auf
die restlichen 6 % haette gar nichts bewirkt. **Vor jeder Belohnungsaenderung erst die
Zusammensetzung des Ertrags nachrechnen, nicht die Zahl im Config-Feld ansehen.** Dieselbe Falle
andersherum beim Elite-Bollwerk: dort sind Container nur 20 %, deshalb war dort nichts zu aendern.

**Bei jeder Regel, die mit der Teilnehmerzahl skaliert, zuerst pruefen, ob BOTS teilnehmen
koennen.** Die Koop-Varianten V1/V2/V3 waren sauber gegeneinander gemessen (`elite_coop.txt`), und
V1 sah mit x1,82 je Teilnehmer nach dem gewollten Anreiz aus. Nicht in der Messung sichtbar:
`bot.ts` nimmt Elite-Einladungen automatisch an und schickt 30 % seiner Flotte. Unter V1 waeren
zwei eingeladene Bots ein Ein-Klick-Einkommensmultiplikator gewesen. Die Messung war richtig, die
Frage war unvollstaendig gestellt.

**Ein stufenloser Faktor auf eine ganzzahlige Belohnung ergibt beim kleinsten Ausbaustand NULL.**
Der erste Entwurf skalierte die Container-Menge mit dem Kurvenfaktor. Beim fruehesten Ausbaustand
liegt der bei rund 0,13 - "1x Elite-Container mal 0,13" ist abgerundet nichts. Aufgefallen ist es
erst beim Nachrechnen der Startphase, nicht beim Bauen. **Bei jeder multiplikativen Aenderung an
einer Stueck-Belohnung den kleinsten Fall durchrechnen.**

**Eine Erstattung auf Verluste ist eine Punkte-Quelle.** Die Wrack-Bergung gibt 30 % zurueck -
denselben Satz wie der Schrotthaendler. Ohne Gegenmassnahme waere "Schiffe im Kampf verheizen" ein
besserer Punkte-Farm als das Verschrotten derselben Schiffe geworden, weil beim Verschrotten die
kumulierten Ausgaben korrigiert werden (R6) und bei einem Kampfverlust bisher nicht. Behoben durch
denselben Abzug. **Jede neue Rueckerstattung gegen die Punkte-Buchhaltung in `stats.ts` pruefen.**

**Eine Verlustzahl ohne ihren Gegenposten ist keine Aussage.** Entscheidung 10 stand ueber Wochen
auf "100 % Flottenverlust bei schwachem Ausbau ist inakzeptabel". Gerechnet: die Flotte ist
0,32 Mrd wert, derselbe Raid zahlt 20,23 Mrd. Vier gemessene Reparatur-Varianten waren deshalb von
vornherein Arbeit an der falschen Zahl. **Vor jeder Verlust-Diskussion den Gegenposten rechnen.**

**Ein Mechanismus kann exakt das Richtige tun und trotzdem nichts bewirken.** Der Flotten-Rueckzug
loest aus, wenn eine Einheit auf 30 % IHRER Panzerung faellt. Bei schwachem Ausbau werden kleine
Schiffe in EINER Welle vernichtet - sie durchlaufen dieses Fenster nie. **Bei jeder
Schwellenmechanik pruefen, ob die geschuetzten Einheiten den Schwellenbereich ueberhaupt
durchlaufen.**

**Ein Vorschlag kann gegen die eigene Sperrliste laufen, ohne dass es auffaellt.** Am 18.08.2026
stand am Ende der RF-Messung der Vorschlag, die Gegnerstaerke nachzuziehen
(`PIRATEN_MULTIPLIER_ROLL`, `RAID_WAVE_ROLL`) und die Reparaturquote zu senken. **Alle drei waren
gesperrt** - die Sektorstaerke beruehrt die geschlossene Einnahmen-Baseline, `RAID_WAVE_ROLL` darf
nach Abschnitt 8 Punkt 7 erst nach Entscheidung 10 angefasst werden, und die Reparaturquote steht
nach Abschnitt 4a bewusst unangetastet (das Bollwerk gewinnt heute NUR ueber den
Verteidigungsanlagen-Verlust, eine Senkung nimmt ihm seinen einzigen gemessenen Vorteil). Der
Nutzer hat es gefunden, nicht die Messung. **Vor jedem Vorschlag, der eine Konstante anfasst,
zuerst pruefen, ob sie in einer geschlossenen Entscheidung vorkommt** - `grep` auf den
Konstantennamen im Plan kostet zehn Sekunden.

**Ein Umbau kann ein globaler Buff sein statt einer Umverteilung - und das sieht man erst an der
dritten Zelle.** Klassen-RapidFire sah in den Sektor-Zellen wie eine Angleichung zwischen den
Klassen aus (Kreuzer/Elite von 0 auf 100 % Siegquote). Die Raid-Gegenmessung zeigte, dass auch die
starke Seite gewinnt: der Verteidigungsverlust faellt auf 0,0 %, weil die Wellen fallen, bevor
Schaden bis zu den Anlagen durchkommt. **Bei jeder Aenderung an einer Kampfregel mindestens eine
Zelle messen, in der der Spieler NICHT der Angreifer ist.**
*Nachtrag 19.08.2026: die Regel bleibt richtig, die daraus gezogene Folgerung war falsch.* Die
0,0 % waren kein Buff, sondern eine Verschiebung von den 0,43 Mrd teuren Anlagen auf die 5,52 Mrd
teure Flotte - in Wert-Einheiten 29 % MEHR Verlust. **Dieselbe Falle wie bei Entscheidung 10, zum
zweiten Mal: eine Verlustzahl ohne ihren Gegenposten ist keine Aussage** (Messregel 4). Sie ist
diesmal nicht am rohen Prozentwert gescheitert, sondern daran, dass zwei Prozentwerte mit
VERSCHIEDENEN Bezugsgroessen nebeneinanderstanden. **Wenn zwei Quoten sich gegenlaeufig bewegen,
zuerst beide Nenner hinschreiben, dann erst deuten.**

**Ein Messbuild ist erst Beweismittel, wenn er einen bekannten Zustand reproduziert - und der
Vergleich muss normiert sein.** Der kumulative Build vom 19.08.2026 lag in der rohen Solo-Zelle
5,7 % ueber der Referenz und waere danach verworfen worden. Auf die vernichtete Feindmacht
normiert liefert er 0,0733 statt 0,0732 Wert-Einheiten je Punkt - 0,1 % Abweichung, der Rest war
Kampf-Streuung (gewonnene Checks 4,3 gegen 4,7). **Belohnungszellen vor jedem Vergleich auf die
vernichtete Feindmacht normieren.**

**Eine Wahl, die der Spieler nicht sehen kann, ist keine Wahl.** Die gesamte erste RF-Messrunde ist
nach Wellenprofilen aufgeschluesselt - und das Wellenprofil wird pro Check gewuerfelt und ist im
Client nirgends sichtbar (gegreppt, kein Treffer). Die Einzelprofil-Zellen sind damit Diagnose,
nicht Abnahme; massgeblich ist der profilgewichtete Schnitt. **Vor jeder Auswertung nach Fall X
pruefen, ob der Spieler ueberhaupt weiss, in welchem Fall er steckt.**

**Ein Symptom kann drei Regler ueberleben.** Bevor die 0,0 % als "globaler Buff" erkannt waren,
sind drei naheliegende Ursachen geprueft und alle widerlegt worden: Reparaturquote, Verteidigungs-
Gewicht und eine eigene Belagerungs-RF gegen Anlagen, auch in Kombination und mit schwaecherem
RF-Wert. **Wenn kein Regler wirkt, ist die Ursache eine Ebene hoeher.**

**Eine Kennzahl in einer Zelle, die ohnehin jeder gewinnt, misst nichts.** Die erste RF-Messrunde
lief bei realistischer Feindstaerke (0,85x) - dort gewinnt jede Aufstellung zu 100 % bei 1-7 %
Verlust, und die Spannweite zwischen den Aufstellungen ist Rauschen. Erst bei 2,0x wurde die Frage
"zaehlt die Zusammensetzung ueberhaupt" messbar. **Vor der Messung pruefen, ob die Zelle die Frage
entscheiden KANN** (verwandt mit der `mittel`/1,6x-Falle weiter unten, aber die andere Richtung:
dort lag die Kennzahl im Zielband bei 0 % Sieg, hier bei 100 %).

**Ein Messwerkzeug misst nicht automatisch das, wonach gefragt ist.** Am 17.08.2026 bei 13.3
zweimal hintereinander passiert, beide Male sah das falsche Ergebnis wie ein Befund aus:
(a) gemessen wurden gebaute Einheiten statt Bau-Entscheidungsschritte - Ergebnis "x0,94, also kein
Defekt", tatsaechlich gemessen wurde das Slot-Limit, das im kurzen Zeitfenster viel frueher bindet;
(b) der Zaehler stand hinter einer kompilierten `for`-Schleife OHNE geschweifte Klammern und zaehlte
dadurch Ladevorgaenge statt Zuege - Ergebnis "x10.082, Drosselung wirkungslos". **Vor der Auswertung
pruefen, ob der Messwert ueberhaupt die Groesse ist, um die es geht, und ob ein anderer Engpass
frueher bindet.**

**Eine Kennzahl kann im Zielband liegen und trotzdem nichts wert sein.** `mittel`/real erreicht bei
1,6x eine Check-Tiefe von 3,80, also mitten im Zielband 3-5 - bei 0 % Siegquote. Die Tiefe allein
sagt nichts; sie muss immer zusammen mit der Ausgangsverteilung gelesen werden.

**Die README im Repo hat KEINE nummerierten Punkte mehr.** Eine aeltere Fassung mit 33 nummerierten
Punkten kursiert und wird bei Kaltstarts immer wieder mitgeliefert; sie ist an mehreren Stellen
sachlich falsch (Imperator-Baulimit, Salvenschiff-Limits, Asteroiden-Laufzeit, Kampf-Performance um
Faktor 100). **Nicht verwenden.**

**Stille Ausweichwerte.** `moduleBoostFactor()` und `moduleReductionFactor()` liefern bei unbekannter
ID 1 - Verhalten im Sinne des Codes korrekt, im Sinne des Spiels falsch. R12 prueft das jetzt beim
Serverstart.

**Client-Spiegel laufen auseinander.** Bekannt sind `lib/multipliers.ts`, `lib/combatInfo.ts`,
`pages/Allianz.tsx` und `pages/Sektor.tsx` - letztere zeigte live falsche Zahlen an. Die Liste ist
erfahrungsgemaess unvollstaendig: **vor jeder Server-Aenderung im Client nach dem Funktionsnamen
greppen.** Konstanten gehoeren ueber `/game/data` an den Client, nicht als zweite hartkodierte Zahl.

**Eine Messung an einem einzelnen Check ist kein Rahmen fuer eine Serien-Entscheidung.** Abschnitt G
von `admiral_defeat.txt` misst nur Check 1 und wies einen Kippbereich von 2x bis 4x aus; ueber die
volle Serie liegt er bei 1,25x bis 2x. Am 16.08.2026 waere fast gegen den falschen Bereich
kalibriert worden.

**Eine Faehigkeit aus mehreren Bedingungen vor der Messung auf ALLE Bedingungen pruefen.** Die in
4.4 beschriebene Aenderung haette zur Haelfte gar nicht gewirkt: die Mehrfachziel-Salve braucht
neben dem Eintrag in `MULTI_TARGET_VOLLEY_SHIPS` und der RapidFire-Tabelle noch einen
`ZIELERFASSUNG_BASE`-Eintrag, den der Boss nicht hat - ohne ihn ist die Trefferchance 0. Ohne die
Code-Pruefung waere das als "gemessen und harmlos" ins Protokoll gegangen.

**Eine Mehrfachziel-Faehigkeit braucht mehrere Zieltypen in der Testflotte.**
`run_aggregate_threshold.mjs` stellt dem Boss 90 bis 400 Kreuzer gegenueber - bei einem einzigen
Typ ist die Salve definitionsgemaess ein normaler Treffer. Vier Varianten massen sich dort auf die
Nachkommastelle gleich, obwohl sie in der Mischflotte um Faktor 20 auseinanderliegen.

**Vor dem Kalibrieren pruefen, ob eine Sicherheitskonstante mitentscheidet.** `MAX_ROUNDS` galt als
reines Sicherheitsnetz und war tatsaechlich der Grund, warum starke Konten den Boss nicht toeteten.
Ein Faktor, der dagegen kalibriert wird, ist gegen ein Artefakt kalibriert.

**Selbstgebaute Simulationen sind erst dann Beweismittel, wenn sie einen bekannten realen Zustand
reproduzieren.** Am 12.08.2026 zeigte eine eigens gebaute Wirtschaftssimulation keinen Unterschied
zwischen kaputtem und repariertem Code und liess den Bot auf 2,5 Billionen Metall wachsen - drei
Groessenordnungen ueber der Realitaet. Belegt wurde am Ende ueber den echten Datenbankzustand.

**Eine Konstante, gegen die abgewogen wird, kann durch eine andere Aenderung bedeutungslos werden -
ohne dass irgendetwas bricht.** `bot.ts` verglich die geplante Angriffsflotte gegen den BESTAND
einer Piratenbasis mal `ATTACK_POWER_SAFETY_MARGIN`. Seit die Garnison mit dem Angreifer skaliert
(18.08.2026), ist der Bestand nicht mehr die Gegnerstaerke - die Bedingung waere praktisch nie mehr
erfuellt gewesen und Bots haetten nie wieder eine Basis angegriffen. Kein Fehler, keine Warnung, nur
eine Funktion, die aufhoert zu wirken. **Bei jeder Aenderung an einer Gegnerstaerke pruefen, welche
ABWAEGUNGEN sich auf die alte Groesse stuetzen.**

**Eine Bremse gegen Dauer-Farming kann den Inhalt auch ganz toeten.** Beim ersten Bau von
Entscheidung 5 loeschte EIN Angriff der realen Flotte die komplette Garnison einer Basis (die Welle
war zu 100 % vernichtet, also traf der Verlustanteil 100 % auf jeden Einheitentyp). Rechnerisch
waere die Basis Monate lang wertlos gewesen - aus "totes Feature" waere "totes Feature nach vier
Angriffen" geworden. Aufgefallen ist es nur, weil die Serien-Messung ueber FUENF aufeinanderfolgende
Angriffe lief statt ueber einen. **Wer eine Ressource abbaubar macht, misst nicht den ersten
Abbau, sondern den fuenften.**

**Eine Frage kann in einer bereits getroffenen Entscheidung schon beantwortet sein - nur nicht
sichtbar.** Der Nutzer fragte am 18.08.2026 nach einem Belohnungsaufschlag je Teilnehmer fuers
Elite-Bollwerk. Die richtige Antwort war kein neuer Bonus, sondern eine Luecke in Entscheidung 2:
dort stand, DASS die Beute-Kurve auf `groupOps.ts` wirken muss, aber nicht WIE bei mehreren
Teilnehmern - und weil die Feindstaerke an der Flottensumme haengt, entscheidet genau das ueber den
Koop-Anreiz (x1,82 / x1,01 / x0,91 je nach Bezugsgroesse). **Vor jedem neuen Regler pruefen, ob eine
offene Entscheidung denselben Effekt ohnehin schon steuert.**

**Ein Messskript kann die naheliegendste Zelle auslassen.** `run_elite.mjs` misst seit Wochen
Mehrspieler-Konstellationen gegeneinander - aber nie dieselbe Flotte solo gegen zu zweit, also genau
die Frage, um die es beim Elite-Bollwerk geht. Zusaetzlich misst es Verluste in STUECKZAHLEN, was
1 leichten Jaeger wie 1 Imperator gewichtet, und nur einen Einzel-Check statt der Serie. **Bevor man
eine Frage fuer ungeklaert haelt, pruefen, ob das vorhandene Skript sie ueberhaupt stellt.**

**Coolify haelt nur die Ausgabe des aktuell laufenden Containers.** Bei jedem Redeploy ist das
Protokoll weg. Logs VOR dem Deploy abrufen, sonst ist die Spur verloren.

**Instrumentierung zuerst.** Die Ursache der langsamen ticks wurde zwei Tage lang auf Verdacht
diskutiert; die Phasen-Aufschluesselung beantwortete die Frage in einem einzigen Log - und die
Antwort war eine voellig andere als die Vermutung.

## Erster Schritt beim naechsten Mal

**Entscheidung 16 (Schritt 10a) ist ERLEDIGT im Sinne dieses Plans: entschieden, kalibriert,
gegengemessen - und wie alles andere nicht gebaut.** RF-Wert 4, Ausweichbonus 0,20 / 0,08, kein
Ausgleich ueber die Gegnerstaerke. Nichts daran ist mehr offen; wer sie anfasst, baut sie nur noch
ein (Bauanleitung im Messkasten bei Entscheidung 16).

**Damit ist Block C bis auf drei Schritte durch. Offen sind Schritt 9 (Allianz-Station),
Schritt 11 (Frischling-Bonus) und Schritt 12 (13.1) - Schritt 12 braucht die Koeffizienten aus
Entscheidung 2 und ist damit frei, weil Block A steht.**

**Der naechste Schritt ist 11 (Entscheidung 12, Frischling-Bonus), und zwar aus einem Grund, der
nichts mit der Reihenfolge zu tun hat: es ist das letzte reset-blockierende Stueck.** Abschnitt 5
nennt 10 und 12 als die beiden Punkte, die sich nicht ohne einen zweiten Reset korrigieren
lassen. 10 ist gebaut, 12 nicht.

**Zwei Dinge, die diese Session anders machen als alle bisherigen - vorher lesen, nicht erst beim
Messen entdecken:**
1. **Entscheidung 12 laesst sich nach Plantext NICHT allein kalibrieren.** Sie muss gemeinsam mit
   Entscheidung 9 (Zeit als Engpass) gegen die 30-Tage-Fortschrittssimulation aus Abschnitt 1b
   gemessen werden - beide wirken in dieselbe Richtung. **Die Simulation ist Schritt 13 und
   existiert nicht.** Die erste Aufgabe der Session ist deshalb nicht das Messen, sondern die
   Entscheidung, ob die Simulation vorgezogen wird oder ob es ein tragfaehiges Ersatzmass gibt.
   Wer das ueberspringt und den Bonus einzeln kalibriert, kalibriert ihn zweimal.
2. **Die beiden Frischling-Fenster (7 gegen 14 Tage) gehoeren mit auf den Tisch** - siehe oben im
   Stand.

**Was beim naechsten Mal ZUERST zu pruefen ist:** wie viel im Plan inzwischen den Zustand
"entschieden und kalibriert, aber nicht gebaut" hat. Das sind mittlerweile Block A Schritt 2,
der gesamte Block B und Entscheidung 16 - drei Pakete, die alle gleichzeitig live gehen.
Die Empfehlung aus der Arbeitsregel oben (Gesamtpaket ein paar Tage VOR dem Wipe auf den alten
Staenden laufen lassen) wird damit wichtiger, nicht unwichtiger.

**Der kumulative Messbuild ist ab jetzt der Normalfall, nicht die Ausnahme.** Weil drei Pakete
ungebaut auf den Neustart warten, misst jede Session, die gegen `server/dist` misst, gegen einen
Zustand, den es dann nicht mehr gibt. `make_messbuild_kum.mjs` erzeugt den Vergleichsstand:
ohne Argumente Block A Schritt 2 allein, mit `--rf=4 --evk=0.20 --evm=0.08` zusaetzlich
Entscheidung 16. Gueltige Einnahmen-Baseline ist damit **0,98 / 19,57 / 61,11 Mrd**, nicht die
alte 0,80 / 19,82 / 76,85.

**Sonst Block C weiterfuehren.** Schritt 6 (13.3), Schritt 7 (Entscheidung 5), Schritt 8
(Entscheidung 6) und Schritt 10 (Entscheidung 10) sind erledigt. Offen sind Schritt 9
(Allianz-Station), Schritt 11 (Frischling-Bonus) und Schritt 12 (13.1 - **die Sperre ist weg,
Block A steht jetzt**).

**Was Block A Schritt 2 bewusst offen laesst, in der Reihenfolge der Dringlichkeit:**
1. **Piratenadmiral P10 hat weder Kurve noch Bergung.** Seine Belohnungsmechanik ist Block B
   (4.6/4.7 entschieden, nicht gebaut) - jetzt kalibrieren hiesse zweimal kalibrieren. Wer Block B
   baut, zieht beides dort mit ein.
2. **Raids haben keine Bergung.** Entscheidung 3 ist gegen den heutigen Raid-Ertrag geschlossen;
   eine 30-%-Rueckerstattung auf Verteidigungsverluste wuerde sie wieder aufmachen.
3. **Die drei Solo-Stufen waeren nach dem Einbau beim fruehesten Ausbaustand ununterscheidbar** (netto 0,25 / 0,25 /
   0,27 Mrd, gefordert waeren +30 % je Stufe). Gehoert zu Entscheidung 12.
4. **Elite-Container sind beim fruehen Ausbaustand 84 % von 5,92 Mrd je Serie** - das Sechsfache
   der Tageseinnahmen. Keine Folge dieses Schritts, aber jetzt sichtbar.

**Erledigt am 19.08.2026 (spaeter Abend):** Entscheidung 16 haengt an nichts mehr. Die
Neuerhebung nach Entscheidung 10 und Block A ist gelaufen (kumulativer Messbuild), die IST-Zeile
hat sich dabei bestaetigt - Entscheidung 6 hat zwar den Flottenwert und damit den Nenner des
Wertverlusts verschoben (Kreuzer 2,08 -> 1,70 Mrd), die Verlustquoten in der umkaempften Zelle
sind aber praktisch unveraendert (17,3 / 47,6 / 47,4 gegen 17,3 / 47,5 / 47,4). Die
Neuerhebung war trotzdem noetig - dass sie nichts findet, weiss man erst danach.

**Vor jeder Umsetzungs-Session zuerst pruefen, was tatsaechlich im Code steht.** Der gesamte
Block B (4.1 bis 4.8) ist entschieden, aber nicht gebaut. "Geschlossen" heisst in diesem Plan
ENTSCHIEDEN. Block A Schritt 2 ist seit dem 19.08.2026 der dritte Fall dieser Art, nur eine Stufe weiter:
entschieden UND vollstaendig kalibriert, trotzdem nicht gebaut.

**Zwei Dinge, die aufgeschoben, aber nicht vergessen sind:**

- **Block A, Schritt 2 ist entschieden, aber nicht gebaut.** Der Beute-Exponent 0,85 und die
  Wrack-Bergung 30 % stehen nicht in `missions.ts`/`groupOps.ts`. Die Kurve existiert seit
  Entscheidung 5 als `LOOT_CURVE_*` in `data/economy.ts` - beim Nachbauen DIESE Konstanten benutzen,
  keine zweite Kurve anlegen. Achtung: das verschiebt die Baseline und damit alle Zellen, die gegen
  sie gerechnet sind.
- **Kein Anreiz, das Elite-Bollwerk gemeinsam zu fliegen** (Nutzerbeobachtung 18.08.2026).
  **Gemessen und beantwortet, die Entscheidung liegt jetzt bei Entscheidung 2.** Der fehlende
  Vergleich ist nachgeholt (`run_elite_coop.mjs` / `elite_coop.txt`): Belohnung je Teilnehmer solo
  und zu zweit identisch, Verluste zu zweit in allen vier Zellen hoeher. Entscheidend ist aber, dass
  die Beute unter Entscheidung 2 an der vernichteten Feindmacht haengt - und die verdoppelt sich mit
  dem zweiten Teilnehmer exakt (Faktor 2,02). Je nach Bezugsgroesse der Kurve ergibt das x1,82,
  x1,01 oder x0,91 je Teilnehmer. **Ein separater Koop-Bonus ist damit ueberfluessig**; die Frage
  faellt mit Block A, Schritt 2. Messkasten und die zwei Bedingungen (Mindestbeitrag, verschobene
  Baseline) stehen bei Entscheidung 2.

**R15 bleibt bewusst liegen** (siehe unten) - dokumentiert, nicht dringend, und ausdruecklich kein
Anlass, die Aggregations-Grundsatzfrage neu zu stellen.

## Was Entscheidung 5 am 18.08.2026 ergeben hat

Vollstaendig im Messkasten am Kopf von Entscheidung 5 und in `pirate_base.txt`. Vier Punkte, die
ueber die Entscheidung hinaus gelten:

1. **Alle drei geplanten Kandidaten lagen unter dem Abnahmeband.** 2,1-4,4 % Wertverlust je Angriff
   war das Ziel (Solo Hoch bzw. Elite, je Check); gemessen bei der realen Flotte: A 1,0 %, B 1,6 %,
   C 2,0 %. Erst ein nachgezogener Kandidat D [1,15/1,45/1,70-1,90] trifft mit 2,9 %. **Die
   ausgelieferte Tabelle liegt damit nominal ueber der des Elite-Bollwerks und erzeugt trotzdem
   weniger Verlust** - fodder-lastiger Grundbestand statt Wellenprofil, kein Kapitaen, keine
   Modifikatoren, Einzelkampf statt sechs Checks. Gleiche Zahl heisst nicht gleiche Schwierigkeit.
2. **`sideBStatsOverride` ist die dritte Fundstelle desselben Musters** (nach 4.3): wo dieser
   Parameter benutzt wird, laeuft die Forschungsskalierung aus `computePirateResearch()` NICHT mit.
   Die Basis kaempfte mit ihrer eigenen Forschung, frisch also Stufe 0. Bei jeder kuenftigen
   Nutzung zuerst pruefen, welcher Forschungsstand dort hineingehoert.
3. **Der Ausbaustand schlaegt staerker durch als jede Tabelle.** Dieselbe kleine Flotte verliert mit
   voller Forschung 4,2 %, mit schwacher 56,9 %. Weil die Garnison mindestens auf dem Stand des
   Angreifers kaempft, liegt dessen Vorsprung allein in Klasse, Modulen und Booster. Piratenbasen
   bleiben Inhalt fuer entwickelte Flotten; der Hebel dagegen waere ein Forschungsanteil unter 1,0,
   nicht die Tabelle.
4. **Zwei Planpunkte haben sich als veraltet bestaetigt:** die geforderte Neuberechnung von
   `RESOURCE_CAP` zielte ins Leere (heisst seit 12.08.2026 `LOOT_BASIS_CAP`, wirkte nur noch auf die
   Beute, faellt jetzt ganz weg), und der Baseline-Bezug "0,3 %" in der Begruendung rechnete gegen
   die alte 21,69 Mrd.

Ertrag zur Einordnung: 1,60 Mrd netto je Angriff, bei vier Basen und 20 h Erholung rund
5,9-6,4 Mrd/Tag - etwa 8 % der Baseline, zwischen Solo Hoch (-3,26/Tag) und Elite (+23,4 je Serie).

## Was 4.3 am 17.08.2026 ergeben hat (zweite Fassung, nach R14)

Vollstaendig im Messkasten bei Entscheidung 4.3. Messdatei: `admiral_bossscale_44.txt` (die
Nach-R14-Zeilen stehen dort jetzt unter einer eigenen Trennmarke - alles darueber ist gegen die
alte Engine gelaufen und nicht vergleichbar).

- **ENTSCHIEDEN: Faktor 1,6x**, plus Boss-Forschungsskalierung, Deckel 100,
  `ADMIRAL_STAT_SHARE` unveraendert 0,55.

  | Faktor | voll/real | mittel/real | schwach/real |
  |---|---|---|---|
  | 1,5x | 2,70 / 57,5 % / 20,6 % | 4,22 / 0,0 % / 36,3 % | 1,63 / 0,0 % / 40,1 % |
  | **1,6x** | **2,85 / 40,0 % / 23,2 %** und **2,70 / 45,0 % / 23,1 %** | **3,80 / 0,0 % / 35,0 %** | **1,57 / 0,0 % / 52,2 %** |
  | 1,75x | 3,85 / 0,0 % / 36,6 % | - | - |

  (Check-Tiefe / Siegquote / Wertverlust. Zwei Zeilen bei 1,6x = zwei unabhaengige Laeufe.)
- **Die Streuung ist bestimmt und kleiner als der Entscheidungsabstand** - rund 5 Prozentpunkte
  zwischen zwei Laeufen derselben Zelle gegen 12,5-17,5 Punkte zwischen 1,5x und 1,6x.
- **Fuer `mittel` ist der Faktor kein Hebel mehr** (1,5x und 1,6x ununterscheidbar, beide 0 % Sieg).
  Die Tiefe faellt dort sogar bei hoeherem Faktor - Nicht-Monotonie zum zweiten Mal bestaetigt.
- **`schwach` trifft die Wahl spuerbar, und zwar zum Schlechteren** (40,1 -> 52,2 % Verlust).
  Ausdruecklicher Nachteil, in Kauf genommen, weil `schwach` am 16.08.2026 abgeschrieben wurde.
- **Die Check-Tiefe allein ist als Abnahmemass unbrauchbar geworden:** `mittel` liegt bei 1,6x mit
  3,80 IM Zielband 3-5 und gewinnt trotzdem nie. **Tiefe und Ausgangsverteilung ab jetzt immer
  zusammen lesen.**

## Was 13.3 am 17.08.2026 ergeben hat

Vollstaendig im Messkasten bei Entscheidung 13.3. Messdatei: `base_growth_133.txt`. Neue Skripte:
`make_messbuild_133.mjs`, `run_base_growth_133.mjs`.

- **Umgesetzt:** `nextEconomyTurn` auf `PirateBaseState`, `PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS`
  (2 Min. = `HEARTBEAT_INTERVAL_MS`), `PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP` (30). Abnahme
  erfuellt: Bau-Entscheidungsschritte vorher x10.514-10.895 bei 11.000-facher Aufruf-Zahl, nachher
  x0,95-1,00.
- **Die Begruendung im Plan traegt so nicht.** Das WACHSTUM hing schon vorher nicht an den
  Aufrufen - bei reicher Basis binden die Bau-Slots, bei frischer Basis der Ressourcenstand. Was
  die Aenderung traegt, ist Reproduzierbarkeit (Punkt 5b) und Rechenlast.
- **Der Zeitstempel muss im RASTER weitergesetzt werden**, nicht auf "jetzt + Intervall" - sonst
  faellt ein Zug aus, wenn ein Aufruf kurz vor der Faelligkeit kommt (gemessen x1,18 statt x1,00).
  Bei gleichem Takt wie der Heartbeat waere das produktiv der Regelfall gewesen.
- **Zweiter Fundort derselben Fehlerform:** `GET /api/heartbeat` laeuft ohne `requireAuth`, damit
  liess sich das BOT-Wachstum von aussen beschleunigen. `HEARTBEAT_MIN_INTERVAL_MS` (60 s) greift
  jetzt; der Endpunkt meldet innerhalb des Fensters `skipped`.
- **Offen geblieben:** die Wachstumsrate der Basen ueber Tage. Braucht die gefaelschte Uhr aus
  Abschnitt 1b, bleibt Messpunkt in Abschnitt 7.

## Was R14 am 17.08.2026 ergeben hat

Vollstaendig im Messkasten **R14 - REPARATUR** unter der Reparaturtabelle in Abschnitt 3.
Messdateien: `rapidfire_aggregat.txt`, `r14_delta.txt`, `r14_perf.txt`. Neue Skripte:
`make_messbuild_r14.mjs`, `run_r14_perf.mjs`; `run_r14_delta.mjs` nimmt jetzt optional einen
einzelnen Sektor entgegen (scheibenweise messen).

- **Behoben, alles in `fireShotsAggregateShooters()`:** der Erwartungswert der Folgeschuss-Kette
  bildet jetzt die Ein-Schuss-Logik des Einzel-Pfads exakt ab; die Schuesse werden in einen
  gezielten Anteil (nur auf RF-anfaellige Ziele) und einen ungezielten aufgeteilt, statt alles
  proportional zur Stueckzahl zu streuen; `rapidFireTriggers` wird gezaehlt. **Die
  Aggregationsschwellen sind unberuehrt** - sie waren nie das Problem.
- **R14b, bei der Umsetzung gefunden und auf Nutzerentscheidung mitgeliefert:** Aggregat-Schuetzen
  bekamen hart `overkillFraction = 0`, obwohl der Einzel-Pfad den echten
  `getDurchschlagFraction()` durchreicht. Der Code-Kommentar begruendete das mit dem
  Individual-Zweig innerhalb derselben Funktion, der selbst 0 uebergab - zirkulaer.
- **Gemessen (Abnahme 1):** aggregierte Schuetzen erreichen die Schusszahlen des Einzel-Pfads
  (Kreuzer 0,97 -> 2,66 gegen 2,58 einzeln; Schlachtschiff 1,04 -> 3,33 gegen 3,31),
  `rapidFireTriggers` ueberall groesser 0 statt exakt 0.
- **Gemessen (Abnahme 3, Laufzeit):** 20.700 Schiffe kosten 10 statt 14 ms je Kampf - die
  Reparatur macht Kaempfe SCHNELLER, weil sie nur noch halb so viele Runden dauern.
  Skalierungstest mit **207.000 Schiffen**: praktisch derselbe Wert. Die Rechenzeit haengt
  weiterhin an der Typenzahl, nicht an der Stueckzahl.
- **Abnahme 2 nur teilweise - und das ist ein eigener Befund.** Die Rundenzahl faellt mit der
  Referenz zusammen, die Verlustquote nicht. Ursache diagnostiziert und ausdruecklich NICHT im
  Schuetzen-Pfad: eine Kontrollzelle "ohne Aggregation UND ohne Explosionsmechanik" reproduziert
  die Rundenzahl des Aggregat-Pfads exakt.

## R15 - der Rest liegt auf der ZIEL-Seite der Aggregation

Neu am 17.08.2026, aus dem R14-Abnahmetest, im Plan als eigener Punkt eingetragen. Zwei Ursachen:

1. **Aggregat-Stapel koennen nicht explodieren.** `EXPLOSION_HP_THRESHOLD` wirkt nur in
   `applyHitToTarget()`, also ausschliesslich auf einzelne Einheiten - aggregierte Gegner sterben
   dadurch langsamer.
2. **Ein Stapel ist ein HP-Topf.** Jeder Schadenspunkt rechnet sich anteilig sofort in tote
   Einheiten um; einzelne Schiffe muessen erst komplett durchschlagen werden, ueberleben
   beschaedigt und regenerieren ihren Schild zwischen den Runden vollstaendig. Deshalb verliert
   der Spieler ohne Aggregation ueber 16 Runden praktisch nichts (0,0-0,2 %), mit Aggregation
   3,0-9,6 %.

Punkt 2 ist die groessere Zahl und der schwerere Eingriff - er beruehrt die Grundmodellierung des
Stapels, nicht nur eine Formel. **Vorschlag: nicht vorziehen**, solange die Sektor- und
Admiral-Werte gerade frisch erhoben sind. *Nachteil, ausdruecklich:* wird R15 spaeter umgesetzt,
sind genau diese Verlustzahlen ein zweites Mal neu zu messen.

## Was nach R14 neu erhoben wurde - und was NICHT

Neu erhoben (je 40 Laeufe, Messregel 2):
- **Elite-Serie praktisch unveraendert** (Verlust 3,2 -> 3,3 % bei "2x voll"). Die Beute-Rechnung
  der Serie ist ohnehin nicht kampfabhaengig.
- **Raid: Flottenverlust 10,1 -> 13,3 %, Verteidigungsverlust 0,1 -> 22,5 %.** Der zweite Wert ist
  der auffaellige - die Heimatverteidigung ist aggregiert (Schwelle 100) und bekommt jetzt das
  RapidFire der Angreifer voll ab. "Voll ohne Kampf-Boost" springt von 14,6 auf 26,9 %.
- **Reale Flotte: Solo Hoch netto +0,11 -> -2,97 Mrd/Tag** (also jetzt ein Verlustgeschaeft),
  Elite netto 28,32 -> 21,65 Mrd. *Einschraenkung, ausdruecklich:* der alte Stand hatte nur
  5 Durchlaeufe und lag damit unter Messregel 2 - ein Teil der Differenz ist Messqualitaet, nicht
  Wirkung von R14.
- **Admiral `voll`/real** - siehe oben, das ist die gerissene Zahl.

Nicht betroffen und **nicht** neu erhoben: die Beute-Seite. Der Gegner wird mit und ohne
Aggregation zu 100 % vernichtet, damit bleiben Beute-Anker, Exponent 0,85 und die Baseline
0,80 / 19,82 / 76,85 Mrd gueltig. Ebenso unberuehrt: `MAX_ROUNDS` 100, Schwelle 0,30 und 4.4
selbst - alles Vergleiche unter gleichen Bedingungen.

**Messaufwand:** die Delta- und Sektorzellen liefen jeweils in Sekunden bis gut einer Minute, die
Admiral-Zellen in rund 30 Sekunden. **Messlaeufe scheibenweise starten** (eine Zelle je Aufruf,
Ergebnis sofort in die Datei anhaengen) - ein Vollauf ueber alle Zellen schreibt seine Tabellen
erst am Ende und ist bei einem Abbruch komplett verloren.

Die Baseline: die 21,69 Mrd/Tag aus Abschnitt 1 sind ueberholt. Gemessen sind
**0,80 / 19,82 / 76,85 Mrd/Tag** fuer den fruehen, mittleren und spaeten Ausbaustand (inklusive
Allianz-Station, die in der alten Referenztabelle fehlte); davon stellt das Elite-Bollwerk im
spaeten Stand 56,58 Mrd/Tag.

## Was 4.4 am 17.08.2026 ergeben hat

Vollstaendig im Messkasten bei Entscheidung 4.4. Messdateien: `aggregate_threshold_44.txt`,
`admiral_bossscale_44.txt`. Neue Skripte: `make_messbuild_44.mjs`, `run_aggregate_threshold_44.mjs`,
`probe_admiral_shots.mjs`.

- **Entschieden: RapidFire des Bosses auf die sechs Standardtypen umstellen, die
  Mehrfachziel-Salve VERWERFEN.** Der Faktor aus 4.3 bleibt bei 1,75x.
- **Der Plan-Vorschlag hatte eine unsichtbare dritte Bedingung.** Die Salve haengt an
  `getZielerfassungAccuracy()`, die ohne `ZIELERFASSUNG_BASE`-Eintrag 0 liefert - der Boss hat
  keinen. Der Eintrag in `MULTI_TARGET_VOLLEY_SHIPS` allein waere toter Code gewesen. **Der
  fehlende Eintrag ist jetzt eine tragende Setzung und muss im Code als bewusst ausgelassen
  kommentiert werden**, sonst traegt ihn eine spaetere Aufraeumrunde nach und sprengt die Balance
  lautlos.
- **Der Boss feuert heute exakt einen Schuss je Runde.** Mit umgestelltem RapidFire sind es 5,3,
  mit Salve 39-47,5 - und dann ist der Kampf nach zwei Runden entschieden.
- **Die Salve ist mit keinem Faktor kalibrierbar:** Check-Tiefe konstant 1,00 von 0,1x bis 1,75x,
  Kippen zwischen 0,5x und 0,75x von 100 % Sieg auf 92,5 % Niederlage.
- **Die Faehigkeit ist anti-klein, nicht anti-Masse.** Overkill-Deckel und `MAX_SHOTS_PER_UNIT`
  deckeln die Abschuesse je Runde absolut; anteilig faellt der Schaden mit wachsender Flotte
  (100 % Verlust bei 405 Schiffen, 16,5 % bei 4.500). Der Code-Kommentar behauptet das Gegenteil.
- **Der erwartete Faktor-Rutsch ist ausgeblieben.** `voll/real` misst sich mit 4.4 auf Tiefe
  3,63/3,83 gegen 3,98 ohne - Streuung, keine Verschiebung. Nachteil: die Extraktionsquote faellt
  von 12,5 auf 0-2,5 %. Offene Luecke geschlossen: `schwach/real` bei 1,75x mit 4.4 ergibt 1,52.
- **Befund am Messwerkzeug:** `run_aggregate_threshold.mjs` hat nur EINEN Schiffstyp in der
  Testflotte und kann eine Mehrfachziel-Faehigkeit deshalb prinzipiell nicht messen. Dafuer gibt
  es jetzt die Mischflotten-Fassung.

## Was Schritt 5 am 16.08.2026 ergeben hat

Kurzfassung, vollstaendig in den Messkaesten bei Entscheidung 4.3 bis 4.8. Messdateien:
`admiral_strength.txt`, `admiral_bossscale.txt`, `admiral_roundcap.txt`, `admiral_economics.txt`.

- **Ein einzelner Gegnerstaerke-Faktor trifft die Zieltiefe 3-5 nicht.** Ueber die volle Serie
  gemessen liegt das brauchbare Fenster bei `voll` zwischen 2,5x und 3,5x, bei `mittel` zwischen
  1,5x und 2,0x, `schwach` verliert schon bei 1,0x - die Fenster ueberlappen nicht. Die Tiefe ist
  ausserdem **nicht monoton**: mehr Gegnerstaerke macht die Serie kuerzer, weil bereits Check 1 die
  30-%-Schwelle reisst.
- **Der fehlende Hebel ist die Forschungsskalierung des Bosses.** `sideBStatsOverride` umgeht
  `getEffectiveStats()`: die Eskorte bekommt ueber `PIRATE_RESEARCH_SHARE = 1,0` den vollen
  Forschungsstand des Spielers, der Boss nicht. Mit Skalierung schrumpft die Spanne zwischen den
  Ausbaustaenden von rund 4:1 auf rund 1,5:1. Das stand bisher als Randnotiz unter "Ausserdem".
- **`MAX_ROUNDS = 100` ist heute eine balance-relevante Konstante und wirkt ungleich** - bei
  `voll` steigt die Siegquote von 47,5 auf 87,5 %, wenn der Deckel auf 1000 geht, bei `mittel`
  bewegt er praktisch nichts. Eine Anhebung waere ohne Nebenwirkung moeglich gewesen (kein anderer
  Sektor kommt dem Deckel nahe, Elite-Bollwerk im Schnitt 35 Runden). **ENTSCHIEDEN am 16.08.2026:
  der Deckel BLEIBT bei 100** - OGame-basierte Spiele begrenzen ueblicherweise auf 6-8 Runden, 100
  ist im Vergleich sehr grosszuegig. Der Deckel ist damit eine bewusste Gestaltungsentscheidung,
  kein Artefakt. **Folge: 4.3 steht auf Faktor 1,75x plus Forschungsskalierung des Bosses.**
- **4.5 entfaellt.** Ein freier `ADMIRAL_LOOT_PER_DESTROYED_POWER` widerspricht Entscheidung 2,
  deren Geltungsbereich `groupOps.ts` einschliesst - P10 laeuft dort. Mit der Beute-Kurve
  gerechnet: die vernichtete Feindmacht vervierfacht sich (22,6 -> 110 Mrd), die Beute steigt nur
  um Faktor 3,4, der Verlust dagegen linear. **Je haerter der Boss, desto schlechter das
  Geschaeft** - fuer `mittel` und `schwach` sogar negativ. Der Break-even-Befund aus Schritt 4 ist
  damit gegenstandslos, die Risikopraemie muss vollstaendig ueber 4.6 kommen (Vorschlag 2,0x statt
  1,5x).
- **Zwei Zahlen in 4.8 waren falsch.** Das Kampffenster sind 6 x 10 min = 1 h, nicht die 4 h aus
  `PIRATEN_CHECK_INTERVAL_MS`; die "3,8 h Hinflug" sind keine Konstante, sondern
  `galaxyDurationMs()` am langsamsten Schiff - in beiden Messflotten der Imperator (speed 100),
  also 0,08 bis 0,82 h je nach Distanz und damit 9 bis 21 moegliche Durchlaeufe/Tag. Ohne jeden
  Cooldown liegt P10 mit der Beute-Kurve bei 12 Mrd/Tag statt der frueher gerechneten 134 - der
  Cooldown bleibt richtig, ist aber eine Geschmacksentscheidung und keine Notbremse mehr.
- **Entscheidung 10 blockiert 4.3 nicht.** Der Verlust saettigt ueber alle Zellen bei 48-55 % und
  bleibt damit unter Abnahmekriterium 1 (70 %); die Obergrenze wirkt fuer P10 bereits ueber den
  gestaffelten Einzelschiff-Rueckzug.

## Was Schritt 4 am 15.08.2026 ergeben hat

Kurzfassung, vollstaendig im Messkasten am Kopf von Entscheidung 4:
- **Entschieden: Verlustmass ist der kumulierte WERT-Anteil gegen die entsandte Flotte,
  `ADMIRAL_DEFEAT_LOSS_SHARE = 0,30`** (nicht die vorgeschlagenen 0,45), und `contributedPower`
  wird je Check frisch aus der ueberlebenden Flotte berechnet.
- **Die Diagnose im Plan war ueberholt.** `result.retreated` ist nicht in 77-100 % der Kaempfe
  gesetzt, sondern in 0,0 % bei den drei realistischen Ausbaustaenden. Der Overkill-Deckel vom
  10.08.2026 hat den Verlust je Check auf 0,3-1,1 % gedrueckt.
- **Beide Reparaturen sind richtig und aendern trotzdem nichts.** Der Boss stirbt in Check 1, in
  drei von vier Profilen mit 100 % Wahrscheinlichkeit. Die Ziel-Check-Tiefe 3-5 ist ueber 4.1/4.2
  nicht erreichbar - sie haengt an Schritt 5.
- **Alle Admiral-Messdateien von vor dem 15.08.2026 sind ungueltig** (Stand 08.08.2026, also vor
  dem Overkill-Deckel und vor der Klassen-Neuaustarierung).

## Was der Niveau-Punkt am 15.08.2026 ergeben hat

Kurzfassung, vollstaendig im Messkasten am Kopf von Entscheidung 9:
- **Die Einnahmen betragen 216 bis 321 Prozent des gesamten Flottenwerts pro Tag.** Man verdient
  taeglich das Zwei- bis Dreifache der eigenen Flotte. Deshalb war das Zielband nie erreichbar.
- **Das Zielband 3-10 Tage wird umgestellt statt aufgegeben:** es gilt jetzt fuer den naechsten
  Leiter-Schritt (Gebaeude/Modul/Forschung) auf der Ressourcen-Seite - dort ist es weitgehend schon
  erfuellt - und fuer eine Flotten-Verdopplung auf der Zeit-Seite.
- **Am Einnahmen-Niveau wird nichts geaendert.** Fuer das alte Band waeren Schiffe 65- bis 220-mal
  teurer noetig gewesen.
- **Der Engpass kommt komplett aus Entscheidung 9**, und zwar aus schon beschlossenen Teilen:
  1 Lane (Faktor 3) plus additive Reduktionen fuer Schiffe (Faktor 1 bis 3, je nach Ausbaustand)
  plus Basis-Bauzeiten mal 2. Ergebnis: Flotten-Verdopplung in 12 Stunden / 2,9 Tagen /
  11,8 Tagen.
- **Ein Zielwert in Entscheidung 9 ist gestrichen:** "Bau-Ausstoss grob in Hoehe der
  Tageseinnahmen" widerspricht der Rangentscheidung direkt.
- **Zwei Nebenbefunde:** das Elite-Bollwerk stellt 74 % der Einnahmen im spaeten Stand, und
  Abnahmekriterium 5 (keine Quelle ueber 50 %) ist im fruehen Stand heute mit 89 % passiver
  Einnahmen verletzt.

## Was das Raid-Paket am 15.08.2026 ergeben hat

Kurzfassung, vollstaendig im Kopf von Entscheidung 3:
- **Ertrag: Variante 6** - fester Container-Topf je Raid nach Beitrag, PLUS Saettigung ueber die
  Tagessumme. 7,56 Mrd/Tag statt 21,4 im Ist-Zustand, Anteil 33 % statt 58 %.
- **Schwierigkeit: `RAID_ALLY_POWER_WEIGHT = 1,0`** - fremde Flotten zaehlen voll in die
  Feindstaerke. Unterstuetzung lohnt sich trotzdem (3,1 % Verlust statt 10,1 % allein).
- **Beitrags-Massstab: unveraendert.** Der Normierungs-Vorschlag aus Abschnitt 2a Punkt 14 ist
  gemessen schaedlich.
- **Wirtschaftsklassen: kein Handlungsbedarf.** Schmuggler faellt auf +0,35, bleibt vor Prospektor.

**Zwei Zahlen im Plan waren falsch und sind korrigiert:** Ein Raid bringt 22,07 Mrd und 2.080 DM,
nicht 14,51 Mrd und 1.800 DM - die alte Rechnung zaehlte nur die Container-Kategorie "Ressourcen"
mit dem rohen `chance`-Wert. Und die Empfehlung "Variante 4" im Kasten war unvollstaendig: allein
loest sie die Skalierung nicht, weil der grosse Spieler im Raid eines Bots 71,5 % des Topfes holt.
