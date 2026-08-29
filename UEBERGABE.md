# Uebergabe - Stand 28.08.2026

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

- **NEU 29.08.2026 (siebte Session, vierter Teil): BOT-BAURATE GEMESSEN - DIE AUSGANGSVERMUTUNG
  WAR FALSCH, UND MEIN EIGENER VORSCHLAG IST IN DER NAIVEN FORM SCHAEDLICH. NICHTS GEBAUT.**
  Anlass: Nutzerbeobachtung an KI-Nyx und KI-Vega (26 Mrd Guthaben, aber nur 21-29 Schiffe je
  Typ). Protokoll `balance/session2-simulation/bot_baurate.txt`, Rohdaten `bot_baurate.json`.
  Neue Werkzeuge `make_messbuild_botrate.mjs` und `run_bot_baurate.mjs`. **Messbuild-Protokoll.**
  - **DER STUECKZAHLDECKEL IST NICHT DER HAUPTENGPASS.** Er wirkt (Deckel 500 statt 5:
    x2,76 Kampfschiffe, x2,52 Flottenmacht), aber **das Restguthaben liegt in ALLEN fuenf Zellen
    bei 12,4-12,6 Mrd** - der Deckel aendert daran nichts.
  - **DIE SPALTE, DIE SICH NICHT BEWEGT, TRAEGT DAS ERGEBNIS: `spendableResources()`** zieht die
    Kosten des naechsten Gebaeudes UND der naechsten Forschung ab, bevor ein Schiff erwogen wird.
    Bei Minenstufe 21 ist diese Reserve zweistellig in Milliarden. **Diesen Teil des Kontos kann
    der Bot strukturell nie in Flotte umsetzen.** Von 31,3 Mrd Ausgaben in 7 Tagen landen nur
    **3,2-4,1 Mrd in Flotte und Verteidigung zusammen**; die Minenstufen steigen dabei kaum.
  - **MEIN VORSCHLAG (Stueckzahl an den Kontostand koppeln) IST ERLEDIGT.** Er liefert die
    meisten Schiffe (4.615), aber die schlechteste Mischung: leichte Jaeger 2.679 gegen Bomber 27
    - **genau die Monokultur, die der Fix vom 13.08.2026 beseitigt hat.** Ablesbar an
    x4,00 Schiffszahl bei nur x2,23 Flottenmacht (Deckel 500: x2,76 bei x2,52). Nur brauchbar in
    Verbindung mit einer Typ-Quote.
  - **DIE LEITER IST NICHT MONOTON** (25 -> 1.855, aber 100 -> 1.780): grosse Bloecke verschieben
    die "geringster Bestand zuerst"-Reihenfolge sprunghaft, einzelne Typen ueberspringen ganze
    Runden (bei Deckel 500 bleiben Bomber und Schlachtkreuzer bei 25, alle anderen bei ~520).
    **Eine Spanne ueber diese Leiter waere sinnlos - die Zellen wechseln das Regime.**
  - **OFFENE UND WICHTIGE DISKREPANZ:** der heutige Code baut in der Simulation in 7 Tagen von
    178 auf **1.153** Kampfschiffe; die echten Bots stehen nach Wochen bei **178**. Der Takt ist
    nachweislich derselbe (`HEARTBEAT_INTERVAL_MS` = 2 min, im dist geprueft). Ursache vermutlich
    laufende VERLUSTE (Elite-Einladungen automatisch mit 30 % der Flotte, eigene Expeditionen mit
    20 %, Piratenbasen-Angriffe rund alle 40 min je Bot) oder ein nicht durchgehender Heartbeat.
    **Diese Frage gehoert VOR jede Aenderung am Deckel** - ist es die Verlustseite, verpufft ein
    hoeherer Deckel.
  - **FUER DIE NUTZERIDEE "Elite-Bollwerk zu viert":** technisch geht das heute schon (Bots nehmen
    automatisch mit 30 % ihrer Flotte an), aber 30 % von 178 sind 53 Schiffe je Bot. Die
    **groesseren Hebel sind die Reserve und die Verlustfrage, nicht der Deckel.**
  - Empfohlene Reihenfolge (nicht entschieden): 1. Verlustfrage klaeren, 2. Reserve in
    `spendableResources()` deckeln, 3. erst danach der Stueckzahldeckel - und dann als FESTE Zahl.

- **NEU 28.08.2026 (siebte Session, dritter Teil): DIE DREI OFFENEN FRAGEN ZUM REICHEN FUND SIND
  ENTSCHIEDEN - VOM NUTZER DELEGIERT, BEGRUENDET EINGETRAGEN, UMKEHRBAR. NICHTS GEBAUT.**
  Protokoll `balance/session2-simulation/reicherfund_13_entscheidungen.txt`. Verfahren wie bei
  f = 12, Befund G, K1b, K4 und v_p016 selbst.
  - **C (zuerst, weil sie die Zahl bestimmt): DIE ESKORTEN-PRAEMIE WIRD AUSGESCHLOSSEN.** Ein
    Minenfund ist keine Kampfbelohnung - und vor allem: **die Kopplung ist derselbe Bautyp, der
    den Fund ueberhaupt erst zum Problem gemacht hat.** Der Fund driftete, weil eine Aenderung an
    der MISSIONSDAUER eine Mechanik anderswo mitskalierte; die Praemien-Kopplung tut dasselbe fuer
    jede kuenftige Aenderung an der ESKORTE. Preis: Ertragsanteil einer Eskorte -69 %
    (Schutzwirkung unberuehrt). **Falls Spieler daraufhin Eskorten weglassen, ist die richtige
    Antwort eine hoehere Praemie, nicht die Rueckkehr zur Kopplung.**
  - **A: DER FAKTOR BLEIBT BEI 0,875.** NICHT gegen den Median kalibriert (das waere 0,709
    gewesen). **Grund: der gemessene Unterschied klingt mit der Laufzeit ab** - +26,0 % ueber
    7 Tage, +14,6 % ueber 14 Tage, **+1,7 % im Erwartungswert**. Ueber die Zeitraeume, in denen
    hier gerechnet wird, bekommt ein Spieler unter beiden Formen gleich viel; was sich aendert,
    ist die Verteilung, nicht die Summe. Eine Median-Kalibrierung waere dagegen eine echte
    Kuerzung des Erwartungswerts um 19 % gewesen und haette **den Nenner verkleinert und damit
    den Anteil von Raid und Elite-Bollwerk gehoben** - Entscheidung 3 und Abnahmekriterium 5
    waeren neu zu kalibrieren. Eine Anhebung ist in dieser Richtung ungefaehrlich, eine Kuerzung
    nicht.
    - **WAS BLEIBT UND ZU BEACHTEN IST: jede WOCHENkennzahl liest in den ersten Wochen hoeher**
      (Woche-1-Baseline vom 20.08.2026, K5, jeder Kurzlauf). Wer nach dem Einbau eine
      Woche-1-Zahl mit einer von vorher vergleicht, vergleicht zwei Verteilungen bei gleichem
      Erwartungswert. Nebenbefund fuer die Empfehlung: die Streuung des Wochenertrags faellt von
      25 auf 17 % (7 Tage) und von 16 auf 9 % (14 Tage).
  - **B: DER WEGFALL DER ZEITPUNKT-ABHAENGIGKEIT IST GEWOLLT.** Sie IST die Ursache der Drift -
    weil der Fund den akkumulierten Ertrag verdoppelt, waechst er ueberproportional mit der
    Missionsdauer; **bleibt die Kompoundierung, bleibt die Drift**, und die naechste Aenderung an
    einer Missionsdauer skaliert ihn wieder mit. Das Gluecksspiel bleibt vollstaendig (3,84
    Treffer im Mittel, Binomialstreuung). Zur gefallenen Haelfte der Nutzerentscheidung vom Juli
    2026: sie belohnte nicht eine ENTSCHEIDUNG des Spielers, sondern den Zeitpunkt eines
    Wuerfels, auf den er keinen Einfluss hat. **Auflage:** Code-Kommentar und Changelog muessen
    den Verlust mit Datum und Grund festhalten.
  - **KORREKTUR AN DER EIGENEN FRUEHEREN FORMULIERUNG, nicht stehengelassen:** im Protokoll des
    ersten Teils stand, der Befund "widerspricht 12b in seinem Kern". Das ist fuer die
    Einzelwoche richtig und fuer die Balance zu scharf; die Stelle ist eingeschraenkt worden.
  - **DAS EINBAUPAKET STEHT DAMIT FEST:** Chance 0,16 - Bonus 0,875 x nominale Gesamtausbeute -
    Bemessung am Mining ALLEIN - Zeitpunkt ohne Einfluss. Erwartungswert unveraendert,
    Quellenstreuung 64,1 -> 12,9 %. **Der Einbau selbst ist NICHT entschieden**; Bauanleitung
    fuer die fuenf Textstellen in `reicherfund_12_offene_punkte.txt` Abschnitt 4,
    Client-Aenderungen gesondert freizugeben.

- **NEU 28.08.2026 (siebte Session, zweiter Teil): DER K3b-VORBEHALT IST GEPRUEFT UND
  QUANTIFIZIERT - 14,7 PUNKTE UEBERSCHAETZUNG. DABEI EIN ZWEITER FUNDORT, DER BISHER NIRGENDS
  STAND, UND EIN DRITTER BEFUND, DER SCHWERER WIEGT ALS BEIDE. NICHTS AM SPIELCODE GEBAUT.**
  Protokoll `balance/session2-simulation/k3b_vorbehalt.txt`, Rohdaten `k3b_vorbehalt.json`
  (18 Laeufe). Geaendert: `sim13_lauf.mjs` (K3c ergaenzt, **K3b unveraendert**).
  **Messbuild-Protokoll.** Loest `reicherfund_11.txt` Abschnitt 13 ein.
  - **URSACHE:** `ressourcenAblehnung` ist eine Momentaufnahme des HANDELNS, `probe()` liest sie
    gegen einen laufend abgetasteten Zustand. Beides faellt nur zusammen, wenn `probe()`
    unmittelbar nach `spielerZug()` laeuft.
  - **FUNDORT 1, der notierte:** mit `--mensch_unterschritte` laeuft `probe()` 30x je Stunde im
    Unterschritt, am Stundenende dagegen **gar nicht** (`if (!MENSCH_UNTERSCHRITTE) probe(s)`).
    Alle 30 Proben lesen Flags aus dem Zug der VORSTUNDE.
  - **FUNDORT 2, BISHER NIRGENDS NOTIERT und wichtiger:** das gilt auch OHNE den Schalter,
    sobald das Profil nicht `aktiv` ist. `handeltInStunde()` liefert bei `gelegenheit` nur alle
    12 Stunden true, bei `abwesend` an den Tagen 1 bis 14 **nie** - `probe()` laeuft trotzdem
    stuendlich und liest bis zu ZWEI WOCHEN alte Flags. **Punkt 4 faehrt genau diese Profile;
    der Vorbehalt galt also nie nur fuer den Schalter.**
  - **GEBAUT: K3c, nicht eine Aenderung an K3b.** Muster K1/K1b und K3/K3b - eine Kennzahl mit
    Vergleichswerten wird nicht umdefiniert. K3c erhebt dieselbe Frage unmittelbar nach dem Zug,
    der die Flags gesetzt hat, mit EIGENEM Nenner (Zuege statt Proben).

    | Profil | Modus | K3b (Nenner) | K3c (Nenner) | Differenz |
    |---|---|---|---|---|
    | aktiv | ohne | 48,2 % (168) | 48,2 % (168) | +0,0 |
    | **aktiv** | **mit** | **67,5 % (5040)** | **52,8 % (168)** | **+14,7** |
    | gelegenheit | ohne/mit | 0,0 % | 0,0 % (14) | +0,0 |
    | abwesend | ohne/mit | 0,0 % | 0,0 % (2) | +0,0 |

  - **DIE GEGENPROBE ZUERST:** bei `aktiv` ohne Schalter sind beide auf die Nachkommastelle
    identisch - genau dort muessen sie es sein. **Die neue Kennzahl erfindet nichts**, dasselbe
    Argument wie die zweimal 6,1 % bei K1/K1b. Ohne diese Zelle waere jede Differenz nicht von
    einem Fehler in K3c zu unterscheiden.
  - **DER VORBEHALT IST BESTAETIGT, RICHTUNG UND GROESSE:** 67,5 statt 52,8 %, also **+14,7
    Punkte nach oben** - wie in Abschnitt 13 vermutet, jetzt beziffert. Mechanik: nach einem
    erfolgreichen Zug ist die Lane belegt; in den folgenden 30 Unterschritten wird der Auftrag
    fertig, die Lane faellt leer, und das Flag der Vorstunde steht noch.
  - **DER SCHWERSTE BEFUND BETRIFFT NICHT DEN SCHALTER.** Aus `handeltInStunde()` vorab
    ausgezaehlt, wieviele ZUEGE ein 30-Tage-Lauf liefert: aktiv **720**, gelegenheit **60**,
    abwesend **17**. **K3b hat bei `abwesend` einen Nenner von 21.600 Proben, die auf 17 Zuege
    zurueckgehen** - formal eine dreistellige Zahl, sachlich leer. Dieselbe Fehlerform wie "K5
    waere formal erhoben und sachlich leer gewesen". **Bei Punkt 4 fuer `aktiv` K3c zitieren,
    fuer `gelegenheit` mit Vorbehalt, fuer `abwesend` gar nicht.**
  - Die 0,0 % bei `gelegenheit`/`abwesend` sind kein Freispruch fuer Fundort 2, sondern ein
    leerer Zaehler: dort sammeln sich zwischen zwei Zuegen genug Ressourcen an, dass gar keine
    Ablehnung entsteht und die Flags nie gesetzt werden.
  - **GRENZEN:** 7 Tage, Treiber `economy`, drei Wiederholungen. Die 14,7 Punkte sind eine
    Groessenordnung, keine kalibrierte Zahl - unter `--treiber=tick` ist die Ressourcenlage eine
    andere und die Verzerrung NICHT gemessen.

- **NEU 28.08.2026 (siebte Session): DIE DREI OFFENEN PUNKTE VOR DEM EINBAU DES REICHEN FUNDES
  SIND ABGEARBEITET. PUNKT 1 IST BEANTWORTET - MIT NEIN. DABEI EIN NICHT GESUCHTER BEFUND, DER
  SCHWERER WIEGT: DIE EMPFOHLENE ZAHL 0,875 IST EINE NIVEAUAENDERUNG. NICHTS GEBAUT, WEDER
  SPIELCODE NOCH CLIENT.** Protokoll
  `balance/session2-simulation/reicherfund_12_offene_punkte.txt`, Rohdaten
  `reicherfund_12_tick.json` (20 Laeufe), Werkzeugdoku
  `WERKZEUGE_28-08-2026_siebte-session.md`. Geaendert wurde genau ein Werkzeug
  (`run_reicherfund.mjs`, drei Schalter, alle Standardwerte unveraendert - `reicherfund_11.txt`
  bleibt reproduzierbar). **Messbuild-Protokoll.**
  - **PUNKT 1, K5 IN EINER tick-ZELLE: NICHT BELEGT.** Zwei Runden a 5 Laeufe je Zelle, gepoolt
    n = 10, 14 Tage, Treiber `tick`, `--nutzer=ShadowEagle`. Vorab festgelegt: 14-Tage-Lesart,
    Schwelle F(9,9) = 3,18.

    | Lesart | heute | v_p016 | F | Befund |
    |---|---|---|---|---|
    | Woche 1 | 39,2 % SD 6,5 | 51,2 % SD 8,8 | 0,54 | nicht signifikant |
    | 14 Tage | 43,3 % SD 6,5 | 51,6 % SD 5,3 | 1,51 | nicht signifikant |

    **Die Streuung der QUELLE faellt weiterhin (64,1 -> 12,9 %), die des K5-AUSGANGS nicht.**
    Grund: mit Raid ist der Raid der groessere bewegliche Posten im Nenner (VarKoeff Fund 26 %
    gegen Raid 43 % bei v_p016). Wer die Streuung der einen Quelle beseitigt, macht die der
    anderen sichtbar. **Vierte Wiederholung des Befunds, dass K5 diese Entscheidung nicht
    tragen kann.**
  - **DER EIGENTLICHE BEFUND, NICHT GESUCHT: DAS NIVEAU IST NICHT UNVERAENDERT.**
    Wocheneinnahme 16,71 gegen 21,04 Mrd, **+26,0 %** (t = 2,54 gegen t(18) = 2,10;
    verteilungsfrei gegengeprueft, Mann-Whitney U = 22 gegen kritisch 23, Mediane 15,74 gegen
    21,03).
    - **Ursache, arithmetisch und zwingend:** 0,875 ist gegen den MITTELWERT der heutigen Form
      kalibriert, deren Verteilung stark rechtsschief ist. In den economy-Zellen der sechsten
      Session (n = 20): heute Mittel 15,27 / Median 12,37 (Verhaeltnis 0,810), v_p016 Mittel
      15,53 / Median 15,27 (0,983). **Mittelwerte +1,7 %, MEDIANE +23,5 %.** Wer eine
      rechtsschiefe Verteilung durch eine symmetrische ersetzt und den Mittelwert festhaelt,
      hebt den Median zwangslaeufig an.
    - **`reicherfund_11.txt` hat diese Falle SELBST benannt und ist ihr dann in die
      Kalibrierung gelaufen.** Abschnitt 7 woertlich: "Wer gegen den Mittelwert kalibriert,
      kalibriert gegen eine Zahl, die zwei von drei Spielern nicht erreichen." Zwei Abschnitte
      spaeter ist genau dagegen kalibriert worden.
    - **Das widerspricht 12b in seinem eigenen Kern** ("Der Befund rechtfertigt eine
      Formaenderung, keine Niveauaenderung"). Faktor, der stattdessen den Median festhielte:
      **0,709** - eine RECHNUNG, keine gemessene Zelle, nicht als kalibrierter Wert fuehren.
  - **PUNKT 2, DER CLIENT-SPIEGEL: ES SIND FUENF STELLEN, NICHT EINE.** Ausgezaehlt statt
    uebernommen (`grep` ueber client/src und server/src): `Nachrichten.tsx` Z. 321 (Ueberschrift
    "Ertrag verdoppelt") und Z. 325/334 (Spalte "Stunde"), `missions.ts` Z. 745,
    **`economy.ts` Z. 403-406** und `types.ts` Z. 394-395; dazu `changelog.ts` Z. 507, der als
    historischer Eintrag bewusst stehen bleibt.
    - **Der wichtigste Fundort steht nicht in 12b und ist keine Textpflege.** Der Kommentar bei
      `ASTEROID_RICH_FIND_CHANCE` nennt ZWEI Bestandteile der Nutzerentscheidung vom Juli 2026:
      das Gluecksspiel UND die Zeitpunkt-Abhaengigkeit ("frueh in der Mission bringt ein Treffer
      wenig, spaet einen grossen Bonus"). **v_p016 erhaelt den ersten und loescht den zweiten
      vollstaendig** - "zeitpunktunabhaengig" ist ihre Definition. 12b fuehrt unter "WAS BEWUSST
      BLEIBT" nur "DAS GLUECKSSPIEL" und trennt beides nicht; gemessen am eigenen Massstab
      loescht auch die empfohlene Form eine Nutzerentscheidung, nur die andere Haelfte.
    - Bauanleitung im Protokoll Abschnitt 4. Wichtig darin: **`RichFindEntry.hour` bleibt im
      Typ** (server und client) - alte Nachrichten tragen das Feld, wer es entfernt, bricht jede
      bereits zugestellte Nachricht; dasselbe Muster wie das optionale `replay`-Feld. Server-Text
      und Client-Tabelle muessen GEMEINSAM geaendert werden, sonst spricht der Fliesstext von
      "3 Reiche Funde" und die Tabelle darunter listet Stunden.
  - **PUNKT 3, DIE ESKORTEN-PRAEMIE: KEINE ZWEITE AENDERUNG, SONDERN VORAUSSETZUNG DER ZAHL.**
    Der Messbuild-Patch R4b bemisst den Bonus allein am Mining; die Praemie ist in v_p016
    **bereits ausgeschlossen** und steckt in den gemessenen 15,53 Mrd.
    - Heute haengen **23,1 % der Wocheneinnahme** an der mitverdoppelten Praemie (3,53 von
      15,27 Mrd). Der Ertragsanteil einer Eskorte faellt von 5,13 auf 1,61 Mrd, **-69 %** - die
      Schutzwirkung bleibt unberuehrt, sie ist darin nicht enthalten.
    - **Gegenrechnung, der eigentliche Befund:** bliebe die Praemie im Bemessungstopf, waere bei
      gleichem Niveau ein Faktor von **0,586 statt 0,875** noetig. **Wer Punkt 3 ablehnt,
      verwirft 0,875 mit.** Damit ist es keine Frage neben der Empfehlung, sondern eine davor.
    - **ACHTUNG: Punkt 3 und die Median-Frage sind NICHT unabhaengig** - beide senken die Zahl.
      Gemeinsam kalibrieren, sonst wird zweimal dieselbe Korrektur angebracht.
  - **EIGENER METHODENFEHLER, MIT ZAHLEN BELEGT:** die Trennschaerfe wurde vor der Messung
    ausgerechnet (Regel aus Entscheidung 18) - aber gegen die K5-Streuung einer Zelle OHNE Raid
    (16,0 Punkte, Verhaeltnis 3,78x, F = 14,3, also "fuenf Laeufe reichen"). Mit Raid liegt die
    Streuung bei **7,3** Punkten: **derselbe Raid, der die Frage erst entscheidbar macht,
    daempft den zu messenden Unterschied mit.** Erste Runde deshalb ohne Ergebnis (F = 0,47 und
    4,58 gegen Schwelle 6,39), zweite Runde mit VORHER festgelegtem Kriterium nachgefahren.
    **Neue Fallenform:** die Referenzstreuung einer Trennschaerfe-Rechnung muss aus DERSELBEN
    Zelle stammen, die spaeter gefahren wird.
  - **KORRIGIERT im Werkzeug:** `run_reicherfund.mjs` gab fest verdrahtet "Treiber economy (kein
    Raid)" aus, auch bei `--treiber=tick` - eine tick-Serie waere als economy-Serie
    protokolliert worden.
  - **ANKERCHECK, ZWEI LAEUFE: -1,1 % und -1,7 % normiert**, beide im Band. Elf Messungen
    liegen jetzt bei +0,4 / -1,0 / -1,1 / -1,1 / -1,2 / -1,5 / -1,6 / -1,7 / -1,8 / -2,3 /
    -2,8 %. **Roh waeren beide POSITIV gewesen** (+1,8 / +4,3 %) - die roh/normiert-Falle zum
    achten Mal.
  - **DREI FRAGEN LIEGEN BEIM NUTZER** (Protokoll Abschnitt 7): (A) die Zahl 0,875 - behalten
    und die Anhebung als gewollt eintragen, gegen den Median kalibrieren (rechnerisch 0,709,
    zu messen) oder gegen einen anderen Bezug; (B) ob der Wegfall der Zeitpunkt-Abhaengigkeit
    gewollt ist; (C) Ausschluss der Eskorten-Praemie ja oder nein. **A und C gemeinsam.**
  - **GRENZEN:** ein Profil, eine Paarung, n = 10 - die Streuungsfrage ist auf rund 1,8x
    aufloesbar, nicht feiner; F = 1,51 heisst NICHT "die Formen streuen gleich", sondern
    "mit dieser Stichprobe nicht nachweisbar". Der arithmetische Teil (Median +23,5 %) haengt
    dagegen NICHT an dieser Messung, sondern an den 20er-Zellen der sechsten Session.
    Zellen mit `--nutzer=ShadowEagle` sind mit den 0,7-Zellen aus `k5_quellen.txt` nicht
    unmittelbar vergleichbar.

- **NEU 27.08.2026 (sechste Session, zweiter Teil): DIE MASSENFRAGE - ZWEI ERKLAERUNGEN
  AUSGESCHLOSSEN, DIE URSACHE WEITER OFFEN. NICHTS GEBAUT AUSSER EINER REINEN ANZEIGE.**
  Protokoll `balance/session2-simulation/massenfrage_protokoll.txt`, Rohausgaben `massenfrage.txt`
  und `deckel.txt`, Werkzeuge `make_messbuild_aggregat.mjs`, `run_massenfrage.mjs`,
  `run_deckel.mjs` (alle neu). Anlass: Nutzerbeobachtung beim Spielen mit dem Vorschlag, die
  Aggregationsschwelle auf 4.000-5.000 anzuheben.
  - **RICHTIGSTELLUNG:** die Schwelle liegt nicht bei 2.000, sondern bei **50** (Elite-Klasse),
    **100** (Kreuzer-Klasse und Verteidigungsanlagen) und **500** (Jaeger). In echten Flotten
    laeuft damit praktisch alles aggregiert; nur die Salvenschiffe werden einzeln gerechnet.
  - **BEFUND 1 - DAS AGGREGAT IST NICHT DIE URSACHE.** Dieselbe Leiter zweimal gefahren, einmal
    mit den Code-Schwellen und einmal mit Schwelle 100.000 (nie aggregiert), Gegner auf die
    Flottenmacht skaliert und damit eigentlich massstabsneutral:

    | n | Einheiten | IST | nie aggregiert | Differenz |
    |---|---|---|---|---|
    | 90 | 405 | 63,4 % | 64,2 % | -0,8 |
    | 99 | 447 | 58,0 % | 58,6 % | -0,6 |
    | 101 | 456 | 53,6 % | 56,7 % | -3,1 |
    | 400 | 1.800 | 10,7 % | 14,6 % | -3,9 |
    | 1.000 | 4.500 | 2,3 % | 5,7 % | -3,3 |
    | 2.500 | 11.250 | 0,1 % | 2,3 % | -2,2 |

    **98 % des Absturzes passieren auch ohne jede Aggregation.** Eingebaute Gegenprobe: n=90 und
    n=99 laufen in BEIDEN Builds unaggregiert und stimmen auf 0,8 bzw. 0,6 Punkte ueberein - der
    Patch veraendert nichts ausser der Schwelle.
  - **DER URSPRUENGLICHE VORSCHLAG IST NICHT EMPFOHLEN:** eine Schwelle von 4.000-5.000 bewegt bei
    4.500 Einheiten 3,3 Punkte und kostet **Faktor 7** Rechenzeit (bei 11.250 Einheiten Faktor 8,3,
    also 1.025 ms je Kampf). Der Rueckstau-Vorfall vom 30.07.2026 waere zurueck.
  - **BEFUND 2 - DIE ZWEI DECKEL SIND ES AUCH NICHT.** `OVERKILL_MAX_CASCADE` (5) und
    `MAX_SHOTS_PER_UNIT` (50) als Gitter variiert (sie multiplizieren sich, einzeln zu messen
    misst den Deckel der jeweils anderen). Obergrenze von 250 auf **25.000** Abschuesse je Runde:
    die Spanne bewegt sich von 63,7 auf 67,0 Punkte - **nichts, und in die falsche Richtung**
    (kleine Flotten 63,8 -> 68,7 %, grosse 0,1 -> 1,6 %). `MAX_SHOTS_PER_UNIT` ist gar nicht
    bindend (V3 aendert 63,7 -> 64,5), was zum R14-Befund vom 17.08.2026 passt; die Kaskade wird
    durch den Durchschlags-Daempfungsfaktor geometrisch abgewuergt, lange bevor die Stufenzahl
    greift. "nie Totalverlust" bleibt in allen Varianten gewahrt.
  - **DIE URSACHE IST AM 28.08.2026 GEFUNDEN: ES IST DIE BAUART DES PIRATENKAPITAENS, NICHT DAS
    KAMPFMODELL.** Zwei weitere Messungen gegen den UNVERAENDERTEN Build (`probe_bossverlust.mjs`,
    `run_gegenprobe.mjs`/`gegenprobe.txt`), Protokoll-Abschnitt 4a.
    - **Sonde.** Ausgangspunkt: der Boss toetet gegen grosse Flotten ABSOLUT weniger (264 -> 8
      Einheiten), nicht gleich viel - das folgt keiner Deckel-Erklaerung.

      | n | Boss-Waffen | vernichtet | Schaden/Treffer | Verschwendung | Regen/Schaden |
      |---|---|---|---|---|---|
      | 90 | 110,6M | 264 | **13,5M** | 87,8 % | 0,00 |
      | 400 | 491,5M | 203 | **13,6M** | 97,2 % | 0,24 |
      | 2500 | 3.072,0M | 8 | **13,7M** | 99,6 % | **0,97** |

      **Die Waffen wachsen um Faktor 28, der Schaden je Treffer bleibt konstant bei 13,6 Mio.**
      Ein Treffer erreicht ueber die Durchschlags-Kaskade nur wenige Ziele, alles darueber wird
      weggeworfen - bei 11.250 Einheiten verpuffen **99,6 %** der Feuerkraft. **Den Gegner ueber
      seine MACHT zu skalieren macht ihn nicht staerker, sondern verschwenderischer.** Zweiter
      Mechanismus: die Schild-Regeneration der Spielerflotte schluckt den Rest - bei 11.250
      Einheiten regeneriert sie **97 %** dessen, was ueberhaupt ankommt.
    - **Gegenprobe.** Dieselbe Leiter, dieselbe Gegner-MACHT, einmal auf einer Einheit und einmal
      ueber `generatePiratenFleet()` verteilt:

      | n | konzentriert | verteilt |
      |---|---|---|
      | 150 | 36,2 % | 32,2 % |
      | 400 | 10,7 % | 38,2 % |
      | 1.000 | 2,5 % | 38,3 % |
      | 2.500 | 0,1 % | **38,4 %** |

      **Bei verteilter Gegnermacht ist die Verlustquote flach.** Der Masse-Vorteil ist vollstaendig
      weg, und beide Mechanismen verschwinden mit (Schaden je Treffer 0,01 statt 13,6 Mio,
      Regen/Schaden konstant 0,23-0,25 statt ansteigend). **Wo dem Spieler VIELE Gegner
      gegenueberstehen - normale Piratenflotten, Raid-Verteidigung, Elite-Bollwerk - verhaelt sich
      die Engine massstabsneutral.** Nur die Kapitaens-Begegnung kippt.
    - **METHODISCHER BEFUND ZUR EIGENEN KENNZAHL:** die Zusammenfassung "Spanne ueber die Leiter"
      wies fuer beide Formen fast denselben Wert aus (62,3 gegen 61,6) und haette den Schluss
      "kein Unterschied" nahegelegt - das GEGENTEIL des Befunds. Ursache: die Zelle n=90 wechselt
      bei verteilter Macht das REGIME (100 % eigener Verlust, Kampf endet nach 87 statt 100
      Runden). **Eine Spanne ueber eine Leiter, in der eine Zelle das Regime wechselt, misst den
      Regimewechsel und nicht die Steigung.** Zusammenfassende Kennzahlen erst bilden, NACHDEM die
      Einzelzellen angesehen wurden.
    - **KORREKTUR EINES EIGENEN MESSFEHLERS:** ein erster Sondenlauf las `r.shotsB.fired` aus und
      meldete 0 Schuesse bei 52 Treffern - das sah nach einem Fehler im Spiel aus und wurde
      kurzzeitig auch so berichtet. Das Feld heisst `shotsFired` (`ShotStats` in `combat.ts`);
      korrekt ausgelesen 100 Schuesse bei 52 Treffern, voellig unauffaellig. **Feldnamen am Typ
      nachsehen, nicht raten** - dieselbe Regel wie bei den dist-Ankern.
  - **NACHTRAG 28.08.2026 VORMITTAGS - TEILWEISE RUECKNAHME DES OBIGEN BEFUNDS**
    (`run_eskorte.mjs`, `eskorte.txt`, Protokoll-Abschnitt 4b).
    - **Die Eskorte war in ALLEN bisherigen Zellen weggelassen.** Im Code gilt
      `ADMIRAL_STAT_SHARE = 0.55` - nur 55 % der Gegnermacht sitzen auf dem Kapitaen, 45 % auf
      einer Eskorte. Die bisher berichteten Zahlen beschreiben also einen isolierten Sonderfall,
      nicht das Spiel. **Im echten Spiel verliert der Spieler bei 11.250 Einheiten 15,2 %, nicht
      0,1 %.** Der Effekt ist deutlich milder als berichtet - der Abfall bleibt aber (49,7 -> 15,2 %,
      Faktor 3,3).
    - **DRITTE UND VIERTE HYPOTHESE, BEIDE WIDERLEGT.** Weder ein kleinerer Machtanteil des
      Kapitaens noch eine feinkoernigere Eskorte begradigen die Kurve:

      | Variante | 150 | 400 | 1000 | 2500 | Abfall ab 150 |
      |---|---|---|---|---|---|
      | nur Kapitaen | 35,9 % | 10,7 % | 2,4 % | 0,1 % | 35,8 |
      | **ECHTES SPIEL, share 0,55** | 49,7 % | 25,9 % | 17,5 % | **15,2 %** | 34,5 |
      | share 0,35 | 62,6 % | 39,4 % | 30,3 % | 27,7 % | 34,8 |
      | share 0,20 | 81,6 % | 56,6 % | 48,1 % | 46,1 % | 35,4 |
      | share 0,55 + feine Eskorte | 37,9 % | 15,1 % | 6,4 % | 3,7 % | 34,1 |

      **Der Abfall bleibt in JEDER Variante bei 34 bis 36 Punkten.** Der Machtanteil verschiebt
      nur das Niveau. Die feine Eskorte wirkt sogar gegenlaeufig.
    - **AUSGESCHLOSSEN SIND DAMIT VIER ERKLAERUNGEN:** Aggregation, Overkill-Kaskade und
      Schuss-Obergrenze, Machtanteil des Kapitaens, Koernigkeit der Gegnereinheiten. Zusaetzlich
      geprueft: `generateCappedFleet` deckelt die Eskorte NICHT (kein `maxCount` bei
      Standardschiffen, Stueckzahl waechst von 640 auf 10.662).
    - **DIE URSACHE IST WEITER OFFEN.** Einzige flache Konfiguration bleibt die Gegenprobe ohne
      Kapitaen. Beobachtung dazu: in allen Zellen MIT Kapitaen laufen die Kaempfe ueber die vollen
      100 Runden und der Gegnerverlust bleibt bei 99,8-100,0 % stehen - **der Kapitaen stirbt nie**
      (81 % seiner Macht sind Panzerung). Das ist eine Beobachtung und KEINE Erklaerung: bei
      share 0,20 stirbt er nachweislich (Kaempfe enden nach 61-64 Runden) und der Abfall bleibt
      trotzdem.
  - **NACHTRAG 28.08.2026 - DIE URSACHE IST GEFUNDEN** (`probe_kampfverlauf.mjs`,
    Protokoll-Abschnitt 4c). Nicht wieder eine Konstante gedreht, sondern der VERLAUF aufgezeichnet.
    - **Die Eskorte stirbt in JEDER Zelle nach 17 % der Kampfdauer - konstant.** Die restlichen
      83 % kaempft der Spieler gegen den Kapitaen allein, der nie stirbt (81 % seiner Macht sind
      Panzerung). Der Anteil der Verluste, die in dieser zweiten Phase entstehen, faellt von
      **60 % auf 1 %** ueber die Leiter.
    - **ZERLEGUNG DER VERLUSTKURVE:**

      | n | Verlust gesamt | Eskorten-Phase | Kapitaens-Nachlauf |
      |---|---|---|---|
      | 150 | 49,7 % | 19,9 % | 29,8 % |
      | 400 | 25,9 % | 17,1 % | 8,8 % |
      | 1.000 | 17,5 % | 15,4 % | 2,1 % |
      | 2.500 | 15,2 % | **15,0 %** | **0,2 %** |
      | **Abfall** | **34,5** | **4,8** | **29,7** |

      **Die Eskorten-Phase ist nahezu massstabsneutral. Der gesamte Masse-Vorteil steckt im
      Nachlauf des unsterblichen Kapitaens - 29,7 von 34,5 Punkten.**
    - **WARUM ALLE VIER FRUEHEREN HYPOTHESEN SCHEITERN MUSSTEN:** sie haben samt und sonders an
      der STAERKE des Gegners gedreht. Der Effekt haengt aber an der DAUER, ueber die eine
      unsterbliche Einheit einen gedeckelten Betrag abgibt (konstant 13,6 Mio je Treffer, ueber
      83 % der Kampfdauer). Eine staerkere oder schwaechere Version derselben Struktur verschiebt
      das Niveau und laesst die Steigung stehen - viermal gemessen.
    - **AUFLOESUNG DES WIDERSPRUCHS AUS 4b:** die Zeile share 0,20 hat Rundenzahlen
      100/100/80,9/63,6/61,4 - **sie wechselt INNERHALB der Leiter das Regime** (Kapitaen
      ueberlebt klein, stirbt gross) und ist deshalb nicht auswertbar, kein Gegenbeleg.
      **Zweites Mal dieselbe Falle** nach der Gegenprobe.
  - **NACHTRAG 28.08.2026 - DIE FUENFTE HYPOTHESE TRIFFT** (Regler `--admiral_ref`,
    Protokoll-Abschnitt 4d). Nicht an der Struktur um den Kapitaen herum gedreht (viermal
    gescheitert), sondern an der gemessenen Ursache: **der Deckel wirkt JE TREFFER, nicht je
    Runde.** Mehr Treffer bei gleicher Trefferstaerke gehen vollstaendig durch. Statt EINEN
    Kapitaen staerker zu machen, wird seine Macht auf MEHRERE derselben Staerke verteilt -
    Gesamtmacht identisch, nur die Koernigkeit aendert sich. Eskorte unberuehrt.

    | Variante | 150 | 400 | 1000 | 2500 | Abfall |
    |---|---|---|---|---|---|
    | ECHTES SPIEL (heute) | 50,6 % | 26,2 % | 17,6 % | 15,2 % | 35,4 |
    | **658M je Stueck** | **50,7 %** | 51,2 % | 46,5 % | **43,9 %** | **6,8** |
    | 176M je Stueck | 100 % | 100 % | 100 % | 100 % | Deckeneffekt |

    **Der Abfall faellt von 35,4 auf 6,8 Punkte - der erste Eingriff ueberhaupt, der die STEIGUNG
    bewegt statt nur das Niveau.** Entscheidender Nebenbefund: **bei n=150 aendert sich nichts**
    (50,7 gegen 50,6 %), weil dort genau ein Kapitaen steht wie heute. Erst darueber waechst die
    Stueckzahl (3 / 7 / 17) und genau dort steigt die Schwierigkeit. **Der fruehe Spielverlauf
    bleibt unberuehrt, nur die Immunitaet grosser Flotten verschwindet.**
  - **WARNUNG - DIE EMPFINDLICHKEIT IST EXTREM.** Von 658M auf 176M je Stueck kippt das Ergebnis
    von 50,7 % Verlust auf **vollstaendige Vernichtung in JEDER Zelle**, auch bei n=150. Das
    belegt die Ursache von der anderen Seite: der heutige Kapitaen wirft selbst gegen kleine
    Flotten 88 % seines Schadens weg; wer die Verschwendung beseitigt, setzt schlagartig die volle
    Macht frei. **Kein Feinjustierer, sondern ein Schalter mit sehr schmalem brauchbarem Bereich.**
  - **WAS NICHT FUNKTIONIERT HAT:** die freigesetzte Macht ueber einen kleineren
    `ADMIRAL_STAT_SHARE` auszugleichen macht es SCHLECHTER (share 0,30: Abfall 22,7; share 0,20:
    29,1 - beide steiler und haerter als 658M allein). Der Anteil, den man dem Kapitaen wegnimmt,
    geht an die Eskorte und trifft vor allem kleine Flotten, waehrend er den Nachlauf gar nicht
    beruehrt. **Die Stueckzahl-Skalierung funktioniert nur OHNE Ausgleich.** Das war meine
    Vermutung vor der Messung und sie war falsch.
  - **658M IST EIN MESSWERT UND KEIN BAUWERT.** Er haengt an der Kapitaensmacht bei n=150 dieser
    Leiter, also an einer Messgroesse. Vor einem Einbau muesste er aus einer stabilen
    Bezugsgroesse abgeleitet werden - naheliegend aus dem Verhaeltnis zur Panzerung eines
    typischen Zielschiffs, denn genau daran haengt der Deckel. **Ebenfalls ungeprueft:** mehrere
    Kapitaene statt einem aendern Wrack-Bergung, Kampfberichte (mehrere Zeilen) und moeglicherweise
    die Kapitaens-Beutelogik. Nichts davon steckt in dieser Messung.
  - **FUER DEN PLAN WICHTIG:** Entscheidung 2 (Beute-Kurve) greift an den BELOHNUNGEN und aendert
    nichts daran, dass eine 4.500er-Flotte 2,3 % verliert, wo eine 405er 63,4 % verliert.
    **"Weglauf-Wachstum bremsen" und "Masse macht unverwundbar" sind zwei Probleme, im Plan bisher
    als eines gefuehrt.**
  - **GRENZEN:** eine Paarung, ein Profil, ein Faktor, `allowRetreat` aus. Ob dieselbe Kurve gegen
    normale Piratenflotten und in der Raid-Verteidigung auftritt (viele gegen viele), ist NICHT
    gemessen - gerade dort koennte es anders ausfallen.

- **NEU 27.08.2026: BETRIEB.md um Abschnitt 4a ergaenzt (Coolify-Updates).** Anlass: Update
  4.3.11 -> 4.3.12 stand an, waehrend ein Deploy offen war. **Regel: erst deployen, kontrollieren,
  dann aktualisieren** - Coolify warnt selbst ("Any deployments running during the update process
  will fail"), und das Selbstupdate ist der Hauptverdaechtige fuer den ungeklaerten Ausfall vom
  25./26.08.2026. Wer beides zusammenlegt, kann die Ursache eines Fehlers hinterher nicht mehr
  trennen. Neu dokumentiert: der Log-Pfad `/data/coolify/source/upgrade*` als ERSTE Anlaufstelle
  (vor `fixnet.sh`, das ein Reparatur- und kein Diagnosewerkzeug ist), und die Empfehlung,
  **automatische Updates in den Coolify-Einstellungen auszuschalten** - bei zwei Spielern und
  manuellem Deploy gibt es keinen Grund dafuer, und ein Selbstupdate zu unbestimmter Zeit ist
  genau das Szenario, das die Regel verhindern soll. Merksatz Nr. 6 ergaenzt: "Nie zwei
  Veraenderungen gleichzeitig ausrollen." **NOCH OFFEN beim Nutzer: pruefen, ob Auto-Update
  eingeschaltet ist.**

- **NEU 27.08.2026: ANZEIGE DER KAMPFZAHLEN GEKUERZT - EINZIGE GEBAUTE AENDERUNG DIESER SESSION,
  AUF NUTZERWUNSCH.** `client/src/pages/Nachrichten.tsx` und `client/src/theme.css`. **Reine
  Anzeige: kein Serverpfad, kein Rechenweg, keine Messung beruehrt.** Anlass: eine Zeile wie
  "2.365.541.334" ist bei grossen Flotten nicht mehr lesbar, und mit `MAX_PLAYER_SHIPS = 1.000.000`
  werden daraus 13-stellige Zahlen.
  - Neue Hilfsfunktion `kurz()`: ab 100.000 Kurzform (`2,37 Mrd`, `1,20 Mio`, `254k`), darunter
    unveraendert - kleine Kaempfe, also die haeufigsten, sehen genauso aus wie bisher.
  - Die vier Summenspalten (Schaden ausgeteilt/erlitten, Schild absorbiert/regeneriert) und
    Schuesse/Treffer zeigen jetzt den **Wert JE EINHEIT als Hauptzahl** und die Summe klein
    darunter (`.zellen-summe`). Grund: die Summe traegt die Stueckzahl mit und sagt bei grossen
    Flotten fast nichts - der Wert je Einheit bleibt ueber alle Flottengroessen vergleichbar und
    macht Schiffstypen zum ersten Mal direkt gegeneinander lesbar. **Beide Zahlen stehen weiter da.**
  - Bezugsgroesse ist die ENTSANDTE Stueckzahl, nicht die ueberlebende: sonst saehe ausgerechnet
    eine schwer getroffene Staffel als besonders wirksam aus.
  - `UnitTable` ist die einzige breite Tabelle im Projekt und wird von allen vier Berichtsarten
    benutzt - die Aenderung wirkt ueberall gleichzeitig.
  - Geprueft: `tsc --noEmit` fehlerfrei, `vite build` erfolgreich. **Braucht einen manuellen Deploy
    der Client-Anwendung** (Auto-Deploy steht auf "Manual").

- **NEU 27.08.2026 (sechste Session): DER REICHE FUND IST GEMESSEN. JA, SEINE HOEHE IST EINE FOLGE
  DER MISSIONSVERLAENGERUNG - UND DIE STREUUNG IST GROESSER ALS DER EINWAND UNTERSTELLTE. NICHTS
  AM SPIELCODE GEBAUT, NICHTS ENTSCHIEDEN.** Protokoll
  `balance/session2-simulation/reicherfund_11.txt`, Werkzeuge `make_messbuild_reicherfund.mjs` und
  `run_reicherfund.mjs` (beide neu), `WERKZEUGE_27-08-2026.md`. **Messbuild-Protokoll.** Sieben
  Zellen a 20 Laeufe ueber 7 Tage, Profil aktiv, Treiber `economy`. Loest die in `k5_quellen.txt`
  Abschnitt 11 vorgeschlagene Messung ein; sie geht Punkt 4 vor, weil eine spaetere Aenderung am
  Reichen Fund jede vorher gefahrene 30-Tage-Baseline entwerten wuerde.
  - **MESSREGEL 16, FUENFTER FUNDORT - DIESMAL IN DER AUFGABENSTELLUNG SELBST.** `k5_quellen.txt`
    Abschnitt 11, der Messkasten in Abschnitt 1b und der Auftrag nennen alle "12 Stunden" und
    verweisen auf Punkt 23 der ALTEN README. Im dist steht
    `ASTEROID_MISSION_DURATION_MS = 24 * 3600 * 1000`, Kommentar daneben "Umbau 28.07.2026: von 12h
    auf 24h angehoben". **Es gab ZWEI Verlaengerungen: 4h -> 12h -> 24h.** Die als gesperrt
    gefuehrte alte README ist ueber zwei Zwischenschritte trotzdem in die Messung gelangt - und wer
    die Zahl uebernimmt, baut sein Messgitter um einen Wert herum, den es im Code nicht gibt.
    **Die Missionsdauer fehlte in Abschnitt 11 als Regler vollstaendig**, obwohl die erste zu
    klaerende Frage an ihr haengt; sie ist hier als eigene Zellengruppe nachgetragen.
  - **BEFUND 1, DIE FRAGE IST BEANTWORTET:** Wocheneinnahme gegen die Nullmessung (4,91 Mrd), bei
    unveraenderter Chance 0,08 - **4h: 5,29 Mrd (1,08x), 12h: 7,86 Mrd (1,60x), 24h heute:
    15,27 Mrd (3,11x)**, Fund-Anteil am Farmertrag 18,2 / 39,0 / 68,8 %. An Chance und `farmRate`
    wurde nie etwas geaendert. **Der Reiche Fund ist allein durch die zwei Dauer-Anhebungen von
    einem 8-%-Aufschlag zur groessten Einzelquelle des Spiels geworden.** Beide Code-Kommentare bei
    `ASTEROID_MISSION_DURATION_MS` pruefen ausdruecklich, was mit `dmCap` und `farmRate` passiert -
    die einzige Mechanik, die UEBERPROPORTIONAL mitwaechst, kommt in keinem von beiden vor.
  - **BEFUND 2, DIE STREUUNG:** heute VarKoeff **64,1 %**, Min 6,35 gegen Max 48,48 Mrd,
    **Spanne 7,63x** bei identischem Spielverhalten. "Verdreifachen oder nicht" aus Abschnitt 11
    war untertrieben. **Der Mittelwert beschreibt keine einzige typische Woche:** Median 76,6 % des
    Mittels, 13 von 20 Wochen darunter, und der Abstand entsteht praktisch allein aus dem hoechsten
    Wert (48,48 gegen 26,49 beim zweithoechsten). Jede frueher gegen diese Quelle gerechnete Zahl
    traegt das mit - auch die Schwankung der Kopfzahl "Wert am Tag 7" (2,92 bis 6,77 Mrd) ist damit
    endgueltig erklaert, jetzt mit 20 Laeufen statt mit vieren.
  - **BEFUND 3, DIE WICHTIGSTE ZELLE: NIVEAU UND STREUUNG SIND TRENNBAR.** Ein FESTER Aufschlag von
    +336,4 % je Stunde - gegen den gemessenen Mittelwert kalibriert, nicht geraten - liefert
    **15,36 gegen 15,27 Mrd (+0,6 %) bei VarKoeff 0,2 % statt 64,1 %.** Die gesamte Streuung stammt
    aus der FORM, nicht aus der Hoehe. Erst dadurch ist die Balance-Frage eine Wahl: bisher stand
    "Hoehe senken" gegen "Hoehe lassen", und beide Wege haetten die Schwankung behalten.
  - **BEFUND 4, ABNAHMEKRITERIUM 5 TAUGT HIER NICHT ALS MASSSTAB.** Es bewegt sich nicht monoton
    (59,5 / 44,9 / 50,3 / 62,3 %), und **die Nullmessung ist sein SCHLECHTESTER Wert** - ohne
    Reichen Fund wird `asteroid_mining` groesste Quelle, K5 ist dann in 20 von 20 Laeufen verletzt
    statt in 13. Ursache ist der Nenner: ohne Raid steht neben den Asteroiden nichts. Woertlich
    derselbe Befund wie am 20.08.2026, **dritte Wiederholung derselben Fehlerform.** Die Hoehe des
    Reichen Fundes darf nicht gegen K5 kalibriert werden.
  - **BEFUND 5, CHANCE UND MISSIONSDAUER SIND EIN REGLER, NICHT ZWEI.** Beide bewegen `(1+p)^n`.
    Fuer das NIVEAU austauschbar (12h/0,08 = 7,86 gegen 24h/0,04 = 8,60 Mrd, bei SE 5-7 % nicht
    sicher trennbar), fuer die STREUUNG nicht (22,7 gegen 30,2 %) - die kuerzere Mission mittelt
    zusaetzlich ueber mehr unabhaengige Missionen. **Wer kuenftig an einer Missionsdauer dreht,
    verstellt den Reichen Fund exponentiell mit.**
  - **ENTSCHEIDUNG AM 27.08.2026 VOM NUTZER DELEGIERT, EINGETRAGEN UND UMKEHRBAR** (gefuehrt wie
    f = 12 und Befund G, NICHT gebaut). Die vier urspruenglichen Wege behandeln Hoehe und Streuung
    als eine Frage - Befund 3 zeigt, dass sie es nicht sind. Gemessen wurde deshalb eine fuenfte,
    in Abschnitt 11 nicht vorgesehene Form: **ein Treffer ist `faktor` mal die NOMINALE
    GESAMTAUSBEUTE der Mission wert statt eine Verdopplung des bis dahin Angesammelten.**
    Erwartungswert dann `1 + n*p*faktor`, also LINEAR in der Missionsdauer statt `(1+p)^n`; bei
    festem Produkt `p*faktor` wird die Streuung zum Regler. Vier Zellen a 20 Laeufe, Produkt 0,140
    gegen den GEMESSENEN Fund-Anteil kalibriert:

    | Zelle | Chance | Faktor | Mittel | VarKoeff | Spanne |
    |---|---|---|---|---|---|
    | heute | 0,08 | Verdopplung | 15,27 | 64,1 % | 7,63x |
    | v_p008 | 0,08 | 1,750 | 14,91 | 27,8 % | 2,72x |
    | **v_p016** | **0,16** | **0,875** | **15,53** | **12,9 %** | **1,56x** |
    | v_p024 | 0,24 | 0,583 | 15,49 | 8,8 % | 1,39x |
    | v_p032 | 0,32 | 0,438 | 15,66 | 7,2 % | 1,29x |

    **DIE KOMPOUNDIERUNG ALLEIN KOSTET DEN GROESSTEN TEIL DER STREUUNG:** bei UNVERAENDERTER
    Chance 0,08 faellt der VarKoeff von 64,1 auf 27,8 % und die Spanne von 7,63x auf 2,72x. Damit
    ist die Verdopplung des ANGESAMMELTEN Betrags als Einzelursache belegt, nicht nur plausibel.
  - **EMPFOHLEN: v_p016 (Chance 0,16, Faktor 0,875).** Niveau unveraendert (+1,7 %), Streuung
    64,1 -> 12,9 %, Spanne 7,63x -> 1,56x. **Warum genau dieser Wert:** die Streuungskurve hat dort
    einen Knick - 0,08 -> 0,16 bringt -14,9 Punkte, 0,16 -> 0,24 nur noch -4,1, 0,24 -> 0,32 nur
    -1,6. Oberhalb kauft man nichts mehr und macht den Fund zur Routine (5,8 bis 7,7 Treffer je
    Mission statt 3,8). Der Wert steht auf einer gemessenen Kurve und nicht auf einem Geschmack.
  - **DAS NIVEAU BLEIBT, AUS EINEM GEMESSENEN GRUND.** Die Woche-1-Baseline vom 20.08.2026 fuehrt
    die Asteroiden mit 18,1 Mrd, und der Zielkorridor von **Entscheidung 3** (7-10 Mrd/Tag) ist so
    gewaehlt, dass weder Raid noch Elite die 50-%-Marke reisst. Jede Kuerzung hier verkleinert den
    NENNER und hebt den Anteil beider - Entscheidung 3 waere neu zu kalibrieren und
    Abnahmekriterium 5 gleich mit. **Der Befund rechtfertigt eine Formaenderung, keine
    Niveauaenderung.** Ebenfalls verworfen: die vollstaendig deterministische Form (VarKoeff
    0,2 %), weil sie eine Mechanik loescht, die der Code-Kommentar ausdruecklich als
    Nutzerentscheidung vom Juli 2026 benennt ("bewusst als Gluecksspiel-Mechanik"); und die
    Ruecknahme der Missionsdauer (Nutzerentscheidung vom 28.07.2026, beruehrt Spielrhythmus,
    dmCap-Rate und Nachschau-Haeufigkeit).
  - **DIE EMPFEHLUNG IST NICHT VOLLSTAENDIG - DREI PUNKTE VOR DEM EINBAU:** (1) **K5 in einer
    `tick`-Zelle**, weil alle Zellen dieser Session ohne Raid laufen und K5 dort strukturell nicht
    entscheidbar ist (Befund 4); (2) **Messregel 8: es GIBT einen Client-Spiegel** -
    `RichFindList` in `pages/Nachrichten.tsx` rendert `msg.detail.richFinds`, und `missions.ts`
    Z. 745 baut den Text "Reicher Fund in Stunde X"; unter der neuen Form ist die STUNDE fuer den
    Wert bedeutungslos, die Anzeige wuerde also etwas hervorheben, das nichts mehr bedeutet;
    (3) **die Eskorten-Praemie wird nicht mehr mitverdoppelt** - sachlich richtiger (ein Minenfund
    ist keine Kampfbelohnung), aber eine zweite Aenderung im selben Paket und als solche zu
    benennen. Geprueft und unproblematisch: fuer Piraten-Sektoren ist der Fund seit dem 29.07.2026
    ohnehin tot (kein `mission.farmed` mehr zum Verdoppeln).
  - **DIE SAMMELLISTE WAECHST DAMIT AUF ZEHN PAKETE** (elf, falls Entscheidung 15 aufgenommen wird).
  - **NEBENERGEBNIS FUER PUNKT 4, vorab geklaert:** `--mensch_unterschritte` kostet **Faktor 1,58**,
    nicht 30 (2 Tage `tick`: 5,7 gegen 9,1 s) - die 30 Unterschritte laufen fuer die Bots ohnehin,
    der zusaetzliche Menschen-tick ist daneben billig. Punkt 4 kostet damit rund **75 Minuten**
    statt der befuerchteten Stunden, der Schalter kann verwendet werden. **Vorbehalt, NICHT
    behoben:** mit dem Schalter laeuft `probe()` 30x je Stunde, `spielerZug()` nur einmal -
    `ressourcenAblehnung` wird nur dort zurueckgesetzt, **K3b ist dadurch vermutlich nach oben
    verzerrt.** K2 ist nicht betroffen. Vor Punkt 4 zu klaeren.
  - **ANKERCHECK, ZWEI LAEUFE: +0,4 % und -1,5 %.** Neun Messungen desselben Ankers liegen bei
    +0,4 / -1,0 / -1,1 / -1,2 / -1,5 / -1,6 / -1,8 / -2,3 / -2,8 %. **Die Spanne ist 3,2 Punkte,
    nicht "rund 2", und der Anker kann positiv ausfallen** - die Erwartung "-1 bis -3 %" ist zu eng
    gefasst. Ein einzelner Wert ausserhalb des Bandes belegt keinen defekten Build; erst der zweite
    Lauf hat das entschieden.
  - **GRENZEN:** ein Profil, ein Treiber (`economy`, also ohne Raid - die K5-Spalte ist deshalb
    NICHT mit `k5_quellen.txt` Abschnitt 8b vergleichbar), 7 Tage. Die absoluten Betraege der
    4-h-Zelle unterschaetzen um rund 13 %, weil das Modell stuendlich handelt und bis zu eine Stunde
    zwischen Rueckkehr und Neustart verliert; die normierte Spalte ist dagegen immun. Die
    Form-Gegenprobe ist ein Messbuild-Konstrukt, **kein Bauvorschlag.**

- **NEU 26.08.2026 (fuenfte Session): EINNAHMEN NACH QUELLE INSTRUMENTIERT - SCHRITT 3 DER LISTE
  IST ERLEDIGT. K5 UND K6 SIND AB SOFORT ERHEBBAR. NICHTS AM SPIELCODE GEBAUT.** Protokoll
  `balance/session2-simulation/k5_quellen.txt`, Werkzeuge
  `WERKZEUGE_26-08-2026_fuenfte-session.md`. **Messbuild-Protokoll.**
  - Neues Werkzeug `make_messbuild_k5.mjs`, **zweistufig auf `/tmp/sim13/dist` aufgesetzt** statt
    `make_messbuild_sim13.mjs` zu erweitern - so bleibt dessen Blockzaehlung
    A 9 / B 2 / C 3 / D 5 / E 2 = 21 als Echtheitspruefung unberuehrt und die Instrumentierung
    laesst sich abschalten. 18 Patches, jeder mit hartem Abbruch. Alle Haken rufen
    `globalThis.__K5?.(...)`, ohne gesetzten Haken tut der Build nichts.
  - **DIE GEGENPROBE IST DER EIGENTLICHE BELEG, NICHT DIE TABELLE.** Ein Anteilskriterium, dessen
    Nenner aus den instrumentierten Zeilen selbst gebildet wird, sieht auch dann sauber aus, wenn
    eine Buchungsstelle fehlt - die Anteile summieren sich weiter auf 100 %. Deshalb misst
    `sim13_lauf.mjs` den Nenner UNABHAENGIG (Accessoren ueber `state.resources`, erfassen auch die
    indizierten Zugriffe). Ergebnis: **"nicht zugeordnet" = 0,000 % in sechs von sechs Laeufen.**
  - **BEFUND 1, GROESSTE EINZELQUELLE DER WOCHE 1 IST DER REICHE FUND** - 54,2 bis 81,9 % in sechs
    Laeufen. `ASTEROID_RICH_FIND_CHANCE = 0,08` je Stunden-Check, und der Fund VERDOPPELT den bis
    dahin angesammelten Farm-Betrag; bei 12-Stunden-Missionen kompoundiert das.
    **Die gesamte Streuung des Laufs kommt aus dieser einen Mechanik**: Mining (3,054 bis 3,055
    Mrd), Praemie (1,61 bis 1,63) und Minen (0,35 bis 0,45) liegen ueber alle Laeufe praktisch
    fest, `reicher_fund` schwankt zwischen 8,4 und 23,0 Mrd. Damit ist nebenbei erklaert, warum die
    Kopfzahl "Wert am Tag 7" ueber die Sessions zwischen 2,92 und 6,77 Mrd schwankte, ohne dass sich
    am Modell etwas geaendert haette. **K5 ist in jedem Lauf verletzt - durch eine Quelle, die
    weder im Plan noch in der Aufgabenstellung vorkam.** Dritte Wiederholung derselben Fehlerform:
    ein Anteilskriterium zeigt auf die falsche Quelle, und man sieht es erst, wenn alle Quellen
    NEBENEINANDER stehen. **Ob die Hoehe gewollt ist, ist eine Balance-Frage und NICHT bewertet.**
  - **BEFUND 2, DER TREIBER LOESTE BISHER KEINEN EINZIGEN RAID AUS.** Am Code nachgezaehlt:
    `processRaidTimer()` hat genau zwei Aufrufer, `actions.js` (in `tick()`) und `heartbeat.js`.
    `sim13_lauf.mjs` rief keines von beidem - `heartbeat.js` war importiert und nirgends benutzt.
    Im Lauf existierten dadurch **exakt zwei Einnahmequellen**; kein Raid, keine Gruppen-Operation,
    kein geoeffneter Container. Da K5 seit dem 20.08.2026 ausdruecklich Entscheidung 3 traegt und
    der Raid dort mit 58-64 % die groesste Quelle ist, waere K5 formal erhoben und sachlich leer
    gewesen. Neuer Schalter **`--treiber=economy|tick`**, Standard unveraendert. Mit `tick`
    kommt der Raid an: **26,6 % der Woche 1 ueber 123 Container**, Kosten Faktor 7,6.
  - **BEFUND 3, DIE HEIMATFLOTTE WIRD AB TAG 20 BEI JEDEM RAID VOLLSTAENDIG VERNICHTET -
    ABNAHMEKRITERIUM 1 IST VERLETZT.** 30 Tage, Profil aktiv, `tick`, vollstaendig durchgelaufen:
    Tag 20, 23 und 27 jeweils elf Verlustereignisse und Flottenmacht auf 0,00 bis 0,05 Mrd. **K1
    92,0 %, K1b 99,9 %.** Der Aufbau zwischen zwei Checkpoints (rund drei Tage) reicht nicht, um
    wieder verteidigungsfaehig zu sein. Ohne `tick`-Treiber war das unsichtbar. Zuordnung
    deterministisch: das Modell schickt auf Asteroidenfelder nur `mining` und `begleitschiff`, die
    Kampfschiffe verlassen die Heimatbasis nie.
    **KORREKTUR EINER FRUEHEREN FASSUNG DIESES EINTRAGS:** dort stand, K1 uebersehe den Verlust und
    melde 6,1 %. Das war falsch zugeordnet - die 6,1 % stammten aus dem 14-Tage-Lauf ohne
    Totalverlust, der 30-Tage-Lauf war abgebrochen und hatte nie eine Endauswertung geliefert.
    **Genau die Fehlerform, vor der die Fallen-Liste warnt: eine Zahl aus einem Lauf neben einer
    Beobachtung aus einem anderen.** Richtig und schwaecher: K1 unterschaetzt systematisch (92,0
    gegen 99,9 %), weil es je STUNDE zaehlt und ein Raid ueber zwoelf Wellen laeuft - es haette die
    Schwelle verfehlen koennen, hat sie hier aber gerissen.
  - **K1b IST GEBAUT** (Nutzer hat die Entscheidung am 26.08.2026 ueberlassen): groesster Rueckgang
    vom Hoch der letzten 24 Stunden. **K1 bleibt unveraendert**, wie bei K3/K3b - es hat ueber
    mehrere Sessions Vergleichswerte. Fenster bewusst begrenzt, sonst zaehlte auch eine langsame
    Zermuerbung ueber Wochen als ein Ereignis. Gegenprobe: ohne mehrstuendiges Ereignis liefern K1
    und K1b denselben Wert (zweimal 6,1 %) - die Kennzahl erfindet nichts.
  - **BEFUND 4, K4 WAR WIRKUNGSLOS UND IST JETZT AN DIE ECHTEN SPERREN GEHAENGT.** Vorher meldete
    der Lauf am Tag 0 sieben Sektoren gleichzeitig (npcFloor 300.000 bis 3.000.000 gegen rund
    60.000.000 Startflottenmacht). **Sektoren taugen strukturell nicht als Massstab:** es gibt keine
    Sperre, und die Piraten-Sektoren skalieren mit der eigenen Macht mit - dort wird nie etwas
    freigeschaltet, es wird nur schwerer. Schiffe, Verteidigung und Forschung haben ueberhaupt keine
    Voraussetzung (`tier` in `ships.ts` ist eine Klassenbezeichnung, keine Sperre). **Gestaffelt
    freigeschaltet wird genau viererlei:** Heimatbasis-Stufe V2/V3 (`HOME_TIER_UNLOCK_LEVELS`,
    Minen 36/32/30), Stations-Stufe (`checkTierUnlock()`), Imperator (Teile-Sperre 1.000 je
    Kategorie), Sandronator (`unique`). **Ergebnis nach der Umstellung: Wochen 1 bis 4 ohne eine
    einzige Freischaltung** - jetzt eine Aussage ueber das Spiel statt ein Artefakt der Kennzahl.
    Belegt von den Minen-Staenden 22/21/21 am Tag 7 gegen die Schwelle 36/32/30.
  - **BEFUND 5, K6 IST DEUTLICH VERLETZT:** laengstes Plateau **26 Tage ab Tag 4** (Kriterium:
    keines ueber 5 Tage). Erste Erhebung ueberhaupt.
  - **EINSCHRAENKUNG ZU BEFUND 1, WICHTIG:** ueber acht Laeufe liegt der groesste K5-Anteil zwischen
    **39,8 % und 81,9 %** - die 50-%-Schwelle verlaeuft mitten durch die Spanne. Ohne Raid ist K5
    verletzt, im 30-Tage-Lauf mit Raid ist es **erfuellt** (39,8 %), nicht weil der Reiche Fund
    kleiner waere, sondern weil der Raid den Nenner verbreitert. **K5 ist damit nicht stabil
    entschieden, und was entscheidet, ist ein einzelner Wuerfel.** Deshalb mindestens drei Laeufe
    je Profil.
  - **FALLE, DIE VOR DEM ERSTEN LAUF GEGRIFFEN HAT:** `mission.farmed` sammelt VIER Quellen ein -
    an der Auszahlung in `finalizeMission()` zu buchen trennt nichts, gebucht werden muss beim
    FUELLEN. Genau daraus folgt: `abortMissionDestroyed()` zahlt NICHTS aus. Wer beim Auflaufen
    bucht, zaehlt eine verlorene Mission als Einnahme, und zwar unsichtbar. Loesung: je Mission in
    `mission.__k5` sammeln, Commit ausschliesslich in `finalizeMission()`.
  - **EIGENER FEHLER, MESSREGEL 16 ZUM DRITTEN MAL:** zwei Anker fuer `groupOps.js` aus der
    TypeScript-Quelle statt aus dem kompilierten `dist` uebernommen (acht statt vier Leerzeichen).
    Der harte Abbruch hat es sofort gemeldet. **Vierter Fundort derselben Fehlerform.**
  - **GRENZEN, AUSDRUECKLICH:** die 30-Tage-Laeufe der drei Profile (Punkt 4) sind NICHT gefahren.
    Die Laeufe hier sind Funktionsnachweise: ein Profil, keine Wiederholungen. Bei rund 20
    Prozentpunkten Streuung allein aus dem Reichen Fund traegt **kein Anteilswert daraus eine
    Entscheidung** - was sie tragen, ist die Rangfolge, und die ist in sechs von sechs Laeufen
    dieselbe. `piraten_pluenderung`, `piraten_beutekurve`, `wrack_bergung`, `container_mission`,
    `gruppe_*` und `dm_raid` sind instrumentiert, aber in keinem Lauf belegt worden - ihre 0,00 ist
    Abwesenheit im Modell, **kein Nachweis, dass die Buchung sitzt.**

- **NEU 26.08.2026 (vierte Session, zweiter Teil): SPIELERMODELL ENTSTOERT - SCHRITT 2 DER
  LISTE IST ERLEDIGT. NICHTS AM SPIELCODE GEBAUT.** Protokoll
  `balance/session2-simulation/spielermodell_diagnose.txt`. **Messbuild-Protokoll.**
  - **Der Stillstand ab Tag 3 hatte FUENF Ursachen, nicht eine**, und zwei davon schalteten
    jede fuer sich schon BEIDE Einnahmequellen ab: (b) der Minenertrag war **exakt null**, weil
    `mineOutputPerHour()` mit `energyFactor() = min(1, produziert/verbraucht)` multipliziert und
    der alte Gebaeudezweig ueber `b.baseOutput` filterte - Solarkraftwerk, Roboterfabrik und
    Nanitenfabrik haben dort `null`, das Modell konnte ein Kraftwerk **konstruktionsbedingt
    nicht bauen**; (c) `sendFleet()` prueft `miningCap` (300/220/180) und `escortCap` (500),
    das Modell bot die GANZE Flotte an und wurde ab 180 Mining-Schiffen jede Stunde abgelehnt.
  - **(a) DIE AKTIONEN WERFEN NICHT** - `startBuild()`/`startResearch()`/
    `startBuildingConstruction()`/`sendFleet()` liefern `{ ok:false, error }` zurueck. Die
    `try/catch`-Bloecke fingen deshalb nie etwas, und `handelte = true` wurde auch bei jedem
    Fehlschlag gesetzt. **Das ist der Grund, warum der Defekt so lange unentdeckt blieb.**
  - Dazu (d) 1400 Spionagesonden (0 Kampfkraft, 8.000 Kristall je Stueck, 11,2 Mio Kristall
    verbrannt) und (e) 720 Fehlversuche je Lauf an gesperrten V2/V3-Stufen.
  - **NACH DER KORREKTUR laeuft es durch:** Wert 0,02 -> 3,19 Mrd, Flottenmacht 0,06 -> 0,80 Mrd
    ueber sieben Tage; K1 erfuellt (6,6 % groesster Einzelverlust), Forschungs-Leerlauf 2,4 %.
    Endzustand Minen 22/21/21, Solar 26, Roboterfabrik 19.
  - **NEUER BEFUND, NUTZERENTSCHEIDUNG NOETIG: METALL IST DER ENGPASS, UND K3 SIEHT ES NICHT.**
    Ressourcen am Tag 7: Metall 1 Mio, Kristall 337 Mio, Deuterium 979 Mio, dazu 335 x
    "GEBAEUDE: Nicht genug Ressourcen". Der Gebaeude-Leerlauf von 75 % ist also ein echter
    Engpass - **K3 meldet trotzdem 0,0 %**, weil die Kennzahl verlangt, dass ALLE Lanes belegt
    sind. Ein Ressourcenstau, den die Stau-Kennzahl nicht erfasst. Das ist eine Schwaeche der
    K3-DEFINITION, keine Frage des Modells, und gehoert geklaert, **bevor Zahlen aus K3 zitiert
    werden.** Zweite offene Frage: `begleitschiff` traegt `stats.waffen = 350`, landet dadurch
    zusaetzlich in der Kampfschiff-Liste und wird ueber `escortCap` hinaus gebaut (3420 gegen
    Cap 500).
  - **EIGENER FEHLER, MESSREGEL 16 ZUM ZWEITEN MAL:** die erste Korrektur filterte ueber
    `sh.waffen`. Das Feld gibt es nicht - die Kampfwerte stehen unter `sh.stats`. Die Liste war
    LEER, das Modell baute null Kampfschiffe, und aufgefallen ist es nur an einer Flottenmacht
    von exakt 0,00 Mrd ueber sieben Tage. Zweiter eigener Fehler: der Vorschlag, den Schiffsbau
    bei gedecktem Cap zu stoppen - **ein Modell, das aus Zufriedenheit aufhoert zu bauen,
    erzeugt leere Slots, und Leerlauf IST K2.** Verworfen, bevor er gebaut wurde.
  - **BEIDE OFFENEN PUNKTE SIND ENTSCHIEDEN (26.08.2026) UND GEBAUT:**
    - **`begleitschiff` nur noch bis `escortCap`.** Aus der Geschmacksfrage wurde eine Messung:
      Kosten je Machtpunkt betragen 1,10 bis 1,18 bei allen echten Kampfschiffen und **3,37
      beim Begleitschiff** - dreimal ineffizienter, mit genau einer sinnvollen Rolle. Wirkung
      gemessen: **die Flottenmacht steigt bei gleichem Ressourceneinsatz von 0,80 auf 1,41 Mrd.**
      Flotte am Tag 7 jetzt plausibel: leicht 2950, schwer 1750, kreuzer 1225, begleitschiff 522.
      *Vorbehalt:* `combatFleetPowerBase()` kennt keine Sonderfaehigkeiten, die Salven-Schiffe
      stehen mit 5,6 bis 7,3 nur deshalb schlecht da.
    - **K3 bleibt unveraendert, K3b kommt daneben.** Die Definition NICHT anzufassen war
      ausdrueckliche Entscheidung - K3 hat ueber mehrere Sessions Vergleichswerte, eine
      geaenderte Definition haette sie alle entwertet. K3b zaehlt: Lane leer, Ablehnung "Nicht
      genug Ressourcen", Gesamtwert reicht trotzdem. **Ergebnis: K3b 50,0 %, wo K3 0,0 %
      meldet.** In der Haelfte aller Proben steht eine Lane still, weil genau ein Rohstoff fehlt.
    - **DEUTUNG STEHT NOCH AUS:** die 50 % sind ein Befund ueber das SPIEL, nicht ueber das
      Modell. Ob die starke Metall-Bindung gewollt ist (Metall 1 Mio gegen Kristall 328 Mio und
      Deuterium 811 Mio), ist eine Balance-Frage und **nicht bewertet**.
  - **NAECHSTER SCHRITT: Punkt 3 - Einnahmen nach Quelle instrumentieren (K5).** Nichts blockiert
    ihn mehr.

- **NEU 26.08.2026 (vierte Session, nach Nachreichung der Werkzeuge): BLOCK A SCHRITT 2 IST
  VERDRAHTET UND ZAHLT - BELEGT. NICHTS GEBAUT, KEIN EINGRIFF IN `server/src`.** Protokoll
  `balance/session2-simulation/verdrahtung_a.txt`, Werkzeug `probe_verdrahtung_a.mjs` (neu),
  Werkzeugdoku `WERKZEUGE_26-08-2026_vierte-session.md`. **Messbuild-Protokoll.**
  - **Die Grenze aus `sim13_geruest.txt` Abschnitt 4 ist geschlossen.** Echte Missionsschleife
    (`sendFleet()` -> sieben Zeitschritte a 4 h durch `processMissions()` -> `finalizeMission()`)
    **0,0925** Wert-Einheiten je Punkt vernichteter Feindmacht, Referenzschleife **0,0924** -
    **+0,1 % bei 40 Durchlaeufen je Seite.** Kein Nachbau einer Teilrechnung: ausgewertet wird,
    was hinterher auf `state.resources` und in `state.inventory` steht.
  - **DIE GEGENPROBE IST DER EIGENTLICHE BELEG.** Dieselbe Probe gegen den UNVERDRAHTETEN
    Eingangs-Build: **+72,8 %**. Trennabstand 73 Punkte gegen rund 2 Punkte Streuung. Ohne diesen
    Lauf waere die Uebereinstimmung oben nicht von Zufall zu unterscheiden. Drei unabhaengige
    Merkmale trennen die Builds, nicht nur die Summe: Container je Mission 1,00 gegen 4,40
    (Patch A5), Ertrag je Punkt 0,1028 gegen 0,1711 (A3), Punkte-Korrektur -0,092 Mrd gegen
    0,000 (A6, Fehlerform R6).
  - **DIE ZWEI VERDOPPLER SIND BEANTWORTET - DURCH DEN CODE, NICHT DURCH EINE ENTSCHEIDUNG.**
    Patch A3 legt Sandronator x2 und Wochen-Event x2 auf den RESSOURCEN-Teil
    (`__m = __kurve * sandronatorBonus * eventBonus`), Patch A5 zahlt den Container EINMAL je
    Mission OHNE die Verdoppler. Das ist Weg (1) aus dem Plankasten bei Entscheidung 2, in einer
    dort nicht vorgeschlagenen Form. **Gebaute Setzung, keine gemessene Groesse** - die Wirkung
    an Montagen und Freitagen ist nicht gemessen. **Auflage an jede kuenftige Probe:** nicht an
    einem Mo/Fr laufen lassen, keinen Sandronator einsetzen, sonst liegen Probe und Referenz um
    Faktor 2 auseinander und es sieht wie ein Verdrahtungsfehler aus.
  - **Die Bergung ist im Ertrag sichtbar:** 10,0 % der Belohnung, und der Abzug auf
    `stats.resourcesSpentShipsDefense` erfolgt (-0,092 Mrd).
  - **GRENZEN, ausdruecklich:** geprueft ist `missions.js` in EINER Zelle (mittel /
    piraten_hoch / FLEET_LARGE). **`groupOps.js` ist NICHT geprueft** - der Verweis auf
    `loot.js` ist dort vorhanden, dass er zahlt, ist nicht belegt (Patches A7-A9, zusaetzlich
    Koop-Aufschlag und Beitragsanteil V2). Die Bergungs-HOEHE ist nur auf Groessenordnung
    geprueft, nicht gegen einen unabhaengigen Sollwert. Bloecke B bis E sind unberuehrt.
  - **Werkzeug-Herkunft geprueft, bevor gemessen wurde:** Blockzaehlung A 9 / B 2 / C 3 / D 5 /
    E 2 = 21, `ownerUsername` in C3, Zielpruefung auf `/dist`, `node_modules`-Symlink, dazu
    `mission.curvedWin`/`mission.lostUnits` - Details, die aus dem Protokoll nicht
    rekonstruierbar sind. **Kein Nachbau.** Ankercheck des wiederhergestellten Builds
    **-1,2 %**; fuenf Messungen desselben Ankers liegen jetzt bei -1,1 / -1,2 / -1,8 / -2,3 /
    -2,8 %.
  - **EIGENER MESSFEHLER, im Diagnoselauf gefangen:** die Bergung bucht ueber
    `Math.max(0, ...)` gegen `stats.resourcesSpentShipsDefense`. Bei Startwert 0 ist der Abzug
    rechnerisch nicht sichtbar - die Probe meldete "0,000 Mrd", was wie ein FEHLENDER Abzug
    aussieht. **Eine Buchung, die gegen eine Untergrenze laeuft, ist bei leerem Konto nicht
    beobachtbar.**
  - **NAECHSTER SCHRITT unveraendert Punkt 2 aus `sim13_geruest.txt` Abschnitt 8** (Spielermodell
    entstoeren). Klein und jetzt naheliegend als 1b: dieselbe Probe fuer `groupOps.js` - das
    Werkzeug steht, nur die Schleife ist auszutauschen.

- **~~NEU 26.08.2026 (vierte Session): DIE VERDRAHTUNGSPROBE KONNTE NICHT GEFAHREN WERDEN~~ -
  AUFGELOEST AM SELBEN TAG, die Werkzeuge wurden nachgereicht. Der Eintrag bleibt wegen der
  Falle stehen, die daraus folgt.** `make_messbuild_sim13.mjs` und
  `sim13_lauf.mjs` fehlten in `balance/session2-simulation`. Nicht geloescht, sondern **nie
  hochgeladen**: `git log --all --diff-filter=A` kannte beide Dateinamen nicht, waehrend
  `sim13_geruest.txt` aus derselben Session vorhanden war. Der Upload hatte das Protokoll
  mitgenommen und die Werkzeuge nicht. **Nichts gebaut, kein Eingriff in `server/src`.**
  - **FOLGE 1 ~~: die Zahl -2,0 % ist nicht mehr reproduzierbar~~** - erledigt, der Build laesst
    sich wieder erzeugen; der Ankercheck liefert jetzt -1,2 % in derselben Streubreite.
  - **FOLGE 2: nicht nur Schritt 1 der Liste in `sim13_geruest.txt` Abschnitt 8 haengt, sondern
    alle vier.** Schritt 2 (Spielermodell entstoeren) und Schritt 3 (Quellen-Instrumentierung)
    arbeiten beide an `sim13_lauf.mjs`, Schritt 4 faehrt es.
  - **WAS GEPRUEFT UND GUELTIG IST:** `npm install` + `npx tsc -p tsconfig.json` laufen sauber
    durch, `make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08` baut, und
    `MESSBUILD=/tmp/mb_kum node check_build_anker.mjs 40` liefert **normiert -1,8 %** (roh +5,3 %,
    1,105 Mrd bei 11,895 Mrd Feindmacht, 4,67 Siege). Damit liegt der Eingangs-Build im Band der
    vier bisher gemessenen Werte desselben Ankers (-1,1 / -1,8 / -2,3 / -2,8 %) und die
    Werkzeugkette ist arbeitsfaehig. **Die roh/normiert-Falle reproduziert sich zum vierten Mal.**
  - **AM CODE NACHGEZAEHLT, was fuer die Verdrahtung noch fehlt** (Anker aus `/tmp/mb_kum`
    gelesen, nicht aus der TS-Quelle): `missions.js` und `groupOps.js` importieren
    `fleetSizeRewardMultiplier` weiterhin aus `combat.js` und rufen sie in `runHourlyCheck()`
    (Z. 321) bzw. `runGroupHourlyCheck()` (Z. 713) auf; `game/loot.js` liegt im Build und wird von
    keiner der beiden Dateien referenziert. Die Belohnung laeuft unveraendert ueber
    `mission.combatWins` und wird in `finalizeMission()` (Z. 604 ff.) als
    `combatWins * winContainer.count` und `winResources * combatWins` ausgezahlt.
  - **NEUE OFFENE FRAGE AN DIE BAUANLEITUNG VON ENTSCHEIDUNG 2, aus demselben Nachzaehlen:**
    `mission.combatWins` traegt heute ZWEI Verdoppler mit sich (Sandronator x2, Wochen-Event
    Mo/Fr x2, beide in `runHourlyCheck()` direkt auf den Zaehler multipliziert). Faellt der
    Container-Fund auf EINMAL JE MISSION und wird `winResources` auf die Kurve umgestellt, verliert
    dieser Zaehler seine Traegerfunktion - und die Bauanleitung sagt nicht, wo die beiden
    Verdoppler danach landen. Die Referenzschleife in `check_build_anker.mjs` kennt beide nicht.
    **Das ist keine Randfrage: sie entscheidet mit, ob Probe und Referenz ueberhaupt
    uebereinstimmen koennen.** Siehe Messkasten bei Entscheidung 2.
  - **METHODISCHER VORBEHALT ZUR WIEDERHERSTELLUNG, ausdruecklich:** wer die neun Block-A-Patches
    jetzt neu schreibt und danach gegen `check_build_anker.mjs` prueft, prueft seine eigene
    Nachbildung gegen die Vorlage, nach der er sie geschrieben hat. Das belegt, dass die Semantik
    der Referenzschleife im echten Codepfad ueberhaupt herstellbar ist, und es liefert die
    Patch-Anker fuer die Bauanleitung - es belegt NICHT die urspruengliche Aussage
    ("der Build vom 26.08. zahlt"). Die ist mit dem Build verloren.

- **NEU 26.08.2026 (dritte Session): SIMULATIONS-MESSBUILD UND SIMULATIONSGERUEST GEBAUT UND
  GEPRUEFT. DER LAUF IST NOCH NICHT AUSWERTBAR.** Protokoll
  `balance/session2-simulation/sim13_geruest.txt`, Werkzeuge `make_messbuild_sim13.mjs` und
  `sim13_lauf.mjs` (beide neu, siehe `WERKZEUGE_26-08-2026.md`). **Messbuild-Protokoll. Keine
  Zeile `server/src` veraendert.**
  - **21 Patches in fuenf Bloecken** (Block A Schritt 2 verdrahtet in `missions.js` UND
    `groupOps.js`, Entscheidung 18, 3, 12, 13.1). Entscheidung 16 aus dem Eingangs-Build,
    Entscheidung 19 begruendet draussen. Ankercheck **normiert -2,0 %** gegen -1,1 % des
    Eingangs-Builds, beide gueltig - **aber der Ankercheck prueft die Kurven-KONSTANTEN, nicht die
    neue Verdrahtung.** Dass Block A tatsaechlich zahlt, ist noch NICHT belegt; die
    Verdrahtungsprobe ist der naechste Messschritt.
  - **Zwei vom Nutzer delegierte Entscheidungen eingetragen, beide umkehrbar** (wie f = 12 und
    Befund G): **Bot-Takt = 30 Unterschritte a 2 Minuten, nur fuer die Bots** - 30 Aufrufe im
    selben Zeitpunkt waeren an der 60-s-Sperre in `runGlobalHeartbeat()` als `skipped` verpufft,
    30 direkte `runBotTurn()`-Aufrufe ohne `tick()` dazwischen waeren nach dem dritten Zug an
    `MAX_BUILD_SLOTS` haengengeblieben. **Gemessen: rund 40 s je Profil und 30-Tage-Lauf** - die
    im Plan befuerchteten Kosten der "teuren Variante" sind bedeutungslos, der
    Stundenaufloesungs-Vorbehalt aus Abschnitt 1b laesst sich damit schliessen statt vermerken.
  - **Entscheidung 3: es fehlte gar keine Zahl** (Lesefehler der Vorsitzung). Der "feste Topf"
    IST die heutige Vollauszahlung `wavesWon * RAID_WAVE_WIN_*`; neu ist nur, dass sie EINMAL
    vergeben und nach Beitrag geteilt wird statt fuer Verteidiger, jeden Verstaerker und jeden
    Halter einzeln zu laufen. Einzelverteidiger ohne Beistand bekommt exakt so viel wie heute.
  - **ARITHMETISCHER BEFUND, BITTE GEGENLESEN:** mit der Saettigungsform aus 9.1a
    (`eff = roh / (1 + roh/S_MAX)`) und `S_MAX = 1,5` ergibt die im Messkasten genannte Rohsumme
    von 2,41 Aequivalenten **0,92**, nicht die dort ausgewiesenen **1,20**. Fuer 1,20 braeuchte es
    `S_MAX = 2,39`. 0,92 entspricht rund 5,8 Mrd/Tag und liegt UNTER dem Korridor 7-10 Mrd/Tag.
    Entweder andere Saettigungsform, andere Rohbasis oder Rechenfehler im Messkasten - nicht
    entschieden.
  - **NEUE FALLE, im Plan bisher nicht vermerkt:** liegt der Laufordner ausserhalb des
    Server-Baums, findet das importierte `db.js` `better-sqlite3` nicht. Node loest von
    `<lauf>/dist/db.js` nach oben auf. `make_messbuild_sim13.mjs` legt deshalb einen Symlink
    `<lauf>/node_modules` an. Betrifft **jedes** Skript, das `state.js` laedt - die bisherigen
    fielen nicht darauf herein, weil sie `db.js` nie importieren.
  - **WAS NICHT GEHT:** das Spielermodell laeuft ab Tag 3 in ein ausgehungertes Gleichgewicht
    (0,03 Mrd stehend, 100 % Leerlauf). Drei Geruest-Defekte gefunden und behoben (kein Feld
    `miningCapable` - Messregel 16 in Reinform; Missionsversand beschrieben aber nicht gebaut;
    Leerlauf muss slotbasiert gezaehlt werden, sonst definiert er Kriterium 2 weg). Ob das
    Stehenbleiben ein vierter Defekt oder eine echte Aussage zur Startphase ist, ist NICHT
    getrennt. **Bis dahin darf keine Zahl aus dem Lauf zitiert werden.**
  - **K5 UND K6 SIND NICHT ERHEBBAR**, solange die Einnahmen nicht nach Quelle instrumentiert
    sind - die Spielfunktionen buchen direkt auf `state.resources`, ohne Herkunft. Da K5 seit dem
    20.08.2026 der Traeger von Entscheidung 3 ist, ist genau der neu dazugekommene Block noch
    nicht messbar. Groesste offene Luecke der Simulation.

- **NEU 25.08.2026 (zweite Session, Nutzerfrage): OFFENER PUNKT BEI ENTSCHEIDUNG 9.2 NACHGETRAGEN -
  DIE MODUL-SLOTS FEHLTEN IN DER SLOT-REDUKTION.** 9.2 nennt Forschung (4 -> 1), Schiffe und
  Verteidigung (3 -> 1) und Gebaeude (steht schon auf 1). `MAX_SHIP_MODULE_SLOTS` und
  `MAX_DEFENSE_MODULE_SLOTS` stehen beide auf **3** und wurden laut Code-Kommentar ausdruecklich
  "analog zu den 3 normalen Bauplaetzen" von 1 auf 3 angehoben - also mit genau der Begruendung, die
  9.2 umdreht. Unentschieden, ob sie mitgehen. Gemessen ist dazu nichts; gehoert in dieselbe
  Kalibrierung gegen Kriterium 2 und 3 der 30-Tage-Simulation. Beide Wege samt Folgen stehen bei 9.2.
  **Zwei Klarstellungen aus derselben Nachfrage, damit sie nicht wieder aufgerollt werden:**
  - **Die heutige RF-Tabelle trifft in vier von acht Faellen schon die eigene Klasse**
    (schwer->leicht, schlachtschiff->kreuzer, zerstoerer->schlachtkreuzer, reaper->zerstoerer), aber
    immer nur EINEN Vertreter, und drei Faelle treffen die Klasse darunter. Entscheidung 16
    Variante A aendert trotzdem strukturell etwas: `leicht` bekommt zum ersten Mal ueberhaupt RF
    (daher der zwingende `ZIELERFASSUNG_BASE`-Eintrag), `bomber` zum ersten Mal Schiffs-RF, und
    `bomber`/`reaper` werden erstmals von Standardschiffen gekontert. **Der grosse Hebel ist aber
    nicht die Tabelle, sondern der Groessenklassen-Ausweichbonus** (Befund 4 in `rf_depth.txt`).
  - **"Eigene Klasse plus die darunter" ist Variante C und wurde am 19.08.2026 gemessen und
    verworfen** (Befund 3): sie verschiebt das Problem nur von der Elite- auf die Kreuzer-Klasse,
    die dann in allen drei Wellen bei 0 % Siegquote bleibt.

- **NEU 25.08.2026 (zweite Session): DER OFFENE PUNKT AUS ENTSCHEIDUNG 19 IST GEMESSEN - JA, WEG 2
  MACHT DIE ENDGAME-MISSIONEN MERKLICH LEICHTER. NICHTS GEBAUT.** Protokoll
  `balance/session2-simulation/volley_mission_19.txt`, Werkzeug `probe_volley_mission_19.mjs` (neu).
  Zwei Builds, die sich AUSSCHLIESSLICH in Weg 2 unterscheiden (`--je=20000 --deckel=16`), je zwei
  Scheiben a 40 Serien.
  - **Deterministische Vorfrage zuerst, ohne eine einzige Serie:** Weg 2 ist unterhalb von rund
    **20.000 eigenen Schiffen wirkungslos** (Treffer/Typ = 1) und laeuft ab Anteil 0.3 in den
    Deckel. Die Zelle 0.005, in der Zahl 2 kalibriert wurde, liegt vollstaendig ausserhalb seines
    Wirkungsraums - deshalb war dort nichts zu sehen.
  - **Verlust je Punkt vernichteter Feindmacht, Seite A:** 0.02 **-2,3 %**, 0.1 **-8,0 %**,
    0.3 **-12,3 %**, 1.0 **-14,3 %**. Kontrolle (Seite B, ohne Salvenschiffe, von Weg 2 gar nicht
    erreichbar) bleibt bei -0,8 % bis +3,1 % - **das ist das Build-Rauschen bei 80 Serien**, und in
    den beiden tragenden Zellen ist es mit -0,8 % und +0,4 % am flachsten.
  - **Beute je Punkt Feindmacht unveraendert** (-0,1 % / -0,4 %). Weg 2 wirkt auf der
    Verlustseite, nicht auf der Bemessung.
  - **Netto je Mission, Zelle 1.0: VORZEICHENWECHSEL von -6,96 Mrd auf +6,75 Mrd.** Die
    Endgame-Mission mit Salvenschiffen war im Ist-Zustand ein Verlustgeschaeft und traegt sich mit
    Weg 2. Zelle 0.3 +52,5 %, Zelle 0.1 +10,5 %, Zelle 0.02 im Rauschen. **Ob das gekippte
    Vorzeichen erwuenscht ist, ist eine Balance-Frage und gehoert vor den Einbau auf den Tisch -
    Entscheidung 19 selbst bleibt davon unberuehrt.**
  - **Bestaetigt den Ausschluss von 19 aus dem Simulations-Messbuild**, der bisher nur
    deterministisch begruendet war: unterhalb 20.000 Schiffen wirkungslos, ein 30-Tage-Konto liegt
    weit darunter.
  - **Messregel 8: KEIN Client-Spiegel.** Weg 2 sitzt vollstaendig in `combat.ts` (`fireShots()`,
    Einzelziele und Aggregat-Stapel); der Client zeigt nur die Faehigkeit, nicht die Trefferzahl.
  - Build-Pruefung gegen `loot_curve.txt`: **normiert -2,3 %, roh +6,7 %** - die Falle
    reproduziert sich erneut.

- **NEU 25.08.2026 (zweite Session): SCHRITT 13 IST BEGONNEN - V1 UND V2 SIND GEKLAERT, V3 IST
  NEU UND OFFEN. NICHTS GEBAUT.** Protokoll `balance/session2-simulation/sim_vorbedingungen_13.txt`,
  Werkzeug `probe_simclock_13.mjs` (neu). **Kein Messbuild-Protokoll** - die Sonde laeuft
  absichtlich gegen den Repo-Build, weil sie Infrastruktur misst und keine Balance-Zahl. Alles
  deterministisch, keine Serien.
  - **Reihenfolge auf Nutzerfrage entschieden: V1 vor V2.** V2 hatte ein dreifach erprobtes
    Muster, V1 nur ein punktuelles; V1 entscheidet die Architektur, V2 nur den Ablageort; V1 hat
    eine Gabelung (Weg (b) griffe in genau die Dateien ein, die Block A bis D anfassen).
  - **V1 IST GELOEST, WEG (a).** Ausgezaehlt statt geschaetzt: **`Date.now` ist die EINZIGE
    Zeitquelle in `server/src`** - null argumentlose `new Date()`, null `performance.now`, null
    `hrtime`, null Modul-Capture. Ressourcenzuwachs aus `runEconomyTick()` bei 0/1/5 Stunden auf
    **0,000000 %** genau; Wochentagslogik und `processRaidTimer()` folgen bis zum echten
    Raid-Spawn.
  - **DIE "BEKANNTE LUECKE" IM WORKER IST GEGENSTANDSLOS.** `combat.ts`/`combatRunner.ts`/
    `combat.worker.ts`: null `Date.now`. Kampf unter gefaelschter Uhr laeuft normal (44 Runden).
    Die vom Plan verlangte Pruefung ist erledigt.
  - **AUFLAGE: die Uhr muss INNERHALB eines Schritts konstant sein.** `tick()` benutzt `Date.now`
    zugleich als Spieluhr und als **Stoppuhr** (`t0..t6`, `SLOW_TICK_*`), `heartbeat.ts` ebenso.
    Eine bei jedem Aufruf weiterzaehlende Faelschung erzeugt dort Stundenwerte.
  - **V2 IST GELOEST, ABER DAS BISHERIGE MUSTER WAR ES NICHT.** `db.js` liegt in der WURZEL des
    dist-Baums und bildet `__dirname/../data/game.db` - eine Kopie nach `/tmp/mb_kum` legt die
    Datenbank nach **`/tmp/data/game.db`**, geteilt von JEDEM Messbuild unter `/tmp` und von
    keinem `rmSync` erfasst. Fuer Stub-Skripte folgenlos, fuer 720 Schritte x 3 Profile nicht.
    **Reparatur ohne Eingriff in `db.ts`: Build in einen eigenen Unterordner des Laufordners.**
  - **Der Prozess endet nicht von selbst** (Worker-Pool + DB-Handle). Der erste Sondenlauf lief
    in ein Zeitlimit, obwohl alle Teile sauber durchgelaufen waren - ein abgebrochener Lauf sieht
    aus wie ein haengender.
  - **KORREKTUR, MESSREGEL 16: die Raid-Checkpoints liegen auf 0:00 BERLINER ORTSZEIT, nicht
    0:00 UTC** (gemessen 22:00Z im Sommer, 23:00Z im Winter). Fuer die Haeufigkeit folgenlos, fuer
    das Startdatum der Simulation nicht - die Umstellung faellt in jedes Fenster mit dem
    25.10.2026 darin.
  - **V3, NEU UND OFFEN: der kumulative Messbuild verdrahtet Block A Schritt 2 NICHT.**
    `game/loot.js` liegt im Build, `missions.js` und `groupOps.js` verweisen null Mal darauf und
    rufen weiterhin je dreimal `fleetSizeRewardMultiplier()`. Die bisherigen Skripte bauen die
    Missionsschleife selbst nach - **die Simulation darf das ausdruecklich nicht.** Dazu haengen
    K1 an Entscheidung 18, K4 an 13.1 (f), K5 an Entscheidung 3, Block A Schritt 2 und
    Entscheidung 12. **Der Umfang des Simulations-Messbuilds ist damit eine NUTZERENTSCHEIDUNG**,
    Vorschlag in Abschnitt 8 des Protokolls.
  - **EBENFALLS VOR DEM ERSTEN LAUF ZU ENTSCHEIDEN: Bots handeln je HEARTBEAT, nicht je Zeit.**
    `runGlobalHeartbeat()` (exportiert) ist der natuerliche Schritt-Treiber, aber `runBotTurn()`
    laeuft einmal je Heartbeat - im Echtbetrieb 30-60 Bau-Entscheidungsschritte je Stunde, bei
    Stundenschritten EINER. 13.3 hat diese Aufruf-Abhaengigkeit nur fuer die PIRATENBASEN
    beseitigt. Betrifft Kriterium 4 und die Gegenpruefung von f.
  - **Ist-Zustand aller neun Pakete gegen den Code geprueft: keines steht im Repo.** Nebenbei
    bestaetigt: Imperator `maxCount` ist **6**, nicht 2 - die alte README-Zahl ist auch hier falsch.

- **NEU 22.08.2026: ENTSCHEIDUNG 18 IST KALIBRIERT, NICHT GEBAUT.** Eskalierende Wellen
  **`ESC = 1 / 1,20 / 1,60`** mit **Bomberanteil 0,5** in der letzten Phase, **`RAID_WAVE_COUNT`
  bleibt 12**, `RAID_WAVE_ROLL` unangetastet. Protokoll `raid_hardness_18.txt` Abschnitt 8,
  Werkzeug `run_raid.mjs` unveraendert. **Damit ist die Sammelliste bei ACHT Paketen.**
  - **BEFUND G AUF DELEGATION ENTSCHIEDEN: NEIN** (umkehrbar, wie f = 12 bei 13.1). Der
    Kampf-Booster darf nicht ueber Sieg und Niederlage entscheiden.
    **Tragend ist NICHT die Preisrechnung** (36,7 DM/Tag gegen 2.020 DM/Tag - der Nutzer hat zu
    Recht darauf hingewiesen, dass DM-Ertraege und -Preise planmaessig veraenderlich sind, siehe
    Abschnitt 4 "Booster-Preise"), **sondern die Bemessungsgrundlage:** `combinedPower` sitzt auf
    der ROHMACHT, `combatFleetPowerBase()` ignoriert Booster. Der Boost gibt +35 %, ohne die Welle
    mitzuziehen - ein reiner Nettovorteil aus einer Konstruktionsluecke. **PRUEFPUNKT an die
    Booster-Preis-Entscheidung:** ueber rund 20-25 % des DM-Einkommens (Faktor 10-13, Entscheidung
    3 allein leistet das nicht) wird der Boost zur echten Wahl, dann ist G neu zu stellen.
  - **Die Zelle "voll ohne Kampf-Boost" misst ABWESENHEIT, nicht Kaufverhalten** - Raid Mi/So
    0:00 UTC gegen 24h-Booster-Timer. Sie ist damit dieselbe Frage wie Befund H an einem anderen
    Ausbaustand.
  - **METHODISCHER BEFUND, gilt ueber diesen Punkt hinaus: ein Kriterium an der 100-%-Kante hat
    bei 40 Serien eine Aufloesung von 1/40 - und genau das ist die Streuung.** Zwei unabhaengige
    40er-Laeufe derselben Zelle: 100 % und 98 %. Bei 1,70 meldeten zwei 40er-Laeufe je 98 %, ein
    80er-Lauf dagegen 94 % - **mit 40 Serien haette 1,70 das Kriterium scheinbar gehalten.** Die
    bindende Zelle wird deshalb mit 80 Serien gemessen.
  - **KANDIDAT A IST UNTER G = NEIN PRAKTISCH DIE OBERGRENZE**, nicht nur die Empfehlung. 1,60
    haelt das Kriterium, 1,70 reisst es; C (2,20) und B (2,50) sind unerreichbar, und zwar nicht
    knapp. Der Gewinn 1,50 -> 1,60 ist klein, bei gleichem N aber real (+3,2 Punkte).
  - **Ergebnis:** voll 20,0 -> **34,7 %** Flottenverlust, mittel 28,7 -> **46,3 %**,
    Verteidigungsverlust 0,0 -> rund 34 % (Befund F bestaetigt). Alle drei entwickelten Staende
    bleiben bei 100 % perfekter Abwehr.
  - **FRAGE 4 BEANTWORTET: `RAID_WAVE_COUNT` bleibt 12.** Mit 18 Wellen steigt der Flottenverlust
    der Booster-losen Zelle auf **71,5 % im Mittel** und reisst damit Abnahmekriterium 1 der
    30-Tage-Simulation (70 % je Ereignis); ausserdem heben 18 Wellen den flachen Container-Topf um
    50 % (22,07 -> rund 33 Mrd je Raid) und verschlechtern Abnahmekriterium 5.
  - **EINZIGE VERBLIEBENE NUTZERENTSCHEIDUNG ZU 18: BEFUND H.** "schwach" 0 % perfekt bei 98,6 %
    Flottenverlust, "voll / kleine Flotte" von 57 auf 15 % perfekt. **FORM gehoert zu 18, WERT
    nach Schritt 13** - die Simulation liefert die Entwicklungskurve, gegen die kalibriert wird.
  - **Fuer den Einbau:** ein VIERTES Wellenprofil `bunkerbrecher` ist noetig, die drei vorhandenen
    gewichten den Schiffspool nur nach POSITION im `SHIPS`-Array und kennen keine Rolle. Der
    Bomberanteil 0,5 ist uebernommen, nicht kalibriert.
  - **Messregel 8 angewandt: KEIN Client-Spiegel noetig.** `RAID_WAVE_COUNT`, `RAID_WAVE_ROLL`,
    `pickWaveProfile`, `waveProfile`, die drei Profilnamen und `DEFENSE_REPAIR_PERCENT` haben null
    Treffer in `client/src`; `pages/Galaxie.tsx` liest die Wellenzahl dynamisch aus
    `state.raid.waveTimes.length`. Nach Entscheidung 7 der zweite Punkt ohne Spiegel - "kein
    Spiegel" ist ein Messergebnis und keine ausgelassene Pruefung.
  - **DARAUS EIN NEUER OFFENER PUNKT: DIE ESKALATION IST FUER DEN SPIELER UNSICHTBAR.** Weder
    Phase noch Wellenprofil noch Bomberanteil erscheinen irgendwo im Client - er sieht "Welle
    9/12" und dass die spaeten Wellen ploetzlich wehtun. Wer seine Flotte bisher gefahrlos daheim
    liess, verliert nach dem Einbau rund ein Drittel davon ohne Vorwarnung. **Vorschlag, nicht
    entschieden:** Phase im Raid-Zaehler anzeigen, Bunkerbrecher im Kampfbericht kenntlich machen.
    UI-Aenderung, keine Balance-Zahl - faellt nicht unter die Sammel-Regel, darf aber NICHT vor der
    Eskalation live gehen, sonst kuendigt die Anzeige etwas an, das es noch nicht gibt.

- **NEU 22.08.2026: REIHENFOLGE FUER 13/18/19 ENTSCHIEDEN - 18 ZUERST, DANN 19, DANN 13.**
  Nutzerentscheidung, mit einer vorgeschalteten Messung begruendet statt mit einer Vermutung.
  Protokoll `volley_scale_19.txt`, Werkzeug `probe_volley_scale_19.mjs` (neu). **Nichts gebaut.**
  - **Warum 18 zuerst:** die 30-Tage-Simulation (Schritt 13) startet in allen drei Profilen bei
    `defaultPlayerState()`, liegt also im Bereich "schwach" - und dort geht JEDER Eskalationskandidat
    auf 99,6-100 % Flottenverlust (Befund H). **Abnahmekriterium 1 der Simulation ("kein Ereignis
    ueber 70 % Flottenverlust") ist ausdruecklich auf den Raid gemuenzt.** Wer 13 vor 18 baut, misst
    es gegen eine Raid-Fassung, die danach ersetzt wird. Kriterium 5 haengt zusaetzlich an
    Entscheidung 3, die 18 ueber die Wellenzahl beruehrt.
  - **Warum 13 zuletzt:** groesster Bau (V1 gefaelschte Uhr, V2 Wegwerf-Datenbank, 720 Schritte x
    3 Profile) - und das einzige Werkzeug, mit dem sich die ausbaustandsabhaengige Untergrenze aus
    Befund H gegen eine echte Entwicklungskurve kalibrieren laesst. **Die FORM der Untergrenze
    gehoert zu 18, ihr WERT nach 13.**
  - **NEUER CODE-BEFUND, der die Reihenfolge tragen musste: `MULTI_TARGET_VOLLEY_SHIPS` hat FUENF
    Eintraege, nicht drei.** `sentinelkanone` und `ultimatekanone` sind VERTEIDIGUNGSANLAGEN, haben
    einen `ZIELERFASSUNG_BASE`-Eintrag (0,35, die Salve ist also kein toter Code) und werden vom
    Weg-2-Patch mitgetroffen. Die Aussage in `salven_19.txt` ("Verteidigungsanlagen bleiben
    unberuehrt") gilt nur fuer die ZIEL-Seite.
  - **Gemessen: die Kalibrierzellen von 18 sehen davon nichts** - kein Gegnertyp einer Welle
    erreicht die Schwelle JE = 20.000 (groesster Typ: 9.861 bis 17.960 je nach Kandidat), auch nicht
    in der letzten Phase des staerksten Kandidaten. **18 vor 19 ist damit sauber.**
  - **ABER: unter Kandidat B liegt die Reserve nur noch bei 10 %** (17.960 von 20.000), unter A bei
    Faktor 1,9. Wird B gewaehlt UND spaeter JE gesenkt, kehrt die Kopplung zurueck.
  - **Am Endgame-Konto ist die Wirkung gross und liegt auf der VERTEIDIGUNGSSEITE:** Salven-Treffer
    je Schuss Sentinel 2,0 -> 16,0 und Ultimate 6,0 -> bis 37,2, also Faktor 5-8. Das ist dieselbe
    Groesse, um die Befund A und Befund F in Entscheidung 18 streiten - **Weg 2 wirkt dort gegen die
    Bunkerbrecher-Welle.** Kampfausgang NICHT gemessen, nur die Trefferzahl.
  - **Das Messgitter von 18 hat keine Endgame-Zelle** (groesste Zelle `FLEET_LARGE` = 6.332 Schiffe
    gegen 993.604 im Anlassfall). Nachziehen erst nach der Kandidatenwahl.
  - **Der kumulative Messbuild wurde vor Gebrauch geprueft** und reproduziert die Anker aus
    `loot_curve.txt` auf -2,8 % bzw. -0,9 % (normiert auf die vernichtete Feindmacht; roh sahen
    dieselben Zellen um +8,6 % bzw. -5,9 % daneben aus - die Falle vom 19.08.2026 reproduziert sich).

- **NEU 21.08.2026: ENTSCHEIDUNG 19 - SALVENSCHIFFE IM ENDGAME. Gemessen, NICHT GEBAUT.**
  Protokoll `salven_19.txt`, Werkzeuge `run_salven_19.mjs` und `make_messbuild_salve.mjs` (neu).
  Anlass war ein echter Kampfbericht des Nutzers mit 993.604 Schiffen.
  - **Die Beobachtung stimmt, die Ursache ist eine andere: die Salvenschiffe sind nicht schwach,
    es sind zu wenige.** 270 von 993.604 Schiffen (0,027 %) liefern 1,11 % des Schadens bei 0,06 %
    Machtanteil - das 18-fache ihres Anteils. Pro Stueck ist ein Salvenkreuzer 86-mal so stark wie
    ein normaler Kreuzer.
  - **KERNBEFUND: die Mehrfachziel-Salve ist mechanisch schwaecher als RapidFire.** Der Imperator
    macht **313 Mio Schaden je Stueck, der Salvendreadnought nur 195 Mio** - bei fast gleichen
    Waffenwerten. Die Salve gibt EINEN Treffer je praesentem Typ (hoechstens drei, unabhaengig von
    der Feindmenge), RapidFire gibt wiederholte verkettete Schuesse.
  - **`MULTI_TARGET_POWER_CORRECTION = 8` wirkt falsch herum:** er treibt ueber die Flottenmacht
    die Gegnerstaerke und bremst die Schiffe im Frueh-/Mittelstand, wo sie stark sind, waehrend er
    im Endgame folgenlos ist.
  - **Nutzerentscheidung: Weg 2 (Salve an die Stapelgroesse koppeln) kombiniert mit Weg 1
    (maxCount).** Gemessen und empfohlen: **JE = 20.000, DECKEL = 8** - hebt das Endgame von
    2,80 auf 9,22 % und laesst alles darunter unveraendert. Mit `maxCount` x2 (300/180/60)
    zusaetzlich rund 15 %.
  - **WICHTIGE EINSCHRAENKUNG: Weg 1 wirkt UEBERALL, Weg 2 nur spaet.** Eine flache Verdopplung von
    `maxCount` verdoppelt auch den Frueh-/Mittelstand-Anteil, und dort liegen die Schiffe bereits
    bei 43-73 %. **Weg 1 nur mit Kopplung an den Ausbaustand** (Forschung, Gebaeudestufe oder
    Teile-Aufwand wie beim Imperator).
  - **Offen:** die Wechselwirkung mit Entscheidung 6 (Wert je Machtpunkt) und ob
    `MULTI_TARGET_POWER_CORRECTION` unter Weg 2 ueberhaupt noch stimmen kann - der Wert der
    Schiffe ist dann groessenabhaengig, ein fester Faktor kann an beiden Enden nicht passen.

- **NEU 21.08.2026, NUTZERENTSCHEIDUNG: ENTSCHEIDUNG 17 IST VERWORFEN. Die Offensive der
  Piratenbasen wird ABGESCHALTET, Basen und KI-Mitspieler BLEIBEN, die Bedrohung wandert
  vollstaendig auf den RAID (neue Entscheidung 18).** Nichts davon ist gebaut.
  - **Warum:** Variante A (Basis greift mit echtem Bestand an) braeuchte rund das Zehn- bis
    Fuenfzehnfache der Spielerflotte - permanent uneinholbar statt "manchmal eine Bedrohung".
    Variante B liefert keinen echten Gegner, sondern eine gestellte Begegnung - **und damit exakt
    das, was der Raid ohnehin tut**: `processRaidWave()` erzeugt die Angreifer ueber
    `generateFallbackFleet()` aus dem Nichts, skaliert auf die kombinierte Macht des Spielers,
    zwoelfmal. Zwei Systeme fuer dieselbe Abstraktion, wovon nur eines schon richtig funktioniert.
  - **Ebenfalls erwogen und verworfen:** Basen und Bots ganz entfernen. Die Basen sind gemessen
    8-10 % der Tageseinnahmen und ueber Entscheidung 5 kalibriert und gebaut; "nutzlos" trifft nur
    auf die Bots zu.
  - **Abzuschalten ist `runPirateBaseOffensiveTurn()` samt der 1,15-Marge.** Der Zweig loest
    faktisch nie aus, kostet also nichts. Beim Abschalten den Ruecklauf noch fliegender
    `PirateBaseOffensiveDeployment`-Eintraege bedenken (nach dem Reset gibt es keine).
  - **NEUE FOLGE FUER DIE NOCH OFFENE ZAHL f AUS 13.1:** mit abgeschalteter Offensive hat der
    Flottenbestand einer Basis nur noch EINE Wirkung, weil `garrisonReadiness()` bei 1,0 gedeckelt
    ist - Wachstum zaehlt allein fuer die ERHOLUNG nach dem Leerfarmen, alles darueber ist totes
    Gewicht. **Mehr NPC-Einkommen beschleunigt bei den Basen nur die Farm-Erholung.** f entscheidet
    damit im Wesentlichen ueber die KI-MITSPIELER, deren Flotten im Elite-Bollwerk und in der
    Raid-Verstaerkung tatsaechlich auftauchen. Bei der Kalibrierung am Vormittag war das noch nicht
    so - **wer f setzt, liest das hier zuerst.**
- **NEU 21.08.2026: ENTSCHEIDUNG 18 - DER RAID WIRD DER TRAEGER DER HERAUSFORDERUNG.
  MESSSCHRITT 1 ERLEDIGT, nichts gebaut.** Protokoll `raid_hardness_18.txt`.
  - **`raid.txt` IST FUER DIE KALIBRIERUNG NICHT MEHR GUELTIG** - es stammt aus der Zeit vor
    Entscheidung 16. Neue Baseline mit 40 Raids je Fall steht im Messkasten bei Entscheidung 18.
  - **DER WICHTIGSTE BEFUND GEHOERT NICHT ZU 18, SONDERN ZU ENTSCHEIDUNG 16: Klassen-RapidFire
    macht Verteidigungsanlagen im Raid praktisch unzerstoerbar.** Gegenprobe Repo-Stand gegen
    Messbuild: Stand mittel **21,6 % -> 0,0 %** Verteidigungsverlust, Stand "voll / kleine Flotte"
    **92,0 % -> 35,4 %**, waehrend dort der Flottenverlust von 14,5 auf 39,0 % steigt.
    **Verteidigung wird dadurch im Raid faktisch kostenlos.** Entscheidung 16 ist kalibriert und
    UNGEBAUT - das gehoert vor dem Einbau entschieden.
  - **DIE VERLIERBARKEIT IST MIT DEN OFFENEN REGLERN STRUKTURELL NICHT ERREICHBAR.** In JEDER
    Zelle gewinnen die entwickelten Staende 100 % der Raids perfekt - bei 12, 18, 24 und 36
    Wellen, bei Reparatur 0,00 und bei Verteidigungs-Gewicht 4,0. Ursache: `processRaidWave()`
    bemisst jede Welle an der AKTUELLEN, bereits dezimierten Flotte - schrumpft die Flotte,
    schrumpft der Gegner mit. Auch das Einfrieren der Bemessungsgrundlage reicht nicht, es trifft
    nur die Schwachen. **"Raid haerter" ist erreichbar, "Raid verlierbar" nicht.**
  - **Die Reparaturquote ist als Regler tot** (Folge des Befunds oben) - der vor der Messung
    vorgeschlagene erste Kandidat ist widerlegt.
  - **Empfehlung, nicht gebaut: `RAID_WAVE_COUNT` von 12 auf 18** (voll 20,0 -> 26,3 %,
    mittel 28,7 -> 37,7 %, schwach praktisch unveraendert). Beruehrt Entscheidung 3.
  - **NACHTRAG, NUTZERVORSCHLAG: ESKALIERENDE WELLEN LOESEN DIE WAND AUF - OHNE `RAID_WAVE_ROLL`.**
    Wellen phasenweise staffeln (erste vier mittel, naechste vier schwer, letzte vier extrem) plus
    viele Bomber in den spaeten Wellen. Das ist eine NEUE Groesse, der Wuerfel bleibt unangetastet.
    **Inhaltlich tut die Eskalation aber dasselbe** - deshalb als Nutzerentscheidung gefuehrt, nicht
    als Ausweg um die Sperre herum.
    - **Die Eskalation ist der einzige Regler, der den AUSGANG bewegt statt nur die Kosten.** Und
      weil die negative Rueckkopplung als Daempfer bestehen bleibt, entsteht **kein Kliff**.
    - **Die Bunkerbrecher-Welle ist die direkte Gegenmassnahme zum Verteidigungs-Befund oben:**
      Verteidigungsverlust 0,2 % -> 41,2 % (voll) bei fast gleichem Flottenverlust. Die Bomber
      VERLAGERN den Schaden. Fuer den Einbau waere ein viertes Wellenprofil `bunkerbrecher` noetig -
      die drei vorhandenen gewichten den Schiffspool nur nach POSITION im `SHIPS`-Array.
    - **Drei Kandidaten, 40 Raids je Fall** (perfekte Abwehr / Flottenverlust): Ist voll 100 %/20,0,
      mittel 100 %/28,7. **A (1/1,20/1,50)** voll 100 %/34,3, mittel 100 %/43,4.
      **C (1/1,35/2,20)** voll 100 %/56,1, mittel 80 %/69,2. **B (1/1,50/2,50)** voll 93 %/65,2,
      mittel 65 %/74,1.
    - **BEFUND G: der Kampf-Booster wird zum ausschlaggebenden Faktor.** "voll ohne Kampf-Boost"
      kippt in allen drei Kandidaten zuerst (100/48/38 % perfekt gegen 100/100/93 % mit Booster).
      **Der Raid wuerde zum staerksten Kaufargument fuer den Kampf-Booster im Spiel.**
    - **BEFUND H: die Eskalation trifft die Schwachen am haertesten, also in die falsche Richtung.**
      "schwach" geht bei JEDER Eskalation auf 100 % Totalverlust; Entscheidung 10 hilft nicht, weil
      ihr Schutz ZEITBASIERT ist. **Es braucht eine ausbaustandsabhaengige Untergrenze.**
    - **Empfehlung: Kandidat A als erster Schritt.** Verlierbar wird der Raid damit bewusst noch
      nicht - G und H sind vorher zu klaeren.
  - **`RAID_WAVE_ROLL` wurde NICHT angefasst und wird durch die Eskalation auch nicht mehr
    gebraucht.** Die alte Gate-Frage ist damit gegenstandslos.
- **NEU 21.08.2026: f = 12 EINGETRAGEN** (Entscheidung 13.1, `BOT_VIRTUAL_ACTIVITY`), auf
  Delegation des Nutzers, **als Empfehlung und jederzeit umkehrbar - nicht gebaut.** Begruendung:
  13.1-A kippt bei f = 13,5, f = 12 nutzt die Decke mit 8 % Abstand aus; und seit dem Ausgang von
  Entscheidung 17 entscheidet f im Wesentlichen ueber die KI-MITSPIELER, deren Flotten anders als
  der Bestand der Piratenbasen tatsaechlich sichtbar werden.
- **ALTER EINTRAG (ueberholt durch den obigen): Entscheidung 18 war offen mit Messplan.** Loest Abschnitt 8 Punkt 7 ("Raid verlierbar machen", bisher nur
  auf Design-Grundlage entschieden) mit Zahlen ein.
  - **Ist-Zustand aus `raid.txt`, 40 Raids je Fall: an JEDEM entwickelten Stand 12/12 Wellen und
    100 % perfekte Abwehr.** Nur "schwach" verliert - und dann gleich mit 94,4 % Flottenverlust.
    Zwischen 23,8 % und 94,4 % liegt nichts. **Dasselbe Kliff wie bei Entscheidung 17.**
  - **Die Frage lautet deshalb nicht "wie viel haerter", sondern an welchem Regler die Haerte
    GRADUELL reagiert statt zu kippen.**
  - **`RAID_WAVE_ROLL` bleibt gesperrt**, solange der Nutzer nichts anderes sagt - es ist der
    direkteste Regler und steht auf der Nicht-anfassen-Liste. **Das ist die offene Gate-Frage.**
  - Erster Kandidat ist `DEFENSE_REPAIR_PERCENT` (0,70), weil die Abnutzung ueber zwoelf Wellen
    kumuliert; `CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT` (0,9) bekaeme dadurch endlich Gewicht.
- **NEU 21.08.2026: ENTSCHEIDUNG 17 - PIRATENBASEN ALS BEDROHUNG. Schritt 0 und 1 gemessen,
  NICHTS GEBAUT.** Messkasten im Plan direkt vor Abschnitt 2a, Protokoll `pirate_threat_17.txt`,
  Werkzeug `run_pirate_threat_17.mjs` (neu). **Die Messung bleibt gueltig und traegt Entscheidung
  18 mit, auch wenn 17 selbst verworfen ist:**
  - **Die Engine ist NICHT seitensymmetrisch, und der Spieler steht beim Basis-Angriff auf der
    falschen Seite.** `sharedShieldPoolA`, `retreatMode` und `homeDefense` wirken nur auf Seite A,
    und `applyPlayerResearch` ist fuer A true, fuer B false - **der Verteidiger verliert dadurch
    Praezision, Zielerfassung, Durchschlag, Kritische Treffer und Ausweichen.** Das ist der
    groesste Einzelposten: der reine Seitentausch ist -27,6 Punkte Wertverlust wert.
  - **DIE HEUTIGE FASSUNG IST EIN KLIFF.** Stand mittel: Multiplikator 6 -> 60,4 % Verlust,
    Multiplikator 8 -> 100 % in 40 von 40 Laeufen. Faktor 1,33 dazwischen. Unbrauchbar als
    einstellbare Groesse.
  - **DIE RAID-FASSUNG HAT EIN PLATEAU STATT EINES KLIFFS** (mittel rund 62 %, spaet 56-60 %,
    frueh 90 %) und **0 Totalverluste in JEDER Zelle bis Multiplikator 32.** Damit ist die
    Design-Frage beantwortet: **"halbe Flotte" ist erreichbar, "ganze Flotte" strukturell nicht -
    beides zusammen ist nicht zu haben.**
  - **Ein fester Multiplikator kann nicht funktionieren:** bei Mult 6 frueh 89,8 / mittel 39,0 /
    spaet 34,1 %. Ursache: die Welle skaliert auf die ROHMACHT, `combatFleetPowerBase()` ignoriert
    Forschung, Module, Klasse und Booster. Vor Schritt 2 zu klaeren, sonst ist die Kalibrierung
    dreimal zu machen.
  - **Die Forschung der Basis ist rund Faktor 2 auf der Multiplikator-Achse wert** und war nie
    betrachtet. Der gewuenschte Staerkefaktor existiert damit bereits in natuerlicher Form.
  - **Alle Teilpunkte 17.1 bis 17.5 sind mit dem Ausgang hinfaellig.** Was ueberlebt, steht in
    Entscheidung 18. Der Befund, dass `isNewcomerProtected()` AUSSERHALB von `raids.ts` nirgends
    greift, bleibt als Falle vermerkt - im Raid selbst ist der Schutz vorhanden.
- **NEU 21.08.2026: BLOCK C IST VOLLSTAENDIG. Schritt 12 (Entscheidung 13.1 + 13.2) ist erledigt -
  13.1 KALIBRIERT bis auf EINE Nutzerzahl, 13.2 ENTSCHIEDEN OHNE MESSUNG, beides NICHT GEBAUT.**
  Messkasten am Kopf von Entscheidung 13, Protokoll `bot_yield_131.txt`, Werkzeug
  `run_bot_yield_131.mjs` (neu). Naechster Schritt ist 13, die 30-Tage-Fortschrittssimulation.
  - **Weg (b) steht, und beide Koeffizienten sind GEMESSEN statt gesetzt:**
    `Feindmacht/Tag = 4,0 * combatFleetPowerBase(Bot-Flotte) * f`, darauf die Kurve aus
    Entscheidung 2 (Anker und Exponent unveraendert) als Ertrag und `0,036 * Feindmacht * 0,7`
    als Verlust. **k = 4,0** ist ueber zwei Groessenordnungen Flottenmacht nahezu konstant
    (3,204 / 4,275 / 3,996), **0,036** stimmt zwischen mittel und spaet auf 5 % ueberein.
    Ertrag und Verlust haengen damit an derselben Groesse - genau die Forderung aus 13.1.
  - **OFFEN und ausdruecklich eine Nutzerentscheidung: der Wert von f** (`BOT_VIRTUAL_ACTIVITY`).
    **f = 12** ergibt 0,92 / 0,27 / 0,34 gegen den Spieler, **f = 8** ergibt 0,67 / 0,19 / 0,26.
    Alles andere an 13.1 ist entschieden.
  - **Der Bezugswert ist KEINE Spalte, sondern die eigene Flottenmacht.** Ein Bot hat keinen
    Ausbaustand im Sinne der Tabelle. Dass die Spaltenwahl sonst entschieden haette, ist
    gemessen: heutiger Bot 18 / 6 / 11 % des Spielers, "Faktor fuer 100 %" 33,1 / 96,9 / 55,1.
    Die alten "15 %" und "39" liegen dazwischen - eine unbenannte Spaltenwahl gegen die
    aufgegebene 21,69-Baseline.
  - **Das Messkriterium "Zielkorridor 60-100 %" ist gemessen NICHT erreichbar** und durch das
    Kriterienpaar 13.1-A (Decke unter 1,0) / 13.1-B (nicht unter heute) ersetzt. Grund liegt
    nicht beim Bot: die Bezugskurve ist nicht monoton (Spieler-Ertrag je Punkt eigener
    Flottenmacht 3,5 / 7,2 / 3,3), und eine einzelne Konstante kann das nicht treffen.
  - **13.3 musste NICHT vorgezogen werden - es ist gebaut**, allerdings nur fuer die
    Piratenbasen. Die KI-Mitspieler haben kein Raster (30-60 Zuege je Stunde je nach externem
    Taktgeber). Statt einer Vorziehung eine **Bau-Vorgabe: der virtuelle Ertrag wird
    ZEITBASIERT ueber `deltaSec` verbucht, nicht je Bot-Zug** - sonst kehrt die
    Aufruf-Abhaengigkeit auf dem Einkommen zurueck.
  - **Die Sammelliste fuer den Einbau umfasst damit SIEBEN Pakete** (Block A Schritt 2, Block B,
    Entscheidung 3, 16, 12, 7.2/7.3 und jetzt 13.1/13.2), dazu R16.
- **NEU 21.08.2026, ZWEI PRAEMISSEN VON 13.1 SIND GEGEN DEN CODE WIDERLEGT.** "Bots haben
  ausschliesslich Minen-Einkommen" stimmt nicht: `maybeAttackPirateBase()` liefert Beute ueber
  `pirateBaseLoot()` und damit bereits ueber `LOOT_CURVE_ANCHOR_*`, und Bots bekommen im
  Elite-Bollwerk `winResources` voll gutgeschrieben. **Richtig ist der engere Satz: Bots haben
  keinen Zugang zum CONTAINER-Wert** - `openContainer()` ist nur ueber `routes.ts` erreichbar, ein
  Bot stellt nie einen Request. **Ein Bot gewinnt einen Raid ueber 12 Wellen (22,07 Mrd
  Containerwert) und bekommt dafuer exakt null.** Folge: der virtuelle Ertrag tritt NEBEN die
  Piratenbasis-Beute und den Elite-Anteil, er ersetzt sie nicht - wer gegen "Bot hat nur Minen"
  kalibriert, zaehlt beide doppelt.
- **NEU 21.08.2026, NEUER BEFUND FUER 13.4/BLOCK D: Roboterfabrik und Nanitenfabrik sind fuer den
  Bot ein ARMUTS-FALLBACK.** `maybeBuildBuilding()` erreicht sie erst, wenn ALLE DREI
  Minenausbauten fehlschlagen - was nur aus Geldmangel geschieht. Ein reicher Bot baut die beiden
  bauzeitverkuerzenden Fabriken deshalb NIE, belegt den einen Gebaeude-Slot zu 44 % mit
  Solarkraftwerken und bleibt bei Minenstufe 13 stehen (gemessen: Robo 0 / Nanite 0 beim
  27-fachen Zusatzertrag gegen Robo 5 / Nanite 14 beim 9-fachen). **Je reicher der Bot, desto
  langsamer baut er aus.** Dieselbe Fehlerform wie bei `ATTACK_POWER_SAFETY_MARGIN`: eine
  Bedingung hoert auf zu wirken, ohne dass etwas bricht. **Nicht behoben, nicht vorgeschlagen** -
  gehoert zu 13.4 und ist dort mit `MAX_BUILD_SLOTS = 1` aus Entscheidung 9.2 zusammen zu
  betrachten, weil die Verschaerfung dieselbe Richtung hat.
- **NEU 21.08.2026: `BASE_INCOME` in `run_income_baseline_v2.mjs` ist eine Setzung, die der Code
  nicht hergibt** (55 / 300 / 554 Mio/Tag gegen gerechnete 29,6 / 343,2 / 2262,1 Mio - in der
  Setzung fehlen Mining-Forschung, Abbau-Booster und Prospektor). **Die Baseline 0,98 / 19,57 /
  61,11 bleibt gueltig:** die Minen sind an allen drei Staenden ein kleiner Posten, das NETTO
  bewegt sich nur um -2,6 % / +0,2 % / +2,8 %. Kein Anlass zur Neuerhebung, wohl aber einer, den
  Wert beim naechsten Anfassen des Skripts aus dem Code zu ziehen.
- **NEU 21.08.2026, NUTZERBEOBACHTUNG AUS DEM ECHTBETRIEB: die CPU-Frage beim Schiffslimit ist
  beantwortet.** Bei rund 1 Mio. Schiffen samt gleichzeitiger Koop-Expedition ins Elite-Bollwerk
  langweilen sich beide CPUs (eine Worker, eine Hauptthread). Die 26-ms-Messung ist damit nicht
  mehr nur simuliert. **`MAX_PLAYER_SHIPS = 1.000.000` bleibt trotzdem stehen** - der verbliebene
  Grund ist nicht Performance, sondern dass das Limit bis zum Einbau von Entscheidung 2 als
  Ersatz-Bremsklotz gegen Weglauf-Wachstum wirkt. Reihenfolge fuer das spaetere Entfernen
  (ausdruecklich NICHT beim Reset selbst) und der ungemessene Restpunkt - ob Entscheidung 2 allein
  ein konvergierendes Wachstum erzeugt, sie hebt naemlich auch das Niveau - stehen als Messpunkt
  in Abschnitt 7 des Plans. `POOL_SIZE` steht weiter auf 1; Hinweise fuer eine Erhoehung ebenda.
- **NEU 20.08.2026: BLOCK C, SCHRITT 9 IST ERLEDIGT - Entscheidung 7.2 und 7.3 sind KALIBRIERT,
  NICHT GEBAUT.** 7.2 = Variante A (`baseCost` der Stations-Minen x3,92 / x1,02 / x0,57,
  `costGrowth` unveraendert, **nur `stationBuildings.ts`**), 7.3 = Foerdereffizienz-Module x16,5
  (`MODULE_COST_MULTIPLIER` 500 -> 8.270, **nur `moduleKind: 'output'`**) plus
  `requiredBuildingLevel` 20 -> 10. Bauanleitung im Messkasten bei Entscheidung 7, Protokoll
  `station_v2.txt`, Werkzeug `run_station_v2.mjs` (neu).
  - **`STATION_MINING_COMPENSATION` bleibt 3.** Der offene Kalibrierpunkt aus Abschnitt 2a ist
    damit geschlossen. Korridor gemessen 2,00-3,53; der Wert ist hergeleitet (Mining-Forschung
    2,0 x Mining-Boost 1,5) und nicht aus dem Korridor gegriffen.
  - **7.4 ist HERAUSGELOEST** und steht jetzt in Block D, Schritt 14 (bei Entscheidung 9.1 + R1).
    Der Anwendungsbereich von 9.1 nennt sie namentlich, und 7.4 ist derselbe multiplikative
    Stapel, den 9.1b auf additiv umstellt. **Der Weg ueber zwei einklammernde Szenarien - wie bei
    Entscheidung 12 - traegt hier NICHT:** der Bauzeit-Faktor geht in keine der beiden
    Zielgroessen von 7.2/7.3 ein, die Unabhaengigkeit ist strukturell und keine Messung.
  - **Der Heimatbasis-Teil von 7.2 ist gestrichen** - siehe eigener Punkt unten, das ist der
    wichtigste Befund dieser Session.
  - **Ergebnis in Zahlen:** Vollausbau 558,20 Mrd, Ertrag 7,90 Mrd/Tag, Amortisation 70,6 Tage
    (Band 60-120), Anteil pro Kopf 16,9 % gegen die mittel-Spalte (Grenze 20 %). Variante A
    bewegt keine dieser vier Zahlen - sie stellt nur die Relation zwischen den drei Minen her.
- **NEU 20.08.2026, WICHTIGSTER BEFUND: 7.2 haette an der Heimatbasis ein funktionierendes
  Gleichgewicht zerstoert.** Der zugrunde liegende Session-1-Befund 2 ("Metallmine ausbauen und
  tauschen" ist um Faktor 2,8 bzw. 5,0 effizienter) vergleicht die drei Minen auf **derselben
  Stufe** (25 bzw. 30). Die Heimatbasis erzwingt gleiche Stufen aber nirgends:
  `HOME_TIER_UNLOCK_LEVELS` steht auf **36/32/30**, ist also bereits gestaffelt - und an diesen
  Stufen liegen die Grenzkosten je Mehrertrag bei **710 / 848 / 771 Tagen**, einer Spannweite von
  19 % statt eines Faktors 5. Mit `TRADE_FEE = 0,2` gewinnt der direkte Ausbau dort schon heute
  (0,87 gegen 1,00). Die Kostenangleichung haette ihn auf 0,13 ueberdreht und die Metallmine
  Stufe 45 von 1.137 auf 4.460 Mrd gehoben - also genau die Gebaeude-Leiter zerstoert, die
  Entscheidung 9 Punkt (4) als zweite Ressourcen-Senke braucht. **`data/buildings.ts` wird nicht
  angefasst.** Preis: die Station-V1-Werte sind danach nicht mehr identisch mit den
  Heimatbasis-Pendants, was bisher bewusste Design-Entscheidung war.
- **NEU 20.08.2026: die Modul-Zahlen der Station im Plantext waren ueberholt.** Die genannten
  17,9 Tage Amortisation sind gegen den Ertrag VOR 7.1 und Kompensation gerechnet
  (1,88 Mrd/Tag). Real: **4,3 Tage** gegen 70,6 fuer die Gebaeude. Dieselbe Fehlerform wie bei
  Entscheidung 12 (x24,5 statt x36,72) - **jede Zahl aus der Zeit vor dem 10.08.2026, die an
  einem Stations- oder Mining-Ertrag haengt, ist zu misstrauen.**
- **NEU 20.08.2026, NUTZERFUND - R16: eine Flotte laesst sich in beliebig viele GLEICHZEITIGE
  Gruppen-Operationen aufteilen.** Nutzermeldung: "Elite Bollwerk kann man unendlich mal starten
  gleichzeitig." Im Code bestaetigt: `createGroupOperation()` prueft nur Sektor, Schiffstypen und
  Bestand, `respondToGroupOperation()` erlaubt beliebig viele gleichzeitig angenommene
  Einladungen. Die Sperre, die es bei Solo-Missionen seit dem 29.07.2026 gibt ("immer nur eine
  Piraten-Sektor-Stufe gleichzeitig", `missions.ts` Zeile 97), wurde bei den Gruppen-Operationen
  nie nachgezogen. **Das ist ein Defekt, keine Balance-Frage** - Reparatur R16 in Abschnitt 3,
  Befundkasten unter der Tabelle.
  - **Warum es teuer ist:** die Belohnung je gewonnenem Check ist flach und PRO TEILNEHMER -
    930 Mio Wert `winResources` plus 1.097 Mio Wert garantierte Container, dazu `lootBase` mal
    2^Siegserie. Ueber 6 Checks rund **17 Mrd Wert je Expedition und Teilnehmer, voellig
    unabhaengig von der eingesetzten Flotte**, waehrend die Gegnerstaerke proportional
    mitskaliert. Aufteilen multipliziert die Einnahme mit der Zahl der Operationen; der
    `npcFloor` von 3 Mio Macht setzt nur eine Untergrenze von rund 3,4 Mio Flottenwert je
    Teilflotte.
  - **Nutzerentscheidungen:** (1) Reparatur ist **eine aktive Operation je Spieler**, geprueft an
    beiden Eintrittspunkten, keine neue Balance-Zahl. (2) **Der Solo-Start bleibt erlaubt** -
    beide Multiplayer-Sektoren sollen allein beflogen werden koennen, das wird NICHT
    mitrepariert. (3) **Einbau erst zum Server-Neustart**, nicht vorher; bis dahin darf der alte
    Stand ausgespielt werden.
  - **Was im Plan schon stand:** Entscheidung 4.8 (Cooldown) betrifft nur P10 und nur das
    *wiederholte* Starten hintereinander. Der gleichzeitige Fall stand nirgends.
- **NEU 20.08.2026 (Nutzerentscheidung): ABNAHMEKRITERIUM 5 IST UMGESTELLT.** Die Schwelle von
  50 % bleibt woertlich stehen, geaendert hat sich nur, WORAUF sie zeigt: von Entscheidung 12
  auf **Entscheidung 3 (Raid-Ertrag) und die Solo-Einnahme der Startphase**. Grund ist die
  Messung: der Raid stellt 58 % der Woche-1-Einnahmen (26,5 von 46,0 Mrd), die Asteroiden 39 %,
  Solo 3 %. **Jede Kuerzung des Frischling-Bonus HEBT den Raid-Anteil** (auf 78 % bei
  abgeschaltetem Bonus) - das Kriterium haette in der alten Fassung einen moeglichst GROSSEN
  Bonus verlangt. Rechnet man den Raid heraus, liegen die Asteroiden bei 93 % und selbst ohne
  jeden Bonus noch bei 81 %; Ursache ist nicht die Hoehe des Minings, sondern dass daneben
  nichts steht. **Bewusst NICHT gemacht:** das Kriterium in zwei Schwellen aufteilen - beide
  Zahlen waeren gesetzt statt gemessen. **Folge: Entscheidung 12 kann Kriterium 5 weder
  erfuellen noch verletzen**, und der Grund, aus dem sie am 09.08.2026 aus Block F vorgezogen
  wurde, ist entfallen. Kriterium 5 bleibt Reset-Bedingung, haengt aber jetzt an Entscheidung 3
  und an Abschnitt 8 Punkt 5.
- **NEU 20.08.2026 (Nutzerentscheidung): das Frischling-Fenster wird auf 14 Tage gezogen und an
  `NEWCOMER_GRACE_MS` gekoppelt.** Damit gibt es fuer "Frischling" nur noch EINE Zahl statt
  bisher 14 Tage Raid-Schonfrist gegen 7 Tage Mining-Bonus. Gemessen ist die Laenge eine
  Begriffs-, keine Balancefrage. Kosten gemessen und angenommen: **+4,60 Mrd in Woche 2, also
  12 % des Wocheneinkommens.** Technische Falle beim Bau: `NOVICE_BONUS_WINDOW_MS` steht in
  `economy.ts` auf Zeile 30, `NEWCOMER_GRACE_MS` auf Zeile 397 - bei einer Kopplung muss die
  Deklarationsreihenfolge mitgezogen werden, sonst ist der Wert an der Verwendungsstelle
  `undefined`.
- **NEU 20.08.2026: ENTSCHEIDUNG 12 IST KALIBRIERT, NICHT GEBAUT. Der Wert steht:
  `NOVICE_BONUS_ADD = 2,0`** - Mining-Multiplikator = Produkt der uebrigen Quellen PLUS 2,0
  statt MAL 3. Woertliche additive Lesart der heutigen 3, keine neu erfundene Zahl. Gemessen:
  +98 % Mining in Woche 1 statt +200 %, beim spaeten Vollstapel +16 % statt +200 %. Bauanleitung
  im Messkasten bei Entscheidung 12, Protokoll `novice_bonus.txt`. **Zwei Client-Spiegel, nicht
  einer:** `lib/multipliers.ts` (Formel) UND das Frischling-Badge in `pages/Sektor.tsx`, dessen
  Text ("{noviceBonusMultiplier}x Ertrag") unter der additiven Regel sachlich falsch wird.
  **Damit steht kein reset-blockierender Punkt mehr offen** - alles Weitere ist im Nachhinein
  korrigierbar.
- **Die geforderte gemeinsame Kalibrierung mit Entscheidung 9 war nicht noetig, und das ist
  gemessen statt unterstellt.** Die 30-Tage-Simulation musste dafuer NICHT vorgezogen werden:
  gerechnet wurde gegen zwei einklammernde Bau-Szenarien (3 Lanes heute gegen 1 Lane plus
  doppelte Basiszeiten), **keine Zelle unterscheidet sich um mehr als einen Prozentpunkt.**
  Grund: das Mining sitzt in beiden Bau-Welten am ersten Tag am Cap (700 Schiffe, 14,3 Mio Wert
  gegen 117,5 Mio Startressourcen, Bauzeit selbst im langsamen Fall 3,9 h), und die
  Kampf-Einnahmen der Startphase sind nicht bau-, sondern gegnerskalierungsbegrenzt.
- **Der Befund, der zu dieser Umstellung gefuehrt hat, im Kurzen:** groesste Einzelquelle der
  ersten Woche ist der **RAID mit 58-64 %**. Er zahlt 1,84 Mrd Wert je gewonnener Welle (10x
  Silber + 6x Gold + 2x Elite), bei 12/12 Wellen 22,07 Mrd - **flach, unabhaengig von der
  eigenen Staerke**, zweimal woechentlich. Das Asteroiden-Mining liegt mit 33-39 % darunter.
  Solo liefert in der Startphase nur 1,23 Mrd/Woche.
- **VIERTES UNGEBAUTES PAKET GEFUNDEN: Entscheidung 3 (Raid-Ertrag, Variante 6) steht nicht im
  Code.** Kein `RAID_ALLY_POWER_WEIGHT`, keine Saettigung, `RAID_WAVE_WIN_*` unveraendert
  10/6/2 je Welle. Diese Datei fuehrte bis heute nur drei Pakete (Block A Schritt 2, Block B,
  Entscheidung 16). **Es sind vier**, und sie gehen alle gleichzeitig live. **Entscheidung 3
  traegt seit dem 20.08.2026 zusaetzlich Abnahmekriterium 5** - sie ist damit nicht mehr nur
  ein offener Einbau, sondern eine Reset-Bedingung.
- **Drei Zahlen des Plantextes waren falsch und sind korrigiert** (Messregel 16): der
  Mining-Stapel ist **x36,72**, nicht x24,5 (die 24,5 sind derselbe Stapel ohne
  `mining_schiffe`); daraus folgt **12,70 statt 8,5 Mrd/Tag**; und beide Zahlen setzen
  Mining-Forschung Stufe 10 voraus, **die ein 7 Tage altes Konto nicht haben kann** - real
  erreichbar sind x6,12 bzw. x12,24 an Di/Do. Die Entscheidung faellt dadurch nicht, nur ihre
  Zahlenbasis ist ersetzt.
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
- **15 Entscheidungen, 15 Reparaturen (R16 neu am 20.08.2026).** Fuer jeden offenen Punkt steht entweder die Zahl oder die
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

## Gesetzt und NICHT neu aufzurollen: Frischling-Bonus und Abnahmekriterium 5

Festgehalten am 20.08.2026, beides Nutzerentscheidungen nach der Messung in `novice_bonus.txt`.

**`NOVICE_BONUS_ADD = 2,0`, Fenster 14 Tage.** Der Wert ist die woertliche additive Lesart der
alten 3 und bewusst KEINE neu erfundene Zahl - es gibt derzeit kein Kriterium, das eine andere
tragen wuerde. Wer ihn spaeter bewegen will, braucht zuerst ein Mass, gegen das er bewegt wird.
Die Fensterlaenge ist nach dem Begriff entschieden, nicht nach der Balance: fuer "Frischling"
gibt es nur noch eine Zahl. Der Vorschlag "7 Tage lassen und die Anzeige beide Fenster erklaeren
lassen" wurde geprueft und verworfen.

**Abnahmekriterium 5 zeigt auf Entscheidung 3 und die Solo-Startphase, nicht auf den
Frischling-Bonus.** Die 50 % stehen woertlich unveraendert. Diese Umstellung entsteht bei
Kaltstarts leicht wieder rueckwaerts, weil im Plantext an vielen Stellen "Kriterium 5 misst
Entscheidung 12" mitschwingt - **das ist gemessen widerlegt**: jede Kuerzung des Bonus HEBT den
Anteil der groessten Quelle (des Raids), und ohne den Raid gerechnet ist das Kriterium mit
keinem Bonuswert erfuellbar. Ebenfalls geprueft und verworfen: das Kriterium in zwei Schwellen
aufteilen (eine fuer den Raid, eine fuer den Rest) - beide Zahlen waeren gesetzt statt gemessen.

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

**Ein FLAG, das beim Handeln gesetzt wird, und eine PROBE, die laufend abtastet, messen nur
dann dasselbe, wenn die Probe direkt auf das Handeln folgt.** (28.08.2026.) `ressourcenAblehnung`
wird in `spielerZug()` gesetzt, `probe()` liest es - mit `--mensch_unterschritte` 30x je Stunde,
und zwar ausschliesslich VOR dem Zug der laufenden Stunde. Gemessen ueberschaetzt K3b dadurch um
**14,7 Punkte**. Der zweite, laenger uebersehene Teil derselben Falle wirkt OHNE jeden Schalter:
bei Profil `gelegenheit` handelt der Mensch alle 12 Stunden, bei `abwesend` an den Tagen 1 bis 14
gar nicht - die Probe liest dort bis zu zwei Wochen alte Flags. **Bei jeder Kennzahl, die einen
beim Handeln gesetzten Zustand ausliest, pruefen, wie weit Setzen und Lesen auseinanderliegen
koennen - und zwar fuer JEDES Profil, nicht nur fuer das, mit dem gerade gemessen wird.**

**Ein grosser Nenner kann auf sehr wenige Beobachtungen zurueckgehen - und sieht dann aus wie
eine belastbare Zahl.** (28.08.2026.) K3b faehrt bei Profil `abwesend` ueber 30 Tage einen Nenner
von 21.600 Proben; dahinter stehen **17 Zuege**, denn nur die setzen die Flags, die K3b
auswertet. Die Kennzahl meldet drei Stellen und traegt keine Aussage. Verwandt mit "K5 waere
formal erhoben und sachlich leer gewesen" und mit "ein Anteilskriterium braucht einen Nenner,
der nicht aus den eigenen Zeilen gebildet wird". **Vor jeder Anteilszahl auszaehlen, wieviele
UNABHAENGIGE Beobachtungen tatsaechlich dahinterstehen - nicht, wie oft gezaehlt wurde.**

**Die Referenzstreuung einer Trennschaerfe-Rechnung muss aus DERSELBEN Zelle stammen, die
spaeter gefahren wird.** (28.08.2026.) Vor der K5-tick-Messung wurde ausgerechnet, ob fuenf
Laeufe je Form reichen - regelkonform, vor der Messung, mit F-Test. Verwendet wurde dafuer die
K5-Streuung aus den economy-Zellen (16,0 gegen 4,2 Punkte, Verhaeltnis 3,78x, F = 14,3). Mit
Raid im Nenner liegt dieselbe Streuung bei **7,3** Punkten, das Verhaeltnis faellt auf rund
1,5x, und fuenf Laeufe reichen nicht mehr. **Erschwerend und der eigentliche Punkt: genau die
Aenderung, die die Messung ueberhaupt erst moeglich macht (der Raid im Nenner), verkleinert den
zu messenden Unterschied mit.** Eine Trennschaerfe-Rechnung gegen eine fremde Umgebung ist eine
Schaetzung und als solche zu kennzeichnen. Verwandt mit "eine Spanne ueber eine Leiter mit
Regimewechsel misst den Regimewechsel", hier aber auf der Planungs- statt der Auswertungsseite.

**Gegen einen MITTELWERT zu kalibrieren, dessen Verteilung schief ist, aendert das Niveau -
auch wenn der Mittelwert exakt gehalten wird.** (28.08.2026.) Der Faktor 0,875 des Reichen
Fundes haelt den Erwartungswert auf +1,7 % genau; der MEDIAN steigt dabei um 23,5 % und die
gemessene Wocheneinnahme in einer tick-Zelle um 26,0 %. Ursache ist rein arithmetisch: die
heutige Form ist stark rechtsschief (Median 81,0 % des Mittels), die neue nahezu symmetrisch
(98,3 %) - wer die eine durch die andere ersetzt und den Mittelwert festhaelt, HEBT den Median
zwangslaeufig. **Besonders lehrreich ist, dass dasselbe Protokoll die Falle zwei Abschnitte
vorher woertlich benennt** ("Wer gegen den Mittelwert kalibriert, kalibriert gegen eine Zahl,
die zwei von drei Spielern nicht erreichen") und sie dann in der eigenen Kalibrierung
uebersieht. **Bei jeder Kalibrierung gegen eine Zufallsgroesse zuerst Median und Mittel
nebeneinander legen und entscheiden, welche der beiden festgehalten werden soll.**

**Eine Aenderung kann die Streuung einer QUELLE beseitigen und die eines KRITERIUMS unberuehrt
lassen.** (28.08.2026.) Die zeitpunktunabhaengige Form senkt den Variationskoeffizienten des
Reichen Fundes von 64,1 auf 12,9 % - der K5-Ausgang wird dadurch nicht nachweisbar stabiler
(F = 1,51 gegen Schwelle 3,18). Grund: K5 ist ein ANTEIL, und sein Nenner enthaelt mit dem Raid
einen zweiten beweglichen Posten, der nach der Aenderung der groessere ist (VarKoeff 43 % gegen
26 %). **Wer die Streuung der einen Quelle beseitigt, macht die der anderen sichtbar.** Vor
jeder Aussage "das stabilisiert Kennzahl X" pruefen, ob X ein Anteil ist und welcher Posten im
Nenner nach der Aenderung dominiert.

**Eine Aenderung an einer LAUFZEIT kann eine Mechanik umskalieren, die an einer ganz anderen
Konstante haengt - exponentiell.** (27.08.2026.) Der Reiche Fund verdoppelt den bis dahin
ANGESAMMELTEN Betrag; sein Beitrag waechst deshalb mit `(1+p)^n` in der Zahl der Stunden-Checks,
nicht linear. Die Missionsdauer der Asteroidenfelder wurde zweimal angehoben (4 -> 12 -> 24 h),
und der Fund ist dadurch von einem 8-%-Aufschlag auf die Woche zur groessten Einzelquelle des
Spiels geworden - **ohne dass an seiner Chance oder an `farmRate` je etwas geaendert wurde.** Beide
Code-Kommentare bei `ASTEROID_MISSION_DURATION_MS` pruefen ausdruecklich die Folgen fuer `dmCap`
und `farmRate` ("bleiben BEWUSST unveraendert"); die einzige Groesse, die ueberproportional
mitwaechst, kommt in keinem von beiden vor. **Bei jeder Aenderung an einer Laufzeit auflisten,
welche Mechanik mit ihr nicht linear skaliert.**

**Eine gesperrte Quelle kann ueber zwei Zwischenschritte in eine Messung gelangen.**
(27.08.2026, fuenfter Fundort von Messregel 16.) Die alte README mit 33 Punkten steht ausdruecklich
auf der Nicht-verwenden-Liste. Ihr Punkt 23 ("Asteroiden-Felder laufen 12h statt 4h") ist trotzdem
in `k5_quellen.txt` Abschnitt 11 zitiert worden, von dort in den Messkasten in Abschnitt 1b und von
dort in die Aufgabenstellung einer Folgesitzung - real steht im Code 24 h. Wer die Zahl uebernimmt,
baut sein Messgitter um einen Wert herum, den es nicht gibt. **Nicht nur die eigenen Anker aus dem
dist lesen, sondern auch jede Zahl, die eine Aufgabenstellung mitliefert** - besonders, wenn sie
mit einem Datum oder einer Punktnummer daherkommt.

**Ein abgebrochenes WARTEKOMMANDO sieht aus wie ein abgebrochener Lauf.** (27.08.2026.) Der Sweep
lief korrekt abgekoppelt; ein `sleep` zum Nachsehen riss dagegen das Zeitlimit der
Werkzeugausfuehrung und meldete einen Fehler. Der Messlauf war unberuehrt, per `pgrep` geprueft.
**Aus einer Fehlermeldung des Wartekommandos nichts ueber den Lauf schliessen - den Prozess
pruefen.** Die Gegenrichtung der bekannten Regel "ein abgebrochener Lauf sieht aus wie ein
haengender", und ein zweiter Grund fuer `setsid nohup ... &` mit `--out=`.

**Eine Funktion, die `{ ok:false }` ZURUECKGIBT statt zu werfen, macht jedes `try/catch` zur
Attrappe - und der Aufrufer haelt dann jeden Fehlschlag fuer einen Erfolg.** Das Spielermodell
in `sim13_lauf.mjs` war so gebaut und deshalb blind fuer seine eigenen Ablehnungen; fuenf
Defekte konnten sich dahinter monatelang halten, darunter zwei, die beide Einnahmequellen
abschalteten. **Vor jedem `try/catch` um eine fremde Funktion am Code nachsehen, ob sie
ueberhaupt wirft.** Erkennbar an `return { ok: false, error: ... }` in der Signatur.

**Ein Multiplikator, der null werden kann, macht jede Investition dahinter wertlos - und sieht
dabei aus wie Fortschritt.** `mineOutputPerHour()` multipliziert mit `energyFactor()`; ohne
Solarkraftwerk ist der Faktor 0, und neun Minenstufen foerdern exakt nichts. Der Spielstand
sah dabei gesund aus (Minen wachsen, Warteschlangen laufen). **Bei jeder Ertragsformel pruefen,
welche Faktoren null werden koennen, und ob das Modell den noetigen Gegenpart ueberhaupt bauen
KANN** - hier konnte es nicht, weil der Filter `b.baseOutput` das Kraftwerk ausschloss.


**Eine Buchung, die gegen eine Untergrenze laeuft, ist bei leerem Konto nicht beobachtbar - und
ihre Abwesenheit sieht dann aus wie ein Defekt.** Die Wrack-Bergung zieht ihren Betrag ueber
`Math.max(0, (stats.resourcesSpentShipsDefense || 0) - betrag)` ab (Fehlerform R6). Im ersten
Diagnoselauf der Verdrahtungsprobe stand der Zaehler auf 0, die Klammer lieferte 0, und die
Ausgabe meldete "Punkte-Korrektur 0,000 Mrd" - also genau das, was ein FEHLENDER Patch A6 auch
gemeldet haette. Mit realistischem Ausgangsbestand erscheint der Abzug korrekt mit -0,092 Mrd.
**Vor jeder Pruefung auf "wird abgezogen" den Ausgangsbestand so setzen, dass ein Abzug
ueberhaupt Platz hat.** Verwandt mit "ein Mechanismus kann exakt das Richtige tun und trotzdem
nichts bewirken", hier aber auf der MESSSEITE statt im Spiel.

**Zwei Verdoppler koennen an einem Zaehler haengen, der bei einem Umbau seine Aufgabe verliert.**
`mission.combatWins` traegt Sandronator x2 und Wochen-Event Mo/Fr x2 und zahlt beide auf
Container UND Ressourcen aus. Block A Schritt 2 nimmt dem Zaehler beide Aufgaben ab (Container
einmal je Mission, Ressourcen ueber die Kurve) - die Bauanleitung sagt aber nicht, wo die
Verdoppler danach landen, und die Referenzschleife in `check_build_anker.mjs` kennt keinen von
beiden. **Folge fuer jede Messung an dieser Stelle: nicht an einem Montag oder Freitag laufen
lassen und keinen Sandronator einsetzen**, sonst liegen Probe und Referenz um Faktor 2
auseinander und es sieht wie ein Verdrahtungsfehler aus. Der wiederhergestellte Build beantwortet
die Frage (Verdoppler auf den Ressourcenteil, Container ohne sie) - **das ist eine gebaute
Setzung und keine gemessene Groesse.** Allgemein: **bei jedem Umbau pruefen, ob der abgeloeste
Zaehler noch etwas anderes getragen hat als das, wofuer er benannt ist.**

**Ein Protokoll belegt nicht, dass sein Werkzeug im Repo liegt - und ein Messwert ohne sein
Werkzeug ist nicht mehr reproduzierbar.** `sim13_geruest.txt` nennt `make_messbuild_sim13.mjs` und
`sim13_lauf.mjs` in der Kopfzeile, `WERKZEUGE_26-08-2026.md` beschreibt beide mit Aufrufsyntax und
Schaltern - hochgeladen wurde keines von beiden. Aufgefallen ist es erst in der Folgesitzung, beim
Versuch, die dokumentierte Befehlszeile auszufuehren. **Am Ende jeder Session pruefen, ob JEDE im
Protokoll genannte Datei tatsaechlich im Repo liegt** - `git status` und ein `ls` auf die im
Werkzeug-Dokument genannten Namen kosten zehn Sekunden. Verwandt mit der Regel "Doku und Code
duerfen nie auseinanderlaufen" aus der Arbeitsregel, aber eine Ebene tiefer: hier lief nicht die
Beschreibung dem Code davon, sondern die Beschreibung dem WERKZEUG.
*Nachtrag am selben Tag: die Werkzeuge wurden nachgereicht und vor Gebrauch auf Echtheit geprueft
(Blockzaehlung, Bezeichner, Schalter, nicht rekonstruierbare Implementierungsdetails). Die Regel
bleibt - und um eine zweite ergaenzt: **wer ein nachgereichtes Werkzeug annimmt, prueft zuerst, ob
es das Original ist oder ein Nachbau**, sonst geht eine Rekonstruktion als unabhaengiger Beleg
durch.*

**Eine Uebereinstimmung ist erst ein Beleg, wenn die Probe auch die ABWESENHEIT erkennen kann.**
Die Verdrahtungsprobe lag mit +0,1 % an der Referenz - das allein haette auch ein Zufall sein
koennen oder eine Probe, die konstruktionsbedingt gar nicht abweichen KANN. Erst der Lauf gegen
den unverdrahteten Build (+72,8 %, Container 4,40 statt 1,00 je Mission) macht daraus einen
Beleg. **Zu jeder Uebereinstimmungspruefung gehoert eine Zelle, in der das Gesuchte nachweislich
fehlt** - und der Trennabstand ist gegen die Streuung zu lesen, hier 73 gegen rund 2 Punkte.

**Ein Kriterium an der 100-%-Kante kann eine Aufloesung haben, die kleiner ist als die eigene
Streuung.** Bei 40 Serien ist der Unterschied zwischen "100 % perfekt" und "98 % perfekt" EIN
Ereignis - und genau um dieses eine Ereignis unterscheiden sich zwei unabhaengige Laeufe derselben
Zelle (gemessen am 22.08.2026 bei Entscheidung 18: 100 % und 98 % bei identischer Einstellung).
Der Eskalationswert 1,70 meldete in zwei 40er-Laeufen je 98 % und in einem 80er-Lauf 94 % -
**mit 40 Serien haette er das Kriterium scheinbar gehalten.** Messregel 2 fordert 40 Serien als
Untergrenze; **bei einem Kriterium, das an einer Kante von 0 % oder 100 % liegt, reicht das
nicht.** Vor der Kalibrierung ausrechnen, wie viele Serien noetig sind, damit der geforderte
Abstand ueberhaupt darstellbar ist - und die bindende Zelle feiner messen als die uebrigen.

**Der NAME einer Konstantenmenge kann ihren Inhalt falsch beschreiben - und dann liest man sie nie
nach.** `MULTI_TARGET_VOLLEY_SHIPS` galt drei Sessions lang als "die drei Salvenschiffe" und hat
fuenf Eintraege: `sentinelkanone` und `ultimatekanone` sind VERTEIDIGUNGSANLAGEN. Der Messkasten
von Entscheidung 19 hielt deshalb fest, Verteidigungsanlagen blieben von Weg 2 unberuehrt - richtig
fuer die ZIEL-Seite, falsch fuer die SCHUETZEN-Seite, und am Endgame-Konto ist der Unterschied
Faktor 5-8 auf ihre Feuerkraft. **Vor jeder Aussage ueber eine Menge die Menge auszaehlen, nicht
ihren Namen lesen** - `grep` auf den Konstantennamen kostet zehn Sekunden. Verwandt mit dem
Salven-Befund aus 4.4: dort fehlte ein `ZIELERFASSUNG_BASE`-Eintrag und machte die Faehigkeit tot,
hier ist er vorhanden und macht sie lebendig. **Beide Male entschied ein Eintrag in einer ZWEITEN
Tabelle darueber, ob der Eintrag in der ersten ueberhaupt etwas tut.**

**Ein Kriterium kann bei den Extremwerten trennen und trotzdem mit EINER Zahl unerfuellbar sein -
wenn die BEZUGSKURVE nicht monoton ist.** Der Zielkorridor "60-100 % des Spielers" aus
Entscheidung 13 trennt sauber (bei f=1 liegt der Bot bei 0,04-0,12, bei f=20 bei 0,39-1,38) und
ist trotzdem mit keinem einzigen Koeffizienten erreichbar: der Abstand zwischen der guenstigsten
und der unguenstigsten Stuetzstelle betraegt IMMER Faktor 3,4. Ursache liegt nicht beim
kalibrierten Mechanismus, sondern beim Nenner - der Spieler verdient je Punkt eigener
Flottenmacht 3,5 / 7,2 / 3,3, der mittlere Stand ist ein Gipfel, weil dort das Elite-Bollwerk
aufgeht. **Die Trennschaerfe-Pruefung reicht also nicht: zusaetzlich pruefen, ob EIN Wert des
Reglers alle Stuetzstellen gleichzeitig treffen KANN.** Sonst hat man ein Kriterium, das misst,
aber nie erfuellt wird.

**Ein Fallback-Zweig kann seine Bedingung verlieren, wenn eine andere Aenderung die Voraussetzung
wegnimmt - und dann greift er nie wieder.** `maybeBuildBuilding()` erreicht Roboterfabrik und
Nanitenfabrik erst, wenn alle drei Minenausbauten fehlschlagen, was nur aus Geldmangel geschieht.
Solange Bots arm sind, funktioniert das. Sobald 13.1 sie reich macht, bauen sie die beiden
bauzeitverkuerzenden Fabriken NIE mehr und wachsen dadurch LANGSAMER, je mehr sie einnehmen
(gemessen: Robo 0 / Nanite 0 beim 27-fachen Zusatzertrag gegen Robo 5 / Nanite 14 beim
9-fachen). Dritter Fundort derselben Fehlerform nach `ATTACK_POWER_SAFETY_MARGIN` und
`ADMIRAL_ESCORT_BASE`. **Vor jeder Aenderung, die eine Ressourcenlage verschiebt, nach Zweigen
suchen, deren Bedingung "wenn nichts anderes bezahlbar ist" lautet.**

**Eine Begruendung kann von einer SPAETEREN eigenen Entscheidung entwertet werden.** 13.2
begruendete die festen Bot-Profile unter anderem damit, die Gleichverteilung sei "wertmaessig
schief" und "nach Entscheidung 6 genau die schlechteste Verwendung". Gemessen betraegt der
Unterschied in Macht je Wert-Einheit **0,2 %** - weil genau diese Entscheidung 6 den Wert je
Machtpunkt ueber alle Schiffstypen auf 1,15 angeglichen hat. Die Entscheidung selbst bleibt
richtig, ihre wirtschaftliche Begruendung ist tot. **Bei jeder aelteren Begruendung pruefen, ob
eine seitdem getroffene Entscheidung ihr die Grundlage entzogen hat** - das ist dieselbe Form wie
"die README-Punkte zeigen ins Leere", nur innerhalb des Plans.

**`run_income_baseline_v2.mjs` UEBERSCHREIBT `income_baseline_v2.txt` bei jedem Lauf - auch bei
einem Testlauf mit N=2.** Am 20.08.2026 ist beim Streuungs-Lauf genau das passiert, und die
Sicherungskopie war bereits die Testlauf-Fassung, weil sie erst danach gezogen wurde.
Wiederhergestellt aus git. **Vor jedem Lauf, der ein Protokoll ueberschreibt, zuerst
`git status` sauber haben - dann ist `git checkout --` die Sicherung.**

**Ein Befund kann bei einem Vergleich entstehen, den das Spiel nie erzwingt.** Session-1-Befund 2
stellt die drei Minen auf DERSELBEN Stufe gegenueber (25 bzw. 30) und findet dort Faktor 2,8/5,0
zugunsten von "Metall ausbauen und tauschen". Die Heimatbasis erzwingt gleiche Stufen aber
nirgends - `HOME_TIER_UNLOCK_LEVELS` staffelt 36/32/30, und an DIESEN Stufen liegt die Spannweite
bei 19 %. Der Befund war rechnerisch richtig und als Handlungsgrundlage trotzdem falsch; die
darauf gebaute Aenderung haette das Verhaeltnis um Faktor 6 in die Gegenrichtung gedreht. **Vor
jeder Angleichung pruefen, an welchem Punkt der Spieler die beiden Optionen tatsaechlich
gegeneinander haelt** - und ob eine Staffelung dieselbe Aufgabe schon erledigt.

**"Angleichen" legt ein Verhaeltnis fest, kein Niveau - und das Niveau entscheidet.** Bei 7.2
lieferten drei Wege zum selben Verhaeltnis Stationskosten von 283, 558 und 841 Mrd; nur der
mittlere haelt das Amortisationsband, und nur er laesst die Ressourcen-Senke unveraendert, wegen
der die Station ueberhaupt existiert. **Bei jeder Relations-Korrektur zuerst festlegen, welche
Aggregatgroesse dabei konstant bleiben soll** - sonst kalibriert man zwei Dinge gleichzeitig und
merkt es erst hinterher.

**Ein Anteilskriterium hat einen Nenner mit mehreren Spalten - und die Spalte entscheidet, ob es
ueberhaupt misst.** Bei der Allianz-Station trennen fuenf der sechs moeglichen Bezugszellen gar
nicht: gegen `spaet` waere jeder Kompensationswert bis 10,85 zulaessig, gegen die ganze Station
bei `mittel` schon die Untergrenze 2,0 verletzt. **Vor jeder Kalibrierung gegen ein
Schwellenkriterium die Grenze fuer BEIDE Extremwerte ausrechnen und die Spalte vorab festlegen** -
das ist dieselbe Regel wie bei der Fensterfrage von Entscheidung 12, hier zum zweiten Mal
angewandt und diesmal vor der Messung statt danach.

**Ein globaler Multiplikator koppelt Entscheidungen, die getrennt kalibriert werden sollen.**
`MODULE_COST_MULTIPLIER` traegt an der Station sowohl die Foerdereffizienz-Module (7.3) als auch
"Verstaerkte Automatisierung"/"Wartungsfreiheit" (Hebel von 7.4). Eine pauschale Anhebung in 7.3
haette 7.4 vorkalibriert, bevor 9.1 ueberhaupt entschieden ist. **Vor jeder Aenderung an einer
gemeinsam genutzten Konstante auflisten, welche Entscheidungen sonst noch an ihr haengen.**

**Wo eine FLACHE Belohnung auf einen PROPORTIONAL mitskalierenden Gegner trifft, ist Aufteilen
immer besser als Zusammenhalten - und wenn die Zahl gleichzeitiger Teilnahmen nicht begrenzt ist,
ist es beliebig oft besser.** Zweimal am 20.08.2026 aufgetaucht, an zwei voellig verschiedenen
Stellen: in der Startphase als NACHTEIL fuer grosse Flotten (Solo netto 0,24 Mrd bei 50 Mio
Flottenwert, negativ ab 400 Mio - der Container-Fund ist flach, der Gegner waechst mit) und beim
Elite-Bollwerk als MULTIPLIKATOR fuer den, der aufteilt (R16: 17 Mrd je Expedition, flottengroessen-
unabhaengig, beliebig viele Expeditionen gleichzeitig). **Bei jedem Inhalt mit flacher Belohnung
zwei Dinge pruefen: waechst die Gegnerseite proportional mit, und ist die Zahl gleichzeitiger
Teilnahmen begrenzt?** Ist die erste Antwort ja und die zweite nein, ist der Inhalt offen.

**Eine Sperre, die an einer Stelle eingebaut wurde, ist an der anderen nicht automatisch da.**
Solo-Missionen haben seit dem 29.07.2026 die Regel "immer nur eine Piraten-Sektor-Stufe
gleichzeitig" (`missions.ts` Zeile 97). Die Gruppen-Operationen bekamen sie nie - dieselbe
Spielsituation, anderer Codepfad, keine Sperre. **Bei jeder Regel, die eine Gleichzeitigkeit
begrenzt, alle Eintrittspunkte suchen** - bei R16 sind es zwei (`createGroupOperation` und
`respondToGroupOperation`), und eine Sperre nur im ersten waere wirkungslos gewesen.

**Ein Abnahmekriterium kann auf die falsche Quelle zeigen - und man merkt es erst, wenn man alle
Quellen NEBENEINANDER hinschreibt.** Abnahmekriterium 5 ("keine Einzelquelle ueber 50 % der
Woche-1-Einnahmen") ist ausdruecklich Entscheidung 12 zugeordnet und nennt die Asteroiden als
Verletzer. Gemessen am 20.08.2026: groesste Quelle ist der RAID mit 58-64 %, das Mining liegt bei
33-39 %, und **jede Kuerzung des Frischling-Bonus macht das Kriterium schlechter**, weil der
Raid-Anteil dadurch steigt. Das Kriterium haette also das Gegenteil dessen verlangt, wofuer es
gedacht war. **Vor jeder Kalibrierung gegen ein Anteils-Kriterium zuerst ALLE Quellen messen, auch
die, um die es scheinbar nicht geht** - sonst kalibriert man gegen einen Nenner, den man nicht
kennt.

**Eine flache Belohnung neben einer mitskalierenden Gegnerstaerke laesst die Einnahme mit der
Flottengroesse FALLEN.** Gemessen in der Startphase: Solo netto 0,24 Mrd bei 50 Mio Flottenwert,
negativ ab 400 Mio; die Raid-Einnahme faellt ebenso. Wer mehr baut, verdient weniger. Beide
Belohnungen sind flach (ein Container-Fund je Mission, feste Container je gewonnener Welle), beide
Gegner haengen an der eigenen Macht. **Bei jedem Inhalt pruefen, ob BEIDE Seiten mitwachsen** -
das ist Messregel 12, hier zum ersten Mal mit umgekehrtem Vorzeichen aufgetreten.

**Eine Umbenennung schuetzt nur den, der sie kennt.** `allowRetreat: boolean` heisst seit dem
19.08.2026 `retreatMode: 'all' | 'none' | 'fleetOnly'`. Ein Messskript, das noch
`allowRetreat: false` uebergibt, wird STILL ignoriert und misst den Standardfall - genau dafuer
wurde umbenannt, und genau das ist am 20.08.2026 im ersten Entwurf von `run_novice_bonus.mjs`
passiert. Aufgefallen ist es nur, weil ein Diagnoselauf `retreated: true` meldete, obwohl der
Rueckzug abgeschaltet sein sollte. **Vor jeder Messung EINEN Diagnoselauf mit ausgeschriebenem
Ergebnis ansehen, nicht nur die Aggregatzahl.** Nebenbei damit widerlegt: die Beschreibung
"Rueckzug gilt NICHT fuer die Heimatverteidigung" ist ueberholt - der Raid laeuft auf
`fleetOnly`, die FLOTTE dreht sehr wohl ab.

**Eine Entscheidungsregel kann so gebaut sein, dass sie nie trennt.** Fuer die Fensterfrage
(7 gegen 14 Tage Frischling-Bonus) war vorab die Regel aufgestellt worden: "auf 14 ziehen, wenn
der Mining-Anteil an Tag 8-14 unter 50 % bleibt". Gemessen trifft sie in JEDER Variante zu, auch
bei komplett abgeschaltetem Bonus. Die Regel sah nach einer Messung aus und war keine.
**Vor dem Messen pruefen, ob die Regel bei den Extremwerten unterschiedliche Antworten gibt** -
wenn nicht, ist es eine Setzung und gehoert als solche benannt.

**Eine Begruendung kann einen Zustand beschreiben, den die betroffene Gruppe nie erreicht.**
Entscheidung 12 stuetzte sich auf einen Mining-Stapel von 24,5x und 8,5 Mrd/Tag. Der Stapel ist
in Wahrheit 36,72x - aber beide Zahlen setzen Mining-Forschung Stufe 10 voraus, die ein 7 Tage
altes Konto gar nicht haben kann. Real erreichbar sind x6,12 bzw. x12,24. Die Entscheidung war
trotzdem richtig, ihre Zahlen waren es nicht. **Bei jeder Zahl, die an einem Ausbaustand haengt,
pruefen, ob der Ausbaustand zur betroffenen Gruppe passt.**

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

**Wer eine Einnahme an ihrer ENTSTEHUNG bucht, muss pruefen, ob es einen Pfad gibt, auf dem sie nie
ausgezahlt wird.** (26.08.2026, fuenfte Session, vor dem ersten Lauf gefunden.) `mission.farmed`
sammelt VIER Quellen ein - an der Auszahlung zu buchen trennt deshalb nichts, gebucht werden muss
beim Fuellen. Genau daraus folgt die Falle: `abortMissionDestroyed()` zahlt NICHTS aus. Eine
verlorene Mission waere als Einnahme gezaehlt worden, und zwar unsichtbar - die Summe waere schlicht
zu hoch gewesen, ohne dass etwas danebenstuende, woran das auffiele.

**Ein Anteilskriterium braucht einen Nenner, der NICHT aus den eigenen Zeilen gebildet wird.**
(26.08.2026.) Summieren sich die instrumentierten Anteile auf 100 %, beweist das nichts - eine
uebersehene Buchungsstelle sieht genauso aus. Der Nenner muss unabhaengig gemessen werden (hier:
Accessoren ueber `state.resources`, die jeden positiven Zuwachs zaehlen), und die Differenz gehoert
als eigene Zeile "nicht zugeordnet" in die Ausgabe. Verwandt mit der aelteren Regel "vor jeder
Kalibrierung gegen ein Anteils-Kriterium zuerst ALLE Quellen messen".

**Ein Treiber kann eine ganze Spielmechanik stillschweigend auslassen.** (26.08.2026.)
`sim13_lauf.mjs` rief `runEconomyTick()` statt `tick()` - dadurch lief `processRaidTimer()` nie, und
im Lauf gab es ueber 30 Tage keinen einzigen Raid, obwohl der Raid gemessen die groesste Quelle der
Startphase ist. Nichts hat gefehlt gemeldet; die Zeile stand einfach nicht da. **Bei jeder
Kennzahl, die eine Mechanik voraussetzt, am Code nachzaehlen, wer sie ueberhaupt aufruft** - hier
genuegte ein `grep` nach den Aufrufern.

**Eine Kennzahl, die je ZEITSCHRITT misst, unterschaetzt ein Ereignis, das sich ueber mehrere
Zeitschritte erstreckt.** (26.08.2026, Befund 3.) K1 vergleicht die Flottenmacht je Stunde; ein Raid
laeuft ueber zwoelf Wellen. Ein vollstaendiger Verlust der Heimatflotte zerfaellt in elf
Einzelabfaelle, und K1 sieht nur den groessten: **92,0 % statt 99,9 %.** Die Schwelle wurde hier
gerissen, konnte aber bei gleichmaessigerer Verteilung verfehlt werden. Verwandt mit der
K3-Fehlerform, nicht identisch.

**Eine Zahl aus einem Lauf gehoert nicht neben eine Beobachtung aus einem anderen.** (26.08.2026,
selbst passiert.) Die erste Fassung des Befunds 3 stellte die Tageszeilen eines ABGEBROCHENEN
30-Tage-Laufs neben den K1-Wert eines 14-Tage-Laufs und schloss daraus, K1 uebersehe den Verlust.
Der abgebrochene Lauf hatte nie eine Endauswertung geliefert - es gab zu diesem Ereignis gar keinen
K1-Wert. Der nachgeholte Lauf widerlegte die Aussage. **Bei jeder Zahl mitschreiben, aus welchem
Lauf sie stammt, und einen abgebrochenen Lauf nie als Quelle einer Kennzahl verwenden.**

**Ein Freischalt-Kriterium braucht eine Sperre, die es im Code wirklich gibt.** (26.08.2026,
Befund 4.) K4 mass "neuer Inhalt" an den Sektoren - dort gibt es keine Sperre, und die
Piraten-Sektoren skalieren mit der eigenen Macht mit, es wird also nie etwas freigeschaltet,
sondern nur schwerer. Auch Schiffe, Verteidigung und Forschung haben keine Voraussetzung. Vor jedem
Kriterium dieser Art am Code nachsehen, **was ueberhaupt gestaffelt ist** - hier genau viererlei.

## Erster Schritt beim naechsten Mal

**STAND 28.08.2026 (siebte Session): DIE DREI OFFENEN PUNKTE SIND ABGEARBEITET. DER EINBAU DES
REICHEN FUNDES IST DAMIT NICHT NAEHER, SONDERN GENAUER BESCHRIEBEN - UND DREI FRAGEN LIEGEN BEIM
NUTZER.** Protokoll `balance/session2-simulation/reicherfund_12_offene_punkte.txt`.

**~~NICHTS TUN, BEVOR FRAGE A UND C BEANTWORTET SIND~~ - ALLE DREI SIND AM 28.08.2026
ENTSCHIEDEN** (vom Nutzer delegiert, `reicherfund_13_entscheidungen.txt`, umkehrbar):
**A: 0,875 bleibt** (der Unterschied klingt ab - +26,0 % / +14,6 % / +1,7 %; Median-Kalibrierung
waere eine Kuerzung um 19 % und haette Entscheidung 3 mitgerissen). **B: der Wegfall der
Zeitpunkt-Abhaengigkeit ist gewollt** (sie ist die Ursache der Drift). **C: die Praemie wird
ausgeschlossen** (dieselbe unentworfene Kopplung, die den Fund zum Problem gemacht hat).
**Das Einbaupaket steht damit fest - der EINBAU ist es nicht.** Naechster fachlicher Schritt ist
Punkt 4. Ursprungstext:
- **(A) Die Zahl 0,875 ist eine Niveauaenderung.** Sie haelt den Erwartungswert (+1,7 %) und
  hebt den Median um 23,5 %, die gemessene Wocheneinnahme in einer tick-Zelle um 26,0 %. Das
  widerspricht 12b in seinem Kern ("eine Formaenderung, keine Niveauaenderung"). Wege: behalten
  und die Anhebung als gewollt eintragen; gegen den Median kalibrieren (rechnerisch 0,709 - eine
  RECHNUNG, keine gemessene Zelle); oder gegen einen anderen Bezug.
- **(C) Die Eskorten-Praemie.** Ausschluss ja oder nein. Mit Praemie im Bemessungstopf waere der
  Faktor 0,586 statt 0,875. Kostet den Ertragsanteil einer Eskorte 69 %.
- **(B) daneben, unabhaengig:** der Code-Kommentar bei `ASTEROID_RICH_FIND_CHANCE` benennt zwei
  Bestandteile der Nutzerentscheidung vom Juli 2026 - Gluecksspiel UND Zeitpunkt-Abhaengigkeit.
  v_p016 loescht die zweite. Ist das gewollt?

**PUNKT 1 IST BEANTWORTET UND BRAUCHT KEINE WEITEREN LAEUFE: NEIN.** Die neue Form stabilisiert
den K5-Ausgang nicht nachweisbar (F = 1,51 gegen 3,18), weil mit Raid der Raid der groessere
bewegliche Posten im Nenner ist. **K5 kann diese Entscheidung nicht tragen** - vierte
Wiederholung desselben Befunds. Nicht erneut gegen K5 kalibrieren.

**PUNKT 2 IST EINE BAUANLEITUNG, KEINE MESSUNG** (Protokoll Abschnitt 4, fuenf Stellen statt
zwei). Client-Aenderungen sind gesondert freizugeben und wurden NICHT gebaut.

**PUNKT 4 DANACH, UND ER IST JETZT STARTKLAR.** Empfehlung zur Reihenfolgefrage: gegen den
IST-Zustand fahren und kennzeichnen. Ein Messbuild mit v_p016 wuerde eine Baseline mit um 26 %
angehobenem Niveau erzeugen, solange die Zahl nicht steht.
**Der K3b-Vorbehalt ist ERLEDIGT** (28.08.2026, `k3b_vorbehalt.txt`): `--mensch_unterschritte`
kann verwendet werden, K2 ist nicht betroffen. Beim Zitieren von K3b/K3c gilt: **fuer `aktiv`
K3c (720 Zuege), fuer `gelegenheit` mit Vorbehalt (60), fuer `abwesend` gar nicht (17).**

---

**~~STAND 27.08.2026 (sechste Session): DIE MESSUNG ZUM REICHEN FUND IST GEFAHREN UND DIE
ENTSCHEIDUNG IST GEFALLEN~~ - ERGAENZT, siehe oben** (vom Nutzer delegiert, eingetragen, umkehrbar, **nicht gebaut**):
**zeitpunktunabhaengige Form, Chance 0,16, Faktor 0,875.** Niveau unveraendert, Streuung
64,1 -> 12,9 %, Spanne 7,63x -> 1,56x. Begruendung im Stand-Eintrag oben und in
`reicherfund_11.txt` Abschnitt 12b. **Sammelliste jetzt bei ZEHN Paketen.**

**DREI KLEINE PUNKTE VOR DEM EINBAU, rund eine halbe Stunde:** K5 in einer `tick`-Zelle (ohne Raid
ist K5 nicht entscheidbar); der Client-Spiegel `RichFindList` samt dem Text "Reicher Fund in
Stunde X"; und die Eskorten-Praemie, die kuenftig nicht mehr mitverdoppelt wird.

**NICHTS DAVON DARF GEGEN ABNAHMEKRITERIUM 5 KALIBRIERT WERDEN** - K5 bewegt sich hier nicht
monoton, und sein schlechtester Wert ist ausgerechnet die Nullmessung.

**ZWEITER OFFENER STRANG: DIE MASSENFRAGE - URSACHE GEFUNDEN, ENTSCHEIDUNG OFFEN.** Es ist die
Bauart des Piratenkapitaens, nicht das Kampfmodell (Stand-Eintrag oben). Bei verteilter
Gegnermacht ist die Verlustquote flach (32-38 % ueber die ganze Leiter). **Nicht die Schwelle
anheben, nicht die Deckel anheben** - beides gemessen und verworfen.
**ERLEDIGT:** die Eskorte ist gemessen (Abschnitt 4b). Der Effekt ist milder als berichtet
(15,2 % statt 0,1 % Verlust bei 11.250 Einheiten), der Abfall bleibt aber - und weder Machtanteil
noch Koernigkeit begradigen ihn. **VIER Hypothesen sind jetzt widerlegt.**
**URSACHE GEFUNDEN (Abschnitt 4c): der Nachlauf des unsterblichen Kapitaens traegt 29,7 der
34,5 Punkte.** Die Eskorte stirbt nach 17 % der Kampfdauer, danach feuert er 83 % der Zeit allein
weiter - ein gedeckelter Festbetrag, der gegen kleine Flotten viel und gegen grosse nichts
ausmacht. **LOESUNGSRICHTUNG GEMESSEN (Abschnitt 4d): den Kapitaen ueber STUECKZAHL skalieren statt ueber
Staerke** - Abfall 35,4 -> 6,8 Punkte, fruehes Spiel unveraendert. **Aber: 658M je Stueck ist ein
Messwert, kein Bauwert, und der brauchbare Bereich ist sehr schmal** (176M vernichtet den Spieler
vollstaendig). Vor einem Einbau: stabile Bezugsgroesse ableiten, und Beute/Berichte pruefen.

**PUNKT 4 DANACH - UND MIT EINER ENTSCHEIDUNG ZUR REIHENFOLGE.** Solange die Empfehlung nicht
gebaut ist, misst Punkt 4 den IST-Zustand und seine Baselines tragen den heutigen Reichen Fund mit
64 % Streuung. Entweder das kennzeichnen, oder Punkt 4 gegen einen Messbuild mit v_p016 fahren -
letzteres ist die sauberere Reihenfolge, aber eine eigene Entscheidung.

Buildpfad, jetzt vierstufig (die vierte Stufe ist optional, nur fuer Reicher-Fund-Zellen):

```
node make_messbuild_kum.mjs         /tmp/mb_kum       --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs       /tmp/mb_kum    /tmp/sim13/dist
node make_messbuild_k5.mjs          /tmp/sim13/dist /tmp/k5/dist
node make_messbuild_reicherfund.mjs /tmp/k5/dist   /tmp/rf/dist  [--chance= --dauer_h= --aufschlag=]
MESSBUILD=/tmp/k5/dist node check_build_anker.mjs 40    # normiert -2,8 bis +0,4 %, NEUN Messungen
node sim13_lauf.mjs --build=/tmp/k5/dist --profil=aktiv --tage=14 [--treiber=tick]
node run_reicherfund.mjs --n=20 --out=rf.json           # 7 Zellen, rund 25 min
```

**DIE ANKER-ERWARTUNG IST BREITER ALS BISHER NOTIERT: -2,8 bis +0,4 %, nicht "-1 bis -3 %".**
Neun Messungen. Der Anker kann positiv ausfallen; ein einzelner Wert ausserhalb des Bandes belegt
keinen defekten Build. Zwei Laeufe fahren, bevor daraus etwas geschlossen wird.

**VOR PUNKT 4 ZUSAETZLICH ZU KLAEREN, klein:** mit `--mensch_unterschritte` laeuft `probe()` 30x je
Stunde, `spielerZug()` nur einmal - `ressourcenAblehnung` wird nur dort zurueckgesetzt, **K3b ist
dadurch vermutlich nach oben verzerrt.** K2 ist nicht betroffen. Die Rechenzeit ist geklaert:
Faktor **1,58**, nicht 30, also rund 75 Minuten fuer neun Laeufe.

**~~STAND 26.08.2026 (fuenfte Session): SCHRITTE 1 BIS 3 SIND ERLEDIGT. NAECHSTER SCHRITT IST
PUNKT 4.~~ UEBERHOLT** - die Messung zum Reichen Fund war vorzuziehen, siehe oben.

**DREI DER VIER OFFENEN FRAGEN SIND AM 26.08.2026 ENTSCHIEDEN - der Nutzer hat die Entscheidung
ausdruecklich ueberlassen. Alle drei sind umkehrbar und in `k5_quellen.txt` begruendet:**

1. **Punkt 4 laeuft mit `--treiber=tick`**, dazu je Profil EIN `economy`-Lauf als Bruecke zu den
   bisherigen Zahlen. Ohne `tick` kein Raid und damit kein Traeger fuer Entscheidung 3; ohne die
   Bruecke ist kein Wert aus den vorherigen Sessions mehr vergleichbar. Kosten rund 16 Minuten.
2. **K1b ist GEBAUT, K1 bleibt unveraendert** - Muster K3/K3b.
3. **K4 haengt jetzt an den echten Sperren** (Heimatstufe V2/V3, Stations-Stufe, Imperator,
   Sandronator) statt an `npcFloor`.

**OFFEN UND BEWUSST NICHT ENTSCHIEDEN: die Hoehe des Reichen Fundes.** Das ist eine
BALANCE-Frage, und ihr fehlt die Zahl - sie hier zu entscheiden waere ein Verstoss gegen die
Arbeitsregel. Vorgeschlagene Messung in `k5_quellen.txt` Abschnitt 11 (Chance 0,08 gegen 0,04 und
0,02; Verdopplung gegen festen Stundenaufschlag; Nullmessung ohne die Mechanik; zu protokollieren
ist die STREUUNG, nicht nur der Mittelwert). Rund eine halbe Sitzung. **Zu pruefen ist dabei
zuerst, ob die heutige Hoehe eine Folge der Verlaengerung der Asteroidenmissionen von 4 auf 12
Stunden ist** - der Fund verdoppelt den ANGESAMMELTEN Betrag, ein Treffer in der letzten Stunde
ist also rund zwoelfmal so viel wert wie einer in der ersten.

**MINDESTENS DREI LAEUFE JE PROFIL, NICHT EINER.** Die Streuung aus dem Reichen Fund betraegt rund
20 Prozentpunkte auf den groessten K5-Anteil; ein Einzellauf traegt daraus keine Aussage.

**Achtung bei langen Laeufen:** ein 30-Tage-Lauf mit `tick` braucht ueber zehn Minuten und ist in
dieser Session einmal vorzeitig beendet worden, ohne Endauswertung. Mit `--out=` fahren, damit die
Rohdaten auch dann vorliegen, und die Tageszeilen mitschreiben.

**~~STAND 26.08.2026 (vierte Session, Abschluss): NAECHSTER SCHRITT IST PUNKT 3.~~ ERLEDIGT**,
Protokoll `k5_quellen.txt`. Die beiden vorher offenen Punkte (K3-Definition, `begleitschiff` ueber
`escortCap`) sind am 26.08.2026 entschieden und gebaut.

**~~STAND 26.08.2026: NAECHSTER SCHRITT IST PUNKT 2 - DAS SPIELERMODELL ENTSTOEREN.~~
ERLEDIGT**, Protokoll `spielermodell_diagnose.txt`. Es bleibt ab
Tag 3 in einem ausgehungerten Gleichgewicht stehen (`sim13_lauf.mjs`, Protokoll Abschnitt 7);
solange das nicht von einer echten Aussage zur Startphase getrennt ist, darf keine Zahl aus dem
Lauf zitiert werden. Danach Punkt 3 (Einnahmen nach Quelle instrumentieren, sonst bleiben K5/K6
und damit Entscheidung 3 unbewertbar), dann erst die drei Profile.

**Klein und jetzt naheliegend, empfohlen als Schritt 1b:** dieselbe Verdrahtungsprobe fuer
`groupOps.js`. Das Werkzeug (`probe_verdrahtung_a.mjs`) steht, nur die Schleife ist
auszutauschen - dort haengen zusaetzlich der Koop-Aufschlag und der Beitragsanteil V2, und der
Elite-Anker ist ein anderer (`LOOT_CURVE_ELITE_CHECK_POWER`).

**~~STAND 26.08.2026 (vierte Session): ZUERST DIE WERKZEUGLUECKE SCHLIESSEN.~~ ERLEDIGT** - die
Werkzeuge wurden am selben Tag nachgereicht und vor Gebrauch auf Echtheit geprueft.
`make_messbuild_sim13.mjs` und `sim13_lauf.mjs` fehlen im Repo (Stand-Eintrag oben). Wer hier
einsteigt, prueft das als Erstes mit einem `ls` - liegen sie inzwischen dort, ist der naechste
Schritt unveraendert die Verdrahtungsprobe aus `sim13_geruest.txt` Abschnitt 8 Punkt 1. Liegen sie
nicht dort, ist vorher zu entscheiden, ob Block A neu nachgebaut wird; der methodische Vorbehalt
dazu steht im Stand-Eintrag. **Gueltig und nachgemessen bleibt:** Vorbedingung (`npm install`,
`npx tsc`), `make_messbuild_kum.mjs` und `check_build_anker.mjs` arbeiten, Eingangs-Build normiert
-1,8 %.

**STAND 25.08.2026 (zweite Session): SCHRITT 13 LAEUFT. V1 UND V2 SIND GEKLAERT, V3 LIEGT ZUR
ENTSCHEIDUNG BEIM NUTZER.** Wer hier einsteigt, liest zuerst
`balance/session2-simulation/sim_vorbedingungen_13.txt` - dort steht, was geklaert ist und was
noch fehlt. **Ohne die Entscheidung zu V3 (Umfang des Simulations-Messbuilds) wird die
Simulation nicht gebaut**, sonst misst sie einen Zustand, den es nach dem Neustart nicht gibt.

**BEIDE FRAGEN, DIE HIER OFFEN STANDEN, SIND VOM NUTZER AM 25.08.2026 ENTSCHIEDEN:**
1. **Umfang des Simulations-Messbuilds (V3): Block A Schritt 2 VERDRAHTET + Entscheidung 18 +
   Entscheidung 3 + Entscheidung 12 + Entscheidung 13.1.** Entscheidung 16 steckt bereits ueber
   `--rf=4 --evk=0.20 --evm=0.08` im kumulativen Build. NICHT enthalten: Entscheidung 19
   (unterhalb 20.000 Schiffen **gemessen** wirkungslos, siehe `volley_mission_19.txt`), R16, die
   Piratenbasen-Offensive, Block B und 7.2/7.3.
2. **Bot-Takt: 30 Bot-Zuege je Simulationsschritt.** Die teure, aber echtbetriebsnahe Variante.
   `runBotTurn()` laeuft im Echtbetrieb 30-60 Mal je Stunde; bei einem Zug je Stundenschritt
   waere die Bot-Kurve um Faktor 30-60 zu flach und Kriterium 4 sowie die Gegenpruefung von f
   waeren wertlos.

**NAECHSTER SCHRITT: den Simulations-Messbuild in genau diesem Umfang bauen** (Arbeitstitel
`make_messbuild_sim13.mjs`), gegen `check_build_anker.mjs` pruefen, dann das Simulationsgeruest.

**DANACH ERST** kommen die beiden Punkte, fuer die Schritt 13 vorgezogen wurde: Befund H aus
Entscheidung 18 (WERT der ausbaustandsabhaengigen Untergrenze) und die Gegenpruefung von f = 12.

**ERLEDIGT am 25.08.2026 (zweite Session):** der offene Punkt "macht Weg 2 die Endgame-MISSIONEN
leichter". Antwort: **ja, deutlich** - Verlust je Punkt Feindmacht -14,3 % in der groessten Zelle,
Netto mit Vorzeichenwechsel von -6,96 Mrd auf +6,75 Mrd je Mission. Siehe `volley_mission_19.txt`.
Kein Hindernis fuer den Einbau, aber die Frage, ob das gekippte Vorzeichen erwuenscht ist, gehoert
vor den Einbau auf den Tisch.

**REIHENFOLGE STEHT SEIT DEM 22.08.2026: 18 -> 19 -> 13.** Begruendung und die Messung, die sie
traegt, im Stand-Eintrag oben und in `volley_scale_19.txt`.

**ENTSCHEIDUNG 18 IST SEIT DEM 22.08.2026 KALIBRIERT** (`ESC = 1 / 1,20 / 1,60`, Bomberanteil 0,5,
`RAID_WAVE_COUNT` bleibt 12). Von den vier Fragen sind drei beantwortet: Kandidat (A, praeziser
1,60 statt 1,50), Befund G (Nein, auf Delegation) und Frage 4 (Nein). **Offen ist nur noch
Befund H.**

~~**NAECHSTER SCHRITT: ENTSCHEIDUNG 19.** Dort liegen zwei Nutzerentscheidungen: (1) `maxCount` x2
ja/nein und WORAN das zusaetzliche Limit gekoppelt wird; (2) `MULTI_TARGET_POWER_CORRECTION` unter
Weg 2.~~ **ZAHL 2 IST AM 25.08.2026 GEMESSEN UND BEANTWORTET - NEGATIV.**

~~**NAECHSTER SCHRITT: ENTSCHEIDUNG 19, ZAHL 1 (`maxCount`).**~~ **AM 25.08.2026 GEMESSEN,
EMPFEHLUNG STEHT, ZUR BESTAETIGUNG VORGELEGT.**

**ENTSCHEIDUNG 19 IST DAMIT KOMPLETT GEMESSEN.** Beide Zahlen sind beantwortet. Was noch fehlt,
ist ausschliesslich dein Ja/Nein zur Empfehlung.

**NUTZERVORGABE VOM 25.08.2026 HAT DIE ZIELRICHTUNG GEDREHT.** Die Salvenschiffe sollen
Glaskanonen sein und viel Schaden austeilen; Sterben ist eingepreist; Preis darf steigen. Das
Problem ist NICHT, dass sie frueh zu stark sind, sondern dass sie im Endgame wirkungslos
sterben. Entscheidung 19 war vorher als Eindaemmung angelegt - ab hier ist das Ziel, den
SPAETEN Beitrag zu heben, ohne den Frueh- und Mittelstand anzufassen.

**EMPFEHLUNG (auf Delegation eingetragen, umkehrbar): Weg 1 NEIN, Weg 2 JA mit
JE = 20.000 und DECKEL 8 -> 16.** Endgame-Schadensanteil 2,8 -> 11,1 % (Faktor 4,0), Fruehstand
beweisbar unveraendert, Mittelstand unveraendert, **ohne jede Preisaenderung**. maxCount bleibt
bei 150/90/30. Protokoll `balance/session2-simulation/volley_mix_19.txt`.

**WARUM WEG 1 NICHT:** maxCount x2 kostet den doppelten Bestandswert (2,76 -> 5,52 Mrd) und
bringt im Endgame nur +2,5 Punkte, hebt dafuer den Mittelstand um +18 und den Fruehstand um +10
Punkte - es wirkt am staerksten dort, wo nichts fehlt. Weg 2 dagegen ist unterhalb von rund
100.000 eigenen Schiffen BEWEISBAR wirkungslos (kein Feindtyp erreicht dort die 20.000-Schwelle,
deterministisch), und DECKEL ist innerhalb von Weg 2 der endgame-selektive Regler, waehrend JE
den ganzen Mittelbau mitzieht.

**ZWEI OFFENE NEBENFRAGEN ENTFALLEN DAMIT ERSATZLOS:** die Kopplungsfrage ("WORAN wird das
zusaetzliche Limit gekoppelt") und die ZWEI Client-Spiegel aus Messregel 8
(`ShipBuildCard.tsx`, `DefenseBuildCard.tsx`). Weg 2 hat KEINEN Client-Spiegel, er sitzt allein
in `fireShots()`.

**ABWEICHUNG VON EINER GESETZTEN ZAHL, BITTE AUSDRUECKLICH BESTAETIGEN:** am 22.08.2026 waren
"Weg 2 (JE = 20.000, DECKEL = 8) in Kombination mit Weg 1" gesetzt. Die Empfehlung weicht in
zwei Punkten ab (DECKEL 16 statt 8; ohne Weg 1), allein wegen der neuen Zielrichtung.

**ENTSCHEIDUNG 19 IST AM 25.08.2026 ENTSCHIEDEN.** Der Nutzer hat beide Punkte der Empfehlung
bestaetigt: **DECKEL 16 statt 8 - JA. Verzicht auf Weg 1 - JA.** maxCount bleibt bei 150/90/30,
Weg 2 wird mit JE = 20.000 und DECKEL = 16 gebaut. `MULTI_TARGET_POWER_CORRECTION` bleibt bei 8.
"Entschieden" heisst wie immer NICHT gebaut - Entscheidung 19 gehoert ab jetzt auf die
Sammelliste.

~~**VOR DEM EINBAU VON WEG 2 NOCH ZU PRUEFEN:** Weg 2 trifft auch
`sentinelkanone`/`ultimatekanone`.~~ **AM 25.08.2026 GEMESSEN UND GEKLAERT**, Protokoll
`balance/session2-simulation/volley_def_19.txt`. Nutzerhinweis war richtig, die beiden Anlagen
stehen ebenfalls in `MULTI_TARGET_VOLLEY_SHIPS`. Ergebnis, dreifach abgesichert:
- **Die Kalibrierung von Entscheidung 18 ist NICHT betroffen.** In der Kalibrierzelle bleibt der
  groesste Feindstapel auch in der haertesten Eskalationsphase bei 14.757 und damit unter der
  20.000-Schwelle: `ceil(14.757 / 20.000) = 1`. Das gilt fuer JEDEN Deckelwert, ist Arithmetik
  und braucht keine Serien. Die Messung bestaetigt es (12,0 gegen 12,0 gewonnene Wellen).
- **Die Spezialverteidigung hat dasselbe Problem wie die Schiffe, und Weg 2 loest es im selben
  Mass:** Endgame-Schadensanteil 1,08 -> 4,39 %, Faktor 4,1 gegen Faktor 4,0 bei den Schiffen.
  Kein separater Regler und keine Ausnahme noetig.
- **Der Raid-Ausgang verschiebt sich nicht.** Der hoehere Beitrag der beiden Anlagen ERSETZT
  Schaden, den sonst andere Einheiten getragen haetten. Die offene Frage aus Entscheidung 16
  wird dadurch nicht verschaerft.

**LETZTER UNGEMESSENER PUNKT AN ENTSCHEIDUNG 19:** ob Weg 2 die Endgame-MISSIONEN merklich
leichter macht. Der Gesamtschaden der eigenen Seite steigt um rund 9 % - wenig, aber unbelegt.
Werkzeug dafuer liegt bereit (`run_volley_power_19.mjs aequiv`, Endgame-Zelle). Kein Hindernis
fuer den Einbau, aber vor der 30-Tage-Simulation (Schritt 13) nachzuholen, weil dort die
Ertragsseite haengt.

**DIE SAMMELLISTE UMFASST JETZT NEUN PAKETE** (vorher acht): zusaetzlich Entscheidung 19
(Weg 2, JE = 20.000, DECKEL = 16, KEINE maxCount-Aenderung, KEINE Aenderung an
`MULTI_TARGET_POWER_CORRECTION`). Messregel 8 dazu: Weg 2 hat **keinen** Client-Spiegel, er
sitzt allein in `fireShots()`.

**NAECHSTER SCHRITT: SCHRITT 13, DIE 30-TAGE-FORTSCHRITTSSIMULATION.** Die Reihenfolge
18 -> 19 -> 13 ist damit abgearbeitet bis auf 13. Danach laesst sich auch Befund H aus
Entscheidung 18 (Wert der ausbaustandsabhaengigen Untergrenze) endlich kalibrieren - die FORM
gehoert zu 18, der WERT braucht die Entwicklungskurve aus 13.

**ZAHL 2 - `MULTI_TARGET_POWER_CORRECTION` - IST ERLEDIGT.** Protokoll
`balance/session2-simulation/volley_power_19.txt`, Messkasten vom 25.08.2026 bei Entscheidung 19.
Kurzfassung: die Konstante ist kein brauchbarer Regler. Sie hebt die bemessene Macht um +11,06 %
(5.235 Schiffe) bis **+0,06 %** (Endgame) - an dem Ende, an dem Weg 2 wirkt, wirkt sie also gar
nicht. Von Korrektur 1 bis 100 macht ein HOEHERER Wert die Salvenflotte messbar BESSER (Netto
1,286 -> 1,334 -> 1,604 Mrd), weil die Beute mit der Gegnerstaerke schneller waechst als die
Verluste. Der eigentliche Abstand (+76 % gegen eine wertgleiche Flotte ohne Salvenschiffe, z etwa
5) sitzt auf der VERLUSTSEITE und ist ueber die Machtbemessung nicht erreichbar.
**Vorlage, noch offen: bei 8 belassen und nicht weiter kalibrieren.** Die Sorge "ein fester Faktor
kann an beiden Enden nicht stimmen" ist damit gegenstandslos.

**ZWEI KORREKTUREN AM PLAN, AM 25.08.2026 AUS DEM CODE:**
1. `MULTI_TARGET_POWER_CORRECTION` **erreicht den Raid nicht.** `raids.ts` Z. 333-343 bildet
   `combinedPower` inline ueber `baseStats()` ohne die Konstante. Die gegenteilige Aussage im
   Stand-Eintrag vom 22.08.2026 und in `volley_scale_19.txt` Abschnitt 3 Punkt 4 ist gestrichen.
   Die Messungen sind unberuehrt (`run_raid.mjs` repliziert den Inline-Pfad korrekt).
   **Folge: Zahl 2 war von Entscheidung 18 vollstaendig entkoppelt** - ESC = 1 / 1,20 / 1,60 und
   der Bomberanteil 0,5 sind durch nichts davon beruehrt.
2. **Raids laufen zwei Mal woechentlich**, nicht vier Mal taeglich (`RAID_SCHEDULE_BY_USERNAME`:
   Mittwoch und Sonntag 00:00, Chance 1,0 fuer die beiden eingetragenen Spieler; Fallback
   `RAID_SPAWN_CHANCE` 0,7). Die alte README-Aussage ist ueberholt und darf nicht als
   Rechengrundlage benutzt werden.

**NUTZERHINWEIS VOM 25.08.2026, NACHGEMESSEN:** "Salvenschiffe sterben am Raid-Tag, in einer
Angriffswelle zur Haelfte weg." Bestaetigt und staerker: Salven-Verlust je Raid 0,0 % / 0,8 % /
77,8 % / 89,3 % / **100,0 %** ueber die fuenf Ausbaustaende. **Wirtschaftlich ist das trotzdem
klein:** vollstaendiger Nachbau 2,760 Mrd, zwei Raids die Woche = 0,79 Mrd/Tag gegen 61,11 Mrd/Tag
Baseline = **1,3 %**. Und es ist umgehbar: `HOME_DEFENSE_SHIP_IDS` zieht nur Schiffe in
`state.fleet` heran - eine dauerhaft auf Mission gehaltene Staffel traegt gar keine Raid-Kosten.
Der Raid hebt den +76-%-Vorteil also nicht auf.

**BEFUND H BLEIBT LIEGEN, UND ZWAR ABSICHTLICH.** Die FORM der ausbaustandsabhaengigen Untergrenze
gehoert zu 18, ihr WERT laesst sich erst gegen die Entwicklungskurve aus Schritt 13 kalibrieren.
Wer H frueher setzt, setzt eine Zahl ohne Massstab.

**EINE FRAGE STAND URSPRUENGLICH VIERFACH BEIM NUTZER, ALLE ZU ENTSCHEIDUNG 18** (drei davon am
22.08.2026 erledigt, hier zur Nachvollziehbarkeit erhalten):
1. **Welcher Eskalations-Kandidat** - A (haerter, nicht verlierbar), C (Mittelweg) oder B
   (deutlich verlierbar)? Empfehlung: A als erster Schritt.
2. **Befund G:** soll der Kampf-Booster ueber Sieg und Niederlage entscheiden duerfen? In allen
   drei Kandidaten kippt "voll ohne Kampf-Boost" als erster entwickelter Stand.
3. **Befund H:** welche ausbaustandsabhaengige Untergrenze schuetzt schwach ausgebaute Konten? Der
   Neulingsschutz aus Entscheidung 10 ist zeitbasiert und greift dafuer nicht.
4. **`RAID_WAVE_COUNT` 12 -> 18 zusaetzlich**, oder reicht die Eskalation?

`RAID_WAVE_ROLL` bleibt unangetastet und wird durch die Eskalation nicht mehr gebraucht - die alte
Gate-Frage ist gegenstandslos.
Die Zahl f aus 13.1 ist auf Delegation mit 12 eingetragen und umkehrbar - keine offene Frage mehr,
aber eine, die der Nutzer jederzeit anders entscheiden kann.

**VOR DEM EINBAU VON ENTSCHEIDUNG 16 ZU KLAEREN, NEU AM 21.08.2026:** Klassen-RapidFire macht
Verteidigungsanlagen im Raid praktisch unzerstoerbar (Stand mittel 21,6 % -> 0,0 %
Verteidigungsverlust). Verteidigung wird damit faktisch kostenlos, und die Kopplung der
Verteidigungswerte an die Kosteneffizienz der Schiffe stimmt nicht mehr. Entscheidung 16 ist
kalibriert und ungebaut - der beste Zeitpunkt ist jetzt.

~~**Naechster Messschritt, wenn die Gate-Frage beantwortet ist:** Entscheidung 18, Schritt 2
und Schritt 3.~~ **ERLEDIGT AM 22.08.2026** - beide Schritte sind gemessen, das Ergebnis steht im
Messkasten bei Entscheidung 18 und im Stand-Eintrag oben. `RAID_WAVE_COUNT` bleibt bei 12; die
alte Haerte-Empfehlung 18 ist mit Zahlen verworfen (sie reisst Abnahmekriterium 1 der
30-Tage-Simulation im Mittel und hebt den flachen Container-Topf um 50 %).

**Block C ist seit dem 21.08.2026 vollstaendig.** Schritt 12 (Entscheidung 13.1 + 13.2) ist
erledigt: 13.1 kalibriert bis auf die Zahl f, 13.2 ohne Messung entschieden, beides nicht gebaut.
**Danach folgt Schritt 13: die 30-Tage-Fortschrittssimulation** (Abschnitt 1b). Wer sie baut, liest
zuerst den Messkasten bei Entscheidung 12 UND den bei Entscheidung 13 - dort steht, dass das
Bot-Verhalten ueber 30 Tage der einzige noch offene Nachweis fuer 13.1 ist und dass 13.4 dabei
mitgeprueft werden muss.

**Die Sammelliste fuer den Einbau umfasst seit dem 22.08.2026 ACHT Pakete** (Block A Schritt 2,
Block B, Entscheidung 3, 16, 12, 7.2/7.3, 13.1/13.2 und neu Entscheidung 18), dazu R16 und die
Abschaltung der Piratenbasen-Offensive aus Entscheidung 17. Entscheidung 19 ist gemessen, aber
noch nicht entschieden und zaehlt deshalb NICHT mit. Wer die Liste zusammenstellt, faengt bei den
Messkaesten am Kopf von Entscheidung 2, 3, 4, 7, 12, 13, 16, 17 und 18 an.

**Entscheidung 12 (Schritt 11) ist ERLEDIGT im Sinne dieses Plans: entschieden, kalibriert,
gegengemessen - und wie alles andere nicht gebaut.** `NOVICE_BONUS_ADD = 2,0`, Fenster-Empfehlung
14 Tage (an `NEWCOMER_GRACE_MS` koppeln). Nichts daran ist mehr offen; wer sie anfasst, baut sie
nur noch ein (Bauanleitung im Messkasten bei Entscheidung 12, Protokoll `novice_bonus.txt`).

**Damit ist KEIN reset-blockierender Punkt mehr offen.** Abschnitt 5 nannte 10 und 12; 10 ist
gebaut, 12 ist kalibriert. Alles Weitere ist im Nachhinein korrigierbar.

**Offen in Block C ist nur noch Schritt 12 (Entscheidung 13.1 + 13.2).** Schritt 9
(Allianz-Station) ist am 20.08.2026 erledigt: 7.2 und 7.3 kalibriert, 7.4 nach Block D Schritt 14
herausgeloest, `STATION_MINING_COMPENSATION` bei 3 bestaetigt. 13.1 braucht die Koeffizienten aus
Entscheidung 2 - die stehen, Block A ist kalibriert.
Danach kommt Schritt 13, die 30-Tage-Fortschrittssimulation.

**Wer die Simulation baut, liest ZUERST den Messkasten bei Entscheidung 12 und Kriterium 5 in
Abschnitt 1b.** Zwei Dinge sind dort geregelt, die den Bau betreffen:
1. **Abnahmekriterium 5 ist seit dem 20.08.2026 umgestellt** - die 50 % gelten unveraendert
   weiter, sie zeigen jetzt aber auf Entscheidung 3 (Raid-Ertrag) und die Solo-Startphase, nicht
   mehr auf den Frischling-Bonus. Wer den ersten Simulationslauf gegen die alte Zuordnung
   fuehrt, sucht den Fehler an der falschen Stelle.
2. **Vorbedingung V2 ist in der Praxis geloest, nur nicht im Plantext.** `run_income_level.mjs`,
   `run_income_baseline_v2.mjs` und jetzt `run_novice_bonus.mjs` kopieren `dist` in ein
   Temp-Verzeichnis und verlinken `node_modules` - die Wegwerf-Datenbank landet dort. Der
   Eingriff in `db.ts` (Env-Override) wird dafuer nicht gebraucht. V1 (Zeitquelle) bleibt offen;
   fuer eine EINZELNE Funktion laesst sich `Date.now` punktuell umbiegen (in
   `run_novice_bonus.mjs` gemacht, um Wochentage gezielt zu rechnen), fuer 720 Schritte ueber
   den ganzen Zustandsapparat ist das nicht dasselbe.

**Was beim naechsten Mal ZUERST zu pruefen ist:** wie viel im Plan inzwischen den Zustand
"entschieden und kalibriert, aber nicht gebaut" hat. Das sind mittlerweile **VIER Pakete**:
Block A Schritt 2, der gesamte Block B, Entscheidung 16 und - seit dem 20.08.2026 als solches
erkannt - **Entscheidung 3 (Raid-Ertrag)**. Dazu kommen **Entscheidung 12** und seit dem
20.08.2026 **Entscheidung 7.2/7.3**, beide kalibriert und ungebaut. Sie gehen alle gleichzeitig
live. **Die Sammelliste fuer den Einbau umfasst damit sechs Posten, nicht vier** - wer sie
zusammenstellt, faengt bei den Messkaesten am Kopf von Entscheidung 2, 3, 4, 7, 12 und 16 an.
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

**`run_station.mjs` ist veraltet und wird nicht mehr fortgeschrieben.** Es kennt
`STATION_MINING_COMPENSATION` nicht (rechnet 1,88 statt 7,90 Mrd/Tag), nutzt die alte
1,5x/2,5x-Ertragsrelation aus der Zeit vor 7.1 und vergleicht gegen die aufgegebene Baseline von
21,69 Mrd/Tag. Wer Stations-Zahlen braucht, nimmt **`run_station_v2.mjs`**; die alte Datei bleibt
nur als historisches Protokoll liegen. Dasselbe gilt fuer `station.txt` gegen `station_v2.txt`.

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
