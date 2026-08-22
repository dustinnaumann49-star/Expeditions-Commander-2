// !!! MESSBUILD-SKRIPT - ALLE ERGEBNISSE SIND MESSBUILD-WERTE, KEIN REPO-STAND !!!
//   cd server && npm install && npx tsc
//   node make_messbuild_kum.mjs /tmp/mb_kum --rf=4 --evk=0.20 --evm=0.08
//   MESSBUILD=/tmp/mb_kum node probe_volley_scale_19.mjs [wellen_je_zelle]
//
// ===================================================================================
// VORFRAGE ZUR REIHENFOLGE 18/19 - KOPPELT WEG 2 (ENTSCHEIDUNG 19) IN DIE RAID-ZELLEN?
// ===================================================================================
// Anlass (Code-Befund 22.08.2026): MULTI_TARGET_VOLLEY_SHIPS enthaelt FUENF Eintraege, nicht drei.
// `sentinelkanone` (maxCount 150) und `ultimatekanone` (60) sind VERTEIDIGUNGSANLAGEN und haben
// beide einen ZIELERFASSUNG_BASE-Eintrag (0,35) - die Salve ist bei ihnen also kein toter Code
// (anders als beim Boss in Entscheidung 4.4). Der Weg-2-Patch aus make_messbuild_salve.mjs greift
// in fireShots() generisch ueber `shooter.typeId` und trifft sie mit. Der Satz aus salven_19.txt
// ("Verteidigungsanlagen bleiben unberuehrt") gilt damit nur fuer die SCHIFFS-Seite.
// Der Klassen-RF-Patch aus make_messbuild_kum.mjs laesst die RAPIDFIRE-Tabellen dieser beiden
// unveraendert (geprueft: rfPatch schreibt nur Standardschiffe und die sechs Standardanlagen).
//
// GEMESSEN WIRD NICHT DER KAMPF, SONDERN NUR DIE WELLENGROESSE. Weg 2 lautet
//   treffer_je_typ = min(DECKEL, ceil(einheiten_dieses_typs / JE))    mit JE = 20.000, DECKEL = 8
// Solange kein Gegnertyp die JE-Marke reisst, ist der Ausdruck 1 und Weg 2 aendert an der
// Verteidigungsseite NICHTS. Die Frage ist deshalb rein zaehlbar und braucht keinen Kampflauf:
// wie viele Einheiten je Typ stehen in einer Raid-Welle?
//
// Warum das die Reihenfolge entscheidet: Entscheidung 18 kalibriert Eskalation und Bunkerbrecher
// am Verteidigungsverlust. Wenn Weg 2 die beiden Salven-Anlagen in denselben Zellen verstaerkt,
// muesste 19 VOR 18 stehen, sonst wird zweimal kalibriert (Arbeitsregel, Punkt 2).
//
// Die Wellenerzeugung ist 1:1 aus run_raid.mjs uebernommen (combinedPower = Flotte*0,7 +
// Verteidigung*0,3, RAID_MIN_TARGET_POWER, pick503020 auf RAID_WAVE_ROLL, generateFallbackFleet,
// optional ESC/BUNKER). RAID_WAVE_ROLL wird NICHT angefasst.
import * as L from './lib4.mjs';

const { RAID_WAVE_ROLL, RAID_WAVE_COUNT, RAID_MIN_TARGET_POWER } = L.economy;

const JE = Number(process.env.JE || 20000);
const DECKEL = Number(process.env.DECKEL || 8);
const DEF_WEIGHT = process.env.DEF_WEIGHT !== undefined ? Number(process.env.DEF_WEIGHT) : 0.3;
const ESC = process.env.ESC ? process.env.ESC.split(',').map(Number) : null;
const BUNKER = process.env.BUNKER !== undefined ? Number(process.env.BUNKER) : 0;
const WAVES = process.env.WAVES !== undefined ? Number(process.env.WAVES) : RAID_WAVE_COUNT;
// WIDX waehlt die Welle innerhalb des Raids (0-basiert) und damit die ESKALATIONSPHASE. Ohne ESC
// ist der Wert folgenlos. Fuer die letzte Phase: WIDX=WAVES-1.
const WIDX = process.env.WIDX !== undefined ? Number(process.env.WIDX) : 0;
const N = Number(process.argv[2] || 40);

// RF-Ziele der beiden Salven-ANLAGEN - nur diese Typen landen im rfPool und koennen von der Salve
// getroffen werden (combat.ts, rfTypeIds). Aus der Tabelle im Code gelesen, nicht gesetzt.
const RF_ZIELE = {
  sentinelkanone: Object.keys(L.cc.RAPIDFIRE.sentinelkanone || {}),
  ultimatekanone: Object.keys(L.cc.RAPIDFIRE.ultimatekanone || {}),
};

const DEFENSE_LARGE = {
  raketenwerfer: 300, leichteslaser: 200, schwereslaser: 150, gausskanone: 100,
  ionengeschuetz: 100, plasmawerfer: 60, sentinelkanone: 80, ultimatekanone: 30,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};
const DEFENSE_SMALL = {
  raketenwerfer: 80, leichteslaser: 60, schwereslaser: 30, gausskanone: 15,
  kleineschildkuppel: 1, grosseschildkuppel: 1,
};
// Reale Endgame-Flotte aus dem Anlass von Entscheidung 19 (Nutzer-Screenshot, 993.604 Schiffe),
// identisch zu BASIS + SALVEN_BESTAND in run_salven_19.mjs.
const FLEET_ENDGAME = {
  leicht: 104823, schwer: 110898, kreuzer: 53467, schlachtschiff: 53872, bomber: 75647,
  schlachtkreuzer: 200011, zerstoerer: 200007, reaper: 194602,
  salvenjaeger: 150, salvenkreuzer: 90, salvendreadnought: 30, imperator: 6,
};
// Volle Verteidigung am Endgame-Konto: dieselbe Zusammensetzung wie DEFENSE_LARGE, aber auf
// maxCount der beiden Salven-Anlagen (150/60) und entsprechend hochskalierten Standardanlagen.
// AUSDRUECKLICH EINE SETZUNG, keine Messung - die Zelle dient nur der Groessenordnung.
const DEFENSE_ENDGAME = {
  raketenwerfer: 3000, leichteslaser: 2000, schwereslaser: 1500, gausskanone: 1000,
  ionengeschuetz: 1000, plasmawerfer: 600, sentinelkanone: 150, ultimatekanone: 60,
  kleineschildkuppel: 1, grosseschildkuppel: 1, gigantschildkuppel: 1,
};

const CASES = [
  ['voll', L.FLEET_LARGE, DEFENSE_LARGE, 'voll / grosse Flotte + volle Verteidigung'],
  ['mittel', L.FLEET_LARGE, DEFENSE_LARGE, 'mittel / grosse Flotte'],
  ['voll', L.FLEET_SMALL, DEFENSE_SMALL, 'voll / kleine Flotte + kleine Verteidigung'],
  ['schwach', L.FLEET_SMALL, DEFENSE_SMALL, 'schwach / kleine Flotte'],
  ['voll', FLEET_ENDGAME, DEFENSE_ENDGAME, 'ENDGAME 993.604 Schiffe (Anlass von 19)'],
];

// Erzeugt EINE Welle wie run_raid.mjs, ohne Kampf. Die Bemessungsgrundlage ist die UNGESCHAEDIGTE
// Flotte - das ist die erste Welle und damit die GROESSTE; spaetere Wellen schrumpfen mit der
// dezimierten Flotte mit (negative Rueckkopplung, Befund D). Wer die Obergrenze sucht, misst hier
// richtig; der Mittelwert ueber einen ganzen Raid liegt niedriger.
function eineWelle(fleet, defense, wIndex) {
  let defensePower = 0, fleetPower = 0;
  Object.keys(defense).forEach((id) => {
    const b = L.combat.baseStats(id);
    defensePower += defense[id] * (b.waffen + b.schild + b.panzerung);
  });
  Object.keys(fleet).forEach((id) => {
    const b = L.combat.baseStats(id);
    fleetPower += fleet[id] * (b.waffen + b.schild + b.panzerung);
  });
  const combinedPower = fleetPower * 0.7 + defensePower * DEF_WEIGHT;
  const waveFactor = L.combat.pick503020(RAID_WAVE_ROLL);
  const phase = ESC ? Math.min(ESC.length - 1, Math.floor((wIndex / WAVES) * ESC.length)) : 0;
  const escFactor = ESC ? ESC[phase] : 1;
  const waveTargetPower = Math.max(combinedPower, RAID_MIN_TARGET_POWER) * waveFactor * escFactor;
  const profileW = L.combat.pickWaveProfile('raid');
  const letztePhase = ESC ? phase === ESC.length - 1 : false;
  const bunkerAnteil = BUNKER > 0 && letztePhase ? BUNKER : 0;
  const npcShips = L.combat.generateFallbackFleet(waveTargetPower * (1 - bunkerAnteil), profileW);
  if (bunkerAnteil > 0) {
    const bb = L.combat.baseStats('bomber');
    npcShips.bomber = (npcShips.bomber || 0) + Math.round((waveTargetPower * bunkerAnteil) / (bb.waffen + bb.schild + bb.panzerung));
  }
  return { npcShips, combinedPower };
}

const treffer = (n) => Math.min(DECKEL, Math.max(1, Math.ceil(n / JE)));

console.log(`=== Wellengroesse je Typ gegen die Weg-2-Schwelle (JE = ${JE}, DECKEL = ${DECKEL}) ===`);
console.log(`${N} Wellen je Zelle, erste Welle (groesste Bemessungsgrundlage). MESSBUILD-WERTE.`);
console.log(`ESC=${ESC ? ESC.join('/') : 'aus'}  BUNKER=${BUNKER}`);
console.log('');
console.log('Zelle | combinedPower | groesster Typ (Einheiten) | Typen ueber JE | Salve heute -> Weg 2 (Sentinel / Ultimate)');

for (const [profile, fleet, defense, label] of CASES) {
  let maxAnyType = 0, maxAnyName = '';
  let ueberJE = 0, combined = 0;
  const salveHeute = { sentinelkanone: 0, ultimatekanone: 0 };
  const salveWeg2 = { sentinelkanone: 0, ultimatekanone: 0 };
  for (let i = 0; i < N; i++) {
    const { npcShips, combinedPower } = eineWelle(fleet, defense, WIDX);
    combined += combinedPower;
    Object.entries(npcShips).forEach(([id, n]) => {
      if (n > maxAnyType) { maxAnyType = n; maxAnyName = id; }
      if (n >= JE) ueberJE++;
    });
    // Salven-Trefferzahl je erfolgreichem Schuss: heute EIN Treffer je praesentem RF-Ziel-Typ,
    // unter Weg 2 min(DECKEL, ceil(n/JE)) je Typ.
    for (const anlage of ['sentinelkanone', 'ultimatekanone']) {
      if (!defense[anlage]) continue;
      RF_ZIELE[anlage].forEach((zielTyp) => {
        const n = npcShips[zielTyp] || 0;
        if (n <= 0) return;
        salveHeute[anlage] += 1;
        salveWeg2[anlage] += treffer(n);
      });
    }
  }
  const f = (a) => (salveHeute[a] > 0 ? `${(salveHeute[a] / N).toFixed(1)} -> ${(salveWeg2[a] / N).toFixed(1)}` : 'n/a');
  console.log(`${label} | ${(combined / N / 1e9).toFixed(2)} Mrd | ${maxAnyName} ${Math.round(maxAnyType).toLocaleString('de-DE')} | ${(ueberJE / N).toFixed(2)} je Welle | ${f('sentinelkanone')} / ${f('ultimatekanone')}`);
}
