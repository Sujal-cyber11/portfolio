import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FestivalGift } from "@/components/festival/gift/FestivalGift";
import { ThemedLink } from "@/components/theme/ThemedLink";
import { getFestivals } from "@/lib/content";
import { sanitizeRecipientName } from "@/lib/sanitize";
import { buildPageMetadata } from "@/lib/seo";
import type { Festival } from "@/lib/schema";
import styles from "./gift.module.css";

export function generateStaticParams() {
  return getFestivals().map((festival) => ({ slug: festival.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/festival/[slug]/gift">): Promise<Metadata> {
  const { slug } = await params;
  const festival = getFestivals().find((entry) => entry.slug === slug);

  if (!festival) {
    return { title: "Gift not found" };
  }

  return buildPageMetadata({
    title: `A ${festival.name} gift`,
    description: festival.gift.closingLine,
    path: `/festival/${festival.slug}/gift`,
  });
}

async function GiftWithRecipient({
  festival,
  searchParams,
}: {
  festival: Festival;
  searchParams: PageProps<"/festival/[slug]/gift">["searchParams"];
}) {
  const query = await searchParams;
  const recipient = sanitizeRecipientName(query.to);

  return <GiftContent festival={festival} recipient={recipient} />;
}

function GiftContent({
  festival,
  recipient,
}: {
  festival: Festival;
  recipient: string | null;
}) {
  return (
    <section
      aria-labelledby="gift-title"
      className={`${festival.themeClass} ${styles.page}`}
    >
      <div className={styles.inner}>
        <p className={styles.eyebrow}>A {festival.name} gift</p>
        <h1 className={styles.title} id="gift-title">
          {recipient ? `For ${recipient}` : "For you"}
        </h1>

        <FestivalGift
          className={styles.gift}
          festivalName={festival.name}
          gift={festival.gift}
          interactive={false}
          opened
        />

        <p className={styles.closingLine}>{festival.gift.closingLine}</p>

        <ThemedLink className={styles.back} href="/">
          Back to portfolio
        </ThemedLink>
      </div>
    </section>
  );
}

export default async function GiftPage({
  params,
  searchParams,
}: PageProps<"/festival/[slug]/gift">) {
  const { slug } = await params;
  const festival = getFestivals().find((entry) => entry.slug === slug);

  if (!festival) {
    notFound();
  }

  return (
    <Suspense fallback={<GiftContent festival={festival} recipient={null} />}>
      <GiftWithRecipient festival={festival} searchParams={searchParams} />
    </Suspense>
  );
}
