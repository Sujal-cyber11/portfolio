import { getProjectOverrides } from "@/lib/content";
import {
  getAllPublicRepos,
  getPublicRepos,
  type RepoSummary,
} from "@/lib/github";
import type {
  Profile,
  ProjectOverride,
  ProjectOverrides,
  ProjectStatus,
} from "@/lib/schema";

export interface ProjectView {
  id: string;
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  image?: string;
  featured: boolean;
  date: string;
  status: ProjectStatus;
  repoName: string | null;
  stars: number | null;
  language: string | null;
  pushedAt: string | null;
}

export function formatRepoTitle(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function toHttpUrl(value: string | null | undefined): string | undefined {
  const text = value?.trim();

  if (!text) {
    return undefined;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(text)
    ? text
    : `https://${text}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function repoToProject(
  repo: RepoSummary,
  override: ProjectOverride | undefined,
): ProjectView {
  const pushedDate = repo.pushedAt || repo.updatedAt;

  return {
    id: repo.name,
    title: override?.title ?? formatRepoTitle(repo.name),
    description: override?.description ?? repo.description ?? "",
    tags: override?.tags ?? repo.topics,
    repoUrl: repo.url,
    liveUrl: toHttpUrl(repo.homepage),
    image: override?.image,
    featured: override?.featured ?? false,
    date: pushedDate ? pushedDate.slice(0, 10) : "1970-01-01",
    status: override?.status ?? "done",
    repoName: repo.name,
    stars: repo.stars,
    language: repo.language,
    pushedAt: repo.pushedAt || null,
  };
}

function manualToProject(key: string, override: ProjectOverride): ProjectView {
  return {
    id: key,
    title: override.title ?? formatRepoTitle(key),
    description: override.description ?? "",
    tags: override.tags ?? [],
    repoUrl: override.repoUrl,
    liveUrl: override.liveUrl,
    image: override.image,
    featured: override.featured ?? false,
    date: override.date ?? "1970-01-01",
    status: override.status ?? "done",
    repoName: null,
    stars: null,
    language: null,
    pushedAt: null,
  };
}

export function selectFeaturedProjects(
  projects: readonly ProjectView[],
): ProjectView[] {
  const withDescriptions = projects.filter(
    (project) => project.description.trim().length > 0,
  );
  const explicit = withDescriptions.filter((project) => project.featured);

  if (explicit.length > 0) {
    return [...explicit];
  }

  return withDescriptions
    .filter(
      (project): project is ProjectView & { pushedAt: string } =>
        project.pushedAt !== null && project.pushedAt.length > 0,
    )
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, 3);
}

export function mergeProjects(
  visibleRepos: readonly RepoSummary[],
  allRepos: readonly RepoSummary[],
  overrides: ProjectOverrides,
): ProjectView[] {
  const overridesByLowerName = new Map(
    Object.entries(overrides).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const allRepoNames = new Set(allRepos.map((repo) => repo.name.toLowerCase()));
  const projects: ProjectView[] = [];

  for (const repo of visibleRepos) {
    const override = overridesByLowerName.get(repo.name.toLowerCase());

    if (override?.hidden) {
      continue;
    }

    projects.push(repoToProject(repo, override));
  }

  for (const [key, override] of Object.entries(overrides)) {
    if (allRepoNames.has(key.toLowerCase()) || override.hidden) {
      continue;
    }

    projects.push(manualToProject(key, override));
  }

  return projects.sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );
}

export async function getProjects(profile: Profile): Promise<ProjectView[]> {
  const [visibleRepos, allRepos] = await Promise.all([
    getPublicRepos(profile),
    getAllPublicRepos(profile),
  ]);

  return mergeProjects(visibleRepos, allRepos, getProjectOverrides());
}
