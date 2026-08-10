# Uebergabe - Stand 10.08.2026

Kurze Datei, bewusst. Der Inhalt steht im `UMSETZUNGSPLAN_BALANCE.md`; hier steht nur, wie man
einsteigt und was NICHT im Plan steht.

## Einstieg in einen neuen Chat

> Repo: https://github.com/dustinnaumann49-star/Expeditions-Commander-2
> Synchronisiere dich. Lies `UMSETZUNGSPLAN_BALANCE.md` komplett, Abschnitt 8 zuerst, dann
> Abschnitt 1b. `README.md` und `FINALE_BALANCE_CHECKLIST.md` nur bei Bedarf.
> Beachte Messregel 16: keine Zahl aus einer Beschreibung uebernehmen, immer gegen den Code
> pruefen.

**Eine Session pro Block, nicht mehr.** Plan 100 KB, Checkliste 125 KB, README 67 KB - das passt
nicht gleichzeitig in eine Session. Einstieg ist **Block A, allein**.

## Stand

- **Plan vollstaendig entschieden.** 14 Entscheidungen, 13 Reparaturen, 27 Schritte in der
  Reihenfolge (Abschnitt 5). Fuer jeden Punkt steht entweder die Zahl oder die Regel, nach der sie
  bestimmt wird. **Eine Umsetzungs-Session braucht keine Entscheidungsrunde mehr.**
- **Am Spielcode ist fuer die Balance nichts geaendert.** Die Umsetzung hat noch nicht begonnen.
- Alle Zahlen im Plan sind **gerechnet, nicht gemessen**. Das ist Absicht - der Unterschied zum
  Zustand davor ist nicht, dass die richtigen Werte feststehen, sondern dass fuer jeden Wert
  festgelegt ist, woran man erkennt, ob er richtig ist.

## Was am 09./10.08.2026 tatsaechlich live gegangen ist

Drei kleine Aenderungen, unabhaengig vom Balance-Paket:

1. **Mobil-Fix M1** - `.combat-table.narrow` in `theme.css`, angewandt auf 6 Tabellen in
   `Nachrichten.tsx` und 3 in `Simulator.tsx`. Die Nachrichtenliste lief rechts aus dem Bild, weil
   die Mobil-Regel `min-width:720px` fuer die 10-spaltige Kampftabelle auch auf alle schmalen
   Tabellen wirkte. Details in `MOBIL_CHECKLISTE.md`.
2. **`MAX_PLAYER_SHIPS` von 100.000 auf 200.000** (`combatConstants.ts`). Ein Spielstand lag mit
   103.196 Schiffen ueber dem alten Limit und konnte gar nichts mehr bauen. Performance-seitig
   unbedenklich: die Aggregat-Engine ist bis 1,5 Mio. Schiffe bei ~26 ms bestaetigt.
3. **Fehlermeldung beim Flottenlimit** (`actions.ts`) - gab bei negativem Rest woertlich
   "Nur noch -3196 Schiff(e) moeglich" aus.

## Zwei offene Punkte, die NICHT im Plan stehen koennen

**1. R13 wartet auf eine Zahl vom Nutzer.**
`totalOwnedShips()` zaehlt nur `state.fleet` + `buildQueue`, nicht Missionen, Galaxie-Entsendungen
und Gruppen-Operationen. Dadurch laesst sich `MAX_PLAYER_SHIPS` umgehen: Flotte wegschicken,
zuhause nachbauen, Flotte kehrt zurueck. Die Korrektur macht die Zaehlung **strenger** und darf
erst angewandt werden, wenn der **tatsaechliche Gesamtbestand inkl. unterwegs befindlicher
Schiffe** bekannt ist - sonst ist der Spieler sofort wieder blockiert. Steht als R13 in
Abschnitt 3 des Plans.

**2. Mobil-Punkte M2 bis M10 brauchen ein Geraet.**
Neun Verdachtsstellen aus dem Code (feste Breiten in Login, Haendler, Gebaeude, Allianz;
ungeprueft Galaxie, Statistik, Kampf-Visualisierung). Aus dem Code heraus nur vermutbar, nicht
bestaetigbar. Pruefablauf und Abnahmekriterium stehen in `MOBIL_CHECKLISTE.md`.

## Zwei Fallen, die schon zugeschnappt sind

**Die README im Repo hat KEINE nummerierten Punkte mehr.** Sie ist in zwoelf Abschnitte
gegliedert. Der Plan enthaelt zehn Verweise der Form "README Punkt 27" - **alle zeigen ins Leere**
und muessen ueber den Abschnittstitel oder den Konstantennamen aufgeloest werden. Eine aeltere
README-Fassung mit 33 nummerierten Punkten kursiert; sie ist an mehreren Stellen sachlich falsch
(Raid-Mechanik, Kampf-Performance um Faktor 100, Baulimits, Sektor-Laufzeiten). **Nicht verwenden.**

**Stille Ausweichwerte.** Vier Fundstellen bisher: `moduleBoostFactor()` liefert bei unbekannter ID
1, dito `moduleReductionFactor()`, `defenseFactor` lief unbemerkt auseinander,
`ADMIRAL_ESCORT_BASE` war tot. Jedes Mal war das Verhalten im Sinne des Codes korrekt und im Sinne
des Spiels falsch. Siehe R12 und Messregel 15.

## Erster Schritt beim naechsten Mal

Block A, Schritt 1: **Entscheidung 1 (Overkill-Deckel).** Sie macht saemtliche Messungen aus vier
Sessions ungueltig und muss deshalb zuerst kommen. Rechne damit, dass Block A mehr Zeit kostet als
alles danach.
