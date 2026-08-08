# Session-2-Simulationen (Kampf/PvE, 08.08.2026)

Reine Analyse-Skripte, KEIN Teil des Spiel-Codes. Liegen bewusst ausserhalb von `server/src`,
damit sie nicht mitkompiliert werden.

## Ausfuehren

```
cd server && npm install && npx tsc -p tsconfig.json   # Worker laeuft aus dist/, siehe README Punkt 9
cd ../balance/session2-simulation
node run_sectors.mjs           # Solo-Sektoren N/M/H + Elite-Bollwerk, 96 Laeufe je Zelle
node run_sweep_focus.mjs       # Multiplikator-Sweep (40 Laeufe je Zelle)
node run_admiral.mjs 20        # Piratenadmiral, komplette Begegnungen
node run_admiral_check1.mjs 30 # Piratenadmiral, Check-1-Diagnose (retreated-Flag)
node run_raid.mjs 8            # Raid, 12 Wellen je Durchlauf
node run_elite.mjs 15          # Elite-Bollwerk: volle Serienrechnung + Mehrspieler-Effekt
node elite_degenerate.mjs      # Mehrspieler-Minimum-Forschung, Extremfall
```

`lib.mjs` haelt die Pfade zu `server/dist` sowie die vier Ausbau-Profile und die Referenzflotten.
Die Pfade sind relativ zu diesem Ordner (`../../server/dist/game`) - solange die Ablage unter
`balance/session2-simulation/` bleibt, ist keine Anpassung noetig. Wird der Ordner verschoben,
nur die Konstante `D` in Zeile 1 von `lib.mjs` nachziehen.

**Wichtig:** Vor jedem Lauf `npx tsc` ausfuehren. Der Kampf-Worker laedt immer aus `dist/` - ohne
frischen Build misst man den alten Codestand.

Die `.txt`-Dateien sind die Rohausgaben der Laeufe, aus denen die Tabellen im
Session-2-Abschnitt von `FINALE_BALANCE_CHECKLIST.md` stammen.
