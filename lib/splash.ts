export type SplashStep = "wish" | "gift" | "enter";

export const SPLASH_WISH_DURATION_MS = 4000;
export const SPLASH_SESSION_KEY = "portfolio-festival-splash";
export const SPLASH_REPLAY_EVENT = "portfolio-replay-wish";

export function getNextSplashStep(step: SplashStep): SplashStep | null {
  if (step === "wish") {
    return "gift";
  }

  if (step === "gift") {
    return "enter";
  }

  return null;
}

export function canSkipSplashStep(step: SplashStep): boolean {
  return step === "wish" || step === "gift" || step === "enter";
}

export function shouldAutoAdvanceWish(
  step: SplashStep,
  elapsedMs: number,
  delayMs = SPLASH_WISH_DURATION_MS,
): boolean {
  return step === "wish" && elapsedMs >= delayMs;
}

export function shouldShowSplash({
  hasFestival,
  sessionShown,
  replay = false,
}: {
  hasFestival: boolean;
  sessionShown: boolean;
  replay?: boolean;
}): boolean {
  return hasFestival && (replay || !sessionShown);
}
