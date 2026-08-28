# Messwerkzeuge - Stand 28.08.2026 (siebte Session)

Ergaenzt `WERKZEUGE_27-08-2026.md`. Betrifft ausschliesslich Werkzeuge unter
`balance/session2-simulation/`. **Kein Spielcode und kein Client-Code wurde geaendert.**

Neu in dieser Session ist KEIN Werkzeug. Geaendert wurde genau eines.

## Geaendert: `run_reicherfund.mjs` - drei Schalter, Standardwerte unveraendert

Anlass: Punkt 1 der drei offenen Punkte aus `reicherfund_11.txt` Abschnitt 12b. Die sieben
Zellen der sechsten Session liefen alle mit `--treiber=economy`, also ohne Raid; K5 ist dort
strukturell nicht entscheidbar.

| Schalter | Standard | Wirkung |
|---|---|---|
| `--treiber=` | `economy` | an `sim13_lauf.mjs` durchgereicht. `tick` loest Raids aus. |
| `--nutzer=` | keiner (`Sim_<profil>`) | an `sim13_lauf.mjs` durchgereicht. Steuert ueber `getRaidSchedule()` den Raid-Rhythmus. |
| `--k5fenster=` | `0` (ganzer Lauf) | Fensterlaenge der ZWEITEN K5-Lesart in Tagen. |

**Der Zellensatz und alle Standardwerte sind unveraendert** - `reicherfund_11.txt` bleibt mit
demselben Aufruf reproduzierbar. Ohne die neuen Schalter verhaelt sich das Skript wie bisher,
bis auf zwei Ausgabezeilen (siehe unten).

### Warum `--nutzer` und nicht ein Messbuild-Patch

`getRaidSchedule()` in `raids.js` vergibt den Raid-Rhythmus **nach dem Nutzernamen**:

```
RAID_SCHEDULE_BY_USERNAME = { ShadowEagle: [Mi 0:00, So 0:00], SchnelleRatte: [dito] }
   -> chance 1
alles andere -> RAID_FALLBACK_SCHEDULE mit RAID_SPAWN_CHANCE = 0.7
```

Der bisherige Standardname `Sim_aktiv` lief ueber den 0,7-Fallback. Bei fuenf Laeufen je Form
haette damit eine 0/1-Ziehung den groessten beweglichen Posten im K5-NENNER gestellt, und ein
Unterschied zwischen den Formen waere von einem Unterschied in der Zahl der Raids nicht zu
trennen gewesen.

`--nutzer=ShadowEagle` ist dabei **nicht nur Varianzreduktion, sondern die realistischere
Zelle**: es gibt genau zwei Spieler, beide stehen namentlich in der Tabelle, beide mit Chance 1.
Der 0,7-Fallback ist im Spiel gar keine vorkommende Umgebung. Der Schalter existierte bereits in
`sim13_lauf.mjs` und war hier nur nicht durchgereicht - **kein Messbuild-Patch noetig, der Build
bleibt unberuehrt.**

### Warum das K5-Fenster eine ZWEITE Lesart ist

`sim13_lauf.mjs` bildet `quellenTage.slice(0, 7)`, `run_reicherfund.mjs` bildete
`roh.quellen.slice(0, 7)` - **beide unabhaengig von `--tage`**. Ein 14-Tage-Lauf liefert fuer
die Woche-1-Lesart damit exakt dieselbe Zahl wie ein 7-Tage-Lauf. Ohne die zweite Lesart waere
die doppelte Rechenzeit vollstaendig verschenkt gewesen.

K5 selbst bleibt **unveraendert** bei Woche 1: es ist seit dem 20.08.2026 die Kennzahl der
Startphase und hat ueber mehrere Sessions Vergleichswerte. Dasselbe Muster wie K1/K1b und
K3/K3b - Definition nicht anfassen, Gegenstueck danebenstellen.

Aus dem dist nachgerechnet, warum 14 Tage ueberhaupt etwas aendern: `RAID_PREP_MS` = 1 h,
`RAID_ASSAULT_DURATION_MS` = 24 h, Checkpoints Mi/So 0:00, Start Montag. In Woche 1 kann genau
EIN Raid fertig werden (Mi, Tag 2 -> Tag 3); der Sonntags-Raid endet an Tag 7.

### Neue Ausgabe

- **Kopfzeile mit der Zellen-Umgebung** (Treiber, Nutzername, resultierende Raid-Chance). Beides
  verschiebt den K5-Nenner und damit jede Anteilszahl - eine Tabelle ohne diese Zeile ist
  spaeter nicht mehr zuzuordnen.
- **Abschnitt 5**: zweite K5-Lesart, Raid-Betrag in Woche 1 und im langen Fenster, dazu die
  Variationskoeffizienten von Fund und Raid nebeneinander. Die Raid-Spalte ist der Punkt des
  Abschnitts: sie ist die Konkurrenz-Erklaerung fuer jeden Unterschied in K5.
- Die Rohdatei enthaelt jetzt `treiber`, `nutzer` und `k5fenster`.

### Ein korrigierter Fehler im bisherigen Stand

Zeile 236 gab fest verdrahtet `MESSBUILD-WERTE. Treiber economy (kein Raid)` aus - auch bei
`--treiber=tick`. Das haette eine tick-Serie als economy-Serie protokolliert. Jetzt wird der
tatsaechliche Wert ausgegeben. **Dieselbe Fehlerform wie die falschen Zahlen in
Beschreibungstexten: eine Beschreibung, die dem Werkzeug davonlaeuft.**

## Aufruf der Zellen dieser Session

```
node make_messbuild_kum.mjs   /tmp/mb_kum      --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs /tmp/mb_kum      /tmp/sim13/dist
node make_messbuild_k5.mjs    /tmp/sim13/dist  /tmp/k5/dist
MESSBUILD=/tmp/k5/dist node check_build_anker.mjs 40      # zweimal, normiert lesen

node run_reicherfund.mjs --n=5 --tage=14 --treiber=tick --nutzer=ShadowEagle \
     --k5fenster=14 --nur=d24_c008,v_p016 --wurzel=/tmp/rf_tick --out=/tmp/rf_tick.json
```

Rund 1.520 s je Runde (10 Laeufe a rund 152 s). Zwei Runden gefahren, gepoolt auf n = 10 je
Zelle - die Begruendung dafuer steht in `reicherfund_12_offene_punkte.txt` Abschnitt 2 und ist
selbst ein Befund: **die Trennschaerfe-Vorabrechnung stuetzte sich auf die K5-Streuung aus einer
Zelle OHNE Raid (16,0 Punkte); mit Raid liegt sie bei 7,3.** Derselbe Raid, der die Frage erst
entscheidbar macht, daempft den zu messenden Unterschied mit. Die zweite Runde wurde mit
**vorher** festgelegtem Kriterium gefahren (n = 10, Schwelle F(9,9) = 3,18, einmalige
Auswertung, kein Nachlegen).

## Ankerwerte

Elf Messungen desselben Ankers gegen `/tmp/k5/dist` liegen jetzt vor:

```
+0,4 / -1,0 / -1,1 / -1,1 / -1,2 / -1,5 / -1,6 / -1,7 / -1,8 / -2,3 / -2,8 %
```

Die beiden neuen (-1,1 und -1,7) liegen im Band. **Roh waeren beide POSITIV gewesen**
(+1,8 und +4,3 %) - die roh/normiert-Falle zum achten Mal.
