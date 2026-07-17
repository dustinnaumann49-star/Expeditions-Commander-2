# Expeditions-Commander

React + Node/Express Backend, SQLite-Datenbank. Deployment auf Render.com über `render.yaml`.

## Dateistruktur

```
render.yaml                          Render.com Blueprint (Server + Client als zwei Services)

server/
  .env.example                       Vorlage für lokale .env (JWT_SECRET, PORT, CLIENT_ORIGIN)
  package.json                       "dev" startet tsc --watch + tsx watch parallel (siehe unten)
  data/                              SQLite-Datenbankdatei liegt hier zur Laufzeit (game.db)

  src/index.ts                       Express-Einstiegspunkt, Routen-Registrierung, startet
                                      zusaetzlich den internen Heartbeat-Timer (alle 2 Min.) und
                                      den oeffentlichen /api/heartbeat-Endpunkt (siehe unten)
  src/game/heartbeat.ts               runGlobalHeartbeat() - verarbeitet Missionen/Raids/Notruf-
                                      Events/Gruppen-Expeditionen fuer ALLE Nutzer unabhaengig
                                      von jedem Login (siehe "Wichtige Punkte" Punkt 13)

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
  src/game/stats.ts                  PlayerStats-Punkteberechnung (POINT_WEIGHTS,
                                      calculatePoints()) und Bestenliste (getLeaderboard())

  src/game/data/ships.ts             Alle Schiffsdaten (Werte, Kosten, Bauzeit, Lore)
  src/game/data/defenses.ts          Alle Verteidigungsanlagen-Daten
  src/game/data/research.ts          Alle Forschungen (Effekt pro Stufe, Kosten, Zeit)
  src/game/data/sectors.ts           SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL
                                      (inkl. piraten_elite = Multiplayer-Sektor)
  src/game/data/economy.ts           Booster, Gutscheine, Container, NPC-Spezial-Einheiten,
                                      Event-/Raid-/Asteroiden-Konstanten
  src/game/data/combatConstants.ts   RAPIDFIRE-Tabelle, ZIELERFASSUNG_BASE, MAX_*-Konstanten
  src/game/data/changelog.ts         CHANGELOG - spielerlesbare Update-Historie fuer die
                                      Im-Spiel-Updates-Seite (client/src/pages/Updates.tsx)

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
  src/components/CombatReplayView.tsx  UNGENUTZT seit Punkt 24 (Canvas-Kampfvisualisierung wurde
                                      aus dem Frontend entfernt) - Datei bleibt bestehen, falls die
                                      Anzeige spaeter wieder gewuenscht wird, keine Referenzen mehr
                                      im aktuellen Code
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
  src/pages/Updates.tsx               Spielerlesbare Update-Historie (aus gameData.changelog),
                                      neuester Eintrag zuerst
  src/pages/Statistik.tsx             Eigene Statistik-Aufschlüsselung + Bestenliste (Punkte)
                                      zwischen allen Spielern
```

## Wichtige Punkte, die eingehalten werden müssen

### Architektur-Grundregeln

1. **Jede neue Zeit-Anzeige im Frontend MUSS `multipliers.ts` verwenden** (`getBauzeitMultiplier`,
   `getForschungszeitMultiplier`), sonst zeigt die UI falsche Bauzeiten/Forschungszeiten, sobald
   Forschung oder Booster aktiv sind.

2. **Jede neue Kampf-Berechnung MUSS über `combatRunner.ts` laufen** (`runCombatInWorker` für
   Einzelspieler, `runMultiOwnerCombatInWorker` für Mehrspieler), niemals `resolveCombat` direkt im
   Haupt-Thread - verhindert, dass ein großer Kampf den Server für andere Spieler blockiert.

3. **An `OwnedFleetContribution`-Objekte (Mehrspieler-Kampf) dürfen NIEMALS Funktionen übergeben
   werden** (z.B. `statsFn`), nur reine Daten (`research`, `defenseCounts`, `useAllyStats`) -
   Funktionen lassen sich nicht an einen Worker-Thread übergeben.

4. **Bei Mehrspieler-/Cross-User-Aktionen, die während des eigenen `tick()` oder des globalen
   Heartbeats (siehe Punkt 13) laufen: das bereits geladene `PlayerState`-Objekt eines betroffenen
   Nutzers wiederverwenden, NIEMALS erneut aus der Datenbank laden, falls dieser Nutzer zufällig
   der gerade aktive/anker-Nutzer ist.** Muster: `p.userId === currentState.userId ? currentState
   : loadPlayerState(p.userId)`. Sonst überschreibt die äußere Route das Ergebnis am Ende mit einer
   veralteten Kopie (bereits mehrfach aufgetreten: Gruppen-Operationen, Raid-Auflösung/-Spawn,
   Notruf-Events - bei jeder NEUEN Funktion dieser Art prüfen).

5. **Mehrspieler-Belohnungen werden NIE geteilt.** Jeder Teilnehmer bekommt exakt das, was er auch
   bei einem Solo-Flug mit demselben Kampfausgang bekommen hätte (volle Beute, volle Teile, eigener
   Container) - keine Aufteilung nach Flottenstärke.

6. **Jeder Mehrspieler-Kampfbericht muss aufklappbar sein** (volle `CombatDetail`-Struktur wie im
   Solo-Spiel), Flotten-Auflistung gruppiert nach Spielername (`ownerUsername` in
   `CombatUnitResult`, Gruppierung client-seitig in `Nachrichten.tsx`).

7. **Sektor P9 – Elite-Bollwerk (`piraten_elite`) ist die einzige Mission für gemeinsame
   Expeditionen.** Alle anderen Piraten-Sektoren bleiben Solo.

8. **Lokale Entwicklung (`npm run dev` im Server) startet zwei Prozesse** (`tsc --watch` +
   `tsx watch`) - der Worker-Thread braucht immer die kompilierte Version aus `dist/`, auch im
   Dev-Modus. Ohne den zweiten Prozess schlägt jede Kampf-Berechnung fehl.

9. **Neue Server-Routen gehören in `routes.ts`**, neue Client-API-Aufrufe in `api/client.ts` +
   `context/GameContext.tsx` (Pattern: `run(() => api.xyz(...))`). Neue Seiten müssen in `App.tsx`
   (Route + Navigationspunkt) eingetragen werden.

10. **Sidebar bewusst schlank gehalten**: Schrotthändler, Spezialteile und Raid-Hilfe haben keinen
    eigenen Navigationspunkt, sondern sind Untertabs von Händler, Shop bzw. Multiplayer. Vor neuen
    Seiten erst prüfen, ob sie sich als Untertab einordnen lassen.

11. **Online/Offline-Status**: `requireAuth`-Middleware aktualisiert bei jeder authentifizierten
    Anfrage `last_seen` (`touchUserLastSeen`). "Online" = letzte Anfrage vor weniger als 15
    Sekunden (`ONLINE_THRESHOLD_MS` in `db.ts`). Registrierung allein zählt nicht als online.

12. **Info-Popups statt vollgepackter Karten**: Werft/Verteidigung/Sektor zeigen auf der Karte nur
    Kernwerte, alles Detailwissen steckt hinter einem "ℹ️ Info"-Button (`InfoModal`,
    `components/InfoModal.tsx`; Sektor nutzt die exportierte `SektorInfoBox` aus `Sektor.tsx`,
    auch in `Multiplayer.tsx` für Elite-Bollwerk wiederverwendet). Neue Karten-Seiten sollten
    diesem Muster folgen.

### Zeitgesteuerte Systeme (Raids, Notruf-Events, Multiplayer-Expeditionen)

13. **Der Server hat keinen eigenen Dauerprozess für Spiellogik - alles läuft über zwei Schienen:**
    `tick()` (bei jeder Nutzer-Anfrage, rechnet den EIGENEN Zustand seit `lastUpdate` hoch) und
    `runGlobalHeartbeat()` (`heartbeat.ts`, per `setInterval` alle 2 Minuten direkt in `index.ts`
    gestartet - funktioniert nur zuverlässig, WEIL der Render-Tarif den Prozess durchgehend laufen
    lässt statt ihn bei Inaktivität einzuschläfern; bei Ruecksstufung auf einen Tarif mit
    Einschlafen stattdessen `GET /api/heartbeat` extern anpingen lassen, z.B. cron-job.org).
    Fixe Checkpoints (00/06/12/18 Uhr UTC, `FIXED_CHECK_HOURS_UTC`/`nextFixedCheckpoint()` in
    `economy.ts`) werden per `rollFixedCheckpoints()` einzeln nachgeholt, wenn ein Spieler laenger
    offline war - nicht einfach uebersprungen. `tick()` verarbeitet zusaetzlich zum eigenen Zustand
    auch Raid-Spawn/-Aufloesung, Notruf-Events und alle laufenden Gruppen-Expeditionen fuer ALLE
    anderen Nutzer (`processOverdueRaidsForOtherUsers`, `processOverdueRaidSpawnsForOtherUsers`,
    `processOverdueEventsForOtherUsers`, `processAllDepartedGroupOperations` in `actions.ts`) -
    ein einziger aktiver Spieler reicht dadurch, damit das gesamte Spiel fuer alle weiterlaeuft.
    Bei JEDER neuen zeitgesteuerten Mechanik dieses Muster uebernehmen, sonst haengt sie fest,
    solange kein betroffener Nutzer selbst online ist.

14. **Globale Warn-Hinweise fuer Raid/Notruf/andere-Spieler-Raids sitzen in `ResourceBar.tsx`**
    (auf jeder Seite sichtbar, `.alert-badge`-Klasse mit `pulseGlow`-Animation), nicht nur auf der
    Sektor-/Multiplayer-Seite selbst. Klick fuehrt per `useNavigate()`/Query-Parameter
    (`/multiplayer?tab=raid`) direkt zum passenden Tab.

### Kampfsystem

15. **Feindstärke skaliert ausschließlich auf Basiswerten der Schiffe/Verteidigung, NIE auf
    Spieler-Forschung.** `combatFleetPowerBase()` (`combat.ts`) berechnet die Ziel-/Feindstärke für
    Piraten-Sektoren, Notruf-Events (solo + gemeinsam), Raids (Heimverteidigung) und Elite-Bollwerk
    ausschließlich aus `baseStats()`. Grund: Würde Feindstärke aus forschungs-angereicherten Werten
    berechnet, machte jede Stufe Waffen-/Schild-/Panzerungtechnik die Gegner automatisch genauso
    stark mit - die Forschung würde sich dadurch nicht lohnen. Piraten profitieren in KEINER Form
    von Spieler-Forschung, auch nicht anteilig. Sonderfall Schildkuppel-Pool: für die
    Feindstärke-Berechnung zählt der Pool OHNE Forschungsbonus (`computeDomeSharedPool(defense,
    {})`), für die tatsächliche Kampfberechnung weiterhin MIT voller Forschung - die Kuppel soll im
    echten Gefecht von Schildtechnik profitieren, nur die Gegnerstärke nicht. Die eigene
    Kampfleistung (`getEffectiveStats()`, `CombatUnitResult`-Anzeige) bleibt regulär voll
    forschungsabhängig - betroffen ist nur die Frage "wie stark ist der Gegner", nicht "wie stark
    bin ich". Bei jeder neuen Stelle, die Feindstärke/Zielstärke berechnet, `combatFleetPowerBase()`
    statt `combatFleetPower()` verwenden.

16. **Rückzugs-Mechanismus** (`RETREAT_THRESHOLD = 0.5`, `runRounds()` in `combat.ts`): Seite A
    (Spieler-Flotte inkl. Verteidigung) zieht sich zurück, sobald ihre verbliebene KAMPFKRAFT
    (`waffen+schild+panzerung` aller überlebenden Einheiten, nicht Stückzahl) auf 50% der
    Startkraft fällt - verhindert, dass Attritions-Kämpfe zu Alles-oder-Nichts-Ausgängen kippen.
    Gilt NICHT für Heimverteidigung (Raids, `allowRetreat:false`, da Verteidigungsanlagen sonst die
    ganze Streitmacht vorzeitig mit runterziehen würden) und wird NICHT ausgelöst, wenn im selben
    Zug bereits der letzte Gegner fällt (sonst falsche "Rückzug nach hohen Verlusten"-Meldung trotz
    Sieg). `retreated: boolean` im `CombatResult` muss bei neuen Ausgangstexten berücksichtigt
    werden (siehe `result.retreated ? ... : ...` in `missions.ts`/`raids.ts`/`events.ts`/
    `groupOps.ts`).

17. **RapidFire folgt einer bewussten 1:1-Rollenverteilung, keine Häufung auf einzelne Klassen.**
    Jede Schiffsklasse hat höchstens ein bis zwei definierte "Beute"-Klassen eine Stufe unter sich
    (`schwer`→`leicht`, `kreuzer`→`schwer`, `schlachtschiff`→`kreuzer`, `schlachtkreuzer`→`leicht`/
    `schwer`/`kreuzer`/`schlachtschiff` als einziger dedizierter Jäger-/Mid-Tier-Zerleger,
    `zerstoerer`→`schlachtkreuzer`/`bomber`, `reaper`→`zerstoerer`/`schlachtkreuzer`/`bomber`) -
    RAPIDFIRE-Tabelle in `combatConstants.ts`. Nur der **Bomber** hat RF gegen Verteidigungsanlagen
    (`raketenwerfer`/`leichteslaser`/etc.), der **Imperator** als Ausnahme gegen alles (Schiffe UND
    Verteidigung). Salvenschiffe (siehe Punkt 22) sind bewusst komplett RF-immun - kein Schiff/
    keine Verteidigung hat RF-Einträge gegen sie. Der taktische Hinweistext in `Sektor.tsx` ist ein
    statischer String (NICHT aus `gameData.rapidfire` generiert) und muss bei RF-Änderungen manuell
    nachgezogen werden - im Gegensatz zu den Schiffskarten-Popups, die über `combatInfo.ts`s
    `getRapidFireDisplay()` dynamisch aktualisieren.

18. **Verteidigungsanlagen-Waffenwerte sind an die Kosteneffizienz der Schiffe gekoppelt**
    (Zielwert ca. 65 Kosten/Waffenpunkt, Schiffe liegen bei ~57-90) - bei Balance-Änderungen diese
    Relation im Auge behalten statt Werte isoliert zu ändern.

19. **Schildkuppeln: gemeinsamer Pool statt Pro-Einheit-Verteilung.** Kleine/Große Schildkuppel
    (`maxCount:1` je) verteilen ihren Schildwert NICHT auf einzelne Anlagen, sondern bilden einen
    gemeinsamen Puffer (`computeDomeSharedPool()`), der Schaden für die GESAMTE Verteidigungsseite
    abfängt, bevor eine einzelne Anlage getroffen wird (`sharedShieldPoolA`-Parameter durch
    `runRounds()`/den Worker durchgereicht). Regeneriert sich wie normaler Schild zwischen Runden.

20. **Kampf-Statistiken MÜSSEN besitzer-bewusst indiziert werden, nicht nur nach Schiffstyp** - bei
    Mehrspieler-Kämpfen intern mit Schlüssel `` `${ownerKey}:${typeId}` `` statt nur `typeId`
    (`statKey()` in `combat.ts`). Sonst zeigen zwei Teilnehmer mit demselben Schiffstyp identische
    aggregierte Werte, unabhängig von ihrer tatsächlichen Stückzahl.

21. **Präzision und Schild-Regeneration sind größenabhängig** (`PRECISION_MODIFIER`,
    `SHIELD_REGEN_MODIFIER` in `combatConstants.ts`): kleine Schiffe treffen besser, laden aber
    schlechter Schild auf; große Schiffe umgekehrt. Verteidigungsanlagen: einheitlich +25%
    Schild-Regen, Präzision variiert nach Geschützgröße. Trefferermittlung über `rollHit()`: erst
    Präzision des Schützen, dann Ausweichen (`EVASION_BASE`) des Ziels. Kritische Treffer
    (`CRIT_CHANCE_BASE`) geben doppelten Schaden, große Schiffe seltener/verheerender als kleine.
    `applyPlayerResearch` bezieht sich immer auf den SCHÜTZEN.

22. **Drei Spezialschiffe mit Mehrfachziel-Salve** (`ships.ts`, `MULTI_TARGET_VOLLEY_SHIPS` in
    `combatConstants.ts`): Salvenjäger (Jäger-Klasse), Salvenkreuzer (Kreuzer-Klasse),
    Salvendreadnought (Elite-Klasse) - treffen bei erfolgreicher Zielerfassung NICHT nur eine
    zufällige Einheit, sondern einmal JEDEN anfälligen Schiffstyp, der gerade präsent ist
    (`applyHitToTarget()` in `fireShots()`). Bewusst als "Glaskanone" ausgelegt: extreme Waffenwerte
    (9.000/32.000/52.000 - übertrifft sogar den Imperator), aber deutlich weniger Schild/Panzerung
    als vergleichbare Klassen-Schiffe. RF-immun (Punkt 17). MÜSSEN explizit aus der Piraten-/NPC-
    Flottengenerierung ausgeschlossen werden (`generatePiratenFleet()`/`generateFallbackFleet()`
    filtern `MULTI_TARGET_VOLLEY_SHIPS`) - bei jedem neuen Spezialschiff mit Baulimit prüfen, ob
    dieser Ausschluss auch dafür gilt. Baulimit + Kosten bewusst gekoppelt (`maxCount` 60/30/16,
    Kosten 1,6M-1M-400k / 4M-3M-1,4M / 9M-7,6M-4M): mehr Stückzahl kostet überproportional mehr,
    damit die Gesamt-Kampfkraft am Cap nicht beliebig mitwächst. Baubarkeit (`ships.ts`) und
    Einsetzbarkeit in Missionen/Events/Multiplayer/Heimverteidigung (`COMBAT_SHIP_IDS` in
    `data/economy.ts` UND alle Client-Kopien in `Sektor.tsx`/`Multiplayer.tsx`/`RaidHilfe.tsx`)
    sind zwei getrennte Schalter, die bei jedem neuen Kampfschiff BEIDE gesetzt sein müssen.

23. **Kampfsimulator (`simulator.ts`, Route `/game/simulate`) darf NIEMALS den Spielstand
    verändern** - eigene Route statt `handleAction()`, lädt nur lesend. Nutzt exakt dieselbe Engine
    wie der echte Ablauf (inkl. `combatFleetPowerBase()`, Punkt 15), damit die Vorhersage
    aussagekräftig ist. Erlaubt auch noch nicht besessene Schiffe (Was-wäre-wenn-Planung), daher
    keine Bestandsprüfung. Rechnet mehrere Durchläufe (Zufallsanteile sonst irreführend).

24. **Kampfbericht-Rundendaten (`CombatReplay` in `types.ts`) werden weiterhin serverseitig
    aufgezeichnet, aber NICHT mehr im Frontend angezeigt** (die Canvas-Visualisierung wurde auf
    Wunsch entfernt, `components/CombatReplayView.tsx` bleibt als ungenutzte Datei bestehen). Reine
    Darstellungsentscheidung, keine Datenstruktur-Änderung - falls die Visualisierung später wieder
    gewünscht wird, sind die Daten noch da.

25. **`loadPlayerState()` migriert fehlende Forschungsfelder automatisch** (`state.ts`, über das
    `RESEARCH`-Array) - deckt alle aktuellen und künftigen Forschungen ab. Bei künftigen NEUEN
    Feldern (nicht Forschungen) im `PlayerState` hier ebenfalls eine Migrationszeile ergänzen.

### Sektoren, Missionen, Belohnungen

26. **Asteroiden-Felder laufen 12h, Piraten-Sektoren (Solo UND Elite-Bollwerk) 4h** - bewusst
    unterschiedlich je Sektor-Typ. Bei künftigen Laufzeit-Änderungen nach hartcodierten
    "4"-Annahmen suchen, die eigentlich sektor-typ-abhängig sein müssten.

27. **Asteroiden-Eskorte sammelt Piratenkontakte in `mission.skirmishLog` statt sofort zu melden** -
    `finalizeMission`/`abortMissionDestroyed` bauen daraus EINEN gemeinsamen Farm-Bericht mit allen
    Kämpfen als aufklappbare Unterabschnitte, statt bis zu 4 Einzel-Nachrichten pro Mission.

28. **Belohnungs-Container gibt es in drei Stufen** (`CONTAINER_TYPES` in `data/economy.ts`):
    Silber, Gold, und **Elite** (💎, `#c99bff`) - Elite ist exklusiv über den Piratenkapitän im
    Elite-Bollwerk erreichbar (`captainContainerTier:"elite"` in `sectors.ts`), NICHT über normale
    Piraten-Sektoren/Raids/Notruf-Events. Zentraler `ContainerTier`-Typ (`'silber' | 'gold' |
    'elite'`, `types.ts`) statt wiederholter Literal-Unions. Zusätzlich **Jackpot-Mechanik**
    (`JACKPOT_CHANCE`/`JACKPOT_REWARDS`): 5% Chance pro Container-Öffnung auf eine ZUSÄTZLICHE
    Bonus-Belohnung (nie als Ersatz für einen normalen Pick). Mehrspieler-Belohnungen bleiben strikt
    1:1 zum Solo-Äquivalent (Punkt 5) - deshalb bewusst KEIN zusätzlicher Abschluss-Container beim
    Elite-Bollwerk-Rückkehr, das gäbe es solo auch nicht.

29. **Mining-Raten** (`farmRate` in `sectors.ts`): Niedrig 5.000, Mittel 15.000, Hoch 25.000 pro
    Schiff/Stunde. Piraten-Sektoren skalieren wie in Punkt 15 beschrieben.

### Verzeichnis der Frontend-Konventionen

30. **`InfoTable`/`InfoModal`-Zeilen nutzen `.info-list`/`.info-list-row` statt roher Tabellen**
    (`theme.css`) - Label links gedimmt, Wert rechtsbündig, gleiche Optik wie `sektor-info-box`.
    Modal-Titel einheitlich über `.modal-title`-Klasse (`InfoModal.tsx` und `LoreModal.tsx`).

31. **Händler/Schrotthändler nutzen `ship-grid`/`ship-card` mit Bildern** wie Werft/Verteidigung/
    Shop, nicht die schlichteren `queue-box`-Listenzeilen. Ressourcentausch über anklickbare
    Icon-Chips (`ResourcePicker`) statt `<select>`-Dropdowns, mit Schnellwahl-Buttons (25%/50%/
    Alles).

32. **Rohe interne IDs/Enums nie direkt anzeigen** - Schiffs-IDs über `shipName()`
    (`combatInfo.ts`), Sektor-IDs über `gameData.sektoren`-Lookup, Status-Enums über eigene
    Label-Maps (z.B. `OP_STATUS_LABELS`/`PARTICIPANT_STATUS_LABELS` in `Multiplayer.tsx`) in
    lesbaren Text übersetzen.

33. **Wellen-Vielfalt gegen "man weiss schon, was einen erwartet": alle vier Missionsarten
    (Piraten-Sektor, Raid, Notruf-Event, Elite-Bollwerk) liefen vorher durch dieselben
    Generierungsfunktionen mit EINER festen, abfallenden Gewichtungskurve - nur die reine Staerke
    variierte, nie die FORM der Gegnerflotte.** Drei unabhaengige Bausteine, zentral in `combat.ts`/
    `combatConstants.ts` (nicht pro Aufrufstelle dupliziert):
    - **Zusammensetzungs-Profile** (`WaveProfile`: `schwarm`/`kampfgruppe`/`elitekader`,
      `pickWaveProfile()`): unterschiedliche Gewichtskurven ueber denselben Schiffs-Pool - Schwarm
      (viele billige Jaeger, bisherige Kurve), Kampfgruppe (gleichmaessig), Elitekader (wenige,
      teure Schiffe). `WAVE_PROFILE_WEIGHTS` je Kontext-Schluessel gewichtet die Wahrscheinlichkeit
      unterschiedlich (z.B. `piraten_niedrig` fast nur Schwarm, `piraten_hoch`/`piraten_elite`
      ueberwiegend Kampfgruppe/Elitekader). `generatePiratenFleet()`/`generateFallbackFleet()`
      nehmen jetzt einen optionalen `profile`-Parameter (Standard `'schwarm'` fuer
      Abwaertskompatibilitaet).
    - **Wellen-Ausreisser** (`rollMultiplierWithOutlier()`): zusaetzlich zur normalen 3-Werte-
      Tabelle (`PIRATEN_MULTIPLIER_ROLL`) eine kontextabhaengige Chance (`WAVE_OUTLIER_CHANCE`) auf
      einen deutlichen Ausschlag nach oben (`WAVE_OUTLIER_HIGH_FACTOR`, 1.5x) oder unten
      (`WAVE_OUTLIER_LOW_FACTOR`, 0.6x) - verhindert, dass sich Kaempfe immer nur zwischen denselben
      drei Werten bewegen. Raid und Notruf (solo + gemeinsam) hatten VORHER ueberhaupt keine
      Schwankung (exakt 100% der eigenen Kampf-Power) - neue Basistabellen `RAID_MULTIPLIER_ROLL`/
      `NOTRUF_MULTIPLIER_ROLL` (`[0.90, 1.00, 1.10]`) geben ihnen jetzt dieselbe Grund-Varianz plus
      Ausreisser-Chance wie den Piraten-Sektoren. Auch die Elite-Bollwerk-Tabelle
      (`piraten_elite` in `sectors.ts`) war zuvor komplett flach (`[1.20, 1.20, 1.20]`) und wurde
      auf echte Varianz umgestellt (`[1.05, 1.20, 1.35]`).
    - **Kampf-Modifikatoren** (`BattleModifierType`: `nebel`/`ionensturm`/`truemmerfeld`/
      `sensorstoerung`/`strahlungssturm`, `rollBattleModifier()`): seltene, kontextabhaengige
      Chance (`BATTLE_MODIFIER_CHANCE`) auf EINEN zusaetzlichen Effekt fuer genau diesen Kampf -
      Nebel/Sensorstoerung/Truemmerfeld schwaechen gezielt den SPIELER (Praezision/RapidFire-
      Trefferquote/Ausweichen), Ionensturm schwaecht die Schild-Regeneration des Spielers
      (inklusive Kuppel-Pool), Strahlungssturm verstaerkt die Kritische-Treffer-Chance des GEGNERS.
      Musste als reiner Datenparameter (`battleModifier: BattleModifierType | null`) durch die
      GESAMTE Kampf-Kette gereicht werden, bis hinunter zu `rollHit()`/`fireShots()`/`runRounds()`,
      und durch `combatRunner.ts`/`combat.worker.ts` (Worker-Thread-Grenze, siehe Punkt 3 - keine
      Funktionen, nur Daten). Wird im Kampfbericht als Klartext angezeigt (z.B. "🌫️ Nebel im
      Sektor – deine Präzision -15% in diesem Kampf"), damit es sich wie eine erklaerte
      Ueberraschung anfuehlt, nicht wie unsichtbare Willkuer - aber bewusst NICHT vorher in der
      UI angekuendigt, sonst waere die Ueberraschung dahin.
    - **Elite-Bollwerk-Sonderregel:** Da dort 4 Stunden-Checks hintereinander stattfinden, wuerden
      Ausreisser UND Kampf-Modifikatoren bei gleicher Pro-Check-Chance wie bei Piraten-Hoch das
      Risiko ueber die gesamte Expedition unfair aufsummieren. Neues Feld `eliteSurpriseUsed` auf
      `GroupOperation` (`types.ts`) kappt BEIDE auf zusammen maximal 1x pro GESAMTER Expedition,
      nicht pro Einzel-Check (`runGroupHourlyCheck()` in `groupOps.ts`) - sobald einmal ein
      Ausreisser ODER ein Modifikator zugetroffen ist, bleiben alle folgenden Stunden-Checks dieser
      Expedition bei der normalen 3-Werte-Tabelle ohne weitere Ueberraschung.
    - `simulator.ts` wurde ebenfalls umgestellt (jeder Simulationslauf wuerfelt unabhaengig sein
      eigenes Profil/Ausreisser/Modifikator) - die Statistik ueber mehrere Laeufe zeigt dadurch
      automatisch die tatsaechliche Bandbreite moeglicher Begegnungen, nicht nur einen Einzelfall.
    Bewusst NICHT angetastet: `generateDefenseFleet()` (Verteidigungsanlagen-Generierung) - hatte
    bereits durch `Math.random()`-Gewichtung pro Aufruf inhaerente Varianz, war nicht Teil des
    urspruenglichen "eintoenig"-Problems.

34. **Info-Texte (`SektorInfoBox` in `Sektor.tsx`, Sektor-Beschreibung in `sectors.ts`) an die
    neue Wellen-Vielfalt (Punkt 33) angepasst - bewusst OHNE exakte Werte/Auflistung, um die
    Ueberraschung nicht vorwegzunehmen.** Die "🎲 Feindstärke"-Zeile zeigte vorher nur die reine
    3-Werte-Tabelle als vermeintlich vollstaendige Wahrheit, obwohl jetzt zusaetzlich ein
    Ausreisser moeglich ist - Zusatz "gelegentlich auch deutlich schwaecher oder staerker als
    ueblich" ergaenzt, ohne die genaue Ausreisser-Chance/den Faktor zu verraten. Zwei neue Zeilen:
    "🌊 Zusammensetzung" (Hinweis auf die drei Wellen-Profile, ohne sie namentlich zu nennen) und
    "⚡ Unvorhersehbare Umstände" (Hinweis auf die Kampf-Modifikatoren, ohne die fuenf Typen
    aufzuzaehlen). Elite-Bollwerk-Beschreibungstext in `sectors.ts` von "skalieren mit 120%" auf
    "skalieren mit DURCHSCHNITTLICH 120%, mit spuerbarer Schwankung" praezisiert, da die Tabelle
    jetzt echte Varianz hat (Punkt 33). Prinzip fuer kuenftige Ueberraschungs-Mechaniken: der
    tatsaechliche Ausgang wird IMMER erst im Kampfbericht nach dem Kampf als Klartext sichtbar
    (siehe Punkt 33), die Info-Popups duerfen nur ANKUENDIGEN, dass so etwas vorkommen kann, nie
    die genauen Zahlen/Optionen vorab offenlegen.

35. **Belohnungs-Eskalation und Container-Ueberarbeitung fuer alle vier Missionsarten** (neue
    zentrale Funktion `getEscalationMultiplier()` in `economy.ts`, `REWARD_ESCALATION`-Tabelle):
    - **Piraten-Sektoren (Niedrig/Mittel/Hoch):** Beute (`lootBase`) und Teile-Sofortbonus steigen
      ADDITIV mit jedem aufeinanderfolgenden Sieg INNERHALB derselben Mission (`Mission.streakWins`
      in `missions.ts`), gedeckelt je Gefahrenstufe - Niedrig +10%/Sieg bis max. 130%, Mittel +20%
      bis 160%, Hoch +35% bis 205%. Serie bricht bei einem Check ohne vernichteten Gegner auf 0
      zurueck. Captain-Belohnung bleibt bewusst FLACH (seltener Bonus, keine Eskalation).
    - **Elite-Bollwerk:** `piraten_elite`s `lootBase` in `sectors.ts` auf 25M/15M/10M (50M gesamt,
      50/30/20-Split) angehoben (vorher 40k/25k/11k - trivial im Vergleich). Verdoppelt sich PRO
      Sieg (`GroupOperation.streakWins`, `REWARD_ESCALATION.piraten_elite` im `'double'`-Modus) -
      bei fix 4 Stunden-Checks ergibt das 50M/100M/200M/400M. Teile-Sofortbonus verdoppelt sich
      ebenso. Piratenkapitaen-Belohnung (DM + Elite-Container) bleibt auf Wunsch FLACH, keine
      Verdopplung. Alles pro Teilnehmer, kein Splitting (Punkt 5).
    - **Notruf-Event (solo + gemeinsam):** Belohnung gibt es jetzt AUSSCHLIESSLICH bei echtem Sieg
      (Gegner vollstaendig vernichtet, eigene Flotte nicht ausgeloescht) - der bisherige
      Trost-Silber-Container bei ueberlebtem Gegner entfaellt ersatzlos. Bei Sieg 1-3 Container
      zufaellig (`1 + Math.floor(Math.random()*3)`), Tier weiterhin Gold (ohne eigene Verluste)
      oder Silber (mit Verlusten). Gemeinsames Notruf-Event: alle Teilnehmer bekommen dieselbe
      Anzahl/Stufe (gemeinsamer Ausgang, keine Aufteilung).
    - **Raid (Heimverteidigung):** Bei vollstaendig abgewehrtem Angriff jetzt ebenfalls 1-3
      Container zufaellig (vorher immer genau 1), bei nur teilweiser Abwehr bleibt es bei genau 1
      (das ist kein echter "Sieg"). Verteidiger UND alle Verstaerker bekommen dieselbe Anzahl.
      NEU: **Bergungs-DM** ("Bergung aus der zerstoerten Flotte", `RAID_SALVAGE_DM_PER_KILL`/
      `RAID_SALVAGE_DM_MAX` in `economy.ts`) - skaliert mit der Anzahl vernichteter Piratenschiffe/
      -anlagen (0,3 DM/Kill, gedeckelt bei 20 DM), unabhaengig vom Ausgang (auch bei teilweiser
      Abwehr, sofern ueberhaupt Gegner vernichtet wurden). Jeder Beteiligte bekommt den vollen
      Betrag. Beim Einbau wurde eine versehentliche Duplizierung der Verstaerker-Kampfergebnisse
      (playerResults) durch ueberlappende Code-Bloecke entdeckt und bereinigt, bevor sie ausgeliefert
      wurde - bei kuenftigen Aenderungen an diesem Funktionsteil auf doppelte `reinforcerStates.
      forEach(...)`-Schleifen achten, die versehentlich denselben `playerResults`-Eintrag zweimal
      erzeugen koennten.

36. **Info-Texte (`SektorInfoBox` in `Sektor.tsx`) an die Belohnungs-Eskalation (Punkt 35)
    angepasst.** Neue Zeile "📈 Sieges-Serie" - je nach `sektorId` unterschiedlicher Text:
    Elite-Bollwerk zeigt die Verdopplungs-Mechanik ("bis zu 8x nach 4 Siegen in Folge"), die
    anderen drei Piraten-Sektoren zeigen ihre jeweiligen additiven Werte (+10%/130%,
    +20%/160%, +35%/205% - hartcodiert client-seitig nach `sektorId`, da es sich um feste
    Balance-Konstanten handelt, keine dynamischen Serverdaten). "💰 Beute pro Sieg" und "🔧
    Teile-Sammlung" bekamen den Zusatz "(vor Sieges-Serie-Bonus)", damit klar ist, dass die
    angezeigten Zahlen die BASIS sind, nicht der tatsaechliche Endwert bei einer laufenden Serie -
    der tatsaechliche eskalierte Betrag ist ohnehin erst nach dem jeweiligen Kampf im Bericht
    sichtbar (`[Serie x...]`-Zusatz im Nachrichtentext, siehe Punkt 35). Notruf-Event und Raid
    haben KEINE eigene Info-Box (sie werden nicht wie Sektoren aktiv ausgewaehlt, sondern lösen
    zufaellig aus) - dort war nichts zu aktualisieren, die neuen Container-Mengen/DM-Bergung
    werden bereits vollstaendig im Kampfbericht selbst angezeigt.

37. **Im-Spiel-Updates-Seite (`/updates`, `UpdatesPage` in `Updates.tsx`) fuer spielerlesbare
    Aenderungshistorie - bewusst GETRENNT von dieser README.** Diese README ist Entwickler-
    Dokumentation (technische Details, Dateipfade, Code-Referenzen); `CHANGELOG` in
    `data/changelog.ts` ist die SPIELER-Version derselben Ereignisse - in Alltagssprache, ohne
    Code-Referenzen, fokussiert auf "was aendert sich fuers Spielgefuehl" statt "wie wurde es
    umgesetzt". Wird ueber `gameRouter.get('/data')` als `changelog`-Feld an den Client
    ausgeliefert (`ChangelogEntry[]`, neueste zuerst). **Bei jeder kuenftigen spielrelevanten
    Aenderung IMMER ZWEI Dokumentationen aktuell halten:** diese README (fuer mich/den naechsten
    Bearbeitungsdurchlauf) UND `changelog.ts` (fuer die Spieler) - unterschiedliche Zielgruppe,
    unterschiedlicher Ton, beide muessen unabhaengig voneinander gepflegt werden. Als neuer
    Top-Level-Sidebar-Punkt eingetragen (nicht als Untertab, siehe Punkt 10) - Update-Historie
    laesst sich thematisch keiner bestehenden Seite unterordnen, anders als z.B. Schrotthaendler/
    Spezialteile/Raid-Hilfe.

38. **Feindstaerke-Formel unterschaetzte Salvenschiffe massiv - via Kampfsimulator entdeckt
    (reine Salvenschiff-Flotten gewannen jeden Kampf, selbst Elite-Bollwerk).** Ursache:
    `combatFleetPower()`/`combatFleetPowerBase()` (Punkt 15) gewichten Waffen/Schild/Panzerung
    GLEICH - bei normalen Schiffen macht Waffen nur ~1-2% der Power-Zahl aus (Schild/Panzerung
    dominieren), bei den bewusst extrem einseitigen "Glaskanonen"-Salvenschiffen (Punkt 22) aber
    ~9-11%. Konkret gemessen: 100 Salvenkreuzer liefern 4,5x mehr Gesamt-Waffen als 100
    Schlachtkreuzer, wurden aber nur mit 40% von deren Power-Zahl bewertet - die generierte
    Gegnerstaerke war dadurch strukturell viel zu niedrig fuer reine Salvenschiff-Flotten. Fix:
    neue Konstante `MULTI_TARGET_POWER_CORRECTION = 8` (`combatConstants.ts`), angewendet in BEIDEN
    Power-Funktionen fuer alle `MULTI_TARGET_VOLLEY_SHIPS` (rechnerisch waeren 6,3-7,6x noetig, um
    ihren Waffenwert allein fair zu gewichten - auf 8x leicht aufgerundet, um zusaetzlich den
    Mehrfachziel-Effekt selbst mit abzudecken, der in der reinen Waffen-Vergleichsrechnung noch
    nicht enthalten ist). Ergebnis nach Korrektur: 100 Salvenkreuzer bewerten jetzt mit ~3,2x der
    Power von 100 Schlachtkreuzern - deutlich ausgewogener als vorher (0,4x), aber bewusst nicht
    exakt 1:1 zur reinen Feuerkraft-Ratio (4,5x), da die extreme Schild-/Panzerungs-Schwaeche der
    Salvenschiffe weiterhin ein echter, spuerbarer Nachteil bleiben soll. Zentral an EINER Stelle
    behoben (beide Power-Funktionen), wirkt dadurch automatisch ueberall dort, wo Feindstaerke
    berechnet wird (Piraten-Sektoren, Raid, Notruf, Elite-Bollwerk, Kampfsimulator) - kein
    Einzelfall-Fix pro Aufrufstelle noetig.

39. **Statistik/Bestenliste-Feature** (`/statistik`, `StatistikPage` in `Statistik.tsx`) - neues
    `PlayerStats`-Objekt auf `PlayerState` (`types.ts`), das kumulative ROHWERTE zaehlt (nie
    direkt Punkte - siehe unten), inkrementiert an mehreren Stellen:
    - `missions.ts`: Missionen-Siege je Gefahrenstufe (Niedrig/Mittel/Hoch), Asteroiden-Einsaetze
      (in `finalizeMission()`), Feinde vernichtet, eigene Verluste, Piratenkapitaene besiegt,
      erbeutete Ressourcen.
    - `raids.ts`: Raids voll/teilweise abgewehrt, Feinde vernichtet, eigene Verluste - fuer
      Verteidiger UND alle Verstaerker (keine Aufteilung, Punkt 5).
    - `events.ts`/`groupOps.ts`: Notruf-Events abgeschlossen (solo + gemeinsam), Elite-Bollwerk-
      Stunden-Checks gewonnen, Piratenkapitaene, erbeutete Ressourcen - bei gemeinsamen Operationen
      wieder fuer ALLE Teilnehmer identisch.
    - `actions.ts`: gebaute Schiffe, abgeschlossene Forschungen (in `tick()`s Warteschlangen-
      Abarbeitung).
    - `inventory.ts`: geoeffnete Container nach Stufe (Silber/Gold/Elite) in `openContainer()`.
    - Migration in `state.ts`s `loadPlayerState()` fuer bestehende Spielstaende ohne `stats`-Feld
      (Musterfeld-fuer-Feld-Abgleich gegen `defaultPlayerStats()`, analog zur Forschungs-Migration).

    **Punkte werden NIE gespeichert, nur aus den Rohwerten berechnet** (`calculatePoints()` in
    neuer Datei `stats.ts`, `POINT_WEIGHTS`-Tabelle: Piraten-Sektor Niedrig/Mittel/Hoch 10/25/50,
    Elite-Bollwerk-Check 150, Raid voll/teilweise 40/15, Notruf 30, Kapitaen-Bonus 20, pro Kill 1) -
    damit laesst sich die Gewichtung jederzeit anpassen, ohne bestehende Spielstaende migrieren zu
    muessen. Neue Route `GET /game/leaderboard` (`getLeaderboard()` in `stats.ts`) liefert alle
    registrierten Nutzer sortiert nach Punkten inkl. voller `PlayerStats` - Basis sowohl fuer die
    eigene Statistik-Anzeige als auch die Bestenliste (Client filtert die eigene Zeile per
    `userId`-Abgleich heraus, kein separater "eigene Stats"-Endpunkt noetig). Client pollt die
    Bestenliste alle 15s (eigener Fetch-Zyklus in `Statistik.tsx`, unabhaengig vom 3s-Haupt-Polling
    in `GameContext.tsx` - Statistik-Aenderungen sind nicht zeitkritisch).

40. **Dunkle-Materie-Cap bei Asteroiden-Feldern war noch auf die alte 4h-Missionsdauer kalibriert,
    obwohl Punkt 23 die Missionsdauer laengst auf 12h angehoben hatte.** Die Rate-Formel selbst
    (`accrueFarming()` in `missions.ts`) berechnet zwar dynamisch korrekt ueber die TATSAECHLICHE
    Missionsdauer (`mission.endTime - mission.arriveTime`, nicht hartcodiert), aber `dmCap` (der
    Zielwert, den diese Rate ueber die volle Dauer erreicht) wurde beim Duration-Wechsel nie
    angepasst - dadurch sank die DM-Ausbeute PRO STUNDE auf ein Drittel (z.B. Niedrig: vorher
    5 DM/4h = 1,25 DM/h, nachher 5 DM/12h = nur noch 0,42 DM/h), obwohl das nie beabsichtigt war.
    Fix: `dmCap` in `sectors.ts` verdreifacht (Niedrig 5→15, Mittel 10→30, Hoch 15→45) - stellt die
    urspruengliche DM/h-Rate wieder her, jetzt korrekt ueber die tatsaechlichen 12h verteilt statt
    ueber die alten 4h. Sektor-Beschreibungstexte (`zweck`-Feld) ebenfalls auf die neuen Werte
    aktualisiert. Kommentar bei `resourceCapOverTime` (nur fuer `piraten_elite`/Elite-Bollwerk
    genutzt, bleibt bei 4h) praezisiert, um Verwechslung mit `dmCap` (jetzt 12h bei Asteroiden-
    Feldern) zu vermeiden - beide Felder hatten denselben irrefuehrenden "laeuft ueber die 4h"-
    Kommentar, obwohl nur eines davon noch bei 4h liegt. Client zeigt `cfg.dmCap` bereits dynamisch
    an (`SektorInfoBox` in `Sektor.tsx`), keine Client-Aenderung noetig.

41. **Spionage-Forschung als Platzhalter gesperrt - bewusst NICHT entfernt, fuer spaeteren
    Spielausbau vorbereitet.** Ihr einziger Effekt (Glaettung der Gegner-Zusammensetzung in
    `generatePiratenFleet()`/`generateDefenseFleet()`, `combat.ts`) wurde durch die neuen
    Wellen-Profile (Punkt 33) weitgehend ueberschattet - welches Profil gewuerfelt wird, hat viel
    groesseren Einfluss auf die Zusammensetzung als das, was Spionage danach noch glaetten kann.
    **Server:** `startResearch()` in `actions.ts` lehnt `techId === 'spionage'` explizit ab (Fehler
    "aktuell gesperrt"), unabhaengig vom Client - Sperre gilt also auch bei direkten API-Aufrufen.
    Effekt zusaetzlich neutralisiert: `missions.ts`/`groupOps.ts`/`simulator.ts` uebergeben jetzt
    ueberall fest `0` statt `state.research.spionage` an `generatePiratenFleet()`/
    `generateDefenseFleet()` - der Mechanismus selbst (Funktionssignaturen, Glaettungs-Formel)
    bleibt UNVERAENDERT in `combat.ts` bestehen, nur die Aufrufstellen ignorieren den tatsaechlichen
    Forschungsstand. **Client:** `Forschung.tsx` zeigt Spionage weiterhin normal an (Bild, Name,
    aktuelle Stufe, Effekt-Beschreibung), ersetzt aber den Kosten-/Button-Bereich durch einen
    Sperr-Hinweis ("🔒 Vorerst gesperrt..."). Bei spaeterer Reaktivierung: Sperre in `actions.ts`
    entfernen, `Forschung.tsx`s `isLocked`-Zweig entfernen, UND an allen drei Aufrufstellen wieder
    `state.research.spionage || 0` statt der hartcodierten `0` einsetzen - erst dann wirkt sie
    wieder auf neu investierte UND bereits gespeicherte Forschungsstufen (bestehende
    `research.spionage`-Werte in `PlayerState` bleiben unangetastet gespeichert, gehen nicht
    verloren, wirken nur aktuell nicht).

42. **Verteidigungsanlagen waren trotz fair kalibrierter Waffen-Kosteneffizienz (~65
    Kosten/Waffenpunkt, Punkt 18) in der GESAMT-Kosteneffizienz (Waffen+Schild+Panzerung pro
    Kosten-Einheit) massiv unterlegen gegenueber Schiffen** - bei den teureren Anlagen (Gauss-
    Kanone, Ionengeschuetz, Plasmawerfer) lag die Effizienz bei nur 0,14-0,28 gegenueber ~0,95-1,02
    bei vergleichbaren Schiffen. Je teurer/staerker die Anlage, desto schlechter ihr Gegenwert -
    das Gegenteil von dem, was eine Basis-Verteidigung leisten sollte. Fix in zwei Teilen:
    1. **Schild/Panzerung aller sechs Waffen-Verteidigungsanlagen angehoben** (`defenses.ts`),
       Waffen bewusst UNVERAENDERT gelassen (bereits fair kalibriert) - Ziel-Effizienz 1,4
       (spuerbar zaeher als Schiffe, auf ausdruecklichen Wunsch hoeher als der zunaechst erwogene
       Zwischenwert 1,15). Z.B. Plasmawerfer: Schild 1.800→162.000, Panzerung 96.000→918.000.
    2. **Verteidigungsanlagen (inkl. Schildkuppel-Pool) aus der Raid-Feindstaerke-Berechnung
       herausgenommen** (`homePower` in `raids.ts` zaehlt jetzt NUR noch die Flotte, nicht mehr
       Verteidigung/Kuppel-Pool) - notwendige Voraussetzung fuer Schritt 1: ohne diese Entkopplung
       haette eine zaehere Verteidigung automatisch einen staerkeren Angriff heraufbeschworen
       (Verteidigung -> homePower -> targetPower -> mehr Angreifer), was bei gleichzeitig
       aufgeblaehten HP-Pools auf beiden Seiten (aber unveraendertem eigenen Schaden) Kaempfe stark
       in die Laenge gezogen haette (Raids kennen keinen Rueckzug, Punkt 27 - liefen sonst haeufig
       bis `MAX_ROUNDS=100`). Verteidigungsanlagen wirken im TATSAECHLICHEN Kampf weiterhin voll
       (unveraendert Teil von `defenderShips`), nur die Frage "wie stark wird der Angriff" ignoriert
       sie jetzt. **Dabei entdeckter Folgefehler:** Die alte Absicherung `homePower === 0` fuer
       "keine Verteidigung vorhanden" waere durch die Entkopplung fehlerhaft geworden (homePower
       kann jetzt legitim 0 sein bei reinem Verteidigungsanlagen-Aufbau ohne eigene Flotte, ohne
       dass das automatisch "keine Verteidigung" bedeutet) - Guard korrigiert auf reine Pruefung
       von `defenderShips` (Flotte ODER Verteidigung vorhanden). Zusaetzlich neue
       `RAID_MIN_TARGET_POWER`-Konstante (`economy.ts`, 200.000) als Untergrenze fuer
       `targetPower`, damit ein reiner Verteidigungsanlagen-Aufbau ohne Flotte nicht auf eine
       triviale/leere Gegnerwelle trifft.
