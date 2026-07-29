# Expeditions-Commander

React + Node/Express Backend, SQLite-Datenbank.

## Lokale Entwicklung

Erfordert **Node.js v20** (LTS). Auf Arch/CachyOS liefert das Standardpaket `nodejs` die
Rolling-Release-Version (z.B. v26), die zu neu für die native `better-sqlite3`-Bindung ist - der
Server crasht dann beim Start mit "Could not locate the bindings file". Stattdessen
`nodejs-lts-iron` installieren:

```
sudo pacman -S nodejs-lts-iron
```

Nach einem Node-Wechsel muss die native Bindung neu gebaut werden:

```
cd server && npm rebuild better-sqlite3
```

Danach `npm install` in `client/` und `server/`, dann `npm run dev` in beiden Ordnern (siehe
`.claude/launch.json` für die Ports 4000/5173).

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
  src/game/bot.ts                    KI-Spieler-Mitspieler-Interaktion: Elite-Bollwerk/Halten bei
                                      Menschen/Piratenbasis-Angriff+Spionage - Wirtschafts-
                                      Entscheidungen (Gebäude/Forschung/Schiffe/Verteidigung/
                                      Mining) liegen in economyBotTurn.ts, ensureBotUsers() legt
                                      die Accounts einmalig beim Start an
  src/game/economyBotTurn.ts         Wirtschafts-Entscheidungslogik (runEconomyBotTurn()) -
                                      genutzt von bot.ts UND pirateBaseState.ts, ausgelagert um
                                      einen Zirkelimport zwischen beiden zu vermeiden

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
                                      (Spieler/Piratenbasen/Sektoren/Aussenposten) - genutzt von
                                      galaxy.ts (Verlegen) und galaxyEvents.ts (Spawn), bewusst OHNE
                                      Abhaengigkeit zu state.ts/galaxy.ts (Zirkelbezug-Vermeidung)
  src/game/outposts.ts               Aussenposten (kontestierte Galaxie-Knoten): Eroberung,
                                      Verstaerkung/Rueckruf der gemeinsamen Garnison, opportunistische
                                      Piraten-Rueckeroberungs-KI, Flugzeit-Bonus-Berechnung
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
                                      calculatePoints(), recordEnemyKills(),
                                      calculateFleetPowerPoints()) und Bestenliste
                                      (getLeaderboard())

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
  src/game/data/classes.ts           Kampf-Klassendefinitionen (Kanonier/Bollwerk/Kommandant)
                                      inkl. aller Bonus-Konstanten und Anzeigetexte
  src/game/data/economyClasses.ts    Wirtschafts-Klassendefinitionen (Schmuggler/Ingenieur/
                                      Prospektor) - zweite, unabhängige Klassenwahl, siehe
                                      README Punkt 87

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

20. **Gestaffelter Einzelschiff-Rückzug** (`UNIT_RETREAT_THRESHOLD = 0.3`, `runRounds()` in
    `combat.ts`, Nutzerentscheidung Juli 2026 - ersetzt die vorherige Flotten-weite
    `RETREAT_THRESHOLD = 0.5`-Schwelle auf die kombinierte Kampfkraft aller Einheiten, die bei
    Unterschreitung die GESAMTE Seite A gleichzeitig abziehen liess): JEDES Schiff auf Seite A
    (Spieler-Flotte) entscheidet jetzt einzeln anhand seines eigenen verbleibenden HP-Anteils - bei
    30% oder weniger zieht es sich zurück (überlebt, kämpft aber ab dieser Runde nicht mehr mit),
    während weniger beschädigte Schiffe weiterkämpfen. Verhindert Alles-oder-Nichts-Ausgänge noch
    konsequenter als vorher: eigene Verluste liegen jetzt in einer echten Bandbreite statt nur bei
    "kaum welche" oder "fast alles". Zurückgezogene Schiffe sammeln sich in `retreatedUnitsA` und
    werden am Ende wieder zu `unitsA` addiert, damit sie als Überlebende zählen. Gilt NICHT für
    Heimverteidigung (Raids, `allowRetreat:false`, da Verteidigungsanlagen nicht "fliehen" können)
    und wird pro Runde nur ausgelöst, solange noch Gegner leben (kein "Rückzug" im selben Zug, in
    dem bereits der letzte Gegner fällt). **Wichtig für Auswertungscode:** da jetzt auch NUR EIN
    Teil der Flotte fliehen kann, während der Rest den Kampf trotzdem noch vollständig gewinnt,
    ist `result.retreated` NICHT mehr automatisch exklusiv zu "alle Gegner vernichtet" - jede
    Stelle, die `retreated` für Ausgangs-Text/Statistik nutzt, muss zusätzlich prüfen, ob der
    Gegner wirklich noch lebt (siehe `npcFullyDestroyed`-Gate in `missions.ts`, `groupOps.ts` und
    `simulator.ts` - `raids.ts` betroffen nicht, da dort `allowRetreat` immer `false` ist).

21. **RapidFire folgt einer bewussten 1:1-Rollenverteilung**, keine Häufung auf einzelne Klassen
    (RAPIDFIRE-Tabelle in `combatConstants.ts`). Nur der Bomber hat RF gegen Verteidigungsanlagen,
    der Imperator als Ausnahme gegen alles. Salvenschiffe (Punkt 24) sind komplett RF-immun.
    **Ausnahme (Nutzerentscheidung Juli 2026):** so gut wie jede NPC-Einheit hat RF gegen
    `leicht`/`schwer` (Jäger-Klassen) - kombiniert mit `weightsForProfile()`'s 'schwarm'-Profil
    (gewichtet Tier-1/2-Schiffe stark, siehe `generatePiratenFleet()`), das Piraten-Flotten selbst
    ueberwiegend aus genau diesen Klassen zusammensetzt, gingen eigene Jäger unabhängig von der
    Stückzahl fast immer zuerst drauf. `getRapidFireChance()` in `combat.ts` nimmt jetzt einen
    dritten Parameter `attackerIsPlayer` entgegen und halbiert (`NPC_RF_VS_JAEGER_FACTOR = 0.5`)
    den RF-Bonus NUR wenn der SCHÜTZE ein NPC ist und das Ziel `leicht`/`schwer` - eine
    symmetrische Absenkung haette auch die eigene Effektivitaet beim Räumen von
    Piraten-Jäger-Schwärmen geschwächt. Die Ziel-AUSWAHL selbst (`rfMap` in `fireShots()`, ob ein
    Schütze RF-Ziele bevorzugt anvisiert) bleibt unverändert - nur die Folgeschuss-Chance sinkt.

21a. **Instant-Explosions-Mechanik gedämpft** (`EXPLOSION_HP_THRESHOLD = 0.7`/
    `EXPLOSION_CHANCE_EXPONENT = 1.15` in `combatConstants.ts`, Anwendung in `applyHitToTarget()`,
    Nutzerentscheidung Juli 2026): schwer beschädigte Einheiten können weiterhin bei einem Treffer
    sofort komplett ausfallen (statt regulär per Schaden auf 0 HP zu kommen), aber die Chance
    steigt jetzt LEICHT UEBERLINEAR (Exponent 1.15 statt der vorherigen reinen linearen Chance
    `1 - hpCur/hpMax`) mit dem Schadensgrad, gedämpft ueber
    `severity = 1 - (hpCur/hpMax)/EXPLOSION_HP_THRESHOLD`, `pExplode = severity^EXPLOSION_CHANCE_EXPONENT`.
    **Balance-Historie (Zielvorgabe: Kämpfe sollen 40-80 Runden dauern, `MAX_ROUNDS = 100` bleibt
    als harte CPU/RAM-Grenze unangetastet):** Schwelle 0.4/Exponent 2 senkte Verluste zwar stark
    (5000 Leichter Jäger vs. Piraten-Hoch: 18% statt 63%), liess Kämpfe im Kampfsimulator aber
    KONSEQUENT bis `MAX_ROUNDS` laufen statt sich natürlich aufzulösen. Schwelle 0.55/Exponent 2
    ergab ~89-92 Runden (noch zu hoch). Iterativ zurueckgerudert bis Schwelle 0.7 (=
    Originalwert) mit nur noch leicht gedämpftem statt reinem linearen Exponenten (1.15 statt 1)
    im Kampfsimulator konsistent ~75-85 Runden ergab - knapp im/am Rand des Zielfensters. Bei so
    kleinen Stichproben (3-12 Simulator-Durchläufe) schwankt das Ergebnis spürbar durch die
    Zufallskomponente in Wellenstärke/-zusammensetzung, nicht durch die Parameter selbst - exakte
    Rundenzahlen sind daher als Richtwert, nicht als garantierte Grenze zu verstehen.

21b. **Durchschlag-Forschung (Overkill) auf 50% Maximalwert gedeckelt** (`effectPerLevel` in
    `research.ts` von 0.10 auf 0.05 gesenkt, Nutzerentscheidung Juli 2026, Teil derselben
    "Kämpfe sollen taktischer/länger dauern"-Balance-Runde wie Punkt 21a): bei voller Stufe 10
    trug bisher 100% des Ueberschussschadens auf das naechste gleichartige Ziel ueber (kombiniert
    mit `MAX_CASCADE = 5` in `applyHitToTarget()` konnte ein einzelner starker Treffer so bis zu 5
    Schiffe desselben Typs auf einen Schlag vernichten statt die Flotte schrittweise
    runterzunageln) - jetzt max. 50% bei Stufe 10. `getDurchschlagFraction()` in `combat.ts` liest
    `effectPerLevel` weiterhin generisch aus `RESEARCH` aus, keine Code-Aenderung noetig.
    `MAX_CASCADE` selbst blieb unveraendert bei 5.

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
    Missionen gesammelt unter "Farm-/Beuteberichte". Raids folgen demselben Prinzip über ein
    eigenes `RaidState.waveLog`-Feld statt `Mission.skirmishLog` (siehe Punkt 45,
    `CombatDetail.skirmishes` statt `FarmDetail.skirmishes` - Raid-Berichte bleiben deshalb unter
    "Kampfberichte", nicht "Farm-/Beuteberichte"). Elite-Bollwerk und Piratenadmiral nutzen dieses
    Muster BEWUSST NICHT (Nutzerentscheidung) - deren Multiplayer-Kampfberichte bleiben wie
    bisher pro Stunden-/10-Minuten-Check einzeln.
    **Bugfix (Juli 2026):** `SkirmishList` in Nachrichten.tsx rendert `sk.playerResults` PRO
    Welle jetzt durch `groupByOwner()` (dieselbe Funktion, die der unbatchte CombatDetail-Zweig
    schon nutzt) - direkt nach der Umstellung auf Wellen-Sammelberichte landeten Verteidiger-,
    Verstärker- und haltende Flotten bei Raids sonst alle in einer einzigen Tabelle "Eigene
    Flotte" statt getrennt nach Besitzer (Name kommt aus `CombatUnitResult.ownerUsername`, siehe
    homeShipIds/reinforcerStates/heldStates in raids.ts).
    **UX-Verbesserung (Juli 2026, Nutzerentscheidung):** die "aufklappbaren Unterabschnitte" oben
    waren bis dahin eigentlich nur visuell abgetrennte Karten, aber ALLE gleichzeitig voll
    ausgeklappt - bei bis zu 12 Stunden-Checks bzw. 5 Wellen musste man durch eine sehr lange
    Seite scrollen. `SkirmishList` haelt jetzt einen `openIndices: Set<number>`-State, jeder
    Eintrag startet zugeklappt (nur Kopfzeile mit Ausgang sichtbar) und laesst sich einzeln per
    Klick auf/zuklappen, plus "Alle aufklappen"/"Alle zuklappen"-Buttons oben in der Liste fuer
    den Fall, dass man doch alles auf einmal sehen will.

34a. **Asteroiden-Felder: "reicher Fund"-Chance pro Stunden-Check** (`ASTEROID_RICH_FIND_CHANCE`
    in `economy.ts`, `runAsteroidRichFindCheck()` in `missions.ts`, Nutzerentscheidung Juli 2026)
    - 8% Chance pro Stunden-Check (unabhängig von der Asteroiden-Eskorte-Chance, siehe Punkt 34),
      den bis dahin akkumulierten `mission.farmed` (Metall/Kristall/Deuterium) zu verdoppeln.
      Bewusst als Glücksspiel-Mechanik: früh in der 12h-Mission bringt ein Treffer wenig, spät
      einen großen Bonus - mehrere Treffer in derselben Mission schaukeln sich sogar auf, da
      `farmed` kumulativ verdoppelt wird. Betrifft NICHT `mission.dmFound` (bleibt an das
      bestehende `dmCap`-System gebunden). Treffer sammeln sich in `mission.richFindLog` (analog
      zu `skirmishLog`, Punkt 34) und werden erst im Abschlussbericht bei Rückkehr angezeigt
      (`FarmDetail.richFinds`, eigene Tabelle in Nachrichten.tsx).

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
      22), MULTIPLIZIERT mit einer festen Eskalationstabelle über die 5 Wellen: 130% / 150% / 170% /
      185% / 200% (`RAID_WAVE_FACTORS` in `economy.ts`, Balance-Anpassung Juli 2026 Teil 2 -
      Nutzerentscheidung: vorherige Kurve 80/90/100/115/130% war zu schwach, Verteidiger gewannen
      Wellen fast immer ohne jeden Verlust, da eigene Tech-/Schild-Boni die knapp unterlegene
      Rohstärke locker ausglichen; davor 70/80/90/100/110%; ersetzt die noch frühere zufällige
      Grund-Varianz `RAID_MULTIPLIER_ROLL`, die für Raids nicht mehr verwendet wird). Verteidiger-
      Flotte/-Verteidigung tragen Verluste vorheriger Wellen weiter (kein Reset zwischen Wellen,
      `DEFENSE_REPAIR_PERCENT` greift weiterhin pro Welle). `RAID_MIN_TARGET_POWER` wirkt als
      Untergrenze für die Verteidigungsanlagen-Basis selbst (nicht mehr pro Welle geteilt) -
      schützt reine Flotten-Accounts ohne nennenswerte Verteidigungsanlagen vor einem quasi
      wirkungslosen Raid.
    - **Ist nichts mehr zu verteidigen** (von Anfang an oder durch vorherige Wellen aufgerieben,
      `hasAnyDefense()`), werden die restlichen Wellen ohne Kampf übersprungen statt einzeln
      sinnlos simuliert.
    - **Jede Welle (inkl. übersprungener/kampfloser) landet in `raid.waveLog` statt sofort als
      eigene Nachricht verschickt zu werden** (Nutzerentscheidung Juli 2026, analog zu
      `Mission.skirmishLog`, siehe Punkt 34) - `finalizeRaidWaves()` verschickt EINEN
      Abschlussbericht PRO Beteiligtem (Verteidiger, jeder Verstärker, jede haltende Flotte),
      alle mit derselben `waveLog`-Referenz als `CombatDetail.skirmishes` eingebettet. Ersetzt die
      vorherigen bis zu `RAID_WAVE_COUNT` Einzel-Nachrichten PRO Beteiligtem.
    - **Belohnung gibt es NICHT pro Welle einzeln, sondern als EINE Abschluss-Belohnung** nach der
      letzten Welle (`finalizeRaidWaves()`): ein Silber-Container pro gewonnener Welle. Bei einer
      PERFEKTEN Verteidigung (alle `RAID_WAVE_COUNT` Wellen gewonnen) gibt es stattdessen fest
      5x Silber + 2x Gold (Balance-Anpassung Juli 2026 Teil 2, Nutzerentscheidung: vorher 4x
      Silber + 1x Gold - angehoben, weil eine perfekte 5/5-Verteidigung seit der Verschärfung der
      Raid-Wellenstärke, siehe `RAID_WAVE_FACTORS` oben, deutlich seltener geworden ist), PLUS
      eine Chance von `RAID_PERFECT_ELITE_CHANCE` (20%, vorher 15%) auf 1 zusätzlichen (on top,
      nicht als Ersatz) Elite-Container - sonst nur über den Piratenkapitän im Elite-Bollwerk
      erreichbar. Bergungs-DM und Ressourcen-Diebstahl (nur falls nicht perfekt verteidigt)
      greifen ebenfalls nur EINMAL am Ende, basierend auf der Summe/dem Endstand über alle Wellen
      (`raid.accumulatedDestroyed`), nicht pro Welle.
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
    Gegenspieler immer die beste Wahl gewesen). **Update Juli 2026 (siehe Punkt 87):** Wirtschafts-
    Klassen wurden SPAETER doch eingefuehrt, aber bewusst NICHT als Ersatz/Alternative zur
    Kampf-Klasse (das haette exakt das hier verworfene Problem zurueckgebracht) - sondern als
    komplett unabhaengige, rein optionale ZWEITE Klassenwahl obendrauf. Kein Zielkonflikt mehr:
    die Kampf-Klasse bleibt Pflicht und verliert nie an Wert, die Wirtschafts-Klasse ist ein reiner
    Zusatz.

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

85. **"Feinde vernichtet" fließt gestaffelt nach Gegnerwert in die Punktzahl ein statt pauschal 1
    Punkt pro Einheit** (Nutzerentscheidung Juli 2026, `getUnitPointValue()` in `combat.ts`,
    `POINT_WEIGHTS.perEnemyDestroyed` entfernt): Punktwert leitet sich aus den Baukosten her
    (Metall+Kristall+Deuterium summiert, `UNIT_POINT_COST_SCALE = 100000` - ein Leichter Jäger
    ergibt so genau 1 Punkt), damit bei neuen Schiffen/Verteidigungsanlagen nichts manuell
    nachgepflegt werden muss. Einheiten OHNE Baukosten (Piratenkapitän 25, Piratenadmiral 500,
    Imperator 1500 - teileCost-basiert statt Metall/Kristall/Deuterium) bekommen feste Werte in
    `UNIT_POINT_OVERRIDES`. `PlayerStats.enemiesDestroyed` bleibt als reiner Rohzähler für die
    Statistik-Anzeige unverändert; neu ist `enemiesDestroyedByType: Record<string, number>`, das
    `recordEnemyKills()` (`stats.ts`, zentral genutzt von `missions.ts`/`raids.ts`
    x3/`groupOps.ts` statt der vorherigen 5 einzelnen `+=`-Stellen) parallel befüllt - die
    Punkteberechnung selbst liest nur noch `enemiesDestroyedByType`. **Wichtig:** bestehende
    Spielstände hatten Kills nie nach Typ aufgeschlüsselt, nur als Summe - ihre BISHERIGEN Kills
    tragen dadurch rückwirkend NICHT mehr zur Punktzahl bei (nur neue Kills ab diesem Update),
    was zu einem einmaligen Punkte-Rückgang in der Bestenliste führt.

86. **Punktzahl erweitert um "Gesamtmacht" (aktuelle Flotte/Verteidigung) + gezielt NICHT auf
    alle Statistik-Felder ausgeweitet** (Nutzerentscheidung Juli 2026, `calculateFleetPowerPoints()`
    in `stats.ts`): liest `state.fleet`/`state.defense` direkt (nicht `PlayerStats`) und gewichtet
    jede Einheit ueber dieselbe `getUnitPointValue()`-Funktion wie vernichtete Gegner (Punkt 85) -
    ein gebauter Reaper zaehlt entsprechend mehr als ein Leichter Jaeger. **Einzige Punkte-Kategorie,
    die wieder SINKEN kann** (bei Flottenverlust/Verschrottung) - bewusst so gewaehlt statt
    `stats.shipsBuilt` (waechst nur, spiegelt historische Investition statt aktueller Staerke).
    Fliesst in `getLeaderboard()` als `calculatePoints(stats) + calculateFleetPowerPoints(state)`
    ein. Bewusst NICHT in die Punktzahl aufgenommen (Nutzerentscheidung, "nur die relevanten
    Sachen"): `researchCompleted` (jeder Forschungszweig deckelt bei Stufe 10 - irgendwann haben
    alle Spieler alles fertig, dann unterscheidet der Wert nicht mehr und traegt nichts zu einer
    wachsenden "Macht" bei), `containersOpened`/`resourcesLooted` (Glueck/Fleiss, keine Kampfkraft),
    `ownShipsLost` (Verlust, kein Gewinn). Ausserdem entfernt:
    `POINT_WEIGHTS.captainDefeated` (fixer Wert 20) - besiegte Piratenkapitaene liefen SCHON ueber
    `enemiesDestroyedByType.piratenkapitan` (Punkt 85) mit, waeren sonst doppelt gezaehlt worden.
    `stats.captainsDefeated` bleibt als reiner Rohzaehler fuer die Statistik-Anzeige bestehen.

87. **Wirtschafts-Klassen als optionale ZWEITE, unabhängige Klassenwahl** (Nutzerentscheidung Juli
    2026, `EconomyClass` in `types.ts`, `data/economyClasses.ts`) - siehe Punkt 56/57 fuer die
    frühere Ablehnung einer Kampf-vs-Wirtschaft-Alternativwahl und warum DIESES Design (additiv,
    nicht alternativ) das damalige Problem nicht wiederholt. Drei Klassen, strikt getrennt nach
    Wirkungsbereich (Handel/Bau/Förderung), rühren NIE an Waffen/Schild/Panzerung:
    - **Schmuggler** (Handel): Handelsgebühr halbiert (`ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER`,
      20%→10%), Schrott-Rückerstattung ×1,5 (30%→45%), Shop-Booster ×0,85 DM-Kosten.
    - **Ingenieur** (Bau): Bauzeit ×0,85 für Schiffe UND Verteidigung UND Gebäude
      (`economyBauzeitMultiplier()` in `actions.ts`, in `bauzeitMultiplier()`/
      `defenseBauzeitMultiplier()`/`gebaeudeBauzeitMultiplier()` eingehängt) - bewusst NUR Zeit,
      nicht Kosten (die rabattieren schon die Kampf-Klassen, sonst Ueberschneidung).
    - **Prospektor** (Förderung): Mining-Ertrag ×1,2 (Schiffe UND Gebäude, `miningMultiplier()`
      in `missions.ts` + `miningBuildingMultiplier()` in `actions.ts`), Dunkle-Materie-Fundrate im
      Asteroidenfeld ×1,3 (NUR die Rate, `dmCap` selbst bleibt unverändert), Treibstoffverbrauch
      bei Galaxie-Flügen ×0,9 (`galaxyFuelCost()` in `galaxy.ts`, jetzt mit optionalem
      `state`-Parameter - betrifft NUR galaxie-basierte Flüge wie Halten/Event-Bergung/
      Piratenbasis-Angriff, NICHT die feste Spionagesonden-Flugzeit oder Sektor-Missionen ohne
      eigene Treibstoffkosten).
    Anders als die Kampf-Klasse (Punkt 56): `state.economyClass` startet bei `null` als
    DAUERHAFTER Normalzustand (kein Registrierungs-Zwang), UND jede Wahl kostet
    `ECONOMY_CLASS_CHANGE_COST_DM` (1000 DM) - AUCH die allererste, anders als die kostenlose
    Kampf-Klassen-Erstwahl (`setEconomyClass()` in `classActions.ts`). Client-seitige Spiegel-
    Funktionen (README Punkt 1 gilt analog) in `multipliers.ts`: `getEffectiveTradeFee()`,
    `getEffectiveScrapRefundRate()`, `getEffectiveBoosterCost()`, `economyBauzeitMultiplier()`
    innerhalb der bestehenden `get*BauzeitMultiplier()`-Funktionen, sowie in
    `getMiningMultiplier()`/`getMiningBuildingMultiplier()` - genutzt von `Haendler.tsx`,
    `Schrotthaendler.tsx`, `Shop.tsx` statt der bisherigen flachen `gameData.tradeFee`/
    `gameData.scrapRefundRate`/`booster.cost`-Anzeigen (die bleiben als SPIELER-UNABHAENGIGE
    Basiswerte in `gameData` bestehen, nur die tatsaechliche Anzeige/Buchung liest jetzt den
    Wirtschafts-Klassen-Bonus mit ein). Neuer Endpoint `POST /game/economy-class` (analog zu
    `/game/class`).

88. **Piratenbasen wachsen jetzt "genau wie ein Spieler"** (Nutzerentscheidung Juli 2026: "Piraten
    sollen genau so wachsen wie Spieler. Gebäude bauen, forschen und Asteroiden fliegen, Schiffe
    und Verteidigung bauen. Ohne Begrenzung") - kompletter Umbau von `PirateBaseState` (vorher nur
    `{fleet, defense, resources, lastGrowthAt}`, siehe Punkt bei "Rebalance Juli 2026" oben) auf
    `{id, system, position, state: PlayerState}`. `state` ist ein VOLLWERTIGER `PlayerState` -
    dieselbe Wirtschafts-/Bau-/Forschungs-/Mining-Maschinerie wie ein echter Spieler oder
    KI-Mitspieler, KEINE kuenstlichen Obergrenzen mehr (Wachstum nur noch durch dieselben
    wirtschaftlichen Grenzen begrenzt wie bei einem Spieler: Energie, Bauslots, Ressourcenertrag).
    - **Synthetische, garantiert negative `userId`** (`SYNTHETIC_USER_ID_BASE = -1000` minus
      Basis-Index in `pirateBaseState.ts`) - echte Nutzer-Ids sind autoinkrementiert und damit
      immer positiv, kollidieren also nie. Piratenbasen tauchen dadurch NIE in `users`/
      `listAllUsers()` auf und damit auch nie in Bestenliste/Multiplayer-Einladungen/"bei mir
      halten"-Listen (die alle auf `listAllUsers()` aufbauen) - bewusst KEINE eigene
      DB-Nutzer-Tabellen-Zeile, weiterhin dieselbe eigenstaendige `pirate_bases`-Tabelle wie vorher
      (nur der JSON-Blob-Inhalt ist jetzt ein voller `PlayerState` statt der schlanken alten Form).
    - **Start-/Migrations-Mindestbestand** (`SEED_FLEET`/`SEED_DEFENSE`/`SEED_RESOURCES` in
      `pirateBaseState.ts`, uebernimmt die Werte aus der vorherigen "mittlere Staerke"-Rebalance):
      Flotte 60/25/10 (leicht/schwer/kreuzer), Verteidigung 40/25 (raketenwerfer/leichteslaser),
      Ressourcen 150k/90k/40k, PLUS `SEED_BUILDINGS` (kleine Mining-Basis: metallmine 4/
      kristallmine 3/deuteriummine 2/solarkraftwerk 4) als Wirtschafts-Starthilfe - ohne eigene
      Produktion haette eine Basis ihr Startkapital nur verbraucht, statt eigenstaendig
      weiterzuwachsen. Bereits bestehende (alte) Basen werden per `migrateLegacyBase()` erkannt
      (`isLegacyShape()`: kein `state`-Feld vorhanden) und automatisch auf einen vollwertigen
      `PlayerState` umgestellt - ihr bisheriger Bestand fliesst dabei ein (`Math.max` gegen die
      neuen Seed-Werte, nichts geht verloren), inkl. der Mining-Starthilfe. Greift automatisch
      beim naechsten `loadPirateBase()`-Aufruf nach dem Deploy, kein manueller Schritt noetig.
    - **Wirtschafts-/Entscheidungslogik wiederverwendet, aber in ZWEI eigene Module ausgelagert**
      statt direkt aus `actions.ts`/`bot.ts` importiert - Grund: Zirkelimport-Vermeidung.
      `actions.ts` importierte vorher `processPirateAttacks` aus `pirateBaseState.ts`; haette
      `pirateBaseState.ts` umgekehrt aus `actions.ts` importiert, waere das ein Zirkelbezug
      gewesen (analog zum bereits dokumentierten state.ts/galaxy.ts-Fall, siehe Punkt zu
      `assignRandomGalaxyPosition()`). Genauso haette `pirateBaseState.ts -> bot.ts` den bereits
      bestehenden `bot.ts -> pirateBaseState.ts`-Import (`startPirateBaseAttack`) zu einem Zyklus
      geschlossen. Loesung:
      - `runEconomyTick()` (NEU in `actions.ts`, exportiert): reiner "Wirtschafts-Tick" -
        Produktion, alle vier Bau-/Forschungs-Warteschlangen, `processMissions()` - OHNE die
        spielerspezifischen Extras (Raids/Spionage/Gruppen-Expeditionen). `tick()` ruft es zuerst
        auf, macht danach normal weiter. `processPirateAttacks()` wurde dafuer aus `tick()`
        HERAUSGENOMMEN und wird jetzt explizit an den beiden `tick()`-Aufrufstellen (`routes.ts`
        `handleAction()`, `heartbeat.ts`) direkt danach aufgerufen - dadurch importiert `actions.ts`
        nicht mehr aus `pirateBaseState.ts`, der Ruecken-Import wird sicher.
      - **Neue Datei `economyBotTurn.ts`**: `maybeChooseClass`/`maybeBuildBuilding`/
        `maybeStartResearch`/`maybeBuildShips`/`maybeBuildDefense`/`maybeSendMiningFleet` aus
        `bot.ts` hierher verschoben, gebuendelt als `runEconomyBotTurn(state)`. Importiert nur aus
        `actions.ts`/`missions.ts`/`classActions.ts` (keine davon importiert `economyBotTurn.ts`
        zurueck) - dadurch koennen sowohl `bot.ts` (KI-Vega/KI-Nyx, ZUSAETZLICH zu deren
        Mitspieler-Interaktionen wie Halten/Gruppen-Expeditionen/Piratenbasis-Angriff) als auch
        `pirateBaseState.ts` (Piratenbasen, OHNE jede Mitspieler-Interaktion - ergibt fuer eine
        Basis keinen Sinn) es gefahrlos importieren.
    - **`loadPirateBase()` ist jetzt ASYNC** (ruft `runEconomyTick()` auf) - betrifft alle
      Aufrufer: `listActivePirateBases()`/`listActivePirateBaseSummaries()` (beide jetzt async,
      `GET /galaxy` in `routes.ts` entsprechend `async`), `resolvePirateBaseAttack()`,
      `processSpyMissions()` in `spyMissions.ts`.
    - **`runAllPirateBaseTurns()`** (NEU, `pirateBaseState.ts`, aufgerufen aus `heartbeat.ts`):
      treibt alle aktiven Basen einmal PRO HEARTBEAT an (nicht nur lazy beim naechsten Laden durch
      Angriff/Spionage/Galaxie-Ansicht) - sonst wuerden Basen nur wachsen, wenn zufaellig gerade
      jemand hinschaut, genau wie bei den KI-Mitspielern.
    - **Kampfaufloesung nutzt jetzt die ECHTEN, forschungs-/klassenabhaengigen Kampfwerte der
      Piratenbasis** (`resolvePirateBaseAttack()`) statt der vorherigen reinen `baseStats()` ohne
      jeden Bonus - `getEffectiveStats()` pro Einheit vorab berechnet und als
      `sideBStatsOverride` an `runCombatInWorker()` durchgereicht (dasselbe bereits bestehende
      Muster wie beim Piratenkapitaen/Piratenadmiral, siehe Punkt 84 bzw. Admiral-Boss-Punkt) -
      keine Aenderung an der Kampf-Engine selbst noetig.
    - Manuell End-to-End getestet (lokaler Dev-Server, Testaccount, per Skript vorgespulte
      Ankunftszeit statt echter Wartezeit): Migration einer bestehenden (alten) Basis lief
      fehlerfrei durch, Angriff mit 700 Schiffen gegen eine Basis mit zufaellig gewuerfelter
      Kanonier-Klasse zeigte korrekt VERDOPPELTEN Waffenschaden (3.000 statt Basis-1.500) beim
      NPC-Verteidiger, Kampf loeste sich ueber 10 Runden korrekt auf, Beute wurde korrekt
      gutgeschrieben.

89. **Außenposten: kontestierte Galaxie-Knoten** (Nutzerentscheidung Juli 2026, siehe
    `game/outposts.ts`) - 6 feste Positionen (`OUTPOST_POSITIONS`/`OUTPOST_TIERS` in
    `galaxyConstants.ts`, 2 pro Stärke-Stufe niedrig/mittel/hoch, reserviert wie `PIRATE_BASES` in
    `getReservedGalaxyPositions()`), starten piraten-eigen. Reine PvE-Erweiterung: Konflikt ist
    IMMER gegen die Piraten-KI, nie zwischen echten Spielern/Bots (siehe README-Prinzip "kein
    PvP").
    - **Eroberung**: Flotte hinschicken (`startOutpostAttack()`), Kampf gegen eine bei JEDEM
      Angriff frisch gewürfelte NPC-Garnison (`generateFallbackFleet(OUTPOST_TIER_TARGET_POWER[tier])`
      in `economy.ts`, kein dauerhaftes State-Tracking nötig solange piraten-eigen - analog zu
      Sektoren/Raids). Sieg macht die Angreifer-ÜBERLEBENDEN sofort zur neuen, spieler-eigenen
      Garnison (Eroberung UND Erst-Garnisonierung in einem Schritt) - Niederlage/Teilerfolg lässt
      die Überlebenden automatisch heimkehren, Posten bleibt piraten-eigen.
    - **Garnison ist ein gemeinsamer Pool der gesamten Spielerseite** (Menschen + Bots,
      Nutzerentscheidung: kein Attributions-Tracking pro Beitragendem, unnötiger Aufwand für ein
      2-Spieler-Koop-Team) - jeder darf per `startOutpostReinforcement()` verstärken (Flug ohne
      Kampf, Schiffe fliegen direkt in `outpost.garrison`) und per `recallOutpostGarrison()` die
      GESAMTE aktuelle Garnison zu sich zurückrufen.
    - **Piraten-KI erobert opportunistisch zurück** (`runOutpostPirateAiTurn()`, einmal pro
      Heartbeat, analog zu `runAllPirateBaseTurns()`) - KEIN fester Zeittakt wie bei Raids: pro
      spieler-eigenem Posten `OUTPOST_PIRATE_ATTACK_CHANCE`-Chance (0.15) auf einen Rückeroberungs-
      versuch, Angriffsstärke = Tier-Zielstärke × Zufalls-Vorteil (`OUTPOST_PIRATE_ADVANTAGE_ROLL`,
      analog zum `RAID_WAVE_FACTORS`-Muster). Unverteidigte Posten fallen kampflos zurück.
      Bewusst OHNE simulierte Anflugzeit (Piraten "erscheinen" direkt beim Heartbeat-Tick) - anders
      als bei Raids/`PIRATE_BASES` gibt es keine Piraten-Ausgangsposition/-Flotte, die eine echte
      Flugzeit-Simulation rechtfertigen würde.
    - **Strategischer Bonus statt Wirtschafts-/Punktebonus** (Nutzerentscheidung): Flüge, die im
      selben System wie ein spieler-eigener Außenposten starten ODER enden, sind
      `OUTPOST_SPEED_BONUS` (1.15x) schneller (`outpostSpeedMultiplierForSystem()` in
      `outposts.ts`) - eingehängt an den drei Aufrufstellen, die den Bonus anbieten sollen
      (`missions.ts` `sendFleet()`, `pirateBaseState.ts` `startPirateBaseAttack()`, `outposts.ts`
      selbst), bewusst NICHT in `galaxy.ts`s allgemeine Speed-Formel (würde Raids/Halten
      ungewollt mitbeeinflussen).
    - **Explizit kein Straf-Mechanismus**: ein verlorener Posten bedeutet nur, dass die dort
      stationierten Schiffe weg sind - keine Kettenreaktion auf die Heimatbasis, keine
      unwiderruflichen Entscheidungen (Nutzerentscheidung, siehe Kontext "casual Koop-Team").
    - **"Allianz" ist rein kosmetisch, kein eigenes Datenmodell** (Nutzerentscheidung: nur
      Anzeige, keine Mechanik) - `ALLIANCE_NAME`/`PIRATE_ALLIANCE_NAME` ("Sternenbund"/
      "Piratenkonföderation", `economy.ts`) werden über `/game/data` ausgeliefert, die
      Mitgliederliste ist einfach `listAllUsers()` (alle Menschen+Bots). Panel oben in
      `Galaxie.tsx` zeigt Name, Mitglieder, Anzahl gehaltener Außenposten - keine eigene
      Berechtigungslogik, jeder Nutzer konnte ohnehin schon vorher verstärken/zurückrufen.
90. **Außenposten-Balance-Umbau (Nutzer-Feedback Juli 2026, mehrteilig, ersetzt Teile von Punkt 89)**
    - live getestet und mehrfach nachgeschärft, siehe `outposts.ts`/`economy.ts`:
    - **Speed-Bonus global statt System-gebunden**: `outpostSpeedMultiplier()` (vorher
      `outpostSpeedMultiplierForSystem()`) gilt jetzt für JEDEN Flug, nicht mehr nur bei Start/Ziel
      im Besitz-System - und addiert sich pro gehaltenem Posten (`OUTPOST_SPEED_BONUS_PER_OUTPOST`
      = 0.15, bis zu +90% bei allen 6). Aktueller Gesamtwert jetzt in der Galaxie-Allianzbox
      sichtbar (`outpostSpeedBonusPerOutpost` über `/game/data` ausgeliefert).
    - **Garnisonsstärke skaliert mit echter Macht statt fixem Tier-Wert**: sowohl beim Spieler-
      Angriff (`resolveOutpostAttack()`, `sentPower * OUTPOST_MULTIPLIER_ROLL[tier]`) als auch bei
      der Piraten-Rückeroberung (`runOutpostPirateAiTurn()`, skaliert mit `combatFleetPowerBase()`
      der TATSÄCHLICH stationierten Garnison) - der alte fixe `OUTPOST_TIER_TARGET_POWER`-Wert
      bleibt nur noch als Untergrenze für schwache Flotten.
    - **Konzentrations-Bonus gegen Elite-Stacks**: eine Garnison aus wenigen, überdurchschnittlich
      starken Einzelschiffen (Live-Fund: 1 Imperator war trotz Machtskalierung praktisch
      unbesiegbar) bekommt einen zusätzlichen Multiplikator = `1 + OUTPOST_PIRATE_CONCENTRATION_FACTOR
      * log2(Durchschnittsmacht-pro-Schiff / Macht eines Leichten Jägers)` - an der
      DURCHSCHNITTSMACHT PRO SCHIFF festgemacht statt der reinen Schiffsanzahl, damit normale
      Massen-Garnisonen unangetastet bleiben. Mit echten Kampfsimulationen kalibriert (Faktor 1.4 →
      ca. 40-60% Siegchance der Piraten gegen 1 Imperator).
    - **`WAVE_PROFILE_WEIGHTS['outpost']` ergänzt** (fehlte komplett, fiel auf `{schwarm:1}`
      zurück) - Außenposten-Gegner bestehen jetzt aus stärkeren Schiffstypen statt nur der
      billigsten Masse.
    - **Rückeroberungs-Rhythmus auf Cooldown umgestellt** (`nextPirateAttackCheck` pro Außenposten,
      60-120min zufällig) statt einer 15%-Zufallschance PRO Heartbeat (fühlte sich bei mehreren
      gehaltenen Posten wie Dauerbeschuss an) - neu erobernde Spieler bekommen zusätzlich eine
      Gnadenfrist statt sofort wieder angreifbar zu sein.
    - **Keine persönliche Nachricht mehr bei Rückeroberungsversuchen** (`notifyHumans()` entfernt) -
      kein menschlicher Akteur beteiligt, fühlte sich wie Spam an; Ausgang bleibt über die
      Galaxie-Ansicht (Garnisonsstärke/Besitzer) sichtbar.
    - **Farbliche Markierung + zentrale Garnison-Übersicht**: Außenposten-Karten in der
      Galaxie-Ansicht sind grün (Spieler-Allianz) oder rot (Piraten) hinterlegt statt nur als Text
      erkennbar (fester Hex-Wert statt `var(--accent-deut)` im `border`-Shorthand - manche Browser
      lösen CSS-Custom-Properties dort im Inline-Style nicht zuverlässig gegen die CSS-Klasse auf).
      Neue "Stationierte Flotten"-Übersicht in der Allianzbox zeigt alle gehaltenen Posten mit
      direktem "Zurückrufen"-Button, ohne durch alle 50 Systeme blättern zu müssen.
    - **Kampfberichte zeigen "Eure Garnison" statt "Deine Flotte"** bei Außenposten-Ereignissen
      (`CombatSummaryBars`/`groupByOwner` in `Nachrichten.tsx` bekommen ein `ownLabel`/
      `defaultOwner`-Prop) - die Garnison gehört der ganzen Seite, nicht exklusiv dem
      Nachrichtenempfänger.
91. **KI-Bots greifen jetzt sinnvoll Außenposten an** (`bot.ts` `maybeAttackOutpost()`) - setzte
    vorher nur `leicht/schwer/kreuzer` mit 15% Flottenanteil ein; da Bots mit der Zeit vor allem
    stärkere Schiffstypen bauen, kam dabei fast immer weniger als der Mindestwert von 5 Schiffen
    zusammen und der Angriff wurde komplett übersprungen (kein Zufalls-Pech, ein harter Blocker).
    Jetzt alle Kampfschifftypen, 50% Flottenanteil, plus eine Mindeststärke-Prüfung gegen die
    Tier-Zielstärke des Postens, bevor überhaupt ein Versuch gestartet wird.
92. **Piratenbasen greifen jetzt selbst Spieler/Bots an** (`runAllPirateBaseOffensiveTurns()` in
    `pirateBaseState.ts`, neuer `PirateBaseOffensiveDeployment`-Typ) - die 4 aktiven Piratenbasen
    waren bisher rein passiv (nur von Menschen/Bots angreifbar, siehe Punkt 88). Analog zur
    Außenposten-Piraten-KI: Cooldown pro Basis (`nextOffensiveCheck`, ursprünglich eine 15%-
    Zufallschance PRO Heartbeat, nach Nutzer-Feedback "das geht ja alle 2 Minuten, viel zu oft" auf
    12-24h umgestellt, ~1-2 Angriffe/Tag), sendet 20% der echten Kampfflotte gegen einen
    zufälligen Spieler/Bot (Ziel-Home-Fleet+Verteidigung, keine simulierte Rückflugzeit -
    Überlebende kehren bei Kampfauflösung sofort zurück), Beute proportional zum Zerstörungsanteil
    beim Ziel.
93. **Piraten-Sektor Mittel/Hoch überarbeitet** (Nutzer-Feedback: "man sieht kaum noch eine
    Verwendung für den Sektor" neben den frisch überarbeiteten Außenposten/Piratenbasen) - siehe
    `sectors.ts`/`missions.ts`:
    - Mittel/Hoch tauschen die bisherige Kapitän-Zufallschance gegen GARANTIERTE Elite-Container
      (`guaranteedEliteContainers`: 1 bzw. 3, vergeben in `finalizeMission()`) - planbar statt
      Glücksspiel. Niedrig bleibt unverändert (weiterhin Kapitän-Chance auf Silber, keine Elite-
      Container).
    - `lootBase` auf allen 3 Stufen deutlich reduziert (nur noch Nebeneffekt, Teile bleiben die
      Kernbelohnung); Mittel/Hoch im Gegenzug spürbar stärkere Gegner (`npcFloor` +
      `PIRATEN_MULTIPLIER_ROLL` angehoben).
    - **"Reicher Fund"-Mechanik vom Asteroiden-Feld übertragen**: `runAsteroidRichFindCheck()`
      generalisiert zu `runRichFindCheck(mission, chance)` (Logik war schon generisch genug, nur
      Name/Chance waren asteroid-spezifisch) - 8% Chance pro Stunden-Check (`PIRATEN_RICH_FIND_CHANCE`),
      die akkumulierte Beute der laufenden Mission zu verdoppeln, NUR Mittel/Hoch.
94. **KI-Wirtschafts-Verbesserungen nach Beobachtung über die neue Debug-Seite** (siehe Punkt 95) -
    `economyBotTurn.ts`/`actions.ts`:
    - **Modul-Bau-KI ergänzt** (`maybeBuildModules()`) - fehlte bisher KOMPLETT, weder Bots noch
      Piratenbasen haben je ein Gebäude-/Schiffs-/Verteidigungsmodul gebaut. Analog zu
      `maybeBuildShips()`: pro Aufruf höchstens ein neues Modul pro Kategorie. Gebäude-Module
      brauchen hohe Basis-Gebäude-Stufen (20/10/5) und greifen daher erst spät im Spielverlauf,
      Schiffs-/Verteidigungsmodule sofort sobald mindestens 1 Einheit des Typs vorhanden ist.
    - **Moderater +50%-Produktionsbonus NUR für NPC-Zustände** (`NPC_PRODUCTION_BONUS_MULTIPLIER`
      in `economy.ts`, `isNpcState()` in `actions.ts` - Piratenbasen über negative `userId`, Bots
      über `is_bot`-Flag/`listBotUserIds()`) auf die passive Minen-Produktion
      (`accrueBuildingProduction()`) - gleicht aus, dass eine KI nie so effizient wirtschaftet wie
      ein Mensch mit vollem Überblick, ersetzt aber nicht die Verhaltens-Fixes selbst. Anpassbarer
      Einzelwert, falls sich +50% als zu schwach/stark erweist.
95. **Debug-Seite für Einblick in KI-Bots/Piratenbasen** (`pages/Debug.tsx`, `GET
    /api/game/debug/npcs` in `routes.ts`) - Nutzerentscheidung: reines 2-Spieler-Koop-Spiel unter
    vertrauten Mitspielern, kein PvP, daher unbedenklich, den vollen Zustand (Flotte, Verteidigung,
    Gebäude, Forschung, Ressourcen, Bau-/Forschungswarteschlangen, nächster Angriffs-Check) von
    KI-Vega/KI-Nyx und allen 4 Piratenbasen einsehbar zu machen. Rein lesend, kein `tick()`/`save`
    über den Endpunkt selbst nötig.
    - **Bugfix Flackern**: `EntityCard` war als verschachtelte Funktion INNERHALB von `DebugPage`
      definiert - bekam dadurch bei jedem Rendern (u.a. alle 3s durch das globale State-Polling in
      `GameContext.tsx`) eine neue Funktionsreferenz, React hat sie deshalb bei jedem Poll komplett
      neu gemountet statt nur aktualisiert, was die `queue-box`-Eintrittsanimation ständig erneut
      ausgelöst hat. Fix: Komponente auf Modulebene mit stabiler Referenz, `gameData` als Prop statt
      Closure.
96. **Diverse kleinere UX-/Infra-Verbesserungen (Juli 2026)**:
    - Spielernamen in der Galaxie-Ansicht farblich hervorgehoben (grün "du", cyan alle anderen) -
      waren vorher gedimmt (`var(--text-dim)`) oder ungefärbt und gingen in der Übersicht unter.
    - Einzelschiff-Feinauswahl (`-1`/`+1`-Buttons neben `-10`/`+10`/`Alle`) beim Flotten-Versand in
      der Galaxie - vorher nur 10er-Schritte oder alles.
    - **Client stürzt nicht mehr ab bei falsch konfigurierter `VITE_API_BASE`** (Live-Vorfall):
      `request()` in `api/client.ts` fing einen JSON-Parse-Fehler bisher auch bei Erfolgs-Status
      still zu `{}` ab (z.B. wenn eine falsch geroutete Domain HTML statt JSON zurückgibt) - dadurch
      wurden Felder wie `outposts` überall `undefined` statt eines Arrays, die App stürzte mit
      kryptischen `.filter()`-Fehlern ab. Wirft jetzt einen sprechenden Fehler; `GameContext.tsx`
      fällt bei Galaxie-/Nutzerlisten zusätzlich defensiv auf leere Arrays zurück.
    - **Deployed-Commit-Hash über `/api/health` + Server-Log sichtbar** (`git rev-parse --short
      HEAD` beim Start, fällt auf `'unbekannt'` zurück falls kein `.git` im Produktions-Image
      vorhanden ist) - hilft bei der Frage "läuft auf dem Server wirklich der neueste Stand?"
      (Coolify-Deploy-Diagnose nach mehreren Verwirrungen um Webhook/Build-Variable/CORS).
97. **CPU-Spitzen-Vorfall (Stand 26.07.2026): URSACHE BESTÄTIGT, ERSTER FIX DEPLOYED** - dieser
    Fix (Nachhol-Deckel) wurde am 28.07.2026 durch eine strukturellere Lösung ABGELÖST, siehe
    Punkt 98 (KI-Mitspieler/Piratenbasen-Autonomie entfernt statt nur gedeckelt). Bleibt hier als
    vollständige Diagnose-Historie erhalten. Live-Vorfall: wiederkehrende, sich SELBST
    VERSTÄRKENDE Verzögerungen (Coolify-Metriken zeigten 250% CPU über mehrere Minuten, mehrfach
    täglich), eskalierend von 87 Sekunden für einen einzelnen `tick()`-Aufruf bis zu 934 Sekunden
    (>15 Minuten!) für eine einzelne `GET /game/state`-Anfrage eines echten Spielers - der
    Rückstand wuchs schneller, als er abgearbeitet werden konnte (klassische Teufelsspirale).
    - **Diagnose-Instrumentierung** (Commit `004bd49`): `heartbeat.ts` und `routes.ts` stoppen
      jede Phase/jeden Nutzer-`tick()`/jede Anfrage und loggen NUR bei ungewöhnlicher Dauer
      (>500ms Nutzer/Aktion, >1s Phase, >3s gesamter Heartbeat) - Log-Zeilen enthalten
      "langsam"/"dauerte". **Bleibt aktiv** (nützlich, um den Fix unten zu verifizieren und für
      künftige Vorfälle).
    - **URSACHE BESTÄTIGT über die Logs**: fast die gesamte Zeit eines langsamen `tick()` steckte
      in EINEM einzigen Nutzer (z.B. "Langsamer tick() bei KI-Nyx (Bot, id=3): 87111ms"), während
      Piratenbasen/Offensiv-KI/Außenposten-KI im selben Durchlauf nur 0-2ms brauchten - die
      NEUEN Systeme aus Punkt 90-96 sind NICHT die Ursache. Der eigentliche Verursacher:
      `tickMission()` in `missions.ts` hatte KEINEN Deckel für ihre Stunden-Check-Nachholschleife
      (`while (mission.processedHours < hoursElapsed)`) - jeder fällige Stunden-Check bei einer
      Piraten-Sektor-/Asteroiden-Eskorte-Mission löst einen ECHTEN Kampf im kleinen 2-Worker-Pool
      aus (`combatRunner.ts`, `POOL_SIZE=2`). War ein Nutzer/Bot länger nicht getickt worden (z.B.
      nach einem Server-Neustart), musste ALLES auf einmal in einem durchgehenden Rutsch
      nachgeholt werden - bei 100+ fälligen Stunden entsprechend viele sequenzielle Kämpfe
      hintereinander, die den Worker-Pool so lange belegten, dass andere Anfragen (inkl. der
      eigenen Folge-Anfragen desselben Nutzers, siehe die eskalierenden 73s→934s) in der
      Warteschlange hängen blieben.
    - **FIX DEPLOYED (Commit `40aa623`)**: `MISSION_HOURLY_CATCHUP_CAP` (`economy.ts`, aktuell
      `= 8`) deckelt die pro `tickMission()`-Aufruf NACHGEHOLTEN Stunden-Checks - ein größerer
      Rückstand verteilt sich jetzt über mehrere Heartbeat-/Request-Durchläufe statt alles auf
      einmal zu erzwingen. `finalizeMission()` wird zusätzlich erst ausgelöst, wenn WIRKLICH alle
      Stunden abgearbeitet sind (`mission.processedHours >= maxHours`), nicht nur wenn die reale
      Rückflugzeit erreicht ist - sonst würden bei gedeckeltem Rückstand ausstehende Kämpfe/Beute
      übersprungen statt beim nächsten Aufruf nachgeholt zu werden. Ressourcen-Produktion
      (`accrueBuildingProduction`) ist NICHT betroffen (reine Arithmetik, kein Kampf).
    - **NOCH NICHT VERIFIZIERT** (Stand dieses Commits) - der Fix wurde geschrieben, kompiliert
      sauber (`npx tsc --noEmit` in `server/`), ist gepusht, aber ob er auf dem Server deployed
      wurde UND ob er das Problem tatsächlich behoben hat, war zum Zeitpunkt dieses Commits noch
      offen (Chat-Session ging zu Ende, siehe unten).
    - **NÄCHSTE SCHRITTE FÜR DIE FORTSETZUNG (in dieser Reihenfolge)**:
      1. Prüfen, ob `40aa623` (oder neuer) auf dem Server deployed ist (`/api/health` →
         `commit`-Feld, siehe Punkt 96) - falls nicht: Nutzer bitten, in Coolify beim
         Server-Service auf "Redeploy" zu klicken.
      2. Server-Logs (Coolify → Server-Service → "Logs"-Tab, im Suchfeld nach `dauerte` oder
         `langsam` filtern) nach dem Deploy eine Weile beobachten. Erwartung: falls noch ein
         Rückstand besteht, sollten jetzt viele KURZE "langsam"-Zeilen auftauchen (der gedeckelte
         Rückstand baut sich über mehrere Aufrufe ab) statt einzelner Riesenwerte im
         Minutenbereich - UND die Werte sollten mit der Zeit sinken, nicht weiter eskalieren.
      3. Falls die Werte WEITERHIN eskalieren (Rückstand wächst schneller, als der Deckel ihn
         abbauen kann) oder einzelne Anfragen trotz Deckel noch mehrere Sekunden brauchen:
         - `MISSION_HOURLY_CATCHUP_CAP` in `economy.ts` weiter senken (z.B. auf `4` oder `2`).
         - Zusätzlich einen echten Event-Loop-Yield ZWISCHEN JEDEM einzelnen Stunden-Check in der
           `while`-Schleife in `tickMission()` einbauen (`await new Promise(r => setImmediate(r))`
           nach jedem `runHourlyCheck()`-Aufruf), nicht nur den Gesamt-Deckel - stellt sicher,
           dass der Hauptprozess selbst bei einem einzelnen, sehr langen Request-Handler
           zwischendurch andere Anfragen bedienen kann.
         - Prüfen, ob `processRaidTimer()`/`processSpyMissions()` (`raids.ts`/`spyMissions.ts`)
           ähnliche ungedeckelte Nachhol-Schleifen haben - bei Raids unwahrscheinlich (max. 5
           Wellen fix, `RAID_WAVE_COUNT`), aber nicht abschließend geprüft.
         - Prüfen, ob der Rückstand strukturell IMMER WEITER waechst (z.B. weil `maybeSendMiningFleet()`
           in `economyBotTurn.ts` staendig neue 12h-Missionen nachschiebt, bevor die alten
           abgearbeitet sind) statt nur ein einmaliger Nachhol-Rueckstand nach einem Neustart zu
           sein - das waere ein strukturelles statt ein einmaliges Problem.
      4. Falls der Fix funktioniert (Werte sinken/bleiben niedrig): Punkt hier als ERLEDIGT
         markieren, CHANGELOG.ts-Eintrag ergänzen (siehe Muster bei den anderen Balance-Fixes).
    - **Nutzer-Feedback zum "Nachhol"-Prinzip generell** (NICHT Teil des aktuellen Fixes, größeres
      Architektur-Thema für später): möchte perspektivisch weg von "Dinge müssen nachgeholt
      werden" hin zu echter Live-Berechnung - würde eine andere DB-Anbindung erfordern (aktuell
      `better-sqlite3`, SYNCHRON/blockierend, siehe `db.ts`), nicht kurzfristig umsetzbar.
98. **CPU-Spitzen-Vorfall: STRUKTURELLE LÖSUNG (28.07.2026) - KI-Mitspieler entfernt,
    Piratenbasen-Autonomie entfernt, Außenposten-Feature entfernt.** Löst Punkt 97 ab: statt den
    Nachhol-Deckel weiter zu verfeinern, wurde die eigentliche Lastquelle beseitigt. Nutzer ist für
    4+ Wochen nicht erreichbar und braucht ein System, das ohne Nachjustieren stabil läuft.
    - **Analyse (Live-Logs nach dem `40aa623`-Redeploy)**: der Nachhol-Deckel funktionierte
      (sinkende statt eskalierende "langsam"-Zeilen), aber die eigentliche Quelle der teuren
      Kämpfe war strukturell: KI-Vega/KI-Nyx (`bot.ts`) und die 4 aktiven Piratenbasen
      (`pirateBaseState.ts`) liefen rund um die Uhr ohne menschliche Entscheidungspause -
      Piratensektor-Missionen, Gruppen-Expeditionen, Piratenbasis-/Außenposten-Angriffe, jeweils
      mit echter Kampfsimulation im nur 2 Worker großen Pool (`combatRunner.ts`).
    - **KI-Vega/KI-Nyx entfernt**: `ensureBotUsers()` nicht mehr aufgerufen, stattdessen
      `removeBotUsers()` (bereits vorbereitet in `db.ts`, war schon einmal im Einsatz vor dem
      Hetzner-Umzug) beim Serverstart - löscht Accounts + Spielstand endgültig aus der DB.
      `bot.ts`/`economyBotTurn.ts` komplett gelöscht (nirgends mehr referenziert).
    - **Piratenbasen-Autonomie entfernt**: `loadPirateBase()` (`pirateBaseState.ts`) ruft kein
      `runEconomyBotTurn()` mehr auf - Basen bauen/forschen/minen nicht mehr selbst, bleiben
      dauerhaft auf ihrem Startbestand (`SEED_FLEET`/`SEED_DEFENSE`/`SEED_BUILDINGS`) stehen.
      Offensiv-KI (Basen greifen Spieler von sich aus an) komplett entfernt. Bleiben weiterhin
      über `startPirateBaseAttack()` von Spielern angreifbar - nur ohne jede Eigeninitiative.
      Die normalen, fest getakteten Raids (`raids.ts`, `processRaidTimer`) sind davon **komplett
      unberührt** - generieren ihre Gegnerflotte live bei Wellen-Ankunft, unabhängig von jedem
      PirateBaseState (bestätigt vor der Änderung geprüft).
    - **Außenposten-Feature komplett entfernt**: `outposts.ts` gelöscht, alle Routen
      (`/galaxy/outpost/*`), Heartbeat-Aufrufe, DB-Tabelle `outposts` + Accessor-Funktionen,
      Typen (`OutpostState`/`OutpostDeployment`/`OutpostSummary`) sowie die komplette Client-UI
      (`Galaxie.tsx`, `GameContext.tsx`, `api/client.ts`, `types/game.ts`) entfernt. Der
      Flugzeit-Bonus (`OUTPOST_SPEED_BONUS_PER_OUTPOST`) fällt ersatzlos weg (war ohnehin an
      erobertes Außenposten-Territorium gebunden, das es nicht mehr gibt).
    - **`heartbeat.ts` dadurch deutlich schlanker**: pro Nutzer nur noch `tick()` +
      `processPirateAttacks()` (löst nur spieler-initiierte Angriffe auf) + `processMissions()` +
      `processRaidTimer()`. Keine Bot-Turns, keine Piratenbasen-Wachstums-/Offensiv-Turns, keine
      Außenposten-KI mehr - nur noch echte Spieleraktionen und die fest getakteten Raids erzeugen
      Last.
    - **Was WARUM der Heartbeat überhaupt existiert** (Nutzerfrage): ohne ihn hängt jede
      zeitbasierte Spielmechanik (Raid-Checkpoints, Missions-Fortschritt für offline Spieler,
      Ressourcenproduktion) daran, dass zufällig gerade ein Spieler online ist und eine Anfrage
      stellt - bei 0 aktiven Spielern (z.B. nachts, oder während der Nutzer 4+ Wochen weg ist)
      würde sonst schlicht nichts passieren. Der interne `setInterval` in `index.ts` ruft
      `runGlobalHeartbeat()` alle 2 Minuten auf, unabhängig von jedem Request - bleibt bestehen,
      ist aber jetzt durch den Wegfall der KI/Piratenbasen-Autonomie strukturell deutlich billiger.
    - **NOCH NICHT VERIFIZIERT** (Stand dieses Commits): Code kompiliert sauber (`tsc --noEmit` in
      `server/` UND `client/`), aber ob der Redeploy die CPU-Spitzen tatsächlich beendet hat, war
      zum Zeitpunkt dieses Commits noch offen (Chat-Session ging zu Ende, siehe unten).
    - **NÄCHSTE SCHRITTE FÜR DIE FORTSETZUNG**: Redeploy in Coolify prüfen/auslösen, danach die
      Logs (Suche nach `dauerte`/`langsam`) eine Weile beobachten - Erwartung: praktisch keine
      "langsam"-Zeilen mehr, da keine automatisierte KI mehr Kämpfe/Missionen auslöst. Falls
      dennoch weiterhin Spitzen auftreten, liegt die Ursache dann zwingend bei echten
      Spieleraktionen oder den fest getakteten Raids - nicht mehr bei KI/Piratenbasen.
99. **Balance: Jäger/Kreuzer bekommen eine Tank-/Ausweich-Rolle gegen große/Elite-/Spezialschiffe.**
    Nutzer-Feedback nach Elite-Bollwerk-Beobachtungen: bei genug Salvenschiffen/Imperator in der
    Flotte wurden Leichter/Schwerer Jäger und Kreuzer komplett bedeutungslos - Kampf 1 waren die
    Jäger tot, Kampf 2 die Kreuzer, Kampf 3-4 räumten nur noch die großen Schiffe alles weg, ohne
    selbst nennenswert Schaden zu nehmen. Ursache: Jäger/Kreuzer-Waffenschaden liegt um Faktor
    35-330 unter Salvenschiffen/Imperator, UND praktisch jede NPC-Einheit hat ohnehin schon
    RapidFire speziell gegen Leicht/Schwer - sie starben also überproportional schnell OHNE
    nennenswerten Schadensbeitrag.
    - **Neue Mechanik**: Ausweichchance ist jetzt zusätzlich von der GRÖSSENKLASSE des Schützen
      abhängig (`SHIP_SIZE_CLASS`/`SIZE_MISMATCH_EVASION_BONUS` in `combatConstants.ts`,
      `getEvasionChance()`/`rollHit()` in `combat.ts`) - vorher war Ausweichen rein zielabhängig,
      unabhängig davon, WER schießt.
      - **Klein** (Leichter/Schwerer Jäger) bekommt **+45 Prozentpunkte** Ausweichchance gegen
        **Groß** (Schlachtschiff, Bomber, Schlachtkreuzer, Zerstörer, Reaper, Imperator,
        alle 3 Salvenschiffe) - ein Fehlschuss zählt bewusst schon als "Tanken" (kein
        Ziel-Umleiten nötig, der Schuss ist einfach verpufft).
      - **Mittel** (Kreuzer) bekommt **+18 Prozentpunkte** gegen Groß - bleibt das eigentliche
        Ziel dieser Schiffsklassen, aber spürbar schwerer (nicht unmöglich) zu treffen.
      - Kämpfe zwischen ähnlich großen Schiffen (Jäger vs. Jäger/NPC-Jäger, Kreuzer vs.
        Jäger/Kreuzer) bleiben unverändert beim bisherigen `EVASION_BASE`-Wert - der Bonus greift
        NUR bei der Größen-Fehlpaarung.
      - Eigener, höherer Deckel nur für Fehlpaarungs-Treffer (`EVASION_MAX_SIZE_MISMATCH = 0.75`
        statt normal `EVASION_MAX = 0.30`), sonst hätte der normale Deckel den ganzen Bonus
        wieder aufgefressen.
    - **Bewusst unverändert gelassen** (Nutzer-Bestätigung): RapidFire gegen Imperator/
      Salvenschiffe bleibt so gut wie nicht vorhanden (einzige Ausnahme: `plasmawerfer` RF=2 vs.
      `imperator`, ein Nischenfall nur bei Piratenbasis-Angriffen) - sie sollen trotz seltener
      Treffer nicht per RF-Pech "weggewürfelt" werden, ihre Stärke reguliert sich über die
      `maxCount`-Obergrenze. Kritische-Treffer-Chance der Elite-/Spezialschiffe war schon vorher
      die höchste im ganzen Spiel (Imperator 20%, Salvendreadnought 15% vs. Kreuzers eigene 6%) -
      erfüllt den Wunsch "seltener, aber dafür harte Treffer" bereits ohne weitere Änderung.
    - **NOCH NICHT GETESTET** (Stand dieses Commits): kompiliert sauber (`tsc --noEmit` in
      `server/`), aber kein echter Elite-Bollwerk-Testlauf mit den neuen Werten. Falls sich +45/+18
      Prozentpunkte im Spiel zu stark/schwach anfühlen, einfach `SIZE_MISMATCH_EVASION_BONUS` in
      `combatConstants.ts` anpassen (ein einziger, leicht auffindbarer Ort).
100. **Balance: `PIRATE_RESEARCH_SHARE` auf 100% angehoben, Elite-Bollwerk solo nutzbar gemacht.**
    Nutzerentscheidung: Piraten bekommen jetzt volle statt halbe Forschung (Waffen/Schild/
    Panzerung-Multiplikatoren UND Präzision/Ausweichen/Krit/Zielerfassung/Schild-Regen) - bewusst
    als CPU-günstigere Alternative zu größeren Feindflotten, da das NUR die Stärke jeder einzelnen
    Piraten-Einheit erhöht, keine zusätzlichen Einheiten hinzufügt (Rechenlast in der
    Kampfsimulation skaliert mit Einheitenanzahl × Schüsse, nicht mit Stat-Höhe). Spieler behalten
    weiterhin Klassen-Bonus UND Schiffs-/Verteidigungs-Module exklusiv - Piraten bekommen NIE
    beides, siehe `computePirateResearch()` in `combat.ts`.
    - Falls 100% sich als zu hart herausstellt: `PIRATE_RESEARCH_SHARE` in `combatConstants.ts`
      ist die einzige Stelle, die angepasst werden muss (war vorher 0.5).
    - **Elite-Bollwerk solo**: war technisch schon vorher möglich (die Einladungs-Checkboxen in
      `Multiplayer.tsx` sind komplett optional, `createGroupOperation()`/`startGroupOperation()`
      in `groupOps.ts` erfordern KEINE Mitspieler - mit 0 Eingeladenen ist der Ersteller der
      einzige Teilnehmer und der "Jetzt starten"-Button sofort nutzbar). Nur der UI-Text hat das
      nicht klar genug gesagt - jetzt ergänzt: "Niemanden einladen? Kein Problem - lass die Liste
      unten leer und starte danach unter 'Meine Operationen' sofort solo." Live im Dev-Server
      verifiziert (Registrierung, Flotte per DB seeden, Operation OHNE Einladung erstellt und
      gestartet - Status ging sofort auf "departed", kein Warten auf andere Teilnehmer nötig).
101. **Bugfix: Piratenadmiral (P10) hatte gar keinen sichtbaren Kampfbericht.** Nutzer-Feedback nach
    Solo-Test: "wir sind auf nichts getroffen, was sofort als Sieg gewertet wurde" - ein Boss-Kampf
    hat sich tatsächlich stattgefunden (100 Runden, echte Verluste auf beiden Seiten), aber die
    Nachricht dazu enthielt NUR eine knappe Text-Zeile + Beute-Zahlen, KEINE Gegnerflotte/Runden/
    Schaden - fühlte sich wie ein Sieg ohne jeden erkennbaren Kampf an.
    - **Root Cause**: `runAdminCheck()`/`finalizeAdminEncounter()` in `groupOps.ts` pushten bei
      JEDEM Check (Check-N-Zwischennachricht UND finale Sieg-/Niederlage-Nachricht) ein
      `FarmDetail`-Objekt (`{ sektorName, resources, dm, teile, fleetReturned }`) statt eines
      echten `CombatDetail` mit `npcResults`/`playerResults`/`roundsFought` - im Gegensatz zu
      `runGroupHourlyCheck()` (Elite-Bollwerk), das diesen vollen Kampfbericht schon immer korrekt
      gebaut hat. Der Kampf selbst lief technisch immer korrekt ab (`runMultiOwnerCombatInWorker()`
      wurde immer aufgerufen), nur der Bericht darüber fehlte komplett.
    - **Fix**: `runAdminCheck()` baut jetzt `npcResults` (Piratenadmiral + Eskorte, inkl. Basiswerte
      aus `encounter.statsOverride`) und `playerResults` (pro Teilnehmer/Schiffstyp, analog zu
      `runGroupHourlyCheck()`) aus dem `MultiOwnerCombatResult` auf und übergibt ein vollständiges
      `CombatDetail` an alle drei möglichen Ausgänge (Check läuft weiter / Sieg / Niederlage).
      `finalizeAdminEncounter()` bekommt einen neuen optionalen `combatDetail`-Parameter - bei
      Sieg/Niederlage (frischer Kampf) wird er mit den Belohnungen zu EINER Nachricht kombiniert;
      beim reinen Rückzug (`respondAdminEncounter()` mit `action:'extract'`, KEIN frischer Kampf in
      diesem Moment) bleibt es bei der reinen Beute-Zusammenfassung, da es dafür nichts zu zeigen
      gibt.
    - **Live verifiziert** (Dev-Server, Solo-Operation mit 110 Kreuzern gegen den Admiral): Check-
      Nachricht zeigt jetzt "100 Runde(n)", volle Schaden/Verluste-Tabelle für Piratenadmiral +
      Eskorte (Schlachtschiff/Schlachtkreuzer/Zerstörer/Reaper) sowie die eigene Flotte - Eskorte
      zu 97% vernichtet, Admiral selbst überlebt (erwartetes Verhalten, er ist der zähe Hauptgegner).
      Rückzugs-Nachricht zeigt korrekt nur die Beute-Zusammenfassung ohne Kampfbericht.
102. **Bugfix: Elite-Bollwerk-Kampfbericht änderte sich beim Ansehen alle paar Sekunden (Race
    Condition bei überlappenden tick()-Aufrufen).** Nutzer-Beobachtung: derselbe Stunden-Check
    zeigte beim Nachladen mehrfach unterschiedliche Zahlen, obwohl es dieselbe Stunde sein sollte.
    - **Root Cause**: Bei sehr großen Flotten (Nutzer-Testfall: >11.000 Schiffe) kann eine einzelne
      Kampfberechnung im Worker-Thread mehrere Minuten dauern - deutlich länger als die 3s-Poll-
      Distanz des Clients (`GameContext.tsx`). `tick()` (jeder GET /game/state-Poll) ruft
      `processAllDepartedGroupOperations()` auf, die JEDE laufende Gruppen-Operation lädt/verarbeitet/
      speichert - ohne jede Sperre konnte eine zweite, überlappende Anfrage denselben, noch nicht
      gespeicherten `processedHours`-Stand laden, ihn vom SELBEN Ausgangswert erneut erhöhen und
      denselben Stunden-Check ein zweites Mal mit neuen Zufallswerten simulieren. Betraf sowohl
      Elite-Bollwerk (`runGroupHourlyCheck`) als auch strukturell den Piratenadmiral
      (`runAdminCheck`), beide laufen über `tickGroupExpedition()`.
    - **Fix**: Modul-weite In-Memory-Sperre (`opsCurrentlyTicking` Set in `groupOps.ts`) um
      `tickGroupExpedition()` - eine Operation wird nur von EINEM `tick()`-Aufruf gleichzeitig
      verarbeitet, ein zweiter überlappender Aufruf kehrt sofort zurück, statt denselben Check
      doppelt zu simulieren. In-Memory reicht aus, da der Server als einzelner Node-Prozess läuft
      (kein Multi-Instance-Setup).
    - **Live verifiziert** (Dev-Server, `Promise.all` mit 2-3 echt gleichzeitigen Anfragen gegen
      denselben Operations-Zustand): vor dem Fix nicht reproduziert (Zeitdruck), nach dem Fix bei
      mehreren Testläufen mit großen Testflotten (1.500-2.900 Schiffe) durchgehend GENAU EINE
      Kampf-Nachricht pro Stunden-Check, `processedHours` korrekt inkrementiert, alle bis auf die
      erste Anfrage kehrten sofort zurück (blockiert durch die Sperre) statt selbst zu rechnen.
    - **Nebenbefund**: eine Kampfberechnung mit >11.000 Schiffen dauerte im Test über 5 Minuten
      (`tick(): langsame Phase "processAllDepartedGroupOperations"` Diagnose-Log, siehe Punkt 98/99)
      - bestätigt, dass extrem große Flottengrößen selbst nach Entfernung der KI-Autonomie ein
      eigenständiges CPU-Risiko bleiben. Kein akuter Handlungsbedarf (menschentempo, kein 24/7-
      Trigger), aber falls Spieler regelmäßig mit fünfstelligen Flottengrößen in Multiplayer-
      Sektoren fliegen, könnte das künftig relevant werden.
103. **Kampf-Engine: Stack-basierte Aggregat-Simulation für sehr große Flotten (löst Punkt 102s
    Nebenbefund).** Nutzerentscheidung nach Abwägung zwischen "nur eine Flottengröße-Obergrenze
    einführen" und "die Engine wirklich massentauglich machen" - bewusst für Letzteres entschieden
    ("meine Frau mag Massen an Schiffen"). Root Cause (bestätigt): `buildUnits()` in `combat.ts`
    erzeugte pro EINZELNEM Schiff ein eigenes Objekt, das jede Runde individuell wuerfelt - bei
    16.500 Schiffen >5 Minuten pro Kampf (siehe Punkt 102).
    - **Ansatz**: Hybrid-Schwellenwert `STACK_AGGREGATE_THRESHOLD = 300`
      (`combatConstants.ts`) - ein Stapel EINES Typs BIS zu dieser Stückzahl bleibt exakt wie
      bisher (unveränderter Code-Pfad, 100% identisches Verhalten). Stapel DARÜBER werden als EIN
      `AggregateStack`-Objekt behandelt (Pool aus Gesamt-Schild/-HP statt Einzel-Objekte pro
      Schiff, analog zum schon bestehenden gemeinsamen Schildkuppel-Pool).
    - **Aggregat-Ziele**: `fireShots()` wählt jetzt gewichtet zwischen normaler Einzel-Ziel-Pool
      und Aggregat-Stapeln (gewichtet nach lebender Stückzahl) - Einzel-Schützen können also auch
      riesige Gegner-Stapel treffen, ein einzelner Treffer wird direkt auf den Pool angewendet
      (`applyAggregateHit`/`applyAggregateDamage`).
    - **Aggregat-Schützen** (`fireShotsAggregateShooters`, neu): statt jedes Schiff einzeln feuern
      zu lassen, wird die GESAMTE Schusszahl des Stapels über den Erwartungswert der
      RapidFire-Kette + Normalverteilungs-Sampling (`sampleBinomial`) berechnet, dann proportional
      auf die Ziel-"Eimer" verteilt (normale Pool als ein Eimer + jedes gegnerische Aggregat als
      eigener Eimer) - Trefferzahl pro Eimer wieder per `sampleBinomial`, in EINEM Rutsch
      angewendet. Kein Schuss-für-Schuss-Loop mehr für den Aggregat-Anteil.
    - **Bewusste Vereinfachungen bei Aggregaten** (siehe Code-Kommentare in `combat.ts`): kein
      Durchschlag-Kaskade zwischen Typen, Explosions-Mechanik nicht angewendet, Rückzug erfolgt als
      GANZES statt gestaffelt einzeln (`hpPoolCur / initialHpPool <= UNIT_RETREAT_THRESHOLD` →
      `active = false`) - bei so großen Stapeln fällt das kaum ins Gewicht, siehe Plan-Datei für die
      vollständige Abwägung.
    - **`buildUnitsMultiOwner()`**: aggregiert pro (ownerKey, typeId)-Paar statt global pro Typ -
      vermeidet das Problem, mehrere Beitragende mit unterschiedlicher Forschung/Klasse/Modulen im
      selben Pool vermischen zu müssen. Relevant wird ein Aggregat dadurch nur, wenn EIN Spieler
      allein schon eine sehr große Stückzahl eines Typs beiträgt (in der Praxis der Normalfall bei
      Solo-Elite-Bollwerk mit Massenflotte).
    - **`POOL_SIZE` in `combatRunner.ts` 2→3** (ergänzend, geringes Risiko) - mehr parallele
      Worker-Kämpfe möglich (Server hat 4 vCPU, 1 Kern bleibt fuer den Haupt-Event-Loop frei). Löst
      NICHT das Problem einzelner riesiger Kämpfe (die bleiben single-threaded), hilft aber beim
      Durchsatz mehrerer gleichzeitiger normaler Kämpfe.
    - **Live verifiziert** (Dev-Server, dieselbe 16.500-Schiffe-Flotte wie im Punkt-102-Test):
      - Kampfsimulator (`/api/game/simulate`, 12 Wiederholungen derselben Flotte): **0,785s
        gesamt** (vorher >300s für EINEN einzigen Kampf) - alle Verlustzahlen plausibel
        (0 ≤ avgLost ≤ sent für jeden Schiffstyp).
      - Echter Elite-Bollwerk-Kampf über den Gruppen-Operationen-Pfad (`GET /game/state` löst den
        fälligen Stunden-Check aus, inkl. einer NPC-Gegenflotte mit 36.539 Leichten Jägern - selbst
        AUF NPC-Seite jetzt aggregiert): **0,26s gesamt**, 100 Runden, vollständiger Kampfbericht
        mit plausiblen Verlusten auf beiden Seiten.
      - Kleine Flotte (unterhalb der Schwelle, 50/40/30/10 Schiffe verschiedener Typen) weiterhin
        unverändert schnell (<1s für 12 Simulationen) - bestätigt den unveränderten Code-Pfad für
        den Normalfall.
    - Plan-Datei mit vollständiger technischer Abwägung:
      `.claude/plans/purring-imagining-corbato.md` (falls noch vorhanden).
104. **Bugfix: kritischer Treffer gegen Aggregat-Stapel wurde vierfach statt doppelt gezählt.**
    Nutzer-Bericht nach erstem echten Elite-Bollwerk-Test mit Massenflotte: "fast die ganze Flotte
    vernichtet". Root Cause: `applyAggregateHit()` bekam von `fireShots()` bereits den FERTIGEN,
    bei einem Krit schon mit `CRIT_DAMAGE_MULTIPLIER` multiplizierten Schaden (`dmg = shooter.waffen
    * (isCrit ? CRIT_DAMAGE_MULTIPLIER : 1)`), reichte den Krit-Status aber ZUSAETZLICH an
    `applyAggregateDamage(stack, 1, isCrit?1:0, dmg, ...)` weiter - die multipliziert bei
    `crits>0` SELBST nochmal, macht aus einem 2x-Krit versehentlich einen 4x-Treffer. Betraf nur
    Treffer von NORMALEN (unter der Schwelle simulierten) Einheiten GEGEN Aggregat-Stapel, nicht
    Aggregat-vs-Aggregat (dort war die Multiplikation schon vorher korrekt einfach).
    - **Fix**: `applyAggregateHit()` uebergibt `crits` jetzt immer als `0` an
      `applyAggregateDamage()`, da `dmg` bereits der fertige Schaden ist.
    - **Eingeordnet, nicht ueberbewertet**: Vergleichstest (dieselbe Flottenzusammensetzung, aber
      unterhalb der Aggregat-Schwelle, also 100% exakte Alt-Simulation) gegen denselben Sektor
      verlor SOGAR prozentual MEHR (86% vs. 58% bei der grossen, aggregierten Flotte nach dem Fix)
      - die neue Engine ist also nicht grundsaetzlich haerter als die alte. Nutzer bestaetigte:
      betroffen war Piraten-Sektor Hoch/Elite-Bollwerk, beide laut Sektor-Konfiguration BEWUSST so
      ausgelegt, dass der Gegner 115-155% der eingesetzten Flottenstaerke erreichen kann
      (`PIRATEN_MULTIPLIER_ROLL`, `sectors.ts`) - deutliche Verluste dort sind grossteils
      By-Design, nicht nur der gefundene Bug.
105. **Bugfix (der eigentliche Hauptgrund): Aggregat-Rückzug war binär statt gestaffelt - "Sieg
    mit 700 von 11.000 überlebenden Schiffen".** Nutzer-Bericht: selbst ein GEWONNENER
    Elite-Bollwerk-Kampf kostete ~94% der eingesetzten Flotte - "mehr Verluste gemacht als ich an
    Gewinn reinholen konnte". Punkt 104s Krit-Fix allein reichte nicht (Test danach: immer noch
    58% Durchschnittsverlust bei Rückzug).
    - **Root Cause**: Beim Einzelschiff-Modell zieht sich JEDES Schiff EINZELN zurück, sobald ES
      SELBST auf 30% seiner HP sinkt (`UNIT_RETREAT_THRESHOLD`) - durch zufällige Zielverteilung
      auf tausende Einheiten sind IMMER einige ungünstig getroffene Schiffe schon früh bei 30%,
      während der Rest der Flotte noch kaum Schaden hat. Das sorgt laufend für Nachschub an
      überlebenden, aber ausgeschiedenen Schiffen. Der Aggregat-Rückzug (Punkt 103) hatte
      stattdessen einen BINÄREN Schwellenwert: die GESAMTE restliche Flotte kämpfte weiter bis 70%
      GESAMT-Verlust erreicht war (dann erst schlagartiger Rückzug) - bis dahin STARBEN Schiffe
      statt sich zurückzuziehen, massiv mehr Verluste als beim Einzelschiff-Modell.
    - **Fix**: Neues Feld `retreatedHpPool` auf `AggregateStack` (getrennt vom aktiv kämpfenden
      `hpPoolCur`) - Rückzugs-Anteil wird jetzt über eine RAMPE auf die tatsächlichen
      Kampf-Verluste abgebildet (bewusst NICHT auf bereits Zurückgezogene, sonst würde Rückzug sich
      selbst befeuern): ab ~21% toten Schiffen fängt ein wachsender Anteil an, sich
      zurückzuziehen, bei 70% toten Schiffen ist praktisch der gesamte Rest schon zurückgezogen
      statt weiterzukämpfen und zu sterben. Neue Funktion `aggTotalSurvivingCount()` (aktiv
      kämpfender + zurückgezogener Anteil) für die finale Überlebenden-Zählung - der
      Rundenverlauf/Kampfbericht während des Kampfes zeigt weiterhin nur den aktiv kämpfenden
      Anteil (identisch zum Einzelschiff-Verhalten, wo Zurückgezogene erst am Ende wieder
      mitgezählt werden).
    - **Live verifiziert** (Dev-Server, dieselbe 16.500-Schiffe-Flotte): Durchschnittsverlust bei
      Piraten-Hoch/Elite-Bollwerk von 58% (nur Krit-Fix) auf **~45%** gesunken. Gegen einen
      schwächeren Sektor (Niedrig) weiterhin nur ~2% Verlust bei 100% Sieg-Rate - bestätigt, dass
      der Fix nicht pauschal alle Verluste senkt, sondern gezielt das gestaffelte
      Rückzugsverhalten wiederherstellt.

106. **Balance: Zeitgutschein-Drop-Chance in Silber/Gold/Elite-Containern erhöht + Inventar zeigt
    jetzt die reale Chance.** Nutzer-Feedback: Zeitgutscheine fühlten sich trotz eingetragener
    15-20% Chance "zu selten" an.
    - **Ursache**: `rollContainerCategories()` in `inventory.ts` normalisiert jede Öffnung auf
      GENAU 2 Treffer - Ressourcen/Teile (60-80% Einzelchance) belegten dadurch fast immer beide
      Slots, Zeitgutschein/Freischiff kamen real viel seltener zum Zug als ihr `chance`-Wert
      suggerierte (exakte Berechnung per Enumeration aller Treffer-Kombinationen: Silber 20% Rohwert
      ergab nur ~15% real, Gold 15%→~10%, Elite 10%→~7%).
    - **Fix**: Rohwerte auf 38%/32%/23% angehoben, kalibriert auf ~28%/22%/16% reale Chance.
    - **Zusatz-Fix**: `computeRealCategoryChances()` (economy.ts) berechnet die tatsächliche Chance
      pro Kategorie exakt (gleicher Algorithmus wie die Ziehung selbst) und schreibt sie als
      `realChance` auf jede Kategorie - die Inventar-Seite zeigt jetzt diesen Wert statt des rohen,
      irreführenden `chance`-Werts.

107. **Balance: Piratenbasen bekommen eine dauerhaft starke Garnison + Ressourcen-Cap, Booster
    überarbeitet.** Folgefrage zur Autonomie-Entfernung (Punkt 98): "Piratenbasen brauchen starke
    Flotte/Verteidigung, aber Ressourcen dürfen nicht unbegrenzt wachsen."
    - **Garnison**: `SEED_FLEET`/`SEED_DEFENSE` in `pirateBaseState.ts` von 95 Schiffen/65
      Verteidigungsanlagen auf ~5.300 Schiffe (gemischte Tier-Zusammensetzung, mehrere Typen über
      `STACK_AGGREGATE_THRESHOLD`) + ~1.120 Verteidigungsanlagen angehoben - das ist jetzt die
      DAUERHAFTE Stärke (Basen bauen nichts mehr selbst dazu). Floor-Up beim Laden hebt bereits
      bestehende (schwächere) Basen nachträglich an, ohne sie je abzuschwächen.
    - **Ressourcen-Cap**: `RESOURCE_CAP` in `pirateBaseState.ts` verhindert unbegrenztes Wachstum
      (Basen produzieren weiter passiv, können aber seit Punkt 98 nichts mehr ausgeben). Erster Wurf
      (15M/9M/4M) war zu niedrig - NICHT gegen die tatsächliche Produktionsrate gerechnet (Metallmine
      Stufe 4 + `NPC_PRODUCTION_BONUS_MULTIPLIER` produziert ~87.800 Metall/h, der Cap war nach
      ~7-9 Tagen erreicht). Nachkalibriert auf 44M/20M/6M (~3 Wochen ungebremstes Wachstum, im
      Verhältnis der tatsächlichen Produktionsraten Metall:Kristall:Deuterium ≈ 7,3:3,3:1).
    - **Booster**: Effekt und Kosten aller vier Booster erhöht (waren im Vergleich zu
      Schiffs-/Verteidigungs-Modulen zu günstig): Bautempo/Forschungstempo -65% statt -50% (35 statt
      20 DM), Kampf +35% statt +20% (55 statt 30 DM), Abbau +70% statt +50% (30 statt 15 DM).
    - **Nebenbefund-Bugfix**: der Abbau-Booster war bisher ein Blindgänger - kaufbar, aber
      `isBoosterActive(state, 'abbau')` wurde nirgends im Code abgefragt. Jetzt erstmals in
      `miningBuildingMultiplier()` (actions.ts) und `miningMultiplier()` (missions.ts) verdrahtet.

108. **Feature: Raid-Umbau von 2x/Tag auf 1x/Woche - 24h-Belagerung mit 12 Wellen.** Nutzerentscheidung:
    passt besser zum tatsächlichen Spielrhythmus (teils mehrwöchige Abwesenheit) als starre tägliche
    Zeitfenster.
    - **Rhythmus**: beide Spieler starten jetzt Sonntag 0 Uhr deutscher Zeit (`RAID_SCHEDULE_BY_USERNAME`
      in `economy.ts`, neuer `weekday`+`hour`-Typ statt der bisherigen Stunden-Arrays). Neue Funktionen
      `nextWeeklyCheckpoint()`/`rollWeeklyCheckpoints()` ersetzen die stunden-basierten
      `nextFixedCheckpoint()`/`rollFixedCheckpoints()`. Die ursprüngliche Stagger-Notwendigkeit
      (Server-Absturz bei zeitgleichen Kampfaufloesungen) ist durch die Stack-Aggregat-Engine
      entschärft, ein gemeinsamer Wochentag ist unproblematisch.
    - **Dauer/Wellen**: `RAID_ASSAULT_DURATION_MS` 1h→24h, `RAID_WAVE_COUNT` 5→12 (`RAID_WAVE_FACTORS`
      von 130-200% auf 130-300% verschärft, damit ein 12/12-Durchbruch bei der neuen Belohnungshöhe
      kein Selbstläufer ist).
    - **Belohnung**: bleibt EINE Abschluss-Belohnung am Ende (nicht pro Welle ausgezahlt), skaliert
      aber jetzt linear mit JEDER gewonnenen Welle statt eines Fixbetrags nur bei perfekter
      Verteidigung: `RAID_WAVE_WIN_SILBER`(10)/`GOLD`(6)/`ELITE`(2) pro Welle, macht bei 12/12 also
      120 Silber + 72 Gold + 24 Elite-Container (vorher max. 70 Silber + 28 Gold bei 14 Raids/Woche).
    - **Bugfix nach Deploy**: ein bereits VOR dem Umbau gespawnter Raid (5 `waveTimes`-Einträge) blieb
      dauerhaft bei "Welle 5/5" hängen - Schleifen-/Abschluss-Bedingung in `raids.ts` verglich gegen
      die GLOBALE `RAID_WAVE_COUNT`-Konstante (jetzt 12) statt gegen `raid.waveTimes.length`
      (`raid.waveTimes[5]` ist `undefined`, `Date.now() >= undefined` ist immer `false`). Alle
      Vergleiche nutzen jetzt `raid.waveTimes.length` - macht laufende Raids robust gegen künftige
      Änderungen an der globalen Wellenzahl.

109. **Feature: Asteroiden-Feld/Piraten-Sektor/Elite-Bollwerk auf 24h umgestellt, Rückruf ergänzt.**
    - **Asteroiden-Feld**: `ASTEROID_MISSION_DURATION_MS` 12h→24h. `dmCap`/`farmRate` BEWUSST
      unverändert (Nutzerentscheidung: kein Verdoppeln, sonst Ressourcen-/Massen-Schiffbau-Inflation)
      - die Rate berechnet sich dynamisch aus der tatsächlichen Dauer (siehe `accrueFarming()` in
      `missions.ts`) und wird dadurch automatisch langsamer statt höher.
    - **Piraten-Sektor (Solo) + Elite-Bollwerk**: `MISSION_DURATION_MS` 4h→24h, Kampf-Checks laufen
      nicht mehr stündlich, sondern alle `PIRATEN_CHECK_INTERVAL_MS` (4h) - macht 6 Checks
      (`PIRATEN_CHECK_COUNT`) statt vorher 4. Die bisherige zeitbasierte Teile-/Ressourcen-Zuteilung
      (teileCap-Accrual in `accrueFarming()`, `resourceCapOverTime` beim Elite-Bollwerk) wurde
      KOMPLETT entfernt - Belohnung kommt jetzt ausschließlich durch gewonnene Kämpfe zustande.
      `teileCap`-Werte um ~1,5x angehoben (mehr Kampf-Gelegenheiten pro Trip: 8/15/23/30 statt
      5/10/15/20), `lootBase` bewusst unverändert (keine Rohstoff-Inflation, profitiert aber
      automatisch von den zusätzlichen Checks pro Trip).
    - **Neuer Rückruf für Elite-Bollwerk**: `recallGroupOperation()` in `groupOps.ts` (Route
      `/party/recall`) - bei der jetzt 24h langen Bindung kann JEDER Teilnehmer jederzeit alle
      zurückrufen (nicht auf den Ersteller beschränkt, anders als `cancelGroupOperation`), bereits
      gewonnene Kämpfe bleiben erhalten. Solo-Piraten-Sektor nutzt weiterhin den bereits bestehenden
      `recallMission()`.
    - **Live verifiziert** (Dev-Server): 24h-Missionsdauer korrekt gesetzt, beide Rückruf-Wege
      funktionieren fehlerfrei, Flotte kommt sofort zurück.
    - **Offener Punkt**: `REWARD_ESCALATION` "double"-Modus beim Elite-Bollwerk skaliert mit 6 statt
      vorher 4 Checks jetzt bis `2^6=64x` statt `2^4=16x` bei perfekter Serie - Nutzer beobachtet
      Live-Läufe, noch nicht final als zu stark bestätigt (siehe Punkt weiter unten/Memory).

110. **UI-Fix: Sektor-/Bollwerk-Info-Popups deutlich gekürzt.** Nutzer-Feedback: zu textlastig, viele
    reine Flavour-Sätze ohne Entscheidungsrelevanz. `SektorInfoBox` (Sektor.tsx, wiederverwendet in
    Multiplayer.tsx) gekürzt auf die für die Missionsplanung wichtigen Zahlen - rein beschreibende
    Zeilen (Schiffsklassen-Pool-Text, "Zusammensetzung variiert", "unvorhersehbare Umstände")
    entfernt. Nutzerkorrektur danach: die Kurzkarte (vorne, `zweck`-Text) bleibt wie sie ist, im
    Popup aber die missionsrelevanten Details behalten - Sieges-Serie-Abbruchbedingung,
    Teile-Staffelung nach Kampfausgang (15%/8%/2%) und der RapidFire-Kontern-Hinweis wurden deshalb
    wieder ergänzt, nur kompakter formuliert als vorher.

111. **Balance-Neukalibrierung: Schlachtkreuzer-Waffen angehoben, Antriebs-Geschwindigkeits-
    Hierarchie korrigiert (Nutzerentscheidung, vollständige Schiffswerte-Neukalibrierung).**
    Kosten/Nutzen-Analyse aller Schiffe ergab zwei Korrekturen:
    - **Schlachtkreuzer**: 121 Kosten/Waffenpunkt war der klare Ausreißer gegenüber seinen
      Nachbarn (57-90) und lieferte seine eigene Lore ("Feuerkraft eines Schlachtschiffs mit der
      Wendigkeit eines Kreuzers") nicht. Waffen 7.000 → 12.000 (jetzt ~71 Kosten/Waffen).
    - **Antriebs-Geschwindigkeit war invertiert**: Hyperraum-Schiffe (Schlachtkreuzer/Zerstörer/
      Reaper/Salvendreadnought) waren langsamer als Impuls-Schiffe (Kreuzer), teils sogar langsamer
      als Raketen-Schiffe. Neu sortiert: Rakete ≤12.500 (unverändert) < Impuls 9.000-15.000 <
      Hyperraum 15.200-17.000 (normale Kampfschiffe). Bewusste Lore-Ausnahmen unverändert:
      Imperator (100, "so langsam wie der Todesstern"), Sandronator (2.000, instabiler
      Experimental-Antrieb). `speed` wirkt ausschließlich auf Galaxie-Flugzeiten (Kampfmechanik
      nutzt die unabhängige Größenklasse), daher risikoarm. Live verifiziert.
    - **Vorher verworfener Testlauf im selben Gespräch**: `STACK_AGGREGATE_THRESHOLD` versuchsweise
      von 300 auf 800 angehoben (Annahme: seltenere Kämpfe durch den Raid-/Sektor-24h-Umbau würden
      mehr Einzelschiff-Präzision ohne CPU-Risiko erlauben) - Live-Messung im Kampfsimulator
      widerlegte das (5 Schiffstypen à 300/500/700 Stück ergaben ~1,7s/~3,8s/~6,9s PRO KAMPF, direkte
      Wartezeit statt nur Hintergrundlast) - Wert bleibt bei 300.

112. **Feature: Piraten-Sektor Solo (Niedrig/Mittel/Hoch) auf reine Container-Belohnung umgestellt,
    nur noch EINE Stufe gleichzeitig beflogbar (Nutzerentscheidung).**
    - **Gegenseitiger Ausschluss**: `sendFleet()` in `missions.ts` blockiert das Entsenden zu einer
      der drei Stufen, solange irgendeine andere (erkannt an `SEKTOR_CONFIG[...].winContainer`)
      noch aktiv ist - man muss sich für Niedrig/Mittel/Hoch entscheiden statt alle drei parallel
      zu befliegen.
    - **Belohnung komplett ersetzt**: `lootBase`/`teileCap`/`bonusLootChance`/`captainChance`/
      `guaranteedEliteContainers` für diese drei Sektoren entfernt (bleiben bei `piraten_elite`
      unverändert bestehen). Neues Feld `winContainer` in `SektorConfig` (sectors.ts): Niedrig 4x
      Silber, Mittel 2x Gold, Hoch 1x Elite - PRO GEWONNENEM CHECK (mindestens ein Gegner
      vernichtet), gezählt in `Mission.combatWins` (neues Feld, bricht anders als `streakWins`
      NICHT bei einem Check ohne Sieg zurück), ausgezahlt ERST bei Missionsende/Rückruf - analog
      zum Raid-Muster (Punkt 108).
    - **Sandronator** verdoppelt weiterhin die Ausbeute, jetzt über einen doppelten Sieg-Zähler
      (`combatWins += sandronatorAlive ? 2 : 1`) statt eines Ressourcen-Multiplikators.
    - **FarmDetail.eliteContainers** (nur noch von `guaranteedEliteContainers` genutzt, jetzt
      ungenutzt) durch generisches `winContainers: { tier, count }` ersetzt - Client
      (`Nachrichten.tsx`) rendert Icon/Label je nach Tier statt fest auf Elite verdrahtet.
    - **Tote Konfiguration entfernt**: `PIRATEN_RICH_FIND_CHANCE` (economy.ts) und der zugehörige
      `runRichFindCheck()`-Aufruf für Mittel/Hoch in `missions.ts` - ohne `mission.farmed` (kein
      lootBase mehr) gab es nichts mehr zu verdoppeln.
    - **Info-Popup** (`SektorInfoBox` in Sektor.tsx) verzweigt jetzt zwischen dem neuen
      Container-Block (Niedrig/Mittel/Hoch) und dem alten Eskalations-/Beute-Block (nur noch
      `piraten_elite`); RapidFire-Kontern-Hinweis bleibt für beide Zweige gemeinsam sichtbar.
    - **Live verifiziert** (Dev-Server): Info-Popup zeigt korrekte Container-Zahlen, gleichzeitiges
      Senden zu einer zweiten Stufe wird mit klarer Fehlermeldung abgelehnt, Rückruf einer Mission
      mit 3 gewonnenen Checks schrieb exakt 12 Silber-Container gut (3 × 4).

113. **Perf: RapidFire-Zielpool nutzt Typ-Buckets statt vollständiger Array-Filterung pro Schuss.**
    Nutzerfrage: ob typisierte Arrays (Float64Array/Int32Array statt `CombatUnit`-Objekten) Wirkung
    hätten. Node-CPU-Profiling einer echten Kampfberechnung (3.500 individuelle Schiffe) zeigte:
    NICHT der Objekt-Overhead war der Flaschenhals, sondern eine einzige Stelle in `fireShots()`
    (combat.ts) - der RapidFire-Zielpool wurde bei JEDEM EINZELNEN Schuss per
    `aliveTargets.filter(...)` neu aus der GESAMTEN Zielliste gebaut (O(Ziele) pro Schuss, bei
    tausenden Zielen und vielen Schüssen der dominante Kostenfaktor). Die Lösung existierte im Code
    bereits fürs Durchschlag-Feature (`AliveTargetsByType`, bisher nur bei Durchschlag-Forschung > 0
    aufgebaut) - jetzt IMMER aufgebaut und für die RF-Zielpool-Bildung wiederverwendet
    (O(RF-fähige Typen) statt O(Gesamt-Zielanzahl) pro Schuss).
    - **Gemessene Wirkung** (Node-Benchmark, dieselbe Kampfberechnung vorher/nachher, `resolveCombat`
      direkt aus `dist/game/combat.js` aufgerufen mit temporär auf einen sehr hohen Wert gesetztem
      `STACK_AGGREGATE_THRESHOLD`, um den Einzelschiff-Pfad zu erzwingen):
      1.500 Schiffe 1.800ms→270ms (~6,7x) · 2.500 Schiffe 4.877ms→449ms (~10,9x) · 3.500 Schiffe
      9.383ms→708ms (~13,2x) · 5.000 Schiffe 21.079ms→1.503ms (~14,0x). Speedup-Faktor WÄCHST mit
      der Flottengröße (eliminiert den quadratischen Anteil, nicht nur einen konstanten Faktor).
    - **Live verifiziert** über die echte Simulator-API (280 Schiffe/Typ × 5 Typen, 12 Durchläufe):
      ~200ms/Kampf statt ~1.700ms zuvor. RapidFire-Korrektheit per Sanity-Check bestätigt
      (Schwerer Jäger vs. Leichter Jäger triggert weiterhin plausibel oft, ~67% RF-Rate).
    - `STACK_AGGREGATE_THRESHOLD` bleibt unverändert bei 300 (siehe Punkt 114 - offene
      Entscheidung, ob jetzt angehoben werden soll).

114. **Perf-Neumessung: `STACK_AGGREGATE_THRESHOLD` von 300 auf 1.200 angehoben (Nutzerentscheidung
    29.07.2026, Fortsetzung von Punkt 113).** Nutzer wollte eigentlich Richtung "altes
    Einzelschiff-Verhalten" zurück (mehr Kämpfe exakt statt aggregiert simuliert), ABER nur wenn
    das ohne echte CPU-/Latenz-Risiken machbar ist.
    - **Neue Messung** (gleiches Benchmark-Muster wie Punkt 113: `resolveCombat` direkt aus
      `dist/game/combat.js`, `STACK_AGGREGATE_THRESHOLD` temporär auf einen sehr hohen Wert
      gesetzt um den Einzelschiff-Pfad zu erzwingen, 5 Schiffstypen à N Stück, NPC-Seite 30%
      stärker, Median aus 3-5 Läufen): 300→176ms · 500→307ms · 700→488ms · **800→607ms** ·
      1.000→831ms · **1.200→1,10s** · 1.500→1,51s · 2.000→2,44s · 3.000→4,25s. Skaliert nach dem
      Perf-Fix aus Punkt 113 praktisch linear statt quadratisch mit der Flottengröße - bestätigt
      dessen Wirkung nochmal unabhängig.
    - **Nutzerentscheidung**: 1.200 als "sauberer Mittelweg" gewählt (~1,1s, deutlich unter der
      als unangenehm empfundenen ~2-3s-Marke aus der Vergangenheit) - bewusst noch nicht 1.500-2.000,
      Ergebnis wird erstmal live beobachtet ("werde beobachten wie es läuft"), bevor ggf. weiter
      angehoben wird.
    - `STACK_AGGREGATE_THRESHOLD` in `combatConstants.ts` auf 1.200 gesetzt, Kommentar-Historie
      dort um diesen Testlauf ergänzt. Server neu gebaut (`tsc -p tsconfig.json` in `server/`),
      Sanity-Check bestätigt: 500/Typ (jetzt unter der neuen Schwelle, vorher über der alten 300er
      Schwelle aggregiert) läuft exakt über den Einzelschiff-Pfad, ~376ms, plausible
      Überlebenden-Zahlen.
    - **Offen für später**: falls noch mehr Spielraum gewünscht ist, wäre laut Punkt 113s
      Profiling-Methodik als nächster Hebel typisierte Arrays fürs `CombatUnit`-Grundgerüst
      realistisch (kleinerer, aber spürbarer Effekt als der schon behobene RF-Flaschenhals).

115. **Perf: Worker-Pool von 3 auf 1 gesenkt (Nutzerentscheidung 29.07.2026, direkte
    Anschlussfrage an Punkt 114).** Nutzerfrage: warum die CPU trotz normalerweise ~10% Auslastung
    bei einem Kampf so stark hochschnellt, und ob eine kleinere Pool-Größe das begrenzen könnte.
    - **Klärung**: `POOL_SIZE` in `combatRunner.ts` bestimmt NICHT die Rechengeschwindigkeit eines
      einzelnen Kampfs (der läuft ohnehin komplett auf genau einem Worker/Kern, egal wie groß der
      Pool ist) - sie bestimmt nur, wie viele VERSCHIEDENE Kämpfe gleichzeitig auf separaten Kernen
      parallel laufen dürfen. Bei Pool=3 konnten bis zu 3 gleichzeitige Kämpfe zusammen bis zu 75%
      der 4 vCPU (Hetzner CX33) belegen.
    - **Fix**: `POOL_SIZE` auf 1 gesenkt - deckelt die maximal mögliche GLEICHZEITIGE CPU-Last durch
      Kampfberechnung technisch auf einen einzigen Kern. Weitere, während ein Kampf läuft eingehende
      Kampfanfragen werden jetzt über die bereits bestehende `waitQueue` serialisiert statt parallel
      gerechnet - bei nur 2 Spielern und nach der Piraten-Sektor-Exklusivität/4h-Takt-Reduktion
      (Punkt 112/109) ist echte Gleichzeitigkeit ohnehin selten geworden, und bei der aktuellen
      Kampfzeit (~1,1s worst case bei `STACK_AGGREGATE_THRESHOLD`=1.200, siehe Punkt 114) ist eine
      eventuelle Wartezeit kaum spürbar. Ursprünglicher Grund für Pool=3 (Durchsatz bei vielen
      gleichzeitigen Kämpfen, README Punkt 102/103) war eher auf mehr aktive Spieler ausgelegt.
    - Server neu gebaut (`tsc -p tsconfig.json`), kompiliert sauber.

116. **Bugfix: "Entsenden"-Buttons der anderen Piraten-Sektor-Stufen blieben trotz aktiver Mission
    anklickbar.** Nutzer-Beobachtung (Screenshot): mit aktiver Flotte in "Hoch" (16.270 Schiffe,
    22h verbleibend) waren "Niedrig" und "Mittel" weiterhin rot/anklickbar, obwohl seit Punkt 112
    nur EINE Piraten-Sektor-Stufe gleichzeitig beflogbar sein soll.
    - **Root Cause**: die gegenseitige Exklusivität wurde bisher NUR serverseitig durchgesetzt
      (`sendFleet()` in `missions.ts`, prüft `cfg.winContainer` gegen alle nicht-finalisierten
      Missionen). `SektorCard` (Sektor.tsx) berechnete `activeMission` bisher ausschließlich pro
      EIGENEM Sektor (`m.sektorId === sektor.id`) - eine aktive Mission in einem ANDEREN
      Piraten-Sektor hatte auf die Karten der übrigen Stufen keinerlei Auswirkung, der Button blieb
      normal klickbar und liess sich auch mit Flotte befüllen, erst beim tatsächlichen Senden kam
      die (leicht zu übersehende) Serverfehlermeldung.
    - **Fix**: neue Prop `blockedByOtherWinContainer` (Sektor.tsx, in der `sektorenInTab.map()`-
      Schleife berechnet) - spiegelt exakt dieselbe Bedingung wie der Server (`cfg.winContainer &&
      irgendeine andere nicht-finalisierte Mission mit `winContainer`-Sektor). Ist sie wahr UND
      keine eigene Mission aktiv, zeigt die Karte einen deaktivierten Button (`disabled`, 50%
      Opacity, `cursor:not-allowed`) mit Erklärtext statt des normalen "Entsenden"-Buttons.
    - **Live verifiziert** (Dev-Server, Testaccount mit Flotte direkt in der DB geseedet): Flotte
      nach "Hoch" gesendet - "Niedrig"/"Mittel" zeigten sofort `disabled:true`, Opacity 0,5,
      `cursor:not-allowed` (per `getComputedStyle` bestätigt) + Hinweistext "Nur EINE
      Piraten-Sektor-Stufe gleichzeitig beflogbar - erst zurückrufen oder abwarten.". Nach
      `Zurückrufen` der Hoch-Mission wurden alle drei Buttons sofort wieder `disabled:false`.
      `tsc --noEmit` im Client kompiliert sauber.

117. **Feature: Piraten-Sektor-Missionsstatus zeigt jetzt Kampf-Fortschritt an.** Nutzerwunsch:
    vor einem Rückruf abwägen können, wie viele der Checks bereits stattgefunden haben (und wie
    viele davon gewonnen wurden) - bisher zeigte `MissionStatus` (Sektor.tsx) nur die reine
    Zeit-Fortschrittsanzeige (Anflug/Im Sektor/Rückflug in %), keine Kampf-Information.
    - **Elite-Bollwerk bewusst ausgeschlossen** (Nutzer-Klarstellung): dort kommt ohnehin nach
      jedem Check eine eigene Nachricht mit vollem Kampfbericht, zusätzliche Anzeige wäre
      redundant. Der Fortschritt (`processedHours`/`piratenCheckCount`) wird dort bereits seit
      längerem in `Multiplayer.tsx` angezeigt.
    - **Neue Zeile** in `MissionStatus`, nur wenn `cfg.type === 'piraten'` und mindestens ein Check
      gelaufen ist: "⚔️ Kämpfe bisher: {processedHours}/{piratenCheckCount} Checks · {combatWins}
      gewonnen" (Gewinn-Anzahl nur bei den Container-Stufen Niedrig/Mittel/Hoch, erkannt an
      `cfg.winContainer`, siehe Punkt 112). `Mission.combatWins` war serverseitig schon vorhanden
      (treibt die Container-Belohnung), fehlte aber im Client-Typ (`types/game.ts`) - ergänzt.
    - **Live verifiziert** (Dev-Server, Mission mit `processedHours:3`/`combatWins:2` direkt in der
      DB geseedet): Zeile erscheint korrekt als "3/6 Checks · 2 gewonnen". `tsc --noEmit` im
      Client kompiliert sauber.

118. **Feature: Elite-Bollwerk bekommt Gesamt-Sieg-Zähler + Live-Flottenansicht während der
    Expedition.** Direkte Folgefrage zu Punkt 117 - Nutzer-Klarstellung: Elite-Bollwerk hat
    `checkChance:1` (garantierter Kampf bei JEDEM der 6 Checks, anders als Niedrig/Mittel/Hoch
    solo mit 55-75%), Kampfberichte kommen also ohnehin schon zuverlässig als eigene Nachricht pro
    Check - Punkt 117s Anzeige wäre hier redundant. Wichtiger: Einsicht in die AKTUELLE Flottenstärke
    während die Expedition noch läuft, um vor einem Rückruf abzuwägen.
    - **Neues Feld `GroupOperation.totalWins`** (`types.ts`, Server+Client) - kumulative Anzahl
      GEWONNENER Checks über die gesamte Expedition, im Unterschied zu `streakWins` (aktuelle
      Serie, reißt bei einem Check ohne vernichteten Gegner ab und treibt nur die
      Belohnungs-Eskalation an). Wird in `runGroupHourlyCheck()` (groupOps.ts) neben `streakWins`
      hochgezählt, wann immer `anyNpcDestroyed` zutrifft.
    - **`Multiplayer.tsx`**: Fortschrittszeile erweitert auf "Fortschritt: X/6 Checks · Y gewonnen
      · Rückkehr in ...". Neuer Button "🚀 Flotten ansehen" neben "Jetzt zurückrufen" öffnet ein
      `InfoModal` mit den AKTUELLEN Schiffszahlen aller Teilnehmer (`op.participants[].ships` -
      dieses Feld wird serverseitig bereits pro Check auf die tatsächlichen Überlebenden
      aktualisiert, `p.ships[id] = survived` in `runGroupHourlyCheck()`, war also schon vorhanden,
      nur bisher nirgends im Client angezeigt). Exakt dasselbe Live-Fleet-Prinzip wie der
      "Details"-Button bei Solo-Missionen in `Sektor.tsx` (dort ebenfalls `mission.ships[id] =
      survived` pro Check).
    - **Live verifiziert** (Dev-Server, Solo-Elite-Bollwerk-Expedition gestartet, danach
      `processedHours`/`totalWins`/`participants[0].ships` direkt in der `group_operations`-Tabelle
      auf 3/2/{leicht:62, kreuzer:41} gesetzt): Fortschrittszeile zeigt korrekt "3/6 Checks (alle
      4h) · 2 gewonnen", "Flotten ansehen"-Modal zeigt korrekt die reduzierten Stückzahlen (62/41
      statt der urspruenglich entsandten 100/50) pro Teilnehmer. `tsc`/`tsc --noEmit` in Server UND
      Client kompilieren sauber.

119. **Cleanup: rein kosmetisches "Allianz"-Panel aus der Galaxie-Ansicht entfernt.** Nutzer-Hinweis
    nach dem Forschungsbaum-Brainstorming: das "🚩 Sternenbund"-Panel in `Galaxie.tsx` (Mitglieder-
    liste aller Nutzer + Bots, Gegenseite "Piratenkonföderation") hatte laut Code-Kommentar in
    `economy.ts` NIE ein eigenes Datenmodell oder eigene Logik - rein kosmetische Anzeige von "alle
    Nutzer aus `users`", kein Beitritt/Austritt, keine Mechanik.
    - **Entfernt**: `ALLIANCE_NAME`/`PIRATE_ALLIANCE_NAME` (`economy.ts`), `allianceName`/
      `pirateAllianceName` im `/data`-Bundle (`routes.ts`) und im Client-Typ (`types/game.ts`), das
      Panel selbst inkl. der jetzt ungenutzten `users`-Destrukturierung in `Galaxie.tsx`
      (`useGame()` selbst behält `users` weiterhin - wird u.a. in `Multiplayer.tsx` zum Einladen
      gebraucht, nur die Galaxie-Seite nutzte es ausschließlich für dieses Panel).
    - **Live verifiziert** (Dev-Server): Galaxie-Seite lädt fehlerfrei ohne das Panel, keine
      Konsolen-Fehler. `tsc -p tsconfig.json` (Server) und `tsc --noEmit` (Client) kompilieren
      sauber.

120. **Feature: Allianz-Station - echtes, persistentes Allianzsystem mit gemeinsam gebauter
    Raumstation.** Nutzerentscheidung (direkte Folge auf Punkt 119s Entfernung des rein
    kosmetischen Allianz-Panels): "richtiges" Allianzsystem - jemand gründet eine Allianz, ein
    zweiter Spieler tritt bei, gemeinsam wird eine Raumstation an einer Galaxie-Position gebaut.
    Dort gibt es nur Minen + Solarkraftwerk (inkl. aller Module) in drei Versionen V1/V2/V3
    (jede Version besser, aber teurer/langsamer, schaltet sich sequenziell frei). Ressourcen
    werden gemeinsam gelagert und per Self-Service auf beide Mitglieder verteilt.
    - **Kontext**: es gab bereits einmal ein "Außenposten"-System (`OUTPOST_POSITIONS`/
      `OUTPOST_TIERS` in `galaxyConstants.ts`, verwaiste `outposts`-DB-Tabelle, `outposts.ts`
      existiert nicht mehr) - wurde entfernt, weil die Piraten-KI, die diese Posten angriff,
      dieselben CPU-Spitzen verursachte wie die (ebenfalls entfernten) KI-Mitspieler. Die neue
      Station ist bewusst **komplett anders**: keine Gegner-KI, nicht angreifbar, rein kooperativ
      zwischen den Spielern - strukturell risikofrei fürs damalige CPU-Problem.
    - **Datenmodell**: neue Tabellen `alliances`/`stations` (`db.ts`, gleiches id/data_json-Muster
      wie `group_operations`/`galaxy_events`). `Alliance` (Mitglieder mit pending/accepted-Status,
      analog `GroupOperationParticipant`, aber PERSISTENT statt einmalig) und `Station`
      (Position, `tier`, `buildings`/`buildingModules`-Maps, `buildQueue`, eigenes
      `resources`-Lager) in `types.ts`. Ein Nutzer kann aktuell nur Mitglied EINER Allianz sein -
      kein Allianz-Browser/mehrere gleichzeitige Allianzen nötig (Nutzer-Entscheidung, nur 2
      Spieler betroffen).
    - **Wichtige Design-Entscheidung**: die Station bekommt in `game/stations.ts` KOMPLETT
      EIGENE, von `actions.ts` entkoppelte Produktions-/Kosten-/Energie-Formeln (1:1 dasselbe
      Muster: `levelScaledValue`, `buildingCostForLevel`, `energyFactor`) statt die
      Heimatbasis-Funktionen wiederzuverwenden - die sind eng an `PlayerState.research`/
      `economyClass`/Booster gekoppelt, was für eine GEMEINSAME Station keinen Sinn ergibt (wessen
      Forschung sollte gelten, wenn beide Mitglieder unterschiedlich weit sind?). Stations-Produktion
      hängt NUR von der Gebäude-Stufe ab, keine Spieler-Boni.
    - **Gebäude-Balance** (`data/stationBuildings.ts`, 12 Einträge: 4 Gebäude × 3 Stufen,
      namensraum-getrennte IDs wie `v1_metallmine`): V1 = identische Basiswerte wie die
      Heimatbasis-Pendants (`buildings.ts`), aber mit Level-Cap 30 (Nutzerentscheidung) statt
      unbegrenzt. V2 = 2x Kosten/1.3x Bauzeit/1.5x Ertrag relativ zu V1, V3 = 4x/1.6x/2.5x -
      erster Wurf, wie jedes Wirtschafts-Feature in diesem Projekt live nachkalibrierbar.
      Solarkraftwerk bewusst OHNE Level-Cap (muss frei ausgebaut werden können, um die
      Minen-Energie zu decken). Energiefaktor GETRENNT pro Stufe berechnet (ein spätes
      V3-Solarkraftwerk versorgt nicht rückwirkend V1/V2 mit) - **Produktion selbst ist aber
      kumulativ über alle freigeschalteten Stufen** (Nutzerentscheidung: V1-Ausbau bleibt auch
      nach V2/V3-Freischaltung wertvoll, kein Ablöse-Wechsel).
    - **Module** (`data/stationBuildingModules.ts`, 33 Einträge, generiert statt von Hand
      getippt - analog zum `buildModule()`-Generator in `shipModules.ts`): dieselben 3
      Modul-Kinds pro Mine (Fördereffizienz/Energiesparmodul/Automatisierung) und 2 pro
      Solarkraftwerk (Ertragssteigerung/Wartungsoptimierung) wie bei der Heimatbasis, Freischaltung
      ab Gebäude-Level 20, `maxLevel:10`. Teilen sich denselben Bau-Slot mit den Gebäuden selbst
      (`Station.buildQueue`-Einträge haben jetzt `buildingId` ODER `moduleId`, analog
      `PlayerState.BuildJob`).
    - **Stufen-Freischaltung**: `checkTierUnlock()` schaltet die nächste Stufe frei, sobald alle
      3 Minen der aktuellen Stufe ihr Level-Cap (30) erreicht haben (Solarkraftwerk zählt bewusst
      nicht mit, da es keinen Cap hat).
    - **Galaxie-Integration**: Ersteller wählt bei Gründung eine freie Position (`foundStation()`,
      nutzt dieselbe `getReservedGalaxyPositions()`/`isGalaxyPositionFree()`-Prüfung wie
      `relocateGalaxyPosition()`, jetzt um Stations-Positionen erweitert). Analog zum
      Piraten-Sektor-Buttons-Bugfix (Punkt 116) zeigt die Galaxie-Ansicht eine belegte
      Stations-Position jetzt auch SICHTBAR als belegt ("🛰️ Allianz-Station (Name)") statt nur
      serverseitig zu blockieren - neues `stationPositions`-Feld im `/game/galaxy`-Bundle.
    - **Passive Produktion ohne Dauer-Prozess**: `processStationTick()` (Bau-Warteschlange +
      Produktion + Stufen-Check) läuft opportunistisch bei JEDEM Laden der Station
      (`loadStationWithTick()`, analog zum Nachhol-Prinzip aus `pirateBaseState.ts`) UND zusätzlich
      aus dem globalen Heartbeat (`runStationHeartbeatTick()` in `heartbeat.ts`), damit Produktion
      auch läuft, wenn gerade niemand die Allianz-Seite offen hat.
    - **Einzahlen/Abheben**: Self-Service in beide Richtungen (`depositToStation()`/
      `withdrawFromStation()`, kein Genehmigungsschritt - "nach Wunsch aufteilen"). Einzahlen löst
      das Henne-Ei-Problem einer frisch gegründeten Station bei 0 Ressourcen.
    - **Neue Routen** `/alliance`, `/alliance/create`, `/alliance/invite`, `/alliance/respond`,
      `/alliance/station/found`, `/alliance/station/build`, `/alliance/station/module`,
      `/alliance/station/deposit`, `/alliance/station/withdraw` (routes.ts, 1:1 nach dem Muster
      der bestehenden `/party/*`-Routen). Neue Client-Seite `Allianz.tsx` (Gründen/Einladen/
      Annehmen, Stufen-Tabs V1/V2/V3 mit Sperr-Hinweis, Baukarten inkl. Modulen, Ressourcen-Pool
      + Einzahlen/Abheben-Formular), neuer Nav-Eintrag.
    - **Live verifiziert** (Dev-Server, zwei Testaccounts, DB-Seeding für Zeitraffer): Allianz
      gründen/einladen/annehmen End-to-End funktioniert, Station-Gründung an einer gewählten
      Position reserviert diese korrekt (in der Galaxie sichtbar als belegt), Einzahlen/Abheben
      verschiebt Ressourcen korrekt zwischen Spieler- und Stations-Konto, Metallmine+Solarkraftwerk
      gebaut produzierten nach 1h Zeitraffer exakt die erwartete Menge (`levelScaledValue`-Formel,
      Energiefaktor 1 bestätigt), alle Bau-Buttons korrekt deaktiviert während ein Bauvorhaben
      läuft (geteilter Slot für Gebäude UND Module), V1-Minen auf Level 30 gesetzt schaltete V2
      korrekt frei (inkl. korrekter 2x-Kostenwerte), Modul-Bau (Fördereffizienz) funktioniert mit
      korrekter Bauzeit (`baseTimeSeconds × 4`) und Kosten. Zweiter Test-Account sah nach Neuladen
      exakt denselben Stations-Stand (Multi-Viewer-Konsistenz bestätigt). `tsc`/`tsc --noEmit` in
      Server UND Client kompilieren sauber. Plan-Datei mit vollständiger Design-Historie:
      `.claude/plans/tranquil-forging-pretzel.md`.

121. **Bugfix: Raid startete bei einem Spieler weiterhin zu alten, nicht-sonntäglichen Zeitpunkten
    nach der Umstellung auf 1x/Woche.** Nutzer-Bericht: bei seiner Frau (`SchnelleRatte`) korrekt
    seit dem Umbau (Punkt 108) kein Raid mehr außerhalb Sonntag 0 Uhr, bei ihm selbst aber weiterhin
    einer zum alten Rhythmus.
    - **Root Cause**: Die beiden Einmal-Migrationen in `state.ts` (`raidScheduleMigrated`/
      `raidWeeklyScheduleMigrated`), die `nextRaidCheck` auf den neuen Sonntags-Rhythmus
      umstellen sollten, setzten ihr "erledigt"-Flag IMMER, aber den eigentlichen Reset NUR wenn
      `!parsed.raid` (kein aktiver Raid). War beim betroffenen Nutzer GENAU im Moment des
      gestrigen Deploys ein Raid aktiv (plausibel beim alten 2x/Tag-Rhythmus), wurde die Migration
      faelschlich als "erledigt" markiert, OHNE `nextRaidCheck` tatsaechlich zurueckzusetzen - der
      Zeitstempel blieb auf einem alten, nicht sonntaeglichen Wert stehen. Da der betroffene Spieler
      in `RAID_SCHEDULE_BY_USERNAME` eine Chance von 1 (immer) hat, loeste dieser stehengebliebene
      Alt-Zeitstempel beim naechsten `processRaidTimer()`-Durchlauf sofort einen neuen Raid aus -
      zum alten, falschen Zeitpunkt. Seine Frau hatte im Deploy-Moment keinen aktiven Raid, die
      Migration griff bei ihr sauber.
    - **Fix**: Beide bestehenden Migrationsbloecke setzen ihr Flag jetzt NUR NOCH, wenn der Reset
      auch tatsaechlich angewendet wurde (`if (!parsed.xMigrated && !parsed.raid)` statt Flag immer
      + Reset nur bedingt) - retried also bei jedem weiteren Laden, bis es einmal ohne aktiven Raid
      klappt. Zusaetzlich neuer dritter Migrationsflag `raidWeeklyScheduleRealigned`
      (`PlayerState`, `types.ts`) fuer die bereits betroffenen Bestandskonten, deren beide aelteren
      Flags von gestern schon (fälschlich) auf `true` stehen und daher nicht mehr retryen wuerden -
      korrigiert `nextRaidCheck` einmalig unabhaengig vom Stand der beiden aelteren Flags, sobald
      kein Raid mehr aktiv ist.
    - **Verifiziert** (Node-Testskript gegen `dist/game/state.js`, simulierter Bestandsaccount mit
      beiden Alt-Flags auf `true` und `nextRaidCheck` auf einen 20 Tage alten, nicht-sonntäglichen
      Zeitstempel gesetzt, kein aktiver Raid): nach `loadPlayerState()` korrekt auf den naechsten
      Sonntag 0 Uhr Berliner Zeit (01./02.08.2026) korrigiert, `raidWeeklyScheduleRealigned` auf
      `true` gesetzt. `tsc -p tsconfig.json` kompiliert sauber.
    - **Wichtig**: greift erst nach dem naechsten Deploy UND naechstem Laden des betroffenen
      Kontos (Login oder Heartbeat) - bis dahin kann der bereits gestern ausgeloeste Fehl-Raid noch
      laufen, das ist unabhaengig vom Fix und muss regulaer auslaufen.

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
- Schiffs-/Verteidigungs-Modulkosten und -Bauzeiten deutlich gesenkt (Nutzer-Feedback: bei teuren
  Schiffen/Anlagen nicht mehr machbar). `shipModules.ts`/`defenseModules.ts`: Kosten-Multiplikator
  25x→8x, Zeit-Multiplikator 300x→80x, Kosten-Wachstum pro Stufe 1.55→1.35, Zeit-Wachstum 1.4→1.25.
  Imperator-Modul-Fixkosten (hatte keine ableitbare `cost`) von 500/400/250 Mio. auf 50/40/25 Mio.
  gesenkt, Basis-Bauzeit von 7 auf 2 Tage.
- Schiffs-/Verteidigungs-Modul-Bauplätze von je 1 auf je 3 erhöht (`MAX_SHIP_MODULE_SLOTS`/
  `MAX_DEFENSE_MODULE_SLOTS` in `combatConstants.ts`) - passend zu den gesenkten Modul-Kosten/
  -Bauzeiten, analog zu den 3 normalen Schiffs-/Verteidigungs-Bauplätzen. Fehlermeldungen in
  `actions.ts` (`startShipModuleUpgrade`/`startDefenseModuleUpgrade`) nutzen jetzt die Konstante
  statt eines hartkodierten "immer nur eins" - Client liest die Anzahl ohnehin dynamisch aus
  `gameData.maxShipModuleSlots`/`maxDefenseModuleSlots`, keine UI-Anpassung nötig.
- Baulimits (`maxCount`) der Spezialschiffe angehoben (Nutzerwunsch, explizit als finale, harte
  Obergrenze gedacht - siehe Kommentar in `ships.ts`): Imperator 2→6, Salvenjäger 60→150,
  Salvenkreuzer 30→90, Salvendreadnought 16→30. Pirat/NPC-Generierung bewusst NICHT angefasst -
  die schließt diese Schiffe ohnehin unabhängig vom `maxCount` über `specialOnly`/`unique`/
  `MULTI_TARGET_VOLLEY_SHIPS` aus (`combat.ts` `generatePiratenFleet`/`generateFallbackFleet`),
  das war eine bewusste, separate Designentscheidung und bleibt unverändert.
- Nachtrag: Baulimits der Spezialverteidigung ebenfalls angehoben (gleiche Nutzer-Regel wie oben,
  siehe Kommentar in `defenses.ts`): Sentinel-Kanone 40→150, Ultimate-Kanone 20→60 - bewusst höher
  als bei den Salvenschiffen, da ihre Werte im Vergleich weniger dominant sind.
- Flottengrößen-Belohnungsbonus eingeführt (Nutzerentscheidung: bisher war die Beute bei allen
  Missionsarten komplett unabhängig von der eingesetzten Flottenstärke - `targetPower` floss
  ausschließlich in die Gegner-Skalierung, nie in die Belohnung). Neuer Shared-Helper
  `fleetSizeRewardMultiplier(sentPower, referencePower)` in `combat.ts`: logarithmisch, gedeckelt
  bei `FLEET_SIZE_BONUS_CAP=0.5` (max. +50%), Rate `FLEET_SIZE_BONUS_RATE=0.25`
  (`combatConstants.ts`) - erst oberhalb der sektortypischen Referenzgröße (`cfg.npcFloor` bzw.
  `RAID_MIN_TARGET_POWER`) gibt es überhaupt einen Aufschlag.
  - Piraten-Sektoren niedrig/mittel/hoch (`missions.ts` `runHourlyCheck`): Bonus auf Beute-
    Multiplikator UND Teile-Ertrag.
  - Elite-Bollwerk (`groupOps.ts` `runGroupHourlyCheck`): Bonus auf Beute UND Teile, basierend auf
    der KOMBINIERTEN Flottenstärke aller Teilnehmer (`totalSentPower`).
  - Raid-Bergungs-DM (`raids.ts` `finalizeRaidWaves`): Bonus auf `RAID_SALVAGE_DM_PER_KILL`-Rate
    UND `RAID_SALVAGE_DM_MAX`-Deckel gleichermaßen (sonst am Cap oft wirkungslos), basierend auf
    einem Schnappschuss der kombinierten Macht der ERSTEN Welle (`raid.initialCombinedPower`,
    neues Feld in `RaidState`) statt live neu berechnet - Verluste über die Wellen sollen den
    Bonus nicht nachträglich verwässern.
  - **Ausdrücklich NICHT für den Piratenadmiral (P10)**: der hat mit der "weitermachen"-Eskalation
    (`ADMIRAL_EXTRACTION_GROWTH_PER_CHECK`) schon eine eigene Risiko/Belohnung-Mechanik, ein
    zusätzlicher Flottenbonus würde sich damit überschneiden (Nutzerentscheidung).
- Raid-Gegnerstärke-Formel korrigiert (Nutzerentscheidung, explizit als Korrektur einer früheren
  Entscheidung benannt: "das war mal ein Fehler von mir aus"): skaliert jetzt auf einer Mischung
  aus 70% eigener Heimatflotte + 30% Verteidigungsanlagen-Stärke (`RAID_FLEET_POWER_WEIGHT`/
  `RAID_DEFENSE_POWER_WEIGHT` in `raids.ts`) statt wie zuvor ausschließlich auf der Verteidigung
  (macht README Punkt 22 zur Raid-Entkopplung obsolet). Ausdrücklich NUR die eigene Heimatflotte
  zählt mit - Verstärker-/Halte-Flotten anderer Spieler bleiben bewusst außen vor (würden sonst die
  eigene Unterstützung gegen einen selbst verschärfen), tragen im tatsächlichen Kampf aber weiterhin
  voll bei.
- Neu: angreifbare Piratenbasen (Nutzerentscheidung) - komplett unabhängig vom Raid-System (das
  generiert seine Gegnerflotte weiterhin frisch bei Wellen-Ankunft, siehe raids.ts, keine
  Berührungspunkte). Piratenbasen bekommen einen eigenen, PERSISTENTEN Zustand (Flotte/
  Verteidigung/Ressourcen wie ein Mini-KI-Spieler) statt zufällig generierter Gegner - Verluste UND
  Beute wirken sich dauerhaft auf die Basis aus. Können NICHT zerstört werden, wachsen aber langsam
  von selbst nach (Nutzerentscheidung).
  - **Neue Datei `game/pirateBaseState.ts`**: gesamte Logik (Seeding, Wachstum, Angriff starten/
    verarbeiten). Neuer Typ `PirateBaseState` (`types.ts`) - global, nicht an einen Nutzer gebunden,
    eigene DB-Tabelle `pirate_bases` (`db.ts`, gleiches simples id/data_json-Muster wie
    `galaxy_events`, aber ohne `delete` - Basen werden nie gelöscht).
  - **`PIRATE_BASE_IDS`/`ACTIVE_PIRATE_BASE_IDS`** (`galaxyConstants.ts`): stabile Index-Ids für die
    12 `PIRATE_BASES`-Koordinaten, aber bewusst nur die ERSTEN 4 aktiv/angreifbar ("erstmal mit 4
    anfangen und schauen wie es läuft" - bei nur 2 Spielern + 2 KI-Bots wären 12 gleichzeitig zu
    viel).
  - **Wachstum** (`applyGrowth()`, lazy bei jedem `loadPirateBase()`): Ressourcen wachsen stündlich
    linear, gedeckelt auf 24h Vorrat. Flotte/Verteidigung bekommen alle 3h einen kleinen Schub auf
    einen rotierenden Typ (deterministisch nach ABSOLUTER Zeit via `Math.floor(now / INTERVAL)`,
    nicht nach zuletzt verarbeitetem Zeitpunkt - eine lange nicht geladene Basis holt beim nächsten
    Laden nicht alle verpassten Schübe auf einmal nach), gedeckelt pro Typ.
  - **Angriff = Ein-Weg-Flug mit echtem Kampf bei Ankunft** (`PirateAttackDeployment`, neues
    `PlayerState.pirateAttacks`-Array, strukturell wie `GalaxyEventTrip` aber mit `resolved` statt
    `collected`): `startPirateBaseAttack()` deduziert Flotte/Treibstoff sofort (analog
    `startHoldDeployment()`), `processPirateAttacks()` (aufgerufen aus `tick()` in `actions.ts`,
    NACH `processRaidTimer()`) löst bei Ankunft den Kampf über `runCombatInWorker()` aus (identisches
    Request-Format wie `missions.ts` `runHourlyCheck()`) und schreibt Überlebende zurück in
    `PirateBaseState.fleet`/`.defense` - PERSISTENT, anders als bei normalen Sektor-Missionen, wo
    NPC-Verluste nie gespeichert werden. Beute: `PIRATE_BASE_LOOT_PERCENT` (35%) der AKTUELL
    gelagerten Basis-Ressourcen bei jedem erfolgreichen Angriff (auch wenn die Basis leer
    vorgefunden wird - dann kampflos direkter Loot).
  - **KI-Bots greifen automatisch an** (Nutzerentscheidung): `maybeAttackPirateBase()` in `bot.ts`,
    exakt nach dem `maybeHoldAtHumans()`-Muster (kleine Zufallschance/Heartbeat, Fleet-Anteil,
    Mindestgröße).
  - **Client**: neue Kachel-UI in `Galaxie.tsx` (Machtwert-Anzeige aus `pirateBaseSummaries`,
    "Angreifen"-Button, eigener `targetPirateBase`-Zielzustand parallel zu `targetUserId`/
    `targetEvent`, gleiche Fleet-Auswahl-UI wiederverwendet). Neuer Endpunkt
    `POST /galaxy/pirate-base/attack`, `GET /galaxy` liefert zusätzlich `pirateBaseSummaries`
    (nur grobe Machtzahl, keine exakten Bestandszahlen - die gibt's erst im Kampfbericht).
  - Manuell End-to-End getestet (lokaler Dev-Server, Testaccount): Basis-Machtwert-Berechnung exakt
    verifiziert (5.889.510 = Summe aus `combatFleetPowerBase()` über die Seed-Flotte/-Verteidigung),
    Angriffsflug inkl. Distanz/Flugzeit/Treibstoff-Vorschau, Kampfauflösung (korrekter Kampfbericht
    mit allen 4 NPC-Einheitstypen), "bereits angreifend"-Sperre und Rückflug funktionieren.
  - **Rebalance Juli 2026 (Nutzerentscheidung, "mehr Aktivität + mittlere Stärke, Angriffe sollen
    sich lohnen")**: Start-Bestand angehoben (`seedPirateBase()`: Flotte 20/8→60/25/10 inkl. neuem
    `kreuzer`-Anteil, Verteidigung 15/8→40/25, Ressourcen 40k/25k/12k→150k/90k/40k) - vorher war
    eine frische Basis so schwach, dass ein Angriff kaum lohnende Beute abwarf. Passive
    Ressourcen-Rate 4000/2500/1200 → 6000/3500/1800 pro Stunde. Flotten-/Verteidigungs-Wachstum:
    Intervall 3h → 1,5h, Schub 3/2 → 5/3 pro Tick, Kappungsgrenze 120/80 → 180/120 pro Typ (vorher
    dauerte es rechnerisch ~2 Wochen bis zur vollen Kappungsgrenze, da sich 3 rotierende
    Schiffstypen einen 3h-Takt teilten - jeder Typ wuchs effektiv nur alle 9h). Bereits bestehende
    Basen bekommen die neuen Mindestwerte automatisch per Einmal-Migration (
    `PirateBaseState.strengthRebalanced2607`, `applyStrengthRebalanceMigration()` in
    `pirateBaseState.ts`, greift beim naechsten `loadPirateBase()` nach dem Deploy, analog zum
    `raidScheduleMigrated`-Muster in `state.ts`) - hebt NUR nach oben an (`Math.max`), eine bereits
    staerkere Basis bleibt unangetastet. Kein manueller Schritt auf dem Produktionsserver noetig,
    ein normaler Git-Push/Deploy reicht.
  - **Bot-Aktivitätschance** (`BOT_ACTION_CHANCE` in `bot.ts`, betrifft `maybeHoldAtHumans()`/
    `maybeAttackPirateBase()`/`maybeSpyOnPirateBase()`): 0,1 → 0,3 pro Heartbeat (alle 2 Minuten) -
    vorher im Schnitt nur alle ~20 Minuten ein Versuch, jetzt alle ~6-7 Minuten.
  - **ÜBERHOLT durch Punkt 88 (Nutzerentscheidung Juli 2026, selber Tag):** der obige
    Schritt-/Intervall-/Kappungsgrenze-Ansatz wurde bereits am selben Tag durch eine vollstaendige
    Wirtschafts-Simulation ersetzt ("Piraten sollen genau wie Spieler wachsen") - `applyGrowth()`,
    `PIRATE_BASE_GROWTH_*`-Konstanten, `PIRATE_BASE_MAX_*_PER_TYPE` und
    `applyStrengthRebalanceMigration()`/`strengthRebalanced2607` EXISTIEREN NICHT MEHR. Bleibt hier
    nur als historischer Kontext stehen (erklaert, WARUM Punkt 88 die Seed-Werte 60/25/10 etc. als
    Ausgangsbasis uebernommen hat), siehe Punkt 88 fuer den aktuellen Stand.
- Neu: Spionage reaktiviert + Spionagesonden gegen Piratenbasen (Nutzerentscheidung). Die
  Spionage-Forschung war seit Juli 2026 als Platzhalter gesperrt (ihr alter Effekt, Glättung der
  Gegner-Zusammensetzung, war kaum spürbar) - bekommt jetzt einen komplett NEUEN, echten Zweck:
  Detailgrad von Spionageflug-Berichten gegen die 4 `ACTIVE_PIRATE_BASE_IDS`-Basen.
  - **`startResearch()` (`actions.ts`)**: der `techId === 'spionage'`-Block entfernt. Client-seitige
    Sperre ebenfalls entfernt (`Forschung.tsx`, `isSpionage`-Sonderfall aus der `locked`-Berechnung
    raus). Der ALTE Glättungsmechanismus (`generatePiratenFleet()`/`generateDefenseFleet()` in
    `combat.ts`, `spionageLevel`-Parameter) bleibt bewusst UNVERÄNDERT auf fest 0 (siehe
    missions.ts/groupOps.ts/simulator.ts) - hat mit dem neuen Zweck nichts zu tun, keine
    Vermischung der beiden Konzepte.
  - **Neues Schiff `spionagesonde`** (`data/ships.ts`, Tab "Versorgungsschiffe" in `Werft.tsx`):
    unbewaffnet (waffen:0), aus allen Piraten-NPC-Pools ausgeschlossen (`combat.ts`, gleiches Muster
    wie `mining`/`begleitschiff`). `speed`/`fuelConsumption`/`driveType` sind reine Platzhalter -
    fuer echte Spionagefluege irrelevant, siehe naechster Punkt.
  - **Neue Datei `game/spyMissions.ts`**: `startSpyProbe()`/`processSpyMissions()` (analog zu
    `pirateBaseState.ts`s Angriffsfluegen, aber ohne Kampf - Sonde wird nie zerstoert). Flugzeit
    IMMER `SPY_PROBE_TRAVEL_MS` (5 Minuten je Richtung, `galaxyConstants.ts`) statt der normalen
    distanzbasierten Formel - bewusste Abkopplung von `galaxyDurationMs()`. Treibstoff ebenfalls
    FLACH (`SPY_PROBE_FUEL_COST_PER_PROBE=50`/Sonde), nicht distanzbasiert, passend zum
    Flugzeit-Prinzip. Neuer Typ `SpyMissionDeployment` (`types.ts`, strukturell wie
    `PirateAttackDeployment` aber mit `resolved` statt Kampf-Flag), neues `PlayerState.spyMissions`-
    Array.
  - **Detailgrad-Formel** (`buildSpyReportText()`): Stufe 0 zeigt NUR Ressourcen (exakt), keinerlei
    Flotten-/Verteidigungsdaten. Ab Stufe 1 kommt ein BEREICH dazu (`formatRange()`,
    `fuzz=(10-level)/10`, z.B. Stufe 3 → ±70% Streuung), der mit steigender Stufe schrumpft, bis
    Stufe 10 exakt ist (`fuzz=0`). Bericht landet als reiner Text (`pushMessage(..., 'farm', ...)`,
    kein strukturiertes `Detail`-Objekt noetig) unter "Farm-/Beuteberichte".
  - **Piraten spionieren umgekehrt Spieler aus** ("Piraten und KI bots spionieren auch" -
    Nutzerentscheidung): `maybeGeneratePirateSpyReport()` in `spyMissions.ts`, bewusst
    LEICHTGEWICHTIG als periodischer Checkpoint (`PIRATE_SPY_CHECK_INTERVAL_MS`=3h,
    `PIRATE_SPY_CHANCE`=25%, neues `PlayerState.nextPirateSpyCheck`-Feld) statt eines vollen
    Flug-/Ankunfts-Modells wie bei Spieler-Sonden - deckt nur auf, DASS und VON WELCHER
    Piratenbasis-Position aus spioniert wurde, nicht was gesehen wurde (Spieler haben keine eigene
    "Spionage-Abwehr"-Forschung, die einen Detailgrad festlegen koennte). Aufgerufen aus `tick()`
    (`actions.ts`), zusammen mit `processSpyMissions()`.
    **Bugfix (Juli 2026):** die Koordinaten in dieser Nachricht waren reiner Text, ohne Sprung zur
    Galaxie-Position. `GameMessage` hat jetzt ein optionales `galaxyLink?: { system, position }`-
    Feld (unabhaengig von `detail`, da nicht jede Nachricht mit Koordinatenbezug in eines der
    bestehenden Detail-Formate passt) - `pushMessage()` in `messages.ts` nimmt es als 5. Parameter
    entgegen. Die Nachrichten-Tabelle (`MessageTable` in `Nachrichten.tsx`) macht die Zeile
    klickbar (`(Zur Position →)`-Hinweis statt `(Details)`) und navigiert per `useNavigate()` zu
    `/galaxie?system=X`, exakt nach demselben Muster wie der "Zur Position in der Galaxie"-Button
    in `RaidHilfe.tsx`.
  - **KI-Bots spionieren ebenfalls**: `maybeSpyOnPirateBase()` in `bot.ts` (baut bei Bedarf 2
    Sonden nach, schickt dann gelegentlich eine los), exakt nach dem `maybeAttackPirateBase()`-
    Muster.
  - **Client**: "Ausspionieren"-Button neben "Angreifen" auf jeder angreifbaren Basis-Kachel
    (`Galaxie.tsx`), eigener `targetSpyBase`-Zielzustand parallel zu `targetPirateBase` - Panel
    zeigt bei Spionage-Zielen eine FESTE Flugzeit/Treibstoff-Anzeige statt der normalen
    `galaxyPreview()`-API-Anfrage (nicht noetig, da distanzunabhaengig). Neuer Endpunkt
    `POST /galaxy/pirate-base/spy`, `spyProbeTravelMs`/`spyProbeFuelCostPerProbe` neu im
    `/data`-Bundle.
  - Manuell End-to-End getestet (gleicher Testaccount): Forschung Spionage sichtbar entsperrt,
    Spionagesonde baubar, Sondenflug inkl. fixer 5-Minuten-Anzeige und 50-Deuterium-Abzug pro Sonde,
    Bericht bei Stufe 0 (nur Ressourcen, kein Flotten-/Verteidigungshinweis) UND bei Stufe 3 (Bereich
    exakt nach Formel: 20 Leichte Jäger bei 70% Fuzz → "6-34", rechnerisch exakt bestätigt) beide
    verifiziert, Rückflug/erneuter Versand nach Rückkehr funktioniert.
- Nachtrag: Spionageberichte klickbar gemacht wie Kampfberichte (Nutzer-Feedback - erste Version war
  reiner Fließtext ohne Aufklapp-Details). Neuer Typ `SpyReportDetail`/`SpyReportUnitRange`
  (`types.ts`, Server UND Client-Pendant in `client/src/types/game.ts`) statt Text-Zusammenfassung -
  `GameMessage.detail`-Union um `SpyReportDetail` erweitert, `pushMessage()`-Signatur entsprechend.
  `spyMissions.ts` `buildSpyReport()` ersetzt das vorherige `buildSpyReportText()` (liefert jetzt ein
  strukturiertes Objekt statt eines fertigen Strings, die Nachrichten-Kurzzeile zeigt nur noch
  `Spionagebericht Piratenbasis 1:X:Y (Spionage Stufe N)`).
  - **`Nachrichten.tsx`**: `isSpyReportDetail()` MUSS vor `isFarmDetail()` geprüft werden (beide
    Typen haben ein `resources`-Feld, `level`/`baseSystem` sind die einzigen eindeutigen
    Unterscheidungsmerkmale). Neue `SpyRangeTable`-Komponente (gleiches `combat-table`-Muster wie
    `UnitTable`/`RewardTable`) zeigt bei `exact:true` nur einen Wert statt eines Bereichs. Modal-
    Aufbau bewusst analog zu Kampfberichten: Titel + Datum/Stufen-Zeile, Ressourcen-Tabelle, dann
    Flotte/Verteidigung-Tabellen (oder Hinweistext bei Stufe 0, wo beide Arrays leer sind).
  - Erneut End-to-End verifiziert: Bericht in der Liste jetzt mit "(Details)"-Markierung, Modal
    zeigt bei Stufe 3 korrekt gefüllte Flotten-/Verteidigungstabellen mit Bereichsangaben (inkl.
    einer inzwischen durch Basis-Wachstum neu hinzugekommenen Kreuzer-Zeile).
- Neu: Effektivwerte auf Schiffs-/Verteidigungs-Baukarten (Nutzerentscheidung - Karten zeigten
  bisher IMMER nur die reinen Basiswerte aus `ships.ts`/`defenses.ts`, auch wenn Forschung/Klasse/
  Schiffs-Module/Kampf-Booster den tatsächlichen Kampfwert längst verändert hatten). Jetzt z.B.
  "Waffen: 1.500 (3.000)" - Basiswert, und in Klammern der Effektivwert, NUR wenn er vom Basiswert
  abweicht (sonst bleibt nur der Basiswert stehen, um die Karten nicht zuzumüllen).
  - **Neue Funktionen `getEffectiveShipStats()`/`getEffectiveDefenseStats()`** (`lib/combatInfo.ts`)
    spiegeln `server/src/game/combat.ts`s `getEffectiveStats()` 1:1 client-seitig (Forschungs-
    Multiplikatoren, Klassen-Bonus, Schiffs-/Verteidigungs-Module, 24h-Kampf-Booster) - dafür neu
    `waffenMultiplier()`/`panzerungMultiplier()` ergänzt (`schildMultiplier()` gab es schon) und
    `classCombatMultipliers()` (alle drei Werte, im Unterschied zum bestehenden
    `getClassSchildMultiplier()`, der nur für den Kuppel-Pool gedacht ist).
  - **Kuppeln sind ein Sonderfall**: ihr Schild-Beitrag läuft komplett über den gemeinsamen
    Kuppel-Pool (`computeDomeSharedPool()`), der Effektivwert pro Einzelanlage wäre also immer 0 -
    `ShipBuildCard.tsx`/`DefenseBuildCard.tsx` zeigen bei `def.isDome` deshalb bewusst NUR den
    Basiswert für Schild, unabhängig vom (irreführenden) Rückgabewert der Funktion.
  - Manuell verifiziert (Kanonier-Klasse, +100% Waffenschaden): "Waffen: 1.500 (3.000)" bzw.
    "770 (1.540)" bei Verteidigung - exakt der erwartete 2x-Faktor, Schild/Panzerung bleiben
    korrekt ohne Klammer-Zusatz stehen (Kanonier wirkt nur auf Waffen).
  - Nachtrag: Der Imperator wurde beim ersten Durchgang übersehen - er hat in `Spezialschiffe.tsx`
    eine EIGENE Karten-Darstellung (Spezialteile statt normaler Ressourcen, nicht über
    `ShipBuildCard` gerendert), daher ein separates `statDisplay()` dort ergänzt. Salvenschiffe
    waren bereits erfasst (nutzen ganz normal `ShipBuildCard`). Verifiziert: "Waffen: 500.000
    (1.000.000)" bei Kanonier-Klasse.
- Neu: Farbliche Kampfwert-Kennzeichnung + Effektivwerte auch in den Info-Popups (Nutzerentscheidung
  - "Popups und Karten allgemein schöner gestalten, aktuelle Werte hervorheben").
  - **Neue Komponente `components/StatValue.tsx`** ersetzt das vorher an drei Stellen (ShipBuildCard/
    DefenseBuildCard/Spezialschiffe) fast identisch duplizierte `statDisplay()` - ein Icon
    (⚔️/🛡️/🧱) + Basiswert in Typ-Farbe, Effektivwert (falls abweichend) zusätzlich in Grün mit
    Leucht-Effekt (`--accent-deut`, dieselbe "positiv verstärkt"-Farbe wie überall sonst im Spiel:
    Ressourcen-Countup, Bau-Fertigstellungs-Flash).
  - **Neue CSS-Klassen** (`theme.css`): `.stat-waffen` (`--danger-bright`, rot), `.stat-schild`
    (`--accent-kristall`, cyan), `.stat-panzerung` (`--accent-metall`, blaugrau), `.stat-effective`
    (grün, fett, Leucht-Schatten). Label bleibt bewusst gedämpft (`text-dim`) - nur die ZAHL ist
    eingefärbt, damit eine Karte nicht wie ein Warnhinweis wirkt.
  - **Info-Popups bekommen jetzt ebenfalls Waffen/Schild/Panzerung-Zeilen** (`shipInfoRows()`/
    `defenseInfoRows()`/Imperator-Popup in `Spezialschiffe.tsx`) - vorher waren die Kampfwerte NUR
    auf der Karte selbst sichtbar, nicht im Popup.
  - **`modal-title`** bekommt dieselbe rote Akzentlinie wie `#mainbar h2` (konsistente visuelle
    Sprache zwischen Seiten-Überschriften und Popup-Titeln statt schlichtem Fettdruck).
  - Manuell verifiziert (computed styles via `javascript_tool`): `.stat-waffen` → `rgb(255,77,87)`,
    `.stat-schild` → `rgb(76,227,238)`, `.stat-panzerung` → `rgb(185,207,230)`, `.stat-effective` →
    `rgb(82,240,122)`, alle `font-weight:700` - exakt wie in der CSS hinterlegt. Info-Popup zeigt
    Waffen/Schild/Panzerung inkl. Effektivwert-Hervorhebung korrekt an.
- Zeitgutschein-Drop-Chance in Silber/Gold/Elite-Containern erhöht (20/15/10%→38/32/23% Rohwert,
  ~28/22/16% real), Inventar zeigt jetzt die reale statt der rohen Chance (siehe Punkt 106).
- Piratenbasen bekommen eine dauerhaft starke Garnison (~5.300 Schiffe + ~1.120 Verteidigungsanlagen)
  und ein nachkalibriertes Ressourcen-Cap (44M/20M/6M, ~3 Wochen Wachstum); alle vier Booster
  stärker und teurer gemacht, Abbau-Booster-Bugfix (war bisher wirkungslos) (siehe Punkt 107).
- Raid-Umbau: 1x/Woche (Sonntag 0 Uhr) statt 2x/Tag, 24h-Belagerung mit 12 Wellen statt 1h/5 Wellen,
  Belohnung skaliert linear mit jeder gewonnenen Welle (siehe Punkt 108).
- Asteroiden-Feld/Piraten-Sektor/Elite-Bollwerk auf 24h umgestellt, Piraten-Sektor-Kämpfe laufen
  alle 4h statt stündlich, zeitbasierte Teile-/Ressourcen-Zuteilung durch reine Kampf-Belohnung
  ersetzt, neuer Rückruf für laufende Elite-Bollwerk-Expeditionen (siehe Punkt 109).
- Sektor-/Bollwerk-Info-Popups deutlich gekürzt, missionsrelevante Details bleiben erhalten
  (siehe Punkt 110).
