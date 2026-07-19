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
                                      von jedem Login (siehe "Wichtige Punkte" Punkt 13), ruft
                                      dabei auch runBotTurn() fuer Bot-Accounts auf (Punkt 58)
  src/game/bot.ts                    KI-Spieler-Entscheidungslogik: Gebaeude/Forschung/Schiffe/
                                      Verteidigung/Sektor-Missionen/Elite-Bollwerk/Halten - nutzt
                                      dieselben Aktionsfunktionen wie die UI (siehe Punkt 58),
                                      ensureBotUsers() legt die Accounts einmalig beim Start an

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
  src/game/raids.ts                  Basis-Raids (inkl. Einbindung haltender Galaxie-Flotten,
                                      siehe galaxy.ts; ad-hoc Verstärkungen ueber reinforcements[]
                                      strukturell noch vorhanden, aber seit Punkt 53 immer leer)
  src/game/raidReinforce.ts          Liste aktiver Raids zur Navigation (kein eigener
                                      Verstärkungs-Versand mehr, siehe Punkt 53 - "Halten" in der
                                      Galaxie-Ansicht ist der einzige Weg zu helfen)
  src/game/galaxy.ts                 GESAMTE Galaxie-Logik: Distanz/Flugzeit/Treibstoff,
                                      Positionsvergabe, "Halten"-Mechanik (Flotte stationieren/
                                      zurückrufen), Übersicht, Raid-Verteidigungs-Einbindung
  src/game/groupOps.ts               GESAMTE Multiplayer-Logik: gemeinsame Elite-Bollwerk-
                                      Expeditionen (Einladen/Rendezvous/Starten,
                                      Belohnungsvergabe) - Notruf ist seit Punkt 53 nur noch solo,
                                      der alte Multiplayer-Notruf-Codepfad (kind:'event') bleibt
                                      als totes Sicherheitsnetz im Code, ueber die UI nicht mehr
                                      erreichbar

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
  src/game/data/galaxyConstants.ts   Galaxie-Größe (50 Systeme x 9 Positionen), Distanz-/
                                      Flugzeit-Formel-Konstanten
  src/game/data/buildings.ts         Alle Gebäudedaten (Metall-/Kristall-/Deuteriummine,
                                      Solarkraftwerk, Roboter-/Nanitenfabrik: Kosten, Bauzeit,
                                      Ertrag/Energie pro Stufe)
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
  src/lib/multipliers.ts             Bauzeit-/Forschungszeit-Multiplikator (Forschung + Booster +
                                      Roboter-/Nanitenfabrik), Energie-/Minen-Produktionsformeln
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
  src/pages/Forschung.tsx             Forschung + Untertab "Gebäude" (rendert Gebaeude.tsx)
  src/pages/Gebaeude.tsx               Gebäude ausbauen (kein eigener Nav-Punkt, nur als
                                      Untertab von Forschung eingebunden)
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
  src/pages/Multiplayer.tsx           Gemeinsame Elite-Bollwerk-Expeditionen + Untertabs
                                      "Raid-Hilfe" (rendert RaidHilfe.tsx) und "Spieler"
                                      (Online/Offline-Liste) - kein Notruf mehr hier (nur solo,
                                      siehe Sektor.tsx)
  src/pages/Galaxie.tsx               Galaxie-Ansicht: System-Browser, Positionsraster,
                                      Flotte "halten" (stationieren/zurückrufen),
                                      Flottenbewegungen-Übersicht (eigener Nav-Punkt)
  src/pages/RaidHilfe.tsx             Liste aktiver Raids anderer Spieler zur Navigation - Klick
                                      springt zur Position in der Galaxie-Ansicht (kein eigenes
                                      Formular mehr, kein eigener Nav-Punkt, nur als Untertab von
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
    Fixe Checkpoints (`nextFixedCheckpoint()` in `economy.ts`, siehe Punkt 56 fuer die aktuellen
    Stundensaetze - deutsche Ortszeit, Raid und Notruf getrennt/versetzt) werden per
    `rollFixedCheckpoints()` einzeln nachgeholt, wenn ein Spieler laenger offline war - nicht
    einfach uebersprungen (Punkt 55 zur Reihenfolge-Korrektur beachten, sonst wird der jeweils
    faellige Checkpoint selbst nie gewuerfelt). `tick()` verarbeitet zusaetzlich zum eigenen Zustand
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
    Piraten-Sektoren, Notruf-Events (nur noch solo, siehe Punkt 53), Raids (Heimverteidigung) und
    Elite-Bollwerk
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
      drei Werten bewegen. Raid und Notruf (Notruf war zu diesem Zeitpunkt noch solo+gemeinsam,
      seit Punkt 53 nur noch solo) hatten VORHER ueberhaupt keine
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
    - **Notruf-Event (nur noch solo, siehe Punkt 53):** Belohnung gibt es jetzt AUSSCHLIESSLICH bei echtem Sieg
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
    - `events.ts`/`groupOps.ts`: Notruf-Events abgeschlossen (nur noch solo, siehe Punkt 53), Elite-Bollwerk-
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

43. **Kritische Luecke behoben: keiner der Cross-User-Sweeps (`runGlobalHeartbeat()` in
    `heartbeat.ts`, `processOverdueRaidsForOtherUsers()`/`processOverdueRaidSpawnsForOtherUsers()`
    in `raids.ts`, `processOverdueEventsForOtherUsers()` in `events.ts`,
    `processAllDepartedGroupOperations()` in `groupOps.ts`) hatte Fehler-Isolation PRO NUTZER/
    OPERATION.** Symptom, das darauf gefuehrt hat: trotz aktivem Heartbeat wurde ueber mehrere
    Checkpoints hinweg bei KEINEM von zwei Spielern ein Raid/Notruf ausgeloest - statistisch nur
    ~0,001% Wahrscheinlichkeit reiner Zufall. Ursache: Eine Ausnahme bei EINEM Nutzer (z.B. durch
    einen unerwarteten Datenzustand) brach die gesamte `for`-Schleife ab - bei nur 2 registrierten
    Nutzern reichte ein Fehler beim ersten in der Liste, um den zweiten (und JEDEN kuenftigen
    Durchlauf, da der Heartbeat alle 2 Minuten dieselbe Nutzerliste in derselben Reihenfolge
    durchgeht) dauerhaft und komplett unsichtbar stillzulegen - der Heartbeat laeuft unabhaengig
    von jeder Spieler-Anfrage, ein Fehler dort zeigt sich nirgends in der UI. Fix: JEDER Nutzer/
    JEDE Operation einzeln in `try/catch` verarbeitet, Fehler werden geloggt (`console.error`)
    statt die Verarbeitung fuer alle Nachfolgenden zu blockieren. `runGlobalHeartbeat()` gibt jetzt
    zusaetzlich eine `errors`-Zaehlung zurueck (`{ usersProcessed, errors }`). Der eigentliche
    urspruengliche Fehler (WARUM die Ausnahme ausgeloest wurde) ist damit noch nicht zwingend
    gefunden - falls er weiterhin auftritt, jetzt aber sichtbar in den Render-Logs statt komplett
    stumm. Bei JEDER kuenftigen neuen Cross-User-Sweep-Funktion dieses Try/Catch-Pro-Element-Muster
    zwingend uebernehmen, sonst droht dieselbe Klasse von unsichtbarem Totalausfall erneut.

44. **Schildkuppeln (Punkt 42 fehlte hier) waren nach der Verteidigungsanlagen-Ueberarbeitung
    ebenfalls unbrauchbar geworden - sogar staerker als die urspruengliche Waffenanlagen-
    Schwaeche.** Der komplette Schildwert einer Kuppel fliesst NICHT in ihre eigene Verteidigung,
    sondern ausschliesslich in den gemeinsamen Pool fuer die GESAMTE Verteidigungslinie
    (`ownSchild = def.isDome ? 0 : def.stats.schild` in `getEffectiveStats()`, `combat.ts`) - mit
    Kuppel-Effizienz von nur 0,22-0,30 (schlechter als die 0,14-0,28 der Waffenanlagen VOR Punkt 42)
    war dieser Pool gegenueber den jetzt viel hoeheren Einzelschilden der anderen Anlagen
    (10.400-162.000) komplett bedeutungslos geworden - ein einzelner Treffer erschoepfte ihn quasi
    sofort. Fix (`defenses.ts`): dieselbe Ziel-Effizienz 1,4 wie bei den sechs Waffenanlagen, aber
    mit staerkerer Schild-Gewichtung (85% Schild / 15% Panzerung statt eines festen Verhaeltnisses),
    da der Schildwert hier explizit die Kernfunktion ist. Kleine Schildkuppel: Schild 2.000→24.000,
    Panzerung 4.000→4.000 (unveraendert, lag schon nahe am Zielwert). Grosse Schildkuppel: Schild
    10.000→119.000, Panzerung 12.000→21.000. `maxCount:1` fuer beide bleibt unveraendert.

45. **Zwei Anzeigefehler im Verteidigungsanlagen-Info-Popup (`Verteidigung.tsx`) fuer Schildkuppeln
    behoben:**
    - **Praezision/Kritische Treffer wurden auch fuer Kuppeln angezeigt**, obwohl Kuppeln
      `waffen:0` haben und nie selbst schiessen - diese Werte sind fuer sie bedeutungslos. Jetzt an
      `infoDef.stats.waffen > 0` gekoppelt, gilt generisch fuer JEDE zukuenftige waffenlose Anlage,
      nicht nur Kuppeln.
    - **Schild-Regeneration wurde fuer Kuppeln komplett unterdrueckt** (`!infoDef.isDome`-Bedingung),
      obwohl der gemeinsame Pool sich nachweislich JEDE Runde regeneriert
      (`poolA.remaining = ... + sharedShieldPoolA * poolRegen` in `runRounds()`, `combat.ts`,
      `poolRegen` nutzt dieselbe `getShieldRegenRate(research)` OHNE `typeId` - reiner Basiswert,
      keine Groessen-Modifikation, siehe Punkt 21). Jetzt korrekt angezeigt, mit eigenem Label
      "🛡️ Schild-Regeneration (Pool)" zur Klarstellung, dass sich der Wert auf den GEMEINSAMEN Pool
      bezieht, nicht auf eine einzelne Anlage. Client-seitiger `getShieldRegenRate()`-Aufruf mit
      `infoDef.id` als `typeId` ist unbedenklich, da `SHIELD_REGEN_MODIFIER` keine Eintraege fuer
      Kuppel-IDs hat (Lookup faellt auf 0 zurueck) - zeigt exakt denselben Wert wie der Server
      tatsaechlich fuer den Pool verwendet.

46. **Kampfbericht hatte keine Spalte fuer AUSGETEILTEN Schaden - nur `dmgTaken` (ERLITTENER
    Schaden), was leicht als "Kampfbeitrag" missverstanden werden konnte (tatsaechlich das
    Gegenteil).** Wurde entdeckt, als eine niedrige "Schaden"-Zahl bei Salvenschiffen faelschlich
    als schwache Feuerkraft gedeutet wurde - die Zahl beschrieb aber nur, wie viel sie EINGESTECKT
    hatten. Fix: neues `dmgDealt`-Feld durchgezogen von `combat.ts` (`ShotStats.dmgDealt`, erhoeht
    an BEIDEN Stellen in `fireShots()`, wo Schaden berechnet wird - Einzelziel UND Mehrfachziel-
    Salve, VOR Schild-/Ueberkill-Reduktion) bis zu `CombatUnitResult.dmgDealt` (`types.ts`) und an
    ALLEN 16 Konstruktionsstellen in `missions.ts`/`events.ts`/`groupOps.ts`/`raids.ts` ergaenzt
    (Muster: `dmgDealt: Math.round(result.shotsA.dmgDealt[key] || 0)` fuer Spieler-Einheiten,
    `shotsB` fuer NPCs - spiegelbildlich zum bestehenden `dmgTakenA`/`dmgTakenB`-Muster). Neue
    Spalte "Schaden ausgeteilt" in `Nachrichten.tsx`s `UnitTable`, bestehende Spalte von "Schaden"
    zu "Schaden erlitten" umbenannt, um kuenftige Verwechslung auszuschliessen. Client liest
    `u.dmgDealt || 0` ab (aeltere, bereits gespeicherte Nachrichten haben das Feld noch nicht).
    Balance-Entscheidungen zu Schiffs-Feuerkraft (z.B. Salvenschiffe) sollten ab jetzt anhand
    dieser neuen Spalte getroffen werden, nicht anhand von "Schaden erlitten".

47. **Neues System: Gebäude** (`data/buildings.ts`, `actions.ts`, `pages/Gebaeude.tsx` als
    Untertab von `Forschung.tsx`). Sechs Typen: Metallmine, Kristallmine, Deuterium-
    Synthetisierer, Solarkraftwerk, Roboterfabrik, Nanitenfabrik. Zentrale Design-Entscheidungen:
    - **Stufensystem statt Stückzahl** (wie Forschung, nicht wie Schiffe): jedes Gebäude existiert
      pro Spieler genau einmal und wird über Stufen ausgebaut (`state.buildings: Record<string,
      number>`). Kein Stufen-Limit - passend zur bestehenden Design-Philosophie (Punkt 8:
      bewusst unbegrenzt statt Deckelung).
    - **Ein einziger globaler Bauslot fuer ALLE Gebäude zusammen** (`MAX_BUILDING_SLOTS = 1` in
      `combatConstants.ts`), anders als Schiffe/Verteidigung mit mehreren Lane-Slots. Modelliert
      als `state.buildingQueue: BuildJob[]` (immer max. 1 Eintrag), damit sich die bestehende
      `BuildQueue.tsx`-Komponente (Lane-basiert, `maxSlots`-Parameter) unveraendert mit
      `maxSlots={1}` wiederverwenden laesst, statt eine eigene Anzeige-Komponente zu bauen.
    - **Energie-System, an OGame angelehnt:** die drei Minen verbrauchen Energie
      (`baseEnergyUse * Stufe * 1,1^Stufe` je Mine), das Solarkraftwerk erzeugt sie
      (`baseEnergyOutput * Stufe * 1,1^Stufe`). Reicht die Energie nicht, wird die Produktion
      ALLER Minen gemeinsam gedrosselt (`energyFactor() = min(1, erzeugt/verbraucht)` in
      `actions.ts`, nie ein Bonus bei Ueberschuss). Getestet: bei Metallmine Stufe 5 +
      Solarkraftwerk Stufe 3 ergab sich ein Energiefaktor von ~92% (5.191 erzeugt vs. 5.637
      benoetigt), die tatsaechliche Stundenproduktion lag entsprechend unter dem theoretischen
      Maximum - Drosselung greift korrekt, kein Energie-Ueberschuss-Bonus entsteht.
    - **Roboterfabrik/Nanitenfabrik verkuerzen Bauzeiten MULTIPLIKATIV (kompoundierend) pro
      Stufe, nicht linear** - linear wuerde bei wenigen Stufen zu negativen/Null-Bauzeiten
      fuehren. Gebaeude werden staerker beschleunigt (Roboterfabrik 25%/Stufe, Nanitenfabrik
      50%/Stufe: `0,75^Stufe` bzw. `0,5^Stufe`) als Schiffe/Verteidigung (1%/2% pro Stufe:
      `0,99^Stufe` bzw. `0,98^Stufe`), da fuer Gebaeude ohnehin nur der eine globale Bauslot
      existiert. Beide Effekte stapeln sich multiplikativ. Getestet: Roboterfabrik Stufe 10 +
      Nanitenfabrik Stufe 5 ergab einen Gebaeude-Zeitfaktor von ~0,18% (nie negativ/Null) und
      einen Schiffs-/Verteidigungs-Zeitfaktor von ~81,7% - beide Faktoren fliessen zusaetzlich zur
      bestehenden Bauzeit-Forschung/`bautempo`-Booster ein (`bauzeitMultiplier()` fuer
      Schiffe/Verteidigung, neues `gebaeudeBauzeitMultiplier()` fuer Gebaeude - beide teilen sich
      dieselbe Forschungs-/Booster-Basis ueber `baseTimeMultiplier()`, um Punkt 1 (Zeit-Anzeige
      MUSS Multiplikator nutzen) konsistent zu erfuellen). Client spiegelt beide Funktionen 1:1 in
      `multipliers.ts`.
    - **Mining-Effizienz-Forschung (`research.mining`) wirkt jetzt auf ZWEI Systeme** statt nur
      auf Mining-Schiffe: dieselbe Forschung boostet jetzt auch die Minen-Produktion
      (`miningMultiplier()` aus `missions.ts` wurde dafuer exportiert und in `actions.ts`
      wiederverwendet, statt einen zweiten, unabhaengigen Bonus einzufuehren) - EIN
      Wirtschaftssystem statt zweier getrennter.
    - **Passive Produktion laeuft ueber dasselbe "catch up"-Prinzip wie alles andere** (Punkt zu
      `tick()`): `accrueBuildingProduction()` rechnet die seit `lastUpdate` vergangene Zeit als
      Minen-Ertrag hoch, unabhaengig davon, ob der Spieler online ist. Getestet: 1 simulierte
      Stunde mit Metallmine Stufe 5 (kein Solarkraftwerk) ergab exakt den erwarteten,
      energiegedrosselten Stundenertrag als Ressourcen-Zuwachs.
    - **`loadPlayerState()` migriert fehlende Gebaeude-Stufen automatisch** (analog Punkt 33 zu
      Forschungsfeldern): Abgleich gegen `BUILDINGS` deckt automatisch alle aktuellen und
      kuenftigen Gebaeudetypen ab, `buildingQueue` wird bei Bedarf auf `[]` nachgeruestet.
    - **UI-Platzierung bewusst als Untertab** von `Forschung.tsx` statt eigener Sidebar-Punkt
      (Punkt 11: Sidebar schlank halten) - `ForschungPage` wurde dafuer in einen duennen
      Tab-Wrapper plus die bisherige Ansicht als `ForschungListView` aufgeteilt.
    - Bilder unter `client/public/buildings/*.jpg` (metallmine, kristallmine, deuteriummine,
      solarkraftwerk, roboterfabrik, nanitenfabrik) inzwischen geliefert und wie die Salvenschiffe
      (Punkt 24) auf 700x382 verkleinert und als komprimiertes JPEG abgelegt (~66-71 KB statt der
      ursprünglich hochgeladenen ~1408x768-PNGs) - wichtig für Mobil-Ladezeiten. `img`-Feld in
      `data/buildings.ts` entsprechend auf `.jpg` umgestellt.
    - **Energie-Anzeige in der Kopfleiste** (`ResourceBar.tsx`): Format `Erzeugt/Verbraucht`
      (z.B. `60/30`), rot eingefärbt bei Energiedefizit. Nutzt bevorzugt `state.energyProduced`/
      `state.energyConsumed` aus der Server-Antwort (siehe `routes.ts`), faellt aber auf die
      client-seitigen `getEnergyProduced()`/`getEnergyConsumed()` aus `multipliers.ts` zurueck,
      falls diese Felder (z.B. bei aeltern gecachten Antworten) fehlen sollten.

48. **Neues System: Galaxie-Ansicht** (`game/galaxy.ts`, `pages/Galaxie.tsx`, eigener
    Sidebar-Punkt). Eine Galaxie mit 50 Systemen x 9 Positionen (450 Plaetze, absichtlich viel
    Reserve bei der aktuellen Spielerzahl). Zentrale Design-Entscheidungen:
    - **Zufaellige Positionsvergabe, auch fuer Bestandsspieler.** `PlayerState.galaxyPosition`
      wird bei der Registrierung UND per Migration in `loadPlayerState()` vergeben (analog Punkt
      33/47 zu Forschungs-/Gebaeude-Feldern), damit auch bereits registrierte Spieler beim
      naechsten Laden automatisch eine freie Position bekommen. Die Vergabe-Funktion lebt bewusst
      DIREKT in `state.ts` (nicht in `galaxy.ts`) und liest andere Spielstaende ueber
      `loadGameStateJson()` statt `loadPlayerState()`, um einen Zirkelbezug state.ts <-> galaxy.ts
      zu vermeiden (galaxy.ts braucht seinerseits `loadPlayerState()` aus state.ts).
    - **Schiffs-Geschwindigkeit/Treibstoffverbrauch neu eingefuehrt** (`speed`/`fuelConsumption`
      in `ShipDefinition`). Bei Schiffen mit direktem OGame-Pendant an die dortigen
      Basis-Geschwindigkeiten angelehnt (Leichter/Schwerer Jaeger, Kreuzer, Schlachtschiff,
      Bomber, Schlachtkreuzer, Zerstoerer, Reaper); eigene Schiffe ohne OGame-Vorbild
      (Sandronator, Mining-Schiff, Begleitschiff, Imperator, Salvenschiffe) sinngemaess an die
      naechstliegende OGame-Klasse angepasst (z.B. Imperator so extrem langsam wie der
      OGame-Todesstern, Mining-Schiff wie ein Grosser Transporter).
    - **Distanz-/Flugzeit-Formel an OGame angelehnt, aber bewusst gestaucht**
      (`data/galaxyConstants.ts`): Distanz gleiches System `1000 + 5×Positionsdifferenz`, anderes
      System `2700 + 95×kuerzeste Systemdifferenz` (Galaxie "rund" gedacht, System 50 grenzt an
      System 1) - identisch zu OGames Formel. Flugzeit `10 + FAKTOR × sqrt(Distanz×10/Speed)`
      Sekunden, FAKTOR aber mit 925 statt OGames Standardwert 3500 bewusst kleiner gewaehlt, damit
      eine Galaxie-Querung bei normal schnellen Schiffen 20-60 Minuten dauert statt mehrerer
      Stunden. Getestet: System-Nachbarn (gleiches System, gleiche Flotte) ~14 Minuten,
      gegenueberliegende Systeme (Distanz ~4600-5075) mit typischen Schiffsgeschwindigkeiten
      28-56 Minuten - nur extrem langsame Einzelschiffe wie der Imperator (Speed 100) liegen
      erwartungsgemaess deutlich darueber, das ist bei einem derart legendaeren Einzelstueck
      hinzunehmen statt die gesamte Formel dafuer zu verzerren.
    - **"Halten" (Stationieren) statt Angriff:** `startHoldDeployment()` schickt eine Flotte los,
      sie bleibt ab Ankunft (`arriveTime`) unbegrenzt "haltend" am Ziel stehen (kein Kampf, kein
      PvP), bis `recallHoldDeployment()` sie zurueckruft - auch waehrend des Hinflugs moeglich
      (dreht sofort um, keine Teilstrecken-Physik, analog zum bestehenden `recallMission()` in
      missions.ts). Treibstoff faellt bei BEIDEN Richtungen an (bestaetigt), damit Stationieren
      kein kostenloser Dauerzustand ist. `state.galaxyDeployments` traegt sowohl unterwegs
      befindliche als auch bereits haltende Flotten - der Uebergang ist rein zeitbasiert
      (`arriveTime <= now`), keine explizite Statusaenderung noetig.
    - **Raid-Kampf-Integration (bewusst NUR Piraten-Raids, NICHT Notruf-Events):**
      Notruf-Events sind seit Punkt 53 ohnehin nur noch solo und kein Angriff auf die eigene
      Basis - eine Integration mit haltenden Flotten ist hier konzeptionell nicht sinnvoll,
      die urspruenglich hier angekuendigte spaetere Erweiterung ("kommt spaeter") ist damit
      gegenstandslos geworden.
      `getHoldingDeploymentsTargeting()` in `galaxy.ts` scannt bei JEDER Raid-Aufloesung
      (`resolveRaid()` in raids.ts) alle anderen Spieler nach aktuell bei diesem Verteidiger
      haltenden Flotten und bindet sie als zusaetzliche `OwnedFleetContribution`-Eintraege ein
      (Schluessel `held:${deploymentId}`, um Kollisionen mit ad-hoc Raid-Verstaerkungen
      auszuschliessen, falls ein Spieler beides gleichzeitig hat). Wichtiger Unterschied zu
      ad-hoc Verstaerkungen (`raidReinforce.ts`): Ueberlebende haltender Flotten fliegen NICHT
      automatisch nach Hause zurueck, sondern bleiben (reduziert) weiterhin haltend am Platz -
      `deployment.ships[id]` wird direkt mit den Ueberlebenden ueberschrieben, komplett vernichtete
      Eintraege werden aus `galaxyDeployments` entfernt (`persistHeldDeployment()`). Halter
      bekommen dieselbe volle Belohnung wie der Verteidiger (Container, Bergungs-DM, Statistik -
      keine Aufteilung, Punkt 5) und eine eigene Nachricht. Getestet: ein Verteidiger mit eigener
      Verteidigungsanlage UND mehreren gleichzeitig haltenden Fremdflotten (auch mehrere
      Eintraege desselben Halters) - alle Beitraege wurden korrekt getrennt nach `ownerKey`
      abgerechnet, Verluste realistisch verteilt, keine Vermischung der Bestandszahlen.
    - **Galaxie-Uebersicht scannt ALLE Spieler bei jedem Laden** (`listGalaxyOccupants()`,
      analog `listActiveRaids()`/Statistik-Bestenliste) - bei 2-5 Spielern unproblematisch, kein
      Caching noetig.
    - **Vorschau-Route** `POST /game/galaxy/preview` ist rein lesend (kein State-Update), damit
      der Client Distanz/Flugzeit/Treibstoffkosten VOR der eigentlichen Bestaetigung exakt
      anzeigen kann, ohne bereits Ressourcen zu verbrauchen.
    - **UI bewusst als eigener Sidebar-Punkt** (nicht als Untertab) - im Gegensatz zu
      Schrotthaendler/Spezialteile/Raid-Hilfe (Punkt 11) ist die Galaxie ein eigenstaendiges
      Hauptsystem mit eigenem Navigationsbedarf (System-Browser, Positionsraster,
      Flottenbewegungen-Liste).

49. **Piraten-Raids starten jetzt von einer zufaelligen Piratenbasis mit echter, distanzabhaengiger
    Flugzeit statt einer festen Vorwarnzeit** (`data/galaxyConstants.ts`, `raids.ts`). Ablauf:
    - **12 feste Piratenbasen-Positionen** (`PIRATE_BASES` in `galaxyConstants.ts`) ueber die
      Galaxie verteilt - wie Spielerpositionen, aber nicht belegbar, sichtbar in der Galaxie-
      Ansicht (🏴‍☠️-Markierung, ueber die neue `/game/galaxy`-Antwort `pirateBases` ausgeliefert).
    - **Zwei-Phasen-Timing bei `spawnRaidAt()`:** Trigger (weiterhin die bestehenden 4 fixen
      Tages-Checkpoints, 60% Chance, siehe Punkt 13) -> `RAID_PREP_MS` (60 Minuten, ersetzt die
      alte feste `RAID_WARNING_MS`/30-Minuten-Vorwarnzeit) Vorbereitungszeit, WAEHREND der eine
      zufaellig gewuerfelte Piratenbasis bereits feststeht -> danach echte Flugzeit von dieser
      Basis zur Zielposition, berechnet mit DERSELBEN Distanz-/Flugzeit-Formel wie Spieler-Flotten
      (`galaxyDistance()`/`galaxyDurationMs()` aus `galaxy.ts`, wiederverwendet statt dupliziert).
    - **Distanz UND Flugzeit stehen sofort bei Trigger fest** (Basis- und Zielposition sind ja
      beide sofort bekannt) - `arrivalTime` wird bereits in `spawnRaidAt()` vollstaendig berechnet,
      keine nachtraegliche Neuberechnung beim tatsaechlichen Abflug noetig. Die "Abflug"-Phase
      (`notifyRaidLaunchIfDue()`, ueber `launchNotified` einmalig abgesichert) verschickt nur eine
      zweite, rein informative Nachricht ("Piratenflotte ist gestartet, Ankunft in X Minuten"),
      wird sowohl im eigenen `processRaidTimer()` als auch in der Cross-User-Schleife
      `processOverdueRaidsForOtherUsers()` geprueft (Punkt 25 gilt weiterhin: andere Spieler
      muessen nicht selbst online sein, damit ihre Abflug-Nachricht verschickt wird).
    - **Repraesentative Piraten-Flottengeschwindigkeit** (`PIRATE_FLEET_SPEED = 7000` in
      `galaxyConstants.ts`) statt der "langsamstes Schiff"-Regel bei Spieler-Flotten - die
      tatsaechliche Gegner-Zusammensetzung wird ja weiterhin erst beim Eintreffen gewuerfelt
      (`generateFallbackFleet()` in `resolveRaid()`, unveraendert), ein fester Mittelwert ist
      hier die einzig praktikable Wahl. Getestet: Gesamtzeit Trigger->Ankunft liegt damit typisch
      bei 1h15min-1h40min (60 Minuten Vorbereitung + 15-40 Minuten Flug je nach Entfernung),
      spuerbar laenger als frueher (fix 30 Minuten), aber immer noch planbar statt stundenlang.
    - **Migration:** alte, vor dieser Erweiterung gespawnte Raids ohne `pirateBase`-Feld werden
      beim naechsten `loadPlayerState()` sicherheitshalber verworfen (`state.raid = null`) statt
      mit unvollstaendigen Werten weiterzurechnen - der naechste Checkpoint spawnt ganz regulaer
      neu. Betrifft nur den kurzen Uebergangszeitraum, in dem zufaellig gerade ein Raid aktiv war.
    - Raid-Verstaerkung (`raidReinforce.ts`, feste 1-Minute-Anflugzeit) bewusst UNVERAENDERT
      gelassen - das ist ein separates System, dessen eigene Flugzeit-Herleitung (Distanz-basiert
      wie bei Halten-Flotten) ein moeglicher naechster Schritt waere, aber nicht Teil dieser
      Aenderung war.

50. **Die 3 Asteroiden-Felder und 3 (normalen) Piraten-Sektoren haben jetzt ebenfalls feste
    Galaxie-Positionen** (`galaxyPosition` in `SEKTOR_CONFIG`, `data/sectors.ts`) - Anflug- UND
    Rueckflugzeit werden jetzt wie bei Galaxie-Halten-Fluegen ECHT aus der Distanz zur eigenen
    Position berechnet (`galaxyDistance()`/`galaxyDurationMs()`/`galaxyFleetSpeed()` aus
    `galaxy.ts`, in `sendFleet()` (`missions.ts`) wiederverwendet statt dupliziert), statt der
    vorher fixen `MISSION_TRAVEL_MS` (1 Minute). Getestet: Mining-Flotte von System 1 zu
    Asteroid-Hoch (System 34) brauchte 37 Minuten pro Strecke statt vorher 1 Minute - Aufenthalts-
    dauer vor Ort (4h Piraten- / 12h Asteroiden-Sektoren) bleibt davon unberuehrt.
    - **Fallback bei fehlender Position:** ist entweder der Sektor (aktuell nur Elite-Bollwerk,
      siehe unten) oder der Spieler (sollte dank Migration nicht vorkommen) ohne Galaxie-Position,
      greift weiterhin die alte feste `MISSION_TRAVEL_MS` - kein Absturz, nur die alte Anflugzeit.
    - **Elite-Bollwerk (`piraten_elite`) bewusst AUSGENOMMEN:** bleibt bei der alten festen
      Anflugzeit ueber `groupOps.ts` - ist nur ueber gemeinsame Expeditionen erreichbar (Punkt 7)
      und war nicht Teil dieser Anfrage; eine eigene Position dafuer waere ein moeglicher
      naechster Schritt, wirft aber zusaetzliche Fragen auf (z.B. wessen Position als Ausgangspunkt
      zaehlt bei mehreren Teilnehmern).
    - **Kein Konflikt bei gemeinsamer Zielposition:** mehrere Spieler koennen gleichzeitig zum
      selben Sektor fliegen, ohne dass sich das gegenseitig beeinflusst - jede Mission wuerfelt
      weiterhin ihre EIGENE Piratenflotte/Ausbeute unabhaengig (`generateFallbackFleet()` pro
      Mission, kein gemeinsamer Vorrat). Die Galaxie-Position ist nur ein gemeinsamer Wegpunkt
      fuer die Flugzeit-Berechnung, kein geteilter Ressourcen-Pool - exakt wie es schon vorher
      implizit der Fall war (nur jetzt mit einer echten Position statt einer abstrakten Sektor-ID).
    - **Sektor-Positionen jetzt auch in der Galaxie-Ansicht sichtbar** (🛰️-Markierung,
      `sektorPositions` in der `/game/galaxy`-Antwort, analog zu den Piratenbasen).
    - **Flottenbewegungen-Liste zeigt jetzt ZUSAETZLICH alle eigenen Sektor-Missionen**
      (`state.missions`), nicht mehr nur die Galaxie-Halten-Flotten - mit Phase (Anflug/vor Ort/
      Rückflug), Restzeit, Rückruf-Button (nutzt das bestehende `recallMission()`) und
      aufklappbarer Schiffsdetail-Ansicht, genau wie bei Halten-Flotten. Bekannte, bewusst NICHT
      in dieser Runde behobene Luecke: eigene Raid-Verstaerkungen (`raidReinforce.ts`) und
      Gruppen-Expeditionen (`groupOps.ts`) tauchen dort noch NICHT auf, da fuer sie bisher keine
      Bewegungs-Historie im eigenen `PlayerState` mitgefuehrt wird - waere ein moeglicher
      naechster Schritt fuer eine wirklich vollstaendige Flottenbewegungen-Uebersicht.

51. **Elite-Bollwerk und Notruf haben jetzt ebenfalls je EINE feste Galaxie-Position** (anders als
    die 12 Piratenbasen oder die 3+3 normalen Sektoren: hier gibt es bewusst nur genau einen festen
    Ort, keine Zufallsauswahl). Elite-Bollwerk-Position steckt direkt in `SEKTOR_CONFIG.piraten_elite`
    (`data/sectors.ts`, wiederverwendet dasselbe `galaxyPosition`-Feld wie die anderen Sektoren);
    Notruf-Position ist `NOTRUF_POSITION` in `galaxyConstants.ts` (kein SEKTOREN-Eintrag, daher
    eigene Konstante). Beide ueber `/game/galaxy` (`sektorPositions`/`notrufPosition`) an den
    Client ausgeliefert und in der Galaxie-Ansicht sichtbar (🛰️ bzw. 🆘).

    - **Notruf ist jetzt NUR NOCH SOLO moeglich** (`groupOps.ts`s `createGroupOperation()` lehnt
      `kind:'event'` explizit ab) - das bisherige Multiplayer-Notruf-Pendant (`resolveGroupEvent()`)
      bleibt im Code als Sicherheitsnetz fuer eventuell noch bestehende alte Datensaetze erhalten,
      ist aber ueber die UI nicht mehr erreichbar (Notruf-Tab in `Multiplayer.tsx` komplett entfernt).
    - **Notruf-Ablauf grundlegend umgebaut** (`events.ts`): `startEventMission()` loest den Kampf
      NICHT MEHR sofort aus, sondern zieht nur noch die Flotte ab und berechnet die echte
      Flugzeit zur `NOTRUF_POSITION` (`galaxyDistance()`/`galaxyDurationMs()`/`galaxyFleetSpeed()`
      aus `galaxy.ts`, exakt wie bei Sektor-Missionen). Der eigentliche Kampf
      (`resolveEventCombat()`, inhaltlich unveraendert) laeuft jetzt erst bei Ankunft
      (`state.event.arriveTime` erreicht) - ueber `processEventTimer()` (eigener Tick) UND
      `processOverdueEventsForOtherUsers()` (Cross-User, Punkt 25 gilt weiterhin: andere Spieler
      muessen nicht online sein). `EventState` fuehrt dafuer neu `ships`/`arriveTime` mit,
      da die Flottenauswahl zwischen "losschicken" und "Kampf" jetzt persistiert werden muss statt
      wie vorher synchron in einem einzigen Funktionsaufruf verarbeitet zu werden.
    - **`EVENT_WINDOW_MS` (Frist zum LOSSCHICKEN, nicht zur Ankunft) von 60 auf 90 Minuten
      angehoben** (`economy.ts`), da nach der Entscheidung ja noch die Flugzeit obendrauf kommt.
      Getestet: Notruf-Flotte (Leichter Jaeger) brauchte bei mittlerer Entfernung ~28 Minuten zur
      Notruf-Position, Kampf loeste danach korrekt aus, Ueberlebende kehrten normal zurueck.
    - **Migration:** alte, vor dieser Erweiterung gespawnte Notrufe ohne `arriveTime`-Feld werden
      beim naechsten `loadPlayerState()` sicherheitshalber verworfen (analog Punkt 49 bei Raids).
    - **Elite-Bollwerk-Rendezvous** (`groupOps.ts`): eingeladene Teilnehmer fliegen nach dem
      Annehmen (`respondToGroupOperation()`) zuerst automatisch zum ERSTELLER, nicht direkt zum
      Ziel - `GroupOperationParticipant.rendezvousArrivalTime` wird dabei aus der Distanz
      Teilnehmer->Ersteller und der Geschwindigkeit der ANGENOMMENEN Flotte berechnet. Der
      Ersteller selbst braucht keine Rendezvous-Zeit (ist ja schon an seiner eigenen Position).
    - **`startGroupOperation()` verweigert den Start, solange nicht ALLE angenommenen Teilnehmer
      eingetroffen sind** (`rendezvousArrivalTime <= now`), mit Fehlermeldung inkl. Namen der noch
      Fehlenden. Client spiegelt das: "Jetzt starten"-Button in `Multiplayer.tsx` ist deaktiviert,
      solange jemand noch unterwegs ist, Status pro Teilnehmer ("unterwegs zu dir (Xmin)" /
      "bei dir eingetroffen") wird live angezeigt.
    - **Nach erfolgreichem Rendezvous fliegt die GESAMTE vereinte Flotte gemeinsam weiter** zum
      Elite-Bollwerk - Distanz vom ERSTELLER (nicht von einem Durchschnittsort) zur
      Elite-Bollwerk-Position, Geschwindigkeit = langsamstes Schiff UEBER ALLE angenommenen
      Teilnehmer-Flotten kombiniert (`combinedShips`, gemergte Schiffszahlen aller Teilnehmer).
      Ersetzt die vorherige feste `MISSION_TRAVEL_MS` fuer beide Etappen (hin UND zurueck).
      Getestet: 50 Kreuzer (Ersteller) + 30 Kreuzer (Teilnehmer, erst nach Rendezvous-Ankunft
      startbar) ergaben korrekt 25 Minuten Flugzeit zum Bollwerk basierend auf der tatsaechlichen
      Distanz vom Ersteller aus.
    - **Bewusst NICHT Teil dieser Runde:** Rueckruf/Verhalten, falls ein Teilnehmer NIE eintrifft
      (Operation bleibt dann einfach unbegrenzt im "inviting"-Status haengen, der Ersteller kann sie
      aber jederzeit ueber `cancelGroupOperation()` abbrechen - alle bereits eingesetzten Flotten,
      inklusive bereits angereister, werden dabei an ihre Besitzer zurueckerstattet).

52. **Distanz-/Flugzeit-Vorschau auf ALLE Flugziele verallgemeinert**, nicht mehr nur auf
    Galaxie-Halten-Fluege zu anderen Spielern. Vorher gab es die Vorschau nur dort, waehrend
    Sektor-Missionen, Notruf und Elite-Bollwerk-Expeditionen trotz echter (Punkt 50/51)
    Flugzeit-Berechnung weder ihre Galaxie-Position noch eine Flugzeit-Vorschau anzeigten - man
    haette dafuer immer erst in die Galaxie-Ansicht wechseln muessen (und selbst dort war fuer
    diese drei Ziele nichts vorbereitet).
    - **`POST /game/galaxy/preview` verallgemeinert:** akzeptiert jetzt entweder `targetUserId`
      (Halten, unveraendert) ODER eine beliebige feste `targetPosition` (Sektor/Notruf/
      Elite-Bollwerk/Rendezvous) - dieselbe Route, kein zweiter Endpunkt noetig.
    - **Neuer Client-Hook `useGalaxyPreview()`** (`lib/useGalaxyPreview.ts`): debouncte
      Distanz-/Flugzeit-Abfrage zu einer festen Zielposition, an drei Stellen wiederverwendet statt
      dreimal separat gebaut.
    - **Sektor-Tab:** jede Sektor-Karte zeigt jetzt ihre Position (📍 1:X:Y); ist eine Karte
      aufgeklappt und eine Flotte gewaehlt, erscheint die Anflugzeit-Vorschau vor dem
      "Entsenden"-Button. Wichtig fuer die Implementierung: `useGalaxyPreview()` wird pro
      Sektor-Karte in der `.map()`-Schleife aufgerufen - das ist hier unbedenklich, weil
      `sektorenInTab` eine FESTE Laenge/Reihenfolge pro Tab hat (anders als die naechsten beiden
      Faelle, siehe unten), Ships-Objekt fuer nicht-aufgeklappte Karten ist einfach `{}` und loest
      keinen Request aus (leere Flotte).
    - **Notruf-Karte** (Sektor-Tab, vor dem Losschicken): zeigt jetzt ebenfalls Position und
      Anflugzeit-Vorschau waehrend der Flottenauswahl, Text von "Zeit zum Eingreifen" zu "Zeit zum
      Losschicken" praezisiert (das war ohnehin schon die eigentliche Bedeutung, siehe Punkt 51).
    - **Elite-Bollwerk-Karte** (Multiplayer-Tab): zeigt Position; beim Ersteller erscheint beim
      Waehlen der eigenen Flotte eine Vorschau des SPAETEREN Weiterflugs zum Bollwerk.
    - **Einladungs-Karten fuer Elite-Bollwerk WURDEN IN EINE EIGENE KOMPONENTE
      (`PendingInviteCard`) AUSGELAGERT**, statt `useGalaxyPreview()` direkt in der
      `.map()`-Schleife ueber `pendingForMe` aufzurufen - im Gegensatz zu den Sektor-Karten hat
      diese Liste KEINE feste Laenge (Einladungen kommen/verschwinden waehrend der Nutzung durch
      Annehmen/Ablehnen), ein Hook direkt in einer variabel-langen `.map()`-Schleife wuerde gegen
      die React Hook-Regeln verstossen. Jede Karte ist jetzt eine eigene Komponenteninstanz mit
      eigenem, stabilem Hook-Aufruf. Zeigt dem Eingeladenen VOR dem Annehmen die
      Rendezvous-Flugzeit zur Position des Erstellers (`op.creatorPosition`, siehe Punkt 51).
    - **`GroupOperation.creatorPosition`** (neu, `types.ts`) wird bei `createGroupOperation()`
      einmalig eingefroren (Erstellerposition zum Erstellungszeitpunkt) statt live nachgeschlagen -
      Einladungsempfaenger brauchen diesen Wert fuer ihre Rendezvous-Vorschau, OHNE dass der
      Server dafuer bei jeder Anzeige extra den Ersteller-State laden muesste.

53. **Raid-Hilfe als eigenstaendiger Verstaerkungs-Mechanismus ENTFERNT - "Halten" ist jetzt der
    EINZIGE Weg, einem anderen Spieler bei Piratenraids zu helfen.** Die alte `reinforceRaid()`-
    Funktion (feste 1-Minute-Anflugzeit, Flotte kehrt nach dem einen Kampf automatisch heim, nur
    waehrend eines LAUFENDEN Raids nutzbar) war inhaltlich redundant zu einer haltenden
    Galaxie-Flotte (echte Flugzeit, dauerhaft stationiert, verteidigt automatisch bei JEDEM
    kuenftigen Raid, siehe Punkt 51) - zwei parallele Mechaniken mit unterschiedlicher Physik fuer
    denselben Zweck waeren nur Verwirrung und Wartungsaufwand gewesen.
    - **`POST /game/raids/reinforce` ersatzlos entfernt**, `reinforceRaid()` aus `raidReinforce.ts`
      geloescht. `listActiveRaids()`/`ActiveRaidInfo` bleiben bestehen, dienen aber nur noch der
      NAVIGATION: `targetPosition` (statt vorher gar keiner Positionsangabe) und `holdingCount`
      (Anzahl bereits dort haltender Fremdflotten, ueber `getHoldingDeploymentsTargeting()` aus
      galaxy.ts - ersetzt das alte, nun immer leere `reinforcementCount`/`reinforcements`-Array).
    - **`RaidHilfePage` (Multiplayer-Tab) komplett vereinfacht:** zeigt nur noch Spielername,
      Position, Piraten-Ankunftszeit und Anzahl bereits haltender Flotten, mit einem Button "Zur
      Position in der Galaxie" (`navigate('/galaxie?system=X&targetUserId=Y')`). Kein
      Flottenauswahl-Formular mehr an dieser Stelle - das Halten-Formular in `Galaxie.tsx`
      uebernimmt das jetzt vollstaendig.
    - **`Galaxie.tsx` liest `?system=`/`?targetUserId=` per `useSearchParams()`** (gleiches Muster
      wie der bestehende `?tab=`-Parameter in `Multiplayer.tsx`) und springt beim Laden direkt zum
      passenden System UND oeffnet automatisch das Halten-Formular fuer den genannten Zielspieler.

54. **Vollstaendige Ursprungs-/Ziel-Transparenz aller Flottenbewegungen** - vorher fehlten an
    mehreren Stellen entweder Koordinaten oder ganze Bewegungsarten in der Uebersicht:
    - **Ursprungskoordinaten ergaenzt** bei Sektor-Missionen, Notruf und Halten-Fluegen in der
      Flottenbewegungen-Liste (`Galaxie.tsx`) - vorher stand dort nur "wohin", nie "von wo"
      (bei Halten-Fluegen war das Ziel zwar sichtbar, aber `d.originSystem`/`d.originPosition`
      - obwohl laengst im Datenmodell vorhanden, siehe Punkt 47 - wurden clientseitig nie
      angezeigt).
    - **Gemeinsame Elite-Bollwerk-Expeditionen tauchen jetzt ebenfalls in der
      Flottenbewegungen-Liste auf** (`parties.filter(op => op.status === 'departed')`), inkl.
      Phase (unterwegs/vor Ort/Rueckflug) und Ursprung (`op.creatorPosition`) - vorher eine
      bewusst dokumentierte Luecke (siehe Punkt 50).
    - **Neuer Abschnitt "Eingehende Flotten"** (`Galaxie.tsx`, unterhalb der eigenen
      Flottenbewegungen): zeigt ALLE fremden Flotten, die gerade zu einem selbst unterwegs sind
      oder bereits bei einem halten - mit Absender, Ursprungskoordinaten, Status und (bei Klick)
      der EXAKTEN Schiffszusammensetzung, da bei Halten-Fluegen die Zusammensetzung von Anfang an
      feststeht (kein Geheimnis wie bei NPC-Flotten). Neue Server-Funktion
      `getIncomingDeploymentsFor()` (`galaxy.ts`) liefert das, `/game/galaxy` liefert es als
      `incomingDeployments` mit aus.
    - **Eingehende Piratenflotten ebenfalls in "Eingehende Flotten"**: Ursprung (Piratenbasis-
      Koordinaten) und Timer (Vorbereitung/Flugzeit) werden angezeigt, der Flotteninhalt aber
      bewusst NICHT - der steht serverseitig erst bei `resolveRaid()` (Ankunft) fest, siehe
      `generateFallbackFleet()` in `combat.ts`, ist also kein UI-Versaeumnis, sondern Teil des
      Spieldesigns (Ungewissheit bis zum Einschlag).

55. **BUGFIX: `rollFixedCheckpoints()` (economy.ts) hat Raids/Notrufe fuer aktiv online
    spielende Nutzer praktisch NIE ausgeloest** - ein vorbestehender Fehler, nicht Teil der
    Galaxie-Erweiterung. Die Funktion rueckte den gespeicherten Checkpoint IMMER zuerst einen
    Schritt weiter (`checkpoint = nextFixedCheckpoint(checkpoint)`), BEVOR sie prueft, ob er
    faellig ist - dadurch wurde der tatsaechlich faellige, gespeicherte Checkpoint nie selbst
    gewuerfelt, sondern die Funktion sprang sofort zum naechsten (6 Stunden spaeter), erkannte
    "der ist ja noch in der Zukunft" und brach ab, OHNE JE ZU WUERFELN. Bei jedem `tick()` (alle
    paar Sekunden, solange die Seite offen ist) wurde der faellige Checkpoint so immer wieder
    uebersprungen. Nur wer tagelang komplett offline war (mehrere Checkpoints "verpasst") bekam
    zufaellig noch einen Treffer, weil dann nach dem einen Ueberspringen IMMER NOCH ein
    Checkpoint in der Vergangenheit lag - das hat den Fehler beim eigenen Testen waehrend der
    Entwicklung (immer mit mehrtaegigem Backfill getestet) verdeckt.
    - **Fix:** Reihenfolge getauscht - erst pruefen, ob der AKTUELL gespeicherte Checkpoint
      faellig ist (`if (checkpoint > now) return checkpoint;`), NUR bei einem Fehlschlag (Wuerfel
      nicht getroffen) einen Schritt weiterruecken, um ggf. weitere verpasste Checkpoints
      nachzuholen.
    - **Getestet:** 500 Durchlaeufe mit einem gerade erst faellig gewordenen Checkpoint und 60%
      Chance ergaben vorher 0 Treffer (exakt der beobachtete Fehler), nachher ~56% Treffer (nahe
      am erwarteten Wert). Der bestehende Mehrtage-Backfill-Fall (verpasste Checkpoints waehrend
      Abwesenheit nachholen) funktioniert unveraendert weiter (200/200 Treffer im Test).
    - Betrifft sowohl Raids (`RAID_SPAWN_CHANCE`) als auch Notruf-Events (`EVENT_SPAWN_CHANCE`),
      da beide dieselbe Funktion nutzen - erklaert, warum ueber mehrere Tage keines von beiden
      ausgeloest wurde, obwohl beide Systeme komplett unabhaengig voneinander laufen (keine
      Ueberschneidung/Konflikt zwischen ihnen, wie zunaechst vermutet).

56. **Check-Zeitpunkte auf deutsche Ortszeit umgestellt, Raid und Notruf laufen jetzt versetzt
    im 3-Stunden-Wechsel statt zur selben Zeit.** Vorher liefen beide auf denselben UTC-Stunden
    (`FIXED_CHECK_HOURS_UTC = [0,6,12,18]`), jetzt getrennt: Raid `RAID_CHECK_HOURS_LOCAL =
    [0,6,12,18]`, Notruf `EVENT_CHECK_HOURS_LOCAL = [3,9,15,21]` - beide in Berliner ORTSZEIT
    (nicht mehr UTC), sodass sich beide im 3-Stunden-Rhythmus abwechseln (z.B. 21 Uhr Notruf,
    00 Uhr Raid, 03 Uhr Notruf, 06 Uhr Raid, ...).
    - **Sommer-/Winterzeit-Umrechnung** (`berlinOffsetHours()` in `economy.ts`): ermittelt per
      `Intl.DateTimeFormat` mit `timeZoneName: 'shortOffset'` den aktuellen UTC-Versatz fuer
      Europe/Berlin (+1 im Winter/CET, +2 im Sommer/CEST) und rechnet die deutschen Ortszeit-
      Stunden bei JEDER Checkpoint-Berechnung frisch in UTC-Stunden um - deckt den Wechsel
      zwischen Sommer- und Winterzeit automatisch ab. Einzige (bewusst hingenommene)
      Ungenauigkeit: in der exakten Wechselnacht selbst (2x im Jahr) kann ein einzelner
      Checkpoint um eine Stunde verschoben sein - fuer ein Spiel mit wenigen Spielern kein
      Problem, keine vollstaendige Zeitzonen-Bibliothek noetig.
    - **`nextFixedCheckpoint()`/`rollFixedCheckpoints()` nehmen jetzt einen `localHours`-Parameter**
      (Standardwert `RAID_CHECK_HOURS_LOCAL`, damit bestehende Aufrufe ohne den Parameter nicht
      brechen) - raids.ts/events.ts/state.ts uebergeben jeweils explizit ihren eigenen
      Stundensatz.
    - **Keine Migration noetig:** bereits gespeicherte `nextRaidCheck`/`nextEventCheck`-Zeitstempel
      (unter dem alten UTC-Schema berechnet) bleiben als rohe Zeitstempel weiterhin gueltig, bis
      sie erreicht werden - der DARAUFFOLGENDE Checkpoint wird dann automatisch nach dem neuen
      deutschen Ortszeit-Rhythmus berechnet. Der Umstieg passiert also von selbst beim naechsten
      faelligen Check, ohne Sonderbehandlung beim Laden alter Spielstaende.
    - Getestet: naechster Raid-Checkpoint korrekt auf Berliner 00:00 Uhr berechnet, naechster
      Notruf-Checkpoint auf Berliner 21:00 Uhr (3 Stunden auseinander, wie vorgesehen); je 500
      Durchlaeufe mit frisch faelligem Checkpoint bei 60%/40% Chance ergaben ~299/217 Treffer
      (Bugfix aus Punkt 55 bleibt korrekt wirksam).

57. **BUGFIX: Alle Popups (Kampfbericht/InfoModal/LoreModal) wurden am oberen Rand von der
    Ressourcenleiste verdeckt.** Ursache war eine klassische CSS-Stacking-Context-Falle: `#mainbar`
    hat `backdrop-filter: blur(8px)` (fuer den Glas-Effekt) - das erzeugt per Spezifikation einen
    EIGENEN Stacking-Context fuer alle Nachfahren. Da `#combat-modal` (`position:fixed;
    z-index:1000`) als Kind von `#mainbar` gerendert wurde, galt sein `z-index:1000` nur INNERHALB
    von `#mainbar`s Stacking-Context - er wurde nie mit der `<ResourceBar>` verglichen, die als
    eigenstaendiges Element auf oberster Ebene ein explizites `z-index:10` traegt. Ein
    z-index:1000, das in einem fremden Stacking-Context "gefangen" ist, gewinnt NIE gegen ein
    z-index:10 ausserhalb davon, egal wie hoch die Zahl ist - deshalb lag die Ressourcenleiste
    trotz niedrigerem Wert sichtbar ueber dem oberen Rand jedes Popups.
    - **Fix:** `InfoModal.tsx`, `LoreModal.tsx` und das `DetailModal` in `Nachrichten.tsx` (der
      Kampfbericht) rendern jetzt ueber `createPortal(..., document.body)` direkt in den
      Dokument-Body statt inline im normalen Seitenbaum - dadurch entkommt das Popup `#mainbar`s
      Stacking-Context komplett, ohne dass der Blur-Effekt auf `#mainbar` selbst angetastet
      werden musste. Betraf alle drei Popup-Komponenten gleichermassen (gleiche
      `#combat-modal`/`#modal-box`-Struktur), nicht nur den Kampfbericht.
    - Bei kuenftigen neuen Popup-artigen Komponenten mit `position:fixed`-Overlay: IMMER per
      `createPortal` rendern, nie inline - sonst tritt dieselbe Falle wieder auf, sobald sie
      irgendwo unterhalb von `#mainbar` eingebunden werden.

58. **Neu: KI-Spieler** (`game/bot.ts`). Zwei Bot-Accounts ("KI-Vega", "KI-Nyx", siehe
    `BOT_USERNAMES`), technisch ganz normale Nutzer mit eigenem `PlayerState` und eigener
    Galaxie-Position - unterscheiden sich von echten Spielern NUR durch das neue `is_bot`-Flag in
    der `users`-Tabelle (`db.ts`, per Migration nachgeruestet).
    - **Bewusst KEINE Sonderkonditionen:** jeder Entscheidungs-Baustein ruft exakt dieselben
      Aktionsfunktionen auf, die auch die UI fuer Menschen nutzt (`startBuild`,
      `startBuildingConstruction`, `startResearch`, `sendFleet`, `respondToGroupOperation`,
      `startHoldDeployment`, ...) - identische Kosten, Bauzeiten, Flugzeiten. Ein Aufruf schlaegt
      einfach `{ok:false}` fehl, wenn nicht leistbar oder ein Slot belegt ist - eigene
      Kostenformeln mussten dafuer nicht dupliziert werden.
    - **`ensureBotUsers()`** legt beide Accounts einmalig beim Serverstart an (`index.ts`,
      idempotent ueber Namens-Check), mit zufaelligem, irrelevantem Passwort - Bots loggen sich
      nie ueber die UI ein, ihr `PlayerState` wird ausschliesslich ueber `runBotTurn()` gesteuert.
    - **`runBotTurn()` laeuft im globalen Heartbeat** (`heartbeat.ts`, alle 2 Minuten bzw. bei
      externem Pinger-Aufruf) NACH der normalen Zeit-Verarbeitung (Missionen/Raids/Notruf) fuer
      jeden Bot-Account, mit einer festen Prioritaeten-Reihenfolge:
      1. Energie-Engpass beheben (Solarkraftwerk), sonst Minen ausbalanciert ausbauen
         (niedrigste Stufe zuerst), danach frueh Roboterfabrik, spaeter Nanitenfabrik.
      2. Forschung: erste noch nicht maximierte Technologie in Listen-Reihenfolge.
      3. Schiffe: erst Mining-Schiffe bis 50 Stueck (Wirtschaft zuerst), danach Kampfschiffe.
      4. Verteidigungsanlagen: einfacher Basis-Ausbau.
      5. Mining-Schiffe zum passenden Asteroiden-Feld schicken (Sektor-Wahl nach Flottengroesse).
      6. Elite-Bollwerk: offene Einladungen annehmen (30% der verfuegbaren Kampfflotte),
         als Ersteller starten sobald alle eingetroffen sind (Rendezvous, siehe Punkt 51), mit
         kleiner Zufallschance (5%/Heartbeat) selbst eine Expedition eroeffnen und dabei ALLE
         menschlichen Spieler einladen.
      7. Menschlichen Spielern gelegentlich (10%/Heartbeat, nur falls dort noch keine eigene
         Flotte haelt/unterwegs ist) eine Teilflotte (15% der Kampfschiffe) zum Halten schicken -
         verteidigt sie dann automatisch mit bei Piratenraids (Punkt 51), genau wie eine
         menschliche Halten-Flotte.
    - **Eigene Verteidigung gegen Raids/Notruf braucht KEINEN bot-spezifischen Code** - Bots
      durchlaufen dieselben `processRaidTimer()`/`processEventTimer()`-Aufrufe wie jeder andere
      Nutzer im Heartbeat, ihre selbst gebaute Flotte/Verteidigung zaehlt genauso in die
      Kampfberechnung.
    - **Client:** `isBot`-Flag bis in `AppUser`/`GalaxyOccupant` durchgereicht, Bots erscheinen in
      der Galaxie-Ansicht mit 🤖-Markierung neben ihrem Namen.
    - Getestet: 5 simulierte Heartbeat-Durchlaeufe fuer einen frischen Bot-Account fuellten
      korrekt Gebaeude-Warteschlange (Metallmine), Schiffs-Warteschlange (3x10 Mining-Schiffe,
      bis `MAX_BUILD_SLOTS` erreicht) und Forschungs-Warteschlange (4 Technologien, bis
      `MAX_RESEARCH_SLOTS` erreicht); ein Bot nahm eine echte Elite-Bollwerk-Einladung eines
      Testnutzers korrekt mit 30% seiner Kreuzer-Flotte an.
    - **Nebenbei entdeckt und behoben:** `processEventTimer()` wurde im Heartbeat ohne `await`
      aufgerufen (seit der Notruf-Flugzeit-Erweiterung in Punkt 51 async) - dadurch haette
      `savePlayerState()` teils VOR Abschluss einer Notruf-Kampfaufloesung greifen koennen
      (Race Condition). Ergaenzt.

59. **BUGFIX: Server stuerzte beim Start komplett ab, wenn das `data`-Verzeichnis fehlte** -
    `better-sqlite3` legt das Verzeichnis fuer die SQLite-Datei NICHT selbst an; fehlt es (z.B.
    nach einem Redeploy ohne persistenten Datenspeicher, oder wenn es aus irgendeinem Grund
    geloescht wurde), wirft `new Database(dbPath)` in `db.ts` sofort beim Modul-Import eine
    Exception - NOCH BEVOR Express startet oder irgendein Log ausgegeben wird. Fuer den Betreiber
    sah das aus wie "das Spiel laeuft nicht mehr", ohne erkennbare Fehlermeldung im normalen
    Anwendungslog (nur im rohen Prozess-Stderr sichtbar: "Cannot open database because the
    directory does not exist").
    - **Fix:** `fs.mkdirSync(dataDir, { recursive: true })` in `db.ts`, BEVOR die Datenbank
      geoeffnet wird - legt das Verzeichnis defensiv an, egal ob es beim Start existiert oder
      nicht.
    - Getestet: Server startet jetzt sowohl mit als auch OHNE vorhandenes `data`-Verzeichnis
      sauber durch (vorher: sofortiger Absturz ohne Verzeichnis, Exit-Code 1); anschliessender
      voller Smoke-Test (Registrierung, `/game/data`, `/game/state`) erfolgreich.

60. **Sichtbare Fehleranzeige im Client** (`components/ErrorBoundary.tsx`, `errorOverlay.ts`,
    eingebunden in `main.tsx`) - vorher verschwand die App bei einem JS-Fehler stillschweigend
    (nur Hintergrundbild blieb sichtbar), ohne jeden Hinweis auf die Ursache. Problematisch
    insbesondere fuer Nutzer OHNE Zugriff auf die Browser-Entwicklertools (z.B. mobil ueber
    Samsung DEX, kein PC verfuegbar) - Diagnose war ohne sichtbaren Fehlertext praktisch
    unmoeglich.
    - **`ErrorBoundary`** (React Class Component, `getDerivedStateFromError`/`componentDidCatch`)
      faengt Fehler WAEHREND des Renderns ab, zeigt Fehlermeldung + Stacktrace + Komponenten-Stack
      in einem Vollbild-Overlay statt eines leeren/verschwindenden Bildschirms. Umschliesst
      `<App />` in `main.tsx`.
    - **`errorOverlay.ts`** deckt Fehler AUSSERHALB von Reacts Render-Zyklus ab (Promises/
      async-Code, Event-Handler) - ueber `window.addEventListener('error'/'unhandledrejection')`
      in `main.tsx` registriert, da React-ErrorBoundaries diese NICHT abfangen (React-Doku:
      Error Boundaries fangen nur Fehler in Lifecycle-Methoden/Render/Constructor ab).
    - Beide Wege sind bewusst getrennt (Komponenten-Baum-Fehler vs. alles andere), decken
      zusammen aber praktisch jeden JS-Fehler ab, der die App sonst unsichtbar zum Absturz
      gebracht haette.

61. **BUGFIX: Sektor-Tab stürzte beim Wechsel zwischen "Asteroiden-Feld" und "Piraten-Sektor"
    komplett ab (React error #310 "Rendered more hooks than during the previous render"), dank
    Punkt 60 erstmals sichtbar geworden.** Ursache: `useGalaxyPreview()` (aus Punkt 52) wurde
    direkt in der `.map()`-Schleife ueber `sektorenInTab` aufgerufen, in derselben Komponente wie
    die Seite selbst - beim "Asteroiden-Feld"-Tab sind das 3 Sektoren (3 Hook-Aufrufe), beim
    "Piraten-Sektor"-Tab aber 4 (`piraten_elite` beginnt ebenfalls mit `"piraten_"` und wird vom
    Tab-Filter mitgezaehlt) - die Anzahl der Hook-Aufrufe AENDERTE SICH beim Tab-Wechsel innerhalb
    DERSELBEN Komponente, was React explizit verbietet (Regeln der Hooks: IMMER dieselbe Anzahl/
    Reihenfolge von Hook-Aufrufen bei jedem Render). Genau das Muster, das schon in Punkt 52 fuer
    `PendingInviteCard` (Multiplayer.tsx) bewusst vermieden wurde ("eigene Komponente statt Hook
    in variabel-langer `.map()`-Schleife") - hier bei den Sektor-Karten aber uebersehen, weil die
    Laenge FUER JEDEN EINZELNEN TAB fuer sich genommen konstant erschien (3 bzw. 4), der
    Tab-WECHSEL selbst aber trotzdem die Hook-Anzahl innerhalb derselben Komponente veraendert.
    - **Fix:** neue `SektorCard`-Komponente extrahiert (`Sektor.tsx`) - jede Sektor-Karte ist jetzt
      eine eigene Komponenteninstanz mit eigenem, stabilem `useGalaxyPreview()`-Aufruf,
      unabhaengig von der Gesamtzahl der Karten oder Tab-Wechseln.
    - **Wichtige Lehre fuer kuenftigen Code:** ein Hook-Aufruf in einer `.map()`-Schleife ist NUR
      dann sicher, wenn die Array-LAENGE UEBER ALLE MOEGLICHEN ZUSTAENDE dieser Komponente hinweg
      IMMER gleich bleibt (nicht nur "meistens" oder "pro Ansicht") - im Zweifel IMMER eine eigene
      Unterkomponente pro Listenelement extrahieren, wie bereits in Punkt 52 als Grundsatz notiert.
    - Ohne die sichtbare Fehleranzeige aus Punkt 60 waere dieser Bug vermutlich unbemerkt
      geblieben (Symptom vorher: App laedt kurz, verschwindet dann wieder - ohne jeden Hinweis
      auf die Ursache, siehe Diagnose-Verlauf).

62. **Neue Forschung: Antriebstechnik** (`data/research.ts`, id `antrieb`) - verkuerzt ALLE
    Flugzeiten in der Galaxie um 3% pro Stufe, bei Stufe 10 (Maximum, wie jede Forschung ueber
    `MAX_RESEARCH_LEVEL`) also 30% schneller. Nutzt die bestehende Forschungs-Infrastruktur
    unveraendert (Kosten/Bauzeit/Warteschlange) - kein neues System noetig, nur ein neuer
    Eintrag im `RESEARCH`-Array plus Verdrahtung in `galaxyFleetSpeed()`.
    - **`galaxyFleetSpeed(ships, research?)`** (`galaxy.ts`) nimmt jetzt optional die Forschung
      des Absenders entgegen und multipliziert die Basisgeschwindigkeit (langsamstes Schiff der
      Flotte) mit `1 + Stufe * 0.03`, BEVOR sie in `galaxyDurationMs()` einfliesst. Optionaler
      Parameter, damit kein bestehender Aufruf bricht - ohne Forschungskontext gilt weiterhin die
      reine Basisgeschwindigkeit.
    - **Wessen Forschung zaehlt, ist ueberall der ABSENDER der jeweiligen Flugbewegung:** eigene
      Forschung bei Sektor-Missionen (`missions.ts`), Notruf (`events.ts`), Halten inkl. Rueckruf
      (`galaxy.ts`) und der Vorschau-Route (`routes.ts`).
    - **Elite-Bollwerk-Sonderfall (zwei Etappen, zwei unterschiedliche Regeln):** beim
      Rendezvous-Flug (Teilnehmer fliegt zum Ersteller) zaehlt die Forschung des ANTWORTENDEN
      Teilnehmers selbst (`respondToGroupOperation()`); beim anschliessenden gemeinsamen
      Weiterflug zum Ziel zaehlt bewusst NUR die Forschung des ERSTELLERS
      (`startGroupOperation()`, `combinedShips` aller Teilnehmer, aber `state.research` = der
      Ersteller "befehligt" den Konvoi) - einfachste, nachvollziehbare Regel statt eines
      Mittelwerts ueber alle Teilnehmer.
    - Getestet: Leichter Jaeger (Basisgeschwindigkeit 12500) ergab bei Forschungsstufe 5 korrekt
      ~14375 (+15%), bei Stufe 10 korrekt 16250 (+30%).

63. **Ressourcenleiste, Sidebar und Hauptbereich zu EINEM zusammenhaengenden Fenster
    verschmolzen** (`theme.css`), Deckkraft insgesamt auf "Mittel" reduziert (~45% statt vorher
    ~72%, Blur von 8px auf 6px) - Hintergrundbild kommt dadurch deutlich staerker zur Geltung.
    Vorschau mehrerer Deckkraft-Stufen wurde vorher als eigenstaendiges HTML-Mockup mit dem
    echten Hintergrundbild gezeigt (Nutzer hat "Mittel" gewaehlt), bevor es in den echten Code
    uebernommen wurde.
    - **Kein `overflow:hidden` auf einem gemeinsamen Wrapper verwendet**, um die drei Bereiche
      optisch zu vereinen - das haette die `position:sticky`-Eigenschaft der `<ResourceBar>`
      riskiert (ein Vorfahr mit `overflow` ungleich `visible` bestimmt den Sticky-Bezugsrahmen).
      Stattdessen bekommt jeder der drei Bereiche (`#resourcebar`, `#sidebar`, `#mainbar`)
      identische Deckkraft/Blur-Werte OHNE Abstand dazwischen, mit gezielt nur an den AEUSSEREN
      Ecken abgerundeten Radien (`#resourcebar` oben, `#sidebar` unten-links, `#mainbar`
      unten-rechts) - wirkt wie ein Fenster, ist aber technisch weiterhin sicher getrennt.
    - **Karten (`.ship-card`, `.queue-box`) deutlich transparenter** (`rgba(36,38,43,0.35)` +
      `blur(3px)` statt vorher blickdichtem `var(--carbon-light)`) - "leicht erkennbar, Text
      bleibt lesbar", wie gewuenscht. Modal-Popups (`#modal-box`) bewusst NICHT angefasst - die
      sollen als Overlay weiterhin gut lesbar/deckend bleiben, unabhaengig vom Rest.
    - **Nachtrag (nach Live-Test):** trotz "Mittel"-Deckkraft war vom Hintergrund kaum etwas zu
      sehen - Ursache war NICHT die Panel-Deckkraft, sondern der radiale Verlauf auf `body`
      (`radial-gradient(...)`), der schon VOR den transparenten Panels existierte und fuer das
      urspruengliche `hauptbild.png` gedacht war (bis zu 88% dunkel an den Raendern). Der hat sich
      mit der neuen Panel-Abdunkelung (45%) aufaddiert - am Rand kamen so nur noch ca. 6% der
      Bildhelligkeit durch. Fix: Verlauf auf einen dezenten Farbstich reduziert (18%/28% statt
      60%/88%) - die Panels selbst uebernehmen die Lesbarkeits-Abdunkelung jetzt allein.
    - **Zweiter Nachtrag:** selbst danach war der Hintergrund gefuehlt noch zu schwach sichtbar -
      Ursache war diesmal, dass die UI (Ressourcenleiste + Layout) bis zum Rand JEDES Bildschirms
      auffuellte (kein `max-width`), auf breiten Monitoren blieb dadurch praktisch kein
      Hintergrund sichtbar. Erster Versuch: `#resourcebar`/`#layout` insgesamt als EIN Block auf
      `max-width:1400px` begrenzt und zentriert - das brachte aber einen NEUEN Bug zum Vorschein
      (naechster Punkt) und traf ausserdem nicht ganz, was der Nutzer wollte (siehe dritter
      Nachtrag).
    - **BUGFIX (`margin:auto` + Spalten-Flex-Elternelement):** durch das `margin:0 auto` auf
      `#layout` (innerhalb von `#root{display:flex; flex-direction:column;}`) wurde die
      Breitenberechnung inhaltsabhaengig statt konstant - bei WENIG Inhalt (z.B. Nachrichten-
      Seite mit zwei kleinen Boxen) schrumpfte `#layout` auf Inhaltsgroesse zusammen (schmal), bei
      VIEL Inhalt (z.B. Multiplayer) dehnte es sich bis zum `max-width`-Limit (breit) - klassische
      Flexbox-Falle: `margin:auto` auf einem Flex-Item ueberschreibt das Standard-Stretch-
      Verhalten und macht die Breite content-abhaengig (shrink-to-fit) statt konstant. Erst mit
      zusaetzlichem `width:100%` waere das behoben gewesen, wurde aber durch den finalen
      Loesungsansatz (naechster Punkt) ohnehin ueberholt.
    - **Dritter (finaler) Nachtrag - eigentlicher gewuenschter Loesungsansatz:** Nutzer wollte
      KEINEN insgesamt zentrierten Block, sondern: Ressourcenleiste bleibt volle Breite (klassische
      Kopfleiste ueber den gesamten Bildschirm), Sidebar bleibt fest am LINKEN Rand (unveraendert,
      keine Begrenzung), NUR der Hauptbereich (`#mainbar`) bekommt eine feste Zielbreite und wird
      INNERHALB der nach der Sidebar verbleibenden Flex-Restflaeche zentriert (`flex: 0 1 1100px;
      max-width:1100px; margin:12px auto;` statt `flex:1`) - dadurch bleibt sichtbarer Hintergrund
      sowohl ZWISCHEN Sidebar und Hauptbereich als auch RECHTS davon. Das behebt gleichzeitig auch
      den vorherigen Breiten-Inkonsistenz-Bug (Punkt daurber), da `#mainbar` jetzt IMMER dieselbe
      Zielbreite anstrebt, unabhaengig vom Seiteninhalt (`margin:auto` auf einem Flex-Item
      innerhalb eines ROW-Flex-Elternteils zentriert zuverlaessig auf der Hauptachse, ohne die
      Stretch-Falle von vorhin - die trat nur bei COLUMN-Flex-Eltern auf).
    - **Finale Deckkraft-Stufe: "Schlank"** (`rgba(16,16,18,0.30)` + `blur(4px)` fuer
      `#resourcebar`/`#sidebar`/`#mainbar`, eine Stufe dunkler als "Mittel") - nach diesem Schritt
      als abgeschlossen bestaetigt.
    - **BUGFIX (`App.tsx` `PAGE_BACKGROUNDS`):** fuer Shop/Nachrichten/Inventar/Statistik/Updates
      waren bereits Dateinamen eingetragen (`shop.png` usw.), OBWOHL diese Bilder noch gar nicht
      existierten - das fuehrte zu einem defekten `background-image`-Verweis (404) statt zum
      erwarteten Fallback auf `hauptbild.png`. Der Fallback (`PAGE_BACKGROUNDS[pathname] ||
      DEFAULT_BACKGROUND`) greift naemlich nur, wenn die ROUTE komplett in der Map fehlt, NICHT
      wenn die verlinkte DATEI fehlt. Fix: diese 5 Eintraege wieder entfernt, bis echte Bilder
      dafuer geliefert werden - erst DANN sollten neue Eintraege in `PAGE_BACKGROUNDS` ergaenzt
      werden, nicht vorher (sonst tritt derselbe Fehler wieder auf).

64. **Seitenspezifische Hintergrundbilder** (`App.tsx` `PAGE_BACKGROUNDS`, `theme.css`
    `--page-bg`) - jede Seite kann jetzt ihr eigenes thematisches Hintergrundbild bekommen
    (Werft -> Werft-Halle, Forschung -> Labor, Galaxie -> Sternenkarte, usw.) statt ueberall
    nur `hauptbild.png` zu zeigen.
    - **`usePageBackground(pathname)`** (neuer Hook in `App.tsx`, in `Layout` per `useLocation()`
      aufgerufen) setzt bei jedem Routenwechsel die CSS-Variable `--page-bg` auf `document.body`
      auf den zur Route passenden Dateinamen aus `PAGE_BACKGROUNDS` - faellt auf `hauptbild.png`
      zurueck, falls fuer eine Route noch kein eigenes Bild hinterlegt ist (aktuell: NUR
      `hauptbild.png` existiert tatsaechlich als Datei, alle anderen Eintraege in
      `PAGE_BACKGROUNDS` sind Platzhalter-Dateinamen fuer noch zu liefernde Bilder - fehlende
      Datei fuehrt lediglich zu leerem/keinem sichtbaren Hintergrund an dieser Route, kein
      Absturz, siehe `body`s Fallback-Layer mit der radialen Verlaufs-Ueberlagerung).
    - **Kein Ueberblenden zwischen Seitenwechseln** - CSS kann zwischen zwei verschiedenen
      `background-image`-URLs nicht weich interpolieren, der Wechsel ist bewusst hart/sofort.
    - Reine CSS-Variable statt `<img>`-Tag - kein zusaetzliches DOM-Element, kein Layout-Shift,
      funktioniert nahtlos mit dem bestehenden `background-attachment:fixed`-Verhalten.
    - **Naechster Schritt (liegt beim Nutzer):** passende Bilder fuer jede Route liefern
      (`werft.png`, `verteidigung.png`, `sektor.png`, `forschung.png`, `flotte.png`,
      `haendler.png`, `shop.png`, `multiplayer.png`, `galaxie.png`, `nachrichten.png`,
      `inventar.png`, `statistik.png`, `updates.png`), jeweils unter `client/public/background/`
      ablegen - der Code ist bereits vollstaendig darauf vorbereitet, kein weiterer
      Code-Eingriff noetig, sobald die Bilder geliefert werden.
    - **Update:** Bilder fuer Werft (`/`), Flotte, Forschung, Sektor, Galaxie, Multiplayer und
      Haendler wurden geliefert und sind aktiv. `/verteidigung` nutzt bewusst DASSELBE Bild wie
      Werft (`werft.png` statt eines eigenen `verteidigung.png`) - beide Seiten spielen sich
      thematisch am selben Ort ab (Werft-Halle). Noch offen (fallen bis dahin auf `hauptbild.png`
      zurueck): Shop, Nachrichten, Inventar, Statistik, Updates.
    - **BUGFIX (nach Live-Test): weisses Aufblitzen beim Seitenwechsel.** Ursache: `usePageBackground()`
      schaltete die CSS-Variable SOFORT auf das neue Bild um, ohne zu pruefen, ob es ueberhaupt
      schon geladen war - bis das (bis zu ~2MB grosse) Bild ueber's Netz nachgeladen war, zeigte
      der Hintergrund kurz nichts (weiss/leer), besonders auf mobilen Verbindungen spuerbar. Fix:
      neues Bild wird jetzt per unsichtbarem `Image()`-Objekt im Hintergrund VORGELADEN, das ALTE
      Bild bleibt waehrenddessen sichtbar - erst nach vollstaendigem Laden (`onload`) wird
      umgeschaltet, kein Aufblitzen mehr. Zusaetzlich laedt `usePreloadAllBackgrounds()` (neuer
      Hook, einmalig in `Layout` aufgerufen) ALLE bekannten Hintergrundbilder direkt beim
      App-Start im Hintergrund vor - dadurch ist meistens schon der ALLERERSTE Besuch jeder Seite
      sofort ohne sichtbare Wartezeit. Bereits geladene URLs werden in einem modul-weiten Set
      (`preloadedBackgrounds`) gemerkt, damit nicht bei jedem Routenwechsel erneut ueber ein
      neues `Image()`-Objekt nachgeprueft werden muss (der Browser haelt das Bild ohnehin im
      HTTP-Cache, das Set spart nur den kleinen Umweg).
    - **BUGFIX 2: Bilder verkleinert/komprimiert** - trotz Vorlade-Fix war das Aufblitzen noch
      spuerbar, da die Bilder mit ~1,8-2MB pro Stueck (unkomprimiertes PNG, 1408px Breite)
      schlicht zu gross zum schnellen Nachladen waren, besonders mobil. Alle 8 Hintergrundbilder
      (7 Seiten + `hauptbild`) auf 1280px Breite verkleinert und von PNG auf JPEG umgestellt
      (Qualitaet 78%, analog zum Vorgehen bei den Schiffsbildern in Punkt 24) - Ergebnis:
      im Schnitt von ~1,8MB auf ~180KB pro Bild, ca. 10x kleiner. Alle Code-Referenzen
      (`App.tsx` `PAGE_BACKGROUNDS`/`DEFAULT_BACKGROUND`, `theme.css` Fallback-URL) von `.png`
      auf `.jpg` umgestellt. Kuenftig gelieferte Hintergrundbilder (Shop/Nachrichten/Inventar/
      Statistik/Updates) sollten gleich als komprimiertes `.jpg` eingebunden werden, nicht mehr
      als unkomprimiertes `.png` wie urspruenglich.
    - **ZURUECKGEBAUT (nach wiederholtem Live-Test):** trotz Vorlade-Fix und Komprimierung blieb
      das Problem beim Nutzer bestehen (Ursache nicht abschliessend geklaert). Entscheidung:
      das komplette per-Route-Hintergrundbild-System wieder entfernt (`PAGE_BACKGROUNDS`,
      `usePageBackground()`, `usePreloadAllBackgrounds()` komplett aus `App.tsx` geloescht) -
      zurueck zu EINEM einzigen, festen Hintergrundbild fuer die gesamte App
      (`client/public/background/werft.jpg`, direkt in `theme.css` fest verdrahtet, keine
      CSS-Variable/JavaScript-Logik mehr dafuer noetig). Die anderen 6 gelieferten Seiten-Bilder
      (sektor/forschung/flotte/haendler/multiplayer/galaxie.jpg) bleiben als Dateien liegen,
      werden aber aktuell nirgends mehr referenziert - koennten bei Bedarf spaeter wieder
      reaktiviert werden, aktuell nicht im Einsatz.

65. **Neu: Forschungsbaum (Tech-Tree) - loest die vorherigen 13 unabhaengigen Einzelforschungen
    ab.** Was vorher unter "Geplante Erweiterungen" grob skizziert war, ist jetzt vollstaendig
    umgesetzt und getestet. 4 Hauptbereiche (`waffen`/`verteidigung`/`antrieb`/`wirtschaft`),
    21 Forschungen insgesamt (13 bestehende + 8 neue), einheitliche Voraussetzungs-Schwelle
    Stufe 3 fuer JEDE Eltern-Kind-Verbindung, `MAX_RESEARCH_LEVEL=10` bleibt ueberall gleich.
    - **Datenmodell** (`types.ts`): `ResearchDefinition` um `mainBranch`, optionales `parentId`
      (Voraussetzung) und optionales `driveType` (nur bei den 3 Antriebsklassen-Zweigen) erweitert.
      `ShipDefinition` um `driveType` erweitert (alle 15 Schiffe zugeordnet: Jaeger-Klasse +
      Versorgungsschiffe -> `rakete`, Kreuzer-Klasse -> `impuls`, Elite-Klasse + Imperator ->
      `hyperraum` - deckt sich 1:1 mit der bestehenden `SCHIFF_KLASSEN`-Gruppierung in
      `Werft.tsx`). Neue Konstante `PARENT_UNLOCK_LEVEL=3` in `combatConstants.ts`.
    - **Voraussetzungsprüfung** in `startResearch()` (`actions.ts`): lehnt eine Forschung ab,
      wenn `tech.parentId` gesetzt ist und die Elternforschung noch nicht Stufe 3 erreicht hat.
      Getestet: Zielerfassung ohne Waffen Stufe 3 korrekt abgelehnt, mit Stufe 3 erlaubt.
    - **Antriebsklassen stapeln auf die bestehende Antriebstechnik-Basis** (nicht ersetzt, wie
      besprochen): `galaxyFleetSpeed()` (`galaxy.ts`) ermittelt jetzt zusaetzlich den `driveType`
      DES LANGSAMSTEN SCHIFFS der Flotte und wendet dessen spezifische Forschungsstufe
      (2%/Stufe) MULTIPLIKATIV zusaetzlich zur allgemeinen Antriebstechnik-Basis (3%/Stufe) an.
      Getestet: Basis Stufe 5 (+15%) + Raketenantrieb Stufe 5 (+10%) auf einen Leichten Jaeger
      (Speed 12500) ergab korrekt 15812,5 (12500×1,15×1,10); ein Kreuzer (Impuls-Klasse) ohne
      Impuls-Forschung bekam im selben Test korrekt NUR den Basis-Bonus.
    - **Mining aufgesplittet** (`missions.ts` `miningMultiplier()` fuer Schiffe, neue
      `miningBuildingMultiplier()` in `actions.ts` fuer Minen-Gebaeude): die Basis-Forschung
      `mining` wirkt weiterhin auf BEIDES wie bisher (Punkt 58), die neuen Zweige "Mining-Boost:
      Schiffe"/"Mining-Boost: Minen" (je 5%/Stufe) stapeln NUR fuer ihre jeweilige Kategorie
      obendrauf. Getestet: Schiffs-Multiplikator mit Basis+Zweig korrekt 1,8 (1,5×1,2), Gebaeude-
      Multiplikator ohne investierten Minen-Zweig korrekt nur 1,5 (reine Basis).
    - **Bauzeit aufgesplittet in drei GETRENNTE Funktionen** (vorher `bauzeitMultiplier()` fuer
      Schiffe UND Verteidigung gemeinsam): `bauzeitMultiplier()` jetzt NUR Schiffe (+ Zweig
      "Bauzeit: Schiffe"), neue `defenseBauzeitMultiplier()` NUR Verteidigung (+ Zweig "Bauzeit:
      Verteidigung"), `gebaeudeBauzeitMultiplier()` NUR Gebaeude (+ Zweig "Bauzeit: Gebaeude") -
      `startDefenseBuild()` nutzt jetzt `defenseBauzeitMultiplier()` statt der gemeinsamen
      Funktion. Basis-Forschung `bauzeit` wirkt weiterhin auf ALLE drei Kategorien gleichzeitig.
      Getestet: mit `bauzeit_schiffe` Stufe 5 (-15%) ergab der Schiffs-Multiplikator 0,85,
      Verteidigung/Gebaeude blieben unveraendert bei 1,0 (kein Zweig investiert).
    - **Client-Spiegelung** (`multipliers.ts`, Punkt 1 gilt weiterhin): `getBauzeitMultiplier()`
      jetzt schiffsspezifisch, neue `getDefenseBauzeitMultiplier()` (von `Verteidigung.tsx`
      genutzt), `getGebaeudeBauzeitMultiplier()`/`getMiningMultiplier()`/neue
      `getMiningBuildingMultiplier()` entsprechend erweitert.
    - **`/game/data` liefert jetzt zusaetzlich `parentUnlockLevel`** aus, damit der Client die
      Voraussetzungs-Schwelle nicht hartcodieren muss.
    - **UI: echter Baum mit Verbindungslinien** (`Forschung.tsx` komplett neu, `theme.css`
      `.research-tree`/`.research-node`-Regeln neu) - bewaehrtes REINES CSS-Baumdiagramm-Muster
      (verschachtelte `<ul>/<li>`, jedes `<li>` zeichnet per `::before`/`::after` eine L-foermige
      Linie, die sich mit Nachbar-`<li>`s zu einer durchgehenden horizontalen Leiste verbindet,
      `ul ul::before` zeichnet den Ast vom Elternknoten herunter) - KEINE JavaScript-
      Positionsberechnung noetig, funktioniert automatisch fuer beliebig viele Kinder pro Knoten.
      Mehrere unabhaengige Basis-Baeume innerhalb eines Hauptbereichs (z.B. Verteidigung: `schild`
      und `panzerung` als zwei getrennte Baeume) werden nebeneinander in einem `.research-forest`
      (flex-wrap) dargestellt.
    - **Knoten bewusst schlank** (nur Bild, Name, aktuelle Stufe, Info-Button, Forschen-Button/
      Sperr-Symbol) - alle Details (Kosten, Zeit, Effekt, Voraussetzung, Lore) im `InfoModal`-
      Popup (bestehendes Muster wiederverwendet). Basis-Knoten (`.research-node.basis`, kein
      `parentId`) deutlich groesser dargestellt als Zweig-Knoten (`.research-node.zweig`).
    - **Info-Popup der 3 Antriebsklassen-Zweige zeigt zusaetzlich die profitierenden Schiffe**
      (`ResearchInfoContent` in `Forschung.tsx`) - DYNAMISCH aus `gameData.ships.filter(s =>
      s.driveType === tech.driveType)` ermittelt statt hartcodiertem Text, bleibt dadurch
      automatisch aktuell, falls sich die Schiffs-Antriebszuordnung spaeter je aendert.
    - **8 neue Forschungsbilder werden benoetigt** (`research/raketenantrieb.png`,
      `impulsantrieb.png`, `hyperraumantrieb.png`, `mining_schiffe.png`, `mining_minen.png`,
      `bauzeit_gebaeude.png`, `bauzeit_schiffe.png`, `bauzeit_verteidigung.png`) - fehlen aktuell
      noch, der bestehende `onError`-Fallback blendet das Bild bis dahin einfach aus.
    - **Nachtrag (nach Live-Test):** die urspruengliche Umsetzung nutzte externe CSS-Klassen
      (`.research-tree`/`.research-node` in `theme.css`, klassisches verschachteltes `<ul>/<li>`-
      Baumdiagramm-Muster) - beim Live-Test blieben Bilder/Knoten komplett unstyled (riesige
      Bilder in voller Breite, keine erkennbare Baumstruktur, keine Verbindungslinien). Ursache
      nicht abschliessend geklaert (vermutlich eine Deploy-/Cache-Unstimmigkeit bei der
      CSS-Datei), aber statt der Ursache hinterherzujagen: **komplett auf Inline-Styles
      umgestellt** (`Forschung.tsx`) - Knotengroesse, Bildgroesse, Kartenoptik UND die
      Verbindungslinien (kleine `<div>`-Striche statt `::before`/`::after`-Pseudoelemente) werden
      jetzt alle direkt im Bauteil selbst berechnet, OHNE jede Abhaengigkeit von externen
      CSS-Klassen ausser den globalen `--border-bright`/`--accent-kristall`-Variablen (die schon
      ganz am Dateianfang definiert sind und daher praktisch nie fehlen koennen). Robuster gegen
      genau diese Art von Cache-/Deploy-Problem, auch wenn dadurch mehr Code direkt im
      TSX steht statt sauber in der CSS-Datei getrennt. Die nun ungenutzten CSS-Klassen wurden
      wieder aus `theme.css` entfernt.

66. **PERFORMANCE-NOTMASSNAHME: Server brach auf dem Render-Starter-Tarif (0,5 CPU / 512MB RAM)
    zusammen, als zwei Kampfaufloesungen (Raids bei beiden Spielern) exakt zur selben Zeit
    (0:00 Uhr, gemeinsamer Checkpoint) liefen.** Jede Kampfaufloesung laeuft in einem eigenen
    Worker-Thread (siehe Punkt 2/`combatRunner.ts`) - zwei davon gleichzeitig auf einer derart
    knapp bemessenen Instanz hat den Server ueberlastet ("Instance failed" im Render-Log).
    Drei Gegenmassnahmen, alle umgesetzt und getestet:
    - **KI-Spieler-Feature wieder komplett zurueckgezogen** (war erst kurz zuvor eingefuehrt,
      Punkt 58) - jeder zusaetzliche Account bedeutet zusaetzliche Verarbeitung (Bauen/Forschen/
      Fliegen/Halten) bei JEDEM Heartbeat-Tick, zusaetzlich zum eigentlichen Auslastungsproblem.
      `ensureBotUsers()`-Aufruf in `index.ts` durch neue `removeBotUsers()` (`db.ts`) ersetzt -
      loescht bestehende Bot-Accounts (Nutzer + Spielstand) beim naechsten Serverstart komplett,
      nicht nur die Bot-LOGIK abschalten (sonst wuerden sie weiterhin bei JEDEM Tick mit-
      verarbeitet, inkl. eigener Raid-/Notruf-Checks). `runBotTurn()`-Aufruf aus `heartbeat.ts`
      entfernt. `bot.ts` selbst bleibt unveraendert im Repo liegen (dormant, nicht mehr
      importiert) - kann bei Bedarf spaeter reaktiviert werden, wenn mehr Serverleistung
      verfuegbar ist.
    - **Notruf-Events deaktiviert** (`EVENTS_ENABLED = false` in `events.ts`) - spawnen vorerst
      NICHT mehr neu, jede zusaetzliche gleichzeitig laufende Kampfaufloesung erhoeht das
      Absturzrisiko. Bewusst nur die SPAWN-Aufrufe deaktiviert (in `processEventTimer()` und
      `processOverdueEventsForOtherUsers()`), nicht der komplette Code entfernt - bereits aktive/
      unterwegs befindliche Notrufe werden weiterhin normal zu Ende gefuehrt (kein hartes
      Abbrechen mitten im Flug), es entstehen nur keine NEUEN mehr. Getestet: 20 `tick()`-
      Durchlaeufe mit kuenstlich faelligem Checkpoint erzeugten korrekt kein einziges Event.
    - **Raids: kein Wuerfeln mehr, garantiert + individuell versetzte Zeiten pro Spieler.**
      Neue `RAID_SCHEDULE_BY_USERNAME`-Zuordnung (`economy.ts`): "ShadowEagle" bekommt einen
      GARANTIERTEN Raid (Chance 100% statt der bisherigen `RAID_SPAWN_CHANCE`) um 0/6/12/18 Uhr
      deutscher Zeit, "SchnelleRatte" ebenso garantiert, aber um 3/9/15/21 Uhr versetzt - beide
      koennen dadurch nie wieder gleichzeitig auftreten. Unbekannte/zukuenftige Nutzernamen
      fallen auf das alte Verhalten zurueck (gemeinsamer 0/6/12/18-Rhythmus MIT Wuerfeln,
      `getRaidSchedule()` in `raids.ts`).
      - **Migration bestehender Spielstaende:** neues `raidScheduleMigrated`-Flag (einmalig, NICHT
        bei jedem Laden - sonst waere derselbe Bug wie in Punkt 55 wieder eingefuehrt worden, da
        der Checkpoint dann nie faellig wuerde) in `loadPlayerState()` (`state.ts`) - stellt den
        `nextRaidCheck` fuer bestehende Spielstaende einmalig auf den neuen personalisierten
        Rhythmus um, statt erst graduell ueber mehrere Zyklen nachzuziehen (sonst haette der
        naechste, noch gemeinsame Checkpoint beide Spieler ein letztes Mal gleichzeitig
        getroffen).
      - Getestet: frisch angelegte Accounts "ShadowEagle"/"SchnelleRatte" bekamen korrekt
        unterschiedliche `nextRaidCheck`-Zeitpunkte (06:00 bzw. 03:00 deutscher Zeit); 200
        Durchlaeufe mit Chance 1.0 ergaben 200/200 Treffer (kein Wuerfeln mehr, vorher waere
        das bei `RAID_SPAWN_CHANCE=0.6` nur ~60% gewesen).
    - **Nicht umgesetzt, aber als Option im Hinterkopf:** eine dauerhafte Loesung waere ein
      hoeherer Render-Tarif (z.B. "Standard", 1 CPU/2GB, $25/Monat) statt struktureller
      Einschraenkungen - aktuelle Entscheidung war aber bewusst, bei "Starter" zu bleiben und
      stattdessen die Spielmechanik anzupassen.

67. **Geschwindigkeit + Antriebsklasse im Schiffs-Info-Popup ergaenzt** (Werft.tsx,
    Spezialteile.tsx) - fehlte bisher komplett, weder auf der Karte noch im Popup war der
    Speed-Wert einsehbar. Neue `driveTypeLabel()`-Hilfsfunktion (`combatInfo.ts`) uebersetzt
    `driveType` in eine lesbare Bezeichnung (Raketen-/Impuls-/Hyperraumantrieb). Bewusst NICHT
    auf der Hauptkarte ergaenzt (Punkt 14 gilt weiterhin: Karten zeigen nur Kernwerte, Speed ist
    kein staendig relevanter Wert wie Waffen/Schild/Panzerung), sondern als erste Zeile im
    Info-Popup, direkt vor den Kampfwerten.

68. **Elite-Bollwerk: garantierte Stunden-Checks + Verdopplungs-Abschlussbonus bei perfekter
    Serie.** Auf Wunsch: die vier Kaempfe waehrend der 4-stuendigen Elite-Bollwerk-Expedition
    fanden bisher nur mit 50% Chance PRO STUNDE ueberhaupt statt (`checkChance`), was den bereits
    haerteren Sektor zusaetzlich unvorhersehbar machte, ohne dafuer entsprechend zu belohnen.
    - **`checkChance` fuer `piraten_elite` auf `1` (garantiert) gesetzt** (`data/sectors.ts`) -
      alle 4 Stunden-Checks finden jetzt sicher statt, kein Wuerfeln mehr darueber ob ueberhaupt
      gekaempft wird (Sieg/Niederlage im Kampf selbst bleibt natuerlich weiterhin ergebnisoffen).
      Anzeige-Text ("Aktivitaet") von "Piraten-Chance 50%" auf "Kampf garantiert (jede Stunde)"
      angepasst.
    - **Neuer Abschluss-Bonus bei perfekter Serie** (`finalizeGroupExpedition()` in
      `groupOps.ts`): schafft eine Teilnehmergruppe alle 4 garantierten Kaempfe OHNE einen
      einzigen Rueckschlag (`op.streakWins >= 4` - wird bei jedem verlorenen Check auf 0
      zurueckgesetzt, siehe `runGroupHourlyCheck()`), wird die GESAMTE ueber die Expedition
      angesammelte Ressourcen-Ausbeute (Metall/Kristall/Deuterium, NICHT Teile/DM) am Ende
      nochmal komplett verdoppelt - zusaetzlich zur bereits bestehenden Pro-Sieg-Verdopplung
      (`REWARD_ESCALATION`-"double"-Modus, Punkt siehe README-Kommentar in `economy.ts`).
    - **Rechnung (nachvollzogen und per Skript bestaetigt):** die vier Kaempfe skalieren mit
      1x/2x/4x/8x auf die Beute-Basis (25 Mio. Metall + 15 Mio. Kristall + 10 Mio. Deuterium =
      50 Mio. Ressourcen gesamt pro Basiswert) - Summe der Multiplikatoren = 15, ergibt bei einer
      perfekten Serie **750 Millionen Ressourcen** VOR dem neuen Abschluss-Bonus, danach durch die
      Verdopplung **1,5 Milliarden Ressourcen** insgesamt fuer die komplette Expedition, verteilt
      auf ALLE Teilnehmer (jeder bekommt den vollen Betrag, keine Aufteilung nach Flottenanteil,
      siehe Punkt 5 - gilt weiterhin).
    - Getestet: `getEscalationMultiplier()`-Sequenz fuer 4 Checks ergab korrekt 1/2/4/8 (Summe 15),
      Gesamtrechnung vor/nach Bonus stimmte exakt mit 750 Mio./1,5 Mrd. ueberein;
      `SEKTOR_CONFIG.piraten_elite.checkChance` bestaetigt auf `1`.

69. **PERFORMANCE: Kampf-Engine optimiert - der eigentliche Grund, warum grosse Flotten (nicht
    nur gleichzeitige Kaempfe, siehe Punkt 66) den Server ueberlasten konnten.** Jedes einzelne
    Schiff wird als eigenes `CombatUnit`-Objekt simuliert (nicht nach Typ zusammengefasst, siehe
    `buildUnits()`/`buildUnitsMultiOwner()`) - `fireShots()` filterte dabei bei JEDEM EINZELNEN
    SCHUSS (nicht nur einmal pro Runde!) die KOMPLETTE Zielliste neu nach lebenden Einheiten
    (`targets.filter(t => t.hpCur > 0)`) - eine mit der Flottengroesse QUADRATISCH wachsende
    Ineffizienz (O(Schuetzen x Schuesse x Zielanzahl) pro Runde), verschaerft durch RapidFire
    (mehrere Schuesse pro Schiff) und bis zu 100 moegliche Runden.
    - **Fix: neue `AliveTargetPool`-Klasse** (`combat.ts`) haelt eine Liste lebender Ziele +
      eine Index-Zuordnung, damit eine gestorbene Einheit in O(1) entfernt werden kann
      (Swap-mit-letztem-Element-und-Pop) statt bei jedem Schuss neu gefiltert zu werden. Wird
      EINMAL pro `fireShots()`-Aufruf aufgebaut (nicht pro Schuss). `applyHitToTarget()` bekam
      dafuer einen optionalen `onKill`-Callback, der bei JEDEM Kill (direkter Treffer,
      Durchschlag-Kaskade, kritische Explosion) den Pool synchron haelt.
    - **Bewusst NICHT angefasst:** die deutlich seltenere Kaskaden-Zielsuche innerhalb von
      `applyHitToTarget()` (nur bei Durchschlag-Ueberschuss-Schaden relevant, max. 5x pro Schuss
      statt pro-Schuss-garantiert) - geringerer Nutzen, zusaetzliches Risiko fuer eine erste,
      kontrollierte Optimierungsrunde. Kann bei Bedarf spaeter ebenfalls optimiert werden.
    - **Sorgfaeltig verifiziert (auf Nutzerwunsch "langsam und sicher"):** alte und neue
      Implementierung mit identischem, seedbarem Pseudo-Zufallsgenerator (Mulberry32) verglichen.
      Bei EINEM einzelnen Testszenario (1.500 vs. 1.400 Schiffe) waren die Ergebnisse
      bitgenau identisch. Bei GROESSEREN/komplexeren Szenarien mit vielen Todesfaellen wichen
      einzelne Werte leicht ab - Ursache erkannt und dokumentiert: Swap-Remove aendert die
      Array-Reihenfolge, `pickRandom()` waehlt per Zufalls-INDEX - bei identischer Zufallszahl
      landet die alte und neue Version nach dem ersten Tod dadurch auf einem anderen (aber
      weiterhin gleichverteilt zufaelligen) Index. KEIN Bias, nur eine andere gueltige
      Zufallsreihenfolge. Per 300 unabhaengigen Durchlaeufen je Version statistisch bestaetigt:
      mittlere Ueberlebende/Schadenswerte/Rundenzahl zwischen alter und neuer Version lagen
      durchgehend im Rahmen normaler Zufallsschwankung (z.B. 721,4 vs. 719,8 Ueberlebende bei
      Standardabweichung ~14-15), kein systematischer Unterschied feststellbar - sowohl bei
      ueberlegenem als auch bei knappem Kraeftefeld getestet.
    - **Geschwindigkeitsmessung** (gleiche Flotte, gleiche Forschung, 19 Runden):
      1.000 Schiffe gesamt: 302ms -> 149ms; 4.000: 2.035ms -> 818ms; 10.000: 12.044ms -> 4.778ms;
      20.000: 48.139ms -> 19.001ms - durchgehend ca. 2-2,5x schneller, mit wachsender absoluter
      Zeitersparnis bei groesseren Flotten.
    - **Ehrliche Einordnung:** eine deutliche Verbesserung, aber KEINE vollstaendige Loesung -
      die Engine simuliert weiterhin jedes Schiff einzeln statt nach Typ zusammengefasst, bei
      wirklich extremen Flottengroessen bleibt Kampf grundsaetzlich rechenintensiv. Diese eine
      Zeile war aber nachweislich der groesste Einzelposten.

70. **BUGFIX: rohe interne Schiffs-IDs statt richtiger Namen in mehreren Flottenauswahl-
    Listen** (z.B. "schwer" statt "Schwerer Jäger", durchgehend klein geschrieben) - fiel beim
    Senden einer Flotte im Sektor-Tab auf, betraf aber mehrere Stellen: die normale Sektor-
    Flottenauswahl UND die Notruf-Flottenauswahl (beide in `Sektor.tsx`) sowie die
    "Zurückgekehrte Flotte"-Tabelle im Kampfbericht-Popup (`Nachrichten.tsx`). Ursache: an
    diesen drei Stellen wurde die interne `id` direkt ausgegeben, statt sie ueber die bereits
    im Projekt vorhandene `shipName(gameData, id)`-Hilfsfunktion (`combatInfo.ts`) in den
    richtigen Anzeigenamen umzuwandeln - dieselbe Funktion wird an anderer Stelle (z.B.
    Multiplayer.tsx) schon korrekt genutzt, hier schlicht vergessen.
    - `SektorCard` (Sektor.tsx) bekam dafuer `gameData` als neue Prop.
    - `DetailModal` (Nachrichten.tsx) ruft jetzt selbst `useGame()` auf, um an `gameData` zu
      kommen (vorher nur `msg`/`onClose` als Props) - mit Fallback auf die rohe ID, falls
      `gameData` ausnahmsweise noch nicht geladen ist (verhindert einen Absturz waehrend des
      allerersten Ladevorgangs).
    - Gezielt nach dem exakt gleichen Muster an allen anderen Stellen im Client gesucht (`grep`
      nach `{id}`-Ausgaben in JSX) - keine weiteren Fundstellen, Multiplayer.tsx nutzte
      `shipName()` bereits korrekt.

71. **Neu: Gebaeude-Modulsystem - analog zum Forschungsbaum (Punkt 65), aber pro Gebaeude statt
    eines gemeinsamen Baums.** 15 Module ueber alle 6 Gebaeude verteilt (9 fuer die drei Minen,
    je 2 fuer Solarkraftwerk/Roboterfabrik/Nanitenfabrik) - jedes verbessert GENAU EINEN Aspekt
    seines Basis-Gebaeudes zusaetzlich, stapelt sich mit der allgemeinen Forschung (Mining-Boost/
    Bauzeit-Zweige aus Punkt 65), ersetzt sie nicht (wie besprochen).
    - **Datenmodell** (`types.ts`): neuer `BuildingModuleDefinition`-Typ (`buildingId`,
      `moduleKind`, `requiredBuildingLevel`, `effectPerLevel`, `maxLevel`), `PlayerState.
      buildingModules: Record<string, number>` (Modul-ID -> Stufe), `BuildJob.moduleId`.
      Module nutzen bewusst DASSELBE Bild wie ihr Basis-Gebaeude (kein eigenes Bild noetig, wie
      besprochen) - der Client ermittelt es ueber `buildingId`.
    - **Voraussetzungs-Stufen wie besprochen NICHT einheitlich** (anders als beim
      Forschungsbaum, dort immer Stufe 3): Minen/Solarkraftwerk Stufe 20, Roboterfabrik Stufe 10,
      Nanitenfabrik Stufe 5. Maximalstufe pro Modul: 10 (wie ueberall sonst). Kosten/Bauzeit
      bewusst hoch angesetzt (`data/buildingModules.ts`).
    - **Vier Effekt-Kategorien (`moduleKind`), jede mit eigener Verdrahtung in `actions.ts`:**
      `output` (Foerdereffizienz der Minen, Ertragssteigerung Solarkraftwerk - `mineOutputPerHour()`/
      `energyProduced()`), `energy_reduction` (Energiesparmodul der Minen - `energyConsumed()`,
      PRO MINE einzeln), `buildtime_self` (Automatisierung/Wartungsoptimierung/Wartungsfreiheit -
      verkuerzt NUR die Bauzeit fuer weitere Ausbaustufen GENAU DIESES Gebaeudes, neuer optionaler
      `buildingId`-Parameter bei `gebaeudeBauzeitMultiplier()`), `strengthen_factor`
      (Verstaerkte Automatisierung bei Roboterfabrik/Nanitenfabrik - verstaerkt deren
      BESTEHENDEN Bauzeit-Bonus auf ALLES, ohne die Fabrik selbst weiter ausbauen zu muessen,
      direkt in `roboterNaniteFactor()` eingebunden).
    - **`startModuleUpgrade()`** (`actions.ts`) teilt sich den Bau-Slot mit `startBuildingConstruction()`
      (`MAX_BUILDING_SLOTS=1`, dieselbe `state.buildingQueue`) - ein Modul ist konzeptionell ein
      Ausbauprojekt AM Gebaeude, kein eigenstaendiges Bauvorhaben. Neue Route `/game/build/module`.
    - Getestet: Voraussetzungsprüfung (Metallmine-Modul ohne/mit Stufe 20 korrekt abgelehnt/
      erlaubt); Foerdereffizienz Stufe 5 ergab exakt Faktor 1,25 (+25%), Energiesparmodul Stufe 5
      exakt Faktor 0,75 (-25%), Solarkraftwerk-Ertragssteigerung Stufe 4 exakt Faktor 1,20 (+20%);
      Metallmine-Automatisierung Stufe 5 senkte NUR die Metallmine-Bauzeit (Faktor 0,85), liess
      die Kristallmine-Bauzeit korrekt unveraendert; Roboterfabrik-Verstaerkung Stufe 5 senkte
      sowohl Schiffs- als auch Gebaeude-Bauzeit korrekt um Faktor 0,75 zusaetzlich zum
      bestehenden Roboterfabrik-Stufen-Effekt. Voller HTTP-Test (Registrierung, `/game/data`
      liefert 15 Module, `/game/build/module` lehnt ohne Voraussetzung korrekt ab) erfolgreich.
    - **UI: derselbe Baum-Stil wie beim Forschungsbaum** (`Gebaeude.tsx`), komplett per
      Inline-Style (kein externes CSS, siehe Punkt 65 Nachtrag zum dortigen CSS-Problem) - jede
      Gebaeude-Karte bekommt darunter ihre 2-3 Modul-Knoten mit Verbindungslinie, gesperrte Module
      grau/abgedunkelt mit 🔒, alle Details im Info-Popup.

72. **PERFORMANCE (Fortsetzung von Punkt 69): Server brach weiterhin ab und zu ab, sogar bei
    nur EINEM einzelnen Kampf** - CPU UND Speicher spitzten dabei jeweils kurzzeitig auf 100%
    (vom Nutzer per Render-Metrics bestaetigt). Zwei zusaetzliche Ursachen gefunden und behoben:
    - **Worker-Thread-Pool statt Neuerzeugung pro Kampf.** Vorher wurde fuer JEDEN einzelnen
      Kampf ein komplett neuer Node-Worker-Thread erzeugt und danach wieder beendet
      (`combatRunner.ts`, `new Worker(...)` + `terminate()`) - jede Worker-Neuerzeugung hat
      einen spuerbaren Speicher-Grundverbrauch (eigener V8-Isolate), was auf der knapp bemessenen
      Starter-Instanz zusammen mit der eigentlichen Kampfberechnung zu genau den beobachteten
      Spitzen fuehren konnte, selbst bei nur einem Kampf. Fix: ein kleiner, WIEDERVERWENDETER
      Pool aus 2 dauerhaft laufenden Workern (`POOL_SIZE=2` in `combatRunner.ts`) - wird erst
      beim allerersten Kampf angelegt (kein Overhead, solange nie gekaempft wird), danach fuer
      die gesamte Laufzeit des Server-Prozesses wiederverwendet. `combat.worker.ts` liest
      Anfragen jetzt wiederholt per `postMessage` statt einmalig ueber `workerData` beim Start.
      Warteschlange (`waitQueue`) fuer den Fall, dass mehr als 2 Kaempfe gleichzeitig anfallen -
      kein unbegrenztes Worker-Wachstum. Ein fehlgeschlagener Worker wird durch einen frischen
      ersetzt (`discardWorker()`), statt den Pool-Platz dauerhaft zu blockieren.
    - **Zweite, bisher bewusst uebersprungene Ineffizienz jetzt doch behoben:** die Kaskaden-
      Zielsuche bei Durchschlag-Ueberschussschaden (`applyHitToTarget()`) filterte weiterhin bei
      JEDEM Kaskaden-Schritt die komplette Zielliste nach Typ+lebend
      (`targets.filter(t => t.typeId === X && t.hpCur > 0)`) - in Punkt 69 bewusst als "seltener,
      geringerer Nutzen" zurueckgestellt, erwies sich aber bei hoher Durchschlag-Forschung
      (viele Kaskaden-Kills pro Schuss) doch als relevant. Neue `AliveTargetsByType`-Klasse
      (nach Typ gruppierte Pools, gleiches O(1)-Entfernungsprinzip wie `AliveTargetPool` aus
      Punkt 69) - wird nur aufgebaut, wenn ueberhaupt Durchschlag-Forschung vorhanden ist
      (`overkillFraction > 0`), sonst entsteht gar kein zusaetzlicher Aufwand.
    - **Getestet:** 5 aufeinanderfolgende Kaempfe ueber den Pool liefen korrekt (konsistente
      Rundenzahlen); 3 GLEICHZEITIGE Kaempfe bei nur 2 Pool-Workern liefen alle korrekt ab (der
      dritte wartete via Warteschlange und schloss danach erfolgreich ab); Speicherverbrauch
      ueber 25 aufeinanderfolgende Kaempfe beobachtet - RSS stabilisierte sich nach kurzer
      Aufwaermphase (86,7MB -> ~112MB) und wuchs danach nicht weiter (112MB -> 116MB ueber 15
      weitere Kaempfe, kein Speicherleck). Voller HTTP-Regressionstest (Registrierung,
      Kampfsimulator, der den Pool intern nutzt) erfolgreich.

73. **PERFORMANCE-NOTMASSNAHME: Piraten-generierte Flotten auf Jaeger-Klasse (leicht/schwer)
    begrenzt.** Nutzer identifizierte anhand eines echten Kampfberichts die eigentliche
    Hauptursache der Server-Abstuerze: die generierte Piratenflotte enthielt 6828 Leichter
    Jaeger + 1703 Schwerer Jaeger - zusammen ueber 8500 einzelne Einheiten, deutlich mehr als
    die eigene oder ShadowEagles Flotte zusammen. Grund: das "schwarm"-Wellenprofil gewichtet
    guenstige, kleine Schiffe stark, ohne Obergrenze - bei sehr starken Ziel-Gegnern (hohe
    Flotten-/Verteidigungsstaerke des Spielers) fuehrte das zu ungebremstem Anwachsen der
    Jaeger-Anzahl.
    - **Neue Konstante `NPC_JAEGER_MAX_COUNT = 500`** (`combatConstants.ts`, zusammen mit
      `NPC_JAEGER_CAPPED_IDS = ['leicht', 'schwer']`) - deckelt NUR die NPC-generierten
      Piraten-/Notruf-/Verteidigungs-Wellen (`generateCappedFleet()` in `combat.ts`), NICHT die
      Spieler-eigenen Baulimits (`ShipDefinition.maxCount`, bleibt fuer Spieler-Flotten bewusst
      unbegrenzt, siehe Punkt 8 - ausdruecklich UNVERAENDERT).
      Neue Funktion `getNpcMaxCountFor()` kombiniert das normale `getMaxCountFor()` mit dieser
      zusaetzlichen NPC-only-Grenze, wird ausschliesslich in `generateCappedFleet()` verwendet.
    - **Erreicht eine Jaeger-Klasse die Grenze, weicht die Flottengenerierung automatisch auf
      andere (groessere) Schiffstypen aus**, um die restliche Ziel-Staerke zu erreichen (bereits
      bestehende Umverteilungs-Logik in `generateCappedFleet()`, keine neue Logik dafuer noetig -
      die Funktion war von Anfang an darauf ausgelegt, ein erreichtes Limit zu erkennen und den
      betroffenen Typ aus der weiteren Verteilung herauszunehmen).
    - Getestet: bei einer kuenstlich sehr hohen Ziel-Staerke (500 Mio., deutlich ueber dem
      beobachteten Vorfall) generierte die Piratenflotte korrekt exakt 500 Leichter Jaeger + 500
      Schwerer Jaeger (statt zehntausender), der Rest der Staerke verteilte sich automatisch auf
      Kreuzer/Schlachtschiff/Schlachtkreuzer/Bomber/Zerstoerer/Reaper - Gesamtzahl aller
      generierten Einheiten nur noch 1448 statt vorher vermutlich 10.000+. Spieler-Baulimits
      fuer `leicht`/`schwer` per `getMaxCountFor()` weiterhin korrekt `Infinity` (unveraendert).

## Geplante Erweiterungen (noch NICHT umgesetzt)

Dieser Abschnitt ist bewusst von der obigen Liste getrennt: alles hier ist erst besprochen,
nicht implementiert, nicht getestet. Dient als Gedaechtnisstuetze/Ausgangspunkt fuer eine
spaetere Umsetzung, nicht als Spezifikation.

### Neuer Multiplayer-Sektor: Boss-Gefecht (Piratenadmiral) - vollstaendig durchgeplant, bereit
### zur Umsetzung

Zweiter Multiplayer-Sektor NEBEN dem bestehenden Elite-Bollwerk (P9) - bewusst eine ANDERE Art
Herausforderung, kein reines "mehr Zahlen"-Duplikat. Kernidee: statt Masse an Schiffen ein
einzelner starker Boss-Gegner + wenige grosse Schiffe, plus eine wiederkehrende Rueckzugs-
Entscheidung ("Extraction") statt eines simplen Durchhalte-Checks.

**Ablauf:**
- Gesamtdauer der eigentlichen Aktion: **1 Stunde** ab Ankunft der Flotte (reine Hinflugzeit,
  abhaengig von Position/Flottengeschwindigkeit wie beim Bollwerk, zaehlt NICHT zu dieser Stunde
  dazu - die Stunde beginnt erst mit dem ersten Check).
- **Check alle 10 Minuten -> 6 Entscheidungspunkte** innerhalb der Stunde.
- Nach JEDEM gewonnenen Check: echte Risiko/Ertrag-Entscheidung - mit der bisher gesammelten
  Beute abziehen (sicher), oder weitermachen fuer mehr, aber mit steigendem Risiko (siehe
  "Eskalierende Wut" unten). Bei einer Niederlage NACH einem Weitermachen-Entschluss ist die
  gesamte bisher UNGESICHERTE Beute dieser Runde verloren (NICHT die Flotte selbst - nur die
  Beute dieses Durchlaufs).
- KEIN festes Zeitfenster, das alle Teilnehmer exakt einhalten muessen (wie beim urspruenglich
  erwogenen, dann verworfenen Zeitfenster-Konzept) - bewusst verworfen, da nicht jeder
  Mitspieler gleich gut mit engen Zeitfenstern zurechtkommt.

**Boss-Fähigkeiten (nutzen bewusst bestehende Spielmechanik kreativ, keine komplett neuen
Systeme noetig):**
1. **Eskalierende Wut:** wird der Boss NICHT besiegt (oder es wird "weitergemacht" statt
   abgezogen), werden seine Werte (Waffen/Schild/Panzerung) mit jedem weiteren Check staerker
   (Vorschlag als Ausgangswert: +15%/Check, EXAKTER Wert noch nicht final - Tuning-Parameter fuer
   die eigentliche Umsetzung). Verzahnt sich direkt mit der Rueckzugs-Entscheidung: je laenger
   gezoegert wird, desto riskanter wird "noch einmal versuchen".
2. **RapidFire-Waechter gegen Jaeger-Klasse:** starkes RapidFire speziell gegen kleine Schiffe
   (analog zum bestehenden Schere-Stein-Papier-System zwischen Kapitalschiffen, siehe Punkt 32) -
   bestraft Masse an kleinen Schiffen ganz natuerlich ueber die bestehende Kampfmechanik, ohne
   eine kuenstliche Sonderregel noetig zu machen.
3. **Gepanzerte Schwachstelle:** extrem hohe Basis-Panzerung, die ohne ausreichend investierte
   Durchschlag-Forschung (Waffensysteme-Zweig, siehe Punkt 65) grossteils wirkungslos abprallt -
   bindet die Forschungs-Entscheidungen der Teilnehmer mit ein, nicht nur die Flottenzusammen-
   stellung.

**Zugangsvoraussetzung (macht "wenige grosse Schiffe" auch MECHANISCH zur Pflicht, nicht nur zur
Empfehlung):** nur Kreuzer-Klasse und aufwaerts erlaubt - Jaeger-Klasse und Versorgungsschiffe
koennen fuer diesen Sektor gar nicht erst in die Flottenauswahl aufgenommen werden.

**Belohnungsstruktur (Grundidee steht, exakte Zahlen noch NICHT final):**
- Sicherer Sofort-Ertrag bei Abzug nach einem gewonnenen Check, moderat mit der Anzahl
  ueberstandener Checks wachsend (KEIN Verdopplungs-Modus wie beim Elite-Bollwerk - bewusst
  anders, sonst zu aehnliches Gefuehl).
- Deutlich groesserer Ertrag beim tatsaechlichen Sieg ueber den Boss (Vorschlag: vergleichbar
  zum aktuellen Bollwerk-Gesamtertrag, aber als EINMALIGE Ausschuettung statt ueber mehrere
  Checks verteilt - "Trophaeen"-Charakter statt wiederholbarem Farmen).
- Exklusive Zusatzbelohnung nur beim echten Sieg denkbar (z.B. seltener Bauplan fuer ein neues
  Spezialschiff, oder eine groessere Menge Dunkle Materie) - Idee erwaehnt, noch NICHT
  spezifiziert.

**Noch offene, aber NICHT blockierende Detailfragen fuer die eigentliche Umsetzung:**
- Exakter Eskalations-Prozentsatz pro Check (Vorschlag 15%, nicht final bestaetigt).
- Exakte Ressourcen-/Bonuswerte fuer sicheren Abzug vs. Sieg-Trophaee.
- Ob/welche exklusive Sieg-Zusatzbelohnung konkret umgesetzt wird.
- Genauer Sektor-Name/ID (Platzhalter bisher: "Piratenadmiral"), Position in der Galaxie.
- Exakte Boss-Statwerte (Waffen/Schild/Panzerung-Basiswerte, RapidFire-Tabelle gegen welche
  Jaeger-Typen genau).

### Schiffs- UND Verteidigungs-Skalierung als zusaetzliche Performance-Massnahme (zurueckgestellt)

Nutzer-Vorschlag im Anschluss an die Kampf-Engine-Optimierung (Punkt 69): Waffen/Schild/
Panzerung UND Baukosten aller Schiffe pauschal **5x** anheben. Da die Rechenlast im Kampf mit
der STUECKZAHL simulierter Einheiten skaliert (nicht mit deren Staerke, siehe Punkt 69), wuerde
dieselbe Gesamt-Flottenstaerke dann mit 5x WENIGER Schiffs-Objekten pro Kampf auskommen.
**Update: Verteidigungsanlagen gelten explizit GENAUSO** (dieselbe Begruendung - jede Anlage wird
im Kampf ebenso als eigenes Einzel-Objekt simuliert wie ein Schiff, siehe Punkt 69) - Werte UND
Kosten der Verteidigungsanlagen ebenfalls 5x, nicht nur bei Schiffen.

**Explizite Nutzer-Vorgabe, falls umgesetzt:** sowohl Werte ALS AUCH Kosten 5x, nicht nur eines
von beiden - Werte hoch, weil weniger Schiffe/Anlagen fuer dieselbe Staerke noetig sind; Kosten
hoch, damit sich erneut anwachsende Massenflotten/-verteidigung in absehbarer Zeit gar nicht
erst wieder aufbauen lassen ("bis so eine Masse wieder an Grenzen stoesst, dauert lange").

**Geplanter Uebergang bei bestehenden Massenflotten/-verteidigung (loest die "wirkt nicht
rueckwirkend"-Einschraenkung unten aktiv, statt sie einfach hinzunehmen):** Nutzer plant, nach
der Umsetzung die eigene bestehende Flotte UND Verteidigung komplett zu verschrotten
(Schrotthaendler, siehe Punkt 11/Dateibaum `Schrotthaendler.tsx`) und neu mit den dann 5x
staerkeren/teureren Einheiten aufzubauen - die Ehefrau (SchnelleRatte) soll dasselbe tun, um
weitere Server-Konflikte zu vermeiden. Damit waere die Einschraenkung "wirkt nur auf neu gebaute
Einheiten" kein echtes Problem mehr, da beide Spieler bewusst bei Null neu anfangen wuerden.

**Status: bewusst zurueckgestellt.** Erst beobachten, ob die Engine-/Worker-Pool-Optimierung
(Punkt 69/72) allein schon ausreicht, bevor an der Balance gedreht wird. Eine wichtige
Einschraenkung dazu besprochen:
- **Wirkt nur auf NEU gebaute Einheiten, nicht rueckwirkend** - wird durch den oben
  beschriebenen geplanten Verschrottungs-Uebergang aktiv aufgeloest, sobald es zur Umsetzung
  kommt, statt einfach hingenommen zu werden.
- **Jaeger-Klassen komplett entfernen** (urspruenglich mit vorgeschlagen, um "viele kleine
  Schiffe" grundsaetzlich zu vermeiden) wurde als zu tiefer Eingriff eingestuft - Jaeger sind
  bewusster Teil des Schere-Stein-Papier-Kampfsystems (RapidFire-Konter gegen Zerstoerer/Reaper,
  siehe Punkt 32) und wuerden dessen Balance mit aufreissen. Nur als allerletztes Mittel in
  Betracht ziehen, falls die 5x-Skalierung allein nicht ausreicht.

**Offene Frage fuer die eigentliche Umsetzung, falls es soweit kommt:** exaktes Verhaeltnis
Werte-Anstieg zu Kosten-Anstieg wurde angesprochen (1:1 skalieren = wirtschaftlich neutral, oder
Werte staerker als Kosten steigen lassen = zusaetzlicher Bonus fuers Umsteigen), aber noch NICHT
final entschieden - Nutzer wollte das erst nach einer Beobachtungsphase der Server-Last
klaeren.

### Geplanter Server-Umzug: Render -> Hetzner + Coolify (WICHTIG fuer einen kuenftigen neuen Chat)

**Status: pausiert, wartet auf PC-Zugriff des Nutzers - kein technischer Blocker im Code, rein
eine Verfuegbarkeits-Frage beim Nutzer.** Dieser Abschnitt ist bewusst ausfuehrlich gehalten,
damit ein KUENFTIGER neuer Chat (falls dieser hier zu voll wird, um weiterzumachen) sofort
versteht, worum es geht, ohne die gesamte bisherige Unterhaltung nachlesen zu muessen.

**Worum es geht:** Nutzer moechte vom aktuellen Render-Starter-Tarif (0,5 CPU / 512MB RAM) zu
einem eigenen Hetzner-VPS wechseln - Typ **CX33** (4 vCPU / 8GB RAM / 80GB SSD, Standort
Helsinki, ~10€/Monat), verwaltet ueber **Coolify** (Self-Hosted-Deployment-Plattform mit
Docker-Unterbau, bietet ein Render-aehnliches Dashboard-Erlebnis: Deploys, Logs, Umgebungs-
variablen, Neustarts alles per Browser-Oberflaeche statt roher Kommandozeile).

**Warum:** urspruenglich als Reaktion auf wiederholte Server-Abstuerze bei grossen Kaempfen
(siehe Punkte 66/69/72) - 8x mehr CPU-Leistung und 16x mehr RAM sollten die bisherigen Engpaesse
mit hoher Wahrscheinlichkeit vollstaendig loesen, selbst OHNE weitere Software-Optimierungen.
Bonus-Perspektive, falls der Umzug stattfindet: mit so viel mehr Leistung koennten die aktuell
deaktivierten KI-Spieler (Punkt 66) und Notruf-Events (Punkt 66) eventuell wieder reaktiviert
werden - noch keine feste Entscheidung, nur als Option festgehalten.

**Warum es aktuell noch nicht passiert:** Nutzer hat aktuell KEINEN Zugriff auf einen PC/
Terminal (nur Handy ueber Samsung DEX an einem Monitor, siehe fruehere Diagnose-Sitzung zum
weissen Bildschirm) - SSH-Key-Erzeugung und die Hetzner-Ersteinrichtung erfordern das. Wird
verschoben, bis ein PC verfuegbar ist. Nutzer hat bereits ein Hetzner-Projekt ("Expedition-
Commander") angelegt und die Server-Konfiguration im Bestell-Dialog vorbereitet (CX33, Helsinki,
Coolify-Image), aber noch NICHT kostenpflichtig bestellt.

**Was zu tun ist, sobald der Nutzer wieder anfaengt (fuer den dann aktiven Chat):**
1. Nutzer bestellt/richtet den Hetzner-Server ein (Claude kann dabei unterstuetzen, hat aber
   **keine tiefe Coolify-Erfahrung wie bei Render** - auf Screenshots/Fehlermeldungen angewiesen,
   genau wie das bisherige Vorgehen bei Render-Problemen in diesem Projekt).
2. **Umgebungsvariablen aus der bestehenden `server/.env.example`/Render-Konfiguration
   uebertragen:** `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN` (Client-URL wird sich aendern, sobald der
   Client ebenfalls umzieht oder weiterhin auf Render bleibt - noch nicht entschieden, ob NUR der
   Server umzieht oder auch der Client).
3. **UNBEDINGT auf persistenten Speicher fuer die SQLite-Datenbank achten** (Coolify-Volume fuer
   das `data`-Verzeichnis) - sonst wiederholt sich der urspruengliche Datenverlust-Fehler von
   Render (Punkt 59, fehlendes Verzeichnis bei jedem Redeploy) auf der neuen Plattform.
4. **Datenverlust BEIM Umzug selbst ist ausdruecklich vom Nutzer AKZEPTIERT** - eine frische,
   neu angelegte Datenbank auf dem neuen Server (statt einer muehsamen Daten-Migration von Render
   herueber) ist voellig in Ordnung, kein Show-Stopper. Wichtig ist nur, dass es DANACH (also ab
   dem produktiven Betrieb auf dem neuen Server) nicht wieder zu wiederholtem Datenverlust kommt
   (siehe Punkt 3 oben).
5. Nach erfolgreichem Umzug: pruefen, ob die Schiffs-/Verteidigungs-Skalierung (siehe Abschnitt
   direkt oberhalb) ueberhaupt noch noetig ist, oder ob die reine Hardware-Verbesserung schon
   ausreicht - war der urspruengliche Grund fuer beide Massnahmen (Server-Abstuerze bei grossen
   Kaempfen).

