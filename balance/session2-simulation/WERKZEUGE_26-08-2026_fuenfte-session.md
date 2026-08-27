# Messwerkzeuge - Stand 26.08.2026 (fuenfte Session)

Ergaenzt `WERKZEUGE_26-08-2026_vierte-session.md`. Alle Angaben betreffen ausschliesslich
Werkzeuge unter `balance/session2-simulation/`. **Kein Spielcode wurde geaendert.**

## Neu: `make_messbuild_k5.mjs`

Quellen-Instrumentierung fuer Abnahmekriterium 5 (Quellenanteil Woche 1) und 6 (Plateau).

```
node make_messbuild_kum.mjs   /tmp/mb_kum      --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs /tmp/mb_kum   /tmp/sim13/dist
node make_messbuild_k5.mjs    /tmp/sim13/dist /tmp/k5/dist
MESSBUILD=/tmp/k5/dist node check_build_anker.mjs 40
```

**Zweistufig, nicht als Erweiterung von `make_messbuild_sim13.mjs`** - dasselbe Muster wie
`make_messbuild_korr.mjs` und `make_messbuild_salve.mjs`. Grund: die Blockzaehlung
A 9 / B 2 / C 3 / D 5 / E 2 = 21 ist die Echtheitspruefung des sim13-Werkzeugs und bleibt
unberuehrt; der Ankerwert des Eingangs bleibt vergleichbar; und die Instrumentierung laesst sich
abschalten, was die Gegenprobe erst ermoeglicht.

**18 Patches**, jeder mit hartem Abbruch bei fehlendem oder mehrdeutigem Anker. Ziel MUSS auf
`/dist` enden (Wegwerf-Datenbank im eigenen Unterordner, Falle V2/V3 aus `sim13_geruest.txt`);
`node_modules` wird in den Laufordner verlinkt, nicht in `dist`.

**Passiv ohne Beobachter.** Jede eingesetzte Zeile ruft `globalThis.__K5?.(...)`. Ist der Haken
nicht gesetzt - also in jedem Skript ausser `sim13_lauf.mjs` - tut der Build nichts. Belegt
strukturell: `diff` gegen den Eingang ergibt 61 eingefuegte Zeilen, alle innerhalb von
Hook-Bloecken, und eine entfernte Zeile (if-Zeile, um Klammern ergaenzt).

### Wo gebucht wird - und warum nicht dort, wo es naheliegt

`mission.farmed` sammelt **vier** Quellen ein (Asteroiden-Mining, Abschusspraemie der Eskorte,
Reicher Fund, Piraten-Pluenderung). An der Auszahlung in `finalizeMission()` zu buchen trennt
deshalb nichts - gebucht wird beim **Fuellen**.

Daraus folgt die Falle: `abortMissionDestroyed()` zahlt **nichts** aus. Wer beim Auflaufen bucht,
zaehlt eine verlorene Mission als Einnahme. Loesung: je Mission in `mission.__k5` sammeln,
**Commit ausschliesslich in `finalizeMission()`**.

| Quelle | Datei im Messbuild |
|---|---|
| `mine` | `actions.js`, `accrueBuildingProduction` |
| `asteroid_mining` / `eskorte_praemie` / `reicher_fund` / `piraten_pluenderung` | `missions.js`, jeweils an der Fuell-Stelle |
| `piraten_beutekurve` / `wrack_bergung` / `rundung` | `missions.js`, A6-Block |
| `container_*` | `inventory.js`, `addContainers` - der einzige gemeinsame Eingang |
| `gruppe_event` / `gruppe_expedition` | `groupOps.js` |
| `dm_mission` / `dm_raid` / `teile_mission` | `missions.js`, `raids.js` |

Die Container-**Herkunft** kommt ueber ein Etikett (`globalThis.__K5Q`), das die fuenf
Aufrufstellen setzen - bewusst nicht ueber einen Stack-Trace, der bei jeder Umbenennung still
danebengreift. Das Etikett wird **nicht** zurueckgesetzt: `grantContainers()` im Raid ruft
`addContainers` dreimal hintereinander. Dafuer sind alle fuenf Stellen etikettiert; bleibt
`container_unbekannt` stehen, ist ein sechster Pfad dazugekommen.

## Geaendert: `sim13_lauf.mjs`

```
node sim13_lauf.mjs --build=/tmp/k5/dist --profil=aktiv --tage=14 [--treiber=tick] [--gruende]
```

### `--treiber=economy|tick` (Standard: `economy`, unveraendert)

`runEconomyTick()` ruft **weder** `processRaidTimer()` **noch** die Cross-User-Sweeps auf. Am Code
nachgezaehlt: `processRaidTimer` hat genau zwei Aufrufer, `actions.js` (in `tick()`) und
`heartbeat.js`. Der Lauf loeste dadurch **nie einen Raid aus** - die gemessen groesste Quelle der
Startphase fehlte vollstaendig. `--treiber=tick` schaltet auf `actions.tick()` um.

Standard bewusst unveraendert gelassen, damit die Wirkung der Umstellung getrennt sichtbar bleibt.
Kosten: Faktor 7,6 (14 Tage: 19,1 s gegen 145,3 s).

**Ein Sieben-Tage-Lauf kann die Raid-Frage nicht beantworten.** Start ist Montag, 05.01.2026;
`RAID_FALLBACK_SCHEDULE` liegt auf Mittwoch und Sonntag 0:00 Berlin bei Chance 0,7. In sieben Tagen
liegen zwei Checkpoints, und ein sonntags gespawnter Raid ist bei Laufende noch nicht abgearbeitet -
`state.raid` steht dann auf AKTIV bei `raidsRepelled 0/0`, was wie "kein Raid" aussieht. Ab
**14 Tagen** ist die Zelle brauchbar.

### Hauptbuch und Gegenprobe

`globalThis.__K5` bucht nur fuer den Menschen (`state.userId === MENSCH_ID`), je Tag und Quelle.

**Container werden beim FUND bewertet, nicht beim Oeffnen** - `addContainers()` schreibt nach
`state.inventory`, und der Raid zahlt ausschliesslich in Containern. Erwartungswerte aus
`raid_yield.txt` (silber 60,1 / gold 127,2 / elite 237,6 Mio), weil genau sie die
Woche-1-Zusammensetzung vom 20.08.2026 tragen. Die Einloesung (`applyReward`) wird als **neutrale**
Zeile gemeldet, nicht als Einnahme - melden muss man sie trotzdem, sonst erschiene sie in der
Gegenprobe als "nicht zugeordnet".

**Die Gegenprobe ist der eigentliche Beleg.** Ein Anteilskriterium, dessen Nenner aus den
instrumentierten Zeilen selbst gebildet wird, sieht auch dann sauber aus, wenn eine Buchungsstelle
fehlt - die Anteile summieren sich weiter auf 100 %. Deshalb wird der Nenner **unabhaengig**
gemessen: `state.resources` des Menschen wird nach jedem `loadPlayerState()` mit Accessoren
umhuellt, die jeden positiven Zuwachs aufsummieren. Das erfasst auch die indizierten Zugriffe
(`state.resources[key]` in `economyActions.js` und `stations.js`).

```
NICHT ZUGEORDNET : 0,000 %   in sechs von sechs Laeufen
```

Steigt diese Zeile ueber 0,1 %, meldet der Lauf das ausdruecklich - dann fehlt eine Buchungsstelle
in `make_messbuild_k5.mjs`.

### K6-Plateau: Setzung, umkehrbar

Der Plan nennt keine Schwelle. Gelesen als: ein Tag gehoert zum Plateau, wenn seine Tageseinnahme
das bis dahin erreichte Maximum um **weniger als 5 %** uebertrifft; gemessen wird die laengste
solche Folge. Die volle Tageskurve steht daneben, damit die Zahl nachpruefbar bleibt.

### JSON-Ausgabe

`--out=` enthaelt jetzt zusaetzlich `treiber`, `quellen` (je Tag: `ein` / `neutral` / `dm`) und
`gegenprobe`.

## Ankerwerte

| Build | normiert | roh |
|---|---|---|
| `/tmp/sim13/dist` | -1,0 % | +2,7 % |
| `/tmp/k5/dist` | -1,6 % | +4,4 % |

Sieben Messungen desselben Ankers liegen bei -1,0 / -1,1 / -1,2 / -1,6 / -1,8 / -2,3 / -2,8 %.
**Immer normiert lesen** - die roh/normiert-Falle hat sich zum sechsten Mal reproduziert.

## Eigener Fehler dieser Session

Zwei Anker fuer `groupOps.js` waren aus der TypeScript-Quelle statt aus dem kompilierten `dist`
uebernommen (dort acht statt vier Leerzeichen Einrueckung). Der harte Abbruch hat es sofort
gemeldet. **Vierter Fundort derselben Fehlerform** nach `miningCapable`, `sh.waffen` und der
D2-Einrueckung - Messregel 16 gilt unveraendert: Anker immer aus `dist` lesen.

---

## Nachtrag: K1b neu, K4 umgestellt

Beide am 26.08.2026 gebaut, nachdem der Nutzer die Entscheidung ueberlassen hat. Beide umkehrbar.

### K1b - ereignisbasiert statt stuendlich

```
K1  kein Totalverlust (<70 %) : groesster Einzelverlust 92.0 %   <- je STUNDE, siehe K1b
K1b groesster Rueckgang (24 h): 99.9 % (Stunde 503, Tag 20)      <- K1 VERLETZT, wenn je Ereignis
```

**K1 bleibt unveraendert** - es hat ueber mehrere Sessions Vergleichswerte, und eine Aenderung der
Definition entwertet sie alle. Dasselbe Muster wie K3/K3b.

K1b misst den groessten Rueckgang vom Hoch der letzten `K1B_FENSTER = 24` Stunden auf den aktuellen
Stand. **Das Fenster ist bewusst begrenzt:** ohne Grenze zaehlte auch eine langsame Zermuerbung
ueber Wochen als "ein Ereignis", und das ist nicht die Frage, die K1 stellt.

**Gegenprobe:** in Laeufen ohne mehrstuendiges Ereignis liefern K1 und K1b denselben Wert (zweimal
6,1 %) - die neue Kennzahl erfindet nichts.

### K4 - an den echten Sperren

Vorher: "Flottenmacht erreicht `npcFloor`". Gemessen wirkungslos (300.000-3.000.000 gegen rund
60.000.000 Startflottenmacht, sieben Sektoren am Tag 0).

**Sektoren taugen strukturell nicht als Massstab.** Am Code nachgesehen: es gibt keine Sperre, und
die Piraten-Sektoren skalieren ihre Gegnerstaerke mit der eigenen Macht mit - dort wird nie etwas
freigeschaltet, es wird nur schwerer. Schiffe, Verteidigung und Forschung haben **ueberhaupt keine**
Voraussetzung; `tier` in `ships.ts` ist eine Klassenbezeichnung, keine Sperre.

Gestaffelt freigeschaltet wird genau viererlei, und `pruefeFreischaltung()` liest jetzt das:

| Sperre | Woran ablesbar |
|---|---|
| Heimatbasis V2 / V3 | `state.buildingTier`, Schwelle `HOME_TIER_UNLOCK_LEVELS` (Minen 36/32/30) |
| Stations-Stufe | `station.tier`, `checkTierUnlock()` |
| Imperator | `fleet.imperator > 0` (Teile-Sperre, 1.000 je Kategorie) |
| Sandronator | `fleet.sandronator > 0` (`unique`) |

Alle vier direkt aus dem Spielstand, ohne Nachbau einer Bedingung. **Ergebnis: Wochen 1-4 ohne
eine einzige Freischaltung** - jetzt eine Aussage ueber das Spiel statt ein Artefakt der Kennzahl.

### Laufzeiten, gemessen

| Zelle | Laufzeit |
|---|---|
| 14 Tage, `economy` | 19,1 s |
| 14 Tage, `tick` | 145,3 s |
| 30 Tage, `tick` | 318,5 s |

**Lange Laeufe abgekoppelt starten** (`setsid nohup ... < /dev/null &`) und immer mit `--out=`:
ein 30-Tage-Lauf ist in dieser Session einmal vorzeitig beendet worden, ohne Endauswertung - und
die daraus gezogene Schlussfolgerung war falsch.
