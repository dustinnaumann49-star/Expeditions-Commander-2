// !!! MESSBUILD-SKRIPT - LAEUFT NICHT GEGEN DEN REPO-STAND !!!
// Es importiert game/loot.js (Block A, Schritt 2) und erwartet zusaetzlich Entscheidung 16 im
// Build. Beide stehen NICHT im Repo. Erzeugen mit:
//   node make_messbuild_kum.mjs <ordner ausserhalb des repos> --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=<ordner> node run_novice_bonus.mjs <teil> [N]
// ALLE ERGEBNISSE DIESES SKRIPTS SIND MESSBUILD-WERTE, KEIN REPO-STAND.
//
// ===================================================================================
// ENTSCHEIDUNG 12 - FRISCHLING-BONUS: ADDITIV STATT MULTIPLIKATIV
// ===================================================================================
// Gemessen wird Abnahmekriterium 5 aus Abschnitt 1b: "Keine Einzelquelle liefert in Woche 1 mehr
// als 50 % der Wochen-Einnahmen." Das ist das EINZIGE der sechs Kriterien, das Entscheidung 12
// nennt. Die uebrigen fuenf haengen an 9.2/10/5/13.5/7/9.4 und werden hier NICHT gemessen.
//
// WARUM KEIN 30-TAGE-VERLAUF (Schritt 13):
// Kriterium 5 ist ein ANTEIL, kein Niveau. Die Kopplung an Entscheidung 9 laeuft ueber genau eine
// Groesse - wie schnell die Kampfflotte waechst (Nenner). Der Zaehler (Asteroiden-Mining) ist von
// Entscheidung 9 unabhaengig, weil er gedeckelt ist: 300+220+180 = 700 Mining-Schiffe, 14,35 Mio
// Wert gegen 117,5 Mio Startressourcen, buildTime 10 s je Stueck. Der Deckel steht in beiden
// Bau-Welten am ersten Tag. Statt des Verlaufs werden deshalb ZWEI EINKLAMMERNDE Bau-Szenarien
// gerechnet (heute / nach Entscheidung 9). Faellt der kalibrierte Wert in beiden gleich aus, ist
// die Unabhaengigkeit gemessen statt unterstellt.
//
// AUFBAU (bewusst zweistufig, damit Varianten nicht jedes Mal neu kaempfen muessen):
//   1. MESSGITTER: fuer sieben Flottengroessen wird gemessen
//        - Solo-Mission (24 h, 6 Checks) je Sektorstufe: Belohnung/Verlust/Bergung
//        - Raid: Anteil gewonnener Wellen und Wellenverlust
//      N Durchlaeufe je Zelle, echter Kampf-Worker, Messbuild-Beuteregeln.
//   2. TAGESLAUF: reine Arithmetik auf dem gemessenen Gitter. Ressourcen -> Bau -> Flotte ->
//      naechster Tag. Mining und Heimatbasis kommen aus den ECHTEN Funktionen
//      (missions.miningMultiplier, actions.mineOutputPerHour), nicht aus nachgebauten Formeln.
//
// WAS MODELL IST UND NICHT MESSUNG (ausdruecklich benannt):
//   - Die Bau-Reihenfolge (erst 700 Mining-Schiffe, dann Kampfschiffe im FLEET_SMALL-Verhaeltnis).
//   - Dass der GESAMTE verfuegbare Ueberschuss in die Flotte geht. Das ist eine OBERE SCHRANKE
//     fuer die Kampf-Einnahmen und damit die fuer Kriterium 5 unguenstigste Annahme: wer den
//     Mining-Anteil trotzdem ueber 50 % findet, findet ihn robust.
//   - Mining laeuft durchgehend (Anflug 0,52-0,63 h je Richtung auf 24 h Missionsdauer -> 96 %
//     Betriebszeit, als UPTIME angesetzt). Ein weniger aktiver Spieler liegt darunter, was den
//     Mining-Anteil SENKT - "Aktiv" ist auch hier der ungueustigste Fall fuer Kriterium 5.
//   - Kein Begleitschutz im Asteroiden-Feld: runAsteroidEscortCheck() kehrt bei 0 Begleitschiffen
//     sofort zurueck, Mining ist dann risikofrei.
//   - Solo-Belohnung ohne den Mo/Fr-Event (piraten_bonus). Uebernommen aus run_loot_curve.mjs,
//     damit der Anker vergleichbar bleibt; als Empfindlichkeitszeile wird der Fall MIT Event
//     zusaetzlich ausgewiesen.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as L from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt - siehe Kopf dieser Datei.');
const DIST = path.resolve(process.env.MESSBUILD);

// Isolierte dist-Kopie: actions.js/missions.js ziehen ueber state.js -> db.js eine Datenbank mit
// hartkodiertem Pfad (Abschnitt 1b, Vorbedingung V2). Die dabei angelegte Wegwerf-Datenbank liegt
// dadurch im Temp-Verzeichnis, nicht in der laufenden Partie.
const TMP = path.join(os.tmpdir(), 'ec-novice-isolated');
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(DIST, TMP, { recursive: true });
const NODE_MODULES = path.resolve(HERE, '../../server/node_modules');
if (!fs.existsSync(NODE_MODULES)) throw new Error(`node_modules fehlt: ${NODE_MODULES} - erst npm install im Serverordner`);
try { fs.symlinkSync(NODE_MODULES, path.join(TMP, 'node_modules'), 'junction'); } catch { /* existiert */ }
const missions = await import(pathToFileURL(path.join(TMP, 'game/missions.js')).href);
const actions = await import(pathToFileURL(path.join(TMP, 'game/actions.js')).href);
const loot = await import(pathToFileURL(path.join(TMP, 'game/loot.js')).href);

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const E = L.economy;
const { BUILDINGS } = await import(pathToFileURL(path.join(TMP, 'game/data/buildings.js')).href);

// ===== Setzungen (nicht aus dem Code ableitbar, identisch zu run_loot_curve.mjs) =============
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15 };
const START_RES = { metall: 50e6, kristall: 25e6, deuterium: 10e6 };
const MINING_UPTIME = 24 / (24 + 2 * 0.6);          // Anflug 0,6 h je Richtung, gemessen ueber galaxyDurationMs
const SEKTOREN = ['piraten_niedrig', 'piraten_mittel', 'piraten_hoch'];

const val = (c) => (c.metall || 0) + (c.kristall || 0) * 1.5 + (c.deuterium || 0) * 3;
const shipDef = (id) => L.ships.SHIPS.find((x) => x.id === id);
const unitValue = (id) => { const s = shipDef(id); return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0; };
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const mio = (x) => `${(x / 1e6).toFixed(1)} Mio`;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

// ===== Woche-1-Spielerzustand ================================================================
// Forschung 0, keine Module, keine Klasse: defaultPlayerState() plus das, was in sieben Tagen
// erreichbar ist. Prospektor ist eine Klassenwahl (kostenlos), der Abbau-Booster kostet 30 DM/Tag
// gegen 500 DM Start plus dmCap-Funde - beide werden als "vorhanden" angesetzt, weil das die
// obere Kante des Woche-1-Stapels ist.
function noviceState({ ageDays = 0, prospektor = true, abbauBooster = true, buildingLevel = 0 } = {}) {
  const research = {};
  ['waffen', 'schild', 'panzerung', 'zielerfassung', 'durchschlag', 'schildregeneration',
    'praezision', 'ausweichen', 'kritischetreffer', 'mining', 'mining_schiffe', 'mining_minen',
    'bauzeit', 'bauzeit_schiffe', 'bauzeit_gebaeude'].forEach((id) => (research[id] = 0));
  const buildings = {};
  BUILDINGS.forEach((b) => (buildings[b.id] = 0));
  if (buildingLevel > 0) {
    BUILDINGS.forEach((b) => {
      if ((b.tier ?? 1) !== 1) return;
      if (b.baseOutput || b.kind === 'energie') buildings[b.id] = buildingLevel;
    });
  }
  return {
    userId: 1,
    createdAt: Date.now() - ageDays * 24 * 3600 * 1000,
    research,
    buildings,
    buildingModules: {},
    shipModules: {},
    playerClass: null,
    economyClass: prospektor ? 'prospektor' : null,
    activeBoosters: abbauBooster ? { abbau: Date.now() + 30 * 24 * 3600 * 1000 } : {},
    fleet: {},
    defense: {},
    resources: { ...START_RES, dm: 500 },
  };
}

// ===== Mining: echte Funktion, Wochentag explizit ============================================
// miningMultiplier() liest den Di/Do-Event ueber die ECHTE Uhr. Damit ein Wochentag gezielt
// gerechnet werden kann, wird Date.now fuer die Dauer des Aufrufs auf den gewuenschten Tag
// gesetzt (Abschnitt 1b, Vorbedingung V1, Weg (a) - nur fuer diese eine Funktion, nicht global).
const REAL_NOW = Date.now();
function atWeekday(weekday, fn) {
  // 01.01.2024 war ein Montag (weekday 1). 12:00 Uhr, damit der Berliner Kalendertag eindeutig ist.
  const base = Date.UTC(2024, 0, 1, 12, 0, 0);
  const target = base + ((weekday + 6) % 7) * 24 * 3600 * 1000;
  const orig = Date.now;
  Date.now = () => target;
  try { return fn(target); } finally { Date.now = orig; }
}

// Rohertrag der drei Asteroiden-Felder bei vollen Caps, in Wert-Einheiten pro Tag, Multiplikator 1.
const ASTEROID_RAW_PER_DAY = (() => {
  let res = 0;
  for (const id of ['asteroid_niedrig', 'asteroid_mittel', 'asteroid_hoch']) {
    const cfg = SEKTOR_CONFIG[id];
    res += (cfg.miningCap || 0) * (cfg.farmRate || 0) * 24;
  }
  return res * (0.5 * 1 + 0.3 * 1.5 + 0.2 * 3);   // Aufteilung aus accrueFarming(), TRADE_VALUE
})();
const MINING_SHIPS_TOTAL = ['asteroid_niedrig', 'asteroid_mittel', 'asteroid_hoch']
  .reduce((a, id) => a + (SEKTOR_CONFIG[id].miningCap || 0), 0);

// Die uebrigen fuenf Quellen des Stapels OHNE Frischling - direkt aus der echten Funktion
// abgelesen, indem der Account als "ausserhalb des Fensters" gebaut wird.
function miningStackWithoutNovice(state, weekday) {
  const old = { ...state, createdAt: 0 };
  return atWeekday(weekday, () => missions.miningMultiplier(old));
}
function miningStackReal(state, weekday) {
  return atWeekday(weekday, () => missions.miningMultiplier(state));
}

// Frischling-Varianten. 'ist' = heutiger Code (multiplikativ x3). 'aus' = kein Bonus.
// 'add:X' = additiv: der Bonus tritt NEBEN das Produkt der uebrigen Quellen, statt es zu
// multiplizieren -> mult = produkt + X.
function miningMultiplierVariant(state, weekday, variant, inWindow) {
  const rest = miningStackWithoutNovice(state, weekday);
  if (!inWindow || variant === 'aus') return rest;
  if (variant === 'ist') return rest * E.NOVICE_BONUS_MULTIPLIER;
  return rest + Number(variant.split(':')[1]);
}

function miningPerDay(state, weekday, variant, inWindow, miningShips) {
  const share = Math.min(1, miningShips / MINING_SHIPS_TOTAL);
  return ASTEROID_RAW_PER_DAY * share * miningMultiplierVariant(state, weekday, variant, inWindow) * MINING_UPTIME;
}

// ===== Heimatbasis: echte Funktion ===========================================================
function homeBasePerDay(buildingLevel) {
  const st = noviceState({ buildingLevel });
  let v = 0;
  BUILDINGS.forEach((b) => {
    if (!b.baseOutput) return;
    const perHour = actions.mineOutputPerHour(st, b.id);
    const w = b.kind === 'mine_metall' ? 1 : b.kind === 'mine_kristall' ? 1.5 : 3;
    v += perHour * 24 * w;
  });
  return v;
}

// ===== Messgitter: ein Check gegen einen Sektor ==============================================
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
    kampfBoostActive: !!state.activeBoosters?.kampf, shipModules: state.shipModules,
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

// Solo-Mission nach den Messbuild-Regeln (Container EINMAL je Mission, winResources je Sieg
// mal Kurvenfaktor, Bergung nur bei Rueckkehr) - identisch zu run_loot_curve.mjs.
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
    resourceValue += val(cfg.winResources) * loot.lootCurveFactor(r.destroyedPower, E.LOOT_CURVE_SOLO_CHECK_POWER);
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

// ===== Messgitter: EINE Raid-Welle ===========================================================
// Unter Neulingsschutz (Entscheidung 10, 14 Tage) setzt raids.ts survived = sent fuer Schiffe -
// die Flotte steht vor jeder der 12 Wellen wieder vollstaendig da, und ein Konto ohne
// Verteidigungsanlagen traegt auch dort nichts weiter. Die zwoelf Wellen sind damit zwoelf
// unabhaengige Ziehungen mit derselben Gewinnwahrscheinlichkeit; gemessen wird deshalb EINE
// Welle N-mal statt N vollstaendiger Raids (Faktor 12 an Rechenzeit).
// Belohnung: RAID_WAVE_WIN_SILBER/GOLD/ELITE je gewonnener Welle - FLACH, unabhaengig von der
// eigenen Staerke.
const RAID_WAVE_VALUE =
  E.RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber +
  E.RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold +
  E.RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite;

const pick503020 = L.combat.pick503020;   // echte Funktion aus combat.js, kein Nachbau

async function oneRaidWave(state, fleet) {
  const ids = Object.keys(fleet).filter((id) => fleet[id] > 0);
  if (ids.length === 0) return { won: false, lostValue: 0 };
  let fleetPower = 0;
  ids.forEach((id) => {
    const s = shipDef(id).stats;
    fleetPower += fleet[id] * (s.waffen + s.schild + s.panzerung);
  });
  const combinedPower = fleetPower * 0.7;                 // RAID_FLEET_POWER_WEIGHT, keine Anlagen
  const waveTarget = Math.max(combinedPower, E.RAID_MIN_TARGET_POWER) * pick503020(E.RAID_WAVE_ROLL);
  const npc = L.combat.generateFallbackFleet(waveTarget, L.combat.pickWaveProfile('raid'));
  const npcIds = Object.keys(npc).filter((id) => npc[id] > 0);
  if (npcIds.length === 0) return { won: true, lostValue: 0 };
  const sent = {};
  ids.forEach((id) => (sent[id] = fleet[id]));
  const result = await L.runner.runCombatInWorker({
    sideAShips: sent, sideBShips: npc, research: state.research,
    battleModifier: L.combat.rollBattleModifier('raid'), playerClass: state.playerClass,
    kampfBoostActive: !!state.activeBoosters?.kampf, shipModules: state.shipModules,
    // WIE IN raids.ts: das Feld heisst seit dem 19.08.2026 retreatMode, NICHT mehr allowRetreat.
    // Ein Aufruf mit allowRetreat wird still ignoriert - genau dafuer wurde umbenannt.
    // 'fleetOnly' = die Flotte darf abdrehen (Entscheidung 10), Anlagen nicht. Ein Woche-1-Konto
    // hat keine Anlagen, der Unterschied zu 'all' greift hier also nicht.
    retreatMode: 'fleetOnly', homeDefense: true,
  });
  const won = npcIds.every((id) => (result.survivorsB[id] || 0) <= 0);
  // Neulingsschutz: kein Flottenverlust. Der Posten wird trotzdem ausgewiesen, weil er nach
  // Tag 14 anfaellt.
  const lostValue = ids.reduce((a, id) => a + (fleet[id] - (result.survivorsA[id] || 0)) * unitValue(id), 0);
  return { won, lostValue };
}

// ===== Flotten-Mix ===========================================================================
// FLEET_SMALL-Verhaeltnis, auf einen Zielwert skaliert. Kein eigener Entwurf: das ist das
// "schwach"-Profil, gegen das der ganze Plan rechnet.
const MIX_BASE = L.FLEET_SMALL;
const MIX_VALUE = fleetValue(MIX_BASE);
function fleetForValue(v) {
  const k = v / MIX_VALUE;
  const f = {};
  Object.entries(MIX_BASE).forEach(([id, n]) => {
    const c = Math.round(n * k);
    if (c > 0) f[id] = c;
  });
  return f;
}

// ===================================================================================
// TEILE
// ===================================================================================
const TEIL = process.argv[2] || 'anker';
const N = Number(process.argv[3] || 40);
const GRID = [50e6, 100e6, 200e6, 400e6, 800e6, 1600e6, 3200e6];

function stats(rows, key) {
  const n = rows.length;
  const m = rows.reduce((a, r) => a + r[key], 0) / n;
  const sd = Math.sqrt(rows.reduce((a, r) => a + (r[key] - m) ** 2, 0) / Math.max(1, n - 1));
  return { m, sd, se: sd / Math.sqrt(n) };
}

if (TEIL === 'anker') {
  // Build-Pruefung: die Ankerzelle aus loot_curve.txt (mittel/hoch) muss reproduziert werden,
  // NORMIERT auf die vernichtete Feindmacht (roh verglichen streut die Zelle ueber die Zahl der
  // gewonnenen Checks).
  say('=== BUILD-PRUEFUNG gegen loot_curve.txt (Messbuild) ===');
  say(`Soll (loot_curve.txt, Scheibe 1): mittel/hoch = 1,05 Mrd Belohnung bei 11,1 Mrd Feindmacht`);
  say(`                                  -> 0,0946 Wert-Einheiten je Punkt vernichteter Feindmacht`);
  const state = L.stateFor('mittel');
  const rows = [];
  for (let i = 0; i < N; i++) rows.push(await soloMission(state, 'piraten_hoch', { ...L.FLEET_LARGE }));
  const re = stats(rows, 'reward'), dp = stats(rows, 'destroyedPower'), w = stats(rows, 'wins');
  say(`Ist  (${N} Durchlaeufe)         : ${mrd(re.m)} Belohnung bei ${mrd(dp.m)} Feindmacht, ${w.m.toFixed(1)} Siege`);
  say(`                                  -> ${(re.m / dp.m).toFixed(4)} Wert-Einheiten je Punkt`);
  say(`Abweichung normiert             : ${(((re.m / dp.m) / 0.0946 - 1) * 100).toFixed(1)} %`);
  say();
  say('=== ZAHLENPRUEFUNG (Messregel 16) ===');
  const stMax = noviceState({ ageDays: 0 });
  stMax.research.mining = 10; stMax.research.mining_schiffe = 10;
  say(`Vollstapel Mining laut Code (Di/Do, Forschung 10, Prospektor, Booster, Frischling): ` +
      `x${miningStackReal(stMax, 2).toFixed(2)}  (Plantext nennt 24,5)`);
  const stWeek1 = noviceState({ ageDays: 0 });
  say(`Woche-1-Stapel real (Forschung 0, Prospektor, Booster, Di/Do-Event, Frischling)   : ` +
      `x${miningStackReal(stWeek1, 2).toFixed(2)} (Eventtag) / x${miningStackReal(stWeek1, 1).toFixed(2)} (Normaltag)`);
  say(`Asteroiden-Rohertrag bei vollen Caps, Multiplikator 1: ${mio(ASTEROID_RAW_PER_DAY)} Wert/Tag`);
  say(`Vollstapel-Tagesertrag: ${mrd(ASTEROID_RAW_PER_DAY * miningStackReal(stMax, 2))} (Plantext nennt 8,5 Mrd)`);
  say(`Raid-Belohnung je gewonnener Welle (flach): ${mrd(RAID_WAVE_VALUE)}, ` +
      `bei ${E.RAID_WAVE_COUNT}/${E.RAID_WAVE_COUNT} Wellen ${mrd(RAID_WAVE_VALUE * E.RAID_WAVE_COUNT)}`);
  say(`Heimatbasis Stufe 0/6/12/18 je Tag: ${mio(homeBasePerDay(0))} / ${mio(homeBasePerDay(6))} / ` +
      `${mio(homeBasePerDay(12))} / ${mio(homeBasePerDay(18))}`);
  say(`700 Mining-Schiffe kosten ${mio(MINING_SHIPS_TOTAL * unitValue('mining'))} Wert, ` +
      `Startressourcen ${mio(val(START_RES))} Wert`);
  say(`Mining-Betriebszeit (24 h Mission, 0,6 h Anflug je Richtung): ${(MINING_UPTIME * 100).toFixed(0)} %`);
}

if (TEIL === 'gitter') {
  // Kampfprofil-Klammer: F0 = Tag 1 (Forschung 0, kein Booster), F3B = Ende Woche 1/2
  // (Forschung 3, Kampf-Booster - das "schwach"-Profil, gegen das der ganze Plan rechnet).
  const PROFIL = process.argv[4] || 'f0';
  const gridState = PROFIL === 'f3b'
    ? L.stateFor('schwach')
    : noviceState({});
  if (PROFIL === 'f3b') gridState.economyClass = 'prospektor';
  const json = { profil: PROFIL, n: N, solo: {}, raid: {} };
  say(`=== MESSGITTER (Messbuild, ${N} Durchlaeufe je Zelle, Kampfprofil ${PROFIL.toUpperCase()}) ===`);
  say(PROFIL === 'f3b'
    ? 'Flotte im FLEET_SMALL-Verhaeltnis, Forschung 3, kein Modul, Kampf-Booster aktiv.'
    : 'Flotte im FLEET_SMALL-Verhaeltnis, Forschung 0, keine Module, keine Klasse, kein Booster.');
  say();
  say('SOLO-MISSIONEN (24 h, 6 Checks, Messbuild-Beuteregeln)');
  say('Flottenwert'.padEnd(13) + 'Sektor'.padEnd(10) + 'Siege'.padStart(7) + 'Belohnung'.padStart(12) +
      'Verlust'.padStart(11) + 'Bergung'.padStart(10) + 'Netto'.padStart(11) + 'StdAbw Netto'.padStart(14));
  for (const v of GRID) {
    const fleet = fleetForValue(v);
    const state = gridState;
    json.solo[v] = {};
    for (const sektor of SEKTOREN) {
      const rows = [];
      for (let i = 0; i < N; i++) rows.push(await soloMission(state, sektor, { ...fleet }));
      const netRows = rows.map((r) => ({ net: r.reward - r.lost + r.salvage }));
      const s = stats(netRows, 'net');
      json.solo[v][sektor] = { net: s.m, sd: s.sd, se: s.se, reward: stats(rows, 'reward').m };
      say(mio(v).padEnd(13) + sektor.replace('piraten_', '').padEnd(10) +
        stats(rows, 'wins').m.toFixed(1).padStart(7) +
        mrd(stats(rows, 'reward').m).padStart(12) +
        mrd(stats(rows, 'lost').m).padStart(11) +
        mrd(stats(rows, 'salvage').m).padStart(10) +
        mrd(s.m).padStart(11) +
        `${(s.sd / 1e9).toFixed(3)} (+-${(s.se / 1e9).toFixed(3)})`.padStart(14));
    }
  }
  say();
  say('RAID-WELLEN (eine Welle je Ziehung, Neulingsschutz aktiv -> kein Flottenverlust)');
  say('Flottenwert'.padEnd(13) + 'Siegquote'.padStart(11) + 'Wellen 12x'.padStart(12) +
      'Ertrag/Raid'.padStart(13) + 'Verlust ohne Schutz'.padStart(21));
  for (const v of GRID) {
    const fleet = fleetForValue(v);
    const state = gridState;
    const rows = [];
    for (let i = 0; i < N; i++) rows.push(await oneRaidWave(state, fleet));
    const p = rows.filter((r) => r.won).length / rows.length;
    const lostAvg = rows.reduce((a, r) => a + r.lostValue, 0) / rows.length;
    json.raid[v] = { p, se: Math.sqrt(p * (1 - p) / N), lost: lostAvg };
    say(mio(v).padEnd(13) + `${(p * 100).toFixed(0)} %`.padStart(11) +
      (p * E.RAID_WAVE_COUNT).toFixed(1).padStart(12) +
      mrd(p * E.RAID_WAVE_COUNT * RAID_WAVE_VALUE).padStart(13) +
      mrd(lostAvg * E.RAID_WAVE_COUNT).padStart(21));
  }
  fs.writeFileSync(path.join(HERE, `novice_gitter_${PROFIL}.json`), JSON.stringify(json, null, 1));
  say();
  say(`Gitter gespeichert: novice_gitter_${PROFIL}.json`);
}

// ===================================================================================
// RAID-ZELLE MIT HOHER SERIENZAHL
// Die Raid-Siegquote ist die tragende Zelle dieser Messung (sie entscheidet ueber den groessten
// Einzelposten der Woche). Bei N=40 und p nahe 0,5 liegt der Standardfehler bei 8 Prozentpunkten -
// zu grob, um Unterschiede zwischen Flottengroessen zu deuten. Dieser Teil misst sie separat mit
// hoher Serienzahl und schreibt sie ins vorhandene Gitter zurueck.
// ===================================================================================
if (TEIL === 'raid') {
  const PROFIL = process.argv[4] || 'f0';
  const file = path.join(HERE, `novice_gitter_${PROFIL}.json`);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const gridState = PROFIL === 'f3b' ? L.stateFor('schwach') : noviceState({});
  if (PROFIL === 'f3b') gridState.economyClass = 'prospektor';
  say(`=== RAID-ZELLE, ${N} Ziehungen je Flottengroesse (Messbuild, Kampfprofil ${PROFIL.toUpperCase()}) ===`);
  say('Flottenwert'.padEnd(13) + 'Siegquote'.padStart(11) + 'StdFehler'.padStart(11) +
      'Wellen 12x'.padStart(12) + 'Ertrag/Raid'.padStart(13));
  for (const v of GRID) {
    const fleet = fleetForValue(v);
    const rows = [];
    for (let i = 0; i < N; i++) rows.push(await oneRaidWave(gridState, fleet));
    const p = rows.filter((r) => r.won).length / rows.length;
    const se = Math.sqrt(p * (1 - p) / N);
    const lostAvg = rows.reduce((a, r) => a + r.lostValue, 0) / rows.length;
    json.raid[v] = { p, se, lost: lostAvg, n: N };
    say(mio(v).padEnd(13) + `${(p * 100).toFixed(1)} %`.padStart(11) + `+-${(se * 100).toFixed(1)}`.padStart(11) +
      (p * E.RAID_WAVE_COUNT).toFixed(1).padStart(12) + mrd(p * E.RAID_WAVE_COUNT * RAID_WAVE_VALUE).padStart(13));
  }
  json.raidN = N;
  fs.writeFileSync(file, JSON.stringify(json, null, 1));
  say();
  say(`Gitter aktualisiert: novice_gitter_${PROFIL}.json`);
}

// ===================================================================================
// TAGESLAUF - reine Arithmetik auf dem gemessenen Gitter
// ===================================================================================
if (TEIL === 'tageslauf') {
  const PROFIL = process.argv[4] || 'f0';
  const G = JSON.parse(fs.readFileSync(path.join(HERE, `novice_gitter_${PROFIL}.json`), 'utf8'));
  const gridVals = Object.keys(G.solo).map(Number).sort((a, b) => a - b);

  // Bau-Durchsatz: Wert je Sekunde fuer den FLEET_SMALL-Mix, mit der ECHTEN Funktion
  // bauzeitMultiplier() (enthaelt u.a. den Samstags-Bauzeit-Event).
  const MIX_TIME = Object.entries(MIX_BASE).reduce((a, [id, n]) => a + n * shipDef(id).buildTime, 0);
  const MIX_RATE = MIX_VALUE / MIX_TIME;                       // Wert je Sekunde und Lane, Multiplikator 1
  const MINING_BUILD_SECONDS = MINING_SHIPS_TOTAL * shipDef('mining').buildTime;

  // Zwei Bau-Klammern. K1 = heute (3 Lanes, heutige Basiszeiten). K2 = nach Entscheidung 9
  // (1 Lane, Basiszeiten x2; die additiven Reduktionen aus 9.1b wirken in Woche 1 mit Faktor
  // rund 1, siehe Messkasten bei Entscheidung 9).
  const KLAMMERN = {
    K1: { lanes: E.MAX_BUILD_SLOTS ?? 3, basis: 1, label: `heute (${L.cc.MAX_BUILD_SLOTS} Lanes, Basiszeit x1)` },
    K2: { lanes: 1, basis: 2, label: 'nach Entscheidung 9 (1 Lane, Basiszeit x2)' },
  };
  KLAMMERN.K1.lanes = L.cc.MAX_BUILD_SLOTS;

  function bauMultiplier(state, weekday) {
    return atWeekday(weekday, () => actions.bauzeitMultiplier(state));
  }

  const nearestGrid = (v) => gridVals.reduce((best, g) => (Math.abs(g - v) < Math.abs(best - v) ? g : best), gridVals[0]);
  const soloNet = (v) => {
    const g = nearestGrid(v);
    return Math.max(...SEKTOREN.map((s) => G.solo[g][s].net));
  };
  const raidP = (v) => G.raid[nearestGrid(v)].p;

  // Spielweise "optimal": der Spieler baut die Flotte, die seine KAMPF-Einnahmen maximiert.
  // Gemessen faellt beides oberhalb einer gewissen Groesse wieder ab (Gegner skaliert mit,
  // Belohnung nicht), mehr zu bauen ist also messbar schlechter. Das ist die OBERE SCHRANKE
  // fuer die Kampf-Einnahmen und damit der fuer Kriterium 5 unguenstigste Fall.
  const OPT_FLEET = gridVals.reduce((best, g) => {
    const scoreG = raidP(g) * E.RAID_WAVE_COUNT * RAID_WAVE_VALUE * (2 / 7) + soloNet(g) * (5 / 7);
    const scoreB = raidP(best) * E.RAID_WAVE_COUNT * RAID_WAVE_VALUE * (2 / 7) + soloNet(best) * (5 / 7);
    return scoreG > scoreB ? g : best;
  }, gridVals[0]);

  function woche(startWeekday, variant, opts = {}) {
    const { tage = [1, 7], windowDays = 7, spielweise = 'optimal', klammer = 'K1', raidChance = 1.0,
      moFrEvent = false, homeLevel = 12 } = opts;
    const K = KLAMMERN[klammer];
    const st = noviceState({});
    const quellen = { mining: 0, heimat: 0, solo: 0, raid: 0 };
    let flotte = 0;                       // gebauter Kampfflottenwert
    let ressourcen = val(START_RES);
    let miningShips = 0;
    for (let d = tage[0]; d <= tage[1]; d++) {
      const wd = (startWeekday + d - 1) % 7;
      const bm = bauMultiplier(st, wd);
      const kapazitaetProTag = MIX_RATE / (bm * K.basis) * K.lanes * 86400;
      // Tag 1: zuerst die 700 Mining-Schiffe, sie sind der Ertragsmotor und mit 14,3 Mio billig.
      if (miningShips < MINING_SHIPS_TOTAL) {
        const kosten = MINING_SHIPS_TOTAL * unitValue('mining');
        const sekunden = MINING_BUILD_SECONDS * bm * K.basis / K.lanes;
        if (ressourcen >= kosten) {
          miningShips = MINING_SHIPS_TOTAL;
          ressourcen -= kosten;
          var miningAnteilHeute = Math.max(0, 1 - sekunden / 86400);
        }
      } else var miningAnteilHeute = 1;
      // Bei "alles verbaut" wird die Flotte am oberen Rand des GEMESSENEN Gitters gedeckelt -
      // darueber hinaus gaebe es keine Messwerte mehr, nur noch Fortschreibung.
      const zielFlotte = spielweise === 'optimal'
        ? Math.min(OPT_FLEET, flotte + Math.min(ressourcen, kapazitaetProTag))
        : Math.min(gridVals[gridVals.length - 1], flotte + Math.min(ressourcen, kapazitaetProTag));
      const gebaut = Math.max(0, zielFlotte - flotte);
      flotte = zielFlotte;
      ressourcen -= gebaut;

      const inWindow = d <= windowDays;
      const mining = miningPerDay(st, wd, variant, inWindow, miningShips * (miningAnteilHeute ?? 1));
      const heimat = homeBasePerDay(homeLevel);
      const raidTag = wd === 3 || wd === 0;                 // RAID_SCHEDULE: Mittwoch und Sonntag
      const raid = raidTag ? raidChance * raidP(flotte) * E.RAID_WAVE_COUNT * RAID_WAVE_VALUE : 0;
      // An Raid-Tagen bleibt die Kampfflotte zuhause (sonst greift hasAnyDefense() nicht und
      // ALLE Wellen gehen verloren) - an diesen Tagen also keine Solo-Mission.
      const eventFaktor = moFrEvent && (wd === 1 || wd === 5) ? 2 : 1;
      const solo = raidTag ? 0 : soloNet(flotte) * eventFaktor;
      quellen.mining += mining; quellen.heimat += heimat; quellen.solo += solo; quellen.raid += raid;
      ressourcen += mining + heimat + solo + raid;
    }
    const summe = quellen.mining + quellen.heimat + quellen.solo + quellen.raid;
    return { quellen, summe, flotte, ressourcen, anteil: (k) => quellen[k] / summe };
  }

  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  say(`=== TAGESLAUF (Messbuild, Gitter ${PROFIL.toUpperCase()}, ${G.n} Durchlaeufe je Gitterzelle) ===`);
  say(`Optimale Kampfflotte laut Gitter: ${mio(OPT_FLEET)} Wert.`);
  say();
  say('--- A. WOCHE 1, IST-ZUSTAND (Frischling x3 multiplikativ), Klammer K1 ---');
  say('Start'.padEnd(7) + 'Mining'.padStart(11) + 'Heimat'.padStart(10) + 'Solo'.padStart(10) +
      'Raid'.padStart(11) + 'SUMME'.padStart(11) + 'Mining%'.padStart(9) + 'Raid%'.padStart(8));
  const anteileIst = [];
  for (let s = 0; s < 7; s++) {
    const w = woche(s, 'ist');
    anteileIst.push({ s, mining: w.anteil('mining'), raid: w.anteil('raid') });
    say(WD[s].padEnd(7) + mrd(w.quellen.mining).padStart(11) + mio(w.quellen.heimat).padStart(10) +
      mrd(w.quellen.solo).padStart(10) + mrd(w.quellen.raid).padStart(11) + mrd(w.summe).padStart(11) +
      `${(w.anteil('mining') * 100).toFixed(0)} %`.padStart(9) + `${(w.anteil('raid') * 100).toFixed(0)} %`.padStart(8));
  }
  const mmin = Math.min(...anteileIst.map((a) => a.mining)), mmax = Math.max(...anteileIst.map((a) => a.mining));
  const rmin = Math.min(...anteileIst.map((a) => a.raid)), rmax = Math.max(...anteileIst.map((a) => a.raid));
  say(`Spannweite ueber alle sieben Startwochentage: Mining ${(mmin * 100).toFixed(0)}-${(mmax * 100).toFixed(0)} %, ` +
      `Raid ${(rmin * 100).toFixed(0)}-${(rmax * 100).toFixed(0)} %`);
  say();

  say('--- B. VARIANTEN (Woche 1, Startwochentag Montag, beide Bau-Klammern) ---');
  const VARIANTEN = ['ist', 'add:2.0', 'add:1.5', 'add:1.0', 'aus'];
  for (const kl of ['K1', 'K2']) {
    say(`Klammer ${kl} - ${KLAMMERN[kl].label}`);
    say('Variante'.padEnd(10) + 'Faktor Mo'.padStart(11) + 'Mining'.padStart(11) + 'Solo'.padStart(10) +
        'Raid'.padStart(11) + 'SUMME'.padStart(11) + 'Mining%'.padStart(9) + 'Raid%'.padStart(8) +
        'Mining% o.Raid'.padStart(15));
    for (const v of VARIANTEN) {
      const w = woche(1, v, { klammer: kl });
      const f = miningMultiplierVariant(noviceState({}), 1, v, true);
      const ohneRaid = w.summe - w.quellen.raid;
      say(v.padEnd(10) + `x${f.toFixed(2)}`.padStart(11) + mrd(w.quellen.mining).padStart(11) +
        mrd(w.quellen.solo).padStart(10) + mrd(w.quellen.raid).padStart(11) + mrd(w.summe).padStart(11) +
        `${(w.anteil('mining') * 100).toFixed(0)} %`.padStart(9) + `${(w.anteil('raid') * 100).toFixed(0)} %`.padStart(8) +
        `${(w.quellen.mining / ohneRaid * 100).toFixed(0)} %`.padStart(15));
    }
    say('  "Mining% o.Raid" = Anteil am Wocheneinkommen OHNE den Raid. Der Raid ist nach Abschnitt 1b,');
    say('  Kriterium 4 ausdruecklich KEIN freischaltbarer Inhalt, sondern ein Ereignis - und sein');
    say('  Ertrag steht unter Entscheidung 3, die entschieden, aber NICHT gebaut ist.');
    say();
  }

  say('--- C. EMPFINDLICHKEIT (Woche 1, Ist-Zustand, Klammer K1, Startwochentag Montag) ---');
  const basis = woche(1, 'ist');
  const faelle = [
    ['Grundfall', {}],
    ['Raid-Fallback-Chance 0,7', { raidChance: E.RAID_SPAWN_CHANCE }],
    ['Mo/Fr-Event auf Solo (x2)', { moFrEvent: true }],
    ['Heimatbasis Stufe 0', { homeLevel: 0 }],
    ['Spielweise "alles verbaut"', { spielweise: 'alles' }],
    ['Raid gar nicht verteidigt', { raidChance: 0 }],
  ];
  say('Fall'.padEnd(30) + 'SUMME'.padStart(11) + 'Mining%'.padStart(9) + 'Raid%'.padStart(8) + 'Flotte'.padStart(11));
  for (const [label, opts] of faelle) {
    const w = woche(1, 'ist', opts);
    say(label.padEnd(30) + mrd(w.summe).padStart(11) + `${(w.anteil('mining') * 100).toFixed(0)} %`.padStart(9) +
      `${(w.anteil('raid') * 100).toFixed(0)} %`.padStart(8) + mio(w.flotte).padStart(11));
  }
  say();

  say('--- D. WOCHE 2 (Tag 8-14): Fensterfrage 7 gegen 14 Tage ---');
  say('Fenster'.padEnd(10) + 'Variante'.padEnd(10) + 'Mining'.padStart(11) + 'Solo'.padStart(10) +
      'Raid'.padStart(11) + 'SUMME'.padStart(11) + 'Mining%'.padStart(9) + 'Raid%'.padStart(8));
  for (const fenster of [7, 14]) {
    for (const v of ['ist', 'add:2.0', 'add:1.5', 'aus']) {
      const w = woche(1, v, { tage: [8, 14], windowDays: fenster });
      say(`${fenster} Tage`.padEnd(10) + v.padEnd(10) + mrd(w.quellen.mining).padStart(11) +
        mrd(w.quellen.solo).padStart(10) + mrd(w.quellen.raid).padStart(11) + mrd(w.summe).padStart(11) +
        `${(w.anteil('mining') * 100).toFixed(0)} %`.padStart(9) + `${(w.anteil('raid') * 100).toFixed(0)} %`.padStart(8));
    }
  }
  say();
  say('--- E. NIVEAU-VERGLEICH ---');
  say(`Woche 1 im Ist-Zustand: ${mrd(basis.summe / 7)}/Tag.`);
  say(`Baseline nach Block A Schritt 2 (Vorhersage, run_income_baseline_v2.mjs): 0,98 / 19,57 / 61,11 Mrd/Tag.`);
  say(`Verhaeltnis Woche 1 zum fruehen Ausbaustand: x${(basis.summe / 7 / 0.98e9).toFixed(1)}`);
}

const OUT_SUFFIX = ['gitter', 'raid', 'tageslauf'].includes(TEIL) ? `_${process.argv[4] || 'f0'}` : '';
fs.writeFileSync(path.join(HERE, `novice_${TEIL}${OUT_SUFFIX}.out`), out.join('\n') + '\n');
process.exit(0);
