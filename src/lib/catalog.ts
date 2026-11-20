import type { GameMeta, TrophyDef } from './types';

export const HERO_STAGE_IMAGE = '/src/assets/images/hero_arcade_stage_1795151969111.jpg';

export const GAME_CATALOG: GameMeta[] = [
  {
    id: 'starlight-drift',
    title: 'Starlight Drift',
    category: 'Arcade',
    summary: 'Pilot an origami glider across a twilight valley, gather lanterns, and weave past shifting gusts.',
    durationLabel: '2–4 min',
    controlsHint: 'W / S or Up / Down to steer · P to pause',
    coverImage: '/src/assets/images/cover_starlight_drift_1795151970064.jpg',
    accentColor: '#2563EB',
    scoreUnit: 'pts',
  },
  {
    id: 'chroma-flip',
    title: 'Chroma Flip',
    category: 'Puzzle',
    summary: 'Align a 5×5 ceramic tile board to pure ivory by mastering orthogonal flip patterns within par moves.',
    durationLabel: '2–5 min',
    controlsHint: 'Click or press Enter on any tile to flip its cross',
    coverImage: '/src/assets/images/cover_chroma_flip_1795151969751.jpg',
    accentColor: '#1D4ED8',
    scoreUnit: 'pts',
  },
  {
    id: 'botanical-match',
    title: 'Botanical Match',
    category: 'Memory',
    summary: 'Uncover paired botanical and celestial emblems to build uninterrupted combo streaks.',
    durationLabel: '2–3 min',
    controlsHint: 'Click any two cards to reveal and match pairs',
    coverImage: '/src/assets/images/cover_botanical_match_1795151969245.jpg',
    accentColor: '#0F766E',
    scoreUnit: 'pts',
  },
  {
    id: 'word-loom',
    title: 'Word Loom',
    category: 'Word',
    summary: 'Deduce the hidden five-letter word in six attempts using crisp positional letter clues.',
    durationLabel: '3–5 min',
    controlsHint: 'Type letters · Enter to submit · Backspace to erase',
    coverImage: '/src/assets/images/cover_word_loom_1795151968826.jpg',
    accentColor: '#334155',
    scoreUnit: 'pts',
  },
];

export const TROPHY_CATALOG: TrophyDef[] = [
  {
    id: 'first-flight',
    title: 'First Flight',
    description: 'Complete your first run in Starlight Drift.',
    gameId: 'starlight-drift',
  },
  {
    id: 'lantern-collector',
    title: 'Lantern Keeper',
    description: 'Score 450 points or more in a single Starlight Drift run.',
    gameId: 'starlight-drift',
  },
  {
    id: 'clean-board',
    title: 'Clean Slate',
    description: 'Solve any board in Chroma Flip.',
    gameId: 'chroma-flip',
  },
  {
    id: 'par-master',
    title: 'Under Par',
    description: 'Solve a Chroma Flip level within par moves for a 3-star finish.',
    gameId: 'chroma-flip',
  },
  {
    id: 'sharp-memory',
    title: 'Botanical Eye',
    description: 'Clear a full deck in Botanical Match.',
    gameId: 'botanical-match',
  },
  {
    id: 'streak-keeper',
    title: 'Unbroken Streak',
    description: 'Chain 3 consecutive matches in Botanical Match.',
    gameId: 'botanical-match',
  },
  {
    id: 'wordsmith',
    title: 'Clear Deduction',
    description: 'Solve a puzzle in Word Loom.',
    gameId: 'word-loom',
  },
  {
    id: 'all-rounder',
    title: 'Full Collection',
    description: 'Play all four games in the collection.',
  },
];

export function getGameById(id: string): GameMeta | undefined {
  return GAME_CATALOG.find((g) => g.id === id);
}
