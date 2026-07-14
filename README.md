# Expeditions-Commander – React + Backend

Vollständige Server-seitige Neufassung des ursprünglichen Einzeldatei-HTML-Prototyps. Die komplette
Spiellogik läuft auf einem Node/Express-Backend mit SQLite, das Frontend ist ein React + TypeScript
Client. Vorbereitet für Bereitstellung auf Render.com (siehe `render.yaml`).

## Projektstruktur

```
/server   Node + Express + TypeScript Backend, SQLite-Datenbank, komplette Spiellogik
/client   React + TypeScript Frontend (Vite)
render.yaml   Render.com Blueprint fuer die Bereitstellung (Server + Client als zwei Services)
```

## Lokal starten

**Voraussetzung:** Node.js 20+ installiert.

```bash
# Terminal 1 - Backend
cd server
npm install
cp .env.example .env      # ggf. Werte anpassen (JWT_SECRET etc.)
npm run dev                # startet auf http://localhost:4000

# Terminal 2 - Frontend
cd client
npm install
npm run dev                # startet auf http://localhost:5173
```

Dann im Browser `http://localhost:5173` öffnen, registrieren, loslegen. Der Vite-Dev-Server leitet
alle `/api`-Aufrufe automatisch an das Backend auf Port 4000 weiter.

**Hinweis zu `npm run dev` im Server:** Startet automatisch zwei Prozesse gleichzeitig (`tsc --watch`
+ `tsx watch`). Der Grund: Die Kampfberechnung läuft in einem separaten Worker-Thread (siehe unten),
und dieser Worker braucht aus technischen Gründen immer die fertig kompilierte Version aus `dist/` -
auch während der Entwicklung. `tsc --watch` hält `dist/` automatisch aktuell, du musst dich darum
nicht kümmern.

## Funktionsumfang (alles getestet, siehe unten)

**Account & Grundgerüst**
- Registrierung/Login mit Passwort-Hashing (bcrypt) + JWT-Sitzungen, SQLite-Datenbank
- Zustandsloses "Nachhol"-Prinzip (`tick()` in `server/src/game/actions.ts`): bei jedem Laden des
  Spielstands wird die seit dem letzten Zugriff verstrichene Zeit vollständig nachverarbeitet
  (Bau-/Forschungs-Warteschlangen, Missionen, Events, Raids) - kein Dauer-Prozess auf dem Server nötig

**Kampf-Engine** (`server/src/game/combat.ts`)
- 1:1 aus dem HTML-Prototyp portiert: RapidFire, Zielerfassung, Präzision, Durchschlag, Schild-Regeneration
- **Läuft in einem separaten Worker-Thread** (`server/src/game/combatRunner.ts` + `combat.worker.ts`),
  nicht im Haupt-Thread des Servers. Dadurch blockiert auch ein sehr großer Kampf (z.B. eine gemeinsame
  Multiplayer-Flotte im Piraten-Sektor) niemals die Anfragen anderer Spieler - getestet mit einer
  Flotte von 2.000+ Schiffen gegen eine entsprechend große NPC-Flotte, lief sauber im Hintergrund
- **Keine harten Maxima mehr pro Schiffs-/Verteidigungstyp** (nur noch Sandronator [1] und Imperator [2]
  bleiben absichtlich limitiert, sowie die beiden Schildkuppeln aus Balance-Gründen). Ein grobes
  Sicherheitsnetz (`MAX_PLAYER_SHIPS`, aktuell 100.000) verhindert nur noch unbegrenztes Wachstum,
  ist aber kein Performance-Limit mehr - das übernimmt jetzt der Worker-Thread
- `generateCappedFleet` verteilt NPC-Flotten weiterhin gewichtet, respektiert aber nur noch die
  wenigen verbliebenen echten Maxima (Domes, Imperator) statt eines Limits pro Schiffstyp

**Alle Spielbereiche**
- **Schiffswerft** – Schiffe bauen, Live-Kostenanzeige
- **Verteidigung** – Verteidigungsanlagen bauen, gleiches Prinzip
- **Forschung** – 10 Technologien, 2 parallele Slots
- **Sektor** – Asteroiden-Felder (Farmen mit Mining-Schiffen), Piraten-Sektoren (Kampf + Teile-Sammlung),
  Notruf-Events (Verbündete + Belohnung), Raid-Warnung auf die Heimatbasis, Flotten-Vorlagen (Presets)
  zum Speichern/Wiederverwenden häufiger Zusammenstellungen
- **Flotte (Bestand)** – Übersicht aller Schiffe inkl. unterwegs befindlicher Missionen
- **Händler** – Ressourcentausch mit Handelsspanne
- **Schrotthändler** – Schiffe/Verteidigung gegen Ressourcen verschrotten
- **Spezialteile** – Imperator aus gesammelten Kampf-Teilen bauen (limitiert auf 2 Exemplare)
- **Shop** – Booster (24h) und Zeit-Gutscheine gegen Dunkle Materie
- **Nachrichten** – Kampf-/Farmberichte mit aufklappbaren Detailansichten (Schüsse, Treffer,
  Schild-Werte pro Einheit)
- **Inventar** – Silber-/Gold-Container öffnen, Belohnungen einzeln einlösen
- **Multiplayer** – Gemeinsame Expeditionen in Piraten-Sektoren und gemeinsame Notruf-Events:
  Ersteller lädt Spieler per Name ein, Eingeladene nehmen mit eigener Flotte an oder lehnen ab,
  Ersteller startet manuell (auch allein, falls niemand beitritt). **Belohnungen werden nie geteilt** -
  jeder Teilnehmer bekommt exakt das, was er auch bei einem Solo-Flug mit diesem Kampfausgang bekommen
  hätte (volle Beute, volle Teile, eigener Container). Überlebende Schiffe gehen an ihren jeweiligen
  Besitzer zurück. Jeder Kampfbericht (auch die stündlichen Zwischenberichte) ist aufklappbar mit
  vollständiger Detailansicht wie im Solo-Spiel, Flotten sind darin nach Spielername gruppiert
  aufgelistet. Kampfberechnung läuft über denselben Worker-Thread wie Solo-Kämpfe
- **Sektor P9 – Elite-Bollwerk**: eigener Sektor, nur über gemeinsame Expeditionen erreichbar
  (Solo-Versand wird abgelehnt). Piraten skalieren mit 200% der kombinierten Flottenstärke aller
  Teilnehmer, zusätzlich zur normalen Beute/Teile-Sammlung gibt es eine Zeit-basierte
  Ressourcen-Belohnung (bis zu 20.000.000 Metall, 16.000.000 Kristall, 10.000.000 Deuterium pro
  Teilnehmer über die volle 4h, analog zum Asteroiden-Feld) - entsprechend hohe Gefahrenstufe
- **Raid-Hilfe** – Eigener Tab: zeigt alle laufenden Piratenangriffe auf andere Spieler-Basen,
  jeder kann mit 1 Minute Anflugzeit eigene Schiffe zur Verstärkung schicken. Verstärker bekommt
  einen eigenen Container (wie ein Verteidiger auch), sieht dieselbe vollständige Detailansicht wie
  der Verteidiger, Überlebende kehren zum Absender zurück

**Design**
- Komplettes Original-Farbschema aus dem HTML-Prototyp übernommen (`client/src/theme.css`)
- Bilder für Schiffe, Verteidigung, Forschung, Sektoren, Booster, Ressourcen-Icons (Ressourcenleiste)
  und Händler-/Schrotthändler-Banner eingebunden - liegen unter `client/public/` (siehe Ordnerliste
  weiter unten)

## Was noch fehlt / bekannte Vereinfachungen

- **Kein Echtzeit-Update über WebSockets** - das Frontend pollt den Zustand alle 5 Sekunden. Für bis
  zu 5 Spieler unkritisch, bewusste Design-Entscheidung (kein offener Punkt, kein Nachrüstbedarf)

Erledigt seit der letzten Version (nicht mehr offen):
- ~~Flotten-Vorlagen (Presets)~~ - umgesetzt (speichern, laden, löschen), Backend + Frontend getestet
- ~~UI ohne Bilder/Styling~~ - komplettes Original-Farbschema (`client/src/theme.css`) sowie Bilder für
  Schiffe, Verteidigung, Forschung, Sektoren, Booster, Ressourcen-Icons und Händler-Banner eingebunden
- ~~Piratenkapitän-Container ohne Silber/Gold-Unterscheidung im Text~~ - Nachrichtentext nennt jetzt
  den korrekten Container-Tier
- ~~Flotten-Maxima als reines Performance-Notbehelf~~ - entfernt, Kampfberechnung laeuft jetzt in
  einem Worker-Thread statt im Haupt-Thread

## Bilder (client/public/)

Damit die Bilder aus dem HTML-Prototyp angezeigt werden, müssen folgende Ordner/Dateien unter
`client/public/` liegen (Vite liefert alles darin automatisch unter der Root-URL aus):

```
client/public/ships/...
client/public/defense/...
client/public/research/...
client/public/sektoren/...
client/public/booster/...
client/public/ui/...                    (haendler.png, schrotthaendler.png)
client/public/resources/...             (metall.png, kristall.png, deuterium.png, dunkle_materie.png)
client/public/background/hauptbild.png
```

Der Ordner `resources/` aus dem alten HTML-Repo (Rohstoff-Icons) wurde nicht übernommen, da er dort
nie referenziert wurde - im React-Client hat `resources/` jetzt aber eine neue, tatsächlich genutzte
Bedeutung (Icons für die Ressourcenleiste), siehe oben.

## Deployment auf Render.com

1. Dieses Projekt in ein neues GitHub-Repo pushen
2. Auf Render.com "New Blueprint" wählen, das Repo verbinden – `render.yaml` wird automatisch erkannt
   und legt zwei Services an (Server als Web Service mit persistentem Disk für die SQLite-Datei,
   Client als Static Site)
3. Nach dem ersten Deploy: `CLIENT_ORIGIN` beim Server und `VITE_API_BASE` beim Client in den
   Render-Umgebungsvariablen auf die tatsächlich zugewiesenen `.onrender.com`-URLs prüfen/anpassen

## Getestet, nicht nur geschrieben

Jeder Baustein wurde über echte HTTP-Requests gegen den laufenden Server verifiziert (nicht nur
TypeScript-typgeprüft): Registrierung/Login, Schiffs-/Verteidigungsbau, Forschung, Asteroiden-Mission
mit mehrstündigem Zeitraffer-Test (Farmertrag exakt nach Formel), Missions-Rückruf mit
Ressourcengutschrift, Raid-Simulation, Notruf-Event mit Verbündeten und Container-Belohnung,
Händler-Tausch, Booster-Kauf. Client kompiliert typsicher und baut fehlerfrei (`npm run build` in
beiden Ordnern).

**Multiplayer speziell getestet** (mit zwei echten Testnutzern, komplettem Ablauf über HTTP):
gemeinsame Expedition erstellen → Einladung sichtbar beim eingeladenen Spieler → Beitritt mit eigener
Flotte → Start durch Ersteller → nach Zeitraffer korrekte anteilige Aufteilung von Beute und
Überlebenden bei beiden Teilnehmern (63%/38% bei 50/30 eingebrachten Schiffen, exakt proportional).
Raid-Verstärkung: zweiter Spieler sieht aktiven Raid eines anderen Nutzers, schickt Verstärkung,
nach Auflösung erhält jeder Beteiligte einen eigenen, korrekten Kampfbericht.

Beim Testen wurden dabei zwei echte Bugs gefunden und behoben, die beim erstmaligen Bau nicht
aufgefallen wären: (1) Kampf-Beitrag-Objekte enthielten Funktionen, die nicht an den Worker-Thread
übergeben werden können (behoben: nur noch reine Forschungsdaten werden übergeben, die Berechnung
passiert im Worker selbst) und (2) der Spielstand des Nutzers, dessen eigener Seitenaufruf die
Auflösung einer gemeinsamen Mission auslöst, wurde doppelt geladen und die äußere Route
überschrieb das Ergebnis mit veralteten Daten (behoben: das bereits geladene State-Objekt wird jetzt
konsequent wiederverwendet statt erneut geladen).

## Wichtiger Hinweis zur Datenbank

SQLite wurde bewusst gewählt (kein separater Datenbank-Server nötig, eine einzelne Datei) – passt gut
zu "maximal 5 Spieler, Hobby-Projekt". Falls das Spiel später deutlich mehr Spieler bekommt, wäre
ein Umstieg auf Postgres (z.B. Render's verwaltete Postgres-Datenbank) der nächste sinnvolle Schritt.
