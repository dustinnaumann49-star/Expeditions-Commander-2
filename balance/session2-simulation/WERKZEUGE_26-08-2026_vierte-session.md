# Werkzeuge der Session vom 26.08.2026 (vierte Session)

Protokoll: `verdrahtung_a.txt`. **Alle Zahlen sind Messbuild-Werte.** Kein Spielcode geaendert.

## Neu

### `probe_verdrahtung_a.mjs`

Beantwortet die Frage, die `check_build_anker.mjs` ausdruecklich offen laesst: zahlt die
Beute-Kurve in `missions.js` tatsaechlich, oder liegt `game/loot.js` nur unbenutzt im Build?

```
cd server && npm install && npx tsc -p tsconfig.json
node make_messbuild_kum.mjs   /tmp/mb_kum     --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs /tmp/mb_kum  /tmp/sim13/dist
MESSBUILD=/tmp/sim13/dist node probe_verdrahtung_a.mjs 40
```

Faehrt dieselbe Zelle zweimal: einmal durch die **echte** Schleife
(`sendFleet()` -> sieben Zeitschritte a 4 h durch `processMissions()` -> `finalizeMission()`),
einmal durch die aus `check_build_anker.mjs` zeichengleich uebernommene Referenzschleife.
Verglichen wird **normiert** auf die vernichtete Feindmacht.

Ergebnis dieser Session: **+0,1 %** gegen die Referenz im verdrahteten Build, **+72,8 %** im
unverdrahteten. Trennabstand 73 Punkte gegen rund 2 Punkte Streuung.

Vier Dinge, die dieses Skript anders macht als seine Vorgaenger:

- **Es baut keine Teilrechnung nach.** Ausgewertet wird, was hinterher auf `state.resources` und
  in `state.inventory` steht. Die vernichtete Feindmacht kommt aus dem spieleigenen Bericht
  (`mission.skirmishTotals.npc`), nicht aus einer Instrumentierung des Builds.
- **Es benutzt `defaultPlayerState()` statt eines Stubs.** Die echte Missionsschleife fasst
  `state.missions`, `state.inventory`, `state.stats`, `state.messages`, `state.teile` und
  `state.createdAt` an; ein handgebauter Stub muesste diese Feldnamen raten - genau die
  Fehlerform aus Messregel 16. Die Profilwerte kommen danach aus derselben Quelle wie in der
  Referenzschleife.
- **Es prueft seine eigenen Vorbedingungen und bricht ab.** Das Startdatum muss ausserhalb des
  Mo/Fr-Wochenevents liegen (deterministisch fuer sechs Zeitpunkte im Missionsfenster geprueft),
  und die Pruefflotte darf keinen Sandronator enthalten. Beide sind Verdoppler, die die
  Referenzschleife nicht kennt - an einem Montag laegen beide Seiten um Faktor 2 auseinander und
  es saehe wie ein Verdrahtungsfehler aus.
- **Es fuehrt eine Kontrollrechnung mit**, was die alte, flache Formel gezahlt haette
  (`winResources * combatWins` + Container je Sieg). Im unverdrahteten Build trifft sie exakt,
  im verdrahteten liegt sie 62 % daneben. Damit zeigt die Ausgabe nicht nur, dass die Probe nah
  an der Referenz liegt, sondern auch, wovon sie sich unterscheidet.

**Gegenprobe ist Pflicht, nicht Kuer.** Ohne den Lauf gegen den unverdrahteten Build koennte die
Uebereinstimmung Zufall sein. Der Eingangs-Build braucht dafuer einen eigenen Laufordner mit
`node_modules`-Symlink, weil `state.js`/`galaxy.js`/`stats.js` `db.js` importieren:

```
mkdir -p /tmp/mbkum_run && cp -r /tmp/mb_kum /tmp/mbkum_run/dist
ln -s <repo>/server/node_modules /tmp/mbkum_run/node_modules
MESSBUILD=/tmp/mbkum_run/dist node probe_verdrahtung_a.mjs 20
```

### `probe_spielermodell.mjs`

Einmal-Diagnose fuer den Stillstand des Spielermodells ab Tag 3. Faehrt denselben Treiber wie
`sim13_lauf.mjs`, ersetzt aber jedes `try/catch` durch ein Protokoll der Ablehnungsgruende.

```
MESSBUILD=/tmp/sim13/dist node probe_spielermodell.mjs 5
```

Der Grund fuer ein eigenes Werkzeug war genau der Defekt, den es aufdeckte: die Aktionen
**werfen nicht**, sie liefern `{ ok:false, error }` zurueck. Ein `catch` faengt dort nie etwas.
Ergebnis: fuenf Defekte, darunter zwei, die jeder fuer sich beide Einnahmequellen abschalteten
(Minenertrag exakt 0 mangels Solarkraftwerk; kein Missionsversand mehr ab 180 Mining-Schiffen).

**Achtung, dieses Skript enthaelt eine KOPIE des alten Spielermodells** und ist damit ab sofort
historisch. Es dokumentiert den Zustand vor der Korrektur; fuer neue Diagnosen ist der Schalter
`--gruende` in `sim13_lauf.mjs` zu benutzen, der auf dem einen echten Modell arbeitet. Ein
zweites Modell zu pflegen, hiesse zwei Dinge zu messen und eines davon fuer das andere zu
halten.

## Geaendert

### `sim13_lauf.mjs`

Spielermodell ueberarbeitet (Protokoll: `spielermodell_diagnose.txt`), neuer Schalter
`--gruende` fuer die Ablehnungsstatistik. Der Lauf steht damit nicht mehr ab Tag 3 still:
Wert 0,02 -> 3,19 Mrd und Flottenmacht 0,06 -> 0,80 Mrd ueber sieben Tage. K1 erfuellt (6,6 %
groesster Einzelverlust), Forschungs-Leerlauf 2,4 %.

Aufruf unveraendert, plus optional:

```
node sim13_lauf.mjs --build=/tmp/sim13/dist --profil=aktiv --tage=7 --gruende
```

## Unveraendert weiterverwendet

- `make_messbuild_kum.mjs`, `make_messbuild_sim13.mjs` - Eingangs- und Simulationsbuild.
- `check_build_anker.mjs` - Ankercheck, normiert gelesen. Simulationsbuild dieser Session
  **-1,2 %**; fuenf Messungen desselben Ankers liegen jetzt bei -1,1 / -1,2 / -1,8 / -2,3 / -2,8 %.
- `lib3.mjs` - Profile, Referenzflotten, Wert-Einheiten.

## Werkzeug-Herkunft, geprueft

`make_messbuild_sim13.mjs` und `sim13_lauf.mjs` fehlten am Sessionbeginn im Repo und wurden
nachgereicht. Vor Gebrauch gegen das Protokoll geprueft: Blockzaehlung A 9 / B 2 / C 3 / D 5 /
E 2 = 21, `ownerUsername` in C3, Zielpruefung auf `/dist`, `node_modules`-Symlink, Schalter
`--f=` `--smax=` `--nm=` `--nur=`. Dazu Implementierungsdetails, die aus dem Protokoll nicht
rekonstruierbar sind (`mission.curvedWin`, `mission.lostUnits`). Kein Nachbau.

## Messbuild-Ordner

`/tmp/mb_kum` (Eingang), `/tmp/sim13/dist` (Simulationsbuild), `/tmp/mbkum_run/dist`
(Laufordner des Eingangs-Builds fuer die Gegenprobe) - alle ausserhalb des Repos.
