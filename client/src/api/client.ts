import type { GameData, PlayerState } from '../types/game';

const TOKEN_KEY = 'ec_token';
// Lokal (npm run dev) leer lassen -> nutzt den Vite-Proxy (siehe vite.config.ts).
// Auf Render.com in den Umgebungsvariablen der Client-Seite auf die Server-URL setzen
// (siehe render.yaml, VITE_API_BASE), da Client und Server dort auf unterschiedlichen Domains laufen.
const API_BASE = import.meta.env.VITE_API_BASE || '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getGameData: () => request<GameData>('/game/data'),
  getState: () => request<PlayerState>('/game/state'),
  buildShip: (shipId: string, qty: number) =>
    request<PlayerState>('/game/build/ship', { method: 'POST', body: JSON.stringify({ shipId, qty }) }),
  buildDefense: (defId: string, qty: number) =>
    request<PlayerState>('/game/build/defense', { method: 'POST', body: JSON.stringify({ defId, qty }) }),
  startResearch: (techId: string) =>
    request<PlayerState>('/game/research/start', { method: 'POST', body: JSON.stringify({ techId }) }),
  buildImperator: () => request<PlayerState>('/game/imperator/build', { method: 'POST' }),
  sendMission: (sektorId: string, selection: Record<string, number>) =>
    request<PlayerState>('/game/mission/send', { method: 'POST', body: JSON.stringify({ sektorId, selection }) }),
  recallMission: (missionId: string) =>
    request<PlayerState>('/game/mission/recall', { method: 'POST', body: JSON.stringify({ missionId }) }),
  joinEvent: (selection: Record<string, number>) =>
    request<PlayerState>('/game/event/join', { method: 'POST', body: JSON.stringify({ selection }) }),
  openContainer: (containerId: string) =>
    request<PlayerState>('/game/inventory/open', { method: 'POST', body: JSON.stringify({ containerId }) }),
  redeemRewardItem: (itemId: string) =>
    request<PlayerState>('/game/inventory/redeem', { method: 'POST', body: JSON.stringify({ itemId }) }),
  executeTrade: (amount: number, from: string, to: string) =>
    request<PlayerState>('/game/trade/execute', { method: 'POST', body: JSON.stringify({ amount, from, to }) }),
  scrapShip: (shipId: string, qty: number) =>
    request<PlayerState>('/game/scrap/ship', { method: 'POST', body: JSON.stringify({ shipId, qty }) }),
  scrapDefense: (defId: string, qty: number) =>
    request<PlayerState>('/game/scrap/defense', { method: 'POST', body: JSON.stringify({ defId, qty }) }),
  buyBooster: (boosterId: string) =>
    request<PlayerState>('/game/shop/booster', { method: 'POST', body: JSON.stringify({ boosterId }) }),
  buyVoucher: (voucherId: string) =>
    request<PlayerState>('/game/shop/voucher', { method: 'POST', body: JSON.stringify({ voucherId }) }),
};
