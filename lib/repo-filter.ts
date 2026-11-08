export interface RepoFilterOptions {
  excludeRepos: readonly string[];
  includeForks: boolean;
  includeArchived: boolean;
  ownRepoSlugs: readonly string[];
}

interface RepoLike {
  name: string;
  fork: boolean;
  archived: boolean;
}

function normalizeRepoName(value: string): string {
  const normalized = value.trim().toLowerCase();
  const segments = normalized.split("/");
  return segments[segments.length - 1] ?? "";
}

export function filterRepos<T extends RepoLike>(
  repos: readonly T[],
  options: RepoFilterOptions,
): T[] {
  const excluded = new Set(
    [...options.excludeRepos, ...options.ownRepoSlugs]
      .map(normalizeRepoName)
      .filter((name) => name.length > 0),
  );

  return repos.filter((repo) => {
    if (excluded.has(normalizeRepoName(repo.name))) {
      return false;
    }

    if (!options.includeForks && repo.fork) {
      return false;
    }

    if (!options.includeArchived && repo.archived) {
      return false;
    }

    return true;
  });
}
