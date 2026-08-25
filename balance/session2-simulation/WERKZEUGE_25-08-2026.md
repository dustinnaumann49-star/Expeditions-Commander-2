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

## Neu (Nachtrag am selben Tag): `run_volley_mix_19.mjs`

Misst den Schadensanteil der drei Salven-Typen ueber die Flottengroesse, ueber die Kombinationen
aus Weg 1 (maxCount, reine Bestandsaenderung, kein eigener Build noetig) und Weg 2 (JE/DECKEL,
steckt im Build von `make_messbuild_salve.mjs`).

    MESSBUILD=/tmp/mb_kum SALVE=1 FAKTOREN=1,2 node run_volley_mix_19.mjs 12
    MESSBUILD=/tmp/mb_w2  SALVE=2 FAKTOREN=1,2 node run_volley_mix_19.mjs 12

`SALVE=1|2` dient der Beschriftung und wird gegen den geladenen Build geprueft: enthaelt der
Build `SALVE_JE`, muss `SALVE=2` gesetzt sein, sonst Abbruch. Damit kann keine Zelle falsch
etikettiert im Protokoll landen - genau der Fehler, der bei zweistufigen Builds am leichtesten
passiert. Ausserdem liest das Skript JE und DECKEL aus dem Build und schreibt sie in den Kopf
der Ausgabe, statt sie aus dem Aufruf zu uebernehmen.

Umgebungsvariablen: `FAKTOREN` (Vervielfachung des Salven-Bestands, Weg 1), `ANTEILE`
(Skalierung der Endgame-Zusammensetzung). Das Skript haengt seine Ausgabe an
`volley_mix_19.txt` an.

Zusaetzliche Messbuild-Ordner an diesem Tag: `/tmp/mb_w2` (JE 20.000 / DECKEL 8),
`/tmp/mb_w2d16` (20.000 / 16), `/tmp/mb_w2j10` (10.000 / 8) - alle ausserhalb des Repos.

## Neu (zweiter Nachtrag am selben Tag): `run_volley_def_19.mjs`

Prueft die Wirkung von Weg 2 auf `sentinelkanone`/`ultimatekanone` im Raid.

    MESSBUILD=/tmp/mb_kum   ESC=1,1.20,1.60 BUNKER=0.5 node run_volley_def_19.mjs 5
    MESSBUILD=/tmp/mb_w2d16 ESC=1,1.20,1.60 BUNKER=0.5 node run_volley_def_19.mjs 5

Zwei Teile. Teil 1 rechnet DETERMINISTISCH aus, ob die Feindstapel der Angriffswellen die
JE-Schwelle ueberhaupt erreichen - das entscheidet die Frage "ist Entscheidung 18 betroffen"
ohne eine einzige Serie. Teil 2 faehrt den Raid und weist gewonnene Wellen, Verteidigungs- und
Flottenverlust sowie den Schadensanteil der beiden Anlagen aus.

`ESC`/`BUNKER`/`WAVES` haben dieselbe Bedeutung wie in `run_raid.mjs`, `DEFENSE_LARGE` ist
identisch uebernommen, damit die Zahlen mit `raid_hardness_18.txt` vergleichbar bleiben.

**Falle, die hier zugeschnappt ist:** `RAID_WAVE_ROLL` ist `[1.2, 1.7, [2.3, 2.5]]` - der dritte
Eintrag ist eine SPANNE, kein Wert. Ein naiver Mittelwert `(a+b+c)/3` ergibt `NaN`, und
`generateFallbackFleet(NaN)` liefert eine LEERE Flotte statt eines Fehlers. Die erste Fassung
meldete deshalb "groesster Stapel 0, Weg 2 bindet NEIN" fuer ALLE Zellen - eine Antwort, die
zufaellig plausibel aussah und in die falsche Richtung beruhigt haette. Aufgefallen ist es nur,
weil auch die Endgame-Zelle mit 470 Mrd Wellenmacht 0 Einheiten auswies. Wo eine Konstante
gemischte Typen enthaelt, den Erwartungswert explizit ausrechnen und das Ergebnis auf
Plausibilitaet ansehen, statt der Zahl zu glauben.

Zusaetzlicher Messbuild-Ordner: `/tmp/mb_w2d16` (JE 20.000 / DECKEL 16) - die entschiedene
Fassung.

## Neu (zweite Session am 25.08.2026): `probe_simclock_13.mjs`

Sonde zu den Vorbedingungen V1 (Zeitquelle), V2 (Datenbank) und dem neu gefundenen V3 aus
Schritt 13. Protokoll `sim_vorbedingungen_13.txt`.

    cd server && npm install && npx tsc
    cd balance/session2-simulation
    node probe_simclock_13.mjs
    node probe_simclock_13.mjs --run=/tmp/sim13-lauf1 --behalten

**Diese Sonde ist die einzige in diesem Ordner, die ABSICHTLICH gegen den REPO-BUILD laeuft
und deren Ergebnisse KEINE Messbuild-Werte sind.** Sie misst keine Balance-Zahl, sondern die
Infrastruktur: ob die gefaelschte Uhr durch Wirtschaft, Wochentagslogik und Kampf-Worker
traegt und wo die Wegwerf-Datenbank landet. `--dist=` nimmt trotzdem einen Messbuild
entgegen, falls die Frage einmal gegen einen gepatchten Baum zu stellen ist.

Fuenf Teile, alle deterministisch, keine Serien:

| Teil | Frage |
|---|---|
| 1 | Wo legt eine dist-Kopie ihre Datenbank ab? |
| 2 | Traegt `Date.now`-Faelschung exakt durch `runEconomyTick()`? (0 h / 1 h / 5 h) |
| 3 | Folgen `berlinWeekday()`, `nextWeeklyCheckpoint()` und `processRaidTimer()` der Faelschung? |
| 4 | Laeuft `runCombatInWorker()` unter der Faelschung? |
| 5 | Bleibt die Uhr innerhalb eines Schritts konstant? |

**Drei Dinge, die beim Bau der Simulation daraus folgen:**

1. **Die gefaelschte Uhr muss INNERHALB eines Schritts konstant sein.** `tick()` benutzt
   `Date.now` zugleich als Spieluhr und als Stoppuhr (`t0..t6`, `SLOW_TICK_*`), `heartbeat.ts`
   ebenso (`SLOW_USER_TICK_MS`). Eine bei jedem Aufruf weiterzaehlende Faelschung erzeugt dort
   Stundenwerte und flutet den Lauf mit Warnungen.
2. **Der Build gehoert in einen eigenen Unterordner des Laufordners.** `db.js` bildet seinen
   Pfad als `__dirname/../data/game.db` und liegt in der Wurzel des dist-Baums - eine Kopie
   direkt nach `/tmp/mb_kum` legt die Datenbank nach `/tmp/data/game.db`, geteilt von jedem
   weiteren Messbuild unter `/tmp` und von keinem `rmSync` erfasst. Mit `<lauf>/dist` landet sie
   unter `<lauf>/data` und verschwindet mit dem Lauf.
3. **Der Prozess endet nicht von selbst.** Der Worker-Pool aus `combatRunner.js` haelt einen
   Thread, `better-sqlite3` ein Handle. Der erste Sondenlauf lief deshalb in ein Zeitlimit,
   obwohl alle fuenf Teile bereits sauber durchgelaufen waren - ein abgebrochener Lauf ist von
   einem haengenden nicht zu unterscheiden. `process.exit(0)` am Ende ist Pflicht, nicht Kosmetik.

Kein Messbuild-Ordner noetig; der Laufordner wird nach dem Lauf geloescht (`--behalten` haelt
ihn).
