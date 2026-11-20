import { useCallback, useEffect, useState } from 'react';
import { Delete, Lightbulb } from 'lucide-react';
import { getGameById } from '../../lib/catalog';
import { soundEngine } from '../../lib/audio';
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  calculateWordLoomScore,
  evaluateGuess,
  mergeKeyboardStatuses,
  pickWord,
  type LetterStatus,
} from '../../lib/wordLoomLogic';
import type { GameShellState, VictorySummary } from '../../lib/types';
import { GameShell } from '../GameShell';

interface WordLoomGameProps {
  bestScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (result: {
    score: number;
    won: boolean;
    detail: string;
  }) => { isNewBest: boolean; surpriseNote?: VictorySummary['surpriseNote'] };
}

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export function WordLoomGame({
  bestScore,
  muted,
  onToggleMute,
  onExit,
  onComplete,
}: WordLoomGameProps) {
  const game = getGameById('word-loom')!;
  const [target, setTarget] = useState<string>(() => pickWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shellState, setShellState] = useState<GameShellState>('playing');
  const [summary, setSummary] = useState<VictorySummary | null>(null);

  const startNewWord = useCallback(() => {
    setTarget(pickWord());
    setGuesses([]);
    setCurrent('');
    setHintsUsed(0);
    setHintText(null);
    setNotice(null);
    setSummary(null);
    setShellState('playing');
  }, []);

  const submitGuess = useCallback(() => {
    if (shellState !== 'playing') return;
    if (current.length < WORD_LENGTH) {
      setNotice('Enter all five letters before submitting.');
      return;
    }

    const guess = current.toUpperCase();
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrent('');
    setNotice(null);
    soundEngine.flip();

    const won = guess === target;
    const lost = !won && nextGuesses.length >= MAX_ATTEMPTS;

    if (won || lost) {
      const score = calculateWordLoomScore(nextGuesses.length, hintsUsed, won);
      if (won) soundEngine.victory();
      else soundEngine.defeat();

      const res = onComplete({
        score,
        won,
        detail: won
          ? `Solved "${target}" in ${nextGuesses.length}/${MAX_ATTEMPTS}`
          : `Word was "${target}"`,
      });

      setSummary({
        gameId: 'word-loom',
        title: won ? 'Word Solved' : 'Out of Attempts',
        subtitle: won
          ? `You deduced "${target}" in ${nextGuesses.length} ${nextGuesses.length === 1 ? 'try' : 'tries'}.`
          : `The hidden word was "${target}".`,
        score,
        scoreLabel: 'Score',
        metrics: [
          { label: 'Score', value: String(score) },
          { label: 'Attempts', value: `${nextGuesses.length}/${MAX_ATTEMPTS}` },
          { label: 'Hints', value: String(hintsUsed) },
        ],
        isNewBest: res.isNewBest,
        outcome: won ? 'victory' : 'gameover',
        surpriseNote: res.surpriseNote,
      });
      setShellState(won ? 'victory' : 'gameover');
    }
  }, [current, guesses, hintsUsed, onComplete, shellState, target]);

  const handleKeyInput = useCallback(
    (key: string) => {
      if (shellState !== 'playing') return;
      setNotice(null);
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK' || key === 'BACKSPACE') {
        setCurrent((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
        soundEngine.click();
        setCurrent((prev) => prev + key);
      }
    },
    [current.length, shellState, submitGuess]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shellState !== 'playing') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyInput('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyInput('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKeyInput(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyInput, shellState]);

  const handleHint = () => {
    if (shellState !== 'playing' || hintsUsed >= 2) return;
    soundEngine.click();
    const pos = hintsUsed === 0 ? 0 : WORD_LENGTH - 1;
    const label = pos === 0 ? `Starts with "${target[0]}"` : `Ends with "${target[WORD_LENGTH - 1]}"`;
    setHintsUsed((h) => h + 1);
    setHintText(label);
  };

  const kbMap = mergeKeyboardStatuses(guesses, target);

  const tileClasses = (status: LetterStatus) => {
    switch (status) {
      case 'correct':
        return 'bg-[#1D4ED8] border-[#1D4ED8] text-white';
      case 'present':
        return 'bg-[#D97706] border-[#D97706] text-white';
      case 'absent':
        return 'bg-[#64748B] border-[#64748B] text-white';
      default:
        return 'bg-white border-black/15 text-[#14161A]';
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
      onRestart={startNewWord}
      onExit={onExit}
      summary={summary}
      hudMetrics={[
        { label: 'Attempt', value: `${Math.min(MAX_ATTEMPTS, guesses.length + 1)}/${MAX_ATTEMPTS}` },
        { label: 'Hints', value: `${hintsUsed}/2` },
        { label: 'Best', value: String(bestScore) },
      ]}
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Top helper row */}
        <div className="w-full flex items-center justify-between gap-4 mb-4">
          <div className="text-xs text-[#5A606E]" aria-live="polite">
            {notice ?? hintText ?? 'Cobalt = exact spot · Amber = wrong spot'}
          </div>
          <button
            type="button"
            onClick={handleHint}
            disabled={hintsUsed >= 2 || shellState !== 'playing'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-medium text-[#14161A] transition-colors hover:bg-[#EAEAE4] disabled:opacity-40 whitespace-nowrap"
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Hint</span>
          </button>
        </div>

        {/* 6x5 Letter Grid */}
        <div className="grid grid-rows-6 gap-2 w-full max-w-[320px]">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIdx) => {
            const committed = rowIdx < guesses.length;
            const isActiveRow = rowIdx === guesses.length;
            const word = committed ? guesses[rowIdx] : isActiveRow ? current : '';
            const statuses = committed
              ? evaluateGuess(word, target)
              : Array<LetterStatus>(WORD_LENGTH).fill('empty');

            return (
              <div key={rowIdx} className="grid grid-cols-5 gap-2">
                {Array.from({ length: WORD_LENGTH }).map((__, colIdx) => {
                  const letter = word[colIdx] ?? '';
                  const status = statuses[colIdx];
                  return (
                    <div
                      key={colIdx}
                      aria-label={
                        letter
                          ? `${letter}, ${status === 'empty' ? 'typed' : status}`
                          : 'Empty tile'
                      }
                      className={`relative aspect-square rounded-lg border-2 flex items-center justify-center font-mono text-xl font-bold transition-colors ${tileClasses(
                        status
                      )} ${isActiveRow && letter ? 'border-[#14161A]' : ''}`}
                    >
                      {letter}
                      {status === 'correct' && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-white"
                        />
                      )}
                      {status === 'present' && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full border border-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* On-Screen Keyboard */}
        <div className="mt-6 w-full flex flex-col gap-1.5">
          {KEY_ROWS.map((row, idx) => (
            <div key={idx} className="flex items-center justify-center gap-1.5">
              {row.map((key) => {
                const isAction = key === 'ENTER' || key === 'BACK';
                const status = !isAction ? kbMap[key] ?? 'empty' : 'empty';
                const keyStyle =
                  status === 'correct'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : status === 'present'
                    ? 'bg-[#D97706] text-white border-[#D97706]'
                    : status === 'absent'
                    ? 'bg-[#94A3B8] text-white border-[#94A3B8]'
                    : 'bg-white text-[#14161A] border-black/12 hover:bg-[#EAEAE4]';

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={key === 'BACK' ? 'Backspace' : key === 'ENTER' ? 'Submit guess' : key}
                    onClick={() => handleKeyInput(key)}
                    className={`h-11 rounded-lg border font-mono text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${
                      isAction ? 'px-3 sm:px-4' : 'flex-1 max-w-[42px]'
                    } ${keyStyle}`}
                  >
                    {key === 'BACK' ? <Delete className="h-4 w-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
