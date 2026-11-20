export type HazardKind = 'cloud' | 'swooper' | 'gust';

export interface DriftPlayer {
  x: number;
  y: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  tilt: number;
}

export interface DriftLantern {
  id: number;
  x: number;
  y: number;
  baseY: number;
  phase: number;
  radius: number;
  collected: boolean;
}

export interface DriftHazard {
  id: number;
  kind: HazardKind;
  x: number;
  y: number;
  baseY: number;
  vx: number;
  radius: number;
  phase: number;
  telegraph: number;
}

export interface DriftSimulation {
  width: number;
  height: number;
  elapsed: number;
  score: number;
  distance: number;
  combo: number;
  maxCombo: number;
  lanternsCollected: number;
  hitstop: number;
  trauma: number;
  spawnTimer: number;
  lanternTimer: number;
  nextId: number;
  player: DriftPlayer;
  lanterns: DriftLantern[];
  hazards: DriftHazard[];
  over: boolean;
}

export function createDriftSimulation(width = 960, height = 540): DriftSimulation {
  return {
    width,
    height,
    elapsed: 0,
    score: 0,
    distance: 0,
    combo: 0,
    maxCombo: 0,
    lanternsCollected: 0,
    hitstop: 0,
    trauma: 0,
    spawnTimer: 1.4,
    lanternTimer: 0.9,
    nextId: 1,
    player: {
      x: width * 0.18,
      y: height * 0.48,
      vy: 0,
      radius: 17,
      hp: 3,
      maxHp: 3,
      invulnTimer: 0,
      tilt: 0,
    },
    lanterns: [
      {
        id: 1,
        x: width * 0.58,
        y: height * 0.42,
        baseY: height * 0.42,
        phase: 0.4,
        radius: 15,
        collected: false,
      },
      {
        id: 2,
        x: width * 0.82,
        y: height * 0.56,
        baseY: height * 0.56,
        phase: 2.1,
        radius: 15,
        collected: false,
      },
    ],
    hazards: [],
    over: false,
  };
}

export function computeDifficultySpeed(elapsed: number): number {
  // Smooth ramp over 90 seconds from approachable 215px/s up to 410px/s
  return Math.min(410, 215 + elapsed * 2.2);
}

export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const distSq = dx * dx + dy * dy;
  const radSum = ar + br;
  return distSq <= radSum * radSum;
}

export interface DriftStepEvents {
  collectedLantern: boolean;
  hitHazard: boolean;
  gameOver: boolean;
}

export function stepDriftSimulation(
  sim: DriftSimulation,
  rawDt: number,
  input: { up: boolean; down: boolean; targetY: number | null },
  rng: () => number = Math.random
): DriftStepEvents {
  const events: DriftStepEvents = {
    collectedLantern: false,
    hitHazard: false,
    gameOver: false,
  };

  if (sim.over) return events;

  const dt = Math.min(rawDt, 0.05);
  sim.trauma = Math.max(0, sim.trauma - dt * 1.9);

  if (sim.hitstop > 0) {
    sim.hitstop = Math.max(0, sim.hitstop - dt);
    return events;
  }

  sim.elapsed += dt;
  const scrollSpeed = computeDifficultySpeed(sim.elapsed);
  sim.distance += scrollSpeed * dt * 0.05;
  sim.score += dt * 12;

  const p = sim.player;
  if (p.invulnTimer > 0) {
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  }

  // Responsive steering: keyboard or pointer target
  const maxSpeed = 370;
  if (input.up && !input.down) {
    p.vy += (-maxSpeed - p.vy) * Math.min(1, dt * 11);
  } else if (input.down && !input.up) {
    p.vy += (maxSpeed - p.vy) * Math.min(1, dt * 11);
  } else if (input.targetY !== null) {
    const diff = input.targetY - p.y;
    const desiredVy = Math.max(-maxSpeed, Math.min(maxSpeed, diff * 7.5));
    p.vy += (desiredVy - p.vy) * Math.min(1, dt * 12);
  } else {
    p.vy *= Math.exp(-dt * 8.5);
  }

  p.y += p.vy * dt;
  const margin = 42;
  if (p.y < margin) {
    p.y = margin;
    p.vy = 0;
  } else if (p.y > sim.height - margin) {
    p.y = sim.height - margin;
    p.vy = 0;
  }
  p.tilt = Math.max(-0.34, Math.min(0.34, p.vy / 820));

  // Spawn lanterns
  sim.lanternTimer -= dt;
  if (sim.lanternTimer <= 0) {
    const y = 72 + rng() * (sim.height - 144);
    sim.lanterns.push({
      id: sim.nextId++,
      x: sim.width + 40,
      y,
      baseY: y,
      phase: rng() * Math.PI * 2,
      radius: 15,
      collected: false,
    });
    sim.lanternTimer = Math.max(0.75, 1.35 - sim.elapsed * 0.005);
  }

  // Spawn hazards (3 distinct movement policies)
  sim.spawnTimer -= dt;
  if (sim.spawnTimer <= 0) {
    const roll = rng();
    let kind: HazardKind = 'cloud';
    if (sim.elapsed > 8 && roll > 0.68) {
      kind = 'gust';
    } else if (sim.elapsed > 3 && roll > 0.36) {
      kind = 'swooper';
    }

    const y = 66 + rng() * (sim.height - 132);
    const speedMult = kind === 'gust' ? 1.48 : kind === 'swooper' ? 1.08 : 0.92;
    sim.hazards.push({
      id: sim.nextId++,
      kind,
      x: sim.width + 64,
      y,
      baseY: y,
      vx: scrollSpeed * speedMult,
      radius: kind === 'cloud' ? 25 : kind === 'swooper' ? 19 : 16,
      phase: rng() * Math.PI * 2,
      telegraph: kind === 'gust' ? 0.55 : 0,
    });

    const interval = Math.max(0.62, 1.55 - sim.elapsed * 0.012);
    sim.spawnTimer = interval;
  }

  // Update lanterns
  for (const l of sim.lanterns) {
    l.x -= scrollSpeed * 0.9 * dt;
    l.y = l.baseY + Math.sin(sim.elapsed * 2.8 + l.phase) * 14;
    if (!l.collected && circlesOverlap(p.x, p.y, p.radius, l.x, l.y, l.radius)) {
      l.collected = true;
      sim.lanternsCollected += 1;
      sim.combo += 1;
      sim.maxCombo = Math.max(sim.maxCombo, sim.combo);
      sim.score += 35 + Math.min(60, (sim.combo - 1) * 10);
      events.collectedLantern = true;
    }
  }
  sim.lanterns = sim.lanterns.filter((l) => !l.collected && l.x > -50);

  // Update hazards
  for (const h of sim.hazards) {
    if (h.telegraph > 0) {
      h.telegraph = Math.max(0, h.telegraph - dt);
      h.x = sim.width - 28;
    } else {
      h.x -= h.vx * dt;
      if (h.kind === 'swooper') {
        h.y = h.baseY + Math.sin(sim.elapsed * 3.4 + h.phase) * 52;
      }
    }

    if (
      p.invulnTimer <= 0 &&
      h.telegraph <= 0 &&
      circlesOverlap(p.x, p.y, p.radius - 2, h.x, h.y, h.radius - 2)
    ) {
      p.hp -= 1;
      p.invulnTimer = 1.25;
      sim.combo = 0;
      sim.hitstop = 0.055;
      sim.trauma = 0.72;
      events.hitHazard = true;
      if (p.hp <= 0) {
        sim.over = true;
        events.gameOver = true;
      }
    }
  }
  sim.hazards = sim.hazards.filter((h) => h.x > -80);

  return events;
}
