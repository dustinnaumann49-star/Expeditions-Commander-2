export interface ChangelogEntry {
  date: string; // Anzeigeformat TT.MM.JJJJ
  title: string;
  changes: string[];
}

// Neueste Eintraege oben - die Updates-Seite (client/src/pages/Updates.tsx) zeigt sie in genau
// dieser Reihenfolge an. Formuliert fuer SPIELER (nicht als Entwickler-Dokumentation) - was hat
// sich fuers Spielgefuehl geaendert, nicht wie es technisch umgesetzt wurde.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '12.08.2026',
    title: 'Server-Last deutlich gesenkt',
    changes: [
      'Bei jeder Zustandsabfrage des Spiels - also alle drei Sekunden pro geöffnetem Fenster - hat der Server bisher die Spielstände aller anderen Spieler geladen und durchgesehen, um fällige Raids und Gruppen-Expeditionen nachzuholen. Das war der Hauptverursacher der Rechenlast und ist jetzt auf höchstens einen Durchlauf alle 30 Sekunden begrenzt. Am Spielgeschehen ändert sich nichts: Raids und Expeditionen werden ohnehin zusätzlich im Zwei-Minuten-Takt geprüft.',
    ],
  },
  {
    date: '12.08.2026',
    title: 'Piratenbasen können wieder unbegrenzt wachsen',
    changes: [
      'Piratenbasen hatten eine versteckte Ausbaugrenze: Ihr Ressourcenlager war gedeckelt, wodurch jedes Gebäude, das mehr kostete als der Deckel hergab, für sie nie bezahlbar wurde. Der Ausbau wäre bei Metallmine 22, Kristallmine 20 und Nanitenfabrik 6 endgültig stehengeblieben - danach wäre wieder alles nur noch in Verteidigungsanlagen geflossen.',
      'Der Deckel war ursprünglich nur zur Begrenzung der Beute gedacht und begrenzt jetzt auch nur noch die. An der Beute ändert sich dadurch nichts: Ein vollständiger Beutezug bringt weiterhin höchstens 15,4 Mio Metall, 7 Mio Kristall und 2,1 Mio Deuterium, egal wie reich die Basis darüber hinaus wird. Die Basen bauen nun aber dauerhaft weiter aus, genau wie Spieler und KI-Mitspieler.',
    ],
  },
  {
    date: '12.08.2026',
    title: 'KI-Mitspieler und Piratenbasen entwickeln sich wieder',
    changes: [
      'KI-Vega und KI-Nyx steckten seit knapp zwei Wochen fest: Sie hingen bei Minenstufe 11 und hatten seit dem 30. Juli kein einziges Gebäude und keine Forschung mehr gestartet. Der Grund war eine Sparfalle - die KI gab bei jedem Zug ihr letztes Metall für die billigste Verteidigungsanlage aus und konnte dadurch nie genug für den nächsten Minenausbau ansammeln, der ein Vielfaches kostet. Sichtbar wurde das an KI-Nyx: 8.614 Leichte Lasergeschütze bei gleichzeitig unter 40.000 Metall und randvollen Kristall- und Deuteriumlagern.',
      'Behoben: Die KI legt jetzt zurück, was der nächste Gebäude- oder Forschungsschritt kostet, bevor sie Schiffe oder Verteidigung baut. Piratenbasen nutzen dieselbe Logik und waren genauso betroffen - eine beobachtete Basis hatte 20.112 Leichte Lasergeschütze angehäuft, gestartet war sie mit 1.120. Ihre Zusammensetzung wird sich dadurch spürbar verändern: weniger billige Massengeschütze, dafür höhere Minen, mehr Forschung und eine gemischtere Verteidigung.',
    ],
  },
  {
    date: '11.08.2026',
    title: 'Klassen ausbalanciert, Flottenlimit auf 1 Million',
    changes: [
      'Die drei Klassen sind neu ausbalanciert worden und haben jetzt jeweils ein eigenes Einsatzgebiet. Eine Messung unter identischen Bedingungen hatte gezeigt, dass der Kanonier bisher in JEDER Situation die beste Wahl war - auch bei der Heimatverteidigung, wo eigentlich das Bollwerk vorne liegen sollte. Grund ist die Natur des Kampfsystems: wer schneller tötet, kassiert weniger Runden Rückfeuer, während mehr Schild und Panzerung den Kampf verlängern und damit auch die Zeit unter Beschuss.',
      'Neu ist, dass beide Spezialisten auf ihrem Heimatfeld einen Aufschlag bekommen, überall sonst aber weiter ihren Grundbonus behalten - keine Klasse ist irgendwo wirkungslos. Kanonier: +100% Waffenschaden, bei Missionen, Events und Expeditionen +140%. Bollwerk: +60% Schild und Panzerung, bei der Verteidigung der eigenen Basis +140% - das gilt auch, wenn man als Verstärker einem anderen Spieler zu Hilfe kommt. Kommandant: +40% auf alle drei Werte, ohne Aufschlag; er ist bewusst überall zweiter und nirgends letzter.',
      'Ergebnis: Über eine typische Woche gerechnet liegen alle drei gleichauf, die Profile unterscheiden sich aber deutlich. Der Kanonier beendet Kämpfe in rund einem Drittel der Runden, das Bollwerk verliert bei Raids mit Abstand am wenigsten und am gleichmäßigsten und büßt praktisch keine Verteidigungsanlagen ein, der Kommandant liegt überall dazwischen.',
      'Das Flottenlimit steigt von 200.000 auf 1.000.000 Schiffe. Hintergrund: die Kampf-Engine fasst große Stapel zusammen, ihre Rechenzeit hängt deshalb nur noch von der Anzahl verschiedener Schiffstypen ab und nicht mehr von der Stückzahl - bestätigt bis 1,5 Millionen Schiffen. Das Limit bleibt als reines Sicherheitsnetz bestehen, liegt jetzt aber weit oberhalb allem, was im Spiel praktisch vorkommt.',
      'Das Flottenlimit zählt jetzt auch Schiffe mit, die gerade auf einer Mission, in einer Galaxie-Entsendung oder in einer gemeinsamen Expedition unterwegs sind. Vorher zählte nur, was zuhause stand - dadurch ließ sich das Limit unbeabsichtigt überschreiten, indem man die Flotte wegschickte und zuhause nachbaute. Wer dadurch aktuell über dem Limit liegt, wird NICHT ausgesperrt: es gilt vorübergehend eine persönliche Obergrenze, die sich automatisch auf den Normalwert zurückzieht, sobald die Flotte kleiner wird.',
      'Der Anteil an NPC-Verteidigungsanlagen in Piraten-Sektoren stand an drei Stellen im Code getrennt und war bereits leicht auseinandergelaufen. Jetzt gibt es nur noch eine Quelle - Kampfsimulator, Solo-Missionen und gemeinsame Expeditionen rechnen garantiert mit denselben Werten. An den tatsächlichen Werten ändert sich nichts.',
    ],
  },
  {
    date: '10.08.2026',
    title: 'Wichtig: Große Flotten werden nicht mehr komplett vernichtet',
    changes: [
      'Ab einer bestimmten Stapelgröße rechnet die Kampf-Engine gebündelt statt Schiff für Schiff - das ist eine reine Geschwindigkeits-Optimierung und sollte am Ergebnis nichts ändern. Sie tat es aber: ein einzelner sehr starker Treffer (z.B. vom Piratenadmiral) konnte in diesem Modus hunderte Schiffe auf einmal auslöschen, statt wie sonst nur eines. Dadurch überstanden 99 Kreuzer einen Kampf mit rund 42% Verlust, während 101 Kreuzer restlos vernichtet wurden. Ein einziges Schiff mehr kippte den Ausgang. Behoben - ein Treffer richtet jetzt in beiden Modi denselben Schaden an, und große Flotten verlieren wieder anteilig weniger statt alles.',
      'Die Schwierigkeit der Sektoren ist davon praktisch unberührt geblieben (nachgemessen über alle Stufen und Flottenprofile) - betroffen waren fast nur Boss-Gegner gegen sehr große Flotten.',
      'Allianz-Station: Die Minen produzieren deutlich mehr. Die Station ist bewusst nicht an die Forschung einzelner Mitglieder gekoppelt - dieser Nachteil war aber nie ausgeglichen worden, wodurch sie bei gleicher Ausbaustufe nur ein Sechstel der Heimatbasis lieferte. Zusätzlich liefern die Ausbaustufen V2 und V3 jetzt doppelten bzw. vierfachen Ertrag statt anderthalbfachen bzw. zweieinhalbfachen - passend zu ihren doppelten bzw. vierfachen Kosten. Vorher war jede Ausbaustufe unwirtschaftlicher als die vorherige.',
      'Heimatbasis: Die Gebäude-Module gab es bisher nur für die V1-Stufen. Für V2- und V3-Gebäude fehlten sie komplett - ohne Fehlermeldung, sie wirkten einfach nicht. Dadurch bauten V2/V3-Gebäude rund viermal langsamer als ein gleich ausgebautes V1, und Fördereffizienz sowie Energiesparmodul blieben dort wirkungslos. Jetzt für alle drei Stufen vorhanden.',
      'Schrotthändler: Der erstattete Betrag wird jetzt auch von der Punktebasis abgezogen. Vorher ließen sich durch wiederholtes Bauen und Verschrotten aus derselben Ressourcenmenge rund 43% mehr Punkte erzeugen.',
    ],
  },
  {
    date: '06.08.2026',
    title: 'Feature: Aktuelle Erträge/Belohnungen direkt im Sektor sichtbar',
    changes: [
      'Asteroiden-Feld- und Piraten-Sektor-Karten zeigen jetzt zusätzlich den WIRKLICH aktuell geltenden Wert an - inklusive Forschung, Wirtschafts-Klasse, Frischling-Bonus und dem wöchentlichen Event-Bonus. Vorher stand dort immer nur der Basiswert, auch an Bonus-Tagen.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Fix: Elite-Bollwerk-Belohnung im Kampfbericht korrekt angezeigt',
    changes: [
      'Die "Belohnungen"-Anzeige im Elite-Bollwerk-Kampfbericht zeigte fälschlich immer die unskalierten Basiswerte (25M/15M/10M) an, statt der tatsächlich gutgeschriebenen Menge inklusive Sieg-Serie-Bonus und dem zusätzlichen Ressourcen-Bonus. Die tatsächliche Gutschrift war davon nicht betroffen - reiner Anzeigefehler, jetzt behoben.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Feature: Teile beim Schrotthändler in Ressourcen umwandeln',
    changes: [
      'Waffen-/Schild-/Panzerungs-Teile aus Piraten-Sektor/Elite-Bollwerk/Containern hatten bisher nur einen einzigen Nutzen: den Bau des Imperators (maximal 6 Stück). Überschüssige Teile stapelten sich danach nutzlos. Beim Schrotthändler gibt es jetzt eine neue Sektion "Teile umwandeln" - jedes Teil lässt sich in Metall/Kristall/Deuterium umwandeln (verlustbehaftet, kein 1:1-Tausch, ähnlich der bestehenden Schiffs-/Verteidigungs-Verschrottung).',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Feature: Wöchentlicher Event-Kalender',
    changes: [
      'Neuer fester Wochenrhythmus mit automatischen, kostenlosen Bonus-Tagen für alle Spieler: Montag+Freitag +100% Belohnung im Piraten-Sektor (Niedrig/Mittel/Hoch), Dienstag+Donnerstag +100% Ressourcen im Asteroiden-Feld, Mittwoch+Sonntag Raid-Event (jetzt 2x statt 1x pro Woche), Samstag kostenloser Bauzeit-Bonus für Schiffe/Verteidigung/Gebäude/Forschung.',
      'Der heute aktive Bonus wird jetzt oben auf der Sektor- und Shop-Seite angezeigt.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Fix: Elite-Bollwerk-Belohnung in frühen Checks angehoben',
    changes: [
      'Live-Auswertung mehrerer echter Expeditionen zeigte: die üblichen Flottenverluste im Elite-Bollwerk kosteten beim Wiederaufbau deutlich mehr Ressourcen, als die Expedition einbrachte - vor allem in den ersten Checks, bevor sich der Sieg-Serie-Bonus aufgebaut hat. Es gibt jetzt zusätzlich zur bestehenden (mit der Serie eskalierenden) Beute einen festen Ressourcen-Bonus pro gewonnenem Check, der gerade die frühen, noch nicht eskalierten Checks spürbar aufwertet.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Feature: V2/V3-Gebäudestufen für die Heimatbasis',
    changes: [
      'Metallmine, Kristallmine, Deuterium-Synthetisierer, Solarkraftwerk, Roboterfabrik und Nanitenfabrik bekommen jetzt zwei weitere Ausbaustufen (V2/V3) - jede mit höherem Basisertrag, aber auch höheren Kosten/Bauzeiten (V2: 2x Kosten/1,3x Bauzeit/1,5x Ertrag, V3: 4x/1,6x/2,5x, jeweils relativ zu V1). Gedacht für alle, die bei V1 schon sehr hohe Stufen erreicht haben und dort kaum noch spürbaren Fortschritt sehen.',
      'V2 schaltet sich frei, sobald Metallmine, Kristallmine und Deuterium-Synthetisierer (V1) die Stufen 36/32/30 erreicht haben. V3 entsprechend, sobald die V2-Minen dieselben Stufen erreichen. Wie schon V1 bleiben auch V2 und V3 unbegrenzt ausbaubar - nur die Schiffs-/Verteidigungsmodule bleiben weiterhin bei Stufe 10 gedeckelt.',
      'Produktion aller freigeschalteten Stufen zählt zusammen, aber Energie (Solarkraftwerk) und Bau-Beschleunigung (Roboterfabrik/Nanitenfabrik) wirken pro Stufe getrennt - ein spät gebautes V3-Solarkraftwerk versorgt nicht rückwirkend V1/V2-Minen mit Energie.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Fix: Feindstärke in Piraten-Sektor Hoch und Elite-Bollwerk gesenkt',
    changes: [
      'Zwei Ursachen dafür gefunden, dass die Verteidigungsanlagen der Piraten in Piraten-Sektor Hoch und Elite-Bollwerk trotz hohem ausgeteiltem Schaden praktisch unzerstörbar wirkten: Erstens hatten alle Verteidigungsanlagen (vom günstigen Raketenwerfer bis zur teuren Plasmawerfer) denselben sehr hohen Schild-Regenerationswert - jetzt nach Anlagen-Tier gestaffelt, wie es bei Schiffen schon der Fall war. Zweitens spawnte an diesen beiden Stufen einfach zu viel Verteidigung auf einmal - die Menge wurde jetzt gesenkt.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Feature: Angewandte Feindstärke im Kampfbericht sichtbar',
    changes: [
      'Piraten-Sektor-, Elite-Bollwerk-, Piratenadmiral- und Raid-Berichte zeigen jetzt an, welche Feindstärke (in % der eigenen Flottenmacht) bei diesem Check tatsächlich gewürfelt wurde - bisher stand dort nur "Normale Welle", egal ob der leichte, mittlere oder harte der drei möglichen Werte getroffen wurde. Damit lässt sich im Nachhinein nachvollziehen, ob ein Kampf schlicht Pech mit der Würfelung war.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Fix: Elite-Bollwerk benachteiligte schwächer ausgebaute Mitspieler',
    changes: [
      'Im Elite-Bollwerk wurden die Piraten bisher auf den Forschungs-DURCHSCHNITT aller Teilnehmer hochskaliert - dadurch kämpfte, wer in der Gruppe weniger Forschung hatte, gegen Gegner, die stärker waren als der eigene Ausbau, während besser ausgebaute Mitspieler entsprechend im Vorteil waren. Live-Berichte zeigten dadurch etwa doppelt so hohe Flottenverluste für den schwächer ausgebauten Teilnehmer. Die Piraten orientieren sich jetzt am NIEDRIGSTEN Forschungsstand der Gruppe - niemand kämpft dadurch mehr schlechter, als er es auch alleine tun würde, wer besser ausgebaut ist profitiert weiterhin voll von seinem Vorsprung.',
    ],
  },
  {
    date: '05.08.2026',
    title: 'Fix: Gegnerstärke in allen Piraten-Sektoren korrigiert',
    changes: [
      'Beim letzten Kampf-Update wurde die Gegnerstärke im Piraten-Sektor Hoch und im Elite-Bollwerk versehentlich zu hoch angesetzt - Spielertests zeigten Totalverluste der eigenen Flotte selbst bei gut ausgebauter Forschung und Modulen. Die Gegnerstärke wurde in beiden Sektoren jetzt spürbar gesenkt, sodass sie wieder eine faire Siegchance bieten, ohne die Herausforderung komplett zu verlieren.',
      'Dabei ist aufgefallen, dass Piraten-Sektor Hoch danach leichter war als Mittel - das ist jetzt auch behoben, Niedrig und Mittel wurden passend mit abgesenkt. Die Schwierigkeit steigt jetzt wieder sauber von Niedrig über Mittel und Hoch bis zum Elite-Bollwerk als schwerster Stufe.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Fix: Fehlende Nachricht bei Totalverlust der Flotte',
    changes: [
      'Ein Nutzer meldete: komplette Flotte im Piraten-Sektor Hoch verloren, aber keinerlei Nachricht/Kampfbericht erhalten. Ursache: ein Fehler bei einem einzelnen Kampf-Check konnte in seltenen Fällen die komplette Verarbeitung abbrechen, bevor der bereits erstellte Bericht gespeichert wurde - er ging dadurch spurlos verloren. Fehler bei einer Mission wirken sich jetzt nicht mehr auf andere Missionen oder bereits erstellte Nachrichten aus.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Feature: Elite-Bollwerk/Piratenadmiral starten automatisch',
    changes: [
      'Gemeinsame Expeditionen (Elite-Bollwerk, Piratenadmiral) mussten bisher immer manuell vom Ersteller per "Jetzt starten" losgeschickt werden - selbst wenn alle eingeladenen Flotten längst eingetroffen waren. Sobald alle Eingeladenen geantwortet haben und ihre Flotten bei dir angekommen sind, startet der gemeinsame Weiterflug jetzt automatisch, auch wenn du gerade nicht online bist.',
      'Der "Jetzt starten"-Button bleibt weiterhin verfügbar, falls du schon vorher loslegen willst (z.B. wenn jemand nicht mehr antwortet).',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Feature: Frischling-Bonus für neue Accounts',
    changes: [
      'Jeder neue Account bekommt in den ersten 7 Tagen nach der Registrierung automatisch das 3-fache an Ressourcen beim Asteroiden-Mining - kein Kauf, keine Aktivierung nötig, gilt einfach für alle Mining-Schiffe. Solange der Bonus aktiv ist, zeigt ein Hinweis auf der Sektor-Seite an, wie viel Zeit noch bleibt.',
      'Gedacht als Starthilfe, damit man den wirtschaftlichen Rückstand gegenüber länger aktiven Mitspielern schneller aufholen kann - gilt für jeden neuen Account, nicht nur einmalig bei einem eventuellen Server-Neustart.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Fix: Flottenauswahl auf Galaxie-Seite vereinheitlicht',
    changes: [
      'Die Flottenauswahl beim Angriff auf Piratenbasen, bei Spionagesonden, beim Bergen von Galaxie-Ereignissen und beim Flotte-Halten bei Mitspielern nutzte noch die alte Button-Reihe statt des neuen Eingabefelds + "Alle"-Button, das schon bei Missionen und Gruppen-Expeditionen eingeführt wurde. Jetzt einheitlich überall dasselbe Eingabefeld.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Fix: Kampfberichte auf dem Handy unlesbar',
    changes: [
      'Die Tabellen in den Kampfberichten (Schaden, Verluste, Schild-Werte je Schiffstyp) quetschten sich auf schmalen Handy-Bildschirmen bis zur Unlesbarkeit zusammen. Sie lassen sich jetzt bei Bedarf seitlich durchscrollen, statt gestaucht zu werden - auf dem Desktop ändert sich dadurch nichts.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Statistik komplett überarbeitet',
    changes: [
      'Die Statistik-Seite zeigt jetzt nur noch drei Werte, die auch wirklich in die Punktzahl einfließen: Schiff/Verteidigungs-Punkte, Forschungs/Gebäude-Punkte und zerstörte Piraten. Alle anderen Zähler (Piraten-Sektor-Siege, Elite-Bollwerk-Checks, Raid-Abwehr, Container, erbeutete Ressourcen, eigene Verluste, Asteroiden-Einsätze) sind raus - sie trugen ohnehin kaum oder gar nicht zur Punktzahl bei und machten die Seite nur unübersichtlich.',
      'Schiff/Verteidigungs-Punkte und Forschungs/Gebäude-Punkte sind neu: sie messen, wie viele Ressourcen insgesamt in Schiffe/Verteidigung bzw. Forschung/Gebäude investiert wurden - und sinken NIE, auch nicht nach Verlusten im Kampf. Die alte "Gesamtmacht"-Punktzahl (aktueller Flottenbestand, sank bei jedem Verlust) fällt damit komplett weg.',
      'Da diese Ausgaben-Statistik neu eingeführt wurde, starten alle Spieler bei diesen zwei Kategorien bei 0 - vergangene Investitionen lassen sich leider nicht rückwirkend erfassen. Zerstörte Piraten bleiben davon unberührt und zählen wie gewohnt weiter.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Feature: Bonus-Aufschlüsselung bei Waffen/Schild/Panzerung',
    changes: [
      'Auf den Bau-Karten (Schiffe, Verteidigung, Imperator) zeigt der grün hervorgehobene Effektivwert von Waffen/Schild/Panzerung jetzt beim Drüberfahren mit der Maus (oder Antippen auf dem Handy) genau auf, welche einzelnen Boni ihn zusammensetzen - Forschung, Klassen-Bonus, Schiffs-/Verteidigungs-Modul und aktiver Kampf-Booster, jeweils mit dem Prozentsatz.',
      'Dabei aufgefallen und behoben: der aktive Kampf-Booster wurde bei der Anzeige des Effektivwerts noch mit dem alten Bonus (+20%) statt dem aktuellen (+35%) berechnet - reiner Anzeigefehler, im tatsächlichen Kampf war der Booster immer korrekt mit +35% wirksam.',
      'Fix (Nutzer-Fund): das Popup verschwand teils bei der Panzerung, weil es dort über den rechten Rand der Bau-Karte hinausragte und dadurch abgeschnitten wurde - taucht jetzt unabhängig von der Kartengröße immer vollständig auf.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Feature: Booster direkt für 7 oder 30 Tage kaufen',
    changes: [
      'Im Shop lässt sich bei jedem Booster (Bautempo, Forschungstempo, Kampf, Abbau) jetzt per Dropdown die Laufzeit wählen - 24 Stunden wie bisher, oder direkt 7 bzw. 30 Tage am Stück. Der Preis passt sich automatisch an und ist gegenüber täglichem Einzelkauf günstiger (7 Tage kosten nur das 6-fache statt 7-fache, 30 Tage nur das 20-fache statt 30-fache des 24h-Preises).',
      'Wird ein Booster nachgekauft, während der vorherige noch läuft, hängt sich die neue Laufzeit wie gewohnt an die verbleibende Restzeit an.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Fix: Mengen-Eingabefelder & übersichtlichere Flottenauswahl',
    changes: [
      'Mengenfelder beim Bauen von Schiffen/Verteidigung ließen sich nicht mehr leeren, sobald einmal eine Zahl drinstand - man musste sie erst markieren, bevor man eine neue Menge eintippen konnte (besonders lästig auf dem Handy). Das Feld kann jetzt beim Eintippen kurz leer sein, ohne sofort auf 1 zurückzuspringen.',
      'Die Flottenauswahl beim Entsenden (Sektor-Missionen, Gruppen-Expeditionen) hatte pro Schiffstyp eine ganze Reihe an Buttons (-1k/-100/-10/+10/+100/+1k/Alle) - bei vielen Schiffstypen wurde das schnell unübersichtlich und nahm viel Platz weg. Ersetzt durch ein einzelnes Eingabefeld pro Schiffstyp plus "Alle"-Button - Menge direkt eintippen statt sich hochzuklicken.',
    ],
  },
  {
    date: '04.08.2026',
    title: 'Großes Kampf- und Balance-Update',
    changes: [
      'Schild-Regeneration: statt einer globalen Pauschale hat jetzt jede Schiffsklasse einen eigenen Basiswert (Jäger 5%, Kreuzer-Klasse 15%, Elite-Klasse 35%, Spezialschiffe/Imperator 65%) - mit voller Forschung kommen Jäger auf 20%, Kreuzer-Klasse auf 30%, Elite-Klasse auf 50% und Spezialschiffe/Imperator auf 80% pro Runde.',
      'RapidFire neu geordnet: klare Stein-Schere-Papier-Kette (Schwerer Jäger > Leichter Jäger, Kreuzer > Schwerer Jäger, Schlachtschiff > Kreuzer, Schlachtkreuzer > Schlachtschiff, Zerstörer > Schlachtkreuzer, Reaper > Zerstörer). Begleitschiffe sind jetzt von RapidFire ausgenommen, Bomber bleibt reiner Bunkerbrecher gegen die leichteren Verteidigungsanlagen.',
      'Kritischer Schaden ist jetzt klassenabhängig statt immer 2x: Jäger 1,5-2x, Kreuzer-Klasse 2-2,5x, Elite-Klasse 3x, Spezialschiffe/Imperator 3,5-4x. Die Krit-Chance selbst ist unverändert.',
      'Piraten-Sektoren und das Elite-Bollwerk würfeln die Feindstärke jetzt nach einem festen 50/30/20-Prinzip statt gleichverteilt: 50% Chance auf normalen Druck, 30% Chance auf eine starke Welle, 20% Chance auf einen extremen Überraschungs-Hammer - macht jeden einzelnen Kampf-Check unberechenbarer. Die Sektoren selbst wurden dafür insgesamt deutlich härter.',
      'Als Ausgleich für die härteren Piraten-Sektoren (Niedrig/Mittel/Hoch) gibt es jetzt zusätzlich zu den Containern ein festes, skalierendes Ressourcen-Paket pro gewonnenem Kampf.',
      'Elite-Bollwerk: garantiert 4x Silber-, 3x Gold- und 2x Elite-Container pro überstandenem Check, zusätzlich zur bestehenden Zufallschance auf den Piratenkapitän.',
      'Raid-Wellen gegen die Heimatbasis nutzen jetzt ebenfalls das 50/30/20-Prinzip (120% / 170% / 230-250% der eigenen Macht) statt einer vorhersehbaren, über die 12 Wellen ansteigenden Kurve.',
      'KI-Mitspieler und Piratenbasen bauen jetzt vorausschauender: das Solarkraftwerk wird schon priorisiert, bevor der Energiehaushalt tatsächlich ins Minus rutscht, und wenn das eigentliche Bauvorhaben (Schiffe/Verteidigung) zu teuer ist, wird auf eine kleinere, bezahlbare Alternative ausgewichen statt den Zug leer verstreichen zu lassen.',
    ],
  },
  {
    date: '03.08.2026',
    title: 'Balance: Schild-Regeneration gesenkt',
    changes: [
      'Kämpfe zogen sich vor allem bei hoher Forschung und großen Flotten teils bis ans 100-Runden-Limit, weil sich Schilde zwischen den Runden extrem stark aufgeladen haben - bei maximaler Schild-Regeneration-Forschung erreichten große Schiffe und Verteidigungsanlagen 80% Aufladung pro Runde.',
      'Die maximale Aufladung pro Runde wurde von 80% auf 50% gesenkt (Forschungsstufen selbst geben jetzt ebenfalls etwas weniger pro Stufe) - Kämpfe sollten dadurch spürbar schneller entschieden werden, besonders bei weit ausgebauter Forschung.',
    ],
  },
  {
    date: '03.08.2026',
    title: 'Fix: Schaden ausgeteilt / Schüsse-Treffer bei großen Flotten',
    changes: [
      'Im Kampfbericht zeigte "Schaden ausgeteilt" und "Schüsse/Treffer" bei größeren Flotten fälschlich 0 an, obwohl klar sichtbar Schaden gemacht wurde (z.B. gegnerische Verluste) - "Schaden erlitten" war davon nicht betroffen und stimmte immer.',
      'Ursache war eine interne Verwechslung bei der Zuordnung der Statistik zum jeweiligen Flotten-Besitzer bei Mehrspieler-Kämpfen mit großen Flotten - behoben, die Werte werden jetzt wieder korrekt angezeigt.',
    ],
  },
  {
    date: '31.07.2026',
    title: 'Allianz-Station: Bau-Verlauf',
    changes: [
      'Neuer Kasten "Bau-Verlauf" auf der Allianz-Seite: zeigt, welches Mitglied welches Gebäude/Modul auf welche Stufe gebracht hat und wann - so bleibt nachvollziehbar, wer zum gemeinsamen Fortschritt beigetragen hat.',
      'Erscheint erst, sobald der erste Bauauftrag nach diesem Update abgeschlossen wurde - für bereits erledigte Baustufen gibt es leider keine rückwirkenden Einträge.',
    ],
  },
  {
    date: '31.07.2026',
    title: 'Piratenbasen/KI-Mitspieler: keine Mining-Flotten mehr, dafür stärkere Minen',
    changes: [
      'Piratenbasen und KI-Mitspieler bauen und verschicken keine Mining-Schiffe mehr - das führte zu einer unbeabsichtigten festen Obergrenze und war so nie beabsichtigt.',
      'Als Ausgleich liefern ihre Minen jetzt deutlich mehr Ertrag (statt 50% Bonus jetzt das 6-fache) - sie sollen trotzdem mit echten Spielern mithalten können, obwohl sie keine Container/Missions-Beute sammeln.',
    ],
  },
  {
    date: '30.07.2026',
    title: 'Piratenbasen wachsen wieder und greifen gelegentlich an',
    changes: [
      'Die 4 Piratenbasen bauen, forschen und schicken wieder Mining-Flotten los - wie ein echter Mitspieler.',
      'Sie starten jetzt auch wieder eigene Angriffsflüge gegen Spieler, allerdings deutlich seltener als früher (im Schnitt nur noch 1-2 Angriffe pro Tag insgesamt, nicht pro Basis) - und nur, wenn ihre Flotte dem Ziel wirklich überlegen ist, statt sich blind zu verheizen.',
    ],
  },
  {
    date: '30.07.2026',
    title: 'KI-Mitspieler (KI-Vega/KI-Nyx) sind zurück',
    changes: [
      'Die beiden KI-Mitspieler bauen, forschen und bewegen ihre Flotte wieder - dieses Mal aber deutlich zurückhaltender und seltener als früher.',
      'Sie greifen Piratenbasen jetzt nur noch an, wenn ihre Flotte spürbar überlegen ist, spionieren sie außerdem aus und helfen euch mit einer haltenden Flotte gegen Raids.',
    ],
  },
  {
    date: '30.07.2026',
    title: 'Inventar: "Alle einlösen" für gestapelte Belohnungen',
    changes: [
      'Rohstoff-Fracht, Ausrüstungs-Teile und geschenkte Schiffe lassen sich jetzt mit einem Klick komplett auf einmal einlösen, statt jeden einzeln anklicken zu müssen.',
      'Zeit-Gutscheine bleiben bewusst einzeln einlösbar - die wirken sofort auf eine laufende Bauschlange, gezieltes Einsetzen ist hier der Sinn.',
    ],
  },
  {
    date: '30.07.2026',
    title: 'Allianz-Station: Bilder, Ertrag/Energie-Anzeige, Roboterfabrik + Nanitenfabrik',
    changes: [
      'Die Stations-Gebäudekarten zeigen jetzt richtige Bilder statt nur Emoji.',
      'Jede Mine zeigt jetzt "Ertrag: X/h", das Solarkraftwerk zeigt seine Energieleistung, und es gibt eine neue "Energieversorgung"-Anzeige pro Stufe (Erzeugt/Verbraucht) - genau wie bei den Gebäuden zu Hause.',
      'Neue Bauzeit-Anzeige bei jedem Gebäude.',
      'Zwei neue Gebäude: Roboterfabrik und Nanitenfabrik (inkl. ihrer Module) - verkürzen die Bauzeit aller anderen Gebäude derselben Stufe, genau wie zu Hause.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Bugfix: vereinzelt Raid zum alten Zeitpunkt statt Sonntag 0 Uhr',
    changes: [
      'Bei der Umstellung auf den wöchentlichen Sonntags-Rhythmus konnte es bei einem Konto passieren, dass trotzdem noch ein Raid zum alten Zeitpunkt startete, wenn genau beim Update ein Raid aktiv war. Behoben - ab jetzt startet bei allen zuverlässig nur noch der Sonntag-0-Uhr-Termin.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Neu: Allianz-Station',
    changes: [
      'Neue Seite "Allianz": gründet eine Allianz, ladet euch gegenseitig ein - nach Annahme könnt ihr gemeinsam eine Raumstation an einer frei wählbaren Galaxie-Position bauen.',
      'Auf der Station gibt es nur Minen (Metall/Kristall/Deuterium) und ein Solarkraftwerk, dafür in drei Ausbaustufen V1/V2/V3 - jede Version liefert deutlich mehr Ertrag, kostet aber auch mehr und dauert länger. V2 schaltet sich frei, sobald alle drei V1-Minen Level 30 erreicht haben, V3 entsprechend nach V2.',
      'Alle Gebäude haben wie zu Hause auch Module (Fördereffizienz, Energiesparmodul, Automatisierung bzw. beim Solarkraftwerk Ertragssteigerung/Wartungsoptimierung).',
      'Die Station produziert passiv, ganz ohne Mining-Schiffe - läuft auch weiter, wenn gerade niemand online ist.',
      'Ressourcen werden gemeinsam auf der Station gelagert und können von jedem Mitglied jederzeit frei eingezahlt oder abgehoben werden - keine Genehmigung nötig.',
      'Die Station ist NICHT angreifbar - reines Kooperations-Feature ohne Gegner.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Galaxie-Ansicht aufgeräumt',
    changes: [
      'Das "🚩 Sternenbund"-Kästchen oben auf der Galaxie-Seite (Mitgliederliste, Gegenseite "Piratenkonföderation") ist entfernt - es war rein dekorativ und hatte keinerlei Funktion.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Kampf-Fortschritt in Piraten-Sektor und Elite-Bollwerk jetzt sichtbar',
    changes: [
      'Piraten-Sektor (Solo): der Missionsstatus zeigt jetzt zusätzlich "⚔️ Kämpfe bisher: X/6 Checks · Y gewonnen" - vor einem Rückruf seht ihr auf einen Blick, ob sich das Weiterlaufenlassen noch lohnt.',
      'Elite-Bollwerk: die Fortschrittsanzeige zeigt jetzt zusätzlich, wie viele der bisherigen Checks tatsächlich gewonnen wurden. Neuer Button "🚀 Flotten ansehen" zeigt während der laufenden Expedition die aktuelle (bereits um Verluste bereinigte) Flottenstärke aller Teilnehmer - auch das eine wichtige Entscheidungshilfe vor einem Rückruf.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Bugfix: Piraten-Sektor-Buttons blieben trotz laufender Mission anklickbar',
    changes: [
      'Solange eine Flotte in Niedrig/Mittel/Hoch unterwegs war, sollten die anderen beiden Stufen gesperrt sein - der Button sah aber weiterhin normal anklickbar aus und ließ sich auch mit Schiffen befüllen, erst beim tatsächlichen Senden kam eine Fehlermeldung. Die gesperrten Buttons sind jetzt sichtbar ausgegraut, mit Hinweistext, warum gerade nicht gesendet werden kann.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Piraten-Sektor: nur noch eine Stufe gleichzeitig, dafür klare Container-Belohnung',
    changes: [
      'Ihr müsst euch jetzt entscheiden: Niedrig, Mittel ODER Hoch - nicht mehr alle drei gleichzeitig beflogbar. Erst wenn eure Flotte zurück ist, könnt ihr die nächste Stufe starten.',
      'Die Belohnung ist dafür glasklar: Niedrig gibt 4x Silber-Container pro gewonnenem Kampf, Mittel 2x Gold, Hoch 1x Elite-Container - alles gesammelt und bei Rückkehr auf einmal gutgeschrieben.',
      'Der Sandronator verdoppelt weiterhin die Ausbeute, wenn er die ganze Mission überlebt.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Schiffswerte überarbeitet',
    changes: [
      'Der Schlachtkreuzer war spürbar zu teuer für seine Waffenkraft - Waffenwert deutlich angehoben, jetzt im Rahmen der anderen Schiffe seiner Preisklasse.',
      'Die Antriebs-Geschwindigkeiten waren verkehrt herum gestaffelt: Schiffe mit Hyperraumantrieb (Schlachtkreuzer, Zerstörer, Reaper, Salvendreadnought) waren teils langsamer als Schiffe mit einfacherem Antrieb. Jetzt gilt: Rakete < Impuls < Hyperraum, wie es sich gehört.',
      'Imperator und Sandronator bleiben bewusst weiterhin extrem langsam - das ist Absicht, kein Bug.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Bugfix: hängengebliebene Raids',
    changes: [
      'Ein Raid, der genau während der Umstellung auf den neuen Wochen-Rhythmus lief, konnte dauerhaft bei der letzten Welle hängen bleiben, statt sich aufzulösen - behoben. Betroffene Raids lösen sich beim nächsten Login automatisch auf.',
    ],
  },
  {
    date: '29.07.2026',
    title: 'Sektor-/Bollwerk-Infofenster überarbeitet',
    changes: [
      'Die Info-Popups bei Asteroiden-Feld, Piraten-Sektor, Elite-Bollwerk und Piratenadmiral waren mit viel Fließtext überladen - deutlich gekürzt auf die Zahlen, die für die Missionsplanung wirklich zählen (Feindstärke, Belohnungen, Sieges-Serie, Teile-Chancen, RapidFire-Kontern).',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Asteroiden-Feld, Piraten-Sektor und Elite-Bollwerk laufen jetzt 24 Stunden',
    changes: [
      'Asteroiden-Feld: Einsatzdauer von 12 auf 24 Stunden verlängert.',
      'Piraten-Sektor (Solo) und Elite-Bollwerk: Einsatzdauer von 4 auf 24 Stunden verlängert, dafür kämpft ihr nur noch alle 4 Stunden statt jede Stunde (6 Kämpfe pro Einsatz statt 4).',
      'Teile gibt es bei Piraten-Sektor/Elite-Bollwerk jetzt ausschließlich durch gewonnene Kämpfe, nicht mehr zusätzlich passiv über die Zeit - dafür ist das Teile-Limit pro Einsatz spürbar höher als vorher.',
      'Neu beim Elite-Bollwerk: jederzeit per Rückruf-Button abbrechbar - alle Teilnehmer kommen sofort zurück, bereits gewonnene Kämpfe bleiben erhalten. Praktisch, wenn die eigene Flotte schon angeschlagen ist und ihr kein Risiko mehr eingehen wollt.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Raids laufen jetzt 1x pro Woche statt 2x täglich',
    changes: [
      'Neuer Rhythmus: Raids starten jetzt jeden Sonntag um 0 Uhr und dauern eine volle 24-Stunden-Belagerung mit 12 Angriffswellen (vorher 2x täglich, 1 Stunde mit 5 Wellen).',
      'Belohnung steigt mit jeder einzelnen gewonnenen Welle: 10 Silber-, 6 Gold- und 2 Elite-Container pro Welle, am Ende der Belagerung ausgezahlt - bei einer perfekten 12/12-Verteidigung macht das 120 Silber-, 72 Gold- und 24 Elite-Container.',
      'Dafür sind die Wellen jetzt auch deutlich härter, vor allem gegen Ende der Belagerung - ein makelloser Durchgang soll eine echte Leistung bleiben.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Piratenbasen bewachen sich jetzt selbst deutlich stärker',
    changes: [
      'Die feste Garnison jeder Piratenbasis wurde massiv verstärkt (von rund 100 auf über 5.000 Schiffe plus über 1.000 Verteidigungsanlagen) - ein Angriff lohnt sich jetzt nur noch mit einer ernsthaften Flotte.',
      'Die Ressourcen einer Piratenbasis wachsen weiterhin passiv, aber jetzt bis zu einer Obergrenze - danach lohnt sich ein Beutezug, ohne dass die Basis unbegrenzt reicher wird.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Booster überarbeitet',
    changes: [
      'Alle vier Booster (Bautempo, Forschungstempo, Kampf, Abbau) wirken jetzt stärker, kosten dafür aber auch mehr Dunkle Materie.',
      'Bugfix: der Abbau-Booster hat bisher trotz Kauf keinerlei Effekt gehabt - ab sofort wirkt er wie beworben auf eure Minen-Produktion.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Zeitgutscheine droppen jetzt häufiger',
    changes: [
      'Die tatsächliche Chance auf einen Zeitgutschein aus Silber-/Gold-/Elite-Containern war durch die Ziehungs-Mechanik (immer genau 2 Treffer pro Öffnung) niedriger als der angezeigte Wert - behoben, Zeitgutscheine droppen jetzt spürbar häufiger.',
      'Das Inventar zeigt bei jeder Container-Kategorie jetzt die tatsächliche Chance an, nicht mehr den irreführenden Rohwert.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Bugfix: Massenflotten verloren viel zu viele Schiffe',
    changes: [
      'Nach der Massenflotten-Umstellung zogen sich große Stapel erst zurück, wenn fast die gesamte Gruppe bereits vernichtet war - vorher (und bei kleineren Flotten weiterhin) ziehen sich einzelne, ungünstig getroffene Schiffe schon deutlich früher zurück, während der Rest kaum Schaden hat.',
      'Große Flotten verlieren jetzt wieder deutlich weniger Schiffe pro Kampf - Verluste in schweren Sektoren (Hoch, Elite-Bollwerk) sanken in unseren Tests von rund 58% auf rund 45%.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Riesenflotten sind jetzt kein Problem mehr für den Server',
    changes: [
      'Die Kampf-Engine wurde grundlegend überarbeitet: sehr große Flotten (mehrere tausend Schiffe eines Typs) werden jetzt gebündelt statt Schiff für Schiff berechnet - ein Kampf mit über 16.000 Schiffen dauert jetzt Sekundenbruchteile statt mehrere Minuten.',
      'Kein Limit mehr nötig: schickt so viele Schiffe in den Kampf, wie ihr wollt - normale Flottengrößen sind davon komplett unberührt, nur riesige Stapel profitieren von der neuen, schnelleren Berechnung.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Bugfix: Elite-Bollwerk-Kampfbericht änderte sich beim Ansehen ständig',
    changes: [
      'Bei sehr großen Flotten konnte derselbe Stunden-Check beim Neuladen der Seite mehrfach unterschiedliche Kampfzahlen zeigen, obwohl es dieselbe Stunde war - lag an zwei überlappenden Hintergrund-Aktualisierungen, die denselben Check versehentlich doppelt berechnet haben.',
      'Jeder Stunden-Check wird jetzt garantiert nur noch einmal berechnet, egal wie schnell hintereinander die Seite aktualisiert wird.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Bugfix: Piratenadmiral zeigt jetzt einen echten Kampfbericht',
    changes: [
      'Der Kampf gegen den Piratenadmiral (Sektor P10) lief technisch immer korrekt ab, aber die Nachricht dazu zeigte bisher nur eine knappe Textzeile ohne Gegnerflotte, Runden oder Schadenszahlen - fühlte sich an wie ein Sieg ohne echten Kampf.',
      'Jede Check-Nachricht (egal ob "Admiral kämpft weiter", Sieg oder Niederlage) zeigt jetzt den vollständigen Kampfbericht: Rundenzahl, Schaden ausgeteilt/erlitten, komplette Einheiten-Tabelle für Piratenadmiral, Eskorte und eure eigene Flotte.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Piraten stärker, Elite-Bollwerk jetzt auch solo möglich',
    changes: [
      'Piraten kämpfen jetzt mit voller statt halber Forschung - werden dadurch spürbar zäher/treffsicherer, ohne dass ihre Flotten größer werden.',
      'Elite-Bollwerk lässt sich jetzt klar erkennbar auch alleine fliegen: einfach niemanden einladen und direkt unter "Meine Operationen" starten, kein Warten auf Mitspieler nötig.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Balance: Jäger und Kreuzer bekommen eine echte Rolle gegen Elite-/Spezialschiffe',
    changes: [
      'Leichter und Schwerer Jäger weichen großen Schiffen (Schlachtschiff, Bomber, Schlachtkreuzer, Zerstörer, Reaper, Imperator, allen 3 Salvenschiffen) jetzt viel häufiger aus - sie tanken diese Schüsse quasi durch Ausweichen, statt sinnlos wegzusterben.',
      'Kreuzer weichen denselben großen Schiffen ebenfalls spürbar häufiger aus, bleiben aber weiterhin deren Hauptziel - nur eben nicht mehr bei praktisch jedem Schuss getroffen.',
      'Kämpfe zwischen ähnlich großen Schiffen (Jäger gegen Jäger, Kreuzer gegen Jäger/Kreuzer) bleiben unverändert - der Bonus greift nur, wenn deutlich größere Schiffe schießen.',
      'Ziel: ein guter Flottenmix aus Jägern, Kreuzern und Elite-/Spezialschiffen soll sich wieder lohnen, statt dass nur "je mehr Elite, desto besser" zählt.',
    ],
  },
  {
    date: '28.07.2026',
    title: 'Server-Stabilität: KI-Mitspieler entfernt, Piratenbasen passiv, Außenposten entfernt',
    changes: [
      'KI-Vega und KI-Nyx wurden komplett entfernt - sie waren die Hauptursache wiederkehrender, mehrminütiger Server-Verzögerungen (rund um die Uhr Kämpfe/Missionen/Angriffe ohne menschliche Entscheidungspause).',
      'Piratenbasen wachsen nicht mehr eigenständig und greifen euch nicht mehr von sich aus an - sie bleiben weiterhin angreifbar, halten aber dauerhaft ihren aktuellen Bestand.',
      'Außenposten-Feature komplett entfernt (Eroberung/Verstärkung/Rückruf, Flugzeit-Bonus).',
      'Normale Raids (die Piratenbasen regelmäßig gegen euch starten) sind davon nicht betroffen und laufen unverändert weiter.',
    ],
  },
  {
    date: '25.07.2026',
    title: 'Balance: KI-Mitspieler und Piratenbasen wachsen jetzt effizienter',
    changes: [
      'KI-Vega/KI-Nyx und die Piratenbasen bauen jetzt auch Gebäude-/Schiffs-/Verteidigungs-Module aus, nicht mehr nur die Basis-Gebäude/Schiffe/Verteidigung selbst.',
      'Piratenbasen greifen euch nur noch 1-2x am Tag an (statt im Schnitt alle paar Minuten) - sie sollen sich lieber aufbauen (Forschung, Gebäude, Verteidigung, Flotte) statt ihre Schiffe ständig in Angriffen zu verlieren.',
      'KI-Mitspieler und Piratenbasen bekommen einen moderaten Bonus auf ihre Rohstoffproduktion (+50%), um auszugleichen, dass eine KI nie so effizient wirtschaftet wie ein Mensch mit vollem Überblick. Gilt nicht für echte Spieler.',
    ],
  },
  {
    date: '25.07.2026',
    title: 'Neu: Debug-Ansicht für KI-Bots und Piratenbasen',
    changes: [
      'Neuer Menüpunkt "Debug" zeigt den vollen Zustand von KI-Vega/KI-Nyx und allen 4 aktiven Piratenbasen - Flotte, Verteidigung, Gebäude, Forschung, Ressourcen und laufende Angriffe.',
      'Reines Beobachtungs-Werkzeug, um nachzuvollziehen, wie sich die KI-Mitspieler und Piratenbasen über die Zeit entwickeln.',
    ],
  },
  {
    date: '25.07.2026',
    title: 'UX: Spielernamen in der Galaxie-Ansicht farblich hervorgehoben',
    changes: [
      'Namen (dein eigener Account, KI-Bots, dein Mitspieler) waren bisher gedimmt oder ungefärbt und gingen in der Galaxie-Übersicht leicht unter - jetzt durchgängig grün für "du" und cyan für alle anderen.',
    ],
  },
  {
    date: '24.07.2026',
    title: 'Balance: Piraten-Sektor überarbeitet',
    changes: [
      'Mittel und Hoch geben jetzt garantiert 1 bzw. 3 Elite-Container bei erfolgreicher Rückkehr, statt nur einer Zufallschance auf einen Kapitän-Container - planbar statt Glücksspiel.',
      'Dafür deutlich stärkere Gegner auf Mittel/Hoch und spürbar geringere Ressourcen-Beute auf allen 3 Stufen - Teile und Container sind jetzt die Kernbelohnung, Ressourcen nur noch ein kleiner Nebeneffekt.',
      'Neu auf Mittel/Hoch: 8% Chance pro Stunden-Check, die bisherige Beute der laufenden Mission zu verdoppeln - dieselbe Mechanik wie der "reiche Fund" im Asteroiden-Feld.',
      'Niedrig bleibt bewusst unverändert als sanfte Einstiegsstufe.',
    ],
  },
  {
    date: '24.07.2026',
    title: 'Balance: KI-Bots greifen jetzt sinnvoll an',
    changes: [
      'KI-Vega/KI-Nyx beteiligen sich jetzt tatsächlich an der Eroberung von Außenposten, mit einem deutlich größeren und vielfältigeren Flotteneinsatz pro Versuch als vorher - davor wurde ein Angriffsversuch fast immer mangels ausreichender Flotte übersprungen.',
    ],
  },
  {
    date: '24.07.2026',
    title: 'Neu: Piratenbasen greifen jetzt selbst an',
    changes: [
      'Die 4 aktiven Piratenbasen waren bisher rein passiv (nur ihr konntet sie angreifen) - sie greifen jetzt gelegentlich auch selbst mit einem Teil ihrer gewachsenen Flotte einen zufälligen Spieler oder Bot an, inklusive vollständigem Kampfbericht und Beute proportional zum angerichteten Schaden.',
    ],
  },
  {
    date: '24.07.2026',
    title: 'Balance: Piraten-Rückeroberung nachgeschärft',
    changes: [
      'Die Zusammensetzung der Rückeroberungs-Flotte besteht jetzt aus stärkeren Schiffstypen statt nur billiger Leichter-Jäger-Masse.',
      'Eine Garnison aus wenigen, extrem starken Einzelschiffen (z.B. 1 Imperator) war trotz Machtskalierung praktisch unbesiegbar - ein neuer Aufschlag für solche "Elite-Stacks" macht auch das zu einer echten, wenn auch nicht garantierten Bedrohung. Normale Garnisonen aus vielen günstigen Schiffen bleiben davon unberührt.',
      'Rückeroberungsversuche laufen jetzt auf einem 60-120-Minuten-Cooldown pro Außenposten statt einer Zufallschance bei jedem Heartbeat - fühlte sich vorher wie Dauerbeschuss an.',
      'Erzeugt keine persönliche Nachricht mehr an alle Spieler bei jedem Versuch (kein menschlicher Akteur beteiligt) - der Ausgang bleibt weiterhin über die Galaxie-Ansicht sichtbar.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Balance: Außenposten nachgeschärft',
    changes: [
      'Der Flugzeit-Bonus aus gehaltenen Außenposten gilt jetzt für JEDEN Flug (nicht mehr nur für Flüge im selben System) und addiert sich pro gehaltenem Posten: +15% je Posten, bis zu +90% bei allen 6.',
      'Die piraten-eigene Garnison eines Außenpostens skaliert jetzt zusätzlich mit der Stärke der angreifenden Flotte, nicht mehr nur mit einem festen Wert je Stufe - eine starke Flotte fliegt nicht mehr automatisch verlustfrei durch.',
      'Piraten-Rückeroberungsversuche gegen eure Außenposten liefern jetzt einen vollständigen Kampfbericht statt nur einer Textzeile.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Neu: Außenposten - kontestierte Galaxie-Knoten',
    changes: [
      '6 neue, feste Positionen in der Galaxie ("🚩 Außenposten") - starten in Piratenhand mit einer eigenen Garnison, die ihr durch einen Flottenangriff erobern könnt.',
      'Ein eroberter Außenposten gehört eurer gesamten Seite (euch beiden + KI-Vega/KI-Nyx) gemeinsam - jeder kann die Garnison verstärken oder komplett zurückrufen.',
      'Solange ihr einen Außenposten haltet, sind Flüge im selben System 15% schneller - ein spürbarer strategischer Vorteil.',
      'Die Piraten versuchen von sich aus, verlorene Außenposten zurückzuerobern, wenn sich die Gelegenheit bietet - unverteidigte Posten sind besonders gefährdet.',
      'Bleibt reines PvE: der einzige Gegner dabei sind die Piraten, nie ein anderer Spieler.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Neu: Eure Allianz hat jetzt einen Namen',
    changes: [
      'Oben in der Galaxie-Ansicht seht ihr jetzt eure Allianz "Sternenbund" mit allen Mitgliedern (du, dein Mitspieler, KI-Vega, KI-Nyx) sowie euren aktuell gehaltenen Außenposten.',
      'Die Piratenseite tritt ab jetzt unter dem Namen "Piratenkonföderation" auf.',
      'Rein kosmetisch - ändert nichts an Mechanik oder Regeln.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Balance: Basis-Raids deutlich gefährlicher',
    changes: [
      'Raid-Angriffswellen waren bisher fast immer schwächer als die eigene Verteidigung - dank Forschungs-/Schildboni wurde praktisch nie ein Schiff oder eine Anlage zerstört, Raids liefen quasi verlustfrei durch.',
      'Die Angriffsstärke der 5 Wellen wurde von 80-130% auf 130-200% der eigenen Basis-Power angehoben. Jede Welle ist jetzt eine echte Bedrohung, spürbare Verluste können schon ab der ersten Welle entstehen.',
      'Eine perfekte 5/5-Verteidigung bleibt möglich, wird aber zur Ausnahme statt zum Normalfall - eine solide Verteidigung lohnt sich jetzt wirklich.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Balance: Bessere Belohnung für perfekte Raid-Verteidigung',
    changes: [
      'Da eine perfekte 5/5-Raid-Verteidigung durch die stärkeren Angriffswellen jetzt seltener gelingt, wurde die Belohnung dafür angehoben: statt 4x Silber + 1x Gold gibt es jetzt 5x Silber + 2x Gold.',
      'Die Zusatzchance auf einen Elite-Container bei perfekter Verteidigung steigt von 15% auf 20%.',
    ],
  },
  {
    date: '23.07.2026',
    title: 'Optik: Kampfberichte mit mehreren Wellen/Stunden jetzt einklappbar',
    changes: [
      'Sammelberichte (Raids mit mehreren Wellen, Piraten-Sektor-/Asteroiden-Missionen mit mehreren Stunden-Checks) zeigten bisher ALLE Einzelkämpfe direkt untereinander voll ausgeklappt - bei vielen Einträgen musste man lange scrollen.',
      'Jeder Einzelkampf ist jetzt ein eigener, standardmäßig zugeklappter Bereich - nur Stunde/Welle und Ausgang sind auf den ersten Blick sichtbar, ein Klick auf die Kopfzeile klappt genau diesen einen Kampf auf.',
      '"Alle aufklappen"/"Alle zuklappen"-Buttons oben in der Liste, falls ihr doch alles auf einmal sehen wollt.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Piratenbasen wachsen jetzt genau wie ein Spieler',
    changes: [
      'Die 4 angreifbaren Piratenbasen hatten bisher nur eine einfache Flotte/Verteidigung/Ressourcen, die in festen Schritten nachwuchs. Jetzt betreiben sie eine vollständige eigene Wirtschaft: sie bauen Gebäude aus, betreiben Forschung, schicken Mining-Schiffe zu Asteroidenfeldern und bauen Schiffe/Verteidigung - exakt dieselbe Logik wie eure KI-Mitspieler KI-Vega und KI-Nyx.',
      'Kein künstlicher Deckel mehr - eine Piratenbasis kann theoretisch beliebig stark werden, begrenzt nur durch dieselben wirtschaftlichen Grenzen wie bei euch (Energie, Bauplätze, Ressourcenertrag).',
      'Kampfwerte im Angriffsbericht spiegeln jetzt die tatsächliche Forschung und Kampf-Klasse der Basis wider, statt fixer Basiswerte - eine Basis mit "Kanonier"-Klasse teilt z.B. doppelten Waffenschaden aus.',
      'Bereits bestehende Basen wurden automatisch auf das neue System umgestellt, ihr bisheriger Bestand ging dabei nicht verloren.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Balance: Piratenbasen stärker + KI-Bots aktiver',
    changes: [
      'Piratenbasen starten jetzt direkt mit deutlich mehr Flotte, Verteidigung und Ressourcen - ein Angriff lohnt sich jetzt schon früh, statt erst nach wochenlangem passivem Nachwachsen.',
      'Das passive Wachstum selbst ist ebenfalls schneller: kürzeres Intervall, größerer Schub pro Wachstumsschub, höhere Obergrenze pro Schiffs-/Verteidigungstyp.',
      'KI-Mitspieler (KI-Vega, KI-Nyx) handeln jetzt deutlich häufiger - Piratenbasis-Angriffe, Spionage und Flotten-Unterstützung bei euch laufen im Schnitt alle 6-7 statt alle 20 Minuten an.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Wirtschafts-Klassen (Schmuggler, Ingenieur, Prospektor)',
    changes: [
      'Neben eurer Kampf-Klasse (Kanonier/Bollwerk/Kommandant) könnt ihr jetzt zusätzlich eine Wirtschafts-Klasse wählen - komplett unabhängig, rührt nie an Waffen/Schild/Panzerung. Zu finden im Klasse-Tab, unterhalb der Kampf-Klassen.',
      'Schmuggler (Handel): Handelsgebühr beim Händler halbiert (20% → 10%), Schrott-Rückerstattung erhöht (30% → 45%), 15% günstigere Booster im Shop.',
      'Ingenieur (Bau): 15% kürzere Bauzeit für Schiffe, Verteidigungsanlagen UND Gebäude - nur die Zeit, nicht die Kosten (die rabattieren schon eure Kampf-Klasse).',
      'Prospektor (Förderung): +20% Mining-Ertrag (Schiffe und Gebäude), +30% schnellerer Dunkle-Materie-Fund im Asteroidenfeld, 10% weniger Treibstoffverbrauch bei Galaxie-Flügen.',
      'Anders als bei der Kampf-Klasse ist hier NICHTS erzwungen - ihr könnt jederzeit wählen oder auch ganz darauf verzichten. Dafür kostet jede Wahl (auch die allererste) 1.000 Dunkle Materie, ein Wechsel ebenso.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Punktzahl spiegelt jetzt eure aktuelle Gesamtmacht wider',
    changes: [
      'Eure Punktzahl in der Bestenliste zählt jetzt zusätzlich eure AKTUELLE Flotte und Verteidigung mit - nach demselben Wert-Prinzip wie vernichtete Gegner (ein Reaper zählt mehr als ein Leichter Jäger).',
      'Das ist die einzige Punkte-Kategorie, die auch wieder sinken kann: verliert ihr Schiffe (Kampf, Verschrottung), sinkt euer Machtwert entsprechend - alle anderen Kategorien wachsen nur.',
      'Bewusst NICHT eingerechnet: abgeschlossene Forschungen (irgendwann hat jeder alles fertig, dann sagt der Wert nichts mehr aus), geöffnete Container/erbeutete Ressourcen (Glück/Fleiß statt Kampfkraft), verlorene eigene Schiffe.',
      'Nebenbei behoben: ein besiegter Piratenkapitän zählte bisher versehentlich doppelt in die Punktzahl (einmal als "Kapitän besiegt", einmal als "Gegner vernichtet") - jetzt nur noch einmal.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Balance: Punkte für vernichtete Gegner jetzt nach Wert gestaffelt',
    changes: [
      'Bisher gab jeder vernichtete Gegner genau 1 Punkt für die Bestenliste - egal ob Leichter Jäger oder Reaper.',
      'Jetzt richtet sich die Punktzahl nach dem Wert des Gegners (grob an dessen Baukosten angelehnt): ein Leichter Jäger bringt weiterhin 1 Punkt, ein Reaper zum Beispiel 10, der seltene Piratenkapitän 25.',
      'Wichtig: bereits vernichtete Gegner aus der Vergangenheit wurden nie nach Schiffstyp aufgezeichnet, nur als Gesamtsumme - sie tragen deshalb rückwirkend nicht mehr zur Punktzahl bei. Das führt einmalig zu einem Punkte-Rückgang in der Bestenliste, ab jetzt zählen aber alle neuen Siege korrekt gestaffelt.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Fix: Piraten-Spionage-Nachricht jetzt mit Sprung zur Position',
    changes: [
      'Wenn Piraten eure Basis ausspionieren, stand die Basis-Position bisher nur als reiner Text in der Nachricht - man musste sich die Koordinaten merken und selbst in der Galaxie-Ansicht suchen.',
      'Die Nachricht ist jetzt anklickbar ("Zur Position →") und springt direkt zum passenden System in der Galaxie-Ansicht.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Balance: Durchschlag-Forschung (Overkill) abgeschwächt',
    changes: [
      'Bei voller Ausbaustufe (10) konnte Überschussschaden bisher zu 100% auf das nächste gleichartige Schiff überschwappen - kombiniert mit der Kaskaden-Reichweite von 5 Schiffen konnte ein einzelner starker Treffer so bis zu 5 Schiffe auf einen Schlag vernichten.',
      'Der Bonus pro Stufe sinkt von 10% auf 5%, bei voller Stufe 10 sind es jetzt maximal 50% statt 100% Übertrag - passt besser zu den zuletzt verlängerten, taktischeren Gefechten.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Balance: Kämpfe ziehen sich jetzt spürbar länger und taktischer hin',
    changes: [
      'Bisher konnte eine bereits angeschlagene Einheit (unter 70% ihrer HP) bei jedem weiteren Treffer eine mit dem Schaden LINEAR steigende Chance haben, sofort komplett zu explodieren - das liess ganze Flotten schon ab moderatem Schaden reihenweise "explodieren" statt übers Gefecht hinweg an HP zu verlieren, wodurch Kämpfe oft nach wenigen Runden entschieden waren.',
      'Die Chance steigt jetzt innerhalb desselben Schadens-Fensters leicht gedämpft statt rein linear - schwer beschädigte Schiffe halten dadurch etwas länger durch, bevor ein nennenswertes Explosionsrisiko besteht.',
      'Effekt im Kampfsimulator: Gefechte dauern jetzt im Schnitt spürbar länger (rund 75-85 statt 50-60 Runden) und verlaufen kontinuierlicher statt abrupt zu kippen.',
      'Das Rundenlimit selbst (100 Runden) bleibt unverändert als CPU/RAM-Schutzgrenze bestehen - die Balance ist so austariert, dass Kämpfe im Regelfall klar darunter enden.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Balance: Jäger-Klassen überleben Piraten-Begegnungen jetzt besser',
    changes: [
      'Leichter und Schwerer Jäger gingen bisher unabhängig von der eingesetzten Anzahl fast immer als erstes drauf - der Grund: so gut wie jede Piraten-Einheit hat RapidFire (Bonus-Folgeschüsse) speziell gegen diese beiden Klassen, und Piraten-Flotten bestehen selbst überwiegend aus genau diesen Schiffen.',
      'Der RapidFire-Bonus, den PIRATEN gegen deine Jäger-Klassen bekommen, ist jetzt halbiert. Deine eigenen Schiffe verlieren dadurch NICHTS an Schlagkraft gegen die piratischen Jäger-Schwärme - nur die Piraten fokussieren deine Jäger nicht mehr ganz so extrem.',
      'Effekt im Kampfsimulator spürbar: Gefechte dauern spürbar länger und die Verluste bei Jäger-lastigen Flotten fallen im Schnitt etwas geringer aus.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Überarbeitet: Rückzug im Kampf ist jetzt gestaffelt statt alles-oder-nichts',
    changes: [
      'Bisher hat sich die GESAMTE Flotte auf einen Schlag zurückgezogen, sobald ihre kombinierte Kampfkraft auf 50% gefallen war - ziemlich binär: entweder alle Schiffe kämpften weiter oder alle flohen im selben Moment.',
      'Jetzt entscheidet jedes Schiff einzeln: sobald ein Schiff auf 30% seiner Panzerung gesunken ist, zieht es sich zurück und überlebt, während die weniger beschädigten Schiffe weiterkämpfen. Stark angeschlagene Schiffe fliehen also zuerst, gesunde bleiben im Gefecht.',
      'Ergebnis: die eigenen Verluste liegen jetzt in einer echten Bandbreite (z.B. 50-100%) statt nur bei "kaum welche" oder "fast alles" - macht Kämpfe spannender und die Flottenplanung lohnender.',
      'Kampfsimulator und Kampfberichte wurden entsprechend angepasst: "Rückzug" wird nur noch angezeigt, wenn der Kampf NICHT trotzdem mit der vollständigen Vernichtung des Gegners endete.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Fix: Raid-Wellenberichte zeigten alle Spieler-Flotten in einem Topf',
    changes: [
      'Seit der Umstellung auf gesammelte Wellen-Berichte (ein Bericht am Ende statt einer Nachricht pro Welle) landeten Verteidiger-, Verstärker- und haltende Flotten fälschlich alle zusammen in einer einzigen Tabelle "Eigene Flotte" - man konnte nicht mehr erkennen, wessen Schiffe was geleistet haben.',
      'Jede Welle im Bericht zeigt jetzt wieder eine eigene Tabelle pro beteiligtem Spieler (mit Namen), plus haltende Flotten weiterhin mit "(haltende Flotte)"-Kennzeichnung - genau wie vor der Umstellung.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Reiche Asteroidenfunde in den Asteroiden-Feldern',
    changes: [
      'Bei jedem stündlichen Check während einer laufenden Mining-Mission besteht jetzt eine 8%-Chance auf einen "reichen Fund" - dabei verdoppelt sich der bis dahin gesammelte Ertrag (Metall/Kristall/Deuterium) der Mission.',
      'Reine Glückssache: früh in der Mission bringt ein Treffer wenig, spät im 12-Stunden-Einsatz kann er richtig groß ausfallen. Mehrere Treffer in derselben Mission schaukeln sich sogar auf.',
      'Betrifft nur die Ressourcen, nicht die Dunkle Materie - die bleibt an ihr eigenes Fund-Limit gebunden.',
      'Der Rückkehr-Bericht zeigt jetzt eine eigene Tabelle "Reiche Asteroidenfunde" mit Stunde und Bonus je Treffer, falls es welche gab.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Optik: Kampfwerte jetzt farbig + auch in den Info-Popups sichtbar',
    changes: [
      'Waffen-, Schild- und Panzerungswerte auf Schiffs-/Verteidigungs-Karten sind jetzt farblich unterschieden (Waffen rot, Schild cyan, Panzerung blaugrau) und mit passendem Symbol versehen (⚔️🛡️🧱) - auf einen Blick leichter zu erfassen.',
      'Der Effektivwert in Klammern (siehe letztes Update) leuchtet jetzt zusätzlich grün, damit er sofort ins Auge fällt.',
      'Die Info-Popups (ℹ️-Button) zeigten bisher gar keine Kampfwerte, nur Zusatzinfos wie Präzision oder RapidFire - jetzt stehen Waffen/Schild/Panzerung dort ebenfalls ganz oben, inklusive Effektivwert.',
      'Popup-Titel haben jetzt dieselbe rote Akzentlinie wie die Seitenüberschriften - einheitlicheres Erscheinungsbild.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Effektivwerte auf Bau-Karten sichtbar',
    changes: [
      'Schiffs- und Verteidigungs-Karten in der Werft zeigten bisher immer nur die reinen Basiswerte - auch wenn Forschung, Klasse, Module oder der Kampf-Booster den tatsächlichen Kampfwert längst verändert hatten.',
      'Jetzt steht bei einem Unterschied der tatsächliche Wert zusätzlich in Klammern dahinter, z.B. "Waffen: 1.500 (3.000)" - Basiswert zuerst, Effektivwert danach. Ohne Unterschied bleibt es beim einzelnen Wert, damit die Karten übersichtlich bleiben.',
      'Bei Schildkuppeln bleibt der Schild-Wert bewusst ohne Klammer-Zusatz - ihr Beitrag läuft über den gemeinsamen Kuppel-Schild-Pool, nicht über den Einzelwert.',
      'Nachtrag: der Imperator hatte das noch nicht (eigene Karte im Spezialschiffe-Tab) - jetzt ebenfalls mit Effektivwert-Anzeige.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Spionage-Forschung reaktiviert + Spionagesonden',
    changes: [
      'Die Spionage-Forschung war lange als wirkungslos gesperrt - ist jetzt wieder freigeschaltet und hat einen echten Zweck: sie bestimmt, wie viele Details ihr über eine ausspionierte Piratenbasis erfahrt.',
      'Neues Schiff in der Werft (Versorgungsschiffe): die Spionagesonde. Unbewaffnet, wird nie zerstört, und fliegt IMMER genau 5 Minuten zum Ziel - egal wie weit die Piratenbasis entfernt liegt.',
      'In der Galaxie-Ansicht gibt es bei jeder angreifbaren Piratenbasis jetzt einen "Ausspionieren"-Button neben "Angreifen". Der Bericht landet danach bei den Farm-/Beuteberichten in euren Nachrichten.',
      'Detailgrad nach Spionage-Stufe: Stufe 0 zeigt nur die Ressourcen der Basis. Ab Stufe 1 kommt eine grobe Schätzung zu Flotte/Verteidigung dazu, die mit jeder weiteren Stufe genauer wird - Stufe 10 zeigt alles exakt.',
      'Umgekehrt spionieren euch auch die Piraten gelegentlich aus - ihr bekommt dann eine Nachricht, von welcher Piratenbasis-Position aus das passiert ist (aber nicht, was sie gesehen haben).',
      'KI-Vega und KI-Nyx bauen sich ebenfalls Spionagesonden und schicken sie gelegentlich los.',
      'Nachtrag: Spionageberichte sind jetzt genau wie Kampfberichte anklickbar - ein Klick öffnet eine ausführliche Ansicht mit Ressourcen- und Flotten-/Verteidigungstabellen statt eines einzelnen Fließtexts.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Angreifbare Piratenbasen',
    changes: [
      'Piratenbasen sind ab sofort mehr als nur Startpunkte für Raids - 4 der 12 Basen in der Galaxie haben jetzt eine echte, dauerhafte Flotte, Verteidigung und Ressourcen, ganz wie ein Mitspieler.',
      'In der Galaxie-Ansicht zeigt jede angreifbare Basis einen Machtwert an - schickt eine Flotte hin (genau wie beim "Halten"), sie kämpft bei Ankunft gegen die echte Basis-Besatzung und kehrt danach automatisch zurück.',
      'Bei einem erfolgreichen Angriff gibt es Beute (ein Teil der aktuell gelagerten Ressourcen der Basis) UND die Verluste bei Flotte/Verteidigung der Basis bleiben dauerhaft bestehen - ihr schwächt die Basis wirklich.',
      'Die Basen können nicht endgültig zerstört werden, wachsen aber von selbst langsam nach (Ressourcen und ab und zu neue Schiffe/Verteidigung) - lohnt sich also, hin und wieder vorbeizuschauen.',
      'KI-Vega und KI-Nyx greifen die Basen ebenfalls gelegentlich von selbst an.',
      'Ganz unabhängig von den normalen Piratenraids auf eure Heimatbasis - die laufen exakt wie bisher weiter.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu: Belohnungs-Bonus für große Flotten + Raid-Balance korrigiert',
    changes: [
      'Bisher hing die Beute bei Missionen komplett von Sektor-Stufe/Sieges-Serie/Zufall ab - wie viele Schiffe ihr tatsächlich losgeschickt habt, machte für die Belohnung selbst keinen Unterschied (nur für die Gegnerstärke).',
      'Neu: setzt ihr deutlich mehr Flottenstärke ein, als für den Sektor üblich ist, bekommt ihr jetzt einen spürbaren, aber gedeckelten Beute-/Teile-Bonus (bis zu +50%) - gilt für Piraten-Sektoren (Niedrig/Mittel/Hoch) und Elite-Bollwerk.',
      'Beim Piratenadmiral (P10) bleibt es bewusst unverändert - der hat mit "weitermachen für mehr" schon seine eigene Risiko/Belohnung-Mechanik.',
      'Raids: die Gegnerstärke wird nicht mehr ausschließlich aus euren Verteidigungsanlagen berechnet, sondern jetzt aus einer Mischung von 70% eurer Heimatflotte + 30% Verteidigungsanlagen - eure Flotte spielt bei Raids damit wieder eine echte Rolle. Verstärkungs-/Halte-Flotten von Mitspielern zählen bewusst NICHT mit rein (die sollen euch nur helfen, nicht den Raid gegen euch verschärfen), kämpfen im Ernstfall aber weiterhin voll mit.',
      'Dazu passend: die Bergungs-Dunkle-Materie am Ende eines Raids bekommt jetzt ebenfalls den Großflotten-Bonus.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Schiffs-/Verteidigungs-Module günstiger und schneller',
    changes: [
      'Feedback aufgenommen: Module für Schiffe und Verteidigungsanlagen waren gerade bei großen/teuren Typen praktisch nicht mehr machbar - je größer das Schiff, desto extremer der Kosten-/Zeitsprung.',
      'Basiskosten und -Bauzeit pro Modul deutlich gesenkt, und auch der Anstieg von Stufe zu Stufe fällt jetzt sanfter aus - betrifft alle Schiffs- und Verteidigungs-Module gleichermaßen.',
      'Der Imperator als teuerstes Modul im Spiel ist besonders stark betroffen: Stufe 1 kostete bisher 500 Mio. Metall / 400 Mio. Kristall / 250 Mio. Deuterium bei 7 Tagen Basis-Bauzeit - jetzt 50 Mio. / 40 Mio. / 25 Mio. bei 2 Tagen Basis-Bauzeit.',
      'Gebäude-Module (im Forschungsbereich) sind von dieser Anpassung nicht betroffen, nur Schiffe/Verteidigung in der Werft.',
      'Zusätzlich: Bauplätze für Schiffs- und Verteidigungs-Module von je 1 auf je 3 erhöht - es können jetzt bis zu drei Module gleichzeitig gebaut werden, statt strikt nacheinander warten zu müssen.',
      'Baulimits der Spezialschiffe angehoben: Imperator 2→6, Salvenjäger 60→150, Salvenkreuzer 30→90, Salvendreadnought 16→30.',
      'Baulimits der Spezialverteidigung ebenfalls angehoben: Sentinel-Kanone 40→150, Ultimate-Kanone 20→60.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Raids: EIN Sammelbericht statt bis zu 5 Einzel-Nachrichten pro Welle',
    changes: [
      'Ein Piratenraid auf die Heimatbasis (5 Wellen) hat bisher pro Welle eine eigene Kampfbericht-Nachricht verschickt - bei aktiver Verstärkung oder haltenden Flotten sogar mehrfach an mehrere Spieler gleichzeitig.',
      'Läuft jetzt gesammelt: alle 5 Wellen werden intern gesammelt und erst wenn der Raid komplett vorbei ist, bekommt jeder Beteiligte (Verteidiger, Verstärker, haltende Flotten) EINEN Abschlussbericht mit jeder Welle als eigenem aufklappbaren Abschnitt.',
      'Die Vorab-Warnungen ("Piratenaktivität registriert", "Flotte ist gestartet") kommen weiterhin sofort - die bleiben wichtig, um rechtzeitig reagieren zu können.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Piraten-Sektor-Missionen: EIN Sammelbericht statt bis zu 4 Einzel-Nachrichten',
    changes: [
      'Bei einer Piraten-Sektor-Mission (Niedrig/Mittel/Hoch) kam bisher pro Stunden-Check eine eigene Kampfbericht-Nachricht rein - bis zu 4 Stück pro Mission.',
      'Läuft jetzt genau wie bei der Asteroiden-Eskorte: alle Stunden-Checks werden gesammelt und erst bei Rückkehr der Flotte als EIN gemeinsamer Bericht zugestellt, jeder Check als eigener aufklappbarer Abschnitt mit vollem Kampfbericht.',
      'Dadurch taucht eine zurückgekehrte Piraten-Sektor-Flotte jetzt unter "Farm-/Beuteberichte" auf statt unter "Kampfberichte" - dort, wo auch die Asteroiden-Missionen stehen.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Piratenkapitän aufgewertet',
    changes: [
      'Der Piratenkapitän war viel zu schwach - er ging in einer Welle mit vielen anderen Gegnern praktisch immer sofort unter, ohne dass man ihn überhaupt bemerkt hat.',
      'Seine Kampfwerte steigen jetzt mit der Sektorstufe: auf Niedrig/Mittel spürbar zäher als vorher, auf Hoch und im Elite-Bollwerk ist er jetzt genauso stark wie der Imperator - ein echtes Bonus-Ziel, das sich lohnt gezielt anzugreifen.',
      'Die Extra-Belohnung beim Sieg (Container + Dunkle Materie) bleibt unverändert, ihn zu besiegen fühlt sich jetzt aber nach einer echten Leistung an.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Neu in der Galaxie: Ereignisse und Basis-Verlegung',
    changes: [
      'Gelegentlich taucht jetzt an einer freien Position in der Galaxie ein Ereignis auf - ein verlassenes Wrack 🛸 oder ein Handelskonvoi 🚀. Wer zuerst eine Flotte hinschickt, sichert sich die Beute (Ressourcen, beim Konvoi auch etwas Dunkle Materie).',
      'Kein Risiko dabei: kommt man zu spät, war das Ereignis schon vergriffen - die Flotte fliegt einfach leer wieder nach Hause, es geht nichts verloren außer der Flugzeit. Die Flotte kehrt danach automatisch zurück, ein manueller Rückruf ist nicht nötig.',
      'Neu: die eigene Heimatbasis kann jetzt gegen 300 Dunkle Materie gezielt an eine andere freie Position in der Galaxie verlegt werden - praktisch, falls der Startplatz ungünstig zu Sektoren oder zum Mitspieler liegt. Wirkt sofort, Flotte/Verteidigung/Fortschritt bleiben unverändert.',
    ],
  },
  {
    date: '22.07.2026',
    title: 'KI-Mitspieler: gemischte Flotte und Verteidigung',
    changes: [
      'KI-Vega und KI-Nyx haben bisher dauerhaft nur den billigsten Jäger-Typ als Flotte und ausschließlich Raketenwerfer als Verteidigung gebaut, egal wie lange sie schon spielten.',
      'Sie bauen jetzt gemischt: immer der Schiffs-/Verteidigungstyp, von dem sie aktuell am wenigsten besitzen, kommt zuerst dran - dadurch entsteht mit der Zeit eine echte, durchmischte Flotte samt gestaffelter Verteidigung (bis hin zu Schildkuppeln und Spezialkanonen bei ausreichend Ressourcen).',
    ],
  },
  {
    date: '22.07.2026',
    title: 'Piraten-Sektoren: Balance-Anpassung',
    changes: [
      'Solo-Piraten-Missionen (Niedrig/Mittel/Hoch) fühlten sich zu einfach an - Gegner blieben immer bei maximal eurer eigenen Flottenstärke, und die Hälfte der Stunden-Checks brachte gar keinen Feindkontakt.',
      'Angepasst, gestaffelt nach Stufe: Niedrig bleibt bewusst die sanfteste Einstiegsstufe (nur etwas häufiger Feindkontakt). Mittel wird spürbar fordernder. Hoch kann jetzt auch mal stärker sein als die eigene Flotte - die höchste Solo-Stufe soll sich nach echtem Risiko anfühlen.',
      'Kampf-Ausreißer und Sonder-Ereignisse (Nebel, Ionensturm, Trümmerfeld, ...) kommen auf Mittel/Hoch jetzt häufiger vor - mehr Abwechslung von Kampf zu Kampf.',
      'Belohnungen dafür angehoben: mehr Beute pro Sieg, höhere Sieg-Serien-Boni auf Mittel/Hoch, mehr Ressourcen in Silber-/Gold-/Elite-Containern, mehr Belohnung für abgewehrte Piraten bei der Asteroiden-Eskorte.',
      'Elite-Bollwerk (Multiplayer) leicht nachgezogen, damit der Abstand zur neuen Hoch-Stufe erhalten bleibt - bleibt weiterhin gut zu zweit/mehreren spielbar, keine große Extra-Härte.',
      'Raids (automatische Heimatverteidigung) etwas häufiger und die Wellen etwas stärker, passend zum neuen Schwierigkeitsniveau.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Imperator abgeschwächt',
    changes: [
      'Der Imperator war zu stark - er hat allein in 4 Runden über 2 Milliarden Schaden ausgeteilt und Kämpfe beendet, ohne dass andere Schiffe noch etwas beitragen mussten.',
      'Neue Werte: Waffen 500.000 (vorher 5.000.000), Schild 400.000 (vorher 2.500.000), Panzerung 3.000.000 (vorher 12.000.000).',
      'Er bleibt bewusst sehr widerstandsfähig (deutlich mehr Panzerung als jedes andere Schiff), sein Waffenschaden ist aber jetzt deutlich moderater.',
      'Baulimit (2 Stück) und Spezialteile-Kosten bleiben unverändert.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Forschungsbaum: Mobil-Fix',
    changes: [
      'Bei Forschungen mit mehreren Zweigen (z.B. Schiffbau-Reduktion, Antriebstechnik) wurde der letzte Zweig auf schmalen Handy-Bildschirmen manchmal am Rand abgeschnitten statt scrollbar zu sein - jetzt lässt sich die Zeile gezielt seitlich wegwischen.',
      'Statistik-Seite und Info-Popups: bei langen Zeilen-Bezeichnungen wurde der Wert daneben teils in einzelne Wörter zerrissen (z.B. "4 / 59 / 12" jeweils auf eigener Zeile) - jetzt teilen sich Bezeichnung und Wert die verfügbare Breite fair.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'KI-Mitspieler repariert: bauen, forschen, verteidigen jetzt wirklich',
    changes: [
      'Großer Bugfix: KI-Vega und KI-Nyx haben bisher praktisch nichts produziert - ihre Ressourcen standen immer still, Bau- und Forschungsaufträge sind nie fertig geworden.',
      'Dadurch hatten sie auch nie eine nennenswerte Flotte oder Verteidigung, kamen euch nie mit haltenden Flotten zu Hilfe und konnten nie an Elite-Bollwerk-Expeditionen teilnehmen.',
      'Ist jetzt behoben - KI-Spieler bauen, forschen, verteidigen sich und schließen sich Expeditionen an wie ein echter Mitspieler.',
      'Sie wählen jetzt außerdem beim ersten Zug eine zufällige Klasse, statt für immer ohne Klassen-Bonus dazustehen.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Forschung: eigene Tabs für jeden Bereich',
    changes: [
      'Die vier Forschungsbereiche (Waffensysteme, Verteidigungssysteme, Antriebstechnik, Wirtschaft & Logistik) sind jetzt eigene Untertabs statt alle untereinander auf einer Seite - übersichtlicher, und es ist Platz für künftige neue Forschungen.',
      'Gebäude bleibt unverändert als eigener Untertab daneben bestehen.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Container-Überarbeitung: weniger Flut, klarere Chancen',
    changes: [
      'Container stapeln sich jetzt im Inventar (z.B. "Silber-Container × 3") statt als viele Einzelkarten aufzutauchen.',
      'Einlösbare Belohnungen sind im Inventar jetzt nach Kategorie gruppiert (Rohstoffe, Dunkle Materie, Ausrüstungs-Teile, Zeit-Gutscheine, Geschenkte Schiffe) statt einer einzigen langen Liste.',
      'Neue Zieh-Mechanik: jede Belohnungskategorie (Rohstoffe, Dunkle Materie, Ausrüstungs-Teile, Zeit-Gutschein, Geschenkte Schiffe) hat jetzt eine eigene, unabhängige Chance - ihr bekommt aber immer genau 2 Belohnungen pro Öffnung.',
      'Raids finden nur noch alle 12 Stunden statt (vorher alle 6 Stunden).',
      'Belohnung bei perfekt abgewehrtem Raid (5/5 Wellen) geändert: fest 4 Silber- + 1 Gold-Container, plus 15% Chance auf zusätzlich 1 Elite-Container. Elite-Container sind jetzt überall reine Glückssache.',
      'Die Geschenkte Elite-Flotte und der Elite-Jackpot enthalten keine Salvenkreuzer mehr.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Piraten werden zäher: 50% eurer Forschung',
    changes: [
      'Piraten und andere NPC-Gegner (Sektor-Missionen, Raids, Elite-Bollwerk, Piratenadmiral) profitieren jetzt von 50% eurer Forschung - vorher hatten sie überhaupt keine.',
      'Betrifft alle Forschungs-Effekte: Waffen-/Schild-/Panzerungtechnik, Präzision, Ausweichen, Kritische Treffer, Zielerfassung, Schild-Regeneration, Durchschlag.',
      'Klassen-Bonus, Schiffs-/Verteidigungs-Module und der Kampf-Booster bleiben davon unberührt - die bringen weiterhin nur euch etwas.',
      'Bei gemeinsamen Kämpfen mit mehreren Teilnehmern (Elite-Bollwerk, Raid-Verstärkung/haltende Flotten) zählt der Durchschnitt der Forschung aller Beteiligten.',
      'Der Kampfsimulator berücksichtigt das automatisch mit, eure Vorhersagen bleiben also weiterhin zuverlässig.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Werft-Umbau: Verteidigung integriert, neue Anlagen, Verteidigungs-Module',
    changes: [
      'Die Werft hat jetzt zwei Haupttabs: "Schiffe" und "Verteidigung". Die eigenständige Verteidigung-Seite ist damit weg, alles läuft jetzt über die Werft.',
      '"Spezialschiffe" (Salvenschiffe + Imperator) ist jetzt ein gleichrangiger Klassen-Tab neben Jäger-/Kreuzer-/Elite-Klasse, kein eigener Haupttab mehr.',
      'Verteidigung ist jetzt genau wie Schiffe nach Klassen unterteilt: Leichte Verteidigung (Raketenwerfer, Leichtes/Schweres Lasergeschütz), Schwere Verteidigung (Gauß-Kanone, Ionengeschütz, Plasmawerfer), Schild (alle drei Kuppeln) und Spezialverteidigung.',
      'Zwei neue Verteidigungsanlagen: Sentinel-Kanone und Ultimate-Kanone - beide mit Mehrfachziel-Salve wie die Salvenschiffe, treffen bei Zielerfassung gleich mehrere Gegnertypen auf einmal.',
      'Neue, deutlich stärkere dritte Schildkuppel: die Gigant-Schildkuppel (im Schild-Tab).',
      'Jede Verteidigungsanlage kann jetzt eigene Waffen-, Schild- und Panzerung-Module ausbauen (kein Antrieb, Verteidigung bewegt sich ja nicht) - genau wie bei Schiffen, direkt unter der jeweiligen Karte.',
      'Der Imperator zeigt seinen Spezialteile-Bestand jetzt im Info-Popup an statt in einer eigenen Box.',
      'Nebenbei drei Bugs behoben: die neuen Spezial-Verteidigungsanlagen UND die neue Gigant-Schildkuppel wären sonst in generierten Piraten-/Raid-Verteidigungen aufgetaucht; der gemeinsame Schildkuppel-Pool hat bisher weder vom Klassen-Bonus noch vom Kampf-Booster profitiert.',
      'Außerdem: der Bauen-Button für limitierte Schiffe/Anlagen (z.B. Imperator, Salvenschiffe, Sentinel-/Ultimate-Kanone, Schildkuppeln) blieb teils anklickbar, obwohl das Limit inklusive unterwegs befindlicher oder in der Warteschlange stehender Einheiten schon erreicht war - jetzt korrekt gesperrt.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Imperator: deutlich stärker, kämpft jetzt auch bei Raids mit',
    changes: [
      'Waffen, Schild und Panzerung des Imperators liegen jetzt alle im Millionen-Bereich (vorher war nur die Panzerung so hoch, Waffen/Schild lagen kaum über normalen Kampfschiffen).',
      'Bug behoben: der Imperator hat bei Raids (Verteidigung eurer Heimatbasis) bisher nie mitgekämpft, egal wie viele ihr besessen habt. Bei Piraten-Sektoren, Elite-Bollwerk und Piratenadmiral war er dagegen schon immer einsetzbar - jetzt auch bei Raids.',
      'Baulimit (2 Stück) und Spezialteile-Kosten bleiben unverändert.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Werft: Spezialschiffe-Tab und Schiffs-Module',
    changes: [
      'Neuer Werft-Untertab "Spezialschiffe": die drei Salvenschiffe und der Imperator sind jetzt hier gebündelt statt verstreut in den normalen Klassen-Listen bzw. im Shop.',
      'Der Imperator wird ab sofort nur noch in der Werft gebaut (Shop > Spezialteile ist entfallen) - Spezialteile-Inventar und Baubutton sind mit umgezogen.',
      'Jedes Kampfschiff (und der Imperator) kann jetzt eigene Waffen-, Schild-, Panzerung- und Antriebs-Module bis Stufe 10 ausbauen - direkt unter der jeweiligen Schiffskarte, egal ob in der normalen Werft-Liste oder bei den Spezialschiffen. Wirkt nur auf diesen einen Schiffstyp, stapelt sich mit Forschung, Klassen-Bonus und Kampf-Booster.',
      'Waffen/Schild/Panzerung geben +3% pro Stufe (max. +30%), Antrieb +2% pro Stufe (max. +20%). Alle Schiffs-Module teilen sich einen gemeinsamen Bauplatz, unabhängig von den 3 normalen Schiffs-Bauplätzen.',
      'Mining-Schiff und Begleitschiff bekommen keine Module.',
    ],
  },
  {
    date: '21.07.2026',
    title: 'Klassensystem: Kanonier, Bollwerk, Kommandant',
    changes: [
      'Neuer Tab "Klasse": Jeder Spieler wählt einmalig kostenlos eine von drei reinen Kampf-Klassen. Ohne Wahl geht es nicht weiter - das betrifft auch alle Bestandsspieler.',
      'Kanonier: +100% Waffenschaden (Schild/Panzerung unverändert), +25% Flottengeschwindigkeit, 10% günstigere Schiffs-Baukosten. Tötet am schnellsten, hält am wenigsten aus.',
      'Bollwerk: +50% Schild UND +50% Panzerung (Waffenschaden unverändert), 25% günstigere Verteidigungsanlagen-Baukosten, Verteidigung repariert sich nach Kämpfen zu 90% statt 70%. Hält am längsten durch, braucht aber länger für den Sieg.',
      'Kommandant: +33% auf Waffen/Schild/Panzerung gleichermaßen, 10% günstigere Schiffs- UND Verteidigungs-Baukosten, +15% Flottengeschwindigkeit. Der Allrounder ohne Schwäche, aber auch ohne Glanzpunkt.',
      'Die Klasse kann jederzeit gegen 500 Dunkle Materie gewechselt werden - kein Cooldown, aber bewusst teuer.',
      'Nebenbei behoben: der 24h-Kampf-Booster aus dem Shop (+20% Waffen/Schild/Panzerung) hatte bisher gar keine Wirkung. Ist jetzt in jedem Kampf aktiv, wenn er läuft.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Raids kommen jetzt in 5 Wellen',
    changes: [
      'Ein Piratenraid ist nicht mehr ein einzelner Kampf bei Ankunft, sondern 5 Angriffswellen im Abstand von ungefähr 15 Minuten, die innerhalb einer Stunde nach Ankunft der Piratenflotte komplett abgeschlossen sind.',
      'Die Stärke der Angreifer richtet sich jetzt nach eurer Verteidigungsanlagen-Stärke (nicht mehr nach eurer Flotte) und steigt von Welle zu Welle: 70% in Welle 1 bis 110% in Welle 5.',
      'Verluste aus früheren Wellen bleiben bestehen, eure Verteidigung erholt sich nicht zwischen den Wellen (der Reparatur-Bonus nach jedem Kampf wirkt weiterhin).',
      'Wird eure Verteidigung zwischendurch komplett aufgerieben, laufen die restlichen Wellen ohne weiteren Kampf durch - ihr bekommt dafür keine einzelne Nachricht pro leerer Welle.',
      'Belohnung gibt es nicht mehr pro Welle einzeln, sondern erst am Ende: ein Container pro erfolgreich abgewehrter Welle. Schlagt ihr alle 5 Wellen zurück, werden alle Container zu Gold aufgewertet UND es gibt zusätzlich einen Elite-Container obendrauf.',
      'Kopfleiste, Sektor- und Galaxie-Seite zeigen jetzt an, in welcher Welle sich ein laufender Raid gerade befindet.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Zeit-Gutscheine für Bauzeit aufgeteilt: Schiffe, Verteidigung, Gebäude',
    changes: [
      'Der bisherige "Zeit-Gutschein Bau" wirkte nur auf Schiffe. Jetzt gibt es ihn getrennt für Schiffe, Verteidigung und Gebäude - im Shop und als Container-Belohnung.',
      'Gutscheine für Schiffe und Verteidigung wirken jetzt auf ALLE gerade laufenden Bauaufträge dieser Kategorie gleichzeitig (bis zu 3 parallele Bauplätze), nicht mehr nur auf den ersten - genau wie es beim Forschungs-Gutschein schon war.',
      'Gebäude haben ohnehin nur einen Bauplatz, dort ändert sich an der Wirkung nichts, nur die Auswahl im Shop/Inventar ist jetzt eindeutig.',
      'Bereits vorhandene alte "Zeit-Gutschein Bau"-Exemplare in eurem Inventar bleiben gültig und wirken weiterhin auf Schiffe.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Neu: Sektor P10 – Piratenadmiral (Boss-Gefecht)',
    changes: [
      'Zweiter Multiplayer-Sektor: ein einzelner, extrem zäher Piratenadmiral + kleine Elite-Eskorte statt vieler Gegner - nur Kreuzer-Klasse und größere Schiffe erlaubt.',
      'Bis zu 6 Kämpfe im 10-Minuten-Abstand. Nach jedem gewonnenen Kampf: Beute sichern und abziehen, oder weitermachen für mehr - der Admiral wird dabei mit jedem Check +15% stärker.',
      'Bei einer Niederlage nach "weitermachen" geht nur die noch ungesicherte Beute verloren, nicht die Flotte.',
      'Bei echtem Sieg über den Admiral: große Einmalprämie plus exklusiver Dunkle-Materie-Bonus.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Notruf-Events endgültig entfernt',
    changes: [
      'Notruf-Events sind jetzt komplett aus dem Spiel entfernt (waren zuvor bereits pausiert) - dafür gibt es wieder unbegrenzt viele Jäger bei Piraten-Angriffen und die KI-Mitspieler sind zurück.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Server umgezogen',
    changes: [
      'Der Server läuft jetzt auf deutlich stärkerer Hardware (8x mehr Rechenleistung, 16x mehr Arbeitsspeicher) - sollte die bisherigen gelegentlichen Serverausfälle bei großen Kämpfen endgültig beheben.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Piratenflotten: Jäger-Massen begrenzt',
    changes: [
      'Piraten-/Notruf-Flotten können nicht mehr unbegrenzt viele Leichte/Schwere Jäger stellen (max. 500 pro Typ) - der Rest ihrer Stärke verteilt sich stattdessen auf größere Schiffe. Sollte weitere Server-Überlastungen bei besonders starken Angriffswellen verhindern. Betrifft nicht eure eigenen Flotten, die bleiben unverändert unbegrenzt.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Weitere Server-Performance-Verbesserung',
    changes: [
      'Kampfberechnungen laufen jetzt über wiederverwendete Hintergrund-Prozesse statt für jeden Kampf neue zu erzeugen - sollte kurzzeitige Speicher-/CPU-Spitzen weiter reduzieren, besonders bei einzelnen Kämpfen.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Neu: Gebäude-Module',
    changes: [
      'Gebäude bekommen jetzt Module, ähnlich wie der Forschungsbaum - jedes Modul verbessert einen bestimmten Aspekt seines Gebäudes zusätzlich (z.B. mehr Ertrag, weniger Energieverbrauch, kürzere Bauzeit).',
      'Module schalten sich erst frei, wenn das jeweilige Gebäude eine bestimmte Mindeststufe erreicht hat (Minen/Solarkraftwerk Stufe 20, Roboterfabrik Stufe 10, Nanitenfabrik Stufe 5).',
      'Wirken zusätzlich zur bestehenden Forschung, nicht als Ersatz.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Fehlerbehebung: falsche Schiffsnamen in Auswahllisten',
    changes: [
      'In einigen Flottenauswahl-Listen (Sektor, Notruf, Kampfbericht) stand die interne Schiffsbezeichnung (z.B. "schwer") statt des richtigen Namens ("Schwerer Jäger") - jetzt überall korrekt.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Kampf-Engine deutlich beschleunigt',
    changes: [
      'Kampfberechnungen laufen jetzt ca. 2-2,5x schneller, besonders spürbar bei großen Flotten - hilft gegen Server-Überlastung, wenn eure Flotten weiter wachsen.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Elite-Bollwerk: garantierte Kämpfe + Abschluss-Bonus',
    changes: [
      'Alle 4 Stunden-Kämpfe im Elite-Bollwerk finden jetzt garantiert statt (vorher nur 50% Chance pro Stunde).',
      'Neuer Abschluss-Bonus: schafft ihr alle 4 Kämpfe ohne einen einzigen Rückschlag, wird die gesamte Ressourcen-Ausbeute der Expedition am Ende nochmal komplett verdoppelt - bis zu 1,5 Milliarden Ressourcen für eine perfekte Serie.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Zurück zu einem einzigen Hintergrundbild',
    changes: [
      'Die unterschiedlichen Hintergrundbilder pro Seite bereiteten weiter Probleme - zurück zu einem einzigen, festen Hintergrundbild für die ganze App.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Geschwindigkeit im Schiffs-Info sichtbar',
    changes: [
      'Das Info-Popup jedes Schiffs zeigt jetzt auch Geschwindigkeit und Antriebsklasse an (vorher gar nicht einsehbar).',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Hintergrundbilder verkleinert',
    changes: [
      'Alle Hintergrundbilder sind jetzt rund 10x kleiner (komprimiert) - Seitenwechsel sollten dadurch spürbar schneller und ohne Aufblitzen laden.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Fehlerbehebung: weißes Aufblitzen beim Seitenwechsel',
    changes: [
      'Hintergrundbilder werden jetzt vorgeladen, statt beim Seitenwechsel kurz weiß/leer zu bleiben, bis das neue Bild nachgeladen ist.',
    ],
  },
  {
    date: '19.07.2026',
    title: 'Server-Stabilität: Maßnahmen gegen Abstürze',
    changes: [
      'Die KI-Mitspieler sind vorerst wieder entfernt - der Server war auf dem aktuellen Tarif nicht dafür ausgelegt.',
      'Notruf-Events pausiert - lösen vorerst nicht mehr neu aus (bereits laufende Notrufe werden aber normal zu Ende geführt).',
      'Raids laufen jetzt garantiert statt zufällig, dafür für beide Spieler zu unterschiedlichen, festen Uhrzeiten (0 Uhr bzw. 3 Uhr, danach im 6-Stunden-Takt) - damit nie wieder zwei Kämpfe gleichzeitig ablaufen.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Neu: Forschungsbaum',
    changes: [
      'Die Forschung ist jetzt ein echter Baum mit Verbindungslinien statt einer einfachen Liste - 4 Hauptbereiche (Waffensysteme, Verteidigungssysteme, Antriebstechnik, Wirtschaft & Logistik), viele Zweige schalten sich erst frei, wenn die Basis-Forschung Stufe 3 erreicht hat.',
      '8 neue Forschungen: drei Antriebsklassen (Raketen-/Impuls-/Hyperraumantrieb, je nach Schiffstyp), zwei Mining-Spezialisierungen (nur Schiffe / nur Minen) und drei Bauzeit-Spezialisierungen (nur Gebäude / nur Schiffe / nur Verteidigung) - alle stapeln zusätzlich zu den bestehenden Basis-Forschungen.',
      'Jede Forschungskarte zeigt jetzt nur noch Bild, Name und Stufe - alle Details (Kosten, Effekt, Voraussetzungen) stecken in einem Info-Popup.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Überarbeitetes Design: schlankere Oberfläche',
    changes: [
      'Ressourcenleiste bleibt oben über die volle Breite, die Seitenleiste fest links - der Hauptbereich hat jetzt eine feste, zentrierte Breite, sodass rundherum sichtbar Hintergrund bleibt.',
      'Deckkraft insgesamt deutlich reduziert - das Hintergrundbild kommt jetzt klar zur Geltung.',
      'Karten (Schiffe, Warteschlangen usw.) sind jetzt transparenter, bleiben aber gut lesbar.',
      'Jede Seite kann künftig ihr eigenes thematisches Hintergrundbild bekommen (Werft, Forschung, Sektor, Galaxie, Multiplayer, Händler sind schon dabei) - wird nach und nach ergänzt.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Neue Forschung: Antriebstechnik',
    changes: [
      'Neue Forschung "Antriebstechnik" verkürzt alle Flugzeiten in der Galaxie um 3% pro Stufe - bei voll ausgebauter Stufe 10 also 30% schneller unterwegs (Sektor-Missionen, Notruf, Halten, Elite-Bollwerk).',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Fehlerbehebung: Sektor-Tab stürzte ab',
    changes: [
      'Bug behoben, durch den die App beim Wechsel zwischen "Asteroiden-Feld" und "Piraten-Sektor" im Sektor-Tab abstürzte (kurz sichtbar, dann verschwunden) - das sollte jetzt zuverlässig funktionieren.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Sichtbare Fehleranzeige bei Abstürzen',
    changes: [
      'Falls die App doch einmal abstürzt, wird jetzt eine Fehlermeldung direkt auf dem Bildschirm angezeigt statt eines leeren/verschwindenden Bildschirms - hilfreich für die Fehlersuche, besonders ohne Zugriff auf Entwicklertools.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Fehlerbehebung: Server startete nicht mehr',
    changes: [
      'Bug behoben, durch den der Server beim Start abstürzte, wenn das Datenverzeichnis fehlte (z.B. nach einem Redeploy) - der Server legt das Verzeichnis jetzt automatisch an, falls nötig.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Neu: Zwei KI-Mitspieler',
    changes: [
      'Zwei KI-Spieler ("KI-Vega" und "KI-Nyx") sind jetzt Teil der Galaxie - sie bauen Gebäude aus, forschen, bauen Schiffe und Verteidigung, schicken Mining-Flotten zu Asteroiden-Feldern und nehmen an gemeinsamen Elite-Bollwerk-Expeditionen teil (können euch einladen oder eure Einladungen annehmen).',
      'Beide unterliegen exakt denselben Kosten, Bauzeiten und Flugzeiten wie echte Spieler - kein Vorteil, keine Abkürzung.',
      'Die KI-Spieler schicken euch gelegentlich von sich aus eine Teilflotte zum "Halten", die euch dann automatisch bei Piratenraids verteidigen hilft.',
      'In der Galaxie-Ansicht sind KI-Spieler mit 🤖 gekennzeichnet.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Fehlerbehebung: Popups nicht mehr von der Kopfleiste verdeckt',
    changes: [
      'Kampfberichte, Info-Popups und Lore-Ansichten wurden am oberen Rand teilweise von der Ressourcenleiste überdeckt - das ist jetzt behoben, alle Popups werden vollständig sichtbar angezeigt.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Fehlerbehebung: Raids und Notrufe lösten kaum noch aus',
    changes: [
      'Bug behoben, durch den Piratenraids und Notruf-Events bei aktivem Spielen praktisch nie mehr ausgelöst wurden - beide sollten jetzt zuverlässig zu ihren Check-Zeiten auftauchen.',
      'Check-Zeiten laufen jetzt in deutscher Ortszeit statt UTC: Raid um 0/6/12/18 Uhr, Notruf um 3/9/15/21 Uhr - beide wechseln sich im 3-Stunden-Rhythmus ab, statt gleichzeitig zu starten.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Raid-Hilfe entfernt – "Halten" ist jetzt der einzige Weg zu helfen',
    changes: [
      'Die alte Raid-Hilfe (Flotte für 1 Minute zu einem laufenden Angriff schicken, kehrt danach automatisch heim) gibt es nicht mehr - sie war überflüssig, seit haltende Flotten automatisch mitverteidigen.',
      'Der Raid-Hilfe-Tab zeigt jetzt nur noch, wer gerade angegriffen wird (mit Position und Anzahl bereits dort haltender Flotten) und bringt dich per Klick direkt zur richtigen Stelle in der Galaxie-Ansicht.',
      'Neuer Bereich "Eingehende Flotten" in der Galaxie-Ansicht: zeigt dir jede fremde Flotte, die gerade zu dir unterwegs ist oder bei dir hält - mit Absender, Herkunft und exaktem Inhalt (per Klick aufklappbar). Ein ankommender Piratenraid wird dort ebenfalls mit Herkunft und Zeit angezeigt, der Flotteninhalt bleibt wie gewohnt bis zur Ankunft unbekannt.',
      'Flottenbewegungen zeigen jetzt überall auch die Herkunft an, nicht nur das Ziel - inklusive gemeinsamer Elite-Bollwerk-Expeditionen, die jetzt ebenfalls dort auftauchen.',
      'Anflugzeit-Vorschau ergänzt: Sektor-Karten, der Notruf und Elite-Bollwerk-Expeditionen zeigen jetzt vorab an, wie lange der Flug dauern wird, bevor du dich festlegst.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Elite-Bollwerk und Notruf jetzt auch in der Galaxie',
    changes: [
      'Notruf-Events sind jetzt nur noch solo lösbar - dafür fliegt deine Flotte wirklich zur Notruf-Position, der Kampf entscheidet sich erst bei Ankunft. Die Zeit zum Losschicken wurde von 60 auf 90 Minuten verlängert, damit für die Flugzeit noch genug Puffer bleibt.',
      'Elite-Bollwerk-Expeditionen laufen jetzt realistischer ab: eingeladene Mitspieler fliegen zuerst zu dir, und erst wenn alle eingetroffen sind, geht es gemeinsam weiter zum Bollwerk.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Piratenraids und Sektor-Flüge mit echten Distanzen',
    changes: [
      'Piraten greifen jetzt von einer von zwölf festen Basen in der Galaxie aus an - du siehst, von wo sie kommen. Nach der einstündigen Vorwarnzeit brauchen sie zusätzlich echte Flugzeit, abhängig von der Entfernung zu dir.',
      'Asteroiden-Felder und Piraten-Sektoren haben jetzt feste Positionen in der Galaxie - Hin- und Rückflug dauern entsprechend der tatsächlichen Entfernung, nicht mehr pauschal eine Minute.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Neu: Galaxie-Ansicht',
    changes: [
      'Neue Seite "Galaxie" in der Seitenleiste: jeder Spieler hat eine feste Position (Format Galaxie:System:Position, z.B. 1:25:3) in einer Galaxie mit 50 Systemen à 9 Positionen.',
      'Kein PvP: Flotten können bei anderen Spielern nicht angreifen, aber "gehalten" werden – sie fliegen hin und bleiben dort stationiert, bis du sie zurückrufst.',
      'Schiffe haben jetzt eine Geschwindigkeit und einen Treibstoffverbrauch (an OGame angelehnt) – Entfernung und Schiffsgeschwindigkeit bestimmen die Flugzeit, Hin- und Rückflug kosten jeweils Deuterium.',
      'Neuer Bereich "Flottenbewegungen" auf der Galaxie-Seite: zeigt alle eigenen unterwegs befindlichen und haltenden Flotten mit Status, Restzeit und Rückruf-Button; die genaue Schiffszusammensetzung lässt sich per Klick aufklappen.',
      'Haltende Flotten bei einem anderen Spieler unterstützen diesen jetzt automatisch, wenn dessen Basis von Piraten überfallen wird (Notruf-Events sind davon bewusst noch ausgenommen, das folgt später) – Verluste und Belohnungen werden fair zwischen allen Beteiligten abgerechnet, ohne Aufteilung.',
    ],
  },
  {
    date: '18.07.2026',
    title: 'Neues System: Gebäude',
    changes: [
      'Sechs neue Gebäude eingeführt: Metallmine, Kristallmine, Deuterium-Synthetisierer, Solarkraftwerk, Roboterfabrik, Nanitenfabrik – zu finden im Forschungs-Bereich unter dem neuen Untertab "Gebäude".',
      'Minen produzieren jetzt passiv Ressourcen pro Stunde, auch während du nicht eingeloggt bist – vorher kamen Ressourcen ausschließlich aus Mining-Schiffen auf Expedition.',
      'Neues Energie-System: die drei Minen verbrauchen Energie, das Solarkraftwerk liefert sie. Reicht die Energie nicht, produzieren alle Minen anteilig gedrosselt statt auf voller Leistung – im Gebäude-Tab jederzeit als "Erzeugt/Verbraucht" einsehbar.',
      'Roboterfabrik und Nanitenfabrik verkürzen Bauzeiten: Roboterfabrik senkt Gebäude-Bauzeit um 25% pro Stufe und Schiffs-/Verteidigungs-Bauzeit um 1% pro Stufe, Nanitenfabrik um 50% bzw. 2% pro Stufe – beide Effekte stapeln sich.',
      'Bestehende Mining-Effizienz-Forschung wirkt jetzt zusätzlich auf die Minen-Produktion, nicht mehr nur auf Mining-Schiffe.',
      'Gebäude teilen sich bewusst nur einen einzigen Bauplatz (anders als Schiffe/Verteidigung mit mehreren Slots) – es kann immer nur ein Gebäude gleichzeitig ausgebaut werden.',
    ],
  },
  {
    date: '17.07.2026',
    title: 'Großes Update: Kampf, Belohnungen & Übersicht',
    changes: [
      'Forschung lohnt sich jetzt wieder: Waffen-/Schild-/Panzerungstechnik macht die Piraten nicht mehr automatisch mit stärker. Gegnerstärke basiert nur noch auf reinen Grundwerten – deine Forschung ist ein echter Vorteil, überall (Piraten-Sektoren, Notruf-Events, Raids, Elite-Bollwerk).',
      'RapidFire neu geordnet: Jäger wurden vorher von viel zu vielen Schiffstypen gleichzeitig gejagt. Jetzt hat jede Schiffsklasse höchstens ein bis zwei klare "Beute"-Ziele – Schlachtkreuzer bleibt der einzige echte Jäger-Zerleger.',
      'Rückzug fairer gemacht: Die Flotte zieht sich jetzt zurück, wenn die tatsächliche Kampfkraft auf 50% fällt – nicht mehr nur nach Stückzahl. Viele billige Jäger + wenige starke Kapitalschiffe brechen den Kampf nicht mehr unnötig früh ab.',
      'Salvenschiffe (Salvenjäger/-kreuzer/-dreadnought): Baulimit verdoppelt, dafür auch die Kosten pro Stück verdoppelt – mehr Exemplare möglich, ohne dass die Gesamt-Feuerkraft am Limit außer Kontrolle gerät.',
      'Server läuft jetzt auch weiter, wenn niemand eingeloggt ist: Raids, Notruf-Events und Multiplayer-Expeditionen laufen automatisch im Hintergrund weiter, nicht mehr nur wenn zufällig gerade jemand online ist.',
      'Neue Warn-Hinweise oben in der Kopfleiste: Eigener Raid, eigener Notruf UND jetzt auch ein Hinweis, wenn bei einem ANDEREN Spieler gerade ein Raid läuft – ein Klick führt direkt zur Verstärkungs-Hilfe.',
      'Neue Elite-Container-Stufe (💎) über Gold – exklusiv vom Piratenkapitän im Elite-Bollwerk. Plus: kleine Chance (5%) auf einen Jackpot-Bonus bei jeder Container-Öffnung.',
      'Silber- und Gold-Container deutlich wertvoller gemacht (Rohstoffe, Teile, Zeit-Gutscheine, geschenkte Flotten ca. 1,5-2x höher als vorher).',
      'Elite-Bollwerk-Feindstärke von 150% auf durchschnittlich 120% gesenkt (mit spürbarer Schwankung von Kampf zu Kampf statt einem fixen Wert).',
      'Forschungstempo erhöht: 4 gleichzeitige Forschungen statt 2. Zeit-Gutscheine aus Containern wirken jetzt auf ALLE laufenden Forschungen gleichzeitig, nicht mehr nur auf die erste.',
      'Piraten-Sektoren, Raids, Notruf-Events und Elite-Bollwerk fühlen sich nicht mehr alle gleich an: unterschiedliche Gegner-Zusammensetzungen (mal viele kleine Schiffe, mal wenige starke), gelegentliche Ausreißer nach oben oder unten, und seltene Sonderbedingungen (z.B. Nebel, Ionensturm), die einen einzelnen Kampf spürbar beeinflussen können – wird im Kampfbericht immer angezeigt.',
      'Belohnungen steigen jetzt mit einer Sieges-Serie: Je länger du in einer Mission am Stück gewinnst, desto mehr Beute und Teile gibt es (Niedrig +10%/Sieg, Mittel +20%, Hoch +35% – jeweils gedeckelt). Im Elite-Bollwerk verdoppelt sich die Belohnung sogar mit jedem Sieg in Folge, bei einer Basis von 50 Millionen Ressourcen.',
      'Notruf-Events geben jetzt nur noch bei echtem Sieg eine Belohnung, dafür 1-3 Container auf einmal statt nur einem.',
      'Raids geben bei vollständiger Abwehr ebenfalls 1-3 Container, plus einen neuen Bergungs-Bonus an Dunkler Materie für jedes vernichtete Piratenschiff.',
      'Flotte (Bestand) ist jetzt nach Schiffsklassen sortiert. Sektor-Karten zeigen direkt, wie viele Schiffe dort gerade im Einsatz sind.',
      'Händler-Bereich (Ressourcentausch + Schrotthändler) optisch überarbeitet – Icon-Auswahl statt Dropdowns, Bilder-Karten statt reiner Textlisten, Live-Vorschau bei Erstattungen.',
      'Multiplayer-Übersicht aufgeräumt: lesbare Schiffs- und Sektor-Namen statt interner Kürzel, klar getrennte Bereiche für "wartet auf Zusagen" und "läuft gerade".',
      'Sektor-Info-Fenster farblich überarbeitet – Piraten-Schiffe und Verteidigungsanlagen sind jetzt auf einen Blick unterscheidbar, wichtige Zahlen farblich hervorgehoben.',
      'Salvenschiffe wurden bei der Gegnerstärke-Berechnung deutlich unterschätzt (eine reine Salvenschiff-Flotte bekam einen viel zu schwachen Gegner) – behoben, jetzt wird ihre tatsächliche Feuerkraft fair berücksichtigt.',
      'Neue Statistik-Seite: eigene Erfolge (Missionen, Kämpfe, Beute, gebaute Schiffe, Forschungen u.v.m.) plus eine Bestenliste im Vergleich zu allen Mitspielern – zu finden unter "Statistik" in der Seitenleiste.',
      'Dunkle-Materie-Ausbeute bei Asteroiden-Feldern korrigiert: war noch auf die alte 4-Stunden-Missionsdauer kalibriert, obwohl die Einsätze längst 12 Stunden laufen – die DM-Menge pro Einsatz wurde jetzt verdreifacht (Niedrig 5→15, Mittel 10→30, Hoch 15→45), damit die Ausbeute pro Stunde wieder stimmt.',
      'Spionage-Forschung vorerst gesperrt: ihr bisheriger Effekt wurde durch die neuen Wellen-Profile kaum noch spürbar. Bleibt sichtbar im Forschungsbaum, ist aber für spätere Erweiterungen vorbereitet, statt aktuell wirkungslos Ressourcen zu kosten.',
      'Verteidigungsanlagen deutlich zäher gemacht (Schild und Panzerung spürbar erhöht, Waffen bleiben wie sie waren) – sie sollen die Basis standhaft verteidigen, nicht nur mitkämpfen. Damit das nicht automatisch stärkere Raids anzieht, zählt die Verteidigung jetzt nicht mehr zur berechneten Angriffsstärke, wirkt im Kampf selbst aber weiterhin voll.',
      'Fehler behoben, der dazu führen konnte, dass über längere Zeit gar keine Raids/Notruf-Events mehr ausgelöst wurden: ein Problem bei einem Spieler konnte die Prüfung für alle anderen Spieler dauerhaft blockieren. Jeder Spieler wird jetzt unabhängig von den anderen geprüft.',
      'Schildkuppeln nachträglich mit angepasst: nach der Verteidigungsanlagen-Überarbeitung war ihr gemeinsamer Schild-Puffer gegenüber den jetzt viel stärkeren Einzelschilden komplett bedeutungslos geworden – deutlich angehoben, damit er wieder als echter Schutz für die gesamte Verteidigungslinie wirkt.',
      'Kampfberichte zeigen jetzt zusätzlich "Schaden ausgeteilt" – vorher gab es nur "Schaden" (in Wirklichkeit erlittener Schaden), was leicht mit der eigenen Feuerkraft verwechselt werden konnte. Jetzt lässt sich der tatsächliche Beitrag jedes Schiffstyps zum Kampf fair ablesen.',
    ],
  },
];
