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

## Funktionsumfang (alles getestet, siehe unten)

**Account & Grundgerüst**
- Registrierung/Login mit Passwort-Hashing (bcrypt) + JWT-Sitzungen, SQLite-Datenbank
- Zustandsloses "Nachhol"-Prinzip (`tick()` in `server/src/game/actions.ts`): bei jedem Laden des
  Spielstands wird die seit dem letzten Zugriff verstrichene Zeit vollständig nachverarbeitet
  (Bau-/Forschungs-Warteschlangen, Missionen, Events, Raids) - kein Dauer-Prozess auf dem Server nötig

**Kampf-Engine** (`server/src/game/combat.ts`)
- 1:1 aus dem HTML-Prototyp portiert: RapidFire, Zielerfassung, Präzision, Durchschlag,
  Schild-Regeneration, Maxima+Überlauf-Verteilung für NPC-Flotten (`generateCappedFleet`)

**Alle Spielbereiche**
- **Schiffswerft** – Schiffe bauen, Maxima pro Typ, Live-Kostenanzeige
- **Verteidigung** – Verteidigungsanlagen bauen, gleiches Prinzip
- **Forschung** – 10 Technologien, 2 parallele Slots
- **Sektor** – Asteroiden-Felder (Farmen mit Mining-Schiffen), Piraten-Sektoren (Kampf + Teile-Sammlung),
  Notruf-Events (Verbündete + Belohnung), Raid-Warnung auf die Heimatbasis
- **Flotte (Bestand)** – Übersicht aller Schiffe inkl. unterwegs befindlicher Missionen
- **Händler** – Ressourcentausch mit Handelsspanne
- **Schrotthändler** – Schiffe/Verteidigung gegen Ressourcen verschrotten
- **Spezialteile** – Imperator aus gesammelten Kampf-Teilen bauen (limitiert auf 2 Exemplare)
- **Shop** – Booster (24h) und Zeit-Gutscheine gegen Dunkle Materie
- **Nachrichten** – Kampf-/Farmberichte mit aufklappbaren Detailansichten (Schüsse, Treffer,
  Schild-Werte pro Einheit)
- **Inventar** – Silber-/Gold-Container öffnen, Belohnungen einzeln einlösen

## Was noch fehlt / bekannte Vereinfachungen

- **Fleeten-Vorlagen (Presets)** aus dem HTML-Prototyp (Flotten-Zusammenstellung als Vorlage speichern)
  wurden nicht übernommen - optionales Komfort-Feature, kein Kernmechanismus
- **UI ist bewusst schlicht gehalten** (Inline-Styles, keine Bilder/Icons eingebunden) - der HTML-
  Prototyp hatte deutlich mehr visuellen Schliff (Sci-Fi-Design, Bilder pro Schiff/Sektor). Das
  Nachrüsten von Bildern/CSS ist rein kosmetisch und unabhängig von der Spiellogik nachholbar
- **Kein Echtzeit-Update über WebSockets** - das Frontend pollt den Zustand alle 5 Sekunden. Für bis
  zu 5 Spieler unkritisch
- **Piratenkapitän-Container-Tier** wird beim Sieg korrekt vergeben, aber ohne die feine
  Icon-Unterscheidung (Silber/Gold) im Nachrichtentext des HTML-Prototyps

## Deployment auf Render.com

1. Dieses Projekt in ein neues GitHub-Repo pushen
2. Auf Render.com "New Blueprint" wählen, das Repo verbinden – `render.yaml` wird automatisch erkannt
   und legt zwei Services an (Server als Web Service mit persistentem Disk für die SQLite-Datei,
   Client als Static Site)
3. Nach dem ersten Deploy: `CLIENT_ORIGIN` beim Server und `VITE_API_BASE` beim Client in den
   Render-Umgebungsvariablen auf die tatsächlich zugewiesenen `.onrender.com`-URLs prüfen/anpassen

## Getestet, nicht nur geschrieben

Jeder Baustein wurde über echte HTTP-Requests gegen den laufenden Server verifiziert (nicht nur
TypeScript-typgeprüft): Registrierung/Login, Schiffs-/Verteidigungsbau inkl. Maxima-Sperren,
Forschung, Asteroiden-Mission mit mehrstündigem Zeitraffer-Test (Farmertrag exakt nach Formel),
Missions-Rückruf mit Ressourcengutschrift, Raid-Simulation, Notruf-Event mit Verbündeten und
Container-Belohnung, Händler-Tausch, Booster-Kauf. Client kompiliert typsicher und baut fehlerfrei
(`npm run build` in beiden Ordnern).

## Wichtiger Hinweis zur Datenbank

SQLite wurde bewusst gewählt (kein separater Datenbank-Server nötig, eine einzelne Datei) – passt gut
zu "maximal 5 Spieler, Hobby-Projekt". Falls das Spiel später deutlich mehr Spieler bekommt, wäre
ein Umstieg auf Postgres (z.B. Render's verwaltete Postgres-Datenbank) der nächste sinnvolle Schritt.
