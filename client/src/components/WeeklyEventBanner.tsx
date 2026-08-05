import { useState } from 'react';
import { WEEKLY_EVENTS, berlinWeekday } from '../lib/multipliers';

// Zeigt den/die heute aktiven woechentlichen Event(s) an (05.08.2026, Nutzerentscheidung) - rein
// zeitbasiert, kein eigener State noetig, siehe economy.ts's isWeeklyEventActive() fuer die
// Server-Logik. Reine Anzeige, keine Interaktion. Ausklappbare komplette Wochenuebersicht
// (Nutzer-Wunsch: nachschlagen koennen, welcher Tag welches Event hat), rein clientseitig aus
// WEEKLY_EVENTS abgeleitet, kein zusaetzlicher Request noetig.
const EVENT_ICON: Record<string, string> = {
  piraten_bonus: '🏴‍☠️',
  asteroid_bonus: '🪨',
  raid_event: '⚔️',
  bauzeit_bonus: '🛠️',
};

// Montag zuerst fuer die Anzeige, Index entspricht berlinWeekday()/JS getUTCDay() (0=Sonntag..6=Samstag).
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_NAMES: Record<number, string> = {
  0: 'Sonntag', 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag',
};

function eventsForWeekday(weekday: number) {
  return WEEKLY_EVENTS.filter((e) => e.weekdays.includes(weekday));
}

export function WeeklyEventBanner() {
  const [expanded, setExpanded] = useState(false);
  const today = berlinWeekday();
  const activeEvents = eventsForWeekday(today);

  return (
    <div className="queue-box" style={{ marginBottom: 16 }}>
      {activeEvents.length > 0 ? (
        activeEvents.map((e) => (
          <p key={e.id} style={{ fontSize: 13, color: 'var(--accent-deut)', margin: 0 }}>
            {EVENT_ICON[e.id] || '📅'} Heute: {e.label}
          </p>
        ))
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>Heute kein Wochen-Event.</p>
      )}
      <button
        className="qty-btn"
        style={{ fontSize: 11, padding: '2px 7px', marginTop: 6 }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Wochenübersicht ausblenden ▴' : 'Ganze Woche anzeigen ▾'}
      </button>
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {WEEKDAY_ORDER.map((weekday) => {
            const events = eventsForWeekday(weekday);
            const isToday = weekday === today;
            return (
              <div
                key={weekday}
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12,
                  color: isToday ? 'var(--accent-deut)' : 'var(--text-dim)',
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                <span style={{ width: 90, flexShrink: 0 }}>{WEEKDAY_NAMES[weekday]}{isToday ? ' (heute)' : ''}</span>
                <span>
                  {events.length > 0 ? events.map((e) => `${EVENT_ICON[e.id] || '📅'} ${e.label}`).join(', ') : '–'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
