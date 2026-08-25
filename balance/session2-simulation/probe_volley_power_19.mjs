// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   cd server && npm install && npx tsc
//   node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=/tmp/mb_kum node probe_volley_power_19.mjs
//
// ===================================================================================
// ENTSCHEIDUNG 19, ZAHL 2 - MULTI_TARGET_POWER_CORRECTION: SCHRITT 1 (WIRKUNGSRAUM)
// ===================================================================================
// Deterministisch, KEINE Serien - alle Groessen hier sind reine Arithmetik aus
// baseStats()/cost. Es werden bewusst keine Laeufe vorgetaeuscht (Werkzeugregel 4).
//
// Gefragt ist, WO die Korrektur ueberhaupt eine Groesse bewegt, bevor irgendetwas kalibriert
// wird (Falle: "eine Kennzahl in einer Zelle, die ohnehin jeder gewinnt, misst nichts").
// Drei Groessen haengen an combatFleetPowerBase():
//   (1) Gegnerstaerke  - missions.ts:375 targetPower = max(sentPower * wurf, npcFloor)
//   (2) Belohnung      - missions.ts:378 fleetSizeRewardMultiplier(sentPower, npcFloor)
//   (3) Piratenbasis   - pirateBaseCombat.ts garrisonPower / pirateBaseState.ts destroyedPower
// NICHT daran haengt der RAID: raids.ts Z. 333-343 rechnet combinedPower inline ueber
// baseStats() OHNE Korrektur.
//
// Zusaetzlich ausgewiesen: der WERT-Anteil der Salvenschiffe je Zelle. Er zeigt, ob eine Zelle
// einen realistischen Ausbaustand beschreibt oder eine Aufstellung, die sich niemand leisten
// wuerde - die Skalierungszellen aus run_salven_19.mjs halten die Salvenschiffe bei maxCount,
// waehrend alles andere heruntergerechnet wird.
import * as L from './lib3.mjs';

if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt.');

const SALVEN = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
const KORR = L.cc.MULTI_TARGET_POWER_CORRECTION;

const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };

function flotteFuer(anteil, salvenFaktor = 1) {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => { const c = Math.round(n * anteil); if (c > 0) f[id] = c; });
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => { const c = Math.round(n * salvenFaktor); if (c > 0) f[id] = c; });
  return f;
}

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return s && s.cost ? val(s.cost) : 0;
};
// Rohmacht OHNE jede Korrektur - das ist die Groesse, auf der die Korrektur aufsetzt.
function rohPower(fleet) {
  let t = 0;
  Object.entries(fleet).forEach(([id, n]) => {
    const b = L.combat.baseStats(id);
    if (b.waffen <= 0) return;
    t += n * (b.waffen + b.schild + b.panzerung);
  });
  return t;
}
function teilRohPower(fleet, ids) {
  const sub = {};
  ids.forEach((id) => { if (fleet[id]) sub[id] = fleet[id]; });
  return rohPower(sub);
}
function fleetValue(fleet) {
  return Object.entries(fleet).reduce((s, [id, n]) => s + n * unitValue(id), 0);
}

const mrd = (x) => (x / 1e9).toFixed(2);
const pct = (x) => `${(x * 100).toFixed(2)} %`;

console.log('=== ENTSCHEIDUNG 19 / ZAHL 2 - SCHRITT 1: WIRKUNGSRAUM DER KORREKTUR ===');
console.log('MESSBUILD-WERTE. Deterministisch, keine Serien.');
console.log(`MULTI_TARGET_POWER_CORRECTION im geladenen Build: ${KORR}`);
console.log();
console.log('Zellen = Skalierung der realen Endgame-Zusammensetzung (wie run_salven_19.mjs),');
console.log('Salvenschiffe konstant bei maxCount 150/90/30.');
console.log();
const kopf = ['Zelle', 'Schiffe', 'Stueck-A.', 'Rohmacht-A.', 'korr. Macht-A.', 'Wert-Anteil', 'Machtaufschlag', 'Belohnung'];
console.log(kopf[0].padEnd(12) + kopf[1].padStart(10) + kopf[2].padStart(11) + kopf[3].padStart(13) +
            kopf[4].padStart(16) + kopf[5].padStart(13) + kopf[6].padStart(16) + kopf[7].padStart(11));

const ANTEILE = [0.005, 0.02, 0.1, 0.35, 1.0];
const NPC_FLOOR = L.sectors.SEKTOR_CONFIG['piraten_hoch'].npcFloor || 0;

for (const a of ANTEILE) {
  const f = flotteFuer(a);
  const stueck = Object.values(f).reduce((x, y) => x + y, 0);
  const salvStueck = SALVEN.reduce((s, id) => s + (f[id] || 0), 0);
  const roh = rohPower(f);
  const rohSalv = teilRohPower(f, SALVEN);
  // korrigierte Macht = Rohmacht + (KORR-1) * Rohmacht der Salvenschiffe
  const korr = roh + (KORR - 1) * rohSalv;
  const korrSalvAnteil = (rohSalv * KORR) / korr;
  const wert = fleetValue(f);
  const wertSalv = SALVEN.reduce((s, id) => s + (f[id] || 0) * unitValue(id), 0);
  const aufschlag = korr / roh - 1;
  const belohnRoh = L.combat.fleetSizeRewardMultiplier(roh, NPC_FLOOR);
  const belohnKorr = L.combat.fleetSizeRewardMultiplier(korr, NPC_FLOOR);
  const belohnDelta = belohnKorr / belohnRoh - 1;
  // Gegenprobe: die Funktion aus dem Build muss dieselbe korrigierte Macht liefern
  const korrEcht = L.combat.combatFleetPowerBase(f);
  if (Math.abs(korrEcht - korr) / korr > 1e-9) throw new Error('Korrekturrechnung weicht von combatFleetPowerBase ab');
  console.log(
    `${String(a).padEnd(12)}${String(stueck).padStart(10)}${pct(salvStueck / stueck).padStart(11)}` +
    `${pct(rohSalv / roh).padStart(13)}${pct(korrSalvAnteil).padStart(16)}${pct(wertSalv / wert).padStart(13)}` +
    `${('+' + (aufschlag * 100).toFixed(2) + ' %').padStart(16)}${('+' + (belohnDelta * 100).toFixed(2) + ' %').padStart(11)}`
  );
}

console.log();
console.log('Machtaufschlag = um wie viel Prozent die Korrektur die BEMESSENE Flottenmacht hebt,');
console.log('also 1:1 der Aufschlag auf die Gegnerstaerke in missions.ts/groupOps.ts/simulator.ts.');
console.log('Belohnung = derselbe Aufschlag, durch fleetSizeRewardMultiplier() gerechnet');
console.log('(log10, Deckel +50 %) - der Gegenposten, der in Befund 3 nie gerechnet wurde.');
console.log();

console.log('--- Wert je Machtpunkt (Zielwert 1,15 aus Entscheidung 6), je Einheit ---');
const VERGLEICH = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer',
                   'zerstoerer', 'reaper', 'salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
console.log('Typ'.padEnd(20) + 'Wert'.padStart(14) + 'Rohmacht'.padStart(12) + 'Wert/Macht roh'.padStart(16) +
            'korr. Macht'.padStart(13) + 'Wert/Macht korr.'.padStart(18));
for (const id of VERGLEICH) {
  const b = L.combat.baseStats(id);
  const p = b.waffen + b.schild + b.panzerung;
  const v = unitValue(id);
  const isS = SALVEN.includes(id);
  const pk = p * (isS ? KORR : 1);
  console.log(id.padEnd(20) + v.toLocaleString('de-DE').padStart(14) + p.toLocaleString('de-DE').padStart(12) +
              (v / p).toFixed(2).padStart(16) + pk.toLocaleString('de-DE').padStart(13) + (v / pk).toFixed(2).padStart(18));
}
console.log();
console.log('Lesart: "Wert/Macht roh" ist die Groesse, die Entscheidung 6 auf 1,15 angeglichen hat.');
console.log('"Wert/Macht korr." ist die Groesse, mit der die Salvenschiffe tatsaechlich in die');
console.log('Gegnerskalierung eingehen - die Korrektur wirkt wie ein Preisnachlass auf ihre Macht.');
