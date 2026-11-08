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
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run add        # content CLI
npm run format     # Prettier
```

## What to fill in or verify

- `content/profile.json`: contact details are set for Sujal; edit the resume value when ready.
- `content/projects.json`: optional per-repo overrides keyed by GitHub repo name. Unmatched keys become manual projects.
- `content/festivals.json`: verify all dates. Diwali and Holi are movable, so add explicit windows for future years or set `recurringYearly` only when the date is fixed.
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

- `content/projects.json` — optional overrides keyed by GitHub repo name. Supported: `title`, `description`, `image`, `tags`, `featured`, `status`, `hidden`, plus `repoUrl`, `liveUrl` and `date` for manual projects.
- Unmatched project keys are rendered as manual projects.
- `content/achievements.json` — `issuer` is the issuer or event name.
- `content/festivals.json` — multiple `windows` are supported for movable dates.

Featured projects use `"featured": true` overrides. If none are set, the three most recently pushed repos with descriptions are used.

### Excluding repositories

The GitHub section skips the portfolio's own repo automatically:

- `excludeRepos` in `profile.json` is case-insensitive and seeded with `"portfolio"`.
- `VERCEL_GIT_REPO_SLUG` and `GITHUB_REPO` are also checked, so renaming the repo still works.
- Forks and archived repos are skipped unless `includeForks` or `includeArchived` is set to `true`.
- Add more repo names to `excludeRepos` to hide them from the list.

## Themes

- The default look is a near-black terminal theme with JetBrains Mono headings, neon-green accents, a neural-network backdrop, a grid and subtle scanlines.
- A slim top-bar switch appears when a festival is scheduled, a festival page is open, or `?theme=<slug>` previews one.
- Turning it on applies the festival theme (`?theme=<slug>`); turning it off uses the default theme (`?theme=off`).
- Resolution order is URL param, saved choice in `localStorage`, page festival, scheduled festival, then default. Unknown URL slugs are ignored.
- Internal links preserve a manual `?theme` through `ThemedLink`.
- The switch updates with `history.replaceState` without reloading.
- `/festival/[slug]` uses its festival theme as the fallback, but the switch can still turn it off; canonical and Open Graph URLs stay clean.
- Diwali has the full warm-gold treatment and decorative diyas. Other festivals override CSS variables only.
- Animations are disabled under `prefers-reduced-motion`.

## Deploying

Push to GitHub and import the repo in Vercel. Set `NEXT_PUBLIC_SITE_URL` to the production URL and optionally `GITHUB_TOKEN`. If unset, metadata falls back to `https://sujalrastogi.vercel.app`. Content is read at build time, so redeploy after editing JSON or adding entries with `npm run add`.
