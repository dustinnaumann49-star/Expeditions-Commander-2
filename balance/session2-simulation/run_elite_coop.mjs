// Elite-Bollwerk: LOHNT ES SICH, GEMEINSAM ZU FLIEGEN? (Nutzerfrage 18.08.2026)
//
// Die Frage stand nie in einer Messung: `run_elite.mjs` misst nur Mehrspieler-Konstellationen
// gegeneinander (2x voll, voll+mittel, ...), NIE dieselbe Flotte solo gegen zu zweit. Genau das ist
// aber die Frage - und rechnerisch ist die Antwort "neutral", weil `runGroupHourlyCheck()` die
// Feindstaerke aus der SUMME aller Teilnehmerflotten bildet, die Belohnung aber jedem voll zusteht.
//
// UNTERSCHIED ZU run_elite.mjs, bewusst:
//   - Verluste in WERT-Einheiten, nicht in Stueckzahlen. Eine Stueckzahl gewichtet 1 leichten
//     Jaeger wie 1 Imperator und ist als Verlustmass unbrauchbar.
//   - VOLLE Serie ueber PIRATEN_CHECK_COUNT Checks statt eines Einzel-Checks: die Flotte geht
//     angeschlagen in den naechsten Check, und die Feindstaerke skaliert mit dem, was noch da ist.
//   - Belohnungsseite mitgerechnet (Eskalation, Grossflotten-Bonus, winResources, garantierte
//     Container, Kapitaen, Perfekt-Bonus) - sonst sieht man nur die halbe Bilanz.
//
// Aufruf:
//   node run_elite_coop.mjs <voll|mittel|schwach> [laeufe] [gross|klein]
import { appendFileSync } from 'node:fs';
import { combat, runner, ships, defenses, sectors, economy, stateFor, value, pct, mrd, FLEET_LARGE, FLEET_SMALL } from './lib4.mjs';

const OUT = 'elite_coop.txt';
const cfg = sectors.SEKTOR_CONFIG.piraten_elite;
// Container-Erwartungswerte wie in run_elite.mjs, damit die Zahlen vergleichbar bleiben.
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const CONTAINER_DM = { silber: 0, gold: 19.4, elite: 28.6 };

const byId = Object.fromEntries(ships.SHIPS.map((s) => [s.id, s]).concat(defenses.DEFENSES.map((d) => [d.id, d])));
const fleetValue = (f) => Object.entries(f).reduce((s, [id, n]) => s + n * (byId[id]?.cost ? value(byId[id].cost) : 0), 0);

const [, , PROFIL = 'voll', RUNS_S = '40', FLEET_NAME = 'gross'] = process.argv;
const RUNS = Number(RUNS_S);
const BASE_FLEET = FLEET_NAME === 'klein' ? FLEET_SMALL : FLEET_LARGE;

const containerVal = cfg.guaranteedContainers.reduce((s, g) => s + g.count * CONTAINER_EV[g.tier], 0);
const containerDm = cfg.guaranteedContainers.reduce((s, g) => s + g.count * CONTAINER_DM[g.tier], 0);

/** Eine vollstaendige Expedition mit `n` Teilnehmern, alle mit derselben Flotte und demselben Profil. */
async function expedition(n, profil) {
  const states = Array.from({ length: n }, (_, i) => stateFor(profil, i + 1));
  const fleets = Array.from({ length: n }, () => ({ ...BASE_FLEET }));
  const farmed = Array.from({ length: n }, () => 0); // Ressourcenwert je Teilnehmer
  const extras = Array.from({ length: n }, () => 0); // Container/Kapitaen (nicht vom Perfekt-Bonus beruehrt)
  let dm = Array.from({ length: n }, () => 0);
  let streak = 0, wins = 0, surpriseUsed = false;
  let fleetBonusSeen = 1;
  let destroyedPower = 0; // vernichtete Feindmacht der GESAMTEN Expedition (Grundlage Entscheidung 2)

  for (let check = 0; check < economy.PIRATEN_CHECK_COUNT; check++) {
    const totalSentPower = fleets.reduce((s, f) => s + combat.combatFleetPowerBase(f), 0);
    if (totalSentPower <= 0) break;
    const fleetBonus = combat.fleetSizeRewardMultiplier(totalSentPower, cfg.npcFloor);
    fleetBonusSeen = fleetBonus;

    const table = sectors.PIRATEN_MULTIPLIER_ROLL.piraten_elite;
    const rolled = surpriseUsed
      ? { multiplier: combat.pick503020(table), outlier: null }
      : combat.rollMultiplierWithOutlier(table, 'piraten_elite');
    const battleModifier = surpriseUsed ? null : combat.rollBattleModifier('piraten_elite');
    if (rolled.outlier || battleModifier) surpriseUsed = true;

    const targetPower = Math.max(totalSentPower * rolled.multiplier, cfg.npcFloor);
    const npc = {
      ...combat.generatePiratenFleet(targetPower, 0, combat.pickWaveProfile('piraten_elite')),
      ...combat.generateDefenseFleet(totalSentPower * sectors.sektorDefenseFactor('piraten_elite'), 0),
    };
    const captain = Math.random() < cfg.captainChance;
    if (captain) npc.piratenkapitan = 1;

    const contributions = fleets.map((f, i) => ({
      ownerKey: String(i + 1), ships: f, research: states[i].research,
      playerClass: states[i].playerClass, kampfBoostActive: !!states[i].activeBoosters?.kampf,
      shipModules: states[i].shipModules,
    }));
    const result = await runner.runMultiOwnerCombatInWorker({
      contributions, sideBShips: npc, research: states[0].research, battleModifier,
      sideBStatsOverride: captain ? { piratenkapitan: combat.captainStatsForSektor('piraten_elite') } : undefined,
    });

    let anyDestroyed = false;
    Object.keys(npc).forEach((id) => {
      const destroyed = npc[id] - (result.survivorsB[id] || 0);
      if (destroyed > 0) anyDestroyed = true;
      if (destroyed > 0 && id !== 'piratenkapitan') destroyedPower += combat.combatFleetPowerBase({ [id]: destroyed });
    });

    // Ueberlebende uebernehmen - die naechste Welle skaliert mit dem, was noch fliegt.
    fleets.forEach((f, i) => {
      Object.keys(f).forEach((id) => (f[id] = result.survivorsByOwner[String(i + 1)]?.[id] || 0));
    });

    if (anyDestroyed) {
      const esc = economy.getEscalationMultiplier('piraten_elite', streak);
      streak++; wins++;
      const loot = value(cfg.lootBase) * esc * fleetBonus;
      farmed.forEach((_, i) => {
        farmed[i] += loot + value(cfg.winResources);
        extras[i] += containerVal;
        dm[i] += containerDm;
        if (captain && (result.survivorsB.piratenkapitan || 0) <= 0) {
          extras[i] += CONTAINER_EV[cfg.captainContainerTier];
          dm[i] += cfg.captainDm;
        }
      });
    } else {
      streak = 0;
    }
  }

  const perfect = wins >= economy.PIRATEN_CHECK_COUNT;
  const startValue = fleetValue(BASE_FLEET);
  return fleets.map((f, i) => ({
    lost: startValue - fleetValue(f),
    lostPct: (startValue - fleetValue(f)) / startValue,
    reward: farmed[i] * (perfect ? 2 : 1) + extras[i],
    dm: dm[i],
    wins,
    perfect,
    fleetBonus: fleetBonusSeen,
    destroyedPower,
  }));
}

function say(line) {
  console.log(line);
  appendFileSync(OUT, line + '\n');
}

async function serie(n) {
  const acc = { lost: 0, lostPct: 0, reward: 0, dm: 0, wins: 0, perfect: 0, fleetBonus: 0, destroyedPower: 0 };
  for (let r = 0; r < RUNS; r++) {
    const res = await expedition(n, PROFIL);
    // Bei n Teilnehmern zaehlt der DURCHSCHNITT je Teilnehmer - alle fliegen dieselbe Flotte.
    res.forEach((p) => {
      acc.lost += p.lost / n; acc.lostPct += p.lostPct / n; acc.reward += p.reward / n;
      acc.dm += p.dm / n; acc.wins += p.wins / n; acc.perfect += (p.perfect ? 1 : 0) / n;
      acc.fleetBonus += p.fleetBonus / n;
      acc.destroyedPower += p.destroyedPower / n;
    });
  }
  const k = RUNS;
  return {
    lost: acc.lost / k, lostPct: acc.lostPct / k, reward: acc.reward / k, dm: acc.dm / k,
    wins: acc.wins / k, perfect: acc.perfect / k, fleetBonus: acc.fleetBonus / k,
    destroyedPower: acc.destroyedPower / k,
  };
}

say('');
say(`=== SOLO GEGEN ZU ZWEIT, dieselbe Flotte, ${RUNS} Serien je Zelle (18.08.2026) ===`);
say(`Profil ${PROFIL}, Flotte ${FLEET_NAME} (${mrd(fleetValue(BASE_FLEET))} Wert, ${mrd(combat.combatFleetPowerBase(BASE_FLEET))} Power), ${economy.PIRATEN_CHECK_COUNT} Checks je Serie`);
const solo = await serie(1);
say(`Solo      | Verlust ${mrd(solo.lost)} = ${pct(solo.lostPct)} | Belohnung ${mrd(solo.reward)} + ${solo.dm.toFixed(0)} DM | Netto ${mrd(solo.reward - solo.lost)} | Siege ${solo.wins.toFixed(2)}/${economy.PIRATEN_CHECK_COUNT} | Perfekt ${pct(solo.perfect)} | Grossflotten-Bonus x${solo.fleetBonus.toFixed(2)}`);
const duo = await serie(2);
say(`Zu zweit  | Verlust ${mrd(duo.lost)} = ${pct(duo.lostPct)} | Belohnung ${mrd(duo.reward)} + ${duo.dm.toFixed(0)} DM | Netto ${mrd(duo.reward - duo.lost)} | Siege ${duo.wins.toFixed(2)}/${economy.PIRATEN_CHECK_COUNT} | Perfekt ${pct(duo.perfect)} | Grossflotten-Bonus x${duo.fleetBonus.toFixed(2)}`);
say(`Differenz je Teilnehmer: Verlust ${((duo.lostPct - solo.lostPct) * 100).toFixed(1)} Prozentpunkte, Belohnung ${mrd(duo.reward - solo.reward)}, Netto ${mrd((duo.reward - duo.lost) - (solo.reward - solo.lost))}`);

// ---------- Was passiert, wenn Entscheidung 2 kommt? ----------
// Die Beute haengt dann an der vernichteten Feindmacht - und die skaliert im Elite-Bollwerk mit der
// SUMME aller Teilnehmerflotten. Damit beantwortet Entscheidung 2 die Koop-Frage von selbst, je
// nachdem, welche Bezugsgroesse die Kurve bekommt. Drei Varianten, alle mit denselben Messwerten:
const curve = (p) => economy.LOOT_CURVE_ANCHOR_VALUE * Math.pow(p / economy.LOOT_CURVE_ANCHOR_POWER, economy.LOOT_CURVE_EXPONENT);
say('');
say(`Vernichtete Feindmacht je Serie: solo ${mrd(solo.destroyedPower)}, zu zweit ${mrd(duo.destroyedPower)} (Faktor ${(duo.destroyedPower / solo.destroyedPower).toFixed(2)})`);
say(`  Entscheidung 2, V1 (jeder bekommt die Kurve auf die GESAMTE vernichtete Macht):`);
say(`    solo ${mrd(curve(solo.destroyedPower))} je Spieler | zu zweit ${mrd(curve(duo.destroyedPower))} je Spieler = x${(curve(duo.destroyedPower) / curve(solo.destroyedPower)).toFixed(2)}`);
say(`  Entscheidung 2, V2 (jeder bekommt die Kurve auf seinen BEITRAGSANTEIL, hier 1/n):`);
say(`    solo ${mrd(curve(solo.destroyedPower))} je Spieler | zu zweit ${mrd(curve(duo.destroyedPower / 2))} je Spieler = x${(curve(duo.destroyedPower / 2) / curve(solo.destroyedPower)).toFixed(2)}`);
say(`  Entscheidung 2, V3 (Kurve auf die Gesamtmacht, dann durch die Teilnehmerzahl geteilt):`);
say(`    solo ${mrd(curve(solo.destroyedPower))} je Spieler | zu zweit ${mrd(curve(duo.destroyedPower) / 2)} je Spieler = x${(curve(duo.destroyedPower) / 2 / curve(solo.destroyedPower)).toFixed(2)}`);
process.exit(0);
