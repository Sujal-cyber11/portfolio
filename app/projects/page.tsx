import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { getProfile } from "@/lib/content";
import { getProjects } from "@/lib/projects";
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

  return (
    <>
      <div className="container page-intro">
        <p className="eyebrow">Projects</p>
        <h1>Things I have built and broken</h1>
        <p>
          A mix of finished tools, ongoing experiments and low-level exercises.
        </p>
      </div>

      {projects.length > 0 ? (
        <ProjectsGrid
          intro="Sorted newest first."
          projects={projects}
          title="All projects"
        />
      ) : null}
    </>
  );
}
