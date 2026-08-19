// Block A, Schritt 2: Beute-Kurve global + Wrack-Bergung 30 % + Container-Umbau.
//
// Misst den GEBAUTEN Zustand, nicht ein Modell daneben: Kurvenfaktor, Sektor-Betraege und
// Bergungssatz kommen aus server/dist, nicht aus Konstanten in dieser Datei. Nur die
// Container-Erwartungswerte (CONTAINER_EV) sind weiterhin gemessene Groessen aus Session 1/2 -
// die stecken nicht als Zahl im Spielcode, sondern ergeben sich aus den Container-Ziehungen.
//
// Aufruf: node run_loot_curve.mjs <solo|elite|coop> [durchlaeufe]
import * as L from './lib3.mjs';

const loot = await import(process.env.MESSBUILD ? `${process.env.MESSBUILD}/game/loot.js` : '../../server/dist/game/loot.js');

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const E = L.economy;
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };

const REAL_FLEET = {
  leicht: 5000, schwer: 5000,
  kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 2000, zerstoerer: 2000, reaper: 2000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
  imperator: 6,
};

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const unitValue = (id) => {
  const s = L.ships.SHIPS.find((x) => x.id === id);
  return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0;
};

// Ein Stunden-Check gegen einen Sektor. Gibt vernichtete Feindmacht und die eigenen Verluste
// zurueck - beides sind die Groessen, an denen die neuen Regeln haengen.
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
  };
}

// ===== Solo-Mission nach den NEUEN Regeln =====
// Container: EINMAL je Mission (nicht je Check). Ressourcen: winResources x Beute-Faktor je
// gewonnenem Check. Bergung: 30 % der Baukosten der Verluste, aber nur bei Rueckkehr.
async function soloMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ships = { ...fleet };
  let wins = 0, destroyedPower = 0, resourceValue = 0;
  const salvage = { metall: 0, kristall: 0, deuterium: 0 };
  for (let c = 0; c < 6; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, sektorId, ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    const s = loot.computeSalvage(r.lostThisCheck);
    salvage.metall += s.metall; salvage.kristall += s.kristall; salvage.deuterium += s.deuterium;
    if (!r.anyDestroyed) continue;
    wins++;
    const f = loot.lootCurveFactor(r.destroyedPower, E.LOOT_CURVE_SOLO_CHECK_POWER);
    resourceValue += val(cfg.winResources) * f;
  }
  const alive = Object.values(ships).reduce((a, b) => a + b, 0) > 0;
  const containerValue = wins > 0 ? cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] : 0;
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return {
    wins, destroyedPower, lost,
    reward: containerValue + resourceValue,
    containerValue,
    salvage: alive ? val(salvage) : 0,
  };
}

// ===== Elite-Bollwerk-Serie nach den NEUEN Regeln =====
// participants: Anzahl Teilnehmer. Bei mehreren wird die Feindstaerke aus der SUMME der Flotten
// gebildet (so rechnet groupOps), und jeder bekommt die Kurve auf SEINEN Beitragsanteil (V2).
// Gleiche Flotten -> gleiche Anteile -> 1/n je Teilnehmer.
async function eliteSeries(state, fleet, participants = 1) {
  const cfg = SEKTOR_CONFIG.piraten_elite;
  const combined = {};
  Object.entries(fleet).forEach(([id, n]) => (combined[id] = n * participants));
  const ships = { ...combined };
  let streak = 0, checks = 0, destroyedPower = 0;
  let lootValue = 0, winResValue = 0, teileGained = 0;
  const salvage = { metall: 0, kristall: 0, deuterium: 0 };
  const coop = loot.coopLootMultiplier(participants);
  for (let c = 0; c < 6; c++) {
    const r = await oneCheck(state, 'piraten_elite', ships);
    if (!r) { streak = 0; continue; }
    destroyedPower += r.destroyedPower;
    const s = loot.computeSalvage(r.lostThisCheck);
    salvage.metall += s.metall; salvage.kristall += s.kristall; salvage.deuterium += s.deuterium;
    if (!r.anyDestroyed) { streak = 0; continue; }
    const esc = E.getEscalationMultiplier('piraten_elite', streak);
    streak++; checks++;
    // V2: eigener Beitragsanteil an der vernichteten Macht
    const own = r.destroyedPower / participants;
    const f = loot.lootCurveFactor(own, E.LOOT_CURVE_ELITE_CHECK_POWER) * coop;
    lootValue += val(cfg.lootBase) * esc * f;
    winResValue += val(cfg.winResources) * f;
    teileGained += Math.min(cfg.teileCap, cfg.teileCap * 0.1 * esc * f) * 3;
  }
  const perfect = checks >= E.PIRATEN_CHECK_COUNT ? 2 : 1;
  const containerValue = checks * cfg.guaranteedContainers.reduce((a, gc) => a + gc.count * CONTAINER_EV[gc.tier], 0);
  // Verluste und Bergung je Teilnehmer = Gesamtwert / Teilnehmerzahl (gleiche Flotten)
  const lostTotal = Object.entries(combined).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return {
    wins: checks, destroyedPower: destroyedPower / participants,
    lost: lostTotal / participants,
    reward: (lootValue + winResValue) * perfect + containerValue,
    containerValue,
    salvage: val(salvage) / participants,
  };
}

const MODE = process.argv[2] || 'solo';
const N = Number(process.argv[3] || 40);
const PROFILES = [
  ['frueh  (F3/M0, kleine Flotte)', 'schwach', L.FLEET_SMALL],
  ['mittel (F6/M5, Referenzflotte)', 'mittel', L.FLEET_LARGE],
  ['spaet  (F10/M10, reale Flotte)', 'voll', REAL_FLEET],
];

function header(title) {
  console.log(`\n=== ${title} (${N} Durchlaeufe je Zelle) ===`);
  console.log(
    'Zelle'.padEnd(34) + 'Siege'.padStart(6) + 'Feindmacht'.padStart(13) + 'Belohnung'.padStart(12) +
    'davon Cont.'.padStart(13) + 'Verlust'.padStart(11) + 'Bergung'.padStart(10) + 'Netto'.padStart(11)
  );
}

function line(label, rows) {
  const n = rows.length;
  const avg = (k) => rows.reduce((a, r) => a + r[k], 0) / n;
  const w = avg('wins'), dp = avg('destroyedPower'), re = avg('reward');
  const cv = avg('containerValue'), lo = avg('lost'), sa = avg('salvage');
  console.log(
    label.padEnd(34) + w.toFixed(1).padStart(6) +
    ((dp / 1e9).toFixed(1) + ' Mrd').padStart(13) +
    ((re / 1e9).toFixed(2) + ' Mrd').padStart(12) +
    ((cv / re * 100).toFixed(0) + ' %').padStart(13) +
    ((lo / 1e9).toFixed(2) + ' Mrd').padStart(11) +
    ((sa / 1e9).toFixed(2) + ' Mrd').padStart(10) +
    (((re - lo + sa) / 1e9).toFixed(2) + ' Mrd').padStart(11)
  );
}

if (MODE === 'solo') {
  header('Solo-Piraten-Sektoren, 24h-Mission');
  for (const [plabel, profile, fleet] of PROFILES) {
    const state = L.stateFor(profile);
    for (const sektor of ['piraten_niedrig', 'piraten_mittel', 'piraten_hoch']) {
      const rows = [];
      for (let i = 0; i < N; i++) rows.push(await soloMission(state, sektor, { ...fleet }));
      line(`${plabel.split(' ')[0]} / ${sektor.replace('piraten_', '')}`, rows);
    }
  }
} else if (MODE === 'elite') {
  header('Elite-Bollwerk, Serie ueber 6 Checks (allein)');
  for (const [plabel, profile, fleet] of PROFILES) {
    const state = L.stateFor(profile);
    const rows = [];
    for (let i = 0; i < N; i++) rows.push(await eliteSeries(state, { ...fleet }, 1));
    line(`${plabel.split(' ')[0]} / elite allein`, rows);
  }
} else if (MODE === 'coop') {
  header('Elite-Bollwerk: allein gegen zu zweit (je Teilnehmer)');
  for (const [plabel, profile, fleet] of PROFILES) {
    const state = L.stateFor(profile);
    for (const n of [1, 2]) {
      const rows = [];
      for (let i = 0; i < N; i++) rows.push(await eliteSeries(state, { ...fleet }, n));
      line(`${plabel.split(' ')[0]} / ${n} Teilnehmer`, rows);
    }
  }
}
process.exit(0);
