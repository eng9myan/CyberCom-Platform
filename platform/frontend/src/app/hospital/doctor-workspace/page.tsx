"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Stethoscope, ClipboardCheck, FlaskConical, FileText, Users, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ClinicalTask {
  id: string;
  status: string;
  priority: string;
  title: string;
  task_type: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

const DEEP_LINKS = [
  { href: "/provider-portal/patients", label: "My Patients", icon: Users, description: "Patient assignments and census" },
  { href: "/provider-portal/tasks", label: "Clinical Tasks", icon: ClipboardCheck, description: "Open tasks, escalations, follow-ups" },
  { href: "/provider-portal/orders", label: "Orders", icon: FileText, description: "Active clinical orders" },
  { href: "/provider-portal/results", label: "Results", icon: FlaskConical, description: "Lab and imaging results review" },
  { href: "/provider-portal/notes", label: "Clinical Notes", icon: FileText, description: "SOAP notes with ICD-11 diagnosis coding" },
];

export default function DoctorWorkspace() {
  const { session, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<ClinicalTask[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const page = await apiFetch<Paginated<ClinicalTask>>("/api/v1/provider-portal/tasks/tasks/", {
        token: session.accessToken,
        tenantId: session.tenantId,
      });
      setTasks(page.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load clinical tasks."));
    }
  }, [session]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold">Sign in required</h1>
      </div>
    );
  }

  const openTasks = (tasks || []).filter(t => !["completed", "cancelled"].includes(t.status));
  const urgentTasks = openTasks.filter(t => ["urgent", "stat", "critical"].includes(t.priority));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Stethoscope size={24} /> Doctor Workspace</h1>
        <p className="mt-1 text-sm text-white/50">Tenant-wide clinical task status, with quick access into the full provider portal</p>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Unable to load task summary: {fetchError}
        </div>
      )}

      {!fetchError && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Open Tasks", value: tasks === null ? "..." : openTasks.length, color: "#3b82f6" },
            { label: "Urgent / STAT / Critical", value: tasks === null ? "..." : urgentTasks.length, color: "#ef4444" },
            { label: "Total Tasks", value: tasks === null ? "..." : tasks.length, color: "#22D3EE" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-white/10 bg-surface-raised p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="mt-1 text-sm text-white/50">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Full Provider Portal</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DEEP_LINKS.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-raised p-5 transition-colors hover:border-brand-400/50 hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-white/50">{description}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-white/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}
