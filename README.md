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
  src/game/data/economy.ts           Booster, Gutscheine, Container, Raid-Konstanten, Checkpoints
  src/game/data/combatConstants.ts   RAPIDFIRE-Tabelle, ZIELERFASSUNG_BASE, MAX_*-Konstanten,
                                      STACK_AGGREGATE_THRESHOLD_BY_TYPE
  src/game/data/galaxyConstants.ts   Galaxie-Größe, Distanz-/Flugzeit-Konstanten, Piratenbasen
  src/game/data/buildings.ts         Gebäudedaten (Minen, Solarkraftwerk, Roboter-/Nanitenfabrik)
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

  src/components/ResourceBar.tsx     Kopfleiste: Ressourcen, Energie, Uhr, Warn-Badges
  src/components/BuildQueue.tsx      Fortschrittsbalken für Bau-Warteschlangen
  src/components/InfoModal.tsx       Popup mit vollem Detailwissen
  src/components/ShipBuildCard.tsx / DefenseBuildCard.tsx   Wiederverwendbare Baukarten
  src/components/ShipModuleRow.tsx / DefenseModuleRow.tsx   Module, hängen per Verbindungslinie
                                      direkt unter der jeweiligen Baukarte (kein eigener Tab)
  src/components/StatValue.tsx       Waffen/Schild/Panzerung farbig, inkl. Effektivwert
  src/components/ErrorBoundary.tsx   Fängt Render-Fehler ab statt stillem Absturz
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
  aktuell 1x/Woche, Sonntag 0 Uhr deutscher Zeit, garantiert (Chance 1.0) für beide bekannten
  Nutzernamen. Unbekannte Namen fallen auf den allgemeinen Rhythmus mit `RAID_SPAWN_CHANCE` zurück.
- Globale Warn-Hinweise für laufende Raids in `ResourceBar.tsx` (`.alert-badge`), Klick führt per
  Query-Parameter direkt zum passenden Tab.

### Kampfsystem

- Feindstärke skaliert ausschließlich auf Basiswerten der Schiffe/Verteidigung, NIE auf
  Spieler-Forschung (`combatFleetPowerBase()`) - Piraten/Raids/Multiplayer-Sektoren profitieren
  nicht davon. Eigene Kampfleistung bleibt regulär forschungsabhängig.
- Piraten/NPCs bekommen `PIRATE_RESEARCH_SHARE` (aktuell 100%) der Forschungseffekte
  (`computePirateResearch()` in `combat.ts`) - bei Mehrspieler-Kämpfen der Durchschnitt aller
  Beteiligten. Klassen-Bonus/Module/Kampf-Booster bleiben exklusiv beim Spieler.
- Gestaffelter Einzelschiff-Rückzug (`UNIT_RETREAT_THRESHOLD = 0.3`): jedes Schiff auf Seite A
  entscheidet einzeln anhand seines eigenen HP-Anteils, kein Alles-oder-Nichts mehr. Gilt NICHT für
  Heimverteidigung bei Raids (`allowRetreat:false`). `result.retreated` ist NICHT mehr automatisch
  exklusiv zu "alle Gegner vernichtet" - Auswertungscode muss zusätzlich prüfen, ob der Gegner
  wirklich noch lebt.
- RapidFire folgt einer 1:1-Rollenverteilung (`RAPIDFIRE`-Tabelle), keine Häufung auf einzelne
  Klassen; Salvenschiffe sind komplett RF-immun. NPC-RF gegen `leicht`/`schwer` ist halbiert
  (`NPC_RF_VS_JAEGER_FACTOR = 0.5`), damit eigene Jäger nicht unabhängig von der Stückzahl fast
  immer zuerst sterben.
- Größenklassen-Ausweichbonus (`SHIP_SIZE_CLASS`/`SIZE_MISMATCH_EVASION_BONUS`): Jäger bekommen
  +45, Kreuzer +18 Prozentpunkte Ausweichchance gegen große/Elite-/Spezialschiffe (nicht
  umgekehrt) - gibt kleinen Schiffen eine Tank-/Ausweich-Rolle statt reiner Bedeutungslosigkeit.
- Durchschlag (Overkill) auf 50% Maximalwert gedeckelt (`effectPerLevel` in `research.ts`), sonst
  könnte ein Treffer bis zu 5 Schiffe desselben Typs auf einmal vernichten (`MAX_CASCADE = 5`).
- Verteidigungsanlagen-Waffenwerte an Schiffs-Kosteneffizienz gekoppelt, zählen NICHT in die
  Raid-Feindstärke ein (sonst würde zähere Verteidigung stärkere Angreifer heraufbeschwören).
- Schildkuppeln bilden einen gemeinsamen Pool (`computeDomeSharedPool()`) statt Pro-Einheit-
  Verteilung - fängt Schaden für die GESAMTE Verteidigungsseite ab, bevor eine Anlage getroffen
  wird. Wendet Forschung, Klassen-Bonus, Kampf-Booster UND Schild-Module an wie jede andere Anlage.
- Drei Salvenschiffe + zwei Salve-Verteidigungsanlagen (`MULTI_TARGET_VOLLEY_SHIPS`) treffen bei
  Zielerfassung jeden präsenten anfälligen Typ - extreme Waffenwerte, wenig Schild/Panzerung,
  RF-immun. MÜSSEN aus jeder Piraten-/NPC-Flottengenerierung ausgeschlossen werden.
- Kampf-Statistiken sind besitzer-bewusst indiziert (`` `${ownerKey}:${typeId}` ``), sonst zeigen
  zwei Teilnehmer mit demselben Schiffstyp identische aggregierte Werte.
- Präzision/Schild-Regen sind größenabhängig (kleine Schiffe treffen besser, laden schlechter).
- Kampfbericht führt `dmgDealt` und `dmgTaken` getrennt - eine niedrige "erlitten"-Zahl ist starke,
  nicht schwache Feuerkraft.
- Wellen-Vielfalt: drei Zusammensetzungs-Profile (`pickWaveProfile()`), Wellen-Ausreißer, seltene
  Kampf-Modifikatoren (Nebel/Ionensturm/usw.) - nie vorher in der UI angekündigt.
- Kampfsimulator (`simulator.ts`, `/game/simulate`) verändert NIE den Spielstand, nutzt aber
  exakt dieselbe Engine wie der echte Ablauf und erlaubt auch nicht besessene Schiffe.
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
- Piraten-Sektor Solo (Niedrig/Mittel/Hoch): nur EINE Stufe gleichzeitig beflogbar (serverseitig
  UND clientseitig geblockt). Reine Container-Belohnung (`winContainer` in `SektorConfig`) pro
  gewonnenem Check (`Mission.combatWins`), ausgezahlt erst bei Rückkehr - kein `lootBase` mehr.
- Elite-Bollwerk: Beute verdoppelt sich pro Sieg in Folge (`streakWins`), bei perfekter Serie über
  alle 6 Checks zusätzlicher Abschluss-Bonus (Gesamtausbeute nochmal verdoppelt). Solo nutzbar
  (0 Eingeladene = Ersteller allein).
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
  zusammen. Minen verbrauchen Energie, fehlt sie wird die Produktion ALLER Minen gemeinsam
  gedrosselt (`energyFactor()`, nie ein Bonus bei Überschuss). Roboter-/Nanitenfabrik verkürzen
  Bauzeiten multiplikativ pro Stufe (stapeln sich).
- Forschungsbaum: 4 Hauptbereiche (waffen/verteidigung/antrieb/wirtschaft), eigene Untertabs,
  Voraussetzungs-Schwelle Stufe 3 pro Eltern-Kind-Verbindung, `MAX_RESEARCH_LEVEL = 10`.
- Gebäude-/Schiffs-/Verteidigungs-Module: je 2-3 (Gebäude) bzw. 4 (Schiffe: Waffen/Schild/
  Panzerung/Antrieb, Verteidigung: ohne Antrieb) Zusatzausbauten, Stufenlimit 10. Hängen per
  Verbindungslinie direkt unter der jeweiligen Bau-/Forschungskarte, kein eigener Tab. Eigene
  Bau-Slots (`MAX_SHIP_MODULE_SLOTS`/`MAX_DEFENSE_MODULE_SLOTS = 3`), unabhängig von den 3
  normalen Bauplätzen. Verteidigungs-Modul-Stufen leben in derselben Map wie Schiffs-Module.
- Zeit-Gutscheine sind pro Bereich getrennt (Schiffe/Verteidigung/Gebäude/Forschung) - Schiffe/
  Verteidigung wirken auf ALLE belegten Lanes, Gebäude/Forschung auf ihren einen bzw. alle Slots.
- Imperator: Waffen 500.000 / Schild 400.000 / Panzerung 3.000.000 (`ships.ts`) - bewusst
  panzerungslastig, zäher Brocken statt Ein-Schlag-Gewinner. Baulimit 2, eigene Spezialteile-
  Kosten. Zählt zur Heimatverteidigung bei Raids (`HOME_DEFENSE_SHIP_IDS`).

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
  sowohl lazy beim Laden als auch über den globalen Heartbeat.

### KI-Spieler & Piratenbasen

- Zwei Bot-Accounts (KI-Vega/KI-Nyx, `is_bot`-Flag, `ensureBotUsers()` bei Serverstart) - nutzen
  exakt dieselben Aktionsfunktionen wie ein Mensch. `runBotTurn()` läuft im Heartbeat NACH
  `tick()`/`processMissions()`/`processRaidTimer()` (Reihenfolge kritisch - siehe Kernbugfix
  unten). Wirtschafts-Entscheidungslogik (`runEconomyBotTurn()` in `economyBotTurn.ts`, geteilt
  mit Piratenbasen) ungedrosselt, da ohne Kampf-Risiko. Kampfauslösende Aktionen (Piratenbasis-
  Angriff, `piraten_elite`-Beitritt) sind eigens gedrosselt (`BOT_COMBAT_ACTION_CHANCE`) UND
  vergleichen vorab die eigene gegen die gegnerische Gesamtstärke (`combatFleetPowerBase()`,
  `ATTACK_POWER_SAFETY_MARGIN` = 1,15) - nur bei klarem Vorteil wird tatsächlich angegriffen,
  sonst wächst die Flotte erst weiter.
- **Piratenbasen** (`pirateBaseState.ts`, `PirateBaseState`): 4 der 12 möglichen Positionen aktiv,
  vollwertiger `PlayerState` pro Basis (synthetische negative `userId`, taucht nie in
  `listAllUsers()` auf). Wachsen wie ein Spieler (`runEconomyBotTurn()` bei jedem Laden),
  ungedrosselt. Feste Mindest-Garnison (`SEED_FLEET`/`SEED_DEFENSE`, ~5.300 Schiffe/~1.120
  Verteidigungsanlagen) als Floor-Up bei jedem Laden - kann nur stärker werden, nie schwächer;
  "unzerstörbare Basis". `RESOURCE_CAP` verhindert unbegrenztes Ressourcen-Wachstum.
  Offensiv-KI greift Spieler/Bots selbst an (`runAllPirateBaseOffensiveTurns()`, einmal pro
  Heartbeat), aber mit langem Cooldown (`PIRATE_BASE_OFFENSIVE_COOLDOWN_MIN/MAX_MS`, 48-96h pro
  Basis) UND derselben Stärke-Abwägung wie die Bots (`PIRATE_BASE_ATTACK_POWER_SAFETY_MARGIN`).
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
  `enemiesDestroyed`-Zähler bleibt nur für die Statistik-Anzeige.
- "Gesamtmacht" (aktuelle Flotte/Verteidigung, `calculateFleetPowerPoints()`) fließt zusätzlich
  ein - einzige Kategorie, die bei Verlust wieder SINKEN kann. Forschung/Container/Ressourcen-
  Beute/eigene Verluste bewusst NICHT in der Punktzahl.

### Frontend-Konventionen

- `InfoTable`/`InfoModal`-Zeilen nutzen `.info-list`/`.info-list-row`, nicht rohe Tabellen.
- Händler/Schrotthändler nutzen `ship-grid`/`ship-card` mit Bildern, Ressourcentausch über
  anklickbare Icon-Chips statt `<select>`.
- Rohe interne IDs/Enums nie direkt anzeigen - immer über Lookup/Label-Map in lesbaren Text.
- Baubarkeit und Einsetzbarkeit in Missionen sind zwei getrennte Schalter - bei neuen
  Kampfschiffen müssen beide gesetzt werden (`ships.ts` fürs Bauen, `COMBAT_SHIP_IDS` fürs
  Einsetzen, inkl. aller Client-Kopien).
- Ein einziges, festes Hintergrundbild für die gesamte App - ein Per-Route-System wurde nach
  wiederholten Ladeproblemen zurückgebaut, kein neuer Anlauf ohne Absprache.

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
