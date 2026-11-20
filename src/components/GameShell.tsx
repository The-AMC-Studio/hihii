import { useEffect, type ReactNode } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { GameMeta, GameShellState, VictorySummary } from '../lib/types';

interface GameShellProps {
  game: GameMeta;
  shellState: GameShellState;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  hudMetrics: Array<{ label: string; value: string }>;
  summary?: VictorySummary | null;
  secondaryAction?: { label: string; onClick: () => void };
  darkStage?: boolean;
  children: ReactNode;
}

export function GameShell({
  game,
  shellState,
  muted,
  onToggleMute,
  onPause,
  onResume,
  onRestart,
  onExit,
  hudMetrics,
  summary,
  secondaryAction,
  darkStage = false,
  children,
}: GameShellProps) {
  useEffect(() => {
    const mapped = shellState === 'victory' ? 'gameover' : shellState;
    document.body.dataset.state = mapped;
    return () => {
      delete document.body.dataset.state;
    };
  }, [shellState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        if (shellState === 'playing') {
          e.preventDefault();
          onPause();
        } else if (shellState === 'paused') {
          e.preventDefault();
          onResume();
        }
      } else if ((e.key === 'p' || e.key === 'P') && game.id !== 'word-loom') {
        if (shellState === 'playing') {
          e.preventDefault();
          onPause();
        } else if (shellState === 'paused') {
          e.preventDefault();
          onResume();
        }
      } else if ((e.key === 'm' || e.key === 'M') && game.id !== 'word-loom') {
        e.preventDefault();
        onToggleMute();
      } else if ((e.key === 'r' || e.key === 'R') && game.id !== 'word-loom' && shellState === 'playing') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.id, shellState, onPause, onResume, onRestart, onToggleMute]);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkStage ? 'bg-[#0F172A] text-[#F8FAFC]' : 'bg-[#F6F6F3] text-[#14161A]'
      }`}
    >
      {/* Unified Perimeter HUD Bar */}
      <div
        className={`flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b shrink-0 ${
          darkStage
            ? 'border-white/10 bg-[#0B1120]'
            : 'border-black/[0.08] bg-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onExit();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              darkStage
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-[#4B5563] hover:bg-black/5 hover:text-[#14161A]'
            }`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Games</span>
          </button>
          <span
            aria-hidden="true"
            className={darkStage ? 'text-white/20' : 'text-black/15'}
          >
            /
          </span>
          <h1 className="font-display text-base font-semibold tracking-tight truncate">
            {game.title}
          </h1>
        </div>

        {/* Live HUD Metrics */}
        <div className="hidden md:flex items-center gap-6" aria-live="polite">
          {hudMetrics.map((m) => (
            <div key={m.label} className="flex items-baseline gap-2">
              <span
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  darkStage ? 'text-slate-400' : 'text-[#6B7280]'
                }`}
              >
                {m.label}
              </span>
              <span className="font-mono text-base font-semibold tabular-nums">
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              darkStage
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-[#4B5563] hover:bg-black/5 hover:text-[#14161A]'
            }`}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart game"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              darkStage
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-[#4B5563] hover:bg-black/5 hover:text-[#14161A]'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label={shellState === 'paused' ? 'Resume game' : 'Pause game'}
            onClick={(e) => {
              e.currentTarget.blur();
              if (shellState === 'paused') onResume();
              else if (shellState === 'playing') onPause();
            }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              darkStage
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-[#4B5563] hover:bg-black/5 hover:text-[#14161A]'
            }`}
          >
            {shellState === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile HUD Strip */}
      <div
        className={`flex md:hidden items-center justify-around px-4 py-2 border-b text-xs ${
          darkStage
            ? 'border-white/10 bg-[#0B1120] text-slate-200'
            : 'border-black/[0.06] bg-white text-[#14161A]'
        }`}
      >
        {hudMetrics.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <span className={darkStage ? 'text-slate-400' : 'text-[#6B7280]'}>{m.label}</span>
            <span className="font-mono font-semibold tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Main Playfield */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {children}

        {/* Paused Modal */}
        {shellState === 'paused' && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-white p-6 text-[#14161A] shadow-2xl border border-black/10">
              <h2 id="pause-modal-title" className="font-display text-2xl font-bold tracking-tight">
                Paused
              </h2>
              <p className="mt-1 text-sm text-[#5A606E]">
                {game.title} is paused. Your current progress is held.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onResume}
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="w-full rounded-lg border border-black/12 bg-white px-4 py-2.5 text-sm font-medium text-[#14161A] transition-colors hover:bg-[#F6F6F3]"
                >
                  Restart
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#5A606E] transition-colors hover:bg-black/5 hover:text-[#14161A]"
                >
                  Return to Games
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Victory / Game Over Modal */}
        {(shellState === 'victory' || shellState === 'gameover') && summary && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-modal-title"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          >
            <div className="w-full max-w-md rounded-xl bg-white p-6 sm:p-7 text-[#14161A] shadow-2xl border border-black/10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="result-modal-title" className="font-display text-2xl font-bold tracking-tight">
                  {summary.title}
                </h2>
                {summary.isNewBest && (
                  <span className="text-xs font-semibold text-[#D97706] whitespace-nowrap">
                    New Personal Best
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#5A606E]">{summary.subtitle}</p>

              {/* Tabular Metrics */}
              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-black/[0.08] py-4">
                {summary.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-xs text-[#6B7280]">{m.label}</div>
                    <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-[#14161A]">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rare Contextual Surprise Note (only on qualifying victory) */}
              {summary.surpriseNote && (
                <div
                  data-testid="contextual-victory-note"
                  className="mt-5 rounded-lg bg-[#F6F6F3] p-4 border border-black/[0.08]"
                >
                  <div className="text-xs font-medium text-[#2563EB]">
                    {summary.surpriseNote.label}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#14161A]">
                    {summary.surpriseNote.nickname ? (
                      <>
                        <span className="font-semibold">{summary.surpriseNote.nickname}</span>
                        {' — '}
                      </>
                    ) : null}
                    {summary.surpriseNote.message}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="flex-1 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap"
                >
                  {summary.outcome === 'victory' ? 'Play Again' : 'Try Again'}
                </button>
                {secondaryAction && (
                  <button
                    type="button"
                    onClick={secondaryAction.onClick}
                    className="flex-1 rounded-lg border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#14161A] transition-colors hover:bg-[#F6F6F3] whitespace-nowrap"
                  >
                    {secondaryAction.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[#5A606E] transition-colors hover:bg-black/5 hover:text-[#14161A]"
                >
                  Return to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
