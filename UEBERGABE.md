# Uebergabe - Stand 16.08.2026

Kurze Datei, bewusst. Der Inhalt steht im `UMSETZUNGSPLAN_BALANCE.md`; hier steht nur, wie man
einsteigt und was NICHT im Plan steht.

## Einstieg in einen neuen Chat

> Repo: https://github.com/dustinnaumann49-star/Expeditions-Commander-2
> Synchronisiere dich. Lies `UMSETZUNGSPLAN_BALANCE.md` **gezielt, nicht komplett** - die Datei ist
> ueber 300 KB gross. Abschnitt 8 zuerst, dann Abschnitt 2a, dann Abschnitt 1b, danach nur die
> Abschnitte, die zur jeweiligen Aufgabe gehoeren. `README.md` und `FINALE_BALANCE_CHECKLIST.md`
> nur bei Bedarf.
> Beachte Messregel 16: keine Zahl aus einer Beschreibung uebernehmen, immer gegen den Code
> pruefen.

**Abschnitt 2a ist neu und der wichtigste Teil fuer den Einstieg** - dort steht, was zwischen dem
10. und 13.08.2026 tatsaechlich am Code geaendert wurde. Wer nur Abschnitt 8 liest, haelt den Plan
faelschlich fuer unangetastet.

**Eine Session pro Block, nicht mehr.** Plan inzwischen ~264 KB, Checkliste 125 KB, README 67 KB -
das passt nicht gleichzeitig in eine Session.

## Stand

- **15 Entscheidungen, 13 Reparaturen.** Fuer jeden offenen Punkt steht entweder die Zahl oder die
  Regel, nach der sie bestimmt wird. Eine Umsetzungs-Session braucht keine Entscheidungsrunde mehr.
- **BLOCK A IST VOLLSTAENDIG** (seit 15.08.2026). Geschlossen sind Schritt 1 (Messreihen nach dem
  Overkill-Deckel), Abschnitt 8 Punkt 3 (Imperator-Einstufung), Abschnitt 8 Punkt 1
  (Beute-Exponent), das gesamte Raid-Paket (Schritt 3) und zuletzt **der Niveau-Punkt aus
  Abschnitt 7**.
- **BLOCK B, SCHRITT 4 IST GESCHLOSSEN** (15.08.2026): Entscheidung 4.1 (Verlust-Kriterium) und
  4.2 (contributedPower-Freeze).
- **BLOCK B IST VOLLSTAENDIG** (17.08.2026). Schritt 5 ist geschlossen: 4.3 steht auf Faktor 1,75x
  plus Boss-Forschungsskalierung (nach 4.4 gegengemessen und bestaetigt), **4.4 ist entschieden**
  (RapidFire umstellen, Mehrfachziel-Salve verworfen), 4.5 entfaellt, 4.6/4.7/4.8 haben
  Vorschlaege, die keine Messung mehr brauchen. Einzelheiten unten.
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

## Fallen, die schon zugeschnappt sind

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

**Coolify haelt nur die Ausgabe des aktuell laufenden Containers.** Bei jedem Redeploy ist das
Protokoll weg. Logs VOR dem Deploy abrufen, sonst ist die Spur verloren.

**Instrumentierung zuerst.** Die Ursache der langsamen ticks wurde zwei Tage lang auf Verdacht
diskutiert; die Phasen-Aufschluesselung beantwortete die Frage in einem einzigen Log - und die
Antwort war eine voellig andere als die Vermutung.

## Erster Schritt beim naechsten Mal

**Block C, Schritt 6: Entscheidung 13.3** (Bot- und Basis-Wachstum von der Aufruf-Haeufigkeit
entkoppeln). Laut Abschnitt 5 zwingend vor Entscheidung 5. Block B ist seit dem 17.08.2026
vollstaendig, es steht nichts mehr davor.

Zwei kleine Dinge, die aus Schritt 5 uebrig bleiben und KEINE Messung brauchen, nur eine
Bestaetigung: der Sieg-Bonus in 4.6 (Vorschlag 2,0x statt 1,5x) und die Deckelung in 4.7 auf die
bis zum letzten UEBERSTANDENEN Check gesicherte Beute.

**Messaufwand:** die Sweeps vom 16.08.2026 liefen bei Deckel 100 in etwa fuenf Minuten - da der
Deckel bei 100 bleibt, gilt das weiter. **Messlaeufe scheibenweise starten** (eine Zelle je Aufruf,
Ergebnis sofort in die Datei anhaengen) - ein Vollauf ueber alle Zellen schreibt seine Tabellen
erst am Ende und ist bei einem Abbruch komplett verloren. Genau das ist am 16.08.2026 passiert.

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
