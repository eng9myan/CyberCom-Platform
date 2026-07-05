"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { UserSession } from "@/types";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_STORAGE_KEY = "cybercom_session";

// Session previously lived only in React state, which a full page navigation
// (the hospital nav uses plain <a href> links, not next/link) wipes entirely --
// every click to a different hospital sub-page forced a fresh login. Persisting
// to sessionStorage (already used for the PKCE verifier/state) survives that.
function loadPersistedSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed.tokenExpiresAt && parsed.tokenExpiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<UserSession | null>(null);

  useEffect(() => {
    const persisted = loadPersistedSession();
    if (persisted) setSessionState(persisted);
  }, []);

  const setSession = useCallback((s: UserSession | null) => {
    setSessionState(s);
    if (typeof window !== "undefined") {
      if (s) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const logout = useCallback(() => {
    setSessionState(null);
    sessionStorage.clear();
    window.location.href = "/auth/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
