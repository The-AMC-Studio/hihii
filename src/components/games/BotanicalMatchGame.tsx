import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameById } from '../../lib/catalog';
import { soundEngine } from '../../lib/audio';
import {
  calculateBotanicalBonus,
  createDeck,
  evaluateCardPair,
  isDeckCleared,
  type BotanicalCard,
  type EmblemId,
} from '../../lib/botanicalMatchLogic';
import type { GameShellState, VictorySummary } from '../../lib/types';
import { GameShell } from '../GameShell';

interface BotanicalMatchGameProps {
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

function EmblemGlyph({ emblem }: { emblem: EmblemId }) {
  switch (emblem) {
    case 'fern':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 34V8" />
          <path d="M20 26c-5 0-8-3-9-7 4 0 7 2 9 7Z" />
          <path d="M20 20c5 0 8-3 9-7-4 0-7 2-9 7Z" />
          <path d="M20 14c-4 0-6-2-7-5 3 0 5 1 7 5Z" />
        </svg>
      );
    case 'crescent':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M26 29A12 12 0 1 1 22 8a9.5 9.5 0 1 0 4 21Z" />
          <circle cx="27" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'sunburst':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="20" cy="20" r="6" />
          <path d="M20 6v4M20 30v4M6 20h4M30 20h4M10.1 10.1l2.8 2.8M27.1 27.1l2.8 2.8M29.9 10.1l-2.8 2.8M12.9 27.1l-2.8 2.8" />
        </svg>
      );
    case 'lotus':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 10c4 5 4 12 0 18-4-6-4-13 0-18Z" />
          <path d="M20 28c-6-1-10-6-11-12 5 1 9 5 11 12Z" />
          <path d="M20 28c6-1 10-6 11-12-5 1-9 5-11 12Z" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 6l3.5 10.5L34 20l-10.5 3.5L20 34l-3.5-10.5L6 20l10.5-3.5L20 6Z" />
          <circle cx="20" cy="20" r="2.2" fill="currentColor" />
        </svg>
      );
    case 'acorn':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 8v4" />
          <path d="M11 18c0-4 4-6 9-6s9 2 9 6H11Z" />
          <path d="M13 18v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10v-5" />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 31c-7 0-12-5-12-11 0-6 5-11 12-11s12 5 12 11c0 6-5 11-12 11Z" />
          <path d="M20 31V9M20 31l-7-19M20 31l7-19" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M20 7l3.8 8.2L33 16.5l-6.6 6.1 1.7 9-8.1-4.5-8.1 4.5 1.7-9L7 16.5l9.2-1.3L20 7Z" />
        </svg>
      );
    case 'feather':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M10 31C11 19 19 11 31 9c-2 12-10 20-21 22Z" />
          <path d="M9 32L24 17" />
        </svg>
      );
    case 'olive':
      return (
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M10 30c6-7 13-13 21-19" />
          <ellipse cx="17" cy="17" rx="3" ry="5" transform="rotate(-35 17 17)" />
          <ellipse cx="25" cy="23" rx="3" ry="5" transform="rotate(35 25 23)" />
        </svg>
      );
  }
}

export function BotanicalMatchGame({
  bestScore,
  muted,
  onToggleMute,
  onExit,
  onComplete,
}: BotanicalMatchGameProps) {
  const game = getGameById('botanical-match')!;
  const [pairCount, setPairCount] = useState<8 | 10>(8);
  const [deck, setDeck] = useState<BotanicalCard[]>(() => createDeck(8));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [shellState, setShellState] = useState<GameShellState>('playing');
  const [summary, setSummary] = useState<VictorySummary | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPending(), [clearPending]);

  const startDeck = useCallback(
    (pairs: 8 | 10) => {
      clearPending();
      setPairCount(pairs);
      setDeck(createDeck(pairs));
      setSelectedIds([]);
      setLocked(false);
      setMoves(0);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setSummary(null);
      setShellState('playing');
    },
    [clearPending]
  );

  const handleCardClick = (uid: string) => {
    if (shellState !== 'playing' || locked) return;
    const card = deck.find((c) => c.uid === uid);
    if (!card || card.flipped || card.matched) return;

    soundEngine.flip();
    const updatedDeck = deck.map((c) => (c.uid === uid ? { ...c, flipped: true } : c));
    const nextSelected = [...selectedIds, uid];
    setDeck(updatedDeck);
    setSelectedIds(nextSelected);

    if (nextSelected.length === 2) {
      setLocked(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      const first = updatedDeck.find((c) => c.uid === nextSelected[0])!;
      const second = updatedDeck.find((c) => c.uid === nextSelected[1])!;
      const res = evaluateCardPair(first, second, streak);

      if (res.matched) {
        soundEngine.match();
        const nextScore = score + res.pointsAwarded;
        const nextMaxStreak = Math.max(maxStreak, res.nextStreak);
        setScore(nextScore);
        setStreak(res.nextStreak);
        setMaxStreak(nextMaxStreak);

        timeoutRef.current = window.setTimeout(() => {
          const matchedDeck = updatedDeck.map((c) =>
            c.uid === first.uid || c.uid === second.uid ? { ...c, matched: true } : c
          );
          setDeck(matchedDeck);
          setSelectedIds([]);
          setLocked(false);

          if (isDeckCleared(matchedDeck)) {
            soundEngine.victory();
            const bonus = calculateBotanicalBonus(nextMoves, pairCount);
            const totalScore = nextScore + bonus;
            setScore(totalScore);
            const extraTrophies = nextMaxStreak >= 3 ? ['streak-keeper'] : [];
            const record = onComplete({
              score: totalScore,
              won: true,
              detail: `${pairCount} pairs · ${nextMoves} moves · ${nextMaxStreak}x streak`,
              extraTrophies,
            });
            setSummary({
              gameId: 'botanical-match',
              title: 'Deck Cleared',
              subtitle: `All ${pairCount} botanical pairs uncovered in ${nextMoves} moves.`,
              score: totalScore,
              scoreLabel: 'Score',
              metrics: [
                { label: 'Score', value: String(totalScore) },
                { label: 'Moves', value: String(nextMoves) },
                { label: 'Best Streak', value: `${nextMaxStreak}x` },
              ],
              isNewBest: record.isNewBest,
              outcome: 'victory',
              surpriseNote: record.surpriseNote,
            });
            setShellState('victory');
          }
        }, 240);
      } else {
        setStreak(0);
        timeoutRef.current = window.setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.uid === first.uid || c.uid === second.uid ? { ...c, flipped: false } : c
            )
          );
          setSelectedIds([]);
          setLocked(false);
        }, 680);
      }
    }
  };

  return (
    <GameShell
      game={game}
      shellState={shellState}
      muted={muted}
      onToggleMute={onToggleMute}
      onPause={() => setShellState('paused')}
      onResume={() => setShellState('playing')}
      onRestart={() => startDeck(pairCount)}
      onExit={onExit}
      summary={summary}
      hudMetrics={[
        { label: 'Score', value: String(score) },
        { label: 'Moves', value: String(moves) },
        { label: 'Streak', value: `${streak}x` },
        { label: 'Best', value: String(Math.max(bestScore, score)) },
      ]}
    >
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="w-full flex items-center justify-between gap-4 mb-5">
          <p className="text-xs text-[#5A606E]">
            Match pairs consecutively to multiply your streak score.
          </p>
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#EAEAE4] p-1">
            {([8, 10] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => {
                  soundEngine.click();
                  startDeck(cnt);
                }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  pairCount === cnt
                    ? 'bg-white text-[#14161A] shadow-xs'
                    : 'text-[#5A606E] hover:text-[#14161A]'
                }`}
              >
                {cnt === 8 ? '4×4' : '4×5'}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`grid gap-3 w-full ${
            pairCount === 8 ? 'grid-cols-4 max-w-[460px]' : 'grid-cols-4 sm:grid-cols-5 max-w-[560px]'
          }`}
        >
          {deck.map((card, idx) => {
            const revealed = card.flipped || card.matched;
            return (
              <button
                key={card.uid}
                type="button"
                onClick={() => handleCardClick(card.uid)}
                disabled={revealed}
                aria-label={
                  revealed
                    ? `Card ${idx + 1}: ${card.label}${card.matched ? ', matched' : ''}`
                    : `Hidden card ${idx + 1}`
                }
                className={`aspect-[3/4] rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                  card.matched
                    ? 'border-[#0F766E]/35 bg-[#F0FDFA] text-[#0F766E]'
                    : revealed
                    ? 'border-[#C8A96A] bg-[#FAF9F5] text-[#14161A] shadow-sm'
                    : 'border-[#1E293B] bg-[#162032] text-[#C8A96A]/65 hover:bg-[#1E2B42]'
                }`}
              >
                {revealed ? (
                  <>
                    <EmblemGlyph emblem={card.emblem} />
                    <span className="mt-1.5 text-[10px] font-medium tracking-tight text-center leading-tight">
                      {card.label}
                    </span>
                  </>
                ) : (
                  <svg
                    viewBox="0 0 32 32"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    aria-hidden="true"
                  >
                    <circle cx="16" cy="16" r="10" />
                    <path d="M16 8v16M8 16h16" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
