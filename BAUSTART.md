# BAUSTART - Einstiegskarte fuer die Bau-Sitzung

Erstellt 29.08.2026 am Ende der siebten Session. Zweck: am Dienstag ohne Suchen anfangen
koennen. **Diese Datei ersetzt keine Bauanleitung** - sie sagt nur, WAS in welcher Reihenfolge
dran ist und WO die jeweilige Anleitung steht.

## Die Regel, die hier endet

Am 19.08.2026 wurde festgelegt: "Aenderungen erst, wenn der ganze Plan steht." Diese Regel hat
ihren Zweck erfuellt (keine Baseline wurde waehrend laufender Kalibrierung entwertet) und laeuft
mit der Bau-Sitzung aus. **Ab dann gilt die umgekehrte Reihenfolge: bauen, dann am gebauten
Zustand messen.**

## Kritische Reihenfolge - vier harte Abhaengigkeiten

0. **R16 VOR ALLEM ANDEREN.** Der Defekt "eine Flotte laesst sich in beliebig viele
   GLEICHZEITIGE Gruppen-Operationen aufteilen" (Elite-Bollwerk unendlich oft parallel startbar).
   **Warum zuerst:** solange er drin ist, enthalten alle Einnahmen den Mehrfachflug. Die erste
   Gegenprobe von Entscheidung 2 wuerde dann gegen eine Baseline messen, die den Glitch
   mitzaehlt - die Vorhersage 0,98 / 19,57 / 61,11 laege daneben, ohne dass erkennbar waere,
   warum. Siehe Naechster Abschnitt.
1. **Entscheidung 2 (Block A Schritt 2) danach.** Alles Weitere haengt daran: die Baseline-
   Vorhersage (0,98 / 19,57 / 61,11 Mrd), die Sperre von `PIRATEN_MULTIPLIER_ROLL` (faellt mit
   dem EINBAU, nicht mit der Messung) und der Bezugswert jeder spaeteren Gegenmessung.
2. **Entscheidung 3 danach.** Sie ist gegen den heutigen Raid-Ertrag geschlossen; wird sie vor
   Entscheidung 2 gebaut, misst die Gegenprobe zwei Aenderungen auf einmal.
3. **Entscheidung 16 erst nach Entscheidung 2.** Die Sperre von `RAID_WAVE_ROLL` haengt daran.

Alles Uebrige ist unabhaengig und kann in beliebiger Reihenfolge.

## R16 - der Defekt, der nicht in der Entscheidungsliste steht

**Steht in der R-Tabelle des Umsetzungsplans, NICHT unter den Entscheidungen** - deshalb hier
eigens aufgefuehrt, sonst wird er beim Abarbeiten der zehn Pakete uebersehen. Aufgenommen
20.08.2026 nach Nutzermeldung ("Elite Bollwerk kann man unendlich mal starten gleichzeitig"),
im Code bestaetigt.

- **Befund:** `createGroupOperation()` prueft nur Sektor, Schiffstypen und Bestand,
  `respondToGroupOperation()` erlaubt beliebig viele gleichzeitig angenommene Einladungen,
  `performGroupOperationStart()` kennt keine Mindestteilnehmerzahl. Die Sperre, die Solo-Missionen
  seit dem 29.07.2026 haben (`missions.ts` Z. 97), wurde bei Gruppen-Operationen nie nachgezogen.
- **Reparatur, entschieden:** **eine aktive Operation je Spieler**, geprueft an BEIDEN
  Eintrittspunkten - wer bereits in einer Operation mit Status `inviting` oder `departed` steckt,
  kann weder eine zweite erstellen noch eine weitere Einladung annehmen. Gilt fuer P9 und P10
  gemeinsam. **Braucht KEINE neue Balance-Zahl.**
- **Ausdrueckliche Nutzerentscheidung: der Solo-Start beider Multiplayer-Sektoren bleibt
  erlaubt** und wird NICHT mitrepariert. Es geht ausschliesslich um die Gleichzeitigkeit.
- **Nicht Teil der Reparatur:** die Hoehe der flachen Belohnungen selbst (rund 17 Mrd Wert je
  Expedition und Teilnehmer, unabhaengig von der eingesetzten Flotte) und die Kadenz aus
  Entscheidung 4.8.
- **Stellen:** `game/groupOps.ts`, `createGroupOperation()` ~Z. 73 und
  `respondToGroupOperation()` ~Z. 174.
- **Einbau war von Anfang an fuer den Server-Neustart vorgesehen** - bis dahin durfte der alte
  Stand ausgespielt werden. Dieser Zeitpunkt ist jetzt.

**Nebenwirkung, die beim Messen danach zu erwarten ist:** die beiden Bots ziehen ihre Einnahmen
derzeit weitgehend aus mitgenommenen Elite-Fluegen unter genau diesem Glitch (Stand 30.08.2026:
Guthaben 90 bzw. 77 Mrd, Minen Stufe 32-34, Flotte rund 4.200 bzw. 4.700 Kampfschiffe - am
29.08. waren es noch 26 Mrd, Minen 19-21 und 178 Schiffe). **Nach der Reparatur faellt ihr
Einkommen deutlich, und ihr Flotten-Gleichgewicht wandert mit nach unten** (gemessener
Zusammenhang in `bot_baurate.txt`: der Bot baut proportional zu dem, was hereinkommt, und
saettigt binnen eines Tages). Das ist erwartet und kein Defekt - aber es macht jede
Bot-Kennzahl von vor der Reparatur unvergleichbar.

## Baureif - Anleitung vorhanden, Konstanten stehen

| Paket | Bauanleitung steht in | Kernpunkt |
|---|---|---|
| **R16** (zuerst) | R-Tabelle Umsetzungsplan + Befundkasten 20.08.2026 | eine aktive Gruppen-Operation je Spieler, beide Eintrittspunkte in `groupOps.ts`. Solo-Start bleibt erlaubt |
| **Entscheidung 2** | Messkasten Kopf Entscheidung 2, `loot_curve.txt` | neues `game/loot.ts`, verdrahtet in `missions.ts` / `groupOps.ts` / `pirateBaseCombat.ts`; `fleetSizeRewardMultiplier()` an beiden Stellen entfernen; Anker 2,662 / 2,29 Mrd; `winResources` x13,8 |
| **Entscheidung 3** | Messkasten Entscheidung 3, `raid_yield.txt` | Variante 6, `RAID_ALLY_POWER_WEIGHT` = 1,0, Saettigung ueber Tagessumme, `S_MAX` = 1,5 |
| **Entscheidung 7** | Messkasten Entscheidung 7, `station_v2.txt` | 7.2 Variante A (nur `stationBuildings.ts`), 7.3 Module x16,5, `requiredBuildingLevel` 20 -> 10. `data/buildings.ts` NICHT anfassen |
| **Entscheidung 16** | Messkasten Entscheidung 16 | RF-Wert 4, `SIZE_MISMATCH_EVASION_BONUS` 0,20 / 0,08, dazu zwingend `ZIELERFASSUNG_BASE['leicht']` = 0,25 **und** der Client-Spiegel |
| **Novice-Bonus** | Messkasten bei der Entscheidung | kalibriert 20.08.2026 |
| **Entscheidung 18** | Messkasten Entscheidung 18 | Raid als Traeger der Herausforderung |
| **Entscheidung 19** | Messkasten Entscheidung 19 | Salvenschiffe Endgame, entschieden 25.08.2026 |
| **Reicher Fund** | `reicherfund_12_offene_punkte.txt` Abschn. 4, `reicherfund_13_entscheidungen.txt` | Chance 0,16 / Faktor 0,875 / Bemessung am Mining ALLEIN / zeitpunktunabhaengig. **Fuenf Textstellen**, `RichFindEntry.hour` bleibt im Typ |

## NICHT baureif - hier zuerst nachdenken, nicht tippen

- **Block B, Entscheidung 4.3 bis 4.8.** 4.1/4.2 sind geschlossen, aber **4.3 muss mit
  UMGEKEHRTEM Vorzeichen neu aufgesetzt werden**: ein hoeherer Boss-Anteil macht den Gegner
  schwaecher, und auch 0,25 endet zu 100 % mit Sieg in Check 1. Der Hebel ist die Gegnerstaerke,
  Kippbereich 2x bis 4x. **Wer hier baut, baut eine Zahl mit falschem Vorzeichen ein.**
- **Entscheidung 15** - noch nicht entschieden, ob sie ueberhaupt ins Paket soll.

## Drei Dinge, die beim Bauen zu beachten sind

1. **Messregel 8: vor jedem Paket im Client greppen.** Bei Entscheidung 2 sind drei Spiegel
   bekannt (`types/game.ts`, `pages/Nachrichten.tsx`, `pages/Sektor.tsx`), beim Reichen Fund
   fuenf Stellen. Die Listen sind ausdruecklich NICHT als vollstaendig anzusehen.
2. **Konstanten gehoeren ueber `/game/data` an den Client**, nicht als zweite hartkodierte Zahl.
3. **Nach jedem Paket eine Gegenmessung**, bevor das naechste gebaut wird - sonst ist bei einer
   Abweichung nicht mehr zuzuordnen, welches Paket sie verursacht hat.

## Wenn danach gemessen wird

Die Baseline-Vorhersage **0,98 / 19,57 / 61,11 Mrd/Tag** (frueh / mittel / spaet) ist der erste
Pruefstein. Weicht der gebaute Zustand ab, liegt der Fehler im Einbau oder in der Vorhersage -
beides ist wertvoller zu wissen als jede weitere Messung am ungebauten Stand.

**Beim Vergleich mit 0,80 / 19,82 / 76,85 beachten:** darin stecken ZWEI Aenderungen, weil auch
der Flottenwert durch Entscheidung 6 gefallen ist. Wer 61,11 gegen 76,85 haelt, vergleicht
beides auf einmal.
