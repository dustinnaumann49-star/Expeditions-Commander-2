# Expeditions-Commander

React + Node/Express Backend, SQLite-Datenbank.

## Deployment

Hetzner CX33 (4 vCPU / 8 GB RAM) über Coolify. Server (`/server`, Nixpacks) und Client (`/client`,
statische Seite mit SPA-Modus für React-Router) sind zwei getrennte Coolify-Ressourcen. Die
SQLite-Datei liegt auf einem persistenten Volume Mount (`/app/data`) - übersteht Redeploys.
Umgebungsvariablen: `JWT_SECRET`, `PORT=4000`, `CLIENT_ORIGIN` (muss auf die tatsächliche
Client-URL zeigen, sonst schlägt der erste Login mit CORS-Fehler fehl).

`server/package-lock.json` muss exakt synchron zur `package.json` sein - Coolify/Nixpacks nutzt
das strenge `npm ci`, das bei Abweichungen sofort abbricht (`npm install --package-lock-only` zum
Reparieren).

## Dateistruktur

```
render.yaml                          Legacy-Blueprint aus der Render.com-Zeit, nicht mehr genutzt

server/
  .env.example                       Vorlage für lokale .env (JWT_SECRET, PORT, CLIENT_ORIGIN)
  package.json                       "dev" startet tsc --watch + tsx watch parallel (siehe unten)
  data/                              SQLite-Datenbankdatei liegt hier zur Laufzeit (game.db)

  src/index.ts                       Express-Einstiegspunkt, Routen-Registrierung, startet
                                      zusätzlich den internen Heartbeat-Timer (alle 2 Min.) und
                                      den öffentlichen /api/heartbeat-Endpunkt
  src/game/heartbeat.ts              runGlobalHeartbeat() - verarbeitet Missionen/Raids/Gruppen-
                                      Expeditionen für ALLE Nutzer unabhängig von jedem Login,
                                      ruft danach runBotTurn() für die Bot-Accounts auf
  src/game/bot.ts                    KI-Spieler-Entscheidungslogik: Gebäude/Forschung/Schiffe/
                                      Verteidigung/Sektor-Missionen/Elite-Bollwerk/Halten - nutzt
                                      dieselben Aktionsfunktionen wie die UI, ensureBotUsers()
                                      legt die Accounts einmalig beim Start an

  src/db.ts                          SQLite-Zugriff: Nutzer, Spielstände, gemeinsame Operationen

  src/auth/middleware.ts             JWT-Prüfung für geschützte Routen, aktualisiert last_seen
  src/auth/routes.ts                 Registrierung/Login

  src/game/types.ts                  Alle zentralen TypeScript-Typen (PlayerState, Mission,
                                      GroupOperation, CombatResult, CombatUnitResult, usw.)
  src/game/state.ts                  Default-Spielzustand, Laden/Speichern eines Spielers,
                                      alle Migrationen für neue Felder in bestehenden Spielständen
  src/game/actions.ts                tick() (Warteschlangen abarbeiten), Bauen/Forschen starten
  src/game/routes.ts                 ALLE API-Endpunkte (/api/game/*) - zentrale Übersicht

  src/game/combat.ts                 Reine Kampf-Simulation (resolveCombat, RapidFire,
                                      Zielerfassung, Präzision, Ausweichen, kritische Treffer,
                                      Schild-Regeneration, Mehrspieler-Variante
                                      resolveCombatMultiOwner)
  src/game/combat.worker.ts          Worker-Thread-Skript - führt combat.ts in separaten
                                      Node-Threads aus (siehe "Wichtige Punkte" unten)
  src/game/combatRunner.ts           Verwaltet den Worker-Pool, reicht Kampfergebnisse zurück

  src/game/missions.ts               Solo-Missionen: Flotte entsenden, stündlicher Check, Rückkehr
  src/game/raids.ts                  Basis-Raids (inkl. Einbindung haltender Galaxie-Flotten)
  src/game/raidReinforce.ts          Liste aktiver Raids zur Navigation in der Galaxie-Ansicht
  src/game/galaxy.ts                 GESAMTE Galaxie-Logik: Distanz/Flugzeit/Treibstoff,
                                      Positionsvergabe, "Halten"-Mechanik, Übersicht,
                                      Raid-Verteidigungs-Einbindung
  src/game/groupOps.ts               GESAMTE Multiplayer-Logik: Elite-Bollwerk- und
                                      Piratenadmiral-Expeditionen (Einladen/Rendezvous/Starten,
                                      Belohnungsvergabe)

  src/game/inventory.ts              Container öffnen, Belohnungen einlösen
  src/game/economyActions.ts         Händler-Tausch, Schrotthändler, Shop (Booster/Gutscheine)
  src/game/presets.ts                Flotten-Vorlagen speichern/löschen
  src/game/simulator.ts              Kampfsimulator: rechnet mehrere Durchläufe gegen einen
                                      Sektor durch, OHNE den Spielstand zu verändern
  src/game/messages.ts               pushMessage()/clearMessages() - Nachrichten-Verlauf
  src/game/stats.ts                  PlayerStats-Punkteberechnung (POINT_WEIGHTS,
                                      calculatePoints()) und Bestenliste (getLeaderboard())

  src/game/data/ships.ts             Alle Schiffsdaten (Werte, Kosten, Bauzeit, Speed, Lore)
  src/game/data/defenses.ts          Alle Verteidigungsanlagen-Daten
  src/game/data/research.ts          Alle Forschungen (Forschungsbaum, Effekt/Stufe, Kosten, Zeit)
  src/game/data/sectors.ts           SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL
                                      (inkl. piraten_elite/piraten_admiral = Multiplayer-Sektoren)
  src/game/data/economy.ts           Booster, Gutscheine, Container, Raid-Konstanten, Belohnungs-
                                      Eskalation, feste Check-Zeitpunkte
  src/game/data/combatConstants.ts   RAPIDFIRE-Tabelle, ZIELERFASSUNG_BASE, MAX_*-Konstanten
  src/game/data/galaxyConstants.ts   Galaxie-Größe (50 Systeme x 9 Positionen), Distanz-/
                                      Flugzeit-Formel-Konstanten, Piratenbasen-Positionen
  src/game/data/buildings.ts         Alle Gebäudedaten (Metall-/Kristall-/Deuteriummine,
                                      Solarkraftwerk, Roboter-/Nanitenfabrik)
  src/game/data/buildingModules.ts   Gebäude-Module (je Gebäude 2-3 Zusatzausbauten)
  src/game/data/changelog.ts         Spielerlesbare Update-Historie für die Im-Spiel-Updates-Seite

client/
  vite.config.ts                     Dev-Proxy: /api → localhost:4000
  src/theme.css                      Komplettes Farbschema/Layout
  src/App.tsx                        Routing + Navigation (alle Seiten-Links)
  src/main.tsx                       React-Einstiegspunkt, bindet theme.css + ErrorBoundary ein

  src/context/AuthContext.tsx        Login-Zustand, Token-Verwaltung
  src/context/GameContext.tsx        Lädt Spieldaten/-zustand, stellt ALLE Spielaktionen bereit
  src/api/client.ts                  Alle fetch()-Aufrufe an den Server, ein Objekt "api"
  src/types/game.ts                  Client-seitige Typen (Spiegel von server/src/game/types.ts)

  src/lib/serverTime.ts              Server-Zeit-Offset (serverNow() statt Date.now())
  src/lib/format.ts                  formatTime() - Wochen/Tage/Stunden/Minuten/Sekunden
  src/lib/combatInfo.ts              RapidFire/Zielerfassung/Präzision/Ausweichen/Kritische
                                      Treffer/Schild-Regen-Berechnung für die UI-Anzeige
  src/lib/multipliers.ts             Alle Bauzeit-/Forschungszeit-/Produktions-Multiplikatoren.
                                      MUSS bei jeder Zeit-/Ertrags-Anzeige verwendet werden
  src/lib/useGalaxyPreview.ts        Debouncte Distanz-/Flugzeit-Vorschau zu einer Zielposition

  src/components/ResourceBar.tsx     Kopfleiste: Ressourcen, Energie, Uhr, Warn-Badges, Abmelden
  src/components/BuildQueue.tsx      Fortschrittsbalken für Bau-Warteschlangen (Lane-basiert)
  src/components/LoreModal.tsx       Popup bei Klick auf Schiffs-/Verteidigungs-/Forschungsnamen
  src/components/InfoModal.tsx       Popup mit vollem Detailwissen (RapidFire, Präzision, usw.)
  src/components/CombatReplayView.tsx  UNGENUTZT - Canvas-Kampfvisualisierung wurde aus dem
                                      Frontend entfernt, Datei bleibt für eine mögliche
                                      Reaktivierung bestehen
  src/components/ErrorBoundary.tsx   Fängt Render-Fehler ab, zeigt sie sichtbar statt stiller App-
                                      Absturz (ergänzt durch errorOverlay.ts für Fehler außerhalb
                                      des React-Render-Zyklus)
  src/components/ProtectedRoute.tsx  Leitet zu /login um, falls nicht angemeldet

  src/pages/Login.tsx                Login/Registrierung
  src/pages/Werft.tsx                Schiffe bauen
  src/pages/Verteidigung.tsx         Verteidigungsanlagen bauen
  src/pages/Forschung.tsx            Forschungsbaum + Untertab "Gebäude" (rendert Gebaeude.tsx)
  src/pages/Gebaeude.tsx             Gebäude ausbauen + Module (Untertab von Forschung)
  src/pages/Sektor.tsx               Solo-Missionen + Untertab "Kampfsimulator"
                                      (Asteroiden-Feld / Piraten-Sektor / Simulator)
  src/pages/Simulator.tsx            Kampfsimulator-Ansicht (Untertab von Sektor)
  src/pages/Flotte.tsx               Flotten-Bestandsübersicht
  src/pages/Haendler.tsx             Ressourcentausch + Untertab "Schrotthändler"
  src/pages/Schrotthaendler.tsx      Schiffe/Verteidigung verschrotten (Untertab von Händler)
  src/pages/Shop.tsx                 Booster/Zeit-Gutscheine + Untertab "Spezialteile"
  src/pages/Spezialteile.tsx         Imperator bauen (Untertab von Shop)
  src/pages/Multiplayer.tsx          Elite-Bollwerk + Piratenadmiral-Expeditionen, Untertabs
                                      "Raid-Hilfe" und "Spieler" (Online/Offline-Liste)
  src/pages/Galaxie.tsx              Galaxie-Ansicht: System-Browser, Positionsraster,
                                      Flotte "halten" (stationieren/zurückrufen),
                                      Flottenbewegungen-Übersicht (eigener Nav-Punkt)
  src/pages/RaidHilfe.tsx            Aktive Raids anderer Spieler zur Navigation (Untertab von
                                      Multiplayer) - Klick springt zur Position in der Galaxie
  src/pages/Nachrichten.tsx          Kampf-/Farmberichte mit aufklappbarer Detailansicht
  src/pages/Inventar.tsx             Container öffnen, Belohnungen einlösen
  src/pages/Updates.tsx              Spielerlesbare Update-Historie (aus gameData.changelog)
  src/pages/Statistik.tsx            Eigene Statistik-Aufschlüsselung + Bestenliste
```

## Wichtige Punkte, die eingehalten werden müssen

### Architektur-Grundregeln

1. **Jede neue Zeit-/Ertrags-Anzeige im Frontend MUSS `multipliers.ts` verwenden**, sonst zeigt
   die UI falsche Werte, sobald Forschung, Booster oder Gebäude-Module aktiv sind.

2. **Jede neue Kampf-Berechnung MUSS über `combatRunner.ts` laufen** (`runCombatInWorker` für
   Einzelspieler, `runMultiOwnerCombatInWorker` für Mehrspieler), niemals `resolveCombat` direkt
   im Haupt-Thread. Ein wiederverwendeter Worker-Pool (`POOL_SIZE = 2`, `combatRunner.ts`) läuft
   dauerhaft statt für jeden Kampf neu erzeugt zu werden (Speicher-Overhead pro Neuerzeugung war
   ein früherer Absturzgrund).

3. **An `OwnedFleetContribution`-Objekte (Mehrspieler-Kampf) dürfen NIEMALS Funktionen übergeben
   werden**, nur reine Daten (`research`, `defenseCounts`) - lassen sich nicht an einen
   Worker-Thread übergeben.

4. **Bei Mehrspieler-/Cross-User-Aktionen, die während des eigenen `tick()` oder des globalen
   Heartbeats laufen: das bereits geladene `PlayerState`-Objekt eines betroffenen Nutzers
   wiederverwenden, NIEMALS erneut aus der Datenbank laden, falls dieser Nutzer zufällig der
   gerade aktive Nutzer ist.** Muster: `p.userId === currentState.userId ? currentState :
   loadPlayerState(p.userId)`. Sonst überschreibt die äußere Route das Ergebnis am Ende mit einer
   veralteten Kopie.

5. **Mehrspieler-Belohnungen werden NIE geteilt.** Jeder Teilnehmer bekommt exakt das, was er auch
   bei einem Solo-Flug mit demselben Kampfausgang bekommen hätte - keine Aufteilung nach
   Flottenstärke.

6. **Jeder Mehrspieler-Kampfbericht muss aufklappbar sein** (volle `CombatDetail`-Struktur wie im
   Solo-Spiel), Flotten-Auflistung gruppiert nach Spielername (`ownerUsername` in
   `CombatUnitResult`, Gruppierung client-seitig in `Nachrichten.tsx`).

7. **Elite-Bollwerk (`piraten_elite`) und Piratenadmiral (`piraten_admiral`) sind die einzigen
   Missionen für gemeinsame Expeditionen.** Alle anderen Piraten-Sektoren bleiben Solo.

8. **Lokale Entwicklung (`npm run dev` im Server) startet zwei Prozesse** (`tsc --watch` +
   `tsx watch`) - der Worker-Thread braucht immer die kompilierte Version aus `dist/`, auch im
   Dev-Modus. Ohne den zweiten Prozess schlägt jede Kampf-Berechnung fehl.

9. **Neue Server-Routen gehören in `routes.ts`**, neue Client-API-Aufrufe in `api/client.ts` +
   `context/GameContext.tsx` (Pattern: `run(() => api.xyz(...))`). Neue Seiten müssen in `App.tsx`
   (Route + Navigationspunkt) eingetragen werden.

10. **Sidebar bewusst schlank gehalten**: Schrotthändler, Spezialteile, Gebäude und Raid-Hilfe
    haben keinen eigenen Navigationspunkt, sondern sind Untertabs von Händler, Shop, Forschung
    bzw. Multiplayer. Vor neuen Seiten erst prüfen, ob sie sich als Untertab einordnen lassen.

11. **Online/Offline-Status**: `requireAuth`-Middleware aktualisiert bei jeder authentifizierten
    Anfrage `last_seen`. "Online" = letzte Anfrage vor weniger als 15 Sekunden
    (`ONLINE_THRESHOLD_MS` in `db.ts`). Registrierung allein zählt nicht als online.

12. **Info-Popups statt vollgepackter Karten**: Werft/Verteidigung/Sektor zeigen auf der Karte nur
    Kernwerte, alles Detailwissen steckt hinter einem "ℹ️ Info"-Button (`InfoModal`; Sektor nutzt
    die exportierte `SektorInfoBox` aus `Sektor.tsx`, auch in `Multiplayer.tsx` wiederverwendet).
    Neue Karten-Seiten sollten diesem Muster folgen.

13. **Alle Popups (Kampfbericht/InfoModal/LoreModal) rendern per `createPortal(..., document.body)`**,
    nie inline im normalen Seitenbaum - sonst geraten sie durch `#mainbar`s
    `backdrop-filter`-Stacking-Context unter die Ressourcenleiste.

### Zeitgesteuerte Systeme

14. **Der Server hat keinen eigenen Dauerprozess für Spiellogik - alles läuft über zwei Schienen:**
    `tick()` (bei jeder Nutzer-Anfrage, rechnet den EIGENEN Zustand seit `lastUpdate` hoch) und
    `runGlobalHeartbeat()` (`heartbeat.ts`, per `setInterval` alle 2 Minuten in `index.ts`
    gestartet - läuft auf dem Hetzner-Server durchgehend). `tick()` verarbeitet zusätzlich zum
    eigenen Zustand auch Raid-Spawn/-Auflösung und alle laufenden Gruppen-Expeditionen für ALLE
    anderen Nutzer, damit ein einziger aktiver Spieler reicht, um das Spiel für alle
    weiterlaufen zu lassen. Bei jeder neuen zeitgesteuerten Mechanik dieses Muster übernehmen.

15. **Jeder Cross-User-Sweep (Heartbeat, Raid-Auflösung für andere Spieler, Gruppen-Operationen)
    verarbeitet jeden Nutzer/jede Operation einzeln in `try/catch`.** Eine Ausnahme bei einem
    Nutzer darf die Verarbeitung der übrigen niemals blockieren - Fehler werden geloggt statt die
    ganze Schleife abzubrechen.

16. **Feste Check-Zeitpunkte in deutscher Ortszeit** (`nextFixedCheckpoint()`/
    `rollFixedCheckpoints()` in `economy.ts`, `berlinOffsetHours()` rechnet Sommer-/Winterzeit
    automatisch um). Beim Prüfen eines Checkpoints IMMER zuerst testen, ob der aktuell
    gespeicherte Wert fällig ist, bevor er einen Schritt weitergerückt wird - sonst wird der
    fällige Checkpoint selbst nie gewürfelt (früherer Bug, siehe Kurz-Changelog).

17. **Raid-Zeiten sind seit jeher fest und pro Spieler unterschiedlich hinterlegt**
    (`RAID_SCHEDULE_BY_USERNAME` in `economy.ts`): "ShadowEagle" garantiert (Chance 1.0) um
    0/6/12/18 Uhr, "SchnelleRatte" garantiert um 3/9/15/21 Uhr - beide können nie gleichzeitig
    getroffen werden. Unbekannte/zukünftige Nutzernamen fallen auf den allgemeinen
    0/6/12/18-Uhr-Rhythmus mit `RAID_SPAWN_CHANCE` (60%) zurück (`getRaidSchedule()` in
    `raids.ts`).

18. **Globale Warn-Hinweise für laufende Raids sitzen in `ResourceBar.tsx`** (auf jeder Seite
    sichtbar, `.alert-badge` mit `pulseGlow`-Animation). Klick führt per Query-Parameter
    (`/multiplayer?tab=raid`) direkt zum passenden Tab.

### Kampfsystem

19. **Feindstärke skaliert ausschließlich auf Basiswerten der Schiffe/Verteidigung, NIE auf
    Spieler-Forschung** (`combatFleetPowerBase()` in `combat.ts`). Piraten/Raids/Elite-Bollwerk/
    Piratenadmiral profitieren in keiner Form von Spieler-Forschung. Die eigene Kampfleistung
    bleibt regulär voll forschungsabhängig - betroffen ist nur die Frage "wie stark ist der
    Gegner". Bei Mehrfachziel-Salvenschiffen (Punkt 24) gilt eine Korrektur
    (`MULTI_TARGET_POWER_CORRECTION = 8`), da reine Waffenwerte sonst massiv unterschätzt würden.

20. **Rückzugs-Mechanismus** (`RETREAT_THRESHOLD = 0.5`, `runRounds()` in `combat.ts`): Seite A
    (Spieler-Flotte inkl. Verteidigung) zieht sich zurück, sobald ihre verbliebene Kampfkraft
    (Waffen+Schild+Panzerung, nicht Stückzahl) auf 50% der Startkraft fällt - verhindert
    Alles-oder-Nichts-Ausgänge. Gilt NICHT für Heimverteidigung (Raids, `allowRetreat:false`, da
    Verteidigungsanlagen sonst die ganze Streitmacht vorzeitig mitziehen würden) und wird NICHT
    ausgelöst, wenn im selben Zug bereits der letzte Gegner fällt.

21. **RapidFire folgt einer bewussten 1:1-Rollenverteilung**, keine Häufung auf einzelne Klassen
    (RAPIDFIRE-Tabelle in `combatConstants.ts`). Nur der Bomber hat RF gegen Verteidigungsanlagen,
    der Imperator als Ausnahme gegen alles. Salvenschiffe (Punkt 24) sind komplett RF-immun.

22. **Verteidigungsanlagen-Waffenwerte sind an die Kosteneffizienz der Schiffe gekoppelt**
    (Zielwert ca. 65 Kosten/Waffenpunkt), Schild/Panzerung auf Ziel-Gesamteffizienz 1,4 kalibriert
    (spürbar zäher als Schiffe). Verteidigungsanlagen (inkl. Schildkuppel-Pool) zählen NICHT in
    die Raid-Feindstärke-Berechnung (`homePower` in `raids.ts`) - sonst würde eine zähere
    Verteidigung automatisch stärkere Angreifer heraufbeschwören.

23. **Schildkuppeln: gemeinsamer Pool statt Pro-Einheit-Verteilung.** Kleine/Große Schildkuppel
    (`maxCount:1` je) verteilen ihren Schildwert NICHT auf einzelne Anlagen, sondern bilden einen
    gemeinsamen Puffer (`computeDomeSharedPool()`), der Schaden für die GESAMTE Verteidigungsseite
    abfängt, bevor eine einzelne Anlage getroffen wird. Regeneriert sich wie normaler Schild
    zwischen Runden (Schild-Regen des Pools nutzt den reinen Basiswert ohne Größen-Modifikation).

24. **Drei Spezialschiffe mit Mehrfachziel-Salve** (`MULTI_TARGET_VOLLEY_SHIPS` in
    `combatConstants.ts`): Salvenjäger, Salvenkreuzer, Salvendreadnought - treffen bei
    erfolgreicher Zielerfassung einmal JEDEN anfälligen Schiffstyp, der gerade präsent ist. Als
    "Glaskanone" ausgelegt: extreme Waffenwerte, deutlich weniger Schild/Panzerung. RF-immun.
    MÜSSEN explizit aus der Piraten-/NPC-Flottengenerierung ausgeschlossen werden
    (`generatePiratenFleet()`/`generateFallbackFleet()` filtern `MULTI_TARGET_VOLLEY_SHIPS`) - bei
    jedem neuen Spezialschiff mit Baulimit prüfen, ob dieser Ausschluss auch dafür gilt.

25. **Kampf-Statistiken müssen besitzer-bewusst indiziert werden, nicht nur nach Schiffstyp** -
    bei Mehrspieler-Kämpfen intern mit Schlüssel `` `${ownerKey}:${typeId}` `` statt nur `typeId`
    (`statKey()` in `combat.ts`). Sonst zeigen zwei Teilnehmer mit demselben Schiffstyp identische
    aggregierte Werte, unabhängig von ihrer tatsächlichen Stückzahl.

26. **Präzision und Schild-Regeneration sind größenabhängig** (`PRECISION_MODIFIER`,
    `SHIELD_REGEN_MODIFIER`): kleine Schiffe treffen besser, laden aber schlechter Schild auf;
    große Schiffe umgekehrt. Verteidigungsanlagen: einheitlich +25% Schild-Regen, Präzision
    variiert nach Geschützgröße. Trefferermittlung über `rollHit()`: erst Präzision des Schützen,
    dann Ausweichen (`EVASION_BASE`) des Ziels. Kritische Treffer (`CRIT_CHANCE_BASE`) geben
    doppelten Schaden, große Schiffe seltener/verheerender als kleine.

27. **Kampfbericht führt Schaden ausgeteilt (`dmgDealt`) UND Schaden erlitten (`dmgTaken`)
    getrennt** - eine niedrige "erlitten"-Zahl ist keine schwache Feuerkraft, sondern das
    Gegenteil. Balance-Entscheidungen zu Schiffs-Feuerkraft anhand `dmgDealt` treffen.

28. **Wellen-Vielfalt gegen Vorhersehbarkeit**, zentral in `combat.ts`/`combatConstants.ts`:
    - Drei Zusammensetzungs-Profile (`schwarm`/`kampfgruppe`/`elitekader`, `pickWaveProfile()`) -
      unterschiedliche Gewichtskurven je Kontext (z.B. `piraten_niedrig` fast nur Schwarm,
      `piraten_hoch`/`piraten_elite` überwiegend Kampfgruppe/Elitekader).
    - Wellen-Ausreißer (`rollMultiplierWithOutlier()`): zusätzliche Chance auf deutlichen
      Ausschlag nach oben/unten über die normale 3-Werte-Tabelle hinaus.
    - Kampf-Modifikatoren (Nebel/Ionensturm/Trümmerfeld/Sensorstörung/Strahlungssturm,
      `rollBattleModifier()`): seltene Chance auf einen zusätzlichen Effekt für genau diesen
      Kampf, wird im Bericht als Klartext angezeigt, aber nie vorher in der UI angekündigt.
    - Elite-Bollwerk/Piratenadmiral kappen Ausreißer+Modifikatoren auf zusammen max. 1x pro
      GESAMTER Expedition (`eliteSurpriseUsed`), nicht pro Einzel-Check.
    - Info-Popups kündigen nur an, dass Überraschungen vorkommen können, nennen nie die genauen
      Werte/Chancen vorab - der tatsächliche Ausgang wird erst im Kampfbericht sichtbar.

29. **`generatePiratenFleet()`/`generateCappedFleet()` deckeln NPC-Jäger-Wellen auf 500 Stück je
    Klasse** (`NPC_JAEGER_MAX_COUNT`, `NPC_JAEGER_CAPPED_IDS`), aktuell über
    `NPC_JAEGER_CAP_ENABLED = false` in `combatConstants.ts` **deaktiviert** (war eine
    Render-Notmaßnahme, seit dem Hetzner-Umzug nicht mehr nötig). Spieler-eigene Baulimits sind
    davon nie betroffen. Bei erneuten Server-Lastproblemen: Schalter zurück auf `true`.

30. **Kampfbericht-Rundendaten (`CombatReplay`) werden weiterhin serverseitig aufgezeichnet, aber
    NICHT mehr im Frontend angezeigt** (Canvas-Visualisierung auf Wunsch entfernt,
    `CombatReplayView.tsx` bleibt ungenutzt liegen, falls sie später wieder gewünscht wird).

31. **Kampfsimulator (`simulator.ts`, Route `/game/simulate`) darf NIEMALS den Spielstand
    verändern** - eigene Route statt `handleAction()`, lädt nur lesend. Nutzt exakt dieselbe
    Engine wie der echte Ablauf, damit die Vorhersage aussagekräftig ist. Erlaubt auch noch nicht
    besessene Schiffe (Was-wäre-wenn-Planung). Rechnet mehrere Durchläufe, da ein Einzellauf wegen
    der Zufallsanteile irreführend wäre.

32. **`loadPlayerState()` migriert fehlende Felder in bestehenden Spielständen automatisch**
    (`state.ts`) - Forschung (über das `RESEARCH`-Array), Gebäude/Module, Galaxie-Position,
    Statistik. Bei jedem künftigen neuen Feld auf `PlayerState` hier eine Migrationszeile
    ergänzen.

### Sektoren, Missionen, Belohnungen

33. **Asteroiden-Felder laufen 12h, Piraten-Sektoren (Solo, Elite-Bollwerk, Piratenadmiral) 4h** -
    bewusst unterschiedlich je Sektor-Typ. Bei künftigen Laufzeit-Änderungen nach hartcodierten
    Stunden-Annahmen suchen, die eigentlich sektor-typ-abhängig sein müssten.

34. **Asteroiden-Eskorte sammelt Piratenkontakte in `mission.skirmishLog` statt sofort zu
    melden** - `finalizeMission`/`abortMissionDestroyed` bauen daraus EINEN gemeinsamen
    Farm-Bericht mit allen Kämpfen als aufklappbare Unterabschnitte.

35. **Belohnungs-Eskalation pro Missionsart** (`getEscalationMultiplier()`,
    `REWARD_ESCALATION` in `economy.ts`):
    - Piraten-Sektoren: Beute steigt additiv mit jedem Sieg in Folge (`Mission.streakWins`),
      gedeckelt je Gefahrenstufe. Serie bricht bei einem Check ohne vernichteten Gegner auf 0.
    - Elite-Bollwerk: Beute verdoppelt sich pro Sieg in Folge (`streakWins`,
      `'double'`-Modus), bei perfekter Serie über alle 4 garantierten Stunden-Checks
      (`checkChance = 1`) zusätzlicher Abschluss-Bonus: gesamte Ressourcenausbeute nochmal
      verdoppelt.
    - Raid: bei vollständig abgewehrtem Angriff 1-3 Container zufällig, bei teilweiser Abwehr
      genau 1. Zusätzlich Bergungs-DM (`RAID_SALVAGE_DM_PER_KILL`, gedeckelt) unabhängig vom
      Ausgang, sofern Gegner vernichtet wurden.
    - Alles pro Teilnehmer, kein Splitting (Punkt 5).

36. **Belohnungs-Container gibt es in drei Stufen** (`CONTAINER_TYPES`): Silber, Gold, Elite -
    Elite exklusiv über den Piratenkapitän im Elite-Bollwerk. Zusätzlich Jackpot-Mechanik
    (`JACKPOT_CHANCE` 5%) auf eine zusätzliche Bonus-Belohnung pro Container-Öffnung.

37. **Mining-Raten** (`farmRate` in `sectors.ts`): Niedrig 5.000, Mittel 15.000, Hoch 25.000 pro
    Schiff/Stunde. Piraten-Sektoren skalieren wie in Punkt 19 beschrieben.

38. **Piratenadmiral (`piraten_admiral`)**: zweiter Multiplayer-Sektor neben dem Elite-Bollwerk,
    andere Mechanik - ein einzelner starker Boss + kleine Eskorte statt Massenwellen, mit
    wiederkehrender Extraktions-Entscheidung ("Beute sichern" oder "weitermachen") statt eines
    reinen Durchhalte-Checks. Bis zu 6 Kämpfe im 10-Minuten-Abstand, Admiral wird pro Check +15%
    stärker ("Eskalierende Wut"). Nur Kreuzer-Klasse und größere Schiffe zugelassen
    (`ADMIRAL_ALLOWED_SHIP_IDS`). Admiral+Eskorte werden dynamisch anhand der eingesetzten
    Flottenstärke berechnet (`generateAdmiralEncounter()`, `sideBStatsOverride` in
    `combatRunner.ts` überschreibt dafür die normalen statischen Schiffswerte).

### Wirtschaft: Gebäude, Forschungsbaum, Module

39. **Sechs Gebäude** (`data/buildings.ts`): Metall-/Kristall-/Deuteriummine, Solarkraftwerk,
    Roboter-/Nanitenfabrik. Stufensystem wie Forschung (kein Limit), aber EIN globaler
    Bauslot für alle Gebäude zusammen (`MAX_BUILDING_SLOTS = 1`). Minen verbrauchen Energie,
    Solarkraftwerk erzeugt sie - reicht sie nicht, wird die Produktion ALLER Minen gemeinsam
    gedrosselt (`energyFactor()`, nie ein Bonus bei Überschuss). Roboter-/Nanitenfabrik
    verkürzen Bauzeiten multiplikativ pro Stufe (Gebäude 25%/50% pro Stufe, Schiffe/Verteidigung
    1%/2% pro Stufe - beide Effekte stapeln sich).

40. **Forschungsbaum** (`data/research.ts`): 4 Hauptbereiche (waffen/verteidigung/antrieb/
    wirtschaft), Voraussetzungs-Schwelle für jede Eltern-Kind-Verbindung ist Stufe 3
    (`PARENT_UNLOCK_LEVEL`), `MAX_RESEARCH_LEVEL = 10` überall. Antriebsklassen (Raketen-/
    Impuls-/Hyperraumantrieb, 2%/Stufe) stapeln multiplikativ auf die allgemeine
    Antriebstechnik-Basis (3%/Stufe, wirkt auf ALLE Flugzeiten). Mining- und Bauzeit-Forschung
    sind in eine allgemeine Basis + spezialisierte Zweige aufgesplittet (Mining: Schiffe/Minen
    getrennt; Bauzeit: Schiffe/Verteidigung/Gebäude getrennt) - Basis wirkt auf alle, Zweige nur
    auf ihre Kategorie. Spionage-Forschung ist als Platzhalter gesperrt (`startResearch()` lehnt
    sie ab), Aufrufstellen übergeben fest `0` statt des tatsächlichen Forschungsstands.

41. **Gebäude-Module** (`data/buildingModules.ts`): pro Gebäude 2-3 Zusatzausbauten, die GENAU
    EINEN Aspekt verbessern (Ertrag, Energieverbrauch, eigene Bauzeit, oder bei Roboter-/
    Nanitenfabrik eine Verstärkung von deren bestehendem Bauzeit-Bonus). Stapeln sich mit der
    allgemeinen Forschung, ersetzen sie nicht. Teilen sich den einen Bau-Slot mit normalem
    Gebäudeausbau.

### Galaxie & Multiplayer

42. **50 Systeme x 9 Positionen** (`galaxyConstants.ts`). Distanz-/Flugzeitformel an OGame
    angelehnt, aber gestaucht (Galaxie-Querung 20-60 Min. statt Stunden). Jede Flugbewegung
    (Sektor-Missionen, Halten, Raid-Anflug, Elite-Bollwerk-Rendezvous) nutzt dieselbe
    `galaxyDistance()`/`galaxyDurationMs()`-Formel. Wessen Forschung (Antriebstechnik) zählt, ist
    immer die des ABSENDERS der jeweiligen Flugbewegung.

43. **"Halten" ist der einzige Weg, einem anderen Spieler bei Piratenraids zu helfen.** Eine
    Flotte fliegt zu einem Zielspieler und bleibt dort unbegrenzt stationiert (kein Kampf, kein
    PvP), bis sie zurückgerufen wird - verteidigt automatisch bei JEDEM künftigen Raid dieses
    Spielers (`getHoldingDeploymentsTargeting()` in `galaxy.ts`, eingebunden in
    `resolveRaid()`). Überlebende haltender Flotten bleiben nach einem Raid reduziert weiter vor
    Ort, fliegen nicht automatisch heim. Halter bekommen dieselbe volle Belohnung wie der
    Verteidiger (Punkt 5).

44. **Piraten-Raids starten von einer von 12 festen Piratenbasen** (`PIRATE_BASES`) mit echter,
    distanzabhängiger Flugzeit: Trigger (feste Checkpoints) → 60 Min. Vorbereitungszeit → echte
    Flugzeit von der gewürfelten Basis zur Zielposition (`PIRATE_FLEET_SPEED = 7000` als
    repräsentative Geschwindigkeit).

45. **Elite-Bollwerk-Rendezvous:** eingeladene Teilnehmer fliegen nach Annahme zuerst zum
    ERSTELLER, nicht direkt zum Ziel. Der Start ist blockiert, bis alle angenommenen Teilnehmer
    eingetroffen sind. Danach fliegt die vereinte Flotte gemeinsam weiter (Geschwindigkeit =
    langsamstes Schiff über alle kombinierten Flotten, Distanz ab Ersteller-Position).

46. **Distanz-/Flugzeit-Vorschau ist auf alle Flugziele verallgemeinert** (`POST
    /game/galaxy/preview` akzeptiert `targetUserId` ODER eine feste `targetPosition`,
    `useGalaxyPreview()`-Hook clientseitig wiederverwendet). Ein Hook-Aufruf in einer
    `.map()`-Schleife ist nur sicher, wenn die Array-Länge über ALLE möglichen Zustände der
    Komponente hinweg konstant bleibt - im Zweifel immer eine eigene Unterkomponente pro
    Listenelement extrahieren (React-Hook-Regeln).

### KI-Spieler

47. **Zwei Bot-Accounts** ("KI-Vega", "KI-Nyx", `BOT_USERNAMES`) - technisch normale Nutzer,
    unterscheiden sich nur durch das `is_bot`-Flag. Nutzen exakt dieselben Aktionsfunktionen wie
    die UI (keine Sonderkonditionen bei Kosten/Bauzeiten/Flugzeiten). `runBotTurn()` läuft im
    globalen Heartbeat nach der normalen Zeit-Verarbeitung, feste Prioritäten: Energie/Minen →
    Forschung → Schiffe (erst Mining, dann Kampf) → Verteidigung → Mining-Flotten entsenden →
    Elite-Bollwerk-Einladungen annehmen/gelegentlich selbst eröffnen → gelegentlich Flotten zum
    Halten bei menschlichen Spielern schicken.

### Frontend-Konventionen

48. **`InfoTable`/`InfoModal`-Zeilen nutzen `.info-list`/`.info-list-row`** statt roher Tabellen -
    Label links gedimmt, Wert rechtsbündig.

49. **Händler/Schrotthändler nutzen `ship-grid`/`ship-card` mit Bildern**, nicht die schlichteren
    `queue-box`-Listenzeilen. Ressourcentausch über anklickbare Icon-Chips statt `<select>`.

50. **Rohe interne IDs/Enums nie direkt anzeigen** - Schiffs-IDs über `shipName()`
    (`combatInfo.ts`), Sektor-IDs über `gameData.sektoren`-Lookup, Status-Enums über eigene
    Label-Maps in lesbaren Text übersetzen.

51. **Baubarkeit und Einsetzbarkeit in Missionen sind zwei getrennte Schalter** - bei jedem neuen
    Kampfschiff müssen BEIDE gesetzt werden (`ships.ts` fürs Bauen, `COMBAT_SHIP_IDS` in
    `data/economy.ts` UND alle Client-Kopien in `Sektor.tsx`/`Multiplayer.tsx`/`RaidHilfe.tsx`
    fürs Einsetzen).

52. **Ein einziges, festes Hintergrundbild für die gesamte App**
    (`client/public/background/werft.jpg`, fest in `theme.css` verdrahtet). Ein
    per-Route-Hintergrundbild-System wurde gebaut und nach wiederholten Ladeproblemen wieder
    komplett zurückgebaut - kein neuer Anlauf ohne vorherige Absprache.

### Bilder

53. Neue Schiffs-/Gebäude-Bilder werden vor dem Einchecken komprimiert (JPEG, ~700px Breite,
    Qualität ~78%, Ziel ~60-80 KB statt mehrerer MB) - wichtig für Mobil-Ladezeiten.

## Kurz-Changelog

Stichpunkte, chronologisch, ohne Testdetails - für den vollen Kontext ggf. `git log`/`git blame`
verwenden. Die spielerlesbare Version derselben Ereignisse steht in
`server/src/game/data/changelog.ts` (Im-Spiel-Updates-Seite).

- Basis-System: Bauen/Forschen/Missionen/Raids/Inventar/Händler/Shop.
- Kampf-Engine in Worker-Thread ausgelagert, Mehrspieler-Kampfvariante ergänzt.
- Gruppen-Expeditionen (Elite-Bollwerk) als einziger Multiplayer-Sektor eingeführt.
- Schildkuppeln auf gemeinsamen Pool statt Pro-Einheit-Verteilung umgestellt.
- Besitzer-bewusste Kampf-Statistik-Schlüssel (Mehrspieler-Bug behoben).
- Verteidigungsanlagen-Kosteneffizienz an Schiffe angeglichen.
- Imperator-Werte auf das 3-fache angehoben, Bau-Limit bleibt bei 2.
- Drei Salvenschiffe mit Mehrfachziel-Salve eingeführt (und aus der NPC-Generierung
  ausgeschlossen).
- Asteroiden-Eskorte sammelt Skirmishes in einem Bericht statt vieler Einzelnachrichten.
- Rückzugs-Mechanismus (50%-Schwelle) eingeführt, später um Sieg-in-derselben-Runde-Ausnahme
  korrigiert; für Raids explizit deaktiviert.
- Kampf-Visualisierung auf echten Rundendaten (später wieder aus dem Frontend entfernt, Daten
  bleiben serverseitig erhalten).
- Präzision/Schild-Regen größenabhängig gemacht, Ausweichen und kritische Treffer eingeführt.
- Cross-User-Sweeps (Raids/Gruppen-Operationen für andere Spieler bei jedem eigenen Tick) für
  zuverlässiges Weiterlaufen ohne Dauerprozess eingeführt.
- Wellen-Vielfalt (Zusammensetzungs-Profile, Ausreißer, Kampf-Modifikatoren) gegen
  Vorhersehbarkeit ergänzt.
- Statistik/Bestenliste-Feature eingeführt.
- Feindstärke-Korrektur für Salvenschiffe (waren strukturell unterschätzt).
- Kampfbericht um "Schaden ausgeteilt" getrennt von "Schaden erlitten" ergänzt.
- Neues System: Gebäude (Minen/Solarkraftwerk/Roboter-/Nanitenfabrik, Energie-System).
- Neues System: Galaxie-Ansicht (Positionen, Distanz/Flugzeit, "Halten"-Mechanik).
- Piraten-Raids auf echte Piratenbasen-Positionen mit distanzabhängiger Flugzeit umgestellt.
- Sektor-Missionen auf echte Galaxie-Flugzeiten umgestellt.
- Raid-Hilfe (alte Verstärkungsmechanik) entfernt, ersetzt durch "Halten".
- Distanz-/Flugzeit-Vorschau auf alle Flugziele verallgemeinert.
- Diverse UI-Bugfixes: Popups hinter Ressourcenleiste verdeckt (Stacking-Context), Sektor-Tab-
  Absturz bei Tab-Wechsel (Hook-Regeln), Server-Absturz bei fehlendem `data`-Verzeichnis.
- Sichtbare Fehleranzeige im Client (ErrorBoundary + errorOverlay) eingeführt.
- Forschung Antriebstechnik eingeführt (Flugzeit-Reduktion).
- Layout überarbeitet: Ressourcenleiste/Sidebar/Hauptbereich zu einem Fenster verschmolzen,
  Deckkraft reduziert.
- Forschungsbaum eingeführt (löst 13 unabhängige Einzelforschungen ab), inkl. Antriebsklassen-
  und Mining-/Bauzeit-Zweigen.
- KI-Spieler eingeführt, wegen Server-Überlastung auf Render kurzzeitig entfernt, nach dem
  Hetzner-Umzug reaktiviert.
- Personalisierte, versetzte Raid-Zeiten pro Spieler eingeführt (Render-Notmaßnahme, weiterhin
  aktiv).
- Elite-Bollwerk: garantierte Stunden-Checks + Verdopplungs-Abschlussbonus bei perfekter Serie.
- Kampf-Engine-Performance optimiert (O(1) Ziel-Entfernung statt Neu-Filtern pro Schuss).
- Gebäude-Modulsystem eingeführt.
- Worker-Pool statt Worker-Neuerzeugung pro Kampf; zusätzliche Kaskaden-Ziel-Optimierung.
- NPC-Jäger-Wellen-Deckelung als Render-Notmaßnahme eingeführt (inzwischen deaktiviert).
- Server-Umzug Render → Hetzner (CX33, 4 vCPU/8GB) + Coolify.
- Nach dem Umzug: Jäger-Deckelung deaktiviert, KI-Spieler reaktiviert, Notruf-Event-Feature
  vollständig aus dem Code entfernt.
- Sektor P10 - Piratenadmiral eingeführt (zweiter Multiplayer-Sektor, Boss-Gefecht mit
  Extraktions-Entscheidung statt Massenwellen).

test
