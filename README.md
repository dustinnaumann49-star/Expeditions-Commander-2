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

Deployed-Commit-Hash über `/api/health` + Server-Log sichtbar (`git rev-parse --short HEAD` beim
Start) - hilft bei der Frage "läuft auf dem Server wirklich der neueste Stand?".

## Dateistruktur

```
server/
  .env.example                       Vorlage für lokale .env (JWT_SECRET, PORT, CLIENT_ORIGIN)
  data/                               SQLite-Datenbankdatei liegt hier zur Laufzeit (game.db)

  src/index.ts                       Express-Einstiegspunkt, Routen, interner Heartbeat-Timer
                                      (alle 2 Min.) + öffentlicher /api/heartbeat-Endpunkt
  src/game/heartbeat.ts              runGlobalHeartbeat() - Missionen/Raids/Gruppen-Expeditionen
                                      für ALLE Nutzer unabhängig vom Login, Bot-/Piratenbasen-Turns
  src/game/bot.ts                    KI-Mitspieler (KI-Vega/KI-Nyx): Mitspieler-Interaktion
                                      (Elite-Bollwerk/Halten/Piratenbasis-Angriff+Spionage)
  src/game/economyBotTurn.ts         Wirtschafts-Entscheidungslogik (runEconomyBotTurn()) -
                                      genutzt von bot.ts UND pirateBaseState.ts

  src/db.ts                          SQLite-Zugriff: Nutzer, Spielstände, gemeinsame Operationen
  src/auth/middleware.ts             JWT-Prüfung, aktualisiert last_seen
  src/auth/routes.ts                 Registrierung/Login

  src/game/types.ts                  Alle zentralen TypeScript-Typen
  src/game/state.ts                  Default-Zustand, Laden/Speichern, Migrationen neuer Felder
  src/game/actions.ts                tick(), Bauen/Forschen starten
  src/game/routes.ts                 ALLE API-Endpunkte (/api/game/*)

  src/game/combat.ts                 Kampf-Simulation (RapidFire, Zielerfassung, Präzision,
                                      Ausweichen, Krit, Schild-Regen, Mehrspieler-Variante)
  src/game/combat.worker.ts          Worker-Thread-Skript
  src/game/combatRunner.ts           Worker-Pool-Verwaltung

  src/game/missions.ts               Solo-Missionen: Flotte entsenden, Stunden-Check, Rückkehr
  src/game/raids.ts                  Basis-Raids (Wellen, haltende Galaxie-Flotten)
  src/game/raidReinforce.ts          Liste aktiver Raids zur Navigation
  src/game/galaxy.ts                 Galaxie-Logik: Distanz/Flugzeit/Treibstoff, Positionen,
                                      "Halten", Raid-Verteidigungs-Einbindung, Basis verlegen
  src/game/galaxyPositions.ts        "Ist diese Galaxie-Position frei?" (Spieler/Basen/Sektoren)
  src/game/pirateBaseState.ts        Piratenbasen: Wachstum, Angriff-verarbeiten, Offensiv-KI
  src/game/pirateBaseCombat.ts       Piratenbasen-Kampfrechnung: mitskalierende Garnison, Beute aus
                                      vernichteter Garnison, Wiederaufbau. BEWUSST ohne db-Bezug,
                                      damit Messskripte die echte Rechnung importieren koennen
  src/game/galaxyEvents.ts           Galaxie-Ereignisse (Wrack/Handelskonvoi): Spawn, Bergung
  src/game/groupOps.ts               Multiplayer: Elite-Bollwerk/Piratenadmiral (Einladen/
                                      Rendezvous/Starten, Belohnung)
  src/game/spyMissions.ts            Spionagesonden gegen Piratenbasen, Piraten-Gegenspionage
  src/game/stations.ts               Allianz-Station: Produktion/Kosten/Energie (eigenständig)

  src/game/inventory.ts              Container öffnen, Belohnungen einlösen
  src/game/economyActions.ts         Händler-Tausch, Schrotthändler, Shop (Booster/Gutscheine)
  src/game/classActions.ts           Klassenwahl/-wechsel
  src/game/boosterUtil.ts            isBoosterActive() - abhängigkeitsfrei (Zirkelimport-Vermeidung)
  src/game/presets.ts                Flotten-Vorlagen speichern/löschen
  src/game/simulator.ts              Kampfsimulator: mehrere Durchläufe, verändert nie den Zustand
  src/game/messages.ts               pushMessage()/clearMessages()
  src/game/stats.ts                  Punkteberechnung + Bestenliste

  src/game/data/ships.ts             Schiffsdaten (Werte, Kosten, Bauzeit, Speed, Lore)
  src/game/data/defenses.ts          Verteidigungsanlagen (inkl. Salve-Kanonen, Schildkuppeln)
  src/game/data/defenseModules.ts    Verteidigungs-Module (Waffen/Schild/Panzerung)
  src/game/data/research.ts          Forschungsbaum
  src/game/data/sectors.ts           SEKTOREN, SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL
  src/game/data/economy.ts           Booster, Gutscheine, Container, Raid-Konstanten, Checkpoints,
                                      woechentlicher Event-Kalender (WEEKLY_EVENTS)
  src/game/data/combatConstants.ts   RAPIDFIRE-Tabelle, ZIELERFASSUNG_BASE, MAX_*-Konstanten,
                                      STACK_AGGREGATE_THRESHOLD_BY_TYPE
  src/game/data/galaxyConstants.ts   Galaxie-Größe, Distanz-/Flugzeit-Konstanten, Piratenbasen
  src/game/data/buildings.ts         Gebäudedaten (Minen, Solarkraftwerk, Roboter-/Nanitenfabrik),
                                      seit 05.08.2026 V1/V2/V3 (siehe HOME_TIER_UNLOCK_LEVELS)
  src/game/data/buildingModules.ts   Gebäude-Module
  src/game/data/shipModules.ts       Schiffs-Module (generiert, 13 Schiffe x 4 Module)
  src/game/data/changelog.ts         Spielerlesbare Update-Historie (Im-Spiel-Updates-Seite)
  src/game/data/classes.ts           Kampf-Klassen (Kanonier/Bollwerk/Kommandant)
  src/game/data/economyClasses.ts    Wirtschafts-Klassen (Schmuggler/Ingenieur/Prospektor)
  src/game/data/stationBuildings.ts  Allianz-Stations-Gebäude (V1/V2/V3)
  src/game/data/stationBuildingModules.ts  Allianz-Stations-Module

client/
  vite.config.ts                     Dev-Proxy: /api → localhost:4000
  src/theme.css                      Komplettes Farbschema/Layout
  src/App.tsx                        Routing + Navigation
  src/main.tsx                       React-Einstiegspunkt

  src/context/AuthContext.tsx        Login-Zustand, Token
  src/context/GameContext.tsx        Lädt Spieldaten/-zustand, stellt alle Aktionen bereit
  src/api/client.ts                  Alle fetch()-Aufrufe, Objekt "api"
  src/types/game.ts                  Client-seitige Typen (Spiegel von server/src/game/types.ts)

  src/lib/serverTime.ts              Server-Zeit-Offset (serverNow() statt Date.now())
  src/lib/format.ts                  formatTime()
  src/lib/combatInfo.ts              RapidFire/Präzision/Ausweichen/Krit/Schild-Regen für die UI
  src/lib/multipliers.ts             ALLE Bauzeit-/Forschungszeit-/Produktions-Multiplikatoren -
                                      MUSS bei jeder Zeit-/Ertrags-Anzeige verwendet werden
  src/lib/useGalaxyPreview.ts        Debouncte Distanz-/Flugzeit-Vorschau
  src/lib/useCountUp.ts              Animierter Zahlen-Countup (Ressourcen, Effektivwerte)

  src/components/ResourceBar.tsx     Kopfleiste: Ressourcen, Energie, Uhr, Warn-Badges
  src/components/BuildQueue.tsx      Fortschrittsbalken für Bau-Warteschlangen
  src/components/FleetPresetBar.tsx  Flotten-Vorlagen speichern/übernehmen (Sektor UND Multiplayer)
  src/components/InfoModal.tsx       Popup mit vollem Detailwissen
  src/components/LoreModal.tsx       Popup bei Klick auf Schiffs-/Verteidigungs-/Forschungsnamen
  src/components/ShipBuildCard.tsx / DefenseBuildCard.tsx   Wiederverwendbare Baukarten
  src/components/ShipModuleRow.tsx / DefenseModuleRow.tsx   Module, hängen per Verbindungslinie
                                      direkt unter der jeweiligen Baukarte (kein eigener Tab)
  src/components/StatValue.tsx       Waffen/Schild/Panzerung farbig, inkl. Effektivwert
  src/components/ErrorBoundary.tsx   Fängt Render-Fehler ab statt stillem Absturz
  src/components/PageSkeleton.tsx    Lade-Platzhalter, solange gameData/state noch nicht da sind
  src/components/ProtectedRoute.tsx  Leitet zu /login um, falls nicht angemeldet

  src/pages/Login.tsx                Login/Registrierung
  src/pages/Werft.tsx                Tabs "Schiffe"/"Verteidigung", je nach Klassen unterteilt,
                                      "Spezialschiffe" (Salvenschiffe+Imperator) als Klassen-Tab
  src/pages/Forschung.tsx            Forschungsbaum (4 Untertabs) + Untertab "Gebäude"
  src/pages/Sektor.tsx               Solo-Missionen + Untertab "Kampfsimulator"
  src/pages/Flotte.tsx               Flotten-Bestandsübersicht
  src/pages/Haendler.tsx             Ressourcentausch + Untertab "Schrotthändler"
  src/pages/Shop.tsx                 Booster/Zeit-Gutscheine
  src/pages/Multiplayer.tsx          Elite-Bollwerk + Piratenadmiral, Untertabs "Raid-Hilfe"/"Spieler"
  src/pages/Allianz.tsx              Allianz gründen/einladen, Allianz-Station bauen
  src/pages/Galaxie.tsx              System-Browser, Positionsraster, Flotte "halten", Übersicht
  src/pages/Nachrichten.tsx          Kampf-/Farmberichte mit aufklappbarer Detailansicht
  src/pages/Inventar.tsx             Container öffnen, Belohnungen einlösen
  src/pages/Klasse.tsx               Klassenwahl/-wechsel - auch als blockierende Pflicht-Ansicht
                                      in App.tsx, solange state.playerClass === null
  src/pages/Updates.tsx              Spielerlesbare Update-Historie
  src/pages/Statistik.tsx            Statistik-Aufschlüsselung + Bestenliste
  src/pages/Debug.tsx                Voller Zustand von KI-Bots/Piratenbasen (Beobachtungs-Tool)
```

## Wichtige Punkte, die eingehalten werden müssen

Referenz für aktuelles Verhalten, keine Chronologie mehr (siehe `git log` für Historie). Ehemals
nummeriert - Code-Kommentare mit "siehe README Punkt N" können nach der Kürzung leicht abweichen,
per Stichwort-Suche in dieser Datei trotzdem auffindbar.

### Architektur-Grundregeln

- Jede neue Zeit-/Ertrags-Anzeige im Frontend **MUSS `multipliers.ts` verwenden**, sonst zeigt die
  UI falsche Werte bei aktiver Forschung/Boostern/Modulen.
- Jede neue Kampf-Berechnung **MUSS über `combatRunner.ts` laufen** (`runCombatInWorker`/
  `runMultiOwnerCombatInWorker`), niemals `resolveCombat` direkt im Haupt-Thread. Wiederverwendeter
  Worker-Pool (`POOL_SIZE = 1` - siehe Performance-Abschnitt) statt Neuerzeugung pro Kampf.
- An `OwnedFleetContribution`-Objekte (Mehrspieler-Kampf) **niemals Funktionen übergeben**, nur
  reine Daten - lassen sich nicht an einen Worker-Thread übergeben.
- Bei Cross-User-Aktionen während des eigenen `tick()`/Heartbeats: bereits geladenes `PlayerState`
  eines betroffenen Nutzers **wiederverwenden**, niemals erneut laden, falls er der aktive Nutzer
  ist (`p.userId === currentState.userId ? currentState : loadPlayerState(p.userId)`).
- Mehrspieler-Belohnungen werden **nie geteilt** - jeder bekommt exakt das, was er auch solo mit
  demselben Kampfausgang bekommen hätte.
- Jeder Mehrspieler-Kampfbericht ist aufklappbar, gruppiert nach Spielername (`ownerUsername`).
- Elite-Bollwerk (`piraten_elite`) und Piratenadmiral (`piraten_admiral`) sind die einzigen
  Missionen für gemeinsame Expeditionen, alle anderen Sektoren bleiben Solo.
- **Welche Schiffstypen in eine Gruppen-Operation dürfen, entscheidet EINE Funktion:**
  `allowedShipIdsForOperation()` in `groupOps.ts`, geprüft über `checkShipsAllowed()` in BEIDEN
  Pfaden (Operation anlegen und Einladung annehmen). P10 = `ADMIRAL_ALLOWED_SHIP_IDS`, P9 =
  Kampfschiffe + Imperator, Notruf-Events = nur Kampfschiffe - identisch zu `availableIds` im
  Client. Bis 18.08.2026 gab es serverseitig NUR die P10-Regel, und die stand als kopierter Block
  zweimal im File; für P9 fehlte sie ganz. Unerreichbar war das nur, solange die Auswahl im Client
  immer leer startete - mit den Flotten-Vorlagen (siehe Frontend-Konventionen) wäre es erreichbar
  geworden.
- `npm run dev` im Server startet `tsc --watch` + `tsx watch` parallel - der Worker-Thread braucht
  immer die kompilierte `dist/`-Version, auch im Dev-Modus.
- Neue Server-Routen → `routes.ts`, neue Client-API-Aufrufe → `api/client.ts` + `GameContext.tsx`,
  neue Seiten → `App.tsx` (Route + Nav).
- Sidebar bewusst schlank: Schrotthändler/Spezialteile/Gebäude/Raid-Hilfe sind Untertabs statt
  eigener Nav-Punkte - vor neuen Seiten erst prüfen, ob sie als Untertab passen.
- Online-Status: `requireAuth` aktualisiert `last_seen` bei jeder Anfrage, "Online" = letzte
  Anfrage vor < 15s (`ONLINE_THRESHOLD_MS`).
- Info-Popups statt vollgepackter Karten (`InfoModal`) - Karten zeigen nur Kernwerte.
- Alle Popups rendern per `createPortal(..., document.body)`, nie inline - sonst geraten sie unter
  die Ressourcenleiste (`#mainbar`s `backdrop-filter`-Stacking-Context).

### Zeitgesteuerte Systeme

- Kein eigener Dauerprozess für Spiellogik - zwei Schienen: `tick()` (bei jeder Nutzer-Anfrage,
  rechnet eigenen Zustand + Raid-Spawn/-Auflösung + Gruppen-Expeditionen für ALLE anderen Nutzer
  hoch) und `runGlobalHeartbeat()` (`heartbeat.ts`, intern alle 2 Min. via `setInterval`). Ein
  einziger aktiver Spieler reicht, das Spiel für alle weiterlaufen zu lassen.
- Jeder Cross-User-Sweep verarbeitet jeden Nutzer/jede Operation einzeln in `try/catch` - eine
  Ausnahme bei einem Nutzer darf die übrigen nie blockieren.
- Feste Check-Zeitpunkte in deutscher Ortszeit (`nextFixedCheckpoint()`/`rollFixedCheckpoints()`
  bzw. `nextWeeklyCheckpoint()`/`rollWeeklyCheckpoints()` für wöchentliche, `economy.ts`,
  Sommer-/Winterzeit automatisch). Beim Prüfen immer zuerst testen, ob der GESPEICHERTE Wert
  fällig ist, bevor er weitergerückt wird.
- Raid-Zeiten sind fest und pro Spieler hinterlegt (`RAID_SCHEDULE_BY_USERNAME` in `economy.ts`):
  seit 05.08.2026 2x/Woche (Mittwoch + Sonntag, jeweils 0 Uhr deutscher Zeit, siehe
  Event-Kalender unten), garantiert (Chance 1.0) für beide bekannten Nutzernamen. Unbekannte Namen
  fallen auf den allgemeinen Rhythmus mit `RAID_SPAWN_CHANCE` zurück. `RaidScheduleSpec` ist jetzt
  ein ARRAY pro Nutzer (`nextWeeklyCheckpoint()`/`rollWeeklyCheckpoints()` in `economy.ts` wählen
  jeweils den frühesten Checkpoint über alle Einträge) - kein neues `PlayerState`-Feld nötig,
  `state.nextRaidCheck` bleibt ein einzelner Zeitstempel für den jeweils nächsten Termin.
- Globale Warn-Hinweise für laufende Raids in `ResourceBar.tsx` (`.alert-badge`), Klick führt per
  Query-Parameter direkt zum passenden Tab.
- **Wöchentlicher Event-Kalender** (05.08.2026, Nutzerentscheidung): automatische, KOSTENLOSE
  Bonus-Tage für ALLE Spieler gleichzeitig - im Unterschied zu den gekauften Boostern
  (`isBoosterActive()`/`state.activeBoosters`) braucht das KEINEN Speicherzustand, der aktive
  Zustand ergibt sich rein aus der aktuellen Berliner Uhrzeit (`berlinWeekday()`/
  `isWeeklyEventActive()`/`WEEKLY_EVENTS` in `economy.ts`, Client-Mirror in `lib/multipliers.ts`
  mit `serverNow()` statt `Date.now()`). Gilt automatisch für den vollen Kalendertag
  (00:00-24:00), endet von selbst beim Tageswechsel:
  - Montag + Freitag: +100% Belohnung im Solo-Piraten-Sektor (Niedrig/Mittel/Hoch) -
    verdoppelt den linearen `mission.combatWins`-Zähler (siehe `missions.ts`), bewusst NICHT
    Elite-Bollwerk/Piratenadmiral (die nutzen eine exponentielle Serien-Eskalation, siehe
    `REWARD_ESCALATION` - ein zusätzliches x2 dort hätte dasselbe Explosions-Risiko wie die
    ursprünglich fehlgeschlagene lootBase-Vervierfachung beim Elite-Bollwerk, siehe oben).
  - Dienstag + Donnerstag: +100% Ressourcen im Asteroiden-Feld (`ASTEROID_EVENT_MULTIPLIER` in
    `miningMultiplier()`, `missions.ts`) - NUR Asteroiden-Feld-Missionen, nicht die
    Heimatbasis-Minen.
  - Mittwoch + Sonntag: Raid-Event (siehe oben, echtes 2. wöchentliches Vorkommen).
  - Samstag: kostenloser Bauzeit-Bonus (`WEEKLY_BAUZEIT_EVENT_FACTOR = 0.75`, -25%) für
    Schiffe/Verteidigung/Gebäude (`baseTimeMultiplier()`) UND Forschung
    (`researchTimeMultiplier()`) - bewusst schwächer als der gekaufte bautempo-/
    forschungstempo-Booster (-65%), damit sich ein Kauf weiterhin lohnt.
  - Anzeige: `WeeklyEventBanner.tsx` (Sektor-/Shop-Seite) zeigt den/die heute aktiven Event(s) an.
  - Korrektur 06.08.2026 (Nutzer-Fund): die Sektor-Karten zeigten fest den Basiswert
    (`farmRate`/`winContainer.count`) an, auch wenn ein Bonus aktiv war - Nutzer fragte, ob der
    tatsächlich geltende Wert stattdessen live angezeigt werden könnte, inklusive ALLER Faktoren
    (Forschung/Wirtschafts-Klasse/Frischling-Bonus/Event), nicht nur des Event-Bonus. `Sektor.tsx`
    zeigt jetzt zusätzlich eine "⚡ Aktuell:"-Zeile mit dem live berechneten Wert
    (`getMiningMultiplier(state, gameData)` in `lib/multipliers.ts`, jetzt inkl. Frischling-Bonus -
    vorher nur Forschung/Klasse/Event) bzw. der event-angepassten Container-Anzahl.

### Kampfsystem

- Feindstärke skaliert ausschließlich auf Basiswerten der Schiffe/Verteidigung, NIE auf
  Spieler-Forschung (`combatFleetPowerBase()`) - Piraten/Raids/Multiplayer-Sektoren profitieren
  nicht davon. Eigene Kampfleistung bleibt regulär forschungsabhängig.
- Piraten/NPCs bekommen `PIRATE_RESEARCH_SHARE` (aktuell 100%) der Forschungseffekte
  (`computePirateResearch()` in `combat.ts`) - bei Mehrspieler-Kämpfen (Elite-Bollwerk, Raid mit
  Verstärkung) das MINIMUM aller Beteiligten pro Forschungs-Zweig (Korrektur 05.08.2026, vorher
  Durchschnitt - siehe Kampfsystem-Historie unten). Klassen-Bonus/Module/Kampf-Booster bleiben
  exklusiv beim Spieler.
- Gestaffelter Einzelschiff-Rückzug (`UNIT_RETREAT_THRESHOLD = 0.3`): jedes Schiff auf Seite A
  entscheidet einzeln anhand seines eigenen HP-Anteils, kein Alles-oder-Nichts mehr. Gilt NICHT für
  Heimverteidigung bei Raids (`allowRetreat:false`). `result.retreated` ist NICHT mehr automatisch
  exklusiv zu "alle Gegner vernichtet" - Auswertungscode muss zusätzlich prüfen, ob der Gegner
  wirklich noch lebt.
- RapidFire folgt einer 1:1-Rollenverteilung (`RAPIDFIRE`-Tabelle), keine Häufung auf einzelne
  Klassen; Salvenschiffe sind komplett RF-immun. NPC-RF gegen `leicht`/`schwer` ist halbiert
  (`NPC_RF_VS_JAEGER_FACTOR = 0.5`), damit eigene Jäger nicht unabhängig von der Stückzahl fast
  immer zuerst sterben.
- RapidFire-Neuordnung (Nutzerentscheidung 04.08.2026, `combatConstants.ts`): saubere
  Stein-Schere-Papier-Kette der Standard-Kampfschiffe (Schwerer Jäger → Leichter Jäger, Kreuzer →
  Schwerer Jäger, Schlachtschiff → Kreuzer, Schlachtkreuzer → Schlachtschiff, Zerstörer →
  Schlachtkreuzer, Reaper → Zerstörer), ersetzt die vorherigen überlappenden Mehrfachziele.
  Begleitschiff komplett aus `RAPIDFIRE` entfernt (Versorgungsrolle, kein militärisches RF mehr).
  Bomber bleibt Bunkerbrecher, aber nur noch gegen Raketenwerfer/Leichtes/Schweres Lasergeschütz
  (Ionengeschütz/Gausskanone/Plasmawerfer entfernt). Spezialschiffe/-verteidigung behalten ihre
  Mehrfachziel-Sonderrechte unverändert.
- Größenklassen-Ausweichbonus (`SHIP_SIZE_CLASS`/`SIZE_MISMATCH_EVASION_BONUS`): Jäger bekommen
  +45, Kreuzer +18 Prozentpunkte Ausweichchance gegen große/Elite-/Spezialschiffe (nicht
  umgekehrt) - gibt kleinen Schiffen eine Tank-/Ausweich-Rolle statt reiner Bedeutungslosigkeit.
- Durchschlag (Overkill) auf 50% Maximalwert gedeckelt (`effectPerLevel` in `research.ts`), sonst
  könnte ein Treffer bis zu 5 Schiffe desselben Typs auf einmal vernichten (`MAX_CASCADE = 5`).
- Verteidigungsanlagen-Waffenwerte an Schiffs-Kosteneffizienz gekoppelt. Sie zählen zu 30 % in die
  Raid-Feindstärke ein (`RAID_DEFENSE_POWER_WEIGHT = 0.3` in `raids.ts`), kämpfen aber zu 100 % mit
  - zähere Verteidigung beschwört also nur anteilig stärkere Angreifer herauf. **Korrigiert
    18.08.2026:** hier stand vorher "zählen NICHT ein", das war falsch. Gemessen bindet dieses
  Gewicht ohnehin kaum (0,3 auf 0,6 bewegt den Raid um einen Prozentpunkt), weil die Anlagen
  gegenüber der Flotte zu wenig Macht stellen.
- **Kostenband der Schiffe (Stand 18.08.2026, nach Entscheidung 6):** 59 bis 90 Wert-Einheiten je
  Waffenpunkt, vorher 68 bis 133. Die Verteidigungsanlagen liegen bei rund 65 und sind damit
  relativ etwas stärker geworden. Bei künftigen Balance-Änderungen an einzelnen
  Verteidigungswerten diese Relation im Auge behalten, statt Werte isoliert zu ändern.
- Schildkuppeln bilden einen gemeinsamen Pool (`computeDomeSharedPool()`) statt Pro-Einheit-
  Verteilung - fängt Schaden für die GESAMTE Verteidigungsseite ab, bevor eine Anlage getroffen
  wird. Wendet Forschung, Klassen-Bonus, Kampf-Booster UND Schild-Module an wie jede andere Anlage.
- Drei Salvenschiffe + zwei Salve-Verteidigungsanlagen (`MULTI_TARGET_VOLLEY_SHIPS`) treffen bei
  Zielerfassung jeden präsenten anfälligen Typ - extreme Waffenwerte, wenig Schild/Panzerung,
  RF-immun. MÜSSEN aus jeder Piraten-/NPC-Flottengenerierung ausgeschlossen werden.
- Kampf-Statistiken sind besitzer-bewusst indiziert (`` `${ownerKey}:${typeId}` ``), sonst zeigen
  zwei Teilnehmer mit demselben Schiffstyp identische aggregierte Werte. Gilt auch für den
  Aggregat-Schützen-Pfad (`fireShotsAggregateShooters()`) - dort MUSS `aggStatKey(stack)` statt
  `stack.typeId` verwendet werden, sonst landen `shotsFired`/`hits`/`crits`/`dmgDealt` unter dem
  falschen Schlüssel und zeigen im Kampfbericht 0 an (Fix vom 03.08.2026).
- Präzision/Schild-Regen sind größenabhängig (kleine Schiffe treffen besser, laden schlechter).
- Schild-Regeneration auf klassenspezifische Basiswerte umgestellt (Nutzerentscheidung 04.08.2026,
  `SHIELD_REGEN_BASE_BY_CLASS` in `combatConstants.ts`, löst die vorherige globale Pauschale
  `SHIELD_REGEN_BASE` + additiven `SHIELD_REGEN_MODIFIER` ab): Jäger-Klasse 5%, Kreuzer-Klasse 15%,
  Elite-Klasse 35%, Spezialschiffe/Imperator 65% Basiswert, jeweils PLUS Forschungsbonus
  (`schildregeneration.effectPerLevel` in `research.ts`, 1,5%/Stufe, max. Stufe 10 = +15%).
  `SHIELD_REGEN_MAX` (globaler Deckel) auf 0.80 angehoben - greift dadurch praktisch nur noch bei
  der obersten Klasse (65%+15% = exakt 80%), alle anderen Klassen liegen deutlich darunter.
  Korrektur 05.08.2026 (Nutzer-Fund): Verteidigungsanlagen sassen ursprünglich PAUSCHAL alle auf
  Spezialschiff-Niveau (65%), unabhängig vom Anlagen-Tier - dadurch regenerierte selbst der
  billigste Raketenwerfer seinen Schild genauso schnell wie der teuerste Plasmawerfer. Jetzt
  analog zu Schiffen gestaffelt: Raketenwerfer/Leichtes Lasergeschütz 5% (Jäger-Niveau), Schweres
  Lasergeschütz/Sentinel-Kanone 15% (Kreuzer-Niveau), Ionengeschütz/Gauß-Kanone 35% (Elite-Niveau),
  Plasmawerfer/Ultimate-Kanone bleiben bei 65% (Spezial-Niveau). Schildkuppeln (eigener Pool,
  `SHIELD_REGEN_DEFAULT_BASE`) bewusst unverändert. Simulation mit echten Elite-Bollwerk-
  Kampfdaten zeigte danach aber nur einen kleinen Effekt (der größte NPC-Verteidigungs-Stapel ging
  von 0% auf ø 13% Verlust, der Rest blieb bei 0%) - der eigentliche Haupttreiber war die schiere
  Menge an gespawnter NPC-Verteidigung (siehe `defenseFactor`-Korrektur weiter unten).
- Kritischer Schaden ebenfalls klassenabhängig gestaffelt (Nutzerentscheidung 04.08.2026,
  `CRIT_DAMAGE_MULTIPLIER_BY_CLASS`/`getCritDamageMultiplier()` in `combat.ts`, löst den vorherigen
  starren globalen `CRIT_DAMAGE_MULTIPLIER = 2` ab): Jäger 1,5-2x, Kreuzer-Klasse 2-2,5x,
  Elite-Klasse 3x, Spezialschiffe/Imperator 3,5-4x. Die Krit-CHANCE (`CRIT_CHANCE_BASE`) ist davon
  unberührt. Verteidigungsanlagen wurden analog zu ihrer `CRIT_CHANCE_BASE`-Stärke eingeordnet.
- Kampfbericht führt `dmgDealt` und `dmgTaken` getrennt - eine niedrige "erlitten"-Zahl ist starke,
  nicht schwache Feuerkraft.
- Wellen-Vielfalt: drei Zusammensetzungs-Profile (`pickWaveProfile()`), Wellen-Ausreißer, seltene
  Kampf-Modifikatoren (Nebel/Ionensturm/usw.) - nie vorher in der UI angekündigt.
- Kampfsimulator (`simulator.ts`, `/game/simulate`) verändert NIE den Spielstand, nutzt aber
  exakt dieselbe Engine wie der echte Ablauf und erlaubt auch nicht besessene Schiffe.
- Bonus-Aufschlüsselung (Nutzerentscheidung 04.08.2026, `StatValue.tsx`/`getShipStatBreakdown()`/
  `getDefenseStatBreakdown()` in `combatInfo.ts`): Hover (Desktop) oder Tap (Mobil, kein Hover
  verfügbar) auf den grünen Effektivwert einer Waffen-/Schild-/Panzerungs-Zeile zeigt ein Popover
  mit den einzelnen aktiven Boni (Forschung, Klassen-Bonus, Schiffs-/Verteidigungs-Modul,
  Kampf-Booster) samt jeweiligem Prozentsatz - Boni mit 0/neutralem Effekt werden nicht gelistet.
  Popover schließt sich bei Klick/Tap außerhalb (`document`-Listener in `StatValue.tsx`, da Mobil
  kein `MouseLeave` hat). Dabei auffiel und mitbehoben: `combatInfo.ts` hatte den Kampf-Booster-
  Multiplikator noch mit dem alten Wert `1.2` hartcodiert (drei Stellen: `getEffectiveShipStats()`/
  `getEffectiveDefenseStats()`/`computeDomeSharedPool()`), obwohl er serverseitig am 28.07.2026 auf
  `KAMPF_BOOST_MULTIPLIER = 1.35` angehoben wurde (`data/economy.ts`) - der Client zeigte dadurch
  bei aktivem Kampf-Booster einen zu NIEDRIGEN Effektivwert an (reiner Anzeigefehler, der
  tatsächliche Kampf lief serverseitig immer korrekt mit 1.35). Jetzt wird `KAMPF_BOOST_MULTIPLIER`
  über `/game/data` als `gameData.kampfBoostMultiplier` an den Client durchgereicht statt dort ein
  zweites Mal hartcodiert zu werden - verhindert dasselbe Auseinanderlaufen bei künftigen
  Balance-Anpassungen dieser Konstante.
  **Nachtrag (Bugfix noch am selben Tag, Nutzer-Fund):** das Popover war urspruenglich ein
  normales, absolut positioniertes Kind-Element innerhalb der jeweiligen `.ship-card`. `.ship-card`
  hat aber `overflow:hidden` (noetig fuer die abgerundeten Bild-Ecken UND den Hover-Zoom-Effekt des
  Karten-Bilds) - bei weiter rechts stehenden Stats (Panzerung ist ueblicherweise der dritte/rechte
  Wert der Zeile, mit wenig Platz bis zum rechten Kartenrand) ragte das Popover ueber den Rand
  hinaus und wurde dadurch fast komplett unsichtbar ("verschwindet"). Behoben durch ein
  React-Portal (`createPortal`, direkt nach `<body>` gerendert, `position:fixed` mit per
  `getBoundingClientRect()` berechneter Position) - das Popover ist dadurch komplett unabhaengig
  von jedem `overflow:hidden` einer Elternkarte. Zusaetzlich eine kurze Schliess-Verzoegerung
  (150ms, `scheduleClose()`/`cancelClose()`) beim Wechsel von Trigger zu Popover, da beide jetzt
  getrennte DOM-Teilbaeume sind und ein sofortiges `mouseleave` beim Ueberqueren der Luecke
  dazwischen das Popover sonst faelschlich geschlossen haette.
- `loadPlayerState()` migriert fehlende Felder in bestehenden Spielständen automatisch
  (`state.ts`) - bei jedem neuen `PlayerState`-Feld hier eine Migrationszeile ergänzen.

### Performance: Kampf-Engine für sehr große Flotten

- **Stack-basierte Aggregat-Simulation**: Stapel eines Typs bis zur jeweiligen Schwelle
  (`STACK_AGGREGATE_THRESHOLD_BY_TYPE` in `combatConstants.ts`, pro Schiffs-/Verteidigungsklasse
  gestaffelt - Jäger 500, Kreuzer-Klasse 100, Elite-Klasse 50, Verteidigung ohne `maxCount` 100,
  Rest Default 2.000) laufen exakt wie bisher (Einzelschiff-Objekte). Darüber wird ein Stapel als
  EIN `AggregateStack`-Objekt behandelt (Pool aus Gesamt-Schild/-HP), inkl. gewichteter
  Ziel-Auswahl und Erwartungswert-basiertem Schuss-Sampling statt Schuss-für-Schuss-Loop.
  Rückzug läuft über eine RAMPE (`retreatedHpPool`), nicht binär - verhindert massive Verluste
  durch verzögerten Rückzug bei riesigen Stapeln.
- Rechenzeit hängt seit dieser Engine nur noch von der ANZAHL VERSCHIEDENER TYPEN ab (max. 15),
  nicht von der Gesamt-Stückzahl - bestätigt bis 1,5 Mio. Schiffen bei ~26ms.
- RapidFire-Zielpool nutzt Typ-Buckets (`AliveTargetsByType`) statt Neu-Filtern der gesamten
  Zielliste pro Schuss - war der dominante Kostenfaktor bei großen Einzelschiff-Flotten.
- `POOL_SIZE` in `combatRunner.ts` steht auf 1 - bestimmt NICHT die Geschwindigkeit eines
  einzelnen Kampfs (läuft ohnehin auf einem Kern), nur wie viele VERSCHIEDENE Kämpfe gleichzeitig
  parallel laufen dürfen. Deckelt die maximale CPU-Last technisch auf einen Kern, weitere
  Anfragen werden über `waitQueue` serialisiert.
- `MISSION_HOURLY_CATCHUP_CAP` (`economy.ts`) deckelt pro `tickMission()`-Aufruf nachgeholte
  Stunden-Checks - ein größerer Rückstand (z.B. nach Downtime) verteilt sich über mehrere
  Durchläufe statt alles auf einmal zu erzwingen.
- Diagnose-Logs bleiben aktiv (`heartbeat.ts`/`routes.ts`): loggen nur bei ungewöhnlicher Dauer
  (>500ms Nutzer, >1s Phase, >3s Heartbeat gesamt), Zeilen enthalten "langsam"/"dauerte" -
  Suchbegriff für Coolify-Logs bei künftigen CPU-Vorfällen.

### Sektoren, Missionen, Belohnungen

- Asteroiden-Felder/Piraten-Sektoren (Solo, Elite-Bollwerk, Piratenadmiral) laufen 24h. Piraten-
  Sektor-Kämpfe checken alle 4h (`PIRATEN_CHECK_INTERVAL_MS`, 6 Checks/Mission).
- Alle Sektor-Kämpfe sammeln sich in `mission.skirmishLog` statt sofort einzelne Nachrichten zu
  verschicken - EIN gemeinsamer Bericht bei Rückkehr, jeder Check aufklappbar. Raids nutzen
  dasselbe Prinzip über `RaidState.waveLog`. Elite-Bollwerk/Piratenadmiral NICHT - deren Berichte
  bleiben pro Check einzeln.
- **Die Einzelkämpfe tragen KEINE eigenen Ergebnistabellen mehr (16.08.2026).** Sie stehen einmal
  je Bericht in `FarmDetail`/`CombatDetail` (`npcResults`/`playerResults`), aufsummiert über alle
  Kämpfe; pro Einzelkampf bleiben Ausgangstext, Rundenzahl, Beute und Replay. Anlass: gemessen über
  die Startup-Ausgabe `[Spielstand-Felder]` waren **998,6 KB von 1477,6 KB eines Spielstands allein
  Skirmish-Blöcke** - eine 24h-Asteroiden-Mission mit stündlichem Kontakt trug bis zu 24
  Tabellenpaare in EINER Nachricht (~170 KB). Die Replays waren mit 64,8 KB NICHT das Problem.
  Das schlug doppelt durch, weil `processOverdueRaidsForOtherUsers()` bei jedem `tick()` die
  vollständigen Spielstände aller anderen Nutzer lädt und bei aktivem Raid auch speichert.
  **Zwei Summierungs-Regeln, siehe `mergeUnitResults()` in `messages.ts`:** NPC-Stückzahlen werden
  addiert (jede Stunde/Welle bringt frische Gegner), auf Spielerseite dagegen stammt die entsandte
  Menge aus dem ERSTEN und die überlebende aus dem LETZTEN Kampf - sonst wiese eine 24h-Mission die
  24-fache Flotte aus. `loadPlayerState()` faltet bestehende Berichte beim nächsten Laden einmalig
  nach (verlustfrei, idempotent). Gemessen an einem 24-Kontakte-Bericht: 151,5 KB auf 40,1 KB.
  **Lehre: die Sammel-Entscheidung hat Nachrichten-ANZAHL gegen Nachrichten-GRÖSSE getauscht, und
  die Größe hat niemand nachgemessen.**
- **Bugfix (Nutzer-Fund 04.08.2026): `processMissions()` bekam Fehler-Isolation pro Mission.**
  Bisher lief `processMissions()` (missions.ts) OHNE try/catch pro Mission - eine Exception
  IRGENDWO in `tickMission()` (z.B. im Kampf-Worker bei einem Check, der die komplette
  verbleibende Flotte in einem Schlag ausloescht) warf den GESAMTEN Tick ab, BEVOR
  `savePlayerState()` erreicht wurde. Da `mission.ships`/gepushte Nachrichten/`skirmishLog`-
  Eintraege bis dahin nur im Speicher standen, gingen sie beim naechsten Laden wieder verloren -
  konkret gemeldet als "komplette Flotte im Piraten-Sektor Hoch verloren, aber KEINE Nachricht
  erhalten". Jetzt analog zu den anderen Cross-User-Sweeps (`processAllDepartedGroupOperations()`
  in groupOps.ts, raids.ts, events.ts, heartbeat.ts) mit try/catch pro Mission isoliert - ein
  Fehler bei einer Mission reisst weder andere Missionen desselben Nutzers noch den Rest von
  `tick()` mit, UND wird jetzt geloggt (`processMissions: Fehler bei Mission ...`) statt komplett
  spurlos zu verschwinden. Die eigentliche Ursache des urspruenglichen Crashs ist damit noch nicht
  gefunden (keine Server-Logs vom Vorfall verfuegbar) - beim naechsten Auftreten sollte die
  Fehlermeldung jetzt aber in den Coolify-Logs auftauchen und die Root-Cause-Suche ermoeglichen.
- Piraten-Sektor Solo (Niedrig/Mittel/Hoch): nur EINE Stufe gleichzeitig beflogbar (serverseitig
  UND clientseitig geblockt). Container-Belohnung (`winContainer` in `SektorConfig`) pro
  gewonnenem Check (`Mission.combatWins`), ausgezahlt erst bei Rückkehr - kein `lootBase` mehr.
  Seit 04.08.2026 zusätzlich ein festes `winResources`-Ressourcenpaket pro gewonnenem Check
  (Niedrig 800k/500k/200k, Mittel 2M/1,2M/600k, Hoch 5M/3M/1,5M Metall/Kristall/Deuterium,
  `finalizeMission()` in `missions.ts`) - Ausgleich für die durch das 50/30/20-System (siehe unten)
  gestiegene Feindstärke dieser Stufen. Sandronator (x2) wirkt automatisch auch hier, da beide
  Belohnungen an `Mission.combatWins` hängen.
- Feindstärke der Piraten-Sektoren/Elite-Bollwerk/Raids folgt seit 04.08.2026 einem festen
  50/30/20-Zufallsprinzip statt Gleichverteilung (`pick503020()`/`rollMultiplierWithOutlier()` in
  `combat.ts`): jeder einzelne Kampf-Check würfelt mit 50%/30%/20%-Gewichtung einen von drei
  Tabellenwerten (`PIRATEN_MULTIPLIER_ROLL` in `sectors.ts`, `RAID_WAVE_ROLL` in `economy.ts`,
  ersetzt die alte 12-Wellen-Eskalationskurve `RAID_WAVE_FACTORS`). Der dritte Bucket kann eine
  Spanne `[min, max]` sein, wird dann gleichverteilt darin gewürfelt. Der Piratenadmiral (P10) ist
  bewusst ausgenommen (`contextKey === 'piraten_admiral'` bleibt bei alter Gleichverteilung, eigene
  Boss-Mechanik). Korrektur 05.08.2026 (Nutzer-Fund): der Kampfbericht zeigte bisher bei
  `piraten_niedrig/mittel/hoch` und `piraten_elite` IMMER nur "Normale Welle" an, egal welcher der
  drei 50/30/20-Werte tatsächlich gewürfelt wurde - der separate Ausreißer-Wurf steht bei allen
  `piraten_*`-Kontexten auf 0% (siehe unten), lieferte also nie ein unterscheidbares Label. Berichte
  (Piraten-Sektor-Skirmish in `missions.ts`, Elite-Bollwerk-Check und Piratenadmiral-Check in
  `groupOps.ts`, Raid-Welle in `raids.ts`) zeigen jetzt stattdessen die tatsächlich angewendete
  Feindstärke in Prozent der eigenen (Kombinat-)Flottenmacht an (z.B. `[Feindstärke 155%]`) -
  dadurch im Nachhinein nachvollziehbar, ob ein schlechtes Ergebnis am oberen 20%-Bucket lag oder
  nicht. Der alte separate `WAVE_OUTLIER_CHANCE`-Ausreißer-Wurf wurde für alle
  `piraten_*`-Sektoren auf 0 gesetzt (würde sich sonst mit dem neuen 20%-Extrem-Bucket
  überschneiden), für `raid` unverändert gelassen (dort ohnehin nie aktiv genutzt).
- Korrektur 05.08.2026 (Nutzerentscheidung): das 04.08.2026-Update hatte `piraten_hoch` (150-200%)
  und `piraten_elite` (130-250%) ungetestet zu hart angesetzt - Simulation über `simulateCombat()`
  (`simulator.ts`) zeigte selbst bei komplett maximierter Forschung/Modulen nur 0-25% Siegchance bei
  ø 67-97% Flottenverlust, was zu ungewollten Totalverlusten führte (konkreter Fall: komplette
  Flotte im Piraten-Sektor Hoch solo verloren). Ein reines Zurücksetzen auf den Vor-Update-Stand
  reichte NICHT (die RapidFire-/Krit-/Schild-Regen-Änderungen desselben Commits machten die
  Sektoren zusätzlich zur Tabelle härter) - beide Tabellen mussten unter den Vor-Update-Stand
  gesenkt werden: `piraten_hoch` auf `[0.70, 0.95, 0.95-1.20]`, `piraten_elite` auf
  `[0.90, 1.20, 1.55]` (bleibt bewusst etwas härter als Hoch, da Top-Stufe mit garantierten
  Containern + bis zu 64x Perfect-Streak-Bonus). Dabei zunächst übersehen (Nutzer-Fund): die
  abgesenkte `piraten_hoch`-Tabelle lag danach UNTER der unveränderten `piraten_mittel`-Tabelle
  (`[0.80, 1.10, 1.40]`) - die Härte-Reihenfolge Niedrig < Mittel < Hoch < Elite war dadurch
  gebrochen. Ebenfalls im selben Aufwasch korrigiert: `piraten_niedrig` auf `[0.35, 0.50, 0.65]`
  und `piraten_mittel` auf `[0.55, 0.75, 0.90]` gesenkt, damit jede Stufe wieder strikt unter der
  naechsthoeheren liegt. Simulierte Endwerte: Niedrig praktisch risikofrei in jeder Ausbaustufe
  (ø 0-1% Verlust), Mittel gut machbar (67-100% Siegchance), Hoch fordernd (0% Siegchance ohne
  Ausbau, 67% bei Max-Ausbau), Elite bleibt die haerteste Stufe (0% ohne Ausbau, 42% bei Max-Ausbau,
  vereinzelt Totalverlust moeglich). Elite-Bollwerk-Besonderheit zunächst unverändert belassen
  (Piraten bekamen den GRUPPEN-DURCHSCHNITT der Forschung aller Teilnehmer via
  `computePirateResearch()`), dann per Livetest widerlegt: ein Nutzer-Paar mit stark
  unterschiedlichem Forschungsstand (Level 2 vs. 10) zeigte im echten Elite-Bollwerk-Kampf beim
  schwächer ausgebauten Teilnehmer etwa DOPPELT so hohe Verlustquoten wie beim stärkeren, bei
  praktisch identischen Schiffstypen - der Nutzer wollte das ursprünglich als Ausbau-Anreiz
  behalten, empfand die reale Auswirkung dann aber als zu hart fürs Spielgefühl des schwächeren
  Mitspielers. `computePirateResearch()` nutzt seitdem das MINIMUM statt den Durchschnitt aller
  Beteiligten pro Forschungs-Zweig - kein Teilnehmer kämpft dadurch mehr schlechter, als er es
  solo auf seinem eigenen Stand täte, wer besser ausgebaut ist profitiert weiterhin vom eigenen
  Vorsprung.
- Korrektur 05.08.2026 (Nutzer-Fund): `defenseFactor` (Anteil der NPC-Verteidigung an der
  kombinierten Flottenstärke, siehe `generateDefenseFleet()`-Aufrufe in `missions.ts`/
  `simulator.ts`/`groupOps.ts`) lag bei Hoch UND Elite-Bollwerk bei 0.20 - bei den ueblichen
  Flottengroessen dieser Stufen wuchs die gespawnte NPC-Verteidigung dadurch auf mehrere
  Milliarden Panzerung/Schild an und war trotz der Schild-Regen-Staffelung oben (siehe
  Kampfsystem-Abschnitt) faktisch unzerstoerbar (0% Verluste ueber mehrere echte Checks, Live-
  Bericht). Da `defenses.ts`-Basiswerte von NPC- UND eigener Heimatverteidigung geteilt werden,
  waere eine Absenkung der Basiswerte selbst auch die bereits als gut befundene Raid-Balance
  (siehe unten) angefasst haetten - stattdessen bewusst nur die gespawnte MENGE gesenkt (trifft
  ausschliesslich die NPC-Seite): `piraten_hoch` auf 0.15, `piraten_elite` auf 0.18 (bleibt hoeher/
  haerter zu knacken als Hoch, analog zur uebrigen Haerte-Reihenfolge). Simulation mit echten
  Check-2-Flottenwerten: 0.20 -> ø 7% Verteidigungs-Verlust, 0.18 -> ø 10%, 0.15 -> ø 14%, MUSS in
  allen drei Dateien synchron bleiben.
- Elite-Bollwerk: Beute verdoppelt sich pro Sieg in Folge (`streakWins`), bei perfekter Serie über
  alle 6 Checks zusätzlicher Abschluss-Bonus (Gesamtausbeute nochmal verdoppelt). Solo nutzbar
  (0 Eingeladene = Ersteller allein). Seit 04.08.2026 zusätzlich `guaranteedContainers` in
  `SektorConfig` (`sectors.ts`): 4x Silber + 3x Gold + 2x Elite-Container GARANTIERT pro
  überstandenem Check (mind. ein Gegner vernichtet), unabhängig von der Zufalls-Kapitän-Mechanik
  (`captainChance`) - jeder Teilnehmer bekommt die volle Menge, siehe
  `runGroupOperationCheck()` in `groupOps.ts`.
- Korrektur 05.08.2026 (Nutzer-Fund, dann per Nutzer-Gegenprüfung REVIDIERT): `lootBase` von
  `piraten_elite` (25M/15M/10M PRO Teilnehmer PRO gewonnenem Check) schien nicht auszureichen, um
  die üblichen Flottenverluste wirtschaftlich auszugleichen - Live-Auswertung dreier echter Checks
  zeigte Wiederaufbaukosten im zweistelligen Milliarden-Bereich (beide Teilnehmer zusammen).
  Zunächst versucht, `lootBase` selbst um das 4x anzuheben - Nutzer wies zurecht darauf hin, dass
  `lootBase` bereits durch `REWARD_ESCALATION` (`double`-Modus, siehe `economy.ts`) PRO SIEG IN
  FOLGE verdoppelt wird und der Reset-Trigger ("kein einziger Gegner vernichtet") eine sehr
  niedrige Hürde ist - bei einer typischen durchgehenden 6-Check-Serie ergeben sich dadurch schon
  mit der ALTEN Basis Multiplikatoren 1x/2x/4x/8x/16x/32x (Summe 63x) PLUS eine komplette
  Verdopplung der Gesamtausbeute am Ende ("Perfekte Serie"-Bonus) - macht rechnerisch bereits
  ~6,3 Mrd. pro Spieler, eine 4x-Basis-Erhöhung hätte daraus ~25 Mrd. gemacht (weit über das Ziel
  hinausgeschossen). `lootBase` daher UNVERÄNDERT gelassen. Stattdessen neues Feld `winResources`
  (300M/180M/120M, analog zum gleichnamigen Solo-Sektor-Feld, aber hier PRO CHECK statt am
  Missionsende gesammelt) in `runGroupHourlyCheck()` (`groupOps.ts`) ergänzt - bewusst NICHT mit
  `escalationMultiplier`/`fleetBonus` multipliziert, gleicht dadurch gezielt die frühen, noch
  nicht eskalierten Checks aus, ohne die exponentiell wachsende Spätphase weiter aufzublähen.
  Kampf-Schwierigkeit selbst unangetastet (siehe `PIRATEN_MULTIPLIER_ROLL`/`defenseFactor`-
  Korrektur weiter oben - das war ein separates Problem).
- Piratenadmiral (`piraten_admiral`): ein starker Boss + kleine Eskorte statt Massenwellen, mit
  Extraktions-Entscheidung ("Beute sichern" oder "weitermachen") statt reinem Durchhalte-Check.
  Bis zu 6 Kämpfe im 10-Min-Abstand, Admiral wird pro Check stärker. Nur Kreuzer-Klasse+ zugelassen
  (`ADMIRAL_ALLOWED_SHIP_IDS`). Bekommt bewusst KEINEN Flottengrößen-Belohnungsbonus (hat schon die
  Extraktions-Eskalation als eigene Risiko/Belohnung-Mechanik).
- Belohnungs-Container in drei Stufen (Silber/Gold/Elite), stapeln sich (max. 1 Eintrag/Stufe).
  Zieh-Mechanik: jede Kategorie unabhängig gegen ihre `chance` gewürfelt, auf genau 2 Treffer
  normalisiert (`rollContainerCategories()`) - Inventar zeigt die reale (nicht die rohe) Chance.
- Flottengrößen-Belohnungsbonus (`fleetSizeRewardMultiplier()`, logarithmisch, max. +50%) oberhalb
  der sektortypischen Referenzgröße - gilt für Piraten-Sektor-Beute, Elite-Bollwerk, Raid-
  Bergungs-DM (Schnappschuss der ersten Welle, nicht live neu berechnet).

### Wirtschaft: Gebäude, Forschungsbaum, Module

- Sechs Gebäude (Minen, Solarkraftwerk, Roboter-/Nanitenfabrik), EIN globaler Bauslot für alle
  zusammen. Minen verbrauchen Energie, fehlt sie wird die Produktion ALLER Minen DERSELBEN Stufe
  gemeinsam gedrosselt (`energyFactor(state, tier)`, nie ein Bonus bei Überschuss). Roboter-/
  Nanitenfabrik verkürzen Bauzeiten multiplikativ pro Stufe (stapeln sich), ebenfalls pro
  Gebäude-Tier isoliert (siehe unten).
- Heimatbasis-Gebäude V1/V2/V3 (05.08.2026, Nutzerentscheidung, analog zur Allianz-Station):
  V1 behält die bestehenden, unpräfixierten IDs (`metallmine` usw.) für Kompatibilität mit
  bestehenden Spielständen, V2/V3 sind neue `v2_`/`v3_`-Einträge in `BUILDINGS`
  (`data/buildings.ts`). Anders als bei der Station gibt es KEIN `maxLevel` (alle drei Stufen
  bleiben wie bisher unbegrenzt ausbaubar) - stattdessen feste Freischalt-Schwellen
  (`HOME_TIER_UNLOCK_LEVELS`): V2 ab Metallmine/Kristallmine/Deuterium-Synthetisierer (V1) Stufe
  36/32/30, V3 ab denselben Schwellen bei den V2-Minen. `state.buildingTier` (1-3) speichert die
  höchste freigeschaltete Stufe, `checkHomeBuildingTierUnlock()` in `actions.ts` prüft das bei
  jedem Tick. Kosten/Bauzeit/Ertrag: V2 = 2x/1,3x/1,5x, V3 = 4x/1,6x/2,5x relativ zu V1 bei
  Stufe 1 (identische Multiplikatoren wie bei der Allianz-Station). Produktion zählt KUMULATIV
  über alle freigeschalteten Stufen (`accrueBuildingProduction()` summiert über ALLE
  `BUILDINGS`-Einträge), Energie- und Bauzeit-Faktor bleiben PRO STUFE ISOLIERT (ein spät gebautes
  V3-Solarkraftwerk versorgt nicht rückwirkend V1/V2-Minen). Gebäude-Module (Fördereffizienz usw.)
  existieren bislang nur für V1 - für V2/V3 liefert die Modul-Suche einfach `1` (kein Effekt),
  kein Fehler. Client-UI (`Gebaeude.tsx`): Tab-Leiste V1/V2/V3 mit 🔒 bei gesperrter Stufe,
  spiegelt exakt das Tier-Tab-Muster der Allianz-Station (`Allianz.tsx`).
- Forschungsbaum: 4 Hauptbereiche (waffen/verteidigung/antrieb/wirtschaft), eigene Untertabs,
  Voraussetzungs-Schwelle Stufe 3 pro Eltern-Kind-Verbindung, `MAX_RESEARCH_LEVEL = 10`.
- Gebäude-/Schiffs-/Verteidigungs-Module: je 2-3 (Gebäude) bzw. 4 (Schiffe: Waffen/Schild/
  Panzerung/Antrieb, Verteidigung: ohne Antrieb) Zusatzausbauten, Stufenlimit 10. Hängen per
  Verbindungslinie direkt unter der jeweiligen Bau-/Forschungskarte, kein eigener Tab. Eigene
  Bau-Slots (`MAX_SHIP_MODULE_SLOTS`/`MAX_DEFENSE_MODULE_SLOTS = 3`), unabhängig von den 3
  normalen Bauplätzen. Verteidigungs-Modul-Stufen leben in derselben Map wie Schiffs-Module.
- Zeit-Gutscheine sind pro Bereich getrennt (Schiffe/Verteidigung/Gebäude/Forschung) - Schiffe/
  Verteidigung wirken auf ALLE belegten Lanes, Gebäude/Forschung auf ihren einen bzw. alle Slots.
- "Frischling-Bonus" (Nutzerentscheidung 04.08.2026, `NOVICE_BONUS_MULTIPLIER`/`-WINDOW_MS` in
  `data/economy.ts`): 3x Asteroiden-Mining-Ertrag in den ersten 7 Tagen nach Konto-Erstellung,
  automatisch fuer JEDEN neuen Account (nicht an einen manuell zu setzenden Stichtag gekoppelt -
  Nutzerentscheidung, damit auch spaeter neu hinzukommende Mitspieler profitieren, nicht nur beim
  geplanten Finale-Neustart). `PlayerState.createdAt` wird bei `defaultPlayerState()` auf
  `Date.now()` gesetzt; Bestandsspieler von VOR dieser Aenderung bekommen es beim naechsten Laden
  aus `users.created_at` nachgetragen (`loadPlayerState()` in `state.ts`), NICHT auf `Date.now()`,
  sonst wuerden alte Accounts faelschlich wieder als "neu" gelten. `isNoviceAccount()`/
  `miningMultiplier()` in `missions.ts` pruefen rein per Timestamp-Vergleich (`Date.now() -
  createdAt < NOVICE_BONUS_WINDOW_MS`), kein Scheduler/Cron noetig - analog zum bestehenden
  Booster-Ablauf-Muster (`isBoosterActive()` in `boosterUtil.ts`). Sichtbar als Banner auf der
  Sektor-Seite, solange aktiv (`gameData.noviceBonusMultiplier`/`-WindowMs`, keine hartcodierten
  Werte im Client). Wirkt NUR auf Mining-Schiffe (`accrueFarming()`/`miningMultiplier()` in
  missions.ts), NICHT auf Minen-Gebaeude (`miningBuildingMultiplier()` in actions.ts) - bewusste
  Entscheidung, da der Plan explizit "Asteroidenfeld"-Ertrag meinte.
- Imperator: Waffen 500.000 / Schild 400.000 / Panzerung 3.000.000 (`ships.ts`) - bewusst
  panzerungslastig, zäher Brocken statt Ein-Schlag-Gewinner. Baulimit 2, eigene Spezialteile-
  Kosten. Zählt zur Heimatverteidigung bei Raids (`HOME_DEFENSE_SHIP_IDS`).
- Teile-Umwandlung (05.08.2026, Nutzerentscheidung): bis dahin war der Imperator (max. 6 Stück,
  1000 Teile je Sorte) der EINZIGE Verbrauch für Waffen-/Schild-/Panzerungs-Teile - Container-Teile
  sind uncapped, überschüssige Teile stapelten sich also dauerhaft nutzlos. Neue Sektion "Teile
  umwandeln" auf der Schrotthändler-Seite (`convertTeile()` in `economyActions.ts`, Route
  `/teile/convert`), analog zu `scrapShip()`/`scrapDefense()`: bewusst VERLUSTBEHAFTET (kein
  1:1-Tausch), Rate `TEILE_CONVERT_RESOURCES` in `economy.ts` = 100.000 Metall/70.000 Kristall/
  40.000 Deuterium pro Teil (jede Sorte gleich, ca. 45-55% des aus Container-Belohnungen
  hochgerechneten "fairen" Werts eines Teils, ~375.000-493.000).
- Shop-Booster (Bautempo/Forschungstempo/Kampf/Abbau, `data/economy.ts`) haben pro
  `BoosterDefinition` weiterhin einen 24h-Basispreis/-Laufzeit, kaufbar aber seit 04.08.2026 auch
  direkt für 7 oder 30 Tage am Stück (`BOOSTER_DURATION_OPTIONS`, Dropdown auf der Shop-Seite) -
  mit Mengenrabatt gegenüber taeglichem Einzelkauf (Multiplikator 6x/20x statt linear 7x/30x).
  `buyBooster(state, boosterId, durationHours?)` validiert `durationHours` serverseitig gegen
  `BOOSTER_DURATION_OPTIONS` (Client kann sich keinen eigenen Preis ausdenken) und wirkt weiterhin
  auf DIESELBE Booster-ID/denselben `state.activeBoosters`-Ablauf-Zeitstempel wie ein 24h-Kauf -
  kein neuer Effekt-Code in `isBoosterActive()`/den Wirkungsstellen nötig, nur die Kaufseite wurde
  erweitert. Bestehendes Stacking-Verhalten (neue Laufzeit wird an die Restzeit angehängt statt sie
  zu überschreiben) gilt unverändert auch für 7d/30d-Käufe.

### Galaxie & Multiplayer

- 50 Systeme x 9 Positionen. Distanz-/Flugzeitformel gilt für JEDE Flugbewegung (Missionen,
  Halten, Raid-Anflug, Rendezvous) - Forschung des ABSENDERS zählt.
- "Halten" ist der einzige Weg, einem Spieler bei Raids zu helfen: Flotte stationiert sich
  unbegrenzt, verteidigt automatisch bei jedem künftigen Raid, volle Belohnung wie der Verteidiger.
- Raid: `RAID_WAVE_COUNT` (12) Wellen über `RAID_ASSAULT_DURATION_MS` (24h) nach Ankunft. Jede
  Welle ein unabhängiger Kampf, Feindstärke = 70% eigene Heimatflotte + 30% Verteidigungsanlagen
  (`RAID_FLEET_POWER_WEIGHT`/`RAID_DEFENSE_POWER_WEIGHT`), eskaliert über die Wellen
  (`RAID_WAVE_FACTORS`). Verstärker-/Halte-Flotten zählen NICHT in die Gegnerstärke, tragen im
  Kampf aber voll bei. Belohnung skaliert linear mit jeder gewonnenen Welle, EINE
  Abschluss-Nachricht (`raid.waveLog`) statt vieler Einzelnachrichten.
- Piraten-Raids starten von einer der 12 festen Piratenbasen mit echter distanzabhängiger
  Flugzeit nach fester Vorbereitungszeit (60 Min.).
- Elite-Bollwerk-Rendezvous: Teilnehmer fliegen erst zum Ersteller, Start blockiert bis alle da
  sind, dann gemeinsam weiter (Geschwindigkeit = langsamstes Schiff über alle Flotten).
  Auto-Start (Nutzerentscheidung 04.08.2026, `autoStartReadyGroupOperations()` in `groupOps.ts`):
  vorher musste der Ersteller IMMER manuell auf "Jetzt starten" klicken, selbst wenn alle
  eingeladenen Flotten laengst eingetroffen waren. Startet jetzt automatisch, sobald ALLE
  Einladungen beantwortet sind (niemand mehr `'pending'` - sonst wuerde bereits bei der ERSTEN
  Ankunft losgeflogen, obwohl noch jemand ueberlegt) UND mindestens ein Nicht-Ersteller
  beigetreten ist (sonst wuerde eine Operation ohne jeden Mitspieler sofort "solo" losgeschickt,
  sobald alle abgelehnt haben - bleibt bewusst ein manueller Klick) UND alle angenommenen Flotten
  eingetroffen sind. Kernlogik aus dem bisherigen `startGroupOperation()` in
  `performGroupOperationStart()` extrahiert (gemeinsam genutzt von manuellem UND automatischem
  Pfad, keine Code-Duplizierung) - der manuelle "Jetzt starten"-Button bleibt bestehen (Ersteller
  kann so weiterhin VOR vollstaendiger Antwort aller Eingeladenen starten, z.B. wenn jemand nicht
  mehr reagiert; automatischer Start wartet auf vollstaendig aufgeloeste Einladungsliste). Laeuft
  global bei jedem Heartbeat/Tick, analog zu `processAllDepartedGroupOperations()` (dieselben
  beiden Aufrufstellen: `heartbeat.ts`, `actions.ts` `tick()`). Der Ersteller bekommt bei
  automatischem Start eine Nachricht (beim manuellen Start nicht noetig, sieht das Ergebnis
  ohnehin sofort in der UI).
- Galaxie-Ereignisse (Wrack/Handelskonvoi): zufällig, max. 2 gleichzeitig aktiv, einfacher
  Rundflug ohne Verlustrisiko (kostet bei Verpassen nur Flugzeit).
- Heimatbasis verlegen: `RELOCATE_BASE_COST_DM` (300 DM), sofortige Wirkung, kein Flug.
- **Allianz-Station**: echtes, persistentes Allianzsystem (`alliances`/`stations`-Tabellen) - ein
  Nutzer gründet, ein zweiter tritt bei, gemeinsam wird eine Station an einer Galaxie-Position
  gebaut. Nur Minen + Solarkraftwerk + Roboter-/Nanitenfabrik in drei Versionen V1/V2/V3
  (jede besser, teurer/langsamer, schaltet sequenziell frei ab Level-Cap 30 der Vorstufe).
  Komplett EIGENE Produktions-/Kosten-/Energie-Formeln (`stations.ts`, kein Spieler-Forschungs-
  Bezug - wessen Forschung sollte bei einer gemeinsamen Station gelten?). Ressourcen gemeinsam
  gelagert, Self-Service Einzahlen/Abheben ohne Genehmigungsschritt. Passive Produktion läuft
  sowohl lazy beim Laden als auch über den globalen Heartbeat. Jeder abgeschlossene Bauauftrag
  wird protokolliert (`station.buildLog`, wer/was/welche Stufe/wann, auf 50 Einträge gedeckelt,
  neueste zuerst) - sichtbar auf der Allianz-Seite, sobald mind. 1 Eintrag existiert.

### KI-Spieler & Piratenbasen

- Zwei Bot-Accounts (KI-Vega/KI-Nyx, `is_bot`-Flag, `ensureBotUsers()` bei Serverstart) - nutzen
  exakt dieselben Aktionsfunktionen wie ein Mensch. `runBotTurn()` läuft im Heartbeat NACH
  `tick()`/`processMissions()`/`processRaidTimer()` (Reihenfolge kritisch - siehe Kernbugfix
  unten). Wirtschafts-Entscheidungslogik (`runEconomyBotTurn()` in `economyBotTurn.ts`, geteilt
  mit Piratenbasen) ohne eigene Drosselung, da ohne Kampf-Risiko - der Takt kommt vollständig vom
  Heartbeat. **Wichtig dazu:** `GET /api/heartbeat` läuft bewusst ohne `requireAuth` und ist damit
  von außen auslösbar; weil jeder Durchlauf einen vollständigen Bau-Entscheidungsschritt jedes Bots
  ausführt, ließ sich das Bot-Wachstum darüber beliebig beschleunigen. Seit dem 17.08.2026 greift
  `HEARTBEAT_MIN_INTERVAL_MS` (60 s) in `heartbeat.ts`; innerhalb des Fensters antwortet der
  Endpunkt mit `skipped: true`, ein manueller Testaufruf wirkt dann nicht sofort. Der Wert liegt
  bewusst unter `HEARTBEAT_INTERVAL_MS` (2 Min.), damit der interne Takt nie übersprungen wird.
  Kampfauslösende Aktionen (Piratenbasis-
  Angriff, `piraten_elite`-Beitritt) sind eigens gedrosselt (`BOT_COMBAT_ACTION_CHANCE`) UND
  vergleichen vorab die eigene gegen die gegnerische Gesamtstärke (`combatFleetPowerBase()`,
  `ATTACK_POWER_SAFETY_MARGIN` = 1,15) - nur bei klarem Vorteil wird tatsächlich angegriffen,
  sonst wächst die Flotte erst weiter.
- **Piratenbasen** (`pirateBaseState.ts`, `PirateBaseState`): 4 der 12 möglichen Positionen aktiv,
  vollwertiger `PlayerState` pro Basis (synthetische negative `userId`, taucht nie in
  `listAllUsers()` auf). Wachsen wie ein Spieler (`runEconomyBotTurn()`). **Der Bau-Entscheidungs-
  schritt hängt seit dem 17.08.2026 an der UHR, nicht mehr am Ladevorgang** (`nextEconomyTurn` auf
  der Basis, `PIRATE_BASE_ECONOMY_TURN_INTERVAL_MS` = 2 Min. = `HEARTBEAT_INTERVAL_MS`, also genau
  ein Zug je Heartbeat). Vorher lief er bei JEDEM Laden - und geladen wird eine Basis bei jedem
  Aufruf der Galaxie-Ansicht, jedem Spionageflug und jedem Angriff; gemessen waren das bis zu
  **10.500 vollständige Entscheidungsschritte in 20 Sekunden** je Basis. Zwei Punkte, die beim
  Ändern des Intervalls mitgedacht werden müssen: der Zeitstempel wird im RASTER weitergesetzt
  (`+= Intervall`, gedeckelt über `PIRATE_BASE_ECONOMY_TURN_MAX_CATCHUP`), NICHT auf
  "jetzt + Intervall" - sonst lässt ein Aufruf kurz vor Fälligkeit den Zug ausfallen, was bei
  gleichem Takt wie der Heartbeat der Regelfall wäre. Und `runEconomyTick()` (Ressourcen-
  Produktion) bleibt bewusst UNGEDROSSELT, weil es ohnehin zeitbasiert rechnet.
  **Angriff auf eine Basis: die Garnison skaliert seit dem 18.08.2026 mit der angreifenden Flotte**
  (Entscheidung 5 des Balance-Plans, Rechenteil in `pirateBaseCombat.ts`, Konstanten in
  `data/economy.ts`). Die Basis stellt eine Welle in Höhe der ANGREIFENDEN Machtsumme, gewürfelt
  über `PIRATE_BASE_MULTIPLIER_ROLL` (50/30/20 wie bei den Sektoren), zusammengesetzt aus dem, was
  sie tatsächlich gebaut hat, und gedämpft durch ihre Gefechtsbereitschaft. Vier Punkte, die
  zusammengehören und nicht einzeln geändert werden dürfen:
  - Die Wellenstärke ist NICHT am Bestand gedeckelt (die Basis "ruft Verstärkung", dieselbe Fiktion
    wie in jedem Piraten-Sektor). Ein Deckel am Bestand hätte genau den Zustand konserviert, den
    die Änderung beseitigen soll: 0 % Verlust für entwickelte Flotten.
  - Verluste treffen den ECHTEN Bestand, aber als Anteil und gedeckelt auf
    `PIRATE_BASE_MAX_ATTRITION` (0,35). Ohne diesen Deckel löschte EIN Angriff einer entwickelten
    Flotte die komplette Garnison, und die Basis wäre auf Monate wertlos gewesen.
  - Der frühere Floor-Up auf `SEED_FLEET`/`SEED_DEFENSE` ("unzerstörbare Basis") ist ERSATZLOS
    GESTRICHEN. An seine Stelle treten Erholungszeit (`PIRATE_BASE_RECOVERY_MS`, 20 h, geprüft beim
    Absenden UND bei Ankunft) und zeitbasierter Wiederaufbau bis zum Grundbestand
    (`regenerateGarrison()`, 3 Tage). Der Grundbestand ist damit Startwert und Bezugsgröße der
    Gefechtsbereitschaft, KEINE Untergrenze mehr.
  - Die Garnison kämpft mit `max(eigene Forschung, Forschung des Angreifers)` (`garrisonResearch()`).
    Grund: `sideBStatsOverride` umgeht `computePirateResearch()`, eine frische Basis hätte sonst
    Forschungsstufe 0, während jeder Sektor-Pirat den vollen Stand des Angreifers bekommt.
  Die **Beute** kommt seither aus der tatsächlich vernichteten Garnison (`pirateBaseLoot()`, Kurve
  `LOOT_CURVE_*`: Anker 1,05 Mrd Wert bei 11,18 Mrd vernichteter Feindmacht, Exponent 0,85), nicht
  mehr aus dem Lagerbestand. `LOOT_BASIS_CAP` und `PIRATE_BASE_LOOT_PERCENT` sind damit entfallen;
  der Ressourcenbestand einer Basis wird von Angriffen nicht mehr angetastet und ist reiner
  Treibstoff ihres eigenen Ausbaus, der bewusst unbegrenzt bleibt.
  **Anzeige-Falle:** der in `Galaxie.tsx` gezeigte Wert ist seitdem die Garnisons-RESERVE, nicht die
  Schwierigkeit. Wer daraus wieder eine Bedrohungsstufe macht, zeigt etwas Falsches an.
  Offensiv-KI greift Spieler/Bots selbst an (`runAllPirateBaseOffensiveTurns()`, einmal pro
  Heartbeat), aber mit langem Cooldown (`PIRATE_BASE_OFFENSIVE_COOLDOWN_MIN/MAX_MS`, 48-96h pro
  Basis) UND einer eigenen Stärke-Abwägung (`PIRATE_BASE_ATTACK_POWER_SAFETY_MARGIN`) - die zielt
  auf die Verteidigung eines SPIELERS und bleibt deshalb gültig, während die gleichnamige Abwägung
  der Bots gegen Basen am 18.08.2026 entfallen musste: gegen eine mitskalierende Garnison gibt es
  keine feste Gegnerstärke mehr, gegen die man abwägen könnte (Bots prüfen jetzt Erholungszeit und
  Gefechtsbereitschaft).
  Eine frische/reaktivierte Basis würfelt erst ihren ersten Cooldown statt sofort anzugreifen.
- **CPU-Spitzen-Vorfall (Juli 2026, wichtigster Betriebs-Lernpunkt)**: KI-Bots UND Piratenbasen-
  Offensiv-KI liefen früher mit hoher Frequenz ohne Entscheidungspause und lösten echte
  Kampf-Simulationen im nur 1-3 Worker großen Pool aus → CPU-Spitzen bis 250%+, einzelne
  Anfragen bis 15 Minuten. Root Cause zusätzlich verschärft durch eine ungedeckelte
  Nachhol-Schleife in `tickMission()` (siehe `MISSION_HOURLY_CATCHUP_CAP` oben). Beide Systeme
  wurden zwischenzeitlich komplett entfernt, dann bewusst throttled wieder eingeführt (aktueller
  Stand oben) statt 1:1 zurückgebaut - bei künftigen CPU-Vorfällen zuerst hier nachsehen:
  kampfauslösende Aktionen brauchen IMMER eine niedrige, eigene Chance/einen langen Cooldown,
  reine Wirtschafts-/Wachstumslogik ist unbedenklich.
- Spionagesonden (`spyMissions.ts`): Flug IMMER 5 Min. je Richtung (flach, nicht distanzbasiert),
  Detailgrad des Berichts steigt mit Spionage-Forschungsstufe (Stufe 0 = nur Ressourcen exakt,
  Stufe 10 = alles exakt, dazwischen ein schrumpfender Streuungsbereich). Piraten spionieren
  umgekehrt ebenfalls (periodischer Checkpoint, deckt nur "dass" und "von wo" auf).
- Debug-Seite (`pages/Debug.tsx`, `GET /api/game/debug/npcs`) zeigt vollen Zustand aller Bots und
  Piratenbasen (Flotte/Verteidigung/Gebäude/Forschung/Warteschlangen) - unbedenklich in einem
  reinen 2-Spieler-Koop-Spiel ohne PvP.
- Bots/Piratenbasen bauen/schicken KEINE Mining-Schiffe zu Asteroiden-Sektoren (`economyBotTurn.ts`)
  - eine frühere feste 50er-Obergrenze war nie so beabsichtigt und wurde ersatzlos entfernt.
  Stattdessen gleicht `NPC_PRODUCTION_BONUS_MULTIPLIER` (`economy.ts`, 1,5x → 6x angehoben, Juli
  2026) den fehlenden Container-/Missions-Ertrag echter Spieler direkt über die passive
  Minen-Produktion aus.
- `economyBotTurn.ts` überarbeitet (Nutzerentscheidung 04.08.2026), da die 6-fache Minenproduktion
  oft verpuffte: Solarkraftwerk wird jetzt VORAUSSCHAUEND priorisiert (`hasEnergyHeadroom()`,
  15% Sicherheitsmarge auf der UNGEDECKELTEN Produktions-/Verbrauchs-Ratio aus `energyProduced()`/
  `energyConsumed()`), statt erst reaktiv bei `energyFactor(state) < 1` - `energyFactor()` selbst
  deckelt bei 1.0 und zeigt einen Engpass daher erst nach dessen Eintreten. `maybeBuildShips()`/
  `maybeBuildDefense()` weichen jetzt zusätzlich auf eine kleinere, bezahlbare Alternative aus
  (guenstigster Typ zuerst, 1 statt der eigentlich angepeilten 5/10 Stück -
  `COMBAT_SHIP_IDS_BY_COST`/`DEFENSE_IDS_BY_COST`), statt den Zug leer enden zu lassen, wenn das
  eigentliche Bauvorhaben für JEDEN Typ zu teuer war.

### Klassensystem

- **Kampf-Klasse** (Pflicht, `data/classes.ts`): Kanonier (+100% NUR Waffen), Bollwerk (+50%
  Schild UND Panzerung), Kommandant (+33,33% auf alle drei) - festes Gesamtbudget, echtes
  Schere-Stein-Papier. Erstwahl kostenlos, Wechsel `CLASS_CHANGE_COST_DM` (500 DM). Solange
  `playerClass === null`, blockiert `App.tsx` den kompletten Zugang bis zur Wahl.
  Zusatzboni: eigene Baukosten-Rabatte (Kanonier -10% Schiffe, Bollwerk -25% Verteidigung,
  Kommandant -10% beides) und Geschwindigkeits-/Reparatur-Boni passend zum Kampfstil. Fließt über
  `getEffectiveStats()` in JEDEN Kampf-Aufrufer, NICHT in die Feindstärke-Berechnung.
- **Wirtschafts-Klasse** (optional, zweite unabhängige Wahl, `data/economyClasses.ts`):
  Schmuggler (Handel: halbe Gebühr, mehr Schrott-Rückerstattung), Ingenieur (Bau: -15% Bauzeit
  überall), Prospektor (Förderung: +20% Mining-Ertrag, +30% DM-Fundrate, -10% Treibstoff). Rühren
  nie an Waffen/Schild/Panzerung. Jede Wahl (auch die erste) kostet `ECONOMY_CLASS_CHANGE_COST_DM`
  (1000 DM), anders als die kostenlose Kampf-Klassen-Erstwahl.
- KI-Bots/Piratenbasen wählen beim ersten Zug einmalig zufällig eine Kampf-Klasse
  (`maybeChooseClass()`), da sie das UI-Gate umgehen.

### Statistik & Punkte

- "Feinde vernichtet" fließt gestaffelt nach Gegnerwert in die Punktzahl ein (Baukosten-basiert,
  `getUnitPointValue()`), nicht pauschal 1 Punkt/Einheit - neue Schiffe/Verteidigung brauchen
  keine manuelle Pflege. `enemiesDestroyedByType` treibt die Punkteberechnung, der rohe
  `enemiesDestroyed`-Zähler bleibt nur für die Statistik-Anzeige (unverändert seit Juli 2026).
- Statistik-Neugestaltung (Nutzerentscheidung 04.08.2026, `stats.ts`/`Statistik.tsx`): die alte
  "Gesamtmacht" (aktuelle Flotte/Verteidigung, `calculateFleetPowerPoints()`, sank bei
  Kampfverlusten wieder) wurde KOMPLETT ersetzt durch zwei kumulative Ausgaben-Kategorien, die nie
  sinken - `resourcesSpentShipsDefense`/`resourcesSpentResearchBuildings` (Summe Metall+Kristall+
  Deuterium, PlayerStats) werden an den 7 Ressourcen-Abzugsstellen in `actions.ts` hochgezählt
  (Schiffe/Schiffs-Module/Verteidigung/Verteidigungs-Module → ships-defense, Gebäude/Gebäude-
  Module/Forschung → research-buildings) und über `shipsDefensePoints()`/`researchBuildingsPoints()`
  mit derselben Skalierung wie Gegner-Punkte (`UNIT_POINT_COST_SCALE = 100000`) in Punkte
  umgerechnet. Gebäude sind bewusst mit in die zweite Kategorie gemischt, NICHT Forschung/Module
  allein, weil Gebäude (anders als Forschung/Module, Stufe-10-Deckel) unbegrenzt ausbaubar sind -
  die Kategorie bleibt dadurch auch für Spieler mit komplett maxierter Forschung/Modulen sinnvoll
  wachsend. `POINT_WEIGHTS` (Missionen/Elite-Bollwerk-Checks/Raid-Abwehr) wurde komplett aus
  `calculatePoints()` entfernt (Nutzer-Beobachtung am echten Spielstand: selbst nach starkem
  Hochskalieren blieben diese Kategorien gegenüber der ressourcenbasierten Punktzahl im
  Millionen-Bereich unsichtbar) - die zugrundeliegenden `PlayerStats`-Rohzähler bleiben bestehen
  (weiterhin von `missions.ts`/`raids.ts`/`groupOps.ts` befüllt), fließen aber nicht mehr in die
  Punktzahl ein und wurden von der Statistik-Seite entfernt. Container/erbeutete Ressourcen/eigene
  Verluste/Asteroiden-Einsätze bleiben weiterhin außen vor (Glück/Fleiß, keine Investition) und
  sind ebenfalls nicht mehr auf der Seite gelistet - sie zeigt jetzt bewusst NUR noch die drei
  tatsächlich punkte-relevanten Werte (Schiff/Verteidigung, Forschung/Gebäude, zerstörte Piraten).
  `LeaderboardEntry` liefert `shipsDefensePoints`/`researchBuildingsPoints` vorberechnet mit, damit
  der Client `UNIT_POINT_COST_SCALE` nicht selbst duplizieren muss.

### Frontend-Konventionen

- **Flotten-Vorlagen liegen am SPIELER, nicht am Sektor** (`state.presets`, Server `presets.ts`,
  max. 10). Dieselbe Vorlage lässt sich deshalb an allen drei Flotten-Auswahlen verwenden:
  Sektor-Mission, gemeinsame Expedition anlegen (P9/P10) und **Einladung annehmen**. Alle drei
  benutzen `components/FleetPresetBar.tsx` - beim Hinzufügen einer weiteren Flotten-Auswahl diese
  Komponente einsetzen, statt die Leiste erneut zu bauen. Bis 18.08.2026 gab es sie nur in
  `Sektor.tsx`; im Multiplayer-Tab musste jeder Teilnehmer seine Flotte von Hand eintippen.
- **Beim Übernehmen einer Vorlage MUSS auf `availableIds` gefiltert und auf den Bestand geklemmt
  werden** (macht `FleetPresetBar` zentral). Grund: eine im Asteroiden-Feld gespeicherte Vorlage
  enthält Mining-Schiffe, und die Auswahl-Listen rendern nur die jeweils erlaubten Typen - solche
  Einträge stünden sonst UNSICHTBAR in der Auswahl und gingen trotzdem an den Server. Die alte
  Fassung in `Sektor.tsx` tat beides nicht (`setSelection(p.ships)` ungeprüft); der Server fing
  nur den Bestandsfall mit einer Fehlermeldung ab.

- `InfoTable`/`InfoModal`-Zeilen nutzen `.info-list`/`.info-list-row`, nicht rohe Tabellen.
- Händler/Schrotthändler nutzen `ship-grid`/`ship-card` mit Bildern, Ressourcentausch über
  anklickbare Icon-Chips statt `<select>`.
- Rohe interne IDs/Enums nie direkt anzeigen - immer über Lookup/Label-Map in lesbaren Text.
- Baubarkeit und Einsetzbarkeit in Missionen sind zwei getrennte Schalter - bei neuen
  Kampfschiffen müssen beide gesetzt werden (`ships.ts` fürs Bauen, `COMBAT_SHIP_IDS` fürs
  Einsetzen, inkl. aller Client-Kopien).
- Ein einziges, festes Hintergrundbild für die gesamte App - ein Per-Route-System wurde nach
  wiederholten Ladeproblemen zurückgebaut, kein neuer Anlauf ohne Absprache.
- Mengen-Eingabefelder (`.qty-input`, Bau-Karten UND Flottenauswahl) erlauben einen leeren
  Zwischenzustand waehrend des Tippens (`value === ''` statt sofort auf einen Mindest-/Default-
  Wert zu klemmen) - sonst laesst sich ein vorbelegter Wert auf Mobilgeraeten nicht per Backspace
  loeschen, ohne ihn erst zu markieren (Nutzerentscheidung 04.08.2026). Bau-Karten
  (`ShipBuildCard.tsx`/`DefenseBuildCard.tsx`) klemmen einen leeren/ungueltigen Wert erst
  `onBlur()` auf mindestens 1. Die Flottenauswahl (`FleetPicker` in `Multiplayer.tsx`,
  Sende-Formular in `Sektor.tsx`, sowie der Ziel-Dialog in `Galaxie.tsx` fuer Piratenbasis-Angriff/
  Spionagesonden/Galaxie-Ereignis-Bergung/Flotte-Halten - alle vier teilen sich dort denselben
  `ownedShips.map()`-Codepfad, ein Fix deckt sie alle ab) nutzt seit demselben Datum ein einzelnes
  Eingabefeld + "Alle"-Button statt einer Reihe von `-1k/-100/-10/+10/+100/+1k`- bzw. in
  `Galaxie.tsx` `-10/-1/+1/+10`-Buttons (nahm bei vielen Schiffstypen zu viel Platz weg,
  uneinheitlich zu den bereits umgestellten Seiten) - 0 wird dabei als leeres Feld dargestellt
  (`value={qty === 0 ? '' : qty}`), wodurch sich auch ein bereits gesetzter Wert einfach
  ueberschreiben laesst.
- Kampfbericht-Tabellen (`.combat-table`, 9 Spalten inkl. langer Header wie "Schaden ausgeteilt",
  7 Vorkommen in `Nachrichten.tsx`) quetschten sich auf Mobilgeraeten mit `width:100%` bis zur
  Unlesbarkeit zusammen (Nutzer-Fund 04.08.2026: "verschwindet fast vollständig"). Fix zentral in
  der CSS-Klasse (nicht an jeder der 7 Stellen einzeln): `display:block; overflow-x:auto` macht die
  Tabelle bei Bedarf seitlich scrollbar statt sie zu quetschen, `min-width:720px` im
  Mobil-Breakpoint (`@media max-width:768px`) verhindert, dass die Spalten trotzdem zusammenlaufen,
  bevor der Scrollbalken greift. Auf breiten Bildschirmen ohne jeden Effekt (kein Scrollbalken,
  solange die Tabelle in die verfuegbare Breite passt).

### Bilder

- Neue Schiffs-/Gebäude-/Klassen-Bilder vor dem Einchecken komprimieren (JPEG, ~700px Breite,
  Qualität ~78%, Ziel ~60-80 KB) - wichtig für Mobil-Ladezeiten.

## Kurz-Changelog

Stichpunkte, chronologisch, sehr knapp - für vollen Kontext `git log`/`git blame` verwenden. Die
spielerlesbare Version derselben Ereignisse steht in `server/src/game/data/changelog.ts`.

- Basis-System: Bauen/Forschen/Missionen/Raids/Inventar/Händler/Shop.
- Kampf-Engine in Worker-Thread ausgelagert, Mehrspieler-Kampfvariante ergänzt.
- Gruppen-Expeditionen (Elite-Bollwerk) als Multiplayer-Sektor eingeführt.
- Schildkuppeln auf gemeinsamen Pool umgestellt, Verteidigung an Schiffs-Kosteneffizienz angeglichen.
- Imperator eingeführt und mehrfach nachbalanciert; drei Salvenschiffe mit Mehrfachziel-Salve.
- Rückzugs-Mechanismus (gestaffelt statt Flotten-weit) eingeführt, für Raids deaktiviert.
- Präzision/Schild-Regen größenabhängig, Ausweichen und kritische Treffer eingeführt.
- Statistik/Bestenliste, Wellen-Vielfalt (Profile/Ausreißer/Modifikatoren) eingeführt.
- Gebäude-, Galaxie- und Forschungsbaum-System eingeführt (löst Einzelforschungen ab).
- KI-Mitspieler eingeführt (mehrfach wegen CPU-Last entfernt/throttled wieder eingeführt, siehe
  KI-Spieler-Abschnitt oben).
- Personalisierte Raid-Zeiten pro Spieler, später auf wöchentlichen Sonntags-Rhythmus umgestellt.
- Piratenadmiral (P10) als zweiter Multiplayer-Sektor eingeführt.
- Raid auf Wellen-Belagerung umgestellt (später 5→12 Wellen, 1h→24h).
- Server-Umzug Render → Hetzner (CX33) + Coolify.
- Klassensystem eingeführt (Kanonier/Bollwerk/Kommandant), später um Wirtschafts-Klassen ergänzt.
- Werft neu strukturiert (Spezialschiffe-Tab, Schiffs-/Verteidigungs-Module, Sentinel-/Ultimate-
  Kanone, Gigant-Schildkuppel), Verteidigung nach Klassen unterteilt.
- Piraten/NPCs bekommen Anteil an Spieler-Forschung (0%→50%→100%).
- Container-Überflutung behoben (Stapeln, unabhängige Dropchance pro Kategorie).
- Angreifbare, persistente Piratenbasen eingeführt ("wachsen wie ein Spieler"), später Außenposten
  (inzwischen komplett entfernt) und Spionagesonden gegen Piratenbasen ergänzt.
- Effektivwerte (Basis + Klassen-/Modul-/Booster-Bonus) auf Bau-Karten und in Info-Popups sichtbar
  gemacht, farblich gekennzeichnet.
- CPU-Spitzen-Vorfall (Juli 2026): Nachhol-Deckel für Missions-Stunden-Checks eingeführt, danach
  KI-Mitspieler/Piratenbasen-Autonomie komplett entfernt, später beides throttled wieder
  eingeführt inkl. Stärke-Abwägung vor jedem Angriff (siehe KI-Spieler-Abschnitt oben).
- Balance: Jäger/Kreuzer bekommen Größen-Ausweichbonus gegen große/Elite-Schiffe.
- Raid-Umbau: 1x/Woche statt 2x/Tag, 24h/12 Wellen statt 1h/5 Wellen, linear skalierende Belohnung.
- Asteroiden-Feld/Piraten-Sektor/Elite-Bollwerk auf 24h umgestellt, Piraten-Sektor Solo auf reine
  Container-Belohnung (nur eine Stufe gleichzeitig beflogbar).
- Kampf-Engine: Stack-Aggregat-Simulation für sehr große Flotten (löst Minuten-lange Einzelkämpfe),
  RapidFire-Zielpool-Performance-Fix, `STACK_AGGREGATE_THRESHOLD` mehrfach angepasst und
  schließlich pro Schiffs-/Verteidigungsklasse gestaffelt statt global.
- Allianz-Station eingeführt (persistentes, kooperatives Allianzsystem, löst das rein kosmetische
  alte Allianz-Panel ab).
- Diverse UI-Fixes: Popup-Stacking-Context, Forschungsbaum-Mobilscroll, Info-Popup-Zeilenumbruch,
  Piraten-Sektor-Button-Sperre bei aktiver Mission, gekürzte Sektor-Info-Popups.
- Feature: "Alle einlösen" für gestapelte Inventar-Belohnungen (außer Zeit-Gutscheine).
- Feature: Bau-Verlauf für Allianz-Station (wer/was/welche Stufe/wann, auf 50 Einträge gedeckelt).
- Fix: Mining-Schiffe/-Flüge bei Bots/Piratenbasen komplett entfernt (war nie so beabsichtigt),
  `NPC_PRODUCTION_BONUS_MULTIPLIER` als Ausgleich von 1,5x auf 6x angehoben.
- Großes Kampf-/Balance-Update (04.08.2026): Schild-Regeneration und kritischer Schaden auf
  klassenspezifische Basiswerte umgestellt (löst globale Pauschalen ab), RapidFire-Matrix auf eine
  saubere Stein-Schere-Papier-Kette neu geordnet, Piraten-Sektoren/Elite-Bollwerk/Raids auf ein
  50/30/20-Zufallsprinzip für die Feindstärke umgestellt (deutlich härter, dafür unberechenbarer),
  skalierendes Ressourcenpaket für Solo-Piraten-Sektoren und garantierte Container (4x Silber/3x
  Gold/2x Elite pro Check) fürs Elite-Bollwerk ergänzt, `economyBotTurn.ts` auf vorausschauendes
  Energie-Management und flexible Bau-Fallbacks umgestellt.
- Fix: Mengen-Eingabefelder (Bau-Karten UND Flottenauswahl) lassen sich jetzt komplett leeren statt
  bei jedem Tastendruck auf einen Mindestwert zurückzuschnappen - wichtig für Mobil-Eingabe.
  Flottenauswahl (Multiplayer/Sektor-Entsenden) zusätzlich von einer Reihe `-1k/.../+1k`-Buttons
  auf ein einzelnes Eingabefeld + "Alle"-Button umgestellt (Platz-/Übersichts-Fix bei vielen
  Schiffstypen).
- Feature: Shop-Booster direkt für 7 oder 30 Tage kaufbar (Dropdown pro Booster-Karte, Preis passt
  sich mit Mengenrabatt an), statt nur einzeln für 24h - siehe `BOOSTER_DURATION_OPTIONS`.
- Feature: Bonus-Aufschlüsselung per Hover/Tap auf Waffen-/Schild-/Panzerungs-Effektivwerte (welche
  Forschung/Klasse/Modul/Booster wie viel beitragen). Dabei Fix: Kampf-Booster wurde im Client noch
  mit dem alten +20% statt korrektem +35% angezeigt (reiner Anzeigefehler, Kampf lief serverseitig
  immer korrekt) - `kampfBoostMultiplier` kommt jetzt vom Server statt hartcodiert zu sein.
- Statistik-Neugestaltung: nur noch punkte-relevante Werte (Schiff/Verteidigungs-Punkte, Forschungs/
  Gebäude-Punkte, zerstörte Piraten). Alte, bei Verlusten sinkende Gesamtmacht-Punktzahl komplett
  durch kumulative, nie sinkende Ressourcenausgaben-Punkte ersetzt; Missionen/Elite-Bollwerk/Raid-
  Abwehr aus der Punktzahl entfernt (waren gegenüber ressourcenbasierten Werten unsichtbar klein).
- Fix: Kampfbericht-Tabellen auf Mobilgeräten quetschten sich bis zur Unlesbarkeit zusammen -
  scrollen jetzt bei Bedarf seitlich statt die Spalten zu stauchen.
- Fix: Flottenauswahl beim Piratenbasis-Angriff/Spionage/Galaxie-Ereignis/Flotte-Halten (Galaxie-
  Seite) auf dasselbe Eingabefeld + "Alle"-Button-Muster wie Multiplayer/Sektor umgestellt.
- Feature: "Frischling-Bonus" - 3x Asteroiden-Mining-Ertrag automatisch fuer die ersten 7 Tage
  nach Konto-Erstellung, fuer jeden neuen Account (nicht nur beim geplanten Finale-Neustart).
- Feature: Elite-Bollwerk/Piratenadmiral-Gruppenoperationen starten automatisch, sobald alle
  eingeladenen Flotten eingetroffen sind - kein manueller Klick mehr noetig (Button bleibt als
  Option, um vor vollstaendiger Antwort aller Eingeladenen zu starten).
- Fix: `processMissions()` fehlte Fehler-Isolation pro Mission - eine Exception in EINER Mission
  konnte den gesamten Tick abwerfen und dadurch bereits gepushte Nachrichten/Fortschritt spurlos
  verschwinden lassen (Nutzer-Fund: Flotte im Piraten-Sektor Hoch komplett verloren, keine
  Nachricht erhalten).
- Flotten-Vorlagen jetzt auch im Multiplayer-Tab (Expedition anlegen UND Einladung annehmen), nicht
  mehr nur im Sektor-Tab; gemeinsame Komponente `FleetPresetBar` filtert beim Uebernehmen auf die
  hier erlaubten Schiffstypen und klemmt auf den Bestand. Dabei die fehlende Server-Whitelist fuer
  P9/Notruf-Events nachgezogen (`allowedShipIdsForOperation()`), vorher nur P10 und doppelt kopiert.
