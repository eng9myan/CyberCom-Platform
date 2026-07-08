"use client";

import { useState, useEffect, useCallback } from "react";
import { FlaskConical } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ResearchProtocol {
  id: string;
  title: string;
  protocol_number: string;
  irb_status: string;
  phase: string;
  is_actively_enrolling: boolean;
}
interface StudyEnrollment {
  id: string;
  protocol: string;
  protocol_title: string;
  patient_id: string;
  status: string;
  consent_obtained: boolean;
  consent_date: string | null;
}
interface Paginated<T> { count: number; results: T[]; }

export default function ResearchPage() {
  const { session, isAuthenticated } = useAuth();
  const [protocols, setProtocols] = useState<ResearchProtocol[] | null>(null);
  const [enrollments, setEnrollments] = useState<StudyEnrollment[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ protocol: "", patient_id: "", consent_obtained: false });

  const load = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [protoPage, enrollPage] = await Promise.all([
        apiFetch<Paginated<ResearchProtocol>>("/api/v1/hospital/research/protocols/", opts),
        apiFetch<Paginated<StudyEnrollment>>("/api/v1/hospital/research/enrollments/", opts),
      ]);
      setProtocols(protoPage.results);
      setEnrollments(enrollPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load research data."));
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function enroll() {
    // Frontend-side gate matches the real backend rule (StudyEnrollment.
    // clean(): status can never be "enrolled" without consent_obtained) --
    // this is a UX convenience, the backend enforces it regardless.
    if (!session || !form.protocol || !form.patient_id || !form.consent_obtained) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/research/enrollments/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({
          protocol: form.protocol, patient_id: form.patient_id, status: "enrolled",
          consent_obtained: true, consent_date: new Date().toISOString().slice(0, 10),
        }),
      });
      setForm({ protocol: "", patient_id: "", consent_obtained: false });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to enroll subject."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load research data</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (protocols === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><FlaskConical size={22} /> Research</h1>
          <p className="mt-1 text-sm text-ink/50">{protocols.length} protocol(s), {enrollments.length} enrollment(s)</p>
        </div>
      </header>

      <div className="mb-6 overflow-hidden rounded-xl border border-ink/10 bg-surface-raised">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">IRB Protocols</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {["Protocol #", "Title", "Phase", "IRB Status", "Enrolling?"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-ink/50">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {protocols.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/50">No protocols on record.</td></tr>}
              {protocols.map(p => (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-mono text-xs">{p.protocol_number}</td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-ink/60 capitalize">{p.phase.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-ink/60 capitalize">{p.irb_status}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${p.is_actively_enrolling ? "text-emerald-400" : "text-ink/40"}`}>
                      {p.is_actively_enrolling ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-surface-raised">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">Enroll a Subject</div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
          <select value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
            <option value="">Select protocol...</option>
            {protocols.filter(p => p.is_actively_enrolling).map(p => <option key={p.id} value={p.id}>{p.protocol_number} — {p.title}</option>)}
          </select>
          <input value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} placeholder="Patient ID (UUID)" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
            <input type="checkbox" checked={form.consent_obtained} onChange={e => setForm(f => ({ ...f, consent_obtained: e.target.checked }))} />
            Consent documented
          </label>
          <button
            disabled={busy || !form.protocol || !form.patient_id || !form.consent_obtained}
            onClick={() => void enroll()}
            title={!form.consent_obtained ? "Enrollment blocked: Documented patient consent is required." : undefined}
            className="cy-btn cy-btn-primary disabled:opacity-40"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
}
