# Sujal — portfolio

A responsive, terminal-inspired portfolio built with Next.js App Router, TypeScript and plain CSS. Content is validated at build time, festival themes are data-driven, and a small CLI keeps new entries easy to add.

## Stack

- Next.js 16 (App Router, Cache Components) + React 19
- TypeScript strict mode
- Plain CSS: one globals file, shared layout CSS, CSS Modules per section
- Zod schemas for all content
- Vitest for unit tests
- GitHub-backed projects and repositories with hourly revalidation

## Run it

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run dev          # local development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run add          # interactive content CLI
npm run format       # write Prettier formatting
npm run format:check # check Prettier formatting without writing
```

## Project structure

- `app/` — App Router routes for the home page, projects, achievements, not-found, robots, sitemap and festivals.
- `components/` — React sections plus layout, theme and festival components with their CSS Modules.
- `content/` — validated JSON content: profile, project overrides, achievements and festivals.
- `lib/` — content loading and schemas, GitHub fetching/caching, project categories, SEO and site helpers.
- `public/` — static assets served as-is; `uploads/` holds project images and `gifts/` holds festival images.
- `reference/` — reference material and screenshots.
- `scripts/` — `add.ts`, the interactive content CLI.
- `styles/` — shared layout CSS and festival theme variables.
- `tests/` — Vitest unit tests.
- `next.config.ts` — Cache Components, partial prefetching and the optional `NEXT_DIST_DIR` override.
- `package.json` — scripts and dependencies.
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.prettierrc.json`, `.prettierignore` — TypeScript, lint, test and formatting configuration.
- `README.md`, `AGENTS.md` — project documentation and agent instructions.

## Environment variables

| Variable               | Required | Read in          | Purpose                                                                                         |
| ---------------------- | -------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`         | No       | `lib/github.ts`  | Server-only token sent to the GitHub API to raise the rate limit. Never exposed to the browser. |
| `NEXT_PUBLIC_SITE_URL` | No       | `lib/site.ts`    | Canonical site URL. Falls back to `https://sujalrastogi.vercel.app`.                            |
| `VERCEL_GIT_REPO_SLUG` | No       | `lib/github.ts`  | Repo slug excluded from the repository list so the portfolio hides itself.                      |
| `GITHUB_REPO`          | No       | `lib/github.ts`  | Manual alternative to `VERCEL_GIT_REPO_SLUG` for the same exclusion.                            |
| `NEXT_DIST_DIR`        | No       | `next.config.ts` | Overrides the build output directory. Defaults to `.next`.                                      |

### Creating a GitHub token

`GITHUB_TOKEN` is optional; public data works without it, but authenticated requests get a much higher hourly limit. To create a fine-grained token:

1. In GitHub, open Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Choose the resource owner and an expiry.
3. Under Repository access choose **Public repositories (read-only)**.
4. Leave every permission under Repository permissions, Account permissions and Organization permissions set to **No access**. The token only needs public repository metadata.
5. Generate the token and copy it once.
6. In Vercel, open the project → Settings → Environment Variables, add `GITHUB_TOKEN` with the token value for Production (add Preview and Development if wanted), and save. Redeploy so the deployment picks it up.
7. For local development, put `GITHUB_TOKEN=...` in `.env.local` (gitignored).

Do not prefix this variable with `NEXT_PUBLIC_`, and never commit the token. The GitHub client logs failures without the token or the `Authorization` header.

## What to fill in or verify

- `content/profile.json`: contact details are set for Sujal; review them when ready.
- `content/projects.json`: optional per-repo overrides keyed by GitHub repo name. Unmatched keys become manual projects.
- `content/festivals.json`: verify dates, gift closing lines and gift palettes. Movable festivals need explicit windows for future years; set `recurringYearly` only when the date is fixed.
- Add `GITHUB_TOKEN` to `.env.local` for higher GitHub API rate limits (optional; the build falls back gracefully).
- Seed achievements use `"placeholder": true`; they are visible locally but hidden from production builds. Replace them and remove the flag when ready.
- Put images in `public/uploads` and reference only the filename in content JSON (`"image": "project.png"`).
- `reference/README.md` is where Pinterest screenshots will go later.

## How to add content

1. Run `npm run add` and choose project, achievement or festival.
2. Answer the prompts. Optional fields can be left blank.
3. The CLI validates with the same Zod schemas as the site and writes the file for you.
4. Projects are written as repo-keyed overrides; achievements are appended newest first.

Using the files directly:

- `content/projects.json` — optional overrides keyed by GitHub repo name. Supported: `title`, `description`, `problem`, `role`, `contribution`, `image`, `tags`, `category`, `featured`, `status`, `hidden`, plus `repoUrl`, `liveUrl` and `date` for manual projects.
- Optional project context: `problem` (max 280 characters), `role` (max 80 characters) and `contribution` (max 400 characters). Use values such as `"<what problem this solves>"`, `"<your role>"` and `"<what you contributed>"`. They appear in a details list on Featured and Other project cards, never on Experiments, and come only from `content/projects.json`; GitHub cannot supply them.
- Unmatched project keys are rendered as manual projects.
- `content/achievements.json` — `issuer` is the issuer or event name.
- `content/festivals.json` — multiple `windows` and `gift` blocks (type, closing line, palette) are supported.

### Excluding repositories

The GitHub section skips the portfolio's own repo automatically:

- `excludeRepos` in `profile.json` is case-insensitive and seeded with `"portfolio"`.
- `VERCEL_GIT_REPO_SLUG` and `GITHUB_REPO` are also checked, so renaming the repo still works.
- Forks and archived repos are skipped unless `includeForks` or `includeArchived` is set to `true`.
- Add more repo names to `excludeRepos` to hide them from the list.

## Project categories

Projects are split into three categories. The two category topics are reserved and are never shown as tag chips.

| Category   | How to set it                                                                                                  | Where it appears                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Featured   | GitHub topic `portfolio-featured`, or `"category": "featured"` / `"featured": true` in `content/projects.json` | Home "Featured projects" and /projects "Featured projects" |
| Experiment | GitHub topic `portfolio-experiment`, or `"category": "experiment"` in `content/projects.json`                  | /projects "Experiments" (compact cards)                    |
| Discovered | Default when no category is set                                                                                | /projects "Other projects"                                 |

Precedence: `category` in `content/projects.json` wins over everything, then `featured: true`, then `portfolio-featured`, then `portfolio-experiment`, otherwise discovered. If a repo has both topics, featured wins and the build logs a warning. `hidden: true` still hides a project.

New public repositories are discovered by default. To change a category without editing code, add or remove the topic on GitHub; it takes effect within the repository cache window described below (stale 5 minutes, revalidate 1 hour, expire 1 day). Use `category` in `content/projects.json` for manual projects and explicit overrides.

The home page only shows featured projects with a non-empty description. A featured project without a description stays on /projects, is left off the home page, and logs a build warning. There is no "most recent" fallback.

## Repository discovery and caching

- `getAllPublicRepos` requests `GET https://api.github.com/users/<username>/repos?per_page=100&sort=updated`, adding `GITHUB_TOKEN` when it is set.
- Pagination follows the `Link` header's `rel="next"` URL, or requests the next page while a page is full. It stops when a page has fewer than 100 repositories or after 10 pages (1,000 repositories). Reaching the cap logs one warning and returns what it has with `truncated: true`.
- `getPublicRepos` applies the exclusions below, drops forks and archived repositories unless enabled, and sorts by stars then name.
- Successful lists are cached with `cacheLife("hours")`: `stale` 5 minutes (client), `revalidate` 1 hour (server), `expire` 1 day. Those are the exact `hours` preset values from the Next.js cacheLife docs.
- A failed request is never stored as a successful empty list. It uses a short inline profile (`stale` 30 seconds, `revalidate` 1 second, `expire` 5 minutes), and the last good list from the current server process is returned instead. With no good list, the page renders only local content (manual projects and overrides).
- The 1-second failure revalidation means requests after that second retry instead of waiting out the hourly window. A failed fetch also keeps the last good list available instead of replacing it.
- 403/429 responses with `x-ratelimit-remaining: 0` or `Retry-After` are rate limits: one log line includes the reset time and there is no immediate retry. 5xx responses and network errors get one retry after 250 ms. Malformed or non-array JSON is an `invalid_response` failure.
- If GitHub is unreachable during `next build`, the failure uses the short profile rather than the hourly one, so it is not baked in as a successful empty list. The build still completes, the first response uses local fallback, and the route retries after one second.

## Known limitations

- The default `use cache` handler is in memory. On serverless hosts entries can be lost between requests, and the in-process last-good list is lost on a cold start; the site then uses local content until the next successful fetch.
- Repository discovery stops at 1,000 repositories (10 pages of 100). Anything beyond is omitted and logged once.
- There is no webhook or on-demand revalidation. Successful lists update through hourly time-based revalidation (or the next deploy), so changes can take up to an hour to appear.
- Rate limits and network failures delay fresh data. A rate-limited response is not retried until a later request after the short failure window, and a 5xx or network failure gets only one retry.
- The portfolio repository is excluded by name. Keep `excludeRepos`, `VERCEL_GIT_REPO_SLUG` and `GITHUB_REPO` in sync if it is renamed.

## Themes

- The default look is a near-black terminal theme with JetBrains Mono headings, neon-green accents, a neural-network backdrop, a grid and subtle scanlines.
- A slim top-bar switch appears when a festival is scheduled, a festival page is open, or `?theme=<slug>` previews one.
- Turning it on applies the festival theme (`?theme=<slug>`); turning it off uses the default theme (`?theme=off`).
- Resolution order is URL param, saved choice in `localStorage`, page festival, scheduled festival, then default. Unknown URL slugs are ignored.
- Internal links preserve a manual `?theme` through `ThemedLink`.
- The switch updates with `history.replaceState` without reloading.
- `/festival/[slug]` uses its festival theme as the fallback, but the switch can still turn it off; canonical and Open Graph URLs stay clean.
- Gift chimes use a single Web Audio master gain. Use the top-bar Festival sound switch, the step-one sound choices, or `localStorage.setItem("festival-sound", "off")` to mute.
- Other festivals override CSS variables only.
- Animations are disabled under `prefers-reduced-motion`.

## Festival splash and gifts

- On the first visit each session with an active festival theme, the splash runs wish → gift → enter. `Skip` and Escape go straight to the site.
- Step one auto-advances after four seconds or via Continue; it also contains the sound/silent entry choices.
- Step two waits indefinitely for the gift. Click, tap, Enter or Space opens it; step three shows the festival closing line and the rocket entry.
- `Replay wish` in the top bar replays all three steps.
- Gift type, closing line and palette live in each `festivals.json` gift block. The wrapped box is the default; the detailed sweets layout remains available for festivals that opt in.
- To use sweet photos instead of the SVGs, add the matching images to `public/gifts`.
- Shareable gift pages live at `/festival/[slug]/gift?to=<name>`; names are sanitized and the page has a clean canonical URL.

## Deploying

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected Next.js settings. The build command is `npm run build`.
3. Add environment variables under Project → Settings → Environment Variables. See [Environment variables](#environment-variables) for the full table. `NEXT_PUBLIC_SITE_URL` should be the production URL; `GITHUB_TOKEN` is optional but recommended (see [Creating a GitHub token](#creating-a-github-token)). Vercel provides `VERCEL_GIT_REPO_SLUG`; `GITHUB_REPO` and `NEXT_DIST_DIR` are optional overrides.
4. Deploy.

GitHub repositories refresh by themselves through cached revalidation (see [Repository discovery and caching](#repository-discovery-and-caching)): stale 5 minutes, revalidate 1 hour, expire 1 day. Edits to `content/*.json` are read at build time, so redeploy after changing content or using `npm run add`. If `NEXT_PUBLIC_SITE_URL` is unset, metadata falls back to `https://sujalrastogi.vercel.app`.
