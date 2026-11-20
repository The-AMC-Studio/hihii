import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameById } from '../../lib/catalog';
import { soundEngine } from '../../lib/audio';
import {
  createDriftSimulation,
  stepDriftSimulation,
  type DriftSimulation,
} from '../../lib/starlightDriftLogic';
import type { GameShellState, VictorySummary } from '../../lib/types';
import { GameShell } from '../GameShell';

interface StarlightDriftGameProps {
  bestScore: number;
  muted: boolean;
  autostart?: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (result: {
    score: number;
    won: boolean;
    detail: string;
    extraTrophies?: string[];
  }) => { isNewBest: boolean; surpriseNote?: VictorySummary['surpriseNote'] };
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const LOGICAL_W = 960;
const LOGICAL_H = 540;
const PARTICLE_POOL_SIZE = 48;

export function StarlightDriftGame({
  bestScore,
  muted,
  autostart = false,
  onToggleMute,
  onExit,
  onComplete,
}: StarlightDriftGameProps) {
  const game = getGameById('starlight-drift')!;
  const [shellState, setShellState] = useState<GameShellState>(autostart ? 'playing' : 'title');
  const [hud, setHud] = useState({ score: 0, hp: 3, combo: 0, lanterns: 0 });
  const [summary, setSummary] = useState<VictorySummary | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<DriftSimulation>(createDriftSimulation(LOGICAL_W, LOGICAL_H));
  const stateRef = useRef<GameShellState>(shellState);
  const inputRef = useRef<{ up: boolean; down: boolean; targetY: number | null }>({
    up: false,
    down: false,
    targetY: null,
  });
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 3,
      color: '#F59E0B',
    }))
  );
  const particleCursorRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  stateRef.current = shellState;

  const spawnBurst = useCallback((x: number, y: number, color: string, count: number) => {
    const pool = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const idx = particleCursorRef.current % PARTICLE_POOL_SIZE;
      particleCursorRef.current += 1;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 50 + Math.random() * 140;
      const p = pool[idx];
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.35 + Math.random() * 0.25;
      p.maxLife = p.life;
      p.size = 2.5 + Math.random() * 3;
      p.color = color;
    }
  }, []);

  const resetRun = useCallback((nextState: GameShellState = 'playing') => {
    simRef.current = createDriftSimulation(LOGICAL_W, LOGICAL_H);
    inputRef.current = { up: false, down: false, targetY: null };
    for (const p of particlesRef.current) p.active = false;
    setHud({ score: 0, hp: 3, combo: 0, lanterns: 0 });
    setSummary(null);
    setShellState(nextState);
  }, []);

  const startFromTitle = useCallback(() => {
    soundEngine.click();
    resetRun('playing');
  }, [resetRun]);

  // Title Enter / Space start handshake
  useEffect(() => {
    if (shellState !== 'title') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startFromTitle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shellState, startFromTitle]);

  // Keyboard & focus-loss input hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = true;
        inputRef.current.targetY = null;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = true;
        inputRef.current.targetY = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = false;
      }
    };
    const clearInputs = () => {
      inputRef.current.up = false;
      inputRef.current.down = false;
      inputRef.current.targetY = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, []);

  // Isolated 60fps simulation + Canvas2D renderer
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudTick = 0;

    const drawMountainLayer = (
      ctx: CanvasRenderingContext2D,
      offset: number,
      baseY: number,
      amp: number,
      freq: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, LOGICAL_H);
      for (let x = 0; x <= LOGICAL_W; x += 24) {
        const y =
          baseY -
          Math.sin((x + offset) * freq) * amp -
          Math.cos((x + offset) * freq * 0.45) * (amp * 0.55);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(LOGICAL_W, LOGICAL_H);
      ctx.closePath();
      ctx.fill();
    };

    const renderFrame = (now: number) => {
      const rawDt = Math.max(0, (now - lastTime) / 1000);
      lastTime = now;

      const sim = simRef.current;
      const activeState = stateRef.current;

      if (activeState === 'playing') {
        const ev = stepDriftSimulation(sim, rawDt, inputRef.current);
        if (ev.collectedLantern) {
          soundEngine.pickup(sim.combo);
          spawnBurst(sim.player.x + 12, sim.player.y, '#FBBF24', 10);
        }
        if (ev.hitHazard) {
          soundEngine.hurt();
          spawnBurst(sim.player.x, sim.player.y, '#F87171', 16);
        }
        if (ev.gameOver) {
          const finalScore = Math.round(sim.score);
          const won = finalScore >= 350;
          if (won) soundEngine.victory();
          else soundEngine.defeat();

          const res = onCompleteRef.current({
            score: finalScore,
            won,
            detail: `${sim.lanternsCollected} lanterns · ${Math.round(sim.distance)}m`,
          });

          setHud({
            score: finalScore,
            hp: 0,
            combo: sim.combo,
            lanterns: sim.lanternsCollected,
          });
          setSummary({
            gameId: 'starlight-drift',
            title: won ? 'Valley Cleared' : 'Flight Ended',
            subtitle: won
              ? 'Strong glide across the twilight ridge.'
              : 'The wind gusts caught your glider. Take off again anytime.',
            score: finalScore,
            scoreLabel: 'Score',
            metrics: [
              { label: 'Score', value: String(finalScore) },
              { label: 'Lanterns', value: String(sim.lanternsCollected) },
              { label: 'Max Streak', value: `${sim.maxCombo}x` },
            ],
            isNewBest: res.isNewBest,
            outcome: won ? 'victory' : 'gameover',
            surpriseNote: res.surpriseNote,
          });
          setShellState(won ? 'victory' : 'gameover');
        } else {
          hudTick += rawDt;
          if (hudTick >= 0.1) {
            hudTick = 0;
            setHud({
              score: Math.round(sim.score),
              hp: sim.player.hp,
              combo: sim.combo,
              lanterns: sim.lanternsCollected,
            });
          }
        }
      } else if (activeState === 'title') {
        // Gentle idle valley drift on title screen
        sim.distance += rawDt * 8;
        sim.elapsed += rawDt;
        sim.player.y = LOGICAL_H * 0.48 + Math.sin(sim.elapsed * 1.8) * 14;
        sim.player.tilt = Math.cos(sim.elapsed * 1.8) * 0.08;
      }

      // Update particles
      const dtClamped = Math.min(rawDt, 0.05);
      for (const pt of particlesRef.current) {
        if (!pt.active) continue;
        pt.life -= dtClamped;
        if (pt.life <= 0) {
          pt.active = false;
          continue;
        }
        pt.x += pt.vx * dtClamped;
        pt.y += pt.vy * dtClamped;
      }

      // Draw Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          if (sim.trauma > 0) {
            const shake = sim.trauma * sim.trauma * 12;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
          }

          // Twilight Sky Gradient
          const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
          sky.addColorStop(0, '#0F172A');
          sky.addColorStop(0.55, '#1E3A5F');
          sky.addColorStop(1, '#334155');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

          // Distant Crescent Moon & Stars
          ctx.fillStyle = 'rgba(248, 250, 252, 0.45)';
          for (let i = 0; i < 24; i++) {
            const sx = ((i * 97 + 40) % LOGICAL_W);
            const sy = 24 + ((i * 53) % 165);
            ctx.fillRect(sx, sy, 2, 2);
          }
          ctx.fillStyle = '#FEF3C7';
          ctx.beginPath();
          ctx.arc(LOGICAL_W - 130, 82, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#132440';
          ctx.beginPath();
          ctx.arc(LOGICAL_W - 120, 76, 20, 0, Math.PI * 2);
          ctx.fill();

          // Parallax Mountain Ranges
          drawMountainLayer(ctx, sim.distance * 4, LOGICAL_H - 95, 58, 0.0055, '#172846');
          drawMountainLayer(ctx, sim.distance * 9, LOGICAL_H - 52, 42, 0.0085, '#101D35');
          drawMountainLayer(ctx, sim.distance * 15, LOGICAL_H - 18, 26, 0.013, '#0B1324');

          // Draw Lanterns
          for (const l of sim.lanterns) {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, l.radius + 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.roundRect(-9, -11, 18, 22, 5);
            ctx.fill();

            ctx.fillStyle = '#FEF3C7';
            ctx.beginPath();
            ctx.roundRect(-5, -6, 10, 12, 3);
            ctx.fill();
            ctx.restore();
          }

          // Draw Hazards
          for (const h of sim.hazards) {
            ctx.save();
            if (h.telegraph > 0) {
              // Wind-gust sight line telegraph
              ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)';
              ctx.setLineDash([8, 6]);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(0, h.y);
              ctx.lineTo(LOGICAL_W, h.y);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillStyle = '#EF4444';
              ctx.beginPath();
              ctx.arc(LOGICAL_W - 22, h.y, 7, 0, Math.PI * 2);
              ctx.fill();
            } else if (h.kind === 'cloud') {
              ctx.translate(h.x, h.y);
              ctx.fillStyle = '#334155';
              ctx.beginPath();
              ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
              ctx.arc(-16, 6, h.radius * 0.68, 0, Math.PI * 2);
              ctx.arc(16, 7, h.radius * 0.62, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else if (h.kind === 'swooper') {
              ctx.translate(h.x, h.y);
              ctx.fillStyle = '#94A3B8';
              ctx.beginPath();
              ctx.moveTo(-22, 0);
              ctx.lineTo(14, -14);
              ctx.lineTo(6, 0);
              ctx.lineTo(14, 14);
              ctx.closePath();
              ctx.fill();
            } else {
              // Fast Wind Gust Dart
              ctx.translate(h.x, h.y);
              ctx.fillStyle = '#F87171';
              ctx.beginPath();
              ctx.moveTo(-26, 0);
              ctx.lineTo(16, -9);
              ctx.lineTo(10, 0);
              ctx.lineTo(16, 9);
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();
          }

          // Draw Particles
          for (const pt of particlesRef.current) {
            if (!pt.active) continue;
            ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // Draw Origami Glider (Player)
          const p = sim.player;
          const blink = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 0;
          if (!blink) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.tilt);

            // Soft glider wake
            ctx.strokeStyle = 'rgba(248, 250, 252, 0.28)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-18, 0);
            ctx.lineTo(-46, 0);
            ctx.stroke();

            // Upper wing
            ctx.fillStyle = '#F8FAFC';
            ctx.beginPath();
            ctx.moveTo(24, 0);
            ctx.lineTo(-18, -14);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();

            // Lower wing fold
            ctx.fillStyle = '#CBD5E1';
            ctx.beginPath();
            ctx.moveTo(24, 0);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-16, 12);
            ctx.closePath();
            ctx.fill();

            // Spine crease
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(24, 0);
            ctx.lineTo(-12, 0);
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [spawnBurst]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (shellState !== 'playing') return;
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    inputRef.current.targetY = relY;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (shellState !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    inputRef.current.targetY = relY;
  };

  const handlePointerUp = () => {
    inputRef.current.targetY = null;
  };

  return (
    <GameShell
      game={game}
      shellState={shellState}
      muted={muted}
      onToggleMute={onToggleMute}
      onPause={() => setShellState('paused')}
      onResume={() => setShellState('playing')}
      onRestart={() => resetRun('playing')}
      onExit={onExit}
      darkStage
      summary={summary}
      hudMetrics={[
        { label: 'Score', value: String(hud.score) },
        { label: 'Hearts', value: `${hud.hp}/3` },
        { label: 'Streak', value: `${hud.combo}x` },
        { label: 'Best', value: String(Math.max(bestScore, hud.score)) },
      ]}
    >
      <div className="relative w-full max-w-5xl aspect-[16/9] overflow-hidden rounded-xl border border-white/15 bg-[#0F172A] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={LOGICAL_W}
          height={LOGICAL_H}
          data-testid="starlight-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="h-full w-full block touch-none cursor-ns-resize"
        />

        {/* Title Overlay */}
        {shellState === 'title' && (
          <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-[#0B1324]/90 via-[#0B1324]/55 to-transparent p-8 sm:p-12">
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Starlight Drift
            </h2>
            <p className="mt-3 max-w-md text-sm sm:text-base text-slate-200 leading-relaxed">
              Steer your paper glider through the valley, gather amber lanterns to build streaks,
              and dodge storm clouds and wind gusts.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                data-start="true"
                onClick={startFromTitle}
                className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Start Flight
              </button>
            </div>
            <p className="mt-8 text-xs text-slate-300">
              W / S or Up / Down to steer · Click &amp; drag on touch · P to pause
            </p>
          </div>
        )}
      </div>
    </GameShell>
  );
}
