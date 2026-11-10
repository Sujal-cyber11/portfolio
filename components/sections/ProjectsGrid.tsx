import Image from "next/image";
import { ThemedLink } from "@/components/theme/ThemedLink";
import { formatMonthYear } from "@/lib/format";
import type { ProjectView } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/schema";
import styles from "./ProjectsGrid.module.css";

const statusLabels: Record<ProjectStatus, string> = {
  building: "Building",
  done: "Done",
  archived: "Archived",
};

interface ProjectsGridProps {
  id?: string;
  title: string;
  intro?: string;
  projects: ProjectView[];
  viewAllHref?: string;
  emptyMessage?: string;
  variant?: "default" | "compact";
}

export function ProjectsGrid({
  id = "projects",
  title,
  intro,
  projects,
  viewAllHref,
  emptyMessage = "No projects yet.",
  variant = "default",
}: ProjectsGridProps) {
  const headingId = `${id}-title`;
  const isCompact = variant === "compact";
  const gridClassName = isCompact
    ? `${styles.grid} ${styles.gridCompact}`
    : styles.grid;
  const cardClassName = isCompact
    ? `${styles.card} ${styles.compact}`
    : styles.card;

  return (
    <section className="section" id={id} aria-labelledby={headingId}>
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Work</p>
            <h2 id={headingId}>{title}</h2>
            {intro ? <p>{intro}</p> : null}
          </div>
          {viewAllHref ? (
            <ThemedLink className={styles.viewAll} href={viewAllHref}>
              View all projects
            </ThemedLink>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <p className="muted">{emptyMessage}</p>
        ) : (
          <div className={gridClassName}>
            {projects.map((project) => (
              <article className={cardClassName} key={project.id}>
                {isCompact ? null : (
                  <div className={styles.media}>
                    {project.image ? (
                      <Image
                        alt={`${project.title} preview`}
                        className={styles.image}
                        fill
                        sizes="(max-width: 48rem) 100vw, (max-width: 72rem) 50vw, 33vw"
                        src={`/uploads/${project.image}`}
                      />
                    ) : (
                      <span className={styles.monogram} aria-hidden="true">
                        {project.title.slice(0, 1)}
                      </span>
                    )}
                    <span className={styles.status}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                )}

                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3>{project.title}</h3>
                    <time dateTime={project.date}>
                      {formatMonthYear(project.date)}
                    </time>
                  </div>

                  {!isCompact && project.description.trim().length > 0 ? (
                    <p className={styles.description}>{project.description}</p>
                  ) : null}

                  {!isCompact &&
                  (project.problem || project.role || project.contribution) ? (
                    <dl className={styles.details}>
                      {project.problem ? (
                        <>
                          <dt>Problem</dt>
                          <dd>{project.problem}</dd>
                        </>
                      ) : null}
                      {project.role ? (
                        <>
                          <dt>My role</dt>
                          <dd>{project.role}</dd>
                        </>
                      ) : null}
                      {project.contribution ? (
                        <>
                          <dt>Contribution</dt>
                          <dd>{project.contribution}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : null}

                  <div className={styles.footer}>
                    {project.tags.length > 0 ? (
                      <ul className={styles.tags} aria-label="Tags">
                        {project.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}

                    {project.stars !== null || project.language !== null ? (
                      <p className={styles.repoMeta}>
                        {project.stars !== null ? (
                          <span>{project.stars} stars</span>
                        ) : null}
                        {project.language ? (
                          <span>{project.language}</span>
                        ) : null}
                      </p>
                    ) : null}

                    {project.repoUrl || project.liveUrl ? (
                      <div className={styles.links}>
                        {project.repoUrl ? (
                          <a
                            href={project.repoUrl}
                            aria-label={`${project.title} repository`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Repository
                          </a>
                        ) : null}
                        {project.liveUrl ? (
                          <a
                            href={project.liveUrl}
                            aria-label={`${project.title} live site`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Live site
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
