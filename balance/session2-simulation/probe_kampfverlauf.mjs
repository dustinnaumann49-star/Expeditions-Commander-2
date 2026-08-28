// WANN IM KAMPF ENTSTEHEN DIE VERLUSTE?
//
// !!! Liest nur aus, laeuft gegen den UNVERAENDERTEN Build. Kein Messbuild, kein Patch.        !!!
//
// STAND: vier Hypothesen geprueft, vier widerlegt (massenfrage_protokoll.txt Abschnitte 2, 3, 4b).
// Aggregation, Overkill-Kaskade, Schuss-Obergrenze, Machtanteil des Kapitaens und Koernigkeit der
// Eskorte - keine davon aendert die STEIGUNG der Verlustkurve. Der Abfall bleibt bei 34-36
// Punkten, egal was verstellt wird.
//
// VIERMAL EINE KONSTANTE ZU DREHEN HAT NICHTS ERGEBEN. Diese Sonde dreht deshalb nichts, sondern
// zeichnet den VERLAUF auf: `CombatReplay` fuehrt je Runde die Ueberlebenden je Schiffstyp
// (typesA/typesB als Reihenfolge, roundsA/roundsB als Zahlen-Arrays). Daraus laesst sich ablesen,
// WANN die Verluste entstehen - und ob sich das ueber die Leiter verschiebt.
//
// DIE FRAGE, DIE DAS ENTSCHEIDET:
//   Entstehen die Verluste in den ersten Runden, SOLANGE DIE ESKORTE LEBT?
//   Dann ist der Abfall eine Frage der KAMPFDAUER: eine grosse Flotte toetet die Eskorte
//   schneller und kassiert deshalb weniger - kein Fehler in einer Konstante, sondern eine
//   Eigenschaft des Kraefteverhaeltnisses. Das waere eine voellig andere Baustelle als bisher
//   vermutet und wuerde erklaeren, warum vier Regler nichts bewegt haben.
//   Verteilen sich die Verluste dagegen gleichmaessig ueber alle 100 Runden, liegt es am
//   Dauerfeuer des unsterblichen Kapitaens und die Kampfdauer ist unschuldig.
//
// ACHTUNG BEIM LESEN: `MAX_SNAPSHOTS` (30) tastet lange Kaempfe ab - die Runden-Indizes sind
// deshalb nicht zwingend 1,2,3..., sondern gestreckt. `totalRounds` gibt die echte Laenge.
// Verglichen wird darum in ANTEILEN der Kampfdauer, nicht in absoluten Runden.
import { combat, runner, cc, ships, stateFor } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 10);
const LEITER = [150, 400, 1000, 2500];
const BASE = { kreuzer: 1, schlachtschiff: 1, bomber: 1, schlachtkreuzer: 0.5, zerstoerer: 0.5, reaper: 0.5 };

const state = stateFor('voll', 1);
const pr = combat.computePirateResearch(state.research);
const m = {
  waffen: combat.waffenMultiplier(pr),
  schild: combat.schildMultiplier(pr),
  panzerung: combat.panzerungMultiplier(pr),
};

console.log('=== WANN ENTSTEHEN DIE VERLUSTE? ===');
console.log(`Echte Begegnung (Kapitaen + Eskorte, ADMIRAL_STAT_SHARE 0,55), Profil voll, ${RUNS} Laeufe je Zelle.`);
console.log('Anteile der GESAMTVERLUSTE, aufgeteilt nach Abschnitt der Kampfdauer.');
console.log('"Eskorte tot bei" = Anteil der Kampfdauer, nach dem die Eskorte vernichtet ist.\n');
console.log('    n  Runden  Eskorte tot bei  Verluste 0-25%  25-50%  50-75%  75-100%  danach noch');

for (const n of LEITER) {
  const fleet = Object.fromEntries(Object.entries(BASE).map(([id, f]) => [id, Math.round(n * f)]));
  const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.30 * 1.75);
  const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];

  const eimer = [0, 0, 0, 0];
  let eskorteTot = 0, rundenGes = 0, gesamtVerlust = 0, nachEskorte = 0;

  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet, sideBShips: enc.npcShips,
      sideBStatsOverride: {
        [cc.ADMIRAL_BOSS_ID]: { waffen: b.waffen * m.waffen, schild: b.schild * m.schild, panzerung: b.panzerung * m.panzerung },
      },
      research: state.research, playerClass: state.playerClass,
      kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none',
    });
    const rep = r.replay;
    if (!rep) { console.log(`  n=${n}: KEIN REPLAY im Ergebnis - Sonde nicht auswertbar.`); break; }

    const snaps = rep.roundsA.length;
    // Index des Kapitaens auf Seite B, um Eskorte und Kapitaen zu trennen.
    const bossIdx = rep.typesB.indexOf(cc.ADMIRAL_BOSS_ID);
    const startA = rep.roundsA[0].reduce((a, c) => a + c, 0);
    const endA = rep.roundsA[snaps - 1].reduce((a, c) => a + c, 0);
    gesamtVerlust += startA - endA;
    rundenGes += rep.totalRounds;

    // Anteil der Kampfdauer, nach dem die Eskorte (alles ausser dem Kapitaen) vernichtet ist.
    let totIdx = snaps - 1;
    for (let s = 0; s < snaps; s++) {
      const esk = rep.roundsB[s].reduce((a, c, j) => a + (j === bossIdx ? 0 : c), 0);
      if (esk <= 0) { totIdx = s; break; }
    }
    eskorteTot += totIdx / Math.max(1, snaps - 1);
    // Verluste NACH dem Tod der Eskorte - also das, was der Kapitaen allein noch anrichtet.
    nachEskorte += rep.roundsA[totIdx].reduce((a, c) => a + c, 0) - endA;

    // Verluste je Viertel der Kampfdauer.
    for (let q = 0; q < 4; q++) {
      const von = Math.floor((q * (snaps - 1)) / 4);
      const bis = Math.floor(((q + 1) * (snaps - 1)) / 4);
      const a = rep.roundsA[von].reduce((x, c) => x + c, 0);
      const c2 = rep.roundsA[bis].reduce((x, c) => x + c, 0);
      eimer[q] += a - c2;
    }
  }

  const pct = (x) => `${(100 * x / Math.max(1, gesamtVerlust)).toFixed(0).padStart(6)} %`;
  console.log(
    `${String(n).padStart(5)} ${(rundenGes / RUNS).toFixed(0).padStart(7)} `
    + `${(100 * eskorteTot / RUNS).toFixed(0).padStart(14)} % `
    + `${pct(eimer[0])} ${pct(eimer[1])} ${pct(eimer[2])} ${pct(eimer[3])} `
    + `${pct(nachEskorte)}`
  );
}
process.exit(0);
