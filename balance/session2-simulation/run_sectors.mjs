import * as L from './lib.mjs';

const REPS = 8; // je REPS x 12 Laeufe = 96 Stichproben pro Zelle

async function cell(profile, sektor, fleet) {
  const s = L.stateFor(profile);
  const acc = { runs: 0, win: 0, retreat: 0, wipe: 0, loss: 0, rounds: 0, worst: 0 };
  for (let i = 0; i < REPS; i++) {
    const r = await L.simulator.simulateCombat(s, sektor, fleet);
    if (!r.ok) throw new Error(r.error);
    const sim = r.simulation;
    acc.runs += sim.runs;
    acc.win += sim.winRate * sim.runs;
    acc.retreat += sim.retreatRate * sim.runs;
    acc.wipe += sim.wipeRate * sim.runs;
    acc.loss += sim.avgLossPercent * sim.runs;
    acc.rounds += sim.avgRounds * sim.runs;
    acc.worst = Math.max(acc.worst, sim.worstLossPercent);
  }
  const n = acc.runs;
  return {
    runs: n,
    win: acc.win / n,
    retreat: acc.retreat / n,
    wipe: acc.wipe / n,
    loss: acc.loss / n,
    rounds: acc.rounds / n,
    worst: acc.worst,
  };
}

const SEKTOREN = ['piraten_niedrig', 'piraten_mittel', 'piraten_hoch', 'piraten_elite'];
const PROFILES = ['voll', 'voll_noboost', 'mittel', 'schwach'];
const FLEETS = { gross: L.FLEET_LARGE, klein: L.FLEET_SMALL };

console.log('Flotte | Profil | Sektor | Laeufe | Sieg% | Rueckzug% | Wipe% | oVerlust% | schlechtester Verlust% | Runden');
for (const [fname, fleet] of Object.entries(FLEETS)) {
  for (const p of PROFILES) {
    for (const sek of SEKTOREN) {
      const r = await cell(p, sek, fleet);
      console.log(
        [fname, p, sek.replace('piraten_', ''), r.runs, r.win.toFixed(0), r.retreat.toFixed(0), r.wipe.toFixed(0),
         r.loss.toFixed(1), r.worst.toFixed(0), r.rounds.toFixed(0)].join(' | ')
      );
    }
  }
}
process.exit(0);
