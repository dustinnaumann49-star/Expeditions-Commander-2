// Block A, Schritt 3 (Raid-Paket) / Messungen M2 und M3 in EINEM Kampflauf.
//
// M2 - BEITRAGS-MASSSTAB: Wie verteilen sich ausgeteilter und absorbierter Schaden bei einem
//      RAID auf die Beteiligten? Klaert zwei offene Punkte:
//      (1) Welcher Fall von Variante 4 gilt - "symmetrisch" (jeder bekommt 1 Topf, unabhaengig
//          von der Kontenzahl) oder "dominant" (der grosse Spieler holt in jedem fremden Raid
//          den Loewenanteil, die Skalierung bleibt). Siehe raid_yield.txt / M1.
//      (2) Die 1,6-Prozent-Frage aus Abschnitt 2a, Punkt 14. Die Zahl stammt aus einem
//          ELITE-BOLLWERK-Bericht. Bei der Heimatverteidigung steckt die eigene Seite deutlich
//          mehr ein - der absorbierte Anteil kann hier eine ganz andere Groessenordnung haben.
//
// M3 - RAID_ALLY_POWER_WEIGHT (Variante 5): Heute geht in die Feindstaerke NUR die Flotte und
//      Verteidigung des Verteidigers ein (resolveOneWave() in raids.ts, Gewichtung 70/30);
//      Verstaerker- und Halte-Flotten kaempfen mit, blaehen die Welle aber nicht auf. Der Sweep
//      laesst fremde Flotten zu 0 / 25 / 50 / 75 / 100 Prozent mitzaehlen.
//
// METHODIK
// --------
// - Repliziert resolveOneWave() ueber alle RAID_WAVE_COUNT Wellen: Feindstaerke wird PRO WELLE
//   aus der bereits dezimierten Flotte neu gerechnet, Verteidigungsanlagen werden nach jeder
//   Welle zu DEFENSE_REPAIR_PERCENT wiederhergestellt, allowRetreat = false (Punkt 27:
//   aus der Heimatverteidigung gibt es keinen Rueckzug), homeDefense = true.
// - Verstaerker-/Halte-Flotten werden zwischen den Wellen NICHT reparariert - sie tragen ihre
//   Verluste weiter, genau wie im echten Ablauf.
// - Schaden je Spieler kommt aus den besitzer-bewussten Schluesseln `${ownerKey}:${typeId}`
//   (statKey() in combat.ts, Punkt 16 der README) - er muss nicht neu erhoben, nur ausgewertet
//   werden.
// - An die Contributions werden AUSSCHLIESSLICH reine Daten uebergeben, keine Funktionen
//   (Punkt 3 der README - Funktionen ueberleben den Worker-Thread nicht).
//
// Aufruf: node run_raid_support.mjs [N=3]
import * as L from './lib.mjs';

const { RAID_WAVE_ROLL, RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER } = L.economy;
const { DEFENSE_REPAIR_PERCENT } = L.cc;

const RAID_FLEET_POWER_WEIGHT = 0.7;    // Spiegel aus raids.ts (dort nicht exportiert)
const RAID_DEFENSE_POWER_WEIGHT = 0.3;

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};

// Verstaerker-Flotten. "gross" entspricht der Groessenordnung der Heimatflotte, "bot" einer
// deutlich schwaecheren KI-Flotte, "parkend" der geparkten Ein-Schiff-Halteflotte aus dem
// Kasten bei Entscheidung 3.
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};

const FLEET_ALLY_BIG = { kreuzer: 800, schlachtschiff: 500, schlachtkreuzer: 300, zerstoerer: 200, reaper: 150 };
const FLEET_ALLY_BOT = { leicht: 600, schwer: 400, kreuzer: 150, schlachtschiff: 80 };
const FLEET_PARKED = { leicht: 1 };
// Reiner Tank: viel Panzerung, wenig Waffen - prueft, ob "Schaden fangen" ueberhaupt Anteile bringt.
const FLEET_TANK = { schwer: 2500, kreuzer: 400 };

const power = (counts) => Object.entries(counts).reduce((s, [id, n]) => {
  const b = L.combat.baseStats(id);
  return s + n * (b.waffen + b.schild + b.panzerung);
}, 0);

// ---- ein vollstaendiger Raid -------------------------------------------------------------------
async function runRaid({ defProfile, allies, allyWeight, defFleet = L.FLEET_LARGE, defDefense = DEFENSE_LARGE, snapshot = false }) {
  const st = L.stateFor(defProfile, 1);
  st.fleet = { ...defFleet };
  st.defense = { ...defDefense };
  const repair = st.playerClass === 'bollwerk' ? 0.9 : DEFENSE_REPAIR_PERCENT;

  // Zustand der Verbuendeten (Flotte wird ueber die Wellen hinweg fortgeschrieben)
  const allyState = allies.map((a) => {
    const s = L.stateFor(a.profile, 2);
    return { key: a.key, label: a.label, playerClass: a.playerClass ?? s.playerClass, state: s, ships: { ...a.ships }, start: { ...a.ships } };
  });

  const dmgDealt = {}, dmgTaken = {};
  const bump = (o, k, v) => (o[k] = (o[k] || 0) + v);

  let wavesWon = 0;
  let frozenPower = null;   // Schnappschuss der ersten Welle (raid.initialCombinedPower)
  for (let w = 0; w < RAID_WAVE_COUNT; w++) {
    const shipIds = Object.keys(st.fleet).filter((id) => st.fleet[id] > 0);
    const defIds = Object.keys(st.defense).filter((id) => st.defense[id] > 0);
    const defenderShips = {};
    shipIds.forEach((id) => (defenderShips[id] = st.fleet[id]));
    defIds.forEach((id) => (defenderShips[id] = st.defense[id]));

    let defensePower = 0, fleetPower = 0;
    defIds.forEach((id) => { const b = L.combat.baseStats(id); defensePower += st.defense[id] * (b.waffen + b.schild + b.panzerung); });
    shipIds.forEach((id) => { const b = L.combat.baseStats(id); fleetPower += st.fleet[id] * (b.waffen + b.schild + b.panzerung); });

    // HIER liegt die Aenderung von Variante 5: fremde Flotten fliessen mit allyWeight in die
    // Feindstaerke ein. allyWeight = 0 ist exakt der heutige Code.
    const livingAllies = allyState.filter((a) => Object.values(a.ships).some((n) => n > 0));
    const allyPower = livingAllies.reduce((s, a) => s + power(a.ships), 0);
    let combinedPower =
      fleetPower * RAID_FLEET_POWER_WEIGHT +
      defensePower * RAID_DEFENSE_POWER_WEIGHT +
      allyPower * RAID_FLEET_POWER_WEIGHT * allyWeight;
    // Schnappschuss-Modus (Entscheidung 3, "zusaetzlich pruefen"): die Wellenstaerke wird EINMAL
    // zu Beginn festgelegt statt pro Welle aus der bereits dezimierten Flotte neu gerechnet.
    if (frozenPower === null) frozenPower = combinedPower;
    if (snapshot) combinedPower = frozenPower;

    const domePool = L.combat.computeDomeSharedPool(st.defense, st.research, !!st.activeBoosters.kampf, st.playerClass, st.shipModules);
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * L.combat.pick503020(RAID_WAVE_ROLL);
    const npcShips = L.combat.generateFallbackFleet(waveTargetPower, L.combat.pickWaveProfile('raid'));
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) { wavesWon++; continue; }

    const contributions = [
      { ownerKey: 'owner', ships: defenderShips, research: st.research, defenseCounts: st.defense, playerClass: st.playerClass, kampfBoostActive: !!st.activeBoosters.kampf, shipModules: st.shipModules },
      ...livingAllies.map((a) => ({
        ownerKey: a.key, ships: { ...a.ships }, research: a.state.research,
        playerClass: a.playerClass, kampfBoostActive: !!a.state.activeBoosters.kampf, shipModules: a.state.shipModules,
      })),
    ];

    const result = await L.runner.runMultiOwnerCombatInWorker({
      contributions, sideBShips: npcShips, research: st.research, defenseCounts: st.defense,
      sharedShieldPoolA: domePool, allowRetreat: false, homeDefense: true,
      battleModifier: L.combat.rollBattleModifier('raid'),
    });

    // Schaden je Besitzer einsammeln (statKey `${ownerKey}:${typeId}`)
    contributions.forEach((c) => {
      Object.keys(c.ships).forEach((id) => {
        const k = `${c.ownerKey}:${id}`;
        bump(dmgDealt, c.ownerKey, result.shotsA.dmgDealt[k] || 0);
        bump(dmgTaken, c.ownerKey, result.dmgTakenA[k] || 0);
      });
    });

    // Verteidiger: Flotte bleibt dezimiert, Anlagen werden teilrepariert
    const surv = result.survivorsByOwner.owner || {};
    shipIds.forEach((id) => (st.fleet[id] = surv[id] || 0));
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const s = surv[id] || 0;
      st.defense[id] = s + Math.floor((sent - s) * repair);
    });
    // Verbuendete: keine Reparatur
    livingAllies.forEach((a) => {
      const so = result.survivorsByOwner[a.key] || {};
      Object.keys(a.ships).forEach((id) => (a.ships[id] = so[id] || 0));
    });

    if (npcIds.every((id) => (result.survivorsB[id] || 0) <= 0)) wavesWon++;
  }

  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const startDefFleet = Object.values(defFleet).reduce((a, b) => a + b, 0);
  const endDefFleet = Object.values(st.fleet).reduce((a, b) => a + b, 0);
  const startDefDef = Object.values(defDefense).reduce((a, b) => a + b, 0);
  const endDefDef = Object.values(st.defense).reduce((a, b) => a + b, 0);

  return {
    wavesWon,
    defFleetLoss: (startDefFleet - endDefFleet) / startDefFleet,
    defDefLoss: (startDefDef - endDefDef) / startDefDef,
    allyLoss: allyState.map((a) => {
      const s = Object.values(a.start).reduce((x, y) => x + y, 0);
      const e = Object.values(a.ships).reduce((x, y) => x + y, 0);
      return { key: a.key, label: a.label, loss: s ? (s - e) / s : 0 };
    }),
    dmgDealt, dmgTaken,
    totalDealt: sum(dmgDealt), totalTaken: sum(dmgTaken),
  };
}

// ---- Beitragsanteile nach beiden Massstaeben ----------------------------------------------------
// heute: (ausgeteilt + absorbiert) / Gesamtsumme beider  -> contributionShares() in stats.ts
// Vorschlag Abschnitt 2a: jede Groesse an IHRER eigenen Summe messen, dann mitteln
function shares(dealt, taken) {
  const keys = [...new Set([...Object.keys(dealt), ...Object.keys(taken)])];
  const sd = keys.reduce((s, k) => s + (dealt[k] || 0), 0);
  const st = keys.reduce((s, k) => s + (taken[k] || 0), 0);
  const heute = {}, neu = {};
  const gesamt = sd + st;
  keys.forEach((k) => {
    heute[k] = gesamt > 0 ? ((dealt[k] || 0) + (taken[k] || 0)) / gesamt : 0;
    const a = sd > 0 ? (dealt[k] || 0) / sd : 0;
    const b = st > 0 ? (taken[k] || 0) / st : 0;
    neu[k] = (a + b) / 2;
  });
  return { heute, neu, anteilAbsorbiert: gesamt > 0 ? st / gesamt : 0 };
}

// ---- Konstellationen ----------------------------------------------------------------------------
const KONSTELLATIONEN = [
  { name: 'allein (kein Beistand)', allies: [] },
  { name: '+ starker Verstaerker', allies: [{ key: 'ally1', label: 'Verstaerker gross', ships: FLEET_ALLY_BIG, profile: 'voll' }] },
  { name: '+ geparkte Halte-Flotte (1 Schiff)', allies: [{ key: 'held', label: 'Halte-Flotte 1 Schiff', ships: FLEET_PARKED, profile: 'voll' }] },
  { name: '+ reiner Tank (Bollwerk)', allies: [{ key: 'tank', label: 'Tank/Bollwerk', ships: FLEET_TANK, profile: 'voll', playerClass: 'bollwerk' }] },
  { name: 'BOT verteidigt, Spieler verstaerkt', defProfile: 'mittel', defFleet: 'klein', allies: [{ key: 'ally1', label: 'Spieler (Verstaerkung)', ships: FLEET_ALLY_BIG, profile: 'voll' }] },
  { name: 'vier Konten (2 Spieler + 2 Bots)', allies: [
    { key: 'ally1', label: 'zweiter Spieler', ships: FLEET_ALLY_BIG, profile: 'voll' },
    { key: 'bot1', label: 'Bot 1', ships: FLEET_ALLY_BOT, profile: 'mittel' },
    { key: 'bot2', label: 'Bot 2 (haltend)', ships: FLEET_PARKED, profile: 'schwach' },
  ] },
];

const N = Number(process.argv[2] || 3);
const out = [];
const p = (s = '') => out.push(s);
const pct1 = (x) => `${(x * 100).toFixed(1)}`;

p(`=== M2/M3: Raid mit Beistand - Beitragsanteile und Feindstaerke-Gewichtung ===`);
p(`${RAID_WAVE_COUNT} Wellen je Raid, ${N} komplette Raids je Zeile, Verteidiger-Profil "voll"`);
p('');

// ---- M2: Beitragsanteile im heutigen Zustand (allyWeight = 0) -----------------------------------
p('--- M2: Beitragsanteile im Raid, heutiger Zustand (fremde Flotten zaehlen nicht in die Welle) ---');
p('Konstellation | Beteiligter | Anteil heute % | Anteil Vorschlag % | Schaden ausgeteilt Mrd | absorbiert Mrd');
const m2 = {};
for (const k of KONSTELLATIONEN) {
  if (k.allies.length === 0) continue;
  const acc = { dealt: {}, taken: {} };
  let absorbAnteil = 0;
  for (let i = 0; i < N; i++) {
    const r = await runRaid({ defProfile: k.defProfile || 'voll', allies: k.allies, allyWeight: 0,
      defFleet: k.defFleet === 'klein' ? L.FLEET_SMALL : L.FLEET_LARGE,
      defDefense: k.defFleet === 'klein' ? DEFENSE_SMALL : DEFENSE_LARGE });
    Object.entries(r.dmgDealt).forEach(([key, v]) => (acc.dealt[key] = (acc.dealt[key] || 0) + v / N));
    Object.entries(r.dmgTaken).forEach(([key, v]) => (acc.taken[key] = (acc.taken[key] || 0) + v / N));
  }
  const s = shares(acc.dealt, acc.taken);
  absorbAnteil = s.anteilAbsorbiert;
  m2[k.name] = { s, acc };
  const labels = { owner: 'Verteidiger', ...Object.fromEntries(k.allies.map((a) => [a.key, a.label])) };
  Object.keys(labels).forEach((key) => {
    p(`${k.name} | ${labels[key]} | ${pct1(s.heute[key] || 0)} | ${pct1(s.neu[key] || 0)} | ${L.mrd(acc.dealt[key] || 0)} | ${L.mrd(acc.taken[key] || 0)}`);
  });
  p(`  -> absorbierter Anteil an der Gesamtsumme: ${pct1(absorbAnteil)} %  (Elite-Bollwerk-Vergleichswert aus Abschnitt 2a: 1,6 %)`);
}
p('');

// ---- M3: Sweep der Feindstaerke-Gewichtung -------------------------------------------------------
p('--- M3: RAID_ALLY_POWER_WEIGHT - Wirkung auf Schwierigkeit und Verluste ---');
p('Konstellation | Gewicht | Wellen gewonnen | Verteidiger Flottenverlust % | Anlagenverlust % | Verluste der Verbuendeten %');
const SWEEP = [0, 0.25, 0.5, 0.75, 1.0];
const soloRef = [];
for (let i = 0; i < N; i++) soloRef.push(await runRaid({ defProfile: 'voll', allies: [], allyWeight: 0 }));
p(`allein (Referenz) | - | ${(soloRef.reduce((a, r) => a + r.wavesWon, 0) / N).toFixed(1)} | ${pct1(soloRef.reduce((a, r) => a + r.defFleetLoss, 0) / N)} | ${pct1(soloRef.reduce((a, r) => a + r.defDefLoss, 0) / N)} | -`);

const vier = KONSTELLATIONEN.find((k) => k.name.startsWith('vier Konten'));
for (const wgt of SWEEP) {
  const runs = [];
  for (let i = 0; i < N; i++) runs.push(await runRaid({ defProfile: 'voll', allies: vier.allies, allyWeight: wgt }));
  const avg = (f) => runs.reduce((a, r) => a + f(r), 0) / N;
  const allyTxt = vier.allies.map((a, idx) => `${a.label} ${pct1(avg((r) => r.allyLoss[idx].loss))}`).join(', ');
  p(`vier Konten | ${wgt.toFixed(2)} | ${avg((r) => r.wavesWon).toFixed(1)} | ${pct1(avg((r) => r.defFleetLoss))} | ${pct1(avg((r) => r.defDefLoss))} | ${allyTxt}`);
}

p('');
p('--- Zusatz: Schnappschuss der ersten Welle statt Neuberechnung je Welle ---');
p('(Entscheidung 3, "zusaetzlich pruefen": heute korrigiert sich der Raid nach unten, weil jede Welle');
p(' gegen die bereits dezimierte Flotte neu bemessen wird. Frage: wird er damit ueberhaupt verlierbar?)');
p('Modus | Gewicht | Wellen gewonnen | Verteidiger Flottenverlust % | Anlagenverlust %');
for (const [snap, wgt, label] of [[false, 0, 'heute (Neuberechnung)'], [true, 0, 'Schnappschuss'], [true, 1.0, 'Schnappschuss + volles Gewicht']]) {
  const runs = [];
  for (let i = 0; i < N; i++) runs.push(await runRaid({ defProfile: 'voll', allies: vier.allies, allyWeight: wgt, snapshot: snap }));
  const avg = (f) => runs.reduce((a, r) => a + f(r), 0) / N;
  p(`${label} | ${wgt.toFixed(2)} | ${avg((r) => r.wavesWon).toFixed(1)} | ${pct1(avg((r) => r.defFleetLoss))} | ${pct1(avg((r) => r.defDefLoss))}`);
}

const text = out.join('\n');
console.log(text);
const fs = await import('node:fs');
fs.writeFileSync(new URL('./raid_support.txt', import.meta.url), text + '\n');
process.exit(0);
