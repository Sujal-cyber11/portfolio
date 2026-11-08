"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { isThemeLinkParam, preserveThemeParam } from "@/lib/theme";
import { useThemeRuntime } from "./ThemeProvider";
import { getUrlThemeParam, subscribeThemeChanges } from "./theme-dom";

type ThemedLinkProps = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    children?: ReactNode;
  };

export function ThemedLink({ href, children, ...props }: ThemedLinkProps) {
  const runtime = useThemeRuntime();
  const pathname = usePathname();
  const urlParam = useSyncExternalStore(
    subscribeThemeChanges,
    getUrlThemeParam,
    () => null,
  );
  const manualTheme = isThemeLinkParam(urlParam, runtime.festivals)
    ? urlParam
    : null;
  const themedHref = manualTheme
    ? preserveThemeParam(href, manualTheme, pathname)
    : href;

  return (
    <Link href={themedHref} {...props}>
      {children}
    </Link>
  );
}
