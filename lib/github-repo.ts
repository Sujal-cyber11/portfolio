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

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function textOrNull(value: unknown): string | null {
  return text(value)?.trim() || null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function toRepoSummary(value: unknown): RepoSummary | null {
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
    description: text(value.description),
    url: value.html_url,
    homepage: textOrNull(value.homepage),
    stars: count(value.stargazers_count),
    forks: count(value.forks_count),
    language: text(value.language),
    topics: strings(value.topics),
    updatedAt: text(value.updated_at) ?? "",
    pushedAt: text(value.pushed_at) ?? "",
    fork: value.fork,
    archived: value.archived,
  };
}
