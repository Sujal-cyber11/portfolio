import Image from "next/image";
import { ThemedLink } from "@/components/theme/ThemedLink";
import { formatReadableDate } from "@/lib/format";
import type { Achievement, AchievementCategory } from "@/lib/schema";
import styles from "./AchievementsList.module.css";

const categoryLabels: Record<AchievementCategory, string> = {
  hackathon: "Hackathon",
  certificate: "Certificate",
  award: "Award",
  other: "Other",
};

interface AchievementsListProps {
  id?: string;
  title: string;
  intro?: string;
  achievements: Achievement[];
  viewAllHref?: string;
  emptyMessage?: string;
}

export function AchievementsList({
  id = "achievements",
  title,
  intro,
  achievements,
  viewAllHref,
  emptyMessage = "No achievements yet.",
}: AchievementsListProps) {
  const headingId = `${id}-title`;

  return (
    <section className="section" id={id} aria-labelledby={headingId}>
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Milestones</p>
            <h2 id={headingId}>{title}</h2>
            {intro ? <p>{intro}</p> : null}
          </div>
          {viewAllHref ? (
            <ThemedLink className={styles.viewAll} href={viewAllHref}>
              View all achievements
            </ThemedLink>
          ) : null}
        </div>

        {achievements.length === 0 ? (
          <p className="muted">{emptyMessage}</p>
        ) : (
          <ol className={styles.list}>
            {achievements.map((achievement) => (
              <li key={achievement.id}>
                <article className={styles.item}>
                  {achievement.image ? (
                    <div className={styles.media}>
                      <Image
                        alt={
                          achievement.imageAlt ??
                          `${achievement.title} certificate`
                        }
                        className={styles.image}
                        fill
                        sizes="8rem"
                        src={`/uploads/${achievement.image}`}
                      />
                    </div>
                  ) : null}

                  <div className={styles.content}>
                    <div className={styles.meta}>
                      <span className={styles.category}>
                        {categoryLabels[achievement.category]}
                      </span>
                      <time dateTime={achievement.date}>
                        {formatReadableDate(achievement.date)}
                      </time>
                    </div>

                    <h3>{achievement.title}</h3>
                    <p className={styles.issuer}>{achievement.issuer}</p>
                    <p className={styles.description}>
                      {achievement.description}
                    </p>

                    {achievement.link ? (
                      <a
                        className={styles.link}
                        href={achievement.link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        More details
                      </a>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
