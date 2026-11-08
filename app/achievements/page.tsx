import { AchievementsList } from "@/components/sections/AchievementsList";
import { getAchievements } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Achievements",
  description: "Certificates, hackathons and awards collected by Sujal so far.",
  path: "/achievements",
});

export default function AchievementsPage() {
  const achievements = getAchievements();

  return (
    <>
      <div className="container page-intro">
        <p className="eyebrow">Achievements</p>
        <h1>Milestones so far</h1>
        <p>
          Results from courses, competitions and small open-source
          contributions. Placeholder entries are marked in the content files.
        </p>
      </div>

      <AchievementsList
        achievements={achievements}
        intro="Sorted newest first."
        title="All achievements"
      />
    </>
  );
}
