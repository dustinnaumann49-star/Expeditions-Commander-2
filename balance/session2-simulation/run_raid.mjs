// lib4 statt lib: verhaelt sich ohne MESSBUILD identisch (lib.mjs == lib3.mjs, lib4 ergaenzt nur
// die Messbuild-Aufloesung), erlaubt aber die Gegenmessung einer Variante ohne Quellcode-Aenderung.
import * as L from './lib4.mjs';

const { RAID_WAVE_ROLL, RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER,
        RAID_WAVE_WIN_SILBER, RAID_WAVE_WIN_GOLD, RAID_WAVE_WIN_ELITE,
        RAID_SALVAGE_DM_PER_KILL, RAID_SALVAGE_DM_MAX, RAID_LOOT_PERCENT } = L.economy;
const { DEFENSE_REPAIR_PERCENT } = L.cc;

// 18.08.2026: Reparaturquote und Verteidigungs-Gewicht sind ab hier ueberschreibbar, damit die
// Verteidigungsseite gegengemessen werden kann, ohne den Quellcode anzufassen. Ohne die beiden
// Umgebungsvariablen verhaelt sich das Skript exakt wie zuvor (0,70 bzw. 0,90 fuer Bollwerk, 0,3).
// Die Gewichte stehen in raids.ts als modul-lokale Konstanten (RAID_FLEET_POWER_WEIGHT /
// RAID_DEFENSE_POWER_WEIGHT) und sind nicht exportiert - dieses Skript repliziert sie ohnehin.
const REPAIR = process.env.REPAIR !== undefined ? Number(process.env.REPAIR) : DEFENSE_REPAIR_PERCENT;
const REPAIR_BOLLWERK = process.env.REPAIR_BOLLWERK !== undefined ? Number(process.env.REPAIR_BOLLWERK) : 0.9;
const DEF_WEIGHT = process.env.DEF_WEIGHT !== undefined ? Number(process.env.DEF_WEIGHT) : 0.3;

// Container-Erwartungswerte in Wert-Einheiten, aus Session 1 uebernommen
const CONTAINER_EV = { silber: 60.1e6, gold: 127.2e6, elite: 237.6e6 };
const CONTAINER_DM = { silber: 0, gold: 19.4, elite: 28.6 };

// Repliziert resolveOneWave() aus raids.ts: Feindstaerke wird PRO WELLE aus der AKTUELLEN
// (bereits dezimierten) Flotte+Verteidigung neu berechnet, Verteidigungsanlagen werden nach
// jeder Welle zu DEFENSE_REPAIR_PERCENT wiederhergestellt, retreatMode 'fleetOnly' (bis 19.08.2026: kein Rueckzug ueberhaupt).
async function runRaid(profile, fleet, defense) {
  const st = L.stateFor(profile, 1);
  st.fleet = { ...fleet };
  st.defense = { ...defense };
  const repair = st.playerClass === 'bollwerk' ? REPAIR_BOLLWERK : REPAIR;

  let wavesWon = 0, destroyedTotal = 0;
  const waveFactors = [];
  // Entscheidung 10, Variante 2 (19.08.2026): Rueckzug AUS DEM RAID statt nur aus der Welle.
  // Sinkt die verbliebene Flottenmacht unter WITHDRAW_SHARE der Ausgangsmacht, nimmt die Flotte an
  // den restlichen Wellen nicht mehr teil - die Verteidigungsanlagen kaempfen allein weiter.
  // Grund: der wellenweise Rueckzug (Variante 1) hat gemessen NICHTS gebracht, weil zurueckgezogene
  // Schiffe in der naechsten der zwoelf Wellen wieder mitkaempfen und ueber die Serie trotzdem
  // aufgerieben werden. WITHDRAW_SHARE = 0 schaltet den Mechanismus ab (Ist-Zustand).
  const WITHDRAW_SHARE = process.env.WITHDRAW !== undefined ? Number(process.env.WITHDRAW) : 0;
  const CAP_SHARE = process.env.CAP !== undefined ? Number(process.env.CAP) : 0;
  const RESERVE_SHARE = process.env.RESERVE !== undefined ? Number(process.env.RESERVE) : 0;
  const startFleetPower = L.combat.combatFleetPowerBase(fleet);
  let fleetWithdrawn = false;
  for (let w = 0; w < RAID_WAVE_COUNT; w++) {
    if (WITHDRAW_SHARE > 0 && !fleetWithdrawn
        && L.combat.combatFleetPowerBase(st.fleet) < startFleetPower * WITHDRAW_SHARE) {
      fleetWithdrawn = true;
    }
    // Entscheidung 10, Variante 4 (19.08.2026): RESERVE statt Rueckzug. Ein fester Anteil der
    // Ausgangsflotte wird gar nicht erst in die Wellen geschickt und kann deshalb auch nicht
    // sterben. Braucht KEINE Aenderung an der Kampf-Engine und haelt die Untergrenze exakt ein -
    // im Gegensatz zu den Varianten 1-3, die alle daran scheitern, dass kleine Schiffe INNERHALB
    // einer Welle vernichtet werden, ohne je die 30-%-HP-Schwelle eines Rueckzugs zu durchlaufen.
    // RESERVE = 0 schaltet den Mechanismus ab (Ist-Zustand).
    const inWelle = {};
    Object.keys(st.fleet).forEach((id) => {
      const reserviert = RESERVE_SHARE > 0 ? Math.floor((fleet[id] || 0) * RESERVE_SHARE) : 0;
      inWelle[id] = Math.max(0, st.fleet[id] - reserviert);
    });
    const shipIds = fleetWithdrawn ? [] : Object.keys(inWelle).filter((id) => inWelle[id] > 0);
    const defIds = Object.keys(st.defense).filter((id) => st.defense[id] > 0);
    const defenderShips = {};
    shipIds.forEach((id) => (defenderShips[id] = inWelle[id]));
    defIds.forEach((id) => (defenderShips[id] = st.defense[id]));

    let defensePower = 0, fleetPower = 0;
    defIds.forEach((id) => { const b = L.combat.baseStats(id); defensePower += st.defense[id] * (b.waffen + b.schild + b.panzerung); });
    // Die Wellenstaerke richtet sich nach der GANZEN Flotte, nicht nur nach dem eingesetzten Teil -
    // sonst waere die Reserve ein doppelter Vorteil: weniger Risiko UND schwaechere Gegner. Gemessen
    // sank der Flottenverlust bei entwickelten Konten sonst von 13,5 auf 4,9 %, was dem Ziel der
    // Entscheidung (Startphase absichern, Endspiel nicht verbilligen) zuwiderlaeuft.
    Object.keys(st.fleet).forEach((id) => { const b = L.combat.baseStats(id); fleetPower += st.fleet[id] * (b.waffen + b.schild + b.panzerung); });
    const combinedPower = fleetPower * 0.7 + defensePower * DEF_WEIGHT;

    const domePool = L.combat.computeDomeSharedPool(st.defense, st.research, !!st.activeBoosters.kampf, st.playerClass, st.shipModules);
    const waveFactor = L.combat.pick503020(RAID_WAVE_ROLL);
    waveFactors.push(waveFactor);
    const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * waveFactor;
    const profileW = L.combat.pickWaveProfile('raid');
    const battleModifier = L.combat.rollBattleModifier('raid');
    const npcShips = L.combat.generateFallbackFleet(waveTargetPower, profileW);
    const npcIds = Object.keys(npcShips).filter((id) => npcShips[id] > 0);
    if (npcIds.length === 0) { wavesWon++; continue; }

    const result = await L.runner.runCombatInWorker({
      sideAShips: defenderShips,
      sideBShips: npcShips,
      research: st.research,
      defenseCounts: st.defense,
      sharedShieldPoolA: domePool,
      // MUSS mit raids.ts uebereinstimmen. Das Skript repliziert den Raid, es liest die
      // Einstellung nicht aus - stand hier 'none', waehrend raids.ts laengst 'fleetOnly' setzt,
      // wuerde die Messung stillschweigend den alten Zustand messen (Entscheidung 10, 19.08.2026).
      retreatMode: 'fleetOnly',
      battleModifier,
      playerClass: st.playerClass,
      kampfBoostActive: !!st.activeBoosters.kampf,
      shipModules: st.shipModules,
    });

    shipIds.forEach((id) => { st.fleet[id] = (st.fleet[id] - inWelle[id]) + (result.survivorsA[id] || 0); });
    // Entscheidung 10, Variante 3 (19.08.2026): harte VERLUSTOBERGRENZE ueber den ganzen Raid.
    // Sobald der kumulierte Flottenverlust CAP_SHARE der Ausgangsflotte erreicht, wird der
    // ueberschiessende Teil wiederhergestellt ("die Flotte bricht den Kontakt ab") und nimmt an den
    // restlichen Wellen nicht mehr teil. Grund: weder der wellenweise Rueckzug (Variante 1) noch der
    // Rueckzug zwischen den Wellen (Variante 2) verhindern den Totalverlust - bei schwachem Ausbau
    // werden kleine Schiffe in EINER Welle vernichtet, ohne je die 30-%-HP-Schwelle zu durchlaufen,
    // an der ein Rueckzug ausloesen wuerde. CAP_SHARE = 0 schaltet die Obergrenze ab (Ist-Zustand).
    if (CAP_SHARE > 0 && !fleetWithdrawn) {
      const restPower = L.combat.combatFleetPowerBase(st.fleet);
      const bodenPower = startFleetPower * (1 - CAP_SHARE);
      if (restPower < bodenPower) {
        // Die ueberschiessenden Verluste dieser Welle werden zurueckgenommen: die betroffenen
        // Schiffe haben den Kontakt abgebrochen statt zu sterben. WICHTIG: hoechstens so viele, wie
        // in DIESE Welle geschickt wurden - sonst wuerden Schiffe wiederbelebt, die schon vor der
        // Welle nicht mehr da waren, und die Verlustquote koennte negativ werden (in der ersten
        // Fassung genau passiert: -28,4 %).
        const faktor = restPower > 0 ? bodenPower / restPower : 0;
        if (faktor > 1) {
          shipIds.forEach((id) => {
            st.fleet[id] = Math.min(defenderShips[id], Math.round(st.fleet[id] * faktor));
          });
        }
        fleetWithdrawn = true;
      }
    }
    defIds.forEach((id) => {
      const sent = st.defense[id];
      const surv = result.survivorsA[id] || 0;
      st.defense[id] = surv + Math.floor((sent - surv) * repair);
    });
    npcIds.forEach((id) => { destroyedTotal += npcShips[id] - (result.survivorsB[id] || 0); });
    if (npcIds.every((id) => (result.survivorsB[id] || 0) <= 0)) wavesWon++;
  }

  const startFleet = Object.values(fleet).reduce((a, b) => a + b, 0);
  const endFleet = Object.values(st.fleet).reduce((a, b) => a + b, 0);
  const startDef = Object.values(defense).reduce((a, b) => a + b, 0);
  const endDef = Object.values(st.defense).reduce((a, b) => a + b, 0);
  return {
    wavesWon,
    fleetLoss: (startFleet - endFleet) / startFleet,
    defLoss: startDef ? (startDef - endDef) / startDef : 0,
    salvageDm: Math.min(RAID_SALVAGE_DM_MAX, destroyedTotal * RAID_SALVAGE_DM_PER_KILL),
    avgWaveFactor: waveFactors.reduce((a, b) => a + b, 0) / waveFactors.length,
  };
}

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};

const CASES = [
  ['voll', L.FLEET_LARGE, DEFENSE_LARGE, 'voll / grosse Flotte + volle Verteidigung'],
  ['voll_noboost', L.FLEET_LARGE, DEFENSE_LARGE, 'voll ohne Kampf-Boost'],
  ['mittel', L.FLEET_LARGE, DEFENSE_LARGE, 'mittel / grosse Flotte'],
  ['voll', L.FLEET_SMALL, DEFENSE_SMALL, 'voll / kleine Flotte + kleine Verteidigung'],
  ['schwach', L.FLEET_SMALL, DEFENSE_SMALL, 'schwach / kleine Flotte'],
];

const N = Number(process.argv[2] || 8);
console.log(`=== Raid: ${RAID_WAVE_COUNT} Wellen, ${N} komplette Raids je Fall ===`);
// min-max-Spalte fuer den Flottenverlust ist Pflicht: die Spannweite eines einzelnen Raids ist
// groesser als die meisten gemessenen Effekte (teuer gelernt am 11.08.2026 bei der Klassen-Messung).
console.log('Fall | oWellen gewonnen | perfekt (12/12)% | oFlottenverlust% | Flottenverlust min-max | oVerteidigungsverlust% | oBergungs-DM');
const results = {};
for (const [profile, fleet, defense, label] of CASES) {
  let wonSum = 0, perfect = 0, fl = 0, dl = 0, dm = 0;
  let flMin = Infinity, flMax = -Infinity;
  for (let i = 0; i < N; i++) {
    const r = await runRaid(profile, fleet, defense);
    wonSum += r.wavesWon;
    if (r.wavesWon >= RAID_WAVE_COUNT) perfect++;
    fl += r.fleetLoss; dl += r.defLoss; dm += r.salvageDm;
    flMin = Math.min(flMin, r.fleetLoss); flMax = Math.max(flMax, r.fleetLoss);
  }
  results[label] = wonSum / N;
  console.log([label, (wonSum / N).toFixed(1), ((perfect / N) * 100).toFixed(0),
    ((fl / N) * 100).toFixed(1), `${(flMin * 100).toFixed(1)}-${(flMax * 100).toFixed(1)}`,
    ((dl / N) * 100).toFixed(1), (dm / N).toFixed(1)].join(' | '));
}

console.log();
console.log('=== Belohnungsrechnung (Wert-Einheiten, Container-EV aus Session 1) ===');
for (const [label, avgWon] of Object.entries(results)) {
  const wert = avgWon * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
  const dmv = avgWon * (RAID_WAVE_WIN_GOLD * CONTAINER_DM.gold + RAID_WAVE_WIN_ELITE * CONTAINER_DM.elite);
  console.log(`${label}: ${L.mrd(wert)} pro Raid, ${L.mrd(wert * 2)} pro Woche (Mi+So), ${L.mrd(wert * 2 / 7)}/Tag, DM ${(dmv * 2).toFixed(0)}/Woche`);
}
const full = 12 * (RAID_WAVE_WIN_SILBER * CONTAINER_EV.silber + RAID_WAVE_WIN_GOLD * CONTAINER_EV.gold + RAID_WAVE_WIN_ELITE * CONTAINER_EV.elite);
console.log(`Obergrenze bei 12/12: ${L.mrd(full)} pro Raid, ${L.mrd(full * 2)} pro Woche`);
console.log(`Verlust bei nicht-perfekter Abwehr: ${RAID_LOOT_PERCENT * 100}% des Ressourcenbestands, EINMAL pro Raid`);
process.exit(0);
