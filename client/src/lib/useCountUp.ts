import { useEffect, useRef, useState } from 'react';

// Animiert einen angezeigten Wert von seinem vorherigen auf den neuen Zielwert, statt beim
// naechsten Poll (alle 3s, siehe GameContext.tsx) hart zu springen. Liefert zusaetzlich eine
// Pulse-Richtung ('up'/'down'/null) fuer eine kurze Zeit nach jeder Aenderung, damit der Aufrufer
// z.B. eine Farb-/Glow-Klasse setzen kann (siehe .res-pulse-up/.res-pulse-down in theme.css).
// Springt beim allerersten Render direkt auf den Zielwert (kein Hochzaehlen von 0 beim Laden).
// Nutzt bewusst setInterval statt requestAnimationFrame - inhaltlich gleichwertig fuer diesen
// Zweck (kein Grafik-Rendering, nur ein Zahlenwert), aber unabhaengig vom Compositing-Zyklus des
// Tabs und damit zuverlaessig testbar/konsistent.
const STEP_MS = 16;

export function useCountUp(target: number, durationMs = 700): { display: number; pulse: 'up' | 'down' | null } {
  const [display, setDisplay] = useState(target);
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);
  const fromRef = useRef(target);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) return;
    setPulse(target > from ? 'up' : 'down');
    const start = Date.now();

    const intervalId = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      setDisplay(from + (target - from) * eased);
      if (t >= 1) {
        fromRef.current = target;
        clearInterval(intervalId);
      }
    }, STEP_MS);
    const pulseTimeout = setTimeout(() => setPulse(null), 1000);
    return () => {
      clearInterval(intervalId);
      clearTimeout(pulseTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return { display, pulse };
}
