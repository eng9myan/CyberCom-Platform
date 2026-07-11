"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FlaskConical, ClipboardList, FileSearch, TestTube, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface WorklistItem {
  id: string;
  status: "pending" | "in_progress" | "resulted" | "verified" | "cancelled";
  sequence: number;
}
interface Paginated<T> { count: number; results: T[]; }

const DEEP_LINKS = [
  { href: "/laboratory/worklists", label: "Worklists", icon: ClipboardList, description: "Assigned specimens and pending test items" },
  { href: "/laboratory/results", label: "Result Entry", icon: FlaskConical, description: "Enter and verify analyte results" },
  { href: "/laboratory/specimens", label: "Specimen Tracking", icon: FileSearch, description: "Accessioning and chain-of-custody" },
  { href: "/laboratory/orders", label: "Orders", icon: TestTube, description: "Incoming lab orders awaiting worklist assignment" },
];

export default function LabTechWorkspace() {
  const { session, isAuthenticated } = useAuth();
  const [items, setItems] = useState<WorklistItem[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const page = await apiFetch<Paginated<WorklistItem>>("/api/v1/lab/worklists/worklist-items/", {
        token: session.accessToken, tenantId: session.tenantId,
      });
      setItems(page.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load worklist items."));
    }
  }, [session]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const pendingItems = (items || []).filter(i => i.status === "pending");
  const inProgressItems = (items || []).filter(i => i.status === "in_progress");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><FlaskConical size={24} /> Lab Technician Workspace</h1>
        <p className="mt-1 text-sm text-white/50">Your worklist status, with quick access into result entry and specimen tools</p>
      </header>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Unable to load worklist summary: {fetchError}
        </div>
      )}

      {!fetchError && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Pending", value: items === null ? "..." : pendingItems.length, color: "#3b82f6" },
            { label: "In Progress", value: items === null ? "..." : inProgressItems.length, color: "#f59e0b" },
            { label: "Total Worklist Items", value: items === null ? "..." : items.length, color: "#22D3EE" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-white/10 bg-surface-raised p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="mt-1 text-sm text-white/50">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Laboratory Tools</h2>
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
