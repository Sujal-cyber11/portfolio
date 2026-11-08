import { describe, expect, it } from "vitest";
import { filterRepos, type RepoFilterOptions } from "@/lib/repo-filter";

interface TestRepo {
  name: string;
  fork: boolean;
  archived: boolean;
}

const repos: TestRepo[] = [
  { name: "portfolio", fork: false, archived: false },
  { name: "Portfolio", fork: false, archived: false },
  { name: "awesome-portfolio", fork: false, archived: false },
  { name: "old-site", fork: false, archived: true },
  { name: "forked-tool", fork: true, archived: false },
  { name: "packet-lens", fork: false, archived: false },
];

function options(
  overrides: Partial<RepoFilterOptions> = {},
): RepoFilterOptions {
  return {
    excludeRepos: ["portfolio"],
    includeForks: false,
    includeArchived: false,
    ownRepoSlugs: [],
    ...overrides,
  };
}

describe("filterRepos", () => {
  it("excludes portfolio repos case-insensitively", () => {
    const result = filterRepos(repos, options());

    expect(result.map((repo) => repo.name)).toEqual([
      "awesome-portfolio",
      "packet-lens",
    ]);
  });

  it("auto-excludes the deployed repo name from environment values", () => {
    const result = filterRepos(
      repos,
      options({
        excludeRepos: [],
        ownRepoSlugs: ["owner/Portfolio", "renamed-site"],
      }),
    );

    expect(result.map((repo) => repo.name)).toEqual([
      "awesome-portfolio",
      "packet-lens",
    ]);
  });

  it("skips forks and archived repos by default", () => {
    const result = filterRepos(repos, options({ excludeRepos: [] }));

    expect(result.map((repo) => repo.name)).toEqual([
      "portfolio",
      "Portfolio",
      "awesome-portfolio",
      "packet-lens",
    ]);
  });

  it("can include forks and archived repos", () => {
    const result = filterRepos(
      repos,
      options({
        excludeRepos: [],
        includeForks: true,
        includeArchived: true,
      }),
    );

    expect(result.map((repo) => repo.name)).toContain("forked-tool");
    expect(result.map((repo) => repo.name)).toContain("old-site");
  });

  it("does not mutate the input array", () => {
    const snapshot = repos.map((repo) => ({ ...repo }));
    const result = filterRepos(repos, options());

    expect(repos).toEqual(snapshot);
    expect(result).not.toBe(repos);
  });
});
