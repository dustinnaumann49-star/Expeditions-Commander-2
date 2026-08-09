# Umsetzungsplan Balance (Stand 09.08.2026)

**Zweck dieser Datei.** `FINALE_BALANCE_CHECKLIST.md` enthaelt die vollstaendige Analyse aus vier
Sessions (Befunde, Messwerte, Methodik). Sie bleibt unveraendert und ist die Beweisgrundlage.
Diese Datei enthaelt die daraus **getroffenen Entscheidungen** und ist die Arbeitsanweisung fuer die
Umsetzungs-Session.

**Status:** Am Spielcode wurde weiterhin NICHTS geaendert. Alle Entscheidungen sind getroffen, die
Umsetzung steht aus. **14 Entscheidungen, 12 Reparaturen** (Stand 09.08.2026, zweite Fassung).

**Wer diese Datei liest, kann direkt loslegen.** Zahlen muessen nicht neu hergeleitet werden - sie
stehen in der Checkliste unter dem jeweils genannten Befund.

---

## 0. Zuerst lesen: Korrekturen an der Checkliste

1. **Die Pfadangaben in der Checkliste stimmen nicht.** `balance/session3-simulation/` und
   `balance/session4-simulation/` existieren NICHT. Saemtliche Skripte aller Sessions (2, 3 und 4)
   liegen in **`balance/session2-simulation/`**. Die README in diesem Ordner ist die
   Session-3-README und verweist ebenfalls ins Leere. Beim ersten Zugriff korrigieren oder die
   Ordner nachziehen.
2. **`lib.mjs`, `lib3.mjs` und `lib4.mjs` sind identische Kopien.** Nicht drei Varianten pflegen.
3. Die Git-Historie enthaelt nur einen Sammel-Commit. Ein Diff gegen die in der Checkliste
   genannten Commits (`b4d8181`, `ee863a6`, `235347c`) ist nicht moeglich. Stichproben in allen
   drei Sessions zeigen den Code unveraendert.

---

## 1. Zielbild (die Leitlinie fuer alle Einzelentscheidungen)

Nutzervorgabe: **Das Spiel soll dauerhaft tragen, ohne Endpunkt. Zahlen duerfen immer weiter
wachsen. Verluste sollen spuerbar sein, aber nie zum Totalverlust fuehren.**

Daraus folgt als Leitsatz:

> **Jede Groesse muss auf beiden Seiten mitwachsen: der Gegner mit der Flotte, die Beute mit dem
> vernichteten Gegner, die Verluste ebenso.**

Der Kreislauf, der daraus entsteht und nie endet:

1. Groessere Flotte -> staerkere Gegner (existiert bereits ueber `PIRATEN_MULTIPLIER_ROLL` etc.)
2. Staerkere Gegner -> mehr Beute (beschlossen: Beute proportional zur vernichteten Feindmacht)
3. Staerkere Gegner -> mehr Verluste -> **die einzige mitwachsende Ausgabe des Spiels**

Punkt 3 ist der Kern. Nach der beschlossenen 30-%-Wrack-Bergung bleiben 70 % jedes Verlusts
dauerhaft weg, automatisch skalierend mit der Flottengroesse. Alle festen Listen (Gebaeude, Module,
Forschung) sind damit **Aufbau der ersten Monate**, nicht Inhalt des Spiels.

**Wichtige Praezisierung zum bereits beschlossenen "Ressourcen-Engpass":** Gemeint ist ein
RELATIVER Engpass ("das naechste Ziel kostet mehr, als gerade da ist"), kein absoluter ("es ist zu
wenig da"). Einnahmen duerfen ins Astronomische wachsen, solange die Ziele mitwachsen.

### Bereits zuvor getroffene Grundsatzentscheidungen (nicht neu diskutieren)

- Es soll einen Ressourcen-Engpass geben (im Sinne oben).
- Flottenwachstum wird ueber **hoehere Belohnung** belohnt, ausdruecklich NICHT ueber geringere
  Verluste oder schwaechere Gegner.
- **Wrack-Bergung 30 %** des Wertes der eigenen verlorenen Schiffe.
- **Beute proportional zur tatsaechlich vernichteten Feindmacht.**
- Alle Ertragsrechnungen laufen gegen die Oekonomie NACH diesen Aenderungen.

### Referenzwerte (Einnahmen-Baseline, Stand vor allen Aenderungen)

| Quelle | Wert/Tag |
|---|---|
| Elite-Bollwerk (32,60 Mrd je Serie, real alle 3 Tage) | 10,87 Mrd |
| Raid (Mi+So, 12/12) | 6,31 Mrd |
| Asteroiden (3 Felder) | 2,83 Mrd |
| Solo-Piraten Hoch | 1,13 Mrd |
| Heimatbasis V1 voll | 0,55 Mrd |
| **Summe** | **21,69 Mrd** |

Dunkle Materie: **1.088/Tag** Einnahmen gegen **103/Tag** groesste laufende Senke (Faktor 10,5).
Reale Nutzerflotte: 34,99 Mrd Wert, 18,58 Mrd BasePower, 31.276 Schiffe.
Alle Betraege in Wert-Einheiten (`metall*1 + kristall*1,5 + deuterium*3`, entspricht `TRADE_VALUE`).

---

## 1a. RAHMENBEDINGUNG: Server-Reset nach der Umsetzung

**Nutzerentscheidung (09.08.2026): Nach Abschluss aller Aenderungen wird der Server komplett
zurueckgesetzt. Alle Spieler fangen von vorne an.**

Das aendert den Zuschnitt dieses Plans erheblich.

### Was dadurch entfaellt

- **Keine Ruecksicht auf bestehende Spielstaende.** Alle Nachteile in diesem Plan, die mit
  "wirkt rueckwirkend" oder "entwertet bereits getaetigte Investitionen" begruendet sind, sind
  hinfaellig. Betrifft Entscheidung 7 (Minen-Kostenkurve) und Entscheidung 9.2 (Slot-Reduktion).
- **Keine Migrations-Sorgen.** Die automatische Forschungsfeld-Migration in `loadPlayerState()`
  (README Punkt 33) muss zwar korrekt bleiben, wird aber praktisch nicht mehr gebraucht.
- Es kann beherzter eingegriffen werden als urspruenglich geplant.

### Was dadurch NEU dazukommt - der wichtigste Punkt dieses Abschnitts

**Alle Messungen der Sessions 1-4 sind gegen ENTWICKELTE Accounts gelaufen** (reale Flotte
34,99 Mrd Wert, Profil "voll", Forschung 10, Module 10, Klasse, Dauer-Booster). **Nach dem Reset
wird genau die Phase gespielt, die am schlechtesten gemessen ist.** Der gesamte Plan ist auf das
Endspiel geeicht.

Die Einnahmen-Baseline von 21,69 Mrd/Tag ist ein Endspiel-Wert. In Woche 1 liegt sie um
Groessenordnungen darunter. Jede Aussage der Form "X Mrd sind viel/wenig" in diesem Plan gilt
NICHT fuer die Startphase.

**Ein Reset ist einmalig.** Wenn die Startphase daneben liegt, faellt das erst nach Wochen auf.
Deshalb: vor dem Reset die Startphase simulieren, nicht erst danach beobachten.

### Konkrete Startphasen-Risiken (aus den Sessions, bisher als Randnotiz gefuehrt)

| Risiko | Gemessen | Folge nach Reset |
|---|---|---|
| **Raid bei schwachem Ausbau** | **100 % Flottenverlust**, 78,7 % Verteidigungsverlust, 10,6 von 12 Wellen gewonnen | Trifft ab Tag 1. Widerspricht der Vorgabe "nie Totalverlust". **Macht Entscheidung 10 blockierend, nicht optional.** |
| **Piratenbasen bei kleiner Flotte** | **89,6 % Verlust**, 32,2 Mio Beute | Inhalt ist im Startspiel unspielbar. **Macht Entscheidung 5 dringend.** |
| **Frischling-Bonus stapelt multiplikativ** | Mining-Forschung 10 (x2) * `mining_schiffe` * Prospektor (1,2) * Abbau-Booster (1,7) * Di/Do-Event (2,0) * Frischling (3,0) = **bis 24,5x**. Ein 7 Tage alter Account: **8,5 Mrd/Tag allein aus Asteroiden** - mehr als eine voll ausgebaute Heimatbasis | War bisher Randbeobachtung (Session 1, Befund 7). Nach dem Reset ist das die erste Spielwoche. **Siehe Entscheidung 12.** |
| **Elite-Bollwerk bei Profil "schwach"** | 53 % Siegchance / 28 % Verlust (grosse Flotte), 46 % / 41,4 % (kleine Flotte) | Der einzige Inhalt, der im Startspiel ueberhaupt Risiko zeigt. Nach Entscheidung 1 neu messen. |
| **Entscheidung 9 (Zeit als Engpass)** | Im Endspiel richtig kalibriert | In Woche 1 mit 1 Bau-Slot und 1 Forschungs-Slot kann sich das Spiel tot anfuehlen. **Muss gegen die STARTPHASE kalibriert werden, nicht gegen das Endspiel.** |
| **Mining-Schiffe amortisieren in unter 3 Stunden** | 300 Schiffe = 6,2 Mio Wert gegen 55,8 Mio/Tag im Niedrig-Feld; alle drei Felder parallel = 346 Mio/Tag bedingungsloses Grundeinkommen | Nach dem Reset die erste und lange Zeit einzige Einnahmequelle. Bewusst so lassen oder bewusst aendern - nicht unbemerkt lassen. |

### Zwingende Ergaenzung zum Messplan

Zusaetzlich zu allen Messungen in diesem Plan ist **eine komplette Fortschritts-Simulation der
ersten 30 Tage** noetig, die es bisher nicht gibt:

- Startbestand -> Woche 1 -> Woche 2 -> Woche 4, jeweils mit realistisch erreichbarem Ausbaustand.
- Pro Woche pruefen: Welche Inhalte sind ueberhaupt spielbar? Wo entsteht Leerlauf? Wo entsteht
  Frust (Totalverlust, unerreichbare Ziele)?
- Die vier Ausbau-Profile der Sessions ("voll"/"voll ohne Boost"/"mittel"/"schwach") reichen dafuer
  NICHT - sie beschreiben Zustaende, keinen Verlauf. **"schwach" ist Forschung 3, keine Module,
  keine Klasse - das ist bereits mehrere Wochen Spielzeit.** Ein echter Startzustand (Forschung 0,
  nichts gebaut) ist in keiner Session gemessen worden.

**Der Reset erfolgt erst, wenn diese Simulation vorliegt.**

**ENTSCHIEDEN 09.08.2026: Die Simulation wird VORGEZOGEN** - gebaut nach Block C, erstmals
ausgefuehrt VOR Block D, erneut ausgefuehrt in Block F. Grund: Entscheidung 9 muss ohnehin gegen die
Startphase kalibriert werden. Steht die Simulation erst am Ende, wird Block D zweimal kalibriert -
einmal gegen das Endspiel und danach dagegen. Der Bauaufwand faellt so oder so an; die Reihenfolge
entscheidet nur, ob er einmal oder zweimal Nutzen bringt. **Nachteil:** der Reset verschiebt sich um
die Bauzeit der Simulation, und sie muss nach Block D ein zweites Mal laufen, weil sich die Zahlen
bis dahin verschieben. Vollstaendige Spezifikation siehe Abschnitt 1b.

---

## 1b. Spezifikation der 30-Tage-Fortschrittssimulation

Dieser Abschnitt existiert, weil die Simulation das einzige fehlende Werkzeug des gesamten Plans
ist und als einziges ohne vorherige Messung vollstaendig festgelegt werden kann. Sie ist damit auch
das einzige Stueck Arbeit, das eine Umsetzungs-Session sofort beginnen kann.

### Was sie NICHT ist

Kein weiteres Kampf-Skript. Die vorhandenen Skripte in `balance/session2-simulation/` messen
**Zustaende** (vier Ausbau-Profile gegen einen Sektor). Diese Simulation misst einen **Verlauf**:
Tag 0 bis Tag 30, mit allem, was sich dabei gegenseitig bedingt - Ressourcen finanzieren Bauten,
Bauten erhoehen Ressourcen, Flotte schaltet Inhalte frei, Inhalte liefern Beute.

### Aufbau

- **Zeitschritt: 1 Stunde**, 720 Schritte. Feiner ist unnoetig (kuerzeste relevante Bauzeit liegt
  bei 30 Minuten), groeber verfehlt die stuendlichen Missions-Checks.
- **Startzustand: `defaultPlayerState()`**, also Forschung 0, nichts gebaut, Startressourcen. Kein
  Profil aus den Sessions - "schwach" ist bereits mehrere Wochen Spielzeit (siehe Abschnitt 1a).
- **Echte Spiel-Funktionen verwenden**, keine nachgebaute Wirtschaft: `runEconomyTick()`,
  `startBuildingConstruction()`, `startResearch()`, `startBuild()`, `runHourlyCheck()`. Sonst misst
  man das Modell statt das Spiel - genau der Fehler, den Messregel 1 fuer den Kampf-Worker
  beschreibt.
- **Drei Spielerprofile** (getrennte Durchlaeufe, NICHT gemittelt):
  1. **Aktiv** - handelt jede simulierte Stunde, baut ressourcen-optimal.
  2. **Gelegenheit** - handelt zweimal taeglich, sonst laeuft nur die Warteschlange.
  3. **Abwesend** - handelt an Tag 1, danach 14 Tage gar nicht, dann wieder taeglich. Bildet die
     reale Nutzungslage ab (mehrwoechige Abwesenheit, siehe Entscheidung 9.2) und ist der
     eigentliche Test der Warteschlange.
- **Die Bot-Logik aus `economyBotTurn.ts` NICHT als Spielermodell verwenden.** Sie baut
  gleichverteilt ueber alle Typen und ist damit nachweislich nicht spielertypisch (Entscheidung
  13.2). Sie darf nur fuer die BOTS im Durchlauf genutzt werden, nicht fuer den simulierten
  Menschen.

### Was pro Tag protokolliert wird

| Kennzahl | Wofuer |
|---|---|
| Einnahmen/Tag in Wert-Einheiten | Verlaufskurve, Vergleich mit der 21,69-Mrd-Baseline |
| Flottenwert und `combatFleetPowerBase()` | Freischaltung von Inhalten, Gegnerskalierung |
| **Leerlaufanteil** - Anteil der Stunden ohne laufenden Bau-, Forschungs- ODER Verteidigungsauftrag | Kernmass fuer Entscheidung 9. Zeitdruck ohne Leerlauf ist Inhalt, Zeitdruck mit Leerlauf ist Frust |
| **Ressourcenstau** - Anteil der Stunden, in denen Ressourcen vorhanden sind, aber kein Slot frei | Gegenprobe zu 9.2: zu wenige Lanes erzeugt genau das |
| Erstmals spielbare Inhalte, mit Tag | Woche-fuer-Woche-Fortschritt |
| Verlustereignisse mit Anteil der verlorenen Flotte | Entscheidung 10 (kein Totalverlust) |
| Anteil jeder Einnahmequelle an der Wochensumme | Entscheidung 12 (Frischling-Ueberschuss) |

### Abnahmekriterien (Definition of Done fuer die Startphase)

Der Reset erfolgt erst, wenn **alle sechs** erfuellt sind. Jedes Kriterium nennt die Entscheidung,
die daran kalibriert wird.

1. **Kein Totalverlust.** In keinem der drei Profile verliert der Spieler in 30 Tagen mehr als
   **70 %** seiner Flotte in einem einzelnen Ereignis. -> Entscheidung 10.
2. **Leerlauf unter 20 %** im Profil "Aktiv" und **0 %** im Profil "Abwesend" (die Warteschlange
   muss die Abwesenheit vollstaendig ueberbruecken). -> Entscheidung 9.2.
3. **Ressourcenstau unter 25 %** im Profil "Aktiv". Ueber diesem Wert sind die Lanes zu knapp und
   der Ueberschuss ist nicht ausgebbar. -> Entscheidung 9.2, Gegenprobe zu Kriterium 2.
4. **Jede Woche wird mindestens ein Inhalt erstmals spielbar.** Erwartete Reihenfolge:
   Woche 1 Asteroiden, Woche 2 Solo-Piraten Niedrig, Woche 3 Raid und Piratenbasis, Woche 4
   Elite-Bollwerk. Ein leerer Wochenabschnitt ist ein Fehlschlag, kein Randbefund.
   -> Entscheidungen 5 und 13.5.
5. **Keine Einzelquelle liefert in Woche 1 mehr als 50 % der Wochen-Einnahmen.**
   -> Entscheidung 12 (heute waeren es die Asteroiden mit dem 24,5-fach gestapelten Bonus).
6. **Die Einnahmenkurve hat kein Plateau ueber 5 Tage.** Ein laengeres Plateau heisst, dass der
   naechste Ausbauschritt unerreichbar weit weg ist. -> Entscheidungen 7 und 9.4.

### Was daran kalibriert wird

- `T_MAX_BASE` und die sieben Reduktionsgewichte aus Entscheidung 9.1b.
- Die Slot-Zahlen aus 9.2 - und zwar gegen Kriterium 2 UND 3 gleichzeitig, weil beide
  gegenlaeufig sind.
- Die additive Form des Frischling-Bonus aus Entscheidung 12.
- Der `SEED_FLEET`-Boden der Piratenbasen aus Entscheidung 5a.
- Die Bot-Wachstumskurve aus Entscheidung 13.1, gegen Kriterium 4.

---

## 2. Die Entscheidungen

Reihenfolge ist verbindlich. Nach jedem Block neu messen, bevor der naechste beginnt.

---

### Entscheidung 1 - Overkill-Deckel bei Aggregat-Stapeln: DECKELN

**Bezug:** Session 4, Befund 5. **Dateien:** `game/combat.ts` (`applyAggregateDamage()` ~Zeile 688,
`applyHitToTarget()` ~Zeile 923, `buildUnits()` ~Zeile 714), `data/combatConstants.ts`
(`STACK_AGGREGATE_THRESHOLD_BY_TYPE`).

**Ziel:** Ein Treffer darf einem Stapel hoechstens den Schaden zufuegen, den er einer EINZELNEN
Einheit dieses Typs zufuegen wuerde (`hpMax + shieldMax`, plus Durchschlags-Anteil). Stapel und
Einzel-Einheiten sehen danach dieselbe Regel.

**Begruendung:** Direkter Verstoss gegen die Nutzervorgabe "nie Totalverlust". Gemessen: 99 Kreuzer
ueberstehen 100 Runden mit 42 % Verlust, **101 Kreuzer sind nach 2,8 Runden restlos vernichtet**.
Ein einziges Schiff kippt den Ausgang. Trifft grosse Flotten ueberproportional und arbeitet damit
gegen das Zielbild.

**Muss zuerst kommen**, weil danach jede Messung mit grossen Flotten anders ausfaellt.

**Messkriterien:**
- `run_aggregate_threshold.mjs` als Regressionstest: die Kurve ueber die Schwelle hinweg muss stetig
  sein, kein Sprung mehr zwischen 99 und 101 Einheiten.
- Danach `run_sectors.mjs`, `run_elite.mjs`, `run_raid.mjs` und `run_real_fleet.mjs` neu laufen
  lassen. Mindestens 40 Laeufe je Zelle (bei 16 war die Kurve noch nicht monoton).

**Bekanntes Risiko:** Saemtliche Messwerte aus Session 2-4, die mit grossen Flotten entstanden sind,
werden dadurch ungueltig. Das ist der aufwendigste Punkt des Pakets. Zusaetzlich werden grosse
Flotten spuerbar zaeher - pruefen, ob Sektoren dadurch zu leicht werden.

---

### Entscheidung 2 - Beute-Kurve: EXPONENT 0,85, NICHT LINEAR

**Bezug:** Session 3, Befund 2. **Dateien:** `game/missions.ts` (`runHourlyCheck()`),
`game/combat.ts` (`fleetSizeRewardMultiplier()` ~Zeile 525), `data/sectors.ts`,
`data/combatConstants.ts` (`FLEET_SIZE_BONUS_CAP`, `FLEET_SIZE_BONUS_RATE`).

**Ziel:** `Beute = Basis * (vernichtete Feindmacht / Referenz)^0,85`, zusammen mit der bereits
beschlossenen Wrack-Bergung von 30 %.

**Begruendung:** Rein linear ergibt rund 17 % Tagesrendite auf den Flottenwert - die Flotte
verdoppelt sich alle fuenf Tage und ueberholt binnen Wochen jede andere Zahl im Spiel. Mit 0,85
waechst der Netto-Ertrag dauerhaft weiter (6,18 Mrd Flotte -> +0,99 Mrd/Tag; 34,99 -> +4,38;
66,33 -> +8,2), in einem ueber Jahre spielbaren Tempo.

**Kalibrierung:** Der Faktor von rund **0,091 Wert-Einheiten je Punkt vernichteter Feindmacht**
(damit die Referenzflotte ihre heutige Belohnung behaelt) ist HOCHGERECHNET, nicht gemessen.
**Vor dem Festschreiben direkt messen.** Die reale Flotte vernichtet pro 24h-Mission 83,62 Mrd
Feindmacht, die Referenzflotte geschaetzt 12,2 Mrd.

**Zusaetzlich zwingend:** `fleetSizeRewardMultiplier()` wird dadurch fachlich ersetzt. Sie wird
heute berechnet und auf `teileCap`/`lootBase` angewendet - **beide Felder existieren bei
`piraten_niedrig/mittel/hoch` seit dem Umbau 29.07.2026 nicht mehr**. Entweder entfernen oder auf
`winContainer`/`winResources` umhaengen. Der jetzige Zustand (Rechnung ohne Wirkung) darf nicht
bleiben.

**Messkriterien:**
- Netto-Ertrag ueber mindestens 5 Flottengroessen von 6 bis 200 Mrd Wert.
- **Den Kipppunkt suchen**, ab dem die Verluste die Beute wieder ueberholen. Liegt er unter
  500 Mrd Flottenwert, Exponent auf 0,90-0,95 anheben.
- Ertraege NIE an einem Einzelcheck bewerten - komplette 24h-Mission mit mitgeschleppten Verlusten
  rechnen (`run_mission_breakeven.mjs`, `run_elite_series_net.mjs`, `run_real_fleet.mjs`).

**Achtung:** `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr) verdoppelt bereits `combatWins` und damit die
Container-Anzahl (`missions.ts:558`). Jede neue Skalierung multipliziert sich darauf.

---

### Entscheidung 3 - Raid-Ertrag: HALBIEREN

**Bezug:** Session 2, Befund 4 / Session 3, Befund 1 (b). **Dateien:** `data/economy.ts`
(`RAID_WAVE_WIN_SILBER/GOLD/ELITE`).

**Ziel:** 10/6/2 -> **5/3/1**. Damit liegt die Wochensumme wieder auf dem Stand vor der
Frequenzverdopplung.

**Begruendung:** Die Verdopplung von 1x auf 2x/Woche wurde als reiner Kalendereintrag umgesetzt,
ohne die Belohnung pro Raid gegenzurechnen - die Kommentare an den Konstanten begruenden 10/6/2
noch mit "nur 1x/Woche pruefbar". Der Raid liefert heute **6,31 Mrd/Tag (29 % der Gesamteinnahmen)
und 595 DM/Tag (der groesste DM-Posten des Spiels) ohne Flottenbindung, ohne Flugzeit, ohne
Entscheidung**. Die hoehere Frequenz soll mehr Ereignisse bringen, nicht mehr Ertrag.

**Muss zusammen mit Entscheidung 2 gemessen werden**, sonst verschiebt die neue Beute-Skalierung
die Einnahmen weiter nach oben, bevor eine Senke greift.

**Zusaetzlich pruefen (eigene Bewertung, nicht zwingend):** `resolveOneWave()` rechnet
`combinedPower` pro Welle NEU aus der bereits dezimierten Flotte. Wer Schiffe verliert, bekommt
automatisch schwaechere Folgewellen - der Raid korrigiert sich selbst nach unten und kann kaum
scheitern (gemessen: 100 % Flottenverlust, trotzdem 10,6 von 12 Wellen gewonnen). Ein Schnappschuss
der ersten Welle (analog `raid.initialCombinedPower`) wuerde Raids ueberhaupt erst verlierbar
machen. **Vorsicht:** kollidiert mit der Nutzervorgabe "nie Totalverlust" - siehe Entscheidung 10.

**Bekannter Nachteil - PRAEZISIERT 09.08.2026:** ~~Die einzige Aenderung des Pakets, die sich beim
Spielen wie ein Rueckschritt anfuehlt.~~ Das GEFUEHL der Wegnahme entfaellt durch den Server-Reset
(Abschnitt 1a) - nach dem Reset hat nie jemand 10/6/2 gehabt. **Der rechnerische Effekt bleibt
bestehen:** der Raid liefert weniger, gemessen an der neuen Baseline nach Block A, und bleibt damit
eine echte Senkung - nur keine spuerbare Enteignung.

---

### Entscheidung 4 - Piratenadmiral (P10): VARIANTE B, EIN DURCHLAUF PRO TAG

**Bezug:** Session 2, Befund 2 + 7 / Session 4, Befund 4 + 5 + Nachtrag. **Dateien:**
`game/groupOps.ts` (`runAdminCheck()` ~Zeile 527, `finalizeAdminEncounter()`, `createGroupOperation()`),
`data/combatConstants.ts` (`ADMIRAL_*`), `game/combat.ts` (`ADMIRAL_STAT_SHARE`).

Umsetzung in dieser Reihenfolge:

**4.1 Verlust-Kriterium reparieren (blockiert alles Weitere).**
`runAdminCheck()` nutzt `result.retreated` als Niederlage-Kriterium. Das Flag hat seit der
Umstellung auf den gestaffelten Einzelschiff-Rueckzug (Juli 2026) eine andere Bedeutung: es wird
gesetzt, sobald **ein einziges** Schiff unter `UNIT_RETREAT_THRESHOLD = 0,3` faellt. Gemessen ist es
in **77-100 % aller Kaempfe** gesetzt, auch in gewonnenen. Der im Code referenzierte
`RETREAT_THRESHOLD` existiert nicht mehr.
Folge: In 120 kompletten Testbegegnungen wurde **Check 2 kein einziges Mal erreicht**. Damit sind
tot: `ADMIRAL_ESCALATION_PER_CHECK`, `ADMIRAL_TOTAL_CHECKS = 6`, `ADMIRAL_CHECK_INTERVAL_MS`, die
komplette Extraktions-Entscheidung (`respondAdminEncounter()`, `adminAwaitingDecision`),
`ADMIRAL_EXTRACTION_GROWTH_PER_CHECK`.
-> Ersetzen durch den Anteil tatsaechlich verlorener Einheiten aus `result.survivorsByOwner` gegen
die entsandte Stueckzahl. Neue Konstante **`ADMIRAL_DEFEAT_LOSS_SHARE = 0.45`**.
-> `simulateCombat()` macht es bereits richtig (Zeile 123-128: nur zaehlen, wenn kein voller Sieg
vorliegt) - als Vorlage nutzen.

**4.2 `contributedPower`-Freeze GLEICHZEITIG reparieren.**
`runAdminCheck()` (~Zeile 442) summiert `p.contributedPower`, das nur einmal beim Start gesetzt wird
(~Zeile 285), waehrend die Ueberlebenden pro Check zurueckgeschrieben werden (~Zeile 522). Ab
Check 2 skaliert der Gegner also gegen die START-Flotte. **Heute folgenlos, weil Check 2 nie
erreicht wird - 4.1 schaltet diesen Fehler scharf.** Vorlage: der Elite-Bollwerk-Pfad macht es
richtig (`combatFleetPowerBase(p.ships)` frisch pro Check, ~Zeile 745).

**4.3 Boss-Anteil senken.** `ADMIRAL_STAT_SHARE` von 0,55 auf **0,30**.
Gemessen bei realer Flotte: Anteil 0,55 -> 60 % Siegchance, 8,89 Mrd Verlust. Anteil 0,25 -> 100 %
Siegchance, 3,05 Mrd Verlust. Faktor 2,9 im Verlust.

**4.4 Boss-Mechanik statt Boss-Zahl.**
`RAPIDFIRE.piratenadmiral = { leicht: 10, schwer: 8 }` - **beide Typen stehen nicht in
`ADMIRAL_ALLOWED_SHIP_IDS` und koennen den Sektor gar nicht betreten.** Die Anti-Massen-Faehigkeit
des Bosses hat null erreichbare Ziele.
-> Umstellen auf `{ kreuzer: 5, schlachtschiff: 5, bomber: 5, schlachtkreuzer: 4, zerstoerer: 4,
reaper: 3 }` und `piratenadmiral` in `MULTI_TARGET_VOLLEY_SHIPS` aufnehmen.
-> **Danach zwingend gegenmessen**: Mehrfachziel-Salve zusammen mit Entscheidung 1 kann sehr stark
ausfallen.

**4.5 Belohnung proportional statt fest.**
`ADMIRAL_EXTRACTION_BASE` und `ADMIRAL_EXTRACTION_GROWTH_PER_CHECK` entfallen, ersetzt durch
**`ADMIRAL_LOOT_PER_DESTROYED_POWER = K = 0,5`**. Die je Check vernichtete Feindmacht wird auf der
`GroupOperation` mitgefuehrt und bei Extraktion/Sieg ausgezahlt.
Die Eskalation braucht dadurch keinen eigenen Belohnungs-Aufschlag: jeder weitere Check bringt
automatisch mehr vernichtete Macht (Gegner waechst mit 1,15^n) und riskiert zugleich die noch
ungesicherte Beute.

**4.6 Sieg-Bonus:** `ADMIRAL_VICTORY_BONUS` (fester Betrag) -> **Faktor 1,5** auf die angesammelte
Beute. `ADMIRAL_VICTORY_DM` bleibt bei **200**.

**4.7 Niederlage entschaerfen:** Heute verfaellt bei `defeat` die Beute ALLER bereits ueberstandenen
Checks - zusammen mit durchschnittlich 62 % Flottenverlust eine doppelte Bestrafung.
-> Bei Niederlage **50 %** der angesammelten Beute auszahlen statt 0. Die Extraktions-Entscheidung
bleibt sinnvoll, weil Weitermachen die Haelfte riskiert.

**4.8 Cooldown einbauen (Neubau, existiert heute nicht).**
`createGroupOperation()` prueft nur Sektor, Schiffstypen und Bestand. Anflug plus 6 Checks ergeben
rund 2 Stunden, also bis zu **12 Durchlaeufe/Tag**. Bei K = 0,5 waeren das +95,5 Mrd/Tag - das
**4,4-fache der gesamten Baseline** - und 2.400 DM/Tag gegen 1.088 aus dem ganzen uebrigen Spiel.
-> Ein Durchlauf je Teilnehmer und Tag. Damit liegt P10 bei rund +8 Mrd je Durchlauf, zwischen einem
Raid-Tag (6,31) und einer Elite-Serie (32,60) - passend zu 2 h gebundener Flotte gegen 24 h.

**Ausserdem (kein eigener Entscheidungsbedarf):**
- `ADMIRAL_ESCORT_BASE` ist toter Code (nirgends importiert). Der Kommentar beschreibt eine feste
  Eskorte, tatsaechlich ist sie ueber `generateCappedFleet()` voll machtskaliert. Entfernen oder
  Kommentar korrigieren.
- Der Boss selbst skaliert nicht mit Forschung (`sideBStatsOverride` umgeht `getEffectiveStats()`),
  seine Eskorte schon. Mit steigender Forschung wird der Boss relativ immer weicher. Bewusst
  entscheiden, nicht stillschweigend lassen.
- **Kein Rueckflug:** `finalizeAdminEncounter()` schreibt Ueberlebende direkt in `pState.fleet`
  (~Zeile 641-645), es gibt kein `returnTime` wie bei `finalizeGroupExpedition()`. Hinflug dauert
  3,8 h, Rueckflug null. Nachziehen.
- `rollBattleModifier()` wird in `runAdminCheck()` gar nicht aufgerufen, `BATTLE_MODIFIER_CHANCE`
  hat keinen `piraten_admiral`-Eintrag. Bewusst entscheiden.

**Messkriterien:**
- `run_admiral_rebalance.mjs` ueber **alle vier Ausbau-Profile**, nicht nur `voll` - die
  45-%-Schwelle ist gegen `voll` kalibriert und kann bei `mittel`/`schwach` zu frueh greifen.
- **Zielwert erreichte Check-Tiefe: 3-5**, nicht 1 (heute: 1,0 in allen Szenarien).
- `run_aggregate_threshold.mjs` gegen den Boss MIT Mehrfachziel-Salve.

---

### Entscheidung 5 - Piratenbasen: GARNISON SKALIERT MIT

**Bezug:** Session 4, Befund 6. **Dateien:** `game/pirateBaseState.ts` (`SEED_FLEET`, `SEED_DEFENSE`,
`RESOURCE_CAP`, `PIRATE_BASE_LOOT_PERCENT`), `data/economy.ts`
(`NPC_PRODUCTION_BONUS_MULTIPLIER`).

**Ziel:**
- Garnison an die angreifende Flotte koppeln (Muster: `PIRATEN_MULTIPLIER_ROLL`, alternativ das
  fuer genau diesen Zweck kalibrierte `OUTPOST_MULTIPLIER_ROLL` aus dem entfernten
  Aussenposten-System - **vor Entscheidung 11 sichern**). `SEED_FLEET` bleibt Untergrenze.
- **Zielniveau: zwischen Solo-Sektor Hoch und Elite-Bollwerk.**
- Beute an die tatsaechlich vernichtete Garnison koppeln statt an einen festen Prozentsatz des
  Lagers - dieselbe Mechanik wie Entscheidung 2, gemeinsam umsetzen.
- `RESOURCE_CAP` neu rechnen: der Kommentar rechnet mit `NPC_PRODUCTION_BONUS_MULTIPLIER = 1.5` und
  zielt auf 3 Wochen Wachstum, der Multiplikator steht inzwischen auf **6**. Real ist der Deckel in
  **6,5 Tagen** erreicht, nicht in 21.

**Begruendung:** Heute fuer kleine Flotten unspielbar (89,6 % Verlust) und fuer entwickelte Flotten
bedeutungslos (0 % Verlust, 32,2 Mio Beute = 0,15 % eines Tageseinkommens; alle vier Basen zusammen
56,3 Mio/Tag = 0,3 % der Baseline).

**ZWINGEND mitliefern - sonst entsteht ein neuer Fehler:** Wenn die Beute an der vernichteten
Garnison haengt statt am Lagerbestand, entfaellt die natuerliche Bremse. Die Basis wird zur beliebig
oft ausbeutbaren Quelle, sobald die Garnison nachwaechst. Es braucht eine zusaetzliche Schranke:
**Angriffe pro Basis und Tag begrenzen ODER eine echte Erholungszeit der Garnison.** Ohne das
tauscht man ein totes Feature gegen die neue beste Farmroute des Spiels.

**NACHTRAG 09.08.2026 (Code-Pruefung) - zwei Ergaenzungen, ohne die diese Entscheidung ihr Ziel
verfehlt:**

**5a. Der `SEED_FLEET`-Boden muss mitfallen, sonst loest Entscheidung 5 die Startphase NICHT.**
`SEED_FLEET` sind **5.300 Schiffe** (2.000 leicht / 1.500 schwer / 800 kreuzer / 400 schlachtschiff /
300 bomber / 150 schlachtkreuzer / 100 zerstoerer / 50 reaper) plus 1.120 Verteidigungsanlagen,
festgeschrieben als dauerhafte Untergrenze (Floor-Up in `loadPirateBase()`, "unzerstoerbare
Basis"-Design). Der urspruengliche Text dieser Entscheidung laesst die Garnison mitskalieren, behaelt
den Boden aber ausdruecklich bei. **Nach dem Reset ist genau dieser Boden das Problem:** ein Spieler
in Woche 1 hat Dutzende Schiffe, nicht Tausende. Die gemessenen **89,6 % Verlust bei kleiner Flotte**
blieben damit unveraendert bestehen, obwohl die Skalierung eingebaut waere - der Boden greift ja
zuerst. Der Boden muss entweder mit der angreifenden Flotte mitskalieren oder ganz entfallen.
Nachteil: eine frisch angegriffene Basis kann dann kurzzeitig sehr schwach dastehen; das
"unzerstoerbare Basis"-Design braucht dafuer eine Erholungszeit statt einer festen Untergrenze -
dieselbe Schranke, die oben ohnehin gegen Dauer-Farming gefordert ist.

**5b. Vor JEDER Messung an den Basen muss Entscheidung 13.3 stehen.** `loadPirateBase()` fuehrt bei
jedem Laden einen kompletten Bau-Entscheidungsschritt aus, und die Basen werden bei jedem Aufruf der
Galaxie-Ansicht geladen. Die Wachstumsrate einer Basis haengt damit an der Anzahl der Client-Aufrufe
und ist nicht reproduzierbar. Solange das so ist, misst man an den Basen Rauschen. Siehe
Entscheidung 13.3.

---

### Entscheidung 6 - Schiffs-Tiers: WERT JE MACHTPUNKT ANGLEICHEN

**Bezug:** Session 4, Befund 7 / Session 3, Befund 3. **Dateien:** `data/ships.ts`.

**Ziel:** Zielkorridor **1,1-1,3 Wert je Machtpunkt ueber alle Tiers**. Reine Kostenaenderung an
vier Schiffen, keine Mechanik anfassen.
Heute: Leichter Jaeger 1,11 / Schwerer Jaeger 1,18 / Schlachtschiff 1,10 gegen **Schlachtkreuzer
1,89 / Bomber 1,73 / Zerstoerer 1,60 / Reaper 1,59** - die hohen Tiers kosten 45-70 % mehr pro
Machtpunkt.

**Begruendung:** Bei gleichem Ressourceneinsatz schlaegt Tier 1 die Tiers 5-7 deutlich (Leichter
Jaeger gegen Reaper: +425 Mio Restwert). Der obere Teil des Schiffsbaums ist damit eine Falle fuer
jeden, der ihn erforscht.

**RapidFire NICHT anheben** - das wuerde die gesamte Sektor-Balance aus Session 2 mitverschieben.

**Realistische Erwartung:** In allen Inhalten mit machtskalierter Gegnerflotte (Solo-Sektoren,
Elite-Bollwerk, Raid, Admiral) hebt sich der Effekt weitgehend auf - billigere Schiffe erzeugen
staerkere Gegner. Voll wirksam nur bei Gegnern mit FESTER Staerke, also aktuell nur bei den
Piratenbasen (Entscheidung 5). Billig umzusetzen, liefert aber weniger als die Zahlen vermuten
lassen.

**Messkriterien: JEDE Kostenaenderung an ZWEI Messungen pruefen** - sie koennen gegenlaeufig
ausschlagen:
1. Duell bei gleichem Wert (`run_ships.mjs`)
2. Machtskalierter Sektor (`run_ship_value.mjs`)

**Zusaetzlich:** Der README-Zielkorridor "ca. 65 Kosten je Waffenpunkt, Schiffe bei ~57-90" ist
ueberholt (real 68-133 bei Schiffen, 397-623 bei Spezialschiffen, 557 beim Sandronator). Beim
Umsetzen dieser Entscheidung die Zahlenbasis in der README nachziehen.

**Nebenbefund zur Dokumentation:** Die RapidFire-"Kette" ist linear, nicht zyklisch. `leicht: {}`
hat gar kein Ziel, Bomber und Reaper werden von KEINEM Standard-Kampfschiff gekontert. Der
README-Satz zum Schlachtkreuzer gegen Jaeger ist falsch (er hat kein RapidFire gegen Jaeger und
verliert mit -553 bis -556 Mio). README korrigieren.

**Salvenschiffe (keine Aenderung noetig, nur dokumentieren):** Sie brechen als reine Einzeltyp-
Flotte zusammen (`MULTI_TARGET_POWER_CORRECTION = 8` erzeugt einen achtfach staerkeren Gegner), sind
aber als Beimischung in eine gemischte Flotte die beste Ergaenzung ueberhaupt. Reine Rollen-
Einheiten - **das steht nirgends im Spiel.** Ins Info-Popup aufnehmen.

---

### Entscheidung 7 - Allianz-Station: RELATION GLATTZIEHEN, KOSTENKURVE ANGLEICHEN

**Bezug:** Session 4, Befund 1 + 2 + 3 / Session 1, Befund 2 / Session 3, Befund 9. **Dateien:**
`data/stationBuildings.ts`, `game/stations.ts` (`checkTierUnlock()`,
`stationBauzeitFactorForTier()`), `data/buildings.ts`.

**7.1 Stufen-Relation:** V2 = **2x Kosten / 2x Ertrag**, V3 = **4x Kosten / 4x Ertrag**
(heute: 2x/1,5x und 4x/2,5x). Grund: Heute wird jede Ausbaustufe unwirtschaftlicher als die
vorherige (210 -> 285 -> 339 Tage Amortisation), obwohl sie als Fortschritt praesentiert wird.
Dieselben Multiplikatoren gelten auch fuer die Heimatbasis - dort federt der fehlende Level-Cap das
ab, an der Station mit Cap 30 fehlt dieser Vergleichspunkt.

**7.2 Freischalt-Zwang bleibt, dafuer Kostenkurve angleichen.** `checkTierUnlock()` verlangt alle
drei Minen auf dem Cap. Alle drei liefern bei Level 30 exakt denselben Wert-Ertrag (5,2 Mio/h),
kosten aber das **1-, 3,8- und 6,9-fache**. Der Zwang schickt den Spieler gezielt in die beiden
teuersten.
-> `costGrowth` (1.6 gegen 1.55) und `baseCost` von Kristallmine und Deuterium-Synthetisierer an den
Wert-Ertrag angleichen. **Das behebt denselben Fehler an der Heimatbasis mit** (Session-1-Befund 2:
"Metallmine ausbauen und tauschen" ist um Faktor 2,8 bzw. 5,0 effizienter als der direkte Ausbau -
damit der Deuterium-Ausbau gleichwertig waere, muesste die Handelsgebuehr bei 84 % liegen).
-> `TRADE_FEE` NICHT anheben. Ursache reparieren, nicht Symptom.

**7.3 Stations-Module:** `requiredBuildingLevel` von 20 auf **10** senken (Cap-Verhaeltnis 30 statt
100 bei der Heimatbasis), Modulkosten gegen die Gebaeudekosten anheben. Heute amortisieren die
Module in **17,9 Tagen** gegen 297 Tage fuer die Gebaeude selbst - Faktor 17 zwischen zwei Wegen
desselben Gebaeudes, und der bessere Weg wird erst nach zwei Dritteln der Strecke sichtbar.

**7.4 Stations-Fabriken:** Roboter 15 + Nanit 10 kosten zusammen rund 1 Mrd und druecken den
Bauzeit-Faktor auf 1,3e-5. Es gibt keine Voraussetzungspruefung fuer die Nanitenfabrik. Bauzeit ist
an der Station damit entweder absoluter Blocker (vorher) oder bedeutungslos (danach).
-> Fabrik-Stufen an eine Voraussetzung binden (analog `PARENT_UNLOCK_LEVEL`) oder Effekt pro Stufe
deutlich senken. **Gehoert zu Entscheidung 9, gemeinsam kalibrieren.**

**7.5 ENTFAELLT HIER - verschoben nach Entscheidung 14.** Der Punkt stand faelschlich unter der
Allianz-Station. Code-Pruefung 09.08.2026: **Die Allianz-Station ist NICHT betroffen** -
`data/stationBuildingModules.ts` erzeugt ihre Module per Generator ueber `STATION_BUILDINGS`, und
dort stehen alle drei Stufen drin. Die Luecke betrifft ausschliesslich die **Heimatbasis**
(`data/buildingModules.ts`, handgetippt, nur V1-IDs). Vollstaendig behandelt in Entscheidung 14.

**Bekannter Nachteil:** ~~Die Aenderung an `buildings.ts` wirkt rueckwirkend - bereits bezahlte
Minenstufen waeren danach guenstiger gewesen.~~ **Entfaellt durch den Server-Reset (Abschnitt 1a).**
Selbst mit sauberer Relation bleibt die Station
eine schwache Investition gegenueber Verteidigungsanlagen (unter einer Woche Amortisation). Sie wird
korrekt, nicht attraktiv. **Das ist akzeptiert:** ihre eigentliche Funktion sind die 558 Mrd
Ressourcen-Senke (35 % aller uebrigen einmaligen Senken zusammen).

---

### Entscheidung 8 - Sandronator: REINES WIRTSCHAFTSSCHIFF, SPEED HOCH

**Bezug:** Session 4, Befund 8. **Dateien:** `data/ships.ts`.

**Ziel:** Kampfwerte bleiben, das Schiff wird offen als Mining-Einheit deklariert (Info-Popup,
Ausschluss aus Kampfflotten-Vorlagen). **`speed` von 2.000 auf mindestens 9.000** (Bomber-Niveau).

**Begruendung:** Der Speed ist der eigentliche Schaden. `galaxyFleetSpeed()` richtet sich nach dem
langsamsten Schiff der Flotte - **ein einziger mitgenommener Sandronator vervierfacht bis
versechsfacht die Flugzeit der GESAMTEN Flotte** zu Galaxie-Zielen, Piratenbasen und Sektoren. Die
Kampfwerte (0 % Siegquote bei gleichem Wert gegen Leichte Jaeger, Kreuzer UND Reaper; 557 Kosten je
Waffenpunkt gegen 68-133 bei Standard-Schiffen) sind bei einem einzelnen Exemplar in einer
31.000-Schiffe-Flotte ohnehin Rauschen.

---

### Entscheidung 9 - ZEIT ALS ECHTER ENGPASS (Nutzerwunsch, neu)

**Nutzervorgabe:** Bauzeiten jeder Art, Forschungszeit und Kosten anpassen. Forschung von 4
gleichzeitigen Slots auf **1 mit Warteschlange**, alle Baumoeglichkeiten ebenfalls auf **1 mit
Warteschlange**. Beobachtung des Nutzers: Forschung, Gebaeudebau, Schiffsbau und Module gehen zu
schnell. **Die Beobachtung ist durch die Messungen bestaetigt.**

**Dateien:** `game/actions.ts` (`roboterNaniteFactor()` ~Zeile 55, `bauzeitMultiplier()`,
`defenseBauzeitMultiplier()`, `researchTimeMultiplier()` ~Zeile 161, `researchCostForLevel()`/
`researchTimeForLevel()` ~Zeile 771-782), `data/research.ts` (`costGrowth` 1.8, `timeGrowth` 1.6),
`data/combatConstants.ts` (`MAX_BUILDING_SLOTS`, Bau-Lanes), **`client/src/lib/multipliers.ts`
(Spiegel, MUSS synchron geaendert werden - README Punkt 1)**.

#### Ausgangslage (gemessen)

| Bereich | Heutiger Zustand |
|---|---|
| Gebaeude-Bauzeit | Faktor **8,06e-8** (mit Automatisierungs-Modul 5,64e-8). Metallmine Stufe 36: 18.224 h -> **14 Minuten** |
| Schiffs-Bauzeit | Faktor 6,68e-2, Ausstoss **26-43 Mrd Wert/Tag** bei 3 Lanes gegen 21,69 Mrd Tageseinnahmen |
| Forschungszeit | 2.315 Tage seriell roh, 810 Tage mit Dauer-Booster, **203 Tage bei 4 Slots** |
| Forschungskosten | Alle 21 Forschungen Stufe 10: **2,04 Mrd = zwei Stunden Einnahmen** |
| Forschungs-Wirkung | Saettigt bei **Stufe 8**; die Stufen 9+10 kosten **61,5 % der Gesamtzeit** und liefern messbar nichts |

#### Umsetzung in DIESER Reihenfolge (Bedingungen, nicht optional)

**9.1 ENTSCHIEDEN 09.08.2026: SAETTIGUNGSKURVE STATT UNTERGRENZE.**
Der urspruengliche Vorschlag (`Math.max(0.02...0.05, ...)` in `roboterNaniteFactor()`) ist
**verworfen.** Begruendung und Ersatz siehe unten. Der Zielwert **1-5 Tage je hoher Ausbaustufe**
bleibt unveraendert.

**Warum die Untergrenze nicht funktioniert (nachgerechnet):**
Metallmine Stufe 36 dauert roh **759 Tage**. Mit Untergrenze 0,05 sind das 38 Tage - genau der Wert,
den diese Entscheidung selbst als zu lang ausschliesst. Mit 0,02 noch 15 Tage. Fuer den Zielkorridor
1-5 Tage braeuchte es rund 0,005 - dann dauert Stufe 45 rund 76 Tage und Stufe 50 ueber ein Jahr.
Gebaeudestufen haben **kein Limit** (README Punkt 8), die Rohzeit waechst mit `timeGrowth` 1,35 je
Stufe unbegrenzt weiter. Eine feste Untergrenze deckelt die Bremse, nicht das Wachstum: sie
verschiebt die Mauer nur nach hinten, sie entfernt sie nicht. Das laeuft direkt gegen die
Nutzervorgabe "dauerhaft, kein Endpunkt".

**Zweiter Befund, der die Untergrenze zusaetzlich entwertet:** Die Bauzeit wird heute von **sechs
unabhaengigen Reduktionsquellen MULTIPLIKATIV** gesenkt - Bauzeit-Forschung (bis 0,3),
kategorie-spezifische Forschung (bis 0,5), gebaeudeeigenes Bauzeit-Modul (bis 0,5), Roboterfabrik
(0,75 je Stufe), Nanitenfabrik (0,50 je Stufe) und Bautempo-Booster/Samstags-Event. Jede fuer sich
ist vertretbar; multipliziert ergeben sie bei vollem Ausbau rund **0,002**. Selbst mit korrigiertem
`timeGrowth` landet ein voll ausgebauter Spieler damit wieder bei knapp **24 Minuten** fuer eine
Stufe-36-Mine. **Das ist derselbe Fehler wie beim Frischling-Bonus (Entscheidung 12): viele einzeln
harmlose Boni, die multiplikativ gestapelt werden.**

**Die Entscheidung besteht aus drei Teilen:**

**9.1a Saettigungskurve fuer Gebaeude-Bauzeiten.**
```
effektiveZeit = rohZeit / (1 + rohZeit / T_cap)
```
Die Kurve verhaelt sich bei kleinen Rohzeiten praktisch wie heute (Stufe 1 bleibt 30 Minuten,
Stufe 5 rund 2 Stunden) und naehert sich bei grossen Rohzeiten asymptotisch `T_cap` an - **ohne
diesen Wert je zu ueberschreiten, auf Stufe 36 wie auf Stufe 60.** Es gibt damit weder einen
Kollaps auf Minuten noch eine Mauer.

**9.1b Alle Reduktionsquellen wirken ADDITIV auf `T_cap`, nicht multiplikativ auf die Zeit.**
```
T_cap = T_MAX_BASE / (1 + Summe aller Reduktionen)
```
Vorschlag fuer die Gewichte (Groessenordnung, exakte Werte sind zu messen):

| Quelle | Beitrag zur Summe bei Vollausbau |
|---|---|
| `T_MAX_BASE` | **14 Tage** (Ausgangswert ohne jede Reduktion) |
| Roboterfabrik | 0,15 je Stufe -> 2,25 bei Stufe 15 |
| Nanitenfabrik | 0,30 je Stufe -> 3,00 bei Stufe 10 |
| Bauzeit-Forschung (allgemein) | 1,00 |
| Bauzeit-Forschung Gebaeude | 0,50 |
| Gebaeudeeigenes Bauzeit-Modul | 0,50 |
| Bautempo-Booster / Samstags-Event / Ingenieur | zusammen ~1,00 |

Ergebnis dieser Kalibrierung, nachgerechnet:

| Ausbaustand | Stufe 10 | Stufe 20 | Stufe 36 | Stufe 50 |
|---|---|---|---|---|
| **nichts gebaut** (T_cap 14 d) | 9,8 h | 5,3 Tage | 13,8 Tage | ~14 Tage |
| **voll ausgebaut** (T_cap 1,5 d) | 7,9 h | 1,3 Tage | 1,5 Tage | ~1,5 Tage |

Damit ist alles auf einmal erfuellt: Zielkorridor 1-5 Tage getroffen, keine Mauer bei hohen Stufen,
Startphase praktisch unveraendert (Stufe 1-10 liegen mit und ohne Ausbau dicht beieinander), und
**jede einzelne Reduktionsquelle bleibt spuerbar, ohne dass irgendeine die Zeit auf null druecken
kann.** Der volle Ausbau aller Zeit-Hebel bringt beim gleichen Gebaeude Faktor 9 - ein echtes,
lohnendes Ausbauziel statt einer Zahl nahe null.

**9.1c Basis-Bauzeiten NICHT anheben.** Bei Roboter/Nanit Stufe 0 ist der Reduktionsfaktor exakt 1 -
in Woche 1 gelten also schon heute die vollen Rohzeiten. Eine Anhebung der `baseTimeSeconds` traefe
ausschliesslich die Startphase, also genau die Phase, die dieser Plan schuetzen will (Abschnitt 1a).

**Anwendungsbereich - nach Art der Kurve unterscheiden, NICHT pauschal:**
- **Gebaeude (unbegrenzte Stufenleiter, `timeGrowth` 1,35-1,5):** Saettigungskurve nach 9.1a/9.1b.
  Betrifft auch die Allianz-Station (Entscheidung 7.4) und die Gebaeude-Module.
- **Forschung (bei Stufe 10 gedeckelt, `MAX_RESEARCH_LEVEL`):** hier ist eine Untergrenze
  ausreichend, weil die Leiter endlich ist. Der eigentliche Hebel bleibt 9.3/9.4.
- **Schiffe/Verteidigung:** die Bauzeit ist **linear in der Stueckzahl**
  (`ship.buildTime * bauzeitMultiplier * qty`), es gibt gar keine Stufenleiter. Hier ist eine
  Untergrenze auf den Multiplikator unproblematisch; der eigentliche Hebel ist die
  Lane-Reduktion in 9.2.

**Bekannte Nachteile - ausdruecklich genannt:**
1. **Ein neuer Formeltyp ersetzt eine reine Multiplikation.** `client/src/lib/multipliers.ts` muss
   ihn 1:1 spiegeln (README Punkt 1). Genau dieser Spiegel ist schon einmal auseinandergelaufen -
   siehe R1. Ohne Spiegel zeigt die UI falsche Bauzeiten.
2. **Die Nanitenfabrik verliert ihren Ausnahmestatus** (0,50 je Stufe multiplikativ -> 0,30 additiv).
   Sie bleibt der staerkste Einzel-Hebel, ist aber nicht mehr fuer sich allein spielentscheidend.
   Durch den Server-Reset ohne Rueckwirkung.
3. **In Woche 1 wird der Zeit-Engpass NICHT spuerbar.** Das ist beabsichtigt (Abschnitt 1a), heisst
   aber: der Nutzerwunsch "Bauen geht zu schnell" wird in der Startphase bewusst nicht erfuellt. Der
   Engpass setzt ab etwa Stufe 15-20 ein.
4. **Die Zahlen oben sind gerechnet, nicht gemessen.** `T_MAX_BASE` und die sieben Gewichte sind
   gegen die Zielspanne kalibriert, nicht simuliert. Vor dem Festschreiben gegen die
   30-Tage-Simulation (Abschnitt 1a) und einen Endspiel-Ausbaustand pruefen.

**9.2 Danach die Slots reduzieren - NICHT gleichzeitig.** Slot-Reduktion und Zeiterhoehung sind eine
Doppelbremse. 4 Forschungsslots auf 1 vervierfacht die Gesamtdauer allein durch die Slot-Aenderung
(203 -> ueber 800 Tage). Zwischen beiden Schritten messen, sonst schiesst man weit ueber das Ziel
hinaus.
-> Forschung: 4 Slots -> **1 Slot + Warteschlange**.
-> Schiffe/Verteidigung: 3 Bau-Lanes -> **1 Lane + Warteschlange**. `BuildQueue.tsx` ist bereits
Lane-basiert, die Warteschlange existiert im Ansatz.
-> Gebaeude: `MAX_BUILDING_SLOTS` steht bereits auf 1, hier nur die Warteschlange sicherstellen.
-> **Die Warteschlange ist zwingend, nicht optional.** Der Nutzer ist teils mehrere Wochen
abwesend. Ohne Warteschlange bestraft 1 Slot genau diese Abwesenheit.
-> Der Nachteil "fuehlt sich wie eine Wegnahme an" entfaellt durch den Server-Reset (Abschnitt 1a) -
nach dem Reset hat niemand jemals 4 Slots gehabt.
-> **Neuer Nachteil durch den Reset:** Die Kalibrierung muss gegen die STARTPHASE erfolgen. 1
Bau-Slot und 1 Forschungs-Slot in Woche 1 koennen sich tot anfuehlen. Siehe Block F der Reihenfolge.

**9.3 Forschungs-Wirkungskurve MIT anpassen.** Ohne diesen Schritt wartet der Spieler bei 1 Slot
Jahre auf Stufen, die messbar nichts tun. Langsamer ist gewollt - leer warten nicht.
Drei Wege, einer davon waehlen:
- `timeGrowth` von **1,6 auf ca. 1,4** senken (halbiert die Endstufen-Zeit), ODER
- die Effektkurve nach oben strecken, damit 9/10 ueberhaupt etwas liefern, ODER
- die Endstufen streichen.
**Zielwert:** kompletter Forschungsbaum bei 1 Slot + Dauer-Booster in der Groessenordnung
**12-18 Monate**, die 9 Kampfforschungen in **4-6 Monaten**. Messen, nicht schaetzen.

**9.4 Forschungskosten anheben (freier Hebel).** Alle 21 Forschungen kosten heute zusammen 2,04 Mrd
= zwei Stunden Einnahmen; die teuerste Einzelstufe im ganzen Baum (Hyperraumantrieb 10) kostet
57,0 Mio = 0,26 % eines Tagesertrags. Forschungskosten sind heute komplett bedeutungslos und koennen
deutlich steigen, ohne irgendetwas kaputtzumachen. **Zielwert: kompletter Baum in der
Groessenordnung mehrerer Tageseinnahmen.** Zahlt direkt auf den beschlossenen Ressourcen-Engpass
ein.

**9.5 Module pruefen.** Der Nutzer nennt Module als "zu schnell". Ob Module ueberhaupt eine eigene
Bauzeit haben, ist aus der Analyse nicht belegt - **im Code pruefen**. Falls nein: eigene Bauzeit
geben, sie sind mit 99,57 Mrd (Schiffs-Module Vollausbau) die zweitgroesste Ressourcen-Senke nach
Gebaeuden.

#### ENDZIEL fuer den gesamten Zeit-Umbau (festgelegt 09.08.2026)

**Zeit ist eine KONSTANTE Reibung. Kosten sind der unbegrenzte Wachstumsmotor.**

Daraus folgt fuer jede kuenftige Einzelentscheidung in diesem Block:

1. **Jede hohe Ausbaustufe kostet in der Groessenordnung 1-5 Tage - auf Stufe 30 wie auf Stufe 60.**
   Bauzeit darf mit dem Fortschritt NICHT unbegrenzt mitwachsen. Wo sie das heute tut, wird sie
   gesaettigt (9.1a).
2. **Das unbegrenzte Wachstum lebt in den Kosten** (`costGrowth` 1,55-1,6 je Stufe), nicht in der
   Zeit. Dort ist "Zahlen wachsen immer weiter" richtig aufgehoben, weil die Einnahmen mitwachsen
   (Zielbild, Abschnitt 1) - bei der Zeit tun sie das nicht.
3. **Keine Reduktionsquelle darf die Zeit gegen null druecken, und keine darf wirkungslos sein.**
   Additiv statt multiplikativ (9.1b). Dieselbe Regel gilt sinngemaess fuer jeden anderen Stapel
   von Boni im Spiel - siehe Entscheidung 12 (Frischling-Bonus).
4. **Die Startphase bleibt unangetastet.** Zeitdruck ist Inhalt fuer die mittlere und spaete Phase.
   In Woche 1 ist die Ressourcenmenge der Engpass, nicht die Uhr.

#### Zielwert fuer die Bau-Kapazitaet

**Der taegliche Bau-Ausstoss soll grob in der Groessenordnung der Tageseinnahmen liegen** - heute
liegt er deutlich darueber (26-43 Mrd gegen 21,69 Mrd). Mit 1 Lane statt 3 faellt er auf rund
9-15 Mrd/Tag und damit in den Zielbereich.
**Nicht deutlich darunter gehen.** Sonst stapeln sich Ressourcen, die man nicht ausgeben kann - das
ist keine Tiefe, sondern Frust. Die Warteschlange federt das teilweise ab (man kann Ueberschuss
dauerhaft einbuchen).

#### Was diese Entscheidung nebenbei repariert (groesster Inhalts-Gewinn des Pakets)

Sobald Zeit zaehlt, werden auf einen Schlag wieder wertvoll, ohne dass etwas Neues gebaut wird:
- **vier Forschungszweige** (`bauzeit` 105,9 d + `bauzeit_schiffe`/`bauzeit_verteidigung`/
  `bauzeit_gebaeude` je 113,5 d = **446 Tage Forschungszeit**), die heute auf nichts zielen
- **sechs Zeit-Gutscheine** im Shop (150/300 DM)
- das **Samstags-Bauzeit-Event**
- der **Ingenieur-Bonus** (-15 % Bauzeit)
- `MAX_BUILDING_SLOTS` als Engpass ueberhaupt

#### Risiko

Die Nanitenfabrik ist heute exakt neutral kalibriert (`costGrowth: 2.0` gegen Zeitfaktor 0,5 pro
Stufe) - einmalige Kosten gegen dauerhaften Nutzen, es gibt nie einen Grund, den Ausbau zu stoppen.
Nach Einziehen der Untergrenze diese Kalibrierung neu bewerten.

---

### Entscheidung 10 - Rueckzug bei der Heimatverteidigung (BLOCKIEREND wegen Reset)

**Bezug:** README Punkt 27, Session 2 Befund 4. **Datei:** `game/raids.ts`.

**Sachlage:** Der Rueckzugs-Mechanismus ist bei Raids bewusst abgeschaltet (`allowRetreat = false`),
mit guter Begruendung: man kann sich nicht aus der Verteidigung der eigenen Basis zurueckziehen, und
da Verteidigungsanlagen schneller sterben als eine grosse Flotte, wuerde sonst die gesamte
Streitmacht vorzeitig abziehen.
**Aber:** gemessen bei schwachem Ausbau ergibt das **100 % Flottenverlust**. Das widerspricht der
Nutzervorgabe "spuerbar, aber nie Totalverlust". Fuer die beiden entwickelten Accounts greift es
heute nicht - es trifft neue Spieler und schwache Phasen.

**Entscheidung:** Eine Untergrenze fuer die Heimatverteidigung einziehen, die NICHT der normale
Flotten-Rueckzug ist (der wuerde das dokumentierte Problem zurueckbringen). Naheliegend: die
verteidigende **Flotte** darf sich absetzen, wenn sie unter einen Schwellwert faellt, die
**Verteidigungsanlagen** kaempfen weiter. Damit bleibt die Begruendung aus README Punkt 27 intakt
und ein Totalverlust der Flotte ist ausgeschlossen.

**Vorher pruefen:** ob das den Raid endgueltig unverlierbar macht (er ist es heute schon fast, siehe
Entscheidung 3). Falls ja, ist der bessere Weg der Schnappschuss der ersten Welle statt einer
Rueckzugsregel.

**Dringlichkeit durch den Reset:** Bisher als "trifft nur neue Spieler" eingestuft. **Nach dem
Reset sind ALLE Spieler neue Spieler.** Der 100-%-Flottenverlust bei schwachem Ausbau ist damit
kein Randfall mehr, sondern das erwartbare Ergebnis der ersten Raids. **Muss vor dem Reset fertig
sein.**

---

### Entscheidung 12 - Frischling-Bonus: ADDITIV STATT MULTIPLIKATIV (durch Reset dringend)

**Bezug:** Session 1, Befund 7. **Dateien:** `game/missions.ts` (`miningMultiplier()`),
`data/economy.ts` (`NOVICE_BONUS_MULTIPLIER`, `ABBAU_BOOST_MULTIPLIER`).

**Sachlage:** Alle Mining-Multiplikatoren stapeln rein multiplikativ:
Mining-Forschung Stufe 10 (x2) * `mining_schiffe` * Prospektor (1,2) * Abbau-Booster (1,7) *
Di/Do-Event (2,0) * Frischling (3,0) = **bis 24,5x**. Ein 7 Tage alter Account kommt damit auf rund
**8,5 Mrd/Tag allein aus Asteroiden** - mehr als eine voll ausgebaute Heimatbasis (0,55 Mrd/Tag)
und rund 40 % der Endspiel-Baseline.

**Entscheidung:** `NOVICE_BONUS_MULTIPLIER` additiv statt multiplikativ wirken lassen. Der
Frischling-Bonus ist als Aufholhilfe gedacht und ueberschiesst in dieser Stapelung deutlich.

**Warum durch den Reset dringend:** Bisher war das eine Randbeobachtung fuer hypothetische neue
Spieler. **Nach dem Reset ist es die erste Spielwoche beider Spieler.** Ohne Korrektur ist die
Startphase die ertragreichste Phase des Spiels relativ zum Aufwand - genau das Gegenteil der
Vorgabe "Zahlen wachsen immer weiter".

**Vorsicht:** Nicht ueberkorrigieren. Der Bonus soll die Startphase weiterhin spuerbar
beschleunigen, gerade weil Entscheidung 9 (Zeit als Engpass) sie gleichzeitig verlangsamt. Beide
Aenderungen wirken in dieselbe Richtung und muessen **gemeinsam** gegen die
30-Tage-Fortschrittssimulation (Abschnitt 1a) kalibriert werden, nicht einzeln.

---

### Entscheidung 11 - Aussenposten-Reste entfernen

**Bezug:** Session 4, Befund 11. **Dateien:** `data/economy.ts` (Zeilen 555-601),
`data/galaxyConstants.ts` (Zeilen 52-66), `game/galaxyPositions.ts`, `data/combatConstants.ts`
(Zeile 530).

`game/outposts.ts` existiert nicht mehr, die README fuehrt das Feature korrekt als entfernt. Im Code
leben rund 50 Zeilen Konstanten weiter, und **`galaxyPositions.ts` reserviert weiterhin 6
Galaxie-Positionen als belegt** - unsichtbar gesperrt fuer Allianz-Stationen, Umzuege und
Galaxie-Ereignisse.

**`OUTPOST_MULTIPLIER_ROLL` vor dem Loeschen sichern** - die Werte sind fuer genau den Zweck
kalibriert, den Entscheidung 5 braucht.

---

### Entscheidung 13 - KI-Mitspieler und Piratenbasen: ERTRAG AN DIE EIGENE FLOTTENMACHT KOPPELN

**Bezug:** Nutzerbeobachtung 09.08.2026 ("Vega und Nyx sollen Spieler imitieren, tun das nach
vielen Fixes immer noch nicht"), belegt durch Code-Pruefung in derselben Sitzung. **In keiner der
vier Sessions enthalten - komplett neuer Punkt.** **Dateien:** `game/economyBotTurn.ts`,
`game/bot.ts`, `game/pirateBaseState.ts`, `data/economy.ts`
(`NPC_PRODUCTION_BONUS_MULTIPLIER`), `game/routes.ts` (`/galaxy`).

**Kernbefund:** Die Entscheidungslogik der Bots ist nicht das Problem - sie ist fuer das, was sie
tut, sauber gebaut und nutzt exakt dieselben Aktionsfunktionen wie ein Mensch. Das Problem liegt
eine Ebene tiefer: **Bots bauen, aber sie spielen nicht.** Sie fliegen keine Missionen, keine
Raids, keine Asteroiden, oeffnen keine Container. Kein Feinschliff an der Bau-Reihenfolge kann das
aufholen.

**13.1 Der Ertrag ist strukturell zu niedrig (Hauptpunkt).**
Ein Spieler verdient 21,69 Mrd/Tag, davon **0,55 Mrd aus den Minen - also 2,5 %**. Bots und
Piratenbasen haben ausschliesslich Minen-Einkommen, ausgeglichen ueber
`NPC_PRODUCTION_BONUS_MULTIPLIER = 6`. Das ergibt rund **3,3 Mrd/Tag, etwa 15 % eines Spielers**.
Der Kommentar an der Konstante behauptet, sie leiste den kompletten Ausgleich fuer den fehlenden
Zugang zu Container-/Missions-/Raid-Beute; dafuer muesste sie bei rund **39** liegen, nicht bei 6.

Zwei Wege:
- **(a) Bots wirklich fliegen lassen** (Missionen, Elite, Raids). Realistisch abgebildet, aber jede
  geflogene Mission ist eine echte Kampf-Simulation im nur 2-Worker-Pool - genau das wurde nach dem
  CPU-Spitzen-Vorfall gedrosselt (README Punkt 97/98). Nicht empfohlen.
- **(b) Virtueller Missions-Ertrag aus der eigenen Flottenmacht** (EMPFOHLEN). Der Bot bekommt pro
  Zeiteinheit einen Ertrag, der sich aus `combatFleetPowerBase()` seiner eigenen Flotte ableitet -
  **mit denselben Koeffizienten wie Entscheidung 2** (Beute je vernichteter Feindmacht) - und
  zusaetzlich eine **virtuelle Verlustrate** aus derselben Groesse. Kein Kampf, keine CPU-Last,
  aber per Konstruktion dieselbe Kurve wie bei einem Spieler: waechst die Bot-Flotte, waechst
  Ertrag UND Verlust mit. Damit erfuellt der Bot automatisch das Zielbild aus Abschnitt 1, statt
  ueber einen festen Multiplikator daneben zu liegen.
  **Nachteil:** bleibt eine Naeherung. Bots erleben nie echte Zufallsausreisser (Totalverlust,
  Gluecksserie) und haben deshalb eine unnatuerlich glatte Wachstumskurve.

**Ohne die virtuelle Verlustrate NICHT umsetzen.** Ertrag ohne Verlust waere eine monoton wachsende
Flotte ohne jede Gegenkraft - der Bot wuerde die Spieler ueberholen statt sie zu begleiten.

**13.2 Vega und Nyx sind heute nicht unterscheidbar.**
Forschung laeuft strikt in der Array-Reihenfolge von `RESEARCH` durch (erste Technologie, die
bezahlbar ist). Schiffe und Verteidigung werden nach "geringster Bestand zuerst" gebaut, was
langfristig auf **gleiche Stueckzahlen aller 8 Schiffstypen und aller 11 Verteidigungstypen**
zulaeuft. So baut kein Spieler, und es ist zusaetzlich wertmaessig schief: gleich viele Reaper wie
Leichte Jaeger heisst, der Grossteil des Flottenwerts steckt in den teuersten Typen - nach
Entscheidung 6 genau die schlechteste Verwendung. Einziger Unterschied zwischen beiden Bots ist
heute die zufaellige Klassenwahl in `maybeChooseClass()`.
-> Feste Profile je Bot: gewichtete Bauverteilung statt Gleichverteilung, eigene
Forschungsreihenfolge, dazu passende Klasse statt Zufall. Vorschlag: **Vega offensiv/flottenlastig
(Kanonier), Nyx defensiv/wirtschaftslastig (Bollwerk)**. Billig umzusetzen, sofort sichtbar in der
Spielerliste und im Kampfbericht.

**13.3 Wachstum haengt an der Aufruf-Haeufigkeit, nicht an der Zeit (blockiert Entscheidung 5).**
`loadPirateBase()` ruft bei JEDEM Laden `runEconomyBotTurn()` auf. `/galaxy` in `routes.ts` laedt
ueber `listActivePirateBaseSummaries()` **alle vier Basen bei jedem Aufruf der Galaxie-Ansicht**.
Die Ressourcenproduktion selbst ist zeitbasiert und damit korrekt - der **Bau-Entscheidungsschritt
ist es nicht**. Eine Basis waechst also schneller, je oefter jemand in die Galaxie schaut.
-> Entscheidungsschritt an einen Zeitstempel auf der Basis haengen (z.B. hoechstens alle N Minuten),
nicht an den Ladevorgang. Kleine Aenderung, aber **Voraussetzung fuer jede reproduzierbare Messung
an Entscheidung 5**.

**13.4 Entscheidung 9 trifft Bots haerter als Spieler.**
Bots und Basen teilen sich `MAX_BUILD_SLOTS`, `MAX_DEFENSE_SLOTS` und `MAX_RESEARCH_SLOTS` mit den
Menschen. 3 Bau-Lanes auf 1 und 4 Forschungsslots auf 1 bremst sie im selben Verhaeltnis - nur haben
sie keine zweite Einnahmequelle zum Ausgleich und keine Warteschlangen-Strategie (pro Zug wird
hoechstens ein Auftrag eingereiht). Nach dem Reset fallen sie dadurch dauerhaft zurueck.
-> Gehoert zwingend in die Kalibrierung von Block D und in die 30-Tage-Simulation.

**13.5 Warum das nicht nur Kosmetik ist.**
Das **Elite-Bollwerk ist mit 10,87 Mrd/Tag die groesste Einnahmequelle des Spiels** und braucht
Mitspieler. Bots nehmen ueber `maybeHandleGroupOps()` daran teil. Sind sie zu schwach, faellt der
groesste Posten des Spiels aus oder wird zum Verlustgeschaeft. Nach dem Reset trifft das sofort:
Bots starten wie alle anderen bei null. **Bot-Staerke ist damit keine Nebensache, sondern eine
Vorbedingung fuer den wichtigsten Inhalt.**

**Messkriterien:**
- Bot-Flottenwert und Bot-Einnahmen gegen einen menschlichen Spieler ueber 30 simulierte Tage.
  **Zielkorridor: 60-100 % des Spielers**, nicht 15 %.
- Elite-Bollwerk mit 2 Bots + 1 Mensch in Woche 1, Woche 2 und Woche 4 der 30-Tage-Simulation:
  ab wann ist die Expedition ueberhaupt gewinnbar?
- Nach 13.3: Basiswachstum zweimal mit unterschiedlich vielen Galaxie-Aufrufen messen - die
  Ergebnisse muessen identisch sein.

---

### Entscheidung 14 - Gebaeude-Module der Heimatbasis fuer V2/V3 (verschoben aus 7.5)

**Bezug:** Session 3, Befund 9 + Nutzerhinweis 09.08.2026, praezisiert durch Code-Pruefung.
**Dateien:** `data/buildingModules.ts`, `game/actions.ts`
(`roboterNaniteFactor()`, `BUILDING_SELF_BUILDTIME_MODULE`, `mineOutputPerHour()`,
`energyConsumed()`/Solar-Ertrag), `game/state.ts` (Migration).

**Befund, praeziser als bisher im Plan:**
- **Allianz-Station: nicht betroffen.** Ihre Module werden per Generator ueber `STATION_BUILDINGS`
  erzeugt, dort stehen v1/v2/v3 - alle drei Stufen haben vollstaendige Module.
- **Heimatbasis: betroffen.** `data/buildingModules.ts` enthaelt 15 **handgetippte** Module mit
  ausschliesslich V1-IDs. Genau dieser Unterschied - Generator gegen Handarbeit - ist die Ursache.
- Fuer V2/V3 laufen drei verschiedene Fehler nebeneinander:
  1. Ertrag, Energie, Solar-Ertrag und Fabrik-Verstaerkung: die IDs werden zur Laufzeit als
     `v2_metallmine_foerdereffizienz` usw. zusammengesetzt, existieren aber nicht.
     `moduleBoostFactor()`/`moduleReductionFactor()` geben **still 1 zurueck** - kein Fehler, keine
     Meldung.
  2. Die gebaeudeeigenen Bauzeit-Module werden fuer V2/V3 **nicht einmal zusammengesetzt**:
     `BUILDING_SELF_BUILDTIME_MODULE` ist eine feste Zuordnungstabelle mit ausschliesslich
     V1-Schluesseln.
  3. `loadPlayerState()` legt die Modulfelder aus `BUILDING_MODULES` an - die V2/V3-Felder
     existieren im Spielstand also gar nicht.

**Entscheidung:** Heimatbasis auf **denselben Generator** umstellen wie die Station, statt 30
weitere Module von Hand nachzutippen. **Nachteil:** die heute individuell gesetzten Kostenwerte je
Gebaeude gehen in eine Formel ueber, die Werte verschieben sich leicht. Durch den Server-Reset ohne
Folgen. Der Gewinn: bei einer kuenftigen V4-Stufe entsteht derselbe Fehler nicht noch einmal.

**ZWINGEND gemeinsam mit Entscheidung 9.1 kalibrieren.** Den V2/V3-Gebaeuden fehlt heute die
"Verstaerkte Automatisierung" von Roboter- und Nanitenfabrik - beide senken den Bauzeit-Faktor um je
die Haelfte. **V2/V3 bauen dadurch aktuell viermal langsamer als ein gleich ausgebautes V1.** Wer
Entscheidung 14 repariert, beschleunigt V2/V3 um Faktor 4 und arbeitet damit direkt gegen den
Zeit-Engpass. Wird das getrennt gemessen, ist die Kalibrierung von 9.1 hinterher falsch.

**Einordnung der Groesse:** 44,38 Mrd Vollausbau der Gebaeude-Module entsprechen rund **zwei
Tageseinnahmen** im Endspiel - spuerbar, aber nicht dringend. Nach dem Reset liegt V2/V3 ohnehin
Monate entfernt. **Nicht blockierend fuer den Reset.**

---

## 3. Reine Reparaturen (keine Entscheidung noetig, laufen parallel mit)

| # | Was | Datei | Bezug |
|---|---|---|---|
| R1 | Gebaeude-Bauzeit-Untergrenze **Server UND Client synchron** | `game/actions.ts` + `client/src/lib/multipliers.ts` | S1-B3 |
| R2 | Toter `REWARD_ESCALATION`-Code bei `piraten_niedrig/mittel/hoch` entfernen oder auf `winResources` verdrahten (NICHT auf `winContainer` - waere wieder exponentiell) | `data/economy.ts`, `game/missions.ts:537-539, 572, 586-593` | S1-B6 |
| R3 | Forschungs-Minimum pro Beitragendem statt global. Heute senkt **ein Mitspieler mit 1 Leichtem Jaeger und Forschung 0 den Verlust des Hauptspielers um Faktor 19**. Zeitbombe fuer jeden weiteren Account. **Regressionstest gegen die Urspruengliche Korrektur vom 05.08.2026**: der schwaechere Mitspieler darf nicht wieder ueber seinem Stand kaempfen muessen | `game/combat.ts` (`computePirateResearch()` ~Zeile 769), `game/groupOps.ts` | S2-B6 |
| R4 | `defenseFactor` ist an drei Stellen dupliziert und bereits auseinandergelaufen (`piraten_mittel`: Simulator 0,12, `groupOps.ts` 0,10) - **der Simulator sagt fuer Mittel etwas anderes voraus als der echte Kampf**. In eine Konstante zusammenfuehren | `simulator.ts:69-73`, `groupOps.ts:775-776`, `missions.ts` | S2-B9 |
| R5 | `MULTI_TARGET_POWER_CORRECTION` in `resolveOneWave()` nachziehen. Sentinel-/Ultimate-Kanone und alle Salvenschiffe zaehlen zu Hause nur mit einem Achtel ihrer Macht - wer in sie investiert, bekommt die schwaechsten Wellen bei der staerksten Abwehr | `game/raids.ts:319-327` | S3-B4 |
| R6 | Beim Verschrotten den erstatteten Betrag von `resourcesSpentShipsDefense` abziehen. Heute ergibt Bauen -> Verschrotten -> Bauen bei `SCRAP_REFUND_RATE = 0.3` **1,43x Punkte** aus derselben Ressourcenmenge | `game/stats.ts`, `scrapUnits()` | S4-B9 |
| R7 | `GalaxyEvent.claimedBy` wird gelesen, aber nirgends gesetzt. Feld und Typ-Kommentar bereinigen | `game/galaxyEvents.ts`, `types.ts` | S4-B10 |
| R8 | `startSpyProbe()` nimmt `qty` entgegen, prueft und verbraucht sie - **auf den Bericht hat sie keinen Einfluss** (`buildSpyReport()` haengt allein an `research.spionage`). Entweder `qty` entfernen oder den Detailgrad an die Sondenzahl koppeln (letzteres gibt der Spionagesonde ueberhaupt erst eine Bauentscheidung) | `game/spyMissions.ts` | S4-B10 |
| R9 | Kampfbericht-Anzeige "[Feindstaerke X%]" korrigieren - sie zeigt den nominalen Wert, der real etwa die Haelfte bedeutet (siehe Abschnitt 4) | Client | S2-B1/B9 |
| R10 | README korrigieren: Aussenposten, RapidFire-Kette (kein Stein-Schere-Papier), Kosten/Waffenpunkt-Korridor, Salvenschiffe als Rollen-Einheiten | `README.md` | S4-Konsistenz |
| R11 | Changelog-Eintrag - Balance-Aenderungen dieser Groessenordnung sind fuer Spieler sichtbar | `data/changelog.ts` | S4-Konsistenz |
| R12 | **Startpruefung fuer zusammengesetzte Modul-IDs.** `moduleBoostFactor()`/`moduleReductionFactor()` liefern bei unbekannter ID still 1 - dieselbe Fehlerklasse wie der auseinandergelaufene `defenseFactor` (R4) und der tote `ADMIRAL_ESCORT_BASE`. Beim Serverstart pruefen, ob jede im Code gebildete Modul-ID eine Definition hat, und sonst laut melden. Kleiner Aufwand, macht diese ganze Fehlerklasse dauerhaft sichtbar | `game/actions.ts`, `index.ts` | 09.08.2026 |

---

## 4. Bewusst NICHT geaendert (mit Begruendung)

**`combatFleetPowerBase()` bleibt auf Rohwerten** (Session 2, Befund 1, Variante b).
Die Funktion summiert rohe `baseStats()` - ohne Forschung, Kampf-Booster, Klasse und Module. Genau
dieser Wert ist die Bezugsgroesse fuer alle Feindstaerke-Tabellen. Real bedeutet:

| Nominale Feindstaerke | real (Booster + Module 10) | zusaetzlich mit Kanonier |
|---|---|---|
| 100 % | **57 %** | 28 % |
| 120 % (Hoch, Spitzenwert) | 68 % | 34 % |
| 155 % (Elite, Spitzenwert) | 88 % | 44 % |

**Die urspruengliche Begruendung ist durch den Server-Reset hinfaellig geworden** und wurde am
09.08.2026 ersetzt. Sie lautete: "Variante (a) entwertet nachtraeglich bereits getaetigte
Investitionen." Nach einem Reset gibt es keine solchen Investitionen mehr. Damit ist (a) wieder
technisch moeglich. **Die Entscheidung bleibt trotzdem bei (b), aus einem anderen Grund:**

Wenn `combatFleetPowerBase()` Module mitrechnet, waechst der Gegner mit jedem gebauten Modul mit.
Module amortisieren sich heute erst nach **508-806 Tagen** (Session 3, Befund 6) und sind nur
deshalb nicht wertlos, weil sie die Gegnerskalierung NICHT erhoehen - das ist ihr einziger
verbliebener Wert, und er steht nirgends im Code. Variante (a) wuerde ihn beseitigen und zwingend
eine Modulkosten-Senkung um **Faktor 3-5** nach sich ziehen. Das ist eine Kette, kein Einzelschritt.

Stattdessen: **die Anzeige korrigieren** (R9) und die Werte bewusst auf das reale Niveau anheben,
falls noetig.

**Modulkosten - ENTSCHIEDEN 09.08.2026, aber als ZIELWERT, nicht als Zahl.**
Eine feste Kostensenkung "um Faktor 3-5" jetzt festzuschreiben waere ein Rechenfehler: die
508-806 Tage Amortisation sind gegen die heutige Baseline von 21,69 Mrd/Tag gerechnet, und genau
diese Baseline faellt nach Block A weg (Abschnitt 7). Ein heute festgelegter Faktor waere nach der
ersten Messung falsch.
-> **Zielwert: Module amortisieren sich in der Groessenordnung 60-120 Tage, gemessen gegen die NEUE
Baseline nach Block A.** Der noetige Faktor ergibt sich daraus, er wird nicht vorher geraten.
Begruendung fuer diese Spanne: kuerzer als 60 Tage macht Module zur Pflichtaufgabe statt zum Ziel;
laenger als 120 Tage faengt niemand damit an, und die zweitgroesste Ressourcen-Senke des Spiels
(99,57 Mrd) bleibt tot. Beides widerspricht der Vorgabe "Ziele auf Dauer beibehalten".
-> **Zusaetzlich dokumentieren, im Code und im Info-Popup:** dass Module die Gegnerskalierung NICHT
erhoehen. Das ist heute ihr staerkstes Argument und steht nirgends - weder im Spiel noch im Code.
Ein Vorteil, den niemand kennt, wirkt nicht.
-> **Feindstaerke-Variante bleibt bei (b)** und wird nicht neu aufgemacht. Variante (a) wuerde genau
diese Eigenschaft beseitigen und die Modulentscheidung zu einer Kette aus drei voneinander
abhaengigen Aenderungen machen. Der Gewinn rechtfertigt das nicht.

**Falls eine spaetere Session (a) doch umsetzen will:** dann zwingend zusammen mit der
Modulkosten-Senkung, und NICHT gleichzeitig mit einer Anhebung von `PIRATEN_MULTIPLIER_ROLL`.

**NIEMALS beides gleichzeitig:** `PIRATEN_MULTIPLIER_ROLL` anheben UND auf echte Kampfwerte
umstellen. Nominal 250 % waeren nach (a) auch real 250 %, was laut Sweep bereits fuer das Profil
"mittel" 30 % Verlust bedeutet. Die Kante ist ausserdem sehr scharf (350 % -> 400 % kippt von 88 %
auf 38 % Siegchance) - in kleinen Schritten anheben und nach jedem Schritt neu simulieren.

**Der Imperator bleibt Prestige-Einheit - ABER die Entscheidung steht auf duenner Datengrundlage.**

Session 3, Befund 10 nennt ihn "rechnerisch die schlechteste Einheit im Spiel": 0,0040 Power je
Wert-Einheit gegen 0,90 beim Leichten Jaeger, Faktor 225. Bewertet ueber den Teile-Gegenwert
(3.000 Teile x 325.000 = 975 Mio Wert-Einheiten).

**Was diese Zahl wirklich aussagt - und was nicht:**
- "Power" ist `combatFleetPowerBase()`, also die Bezugsgroesse fuer die GEGNER-Skalierung. Die Zahl
  sagt: der Imperator erhoeht die Gegnerstaerke kaum, gemessen an dem, was er kostet.
- Sie sagt NICHT, wie stark er im Kampf ist.
- **Dieselbe Eigenschaft ist bei Modulen ausdruecklich als deren einziger verbliebener Wert
  dokumentiert** (Session 3, Befund 6: Module erhoehen die Gegnerskalierung nicht). Beim Imperator
  wirkt derselbe Effekt, nur staerker - er bringt Panzerung (2.520.000) und RapidFire in den Kampf
  ein und meldet der Skalierungsformel fast nichts.
- Die 975 Mio entsprechen 4,5 % eines Tageseinkommens. Der reale Preis sind nicht Ressourcen,
  sondern die Grind-Zeit fuer 3.000 Teile.

**Die Luecke: Der Imperator wurde in KEINER der vier Sessions im Kampf gemessen.** Er ist Teil der
Referenzflotte "gross" (2 Stueck), aber er fehlt in der Einzeltyp-Tabelle aus Session 3, Befund 3
(elf Schiffe) und in der Duell-Matrix aus Session 4, Befund 7 (acht Schiffe). Die Bewertung
"schlechteste Einheit" stammt aus einer reinen Tabellenrechnung, nicht aus einem simulierten
Gefecht.

**Messauftrag (vor jeder Aenderung an Teile-Kosten oder Kampfwerten):**
1. Imperator in `run_ships.mjs` (Duell bei gleichem Wert) und `run_ship_value.mjs`
   (machtskalierter Sektor) aufnehmen - er fehlt in beiden.
2. Gezielt gegen Jaegerschwaerme testen. Die README beschreibt ihn als RapidFire-Gegenmittel gegen
   Jaeger-Klassen. **Dieselbe README-Passage enthaelt nachweislich einen Fehler** (der
   Schlachtkreuzer hat kein RapidFire gegen Jaeger und verliert mit -553 bis -556 Mio, siehe
   Entscheidung 6). Die Aussage zum Imperator ist damit ungeprueft, nicht automatisch falsch.
3. Den Skalierungsvorteil separat beziffern: wie viel schwaecher faellt die generierte
   Gegnerflotte aus, wenn dieselbe Kampfkraft ueber Imperatoren statt ueber Standardschiffe
   eingebracht wird?

**Widerspruch im Baulimit klaeren:** README Punkt 21 nennt `maxCount` **2** ("bleibt bewusst bei 2"),
Session 3, Befund 6 rechnet mit **6**. Einer der beiden Staende ist veraltet - im Code pruefen und
die README nachziehen (gehoert zu R10).

**Erst nach dieser Messung entscheiden**, ob der Imperator Prestige-Einheit bleibt. Bis dahin gilt
die Prestige-Einstufung als vorlaeufig, nicht als belegt.

**Galaxie-Ereignisse bleiben Deko** (31 Mio Wert/Tag = 0,14 % der Baseline). Ausdruecklich als
"Grund, in die Galaxie-Ansicht zu schauen" gewollt. Einzige Ergaenzung: ein UI-Hinweis, dass fuer
einen Bergungsflug ein einzelnes Schiff genuegt - der Versand der kompletten Realflotte kostet
9,28 Mio Deuterium (27,8 Mio Wert) und wuerde die Beute aufzehren.

**Solo-Stufen Niedrig/Mittel/Hoch:** Session-1-Befund 1 (die drei Stufen sind wirtschaftlich
identisch, Hoch bringt pro Sieg sogar weniger als Mittel) wird durch Entscheidung 2 automatisch
geloest - die Beute haengt danach an der vernichteten Feindmacht, und die unterscheidet sich je
Stufe. **Erst nach Entscheidung 2 neu bewerten**, nicht vorher an `winContainer` drehen.

**Booster-Preise** (Session 1, Befund 5): Entscheidung 3 (Raid-Halbierung) entfernt bereits 595 der
1.088 DM/Tag. **Danach neu messen**, bevor an `BOOSTER_DURATION_OPTIONS` gedreht wird.

---

## 5. Reihenfolge der Umsetzung

```
BLOCK A (zusammen messen, hier haengt alles dran)
  1. Entscheidung 1   Overkill-Deckel
  2. Entscheidung 2   Beute-Exponent 0,85 + Wrack-Bergung 30 %
  3. Entscheidung 3   Raid-Ertrag halbieren
  -> danach ALLE Simulationen neu, dann Baseline neu festschreiben

BLOCK B (Piratenadmiral, in sich sequenziell)
  4. Entscheidung 4.1 + 4.2  Verlust-Kriterium UND contributedPower-Freeze ZUSAMMEN
  5. Entscheidung 4.3 - 4.8  Boss-Anteil, Mechanik, Belohnung, Cooldown

BLOCK C (unabhaengig voneinander, AUSSER 13.3 vor 5)
  6. Entscheidung 13.3 Bot-/Basis-Wachstum von der Aufruf-Haeufigkeit entkoppeln
                       -> Voraussetzung fuer JEDE reproduzierbare Messung an Entscheidung 5
  7. Entscheidung 5   Piratenbasen (+ Schranke gegen Dauer-Farming! + SEED_FLEET-Boden, 5a)
  8. Entscheidung 6   Schiffs-Tiers
  9. Entscheidung 7   Allianz-Station
 10. Entscheidung 10  Heimatverteidigung
 11. Entscheidung 13.1 + 13.2  Bot-Ertrag aus eigener Flottenmacht, Bot-Profile
                       -> 13.1 braucht die Koeffizienten aus Entscheidung 2, also nach Block A

SIMULATION (neu, ENTSCHIEDEN 09.08.2026 - vorgezogen aus Block F)
 11a. 30-Tage-Fortschrittssimulation nach Abschnitt 1b bauen und erstmals ausfuehren
      -> ohne sie ist Block D nicht gegen die Startphase kalibrierbar, sondern nur gegen
         das Endspiel - und muesste danach ein zweites Mal kalibriert werden

BLOCK D (Zeit-Umbau, eigener Block wegen Doppelbremse)
 12. Entscheidung 9.1  Saettigungskurve + additive Reduktionen  -> messen
 13. Entscheidung 14   Gebaeude-Module V2/V3 der Heimatbasis
                       -> ZUSAMMEN mit 9.1 kalibrieren (Faktor 4 auf V2/V3-Bauzeit)
 14. Entscheidung 9.2  Slots auf 1 + Warteschlange  -> messen
                       -> dabei 13.4 pruefen: Bots werden davon haerter getroffen als Spieler
 15. Entscheidung 9.3  Forschungs-Wirkungskurve
 16. Entscheidung 9.4  Forschungskosten
 17. Entscheidung 9.5  Module

BLOCK E (Kleinkram, jederzeit)
 18. Entscheidung 8   Sandronator
 19. Entscheidung 11  Aussenposten-Reste
 20. R1 - R12

BLOCK F (STARTPHASE - erst wenn A bis E stehen, vor dem Reset)
 21. Entscheidung 12  Frischling-Bonus additiv
 22. 30-Tage-Fortschrittssimulation ERNEUT ausfuehren (gebaut in Schritt 11a, Abschnitt 1b) -
     alle sechs Abnahmekriterien muessen erfuellt sein
 23. Entscheidung 9 GEGEN DIE STARTPHASE nachkalibrieren (nicht gegen das Endspiel)
 24. Entscheidung 10 verifizieren: kein Totalverlust mehr bei Startausbau
 25. Entscheidung 13.5 verifizieren: ist das Elite-Bollwerk mit 2 Bots + 1 Mensch in
     Woche 1/2/4 ueberhaupt gewinnbar? Wenn nein, faellt der groesste Inhalt des Spiels
     nach dem Reset wochenlang aus.

RESET
 26. Erst nach Block F. Ein Reset ist einmalig - Fehler in der Startphase
     fallen sonst erst nach Wochen auf.
```

**Entscheidung 10 und 12 sind blockierend fuer den Reset.** Alles andere waere im Nachhinein
korrigierbar, diese beiden nicht ohne einen zweiten Reset.

---

## 6. Messregeln (aus vier Sessions gelernt, gelten fuer JEDE Aenderung)

1. **Vor jeder Simulation `npx tsc` im Server ausfuehren.** Der Kampf-Worker laedt immer aus
   `dist/` (README Punkt 9) - ohne frischen Build misst man den alten Stand.
2. **Nie einen Einzellauf bewerten.** Mindestens **40 Laeufe je Zelle**. Bei 16 war die Kurve im
   Sweep noch nicht monoton (250 % -> 75 % Sieg, 300 % -> 94 %).
3. **Ertraege NIE an einem Einzelcheck bewerten.** `simulateCombat()` zeigt nur EINEN Check; die
   Verluste einer kompletten 24h-Mission liegen um den Faktor der Checkanzahl hoeher. Session-3-
   Befund 2 wurde in Session 2 genau deshalb uebersehen.
4. **Immer die Wert-Bilanz rechnen, nicht die Verlustquote.** 2 % Verlust sind bei 6 Mrd
   Flottenwert belanglos und bei 66 Mrd toedlich.
5. **Drei Multiplikatoren hintereinander pruefen**, bevor an einem Basiswert gedreht wird:
   `getEscalationMultiplier()`, `completionMultiplier = 2` (Elite) und
   `PIRATEN_EVENT_BONUS_MULTIPLIER` (Mo/Fr).
6. **Ressourcen in Wert-Einheiten vergleichen** (`TRADE_VALUE`) und Container-DM nicht vergessen -
   genau dieser Posten fehlte in der Session-1-DM-Bilanz.
7. **Container-Werte NIE nach den rohen `chance`-Werten beurteilen** - die "genau 2 Treffer"-
   Normalisierung verschiebt sie erheblich (`computeRealCategoryChances()`).
8. **Client-Spiegel nicht vergessen:** `client/src/lib/multipliers.ts` spiegelt Bauzeit-, Klassen-
   und Booster-Multiplikatoren 1:1.
9. **`result.retreated` bedeutet nicht "verloren"**, sondern "mindestens ein Schiff hat sich
   abgesetzt". Jede Auswertung dieses Flags muss den Sieg-Fall vorher ausschliessen.
10. **`simulateCombat()` deckt nur die Piraten-Sektoren ab** und ist Einzelspieler-only. Fuer
    P10/Raid/Elite-Bollwerk muss der jeweilige Ablauf gegen `runCombatInWorker()` bzw.
    `runMultiOwnerCombatInWorker()` nachgebaut werden.
11. **`speed` ist eine flottenweite Eigenschaft** (`galaxyFleetSpeed()` nimmt das langsamste
    Schiff). Ein einzelner Ausreisser nach unten wirkt auf jede Flotte, in der er mitfliegt.
12. **Feste Gegnerstaerke und feste Belohnung sind dasselbe Problem aus zwei Richtungen.** Bei jedem
    neuen Inhalt zuerst pruefen, welche der beiden Seiten mitwaechst.
13. **Jede neue Einheit mit hohem Einzelschaden an BEIDEN Seiten der Aggregations-Schwelle testen**
    (`run_aggregate_threshold.mjs`) - bis Entscheidung 1 umgesetzt ist.

---

## 7. Nach der Umsetzung neu zu bestimmen

- **Einnahmen-Baseline komplett neu rechnen.** Die 21,69 Mrd/Tag gelten nach Block A nicht mehr.
- **DM-Bilanz neu rechnen.** 1.088/Tag faellt durch Entscheidung 3 um 595.
- **Kipppunkt der Beute-Kurve messen** (Entscheidung 2).
- **"74 Tage bis alles gekauft ist" neu rechnen** - Entscheidung 7 und 9.4 verlaengern das.
- Erreichte Check-Tiefe bei P10 (Ziel 3-5).
- Ob die Solo-Sektoren durch Entscheidung 2 wieder lohnend sind (heute fuer die reale Flotte
  **-0,55 Mrd pro 24h**, also totes Inhalt).
- **Imperator im Kampf messen** (Abschnitt 4) - er fehlt in beiden Schiffs-Messungen. Danach
  entscheiden, ob die Prestige-Einstufung bleibt.

---

## 8. Uebergabe an Folge-Chats (ZUERST LESEN)

Dieser Plan entsteht ueber mehrere Chat-Sitzungen hinweg. Dieser Abschnitt macht einen Kaltstart
moeglich, ohne dass der Gespraechsverlauf mitgeliefert werden muss.

### Wer hier arbeitet

Zwei Spieler (Ehepaar), **keine Entwickler**. Sie betreiben den Server privat, es gibt keine
weiteren echten Spieler ausser Bot-Accounts.

**Erwartete Kommunikation:**
- Normale Sprache. Fachbegriffe einmal kurz miterklaeren. Begriffe wie "Aggregat-Stapel",
  "Overkill", "Feindstaerke-Skalierung", "Amortisation" oder "Koeffizient K" sind von sich aus
  nicht verstaendlich.
- **Bei jeder Zahl dazusagen, ob sie viel oder wenig ist.** Referenz: 21,69 Mrd Wert/Tag
  Einnahmen im Endspiel (siehe Abschnitt 1), 1.088 DM/Tag.
- Auswirkungen als Spielgefuehl beschreiben, nicht als Formel: Was merkt man beim Spielen? Was
  passiert, wenn nichts geaendert wird?
- Keine langen Code-Ausschnitte. Dateinamen nur zur Orientierung.
- Sachlich, kompakt, keine Hoeflichkeitsfloskeln, keine Emojis.
- Aktiv widersprechen, wenn eine Idee zu Problemen fuehrt - auch wenn sie bereits entschieden ist.

### Wie die Entscheidungen zustande kamen

Der Nutzer hat die Entscheidungshoheit ausdruecklich delegiert ("mach wie du denkst und fuer
richtig haeltst"), nachdem ihn 8 gleichzeitige Einzelentscheidungen ueberfordert hatten.
**Konsequenz fuer Folge-Chats: nicht mit offenen Fragen antworten, sondern mit einem entschiedenen
Vorschlag samt Begruendung UND ausdruecklich genanntem Nachteil.** Der Nutzer korrigiert dann
punktuell.

Vorgegeben hat der Nutzer nur drei Geschmacksfragen:

| Frage | Antwort |
|---|---|
| Wie lange soll das Spiel tragen? | **Dauerhaft, kein Endpunkt** |
| Wie soll sich Fortschritt anfuehlen? | **Zahlen wachsen immer weiter** |
| Wie viel Risiko beim Fliegen? | **Spuerbar, aber nie Totalverlust** |

Dazu die vier frueheren Grundsatzentscheidungen aus Session 3 (Ressourcen-Engpass ja,
Flottenwachstum ueber hoehere Belohnung statt geringere Verluste, Wrack-Bergung 30 %, Beute
proportional zur vernichteten Feindmacht) und die Rahmenbedingung Server-Reset (Abschnitt 1a).

**Diese sieben Vorgaben sind gesetzt und werden nicht neu diskutiert.** Alles andere in diesem Plan
ist verhandelbar.

### Zeitrahmen

Umsetzung fruehestens in rund 8 Wochen (Rueckkehr des Nutzers aus dem Urlaub). Bis dahin wird der
Plan wiederholt durchgesprochen und verfeinert. **In dieser Phase KEIN Code schreiben und KEINE
Spieldateien aendern** - ausschliesslich diesen Plan fortschreiben. Die Umsetzung erfolgt danach mit
Claude Code.

### Was in Folge-Chats noch besprochen werden kann

Bewusst offen gelassen, weil die Antwort von einer Messung abhaengt oder Geschmackssache ist:

1. **Beute-Exponent 0,85 gegen 0,90-0,95** - haengt am gemessenen Kipppunkt (Entscheidung 2).
2. **Feindstaerke-Variante (a)** - durch den Reset wieder technisch moeglich, aktuell aus einem
   ANDEREN Grund zurueckgestellt (Modulkosten-Kette, siehe Abschnitt 4). Kann neu aufgemacht
   werden, dann aber nur zusammen mit der Modulkosten-Senkung.
3. **Imperator-Einstufung** - Prestige-Einheit ist vorlaeufig, nicht belegt (Abschnitt 4).
4. **Startphasen-Kalibrierung** - Entscheidung 9 und 12 wirken gegenlaeufig und muessen gemeinsam
   gegen die 30-Tage-Simulation kalibriert werden (Abschnitt 1a, Block F).
5. **Solo-Stufen Niedrig/Mittel/Hoch** - ob nach Entscheidung 2 noch eine zusaetzliche
   Differenzierung noetig ist (Abschnitt 4).
6. **Booster-Preise** - erst nach Entscheidung 3 neu messen (Abschnitt 4).
7. **Raid verlierbar machen** - Schnappschuss der ersten Welle gegen Rueckzugsregel; Entscheidung 3
   und 10 wirken hier gegeneinander.
8. ~~Modulkosten~~ **ENTSCHIEDEN am 09.08.2026:** Zielwert 60-120 Tage Amortisation gegen die NEUE
   Baseline nach Block A, Faktor ergibt sich aus der Messung. Feindstaerke-Variante bleibt bei (b),
   wird nicht neu aufgemacht. Siehe Abschnitt 4. Damit ist auch der offene Punkt 2 geschlossen.
9. ~~Entscheidung 9.1: Untergrenze gegen Relation.~~ **ENTSCHIEDEN am 09.08.2026** (Nutzer hat die
   Entscheidung ausdruecklich delegiert): Saettigungskurve statt Untergrenze, alle Reduktionen
   additiv, Basis-Bauzeiten unveraendert. Vollstaendig in Entscheidung 9.1a-c, Endziel des Blocks
   in Entscheidung 9. Offen bleibt nur noch die **Messung** der sieben Gewichte und von
   `T_MAX_BASE`, nicht mehr die Bauform.
10. ~~30-Tage-Simulation vorziehen~~ **ENTSCHIEDEN am 09.08.2026:** vorgezogen auf Schritt 11a,
    also nach Block C und vor Block D. Spezifikation in Abschnitt 1b.
11. ~~Bot-Ertragsweg (a) gegen (b)~~ **ENTSCHIEDEN am 09.08.2026: Weg (b)** - virtueller Ertrag UND
    virtuelle Verlustrate aus der eigenen Flottenmacht, mit den Koeffizienten aus Entscheidung 2.
    Weg (a) (Bots fliegen echte Missionen) ist verworfen: jede geflogene Mission ist eine echte
    Kampf-Simulation im 2-Worker-Pool, genau die Last, die nach dem CPU-Vorfall gedrosselt wurde.
    Nachteil von (b) ausdruecklich akzeptiert: Bots haben eine unnatuerlich glatte Wachstumskurve
    ohne Zufallsausreisser.
12. ~~Entscheidung 3, "Bekannter Nachteil"~~ **ENTSCHIEDEN am 09.08.2026: gestrichen, mit
    Praezisierung.** Was durch den Reset entfaellt, ist das GEFUEHL der Wegnahme - niemand hat je
    10/6/2 gehabt. Der rechnerische Effekt bleibt bestehen: der Raid liefert nach der Halbierung
    weniger, gemessen an der neuen Baseline. Siehe Entscheidung 3.

**Damit sind alle Punkte geschlossen, die ohne Messung entscheidbar waren.** Offen bleiben nur noch
1, 3, 4, 5, 6 und 7 - jeder davon haengt an einer Messung, die erst nach Block A moeglich ist.

### Aenderungsprotokoll dieses Plans

Jede Aenderung hier eintragen, damit ueber mehrere Chats hinweg nachvollziehbar bleibt, WARUM etwas
so steht - insbesondere bei Entscheidungen, deren urspruengliche Begruendung spaeter entfallen ist.

| Datum | Aenderung |
|---|---|
| 09.08.2026 | Erstfassung. 11 Entscheidungen, 11 Reparaturen, Reihenfolge in 5 Bloecken, 13 Messregeln. |
| 09.08.2026 | Abschnitt 1a ergaenzt (Server-Reset als Rahmenbedingung), Entscheidung 12 (Frischling-Bonus) neu, Block F (Startphase) neu. Entscheidung 10 auf blockierend hochgestuft. Begruendung fuer Feindstaerke-Variante (b) ersetzt - die urspruengliche ("entwertet bestehende Investitionen") ist durch den Reset hinfaellig. |
| 09.08.2026 | Vier weitere offene Punkte entschieden: 30-Tage-Simulation vorgezogen (neuer Schritt 11a, vor Block D), Bot-Ertragsweg (b) bestaetigt, Nachteil bei Entscheidung 3 gestrichen und praezisiert, Modulkosten als ZIELWERT statt als Faktor festgelegt (60-120 Tage Amortisation gegen die neue Baseline) - damit ist auch die Feindstaerke-Variante endgueltig auf (b) geschlossen. Neu: **Abschnitt 1b, vollstaendige Spezifikation der 30-Tage-Simulation** mit drei Spielerprofilen, sieben Protokoll-Kennzahlen und sechs Abnahmekriterien. Damit sind alle ohne Messung entscheidbaren Punkte geschlossen. |
| 09.08.2026 | **Entscheidung 9.1 entschieden** (Nutzer hat die Entscheidung delegiert): Untergrenze verworfen, ersetzt durch Saettigungskurve (9.1a), additive statt multiplikativer Reduktionen (9.1b), Basis-Bauzeiten unveraendert (9.1c). Grund: eine feste Untergrenze deckelt die Bremse, nicht das unbegrenzte Wachstum der Rohzeit - sie verschiebt die Mauer nur. Zweiter Grund: sechs multiplikativ gestapelte Reduktionsquellen ergeben bei Vollausbau ~0,002, dieselbe Fehlerform wie beim Frischling-Bonus. Neu: **Endziel fuer den gesamten Zeit-Umbau** in Entscheidung 9 ("Zeit ist konstante Reibung, Kosten sind der Wachstumsmotor"). Anwendungsbereich nach Kurvenart getrennt: Saettigung nur fuer Gebaeude, Untergrenze genuegt bei Forschung (Stufe 10 gedeckelt) und Schiffen (linear in der Stueckzahl). |
| 09.08.2026 | Entscheidung 13 (KI-Bots/Piratenbasen) und Entscheidung 14 (Gebaeude-Module V2/V3) neu. Punkt 7.5 aus Entscheidung 7 herausgeloest - die Allianz-Station ist nachweislich NICHT betroffen (Generator ueber alle drei Stufen), die Luecke liegt allein in der handgetippten `buildingModules.ts` der Heimatbasis. Entscheidung 5 um 5a (`SEED_FLEET`-Boden muss nach dem Reset mitfallen) und 5b (Messblocker durch 13.3) ergaenzt. R12 (Startpruefung Modul-IDs) neu. Reihenfolge in Abschnitt 5 neu durchnummeriert. Offene Punkte 9-12 in Abschnitt 8 ergaenzt (9.1-Untergrenze, Vorziehen der 30-Tage-Simulation, Bot-Ertragsweg, Nachteil bei Entscheidung 3) - alle vier sind VORSCHLAEGE, nicht entschieden. |
| 09.08.2026 | Imperator-Absatz in Abschnitt 4 von einer Feststellung zu einem Messauftrag umgebaut. Grund: Nutzerrueckfrage deckte auf, dass der Imperator in KEINER der vier Sessions im Kampf gemessen wurde - die Einstufung "schlechteste Einheit" stammt aus reiner Tabellenrechnung. Baulimit-Widerspruch (README 2 gegen Session 3 mit 6) vermerkt. |

### Methodische Lehre aus dem bisherigen Verlauf

Die Checkliste enthaelt zwei Arten von Aussagen, die sich sprachlich nicht unterscheiden:

- **Gemessen** (Sektoren, Raids, Elite-Serien, Duelle, Admiral-Serien) - belastbar, Stichproben
  stehen in der Methodik des jeweiligen Session-Abschnitts.
- **Gerechnet** (Kosten, Wert je Machtpunkt, Amortisationen, Erwartungswerte) - plausibel, aber
  ohne Kampfsimulation dahinter.

**Bei jeder absolut klingenden Einzelaussage pruefen, in welche Kategorie sie faellt.** Der
Imperator-Fall (siehe Protokoll) ist das Beispiel: ein sehr starkes Urteil auf reiner
Tabellenbasis, ueber eine Einheit, die aus beiden Messreihen ausgelassen wurde.
