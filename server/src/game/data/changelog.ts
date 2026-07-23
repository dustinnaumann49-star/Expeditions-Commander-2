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
