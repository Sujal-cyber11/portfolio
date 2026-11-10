import type { Metadata } from "next";
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Unbounded,
} from "next/font/google";
import { ThemeScript } from "@/components/festival/ThemeScript";
import { FestivalSplashHost } from "@/components/festival/splash/FestivalSplashHost";
import { SiteNav } from "@/components/redesign/SiteNav";
import { ThemeBar } from "@/components/theme/ThemeBar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { getCurrentFestival, getFestivals, getProfile } from "@/lib/content";
import { getSweetImages } from "@/lib/gift-images";
import { getSiteUrl } from "@/lib/site";
import { resolveTheme, type ThemeFestivalOption } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
  const festivalOptions: ThemeFestivalOption[] = getFestivals().map(
    (festival) => ({
      slug: festival.slug,
      name: festival.name,
      themeClass: festival.themeClass,
      accentEmoji: festival.accentEmoji,
      greeting: festival.greeting,
      gift: festival.gift,
    }),
  );
  const scheduledFestival = await getCurrentFestival();
  const scheduled = scheduledFestival
    ? {
        slug: scheduledFestival.slug,
        name: scheduledFestival.name,
        themeClass: scheduledFestival.themeClass,
        accentEmoji: scheduledFestival.accentEmoji,
        greeting: scheduledFestival.greeting,
        gift: scheduledFestival.gift,
      }
    : null;
  const serverTheme = resolveTheme({
    urlParam: null,
    storedChoice: null,
    scheduled,
    festivals: festivalOptions,
  });
  const activeThemeClass = serverTheme.themeClass;
  const festivalThemes = Object.fromEntries(
    festivalOptions.map((festival) => [festival.slug, festival.themeClass]),
  );
  const sweetImages = getSweetImages();
  const htmlClassName = [
    inter.variable,
    unbounded.variable,
    instrument.variable,
    mono.variable,
    activeThemeClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html className={htmlClassName} lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('reveal-ready')",
          }}
        />
        <ThemeScript
          festivalThemes={festivalThemes}
          scheduledThemeClass={activeThemeClass}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ThemeProvider
          festivals={festivalOptions}
          scheduled={scheduled}
          sweetImages={sweetImages}
        >
          <ThemeBar />
          <ThemeSync />
          <FestivalSplashHost profileName={profile.name} />
          <div className="site-frame">
            <SiteNav />
            <main className="site-main" id="main">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
