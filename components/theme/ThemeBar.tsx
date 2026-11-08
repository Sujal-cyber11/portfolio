"use client";

import { useSyncExternalStore } from "react";
import { getThemeToggleState, THEME_DEFAULT } from "@/lib/theme";
import { useThemeRuntime } from "./ThemeProvider";
import {
  getStoredThemeChoice,
  getUrlThemeParam,
  selectThemeChoice,
  subscribeThemeChanges,
} from "./theme-dom";
import styles from "./ThemeBar.module.css";

export function ThemeBar() {
  const runtime = useThemeRuntime();
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
  const state = getThemeToggleState({
    urlParam,
    storedChoice,
    scheduled: runtime.scheduled,
    festivals: runtime.festivals,
  });

  if (!state.visible || !state.festival) {
    return null;
  }

  const festival = state.festival;

  function toggleFestivalTheme() {
    selectThemeChoice(state.checked ? THEME_DEFAULT : festival.slug, runtime);
  }

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <button
          aria-checked={state.checked}
          aria-label={`Toggle ${festival.name} festival theme`}
          className={styles.switch}
          onClick={toggleFestivalTheme}
          role="switch"
          type="button"
        >
          <span className={styles.label}>
            {festival.name}{" "}
            <span aria-hidden="true">{festival.accentEmoji}</span>
          </span>
          <span aria-hidden="true" className={styles.track}>
            <span className={styles.knob} />
          </span>
        </button>
      </div>
    </div>
  );
}
