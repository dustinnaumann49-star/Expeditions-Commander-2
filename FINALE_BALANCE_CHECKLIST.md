# Finale Balance-Checkliste (Stand 05.08.2026)

Vorbereitet für den geplanten kompletten Balance-Check mit Opus/höchstem Aufwand vor dem Release.
Ziel: nicht bei Null anfangen, sondern auf dieser Session aufbauen. Vollständige Details zu jedem
Punkt stehen in den referenzierten Memory-Dateien (`~/.claude/projects/.../memory/`).

## 🗂️ Empfohlene Aufteilung in 4 separate Opus-Sessions

Damit keine einzelne Session am Kontextlimit scheitert - jede Session bekommt nur die Dateien/
Themen, die sie wirklich braucht. Reihenfolge 1→4 empfohlen (Wirtschaft zuerst, da sie beeinflusst,
wie "teuer" sich Kampfverluste in Session 2/3 anfühlen).

**Session 1 - Wirtschaft**
- Gebäude V1/V2/V3 (Minen, Solar, Roboter-/Nanitenfabrik) - Kosten-/Ertragskurven, ob die
  V2/V3-Schwellen (36/32/30) nach echtem Spielverlauf noch passen
- Forschungsbaum - Kosten/Zeit, Verzweigungen, lohnen sich hohe Stufen noch
- Asteroidenfeld (Niedrig/Mittel/Hoch) - Ertragsraten, Eskorte, Zusammenspiel Frischling-Bonus +
  neuer Di/Do-Event-Bonus
- Schrotthändler/Teile-Umwandlung/Handel, Wirtschafts-Klassen, Shop (Booster/Gutscheine)

**Session 2 - Kampf (PvE-Inhalte)**
- Piraten-Sektor Niedrig/Mittel/Hoch (diese Session gefixt - eher verifizieren als neu suchen)
- Elite-Bollwerk (diese Session gefixt - volle 6-Check-Serie noch nicht live durchgespielt)
- **Piratenadmiral** - diese Session komplett unangetastet, eigene Aufmerksamkeit nötig
  (Eskalation, Extraktions-Mechanik, Boss-Skalierung)
- Raid-Event - neue 2x/Woche-Frequenz über mehrere echte Wochen beobachten

**Session 3 - Schiffe, Verteidigung & Module**
- Schiffsbalance (Tier-Progression, RapidFire-Kette, Spezialschiffe/Sandronator/Imperator)
- Verteidigungsanlagen (Kosten/Werte-Progression, Sentinel-/Ultimate-Kanone)
- Kampf-Klassen (Kanonier/Bollwerk/Kommandant) - gleich attraktiv?
- Schiffs-/Verteidigungs-Module (Stufe-10-Deckel, Kosten)

**Session 4 - Multiplayer & Rest**
- Allianz-Station (V1/V2/V3) - diese Session nicht angefasst, Abgleich mit neuem
  Heimatbasis-System sinnvoll
- Galaxie-Ereignisse, Piratenbasen-Angriffe, Spionage
- Statistik/Punktesystem
- Zum Schluss: Gesamt-Konsistenz-Check (README/Changelog vollständig? Nichts vergessen?)

## ✅ Diese Session bereits geprüft + gefixt (nicht erneut von vorne prüfen)

- **Piraten-Sektor Niedrig/Mittel/Hoch**: Feindstärke-Tabelle (`PIRATEN_MULTIPLIER_ROLL`) korrigiert,
  Härte-Reihenfolge Niedrig<Mittel<Hoch<Elite wiederhergestellt. Live vom Nutzer bestätigt: Hoch ist
  bei vollem Ausbau gut machbar. → `project_piraten_balance_fix_2026_08_05.md`
- **Elite-Bollwerk**: Feindstärke gesenkt, `computePirateResearch()` nutzt jetzt Minimum statt
  Durchschnitt der Gruppen-Forschung (verhindert Bestrafung schwächerer Mitspieler), `defenseFactor`
  gesenkt (NPC-Verteidigung war praktisch unzerstörbar), Schild-Regen der Verteidigungsanlagen nach
  Tier gestaffelt statt pauschal. Belohnung (`lootBase`/`winResources`) mehrfach nachjustiert - **wichtige
  Lektion dabei**: bei Belohnungen mit Serien-Eskalation (`REWARD_ESCALATION`) immer die volle
  Eskalationskurve durchrechnen, bevor Basiswerte multipliziert werden. Live über 4 Checks bestätigt:
  Verlustrate fiel von 31%→37%→15%→5,9%, Verlust-Gefälle zwischen Mitspielern auf Modul-Niveau
  geschrumpft. → `project_piraten_balance_fix_2026_08_05.md`
- **Raid-Event**: Simulation zeigte gute Balance (0/15 Totalverluste), besonders mit
  Verstärkungs-Mechanik (zählt NICHT zur Feindstärke-Berechnung). Keine Änderung nötig.
- **Home-Base V2/V3-Gebäudestufen**: neues Feature, analog Allianz-Station aber unbegrenzt
  ausbaubar. Unlock-Schwellen 36/32/30. → `project_home_building_v2v3_2026_08_05.md`
- **Wöchentlicher Event-Kalender**: neues Feature (Mo/Fr Piraten-Bonus, Di/Do Asteroiden-Bonus,
  Mi/So Raid 2x/Woche, Sa Bauzeit-Bonus). → `project_weekly_event_calendar_2026_08_05.md`
- **Teile-Umwandlung**: neues Feature beim Schrotthändler, Rate vom Nutzer bei 16k Teilen live
  bestätigt. → `project_teile_conversion_2026_08_05.md`
- **Kampfbericht-Transparenz**: zeigt jetzt reale Feindstärke in % statt nur "Normale Welle".

## 🔍 Noch offen / sollte im Finale-Check verifiziert werden

1. **Raid-Frequenz-Verdopplung (Mi+So statt nur So)**: NEU, noch nicht live über mehrere Wochen
   beobachtet. Prüfen: verdoppelt sich die Wiederaufbaulast spürbar? Ggf. mit derselben Methode wie
   beim Elite-Bollwerk (`simulateCombat`-artige Simulation über mehrere Wellen) gegenchecken.
2. **Elite-Bollwerk-Belohnung (`winResources` + `lootBase`)**: Rate wurde rechnerisch kalibriert
   (~13,5 Mrd./Spieler bei voller 6-Check-Serie), aber noch nicht über eine KOMPLETTE Serie (alle 6
   Checks) live verifiziert, ob das Ressourcen-Verhältnis wirklich gut passt.
3. **Elite-Bollwerk-Eskalation `2^6=64x`**: aus einer früheren Session als "Nutzer beobachtet,
   noch nicht als zu stark bestätigt" vermerkt - erneut anschauen, ob die Grundeskalation selbst
   (unabhängig von der schon gefixten Belohnungshöhe) zu extrem ist. → `project_elite_bollwerk_escalation_watch.md`
4. **`STACK_AGGREGATE_THRESHOLD`** (300→1200 angehoben 29.07.2026): Nutzer wollte live beobachten,
   ob weitere Anhebung sinnvoll ist - noch keine abschließende Entscheidung. → `project_stack_threshold_reconsideration.md`
5. **Mission-Crash-Ursache**: Symptom (fehlender Bericht bei Totalverlust) gefixt, aber die
   eigentliche root cause (was genau abstürzte) nie gefunden, da keine Server-Logs vom Vorfall
   vorlagen. Falls in Coolify-Logs je wieder `processMissions: Fehler bei Mission...` auftaucht,
   das dann gezielt untersuchen. → `project_mission_crash_root_cause_open.md`
6. **NPC-Verteidigung generell (nicht nur Elite-Bollwerk)**: der gefundene Fehler (pauschaler
   Schild-Regen, siehe oben) betraf `SHIELD_REGEN_BASE_BY_CLASS` global - geprüft nur im
   Elite-Bollwerk-Kontext. Ggf. auch bei Piratenadmiral (P10) / Raids gegenchecken, ob dort
   ähnliche NPC-Verteidigungs-Stacks unverhältnismäßig tanky sind.

## 📋 Von dieser Session NICHT angefasste Bereiche (für "komplett" noch zu prüfen)

Diese Bereiche wurden diese Session nicht untersucht - für einen wirklich vollständigen Check
gehören sie in den Umfang:

- **Forschungsbaum** (`research.ts`): Kosten-/Zeitkurven, Verzweigungen, ob alle Endstufen sinnvoll
  erreichbar sind.
- **Schiffsbalance** (`ships.ts`): RapidFire-Kette, Klassen-Rollen (Jäger/Kreuzer/Elite/Spezial),
  Salvenschiffe, Sandronator, Imperator - wurden zuletzt am 04.08. umgebaut, seitdem nicht erneut
  systematisch gegengeprüft.
- **Verteidigungsanlagen-Balance** außerhalb NPC-Kontext (eigene Heimatverteidigung: Kosten,
  RapidFire, Sentinel-/Ultimate-Kanone-Mehrfachziel).
- **Klassensystem** (Kampf-Klassen Kanonier/Bollwerk/Kommandant, Wirtschafts-Klassen
  Schmuggler/Ingenieur/Prospektor) - Kostenmultiplikatoren, ob alle drei/drei gleichwertig
  attraktiv sind.
- **Allianz-Station** (V1/V2/V3, eigenes System) - seit Einführung nicht erneut balanciert.
- **Galaxie-Ereignisse, Piratenbasen-Angriffe, Spionage** - eigene Wirtschaftskreisläufe, diese
  Session nicht angerührt.
- **Statistik/Punktesystem** - zuletzt im Juli umgebaut, seitdem nicht erneut geprüft.
- **Shop-Booster/Zeit-Gutscheine** - Preis-Leistungs-Verhältnis nicht diese Session untersucht.

## 🧰 Werkzeuge, die sich bewährt haben

- `simulateCombat()` (`server/src/game/simulator.ts`) für Kampf-Balance-Simulationen (mehrere
  Forschungs-/Modul-Profile durchrechnen, NICHT nur Einzellauf wegen Zufallsstreuung).
- Kleine Testskripte via `npx tsx` im scratchpad für serverseitige Logikverifikation (Tier-Unlock,
  Event-Kalender-Wochentage, Umwandlungs-Funktionen) - schneller und günstiger als Browser-Tests für
  reine Logikfragen.
- Browser-Verifikation (Registrierung + Login mit Test-Account) für UI-Änderungen, aber nur wenn
  wirklich UI betroffen ist - für reine Balance-/Zahlen-Fragen reicht die Simulation.
- **Wichtigste Lektion der Session**: bei Belohnungssystemen mit Eskalation/Serien-Bonus IMMER die
  volle Kurve über die gesamte mögliche Serie durchrechnen, bevor an einem Basiswert gedreht wird -
  ein flacher Multiplikator auf einer bereits exponentiellen Basis explodiert schnell weit über das
  beabsichtigte Ziel hinaus.
