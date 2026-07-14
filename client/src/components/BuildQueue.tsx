import { useEffect, useState } from 'react';
import { serverNow } from '../lib/serverTime';
import { formatTime } from '../lib/format';

interface QueueJob {
  count: number;
  startTime: number;
  endTime: number;
}

export function BuildQueue<T extends QueueJob>({ queue, maxSlots, nameFor }: { queue: T[]; maxSlots: number; nameFor: (job: T) => string }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (queue.length === 0) {
    return <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Keine aktive Produktion.</p>;
  }

  const now = serverNow();
  const lanes: T[][] = Array.from({ length: maxSlots }, () => []);
  queue.forEach((job, i) => lanes[i % maxSlots].push(job));

  return (
    <>
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
