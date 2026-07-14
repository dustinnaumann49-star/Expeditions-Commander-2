import { findShip, findDefense } from './combat.js';
import { TRADE_VALUE, TRADE_FEE, SCRAP_REFUND_RATE, BOOSTERS, SHOP_VOUCHERS } from './data/economy.js';
import { applyReward } from './inventory.js';
import type { ActionResult } from './actions.js';
import type { PlayerState } from './types.js';

// ========== HAENDLER (RESSOURCENTAUSCH) ==========

export function computeTradeReceive(amount: number, from: string, to: string): number {
  if (from === to || amount <= 0) return 0;
  const value = amount * TRADE_VALUE[from];
  return (value / TRADE_VALUE[to]) * (1 - TRADE_FEE);
}

export function executeTrade(state: PlayerState, amount: number, from: 'metall' | 'kristall' | 'deuterium', to: 'metall' | 'kristall' | 'deuterium'): ActionResult {
  if (amount <= 0 || from === to) return { ok: false, error: 'Ungültiger Tausch.' };
  if (amount > state.resources[from]) return { ok: false, error: 'Nicht genug Ressourcen.' };
  const received = computeTradeReceive(amount, from, to);
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
  state.fleet[shipId] -= effectiveQty;
  state.resources.metall += Math.round(ship.cost.metall * SCRAP_REFUND_RATE * effectiveQty);
  state.resources.kristall += Math.round(ship.cost.kristall * SCRAP_REFUND_RATE * effectiveQty);
  state.resources.deuterium += Math.round(ship.cost.deuterium * SCRAP_REFUND_RATE * effectiveQty);
  return { ok: true };
}

export function scrapDefense(state: PlayerState, defId: string, qty: number): ActionResult {
  const def = findDefense(defId);
  if (!def) return { ok: false, error: 'Unbekannte Verteidigungsanlage.' };
  const owned = state.defense[defId] || 0;
  if (qty <= 0) return { ok: false, error: 'Bitte eine gültige Anzahl angeben.' };
  const effectiveQty = Math.min(qty, owned);
  if (effectiveQty <= 0) return { ok: false, error: 'Keine Anlagen dieses Typs vorhanden.' };
  state.defense[defId] -= effectiveQty;
  state.resources.metall += Math.round(def.cost.metall * SCRAP_REFUND_RATE * effectiveQty);
  state.resources.kristall += Math.round(def.cost.kristall * SCRAP_REFUND_RATE * effectiveQty);
  state.resources.deuterium += Math.round(def.cost.deuterium * SCRAP_REFUND_RATE * effectiveQty);
  return { ok: true };
}

// ========== SHOP: BOOSTER + ZEIT-GUTSCHEINE ==========

export function buyBooster(state: PlayerState, boosterId: string): ActionResult {
  const booster = BOOSTERS.find((b) => b.id === boosterId);
  if (!booster) return { ok: false, error: 'Unbekannter Booster.' };
  if (state.resources.dm < booster.cost) return { ok: false, error: 'Nicht genug Dunkle Materie.' };
  state.resources.dm -= booster.cost;
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
  if (voucher.type === 'zeitgutschein_bau' && state.buildQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Schiffsbau.' };
  }
  if (voucher.type === 'zeitgutschein_forschung' && state.researchQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade keine Forschung.' };
  }
  state.resources.dm -= voucher.cost;
  applyReward(state, { type: voucher.type, label: voucher.label, percent: voucher.percent });
  return { ok: true };
}
