// SIMULATIONS-MESSBUILD FUER SCHRITT 13 (30-TAGE-FORTSCHRITTSSIMULATION)
//
// !!! ALLE ERGEBNISSE AUS DIESEM BUILD SIND MESSBUILD-WERTE, KEIN REPO-STAND. !!!
// !!! ES WIRD KEIN SPIELCODE GEAENDERT - veraendert wird ausschliesslich eine  !!!
// !!! KOPIE eines bereits erzeugten dist-Baums.                                !!!
//
// Umfang, am 25.08.2026 vom Nutzer entschieden (V3, siehe sim_vorbedingungen_13.txt Abschnitt 8):
//   A  Block A Schritt 2, diesmal VERDRAHTET in missions.js UND groupOps.js
//   B  Entscheidung 18  - ESC = 1 / 1,20 / 1,60, Bomberanteil 0,5 in der letzten Phase
//   C  Entscheidung 3   - Variante 6: Topf je Raid nach Beitrag + Saettigung ueber die Tagessumme
//   D  Entscheidung 12  - NOVICE_BONUS_ADD = 2,0, Fenster an NEWCOMER_GRACE_MS
//   E  Entscheidung 13.1 - virtueller Bot-Ertrag, k = 4,0, Verlust 0,036, f = 12, ZEITBASIERT
//
// Entscheidung 16 steckt bereits im Eingangs-Build (make_messbuild_kum.mjs --rf=4 --evk=0.20
// --evm=0.08) und wird hier NICHT erneut angefasst.
//
// AUSDRUECKLICH NICHT ENTHALTEN, damit es nicht wie eine Auslassung aussieht:
//   - Entscheidung 19 (Weg 2). GEMESSEN wirkungslos unterhalb von rund 20.000 eigenen Schiffen
//     (volley_mission_19.txt Befund 1: Treffer/Typ = 1 bei 5.235 Schiffen). Ein Konto, das bei
//     defaultPlayerState() startet, erreicht das in 30 Tagen nicht.
//   - R16 (Gleichzeitigkeitssperre Gruppen-Operationen), Piratenbasen-Offensive (loest laut
//     Entscheidung 17 faktisch nie aus), Block B (P10 ist Nur-Multiplayer), 7.2/7.3 (Station
//     kostet 558 Mrd gegen 46 Mrd Wocheneinnahme in Woche 1 - ausserhalb des Fensters).
//
// Aufruf:
//   node make_messbuild_kum.mjs   /tmp/mb_kum      --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_sim13.mjs /tmp/mb_kum  <lauf>/dist  [--f=12] [--smax=1.5] [--nur=A,B,D]
//
// DAS ZIEL MUSS AUF /dist ENDEN. db.js liegt in der WURZEL des dist-Baums und bildet seinen Pfad
// als __dirname/../data/game.db - eine Kopie direkt nach <lauf> legt die Datenbank neben den
// Laufordner, in der Praxis nach /tmp/data/game.db, geteilt von JEDEM Messbuild unter /tmp und von
// keinem rmSync erfasst (sim_vorbedingungen_13.txt Befund 6/6a). Mit <lauf>/dist landet sie unter
// <lauf>/data und verschwindet mit dem Lauf.
//
// Jeder Block bricht HART ab, wenn sein Anker nicht genau einmal gefunden wird. Ein still
// uebersprungener Patch wuerde unbemerkt den Ist-Zustand messen - genau die Fehlerform, gegen die
// make_messbuild_salve.mjs seinen Abbruch hat.
import { cpSync, readFileSync, writeFileSync, appendFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const SRC = resolve(args[0] || '/tmp/mb_kum');
const OUT = resolve(args[1] || './messbuild_sim13/dist');
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
};
const F = Number(opt('f', 12));          // Entscheidung 13.1, auf Delegation eingetragen, umkehrbar
const S_MAX = Number(opt('smax', 1.5));  // Entscheidung 3, Arbeitswert aus dem Plan
const NUR = opt('nur', null);            // Diagnose: einzelne Bloecke isolieren, z. B. --nur=A
const aktiv = (b) => !NUR || NUR.split(',').includes(b);

if (!existsSync(SRC)) throw new Error(`Eingangs-Build fehlt: ${SRC} (erst make_messbuild_kum.mjs)`);
if (!existsSync(resolve(SRC, 'game/loot.js'))) {
  throw new Error('Eingangs-Build enthaelt game/loot.js nicht - das ist kein kumulativer Build.');
}
if (!OUT.endsWith('/dist')) {
  throw new Error('Ziel muss auf /dist enden (Wegwerf-Datenbank, siehe Kopf dieser Datei).');
}
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
cpSync(SRC, OUT, { recursive: true });

// node_modules in den LAUFORDNER verlinken (nicht in den dist-Ordner). Node loest von
// <lauf>/dist/db.js aus nach oben auf: <lauf>/dist/node_modules, <lauf>/node_modules, ... Ohne
// diesen Verweis findet db.js better-sqlite3 nicht, sobald der Laufordner ausserhalb des
// Server-Baums liegt - und genau dort soll er wegen Falle 2 liegen. Der Symlink beruehrt den
// Server-Baum nur lesend.
const NM = resolve(opt('nm', new URL('../../server/node_modules', import.meta.url).pathname));
if (existsSync(NM)) {
  const ziel = resolve(OUT, '../node_modules');
  if (!existsSync(ziel)) symlinkSync(NM, ziel, 'dir');
} else {
  console.warn(`WARNUNG: node_modules nicht gefunden (${NM}) - Skripte, die db.js laden, werden scheitern.`);
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
// BLOCK A - BLOCK A SCHRITT 2, VERDRAHTET
// ===================================================================================
// Der kumulative Build legt nur die MESSFLAECHE an (game/loot.js, fuenf Konstanten,
// winResources x13,8) und sagt das in seinem Kopf auch. missions.js und groupOps.js verweisen
// null Mal darauf und rufen weiterhin je dreimal fleetSizeRewardMultiplier() - die bisherigen
// Skripte kommen damit zurecht, weil sie die Missionsschleife SELBST nachbauen. Die
// 30-Tage-Simulation darf das nicht (Abschnitt 1b: "echte Spiel-Funktionen verwenden").
//
// Referenzverhalten ist die Missionsschleife aus check_build_anker.mjs:
//   - Container-Fund EINMAL je Mission, sofern mindestens ein Check gewonnen wurde
//   - winResources je gewonnenem Check MAL lootCurveFactor(vernichtete Feindmacht dieses Checks,
//     LOOT_CURVE_SOLO_CHECK_POWER)
//   - kein Grossflotten-Bonus
if (aktiv('A')) {
  // --- A1: Import der Kurve und der Bergung in missions.js ---
  patch(
    g('missions.js'),
    `import { addContainers } from './inventory.js';`,
    `import { addContainers } from './inventory.js';
// ===== SIM13 Block A Schritt 2 =====
import { lootCurveFactor, computeSalvage } from './loot.js';
import { LOOT_CURVE_SOLO_CHECK_POWER, SALVAGE_SHARE } from './data/economy.js';`,
    'A1 missions.js Import'
  );

  // --- A2: Grossflotten-Bonus entfaellt ---
  // Bauanleitung Entscheidung 2: "fleetSizeRewardMultiplier() an beiden Stellen entfernen". In
  // missions.js ist sie ohnehin eine tote Rechnung (sie wirkt nur auf teileCap/lootBase, die es
  // bei niedrig/mittel/hoch seit dem 29.07.2026 nicht mehr gibt) - der Wert wird trotzdem
  // ausdruecklich auf 1 gesetzt statt der Aufruf entfernt, damit die Textbausteine unveraendert
  // bleiben und der Patch eine einzige Zeile ist.
  patch(
    g('missions.js'),
    `    const fleetBonus = fleetSizeRewardMultiplier(sentPower, cfg.npcFloor || 0);`,
    `    const fleetBonus = 1; // SIM13 Block A Schritt 2: Grossflotten-Bonus entfaellt`,
    'A2 missions.js fleetBonus'
  );

  // --- A3: winResources auf die Beute-Kurve, je gewonnenem Check gesammelt ---
  patch(
    g('missions.js'),
    `        mission.combatWins = (mission.combatWins || 0) + sandronatorBonus * eventBonus;`,
    `        mission.combatWins = (mission.combatWins || 0) + sandronatorBonus * eventBonus;
        // ===== SIM13 Block A Schritt 2: Beute-Kurve auf winResources =====
        // Anker ist PRO CHECK gerechnet (Messkasten Entscheidung 2), der Piratenkapitaen zaehlt
        // nicht zur vernichteten Feindmacht - identisch zur Referenzschleife in
        // check_build_anker.mjs, sonst waeren Build und Anker nicht vergleichbar.
        if (cfg.winResources) {
            const __dp = {};
            Object.entries(npcLosses).forEach(([__id, __n]) => {
                if (__n > 0 && __id !== 'piratenkapitan') __dp[__id] = __n;
            });
            const __kurve = lootCurveFactor(combatFleetPowerBase(__dp), LOOT_CURVE_SOLO_CHECK_POWER);
            const __m = __kurve * sandronatorBonus * eventBonus;
            if (!mission.curvedWin) mission.curvedWin = { metall: 0, kristall: 0, deuterium: 0 };
            mission.curvedWin.metall += cfg.winResources.metall * __m;
            mission.curvedWin.kristall += cfg.winResources.kristall * __m;
            mission.curvedWin.deuterium += cfg.winResources.deuterium * __m;
        }`,
    'A3 missions.js Beute-Kurve'
  );

  // --- A4: eigene Verluste je Check sammeln (Grundlage der Wrack-Bergung) ---
  patch(
    g('missions.js'),
    `    const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => \`\${shipName(id)} x\${v}\`).join(', ') || 'keine';`,
    `    // ===== SIM13 Block A Schritt 2: Verluste fuer die Wrack-Bergung mitfuehren =====
    if (!mission.lostUnits) mission.lostUnits = {};
    Object.entries(losses).forEach(([__id, __n]) => {
        if (__n > 0) mission.lostUnits[__id] = (mission.lostUnits[__id] || 0) + __n;
    });
    const lossText = Object.entries(losses).filter(([, v]) => v > 0).map(([id, v]) => \`\${shipName(id)} x\${v}\`).join(', ') || 'keine';`,
    'A4 missions.js Verlustsammlung'
  );

  // --- A5: Container einmal je Mission statt je gewonnenem Check ---
  // Nutzerentscheidung 19.08.2026: Container sollen ein Extra sein, nicht die Hauptquelle. Heute
  // stellen sie rund 94 % des Solo-Belohnungswerts.
  patch(
    g('missions.js'),
    `    const totalWinContainers = winContainer ? (mission.combatWins || 0) * winContainer.count : 0;`,
    `    // SIM13 Block A Schritt 2: EINMAL je Mission, sofern ueberhaupt ein Check gewonnen wurde.
    const totalWinContainers = winContainer && (mission.combatWins || 0) > 0 ? winContainer.count : 0;`,
    'A5 missions.js Container je Mission'
  );

  // --- A6: Auszahlung aus der Kurve plus Wrack-Bergung ---
  // Zwei Setzungen aus der Bauanleitung: bei vollstaendig vernichteter Flotte gibt es KEINE
  // Bergung (der Totalverlust muss spuerbar bleiben), und der erstattete Betrag wird von
  // stats.resourcesSpentShipsDefense abgezogen - ohne das waere "Schiffe im Kampf verheizen" ein
  // besserer Punkte-Farm als das Verschrotten derselben Schiffe (Fehlerform R6). Der Imperator
  // ist ausgenommen; das erledigt computeSalvage() ueber def.cost.
  patch(
    g('missions.js'),
    `    const winResources = cfgForStats?.winResources;
    const combatWinsForResources = mission.combatWins || 0;
    const totalWinResources = winResources && combatWinsForResources > 0
        ? {
            metall: winResources.metall * combatWinsForResources,
            kristall: winResources.kristall * combatWinsForResources,
            deuterium: winResources.deuterium * combatWinsForResources,
        }
        : null;`,
    `    // ===== SIM13 Block A Schritt 2: kurvengewichtete winResources + Wrack-Bergung =====
    const __curved = mission.curvedWin;
    const __fleetLeft = Object.values(mission.ships || {}).reduce((a, b) => a + (b || 0), 0);
    const __salvage = __fleetLeft > 0 ? computeSalvage(mission.lostUnits || {}) : { metall: 0, kristall: 0, deuterium: 0 };
    if (__salvage.metall + __salvage.kristall + __salvage.deuterium > 0) {
        state.stats.resourcesSpentShipsDefense = Math.max(
            0,
            (state.stats.resourcesSpentShipsDefense || 0) - (__salvage.metall + __salvage.kristall + __salvage.deuterium)
        );
    }
    const totalWinResources = (__curved || __salvage.metall > 0)
        ? {
            metall: Math.round((__curved?.metall || 0) + __salvage.metall),
            kristall: Math.round((__curved?.kristall || 0) + __salvage.kristall),
            deuterium: Math.round((__curved?.deuterium || 0) + __salvage.deuterium),
        }
        : null;`,
    'A6 missions.js Auszahlung'
  );

  // --- A7 bis A9: dasselbe fuer die Gruppen-Expedition (Elite-Bollwerk) ---
  patch(
    g('groupOps.js'),
    `import { addContainers } from './inventory.js';`,
    `import { addContainers } from './inventory.js';
// ===== SIM13 Block A Schritt 2 =====
import { lootCurveFactor, coopLootMultiplier } from './loot.js';
import { LOOT_CURVE_ELITE_CHECK_POWER } from './data/economy.js';`,
    'A7 groupOps.js Import'
  );

  patch(
    g('groupOps.js'),
    `    const fleetBonus = fleetSizeRewardMultiplier(totalSentPower, cfg.npcFloor || 0);`,
    `    const fleetBonus = 1; // SIM13 Block A Schritt 2: Grossflotten-Bonus entfaellt (waere neben der Kurve eine doppelte Skalierung nach derselben Groesse)`,
    'A8 groupOps.js fleetBonus'
  );

  // Koop-Entscheidung: V2 (eigener Beitragsanteil) plus 15 % je Mitflieger, gedeckelt bei 3.
  // V1 (jeder bekommt die volle Menge) ist verworfen, weil bot.ts Elite-Einladungen automatisch
  // annimmt - zwei eingeladene Bots waeren sonst ein Ein-Klick-Einkommensmultiplikator.
  patch(
    g('groupOps.js'),
    `    if (anyNpcDestroyed && cfg.winResources) {
        winResourcesAmount = cfg.winResources;
        accepted.forEach((p) => {
            if (!p.farmed)
                return;
            p.farmed.metall += cfg.winResources.metall;
            p.farmed.kristall += cfg.winResources.kristall;
            p.farmed.deuterium += cfg.winResources.deuterium;
            participantStates.get(p.userId).stats.resourcesLooted += cfg.winResources.metall + cfg.winResources.kristall + cfg.winResources.deuterium;
        });`,
    `    if (anyNpcDestroyed && cfg.winResources) {
        // ===== SIM13 Block A Schritt 2: Beute-Kurve + Koop-Aufschlag + Beitragsanteil (V2) =====
        const __dp = {};
        Object.entries(npcLossesById).forEach(([__id, __n]) => {
            if (__n > 0 && __id !== 'piratenkapitan') __dp[__id] = __n;
        });
        const __kurve = lootCurveFactor(combatFleetPowerBase(__dp), LOOT_CURVE_ELITE_CHECK_POWER);
        const __coop = coopLootMultiplier(accepted.length);
        winResourcesAmount = {
            metall: Math.round(cfg.winResources.metall * __kurve * __coop),
            kristall: Math.round(cfg.winResources.kristall * __kurve * __coop),
            deuterium: Math.round(cfg.winResources.deuterium * __kurve * __coop),
        };
        accepted.forEach((p) => {
            if (!p.farmed)
                return;
            const __anteil = shares[p.username] ?? (1 / Math.max(1, accepted.length));
            const __m = winResourcesAmount.metall * __anteil;
            const __k = winResourcesAmount.kristall * __anteil;
            const __d = winResourcesAmount.deuterium * __anteil;
            p.farmed.metall += __m;
            p.farmed.kristall += __k;
            p.farmed.deuterium += __d;
            participantStates.get(p.userId).stats.resourcesLooted += __m + __k + __d;
        });`,
    'A9 groupOps.js Beute-Kurve + V2'
  );
}

// ===================================================================================
// BLOCK B - ENTSCHEIDUNG 18: ESKALIERENDE WELLEN + BUNKERBRECHER
// ===================================================================================
// ESC = 1 / 1,20 / 1,60, Bomberanteil 0,5 in der letzten Phase, RAID_WAVE_COUNT bleibt 12,
// RAID_WAVE_ROLL unangetastet (raid_hardness_18.txt Abschnitt 8).
//
// BEWUSSTE ABWEICHUNG VON DER BAUANLEITUNG, hier ausdruecklich vermerkt: der Plan verlangt fuer
// den EINBAU ein viertes Wellenprofil "bunkerbrecher". Dieser Build baut es NICHT, sondern
// repliziert die Form aus run_raid.mjs (Bomber werden nach generateFallbackFleet() als
// waveTargetPower * BUNKER / Stueckkosten aufaddiert). Grund: ESC = 1/1,20/1,60 ist gegen GENAU
// diese Form kalibriert worden. Ein echtes Profil wuerde ueber weightsForProfile() positions-
// gewichtet streuen und eine andere Wellenzusammensetzung erzeugen als die, gegen die 1,60
// gemessen wurde - der Messbuild waere dann nicht mehr mit raid_hardness_18.txt vergleichbar.
// Das viertes Profil gehoert in die Bauanleitung, nicht hierher.
if (aktiv('B')) {
  patch(
    g('raids.js'),
    `    const waveFactor = pick503020(RAID_WAVE_ROLL);
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * waveFactor;`,
    `    const waveFactor = pick503020(RAID_WAVE_ROLL);
    // ===== SIM13 Entscheidung 18: Eskalation in drei gleich grossen Phasen =====
    const __ESC = [1, 1.20, 1.60];
    const __wellenZahl = raid.waveTimes?.length || RAID_WAVE_COUNT;
    const __phase = Math.min(__ESC.length - 1, Math.floor((raid.wavesProcessed / __wellenZahl) * __ESC.length));
    const __letztePhase = __phase === __ESC.length - 1;
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * waveFactor * __ESC[__phase];`,
    'B1 raids.js Eskalation'
  );

  patch(
    g('raids.js'),
    `    const npcShips = generateFallbackFleet(waveTargetPower, profile);`,
    `    // ===== SIM13 Entscheidung 18: Bunkerbrecher-Anteil in der letzten Phase =====
    // Der Bomber ist der einzige Bunkerbrecher (RapidFire 20/20/10 gegen Raketenwerfer/Leichtes
    // Laser/Schweres Laser). Er VERLAGERT den Schaden auf die Verteidigungsanlagen, statt
    // zusaetzlichen anzurichten - das ist die direkte Gegenmassnahme zu Befund A.
    const __BUNKER = 0.5;
    const __anteil = __letztePhase ? __BUNKER : 0;
    const npcShips = generateFallbackFleet(waveTargetPower * (1 - __anteil), profile);
    if (__anteil > 0) {
        const __bb = baseStats('bomber');
        const __proStueck = __bb.waffen + __bb.schild + __bb.panzerung;
        npcShips.bomber = (npcShips.bomber || 0) + Math.round((waveTargetPower * __anteil) / __proStueck);
    }`,
    'B2 raids.js Bunkerbrecher'
  );
}

// ===================================================================================
// BLOCK C - ENTSCHEIDUNG 3: VARIANTE 6 (TOPF NACH BEITRAG + SAETTIGUNG)
// ===================================================================================
// KEINE NEUE ZAHL. Der "feste Container-Topf je Raid" IST die heutige Vollauszahlung
// wavesWon * RAID_WAVE_WIN_SILBER/GOLD/ELITE - heute bekommt sie jeder Teilnehmer einzeln
// (grantContainers laeuft fuer Verteidiger UND jeden Verstaerker UND jeden Halter), unter
// Variante 4 wird derselbe Topf EINMAL vergeben und nach Beitrag aufgeteilt.
//
// Der Beitragsanteil wird ueber die Wellen gemittelt: contributionShares() liegt je Welle
// bereits vor (seit dem 13.08.2026 fuer die Abschuss-Zurechnung), hier zusaetzlich in
// raid.contribAcc gesammelt. Bei Einzelverteidigung ohne Hilfe ist der eigene Anteil 1 und das
// Ergebnis identisch zum heutigen Verhalten - genau die Forderung aus dem Messkasten.
//
// SAETTIGUNG in der Bauform aus Entscheidung 9.1a:  eff = roh / (1 + roh / S_MAX)
// angewandt auf die TAGESSUMME der Anteile eines Spielers. Ausgezahlt wird der ZUWACHS der
// gesaettigten Summe, damit die Reihenfolge der Raids eines Tages nichts aendert.
//
// ACHTUNG, ARITHMETISCHER BEFUND (siehe Protokoll): mit dieser Bauform und S_MAX = 1,5 ergibt die
// im Messkasten genannte Rohsumme von 2,41 Aequivalenten 0,92 gesaettigte Aequivalente, nicht die
// dort ausgewiesenen 1,20. Fuer 1,20 braeuchte es S_MAX = 2,39. S_MAX ist ueber --smax=
// einstellbar und im Plan ausdruecklich als einziger gesetzter, nicht gemessener Wert des Pakets
// gefuehrt.
if (aktiv('C')) {
  patch(
    g('raids.js'),
    `    const killShares = contributionShares(playerResults);`,
    `    const killShares = contributionShares(playerResults);
    // ===== SIM13 Entscheidung 3: Beitragsanteile ueber die Wellen sammeln =====
    if (!raid.contribAcc) raid.contribAcc = {};
    Object.entries(killShares).forEach(([__name, __s]) => {
        raid.contribAcc[__name] = (raid.contribAcc[__name] || 0) + (__s || 0);
    });
    raid.contribWaves = (raid.contribWaves || 0) + 1;`,
    'C1 raids.js Beitragssammlung'
  );

  patch(
    g('raids.js'),
    `    const grantContainers = (target) => {
        if (raid.wavesWon <= 0)
            return;
        addContainers(target, 'silber', raid.wavesWon * RAID_WAVE_WIN_SILBER);
        addContainers(target, 'gold', raid.wavesWon * RAID_WAVE_WIN_GOLD);
        addContainers(target, 'elite', raid.wavesWon * RAID_WAVE_WIN_ELITE);
    };`,
    `    // ===== SIM13 Entscheidung 3, Variante 6 =====
    const __S_MAX = ${S_MAX};
    const __saettige = (x) => x / (1 + x / __S_MAX);
    const __wellen = Math.max(1, raid.contribWaves || 1);
    const grantContainers = (target, ownerName) => {
        if (raid.wavesWon <= 0)
            return;
        // Anteil am Topf: mittlerer Beitragsanteil ueber die gefochtenen Wellen. Ohne Beistand
        // ist er 1 und das Ergebnis identisch zur bisherigen Vollauszahlung.
        const __roh = ownerName === undefined
            ? 1
            : (raid.contribAcc?.[ownerName] || 0) / __wellen;
        if (!(__roh > 0)) return;
        // Saettigung ueber die TAGESSUMME der Anteile dieses Spielers, Bauform 9.1a. Ausgezahlt
        // wird der Zuwachs der gesaettigten Summe - dadurch ist die Reihenfolge der Raids eines
        // Tages ohne Belang.
        const __tag = Math.floor(Date.now() / 86400000);
        if (!target.raidYieldDay || target.raidYieldDay.tag !== __tag) {
            target.raidYieldDay = { tag: __tag, roh: 0 };
        }
        const __vorher = __saettige(target.raidYieldDay.roh);
        target.raidYieldDay.roh += __roh;
        const __anteil = __saettige(target.raidYieldDay.roh) - __vorher;
        if (!(__anteil > 0)) return;
        const __n = (proWelle) => Math.round(raid.wavesWon * proWelle * __anteil);
        if (__n(RAID_WAVE_WIN_SILBER) > 0) addContainers(target, 'silber', __n(RAID_WAVE_WIN_SILBER));
        if (__n(RAID_WAVE_WIN_GOLD) > 0) addContainers(target, 'gold', __n(RAID_WAVE_WIN_GOLD));
        if (__n(RAID_WAVE_WIN_ELITE) > 0) addContainers(target, 'elite', __n(RAID_WAVE_WIN_ELITE));
    };`,
    'C2 raids.js Topf + Saettigung'
  );

  patch(
    g('raids.js'),
    `    grantContainers(state);
    reinforcerStates.forEach(({ playerState }) => grantContainers(playerState));
    heldStates.forEach(({ ownerState }) => grantContainers(ownerState));`,
    `    grantContainers(state, ownerUsername);
    reinforcerStates.forEach(({ r, playerState }) => grantContainers(playerState, r.username));
    heldStates.forEach((h) => grantContainers(h.ownerState, \`\${h.ownerUsername} (haltende Flotte)\`));`,
    'C3 raids.js Topf-Verteilung'
  );
}

// ===================================================================================
// BLOCK D - ENTSCHEIDUNG 12: FRISCHLING-BONUS ADDITIV, FENSTER 14 TAGE
// ===================================================================================
// NOVICE_BONUS_ADD = 2,0 ist die woertliche additive Lesart der heutigen 3 (3 = 1 + 2) und
// bewusst KEINE neu erfundene Zahl. Fenster an NEWCOMER_GRACE_MS gekoppelt - fuer "Frischling"
// gibt es ab jetzt nur EINE Zahl.
//
// Die im Plan genannte Deklarationsfalle ist real und hier der Grund fuer das Anhaengen statt
// eines Ersetzens an Ort und Stelle: NOVICE_BONUS_WINDOW_MS steht in economy.ts auf Zeile 30,
// NEWCOMER_GRACE_MS erst auf Zeile 397. Ein Ersetzen an Ort und Stelle laese die Konstante an
// ihrer Verwendungsstelle als undefined.
if (aktiv('D')) {
  appendFileSync(resolve(OUT, 'game/data/economy.js'), `
// ===== SIM13: Entscheidung 12 - Frischling-Bonus additiv, Fenster an NEWCOMER_GRACE_MS =====
export const NOVICE_BONUS_ADD = 2;
export const NOVICE_BONUS_WINDOW_MS_SIM13 = NEWCOMER_GRACE_MS;
`);
  patches++;

  patch(
    g('missions.js'),
    `    return Date.now() - (state.createdAt || 0) < NOVICE_BONUS_WINDOW_MS;`,
    `    return Date.now() - (state.createdAt || 0) < NOVICE_BONUS_WINDOW_MS_SIM13;`,
    'D2 missions.js Fenster'
  );

  patch(
    g('missions.js'),
    `    const novice = isNoviceAccount(state) ? NOVICE_BONUS_MULTIPLIER : 1;`,
    `    const novice = 1; // SIM13 Entscheidung 12: wirkt jetzt additiv, siehe return`,
    'D3 missions.js novice-Faktor'
  );

  patch(
    g('missions.js'),
    `    return base * specific * economy * booster * novice * weeklyEvent;`,
    `    // ===== SIM13 Entscheidung 12: additiv statt multiplikativ =====
    return base * specific * economy * booster * novice * weeklyEvent
        + (isNoviceAccount(state) ? NOVICE_BONUS_ADD : 0);`,
    'D4 missions.js additive Form'
  );

  patch(
    g('missions.js'),
    `NOVICE_BONUS_MULTIPLIER, NOVICE_BONUS_WINDOW_MS,`,
    `NOVICE_BONUS_MULTIPLIER, NOVICE_BONUS_WINDOW_MS, NOVICE_BONUS_ADD, NOVICE_BONUS_WINDOW_MS_SIM13,`,
    'D5 missions.js Import'
  );
}

// ===================================================================================
// BLOCK E - ENTSCHEIDUNG 13.1: VIRTUELLER BOT-ERTRAG, ZEITBASIERT
// ===================================================================================
//   Feindmacht/Tag = k * combatFleetPowerBase(Bot-Flotte) * f          k = 4,0
//   Ertrag  = LOOT_CURVE_ANCHOR_VALUE * (Feindmacht/Tag / LOOT_CURVE_ANCHOR_POWER)^0,85
//   Verlust = 0,036 * Feindmacht/Tag * (1 - SALVAGE_SHARE)
// Beide Groessen werden als TAGESWERT gerechnet und dann ueber deltaSec/86400 anteilig verbucht -
// die Kurve ist nicht linear, eine Rechnung direkt auf der Delta-Feindmacht haette eine
// schrittgroessenabhaengige Rate ergeben. Genau das verlangt die Bau-Vorgabe aus 13.3: der
// virtuelle Ertrag MUSS zeitbasiert ueber deltaSec verbucht werden, NICHT je Bot-Zug.
//
// accrueBuildingProduction() ist der richtige Einhaengepunkt: es hat deltaSec und isNpcState()
// bereits zur Hand. Zirkelimport geprueft - actions.js importiert bereits aus combat.js
// (findShip, findDefense), combat.js importiert actions.js nicht.
//
// Der Ertrag tritt NEBEN die Piratenbasis-Beute und den Elite-Anteil, er ersetzt sie nicht
// (bot_yield_131.txt Befund 2). Wer ihn gegen "Bot hat nur Minen" kalibriert, zaehlt beide
// doppelt - das treibt f nach oben und ist die riskante Richtung, im Protokoll so ausgewiesen.
if (aktiv('E')) {
  patch(
    g('actions.js'),
    `import { findShip, findDefense } from './combat.js';`,
    `import { findShip, findDefense, combatFleetPowerBase } from './combat.js';
// ===== SIM13 Entscheidung 13.1 =====
import { LOOT_CURVE_EXPONENT, LOOT_CURVE_ANCHOR_POWER, LOOT_CURVE_ANCHOR_VALUE } from './data/economy.js';`,
    'E1 actions.js Import'
  );

  patch(
    g('actions.js'),
    `    const npcBonus = isNpcState(state) ? NPC_PRODUCTION_BONUS_MULTIPLIER : 1;`,
    `    const npcBonus = isNpcState(state) ? NPC_PRODUCTION_BONUS_MULTIPLIER : 1;
    // ===== SIM13 Entscheidung 13.1: virtueller Missions-Ertrag der KI-Mitspieler =====
    if (isNpcState(state)) {
        const __K = 4.0;
        const __F = ${F};
        const __VERLUST_JE_PUNKT = 0.036;
        const __BERGUNG = 0.3;
        const __macht = combatFleetPowerBase(state.fleet || {});
        if (__macht > 0) {
            const __feindProTag = __K * __macht * __F;
            const __ertragProTag = LOOT_CURVE_ANCHOR_VALUE * Math.pow(__feindProTag / LOOT_CURVE_ANCHOR_POWER, LOOT_CURVE_EXPONENT);
            const __verlustProTag = __VERLUST_JE_PUNKT * __feindProTag * (1 - __BERGUNG);
            const __anteilTag = deltaSec / 86400;
            // Ertrag in Wert-Einheiten, aufgeteilt so, dass Metall/Kristall/Deuterium 50/30/20 %
            // des WERTES stellen (Wert = M + 1,5*K + 3*D, dieselbe Gewichtung wie in den
            // Messskripten). Die Aufteilung ist eine SETZUNG, keine Messung - sie bewegt nur die
            // Zusammensetzung, nicht die Hoehe.
            const __wert = __ertragProTag * __anteilTag;
            state.resources.metall += (__wert * 0.5) / 1;
            state.resources.kristall += (__wert * 0.3) / 1.5;
            state.resources.deuterium += (__wert * 0.2) / 3;
            // Virtuelle Verlustrate. Ohne sie NICHT umsetzen (13.1): Ertrag ohne Verlust waere
            // eine monoton wachsende Flotte ohne jede Gegenkraft. Verbucht wird in einem
            // Konto, aus dem ganze Schiffe entfernt werden, sobald der Betrag dafuer reicht -
            // eine anteilige Zerstoerung von Bruchteilen gaebe es im Spiel nicht.
            state.virtualLossPending = (state.virtualLossPending || 0) + __verlustProTag * __anteilTag;
            const __ids = Object.keys(state.fleet || {}).filter((id) => (state.fleet[id] || 0) > 0);
            if (__ids.length > 0 && state.virtualLossPending > 0) {
                const __wertJe = (id) => {
                    const __s = findShip(id);
                    if (!__s || !__s.cost) return 0;
                    return (__s.cost.metall || 0) + (__s.cost.kristall || 0) * 1.5 + (__s.cost.deuterium || 0) * 3;
                };
                // Reihenfolge: guenstigste zuerst, damit ein kleiner Verlustbetrag nicht am
                // teuersten Schiff haengen bleibt und sich unbegrenzt aufstaut.
                __ids.sort((a, b) => __wertJe(a) - __wertJe(b));
                for (const __id of __ids) {
                    const __w = __wertJe(__id);
                    if (!(__w > 0)) continue;
                    const __moeglich = Math.min(state.fleet[__id], Math.floor(state.virtualLossPending / __w));
                    if (__moeglich > 0) {
                        state.fleet[__id] -= __moeglich;
                        state.virtualLossPending -= __moeglich * __w;
                    }
                }
            }
        }
    }`,
    'E2 actions.js virtueller Ertrag'
  );
}

// ===================================================================================
// KOPF DES BUILDS - damit ein spaeterer Lauf sieht, was drinsteckt
// ===================================================================================
writeFileSync(resolve(OUT, 'SIM13_BUILD.txt'), `SIMULATIONS-MESSBUILD SCHRITT 13
Erzeugt aus : ${SRC}
Bloecke     : ${NUR || 'A,B,C,D,E'}
f (13.1)    : ${F}
S_MAX (E3)  : ${S_MAX}
Patches     : ${patches}

ENTHALTEN : Block A Schritt 2 (verdrahtet), Entscheidung 18, 3, 12, 13.1.
            Entscheidung 16 stammt aus dem Eingangs-Build.
NICHT ENTHALTEN, BEGRUENDET: Entscheidung 19 (gemessen wirkungslos unter 20.000 eigenen
            Schiffen, volley_mission_19.txt Befund 1), R16, Piratenbasen-Offensive,
            Block B, 7.2/7.3.
NICHT GEBAUT: keine Zeile server/src wurde veraendert.
`);

console.log(`Simulations-Messbuild: ${OUT}`);
console.log(`  Eingang     : ${SRC}`);
console.log(`  Bloecke     : ${NUR || 'A,B,C,D,E'}`);
console.log(`  Patches     : ${patches} (jeder mit hartem Abbruch bei fehlendem Anker)`);
console.log(`  f = ${F}, S_MAX = ${S_MAX}`);
console.log(`  Datenbank landet unter ${resolve(OUT, '../data')}`);
console.log('  Quellcode unberuehrt.');
