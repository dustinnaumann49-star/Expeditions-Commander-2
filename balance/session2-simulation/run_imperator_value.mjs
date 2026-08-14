// Entscheidung 3 (Abschnitt 8): "Gemessen wird Kampfkraft pro Ressourceneinheit im echten Kampf,
// gegen die Bandbreite der uebrigen Schiffe." Der Messauftrag aus Abschnitt 4 wurde am 14.08.2026
// mit "Schaden pro Schiff" geschlossen - das ist die falsche Kennzahl fuer diese Entscheidung und
// wird hier nachgeholt.
//
// Ein gemeinsames Gefecht, damit alle Typen unter denselben Bedingungen messen (gleiche Gegner,
// gleiche Rundenzahl, gleiche Zielauswahl). Getrennte Duelle waeren nicht vergleichbar, weil jeder
// Typ dann gegen eine andere Gegnerzusammensetzung antritt.
import { combat, ships, value, mrd } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 5);
const RESEARCH = {};
['waffen','schild','panzerung','zielerfassung','durchschlag','schildregeneration','praezision','ausweichen','kritischetreffer']
  .forEach((id) => (RESEARCH[id] = 10));

// Der Imperator kostet keine Ressourcen, sondern 3x 1.000 Spezialteile. Der Plan setzt in
// Abschnitt 2a 325.000 Ressourcen-Gegenwert je Teil an -> 975 Mio je Exemplar. Diese Zahl ist
// eine Setzung, keine Messung, und wird deshalb offen ausgewiesen.
const TEIL_GEGENWERT = 325000;
const GRIND_TAGE_PRO_STUECK = 11;

function unitValue(id) {
  const s = ships.SHIPS.find((x) => x.id === id);
  if (s.cost && Object.keys(s.cost).length) return value(s.cost);
  if (s.teileCost) return Object.values(s.teileCost).reduce((a, b) => a + b, 0) * TEIL_GEGENWERT;
  return 0;
}

const FLOTTE = {
  leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300,
  schlachtkreuzer: 400, zerstoerer: 300, reaper: 200,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
  imperator: 6,
};
const GEGNER = { leicht: 3000, schwer: 2200, kreuzer: 1400, schlachtschiff: 800, zerstoerer: 500, reaper: 350 };

const pirate = combat.computePirateResearch(RESEARCH);
const fnA = (id) => combat.getEffectiveStats(id, RESEARCH, {}, false, null, {}, false);
const fnB = (id) => combat.getEffectiveStats(id, pirate, {}, false, null, {});
const sumKey = (rec, id) => Object.entries(rec || {}).reduce((t, [k, v]) => (k === id || k.endsWith(`:${id}`) ? t + v : t), 0);

const acc = {};
for (const id of Object.keys(FLOTTE)) acc[id] = 0;
for (let i = 0; i < RUNS; i++) {
  const r = combat.resolveCombat(FLOTTE, fnA, GEGNER, fnB, RESEARCH, 0, false, null);
  for (const id of Object.keys(FLOTTE)) acc[id] += sumKey(r.shotsA.dmgDealt, id);
}

const rows = Object.keys(FLOTTE).map((id) => {
  const dmg = acc[id] / RUNS;
  const n = FLOTTE[id];
  const v = unitValue(id);
  return { id, name: combat.shipName(id), n, v, dmg, perShip: dmg / n, perValue: v ? dmg / n / v : 0 };
});
rows.sort((a, b) => b.perValue - a.perValue);

console.log('===== Entscheidung 3: Kampfkraft pro Ressourceneinheit =====');
console.log(`Gemeinsames Gefecht, ${RUNS} Laeufe, Forschung 10, ohne Module/Klasse/Boost, kein Rueckzug.`);
console.log('"Schaden je Wert" = Rohschaden pro Schiff geteilt durch seinen Ressourcen-Gegenwert.\n');
console.log('Schiff'.padEnd(20) + 'Stueck'.padStart(7) + 'Wert/Stueck'.padStart(13) + 'Schaden ges.'.padStart(14) + 'je Schiff'.padStart(12) + 'je Wert'.padStart(10));
for (const r of rows) {
  console.log(
    r.name.padEnd(20) + String(r.n).padStart(7) + mrd(r.v).padStart(13) +
    mrd(r.dmg).padStart(14) + mrd(r.perShip).padStart(12) + r.perValue.toFixed(3).padStart(10)
  );
}

const normal = rows.filter((r) => !['imperator', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'].includes(r.id));
const lo = Math.min(...normal.map((r) => r.perValue));
const hi = Math.max(...normal.map((r) => r.perValue));
const imp = rows.find((r) => r.id === 'imperator');
console.log(`\nBand der Standardschiffe: ${lo.toFixed(3)} bis ${hi.toFixed(3)}`);
console.log(`Imperator: ${imp.perValue.toFixed(3)} -> ${imp.perValue < lo ? 'UNTER dem Band' : imp.perValue > hi ? 'UEBER dem Band' : 'IM Band'}`);
console.log(`Faktor zum schwaechsten Standardschiff: ${(imp.perValue / lo).toFixed(2)}x`);
console.log(`\nZweite Bezugsgroesse (der Plan nennt sie als die eigentlich relevante): der Imperator`);
console.log(`kostet keine Ressourcen, sondern rund ${GRIND_TAGE_PRO_STUECK} Tage Grind je Exemplar. Der Ressourcen-Gegenwert`);
console.log(`von ${(TEIL_GEGENWERT).toLocaleString('de-DE')} je Teil ist eine Setzung aus Abschnitt 2a, keine Messung.`);
process.exit(0);
