// !!! MESSBUILD-SKRIPT - ALLE ERGEBNISSE SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   cd server && npm install && npx tsc
//   node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=/tmp/mb_kum node probe_volley_mission_19.mjs [wellen_je_zelle]
//
// ===================================================================================
// OFFENER PUNKT AUS ENTSCHEIDUNG 19: MACHT WEG 2 DIE ENDGAME-MISSIONEN LEICHTER?
// ===================================================================================
// Gegenstueck zu probe_volley_scale_19.mjs, das dieselbe Frage fuer die RAID-Wellen
// beantwortet hat. Hier geht es um die SOLO-MISSION (piraten_hoch), also um die
// Ertragsseite, an der laut Uebergabe der offene Punkt haengt.
//
// Weg 2 lautet:   treffer_je_typ = min(DECKEL, ceil(einheiten_dieses_typs / JE))
// mit JE = 20.000 und DECKEL = 16 (Entscheidung 19, gesetzt am 25.08.2026).
// Solange KEIN Gegnertyp die JE-Marke reisst, ist der Ausdruck 1 und Weg 2 aendert
// gar nichts. Die Vorfrage ist damit rein ZAEHLBAR und braucht keinen Kampflauf
// (Messregel: wo eine Groesse deterministisch ist, ausrechnen statt simulieren).
//
// Gemessen wird nur die GEGNERERZEUGUNG einer Mission:
//   sentPower  = combatFleetPowerBase(eigene Flotte)
//   targetPower = max(sentPower * Wurf, npcFloor)      (PIRATEN_MULTIPLIER_ROLL unangetastet)
//   npc         = generatePiratenFleet(targetPower, 0, pickWaveProfile)
// Der Wurf streut, deshalb mehrere Wellen je Zelle und der GROESSTE Stapel wird
// ausgewiesen - Weg 2 greift, sobald EIN Typ die Marke reisst.
import * as L from './lib3.mjs';

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const JE = Number(process.env.JE || 20000);
const DECKEL = Number(process.env.DECKEL || 16);
const WELLEN = Number(process.argv[2] || 200);
const SEKTOR = process.env.SEKTOR || 'piraten_hoch';

// Zusammensetzung der realen Endgame-Flotte, identisch zu run_volley_power_19.mjs.
const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };
const ANTEILE = (process.argv[3] || '0.005,0.02,0.1,0.3,1.0').split(',').map(Number);

const flotte = (anteil) => {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => { const c = Math.round(n * anteil); if (c > 0) f[id] = c; });
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => (f[id] = n));
  return f;
};
const mrd = (x) => `${(x / 1e9).toFixed(1)} Mrd`;

console.log('='.repeat(96));
console.log('VORFRAGE ZU ENTSCHEIDUNG 19, WEG 2 - GREIFT ER AUF DER MISSIONSSEITE UEBERHAUPT?');
console.log('='.repeat(96));
console.log(`Build   : ${process.env.MESSBUILD || 'REPO (server/dist)'}`);
console.log(`Sektor  : ${SEKTOR}   JE = ${JE}   DECKEL = ${DECKEL}   ${WELLEN} Wellen je Zelle`);
console.log('Deterministische Zaehlung der Gegnererzeugung, KEIN Kampflauf, KEINE Serien.');
console.log('');
console.log('Anteil   eigene Schiffe   eigene Macht   groesster Feindstapel   Typen ueber JE   Treffer/Typ (max)');
console.log('-'.repeat(96));

const cfg = SEKTOR_CONFIG[SEKTOR];
for (const anteil of ANTEILE) {
  const f = flotte(anteil);
  const eigene = Object.values(f).reduce((a, b) => a + b, 0);
  const sentPower = L.combat.combatFleetPowerBase(f);
  let maxStapel = 0, maxTypenUeber = 0, maxTreffer = 1;
  for (let w = 0; w < WELLEN; w++) {
    const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[SEKTOR], SEKTOR);
    const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
    const npc = L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(SEKTOR));
    let typenUeber = 0;
    for (const [id, n] of Object.entries(npc)) {
      if (id === 'piratenkapitan') continue;
      if (n > maxStapel) maxStapel = n;
      if (n >= JE) typenUeber++;
      const treffer = Math.min(DECKEL, Math.ceil(n / JE));
      if (treffer > maxTreffer) maxTreffer = treffer;
    }
    if (typenUeber > maxTypenUeber) maxTypenUeber = typenUeber;
  }
  console.log(
    `${String(anteil).padEnd(8)} ${String(eigene).padStart(14)} ${mrd(sentPower).padStart(14)} ` +
    `${String(maxStapel).padStart(22)} ${String(maxTypenUeber).padStart(15)} ${String(maxTreffer).padStart(18)}`
  );
}

console.log('-'.repeat(96));
console.log('Lesart: "Treffer/Typ (max) = 1" heisst, Weg 2 ist in dieser Zelle WIRKUNGSLOS -');
console.log('        dann braucht es dort auch keine Serie.');
process.exit(0);
