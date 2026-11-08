"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  playFestivalChime,
  setFestivalSoundEnabled,
} from "@/components/festival/audio/festival-audio";
import { FestivalGift } from "@/components/festival/gift/FestivalGift";
import { useThemeRuntime } from "@/components/theme/ThemeProvider";
import {
  getFestivalSlugFromPathname,
  getStoredThemeChoice,
  getUrlThemeParam,
  subscribeThemeChanges,
} from "@/components/theme/theme-dom";
import {
  findThemeFestival,
  resolveTheme,
  type ThemeFestivalOption,
} from "@/lib/theme";
import {
  getNextSplashStep,
  shouldShowSplash,
  SPLASH_REPLAY_EVENT,
  SPLASH_SESSION_KEY,
  SPLASH_WISH_DURATION_MS,
  type SplashStep,
} from "@/lib/splash";
import styles from "./FestivalSplashHost.module.css";

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);

  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotionSnapshot(): boolean {
  return false;
}

function readSessionShown(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionShown(): void {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
  } catch {
    return;
  }
}

function Rocket(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className={styles.rocketSvg}
      focusable="false"
      viewBox="0 0 120 180"
    >
      <path
        d="M60 8c18 18 26 43 26 70l-12 28H46L34 78C34 51 42 26 60 8Z"
        fill="#f4f6ff"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      <path d="M46 106 28 138l24-6-6-26Z" fill="#ff9933" />
      <path d="m74 106 18 32-24-6 6-26Z" fill="#ff9933" />
      <circle
        cx="60"
        cy="64"
        fill="#67e8f9"
        r="13"
        stroke="#0e7490"
        strokeWidth="3"
      />
      <path
        d="M50 138c2 18 6 27 10 34 4-7 8-16 10-34-4 4-16 4-20 0Z"
        fill="#ffd166"
      />
    </svg>
  );
}

export function FestivalSplashHost({ profileName }: { profileName: string }) {
  const runtime = useThemeRuntime();
  const pathname = usePathname();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const urlParam = useSyncExternalStore(
    subscribeThemeChanges,
    getUrlThemeParam,
    () => null,
  );
  const storedChoice = useSyncExternalStore(
    subscribeThemeChanges,
    getStoredThemeChoice,
    () => null,
  );
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<SplashStep>("wish");
  const [splashFestival, setSplashFestival] =
    useState<ThemeFestivalOption | null>(null);
  const [giftOpened, setGiftOpened] = useState(false);
  const [launching, setLaunching] = useState(false);
  const sessionShownRef = useRef(false);
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const enterRef = useRef<HTMLButtonElement | null>(null);
  const giftRef = useRef<HTMLDivElement | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const launchTimerRef = useRef<number | null>(null);
  const pageFestival = findThemeFestival(
    runtime.festivals,
    getFestivalSlugFromPathname(pathname),
  );
  const resolved = resolveTheme({
    urlParam,
    storedChoice,
    scheduled: runtime.scheduled,
    pageFestival,
    festivals: runtime.festivals,
  });
  const activeFestival = findThemeFestival(runtime.festivals, resolved.slug);
  const isGiftPage = /^\/festival\/[^/]+\/gift\/?$/.test(pathname);

  const showSplash = useCallback((festival: ThemeFestivalOption) => {
    sessionShownRef.current = true;
    markSessionShown();
    setSplashFestival(festival);
    setStep("wish");
    setGiftOpened(false);
    setLaunching(false);
    setVisible(true);
  }, []);

  const dismissSplash = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    if (launchTimerRef.current) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }

    sessionShownRef.current = true;
    markSessionShown();
    setVisible(false);
    setStep("wish");
    setGiftOpened(false);
    setLaunching(false);
  }, []);

  useEffect(() => {
    if (visible || isGiftPage) {
      return;
    }

    if (!activeFestival || !resolved.themeClass) {
      return;
    }

    const sessionShown = sessionShownRef.current || readSessionShown();

    if (
      !shouldShowSplash({
        hasFestival: true,
        sessionShown,
      })
    ) {
      return;
    }

    showSplash(activeFestival);
  }, [activeFestival, isGiftPage, resolved.themeClass, showSplash, visible]);

  useEffect(() => {
    function handleReplay(event: Event): void {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      const festival =
        findThemeFestival(runtime.festivals, detail?.slug ?? null) ??
        activeFestival;

      if (festival) {
        showSplash(festival);
      }
    }

    window.addEventListener(SPLASH_REPLAY_EVENT, handleReplay);

    return () => window.removeEventListener(SPLASH_REPLAY_EVENT, handleReplay);
  }, [activeFestival, runtime.festivals, showSplash]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        dismissSplash();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissSplash, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const siteFrame = document.querySelector(".site-frame");
    const themeBar = document.querySelector("[data-theme-bar]");
    const targets = [siteFrame, themeBar].filter(
      (target): target is HTMLElement => target instanceof HTMLElement,
    );
    const previousOverflow = document.body.style.overflow;

    for (const target of targets) {
      target.setAttribute("inert", "");
    }

    document.body.style.overflow = "hidden";

    return () => {
      for (const target of targets) {
        target.removeAttribute("inert");
      }

      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (step === "wish") {
        continueRef.current?.focus();
      } else if (step === "gift") {
        giftRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      } else {
        enterRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step, visible]);

  useEffect(() => {
    if (!visible || step !== "wish") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStep(reducedMotion ? "enter" : (getNextSplashStep("wish") ?? "gift"));
    }, SPLASH_WISH_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [reducedMotion, step, visible]);

  useEffect(() => {
    if (!visible || step !== "gift" || !giftOpened) {
      return;
    }

    const timer = window.setTimeout(() => {
      revealTimerRef.current = null;
      setStep(getNextSplashStep("gift") ?? "enter");
    }, 1100);
    revealTimerRef.current = timer;

    return () => {
      window.clearTimeout(timer);

      if (revealTimerRef.current === timer) {
        revealTimerRef.current = null;
      }
    };
  }, [giftOpened, step, visible]);

  function advanceFromWish(): void {
    setStep(reducedMotion ? "enter" : (getNextSplashStep("wish") ?? "gift"));
  }

  function handleGiftOpen(): void {
    if (giftOpened) {
      return;
    }

    setGiftOpened(true);
    playFestivalChime();
  }

  function handleEnterChoice(withSound: boolean): void {
    setFestivalSoundEnabled(withSound);
    dismissSplash();
  }

  function handleEnterSite(): void {
    if (launching) {
      return;
    }

    if (reducedMotion) {
      dismissSplash();
      return;
    }

    setLaunching(true);
    const timer = window.setTimeout(() => {
      launchTimerRef.current = null;
      dismissSplash();
    }, 950);
    launchTimerRef.current = timer;
  }

  if (!visible || !splashFestival) {
    return null;
  }

  const festival = splashFestival;
  const splashStyle = {
    "--splash-body": festival.gift.palette.body,
    "--splash-lid": festival.gift.palette.lid,
    "--splash-ribbon": festival.gift.palette.ribbon,
    "--splash-glow": festival.gift.palette.glow,
  } as CSSProperties;

  return (
    <div
      aria-label={`${festival.greeting} festival splash`}
      aria-modal="true"
      className={`${styles.overlay} ${launching ? styles.launching : ""}`}
      role="dialog"
      style={splashStyle}
    >
      <button className={styles.skip} onClick={dismissSplash} type="button">
        Skip
      </button>

      <div className={styles.card}>
        {step === "wish" ? (
          <div className={styles.wish}>
            <span className={styles.emoji} aria-hidden="true">
              {festival.accentEmoji}
            </span>
            <p className={styles.eyebrow}>A festival wish</p>
            <h1 className={styles.title}>{festival.greeting}</h1>
            <p className={styles.message}>
              Sending you warmth, joy and a little festival magic this{" "}
              {festival.name}.
            </p>
            <p className={styles.signoff}>— {profileName}</p>

            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={advanceFromWish}
                ref={continueRef}
                type="button"
              >
                Continue
              </button>
              <button
                className={styles.secondary}
                onClick={() => handleEnterChoice(true)}
                type="button"
              >
                Enter with sound
              </button>
              <button
                className={styles.secondary}
                onClick={() => handleEnterChoice(false)}
                type="button"
              >
                Enter silently
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.giftStep}>
            <div className={styles.gift} ref={giftRef}>
              <FestivalGift
                festivalName={festival.name}
                gift={festival.gift}
                interactive={!reducedMotion}
                onOpen={handleGiftOpen}
                opened={giftOpened || reducedMotion}
              />
            </div>

            {step === "gift" ? (
              <p className={styles.prompt}>Tap to open your gift</p>
            ) : (
              <div className={styles.enterBlock}>
                <p className={styles.closingLine}>
                  {festival.gift.closingLine}
                </p>
                <button
                  className={styles.primary}
                  onClick={handleEnterSite}
                  ref={enterRef}
                  type="button"
                >
                  Enter my portfolio
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {launching ? (
        <div className={styles.rocket}>
          <Rocket />
        </div>
      ) : null}
    </div>
  );
}
