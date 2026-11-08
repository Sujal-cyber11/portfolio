import { ThemedLink } from "@/components/theme/ThemedLink";
import type { Profile } from "@/lib/schema";
import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  profile: Profile;
}

export function SiteHeader({ profile }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <ThemedLink
          className={styles.brand}
          href="/"
          aria-label={`${profile.name} — home`}
        >
          <span className={styles.mark} aria-hidden="true">
            {profile.name.slice(0, 1)}
          </span>
          <span>{profile.name}</span>
        </ThemedLink>

        <nav className={styles.nav} aria-label="Primary">
          <ThemedLink href="/">Home</ThemedLink>
          <ThemedLink href="/projects">Projects</ThemedLink>
          <ThemedLink href="/achievements">Achievements</ThemedLink>
          <ThemedLink href="/#contact">Contact</ThemedLink>
        </nav>
      </div>
    </header>
  );
}
