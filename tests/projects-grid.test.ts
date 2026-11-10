import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import type { ProjectView } from "@/lib/projects";

function project(overrides: Partial<ProjectView> = {}): ProjectView {
  return {
    id: "no-description",
    title: "No Description",
    description: "",
    tags: [],
    repoUrl: "https://github.com/example/no-description",
    featured: false,
    category: "discovered",
    date: "2026-01-01",
    status: "done",
    repoName: "no-description",
    stars: null,
    language: null,
    pushedAt: null,
    ...overrides,
  };
}

describe("ProjectsGrid", () => {
  it("omits the description paragraph when a project has no description", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsGrid, {
        title: "Other projects",
        projects: [project()],
      }),
    );

    expect(html).not.toContain("undefined");
    expect(html).not.toMatch(/<p[^>]*>\s*<\/p>/);
    expect(html).not.toContain("<dl");
    expect(html).toContain("Repository");
  });

  it("renders only the labels for the metadata fields that are present", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsGrid, {
        title: "Other projects",
        projects: [project({ role: "Maintainer" })],
      }),
    );

    expect(html).toContain("<dl");
    expect(html).toContain("My role");
    expect(html).toContain("Maintainer");
    expect(html).not.toContain("Problem");
    expect(html).not.toContain("Contribution");
  });

  it("renders a manual project with links and no repo metadata", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsGrid, {
        title: "Other projects",
        projects: [
          project({
            id: "manual",
            title: "Manual Project",
            description: "Manual description.",
            repoName: null,
            stars: null,
            language: null,
            repoUrl: "https://example.com/repo",
            liveUrl: "https://example.com/live",
            role: "Maintainer",
            contribution: "Built the thing.",
          }),
        ],
      }),
    );

    expect(html).not.toContain("undefined");
    expect(html).not.toContain("stars");
    expect(html).toContain("Manual description.");
    expect(html).toContain("https://example.com/repo");
    expect(html).toContain("https://example.com/live");
    expect(html).toContain("My role");
    expect(html).toContain("Contribution");
  });

  it("does not render metadata on the compact variant", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsGrid, {
        title: "Experiments",
        projects: [
          project({
            id: "experiment",
            title: "Experiment",
            category: "experiment",
            role: "Maintainer",
          }),
        ],
        variant: "compact",
      }),
    );

    expect(html).not.toContain("<dl");
    expect(html).not.toContain("My role");
  });

  it("renders the compact variant without the media block", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsGrid, {
        title: "Experiments",
        projects: [
          project({
            id: "experiment",
            title: "Experiment",
            category: "experiment",
          }),
        ],
        variant: "compact",
      }),
    );

    expect(html).not.toContain("undefined");
    expect(html).not.toContain("Done");
  });
});
