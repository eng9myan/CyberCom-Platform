"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/contexts/preferences";

/**
 * Global locale + theme control. Preference is stored per signed-in account
 * (see contexts/preferences.tsx), so switching users on the same browser
 * never carries one person's language/theme choice over to another.
 */
export function LocaleThemeSwitcher() {
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-ink/10 bg-surface p-1">
      <button
        onClick={toggleLocale}
        aria-label={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
        title={locale === "en" ? "العربية" : "English"}
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-ink/60 transition hover:bg-surface-overlay hover:text-ink"
      >
        <Languages size={14} />
        {locale === "en" ? "EN" : "AR"}
      </button>
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink/60 transition hover:bg-surface-overlay hover:text-ink"
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  );
}
