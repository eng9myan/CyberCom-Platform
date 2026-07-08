"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "../_lib/provider";

interface ProviderAssignment {
  id: string;
  patient_id: string;
  provider_id: string;
  role: string;
  is_primary: boolean;
  effective_from: string;
  effective_until: string | null;
}

interface Patient {
  id: string; first_name: string; last_name: string; mrn: string; dob: string; gender: string;
}

interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function ProviderPatients() {
  const { session, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<ProviderAssignment[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [showAllTenant, setShowAllTenant] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const resolvedProvider = await resolveCurrentProvider(session.userId, opts);
      setProvider(resolvedProvider);

      const assignmentPath = resolvedProvider && !showAllTenant
        ? `/api/v1/provider-portal/patient-lists/provider-assignments/?provider_id=${resolvedProvider.id}&is_primary=true`
        : "/api/v1/provider-portal/patient-lists/provider-assignments/";
      const [assignmentData, patientsData] = await Promise.all([
        apiFetch<Paginated<ProviderAssignment> | ProviderAssignment[]>(assignmentPath, opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setAssignments(unwrap(assignmentData).filter(a => !a.effective_until));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientsData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load patient assignments."));
    }
  }, [session, showAllTenant]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/provider-portal" className="mb-1 inline-block text-sm text-white/50 hover:text-white">← Provider Portal</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">My Patients</h1>
          <p className="mt-1 text-sm text-white/50">Real patient assignments and census</p>
        </div>
        <button onClick={() => setShowAllTenant(v => !v)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {showAllTenant ? "Show my assignments" : "Show all tenant patients"}
        </button>
      </header>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>
      )}

      {provider === null && !showAllTenant && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record, so &quot;my assignments&quot; can&apos;t be resolved. Showing all tenant patient assignments instead.
        </div>
      )}

      <div className="cy-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Age / Sex</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Coverage since</th>
              </tr>
            </thead>
            <tbody>
              {assignments === null && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">Loading assignments…</td></tr>
              )}
              {assignments !== null && assignments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">
                  {provider ? "No active patient assignments for you yet." : "No patient assignments recorded for this tenant yet."}
                </td></tr>
              )}
              {(assignments || []).map(a => {
                const p = patients[a.patient_id];
                return (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p ? `${p.first_name} ${p.last_name}` : `Patient ${a.patient_id.slice(0, 8)}`}</div>
                      {p && <div className="text-xs text-white/40">{p.mrn}</div>}
                    </td>
                    <td className="px-4 py-3 text-white/60">{p ? `${calcAge(p.dob)}y ${p.gender[0]?.toUpperCase()}` : "—"}</td>
                    <td className="px-4 py-3 capitalize text-white/70">{a.role.replace("_", " ")}{a.is_primary ? " · primary" : ""}</td>
                    <td className="px-4 py-3 text-white/40">{new Date(a.effective_from).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
