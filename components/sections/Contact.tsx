import type { Profile } from "@/lib/schema";
import styles from "./Contact.module.css";

interface ContactProps {
  profile: Profile;
}

export function Contact({ profile }: ContactProps) {
  return (
    <section className="section" id="contact" aria-labelledby="contact-title">
      <div className="container">
        <div className={styles.panel}>
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">Get in touch</h2>
            <p className={styles.copy}>
              The fastest way to reach me is email.
            </p>
          </div>

          <div className={styles.actions}>
            <a className={styles.primary} href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <a className={styles.secondary} href={profile.resumeUrl}>
              View resume
            </a>
          </div>

          <ul className={styles.socials} aria-label="Social links">
            {profile.socials.map((social) => (
              <li key={social.label}>
                <a href={social.url} rel="noreferrer" target="_blank">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
