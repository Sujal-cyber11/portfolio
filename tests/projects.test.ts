import { describe, expect, it } from "vitest";
import type { RepoSummary } from "@/lib/github";
import {
  formatRepoTitle,
  mergeProjects,
  selectFeaturedProjects,
  type ProjectView,
} from "@/lib/projects";
import type { ProjectOverrides } from "@/lib/schema";

function project(
  overrides: Partial<ProjectView> &
    Pick<ProjectView, "id" | "description" | "pushedAt">,
): ProjectView {
  return {
    title: overrides.id,
    tags: [],
    featured: false,
    date: "2026-01-01",
    status: "done",
    repoName: overrides.id,
    stars: 0,
    language: null,
    ...overrides,
  };
}

function repo(
  overrides: Partial<RepoSummary> & Pick<RepoSummary, "name">,
): RepoSummary {
  return {
    description: "Repo description.",
    url: `https://github.com/Sujal-cyber11/${overrides.name}`,
    homepage: null,
    stars: 0,
    forks: 0,
    language: "TypeScript",
    topics: [],
    updatedAt: "2026-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    fork: false,
    archived: false,
    ...overrides,
  };
}

describe("formatRepoTitle", () => {
  it("turns repo slugs into title case", () => {
    expect(formatRepoTitle("my-cool_repo")).toBe("My Cool Repo");
    expect(formatRepoTitle("packet-lens")).toBe("Packet Lens");
  });
});

describe("mergeProjects", () => {
  it("applies overrides and keeps repos without descriptions", () => {
    const visible = [
      repo({
        name: "my-tool",
        description: "Original description.",
        topics: ["cli"],
        homepage: "example.com",
        stars: 7,
      }),
      repo({
        name: "no-description",
        description: null,
        topics: ["systems"],
        language: "C",
      }),
    ];
    const overrides: ProjectOverrides = {
      "My-Tool": {
        title: "Custom Tool",
        description: "Overridden description.",
        tags: ["custom"],
        featured: true,
        status: "building",
      },
    };

    const projects = mergeProjects(visible, visible, overrides);
    const custom = projects.find((entry) => entry.id === "my-tool");
    const bare = projects.find((entry) => entry.id === "no-description");

    expect(custom).toMatchObject({
      title: "Custom Tool",
      description: "Overridden description.",
      tags: ["custom"],
      featured: true,
      status: "building",
      liveUrl: "https://example.com/",
      stars: 7,
    });
    expect(bare).toMatchObject({
      title: "No Description",
      description: "",
      tags: ["systems"],
      language: "C",
    });
  });

  it("hides overridden repos and does not turn excluded repos into manual projects", () => {
    const visible = [repo({ name: "hidden-repo" })];
    const all = [visible[0], repo({ name: "excluded-repo" })];
    const overrides: ProjectOverrides = {
      "hidden-repo": { hidden: true },
      "excluded-repo": { featured: true },
      "manual-project": {
        title: "Manual Project",
        description: "Built outside GitHub.",
        repoUrl: "https://example.com/manual",
        date: "2026-02-02",
      },
    };

    const projects = mergeProjects(visible, all, overrides);

    expect(projects.map((entry) => entry.id)).toEqual(["manual-project"]);
    expect(projects[0]).toMatchObject({
      title: "Manual Project",
      repoUrl: "https://example.com/manual",
      date: "2026-02-02",
      repoName: null,
    });
  });
});

describe("selectFeaturedProjects", () => {
  it("uses explicitly featured projects with descriptions", () => {
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

  it("falls back to the three most recent repos with descriptions", () => {
    const oldest = project({
      id: "oldest",
      description: "Oldest.",
      pushedAt: "2026-01-01T00:00:00Z",
    });
    const middle = project({
      id: "middle",
      description: "Middle.",
      pushedAt: "2026-05-01T00:00:00Z",
    });
    const newest = project({
      id: "newest",
      description: "Newest.",
      pushedAt: "2026-09-01T00:00:00Z",
    });
    const noDescription = project({
      id: "empty",
      description: "",
      pushedAt: "2026-10-01T00:00:00Z",
    });
    const manual = project({
      id: "manual",
      description: "Manual project.",
      pushedAt: null,
    });

    expect(
      selectFeaturedProjects([
        oldest,
        noDescription,
        middle,
        manual,
        newest,
      ]).map((entry) => entry.id),
    ).toEqual(["newest", "middle", "oldest"]);
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
