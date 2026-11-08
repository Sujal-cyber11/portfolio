import {
  findThemeFestival,
  resolveTheme,
  THEME_AUTO,
  THEME_DEFAULT,
  THEME_QUERY_PARAM,
  THEME_STORAGE_KEY,
  type ThemeRuntimeConfig,
} from "@/lib/theme";

export const THEME_CHANGE_EVENT = "portfolio-theme-change";

const festivalPathPattern = /^\/festival\/([a-z0-9-]+)\/?$/;

export function getFestivalSlugFromPathname(pathname: string): string | null {
  const match = festivalPathPattern.exec(pathname);
  return match?.[1] ?? null;
}

export function subscribeThemeChanges(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener("popstate", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export function getUrlThemeParam(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(THEME_QUERY_PARAM);
}

export function getStoredThemeChoice(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getFestivalSlugFromPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getFestivalSlugFromPathname(window.location.pathname);
}

export function applyThemeClass(themeClass: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  for (const className of Array.from(root.classList)) {
    if (className.startsWith("theme-")) {
      root.classList.remove(className);
    }
  }

  if (themeClass) {
    root.classList.add(themeClass);
  }
}

export function applyResolvedTheme(
  runtime: ThemeRuntimeConfig,
  urlParam: string | null,
  storedChoice: string | null,
  pathname: string | null = null,
): void {
  const pathSlug = pathname
    ? getFestivalSlugFromPathname(pathname)
    : getFestivalSlugFromPath();
  const pageFestival = findThemeFestival(runtime.festivals, pathSlug);
  const resolved = resolveTheme({
    urlParam,
    storedChoice,
    scheduled: runtime.scheduled,
    pageFestival,
    festivals: runtime.festivals,
  });

  applyThemeClass(resolved.themeClass);
}

function writeThemeParam(value: string | null): void {
  const url = new URL(window.location.href);

  if (value === null) {
    url.searchParams.delete(THEME_QUERY_PARAM);
  } else {
    url.searchParams.set(THEME_QUERY_PARAM, value);
  }

  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function storeThemeChoice(choice: string): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    return;
  }
}

export function selectThemeChoice(
  choice: string,
  runtime: ThemeRuntimeConfig,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const knownChoice =
    choice === THEME_AUTO ||
    choice === THEME_DEFAULT ||
    findThemeFestival(runtime.festivals, choice) !== null;

  const nextChoice = knownChoice ? choice : THEME_AUTO;

  writeThemeParam(nextChoice === THEME_AUTO ? null : nextChoice);
  storeThemeChoice(nextChoice);
  applyResolvedTheme(runtime, getUrlThemeParam(), getStoredThemeChoice());
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
