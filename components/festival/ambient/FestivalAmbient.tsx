"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const DiwaliAmbient = dynamic(
  () => import("./DiwaliAmbient").then((module) => module.DiwaliAmbient),
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

export function FestivalAmbient() {
  const active = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return active ? <DiwaliAmbient /> : null;
}
