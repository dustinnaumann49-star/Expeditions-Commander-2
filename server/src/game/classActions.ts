import { PLAYER_CLASSES, CLASS_CHANGE_COST_DM } from './data/classes.js';
import type { ActionResult } from './actions.js';
import type { PlayerState, PlayerClass } from './types.js';

// Erstwahl (state.playerClass === null) ist kostenlos, jeder weitere Wechsel kostet
// CLASS_CHANGE_COST_DM (Nutzerentscheidung: bewusst hoch angesetzt, damit die Wahl nicht beliebig
// je nach aktueller Kampf-/Wirtschaftslage hin- und hergewechselt wird, aber trotzdem jederzeit
// moeglich bleibt).
export function setPlayerClass(state: PlayerState, classId: string): ActionResult {
  if (!PLAYER_CLASSES.some((c) => c.id === classId)) {
    return { ok: false, error: 'Unbekannte Klasse.' };
  }
  const newClass = classId as PlayerClass;
  if (state.playerClass === null) {
    state.playerClass = newClass;
    return { ok: true };
  }
  if (state.playerClass === newClass) {
    return { ok: false, error: 'Du hast bereits diese Klasse.' };
  }
  if (state.resources.dm < CLASS_CHANGE_COST_DM) {
    return { ok: false, error: `Für einen Klassenwechsel benötigst du ${CLASS_CHANGE_COST_DM} Dunkle Materie.` };
  }
  state.resources.dm -= CLASS_CHANGE_COST_DM;
  state.playerClass = newClass;
  return { ok: true };
}
