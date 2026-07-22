import type { PlayerState, CombatDetail, FarmDetail, SpyReportDetail } from './types.js';
import type { ActionResult } from './actions.js';

export function pushMessage(
  state: PlayerState,
  type: 'kampf' | 'farm',
  text: string,
  detail: CombatDetail | FarmDetail | SpyReportDetail | null = null
) {
  state.messages.unshift({
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    type,
    time: Date.now(),
    text,
    detail,
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
