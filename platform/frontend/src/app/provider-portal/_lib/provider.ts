import { apiFetch } from "@/lib/api";

interface UserProfileRaw {
  id: string;
  keycloak_user_id: string;
}

interface ProviderRaw {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  provider_type: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

export interface CurrentProvider {
  id: string;
  name: string;
  providerType: string;
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

/**
 * Resolves the signed-in Keycloak user to a clinical Provider record via
 * UserProfile.keycloak_user_id -> Provider.user_id. Returns null (not a
 * fabricated id) when the account has no linked Provider row.
 */
export async function resolveCurrentProvider(
  userId: string,
  opts: { token: string; tenantId: string }
): Promise<CurrentProvider | null> {
  const usersData = await apiFetch<Paginated<UserProfileRaw> | UserProfileRaw[]>(
    "/api/v1/identity/users/",
    opts
  );
  const profile = unwrap(usersData).find(u => u.keycloak_user_id === userId);
  if (!profile) return null;

  const providersData = await apiFetch<Paginated<ProviderRaw> | ProviderRaw[]>(
    "/api/v1/providers/",
    opts
  );
  const provider = unwrap(providersData).find(p => p.user_id === profile.id);
  if (!provider) return null;

  return {
    id: provider.id,
    name: `${provider.first_name} ${provider.last_name}`,
    providerType: provider.provider_type,
  };
}
