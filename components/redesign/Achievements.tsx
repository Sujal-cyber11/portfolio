import Image from "next/image";
import { getAchievements } from "@/lib/content";
import styles from "./Achievements.module.css";

export function Achievements() {
  const [achievement] = getAchievements();

  if (!achievement) {
    return null;
  }

  const accent = "Hack";
  const hasAccent = achievement.title.endsWith(accent);
  const eventLead = hasAccent
    ? achievement.title.slice(0, -accent.length)
    : achievement.title;
  const eventAccent = hasAccent ? accent : "";
  const label = `${achievement.category.toUpperCase()} · ${achievement.date.slice(0, 4)}`;
  const details = achievement.eventDetails ?? [];

  return (
    <section className={styles.achievements} id="achievements">
      <div className={styles.inner}>
        <div className={styles.headingWrap} data-reveal>
          <h2 className={styles.heading}>Achievements</h2>
        </div>

        <article className={styles.card} data-reveal>
          <div className={styles.left}>
            <p className={styles.label}>
              <span aria-hidden="true" className={styles.dot} />
              {label}
            </p>
            {achievement.placement ? (
              <p className={styles.placement}>{achievement.placement}</p>
            ) : null}
            {achievement.outOf ? (
              <p className={styles.outOf}>
                of <strong>{achievement.outOf.replace(/^of /, "")}</strong>
              </p>
            ) : null}
          </div>

          <div className={styles.right}>
            <p className={styles.event}>
              {eventLead}
              {eventAccent ? (
                <span className={styles.accent}>{eventAccent}</span>
              ) : null}
            </p>
            {achievement.round ? (
              <p className={styles.round}>{achievement.round}</p>
            ) : null}
            {details.length > 0 ? (
              <ul className={styles.details}>
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}

            {achievement.image ? (
              <a
                aria-label={`Open the ${achievement.title} certificate in a new tab`}
                className={styles.certificateLink}
                href={`/uploads/${achievement.image}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Image
                  alt={
                    achievement.imageAlt ?? `${achievement.title} certificate`
                  }
                  className={styles.certificate}
                  height={2053}
                  sizes="(max-width: 56rem) 85vw, 16rem"
                  src={`/uploads/${achievement.image}`}
                  width={2916}
                />
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
