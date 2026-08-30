# BAUSTART - Einstiegskarte fuer die Bau-Sitzung

Erstellt 29.08.2026 am Ende der siebten Session. Zweck: am Dienstag ohne Suchen anfangen
koennen. **Diese Datei ersetzt keine Bauanleitung** - sie sagt nur, WAS in welcher Reihenfolge
dran ist und WO die jeweilige Anleitung steht.

## Die Regel, die hier endet

Am 19.08.2026 wurde festgelegt: "Aenderungen erst, wenn der ganze Plan steht." Diese Regel hat
ihren Zweck erfuellt (keine Baseline wurde waehrend laufender Kalibrierung entwertet) und laeuft
mit der Bau-Sitzung aus. **Ab dann gilt die umgekehrte Reihenfolge: bauen, dann am gebauten
Zustand messen.**

## Kritische Reihenfolge - nur diese drei Abhaengigkeiten sind hart

1. **Entscheidung 2 (Block A Schritt 2) ZUERST.** Alles andere haengt daran: die Baseline-
   Vorhersage (0,98 / 19,57 / 61,11 Mrd), die Sperre von `PIRATEN_MULTIPLIER_ROLL` (faellt mit
   dem EINBAU, nicht mit der Messung) und der Bezugswert jeder spaeteren Gegenmessung.
2. **Entscheidung 3 danach.** Sie ist gegen den heutigen Raid-Ertrag geschlossen; wird sie vor
   Entscheidung 2 gebaut, misst die Gegenprobe zwei Aenderungen auf einmal.
3. **Entscheidung 16 erst nach Entscheidung 2.** Die Sperre von `RAID_WAVE_ROLL` haengt daran.

Alles Uebrige ist unabhaengig und kann in beliebiger Reihenfolge.

## Baureif - Anleitung vorhanden, Konstanten stehen

| Paket | Bauanleitung steht in | Kernpunkt |
|---|---|---|
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
