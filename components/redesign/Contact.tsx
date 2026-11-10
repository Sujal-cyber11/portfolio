import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { CopyEmailButton } from "@/components/redesign/CopyEmailButton";
import type { Profile } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site";
import styles from "./Contact.module.css";

export function Contact({ profile }: { profile: Profile }) {
  const siteUrl = getSiteUrl();
  const siteLabel = siteUrl.replace(/^https?:\/\//, "");
  const accounts = [
    {
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
    },
    ...profile.socials.map((social) => ({
      label: social.label,
      value:
        social.handle ??
        social.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      href: social.url,
    })),
  ];

  return (
    <section className={styles.contact} id="contact">
      <div className={styles.inner}>
        <h2 className={styles.heading} data-reveal>
          Let&apos;s work <span>together.</span>
        </h2>

        <div className={styles.accounts}>
          {accounts.map((account, index) => {
            const delay = {
              "--reveal-delay": `${index * 60}ms`,
            } as CSSProperties;

            if (account.label === "Email") {
              return (
                <div
                  className={`${styles.accountRow} ${styles.emailRow}`}
                  data-reveal
                  key={account.label}
                  style={delay}
                >
                  <a
                    aria-label={`Email: ${account.value}`}
                    className={styles.rowLink}
                    href={account.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                  <span className={styles.accountLabel}>{account.label}</span>
                  <span className={styles.accountRight}>
                    <span className={styles.accountValue}>{account.value}</span>
                    <CopyEmailButton email={profile.email} />
                    <ArrowUpRight
                      aria-hidden="true"
                      className={styles.accountArrow}
                      size={15}
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
              );
            }

            return (
              <a
                aria-label={`${account.label}: ${account.value}`}
                className={styles.accountRow}
                data-reveal
                href={account.href}
                key={account.label}
                rel="noopener noreferrer"
                style={delay}
                target="_blank"
              >
                <span className={styles.accountLabel}>{account.label}</span>
                <span className={styles.accountRight}>
                  <span className={styles.accountValue}>{account.value}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className={styles.accountArrow}
                    size={15}
                    strokeWidth={1.8}
                  />
                </span>
              </a>
            );
          })}
        </div>

        <p className={styles.site}>
          <a href={siteUrl}>{siteLabel}</a>
        </p>
      </div>
    </section>
  );
}
