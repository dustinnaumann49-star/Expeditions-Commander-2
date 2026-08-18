// Diagnose zum RF-Umbau (Nutzeridee 18.08.2026, Teil A + B).
//
// DIE FRAGE IST NICHT "wer gewinnt", sondern: **macht die Zusammensetzung der eigenen Flotte
// ueberhaupt einen Unterschied?** Der Nutzer-Befund lautet "Kaempfe kommen linear vor" - und die
// Code-Ursache dafuer ist, dass alle drei Wellenprofile denselben vollstaendigen Pool benutzen
// (weightsForProfile() in combat.ts), jede Welle also jeden Typ enthaelt und sich damit jeder
// Konter herausmittelt. Gemessen wird deshalb die SPANNWEITE des Wertverlusts ueber vier
// Flottenaufstellungen: ist sie klein, ist die Wahl der Flotte egal.
//
// Aufruf: [MESSBUILD=...] node run_rf_depth.mjs <label> <profil> [laeufe] [datei]
//   z.B.  node run_rf_depth.mjs "IST" schwarm 40
//         MESSBUILD=$PWD/messbuild_rf_a  node run_rf_depth.mjs "A"  schwarm 40
//         MESSBUILD=$PWD/messbuild_rf_ab node run_rf_depth.mjs "A+B" schwarm 40
//
// Scheibenweise gedacht: ein Aufruf = ein Zustand x ein Wellenprofil (vier Zellen), Ergebnis wird
// sofort angehaengt. Ein Vollauf ueber alles waere bei einem Abbruch komplett verloren.
//
// Bewusste Festlegungen (alle aus dem Code gelesen, Messregel 16):
// - GLEICHE FLOTTEN-MACHT statt gleichem Wert. Bei gleichem WERT hat die Elite-Klasse rund 35 %
//   weniger Macht als die Jaeger-Klasse (Wert je Machtpunkt 1,59-1,89 gegen 1,11-1,18, siehe
//   Entscheidung 6) - der Gegner skaliert mit der Macht, also bekaeme jede Aufstellung einen
//   anders starken Gegner. Das wuerde die RF-Frage mit der Kosten-Frage vermischen. Gleiche Macht
//   heisst: identisch starker Gegner in JEDER Zelle, nur die Zusammensetzung unterscheidet sich.
// - Feindstaerke-Multiplikator FEST auf 0.85 statt gewuerfelt. Das ist der Erwartungswert von
//   PIRATEN_MULTIPLIER_ROLL.piraten_hoch (0.5*0.70 + 0.3*0.95 + 0.2*1.075). Die Wuerfelstreuung
//   wuerde den Unterschied zwischen den Aufstellungen ueberdecken, um den es hier geht.
// - NPC-Verteidigungsanlagen wie im Spiel (defenseFactor 0.15 fuer piraten_hoch, sektorDefenseFactor()).
// - KEIN Piratenkapitaen (captainChance) - reiner Zufallsposten mit sehr grossem Einzeleffekt.
import { appendFileSync } from 'node:fs';
// ships kommt bewusst ueber lib4 - die Datei loest MESSBUILD bereits auf, ein zweiter,
// direkter Import waere die Stelle, an der Messbuild und Normalbuild auseinanderlaufen.
import { combat, sectors, runner, ships, stateFor, value, pct } from './lib4.mjs';
const { SHIPS } = ships;

const [, , LABEL, PROFIL, RUNS_S, OUT_S, MULT_S] = process.argv;
const RUNS = Number(RUNS_S || 40);
const OUT = OUT_S || 'rf_depth.txt';
const SEKTOR = 'piraten_hoch';
// 0.85 ist der Erwartungswert der Sektor-Wurftabelle. Hoehere Werte sind KEIN realer Sektor,
// sondern die umkaempfte Zelle: bei 0.85 gewinnt jede Aufstellung zu 100 %, und eine Kennzahl,
// die im Bereich "alles gewinnt" gemessen wird, sagt ueber die Wahl der Flotte nichts aus
// (Falle aus der Uebergabe: eine Kennzahl kann im Zielband liegen und trotzdem nichts wert sein).
const MULT = Number(MULT_S || 0.85);
const ZIEL_POWER = 1.5e9;

if (!LABEL || !PROFIL) throw new Error('Aufruf: node run_rf_depth.mjs <label> <profil> [laeufe] [datei]');
if (!['schwarm', 'kampfgruppe', 'elitekader'].includes(PROFIL)) throw new Error(`unbekanntes Profil: ${PROFIL}`);

const byId = Object.fromEntries(SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);

// Aufstellungen: je Klasse gleichmaessig auf ZIEL_POWER verteilt (Macht, nicht Stueckzahl).
// "gemischt gleich" verteilt die Macht auf alle acht Typen zu gleichen Teilen - das ist eine
// KONSTRUKTION, keine reale Flotte. "gemischt real" benutzt stattdessen die Stueckzahl-Relationen
// der Referenzflotte FLEET_LARGE (lib4.mjs), also jaegerlastig wie ein echter Spielstand, und
// skaliert sie auf dieselbe Gesamt-Macht. Beide Zeilen stehen nebeneinander, weil die erste Runde
// die gemischte Flotte als schlechteste Wahl ausgewiesen hat - das kann eine Eigenschaft sein oder
// ein Artefakt der Gleichverteilung.
const AUFSTELLUNGEN = {
  'nur Jaeger': ['leicht', 'schwer'],
  'nur Kreuzer': ['kreuzer', 'schlachtschiff', 'bomber'],
  'nur Elite': ['schlachtkreuzer', 'zerstoerer', 'reaper'],
  'gemischt gleich': ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'],
  'gemischt real': { leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200 },
};

function baueFlotte(spec) {
  if (Array.isArray(spec)) {
    const proTyp = ZIEL_POWER / spec.length;
    const f = {};
    spec.forEach((id) => (f[id] = Math.max(1, Math.round(proTyp / combat.shipPowerBase(id)))));
    return f;
  }
  // Stueckzahl-Relationen beibehalten, Gesamtmacht auf ZIEL_POWER skalieren.
  const roh = combat.combatFleetPowerBase(spec);
  const faktor = ZIEL_POWER / roh;
  const f = {};
  Object.entries(spec).forEach(([id, n]) => (f[id] = Math.max(1, Math.round(n * faktor))));
  return f;
}

const st = stateFor('voll', 1);
const defenseFactor = sectors.sektorDefenseFactor(SEKTOR);

const lines = [
  `--- ${LABEL} | Profil ${PROFIL} | ${RUNS} Laeufe je Zelle | Sektor ${SEKTOR}, Multiplikator fest ${MULT}, gleiche Flotten-Macht ${(ZIEL_POWER / 1e9).toFixed(2)} Mrd ---`,
  'Aufstellung        Stk   Wert Mrd   Sieg%   Wertverlust %   Wertverlust Mrd   Runden',
];

const verluste = [];
for (const [name, spec] of Object.entries(AUFSTELLUNGEN)) {
  const fleet = baueFlotte(spec);
  const startWert = fleetValue(fleet);
  const power = combat.combatFleetPowerBase(fleet);
  let lost = 0, rounds = 0, wins = 0;

  for (let i = 0; i < RUNS; i++) {
    const npcShips = combat.generatePiratenFleet(power * MULT, 0, PROFIL);
    const npcDefenses = combat.generateDefenseFleet(power * defenseFactor, 0);
    const enemy = { ...npcShips, ...npcDefenses };
    const r = await runner.runCombatInWorker({
      sideAShips: fleet,
      sideBShips: enemy,
      research: st.research,
      playerClass: st.playerClass,
      kampfBoostActive: true,
      shipModules: st.shipModules,
      allowRetreat: true,
    });
    const surv = {};
    Object.keys(fleet).forEach((id) => (surv[id] = r.survivorsA[id] || 0));
    lost += startWert - fleetValue(surv);
    rounds += r.roundsFought;
    if (Object.keys(enemy).every((id) => (r.survivorsB[id] || 0) <= 0)) wins++;
  }

  const anteil = lost / RUNS / startWert;
  verluste.push({ name, anteil });
  const stk = Object.values(fleet).reduce((a, b) => a + b, 0);
  lines.push(
    name.padEnd(18) + String(stk).padStart(6)
    + (startWert / 1e9).toFixed(2).padStart(11)
    + pct(wins / RUNS).padStart(8)
    + pct(anteil).padStart(16)
    + (lost / RUNS / 1e9).toFixed(2).padStart(18)
    + (rounds / RUNS).toFixed(1).padStart(9)
  );
  console.log(lines[lines.length - 1]);
}

const min = Math.min(...verluste.map((v) => v.anteil));
const max = Math.max(...verluste.map((v) => v.anteil));
lines.push(
  `Spannweite Wertverlust: ${pct(min)} (${verluste.find((v) => v.anteil === min).name})`
  + ` bis ${pct(max)} (${verluste.find((v) => v.anteil === max).name})`
  + ` = Faktor ${(max / Math.max(min, 1e-9)).toFixed(2)}`
);
console.log(lines[lines.length - 1]);

appendFileSync(OUT, lines.join('\n') + '\n\n');
process.exit(0);
