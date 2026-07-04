/**
 * API client for CyberCom backend. ADR-0003.
 * Attaches Authorization header and X-Tenant-ID to every request.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
  tenantId?: string;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, tenantId, ...init } = options;

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (tenantId) {
    headers.set("X-Tenant-ID", tenantId);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = await (response.json() as Promise<Record<string, unknown>>).catch(() => ({ detail: response.statusText }));
    throw error;
  }

  return response.json() as Promise<T>;
}
