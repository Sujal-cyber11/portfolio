import { describe, expect, it } from "vitest";
import {
  classifyProject,
  EXPERIMENT_TOPIC,
  FEATURED_TOPIC,
  isCategoryTopic,
  withoutCategoryTopics,
} from "@/lib/project-categories";

describe("classifyProject", () => {
  it("defaults to discovered when there are no topics", () => {
    expect(classifyProject([])).toEqual({
      category: "discovered",
      conflictingTopics: false,
    });
  });

  it("recognises the featured topic", () => {
    expect(classifyProject([FEATURED_TOPIC])).toEqual({
      category: "featured",
      conflictingTopics: false,
    });
  });

  it("recognises the experiment topic", () => {
    expect(classifyProject([EXPERIMENT_TOPIC])).toEqual({
      category: "experiment",
      conflictingTopics: false,
    });
  });

  it("matches topics case-insensitively and ignores whitespace", () => {
    expect(classifyProject(["  PORTFOLIO-FEATURED "])).toMatchObject({
      category: "featured",
    });
    expect(classifyProject(["Portfolio-Experiment"])).toMatchObject({
      category: "experiment",
    });
  });

  it("prefers featured when both topics are present", () => {
    expect(classifyProject([FEATURED_TOPIC, EXPERIMENT_TOPIC])).toEqual({
      category: "featured",
      conflictingTopics: true,
    });
  });

  it("lets an explicit category win over topics", () => {
    expect(
      classifyProject([FEATURED_TOPIC], { category: "experiment" }),
    ).toEqual({
      category: "experiment",
      conflictingTopics: false,
    });
  });

  it("supports legacy featured: true", () => {
    expect(classifyProject([], { featured: true })).toEqual({
      category: "featured",
      conflictingTopics: false,
    });
  });

  it("does not treat featured: false as a category", () => {
    expect(classifyProject([EXPERIMENT_TOPIC], { featured: false })).toEqual({
      category: "experiment",
      conflictingTopics: false,
    });
  });
});

describe("category topics", () => {
  it("identifies both reserved topics case-insensitively", () => {
    expect(isCategoryTopic(FEATURED_TOPIC)).toBe(true);
    expect(isCategoryTopic("PORTFOLIO-EXPERIMENT")).toBe(true);
    expect(isCategoryTopic("portfolio")).toBe(false);
  });

  it("removes category topics from tags and keeps the rest", () => {
    expect(
      withoutCategoryTopics([
        "Python",
        "Portfolio-Featured",
        "cli",
        EXPERIMENT_TOPIC,
      ]),
    ).toEqual(["Python", "cli"]);
  });
});
