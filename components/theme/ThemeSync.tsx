"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { useThemeRuntime } from "./ThemeProvider";
import {
  applyResolvedTheme,
  getStoredThemeChoice,
  getUrlThemeParam,
  subscribeThemeChanges,
} from "./theme-dom";

export function ThemeSync() {
  const runtime = useThemeRuntime();
  const pathname = usePathname();
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

  useLayoutEffect(() => {
    applyResolvedTheme(
      runtime,
      getUrlThemeParam(),
      getStoredThemeChoice(),
      pathname,
    );
  }, [runtime, urlParam, storedChoice, pathname]);

  return null;
}
