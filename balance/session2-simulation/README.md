# Session-3-Simulationen (Wirtschaft/Ausbau, 08.08.2026)

Reine Analyse-Skripte, KEIN Teil des Spiel-Codes. Liegen bewusst ausserhalb von `server/src`,
damit sie nicht mitkompiliert werden. Aufbau analog `balance/session2-simulation/`.

## Ausfuehren

```
cd server && npm install && npx tsc -p tsconfig.json   # Worker laeuft aus dist/, siehe README Punkt 9
cd ../balance/session3-simulation
node run_costs.mjs                       # reine Arithmetik: Kosten/Zeiten/Senken, keine Kampfsimulation
node run_ship_value.mjs 6 piraten_hoch   # Gleich-Wert-Flotten, Grenznutzen, Flotten-Skalierung
node run_invest_roi.mjs 6                # Modul-/Forschungs-/Klassen-/Booster-Hebel im Vergleich
node run_defense_value.mjs 8             # lohnt sich Verteidigung? (Raid, 12 Wellen je Durchlauf)
node run_mission_breakeven.mjs 10 piraten_hoch  # komplette 24h-Missionen ueber Flottengroessen
node run_elite_series_net.mjs 6 voll     # Elite-Bollwerk, komplette 6-Check-Serie
node run_real_fleet.mjs 5                # die reale Flotte des Nutzers gegen Solo-Hoch und Elite
```

`lib3.mjs` ist eine unveraenderte Kopie von `../session2-simulation/lib.mjs` (Pfade zu
`server/dist`, die vier Ausbau-Profile, die Referenzflotten). Bewusst kopiert statt importiert,
damit die Session-2-Skripte reproduzierbar bleiben, falls hier je etwas angepasst wird.

**Wichtig:** Vor jedem Lauf `npx tsc` ausfuehren. Der Kampf-Worker laedt immer aus `dist/`.

## Unterschied zu `simulateCombat()`

`simulateCombat()` (Session 2) betrachtet immer nur EINEN Check. `run_mission_breakeven.mjs`,
`run_elite_series_net.mjs` und `run_real_fleet.mjs` replizieren dagegen `runHourlyCheck()` bzw.
`runGroupHourlyCheck()` ueber eine KOMPLETTE 24h-Mission und schleppen die Verluste ueber alle
Checks mit - erst dadurch wird der Netto-Ertrag (Belohnung minus Flottenverlust) sichtbar.
Genau dieser Unterschied ist die Grundlage von Befund 2.

Die `.txt`-Dateien sind die Rohausgaben, aus denen die Tabellen im Session-3-Abschnitt von
`FINALE_BALANCE_CHECKLIST.md` stammen.
