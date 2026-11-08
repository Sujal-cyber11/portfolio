"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ThemeFestivalOption, ThemeRuntimeConfig } from "@/lib/theme";

const ThemeContext = createContext<ThemeRuntimeConfig | null>(null);

interface ThemeProviderProps {
  festivals: ThemeFestivalOption[];
  allFestivals: ThemeFestivalOption[];
  scheduled: ThemeFestivalOption | null;
  children: ReactNode;
}

export function ThemeProvider({
  festivals,
  allFestivals,
  scheduled,
  children,
}: ThemeProviderProps) {
  const runtime = useMemo(
    () => ({ festivals, allFestivals, scheduled }),
    [festivals, allFestivals, scheduled],
  );

  return (
    <ThemeContext.Provider value={runtime}>{children}</ThemeContext.Provider>
  );
}

export function useThemeRuntime(): ThemeRuntimeConfig {
  const runtime = useContext(ThemeContext);

  if (!runtime) {
    throw new Error("useThemeRuntime must be used inside ThemeProvider");
  }

  return runtime;
}
