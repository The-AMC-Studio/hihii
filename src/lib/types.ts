export type GameId = 'starlight-drift' | 'chroma-flip' | 'botanical-match' | 'word-loom';

export type GameCategory = 'All' | 'Arcade' | 'Puzzle' | 'Memory' | 'Word';

export type NavSection = 'games' | 'trophies' | 'stats' | 'notes';

export type GameShellState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export interface GameMeta {
  id: GameId;
  title: string;
  category: Exclude<GameCategory, 'All'>;
  summary: string;
  durationLabel: string;
  controlsHint: string;
  coverImage: string;
  accentColor: string;
  scoreUnit: string;
}

export interface SessionRecord {
  id: string;
  gameId: GameId;
  score: number;
  outcome: 'victory' | 'completed';
  detail: string;
  timestamp: number;
}

export interface GameProgress {
  plays: number;
  wins: number;
  bestScore: number;
  lastPlayedAt: number | null;
}

export interface TrophyDef {
  id: string;
  title: string;
  description: string;
  gameId?: GameId;
  isHidden?: boolean;
}

export interface SecretVictoryNote {
  gameId: GameId;
  enabled: boolean;
  /**
   * Optional rare nickname shown ONLY inside the contextual victory card
   * when this note's trigger condition is met. Never rendered in default UI.
   */
  nickname: string;
  message: string;
  minScore?: number;
}

export interface PlatformState {
  progress: Record<GameId, GameProgress>;
  sessions: SessionRecord[];
  unlockedTrophies: string[];
  easterEggUnlocked: boolean;
  muted: boolean;
  lastGameId: GameId;
  secretNotes: Record<GameId, SecretVictoryNote>;
}

export interface VictorySummary {
  gameId: GameId;
  title: string;
  subtitle: string;
  score: number;
  scoreLabel: string;
  metrics: Array<{ label: string; value: string }>;
  isNewBest: boolean;
  outcome: 'victory' | 'gameover';
  /**
   * Rare contextual note shown strictly on qualifying completion moments.
   */
  surpriseNote?: {
    nickname?: string;
    message: string;
    label: string;
  };
}
