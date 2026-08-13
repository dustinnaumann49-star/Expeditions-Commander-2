# Mobil-Checkliste (Stand 09.08.2026)

Eigene Datei, bewusst NICHT im `UMSETZUNGSPLAN_BALANCE.md`. Gruende: anderes Problemfeld
(Darstellung statt Simulation), andere Pruefmethode (Auge am Geraet statt Messskript), anderes
Risiko (jederzeit reversibel, blockiert den Reset nicht). Der Balance-Plan ist mit 96 KB ohnehin an
der Grenze dessen, was eine Umsetzungs-Session am Stueck halten kann.

**Diese Aenderungen koennen unabhaengig vom Balance-Paket sofort live gehen.** Sie beruehren keinen
Spielwert und keine Server-Logik.

---

## Bereits behoben (09.08.2026)

### M1 - Nachrichtenliste und alle schmalen Tabellen liefen rechts aus dem Bild

**Symptom (Nutzermeldung):** Nachrichten sind am rechten Rand abgeschnitten - und zwar schon in der
Liste, bevor man einen Kampfbericht ueberhaupt anklickt. Betraf alle Nachrichtenarten.

**Ursache:** Am 04.08.2026 wurde ein Mobil-Fix fuer die Kampftabelle eingebaut - bewusst ZENTRAL auf
die Klasse `.combat-table`, zusammen mit `min-width: 720px` in der Mobil-Regel. Fuer die
10-spaltige Kampftabelle ist das richtig: sie soll seitlich scrollbar sein statt gequetscht.
Dieselbe Klasse traegt aber auch **neun schmale Tabellen mit zwei bis vier Spalten** - darunter die
Nachrichtenliste selbst. Die wurden dadurch auf einem 390px-Display auf 720px aufgeblasen.

Der Fix von damals war nicht falsch, er war nur zu breit angewandt. Das ist dieselbe Fehlerform wie
Messregel 15 im Balance-Plan: eine zentrale Regel, die an einer Stelle richtig und an acht anderen
falsch ist, faellt nirgends als Fehler auf.

**Behoben durch:** neuen Modifikator `.combat-table.narrow` in `theme.css` - gleiche Optik, aber
fliessende Breite, Umbruch statt Scroll, keine Mindestbreite. Angewandt auf sechs Tabellen in
`Nachrichten.tsx` und drei in `Simulator.tsx`. Die 10-spaltige Kampftabelle bleibt bewusst
unveraendert scrollbar. Zusaetzlich die feste Spaltenbreite `width: 140` der Zeit-Spalte auf
`32 %` umgestellt, weil eine Pixelbreite bei `table-layout: fixed` auf schmalen Displays ueber ein
Drittel der Zeile belegt haette.

**Regel fuer neue Tabellen:** `.combat-table` nur fuer breite Kampf- und Statistiktabellen,
`.combat-table narrow` fuer alles mit hoechstens vier Spalten.

---

## Bereits behoben (13.08.2026)

### M11 - Kampfberichte liessen sich nicht mehr senkrecht zurueckscrollen

**Symptom (Nutzermeldung):** Nach dem Fix fuer das seitliche Wischen in Raid-/Gruppen-Berichten
liess sich der aufgeklappte Bericht kaum noch nach oben scrollen - es klappte erst nach mehreren
Versuchen.

**Ursache, zwei Ebenen.** Der eigentliche Konstruktionsfehler stammt vom 04.08.2026: Mindestbreite
(`min-width:720px`) und Seitwaerts-Scrollen (`overflow-x:auto`) sassen auf DEMSELBEN Element, der
Tabelle selbst. Ein Element kann sich nicht selbst scrollen - die Tabelle wurde dadurch schlicht
720px breit und lief aus jedem Rahmen um sie herum heraus; gescrollt hat immer ein Vorfahre,
im Normalfall `#modal-box`. Der Wellen-Rahmen der Raid-Berichte traegt `overflow:hidden` (noetig
fuer die abgerundeten Ecken) und schnitt die Tabelle deshalb ab. Der Behelf dagegen - ein
waagerechter Scroll-Bereich um den GESAMTEN aufgeklappten Berichtsinhalt - stellte das seitliche
Wischen her, machte aber den halben Bildschirm zum Wischbereich.

**Warum das das senkrechte Scrollen blockiert:** Handy-Browser legen die Wischrichtung in den ersten
Millimetern einer Geste fest. Beginnt sie in einem waagerecht scrollbaren Bereich und verlaeuft nur
leicht schraeg, gilt sie als waagerecht, und der senkrechte Anteil wird fuer die restliche
Beruehrung verworfen. Da fast jeder Wischversuch in diesem Bereich landete, brauchte es mehrere
Anlaeufe.

**Behoben durch:** Standard-Aufbau hergestellt - neue Klasse `.table-scroll` in `theme.css` als
schmaler Scroll-Wrapper, die Mindestbreite bleibt an der Tabelle. Angewandt in `UnitTable`
(`Nachrichten.tsx`), der einzigen breiten Tabelle im Projekt; sie wird in allen vier Berichtsarten
verwendet, die Aenderung wirkt daher ueberall gleichzeitig. Der grosse Wischbereich um den
Wellen-Inhalt ist zurueckgebaut. `.combat-table.narrow` vereinfacht sich entsprechend
(`display:table`/`overflow-x:visible` entfallen, wirksam bleibt allein die Ruecknahme der
Mindestbreite).

**Nebeneffekt:** `#modal-box` scrollt nicht mehr waagerecht mit - bisher verschob sich der gesamte
Bericht seitlich, weil die 720px-Tabelle ueber seine Breite hinausragte.

**Bewusst in Kauf genommen:** Bei einem Gruppenbericht mit mehreren Teilnehmern hat jede
Teilnehmer-Tabelle ihren eigenen Scroll-Bereich; sie laufen nicht mehr gemeinsam. Ein Gleichlauf
per Skript waere fuer den Nutzen zu aufwaendig.

**Regel daraus:** Mindestbreite und Seitwaerts-Scrollen NIE auf dasselbe Element legen, und den
Scroll-Bereich immer so eng wie moeglich um den breiten Inhalt ziehen - nie um einen ganzen
Abschnitt.

**Noch am Geraet zu bestaetigen:** aufgeklappten Raid-/Gruppenbericht bei 390px oeffnen, weit nach
unten scrollen, dann in einem Zug zurueck nach oben. Zusaetzlich pruefen, ob die breite Tabelle
weiterhin bis zur letzten Spalte wischbar ist.

---

## Noch zu pruefen - nur am Geraet moeglich

Diese Punkte lassen sich aus dem Code heraus nur vermuten, nicht bestaetigen. Sie brauchen einen
Durchgang mit dem Handy, Seite fuer Seite. Empfohlene Testbreite: **390 px** (iPhone 14/15) und
**360 px** (haeufigste Android-Breite) - unter 360 px wird es Einzelfallarbeit.

### Bekannte Verdachtsstellen aus dem Code

| # | Stelle | Verdacht |
|---|---|---|
| M2 | `Login.tsx` | Formular mit fester Breite `width: 320` - auf 360 px bleiben 40 px Rand, eng aber vermutlich tragbar. Pruefen, ob es bei aktiver Tastatur noch passt. |
| M3 | `Allianz.tsx` | Sieben Kaesten mit `maxWidth: 480`, zwei Eingabefelder mit `maxWidth: 90`. `maxWidth` schadet nicht, aber die 90px-Felder koennten fuer die enthaltenen Zahlen zu schmal sein. |
| M4 | `Gebaeude.tsx` | Element mit fester `width: 108`. Pruefen, ob es in einer Zeile mit anderen steht und dort umbricht. |
| M5 | `Haendler.tsx` | Eingabefeld `width: 160` in einer Tauschzeile - typische Stelle fuer Ueberlauf. |
| M6 | `Forschung.tsx` | Baumansicht mit `maxWidth: 100vw` und `overflowX: auto` - bewusst scrollbar. Pruefen, ob der Scrollbalken auf dem Handy auffindbar ist oder ob der Baum nur abgeschnitten wirkt. |
| M7 | `Galaxie.tsx` | Karte mit Positionen - Kandidat fuer feste Koordinaten-Layouts. Ungeprueft. |
| M8 | `Statistik.tsx` | Tabellen ungeprueft, moeglicherweise eigene Klassen statt `.combat-table`. |
| M9 | ~~Kampf-Visualisierung (`CombatReplay`)~~ | **GEGENSTANDSLOS (geprueft 13.08.2026).** Die Komponente existiert im Repo nicht (mehr) - es gibt kein `CombatReplayView.tsx` und keine Fundstelle im Client. Der Server schreibt die `replay`-Daten allerdings weiterhin in jede Kampfnachricht, ohne dass sie jemand anzeigt; das ist kein Mobil-Punkt, sondern ein Kandidat fuer den offenen Speicherbefund in Abschnitt 2a, Punkt 12 des Balance-Plans (435 KB laut Datenbank gegen 761 KB im Speicher). Dort zu klaeren, nicht hier. |
| M10 | Alle Info-Popups (`InfoModal`, `LoreModal`) | `max-width: 800px; width: 100%; max-height: 85vh` - grundsaetzlich richtig gebaut. Pruefen, ob der Inhalt darin scrollt statt zu ueberlaufen. |

### Pruefablauf je Seite

1. Seite oeffnen, **nicht** quer halten.
2. Gibt es horizontales Scrollen der GESAMTEN Seite? Wenn ja: Fehler. Horizontales Scrollen ist nur
   innerhalb einer bewusst breiten Tabelle erlaubt, nie fuer die Seite als Ganzes.
3. Ist irgendein Text rechts abgeschnitten, ohne dass man ihn durch Scrollen erreicht?
4. Sind alle Knoepfe mit dem Daumen treffbar (Richtwert 44 px Hoehe)?
5. Ueberlappt bei geoeffneter Tastatur etwas das aktive Eingabefeld?

### Abnahmekriterium

**Keine Seite scrollt als Ganzes horizontal, und kein Text ist unerreichbar abgeschnitten.**
Alles Weitere ist Geschmacksfrage und kann warten.

---

## Bewusst NICHT geaendert

- **Kein UI-Framework, kein Redesign.** Das Farbschema und der Aufbau stammen aus dem
  HTML-Original und funktionieren. Mobil-Arbeit heisst hier: Ueberlaeufe beseitigen, nicht neu
  bauen.
- **Keine eigene Handy-Ansicht.** Eine zweite Oberflaeche zu pflegen ist bei diesem Projektumfang
  teurer als sie wert ist - und sie laeuft garantiert irgendwann auseinander, genau wie
  `multipliers.ts` und `defenseFactor` es schon getan haben.
