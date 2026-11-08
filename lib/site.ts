export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = "https://sujalrastogi.vercel.app";

  return (configured || fallback).replace(/\/+$/, "");
}
