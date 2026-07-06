"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Lock, Unlock, Shield, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string;
  enabled: boolean;
  is_locked: boolean;
  mfa_enrolled: boolean;
  roles: Role[];
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

const emptyForm = { username: "", email: "", first_name: "", last_name: "" };

export default function UserManagementPage() {
  const { session, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [realm, setRealm] = useState<Realm | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [usersData, rolesData, realmsData] = await Promise.all([
        apiFetch<Paginated<UserProfile> | UserProfile[]>("/api/v1/identity/users/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<Role> | Role[]>("/api/v1/identity/roles/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<Realm> | Realm[]>("/api/v1/identity/realms/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
      ]);
      setUsers(unwrap(usersData));
      setRoles(unwrap(rolesData));
      const realms = unwrap(realmsData);
      const tenantRealm =
        realms.find(r => r.tenant_id === session.tenantId) || realms.find(r => r.is_active) || realms[0] || null;
      setRealm(tenantRealm);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitProvision() {
    if (!session || !realm) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/api/v1/identity/users/provision/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          realm_id: realm.id,
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to provision user."));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLock(user: UserProfile) {
    if (!session) return;
    setBusyUserId(user.id);
    setRowError(null);
    try {
      await apiFetch(`/api/v1/identity/users/${user.id}/${user.is_locked ? "unlock" : "lock"}/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
      });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setRowError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function assignRole(user: UserProfile, role: Role) {
    if (!session) return;
    setBusyUserId(user.id);
    setRowError(null);
    setRoleMenuFor(null);
    try {
      await apiFetch(`/api/v1/identity/users/${user.id}/assign-role/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ role_id: role.id }),
      });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setRowError(detail || (err instanceof Error ? err.message : "Failed to assign role."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeRole(user: UserProfile, role: Role) {
    if (!session) return;
    setBusyUserId(user.id);
    setRowError(null);
    try {
      await apiFetch(`/api/v1/identity/users/${user.id}/remove-role/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ role_id: role.id }),
      });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setRowError(detail || (err instanceof Error ? err.message : "Failed to remove role."));
    } finally {
      setBusyUserId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="mt-2 text-white/50">User management requires an authenticated session.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load users</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users size={22} className="text-brand-400" /> User Management
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Accounts and realm roles for this tenant, backed by CyIdentity / Keycloak.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!realm}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40"
        >
          <Plus size={16} /> Add User
        </button>
      </header>

      {!realm && !loading && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          No identity realm found for this tenant yet — provisioning is unavailable until one exists.
        </div>
      )}

      {rowError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {rowError}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Add User</h2>
            <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>
          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })}
              className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <button
            onClick={submitProvision}
            disabled={submitting || !form.username || !form.email}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40"
          >
            {submitting ? "Provisioning..." : "Provision User"}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["User", "Email", "Roles", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/50">Loading users...</td></tr>
              )}
              {!loading && (users || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/50">No users provisioned for this tenant yet.</td></tr>
              )}
              {(users || []).map(u => (
                <tr key={u.id} className="border-b border-white/5 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.display_name || u.username}</p>
                    <p className="text-xs text-white/40">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 && <span className="text-xs text-white/30">No roles assigned</span>}
                      {u.roles.map(r => (
                        <span
                          key={r.id}
                          className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-300"
                        >
                          {r.display_name || r.name}
                          <button
                            onClick={() => removeRole(u, r)}
                            disabled={busyUserId === u.id}
                            aria-label={`Remove ${r.name} role`}
                            className="text-brand-300/60 hover:text-red-400"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative mt-2 inline-block">
                      <button
                        onClick={() => setRoleMenuFor(roleMenuFor === u.id ? null : u.id)}
                        disabled={busyUserId === u.id || roles.length === 0}
                        className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white disabled:opacity-30"
                      >
                        <Shield size={12} /> Assign role
                      </button>
                      {roleMenuFor === u.id && (
                        <div className="absolute left-0 top-6 z-10 w-48 rounded-lg border border-white/10 bg-surface-overlay p-1 shadow-xl">
                          {roles
                            .filter(r => !u.roles.some(ur => ur.id === r.id))
                            .map(r => (
                              <button
                                key={r.id}
                                onClick={() => assignRole(u, r)}
                                className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-white/10"
                              >
                                {r.display_name || r.name}
                              </button>
                            ))}
                          {roles.filter(r => !u.roles.some(ur => ur.id === r.id)).length === 0 && (
                            <p className="px-3 py-1.5 text-xs text-white/30">All roles assigned</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.is_locked ? "bg-red-500/15 text-red-400" : u.enabled ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/50"
                    }`}>
                      {u.is_locked ? "Locked" : u.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleLock(u)}
                      disabled={busyUserId === u.id}
                      className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white disabled:opacity-30"
                    >
                      {u.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                      {u.is_locked ? "Unlock" : "Lock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
