import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { getProfile } from "@/lib/content";
import { getProjects, groupProjectsByCategory } from "@/lib/projects";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Projects",
  description:
    "Python tools, C systems exercises and security experiments built by Sujal.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const profile = getProfile();
  const projects = await getProjects(profile);
  const categories = groupProjectsByCategory(projects);

  return (
    <>
      <div className="container page-intro">
        <p className="eyebrow">Projects</p>
        <h1>Things I have built and broken</h1>
        <p>
          A mix of finished tools, ongoing experiments and low-level exercises.
        </p>
      </div>

      {categories.featured.length > 0 ? (
        <ProjectsGrid
          id="featured-projects"
          projects={categories.featured}
          title="Featured projects"
        />
      ) : null}

      {categories.discovered.length > 0 ? (
        <ProjectsGrid
          id="other-projects"
          projects={categories.discovered}
          title="Other projects"
        />
      ) : null}

      {categories.experiment.length > 0 ? (
        <ProjectsGrid
          id="experiments"
          projects={categories.experiment}
          title="Experiments"
          variant="compact"
        />
      ) : null}
    </>
  );
}
