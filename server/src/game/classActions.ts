import { PLAYER_CLASSES, CLASS_CHANGE_COST_DM } from './data/classes.js';
import { ECONOMY_CLASSES, ECONOMY_CLASS_CHANGE_COST_DM } from './data/economyClasses.js';
import type { ActionResult } from './actions.js';
import type { PlayerState, PlayerClass, EconomyClass } from './types.js';

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

// Wirtschafts-Klasse (Nutzerentscheidung Juli 2026, siehe types.ts EconomyClass): anders als die
// Kampf-Klasse kostet HIER JEDE Wahl ECONOMY_CLASS_CHANGE_COST_DM, auch die allererste - die
// Wirtschafts-Klasse ist ein rein optionaler Zusatz (kein Registrierungs-Zwang wie bei
// PlayerClass), daher keine kostenlose Erstwahl.
export function setEconomyClass(state: PlayerState, classId: string): ActionResult {
  if (!ECONOMY_CLASSES.some((c) => c.id === classId)) {
    return { ok: false, error: 'Unbekannte Wirtschafts-Klasse.' };
  }
  const newClass = classId as EconomyClass;
  if (state.economyClass === newClass) {
    return { ok: false, error: 'Du hast bereits diese Wirtschafts-Klasse.' };
  }
  if (state.resources.dm < ECONOMY_CLASS_CHANGE_COST_DM) {
    return { ok: false, error: `Für eine Wirtschafts-Klasse benötigst du ${ECONOMY_CLASS_CHANGE_COST_DM} Dunkle Materie.` };
  }
  state.resources.dm -= ECONOMY_CLASS_CHANGE_COST_DM;
  state.economyClass = newClass;
  return { ok: true };
}
