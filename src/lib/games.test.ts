import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHROMA_LEVELS,
  buildLevelGrid,
  toggleCell,
  isBoardSolved,
  calculateChromaScore,
} from './chromaFlipLogic';
import { evaluateGuess, mergeKeyboardStatuses, calculateWordLoomScore } from './wordLoomLogic';
import { createDeck, evaluateCardPair, isDeckCleared } from './botanicalMatchLogic';
import { createDriftSimulation, stepDriftSimulation } from './starlightDriftLogic';
import {
  createInitialPlatformState,
  resolveContextualVictoryNote,
  recordGameResult,
} from './storage';

test('Chroma Flip: solving level 1 in 1 move clears board and awards 3 stars', () => {
  const level1 = CHROMA_LEVELS[0];
  const grid = buildLevelGrid(level1);
  assert.equal(isBoardSolved(grid), false);

  const solved = toggleCell(grid, 2, 2);
  assert.equal(isBoardSolved(solved), true);

  const { stars, score } = calculateChromaScore(1, level1.par, level1.id);
  assert.equal(stars, 3);
  assert.ok(score > 200);
});

test('Word Loom: evaluateGuess handles exact, present, and duplicate letters accurately', () => {
  assert.deepEqual(evaluateGuess('CRISP', 'CRISP'), [
    'correct',
    'correct',
    'correct',
    'correct',
    'correct',
  ]);
  // Target has only one 'L' (index 0 in LIGHT); guess 'LLAMA' should mark index 0 correct, index 1 absent
  assert.deepEqual(evaluateGuess('LLAMA', 'LIGHT'), [
    'correct',
    'absent',
    'absent',
    'absent',
    'absent',
  ]);

  const kb = mergeKeyboardStatuses(['SLATE', 'LIGHT'], 'LIGHT');
  assert.equal(kb['L'], 'correct');
  assert.equal(kb['S'], 'absent');
  assert.ok(calculateWordLoomScore(2, 0, true) > calculateWordLoomScore(5, 1, true));
});

test('Botanical Match: deck creates pairs and streak scoring increments on matches', () => {
  const deck = createDeck(8, () => 0.42);
  assert.equal(deck.length, 16);
  assert.equal(isDeckCleared(deck), false);

  const first = deck[0];
  const partner = deck.find((c) => c.emblem === first.emblem && c.uid !== first.uid)!;
  const res1 = evaluateCardPair(first, partner, 0);
  assert.equal(res1.matched, true);
  assert.equal(res1.nextStreak, 1);

  const res2 = evaluateCardPair(first, partner, res1.nextStreak);
  assert.equal(res2.nextStreak, 2);
  assert.ok(res2.pointsAwarded > res1.pointsAwarded);
});

test('Starlight Drift: glider survives idle opening and collects lanterns', () => {
  const sim = createDriftSimulation(960, 540);
  // Survive 2 seconds with zero input
  for (let i = 0; i < 60; i++) {
    stepDriftSimulation(sim, 1 / 30, { up: false, down: false, targetY: null }, () => 0.5);
  }
  assert.equal(sim.over, false);
  assert.equal(sim.player.hp, 3);

  // Place a lantern right on the player and step
  sim.lanterns.push({
    id: 999,
    x: sim.player.x,
    y: sim.player.y,
    baseY: sim.player.y,
    phase: 0,
    radius: 15,
    collected: false,
  });
  const ev = stepDriftSimulation(sim, 0.016, { up: false, down: false, targetY: null }, () => 0.5);
  assert.equal(ev.collectedLantern, true);
  assert.equal(sim.lanternsCollected, 1);
});

test('Nickname Policy: contextual victory notes stay hidden unless enabled and victory threshold met', () => {
  const initial = createInitialPlatformState();
  // By default, all secret notes are disabled and contain no nicknames
  for (const note of Object.values(initial.secretNotes)) {
    assert.equal(note.enabled, false);
    assert.equal(note.nickname, '');
  }

  const configured = {
    gameId: 'chroma-flip' as const,
    enabled: true,
    nickname: 'Starlight',
    message: 'Clean sweep on the ceramic board.',
    minScore: 250,
  };

  // Never appears on defeat/gameover
  assert.equal(resolveContextualVictoryNote(configured, 400, 'gameover'), undefined);
  // Never appears below score threshold
  assert.equal(resolveContextualVictoryNote(configured, 180, 'victory'), undefined);
  // Appears only on qualifying victory
  const resolved = resolveContextualVictoryNote(configured, 320, 'victory');
  assert.ok(resolved);
  assert.equal(resolved.nickname, 'Starlight');
  assert.equal(resolved.message, 'Clean sweep on the ceramic board.');

  // Recording a game result updates best score and unlocks trophies
  const { nextState, isNewBest, newlyUnlocked } = recordGameResult(initial, {
    gameId: 'chroma-flip',
    score: 350,
    won: true,
    detail: 'Level 1 · 1 move',
    extraTrophies: ['par-master'],
  });
  assert.equal(isNewBest, true);
  assert.equal(nextState.progress['chroma-flip'].bestScore, 350);
  assert.ok(newlyUnlocked.includes('clean-board'));
  assert.ok(newlyUnlocked.includes('par-master'));
});
