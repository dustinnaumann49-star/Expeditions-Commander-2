// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   node make_messbuild_kum.mjs   /tmp/mb_kum  --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_salve.mjs /tmp/mb_kum  /tmp/mb_w2 --je=20000 --deckel=8
//   MESSBUILD=/tmp/mb_kum SALVE=1 node run_volley_mix_19.mjs 12
//   MESSBUILD=/tmp/mb_w2  SALVE=2 node run_volley_mix_19.mjs 12
//
// ===================================================================================
// ENTSCHEIDUNG 19 - BESTE KOMBINATION AUS WEG 1 (maxCount) UND WEG 2 (JE/DECKEL)
// ===================================================================================
// NUTZERVORGABE 25.08.2026, die die Zielrichtung dreht: die Salvenschiffe SOLLEN Glaskanonen
// sein und im Kampf viel Schaden austeilen. Sterben ist eingepreist. Wenn noetig hoeherer Preis,
// aber dafuer hoher Beitrag. Das Problem ist NICHT, dass sie zu stark sind, sondern dass sie im
// spaeten Spielstand (rund 1 Mio. Schiffe) ohne Wirkung sterben.
//
// Gemessen wird deshalb der SCHADENSANTEIL der drei Salven-Typen ueber die Flottengroesse, wie in
// run_salven_19.mjs, aber ueber vier Konfigurationen hinweg:
//   Ist        maxCount x1, keine Stapel-Salve
//   Weg 1      maxCount x2 (300/180/60), keine Stapel-Salve
//   Weg 2      maxCount x1, Treffer je Typ = min(DECKEL, ceil(Einheiten / JE))
//   Weg 1+2    beides
// Weg 1 ist eine reine Bestandsaenderung und braucht keinen eigenen Build; Weg 2 steckt im Build.
// SALVE=1|2 dient nur der Beschriftung und wird gegen den geladenen Build geprueft.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as L from './lib3.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt.');

const SALVEN = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };

// Gegenprobe, damit die Beschriftung nicht luegt: der Weg-2-Patch steht als Kommentarzeile in
// combat.js. Stimmt SALVE nicht mit dem Build ueberein, Abbruch statt stiller Fehlbeschriftung.
const combatJs = fs.readFileSync(path.join(process.env.MESSBUILD, 'game/combat.js'), 'utf8');
const hatW2 = combatJs.includes('SALVE_JE');
const SALVE = process.env.SALVE || (hatW2 ? '2' : '1');
if ((SALVE === '2') !== hatW2) throw new Error(`SALVE=${SALVE}, aber der Build ${hatW2 ? 'ENTHAELT' : 'enthaelt KEIN'} Weg 2.`);
const w2Text = hatW2 ? (combatJs.match(/SALVE_JE = (\d+)[\s\S]*?SALVE_DECKEL = (\d+)/) || []).slice(1, 3).join(' / ') : '-';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => { const s = L.ships.SHIPS.find((x) => x.id === id); return s && s.cost ? val(s.cost) : 0; };

function flotteFuer(anteil, salvenFaktor) {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => { const c = Math.round(n * anteil); if (c > 0) f[id] = c; });
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => { const c = Math.round(n * salvenFaktor); if (c > 0) f[id] = c; });
  return f;
}

async function einKampf(state, flotte) {
  const eigenePower = L.combat.combatFleetPowerBase(flotte);
  const npc = L.combat.generatePiratenFleet(eigenePower, 0, L.combat.pickWaveProfile('piraten_hoch'));
  return L.runner.runCombatInWorker({
    sideAShips: flotte, sideBShips: npc, research: state.research,
    playerClass: state.playerClass, kampfBoostActive: !!state.activeBoosters.kampf,
    shipModules: state.shipModules, retreatMode: 'none',
  });
}

const N = Number(process.argv[2] || 12);
const FAKTOREN = (process.env.FAKTOREN || '1,2').split(',').map(Number);
const ANTEILE = (process.env.ANTEILE || '0.005,0.02,0.1,0.35,1.0').split(',').map(Number);

const state = L.stateFor('voll');
say(`=== ENTSCHEIDUNG 19 - SALVEN-SCHADENSANTEIL, WEG 1 x WEG 2 ===`);
say(`MESSBUILD-WERTE. Weg 2 im Build: ${hatW2 ? `JE/DECKEL = ${w2Text}` : 'AUS (Ist-Mechanik)'}. ${N} Kaempfe je Zelle.`);
say(`Gegner jeweils auf dieselbe Rohmacht wie die eigene Flotte, Sektorprofil piraten_hoch, Profil voll.`);
say();
say('Schiffe'.padStart(10) + 'maxCount'.padStart(10) + 'Salven'.padStart(9) +
    'Schadensanteil'.padStart(16) + 'je Salvenkr.'.padStart(15) + 'je Reaper'.padStart(12) +
    'Faktor'.padStart(8) + 'Salven-Wert'.padStart(13));
for (const faktor of FAKTOREN) {
  for (const anteil of ANTEILE) {
    const flotte = flotteFuer(anteil, faktor);
    const stueck = Object.values(flotte).reduce((a, b) => a + b, 0);
    let salvSum = 0, gesamt = 0, skSum = 0, reaperSum = 0;
    for (let i = 0; i < N; i++) {
      const r = await einKampf(state, flotte);
      const d = (r.shotsA && r.shotsA.dmgDealt) || {};
      Object.entries(d).forEach(([k, v]) => {
        const id = k.includes(':') ? k.split(':')[1] : k;
        gesamt += v;
        if (SALVEN.includes(id)) salvSum += v;
        if (id === 'salvenkreuzer') skSum += v;
        if (id === 'reaper') reaperSum += v;
      });
    }
    const jeSk = skSum / N / (flotte.salvenkreuzer || 1);
    const jeRe = reaperSum / N / (flotte.reaper || 1);
    const salvWert = SALVEN.reduce((a, id) => a + (flotte[id] || 0) * unitValue(id), 0);
    say(String(stueck).padStart(10) + `x${faktor}`.padStart(10) +
        String(SALVEN.reduce((a, id) => a + (flotte[id] || 0), 0)).padStart(9) +
        `${((salvSum / gesamt) * 100).toFixed(2)} %`.padStart(16) +
        `${(jeSk / 1e6).toFixed(1)} Mio`.padStart(15) +
        `${(jeRe / 1e6).toFixed(2)} Mio`.padStart(12) +
        `${(jeSk / jeRe).toFixed(0)}x`.padStart(8) + mrd(salvWert).padStart(13));
  }
}
fs.appendFileSync(path.join(HERE, 'volley_mix_19.txt'), out.join('\n') + '\n\n');
process.exit(0);
