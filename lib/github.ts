import { cacheLife } from "next/cache";
import type { Profile } from "@/lib/schema";
import { filterRepos } from "@/lib/repo-filter";

const GITHUB_API = "https://api.github.com";

export interface RepoSummary {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
  pushedAt: string;
  fork: boolean;
  archived: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nonEmptyStringOrNull(value: unknown): string | null {
  const text = stringOrNull(value)?.trim();
  return text ? text : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sujal-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchGitHubData(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
    });

    if (!response.ok) {
      console.warn(
        `[github] ${response.status} ${response.statusText} for ${url}. Falling back to local content.`,
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[github] Request failed for ${url}: ${message}. Falling back to local content.`,
    );
    return null;
  }
}

function toRepoSummary(value: unknown): RepoSummary | null {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.html_url !== "string" ||
    typeof value.fork !== "boolean" ||
    typeof value.archived !== "boolean"
  ) {
    return null;
  }

  return {
    name: value.name,
    description: stringOrNull(value.description),
    url: value.html_url,
    homepage: nonEmptyStringOrNull(value.homepage),
    stars: numberOrZero(value.stargazers_count),
    forks: numberOrZero(value.forks_count),
    language: stringOrNull(value.language),
    topics: stringArray(value.topics),
    updatedAt: stringOrNull(value.updated_at) ?? "",
    pushedAt: stringOrNull(value.pushed_at) ?? "",
    fork: value.fork,
    archived: value.archived,
  };
}

export async function getAllPublicRepos(
  profile: Profile,
): Promise<RepoSummary[]> {
  "use cache";
  cacheLife("hours");

  const username = profile.githubUsername.trim();

  if (!username) {
    return [];
  }

  const data = await fetchGitHubData(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
  );

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => toRepoSummary(entry))
    .filter((repo): repo is RepoSummary => repo !== null);
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
