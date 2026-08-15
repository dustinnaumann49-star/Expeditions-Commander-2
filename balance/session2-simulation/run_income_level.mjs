// Block A, letzter offener Punkt: das EINNAHMEN-NIVEAU (Abschnitt 7, Traeger ist Entscheidung 9).
//
// Frage: Das Zielband "3-10 Tage bis zum naechsten Ausbauschritt" wird mit 1,1-1,2 Stunden klar
// verfehlt. Der Beute-Exponent kann das nicht loesen (er kippt die Neigung, nicht die Hoehe), und
// Weg (a) - den Beute-Anker senken - ist am 14.08.2026 verworfen worden. Entschieden ist Weg (c):
// ZEIT ist der Haupt-Engpass, Ressourcen ein spuerbarer Neben-Engpass.
//
// Dieses Skript misst deshalb BEIDE Seiten derselben Kennzahl:
//   RESSOURCEN-SEITE: Kosten des naechsten Schritts / Netto-Einnahmen pro Tag  (bisher gemessen)
//   ZEIT-SEITE:       Kosten des naechsten Schritts / verbaubarer Wert pro Tag (neu)
// Der Engpass ist immer das MAXIMUM aus beiden. Ist die Zeit-Seite kleiner als die
// Ressourcen-Seite, ist "Zeit als Engpass" nur behauptet, nicht gebaut.
//
// METHODIK
// --------
// 1. Einnahmen: gleiches Modell wie run_loot_exponent.mjs (Exponent 0,85, Raid nach Variante 6),
//    Kampfergebnisse gemessen ueber den echten Worker. Keine Zahl aus einer Beschreibung
//    uebernommen (Messregel 16); alle Setzungen stehen unten gebuendelt.
// 2. Bau-Ausstoss: aus den echten Schiffsdaten (buildTime, cost) und der ECHTEN Funktion
//    bauzeitMultiplier() aus actions.ts - nicht nachgebaut. Siehe Hinweis zur DB gleich unten.
// 3. Kein Eingriff in server/src.
//
// WICHTIG - warum dist/ kopiert wird: `actions.js` importiert ueber `db.js` die Datenbank mit
// hartkodiertem Pfad `server/data/game.db` (Abschnitt 1b, Vorbedingung V2). Ein direkter Import
// wuerde also die LAUFENDE Partie anfassen. Das Skript kopiert `server/dist` deshalb in ein
// Temp-Verzeichnis und importiert von dort - die dabei angelegte leere Datenbank liegt dann im
// Temp-Verzeichnis. Lesend, kein Schreibzugriff auf den Spielstand.
//
// Aufruf: node run_income_level.mjs [N=10]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as L from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '../../server/dist');
const TMP = path.join(os.tmpdir(), 'ec-dist-isolated');
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(DIST, TMP, { recursive: true });
// Abhaengigkeiten (better-sqlite3 usw.) per Verweis, nicht per Kopie.
try { fs.symlinkSync(path.resolve(DIST, '../node_modules'), path.join(TMP, 'node_modules'), 'junction'); } catch { /* existiert bereits */ }
const actions = await import(pathToFileURL(path.join(TMP, 'game/actions.js')).href);
const { BUILDINGS } = await import(pathToFileURL(path.join(TMP, 'game/data/buildings.js')).href);
const { RESEARCH } = await import(pathToFileURL(path.join(TMP, 'game/data/research.js')).href);

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const { PIRATEN_CHECK_COUNT, ABBAU_BOOST_MULTIPLIER, ASTEROID_EVENT_MULTIPLIER } = L.economy;
const { MAX_BUILD_SLOTS } = L.cc;

const EXPONENT = 0.85;                      // beschlossen 14.08.2026, bestaetigt 15.08.2026
const SALVAGE = 0.30;
const BAND = [3, 10];
const STEP_SHARE = 0.10;                    // "naechster Ausbauschritt" = +10 % Flottenwert

// ---- SETZUNGEN (nicht aus dem Code ableitbar) ----------------------------------------------
// Identisch zu run_loot_exponent.mjs, damit die Einnahmen-Seite vergleichbar bleibt.
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const REWARD_ELITE_SERIES = 32.60e9;
const ELITE_CADENCE_DAYS = 3;
const RAID_PER_DEFENDED_PER_DAY = 6.31e9;
const V6_S_MAX = 1.5, V6_SHARE_OWN = 0.932, V6_SHARE_FOREIGN = 0.715;
const BASE_INCOME = { frueh: 55e6, mittel: 300e6, spaet: 554e6 };
// NEU gegenueber run_loot_exponent.mjs: die Allianz-Station fehlt dort komplett (Abschnitt 7
// weist ausdruecklich darauf hin). Pro-Kopf-Wert bei zwei Mitgliedern, Abschnitt 2a.
const STATION_PER_HEAD_PER_DAY = { frueh: 0, mittel: 0, spaet: 3.95e9 };
// Bau-Ausbaustand je Profil. Die Messprofile in lib.mjs enthalten NUR Kampfforschung, keine
// Gebaeude und keine Bauzeit-Forschung - beides ist hier gesetzt, nicht gemessen.
const BUILD_SETUP = {
  frueh:  { roboterfabrik: 5,  nanitenfabrik: 0,  bauzeit: 0,  bauzeit_schiffe: 0,  bautempo: false },
  mittel: { roboterfabrik: 10, nanitenfabrik: 5,  bauzeit: 5,  bauzeit_schiffe: 5,  bautempo: true },
  spaet:  { roboterfabrik: 15, nanitenfabrik: 10, bauzeit: 10, bauzeit_schiffe: 10, bautempo: true },
};

const WEEKLY_EVENT_AVG = (2 * ASTEROID_EVENT_MULTIPLIER + 5) / 7;

const REAL_FLEET = {
  leicht: 5000, schwer: 5000,
  kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 2000, zerstoerer: 2000, reaper: 2000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
  imperator: 6,
};

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const shipDef = (id) => L.ships.SHIPS.find((x) => x.id === id);
const unitValue = (id) => { const s = shipDef(id); return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0; };
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const fmtDays = (d) => !isFinite(d) ? 'nie' : d >= 1 ? `${d.toFixed(2)} d` : d >= 1 / 24 ? `${(d * 24).toFixed(1)} h` : `${(d * 1440).toFixed(0)} min`;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// ===== Ausbaustaende =========================================================================
const STATES = [
  { key: 'frueh',  fleet: L.FLEET_SMALL, profile: 'schwach', solo: ['piraten_mittel', 'piraten_hoch'],
    elite: false, miningLevel: 3,  abbauBooster: false, prospektor: false, raidsDefended: 0, buildingLevel: 12 },
  { key: 'mittel', fleet: L.FLEET_LARGE, profile: 'mittel',  solo: ['piraten_hoch'],
    elite: true,  miningLevel: 6,  abbauBooster: true,  prospektor: false, raidsDefended: 2, buildingLevel: 24 },
  { key: 'spaet',  fleet: REAL_FLEET,    profile: 'voll',    solo: ['piraten_hoch'],
    elite: true,  miningLevel: 10, abbauBooster: true,  prospektor: true,  raidsDefended: 4, buildingLevel: 36 },
];

// ===== Einnahmen-Seite (wie run_loot_exponent.mjs) ===========================================
const v6sat = (x) => V6_S_MAX * (1 - Math.exp(-x / V6_S_MAX));
function raidIncome(st) {
  const n = st.raidsDefended;
  if (n <= 0) return 0;
  return v6sat(V6_SHARE_OWN + (n - 1) * V6_SHARE_FOREIGN) * RAID_PER_DEFENDED_PER_DAY;
}
function asteroidIncomePerDay(st) {
  const mult = (1 + st.miningLevel * 0.10) * (1 + st.miningLevel * 0.05) *
    (st.abbauBooster ? ABBAU_BOOST_MULTIPLIER : 1) * (st.prospektor ? 1.2 : 1) * WEEKLY_EVENT_AVG;
  let raw = 0;
  for (const id of ['asteroid_niedrig', 'asteroid_mittel', 'asteroid_hoch']) {
    const cfg = SEKTOR_CONFIG[id];
    raw += (cfg.miningCap || 0) * (cfg.farmRate || 0) * 24;
  }
  return raw * mult * (0.5 + 0.3 * 1.5 + 0.2 * 3);
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
  const npc = {
    ...L.combat.generatePiratenFleet(targetPower, 0, L.combat.pickWaveProfile(sektorId)),
    ...L.combat.generateDefenseFleet(sentPower * (cfg.defenseFactor || 0), 0),
  };
  if (Object.keys(npc).length === 0) return null;
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier(sektorId), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters.kampf, shipModules: state.shipModules,
  });
  ids.forEach((id) => (ships[id] = result.survivorsA[id] || 0));
  const destroyed = {};
  Object.keys(npc).forEach((id) => { destroyed[id] = npc[id] - (result.survivorsB[id] || 0); });
  return {
    destroyedPower: L.combat.combatFleetPowerBase(destroyed),
    anyDestroyed: Object.values(destroyed).some((n) => n > 0),
  };
}

async function soloMission(state, sektorId, fleet) {
  const cfg = SEKTOR_CONFIG[sektorId];
  const ships = { ...fleet };
  let wins = 0, destroyedPower = 0;
  for (let c = 0; c < PIRATEN_CHECK_COUNT; c++) {
    if (Math.random() >= cfg.checkChance) continue;
    const r = await oneCheck(state, sektorId, ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (r.anyDestroyed) wins++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return { wins, lost, rewardToday: wins * (cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] + val(cfg.winResources)), destroyedPower };
}

async function eliteSeries(state, fleet) {
  const ships = { ...fleet };
  let destroyedPower = 0;
  for (let c = 0; c < PIRATEN_CHECK_COUNT; c++) {
    const r = await oneCheck(state, 'piraten_elite', ships);
    if (r) destroyedPower += r.destroyedPower;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return { lost, rewardToday: REWARD_ELITE_SERIES, destroyedPower };
}

async function average(fn, N) {
  const acc = {};
  for (let i = 0; i < N; i++) {
    const r = await fn();
    for (const k of Object.keys(r)) acc[k] = (acc[k] || 0) + r[k];
  }
  for (const k of Object.keys(acc)) acc[k] /= N;
  return acc;
}

// ===== Bau-Seite =============================================================================
// Zustands-Stub fuer die ECHTE Funktion bauzeitMultiplier() aus actions.ts.
function buildStateFor(key) {
  const s = BUILD_SETUP[key];
  return {
    research: { bauzeit: s.bauzeit, bauzeit_schiffe: s.bauzeit_schiffe },
    buildings: { roboterfabrik: s.roboterfabrik, nanitenfabrik: s.nanitenfabrik },
    buildingModules: {},
    activeBoosters: s.bautempo ? { bautempo: Date.now() + 30 * 24 * 3600 * 1000 } : {},
    economyClass: null,
  };
}

// Das Samstags-Event (-25 % Bauzeit) haengt am realen Wochentag. Damit die Messung nicht davon
// abhaengt, an welchem Tag sie laeuft, wird die Uhr fuer den Aufruf auf einen Mittwoch gestellt.
const WEDNESDAY = Date.UTC(2026, 7, 12, 12, 0, 0);
function multiplierFor(key, onSaturday = false) {
  const st = buildStateFor(key);
  const realNow = Date.now;
  const fake = onSaturday ? Date.UTC(2026, 7, 15, 12, 0, 0) : WEDNESDAY;
  // Booster-Ablauf relativ zur gefaelschten Uhr halten, sonst gilt der Booster als abgelaufen.
  if (st.activeBoosters.bautempo) st.activeBoosters.bautempo = fake + 30 * 24 * 3600 * 1000;
  Date.now = () => fake;
  try { return actions.bauzeitMultiplier(st); } finally { Date.now = realNow; }
}

// Verbaubarer Wert pro Sekunde und Lane, wenn die Flotte in ihrer eigenen Zusammensetzung
// nachgebaut wird (realistischer als ein einzelner Schiffstyp: der Spieler ersetzt Verluste und
// waechst anteilig). Rohrate, noch ohne Multiplikator.
function mixRateRaw(fleet) {
  let value = 0, seconds = 0;
  for (const [id, n] of Object.entries(fleet)) {
    const s = shipDef(id);
    if (!s || !s.cost) continue;                       // Imperator: keine Ressourcenkosten
    value += n * val(s.cost);
    seconds += n * s.buildTime;
  }
  return value / seconds;
}

// ===== Messung ===============================================================================
const N = Number(process.argv[2] || 10);
say(`=== Einnahmen-NIVEAU (Abschnitt 7) - ${N} Durchlaeufe je Kampfzelle ===`);
say(`Exponent ${EXPONENT}, Raid nach Variante 6, Wrack-Bergung ${SALVAGE * 100} %, Zielband ${BAND[0]}-${BAND[1]} Tage.`);
say(`Schritt = +${STEP_SHARE * 100} % Flottenwert. Bau-Lanes laut Code: ${MAX_BUILD_SLOTS} (MAX_BUILD_SLOTS).`);
say();

const measured = {};
for (const st of STATES) {
  const state = L.stateFor(st.profile);
  measured[st.key] = { solo: {}, elite: null, fleetValue: fleetValue(st.fleet) };
  for (const sektorId of st.solo) measured[st.key].solo[sektorId] = await average(() => soloMission(state, sektorId, st.fleet), N);
  if (st.elite) measured[st.key].elite = await average(() => eliteSeries(state, st.fleet), N);
}

const anchorSolo = measured.mittel.solo['piraten_hoch'];
const anchorElite = measured.mittel.elite;
const lootSolo = (dp) => anchorSolo.rewardToday * Math.pow(dp / anchorSolo.destroyedPower, EXPONENT);
const lootElite = (dp) => anchorElite.rewardToday * Math.pow(dp / anchorElite.destroyedPower, EXPONENT);

const rows = [];
for (const st of STATES) {
  let best = null;
  for (const [id, r] of Object.entries(measured[st.key].solo)) {
    const net = lootSolo(r.destroyedPower) - r.lost * (1 - SALVAGE);
    if (!best || net > best.net) best = { id, net };
  }
  let eliteNet = 0;
  if (measured[st.key].elite) {
    const e = measured[st.key].elite;
    eliteNet = (lootElite(e.destroyedPower) - e.lost * (1 - SALVAGE)) / ELITE_CADENCE_DAYS;
  }
  const flat = asteroidIncomePerDay(st) + BASE_INCOME[st.key];
  const station = STATION_PER_HEAD_PER_DAY[st.key];
  const raid = raidIncome(st);
  const net = best.net + eliteNet + flat + raid;
  const fv = measured[st.key].fleetValue;
  const mult = multiplierFor(st.key);
  const rate = mixRateRaw(st.fleet) / mult;                  // Wert pro Sekunde und Lane
  rows.push({
    st, fv, net, netWithStation: net + station, station,
    solo: best.net, eliteNet, flat, raid, mult,
    ratePerLaneDay: rate * 86400,
    outputDay3: rate * 86400 * MAX_BUILD_SLOTS,
    outputDay1: rate * 86400,
  });
}

say('=== 1. Einnahmen und Flottenwert je Ausbaustand ===');
say('Stand'.padEnd(9) + 'Flottenwert'.padStart(13) + 'Solo'.padStart(11) + 'Elite/Tag'.padStart(12) +
    'Raid'.padStart(11) + 'passiv'.padStart(11) + 'Station'.padStart(11) + 'NETTO/Tag'.padStart(13));
for (const r of rows) {
  say(r.st.key.padEnd(9) + mrd(r.fv).padStart(13) + mrd(r.solo).padStart(11) + mrd(r.eliteNet).padStart(12) +
      mrd(r.raid).padStart(11) + mrd(r.flat).padStart(11) + mrd(r.station).padStart(11) + mrd(r.netWithStation).padStart(13));
}
say();
say('Tagesrendite auf den Flottenwert (Netto/Tag geteilt durch Flottenwert):');
for (const r of rows) say(`  ${r.st.key.padEnd(9)} ${(r.netWithStation / r.fv * 100).toFixed(0)} %`);
say();
say('Anteil der Quellen an den Einnahmen (Abnahmekriterium 5: keine Quelle ueber 50 % in Woche 1):');
say('Stand'.padEnd(9) + 'Solo'.padStart(9) + 'Elite'.padStart(9) + 'Raid'.padStart(9) + 'passiv'.padStart(9) + 'Station'.padStart(9));
for (const r of rows) {
  const p = (x) => `${(x / r.netWithStation * 100).toFixed(0)} %`.padStart(9);
  say(r.st.key.padEnd(9) + p(r.solo) + p(r.eliteNet) + p(r.raid) + p(r.flat) + p(r.station));
}
say();

say('=== 2. Die Kennzahl von BEIDEN Seiten ===');
say('Ressourcen-Seite = Kosten / Einnahmen. Zeit-Seite = Kosten / verbaubarer Wert pro Tag.');
say('Der tatsaechliche Engpass ist das Maximum aus beiden.');
say();
say('Stand'.padEnd(9) + 'Bauzeit-Mult.'.padStart(15) + 'Ausstoss/Tag'.padStart(15) + 'Kauf-Tage'.padStart(12) +
    'Bau-Tage'.padStart(12) + '   Engpass');
for (const r of rows) {
  const step = r.fv * STEP_SHARE;
  const buy = step / r.netWithStation;
  const build = step / r.outputDay3;
  say(r.st.key.padEnd(9) + r.mult.toExponential(2).padStart(15) + mrd(r.outputDay3).padStart(15) +
      fmtDays(buy).padStart(12) + fmtDays(build).padStart(12) + `   ${build > buy ? 'Zeit' : 'Ressourcen'}`);
}
say();
say(`Dasselbe mit 1 Lane statt ${MAX_BUILD_SLOTS} (Entscheidung 9.2):`);
say('Stand'.padEnd(9) + 'Ausstoss/Tag'.padStart(15) + 'Bau-Tage'.padStart(12) + '   Engpass');
for (const r of rows) {
  const step = r.fv * STEP_SHARE;
  const buy = step / r.netWithStation;
  const build = step / r.outputDay1;
  say(r.st.key.padEnd(9) + mrd(r.outputDay1).padStart(15) + fmtDays(build).padStart(12) +
      `   ${build > buy ? 'Zeit' : 'Ressourcen'}`);
}
say();

say('=== 3. Ressourcen-Ueberschuss: was taeglich NICHT in Schiffe fliessen kann ===');
say('(Einnahmen minus verbaubarer Wert. Positiv = es stapelt sich.)');
say('Stand'.padEnd(9) + `${MAX_BUILD_SLOTS} Lanes`.padStart(14) + '1 Lane'.padStart(14) + '   Verhaeltnis Einnahmen/Ausstoss');
for (const r of rows) {
  say(r.st.key.padEnd(9) + mrd(r.netWithStation - r.outputDay3).padStart(14) +
      mrd(r.netWithStation - r.outputDay1).padStart(14) +
      `   ${(r.netWithStation / r.outputDay3).toFixed(2)}x / ${(r.netWithStation / r.outputDay1).toFixed(2)}x`);
}
say();

say('=== 4. Was noetig waere, um das Band 3-10 Tage zu treffen ===');
say('Weg (b), ueber die KOSTEN: um welchen Faktor muessten Schiffe teurer werden?');
say('Weg (c), ueber die ZEIT:   um welchen Faktor muesste die Schiffs-Bauzeit steigen?');
say();
say('Stand'.padEnd(9) + 'Kostenfaktor'.padStart(18) + `Zeitfaktor (${MAX_BUILD_SLOTS} Lanes)`.padStart(24) + 'Zeitfaktor (1 Lane)'.padStart(24));
for (const r of rows) {
  const step = r.fv * STEP_SHARE;
  const costF = [BAND[0], BAND[1]].map((d) => (d * r.netWithStation) / step);
  const timeF3 = [BAND[0], BAND[1]].map((d) => (d * r.outputDay3) / step);
  const timeF1 = [BAND[0], BAND[1]].map((d) => (d * r.outputDay1) / step);
  const f = (a) => `${a[0].toFixed(0)}-${a[1].toFixed(0)}x`;
  say(r.st.key.padEnd(9) + f(costF).padStart(18) + f(timeF3).padStart(24) + f(timeF1).padStart(24));
}
say();
say('=== 4b. Kandidaten-Pakete: was ein bestimmter Gesamt-Zeitfaktor ergibt ===');
say('Gerechnet auf 1 Lane (Entscheidung 9.2) - der Sprung von 3 auf 1 Lane steckt also schon drin.');
say('Zeitfaktor'.padEnd(12) + STATES.map((s) => s.key.padStart(12)).join('') + '   im Band 3-10 d');
for (const F of [1, 3, 6, 10, 20, 30, 50]) {
  const cells = rows.map((r) => (r.fv * STEP_SHARE) / (r.outputDay1 / F));
  const hit = cells.filter((d) => d >= BAND[0] && d <= BAND[1]).length;
  say(String(F).padEnd(12) + cells.map((d) => fmtDays(d).padStart(12)).join('') + `   ${hit}/3 Staende`);
}
say();
say('Was der Zeitfaktor konkret bedeutet (Beispiel-Schiffe, Bauzeit je STUECK, 1 Lane, Band-Mitte):');
{
  const r = rows[2];
  const step = r.fv * STEP_SHARE;
  const factor = (6 * r.outputDay1) / step;                 // Bandmitte 6 Tage
  for (const id of ['leicht', 'kreuzer', 'reaper', 'salvendreadnought']) {
    const s = shipDef(id);
    const sec = s.buildTime * r.mult * factor;
    say(`  ${s.name.padEnd(20)} heute ${(s.buildTime * r.mult).toFixed(1)} s -> ${sec >= 3600 ? `${(sec / 3600).toFixed(1)} h` : `${(sec / 60).toFixed(1)} min`}`);
  }
}
say();

say('=== 5. Gegenprobe: die Gebaeude-Kostenleiter ("Rest von (b)") ===');
say('Kosten der NAECHSTEN Stufe je V1-Gebaeude, gegen die Netto-Einnahmen des jeweiligen Stands.');
say('Bewusst je Gebaeude einzeln: eine Summe ueber alle sechs wird von der Nanitenfabrik');
say('(costGrowth 2,0) vollstaendig ueberdeckt und sagt nichts ueber die Minen aus.');
say();
const v1 = BUILDINGS.filter((b) => (b.tier ?? 1) === 1);
// Realistischer Stufenstand je Profil (aus Abschnitt 2a: menschliche Spieler stehen bei 36/32/30).
const LEVELS = {
  frueh:  { metallmine: 12, kristallmine: 11, deuteriummine: 10, solarkraftwerk: 13, roboterfabrik: 5,  nanitenfabrik: 0 },
  mittel: { metallmine: 24, kristallmine: 22, deuteriummine: 20, solarkraftwerk: 25, roboterfabrik: 10, nanitenfabrik: 5 },
  spaet:  { metallmine: 36, kristallmine: 32, deuteriummine: 30, solarkraftwerk: 36, roboterfabrik: 15, nanitenfabrik: 10 },
};
say('Gebaeude'.padEnd(24) + STATES.map((s) => `${s.key} (Stufe)`.padStart(20)).join(''));
for (const b of v1) {
  const cells = rows.map((r) => {
    const lvl = LEVELS[r.st.key][b.id];
    if (lvl === undefined) return '-'.padStart(20);
    const cost = val(b.baseCost) * Math.pow(b.costGrowth, lvl);
    return `${mrd(cost)} = ${fmtDays(cost / r.netWithStation)}`.padStart(20);
  });
  say(`${b.name} (x${b.costGrowth})`.padEnd(24) + cells.join(''));
}
say();
say('Ab welcher Stufe kostet EIN Ausbauschritt dieses Gebaeudes 3 bzw. 10 Tage Einnahmen?');
say('(gerechnet gegen die Einnahmen des SPAETEN Stands, also gegen den hoechsten Wert)');
{
  const income = rows[2].netWithStation;
  for (const b of v1) {
    const find = (target) => {
      for (let lvl = 1; lvl <= 120; lvl++) {
        if (val(b.baseCost) * Math.pow(b.costGrowth, lvl) / income >= target) return lvl;
      }
      return null;
    };
    say(`  ${b.name.padEnd(22)} 3 Tage ab Stufe ${String(find(3)).padStart(3)}, 10 Tage ab Stufe ${String(find(10)).padStart(3)}  (heute ${LEVELS.spaet[b.id]})`);
  }
}
say();

say('=== 5b. Forschungskosten (Pruefpunkt zu Entscheidung 9.4) ===');
{
  let total = 0;
  for (const r of RESEARCH) {
    for (let l = 0; l < 10; l++) total += val(r.baseCost) * Math.pow(r.costGrowth, l);
  }
  say(`Alle ${RESEARCH.length} Forschungen von 0 auf Stufe 10: ${mrd(total)}`);
  for (const r of rows) say(`  = ${fmtDays(total / r.netWithStation)} Einnahmen im Stand ${r.st.key}`);
}
say();

say('=== 6. Kontrolle der Zahlen aus Abschnitt 7 (einmalige Ziele) ===');
const BIG_SINKS = [
  ['Alle Schiffs-Module Stufe 10', 141.97e9],
  ['Heimatbasis V1 voll (36/32/30)', 197.97e9],
  ['Alle Gebaeude-Module Stufe 10', 44.38e9],
  ['Allianz-Station Vollausbau', 558e9],
];
say('Ziel'.padEnd(34) + 'Kosten'.padStart(12) + STATES.map((s) => s.key.padStart(12)).join(''));
for (const [name, cost] of BIG_SINKS) {
  say(name.padEnd(34) + mrd(cost).padStart(12) + rows.map((r) => fmtDays(cost / r.netWithStation).padStart(12)).join(''));
}
say();

say('=== 7. Bauzeit-Multiplikator: Herkunft der Zahlen ===');
say('Stand'.padEnd(9) + 'Mittwoch'.padStart(12) + 'Samstag'.padStart(12) + '   Setzung (Roboter/Nanit, Forschung bauzeit/bauzeit_schiffe, Booster)');
for (const st of STATES) {
  const s = BUILD_SETUP[st.key];
  say(st.key.padEnd(9) + multiplierFor(st.key).toExponential(2).padStart(12) +
      multiplierFor(st.key, true).toExponential(2).padStart(12) +
      `   ${s.roboterfabrik}/${s.nanitenfabrik}, ${s.bauzeit}/${s.bauzeit_schiffe}, Bautempo-Booster ${s.bautempo ? 'ja' : 'nein'}`);
}
say(`(Forschung "bauzeit" wirkt ${RESEARCH.find((r) => r.id === 'bauzeit').effectPerLevel * 100} % je Stufe, Boden 30 %; ` +
    `"bauzeit_schiffe" 3 % je Stufe, Boden 50 %.)`);
say();

fs.writeFileSync(path.join(HERE, 'income_level.txt'), out.join('\n') + '\n');
console.log('-> income_level.txt geschrieben');
