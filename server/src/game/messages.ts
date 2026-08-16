import type { PlayerState, CombatDetail, FarmDetail, SpyReportDetail, CombatUnitResult, SkirmishSummary } from './types.js';
import type { ActionResult } from './actions.js';

// ===== AGGREGATION DER EINZELKAMPF-TABELLEN (16.08.2026) =====
// Anlass, gemessen ueber `[Spielstand-Felder]` beim Serverstart: der groesste Spielstand lag bei
// 1477,6 KB, davon 1347,3 KB Nachrichten - und davon allein 998,6 KB Skirmish-Bloecke. Die
// Kampf-Replays, um die sich die Code-Doku sorgt, machten nur 64,8 KB aus. Der Speicherfresser
// waren die ZWEI VOLLSTAENDIGEN ERGEBNISTABELLEN, die jeder `SkirmishSummary` mitfuehrte: je eine
// Zeile pro Schiffstyp mit 17 Zahlenfeldern, fuer beide Seiten, PRO EINZELKAMPF. Eine
// Asteroiden-Mission laeuft 24 Stunden mit stuendlichem Kontakt
// (`ASTEROID_MISSION_DURATION_MS`), ein einzelner Farmbericht trug damit bis zu 24 solcher
// Tabellenpaare - rund 170 KB fuer EINE Nachricht.
//
// Das war die direkte Folge der Sammel-Entscheidung (Juli/August 2026, README Punkt 22): weniger
// Nachrichten, dafuer groessere - die Groesse hat damals niemand nachgemessen. Sie schlaegt doppelt
// durch, weil `processOverdueRaidsForOtherUsers` bei jedem tick() die vollstaendigen Spielstaende
// ALLER anderen Nutzer laedt und bei aktivem Raid auch wieder speichert.
//
// Loesung: die Tabellen werden nicht mehr je Einzelkampf gespeichert, sondern EINMAL je Bericht
// aufsummiert. Ausgangstext, Rundenzahl, Beute und Replay bleiben pro Einzelkampf erhalten - die
// aufklappbare Struktur und die Kampf-Visualisierung aendern sich also nicht.
//
// ZWEI VERSCHIEDENE SUMMIERUNGS-REGELN, das ist der Kern:
//   'npc'    - jede Stunde/Welle bringt FRISCHE Gegner. Stueckzahlen werden aufsummiert; die
//              Summe beantwortet "wie viele Feinde insgesamt".
//   'spieler'- es ist DIESELBE Flotte, die alle Kaempfe durchlaeuft. Aufsummieren wuerde eine
//              24h-Mission als 24-fache Flotte ausweisen. Deshalb: entsandte Stueckzahl aus dem
//              ERSTEN Kampf, ueberlebende aus dem LETZTEN, Verluste summiert. Damit gilt
//              weiterhin entsandt - Verluste = ueberlebend.
// Zaehler (Schaden, Schuesse, Treffer, RapidFire, Schild) werden in beiden Faellen summiert,
// Einheitenwerte (Waffen/Schild/Panzerung) sind je Einheit gleich und werden uebernommen.
//
// Der Gruppierungsschluessel enthaelt `ownerUsername` - ohne ihn wuerden bei Mehrspieler-Kaempfen
// zwei Teilnehmer mit demselben Schiffstyp zusammenfallen (README Punkt 16, genau dieser Fehler ist
// dort schon einmal aufgetreten).
type MergeMode = 'npc' | 'spieler';

const ZAEHLER_FELDER = ['dmgTaken', 'dmgDealt', 'shotsFired', 'hits', 'rapidFireTriggers', 'shieldDmgTaken', 'shieldRegen'] as const;

export function mergeUnitResults(tabellen: (CombatUnitResult[] | undefined)[], mode: MergeMode): CombatUnitResult[] {
  const acc = new Map<string, CombatUnitResult>();
  const zuerstGesehen = new Set<string>();

  for (const tabelle of tabellen) {
    if (!tabelle) continue;
    for (const row of tabelle) {
      const key = `${row.ownerUsername ?? ''}:${row.id}`;
      const vorhanden = acc.get(key);
      if (!vorhanden) {
        acc.set(key, { ...row });
        zuerstGesehen.add(key);
        continue;
      }
      ZAEHLER_FELDER.forEach((f) => {
        vorhanden[f] = (vorhanden[f] || 0) + (row[f] || 0);
      });
      // Verluste zaehlen in beiden Modi zusammen.
      if (row.lost !== undefined) vorhanden.lost = (vorhanden.lost || 0) + row.lost;
      if (row.destroyedCount !== undefined) vorhanden.destroyedCount = (vorhanden.destroyedCount || 0) + row.destroyedCount;
      if (mode === 'npc') {
        if (row.sent !== undefined) vorhanden.sent = (vorhanden.sent || 0) + row.sent;
        if (row.count !== undefined) vorhanden.count = (vorhanden.count || 0) + row.count;
        if (row.survived !== undefined) vorhanden.survived = (vorhanden.survived || 0) + row.survived;
        if (row.survivedCount !== undefined) vorhanden.survivedCount = (vorhanden.survivedCount || 0) + row.survivedCount;
      } else {
        // Entsandte Menge bleibt die des ersten Kampfes, ueberlebende die des letzten.
        if (row.survived !== undefined) vorhanden.survived = row.survived;
        if (row.survivedCount !== undefined) vorhanden.survivedCount = row.survivedCount;
      }
      // Einheitenwerte und Kennzeichen aus dem zuletzt gesehenen Eintrag uebernehmen.
      vorhanden.waffen = row.waffen;
      vorhanden.schild = row.schild;
      vorhanden.panzerung = row.panzerung;
      if (row.destroyed !== undefined) vorhanden.destroyed = row.destroyed;
    }
  }
  return [...acc.values()];
}

// Faltet die Einzelkampf-Tabellen eines bereits bestehenden Berichts in seine Gesamttabellen und
// entfernt sie danach. Wird sowohl beim Erzeugen neuer Berichte als auch bei der Migration alter
// Spielstaende benutzt (`loadPlayerState()`), damit alte Nachrichten ihre Zahlen nicht verlieren,
// sondern nur ihre Aufteilung. Gibt zurueck, ob etwas geaendert wurde.
export function foldSkirmishTables(
  skirmishes: SkirmishSummary[] | undefined,
  ziel: { npcResults?: CombatUnitResult[]; playerResults?: CombatUnitResult[] }
): boolean {
  if (!skirmishes || skirmishes.length === 0) return false;
  const hatTabellen = skirmishes.some((s) => (s.npcResults && s.npcResults.length) || (s.playerResults && s.playerResults.length));
  if (!hatTabellen) return false;

  // Nur fuellen, wenn die Gesamttabellen noch leer sind - ein bereits aggregierter Bericht darf
  // nicht ein zweites Mal aufsummiert werden.
  if (!ziel.npcResults || ziel.npcResults.length === 0) {
    ziel.npcResults = mergeUnitResults(skirmishes.map((s) => s.npcResults), 'npc');
  }
  if (!ziel.playerResults || ziel.playerResults.length === 0) {
    ziel.playerResults = mergeUnitResults(skirmishes.map((s) => s.playerResults), 'spieler');
  }
  skirmishes.forEach((s) => {
    delete s.npcResults;
    delete s.playerResults;
  });
  return true;
}

// Haengt einen Einzelkampf an das Sammel-Log an und faltet seine Tabellen SOFORT in die
// laufenden Gesamttabellen - der Einzeleintrag traegt sie danach nicht mehr. Dadurch bleibt der
// Speicherbedarf eines Berichts konstant, egal ob eine Mission 6 oder 24 Kaempfe hat.
// Die laufende Summierung funktioniert, weil beide Modi in `mergeUnitResults()` assoziativ sind:
// im Modus 'spieler' traegt die bereits akkumulierte Tabelle die entsandte Menge des ERSTEN
// Kampfes, und der neue Eintrag setzt die ueberlebende Menge auf den aktuellen Stand.
export function recordSkirmish(
  log: SkirmishSummary[],
  totals: { npc: CombatUnitResult[]; player: CombatUnitResult[] },
  entry: SkirmishSummary
): void {
  totals.npc = mergeUnitResults([totals.npc, entry.npcResults], 'npc');
  totals.player = mergeUnitResults([totals.player, entry.playerResults], 'spieler');
  delete entry.npcResults;
  delete entry.playerResults;
  log.push(entry);
}

export function pushMessage(
  state: PlayerState,
  type: 'kampf' | 'farm',
  text: string,
  detail: CombatDetail | FarmDetail | SpyReportDetail | null = null,
  galaxyLink?: { system: number; position: number }
) {
  state.messages.unshift({
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    type,
    time: Date.now(),
    text,
    detail,
    galaxyLink,
  });
  // Nachrichtenliste nicht unbegrenzt wachsen lassen
  if (state.messages.length > 200) state.messages.length = 200;
}

export function clearMessages(state: PlayerState, type?: 'kampf' | 'farm'): ActionResult {
  if (type) {
    state.messages = state.messages.filter((m) => m.type !== type);
  } else {
    state.messages = [];
  }
  return { ok: true };
}
