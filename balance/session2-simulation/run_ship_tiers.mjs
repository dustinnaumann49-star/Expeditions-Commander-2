// Block C, Schritt 8 - Entscheidung 6 (Schiffs-Tiers: Wert je Machtpunkt angleichen).
//
// ERSETZT die Messungen in `ships.txt` und `ship_value.txt` fuer diesen Zweck. Beide sind VOR
// R14/R14b gelaufen, also gegen eine Engine, in der RapidFire im Aggregat-Pfad praktisch nicht
// stattfand - jede Kalibrierung dagegen waere gegen ein Artefakt gerechnet (Messregel 1).
//
// Zusaetzlich messen sie das Falsche: `run_ship_value.mjs` nimmt `avgLossPercent` aus
// `simulator.ts`, und das ist eine STUECKZAHL-Quote auf ganze Prozent gerundet, die dort mit dem
// Flottenwert multipliziert wird. Messregel 4 verlangt die Wert-Bilanz. Dieses Skript rechnet den
// Verlust deshalb aus den tatsaechlichen Ueberlebenden je Typ.
//
// Aufruf: [MESSBUILD=...] node run_ship_tiers.mjs <modus> <label> [arg] [laeufe] [datei]
//   tabelle  <label>                      - statische Tabelle aus dem Code, keine Kaempfe
//   duell    <label> <typ>  [laeufe]      - eine Zeile der Duell-Matrix, gleicher WERT je Seite
//   spezial  <label> <typ>  [laeufe]      - Salvenschiffe/Imperator gegen drei Referenztypen
//   sektor   <label> <mult> [laeufe]      - machtskalierter Sektor, alle Typen, Wert-Verlust
//
// Festlegungen:
// - Duelle laufen auf BASISWERTEN (keine Forschung, keine Module, keine Klasse, kein Boost) und
//   ohne Rueckzug - so wie `run_ships.mjs` es getan hat, damit die Zahlen vergleichbar bleiben.
// - Duell-Budget 600 Mio Wert wie bisher. Fuer die Spezialschiffe ein eigenes Budget von
//   3,9 Mrd, weil der Imperator (Teile-Gegenwert 975 Mio) bei 600 Mio rechnerisch 1 Schiff
//   bekaeme und die Zelle damit nichts mehr aussagt.
// - Der Imperator hat KEINE Ressourcenkosten. Bewertet wird er ueber TEILE_CONVERT_RESOURCES
//   (100.000 / 70.000 / 40.000 je Teil = 325.000 Wert), das ist die Setzung aus Abschnitt 8.
// - Sektor-Zellen laufen mit vollem Profil und werden bei ZWEI Feindstaerken gemessen: 0.85
//   (Erwartungswert von PIRATEN_MULTIPLIER_ROLL.piraten_hoch) und 2.0. Bei 0.85 gewinnt jede
//   Aufstellung zu 100 % - dort ist ein Tier-Unterschied nicht entscheidbar. Diese Lehre stammt
//   aus der RF-Messung vom 18.08.2026.
import { appendFileSync } from 'node:fs';
import { combat, sectors, runner, ships, economy, stateFor, value, pct } from './lib4.mjs';

const { SHIPS } = ships;
const { TEILE_CONVERT_RESOURCES } = economy;

const [, , MODUS, LABEL, ARG, RUNS_S, OUT_S] = process.argv;
const RUNS = Number(RUNS_S || 40);
const OUT = OUT_S || 'ship_tiers.txt';
const DUELL_BUDGET = 600e6;
const SPEZIAL_BUDGET = 3.9e9;
const SEKTOR = 'piraten_hoch';

const STANDARD = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];
const SPEZIAL = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought', 'imperator'];
const REFERENZ = ['leicht', 'kreuzer', 'reaper'];

const byId = Object.fromEntries(SHIPS.map((s) => [s.id, s]));
const TEIL_WERT = value(TEILE_CONVERT_RESOURCES);

function shipValue(id) {
  const s = byId[id];
  if (!s) return 0;
  if (s.cost && (s.cost.metall || s.cost.kristall || s.cost.deuterium)) return value(s.cost);
  if (s.teileCost) return Object.values(s.teileCost).reduce((a, b) => a + b, 0) * TEIL_WERT;
  return 0;
}
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const countFor = (id, budget) => Math.max(1, Math.floor(budget / shipValue(id)));

// ---------- Modus: statische Tabelle ----------
if (MODUS === 'tabelle') {
  const lines = [
    `--- ${LABEL} | Wert je Machtpunkt, statisch aus dem Code ---`,
    'Wert = Metall + 1,5 x Kristall + 3 x Deuterium (TRADE_VALUE). Power = Waffen + Schild + Panzerung (Basiswerte).',
    'Die Spalte "Power x8" gilt nur fuer die Salvenschiffe: combatFleetPowerBase() zaehlt sie mit',
    'MULTI_TARGET_POWER_CORRECTION = 8, und DAS ist die Groesse, an der die Gegnerstaerke haengt.',
    '',
    'Schiff                Wert       Power      Wert/Power   Power x8    Wert/(Power x8)',
  ];
  for (const id of [...STANDARD, ...SPEZIAL]) {
    const w = shipValue(id);
    const p = combat.shipPowerBase(id);                 // Waffen + Schild + Panzerung, Basiswerte
    const p8 = combat.combatFleetPowerBase({ [id]: 1 }); // dieselbe Groesse, aber MIT der Salven-Korrektur
    lines.push(
      id.padEnd(20) + (w / 1e6).toFixed(2).padStart(10) + 'M'
      + p.toLocaleString('de-DE').padStart(12)
      + (w / p).toFixed(2).padStart(13)
      + (p8 === p ? '-' : p8.toLocaleString('de-DE')).padStart(12)
      + (p8 === p ? '-' : (w / p8).toFixed(2)).padStart(18)
    );
  }
  console.log(lines.join('\n'));
  appendFileSync(OUT, lines.join('\n') + '\n\n');
  process.exit(0);
}

// ---------- Duelle ----------
async function duell(a, b, budget) {
  const fa = { [a]: countFor(a, budget) };
  const fb = { [b]: countFor(b, budget) };
  const wa = fleetValue(fa), wb = fleetValue(fb);
  let verlustA = 0, vernichtetB = 0, siege = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fa, sideBShips: fb, research: {}, shipModules: {}, allowRetreat: false,
    });
    verlustA += wa - fleetValue({ [a]: r.survivorsA[a] || 0 });
    vernichtetB += wb - fleetValue({ [b]: r.survivorsB[b] || 0 });
    if ((r.survivorsB[b] || 0) <= 0 && (r.survivorsA[a] || 0) > 0) siege++;
  }
  return { verlustA: verlustA / RUNS, vernichtetB: vernichtetB / RUNS, sieg: siege / RUNS };
}

if (MODUS === 'duell' || MODUS === 'spezial') {
  const budget = MODUS === 'spezial' ? SPEZIAL_BUDGET : DUELL_BUDGET;
  const gegner = MODUS === 'spezial' ? REFERENZ : STANDARD.filter((x) => x !== ARG);
  const lines = [
    `--- ${LABEL} | Duelle ${ARG} | ${RUNS} Laeufe je Paarung | Budget ${(budget / 1e6).toFixed(0)} Mio Wert je Seite | Basiswerte, kein Rueckzug ---`,
    `${ARG}: ${countFor(ARG, budget)} Stk`,
    'Gegner            Stk    Sieg%   eig. Verlust Mio   Gegner vernichtet Mio   Netto Mio',
  ];
  let nettoSumme = 0;
  for (const g of gegner) {
    const r = await duell(ARG, g, budget);
    const netto = r.vernichtetB - r.verlustA;
    nettoSumme += netto;
    lines.push(
      g.padEnd(18) + String(countFor(g, budget)).padStart(6)
      + pct(r.sieg).padStart(8)
      + (r.verlustA / 1e6).toFixed(0).padStart(19)
      + (r.vernichtetB / 1e6).toFixed(0).padStart(24)
      + (netto / 1e6).toFixed(0).padStart(12)
    );
    console.log(lines[lines.length - 1]);
  }
  lines.push(`Mittlere Netto-Bilanz ${ARG}: ${(nettoSumme / gegner.length / 1e6).toFixed(0)} Mio`);
  console.log(lines[lines.length - 1]);
  appendFileSync(OUT, lines.join('\n') + '\n\n');
  process.exit(0);
}

// ---------- Machtskalierter Sektor ----------
if (MODUS === 'sektor') {
  const MULT = Number(ARG || 0.85);
  const st = stateFor('voll', 1);
  const defenseFactor = sectors.sektorDefenseFactor(SEKTOR);
  const lines = [
    `--- ${LABEL} | Sektor ${SEKTOR}, Feindstaerke ${MULT}x | ${RUNS} Laeufe je Typ | gleicher WERT ${(DUELL_BUDGET / 1e6).toFixed(0)} Mio je Flotte | Profil voll ---`,
    'Schiff              Stk    Sieg%   Wertverlust %   Wertverlust Mio   Runden',
  ];
  for (const id of [...STANDARD, ...SPEZIAL]) {
    const fleet = { [id]: countFor(id, DUELL_BUDGET) };
    const startWert = fleetValue(fleet);
    const power = combat.combatFleetPowerBase(fleet);
    let lost = 0, rounds = 0, wins = 0;
    for (let i = 0; i < RUNS; i++) {
      const enemy = {
        ...combat.generatePiratenFleet(power * MULT, 0, 'kampfgruppe'),
        ...combat.generateDefenseFleet(power * defenseFactor, 0),
      };
      const r = await runner.runCombatInWorker({
        sideAShips: fleet, sideBShips: enemy, research: st.research, playerClass: st.playerClass,
        kampfBoostActive: true, shipModules: st.shipModules, allowRetreat: true,
      });
      lost += startWert - fleetValue({ [id]: r.survivorsA[id] || 0 });
      rounds += r.roundsFought;
      if (Object.keys(enemy).every((k) => (r.survivorsB[k] || 0) <= 0)) wins++;
    }
    lines.push(
      id.padEnd(18) + String(fleet[id]).padStart(6) + pct(wins / RUNS).padStart(8)
      + pct(lost / RUNS / startWert).padStart(16)
      + (lost / RUNS / 1e6).toFixed(0).padStart(18)
      + (rounds / RUNS).toFixed(1).padStart(9)
    );
    console.log(lines[lines.length - 1]);
  }
  appendFileSync(OUT, lines.join('\n') + '\n\n');
  process.exit(0);
}

throw new Error(`unbekannter Modus: ${MODUS}`);
