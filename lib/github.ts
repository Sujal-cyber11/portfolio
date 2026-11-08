import { cacheLife } from "next/cache";
import type { Profile, Project } from "@/lib/schema";
import { filterRepos } from "@/lib/repo-filter";

const GITHUB_API = "https://api.github.com";

export interface RepoSummary {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
  fork: boolean;
  archived: boolean;
}

export interface RepoMeta {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
}

export interface ProjectView extends Project {
  repoMeta: RepoMeta | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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

function parseGitHubRepoUrl(
  repoUrl: string,
): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);

    if (url.hostname.toLowerCase() !== "github.com") {
      return null;
    }

    const [owner, rawRepo] = url.pathname.split("/").filter(Boolean);

    if (!owner || !rawRepo) {
      return null;
    }

    return {
      owner,
      repo: rawRepo.replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

function toRepoMeta(value: unknown): RepoMeta | null {
  if (!isRecord(value) || typeof value.name !== "string") {
    return null;
  }

  return {
    name: value.name,
    description: stringOrNull(value.description),
    stars: numberOrZero(value.stargazers_count),
    language: stringOrNull(value.language),
    topics: stringArray(value.topics),
  };
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
    stars: numberOrZero(value.stargazers_count),
    forks: numberOrZero(value.forks_count),
    language: stringOrNull(value.language),
    topics: stringArray(value.topics),
    updatedAt: stringOrNull(value.updated_at) ?? "",
    fork: value.fork,
    archived: value.archived,
  };
}

export async function getRepoMeta(repoUrl: string): Promise<RepoMeta | null> {
  "use cache";
  cacheLife("hours");

  const parsed = parseGitHubRepoUrl(repoUrl);

  if (!parsed) {
    return null;
  }

  const data = await fetchGitHubData(
    `${GITHUB_API}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
  );

  return data ? toRepoMeta(data) : null;
}

export async function enrichProjects(
  projects: Project[],
): Promise<ProjectView[]> {
  return Promise.all(
    projects.map(async (project) => {
      const repoMeta = project.repoUrl
        ? await getRepoMeta(project.repoUrl)
        : null;

      if (!repoMeta) {
        return { ...project, repoMeta };
      }

      return {
        ...project,
        description: project.description || repoMeta.description || "",
        tags:
          project.tags.length > 0 ? project.tags : repoMeta.topics.slice(0, 4),
        repoMeta,
      };
    }),
  );
}

export async function getPublicRepos(profile: Profile): Promise<RepoSummary[]> {
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

  const repos = data
    .map((entry) => toRepoSummary(entry))
    .filter((repo): repo is RepoSummary => repo !== null);
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
