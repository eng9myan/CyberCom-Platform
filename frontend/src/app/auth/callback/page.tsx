"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeCodeForTokens, parseJwtClaims } from "@/lib/auth";
import { useAuth } from "@/contexts/auth";
import type { UserSession } from "@/types";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSession } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("oauth_state");

    if (!code || state !== savedState) {
      router.replace("/auth?error=invalid_state");
      return;
    }

    void (async () => {
      try {
        const { accessToken } = await exchangeCodeForTokens(
          code,
          `${window.location.origin}/auth/callback`
        );
        const claims = parseJwtClaims(accessToken);

        const session: UserSession = {
          userId: String(claims["sub"] ?? ""),
          email: String(claims["email"] ?? ""),
          displayName: String(claims["name"] ?? ""),
          realm: String(claims["iss"] ?? ""),
          tenantId: String(claims["tenant_id"] ?? ""),
          roles: (claims["roles"] as string[]) ?? [],
          permissions: (claims["permissions"] as string[]) ?? [],
          accessToken,
          tokenExpiresAt: Date.now() + ((claims["exp"] as number) ?? 900) * 1000,
        };

        setSession(session);
        router.replace("/dashboard");
      } catch {
        router.replace("/auth?error=token_exchange_failed");
      }
    })();
  }, [searchParams, router, setSession]);

  return (
    <div className="login-container" role="main">
      <div className="login-card glass-card">
        <p>جاري المعالجة... Processing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="login-container" role="main">
          <div className="login-card glass-card">
            <p>جاري المعالجة... Processing authentication...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
