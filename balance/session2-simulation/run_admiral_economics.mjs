// Piratenadmiral (P10) - Block B, Schritt 5, Messung M4: ERTRAG UND KADENZ (4.5 bis 4.8).
//
// Rechnet NICHT neu, sondern wertet die in M1-M3 gemessenen Rohwerte aus:
//   vernichtete Feindmacht je Durchlauf, Nettoverlust je Durchlauf, Ausgangsverteilung.
// Dazu kommen drei bereits beschlossene Groessen aus dem Plan, gegen den Code geprueft:
//   - Beute-Anker 0,0956 Wert-Einheiten je Punkt vernichteter Feindmacht (Entscheidung 2,
//     gemessen 14.08.2026, Streuung ueber drei Laeufe 0,0939-0,0956, also zwei Nachkommastellen).
//   - Beute-Exponent 0,85 mit Referenz 11,6 Mrd vernichteter Feindmacht je 24h-Solo-Mission.
//     Geltungsbereich schliesst groupOps.ts ausdruecklich ein - P10 laeuft dort, die Kurve gilt
//     also auch hier. Ein freier, linearer Faktor K waere ein Widerspruch zu Entscheidung 2.
//   - Wrack-Bergung 30 %.
// Vergleichsmassstab ist das Elite-Bollwerk aus `income_level.txt`: 56,58 Mrd/Tag im spaeten Stand
// bei ELITE_CADENCE_DAYS = 3, also 169,74 Mrd netto je 24h-Serie = 7,07 Mrd je gebundener
// Flottenstunde. Die Kadenz kuerzt sich dabei heraus, der Massstab haengt nicht an ihr.
//
// Beruehrt den Spielcode NICHT. Aufruf: node run_admiral_economics.mjs
import { combat, cc, ships, economy, sectors, value, mrd } from './lib4.mjs';

const galaxy = await import('../../server/dist/game/galaxy.js');
const gc = await import('../../server/dist/game/data/galaxyConstants.js');

const ANKER = 0.0956;          // Wert-Einheiten je Punkt vernichteter Feindmacht
const REFERENZ_DP = 11.6e9;    // Referenzflotte, vernichtete Feindmacht je 24h-Solo-Mission
const EXPONENT = 0.85;
const SALVAGE = 0.30;
const ELITE_JE_FLOTTENSTUNDE = 169.74e9 / 24;
const BASELINE_SPAET = 76.85e9;

// Beute nach Entscheidung 2. Am Referenzpunkt ergibt sie exakt den Anker.
const beute = (dp) => ANKER * REFERENZ_DP * Math.pow(dp / REFERENZ_DP, EXPONENT);

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]));
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * (byId[id]?.cost ? value(byId[id].cost) : 0), 0);

const FLEETS = {
  real:  { kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenkreuzer: 90, salvendreadnought: 30 },
  gross: { kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
};

// Gemessene Zellen aus admiral_strength.txt (Ist-Zustand) und admiral_bossscale.txt /
// admiral_roundcap.txt (mit forschungsskaliertem Boss). dpMrd = vernichtete Feindmacht,
// verlustAnteil = kumulierter Wertverlust am Serienende.
const ZELLEN = [
  { name: 'IST-ZUSTAND  voll 1x  Deckel 100',    flotte: 'real', dp: 22.59e9,  verlust: 0.003, sieg: 1.000, tiefe: 1.00 },
  { name: 'M2  voll 1,75x  Deckel 100',          flotte: 'real', dp: 101.65e9, verlust: 0.201, sieg: 0.400, tiefe: 3.98 },
  { name: 'M3  voll 1,75x  Deckel 100',          flotte: 'real', dp: 96.22e9,  verlust: 0.177, sieg: 0.475, tiefe: 3.63 },
  { name: 'M3  voll 2x     Deckel 300',          flotte: 'real', dp: 110.34e9, verlust: 0.273, sieg: 0.300, tiefe: 4.08 },
  { name: 'M3  mittel 1,5x Deckel 300',          flotte: 'real', dp: 88.98e9,  verlust: 0.261, sieg: 0.300, tiefe: 4.35 },
  { name: 'M3  mittel 2x   Deckel 300',          flotte: 'real', dp: 92.05e9,  verlust: 0.400, sieg: 0.000, tiefe: 4.08 },
  { name: 'M3  schwach 1x  Deckel 300',          flotte: 'real', dp: 32.26e9,  verlust: 0.425, sieg: 0.000, tiefe: 3.15 },
  { name: 'M2  voll/gross 1,75x Deckel 100',     flotte: 'gross', dp: 8.57e9,  verlust: 0.268, sieg: 0.275, tiefe: 3.17 },
];

// ---------- Reisezeit: bestimmt die Obergrenze der Durchlaeufe je Tag (4.8) ----------
const speedOf = (id) => byId[id]?.speed ?? 0;
const langsamstes = (f) => Object.keys(f).filter((id) => f[id] > 0).reduce((a, id) => (speedOf(id) < speedOf(a) ? id : a));

console.log('=== Piratenadmiral, Schritt 5 / M4: Ertrag und Kadenz (4.5 bis 4.8) ===\n');
console.log(`Beute-Kurve aus Entscheidung 2: Beute = ${ANKER} x ${mrd(REFERENZ_DP)} x (vernichtete Macht / ${mrd(REFERENZ_DP)})^${EXPONENT}`);
console.log(`Wrack-Bergung ${(SALVAGE * 100).toFixed(0)} %. Massstab Elite-Bollwerk: ${mrd(ELITE_JE_FLOTTENSTUNDE)} netto je gebundener Flottenstunde.\n`);

console.log('=== A. Reisezeit und Obergrenze der Durchlaeufe je Tag ===\n');
console.log('Der Anflug haengt am LANGSAMSTEN Schiff. Der Imperator (speed 100) ist in P10 erlaubt.');
console.log(`Formel: ${gc.GALAXY_DURATION_BASE_SEC} s + ${gc.GALAXY_DURATION_FACTOR} x Wurzel(Distanz x 10 / Tempo).`);
console.log(`Kampffenster: ${cc.ADMIRAL_TOTAL_CHECKS} Checks x ${cc.ADMIRAL_CHECK_INTERVAL_MS / 60000} min = ${(cc.ADMIRAL_TOTAL_CHECKS * cc.ADMIRAL_CHECK_INTERVAL_MS) / 3600000} h.\n`);
console.log('Flotte  langsamstes Schiff  Tempo  Distanz  Anflug   Hin+Rueck+Kampf  max. Durchlaeufe/Tag');
for (const fn of ['real', 'gross']) {
  const f = FLEETS[fn];
  for (const distanz of [1, 25, 100]) {
    const slow = langsamstes(f);
    const speed = speedOf(slow);
    const anflugH = galaxy.galaxyDurationMs(distanz, speed) / 3600000;
    const kampfH = (cc.ADMIRAL_TOTAL_CHECKS * cc.ADMIRAL_CHECK_INTERVAL_MS) / 3600000;
    const gesamtH = 2 * anflugH + kampfH;
    console.log(
      `${fn.padEnd(8)}${slow.padEnd(19)}${String(speed).padStart(6)}${String(distanz).padStart(9)}`
      + `${(anflugH.toFixed(2) + ' h').padStart(9)}${(gesamtH.toFixed(2) + ' h').padStart(17)}${(24 / gesamtH).toFixed(1).padStart(22)}`
    );
  }
}

console.log('\n=== B. Ertrag je Durchlauf nach der beschlossenen Beute-Kurve (ohne Sieg-Bonus) ===\n');
console.log('Zelle                             Flottenwert  vernicht.Macht     Beute  netto Verlust    netto/Durchlauf   je Flottenstd.');
const ergebnisse = [];
for (const z of ZELLEN) {
  const fw = fleetValue(FLEETS[z.flotte]);
  const b = beute(z.dp);
  const verlustNetto = fw * z.verlust * (1 - SALVAGE);
  const netto = b - verlustNetto;
  const gebundenH = 2 * (galaxy.galaxyDurationMs(25, speedOf(langsamstes(FLEETS[z.flotte]))) / 3600000) + 1;
  ergebnisse.push({ ...z, fw, b, verlustNetto, netto, jeStunde: netto / gebundenH, gebundenH });
  console.log(
    `${z.name.padEnd(34)}${mrd(fw).padStart(11)}${mrd(z.dp).padStart(16)}${mrd(b).padStart(10)}`
    + `${mrd(verlustNetto).padStart(15)}${mrd(netto).padStart(19)}${mrd(netto / gebundenH).padStart(17)}`
  );
}

console.log('\n=== C. Sieg-Bonus (4.6) und Niederlage-Anteil (4.7) - Erwartungswert je Durchlauf ===\n');
console.log('Annahme 4.7: bei Niederlage wird nur ein Anteil der bis dahin gesicherten Beute ausgezahlt.');
console.log('Der Sieg-Bonus wirkt nur auf die Sieg-Faelle, der Niederlage-Anteil nur auf die uebrigen.\n');
console.log('Zelle                             Sieganteil   Bonus 1,0x   Bonus 1,5x   Bonus 2,0x   (Niederlage-Anteil 0,50)');
for (const e of ergebnisse) {
  const zeile = [1.0, 1.5, 2.0].map((bonus) => {
    const erwartet = e.b * (e.sieg * bonus + (1 - e.sieg) * 0.50);
    return mrd(erwartet - e.verlustNetto).padStart(13);
  }).join('');
  console.log(`${e.name.padEnd(34)}${(e.sieg * 100).toFixed(1).padStart(9)}%${zeile}`);
}

console.log('\n=== D. Kadenz (4.8): Tagesbeitrag gegen die Baseline 76,85 Mrd/Tag im spaeten Stand ===\n');
console.log('Bewertet wird die empfohlene Zelle. Ohne Cooldown zaehlt die Reisezeit-Obergrenze aus A.\n');
const leit = ergebnisse.find((e) => e.name.startsWith('M3  voll 2x'));
const erwartetLeit = leit.b * (leit.sieg * 1.5 + (1 - leit.sieg) * 0.50) - leit.verlustNetto;
console.log(`Leitzelle: ${leit.name}`);
console.log(`  Beute je Durchlauf            ${mrd(leit.b)}`);
console.log(`  netto Verlust je Durchlauf    ${mrd(leit.verlustNetto)}`);
console.log(`  Erwartungswert (Bonus 1,5x)   ${mrd(erwartetLeit)}`);
console.log(`  gebundene Flottenzeit         ${leit.gebundenH.toFixed(2)} h\n`);
console.log('Cooldown              Durchlaeufe/Tag   Tagesbeitrag   Anteil an 76,85 Mrd   je Flottenstunde');
for (const [label, proTag] of [['ohne (Reisezeit)', 24 / leit.gebundenH], ['6 h', 4], ['12 h', 2], ['24 h', 1]]) {
  const tag = erwartetLeit * proTag;
  console.log(
    `${label.padEnd(22)}${proTag.toFixed(1).padStart(15)}${mrd(tag).padStart(15)}`
    + `${((tag / BASELINE_SPAET) * 100).toFixed(1).padStart(21)}%${mrd(tag / (proTag * leit.gebundenH)).padStart(19)}`
  );
}
console.log(`\nZum Vergleich: Elite-Bollwerk ${mrd(ELITE_JE_FLOTTENSTUNDE)} je Flottenstunde, ${mrd(56.58e9)}/Tag.`);
process.exit(0);
