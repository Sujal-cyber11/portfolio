import type { ReactNode } from "react";
import styles from "./ProjectMockups.module.css";

type MockupTone = "green" | "violet" | "blue" | "amber";

function Command({ children }: { children: string }) {
  return (
    <div className={styles.command}>
      <span>{children}</span>
      <span aria-hidden="true" className={styles.caret} />
    </div>
  );
}

function Panel({ children, tone }: { children: ReactNode; tone: MockupTone }) {
  return (
    <div className={`${styles.panel} ${styles[tone]}`}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}

export function MedPulseMockup() {
  return (
    <Panel tone="green">
      <Command>$ medpulse compare</Command>
      <div className={styles.compare}>
        <div className={styles.row}>
          <span>Generic medicine A</span>
          <span>Listed</span>
        </div>
        <div className={`${styles.row} ${styles.cheapest}`}>
          <span className={styles.liveDot} />
          <span>Generic medicine B</span>
          <span>Cheapest</span>
        </div>
        <div className={styles.row}>
          <span>Lab test A</span>
          <span>Listed</span>
        </div>
        <div className={styles.row}>
          <span>Lab test B</span>
          <span>Listed</span>
        </div>
      </div>
      <p className={styles.caption}>
        <span className={styles.liveDot} /> Live comparison view
      </p>
    </Panel>
  );
}

export function TrustLensMockup() {
  return (
    <Panel tone="violet">
      <Command>$ trustlens scan</Command>
      <div className={styles.message}>
        <p>
          “Urgent: your refund is pending. Verify your account at the link
          below.”
        </p>
        <span className={styles.badge}>
          <span aria-hidden="true" className={styles.badgeDot} /> Scam detected
        </span>
      </div>
      <p className={styles.explanation}>
        Lookalike domain, urgency and a request for account details.
      </p>
    </Panel>
  );
}

export function JanSahayakMockup() {
  return (
    <Panel tone="blue">
      <Command>$ jan-sahayak</Command>
      <div className={styles.chat}>
        <div className={styles.userBubble}>
          <span>मुझे किस योजना के लिए पात्र हूँ?</span>
          <span>I&apos;m a student looking for support.</span>
        </div>
        <div className={styles.assistantBubble}>
          <span className={styles.assistantLabel}>Match</span>
          <p>These may apply:</p>
          <div className={styles.matchChips}>
            <span>Education</span>
            <span>Scholarship</span>
            <span>State scheme</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function BaseConverterMockup() {
  return (
    <Panel tone="amber">
      <Command>$ base-converter</Command>
      <div className={styles.baseGrid}>
        <div className={styles.baseCard}>
          <span className={styles.baseLabel}>base 10</span>
          <strong className={styles.baseValue}>255</strong>
        </div>
        <div className={styles.baseArrow} aria-hidden="true">
          →
        </div>
        <div className={styles.baseCard}>
          <span className={styles.baseLabel}>base 16</span>
          <strong className={styles.baseValue}>FF</strong>
        </div>
      </div>
      <p className={styles.explanation}>
        Whole and fractional values convert between bases 2 to 36.
      </p>
    </Panel>
  );
}

export function ProjectMockup({ id }: { id: string }) {
  if (id === "medpulse") {
    return <MedPulseMockup />;
  }

  if (id === "trustlens") {
    return <TrustLensMockup />;
  }

  if (id === "base-converter") {
    return <BaseConverterMockup />;
  }

  return <JanSahayakMockup />;
}
