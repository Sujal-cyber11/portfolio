"use client";

import { useId, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { getSelectedThemeChoice, THEME_AUTO, THEME_DEFAULT } from "@/lib/theme";
import { useThemeRuntime } from "./ThemeProvider";
import {
  getStoredThemeChoice,
  getUrlThemeParam,
  selectThemeChoice,
  subscribeThemeChanges,
} from "./theme-dom";
import styles from "./ThemeSwitcher.module.css";

type CopyState = "idle" | "copied" | "failed";

export function ThemeSwitcher() {
  const runtime = useThemeRuntime();
  const selectId = useId();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const urlParam = useSyncExternalStore(
    subscribeThemeChanges,
    getUrlThemeParam,
    () => null,
  );
  const storedChoice = useSyncExternalStore(
    subscribeThemeChanges,
    getStoredThemeChoice,
    () => null,
  );
  const selected = getSelectedThemeChoice(
    urlParam,
    storedChoice,
    runtime.festivals,
  );

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setCopyState("idle");
    selectThemeChoice(event.target.value, runtime);
  }

  async function copyThemeLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className={styles.switcher}>
      <label className={styles.label} htmlFor={selectId}>
        Theme
      </label>

      <select
        className={styles.select}
        id={selectId}
        onChange={handleChange}
        value={selected}
      >
        <option value={THEME_AUTO}>Auto (follows schedule)</option>
        <option value={THEME_DEFAULT}>Default</option>
        {runtime.festivals.map((festival) => (
          <option key={festival.slug} value={festival.slug}>
            {festival.name}
          </option>
        ))}
      </select>

      <button className={styles.copy} onClick={copyThemeLink} type="button">
        Copy link to this theme
      </button>

      <span aria-live="polite" className={styles.status} role="status">
        {copyState === "copied"
          ? "Copied."
          : copyState === "failed"
            ? "Copy failed."
            : ""}
      </span>
    </div>
  );
}
