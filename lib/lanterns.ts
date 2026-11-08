export interface Point {
  x: number;
  y: number;
}

export interface LanternBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindForce {
  x: number;
  y: number;
  strength: number;
}

export interface LanternWindState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const MAX_LANTERN_WIND_SPEED = 180;
export const POINTER_MOVE_THRESHOLD = 2;
export const WIND_ACTIVE_WINDOW_MS = 120;
export const MAX_DELTA_SECONDS = 1 / 30;
export const WIND_DAMPING_PER_FRAME = 0.92;

const WIND_ACCELERATION = 900;
const WIND_SPRING = 4.5;
const WIND_SUBSTEP_SECONDS = 1 / 240;

export interface BurstCounterResult {
  count: number;
  triggered: boolean;
}

export const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, summary, [role="button"], [role="link"]';

export function isLanternHit(
  pointer: Point,
  bounds: LanternBounds,
  tolerance = 0,
): boolean {
  const halfWidth = bounds.width / 2 + tolerance;
  const halfHeight = bounds.height / 2 + tolerance;

  return (
    Math.abs(pointer.x - bounds.x) <= halfWidth &&
    Math.abs(pointer.y - bounds.y) <= halfHeight
  );
}

export function getWindForce(
  pointer: Point,
  center: Point,
  radius = 120,
): WindForce {
  const dx = center.x - pointer.x;
  const dy = center.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= 0.001 || distance >= radius) {
    return { x: 0, y: 0, strength: 0 };
  }

  const falloff = 1 - distance / radius;

  return {
    x: dx / distance,
    y: dy / distance,
    strength: falloff * falloff,
  };
}

export function pointerMovementExceedsThreshold(
  previous: Point,
  next: Point,
  threshold = POINTER_MOVE_THRESHOLD,
): boolean {
  return Math.hypot(next.x - previous.x, next.y - previous.y) >= threshold;
}

export function isWindWindowActive(
  now: number,
  lastMovementAt: number,
  active = true,
): boolean {
  return active && now - lastMovementAt <= WIND_ACTIVE_WINDOW_MS;
}

export function stepLanternWind(
  state: LanternWindState,
  force: WindForce,
  deltaSeconds: number,
): LanternWindState {
  const delta = Math.min(Math.max(deltaSeconds, 0), MAX_DELTA_SECONDS);

  if (delta === 0) {
    return state;
  }

  let remaining = delta;

  while (remaining > 0) {
    const step = Math.min(WIND_SUBSTEP_SECONDS, remaining);
    const damping = Math.pow(WIND_DAMPING_PER_FRAME, step * 60);

    state.vx =
      (state.vx + force.x * force.strength * WIND_ACCELERATION * step) *
      damping;
    state.vy =
      (state.vy + force.y * force.strength * WIND_ACCELERATION * step) *
      damping;
    state.vx += -state.x * WIND_SPRING * step;
    state.vy += -state.y * WIND_SPRING * step;

    const speed = Math.hypot(state.vx, state.vy);

    if (speed > MAX_LANTERN_WIND_SPEED) {
      const scale = MAX_LANTERN_WIND_SPEED / speed;
      state.vx *= scale;
      state.vy *= scale;
    }

    state.x += state.vx * step;
    state.y += state.vy * step;
    remaining -= step;
  }

  return state;
}

export function recordLanternBurst(
  count: number,
  threshold = 10,
): BurstCounterResult {
  const nextCount = count + 1;

  if (nextCount >= threshold) {
    return { count: 0, triggered: true };
  }

  return { count: nextCount, triggered: false };
}

function hasClosest(
  target: unknown,
): target is { closest(selector: string): unknown } {
  if (typeof target !== "object" || target === null) {
    return false;
  }

  return (
    "closest" in target &&
    typeof (target as { closest?: unknown }).closest === "function"
  );
}

export function isInteractivePointerTarget(target: unknown): boolean {
  if (!hasClosest(target)) {
    return false;
  }

  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}
