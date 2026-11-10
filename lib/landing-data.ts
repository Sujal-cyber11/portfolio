import type { Profile, ProjectOverrides } from "@/lib/schema";

export interface WorkProject {
  id: string;
  number: string;
  title: string;
  description: string;
  tags: string[];
  topTag: string;
  repoUrl: string;
  liveUrl?: string;
  tone: "green" | "violet" | "blue" | "amber";
}

function findOverride(overrides: ProjectOverrides, key: string) {
  return Object.entries(overrides).find(
    ([name]) => name.toLowerCase() === key.toLowerCase(),
  )?.[1];
}

export function buildWorkProjects(
  profile: Profile,
  overrides: ProjectOverrides,
): WorkProject[] {
  const medPulse = findOverride(overrides, "MedPulse");
  const github = (repo: string) =>
    `https://github.com/${profile.githubUsername}/${repo}`;

  return [
    {
      id: "medpulse",
      number: "01",
      title: "MedPulse",
      description:
        "Price comparison for Indian medicines and lab tests. Logic and backend.",
      tags: ["Python", "Backend", "Live"],
      topTag: "Live",
      repoUrl:
        medPulse?.repoUrl ?? "https://github.com/IMMENSE-BUILDER/MedPulse",
      liveUrl: medPulse?.liveUrl ?? "https://medpulse-ai-snowy.vercel.app/",
      tone: "green",
    },
    {
      id: "trustlens",
      number: "02",
      title: "TrustLens AI",
      description:
        "Windows and browser guardian that spots scams in text and web pages.",
      tags: ["Python", "Security"],
      topTag: "Security",
      repoUrl: github("trustlens-ai"),
      tone: "violet",
    },
    {
      id: "jan-sahayak",
      number: "03",
      title: "Jan Sahayak",
      description:
        "AI assistant matching people to Indian government welfare schemes.",
      tags: ["AI", "Python"],
      topTag: "AI",
      repoUrl: github("Jan_Sahayak"),
      tone: "blue",
    },
    {
      id: "base-converter",
      number: "04",
      title: "Base Converter",
      description:
        "Command-line C program that converts whole and fractional numbers between any two bases from 2 to 36.",
      tags: [
        "base-converter",
        "binary",
        "c",
        "command-line",
        "hexadecimal",
        "number-systems",
        "student-project",
      ],
      topTag: "C",
      repoUrl: github("Base_Converter"),
      tone: "amber",
    },
  ];
}

export const toolkit = [
  "Python",
  "C",
  "DSA",
  "Git & GitHub",
  "Networking",
  "TypeScript",
];
