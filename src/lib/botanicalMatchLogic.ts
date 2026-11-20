export type EmblemId =
  | 'fern'
  | 'crescent'
  | 'sunburst'
  | 'lotus'
  | 'compass'
  | 'acorn'
  | 'shell'
  | 'star'
  | 'feather'
  | 'olive';

export interface BotanicalCard {
  uid: string;
  emblem: EmblemId;
  label: string;
  flipped: boolean;
  matched: boolean;
}

export const EMBLEM_CATALOG: Array<{ id: EmblemId; label: string }> = [
  { id: 'fern', label: 'Silver Fern' },
  { id: 'crescent', label: 'Crescent Moon' },
  { id: 'sunburst', label: 'Solstice Sun' },
  { id: 'lotus', label: 'Water Lotus' },
  { id: 'compass', label: 'North Star' },
  { id: 'acorn', label: 'Oak Acorn' },
  { id: 'shell', label: 'Nautilus Shell' },
  { id: 'star', label: 'Evening Star' },
  { id: 'feather', label: 'Quill Feather' },
  { id: 'olive', label: 'Olive Sprig' },
];

export function createDeck(pairCount: 8 | 10 = 8, rng: () => number = Math.random): BotanicalCard[] {
  const chosen = EMBLEM_CATALOG.slice(0, pairCount);
  const deck: BotanicalCard[] = [];
  for (const item of chosen) {
    deck.push({ uid: `${item.id}-a`, emblem: item.id, label: item.label, flipped: false, matched: false });
    deck.push({ uid: `${item.id}-b`, emblem: item.id, label: item.label, flipped: false, matched: false });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function evaluateCardPair(
  first: BotanicalCard,
  second: BotanicalCard,
  currentStreak: number
): { matched: boolean; nextStreak: number; pointsAwarded: number } {
  if (first.emblem === second.emblem && first.uid !== second.uid) {
    const nextStreak = currentStreak + 1;
    const pointsAwarded = 80 + (nextStreak - 1) * 35;
    return { matched: true, nextStreak, pointsAwarded };
  }
  return { matched: false, nextStreak: 0, pointsAwarded: 0 };
}

export function isDeckCleared(deck: BotanicalCard[]): boolean {
  return deck.length > 0 && deck.every((c) => c.matched);
}

export function calculateBotanicalBonus(moves: number, pairCount: number): number {
  const ideal = pairCount;
  const extraMoves = Math.max(0, moves - ideal);
  return Math.max(0, 260 - extraMoves * 18);
}
