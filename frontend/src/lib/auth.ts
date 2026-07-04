/**
 * Auth utilities — OAuth 2.1 + OIDC client helpers. ADR-0005.
 * Integrates with CyIdentity (Keycloak/Zitadel).
 */
"use client";

const CYIDENTITY_ISSUER = process.env.NEXT_PUBLIC_CYIDENTITY_ISSUER ?? "";
const CLIENT_ID = process.env.NEXT_PUBLIC_CYIDENTITY_CLIENT_ID ?? "";

/** Redirect to CyIdentity authorization endpoint (PKCE flow). */
export function initiateLogin(redirectUri: string): void {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem("pkce_verifier", codeVerifier);
  sessionStorage.setItem("oauth_state", state);

  void generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    window.location.href = `${CYIDENTITY_ISSUER}/protocol/openid-connect/auth?${params.toString()}`;
  });
}

/** Exchange authorization code for tokens (PKCE). */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const codeVerifier = sessionStorage.getItem("pkce_verifier") ?? "";

  const response = await fetch(`${CYIDENTITY_ISSUER}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/** Parse JWT claims without verification (verification happens on backend). */
export function parseJwtClaims(token: string): Record<string, unknown> {
  const [, payloadB64] = token.split(".");
  if (!payloadB64) return {};
  const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as Record<string, unknown>;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
