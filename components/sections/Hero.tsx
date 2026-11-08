import { ThemedLink } from "@/components/theme/ThemedLink";
import type { Profile } from "@/lib/schema";
import styles from "./Hero.module.css";

interface HeroProps {
  profile: Profile;
}

export function Hero({ profile }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className="eyebrow">Portfolio</p>
          <h1 id="hero-title" className={styles.title}>
            {profile.name}
          </h1>
          <p className={styles.tagline}>{profile.tagline}</p>
          <p className={styles.bio}>{profile.bio}</p>

          <div className={styles.actions}>
            <ThemedLink className={styles.primary} href="/projects">
              See projects
            </ThemedLink>
            <ThemedLink className={styles.secondary} href="#contact">
              Contact me
            </ThemedLink>
            <a className={styles.textLink} href={profile.resumeUrl}>
              Resume
            </a>
          </div>
        </div>

        <aside className={styles.card} aria-label="Current focus">
          <p className={styles.cardLabel}>Skills snapshot</p>
          <p className={styles.cardTitle}>Core skills</p>
          <ul className={styles.cardList}>
            {profile.skills.slice(0, 4).map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
          <p className={styles.cardFooter}>
            Open to internships and early-stage collaborations.
          </p>
        </aside>
      </div>
    </section>
  );
}
