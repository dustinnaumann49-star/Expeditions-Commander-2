import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { updateServerTimeOffset } from '../lib/serverTime';
import type { GameData, PlayerState, AppUser, GroupOperation, ActiveRaidInfo } from '../types/game';

interface GameContextValue {
  gameData: GameData | null;
  state: PlayerState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  buildShip: (shipId: string, qty: number) => Promise<void>;
  buildDefense: (defId: string, qty: number) => Promise<void>;
  buildBuilding: (buildingId: string) => Promise<void>;
  startResearch: (techId: string) => Promise<void>;
  buildImperator: () => Promise<void>;
  sendMission: (sektorId: string, selection: Record<string, number>) => Promise<void>;
  recallMission: (missionId: string) => Promise<void>;
  joinEvent: (selection: Record<string, number>) => Promise<void>;
  openContainer: (containerId: string) => Promise<void>;
  redeemRewardItem: (itemId: string) => Promise<void>;
  executeTrade: (amount: number, from: string, to: string) => Promise<void>;
  scrapShip: (shipId: string, qty: number) => Promise<void>;
  scrapDefense: (defId: string, qty: number) => Promise<void>;
  buyBooster: (boosterId: string) => Promise<void>;
  buyVoucher: (voucherId: string) => Promise<void>;
  savePreset: (name: string, ships: Record<string, number>) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  clearMessages: (type?: 'kampf' | 'farm') => Promise<void>;

  // Multiplayer
  users: AppUser[];
  parties: GroupOperation[];
  activeRaids: ActiveRaidInfo[];
  refreshParties: () => Promise<void>;
  refreshRaids: () => Promise<void>;
  createParty: (kind: 'expedition' | 'event', sektorId: string | undefined, ships: Record<string, number>, inviteUserIds: number[]) => Promise<void>;
  respondToParty: (opId: string, accept: boolean, ships: Record<string, number>) => Promise<void>;
  cancelParty: (opId: string) => Promise<void>;
  startParty: (opId: string) => Promise<void>;
  reinforceRaid: (targetUserId: number, ships: Record<string, number>) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [parties, setParties] = useState<GroupOperation[]>([]);
  const [activeRaids, setActiveRaids] = useState<ActiveRaidInfo[]>([]);

  function applyState(newState: PlayerState) {
    if (newState.serverTime) updateServerTimeOffset(newState.serverTime);
    setState(newState);
  }

  async function refresh() {
    setError(null);
    const [data, playerState] = await Promise.all([gameData ? Promise.resolve(gameData) : api.getGameData(), api.getState()]);
    setGameData(data);
    applyState(playerState);
  }

  async function refreshParties() {
    try {
      const res = await api.listMyParties();
      setParties(res.operations);
    } catch {
      // still, kein harter Fehler noetig - wird beim naechsten Poll erneut versucht
    }
  }

  async function refreshRaids() {
    try {
      const res = await api.listActiveRaids();
      setActiveRaids(res.raids);
    } catch {
      // siehe oben
    }
  }

  async function refreshUsers() {
    try {
      const res = await api.listUsers();
      setUsers(res.users);
    } catch {
      // siehe oben
    }
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    refreshUsers();
    refreshParties();
    refreshRaids();
    const interval = setInterval(() => {
      api.getState().then(applyState).catch(() => {});
      refreshUsers();
      refreshParties();
      refreshRaids();
    }, 3000);
    // Wenn der Tab aus dem Hintergrund zurueckkommt (Browser drosseln Timer dort teils stark),
    // sofort nachziehen statt bis zu 5s auf den naechsten Poll zu warten - wichtig fuer den
    // Online/Offline-Status anderer Spieler.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        api.getState().then(applyState).catch(() => {});
        refreshUsers();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generischer Wrapper: fuehrt einen API-Aufruf aus, aktualisiert bei Erfolg den Zustand,
  // setzt bei Fehler die Fehlermeldung (aus dem Server-Response).
  async function run(fn: () => Promise<PlayerState>) {
    try {
      const newState = await fn();
      applyState(newState);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Wie run(), aktualisiert danach zusaetzlich die Parteien-Liste (fuer Aktionen, die eine
  // gemeinsame Operation veraendern).
  async function runAndRefreshParties(fn: () => Promise<PlayerState>) {
    await run(fn);
    await refreshParties();
  }

  const value: GameContextValue = {
    gameData,
    state,
    loading,
    error,
    refresh,
    buildShip: (shipId, qty) => run(() => api.buildShip(shipId, qty)),
    buildDefense: (defId, qty) => run(() => api.buildDefense(defId, qty)),
    buildBuilding: (buildingId) => run(() => api.buildBuilding(buildingId)),
    startResearch: (techId) => run(() => api.startResearch(techId)),
    buildImperator: () => run(() => api.buildImperator()),
    sendMission: (sektorId, selection) => run(() => api.sendMission(sektorId, selection)),
    recallMission: (missionId) => run(() => api.recallMission(missionId)),
    joinEvent: (selection) => run(() => api.joinEvent(selection)),
    openContainer: (containerId) => run(() => api.openContainer(containerId)),
    redeemRewardItem: (itemId) => run(() => api.redeemRewardItem(itemId)),
    executeTrade: (amount, from, to) => run(() => api.executeTrade(amount, from, to)),
    scrapShip: (shipId, qty) => run(() => api.scrapShip(shipId, qty)),
    scrapDefense: (defId, qty) => run(() => api.scrapDefense(defId, qty)),
    buyBooster: (boosterId) => run(() => api.buyBooster(boosterId)),
    buyVoucher: (voucherId) => run(() => api.buyVoucher(voucherId)),
    savePreset: (name, ships) => run(() => api.savePreset(name, ships)),
    deletePreset: (presetId) => run(() => api.deletePreset(presetId)),
    clearMessages: (type) => run(() => api.clearMessages(type)),

    users,
    parties,
    activeRaids,
    refreshParties,
    refreshRaids,
    createParty: (kind, sektorId, ships, inviteUserIds) => runAndRefreshParties(() => api.createParty(kind, sektorId, ships, inviteUserIds)),
    respondToParty: (opId, accept, ships) => runAndRefreshParties(() => api.respondToParty(opId, accept, ships)),
    cancelParty: (opId) => runAndRefreshParties(() => api.cancelParty(opId)),
    startParty: (opId) => runAndRefreshParties(() => api.startParty(opId)),
    reinforceRaid: (targetUserId, ships) => run(() => api.reinforceRaid(targetUserId, ships)).then(refreshRaids),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame muss innerhalb von <GameProvider> verwendet werden.');
  return ctx;
}
