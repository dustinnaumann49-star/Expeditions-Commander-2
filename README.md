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
  src/components/ProtectedRoute.tsx  Leitet zu /login um, falls nicht angemeldet

  src/pages/Login.tsx                 Login/Registrierung
  src/pages/Werft.tsx                 Schiffe bauen
  src/pages/Verteidigung.tsx          Verteidigungsanlagen bauen
  src/pages/Forschung.tsx             Forschung
  src/pages/Sektor.tsx                Solo-Missionen (Asteroiden-Feld/Piraten-Sektor-Tabs)
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
