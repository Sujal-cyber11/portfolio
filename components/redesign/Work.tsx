import { WorkDeck } from "@/components/redesign/WorkDeck";
import type { WorkProject } from "@/lib/landing-data";

export function Work({ projects }: { projects: WorkProject[] }) {
  return <WorkDeck projects={projects} />;
}
