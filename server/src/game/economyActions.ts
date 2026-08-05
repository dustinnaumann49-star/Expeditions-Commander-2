import { findShip, findDefense } from './combat.js';
import { TRADE_VALUE, TRADE_FEE, SCRAP_REFUND_RATE, BOOSTERS, BOOSTER_DURATION_OPTIONS, SHOP_VOUCHERS, TEILE_CONVERT_RESOURCES } from './data/economy.js';
import {
  ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER,
  ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER,
  ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER,
} from './data/economyClasses.js';
import { applyReward } from './inventory.js';
import type { ActionResult } from './actions.js';
import type { PlayerState } from './types.js';

// ========== HAENDLER (RESSOURCENTAUSCH) ==========

// Wirtschafts-Klasse "Schmuggler" (Nutzerentscheidung Juli 2026, siehe economyClasses.ts) -
// halbiert die Handelsgebuehr. `state` optional (null), damit computeTradeReceive() weiterhin auch
// ohne Spielerkontext (z.B. reine Vorschau-Berechnungen) aufrufbar bleibt.
export function effectiveTradeFee(state: PlayerState | null): number {
  return state?.economyClass === 'schmuggler' ? TRADE_FEE * ECONOMY_SCHMUGGLER_TRADE_FEE_MULTIPLIER : TRADE_FEE;
}

export function effectiveScrapRefundRate(state: PlayerState | null): number {
  return state?.economyClass === 'schmuggler' ? SCRAP_REFUND_RATE * ECONOMY_SCHMUGGLER_SCRAP_REFUND_MULTIPLIER : SCRAP_REFUND_RATE;
}

export function computeTradeReceive(amount: number, from: string, to: string, state: PlayerState | null = null): number {
  if (from === to || amount <= 0) return 0;
  const value = amount * TRADE_VALUE[from];
  return (value / TRADE_VALUE[to]) * (1 - effectiveTradeFee(state));
}

export function executeTrade(state: PlayerState, amount: number, from: 'metall' | 'kristall' | 'deuterium', to: 'metall' | 'kristall' | 'deuterium'): ActionResult {
  if (amount <= 0 || from === to) return { ok: false, error: 'Ungültiger Tausch.' };
  if (amount > state.resources[from]) return { ok: false, error: 'Nicht genug Ressourcen.' };
  const received = computeTradeReceive(amount, from, to, state);
  state.resources[from] -= amount;
  state.resources[to] += received;
  return { ok: true };
}

// ========== SCHROTTHAENDLER ==========

export function scrapShip(state: PlayerState, shipId: string, qty: number): ActionResult {
  const ship = findShip(shipId);
  if (!ship || !ship.cost) return { ok: false, error: 'Dieses Schiff kann nicht verschrottet werden.' };
  const owned = state.fleet[shipId] || 0;
  if (qty <= 0) return { ok: false, error: 'Bitte eine gültige Anzahl angeben.' };
  const effectiveQty = Math.min(qty, owned);
  if (effectiveQty <= 0) return { ok: false, error: 'Keine Schiffe dieses Typs vorhanden.' };
  const rate = effectiveScrapRefundRate(state);
  state.fleet[shipId] -= effectiveQty;
  state.resources.metall += Math.round(ship.cost.metall * rate * effectiveQty);
  state.resources.kristall += Math.round(ship.cost.kristall * rate * effectiveQty);
  state.resources.deuterium += Math.round(ship.cost.deuterium * rate * effectiveQty);
  return { ok: true };
}

export function scrapDefense(state: PlayerState, defId: string, qty: number): ActionResult {
  const def = findDefense(defId);
  if (!def) return { ok: false, error: 'Unbekannte Verteidigungsanlage.' };
  const owned = state.defense[defId] || 0;
  if (qty <= 0) return { ok: false, error: 'Bitte eine gültige Anzahl angeben.' };
  const effectiveQty = Math.min(qty, owned);
  if (effectiveQty <= 0) return { ok: false, error: 'Keine Anlagen dieses Typs vorhanden.' };
  const rate = effectiveScrapRefundRate(state);
  state.defense[defId] -= effectiveQty;
  state.resources.metall += Math.round(def.cost.metall * rate * effectiveQty);
  state.resources.kristall += Math.round(def.cost.kristall * rate * effectiveQty);
  state.resources.deuterium += Math.round(def.cost.deuterium * rate * effectiveQty);
  return { ok: true };
}

// ========== TEILE-UMWANDLUNG (05.08.2026, Nutzerentscheidung) ==========
// Einziger Verbrauch von Waffen-/Schild-/Panzerungs-Teilen war bisher der Imperator (max. 6
// Stueck) - ueberschuessige Teile aus Containern stapelten sich sonst nutzlos. Analog zu
// scrapShip()/scrapDefense() oben: verlustbehaftete Umwandlung, kein 1:1-Tausch (siehe
// TEILE_CONVERT_RESOURCES in economy.ts fuer die Rate-Begruendung).
export function convertTeile(state: PlayerState, part: 'waffen' | 'schild' | 'panzerung', qty: number): ActionResult {
  if (part !== 'waffen' && part !== 'schild' && part !== 'panzerung') return { ok: false, error: 'Unbekannte Teile-Sorte.' };
  if (qty <= 0) return { ok: false, error: 'Bitte eine gültige Anzahl angeben.' };
  const owned = state.teile[part] || 0;
  const effectiveQty = Math.min(qty, Math.floor(owned));
  if (effectiveQty <= 0) return { ok: false, error: 'Keine Teile dieser Sorte vorhanden.' };
  state.teile[part] -= effectiveQty;
  state.resources.metall += TEILE_CONVERT_RESOURCES.metall * effectiveQty;
  state.resources.kristall += TEILE_CONVERT_RESOURCES.kristall * effectiveQty;
  state.resources.deuterium += TEILE_CONVERT_RESOURCES.deuterium * effectiveQty;
  return { ok: true };
}

// ========== SHOP: BOOSTER + ZEIT-GUTSCHEINE ==========

// `durationHours` (Nutzerentscheidung 04.08.2026): optionaler Parameter, ueber den 7-/30-Tage-
// Kaeufe ausgewaehlt werden - MUSS exakt einem Eintrag aus BOOSTER_DURATION_OPTIONS entsprechen
// (serverseitig geprueft, der Client kann sich keinen eigenen Preis/keine eigene Laufzeit
// ausdenken). Fehlt der Parameter, greift wie bisher der 24h-Basispreis. Wirkt auf DIESELBE
// Booster-ID/denselben Ablauf-Zeitstempel wie ein normaler 24h-Kauf (siehe Stacking-Logik unten) -
// kein neuer Effekt-Code noetig, isBoosterActive() etc. bleiben unveraendert.
export function buyBooster(state: PlayerState, boosterId: string, durationHours?: number): ActionResult {
  const booster = BOOSTERS.find((b) => b.id === boosterId);
  if (!booster) return { ok: false, error: 'Unbekannter Booster.' };
  const durationOption = durationHours === undefined
    ? BOOSTER_DURATION_OPTIONS[0]
    : BOOSTER_DURATION_OPTIONS.find((o) => o.hours === durationHours);
  if (!durationOption) return { ok: false, error: 'Ungültige Booster-Laufzeit.' };
  // Wirtschafts-Klasse "Schmuggler" (Nutzerentscheidung Juli 2026) - guenstigere Booster.
  const economyMult = state.economyClass === 'schmuggler' ? ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER : 1;
  const cost = Math.round(booster.cost * durationOption.costMultiplier * economyMult);
  if (state.resources.dm < cost) return { ok: false, error: 'Nicht genug Dunkle Materie.' };
  state.resources.dm -= cost;
  const now = Date.now();
  const currentExpiry = state.activeBoosters[boosterId] || now;
  const base = currentExpiry > now ? currentExpiry : now;
  state.activeBoosters[boosterId] = base + durationOption.hours * 3600 * 1000;
  return { ok: true };
}

export function buyVoucher(state: PlayerState, voucherId: string): ActionResult {
  const voucher = SHOP_VOUCHERS.find((v) => v.id === voucherId);
  if (!voucher) return { ok: false, error: 'Unbekannter Gutschein.' };
  if (state.resources.dm < voucher.cost) return { ok: false, error: 'Nicht genug Dunkle Materie.' };
  if (voucher.type === 'zeitgutschein_bau_schiffe' && state.buildQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Schiffsbau.' };
  }
  if (voucher.type === 'zeitgutschein_bau_verteidigung' && state.defenseQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Verteidigungsbau.' };
  }
  if (voucher.type === 'zeitgutschein_bau_gebaeude' && state.buildingQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Gebäudeausbau.' };
  }
  if (voucher.type === 'zeitgutschein_forschung' && state.researchQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade keine Forschung.' };
  }
  state.resources.dm -= voucher.cost;
  applyReward(state, { type: voucher.type, label: voucher.label, percent: voucher.percent });
  return { ok: true };
}
