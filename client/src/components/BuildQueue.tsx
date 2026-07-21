import { useEffect, useRef, useState } from 'react';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';

interface QueueJob {
  count: number;
  startTime: number;
  endTime: number;
}

interface CompletedFlash {
  key: string;
  label: string;
  count: number;
}

export function BuildQueue<T extends QueueJob>({ queue, maxSlots, nameFor }: { queue: T[]; maxSlots: number; nameFor: (job: T) => string }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  // Erkennt fertiggestellte Auftraege: ein Job, der beim vorherigen Render noch da war (mit
  // bereits abgelaufener endTime), aber jetzt aus der vom Server gelieferten Warteschlange
  // verschwunden ist, wurde fertig (nicht abgebrochen - siehe Zeitpruefung unten) -> kurzer
  // Erfolgs-Flash statt stillschweigendem Verschwinden.
  const prevJobsRef = useRef<Map<string, T>>(new Map());
  const [flashes, setFlashes] = useState<CompletedFlash[]>([]);
  useEffect(() => {
    const now = serverNow();
    const currentKeys = new Set(queue.map((j) => `${nameFor(j)}|${j.startTime}|${j.endTime}|${j.count}`));
    const justCompleted: CompletedFlash[] = [];
    prevJobsRef.current.forEach((job, key) => {
      if (!currentKeys.has(key) && job.endTime <= now + 1500) {
        justCompleted.push({ key: `${key}-${now}`, label: nameFor(job), count: job.count });
      }
    });
    if (justCompleted.length > 0) {
      setFlashes((f) => [...f, ...justCompleted]);
      justCompleted.forEach((jc) => {
        setTimeout(() => setFlashes((f) => f.filter((x) => x.key !== jc.key)), 2200);
      });
    }
    const nextMap = new Map<string, T>();
    queue.forEach((j) => nextMap.set(`${nameFor(j)}|${j.startTime}|${j.endTime}|${j.count}`, j));
    prevJobsRef.current = nextMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const flashList = flashes.length > 0 && (
    <>
      {flashes.map((f) => (
        <div className="build-complete-flash" key={f.key}>
          ✓ {f.label} x{f.count} fertiggestellt
        </div>
      ))}
    </>
  );

  if (queue.length === 0) {
    return (
      <>
        {flashList}
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine aktive Produktion.</p>
      </>
    );
  }

  const now = serverNow();
  const lanes: T[][] = Array.from({ length: maxSlots }, () => []);
  queue.forEach((job, i) => lanes[i % maxSlots].push(job));

  return (
    <>
      {flashList}
      {lanes.map((laneJobs, laneIdx) => {
        if (laneJobs.length === 0) {
          return (
            <div className="queue-item" key={laneIdx}>
              <span>Slot {laneIdx + 1}</span>
              <span style={{ color: 'var(--text-dim)' }}>frei</span>
            </div>
          );
        }
        const active = laneJobs[0];
        const pct = Math.min(100, Math.max(0, ((now - active.startTime) / (active.endTime - active.startTime)) * 100));
        return (
          <div key={laneIdx}>
            <div className="queue-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
              <div className="progress-row">
                <span>
                  Slot {laneIdx + 1}: {nameFor(active)} x{active.count}
                </span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Noch: {formatTime(active.endTime - now)}</span>
            </div>
            {laneJobs.slice(1).map((j, i) => (
              <div className="queue-item" key={i} style={{ paddingLeft: 12, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>
                  {nameFor(j)} x{j.count}
                </span>
                <span>wartet</span>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
