# Werkzeuge der Session vom 26.08.2026 (dritte Session)

Protokoll: `sim13_geruest.txt`. **Alle Zahlen sind Messbuild-Werte.** Kein Spielcode geaendert.

## Neu

### `make_messbuild_sim13.mjs`
Erzeugt den Simulations-Messbuild fuer Schritt 13 aus einem bereits vorhandenen kumulativen Build.

```
node make_messbuild_kum.mjs   /tmp/mb_kum      --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs /tmp/mb_kum  /tmp/sim13/dist
```

Schalter: `--f=12` (Entscheidung 13.1), `--smax=1.5` (Entscheidung 3), `--nm=<pfad>`
(node_modules), `--nur=A,B` (einzelne Bloecke isolieren, nur zur Fehlersuche).

21 Patches in fuenf Bloecken. **Jeder Patch bricht hart ab, wenn sein Anker nicht genau einmal
vorkommt** - hat in dieser Session dreimal gegriffen und drei still uebersprungene Patches
verhindert.

Zwei Dinge, die dieses Skript anders macht als seine Vorgaenger:
- **Das Ziel muss auf `/dist` enden.** Sonst landet die Datenbank im geteilten `/tmp/data`.
- **Es legt einen Symlink `<lauf>/node_modules` an.** Neu gegenueber allen bisherigen Werkzeugen:
  sobald ein Skript `db.js` importiert (und das tut jedes, das `state.js` laedt), sucht Node von
  `<lauf>/dist/db.js` aus nach oben nach `better-sqlite3`. Ohne den Verweis scheitert der Import.

### `sim13_lauf.mjs`
Treiber der 30-Tage-Fortschrittssimulation.

```
node sim13_lauf.mjs --build=/tmp/sim13/dist --profil=aktiv --tage=30
```

Schalter: `--profil=aktiv|gelegenheit|abwesend`, `--tage=30`, `--botzuege=30`,
`--mensch_unterschritte` (Mensch mit 2-Minuten-Takt statt stuendlich), `--out=<datei.json>`.

- Uhr wird **vor** dem ersten Spiel-Import gefaelscht und **nur zwischen Unterschritten** bewegt.
- Bot-Takt: 30 Unterschritte a 2 Minuten je Stunde. Nicht 30 Aufrufe im selben Zeitpunkt -
  `runGlobalHeartbeat()` wuerde 29 davon als `skipped` verwerfen.
- Spielermodell ausdruecklich **nicht** `economyBotTurn.ts` (Abschnitt 1b verbietet das).
- `process.exit(0)` am Ende.
- **Laufzeit gemessen: rund 40 s je Profil und 30-Tage-Lauf** bei vollem Bot-Takt. Die im Plan
  befuerchteten Kosten der "teuren Variante" sind praktisch bedeutungslos.

**Stand: Verrohrung geprueft, Spielermodell noch nicht auswertbar** (Protokoll Abschnitt 7).

## Unveraendert weiterverwendet

- `make_messbuild_kum.mjs` - Eingangs-Build.
- `check_build_anker.mjs` - Ankercheck, normiert gelesen. Ergebnis dieser Session:
  Eingangs-Build **-1,1 %**, Simulationsbuild **-2,0 %**, beide gueltig.
  **Grenze:** prueft die Beute-Kurven-Konstanten, **nicht** die neue Verdrahtung in `missions.js`.
