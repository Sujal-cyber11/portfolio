import type { Metadata } from "next";
import { AchievementsList } from "@/components/sections/AchievementsList";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { RepoList } from "@/components/sections/RepoList";
import { Skills } from "@/components/sections/Skills";
import {
  getFeaturedProjects,
  getLatestAchievements,
  getProfile,
} from "@/lib/content";
import { enrichProjects, getPublicRepos } from "@/lib/github";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const profile = getProfile();
  const [featuredProjects, repos] = await Promise.all([
    enrichProjects(getFeaturedProjects()),
    getPublicRepos(profile),
  ]);
  const latestAchievements = getLatestAchievements(2);

  return (
    <>
      <Hero profile={profile} />

      <ProjectsGrid
        intro="Selected work across Python, C and security tooling."
        projects={featuredProjects}
        title="Featured projects"
        viewAllHref="/projects"
      />

      <AchievementsList
        achievements={latestAchievements}
        intro="Recent milestones and things I am learning from."
        title="Latest achievements"
        viewAllHref="/achievements"
      />

      <Skills skills={profile.skills} />

      <RepoList repos={repos} username={profile.githubUsername} />

      <Contact profile={profile} />
    </>
  );
}
