/**
 * CyberCom Frontend — Shared TypeScript types.
 * Mirrors shared/types/index.ts; specialized for Next.js usage.
 */

export interface TenantContext {
  tenantId: string;
  slug: string;
  domain: string;
  tier: "shared" | "schema" | "database" | "cluster";
  status: "active" | "suspended" | "pending";
  locale: "ar" | "en";
  timezone: string;
}

export interface UserSession {
  userId: string;
  email: string;
  displayName?: string;
  realm: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  accessToken: string;
  tokenExpiresAt: number;
}

export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  pages: number;
  results: T[];
}

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}
