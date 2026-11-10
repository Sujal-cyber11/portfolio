import type { Metadata } from "next";
import { Achievements } from "@/components/redesign/Achievements";
import { Contact } from "@/components/redesign/Contact";
import { CursorGlow } from "@/components/redesign/CursorGlow";
import { Hero } from "@/components/redesign/Hero";
import { RevealOnScroll } from "@/components/redesign/RevealOnScroll";
import { Toolkit } from "@/components/redesign/Toolkit";
import { Work } from "@/components/redesign/Work";
import { getProfile, getProjectOverrides } from "@/lib/content";
import { buildWorkProjects } from "@/lib/landing-data";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const profile = getProfile();
  const workProjects = buildWorkProjects(profile, getProjectOverrides());

  return (
    <>
      <CursorGlow />
      <RevealOnScroll />
      <Hero profile={profile} />
      <Work projects={workProjects} />
      <Achievements />
      <Toolkit />
      <Contact profile={profile} />
    </>
  );
}
