// Entscheidung 10, Variante 5 (Nutzeridee 19.08.2026): Schonfrist fuer Neulinge.
//
// Die Frage ist KEINE Kampf-Frage und deshalb bewusst kein Kampf-Skript: es geht darum, was ein
// neues Konto in den ersten Wochen durch den Raid tatsaechlich gewinnt und verliert. Gerechnet wird
// mit den Zahlen aus der Messreihe vom 19.08.2026 (run_raid.mjs, 30 Raids je Fall).
//
// Reihenfolge im Code geprueft (finalizeRaidWaves in raids.ts): erst Bergungs-DM, dann der
// Ressourcen-Diebstahl (RAID_LOOT_PERCENT, nur wenn NICHT alle Wellen abgewehrt wurden), erst
// DANACH die Container-Belohnung. Die Belohnung eines Raids wird also nicht im selben Raid
// mitgeplue ndert - sie liegt aber beim naechsten im Bestand.
//
// Aufruf: node run_e10_schonfrist.mjs [tage] [datei]
import { appendFileSync } from 'node:fs';
import { economy } from './lib4.mjs';

const TAGE = Number(process.argv[2] || 14);
const OUT = process.argv[3] || 'raid_e10.txt';

// --- Gesetzte Annahmen, NICHT gemessen (Messregel 16: als solche kennzeichnen) ---
// Taegliche Einnahmen ausserhalb des Raids in der Startphase. 0,80 Mrd ist die Baseline-Zahl des
// Plans fuer die fruehe Phase; sie steht auf der "nicht neu aufrollen"-Liste und wird hier nur
// verwendet, nicht veraendert.
const EINNAHMEN_PRO_TAG = 0.80e9;
// Raid-Ertrag eines schwachen Kontos, gemessen: 11,0 von 12 Wellen -> 20,23 Mrd Wert je Raid.
const RAID_ERTRAG = 20.23e9;
// Anteil der Raids, bei denen ein schwaches Konto NICHT alle zwoelf Wellen schafft und damit
// gepluendert wird - gemessen 7 % perfekt, also 93 %.
const PLUENDER_WAHRSCHEINLICHKEIT = 0.93;
// Flottenwert eines Neulings (FLEET_SMALL) und sein gemessener Verlust je Raid.
const FLOTTENWERT = 0.32e9;
const FLOTTENVERLUST_ANTEIL = 0.922;

const { RAID_LOOT_PERCENT } = economy;
// Raid-Termine: Mittwoch und Sonntag jeweils 0 Uhr (RAID_FALLBACK_SCHEDULE), also alle 3,5 Tage.
const TAGE_ZWISCHEN_RAIDS = 3.5;

function simuliere({ schonfristTage }) {
  let bestand = 0;
  let geklaut = 0, ertrag = 0, flottenverlust = 0;
  let raids = 0;
  for (let tag = TAGE_ZWISCHEN_RAIDS; tag <= TAGE; tag += TAGE_ZWISCHEN_RAIDS) {
    bestand += EINNAHMEN_PRO_TAG * TAGE_ZWISCHEN_RAIDS;
    raids++;
    const geschuetzt = tag <= schonfristTage;
    if (!geschuetzt) {
      const verlust = bestand * RAID_LOOT_PERCENT * PLUENDER_WAHRSCHEINLICHKEIT;
      bestand -= verlust;
      geklaut += verlust;
      flottenverlust += FLOTTENWERT * FLOTTENVERLUST_ANTEIL;
    }
    bestand += RAID_ERTRAG;
    ertrag += RAID_ERTRAG;
  }
  return { bestand, geklaut, ertrag, flottenverlust, raids };
}

const faelle = [
  ['Ist-Zustand (kein Schutz)', { schonfristTage: 0 }],
  ['Variante 5a: Schonfrist auf die Pluenderung, 14 Tage', { schonfristTage: 14 }],
];

const lines = [
  `--- Entscheidung 10, Variante 5: Neulings-Schonfrist | Rechenmodell ueber ${TAGE} Tage ---`,
  `Annahmen (GESETZT, nicht gemessen): ${(EINNAHMEN_PRO_TAG / 1e9).toFixed(2)} Mrd/Tag ausserhalb des Raids,`,
  `Raid-Ertrag ${(RAID_ERTRAG / 1e9).toFixed(2)} Mrd (gemessen, 11,0 von 12 Wellen), Pluenderung in ${(PLUENDER_WAHRSCHEINLICHKEIT * 100).toFixed(0)} % der Raids,`,
  `RAID_LOOT_PERCENT ${RAID_LOOT_PERCENT} aus dem Code, Raid alle ${TAGE_ZWISCHEN_RAIDS} Tage (Mi + So).`,
  '',
  'Fall                                            Raids   Bestand Tag 14   gepluendert   Flottenverlust',
];
for (const [name, opts] of faelle) {
  const r = simuliere(opts);
  lines.push(
    name.padEnd(46) + String(r.raids).padStart(6)
    + `${(r.bestand / 1e9).toFixed(1)} Mrd`.padStart(17)
    + `${(r.geklaut / 1e9).toFixed(1)} Mrd`.padStart(14)
    + `${(r.flottenverlust / 1e9).toFixed(2)} Mrd`.padStart(17)
  );
}

// Variante 5b, die der Nutzer urspruenglich vorgeschlagen hat: gar kein Raid in den ersten 14 Tagen.
const ohneRaid = EINNAHMEN_PRO_TAG * TAGE;
lines.push(
  'Variante 5b: gar kein Raid, 14 Tage'.padEnd(46) + '0'.padStart(6)
  + `${(ohneRaid / 1e9).toFixed(1)} Mrd`.padStart(17) + '0.0 Mrd'.padStart(14) + '0.00 Mrd'.padStart(17)
);

// Gleichgewicht bei Dauerbetrieb: S = 0,75*(S + I) + R  ->  S = 3I + 4R
const I = EINNAHMEN_PRO_TAG * TAGE_ZWISCHEN_RAIDS;
const S = 3 * I + 4 * RAID_ERTRAG;
lines.push(
  '',
  `Gleichgewichtsbestand bei Dauerbetrieb: ${(S / 1e9).toFixed(0)} Mrd, Abschoepfung je Raid ${((S + I) * 0.25 / 1e9).toFixed(0)} Mrd.`,
  'Die Pluenderung deckelt also den BESTAND, sie verhindert nicht den Aufbau - wer vor dem Raid',
  'ausgibt, verliert nichts. Fuer einen Neuling, der die Regel noch nicht kennt, ist sie trotzdem',
  'die spuerbarste Strafe; der Flottenverlust ist daneben wirtschaftlich fast belanglos.'
);

console.log(lines.join('\n'));
appendFileSync(OUT, '\n' + lines.join('\n') + '\n');
