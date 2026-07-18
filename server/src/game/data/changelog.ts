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
