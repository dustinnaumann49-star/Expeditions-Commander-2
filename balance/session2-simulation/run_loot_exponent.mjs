// Block A / Entscheidung 1 (Abschnitt 8, Punkt 1): Beute-Exponent 0,80 / 0,85 / 0,90 / 0,95.
//
// Kennzahl laut Plan: "Tage bis zum naechsten sinnvollen Ausbauschritt"
//   = Kosten des naechsten Schritts / Netto-Einnahmen pro Tag.
// Zielband 3-10 Tage ueber alle drei Ausbaustaende, nicht monoton wachsend.
//
// METHODIK
// --------
// 1. Der Exponent wird NICHT in den Spielcode eingebaut. Die Beute beeinflusst den Kampfverlauf
//    innerhalb einer Mission nicht - deshalb genuegt EIN Messlauf je Ausbaustand, auf dessen
//    Ergebnis alle Exponenten nachtraeglich aufgerechnet werden. Kein Eingriff in server/src.
// 2. Formel wie in Entscheidung 2: Beute = Basis * (vernichtete Feindmacht / Referenz)^e.
//    Anker (Basis/Referenz) = der MITTLERE Ausbaustand (Referenzflotte), getrennt je Quelle
//    (Solo-Sektoren einerseits, Elite-Bollwerk andererseits). Damit behaelt der mittlere Stand
//    exakt seine heutige Belohnung und der Exponent aendert NUR die Skalierung nach oben/unten.
//    Ein gemeinsamer Anker ueber beide Quellen wuerde das Elite-Bollwerk still um rund 70 %
//    kuerzen - das waere eine Balance-Aenderung, keine Messung.
// 3. Ein Anker fuer ALLE Solo-Stufen (niedrig/mittel/hoch) gemeinsam: nach Entscheidung 2 haengt
//    die Beute an der vernichteten Feindmacht, nicht am Sektor.
// 4. Alle Zahlen aus dem Code, nicht aus Beschreibungen (Messregel 16). Ausnahmen sind unten
//    unter SETZUNGEN einzeln benannt.
//
// Aufruf: node run_loot_exponent.mjs [N=40]
import * as L from './lib.mjs';
// Forschungsdaten direkt, statt lib.mjs zu erweitern - lib.mjs/lib3.mjs/lib4.mjs sind bewusst
// byte-identische Kopien, damit aeltere Skripte reproduzierbar bleiben.
const { RESEARCH } = await import('../../server/dist/game/data/research.js');

const { SEKTOR_CONFIG, PIRATEN_MULTIPLIER_ROLL } = L.sectors;
const { PIRATEN_CHECK_COUNT, ABBAU_BOOST_MULTIPLIER, ASTEROID_EVENT_MULTIPLIER } = L.economy;

const EXPONENTS = [0.80, 0.85, 0.90, 0.95];
const SALVAGE = 0.30;                       // Wrack-Bergung, bereits beschlossen (Abschnitt 1)
const BAND = [3, 10];                       // Zielband der Kennzahl in Tagen

// ---- SETZUNGEN (nicht aus dem Code ableitbar, hier gebuendelt sichtbar) --------------------
// Container-Erwartungswerte: gemessen in Session 1, in allen bisherigen Skripten identisch.
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
// Elite-Bollwerk: heutige Belohnung je 6-Check-Serie und reale Frequenz (Abschnitt 1).
const REWARD_ELITE_SERIES = 32.60e9;
const ELITE_CADENCE_DAYS = 3;
// Raid: KORRIGIERT am 15.08.2026 (run_raid_yield.mjs). Hier stand 16,58e9/4 = 4,145 Mrd/Tag je
// verteidigtem Raid, uebernommen aus dem Kasten bei Entscheidung 3. Diese Zahl war zu NIEDRIG - sie
// zaehlt nur die Container-Kategorie "Ressourcen" mit dem rohen chance-Wert. Aus dem Code gerechnet
// (alle Kategorien mit realChance, plus Jackpot) sind es 22,07 Mrd je Raid, bei Mi+So also
// 6,31 Mrd/Tag je verteidigtem Raid. Die 6,31 aus der Baseline in Abschnitt 1 waren nie falsch -
// sie zaehlen nur EINEN Raid statt der real 3,4.
// ACHTUNG: loot_exponent.txt im Repo stammt noch aus dem Lauf mit dem alten Wert. Nach der
// Raid-Entscheidung vom 15.08.2026 (Variante 6) ist das Skript ohnehin neu zu rechnen, dann mit
// einer eigenen Raid-Annahme fuer Variante 6 statt eines festen Werts je Raid.
const RAID_PER_DEFENDED_PER_DAY = 6.31e9;
// Heimatbasis: 554 Mio/Tag bei V1-Vollausbau (Abschnitt 1); frueh/mittel anteilig gesetzt.
const BASE_INCOME = { frueh: 55e6, mittel: 300e6, spaet: 554e6 };
// Woechentlicher Asteroiden-Event (Di/Do, x2) als Wochendurchschnitt.
const WEEKLY_EVENT_AVG = (2 * ASTEROID_EVENT_MULTIPLIER + 5) / 7;

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
const fleetValue = (f) => Object.entries(f).reduce((a, [id, n]) => a + n * unitValue(id), 0);
const mrd = (x) => `${(x / 1e9).toFixed(2)} Mrd`;

// ===== Ausbaustaende =========================================================================
// Flotte, Kampf-Profil, Mining-Ausbau und der Sektor, den dieser Stand tatsaechlich fliegt.
const STATES = [
  { key: 'frueh',  label: 'frueh',  fleet: L.FLEET_SMALL, profile: 'schwach',
    solo: ['piraten_mittel', 'piraten_hoch'], elite: false,
    miningLevel: 3,  abbauBooster: false, prospektor: false, raidsDefended: 0 },
  { key: 'mittel', label: 'mittel', fleet: L.FLEET_LARGE, profile: 'mittel',
    solo: ['piraten_hoch'], elite: true,
    miningLevel: 6,  abbauBooster: true,  prospektor: false, raidsDefended: 2 },
  { key: 'spaet',  label: 'spaet',  fleet: REAL_FLEET,    profile: 'voll',
    solo: ['piraten_hoch'], elite: true,
    miningLevel: 10, abbauBooster: true,  prospektor: true,  raidsDefended: 4 },
];

// ===== Asteroiden-Ertrag direkt aus den Code-Konstanten =====================================
function asteroidIncomePerDay(st) {
  const base = 1 + st.miningLevel * 0.10;          // miningMultiplier(), missions.ts
  const specific = 1 + st.miningLevel * 0.05;
  const booster = st.abbauBooster ? ABBAU_BOOST_MULTIPLIER : 1;
  const prospektor = st.prospektor ? 1.2 : 1;
  const mult = base * specific * booster * prospektor * WEEKLY_EVENT_AVG;
  let raw = 0;
  for (const id of ['asteroid_niedrig', 'asteroid_mittel', 'asteroid_hoch']) {
    const cfg = SEKTOR_CONFIG[id];
    raw += (cfg.miningCap || 0) * (cfg.farmRate || 0) * 24;   // Rohmenge pro Tag
  }
  // Aufteilung 50/30/20 auf Metall/Kristall/Deuterium (accrueFarming)
  return raw * mult * (0.5 + 0.3 * 1.5 + 0.2 * 3);
}

// ===== Kosten des naechsten Ausbauschritts ==================================================
// Hauptdefinition: +10 % eigener Flottenwert. Existiert in JEDEM Ausbaustand, waechst mit und
// entspricht dem Zielbild ("die Ziele wachsen mit"). Feste Listen sind laut Zielbild "Aufbau der
// ersten Monate" und ab mittlerem Ausbau aus der Portokasse bezahlt - sie laufen als Nebenzeile mit.
const FLEET_STEP_SHARE = 0.10;
const COMBAT_RESEARCH_IDS = ['waffen', 'schild', 'panzerung', 'zielerfassung', 'durchschlag',
  'schildregeneration', 'praezision', 'ausweichen', 'kritischetreffer'];

function researchStepCost(level) {
  // Kosten, alle 9 Kampfforschungen um EINE Stufe anzuheben (baseCost * costGrowth^level).
  let sum = 0;
  for (const id of COMBAT_RESEARCH_IDS) {
    const r = RESEARCH.find((x) => x.id === id);
    if (!r) continue;
    sum += val(r.baseCost) * Math.pow(r.costGrowth, level);
  }
  return sum;
}

// ===== Ein Kampf-Check gegen einen Sektor ====================================================
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
  const npcDefenses = L.combat.generateDefenseFleet(sentPower * (cfg.defenseFactor || 0), 0);
  const npc = { ...npcShips, ...npcDefenses };
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

// Komplette 24h-Solo-Mission (PIRATEN_CHECK_COUNT Checks, checkChance je Check,
// Verluste werden ueber die Checks mitgeschleppt).
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
  const rewardToday = wins * (cfg.winContainer.count * CONTAINER_EV[cfg.winContainer.tier] + val(cfg.winResources));
  return { wins, lost, rewardToday, destroyedPower };
}

// Elite-Bollwerk-Serie: checkChance 1, alle 6 Checks, feste Serien-Belohnung.
async function eliteSeries(state, fleet) {
  const ships = { ...fleet };
  let checks = 0, destroyedPower = 0;
  for (let c = 0; c < PIRATEN_CHECK_COUNT; c++) {
    const r = await oneCheck(state, 'piraten_elite', ships);
    if (!r) continue;
    destroyedPower += r.destroyedPower;
    if (r.anyDestroyed) checks++;
  }
  const lost = Object.entries(fleet).reduce((a, [id, n]) => a + (n - (ships[id] || 0)) * unitValue(id), 0);
  return { checks, lost, rewardToday: REWARD_ELITE_SERIES, destroyedPower };
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

// ===== Messung ===============================================================================
const N = Number(process.argv[2] || 40);
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say(`=== Entscheidung 1: Beute-Exponent - ${N} Durchlaeufe je Zelle ===`);
say(`Wrack-Bergung ${SALVAGE * 100} %, Zielband ${BAND[0]}-${BAND[1]} Tage, Checks je Mission: ${PIRATEN_CHECK_COUNT}`);
say();

const measured = {};
for (const st of STATES) {
  const state = L.stateFor(st.profile);
  const fv = fleetValue(st.fleet);
  const stk = Object.values(st.fleet).reduce((a, b) => a + b, 0);
  say(`--- Ausbaustand ${st.label}: ${stk.toLocaleString('de-DE')} Schiffe, ${mrd(fv)} Wert, ` +
      `Profil ${st.profile}, BasePower ${mrd(L.combat.combatFleetPowerBase(st.fleet))} ---`);
  measured[st.key] = { fleetValue: fv, solo: {}, elite: null };

  for (const sektorId of st.solo) {
    const r = await average(() => soloMission(state, sektorId, st.fleet), N);
    measured[st.key].solo[sektorId] = r;
    say(`  Solo ${sektorId.padEnd(15)} Siege ${r.wins.toFixed(1)}/${PIRATEN_CHECK_COUNT}  ` +
        `Beute heute ${mrd(r.rewardToday)}  Verlust ${mrd(r.lost)}  ` +
        `vernicht. Feindmacht ${mrd(r.destroyedPower)}`);
  }
  if (st.elite) {
    const r = await average(() => eliteSeries(state, st.fleet), N);
    measured[st.key].elite = r;
    say(`  Elite-Bollwerk        Checks ${r.checks.toFixed(1)}/${PIRATEN_CHECK_COUNT}  ` +
        `Beute heute ${mrd(r.rewardToday)}  Verlust ${mrd(r.lost)}  ` +
        `vernicht. Feindmacht ${mrd(r.destroyedPower)}`);
  }
  say(`  Asteroiden ${mrd(asteroidIncomePerDay(st))}/Tag  Heimatbasis ${mrd(BASE_INCOME[st.key])}/Tag  ` +
      `Raid ${mrd(st.raidsDefended * RAID_PER_DEFENDED_PER_DAY)}/Tag (${st.raidsDefended} verteidigt)`);
  say();
}

// ===== Anker ================================================================================
const anchorSolo = measured.mittel.solo['piraten_hoch'];
const anchorElite = measured.mittel.elite;
say('=== Anker (mittlerer Ausbaustand behaelt seine heutige Belohnung) ===');
say(`  Solo : Basis ${mrd(anchorSolo.rewardToday)} bei Referenz ${mrd(anchorSolo.destroyedPower)} vernicht. Feindmacht`);
say(`  Elite: Basis ${mrd(anchorElite.rewardToday)} bei Referenz ${mrd(anchorElite.destroyedPower)} vernicht. Feindmacht`);
say(`  Linearer Vergleichsfaktor Solo: ${(anchorSolo.rewardToday / anchorSolo.destroyedPower).toFixed(4)} Wert-Einheiten je Punkt Feindmacht`);
say();

const lootSolo = (dp, e) => anchorSolo.rewardToday * Math.pow(dp / anchorSolo.destroyedPower, e);
const lootElite = (dp, e) => anchorElite.rewardToday * Math.pow(dp / anchorElite.destroyedPower, e);

// ===== Auswertung je Exponent ================================================================
// exponent === null bedeutet "heutiger Zustand" (feste Container-Belohnung, keine Beute-Kurve).
function evaluate(exponent, raidFactor, eliteCurve = true) {
  const rows = [];
  for (const st of STATES) {
    // Sektorwahl je Exponent neu: nach Entscheidung 2 haengt die Beute an der vernichteten
    // Feindmacht, damit kann die beste Stufe eine andere sein als heute.
    let sektorId = null, soloNet = -Infinity;
    for (const [id, r] of Object.entries(measured[st.key].solo)) {
      const loot = exponent === null ? r.rewardToday : lootSolo(r.destroyedPower, exponent);
      const net = loot - r.lost * (1 - SALVAGE);
      if (net > soloNet) { soloNet = net; sektorId = id; }
    }
    const s = measured[st.key].solo[sektorId];
    const soloLoot = exponent === null ? s.rewardToday : lootSolo(s.destroyedPower, exponent);

    let eliteNet = 0, eliteLoot = 0;
    if (measured[st.key].elite) {
      const e = measured[st.key].elite;
      eliteLoot = (exponent === null || !eliteCurve) ? e.rewardToday : lootElite(e.destroyedPower, exponent);
      eliteNet = (eliteLoot - e.lost * (1 - SALVAGE)) / ELITE_CADENCE_DAYS;
    }
    const flat = asteroidIncomePerDay(st) + BASE_INCOME[st.key]
      + st.raidsDefended * RAID_PER_DEFENDED_PER_DAY * raidFactor;
    const net = soloNet + eliteNet + flat;
    const fv = measured[st.key].fleetValue;
    const stepResearch = researchStepCost(st.profile === 'schwach' ? 3 : st.profile === 'mittel' ? 6 : 10);
    rows.push({
      st, sektorId, net, soloNet, eliteNet, flat, soloLoot, eliteLoot,
      yield: net / fv,                                    // Tagesrendite auf den Flottenwert
      daysFleet: net > 0 ? (fv * FLEET_STEP_SHARE) / net : Infinity,
      daysDouble: net > 0 ? fv / net : Infinity,          // Flotte verdoppeln
      daysResearch: net > 0 ? stepResearch / net : Infinity,
      stepResearch,
    });
  }
  return rows;
}

const fmtDays = (d) => !isFinite(d) ? 'nie' : d >= 1 ? `${d.toFixed(2)} d` : `${(d * 24).toFixed(1)} h`;

for (const [withRaid, eliteCurve] of [[1, true], [0, true], [1, false], [0, false]]) {
  say(`=== Kennzahl "Tage bis zum naechsten Ausbauschritt" - Beute-Kurve auf ${eliteCurve ? 'Solo UND Elite' : 'NUR Solo (Elite bleibt fest)'}, ${withRaid ? 'Raid unveraendert' : 'ohne Raid'} ===`);
  say(`Schritt = +10 % Flottenwert. Zielband ${BAND[0]}-${BAND[1]} Tage.`);
  say('Exponent'.padEnd(12) + STATES.map((s) => s.label.padStart(12)).join('') + '    Verlauf');
  for (const e of [null, ...EXPONENTS]) {
    const rows = evaluate(e, withRaid, eliteCurve);
    const days = rows.map((r) => r.daysFleet);
    const monotone = days[0] < days[1] && days[1] < days[2];
    const inBand = days.every((d) => d >= BAND[0] && d <= BAND[1]);
    say((e === null ? 'heute' : e.toFixed(2)).padEnd(12) +
        days.map((d) => fmtDays(d).padStart(12)).join('') +
        `    ${monotone ? 'monoton steigend' : 'nicht monoton'}, ${inBand ? 'im Band' : 'ausserhalb Band'}`);
  }
  say();
  say('Dieselbe Rechnung als Tagesrendite auf den Flottenwert (Netto pro Tag / Flottenwert):');
  say('Exponent'.padEnd(12) + STATES.map((s) => s.label.padStart(12)).join(''));
  for (const e of [null, ...EXPONENTS]) {
    const rows = evaluate(e, withRaid, eliteCurve);
    say((e === null ? 'heute' : e.toFixed(2)).padEnd(12) +
        rows.map((r) => `${(r.yield * 100).toFixed(0)} %`.padStart(12)).join(''));
  }
  say();
  say('Grosser Schritt = Flotte verdoppeln:');
  say('Exponent'.padEnd(12) + STATES.map((s) => s.label.padStart(12)).join(''));
  for (const e of [null, ...EXPONENTS]) {
    const rows = evaluate(e, withRaid, eliteCurve);
    say((e === null ? 'heute' : e.toFixed(2)).padEnd(12) +
        rows.map((r) => fmtDays(r.daysDouble).padStart(12)).join(''));
  }
  say();
}

// ===== Nebenzeile: feste Listen ==============================================================
say('=== Nebenzeile: Schritt = naechste Stufe ALLER 9 Kampfforschungen (feste Liste) ===');
for (const r of evaluate(0.85, true)) {
  say(`  ${r.st.label.padEnd(8)} Kosten ${mrd(r.stepResearch)} -> ${fmtDays(r.daysResearch)}`);
}
say();

// ===== Grosse feste Ausbauziele ==============================================================
// Werte aus der bestehenden Kostenmessung (costs.txt, Abschnitt 9 "Alle Ressourcen-Senken").
// Sie sind EINMALIG - nach ihrem Kauf bleibt nur noch Flottenwachstum als Ziel uebrig.
const BIG_SINKS = [
  ['Alle Schiffs-Module Stufe 10', 141.97e9],
  ['Heimatbasis V1 voll (36/32/30)', 197.97e9],
  ['Heimatbasis V2 voll', 395.94e9],
  ['Alle Gebaeude-Module Stufe 10', 44.38e9],
];
say('=== Grosse feste Ausbauziele (einmalig) gegen die Netto-Einnahmen, Exponent 0,85, inkl. Raid ===');
{
  const rows = evaluate(0.85, true, true);
  say('Ziel'.padEnd(34) + 'Kosten'.padStart(12) + STATES.map((s) => s.label.padStart(12)).join(''));
  for (const [name, cost] of BIG_SINKS) {
    say(name.padEnd(34) + mrd(cost).padStart(12) +
        rows.map((r) => fmtDays(cost / r.net).padStart(12)).join(''));
  }
}
say();

// ===== Wirkung der Beute-Kurve auf die einzelnen Quellen =====================================
say('=== Was die Beute-Kurve mit der Belohnung macht (Solo-Mission, 24h) ===');
say('Stand'.padEnd(10) + 'heute'.padStart(12) + EXPONENTS.map((e) => e.toFixed(2).padStart(12)).join(''));
for (const st of STATES) {
  const row = evaluate(null, true).find((r) => r.st.key === st.key);
  const s = measured[st.key].solo[row.sektorId];
  say(st.label.padEnd(10) + mrd(s.rewardToday).padStart(12) +
      EXPONENTS.map((e) => mrd(lootSolo(s.destroyedPower, e)).padStart(12)).join(''));
}
say();
say('=== Dasselbe fuer das Elite-Bollwerk (je 24h-Serie) ===');
say('Stand'.padEnd(10) + 'heute'.padStart(12) + EXPONENTS.map((e) => e.toFixed(2).padStart(12)).join(''));
for (const st of STATES) {
  const e0 = measured[st.key].elite;
  if (!e0) continue;
  say(st.label.padEnd(10) + mrd(e0.rewardToday).padStart(12) +
      EXPONENTS.map((e) => mrd(lootElite(e0.destroyedPower, e)).padStart(12)).join(''));
}
say();

// ===== Diagnose: welcher Exponent macht die Kennzahl flach? ==================================
// Gesucht: e, bei dem Tagesrendite(frueh) = Tagesrendite(spaet). Liegt die Loesung ausserhalb
// von 0,80-0,95, ist der Suchraum des Plans zu eng gewaehlt.
function spread(e, raidFactor, eliteCurve) {
  const rows = evaluate(e, raidFactor, eliteCurve);
  return rows[2].yield / rows[0].yield;   // >1 = spaet verdient relativ mehr, <1 = frueh
}
say('=== Diagnose: Verhaeltnis Tagesrendite spaet / frueh ===');
say('(1,00 waere ein flacher Verlauf - die Kennzahl bliebe ueber alle Staende gleich)');
const EXPO_SCAN = [0.80, 0.85, 0.90, 0.95, 1.00, 1.10, 1.20];
for (const [rf, eliteCurve] of [[1, true], [0.5, true], [0, true], [1, false], [0.5, false], [0, false]]) {
  const line = EXPO_SCAN.map((e) => `${e.toFixed(2)}: ${spread(e, rf, eliteCurve).toFixed(2)}`).join('   ');
  say(`  ${(eliteCurve ? 'Solo+Elite' : 'nur Solo  ')}, Raid x${rf.toFixed(1)} ${line}`);
}
say();
// Empfindlichkeitspruefung: der fruehe Stand verteidigt im Hauptmodell KEINEN Raid (nach der
// Risikotabelle in Abschnitt 1a verliert er ihn bei schwachem Ausbau vollstaendig). Verteidigt er
// doch einen, steigen seine Einnahmen und der flache Punkt verschiebt sich nach oben.
say('Empfindlichkeit: derselbe Wert, wenn der fruehe Stand EINEN Raid verteidigt:');
STATES[0].raidsDefended = 1;
for (const eliteCurve of [true, false]) {
  const line = EXPO_SCAN.map((e) => `${e.toFixed(2)}: ${spread(e, 1, eliteCurve).toFixed(2)}`).join('   ');
  say(`  ${(eliteCurve ? 'Solo+Elite' : 'nur Solo  ')}, Raid x1.0 ${line}`);
}
STATES[0].raidsDefended = 0;
say();

// ===== Entscheidungstabelle =================================================================
// Der Raid ist noch nicht entschieden (Entscheidung 3 + offener Punkt in Abschnitt 7: die
// Halbierung reicht nachweislich nicht). Deshalb wird der Exponent NICHT gegen eine einzelne
// Raid-Annahme gewaehlt, sondern gegen den ungueltigsten Fall ueber drei Annahmen hinweg:
// Raid unveraendert, Raid halbiert, Raid entfaellt. Gesucht ist der Exponent mit der kleinsten
// groessten Abweichung von einem flachen Verlauf (Verhaeltnis 1,00).
say('=== Entscheidungstabelle: Abweichung vom flachen Verlauf je Raid-Annahme (Solo+Elite) ===');
say('Exponent'.padEnd(12) + 'Raid x1.0'.padStart(12) + 'Raid x0.5'.padStart(12) + 'Raid x0.0'.padStart(12) + 'groesste Abw.'.padStart(16));
let best = null;
for (const e of EXPONENTS) {
  const vals = [1, 0.5, 0].map((rf) => spread(e, rf, true));
  const worst = Math.max(...vals.map((v) => Math.abs(v - 1)));
  if (best === null || worst < best.worst - 1e-9) best = { e, worst };
  say(e.toFixed(2).padEnd(12) + vals.map((v) => v.toFixed(2).padStart(12)).join('') +
      `${(worst * 100).toFixed(0)} %`.padStart(16));
}
say();
say(`Kleinste groesste Abweichung: Exponent ${best.e.toFixed(2)} (${(best.worst * 100).toFixed(0)} %).`);
say('Liegen zwei Exponenten dicht beieinander, gilt die Planregel "bei Uneindeutigkeit den');
say('niedrigeren Wert nehmen" (Abschnitt 8, Punkt 1).');

const fs = await import('node:fs');
fs.writeFileSync('loot_exponent.txt', out.join('\n') + '\n');
process.exit(0);
