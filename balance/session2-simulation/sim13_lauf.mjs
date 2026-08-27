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
const SAMMLE_GRUENDE = flag('gruende');
// TREIBER DES MENSCHEN. 'economy' ist der bisherige Stand und bleibt Standard.
// 'tick' ist die Antwort auf einen Befund vom 26.08.2026 (fuenfte Session): runEconomyTick()
// ruft weder processRaidTimer() noch die Cross-User-Sweeps auf - im Lauf gab es deshalb ueber
// 30 Tage KEINEN einzigen Raid, obwohl der Raid gemessen 58-64 % der Woche-1-Einnahmen stellt
// und Abnahmekriterium 5 seit dem 20.08.2026 an ihm haengt. Am Code nachgezaehlt: processRaidTimer
// hat im Build genau zwei Aufrufer, actions.js (in tick()) und heartbeat.js.
// EINGETRAGEN ALS UMKEHRBARE SETZUNG, Standard bewusst unveraendert, damit die Wirkung der
// Umstellung getrennt sichtbar bleibt statt sich mit der Instrumentierung zu vermischen.
const TREIBER = opt('treiber', 'economy');
if (!['economy', 'tick'].includes(TREIBER)) {
  throw new Error(`Unbekannter Treiber "${TREIBER}" - erlaubt: economy, tick.`);
}

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

// ===================================================================================
// K5/K6: EINNAHMEN NACH QUELLE (Punkt 3 aus sim13_geruest.txt Abschnitt 8)
// ===================================================================================
// Die Spielfunktionen buchen direkt auf state.resources, ohne Herkunft - deshalb war K5 bisher
// "NICHT ERHOBEN". Der Haken hier wird von den Patches aus make_messbuild_k5.mjs gerufen; ohne
// ihn ist der instrumentierte Build verhaltensgleich zum uninstrumentierten.
//
// CONTAINER WERDEN BEIM FUND BEWERTET, NICHT BEIM OEFFNEN. Zwei Gruende: der Raid zahlt
// AUSSCHLIESSLICH in Containern (addContainers schreibt nach state.inventory, nicht nach
// state.resources) und waere sonst in K5 unsichtbar; und die Woche-1-Zusammensetzung vom
// 20.08.2026 (46,0 Mrd: Raid 26,5 / Asteroiden 18,1 / Solo 1,2) ist mit genau diesen
// Erwartungswerten gerechnet - eine eigene Bewertung machte den Vergleich wertlos.
// Herkunft: raid_yield.txt, Setzung 1 Spezialteil = 325.000 Wert-Einheiten, Zeitgutscheine 0.
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const TEIL_WERT = 325_000;

let MENSCH_ID = null;
// Quelle -> { wert, dm, stueck } je Tag; daneben die neutralen Zeilen (siehe unten).
const QUELLEN_TAG = () => ({ ein: new Map(), neutral: new Map(), dm: new Map() });
let quellenJetzt = QUELLEN_TAG();
const quellenTage = [];
const addMap = (m, k, v) => m.set(k, (m.get(k) || 0) + v);

// Gegenprobe: unabhaengig vom Hauptbuch gemessener BRUTTOZUWACHS auf state.resources. Ohne sie
// normiert K5 auf die Summe dessen, was zufaellig instrumentiert wurde, und eine uebersehene
// Buchungsstelle sieht aus wie ein sauberes Ergebnis - dieselbe Luecke, die bei der
// Verdrahtungsprobe erst die Gegenprobe gegen den unverdrahteten Build geschlossen hat.
let bruttoRes = 0;   // Wert-Einheiten, nur positive Aenderungen
let bruttoDm = 0;
let buchRes = 0;     // Summe aller Ressourcen-Zeilen des Hauptbuchs, dieselbe Gewichtung
let buchDm = 0;

globalThis.__K5 = (quelle, art, state, betrag) => {
  if (!state || state.userId !== MENSCH_ID) return;
  if (art === 'res' || art === 'res_neutral') {
    const w = (betrag.metall || 0) + (betrag.kristall || 0) * 1.5 + (betrag.deuterium || 0) * 3;
    buchRes += w;
    addMap(art === 'res' ? quellenJetzt.ein : quellenJetzt.neutral, quelle, w);
    return;
  }
  if (art === 'container') {
    const ev = CONTAINER_EV[betrag.tier] || 0;
    addMap(quellenJetzt.ein, quelle, ev * (betrag.count || 0));
    addMap(quellenJetzt.neutral, `__stueck_${quelle}`, betrag.count || 0);
    return;
  }
  if (art === 'teile') {
    const n = (betrag.waffen || 0) + (betrag.schild || 0) + (betrag.panzerung || 0);
    addMap(quellenJetzt.ein, quelle, n * TEIL_WERT);
    return;
  }
  if (art === 'dm' || art === 'dm_neutral') {
    buchDm += betrag.dm || 0;
    if (art === 'dm') addMap(quellenJetzt.dm, quelle, betrag.dm || 0);
  }
};

// Legt Accessoren ueber state.resources und summiert jeden positiven Zuwachs. Erfasst AUCH die
// indizierten Zugriffe (economyActions.js/stations.js schreiben state.resources[key]).
// JSON.stringify in savePlayerState() serialisiert aufzaehlbare Getter unveraendert.
function umhuellen(s) {
  const roh = { ...s.resources };
  const felder = ['metall', 'kristall', 'deuterium', 'dm'];
  const gewicht = { metall: 1, kristall: 1.5, deuterium: 3 };
  const ziel = {};
  felder.forEach((f) => {
    Object.defineProperty(ziel, f, {
      enumerable: true,
      configurable: true,
      get: () => roh[f],
      set: (v) => {
        const d = v - (roh[f] || 0);
        if (d > 0) {
          if (f === 'dm') bruttoDm += d;
          else bruttoRes += d * gewicht[f];
        }
        roh[f] = v;
      },
    });
  });
  s.resources = ziel;
  return s;
}

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
MENSCH_ID = mensch.id;   // ab hier bucht das K5-Hauptbuch (nur der Mensch, nicht die Bots)
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
// und ist damit nachweislich nicht spielertypisch (Entscheidung 13.2).
//
// UEBERARBEITET AM 26.08.2026 (vierte Session) NACH DIAGNOSE MIT probe_spielermodell.mjs.
// Die erste Fassung lief ab Tag 3 in ein ausgehungertes Gleichgewicht. Ursache waren FUENF
// Defekte, alle gemessen, nicht vermutet - Protokoll: spielermodell_diagnose.txt.
//   (a) DIE AKTIONEN WERFEN NICHT. startBuild()/startResearch()/startBuildingConstruction()/
//       sendFleet() liefern `{ ok:false, error }` zurueck. Die alten `try { } catch { }`-Bloecke
//       konnten deshalb nie etwas fangen, und `handelte = true` wurde auch bei jedem Fehlschlag
//       gesetzt. Das Modell war blind fuer seine eigenen Ablehnungen. Jetzt wird der
//       Rueckgabewert ausgewertet.
//   (b) MINENERTRAG WAR EXAKT NULL. mineOutputPerHour() multipliziert mit energyFactor() =
//       min(1, produziert/verbraucht). Der alte Gebaeudezweig filterte `b.baseOutput`, und
//       solarkraftwerk/roboterfabrik/nanitenfabrik haben baseOutput = null - das Modell konnte
//       ein Kraftwerk konstruktionsbedingt gar nicht bauen. Neun Minenstufen foerderten nichts.
//   (c) AB 180 MINING-SCHIFFEN KEIN MISSIONSVERSAND MEHR. sendFleet() prueft cfg.miningCap
//       (300/220/180 je Feld) und cfg.escortCap (500); das Modell bot die GESAMTE Flotte an und
//       wurde ab Tag 2 jede Stunde abgelehnt. Damit war auch die zweite Einnahmequelle tot.
//   (d) 1400 SPIONAGESONDEN. `kampf.slice(0,3)` nach Kosten sortiert waehlte die billigsten
//       Schiffe - Spionagesonden tragen 0 zur Flottenmacht bei, sind nicht asteroidenfaehig und
//       kosten 8.000 Kristall je Stueck. Gemessen 11,2 Mio Kristall verbrannt, Endbestand 4.520.
//   (e) 720 FEHLVERSUCHE an gesperrten V2/V3-Stufen je Lauf, folgenlos aber blind.
//
// ZWEI SETZUNGEN, vom Nutzer am 26.08.2026 bestaetigt:
//   1. ENERGIE HAT VORRANG. Faellt energyFactor unter 1, geht die eine Gebaeude-Lane zuerst an
//      das Solarkraftwerk. Bewusst am IST-Zustand des Faktors festgemacht statt an einer festen
//      Kopplung ("Solar auf Hoehe der hoechsten Mine") - letztere waere je nach Kostenkurve
//      ueber- oder unterbauend und willkuerlicher.
//   2. STAERKSTES TRAGBARES FELD, AUF DEN CAP GEDECKELT. Ertrag je Stunde: Hoch 180x25.000 =
//      4,5 Mio, Mittel 220x15.000 = 3,3 Mio, Niedrig 300x5.000 = 1,5 Mio. Also weiter das
//      staerkste Feld, aber die Auswahl beschneiden statt die ganze Flotte anzubieten.
//
// AUSDRUECKLICH VERWORFEN: den Schiffsbau zu stoppen, sobald der Cap gedeckt ist. Ein Modell,
// das aus Zufriedenheit aufhoert zu bauen, erzeugt leere Slots - und Leerlauf IST Kriterium K2.
// Wir wuerden dann die Abbruchregel des Modells messen statt das Spiel. Deshalb hat das Modell
// immer etwas zu bauen: Mining bis zum Cap, Begleitschutz bis zum Cap, danach echte
// Kampfschiffe (die treiben die Flottenmacht und damit die Freischaltungen fuer K4). Leerlauf
// entsteht so nur noch aus fehlenden Ressourcen - genau das soll K2 abbilden.
//
// Das ist KEIN optimaler Spieler. Es ist ein nachvollziehbarer, und das ist fuer die
// Leerlauf-/Stau-Kennzahlen der Punkt: ein optimaler Spieler wuerde Kriterium 3 wegdefinieren.
const MINE_KINDS_SIM = ['mine_metall', 'mine_kristall', 'mine_deuterium'];
const TIER1 = BUILDINGS.filter((b) => (b.tier ?? 1) === 1);
const SOLAR = TIER1.find((b) => b.kind === 'energie');
// Kampfschiffe = alles mit Waffen. Schliesst Spionagesonde (Defekt d) und die reinen
// Mining-Schiffe aus, ohne eine Namensliste pflegen zu muessen.
// MESSREGEL 16, ZUM ZWEITEN MAL IN DIESER DATEI ZUGESCHNAPPT: es gibt KEIN Feld `sh.waffen`.
// Die Kampfwerte stehen unter `sh.stats` (waffen/schild/panzerung) - `sh.waffen` ist ueberall
// undefined, die Liste war damit LEER und das Modell baute null Kampfschiffe. Aufgefallen ist
// es nur daran, dass die Flottenmacht ueber sieben Tage exakt 0,00 Mrd blieb. Erst am Code
// nachsehen, dann filtern.
// NUTZERENTSCHEIDUNG 26.08.2026, GEMESSEN STATT GESCHAETZT: `begleitschiff` traegt
// stats.waffen = 350 und landete dadurch zusaetzlich in dieser Liste - das Modell baute 3420
// Stueck gegen einen escortCap von 500. Kosten je Machtpunkt (combatFleetPowerBase, 1 Stueck):
//   schlachtschiff 1,10 | leicht 1,11 | kreuzer/bomber/reaper 1,15 | schwer 1,18
//   BEGLEITSCHIFF 3,37  <- dreimal ineffizienter als jedes echte Kampfschiff
// Es hat genau eine sinnvolle Rolle, die Eskorte bis escortCap; alles darueber ist Verschwendung
// und nicht spielertypisch. Wird deshalb hier ausgeschlossen und ausschliesslich ueber den
// escortCap-Zweig gebaut.
// VORBEHALT: combatFleetPowerBase() kennt keine Sonderfaehigkeiten. Die Salven-Schiffe stehen
// mit 5,6 bis 7,3 nur deshalb schlecht da - fuer die fruehe Phase ohne Belang, bei spaeteren
// Laeufen zu beachten.
const KAMPFSCHIFFE = SHIPS.filter(
  (sh) => !sh.specialOnly && !sh.unique && sh.id !== 'begleitschiff' && (sh.stats?.waffen || 0) > 0
).sort((a, b) => wert(a.cost) - wert(b.cost));

// Staerkstes Asteroidenfeld, dessen npcFloor die eigene Macht traegt.
function zielFeld(s) {
  const macht = combat.combatFleetPowerBase(s.fleet || {});
  const felder = ['asteroid_hoch', 'asteroid_mittel', 'asteroid_niedrig']
    .filter((id) => (SEKTOR_CONFIG[id]?.npcFloor || 0) <= macht);
  return felder[0] || 'asteroid_niedrig';
}

// Optional (--gruende): sammelt, WARUM eine Aktion abgelehnt wurde. Ohne das ist ein
// Leerlaufwert nicht deutbar - eine leere Lane kann "kein Geld", "gesperrt" oder "Slot voll"
// heissen, und die drei fuehren zu voellig verschiedenen Schluessen. Bewusst hier statt in
// einem zweiten Skript: ein dupliziertes Spielermodell liefe frueher oder spaeter auseinander.
const GRUENDE = new Map();
const merkeGrund = (zweig, text) => {
  if (!SAMMLE_GRUENDE) return;
  const k = `${zweig}: ${text}`;
  GRUENDE.set(k, (GRUENDE.get(k) || 0) + 1);
};

// K3b (Nutzerentscheidung 26.08.2026): haelt fest, ob eine Lane in diesem Zug an FEHLENDEN
// RESSOURCEN gescheitert ist. probe() liest das direkt danach aus. Siehe Kasten bei K3b unten.
const ressourcenAblehnung = { GEBAEUDE: false, FORSCHUNG: false, SCHIFFE: false };

function spielerZug(s) {
  let erfolge = 0;
  ressourcenAblehnung.GEBAEUDE = false;
  ressourcenAblehnung.FORSCHUNG = false;
  ressourcenAblehnung.SCHIFFE = false;
  const gelang = (r, zweig) => {
    if (r && r.ok === false) {
      merkeGrund(zweig, r.error);
      if (/Nicht genug Ressourcen/i.test(r.error || '')) ressourcenAblehnung[zweig] = true;
      return false;
    }
    return true;
  };

  // (1) GEBAEUDE - eine einzige Lane, deshalb nach dem ersten Erfolg abbrechen.
  //     Energie zuerst, sonst foerdern die Minen nichts (Defekt b). Danach alle Stufe-1-Bauten
  //     nach Stufe aufsteigend - das zieht die Roboterfabrik (Bauzeit) automatisch mit hoch,
  //     ohne dass dafuer eine eigene Schwelle erfunden werden muesste.
  const reihe = [];
  if (SOLAR && actions.energyFactor(s, 1) < 1) reihe.push(SOLAR);
  reihe.push(...TIER1.slice().sort((x, y) => (s.buildings[x.id] || 0) - (s.buildings[y.id] || 0)));
  for (const b of reihe) {
    if (gelang(actions.startBuildingConstruction(s, b.id), 'GEBAEUDE')) { erfolge++; break; }
  }

  // (2) FORSCHUNG - Lane offen halten, guenstigste offene zuerst.
  const forschung = RESEARCH.map((r) => ({ r, lvl: s.research[r.id] || 0 }))
    .sort((x, y) => x.lvl - y.lvl);
  for (const { r } of forschung) {
    if (gelang(actions.startResearch(s, r.id), 'FORSCHUNG')) { erfolge++; break; }
  }

  // (3) SCHIFFE - Reihenfolge: Mining bis zum Cap, Begleitschutz bis zum Cap, dann Kampfschiffe.
  //     Gezaehlt wird der Bestand OHNE die Warteschlange; bei 25 Stueck je Auftrag ueberschiesst
  //     das den Cap um hoechstens einen Auftrag. Bewusst in Kauf genommen - eine exakte
  //     Verrechnung mit buildQueue haette den Cap zur harten Grenze gemacht und damit wieder
  //     leere Slots erzeugt (siehe "ausdruecklich verworfen" oben).
  const cfgZiel = SEKTOR_CONFIG[zielFeld(s)] || {};
  const wunsch = [];
  if ((s.fleet.mining || 0) < (cfgZiel.miningCap || 0)) wunsch.push('mining');
  if ((s.fleet.begleitschiff || 0) < (cfgZiel.escortCap || 0)) wunsch.push('begleitschiff');
  wunsch.push(...KAMPFSCHIFFE.map((sh) => sh.id));
  for (const id of wunsch) {
    if (gelang(actions.startBuild(s, id, 25), 'SCHIFFE')) erfolge++;
  }

  // (4) FLOTTE ENTSENDEN - auf miningCap/escortCap beschnitten (Defekt c).
  const laeuftSchon = (s.missions || []).some((m) => !m.finalized);
  if (!laeuftSchon) {
    const ziel = zielFeld(s);
    const cfg = SEKTOR_CONFIG[ziel] || {};
    const grenze = { mining: cfg.miningCap, begleitschiff: cfg.escortCap };
    const auswahl = {};
    missions.availableFleetForSektor(ziel).forEach((id) => {
      const da = s.fleet[id] || 0;
      if (da <= 0) return;
      const g = grenze[id];
      const n = g ? Math.min(da, g) : da;
      if (n > 0) auswahl[id] = n;
    });
    if (Object.keys(auswahl).length > 0 && gelang(missions.sendFleet(s, ziel, auswahl), 'MISSION')) erfolge++;
  }

  return erfolge > 0;
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
    schieflage: 0,
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

  // K3b ROHSTOFF-SCHIEFLAGE. K3 verlangt, dass ALLE Lanes belegt sind, und uebersieht damit den
  // haeufigeren Fall: eine Lane steht LEER, weil genau EIN Rohstoff fehlt, waehrend die anderen
  // sich tuermen. Gemessen am 26.08.2026: Metall 1 Mio gegen Kristall 337 Mio und Deuterium
  // 979 Mio, dazu 335 Gebaeude-Ablehnungen "Nicht genug Ressourcen" - K3 meldete dafuer 0,0 %.
  // K3 bleibt bewusst UNVERAENDERT, damit die Vergleichswerte frueherer Sessions gueltig
  // bleiben; K3b steht daneben. Massstab ist derselbe wie bei K3 (Wert des guenstigsten
  // Schiffs), damit keine neue willkuerliche Konstante entsteht.
  const laneLeerWegenGeld =
    (belegtG < SLOTS.gebaeude && ressourcenAblehnung.GEBAEUDE) ||
    (belegtF < SLOTS.forschung && ressourcenAblehnung.FORSCHUNG) ||
    (belegtS < SLOTS.schiffe && ressourcenAblehnung.SCHIFFE);
  if (wert(s.resources) >= guenstigstes && laneLeerWegenGeld) tagJetzt.schieflage++;
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
    if (tagJetzt) quellenTage.push(quellenJetzt);
    quellenJetzt = QUELLEN_TAG();
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
      const s = umhuellen(loadPlayerState(mensch.id));
      await (TREIBER === 'tick' ? actions.tick(s) : actions.runEconomyTick(s));
      probe(s);
      savePlayerState(s);
    }
  }

  // --- Stundenschritt des Menschen ---
  SIM_NOW = START + (h + 1) * STUNDE;
  const s = umhuellen(loadPlayerState(mensch.id));
  const machtVor = combat.combatFleetPowerBase(s.fleet || {});
  // TREIBER, siehe Kopf: runEconomyTick() loest keinen Raid aus, tick() schon.
  await (TREIBER === 'tick' ? actions.tick(s) : actions.runEconomyTick(s));
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
    schieflage: a.schieflage + t.schieflage,
  }),
  { proben: 0, leerG: 0, leerF: 0, leerS: 0, stau: 0, schieflage: 0 }
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
console.log(`K3b Rohstoff-Schieflage        : ${p(gesamt.schieflage, gesamt.proben).toFixed(1)} %   <- Lane leer, weil EIN Rohstoff fehlt`);
console.log(`K4 Wochen ohne neuen Inhalt    : ${wochenOhneInhalt.length ? wochenOhneInhalt.map((w) => w + 1).join(', ') : 'keine'}`);
// ===================================================================================
// K5 UND K6 - EINNAHMEN NACH QUELLE
// ===================================================================================
quellenTage.push(quellenJetzt);
const mrd = (x) => (x / 1e9).toFixed(3);
const summeUeber = (tageAuswahl, feld) => {
  const m = new Map();
  tageAuswahl.forEach((q) => q[feld].forEach((v, k) => addMap(m, k, v)));
  return m;
};
const woche1 = quellenTage.slice(0, 7);
const einWoche1 = summeUeber(woche1, 'ein');
const gesamtWoche1 = [...einWoche1.values()].reduce((a, b) => a + b, 0);

console.log(`\n--- K5: EINNAHMEN NACH QUELLE, WOCHE 1 (Wert-Einheiten) ---`);
if (gesamtWoche1 <= 0) {
  console.log('  keine Einnahmen erfasst');
} else {
  [...einWoche1.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(26)} ${mrd(v).padStart(9)} Mrd   ${((100 * v) / gesamtWoche1).toFixed(1).padStart(5)} %`));
  console.log(`  ${'GESAMT'.padEnd(26)} ${mrd(gesamtWoche1).padStart(9)} Mrd`);
}
const groessteQuelle = [...einWoche1.entries()].sort((a, b) => b[1] - a[1])[0];
const anteilGroesste = gesamtWoche1 > 0 ? (100 * groessteQuelle[1]) / gesamtWoche1 : 0;
console.log(`K5 groesste Einzelquelle (<50%): ${anteilGroesste.toFixed(1)} % (${groessteQuelle ? groessteQuelle[0] : '-'})`);
// Zweite Lesart, weil die Wrack-Bergung eine ERSTATTUNG auf eigene Verluste ist und keine
// Einnahme - sie steht im Nenner und verschiebt damit alle Anteile. Beide Zahlen ausweisen
// statt die Frage per Definition zu entscheiden.
const ohneBergung = new Map([...einWoche1.entries()].filter(([k]) => k !== 'wrack_bergung'));
const gesamtOhne = [...ohneBergung.values()].reduce((a, b) => a + b, 0);
const groessteOhne = [...ohneBergung.entries()].sort((a, b) => b[1] - a[1])[0];
console.log(`K5 dasselbe OHNE Bergung       : ${gesamtOhne > 0 ? ((100 * groessteOhne[1]) / gesamtOhne).toFixed(1) : '0.0'} % (${groessteOhne ? groessteOhne[0] : '-'})`);

// GEGENPROBE. Ohne sie ist die Aufschluesselung nicht belastbar: sie normiert sonst auf die
// Summe dessen, was zufaellig instrumentiert wurde.
const restRes = bruttoRes - buchRes;
console.log(`\n--- GEGENPROBE: HAUPTBUCH GEGEN GEMESSENEN BRUTTOZUWACHS (GANZER LAUF, nicht Woche 1) ---`);
console.log(`  Bruttozuwachs state.resources : ${mrd(bruttoRes)} Mrd`);
console.log(`  Summe aller Hauptbuch-Zeilen  : ${mrd(buchRes)} Mrd`);
console.log(`  NICHT ZUGEORDNET              : ${mrd(restRes)} Mrd   (${bruttoRes > 0 ? ((100 * restRes) / bruttoRes).toFixed(3) : '0.000'} %)`);
console.log(`  DM: Zuwachs ${bruttoDm.toFixed(0)} gegen Hauptbuch ${buchDm.toFixed(0)}`);
if (bruttoRes > 0 && Math.abs(restRes) / bruttoRes > 0.001) {
  console.log(`  ACHTUNG: ueber 0,1 % nicht zugeordnet - eine Buchungsstelle fehlt in make_messbuild_k5.mjs.`);
}
const stueck = summeUeber(quellenTage, 'neutral');
[...stueck.entries()].filter(([k]) => k.startsWith('__stueck_')).forEach(([k, v]) =>
  console.log(`  Container ${k.replace('__stueck_', '').padEnd(24)} ${v} Stueck`));
const neutralWert = [...stueck.entries()].filter(([k]) => !k.startsWith('__stueck_'))
  .reduce((a, [, v]) => a + v, 0);
if (neutralWert > 0) console.log(`  davon aus geoeffneten Containern (NICHT als Einnahme gezaehlt): ${mrd(neutralWert)} Mrd`);

// K6: Plateau. SETZUNG, umkehrbar und zur Bestaetigung vorgelegt - der Plan nennt keine
// Schwelle ("kein Plateau ueber 5 Tage"). Gelesen als: ein Tag gehoert zum Plateau, wenn seine
// Tageseinnahme das bis dahin erreichte Maximum um weniger als 5 % uebertrifft. Gemessen wird
// die laengste solche Folge. Die Tageskurve steht darunter, damit die Zahl nachpruefbar bleibt.
const tagesEinnahme = quellenTage.map((q) => [...q.ein.values()].reduce((a, b) => a + b, 0));
let max = 0, lauf = 0, plateau = 0, plateauStart = 0, besterStart = 0;
tagesEinnahme.forEach((e, i) => {
  if (e > max * 1.05) { max = Math.max(max, e); lauf = 0; plateauStart = i + 1; }
  else { max = Math.max(max, e); lauf++; if (lauf > plateau) { plateau = lauf; besterStart = plateauStart; } }
});
console.log(`\n--- K6: EINNAHMENKURVE JE TAG (Mrd Wert-Einheiten) ---`);
console.log('  ' + tagesEinnahme.map((e, i) => `T${i}:${(e / 1e9).toFixed(2)}`).join('  '));
console.log(`K6 laengstes Plateau (<=5 Tage): ${plateau} Tage${plateau > 0 ? ` ab Tag ${besterStart}` : ''}` +
  (TAGE < 30 ? '   <- bei weniger als 30 Tagen nur eingeschraenkt aussagefaehig' : ''));
if (SAMMLE_GRUENDE) {
  console.log('\n--- ABLEHNUNGSGRUENDE, HAEUFIGSTE ZUERST ---');
  [...GRUENDE.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([k, n]) => console.log(`${String(n).padStart(6)} x  ${k}`));
}
console.log(`\nLaufzeit: ${((ECHT() - t0) / 1000).toFixed(1)} s echte Zeit fuer ${TAGE * 24} Stunden x ${UNTER} Unterschritte`);

if (AUSGABE) {
  writeFileSync(AUSGABE, JSON.stringify({
    profil: PROFIL, treiber: TREIBER, tage, gesamt,
    quellen: quellenTage.map((q) => ({
      ein: Object.fromEntries(q.ein), neutral: Object.fromEntries(q.neutral), dm: Object.fromEntries(q.dm),
    })),
    gegenprobe: { bruttoRes, buchRes, bruttoDm, buchDm },
  }, null, 2));
  console.log(`Rohdaten: ${AUSGABE}`);
}

// FALLE 3: ohne das haengt der Lauf, sobald combatRunner einen Worker gestartet hat.
process.exit(0);
