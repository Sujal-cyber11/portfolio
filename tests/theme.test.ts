import { describe, expect, it } from "vitest";
import {
  getSelectedThemeChoice,
  isThemeLinkParam,
  preserveThemeParam,
  resolveTheme,
  THEME_AUTO,
  THEME_DEFAULT,
  type ThemeFestivalOption,
} from "@/lib/theme";

const festivals: ThemeFestivalOption[] = [
  { slug: "diwali", name: "Diwali", themeClass: "theme-diwali" },
  { slug: "holi", name: "Holi", themeClass: "theme-holi" },
];

const scheduled = festivals[1];

describe("resolveTheme", () => {
  it("uses a known URL theme before saved and scheduled choices", () => {
    const resolved = resolveTheme({
      urlParam: "diwali",
      storedChoice: "off",
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "diwali",
      themeClass: "theme-diwali",
      source: "url",
      choice: "diwali",
    });
  });

  it("uses URL ?theme=off as the default theme", () => {
    const resolved = resolveTheme({
      urlParam: THEME_DEFAULT,
      storedChoice: "diwali",
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
      storedChoice: "diwali",
      scheduled,
      festivals,
    });

    expect(resolved).toMatchObject({
      slug: "diwali",
      themeClass: "theme-diwali",
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
});

describe("getSelectedThemeChoice", () => {
  it("reflects known URL themes and the default choice", () => {
    expect(getSelectedThemeChoice("diwali", "off", festivals)).toBe("diwali");
    expect(getSelectedThemeChoice(THEME_DEFAULT, "diwali", festivals)).toBe(
      THEME_DEFAULT,
    );
  });

  it("ignores unknown URL values", () => {
    expect(getSelectedThemeChoice("unknown", "holi", festivals)).toBe("holi");
    expect(getSelectedThemeChoice("unknown", null, festivals)).toBe(THEME_AUTO);
  });
});

describe("isThemeLinkParam", () => {
  it("accepts default and known festival slugs", () => {
    expect(isThemeLinkParam(THEME_DEFAULT, festivals)).toBe(true);
    expect(isThemeLinkParam("diwali", festivals)).toBe(true);
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
    expect(preserveThemeParam("/projects", "diwali")).toBe(
      "/projects?theme=diwali",
    );
    expect(preserveThemeParam("/#contact", THEME_DEFAULT)).toBe(
      "/?theme=off#contact",
    );
  });

  it("keeps the current path for hash links", () => {
    expect(preserveThemeParam("#contact", "diwali", "/achievements")).toBe(
      "/achievements?theme=diwali#contact",
    );
  });

  it("preserves other query values and hashes", () => {
    expect(preserveThemeParam("/projects?sort=recent#top", "holi")).toBe(
      "/projects?sort=recent&theme=holi#top",
    );
  });

  it("leaves external links untouched", () => {
    expect(
      preserveThemeParam("https://github.com/Sujal-cyber11", "diwali"),
    ).toBe("https://github.com/Sujal-cyber11");
  });
});
