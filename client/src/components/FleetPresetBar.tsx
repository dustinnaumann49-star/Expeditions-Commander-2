import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { shipName } from '../lib/combatInfo';

/**
 * Flotten-Vorlagen: speichern und uebernehmen.
 *
 * Vorlagen haengen am SPIELER, nicht am Sektor (`state.presets`, Server: `presets.ts`) - dieselbe
 * Vorlage laesst sich also im Sektor-Tab, beim Anlegen einer gemeinsamen Expedition und beim
 * Annehmen einer Einladung verwenden. Genau dafuer sitzt die Leiste in einer eigenen Komponente:
 * bis zum 18.08.2026 gab es sie nur in `Sektor.tsx`, im Multiplayer-Tab musste jede Flotte von
 * Hand eingetippt werden - auch von jedem eingeladenen Spieler.
 *
 * ZWEI DINGE, DIE BEIM UEBERNEHMEN PASSIEREN MUESSEN (und die die alte Fassung in `Sektor.tsx`
 * nicht getan hat - beim blossen Kopieren waeren sie mitgewandert):
 *
 *  1. FILTERN auf `availableIds`. Eine im Asteroiden-Feld gespeicherte Vorlage enthaelt
 *     Mining-Schiffe; der `FleetPicker`/die Sektor-Liste rendert nur die hier erlaubten Typen.
 *     Ungefiltert stuenden solche Eintraege UNSICHTBAR in der Auswahl und gingen trotzdem an den
 *     Server. Fuer P10 haette der Server sie abgelehnt, fuer P9 waeren sie tatsaechlich
 *     mitgeflogen - die Gegenpruefung dort ist am 18.08.2026 nachgezogen worden
 *     (`allowedShipIdsForOperation()` in `groupOps.ts`), aber die Auswahl soll gar nicht erst
 *     falsch werden.
 *  2. KLEMMEN auf den aktuellen Bestand. Sonst kommt der Fehler erst beim Absenden vom Server
 *     ("Nicht genug Schiffe verfügbar") - beim Annehmen einer Einladung besonders aergerlich.
 *
 * Weggefallene Posten werden NICHT still geschluckt, sondern als kurzer Hinweis unter der Leiste
 * angezeigt. Anteiliges Uebernehmen ist Absicht: bei einer Kreuzer-Vorlage, die zufaellig zwei
 * Jaeger enthaelt, ist das Weglassen der zwei Jaeger genau das Gewuenschte.
 */
export default function FleetPresetBar({
  availableIds,
  fleet,
  selection,
  setSelection,
}: {
  /** Schiffstypen, die an dieser Stelle ueberhaupt ausgewaehlt werden duerfen. */
  availableIds: string[];
  /** Aktuell verfuegbarer Bestand (bei Sektor-Missionen die bereits um unterwegs befindliche Schiffe bereinigte Menge). */
  fleet: Record<string, number>;
  selection: Record<string, number>;
  setSelection: (ships: Record<string, number>) => void;
}) {
  const { state, gameData, savePreset, deletePreset } = useGame();
  const [presetName, setPresetName] = useState('');
  const [note, setNote] = useState<string | null>(null);

  if (!state || !gameData) return null;

  const applyPreset = (ships: Record<string, number>) => {
    const next: Record<string, number> = {};
    const notUsable: string[] = [];
    const reduced: string[] = [];

    Object.entries(ships).forEach(([id, qty]) => {
      if (qty <= 0) return;
      if (!availableIds.includes(id)) {
        notUsable.push(shipName(gameData, id));
        return;
      }
      const avail = fleet[id] || 0;
      if (avail <= 0) {
        notUsable.push(shipName(gameData, id));
        return;
      }
      next[id] = Math.min(qty, avail);
      if (next[id] < qty) reduced.push(`${shipName(gameData, id)} ${next[id]} statt ${qty}`);
    });

    setSelection(next);

    const parts: string[] = [];
    if (notUsable.length > 0) parts.push(`nicht einsetzbar oder nicht vorhanden: ${notUsable.join(', ')}`);
    if (reduced.length > 0) parts.push(`auf den Bestand gekürzt: ${reduced.join(', ')}`);
    setNote(parts.length > 0 ? `Vorlage teilweise übernommen - ${parts.join('; ')}.` : null);
  };

  const selectionHasShips = Object.values(selection).some((n) => n > 0);

  return (
    <div style={{ marginTop: 8 }}>
      <div className="qty-row">
        <input
          className="qty-input"
          placeholder="Name für Vorlage"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
        />
        <button
          className="qty-btn"
          disabled={!selectionHasShips || presetName.trim() === ''}
          onClick={() => {
            savePreset(presetName, selection);
            setPresetName('');
            setNote(null);
          }}
        >
          Als Vorlage speichern
        </button>
      </div>

      {state.presets.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0' }}>Gespeicherte Flotten-Vorlagen</p>
          {state.presets.map((p) => (
            <div className="queue-item" key={p.id}>
              <span style={{ fontSize: 12 }}>
                {p.name} ({Object.entries(p.ships).map(([id, c]) => `${shipName(gameData, id)} x${c}`).join(', ')})
              </span>
              <span>
                <button className="qty-btn" onClick={() => applyPreset(p.ships)}>
                  Übernehmen
                </button>{' '}
                <button className="qty-btn" onClick={() => deletePreset(p.id)}>
                  Löschen
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {note && <p style={{ fontSize: 12, color: 'var(--accent-kristall)', marginTop: 4 }}>{note}</p>}
    </div>
  );
}
