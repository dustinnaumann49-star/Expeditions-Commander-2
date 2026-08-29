// !!! MESSBUILD-SKRIPT - LAEUFT NICHT GEGEN DEN REPO-STAND !!!
//   node make_messbuild_kum.mjs      /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
//   node make_messbuild_botrate.mjs  /tmp/mb_kum /tmp/br5   --schiffe=5      (usw.)
//   node run_bot_baurate.mjs --builds=5:/tmp/br5,25:/tmp/br25 --tage=14 [--out=...]
//
// ===================================================================================
// WAS HIER GEMESSEN WIRD UND WARUM
// ===================================================================================
// Frage (Nutzerbeobachtung 28.08.2026): Die beiden Bots horten rund 26 Mrd Ressourcen und
// haben trotzdem nur 21-29 Schiffe je Typ. Bringt eine Kopplung des Stueckzahldeckels an den
// Kontostand eine spuerbar groessere Bot-Flotte - und was passiert dabei mit der Verteidigung
// und dem Guthaben?
//
// AUFBAU: EIN Bot, isolierte Datenbank, fester 2-Minuten-Takt, `runEconomyTick()` +
// `runEconomyBotTurn()` - genau das Verfahren, mit dem in Entscheidung 13.1 der Engpass
// geprueft wurde. Kein Mensch, keine Missionen, keine Kaempfe: gemessen wird ausschliesslich,
// was der Bot aus seinem Guthaben macht.
//
// DETERMINISTISCH ODER NICHT: `runEconomyBotTurn()` enthaelt keine Zufallsentscheidung, die
// Bauwahl haengt nur an Bestand und Guthaben. Serien waeren hier Scheingenauigkeit - deshalb
// EIN Lauf je Zelle, und die Zellen unterscheiden sich ausschliesslich im Deckel. Sollte sich
// das aendern, faellt es an der Wiederholungsprobe unten auf (--wdh=2 laeuft jede Zelle
// zweimal und meldet jede Abweichung).
//
// STARTZUSTAND: nachgebildet aus den beiden echten Bots (Screenshots vom 29.08.2026, 02:24) -
// Minen 21/20/19, Solar 22, Robo 5, Nanite 7, rund 26 Mrd Guthaben, Flotte und Verteidigung
// wie beobachtet. Damit misst der Lauf die Lage, in der die Bots TATSAECHLICH stehen, statt
// eine gruene Wiese.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const t = process.argv.find((a) => a.startsWith(`--${n}=`)); return t ? t.slice(n.length + 3) : d; };
const TAGE = Number(arg('tage', '14'));
const WDH = Number(arg('wdh', '1'));
const AUSGABE = arg('out', null);
const BUILDS = (arg('builds', null) || '').split(',').filter(Boolean).map((s) => {
  const i = s.indexOf(':'); if (i < 0) throw new Error(`--builds Form <name>:<pfad>, bekam: ${s}`);
  return { name: s.slice(0, i), dist: path.resolve(s.slice(i + 1)) };
});
if (!BUILDS.length) throw new Error('--builds fehlt, z.B. --builds=5:/tmp/br5,dyn:/tmp/brdyn');

const TRADE = { metall: 1, kristall: 1.5, deuterium: 3 };
const val = (c) => (c.metall || 0) * TRADE.metall + (c.kristall || 0) * TRADE.kristall + (c.deuterium || 0) * TRADE.deuterium;
const mrd = (x) => (x / 1e9).toFixed(2);

// Beobachteter Startzustand, siehe Kopf.
const START_RES = { metall: 12_176_968_430, kristall: 7_311_122_029, deuterium: 6_873_278_774 };
const START_BUILDINGS = { metallmine: 21, kristallmine: 20, deuteriumsynthesizer: 19, solarkraftwerk: 22, roboterfabrik: 5, nanitenfabrik: 7 };
const START_RESEARCH = { waffentechnik: 6, schildtechnik: 7, panzerungstechnik: 6, schiffbaureduktion: 6, miningeffizienz: 3, spionage: 2, zielerfassung: 3, durchschlag: 2, schildregeneration: 3, praezision: 2, ausweichen: 3, antriebstechnik: 2 };
const START_FLEET = { leicht: 21, schwer: 22, kreuzer: 21, schlachtschiff: 21, bomber: 25, schlachtkreuzer: 25, zerstoerer: 23, reaper: 20, spionagesonde: 4 };
const START_DEFENSE = { raketenwerfer: 18682, leichteslaser: 124, schwereslaser: 90, gausskanone: 80, ionengeschuetz: 80, plasmawerfer: 80, kleineschildkuppel: 1, sentinelkanone: 80, ultimatekanone: 60 };

async function fahre(zelle, lauf) {
  // db.js loest seinen Datenordner als `__dirname/../data` auf. Die Kopie muss deshalb eine
  // Ebene TIEFER liegen (<wurzel>/dist), sonst landet die Datenbank in /tmp/data und wird von
  // allen Zellen und allen anderen Messskripten geteilt - der erste Lauf legt den Nutzer an,
  // jeder weitere bricht mit UNIQUE constraint ab. Muster wie /tmp/sim13/dist.
  const WURZEL = path.join(os.tmpdir(), `ec-botrate-${zelle.name}-${lauf}`);
  const TMP = path.join(WURZEL, 'dist');
  fs.rmSync(WURZEL, { recursive: true, force: true });
  fs.cpSync(zelle.dist, TMP, { recursive: true });
  const NM = path.resolve(HERE, '../../server/node_modules');
  if (!fs.existsSync(NM)) throw new Error(`node_modules fehlt: ${NM}`);
  try { fs.symlinkSync(NM, path.join(TMP, 'node_modules'), 'junction'); } catch { /* da */ }
  fs.mkdirSync(path.join(WURZEL, 'data'), { recursive: true });

  const imp = (rel) => import(pathToFileURL(path.join(TMP, rel)).href + `?v=${zelle.name}-${lauf}`);
  const db = await imp('db.js');
  const stateMod = await imp('game/state.js');
  const actions = await imp('game/actions.js');
  const botMod = await imp('game/economyBotTurn.js');
  const combat = await imp('game/combat.js');
  const { SHIPS } = await imp('game/data/ships.js');
  const { DEFENSES } = await imp('game/data/defenses.js');

  const einheit = (id) => SHIPS.find((x) => x.id === id) || DEFENSES.find((d) => d.id === id);
  const wertVon = (bestand) => Object.entries(bestand || {}).reduce((a, [id, n]) => {
    const e = einheit(id); return a + (e?.cost ? n * val(e.cost) : 0);
  }, 0);

  // createUser() liefert das USER-OBJEKT (getUserById), nicht die id - im dist nachgesehen.
  const user = db.createUser(`botrate_${zelle.name}_${lauf}`, 'x', true);
  const uid = user.id;
  const s = stateMod.loadPlayerState(uid);
  s.resources = { ...START_RES };
  s.buildings = { ...s.buildings, ...START_BUILDINGS };
  s.research = { ...s.research, ...START_RESEARCH };
  s.fleet = { ...START_FLEET };
  s.defense = { ...START_DEFENSE };
  s.isBot = true;
  botMod.maybeChooseClass?.(s);
  stateMod.savePlayerState(s);

  const START = Date.UTC(2026, 0, 5, 0, 0, 0);
  const SCHRITT = 120_000;                 // 2-Minuten-Takt wie in 13.1
  const schritte = (TAGE * 24 * 3600_000) / SCHRITT;
  const echteNow = Date.now;
  let jetzt = START;
  Date.now = () => jetzt;
  try {
    for (let i = 0; i < schritte; i++) {
      jetzt = START + i * SCHRITT;
      const bs = stateMod.loadPlayerState(uid);
      await actions.runEconomyTick(bs);
      botMod.runEconomyBotTurn(bs);
      stateMod.savePlayerState(bs);
    }
  } finally { Date.now = echteNow; }

  const e = stateMod.loadPlayerState(uid);
  const flottenmacht = combat.combatFleetPowerBase(e.fleet || {});
  return {
    zelle: zelle.name,
    flottenmacht,
    flottenwert: wertVon(e.fleet),
    verteidigungswert: wertVon(e.defense),
    guthaben: val(e.resources),
    schiffeGesamt: Object.entries(e.fleet || {}).filter(([id]) => id !== 'spionagesonde').reduce((a, [, n]) => a + n, 0),
    flotte: { ...e.fleet },
    minen: { metall: e.buildings.metallmine, kristall: e.buildings.kristallmine, deut: e.buildings.deuteriumsynthesizer },
  };
}

const ergebnisse = [];
for (const zelle of BUILDS) {
  for (let w = 1; w <= WDH; w++) {
    process.stdout.write(`\r  ${zelle.name} (Lauf ${w}/${WDH})        `);
    ergebnisse.push(await fahre(zelle, w));
  }
}
process.stdout.write('\n');

// Wiederholungsprobe: runEconomyBotTurn() soll deterministisch sein. Weicht ein zweiter Lauf ab,
// ist die Annahme falsch und alle Einzelwerte unten sind Stichproben statt Rechnungen.
if (WDH > 1) {
  for (const zelle of BUILDS) {
    const w = ergebnisse.filter((r) => r.zelle === zelle.name).map((r) => r.flottenmacht);
    const gleich = w.every((x) => x === w[0]);
    console.log(`Wiederholungsprobe ${zelle.name}: ${gleich ? 'deterministisch (identisch)' : 'ABWEICHUNG - ' + w.join(' / ')}`);
  }
  console.log();
}

const START_MACHT_HINWEIS = 'Startbestand: 178 Kampfschiffe, Verteidigung wie beobachtet.';
console.log('='.repeat(78));
console.log(`BOT-BAURATE - ${TAGE} Tage, 2-Minuten-Takt, EIN Bot, keine Kaempfe. MESSBUILD-WERTE.`);
console.log(START_MACHT_HINWEIS);
console.log('='.repeat(78));
console.log('Zelle       Kampfschiffe   Flottenmacht   Flottenwert   Verteidigungswert   Restguthaben');
const ersteJeZelle = BUILDS.map((z) => ergebnisse.find((r) => r.zelle === z.name));
for (const r of ersteJeZelle) {
  console.log(
    r.zelle.padEnd(12) + String(r.schiffeGesamt).padStart(12) +
    (r.flottenmacht / 1e6).toFixed(1).padStart(15) + ' M' +
    mrd(r.flottenwert).padStart(12) + ' Mrd' +
    mrd(r.verteidigungswert).padStart(16) + ' Mrd' +
    mrd(r.guthaben).padStart(13) + ' Mrd'
  );
}
const basis = ersteJeZelle[0];
if (ersteJeZelle.length > 1) {
  console.log('\nVERHAELTNIS ZUR ERSTEN ZELLE:');
  for (const r of ersteJeZelle.slice(1)) {
    console.log(`  ${r.zelle.padEnd(10)} Kampfschiffe x${(r.schiffeGesamt / basis.schiffeGesamt).toFixed(2)}` +
      `   Flottenmacht x${(r.flottenmacht / basis.flottenmacht).toFixed(2)}` +
      `   Restguthaben x${(r.guthaben / basis.guthaben).toFixed(2)}`);
  }
}
console.log('\nFLOTTE JE TYP (erste Zelle je Deckel):');
const typen = [...new Set(ersteJeZelle.flatMap((r) => Object.keys(r.flotte)))].filter((t) => t !== 'spionagesonde');
console.log('  Typ                ' + ersteJeZelle.map((r) => r.zelle.padStart(10)).join(''));
for (const t of typen) {
  console.log('  ' + t.padEnd(19) + ersteJeZelle.map((r) => String(r.flotte[t] || 0).padStart(10)).join(''));
}

if (AUSGABE) {
  fs.writeFileSync(AUSGABE, JSON.stringify({ tage: TAGE, wdh: WDH, builds: BUILDS, ergebnisse }, null, 2));
  console.log(`\nRohdaten: ${AUSGABE}`);
}
