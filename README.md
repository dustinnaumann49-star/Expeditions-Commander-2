# Expeditions-Commander

React + Node/Express Backend, SQLite-Datenbank. Deployment auf Render.com über `render.yaml`.

## Dateistruktur

```
render.yaml                          Render.com Blueprint (Server + Client als zwei Services)

server/
  .env.example                       Vorlage für lokale .env (JWT_SECRET, PORT, CLIENT_ORIGIN)
  package.json                       "dev" startet tsc --watch + tsx watch parallel (siehe unten)
  data/                              SQLite-Datenbankdatei liegt hier zur Laufzeit (game.db)

  src/index.ts                       Express-Einstiegspunkt, Routen-Registrierung

  src/db.ts                          SQLite-Zugriff: Nutzer, Spielstände, gemeinsame Operationen

  src/auth/middleware.ts             JWT-Prüfung für geschützte Routen
  src/auth/routes.ts                 Registrierung/Login

  src/game/types.ts                  Alle zentralen TypeScript-Typen (PlayerState, Mission,
                                      GroupOperation, CombatResult, CombatUnitResult, usw.)
  src/game/state.ts                  Default-Spielzustand, Laden/Speichern eines Spielers
  src/game/actions.ts                tick() (Warteschlangen abarbeiten), Bauen/Forschen starten
  src/game/routes.ts                 ALLE API-Endpunkte (/api/game/*) - zentrale Übersicht

  src/game/combat.ts                 Reine Kampf-Simulation (resolveCombat, RapidFire,
                                      Zielerfassung, Präzision, Schild-Regeneration,
                                      Mehrspieler-Variante resolveCombatMultiOwner)
  src/game/combat.worker.ts          Worker-Thread-Skript - führt combat.ts in einem separaten
                                      Node-Thread aus (siehe "Wichtige Punkte" unten)
  src/game/combatRunner.ts           Startet combat.worker.ts, reicht Ergebnis zurück

  src/game/missions.ts               Solo-Missionen: Flotte entsenden, stündlicher Check, Rückkehr
  src/game/events.ts                 Solo-Notruf-Events
  src/game/raids.ts                  Basis-Raids (inkl. Einbindung von Verstärkungen)
  src/game/raidReinforce.ts          Liste aktiver Raids, Verstärkung entsenden
  src/game/groupOps.ts               GESAMTE Multiplayer-Logik: gemeinsame Expeditionen/Events,
                                      Einladen/Beitreten/Starten, Belohnungsvergabe

  src/game/inventory.ts              Container öffnen, Belohnungen einlösen
  src/game/economyActions.ts         Händler-Tausch, Schrotthändler, Shop (Booster/Gutscheine)
  src/game/presets.ts                Flotten-Vorlagen speichern/löschen
  src/game/simulator.ts              Kampfsimulator: rechnet mehrere Durchläufe gegen einen
                                      Sektor durch, OHNE den Spielstand zu verändern
  src/game/messages.ts               pushMessage()/clearMessages() - Nachrichten-Verlauf

  src/game/data/ships.ts             Alle Schiffsdaten (Werte, Kosten, Bauzeit, Lore)
  src/game/data/defenses.ts          Alle Verteidigungsanlagen-Daten
  src/game/data/research.ts          Alle Forschungen (Effekt pro Stufe, Kosten, Zeit)
  src/game/data/sectors.ts           SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL
                                      (inkl. piraten_elite = Multiplayer-Sektor)
  src/game/data/economy.ts           Booster, Gutscheine, Container, NPC-Spezial-Einheiten,
                                      Event-/Raid-/Asteroiden-Konstanten
  src/game/data/combatConstants.ts   RAPIDFIRE-Tabelle, ZIELERFASSUNG_BASE, MAX_*-Konstanten

client/
  vite.config.ts                     Dev-Proxy: /api → localhost:4000
  src/theme.css                      Komplettes Farbschema/Layout (aus dem HTML-Original)
  src/App.tsx                        Routing + Navigation (alle Seiten-Links)
  src/main.tsx                       React-Einstiegspunkt, bindet theme.css ein

  src/context/AuthContext.tsx        Login-Zustand, Token-Verwaltung
  src/context/GameContext.tsx        Lädt Spieldaten/-zustand, stellt ALLE Spielaktionen bereit
  src/api/client.ts                  Alle fetch()-Aufrufe an den Server, ein Objekt "api"
  src/types/game.ts                  Client-seitige Typen (Spiegel von server/src/game/types.ts)

  src/lib/serverTime.ts              Server-Zeit-Offset (serverNow() statt Date.now())
  src/lib/format.ts                  formatTime() - Wochen/Tage/Stunden/Minuten/Sekunden
  src/lib/combatInfo.ts              RapidFire-Anzeige, Zielerfassung/Präzision/Schild-Regen-
                                      Berechnung für die UI (Kampf-Werte-Anzeige)
  src/lib/multipliers.ts             Bauzeit-/Forschungszeit-Multiplikator (Forschung + Booster)
                                      MUSS bei jeder Zeit-Anzeige verwendet werden, siehe unten

  src/components/ResourceBar.tsx     Kopfleiste: Ressourcen, Uhr, Abmelden
  src/components/BuildQueue.tsx      Fortschrittsbalken für Bau-Warteschlangen (Lane-basiert)
  src/components/LoreModal.tsx       Popup bei Klick auf Schiffs-/Verteidigungs-/Forschungsnamen
  src/components/CombatReplayView.tsx  Animierte Canvas-Visualisierung des echten Kampfverlaufs
                                      (Laser, Explosionen, Runde für Runde abspielbar)
  src/components/ProtectedRoute.tsx  Leitet zu /login um, falls nicht angemeldet

  src/pages/Login.tsx                 Login/Registrierung
  src/pages/Werft.tsx                 Schiffe bauen
  src/pages/Verteidigung.tsx          Verteidigungsanlagen bauen
  src/pages/Forschung.tsx             Forschung
  src/pages/Sektor.tsx                Solo-Missionen + Untertab "Kampfsimulator"
                                      (Asteroiden-Feld / Piraten-Sektor / Simulator)
  src/pages/Simulator.tsx             Kampfsimulator-Ansicht (kein eigener Nav-Punkt, nur als
                                      Untertab von Sektor eingebunden)
  src/pages/Flotte.tsx                Flotten-Bestandsübersicht
  src/pages/Haendler.tsx              Ressourcentausch + Untertab "Schrotthändler"
                                      (rendert Schrotthaendler.tsx als Untertab-Inhalt)
  src/pages/Schrotthaendler.tsx       Schiffe/Verteidigung verschrotten (kein eigener Nav-Punkt
                                      mehr, nur als Untertab von Händler eingebunden)
  src/pages/Shop.tsx                  Booster/Zeit-Gutscheine + Untertab "Spezialteile"
                                      (rendert Spezialteile.tsx als Untertab-Inhalt)
  src/pages/Spezialteile.tsx          Imperator bauen (kein eigener Nav-Punkt mehr, nur als
                                      Untertab von Shop eingebunden)
  src/pages/Multiplayer.tsx           Gemeinsame Expeditionen/Events + Untertabs "Raid-Hilfe"
                                      (rendert RaidHilfe.tsx) und "Spieler" (Online/Offline-Liste)
  src/pages/RaidHilfe.tsx             Alle aktiven Raids anderer Spieler, Verstärkung entsenden
                                      (kein eigener Nav-Punkt mehr, nur als Untertab von
                                      Multiplayer eingebunden)
  src/pages/Nachrichten.tsx           Kampf-/Farmberichte mit aufklappbarer Detailansicht
  src/pages/Inventar.tsx              Container öffnen, Belohnungen einlösen
```

## Wichtige Punkte, die eingehalten werden müssen

1. **Jede neue Zeit-Anzeige im Frontend MUSS `multipliers.ts` verwenden** (`getBauzeitMultiplier`,
   `getForschungszeitMultiplier`). Wird das vergessen, zeigt die UI falsche Bauzeiten/Forschungszeiten,
   sobald Forschung oder Booster aktiv sind - das ist bereits einmal passiert.

2. **Jede neue Kampf-Berechnung MUSS über `combatRunner.ts` laufen** (`runCombatInWorker` für
   Einzelspieler, `runMultiOwnerCombatInWorker` für Mehrspieler-Situationen), niemals `resolveCombat`
   direkt im Haupt-Thread aufrufen. Grund: verhindert, dass ein großer Kampf den Server für andere
   Spieler blockiert.

3. **An `OwnedFleetContribution`-Objekte (Mehrspieler-Kampf) dürfen NIEMALS Funktionen übergeben
   werden** (z.B. `statsFn`) - nur reine Forschungsdaten (`research`, `defenseCounts`,
   `useAllyStats`). Funktionen lassen sich nicht an einen Worker-Thread übergeben (siehe
   `combat.worker.ts`/`combatRunner.ts`). Das hat bereits einmal zu einem stillen Fehler geführt.

4. **Bei Mehrspieler-Aktionen, die während des eigenen `tick()` ausgelöst werden
   (`processGroupOperationsForUser` in `groupOps.ts`): das bereits geladene `PlayerState`-Objekt des
   aktuellen Nutzers wiederverwenden, NIEMALS erneut aus der Datenbank laden.** Sonst überschreibt
   die äußere Route (`routes.ts`) das Ergebnis am Ende mit einer veralteten Kopie. Erkennbar am
   Muster `p.userId === currentState.userId ? currentState : loadPlayerState(p.userId)`.

5. **Mehrspieler-Belohnungen werden NIE geteilt.** Jeder Teilnehmer bekommt exakt das, was er auch
   bei einem Solo-Flug mit demselben Kampfausgang bekommen hätte (volle Beute, volle Teile, eigener
   Container). Keine prozentuale Aufteilung nach Flottenstärke o.ä.

6. **Jeder Mehrspieler-Kampfbericht muss aufklappbar sein** (volle `CombatDetail`-Struktur wie im
   Solo-Spiel), mit Flotten-Auflistung gruppiert nach Spielername (`ownerUsername`-Feld in
   `CombatUnitResult`, Gruppierung passiert client-seitig in `Nachrichten.tsx`).

7. **Sektor P9 – Elite-Bollwerk (`piraten_elite`) ist die einzige Mission für gemeinsame
   Expeditionen.** Alle anderen Piraten-Sektoren bleiben Solo (`missions.ts` lehnt
   `multiplayerOnly`-Sektoren für Solo-Versand ab, `groupOps.ts` erlaubt nur `piraten_elite` für
   `kind: 'expedition'`).

8. **Nur noch drei Einheiten haben ein hartes Bau-Maximum:** Sandronator (1), Imperator (2), die
   beiden Schildkuppeln (20/10). Alle anderen Schiffe/Verteidigungsanlagen sind absichtlich
   unbegrenzt - das ist kein Bug, sondern Voraussetzung für große Mehrspieler-Flotten (siehe Punkt 2
   zur Absicherung gegen Performance-Probleme).

9. **Lokale Entwicklung (`npm run dev` im Server) startet automatisch zwei Prozesse**
   (`tsc --watch` + `tsx watch`). Grund: der Worker-Thread (Punkt 2) braucht immer die fertig
   kompilierte Version aus `dist/`, auch während der Entwicklung - `tsc --watch` hält `dist/`
   automatisch aktuell. Ohne diesen zweiten Prozess schlägt jede Kampf-Berechnung im Dev-Modus fehl.

10. **Neue Server-Routen gehören in `routes.ts`**, neue Client-API-Aufrufe in `api/client.ts` +
    `context/GameContext.tsx` (Pattern: `run(() => api.xyz(...))` für zustandsverändernde
    Aktionen). Neue Seiten müssen in `App.tsx` (Route + Navigationspunkt) eingetragen werden.

11. **Sidebar bewusst schlank gehalten**: Schrotthändler, Spezialteile und Raid-Hilfe haben
    KEINEN eigenen Navigationspunkt mehr, sondern sind Untertabs von Händler, Shop bzw.
    Multiplayer. Beim Hinzufügen neuer Seiten erst prüfen, ob sie sich als Untertab in eine
    bestehende Seite einordnen lassen, bevor ein neuer Sidebar-Eintrag angelegt wird.

12. **Online/Offline-Status**: `requireAuth`-Middleware aktualisiert bei JEDER authentifizierten
    Anfrage automatisch `last_seen` in der `users`-Tabelle (`touchUserLastSeen`). "Online" heißt:
    letzte Anfrage vor weniger als 15 Sekunden (`ONLINE_THRESHOLD_MS` in `db.ts`). Registrierung
    allein zählt nicht als "online" - erst die erste authentifizierte Anfrage danach.

13. **Raid und Notruf-Event laufen an vier festen Server-Zeitpunkten** (00/06/12/18 Uhr UTC,
    `FIXED_CHECK_HOURS_UTC` in `economy.ts`), nicht mehr in zufälligen Intervallen. Raid: 60%
    Chance, skaliert exakt mit 100% der eigenen Flotten+Verteidigungs-Power (keine Zufalls-
    Schwankung mehr). Notruf-Event: 40% Chance, skaliert exakt mit 100% der eingesetzten
    Flotten-Power. Gemeinsame Nutzung von `nextFixedCheckpoint()` in `economy.ts` - beim Ändern
    der Zeitpunkte nur dort anpassen, betrifft automatisch beide Systeme.

14. **Info-Popups statt vollgepackter Karten**: Werft/Verteidigung zeigen auf der Karte nur
    Kernwerte (Bestand, Stats, Kosten, Bauzeit) - alles Kampf-Detailwissen (RapidFire,
    Zielerfassung, Präzision, Schild-Regeneration, Limits) steckt hinter einem "ℹ️ Info"-Button
    in einem `InfoModal` (`components/InfoModal.tsx`). Sektor-Karten funktionieren genauso mit der
    (exportierten) `SektorInfoBox` aus `Sektor.tsx`, die auch in `Multiplayer.tsx` für die
    Elite-Bollwerk-Karte wiederverwendet wird. Neue Karten-Seiten sollten diesem Muster folgen
    statt alle Details direkt auf der Karte auszubreiten.

15. **Schildkuppeln: gemeinsamer Pool statt Pro-Einheit-Verteilung.** Kleine/Große Schildkuppel
    sind jetzt auf jeweils 1 Exemplar begrenzt (`maxCount:1` in `defenses.ts`). Ihr Schildwert wird
    NICHT mehr auf einzelne Verteidigungsanlagen verteilt (das verwässerte sich bei vielen Anlagen
    bis zur Bedeutungslosigkeit), sondern bildet einen gemeinsamen Puffer
    (`computeDomeSharedPool()` in `combat.ts`), der Schaden für die GESAMTE Verteidigungsseite
    abfängt, bevor eine einzelne Anlage getroffen wird (`runRounds()`/`fireShots()` mit
    `sharedShieldPoolA`-Parameter, wird durch den Worker durchgereicht). Der Pool regeneriert sich
    wie normaler Schild zwischen den Runden. Getestet: Pool absorbiert Schaden vollständig, solange
    er nicht erschöpft ist, verteilte insgesamt nie mehr Schild, als die Kuppeln tatsächlich besitzen
    (im Gegensatz zu einem zuvor erwogenen, aber verworfenen "gedeckelten Divisor"-Ansatz, der
    Schild-HP aus dem Nichts erzeugt hätte).

16. **Kampf-Statistiken (Schaden/Schild absorbiert/Schild regeneriert/Schüsse/Treffer/RapidFire)
    MÜSSEN besitzer-bewusst indiziert werden, nicht nur nach Schiffstyp.** `dmgTakenA`,
    `shieldDmgTakenA`, `shieldRegenA`, `shotsA.*` werden bei Mehrspieler-Kämpfen intern mit dem
    Schlüssel `` `${ownerKey}:${typeId}` `` statt nur `typeId` geführt (`statKey()`-Hilfsfunktion in
    `combat.ts`). Grund: Zwei Teilnehmer mit demselben Schiffstyp (z.B. beide "kreuzer") hätten
    sonst exakt dieselben aggregierten Werte angezeigt bekommen, unabhängig von ihrer tatsächlichen
    Stückzahl - genau das ist einmal passiert und wurde erst durch einen echten Mehrspieler-Test
    entdeckt (identische Zahlen bei 200 vs. 20 eingesetzten Schiffen). Jede neue Stelle, die
    `result.dmgTakenA[id]` o.ä. ausliest, muss bei Mehrspieler-Kontext den zusammengesetzten
    Schlüssel verwenden, nicht nur `id`.

17. **Verteidigungsanlagen-Waffenwerte sind an die Kosteneffizienz der Schiffe gekoppelt**
    (`defenses.ts`), Zielwert ca. 65 Kosten pro Waffenpunkt (Schiffe liegen bei ~57-90). Das war
    zuvor NICHT der Fall (bis zu 2,50 Kosten/Waffenpunkt bei einzelnen Anlagen) - Verteidigung war
    dadurch sowohl als eigene Bauoption als auch als Bestandteil generierter Piraten-/Raid-Flotten
    (`generateDefenseFleet`) unverhältnismäßig stark, teils stärker als der Imperator. Bei künftigen
    Balance-Änderungen an einzelnen Verteidigungswerten diese Kosten/Waffen-Relation zu den Schiffen
    im Auge behalten, statt Werte isoliert zu ändern.

18. **Rückzugs-Mechanismus (`RETREAT_THRESHOLD = 0.5` in `runRounds()`, `combat.ts`):** Seite A
    (Spieler-Flotte, inkl. Verteidigungsanlagen) zieht sich automatisch zurück, sobald ihre
    verbliebene Einheitenzahl auf 50% der Startzahl faellt - statt bis zur vollstaendigen
    Vernichtung weiterzukaempfen. Grund: Attritions-Kampfsysteme wie dieses neigen zu
    selbstverstaerkenden Alles-oder-Nichts-Ausgaengen (kleiner Vorteil/Nachteil kippt ueber viele
    Runden zu Totalsieg/Totalverlust) - getestet an einem 150%-Feindstaerke-Szenario: ohne
    Rueckzug 0/100 Ueberlebende, mit Rueckzug 47/100. Das `retreated: boolean`-Feld im
    `CombatResult` muss bei neuen Ausgangs-Texten beruecksichtigt werden (siehe die
    `result.retreated ? ... : ...`-Verzweigungen in `missions.ts`/`raids.ts`/`events.ts`/
    `groupOps.ts`), sonst zeigt die Nachricht einen falschen/irrefuehrenden Ausgang an.

19. **Die vier "ungeskalierten" Kampf-Forschungen sind der wichtigste Hebel gegen Piraten-Sektoren
    ueber 100% Skalierung** (Praezision, Zielerfassung, Durchschlag, Schild-Regeneration) - sie
    fliessen NICHT in die Berechnung der Feindstaerke ein (die orientiert sich nur an Waffen/
    Schild/Panzerung), wirken aber im Kampf voll. Getestet: bei 150% Feindstaerke kippt das
    Ergebnis erst bei komplett ausgebauter Stufe 10 von Verlust zu Sieg (Stufe 5 bringt noch fast
    nichts) - Spieler, die schwere Piraten-Sektoren angehen wollen, sollten gezielt in diese vier
    Techs investieren, nicht in Waffen/Schild/Panzerung.

20. **Mining-Raten der Asteroiden-Felder** (`farmRate` in `sectors.ts`): Niedrig=5000,
    Mittel=15000, Hoch=25000 pro Schiff und Stunde (bewusst grosszuegig fuer Spieler mit wenig
    Spielzeit - kein PvP, daher unproblematisch). Plünderungs-Beute der Piraten-Sektoren
    (`lootBase`) blieb bewusst unveraendert, nur das Mining wurde angehoben.

21. **Imperator-Werte auf 3x Reaper angehoben** (`ships.ts`): Waffen 50.400, Schild 12.600,
    Panzerung 2.520.000 (vorher 40.000/10.000/400.000 - die Panzerung lag davor sogar UNTER dem
    Reaper trotz ~11 Tage Grind-Aufwand fuer 1.000 Teile einer Kategorie). Bau-Limit bleibt
    bewusst bei 2 - macht bei dem Zeitaufwand pro Exemplar auch weiterhin Sinn. Spezialteile.tsx
    hatte als einzige Bau-Seite noch KEIN Info-Popup (RapidFire/Zielerfassung/Praezision/
    Schild-Regeneration) - jetzt nachgezogen, damit alle Bau-Seiten demselben Muster folgen.

22. **Asteroiden-Eskorte sammelt Skirmishes statt sofort zu melden** (`mission.skirmishLog` in
    `types.ts`, gefuellt in `runAsteroidEscortCheck`, `missions.ts`): Frueher kam pro Stunden-Check
    sofort eine eigene Kampf-Nachricht rein (bis zu 4 pro Mission, zusaetzlich zum
    Rueckkehr-Bericht) - bei mehreren gleichzeitig laufenden Asteroiden-Missionen ueberfuellte das
    den Nachrichten-Tab schnell. Jetzt wird jeder Stunden-Kontakt nur intern in
    `mission.skirmishLog` gesammelt (keine Nachricht), und `finalizeMission`/
    `abortMissionDestroyed` bauen daraus EINEN gemeinsamen Farm-Bericht mit allen Kaempfen als
    aufklappbare Unterabschnitte (`FarmDetail.skirmishes`, gerendert in `Nachrichten.tsx`).
    Getestet: 4h-Mission mit mehreren Piratenkontakten erzeugt jetzt genau 1 Nachricht statt bis zu
    5, alle Kampfdetails bleiben trotzdem vollstaendig einsehbar.

23. **Asteroiden-Felder laufen 12h statt 4h** (`ASTEROID_MISSION_DURATION_MS` in `economy.ts`),
    Piraten-Sektoren (Solo UND Elite-Bollwerk-Expeditionen) bleiben bei 4h - bewusst
    unterschiedliche Dauer je Sektor-Typ. Betrifft mehrere Stellen, die vorher eine hartcodierte
    "4 Stunden"-Annahme hatten und jetzt dynamisch anhand der tatsaechlichen Missionsdauer
    rechnen: `tickMission()`s Stunden-Obergrenze (`maxHours`), die DM-Akkumulationsrate
    (`accrueFarming`), und der Skirmish-Zusammenfassungstext. Bei zukuenftigen Aenderungen an
    Sektor-Laufzeiten IMMER nach hartcodierten "4"/"MISSION_DURATION_MS"-Stellen suchen, die
    eigentlich sektor-typ-abhaengig sein muessten - genau das war hier mehrfach der Fall.

24. **Drei neue Spezialschiffe mit Mehrfachziel-Salve** (`ships.ts`): Salvenjäger (Jäger-Klasse,
    deckt leicht/schwer ab), Salvenkreuzer (Kreuzer-Klasse, deckt kreuzer/schlachtschiff/bomber
    ab), Salvendreadnought (Elite-Klasse, deckt schlachtkreuzer/zerstoerer/reaper ab). Bei
    erfolgreicher Zielerfassung treffen sie NICHT nur eine zufaellige RF-anfaellige Einheit,
    sondern EINMAL JEDEN anfaelligen Schiffstyp, der gerade praesent ist (nicht jede Einzeleinheit
    - siehe `MULTI_TARGET_VOLLEY_SHIPS` in `combatConstants.ts`). Mechanisch umgesetzt in
    `combat.ts`s `fireShots()`: die Schadens-Kaskade wurde in eine wiederverwendbare
    `applyHitToTarget()`-Funktion ausgelagert, die sowohl fuer den normalen Einzelziel-Fall als
    auch fuer die Mehrfachziel-Salve (ein unabhaengiger Treffer/Verfehlen-Wurf PRO betroffenem Typ)
    genutzt wird. Getestet: 1 Salvenkreuzer traf in einer einzigen Runde kreuzer (268.200 Schaden),
    schlachtschiff (237.200) UND bomber (234.000) etwa gleich stark, waehrend nicht gelistete
    Typen (leicht: nur 14.700) kaum betroffen waren. Bewusst als "Glaskanone" ausgelegt: extrem
    hohe Waffen (Salvenjäger 9.000, Salvenkreuzer 32.000, Salvendreadnought 52.000 - übertrifft
    sogar den Imperator), dafür deutlich weniger Schild/Panzerung als vergleichbare Schiffe ihrer
    Klasse (z.B. Salvendreadnought nur 1/5 der Imperator-Panzerung). Sehr teuer (800k-4,5M+
    Ressourcen pro Stück) und mit maxCount 8-30 bewusst so bemessen, dass eine kleine Staffel bei
    grossen Flotten noch spuerbar mitwirkt, statt in tausenden Schiffen unterzugehen - der
    Ressourcenpreis selbst begrenzt den Vollausbau schon ausreichend (45-82 Mio. Ressourcen fuer
    das jeweilige Maximum). Neue Route/Feld
    `multiTargetVolleyShips` in `/game/data` noetig, damit das Frontend die Faehigkeit im
    Info-Popup (`Werft.tsx`) korrekt anzeigen kann - bei weiteren Spezialfaehigkeiten dieses Muster
    (Server-Konstante + expliziter Export ueber `/game/data` + Client-Info-Anzeige) wiederholen.
    Bilder liegen unter `ships/salvenjaeger.jpg`, `ships/salvenkreuzer.jpg`,
    `ships/salvendreadnought.jpg` (klein/komprimiert gehalten, ~60-70 KB statt der urspruenglich
    hochgeladenen 1,6-1,8 MB PNGs - wichtig fuer Mobil-Ladezeiten).

25. **Raids muessen bei JEDEM Nutzer-Tick auch fuer ANDERE Spieler geprueft werden, nicht nur fuer
    den eigenen.** Frueher loeste sich ein Raid nur auf, wenn der betroffene VERTEIDIGER selbst
    gerade online war (`processRaidTimer` lief nur fuer `state.userId` selbst). War der
    Verteidiger inaktiv, blieb ein laengst faelliger Raid fuer immer unaufgeloest stehen - auch
    wenn ein VERSTAERKER die ganze Zeit aktiv war, dessen Flotte blieb dadurch dauerhaft
    "unterwegs" haengen. Behoben durch `processOverdueRaidsForOtherUsers()` in `raids.ts`, das bei
    jedem `tick()` zusaetzlich ALLE anderen Spieler auf faellige, unaufgeloeste Raids prueft (bei
    2-5 Spielern performance-technisch unproblematisch). Dabei trat SOFORT dieselbe
    Doppel-Lade-Falle wie schon einmal bei den Gruppen-Operationen auf: `resolveRaid()` lud
    Verstaerker-Zustaende bedingungslos per `loadPlayerState(r.userId)` neu, auch wenn der
    Verstaerker zufaellig genau der Nutzer war, dessen eigener `tick()` gerade lief - dessen
    Ergebnis wurde dann von der aeusseren Route mit einer veralteten Kopie ueberschrieben. Fix:
    `resolveRaid(state, currentUserId?, currentUserState?)` nimmt jetzt optional den
    aufrufenden Nutzer entgegen und nutzt bei Uebereinstimmung dessen live-State-Objekt statt neu
    zu laden/speichern - exakt das Muster aus Punkt 4 in `groupOps.ts`. Bei JEDER neuen Funktion,
    die den State eines ANDEREN Nutzers laedt und veraendert, waehrend der eigene tick() eines
    Nutzers laeuft, IMMER pruefen: koennte der aktuell tickende Nutzer zufaellig einer der
    betroffenen "anderen" Nutzer sein? Wenn ja, live-Objekt durchreichen statt neu laden.

26. **Neue Spezialschiffe MÜSSEN explizit aus der Piraten-/NPC-Flottengenerierung ausgeschlossen
    werden**, sonst tauchen sie in generierten Feindflotten auf. `generatePiratenFleet()` und
    `generateFallbackFleet()` (`combat.ts`) filtern nur `specialOnly` (Imperator) und `unique`
    (Sandronator) heraus - die drei Salven-Schiffe hatten urspruenglich keines von beidem gesetzt
    und rutschten dadurch als ganz normale Piraten-/Notruf-Gegner mit in den Pool. Fix: beide
    Funktionen filtern jetzt zusaetzlich `MULTI_TARGET_VOLLEY_SHIPS` heraus. Bei jedem neuen
    Spezialschiff mit Baulimit IMMER pruefen, ob es (wie Imperator/Sandronator/jetzt auch die
    Salven-Schiffe) explizit aus `SHIPS.filter(...)` in `combat.ts` ausgeschlossen werden muss.

27. **Der Rückzugs-Mechanismus (Punkt 18) gilt NICHT für die Heimatverteidigung (Raids).** Neuer
    Parameter `allowRetreat` (Standard `true`) durchgereicht von `resolveCombat`/
    `resolveCombatMultiOwner` bis `runRounds()`; `raids.ts` setzt ihn explizit auf `false` bei
    beiden Kampf-Aufrufen. Grund: Man kann sich nicht aus der Verteidigung der eigenen Basis
    "zurueckziehen" - und da Verteidigungsanlagen oft viel schneller sterben als eine grosse
    Flotte, wuerde ein Rueckzug sonst die GESAMTE Streitmacht (Flotte + Verteidigung zusammen)
    vorzeitig abziehen, sobald die zahlenmaessig kleine, fragile Verteidigung unter 50% faellt -
    obwohl die eigentliche Flotte daneben noch laengst kampffaehig waere. Fuer Missionen/Events/
    Gruppen-Expeditionen (wo ein Rueckzug nach Hause thematisch sinnvoll ist) bleibt der
    Standardwert `true` unveraendert bestehen - kein Aenderungsbedarf an deren Aufrufen.

28. **Kampfsimulator (`simulator.ts`, Route `/game/simulate`) darf NIEMALS den Spielstand
    veraendern.** Bewusst NICHT ueber `handleAction()` gebaut (das ruft `tick()` und
    `savePlayerState()` auf) - stattdessen eine eigene Route, die den Zustand nur LESEND laedt
    (fuer die aktuelle Forschung). Nutzt exakt dieselbe Engine und NPC-Generierung wie der echte
    `runHourlyCheck()` (gewuerfelte Wellenstaerke, `npcFloor`, NPC-Verteidigungsanlagen,
    Piratenkapitaen-Chance), damit die Vorhersage aussagekraeftig ist. Rechnet MEHRERE Durchlaeufe
    (`MAX_RUNS`, Zeitbudget `TIME_BUDGET_MS`, mindestens `MIN_RUNS`) - ein einzelner Lauf waere
    wegen der Zufallsanteile irrefuehrend. Erlaubt bewusst auch Schiffe, die der Spieler noch gar
    nicht besitzt (Was-waere-wenn-Planung), daher KEINE Bestandspruefung. Gemessen: ~40ms (kleine
    Flotte) bis ~700ms (2600 Einheiten) pro Lauf.

29. **Rueckzug darf nicht ausgeloest werden, wenn der Kampf bereits gewonnen ist.** Faellt in
    DERSELBEN Runde der letzte Gegner UND die eigene Truppe unter die 50%-Schwelle, wurde frueher
    trotzdem `retreated = true` gesetzt - der Bericht meldete dann "Rueckzug nach hohen Verlusten",
    obwohl alle Feinde vernichtet waren. Fix: die Rueckzugsbedingung in `runRounds()` prueft jetzt
    zusaetzlich `unitsB.length > 0`. Aufgedeckt wurde das erst durch den Kampfsimulator (Punkt 28),
    weil dessen Statistik "Siegchance 25% + Rueckzugsrate 83% = 108%" auswies - ein gutes Beispiel
    dafuer, dass aggregierte Statistiken Logikfehler sichtbar machen, die in Einzelberichten
    untergehen.

30. **Kampf-Visualisierung basiert auf ECHTEN Rundendaten, nicht auf Interpolation.** `runRounds()`
    zeichnet pro Runde die Ueberlebenden je Schiffstyp auf (`CombatReplay` in `types.ts`) und legt
    sie im `CombatDetail` der Nachricht ab; `components/CombatReplayView.tsx` spielt das per Canvas
    ab (Laser-Salven, gestaffelte Explosionen, Play/Pause/Schritt/Geschwindigkeit). Bewusste
    Speicher-Entscheidungen, die bei Aenderungen erhalten bleiben sollten:
    - Format sind ZAHLEN-ARRAYS (`typesA`/`typesB` geben die Reihenfolge vor), nicht Objekte mit
      Schluesseln - gemessen 1,4 KB statt 6,1 KB pro Kampf (~4x kleiner).
    - Bei langen Kaempfen wird auf `MAX_SNAPSHOTS` (30) abgetastet, Start/Ende bleiben erhalten -
      so bleibt ein 100-Runden-Kampf genauso kompakt wie ein kurzer.
    - Real gemessen: ~1,3 KB pro grossem Kampf, ~260 KB pro Spieler bei vollen 200 Nachrichten.
    - `replay` ist OPTIONAL: alte Nachrichten ohne Replay funktionieren unveraendert weiter
      (`{msg.detail.replay && <CombatReplayView .../>}`), es gibt keine Migration.
    - Bei sehr grossen Flotten steht ein gezeichneter Punkt fuer mehrere Schiffe
      (`MAX_DOTS_PER_SIDE`), sonst waeren es unleserliche Pixelwolken.
    Eingebaut in ALLE vier Kampfarten (Solo-Missionen, Raids, Notruf-Events, Gruppen-Operationen)
    sowie in die gesammelten Asteroiden-Skirmishes.

31. **Praezision und Schild-Regeneration sind GROESSENABHAENGIG, nicht global**
    (`PRECISION_MODIFIER`, `SHIELD_REGEN_MODIFIER` in `combatConstants.ts`). Logik: kleine, wendige
    Schiffe kaempfen nah am Feind -> treffen besser (+15% beim Leichten Jaeger), haben aber zu wenig
    Energie fuer Schildaufladung (-12%). Grosse Schiffe feuern aus Distanz -> ungenauer (-15% beim
    Imperator), dafuer massive Energiereserven (+25% Schild-Regen). Verteidigungsanlagen haengen an
    der Basis-Energie -> EINHEITLICH +25% Schild-Regen, unabhaengig von ihrer Groesse; ihre
    Praezision variiert dagegen nach Geschuetzgroesse. `getPrecisionChance()`/`getShieldRegenRate()`
    nehmen jetzt eine optionale `typeId` entgegen - wird sie weggelassen, gibt es weiterhin den
    reinen Basiswert (z.B. fuer den Kuppel-Pool). Client spiegelt das in `combatInfo.ts`.

32. **Zwei neue Kampfwerte: Ausweichen und Kritische Treffer.** Ausweichen (`EVASION_BASE`,
    Forschung `ausweichen`) ist das Spiegelbild zur Praezision: kleine Schiffe entziehen sich
    Treffern (12% Basis beim Leichten Jaeger), Kapitalschiffe und unbewegliche
    Verteidigungsanlagen koennen es gar nicht (0). Kritische Treffer (`CRIT_CHANCE_BASE`,
    Forschung `kritischetreffer`) geben doppelten Schaden - grosse Schiffe treffen seltener,
    richten dafuer oefter verheerenden Schaden an (20% beim Imperator vs. 3% beim Leichten Jaeger).
    Trefferermittlung laeuft jetzt ueber `rollHit()`: erst Praezision des SCHUETZEN, dann Ausweichen
    des ZIELS. WICHTIG zur Forschungs-Zuordnung: `applyPlayerResearch` bezieht sich auf den
    SCHUETZEN - ist der Schuetze ein NPC (`false`), dann ist das Ziel zwangslaeufig eine
    Spieler-Einheit, deren Ausweich-Forschung dann angewendet werden muss (siehe `rollHit()`).
    Balance geprueft mit Duellen bei EXAKT gleicher Kampfkraft: es entsteht ein Schere-Stein-Papier
    (Jaeger schlagen Zerstoerer/Reaper, weil die kein RapidFire gegen Jaeger haben; Schlachtkreuzer
    und Imperator zerlegen Jaeger dank RapidFire wieder) - RapidFire ist damit das entscheidende
    Gegenmittel gegen Jaegerschwaerme.

33. **`loadPlayerState()` migriert fehlende Forschungsfelder automatisch** (`state.ts`). Der
    Abgleich laeuft ueber das `RESEARCH`-Array, deckt also ALLE aktuellen und kuenftigen
    Forschungen ab, ohne dass hier bei jeder neuen Forschung nachgezogen werden muss. Ohne das
    haetten bestehende Spielstaende `research.ausweichen === undefined` statt `0` - mit falschen
    Anzeigen und Rechenfehlern als Folge. Getestet: alter Stand ohne die neuen Felder wird korrekt
    ergaenzt, vorhandener Forschungsfortschritt bleibt dabei erhalten. Bei kuenftigen NEUEN
    Feldern (nicht Forschungen) im `PlayerState` hier ebenfalls eine Migrationszeile ergaenzen.

34. **Die drei Salvenschiffe (Punkt 24) waren zwar baubar, aber in KEINER Kampf-Situation
    einsetzbar** - eine reine Auflistungs-Luecke, kein Verhalten mit Absicht. Ursache:
    `COMBAT_SHIP_IDS` (`data/economy.ts`) definiert, welche Schiffstypen ausserhalb von
    Asteroiden-Feldern ueberhaupt zur Auswahl stehen, wurde bei der Einfuehrung der Salvenschiffe
    nicht erweitert - und dieselbe Liste war zusaetzlich als Kopie in drei Client-Dateien
    hartkodiert. Betraf konkret: `missions.ts`s `availableFleetForSektor()` (Solo-Piraten-Sektor +
    Notsignal-Event serverseitig), `raids.ts`s `resolveRaid()` Zeile "homeShipIds" (Salvenschiffe
    im eigenen Hangar zaehlten NICHT zur Heimverteidigung gegen Raids, unabhaengig von Stueckzahl),
    sowie client-seitig `pages/Sektor.tsx` (Piraten-Sektor/Notsignal-Auswahl), `pages/Multiplayer.tsx`
    (Elite-Bollwerk-Expeditionen + Verstaerkung entsenden) und `pages/RaidHilfe.tsx` (Verstaerkung
    zu fremden Raids). Nur `pages/Simulator.tsx` hatte bereits eine eigene, korrekte Liste inkl.
    aller drei Salvenschiffe und war nicht betroffen. Fix: alle vier Vorkommen um `salvenjaeger`,
    `salvenkreuzer`, `salvendreadnought` ergaenzt. Die Piraten-/NPC-Sperre (Punkt 26,
    `MULTI_TARGET_VOLLEY_SHIPS`-Filter in `generatePiratenFleet()`/`generateFallbackFleet()`)
    ist davon unabhaengig und bleibt unveraendert bestehen - Spieler koennen die Schiffe jetzt
    ueberall einsetzen, Piraten/NPCs weiterhin nicht. Bei kuenftigen neuen Kampfschiffen IMMER
    pruefen, ob `COMBAT_SHIP_IDS` (zentral UND alle Client-Kopien) den neuen Typ enthaelt -
    Baubarkeit (`ships.ts`) und Einsetzbarkeit in Missionen/Events/Multiplayer/Heimverteidigung
    sind zwei getrennte Schalter, die beide gesetzt sein muessen.

35. **RF-Tabelle war ungleichmaessig gewachsen: zu viele Angreifer zielten auf `leicht`/`schwer`,
    waehrend andere Verteidigungs-RF-Eintraege wie zufaellig verteilt wirkten (nicht das
    urspruengliche, in Punkt 32 getestete Schere-Stein-Papier-Design).** Vor der Bereinigung hatten
    `leicht` 8 und `schwer` 7 verschiedene RF-Angreifer, gegenueber 3-5 bei allen anderen
    Schiffsklassen - Jaeger-Schwaerme hatten dadurch kaum noch eine realistische Ueberlebenschance.
    Zusaetzlich hatten `kreuzer`, `schlachtschiff` und `zerstoerer` RF gegen einzelne
    Verteidigungsanlagen (`raketenwerfer`/`leichteslaser`), obwohl das laut urspruenglichem Design
    (Punkt 24) ausschliesslich die Rolle des Bombers sein sollte. Bereinigt in
    `combatConstants.ts`, RAPIDFIRE-Tabelle, NUR fuer `leicht`, `schwer`, `kreuzer`,
    `schlachtschiff`, `schlachtkreuzer`, `zerstoerer`, `reaper` (Bomber, Imperator, die drei
    Salvenschiffe und alle Verteidigungsanlagen-eigenen RF-Eintraege bleiben bewusst unveraendert):
    - `kreuzer`: RF-Ziele auf `schwer` (4) reduziert - jedes Schiff soll wegen des
      Zielerfassungssystems mindestens ein RF-Ziel haben, aber `kreuzer` jagt nicht mehr `leicht`
      und keine Verteidigungsanlagen mehr.
    - `schlachtschiff`: nur noch RF gegen `kreuzer` (5, seine eigentliche Beute-Klasse eine Stufe
      unter sich) - RF gegen `schwer` und `leichteslaser` entfernt.
    - `zerstoerer`: RF gegen `leichteslaser` entfernt, `schlachtkreuzer` (2) und `bomber` (5)
      bleiben unveraendert (zielten ohnehin schon nicht auf Jaeger/Verteidigung).
    - `schwer` (RF nur gegen `leicht`, 3) und `schlachtkreuzer` (RF gegen
      `leicht`/`schwer`/`kreuzer`/`schlachtschiff`, unveraendert) bleiben wie zuvor - Letzterer ist
      bewusst der EINZIGE dedizierte Jaeger-/Mid-Tier-Zerleger unter den Schiffen.
    - `reaper` unveraendert (zielte schon vorher nur auf `zerstoerer`/`schlachtkreuzer`/`bomber`).
    Ergebnis: klare 1:1-Rollenverteilung statt Haeufung auf Jaeger - jede Klasse (ausser `leicht`
    selbst) hat jetzt genau eine oder zwei definierte "Beute"-Klassen eine Stufe unter sich, statt
    von mehreren Seiten gleichzeitig gejagt zu werden. Der client-seitige taktische Hinweistext in
    `Sektor.tsx` (statischer String, NICHT aus `gameData.rapidfire` generiert) musste manuell
    nachgezogen werden - im Gegensatz zu den Schiffskarten-Popups (`Werft.tsx`/`Verteidigung.tsx`/
    `Spezialteile.tsx`), die RF-Werte ueber `combatInfo.ts`s `getRapidFireDisplay()` dynamisch aus
    `gameData.rapidfire` lesen und sich automatisch aktualisieren.

36. **Rueckzugs-Schwelle (Punkt 18) war auf Stueckzahl statt Kampfkraft bezogen** -
    `unitsA.length / initialCountA <= RETREAT_THRESHOLD`. Eine Flotte aus vielen billigen Jaegern
    und wenigen teuren Kapitalschiffen zog sich dadurch faelschlich zurueck, sobald die
    zahlenmaessig dominanten (aber kampfkraftmaessig unbedeutenden) Jaeger gefallen waren, obwohl
    die eigentliche Staerke der Flotte (die ueberlebenden Kapitalschiffe) den Kampf noch haette
    gewinnen koennen. Umgestellt auf die Summe aus `waffen+schild+panzerung` ueber alle
    ueberlebenden Einheiten (`unitPower()`, dieselbe Definition wie `combatFleetPower()`/
    `homePower` in `raids.ts`), Schwelle bleibt unveraendert bei 50%. Betrifft nur die
    Berechnungsgrundlage, nicht das Verhalten an sich (weiterhin nur Seite A, nicht Seite B/NPCs;
    weiterhin `allowRetreat`-abhaengig, siehe Punkt 27; weiterhin kein Rueckzug bei bereits
    gewonnenem Kampf, siehe Punkt 29).
