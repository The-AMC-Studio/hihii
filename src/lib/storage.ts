import type { GameId, PlatformState, SecretVictoryNote, SessionRecord } from './types';

const STORAGE_KEY = 'mehak_arcade_state_v1';

export function createInitialPlatformState(): PlatformState {
  return {
    progress: {
      'starlight-drift': { plays: 0, wins: 0, bestScore: 0, lastPlayedAt: null },
      'chroma-flip': { plays: 0, wins: 0, bestScore: 0, lastPlayedAt: null },
      'botanical-match': { plays: 0, wins: 0, bestScore: 0, lastPlayedAt: null },
      'word-loom': { plays: 0, wins: 0, bestScore: 0, lastPlayedAt: null },
    },
    sessions: [],
    unlockedTrophies: [],
    easterEggUnlocked: false,
    muted: false,
    lastGameId: 'starlight-drift',
    secretNotes: {
      'starlight-drift': {
        gameId: 'starlight-drift',
        enabled: false,
        nickname: '',
        message: 'You glided straight through the twilight valley without missing a beat.',
        minScore: 400,
      },
      'chroma-flip': {
        gameId: 'chroma-flip',
        enabled: false,
        nickname: '',
        message: 'Every tile aligned cleanly—sharp pattern sense as always.',
        minScore: 250,
      },
      'botanical-match': {
        gameId: 'botanical-match',
        enabled: false,
        nickname: '',
        message: 'Not a single emblem slipped past your memory.',
        minScore: 600,
      },
      'word-loom': {
        gameId: 'word-loom',
        enabled: false,
        nickname: '',
        message: 'Solved cleanly with room to spare.',
        minScore: 300,
      },
    },
  };
}

export function loadPlatformState(): PlatformState {
  const initial = createInitialPlatformState();
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<PlatformState>;
    return {
      ...initial,
      ...parsed,
      progress: {
        ...initial.progress,
        ...(parsed.progress ?? {}),
      },
      secretNotes: {
        ...initial.secretNotes,
        ...(parsed.secretNotes ?? {}),
      },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(0, 30) : [],
      unlockedTrophies: Array.isArray(parsed.unlockedTrophies) ? parsed.unlockedTrophies : [],
    };
  } catch {
    return initial;
  }
}

export function savePlatformState(state: PlatformState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

/**
 * Evaluates whether a rare contextual surprise note should appear on a game's
 * victory card. Strictly enforces the Nickname Usage Policy:
 * - Only triggers on a qualifying victory (never on homepage, nav, or defeat).
 * - Only displays a configured nickname if explicitly enabled and non-empty.
 * - Never combines multiple nicknames.
 */
export function resolveContextualVictoryNote(
  note: SecretVictoryNote | undefined,
  score: number,
  outcome: 'victory' | 'gameover'
): { nickname?: string; message: string; label: string } | undefined {
  if (!note || !note.enabled) return undefined;
  if (outcome !== 'victory') return undefined;
  const threshold = note.minScore ?? 0;
  if (score < threshold) return undefined;
  const cleanMessage = note.message.trim();
  if (!cleanMessage) return undefined;
  const cleanNickname = note.nickname.trim();
  return {
    nickname: cleanNickname.length > 0 ? cleanNickname : undefined,
    message: cleanMessage,
    label: 'Unlocked Keepsake Note',
  };
}

export function recordGameResult(
  state: PlatformState,
  params: {
    gameId: GameId;
    score: number;
    won: boolean;
    detail: string;
    extraTrophies?: string[];
  }
): { nextState: PlatformState; isNewBest: boolean; newlyUnlocked: string[] } {
  const prev = state.progress[params.gameId];
  const isNewBest = params.score > prev.bestScore;
  const now = Date.now();

  const nextProgress = {
    ...state.progress,
    [params.gameId]: {
      plays: prev.plays + 1,
      wins: prev.wins + (params.won ? 1 : 0),
      bestScore: Math.max(prev.bestScore, params.score),
      lastPlayedAt: now,
    },
  };

  const session: SessionRecord = {
    id: `${params.gameId}-${now}`,
    gameId: params.gameId,
    score: params.score,
    outcome: params.won ? 'victory' : 'completed',
    detail: params.detail,
    timestamp: now,
  };

  const candidateTrophies = new Set<string>(state.unlockedTrophies);
  const newlyUnlocked: string[] = [];

  const maybeAdd = (id: string) => {
    if (!candidateTrophies.has(id)) {
      candidateTrophies.add(id);
      newlyUnlocked.push(id);
    }
  };

  if (params.gameId === 'starlight-drift') {
    maybeAdd('first-flight');
    if (params.score >= 450) maybeAdd('lantern-collector');
  }
  if (params.gameId === 'chroma-flip' && params.won) {
    maybeAdd('clean-board');
  }
  if (params.gameId === 'botanical-match' && params.won) {
    maybeAdd('sharp-memory');
  }
  if (params.gameId === 'word-loom' && params.won) {
    maybeAdd('wordsmith');
  }

  for (const t of params.extraTrophies ?? []) {
    maybeAdd(t);
  }

  const allPlayed = (Object.keys(nextProgress) as GameId[]).every(
    (id) => nextProgress[id].plays > 0
  );
  if (allPlayed) {
    maybeAdd('all-rounder');
  }

  const nextState: PlatformState = {
    ...state,
    progress: nextProgress,
    sessions: [session, ...state.sessions].slice(0, 25),
    unlockedTrophies: Array.from(candidateTrophies),
    lastGameId: params.gameId,
  };

  return { nextState, isNewBest, newlyUnlocked };
}
