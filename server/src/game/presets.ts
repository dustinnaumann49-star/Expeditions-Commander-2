import type { ActionResult } from './actions.js';
import type { PlayerState } from './types.js';

export function savePreset(state: PlayerState, name: string, ships: Record<string, number>): ActionResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Bitte einen Namen für die Vorlage angeben.' };
  const cleanShips: Record<string, number> = {};
  Object.entries(ships).forEach(([id, qty]) => {
    if (qty > 0) cleanShips[id] = qty;
  });
  if (Object.keys(cleanShips).length === 0) return { ok: false, error: 'Die Vorlage enthält keine Schiffe.' };

  const existing = state.presets.find((p) => p.name === trimmed);
  if (existing) {
    existing.ships = cleanShips;
  } else {
    if (state.presets.length >= 10) return { ok: false, error: 'Maximal 10 Vorlagen möglich. Lösche zuerst eine alte.' };
    state.presets.push({ id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), name: trimmed, ships: cleanShips });
  }
  return { ok: true };
}

export function deletePreset(state: PlayerState, presetId: string): ActionResult {
  const idx = state.presets.findIndex((p) => p.id === presetId);
  if (idx === -1) return { ok: false, error: 'Vorlage nicht gefunden.' };
  state.presets.splice(idx, 1);
  return { ok: true };
}
