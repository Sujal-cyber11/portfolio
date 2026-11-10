import type { ProjectCategory, ProjectOverride } from "@/lib/schema";

export const FEATURED_TOPIC = "portfolio-featured";
export const EXPERIMENT_TOPIC = "portfolio-experiment";

const CATEGORY_TOPICS = new Set([FEATURED_TOPIC, EXPERIMENT_TOPIC]);

export interface CategoryDecision {
  category: ProjectCategory;
  conflictingTopics: boolean;
}

type CategoryOverride = Pick<ProjectOverride, "category" | "featured">;

function normalize(topic: string): string {
  return topic.trim().toLowerCase();
}

export function isCategoryTopic(topic: string): boolean {
  return CATEGORY_TOPICS.has(normalize(topic));
}

export function withoutCategoryTopics(topics: readonly string[]): string[] {
  return topics.filter((topic) => !isCategoryTopic(topic));
}

export function classifyProject(
  topics: readonly string[],
  override?: CategoryOverride,
): CategoryDecision {
  if (override?.category) {
    return { category: override.category, conflictingTopics: false };
  }

  if (override?.featured === true) {
    return { category: "featured", conflictingTopics: false };
  }

  const normalized = new Set(topics.map((topic) => normalize(topic)));
  const featured = normalized.has(FEATURED_TOPIC);
  const experiment = normalized.has(EXPERIMENT_TOPIC);

  if (featured && experiment) {
    return { category: "featured", conflictingTopics: true };
  }

  if (featured) {
    return { category: "featured", conflictingTopics: false };
  }

  if (experiment) {
    return { category: "experiment", conflictingTopics: false };
  }

  return { category: "discovered", conflictingTopics: false };
}
