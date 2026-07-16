import { useEffect, useRef, useState } from 'react';
import type { CombatReplay } from '../types/game';

// Wie viele Punkte maximal je Seite gezeichnet werden. Bei grossen Flotten steht ein Punkt fuer
// mehrere Schiffe - sonst waeren es bei tausenden Einheiten unleserliche Pixelwolken.
const MAX_DOTS_PER_SIDE = 70;
const CANVAS_W = 700;
const CANVAS_H = 260;

interface Dot {
  x: number;
  y: number;
  alive: boolean;
  // Zeitpunkt (ms seit Start der aktuellen Runde), zu dem dieser Punkt explodiert - fuer gestaffelte
  // Explosionen statt aller gleichzeitig
  deathDelay: number;
}

function buildDots(count: number, side: 'a' | 'b'): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.ceil(Math.sqrt(count * 1.6));
  const rows = Math.ceil(count / cols);
  const spacingX = 11;
  const spacingY = 13;
  const blockW = cols * spacingX;
  const blockH = rows * spacingY;
  const baseX = side === 'a' ? 60 : CANVAS_W - 60 - blockW;
  const baseY = (CANVAS_H - blockH) / 2;
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    dots.push({
      x: baseX + c * spacingX,
      y: baseY + r * spacingY,
      alive: true,
      deathDelay: Math.random() * 700,
    });
  }
  return dots;
}

export function CombatReplayView({ replay }: { replay: CombatReplay }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  const totalSteps = replay.roundsA.length;
  const sumA = (i: number) => replay.roundsA[i].reduce((a, b) => a + b, 0);
  const sumB = (i: number) => replay.roundsB[i].reduce((a, b) => a + b, 0);
  const startA = sumA(0);
  const startB = sumB(0);

  // Punkt-Positionen einmalig festlegen (bleiben ueber alle Runden gleich, damit die Formation
  // stabil aussieht und nur "Luecken" durch Verluste entstehen).
  const dotsA = useRef<Dot[]>([]);
  const dotsB = useRef<Dot[]>([]);
  if (dotsA.current.length === 0) {
    dotsA.current = buildDots(Math.min(startA, MAX_DOTS_PER_SIDE), 'a');
    dotsB.current = buildDots(Math.min(startB, MAX_DOTS_PER_SIDE), 'b');
  }

  // Abspiel-Schleife: schaltet im Takt zur naechsten Runde weiter
  useEffect(() => {
    if (!playing) return;
    if (step >= totalSteps - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), 900 / speed);
    return () => clearTimeout(t);
  }, [playing, step, speed, totalSteps]);

  // Zeichnen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const roundStart = performance.now();
    let frame = 0;

    const aliveA = sumA(step);
    const aliveB = sumB(step);
    const prevA = step > 0 ? sumA(step - 1) : aliveA;
    const prevB = step > 0 ? sumB(step - 1) : aliveB;

    // Wie viele Punkte je Seite in dieser Runde noch "leben" (skaliert auf die Punktanzahl)
    const dotsAliveA = Math.round((aliveA / Math.max(1, startA)) * dotsA.current.length);
    const dotsAliveB = Math.round((aliveB / Math.max(1, startB)) * dotsB.current.length);
    const dotsPrevA = Math.round((prevA / Math.max(1, startA)) * dotsA.current.length);
    const dotsPrevB = Math.round((prevB / Math.max(1, startB)) * dotsB.current.length);

    function draw() {
      const elapsed = performance.now() - roundStart;
      ctx!.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Hintergrund: dezentes Sternenfeld
      ctx!.fillStyle = '#0a0d12';
      ctx!.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx!.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5) % CANVAS_W;
        const sy = (i * 71.3) % CANVAS_H;
        ctx!.fillRect(sx, sy, 1, 1);
      }

      // Laser-Salven: nur in der ersten Haelfte der Runde, damit danach die Explosionen wirken
      if (step > 0 && elapsed < 450) {
        const shots = Math.min(14, Math.max(3, Math.round(dotsAliveA / 4)));
        ctx!.lineWidth = 1.2;
        for (let i = 0; i < shots; i++) {
          const from = dotsA.current[Math.floor(Math.random() * Math.max(1, dotsAliveA))];
          const to = dotsB.current[Math.floor(Math.random() * Math.max(1, dotsAliveB))];
          if (!from || !to) continue;
          ctx!.strokeStyle = 'rgba(76,227,238,0.55)';
          ctx!.beginPath();
          ctx!.moveTo(from.x + 4, from.y + 3);
          ctx!.lineTo(to.x + 4, to.y + 3);
          ctx!.stroke();
        }
        for (let i = 0; i < shots; i++) {
          const from = dotsB.current[Math.floor(Math.random() * Math.max(1, dotsAliveB))];
          const to = dotsA.current[Math.floor(Math.random() * Math.max(1, dotsAliveA))];
          if (!from || !to) continue;
          ctx!.strokeStyle = 'rgba(255,90,90,0.5)';
          ctx!.beginPath();
          ctx!.moveTo(from.x + 4, from.y + 3);
          ctx!.lineTo(to.x + 4, to.y + 3);
          ctx!.stroke();
        }
      }

      // Schiffe zeichnen
      function drawSide(dots: Dot[], aliveCount: number, prevCount: number, color: string, glow: string) {
        dots.forEach((d, i) => {
          const isAlive = i < aliveCount;
          const isDying = i >= aliveCount && i < prevCount;
          if (isAlive) {
            ctx!.fillStyle = color;
            ctx!.shadowColor = glow;
            ctx!.shadowBlur = 4;
            ctx!.fillRect(d.x, d.y, 8, 6);
            ctx!.shadowBlur = 0;
          } else if (isDying && elapsed > d.deathDelay) {
            // Explosion: waechst und verblasst
            const age = elapsed - d.deathDelay;
            const p = Math.min(1, age / 400);
            const radius = 3 + p * 9;
            ctx!.globalAlpha = 1 - p;
            const grad = ctx!.createRadialGradient(d.x + 4, d.y + 3, 0, d.x + 4, d.y + 3, radius);
            grad.addColorStop(0, '#fff6c2');
            grad.addColorStop(0.4, '#ffa23a');
            grad.addColorStop(1, 'rgba(255,60,0,0)');
            ctx!.fillStyle = grad;
            ctx!.beginPath();
            ctx!.arc(d.x + 4, d.y + 3, radius, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.globalAlpha = 1;
          }
        });
      }
      drawSide(dotsA.current, dotsAliveA, dotsPrevA, '#4ce3ee', 'rgba(76,227,238,0.9)');
      drawSide(dotsB.current, dotsAliveB, dotsPrevB, '#ff5f5f', 'rgba(255,95,95,0.9)');

      // Beschriftung
      ctx!.shadowBlur = 0;
      ctx!.font = 'bold 12px Segoe UI, Arial';
      ctx!.fillStyle = '#4ce3ee';
      ctx!.textAlign = 'left';
      ctx!.fillText(`Eigene Flotte: ${aliveA}`, 12, 20);
      ctx!.fillStyle = '#ff5f5f';
      ctx!.textAlign = 'right';
      ctx!.fillText(`Gegner: ${aliveB}`, CANVAS_W - 12, 20);
      ctx!.fillStyle = '#a8aeb8';
      ctx!.textAlign = 'center';
      const roundLabel = step === 0 ? 'Ausgangslage' : `Runde ${Math.round((step / (totalSteps - 1)) * replay.totalRounds)} / ${replay.totalRounds}`;
      ctx!.fillText(roundLabel, CANVAS_W / 2, CANVAS_H - 10);

      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, totalSteps]);

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Kampfverlauf</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', maxWidth: CANVAS_W, borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
      />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button
          className="qty-btn"
          onClick={() => {
            if (step >= totalSteps - 1) setStep(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? '⏸ Pause' : step >= totalSteps - 1 ? '↻ Nochmal' : '▶ Abspielen'}
        </button>
        <button className="qty-btn" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}>
          ◀ Schritt
        </button>
        <button className="qty-btn" onClick={() => { setPlaying(false); setStep((s) => Math.min(totalSteps - 1, s + 1)); }}>
          Schritt ▶
        </button>
        {[1, 2, 4].map((sp) => (
          <button key={sp} className={`qty-btn${speed === sp ? ' active' : ''}`} onClick={() => setSpeed(sp)}>
            {sp}×
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
          {startA > MAX_DOTS_PER_SIDE || startB > MAX_DOTS_PER_SIDE
            ? 'Große Flotten: ein Punkt steht für mehrere Schiffe'
            : 'Ein Punkt = ein Schiff'}
        </span>
      </div>
    </div>
  );
}
