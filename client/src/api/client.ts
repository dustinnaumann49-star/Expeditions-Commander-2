import type { GameData, PlayerState, AppUser, GroupOperation, ActiveRaidInfo, SimulationResult, LeaderboardEntry, GalaxyOccupant, GalaxyPosition, SektorGalaxyPosition, IncomingDeployment } from '../types/game';

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
  buildBuilding: (buildingId: string) =>
    request<PlayerState>('/game/build/building', { method: 'POST', body: JSON.stringify({ buildingId }) }),
  buildModule: (moduleId: string) => request<PlayerState>('/game/build/module', { method: 'POST', body: JSON.stringify({ moduleId }) }),
  buildShipModule: (moduleId: string) => request<PlayerState>('/game/build/shipmodule', { method: 'POST', body: JSON.stringify({ moduleId }) }),
  buildDefenseModule: (moduleId: string) => request<PlayerState>('/game/build/defensemodule', { method: 'POST', body: JSON.stringify({ moduleId }) }),
  startResearch: (techId: string) =>
    request<PlayerState>('/game/research/start', { method: 'POST', body: JSON.stringify({ techId }) }),
  buildImperator: () => request<PlayerState>('/game/imperator/build', { method: 'POST' }),
  sendMission: (sektorId: string, selection: Record<string, number>) =>
    request<PlayerState>('/game/mission/send', { method: 'POST', body: JSON.stringify({ sektorId, selection }) }),
  recallMission: (missionId: string) =>
    request<PlayerState>('/game/mission/recall', { method: 'POST', body: JSON.stringify({ missionId }) }),
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
  setClass: (classId: string) =>
    request<PlayerState>('/game/class', { method: 'POST', body: JSON.stringify({ classId }) }),
  savePreset: (name: string, ships: Record<string, number>) =>
    request<PlayerState>('/game/preset/save', { method: 'POST', body: JSON.stringify({ name, ships }) }),
  deletePreset: (presetId: string) =>
    request<PlayerState>('/game/preset/delete', { method: 'POST', body: JSON.stringify({ presetId }) }),
  clearMessages: (type?: 'kampf' | 'farm') =>
    request<PlayerState>('/game/messages/clear', { method: 'POST', body: JSON.stringify({ type }) }),
  listUsers: () => request<{ users: AppUser[] }>('/game/users'),
  listMyParties: () => request<{ operations: GroupOperation[] }>('/game/party/list'),
  createParty: (kind: 'expedition', sektorId: string | undefined, ships: Record<string, number>, inviteUserIds: number[]) =>
    request<PlayerState>('/game/party/create', { method: 'POST', body: JSON.stringify({ kind, sektorId, ships, inviteUserIds }) }),
  respondToParty: (opId: string, accept: boolean, ships: Record<string, number>) =>
    request<PlayerState>('/game/party/respond', { method: 'POST', body: JSON.stringify({ opId, accept, ships }) }),
  cancelParty: (opId: string) => request<PlayerState>('/game/party/cancel', { method: 'POST', body: JSON.stringify({ opId }) }),
  startParty: (opId: string) => request<PlayerState>('/game/party/start', { method: 'POST', body: JSON.stringify({ opId }) }),
  respondAdminEncounter: (opId: string, action: 'extract' | 'continue') =>
    request<PlayerState>('/game/party/admiral-decide', { method: 'POST', body: JSON.stringify({ opId, action }) }),
  listActiveRaids: () => request<{ raids: ActiveRaidInfo[] }>('/game/raids/active'),
  getLeaderboard: () => request<{ leaderboard: LeaderboardEntry[] }>('/game/leaderboard'),
  simulateCombat: (sektorId: string, selection: Record<string, number>) =>
    request<{ simulation: SimulationResult }>('/game/simulate', { method: 'POST', body: JSON.stringify({ sektorId, selection }) }),
  getGalaxy: () =>
    request<{
      ownPosition: GalaxyPosition | null;
      occupants: GalaxyOccupant[];
      pirateBases: GalaxyPosition[];
      sektorPositions: SektorGalaxyPosition[];
      incomingDeployments: IncomingDeployment[];
      galaxySystems: number;
      galaxyPositions: number;
    }>('/game/galaxy'),
  galaxyPreview: (ships: Record<string, number>, target: { targetUserId: number } | { targetPosition: GalaxyPosition }) =>
    request<{ distance: number; durationMs: number; fuelCost: number }>('/game/galaxy/preview', {
      method: 'POST',
      body: JSON.stringify({ ships, ...target }),
    }),
  holdFleet: (targetUserId: number, ships: Record<string, number>) =>
    request<PlayerState>('/game/galaxy/hold', { method: 'POST', body: JSON.stringify({ targetUserId, ships }) }),
  recallHold: (deploymentId: string) => request<PlayerState>('/game/galaxy/recall', { method: 'POST', body: JSON.stringify({ deploymentId }) }),
};
