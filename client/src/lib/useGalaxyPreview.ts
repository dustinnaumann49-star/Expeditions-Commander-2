import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { GalaxyPosition } from '../types/game';

export interface GalaxyPreview {
  distance: number;
  durationMs: number;
  fuelCost: number;
}

// Debouncte Flugzeit-/Distanz-Vorschau zu einer FESTEN Zielposition (Sektor, Notruf,
// Elite-Bollwerk, Rendezvous-Ziel) - fuer Halten-Fluege zu einem anderen SPIELER siehe die
// targetUserId-Variante direkt in Galaxie.tsx (dort bereits vorhanden, nicht ueber diesen Hook).
export function useGalaxyPreview(ships: Record<string, number>, target: GalaxyPosition | null | undefined) {
  const [preview, setPreview] = useState<GalaxyPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const totalQty = Object.values(ships).reduce((a, b) => a + (b || 0), 0);

  useEffect(() => {
    if (!target || totalQty === 0) {
      setPreview(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .galaxyPreview(ships, { targetPosition: target })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ships), target?.system, target?.position, totalQty]);

  return { preview, loading };
}
