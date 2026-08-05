import { WEEKLY_EVENTS, berlinWeekday } from '../lib/multipliers';

// Zeigt den/die heute aktiven woechentlichen Event(s) an (05.08.2026, Nutzerentscheidung) - rein
// zeitbasiert, kein eigener State noetig, siehe economy.ts's isWeeklyEventActive() fuer die
// Server-Logik. Reine Anzeige, keine Interaktion.
const EVENT_ICON: Record<string, string> = {
  piraten_bonus: '🏴‍☠️',
  asteroid_bonus: '🪨',
  raid_event: '⚔️',
  bauzeit_bonus: '🛠️',
};

export function WeeklyEventBanner() {
  const today = berlinWeekday();
  const activeEvents = WEEKLY_EVENTS.filter((e) => e.weekdays.includes(today));
  if (activeEvents.length === 0) return null;

  return (
    <div className="queue-box" style={{ marginBottom: 16 }}>
      {activeEvents.map((e) => (
        <p key={e.id} style={{ fontSize: 13, color: 'var(--accent-deut)', margin: 0 }}>
          {EVENT_ICON[e.id] || '📅'} Heute: {e.label}
        </p>
      ))}
    </div>
  );
}
