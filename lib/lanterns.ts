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
