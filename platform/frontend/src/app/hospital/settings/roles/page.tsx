"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Key, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Permission {
  id: string;
  scope: string;
  action: string;
  resource: string;
  description: string;
}

interface Role {
  id: string;
  realm: string;
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
}

interface Realm {
  id: string;
  tenant_id: string;
  realm_name: string;
  is_active: boolean;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const emptyForm = { name: "", display_name: "", description: "" };

export default function RolesAndPermissionsPage() {
  const { session, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [realm, setRealm] = useState<Realm | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [rolesData, permsData, realmsData] = await Promise.all([
        apiFetch<Paginated<Role> | Role[]>("/api/v1/identity/roles/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<Permission> | Permission[]>("/api/v1/identity/permissions/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<Realm> | Realm[]>("/api/v1/identity/realms/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
      ]);
      const realms = unwrap(realmsData);
      const tenantRealm =
        realms.find(r => r.tenant_id === session.tenantId) || realms.find(r => r.is_active) || realms[0] || null;
      setRealm(tenantRealm);
      const allRoles = unwrap(rolesData);
      setRoles(tenantRealm ? allRoles.filter(r => r.realm === tenantRealm.id) : allRoles);
      setPermissions(unwrap(permsData));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load security definitions."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitRole() {
    if (!session || !realm) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/api/v1/identity/roles/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          realm: realm.id,
          name: form.name,
          display_name: form.display_name,
          description: form.description,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to create role."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="mt-2 text-white/50">Role management requires an authenticated session.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load roles</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield size={22} className="text-brand-400" /> Roles &amp; Permissions
          </h1>
          <p className="mt-1 text-sm text-white/50">
            RBAC roles for this tenant&apos;s realm, mapped to the CyIdentity permission catalog.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!realm}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40"
        >
          <Plus size={16} /> Create Role
        </button>
      </header>

      {!realm && !loading && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          No identity realm found for this tenant yet — role creation is unavailable until one exists.
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Create Security Role</h2>
            <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>
          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Role code, e.g. ward_nurse"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm font-mono focus:border-brand-400 focus:outline-none"
            />
            <input
              placeholder="Display name, e.g. Ward Nurse"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none sm:col-span-2"
            />
          </div>
          <button
            onClick={submitRole}
            disabled={submitting || !form.name}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create Role"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {["Role Code", "Display Name", "Description"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-white/50">Loading roles...</td></tr>
                )}
                {!loading && roles.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-white/50">No security roles declared for this tenant yet.</td></tr>
                )}
                {roles.map(r => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-brand-300">{r.name}</td>
                    <td className="px-4 py-3 font-medium">{r.display_name || "—"}</td>
                    <td className="px-4 py-3 text-white/50">{r.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface-raised p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
            <Key size={15} className="text-purple-400" /> Permission Registry
          </h3>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {permissions.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/30">No permission scopes registered.</p>
            ) : (
              permissions.map(p => (
                <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <p className="font-mono text-xs text-brand-300">{p.scope}:{p.action}:{p.resource}</p>
                  {p.description && <p className="mt-1 text-xs text-white/40">{p.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
