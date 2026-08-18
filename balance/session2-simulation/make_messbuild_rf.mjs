// Erzeugt die Messbuilds fuer die RF-Umbau-Diagnose (run_rf_depth.mjs).
//
// Gleiches Verfahren wie make_messbuild_r14.mjs / make_messbuild_44.mjs: der QUELLCODE bleibt
// unveraendert, variiert wird ausschliesslich eine KOMPILIERTE Stelle in einer Kopie des
// dist-Baums. Der ganze Baum wird kopiert, damit combatRunner.js seinen Worker
// (combat.worker.js) relativ zu sich selbst findet und dieselbe Aenderung auch IM Worker-Thread
// gilt.
//
// Zwei Varianten (Nutzeridee 18.08.2026):
//   A  = Klassen-RapidFire. Jedes Standard-Kampfschiff bekommt RF gegen die KOMPLETTE eigene
//        UI-Klasse (SHIP_GROUPS in client/src/lib/combatInfo.ts), waehlt aber weiterhin genau EIN
//        Ziel - im Gegensatz zu den Salvenschiffen, die jeden anfaelligen Typ einmal treffen.
//        Verteidigungsanlagen analog nach Geschuetzgroesse. Bomber behaelt zusaetzlich seine
//        Bunkerbrecher-Rolle gegen Anlagen.
//   AB = A plus geschaerfte Wellenprofile: 'schwarm' ist ueberwiegend Jaeger-Klasse, 'elitekader'
//        ueberwiegend Elite-Klasse, 'kampfgruppe' ueberwiegend Kreuzer-Klasse. Heute benutzen alle
//        drei Profile denselben vollstaendigen Pool und unterscheiden sich nur in der
//        Gewichtungskurve - deshalb enthaelt JEDE Welle jeden Typ.
//   C  = eigene Klasse PLUS die Klasse darunter ("die Groesseren kontern die Kleineren").
//        Grund: unter A gewinnt die Jaeger-Masse weiterhin jede Zelle, weil sie ueberhaupt keinen
//        Gegner hat (gemessen 18,4 % -> 8,5 % Verlust, also noch besser als vorher). Unter C
//        kontert die Kreuzer-Klasse die Jaeger-Klasse, die Elite-Klasse die Kreuzer-Klasse.
//   CB = C plus die geschaerften Wellenprofile aus B.
//
// WICHTIG: vorher im Server `npx tsc` laufen lassen - der Messbuild ist eine Kopie von dist/,
// ohne frischen Build kopiert man den alten Stand (Messregel 1).
//
// Aufruf: node make_messbuild_rf.mjs [rfWert]
//   Der RF-Wert innerhalb der abgedeckten Klassen ist der Kalibrier-Regler und steckt im
//   Ordnernamen (messbuild_rf_c4, messbuild_rf_c6, ...), damit zwei Werte nebeneinander
//   messbar bleiben.
import { cpSync, readFileSync, writeFileSync, appendFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('../../server/dist');

// ===== Klassen-Einteilung =====
// 1:1 aus SHIP_GROUPS (client/src/lib/combatInfo.ts) uebernommen, damit die Anzeige in der Werft
// und die Kampfregel dieselbe Einteilung benutzen. AUSNAHME: sandronator steht dort zwar in der
// Elite-Klasse, ist aber ein Versorgungsschiff und heute bewusst aus jedem militaerischen
// RapidFire ausgenommen - das bleibt so.
const KLASSEN = {
  jaeger: ['leicht', 'schwer'],
  kreuzer: ['kreuzer', 'schlachtschiff', 'bomber'],
  elite: ['schlachtkreuzer', 'zerstoerer', 'reaper'],
};

// RF-Wert innerhalb der abgedeckten Klassen. Einheitlich statt der heutigen Mischung 3/4/5, weil
// "jeder Konter ist gleich stark" der begreifbarste Zustand ist. 4 liegt in der Mitte der heutigen
// Werte. DAS IST DER KALIBRIER-REGLER dieser Variante - die Diagnose fragt zuerst, OB die
// Flottenzusammensetzung ueberhaupt etwas aendert, nicht wie stark.
const RF_KLASSE = Number(process.argv[2] || 4);

// Welche Klassen ein Schiff der jeweiligen Klasse abdeckt.
const ABDECKUNG_A = { jaeger: ['jaeger'], kreuzer: ['kreuzer'], elite: ['elite'] };
// C: eigene Klasse plus die Klasse darunter. Die Jaeger-Klasse hat nichts unter sich und bleibt
// deshalb bei ihrer eigenen - sie bekommt unter C ihren Gegner von OBEN (Kreuzer-Klasse).
const ABDECKUNG_C = { jaeger: ['jaeger'], kreuzer: ['kreuzer', 'jaeger'], elite: ['elite', 'kreuzer'] };

// Verteidigungsanlagen nach Geschuetzgroesse auf die drei Klassen abgebildet.
const DEF_KLASSE = {
  raketenwerfer: 'jaeger',
  leichteslaser: 'jaeger',
  schwereslaser: 'kreuzer',
  gausskanone: 'kreuzer',
  ionengeschuetz: 'elite',
  plasmawerfer: 'elite',
};

// Bunkerbrecher-Rolle des Bombers gegen stationaere Anlagen - bleibt unveraendert erhalten.
const BOMBER_GEGEN_ANLAGEN = { raketenwerfer: 20, leichteslaser: 20, schwereslaser: 10 };
// Plasmawerfer behaelt sein RF gegen den Imperator (steht in keiner der drei Klassen).
const PLASMA_EXTRA = { imperator: 2 };

function tabelleFuer(klasse, abdeckung) {
  const t = {};
  abdeckung[klasse].forEach((k) => KLASSEN[k].forEach((id) => (t[id] = RF_KLASSE)));
  return t;
}

// ===== Patch 1: RAPIDFIRE + ZIELERFASSUNG_BASE (combatConstants.js) =====
// Bewusst als MUTATION am exportierten Objekt angehaengt statt als Ersetzung des Objekt-Literals:
// robuster gegen Formatierungsaenderungen des Compilers, und die ESM-Live-Bindung sorgt dafuer,
// dass combat.js dieselbe (mutierte) Instanz sieht.
function constPatchFuer(abdeckung, defenseKlassenRf = true) {
  const rfPatch = {};
  Object.entries(KLASSEN).forEach(([klasse, ids]) => {
    ids.forEach((id) => (rfPatch[id] = tabelleFuer(klasse, abdeckung)));
  });
  rfPatch.bomber = { ...rfPatch.bomber, ...BOMBER_GEGEN_ANLAGEN };
  if (defenseKlassenRf) {
    Object.entries(DEF_KLASSE).forEach(([defId, klasse]) => (rfPatch[defId] = tabelleFuer(klasse, abdeckung)));
    rfPatch.plasmawerfer = { ...rfPatch.plasmawerfer, ...PLASMA_EXTRA };
  }

  return `
// ===== MESSBUILD: Klassen-RapidFire (nur Messkopie, Quellcode unveraendert) =====
const __RF_KLASSEN_PATCH = ${JSON.stringify(rfPatch, null, 2)};
for (const [attacker, table] of Object.entries(__RF_KLASSEN_PATCH)) {
    RAPIDFIRE[attacker] = table;
}
// Ohne einen ZIELERFASSUNG_BASE-Eintrag liefert getZielerfassungAccuracy() 0 und JEDER RF-Eintrag
// des Schuetzen ist toter Code (genau die Falle aus Entscheidung 4.4). 'leicht' hat heute keinen
// Eintrag, weil es bisher gar kein RF-Ziel hatte - mit Klassen-RF braucht es einen.
ZIELERFASSUNG_BASE['leicht'] = 0.25;
`;
}

// ===== Patch 2: weightsForProfile (combat.js) =====
// Der Pool aus generatePiratenFleet()/generateFallbackFleet() ist die Reihenfolge aus SHIPS,
// gefiltert um Spezial-/Versorgungsschiffe: leicht, schwer, kreuzer, schlachtschiff, bomber,
// schlachtkreuzer, zerstoerer, reaper. Die Gewichte sind positionsbezogen, deshalb wird die
// Laenge geprueft und im Zweifel auf die Originalkurve zurueckgefallen (stiller Ausweichwert
// waere sonst genau die Fehlerform aus Messregel 15 - hier bewusst mit Konsolen-Warnung).
const WEIGHTS_ANCHOR = `function weightsForProfile(profile, poolLength) {
    if (profile === 'elitekader')
        return Array.from({ length: poolLength }, (_, i) => 1 / (poolLength - i));
    if (profile === 'kampfgruppe')
        return Array.from({ length: poolLength }, () => 1);
    return Array.from({ length: poolLength }, (_, i) => 1 / (i + 1)); // 'schwarm' - bisherige Standardkurve
}`;

const WEIGHTS_PATCHED = `function weightsForProfile(profile, poolLength) {
    // ===== MESSBUILD RF-B: geschaerfte Wellenprofile =====
    // Anteile je Klasse an der Ziel-Power, innerhalb der Klasse gleich verteilt.
    const KLASSEN_ANTEIL = {
        schwarm:     { jaeger: 0.75, kreuzer: 0.20, elite: 0.05 },
        kampfgruppe: { jaeger: 0.20, kreuzer: 0.60, elite: 0.20 },
        elitekader:  { jaeger: 0.05, kreuzer: 0.20, elite: 0.75 },
    };
    const POOL_KLASSE = ['jaeger', 'jaeger', 'kreuzer', 'kreuzer', 'kreuzer', 'elite', 'elite', 'elite'];
    const anteil = KLASSEN_ANTEIL[profile] || KLASSEN_ANTEIL.kampfgruppe;
    if (poolLength !== POOL_KLASSE.length) {
        console.warn('MESSBUILD RF-B: unerwartete Pool-Laenge ' + poolLength + ' - Originalkurve');
        if (profile === 'elitekader')
            return Array.from({ length: poolLength }, (_, i) => 1 / (poolLength - i));
        if (profile === 'kampfgruppe')
            return Array.from({ length: poolLength }, () => 1);
        return Array.from({ length: poolLength }, (_, i) => 1 / (i + 1));
    }
    const proKlasse = { jaeger: 0, kreuzer: 0, elite: 0 };
    POOL_KLASSE.forEach((k) => (proKlasse[k] += 1));
    return POOL_KLASSE.map((k) => anteil[k] / proKlasse[k]);
}`;

function baueVariante(name, abdeckung, mitProfilen, defenseKlassenRf = true) {
  const target = resolve('.', name);
  if (existsSync(target)) rmSync(target, { recursive: true });
  cpSync(DIST, target, { recursive: true });

  const constFile = resolve(target, 'game/data/combatConstants.js');
  appendFileSync(constFile, constPatchFuer(abdeckung, defenseKlassenRf));

  if (mitProfilen) {
    const combatFile = resolve(target, 'game/combat.js');
    const src = readFileSync(combatFile, 'utf8');
    if (!src.includes(WEIGHTS_ANCHOR)) throw new Error('Anker weightsForProfile nicht gefunden');
    writeFileSync(combatFile, src.replace(WEIGHTS_ANCHOR, WEIGHTS_PATCHED));
  }
  console.log(`${name} -> ${target}${mitProfilen ? '   [+ geschaerfte Wellenprofile]' : ''}`);
}

const S = RF_KLASSE;
baueVariante(`messbuild_rf_a${S}`, ABDECKUNG_A, false);
baueVariante(`messbuild_rf_ab${S}`, ABDECKUNG_A, true);
baueVariante(`messbuild_rf_c${S}`, ABDECKUNG_C, false);
baueVariante(`messbuild_rf_cb${S}`, ABDECKUNG_C, true);

// ===== Diagnose-Variante A+E =====
// Klassen-RF UND abgesenkter Groessenklassen-Ausweichbonus (heute klein/gross 0,45,
// mittel/gross 0,18, Deckel EVASION_MAX_SIZE_MISMATCH 0,75). Grund: unter A wie unter C gewinnt
// die Jaeger-Masse jede gemessene Zelle. Diese Variante prueft die Vermutung, dass der Hebel
// dafuer NICHT die RF-Tabelle ist, sondern dieser Bonus. Sie ist ausdruecklich eine MESSUNG, kein
// Vorschlag - eine Mechanikaenderung braucht eine eigene Entscheidung.
const EVASION_PATCH = `
// ===== MESSBUILD RF-E: Groessenklassen-Ausweichbonus abgesenkt =====
SIZE_MISMATCH_EVASION_BONUS.klein.gross = 0.20;
SIZE_MISMATCH_EVASION_BONUS.mittel.gross = 0.08;
`;
for (const [eName, defRf] of [[`messbuild_rf_ae${S}`, true], [`messbuild_rf_ae${S}_defalt`, false]]) {
  baueVariante(eName, ABDECKUNG_A, false, defRf);
  appendFileSync(resolve('.', eName, 'game/data/combatConstants.js'), EVASION_PATCH);
  console.log(`${eName} -> [+ Ausweichbonus 0.20/0.08]${defRf ? '' : ' [Verteidigungsanlagen behalten ihr heutiges RF]'}`);
}
// Warum die zweite Fassung: mit Klassen-RF fuer Verteidigungsanlagen faellt der
// Verteidigungsverlust im Raid gemessen von 27,3 % auf 0,0 % - die Anlagen werden vollstaendig
// unantastbar. Das ist die Beschwerde des Nutzers vom 18.08.2026, nur schlimmer. Die Fassung
// '_defalt' laesst die Anlagen deshalb auf ihrer heutigen RF-Tabelle.

console.log(`RF-Wert innerhalb der abgedeckten Klassen: ${RF_KLASSE}`);
console.log('Quellcode unberuehrt:', resolve('../../server/src/game/data/combatConstants.ts'));
