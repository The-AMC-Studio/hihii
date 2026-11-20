export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const WORD_BANK: string[] = [
  'AMBER', 'ATLAS', 'BLOOM', 'CEDAR', 'CHIME', 'CLEAR', 'CLOUD', 'CORAL',
  'CRANE', 'CRISP', 'CROWN', 'DRIFT', 'EMBER', 'FABLE', 'FLINT', 'FLORA',
  'FRAME', 'FROST', 'GLADE', 'GLEAM', 'GLIDE', 'GRAIN', 'GROVE', 'HAVEN',
  'IVORY', 'JEWEL', 'LATCH', 'LIGHT', 'LINEN', 'LOTUS', 'LUCID', 'LUNAR',
  'MAPLE', 'MARSH', 'MIRTH', 'MISTY', 'NOBLE', 'NORTH', 'OASIS', 'OLIVE',
  'OPALINE'.slice(0, 5), // keep strict 5-letter check below
  'ORBIT', 'PEARL', 'PETAL', 'PRISM', 'QUART', 'QUIET', 'QUILL', 'RIDGE',
  'RIVER', 'ROBIN', 'SABLE', 'SHORE', 'SILVA', 'SLATE', 'SOLAR', 'SPARK',
  'SPIRE', 'SPRIG', 'STONE', 'STORM', 'STORY', 'SWIFT', 'TEMPO', 'TERRA',
  'THORN', 'TIDAL', 'TIMED', 'TOPAZ', 'TRACE', 'TRAIL', 'TULIP', 'UMBER',
  'VALET', 'VAULT', 'VERVE', 'VIGOR', 'VIVID', 'WATER', 'WILLOW'.slice(0, 5),
].filter((w) => w.length === 5 && /^[A-Z]{5}$/.test(w));

// Clean curated 5-letter list (deduplicated)
export const CURATED_WORDS: string[] = Array.from(
  new Set([
    'AMBER', 'ATLAS', 'BLOOM', 'CEDAR', 'CHIME', 'CLEAR', 'CLOUD', 'CORAL',
    'CRANE', 'CRISP', 'CROWN', 'DRIFT', 'EMBER', 'FABLE', 'FLINT', 'FLORA',
    'FRAME', 'FROST', 'GLADE', 'GLEAM', 'GLIDE', 'GRAIN', 'GROVE', 'HAVEN',
    'IVORY', 'JEWEL', 'LATCH', 'LIGHT', 'LINEN', 'LOTUS', 'LUCID', 'LUNAR',
    'MAPLE', 'MARSH', 'MIRTH', 'MISTY', 'NOBLE', 'NORTH', 'OASIS', 'OLIVE',
    'ORBIT', 'PEARL', 'PETAL', 'PRISM', 'QUIET', 'QUILL', 'RIDGE', 'RIVER',
    'ROBIN', 'SABLE', 'SHORE', 'SLATE', 'SOLAR', 'SPARK', 'SPIRE', 'SPRIG',
    'STONE', 'STORM', 'STORY', 'SWIFT', 'TEMPO', 'TERRA', 'THORN', 'TIDAL',
    'TOPAZ', 'TRACE', 'TRAIL', 'TULIP', 'UMBER', 'VAULT', 'VERVE', 'VIGOR',
    'VIVID', 'WATER', 'WHALE', 'WHEAT', 'WORLD', 'YOUTH', 'ZESTY',
  ])
);

export function pickWord(index?: number, rng: () => number = Math.random): string {
  if (typeof index === 'number') {
    const safe = ((index % CURATED_WORDS.length) + CURATED_WORDS.length) % CURATED_WORDS.length;
    return CURATED_WORDS[safe];
  }
  return CURATED_WORDS[Math.floor(rng() * CURATED_WORDS.length)];
}

export function evaluateGuess(guessRaw: string, targetRaw: string): LetterStatus[] {
  const guess = guessRaw.toUpperCase();
  const target = targetRaw.toUpperCase();
  const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
    } else {
      remaining[target[i]] = (remaining[target[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (remaining[ch] && remaining[ch] > 0) {
      result[i] = 'present';
      remaining[ch] -= 1;
    }
  }

  return result;
}

const STATUS_PRIORITY: Record<LetterStatus, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export function mergeKeyboardStatuses(
  guesses: string[],
  target: string
): Record<string, LetterStatus> {
  const map: Record<string, LetterStatus> = {};
  for (const guess of guesses) {
    const evals = evaluateGuess(guess, target);
    for (let i = 0; i < guess.length; i++) {
      const ch = guess[i].toUpperCase();
      const status = evals[i];
      const current = map[ch] ?? 'empty';
      if (STATUS_PRIORITY[status] > STATUS_PRIORITY[current]) {
        map[ch] = status;
      }
    }
  }
  return map;
}

export function calculateWordLoomScore(attemptsUsed: number, hintsUsed: number, won: boolean): number {
  if (!won) return 0;
  const base = 420 - (attemptsUsed - 1) * 55;
  const penalty = hintsUsed * 45;
  return Math.max(100, base - penalty);
}
