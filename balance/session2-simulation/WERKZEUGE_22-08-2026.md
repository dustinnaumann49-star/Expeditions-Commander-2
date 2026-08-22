# Messwerkzeuge vom 22.08.2026

Ein neues Skript, eine Erweiterung gibt es nicht. Ergaenzt `WERKZEUGE_21-08-2026.md`, ersetzt es
nicht.

**Das Skript veraendert keinen Spielcode.** Es laeuft gegen einen Messbuild in einem Ordner
AUSSERHALB des Repos.

---

## Vorbedingungen

```
cd server && npm install && npx tsc          # dist/ muss aktuell sein, der Worker laedt von dort
cd balance/session2-simulation
node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
```

Build vor Gebrauch gegen einen Anker aus `loot_curve.txt` pruefen und dabei **auf die vernichtete
Feindmacht normieren**. Am 22.08.2026 gemessen: -2,8 % (mittel/hoch) und -0,9 % (spaet/hoch)
normiert, gegen +8,6 % bzw. -5,9 % roh. Der rohe Vergleich haette den korrekten Build verworfen.

---

## `probe_volley_scale_19.mjs` — Vorfrage zur Reihenfolge 18/19

```
MESSBUILD=/tmp/mb_kum node probe_volley_scale_19.mjs 40
MESSBUILD=/tmp/mb_kum ESC="1,1.5,2.5" BUNKER=0.5 WIDX=11 node probe_volley_scale_19.mjs 40
MESSBUILD=/tmp/mb_kum JE=5000 node probe_volley_scale_19.mjs 40
```

Misst **nicht den Kampf, sondern nur die Wellengroesse je Typ**. Weg 2 aus Entscheidung 19 lautet
`treffer_je_typ = min(DECKEL, ceil(einheiten_dieses_typs / JE))`; solange kein Gegnertyp die
JE-Marke reisst, ist der Ausdruck 1 und Weg 2 aendert nichts. Die Frage ist damit zaehlbar und
braucht keinen Kampflauf - das spart nicht nur Zeit, es macht das Ergebnis auch streuungsfrei
deutbar.

| Variable | Standard | Wirkung |
|---|---|---|
| `JE` | `20000` | Schwelle aus Weg 2 |
| `DECKEL` | `8` | Obergrenze der Treffer je Typ aus Weg 2 |
| `ESC` | aus | Eskalation wie in `run_raid.mjs`, drei gleich grosse Phasen |
| `BUNKER` | `0` | Bomberanteil der letzten Phase, wie in `run_raid.mjs` |
| `WIDX` | `0` | Welle innerhalb des Raids und damit die Eskalationsphase; letzte Phase = `WAVES-1` |
| `WAVES` | `RAID_WAVE_COUNT` (12) | nur fuer die Phasenaufteilung relevant |
| `DEF_WEIGHT` | `0.3` | Verteidigungs-Gewicht der Bemessungsgrundlage |

Die Wellenerzeugung ist 1:1 aus `run_raid.mjs` uebernommen (combinedPower = Flotte x 0,7 +
Verteidigung x 0,3, `RAID_MIN_TARGET_POWER`, `pick503020` auf `RAID_WAVE_ROLL`,
`generateFallbackFleet`, optional ESC/BUNKER). **`RAID_WAVE_ROLL` ist nicht ueberschreibbar und
wurde nicht angefasst.**

Gemessen wird immer die **erste** Welle eines Raids, also die groesste Bemessungsgrundlage -
spaetere Wellen schrumpfen mit der dezimierten Flotte mit (Befund D aus Entscheidung 18). Die
Spalte "groesster Typ" ist das **Maximum ueber alle Laeufe**, nicht der Mittelwert: gesucht ist die
Obergrenze, nicht der Erwartungswert.

**Fuenfte Zelle "ENDGAME"**: die reale Endgame-Flotte aus dem Anlass von Entscheidung 19
(993.604 Schiffe, identisch zu `BASIS` + `SALVEN_BESTAND` in `run_salven_19.mjs`). Ihre
Verteidigungs-Zusammensetzung ist eine **SETZUNG, keine Messung** - fuer die Trefferzahl je Schuss
folgenlos (die haengt nur davon ab, OB die Anlage vorhanden ist), fuer jede daraus abgeleitete
Verlustquote nicht. Wer Verlustquoten am Endgame-Stand braucht, ergaenzt eine Endgame-Zelle in
`run_raid.mjs` und misst dort.

Die RF-Zieltypen der beiden Salven-Anlagen liest das Skript zur Laufzeit aus
`RAPIDFIRE.sentinelkanone` / `RAPIDFIRE.ultimatekanone` **des jeweiligen Builds** statt sie zu
setzen - sonst wuerde eine spaetere Tabellenaenderung (etwa durch Entscheidung 16) still an ihm
vorbeilaufen.

---

## Allgemeine Regeln, unveraendert gueltig

Die sechs Punkte am Ende von `WERKZEUGE_21-08-2026.md` gelten weiter. Ergaenzend aus dieser
Session:

7. **Wo eine Groesse abzaehlbar ist, nicht simulieren.** Die Frage "wirkt Weg 2 in den Raid-Zellen"
   haengt allein an einer Stueckzahl je Typ. Ein Kampflauf haette dieselbe Antwort mit Streuung
   geliefert und 40-mal so lange gebraucht.
8. **Vor jeder Aussage ueber eine Konstantenmenge die Menge auszaehlen.** `MULTI_TARGET_VOLLEY_SHIPS`
   galt drei Sessions lang als "die drei Salvenschiffe" und hat fuenf Eintraege. Der Name der
   Konstante hat die Fehlannahme gestuetzt.
