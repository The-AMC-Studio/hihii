import { useCallback, useState } from 'react';
import { Undo2, Shuffle } from 'lucide-react';
import { getGameById } from '../../lib/catalog';
import { soundEngine } from '../../lib/audio';
import {
  CHROMA_LEVELS,
  buildLevelGrid,
  buildRandomSolvableGrid,
  calculateChromaScore,
  countLitTiles,
  isBoardSolved,
  toggleCell,
  type ChromaGrid,
} from '../../lib/chromaFlipLogic';
import type { GameShellState, VictorySummary } from '../../lib/types';
import { GameShell } from '../GameShell';

interface ChromaFlipGameProps {
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (result: {
    score: number;
    won: boolean;
    detail: string;
    extraTrophies?: string[];
  }) => { isNewBest: boolean; surpriseNote?: VictorySummary['surpriseNote'] };
}

export function ChromaFlipGame({
  bestScore,
  muted,
  onToggleMute,
  onExit,
  onComplete,
}: ChromaFlipGameProps) {
  const game = getGameById('chroma-flip')!;
  const [levelIdx, setLevelIdx] = useState(0);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [par, setPar] = useState(CHROMA_LEVELS[0].par);
  const [grid, setGrid] = useState<ChromaGrid>(() => buildLevelGrid(CHROMA_LEVELS[0]));
  const [history, setHistory] = useState<ChromaGrid[]>([]);
  const [moves, setMoves] = useState(0);
  const [shellState, setShellState] = useState<GameShellState>('playing');
  const [summary, setSummary] = useState<VictorySummary | null>(null);

  const loadLevel = useCallback((idx: number) => {
    const safeIdx = ((idx % CHROMA_LEVELS.length) + CHROMA_LEVELS.length) % CHROMA_LEVELS.length;
    const lvl = CHROMA_LEVELS[safeIdx];
    setLevelIdx(safeIdx);
    setIsRandomMode(false);
    setPar(lvl.par);
    setGrid(buildLevelGrid(lvl));
    setHistory([]);
    setMoves(0);
    setSummary(null);
    setShellState('playing');
  }, []);

  const loadRandom = useCallback(() => {
    soundEngine.click();
    const { grid: nextGrid, par: nextPar } = buildRandomSolvableGrid(5);
    setIsRandomMode(true);
    setPar(nextPar);
    setGrid(nextGrid);
    setHistory([]);
    setMoves(0);
    setSummary(null);
    setShellState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (isRandomMode) {
      loadRandom();
    } else {
      loadLevel(levelIdx);
    }
  }, [isRandomMode, levelIdx, loadLevel, loadRandom]);

  const handleTileClick = (r: number, c: number) => {
    if (shellState !== 'playing') return;
    soundEngine.flip();
    const nextGrid = toggleCell(grid, r, c);
    const nextMoves = moves + 1;
    setHistory((prev) => [...prev, grid]);
    setGrid(nextGrid);
    setMoves(nextMoves);

    if (isBoardSolved(nextGrid)) {
      soundEngine.victory();
      const lvlId = isRandomMode ? 6 : CHROMA_LEVELS[levelIdx].id;
      const { score, stars } = calculateChromaScore(nextMoves, par, lvlId);
      const extraTrophies = stars === 3 ? ['par-master'] : [];
      const res = onComplete({
        score,
        won: true,
        detail: `${isRandomMode ? 'Random Board' : `Level ${lvlId}`} · ${nextMoves} moves`,
        extraTrophies,
      });

      setSummary({
        gameId: 'chroma-flip',
        title: 'Board Aligned',
        subtitle:
          stars === 3
            ? 'Solved within par moves for a 3-star finish.'
            : `Solved in ${nextMoves} moves (Par ${par}).`,
        score,
        scoreLabel: 'Score',
        metrics: [
          { label: 'Score', value: String(score) },
          { label: 'Moves', value: `${nextMoves}/${par}` },
          { label: 'Rating', value: `${stars}/3 ★` },
        ],
        isNewBest: res.isNewBest,
        outcome: 'victory',
        surpriseNote: res.surpriseNote,
      });
      setShellState('victory');
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || shellState !== 'playing') return;
    soundEngine.click();
    const prev = history[history.length - 1];
    setGrid(prev);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
  };

  const litCount = countLitTiles(grid);
  const currentLevel = CHROMA_LEVELS[levelIdx];

  return (
    <GameShell
      game={game}
      shellState={shellState}
      muted={muted}
      onToggleMute={onToggleMute}
      onPause={() => setShellState('paused')}
      onResume={() => setShellState('playing')}
      onRestart={handleRestart}
      onExit={onExit}
      summary={summary}
      secondaryAction={
        !isRandomMode
          ? {
              label: 'Next Level',
              onClick: () => loadLevel(levelIdx + 1),
            }
          : {
              label: 'New Random',
              onClick: loadRandom,
            }
      }
      hudMetrics={[
        { label: 'Board', value: isRandomMode ? 'Random' : `${currentLevel.id}/${CHROMA_LEVELS.length}` },
        { label: 'Moves', value: String(moves) },
        { label: 'Par', value: String(par) },
        { label: 'Best', value: String(bestScore) },
      ]}
    >
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Level selector strip */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#14161A]">
              {isRandomMode ? 'Random Challenge' : `${currentLevel.id}. ${currentLevel.name}`}
            </h2>
            <p className="text-xs text-[#5A606E]">
              Turn every cobalt tile to ivory · {litCount} remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-medium text-[#14161A] transition-colors hover:bg-[#EAEAE4] disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={loadRandom}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-medium text-[#14161A] transition-colors hover:bg-[#EAEAE4]"
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Random</span>
            </button>
          </div>
        </div>

        {/* 5x5 Ceramic Board */}
        <div
          role="grid"
          aria-label="Chroma Flip 5 by 5 puzzle board"
          className="w-full max-w-[420px] aspect-square rounded-2xl border border-[#C8B89A] bg-[#DFD8C8] p-3 sm:p-4 shadow-md"
        >
          <div className="grid grid-cols-5 grid-rows-5 gap-2.5 h-full w-full">
            {grid.map((row, r) =>
              row.map((isCobalt, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  aria-label={`Row ${r + 1} Column ${c + 1}, ${isCobalt ? 'Cobalt' : 'Ivory'}`}
                  aria-pressed={isCobalt}
                  onClick={() => handleTileClick(r, c)}
                  className={`rounded-lg border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                    isCobalt
                      ? 'bg-[#1D4ED8] border-[#1E40AF] shadow-inner scale-[0.98]'
                      : 'bg-[#FAF9F5] border-[#D6CFC0] hover:bg-white shadow-xs'
                  }`}
                />
              ))
            )}
          </div>
        </div>

        {/* Curated Level Switcher */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {CHROMA_LEVELS.map((lvl, idx) => {
            const active = !isRandomMode && idx === levelIdx;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  soundEngine.click();
                  loadLevel(idx);
                }}
                className={`h-8 w-8 rounded-md font-mono text-xs font-semibold tabular-nums transition-colors ${
                  active
                    ? 'bg-[#14161A] text-white'
                    : 'bg-white border border-black/10 text-[#4B5563] hover:text-[#14161A]'
                }`}
              >
                {lvl.id}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
