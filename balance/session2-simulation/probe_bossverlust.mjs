// SONDE - WO GEHT DIE FEUERKRAFT DES GEGNERS VERLOREN?
//
// !!! Liest nur aus, veraendert nichts. Laeuft gegen den unveraenderten Build.                !!!
//
// STAND VOR DIESER SONDE (massenfrage_protokoll.txt): das Aggregat ist als Ursache
// ausgeschlossen (2 % Anteil), die beiden Deckel ebenfalls (Faktor 100 bewegt 3,3 Punkte). Zwei
// Sweeps haben nichts ergeben - also nicht noch einen Regler drehen, sondern IN einen Kampf sehen.
//
// DIE SPUR, DIE DIESE SONDE PRUEFT:
// In ABSOLUTEN Zahlen toetet der Boss GEGEN GROSSE FLOTTEN WENIGER, nicht gleich viel.
//     n=90   ->   405 Einheiten, 63,4 % Verlust  =  257 vernichtete Einheiten
//     n=2500 -> 11250 Einheiten,  0,1 % Verlust  =   11 vernichtete Einheiten
// Beide Kaempfe laufen ueber die vollen 100 Runden (der Boss stirbt nie). Waere ein DECKEL die
// bindende Grenze, muesste die absolute Zahl KONSTANT bleiben und nur ihr Anteil fallen. Sie
// faellt aber um Faktor 23. Der Boss wird gegen die groessere Flotte also absolut schwaecher.
//
// VERDACHT: der Gegner wird ueber seine MACHT skaliert (Flottenmacht x 1,30 x 1,75), und seine
// gesamte Macht steckt in EINER Einheit. Je groesser die Flotte, desto groesser sein Einzelschuss -
// und desto groesserer Anteil davon verpufft, weil ein Treffer ueber die Durchschlags-Kaskade nur
// wenige Ziele erreicht. Mehr Macht auf einer Einheit waere dann nicht mehr Wirkung, sondern mehr
// VERSCHWENDUNG. Das deckt sich mit dem Planbefund vom 15.08.2026 ("ein hoeherer
// ADMIRAL_STAT_SHARE macht den Gegner SCHWAECHER ... weil der Overkill-Deckel den einen grossen
// Schuss kappt").
//
// GEMESSEN WIRD DESHALB DAS VERHAELTNIS VON ROHER FEUERKRAFT ZU ANGERICHTETEM SCHADEN:
//   theoretisch  = Waffenwert des Bosses x Treffer            (was er haette anrichten koennen)
//   angerichtet  = Panzerungs- + Schildschaden auf Seite A    (was tatsaechlich ankam)
//   Verschwendung = 1 - angerichtet / theoretisch
// Steigt die Verschwendung ueber die Leiter, ist der Verdacht bestaetigt.
//
// Aufruf: node probe_bossverlust.mjs [laeufe]
import { combat, runner, cc, ships, stateFor, value } from './lib4.mjs';

const RUNS = Number(process.argv[2] || 20);
const LEITER = [90, 150, 400, 1000, 2500];
const BASE = { kreuzer: 1, schlachtschiff: 1, bomber: 1, schlachtkreuzer: 0.5, zerstoerer: 0.5, reaper: 0.5 };

const state = stateFor('voll', 1);
const pr = combat.computePirateResearch(state.research);
const m = {
  waffen: combat.waffenMultiplier(pr),
  schild: combat.schildMultiplier(pr),
  panzerung: combat.panzerungMultiplier(pr),
};
const summe = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

console.log('=== SONDE: WO GEHT DIE FEUERKRAFT DES BOSSES VERLOREN? ===');
console.log(`Mischflotte, Boss auf Flottenmacht x1,30 x1,75 skaliert, Profil voll, ${RUNS} Laeufe je Zelle.`);
console.log('Alle Kaempfe laufen ueber die vollen 100 Runden - der Boss stirbt in keiner Zelle.\n');
console.log('    n  Einheiten  Boss-Waffen  Treffer  vernichtet  Schaden/Treffer  Verschwendung  Schild-Regen  Regen/Schaden');

for (const n of LEITER) {
  const fleet = Object.fromEntries(Object.entries(BASE).map(([id, f]) => [id, Math.round(n * f)]));
  const startCount = Object.values(fleet).reduce((a, b) => a + b, 0);
  const enc = combat.generateAdmiralEncounter(combat.combatFleetPowerBase(fleet) * 1.30 * 1.75);
  const b = enc.statsOverride[cc.ADMIRAL_BOSS_ID];
  const bossStats = { waffen: b.waffen * m.waffen, schild: b.schild * m.schild, panzerung: b.panzerung * m.panzerung };

  let schuesse = 0, treffer = 0, angerichtet = 0, vernichtet = 0, regen = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = await runner.runCombatInWorker({
      sideAShips: fleet, sideBShips: { [cc.ADMIRAL_BOSS_ID]: 1 },
      sideBStatsOverride: { [cc.ADMIRAL_BOSS_ID]: bossStats },
      research: state.research, playerClass: state.playerClass,
      kampfBoostActive: true, shipModules: state.shipModules, retreatMode: 'none',
    });
    schuesse += summe(r.shotsB.fired);
    treffer += summe(r.shotsB.hits);
    // Was auf Seite A tatsaechlich ankam - Panzerung UND Schild, denn beides muss der Boss
    // durchschlagen. Der Schild-REGEN steht bewusst nicht drin: er ist Erholung, kein Schaden.
    angerichtet += summe(r.dmgTakenA) + summe(r.shieldDmgTakenA);
    // Schild-REGENERATION der Spielerseite: die zweite Haelfte der Erklaerung. Wenn der Schaden
    // ueber sehr viele Einheiten verteilt wird, laedt sich jeder einzelne Schild zwischen zwei
    // Treffern wieder auf - der Schaden staut sich dann nie zu einem Abschuss zusammen.
    regen += summe(r.shieldRegenA);
    vernichtet += startCount - Object.values(r.survivorsA).reduce((a, c) => a + c, 0);
  }

  const theoretisch = bossStats.waffen * (treffer / RUNS);
  const proTreffer = angerichtet / RUNS / Math.max(1, treffer / RUNS);
  const verschwendung = 1 - (angerichtet / RUNS) / Math.max(1, theoretisch);
  const mio = (x) => (x / 1e6).toFixed(1);
  console.log(
    `${String(n).padStart(5)} ${String(startCount).padStart(10)} ${mio(bossStats.waffen).padStart(11)}M `
    + `${(treffer / RUNS).toFixed(0).padStart(7)} ${(vernichtet / RUNS).toFixed(0).padStart(11)} `
    + `${mio(proTreffer).padStart(15)}M ${(100 * verschwendung).toFixed(1).padStart(13)} % `
    + `${mio(regen / RUNS).padStart(12)}M ${(regen / Math.max(1, angerichtet)).toFixed(2).padStart(13)}`
  );
}
process.exit(0);
