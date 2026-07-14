// Formatiert eine Millisekunden-Dauer lesbar mit Wochen/Tagen/Stunden/Minuten/Sekunden.
// Zeigt immer die jeweils gröbste passende Einheit plus die nächst-feinere(n), ohne fuehrende
// Null-Einheiten (z.B. "30s" statt "0m 30s", "2h 5m" statt "0d 2h 5m").
export function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const w = Math.floor(totalSec / (7 * 86400));
  const d = Math.floor((totalSec % (7 * 86400)) / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (w > 0) return `${w}w ${d}d ${h}h`;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
