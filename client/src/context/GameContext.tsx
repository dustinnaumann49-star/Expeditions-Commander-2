import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { GameData, PlayerState } from '../types/game';

interface GameContextValue {
  gameData: GameData | null;
  state: PlayerState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  buildShip: (shipId: string, qty: number) => Promise<void>;
  buildDefense: (defId: string, qty: number) => Promise<void>;
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
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const [data, playerState] = await Promise.all([gameData ? Promise.resolve(gameData) : api.getGameData(), api.getState()]);
    setGameData(data);
    setState(playerState);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.getState().then(setState).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generischer Wrapper: fuehrt einen API-Aufruf aus, aktualisiert bei Erfolg den Zustand,
  // setzt bei Fehler die Fehlermeldung (aus dem Server-Response).
  async function run(fn: () => Promise<PlayerState>) {
    try {
      const newState = await fn();
      setState(newState);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const value: GameContextValue = {
    gameData,
    state,
    loading,
    error,
    refresh,
    buildShip: (shipId, qty) => run(() => api.buildShip(shipId, qty)),
    buildDefense: (defId, qty) => run(() => api.buildDefense(defId, qty)),
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
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame muss innerhalb von <GameProvider> verwendet werden.');
  return ctx;
}
