import type { RepoSummary } from "@/lib/github";
import { formatMonthYear } from "@/lib/format";
import styles from "./RepoList.module.css";

interface RepoListProps {
  id?: string;
  title?: string;
  intro?: string;
  username: string;
  repos: RepoSummary[];
}

export function RepoList({
  id = "repos",
  title = "GitHub repositories",
  intro = "Public repositories pulled from the GitHub API and refreshed hourly.",
  username,
  repos,
}: RepoListProps) {
  const headingId = `${id}-title`;
  const profileUrl = `https://github.com/${encodeURIComponent(username)}`;

  return (
    <section className="section" id={id} aria-labelledby={headingId}>
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Open source</p>
            <h2 id={headingId}>{title}</h2>
            <p>{intro}</p>
          </div>
          <a className={styles.viewAll} href={profileUrl}>
            GitHub profile
          </a>
        </div>

        {repos.length === 0 ? (
          <p className="muted">
            No public repositories are available yet. Set{" "}
            <code>githubUsername</code> in content/profile.json, add an optional
            GITHUB_TOKEN for higher rate limits, then rebuild.
          </p>
        ) : (
          <ul className={styles.grid}>
            {repos.map((repo) => (
              <li key={repo.name}>
                <article className={styles.card}>
                  <div className={styles.header}>
                    <h3>
                      <a
                        href={repo.url}
                        aria-label={`${repo.name} on GitHub`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {repo.name}
                      </a>
                    </h3>
                    <span
                      className={styles.stars}
                      aria-label={`${repo.stars} stars`}
                    >
                      ★ {repo.stars}
                    </span>
                  </div>

                  <p className={styles.description}>
                    {repo.description || "No description provided."}
                  </p>

                  {repo.topics.length > 0 ? (
                    <ul className={styles.topics} aria-label="Topics">
                      {repo.topics.slice(0, 4).map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className={styles.meta}>
                    {repo.language ? <span>{repo.language}</span> : null}
                    {repo.updatedAt.length >= 10 ? (
                      <span>
                        Updated {formatMonthYear(repo.updatedAt.slice(0, 10))}
                      </span>
                    ) : null}
                    {repo.fork ? <span>Fork</span> : null}
                    {repo.archived ? <span>Archived</span> : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
