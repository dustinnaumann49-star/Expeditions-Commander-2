// !!! MESSBUILD-SKRIPT - LAEUFT NICHT GEGEN DEN REPO-STAND !!!
//   node make_messbuild_kum.mjs <ordner ausserhalb des repos> --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=<ordner> node run_pirate_threat_17.mjs <teil> [N] [stand]
// ALLE ERGEBNISSE SIND MESSBUILD-WERTE (Block A Schritt 2 + Entscheidung 16), KEIN REPO-STAND.
//
// ===================================================================================
// ENTSCHEIDUNG 17 - PIRATENBASEN ALS BEDROHUNG, Weg B mit Staerkefaktor
// ===================================================================================
// TEILE
//   asym    Schritt 0: was kosten die Asymmetrien der Verteidigungsseite? Derselbe Kampf,
//           einmal wie heute (Spieler = Seite B) und einmal wie im Raid (Spieler = Seite A),
//           die Zwischenstufen einzeln, damit jede Zeile eine eigene Zahl bekommt.
//   kliff   Schritt 1: Sweep ueber den effektiven Multiplikator. Gibt es zwischen "spuerbar"
//           und "alles weg" ueberhaupt ein Band? ZUERST an den Extremwerten geprueft.
//
// WARUM DER SEITENTAUSCH KEIN KOSMETISCHER UNTERSCHIED IST
// Die Engine ist NICHT seitensymmetrisch. runRounds(unitsA, unitsB, research, pirateResearch)
// behandelt Seite A als Spielerseite: sharedShieldPoolA, retreatMode und homeDefense wirken
// ausschliesslich auf A, und `applyPlayerResearch` ist fuer A true, fuer B false. Steht der
// Spieler auf Seite B - so laeuft der Basis-Angriff heute -, werden seine Praezision,
// Zielerfassung, Durchschlag, Kritische Treffer und Ausweichen NICHT angewandt;
// sideBStatsOverride korrigiert nur Waffen/Schild/Panzerung.
// Ein Schuetze feuert ausserdem auch dann noch, wenn er in derselben Runde bereits gefallen ist
// (die Filterung auf hpCur > 0 passiert erst NACH beiden fireShots-Aufrufen, und die
// Schuetzen-Schleife prueft hpCur nicht). Es gibt deshalb KEINEN Erstschlag-Vorteil fuer Seite A -
// der Seitentausch ist in dieser Hinsicht neutral und isoliert sauber die uebrigen Effekte.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as L from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt - siehe Kopf dieser Datei.');

const TRADE = { metall: 1, kristall: 1.5, deuterium: 3 };
const val = (c) => (c.metall || 0) * TRADE.metall + (c.kristall || 0) * TRADE.kristall + (c.deuterium || 0) * TRADE.deuterium;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id) || L.defenses.DEFENSES.find((d) => d.id === id);
  return s && s.cost ? val(s.cost) : 0;
};
const setValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};
const REAL_FLEET = {
  leicht: 5000, schwer: 5000, kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 2000, zerstoerer: 2000, reaper: 2000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30, imperator: 6,
};
const STANDS = {
  frueh: { profile: 'schwach', fleet: L.FLEET_SMALL, defense: DEFENSE_SMALL },
  mittel: { profile: 'mittel', fleet: L.FLEET_LARGE, defense: DEFENSE_LARGE },
  spaet: { profile: 'voll', fleet: REAL_FLEET, defense: DEFENSE_LARGE },
};

// Piraten-Zustand: die angreifende Basis. Forschung bewusst auf dem Stand, den eine gewachsene
// Basis haette - SETZUNG, siehe Protokoll.
// PIRATEN_RESEARCH: Forschungsstand der angreifenden Basis. Standard 0 (Setzung, harte Richtung
// fuer die Basis). Ueber die Umgebungsvariable PRES=<stufe> wird JEDE Forschung auf diese Stufe
// gesetzt - eine gewachsene Basis forscht naemlich sehr wohl (maybeStartResearch laeuft auch fuer
// Piratenbasen, in der Array-Reihenfolge von RESEARCH).
const PRES = Number(process.env.PRES || 0);
const pirateResearchSet = () => (PRES > 0 ? L.research(PRES) : {});
const pirateState = () => ({ research: pirateResearchSet(), playerClass: null, activeBoosters: {}, shipModules: {} });

function homePower(st) {
  const combined = { ...st.fleet };
  Object.entries(st.defense).forEach(([id, n]) => (combined[id] = (combined[id] || 0) + n));
  return { combined, power: L.combat.combatFleetPowerBase(combined), value: setValue(combined) };
}

// Eine Angriffswelle nach Weg B: auf (Heimatmacht * effektiver Multiplikator) hochgerechnet.
// Zusammensetzung ueber generatePiratenFleet(), also dieselbe Erzeugung wie ueberall sonst.
function wave(targetPower, mult) {
  return L.combat.generatePiratenFleet(targetPower * mult, 0, L.combat.pickWaveProfile('piraten_hoch'));
}

// --- die fuenf Verteidigungs-Fassungen -------------------------------------------------------
// heute      : Spieler = Seite B. Kein Kuppel-Pool, kein homeDefense, KEIN Rueckzug fuer den
//              Spieler - der Standard retreatMode 'all' gilt Seite A, also den PIRATEN.
// tausch     : Spieler = Seite A, sonst nichts. Isoliert die Forschungs-Inversion.
// +kuppel    : zusaetzlich sharedShieldPoolA aus computeDomeSharedPool()
// +homedef   : zusaetzlich homeDefense: true
// +rueckzug  : zusaetzlich retreatMode 'fleetOnly'  -> das ist die Raid-Fassung
async function fight(st, state, mult, fassung) {
  const home = homePower(st);
  const npc = wave(home.power, mult);
  if (Object.keys(npc).length === 0) return null;
  const pState = pirateState();

  if (fassung === 'heute') {
    const override = {};
    Object.keys(home.combined).forEach((id) => {
      override[id] = L.combat.getEffectiveStats(id, state.research, st.defense, !!state.activeBoosters.kampf, state.playerClass, state.shipModules);
    });
    const r = await L.runner.runCombatInWorker({
      sideAShips: npc, sideBShips: home.combined, research: pState.research,
      playerClass: null, kampfBoostActive: false, shipModules: {}, sideBStatsOverride: override,
    });
    const survivors = r.survivorsB;
    return { survivors, home, retreated: r.retreated };
  }

  const npcOverride = {};
  Object.keys(npc).forEach((id) => {
    npcOverride[id] = L.combat.getEffectiveStats(id, pState.research, {}, false, null, {});
  });
  const req = {
    sideAShips: home.combined, sideBShips: npc, research: state.research,
    defenseCounts: st.defense, playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
    sideBStatsOverride: npcOverride, retreatMode: 'none',
  };
  if (fassung === 'kuppel' || fassung === 'homedef' || fassung === 'raid') {
    req.sharedShieldPoolA = L.combat.computeDomeSharedPool(st.defense, state.research, !!state.activeBoosters.kampf, state.playerClass, state.shipModules);
  }
  if (fassung === 'homedef' || fassung === 'raid') req.homeDefense = true;
  if (fassung === 'raid') req.retreatMode = 'fleetOnly';
  const r = await L.runner.runCombatInWorker(req);
  return { survivors: r.survivorsA, home, retreated: r.retreated };
}

function lossOf(res) {
  let lost = 0, lostShips = 0, shipStart = 0;
  Object.entries(res.home.combined).forEach(([id, n]) => {
    const s = res.survivors[id] || 0;
    lost += (n - s) * unitValue(id);
    const isShip = L.ships.SHIPS.some((x) => x.id === id);
    if (isShip) { shipStart += n; lostShips += n - s; }
  });
  return { valueLoss: lost / res.home.value, fleetLoss: shipStart ? lostShips / shipStart : 0 };
}

async function series(st, state, mult, fassung, N) {
  const vs = [], fs = [];
  let total = 0;
  for (let i = 0; i < N; i++) {
    const r = await fight(st, state, mult, fassung);
    if (!r) continue;
    const l = lossOf(r);
    vs.push(l.valueLoss); fs.push(l.fleetLoss);
    if (l.valueLoss >= 0.999) total++;
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const m = mean(vs);
  const sd = Math.sqrt(mean(vs.map((x) => (x - m) ** 2)));
  return { v: m, f: mean(fs), sd, cov: m > 0 ? sd / m : 0, total: total / vs.length, n: vs.length };
}

// ---------------------------------------------------------------------------------------------
async function teilAsym(N, standKey, mult) {
  const st = STANDS[standKey];
  const state = L.stateFor(st.profile);
  const home = homePower(st);
  say(`=== TEIL "asym" - SCHRITT 0: WAS KOSTEN DIE VIER ASYMMETRIEN? (Stand ${standKey}) ===`);
  say(`Heimatmacht ${mrd(home.power)}, Heimatwert ${mrd(home.value)} (Flotte + Verteidigung).`);
  say(`Angriffswelle auf Heimatmacht x ${mult.toFixed(2)} hochgerechnet, ${N} Durchlaeufe je Fassung.`);
  say('Gemessen wird der WERTVERLUST des Spielers (Flotte + Verteidigung zusammen).');
  say();
  say('Fassung'.padEnd(30) + 'Wertverlust'.padStart(13) + 'Flottenverlust'.padStart(16) +
      'Totalverlust'.padStart(14) + 'Streuung'.padStart(11));
  const FASSUNGEN = [
    ['heute (Spieler = Seite B)', 'heute'],
    ['nur Seitentausch', 'tausch'],
    ['+ Kuppel-Pool', 'kuppel'],
    ['+ homeDefense', 'homedef'],
    ['+ Rueckzug = Raid-Fassung', 'raid'],
  ];
  for (const [name, key] of FASSUNGEN) {
    const r = await series(st, state, mult, key, N);
    say(name.padEnd(30) + `${(r.v * 100).toFixed(1)} %`.padStart(13) + `${(r.f * 100).toFixed(1)} %`.padStart(16) +
        `${(r.total * 100).toFixed(0)} %`.padStart(14) + `${(r.cov * 100).toFixed(1)} %`.padStart(11));
  }
}

async function teilKliff(N, standKey) {
  const st = STANDS[standKey];
  const state = L.stateFor(st.profile);
  const home = homePower(st);
  say(`=== TEIL "kliff" - SCHRITT 1: GIBT ES EIN BAND? (Stand ${standKey}) ===`);
  say(`Heimatmacht ${mrd(home.power)}, Heimatwert ${mrd(home.value)}. ${N} Durchlaeufe je Zelle. Piratenforschung: Stufe ${PRES}.`);
  say('Der Multiplikator ist das PRODUKT aus Tabelle und Staerkefaktor - was hier gemessen wird,');
  say('ist die WIRKUNG, nicht die Aufteilung auf beide Regler.');
  say();
  say('Mult'.padEnd(7) + 'heute: Verlust'.padStart(16) + 'total'.padStart(8) + 'Streu.'.padStart(9) +
      '  |' + 'Raid-Fassung'.padStart(15) + 'total'.padStart(8) + 'Streu.'.padStart(9));
  const MULTS = (process.argv[5] || '0.25,0.5,0.75,1,1.25,1.5,2,3').split(',').map(Number);
  for (const m of MULTS) {
    const a = await series(st, state, m, 'heute', N);
    const b = await series(st, state, m, 'raid', N);
    say(String(m).padEnd(7) + `${(a.v * 100).toFixed(1)} %`.padStart(16) + `${(a.total * 100).toFixed(0)} %`.padStart(8) +
        `${(a.cov * 100).toFixed(0)} %`.padStart(9) + '  |' +
        `${(b.v * 100).toFixed(1)} %`.padStart(15) + `${(b.total * 100).toFixed(0)} %`.padStart(8) +
        `${(b.cov * 100).toFixed(0)} %`.padStart(9));
  }
}

const teil = process.argv[2] || 'asym';
const N = Number(process.argv[3] || 40);
const stand = process.argv[4] || 'mittel';
if (teil === 'asym') await teilAsym(N, stand, Number(process.argv[5] || 1));
else if (teil === 'kliff') await teilKliff(N, stand);
else throw new Error('Teil unbekannt: asym | kliff');

fs.appendFileSync(path.join(HERE, 'pirate_threat_17.txt'), out.join('\n') + '\n\n');
process.exit(0);
