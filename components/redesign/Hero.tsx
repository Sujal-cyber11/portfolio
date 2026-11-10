import Image from "next/image";
import { TiltCard } from "@/components/redesign/TiltCard";
import type { Profile } from "@/lib/schema";
import styles from "./Hero.module.css";

export function Hero({ profile }: { profile: Profile }) {
  const [firstLine = "", serifLine = "", ...systemsWords] =
    profile.tagline.split(/\s+/);
  const systemsLine = systemsWords.join(" ");

  return (
    <section className={styles.hero} id="top">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={`${styles.chip} ${styles.chipSecurity}`}>
            Security
          </span>
          <span className={`${styles.chip} ${styles.chipPython}`}>Python</span>
          <span className={`${styles.chip} ${styles.chipC}`}>C</span>

          <p className={styles.label}>SUJAL · IT STUDENT · INDIA</p>

          <h1 className={styles.title}>
            <span className={styles.line}>{firstLine}</span>{" "}
            {serifLine ? (
              <span className={`${styles.line} ${styles.serifLine}`}>
                {serifLine}
              </span>
            ) : null}{" "}
            {systemsLine ? (
              <span className={`${styles.line} ${styles.systems}`}>
                {systemsLine}
              </span>
            ) : null}
          </h1>

          <div className={styles.textBlock}>
            <p className={styles.sub}>
              Python, C and security tooling. I like understanding software
              close to the machine.
            </p>
            <p className={styles.bio}>
              I&apos;m an <span>IT student</span> drawn to{" "}
              <span>cybersecurity</span> and <span>low-level systems</span>,
              building practical tools I can actually use.
            </p>
          </div>

          <div className={styles.actions}>
            <a className={styles.secondary} href="#work">
              See projects
            </a>
          </div>
        </div>

        <div className={styles.identityWrap}>
          <TiltCard className={styles.identityCard}>
            <div className={styles.illustrationWrap}>
              <Image
                alt="Neon hooded hacker avatar"
                className={styles.illustration}
                height={1230}
                sizes="(max-width: 56rem) 80vw, 23rem"
                src="/uploads/Neon Hooded Hacker Avatar.png"
                width={1278}
              />
            </div>
            <span className={styles.whoami}>&gt; WHOAMI</span>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
