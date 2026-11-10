import { describe, expect, it } from "vitest";
import type { RepoSummary } from "@/lib/github";
import { groupProjectsByCategory, mergeProjects } from "@/lib/projects";
import { projectOverrideSchema, type ProjectOverrides } from "@/lib/schema";

function repo(name: string): RepoSummary {
  return {
    name,
    description: "Repo description.",
    url: `https://github.com/Sujal-cyber11/${name}`,
    homepage: null,
    stars: 0,
    forks: 0,
    language: "TypeScript",
    topics: [],
    updatedAt: "2026-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    fork: false,
    archived: false,
  };
}

describe("projectOverrideSchema metadata fields", () => {
  it("accepts valid trimmed values", () => {
    const parsed = projectOverrideSchema.safeParse({
      problem: "  A problem.  ",
      role: "  Maintainer  ",
      contribution: "  Built it.  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        problem: "A problem.",
        role: "Maintainer",
        contribution: "Built it.",
      });
    }
  });

  it.each(["problem", "role", "contribution"] as const)(
    "rejects an empty %s",
    (field) => {
      expect(projectOverrideSchema.safeParse({ [field]: "" }).success).toBe(
        false,
      );
    },
  );

  it.each([
    ["problem", 281],
    ["role", 81],
    ["contribution", 401],
  ] as const)("rejects an over-limit %s", (field, length) => {
    expect(
      projectOverrideSchema.safeParse({ [field]: "x".repeat(length) }).success,
    ).toBe(false);
  });

  it("still rejects unknown keys", () => {
    expect(projectOverrideSchema.safeParse({ unknown: "value" }).success).toBe(
      false,
    );
  });
});

describe("project metadata merging", () => {
  it("carries the fields through for repo-backed and manual projects", () => {
    const visible = [repo("repo-backed")];
    const overrides: ProjectOverrides = {
      "repo-backed": {
        problem: "Repo problem.",
        role: "Repo role.",
        contribution: "Repo contribution.",
      },
      "manual-project": {
        title: "Manual Project",
        description: "Manual description.",
        repoUrl: "https://example.com/repo",
        liveUrl: "https://example.com/live",
        role: "Manual role.",
        contribution: "Manual contribution.",
      },
    };

    const projects = mergeProjects(visible, visible, overrides);
    const byId = new Map(projects.map((entry) => [entry.id, entry]));

    expect(byId.get("repo-backed")).toMatchObject({
      problem: "Repo problem.",
      role: "Repo role.",
      contribution: "Repo contribution.",
    });
    expect(byId.get("manual-project")).toMatchObject({
      problem: undefined,
      role: "Manual role.",
      contribution: "Manual contribution.",
      repoName: null,
      stars: null,
      language: null,
    });
  });

  it("puts a manual featured project in the Featured section", () => {
    const overrides: ProjectOverrides = {
      "manual-featured": {
        title: "Manual Featured",
        description: "Manual description.",
        category: "featured",
      },
    };

    const groups = groupProjectsByCategory(mergeProjects([], [], overrides));

    expect(groups.featured.map((entry) => entry.id)).toEqual([
      "manual-featured",
    ]);
    expect(groups.discovered).toEqual([]);
    expect(groups.experiment).toEqual([]);
  });
});
