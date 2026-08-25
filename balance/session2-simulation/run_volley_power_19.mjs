// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   cd server && npm install && npx tsc
//   node make_messbuild_kum.mjs  /tmp/mb_kum   --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_korr.mjs /tmp/mb_kum   /tmp/mb_k4  --korr=4
//   MESSBUILD=/tmp/mb_k4 node run_volley_power_19.mjs aequiv 40 0.02
//
// ===================================================================================
// ENTSCHEIDUNG 19, ZAHL 2 - MULTI_TARGET_POWER_CORRECTION
// ===================================================================================
// KRITERIUM (vorab festgelegt, Form aus Entscheidung 6): bei GLEICHEM ausgegebenem Wert soll
// eine Flotte MIT Salvenschiffen dasselbe Netto liefern wie eine Flotte OHNE. Die Korrektur ist
// der einzige Regler dazwischen - sie hebt allein die BEMESSENE Macht der Flotte mit
// Salvenschiffen und damit ueber targetPower = max(sentPower * wurf, npcFloor) deren
// Gegnerstaerke. Am eigentlichen Kampf aendert sie nichts.
//
// Aufbau je Zelle:
//   Flotte A = Zusammensetzung x anteil  +  Salvenschiffe bei maxCount 150/90/30
//   Flotte B = dieselbe Zusammensetzung, hochskaliert auf DENSELBEN Flottenwert, OHNE Salven
// Beide fliegen dieselbe 24h-Solo-Mission gegen piraten_hoch; der Gegner skaliert bei beiden auf
// die jeweils eigene bemessene Macht - genau so rechnet missions.ts.
//
// Metrik ist die NETTO-WERTBILANZ je Mission (Messregel 4: nie die Verlustquote allein).
// Beute nach Block A Schritt 2 (loot.js aus dem Messbuild), Bergung 30 % nur bei Rueckkehr,
// Container flach je Mission. B haengt NICHT von der Korrektur ab und ist damit ein fester
// Bezugspunkt; nur A verschiebt sich mit ihr.
import * as L from './lib3.mjs';

if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt.');
const loot = await import(`${process.env.MESSBUILD}/game/loot.js`);

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const E = L.economy;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };
const SEKTOR = process.env.SEKTOR || 'piraten_hoch';
const PROFIL = process.env.PROFIL || 'voll';

const SALVEN = ['salvenjaeger', 'salvenkreuzer', 'salvendreadnought'];
const BASIS = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
};
const SALVEN_BESTAND = { salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 };

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return s && s.cost ? val(s.cost) : 0;
};
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(3)} Mrd`;

function basisFlotte(anteil) {
  const f = {};
  Object.entries(BASIS).forEach(([id, n]) => { const c = Math.round(n * anteil); if (c > 0) f[id] = c; });
  return f;
}
function flotteMitSalven(anteil, salvenFaktor = 1) {
  const f = basisFlotte(anteil);
  Object.entries(SALVEN_BESTAND).forEach(([id, n]) => { const c = Math.round(n * salvenFaktor); if (c > 0) f[id] = c; });
  return f;
}
// Referenzflotte OHNE Salvenschiffe auf denselben Flottenwert. Der Skalierungsfaktor wird
// numerisch bestimmt, weil Rundung auf ganze Schiffe den Wert leicht verschiebt.
function referenzAufWert(anteil, zielWert) {
  let lo = anteil, hi = anteil * 4;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (fleetValue(basisFlotte(m)) < zielWert) lo = m; else hi = m;
  }
  return basisFlotte((lo + hi) / 2);
}

async function oneCheck(state, sektorId, ships) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ids = Object.keys(ships).filter((id) => ships[id] > 0);
  if (ids.length === 0) return null;
  const sent = {};
  ids.forEach((id) => (sent[id] = ships[id]));
  const sentPower = L.combat.combatFleetPowerBase(sent);
  const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[sektorId], sektorId);
  const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
  const npcShips = L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId));
  const npcDefenses = L.combat.generateDefenseFleet(sentPower * DEFENSE_FACTOR[sektorId], 0);
  const npc = { ...npcShips, ...npcDefenses };
  if (Object.keys(npc).length === 0) return null;
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier(sektorId), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
  });
  const lostThisCheck = {};
  ids.forEach((id) => {
    const survived = result.survivorsA[id] || 0;
    if (ships[id] - survived > 0) lostThisCheck[id] = ships[id] - survived;
    ships[id] = survived;
  });
  const destroyed = {};
  Object.keys(npc).forEach((id) => {
    const d = npc[id] - (result.survivorsB[id] || 0);
    if (d > 0 && id !== 'piratenkapitan') destroyed[id] = d;
  });
  return {
    destroyedPower: L.combat.combatFleetPowerBase(destroyed),
    anyDestroyed: Object.keys(destroyed).length > 0,
    lostThisCheck,
    targetPower,
  };
}

async function soloMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ships = { ...fleet };
  let wins = 0, destroyedPower = 0, resourceValue = 0, gegnermacht = 0, checks = 0;
  const salvage = { metall: 0, kristall: 0, deuterium: 0 };
  for (let c = 0; c < 6; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, sektorId, ships);
    if (!r) continue;
    checks++;
    gegnermacht += r.targetPower;
    destroyedPower += r.destroyedPower;
    const s = loot.computeSalvage(r.lostThisCheck);
    salvage.metall += s.metall; salvage.kristall += s.kristall; salvage.deuterium += s.deuterium;
    if (!r.anyDestroyed) continue;
    wins++;
    resourceValue += val(cfg.winResources) * loot.lootCurveFactor(r.destroyedPower, E.LOOT_CURVE_SOLO_CHECK_POWER);
  }
  const alive = Object.values(ships).reduce((a, b) => a + b, 0) > 0;
  const containerValue = wins > 0 ? cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] : 0;
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  const berg = alive ? val(salvage) : 0;
  return {
    wins, checks, destroyedPower, gegnermacht, lost, berg,
    reward: containerValue + resourceValue,
    netto: containerValue + resourceValue + berg - lost,
  };
}

async function serie(state, fleet, N) {
  const acc = { wins: 0, checks: 0, destroyedPower: 0, gegnermacht: 0, lost: 0, berg: 0, reward: 0, netto: 0 };
  const nettos = [];
  for (let i = 0; i < N; i++) {
    const r = await soloMission(state, SEKTOR, fleet);
    Object.keys(acc).forEach((k) => (acc[k] += r[k]));
    nettos.push(r.netto);
  }
  Object.keys(acc).forEach((k) => (acc[k] /= N));
  const sd = Math.sqrt(nettos.reduce((a, x) => a + (x - acc.netto) ** 2, 0) / Math.max(1, N - 1));
  acc.sd = sd;
  acc.se = sd / Math.sqrt(N);
  return acc;
}

// ===================================================================================
// RAID-MODUS - nachgetragen nach dem Nutzerhinweis vom 25.08.2026
// ===================================================================================
// Der Aequivalenz-Test oben misst nur die MISSIONSSEITE. Der Nutzer berichtet, dass die
// Salvenschiffe am Raid-Tag sehr wohl sterben ("in einer Angriffswelle zur Haelfte weg"). Genau
// dort greift die Korrektur NICHT: raids.ts Z. 333-343 bildet combinedPower inline ueber
// baseStats(), ohne MULTI_TARGET_POWER_CORRECTION. Die Salvenschiffe erhoehen die Wellenstaerke
// also nur mit ihrer winzigen Rohmacht (79k/283k/554k je Stueck), tragen aber den Kampf - und
// sterben. Dieser Modus repliziert resolveOneWave() aus raids.ts und weist den WERTVERLUST je
// Typ aus, nicht nur die Stueckzahl.
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};
// Identisch zu run_raid.mjs, damit die Zahlen mit raid_hardness_18.txt vergleichbar bleiben.
const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const DEF_SET = process.env.DEF === 'large' ? DEFENSE_LARGE : DEFENSE_SMALL;

async function einRaid(state, fleet, defense) {
  const st = { ...state, fleet: { ...fleet }, defense: { ...defense } };
  const repair = L.cc.DEFENSE_REPAIR_PERCENT;
  const WAVES = Number(process.env.WAVES || L.economy.RAID_WAVE_COUNT);
  const ESC = process.env.ESC ? process.env.ESC.split(',').map(Number) : null;
  const BUNKER = Number(process.env.BUNKER || 0);
  for (let w = 0; w < WAVES; w++) {
    const shipIds = Object.keys(st.fleet).filter((id) => st.fleet[id] > 0);
    const defIds = Object.keys(st.defense).filter((id) => st.defense[id] > 0);
    const defenderShips = {};
    shipIds.forEach((id) => (defenderShips[id] = st.fleet[id]));
    defIds.forEach((id) => (defenderShips[id] = st.defense[id]));
    let defensePower = 0, fleetPower = 0;
    defIds.forEach((id) => { const b = L.combat.baseStats(id); defensePower += st.defense[id] * (b.waffen + b.schild + b.panzerung); });
    shipIds.forEach((id) => { const b = L.combat.baseStats(id); fleetPower += st.fleet[id] * (b.waffen + b.schild + b.panzerung); });
    const combinedPower = fleetPower * 0.7 + defensePower * 0.3;
    const domePool = L.combat.computeDomeSharedPool(st.defense, st.research, !!st.activeBoosters.kampf, st.playerClass, st.shipModules);
    const waveFactor = L.combat.pick503020(L.economy.RAID_WAVE_ROLL);
    const phase = ESC ? Math.min(ESC.length - 1, Math.floor((w / WAVES) * ESC.length)) : 0;
    const escFactor = ESC ? ESC[phase] : 1;
    const waveTargetPower = Math.max(combinedPower, L.economy.RAID_MIN_TARGET_POWER) * waveFactor * escFactor;
    const bunkerAnteil = BUNKER > 0 && ESC && phase === ESC.length - 1 ? BUNKER : 0;
    const npcShips = L.combat.generateFallbackFleet(waveTargetPower * (1 - bunkerAnteil), L.combat.pickWaveProfile('raid'));
    if (bunkerAnteil > 0) {
      const bb = L.combat.baseStats('bomber');
      npcShips.bomber = (npcShips.bomber || 0) + Math.round((waveTargetPower * bunkerAnteil) / (bb.waffen + bb.schild + bb.panzerung));
    }
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) continue;
    const result = await L.runner.runCombatInWorker({
      sideAShips: defenderShips, sideBShips: npcShips, research: st.research,
      defenseCounts: st.defense, sharedShieldPoolA: domePool, retreatMode: 'fleetOnly',
      battleModifier: L.combat.rollBattleModifier('raid'), playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules,
    });
    shipIds.forEach((id) => { st.fleet[id] = result.survivorsA[id] || 0; });
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const surv = result.survivorsA[id] || 0;
      st.defense[id] = surv + Math.floor((sent - surv) * repair);
    });
  }
  return st.fleet;
}

const modus = process.argv[2] || 'aequiv';
const N = Number(process.argv[3] || 40);
const ZELLEN = (process.argv[4] || '0.005,0.02,0.1').split(',').map(Number);

// Scheibenweises Messen (Werkzeugregel 2): eine Scheibe je Aufruf, Ergebnis sofort an eine
// JSONL-Datei angehaengt. Die Auswertung liest sie zusammen. Ohne das laeuft eine 40er-Zelle
// laenger als ein einzelner Aufruf durchhaelt, und ein Abbruch kostet die ganze Zelle.
const LOG = process.env.LOG || null;

if (modus === 'aequiv') {
  const state = L.stateFor(PROFIL);
  const KORR = L.cc.MULTI_TARGET_POWER_CORRECTION;
  console.log('=== ENTSCHEIDUNG 19 / ZAHL 2 - AEQUIVALENZ BEI GLEICHEM FLOTTENWERT ===');
  console.log(`MESSBUILD-WERTE. MULTI_TARGET_POWER_CORRECTION = ${KORR}, Profil ${PROFIL}, Sektor ${SEKTOR}, ${N} Missionen je Zelle.`);
  console.log('A = mit Salvenschiffen (maxCount), B = gleicher Flottenwert ohne Salvenschiffe.');
  console.log();
  console.log('Zelle'.padEnd(9) + 'Flottenwert'.padStart(12) + 'Seite'.padStart(7) + 'Schiffe'.padStart(10) +
              'bem. Macht'.padStart(13) + 'Gegnermacht'.padStart(13) + 'Siege'.padStart(7) +
              'Beute'.padStart(11) + 'Verlust'.padStart(11) + 'Netto'.padStart(12) + '+/-'.padStart(10));
  for (const anteil of ZELLEN) {
    const A = flotteMitSalven(anteil);
    const wertA = fleetValue(A);
    const B = referenzAufWert(anteil, wertA);
    // B enthaelt keine Salvenschiffe und haengt damit NICHT von der Korrektur ab. Bei einem Sweep
    // ueber die Korrektur muss sie deshalb nur EINMAL gemessen werden (SEITE=A fuer die uebrigen
    // Punkte) - das ist keine Auslassung, sondern eine Groesse, die konstruktiv konstant ist.
    const seite = process.env.SEITE || 'AB';
    const zeilen = [['A', A], ['B', B]].filter(([n]) => seite.includes(n));
    const res = {};
    for (const [name, f] of zeilen) {
      const r = await serie(state, f, N);
      res[name] = r;
      const stueck = Object.values(f).reduce((a, b) => a + b, 0);
      console.log(
        String(anteil).padEnd(9) + mrd(fleetValue(f)).padStart(12) + name.padStart(7) + String(stueck).padStart(10) +
        mrd(L.combat.combatFleetPowerBase(f)).padStart(13) + mrd(r.gegnermacht).padStart(13) +
        r.wins.toFixed(2).padStart(7) + mrd(r.reward).padStart(11) + mrd(r.lost).padStart(11) +
        mrd(r.netto).padStart(12) + mrd(r.se).padStart(10)
      );
    }
    if (res.A && res.B) {
      const diff = res.A.netto - res.B.netto;
      const z = diff / Math.sqrt(res.A.se ** 2 + res.B.se ** 2);
      console.log(`${' '.repeat(9)}-> A minus B: ${mrd(diff)}  (${((res.A.netto / res.B.netto - 1) * 100).toFixed(1)} %, z = ${z.toFixed(2)})`);
    }
  }
} else if (modus === 'anteile') {
  // Reine Arithmetik, keine Serien: Wert- und Machtanteile der beiden Flotten je Zelle.
  const KORR = L.cc.MULTI_TARGET_POWER_CORRECTION;
  console.log(`=== ZELLEN-UEBERSICHT (deterministisch), Korrektur ${KORR} ===`);
  for (const anteil of ZELLEN) {
    const A = flotteMitSalven(anteil);
    const wertA = fleetValue(A);
    const B = referenzAufWert(anteil, wertA);
    const wertSalv = SALVEN.reduce((s, id) => s + (A[id] || 0) * unitValue(id), 0);
    console.log(`${anteil}: Wert ${mrd(wertA)}, Salven-Wertanteil ${((wertSalv / wertA) * 100).toFixed(2)} %, ` +
      `A ${Object.values(A).reduce((a, b) => a + b, 0)} Schiffe / Macht ${mrd(L.combat.combatFleetPowerBase(A))}, ` +
      `B ${Object.values(B).reduce((a, b) => a + b, 0)} Schiffe / Macht ${mrd(L.combat.combatFleetPowerBase(B))}`);
  }
} else if (modus === 'scheibe') {
  // Aufruf: LOG=datei.jsonl MESSBUILD=... node run_volley_power_19.mjs scheibe <N> <anteil> <A|B>
  const { appendFileSync } = await import('node:fs');
  if (!LOG) throw new Error('LOG=<datei.jsonl> fehlt - ohne Ablage waere die Scheibe verloren.');
  const anteil = ZELLEN[0];
  const seite = (process.argv[5] || 'A').toUpperCase();
  const state = L.stateFor(PROFIL);
  const KORR = L.cc.MULTI_TARGET_POWER_CORRECTION;
  const A = flotteMitSalven(anteil);
  const f = seite === 'A' ? A : referenzAufWert(anteil, fleetValue(A));
  for (let i = 0; i < N; i++) {
    const r = await soloMission(state, SEKTOR, f);
    appendFileSync(LOG, JSON.stringify({
      korr: KORR, profil: PROFIL, sektor: SEKTOR, anteil, seite,
      wert: fleetValue(f), macht: L.combat.combatFleetPowerBase(f),
      wins: r.wins, checks: r.checks, gegnermacht: r.gegnermacht,
      reward: r.reward, lost: r.lost, berg: r.berg, netto: r.netto,
    }) + '\n');
  }
  console.log(`Scheibe fertig: korr=${KORR} anteil=${anteil} seite=${seite} n=${N} -> ${LOG}`);
} else if (modus === 'auswert') {
  const { readFileSync } = await import('node:fs');
  const datei = process.argv[3];
  const zeilen = readFileSync(datei, 'utf8').trim().split('\n').filter(Boolean).map((z) => JSON.parse(z));
  const gruppen = new Map();
  for (const z of zeilen) {
    const k = `${z.anteil}|${z.korr}|${z.seite}|${z.profil}|${z.sektor}`;
    if (!gruppen.has(k)) gruppen.set(k, []);
    gruppen.get(k).push(z);
  }
  const mittel = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length;
  const zeilenAus = [];
  for (const [k, arr] of gruppen) {
    const [anteil, korr, seite, profil, sektor] = k.split('|');
    const netto = mittel(arr, (x) => x.netto);
    const sd = Math.sqrt(arr.reduce((a, x) => a + (x.netto - netto) ** 2, 0) / Math.max(1, arr.length - 1));
    zeilenAus.push({
      anteil: Number(anteil), korr: Number(korr), seite, profil, sektor, n: arr.length,
      macht: arr[0].macht, wert: arr[0].wert,
      gegner: mittel(arr, (x) => x.gegnermacht), wins: mittel(arr, (x) => x.wins),
      reward: mittel(arr, (x) => x.reward), lost: mittel(arr, (x) => x.lost),
      netto, se: sd / Math.sqrt(arr.length),
    });
  }
  zeilenAus.sort((a, b) => a.anteil - b.anteil || a.korr - b.korr || a.seite.localeCompare(b.seite));
  console.log('Zelle'.padEnd(8) + 'korr'.padStart(6) + 'Seite'.padStart(6) + 'n'.padStart(5) +
              'bem. Macht'.padStart(13) + 'Gegnermacht'.padStart(13) + 'Siege'.padStart(7) +
              'Beute'.padStart(11) + 'Verlust'.padStart(11) + 'Netto'.padStart(12) + '+/-'.padStart(11));
  for (const r of zeilenAus) {
    console.log(String(r.anteil).padEnd(8) + String(r.korr).padStart(6) + r.seite.padStart(6) + String(r.n).padStart(5) +
      mrd(r.macht).padStart(13) + mrd(r.gegner).padStart(13) + r.wins.toFixed(2).padStart(7) +
      mrd(r.reward).padStart(11) + mrd(r.lost).padStart(11) + mrd(r.netto).padStart(12) + mrd(r.se).padStart(11));
  }
  console.log();
  console.log('--- A gegen B je Zelle und Korrekturwert ---');
  const bs = zeilenAus.filter((r) => r.seite === 'B');
  for (const a of zeilenAus.filter((r) => r.seite === 'A')) {
    // Referenz B ist von der Korrektur unabhaengig: alle B-Laeufe derselben Zelle zusammenfassen.
    const bArr = bs.filter((b) => b.anteil === a.anteil && b.profil === a.profil && b.sektor === a.sektor);
    if (bArr.length === 0) continue;
    const nB = bArr.reduce((s, b) => s + b.n, 0);
    const nettoB = bArr.reduce((s, b) => s + b.netto * b.n, 0) / nB;
    const seB = Math.sqrt(bArr.reduce((s, b) => s + (b.se * b.n) ** 2, 0)) / nB;
    const diff = a.netto - nettoB;
    const z = diff / Math.sqrt(a.se ** 2 + seB ** 2);
    console.log(`Zelle ${a.anteil}, korr ${String(a.korr).padStart(2)}: A ${mrd(a.netto)} gegen B ${mrd(nettoB)} (n=${nB})` +
      `  ->  ${((a.netto / nettoB - 1) * 100).toFixed(1).padStart(7)} %   z = ${z.toFixed(2).padStart(6)}`);
  }
} else if (modus === 'raid') {
  const state = L.stateFor(PROFIL);
  const seite = process.env.SEITE || 'AB';
  console.log('=== ENTSCHEIDUNG 19 / ZAHL 2 - RAID-TAG, WERTVERLUST JE TYP ===');
  console.log(`MESSBUILD-WERTE. Korrektur ${L.cc.MULTI_TARGET_POWER_CORRECTION} (im Raid wirkungslos, raids.ts rechnet inline).`);
  console.log(`Profil ${PROFIL}, ${process.env.WAVES || L.economy.RAID_WAVE_COUNT} Wellen, ESC=${process.env.ESC || 'aus'}, BUNKER=${process.env.BUNKER || 0}, ${N} Raids je Zelle.`);
  console.log();
  console.log('Zelle'.padEnd(9) + 'Seite'.padStart(6) + 'Wellenmacht'.padStart(13) + 'Stueckverlust'.padStart(15) +
              'Wertverlust'.padStart(13) + 'in % Wert'.padStart(11) + 'Salven-Verlust'.padStart(16) + 'davon Wert'.padStart(12));
  for (const anteil of ZELLEN) {
    const A = flotteMitSalven(anteil);
    const wertA = fleetValue(A);
    const B = referenzAufWert(anteil, wertA);
    for (const [name, f] of [['A', A], ['B', B]].filter(([n]) => seite.includes(n))) {
      let stueckStart = 0, stueckEnd = 0, wertVerlust = 0, salvStart = 0, salvEnd = 0, salvWert = 0;
      for (let i = 0; i < N; i++) {
        const rest = await einRaid(state, f, DEF_SET);
        Object.entries(f).forEach(([id, n]) => {
          const weg = n - (rest[id] || 0);
          stueckStart += n; stueckEnd += rest[id] || 0;
          wertVerlust += weg * unitValue(id);
          if (SALVEN.includes(id)) { salvStart += n; salvEnd += rest[id] || 0; salvWert += weg * unitValue(id); }
        });
      }
      let fleetPower = 0;
      Object.entries(f).forEach(([id, n]) => { const b = L.combat.baseStats(id); fleetPower += n * (b.waffen + b.schild + b.panzerung); });
      let defPower = 0;
      Object.entries(DEF_SET).forEach(([id, n]) => { const b = L.combat.baseStats(id); defPower += n * (b.waffen + b.schild + b.panzerung); });
      const welle = fleetPower * 0.7 + defPower * 0.3;
      console.log(
        String(anteil).padEnd(9) + name.padStart(6) + mrd(welle).padStart(13) +
        `${(((stueckStart - stueckEnd) / stueckStart) * 100).toFixed(1)} %`.padStart(15) +
        mrd(wertVerlust / N).padStart(13) + `${((wertVerlust / N / fleetValue(f)) * 100).toFixed(1)} %`.padStart(11) +
        (salvStart ? `${(((salvStart - salvEnd) / salvStart) * 100).toFixed(1)} %` : '-').padStart(16) +
        (salvStart ? mrd(salvWert / N) : '-').padStart(12)
      );
    }
  }
} else {
  throw new Error(`Unbekannter Modus: ${modus}`);
}
