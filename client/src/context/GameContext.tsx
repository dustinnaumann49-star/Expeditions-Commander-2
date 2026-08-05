import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { updateServerTimeOffset } from '../lib/serverTime';
import type { GameData, PlayerState, AppUser, GroupOperation, ActiveRaidInfo, GalaxyOccupant, GalaxyPosition, SektorGalaxyPosition, IncomingDeployment, GalaxyEvent, PirateBaseSummary, Alliance, Station } from '../types/game';

interface GameContextValue {
  gameData: GameData | null;
  state: PlayerState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  buildShip: (shipId: string, qty: number) => Promise<void>;
  buildDefense: (defId: string, qty: number) => Promise<void>;
  buildBuilding: (buildingId: string) => Promise<void>;
  buildModule: (moduleId: string) => Promise<void>;
  buildShipModule: (moduleId: string) => Promise<void>;
  buildDefenseModule: (moduleId: string) => Promise<void>;
  startResearch: (techId: string) => Promise<void>;
  buildImperator: () => Promise<void>;
  sendMission: (sektorId: string, selection: Record<string, number>) => Promise<void>;
  recallMission: (missionId: string) => Promise<void>;
  openContainer: (containerId: string) => Promise<void>;
  openAllContainers: (tier: 'silber' | 'gold' | 'elite') => Promise<void>;
  redeemRewardItem: (itemId: string) => Promise<void>;
  redeemAllRewardItems: (itemId: string) => Promise<void>;
  executeTrade: (amount: number, from: string, to: string) => Promise<void>;
  scrapShip: (shipId: string, qty: number) => Promise<void>;
  scrapDefense: (defId: string, qty: number) => Promise<void>;
  convertTeile: (part: 'waffen' | 'schild' | 'panzerung', qty: number) => Promise<void>;
  buyBooster: (boosterId: string, durationHours?: number) => Promise<void>;
  buyVoucher: (voucherId: string) => Promise<void>;
  setPlayerClass: (classId: string) => Promise<void>;
  setEconomyClass: (classId: string) => Promise<void>;
  savePreset: (name: string, ships: Record<string, number>) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  clearMessages: (type?: 'kampf' | 'farm') => Promise<void>;

  // Multiplayer
  users: AppUser[];
  parties: GroupOperation[];
  activeRaids: ActiveRaidInfo[];
  refreshParties: () => Promise<void>;
  refreshRaids: () => Promise<void>;
  createParty: (kind: 'expedition', sektorId: string | undefined, ships: Record<string, number>, inviteUserIds: number[]) => Promise<void>;
  respondToParty: (opId: string, accept: boolean, ships: Record<string, number>) => Promise<void>;
  cancelParty: (opId: string) => Promise<void>;
  startParty: (opId: string) => Promise<void>;
  recallParty: (opId: string) => Promise<void>;
  respondAdminEncounter: (opId: string, action: 'extract' | 'continue') => Promise<void>;

  // Galaxie
  galaxyOccupants: GalaxyOccupant[];
  ownGalaxyPosition: GalaxyPosition | null;
  pirateBases: GalaxyPosition[];
  pirateBaseSummaries: PirateBaseSummary[];
  sektorPositions: SektorGalaxyPosition[];
  stationPositions: { allianceName: string; system: number; position: number }[];
  incomingDeployments: IncomingDeployment[];
  galaxyEvents: GalaxyEvent[];
  refreshGalaxy: () => Promise<void>;
  holdFleet: (targetUserId: number, ships: Record<string, number>) => Promise<void>;
  recallHold: (deploymentId: string) => Promise<void>;
  relocateBase: (system: number, position: number) => Promise<void>;
  claimGalaxyEvent: (eventId: string, ships: Record<string, number>) => Promise<void>;
  attackPirateBase: (baseId: string, ships: Record<string, number>) => Promise<void>;
  spyOnPirateBase: (baseId: string, qty: number) => Promise<void>;

  // Allianz-Station
  alliance: Alliance | null;
  station: Station | null;
  refreshAlliance: () => Promise<void>;
  createAlliance: (name: string) => Promise<void>;
  inviteToAlliance: (userId: number) => Promise<void>;
  respondToAllianceInvite: (allianceId: string, accept: boolean) => Promise<void>;
  foundStation: (system: number, position: number) => Promise<void>;
  buildStationBuilding: (stationId: string, buildingId: string) => Promise<void>;
  buildStationModule: (stationId: string, moduleId: string) => Promise<void>;
  depositToStation: (stationId: string, resource: string, amount: number) => Promise<void>;
  withdrawFromStation: (stationId: string, resource: string, amount: number) => Promise<void>;
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
  const [galaxyOccupants, setGalaxyOccupants] = useState<GalaxyOccupant[]>([]);
  const [ownGalaxyPosition, setOwnGalaxyPosition] = useState<GalaxyPosition | null>(null);
  const [pirateBases, setPirateBases] = useState<GalaxyPosition[]>([]);
  const [pirateBaseSummaries, setPirateBaseSummaries] = useState<PirateBaseSummary[]>([]);
  const [sektorPositions, setSektorPositions] = useState<SektorGalaxyPosition[]>([]);
  const [stationPositions, setStationPositions] = useState<{ allianceName: string; system: number; position: number }[]>([]);
  const [incomingDeployments, setIncomingDeployments] = useState<IncomingDeployment[]>([]);
  const [galaxyEvents, setGalaxyEvents] = useState<GalaxyEvent[]>([]);
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [station, setStation] = useState<Station | null>(null);

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

  async function refreshGalaxy() {
    try {
      const res = await api.getGalaxy();
      // Fallback auf leere Arrays (Nutzerentscheidung Juli 2026: eine fehlkonfigurierte
      // VITE_API_BASE liess den Client bisher auf HTML statt JSON antworten - request() faengt das
      // zwar als leeres Objekt {} ab statt zu werfen, aber ".filter()" auf den dann UNDEFINED
      // Feldern liess die ganze App abstuerzen. Defensive Absicherung, damit eine kaputte/leere
      // Antwort hoechstens leere Listen zeigt statt eines White-Screen-Crashs).
      setGalaxyOccupants(res.occupants || []);
      setOwnGalaxyPosition(res.ownPosition ?? null);
      setPirateBases(res.pirateBases || []);
      setPirateBaseSummaries(res.pirateBaseSummaries || []);
      setSektorPositions(res.sektorPositions || []);
      setStationPositions(res.stationPositions || []);
      setIncomingDeployments(res.incomingDeployments || []);
      setGalaxyEvents(res.events || []);
    } catch {
      // siehe oben
    }
  }

  async function refreshAlliance() {
    try {
      const res = await api.getAlliance();
      setAlliance(res.alliance);
      setStation(res.station);
    } catch {
      // siehe oben
    }
  }

  async function refreshUsers() {
    try {
      const res = await api.listUsers();
      setUsers(res.users || []);
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
    refreshGalaxy();
    refreshAlliance();

    function pollTick() {
      api.getState().then(applyState).catch(() => {});
      refreshUsers();
      refreshParties();
      refreshRaids();
      refreshGalaxy();
      refreshAlliance();
    }

    // Pollt NUR, waehrend der Tab sichtbar ist (Nutzerentscheidung 30.07.2026: 6 parallele
    // Anfragen + Ressourcen-Countup-Animationen alle 3s auch im Hintergrund-Tab kosteten
    // spuerbar CPU/Akku, ohne dass jemand hinschaute). Einziger Nebeneffekt: der eigene
    // Online-Status (last_seen, siehe db.ts ONLINE_THRESHOLD_MS) faellt fuer Mitspieler nach
    // spaetestens 15s auf "Offline", solange der Tab im Hintergrund ist - Spiellogik selbst
    // laeuft serverseitig unabhaengig vom Client-Polling weiter (siehe heartbeat.ts).
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(pollTick, 3000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    if (document.visibilityState === 'visible') startPolling();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        pollTick(); // sofort nachziehen statt bis zu 3s auf den naechsten Poll zu warten
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopPolling();
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

  // Wie run(), aktualisiert danach zusaetzlich Allianz+Station (fuer Gruenden/Einladen/Antworten).
  async function runAndRefreshAlliance(fn: () => Promise<PlayerState>) {
    await run(fn);
    await refreshAlliance();
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
    buildModule: (moduleId) => run(() => api.buildModule(moduleId)),
    buildShipModule: (moduleId) => run(() => api.buildShipModule(moduleId)),
    buildDefenseModule: (moduleId) => run(() => api.buildDefenseModule(moduleId)),
    startResearch: (techId) => run(() => api.startResearch(techId)),
    buildImperator: () => run(() => api.buildImperator()),
    sendMission: (sektorId, selection) => run(() => api.sendMission(sektorId, selection)),
    recallMission: (missionId) => run(() => api.recallMission(missionId)),
    openContainer: (containerId) => run(() => api.openContainer(containerId)),
    openAllContainers: (tier) => run(() => api.openAllContainers(tier)),
    redeemRewardItem: (itemId) => run(() => api.redeemRewardItem(itemId)),
    redeemAllRewardItems: (itemId) => run(() => api.redeemAllRewardItems(itemId)),
    executeTrade: (amount, from, to) => run(() => api.executeTrade(amount, from, to)),
    scrapShip: (shipId, qty) => run(() => api.scrapShip(shipId, qty)),
    scrapDefense: (defId, qty) => run(() => api.scrapDefense(defId, qty)),
    convertTeile: (part, qty) => run(() => api.convertTeile(part, qty)),
    buyBooster: (boosterId, durationHours) => run(() => api.buyBooster(boosterId, durationHours)),
    buyVoucher: (voucherId) => run(() => api.buyVoucher(voucherId)),
    setPlayerClass: (classId) => run(() => api.setClass(classId)),
    setEconomyClass: (classId) => run(() => api.setEconomyClass(classId)),
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
    recallParty: (opId) => runAndRefreshParties(() => api.recallParty(opId)),
    respondAdminEncounter: (opId, action) => runAndRefreshParties(() => api.respondAdminEncounter(opId, action)),

    galaxyOccupants,
    ownGalaxyPosition,
    pirateBases,
    pirateBaseSummaries,
    sektorPositions,
    stationPositions,
    incomingDeployments,
    galaxyEvents,
    refreshGalaxy,
    holdFleet: (targetUserId, ships) => run(() => api.holdFleet(targetUserId, ships)),
    recallHold: (deploymentId) => run(() => api.recallHold(deploymentId)),
    relocateBase: (system, position) => run(() => api.relocateBase(system, position)),
    claimGalaxyEvent: (eventId, ships) => run(() => api.claimGalaxyEvent(eventId, ships)),
    attackPirateBase: (baseId, ships) => run(() => api.attackPirateBase(baseId, ships)),
    spyOnPirateBase: (baseId, qty) => run(() => api.spyOnPirateBase(baseId, qty)),

    alliance,
    station,
    refreshAlliance,
    createAlliance: (name) => runAndRefreshAlliance(() => api.createAlliance(name)),
    inviteToAlliance: (userId) => runAndRefreshAlliance(() => api.inviteToAlliance(userId)),
    respondToAllianceInvite: (allianceId, accept) => runAndRefreshAlliance(() => api.respondToAllianceInvite(allianceId, accept)),
    foundStation: (system, position) => runAndRefreshAlliance(() => api.foundStation(system, position)),
    buildStationBuilding: (stationId, buildingId) => runAndRefreshAlliance(() => api.buildStationBuilding(stationId, buildingId)),
    buildStationModule: (stationId, moduleId) => runAndRefreshAlliance(() => api.buildStationModule(stationId, moduleId)),
    depositToStation: (stationId, resource, amount) => runAndRefreshAlliance(() => api.depositToStation(stationId, resource, amount)),
    withdrawFromStation: (stationId, resource, amount) => runAndRefreshAlliance(() => api.withdrawFromStation(stationId, resource, amount)),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame muss innerhalb von <GameProvider> verwendet werden.');
  return ctx;
}
