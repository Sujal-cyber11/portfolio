import { describe, expect, it } from "vitest";
import { filterVisibleEntries, shouldShowEntry } from "@/lib/content-filter";

const entries = [
  { id: "real", placeholder: false },
  { id: "sample", placeholder: true },
  { id: "legacy" },
];

describe("placeholder filtering", () => {
  it("hides placeholder entries in production", () => {
    const visible = filterVisibleEntries(entries, true);

    expect(visible.map((entry) => entry.id)).toEqual(["real", "legacy"]);
  });

  it("shows placeholder entries during local development", () => {
    const visible = filterVisibleEntries(entries, false);

    expect(visible.map((entry) => entry.id)).toEqual([
      "real",
      "sample",
      "legacy",
    ]);
  });

  it("only hides entries explicitly marked as placeholders", () => {
    expect(shouldShowEntry({ placeholder: true }, true)).toBe(false);
    expect(shouldShowEntry({ placeholder: false }, true)).toBe(true);
    expect(shouldShowEntry({}, true)).toBe(true);
    expect(shouldShowEntry({ placeholder: true }, false)).toBe(true);
  });
});
