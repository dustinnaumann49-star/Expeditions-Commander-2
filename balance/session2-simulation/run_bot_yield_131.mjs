// !!! MESSBUILD-SKRIPT - LAEUFT NICHT GEGEN DEN REPO-STAND !!!
// Es erwartet den kumulativen Messbuild (Block A Schritt 2 + Entscheidung 16). Erzeugen mit:
//   node make_messbuild_kum.mjs <ordner ausserhalb des repos> --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=<ordner> node run_bot_yield_131.mjs <teil> [N]
// ALLE ERGEBNISSE DIESES SKRIPTS SIND MESSBUILD-WERTE, KEIN REPO-STAND.
//
// ===================================================================================
// ENTSCHEIDUNG 13.1 - BOT-ERTRAG AUS DER EIGENEN FLOTTENMACHT (Weg (b))
// ENTSCHEIDUNG 13.2 - FESTE BOT-PROFILE (deterministische Nebenrechnung)
// ===================================================================================
//
// TEILE
//   basis    deterministisch: Flottenmacht/-wert der drei Referenzflotten, Minen-Ertrag mit und
//            ohne NPC_PRODUCTION_BONUS_MULTIPLIER, toter Container-Wert eines Bots.
//            KEINE Serien - jede Zahl ist eine Funktion des Codes, kein Zufall.
//   profil   deterministisch: Macht je Wert-Einheit unter der heutigen "geringster Bestand
//            zuerst"-Regel (Gleichverteilung) gegen gewichtete Profile (13.2).
//   gitter   GEMESSEN (Serien): vernichtete Feindmacht und Wertverlust je Tag aus der
//            24h-Solo-Mission, je Ausbaustand. Liefert die beiden Koeffizienten k und v,
//            aus denen Weg (b) besteht.
//
// WAS DETERMINISTISCH IST UND DESHALB OHNE SERIEN AUSGEWIESEN WIRD (Messregel-Vorgabe):
//   - combatFleetPowerBase() und die Wert-Summe einer Flotte: reine Tabellen-Arithmetik.
//   - mineOutputPerHour(): haengt nur an Gebaeudestufe, Energie, Mining-Forschung, Modulen.
//   - Der Container-Wert eines Bots: openContainer() ist ausschliesslich ueber routes.ts
//     erreichbar (geprueft), ein Bot ruft es nie auf - der Wert ist strukturell 0.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as L from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MESSBUILD) throw new Error('MESSBUILD nicht gesetzt - siehe Kopf dieser Datei.');
const DIST = path.resolve(process.env.MESSBUILD);

// Isolierte dist-Kopie: actions.js zieht ueber state.js -> db.js eine Datenbank mit hartkodiertem
// Pfad (Abschnitt 1b, Vorbedingung V2). Muster aus run_novice_bonus.mjs.
const TMP = path.join(os.tmpdir(), 'ec-bot131-isolated');
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(DIST, TMP, { recursive: true });
const NODE_MODULES = path.resolve(HERE, '../../server/node_modules');
if (!fs.existsSync(NODE_MODULES)) throw new Error(`node_modules fehlt: ${NODE_MODULES} - erst npm install im Serverordner`);
try { fs.symlinkSync(NODE_MODULES, path.join(TMP, 'node_modules'), 'junction'); } catch { /* existiert bereits */ }
const imp = (rel) => import(pathToFileURL(path.join(TMP, rel)).href);

const actions = await imp('game/actions.js');
const { BUILDINGS } = await imp('game/data/buildings.js');
const economy = await imp('game/data/economy.js');
const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;

const TRADE = { metall: 1, kristall: 1.5, deuterium: 3 };
const val = (c) => (c.metall || 0) * TRADE.metall + (c.kristall || 0) * TRADE.kristall + (c.deuterium || 0) * TRADE.deuterium;
const shipDef = (id) => L.ships.SHIPS.find((x) => x.id === id) || L.defenses.DEFENSES.find((d) => d.id === id);
const unitValue = (id) => { const s = shipDef(id); return s ? (s.cost ? val(s.cost) : 3000 * 325000) : 0; };
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;
const mio = (x) => `${(x / 1e6).toFixed(1)} Mio`;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const REAL_FLEET = {
  leicht: 5000, schwer: 5000,
  kreuzer: 5000, schlachtschiff: 5000, bomber: 5000,
  schlachtkreuzer: 2000, zerstoerer: 2000, reaper: 2000,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30,
  imperator: 6,
};
// Genau die Ausbaustaende aus run_income_baseline_v2.mjs - damit die Spalten vergleichbar bleiben.
const STANDS = [
  { key: 'frueh', fleet: L.FLEET_SMALL, profile: 'schwach', solo: 'piraten_hoch', miningLevel: 3, levels: [12, 11, 10], abbauBooster: false, prospektor: false, netto: 0.98e9, flotte: 0.32e9 },
  { key: 'mittel', fleet: L.FLEET_LARGE, profile: 'mittel', solo: 'piraten_hoch', miningLevel: 6, levels: [24, 21, 20], abbauBooster: true, prospektor: false, netto: 19.57e9, flotte: 5.52e9 },
  { key: 'spaet', fleet: REAL_FLEET, profile: 'voll', solo: 'piraten_hoch', miningLevel: 10, levels: [36, 32, 30], abbauBooster: true, prospektor: true, netto: 61.11e9, flotte: 29.27e9 },
];

// ---------------------------------------------------------------------------------------------
// Minen-Ertrag: aus der ECHTEN Funktion, nicht nachgebaut. Solarkraftwerk bewusst hoch gesetzt,
// damit energyFactor() = 1 ist und die Zahl nicht zusaetzlich am Energieausbau haengt - das ist
// eine SETZUNG und wird als solche ausgewiesen.
// ---------------------------------------------------------------------------------------------
function mineStateFor(levels, miningLevel, opts = {}) {
  return {
    userId: 1,
    buildings: { metallmine: levels[0], kristallmine: levels[1], deuteriummine: levels[2], solarkraftwerk: 200 },
    buildingModules: {}, buildingTier: 1,
    research: { mining: miningLevel, mining_minen: opts.miningMinen || 0 },
    shipModules: {}, defenseModules: {},
    playerClass: null, economyClass: opts.prospektor ? 'prospektor' : null,
    activeBoosters: opts.abbau ? { abbau: Date.now() + 30 * 24 * 3600 * 1000 } : {},
    fleet: {}, defense: {}, resources: { metall: 0, kristall: 0, deuterium: 0, dm: 0 },
  };
}
function mineValuePerDay(levels, miningLevel, opts = {}) {
  const st = mineStateFor(levels, miningLevel, opts);
  let v = 0;
  BUILDINGS.forEach((b) => {
    if (!b.baseOutput) return;
    const perH = actions.mineOutputPerHour(st, b.id);
    if (b.kind === 'mine_metall') v += perH * 24 * TRADE.metall;
    else if (b.kind === 'mine_kristall') v += perH * 24 * TRADE.kristall;
    else if (b.kind === 'mine_deuterium') v += perH * 24 * TRADE.deuterium;
  });
  return v;
}

// ---------------------------------------------------------------------------------------------
async function teilBasis() {
  say('=== TEIL "basis" - DETERMINISTISCH, KEINE SERIEN ===');
  say('Alle Zahlen sind Funktionen des Codes (Tabellen-Arithmetik bzw. mineOutputPerHour()).');
  say('Messbuild-Werte (Block A Schritt 2 + Entscheidung 16).');
  say();

  say('--- 1. Referenzflotten: Macht (combatFleetPowerBase) und Wert (TRADE_VALUE) ---');
  say('Stand'.padEnd(9) + 'Flottenmacht'.padStart(16) + 'Flottenwert'.padStart(14) + 'Wert/Macht'.padStart(12));
  const powers = {};
  for (const st of STANDS) {
    const p = L.combat.combatFleetPowerBase(st.fleet);
    const w = fleetValue(st.fleet);
    powers[st.key] = { power: p, value: w };
    say(st.key.padEnd(9) + mrd(p).padStart(16) + mrd(w).padStart(14) + (w / p).toFixed(3).padStart(12));
  }
  say();

  say('--- 2. Minen-Ertrag je Tag (Wert-Einheiten), aus actions.mineOutputPerHour() ---');
  say('Setzungen: Gebaeudestufen gestaffelt wie HOME_TIER_UNLOCK_LEVELS (36/32/30) und im selben');
  say('Verhaeltnis nach unten skaliert; Solarkraftwerk 200 (energyFactor = 1); keine Gebaeude-Module;');
  say('mining_minen = 0. SPIELER: Abbau-Booster und Prospektor wie in den STANDS der Baseline.');
  say('BOT: gleicher Gebaeudestand, gleiche Mining-Forschung, KEIN Booster, KEIN Prospektor');
  say('(economyBotTurn.ts kauft keine Booster und setzt keine economyClass - gegreppt), dafuer');
  say(`NPC_PRODUCTION_BONUS_MULTIPLIER = ${economy.NPC_PRODUCTION_BONUS_MULTIPLIER}.`);
  say('Stand'.padEnd(9) + 'Stufen'.padStart(11) + 'Mining'.padStart(8) + 'Spieler/Tag'.padStart(14) +
      'Bot roh'.padStart(12) + `Bot x${economy.NPC_PRODUCTION_BONUS_MULTIPLIER}`.padStart(12));
  const mines = {};
  for (const st of STANDS) {
    const spieler = mineValuePerDay(st.levels, st.miningLevel, { abbau: st.abbauBooster, prospektor: st.prospektor });
    const botRoh = mineValuePerDay(st.levels, st.miningLevel, {});
    mines[st.key] = { spieler, botRoh, bot: botRoh * economy.NPC_PRODUCTION_BONUS_MULTIPLIER };
    say(st.key.padEnd(9) + st.levels.join('/').padStart(11) + String(st.miningLevel).padStart(8) +
        mio(spieler).padStart(14) + mio(botRoh).padStart(12) + mrd(botRoh * economy.NPC_PRODUCTION_BONUS_MULTIPLIER).padStart(12));
  }
  say();
  say('Gegenprobe zur Setzung BASE_INCOME in run_income_baseline_v2.mjs (55 / 300 / 554 Mio/Tag):');
  say('  aus dem Code (Spieler-Parametrierung): ' + mio(mines.frueh.spieler) + ' / ' + mio(mines.mittel.spieler) + ' / ' + mio(mines.spaet.spieler));
  say('  Abweichung: ' + STANDS.map((s, i) => `${s.key} ${(((mines[s.key].spieler) / [55e6, 300e6, 554e6][i] - 1) * 100).toFixed(0)} %`).join('   '));
  say();

  say('--- 3. Der Bezugswert: Bot-Ertrag als Anteil am Spieler, je Spalte ---');
  say('Spalte'.padEnd(9) + 'Spieler netto'.padStart(15) + 'Bot Minen x6'.padStart(15) + 'Anteil'.padStart(10) + 'Faktor fuer 100 %'.padStart(19));
  for (const st of STANDS) {
    const bot = mines[st.key].bot;
    say(st.key.padEnd(9) + mrd(st.netto).padStart(15) + mrd(bot).padStart(15) +
        `${((bot / st.netto) * 100).toFixed(0)} %`.padStart(10) +
        (st.netto / mines[st.key].botRoh).toFixed(1).padStart(19));
  }
  say();

  say('--- 4. Tagesrendite auf den eigenen Flottenwert (spaltenfreies Mass) ---');
  say('Spieler-Band aus income_baseline_v2.txt; Bot = Minen x6 gegen den Flottenwert derselben Zeile.');
  say('Spalte'.padEnd(9) + 'Spieler'.padStart(10) + 'Bot heute'.padStart(12));
  for (const st of STANDS) {
    const bot = mines[st.key].bot;
    say(st.key.padEnd(9) + `${((st.netto / st.flotte) * 100).toFixed(0)} %`.padStart(10) +
        `${((bot / st.flotte) * 100).toFixed(0)} %`.padStart(12));
  }
  say();

  say('--- 5. Toter Container-Wert eines Bots (strukturell, nicht gemessen) ---');
  say('openContainer()/openAllContainers() sind ausschliesslich ueber routes.ts erreichbar.');
  say('Ein Bot stellt nie einen Request - er oeffnet nie einen Container.');
  const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
  const raidPerWave = economy.RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber +
    economy.RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + economy.RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite;
  say(`  Raid je gewonnener Welle: ${economy.RAID_WAVE_WIN_SILBER}x Silber + ${economy.RAID_WAVE_WIN_GOLD}x Gold + ${economy.RAID_WAVE_WIN_ELITE}x Elite = ${mrd(raidPerWave)} Wert`);
  say(`  bei ${economy.RAID_WAVE_COUNT}/${economy.RAID_WAVE_COUNT} Wellen: ${mrd(raidPerWave * economy.RAID_WAVE_COUNT)} je Raid`);
  const eliteCfg = SEKTOR_CONFIG.piraten_elite;
  const eliteCont = (eliteCfg.guaranteedContainers || []).reduce((a, gc) => a + gc.count * CONTAINER_EV[gc.tier], 0);
  say(`  Elite-Bollwerk je gewonnenem Check: ${mrd(eliteCont)} Wert an garantierten Containern`);
  say('  Fuer einen Bot ist davon jeweils 0,00 Mrd nutzbar - der Kampf wird gefuehrt, der Wert nie eingeloest.');
  say();

  say('--- 6. Was ein Bot heute an NUTZBAREM Kampf-Ertrag hat (Code-Pfade) ---');
  say('  bot.ts maybeAttackPirateBase(): Beute ueber pirateBaseLoot() -> LOOT_CURVE_ANCHOR_*  -> RESSOURCEN, nutzbar');
  say('  groupOps.ts Elite-Bollwerk:     winResources je gewonnenem Check                     -> RESSOURCEN, nutzbar');
  say('  raids.ts:                       ausschliesslich Container                            -> WERTLOS fuer den Bot');
  say(`  Elite winResources je Check: ${mrd(val(eliteCfg.winResources))} Wert (vor Kurve/Eskalation)`);
  return { powers, mines };
}

// ---------------------------------------------------------------------------------------------
// 13.2 - deterministische Nebenrechnung
// ---------------------------------------------------------------------------------------------
const COMBAT_SHIP_IDS = ['leicht', 'schwer', 'kreuzer', 'schlachtschiff', 'bomber', 'schlachtkreuzer', 'zerstoerer', 'reaper'];

function powerPerValue(weights, budget = 1e12) {
  // Gewichte sind STUECKZAHL-Anteile. Die Flotte wird so skaliert, dass ihr Wert dem Budget
  // entspricht - Macht je Wert-Einheit ist davon unabhaengig, das Budget dient nur der Lesbarkeit.
  const wsum = Object.values(weights).reduce((a, b) => a + b, 0);
  const unitCostMix = Object.entries(weights).reduce((a, [id, w]) => a + (w / wsum) * unitValue(id), 0);
  const scale = budget / unitCostMix;
  const fleet = {};
  Object.entries(weights).forEach(([id, w]) => (fleet[id] = (w / wsum) * scale));
  const p = L.combat.combatFleetPowerBase(fleet);
  const v = fleetValue(fleet);
  return { power: p, value: v, ppv: p / v, fleet };
}

async function teilProfil() {
  say('=== TEIL "profil" - ENTSCHEIDUNG 13.2, DETERMINISTISCH, KEINE SERIEN ===');
  say('Frage: was kostet die heutige Bauregel "geringster Bestand zuerst" an Macht je Wert-Einheit?');
  say('Sie laeuft langfristig auf GLEICHE STUECKZAHLEN aller acht Kampfschiffstypen zu');
  say('(maybeBuildShips() in economyBotTurn.ts, Sortierung nach countInFleetOrQueue).');
  say();
  const gleich = Object.fromEntries(COMBAT_SHIP_IDS.map((id) => [id, 1]));
  // Profil-Vorschlag 13.2: Vega offensiv/flottenlastig, Nyx defensiv/wirtschaftslastig.
  // Die Gewichte sind ein VORSCHLAG (Setzung), keine Messung - sie bilden die Stueckzahl-Pyramide
  // nach, die eine reale Flotte hat (viele billige, wenige teure).
  const vega = { leicht: 40, schwer: 25, kreuzer: 15, schlachtschiff: 8, bomber: 4, schlachtkreuzer: 5, zerstoerer: 2, reaper: 1 };
  const nyx = { leicht: 30, schwer: 30, kreuzer: 20, schlachtschiff: 10, bomber: 5, schlachtkreuzer: 3, zerstoerer: 1, reaper: 1 };
  const cases = [['Gleichverteilung (heute)', gleich], ['Profil Vega (Vorschlag)', vega], ['Profil Nyx (Vorschlag)', nyx]];
  say('Aufstellung'.padEnd(26) + 'Macht je Wert-Einheit'.padStart(22) + 'gegen heute'.padStart(14));
  const base = powerPerValue(gleich).ppv;
  for (const [name, w] of cases) {
    const r = powerPerValue(w);
    say(name.padEnd(26) + r.ppv.toFixed(4).padStart(22) + `${((r.ppv / base - 1) * 100).toFixed(1)} %`.padStart(14));
  }
  say();
  say('Wert-Anteil je Typ bei Gleichverteilung (das ist der eigentliche Befund aus 13.2):');
  const g = powerPerValue(gleich);
  const gv = fleetValue(g.fleet);
  COMBAT_SHIP_IDS.forEach((id) => {
    const share = (g.fleet[id] * unitValue(id)) / gv;
    say('  ' + id.padEnd(16) + `${(share * 100).toFixed(1)} %`.padStart(8) + '   Stueckkosten ' + mio(unitValue(id)));
  });
}

// ---------------------------------------------------------------------------------------------
// gitter: k und v aus der 24h-Solo-Mission
// ---------------------------------------------------------------------------------------------
const DEFENSE_FACTOR = { piraten_niedrig: 0.05, piraten_mittel: 0.12, piraten_hoch: 0.15, piraten_elite: 0.18 };

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
  return { destroyedPower: L.combat.combatFleetPowerBase(destroyed), lostThisCheck };
}

async function teilGitter(N, only) {
  say(`=== TEIL "gitter" - GEMESSEN, ${N} Durchlaeufe je Zelle (Messregel 2) ===`);
  say('24h-Solo-Mission gegen piraten_hoch, kumulativer Messbuild.');
  say('Gemessen werden die beiden Koeffizienten, aus denen Weg (b) besteht:');
  say('  k = vernichtete Feindmacht je Tag / eigene Flottenmacht');
  say('  v = Wertverlust je Tag / eigener Flottenwert (virtuelle Verlustrate)');
  say();
  say('Stand'.padEnd(9) + 'Flottenmacht'.padStart(14) + 'Feindmacht/Tag'.padStart(16) + 'k'.padStart(8) +
      'Verlust/Tag'.padStart(13) + 'v'.padStart(9) + 'k-Streuung'.padStart(12));
  for (const st of STANDS) {
    if (only && st.key !== only) continue;
    const state = L.stateFor(st.profile);
    const ownPower = L.combat.combatFleetPowerBase(st.fleet);
    const ownValue = fleetValue(st.fleet);
    const ks = [];
    let sumDestroyed = 0, sumLost = 0;
    for (let i = 0; i < N; i++) {
      const cfg = SEKTOR_CONFIG[st.solo];
      const ships = { ...st.fleet };
      let destroyedPower = 0;
      for (let c = 0; c < 6; c++) {
        if (Math.random() >= cfg.checkChance) continue;
        const r = await oneCheck(state, st.solo, ships);
        if (!r) continue;
        destroyedPower += r.destroyedPower;
      }
      const lost = Object.entries(st.fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
      sumDestroyed += destroyedPower;
      sumLost += lost;
      ks.push(destroyedPower / ownPower);
    }
    const k = sumDestroyed / N / ownPower;
    const v = sumLost / N / ownValue;
    const mean = ks.reduce((a, b) => a + b, 0) / ks.length;
    const sd = Math.sqrt(ks.reduce((a, b) => a + (b - mean) ** 2, 0) / ks.length);
    say(st.key.padEnd(9) + mrd(ownPower).padStart(14) + mrd(sumDestroyed / N).padStart(16) +
        k.toFixed(3).padStart(8) + mrd(sumLost / N).padStart(13) +
        `${(v * 100).toFixed(1)} %`.padStart(9) + `${((sd / mean) * 100).toFixed(1)} %`.padStart(12));
  }
}

// ---------------------------------------------------------------------------------------------
// engpass: reagiert die Bot-Flotte ueberhaupt auf mehr Einkommen?
// Der Messkasten zu 13.3 haelt fest, dass bei einer REICHEN Basis die BAU-SLOTS binden und nicht
// der Ressourcenstand. Trifft das auch auf einen Bot zu, ist der Ertrag der falsche Regler - dann
// stapelt Weg (b) nur Ressourcen. Das muss VOR jeder Koeffizienten-Kalibrierung geklaert sein
// (Messregel: prueft die Zelle die Frage ueberhaupt?).
//
// Aufbau: virtuelle Uhr (Date.now umgebogen), 2-Minuten-Takt wie der Heartbeat, je Takt
// runEconomyTick() + runEconomyBotTurn() - also exakt die beiden Funktionen, die heartbeat.ts
// fuer einen Bot aufruft, ohne Kampf und ohne Datenbank-Schreibzugriff.
// Der Mehrertrag wird als zusaetzliche Ressourcen je Takt eingespeist, NICHT ueber
// NPC_PRODUCTION_BONUS_MULTIPLIER - der ist ein `export const` und zur Laufzeit nicht aenderbar.
// DETERMINISTISCH bis auf maybeChooseClass() (einmalige Zufallswahl) - deshalb wird die Klasse
// vorab fest gesetzt, damit der Vergleich zwischen den Varianten sauber ist.
// ---------------------------------------------------------------------------------------------
async function teilEngpass(days, variants) {
  const state0mod = await imp('game/state.js');
  const bot = await imp('game/economyBotTurn.js');
  say(`=== TEIL "engpass" - reagiert die Bot-Flotte auf mehr Einkommen? (${days} simulierte Tage) ===`);
  say('Virtuelle Uhr, 2-Minuten-Takt wie HEARTBEAT_INTERVAL_MS. Je Takt runEconomyTick() +');
  say('runEconomyBotTurn() - dieselben zwei Funktionen wie in heartbeat.ts. Kein Kampf.');
  say(`MAX_BUILD_SLOTS = ${L.cc.MAX_BUILD_SLOTS}, MAX_DEFENSE_SLOTS = ${L.cc.MAX_DEFENSE_SLOTS}, MAX_BUILDING_SLOTS = ${L.cc.MAX_BUILDING_SLOTS}, MAX_RESEARCH_SLOTS = ${L.cc.MAX_RESEARCH_SLOTS}`);
  say();
  const STEP_MS = 2 * 60 * 1000;
  const steps = Math.round((days * 24 * 3600 * 1000) / STEP_MS);
  const realNow = Date.now;
  say('Zusatzertrag'.padEnd(14) + 'Flottenwert'.padStart(14) + 'Verteidigung'.padStart(14) +
      'Minen'.padStart(10) + 'Restlager'.padStart(14) + 'Bau-Slots'.padStart(11) + 'Geb.-Mod.'.padStart(11) + 'Forschung'.padStart(11) + 'Solar'.padStart(8) + 'E-Faktor'.padStart(10) + 'Geb.-Q.'.padStart(9));
  for (const extraFactor of variants) {
    let VNOW = realNow();
    Date.now = () => VNOW;
    const st = state0mod.defaultPlayerState(-999);
    st.playerClass = 'kanonier';           // maybeChooseClass() ist die einzige Zufallsquelle
    st.lastUpdate = VNOW;
    let slotSum = 0, bqSum = 0; const hist = {};
    for (let i = 0; i < steps; i++) {
      VNOW += STEP_MS;
      await actions.runEconomyTick(st);
      if (extraFactor > 0) {
        // Mehrertrag im Verhaeltnis der laufenden Minen-Produktion, damit er mit dem Ausbaustand
        // mitwaechst (so verhaelt sich auch Weg (b) - Ertrag haengt am eigenen Stand).
        let m = 0, k = 0, d = 0;
        BUILDINGS.forEach((b) => {
          if (!b.baseOutput) return;
          const perStep = (actions.mineOutputPerHour(st, b.id) / 3600) * (STEP_MS / 1000) * economy.NPC_PRODUCTION_BONUS_MULTIPLIER;
          if (b.kind === 'mine_metall') m += perStep; else if (b.kind === 'mine_kristall') k += perStep; else if (b.kind === 'mine_deuterium') d += perStep;
        });
        st.resources.metall += m * extraFactor;
        st.resources.kristall += k * extraFactor;
        st.resources.deuterium += d * extraFactor;
      }
      bot.runEconomyBotTurn(st);
      slotSum += st.buildQueue.length;
      bqSum += st.buildingQueue.length;
      for (const j of st.buildingQueue) { const kk = j.buildingId || ('mod:' + j.moduleId); hist[kk] = (hist[kk] || 0) + 1; }
    }
    Date.now = realNow;
    const fv = fleetValue(st.fleet);
    const dv = fleetValue(st.defense);
    const lager = val(st.resources);
    const minen = `${st.buildings.metallmine || 0}/${st.buildings.kristallmine || 0}/${st.buildings.deuteriummine || 0}`;
    const gebMod = Object.values(st.buildingModules || {}).reduce((a, b) => a + b, 0);
    const fors = Object.values(st.research || {}).reduce((a, b) => a + b, 0);
    say(`x${extraFactor}`.padEnd(14) + mrd(fv).padStart(14) + mrd(dv).padStart(14) + minen.padStart(10) +
        mrd(lager).padStart(14) + (slotSum / steps).toFixed(2).padStart(11) + String(gebMod).padStart(11) + String(fors).padStart(11) +
        String(st.buildings.solarkraftwerk || 0).padStart(8) + actions.energyFactor(st, 1).toFixed(2).padStart(10) + (bqSum / steps).toFixed(2).padStart(9));
    say('    Roboterfabrik ' + (st.buildings.roboterfabrik || 0) + ', Nanitenfabrik ' + (st.buildings.nanitenfabrik || 0) +
        ' | Belegung des Gebaeude-Slots: ' + Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 6)
          .map(([k, v]) => `${k} ${((v / steps) * 100).toFixed(0)} %`).join(', '));
  }
  say();
  say('Lesart: steigt der Flottenwert mit dem Zusatzertrag ungefaehr proportional mit, ist der');
  say('Ressourcenstand der Engpass und der Ertrag der richtige Regler. Bleibt er stehen, waehrend');
  say('das Restlager waechst und die Bau-Slots dauerhaft belegt sind, binden die Slots - dann');
  say('kalibriert Weg (b) einen Regler ohne Wirkung.');
}

// ---------------------------------------------------------------------------------------------
// kalib: Weg (b) durchrechnen. Reine Arithmetik auf den gemessenen Koeffizienten k und v.
// ---------------------------------------------------------------------------------------------
function teilKalib(K, LOSS_PER_POWER) {
  say('=== TEIL "kalib" - Weg (b), Arithmetik auf den gemessenen Koeffizienten ===');
  say('Formel (alle Koeffizienten aus Entscheidung 2, nichts neu erfunden):');
  say('  vernichtete Feindmacht/Tag = k * combatFleetPowerBase(Bot-Flotte) * f');
  say(`  Ertrag  = LOOT_CURVE_ANCHOR_VALUE * (Feindmacht / LOOT_CURVE_ANCHOR_POWER)^${economy.LOOT_CURVE_EXPONENT}`);
  say('  Verlust = LOSS_PER_POWER * Feindmacht, abzueglich Wrack-Bergung 30 %');
  say(`  k = ${K.toFixed(2)} (gemessen), LOSS_PER_POWER = ${LOSS_PER_POWER.toFixed(4)} Wert-Einheiten je Punkt (gemessen)`);
  say('  f = einziger freier Parameter ("Aktivitaets-Anteil": wie viele 24h-Missions-Aequivalente je Tag)');
  say();
  const AP = economy.LOOT_CURVE_ANCHOR_POWER, AV = economy.LOOT_CURVE_ANCHOR_VALUE, EX = economy.LOOT_CURVE_EXPONENT;
  const netFor = (power, f) => {
    const dp = K * power * f;
    const ertrag = AV * Math.pow(dp / AP, EX);
    const verlust = LOSS_PER_POWER * dp * 0.7;
    return { dp, ertrag, verlust, netto: ertrag - verlust };
  };
  say('Verhaeltnis Bot-Netto zu Spieler-Netto bei GLEICHER Flottenmacht:');
  say('f'.padEnd(6) + STANDS.map((s) => s.key.padStart(12)).join('') + 'max'.padStart(9) + 'min'.padStart(9));
  for (const f of [1, 2, 4, 6, 7, 8, 9, 10, 12, 15, 20]) {
    const rs = STANDS.map((s) => netFor(L.combat.combatFleetPowerBase(s.fleet), f).netto / s.netto);
    say(String(f).padEnd(6) + rs.map((r) => r.toFixed(2).padStart(12)).join('') +
        Math.max(...rs).toFixed(2).padStart(9) + Math.min(...rs).toFixed(2).padStart(9));
  }
  say();
  say('Absolute Zahlen bei ausgewaehlten f (Mrd Wert je Tag):');
  for (const f of [6, 8, 10]) {
    say(`  f = ${f}`);
    say('    Stand'.padEnd(12) + 'Feindmacht'.padStart(13) + 'Ertrag'.padStart(11) + 'Verlust'.padStart(11) + 'Netto'.padStart(11) + 'Spieler'.padStart(11));
    for (const s of STANDS) {
      const r = netFor(L.combat.combatFleetPowerBase(s.fleet), f);
      say(('    ' + s.key).padEnd(12) + mrd(r.dp).padStart(13) + mrd(r.ertrag).padStart(11) +
          mrd(r.verlust).padStart(11) + mrd(r.netto).padStart(11) + mrd(s.netto).padStart(11));
    }
  }
  say();
  say('Zum Vergleich der HEUTIGE Mechanismus (Minen x6, ohne jeden Flottenbezug):');
  say('  frueh 0,18 Mrd (0,18x) | mittel 1,21 Mrd (0,06x) | spaet 6,65 Mrd (0,11x)');
}

const teil = process.argv[2] || 'basis';
const N = Number(process.argv[3] || 40);
if (teil === 'basis') await teilBasis();
else if (teil === 'profil') await teilProfil();
else if (teil === 'gitter') await teilGitter(N, process.argv[4]);
else if (teil === 'engpass') await teilEngpass(Number(process.argv[3] || 14), (process.argv[4] || '0,1,3,9,27').split(',').map(Number));
else if (teil === 'kalib') teilKalib(Number(process.argv[3] || 4.0), Number(process.argv[4] || 0.036));
else throw new Error('Teil unbekannt: basis | profil | gitter | engpass | kalib');

fs.appendFileSync(path.join(HERE, 'bot_yield_131.txt'), out.join('\n') + '\n\n');
process.exit(0);
