import styles from "./Skills.module.css";

interface SkillsProps {
  id?: string;
  title?: string;
  intro?: string;
  skills: string[];
}

export function Skills({
  id = "skills",
  title = "Skills",
  intro = "The tools and fundamentals I reach for most often.",
  skills,
}: SkillsProps) {
  const headingId = `${id}-title`;

  return (
    <section className="section" id={id} aria-labelledby={headingId}>
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Toolkit</p>
            <h2 id={headingId}>{title}</h2>
            <p>{intro}</p>
          </div>
        </div>

        <ul className={styles.grid}>
          {skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
