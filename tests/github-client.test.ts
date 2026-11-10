import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicRepos, type GitHubFetchResult } from "@/lib/github-client";

function rawRepo(index: number) {
  return {
    name: `repo-${String(index).padStart(4, "0")}`,
    description: `Repository ${index}`,
    html_url: `https://github.com/example/repo-${index}`,
    homepage: null,
    stargazers_count: index,
    forks_count: 0,
    language: "TypeScript",
    topics: [],
    updated_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    fork: false,
    archived: false,
  };
}

function pageRepos(start: number, count: number) {
  return Array.from({ length: count }, (_, offset) => rawRepo(start + offset));
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function pagedFetch(total: number) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const page = Number(url.searchParams.get("page") ?? "1");
    const start = (page - 1) * 100;
    const count = Math.max(0, Math.min(100, total - start));
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };

    if (count === 100) {
      headers.link = `<https://api.github.com/users/example/repos?per_page=100&sort=updated&page=${page + 1}>; rel="next"`;
    }

    return new Response(JSON.stringify(pageRepos(start, count)), {
      status: 200,
      headers,
    });
  });
}

function loggedMessages(warn: { mock: { calls: unknown[][] } }): string {
  return warn.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("fetchPublicRepos", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("collects 250 repos across three pages", async () => {
    const fetchImpl = pagedFetch(250);

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({ ok: true, truncated: false });
    if (result.ok) {
      expect(result.repos).toHaveLength(250);
      expect(result.repos[0]?.name).toBe("repo-0000");
      expect(result.repos[249]?.name).toBe("repo-0249");
    }
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(warn).not.toHaveBeenCalled();
  });

  it("requests an empty page at an exact 100-repo boundary", async () => {
    const fetchImpl = pagedFetch(100);

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({ ok: true, truncated: false });
    if (result.ok) {
      expect(result.repos).toHaveLength(100);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain("page=2");
  });

  it("follows the Link header rel=next URL", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.includes("page=7")) {
        return jsonResponse(pageRepos(100, 50));
      }

      return jsonResponse(pageRepos(0, 100), 200, {
        link: '<https://api.github.com/users/example/repos?per_page=100&sort=updated&page=7>; rel="next", <https://api.github.com/users/example/repos?page=9>; rel="last"',
      });
    });

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({ ok: true, truncated: false });
    if (result.ok) {
      expect(result.repos).toHaveLength(150);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe(
      "https://api.github.com/users/example/repos?per_page=100&sort=updated&page=7",
    );
  });

  it("caps at ten pages and reports truncation once", async () => {
    const fetchImpl = pagedFetch(1_200);

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({ ok: true, truncated: true });
    if (result.ok) {
      expect(result.repos).toHaveLength(1_000);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(10);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(loggedMessages(warn)).toContain("truncated");
  });

  it("reports a 403 rate limit with the reset time and does not retry", async () => {
    const resetSeconds = 1_700_000_000;
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ message: "API rate limit exceeded" }, 403, {
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(resetSeconds),
      }),
    );

    const result = await fetchPublicRepos("example", undefined, fetchImpl);
    const resetAt = new Date(resetSeconds * 1000).toISOString();

    expect(result).toEqual({
      ok: false,
      reason: "rate_limited",
      status: 403,
      resetAt,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(loggedMessages(warn)).toContain(resetAt);
  });

  it("reports a 429 Retry-After rate limit", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ message: "Too many requests" }, 429, {
        "retry-after": "60",
      }),
    );

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({
      ok: false,
      reason: "rate_limited",
      status: 429,
    });
    if (!result.ok) {
      expect(result.resetAt).toBeDefined();
      expect(Number.isNaN(Date.parse(result.resetAt ?? ""))).toBe(false);
      expect(loggedMessages(warn)).toContain(result.resetAt ?? "");
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a 500 once and succeeds", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("server error", { status: 500 }))
      .mockResolvedValueOnce(jsonResponse([rawRepo(1)]));

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toMatchObject({ ok: true, truncated: false });
    if (result.ok) {
      expect(result.repos).toHaveLength(1);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(warn).not.toHaveBeenCalled();
  });

  it("fails after a second 500", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("server error", { status: 500 }))
      .mockResolvedValueOnce(new Response("server error", { status: 500 }));

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toEqual({
      ok: false,
      reason: "http_error",
      status: 500,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("retries a network error once and then fails", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("socket closed"));

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toEqual({ ok: false, reason: "network" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(loggedMessages(warn)).toContain("socket closed");
  });

  it("rejects malformed JSON without retrying", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response("{not json", { status: 200 }),
    );

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toEqual({
      ok: false,
      reason: "invalid_response",
      status: 200,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("rejects non-array JSON", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ message: "Not Found" }),
    );

    const result = await fetchPublicRepos("example", undefined, fetchImpl);

    expect(result).toEqual({
      ok: false,
      reason: "invalid_response",
      status: 200,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("makes an empty successful account distinguishable from a failure", async () => {
    const success = await fetchPublicRepos(
      "example",
      undefined,
      vi.fn<typeof fetch>(async () => jsonResponse([])),
    );
    const failure = await fetchPublicRepos(
      "example",
      undefined,
      vi.fn<typeof fetch>(async () =>
        jsonResponse({ message: "Bad credentials" }, 401),
      ),
    );

    expect(success).toEqual({ ok: true, repos: [], truncated: false });
    expect(failure).toMatchObject({ ok: false, reason: "http_error" });
  });

  it("works without a token and omits the Authorization header", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

    const result = await fetchPublicRepos("example", undefined, fetchImpl);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(result.ok).toBe(true);
    expect(headers.Authorization).toBeUndefined();
    expect(headers.Accept).toBe("application/vnd.github+json");
  });

  it("sends the token only in the request header", async () => {
    const token = "ghp_private_token";
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

    await fetchPublicRepos("example", token, fetchImpl);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(headers.Authorization).toBe(`Bearer ${token}`);
  });

  it("never logs the token", async () => {
    const token = "ghp_super_secret_token";
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error(`request failed for ${token}`));

    const result: GitHubFetchResult = await fetchPublicRepos(
      "example",
      token,
      fetchImpl,
    );

    expect(result.ok).toBe(false);
    expect(loggedMessages(warn)).not.toContain(token);
    expect(loggedMessages(warn)).toContain("[redacted]");
  });
});
