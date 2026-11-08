"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SweetImageMap } from "@/lib/gift-images";
import type { ThemeFestivalOption, ThemeRuntimeConfig } from "@/lib/theme";

const ThemeContext = createContext<ThemeRuntimeConfig | null>(null);

interface ThemeProviderProps {
  festivals: ThemeFestivalOption[];
  scheduled: ThemeFestivalOption | null;
  sweetImages: SweetImageMap;
  children: ReactNode;
}

export function ThemeProvider({
  festivals,
  scheduled,
  sweetImages,
  children,
}: ThemeProviderProps) {
  const runtime = useMemo(
    () => ({ festivals, scheduled, sweetImages }),
    [festivals, scheduled, sweetImages],
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
