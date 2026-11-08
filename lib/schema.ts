import { z } from "zod";

const uploadFilename = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Use a bare filename from /public/uploads (no folders or URLs).",
  );

const isoDate = z.iso.date();

const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and dashes.",
  );

export const socialSchema = z
  .object({
    label: z.string().trim().min(1),
    url: z.url(),
  })
  .strict();

export const profileSchema = z
  .object({
    name: z.string().trim().min(1),
    tagline: z.string().trim().min(1),
    bio: z.string().trim().min(1),
    skills: z.array(z.string().trim().min(1)).min(1),
    socials: z.array(socialSchema),
    email: z.email(),
    resumeUrl: z.string().trim().min(1),
    githubUsername: z.string().trim().min(1),
    excludeRepos: z.array(z.string().trim().min(1)),
    includeForks: z.boolean(),
    includeArchived: z.boolean(),
  })
  .strict();

export const projectStatusSchema = z.enum(["building", "done", "archived"]);

export const projectOverrideSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    image: uploadFilename.optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    featured: z.boolean().optional(),
    status: projectStatusSchema.optional(),
    hidden: z.boolean().optional(),
    repoUrl: z.url().optional(),
    liveUrl: z.url().optional(),
    date: isoDate.optional(),
  })
  .strict();

export const achievementCategorySchema = z.enum([
  "hackathon",
  "certificate",
  "award",
  "other",
]);

export const achievementSchema = z
  .object({
    id: slug,
    title: z.string().trim().min(1),
    issuer: z.string().trim().min(1),
    date: isoDate,
    description: z.string().trim().min(1),
    link: z.url().optional(),
    image: uploadFilename.optional(),
    category: achievementCategorySchema,
    placeholder: z.boolean().optional(),
  })
  .strict();

export const festivalWindowSchema = z
  .object({
    start: isoDate,
    end: isoDate,
  })
  .strict();

export const festivalSchema = z
  .object({
    id: slug,
    name: z.string().trim().min(1),
    slug,
    windows: z.array(festivalWindowSchema).min(1),
    recurringYearly: z.boolean(),
    priority: z.number().int(),
    themeClass: z.string().regex(/^theme-[a-z0-9-]+$/),
    greeting: z.string().trim().min(1),
    accentEmoji: z.string().trim().min(1),
    enabled: z.boolean(),
  })
  .strict();

export const projectOverridesSchema = z.record(
  z.string().trim().min(1),
  projectOverrideSchema,
);
export const achievementsSchema = z.array(achievementSchema);
export const festivalsSchema = z.array(festivalSchema);

export type Social = z.infer<typeof socialSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectOverride = z.infer<typeof projectOverrideSchema>;
export type ProjectOverrides = z.infer<typeof projectOverridesSchema>;
export type AchievementCategory = z.infer<typeof achievementCategorySchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type FestivalWindow = z.infer<typeof festivalWindowSchema>;
export type Festival = z.infer<typeof festivalSchema>;
