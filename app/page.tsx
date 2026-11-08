import type { Metadata } from "next";
import { AchievementsList } from "@/components/sections/AchievementsList";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { RepoList } from "@/components/sections/RepoList";
import { Skills } from "@/components/sections/Skills";
import { getLatestAchievements, getProfile } from "@/lib/content";
import { getPublicRepos } from "@/lib/github";
import { getProjects, selectFeaturedProjects } from "@/lib/projects";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const profile = getProfile();
  const [projects, repos] = await Promise.all([
    getProjects(profile),
    getPublicRepos(profile),
  ]);
  const featuredProjects = selectFeaturedProjects(projects);
  const latestAchievements = getLatestAchievements(2);

  return (
    <>
      <Hero profile={profile} />

      {featuredProjects.length > 0 ? (
        <ProjectsGrid
          intro="Selected work across Python, C and security tooling."
          projects={featuredProjects}
          title="Featured projects"
          viewAllHref="/projects"
        />
      ) : null}

      {latestAchievements.length > 0 ? (
        <AchievementsList
          achievements={latestAchievements}
          intro="Recent milestones and things I am learning from."
          title="Latest achievements"
          viewAllHref="/achievements"
        />
      ) : null}

      <Skills skills={profile.skills} />

      <RepoList repos={repos} username={profile.githubUsername} />

      <Contact profile={profile} />
    </>
  );
}
