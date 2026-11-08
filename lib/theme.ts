export const THEME_QUERY_PARAM = "theme";
export const THEME_STORAGE_KEY = "portfolio-theme";
export const THEME_AUTO = "auto";
export const THEME_DEFAULT = "off";

export interface ThemeFestivalOption {
  slug: string;
  name: string;
  themeClass: string;
  accentEmoji: string;
}

export type ThemeSource = "url" | "stored" | "schedule" | "default";

export interface ResolvedTheme {
  themeClass: string | null;
  slug: string | null;
  source: ThemeSource;
  choice: string;
}

export interface ResolveThemeInput {
  urlParam: string | null;
  storedChoice: string | null;
  scheduled: ThemeFestivalOption | null;
  festivals: readonly ThemeFestivalOption[];
}

export interface ThemeRuntimeConfig {
  festivals: ThemeFestivalOption[];
  scheduled: ThemeFestivalOption | null;
}

export interface ThemeToggleState {
  visible: boolean;
  festival: ThemeFestivalOption | null;
  checked: boolean;
}

export function findThemeFestival(
  festivals: readonly ThemeFestivalOption[],
  slug: string | null,
): ThemeFestivalOption | null {
  if (!slug) {
    return null;
  }

  return festivals.find((festival) => festival.slug === slug) ?? null;
}

export function resolveTheme({
  urlParam,
  storedChoice,
  scheduled,
  festivals,
}: ResolveThemeInput): ResolvedTheme {
  if (urlParam === THEME_DEFAULT) {
    return {
      themeClass: null,
      slug: null,
      source: "url",
      choice: THEME_DEFAULT,
    };
  }

  const urlFestival = findThemeFestival(festivals, urlParam);

  if (urlFestival) {
    return {
      themeClass: urlFestival.themeClass,
      slug: urlFestival.slug,
      source: "url",
      choice: urlFestival.slug,
    };
  }

  if (storedChoice === THEME_DEFAULT) {
    return {
      themeClass: null,
      slug: null,
      source: "stored",
      choice: THEME_DEFAULT,
    };
  }

  const storedFestival = findThemeFestival(festivals, storedChoice);

  if (storedFestival) {
    return {
      themeClass: storedFestival.themeClass,
      slug: storedFestival.slug,
      source: "stored",
      choice: storedFestival.slug,
    };
  }

  if (scheduled) {
    return {
      themeClass: scheduled.themeClass,
      slug: scheduled.slug,
      source: "schedule",
      choice: THEME_AUTO,
    };
  }

  return {
    themeClass: null,
    slug: null,
    source: "default",
    choice: THEME_AUTO,
  };
}

export function getThemeToggleState({
  urlParam,
  storedChoice,
  scheduled,
  festivals,
}: ResolveThemeInput): ThemeToggleState {
  const previewFestival = findThemeFestival(festivals, urlParam);

  if (!previewFestival && !scheduled) {
    return {
      visible: false,
      festival: null,
      checked: false,
    };
  }

  const resolved = resolveTheme({
    urlParam,
    storedChoice,
    scheduled,
    festivals,
  });
  const resolvedFestival = findThemeFestival(festivals, resolved.slug);
  const festival = resolvedFestival ?? previewFestival ?? scheduled;

  if (!festival) {
    return {
      visible: false,
      festival: null,
      checked: false,
    };
  }

  return {
    visible: true,
    festival,
    checked: resolved.themeClass !== null,
  };
}

export function isThemeLinkParam(
  value: string | null,
  festivals: readonly ThemeFestivalOption[],
): value is string {
  return (
    value === THEME_DEFAULT || findThemeFestival(festivals, value) !== null
  );
}

export function preserveThemeParam(
  href: string,
  themeParam: string | null,
  basePath = "/",
): string {
  if (!themeParam) {
    return href;
  }

  if (!href.startsWith("/") && !href.startsWith("#") && !href.startsWith("?")) {
    return href;
  }

  const base = new URL(
    `https://themed-link.invalid${basePath.startsWith("/") ? basePath : `/${basePath}`}`,
  );
  const url = new URL(href, base);
  url.searchParams.set(THEME_QUERY_PARAM, themeParam);

  return `${url.pathname}${url.search}${url.hash}`;
}
