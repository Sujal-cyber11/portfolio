import { describe, expect, it } from "vitest";
import { getActiveFestival } from "@/lib/festival";
import type { Festival } from "@/lib/schema";

type FestivalInput = Partial<Festival> &
  Pick<Festival, "id" | "name" | "slug" | "windows">;

function makeFestival(input: FestivalInput): Festival {
  return {
    recurringYearly: false,
    priority: 0,
    themeClass: `theme-${input.slug}`,
    greeting: `Happy ${input.name}`,
    accentEmoji: "*",
    enabled: true,
    ...input,
  };
}

describe("getActiveFestival", () => {
  it("includes both window edges and excludes adjacent days", () => {
    const festival = makeFestival({
      id: "test",
      name: "Test",
      slug: "test",
      windows: [{ start: "2026-01-10", end: "2026-01-12" }],
    });

    expect(
      getActiveFestival(new Date("2026-01-10T00:00:00+05:30"), [festival]),
    ).toBe(festival);
    expect(
      getActiveFestival(new Date("2026-01-12T23:59:59+05:30"), [festival]),
    ).toBe(festival);
    expect(
      getActiveFestival(new Date("2026-01-09T23:59:59+05:30"), [festival]),
    ).toBeNull();
    expect(
      getActiveFestival(new Date("2026-01-13T00:00:00+05:30"), [festival]),
    ).toBeNull();
  });

  it("handles a December-to-January window and yearly rollover", () => {
    const festival = makeFestival({
      id: "new-year",
      name: "New Year",
      slug: "new-year",
      windows: [{ start: "2026-12-28", end: "2027-01-03" }],
      recurringYearly: true,
    });

    expect(
      getActiveFestival(new Date("2026-12-30T12:00:00+05:30"), [festival]),
    ).toBe(festival);
    expect(
      getActiveFestival(new Date("2027-01-02T12:00:00+05:30"), [festival]),
    ).toBe(festival);
    expect(
      getActiveFestival(new Date("2025-12-30T12:00:00+05:30"), [festival]),
    ).toBe(festival);
    expect(
      getActiveFestival(new Date("2027-01-04T12:00:00+05:30"), [festival]),
    ).toBeNull();
  });

  it("resolves overlaps by priority", () => {
    const low = makeFestival({
      id: "low",
      name: "Low",
      slug: "low",
      windows: [{ start: "2026-05-01", end: "2026-05-05" }],
      priority: 10,
    });
    const high = makeFestival({
      id: "high",
      name: "High",
      slug: "high",
      windows: [{ start: "2026-05-02", end: "2026-05-04" }],
      priority: 20,
    });

    expect(
      getActiveFestival(new Date("2026-05-03T12:00:00+05:30"), [low, high]),
    ).toBe(high);
    expect(
      getActiveFestival(new Date("2026-05-01T12:00:00+05:30"), [low, high]),
    ).toBe(low);
  });

  it("ignores disabled festivals", () => {
    const disabled = makeFestival({
      id: "disabled",
      name: "Disabled",
      slug: "disabled",
      windows: [{ start: "2026-06-01", end: "2026-06-02" }],
      priority: 100,
      enabled: false,
    });

    expect(
      getActiveFestival(new Date("2026-06-01T12:00:00+05:30"), [disabled]),
    ).toBeNull();
  });

  it("uses Asia/Kolkata for date checks", () => {
    const republicDay = makeFestival({
      id: "republic-day",
      name: "Republic Day",
      slug: "republic-day",
      windows: [{ start: "2026-01-26", end: "2026-01-26" }],
    });

    expect(
      getActiveFestival(new Date("2026-01-25T18:40:00Z"), [republicDay]),
    ).toBe(republicDay);
    expect(
      getActiveFestival(new Date("2026-01-25T18:20:00Z"), [republicDay]),
    ).toBeNull();
  });

  it("supports multiple explicit windows for movable festivals", () => {
    const movable = makeFestival({
      id: "movable",
      name: "Movable",
      slug: "movable",
      windows: [
        { start: "2026-03-03", end: "2026-03-04" },
        { start: "2027-03-20", end: "2027-03-21" },
      ],
    });

    expect(
      getActiveFestival(new Date("2027-03-20T12:00:00+05:30"), [movable]),
    ).toBe(movable);
    expect(
      getActiveFestival(new Date("2027-03-03T12:00:00+05:30"), [movable]),
    ).toBeNull();
  });
});
