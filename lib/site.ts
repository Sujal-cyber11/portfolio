export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = "http://localhost:3000";

  return (configured || fallback).replace(/\/+$/, "");
}
