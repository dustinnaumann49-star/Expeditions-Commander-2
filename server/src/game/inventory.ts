import { CONTAINER_TYPES, JACKPOT_CHANCE, JACKPOT_REWARDS } from './data/economy.js';
import type { ContainerCategoryDef, ContainerRewardDef } from './data/economy.js';
import { pushMessage } from './messages.js';
import type { ActionResult } from './actions.js';
import type { Container, ContainerReward, ContainerTier, PlayerState, RewardItem } from './types.js';

// Container stapeln sich jetzt (Nutzerentscheidung: "wir werden mit Containern ueberflutet") -
// EIN Inventar-Eintrag pro Stufe (id ist deterministisch `container_<tier>`, kein Zufalls-Suffix
// mehr noetig, da nie mehr als ein Eintrag pro Stufe existiert), Anzahl steckt in `count`.
export function addContainers(state: PlayerState, tier: ContainerTier, count = 1): void {
  if (count <= 0) return;
  const existing = state.inventory.find((i) => 'tier' in i && (i as Container).tier === tier) as Container | undefined;
  if (existing) {
    existing.count += count;
    existing.receivedAt = Date.now();
  } else {
    state.inventory.push({ id: `container_${tier}`, tier, count, receivedAt: Date.now() });
  }
}

function pickRandomSubset<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Zieh-Mechanik (Nutzerentscheidung, siehe Kommentar bei ContainerCategoryDef in economy.ts):
// jede Kategorie wird EINZELN und UNABHAENGIG gegen ihre eigene `chance` gewuerfelt, danach auf
// GENAU 2 Treffer normalisiert (mehr -> zufaellig auf 2 reduziert, weniger -> mit den Kategorien
// mit der naechsthoechsten chance aufgefuellt, deterministisch sortiert statt nochmal gewuerfelt).
// Trifft eine Kategorie mit mehreren Varianten (z.B. die vier Zeitgutschein-Typen), wird GENAU
// EINE Variante daraus zufaellig vergeben.
function rollContainerCategories(categories: ContainerCategoryDef[]): ContainerRewardDef[] {
  const hits: ContainerCategoryDef[] = [];
  const misses: ContainerCategoryDef[] = [];
  categories.forEach((c) => (Math.random() < c.chance ? hits : misses).push(c));

  let chosen: ContainerCategoryDef[];
  if (hits.length > 2) {
    chosen = pickRandomSubset(hits, 2);
  } else if (hits.length < 2) {
    const need = 2 - hits.length;
    const sortedMisses = [...misses].sort((a, b) => b.chance - a.chance);
    chosen = [...hits, ...sortedMisses.slice(0, need)];
  } else {
    chosen = hits;
  }
  return chosen.map((c) => c.rewards[Math.floor(Math.random() * c.rewards.length)]);
}

export function openContainer(state: PlayerState, containerId: string): ActionResult {
  const idx = state.inventory.findIndex((c) => c.id === containerId && 'tier' in c);
  if (idx === -1) return { ok: false, error: 'Container nicht gefunden.' };
  const container = state.inventory[idx] as Container;
  const config = CONTAINER_TYPES[container.tier];
  if (!config) return { ok: false, error: 'Unbekannter Container-Typ.' };
  if (container.count <= 0) return { ok: false, error: 'Kein Container dieser Art mehr vorhanden.' };
  if (container.tier === 'silber' || container.tier === 'gold' || container.tier === 'elite') {
    state.stats.containersOpened[container.tier]++;
  }

  const selected = rollContainerCategories(config.categories);

  // Jackpot: zusaetzlich zu den normalen Picks, mit kleiner Chance (siehe JACKPOT_CHANCE in
  // economy.ts) - ein Bonus obendrauf, kein Ersatz fuer einen der gewuerfelten Picks.
  const jackpotHit = Math.random() < JACKPOT_CHANCE;
  const jackpotReward = jackpotHit ? JACKPOT_REWARDS[container.tier] : null;
  const allRewards = jackpotReward ? [...selected, jackpotReward] : selected;

  const labels: string[] = [];
  allRewards.forEach((reward) => {
    const stackKey = `${reward.type}|${reward.label}`;
    const existing = state.inventory.find((i) => 'type' in i && i.type === 'rewardItem' && (i as RewardItem).stackKey === stackKey) as
      | RewardItem
      | undefined;
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.receivedAt = Date.now();
    } else {
      const item: RewardItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        type: 'rewardItem',
        stackKey,
        reward: reward as ContainerReward,
        count: 1,
        receivedAt: Date.now(),
      };
      state.inventory.push(item);
    }
    labels.push(reward.label);
  });

  container.count -= 1;
  if (container.count <= 0) state.inventory.splice(idx, 1);
  const jackpotText = jackpotHit ? ' 🎰 JACKPOT! Eine zusätzliche Belohnung wartet im Inventar!' : '';
  pushMessage(state, 'farm', `📦 ${config.name} geöffnet! Ins Inventar gelegt: ${labels.join(', ')}. Du kannst sie jederzeit einzeln einlösen.${jackpotText}`);
  return { ok: true };
}

export function applyReward(state: PlayerState, reward: ContainerReward): boolean {
  // Sehr alte, vor der Aufteilung in Schiffe/Verteidigung/Gebaeude vergebene Gutscheine tragen
  // noch den frueheren Typ 'zeitgutschein_bau' (ohne Suffix) im gespeicherten Spielstand - hier
  // einmalig auf den neuen "Schiffe"-Typ abgebildet, damit bereits vergebene Exemplare weiterhin
  // einloesbar bleiben.
  const type: ContainerReward['type'] = (reward.type as string) === 'zeitgutschein_bau' ? 'zeitgutschein_bau_schiffe' : reward.type;
  switch (type) {
    case 'resources':
      state.resources.metall += reward.metall || 0;
      state.resources.kristall += reward.kristall || 0;
      state.resources.deuterium += reward.deuterium || 0;
      return true;
    case 'dm':
      state.resources.dm += reward.amount || 0;
      return true;
    case 'teile':
      state.teile.waffen += reward.waffen || 0;
      state.teile.schild += reward.schild || 0;
      state.teile.panzerung += reward.panzerung || 0;
      return true;
    case 'freischiff':
      if (reward.ships) {
        Object.entries(reward.ships).forEach(([shipId, count]) => {
          state.fleet[shipId] = (state.fleet[shipId] || 0) + count;
        });
      }
      return true;
    // Bauzeit-Gutscheine sind nach Bereich getrennt (Schiffe/Verteidigung/Gebaeude, siehe
    // economy.ts). Schiffe/Verteidigung wirken auf ALLE aktuell belegten Lanes der jeweiligen
    // Warteschlange (MAX_BUILD_SLOTS/MAX_DEFENSE_SLOTS = 3), analog zum bestehenden Forschungs-
    // Gutschein-Muster unten.
    case 'zeitgutschein_bau_schiffe': {
      if (state.buildQueue.length === 0) return false;
      state.buildQueue.forEach((job) => {
        const remaining = job.endTime - Date.now();
        job.endTime -= Math.max(0, Math.floor(remaining * (reward.percent || 0)));
      });
      return true;
    }
    case 'zeitgutschein_bau_verteidigung': {
      if (state.defenseQueue.length === 0) return false;
      state.defenseQueue.forEach((job) => {
        const remaining = job.endTime - Date.now();
        job.endTime -= Math.max(0, Math.floor(remaining * (reward.percent || 0)));
      });
      return true;
    }
    case 'zeitgutschein_bau_gebaeude': {
      if (state.buildingQueue.length === 0) return false;
      // MAX_BUILDING_SLOTS = 1 - hier ist forEach nur der Vollstaendigkeit halber wie bei den
      // anderen beiden Typen, es gibt nie mehr als einen Eintrag.
      state.buildingQueue.forEach((job) => {
        const remaining = job.endTime - Date.now();
        job.endTime -= Math.max(0, Math.floor(remaining * (reward.percent || 0)));
      });
      return true;
    }
    case 'zeitgutschein_forschung': {
      if (state.researchQueue.length === 0) return false;
      // Wirkt auf ALLE gleichzeitig laufenden Forschungen, nicht nur die erste in der
      // Warteschlange - seit MAX_RESEARCH_SLOTS auf 4 angehoben wurde (mehr gleichzeitige
      // Forschungen moeglich, siehe README), waere ein Gutschein sonst nur noch fuer einen
      // Bruchteil der aktuell laufenden Forschungen wirksam gewesen.
      state.researchQueue.forEach((job) => {
        const remaining = job.endTime - Date.now();
        job.endTime -= Math.max(0, Math.floor(remaining * (reward.percent || 0)));
      });
      return true;
    }
    default:
      return true;
  }
}

export function redeemRewardItem(state: PlayerState, itemId: string): ActionResult {
  const idx = state.inventory.findIndex((i) => 'type' in i && i.type === 'rewardItem' && i.id === itemId);
  if (idx === -1) return { ok: false, error: 'Gegenstand nicht gefunden.' };
  const item = state.inventory[idx] as RewardItem;
  const reward = item.reward;

  // 'zeitgutschein_bau' (ohne Suffix) ist der alte, vor der Bereichs-Aufteilung vergebene Typ -
  // wird wie applyReward() als "Schiffe" behandelt.
  const isLegacyBauSchiffe = (reward.type as string) === 'zeitgutschein_bau';
  if ((reward.type === 'zeitgutschein_bau_schiffe' || isLegacyBauSchiffe) && state.buildQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Schiffsbau - der Gutschein bleibt im Inventar, bis du einen brauchst.' };
  }
  if (reward.type === 'zeitgutschein_bau_verteidigung' && state.defenseQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Verteidigungsbau - der Gutschein bleibt im Inventar, bis du einen brauchst.' };
  }
  if (reward.type === 'zeitgutschein_bau_gebaeude' && state.buildingQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade kein Gebäudeausbau - der Gutschein bleibt im Inventar, bis du einen brauchst.' };
  }
  if (reward.type === 'zeitgutschein_forschung' && state.researchQueue.length === 0) {
    return { ok: false, error: 'Es läuft gerade keine Forschung - der Gutschein bleibt im Inventar, bis du einen brauchst.' };
  }

  applyReward(state, reward);
  item.count = (item.count || 1) - 1;
  if (item.count <= 0) state.inventory.splice(idx, 1);
  pushMessage(state, 'farm', `✅ Eingelöst: ${reward.label}.`);
  return { ok: true };
}
