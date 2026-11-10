import { afterEach, describe, expect, it, vi } from "vitest";
import type { RepoSummary } from "@/lib/github";
import { EXPERIMENT_TOPIC, FEATURED_TOPIC } from "@/lib/project-categories";
import {
  formatRepoTitle,
  mergeProjects,
  selectFeaturedProjects,
} from "@/lib/projects";
import type { ProjectOverrides } from "@/lib/schema";

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

afterEach(() => {
  vi.restoreAllMocks();
});

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
        problem: "A problem statement.",
        role: "A role.",
        contribution: "A contribution.",
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
      problem: "A problem statement.",
      role: "A role.",
      contribution: "A contribution.",
      tags: ["custom"],
      featured: true,
      category: "featured",
      status: "building",
      liveUrl: "https://example.com/",
      stars: 7,
    });
    expect(bare).toMatchObject({
      title: "No Description",
      description: "",
      tags: ["systems"],
      category: "discovered",
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
      category: "discovered",
    });
  });

  it("keeps a new repo with no description and no topics in discovered", () => {
    const visible = [
      repo({
        name: "brand-new",
        description: null,
        topics: [],
        pushedAt: "2026-10-01T00:00:00Z",
      }),
    ];

    const projects = mergeProjects(visible, visible, {});

    expect(projects[0]).toMatchObject({
      category: "discovered",
      description: "",
      tags: [],
    });
    expect(selectFeaturedProjects(projects)).toEqual([]);
  });

  it("classifies topics and removes category topics from tags", () => {
    const visible = [
      repo({
        name: "featured-repo",
        topics: [FEATURED_TOPIC, "Python", "cli"],
      }),
      repo({
        name: "experiment-repo",
        topics: [EXPERIMENT_TOPIC, "Rust"],
      }),
      repo({ name: "plain-repo", topics: ["Go"] }),
    ];

    const projects = mergeProjects(visible, visible, {});
    const byId = new Map(projects.map((entry) => [entry.id, entry]));

    expect(byId.get("featured-repo")).toMatchObject({
      category: "featured",
      tags: ["Python", "cli"],
    });
    expect(byId.get("experiment-repo")).toMatchObject({
      category: "experiment",
      tags: ["Rust"],
    });
    expect(byId.get("plain-repo")).toMatchObject({
      category: "discovered",
      tags: ["Go"],
    });
  });

  it("lets an override category beat topics and keeps legacy featured", () => {
    const visible = [
      repo({ name: "topic-featured", topics: [FEATURED_TOPIC] }),
      repo({ name: "legacy-featured", topics: [] }),
      repo({ name: "tagged", topics: [] }),
    ];
    const overrides: ProjectOverrides = {
      "topic-featured": { category: "experiment" },
      "legacy-featured": { featured: true },
      tagged: { tags: [FEATURED_TOPIC, "custom"] },
    };

    const projects = mergeProjects(visible, visible, overrides);
    const byId = new Map(projects.map((entry) => [entry.id, entry]));

    expect(byId.get("topic-featured")).toMatchObject({
      category: "experiment",
      featured: false,
    });
    expect(byId.get("legacy-featured")).toMatchObject({
      category: "featured",
      featured: true,
    });
    expect(byId.get("tagged")?.tags).toEqual(["custom"]);
  });

  it("prefers featured when a repo has both category topics and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const visible = [
      repo({
        name: "both-topics",
        topics: [FEATURED_TOPIC, EXPERIMENT_TOPIC],
      }),
    ];

    const projects = mergeProjects(visible, visible, {});

    expect(projects[0]).toMatchObject({
      category: "featured",
      tags: [],
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("both-topics");
  });

  it("lets manual projects use an explicit category", () => {
    const overrides: ProjectOverrides = {
      "manual-experiment": {
        title: "Manual Experiment",
        description: "Built outside GitHub.",
        category: "experiment",
      },
      "manual-featured": {
        title: "Manual Featured",
        category: "featured",
      },
    };

    const projects = mergeProjects([], [], overrides);
    const byId = new Map(projects.map((entry) => [entry.id, entry]));

    expect(byId.get("manual-experiment")).toMatchObject({
      category: "experiment",
      featured: false,
    });
    expect(byId.get("manual-featured")).toMatchObject({
      category: "featured",
      featured: true,
    });
  });
});
