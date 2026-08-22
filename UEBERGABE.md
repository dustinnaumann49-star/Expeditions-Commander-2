# Uebergabe - Stand 20.08.2026

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

## Erster Schritt beim naechsten Mal

**VIER FRAGEN STEHEN BEIM NUTZER, ALLE ZU ENTSCHEIDUNG 18:**
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

**Naechster Messschritt, wenn die Gate-Frage beantwortet ist:** Entscheidung 18, Schritt 2
(Kriterium festlegen) und Schritt 3 (kalibrieren gegen alle fuenf Faelle). Faellt die Antwort
"bleibt gesperrt", entfaellt Schritt 2 und es bleibt bei der Haerte-Empfehlung
`RAID_WAVE_COUNT` = 18, die dann nur noch gegen Entscheidung 3 gegenzupruefen ist.

**Block C ist seit dem 21.08.2026 vollstaendig.** Schritt 12 (Entscheidung 13.1 + 13.2) ist
erledigt: 13.1 kalibriert bis auf die Zahl f, 13.2 ohne Messung entschieden, beides nicht gebaut.
**Danach folgt Schritt 13: die 30-Tage-Fortschrittssimulation** (Abschnitt 1b). Wer sie baut, liest
zuerst den Messkasten bei Entscheidung 12 UND den bei Entscheidung 13 - dort steht, dass das
Bot-Verhalten ueber 30 Tage der einzige noch offene Nachweis fuer 13.1 ist und dass 13.4 dabei
mitgeprueft werden muss.

**Die Sammelliste fuer den Einbau umfasst jetzt SIEBEN Pakete, nicht sechs** - neu dazu
13.1/13.2. Dazu kommen zwei Abschaltungen bzw. Aenderungen aus Entscheidung 17/18, sobald sie
entschieden sind. Wer die Liste zusammenstellt, faengt bei den Messkaesten am Kopf von
Entscheidung 2, 3, 4, 7, 12, 13, 16, 17 und 18 an, dazu R16.

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
