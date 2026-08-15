// Block A, Schritt 3 (Raid-Paket) / Messung M1: ERTRAGS-SKALIERUNG DES RAIDS.
//
// Frage: nicht "wie hoch ist der Raid-Ertrag", sondern "wie waechst er mit der Zahl der
// angreifbaren Konten" - und welche der fuenf Loesungsvarianten aus dem Kasten bei
// Entscheidung 3 unterbindet dieses Wachstum tatsaechlich.
//
// METHODIK
// --------
// 1. REINE ARITHMETIK, kein Kampflauf. Die Belohnung eines Raids haengt nur an
//    raid.wavesWon x RAID_WAVE_WIN_* (siehe grantContainers() in raids.ts) - der Kampfverlauf
//    geht ausschliesslich ueber die Zahl gewonnener Wellen ein, und die ist bereits gemessen
//    (raid.txt nach dem Overkill-Deckel: 12,0 von 12 in vier von fuenf Profilen).
// 2. Container-Erwartungswerte werden HIER AUS DEM CODE GERECHNET, nicht als Setzung
//    uebernommen (Messregel 16). Enthalten: alle Kategorien mit ihrer TATSAECHLICHEN
//    Auszahlungswahrscheinlichkeit (cat.realChance, nicht cat.chance) plus die Jackpot-Mechanik.
//    Zum Vergleich wird die im Kasten bei Entscheidung 3 verwendete Rechnung (nur Kategorie
//    "resources", roher chance-Wert, ohne Jackpot) mit ausgegeben.
// 3. Die Zahl der Raids je Raid-Tag folgt aus RAID_SCHEDULE_BY_USERNAME (Chance 1,0) und
//    RAID_SPAWN_CHANCE (Bots ueber RAID_FALLBACK_SCHEDULE).
//
// SETZUNGEN (nicht aus dem Code ableitbar, hier gebuendelt)
// --------------------------------------------------------
// - Wert eines Spezialteils: 325.000 Wert-Einheiten (Abschnitt 2a). Betrifft nur die Kategorie
//   "teile"; deren Anteil wird unten getrennt ausgewiesen, damit die Empfindlichkeit sichtbar ist.
// - Uebrige Einnahmen ausser Raid: 15,38 Mrd/Tag (Baseline Abschnitt 1 minus deren Raid-Zeile).
//   Die Baseline ist nach Block A neu zu rechnen; die Anteils-Spalten sind deshalb Richtwerte.
// - Beitragsanteile fuer Variante 4: parametrisch gesetzt, gemessen werden sie in M2.
//
// Aufruf: node run_raid_yield.mjs
import * as L from './lib.mjs';

const {
  CONTAINER_TYPES, JACKPOT_CHANCE, JACKPOT_REWARDS,
  RAID_WAVE_WIN_SILBER, RAID_WAVE_WIN_GOLD, RAID_WAVE_WIN_ELITE,
  RAID_WAVE_COUNT, RAID_SPAWN_CHANCE, RAID_SCHEDULE_BY_USERNAME, RAID_FALLBACK_SCHEDULE,
} = L.economy;
const { SHIPS } = await import('../../server/dist/game/data/ships.js');

const TEIL_VALUE = 325000;
const OTHER_INCOME = 15.38e9;   // Baseline 21,69 minus Raid-Zeile 6,31
const OTHER_DM = 493;           // Baseline 1.088 DM/Tag minus Raid-Zeile 595
const DM_SINK = 103;
const ELITE_INCOME = 10.87e9;   // groesste Einzelquelle neben dem Raid, Baseline Abschnitt 1            // groesste laufende DM-Senke, Abschnitt 1

const val = (m = 0, k = 0, d = 0) => m + k * 1.5 + d * 3;
const shipValue = {};
SHIPS.forEach((s) => (shipValue[s.id] = s.cost ? val(s.cost.metall, s.cost.kristall, s.cost.deuterium) : 0));

// ---- Container-Erwartungswerte aus dem Code -------------------------------------------------
function containerEv(tier) {
  const cfg = CONTAINER_TYPES[tier];
  let wert = 0, wertTeile = 0, dm = 0, deut = 0, wertKastenrechnung = 0;
  cfg.categories.forEach((cat) => {
    const r = cat.rewards[0];
    const p = cat.realChance;
    if (cat.category === 'resources') {
      wert += p * val(r.metall, r.kristall, r.deuterium);
      deut += p * (r.deuterium || 0);
      // So wurde im Kasten bei Entscheidung 3 gerechnet: nur diese Kategorie, roher chance-Wert.
      wertKastenrechnung += cat.chance * val(r.metall, r.kristall, r.deuterium);
    } else if (cat.category === 'teile') {
      wertTeile += p * (r.waffen + r.schild + r.panzerung) * TEIL_VALUE;
    } else if (cat.category === 'freischiff') {
      wert += p * Object.entries(r.ships).reduce((s, [id, n]) => s + n * (shipValue[id] || 0), 0);
    } else if (cat.category === 'dm') {
      dm += p * r.amount;
    }
    // zeitgutschein: kein Ressourcen-Gegenwert, bewusst mit 0 bewertet
  });
  const j = JACKPOT_REWARDS[tier];
  if (j.type === 'resources') { wert += JACKPOT_CHANCE * val(j.metall, j.kristall, j.deuterium); deut += JACKPOT_CHANCE * (j.deuterium || 0); }
  if (j.type === 'dm') dm += JACKPOT_CHANCE * j.amount;
  if (j.type === 'freischiff') wert += JACKPOT_CHANCE * Object.entries(j.ships).reduce((s, [id, n]) => s + n * (shipValue[id] || 0), 0);
  return { wert: wert + wertTeile, wertOhneTeile: wert, teileAnteil: wertTeile, dm, deut, wertKastenrechnung };
}

const EV = { silber: containerEv('silber'), gold: containerEv('gold'), elite: containerEv('elite') };
const MENGE = { silber: RAID_WAVE_WIN_SILBER, gold: RAID_WAVE_WIN_GOLD, elite: RAID_WAVE_WIN_ELITE };

// ---- Ertrag EINES vollstaendig gewonnenen Raids ----------------------------------------------
const wavesWon = RAID_WAVE_COUNT; // gemessen 12,0 von 12, siehe raid.txt
const perRaid = ['silber', 'gold', 'elite'].reduce((a, t) => {
  const n = wavesWon * MENGE[t];
  a.wert += n * EV[t].wert;
  a.wertOhneTeile += n * EV[t].wertOhneTeile;
  a.dm += n * EV[t].dm;
  a.deut += n * EV[t].deut;
  a.kasten += n * EV[t].wertKastenrechnung;
  a.stueck[t] = n;
  return a;
}, { wert: 0, wertOhneTeile: 0, dm: 0, deut: 0, kasten: 0, stueck: {} });

// ---- Zahl der Raids je Raid-Tag ---------------------------------------------------------------
const raidDaysPerWeek = RAID_FALLBACK_SCHEDULE.length;
const namedPlayers = Object.keys(RAID_SCHEDULE_BY_USERNAME).length;
const bots = 2;
const raidsExpected = namedPlayers * 1.0 + bots * RAID_SPAWN_CHANCE;
const perDay = (raids) => (perRaid.wert * raids * raidDaysPerWeek) / 7;
const dmPerDay = (raids) => (perRaid.dm * raids * raidDaysPerWeek) / 7;

// ---- Varianten --------------------------------------------------------------------------------
// Jede Variante liefert den Ertrag EINES Spielers, ausgedrueckt in "Raid-Aequivalenten": 1,0 heisst
// so viel wie ein einzeln verteidigter, voll gewonnener Raid.
//
// Zu Variante 4 (fester Topf je Raid, nach Beitrag verteilt) sind DREI Faelle noetig, weil das
// Ergebnis vollstaendig davon abhaengt, wie sich die Beitraege verteilen - genau das misst M2:
//   symmetrisch: alle Beteiligten tragen gleich viel bei. Dann werden N Toepfe auf N Spieler
//                verteilt, jeder bekommt exakt 1,0 - unabhaengig von der Kontenzahl.
//   dominant:    der Spieler stellt in JEDEM fremden Raid einen festen Anteil s_f des Beitrags,
//                weil seine Flotte die des Verteidigers (Bot) deutlich uebersteigt. Dann waechst
//                sein Ertrag weiter linear mit der Kontenzahl.
// Variante 6 ist neu und stand nicht im Plan: Beitragsanteile wie in Variante 4, zusaetzlich aber
// eine SAETTIGUNG ueber die Summe der Anteile eines Spielers je Raid-Tag (gleiche Bauform wie die
// Saettigungskurve aus Entscheidung 9.1a). Helfen bringt dadurch immer noch etwas, aber mit
// abnehmendem Zuwachs, und der Gesamtertrag ist nach oben beschraenkt - unabhaengig davon, wie
// viele Konten es gibt und wie ungleich die Beitraege verteilt sind.
const D_OWN = 0.6;                 // Anteil des Verteidigers am eigenen Raid, Setzung -> M2
const S_MAX = 1.5;                 // Saettigungsgrenze in Raid-Aequivalenten, Setzung
const sat = (x) => S_MAX * (1 - Math.exp(-x / S_MAX));
const v4dom = (N, sf) => (N === 1 ? 1 : D_OWN + (N - 1) * sf);
const v4sym = (N) => 1.0;

const variants = {
  'V0 Ist-Zustand': (N) => N,
  'V1 Halbierung 5/3/1': (N) => N * 0.5,
  'V2 Halter 25 %': (N) => 1 + (N - 1) * 0.25,
  'V2 Halter 10 %': (N) => 1 + (N - 1) * 0.10,
  'V3 Bots ohne Belohnung': (N) => Math.min(N, namedPlayers),
  'V4 Topf, symmetrisch': v4sym,
  'V4 Topf, dominant 0,4': (N) => v4dom(N, 0.4),
  'V4 Topf, dominant 0,6': (N) => v4dom(N, 0.6),
  'V3+V4 dominant 0,6': (N) => (Math.min(N, namedPlayers) === 1 ? 1 : D_OWN + (Math.min(N, namedPlayers) - 1) * 0.6),
  'V6 Topf + Saettigung 1,5': (N) => sat(v4dom(N, 0.6)),
  'V6 sym. + Saettigung 1,5': (N) => sat(v4sym(N)),
};

// ---- Ausgabe ----------------------------------------------------------------------------------
const out = [];
const p = (s = '') => out.push(s);
const mrd = (x) => `${(x / 1e9).toFixed(2)}`;

p('=== M1: Raid-Ertrag und seine Skalierung ueber die Zahl der Konten ===');
p('');
p('--- Container-Erwartungswerte, aus dem Code gerechnet (Wert-Einheiten) ---');
p('Stufe  | EV gesamt | davon Teile | ohne Teile |    DM | Deuterium | Kastenrechnung Entsch. 3');
['silber', 'gold', 'elite'].forEach((t) => {
  const e = EV[t];
  p(`${t.padEnd(6)} | ${(e.wert / 1e6).toFixed(1).padStart(9)} | ${(e.teileAnteil / 1e6).toFixed(1).padStart(11)} | ${(e.wertOhneTeile / 1e6).toFixed(1).padStart(10)} | ${e.dm.toFixed(2).padStart(5)} | ${(e.deut / 1e6).toFixed(1).padStart(9)} | ${(e.wertKastenrechnung / 1e6).toFixed(1).padStart(24)}`);
});
p('(Setzung: 1 Spezialteil = 325.000 Wert-Einheiten. Zeitgutscheine mit 0 bewertet.)');
p('');

p('--- Ein vollstaendig gewonnener Raid (12 von 12 Wellen) ---');
p(`Container: ${perRaid.stueck.silber} Silber + ${perRaid.stueck.gold} Gold + ${perRaid.stueck.elite} Elite`);
p(`Wert: ${mrd(perRaid.wert)} Mrd  |  ohne Teile-Setzung: ${mrd(perRaid.wertOhneTeile)} Mrd  |  DM: ${perRaid.dm.toFixed(0)}  |  Deuterium: ${mrd(perRaid.deut)} Mrd Einheiten`);
p(`Zum Vergleich, Rechenweg aus dem Kasten bei Entscheidung 3 (nur Ressourcen, roher chance-Wert): ${mrd(perRaid.kasten)} Mrd`);
p('');

p('--- Raids je Raid-Tag, aus dem Zeitplan im Code ---');
p(`${namedPlayers} namentlich hinterlegte Spieler mit Chance 1,0 + ${bots} Bots mit RAID_SPAWN_CHANCE ${RAID_SPAWN_CHANCE}`);
p(`Erwartungswert: ${raidsExpected.toFixed(2)} Raids je Raid-Tag, ${raidDaysPerWeek} Raid-Tage je Woche`);
p('');

p('--- Ertrag je Spieler und Tag, Ist-Zustand ---');
p('Konten | Raids/Tag-Mittel | Mrd/Tag | DM/Tag | Anteil an den Gesamteinnahmen');
[1, 2, 3, 3.4, 4, 5, 6].forEach((N) => {
  const w = perDay(N), d = dmPerDay(N);
  p(`${String(N).padStart(6)} | ${((N * raidDaysPerWeek) / 7).toFixed(2).padStart(16)} | ${mrd(w).padStart(7)} | ${d.toFixed(0).padStart(6)} | ${((w / (w + OTHER_INCOME)) * 100).toFixed(1).padStart(5)} %`);
});
p('');

p('--- Varianten: Ertrag je Spieler und Tag, nach Zahl der angreifbaren Konten ---');
p('(Raid-Aeq. = Vielfaches eines einzeln verteidigten, voll gewonnenen Raids)');
p('Variante                  | N=1 Mrd | N=2 Mrd | N=4 Mrd | N=6 Mrd | Zuwachs/Konto | Raid-Anteil N=4 | Elite-Anteil N=4');
Object.entries(variants).forEach(([name, f]) => {
  const v = (N) => perDay(f(N));
  const slope = (v(6) - v(2)) / 4;
  const total = v(4) + OTHER_INCOME;
  p(`${name.padEnd(25)} | ${mrd(v(1)).padStart(7)} | ${mrd(v(2)).padStart(7)} | ${mrd(v(4)).padStart(7)} | ${mrd(v(6)).padStart(7)} | ${mrd(slope).padStart(13)} | ${((v(4) / total) * 100).toFixed(1).padStart(13)} % | ${((ELITE_INCOME / total) * 100).toFixed(1).padStart(14)} %`);
});
p('');
p('Elite-Bollwerk liefert 10,87 Mrd/Tag (Baseline Abschnitt 1) und ist die zweite grosse Quelle.');
p('Faellt der Raid zu weit, verletzt statt seiner das Elite-Bollwerk die 50-Prozent-Marke.');
p('');

p('--- Dunkle Materie (Senke: 103/Tag) ---');
p('Variante                  | DM/Tag bei N=4 | Faktor gegen die Senke');
Object.entries(variants).forEach(([name, f]) => {
  const d = dmPerDay(f(4)) + OTHER_DM;
  p(`${name.padEnd(25)} | ${d.toFixed(0).padStart(14)} | ${(d / DM_SINK).toFixed(1).padStart(22)}`);
});
p('');

p('--- Welche Container-Konstante trifft welchen Zielanteil (bei N=4, Ist-Verteilung) ---');
p('Ziel-Anteil | noetiger Ertrag Mrd/Tag | Faktor auf 10/6/2 | entspraeche etwa');
[0.50, 0.40, 0.33, 0.25].forEach((ziel) => {
  const noetig = (ziel * OTHER_INCOME) / (1 - ziel);
  const faktor = noetig / perDay(4);
  const s = (RAID_WAVE_WIN_SILBER * faktor), g = (RAID_WAVE_WIN_GOLD * faktor), e = (RAID_WAVE_WIN_ELITE * faktor);
  p(`${(ziel * 100).toFixed(0).padStart(10)} % | ${mrd(noetig).padStart(23)} | ${faktor.toFixed(3).padStart(17)} | ${s.toFixed(1)}/${g.toFixed(1)}/${e.toFixed(1)}`);
});
p('');
p('Lesehilfe: der Faktor gilt nur bei GENAU vier Konten. Sobald ein Konto dazukommt oder wegfaellt,');
p('stimmt er nicht mehr - das ist der eigentliche Befund, nicht die Hoehe.');

p('');
p('--- M4: Wirtschaftsklassen - Schmuggler haengt am Deuterium aus Raid-Containern ---');
// Gemessene Beitragsanteile aus raid_support.txt (M2): der Verteidiger dominiert seinen eigenen
// Raid, der starke Verstaerker dominiert den Raid eines schwachen Bots.
const ANTEIL_EIGENER_RAID = 0.932;
const ANTEIL_FREMDER_SPIELER = 0.046;
const ANTEIL_BOT_RAID = 0.715;
const v4gemessen = ANTEIL_EIGENER_RAID + ANTEIL_FREMDER_SPIELER + 2 * ANTEIL_BOT_RAID;
const v6gemessen = sat(v4gemessen);
const DEUT_MINE_PRO_TAG = 82.9e6;      // Deuterium-Synthetisierer Stufe 30, Abschnitt 4b
const SCHMUGGLER_HEUTE = 0.92e9;       // laufender Vorteil heute, Abschnitt 4b
const PROSPEKTOR = 0.22e9;
const deutProTag = (raidAeq) => (perRaid.deut * raidAeq * raidDaysPerWeek) / 7;
p('Fall | Raid-Aequivalente | Deuterium aus Raids Mrd/Tag | Anteil am Deuterium | Schmuggler-Vorteil Mrd/Tag');
[['Ist-Zustand (3,4 Raids)', raidsExpected], ['Variante 4 ohne Saettigung', v4gemessen], ['Variante 6 mit Saettigung', v6gemessen]].forEach(([label, aeq]) => {
  const d = deutProTag(aeq);
  const anteil = d / (d + DEUT_MINE_PRO_TAG);
  const schmuggler = SCHMUGGLER_HEUTE * ((d + DEUT_MINE_PRO_TAG) / (deutProTag(raidsExpected) + DEUT_MINE_PRO_TAG));
  p(`${label.padEnd(27)} | ${aeq.toFixed(2).padStart(17)} | ${mrd(d).padStart(26)} | ${(anteil * 100).toFixed(1).padStart(18)} % | ${mrd(schmuggler).padStart(26)}`);
});
p(`Prospektor zum Vergleich: ${mrd(PROSPEKTOR)} Mrd/Tag (unveraendert, haengt nicht am Raid).`);
p('');
p('--- Gemessene Beitragsanteile eingesetzt (Quelle: raid_support.txt) ---');
p(`Eigener Raid ${(ANTEIL_EIGENER_RAID * 100).toFixed(1)} %, Raid des zweiten Spielers ${(ANTEIL_FREMDER_SPIELER * 100).toFixed(1)} %, Raid eines Bots ${(ANTEIL_BOT_RAID * 100).toFixed(1)} %`);
p(`Summe = ${v4gemessen.toFixed(2)} Raid-Aequivalente unter Variante 4, ${v6gemessen.toFixed(2)} unter Variante 6`);
p(`Ertrag: ${mrd(perDay(v4gemessen))} Mrd/Tag gegen ${mrd(perDay(v6gemessen))} Mrd/Tag`);
p(`Raid-Anteil an den Einnahmen: ${((perDay(v4gemessen) / (perDay(v4gemessen) + OTHER_INCOME)) * 100).toFixed(1)} % gegen ${((perDay(v6gemessen) / (perDay(v6gemessen) + OTHER_INCOME)) * 100).toFixed(1)} %`);

const text = out.join('\n');
console.log(text);
const fs = await import('node:fs');
fs.writeFileSync(new URL('./raid_yield.txt', import.meta.url), text + '\n');
