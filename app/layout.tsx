import type { Metadata } from "next";
import { FestivalDecorations } from "@/components/festival/FestivalDecorations";
import { ThemeScript } from "@/components/festival/ThemeScript";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { getCurrentFestival, getFestivals, getProfile } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";
import { resolveTheme, type ThemeFestivalOption } from "@/lib/theme";
import "./globals.css";

const profile = getProfile();
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.tagline}`,
    template: `%s | ${profile.name}`,
  },
  description: profile.bio,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: profile.name,
    title: `${profile.name} — ${profile.tagline}`,
    description: profile.bio,
  },
  twitter: {
    card: "summary",
    title: `${profile.name} — ${profile.tagline}`,
    description: profile.bio,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const festivalRecords = getFestivals();
  const allFestivals: ThemeFestivalOption[] = festivalRecords.map(
    (festival) => ({
      slug: festival.slug,
      name: festival.name,
      themeClass: festival.themeClass,
    }),
  );
  const enabledFestivals = allFestivals.filter((option) => {
    const record = festivalRecords.find(
      (festival) => festival.slug === option.slug,
    );
    return record?.enabled ?? false;
  });
  const scheduledFestival = await getCurrentFestival();
  const scheduled = scheduledFestival
    ? {
        slug: scheduledFestival.slug,
        name: scheduledFestival.name,
        themeClass: scheduledFestival.themeClass,
      }
    : null;
  const serverTheme = resolveTheme({
    urlParam: null,
    storedChoice: null,
    scheduled,
    festivals: enabledFestivals,
  });
  const activeThemeClass = serverTheme.themeClass;
  const festivalThemes = Object.fromEntries(
    allFestivals.map((festival) => [festival.slug, festival.themeClass]),
  );

  return (
    <html
      className={activeThemeClass ?? undefined}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript
          festivalThemes={festivalThemes}
          scheduledThemeClass={activeThemeClass}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <FestivalDecorations />
        <ThemeProvider
          allFestivals={allFestivals}
          festivals={enabledFestivals}
          scheduled={scheduled}
        >
          <ThemeSync />
          <div className="site-frame">
            <SiteHeader profile={profile} />
            <main className="site-main" id="main">
              {children}
            </main>
            <SiteFooter profile={profile} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
