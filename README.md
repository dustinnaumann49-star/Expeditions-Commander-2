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
                                      Raid-Verteidigungs-Einbindung, Heimatbasis verlegen
  src/game/galaxyPositions.ts        Gemeinsames Hilfsmodul "ist diese Galaxie-Position frei?"
                                      (Spieler/Piratenbasen/Sektoren) - genutzt von galaxy.ts
                                      (Verlegen) und galaxyEvents.ts (Spawn), bewusst OHNE
                                      Abhaengigkeit zu state.ts/galaxy.ts (Zirkelbezug-Vermeidung)
  src/game/galaxyEvents.ts           Galaxie-Ereignisse (Wrack/Handelskonvoi): Spawn, Bergungs-
                                      Rundflug (Claim + automatischer Rueckflug), Belohnung
  src/game/groupOps.ts               GESAMTE Multiplayer-Logik: Elite-Bollwerk- und
                                      Piratenadmiral-Expeditionen (Einladen/Rendezvous/Starten,
                                      Belohnungsvergabe)

  src/game/inventory.ts              Container öffnen, Belohnungen einlösen
  src/game/economyActions.ts         Händler-Tausch, Schrotthändler, Shop (Booster/Gutscheine)
  src/game/classActions.ts           Klassenwahl/-wechsel (setPlayerClass)
  src/game/boosterUtil.ts            isBoosterActive() - eigene abhängigkeitsfreie Datei, damit
                                      missions.ts/raids.ts/groupOps.ts/simulator.ts sie nutzen
                                      können, ohne einen Zirkelbezug zu actions.ts zu erzeugen
  src/game/presets.ts                Flotten-Vorlagen speichern/löschen
  src/game/simulator.ts              Kampfsimulator: rechnet mehrere Durchläufe gegen einen
                                      Sektor durch, OHNE den Spielstand zu verändern
  src/game/messages.ts               pushMessage()/clearMessages() - Nachrichten-Verlauf
  src/game/stats.ts                  PlayerStats-Punkteberechnung (POINT_WEIGHTS,
                                      calculatePoints()) und Bestenliste (getLeaderboard())

  src/game/data/ships.ts             Alle Schiffsdaten (Werte, Kosten, Bauzeit, Speed, Lore)
  src/game/data/defenses.ts          Alle Verteidigungsanlagen-Daten (inkl. Sentinel-/Ultimate-
                                      Kanone mit Mehrfachziel-Salve, Gigant-Schildkuppel)
  src/game/data/defenseModules.ts    Verteidigungs-Module (Waffen/Schild/Panzerung, kein Antrieb) -
                                      Stufen leben in DERSELBEN Map wie Schiffs-Module
                                      (state.shipModules), nur eigene Bauschlange
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
  src/game/data/shipModules.ts       Schiffs-Module (Waffen/Schild/Panzerung/Antrieb je Schiff) -
                                      alle 52 Definitionen per Generator-Funktion erzeugt statt
                                      Handarbeit (13 Schiffe x 4 Module)
  src/game/data/changelog.ts         Spielerlesbare Update-Historie für die Im-Spiel-Updates-Seite
  src/game/data/classes.ts           Klassendefinitionen (Kanonier/Bollwerk/Kommandant) inkl.
                                      aller Bonus-Konstanten und Anzeigetexte

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
  src/components/ShipBuildCard.tsx   Wiederverwendbare Schiffs-Baukarte (normale, ressourcen-
                                      finanzierte Schiffe) - gemeinsam genutzt von Werft.tsx
                                      (Hauptliste) und Spezialschiffe.tsx (Salvenschiffe)
  src/components/ShipModuleRow.tsx   Waffen-/Schild-/Panzerung-/Antriebs-Module EINES Schiffs,
                                      haengt per Verbindungslinie direkt UNTER dessen ShipBuildCard
                                      (Werft-Hauptliste UND Spezialschiffe) - bewusst KEIN eigener
                                      Tab (Nutzerentscheidung, siehe README-Punkt)
  src/components/DefenseBuildCard.tsx Wiederverwendbare Verteidigungs-Baukarte, analog zu
                                      ShipBuildCard.tsx - genutzt von allen 4 Werft > Verteidigung
                                      Untertabs
  src/components/DefenseModuleRow.tsx Waffen-/Schild-/Panzerung-Module EINER Verteidigungsanlage,
                                      haengt per Verbindungslinie direkt UNTER deren
                                      DefenseBuildCard - analog zu ShipModuleRow.tsx, kein
                                      Antriebs-Modul
  src/components/ErrorBoundary.tsx   Fängt Render-Fehler ab, zeigt sie sichtbar statt stiller App-
                                      Absturz (ergänzt durch errorOverlay.ts für Fehler außerhalb
                                      des React-Render-Zyklus)
  src/components/ProtectedRoute.tsx  Leitet zu /login um, falls nicht angemeldet

  src/pages/Login.tsx                Login/Registrierung
  src/pages/Werft.tsx                Zwei Haupttabs "Schiffe"/"Verteidigung" (ersetzt die
                                      eigenstaendige Verteidigung.tsx-Seite komplett, siehe unten).
                                      "Schiffe": Klassen-Untertabs Jäger/Kreuzer/Elite/Versorgung
                                      PLUS "Spezialschiffe" (rendert Spezialschiffe.tsx) als
                                      gleichrangiger Klassen-Tab. "Verteidigung": Klassen-Untertabs
                                      Leichte/Schwere/Schild/Spezialverteidigung. Schiffs-/
                                      Verteidigungs-Module haengen direkt unter jeder Karte, kein
                                      eigener Untertab.

  src/pages/Forschung.tsx            Forschungsbaum + Untertab "Gebäude" (rendert Gebaeude.tsx)
  src/pages/Gebaeude.tsx             Gebäude ausbauen + Module (Untertab von Forschung)
  src/pages/Sektor.tsx               Solo-Missionen + Untertab "Kampfsimulator"
                                      (Asteroiden-Feld / Piraten-Sektor / Simulator)
  src/pages/Simulator.tsx            Kampfsimulator-Ansicht (Untertab von Sektor)
  src/pages/Flotte.tsx               Flotten-Bestandsübersicht
  src/pages/Haendler.tsx             Ressourcentausch + Untertab "Schrotthändler"
  src/pages/Schrotthaendler.tsx      Schiffe/Verteidigung verschrotten (Untertab von Händler)
  src/pages/Shop.tsx                 Booster/Zeit-Gutscheine (Spezialteile/Imperator seit dem
                                      Spezialschiffe-Umzug nicht mehr hier, siehe Werft.tsx)
  src/pages/Spezialschiffe.tsx       Salvenschiffe (normale Ressourcen) + Imperator (Spezialteile,
                                      Bestand jetzt im Info-Popup statt eigener Box) - Klassen-Tab
                                      von Werft > Schiffe
  src/pages/Multiplayer.tsx          Elite-Bollwerk + Piratenadmiral-Expeditionen, Untertabs
                                      "Raid-Hilfe" und "Spieler" (Online/Offline-Liste)
  src/pages/Galaxie.tsx              Galaxie-Ansicht: System-Browser, Positionsraster,
                                      Flotte "halten" (stationieren/zurückrufen),
                                      Flottenbewegungen-Übersicht (eigener Nav-Punkt)
  src/pages/RaidHilfe.tsx            Aktive Raids anderer Spieler zur Navigation (Untertab von
                                      Multiplayer) - Klick springt zur Position in der Galaxie
  src/pages/Nachrichten.tsx          Kampf-/Farmberichte mit aufklappbarer Detailansicht
  src/pages/Inventar.tsx             Container öffnen, Belohnungen einlösen
  src/pages/Klasse.tsx               Klassenwahl (Erstwahl kostenlos) + Klassenwechsel (500 DM,
                                      via classChangeCostDm) - dieselbe Komponente wird auch als
                                      blockierende Pflicht-Ansicht in App.tsx eingebunden, solange
                                      state.playerClass === null ist
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
    0/6/12/18-Uhr-Rhythmus mit `RAID_SPAWN_CHANCE` (70%, seit der Balance-Anpassung Juli 2026)
    zurück (`getRaidSchedule()` in `raids.ts`).

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

29. **Kampfbericht-Rundendaten (`CombatReplay`) werden weiterhin serverseitig aufgezeichnet, aber
    NICHT mehr im Frontend angezeigt** (Canvas-Visualisierung auf Wunsch entfernt, die zugehörige
    `CombatReplayView.tsx` wurde als toter Code gelöscht).

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

34. **Alle Sektor-Kämpfe (Piraten-Sektoren UND Asteroiden-Eskorte) sammeln sich in
    `mission.skirmishLog` statt sofort eine eigene Nachricht zu verschicken** (Nutzerentscheidung
    Juli 2026 - ursprünglich nur für die Asteroiden-Eskorte, jetzt auch für Piraten-Sektor-
    Stunden-Checks in `runHourlyCheck()`) - `finalizeMission`/`abortMissionDestroyed` bauen daraus
    EINEN gemeinsamen Farm-Bericht bei Rückkehr, mit jedem Stunden-Check als eigener aufklappbarer
    Unterabschnitt (volle `CombatDetail`-Tabellen + Kampf-Zusammenfassungs-Balken, siehe
    Nachrichten.tsx). Stunden ohne Feindkontakt hinterlassen bewusst KEINEN Log-Eintrag und KEINE
    Zwischen-Nachricht - werden im Abschlussbericht implizit sichtbar (weniger
    `skirmishLog`-Einträge als `mission.processedHours` = ruhige Stunden dabei). Piraten-Sektor-
    Missionen erscheinen dadurch nicht mehr unter "Kampfberichte", sondern wie Asteroiden-
    Missionen gesammelt unter "Farm-/Beuteberichte".

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

42. **Zeit-Gutscheine (Shop-Kauf + Container-Belohnung) sind pro Bereich getrennt**: Schiffe,
    Verteidigung, Gebäude, Forschung - vier eigene `type`-Werte
    (`zeitgutschein_bau_schiffe`/`_verteidigung`/`_gebaeude`/`zeitgutschein_forschung`,
    `applyReward()` in `inventory.ts`). Schiffe/Verteidigung wirken auf ALLE aktuell belegten
    Lanes ihrer Warteschlange (`MAX_BUILD_SLOTS`/`MAX_DEFENSE_SLOTS = 3`), Gebäude auf den einen
    möglichen Bauslot (`MAX_BUILDING_SLOTS = 1`) - identisches Muster zum bestehenden
    Forschungs-Gutschein (wirkt auf alle `MAX_RESEARCH_SLOTS`). Legacy-Fallback: der alte,
    unaufgeteilte Typ `zeitgutschein_bau` (vor dieser Änderung vergeben) wird in `applyReward()`/
    `redeemRewardItem()` weiterhin als "Schiffe" behandelt, falls ein Spieler noch ein solches
    Exemplar im Inventar hat. Bei jedem neuen Bau-Bereich (falls je ein weiterer hinzukommt)
    diesen Vierer-Split entsprechend erweitern.

### Galaxie & Multiplayer

43. **50 Systeme x 9 Positionen** (`galaxyConstants.ts`). Distanz-/Flugzeitformel an OGame
    angelehnt, aber gestaucht (Galaxie-Querung 20-60 Min. statt Stunden). Jede Flugbewegung
    (Sektor-Missionen, Halten, Raid-Anflug, Elite-Bollwerk-Rendezvous) nutzt dieselbe
    `galaxyDistance()`/`galaxyDurationMs()`-Formel. Wessen Forschung (Antriebstechnik) zählt, ist
    immer die des ABSENDERS der jeweiligen Flugbewegung.

44. **"Halten" ist der einzige Weg, einem anderen Spieler bei Piratenraids zu helfen.** Eine
    Flotte fliegt zu einem Zielspieler und bleibt dort unbegrenzt stationiert (kein Kampf, kein
    PvP), bis sie zurückgerufen wird - verteidigt automatisch bei JEDEM künftigen Raid dieses
    Spielers (`getHoldingDeploymentsTargeting()` in `galaxy.ts`, eingebunden in `resolveOneWave()`
    in `raids.ts`). Überlebende haltender Flotten bleiben nach einer Welle reduziert weiter vor
    Ort, fliegen nicht automatisch heim. Halter bekommen dieselbe volle Belohnung wie der
    Verteidiger (Punkt 5).

45. **Ein Raid ist kein einzelner Kampf mehr, sondern `RAID_WAVE_COUNT` (5) Angriffswellen über
    `RAID_ASSAULT_DURATION_MS` (1 Stunde) NACH der Ankunft** (`economy.ts`/`raids.ts`,
    Nutzerentscheidung). Vorbereitungszeit + distanzabhängige Flugzeit (siehe Punkt 46) bleiben
    unverändert - die Stunde gilt ausschließlich für die Wellen-Phase danach, nicht für den
    Anflug. `planRaidWaveTimes()` plant bei Ankunft-Berechnung (`spawnRaidAt()`) einmalig
    `RAID_WAVE_COUNT` Zeitpunkte: erste Welle sofort bei Ankunft, weitere ungefähr im
    `RAID_ASSAULT_DURATION_MS/(RAID_WAVE_COUNT-1)`-Takt (15 Min.) mit Zufalls-Streuung
    (`RAID_WAVE_JITTER_FACTOR`), letzte Welle hart auf das Fensterende gekappt - "muss innerhalb
    der Stunde abgeschlossen sein" gilt dadurch garantiert.
    - **Jede Welle ist ein vollständiger, unabhängiger Kampf** gegen eine frisch gewürfelte
      Feindflotte. Deren Stärke skaliert bewusst NICHT wie sonst im Spiel üblich auf der Flotte,
      sondern auf der aktuellen VERTEIDIGUNGSANLAGEN-Stärke (`defensePower` in
      `resolveOneWave()`, Summe aus `waffen+schild+panzerung` aller Verteidigungsanlagen,
      Nutzerentscheidung - durchbricht bewusst die sonst geltende Entkopplungs-Regel, siehe Punkt
      22), MULTIPLIZIERT mit einer festen Eskalationstabelle über die 5 Wellen: 80% / 90% / 100% /
      115% / 130% (`RAID_WAVE_FACTORS` in `economy.ts`, seit der Balance-Anpassung Juli 2026 - vorher
      70/80/90/100/110%; ersetzt die noch frühere zufällige Grund-Varianz `RAID_MULTIPLIER_ROLL`,
      die für Raids nicht mehr verwendet wird). Verteidiger-
      Flotte/-Verteidigung tragen Verluste vorheriger Wellen weiter (kein Reset zwischen Wellen,
      `DEFENSE_REPAIR_PERCENT` greift weiterhin pro Welle). `RAID_MIN_TARGET_POWER` wirkt als
      Untergrenze für die Verteidigungsanlagen-Basis selbst (nicht mehr pro Welle geteilt) -
      schützt reine Flotten-Accounts ohne nennenswerte Verteidigungsanlagen vor einem quasi
      wirkungslosen Raid.
    - **Ist nichts mehr zu verteidigen** (von Anfang an oder durch vorherige Wellen aufgerieben,
      `hasAnyDefense()`), werden die restlichen Wellen ohne Kampf übersprungen statt einzeln
      sinnlos simuliert - eine einzige Sammel-Nachricht statt mehrfacher Leer-Wellen-Spam.
    - **Belohnung gibt es NICHT pro Welle einzeln, sondern als EINE Abschluss-Belohnung** nach der
      letzten Welle (`finalizeRaidWaves()`): ein Container pro gewonnener Welle (Silber), bei
      einer PERFEKTEN Verteidigung (alle `RAID_WAVE_COUNT` Wellen gewonnen) werden alle zu Gold
      aufgewertet UND zusätzlich (on top, nicht als Ersatz) ein Elite-Container vergeben - sonst
      nur über den Piratenkapitän im Elite-Bollwerk erreichbar. Bergungs-DM und Ressourcen-
      Diebstahl (nur falls nicht perfekt verteidigt) greifen ebenfalls nur EINMAL am Ende,
      basierend auf der Summe/dem Endstand über alle Wellen (`raid.accumulatedDestroyed`), nicht
      pro Welle.
    - **Statistik-Unterscheidung:** `raidsRepelledFull`/`raidsRepelledPartial` zählen genau EINMAL
      pro GESAMTEM Raid (sonst würde ein Raid bis zu 5x in die Bestenliste einzahlen),
      `enemiesDestroyed`/`ownShipsLost` dagegen live PRO Welle, sobald sie geschlagen ist.
    - **Cross-User-Sweep (`processOverdueRaidsForOtherUsers`) arbeitet bei jedem Tick ALLE gerade
      fälligen Wellen ab**, nicht nur die nächste - kann bei längerer Abwesenheit mehr als eine
      auf einmal sein. Dadurch gilt "muss innerhalb der Stunde abgeschlossen sein" unabhängig
      davon, ob der Verteidiger zwischenzeitlich online war (Punkt 4/25 zum Live-State-Muster gilt
      unverändert für jede einzelne Welle).
    - **Migration:** alte, vor dem Wellensystem gespawnte Raids ohne `waveTimes`-Feld werden beim
      nächsten `loadPlayerState()` sicherheitshalber verworfen (`state.ts`, analog zur
      `pirateBase`-Migration aus Punkt 46).

46. **Piraten-Raids starten von einer von 12 festen Piratenbasen** (`PIRATE_BASES`) mit echter,
    distanzabhängiger Flugzeit: Trigger (feste Checkpoints) → 60 Min. Vorbereitungszeit → echte
    Flugzeit von der gewürfelten Basis zur Zielposition (`PIRATE_FLEET_SPEED = 7000` als
    repräsentative Geschwindigkeit) → Ankunft, ab der die Wellen-Phase (Punkt 45) beginnt.

47. **Elite-Bollwerk-Rendezvous:** eingeladene Teilnehmer fliegen nach Annahme zuerst zum
    ERSTELLER, nicht direkt zum Ziel. Der Start ist blockiert, bis alle angenommenen Teilnehmer
    eingetroffen sind. Danach fliegt die vereinte Flotte gemeinsam weiter (Geschwindigkeit =
    langsamstes Schiff über alle kombinierten Flotten, Distanz ab Ersteller-Position).

48. **Distanz-/Flugzeit-Vorschau ist auf alle Flugziele verallgemeinert** (`POST
    /game/galaxy/preview` akzeptiert `targetUserId` ODER eine feste `targetPosition`,
    `useGalaxyPreview()`-Hook clientseitig wiederverwendet). Ein Hook-Aufruf in einer
    `.map()`-Schleife ist nur sicher, wenn die Array-Länge über ALLE möglichen Zustände der
    Komponente hinweg konstant bleibt - im Zweifel immer eine eigene Unterkomponente pro
    Listenelement extrahieren (React-Hook-Regeln).

### KI-Spieler

49. **Zwei Bot-Accounts** ("KI-Vega", "KI-Nyx", `BOT_USERNAMES`) - technisch normale Nutzer,
    unterscheiden sich nur durch das `is_bot`-Flag. Nutzen exakt dieselben Aktionsfunktionen wie
    die UI (keine Sonderkonditionen bei Kosten/Bauzeiten/Flugzeiten). `runBotTurn()` läuft im
    globalen Heartbeat nach der normalen Zeit-Verarbeitung, feste Prioritäten: Energie/Minen →
    Forschung → Schiffe (erst Mining, dann Kampf) → Verteidigung → Mining-Flotten entsenden →
    Elite-Bollwerk-Einladungen annehmen/gelegentlich selbst eröffnen → gelegentlich Flotten zum
    Halten bei menschlichen Spielern schicken.

### Frontend-Konventionen

50. **`InfoTable`/`InfoModal`-Zeilen nutzen `.info-list`/`.info-list-row`** statt roher Tabellen -
    Label links gedimmt, Wert rechtsbündig.

51. **Händler/Schrotthändler nutzen `ship-grid`/`ship-card` mit Bildern**, nicht die schlichteren
    `queue-box`-Listenzeilen. Ressourcentausch über anklickbare Icon-Chips statt `<select>`.

52. **Rohe interne IDs/Enums nie direkt anzeigen** - Schiffs-IDs über `shipName()`
    (`combatInfo.ts`), Sektor-IDs über `gameData.sektoren`-Lookup, Status-Enums über eigene
    Label-Maps in lesbaren Text übersetzen.

53. **Baubarkeit und Einsetzbarkeit in Missionen sind zwei getrennte Schalter** - bei jedem neuen
    Kampfschiff müssen BEIDE gesetzt werden (`ships.ts` fürs Bauen, `COMBAT_SHIP_IDS` in
    `data/economy.ts` UND alle Client-Kopien in `Sektor.tsx`/`Multiplayer.tsx`/`RaidHilfe.tsx`
    fürs Einsetzen).

54. **Ein einziges, festes Hintergrundbild für die gesamte App**
    (`client/public/background/werft.jpg`, fest in `theme.css` verdrahtet). Ein
    per-Route-Hintergrundbild-System wurde gebaut und nach wiederholten Ladeproblemen wieder
    komplett zurückgebaut - kein neuer Anlauf ohne vorherige Absprache.

### Bilder

55. Neue Schiffs-/Gebäude-/Klassen-Bilder werden vor dem Einchecken komprimiert (JPEG, ~700px
    Breite, Qualität ~78%, Ziel ~60-80 KB statt mehrerer MB) - wichtig für Mobil-Ladezeiten.
    Klassenbilder liegen unter `client/public/classes/` (`kanonier.jpg`/`bollwerk.jpg`/
    `kommandant.jpg`), Pfad im `img`-Feld von `ClassDefinition` (`data/classes.ts`).

### Klassensystem

56. **Jeder Spieler wählt einmalig eine von drei reinen Kampf-Klassen** (`data/classes.ts`):
    Kanonier, Bollwerk, Kommandant - bewusst KEINE Wirtschafts-/Effizienz-Klassen (eine frühere
    Variante mit Wächter/Extraktor/Pfadfinder wurde vor dem Einbau verworfen, siehe Punkt 57 zur
    Begründung). Erstwahl ist kostenlos (`state.playerClass` startet bei `null`), jeder weitere
    Wechsel kostet `CLASS_CHANGE_COST_DM` (500 DM, `setPlayerClass()` in `classActions.ts`).
    Bestandsspieler von vor Einführung des Systems werden per Migration auf `null` gesetzt
    (`state.ts`), NICHT auf eine geratene Standardklasse. Solange `playerClass === null` ist,
    blockiert `App.tsx` (`GameHome`) den kompletten übrigen Zugang und zeigt stattdessen
    ausschließlich die Klassenwahl (`Klasse.tsx` mit `mandatory`-Prop) - keine Sidebar, keine
    Ressourcenleiste, keine andere Route erreichbar.

57. **Alle drei Klassen teilen sich ein festes "Gesamtbudget" von ~100 Prozentpunkten Kampfbonus,
    nur unterschiedlich auf Waffen/Schild/Panzerung verteilt** (Nutzerentscheidung nach Ruecksprache
    zur Balance):
    - **Kanonier**: +100% NUR Waffenschaden (Schild/Panzerung bleiben Basis) - tötet am
      schnellsten, hält am wenigsten aus.
    - **Bollwerk**: +50% Schild UND +50% Panzerung (Waffenschaden bleibt Basis) - haelt am
      laengsten durch, braucht aber laenger fuer den Sieg.
    - **Kommandant**: +33,33% auf Waffen UND Schild UND Panzerung gleichermaßen
      (`CLASS_KOMMANDANT_COMBAT_MULTIPLIER = 4/3`) - Allrounder ohne Schwaeche, aber auch ohne
      Glanzpunkt, klar schwaecher pro Einzelwert als die beiden Spezialisten.
    Ergibt echtes Schere-Stein-Papier zwischen den Klassen statt einer einzelnen "objektiv
    staerksten" Wahl (eine fruehere Variante mit EINER reinen Kampf-Klasse plus zwei reinen
    Wirtschafts-/Effizienz-Klassen wurde verworfen, weil Kampfkraft in JEDEM Spielmodus zaehlt,
    Wirtschaft/Effizienz aber nur in ihrer jeweiligen Nische - die Kampf-Klasse waere ohne echten
    Gegenspieler immer die beste Wahl gewesen).

58. **Die Pro-Wert-Aufteilung ist zentral in `getEffectiveStats()` verankert** (`combat.ts`,
    `classCombatMultipliers()`) - wie der 24h-Kampf-Booster und Forschung auch - und muss daher an
    JEDEM Kampf-Aufrufer explizit durchgereicht werden: `missions.ts`, `raids.ts` (Einzel- UND
    Mehrspieler-Pfad, `OwnedFleetContribution.playerClass` PRO Beitragendem, da mehrere Teilnehmer
    unterschiedliche Klassen haben können), `groupOps.ts` (Elite-Bollwerk/Piratenadmiral teilen
    sich `contributionsFromParticipants()`), `simulator.ts`. Fließt bewusst NICHT in die
    Feindstärke-Berechnung ein (`combatFleetPowerBase()`/Raid-Verteidigungsanlagen-Power nutzen
    weiterhin `baseStats()`, nicht `getEffectiveStats()`) - die Klasse macht staerker, ohne
    automatisch haertere Gegner heraufzubeschwoeren. Bei jedem NEUEN Kampf-Aufrufer künftig genauso
    verfahren wie bei Forschung/Kampf-Booster auch.

59. **Zweiter Bonus je Klasse: getrennte Baukosten-Rabatte statt eines gemeinsamen Faktors**
    (`shipCostMultiplier()`/`defenseCostMultiplier()` in `actions.ts`, NEUES Muster - Baukosten
    liefen vorher unverändert direkt aus den Schiffs-/Verteidigungsdaten): Kanonier -10% NUR
    Schiffe, Bollwerk -25% NUR Verteidigungsanlagen, Kommandant -10% BEIDES. Angewendet in
    `startBuild()`/`startDefenseBuild()` - `canAfford()`-Prüfung läuft dabei gegen den BEREITS
    RABATTIERTEN Preis, sonst würde ein Spieler mit exakt ausreichend Ressourcen für den
    Rabattpreis fälschlich abgelehnt. Client: identische Spiegel-Funktionen in
    `lib/multipliers.ts`, eingebunden in `Werft.tsx`/`Verteidigung.tsx` (Punkt 1 gilt hier analog:
    jede Kosten-ANZEIGE muss diese Werte spiegeln, sonst zeigt die UI falsche Preise). Gebäude
    (inkl. Minen) sind von KEINER Klasse betroffen - reine Kampf-Klassen greifen nicht in die
    Wirtschaft ein.

60. **Dritter Bonus je Klasse, jeweils zum Kampfstil passend:** Kanonier +25% Flottengeschwindigkeit
    (`galaxyFleetSpeed()` in `galaxy.ts`, reiht sich neben Antriebstechnik-Forschung ein - wirkt auf
    ALLE Flugbewegungen, nicht nur Missionen). Bollwerk repariert Verteidigungsanlagen nach einem
    Raid-Kampf zu 90% statt der sonst üblichen 70% (`CLASS_BOLLWERK_DEFENSE_REPAIR_PERCENT` in
    `data/classes.ts`, `defenseRepairPercentFor()` in `raids.ts` - nur bei Raids relevant, da
    Verteidigungsanlagen nur dort kämpfen). Kommandant +15% Flottengeschwindigkeit (schwächer als
    Kanoniers +25%, passend zum Allrounder-Charakter).

61. **Der 24h-Kampf-Booster (`kampfBoostActive`, +20% Waffen/Schild/Panzerung) war seit seiner
    Einführung wirkungslos** - er wurde gekauft und als Ablaufzeit in `state.activeBoosters`
    gespeichert, aber NIRGENDS an einen tatsächlichen Kampf-Aufruf übergeben (`kampfBoostActive`
    blieb überall implizit `false`). Im Zuge der Klassen-Kampfbonus-Verdrahtung (Punkt 58)
    mitbehoben, da beide denselben Verdrahtungs-Bedarf an denselben Stellen hatten:
    `isBoosterActive(state, 'kampf')` wird jetzt an JEDEM Kampf-Aufrufer übergeben, inklusive PRO
    Beitragendem bei Mehrspieler-Kämpfen (`OwnedFleetContribution.kampfBoostActive`, vorher dort
    fest auf `false` verdrahtet). `isBoosterActive()` wohnt bewusst in einer eigenen,
    abhängigkeitsfreien Datei (`boosterUtil.ts`) statt weiterhin in `actions.ts` - ein Import aus
    `actions.ts` heraus hätte in `missions.ts`/`raids.ts`/`groupOps.ts`/`simulator.ts` einen
    Zirkelbezug erzeugt (`actions.ts` importiert bereits von allen vieren).

62. **Werft bekommt einen neuen Untertab "Spezialschiffe".** Die drei Salvenschiffe (vorher Teil
    der normalen Jäger-/Kreuzer-/Elite-Klassen-Listen) und der Imperator (vorher Untertab
    "Spezialteile" von Shop) sind in einen gemeinsamen Untertab umgezogen (`Spezialschiffe.tsx`) -
    der Imperator ist NICHT mehr an zwei Stellen gleichzeitig baubar. Salvenschiffe bauen dabei
    weiterhin ganz normal über `buildShip()`/die 3 Bau-Slots (nur ihre Anzeige-Gruppierung hat
    sich geändert), der Imperator unverändert über die separate Spezialteile-Aktion
    (`buildImperator()`). Die gemeinsame Schiffs-Baukarten-Logik (Kosten/Bauzeit/Bestand/
    Info-Popup) wurde dafür aus `Werft.tsx` in eine wiederverwendbare Komponente
    (`components/ShipBuildCard.tsx`) extrahiert, damit Hauptliste und Spezialschiffe-Tab nicht
    denselben Code duplizieren.

63. **Schiffs-Modulsystem: jedes der 12 `COMBAT_SHIP_IDS`-Kampfschiffe plus Imperator bekommt
    eigene Waffen-/Schild-/Panzerung-/Antriebs-Module** (Nutzerentscheidung - bewusst PRO SCHIFF,
    nicht global über die ganze Flotte, analog zum Gebäude-Modulsystem aber ohne dessen
    Freischalt-Schwelle, da Schiffe keine "Stufe" haben, an der man eine Mindestvoraussetzung
    festmachen könnte). Mining-Schiff und Begleitschiff bleiben bewusst ohne Module (reine
    Nicht-Kampf-/Hilfsschiffe). Alle 52 Modul-Definitionen (13 Schiffe × 4 Module) werden in
    `data/shipModules.ts` per Generator-Funktion aus den jeweiligen Schiffsdaten erzeugt statt von
    Hand geschrieben - Kosten/Bauzeit leiten sich von den Stückkosten/der Basis-Bauzeit des
    jeweiligen Schiffs ab (Imperator hat keine `cost`, nur `teileCost` - eigene, seinem mythischen
    Status entsprechend extrem hohe Fixkosten statt einer Ableitung). Bilder werden bewusst NICHT
    neu erstellt, sondern von der jeweils passenden Forschung wiederverwendet
    (Waffentechnik/Schildtechnik/Panzerungtechnik bzw. dem zum tatsächlichen `driveType` des
    Schiffs passenden Antriebs-Forschungsbild).
    - **Stufenlimit 10** (Nutzerentscheidung), Effekt +3%/Stufe bei Waffen/Schild/Panzerung
      (max. +30%), +2%/Stufe bei Antrieb (max. +20%, gleiche Größenordnung wie die bestehende
      Antriebstechnik-Forschung) - bewusst deutlich kleiner als der Klassen-Bonus, als
      zusätzliche Spätspiel-Feinabstimmung gedacht, nicht als Ersatz.
    - **Eigener, globaler Bau-Slot** (`MAX_SHIP_MODULE_SLOTS = 1`, `state.shipModuleQueue`),
      unabhängig von den 3 normalen Schiffs-Bauplätzen (`buildQueue`) - konkurriert nicht mit dem
      eigentlichen Schiffbau, analog zum einen gemeinsamen Gebäude-Bauslot.
    - **Kampf-Anbindung läuft über denselben Mechanismus wie Klassen-Bonus/Kampf-Booster**
      (`getEffectiveStats()` in `combat.ts`, jetzt mit `shipModules`-Parameter) und muss daher an
      denselben Stellen durchgereicht werden: `missions.ts`, `raids.ts` (`OwnedFleetContribution.
      shipModules` PRO Beitragendem bei Mehrspieler-Kämpfen), `groupOps.ts`, `simulator.ts`. Gilt
      NUR für Schiffe, nie für Verteidigungsanlagen (die haben keine eigenen Module).
    - **Antriebs-Modul wirkt in `galaxyFleetSpeed()`** ausschließlich auf den Schiffstyp, der
      gerade das langsamste Schiff der jeweiligen Flotte ist (exakt wie die bestehende
      Antriebsklassen-Forschung auch nur dort ansetzt) - an allen 7 Aufrufern von
      `galaxyFleetSpeed()` durchgereicht.
    - **UI hängt bewusst OHNE eigenen Tab direkt an der Baustelle** (Nutzerentscheidung, nach
      Rücksprache über eine ursprünglich geplante separate Tab-Lösung verworfen): jedes Schiff
      bekommt seine Module per Verbindungslinie (`components/ShipModuleRow.tsx`, gleiches VLine-
      Muster wie der Gebäude-Modulbaum in `Gebaeude.tsx`) direkt UNTER seiner eigenen
      `ShipBuildCard` angehängt - in der Werft-Hauptliste (Jäger-/Kreuzer-/Elite-Klasse) UND im
      Spezialschiffe-Tab (Salvenschiffe, Imperator). Modul-Bau/-Info geschieht damit exakt dort,
      wo auch das Schiff selbst gebaut wird, statt an einer separaten Stelle.

64. **Imperator-Kampfwerte nochmals deutlich angehoben** (Nutzerentscheidung: Waffen/Schild
    lagen trotz Baulimit 2 und 1.000 Spezialteile/Kategorie Aufwand kaum über gewöhnlichen
    Kampfschiffen - Waffen 50.400/Schild 12.600/Panzerung 2.520.000 → **Waffen 5.000.000/Schild
    2.500.000/Panzerung 12.000.000** (`ships.ts`). Bewusst NICHT proportional zum alten
    Verhältnis hochskaliert (das hätte Panzerung auf ~126 Mio. getrieben) - alle drei Werte
    eigenständig auf ein zum seltensten/teuersten Schiff im Spiel passendes Niveau gesetzt.
    Baulimit (2) und Spezialteile-Kosten (1.000/Kategorie) bleiben unverändert.

65. **Dabei entdeckt und behoben: der Imperator wirkte bei Raids (Heimatverteidigung) bislang NIE
    mit**, unabhängig von seinen Werten - ein von den Werten unabhängiger, eigener Bug. Ursache:
    `raids.ts` ermittelte die verteidigende Flotte über das rohe `COMBAT_SHIP_IDS`
    (`homeShipIds`/`hasAnyDefense()`), das den Imperator bewusst NICHT enthält (das steuert nur
    die Einsetzbarkeit in SOLO-Missionen außerhalb der Heimatbasis, siehe Punkt 51). Bei
    Piraten-Sektor-Missionen, Elite-Bollwerk und Piratenadmiral war der Imperator dagegen schon
    immer explizit zugelassen (`availableFleetForSektor()` in `missions.ts`,
    `ADMIRAL_ALLOWED_SHIP_IDS`) - Raids waren die einzige übersehene Ausnahme. Fix: neue
    `HOME_DEFENSE_SHIP_IDS`-Konstante (`COMBAT_SHIP_IDS` + `'imperator'`) in `raids.ts`, ersetzt
    das rohe `COMBAT_SHIP_IDS` an beiden Stellen. Die Einsetzbarkeit in SOLO-Missionen bleibt
    davon unberührt (weiterhin über `availableFleetForSektor()`/das clientseitige Pendant
    gesteuert, nicht über diese neue Konstante).

66. **Werft wird zur zentralen Bau-Seite für alles Militärische: 2 Haupttabs "Schiffe" und
    "Verteidigung" statt einer eigenständigen Verteidigung-Seite** (Nutzerentscheidung, Sidebar
    dadurch schlanker - `Verteidigung.tsx` komplett entfernt, kompletter Inhalt in `Werft.tsx`
    aufgegangen). "Schiffe" behält seine bisherigen Klassen-Untertabs (Jäger/Kreuzer/Elite/
    Versorgung), "Spezialschiffe" ist jetzt ein GLEICHRANGIGER Klassen-Tab statt eines eigenen
    Werft-Haupttabs. "Verteidigung" bekommt eine analoge Klassen-Struktur (siehe Punkt 67).

67. **Verteidigung nach Klassen unterteilt, analog zu Schiffen** (Nutzerentscheidung):
    - **Leichte Verteidigung**: Raketenwerfer, Leichtes Lasergeschütz, Schweres Lasergeschütz
    - **Schwere Verteidigung**: Gauß-Kanone, Ionengeschütz, Plasmawerfer
    - **Schild**: alle drei Schildkuppeln (Kleine/Große/neu Gigant, siehe Punkt 68)
    - **Spezialverteidigung**: die zwei neuen Mehrfachziel-Salve-Anlagen (siehe Punkt 68)
    Anders als bei Schiffen (Imperator braucht wegen der Spezialteile-Mechanik eine eigene
    Komponente) sind bei Verteidigung ALLE vier Klassen-Tabs strukturell identisch - eine einzige
    generische `VerteidigungTab`-Komponente in `Werft.tsx` reicht, kein Spezialfall nötig.

68. **Zwei neue Verteidigungsanlagen mit Mehrfachziel-Salve** (`data/defenses.ts`,
    Nutzerentscheidung): Sentinel-Kanone (deckt Jäger-Klasse ab, wie Salvenjäger) und
    Ultimate-Kanone (deckt Kreuzer- UND Elite-Klasse zusammen ab - stärker als jedes einzelne
    Salvenschiff, entsprechend teurer/seltener). Nutzen dieselbe `MULTI_TARGET_VOLLEY_SHIPS`-Menge
    wie die Salvenschiffe (Name historisch gewachsen, `combat.ts`s Salve-Logik prüft nur generisch
    den `typeId`-String, unabhängig ob Schiff oder Verteidigungsanlage) - MUSSTEN deshalb auch aus
    `generateDefenseFleet()` ausgeschlossen werden (Bugfix nebenbei: diese Funktion hatte bislang
    GAR KEINEN Ausschluss-Filter, anders als die längst bestehenden Pendants für Schiffe,
    `generatePiratenFleet()`/`generateFallbackFleet()` - ohne den Fix wären Sentinel-/
    Ultimate-Kanone in generierten Piraten-/Raid-Verteidigungen aufgetaucht). Dritte Schildkuppel
    "Gigant-Schildkuppel" kommt trotz "Spezial"-Charakter bewusst in den normalen Schild-Tab
    (Nutzerentscheidung), nicht zur Spezialverteidigung - gleiches Prinzip wie die anderen beiden
    Kuppeln (gemeinsamer Pool, `maxCount:1`), nur deutlich stärker. Trotzdem explizit (per Id, nicht
    über `MULTI_TARGET_VOLLEY_SHIPS`, da sie keine Salve-Fähigkeit hat) aus `generateDefenseFleet()`
    ausgeschlossen (Nutzerentscheidung: alle "besonderen"/neuen Anlagen sollen bei Piraten generell
    nicht auftauchen) - wäre technisch ohnehin fast wirkungslos gewesen, da NPC-Kämpfe keinen
    eigenen Kuppel-Pool nutzen (`computeDomeSharedPool()` gilt nur für den Heimatverteidiger bei
    Raids), hätte aber sinnlos Würfel-Gewicht von den eigentlichen NPC-Einheiten abgezogen.

69. **Verteidigungs-Modulsystem: Waffen/Schild/Panzerung (KEIN Antrieb - Verteidigung bewegt sich
    nicht) für ALLE 11 Verteidigungsanlagen** (`data/defenseModules.ts`, generiert wie
    `shipModules.ts`, 30 Definitionen). Kuppeln bekommen bewusst KEIN Waffen-Modul (0 Basis-
    Waffenschaden, ein Prozent-Bonus darauf wäre wirkungslos - gleiche Logik wie der Ausschluss
    von Mining-Schiff/Begleitschiff bei Schiffs-Modulen). Bewusste Vereinfachung: Verteidigungs-
    Modul-STUFEN leben in DERSELBEN `state.shipModules`-Map wie Schiffs-Module (Id-Schema
    `${defenseId}_waffen` usw. kollidiert nicht mit Schiffs-Ids) - dadurch war KEINE zusätzliche
    Durchreichung durch den kompletten Kampf-Pfad nötig, `getEffectiveStats()` bekommt den
    `shipModules`-Parameter ja ohnehin schon überall. Nur die Bau-Warteschlange
    (`state.defenseModuleQueue`, `MAX_DEFENSE_MODULE_SLOTS=1`) ist eigenständig, unabhängig von
    Schiffs-Modulen UND den 3 normalen Verteidigungs-Bauplätzen.

70. **Dabei aufgedeckt und behoben: der gemeinsame Schildkuppel-Pool (`computeDomeSharedPool()`)
    wendete bislang NUR die Forschung an - Klassen-Bonus (z.B. Bollwerks +50% Schild), der 24h-
    Kampf-Booster und (jetzt neu) Schild-Module wirkten NIE auf den Pool**, obwohl sie bei jeder
    anderen Verteidigungsanlage über `getEffectiveStats()` längst greifen. Ursache: Kuppeln melden
    in `getEffectiveStats()` IMMER `schild: 0` (ihr echter Schildwert fließt ausschließlich in den
    separaten Pool, nicht in ihre eigenen Kampfwerte) - der Pool wurde aber komplett getrennt von
    `getEffectiveStats()` berechnet und hatte dadurch nie an den späteren Erweiterungen
    (Klassensystem, Kampf-Booster) teilgenommen. Fix: `computeDomeSharedPool()` bekommt jetzt
    dieselben Parameter (`kampfBoostActive`, `playerClass`, `shipModules`) wie `getEffectiveStats()`
    und wendet sie genauso an - betrifft nur den EINEN Aufrufer in `raids.ts` (Verteidigungsanlagen
    kämpfen ausschließlich bei Raids, nie bei Missionen/Elite-Bollwerk/Piratenadmiral).

71. **Client-seitige Bestandszählung für limitierte Einheiten (`maxCount`/`unique`) war an
    mehreren Stellen unvollständig - Bauen-Button blieb dadurch teils irreführend anklickbar,
    obwohl der Server den Bau ohnehin korrekt abgelehnt hätte** (serverseitige
    `countShipEverywhere()`/`countDefenseEverywhere()` in `actions.ts` waren bereits vollständig,
    siehe deren eigene Bugfix-Kommentare dort):
    - `components/ShipBuildCard.tsx`s eigene `countShipEverywhere()` zählte Flotte + Bauwarteschlange
      + Missionen + Galaxie-Halten, aber NICHT laufende Gruppen-Expeditionen (Elite-Bollwerk/
      Piratenadmiral) - jetzt ergänzt (`parties`-Parameter, aus `useGame()` bezogen).
    - Die Imperator-Karte in `Spezialschiffe.tsx` hatte ihre EIGENE, noch einfachere
      Bestandsermittlung (`state.fleet.imperator` allein, nicht mal die Bauwarteschlange) -
      auf die gemeinsame `countShipEverywhere()` umgestellt.
    - `components/DefenseBuildCard.tsx` zählte nur `state.defense` (bereits fertig gebaut), nicht
      die eigene Bau-Warteschlange (`defenseQueue`) - neue lokale `countDefenseEverywhere()`
      ergänzt (Verteidigungsanlagen bewegen sich nie, daher genügen hier defense + defenseQueue,
      kein Pendant zu Missionen/Galaxie-Halten/Gruppen-Expeditionen nötig).
    Betrifft alle Einheiten mit `maxCount`/`unique`: Sandronator, Imperator, die drei
    Salvenschiffe, alle drei Schildkuppeln, Sentinel-/Ultimate-Kanone.

72. **Piraten/NPCs bekommen jetzt `PIRATE_RESEARCH_SHARE` (50%) der relevanten Forschung**
    (`data/combatConstants.ts`, Nutzerentscheidung nach Feedback "Piraten wirken mittlerweile zu
    leicht") - vorher bekamen sie GAR KEINE Forschung, jede Kampf-Berechnung für Seite B lief auf
    reinem Basiswert. Betrifft ALLE Forschungs-Effekte gleichermaßen (Waffen-/Schild-/
    Panzerungtechnik-Multiplikatoren, Präzision, Ausweichen, Kritische Treffer, Zielerfassung,
    Schild-Regeneration, Durchschlag) - bewusst NUR Forschung, NIE Klassen-Bonus/Schiffs-/
    Verteidigungs-Module/Kampf-Booster (die bleiben exklusiv beim Spieler).
    - **`computePirateResearch()`** (`combat.ts`) liefert das skalierte Forschungs-Objekt: bei
      Mehrspieler-Kämpfen (Elite-Bollwerk, Raid mit Verstärkung/haltenden Flotten) der
      DURCHSCHNITT aller Beteiligten (Nutzerentscheidung), sonst einfach die Forschung des einen
      Spielers, jeweils × 0,5.
    - **Kein zweiter Durchreichungs-Pfad nötig**: die research-lesenden Funktionen
      (`getPrecisionChance()`, `getCritChance()`, `getEvasionChance()`, `getZielerfassungAccuracy()`,
      `getShieldRegenRate()`, `getDurchschlagFraction()`) lasen research schon immer generisch aus
      dem übergebenen Objekt - der interne "bei NPC einfach überspringen"-Zweig wurde entfernt,
      Piraten bekommen jetzt einfach das bereits vorskalierte Objekt zum Auslesen übergeben. Der
      Parameter `applyPlayerResearch` bleibt aus Aufrufer-Kompatibilität in den Signaturen stehen,
      wird intern aber nicht mehr zur Forschungs-Unterscheidung gebraucht.
    - **Dabei ein subtiler Bug korrigiert:** `fireShots()`/`rollHit()` nutzten für Schütze UND Ziel
      bisher dasselbe `research`-Objekt (das war irrelevant, solange Piraten ohnehin 0% bekamen) -
      jetzt braucht `rollHit()` zwingend die Forschung der ZIEL-Seite für dessen Ausweichchance,
      nicht die des Schützen. `fireShots()` bekommt daher jetzt `researchShooter` UND
      `researchTarget` getrennt übergeben (bei "Spieler schießt auf Piraten":
      researchShooter=Spielerforschung, researchTarget=Piraten-Forschung; umgekehrt vertauscht).
    - **NPC-Kampfwerte (Waffen/Schild/Panzerung)** liefen bisher über `baseStats()` (`combat.
      worker.ts`s `statsFnBFor`), jetzt über `getEffectiveStats(id, pirateResearch, {}, false, null,
      {})` - Klassen-Bonus/Booster/Module bleiben dabei bewusst `null`/`{}`/`false`. Der
      Piratenadmiral selbst (`ADMIRAL_BOSS_ID`) bleibt über seinen eigenen, unabhängigen
      Macht-Skalierungs-Override komplett unbeeinflusst von jeder Forschung (siehe
      `generateAdmiralEncounter()`) - nur seine Eskorte profitiert wie jeder andere NPC.
    - Gilt automatisch für ALLE Kampf-Aufrufer (Missionen, Raids, Elite-Bollwerk, Piratenadmiral,
      Kampfsimulator), da `resolveCombat()`/`resolveCombatMultiOwner()` `pirateResearch` zentral
      selbst berechnen - keine Änderung an den Aufrufern in `missions.ts`/`raids.ts`/`groupOps.ts`/
      `simulator.ts` nötig.

73. **Container stapeln sich jetzt** (Nutzerentscheidung nach Feedback "wir werden mit Containern
    überflutet"): `Container` bekommt ein `count`-Feld, `addContainers(state, tier, count)` in
    `inventory.ts` sucht einen bestehenden Eintrag DIESER Stufe und erhöht dessen `count`, statt
    für jedes Stück einen neuen Einzeleintrag mit Zufalls-Id anzulegen - die Container-Id ist
    dadurch deterministisch (`container_<tier>`), es gibt nie mehr als 3 Container-Einträge im
    Inventar (einen pro Stufe). Ersetzt zwei lokal duplizierte "Container hinzufügen"-Hilfsfunktionen
    in `missions.ts`/`groupOps.ts` (dort ursprünglich bewusst dupliziert, um einen vermeintlichen
    Kreisimport mit `inventory.ts` zu vermeiden - der besteht aber gar nicht, da `inventory.ts` von
    `actions.ts` nur TYPEN importiert, die beim Kompilieren vollständig entfernt werden, siehe
    Kommentar dort). Ausgepackte Belohnungen (`RewardItem`) stapelten sich bereits vorher korrekt
    getrennt nach Herkunfts-Stufe (der `stackKey` enthält das Label, und Silber/Gold/Elite haben
    für dieselbe Belohnungsart unterschiedliche Labels, z.B. "Rohstoff-Fracht" vs. "Große
    Rohstoff-Fracht") - hier war keine Änderung nötig. Zusätzlich (Nutzer-Klarstellung nach
    Rückfrage - "Trennung" war als optische GRUPPIERUNG im Inventar gemeint, nicht als
    Datenmodell-Änderung): `Inventar.tsx` zeigt einlösbare Belohnungen jetzt unter Kategorie-
    Überschriften (Rohstoffe/Dunkle Materie/Ausrüstungs-Teile/Zeit-Gutscheine/Geschenkte Schiffe,
    `categoryForRewardType()`) statt als eine einzige flache Liste - damit lässt sich gezielt die
    gesuchte Kategorie überfliegen, statt jede Zeile einzeln lesen zu müssen.

74. **Container-Zieh-Mechanik komplett neu: Kategorien mit unabhängiger Dropchance statt "N von X
    zufällig wählen"** (Nutzerentscheidung, `data/economy.ts`s `ContainerCategoryDef`/
    `ContainerTypeDef`, `rollContainerCategories()` in `inventory.ts`). Jede Kategorie
    (Rohstoffe/Dunkle Materie/Ausrüstungs-Teile/Zeit-Gutschein/Geschenkte Schiffe) wird EINZELN
    und UNABHÄNGIG gegen ihre eigene `chance` gewürfelt, danach auf GENAU 2 Treffer normalisiert:
    mehr als 2 Treffer werden zufällig auf 2 reduziert, weniger als 2 werden mit den Kategorien mit
    der nächsthöchsten `chance` aufgefüllt (deterministisch sortiert, nicht nochmal gewürfelt).
    Kategorien mit mehreren Varianten (Zeit-Gutschein hat 4, je eine pro Bau-/Forschungsbereich)
    liefern bei Treffer GENAU EINE zufällige Variante daraus. Per Simulation verifiziert (100.000
    Container-Öffnungen): liefert immer exakt 2 Treffer, Häufigkeiten je Kategorie liegen nah an
    den vorgegebenen Prozentsätzen (leichte Verschiebung durch die Auffüll-/Kappungsregel ist
    erwartungsgemäß). Salvenkreuzer aus der Elite-"Geschenkte Elite-Flotte" UND dem Elite-Jackpot
    entfernt (Nutzerentscheidung).

75. **Raid-Zeitplan und Raid-Container-Vergabe überarbeitet** (Nutzerentscheidung, Teil derselben
    "Container-Überflutung"-Anpassung):
    - `RAID_SCHEDULE_BY_USERNAME` (`data/economy.ts`) von 4×/Tag auf 2×/Tag reduziert: ShadowEagle
      0/12 Uhr, SchnelleRatte 6/18 Uhr - weiterhin nie gleichzeitig.
    - Container-Vergabe bei Raids (`raids.ts`) geändert: bei NICHT perfekter Verteidigung weiterhin
      1 Silber-Container PRO gewonnener Welle (nie Gold). Bei PERFEKTER Verteidigung (5/5) NICHT
      mehr alle 5 zu Gold aufgewertet, sondern fest 4 Silber + 1 Gold, PLUS eine unabhängig PRO
      TEILNEHMER gewürfelte Chance (`RAID_PERFECT_ELITE_CHANCE = 15%`) auf zusätzlich 1
      Elite-Container - Elite bleibt damit überall im Spiel reine Glückssache
      (Nutzerentscheidung), nie ein garantierter Bestandteil einer Belohnung. Die
      Abschluss-Nachricht ist jetzt PRO EMPFÄNGER unterschiedlich (`containerTextFor()`), damit nur
      der tatsächliche Elite-Gewinner den Bonus angekündigt bekommt, nicht alle Teilnehmer
      pauschal.

76. **Forschung nach den vier Hauptbereichen in eigene Untertabs aufgeteilt** (Nutzerentscheidung:
    "mehr Platz falls mal mehr Forschungen dazu kommen") - `ResearchDefinition.mainBranch`
    ('waffen'/'verteidigung'/'antrieb'/'wirtschaft') gab es dafür schon seit Einführung des
    Forschungsbaums (siehe Punkt 40), bisher wurden aber einfach alle vier Bäume untereinander auf
    einer einzigen Seite gerendert. `ForschungTreeView` (`Forschung.tsx`) hat jetzt einen eigenen
    Untertab-Schalter (Waffensysteme/Verteidigungssysteme/Antriebstechnik/Wirtschaft & Logistik,
    lokaler `branchId`-State) und zeigt immer nur den gerade gewählten Baum - dieselbe
    `ResearchForest`-Komponente wie vorher, nur nicht mehr alle vier gleichzeitig gemappt. "Gebäude"
    bleibt als fünfter, gleichrangiger Untertab von `ForschungPage` unverändert bestehen.

77. **KI-Spieler (KI-Vega/KI-Nyx) waren praktisch komplett funktionsunfähig - Kernursache:
    `tick()` (Ressourcenproduktion, Bau-/Forschungs-/Verteidigungs-/Modul-Warteschlangen,
    Galaxie-Rückkehr) wurde im globalen Heartbeat (`heartbeat.ts`) NIE aufgerufen.** Bei jedem
    ECHTEN Spieler-Request passiert das automatisch (`handleAction()` in `routes.ts` ruft `tick()`
    IMMER vor der eigentlichen Aktion auf) - ein KI-Spieler stellt aber nie einen Request, die
    einzige Stelle, an der sein Zustand überhaupt verarbeitet wird, ist der Heartbeat. Ohne `tick()`
    dort produzierten KI-Spieler NIE Ressourcen und ihre über `runBotTurn()` gestarteten
    Bau-/Forschungs-Aufträge wurden NIE fertig (sie blieben für immer in der jeweiligen
    Warteschlange stehen, ohne je in `state.fleet`/`state.buildings`/`state.research`/
    `state.defense` überzugehen) - erklärt alle beobachteten Symptome auf einen Schlag: keine
    Verteidigung bei eigenen Raids (Flotte/Verteidigung blieben bei praktisch Null), keine
    Halte-Flotten bei Menschen (`maybeHoldAtHumans()` prüft `state.fleet[id] > 0`), keine
    Elite-Bollwerk-Teilnahme (`maybeHandleGroupOps()` braucht Schiffe zum Beitreten, die es nie
    gab). Fix: `heartbeat.ts` ruft jetzt `await tick(state)` für JEDEN Nutzer auf, bevor
    `processMissions()`/`processRaidTimer()`/(bei Bots) `runBotTurn()` folgen. Per Simulation
    verifiziert: ein frischer KI-Spieler-Zustand produzierte über 2 simulierte Stunden hinweg
    korrekt ~48 Mio. Metall/~25 Mio. Kristall/~10 Mio. Deuterium (vorher: dauerhaft exakt Null).
    Nebenbei behoben: die Zeile `state.lastUpdate = Date.now()` wurde bisher OHNE vorherigen
    `tick()`-Aufruf gesetzt - betraf auch MENSCHLICHE Spieler und kostete bis zu
    `HEARTBEAT_INTERVAL_MS` (2 Minuten) Produktionszeit pro Heartbeat-Takt, sobald ein Spieler
    länger offline war (tick() berechnet die vergangene Zeit ja anhand von `state.lastUpdate`) -
    durch den `tick()`-Aufruf jetzt ebenfalls korrekt.

78. **Dabei zusätzlich ergänzt: KI-Spieler wählen jetzt beim ersten Zug einmalig zufällig eine
    Klasse** (`maybeChooseClass()` in `bot.ts`, `setPlayerClass()`) - ein echter Spieler MUSS das
    UI-Gate durchlaufen (siehe `App.tsx`), ein KI-Spieler umgeht das vollständig und wäre sonst für
    immer bei `playerClass: null` (kein Klassenbonus) hängen geblieben, was nicht dem Anspruch
    entspricht, sich wie ein echter Mitspieler zu verhalten.

79. **Forschungsbaum-Kinderzeile war auf schmalen Mobilgeräten am Bildschirmrand abgeschnitten
    statt scrollbar zu sein** (Nutzer-Screenshot: dritter Kind-Knoten bei 3 Geschwistern nicht
    mehr sichtbar/anklickbar). Ursache: die Kinderzeile in `ResearchNode` (`Forschung.tsx`) hatte
    kein eigenes `overflowX` - bei zu vielen/zu breiten Geschwister-Knoten lief die Zeile über die
    Bildschirmbreite hinaus, ohne selbst scrollbar zu sein. Fix: Kind-Knoten verkleinert (Bildgröße
    54→48px, Boxbreite 104→92px), Innenabstand pro Kind reduziert (16px→8px je Seite), und die
    Kinderzeile bekommt jetzt `overflowX: 'auto'` + `WebkitOverflowScrolling: 'touch'` mit
    `maxWidth: '100vw'` - bei zu vielen Geschwistern lässt sich die Zeile jetzt gezielt seitlich
    wegwischen, statt den Rest der Seite zu verzerren oder Knoten unsichtbar/unklickbar zu machen.
    Andere Modul-Zeilen (Schiffs-/Verteidigungs-/Gebäude-Module in `ShipModuleRow.tsx`/
    `DefenseModuleRow.tsx`/`Gebaeude.tsx`) nutzen bereits `flexWrap: 'wrap'` statt einer starren
    Baum-Zeile und waren davon nicht betroffen - nur der Forschungsbaum braucht eine starre
    Horizontal-Anordnung, weil die Eltern-Kind-Verbindungslinien sonst nicht mehr stimmen würden.

80. **Zweiter Mobil-Fix (Nutzer-Screenshot Statistik-Seite): lange Zeilen-Labels quetschten den
    Wert auf ein Wort pro Zeile zusammen** (z.B. "Container geöffnet (Silber/Gold/Elite): 4 / 59 /
    12" - jede Zahl auf einer eigenen Zeile). Ursache lag NICHT in `Statistik.tsx` selbst, sondern
    im gemeinsam genutzten CSS (`theme.css`s `.info-list-label`/`.info-list-value`, auch von
    `InfoModal.tsx`s `InfoTable`-Komponente genutzt - Ship-/Verteidigungs-/Forschungs-/Modul-Info-
    Popups betroffen): das Label hatte `white-space: nowrap; flex-shrink: 0` gesetzt, wodurch es bei
    langen Texten nahezu die GESAMTE Zeilenbreite beanspruchte und dem Wert kaum noch Platz ließ -
    der Wert brach dadurch bei jedem Leerzeichen um, statt normal zu umbrechen. Fix: beide Seiten
    bekommen jetzt `flex: 1 1 auto; min-width: 0` (teilen sich die Breite fair, dürfen beide bei
    Bedarf normal an Wortgrenzen umbrechen) - bewusst KEIN erzwungenes `white-space: nowrap` auf dem
    Wert (wäre bei den oft längeren Info-Popup-Werten wie Kosten-Strings riskant gewesen und hätte
    das Problem nur auf die andere Seite verlagert).

81. **Imperator-Kampfwerte wieder deutlich gesenkt** (Nutzerentscheidung, korrigiert Punkt 64: die
    dortige Anhebung auf 5.000.000/2.500.000/12.000.000 Waffen/Schild/Panzerung erwies sich als zu
    dominant - der Imperator teilte allein in 4 Runden über 2 Milliarden Schaden aus und beendete
    Kämpfe, ohne dass andere Schiffe noch etwas beitragen mussten). Neue Werte:
    **Waffen 500.000, Schild 400.000, Panzerung 3.000.000** (`ships.ts`). Bewusst NICHT
    gleichmäßig herunterskaliert, sondern weiterhin panzerungslastig gehalten (Panzerung ca. 3,6x
    mehr als der Reaper) - der Imperator soll ein zäher, schwer zu tötender Brocken bleiben, sein
    Waffenschaden liegt aber jetzt nur noch beim ~10-fachen des Salvendreadnought statt zuvor dem
    ~100-fachen. Baulimit (2) und Spezialteile-Kosten (1.000/Kategorie) bleiben unverändert.

82. **Galaxie-Ereignisse (Wrack/Handelskonvoi, `game/galaxyEvents.ts`)** - Nutzerentscheidung
    (nur 2 Spieler, PvE-Fokus): taucht zufällig an einer freien Galaxie-Position auf
    (`maybeSpawnGalaxyEvent()`, `GALAXY_EVENT_SPAWN_CHANCE` in `economy.ts`, EINMAL pro
    Heartbeat-Durchlauf gewürfelt, NICHT pro Nutzer-`tick()` - sonst würde die Chance bei aktiv
    spielenden Menschen durch das 3s-Polling voellig anders wirken als bei einem nur alle 2 Minuten
    per Heartbeat verarbeiteten Bot). Maximal `GALAXY_EVENT_MAX_ACTIVE` (2) gleichzeitig aktiv,
    verschwindet nach `GALAXY_EVENT_LIFETIME_MS` (10h) ungenutzt wieder. Globale, nutzerunabhängige
    Entität in einer eigenen DB-Tabelle (`galaxy_events`, dieselbe id/status/data_json-Struktur wie
    `group_operations`). Bewusst kein PvP-Wettrennen mit Verlustrisiko: eine Bergungs-Flotte macht
    einen einfachen Rundflug (Hin- und automatischer Rückflug OHNE manuellen Rückruf, anders als
    "Halten") - kommt sie zu spät (Ereignis von jemand anderem bereits abgeholt), kostet das nur die
    Flugzeit, nie Schiffe. Beute wird bei ANKUNFT gesichert (Ereignis wird sofort aus der globalen
    Liste gelöscht, damit niemand sonst mehr danach greifen kann), aber erst bei RÜCKKEHR gutgeschrieben
    - analog zu `Mission.farmed`/`finalizeMission()` in `missions.ts`. Positions-Kollisionen (Spieler/
    Piratenbasen/Sektoren/andere Ereignisse) werden über das gemeinsame Hilfsmodul
    `galaxyPositions.ts` ausgeschlossen (bewusst NICHT in `state.ts` verankert, um den Zirkelbezug
    state.ts↔galaxy.ts zu vermeiden, den auch `galaxy.ts` selbst schon umgeht).

83. **Heimatbasis verlegen (`relocateGalaxyPosition()` in `galaxy.ts`)** - gegen
    `RELOCATE_BASE_COST_DM` (300 DM, reiner DM-Preis ohne Ressourcenanteil, analog zum
    Klassenwechsel-Muster) gezielt eine neue, freie Galaxie-Position wählen, z.B. um näher an
    bestimmten Sektoren/dem Mitspieler zu sitzen. Sofortige Wirkung, kein Flug/keine Wartezeit -
    nur die gespeicherte `galaxyPosition` ändert sich, Flotte/Verteidigung/Fortschritt bleiben
    unangetastet. Aktive Galaxie-Ereignisse zählen ebenfalls als belegt (vom Route-Handler als
    `extraReserved`-Set übergeben, siehe Punkt 82 zum vermiedenen Zirkelbezug).

84. **Piratenkapitän-Kampfwerte gestaffelt nach Sektorstufe statt fixer `NPC_SPECIALS`-Werte**
    (`captainStatsForSektor()` in `combat.ts`, Nutzerentscheidung: die alten statischen Werte
    6.500/1.800/48.000 gingen in einer Welle mit vielen anderen Gegnern praktisch immer unter,
    ohne dass die Bonus-Belohnung beim Sieg spürbar wurde). Niedrig 25.000/20.000/250.000, Mittel
    100.000/80.000/900.000, **Hoch UND Elite-Bollwerk exakt auf Imperator-Niveau**
    (500.000/400.000/3.000.000 - dynamisch von `ships.ts` übernommen, bleibt automatisch synchron,
    falls der Imperator künftig nochmal angepasst wird). Wird als `sideBStatsOverride` an den
    Kampf-Worker durchgereicht (dasselbe bereits bestehende Muster wie beim Piratenadmiral, siehe
    `generateAdmiralEncounter()`) - bleibt dadurch bewusst UNBEEINFLUSST von `PIRATE_RESEARCH_SHARE`,
    eigene feste Macht-Stufe statt forschungsabhängiger Skalierung. Betrifft `missions.ts`
    (Solo-Piraten-Sektoren), `groupOps.ts` (Elite-Bollwerk) UND `simulator.ts` (Kampfsimulator
    MUSS dieselbe Engine nutzen, siehe Punkt 31 - sonst würde die Vorhersage bei aktivem
    Kapitän-Spawn systematisch danebenliegen).

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
- Zeit-Gutscheine für Bauzeit auf Schiffe/Verteidigung/Gebäude aufgeteilt (vorher nur Schiffe);
  Schiffe/Verteidigung wirken jetzt auf alle parallelen Bauplätze, nicht mehr nur den ersten.
- Raids laufen jetzt in 5 Wellen über 1 Stunde nach Ankunft statt als einzelner Kampf; Feindstärke
  skaliert auf der Verteidigungsanlagen-Stärke (70%→110% über die Wellen), Belohnung gibt es erst
  als Abschluss-Bonus nach der letzten Welle (plus Elite-Container bei perfekter Verteidigung).
- Klassensystem eingeführt: drei reine Kampf-Archetypen (Kanonier: Waffenschaden, Bollwerk:
  Schild/Panzerung, Kommandant: Allrounder) - Erstwahl kostenlos und verpflichtend, Wechsel
  jederzeit gegen 500 DM.
- Bug behoben: der 24h-Kampf-Booster (+20%) war seit Einführung wirkungslos, da nie tatsächlich an
  einen Kampf übergeben - jetzt überall korrekt verdrahtet.
- Werft: Salvenschiffe + Imperator in neuen Untertab "Spezialschiffe" umgezogen (Shop > Spezialteile
  entfällt dafür). Jedes Kampfschiff + Imperator bekommt eigene Waffen-/Schild-/Panzerung-/
  Antriebs-Module (Stufe 1-10, +3%/+2% pro Stufe, eigener Bau-Slot), per Verbindungslinie direkt
  unter der jeweiligen Schiffskarte statt in einem eigenen Tab.
- Imperator-Kampfwerte auf Millionen-Niveau angehoben (Waffen 5 Mio., Schild 2,5 Mio., Panzerung
  12 Mio.); dabei Bug behoben, dass der Imperator bei Raids nie mitverteidigt hat (bei Sektor-
  Missionen/Elite-Bollwerk/Piratenadmiral war er schon immer zugelassen).
- Werft komplett neu strukturiert: 2 Haupttabs Schiffe/Verteidigung, Spezialschiffe jetzt
  gleichrangiger Klassen-Tab statt eigener Haupttab, eigenständige Verteidigung-Seite entfernt.
  Verteidigung nach Klassen unterteilt (Leichte/Schwere/Schild/Spezialverteidigung). Zwei neue
  Verteidigungsanlagen mit Mehrfachziel-Salve (Sentinel-/Ultimate-Kanone), dritte Schildkuppel
  (Gigant-Schildkuppel). Neues Verteidigungs-Modulsystem (Waffen/Schild/Panzerung, kein Antrieb).
  Dabei drei Bugs behoben: generateDefenseFleet() schloss neue Spezialverteidigung UND die neue
  Gigant-Schildkuppel nicht aus; der gemeinsame Schildkuppel-Pool ignorierte bisher Klassen-Bonus/
  Kampf-Booster komplett.
- Bau-Button für limitierte Einheiten (maxCount/unique) blieb an mehreren Stellen client-seitig
  irreführend anklickbar (Gruppen-Expeditionen bei Schiffen nicht mitgezählt, Imperator-Karte
  zählte nur state.fleet, Verteidigung zählte die eigene Bauwarteschlange nicht mit) - der Server
  hätte den Bau zwar ohnehin korrekt abgelehnt, jetzt stimmt auch die Anzeige.
- Piraten/NPCs bekommen jetzt 50% der relevanten Forschung (vorher 0%) - betrifft Waffen-/Schild-/
  Panzerungtechnik, Präzision, Ausweichen, Kritische Treffer, Zielerfassung, Schild-Regeneration,
  Durchschlag; bei Mehrspieler-Kämpfen zählt der Durchschnitt aller Beteiligten. Klassen-Bonus/
  Module/Kampf-Booster bleiben exklusiv beim Spieler. Dabei einen Bug korrigiert: Ausweichen nutzte
  Schützen- statt Ziel-Forschung (war vorher folgenlos, da Piraten ohnehin 0% Forschung hatten).
- Container-Überflutung behoben: Container stapeln sich jetzt (max. 1 Eintrag pro Stufe statt
  vieler Einzelkarten). Zieh-Mechanik von "N aus Pool wählen" auf unabhängige Dropchance pro
  Kategorie umgestellt (immer genau 2 Treffer). Raid-Zeitplan von 4×/Tag auf 2×/Tag reduziert.
  Raid-Container bei perfekter Verteidigung: fest 4 Silber + 1 Gold statt 5 Gold, Elite nur noch
  als 15%-Zusatzchance. Salvenkreuzer aus Elite-Container/-Jackpot entfernt.
- Inventar: einlösbare Belohnungen jetzt nach Kategorie gruppiert (Rohstoffe, Dunkle Materie,
  Ausrüstungs-Teile, Zeit-Gutscheine, Geschenkte Schiffe) statt einer flachen Liste.
- Forschung: die vier Hauptbereiche (Waffensysteme/Verteidigungssysteme/Antriebstechnik/
  Wirtschaft & Logistik) sind jetzt eigene Untertabs statt untereinander auf einer Seite.
- KI-Spieler-Kernbugfix: tick() lief im Heartbeat nie, dadurch produzierten KI-Spieler nie
  Ressourcen und ihre Bau-/Forschungsaufträge wurden nie fertig - erklärt alle Symptome (keine
  Verteidigung, keine Halte-Flotten, keine Elite-Bollwerk-Teilnahme). Betraf nebenbei auch
  menschliche Spieler (bis zu 2 Min. Produktionsverlust pro Heartbeat-Takt). KI-Spieler wählen
  jetzt außerdem beim ersten Zug eine zufällige Klasse.
- Forschungsbaum: Kind-Knoten verkleinert, Kinderzeile bekommt eigenes horizontales Scrollen -
  war auf schmalen Mobilgeräten am Bildschirmrand abgeschnitten statt scrollbar zu sein.
- Statistik/Info-Popups: lange Zeilen-Labels quetschten den Wert auf ein Wort pro Zeile zusammen
  (theme.css .info-list-label/.info-list-value) - beide Seiten teilen sich jetzt die Breite fair.
- Imperator-Kampfwerte wieder deutlich gesenkt: Waffen 5 Mio.→500k, Schild 2,5 Mio.→400k,
  Panzerung 12 Mio.→3 Mio. - war zu dominant und beendete Kämpfe im Alleingang.
