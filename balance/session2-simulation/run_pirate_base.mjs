// Entscheidung 5 (Block C, Schritt 7) - Piratenbasen: Garnison skaliert mit.
//
// UMGEBAUT AM 18.08.2026. Die vorherige Fassung mass den ALTEN Zustand (feste Garnison, feste
// Beute) und hatte zwei Maengel, die beide unter Messregel 16 fallen:
//   (a) sie spiegelte SEED_FLEET/SEED_DEFENSE/RESOURCE_CAP/LOOT_PERCENT von HAND, weil
//       pirateBaseState.ts ueber state.ts die Datenbank oeffnet und nicht importierbar ist. Die
//       Konstanten stehen jetzt in data/economy.ts, der Rechenteil in game/pirateBaseCombat.ts -
//       beides ohne Datenbank-Bezug und hier direkt importiert. Keine Kopie mehr.
//   (b) sie liess `sideBStatsOverride` weg, kaempfte also gegen eine Garnison ohne jede Forschung,
//       waehrend das Spiel getEffectiveStats() durchreicht.
//
// GEMESSEN WIRD pro Zelle: Wertverlust der Angriffsflotte, vernichtete Garnisonsmacht, Beute nach
// der Kurve aus Entscheidung 2, Netto je Angriff.
//
// ABNAHMEBAND (Zielniveau aus Entscheidung 5: "zwischen Solo-Sektor Hoch und Elite-Bollwerk").
// Umgerechnet auf EINEN Kampf, aus real_fleet.txt (Neumessung nach R14, 40 Laeufe, reale Flotte
// 34,99 Mrd Wert): Solo Hoch verliert 4,40 Mrd ueber 6 Checks = 2,1 % je Check, das Elite-Bollwerk
// 9,20 Mrd ueber 6 Checks = 4,4 % je Check. Ein Angriff auf eine Basis soll also rund 2 bis 4,5 %
// des eingesetzten Flottenwerts kosten.
//
// DATENBANK: dieses Skript importiert bewusst KEIN Modul, das db.ts laedt (pirateBaseState.ts,
// state.ts, actions.ts). Es fasst damit keinen Spielstand an, weder lokal noch produktiv.
//
// Aufruf (scheibenweise, Ergebnis wird sofort angehaengt):
//   node run_pirate_base.mjs kontext
//   node run_pirate_base.mjs kandidat <A|B|C> <klein|gross|real> [laeufe] [profil]
//   node run_pirate_base.mjs serie <klein|gross|real> [angriffe] [laeufe] [profil]
import { appendFileSync } from 'node:fs';
import { combat, runner, ships, defenses, stateFor, value, pct, mio, mrd } from './lib4.mjs';

const D = process.env.MESSBUILD ? `${process.env.MESSBUILD}/game` : '../../server/dist/game';
const pbc = await import(`${D}/pirateBaseCombat.js`);
const economy = await import(`${D}/data/economy.js`);
const sectors = await import(`${D}/data/sectors.js`);

const [, , MODE, ...rest] = process.argv;
const OUT = 'pirate_base.txt';

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]).concat(defenses.DEFENSES.map((d) => [d.id, d])));
const unitValue = (id) => (byId[id]?.cost ? value(byId[id].cost) : 0);
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * unitValue(id), 0);
const lootValue = (l) => value(l);

// Kandidaten-Tabellen fuer PIRATE_BASE_MULTIPLIER_ROLL. B ist der ausgelieferte Wert; A und C sind
// die Vergleichszellen. Zielkorridor laut Entscheidung 5: zwischen piraten_hoch und piraten_elite.
// Bewusst LITERALE Tabellen, nicht economy.PIRATE_BASE_MULTIPLIER_ROLL: die Bezeichner A-D muessen
// im Protokoll dieselbe Bedeutung behalten, auch nachdem der ausgelieferte Wert auf den Sieger
// umgestellt wurde. D ist nach dem ersten Sweep dazugekommen (A-C blieben alle unter dem
// Abnahmeband, Begruendung im Protokoll unter Punkt 5).
const KANDIDATEN = {
  A: [0.75, 1.0, [1.05, 1.25]],
  B: [0.85, 1.1, [1.2, 1.4]],
  C: [0.95, 1.25, 1.5],
  D: [1.15, 1.45, [1.7, 1.9]],
};

// Angriffsflotten wie in der Fassung vor dem 18.08.2026 - damit die neuen Zahlen direkt gegen die
// alten (89,5 % / 0,3 % / 0,0 %) lesbar bleiben.
const FLEETS = {
  klein: { leicht: 400, schwer: 250, kreuzer: 120, schlachtschiff: 60, schlachtkreuzer: 40, zerstoerer: 25, reaper: 15 },
  gross: { leicht: 2000, schwer: 1500, kreuzer: 1000, schlachtschiff: 600, bomber: 300, schlachtkreuzer: 400, zerstoerer: 300, reaper: 200, imperator: 2, salvenkreuzer: 20, salvendreadnought: 10 },
  real: { leicht: 12000, schwer: 9000, kreuzer: 8000, schlachtschiff: 5000, bomber: 2500, schlachtkreuzer: 3500, zerstoerer: 2500, reaper: 1700, imperator: 6, salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30 },
};

function freshBasePool() {
  return {
    fleet: { ...economy.PIRATE_BASE_SEED_FLEET },
    defense: { ...economy.PIRATE_BASE_SEED_DEFENSE },
    research: {}, // frische Basis: Forschungsstufe 0, wie defaultPlayerState() sie anlegt
  };
}

function say(line) {
  console.log(line);
  appendFileSync(OUT, line + '\n');
}

/** EIN Angriff, exakt nach dem Ablauf in resolvePirateBaseAttack(). */
async function oneAttack(fleet, pool, attacker, table) {
  const sentPower = combat.combatFleetPowerBase(fleet);
  const g = pbc.rollPirateBaseGarrison(pool.fleet, pool.defense, sentPower, table);
  const npc = {};
  Object.entries(g.ships).forEach(([id, n]) => { if (n > 0) npc[id] = n; });
  Object.entries(g.defenses).forEach(([id, n]) => { if (n > 0) npc[id] = (npc[id] || 0) + n; });
  if (Object.keys(npc).length === 0) {
    return { lost: 0, destroyedPower: 0, loot: { metall: 0, kristall: 0, deuterium: 0 }, readiness: g.readiness, multiplier: g.multiplier, waveDestroyedShare: 0 };
  }

  const effResearch = pbc.garrisonResearch(pool.research, attacker.research);
  const sideBStatsOverride = {};
  Object.keys(npc).forEach((id) => {
    sideBStatsOverride[id] = combat.getEffectiveStats(id, effResearch, g.defenses, false, null, {});
  });

  const r = await runner.runCombatInWorker({
    sideAShips: fleet,
    sideBShips: npc,
    research: attacker.research,
    playerClass: attacker.playerClass,
    kampfBoostActive: true,
    shipModules: attacker.shipModules,
    sideBStatsOverride,
  });

  const rest2 = {};
  Object.keys(fleet).forEach((id) => (rest2[id] = r.survivorsA[id] || 0));
  const lost = fleetValue(fleet) - fleetValue(rest2);

  let destroyedPower = 0;
  const wavePower = combat.combatFleetPowerBase(npc);
  Object.keys(npc).forEach((id) => {
    const destroyed = npc[id] - (r.survivorsB[id] || 0);
    if (destroyed > 0) destroyedPower += combat.combatFleetPowerBase({ [id]: destroyed });
    // Verlustanteil auf den echten Bestand durchschlagen lassen, gedeckelt - wie im Spiel
    const share = npc[id] > 0 ? pbc.attritionShare(destroyed / npc[id]) : 0;
    if (share > 0) {
      if (pbc.isDefenseUnitId(id)) pool.defense[id] = Math.floor((pool.defense[id] || 0) * (1 - share));
      else pool.fleet[id] = Math.floor((pool.fleet[id] || 0) * (1 - share));
    }
  });

  return {
    lost,
    destroyedPower,
    loot: pbc.pirateBaseLoot(destroyedPower),
    readiness: g.readiness,
    multiplier: g.multiplier,
    waveDestroyedShare: wavePower > 0 ? destroyedPower / wavePower : 0,
  };
}

if (MODE === 'kontext') {
  const pool = freshBasePool();
  say('');
  say('=== ENTSCHEIDUNG 5 UMGESETZT (18.08.2026) - NEUE MESSREIHE ===');
  say('Alles darueber ist gegen den ALTEN Stand gelaufen (feste Garnison, Beute = 35 % des');
  say('gedeckelten Lagerbestands) und mit den Zeilen darunter NICHT vergleichbar.');
  say('');
  say('--- 1. Bezugsgroessen ---');
  say(`  Grundbestand einer frischen Basis: ${Object.values(pool.fleet).reduce((a, b) => a + b, 0)} Schiffe + ${Object.values(pool.defense).reduce((a, b) => a + b, 0)} Anlagen`);
  say(`  Machtwert dieses Grundbestands (= 100 % Gefechtsbereitschaft): ${mrd(pbc.PIRATE_BASE_FULL_STRENGTH_POWER)}`);
  say(`  Wuerfeltabelle (ausgeliefert): [${economy.PIRATE_BASE_MULTIPLIER_ROLL.map((e) => (Array.isArray(e) ? `${e[0]}-${e[1]}` : e)).join(' / ')}]`);
  say(`  Zum Vergleich piraten_hoch: [${sectors.PIRATEN_MULTIPLIER_ROLL.piraten_hoch.map((e) => (Array.isArray(e) ? `${e[0]}-${e[1]}` : e)).join(' / ')}], piraten_elite: [${sectors.PIRATEN_MULTIPLIER_ROLL.piraten_elite.join(' / ')}]`);
  say(`  Anlagen-Faktor ${economy.PIRATE_BASE_DEFENSE_FACTOR} (Hoch 0.15, Elite 0.18)`);
  say(`  Erholungszeit ${economy.PIRATE_BASE_RECOVERY_MS / 3600000} h -> hoechstens ${(24 / (economy.PIRATE_BASE_RECOVERY_MS / 3600000)).toFixed(1)} Angriffe je Basis und Tag`);
  say('');
  say('--- 2. Beute-Kurve (Entscheidung 2), Kontrollpunkte ---');
  [1e9, 5e9, 11.18e9, 20e9, 50e9].forEach((p) => {
    say(`  ${mrd(p).padStart(10)} vernichtete Feindmacht -> ${mrd(lootValue(pbc.pirateBaseLoot(p)))} Beutewert`);
  });
  say(`  Ankerprobe (muss 1,05 Mrd ergeben): ${mrd(lootValue(pbc.pirateBaseLoot(economy.LOOT_CURVE_ANCHOR_POWER)))}`);
  say('');
  say('--- 3. Abnahmeband je Angriff (aus real_fleet.txt, reale Flotte 34,99 Mrd) ---');
  say('  Solo Hoch 4,40 Mrd / 6 Checks = 2,1 % je Check | Elite 9,20 Mrd / 6 Checks = 4,4 % je Check');
  say('');
  process.exit(0);
}

if (MODE === 'kandidat') {
  const [K, FLEET_NAME, RUNS_S, PROFIL] = rest;
  const RUNS = Number(RUNS_S || 40);
  const profil = PROFIL || 'voll';
  const table = KANDIDATEN[K];
  const fleet = FLEETS[FLEET_NAME];
  if (!table || !fleet) throw new Error('Aufruf: kandidat <A|B|C> <klein|gross|real> [laeufe] [profil]');
  const attacker = stateFor(profil, 1);
  const fv = fleetValue(fleet);

  let lostSum = 0, dpSum = 0, lootSum = 0, readySum = 0, multSum = 0, shareSum = 0, totalWipes = 0;
  for (let i = 0; i < RUNS; i++) {
    // Jeder Lauf gegen eine FRISCHE Basis - hier wird der Einzelangriff gemessen, nicht die Serie.
    const r = await oneAttack(fleet, freshBasePool(), attacker, table);
    lostSum += r.lost;
    dpSum += r.destroyedPower;
    lootSum += lootValue(r.loot);
    readySum += r.readiness;
    multSum += r.multiplier;
    shareSum += r.waveDestroyedShare;
    if (r.lost >= fv * 0.999) totalWipes++;
  }
  const lost = lostSum / RUNS, loot = lootSum / RUNS;
  say(`Kandidat ${K} [${table.map((e) => (Array.isArray(e) ? `${e[0]}-${e[1]}` : e)).join('/')}] · Flotte ${FLEET_NAME} (${mrd(fv)}, Profil ${profil}) · ${RUNS} Laeufe`);
  say(`   o Feindstaerke ${pct(multSum / RUNS)} · Welle zu ${pct(shareSum / RUNS)} vernichtet · vernichtete Macht ${mrd(dpSum / RUNS)}`);
  say(`   Verlust ${mrd(lost)} = ${pct(lost / fv)} · Beute ${mrd(loot)} · Netto ${mrd(loot - lost)} · Totalverluste ${totalWipes}/${RUNS}`);
  process.exit(0);
}

if (MODE === 'serie') {
  // Schranke gegen Dauer-Farming, zweite Haelfte: was passiert, wenn dieselbe Basis mehrfach
  // hintereinander angegriffen wird (Erholungszeit gedanklich abgewartet, aber ohne Wiederaufbau)?
  const [FLEET_NAME, ATTACKS_S, RUNS_S, PROFIL] = rest;
  const ATTACKS = Number(ATTACKS_S || 5);
  const RUNS = Number(RUNS_S || 40);
  const profil = PROFIL || 'voll';
  const fleet = FLEETS[FLEET_NAME];
  const attacker = stateFor(profil, 1);
  const fv = fleetValue(fleet);
  const readiness = Array(ATTACKS).fill(0), loots = Array(ATTACKS).fill(0), losses = Array(ATTACKS).fill(0);

  for (let run = 0; run < RUNS; run++) {
    const pool = freshBasePool();
    for (let a = 0; a < ATTACKS; a++) {
      // Zwischen zwei Angriffen liegt mindestens die Erholungszeit - in der die Garnison
      // entsprechend nachwaechst (regenerateGarrison, Nachtrag 5a). Ein Angreifer, der taeglich
      // wiederkommt, trifft also nicht auf den Zustand von gestern abend.
      if (a > 0) pbc.regenerateGarrison(pool.fleet, pool.defense, economy.PIRATE_BASE_RECOVERY_MS);
      const r = await oneAttack(fleet, pool, attacker, economy.PIRATE_BASE_MULTIPLIER_ROLL);
      readiness[a] += r.readiness;
      loots[a] += lootValue(r.loot);
      losses[a] += r.lost;
    }
  }
  say(`Farm-Serie, je ${economy.PIRATE_BASE_RECOVERY_MS / 3600000} h Erholung dazwischen · Flotte ${FLEET_NAME} (${mrd(fv)}, Profil ${profil}) · ${RUNS} Laeufe je Angriff`);
  for (let a = 0; a < ATTACKS; a++) {
    say(`   Angriff ${a + 1}: Bereitschaft ${pct(readiness[a] / RUNS)} · Beute ${mrd(loots[a] / RUNS)} · Verlust ${pct(losses[a] / RUNS / fv)}`);
  }
  process.exit(0);
}

throw new Error('Unbekannter Modus. Siehe Kopf der Datei.');
