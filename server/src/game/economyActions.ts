import { findShip, findDefense } from './combat.js';
import { TRADE_VALUE, TRADE_FEE, SCRAP_REFUND_RATE, BOOSTERS, SHOP_VOUCHERS } from './data/economy.js';
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

// ========== SHOP: BOOSTER + ZEIT-GUTSCHEINE ==========

export function buyBooster(state: PlayerState, boosterId: string): ActionResult {
  const booster = BOOSTERS.find((b) => b.id === boosterId);
  if (!booster) return { ok: false, error: 'Unbekannter Booster.' };
  // Wirtschafts-Klasse "Schmuggler" (Nutzerentscheidung Juli 2026) - guenstigere Booster.
  const cost = Math.round(booster.cost * (state.economyClass === 'schmuggler' ? ECONOMY_SCHMUGGLER_BOOSTER_COST_MULTIPLIER : 1));
  if (state.resources.dm < cost) return { ok: false, error: 'Nicht genug Dunkle Materie.' };
  state.resources.dm -= cost;
  const now = Date.now();
  const currentExpiry = state.activeBoosters[boosterId] || now;
  const base = currentExpiry > now ? currentExpiry : now;
  state.activeBoosters[boosterId] = base + booster.durationHours * 3600 * 1000;
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
