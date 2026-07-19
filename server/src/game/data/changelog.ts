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
    date: '19.07.2026',
    title: 'Raids kommen jetzt in 5 Wellen',
    changes: [
      'Ein Piratenraid ist nicht mehr ein einzelner Kampf bei Ankunft, sondern 5 Angriffswellen im Abstand von ungefähr 15 Minuten, die innerhalb einer Stunde nach Ankunft der Piratenflotte komplett abgeschlossen sind.',
      'Die Gesamtstärke der Angreifer bleibt wie bisher - sie verteilt sich nur auf die 5 Wellen statt in einem Schlag zu kommen. Verluste aus früheren Wellen bleiben bestehen, eure Verteidigung erholt sich nicht zwischen den Wellen (Reparatur-Bonus nach jedem Kampf wirkt weiterhin).',
      'Wird eure Verteidigung zwischendurch komplett aufgerieben, laufen die restlichen Wellen ohne weiteren Kampf durch - ihr bekommt dafür keine einzelne Nachricht pro leerer Welle.',
      'Belohnung gibt es nicht mehr pro Welle einzeln, sondern erst am Ende: ein Container pro erfolgreich abgewehrter Welle. Schlagt ihr alle 5 Wellen zurück, werden alle Container zu Gold aufgewertet statt Silber.',
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
