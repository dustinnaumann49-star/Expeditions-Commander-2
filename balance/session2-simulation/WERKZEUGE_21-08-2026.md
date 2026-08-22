# Messwerkzeuge vom 21.08.2026

Vier neue Skripte und eine Erweiterung eines bestehenden. Gehoeren nach
`balance/session2-simulation/`. Sie ergaenzen die Protokolle `bot_yield_131.txt`,
`pirate_threat_17.txt`, `raid_hardness_18.txt` und `salven_19.txt` - ohne sie sind deren Zahlen
nicht nachpruefbar.

**KEINES dieser Skripte veraendert Spielcode.** Alle laufen gegen einen Messbuild in einem Ordner
AUSSERHALB des Repos.

---

## Vorbedingungen

```
cd server && npm install && npx tsc          # dist/ muss aktuell sein, der Worker laedt von dort
cd balance/session2-simulation
node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
```

Der kumulative Messbuild enthaelt Block A Schritt 2 (Entscheidung 2) und Entscheidung 16. **Er ist
die gueltige Grundlage fuer alle Messungen dieses Tages** - der reine Repo-Stand ist es nicht, weil
sieben Pakete ungebaut auf den Neustart warten.

Vor Gebrauch gegen einen bekannten Anker aus `loot_curve.txt` pruefen und dabei **auf die
vernichtete Feindmacht normieren** - roh verglichen sieht ein korrekter Build falsch aus.

Messbuild-Ordner NICHT ins Repo.

---

## `run_bot_yield_131.mjs` — Entscheidung 13.1 / 13.2 (Bot-Ertrag, Bot-Profile)

```
MESSBUILD=/tmp/mb_kum node run_bot_yield_131.mjs basis
MESSBUILD=/tmp/mb_kum node run_bot_yield_131.mjs profil
MESSBUILD=/tmp/mb_kum node run_bot_yield_131.mjs gitter 40 mittel
MESSBUILD=/tmp/mb_kum node run_bot_yield_131.mjs engpass 14 0,1,3,9,27
MESSBUILD=/tmp/mb_kum node run_bot_yield_131.mjs kalib 4.0 0.036
```

| Teil | Was | Serien? |
|---|---|---|
| `basis` | Flottenmacht/-wert, Minen-Ertrag aus `mineOutputPerHour()`, toter Container-Wert | deterministisch |
| `profil` | Macht je Wert-Einheit: Gleichverteilung gegen Profile (13.2) | deterministisch |
| `gitter` | k und v aus der 24h-Solo-Mission, scheibenweise je Stand | 40 je Zelle |
| `engpass` | 14 simulierte Tage Bot-Wirtschaft, virtuelle Uhr, 2-Minuten-Takt | deterministisch |
| `kalib` | Weg-(b)-Arithmetik ueber f | reine Rechnung |

Legt eine isolierte `dist`-Kopie unter `$TMPDIR/ec-bot131-isolated` an und verlinkt
`server/node_modules` — `actions.js` zieht ueber `state.js` eine Datenbank mit hartkodiertem Pfad.
Muster aus `run_novice_bonus.mjs`.

`engpass` ist deterministisch, weil die einzige Zufallsquelle in `economyBotTurn.ts`
(`maybeChooseClass()`) vorab fest gesetzt wird. Es werden bewusst keine Serien vorgetaeuscht.

---

## `run_pirate_threat_17.mjs` — Entscheidung 17 (Piratenbasen als Bedrohung, verworfen)

```
MESSBUILD=/tmp/mb_kum node run_pirate_threat_17.mjs asym  40 mittel 6
MESSBUILD=/tmp/mb_kum node run_pirate_threat_17.mjs kliff 40 mittel "3,4,5,6,7,8,10"
MESSBUILD=/tmp/mb_kum PRES=6 node run_pirate_threat_17.mjs kliff 40 mittel "2,3,4,6"
```

- `asym` — was die Asymmetrien der Verteidigungsseite kosten. Fuenf Fassungen von "heute"
  (Spieler auf Seite B) bis "Raid-Fassung".
- `kliff` — Sweep ueber den effektiven Multiplikator, heutige Fassung gegen Raid-Fassung.
- `PRES=<stufe>` setzt die Forschung der angreifenden Basis (Standard 0).

Entscheidung 17 ist verworfen; das Werkzeug bleibt relevant, weil vier seiner Befunde
Entscheidung 18 tragen.

**Wichtig beim Lesen:** bei Multiplikator 1 liegt der Verlust in allen Fassungen unter 1 % - dort
misst man nichts. Immer erst den umkaempften Bereich sondieren.

---

## `run_raid.mjs` — bestehend, erweitert

Neu am 21.08.2026: `WAVES`, `ONLY`, `FIXPOWER`, `ESC`, `BUNKER`.
**Ohne diese Variablen verhaelt sich das Skript exakt wie zuvor.** Die aelteren Variablen
(`REPAIR`, `REPAIR_BOLLWERK`, `DEF_WEIGHT`, `WITHDRAW`, `CAP`, `RESERVE`, `GRACE`) sind unberuehrt.

```
MESSBUILD=/tmp/mb_kum node run_raid.mjs 40
MESSBUILD=/tmp/mb_kum WAVES=18 ONLY="mittel / grosse Flotte" node run_raid.mjs 40
MESSBUILD=/tmp/mb_kum ESC="1,1.2,1.5" BUNKER=0.5 node run_raid.mjs 40
MESSBUILD=/tmp/mb_kum FIXPOWER=1 node run_raid.mjs 10
```

| Variable | Standard | Wirkung |
|---|---|---|
| `WAVES` | `RAID_WAVE_COUNT` (12) | Zahl der Wellen |
| `ONLY` | alle | Fall-Filter, Teilstring des Labels, kommagetrennt |
| `FIXPOWER` | `0` | friert die Bemessungsgrundlage auf den Stand vor der ersten Welle ein |
| `ESC` | aus | Eskalation, z. B. `"1,1.2,1.5"` — drei gleich grosse Phasen |
| `BUNKER` | `0` | Anteil der Wellenmacht in der LETZTEN Phase, der durch Bomber ersetzt wird |

`RAID_WAVE_ROLL` ist **nicht** ueberschreibbar und wurde nicht angefasst.

---

## `run_salven_19.mjs` + `make_messbuild_salve.mjs` — Entscheidung 19 (Salvenschiffe)

Zweistufiger Build: der Salven-Patch setzt auf dem kumulativen Messbuild auf.

```
node make_messbuild_salve.mjs /tmp/mb_kum /tmp/mb_salve --je=20000 --deckel=8

MESSBUILD=/tmp/mb_kum   node run_salven_19.mjs kurve 12          # Ist-Zustand
MESSBUILD=/tmp/mb_salve node run_salven_19.mjs kurve 12          # Weg 2
MESSBUILD=/tmp/mb_salve ANTEILE="0.1,1.0" node run_salven_19.mjs kurve 12
MESSBUILD=/tmp/mb_salve node run_salven_19.mjs limit 6 "1,2,3"
```

`make_messbuild_salve.mjs` ersetzt in `game/combat.js` die Regel "ein Treffer je praesentem Typ"
durch `min(DECKEL, ceil(einheiten_dieses_typs / JE))` — **fuer Einzelziele UND Aggregat-Stapel.**
Ein Patch nur auf Einzelziele haette im Endgame nichts getan, weil grosse Gegnermengen ab
`STACK_AGGREGATE_THRESHOLD_BY_TYPE` als Stapel vorliegen.

Das Skript bricht mit Fehler ab, wenn der erwartete Block in `combat.js` nicht gefunden wird —
also wenn sich die Salven-Logik im Quellcode geaendert hat. Dann erst den Patch nachziehen.

`run_salven_19.mjs kurve` skaliert EINE Zusammensetzung (die reale Endgame-Flotte aus dem
Nutzer-Screenshot) ueber die Groesse, waehrend die Salvenschiffe bei ihrem `maxCount` bleiben —
genau das ist der zu pruefende Punkt. `ANTEILE` waehlt einzelne Groessen aus, `limit` vervielfacht
stattdessen den Salven-Bestand bei fester Endgame-Flotte.

---

## Allgemeine Regeln, die fuer alle vier gelten

1. **Jedes Ergebnis als Messbuild-Wert kennzeichnen**, im Protokoll und im Kopf des Skripts.
2. **Mindestens 40 Serien je Zelle**, scheibenweise, Ergebnis sofort anhaengen.
3. **Streuung der tragenden Zelle bestimmen, bevor Unterschiede gedeutet werden.**
4. **Wo eine Groesse deterministisch ist: sagen und keine Serien vortaeuschen.**
5. **Bei Schwellen- und Anteilskriterien zuerst pruefen, ob sie bei den Extremwerten ueberhaupt
   verschiedene Antworten geben** — sonst ist es eine Setzung und keine Messung.
6. `run_income_baseline_v2.mjs` **ueberschreibt** `income_baseline_v2.txt` bei jedem Lauf, auch bei
   einem Testlauf. Vorher `git status` sauber haben.
