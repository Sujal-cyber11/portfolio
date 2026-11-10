import { cacheLife } from "next/cache";
import type { Profile } from "@/lib/schema";
import { fetchPublicRepos, type RepoSummary } from "@/lib/github-client";
import { filterRepos } from "@/lib/repo-filter";

export type { RepoSummary } from "@/lib/github-client";

const lastGoodRepos = new Map<string, readonly RepoSummary[]>();

async function getCachedRepos(profile: Profile): Promise<RepoSummary[] | null> {
  "use cache";

  const result = await fetchPublicRepos(
    profile.githubUsername,
    process.env.GITHUB_TOKEN,
    fetch,
  );

  if (!result.ok) {
    cacheLife({ stale: 30, revalidate: 1, expire: 300 });
    return null;
  }

  cacheLife("hours");
  return result.repos;
}

export async function getAllPublicRepos(
  profile: Profile,
): Promise<RepoSummary[]> {
  const username = profile.githubUsername.trim();

  if (!username) {
    return [];
  }

  const repos = await getCachedRepos(profile);

  if (repos === null) {
    const previous = lastGoodRepos.get(username.toLowerCase());
    return previous ? [...previous] : [];
  }

  lastGoodRepos.set(username.toLowerCase(), repos);
  return repos;
}

export async function getPublicRepos(profile: Profile): Promise<RepoSummary[]> {
  const repos = await getAllPublicRepos(profile);
  const ownRepoSlugs = [
    process.env.VERCEL_GIT_REPO_SLUG,
    process.env.GITHUB_REPO,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return filterRepos(repos, {
    excludeRepos: profile.excludeRepos,
    includeForks: profile.includeForks,
    includeArchived: profile.includeArchived,
    ownRepoSlugs,
  }).sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
}
