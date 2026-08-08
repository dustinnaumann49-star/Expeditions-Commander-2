# Session-4-Simulationen (Multiplayer & Rest, 08.08.2026)

Reine Analyse-Skripte, KEIN Teil des Spiel-Codes. Liegen bewusst ausserhalb von `server/src`,
damit sie nicht mitkompiliert werden. Aufbau analog `balance/session2-simulation/`.

## Ausfuehren

```
cd server && npm install && npx tsc -p tsconfig.json   # Worker laeuft aus dist/, siehe README
cd ../balance/session4-simulation
node run_station.mjs               # Allianz-Station: Kosten/Ertrag/Bauzeit, reine Arithmetik
node run_ships.mjs 4               # Schiffsbalance: Tier-Progression, RF-Kette, Duelle bei gleichem Wert
node run_admiral.mjs 6             # Piratenadmiral: komplette 6-Check-Serien, Eskalation, Extraktion
node run_pirate_base.mjs 3         # Piratenbasen-Angriff: Verluste gegen Beute-Deckel
node run_admiral_rebalance.mjs 5  # P10-Neubalancierung: Boss-Anteil, Verlustkriterium, Beute-Koeffizient
node run_aggregate_threshold.mjs 6  # Overkill-Schutz an der Aggregations-Schwelle (Regressionstest)
```

`lib4.mjs` ist eine unveraenderte Kopie von `../session2-simulation/lib.mjs` (Pfade zu
`server/dist`, die vier Ausbau-Profile, die Referenzflotten). Bewusst kopiert statt importiert,
damit die Skripte frueherer Sessions reproduzierbar bleiben.

Die `.txt`-Dateien sind die Rohausgaben, aus denen die Tabellen im Session-4-Abschnitt von
`FINALE_BALANCE_CHECKLIST.md` stammen.

## Methodische Besonderheiten dieser Session

- **Duelle bei gleichem Wert** (`run_ships.mjs`) laufen bewusst mit Forschung 0, ohne Booster,
  Klasse und Module und mit `allowRetreat: false` - damit misst die Matrix die reine
  Schiff-gegen-Schiff-Relation der Basiswerte, nicht den Ausbaustand eines Spielers.
- **Piratenbasen** (`run_pirate_base.mjs`) haben eine FESTE Garnison (kein `PIRATEN_MULTIPLIER_ROLL`),
  darum ist hier - anders als bei den Sektoren - die absolute Flottengroesse entscheidend.
  `SEED_FLEET`/`SEED_DEFENSE`/`RESOURCE_CAP` sind in `pirateBaseState.ts` nicht exportiert und im
  Skript gespiegelt; bei Aenderungen dort hier nachziehen.
- **Admiral-Serien** (`run_admiral.mjs`) nutzen ein Verlust-Kriterium (45 % Wertverlust in einem
  Check) statt `result.retreated` - siehe Session-2-Befund 2: mit dem heutigen Code endet praktisch
  jeder Durchlauf schon in Check 1, die Eskalationskurve waere sonst gar nicht messbar.
  `contributedPower` wird wie im echten Ablauf beim Start eingefroren.
- **`run_admiral_rebalance.mjs`** rechnet gegen die Oekonomie NACH den Session-3-Aenderungen
  (Wrack-Bergung 30 %, Beute proportional zur vernichteten Feindmacht) und baut
  `generateAdmiralEncounter()` mit konfigurierbarem `ADMIRAL_STAT_SHARE` nach.
- **`run_aggregate_threshold.mjs`** ist der Regressionstest zu Befund 5: dieselbe Gegnereinheit
  gegen Stapel knapp unter und knapp ueber `STACK_AGGREGATE_THRESHOLD_BY_TYPE`. Bei jeder Aenderung
  an `applyAggregateDamage()` oder an einer Einheit mit sehr hohem Waffenwert erneut laufen lassen.
