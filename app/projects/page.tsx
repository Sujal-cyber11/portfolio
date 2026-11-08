import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { getProjects } from "@/lib/content";
import { enrichProjects } from "@/lib/github";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Projects",
  description:
    "Python tools, C systems exercises and security experiments built by Sujal.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await enrichProjects(getProjects());

  return (
    <>
      <div className="container page-intro">
        <p className="eyebrow">Projects</p>
        <h1>Things I have built and broken</h1>
        <p>
          A mix of finished tools, ongoing experiments and low-level exercises.
          Every entry is loaded from validated content files.
        </p>
      </div>

      <ProjectsGrid
        intro="Sorted newest first."
        projects={projects}
        title="All projects"
      />
    </>
  );
}
