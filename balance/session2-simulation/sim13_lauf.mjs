// 30-TAGE-FORTSCHRITTSSIMULATION - GERUEST (Abschnitt 1b)
//
// !!! MESSBUILD-WERTE, KEIN REPO-STAND. Laeuft ausschliesslich gegen einen mit               !!!
// !!! make_messbuild_sim13.mjs erzeugten Build. Es wird kein Spielcode veraendert.           !!!
//
// Aufruf:
//   node make_messbuild_kum.mjs   /tmp/mb_kum     --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_sim13.mjs /tmp/mb_kum  /tmp/sim13/dist
//   node sim13_lauf.mjs --build=/tmp/sim13/dist --profil=aktiv --tage=30
//
// ===================================================================================
// DIE VIER FALLEN, IN DER REIHENFOLGE, IN DER SIE HIER GREIFEN
// ===================================================================================
// 1) UHR KONSTANT INNERHALB EINES SCHRITTS. tick() benutzt Date.now zugleich als Spieluhr und als
//    Stoppuhr (t0..t6, SLOW_TICK_PHASE_MS). Eine bei jedem Aufruf fortlaufende Uhr laesst jede
//    Phase kuenstlich lange erscheinen und flutet das Protokoll mit Falsch-Warnungen. SIM_NOW wird
//    deshalb NUR zwischen den Schritten bewegt, nie waehrend eines Schritts.
// 2) DIE UHR MUSS VOR DEM ERSTEN import DER SPIELMODULE STEHEN. Deshalb dynamische Importe unten
//    statt statischer oben - ein statisches import wuerde vor dieser Zeile ausgefuehrt.
// 3) process.exit(0) AM ENDE. Sobald combatRunner geladen ist, haelt ein Worker-Thread den
//    Prozess offen; ohne exit haengt der Lauf nach der letzten Zeile Ausgabe.
// 4) DIE DATENBANK. db.js bildet ihren Pfad als __dirname/../data/game.db. Weil der Build unter
//    <lauf>/dist liegt, landet sie unter <lauf>/data und gehoert dem Lauf allein.
//
// ===================================================================================
// BOT-TAKT: 30 BOT-ZUEGE JE SIMULATIONSSCHRITT (Nutzerentscheidung 25.08.2026)
// ===================================================================================
// Umgesetzt als 30 UNTERSCHRITTE zu je 2 Minuten (= HEARTBEAT_INTERVAL_MS), nicht als 30 Aufrufe
// innerhalb desselben Zeitpunkts. Zwei Gruende, beide gemessen bzw. am Code abgelesen:
//   - runGlobalHeartbeat() prueft am Kopf `heartbeatStart - lastHeartbeatRun < 60_000`. Unter einer
//     schrittkonstanten Uhr liefern Aufrufe 2 bis 30 `skipped: true`. Man bekaeme EINEN Bot-Zug und
//     wuerde es nicht merken.
//   - 30 direkte runBotTurn()-Aufrufe ohne tick() dazwischen sind ebenfalls falsch: es laeuft keine
//     Warteschlange leer, MAX_BUILD_SLOTS bindet nach dem dritten Zug, der Rest sind No-ops.
// Der simulierte MENSCH handelt weiterhin einmal je Stunde (Profil "Aktiv") bzw. seltener. Sein
// tick() bekommt dabei das volle Stunden-Delta - runEconomyTick() rechnet ueber
// state.lastUpdate, ist also unabhaengig von der Aufrufhaeufigkeit.
//
// OFFEN UND IM PROTOKOLL AUSGEWIESEN: der Schiffs-Leerlauf (Kriterium 2/3) wird beim Menschen
// weiterhin nur stuendlich abgetastet und damit laut Abschnitt 1b systematisch unterschaetzt. Wer
// das schliessen will, laesst den Menschen mit --mensch_unterschritte mitlaufen; das kostet den
// 30-fachen Aufwand und ist deshalb nicht der Standard.
import { rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};
const flag = (n) => args.includes(`--${n}`);

const BUILD = resolve(opt('build', '/tmp/sim13/dist'));
const PROFIL = opt('profil', 'aktiv');            // aktiv | gelegenheit | abwesend
const TAGE = Number(opt('tage', 30));
const MENSCH_UNTERSCHRITTE = flag('mensch_unterschritte');
const BOT_ZUEGE = Number(opt('botzuege', 30));
const AUSGABE = opt('out', null);

if (!existsSync(resolve(BUILD, 'game/state.js'))) {
  throw new Error(`Kein Messbuild unter ${BUILD} (erst make_messbuild_sim13.mjs).`);
}
if (!['aktiv', 'gelegenheit', 'abwesend'].includes(PROFIL)) {
  throw new Error(`Unbekanntes Profil "${PROFIL}" - erlaubt: aktiv, gelegenheit, abwesend.`);
}

// --- Datenbank des Laufs plattmachen, BEVOR db.js importiert wird ---
const DATA = resolve(BUILD, '../data');
if (existsSync(DATA)) rmSync(DATA, { recursive: true });
mkdirSync(DATA, { recursive: true });

// ===================================================================================
// FALLE 1 UND 2: DIE UHR, VOR JEDEM SPIEL-IMPORT
// ===================================================================================
// Startdatum bewusst gesetzt: Montag, 05.01.2026, 00:00 Berliner Zeit. Ein 30-Tage-Fenster ab
// hier enthaelt den 25.10.2026 NICHT - an dem Tag faellt die Sommerzeit weg, die Berliner
// Wochen-Checkpoints (rollWeeklyCheckpoints/berlinWeekday) liegen auf 0:00 Berliner Zeit, und ein
// Lauf ueber diesen Tag haette eine 25-Stunden-Woche mit verschobener Raid-Planung.
const START = new Date('2026-01-05T00:00:00+01:00').getTime();
let SIM_NOW = START;
const ECHT = Date.now;
Date.now = () => SIM_NOW;

// Dynamische Importe - siehe Falle 2.
const M = (f) => import(`${BUILD}/game/${f}`);
const db = await import(`${BUILD}/db.js`);
const stateMod = await M('state.js');
const actions = await M('actions.js');
const combat = await M('combat.js');
const botMod = await M('bot.js');
const heartbeat = await M('heartbeat.js');
const missions = await M('missions.js');
const SHIPS = (await M('data/ships.js')).SHIPS;
const BUILDINGS = (await M('data/buildings.js')).BUILDINGS;
const RESEARCH = (await M('data/research.js')).RESEARCH;
const SEKTOREN = (await M('data/sectors.js')).SEKTOREN;
const SEKTOR_CONFIG = (await M('data/sectors.js')).SEKTOR_CONFIG;

const { loadPlayerState, savePlayerState, defaultPlayerState } = stateMod;

// ===================================================================================
// WERT-EINHEITEN
// ===================================================================================
// Dieselbe Gewichtung wie in allen bisherigen Messskripten (lib.mjs): Metall 1, Kristall 1,5,
// Deuterium 3. Wird hier bewusst NICHT neu hergeleitet - eine abweichende Gewichtung machte alle
// Vergleichszahlen der Sessions unbrauchbar.
const wert = (r) => (r?.metall || 0) + (r?.kristall || 0) * 1.5 + (r?.deuterium || 0) * 3;
const flottenWert = (fleet) =>
  Object.entries(fleet || {}).reduce((s, [id, n]) => {
    const sh = SHIPS.find((x) => x.id === id);
    return s + (sh ? wert(sh.cost) * (n || 0) : 0);
  }, 0);

// ===================================================================================
// NUTZER ANLEGEN
// ===================================================================================
const bcrypt = await import(`${BUILD}/../node_modules/bcryptjs/index.js`).catch(() => null);
const hash = bcrypt ? await bcrypt.default.hash('sim', 4) : 'x';
const mensch = db.createUser(`Sim_${PROFIL}`, hash, false);
await botMod.ensureBotUsers();
const alleNutzer = db.listAllUsers().map((u) => ({ id: u.id, username: u.username, isBot: u.isBot }));
const botIds = db.listBotUserIds();

// Startzustand ausdruecklich aus defaultPlayerState() - 50 Mio Metall / 25 Mio Kristall /
// 10 Mio Deuterium / 500 DM, rund 117,5 Mio Wert-Einheiten (Abschnitt 1b).
savePlayerState(defaultPlayerState(mensch.id));

// ===================================================================================
// SPIELERMODELL - AUSDRUECKLICH NICHT economyBotTurn.ts
// ===================================================================================
// Abschnitt 1b verbietet die Bot-Logik als Spielermodell: sie baut gleichverteilt ueber alle Typen
// und ist damit nachweislich nicht spielertypisch (Entscheidung 13.2). Das Modell hier ist bewusst
// schlicht und vollstaendig beschrieben, damit spaetere Laeufe reproduzierbar sind:
//   1. Bau-Lanes fuer GEBAEUDE bevorzugt mit Minen fuellen, guenstigste zuerst.
//   2. Forschungs-Lane immer besetzt halten, guenstigste offene Forschung zuerst.
//   3. Schiffs-Lanes: erst Mining-Flotte auf den Bedarf des groessten offenen Asteroidenfelds,
//      danach Begleitschutz.
//   4. Freie Flotte auf das staerkste Asteroidenfeld schicken, das die Flotte traegt.
// Das ist KEIN optimaler Spieler. Es ist ein nachvollziehbarer, und das ist fuer die
// Leerlauf-/Stau-Kennzahlen der Punkt: ein optimaler Spieler wuerde Kriterium 3 wegdefinieren.
function spielerZug(s) {
  let handelte = false;

  // (1) Gebaeude
  try {
    const offen = BUILDINGS.filter((b) => b.baseOutput)
      .map((b) => ({ b, lvl: s.buildings[b.id] || 0 }))
      .sort((x, y) => x.lvl - y.lvl);
    for (const { b } of offen) {
      try {
        actions.startBuildingConstruction(s, b.id);
        handelte = true;
      } catch { /* Slot voll oder Ressourcen fehlen - naechster Kandidat */ }
    }
  } catch { /* Gebaeude-Zweig nicht verfuegbar */ }

  // (2) Forschung
  try {
    const offen = RESEARCH.map((r) => ({ r, lvl: s.research[r.id] || 0 })).sort((x, y) => x.lvl - y.lvl);
    for (const { r } of offen) {
      try {
        actions.startResearch(s, r.id);
        handelte = true;
        break;
      } catch { /* nicht startbar */ }
    }
  } catch { /* ignorieren */ }

  // (3) Schiffe
  try {
    // Es gibt KEIN Feld "miningCapable" - die asteroidenfaehige Menge steht fest in
    // availableFleetForSektor() (missions.ts): mining, begleitschiff, sandronator. Die erste
    // Fassung filterte auf ein erfundenes Feld, traf null Schiffe und baute deshalb nie eine
    // Mining-Flotte. Messregel 16: Feldnamen am Code pruefen, nicht aus der Beschreibung nehmen.
    const MINING_IDS = ['mining', 'begleitschiff'];
    const mining = SHIPS.filter((sh) => MINING_IDS.includes(sh.id));
    const kampf = SHIPS.filter((sh) => !sh.specialOnly && !sh.unique && !MINING_IDS.includes(sh.id))
      .sort((a, b) => wert(a.cost) - wert(b.cost));
    const kandidaten = [...mining, ...kampf.slice(0, 3)];
    for (const sh of kandidaten) {
      try {
        actions.startBuild(s, sh.id, 25);
        handelte = true;
      } catch { /* Slot voll oder zu teuer */ }
    }
  } catch { /* ignorieren */ }

  // (4) Freie Flotte auf das ertragreichste Asteroidenfeld schicken, dessen npcFloor die eigene
  // Macht traegt. Ohne diesen Schritt gibt es ueberhaupt KEINE Einnahme ausser den Minen - die
  // erste Fassung des Geruests hatte ihn nur beschrieben, nicht gebaut, und lief deshalb ab Tag 3
  // in einen Dauerzustand aus 100 % Leerlauf bei stehender Flottenmacht. Der Rauchtest hat das
  // sichtbar gemacht; die Zahlen jenes Laufs sind wertlos.
  try {
    const macht = combat.combatFleetPowerBase(s.fleet || {});
    const felder = ['asteroid_hoch', 'asteroid_mittel', 'asteroid_niedrig']
      .filter((id) => (SEKTOR_CONFIG[id]?.npcFloor || 0) <= macht);
    const ziel = felder[0] || 'asteroid_niedrig';
    const laeuftSchon = (s.missions || []).some((m) => !m.finalized);
    if (!laeuftSchon) {
      const erlaubt = missions.availableFleetForSektor(ziel);
      const auswahl = {};
      erlaubt.forEach((id) => {
        if ((s.fleet[id] || 0) > 0) auswahl[id] = s.fleet[id];
      });
      if (Object.keys(auswahl).length > 0) {
        missions.sendFleet(s, ziel, auswahl);
        handelte = true;
      }
    }
  } catch { /* Sektor nicht versandfaehig */ }

  return handelte;
}

// ===================================================================================
// KENNZAHLEN
// ===================================================================================
const tage = [];
let tagJetzt = null;
function neuerTag(nr) {
  tagJetzt = {
    tag: nr,
    proben: 0,
    leerGebaeude: 0,
    leerForschung: 0,
    leerSchiffe: 0,
    stau: 0,
    wertStart: null,
    wertEnde: null,
    flottenmacht: 0,
    verluste: [],
    freischaltungen: [],
  };
  tage.push(tagJetzt);
}

// Leerlauf ist SLOTBASIERT, nicht "Warteschlange leer". Bei 3 Schiffs-Slots ist ein einzelner
// laufender Auftrag zwei Drittel Leerlauf - "Warteschlange nicht leer" haette das als 0 % gezaehlt
// und Kriterium 2 damit wegdefiniert. Erste Fassung des Geruests hatte genau diesen Fehler; er
// fiel im Rauchtest durch 0/0/0 % Leerlauf bei gleichzeitig 100 % Stau auf.
const SLOTS = { gebaeude: 1, forschung: 4, schiffe: 3 + 3 };
function probe(s) {
  tagJetzt.proben++;
  const belegtG = (s.buildingQueue || []).length;
  const belegtF = (s.researchQueue || []).length;
  const belegtS = (s.buildQueue || []).length + (s.defenseQueue || []).length;
  tagJetzt.leerGebaeude += Math.max(0, SLOTS.gebaeude - belegtG) / SLOTS.gebaeude;
  tagJetzt.leerForschung += Math.max(0, SLOTS.forschung - belegtF) / SLOTS.forschung;
  tagJetzt.leerSchiffe += Math.max(0, SLOTS.schiffe - belegtS) / SLOTS.schiffe;
  // Ressourcenstau: Ressourcen fuer das guenstigste Schiff da, aber ALLE Slots belegt.
  const guenstigstes = Math.min(...SHIPS.filter((x) => !x.specialOnly && !x.unique).map((x) => wert(x.cost)));
  const allesBelegt = belegtG >= SLOTS.gebaeude && belegtF >= SLOTS.forschung && belegtS >= SLOTS.schiffe;
  if (wert(s.resources) >= guenstigstes && allesBelegt) tagJetzt.stau++;
}

// SETZUNG, NICHT GEMESSEN, und ausdruecklich zur Bestaetigung vorgelegt: SEKTOREN enthaelt KEINE
// Freischaltbedingung - es gibt im Code kein minPower und keine Sperre. "Erstmals spielbar" ist
// eine Spielurteilsfrage. Das Geruest liest sie als "eigene Flottenmacht erreicht den npcFloor des
// Sektors", also den Punkt, ab dem der Sektor seine Mindest-Gegnerstaerke stellt. Die erste
// Fassung hatte hier ein nicht existentes Feld abgefragt und deshalb am Tag 0 alle acht Sektoren
// als freigeschaltet gemeldet.

const freigeschaltet = new Set();
function pruefeFreischaltung(s) {
  const macht = combat.combatFleetPowerBase(s.fleet || {});
  for (const sek of SEKTOREN) {
    if (freigeschaltet.has(sek.id)) continue;
    const cfg = SEKTOR_CONFIG[sek.id];
    if (!cfg) continue;
    if (cfg.npcFloor > 0 && macht >= cfg.npcFloor) {
      freigeschaltet.add(sek.id);
      tagJetzt.freischaltungen.push(sek.id);
    }
  }
}

// ===================================================================================
// TREIBER
// ===================================================================================
const STUNDE = 3_600_000;
const UNTER = Math.max(1, BOT_ZUEGE);
const UNTER_MS = STUNDE / UNTER;

const handeltInStunde = (h) => {
  const tagNr = Math.floor(h / 24);
  if (PROFIL === 'aktiv') return true;
  if (PROFIL === 'gelegenheit') return h % 12 === 0;
  // abwesend: Tag 0 aktiv, Tag 1 bis 14 gar nicht, danach einmal taeglich
  if (tagNr === 0) return h % 12 === 0;
  if (tagNr <= 14) return false;
  return h % 24 === 0;
};

const t0 = ECHT();
let letzteFlottenmacht = 0;

for (let h = 0; h < TAGE * 24; h++) {
  const tagNr = Math.floor(h / 24);
  if (!tagJetzt || tagJetzt.tag !== tagNr) {
    neuerTag(tagNr);
    tagJetzt.wertStart = wert(loadPlayerState(mensch.id).resources);
  }

  // --- Unterschritte: Bot-Takt ---
  for (let u = 0; u < UNTER; u++) {
    SIM_NOW = START + h * STUNDE + u * UNTER_MS;   // Uhr NUR hier bewegen (Falle 1)
    for (const bid of botIds) {
      const bs = loadPlayerState(bid);
      await actions.runEconomyTick(bs);
      await botMod.runBotTurn(bs, alleNutzer);
      savePlayerState(bs);
    }
    if (MENSCH_UNTERSCHRITTE) {
      const s = loadPlayerState(mensch.id);
      await actions.runEconomyTick(s);
      probe(s);
      savePlayerState(s);
    }
  }

  // --- Stundenschritt des Menschen ---
  SIM_NOW = START + (h + 1) * STUNDE;
  const s = loadPlayerState(mensch.id);
  const machtVor = combat.combatFleetPowerBase(s.fleet || {});
  await actions.runEconomyTick(s);
  if (handeltInStunde(h)) spielerZug(s);
  if (!MENSCH_UNTERSCHRITTE) probe(s);
  const machtNach = combat.combatFleetPowerBase(s.fleet || {});
  if (machtVor > 0 && machtNach < machtVor) {
    const anteil = (machtVor - machtNach) / machtVor;
    if (anteil > 0.05) tagJetzt.verluste.push({ stunde: h, anteil });
  }
  tagJetzt.flottenmacht = machtNach;
  tagJetzt.wertEnde = wert(s.resources);
  pruefeFreischaltung(s);
  savePlayerState(s);

  if (h % 24 === 23) {
    const t = tagJetzt;
    console.log(
      `Tag ${String(t.tag).padStart(2)} | Wert ${(t.wertEnde / 1e9).toFixed(2)} Mrd | ` +
      `Macht ${(t.flottenmacht / 1e9).toFixed(2)} Mrd | ` +
      `Leerlauf G/F/S ${(100 * t.leerGebaeude / t.proben).toFixed(0)}/${(100 * t.leerForschung / t.proben).toFixed(0)}/${(100 * t.leerSchiffe / t.proben).toFixed(0)} % | ` +
      `Stau ${(100 * t.stau / t.proben).toFixed(0)} % | ` +
      `Verluste ${t.verluste.length}` +
      (t.freischaltungen.length ? ` | NEU: ${t.freischaltungen.join(', ')}` : '')
    );
  }
}

// ===================================================================================
// ABNAHMEKRITERIEN (Abschnitt 1b)
// ===================================================================================
const p = (n, d) => (d > 0 ? (100 * n) / d : 0);
const gesamt = tage.reduce(
  (a, t) => ({
    proben: a.proben + t.proben,
    leerG: a.leerG + t.leerGebaeude,
    leerF: a.leerF + t.leerForschung,
    leerS: a.leerS + t.leerSchiffe,
    stau: a.stau + t.stau,
  }),
  { proben: 0, leerG: 0, leerF: 0, leerS: 0, stau: 0 }
);
const groessterVerlust = Math.max(0, ...tage.flatMap((t) => t.verluste.map((v) => v.anteil)));
const wochenOhneInhalt = [0, 1, 2, 3].filter(
  (w) => !tage.slice(w * 7, w * 7 + 7).some((t) => t.freischaltungen.length > 0)
);

console.log('\n============================================================');
console.log(`ABNAHMEKRITERIEN - Profil "${PROFIL}", ${TAGE} Tage, MESSBUILD-WERTE`);
console.log('============================================================');
console.log(`K1 kein Totalverlust (<70 %)   : groesster Einzelverlust ${(100 * groessterVerlust).toFixed(1)} %`);
console.log(`K2 Leerlauf (Gebaeude)         : ${p(gesamt.leerG, gesamt.proben).toFixed(1)} %`);
console.log(`K2 Leerlauf (Forschung)        : ${p(gesamt.leerF, gesamt.proben).toFixed(1)} %`);
console.log(`K2 Leerlauf (Schiffe+Vert.)    : ${p(gesamt.leerS, gesamt.proben).toFixed(1)} %` +
  (MENSCH_UNTERSCHRITTE ? '' : '   <- stuendlich abgetastet, laut Abschnitt 1b UNTERSCHAETZT'));
console.log(`K3 Ressourcenstau (<25 %)      : ${p(gesamt.stau, gesamt.proben).toFixed(1)} %`);
console.log(`K4 Wochen ohne neuen Inhalt    : ${wochenOhneInhalt.length ? wochenOhneInhalt.map((w) => w + 1).join(', ') : 'keine'}`);
console.log(`K5 Quellenanteil Woche 1       : NICHT ERHOBEN - braucht Quellen-Instrumentierung, siehe Protokoll`);
console.log(`K6 Plateau > 5 Tage            : NICHT BEWERTET - braucht die Einnahmenkurve aus K5`);
console.log(`\nLaufzeit: ${((ECHT() - t0) / 1000).toFixed(1)} s echte Zeit fuer ${TAGE * 24} Stunden x ${UNTER} Unterschritte`);

if (AUSGABE) {
  writeFileSync(AUSGABE, JSON.stringify({ profil: PROFIL, tage, gesamt }, null, 2));
  console.log(`Rohdaten: ${AUSGABE}`);
}

// FALLE 3: ohne das haengt der Lauf, sobald combatRunner einen Worker gestartet hat.
process.exit(0);
