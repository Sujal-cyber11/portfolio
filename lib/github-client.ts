import { toRepoSummary, type RepoSummary } from "@/lib/github-repo";

export type { RepoSummary } from "@/lib/github-repo";

export interface GitHubFetchFailure {
  ok: false;
  reason: "rate_limited" | "http_error" | "network" | "invalid_response";
  status?: number;
  resetAt?: string;
}

export interface GitHubFetchSuccess {
  ok: true;
  repos: RepoSummary[];
  truncated: boolean;
}

export type GitHubFetchResult = GitHubFetchSuccess | GitHubFetchFailure;

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 10;
const RETRY_DELAY_MS = 250;

function buildHeaders(token: string | undefined): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "sujal-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function warn(message: string, token: string | undefined): void {
  console.warn(token ? message.split(token).join("[redacted]") : message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPageUrl(
  link: string | null,
  currentUrl: string,
  page: number,
): string | null {
  try {
    const next = new URL(link ?? currentUrl, currentUrl);

    if (!link) {
      next.searchParams.set("page", String(page));
    }

    return next.toString();
  } catch {
    return null;
  }
}

function parseNextLink(header: string | null): string | null {
  for (const part of header?.split(",") ?? []) {
    const match = part.match(/<([^>]+)>\s*;\s*(.+)$/);

    if (match && /(?:^|;)\s*rel\s*=\s*"?next"?\s*(?:;|$)/i.test(match[2])) {
      return match[1];
    }
  }

  return null;
}

function retryAfter(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return new Date(Date.now() + seconds * 1000).toISOString();
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function resetAt(response: Response): string | undefined {
  const reset = Number(response.headers.get("x-ratelimit-reset"));

  if (Number.isFinite(reset) && reset > 0) {
    return new Date(reset * 1000).toISOString();
  }

  return retryAfter(response.headers.get("retry-after")) ?? undefined;
}

function rateLimited(status: number, response: Response): boolean {
  if (status !== 403 && status !== 429) {
    return false;
  }

  return (
    response.headers.get("x-ratelimit-remaining")?.trim() === "0" ||
    response.headers.has("retry-after")
  );
}

interface PageAttempt {
  response?: Response;
  error?: unknown;
}

async function requestPage(
  url: string,
  token: string | undefined,
  fetchImpl: typeof fetch,
): Promise<PageAttempt> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS);
    }

    try {
      const response = await fetchImpl(url, { headers: buildHeaders(token) });

      if (response.status >= 500 && attempt === 0) {
        continue;
      }

      return { response };
    } catch (error) {
      lastError = error;
    }
  }

  return { error: lastError };
}

async function readPage(
  response: Response,
  token: string | undefined,
): Promise<{ repos: RepoSummary[]; count: number } | null> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    warn(
      "[github] GitHub returned malformed JSON. Using the last good list or local content.",
      token,
    );
    return null;
  }

  if (!Array.isArray(data)) {
    warn(
      "[github] GitHub returned an unexpected response body. Using the last good list or local content.",
      token,
    );
    return null;
  }

  return {
    repos: data
      .map((entry) => toRepoSummary(entry))
      .filter((repo): repo is RepoSummary => repo !== null),
    count: data.length,
  };
}

export async function fetchPublicRepos(
  username: string,
  token: string | undefined,
  fetchImpl: typeof fetch,
): Promise<GitHubFetchResult> {
  const trimmed = username.trim();

  if (!trimmed) {
    return { ok: true, repos: [], truncated: false };
  }

  const baseUrl = `${GITHUB_API}/users/${encodeURIComponent(trimmed)}/repos?per_page=${PER_PAGE}&sort=updated`;
  const repos: RepoSummary[] = [];
  let nextUrl: string | null = baseUrl;
  let pages = 0;
  let truncated = false;

  while (nextUrl && pages < MAX_PAGES) {
    const pageUrl: string = nextUrl;
    pages += 1;

    const attempt = await requestPage(pageUrl, token, fetchImpl);

    if (!attempt.response) {
      const message =
        attempt.error instanceof Error
          ? attempt.error.message
          : String(attempt.error);
      warn(
        `[github] GitHub request failed: ${message}. Using the last good list or local content.`,
        token,
      );
      return { ok: false, reason: "network" };
    }

    const response = attempt.response;

    if (!response.ok) {
      if (rateLimited(response.status, response)) {
        const reset = resetAt(response);
        warn(
          `[github] GitHub rate limit hit (HTTP ${response.status}); resets at ${reset ?? "an unknown time"}. Not retrying now.`,
          token,
        );
        return {
          ok: false,
          reason: "rate_limited",
          status: response.status,
          resetAt: reset,
        };
      }

      warn(
        `[github] GitHub request failed (HTTP ${response.status}). Using the last good list or local content.`,
        token,
      );
      return { ok: false, reason: "http_error", status: response.status };
    }

    const page = await readPage(response, token);

    if (page === null) {
      return { ok: false, reason: "invalid_response", status: response.status };
    }

    repos.push(...page.repos);

    if (page.count < PER_PAGE) {
      nextUrl = null;
    } else if (pages >= MAX_PAGES) {
      truncated = true;
      nextUrl = null;
    } else {
      nextUrl = nextPageUrl(
        parseNextLink(response.headers.get("link")),
        pageUrl,
        pages + 1,
      );
    }
  }

  if (truncated) {
    warn(
      `[github] GitHub repository list truncated at the ${MAX_PAGES}-page (${MAX_PAGES * PER_PAGE} repo) cap; some repositories are omitted.`,
      token,
    );
  }

  return { ok: true, repos, truncated };
}
