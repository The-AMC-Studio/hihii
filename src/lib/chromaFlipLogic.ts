export type ChromaGrid = boolean[][];

export interface ChromaLevel {
  id: number;
  name: string;
  par: number;
  solutionMoves: Array<[number, number]>;
}

export const BOARD_SIZE = 5;

export const CHROMA_LEVELS: ChromaLevel[] = [
  { id: 1, name: 'Center Cross', par: 1, solutionMoves: [[2, 2]] },
  { id: 2, name: 'Twin Pillars', par: 2, solutionMoves: [[2, 1], [2, 3]] },
  { id: 3, name: 'Corner Echo', par: 3, solutionMoves: [[0, 0], [2, 2], [4, 4]] },
  { id: 4, name: 'Diamond Ring', par: 4, solutionMoves: [[1, 2], [3, 2], [2, 1], [2, 3]] },
  { id: 5, name: 'Four Corners', par: 4, solutionMoves: [[0, 0], [0, 4], [4, 0], [4, 4]] },
  { id: 6, name: 'Diagonal Steps', par: 5, solutionMoves: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  { id: 7, name: 'Inner Frame', par: 6, solutionMoves: [[1, 1], [1, 3], [3, 1], [3, 3], [0, 2], [4, 2]] },
  { id: 8, name: 'Mosaic', par: 7, solutionMoves: [[0, 2], [1, 1], [1, 3], [2, 0], [2, 4], [3, 2], [4, 2]] },
];

export function createEmptyGrid(size = BOARD_SIZE): ChromaGrid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false));
}

export function cloneGrid(grid: ChromaGrid): ChromaGrid {
  return grid.map((row) => [...row]);
}

export function toggleCell(grid: ChromaGrid, row: number, col: number): ChromaGrid {
  const next = cloneGrid(grid);
  const size = next.length;
  const targets: Array<[number, number]> = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of targets) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      next[r][c] = !next[r][c];
    }
  }
  return next;
}

export function buildLevelGrid(level: ChromaLevel): ChromaGrid {
  let grid = createEmptyGrid();
  for (const [r, c] of level.solutionMoves) {
    grid = toggleCell(grid, r, c);
  }
  return grid;
}

export function buildRandomSolvableGrid(steps = 6, rng: () => number = Math.random): { grid: ChromaGrid; par: number } {
  let grid = createEmptyGrid();
  const used = new Set<string>();
  let applied = 0;
  let guard = 0;
  while (applied < steps && guard < 100) {
    guard++;
    const r = Math.floor(rng() * BOARD_SIZE);
    const c = Math.floor(rng() * BOARD_SIZE);
    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      grid = toggleCell(grid, r, c);
      applied++;
    }
  }
  return { grid, par: applied };
}

export function isBoardSolved(grid: ChromaGrid): boolean {
  return grid.every((row) => row.every((cell) => !cell));
}

export function countLitTiles(grid: ChromaGrid): number {
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) total++;
    }
  }
  return total;
}

export function calculateChromaScore(moves: number, par: number, levelId: number): { score: number; stars: 1 | 2 | 3 } {
  const stars: 1 | 2 | 3 = moves <= par ? 3 : moves <= par + 2 ? 2 : 1;
  const efficiencyBonus = Math.max(0, (par + 4 - moves) * 35);
  const base = 180 + levelId * 30;
  return {
    score: base + efficiencyBonus + stars * 40,
    stars,
  };
}
