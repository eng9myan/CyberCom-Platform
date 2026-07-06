"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth";

export type Locale = "en" | "ar";
export type Theme = "light" | "dark";

interface Preferences {
  locale: Locale;
  theme: Theme;
}

interface PreferencesContextValue extends Preferences {
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleLocale: () => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const DEFAULTS: Preferences = { locale: "en", theme: "dark" };

// Keyed per-account (not per-browser) so two people signed in on the same
// machine at different times each get their own remembered locale/theme --
// switching accounts switches preferences, it never leaks between users.
function storageKey(userId: string | undefined): string {
  return `cymed_prefs_${userId || "anon"}`;
}

function loadPreferences(userId: string | undefined): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      locale: parsed.locale === "ar" ? "ar" : "en",
      theme: parsed.theme === "light" ? "light" : "dark",
    };
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);

  // Reload from this account's own storage slot whenever who's signed in changes.
  useEffect(() => {
    setPreferences(loadPreferences(session?.userId));
  }, [session?.userId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = preferences.locale;
    document.documentElement.dir = preferences.locale === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("data-theme", preferences.theme);
  }, [preferences]);

  const persist = useCallback((next: Preferences) => {
    setPreferences(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey(session?.userId), JSON.stringify(next));
    }
  }, [session?.userId]);

  const setLocale = useCallback((locale: Locale) => persist({ ...preferences, locale }), [preferences, persist]);
  const setTheme = useCallback((theme: Theme) => persist({ ...preferences, theme }), [preferences, persist]);
  const toggleLocale = useCallback(() => persist({ ...preferences, locale: preferences.locale === "en" ? "ar" : "en" }), [preferences, persist]);
  const toggleTheme = useCallback(() => persist({ ...preferences, theme: preferences.theme === "dark" ? "light" : "dark" }), [preferences, persist]);

  return (
    <PreferencesContext.Provider value={{ ...preferences, setLocale, setTheme, toggleLocale, toggleTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
