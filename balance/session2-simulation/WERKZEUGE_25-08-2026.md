# Werkzeuge, Stand 25.08.2026

Ergaenzung zu WERKZEUGE_21-08-2026.md und WERKZEUGE_22-08-2026.md. Hier stehen nur die an
diesem Tag NEU angelegten Dateien. Bestehende Skripte wurden NICHT veraendert.

## Neu: `make_messbuild_korr.mjs`

Zweistufiger Messbuild-Patch nach dem Muster von `make_messbuild_salve.mjs`: setzt auf einem
bestehenden Messbuild auf und veraendert dort AUSSCHLIESSLICH
`MULTI_TARGET_POWER_CORRECTION` in `game/data/combatConstants.js`.

    node make_messbuild_kum.mjs  /tmp/mb_kum  --rf=4 --evk=0.20 --evm=0.08
    node make_messbuild_korr.mjs /tmp/mb_kum  /tmp/mb_k40 --korr=40

Der ganze dist-Baum wird kopiert, damit `combatRunner.js` seinen Worker relativ zu sich selbst
findet und die Aenderung auch IM Worker-Thread gilt. Findet der Patch die Konstante nicht,
bricht er hart ab statt still den Ausgangswert stehen zu lassen - sonst misst der naechste
Lauf unbemerkt den Ist-Zustand.

## Neu: `probe_volley_power_19.mjs`

Deterministische Sonde, keine Serien. Gibt je Flottengroesse aus, wie stark die Korrektur die
bemessene Flottenmacht hebt (= 1:1 der Aufschlag auf die Gegnerstaerke), was davon auf der
Belohnungsseite ankommt, und den Wert je Machtpunkt aller Kampfschiffe gegen den Zielwert 1,15
aus Entscheidung 6. Enthaelt eine Gegenprobe: die eigene Nachrechnung der korrigierten Macht
muss exakt `combatFleetPowerBase()` aus dem geladenen Build treffen, sonst Abbruch.

    MESSBUILD=/tmp/mb_kum node probe_volley_power_19.mjs

## Neu: `run_volley_power_19.mjs`

Drei Modi.

    MESSBUILD=/tmp/mb_k8 node run_volley_power_19.mjs anteile 1 0.005,0.02,0.1
    MESSBUILD=/tmp/mb_k8 node run_volley_power_19.mjs aequiv 20 0.005
    MESSBUILD=/tmp/mb_k8 DEF=large node run_volley_power_19.mjs raid 4 1.0

- `anteile` - deterministische Zellenuebersicht (Werte, Stueckzahlen, bemessene Macht beider
  Flotten).
- `aequiv` - der Aequivalenz-Test: Flotte A (mit Salvenschiffen bei maxCount) gegen Flotte B
  (gleicher FLOTTENWERT, ohne Salvenschiffe) ueber eine 24h-Solo-Mission. Der Skalierungsfaktor
  fuer B wird numerisch gesucht, weil Rundung auf ganze Schiffe den Wert verschiebt. Metrik ist
  die Netto-Wertbilanz, nicht die Verlustquote (Messregel 4).
- `raid` - Replikation von `resolveOneWave()` mit Ausweis des WERTVERLUSTS je Typ, nicht nur
  der Stueckzahl. Nachgetragen nach dem Nutzerhinweis vom 25.08.2026.

Umgebungsvariablen: `SEITE=A|B|AB` (B haengt konstruktiv nicht von der Korrektur ab und muss
bei einem Sweep nur einmal gemessen werden - das ist keine Auslassung), `PROFIL`, `SEKTOR`,
`DEF=small|large`, sowie im Raid-Modus `WAVES`, `ESC`, `BUNKER` mit derselben Bedeutung wie in
`run_raid.mjs`.

## Warnung, die weiter gilt

`run_income_baseline_v2.mjs` UEBERSCHREIBT `income_baseline_v2.txt` bei jedem Lauf. Vor solchen
Laeufen `git status` sauber haben. An diesem Tag wurde das Skript nicht ausgefuehrt.

## Messbuild-Ordner

`/tmp/mb_kum`, `/tmp/mb_k1`, `/tmp/mb_k2`, `/tmp/mb_k4`, `/tmp/mb_k8`, `/tmp/mb_k16`,
`/tmp/mb_k40`, `/tmp/mb_k100`, `/tmp/mb_k130`, `/tmp/mb_k160`, `/tmp/mb_k250` - alle ausserhalb
des Repos, wie vorgesehen.
