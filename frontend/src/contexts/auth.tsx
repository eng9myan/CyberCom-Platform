"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserSession } from "@/types";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<UserSession | null>(null);

  const setSession = useCallback((s: UserSession | null) => {
    setSessionState(s);
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
