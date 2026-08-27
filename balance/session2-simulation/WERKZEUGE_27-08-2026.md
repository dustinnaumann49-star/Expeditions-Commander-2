# Messwerkzeuge - Stand 27.08.2026 (sechste Session)

Ergaenzt `WERKZEUGE_26-08-2026_fuenfte-session.md`. Alle Angaben betreffen ausschliesslich
Werkzeuge unter `balance/session2-simulation/`. **Kein Spielcode wurde geaendert.**

## Buildkette, jetzt vierstufig

```
node make_messbuild_kum.mjs         /tmp/mb_kum       --rf=4 --evk=0.20 --evm=0.08
node make_messbuild_sim13.mjs       /tmp/mb_kum    /tmp/sim13/dist
node make_messbuild_k5.mjs          /tmp/sim13/dist /tmp/k5/dist
node make_messbuild_reicherfund.mjs /tmp/k5/dist   /tmp/rf/dist  [--chance= --dauer_h= --aufschlag=]
MESSBUILD=/tmp/k5/dist node check_build_anker.mjs 40
```

Die vierte Stufe ist optional. Ohne sie ist alles wie bisher.

## Neu: `make_messbuild_reicherfund.mjs`

Stellschrauben fuer die Messung aus `k5_quellen.txt` Abschnitt 11.

| Schalter | Standard | Wirkung |
|---|---|---|
| `--chance=` | `0.08` | `ASTEROID_RICH_FIND_CHANCE`, an der **Aufrufstelle** gesetzt. `0` = Nullmessung. |
| `--dauer_h=` | `24` | `ASTEROID_MISSION_DURATION_MS` in Stunden. |
| `--aufschlag=` | `0` | fester Aufschlag auf den Stundenertrag statt der Verdopplung, gebucht als `reicher_fund`. |
| `--voll_faktor=` | `0` | **zeitpunktunabhaengige Form**: ein Treffer ist `faktor` mal die nominale Gesamtausbeute wert. Schliesst `--aufschlag` aus. |

### Die zeitpunktunabhaengige Form (`--voll_faktor`)

Heute verdoppelt der Fund den **bis dahin angesammelten** Betrag; sein Wert haengt damit an der
Stunde des Treffers und sein Erwartungswert waechst mit `(1+p)^n`. Diese Form entkoppelt beides:

```
E[Faktor auf den Mining-Ertrag] = 1 + n * p * faktor        (LINEAR in n)
Treffer ~ Binomial(n, p)  ->  SD = faktor * sqrt(n*p*(1-p))
```

Bei **festem Produkt `p*faktor`** bleibt der Erwartungswert konstant und die Streuung wird zum
Regler. Gemessen (vier Zellen, Produkt 0,140): VarKoeff 27,8 / 12,9 / 8,8 / 7,2 % bei praktisch
identischem Mittel.

Umgesetzt in zwei Patches: `accrueFarming()` legt den letzten Stundenertrag in `mission.__rfStunde`
ab (`runRichFindCheck()` sieht weder `state` noch `cfg`), und der Bonus wird daraus mal
`faktor * Missionsdauer` gebildet. **Ein FENSTER-Ansatz waere arithmetisch ausgeschlossen** - um das
heutige Niveau zu halten, muesste das Fenster 25 Stunden umfassen, die Mission dauert 24.

**Vierte Stufe statt Erweiterung von `make_messbuild_k5.mjs`** - Abschnitt 11 schlug einen
zusaetzlichen Patch-Block dort vor. Das waere genau der Fehler, den der k5-Kasten fuer sim13
vermeidet: die Patchzahl 18 ist dessen Echtheitspruefung. Zweistufig bleibt sie unberuehrt und der
Ankerwert des Eingangs vergleichbar.

**Selbsttest statt Zusicherung.** Mit Standardwerten unterscheidet sich der erzeugte Build vom
Eingang in genau zwei Zeilen, beide semantisch identisch (`0.08` statt der gleichnamigen
Konstante, `24` statt `24`). Ein `diff` gegen den Eingang ist damit der Passivitaetsnachweis -
dieselbe Form wie der 61-Zeilen-diff bei `make_messbuild_k5.mjs`.

**Echtheitspruefung des Eingangs:** das Skript bricht ab, wenn im Eingangs-Build der
`reicher_fund`-Haken fehlt. Ohne die K5-Instrumentierung hat die Quelle keine eigene Zeile und die
Messung waere nicht auswertbar - der Fehlschlag saehe dann aus wie "die Mechanik wirkt nicht".

## Neu: `run_reicherfund.mjs`

```
node run_reicherfund.mjs [--n=20] [--tage=7] [--profil=aktiv] [--out=datei.json]
                         [--nur=d24_c008,d12_c008] [--k5=/tmp/k5/dist]
```

Baut je Zelle einen eigenen Build und faehrt `sim13_lauf.mjs` N-mal als Unterprozess. Sieben
Zellen: Gruppe A Missionsdauer (24/12/4 h), Gruppe B Chance (0,08/0,04/0,02/0), Gruppe C feste
Form. Laufzeit rund 25 Minuten fuer 7 x 20 Laeufe.

**Die Missionsdauer ist ein eigener Regler - in Abschnitt 11 fehlte sie.** Sie ist der Grund,
weshalb der Reiche Fund heute so gross ist (Protokoll `reicherfund_11.txt` Abschnitt 6).

**Normiert gelesen: `reicher_fund` je Einheit `asteroid_mining`.** Die Zellen unterscheiden sich in
der tatsaechlichen Farmzeit je Woche, weil das Modell stuendlich handelt und bei 4-h-Missionen bis
zu eine Stunde zwischen Rueckkehr und Neustart verliert (gemessen 87 % der Farmzeit). `mining` ist
der Ertrag ohne jeden Fund und exakt proportional zur geflogenen Zeit. Gleiche Regel wie
"Belohnungszellen auf die vernichtete Feindmacht normieren".

**Der Aufschlag der Form-Gegenprobe wird nicht gesetzt, sondern kalibriert** - gegen den
*gemessenen* Mittelwert der Zelle `d24_c008`. Sonst verstellt man Niveau und Streuung gleichzeitig
und misst nichts ("Angleichen legt ein Verhaeltnis fest, kein Niveau").

**20 Laeufe je Zelle, nicht die fuenf aus Abschnitt 11.** Bei VarKoeff 64 % liegt der
Standardfehler des Mittels bei fuenf Laeufen bei 29 %; die beiden Zellen, die verglichen werden
sollen, liegen 9 % auseinander. Vorher ausgerechnet, nicht hinterher gemerkt.

**Ausgegeben wird auch, WELCHE Quelle die groesste ist.** Ohne diese Spalte saehe die Nullmessung
wie "die Aenderung wirkt nicht" aus - dort wird `asteroid_mining` zur groessten Quelle und K5
bleibt verletzt (Protokoll Abschnitt 9).

## Ankerwerte

| Lauf | normiert | roh | Siege |
|---|---|---|---|
| 1 | **+0,4 %** | -3,4 % | 4,13 |
| 2 | **-1,5 %** | +3,0 % | 4,45 |

Neun Messungen desselben Ankers: **+0,4 / -1,0 / -1,1 / -1,2 / -1,5 / -1,6 / -1,8 / -2,3 / -2,8 %.**

**Die Spanne ist 3,2 Punkte, nicht "rund 2", und der Anker kann positiv ausfallen.** Die bisher
notierte Erwartung "-1 bis -3 %" ist zu eng gefasst. Wer den ersten Lauf allein gesehen haette,
haette einen gueltigen Build fuer auffaellig gehalten. **Ein einzelner Ankerwert ausserhalb des
Bandes ist kein Beleg fuer einen defekten Build** - dieselbe Regel wie "eine Zahl aus einem Lauf
gehoert nicht neben eine Beobachtung aus einem anderen", hier auf den Anker selbst angewandt.
Die roh/normiert-Falle reproduziert sich zum siebten Mal, diesmal mit umgekehrten Vorzeichen.

## Laufzeiten, gemessen

| Zelle | Laufzeit |
|---|---|
| 7 Tage, `economy` | 9,6 s |
| 2 Tage, `tick` | 5,7 s |
| 2 Tage, `tick` + `--mensch_unterschritte` | 9,1 s (**Faktor 1,58**) |
| 7 Zellen x 20 Laeufe, `economy` | rund 25 min |

**`--mensch_unterschritte` kostet Faktor 1,6, nicht 30.** Der Kopf von `sim13_lauf.mjs` sagt "den
30-fachen Aufwand"; das trifft nicht zu, weil die 30 Unterschritte fuer die Bots ohnehin laufen und
der zusaetzliche Menschen-tick daneben billig ist. Punkt 4 kostet damit rund 75 Minuten statt der
befuerchteten Stunden.

## Eigener Vorbehalt dieser Session

Mit `--mensch_unterschritte` wird `probe()` 30x je Stunde aufgerufen, `spielerZug()` aber nur
einmal. `ressourcenAblehnung`, an dem **K3b** haengt, wird nur in `spielerZug()` zurueckgesetzt -
in 29 von 30 Proben steht der Wert des letzten Stundenzugs. K2 ist nicht betroffen, K3b vermutlich
nach oben verzerrt. **Vor Punkt 4 zu klaeren, nicht in dieser Session behoben.**

## Falle dieser Session

**Ein abgebrochenes WARTEKOMMANDO sieht aus wie ein abgebrochener Lauf.** Der Sweep lief korrekt
ueber `setsid nohup ... < /dev/null &`; ein `sleep 600` zum Nachsehen riss dagegen das Zeitlimit der
Werkzeugausfuehrung und meldete einen Fehler. Der Messlauf war davon unberuehrt (per `pgrep`
geprueft). **In kurzen Schritten nachsehen und den Prozess pruefen, statt aus einer Fehlermeldung
auf den Lauf zu schliessen** - die Gegenrichtung der bekannten Regel "ein abgebrochener Lauf sieht
aus wie ein haengender".
