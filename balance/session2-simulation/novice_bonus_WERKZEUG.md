# run_novice_bonus.mjs - Bedienung

Messwerkzeug zu Entscheidung 12 (Frischling-Bonus), angelegt am 20.08.2026.
Ergebnisse und Befunde stehen in `novice_bonus.txt` - diese Datei erklaert nur die Bedienung.

**ALLE ERGEBNISSE SIND MESSBUILD-WERTE, KEIN REPO-STAND.**

## Vorbereitung

```
cd server && npm install && npx tsc          # der Worker laedt immer aus dist/
cd ../balance/session2-simulation
node make_messbuild_kum.mjs /pfad/ausserhalb/des/repos --rf=4 --evk=0.20 --evm=0.08
export MESSBUILD=/pfad/ausserhalb/des/repos
```

Ohne `--rf/--evk/--evm` entsteht der Stand mit Block A Schritt 2 allein, ohne Entscheidung 16.
Der Messbuild-Ordner gehoert NICHT ins Repo.

## Reihenfolge

Die vier Teile bauen aufeinander auf. `tageslauf` rechnet nur noch auf dem Gitter, das
`gitter` und `raid` vorher gemessen haben - ohne die beiden gibt es keine JSON-Datei.

```
node run_novice_bonus.mjs anker 40             # Build-Pruefung + Zahlenpruefung, ca. 4 s
node run_novice_bonus.mjs gitter 40 f0         # Solo-Gitter, ca. 150 s
node run_novice_bonus.mjs raid 200 f0          # Raid-Zelle mit hoher Serienzahl, ca. 55 s
node run_novice_bonus.mjs tageslauf 40 f0      # Tageslauf, ca. 2 s
```

Danach dasselbe mit `f3b` statt `f0` fuer die zweite Kampfprofil-Klammer.

- `f0`  = Forschung 0, keine Module, keine Klasse, kein Booster (Tag 1)
- `f3b` = Forschung 3 plus Kampf-Booster (Ende Woche 1/2, entspricht dem Profil `schwach`)

`gitter` und `raid` schreiben in dieselbe Datei `novice_gitter_<profil>.json`. `raid`
ueberschreibt dabei die groebere Raid-Zelle aus `gitter` - deshalb IMMER in dieser Reihenfolge,
sonst steht im Gitter die Fassung mit 40 statt 200 Ziehungen.

Jeder Teil schreibt zusaetzlich ein Protokoll `novice_<teil>_<profil>.out`.

## Was das Werkzeug NICHT ist

Kein Zustandsverlauf. Mining und Heimatbasis kommen aus den echten Funktionen
(`missions.miningMultiplier`, `actions.mineOutputPerHour`), Solo und Raid aus dem echten
Kampf-Worker - aber die Bau- und Flottenbahn ist ein Modell, kein simulierter Spielverlauf.
Der Abschnitt "Was Modell ist und nicht Messung" in `novice_bonus.txt` zaehlt jede einzelne
Setzung auf. Fuer die 30-Tage-Simulation (Schritt 13) ist die Ertragsbuchhaltung
wiederverwendbar, die Trajektorie nicht.

## Datenbank

`actions.js`/`missions.js` ziehen ueber `state.js` -> `db.js` eine Datenbank mit hartkodiertem
Pfad. Das Skript kopiert `dist` deshalb ins Temp-Verzeichnis und verlinkt `node_modules` - die
Wegwerf-Datenbank landet dort, nicht in einer laufenden Partie. Derselbe Kniff wie in
`run_income_level.mjs` und `run_income_baseline_v2.mjs`; Vorbedingung V2 aus Abschnitt 1b
braucht dafuer keinen Eingriff in `db.ts`.
