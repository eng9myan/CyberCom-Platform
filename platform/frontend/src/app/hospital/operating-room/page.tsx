"use client";
import { useState, useEffect, useCallback } from "react";
import { Scissors } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type CaseStatus = "scheduled" | "pre_op" | "intra_op" | "post_op" | "completed" | "cancelled";

interface SurgicalCase {
  id: string;
  patient: string;
  surgeon_id: string;
  procedure_code: string;
  scheduled_start: string;
  scheduled_end: string;
  status: CaseStatus;
}
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Provider { id: string; first_name: string; last_name: string; }
interface SurgicalTeam { id: string; surgical_case: string; member_id: string; role: string; }
interface Paginated<T> { count: number; results: T[]; }

const STATUS_COLOR: Record<string, string> = { scheduled: "#22D3EE", pre_op: "#a78bfa", intra_op: "#22c55e", post_op: "#f59e0b", completed: "#6b7280", cancelled: "#ef4444" };

export default function ORPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [cases, setCases] = useState<SurgicalCase[] | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [teams, setTeams] = useState<SurgicalTeam[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [casePage, patientPage, providerPage, teamPage] = await Promise.all([
        apiFetch<Paginated<SurgicalCase>>("/api/v1/hospital/or/cases/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
        apiFetch<Paginated<Provider>>("/api/v1/providers/", opts),
        apiFetch<Paginated<SurgicalTeam>>("/api/v1/hospital/or/teams/", opts),
      ]);
      setCases(casePage.results);
      setPatients(patientPage.results);
      setProviders(providerPage.results);
      setTeams(teamPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load OR schedule."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load OR schedule</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (cases === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live OR schedule...</div>;
  }

  const patientName = (id: string) => {
    const p = patients.find(x => x.id === id);
    return p ? `${p.first_name} ${p.last_name} (${p.mrn})` : "Unknown patient";
  };
  const providerName = (id: string) => {
    const p = providers.find(x => x.id === id);
    return p ? `Dr. ${p.first_name} ${p.last_name}` : "—";
  };
  const anesthesiologistFor = (caseId: string) => {
    const member = teams.find(t => t.surgical_case === caseId && t.role === "anesthesiologist");
    return member ? providerName(member.member_id) : "—";
  };

  const sorted = cases.slice().sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Scissors size={22} /> {isAr ? "جدول غرف العمليات" : "Operating Room Schedule"}</h1>
          <p className="mt-1 text-sm text-white/50">{cases.length} {isAr ? "حالة" : "cases"}</p>
        </div>
        <button onClick={() => setLang(isAr ? "en" : "ar")} className="rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium hover:bg-white/5">
          {isAr ? "English" : "العربية"}
        </button>
      </header>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {[isAr ? "المريض" : "Patient", isAr ? "الإجراء" : "Procedure Code", isAr ? "الجراح" : "Surgeon", isAr ? "المخدر" : "Anesthesiologist", isAr ? "البداية" : "Start", isAr ? "النهاية" : "End", isAr ? "الحالة" : "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-white/50">No surgical cases scheduled for this tenant yet.</td></tr>
              )}
              {sorted.map(c => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{patientName(c.patient)}</td>
                  <td className="px-4 py-3 font-mono text-brand-300">{c.procedure_code}</td>
                  <td className="px-4 py-3 text-white/60">{providerName(c.surgeon_id)}</td>
                  <td className="px-4 py-3 text-white/60">{anesthesiologistFor(c.id)}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(c.scheduled_start).toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(c.scheduled_end).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status] }}>
                      {c.status.replace("_", " ")}
                    </span>
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
