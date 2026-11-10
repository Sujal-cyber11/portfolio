import { afterEach, describe, expect, it, vi } from "vitest";
import {
  groupProjectsByCategory,
  selectFeaturedProjects,
  type ProjectView,
} from "@/lib/projects";

function project(
  overrides: Partial<ProjectView> &
    Pick<ProjectView, "id" | "description" | "pushedAt">,
): ProjectView {
  const category =
    overrides.category ?? (overrides.featured ? "featured" : "discovered");

  return {
    title: overrides.id,
    tags: [],
    date: "2026-01-01",
    status: "done",
    repoName: overrides.id,
    stars: 0,
    language: null,
    ...overrides,
    category,
    featured: overrides.featured ?? category === "featured",
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("groupProjectsByCategory", () => {
  it("places each project in exactly one section and keeps the input order", () => {
    const entries = [
      project({
        id: "featured-new",
        description: "Featured.",
        pushedAt: "2026-04-01T00:00:00Z",
        featured: true,
      }),
      project({
        id: "experiment",
        description: "Experiment.",
        pushedAt: "2026-03-01T00:00:00Z",
        category: "experiment",
      }),
      project({
        id: "discovered",
        description: "Discovered.",
        pushedAt: "2026-02-01T00:00:00Z",
      }),
      project({
        id: "featured-no-description",
        description: "",
        pushedAt: "2026-01-01T00:00:00Z",
        featured: true,
      }),
    ];

    const groups = groupProjectsByCategory(entries);

    expect(groups.featured.map((entry) => entry.id)).toEqual([
      "featured-new",
      "featured-no-description",
    ]);
    expect(groups.experiment.map((entry) => entry.id)).toEqual(["experiment"]);
    expect(groups.discovered.map((entry) => entry.id)).toEqual(["discovered"]);
    expect(
      groups.featured.length +
        groups.experiment.length +
        groups.discovered.length,
    ).toBe(entries.length);
  });
});

describe("selectFeaturedProjects", () => {
  it("uses featured projects with descriptions", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const explicit = project({
      id: "featured",
      description: "A featured project.",
      pushedAt: "2026-01-01T00:00:00Z",
      featured: true,
    });
    const recent = project({
      id: "recent",
      description: "A recent project.",
      pushedAt: "2026-09-01T00:00:00Z",
    });
    const noDescription = project({
      id: "empty",
      description: "",
      pushedAt: "2026-10-01T00:00:00Z",
      featured: true,
    });

    expect(
      selectFeaturedProjects([noDescription, recent, explicit]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["featured"]);
  });

  it("does not fall back to recent repos when nothing is featured", () => {
    const recent = Array.from({ length: 10 }, (_, index) =>
      project({
        id: `recent-${index}`,
        description: "A recent project.",
        pushedAt: `2026-${String(index + 1).padStart(2, "0")}-01T00:00:00Z`,
      }),
    );

    expect(selectFeaturedProjects(recent)).toEqual([]);
  });

  it("excludes featured projects without descriptions and warns for each", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const described = project({
      id: "described",
      description: "A described featured project.",
      pushedAt: "2026-01-01T00:00:00Z",
      featured: true,
    });
    const empty = project({
      id: "empty-featured",
      description: "   ",
      pushedAt: "2026-02-01T00:00:00Z",
      featured: true,
    });
    const experiment = project({
      id: "experiment",
      description: "Not featured.",
      pushedAt: "2026-03-01T00:00:00Z",
      category: "experiment",
    });

    expect(
      selectFeaturedProjects([empty, experiment, described]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["described"]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("empty-featured");
  });

  it("returns nothing when no project has a description", () => {
    const entries = [
      project({
        id: "one",
        description: " ",
        pushedAt: "2026-01-01T00:00:00Z",
      }),
      project({
        id: "two",
        description: "",
        pushedAt: "2026-02-01T00:00:00Z",
      }),
    ];

    expect(selectFeaturedProjects(entries)).toEqual([]);
  });
});
