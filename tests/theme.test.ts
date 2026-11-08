import { describe, expect, it } from "vitest";
import {
  getThemeToggleState,
  isThemeLinkParam,
  preserveThemeParam,
  resolveTheme,
  THEME_AUTO,
  THEME_DEFAULT,
  type ThemeFestivalOption,
} from "@/lib/theme";

const gift = {
  type: "wrapped" as const,
  closingLine: "Wishing you joy.",
  palette: {
    body: "#ff9933",
    lid: "#ffd166",
    ribbon: "#c92b1d",
    glow: "#ffb347",
  },
};

const festivals: ThemeFestivalOption[] = [
  {
    slug: "new-year",
    name: "New Year",
    themeClass: "theme-new-year",
    accentEmoji: "🎆",
    greeting: "Happy New Year",
    gift,
  },
  {
    slug: "holi",
    name: "Holi",
    themeClass: "theme-holi",
    accentEmoji: "🎨",
    greeting: "Happy Holi",
    gift,
  },
];

const scheduled = festivals[1];

describe("resolveTheme", () => {
  it("uses a known URL theme before saved and scheduled choices", () => {
    const resolved = resolveTheme({
      urlParam: "new-year",
      storedChoice: "off",
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "new-year",
      themeClass: "theme-new-year",
      source: "url",
      choice: "new-year",
    });
  });

  it("uses URL ?theme=off as the default theme", () => {
    const resolved = resolveTheme({
      urlParam: THEME_DEFAULT,
      storedChoice: "new-year",
      scheduled,
      festivals,
    });

    expect(resolved.themeClass).toBeNull();
    expect(resolved.source).toBe("url");
    expect(resolved.choice).toBe(THEME_DEFAULT);
  });

  it("ignores an unknown URL slug and falls through to the stored choice", () => {
    const resolved = resolveTheme({
      urlParam: "not-a-festival",
      storedChoice: "new-year",
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "new-year",
      themeClass: "theme-new-year",
      source: "stored",
    });
  });

  it("ignores an unknown URL slug and falls through to the schedule", () => {
    const resolved = resolveTheme({
      urlParam: "not-a-festival",
      storedChoice: null,
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "holi",
      themeClass: "theme-holi",
      source: "schedule",
      choice: THEME_AUTO,
    });
  });

  it("uses a saved default choice before the scheduled festival", () => {
    const resolved = resolveTheme({
      urlParam: null,
      storedChoice: THEME_DEFAULT,
      scheduled,
      festivals,
    });

    expect(resolved.themeClass).toBeNull();
    expect(resolved.source).toBe("stored");
    expect(resolved.choice).toBe(THEME_DEFAULT);
  });

  it("treats a saved auto choice as the scheduled festival", () => {
    const resolved = resolveTheme({
      urlParam: null,
      storedChoice: THEME_AUTO,
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "holi",
      themeClass: "theme-holi",
      source: "schedule",
    });
  });

  it("falls back from schedule to the default theme", () => {
    const resolved = resolveTheme({
      urlParam: null,
      storedChoice: null,
      scheduled: null,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: null,
      themeClass: null,
      source: "default",
      choice: THEME_AUTO,
    });
  });

  it("ignores unknown saved choices", () => {
    const resolved = resolveTheme({
      urlParam: null,
      storedChoice: "deleted-festival",
      scheduled,
      festivals,
    });

    expect(resolved.slug).toBe("holi");
    expect(resolved.source).toBe("schedule");
  });

  it("uses the page festival when nothing overrides it", () => {
    const resolved = resolveTheme({
      urlParam: null,
      storedChoice: null,
      scheduled,
      pageFestival: festivals[0],
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "new-year",
      source: "page",
    });
  });

  it("lets URL off and saved off disable a page festival", () => {
    expect(
      resolveTheme({
        urlParam: THEME_DEFAULT,
        storedChoice: null,
        scheduled: null,
        pageFestival: festivals[0],
        festivals,
      }).themeClass,
    ).toBeNull();

    expect(
      resolveTheme({
        urlParam: null,
        storedChoice: THEME_DEFAULT,
        scheduled: null,
        pageFestival: festivals[0],
        festivals,
      }).themeClass,
    ).toBeNull();
  });
});

describe("getThemeToggleState", () => {
  it("hides the toggle when there is no scheduled or previewed festival", () => {
    const state = getThemeToggleState({
      urlParam: null,
      storedChoice: null,
      scheduled: null,
      festivals,
    });

    expect(state).toEqual({
      visible: false,
      festival: null,
      checked: false,
    });
  });

  it("shows the scheduled festival as checked", () => {
    const state = getThemeToggleState({
      urlParam: null,
      storedChoice: null,
      scheduled,
      festivals,
    });

    expect(state.visible).toBe(true);
    expect(state.checked).toBe(true);
    expect(state.festival?.slug).toBe("holi");
  });

  it("shows a URL-previewed festival without a scheduled festival", () => {
    const state = getThemeToggleState({
      urlParam: "new-year",
      storedChoice: null,
      scheduled: null,
      festivals,
    });

    expect(state.visible).toBe(true);
    expect(state.checked).toBe(true);
    expect(state.festival?.slug).toBe("new-year");
  });

  it("shows the scheduled festival unchecked when the URL disables themes", () => {
    const state = getThemeToggleState({
      urlParam: THEME_DEFAULT,
      storedChoice: null,
      scheduled,
      festivals,
    });

    expect(state.visible).toBe(true);
    expect(state.checked).toBe(false);
    expect(state.festival?.slug).toBe("holi");
  });

  it("uses the saved festival choice over the schedule", () => {
    const state = getThemeToggleState({
      urlParam: null,
      storedChoice: "new-year",
      scheduled,
      festivals,
    });

    expect(state.visible).toBe(true);
    expect(state.checked).toBe(true);
    expect(state.festival?.slug).toBe("new-year");
  });

  it("lets a URL preview override the scheduled label", () => {
    const state = getThemeToggleState({
      urlParam: "new-year",
      storedChoice: THEME_DEFAULT,
      scheduled,
      festivals,
    });

    expect(state.visible).toBe(true);
    expect(state.checked).toBe(true);
    expect(state.festival?.slug).toBe("new-year");
  });

  it("ignores unknown URL slugs for visibility", () => {
    const state = getThemeToggleState({
      urlParam: "unknown",
      storedChoice: null,
      scheduled: null,
      festivals,
    });

    expect(state.visible).toBe(false);
  });

  it("hides when only a saved festival exists without a live context", () => {
    const state = getThemeToggleState({
      urlParam: null,
      storedChoice: "new-year",
      scheduled: null,
      festivals,
    });

    expect(state.visible).toBe(false);
  });

  it("shows the toggle on a festival page and allows turning it off", () => {
    const on = getThemeToggleState({
      urlParam: null,
      storedChoice: null,
      scheduled: null,
      pageFestival: festivals[0],
      festivals,
    });

    expect(on.visible).toBe(true);
    expect(on.checked).toBe(true);
    expect(on.festival?.slug).toBe("new-year");

    const off = getThemeToggleState({
      urlParam: THEME_DEFAULT,
      storedChoice: null,
      scheduled: null,
      pageFestival: festivals[0],
      festivals,
    });

    expect(off.visible).toBe(true);
    expect(off.checked).toBe(false);
    expect(off.festival?.slug).toBe("new-year");
  });
});

describe("isThemeLinkParam", () => {
  it("accepts default and known festival slugs", () => {
    expect(isThemeLinkParam(THEME_DEFAULT, festivals)).toBe(true);
    expect(isThemeLinkParam("new-year", festivals)).toBe(true);
  });

  it("rejects auto, missing and unknown values", () => {
    expect(isThemeLinkParam(THEME_AUTO, festivals)).toBe(false);
    expect(isThemeLinkParam(null, festivals)).toBe(false);
    expect(isThemeLinkParam("unknown", festivals)).toBe(false);
  });
});

describe("ThemedLink param preservation", () => {
  it("does nothing in Auto mode", () => {
    expect(preserveThemeParam("/projects", null)).toBe("/projects");
  });

  it("appends a manual theme to internal links", () => {
    expect(preserveThemeParam("/projects", "new-year")).toBe(
      "/projects?theme=new-year",
    );
    expect(preserveThemeParam("/#contact", THEME_DEFAULT)).toBe(
      "/?theme=off#contact",
    );
  });

  it("keeps the current path for hash links", () => {
    expect(preserveThemeParam("#contact", "new-year", "/achievements")).toBe(
      "/achievements?theme=new-year#contact",
    );
  });

  it("preserves other query values and hashes", () => {
    expect(preserveThemeParam("/projects?sort=recent#top", "holi")).toBe(
      "/projects?sort=recent&theme=holi#top",
    );
  });

  it("leaves external links untouched", () => {
    expect(
      preserveThemeParam("https://github.com/Sujal-cyber11", "new-year"),
    ).toBe("https://github.com/Sujal-cyber11");
  });
});
