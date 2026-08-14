// Nutzerflotte (Angabe 14.08.2026) gegen Sektor piraten_elite: aendert sich am Ausgang etwas,
// wenn die 6 Imperatoren mitfliegen oder zu Hause bleiben? Gegenprobe zur Beobachtung, dass sie im
// Bericht nur ~1 Mrd von zweistellig vielen Mrd Gesamtschaden stellen.
// Bewusst ueber simulator.simulateCombat: identische NPC-Generierung wie im echten Spiel
// (gewuerfelte Wellenstaerke, npcFloor, NPC-Verteidigung, Piratenkapitaen), mehrere Durchlaeufe.
import * as L from './lib4.mjs';

const REPS = Number(process.argv[2] || 4);
const SEKTOR = 'piraten_elite';

const FLOTTE = {
  leicht: 20000, schwer: 20000,
  kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 5000, zerstoerer: 5000, reaper: 5000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
};

const state = L.stateFor('voll');
const total = (f) => Object.values(f).reduce((a, b) => a + b, 0);

async function run(fleet) {
  const acc = { runs: 0, win: 0, loss: 0, wipe: 0, rounds: 0 };
  for (let i = 0; i < REPS; i++) {
    const r = await L.simulator.simulateCombat(state, SEKTOR, fleet);
    if (!r.ok) throw new Error(r.error);
    const s = r.simulation;
    acc.runs += s.runs;
    acc.win += s.winRate * s.runs;
    acc.loss += s.avgLossPercent * s.runs;
    acc.wipe += s.wipeRate * s.runs;
    acc.rounds += s.avgRounds * s.runs;
  }
  return { runs: acc.runs, win: acc.win / acc.runs, loss: acc.loss / acc.runs, wipe: acc.wipe / acc.runs, rounds: acc.rounds / acc.runs };
}

console.log(`===== Nutzerflotte gegen ${SEKTOR}, Profil voll (Forschung/Module 10, Kanonier, Kampfboost) =====\n`);
console.log('Variante'.padEnd(30) + 'Schiffe'.padStart(9) + 'Laeufe'.padStart(8) + '' + 'Sieg%'.padStart(8) + 'Verlust%'.padStart(10) + 'Totalverlust%'.padStart(15) + 'Runden'.padStart(8));

for (const [label, extra] of [
  ['ohne Imperator', {}],
  ['mit 6 Imperatoren', { imperator: 6 }],
  ['mit 12 Imperatoren', { imperator: 12 }],
  ['nur Salvenschiffe weglassen', null],
]) {
  let fleet;
  if (extra === null) {
    fleet = { ...FLOTTE, imperator: 6 };
    delete fleet.salvenjaeger; delete fleet.salvenkreuzer; delete fleet.salvendreadnought;
  } else {
    fleet = { ...FLOTTE, ...extra };
  }
  const r = await run(fleet);
  console.log(
    label.padEnd(30) + String(total(fleet)).padStart(9) + String(r.runs).padStart(8) +
    (r.win.toFixed(1)+"%").padStart(8) + (r.loss.toFixed(2)+"%").padStart(10) + (r.wipe.toFixed(1)+"%").padStart(15) + r.rounds.toFixed(1).padStart(8)
  );
}
process.exit(0);
