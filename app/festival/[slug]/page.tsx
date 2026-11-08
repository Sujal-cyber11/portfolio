import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemedLink } from "@/components/theme/ThemedLink";
import { getFestivals } from "@/lib/content";
import { formatReadableDate } from "@/lib/format";
import { buildPageMetadata } from "@/lib/seo";
import styles from "./festival.module.css";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getFestivals().map((festival) => ({ slug: festival.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/festival/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const festival = getFestivals().find((entry) => entry.slug === slug);

  if (!festival) {
    return { title: "Festival not found" };
  }

  return buildPageMetadata({
    title: festival.greeting,
    description: `The ${festival.name} theme on Sujal's portfolio.`,
    path: `/festival/${festival.slug}`,
  });
}

export default async function FestivalPage({
  params,
}: PageProps<"/festival/[slug]">) {
  const { slug } = await params;
  const festival = getFestivals().find((entry) => entry.slug === slug);

  if (!festival) {
    notFound();
  }

  return (
    <section className={styles.page} aria-labelledby="festival-title">
      <div className={`container ${styles.inner}`}>
        <p className={styles.emoji} aria-hidden="true">
          {festival.accentEmoji}
        </p>
        <p className="eyebrow">Festival theme</p>
        <h1 id="festival-title">{festival.greeting}</h1>
        <p className={styles.name}>{festival.name}</p>
        <p className={styles.copy}>
          This screen forces the {festival.name} palette and decoration. Return
          to the rest of the site to see the theme applied in context.
        </p>

        <ul className={styles.windows} aria-label="Festival dates">
          {festival.windows.map((window) => (
            <li key={`${window.start}-${window.end}`}>
              {window.start === window.end
                ? formatReadableDate(window.start)
                : `${formatReadableDate(window.start)} – ${formatReadableDate(window.end)}`}
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <ThemedLink className={styles.primary} href="/">
            Back to portfolio
          </ThemedLink>
          <ThemedLink className={styles.secondary} href="/projects">
            See projects
          </ThemedLink>
        </div>
      </div>
    </section>
  );
}
