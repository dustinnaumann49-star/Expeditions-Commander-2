// GEGENPROBE - LIEGT ES AN DER MASSE ODER AN DER BAUART DES GEGNERS?
//
// !!! Liest nur aus, veraendert nichts. Laeuft gegen den unveraenderten Build.                !!!
//
// STAND (probe_bossverlust.mjs): der Absturz der Verlustquote hat ZWEI gemessene Ursachen, und
// beide haengen daran, dass die Feuerkraft des Gegners auf EINER Einheit sitzt:
//   1. Die Boss-Waffen wachsen mit der Flottenmacht um Faktor 28, der Schaden JE TREFFER bleibt
//      konstant bei 13,6 Mio - ein Treffer erreicht ueber die Durchschlags-Kaskade nur wenige
//      Ziele, der Rest verpufft. Verschwendung 87,8 % -> 99,6 %.
//   2. Der wenige ankommende Schaden verteilt sich auf so viele Einheiten, dass deren Schilde sich
//      zwischen zwei Treffern wieder aufladen. Regen/Schaden 0,00 -> 0,97.
//
// DARAUS FOLGT EINE PRUEFBARE VORHERSAGE: verteilt man dieselbe Gegnermacht auf VIELE Einheiten,
// muessen beide Mechanismen weitgehend verschwinden. Viele mittlere Schuesse laufen nicht in den
// Deckel, und sie treffen dieselbe Zieleinheit oefter, bevor deren Schild sich erholt.
//
// DIESE GEGENPROBE FAEHRT DESHALB DIESELBE LEITER GEGEN ZWEI GEGNERFORMEN BEI GLEICHER MACHT:
//   KONZENTRIERT - ein Piratenadmiral, die gesamte Macht auf einer Einheit (heutiger Zustand)
//   VERTEILT     - generatePiratenFleet() mit demselben Machtziel, also viele gegen viele
//
// WENN DIE KURVE BEI "VERTEILT" FLACH IST, ist es KEIN Massenproblem des Kampfmodells, sondern
// eine Eigenschaft der Kapitaens-Bauart - und die Loesung waere entsprechend klein.
// WENN SIE AUCH DORT FAELLT, sitzt das Problem tiefer und betrifft jeden Kampf im Spiel.
//
// Aufruf: node run_gegenprobe.mjs [laeufe] [ausgabedatei]
import { writeFileSync } from 'node:fs';
import { combat, runner, cc, ships, stateFor, value } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 30);
const OUT = process.argv[3] || 'gegenprobe.txt';
const LEITER = [90, 150, 400, 1000, 2500];
const BASE = { kreuzer: 1, schlachtschiff: 1, bomber: 1, schlachtkreuzer: 0.5, zerstoerer: 0.5, reaper: 0.5 };

const state = stateFor('voll', 1);
const pr = combat.computePirateResearch(state.research);
const m = {
  waffen: combat.waffenMultiplier(pr),
  schild: combat.schildMultiplier(pr),
  panzerung: combat.panzerungMultiplier(pr),
};
const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const shipValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * shipValue(id), 0);
const summe = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

const zeilen = [];
const sag = (s) => { console.log(s); zeilen.push(s); };

sag('=== GEGENPROBE: KONZENTRIERTE GEGEN VERTEILTE GEGNERMACHT ===');
sag(`Dieselbe Flotten-Leiter, dieselbe Gegner-MACHT (Flottenmacht x 1,30 x 1,75), ${RUNS} Laeufe je Zelle.`);
sag('Einziger Unterschied: sitzt die Macht auf EINER Einheit oder auf vielen.');
sag('Der Gegner ist in beiden Formen auf die Flottenmacht skaliert - eine massstabsneutrale');
sag('Engine muesste ueber die ganze Leiter dieselbe Verlustquote liefern.');
sag('');

async function zelle(n, form) {
  const fleet = Object.fromEntries(Object.entries(BASE).map(([id, f]) => [id, Math.round(n * f)]));
  const startCount = Object.values(fleet).reduce((a, b) => a + b, 0);
  const startValue = fleetValue(fleet);
  const ziel = combat.combatFleetPowerBase(fleet) * 1.30 * 1.75;

  let sideBShips, sideBStatsOverride;
  if (form === 'konzentriert') {
    const enc = combat.generateAdmiralEncounter(ziel);
    const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
    sideBShips = { [cc.ADMIRAL_BOSS_ID]: 1 };
    sideBStatsOverride = {
      [cc.ADMIRAL_BOSS_ID]: { waffen: b.waffen * m.waffen, schild: b.schild * m.schild, panzerung: b.panzerung * m.panzerung },
    };
  } else {
    // Dieselbe Zielmacht, aber ueber den regulaeren Flottengenerator verteilt. KEIN
    // statsOverride - die Einheiten laufen auf ihren normalen Werten, die Macht steckt in der
    // Stueckzahl. Genau das ist der zu pruefende Unterschied.
    sideBShips = combat.generatePiratenFleet(ziel, 0);
    sideBStatsOverride = undefined;
  }

  let lost = 0, rounds = 0, treffer = 0, schuesse = 0, angerichtet = 0, regen = 0, gegnerVerlust = 0;
  const gegnerStart = Object.values(sideBShips).reduce((a, b) => a + b, 0);
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet, sideBShips, sideBStatsOverride,
      research: state.research, playerClass: state.playerClass,
      kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none',
    });
    lost += startCount - Object.values(r.survivorsA).reduce((a, c) => a + c, 0);
    rounds += r.roundsFought;
    // KORREKTES FELD: `shotsFired`, nicht `fired`. Ein erster Sondenlauf las `r.shotsB.fired` aus
    // und bekam dadurch 0 Schuesse bei 52 Treffern gemeldet - das sah nach einem Fehler im Spiel
    // aus und war einer im Messskript. Feldnamen am Typ nachsehen, nicht raten.
    treffer += summe(r.shotsB.hits);
    schuesse += summe(r.shotsB.shotsFired);
    angerichtet += summe(r.dmgTakenA) + summe(r.shieldDmgTakenA);
    regen += summe(r.shieldRegenA);
    gegnerVerlust += gegnerStart - Object.values(r.survivorsB).reduce((a, c) => a + c, 0);
  }
  return {
    n, startCount, gegnerStart,
    verlustPct: 100 * lost / RUNS / startCount,
    rounds: rounds / RUNS,
    schuesse: schuesse / RUNS,
    treffer: treffer / RUNS,
    proTreffer: angerichtet / RUNS / Math.max(1, treffer / RUNS),
    regenAnteil: regen / Math.max(1, angerichtet),
    gegnerVerlustPct: 100 * gegnerVerlust / RUNS / Math.max(1, gegnerStart),
  };
}

const ergebnis = {};
for (const form of ['konzentriert', 'verteilt']) {
  sag(`--- ${form.toUpperCase()} ---`);
  sag('    n  eigene   Gegner  Runden  eig. Verlust  Gegn. Verlust  Schuesse  Treffer  Schaden/Treffer  Regen/Schaden');
  ergebnis[form] = [];
  for (const n of LEITER) {
    const z = await zelle(n, form);
    ergebnis[form].push(z);
    sag(
      `${String(z.n).padStart(5)} ${String(z.startCount).padStart(7)} ${String(z.gegnerStart).padStart(8)} `
      + `${z.rounds.toFixed(1).padStart(7)} ${z.verlustPct.toFixed(1).padStart(12)} % `
      + `${z.gegnerVerlustPct.toFixed(1).padStart(12)} % ${z.schuesse.toFixed(0).padStart(9)} `
      + `${z.treffer.toFixed(0).padStart(8)} ${(z.proTreffer / 1e6).toFixed(2).padStart(15)}M `
      + `${z.regenAnteil.toFixed(2).padStart(13)}`
    );
  }
  const s = ergebnis[form];
  sag(`  SPANNE ueber die Leiter: ${(s[0].verlustPct - s[s.length - 1].verlustPct).toFixed(1)} Punkte`);
  sag('');
}

sag('=== VERGLEICH ===');
sag('    n   konzentriert   verteilt   Unterschied');
LEITER.forEach((n, i) => {
  const k = ergebnis.konzentriert[i], v = ergebnis.verteilt[i];
  sag(`${String(n).padStart(5)} ${k.verlustPct.toFixed(1).padStart(13)} % ${v.verlustPct.toFixed(1).padStart(9)} % `
    + `${(v.verlustPct - k.verlustPct).toFixed(1).padStart(12)}`);
});
const sk = ergebnis.konzentriert, sv = ergebnis.verteilt;
sag('');
sag(`Spanne konzentriert: ${(sk[0].verlustPct - sk[sk.length - 1].verlustPct).toFixed(1)} Punkte`);
sag(`Spanne verteilt    : ${(sv[0].verlustPct - sv[sv.length - 1].verlustPct).toFixed(1)} Punkte`);

writeFileSync(OUT, zeilen.join('\n') + '\n');
console.log(`\nGeschrieben: ${OUT}`);
process.exit(0);
