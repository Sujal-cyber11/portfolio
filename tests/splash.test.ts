import { describe, expect, it } from "vitest";
import { sanitizeRecipientName } from "@/lib/sanitize";
import {
  canSkipSplashStep,
  getNextSplashStep,
  shouldAutoAdvanceWish,
  shouldShowSplash,
  SPLASH_WISH_DURATION_MS,
  type SplashStep,
} from "@/lib/splash";

const steps: SplashStep[] = ["wish", "gift", "enter"];

describe("splash step sequence", () => {
  it("moves wish to gift to enter and then finishes", () => {
    expect(getNextSplashStep("wish")).toBe("gift");
    expect(getNextSplashStep("gift")).toBe("enter");
    expect(getNextSplashStep("enter")).toBeNull();
  });

  it("allows skipping from every step", () => {
    for (const step of steps) {
      expect(canSkipSplashStep(step)).toBe(true);
    }
  });

  it("auto-advances only the wish step after four seconds", () => {
    expect(shouldAutoAdvanceWish("wish", SPLASH_WISH_DURATION_MS - 1)).toBe(
      false,
    );
    expect(shouldAutoAdvanceWish("wish", SPLASH_WISH_DURATION_MS)).toBe(true);
  });

  it("never auto-dismisses while the gift is waiting", () => {
    expect(shouldAutoAdvanceWish("gift", 0)).toBe(false);
    expect(shouldAutoAdvanceWish("gift", 60_000)).toBe(false);
    expect(shouldAutoAdvanceWish("enter", 60_000)).toBe(false);
  });
});

describe("splash session state", () => {
  it("shows once per session unless explicitly replayed", () => {
    expect(shouldShowSplash({ hasFestival: true, sessionShown: false })).toBe(
      true,
    );
    expect(shouldShowSplash({ hasFestival: true, sessionShown: true })).toBe(
      false,
    );
    expect(
      shouldShowSplash({
        hasFestival: true,
        sessionShown: true,
        replay: true,
      }),
    ).toBe(true);
    expect(shouldShowSplash({ hasFestival: false, sessionShown: false })).toBe(
      false,
    );
  });
});

describe("sanitizeRecipientName", () => {
  it("strips markup, control characters and extra whitespace", () => {
    expect(sanitizeRecipientName("  <b>Asha</b>\n  Devi  ")).toBe("Asha Devi");
    expect(sanitizeRecipientName("   ")).toBeNull();
    expect(sanitizeRecipientName(undefined)).toBeNull();
  });

  it("caps the recipient name length", () => {
    expect(sanitizeRecipientName("a".repeat(80))).toHaveLength(60);
  });
});
