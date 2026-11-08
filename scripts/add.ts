import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  select,
  text,
  type Option,
} from "@clack/prompts";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { z } from "zod";
import {
  achievementSchema,
  achievementsSchema,
  festivalSchema,
  festivalsSchema,
  projectOverrideSchema,
  projectOverridesSchema,
  type Achievement,
  type Festival,
  type ProjectOverride,
  type ProjectStatus,
} from "../lib/schema";

type ContentKind = "project" | "achievement" | "festival";

const contentDirectory = join(process.cwd(), "content");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function stop(message = "Cancelled."): never {
  cancel(message);
  process.exit(0);
}

function failure(message: string): never {
  log.error(message);
  process.exit(1);
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".");
      return `  - ${field || "(root)"}: ${issue.message}`;
    })
    .join("\n");
}

async function askText(
  message: string,
  options: {
    defaultValue?: string;
    placeholder?: string;
    required?: boolean;
  } = {},
): Promise<string> {
  const value = await text({
    message,
    defaultValue: options.defaultValue,
    placeholder: options.placeholder,
    validate: (input) => {
      if (options.required && !input?.trim()) {
        return "This field is required.";
      }

      return undefined;
    },
  });

  if (isCancel(value)) {
    stop();
  }

  return value.trim();
}

async function askConfirm(
  message: string,
  initialValue = true,
): Promise<boolean> {
  const value = await confirm({ message, initialValue });

  if (isCancel(value)) {
    stop();
  }

  return value;
}

async function askSelect<T extends string>(
  message: string,
  options: Option<T>[],
  initialValue: T,
): Promise<T> {
  const value = await select({ message, options, initialValue });

  if (isCancel(value)) {
    stop();
  }

  return value;
}

async function readEntries<T>(
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const filePath = join(contentDirectory, fileName);
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    failure(`Could not read ${fileName}. Run this from the project root.`);
  }

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failure(`${fileName} is not valid JSON: ${message}`);
  }

  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    failure(`Invalid ${fileName}:\n${formatIssues(parsed.error)}`);
  }

  return parsed.data;
}

async function writeEntries(fileName: string, entries: unknown): Promise<void> {
  await writeFile(
    join(contentDirectory, fileName),
    `${JSON.stringify(entries, null, 2)}\n`,
    "utf8",
  );
}

async function buildProject(): Promise<{
  key: string;
  override: ProjectOverride;
}> {
  const key = await askText("GitHub repo name (or manual project key)", {
    required: true,
  });
  const title = await askText("Title override (optional)");
  const description = await askText("Description override (optional)");
  const tags = splitList(
    await askText("Tags override (comma-separated, optional)"),
  );
  const image = await askText("Image filename in /public/uploads (optional)");
  const repoUrl = await askText(
    "Repository URL (manual projects only, optional)",
  );
  const liveUrl = await askText("Live URL (manual projects only, optional)");
  const date = await askText(
    "Date override (manual projects only, YYYY-MM-DD, optional)",
  );
  const featured = await askConfirm("Feature this project?", false);
  const status = await askSelect<ProjectStatus>(
    "Project status",
    [
      { value: "building", label: "Building" },
      { value: "done", label: "Done" },
      { value: "archived", label: "Archived" },
    ],
    "done",
  );
  const hidden = await askConfirm("Hide this project?", false);

  const parsed = projectOverrideSchema.safeParse({
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(image ? { image } : {}),
    ...(repoUrl ? { repoUrl } : {}),
    ...(liveUrl ? { liveUrl } : {}),
    ...(date ? { date } : {}),
    featured,
    status,
    hidden,
  });

  if (!parsed.success) {
    failure(`Invalid project override:\n${formatIssues(parsed.error)}`);
  }

  return { key, override: parsed.data };
}

async function buildAchievement(): Promise<Achievement> {
  const title = await askText("Achievement title", {
    required: true,
  });
  const id = await askText("Achievement id (slug)", {
    defaultValue: slugify(title),
    required: true,
  });
  const issuer = await askText("Issuer or event", {
    required: true,
  });
  const date = await askText("Date (YYYY-MM-DD)", {
    defaultValue: today(),
    required: true,
  });
  const description = await askText("Description", {
    required: true,
  });
  const link = await askText("Link (optional)");
  const image = await askText("Image filename in /public/uploads (optional)");
  const category = await askSelect<Achievement["category"]>(
    "Category",
    [
      { value: "hackathon", label: "Hackathon" },
      { value: "certificate", label: "Certificate" },
      { value: "award", label: "Award" },
      { value: "other", label: "Other" },
    ],
    "other",
  );

  const parsed = achievementSchema.safeParse({
    id,
    title,
    issuer,
    date,
    description,
    category,
    ...(link ? { link } : {}),
    ...(image ? { image } : {}),
  });

  if (!parsed.success) {
    failure(`Invalid achievement:\n${formatIssues(parsed.error)}`);
  }

  return parsed.data;
}

async function buildFestival(): Promise<Festival> {
  const name = await askText("Festival name", { required: true });
  const slug = await askText("Festival slug", {
    defaultValue: slugify(name),
    required: true,
  });
  const id = await askText("Festival id", {
    defaultValue: slug,
    required: true,
  });

  const windows: Festival["windows"] = [];

  do {
    const start = await askText("Window start (YYYY-MM-DD)", {
      required: true,
    });
    const end = await askText("Window end (YYYY-MM-DD)", {
      required: true,
    });

    windows.push({ start, end });
  } while (await askConfirm("Add another date window?", false));

  const recurringYearly = await askConfirm(
    "Repeat this window every year?",
    false,
  );
  const priorityRaw = await askText("Priority (higher wins overlaps)", {
    defaultValue: "50",
    required: true,
  });
  const themeClass = await askText("Theme class", {
    defaultValue: `theme-${slug}`,
    required: true,
  });
  const greeting = await askText("Greeting", {
    defaultValue: `Happy ${name}`,
    required: true,
  });
  const accentEmoji = await askText("Accent emoji", {
    defaultValue: "*",
    required: true,
  });
  const enabled = await askConfirm("Enable this festival?", true);

  const parsed = festivalSchema.safeParse({
    id,
    name,
    slug,
    windows,
    recurringYearly,
    priority: Number(priorityRaw),
    themeClass,
    greeting,
    accentEmoji,
    enabled,
  });

  if (!parsed.success) {
    failure(`Invalid festival:\n${formatIssues(parsed.error)}`);
  }

  return parsed.data;
}

function ensureUnique(entries: { id: string }[], item: { id: string }): void {
  if (entries.some((entry) => entry.id === item.id)) {
    failure(`An entry with id "${item.id}" already exists.`);
  }
}

async function addProject(): Promise<void> {
  const entries = await readEntries("projects.json", projectOverridesSchema);
  const { key, override } = await buildProject();

  if (Object.prototype.hasOwnProperty.call(entries, key)) {
    failure(`An entry for "${key}" already exists.`);
  }

  const next = Object.fromEntries(
    Object.entries({ ...entries, [key]: override }).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );

  await writeEntries("projects.json", next);
  outro(`Added project override for "${key}".`);
}

async function addAchievement(): Promise<void> {
  const entries = await readEntries("achievements.json", achievementsSchema);
  const achievement = await buildAchievement();
  ensureUnique(entries, achievement);

  const next = [...entries, achievement].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  await writeEntries("achievements.json", next);
  outro(`Added achievement "${achievement.title}".`);
}

async function addFestival(): Promise<void> {
  const entries = await readEntries("festivals.json", festivalsSchema);
  const festival = await buildFestival();
  ensureUnique(entries, festival);

  if (entries.some((entry) => entry.slug === festival.slug)) {
    failure(`A festival with slug "${festival.slug}" already exists.`);
  }

  const next = [...entries, festival].sort(
    (a, b) => b.priority - a.priority || a.name.localeCompare(b.name),
  );

  await writeEntries("festivals.json", next);
  outro(`Added festival "${festival.name}".`);
}

async function main(): Promise<void> {
  intro("Add content");

  const kind = await askSelect<ContentKind>(
    "What are you adding?",
    [
      { value: "project", label: "Project" },
      { value: "achievement", label: "Achievement" },
      { value: "festival", label: "Festival" },
    ],
    "project",
  );

  if (kind === "project") {
    await addProject();
    return;
  }

  if (kind === "achievement") {
    await addAchievement();
    return;
  }

  await addFestival();
}

main().catch((error: unknown) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
