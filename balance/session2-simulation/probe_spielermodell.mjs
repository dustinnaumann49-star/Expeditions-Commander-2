// !!! MESSBUILD-SKRIPT - ALLE AUSGABEN SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//
// ===================================================================================
// DIAGNOSE: WARUM BLEIBT DAS SPIELERMODELL AB TAG 3 STEHEN?
// ===================================================================================
// sim13_geruest.txt Abschnitt 7 haelt fest, dass der Lauf ab Tag 3 in ein ausgehungertes
// Gleichgewicht faellt (100 % Leerlauf, stehende Flottenmacht). Reproduziert am 26.08.2026:
//   Tag 2: Leerlauf G/F/S 0/75/50 %   Tag 4: 100/100/100 %, Wert 0,04 Mrd, Macht 0,02 Mrd
//
// Dieses Skript beantwortet NICHT, ob das Modell gut ist, sondern nur: WAS sagt das Spiel,
// wenn das Modell handeln will? Grund fuer ein eigenes Werkzeug statt einer Aenderung an
// sim13_lauf.mjs: dessen `try { ... } catch {}`-Bloecke koennen die Antwort gar nicht sehen -
// startBuild()/startResearch()/startBuildingConstruction() WERFEN NICHT, sie liefern
// `{ ok:false, error }` zurueck. Ein catch faengt hier nie etwas. Das Modell haelt deshalb
// jeden Fehlschlag faelschlich fuer einen Erfolg (`handelte = true`) und laeuft blind weiter.
//
//   MESSBUILD=/tmp/sim13/dist node probe_spielermodell.mjs [tage]
//
// Fallen wie in sim13_lauf.mjs: Uhr schrittkonstant und VOR den Importen, eigene Datenbank
// unter <lauf>/data, process.exit(0) am Ende.
import { rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BUILD = resolve(process.env.MESSBUILD || '/tmp/sim13/dist');
const TAGE = Number(process.argv[2] || 5);

const DATA = resolve(BUILD, '../data');
rmSync(DATA, { recursive: true, force: true });
mkdirSync(DATA, { recursive: true });

const START = new Date('2026-01-05T00:00:00+01:00').getTime();
let SIM_NOW = START;
const ECHT = Date.now;
Date.now = () => SIM_NOW;

const M = (f) => import(`${BUILD}/game/${f}`);
const db = await import(`${BUILD}/db.js`);
const stateMod = await M('state.js');
const actions = await M('actions.js');
const combat = await M('combat.js');
const botMod = await M('bot.js');
const missions = await M('missions.js');
const SHIPS = (await M('data/ships.js')).SHIPS;
const BUILDINGS = (await M('data/buildings.js')).BUILDINGS;
const RESEARCH = (await M('data/research.js')).RESEARCH;
const SEKTOR_CONFIG = (await M('data/sectors.js')).SEKTOR_CONFIG;
const { loadPlayerState, savePlayerState, defaultPlayerState } = stateMod;

const wert = (r) => (r?.metall || 0) + (r?.kristall || 0) * 1.5 + (r?.deuterium || 0) * 3;
const mrd = (x) => `${(x / 1e9).toFixed(3)} Mrd`;

const bcrypt = await import(`${BUILD}/../node_modules/bcryptjs/index.js`).catch(() => null);
const hash = bcrypt ? await bcrypt.default.hash('sim', 4) : 'x';
const mensch = db.createUser('Sim_diag', hash, false);
await botMod.ensureBotUsers();
const alleNutzer = db.listAllUsers().map((u) => ({ id: u.id, username: u.username, isBot: u.isBot }));
const botIds = db.listBotUserIds();
savePlayerState(defaultPlayerState(mensch.id));

// ===================================================================================
// DASSELBE MODELL WIE IN sim13_lauf.mjs - NUR MIT PROTOKOLL STATT try/catch
// ===================================================================================
const MINING_IDS = ['mining', 'begleitschiff'];
const gruende = new Map();          // Grundtext -> Anzahl
const merke = (zweig, text) => {
  const k = `${zweig}: ${text}`;
  gruende.set(k, (gruende.get(k) || 0) + 1);
};

function spielerZugProtokolliert(s) {
  let echteErfolge = 0;

  const gebaeude = BUILDINGS.filter((b) => b.baseOutput)
    .map((b) => ({ b, lvl: s.buildings[b.id] || 0 }))
    .sort((x, y) => x.lvl - y.lvl);
  for (const { b } of gebaeude) {
    const r = actions.startBuildingConstruction(s, b.id);
    if (r && r.ok === false) merke('GEBAEUDE', r.error);
    else echteErfolge++;
  }

  const forschung = RESEARCH.map((r) => ({ r, lvl: s.research[r.id] || 0 })).sort((x, y) => x.lvl - y.lvl);
  for (const { r } of forschung) {
    const res = actions.startResearch(s, r.id);
    if (res && res.ok === false) merke('FORSCHUNG', res.error);
    else { echteErfolge++; break; }
  }

  const mining = SHIPS.filter((sh) => MINING_IDS.includes(sh.id));
  const kampf = SHIPS.filter((sh) => !sh.specialOnly && !sh.unique && !MINING_IDS.includes(sh.id))
    .sort((a, b) => wert(a.cost) - wert(b.cost));
  for (const sh of [...mining, ...kampf.slice(0, 3)]) {
    const r = actions.startBuild(s, sh.id, 25);
    if (r && r.ok === false) merke('SCHIFFE', r.error);
    else echteErfolge++;
  }

  const macht = combat.combatFleetPowerBase(s.fleet || {});
  const felder = ['asteroid_hoch', 'asteroid_mittel', 'asteroid_niedrig']
    .filter((id) => (SEKTOR_CONFIG[id]?.npcFloor || 0) <= macht);
  const ziel = felder[0] || 'asteroid_niedrig';
  const laeuftSchon = (s.missions || []).some((m) => !m.finalized);
  if (laeuftSchon) merke('MISSION', 'laeuft bereits eine unabgeschlossene Mission');
  else {
    const erlaubt = missions.availableFleetForSektor(ziel);
    const auswahl = {};
    erlaubt.forEach((id) => { if ((s.fleet[id] || 0) > 0) auswahl[id] = s.fleet[id]; });
    if (Object.keys(auswahl).length === 0) merke('MISSION', `keine asteroidenfaehigen Schiffe im Bestand (${ziel})`);
    else {
      const r = missions.sendFleet(s, ziel, auswahl);
      if (r && r.ok === false) merke('MISSION', r.error);
      else echteErfolge++;
    }
  }
  return echteErfolge;
}

// ===================================================================================
// LAUF
// ===================================================================================
console.log('='.repeat(78));
console.log('DIAGNOSE SPIELERMODELL (MESSBUILD-WERTE)');
console.log('='.repeat(78));
console.log(`Build: ${BUILD}   Tage: ${TAGE}   Profil: aktiv (handelt jede Stunde)`);
console.log('');

const STUNDE = 3_600_000;
const UNTER = 30;
const UNTER_MS = STUNDE / UNTER;
let letzterTag = -1;

for (let h = 0; h < TAGE * 24; h++) {
  for (let u = 0; u < UNTER; u++) {
    SIM_NOW = START + h * STUNDE + u * UNTER_MS;
    for (const bid of botIds) {
      const bs = loadPlayerState(bid);
      await actions.runEconomyTick(bs);
      await botMod.runBotTurn(bs, alleNutzer);
      savePlayerState(bs);
    }
  }
  SIM_NOW = START + (h + 1) * STUNDE;
  const s = loadPlayerState(mensch.id);
  await actions.runEconomyTick(s);
  const erfolge = spielerZugProtokolliert(s);
  savePlayerState(s);

  const tagNr = Math.floor(h / 24);
  if (tagNr !== letzterTag) {
    letzterTag = tagNr;
    const flotte = Object.entries(s.fleet || {}).filter(([, n]) => n > 0);
    const unterwegs = (s.missions || []).filter((m) => !m.finalized).length;
    console.log(
      `Tag ${String(tagNr).padStart(2)} | Wert ${mrd(wert(s.resources))} | ` +
      `Macht ${mrd(combat.combatFleetPowerBase(s.fleet || {}))} | ` +
      `Schlangen G/F/S ${(s.buildingQueue || []).length}/${(s.researchQueue || []).length}/${(s.buildQueue || []).length} | ` +
      `Flotte ${flotte.length} Typen | Missionen offen ${unterwegs} | Erfolge/h ${erfolge}`
    );
    if (flotte.length) console.log(`        Bestand: ${flotte.map(([id, n]) => `${id} ${n}`).join(', ')}`);
  }
}

console.log('');
console.log('-'.repeat(78));
console.log('ABLEHNUNGSGRUENDE, HAEUFIGSTE ZUERST');
console.log('-'.repeat(78));
[...gruende.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  .forEach(([k, n]) => console.log(`${String(n).padStart(6)} x  ${k}`));

const s = loadPlayerState(mensch.id);
console.log('');
console.log('-'.repeat(78));
console.log('ENDZUSTAND');
console.log('-'.repeat(78));
console.log(`Ressourcen : ${JSON.stringify(s.resources)}`);
console.log(`Gebaeude   : ${JSON.stringify(s.buildings)}`);
console.log(`Forschung  : ${Object.entries(s.research || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(', ') || '(alles 0)'}`);
console.log(`Flotte     : ${JSON.stringify(s.fleet)}`);
console.log(`Missionen  : ${(s.missions || []).length} gesamt, ${(s.missions || []).filter((m) => !m.finalized).length} offen`);

process.exit(0);
