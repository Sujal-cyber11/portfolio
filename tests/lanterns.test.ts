import { describe, expect, it } from "vitest";
import {
  getWindForce,
  INTERACTIVE_SELECTOR,
  isInteractivePointerTarget,
  isLanternHit,
  recordLanternBurst,
} from "@/lib/lanterns";

const bounds = { x: 100, y: 200, width: 40, height: 60 };

describe("isLanternHit", () => {
  it("detects a pointer inside the lantern bounds", () => {
    expect(isLanternHit({ x: 100, y: 200 }, bounds)).toBe(true);
    expect(isLanternHit({ x: 119, y: 229 }, bounds)).toBe(true);
  });

  it("rejects a pointer outside the lantern bounds", () => {
    expect(isLanternHit({ x: 121, y: 200 }, bounds)).toBe(false);
    expect(isLanternHit({ x: 100, y: 231 }, bounds)).toBe(false);
  });

  it("allows a small tolerance around the bounds", () => {
    expect(isLanternHit({ x: 126, y: 200 }, bounds, 6)).toBe(true);
    expect(isLanternHit({ x: 127, y: 200 }, bounds, 6)).toBe(false);
    expect(isLanternHit({ x: 100, y: 236 }, bounds, 6)).toBe(true);
  });
});

describe("getWindForce", () => {
  it("falls off smoothly with distance", () => {
    const close = getWindForce({ x: 100, y: 200 }, { x: 160, y: 200 }, 120);
    const far = getWindForce({ x: 100, y: 200 }, { x: 190, y: 200 }, 120);

    expect(close.x).toBeCloseTo(1);
    expect(close.y).toBeCloseTo(0);
    expect(close.strength).toBeGreaterThan(far.strength);
    expect(far.strength).toBeGreaterThan(0);
  });

  it("returns no force at the radius or beyond", () => {
    expect(getWindForce({ x: 0, y: 0 }, { x: 120, y: 0 }, 120)).toEqual({
      x: 0,
      y: 0,
      strength: 0,
    });
    expect(getWindForce({ x: 0, y: 0 }, { x: 200, y: 0 }, 120)).toEqual({
      x: 0,
      y: 0,
      strength: 0,
    });
  });

  it("points away from the pointer", () => {
    const force = getWindForce({ x: 100, y: 100 }, { x: 0, y: 100 }, 120);

    expect(force.x).toBeCloseTo(-1);
    expect(force.y).toBeCloseTo(0);
  });
});

describe("isInteractivePointerTarget", () => {
  it("ignores interactive ancestors", () => {
    let captured = "";
    const target = {
      closest(selector: string) {
        captured = selector;
        return {};
      },
    };

    expect(isInteractivePointerTarget(target)).toBe(true);
    expect(captured).toBe(INTERACTIVE_SELECTOR);
    expect(captured).toContain("a");
    expect(captured).toContain("button");
    expect(captured).toContain('[role="button"]');
    expect(captured).toContain('[role="link"]');
  });

  it("does not ignore non-interactive targets", () => {
    expect(isInteractivePointerTarget({ closest: () => null })).toBe(false);
    expect(isInteractivePointerTarget(null)).toBe(false);
    expect(isInteractivePointerTarget("body")).toBe(false);
  });
});

describe("recordLanternBurst", () => {
  it("triggers the easter egg on the tenth burst and resets", () => {
    let count = 0;

    for (let burst = 1; burst < 10; burst += 1) {
      const result = recordLanternBurst(count);
      count = result.count;
      expect(result.triggered).toBe(false);
    }

    const tenth = recordLanternBurst(count);

    expect(tenth.triggered).toBe(true);
    expect(tenth.count).toBe(0);
  });

  it("starts counting again after the reset", () => {
    expect(recordLanternBurst(0).count).toBe(1);
    expect(recordLanternBurst(8)).toEqual({ count: 9, triggered: false });
    expect(recordLanternBurst(9)).toEqual({ count: 0, triggered: true });
  });
});
