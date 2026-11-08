import Image from "next/image";
import { ThemedLink } from "@/components/theme/ThemedLink";
import { formatMonthYear } from "@/lib/format";
import type { ProjectView } from "@/lib/github";
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
}

export function ProjectsGrid({
  id = "projects",
  title,
  intro,
  projects,
  viewAllHref,
  emptyMessage = "No projects yet.",
}: ProjectsGridProps) {
  const headingId = `${id}-title`;

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
          <div className={styles.grid}>
            {projects.map((project) => (
              <article className={styles.card} key={project.id}>
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

                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3>{project.title}</h3>
                    <time dateTime={project.date}>
                      {formatMonthYear(project.date)}
                    </time>
                  </div>

                  <p className={styles.description}>
                    {project.description || "Description coming soon."}
                  </p>

                  {project.tags.length > 0 ? (
                    <ul className={styles.tags} aria-label="Tags">
                      {project.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}

                  {project.repoMeta ? (
                    <p className={styles.repoMeta}>
                      <span>{project.repoMeta.name}</span>
                      <span>{project.repoMeta.stars} stars</span>
                      {project.repoMeta.language ? (
                        <span>{project.repoMeta.language}</span>
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
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
