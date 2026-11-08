import { ThemedLink } from "@/components/theme/ThemedLink";
import type { Profile } from "@/lib/schema";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  profile: Profile;
}

export function SiteFooter({ profile }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.name}>{profile.name}</p>

        <nav className={styles.links} aria-label="Footer">
          {profile.socials.map((social) => (
            <a key={social.label} href={social.url}>
              {social.label}
            </a>
          ))}
          <a href={`mailto:${profile.email}`}>Email</a>
          <ThemedLink href="/#contact">Contact</ThemedLink>
        </nav>
      </div>
    </footer>
  );
}
