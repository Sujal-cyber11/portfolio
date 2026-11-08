"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const DiwaliLanterns = dynamic(
  () => import("./DiwaliLanterns").then((module) => module.DiwaliLanterns),
  { ssr: false },
);

function subscribe(callback: () => void): () => void {
  if (typeof MutationObserver === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("theme-diwali");
}

function getServerSnapshot(): boolean {
  return false;
}

export function FestivalLanterns() {
  const active = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return active ? <DiwaliLanterns /> : null;
}
