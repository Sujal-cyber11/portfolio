import { cacheLife } from "next/cache";
import achievementsJson from "@/content/achievements.json";
import festivalsJson from "@/content/festivals.json";
import profileJson from "@/content/profile.json";
import projectsJson from "@/content/projects.json";
import type { z } from "zod";
import { filterVisibleEntries } from "@/lib/content-filter";
import { getActiveFestival } from "@/lib/festival";
import {
  achievementsSchema,
  festivalsSchema,
  profileSchema,
  projectsSchema,
  type Achievement,
  type Festival,
  type Profile,
  type Project,
} from "@/lib/schema";

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path
    .map((part, index) => {
      if (typeof part === "number") {
        return `[${part}]`;
      }
      if (typeof part === "string") {
        return index === 0 ? part : `.${part}`;
      }
      return "";
    })
    .join("");
}

function formatIssues(
  fileName: string,
  issues: ReadonlyArray<z.core.$ZodIssue>,
): string {
  return issues
    .map((issue) => {
      const path = [...issue.path];
      let entry = "";

      if (typeof path[0] === "number") {
        entry = ` entry #${path[0] + 1},`;
        path.shift();
      }

      const field = formatPath(path);
      const location = field ? `${entry} field "${field}"` : entry;

      return `  - ${fileName}${location}: ${issue.message}`;
    })
    .join("\n");
}

function loadContent<T>(
  fileName: string,
  schema: z.ZodType<T>,
  data: unknown,
): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      `[content] Invalid ${fileName}. Fix the following:\n${formatIssues(
        fileName,
        parsed.error.issues,
      )}`,
    );
  }

  return parsed.data;
}

const profile: Profile = loadContent(
  "content/profile.json",
  profileSchema,
  profileJson,
);
const projects: Project[] = loadContent(
  "content/projects.json",
  projectsSchema,
  projectsJson,
);
const achievements: Achievement[] = loadContent(
  "content/achievements.json",
  achievementsSchema,
  achievementsJson,
);
const festivals: Festival[] = loadContent(
  "content/festivals.json",
  festivalsSchema,
  festivalsJson,
);

const isProduction = process.env.NODE_ENV === "production";
const visibleProjects = filterVisibleEntries(projects, isProduction);
const visibleAchievements = filterVisibleEntries(achievements, isProduction);

const byDateDescending = <T extends { date: string }>(a: T, b: T): number =>
  b.date.localeCompare(a.date);

export function getProfile(): Profile {
  return profile;
}

export function getProjects(): Project[] {
  return [...visibleProjects].sort(byDateDescending);
}

export function getFeaturedProjects(): Project[] {
  return getProjects().filter((project) => project.featured);
}

export function getAchievements(): Achievement[] {
  return [...visibleAchievements].sort(byDateDescending);
}

export function getLatestAchievements(limit = 3): Achievement[] {
  return getAchievements().slice(0, limit);
}

export function getFestivals(): Festival[] {
  return [...festivals];
}

export async function getCurrentFestival(): Promise<Festival | null> {
  "use cache";
  cacheLife("hours");

  return getActiveFestival(new Date(), getFestivals());
}
