"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, ClipboardCheck, FileText, FlaskConical, AlertTriangle, NotebookPen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "./_lib/provider";

interface ProviderAssignment { id: string; patient_id: string; role: string; is_primary: boolean; effective_until: string | null; }
interface CriticalAlert { id: string; patient_id: string; alert_type: string; result_value: string; clinical_significance: string; status: string; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const DEEP_LINKS = [
  { href: "/provider-portal/patients", label: "My Patients", icon: Users, description: "Patient assignments and census" },
  { href: "/provider-portal/tasks", label: "Clinical Tasks", icon: ClipboardCheck, description: "Open tasks, escalations, follow-ups" },
  { href: "/provider-portal/orders", label: "Orders (CPOE)", icon: FileText, description: "Place and track clinical orders" },
  { href: "/provider-portal/results", label: "Results", icon: FlaskConical, description: "Lab and imaging results review" },
  { href: "/provider-portal/notes", label: "Clinical Notes", icon: NotebookPen, description: "SOAP notes with ICD-11 diagnosis coding" },
];

export default function ProviderPortalHome() {
  const { session, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<ProviderAssignment[] | null>(null);
  const [alerts, setAlerts] = useState<CriticalAlert[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const resolvedProvider = await resolveCurrentProvider(session.userId, opts);
      setProvider(resolvedProvider);
      const assignmentPath = resolvedProvider
        ? `/api/v1/provider-portal/patient-lists/provider-assignments/?provider_id=${resolvedProvider.id}&is_primary=true`
        : "/api/v1/provider-portal/patient-lists/provider-assignments/";
      const [assignmentData, alertsData, patientsData] = await Promise.all([
        apiFetch<Paginated<ProviderAssignment> | ProviderAssignment[]>(assignmentPath, opts),
        apiFetch<Paginated<CriticalAlert> | CriticalAlert[]>("/api/v1/provider-portal/results/critical-alerts/?status=pending", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setAssignments(unwrap(assignmentData).filter(a => !a.effective_until));
      setAlerts(unwrap(alertsData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientsData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load provider workspace data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function acknowledgeAlert(alert: CriticalAlert) {
    if (!session) return;
    setBusyId(alert.id);
    try {
      await apiFetch(`/api/v1/provider-portal/results/critical-alerts/${alert.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: "acknowledged", acknowledged_at: new Date().toISOString() }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to acknowledge alert."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-400">CyMed Provider Workspace</h1>
        <p className="mt-1 text-sm text-white/50">My patient queue and critical result alerts</p>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>
      )}
      {provider === null && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record — showing tenant-wide data instead of &quot;my&quot; assignments.
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="cy-card p-5">
          <h2 className="mb-4 font-heading text-lg font-bold">My Patients</h2>
          <div className="grid gap-3">
            {assignments === null && <p className="text-sm text-white/40">Loading…</p>}
            {assignments !== null && assignments.length === 0 && <p className="text-sm text-white/40">No active patient assignments.</p>}
            {(assignments || []).slice(0, 6).map(a => {
              const p = patients[a.patient_id];
              return (
                <div key={a.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-semibold">{p ? `${p.first_name} ${p.last_name}` : `Patient ${a.patient_id.slice(0, 8)}`}</div>
                    <div className="text-xs text-white/40">{p?.mrn} · {a.role.replace("_", " ")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cy-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold"><AlertTriangle size={18} className="text-red-400" /> Critical Result Alerts</h2>
          <div className="grid gap-3">
            {alerts === null && <p className="text-sm text-white/40">Loading…</p>}
            {alerts !== null && alerts.length === 0 && <p className="text-sm text-white/40">No pending critical alerts.</p>}
            {(alerts || []).map(alert => {
              const p = patients[alert.patient_id];
              return (
                <div key={alert.id} className="rounded-lg border-l-4 border-red-500 bg-red-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-red-400">{alert.alert_type.replace("_", " ")}</span>
                    <button disabled={busyId === alert.id} onClick={() => acknowledgeAlert(alert)} className="text-xs font-semibold text-brand-300 hover:underline disabled:opacity-40">
                      {busyId === alert.id ? "…" : "Acknowledge"}
                    </button>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{p ? `${p.first_name} ${p.last_name}` : `Patient ${alert.patient_id.slice(0, 8)}`}</div>
                  <div className="text-xs text-white/50">{alert.result_value} {alert.clinical_significance && `— ${alert.clinical_significance}`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-heading text-lg font-bold">Full Workspace</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DEEP_LINKS.map(({ href, label, icon: Icon, description }) => (
          <Link key={href} href={href} className="cy-card flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400"><Icon size={20} /></div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-white/50">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
