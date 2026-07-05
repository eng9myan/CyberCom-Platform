"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { UserSession } from "@/types";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_STORAGE_KEY = "cybercom_session";

// HIPAA 164.312(a)(2)(iii): automatic logoff after inactivity. Matches the
// backend's SessionService.IDLE_THRESHOLD_SECONDS (30 min) -- warn 2 minutes
// before that so the user has a chance to stay signed in before the server
// side would have marked the session idle_timeout anyway.
const IDLE_LOGOUT_MS = 30 * 60 * 1000;
const IDLE_WARNING_MS = IDLE_LOGOUT_MS - 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

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
  const [idleWarningVisible, setIdleWarningVisible] = useState(false);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Real inactivity timer -- resets on genuine user input (click/keypress/
  // scroll/touch), not on a page-load check like the previous implementation.
  // Backend enforcement (shared/auth/auth_middleware.py's _sync_session) is
  // the authoritative side of this; this timer is what makes the *current*
  // tab actually act on it instead of silently continuing to send requests
  // until the JWT's own expiry.
  useEffect(() => {
    if (!session) {
      setIdleWarningVisible(false);
      return;
    }

    const clearTimers = () => {
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };

    const arm = () => {
      clearTimers();
      setIdleWarningVisible(false);
      warningTimer.current = setTimeout(() => setIdleWarningVisible(true), IDLE_WARNING_MS);
      logoutTimer.current = setTimeout(logout, IDLE_LOGOUT_MS);
    };

    const onActivity = () => arm();

    arm();
    for (const evt of ACTIVITY_EVENTS) window.addEventListener(evt, onActivity, { passive: true });

    return () => {
      clearTimers();
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, onActivity);
    };
  }, [session, logout]);

  const stayLoggedIn = useCallback(() => {
    setIdleWarningVisible(false);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warningTimer.current = setTimeout(() => setIdleWarningVisible(true), IDLE_WARNING_MS);
    logoutTimer.current = setTimeout(logout, IDLE_LOGOUT_MS);
  }, [logout]);

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
      {idleWarningVisible && (
        <div
          role="alertdialog"
          aria-live="assertive"
          style={{
            position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 2000,
            background: "var(--color-surface-elevated, #1a1f26)",
            border: "1px solid #f59e0b", borderRadius: "10px",
            padding: "1rem 1.25rem", maxWidth: "320px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: "0.4rem", color: "#f59e0b" }}>Session about to expire</p>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #9ca3af)", marginBottom: "0.75rem" }}>
            You&apos;ve been inactive for a while. For your security you&apos;ll be signed out in 2 minutes unless you stay active.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={stayLoggedIn}
              style={{ padding: "0.4rem 0.9rem", borderRadius: "6px", border: "none", background: "#f59e0b", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
            >
              Stay signed in
            </button>
            <button
              onClick={logout}
              style={{ padding: "0.4rem 0.9rem", borderRadius: "6px", border: "1px solid var(--color-border, #374151)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: "0.85rem" }}
            >
              Sign out now
            </button>
          </div>
        </div>
      )}
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
