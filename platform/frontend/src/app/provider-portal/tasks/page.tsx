"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "../_lib/provider";

type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "escalated";
type TaskPriority = "routine" | "urgent" | "stat" | "critical";

interface ClinicalTask {
  id: string;
  task_type: string;
  title: string;
  description: string;
  patient_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to_provider_id: string;
  due_at: string | null;
}

interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const PRIORITY_COLOR: Record<TaskPriority, string> = { routine: "#94a3b8", urgent: "#f59e0b", stat: "#ef4444", critical: "#ef4444" };
const STATUS_COLOR: Record<TaskStatus, string> = { pending: "#94a3b8", in_progress: "#3b82f6", completed: "#22c55e", cancelled: "#94a3b8", escalated: "#ef4444" };

export default function ProviderTasks() {
  const { session, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<ClinicalTask[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const resolvedProvider = await resolveCurrentProvider(session.userId, opts);
      setProvider(resolvedProvider);
      const [tasksData, patientsData] = await Promise.all([
        apiFetch<Paginated<ClinicalTask> | ClinicalTask[]>("/api/v1/provider-portal/tasks/tasks/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setTasks(unwrap(tasksData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientsData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load clinical tasks."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function completeTask(task: ClinicalTask) {
    if (!session || !provider) return;
    setBusyId(task.id);
    try {
      await apiFetch(`/api/v1/provider-portal/tasks/tasks/${task.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString(), completed_by_provider_id: provider.id }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to complete task."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (tasks || []).filter(t => filter === "all" || !["completed", "cancelled"].includes(t.status));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <a href="/provider-portal" className="mb-1 inline-block text-sm text-white/50 hover:text-white">← Provider Portal</a>
        <h1 className="font-heading text-2xl font-bold text-brand-400">Clinical Tasks</h1>
        <p className="mt-1 text-sm text-white/50">Open tasks, escalations, follow-ups</p>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>
      )}
      {provider === null && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record — you can view tasks but completing them will be blocked until linked.
        </div>
      )}

      <div className="mb-5 flex gap-2">
        {(["open", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-white/10 text-white/50 hover:bg-white/5"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {tasks === null && <div className="cy-card p-6 text-center text-sm text-white/40">Loading tasks…</div>}
        {tasks !== null && filtered.length === 0 && (
          <div className="cy-card p-6 text-center text-sm text-white/40">No tasks for this filter.</div>
        )}
        {filtered.map(t => {
          const p = t.patient_id ? patients[t.patient_id] : undefined;
          return (
            <div key={t.id} className="cy-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.title}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase" style={{ background: `${PRIORITY_COLOR[t.priority]}22`, color: PRIORITY_COLOR[t.priority] }}>{t.priority}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status] }}>{t.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    {p ? `${p.first_name} ${p.last_name} (${p.mrn})` : "No linked patient"} · {t.task_type.replace(/_/g, " ")}
                    {t.due_at && ` · due ${new Date(t.due_at).toLocaleString()}`}
                  </div>
                  {t.description && <p className="mt-2 text-sm text-white/70">{t.description}</p>}
                </div>
                {!["completed", "cancelled"].includes(t.status) && (
                  <button disabled={busyId === t.id || !provider} onClick={() => completeTask(t)} className="cy-btn cy-btn-primary !min-h-0 whitespace-nowrap !py-1.5 !px-3 text-xs disabled:opacity-40">
                    {busyId === t.id ? "…" : "Complete"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
