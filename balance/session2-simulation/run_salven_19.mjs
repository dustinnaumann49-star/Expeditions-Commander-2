// !!! MESSBUILD-SKRIPT !!!
//   node make_messbuild_kum.mjs   /tmp/mb_kum   --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_salve.mjs /tmp/mb_kum   /tmp/mb_salve --je=500 --deckel=12
//   MESSBUILD=/tmp/mb_kum   node run_salven_19.mjs kurve 20     (Ist-Zustand)
//   MESSBUILD=/tmp/mb_salve node run_salven_19.mjs kurve 20     (Weg 2)
//
// ===================================================================================
// ENTSCHEIDUNG 19 - SALVENSCHIFFE IM ENDGAME
// ===================================================================================
// Frage: der Schadensanteil der drei Salven-Typen ueber die Flottengroesse. Setzt das Problem erst
// bei grossen Flotten ein, oder ist es von Anfang an angelegt?
//
// Gemessen wird der Anteil am GESAMTSCHADEN der eigenen Seite, aufgeschluesselt nach Typ - genau
// die Groesse, die der Nutzer im Kampfbericht sieht. Zusaetzlich der Schaden JE STUECK, weil der
// die eigentliche Staerke zeigt: nicht der Anteil ist das Problem, sondern die Stueckzahl.
//
// Die Flotten sind Skalierungen EINER Zusammensetzung (der realen Endgame-Flotte aus dem
// Nutzer-Screenshot vom 21.08.2026), damit ueber die Groessen hinweg dasselbe Mischungsverhaeltnis
// gilt und der Effekt nicht von einer veraenderten Aufstellung kommt. Die Salvenschiffe bleiben
// dabei bei ihrem maxCount (150/90/30) - genau das ist ja der zu pruefende Punkt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as L from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt.');

const SALVEN = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// Reale Endgame-Flotte (Nutzer-Screenshot 21.08.2026, 993.604 Schiffe). Anteil 1,00.
const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
// maxCount der Salvenschiffe - waechst NICHT mit der Flottengroesse mit. Genau das ist der Punkt.
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };

function flotteFuer(anteil, salvenFaktor = 1) {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => {
    const c = Math.round(n * anteil);
    if (c > 0) f[id] = c;
  });
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => {
    const c = Math.round(n * salvenFaktor);
    if (c > 0) f[id] = c;
  });
  return f;
}

async function einKampf(state, flotte) {
  const eigenePower = L.combat.combatFleetPowerBase(flotte);
  // Gegner auf dieselbe Rohmacht - eine faire Referenz statt eines Sektor-Wuerfels, damit der
  // Vergleich ueber die Groessen hinweg nicht vom Multiplikator-Wurf verrauscht wird.
  const npc = L.combat.generatePiratenFleet(eigenePower, 0, L.combat.pickWaveProfile('piraten_hoch'));
  const r = await L.runner.runCombatInWorker({
    sideAShips: flotte, sideBShips: npc, research: state.research,
    playerClass: state.playerClass, kampfBoostActive: !!state.activeBoosters.kampf,
    shipModules: state.shipModules, retreatMode: 'none',
  });
  return r;
}

async function teilKurve(N) {
  const state = L.stateFor('voll');
  say(`=== ENTSCHEIDUNG 19 - SCHADENSANTEIL DER SALVENSCHIFFE UEBER DIE FLOTTENGROESSE ===`);
  say(`${N} Kaempfe je Zelle. Gegner jeweils auf dieselbe Rohmacht wie die eigene Flotte.`);
  say('Zusammensetzung konstant (reale Endgame-Flotte, skaliert); Salvenschiffe bleiben bei');
  say('maxCount 150/90/30 - sie wachsen NICHT mit, genau das ist der zu pruefende Punkt.');
  say();
  say('Schiffe'.padStart(10) + 'Salven-Anteil'.padStart(15) + 'Schadensanteil'.padStart(16) +
      'je Salvenkreuzer'.padStart(19) + 'je Reaper'.padStart(13) + 'Faktor'.padStart(9));
  const ANTEILE = process.env.ANTEILE ? process.env.ANTEILE.split(',').map(Number) : [0.005, 0.02, 0.1, 0.35, 1.0];
  for (const anteil of ANTEILE) {
    const flotte = flotteFuer(anteil);
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
    const jeReaper = reaperSum / N / (flotte.reaper || 1);
    say(String(stueck).padStart(10) +
        `${((270 / stueck) * 100).toFixed(3)} %`.padStart(15) +
        `${((salvSum / gesamt) * 100).toFixed(2)} %`.padStart(16) +
        `${(jeSk / 1e6).toFixed(1)} Mio`.padStart(19) +
        `${(jeReaper / 1e6).toFixed(2)} Mio`.padStart(13) +
        `${(jeSk / jeReaper).toFixed(0)}x`.padStart(9));
  }
}

async function teilLimit(N, faktoren) {
  const state = L.stateFor('voll');
  say(`=== TEIL "limit" - WEG 1: WIEVIEL maxCount BRAUCHT ES? (${N} Kaempfe je Zelle) ===`);
  say('Endgame-Flotte (993.604 Schiffe), nur der Salven-Bestand wird vervielfacht.');
  say();
  say('Faktor'.padStart(8) + 'Salvenschiffe'.padStart(15) + 'Schadensanteil'.padStart(16) +
      'Kosten (Ressourcen)'.padStart(22));
  const kosten = { salvenjaeger: 3.0e6, salvenkreuzer: 8.4e6, salvendreadnought: 20.6e6 };
  for (const f of faktoren) {
    const flotte = flotteFuer(1.0, f);
    let salvSum = 0, gesamt = 0;
    for (let i = 0; i < N; i++) {
      const r = await einKampf(state, flotte);
      Object.entries(((r.shotsA && r.shotsA.dmgDealt) || {})).forEach(([k, v]) => {
        const id = k.includes(':') ? k.split(':')[1] : k;
        gesamt += v;
        if (SALVEN.includes(id)) salvSum += v;
      });
    }
    const k = SALVEN.reduce((a, id) => a + (flotte[id] || 0) * kosten[id], 0);
    say(`x${f}`.padStart(8) + String(SALVEN.reduce((a, id) => a + (flotte[id] || 0), 0)).padStart(15) +
        `${((salvSum / gesamt) * 100).toFixed(2)} %`.padStart(16) + mrd(k).padStart(22));
  }
}

const teil = process.argv[2] || 'kurve';
const N = Number(process.argv[3] || 20);
if (teil === 'kurve') await teilKurve(N);
else if (teil === 'limit') await teilLimit(N, (process.argv[4] || '1,3,6,10').split(',').map(Number));
else throw new Error('Teil unbekannt: kurve | limit');

fs.appendFileSync(path.join(HERE, 'salven_19.txt'), out.join('\n') + '\n\n');
process.exit(0);
