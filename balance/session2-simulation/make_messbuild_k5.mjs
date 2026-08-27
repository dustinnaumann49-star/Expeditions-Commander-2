// QUELLEN-INSTRUMENTIERUNG FUER K5/K6 (Punkt 3 aus sim13_geruest.txt Abschnitt 8)
//
// !!! ALLE ERGEBNISSE AUS DIESEM BUILD SIND MESSBUILD-WERTE, KEIN REPO-STAND.       !!!
// !!! ES WIRD KEIN SPIELCODE GEAENDERT - veraendert wird ausschliesslich eine KOPIE  !!!
// !!! eines bereits erzeugten dist-Baums.                                           !!!
//
// ZWEISTUFIG, BEWUSST. Dieses Skript setzt auf /tmp/sim13/dist auf statt make_messbuild_sim13.mjs
// zu erweitern - dasselbe Muster wie make_messbuild_korr.mjs und make_messbuild_salve.mjs. Drei
// Gruende:
//   1. Die dokumentierte Blockzaehlung A 9 / B 2 / C 3 / D 5 / E 2 = 21 ist die Echtheitspruefung
//      von make_messbuild_sim13.mjs (verdrahtung_a.txt Abschnitt 1). Sie bleibt unberuehrt.
//      Dieses Skript zaehlt seine Patches getrennt.
//   2. Der Ankerwert des Simulationsbuilds bleibt ohne erneute Pruefung vergleichbar.
//   3. Die Instrumentierung laesst sich abschalten - und nur dadurch ist die Gegenprobe
//      "veraendert die Instrumentierung das Ergebnis?" ueberhaupt fahrbar.
//
// PASSIV, WENN NIEMAND ZUSIEHT. Jede eingesetzte Zeile ruft `globalThis.__K5?.(...)`. Ist der
// Haken nicht gesetzt (jedes Skript ausser sim13_lauf.mjs), tut der Build exakt nichts. Der
// instrumentierte Build ist dann verhaltensgleich zum uninstrumentierten - das ist die
// Voraussetzung dafuer, dass der Ankercheck ueberhaupt etwas aussagt.
//
// Aufruf:
//   node make_messbuild_kum.mjs   /tmp/mb_kum      --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_sim13.mjs /tmp/mb_kum   /tmp/sim13/dist
//   node make_messbuild_k5.mjs    /tmp/sim13/dist /tmp/k5/dist
//
// DAS ZIEL MUSS AUF /dist ENDEN - gleiche Begruendung wie bei make_messbuild_sim13.mjs: db.js
// liegt in der WURZEL des dist-Baums und bildet seinen Pfad als __dirname/../data/game.db.
//
// ===================================================================================
// EINE FALLE, DIE HIER DETERMINISTISCH GEGRIFFEN HAETTE - VOR DEM ERSTEN LAUF GEFUNDEN
// ===================================================================================
// Der naheliegende Weg waere, an den drei Zeilen in finalizeMission() zu buchen, an denen
// mission.farmed auf state.resources geht. Das trennt aber nichts: mission.farmed sammelt VIER
// verschiedene Quellen ein (Asteroiden-Mining, Abschusspraemie der Eskorte, Reicher Fund,
// Piraten-Pluenderung ueber lootBase). Gebucht werden muss deshalb dort, wo mission.farmed
// GEFUELLT wird.
// Genau daraus folgt die Falle: abortMissionDestroyed() zahlt NICHTS aus ("Flotte vollstaendig
// vernichtet, keine Ressourcen geborgen"). Wer beim Auflaufen bucht, zaehlt eine verlorene
// Mission als Einnahme. Deshalb sammelt die Instrumentierung je Mission in mission.__k5 und
// COMMITTED erst in finalizeMission() - dem einzigen Pfad, der tatsaechlich auszahlt.
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const SRC = resolve(args[0] || '/tmp/sim13/dist');
const OUT = resolve(args[1] || '/tmp/k5/dist');
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
};

if (!existsSync(SRC)) throw new Error(`Eingangs-Build fehlt: ${SRC} (erst make_messbuild_sim13.mjs)`);
if (!existsSync(resolve(SRC, 'game/loot.js'))) {
  throw new Error('Eingangs-Build enthaelt game/loot.js nicht - das ist kein Simulationsbuild.');
}
if (!OUT.endsWith('/dist')) {
  throw new Error('Ziel muss auf /dist enden (Wegwerf-Datenbank, siehe Kopf dieser Datei).');
}
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(SRC, OUT, { recursive: true });

// node_modules in den LAUFORDNER verlinken, nicht in dist. Node loest von <lauf>/dist/db.js nach
// oben auf; ohne diesen Verweis findet db.js better-sqlite3 nicht (V4 aus sim13_geruest.txt).
const NM = resolve(opt('nm', new URL('../../server/node_modules', import.meta.url).pathname));
if (existsSync(NM)) {
  const ziel = resolve(OUT, '../node_modules');
  if (!existsSync(ziel)) symlinkSync(NM, ziel, 'dir');
} else {
  console.warn(`WARNUNG: node_modules nicht gefunden (${NM}) - Skripte, die db.js laden, scheitern.`);
}

const g = (f) => resolve(OUT, 'game', f);
let patches = 0;

/** Exakter Textersatz mit hartem Abbruch. Der Anker MUSS genau einmal vorkommen. */
function patch(file, needle, replacement, label) {
  const txt = readFileSync(file, 'utf8');
  const n = txt.split(needle).length - 1;
  if (n !== 1) {
    throw new Error(`PATCH "${label}" ABGEBROCHEN: Anker ${n}x in ${file} gefunden, erwartet genau 1x.\n  Anker: ${needle.slice(0, 110)}...`);
  }
  writeFileSync(file, txt.replace(needle, replacement));
  patches++;
}

// ===================================================================================
// K0 - HILFSFUNKTION IN missions.js
// ===================================================================================
// Sammelt je Mission und Quelle, wird in finalizeMission() an das Hauptbuch uebergeben.
patch(
  g('missions.js'),
  `import { lootCurveFactor, computeSalvage } from './loot.js';`,
  `import { lootCurveFactor, computeSalvage } from './loot.js';
// ===== K5 Quellen-Instrumentierung =====
// Sammelt je Mission, damit eine vernichtete Flotte (abortMissionDestroyed zahlt NICHTS) nicht
// als Einnahme durchgeht. Commit ausschliesslich in finalizeMission().
function __k5Mission(mission, quelle, betrag) {
    if (!globalThis.__K5) return;
    if (!mission.__k5) mission.__k5 = {};
    const e = (mission.__k5[quelle] = mission.__k5[quelle] || { metall: 0, kristall: 0, deuterium: 0 });
    e.metall += betrag.metall || 0;
    e.kristall += betrag.kristall || 0;
    e.deuterium += betrag.deuterium || 0;
}`,
  'K0 missions.js Sammler'
);

// ===================================================================================
// K1 - MINENERTRAG (actions.js, accrueBuildingProduction)
// ===================================================================================
// Bewusst hinter den bestehenden Zweig gehaengt statt hineingeschrieben: der else-if-Baum hat
// einen stillen vierten Fall (Gebaeude ohne baseOutput), der KEINE Ressource bucht. Ein Hook im
// Zweig selbst haette den mitgezaehlt.
patch(
  g('actions.js'),
  `        if (building.kind === 'mine_metall')
            state.resources.metall += gain;
        else if (building.kind === 'mine_kristall')
            state.resources.kristall += gain;
        else if (building.kind === 'mine_deuterium')
            state.resources.deuterium += gain;`,
  `        if (building.kind === 'mine_metall')
            state.resources.metall += gain;
        else if (building.kind === 'mine_kristall')
            state.resources.kristall += gain;
        else if (building.kind === 'mine_deuterium')
            state.resources.deuterium += gain;
        // ===== K5 Quellen-Instrumentierung: Minenertrag =====
        if (building.kind === 'mine_metall')
            globalThis.__K5?.('mine', 'res', state, { metall: gain });
        else if (building.kind === 'mine_kristall')
            globalThis.__K5?.('mine', 'res', state, { kristall: gain });
        else if (building.kind === 'mine_deuterium')
            globalThis.__K5?.('mine', 'res', state, { deuterium: gain });`,
  'K1 actions.js Minenertrag'
);

// ===================================================================================
// K2 bis K5 - DIE VIER ZUFLUESSE IN mission.farmed
// ===================================================================================
// K2: Asteroiden-Mining (accrueFarming)
patch(
  g('missions.js'),
  `            mission.farmed.metall += total * 0.5;
            mission.farmed.kristall += total * 0.3;
            mission.farmed.deuterium += total * 0.2;`,
  `            mission.farmed.metall += total * 0.5;
            mission.farmed.kristall += total * 0.3;
            mission.farmed.deuterium += total * 0.2;
            __k5Mission(mission, 'asteroid_mining', { metall: total * 0.5, kristall: total * 0.3, deuterium: total * 0.2 });`,
  'K2 missions.js Asteroiden-Mining'
);

// K3: Abschusspraemie der Asteroiden-Eskorte (runAsteroidEscortCheck)
patch(
  g('missions.js'),
  `    mission.farmed.metall += reward.metall;
    mission.farmed.kristall += reward.kristall;
    mission.farmed.deuterium += reward.deuterium;`,
  `    mission.farmed.metall += reward.metall;
    mission.farmed.kristall += reward.kristall;
    mission.farmed.deuterium += reward.deuterium;
    __k5Mission(mission, 'eskorte_praemie', reward);`,
  'K3 missions.js Eskorte-Abschusspraemie'
);

// K4: Reicher Fund. Verdoppelt den bis dahin gesammelten farmed-Betrag und ist damit eine
// EIGENE Quelle - ihn dem Mining zuzuschlagen wuerde die Mining-Zeile ueberzeichnen.
patch(
  g('missions.js'),
  `    mission.farmed.metall += bonus.metall;
    mission.farmed.kristall += bonus.kristall;
    mission.farmed.deuterium += bonus.deuterium;`,
  `    mission.farmed.metall += bonus.metall;
    mission.farmed.kristall += bonus.kristall;
    mission.farmed.deuterium += bonus.deuterium;
    __k5Mission(mission, 'reicher_fund', bonus);`,
  'K4 missions.js Reicher Fund'
);

// K5: Piraten-Pluenderung (lootBase x lootMultiplier). Getrennt von der Beute-Kurve auf
// winResources - das sind zwei verschiedene Toepfe derselben Mission.
patch(
  g('missions.js'),
  `        mission.farmed.metall += loot.metall;
        mission.farmed.kristall += loot.kristall;
        mission.farmed.deuterium += loot.deuterium;`,
  `        mission.farmed.metall += loot.metall;
        mission.farmed.kristall += loot.kristall;
        mission.farmed.deuterium += loot.deuterium;
        __k5Mission(mission, 'piraten_pluenderung', loot);`,
  'K5 missions.js Piraten-Pluenderung'
);

// ===================================================================================
// K6 - COMMIT IN finalizeMission() PLUS DM UND TEILE
// ===================================================================================
patch(
  g('missions.js'),
  `    state.resources.metall += mission.farmed.metall;
    state.resources.kristall += mission.farmed.kristall;
    state.resources.deuterium += mission.farmed.deuterium;
    state.resources.dm += mission.dmFound;
    state.teile.waffen += Math.floor(mission.teile.waffen);
    state.teile.schild += Math.floor(mission.teile.schild);
    state.teile.panzerung += Math.floor(mission.teile.panzerung);`,
  `    state.resources.metall += mission.farmed.metall;
    state.resources.kristall += mission.farmed.kristall;
    state.resources.deuterium += mission.farmed.deuterium;
    state.resources.dm += mission.dmFound;
    state.teile.waffen += Math.floor(mission.teile.waffen);
    state.teile.schild += Math.floor(mission.teile.schild);
    state.teile.panzerung += Math.floor(mission.teile.panzerung);
    // ===== K5: erst HIER buchen. abortMissionDestroyed() zahlt nichts aus. =====
    if (globalThis.__K5 && mission.__k5) {
        Object.entries(mission.__k5).forEach(([__q, __b]) => globalThis.__K5(__q, 'res', state, __b));
    }
    globalThis.__K5?.('dm_mission', 'dm', state, { dm: mission.dmFound });
    globalThis.__K5?.('teile_mission', 'teile', state, {
        waffen: Math.floor(mission.teile.waffen),
        schild: Math.floor(mission.teile.schild),
        panzerung: Math.floor(mission.teile.panzerung),
    });`,
  'K6 missions.js Commit + DM + Teile'
);

// ===================================================================================
// K7 - BEUTE-KURVE UND WRACK-BERGUNG GETRENNT
// ===================================================================================
// totalWinResources ist Math.round(kurve + bergung). Die Rundungsdifferenz bekommt eine eigene
// Zeile, damit die Gegenprobe ("nicht zugeordnet" muss 0 sein) exakt aufgeht statt "fast".
patch(
  g('missions.js'),
  `    if (totalWinResources) {
        state.resources.metall += totalWinResources.metall;
        state.resources.kristall += totalWinResources.kristall;
        state.resources.deuterium += totalWinResources.deuterium;
    }`,
  `    if (totalWinResources) {
        state.resources.metall += totalWinResources.metall;
        state.resources.kristall += totalWinResources.kristall;
        state.resources.deuterium += totalWinResources.deuterium;
        // ===== K5: Kurve und Bergung getrennt, Rundungsrest als eigene Zeile =====
        const __kb = { metall: __curved?.metall || 0, kristall: __curved?.kristall || 0, deuterium: __curved?.deuterium || 0 };
        globalThis.__K5?.('piraten_beutekurve', 'res', state, __kb);
        globalThis.__K5?.('wrack_bergung', 'res', state, __salvage);
        globalThis.__K5?.('rundung', 'res', state, {
            metall: totalWinResources.metall - __kb.metall - __salvage.metall,
            kristall: totalWinResources.kristall - __kb.kristall - __salvage.kristall,
            deuterium: totalWinResources.deuterium - __kb.deuterium - __salvage.deuterium,
        });
    }`,
  'K7 missions.js Kurve/Bergung getrennt'
);

// ===================================================================================
// K8 - CONTAINER: EIN EINGANG FUER ALLE DREI INHALTE
// ===================================================================================
// addContainers() ist der einzige Eingang, den Solo-Mission, Raid und Gruppen-Operation
// gemeinsam benutzen (nachgezaehlt im Build: missions.js 2x, raids.js 3x, groupOps.js 2x).
// Die HERKUNFT kommt ueber ein Etikett, das die Aufrufstellen setzen - bewusst nicht ueber einen
// Stack-Trace, der bei jeder Umbenennung still danebengreift.
// Das Etikett wird NICHT zurueckgesetzt: grantContainers() im Raid ruft addContainers dreimal
// hintereinander, ein Reset nach dem ersten Aufruf haette die anderen beiden verloren. Dafuer
// sind ALLE fuenf Aufrufstellen etikettiert - bleibt 'container_unbekannt' stehen, ist ein
// sechster Pfad dazugekommen und faellt sofort auf.
patch(
  g('inventory.js'),
  `export function addContainers(state, tier, count = 1) {
    if (count <= 0)
        return;`,
  `export function addContainers(state, tier, count = 1) {
    if (count <= 0)
        return;
    globalThis.__K5?.(globalThis.__K5Q || 'container_unbekannt', 'container', state, { tier, count });`,
  'K8 inventory.js addContainers'
);

// K9 - Container-EINLOESUNG. Wird bewertet beim FUND gezaehlt; das Einloesen darf deshalb NICHT
// noch einmal als Einnahme zaehlen. Es wird trotzdem gemeldet, und zwar aus einem Grund: ohne
// diese Meldung erschiene der Ressourcenzuwachs aus einem geoeffneten Container in der
// Gegenprobe als "nicht zugeordnet" und saehe aus wie eine vergessene Buchungsstelle.
patch(
  g('inventory.js'),
  `        case 'resources':
            state.resources.metall += reward.metall || 0;
            state.resources.kristall += reward.kristall || 0;
            state.resources.deuterium += reward.deuterium || 0;
            return true;
        case 'dm':
            state.resources.dm += reward.amount || 0;
            return true;`,
  `        case 'resources':
            state.resources.metall += reward.metall || 0;
            state.resources.kristall += reward.kristall || 0;
            state.resources.deuterium += reward.deuterium || 0;
            // K5: NICHT als Einnahme - der Container ist beim Fund bereits bewertet worden.
            globalThis.__K5?.('container_eingeloest', 'res_neutral', state, {
                metall: reward.metall || 0, kristall: reward.kristall || 0, deuterium: reward.deuterium || 0,
            });
            return true;
        case 'dm':
            state.resources.dm += reward.amount || 0;
            globalThis.__K5?.('container_eingeloest', 'dm_neutral', state, { dm: reward.amount || 0 });
            return true;`,
  'K9 inventory.js Container-Einloesung'
);

// ===================================================================================
// K10 bis K12 - ETIKETTEN AN DEN FUENF AUFRUFSTELLEN
// ===================================================================================
patch(
  g('missions.js'),
  `            addContainers(state, cfg.captainContainerTier);`,
  `            globalThis.__K5Q = 'container_kapitaen';
            addContainers(state, cfg.captainContainerTier);`,
  'K10 missions.js Etikett Piratenkapitaen'
);

patch(
  g('missions.js'),
  `    if (winContainer && totalWinContainers > 0)
        addContainers(state, winContainer.tier, totalWinContainers);`,
  `    if (winContainer && totalWinContainers > 0) {
        globalThis.__K5Q = 'container_mission';
        addContainers(state, winContainer.tier, totalWinContainers);
    }`,
  'K11 missions.js Etikett Missions-Container'
);

patch(
  g('raids.js'),
  `        const __n = (proWelle) => Math.round(raid.wavesWon * proWelle * __anteil);`,
  `        globalThis.__K5Q = 'container_raid';
        const __n = (proWelle) => Math.round(raid.wavesWon * proWelle * __anteil);`,
  'K12 raids.js Etikett Raid-Container'
);

patch(
  g('groupOps.js'),
  `            cfg.guaranteedContainers.forEach((gc) => addContainers(participantStates.get(p.userId), gc.tier, gc.count));`,
  `            globalThis.__K5Q = 'container_gruppe';
            cfg.guaranteedContainers.forEach((gc) => addContainers(participantStates.get(p.userId), gc.tier, gc.count));`,
  'K13 groupOps.js Etikett garantierte Container'
);

patch(
  g('groupOps.js'),
  `            accepted.forEach((p) => addContainers(participantStates.get(p.userId), cfg.captainContainerTier));`,
  `            globalThis.__K5Q = 'container_gruppe_kapitaen';
            accepted.forEach((p) => addContainers(participantStates.get(p.userId), cfg.captainContainerTier));`,
  'K14 groupOps.js Etikett Kapitaens-Container'
);

// ===================================================================================
// K15/K16 - GRUPPEN-EXPEDITION UND RAID-BERGUNGS-DM
// ===================================================================================
// Beide laufen im heutigen Treiber NICHT (siehe Protokoll k5_quellen.txt Abschnitt 2). Sie
// werden trotzdem instrumentiert, damit die Aufschluesselung vollstaendig ist, sobald der
// Treiber sie ausloest - und damit ihr Fehlen als 0,00 sichtbar ist statt als Luecke.
patch(
  g('groupOps.js'),
  `        pState.resources.metall += Math.floor(reward.metall);
        pState.resources.kristall += Math.floor(reward.kristall);
        pState.resources.deuterium += Math.floor(reward.deuterium);`,
  `        pState.resources.metall += Math.floor(reward.metall);
        pState.resources.kristall += Math.floor(reward.kristall);
        pState.resources.deuterium += Math.floor(reward.deuterium);
        globalThis.__K5?.('gruppe_event', 'res', pState, {
            metall: Math.floor(reward.metall), kristall: Math.floor(reward.kristall), deuterium: Math.floor(reward.deuterium),
        });`,
  'K15 groupOps.js Event-Belohnung'
);

patch(
  g('groupOps.js'),
  `        pState.resources.metall += gainedMetall;
        pState.resources.kristall += gainedKristall;
        pState.resources.deuterium += gainedDeut;`,
  `        pState.resources.metall += gainedMetall;
        pState.resources.kristall += gainedKristall;
        pState.resources.deuterium += gainedDeut;
        globalThis.__K5?.('gruppe_expedition', 'res', pState, {
            metall: gainedMetall, kristall: gainedKristall, deuterium: gainedDeut,
        });`,
  'K16 groupOps.js Expeditions-Beute'
);

patch(
  g('raids.js'),
  `        state.resources.dm += salvageDm;
        reinforcerStates.forEach(({ playerState }) => (playerState.resources.dm += salvageDm));`,
  `        state.resources.dm += salvageDm;
        globalThis.__K5?.('dm_raid', 'dm', state, { dm: salvageDm });
        reinforcerStates.forEach(({ playerState }) => (playerState.resources.dm += salvageDm));`,
  'K17 raids.js Bergungs-DM'
);

console.log(`Quellen-Instrumentierung: ${OUT}`);
console.log(`  Eingang     : ${SRC}`);
console.log(`  Patches     : ${patches} (jeder mit hartem Abbruch bei fehlendem Anker)`);
console.log(`  Quellen     : mine, asteroid_mining, eskorte_praemie, reicher_fund,`);
console.log(`                piraten_pluenderung, piraten_beutekurve, wrack_bergung,`);
console.log(`                container_{mission,kapitaen,raid,gruppe,gruppe_kapitaen},`);
console.log(`                gruppe_event, gruppe_expedition, dm_mission, dm_raid, teile_mission`);
console.log(`  Passiv ohne globalThis.__K5 - der Build ist dann verhaltensgleich zum Eingang.`);
console.log(`  Datenbank landet unter ${resolve(OUT, '../data')}`);
console.log(`  Quellcode unberuehrt.`);
