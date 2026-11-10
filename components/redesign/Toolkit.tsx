import { GitFork, Globe } from "lucide-react";
import type { CSSProperties } from "react";
import { siC, siGit, siGithub, siPython, siTypescript } from "simple-icons";
import { toolkit } from "@/lib/landing-data";
import styles from "./Toolkit.module.css";

interface BrandIconData {
  hex: string;
  path: string;
}

function BrandIcon({
  icon,
  light = false,
}: {
  icon: BrandIconData;
  light?: boolean;
}) {
  return (
    <svg aria-hidden="true" className={styles.skillIcon} viewBox="0 0 24 24">
      <path d={icon.path} fill={light ? "currentColor" : `#${icon.hex}`} />
    </svg>
  );
}

function SkillIcon({ name }: { name: string }) {
  if (name === "Python") {
    return <BrandIcon icon={siPython} />;
  }

  if (name === "C") {
    return <BrandIcon icon={siC} />;
  }

  if (name === "Git & GitHub") {
    return (
      <span className={styles.iconGroup}>
        <BrandIcon icon={siGit} />
        <BrandIcon icon={siGithub} light />
      </span>
    );
  }

  if (name === "TypeScript") {
    return <BrandIcon icon={siTypescript} />;
  }

  if (name === "DSA") {
    return (
      <GitFork
        aria-hidden="true"
        className={`${styles.skillIcon} ${styles.genericIcon}`}
        size={18}
        strokeWidth={1.8}
      />
    );
  }

  return (
    <Globe
      aria-hidden="true"
      className={`${styles.skillIcon} ${styles.genericIcon}`}
      size={18}
      strokeWidth={1.8}
    />
  );
}

export function Toolkit() {
  return (
    <section className={styles.toolkit} id="toolkit">
      <div className={styles.inner}>
        <div className={styles.headingRow} data-reveal>
          <h2 className={styles.heading}>Toolkit</h2>
          <span aria-hidden="true" className={styles.watermark}>
            About
          </span>
        </div>

        <ul className={styles.pills}>
          {toolkit.map((item, index) => (
            <li
              data-reveal
              key={item}
              style={{ "--reveal-delay": `${index * 55}ms` } as CSSProperties}
            >
              <SkillIcon name={item} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
