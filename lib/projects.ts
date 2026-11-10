import { getProjectOverrides } from "@/lib/content";
import {
  getAllPublicRepos,
  getPublicRepos,
  type RepoSummary,
} from "@/lib/github";
import {
  classifyProject,
  EXPERIMENT_TOPIC,
  FEATURED_TOPIC,
  withoutCategoryTopics,
} from "@/lib/project-categories";
import type {
  Profile,
  ProjectCategory,
  ProjectOverride,
  ProjectOverrides,
  ProjectStatus,
} from "@/lib/schema";

export interface ProjectView {
  id: string;
  title: string;
  description: string;
  problem?: string;
  role?: string;
  contribution?: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  image?: string;
  featured: boolean;
  category: ProjectCategory;
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
  const decision = classifyProject(repo.topics, override);

  if (decision.conflictingTopics) {
    console.warn(
      `[projects] ${repo.name} has both "${FEATURED_TOPIC}" and "${EXPERIMENT_TOPIC}" topics; keeping it featured.`,
    );
  }

  return {
    id: repo.name,
    title: override?.title ?? formatRepoTitle(repo.name),
    description: override?.description ?? repo.description ?? "",
    problem: override?.problem,
    role: override?.role,
    contribution: override?.contribution,
    tags: withoutCategoryTopics(override?.tags ?? repo.topics),
    repoUrl: repo.url,
    liveUrl: toHttpUrl(repo.homepage),
    image: override?.image,
    featured: decision.category === "featured",
    category: decision.category,
    date: pushedDate ? pushedDate.slice(0, 10) : "1970-01-01",
    status: override?.status ?? "done",
    repoName: repo.name,
    stars: repo.stars,
    language: repo.language,
    pushedAt: repo.pushedAt || null,
  };
}

function manualToProject(key: string, override: ProjectOverride): ProjectView {
  const decision = classifyProject([], override);

  return {
    id: key,
    title: override.title ?? formatRepoTitle(key),
    description: override.description ?? "",
    problem: override.problem,
    role: override.role,
    contribution: override.contribution,
    tags: withoutCategoryTopics(override.tags ?? []),
    repoUrl: override.repoUrl,
    liveUrl: override.liveUrl,
    image: override.image,
    featured: decision.category === "featured",
    category: decision.category,
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
  const featured: ProjectView[] = [];

  for (const project of projects) {
    if (project.category !== "featured") {
      continue;
    }

    if (project.description.trim().length > 0) {
      featured.push(project);
      continue;
    }

    console.warn(
      `[projects] Featured project "${project.title}" has no description and is hidden from the home page.`,
    );
  }

  return featured;
}

export function groupProjectsByCategory(
  projects: readonly ProjectView[],
): Record<ProjectCategory, ProjectView[]> {
  const groups: Record<ProjectCategory, ProjectView[]> = {
    featured: [],
    experiment: [],
    discovered: [],
  };

  for (const project of projects) {
    groups[project.category].push(project);
  }

  return groups;
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
