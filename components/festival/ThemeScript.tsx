import {
  THEME_AUTO,
  THEME_DEFAULT,
  THEME_QUERY_PARAM,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

interface ThemeScriptProps {
  festivalThemes: Record<string, string>;
  scheduledThemeClass: string | null;
}

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildThemeScript({
  festivalThemes,
  scheduledThemeClass,
}: ThemeScriptProps): string {
  return `(function(){try{var root=document.documentElement;var themes=${serialize(festivalThemes)};var scheduled=${serialize(scheduledThemeClass)};var storageKey=${serialize(THEME_STORAGE_KEY)};var queryKey=${serialize(THEME_QUERY_PARAM)};var clear=function(){Array.from(root.classList).forEach(function(name){if(name.indexOf("theme-")===0){root.classList.remove(name)}})};var apply=function(themeClass){clear();if(themeClass){root.classList.add(themeClass)}};var match=location.pathname.match(/^\\/festival\\/([a-z0-9-]+)\\/?$/);if(match&&Object.prototype.hasOwnProperty.call(themes,match[1])){apply(themes[match[1]]);return}var param=new URLSearchParams(location.search).get(queryKey);var stored=null;try{stored=localStorage.getItem(storageKey)}catch(error){}if(param===${serialize(THEME_DEFAULT)}){apply(null);return}if(param&&Object.prototype.hasOwnProperty.call(themes,param)){apply(themes[param]);return}if(stored===${serialize(THEME_DEFAULT)}){apply(null);return}if(stored&&stored!==${serialize(THEME_AUTO)}&&Object.prototype.hasOwnProperty.call(themes,stored)){apply(themes[stored]);return}apply(scheduled)}catch(error){}})();`;
}

export function ThemeScript({
  festivalThemes,
  scheduledThemeClass,
}: ThemeScriptProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: buildThemeScript({
          festivalThemes,
          scheduledThemeClass,
        }),
      }}
      suppressHydrationWarning
    />
  );
}
