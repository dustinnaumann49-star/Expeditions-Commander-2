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
//
// WICHTIG: vorher im Server `npx tsc` laufen lassen - der Messbuild ist eine Kopie von dist/,
// ohne frischen Build kopiert man den alten Stand (Messregel 1).
//
// Aufruf: node make_messbuild_rf.mjs
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

// RF-Wert innerhalb der eigenen Klasse. Einheitlich statt der heutigen Mischung 3/4/5, weil
// "jeder Konter ist gleich stark" der begreifbarste Zustand ist. 4 liegt in der Mitte der heutigen
// Werte. DAS IST DER KALIBRIER-REGLER dieser Variante - die Diagnose fragt zuerst, OB die
// Flottenzusammensetzung ueberhaupt etwas aendert, nicht wie stark.
const RF_KLASSE = 4;

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

function tabelleFuer(klasse) {
  const t = {};
  KLASSEN[klasse].forEach((id) => (t[id] = RF_KLASSE));
  return t;
}

// ===== Patch 1: RAPIDFIRE + ZIELERFASSUNG_BASE (combatConstants.js) =====
// Bewusst als MUTATION am exportierten Objekt angehaengt statt als Ersetzung des Objekt-Literals:
// robuster gegen Formatierungsaenderungen des Compilers, und die ESM-Live-Bindung sorgt dafuer,
// dass combat.js dieselbe (mutierte) Instanz sieht.
const rfPatch = {};
Object.entries(KLASSEN).forEach(([klasse, ids]) => {
  ids.forEach((id) => (rfPatch[id] = tabelleFuer(klasse)));
});
rfPatch.bomber = { ...rfPatch.bomber, ...BOMBER_GEGEN_ANLAGEN };
Object.entries(DEF_KLASSE).forEach(([defId, klasse]) => (rfPatch[defId] = tabelleFuer(klasse)));
rfPatch.plasmawerfer = { ...rfPatch.plasmawerfer, ...PLASMA_EXTRA };

const CONST_PATCH = `
// ===== MESSBUILD RF-A: Klassen-RapidFire (nur Messkopie, Quellcode unveraendert) =====
const __RF_KLASSEN_PATCH = ${JSON.stringify(rfPatch, null, 2)};
for (const [attacker, table] of Object.entries(__RF_KLASSEN_PATCH)) {
    RAPIDFIRE[attacker] = table;
}
// Ohne einen ZIELERFASSUNG_BASE-Eintrag liefert getZielerfassungAccuracy() 0 und JEDER RF-Eintrag
// des Schuetzen ist toter Code (genau die Falle aus Entscheidung 4.4). 'leicht' hat heute keinen
// Eintrag, weil es bisher gar kein RF-Ziel hatte - mit Klassen-RF braucht es einen.
ZIELERFASSUNG_BASE['leicht'] = 0.25;
`;

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

function baueVariante(name, mitProfilen) {
  const target = resolve('.', name);
  if (existsSync(target)) rmSync(target, { recursive: true });
  cpSync(DIST, target, { recursive: true });

  const constFile = resolve(target, 'game/data/combatConstants.js');
  appendFileSync(constFile, CONST_PATCH);

  if (mitProfilen) {
    const combatFile = resolve(target, 'game/combat.js');
    const src = readFileSync(combatFile, 'utf8');
    if (!src.includes(WEIGHTS_ANCHOR)) throw new Error('Anker weightsForProfile nicht gefunden');
    writeFileSync(combatFile, src.replace(WEIGHTS_ANCHOR, WEIGHTS_PATCHED));
  }
  console.log(`${name} -> ${target}${mitProfilen ? '   [Klassen-RF + geschaerfte Wellenprofile]' : '   [nur Klassen-RF]'}`);
}

baueVariante('messbuild_rf_a', false);
baueVariante('messbuild_rf_ab', true);
console.log('Quellcode unberuehrt:', resolve('../../server/src/game/data/combatConstants.ts'));
