// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//
// ===================================================================================
// VERDRAHTUNGSPROBE BLOCK A SCHRITT 2
// ===================================================================================
// Frage: zahlt die Beute-Kurve in missions.js TATSAECHLICH, oder liegt game/loot.js nur
// unbenutzt im Build? check_build_anker.mjs kann das nicht beantworten - es baut die
// Missionsschleife SELBST nach und prueft damit die Kurven-KONSTANTEN, nicht die
// Verdrahtung (sim13_geruest.txt Abschnitt 4, Grenze der Pruefung).
//
//   cd server && npm install && npx tsc -p tsconfig.json
//   node make_messbuild_kum.mjs   /tmp/mb_kum     --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_sim13.mjs /tmp/mb_kum  /tmp/sim13/dist
//   MESSBUILD=/tmp/sim13/dist node probe_verdrahtung_a.mjs [N]
//
// Verfahren: dieselbe Zelle wie der Ankercheck (Profil mittel, piraten_hoch, FLEET_LARGE),
// einmal durch die ECHTE Missionsschleife (sendFleet -> processMissions -> finalizeMission)
// und einmal durch die Referenzschleife aus check_build_anker.mjs. Verglichen wird NORMIERT
// auf die vernichtete Feindmacht, nie roh (Messregel aus loot_curve.txt).
//
// FUENF FALLEN, DIE HIER GREIFEN:
//  1) Uhr konstant INNERHALB eines Schritts - tick()/missions benutzen Date.now auch als
//     Stoppuhr. SIM_NOW wird nur ZWISCHEN den Schritten bewegt.
//  2) Startdatum auf einen MITTWOCH. isWeeklyEventActive('piraten_bonus') verdoppelt Mo/Fr
//     ueber PIRATEN_EVENT_BONUS_MULTIPLIER den Ertrag - die Referenzschleife kennt diesen
//     Verdoppler NICHT, an einem Montag waeren Probe und Referenz um Faktor 2 auseinander
//     und es saehe wie ein Verdrahtungsfehler aus.
//  3) KEIN Sandronator in der Flotte - zweiter Verdoppler derselben Art (FLEET_LARGE
//     enthaelt ohnehin keinen, wird aber ausdruecklich geprueft statt angenommen).
//  4) state.js/galaxy.js/stats.js importieren db.js - der Lauf braucht den Laufordner mit
//     node_modules-Symlink, den make_messbuild_sim13.mjs anlegt. Die Datenbank landet unter
//     <lauf>/data und nicht im geteilten /tmp/data.
//  5) process.exit(0) am Ende - combatRunner haelt einen Worker-Thread offen.
//
// WARUM defaultPlayerState() STATT DES STUBS AUS lib3.mjs: die echte Missionsschleife fasst
// state.missions, state.inventory, state.stats, state.messages, state.teile und state.createdAt
// an. Ein handgebauter Stub muesste diese Feldnamen raten - genau der Fehler aus Messregel 16
// ("kein Feld miningCapable"). Profilwerte (Forschung 6, Module 5, Kanonier, Kampf-Booster)
// werden danach aus DERSELBEN Quelle gesetzt, aus der die Referenzschleife sie nimmt.
import * as L from './lib3.mjs';

if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt - dieser Check ist nur fuer Messbuilds gedacht.');
const B = process.env.MESSBUILD;

const loot = await import(`${B}/game/loot.js`);
const missionsMod = await import(`${B}/game/missions.js`);
const stateMod = await import(`${B}/game/state.js`);

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const E = L.economy;
const N = Number(process.argv[2] || 40);
const SEKTOR = 'piraten_hoch';
const SOLL_JE_PUNKT = 0.0946;

const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };
const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const mrd = (x) => `${(x / 1e9).toFixed(3)} Mrd`;

// ===== Falle 1 + 2: gefaelschte Uhr, schrittkonstant, Startdatum Mittwoch =====
// 26.08.2026 ist ein Mittwoch. 10:00 Berliner Zeit, damit die 24h-Mission nicht ueber einen
// Wochentagswechsel in den Freitag laeuft (sie endet am Donnerstag).
const START = new Date('2026-08-26T08:00:00Z').getTime();
let SIM_NOW = START;
const ECHT_NOW = Date.now;
Date.now = () => SIM_NOW;

// Gegenprobe zu Falle 2, deterministisch: der Wochen-Event-Verdoppler darf im gesamten
// Missionsfenster NICHT aktiv sein, sonst ist die Probe nicht mit der Referenz vergleichbar.
for (const stunde of [0, 6, 12, 18, 24, 30]) {
  SIM_NOW = START + stunde * 3600 * 1000;
  if (E.isWeeklyEventActive('piraten_bonus')) {
    throw new Error(`Wochen-Event aktiv bei Stunde ${stunde} - Startdatum verschieben (Falle 2).`);
  }
}
SIM_NOW = START;

// ===== Falle 3: kein Sandronator =====
const SELECTION = { ...L.FLEET_LARGE };
if (SELECTION.sandronator) throw new Error('Sandronator in der Pruefflotte - verdoppelt den Ertrag (Falle 3).');

function profilState(userId) {
  const s = stateMod.defaultPlayerState(userId);
  s.research = L.research(6);
  s.shipModules = L.modules(5, L.ALL_SHIP_IDS);
  s.playerClass = 'kanonier';
  s.activeBoosters = { kampf: SIM_NOW + 30 * 24 * 3600 * 1000 };
  // Frischling-Bonus ausschliessen: er wirkt ueber miningMultiplier() nur auf Asteroiden-
  // Farming, aber ein 0-Zeitstempel waere eine stille Annahme. Konto ist alt.
  s.createdAt = SIM_NOW - 400 * 24 * 3600 * 1000;
  // Die Bergung zieht ihren Betrag von stats.resourcesSpentShipsDefense ab (Fehlerform R6:
  // sonst waere "Schiffe im Kampf verheizen" ein besserer Punkte-Farm als das Verschrotten
  // derselben Schiffe). Bei einem Startwert 0 faengt Math.max(0, ...) den Abzug ab und die
  // Buchung ist NICHT beobachtbar - ein Nullwert saehe dann wie "Abzug fehlt" aus. Deshalb
  // ein realistischer Ausgangsbestand.
  s.stats.resourcesSpentShipsDefense = 1e15;
  s.fleet = { ...SELECTION };
  s.missions = [];
  s.inventory = [];
  s.messages = [];
  return s;
}

// ===================================================================================
// A - ECHTE MISSIONSSCHLEIFE
// ===================================================================================
async function echteMission() {
  SIM_NOW = START;
  const state = profilState(1);
  const vorher = { ...state.resources };
  const spentVorher = state.stats.resourcesSpentShipsDefense || 0;

  const res = missionsMod.sendFleet(state, SEKTOR, SELECTION);
  if (!res.ok) throw new Error(`sendFleet abgelehnt: ${res.error}`);
  const mission = state.missions[0];

  // Schrittweise durch die Mission. Uhr NUR hier bewegt, innerhalb eines processMissions()
  // konstant (Falle 1). Schrittweite 4 h = PIRATEN_CHECK_INTERVAL_MS, also ein Check je
  // Schritt; der letzte Schritt liegt hinter returnTime und loest finalizeMission() aus.
  const schritte = [];
  for (let k = 0; k <= 6; k++) schritte.push(mission.arriveTime + k * E.PIRATEN_CHECK_INTERVAL_MS);
  schritte.push(mission.returnTime + 1000);

  for (const t of schritte) {
    SIM_NOW = t;
    await missionsMod.processMissions(state);
  }

  if (!mission.finalized) throw new Error('Mission wurde nicht finalisiert - Schrittfolge pruefen.');

  // Vernichtete Feindmacht aus dem SPIELEIGENEN Bericht, nicht aus einer Instrumentierung
  // des Builds: skirmishTotals.npc summiert destroyedCount je Typ ueber alle Checks
  // (mergeUnitResults in messages.js). Piratenkapitaen zaehlt nicht mit - genau wie in der
  // Referenzschleife und im Patch A3.
  const destroyed = {};
  for (const row of mission.skirmishTotals?.npc || []) {
    if (row.id === 'piratenkapitan') continue;
    if ((row.destroyedCount || 0) > 0) destroyed[row.id] = row.destroyedCount;
  }
  const destroyedPower = L.combat.combatFleetPowerBase(destroyed);

  // Eigene Verluste -> Bergungsanteil, damit er vom Kurvenanteil getrennt ausgewiesen werden
  // kann. Die Referenzschleife kennt keine Bergung.
  const verloren = {};
  for (const row of mission.skirmishTotals?.player || []) {
    if ((row.lost || 0) > 0) verloren[row.id] = row.lost;
  }
  const bergung = val(loot.computeSalvage(verloren));

  const resourceValue = val({
    metall: state.resources.metall - vorher.metall,
    kristall: state.resources.kristall - vorher.kristall,
    deuterium: state.resources.deuterium - vorher.deuterium,
  });
  const containerCount = state.inventory.reduce((a, i) => a + (i.count || 0), 0);
  const containerTier = state.inventory[0]?.tier;
  const containerValue = containerTier ? containerCount * CONTAINER_EV[containerTier] : 0;

  return {
    wins: mission.combatWins || 0,
    checks: mission.processedHours,
    destroyedPower,
    resourceValue,
    containerCount,
    containerValue,
    bergung,
    reward: resourceValue + containerValue,
    spentDelta: (state.stats.resourcesSpentShipsDefense || 0) - spentVorher,
  };
}

// ===================================================================================
// B - REFERENZSCHLEIFE, ZEICHENGLEICH AUS check_build_anker.mjs UEBERNOMMEN
// ===================================================================================
async function oneCheck(state, sektorId, ships) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ids = Object.keys(ships).filter((id) => ships[id] > 0);
  if (ids.length === 0) return null;
  const sent = {};
  ids.forEach((id) => (sent[id] = ships[id]));
  const sentPower = L.combat.combatFleetPowerBase(sent);
  const { multiplier } = L.combat.rollMultiplierWithOutlier(PIRATEN_MULTIPLIER_ROLL[sektorId], sektorId);
  const targetPower = Math.max(sentPower * multiplier, cfg.npcFloor || 0);
  const npc = {
    ...L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId)),
    ...L.combat.generateDefenseFleet(sentPower * DEFENSE_FACTOR[sektorId], 0),
  };
  if (Object.keys(npc).length === 0) return null;
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier(sektorId), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
  });
  ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
  const destroyed = {};
  Object.keys(npc).forEach((id) => {
    const d = npc[id] - (result.survivorsB[id] || 0);
    if (d > 0 && id !== 'piratenkapitan') destroyed[id] = d;
  });
  return {
    destroyedPower: L.combat.combatFleetPowerBase(destroyed),
    anyDestroyed: Object.keys(destroyed).length > 0,
  };
}

async function referenzMission() {
  const state = L.stateFor('mittel');
  const cfg = SEKTOR_CONFIG[SEKTOR];
  const ships = { ...SELECTION };
  let wins = 0, destroyedPower = 0, resourceValue = 0;
  for (let c = 0; c < 6; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, SEKTOR, ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (!r.anyDestroyed) continue;
    wins++;
    resourceValue += val(cfg.winResources) * loot.lootCurveFactor(r.destroyedPower, E.LOOT_CURVE_SOLO_CHECK_POWER);
  }
  const containerValue = wins > 0 ? cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] : 0;
  return { wins, destroyedPower, resourceValue, containerValue, reward: containerValue + resourceValue };
}

// ===================================================================================
// LAUF
// ===================================================================================
console.log('='.repeat(78));
console.log('VERDRAHTUNGSPROBE BLOCK A SCHRITT 2 (MESSBUILD-WERTE)');
console.log('='.repeat(78));
console.log(`Build  : ${B}`);
console.log(`Zelle  : Profil mittel, ${SEKTOR}, FLEET_LARGE, ${N} Durchlaeufe je Seite`);
console.log(`Uhr    : ${new Date(START).toISOString()} (Mittwoch), Wochen-Event geprueft inaktiv`);
console.log('');

const echt = [];
for (let i = 0; i < N; i++) {
  echt.push(await echteMission());
  if ((i + 1) % 10 === 0) console.log(`  echte Missionsschleife ... ${i + 1}/${N}`);
}
const ref = [];
for (let i = 0; i < N; i++) {
  ref.push(await referenzMission());
  if ((i + 1) % 10 === 0) console.log(`  Referenzschleife       ... ${i + 1}/${N}`);
}

const mit = (rows, k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;

const eDp = mit(echt, 'destroyedPower');
const eBerg = mit(echt, 'bergung');
const eReward = mit(echt, 'reward');
const eOhneBerg = eReward - eBerg;
const rDp = mit(ref, 'destroyedPower');
const rReward = mit(ref, 'reward');

const eJe = eReward / eDp;
const eJeOhne = eOhneBerg / eDp;
const rJe = rReward / rDp;

console.log('');
console.log('-'.repeat(78));
console.log('ECHTE MISSIONSSCHLEIFE (sendFleet -> processMissions -> finalizeMission)');
console.log('-'.repeat(78));
console.log(`  Checks / Siege        : ${mit(echt, 'checks').toFixed(2)} / ${mit(echt, 'wins').toFixed(2)}`);
console.log(`  vernichtete Feindmacht: ${mrd(eDp)}`);
console.log(`  Ressourcen (Kurve+Bergung): ${mrd(mit(echt, 'resourceValue'))}`);
console.log(`  davon Wrack-Bergung   : ${mrd(eBerg)}`);
console.log(`  Container             : ${mit(echt, 'containerCount').toFixed(2)} Stueck = ${mrd(mit(echt, 'containerValue'))}`);
console.log(`  Belohnung gesamt      : ${mrd(eReward)}  -> ${eJe.toFixed(4)} je Punkt`);
console.log(`  Belohnung OHNE Bergung: ${mrd(eOhneBerg)}  -> ${eJeOhne.toFixed(4)} je Punkt`);
console.log(`  Punkte-Korrektur (stats.resourcesSpentShipsDefense): ${mrd(mit(echt, 'spentDelta'))}`);
console.log('');
console.log('-'.repeat(78));
console.log('REFERENZSCHLEIFE (nachgebaut, wie in check_build_anker.mjs - ohne Bergung)');
console.log('-'.repeat(78));
console.log(`  Siege                 : ${mit(ref, 'wins').toFixed(2)}`);
console.log(`  vernichtete Feindmacht: ${mrd(rDp)}`);
console.log(`  Belohnung gesamt      : ${mrd(rReward)}  -> ${rJe.toFixed(4)} je Punkt`);
console.log('');
console.log('-'.repeat(78));
console.log('VERGLEICH - NORMIERT AUF DIE VERNICHTETE FEINDMACHT');
console.log('-'.repeat(78));
const abwOhne = eJeOhne / rJe - 1;
const abwGesamt = eJe / rJe - 1;
const abwSoll = eJeOhne / SOLL_JE_PUNKT - 1;
console.log(`  echt ohne Bergung gegen Referenz : ${(abwOhne * 100).toFixed(1)} %   <- die Verdrahtungsfrage`);
console.log(`  echt ohne Bergung gegen Soll ${SOLL_JE_PUNKT} : ${(abwSoll * 100).toFixed(1)} %`);
console.log(`  echt MIT Bergung gegen Referenz  : ${(abwGesamt * 100).toFixed(1)} %   (Bergung ist Teil von Block A)`);
console.log(`  Bergungsanteil an der Belohnung  : ${((eBerg / eReward) * 100).toFixed(1)} %`);
console.log('');

// Gegenprobe: waere die Kurve NICHT verdrahtet, zahlte die alte Formel winResources * combatWins
// flach je Sieg. Diese Zahl steht daneben, damit die Probe nicht nur "nah an der Referenz" zeigt,
// sondern auch, wovon sie sich unterscheidet.
const cfg = SEKTOR_CONFIG[SEKTOR];
const flachJeSieg = val(cfg.winResources);
const flachRessourcen = flachJeSieg * mit(echt, 'wins');
const flachContainer = cfg.winContainer.count * mit(echt, 'wins') * CONTAINER_EV[cfg.winContainer.tier];
const flach = flachRessourcen + flachContainer;
console.log(`  Kontrolle - unverdrahtet waere (winResources * combatWins + Container je Sieg):`);
console.log(`    ${mrd(flach)} = ${(flach / eDp).toFixed(4)} je Punkt, also ${((flach / eReward - 1) * 100).toFixed(0)} % gegen die Probe`);
console.log('');

const GRENZE = 0.10;
console.log(Math.abs(abwOhne) <= GRENZE
  ? `BLOCK A IST VERDRAHTET UND ZAHLT. Abweichung ${(abwOhne * 100).toFixed(1)} % innerhalb ${(GRENZE * 100).toFixed(0)} %.`
  : `VERDACHT: Abweichung ${(abwOhne * 100).toFixed(1)} % ausserhalb ${(GRENZE * 100).toFixed(0)} %. Patchkette pruefen.`);

Date.now = ECHT_NOW;
process.exit(0);
