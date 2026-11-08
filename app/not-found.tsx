import type { Metadata } from "next";
import { ThemedLink } from "@/components/theme/ThemedLink";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="container page-intro">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist. Try the projects or
        achievements pages instead.
      </p>
      <p>
        <ThemedLink href="/">Back home</ThemedLink>
      </p>
    </div>
  );
}
